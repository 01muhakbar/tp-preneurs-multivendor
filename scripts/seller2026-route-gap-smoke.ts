import { createRequire } from "node:module";
import { chromium, type Page } from "playwright";
import { sequelize, User } from "../server/src/models/index.js";
import { buildAuthSessionClaims } from "../server/src/services/authSession.service.js";
import { ensureSeller2026AuthSmokeFixture } from "./seller2026-auth-fixture-live-smoke.js";

const require = createRequire(import.meta.url);
const jwt = require("../server/node_modules/jsonwebtoken");

const CLIENT_BASE_URL = String(
  process.env.SELLER2026_CLIENT_BASE_URL || process.env.CLIENT_URL || "http://localhost:5173"
).replace(/\/+$/, "");
const API_BASE_URL = String(
  process.env.SELLER2026_API_BASE_URL ||
    process.env.API_URL ||
    process.env.VITE_SERVER_ORIGIN ||
    "http://localhost:3001"
).replace(/\/+$/, "");

type RouteCheck = {
  route: string;
  expectedUrlPart?: string;
  expectedText?: RegExp;
};

type RouteResult = {
  route: string;
  finalUrl?: string;
  result: "PASS" | "FAIL";
  notes: string;
};

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

async function buildOwnerToken(ownerId: number) {
  const owner = await User.findByPk(ownerId);
  if (!owner) throw new Error(`Seller smoke owner ${ownerId} was not found.`);
  const claims = await buildAuthSessionClaims(owner);
  return jwt.sign(claims, process.env.JWT_SECRET || "dev-secret", { expiresIn: "1h" });
}

async function visit(page: Page, check: RouteCheck): Promise<RouteResult> {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const onConsole = (message: any) => {
    if (message.type?.() === "error") consoleErrors.push(message.text());
  };
  const onPageError = (error: Error) => pageErrors.push(error.message);
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  try {
    await page.goto(check.route, { waitUntil: "networkidle", timeout: 45_000 });
    const finalUrl = page.url().replace(CLIENT_BASE_URL, "");
    const text = (await page.locator("body").innerText({ timeout: 12_000 }).catch(() => ""))
      .replace(/\s+/g, " ")
      .trim();
    const fatal = [...fatalMessages(consoleErrors), ...pageErrors];

    if (fatal.length) {
      return { route: check.route, finalUrl, result: "FAIL", notes: `Fatal console/page error: ${fatal.join(" | ")}` };
    }
    if (!text || text.length < 40) {
      return { route: check.route, finalUrl, result: "FAIL", notes: "Blank or near-blank screen." };
    }
    if (finalUrl.includes("undefined") || text.includes("/undefined")) {
      return { route: check.route, finalUrl, result: "FAIL", notes: "Undefined seller route was rendered." };
    }
    if (check.expectedUrlPart && !finalUrl.includes(check.expectedUrlPart)) {
      return {
        route: check.route,
        finalUrl,
        result: "FAIL",
        notes: `Expected final URL containing ${check.expectedUrlPart}.`,
      };
    }
    if (check.expectedText && !check.expectedText.test(text)) {
      return {
        route: check.route,
        finalUrl,
        result: "FAIL",
        notes: `Expected text ${check.expectedText}; got ${text.slice(0, 180)}`,
      };
    }

    return { route: check.route, finalUrl, result: "PASS", notes: text.slice(0, 180) };
  } catch (error) {
    return { route: check.route, result: "FAIL", notes: (error as Error).message };
  } finally {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }
}

async function main() {
  await waitForOk(`${API_BASE_URL}/api/health`, "API");
  await waitForOk(CLIENT_BASE_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const ownerToken = await buildOwnerToken(fixture.ownerId);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: CLIENT_BASE_URL,
    viewport: { width: 1366, height: 900 },
  });
  await context.addCookies([
    {
      name: process.env.AUTH_COOKIE_NAME || "token",
      value: ownerToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  const page = await context.newPage();
  const storeSlug = fixture.storeSlug;

  const checks: RouteCheck[] = [
    {
      route: "/user/store-payment-profile",
      expectedUrlPart: `/seller/stores/${storeSlug}/payment-profile`,
      expectedText: /Payment Setup|Payment Profile|Finance setup|Payment data/i,
    },
    {
      route: "/user/store-payment-review",
      expectedUrlPart: `/seller/stores/${storeSlug}/payment-review`,
      expectedText: /Payment Review|Payment review|Finance/i,
    },
    {
      route: `/seller-2026-preview/${storeSlug}/payment-center`,
      expectedUrlPart: `/seller-2026-preview/${storeSlug}/payment-center`,
      expectedText: /Payment Reviews|Payment Profile|Payment data is not available/i,
    },
    {
      route: `/seller-2026-preview/${storeSlug}/analytics-sync`,
      expectedUrlPart: `/seller-2026-preview/${storeSlug}/analytics-sync`,
      expectedText: /Storefront Sync|Product Performance|Analytics data is not available/i,
    },
    {
      route: `/seller/stores/${storeSlug}/payment-review`,
      expectedUrlPart: `/seller/stores/${storeSlug}/payment-review`,
      expectedText: /Payment Review|Payment review|Finance/i,
    },
    {
      route: `/seller/stores/${storeSlug}/payment-profile`,
      expectedUrlPart: `/seller/stores/${storeSlug}/payment-profile`,
      expectedText: /Payment Setup|Payment Profile|Finance setup/i,
    },
  ];

  const results: RouteResult[] = [];
  for (const check of checks) {
    results.push(await visit(page, check));
  }

  await browser.close();
  await sequelize.close();

  const failed = results.filter((result) => result.result !== "PASS");
  const output = {
    status: failed.length ? "SELLER_2026_ROUTE_GAP_SMOKE_FAIL" : "SELLER_2026_ROUTE_GAP_SMOKE_PASS",
    clientBaseUrl: CLIENT_BASE_URL,
    apiBaseUrl: API_BASE_URL,
    storeSlug,
    results,
  };
  console.log(JSON.stringify(output, null, 2));
  if (failed.length) process.exit(1);
}

main().catch(async (error) => {
  await sequelize.close().catch(() => undefined);
  console.error(error);
  process.exit(1);
});
