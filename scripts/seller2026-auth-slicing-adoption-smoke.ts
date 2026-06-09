import { createRequire } from "node:module";
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { sequelize, User } from "../server/src/models/index.js";
import { buildAuthSessionClaims } from "../server/src/services/authSession.service.js";
import { ensureSeller2026AuthSmokeFixture } from "./seller2026-auth-fixture-live-smoke.ts";

const requireFromServer = createRequire(new URL("../server/package.json", import.meta.url));
const jwt = requireFromServer("jsonwebtoken") as typeof import("jsonwebtoken");

const CLIENT_URL = String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
const CLIENT_URL_FLAGS_ON = String(process.env.CLIENT_URL_FLAGS_ON || "").replace(/\/+$/, "");
const API_URL = String(process.env.API_URL || "http://localhost:3001").replace(/\/+$/, "");
const RUN_MARK_READ = process.env.SELLER2026_SMOKE_MARK_READ !== "false";

type Fixture = Awaited<ReturnType<typeof ensureSeller2026AuthSmokeFixture>>;
type RouteStatus = "PASS" | "SKIPPED" | "AUTH_BLOCKED" | "FORBIDDEN" | "RUNTIME_ERROR" | "REDIRECTED_TO_LOGIN" | "FAIL";

type RouteCase = {
  name: string;
  path: string;
  expectedUrlPart?: string;
  allowAuthBlocked?: boolean;
  allowForbidden?: boolean;
  requireSellerShell?: boolean;
  forbidSellerShell?: boolean;
  expectedText?: RegExp;
  baseUrl?: string;
};

type RouteResult = {
  group: string;
  name: string;
  path: string;
  finalUrl: string;
  httpStatus: number | null;
  status: RouteStatus;
  consoleErrors: string[];
  pageErrors: string[];
  requestFailures: string[];
  assertions: string[];
  snippet: string;
};

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function hasSellerShell(text: string) {
  return /Seller Workspace|Workspace 2026|Growth Command Center|Store Readiness|S26/i.test(text);
}

function classifyPage(text: string, url: string): RouteStatus {
  const lower = text.toLowerCase();
  if (url.includes("/login")) return "REDIRECTED_TO_LOGIN";
  if (lower.includes("seller session required") || lower.includes("please sign in") || lower.includes("sign in")) {
    return "AUTH_BLOCKED";
  }
  if (lower.includes("access forbidden") || lower.includes("permission denied") || lower.includes("not authorized")) {
    return "FORBIDDEN";
  }
  if (
    lower.includes("something went wrong") ||
    lower.includes("failed to load") ||
    lower.includes("vite/client") ||
    lower.includes("internal server error")
  ) {
    return "RUNTIME_ERROR";
  }
  return "PASS";
}

function filterConsoleErrors(values: string[]) {
  return values.filter((value) => {
    const text = value.toLowerCase();
    return !text.includes("favicon") && !text.includes("failed to load resource: the server responded with a status of 404");
  });
}

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

async function loginContext(browser: Browser, baseUrl: string, email: string, password: string) {
  const context = await browser.newContext({ baseURL: baseUrl, viewport: { width: 1440, height: 1050 } });
  const page = await context.newPage();
  const user = await User.findOne({
    where: { email },
    attributes: ["id", "email", "name", "role", "avatarUrl", "phoneNumber", "status", "password"],
  });
  if (!user) {
    throw new Error(`Fixture user not found: ${email}`);
  }
  const claims = await buildAuthSessionClaims(user);
  const token = jwt.sign(claims, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1h",
  } as jwt.SignOptions);
  const cookieUrl = new URL(baseUrl);
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
  const sessionCheck = await page.request.get(`${API_URL}/api/auth/me`).catch(() => null);
  if (sessionCheck && sessionCheck.status() >= 500) {
    throw new Error(`Session check failed for ${email}: ${sessionCheck.status()} ${await sessionCheck.text()}`);
  }
  return { context, page };
}

