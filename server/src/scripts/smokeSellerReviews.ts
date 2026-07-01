import "dotenv/config";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import {
  Product,
  ProductReview,
  Store,
  StoreMember,
  StorePaymentProfile,
  StoreRole,
  User,
  sequelize,
} from "../models/index.js";

const BASE_URL = String(process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const PASSWORD = "ReviewSmoke123!";
const RUN_ID = `seller-review-${Date.now()}`;

type JsonResponse = { status: number; body: any; text: string };
class CookieClient {
  private cookie = "";
  async request(path: string, init: RequestInit = {}): Promise<JsonResponse> {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    if (this.cookie) headers.set("Cookie", this.cookie);
    const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) this.cookie = setCookie.split(";")[0] || this.cookie;
    const text = await response.text();
    let body: any = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { status: response.status, body, text };
  }
}

const ids = {
  users: [] as number[],
  stores: [] as number[],
  products: [] as number[],
  reviews: [] as number[],
  profiles: [] as number[],
};
const log = (value: string) => console.log(`[seller-reviews-smoke] ${value}`);
const assertStatus = (response: JsonResponse, expected: number, label: string) =>
  assert.equal(response.status, expected, `${label}: expected ${expected}, got ${response.status}: ${response.text}`);

async function createUser(label: string) {
  const email = `${RUN_ID}-${label}@local.dev`;
  const user = await User.create({
    name: `Review ${label}`,
    email,
    password: await bcrypt.hash(PASSWORD, 10),
    role: "customer",
    status: "active",
  } as any);
  const id = Number(user.getDataValue("id"));
  ids.users.push(id);
  return { id, email };
}

async function createStore(ownerUserId: number, label: string) {
  const store = await Store.create({
    ownerUserId,
    name: `Review ${label}`,
    slug: `${RUN_ID}-${label}`,
    status: "ACTIVE",
  } as any);
  const id = Number(store.getDataValue("id"));
  ids.stores.push(id);
  return { id, slug: String(store.getDataValue("slug")) };
}

async function makeStoreReady(storeId: number) {
  const now = new Date();
  const profile = await StorePaymentProfile.create({
    storeId,
    providerCode: "MANUAL_QRIS",
    paymentType: "QRIS_STATIC",
    version: 1,
    snapshotStatus: "ACTIVE",
    accountName: "Review Smoke",
    merchantName: "Review Smoke",
    merchantId: `${RUN_ID}-${storeId}`,
    qrisImageUrl: "https://example.com/review-smoke.png",
    qrisPayload: `${RUN_ID}-payload`,
    instructionText: "Review smoke payment profile.",
    isActive: true,
    verificationStatus: "ACTIVE",
    verifiedAt: now,
    activatedAt: now,
  } as any);
  const id = Number(profile.getDataValue("id"));
  ids.profiles.push(id);
  await Store.update({ activeStorePaymentProfileId: id } as any, { where: { id: storeId } as any });
}

async function login(client: CookieClient, email: string) {
  const response = await client.request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assertStatus(response, 200, `login ${email}`);
}

async function cleanup() {
  if (ids.reviews.length) await ProductReview.destroy({ where: { id: { [Op.in]: ids.reviews } } as any, force: true }).catch(() => null);
  if (ids.stores.length) await StoreMember.destroy({ where: { storeId: { [Op.in]: ids.stores } } as any, force: true }).catch(() => null);
  if (ids.products.length) await Product.destroy({ where: { id: { [Op.in]: ids.products } } as any, force: true }).catch(() => null);
  if (ids.stores.length) await Store.update({ activeStorePaymentProfileId: null } as any, { where: { id: { [Op.in]: ids.stores } } as any }).catch(() => null);
  if (ids.profiles.length) await StorePaymentProfile.destroy({ where: { id: { [Op.in]: ids.profiles } } as any, force: true }).catch(() => null);
  if (ids.stores.length) await Store.destroy({ where: { id: { [Op.in]: ids.stores } } as any, force: true }).catch(() => null);
  if (ids.users.length) await User.destroy({ where: { id: { [Op.in]: ids.users } } as any, force: true }).catch(() => null);
}

