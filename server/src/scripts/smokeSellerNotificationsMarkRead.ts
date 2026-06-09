import assert from "assert";
import { QueryTypes } from "sequelize";
const BASE_URL = String(process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, "");

type JsonResponse = {
  status: number;
  ok: boolean;
  body: any;
  text: string;
  headers: Headers;
};

class CookieClient {
  private cookie = "";

  async request(path: string, init: RequestInit = {}): Promise<JsonResponse> {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (this.cookie) headers.set("Cookie", this.cookie);

    const response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers,
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) {
      this.cookie = setCookie.split(";")[0] || this.cookie;
    }

    const text = await response.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }

    return {
      status: response.status,
      ok: response.ok,
      body,
      text,
      headers: response.headers,
    };
  }
}

const logStep = (label: string) => console.log(`[seller-notifications] ${label}`);
const logPass = (label: string) => console.log(`[seller-notifications] PASS ${label}`);
const assertStatus = (response: JsonResponse, status: number, label: string) => {
  assert.equal(
    response.status,
    status,
    `${label}: expected HTTP ${status}, received ${response.status} (${response.text})`
  );
};

import { Store, User, sequelize } from "../models/index.js";

async function ensureServerReady() {
  const response = await fetch(`${BASE_URL}/api/health`);
  assert.equal(response.ok, true, `[seller-notifications] API not ready at ${BASE_URL}/api/health`);
}


const RUN_ID = `smoke-notif-${Date.now()}`;
const DEFAULT_PASSWORD = "Password123!";

const createdUserIds: number[] = [];
const createdStoreIds: number[] = [];
const createdNotificationIds: number[] = [];

import bcrypt from "bcrypt";
async function createFixtureUser(label: string) {
  const email = `${RUN_ID}-${label}@example.com`.toLowerCase();
  const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const user = await User.create({
    firstName: RUN_ID,
    lastName: label,
    email,
    password: hashed,
    role: "customer",
    status: "active",
  } as any);
  const id = Number(user.getDataValue("id"));
  createdUserIds.push(id);
  return { id, email, password: DEFAULT_PASSWORD };
}

async function createFixtureStore(ownerUserId: number, label: string) {
  const slug = `${RUN_ID}-${label}-store`.toLowerCase();
  const store = await Store.create({
    ownerUserId,
    name: `${RUN_ID} ${label} store`,
    slug,
    status: "ACTIVE",
  } as any);
  const id = Number(store.getDataValue("id"));
  createdStoreIds.push(id);
  return { id, slug };
}

import { createSellerNotification } from "../services/notification.service.js";

async function createNotification(storeId: number, title: string, isRead: boolean, userId: number) {
  const notif = await createSellerNotification({
    userId,
    storeId,
    type: "SYSTEM",
    title,
    message: title,
  });
  if (notif) createdNotificationIds.push(notif.id);
  if (notif && isRead) {
    await notif.update({ isRead: true });
  }
  return notif?.id || 0;
}

async function login(client: CookieClient, email: string, password: string, label: string) {
  const response = await client.request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assertStatus(response, 200, label);
}

async function cleanupFixtures() {
  if (createdNotificationIds.length > 0) {
    await sequelize.query(
      `DELETE FROM notifications WHERE id IN (${createdNotificationIds.map(() => "?").join(",")})`,
      {
        replacements: createdNotificationIds,
        type: QueryTypes.DELETE,
      }
    );
  }
  if (createdStoreIds.length > 0) {
    await Store.destroy({ where: { id: createdStoreIds } as any, force: true } as any);
  }
  if (createdUserIds.length > 0) {
    await User.destroy({ where: { id: createdUserIds } as any, force: true } as any);
  }
}

async function main() {
  await ensureServerReady();

  const seller = await createFixtureUser("seller");
  const otherSeller = await createFixtureUser("other");
  const sellerStore = await createFixtureStore(seller.id, "seller");
  const otherStore = await createFixtureStore(otherSeller.id, "other");

  const notif1 = await createNotification(sellerStore.id, "Test Notif 1", false, seller.id);
  const notif2 = await createNotification(sellerStore.id, "Test Notif 2", false, seller.id);
  await createNotification(otherStore.id, "Other Notif", false, otherSeller.id);

  const sellerClient = new CookieClient();
  await login(sellerClient, seller.email, seller.password, "seller login");

  logStep("get unread count before mark read");
  const countRes = await sellerClient.request(`/api/seller/stores/${sellerStore.id}/notifications/unread-count`);
  assertStatus(countRes, 200, "unread count");
  assert.ok(countRes.body?.data?.count >= 2, "should have at least 2 unread notifications");
  logPass("unread count returns expected value");

  logStep("mark single notification as read");
  const markReadRes = await sellerClient.request(`/api/seller/stores/${sellerStore.id}/notifications/${notif1}/read`, {
    method: "PATCH"
  });
  assertStatus(markReadRes, 200, "mark read");
  
  const checkSingleRead = await sellerClient.request(`/api/seller/stores/${sellerStore.id}/notifications`);
  const notif1Obj = checkSingleRead.body?.data?.items?.find((i: any) => i.id === notif1) || checkSingleRead.body?.data?.find((i: any) => i.id === notif1);
  assert.equal(notif1Obj?.isRead, true, "notification should be marked as read");
  logPass("single notification marked as read");

  logStep("mark all notifications as read");
  const markAllReadRes = await sellerClient.request(`/api/seller/stores/${sellerStore.id}/notifications/read-all`, {
    method: "PATCH"
  });
  assertStatus(markAllReadRes, 200, "mark all read");

  const checkAllRead = await sellerClient.request(`/api/seller/stores/${sellerStore.id}/notifications`);
  const notif2Obj = checkAllRead.body?.data?.items?.find((i: any) => i.id === notif2) || checkAllRead.body?.data?.find((i: any) => i.id === notif2);
  assert.equal(notif2Obj?.isRead, true, "second notification should be marked as read");
  
  const countAfterRes = await sellerClient.request(`/api/seller/stores/${sellerStore.id}/notifications/unread-count`);
  assert.equal(countAfterRes.body?.data?.count, 0, "unread count should be 0");
  logPass("all notifications marked as read");

  logStep("cross-store access denied for mark read");
  const forbiddenResponse = await sellerClient.request(`/api/seller/stores/${otherStore.id}/notifications/read-all`, {
    method: "PATCH"
  });
  assert.equal(forbiddenResponse.status, 403, `cross-store access should be denied (${forbiddenResponse.text})`);
  logPass("cross-store access denied");
}

main()
  .then(async () => {
    await cleanupFixtures();
    console.log("[seller-notifications] PASS");
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("[seller-notifications] FAIL", error);
    await cleanupFixtures();
    process.exit(1);
  });
