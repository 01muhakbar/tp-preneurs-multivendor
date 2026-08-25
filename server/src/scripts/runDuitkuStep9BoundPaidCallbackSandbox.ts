import "dotenv/config";
import { Op } from "sequelize";
import {
  sequelize,
  User,
  Store,
  Order,
  Suborder,
  Payment,
  OrderCollectionClaim,
  OrderPaymentAttempt,
  DuitkuCallbackInbox,
} from "../models/index.js";
import {
  buildDuitkuCreateInvoiceRequest,
  DuitkuClient,
} from "../services/duitku/duitkuClient.service.js";
import { resolveDuitkuConfig } from "../services/duitku/duitkuConfig.service.js";
import { persistDuitkuCreateInvoiceAttempt } from "../services/duitku/duitkuAttemptPersistence.service.js";

const trim = (value: unknown) => String(value ?? "").trim();
const getAttr = (row: any, key: string) =>
  row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const assertSandboxRuntime = () => {
  const config = resolveDuitkuConfig();
  if (!config.enabled) {
    throw new Error("Duitku bound paid callback sandbox runner requires DUITKU_ENABLED=true.");
  }
  if (config.environment !== "sandbox") {
    throw new Error("Duitku bound paid callback sandbox runner refuses non-sandbox DUITKU_ENV.");
  }
  if (trim(process.env.NODE_ENV || "development") === "production") {
    throw new Error("Duitku bound paid callback sandbox runner refuses NODE_ENV=production.");
  }
  if (!/^https:\/\//i.test(config.callbackUrl)) {
    throw new Error("DUITKU_CALLBACK_URL must be public HTTPS for provider callback evidence.");
  }
  return config;
};

const parseForm = (html: string, baseUrl: string) => {
  const formTag = (html.match(/<form\b[^>]*>/i) || [])[0];
  if (!formTag) return null;
  const action = (formTag.match(/action=['"]([^'"]*)['"]/i) || [null, baseUrl])[1] || baseUrl;
  const method = (formTag.match(/method=['"]([^'"]*)['"]/i) || [null, "GET"])[1] || "GET";
  const fields = new URLSearchParams();
  const inputRe = /<input\b[^>]*>/gi;
  const attrRe = /([a-zA-Z0-9_-]+)=['"]([^'"]*)['"]/g;
  for (const input of html.match(inputRe) || []) {
    const attrs: Record<string, string> = {};
    for (const match of input.matchAll(attrRe)) attrs[match[1].toLowerCase()] = match[2];
    if (!attrs.name) continue;
    const type = (attrs.type || "").toLowerCase();
    if (type === "submit" || type === "button") continue;
    fields.append(attrs.name, attrs.value || "");
  }
  return {
    action: new URL(action, baseUrl).toString(),
    method: method.toUpperCase(),
    fields,
  };
};

