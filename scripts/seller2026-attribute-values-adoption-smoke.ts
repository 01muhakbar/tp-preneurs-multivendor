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

async function setAttributesFlag(page: Page, enabled: boolean) {
  await page.route("**/sellerWorkspace2026Flags.js*", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    const mockedBody = body
      .replace(
        /enabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ENABLED === 'true'/,
        `enabled: ${enabled ? "true" : "false"}`
      )
      .replace(
        /attributesEnabled:\s*import\.meta\.env\.VITE_SELLER_WORKSPACE_2026_ATTRIBUTES_ENABLED === 'true'/,
        `attributesEnabled: ${enabled ? "true" : "false"}`
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

async function createAttributeForSmoke(page: Page, storeId: number, name: string) {
  const response = await page.request.post(`${API_URL}/api/seller/stores/${storeId}/attributes`, {
    data: {
      name,
      displayName: name,
      type: "dropdown",
      values: ["Seed"],
      published: true,
    },
  });
  if (!response.ok()) {
    throw new Error(`Attribute fixture create failed: ${response.status()} ${await response.text()}`);
  }
  const body = await response.json();
  const attributeId = Number(body?.data?.id || body?.id || 0);
  if (!attributeId) throw new Error(`Attribute fixture create did not return an id: ${JSON.stringify(body)}`);
  return attributeId;
}

async function findValueRow(page: Page, label: string) {
  await page.getByLabel("Search attribute values").fill(label);
  await page.waitForLoadState("networkidle", { timeout: 45_000 });
  const row = page.locator("tr", { hasText: label }).first();
  await row.waitFor({ state: "visible", timeout: 15_000 });
  return row;
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const fixtureProduct = await Product.findOne({ where: { storeId: fixture.storeId } });
  const fixtureProductId = Number((fixtureProduct as any)?.id || 0);
  const uniqueSuffix = Date.now();
  const attributeName = `S26-ATTR-VALUE-SMOKE-${uniqueSuffix}`;
  const valueName = `S26-VALUE-${uniqueSuffix}`;
  const updatedValueName = `${valueName}-UPDATED`;
  const cleanedValueName = `${valueName}-CLEANED`;

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const ownerMutations: string[] = [];
  const blockedMutations: string[] = [];
  const results: Record<string, unknown> = {};
  let attributeId = 0;

  try {
    let owner = await newAuthedPage(browser, fixture.ownerEmail);
    attributeId = await createAttributeForSmoke(owner.page, fixture.storeId, attributeName);
    results.fixtureAttribute = { status: "PASS", attributeId };
    await owner.context.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setAttributesFlag(owner.page, false);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes/${attributeId}/values`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    if ((await owner.page.locator("[data-seller2026-live-attribute-values='true']").count()) > 0) {
      throw new Error("Seller 2026 Attribute Values rendered when flags were OFF.");
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
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/attributes/i.test(request.url())) {
        ownerMutations.push(`${method} ${request.url()}`);
      }
    });
    await setAttributesFlag(owner.page, true);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes/${attributeId}/values`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.locator("[data-seller2026-live-attribute-values='true']").waitFor({ timeout: 15_000 });
    const livePath = new URL(owner.page.url()).pathname;
    if (!livePath.endsWith(`/seller/stores/${fixture.storeSlug}/catalog/attributes/${attributeId}/values`)) {
      throw new Error(`Attribute Values route is not canonical: ${livePath}`);
    }
    results.flagsOn = { status: "PASS", finalUrl: livePath, snippet: await bodySnippet(owner.page) };

    await owner.page.getByRole("button", { name: "Add Value" }).click();
    const createDialog = owner.page.getByRole("dialog", { name: "Add Value" });
    await createDialog.getByLabel("Label").fill(valueName);
    await createDialog.getByLabel("Value", { exact: true }).fill(valueName);
    await createDialog.getByRole("button", { name: "Add Value" }).click();
    await owner.page.getByText("Value created.").waitFor({ timeout: 20_000 });
    let valueRow = await findValueRow(owner.page, valueName);
    results.ownerCreate = { status: "PASS" };

    const statusButton = valueRow.getByRole("button", { name: /Publish|Unpublish/ }).first();
    if ((await statusButton.count()) === 0 || !(await statusButton.isDisabled())) {
      throw new Error("Attribute value publish/unpublish control is not disabled.");
    }
    const deleteButton = valueRow.getByRole("button", { name: "Delete" }).first();
    if ((await deleteButton.count()) === 0 || !(await deleteButton.isDisabled())) {
      throw new Error("Attribute value delete control is not disabled.");
    }
    results.publishDeleteGuards = { status: "PASS", publishDisabled: true, deleteDisabled: true };

    await valueRow.getByRole("button", { name: "Edit" }).click();
    const updateDialog = owner.page.getByRole("dialog", { name: "Update Value" });
    await updateDialog.getByLabel("Label").fill(updatedValueName);
    await updateDialog.getByLabel("Value", { exact: true }).fill(updatedValueName);
    await updateDialog.getByRole("button", { name: "Update Value" }).click();
    await owner.page.getByText("Value updated.").waitFor({ timeout: 20_000 });
    valueRow = await findValueRow(owner.page, updatedValueName);
    results.ownerUpdate = { status: "PASS" };

    await valueRow.getByRole("button", { name: "Edit" }).click();
    const cleanupDialog = owner.page.getByRole("dialog", { name: "Update Value" });
    await cleanupDialog.getByLabel("Label").fill(cleanedValueName);
    await cleanupDialog.getByLabel("Value", { exact: true }).fill(cleanedValueName);
    await cleanupDialog.getByRole("button", { name: "Update Value" }).click();
    await owner.page.getByText("Value updated.").waitFor({ timeout: 20_000 });
    await findValueRow(owner.page, cleanedValueName);
    results.cleanup = { status: "PASS", strategy: "RENAMED_NO_DELETE", value: cleanedValueName };

    await owner.page.getByRole("link", { name: "Back to Attributes" }).click();
    await owner.page.waitForLoadState("networkidle", { timeout: 45_000 });
    if (!new URL(owner.page.url()).pathname.endsWith(`/seller/stores/${fixture.storeSlug}/catalog/attributes`)) {
      throw new Error(`Back to Attributes did not navigate to canonical route: ${owner.page.url()}`);
    }
    results.backLink = { status: "PASS", finalUrl: new URL(owner.page.url()).pathname };
    await owner.context.close();

    const member = await newAuthedPage(browser, fixture.memberEmail);
    await setAttributesFlag(member.page, true);
    member.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/attributes/i.test(request.url())) {
        blockedMutations.push(`member ${method} ${request.url()}`);
      }
    });
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes/${attributeId}/values`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const memberCreate = member.page.getByRole("button", { name: "Add Value" });
    const memberCanSeeCreate = (await memberCreate.count()) > 0;
    if (memberCanSeeCreate && !(await memberCreate.first().isDisabled())) {
      await memberCreate.first().click().catch(() => undefined);
    }
    await member.page.waitForTimeout(500);
    results.member = {
      status: blockedMutations.length === 0 ? "PASS" : "FAIL",
      createVisible: memberCanSeeCreate,
      createDisabled: memberCanSeeCreate ? await memberCreate.first().isDisabled() : true,
      snippet: await bodySnippet(member.page),
    };
    await member.context.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setAttributesFlag(owner.page, true);
    owner.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/attributes/i.test(request.url())) {
        blockedMutations.push(`cross-store ${method} ${request.url()}`);
      }
    });
    await owner.page.goto(`/seller/stores/${fixture.otherStoreSlug}/catalog/attributes/${attributeId}/values`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Access Forbidden|permission|not found|not available/i.test(crossText)) {
      throw new Error("Cross-store Attribute Values route did not render forbidden-safe UI.");
    }
    results.crossStore = { status: "PASS", snippet: crossText.replace(/\s+/g, " ").trim().slice(0, 180) };

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes/999999999/values`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const missingText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/not found|not available|could not be loaded|unavailable/i.test(missingText)) {
      throw new Error("Missing attribute values route did not render not-found-safe UI.");
    }
    results.crossAttribute = { status: "PASS", snippet: missingText.replace(/\s+/g, " ").trim().slice(0, 180) };
    await owner.context.close();

    const previewContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 390, height: 900 } });
    const previewPage = await previewContext.newPage();
    await previewPage.goto(`/seller-2026/catalog/attributes/${attributeId}/values`, { waitUntil: "networkidle", timeout: 45_000 });
    const previewText = await previewPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Attribute Values|Attributes/i.test(previewText)) throw new Error("Preview Attribute Values route did not render.");
    results.preview = { status: "PASS", snippet: previewText.replace(/\s+/g, " ").trim().slice(0, 180) };
    await previewContext.close();

    owner = await newAuthedPage(browser, fixture.ownerEmail);
    await setAttributesFlag(owner.page, true);
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
      attributeId,
    },
    summary: {
      status:
        fatalConsoleErrors.length ||
        pageErrors.length ||
        blockedMutations.length ||
        ownerMutationSummary.post < 1 ||
        ownerMutationSummary.patch < 2 ||
        ownerMutationSummary.delete > 0
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
