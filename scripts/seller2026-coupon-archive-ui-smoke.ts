import { createRequire } from "node:module";
import { chromium, type Browser, type Page } from "playwright";
import { Coupon, sequelize, User } from "../server/src/models/index.js";
import { buildAuthSessionClaims } from "../server/src/services/authSession.service.js";
import { buildSeller2026CouponPayload } from "../client/src/api/seller2026/coupons.mutations.ts";
import { ensureSeller2026AuthSmokeFixture } from "./seller2026-auth-fixture-live-smoke.ts";

const requireFromServer = createRequire(new URL("../server/package.json", import.meta.url));
const jwt = requireFromServer("jsonwebtoken") as typeof import("jsonwebtoken");

const CLIENT_URL = String(
  process.env.SELLER2026_CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173"
).replace(/\/+$/, "");
const API_URL = String(
  process.env.SELLER2026_API_BASE_URL ||
    process.env.API_URL ||
    process.env.VITE_SERVER_ORIGIN ||
    "http://localhost:3001"
).replace(/\/+$/, "");

async function waitForOk(url: string, label: string) {
  const deadline = Date.now() + 45_000;
  let lastError = "";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
      lastError = `${response.status} ${response.statusText}`;
    } catch (error) {
      lastError = (error as Error).message;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`${label} is not reachable at ${url}: ${lastError}`);
}

async function buildToken(userId: number) {
  const user = await User.findByPk(userId);
  if (!user) throw new Error(`User ${userId} was not found.`);
  const claims = await buildAuthSessionClaims(user);
  return jwt.sign(claims, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  } as jwt.SignOptions);
}