const requestFormPage = async (url: string, method = "GET", body?: URLSearchParams) => {
  const response = await fetch(url, {
    method,
    headers: {
      "user-agent": "Mozilla/5.0",
      ...(method === "POST" ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body,
    redirect: "manual",
  });
  const text = await response.text();
  return {
    response,
    text,
    location: response.headers.get("location"),
  };
};

const postCheckoutJson = async (url: string, ticket: string, payload: Record<string, unknown>) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-timestamp": String(Date.now()),
      "x-duitku-ticket": ticket,
      "user-agent": "Mozilla/5.0",
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Duitku checkout POST failed with HTTP ${response.status}: ${text.slice(0, 160)}`);
  }
  return JSON.parse(text) as Record<string, any>;
};

const extractCheckoutTicket = async (paymentUrl: string) => {
  const response = await fetch(paymentUrl, { headers: { "user-agent": "Mozilla/5.0" } });
  const html = await response.text();
  const jsonRaw = (html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/) || [])[1];
  if (!jsonRaw) throw new Error("Could not extract Duitku checkout page data.");
  const nextData = JSON.parse(jsonRaw);
  const ticket = nextData.props?.pageProps?.ticket;
  if (!ticket) throw new Error("Could not extract Duitku checkout ticket.");
  return String(ticket);
};

const completeSandboxCreditCardPayment = async (input: {
  reference: string;
  paymentUrl: string;
}) => {
  const ticket = await extractCheckoutTicket(input.paymentUrl);
  const ccResponse = await postCheckoutJson(
    `https://app-sandbox.duitku.com/api/process/cc/${input.reference}`,
    ticket,
    {
      name: "Step9 Sandbox",
      number: "4000000000000044",
      month: "03",
      year: "33",
      cvv: "123",
      code: "",
      email: "step9-sandbox@example.test",
      phone: "081234567890",
    }
  );

  if (ccResponse.statusCode !== "00" || !ccResponse.paymentUrl) {
    throw new Error("Duitku sandbox credit-card process did not return a 3DS payment URL.");
  }

  let page = await requestFormPage(String(ccResponse.paymentUrl));
  if (page.location) {
    page = await requestFormPage(new URL(page.location, String(ccResponse.paymentUrl)).toString());
  }

  const firstForm = parseForm(page.text, String(ccResponse.paymentUrl));
  if (!firstForm) throw new Error("Missing first 3DS form.");

  page = await requestFormPage(
    firstForm.action,
    firstForm.method === "GET" ? "GET" : "POST",
    firstForm.method === "GET" ? undefined : firstForm.fields
  );

  const otp = (page.text.match(/id=["']CodeOTP["'][^>]*>([^<]+)</i) || [])[1]?.trim();
  const otpForm = parseForm(page.text, page.response.url);
  if (!otp || !otpForm) throw new Error("Missing sandbox OTP form or OTP value.");

  otpForm.fields.set("Password", otp);
  otpForm.fields.set("Btn_Confirm", "Confirm");
  page = await requestFormPage(otpForm.action, "POST", otpForm.fields);

  for (let index = 0; index < 8; index += 1) {
    if (page.location) {
      page = await requestFormPage(new URL(page.location, page.response.url).toString());
      continue;
    }
    const nextForm = parseForm(page.text, page.response.url);
    if (!nextForm) break;
    page = await requestFormPage(
      nextForm.action,
      nextForm.method === "GET" ? "GET" : "POST",
      nextForm.method === "GET" ? undefined : nextForm.fields
    );
  }

  return {
    responseUrl: page.response.url,
    responseCode:
      new URL(page.response.url).searchParams.get("responseCode") ||
      (page.text.match(/responseCode=([0-9]+)/i) || [])[1] ||
      null,
  };
};

const waitForBoundCallback = async (input: {
  merchantOrderId: string;
  timeoutMs: number;
}) => {
  const deadline = Date.now() + input.timeoutMs;
  while (Date.now() < deadline) {
    const inbox = await DuitkuCallbackInbox.findOne({
      where: {
        merchantOrderIdRaw: input.merchantOrderId,
      },
      order: [["createdAt", "DESC"]],
    } as any);
    if (inbox) return inbox;
    await sleep(1500);
  }
  return null;
};

const findExistingSandboxUser = async () => {
  const existing = await User.findOne({
    where: { email: { [Op.like]: "step9-bound-%@example.test" } },
    order: [["id", "ASC"]],
  });
  if (existing) return existing;
  return User.create({
    name: "Step9 Bound Sandbox Buyer",
    email: `step9-bound-${Date.now()}@example.test`,
    password: "not-a-real-password",
    role: "user",
    status: "active",
  } as any);
};

const main = async () => {
  const config = assertSandboxRuntime();
  await sequelize.authenticate();

  const amount = Number(process.env.DUITKU_STEP9_AMOUNT || 10000);
  if (!Number.isSafeInteger(amount) || amount <= 0) {
    throw new Error("DUITKU_STEP9_AMOUNT must be a positive integer when provided.");
  }

  const suffix = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  const merchantOrderId = `TPSTEP9BND${suffix}`;
  const invoiceNo = `STEP9-BND-${suffix}`;

  const buyer = await findExistingSandboxUser();
  const seller = await User.create({
    name: `Step9 Bound Sandbox Seller ${suffix}`,
    email: `step9-bound-seller-${suffix}@example.test`,
    password: "not-a-real-password",
    role: "user",
    status: "active",
  } as any);
  const store = await Store.create({
    ownerUserId: Number(getAttr(seller, "id")),
    name: `Step9 Bound Store ${suffix}`,
    slug: `step9-bound-store-${suffix}`,
    status: "ACTIVE",
  } as any);
  const order = await Order.create({
    invoiceNo,
    userId: Number(getAttr(buyer, "id")),
    checkoutMode: "MULTI_STORE",
    subtotalAmount: amount,
    shippingAmount: 0,
    serviceFeeAmount: 0,
    totalAmount: amount,
    paymentStatus: "UNPAID",
    paymentMethod: "DUITKU",
    status: "pending",
  } as any);
  const suborder = await Suborder.create({
    orderId: Number(getAttr(order, "id")),
    suborderNumber: `${invoiceNo}-SUB`,
    storeId: Number(getAttr(store, "id")),
    subtotalAmount: amount,
    shippingAmount: 0,
    serviceFeeAmount: 0,
    totalAmount: amount,
    paymentMethod: "DUITKU",
    paymentStatus: "UNPAID",
    fulfillmentStatus: "UNFULFILLED",
  } as any);
  const payment = await Payment.create({
    suborderId: Number(getAttr(suborder, "id")),
    storeId: Number(getAttr(store, "id")),
    paymentChannel: "DUITKU",
    paymentType: "DUITKU_POP",
    internalReference: `${invoiceNo}-PAY`,
    allocationKey: `${invoiceNo}-ALLOC`,
    amount,
    status: "CREATED",
  } as any);

  const createInvoiceInput = {
    paymentAmount: amount,
    merchantOrderId,
    productDetails: "TP Preneurs Step 9 Bound Paid Sandbox Test",
    email: "step9-sandbox@example.test",
    phoneNumber: "081234567890",
    customerVaName: "Step9 Sandbox",
    expiryPeriod: 30,
    itemDetails: [
      {
        name: "Step 9 Bound Paid Sandbox Item",
        price: amount,
        quantity: 1,
      },
    ],
  };
  const request = buildDuitkuCreateInvoiceRequest(createInvoiceInput, config);
  const client = new DuitkuClient({ config });
  const response = await client.createInvoice(createInvoiceInput);
  if (!response.ok || !response.reference || !response.paymentUrl) {
    throw new Error("Create Invoice did not return a successful sandbox payment URL.");
  }

  const persisted = await sequelize.transaction(async (transaction) => {
    const result = await persistDuitkuCreateInvoiceAttempt({
      orderId: Number(getAttr(order, "id")),
      createdByUserId: Number(getAttr(buyer, "id")),
      merchantOrderId,
      idempotencyKey: `${invoiceNo}-IDEMPOTENCY`,
      request,
      response,
      transaction,
    });
    const attemptId = Number(getAttr(result.attempt, "id"));
    await payment.update({ paidByOrderPaymentAttemptId: attemptId } as any, { transaction });
    await OrderCollectionClaim.create(
      {
        orderId: Number(getAttr(order, "id")),
        rail: "DUITKU_POP",
        claimState: "CLAIMED",
        claimSource: "DUITKU_CREATE_INVOICE",
        orderPaymentAttemptId: attemptId,
      } as any,
      { transaction }
    );
    return result;
  });

  const attemptId = Number(getAttr(persisted.attempt, "id"));
  const paidFlow = await completeSandboxCreditCardPayment({
    reference: response.reference,
    paymentUrl: response.paymentUrl,
  });
  const inbox = await waitForBoundCallback({ merchantOrderId, timeoutMs: 30000 });
  if (!inbox) {
    throw new Error("Timed out waiting for bound Duitku paid callback in local callback inbox.");
  }

  await order.reload();
  await suborder.reload();
  await payment.reload();
  await persisted.attempt.reload();

  const bindingState = String(getAttr(inbox, "bindingState"));
  const processingResult = String(getAttr(inbox, "processingResult"));
  const resultCodeRaw = String(getAttr(inbox, "resultCodeRaw"));
  const signatureState = String(getAttr(inbox, "signatureState"));
  const paymentAttemptId = Number(getAttr(inbox, "paymentAttemptId"));

  if (paymentAttemptId !== attemptId || bindingState !== "BOUND" || resultCodeRaw !== "00") {
    throw new Error(
      `Bound callback assertion failed: paymentAttemptId=${paymentAttemptId}, attemptId=${attemptId}, bindingState=${bindingState}, resultCodeRaw=${resultCodeRaw}`
    );
  }

  console.log("[duitku-step9-bound-paid] PASS bound paid callback sandbox fixture");
  console.log(`[duitku-step9-bound-paid] orderId=${getAttr(order, "id")}`);
  console.log(`[duitku-step9-bound-paid] paymentAttemptId=${attemptId}`);
  console.log(`[duitku-step9-bound-paid] callbackInboxId=${getAttr(inbox, "id")}`);
  console.log(`[duitku-step9-bound-paid] merchantOrderId=${merchantOrderId}`);
  console.log(`[duitku-step9-bound-paid] reference=${response.reference}`);
  console.log(`[duitku-step9-bound-paid] paidFlowResponseCode=${paidFlow.responseCode || "-"}`);
  console.log(`[duitku-step9-bound-paid] callbackResultCode=${resultCodeRaw}`);
  console.log(`[duitku-step9-bound-paid] signatureState=${signatureState}`);
  console.log(`[duitku-step9-bound-paid] bindingState=${bindingState}`);
  console.log(`[duitku-step9-bound-paid] processingResult=${processingResult}`);
  console.log(`[duitku-step9-bound-paid] attemptStatusAfterCallback=${getAttr(persisted.attempt, "status")}`);
  console.log(`[duitku-step9-bound-paid] orderPaymentStatusAfterCallback=${getAttr(order, "paymentStatus")}`);
  console.log(`[duitku-step9-bound-paid] paymentStatusAfterCallback=${getAttr(payment, "status")}`);
  console.log("[duitku-step9-bound-paid] financialMutationApplied=false");
};

try {
  await main();
} finally {
  await sequelize.close();
}
