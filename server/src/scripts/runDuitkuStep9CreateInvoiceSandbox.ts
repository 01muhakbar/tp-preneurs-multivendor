import "dotenv/config";
import { DuitkuClient } from "../services/duitku/duitkuClient.service.js";
import { resolveDuitkuConfig } from "../services/duitku/duitkuConfig.service.js";

const trim = (value: unknown) => String(value ?? "").trim();

const assertSandboxRuntime = () => {
  const config = resolveDuitkuConfig();
  if (!config.enabled) {
    throw new Error("Duitku sandbox runner requires DUITKU_ENABLED=true.");
  }
  if (config.environment !== "sandbox") {
    throw new Error("Duitku sandbox runner refuses non-sandbox DUITKU_ENV.");
  }
  if (trim(process.env.NODE_ENV || "development") === "production") {
    throw new Error("Duitku sandbox runner refuses NODE_ENV=production.");
  }
  return config;
};

const buildMerchantOrderId = () => {
  const suffix = new Date().toISOString().replace(/\D/g, "").slice(0, 14);
  return `TPSTEP9${suffix}`;
};

const amount = Number(process.env.DUITKU_STEP9_AMOUNT || 10000);
if (!Number.isSafeInteger(amount) || amount <= 0) {
  throw new Error("DUITKU_STEP9_AMOUNT must be a positive integer when provided.");
}

const config = assertSandboxRuntime();
const merchantOrderId = buildMerchantOrderId();
const client = new DuitkuClient({ config });

console.log("[duitku-step9-create-invoice] RUN Create Invoice sandbox scenario");
console.log(`[duitku-step9-create-invoice] merchantOrderId=${merchantOrderId}`);
console.log(`[duitku-step9-create-invoice] amount=${amount}`);
console.log(`[duitku-step9-create-invoice] callbackUrl=${config.callbackUrl}`);
console.log(`[duitku-step9-create-invoice] returnUrl=${config.returnUrl}`);

const response = await client.createInvoice({
  paymentAmount: amount,
  merchantOrderId,
  productDetails: "TP Preneurs Step 9 Sandbox Test",
  email: "step9-sandbox@example.test",
  phoneNumber: "081234567890",
  customerVaName: "Step9 Sandbox",
  expiryPeriod: 30,
  itemDetails: [
    {
      name: "Step 9 Sandbox Item",
      price: amount,
      quantity: 1,
    },
  ],
});

console.log(`[duitku-step9-create-invoice] ok=${response.ok}`);
console.log(`[duitku-step9-create-invoice] statusCode=${response.statusCode || "-"}`);
console.log(`[duitku-step9-create-invoice] statusMessage=${response.statusMessage || "-"}`);
console.log(`[duitku-step9-create-invoice] reference=${response.reference || "-"}`);
console.log(`[duitku-step9-create-invoice] paymentUrl=${response.paymentUrl || "-"}`);

if (!response.ok || !response.paymentUrl) {
  throw new Error("Create Invoice sandbox scenario did not return a successful paymentUrl.");
}

console.log("[duitku-step9-create-invoice] PASS Create Invoice success with payment URL");