async function checkRoute(
  page: Page,
  group: string,
  route: RouteCase,
  trackers: { consoleErrors: string[]; pageErrors: string[]; requestFailures: string[] }
): Promise<RouteResult> {
  const consoleStart = trackers.consoleErrors.length;
  const pageErrorStart = trackers.pageErrors.length;
  const requestFailureStart = trackers.requestFailures.length;
  const response = await page.goto(route.path, { waitUntil: "networkidle", timeout: 45_000 }).catch((error) => {
    trackers.pageErrors.push((error as Error).message);
    return null;
  });
  const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const normalized = normalizeText(text);
  const finalUrl = page.url();
  const status = classifyPage(normalized, finalUrl);
  const assertions: string[] = [];
  const localConsoleErrors = filterConsoleErrors(trackers.consoleErrors.slice(consoleStart));
  const localPageErrors = trackers.pageErrors.slice(pageErrorStart);
  const localRequestFailures = trackers.requestFailures.slice(requestFailureStart);
  let finalStatus: RouteStatus = status;

  if (!normalized) {
    finalStatus = "FAIL";
    assertions.push("blank body");
  }
  if (response && response.status() >= 500) {
    finalStatus = "FAIL";
    assertions.push(`HTTP ${response.status()}`);
  }
  if (route.expectedUrlPart && !finalUrl.includes(route.expectedUrlPart)) {
    finalStatus = "FAIL";
    assertions.push(`expected final URL to include ${route.expectedUrlPart}`);
  }
  if (route.requireSellerShell && status === "PASS" && !hasSellerShell(normalized)) {
    finalStatus = "FAIL";
    assertions.push("seller shell not detected");
  }
  if (route.forbidSellerShell && hasSellerShell(normalized)) {
    finalStatus = "FAIL";
    assertions.push("unexpected seller shell detected");
  }
  if (route.expectedText && status === "PASS" && !route.expectedText.test(normalized)) {
    finalStatus = "FAIL";
    assertions.push(`expected text ${route.expectedText}`);
  }
  if (status === "AUTH_BLOCKED" && !route.allowAuthBlocked) {
    finalStatus = "FAIL";
    assertions.push("unexpected auth block");
  }
  if (status === "FORBIDDEN" && !route.allowForbidden) {
    finalStatus = "FAIL";
    assertions.push("unexpected forbidden page");
  }
  if (status === "REDIRECTED_TO_LOGIN" && route.allowAuthBlocked) {
    finalStatus = "PASS";
  } else if (status === "RUNTIME_ERROR" || status === "REDIRECTED_TO_LOGIN") {
    finalStatus = "FAIL";
  }
  const expectedPermissionConsole =
    status === "FORBIDDEN" &&
    route.allowForbidden &&
    localConsoleErrors.every((value) => value.includes("403") || value.toLowerCase().includes("forbidden"));
  if ((localConsoleErrors.length && !expectedPermissionConsole) || localPageErrors.length) {
    finalStatus = "FAIL";
    assertions.push("runtime console/page errors");
  }

  return {
    group,
    name: route.name,
    path: route.path,
    finalUrl: finalUrl.replace(route.baseUrl || CLIENT_URL, ""),
    httpStatus: response?.status() ?? null,
    status: finalStatus,
    consoleErrors: localConsoleErrors,
    pageErrors: localPageErrors,
    requestFailures: localRequestFailures,
    assertions,
    snippet: normalized.slice(0, 220),
  };
}

async function runGroup(page: Page, group: string, routes: RouteCase[], baseUrl = CLIENT_URL) {
  const trackers = { consoleErrors: [] as string[], pageErrors: [] as string[], requestFailures: [] as string[] };
  page.on("console", (msg) => {
    if (msg.type() === "error") trackers.consoleErrors.push(msg.text());
  });
  page.on("pageerror", (error) => trackers.pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    const url = request.url();
    if (url.includes("/api/")) {
      trackers.requestFailures.push(`${request.method()} ${url} ${request.failure()?.errorText || ""}`.trim());
    }
  });

  const results: RouteResult[] = [];
  for (const route of routes) {
    results.push(await checkRoute(page, group, { ...route, baseUrl }, trackers));
  }
  return results;
}

