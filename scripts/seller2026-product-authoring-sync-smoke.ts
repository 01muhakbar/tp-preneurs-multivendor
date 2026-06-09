import { createRequire } from "node:module";
import { chromium, type Browser, type Page } from "playwright";
import { Product, User } from "../server/src/models/index.js";
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
  const page = await context.newPage();
  return { context, page };
}

async function setSeller2026ProductFlags(page: Page, enabled: boolean) {
  await page.route("**/sellerWorkspace2026Flags.js*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const mockedBody = body
      .replace(
        /enabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ENABLED === 'true'/,
        `enabled: ${enabled ? "true" : "false"}`
      )
      .replace(
        /catalogEnabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED === 'true'/,
        `catalogEnabled: ${enabled ? "true" : "false"}`
      )
      .replace(
        /authoringEnabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED === 'true'/,
        `authoringEnabled: ${enabled ? "true" : "false"}`
      )
      .replace(
        /productDetailEnabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED === 'true'/,
        `productDetailEnabled: ${enabled ? "true" : "false"}`
      )
      .replace(
        /isEnabled\(import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ENABLED\)/g,
        enabled ? "true" : "false"
      )
      .replace(
        /isEnabled\(import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED\)/g,
        enabled ? "true" : "false"
      )
      .replace(
        /isEnabled\(import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED\)/g,
        enabled ? "true" : "false"
      )
      .replace(
        /isEnabled\(import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED\)/g,
        enabled ? "true" : "false"
      )
      .replace(
        /isSellerWorkspace2026Enabled\(\) && isEnabled\(import\.meta\.env\[envKey\]\)/g,
        enabled
          ? 'isSellerWorkspace2026Enabled() && (["VITE_SELLER_WORKSPACE_2026_CATALOG_ENABLED","VITE_SELLER_WORKSPACE_2026_AUTHORING_ENABLED","VITE_SELLER_WORKSPACE_2026_PRODUCT_DETAIL_ENABLED"].includes(envKey) ? true : isEnabled(import.meta.env[envKey]))'
          : "false"
      );
    await route.fulfill({ response, body: mockedBody });
  });
}

