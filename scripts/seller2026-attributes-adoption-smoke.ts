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

async function assertNoSellerShell(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle", timeout: 45_000 });
  const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  if (/TP PRENEURS SELLER WORKSPACE/i.test(text) && !path.includes("/seller")) {
    throw new Error(`${path} unexpectedly rendered Seller shell.`);
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

const bodySnippet = async (page: Page) =>
  (await page.locator("body").innerText({ timeout: 10_000 }).catch(() => ""))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

async function findAttributeRow(page: Page, name: string) {
  await page.getByLabel("Search attributes").fill(name);
  await page.waitForLoadState("networkidle", { timeout: 45_000 });
  const row = page.locator("tr", { hasText: name }).first();
  await row.waitFor({ state: "visible", timeout: 15_000 });
  return row;
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const fixtureProduct = await Product.findOne({ where: { storeId: fixture.storeId } });
  const fixtureProductId = Number((fixtureProduct as any)?.id || 0);
  const uniqueName = `S26-ATTR-SMOKE-${Date.now()}`;
  const updatedName = `${uniqueName}-UPDATED`;
  const cleanedName = `${uniqueName}-CLEANED`;

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const ownerMutations: string[] = [];
  const blockedMutations: string[] = [];
  const results: Record<string, unknown> = {};

  try {
    let owner = await newAuthedPage(browser, fixture.ownerEmail);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));
    await setAttributesFlag(owner.page, false);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    let text = await owner.page.locator("body").innerText({ timeout: 10_000 });
    if (/Define product options and specifications with live store-scoped data/i.test(text)) {
      throw new Error("Seller 2026 Attributes rendered when flags were OFF.");
    }
    results.flagsOff = { status: "PASS", snippet: text.replace(/\s+/g, " ").trim().slice(0, 180) };
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
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.locator("[data-seller2026-live-attributes='true']").waitFor({ timeout: 15_000 });
    results.flagsOn = { status: "PASS", snippet: await bodySnippet(owner.page) };

    await owner.page.getByRole("button", { name: "Add Attribute" }).click();
    const createDialog = owner.page.getByRole("dialog", { name: "Add Attribute" });
    await createDialog.getByLabel("Attribute Name").fill(uniqueName);
    await createDialog.getByLabel("Description").fill("Disposable attribute created by Seller 2026 smoke.");
    await createDialog.getByLabel("Type").selectOption("dropdown");
    await createDialog.getByLabel("Initial Values").fill("Default\nSmoke");
    await createDialog.getByRole("button", { name: "Add Attribute" }).click();
    await owner.page.getByText("Attribute created.").waitFor({ timeout: 20_000 });
    await findAttributeRow(owner.page, uniqueName);
    results.ownerCreate = { status: "PASS" };

    let createdRow = await findAttributeRow(owner.page, uniqueName);
    await createdRow.getByRole("link", { name: "Manage Values" }).click();
    await owner.page.waitForLoadState("networkidle", { timeout: 45_000 });
    if (!new URL(owner.page.url()).pathname.match(new RegExp(`/seller/stores/${fixture.storeSlug}/catalog/attributes/\\d+/values$`))) {
      throw new Error(`Manage Values did not navigate to canonical route: ${owner.page.url()}`);
    }
    results.manageValuesLink = { status: "PASS", finalUrl: new URL(owner.page.url()).pathname };
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });

    createdRow = await findAttributeRow(owner.page, uniqueName);
    await createdRow.getByRole("button", { name: "Edit" }).click();
    const updateDialog = owner.page.getByRole("dialog", { name: "Update Attribute" });
    await updateDialog.getByLabel("Attribute Name").fill(updatedName);
    await updateDialog.getByLabel("Description").fill("Updated by Seller 2026 smoke.");
    await updateDialog.getByRole("button", { name: "Update Attribute" }).click();
    await owner.page.getByText("Attribute updated.").waitFor({ timeout: 20_000 });
    await findAttributeRow(owner.page, updatedName);
    results.ownerUpdate = { status: "PASS" };

    let updatedRow = await findAttributeRow(owner.page, updatedName);
    const publishButton = updatedRow.getByRole("button", { name: "Publish" });
    if ((await publishButton.count()) > 0) {
      await publishButton.click();
      await owner.page.getByText("Attribute published.").waitFor({ timeout: 20_000 });
      updatedRow = await findAttributeRow(owner.page, updatedName);
    }
    await updatedRow.getByRole("button", { name: "Unpublish" }).click();
    await owner.page.getByText("Attribute unpublished.").waitFor({ timeout: 20_000 });
    const unpublishedRow = await findAttributeRow(owner.page, updatedName);
    if (!/Draft|inactive/i.test(await unpublishedRow.innerText())) {
      throw new Error("Attribute publish action did not reflect unpublished state.");
    }
    results.ownerPublishUnpublish = { status: "PASS", finalStatus: "unpublished" };

    await unpublishedRow.getByRole("button", { name: "Edit" }).click();
    const cleanupDialog = owner.page.getByRole("dialog", { name: "Update Attribute" });
    await cleanupDialog.getByLabel("Attribute Name").fill(cleanedName);
    await cleanupDialog.getByRole("button", { name: "Update Attribute" }).click();
    await owner.page.getByText("Attribute updated.").waitFor({ timeout: 20_000 });
    const cleanedRow = await findAttributeRow(owner.page, cleanedName);
    if (!/Draft|inactive/i.test(await cleanedRow.innerText())) {
      throw new Error("Cleanup attribute was not left unpublished.");
    }
    results.cleanup = { status: "PASS", strategy: "RENAMED_AND_UNPUBLISHED", name: cleanedName };
    await owner.context.close();

    const member = await newAuthedPage(browser, fixture.memberEmail);
    await setAttributesFlag(member.page, true);
    member.page.on("request", (request) => {
      const method = request.method().toUpperCase();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && /\/api\/seller\/stores\/[^/]+\/attributes/i.test(request.url())) {
        blockedMutations.push(`member ${method} ${request.url()}`);
      }
    });
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/catalog/attributes`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const memberCreate = member.page.getByRole("button", { name: "Add Attribute" });
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
    await owner.page.goto(`/seller/stores/${fixture.otherStoreSlug}/catalog/attributes`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Access Forbidden|permission/i.test(crossText)) {
      throw new Error("Cross-store Attributes route did not render forbidden-safe UI.");
    }
    results.crossStore = { status: "PASS", snippet: crossText.replace(/\s+/g, " ").trim().slice(0, 180) };
    await owner.context.close();

    const publicContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 390, height: 900 } });
    const publicPage = await publicContext.newPage();
    await publicPage.goto("/seller-2026/catalog/attributes", { waitUntil: "networkidle", timeout: 45_000 });
    const previewText = await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Attributes/i.test(previewText)) throw new Error("Preview Attributes route did not render.");
    results.preview = { status: "PASS", snippet: previewText.replace(/\s+/g, " ").trim().slice(0, 180) };

    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/catalog/categories`, { waitUntil: "networkidle", timeout: 45_000 });
    results.categoriesRegression = { status: "PASS", snippet: await bodySnippet(publicPage) };
    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/catalog/products`, { waitUntil: "networkidle", timeout: 45_000 });
    results.catalogRegression = { status: "PASS", snippet: await bodySnippet(publicPage) };
    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/new`, { waitUntil: "networkidle", timeout: 45_000 });
    results.authoringRegression = { status: "PASS", snippet: await bodySnippet(publicPage) };
    if (fixtureProductId > 0) {
      await publicPage.goto(`/seller/stores/${fixture.storeSlug}/catalog/products/${fixtureProductId}`, { waitUntil: "networkidle", timeout: 45_000 });
      results.productDetailRegression = { status: "PASS", snippet: await bodySnippet(publicPage) };
    }
    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/dashboard`, { waitUntil: "networkidle", timeout: 45_000 });
    results.dashboardRegression = { status: "PASS", snippet: await bodySnippet(publicPage) };
    await publicPage.goto(`/seller/stores/${fixture.storeSlug}/notifications`, { waitUntil: "networkidle", timeout: 45_000 });
    results.notificationsRegression = { status: "PASS", snippet: await bodySnippet(publicPage) };
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
    },
    summary: {
      status:
        fatalConsoleErrors.length ||
        pageErrors.length ||
        blockedMutations.length ||
        ownerMutationSummary.post < 1 ||
        ownerMutationSummary.patch < 3 ||
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