async function markReadSmoke(page: Page, fixture: Fixture) {
  if (!RUN_MARK_READ) return { status: "SKIPPED", reason: "SELLER2026_SMOKE_MARK_READ=false" };
  if (!fixture.notificationId) return { status: "SKIPPED", reason: "fixture notification id missing" };

  const countUrl = `${API_URL}/api/seller/stores/${fixture.storeId}/notifications/unread-count`;
  const readCount = async () => {
    const response = await page.request.get(countUrl);
    const body = await response.json().catch(() => ({}));
    return {
      ok: response.ok(),
      status: response.status(),
      count: Number(body?.data?.count ?? body?.count ?? 0) || 0,
    };
  };

  const before = await readCount();
  const response = await page.request.patch(
    `${API_URL}/api/seller/stores/${fixture.storeId}/notifications/${fixture.notificationId}/read`
  );
  const after = await readCount();
  await page.goto(`/seller/stores/${fixture.storeSlug}/notifications`, { waitUntil: "networkidle", timeout: 45_000 });
  const bodyText = normalizeText(await page.locator("body").innerText({ timeout: 10_000 }).catch(() => ""));
  const pageStatus = classifyPage(bodyText, page.url());

  return {
    status: response.ok() && before.ok && after.ok && pageStatus === "PASS" ? "PASS" : "FAIL",
    responseStatus: response.status(),
    unreadBefore: before.count,
    unreadAfter: after.count,
    pageStatus,
    snippet: bodyText.slice(0, 180),
  };
}

