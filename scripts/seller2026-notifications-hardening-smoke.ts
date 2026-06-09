import { createRequire } from "node:module";
import { chromium, type Browser, type Page } from "playwright";
import { Notification, sequelize, User } from "../server/src/models/index.js";
import { buildAuthSessionClaims } from "../server/src/services/authSession.service.js";
import { ensureSeller2026AuthSmokeFixture } from "./seller2026-auth-fixture-live-smoke.ts";

const requireFromServer = createRequire(new URL("../server/package.json", import.meta.url));
const jwt = requireFromServer("jsonwebtoken") as typeof import("jsonwebtoken");

const CLIENT_URL = String(process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
const API_URL = String(process.env.API_URL || "http://localhost:3001").replace(/\/+$/, "");

type Fixture = Awaited<ReturnType<typeof ensureSeller2026AuthSmokeFixture>>;

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

async function setFixtureNotificationsUnread(fixture: Fixture) {
  const ids = [fixture.notificationId, fixture.secondaryNotificationId]
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);
  if (!ids.length) throw new Error("Notification fixture ids are missing.");
  await Notification.update({ isRead: false } as any, { where: { id: ids } as any });
  return ids;
}

async function readUnreadCount(page: Page, storeId: number) {
  const response = await page.request.get(`${API_URL}/api/seller/stores/${storeId}/notifications/unread-count`);
  const body = await response.json().catch(() => ({}));
  return {
    ok: response.ok(),
    status: response.status(),
    count: Number(body?.data?.count ?? body?.count ?? 0) || 0,
  };
}

async function assertNoSellerShell(page: Page, path: string) {
  await page.goto(path, { waitUntil: "networkidle", timeout: 45_000 });
  const text = await page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
  if (/TP PRENEURS SELLER WORKSPACE|Notifications Center/i.test(text)) {
    throw new Error(`${path} unexpectedly rendered Seller notifications shell.`);
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 180);
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");
  await waitForOk(CLIENT_URL, "client");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  await setFixtureNotificationsUnread(fixture);

  const browser = await chromium.launch({ headless: true });
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const results: Record<string, unknown> = {};

  try {
    const owner = await newAuthedPage(browser, fixture.ownerEmail);
    owner.page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    owner.page.on("pageerror", (error) => pageErrors.push(error.message));

    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/notifications`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    await owner.page.getByText(/Notifications Center/i).waitFor({ state: "visible", timeout: 15_000 });
    const ownerInitialText = await owner.page.locator("body").innerText({ timeout: 10_000 });
    const unreadBeforeOne = await readUnreadCount(owner.page, fixture.storeId);
    if (!unreadBeforeOne.ok || unreadBeforeOne.count < 1) {
      throw new Error(`Expected unread notifications before mark-one, got ${unreadBeforeOne.count}.`);
    }

    await owner.page.getByRole("button", { name: /^Mark as read$/i }).first().click();
    await owner.page.getByText(/Notification marked as read\./i).waitFor({ state: "visible", timeout: 20_000 });
    const unreadAfterOne = await readUnreadCount(owner.page, fixture.storeId);
    await owner.page.reload({ waitUntil: "networkidle", timeout: 45_000 });
    const unreadAfterOneReload = await readUnreadCount(owner.page, fixture.storeId);
    if (unreadAfterOne.count >= unreadBeforeOne.count || unreadAfterOneReload.count !== unreadAfterOne.count) {
      throw new Error(
        `Mark-one did not persist: ${unreadBeforeOne.count} -> ${unreadAfterOne.count} -> ${unreadAfterOneReload.count}.`
      );
    }

    await setFixtureNotificationsUnread(fixture);
    await owner.page.goto(`/seller/stores/${fixture.storeSlug}/notifications`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const unreadBeforeAll = await readUnreadCount(owner.page, fixture.storeId);
    if (!unreadBeforeAll.ok || unreadBeforeAll.count < 1) {
      throw new Error(`Expected unread notifications before mark-all, got ${unreadBeforeAll.count}.`);
    }
    await owner.page.getByRole("button", { name: /^Mark all as read$/i }).click();
    await owner.page.getByText(/All notifications marked as read\./i).waitFor({ state: "visible", timeout: 20_000 });
    const unreadAfterAll = await readUnreadCount(owner.page, fixture.storeId);
    await owner.page.reload({ waitUntil: "networkidle", timeout: 45_000 });
    const unreadAfterAllReload = await readUnreadCount(owner.page, fixture.storeId);
    if (unreadAfterAll.count !== 0 || unreadAfterAllReload.count !== 0) {
      throw new Error(`Mark-all did not persist: ${unreadAfterAll.count} -> ${unreadAfterAllReload.count}.`);
    }

    results.owner = {
      status: "PASS",
      unreadBeforeOne: unreadBeforeOne.count,
      unreadAfterOne: unreadAfterOne.count,
      unreadAfterOneReload: unreadAfterOneReload.count,
      unreadBeforeAll: unreadBeforeAll.count,
      unreadAfterAll: unreadAfterAll.count,
      unreadAfterAllReload: unreadAfterAllReload.count,
      snippet: ownerInitialText.replace(/\s+/g, " ").trim().slice(0, 180),
    };

    await owner.page.goto(`/seller/stores/${fixture.otherStoreSlug}/notifications`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const crossText = await owner.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Access Forbidden|permission/i.test(crossText) || /Other Demo Store.*Notifications Center/i.test(crossText)) {
      throw new Error("Cross-store notification route did not render a safe forbidden state.");
    }
    results.crossStore = {
      status: "PASS",
      finalUrl: owner.page.url().replace(CLIENT_URL, ""),
      snippet: crossText.replace(/\s+/g, " ").trim().slice(0, 180),
    };
    await owner.context.close();

    const member = await newAuthedPage(browser, fixture.memberEmail);
    await member.page.goto(`/seller/stores/${fixture.storeSlug}/notifications`, {
      waitUntil: "networkidle",
      timeout: 45_000,
    });
    const memberText = await member.page.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Notifications Center|Access Forbidden|permission/i.test(memberText)) {
      throw new Error("Role-limited member notification route did not render read-safe or permission-safe UI.");
    }
    results.member = {
      status: "PASS",
      finalUrl: member.page.url().replace(CLIENT_URL, ""),
      snippet: memberText.replace(/\s+/g, " ").trim().slice(0, 180),
    };
    await member.context.close();

    const publicContext = await browser.newContext({ baseURL: CLIENT_URL, viewport: { width: 1366, height: 900 } });
    const publicPage = await publicContext.newPage();
    await publicPage.goto("/seller-2026/notifications", { waitUntil: "networkidle", timeout: 45_000 });
    const previewText = await publicPage.locator("body").innerText({ timeout: 10_000 }).catch(() => "");
    if (!/Notifications/i.test(previewText)) throw new Error("Preview notifications route did not render.");
    results.preview = { status: "PASS", snippet: previewText.replace(/\s+/g, " ").trim().slice(0, 180) };
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
      status: fatalConsoleErrors.length || pageErrors.length ? "FAIL" : "PASS",
      fatalConsoleErrors: fatalConsoleErrors.length,
      pageErrors: pageErrors.length,
    },
    consoleErrors,
    pageErrors,
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
