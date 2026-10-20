import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { once } from "node:events";
import bcrypt from "bcrypt";
import app from "../app.js";
import {
  User,
  Store,
  StoreApplication,
  StoreMember,
  sequelize,
} from "../models/index.js";
import { ensureSellerStoreForUser } from "../services/seller/provisionSellerStore.js";

type JsonResponse = {
  status: number;
  ok: boolean;
  body: any;
  text: string;
  headers: Headers;
};

class CookieJarClient {
  private cookies: Map<string, string> = new Map();

  constructor(private readonly baseUrl: string) {}

  clearCookies() {
    this.cookies.clear();
  }

  getCookie(name: string): string | undefined {
    return this.cookies.get(name);
  }

  async request(path: string, init: RequestInit = {}): Promise<JsonResponse> {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    if (this.cookies.size > 0) {
      const cookieHeader = Array.from(this.cookies.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join("; ");
      headers.set("Cookie", cookieHeader);
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    // In modern node fetch, response.headers.getSetCookie() returns all Set-Cookie headers
    const rawSetCookies =
      typeof (response.headers as any).getSetCookie === "function"
        ? (response.headers as any).getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean);

    for (const cookieStr of rawSetCookies) {
      if (!cookieStr) continue;
      const parts = cookieStr.split(";")[0]?.trim();
      if (parts) {
        const eqIdx = parts.indexOf("=");
        if (eqIdx > 0) {
          const name = parts.substring(0, eqIdx).trim();
          const value = parts.substring(eqIdx + 1).trim();
          this.cookies.set(name, value);
        }
      }
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

const RUN_ID = `smoke-onboarding-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const createdUserIds: number[] = [];
const createdStoreIds: number[] = [];
const createdApplicationIds: number[] = [];

async function cleanupFixtures() {
  if (createdApplicationIds.length > 0) {
    await StoreApplication.destroy({
      where: { id: createdApplicationIds } as any,
      force: true,
    }).catch(() => null);
  }
  if (createdStoreIds.length > 0) {
    await StoreMember.destroy({
      where: { storeId: createdStoreIds } as any,
      force: true,
    }).catch(() => null);
    await Store.destroy({
      where: { id: createdStoreIds } as any,
      force: true,
    }).catch(() => null);
  }
  if (createdUserIds.length > 0) {
    await User.destroy({
      where: { id: createdUserIds } as any,
      force: true,
    }).catch(() => null);
  }
}

async function run() {
  await sequelize.authenticate();

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object", "smoke app failed to bind");
  const baseUrl = `http://127.0.0.1:${Number(address.port)}`;
  const client = new CookieJarClient(baseUrl);

  try {
    const password = "Password123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create an active applicant user (who has verified their email, but has no store yet)
    const applicantEmail = `${RUN_ID}-applicant@test.dev`;
    const applicantUser = await User.create({
      name: "Muh. Azman Test",
      email: applicantEmail,
      phoneNumber: "08218966824",
      password: hashedPassword,
      role: "customer",
      status: "active",
      isPublished: true,
    } as any);
    createdUserIds.push(applicantUser.id);

    console.log("[1] Testing POST /api/auth/seller/login for onboarding applicant with no store...");
    const loginResponse = await client.request("/api/auth/seller/login", {
      method: "POST",
      body: JSON.stringify({
        email: applicantEmail,
        password,
      }),
    });

    assert.equal(
      loginResponse.status,
      200,
      `Expected 200 OK from /api/auth/seller/login, received ${loginResponse.status}: ${loginResponse.text}`
    );
    assert.equal(loginResponse.body?.success, true);
    assert.equal(loginResponse.body?.data?.requiresOnboarding, true);
    assert.deepEqual(loginResponse.body?.data?.stores, []);
    assert.equal(
      loginResponse.body?.data?.redirectTo,
      "/seller/store-application?from=seller-verify-email"
    );
    console.log("   -> Login succeeded with requiresOnboarding=true and redirectTo set!");

    console.log("[2] Testing GET /api/auth/seller/me with applicant session...");
    const meResponse = await client.request("/api/auth/seller/me");
    assert.equal(
      meResponse.status,
      200,
      `Expected 200 OK from /api/auth/seller/me, received ${meResponse.status}: ${meResponse.text}`
    );
    assert.equal(meResponse.body?.success, true);
    assert.equal(meResponse.body?.data?.requiresOnboarding, true);
    assert.deepEqual(meResponse.body?.data?.stores, []);
    console.log("   -> /api/auth/seller/me returned 200 without clearing cookies!");

    console.log("[3] Testing GET /api/user/store-applications/current with applicant session...");
    const currentAppInitial = await client.request("/api/user/store-applications/current");
    assert.equal(
      currentAppInitial.status,
      200,
      `Expected 200 OK from current store applications, received ${currentAppInitial.status}: ${currentAppInitial.text}`
    );
    assert.equal(currentAppInitial.body?.success, true);
    assert.equal(currentAppInitial.body?.data, null);
    console.log("   -> Current application endpoint accessible (returns null initial draft)!");

    console.log("[4] Creating store application draft with applicant session...");
    const createDraftResponse = await client.request("/api/user/store-applications/draft", {
      method: "POST",
      body: JSON.stringify({
        currentStep: "owner_identity",
        storeInformationSnapshot: {
          storeName: "Azman Fashion",
          storeSlug: "azman-fashion",
          storeCategory: "fashion",
        },
        ownerIdentitySnapshot: {
          fullName: "Muh. Azman",
          email: applicantEmail,
          phoneNumber: "08218966824",
          birthDate: "2000-01-01",
          identityType: "KTP",
        },
        complianceSnapshot: {
          identityNumber: "7371123456789001",
        },
        sellerOnboardingSnapshot: {
          residentialAddress: "Jl. Boulevard No. 123",
          ownerCountry: "Indonesia",
          ownerProvince: "Sulawesi Selatan",
          ownerCity: "Kota Makassar",
          ownerSubdistrict: "Panakkukang",
          ownerPostalCode: "90231",
        },
      }),
    });

    assert.equal(
      createDraftResponse.status,
      201,
      `Expected 201 Created from draft creation, received ${createDraftResponse.status}: ${createDraftResponse.text}`
    );
    const applicationId = createDraftResponse.body?.data?.id;
    assert.ok(applicationId, "Expected draft application ID");
    createdApplicationIds.push(applicationId);
    console.log("   -> Application draft created with ID:", applicationId);

    console.log("[5] Simulating browser close & login again at /seller/login...");
    // Clear cookies in client to simulate closed browser / fresh session
    client.clearCookies();

    const reLoginResponse = await client.request("/api/auth/seller/login", {
      method: "POST",
      body: JSON.stringify({
        email: applicantEmail,
        password,
      }),
    });
    assert.equal(reLoginResponse.status, 200);
    assert.equal(reLoginResponse.body?.data?.requiresOnboarding, true);
    assert.equal(
      reLoginResponse.body?.data?.redirectTo,
      "/seller/store-application?from=seller-verify-email"
    );

    console.log("[6] Verifying saved draft inputs are returned after re-login...");
    const currentAppAfterReLogin = await client.request("/api/user/store-applications/current");
    assert.equal(currentAppAfterReLogin.status, 200);
    const restoredApp = currentAppAfterReLogin.body?.data;
    assert.ok(restoredApp, "Expected restored application data");
    assert.equal(restoredApp.currentStep, "owner_identity");
    assert.equal(restoredApp.storeInformationSnapshot?.storeName, "Azman Fashion");
    assert.equal(restoredApp.ownerIdentitySnapshot?.fullName, "Muh. Azman");
    assert.equal(
      restoredApp.internalMetadata?.sellerOnboarding2026?.residentialAddress,
      "Jl. Boulevard No. 123"
    );
    assert.equal(
      restoredApp.internalMetadata?.sellerOnboarding2026?.ownerCity,
      "Kota Makassar"
    );
    console.log("   -> All draft inputs faithfully loaded after re-login!");

    console.log("[7] Verifying existing seller with active store login is unaffected...");
    const existingSellerEmail = `${RUN_ID}-existing@test.dev`;
    const existingSellerUser = await User.create({
      name: "Existing Seller",
      email: existingSellerEmail,
      phoneNumber: "081234567890",
      password: hashedPassword,
      role: "seller",
      status: "active",
      isPublished: true,
    } as any);
    createdUserIds.push(existingSellerUser.id);

    const provisioned = await ensureSellerStoreForUser(existingSellerUser, {
      storeName: "Existing Store",
    });
    if (provisioned?.id) {
      createdStoreIds.push(Number(provisioned.id));
    }

    client.clearCookies();
    const existingSellerLogin = await client.request("/api/auth/seller/login", {
      method: "POST",
      body: JSON.stringify({
        email: existingSellerEmail,
        password,
      }),
    });
    assert.equal(existingSellerLogin.status, 200);
    assert.equal(existingSellerLogin.body?.data?.requiresOnboarding, false);
    assert.equal(existingSellerLogin.body?.data?.stores?.length, 1);
    const expectedSlug = String(provisioned?.slug || provisioned?.getDataValue?.("slug") || "");
    assert.equal(existingSellerLogin.body?.data?.stores?.[0]?.slug, expectedSlug);
    console.log("   -> Existing seller successfully logs in to their active store!");

    console.log("\n>>> ALL ONBOARDING SELLER LOGIN SMOKE TESTS PASSED! <<<");
  } finally {
    server.close();
    await once(server, "close").catch(() => null);
    await cleanupFixtures().catch((err) => console.error("Cleanup error:", err));
    await sequelize.close().catch(() => null);
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