async function run() {
  const health = await fetch(`${BASE_URL}/api/health`);
  assert.equal(health.ok, true, `API unavailable at ${BASE_URL}`);
  await sequelize.authenticate();

  const owner = await createUser("owner");
  const buyer = await createUser("buyer");
  const manager = await createUser("manager");
  const otherOwner = await createUser("other-owner");
  const store = await createStore(owner.id, "store");
  const otherStore = await createStore(otherOwner.id, "other-store");
  await makeStoreReady(store.id);
  const product = await Product.create({
    userId: owner.id,
    storeId: store.id,
    name: "Review Smoke Product",
    slug: `${RUN_ID}-product`,
    sku: "REVIEW-SMOKE",
    price: 45000,
    stock: 8,
    status: "active",
    isPublished: true,
    sellerSubmissionStatus: "none",
  } as any);
  const productId = Number(product.getDataValue("id"));
  ids.products.push(productId);
  const review = await ProductReview.create({
    userId: buyer.id,
    productId,
    rating: 5,
    comment: "A real store-scoped review fixture.",
    images: [],
    status: "published",
  });
  const reviewId = Number(review.getDataValue("id"));
  ids.reviews.push(reviewId);

  const marketingRole = await StoreRole.findOne({ where: { code: "MARKETING_MANAGER" } as any });
  assert.ok(marketingRole, "MARKETING_MANAGER role is required");
  await StoreMember.create({
    storeId: store.id,
    userId: manager.id,
    storeRoleId: Number(marketingRole.getDataValue("id")),
    status: "ACTIVE",
    acceptedAt: new Date(),
  } as any);

  const ownerClient = new CookieClient();
  const managerClient = new CookieClient();
  const buyerClient = new CookieClient();
  await login(ownerClient, owner.email);
  await login(managerClient, manager.email);
  await login(buyerClient, buyer.email);

  log("list, search, stats, and detail");
  const list = await ownerClient.request(`/api/seller/stores/${store.id}/reviews?search=Smoke&sort=rating_high`);
  assertStatus(list, 200, "seller review list");
  assert.equal(list.body?.data?.total, 1);
  assert.equal(list.body?.data?.stats?.totalReviews, 1);
  assert.equal(list.body?.data?.items?.[0]?.id, reviewId);
  const detail = await ownerClient.request(`/api/seller/stores/${store.id}/reviews/${reviewId}`);
  assertStatus(detail, 200, "seller review detail");

  log("read-only role boundary");
  assertStatus(await managerClient.request(`/api/seller/stores/${store.id}/reviews`), 200, "manager list");
  assertStatus(await managerClient.request(`/api/seller/stores/${store.id}/reviews/${reviewId}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ reply: "Forbidden manager reply" }),
  }), 403, "manager reply forbidden");

  log("reply and storefront synchronization");
  const reply = await ownerClient.request(`/api/seller/stores/${store.id}/reviews/${reviewId}/reply`, {
    method: "PATCH",
    body: JSON.stringify({ reply: "Thank you for your thoughtful review." }),
  });
  assertStatus(reply, 200, "owner reply");
  assert.equal(reply.body?.data?.sellerReply, "Thank you for your thoughtful review.");
  const publicBeforeHide = await ownerClient.request(`/api/store/products/${product.getDataValue("slug")}?storeSlug=${store.slug}`);
  assertStatus(publicBeforeHide, 200, "public product before hide");
  assert.equal(publicBeforeHide.body?.data?.reviews?.[0]?.sellerReply, "Thank you for your thoughtful review.");

  log("hide, filter, and publish");
  assertStatus(await ownerClient.request(`/api/seller/stores/${store.id}/reviews/${reviewId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "hidden", reason: "Smoke visibility test" }),
  }), 200, "hide review");
  const hiddenList = await ownerClient.request(`/api/seller/stores/${store.id}/reviews?status=hidden`);
  assertStatus(hiddenList, 200, "hidden list");
  assert.equal(hiddenList.body?.data?.items?.[0]?.status, "hidden");
  const publicHidden = await ownerClient.request(`/api/store/products/${product.getDataValue("slug")}?storeSlug=${store.slug}`);
  assertStatus(publicHidden, 200, "public product hidden review");
  assert.equal(publicHidden.body?.data?.reviewCount, 0);
  assert.equal(publicHidden.body?.data?.reviews?.length, 0);
  assertStatus(await ownerClient.request(`/api/seller/stores/${store.id}/reviews/${reviewId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "published" }),
  }), 200, "publish review");

  log("report audit persistence");
  const report = await ownerClient.request(`/api/seller/stores/${store.id}/reviews/${reviewId}/report`, {
    method: "POST",
    body: JSON.stringify({ reason: "Smoke report audit reason" }),
  });
  assertStatus(report, 201, "report review");
  assert.equal(report.body?.data?.review?.isReported, true);

  log("buyer update preserves seller reply");
  const buyerUpdate = await buyerClient.request(`/api/store/reviews/${reviewId}`, {
    method: "PATCH",
    body: JSON.stringify({ rating: 4, comment: "Updated buyer review.", images: [] }),
  });
  assertStatus(buyerUpdate, 200, "buyer update review");
  const afterBuyerUpdate = await ownerClient.request(`/api/seller/stores/${store.id}/reviews/${reviewId}`);
  assert.equal(afterBuyerUpdate.body?.data?.comment, "Updated buyer review.");
  assert.equal(afterBuyerUpdate.body?.data?.sellerReply, "Thank you for your thoughtful review.");

  log("cross-store access boundary");
  assertStatus(await ownerClient.request(`/api/seller/stores/${otherStore.id}/reviews`), 403, "cross-store list forbidden");

  console.log("[seller-reviews-smoke] OK");
}

run()
  .catch((error) => {
    console.error("[seller-reviews-smoke] FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
    await sequelize.close().catch(() => null);
  });