async function api(token: string, path: string, init: RequestInit = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok || body?.success === false) {
    throw new Error(`${init.method || "GET"} ${path} failed: ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

async function newAuthedPage(browser: Browser, token: string) {
  const context = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1050 } });
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
  const page = await context.newPage();
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
      )
      .replace(
        /isEnabled\(import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ENABLED\)/g,
        enabled ? "true" : "false"
      )
      .replace(
        /isEnabled\(import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED\)/g,
        enabled ? "true" : "false"
      )
      .replace(
        /isSellerWorkspace2026Enabled\(\) && isEnabled\(import\.meta\.env\[envKey\]\)/g,
        enabled
          ? 'isSellerWorkspace2026Enabled() && (envKey === "VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED" ? true : isEnabled(import.meta.env[envKey]))'
          : "false"
      );
    await route.fulfill({ response, body: mockedBody });
  });
}

async function bodySnippet(page: Page) {
  return (await page.locator("body").innerText({ timeout: 10_000 }).catch(() => ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function fatalMessages(messages: string[]) {
  return messages.filter((message) => {
    const normalized = message.toLowerCase();
    return (
      !normalized.includes("favicon") &&
      !normalized.includes("failed to load resource: the server responded with a status of 404")
    );
  });
}

async function findCouponRow(page: Page, code: string) {
  await page.getByLabel("Search coupons").fill(code);
  await page.waitForLoadState("networkidle", { timeout: 45_000 });
  const row = page.locator("tr", { hasText: code }).first();
  await row.waitFor({ state: "visible", timeout: 20_000 });
  return row;
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const ownerToken = await buildToken(fixture.ownerId);
  const memberToken = await buildToken(fixture.memberId);
  const code = `S26-ARCHIVE-UI-${Date.now()}`;
  const route = `/api/seller/stores/${fixture.storeId}/coupons`;
  const createPayload = buildSeller2026CouponPayload({
    code,
    name: `${code} Campaign`,
    discountType: "percent",
    amount: 9,
    minSpend: 0,
    active: true,
  });
  const created = await api(ownerToken, route, {
    method: "POST",
    body: JSON.stringify(createPayload),
  });
  const couponId = Number(created?.data?.id || 0);
  if (!couponId) throw new Error("Disposable archive UI coupon was not created.");

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const mutationRequests: string[] = [];
  const results: Record<string, unknown> = {};

  try {
    const owner = await newAuthedPage(browser, ownerToken);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["DELETE", "PATCH", "POST", "PUT"].includes(method) && /\/api\/seller\/stores\/[^/]+\/coupons/i.test(request.url())) {
        mutationRequests.push(`${method} ${request.url()}`);
      }
    });
    await setCouponsFlag(owner.page, true);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/coupons`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.locator("[data-seller2026-live-coupons='true']").waitFor({ timeout: 20_000 });
    const ownerText = await bodySnippet(owner.page);
    if (ownerText.length < 40) throw new Error("Owner coupons page rendered blank.");
    let row = await findCouponRow(owner.page, code);
    const archiveButton = row.getByRole("button", { name: "Archive" });
    if ((await archiveButton.count()) === 0 || (await archiveButton.first().isDisabled())) {
      throw new Error("Owner Archive action is missing or disabled.");
    }
    const duplicateButton = row.getByRole("button", { name: "Duplicate" });
    if ((await duplicateButton.count()) > 0 && !(await duplicateButton.first().isDisabled())) {
      throw new Error("Duplicate coupon action is unexpectedly enabled.");
    }
    if ((await owner.page.getByRole("button", { name: /Hard Delete/i }).count()) > 0) {
      throw new Error("Hard Delete action is exposed.");
    }

    await archiveButton.click();
    const modal = owner.page.getByRole("dialog", { name: "Archive coupon?" });
    await modal.waitFor({ state: "visible", timeout: 10_000 });
    await owner.page.getByText("This will make the coupon unavailable for future checkout use. Existing order history will not be changed.").waitFor({ timeout: 10_000 });
    await modal.getByRole("button", { name: "Cancel" }).click();
    await modal.waitFor({ state: "hidden", timeout: 10_000 });
    row = await findCouponRow(owner.page, code);
    if ((await row.count()) === 0) throw new Error("Cancel removed the coupon row.");
    const afterCancel = await Coupon.findByPk(couponId);
    if (!afterCancel || Boolean((afterCancel as any).active) !== true) {
      throw new Error("Cancel changed coupon active state.");
    }

    await row.getByRole("button", { name: "Archive" }).click();
    await owner.page.getByRole("dialog", { name: "Archive coupon?" }).waitFor({ state: "visible", timeout: 10_000 });
    await owner.page.getByRole("button", { name: "Archive Coupon" }).click();
    await owner.page.getByText("Coupon archived.").waitFor({ timeout: 20_000 });
    row = await findCouponRow(owner.page, code);
    const archivedText = await row.innerText();
    const stored = await Coupon.findByPk(couponId);
    if (!stored) throw new Error("Archive hard-deleted the disposable coupon.");
    if (Boolean((stored as any).active) !== false || !/inactive|Activate/i.test(archivedText)) {
      throw new Error("Archive did not soft-deactivate the coupon.");
    }
    results.owner = {
      status: "PASS",
      finalUrl: new URL(owner.page.url()).pathname,
      snippet: ownerText,
    };
    await owner.context.close();

    const member = await newAuthedPage(browser, memberToken);
    await setCouponsFlag(member.page, true);
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/coupons`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const memberText = await bodySnippet(member.page);
    if (memberText.length < 40) throw new Error("Member route rendered blank.");
    const memberArchiveButtons = await member.page.getByRole("button", { name: "Archive" }).all();
    const enabledMemberArchive = [];
    for (const button of memberArchiveButtons) {
      if (!(await button.isDisabled())) enabledMemberArchive.push(button);
    }
    if (enabledMemberArchive.length > 0) {
      throw new Error("Member without coupon status permission has enabled Archive action.");
    }
    results.member = {
      status: "PASS",
      archiveButtons: memberArchiveButtons.length,
      snippet: memberText,
    };
    await member.context.close();

    const platformCoupon = await Coupon.findOne({ where: { scopeType: "PLATFORM" } as any });
    results.platformCoupon = platformCoupon
      ? {
          status: "SKIPPED_PLATFORM_COUPON_NOT_EXPOSED_TO_SELLER_LIST",
          note: "Seller coupon API lists store-scoped coupons only, so no platform row is available for Seller UI action testing.",
        }
      : {
          status: "SKIPPED_PLATFORM_COUPON_FIXTURE_NOT_AVAILABLE",
        };
  } finally {
    await browser.close();
  }

  const fatalConsoleErrors = fatalMessages(consoleErrors);
  const deleteMutations = mutationRequests.filter((entry) => entry.startsWith("DELETE "));
  const output = {
    status:
      fatalConsoleErrors.length || pageErrors.length || deleteMutations.length !== 1
        ? "COUPON_ARCHIVE_UI_PERMISSION_SMOKE_FAIL"
        : "COUPON_ARCHIVE_UI_PERMISSION_SMOKE_PASS",
    env: { clientUrl: CLIENT_URL, apiUrl: API_URL },
    fixture: {
      storeId: fixture.storeId,
      storeSlug: fixture.storeSlug,
      memberId: fixture.memberId,
    },
    coupon: { code, couponId },
    results,
    mutationRequests,
    consoleErrors,
    pageErrors,
  };
  console.log(JSON.stringify(output, null, 2));
  if (output.status !== "COUPON_ARCHIVE_UI_PERMISSION_SMOKE_PASS") process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch(() => undefined);
  });
