import { createRequire } from "node:module";
import { Coupon, sequelize, User } from "../server/src/models/index.js";
import { buildAuthSessionClaims } from "../server/src/services/authSession.service.js";
import { buildSeller2026CouponPayload } from "../client/src/api/seller2026/coupons.mutations.ts";
import { ensureSeller2026AuthSmokeFixture } from "./seller2026-auth-fixture-live-smoke.ts";

const requireFromServer = createRequire(new URL("../server/package.json", import.meta.url));
const jwt = requireFromServer("jsonwebtoken") as typeof import("jsonwebtoken");

const API_URL = String(
  process.env.SELLER2026_API_BASE_URL ||
    process.env.API_URL ||
    process.env.VITE_SERVER_ORIGIN ||
    "http://localhost:3001"
).replace(/\/+$/, "");

type ApiResult = {
  status: number;
  body: any;
};

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

async function api(
  token: string,
  path: string,
  init: RequestInit = {}
): Promise<ApiResult> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  return { status: response.status, body };
}

function assertOk(result: ApiResult, label: string) {
  if (result.status < 200 || result.status >= 300 || result.body?.success === false) {
    throw new Error(`${label} failed: ${result.status} ${JSON.stringify(result.body)}`);
  }
}

function assertForbidden(result: ApiResult, label: string) {
  if (result.status !== 403 && result.status !== 404) {
    throw new Error(`${label} expected 403/404, got ${result.status} ${JSON.stringify(result.body)}`);
  }
}

function assertNoForbiddenPayloadFields(payload: Record<string, unknown>) {
  const forbidden = [
    "storeId",
    "ownerId",
    "sellerId",
    "adminOnly",
    "platformScope",
    "globalScope",
    "createdByRole",
    "usageCount",
    "usedCount",
    "orderIds",
    "forceActive",
    "bypassValidation",
    "bannerImageUrl",
  ];
  const hits = forbidden.filter((field) => Object.prototype.hasOwnProperty.call(payload, field));
  if (hits.length) throw new Error(`Forbidden payload fields were built: ${hits.join(", ")}`);
}

async function main() {
  await waitForOk(`${API_URL}/api/health`, "API");

  const fixture = await ensureSeller2026AuthSmokeFixture();
  const ownerToken = await buildToken(fixture.ownerId);
  const memberToken = await buildToken(fixture.memberId);
  const code = `S26SYNC${Date.now()}`;
  const route = `/api/seller/stores/${fixture.storeId}/coupons`;

  const dirtyPayload = buildSeller2026CouponPayload({
    code,
    name: `${code} Campaign`,
    discountType: "percent",
    discountValue: 11,
    minimumOrderValue: 25000,
    active: true,
    startsAt: "",
    expiresAt: "",
    storeId: fixture.otherStoreId,
    sellerId: fixture.memberId,
    platformScope: true,
    usageCount: 99,
    forceActive: true,
    bannerImageUrl: "https://example.test/banner.webp",
  } as any);
  assertNoForbiddenPayloadFields(dirtyPayload);

  const listBefore = await api(ownerToken, route);
  assertOk(listBefore, "list seller coupons");
  const listItems = listBefore.body?.data?.items || [];
  const nonStoreItems = listItems.filter(
    (item: any) => item.scopeType !== "STORE" || Number(item.storeId) !== Number(fixture.storeId)
  );
  if (nonStoreItems.length) {
    throw new Error("Seller coupon list exposed non-store or cross-store coupons.");
  }

  const memberCreate = await api(memberToken, route, {
    method: "POST",
    body: JSON.stringify(dirtyPayload),
  });
  assertForbidden(memberCreate, "member coupon create");

  const crossStoreList = await api(ownerToken, `/api/seller/stores/${fixture.otherStoreId}/coupons`);
  assertForbidden(crossStoreList, "cross-store coupon list");

  const create = await api(ownerToken, route, {
    method: "POST",
    body: JSON.stringify(dirtyPayload),
  });
  assertOk(create, "create store coupon");
  const couponId = create.body?.data?.id;
  if (!couponId) throw new Error("Create did not return a coupon id.");

  const updatePayload = buildSeller2026CouponPayload({
    code,
    campaignName: `${code} Updated`,
    discountType: "fixed",
    amount: 12000,
    minSpend: 50000,
    active: true,
  });
  assertNoForbiddenPayloadFields(updatePayload);
  const update = await api(ownerToken, `${route}/${couponId}`, {
    method: "PATCH",
    body: JSON.stringify(updatePayload),
  });
  assertOk(update, "update store coupon");
  if (update.body?.data?.campaignName !== `${code} Updated` || update.body?.data?.amount !== 12000) {
    throw new Error("Updated coupon response did not reflect the lifecycle update.");
  }

  const deactivate = await api(ownerToken, `${route}/${couponId}`, {
    method: "PATCH",
    body: JSON.stringify({ active: false }),
  });
  assertOk(deactivate, "deactivate store coupon");
  if (deactivate.body?.data?.active !== false) throw new Error("Deactivate did not set active=false.");

  const activate = await api(ownerToken, `${route}/${couponId}`, {
    method: "PATCH",
    body: JSON.stringify({ active: true }),
  });
  assertOk(activate, "activate store coupon");
  if (activate.body?.data?.active !== true) throw new Error("Activate did not set active=true.");

  const archive = await api(ownerToken, `${route}/${couponId}`, { method: "DELETE" });
  assertOk(archive, "archive store coupon");

  const stored = await Coupon.findByPk(couponId);
  if (!stored) throw new Error("Archive hard-deleted the coupon record.");
  if (Boolean((stored as any).active) !== false) {
    throw new Error("Archive did not leave the coupon inactive.");
  }
  if (Number((stored as any).storeId) !== Number(fixture.storeId) || (stored as any).scopeType !== "STORE") {
    throw new Error("Stored coupon scope changed unexpectedly.");
  }

  const listAfter = await api(ownerToken, route);
  assertOk(listAfter, "list after archive");
  const archivedItem = (listAfter.body?.data?.items || []).find((item: any) => Number(item.id) === Number(couponId));
  if (!archivedItem || archivedItem.active !== false) {
    throw new Error("Archived coupon was not returned as inactive in seller list.");
  }

  const output = {
    status: "SELLER_2026_COUPON_LIFECYCLE_SYNC_PASS",
    apiUrl: API_URL,
    fixture: {
      storeId: fixture.storeId,
      storeSlug: fixture.storeSlug,
      otherStoreId: fixture.otherStoreId,
    },
    lifecycle: {
      code,
      couponId,
      create: "PASS",
      update: "PASS",
      activateDeactivate: "PASS",
      archiveAsDeactivate: "PASS",
      noHardDelete: "PASS",
      storeScopedList: "PASS",
      memberGuard: "PASS",
      crossStoreGuard: "PASS",
      payloadWhitelist: "PASS",
    },
  };
  console.log(JSON.stringify(output, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close().catch(() => undefined);
  });
