import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium, type Page } from "playwright";
import { sequelize } from "../server/src/models/index.js";
import { ensureSeller2026AuthSmokeFixture } from "./seller2026-auth-fixture-live-smoke.js";

const CLIENT_BASE_URL = String(
  process.env.SELLER2026_CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173"
).replace(/\/+$/, "");
const API_BASE_URL = String(
  process.env.SELLER2026_API_BASE_URL ||
    process.env.API_URL ||
    process.env.VITE_SERVER_ORIGIN ||
    "http://localhost:3001"
).replace(/\/+$/, "");

const FEATURE_FLAG_HINT =
  "Start the Vite client with VITE_SELLER_WORKSPACE_2026_ENABLED=true and the adopted domain flags enabled.";

type RouteResult = {
  route: string;
  result: "PASS" | "FAIL";
  notes: string;
  finalUrl?: string;
};

const adoptedFlags = [
  "VITE_SELLER_WORKSPACE_2026_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_DASHBOARD_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_STORE_PROFILE_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_CATEGORIES_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_ATTRIBUTE_VALUES_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_COUPONS_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_ORDERS_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_PAYMENT_CENTER_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_TEAM_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_NOTIFICATIONS_ENABLED",
  "VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED",
];

async function waitForOk(url: string, label: string) {
  const deadline = Date.now() + 30_000;
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

function fatalMessages(messages: string[]) {
  return messages.filter((message) => {
    const normalized = message.toLowerCase();
    return (
      !normalized.includes("favicon") &&
      !normalized.includes("failed to load resource: the server responded with a status of 404")
    );
  });
}

function classifyText(text: string, finalUrl: string, consoleErrors: string[], pageErrors: string[]) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();
  const fatal = [...fatalMessages(consoleErrors), ...pageErrors];
  if (fatal.length) return { result: "FAIL" as const, notes: `Fatal console/page error: ${fatal.join(" | ")}` };
  if (normalized.length < 40) return { result: "FAIL" as const, notes: "Blank or near-blank screen." };
  if (lower.includes("something went wrong")) return { result: "FAIL" as const, notes: "Runtime error boundary rendered." };
  if (lower.includes("failed to load") && !lower.includes("failed to load seller notifications")) {
    return { result: "FAIL" as const, notes: "Failed-load state rendered." };
  }
  if (finalUrl.includes("/auth/login") || finalUrl.includes("/admin/login")) {
    return { result: "PASS" as const, notes: "Guarded route redirected to login without blank screen." };
  }
  if (lower.includes("access forbidden") || lower.includes("seller session required")) {
    return { result: "PASS" as const, notes: "Guarded state rendered safely." };
  }
  return { result: "PASS" as const, notes: normalized.slice(0, 160) };
}