function buildRoutes(fixture: Fixture) {
  const canonical = [
    { name: "dashboard", path: `/seller/stores/${fixture.storeSlug}`, expectedText: /Dashboard|Overview|Readiness|Growth Command Center/i },
    { name: "dashboard-explicit", path: `/seller/stores/${fixture.storeSlug}/dashboard`, expectedText: /Dashboard|Overview|Readiness|Growth Command Center/i },
    { name: "store-profile", path: `/seller/stores/${fixture.storeSlug}/store-profile`, expectedText: /Store|Profile|Readiness|Identity/i },
    { name: "products", path: `/seller/stores/${fixture.storeSlug}/catalog/products`, expectedText: /Products|Catalog|Add Product|No products/i },
    { name: "product-new", path: `/seller/stores/${fixture.storeSlug}/catalog/products/new`, expectedText: /Product|Draft|Add Product|Save/i },
    { name: "product-detail", path: `/seller/stores/${fixture.storeSlug}/catalog/products/${fixture.productId}`, expectedText: /Product|Catalog|Readiness|Submit/i },
    { name: "categories", path: `/seller/stores/${fixture.storeSlug}/catalog/categories`, expectedText: /Categories|Category/i },
    { name: "attributes", path: `/seller/stores/${fixture.storeSlug}/catalog/attributes`, expectedText: /Attributes|Attribute/i },
    { name: "attribute-values", path: `/seller/stores/${fixture.storeSlug}/catalog/attributes/${fixture.attributeId}/values`, expectedText: /Attributes|Values|Color/i },
    { name: "coupons", path: `/seller/stores/${fixture.storeSlug}/catalog/coupons`, expectedText: /Coupons|Promo|Discount/i },
    { name: "orders", path: `/seller/stores/${fixture.storeSlug}/orders`, expectedText: /Orders|Fulfillment|Payment/i },
    { name: "order-detail", path: `/seller/stores/${fixture.storeSlug}/orders/${fixture.suborderId}`, expectedText: /Order|Fulfillment|Payment|Shipment/i },
    { name: "payment-review", path: `/seller/stores/${fixture.storeSlug}/payment-review`, expectedText: /Payment Review|Proof|Payment/i },
    { name: "payment-profile", path: `/seller/stores/${fixture.storeSlug}/payment-profile`, expectedText: /Payment Profile|Bank|QRIS/i },
    { name: "team", path: `/seller/stores/${fixture.storeSlug}/team`, expectedText: /Team Members|Role|Permission/i },
    { name: "team-audit", path: `/seller/stores/${fixture.storeSlug}/team/audit`, expectedText: /Audit|Team|Permission/i },
    { name: "notifications", path: `/seller/stores/${fixture.storeSlug}/notifications`, expectedText: /Notifications|Unread|Mark/i },
  ].map((route) => ({ ...route, requireSellerShell: true }));

  return {
    previewIsolated: [
      { name: "preview-root", path: "/seller-2026", expectedText: /Seller|Workspace|Dashboard/i, requireSellerShell: true },
      { name: "preview-dashboard", path: "/seller-2026/dashboard", expectedText: /Dashboard|Readiness|Growth/i, requireSellerShell: true },
      { name: "preview-products", path: "/seller-2026/catalog/products", expectedText: /Products|Catalog|Add Product/i, requireSellerShell: true },
      { name: "preview-orders", path: "/seller-2026/orders", expectedText: /Orders|Fulfillment|Payment/i, requireSellerShell: true },
      { name: "preview-payment-profile", path: "/seller-2026/payment-profile", expectedText: /Payment Profile|Bank|QRIS/i, requireSellerShell: true },
      { name: "preview-team", path: "/seller-2026/team", expectedText: /Team|Members|Role/i, requireSellerShell: true },
      { name: "preview-notifications", path: "/seller-2026/notifications", expectedText: /Notifications|Unread|Mark/i, requireSellerShell: true },
    ],
    previewStoreScoped: [
      { name: "preview-store-root", path: `/seller-2026-preview/${fixture.storeSlug}`, requireSellerShell: true },
      { name: "preview-store-products", path: `/seller-2026-preview/${fixture.storeSlug}/catalog/products`, requireSellerShell: true },
      { name: "preview-store-orders", path: `/seller-2026-preview/${fixture.storeSlug}/orders`, requireSellerShell: true },
      { name: "preview-store-team", path: `/seller-2026-preview/${fixture.storeSlug}/team`, requireSellerShell: true },
    ],
    canonical,
    legacyRedirects: [
      { name: "legacy-profile", path: `/seller/stores/${fixture.storeSlug}/profile`, expectedUrlPart: "/store-profile", requireSellerShell: true },
      { name: "legacy-catalog", path: `/seller/stores/${fixture.storeSlug}/catalog`, expectedUrlPart: "/catalog/products", requireSellerShell: true },
      { name: "legacy-catalog-new", path: `/seller/stores/${fixture.storeSlug}/catalog/new`, expectedUrlPart: "/catalog/products/new", requireSellerShell: true },
      { name: "legacy-coupons", path: `/seller/stores/${fixture.storeSlug}/coupons`, expectedUrlPart: "/catalog/coupons", requireSellerShell: true },
    ],
    crossStore: [
      { name: "cross-dashboard", path: `/seller/stores/${fixture.otherStoreSlug}`, allowForbidden: true },
      { name: "cross-products", path: `/seller/stores/${fixture.otherStoreSlug}/catalog/products`, allowForbidden: true },
      { name: "cross-orders", path: `/seller/stores/${fixture.otherStoreSlug}/orders`, allowForbidden: true },
      { name: "cross-team", path: `/seller/stores/${fixture.otherStoreSlug}/team`, allowForbidden: true },
    ],
    member: [
      { name: "member-dashboard", path: `/seller/stores/${fixture.storeSlug}`, requireSellerShell: true, allowForbidden: true },
      { name: "member-orders", path: `/seller/stores/${fixture.storeSlug}/orders`, requireSellerShell: true, allowForbidden: true },
      { name: "member-order-detail", path: `/seller/stores/${fixture.storeSlug}/orders/${fixture.suborderId}`, requireSellerShell: true, allowForbidden: true },
      { name: "member-team", path: `/seller/stores/${fixture.storeSlug}/team`, allowForbidden: true },
      { name: "member-payment-profile", path: `/seller/stores/${fixture.storeSlug}/payment-profile`, allowForbidden: true },
      { name: "member-payment-review", path: `/seller/stores/${fixture.storeSlug}/payment-review`, allowForbidden: true },
    ],
    adminRegression: [
      { name: "admin-dashboard", path: "/admin/dashboard", allowAuthBlocked: true, forbidSellerShell: true },
      { name: "admin-store-applications", path: "/admin/store/applications", allowAuthBlocked: true, forbidSellerShell: true },
      { name: "admin-customization", path: "/admin/store/customization?storeTab=home-settings", allowAuthBlocked: true, forbidSellerShell: true },
    ],
    clientRegression: [
      { name: "home", path: "/", forbidSellerShell: true },
      { name: "store-demo", path: "/store/demo-store", forbidSellerShell: true, allowAuthBlocked: true },
      { name: "checkout", path: "/checkout", forbidSellerShell: true, allowAuthBlocked: true },
    ],
  };
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client flags-off");
  if (CLIENT_URL_FLAGS_ON) await waitForOk(CLIENT_URL_FLAGS_ON, "client flags-on");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const routes = buildRoutes(fixture);
  const browser = await chromium.launch({ headless: true });
  const results: RouteResult[] = [];
  let markRead: unknown = null;

  try {
    const owner = await loginContext(browser, CLIENT_URL, fixture.ownerEmail, fixture.password);
    results.push(...(await runGroup(owner.page, "preview-isolated", routes.previewIsolated)));
    results.push(...(await runGroup(owner.page, "preview-store-scoped", routes.previewStoreScoped)));
    results.push(...(await runGroup(owner.page, "canonical-flags-off", routes.canonical)));
    results.push(...(await runGroup(owner.page, "legacy-redirects", routes.legacyRedirects)));
    results.push(...(await runGroup(owner.page, "cross-store-owner", routes.crossStore)));
    markRead = await markReadSmoke(owner.page, fixture);
    await owner.context.close();

    if (CLIENT_URL_FLAGS_ON) {
      const ownerFlagsOn = await loginContext(browser, CLIENT_URL_FLAGS_ON, fixture.ownerEmail, fixture.password);
      const flagsOnRoutes = routes.canonical.filter((route) =>
        ["dashboard", "dashboard-explicit", "products", "notifications"].includes(route.name)
      );
      results.push(...(await runGroup(ownerFlagsOn.page, "canonical-flags-on", flagsOnRoutes, CLIENT_URL_FLAGS_ON)));
      await ownerFlagsOn.context.close();
    } else {
      results.push(
        ...routes.canonical
          .filter((route) => ["dashboard", "dashboard-explicit", "products", "notifications"].includes(route.name))
          .map((route) => ({
          group: "canonical-flags-on",
          name: route.name,
          path: route.path,
          finalUrl: "",
          httpStatus: null,
          status: "SKIPPED" as RouteStatus,
          consoleErrors: [],
          pageErrors: [],
          requestFailures: [],
          assertions: ["CLIENT_URL_FLAGS_ON not set"],
          snippet: "",
        }))
      );
    }

    const member = await loginContext(browser, CLIENT_URL, fixture.memberEmail, fixture.password);
    results.push(...(await runGroup(member.page, "role-limited-member", routes.member)));
    await member.context.close();

    const publicContext: BrowserContext = await browser.newContext({
      baseURL: CLIENT_URL,
      viewport: { width: 1366, height: 900 },
    });
    const publicPage = await publicContext.newPage();
    results.push(...(await runGroup(publicPage, "admin-regression", routes.adminRegression)));
    results.push(...(await runGroup(publicPage, "client-regression", routes.clientRegression)));
    await publicContext.close();
  } finally {
    await browser.close();
  }

  const failures = results.filter((result) => result.status === "FAIL" || result.status === "RUNTIME_ERROR");
  const forbidden = results.filter((result) => result.status === "FORBIDDEN");
  const skipped = results.filter((result) => result.status === "SKIPPED");
  const byGroup = results.reduce<Record<string, Record<string, number>>>((acc, result) => {
    acc[result.group] ||= {};
    acc[result.group][result.status] = (acc[result.group][result.status] || 0) + 1;
    return acc;
  }, {});

  const output = {
    checkedAt: new Date().toISOString(),
    env: {
      clientUrl: CLIENT_URL,
      clientUrlFlagsOn: CLIENT_URL_FLAGS_ON || null,
      apiUrl: API_URL,
      markReadEnabled: RUN_MARK_READ,
    },
    fixture: {
      ownerEmail: fixture.ownerEmail,
      memberEmail: fixture.memberEmail,
      storeSlug: fixture.storeSlug,
      otherStoreSlug: fixture.otherStoreSlug,
      storeId: fixture.storeId,
      otherStoreId: fixture.otherStoreId,
      productId: fixture.productId,
      suborderId: fixture.suborderId,
    },
    summary: {
      total: results.length,
      failures: failures.length,
      forbidden: forbidden.length,
      skipped: skipped.length,
      byGroup,
      status: failures.length ? "FAIL" : "PASS",
    },
    markRead,
    results,
  };

  console.log(JSON.stringify(output, null, 2));
  if (failures.length) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch(() => undefined);
  });
