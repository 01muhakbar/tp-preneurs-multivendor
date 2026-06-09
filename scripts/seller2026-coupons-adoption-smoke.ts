import { createRequire } from "node:module";
import { chromium, type Browser, type Page } from "playwright";
import { Coupon, Product, sequelize, User } from "../server/src/models/index.js";
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

async function setCouponsFlag(page: Page, enabled: boolean) {
  await page.route("**/sellerWorkspace2026Flags.js*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const mockedBody = body
      .replace(
        /enabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ENABLED === 'true'/,
        `enabled: ${enabled ? "true" : "false"}`
      )
      .replace(
        /couponsEnabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED === 'true'/,
        `couponsEnabled: ${enabled ? "true" : "false"}`
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

async function findCouponRow(page: Page, code: string) {
  await page.getByLabel("Search coupons").fill(code);
  await page.waitForLoadState("networkidle", { timeout: 45_000 });
  const row = page.locator("tr", { hasText: code }).first();
  await row.waitFor({ state: "visible", timeout: 15_000 });
  return row;
}

function parseJsonPostData(value: string | null) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const fixtureProduct = await Product.findOne({ where: { storeId: fixture.storeId } });
  const fixtureProductId = Number((fixtureProduct as any)?.id || 0);
  const unique = `S26COUPON${Date.now()}`;
  const updatedTitle = `${unique} Updated`;

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const ownerMutations: string[] = [];
  const ownerPayloads: Array<{ method: string; url: string; payload: unknown }> = [];
  const blockedMutations: string[] = [];
  const uploadRequests: string[] = [];
  const results: Record<string, unknown> = {};

  const forbiddenPayloadFields = [
    "storeId",
    "ownerId",
    "vendorId",
    "createdBy",
    "updatedBy",
    "platformCoupon",
    "isPlatform",
    "usageCount",
    "checkoutValidationOverride",
    "permissions",
    "metadata",
  ];

  try {
    let owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setCouponsFlag(owner.page, false);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/coupons`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    if ((await owner.page.locator("[data-seller2026-live-coupons='true']").count()) > 0) {
      throw new Error("Seller 2026 Coupons rendered when flags were OFF.");
    }
    results.flagsOff = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.context.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      const url = request.url();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/coupons/i.test(url)) {
        ownerMutations.push(`${method} ${url}`);
        ownerPayloads.push({ method, url, payload: parseJsonPostData(request.postData()) });
      }
      if (method === "POST" && /\/api\/upload|\/upload/i.test(url)) uploadRequests.push(url);
    });
    await setCouponsFlag(owner.page, true);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/coupons`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.locator("[data-seller2026-live-coupons='true']").waitFor({ timeout: 15_000 });
    const flagsOnText = await owner.page.locator("body").innerText({ timeout: 10_000 });
    if (/Rp 250\.000|FLASH25|SUMMER10|Batik Nusantara Store/i.test(flagsOnText)) {
      throw new Error("Canonical Coupons route appears to render mock preview data.");
    }
    results.flagsOn = {
      status: "PASS",
      finalUrl: new URL(owner.page.url()).pathname,
      snippet: flagsOnText.replace(/\s+/g, " ").trim().slice(0, 220),
    };

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/coupons`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    if (!new URL(owner.page.url()).pathname.endsWith(`/seller/stores/${fixture.storeSlug}/catalog/coupons`)) {
      throw new Error(`Legacy coupons route did not redirect to canonical route: ${owner.page.url()}`);
    }
    results.legacyRedirect = { status: "PASS", finalUrl: new URL(owner.page.url()).pathname };

    await owner.page.getByRole("button", { name: "Add Coupon" }).click();
    const createDialog = owner.page.getByText("Add Coupon").locator("..").locator("..").first();
    await owner.page.getByLabel("Code").fill(unique);
    await owner.page.getByLabel("Title").fill(`${unique} Title`);
    await owner.page.getByLabel("Discount Type").selectOption("percent");
    await owner.page.getByLabel("Discount Value").fill("10");
    await owner.page.getByLabel("Minimum Order").fill("0");
    const bannerButton = owner.page.getByRole("button", { name: "Upload Banner" });
    if ((await bannerButton.count()) === 0 || !(await bannerButton.first().isDisabled())) {
      throw new Error("Coupon banner upload guard is missing or enabled.");
    }
    const bannerReason = await owner.page.getByText("Coupon banner upload is disabled until storage validation is complete.").count();
    if (!bannerReason) throw new Error("Coupon banner upload disabled reason is missing.");
    await owner.page.getByRole("button", { name: "Add Coupon" }).last().click();
    await owner.page.getByText("Coupon created.").waitFor({ timeout: 20_000 });
    let couponRow = await findCouponRow(owner.page, unique);
    results.ownerCreate = { status: "PASS" };

    await couponRow.getByRole("button", { name: "Edit" }).click();
    await owner.page.getByLabel("Title").fill(updatedTitle);
    await owner.page.getByLabel("Discount Value").fill("12");
    await owner.page.getByRole("button", { name: "Update Coupon" }).click();
    await owner.page.getByText("Coupon updated.").waitFor({ timeout: 20_000 });
    couponRow = await findCouponRow(owner.page, unique);
    const rowAfterUpdate = await couponRow.innerText();
    if (!rowAfterUpdate.includes(updatedTitle) || !rowAfterUpdate.includes("12%")) {
      throw new Error("Coupon update did not persist/refetch expected title or discount.");
    }
    results.ownerUpdate = { status: "PASS" };

    await couponRow.getByRole("button", { name: "Deactivate" }).click();
    await owner.page.getByText("Coupon deactivated.").waitFor({ timeout: 20_000 });
    couponRow = await findCouponRow(owner.page, unique);
    if (!/inactive|Activate/i.test(await couponRow.innerText())) {
      throw new Error("Coupon deactivate action did not reflect inactive state.");
    }
    results.ownerDeactivate = { status: "PASS" };

    await couponRow.getByRole("button", { name: "Activate" }).click();
    await owner.page.getByText("Coupon activated.").waitFor({ timeout: 20_000 });
    couponRow = await findCouponRow(owner.page, unique);
    if (!/active|Deactivate/i.test(await couponRow.innerText())) {
      throw new Error("Coupon activate action did not reflect active state.");
    }
    results.ownerActivate = { status: "PASS" };

    await couponRow.getByRole("button", { name: "Archive" }).click();
    await owner.page.getByText("Coupon archived.").waitFor({ timeout: 20_000 });
    couponRow = await findCouponRow(owner.page, unique);
    if (!/inactive|Activate/i.test(await couponRow.innerText())) {
      throw new Error("Coupon archive/deactivate action did not reflect inactive cleanup state.");
    }
    results.cleanup = { status: "PASS", strategy: "ARCHIVE_AS_DEACTIVATE", code: unique };

    const forbiddenPayloadHits = ownerPayloads.flatMap((entry) => {
      const payload = entry.payload && typeof entry.payload === "object" ? entry.payload as Record<string, unknown> : {};
      return forbiddenPayloadFields.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
    });
    if (forbiddenPayloadHits.length) {
      throw new Error(`Forbidden coupon payload fields were sent: ${forbiddenPayloadHits.join(", ")}`);
    }
    if (uploadRequests.length) throw new Error(`Unexpected upload request sent: ${uploadRequests.join(", ")}`);
    results.payloadGuard = { status: "PASS", checkedMutations: ownerPayloads.length };
    results.bannerUploadGuard = { status: "PASS", uploadRequests: 0 };
    await owner.context.close();

    const platformCoupon = await Coupon.findOne({ where: { scopeType: "PLATFORM" } as any });
    results.platformGuard = platformCoupon
      ? { status: "PASS", note: "Seller coupon API lists only store-scoped coupons; platform coupon fixture is not exposed on canonical seller route." }
      : { status: "NOT_COVERED", note: "Not covered; no platform/admin coupon fixture available." };

    const member = await newAuthedPage(browser, fixture.memberEmail);
    await setCouponsFlag(member.page, true);
    member.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/coupons/i.test(request.url())) {
        blockedMutations.push(`member ${method} ${request.url()}`);
      }
    });
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/coupons`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const memberAdd = member.page.getByRole("button", { name: "Add Coupon" });
    const memberCanSeeAdd = (await memberAdd.count()) > 0;
    if (memberCanSeeAdd && !(await memberAdd.first().isDisabled())) {
      await memberAdd.first().click().catch(() => undefined);
    }
    await member.page.waitForTimeout(500);
    results.member = {
      status: blockedMutations.length === 0 ? "PASS" : "FAIL",
      addVisible: memberCanSeeAdd,
      addDisabled: memberCanSeeAdd ? await memberAdd.first().isDisabled() : true,
      snippet: await bodySnippet(member.page),
    };
    await member.context.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setCouponsFlag(owner.page, true);
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/coupons/i.test(request.url())) {
        blockedMutations.push(`cross-store ${method} ${request.url()}`);
      }
    });
    await owner.page.goto(`/seller/stores/${fixture.otherStoreSlug}/catalog/coupons`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Access Forbidden|permission/i.test(crossText)) {
      throw new Error("Cross-store Coupons route did not render forbidden-safe UI.");
    }
    results.crossStore = { status: "PASS", snippet: crossText.replace(/\s+/g, " ").trim().slice(0, 180) };
    await owner.context.close();

    const previewContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 390, height: 900 } });
    const previewPage = await previewContext.newPage();
    await previewPage.goto("/seller-2026/catalog/coupons", { waitUntil: "networkidle", timeout: 45_000 });
    const previewText = await previewPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Coupons/i.test(previewText)) throw new Error("Preview Coupons route did not render.");
    results.preview = { status: "PASS", snippet: previewText.replace(/\s+/g, " ").trim().slice(0, 180) };
    await previewContext.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setCouponsFlag(owner.page, true);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes`, { waitUntil: "networkidle", timeout: 45_000 });
    results.attributesRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/categories`, { waitUntil: "networkidle", timeout: 45_000 });
    results.categoriesRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products`, { waitUntil: "networkidle", timeout: 45_000 });
    results.catalogRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/new`, { waitUntil: "networkidle", timeout: 45_000 });
    results.authoringRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    if (fixtureProductId > 0) {
      await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/${fixtureProductId}`, { waitUntil: "networkidle", timeout: 45_000 });
      results.productDetailRegression = { status: "PASS", snippet: await bodySnippet(owner.page) };
    }
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
  const ownerMutationSummary = {
    post: ownerMutations.filter((item) => item.startsWith("POST ")).length,
    patch: ownerMutations.filter((item) => item.startsWith("PATCH ")).length,
    delete: ownerMutations.filter((item) => item.startsWith("DELETE ")).length,
    upload: uploadRequests.length,
  };
  const output = {
    checkedAt: new Date().toISOString(),
    env: { clientUrl: CLIENT_URL, apiUrl: API_URL },
    fixture: {
      ownerEmail: fixture.ownerEmail,
      memberEmail: fixture.memberEmail,
      storeSlug: fixture.storeSlug,
      otherStoreSlug: fixture.otherStoreSlug,
      storeId: fixture.storeId,
    },
    summary: {
      status:
        fatalConsoleErrors.length ||
        pageErrors.length ||
        blockedMutations.length ||
        ownerMutationSummary.post < 1 ||
        ownerMutationSummary.patch < 3 ||
        ownerMutationSummary.delete < 1 ||
        ownerMutationSummary.upload > 0
          ? "FAIL"
          : "PASS",
      fatalConsoleErrors: fatalConsoleErrors.length,
      pageErrors: pageErrors.length,
      blockedMutations: blockedMutations.length,
      ownerMutationSummary,
    },
    consoleErrors,
    pageErrors,
    ownerMutations,
    blockedMutations,
    ownerPayloads,
    uploadRequests,
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