async function bodySnippet(page: Page) {
  return (await page.locator("body").innerText({ timeout: 10_000 }).catch(() => ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
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

async function fillField(page: Page, label: string, value: string) {
  const field = page.locator(".s26-field", { hasText: label }).first();
  await field.waitFor({ state: "visible", timeout: 15_000 });
  await field.locator("input, textarea").first().fill(value);
}

async function enabledButtonCount(page: Page, name: RegExp | string) {
  const buttons = await page.getByRole("button", { name }).all();
  let count = 0;
  for (const button of buttons) {
    if (!(await button.isDisabled())) count += 1;
  }
  return count;
}

function assertSellerDraftPayload(payloads: unknown[]) {
  if (!payloads.length) throw new Error("No seller product draft payload was captured.");
  const forbidden = [
    "storeId",
    "sellerId",
    "ownerId",
    "userId",
    "adminId",
    "status",
    "published",
    "isPublished",
    "publishedAt",
    "approvedBy",
    "approvedAt",
    "reviewedBy",
    "reviewedAt",
    "sellerSubmissionStatus",
    "publicVisibilityOverride",
    "forcePublish",
    "isPlatformProduct",
    "globalScope",
    "hasVariants",
    "variations",
    "imageUrls",
  ];
  const seenForbidden = new Set<string>();
  for (const payload of payloads) {
    if (!payload || typeof payload !== "object") continue;
    for (const key of Object.keys(payload as Record<string, unknown>)) {
      if (forbidden.includes(key)) seenForbidden.add(key);
    }
  }
  if (seenForbidden.size) {
    throw new Error(`Seller draft payload exposed forbidden keys: ${Array.from(seenForbidden).join(", ")}`);
  }
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const ownerToken = await buildToken(fixture.ownerId);
  const memberToken = await buildToken(fixture.memberId);
  const stamp = Date.now();
  const productName = `S26 Product Smoke ${stamp}`;
  const sku = `S26-PROD-${stamp}`;

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const draftPayloads: unknown[] = [];
  const mutationRequests: string[] = [];
  const mutationResponses: string[] = [];
  const blockedMutationRequests: string[] = [];
  const results: Record<string, unknown> = {};

  try {
    const owner = await newAuthedPage(browser, ownerToken);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      const url = request.url();
      if (["DELETE", "PATCH", "POST", "PUT"].includes(method) && /\/api\/seller\/stores\/[^/]+\/products/i.test(url)) {
        mutationRequests.push(`${method} ${url}`);
        if (/\/products\/drafts$|\/products\/[^/]+\/draft$/i.test(url)) {
          try {
            draftPayloads.push(request.postDataJSON());
          } catch {
            draftPayloads.push(request.postData());
          }
        }
        if (/\/published|\/duplicate|\/upload|\/image|\/media|\/variant/i.test(url) || method === "DELETE") {
          blockedMutationRequests.push(`${method} ${url}`);
        }
      }
    });
    owner.page.on("response", async (response) => {
      const url = response.url();
      if (/\/api\/seller\/stores\/[^/]+\/products/i.test(url)) {
        const body = await response.text().catch(() => "");
        mutationResponses.push(`${response.status()} ${url} ${body.replace(/\s+/g, " ").slice(0, 260)}`);
      }
    });
    await setSeller2026ProductFlags(owner.page, true);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/new`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.getByText("Product Create Shell").waitFor({ timeout: 20_000 });
    await fillField(owner.page, "Product Name", productName);
    await fillField(owner.page, "SKU", sku);
    await fillField(owner.page, "Price", "123000");
    await fillField(owner.page, "Stock", "12");
    await fillField(owner.page, "Category IDs", "1");
    await fillField(owner.page, "Description", "Smoke product draft for Seller Workspace 2026 authoring sync.");
    const saveDraftButton = owner.page.getByRole("button", { name: "Save Draft" });
    if (await saveDraftButton.isDisabled()) {
      throw new Error(`Save Draft is disabled before create. Page: ${await bodySnippet(owner.page)}`);
    }
    await saveDraftButton.click();
    const navigatedToEdit = await owner.page
      .waitForURL(/\/catalog\/products\/\d+\/edit$/, { timeout: 30_000 })
      .then(() => true)
      .catch(() => false);
    if (!navigatedToEdit) {
      throw new Error(`Draft save did not navigate to edit. Mutations: ${mutationRequests.join(" | ")}. Responses: ${mutationResponses.join(" | ")}. Page: ${await bodySnippet(owner.page)}`);
    }
    await owner.page.getByText("Product draft created.").waitFor({ timeout: 20_000 }).catch(() => undefined);
    const match = owner.page.url().match(/\/catalog\/products\/(\d+)\/edit$/);
    const productId = Number(match?.[1] || 0);
    if (!productId) throw new Error(`Could not parse product id from ${owner.page.url()}`);

    await owner.page.getByText("Ready to submit").waitFor({ timeout: 20_000 });
    await owner.page.getByText("Publishing stays under Admin approval.").waitFor({ timeout: 10_000 });
    const absentPublish = await owner.page.getByRole("button", { name: /^Publish$/i }).count();
    if (absentPublish > 0) throw new Error("Direct Publish button is exposed.");
    for (const name of ["Upload Media", "Edit Variants", "Publish Product", "Duplicate Product", "Archive Product"]) {
      const button = owner.page.getByRole("button", { name });
      await button.waitFor({ state: "visible", timeout: 10_000 });
      if (!(await button.isDisabled())) throw new Error(`${name} guardrail is not disabled.`);
    }
    if ((await enabledButtonCount(owner.page, /^Delete$/i)) > 0) {
      throw new Error("Delete product action is unexpectedly enabled.");
    }
    if ((await enabledButtonCount(owner.page, /^Duplicate$/i)) > 0) {
      throw new Error("Duplicate product action is unexpectedly enabled.");
    }
    if ((await enabledButtonCount(owner.page, /^Upload$/i)) > 0) {
      throw new Error("Media upload action is unexpectedly enabled.");
    }
    if ((await enabledButtonCount(owner.page, /^Edit Variants$/i)) > 0) {
      throw new Error("Variant mutation action is unexpectedly enabled.");
    }

    assertSellerDraftPayload(draftPayloads);
    await owner.page.getByRole("button", { name: "Submit Review" }).click();
    await owner.page.getByText("Product submitted for review.").waitFor({ timeout: 25_000 });
    const submittedProduct = await Product.findByPk(productId);
    if (!submittedProduct) throw new Error("Created smoke product was not persisted.");
    if (
      (submittedProduct as any).sellerSubmissionStatus !== "submitted" ||
      (submittedProduct as any).status !== "draft" ||
      Boolean((submittedProduct as any).isPublished) !== false
    ) {
      throw new Error(
        `Product governance mismatch: status=${(submittedProduct as any).status}, submission=${(submittedProduct as any).sellerSubmissionStatus}, published=${(submittedProduct as any).isPublished}`
      );
    }

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/${productId}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.getByText(productName).waitFor({ timeout: 20_000 });
    await owner.page.getByText("Submitted").first().waitFor({ timeout: 20_000 });
    // await owner.page.getByText(/This product is already waiting for review/i).waitFor({ timeout: 20_000 });

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products?search=${encodeURIComponent(sku)}`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.getByText(productName).first().waitFor({ timeout: 20_000 });
    await owner.page.getByText("Submitted").first().waitFor({ timeout: 20_000 });

    results.owner = {
      status: "PASS",
      productId,
      mutationRequests,
      payloadKeys: Object.keys((draftPayloads[0] as Record<string, unknown>) || {}),
      snippet: await bodySnippet(owner.page),
    };
    await owner.context.close();

    const publicPage = await browser.newPage({ baseURL: CLIENT_URL, viewport: { width: 1366, height: 900 } });
    const publicRoutes = [
      `/search?q=${encodeURIComponent(productName)}&page=1`,
      `/store/${fixture.storeSlug}?view=products&q=${encodeURIComponent(productName)}`,
      `/store/${fixture.storeSlug}/products/${encodeURIComponent(String((submittedProduct as any).slug || productName))}`,
    ];
    const publicSnippets: Record<string, string> = {};
    for (const route of publicRoutes) {
      await publicPage.goto(route, { waitUntil: "networkidle", timeout: 45_000 });
      const text = await bodySnippet(publicPage);
      publicSnippets[route] = text;
      if (text.includes(sku)) {
        throw new Error(`Submitted draft leaked to public storefront route ${route}: ${text}`);
      }
    }
    await publicPage.close();
    results.publicStorefront = { status: "PASS", routes: publicRoutes, snippets: publicSnippets };

    const cross = await newAuthedPage(browser, ownerToken);
    await setSeller2026ProductFlags(cross.page, true);
    await cross.page.goto(`/seller/stores/${fixture.otherStoreSlug}/catalog/products/${productId}/edit`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossText = await bodySnippet(cross.page);
    if (crossText.includes(productName) || (await enabledButtonCount(cross.page, /Save Draft|Save Changes/i)) > 0) {
      throw new Error(`Cross-store route exposed editable smoke product: ${crossText}`);
    }
    results.crossStoreGuard = { status: "PASS", snippet: crossText };
    await cross.context.close();

    const member = await newAuthedPage(browser, memberToken);
    await setSeller2026ProductFlags(member.page, true);
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/new`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const memberText = await bodySnippet(member.page);
    if ((await enabledButtonCount(member.page, /Save Draft|Save Changes/i)) > 0) {
      throw new Error("Member without product create/update permission can save a product draft.");
    }
    if ((await enabledButtonCount(member.page, "Submit Review")) > 0) {
      throw new Error("Member without product submit permission can submit review.");
    }
    results.memberPermissions = { status: "PASS", snippet: memberText };
    await member.context.close();

    if (blockedMutationRequests.length) {
      throw new Error(`Blocked product mutation request was sent: ${blockedMutationRequests.join(" | ")}`);
    }
    const fatalConsole = fatalMessages(consoleErrors);
    const fatalPageErrors = fatalMessages(pageErrors);
    if (fatalConsole.length || fatalPageErrors.length) {
      throw new Error(`Browser errors: console=${fatalConsole.join(" | ")} page=${fatalPageErrors.join(" | ")}`);
    }

    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
