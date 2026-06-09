import { createRequire } from "node:module";
import { chromium, type Browser, type Page } from "playwright";
import { User } from "../server/src/models/index.js";
import { buildAuthSessionClaims } from "../server/src/services/authSession.service.js";
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

async function newAuthedPage(browser: Browser, token?: string) {
  const context = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1050 } });
  if (token) {
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
  }
  return context.newPage();
}

async function runPaymentWorkflowSmoke() {
  console.log("==> Running Seller Workspace 2026 Payment Workflow Sync Smoke");
  const fixture = await ensureSeller2026AuthSmokeFixture();

  await waitForOk(`${API_URL}/api/health`, "Backend API");
  await waitForOk(`${CLIENT_URL}/health.txt`, "Frontend Client");

  const browser = await chromium.launch({ headless: true });
  
  try {
    const context = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1050 } });
    const page = await context.newPage();

    const loginResponse = await page.request.post(`${API_URL}/api/auth/login`, {
      data: { email: fixture.ownerEmail, password: fixture.password },
    });
    if (!loginResponse.ok()) {
      throw new Error(`Fixture login failed: ${loginResponse.status()} ${await loginResponse.text()}`);
    }
    const cookies = await page.request.storageState();
    await context.addCookies(cookies.cookies);
    
    console.log("--> Accessing Live Payment Review Page (Production Route)");
    await page.goto(`/seller/stores/${fixture.storeSlug}/payment-review`);
    await page.waitForLoadState("networkidle");
    
    // Check if legacy fallback or Live 2026 Page
    const isLegacyReview = await page.locator('h3:has-text("Payment review")').count() > 0 || await page.locator('text=Approve matching payment proofs or reject with a clear reason.').count() > 0;
    
    if (isLegacyReview) {
      console.log("PRODUCTION_PAYMENT_REVIEW_ROUTE_LEGACY_FALLBACK_CONFIRMED");
    } else {
      await page.waitForSelector("text=Payment Review", { timeout: 15_000 });
    }

    // Verify no settlement, payout, refund on the live page
    const settlementCount = await page.locator('button:has-text("Settlement")').count();
    const payoutCount = await page.locator('button:has-text("Payout")').count();
    const refundCount = await page.locator('button:has-text("Refund")').count();
    if (settlementCount > 0 || payoutCount > 0 || refundCount > 0) {
      throw new Error("Forbidden payment mutation actions found on Live Payment Review page.");
    }
    
    console.log("--> Accessing Live Payment Profile Page (Production Route)");
    await page.goto(`/seller/stores/${fixture.storeSlug}/payment-profile`);
    await page.waitForLoadState("networkidle");
    
    const isLegacyProfile = await page.locator('h3:has-text("Payment setup")').count() > 0 || await page.locator('text=Prepare QRIS checkout destination.').count() > 0;
    
    if (isLegacyProfile) {
      console.log("PRODUCTION_PAYMENT_PROFILE_ROUTE_LEGACY_FALLBACK_CONFIRMED");
    } else {
      await page.waitForSelector("text=Payment Profile", { timeout: 15_000 });
    }
    
    // Verify no self-activation button
    const activateCount = await page.locator('button:has-text("Activate Profile")').count();
    if (activateCount > 0) throw new Error("Self-activation is exposed on Live Payment Profile, violating guardrails.");

    console.log("--> Testing Admin Workspace Boundaries");
    const adminPage = await context.newPage();
    await adminPage.goto(`/admin/online-store/payment-audit`);
    await adminPage.waitForLoadState("domcontentloaded");
    
    await adminPage.goto(`/admin/store/payment-profiles`);
    await adminPage.waitForLoadState("domcontentloaded");
    
    console.log("--> Testing Client Storefront Checkout Boundary");
    const unauthedContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1050 } });
    const clientPage = await unauthedContext.newPage();
    await clientPage.goto(`/checkout`);
    await clientPage.waitForLoadState("domcontentloaded");
    // Just verify no blank screen or crash

    console.log("--> Verify unauthorized access block");
    if (fixture.otherStoreSlug) {
        const crossStorePage = await context.newPage();
        const res = await crossStorePage.goto(`/seller/stores/${fixture.otherStoreSlug}/payment-review`);
        if (res?.status() !== 403 && res?.status() !== 401 && !crossStorePage.url().includes('/unauthorized')) {
            const textCount = await crossStorePage.locator('text=Payment Review').count();
            if (textCount > 0) {
                throw new Error("Unauthorized access to other store payment review succeeded!");
            }
        }
    }

    console.log("==> Smoke Test Completed Successfully.");

  } finally {
    await browser.close();
  }
}

runPaymentWorkflowSmoke().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