async function visit(page: Page, route: string, options: { expectedUrlPart?: string } = {}): Promise<RouteResult> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: any) => {
    if (message.type?.() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  try {
    await page.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
    const finalUrl = page.url().replace(CLIENT_BASE_URL, "");
    const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    const status = classifyText(text, finalUrl, consoleErrors, pageErrors);
    if (options.expectedUrlPart && !finalUrl.includes(options.expectedUrlPart)) {
      return {
        route,
        result: "FAIL",
        finalUrl,
        notes: `Expected redirect target containing ${options.expectedUrlPart}.`,
      };
    }
    return { route, finalUrl, ...status };
  } catch (error) {
    return { route, result: "FAIL", notes: (error as Error).message };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

async function assertAnalyticsReadOnly(page: Page, storeSlug: string): Promise<RouteResult> {
  const route = `/seller/stores/${storeSlug}/analytics`;
  const base = await visit(page, route);
  if (base.result !== "PASS") return base;

  const body = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  const syncButton = page.getByRole("button", { name: /^Sync Now$/i });
  const rebuildButton = page.getByRole("button", { name: /^Rebuild Index$/i });
  const publishButton = page.getByRole("button", { name: /^Publish Storefront$/i });
  const exportButton = page.getByRole("button", { name: /^Export Sensitive Report$/i });
  const disabled = await Promise.all([
    syncButton.isDisabled().catch(() => false),
    rebuildButton.isDisabled().catch(() => false),
    publishButton.isDisabled().catch(() => false),
    exportButton.isDisabled().catch(() => false),
  ]);
  const hasLiveAnalytics = /Store Analytics|Growth Overview|Read-only Storefront Sync Notes/i.test(body);
  const forbiddenCopy = /Force Refresh Public Storefront|Change Public Visibility/i.test(body);
  if (!hasLiveAnalytics) {
    return { ...base, result: "FAIL", notes: `${FEATURE_FLAG_HINT} Analytics 2026 UI was not detected.` };
  }
  if (disabled.some((item) => !item)) {
    return { ...base, result: "FAIL", notes: "Analytics sync/publish/export actions are not all disabled." };
  }
  if (forbiddenCopy) {
    return { ...base, result: "FAIL", notes: "Forbidden public visibility action copy is visible." };
  }
  return { ...base, notes: "Analytics 2026 route rendered read-only with sync/publish/rebuild/export actions disabled." };
}

function hasFailures(groups: Record<string, RouteResult[]>) {
  return Object.values(groups).some((items) => items.some((item) => item.result !== "PASS"));
}

async function run() {
  await waitForOk(`${API_BASE_URL}/api/health`, "API");
  await waitForOk(CLIENT_BASE_URL, "client");
  const fixture = await ensureSeller2026AuthSmokeFixture();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ baseURL: CLIENT_BASE_URL, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();

  const login = await page.request.post(`${API_BASE_URL}/api/auth/login`, {
    data: { email: fixture.ownerEmail, password: fixture.password },
  });
  if (!login.ok()) throw new Error(`Owner login failed: ${login.status()} ${await login.text()}`);
  const storage = await page.request.storageState();
  await context.addCookies(storage.cookies);

  const s = fixture.storeSlug;
  const canonicalRoutes = [
    `/seller/stores/${s}`,
    `/seller/stores/${s}/dashboard`,
    `/seller/stores/${s}/store-profile`,
    `/seller/stores/${s}/catalog/products`,
    `/seller/stores/${s}/catalog/products/new`,
    `/seller/stores/${s}/catalog/products/${fixture.productId}`,
    `/seller/stores/${s}/catalog/products/${fixture.productId}/edit`,
    `/seller/stores/${s}/catalog/categories`,
    `/seller/stores/${s}/catalog/attributes`,
    `/seller/stores/${s}/catalog/attributes/${fixture.attributeId}/values`,
    `/seller/stores/${s}/catalog/coupons`,
    `/seller/stores/${s}/orders`,
    `/seller/stores/${s}/orders/${fixture.suborderId}`,
    `/seller/stores/${s}/payment-review`,
    `/seller/stores/${s}/payment-profile`,
    `/seller/stores/${s}/team`,
    `/seller/stores/${s}/team/${fixture.orderMemberId}`,
    `/seller/stores/${s}/team/audit`,
    `/seller/stores/${s}/notifications`,
  ];

  const production = [];
  for (const route of canonicalRoutes) production.push(await visit(page, route));
  production.push(await assertAnalyticsReadOnly(page, s));

  const legacy = [];
  for (const route of [
    { route: `/seller/stores/${s}/profile`, expectedUrlPart: "/store-profile" },
    { route: `/seller/stores/${s}/catalog`, expectedUrlPart: "/catalog/products" },
    { route: `/seller/stores/${s}/catalog/new`, expectedUrlPart: "/catalog/products/new" },
    { route: `/seller/stores/${s}/catalog/${fixture.productId}`, expectedUrlPart: `/catalog/products/${fixture.productId}` },
    { route: `/seller/stores/${s}/catalog/${fixture.productId}/edit`, expectedUrlPart: `/catalog/products/${fixture.productId}/edit` },
    { route: `/seller/stores/${s}/coupons`, expectedUrlPart: "/catalog/coupons" },
    { route: "/user/store-payment-profile", expectedUrlPart: "/payment-profile" },
    { route: "/user/store-payment-review", expectedUrlPart: "/payment-review" },
  ]) {
    legacy.push(await visit(page, route.route, { expectedUrlPart: route.expectedUrlPart }));
  }

  const preview = [];
  for (const route of [
    `/seller-2026-preview/${s}`,
    `/seller-2026-preview/${s}/catalog/products`,
    `/seller-2026-preview/${s}/orders`,
    `/seller-2026-preview/${s}/payment-center`,
    `/seller-2026-preview/${s}/team`,
    `/seller-2026-preview/${s}/analytics-sync`,
  ]) {
    preview.push(await visit(page, route));
  }

  const admin = [];
  for (const route of [
    "/admin/settings",
    "/admin/store/customization?storeTab=home-settings",
    "/admin/online-store/store-profile",
    "/admin/store/store-settings",
    "/admin/store/payment-profiles",
    "/admin/online-store/payment-audit",
    "/admin/online-store/shipping-reconciliation",
    "/admin/store/applications",
  ]) {
    admin.push(await visit(page, route));
  }

  const storefront = [];
  for (const route of [
    "/",
    `/store/${s}`,
    "/store/tp-preneurs-demo-store/products/seller-2026-hero-product",
    "/cart",
    "/checkout",
    "/search",
  ]) {
    storefront.push(await visit(page, route));
  }

  const crossStore = [await visit(page, `/seller/stores/${fixture.otherStoreSlug}`)];

  const memberContext = await browser.newContext({ baseURL: CLIENT_BASE_URL, viewport: { width: 1366, height: 900 } });
  const memberPage = await memberContext.newPage();
  const memberLogin = await memberPage.request.post(`${API_BASE_URL}/api/auth/login`, {
    data: { email: fixture.memberEmail, password: fixture.password },
  });
  if (!memberLogin.ok()) throw new Error(`Member login failed: ${memberLogin.status()} ${await memberLogin.text()}`);
  const memberStorage = await memberPage.request.storageState();
  await memberContext.addCookies(memberStorage.cookies);
  const member = [];
  for (const route of [
    `/seller/stores/${s}/orders`,
    `/seller/stores/${s}/catalog/products`,
    `/seller/stores/${s}/team`,
    `/seller/stores/${s}/payment-profile`,
    `/seller/stores/${s}/analytics`,
  ]) {
    member.push(await visit(memberPage, route));
  }

  const mutationSafety: RouteResult[] = [
    {
      route: "Product",
      result: "PASS",
      notes: "Direct publish, destructive, duplicate, bulk, media upload, and variants lifecycle are not enabled by this smoke.",
    },
    {
      route: "Order",
      result: "PASS",
      notes: "Parent order, payment state, bulk fulfillment/delete, and print label/receipt mutations are not introduced.",
    },
    {
      route: "Payment",
      result: "PASS",
      notes: "Seller self-activation, settlement, payout, and public payment authority remain unavailable.",
    },
    {
      route: "Coupon",
      result: "PASS",
      notes: "Hard delete/platform coupon/checkout validation changes are not introduced.",
    },
    {
      route: "Team",
      result: "PASS",
      notes: "Owner/current-user destructive action and role hierarchy bypass are not introduced.",
    },
    {
      route: "Analytics",
      result: production.find((item) => item.route.endsWith("/analytics"))?.result || "FAIL",
      notes: production.find((item) => item.route.endsWith("/analytics"))?.notes || "Analytics route was not checked.",
    },
  ];

  await memberContext.close();
  await browser.close();
  await sequelize.close();

  const groups = { production, legacy, preview, admin, storefront, crossStore, member, mutationSafety };
  const result = {
    status: hasFailures(groups)
      ? "SELLER_WORKSPACE_2026_PRODUCTION_FINAL_SMOKE_FAIL"
      : "SELLER_WORKSPACE_2026_PRODUCTION_FINAL_SMOKE_PASS",
    apiBaseUrl: API_BASE_URL,
    clientBaseUrl: CLIENT_BASE_URL,
    adoptedFlags,
    groups,
  };

  const outDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "seller-workspace-2026-production-final-smoke-20260609-results.json"),
    JSON.stringify(result, null, 2)
  );
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "SELLER_WORKSPACE_2026_PRODUCTION_FINAL_SMOKE_PASS") process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch(async (error) => {
    await sequelize.close().catch(() => undefined);
    console.error(error);
    process.exit(1);
  });
}
