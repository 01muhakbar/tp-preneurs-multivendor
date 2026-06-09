import { createRequire } from "node:module";
import { chromium, type Browser, type Page } from "playwright";
import { Product, sequelize, User } from "../server/src/models/index.js";
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

async function setCategoriesFlag(page: Page, enabled: boolean) {
  await page.route("**/sellerWorkspace2026Flags.js*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const mockedBody = body.replace(
      /export function isSeller2026CategoriesProductionEnabled\s*\(\)\s*\{/,
      `export function isSeller2026CategoriesProductionEnabled() { return ${enabled ? "true" : "false"}; `
    );
    await route.fulfill({ response, body: mockedBody });
  });
}

async function assertNoSellerShell(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle", timeout: 45_000 });
  const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  if (/TP PRENEURS SELLER WORKSPACE/i.test(text) && !path.includes("/seller")) {
    throw new Error(`${path} unexpectedly rendered Seller shell.`);
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const fixtureProduct = await Product.findOne({ where: { storeId: fixture.storeId } });
  const fixtureProductId = Number((fixtureProduct as any)?.id || 0);
  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const categoryMutations: string[] = [];
  const results: Record<string, unknown> = {};

  try {
    let owner = await newAuthedPage(browser, fixture.ownerEmail);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));
    await setCategoriesFlag(owner.page, false);

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/categories`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    let text = await owner.page.locator("body").innerText({ timeout: 10_000 });
    let normalizedText = text.replace(/\s+/g, " ").trim();
    if (/Organize products with store-scoped live category data/i.test(normalizedText)) {
      throw new Error("Seller 2026 Categories rendered when flags were OFF.");
    }
    results.flagsOff = { status: "PASS", snippet: normalizedText.slice(0, 180) };
    await owner.context.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));
    await setCategoriesFlag(owner.page, true);
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (
        ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
        /\/api\/seller\/stores\/[^/]+\/categories/i.test(request.url())
      ) {
        categoryMutations.push(`${method} ${request.url()}`);
      }
    });

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/categories`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    text = await owner.page.locator("body").innerText({ timeout: 10_000 });
    normalizedText = text.replace(/\s+/g, " ").trim();
    if (!/Categories/i.test(normalizedText) || !/Total|No categories yet/i.test(normalizedText)) {
      throw new Error(`Seller 2026 live Categories did not render with flags ON. Text: ${normalizedText.slice(0, 300)}`);
    }
    if (/MOCK_DATA|PREVIEW_MODE|seller-2026\/catalog/i.test(normalizedText)) {
      throw new Error("Mock or preview marker found on live Categories.");
    }
    const liveMarker = await owner.page.locator("[data-seller2026-live-categories='true']").count();
    if (liveMarker < 1) throw new Error("Live Categories marker was not rendered.");
    const unsafeLinks = await owner.page.locator("a[href*='seller-2026']").count();
    if (unsafeLinks > 0) throw new Error("Live Categories rendered a preview route link.");
    results.flagsOn = {
      status: "PASS",
      snippet: normalizedText.slice(0, 180),
      categoryMutationRequests: categoryMutations.length,
    };

    await owner.page.goto(`/seller/stores/${fixture.otherStoreSlug}/catalog/categories`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Access Forbidden|permission/i.test(crossText) || /Other Demo Store.*Categories/i.test(crossText)) {
      throw new Error("Cross-store Categories route did not render a safe forbidden state.");
    }
    results.crossStore = {
      status: "PASS",
      finalUrl: owner.page.url().replace(CLIENT_URL, ""),
      snippet: crossText.replace(/\s+/g, " ").trim().slice(0, 180),
    };
    await owner.context.close();

    const member = await newAuthedPage(browser, fixture.memberEmail);
    await setCategoriesFlag(member.page, true);
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/categories`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const memberText = await member.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Categories|Access Restricted|permission/i.test(memberText)) {
      throw new Error("Role-limited member Categories route did not render read-safe or permission-safe UI.");
    }
    results.member = {
      status: "PASS",
      finalUrl: member.page.url().replace(CLIENT_URL, ""),
      snippet: memberText.replace(/\s+/g, " ").trim().slice(0, 180),
    };
    await member.context.close();

    const publicContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 390, height: 900 } });
    const publicPage = await publicContext.newPage();
    await publicPage.goto("/seller-2026/catalog/categories", { waitUntil: "networkidle", timeout: 45_000 });
    const previewText = await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Categories/i.test(previewText)) throw new Error("Preview Categories route did not render.");
    results.preview = { status: "PASS", snippet: previewText.replace(/\s+/g, " ").trim().slice(0, 180) };

    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/catalog/products`, { waitUntil: "networkidle", timeout: 45_000 });
    results.catalogRegression = {
      status: "PASS",
      snippet: (await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 180),
    };
    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/new`, { waitUntil: "networkidle", timeout: 45_000 });
    results.authoringRegression = {
      status: "PASS",
      snippet: (await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 180),
    };
    if (fixtureProductId > 0) {
      await publicPage.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/${fixtureProductId}`, { waitUntil: "networkidle", timeout: 45_000 });
      results.productDetailRegression = {
        status: "PASS",
        snippet: (await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 180),
      };
    } else {
      results.productDetailRegression = { status: "SKIPPED", reason: "No fixture product was available." };
    }
    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/dashboard`, { waitUntil: "networkidle", timeout: 45_000 });
    results.dashboardRegression = {
      status: "PASS",
      snippet: (await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 180),
    };
    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/notifications`, { waitUntil: "networkidle", timeout: 45_000 });
    results.notificationsRegression = {
      status: "PASS",
      snippet: (await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "")).replace(/\s+/g, " ").trim().slice(0, 180),
    };
    results.adminRegression = { status: "PASS", snippet: await assertNoSellerShell(publicPage, "/admin/dashboard") };
    results.clientRegression = {
      status: "PASS",
      home: await assertNoSellerShell(publicPage, "/"),
      store: await assertNoSellerShell(publicPage, "/store/demo-store"),
    };
    await publicContext.close();
  } finally {
    await browser.close();
  }

  const fatalConsoleErrors = consoleErrors.filter(
    (value) => !value.includes("403") && !value.toLowerCase().includes("favicon")
  );
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
      status: fatalConsoleErrors.length || pageErrors.length || categoryMutations.length ? "FAIL" : "PASS",
      fatalConsoleErrors: fatalConsoleErrors.length,
      pageErrors: pageErrors.length,
      categoryMutations: categoryMutations.length,
    },
    consoleErrors,
    pageErrors,
    categoryMutations,
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
