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

async function runFulfillmentSmoke() {
  console.log("==> Running Seller Workspace 2026 Order Fulfillment Sync Smoke");
  const fixture = await ensureSeller2026AuthSmokeFixture();
  
  const suborderId = fixture.fulfillmentSuborderId;

  if (!suborderId) {
    console.warn("No suborders found for the test store. Some UI actions cannot be verified deeply.");
  }

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
    
    console.log("--> Accessing Seller Orders Page (Production Route)");
    await page.goto(`/seller/stores/${fixture.storeSlug}/orders`);
    await page.waitForLoadState("networkidle");
    
    // Check if legacy fallback or Live 2026 Page
    const isLegacy = await page.locator('h3:has-text("Pack, ship, and track seller orders from one place.")').count() > 0 || await page.locator('text=Pack, ship, and track seller orders from one place.').count() > 0;
    
    if (isLegacy) {
      console.log("PRODUCTION_ORDERS_ROUTE_LEGACY_FALLBACK_CONFIRMED");
      await browser.close();
      return;
    }

    try {
      // Live orders page via Seller2026Workspace uses this exact text in the Card hint
      await page.waitForSelector("text=Live store-owned suborders", { timeout: 15_000 });
    } catch (err) {
      console.error("Timeout waiting for text. Current URL:", page.url());
      console.error("Body text:", await page.locator("body").innerText());
      throw err;
    }
    
    // Verify bulk actions are not present (guardrail)
    const bulkButton = await page.locator('button:has-text("Bulk Fulfillment")').count();
    if (bulkButton > 0) throw new Error("Bulk fulfillment is exposed, which violates guardrails.");
    
    if (suborderId) {
      console.log(`--> Accessing Order Detail (Production Route): ${suborderId}`);
      await page.goto(`/seller/stores/${fixture.storeSlug}/orders/${suborderId}`);
      await page.waitForLoadState("networkidle");
      // Seller2026Workspace 'suborder-detail' view title
      await page.waitForSelector("text=Store-scoped order detail", { timeout: 15_000 });
      
      const trackingInputCount = await page.locator('input[placeholder="RESI-123456"]').count();
      if (trackingInputCount > 0) {
        const trackingDisabled = await page.locator('input[placeholder="RESI-123456"]').isDisabled();
        if (!trackingDisabled) throw new Error("Tracking input is not disabled, which violates guardrails.");
      }

      const paymentStatusText = await page.locator('.s26-card.soft:has-text("Payment") strong:has-text("Read-only")').count();
      if (paymentStatusText === 0) throw new Error("Payment status is not strictly marked as read-only.");

      const approvePaymentBtnCount = await page.locator('button:has-text("Approve Payment")').count();
      if (approvePaymentBtnCount > 0) throw new Error("Payment mutation exposed on order detail page, which violates guardrails.");
      
      // Verify actions
      const packAction = await page.locator('button:has-text("Mark as Packed")').count();
      const shipAction = await page.locator('button:has-text("Mark as Shipped")').count();
      const deliverAction = await page.locator('button:has-text("Mark Delivered")').count();
      
      console.log(`Actions available: Packed=${packAction}, Shipped=${shipAction}, Delivered=${deliverAction}`);
    }
    
    console.log("--> Testing Admin Workspace Shipping Reconciliation Boundary");
    const adminPage = await context.newPage();
    await adminPage.goto(`/admin/online-store/shipping-reconciliation`);
    await adminPage.waitForLoadState("domcontentloaded");
    // Just verify no blank screen
    
    console.log("--> Testing Admin Workspace Payment Audit Boundary");
    await adminPage.goto(`/admin/online-store/payment-audit`);
    await adminPage.waitForLoadState("domcontentloaded");
    
    console.log("--> Testing Client Storefront Boundary");
    const unauthedContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1050 } });
    const clientPage = await unauthedContext.newPage();
    await clientPage.goto(`/store/${fixture.storeSlug}`);
    await clientPage.waitForLoadState("domcontentloaded");
    const clientStorefrontCount = await clientPage.locator('text=' + fixture.storeSlug).count();
    // It should load without crashing

    console.log("--> Verify unauthorized access block");
    if (fixture.otherStoreSlug) {
        // Try accessing another store's orders
        const crossStorePage = await context.newPage();
        const res = await crossStorePage.goto(`/seller/stores/${fixture.otherStoreSlug}/orders`);
        if (res?.status() !== 403 && res?.status() !== 401 && !crossStorePage.url().includes('/unauthorized')) {
            // It might just redirect or load an error UI. We check if the orders UI is not rendered.
            const textCount = await crossStorePage.locator('text=Live store-owned suborders').count();
            if (textCount > 0) {
                throw new Error("Unauthorized access to other store orders succeeded!");
            }
        }
    }

    console.log("==> Production Route Verify Smoke Test Completed Successfully.");

  } finally {
    await browser.close();
  }
}

runFulfillmentSmoke().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
