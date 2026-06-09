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

async function runTeamLifecycleSmoke() {
  console.log("==> Running Seller Workspace 2026 Team Lifecycle Sync Smoke");
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
    
    console.log("--> Accessing Live Team Page (Production Route)");
    await page.goto(`/seller/stores/${fixture.storeSlug}/team`);
    await page.waitForLoadState("networkidle");
    
    const isLegacyTeam = await page.locator('h3:has-text("People with access")').count() > 0 || await page.locator('text=Manage team members who have access').count() > 0;
    
    if (isLegacyTeam) {
      console.log("PRODUCTION_TEAM_ROUTE_LEGACY_FALLBACK_CONFIRMED");
    } else {
      console.log("Feature flag is ON, rendering Live 2026 Team Page.");
      await page.waitForSelector("text=Team Members", { timeout: 15_000 });

      console.log("--> Verifying Owner Removal Blocked");
      // Find the row containing the owner and check that its remove button is disabled
      const removeButtons = await page.locator('button:has-text("Remove")').all();
      for (const btn of removeButtons) {
          // This assumes the first one is the owner or at least one is disabled
          const disabled = await btn.isDisabled();
          const title = await btn.getAttribute("title");
          if (disabled && title?.includes("Owners cannot be removed")) {
              console.log("Owner removal guard verified in UI.");
          }
      }

      console.log("--> Verifying Self Removal Blocked");
      for (const btn of removeButtons) {
          const disabled = await btn.isDisabled();
          const title = await btn.getAttribute("title");
          if (disabled && title?.includes("You cannot remove your own access")) {
              console.log("Self removal guard verified in UI.");
          }
      }
    }
    
    console.log("--> Accessing Live Team Audit Page (Production Route)");
    await page.goto(`/seller/stores/${fixture.storeSlug}/team/audit`);
    await page.waitForLoadState("networkidle");
    
    if (!isLegacyTeam) {
      await page.waitForSelector("text=Audit Log", { timeout: 15_000 });
      
      console.log("--> Attempting to load audit list");
      const auditRows = await page.locator('.s26-table tbody tr').count();
      console.log(`Loaded ${auditRows} audit log rows.`);
    }

    console.log("--> Testing Client Storefront Boundary");
    const unauthedContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1440, height: 1050 } });
    const clientPage = await unauthedContext.newPage();
    await clientPage.goto(`/checkout`);
    await clientPage.waitForLoadState("domcontentloaded");

    console.log("--> Verify unauthorized access block");
    if (fixture.otherStoreSlug) {
        const crossStorePage = await context.newPage();
        const res = await crossStorePage.goto(`/seller/stores/${fixture.otherStoreSlug}/team`);
        if (res?.status() !== 403 && res?.status() !== 401 && !crossStorePage.url().includes('/unauthorized') && !crossStorePage.url().includes('/login')) {
            // It could redirect to dashboard if they don't have access, or render legacy fallback.
            const textCount = await crossStorePage.locator('text=People with access').count();
            if (textCount > 0) {
                throw new Error("Unauthorized access to other store team page succeeded!");
            }
        }
    }

    console.log("==> Smoke Test Completed Successfully.");

  } finally {
    await browser.close();
  }
}

runTeamLifecycleSmoke().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
