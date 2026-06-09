import { createRequire } from "node:module";
import { chromium, type Browser, type Page } from "playwright";
import { Order, Payment, Product, sequelize, Suborder, User } from "../server/src/models/index.js";
import { buildAuthSessionClaims } from "../server/src/services/authSession.service.js";
import { ensureSeller2026AuthSmokeFixture } from "./seller2026-auth-fixture-live-smoke.ts";

const requireFromServer = createRequire(new URL("../server/package.json", import.meta.url));
const jwt = requireFromServer("jsonwebtoken") as typeof import("jsonwebtoken");

const CLIENT_URL = String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
const API_URL = String(process.env.API_URL || "http://localhost:3001").replace(/\/+$/, "");

async function waitForOk(url: string, label: string) {
  const deadline = Date.now() + 45_000;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return true;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = (error as Error).message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} is not reachable at ${url}: ${lastError}`);
}

async function newAuthedPage(browser: Browser, email: string) {
  const context = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();
  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "name", "role", "avatarUrl", "phoneNumber", "status", "password"],
  });
  if (!user) throw new Error(`Fixture user not found: ${email}`);
  const claims = await buildAuthSessionClaims(user);
  const token = jwt.sign(claims, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  } as jwt.SignOptions);
  const cookieUrl = new URL(CLIENT_URL);
  await context.addCookies([
    {
      name: process.env.AUTH_COOKIE_NAME || "token",
      value: token,
      domain: cookieUrl.hostname,
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
      expires: Math.floor(Date.now() / 1000) + 60 * 60,
    },
  ]);
  return { context, page };
}

async function setOrdersFlag(page: Page, enabled: boolean) {
  await page.route("**/sellerWorkspace2026Flags.js*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const mockedBody = body
      .replace(
        /enabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ENABLED === 'true'/,
        `enabled: ${enabled ? "true" : "false"}`
      )
      .replace(
        /ordersEnabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED === 'true'/,
        `ordersEnabled: ${enabled ? "true" : "false"}`
      );
    await route.fulfill({ response, body: mockedBody });
  });
}

const bodySnippet = async (page: Page) =>
  (await page.locator("body").innerText({ timeout: 10_000 }).catch(() => ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

async function assertNoSellerShell(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle", timeout: 45_000 });
  const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  if (/TP PRENEURS SELLER WORKSPACE/i.test(text) && !path.includes("/seller")) {
    throw new Error(`${path} unexpectedly rendered Seller shell.`);
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

function parseJsonPostData(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function resetFulfillmentFixture(suborderId: number) {
  const suborder = await Suborder.findByPk(suborderId);
  if (!suborder) throw new Error(`Fulfillment fixture suborder not found: ${suborderId}`);
  await suborder.update({
    paymentStatus: "PAID",
    fulfillmentStatus: "UNFULFILLED",
    paidAt: new Date(Date.now() - 2_000_000),
  } as any);
  const orderId = Number((suborder as any).orderId || 0);
  if (orderId > 0) {
    await Order.update(
      { paymentStatus: "PAID", status: "paid" } as any,
      { where: { id: orderId } as any }
    );
    await Payment.update(
      { status: "PAID", paidAt: new Date(Date.now() - 2_000_000) } as any,
      { where: { suborderId } as any }
    );
  }
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const fulfillmentSuborderId = Number(fixture.fulfillmentSuborderId || fixture.suborderId || 0);
  if (!fulfillmentSuborderId) throw new Error("No deterministic fulfillment suborder fixture available.");
  await resetFulfillmentFixture(fulfillmentSuborderId);

  const fixtureProduct = await Product.findOne({ where: { storeId: fixture.storeId } as any });
  const fixtureProductId = Number((fixtureProduct as any)?.id || fixture.productId || 0);

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const ownerMutations: Array<{ method: string; url: string; payload: unknown }> = [];
  const blockedMutations: string[] = [];
  const results: Record<string, unknown> = {};

  const forbiddenPayloadFields = [
    "storeId",
    "orderId",
    "paymentStatus",
    "paid",
    "refunded",
    "cancelledByAdmin",
    "ownerId",
    "vendorId",
    "permissions",
    "metadata",
  ];

  try {
    let owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setOrdersFlag(owner.page, false);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/orders`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    if ((await owner.page.locator("[data-seller2026-live-orders='true']").count()) > 0) {
      throw new Error("Seller 2026 Orders rendered when flags were OFF.");
    }
    results.flagsOffList = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/orders/${fixture.suborderId}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    if ((await owner.page.locator("[data-seller2026-live-order-detail='true']").count()) > 0) {
      throw new Error("Seller 2026 Order Detail rendered when flags were OFF.");
    }
    results.flagsOffDetail = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.context.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      const url = request.url();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/suborders/i.test(url)) {
        ownerMutations.push({ method, url, payload: parseJsonPostData(request.postData()) });
      }
    });
    await setOrdersFlag(owner.page, true);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/orders`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.locator("[data-seller2026-live-orders='true']").waitFor({ timeout: 20_000 });
    const listText = await owner.page.locator("body").innerText({ timeout: 10_000 });
    if (!/Orders|Total orders|Payment|Fulfillment/i.test(listText)) {
      throw new Error("Live Orders list did not render expected production content.");
    }
    if (/Delete selected|Bulk|Update payment|Refund|Dispute/i.test(listText)) {
      throw new Error("Unsafe order action appeared on Seller 2026 Orders list.");
    }
    results.flagsOnList = { status: "PASS", snippet: listText.replace(/\s+/g, " ").trim().slice(0, 220) };

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/orders/${fulfillmentSuborderId}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.locator("[data-seller2026-live-order-detail='true']").waitFor({ timeout: 20_000 });
    const detailText = await owner.page.locator("body").innerText({ timeout: 10_000 });
    if (!/Read-only/i.test(detailText) || /Approve payment|Reject payment|Update payment/i.test(detailText)) {
      throw new Error("Payment boundary is not read-only on Order Detail.");
    }
    results.ownerDetail = { status: "PASS", snippet: detailText.replace(/\s+/g, " ").trim().slice(0, 220) };

    const markPacked = owner.page.getByRole("button", { name: /Mark as Packed|Mark packed/i }).first();
    if ((await markPacked.count()) > 0 && !(await markPacked.isDisabled())) {
      await markPacked.click();
      await owner.page.getByText(/updated|marked as packed/i).first().waitFor({ timeout: 20_000 });
      await owner.page.waitForLoadState("networkidle", { timeout: 45_000 });
      results.fulfillment = { status: "PASS", action: "MARK_PROCESSING", suborderId: fulfillmentSuborderId };
    } else {
      results.fulfillment = { status: "DISABLED_SAFE", reason: "MARK_PROCESSING was not exposed by backend governance for the reset fixture." };
    }

    const forbiddenPayloadHits = ownerMutations.flatMap((entry) => {
      const payload = entry.payload && typeof entry.payload === "object" ? entry.payload as Record<string, unknown> : {};
      return forbiddenPayloadFields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
    });
    const paymentMutations = ownerMutations.filter((entry) => /payment/i.test(entry.url));
    const deleteMutations = ownerMutations.filter((entry) => entry.method === "DELETE" || /bulk-delete/i.test(entry.url));
    if (forbiddenPayloadHits.length) throw new Error(`Forbidden order payload fields were sent: ${forbiddenPayloadHits.join(", ")}`);
    if (paymentMutations.length) throw new Error(`Unexpected payment mutation request sent: ${paymentMutations.map((item) => item.url).join(", ")}`);
    if (deleteMutations.length) throw new Error(`Unexpected delete/bulk request sent: ${deleteMutations.map((item) => item.url).join(", ")}`);
    results.mutationGuard = { status: "PASS", mutations: ownerMutations.length };
    await owner.context.close();

    const member = await newAuthedPage(browser, fixture.memberEmail);
    await setOrdersFlag(member.page, true);
    member.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/suborders/i.test(request.url())) {
        blockedMutations.push(`member ${method} ${request.url()}`);
      }
    });
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/orders`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await member.page.locator("[data-seller2026-live-orders='true']").waitFor({ timeout: 20_000 });
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/orders/${fixture.suborderId}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    results.member = { status: blockedMutations.length === 0 ? "PASS" : "FAIL", snippet: await bodySnippet(member.page) };
    await member.context.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setOrdersFlag(owner.page, true);
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/suborders/i.test(request.url())) {
        blockedMutations.push(`cross-store ${method} ${request.url()}`);
      }
    });
    await owner.page.goto(`/seller/stores/${fixture.otherStoreSlug}/orders`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Access Forbidden|permission/i.test(crossText)) throw new Error("Cross-store Orders list did not render forbidden-safe UI.");
    await owner.page.goto(`/seller/stores/${fixture.otherStoreSlug}/orders/${fixture.suborderId}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossDetailText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Access Forbidden|permission/i.test(crossDetailText)) throw new Error("Cross-store Orders detail did not render forbidden-safe UI.");
    results.crossStore = { status: "PASS", snippet: crossDetailText.replace(/\s+/g, " ").trim().slice(0, 180) };
    await owner.context.close();

    const previewContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 390, height: 900 } });
    const previewPage = await previewContext.newPage();
    await previewPage.goto("/seller-2026/orders", { waitUntil: "networkidle", timeout: 45_000 });
    const previewText = await previewPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Orders|Fulfillment/i.test(previewText)) throw new Error("Preview Orders route did not render.");
    await previewPage.goto(`/seller-2026/orders/${fixture.suborderId}`, { waitUntil: "networkidle", timeout: 45_000 });
    results.preview = { status: "PASS", snippet: previewText.replace(/\s+/g, " ").trim().slice(0, 180) };
    await previewContext.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setOrdersFlag(owner.page, true);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/coupons`, { waitUntil: "networkidle", timeout: 45_000 });
    results.couponsRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes/${fixture.attributeId}/values`, { waitUntil: "networkidle", timeout: 45_000 });
    results.attributeValuesRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes`, { waitUntil: "networkidle", timeout: 45_000 });
    results.attributesRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/categories`, { waitUntil: "networkidle", timeout: 45_000 });
    results.categoriesRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/new`, { waitUntil: "networkidle", timeout: 45_000 });
    results.authoringRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    if (fixtureProductId > 0) {
      await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/${fixtureProductId}`, { waitUntil: "networkidle", timeout: 45_000 });
      results.productDetailRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    }
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products`, { waitUntil: "networkidle", timeout: 45_000 });
    results.catalogRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/dashboard`, { waitUntil: "networkidle", timeout: 45_000 });
    results.dashboardRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/notifications`, { waitUntil: "networkidle", timeout: 45_000 });
    results.notificationsRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    results.adminRegression = { status: "PASS", snippet: await assertNoSellerShell(owner.page, "/admin/dashboard") };
    results.clientRegression = {
      status: "PASS",
      home: await assertNoSellerShell(owner.page, "/"),
      store: await assertNoSellerShell(owner.page, "/store/demo-store"),
      checkout: await assertNoSellerShell(owner.page, "/checkout"),
    };
    await owner.context.close();
  } finally {
    await browser.close();
  }

  const fatalConsoleErrors = consoleErrors.filter(
    (value) => !value.includes("403") && !value.toLowerCase().includes("favicon")
  );
  const fulfillmentMutations = ownerMutations.filter((entry) => /\/fulfillment/i.test(entry.url));
  const output = {
    checkedAt: new Date().toISOString(),
    env: { clientUrl: CLIENT_URL, apiUrl: API_URL },
    fixture: {
      ownerEmail: fixture.ownerEmail,
      memberEmail: fixture.memberEmail,
      storeSlug: fixture.storeSlug,
      otherStoreSlug: fixture.otherStoreSlug,
      storeId: fixture.storeId,
      suborderId: fixture.suborderId,
      fulfillmentSuborderId,
    },
    summary: {
      status:
        fatalConsoleErrors.length ||
        pageErrors.length ||
        blockedMutations.length ||
        ownerMutations.some((entry) => entry.method === "DELETE" || /bulk-delete|payment/i.test(entry.url)) ||
        fulfillmentMutations.length > 1
          ? "FAIL"
          : "PASS",
      fatalConsoleErrors: fatalConsoleErrors.length,
      pageErrors: pageErrors.length,
      blockedMutations: blockedMutations.length,
      fulfillmentMutations: fulfillmentMutations.length,
      ownerMutations: ownerMutations.length,
    },
    consoleErrors,
    pageErrors,
    ownerMutations,
    blockedMutations,
    results,
  };

  console.log(JSON.stringify(output, null, 2));
  if (output.summary.status !== "PASS") process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch(() => undefined);
  });
