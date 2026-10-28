import "dotenv/config";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { once } from "node:events";
import bcrypt from "bcrypt";
import app from "../app.js";
import { User, Store, StoreApplication, StoreMember, sequelize, } from "../models/index.js";
import { ensureSellerStoreForUser } from "../services/seller/provisionSellerStore.js";
class CookieJarClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.cookies = new Map();
    }
    clearCookies() {
        this.cookies.clear();
    }
    getCookie(name) {
        return this.cookies.get(name);
    }
    async request(path, init = {}) {
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
        const rawSetCookies = typeof response.headers.getSetCookie === "function"
            ? response.headers.getSetCookie()
            : [response.headers.get("set-cookie")].filter(Boolean);
        for (const cookieStr of rawSetCookies) {
            if (!cookieStr)
                continue;
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
        let body = null;
        try {
            body = text ? JSON.parse(text) : null;
        }
        catch {
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
const createdUserIds = [];
const createdStoreIds = [];
const createdApplicationIds = [];
async function cleanupFixtures() {
    if (createdApplicationIds.length > 0) {
        await StoreApplication.destroy({
            where: { id: createdApplicationIds },
            force: true,
        }).catch(() => null);
    }
    if (createdStoreIds.length > 0) {
        await StoreMember.destroy({
            where: { storeId: createdStoreIds },
            force: true,
        }).catch(() => null);
        await Store.destroy({
            where: { id: createdStoreIds },
            force: true,
        }).catch(() => null);
    }
    if (createdUserIds.length > 0) {
        await User.destroy({
            where: { id: createdUserIds },
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
        });
        createdUserIds.push(applicantUser.id);
        console.log("[1] Testing POST /api/auth/seller/login for onboarding applicant with no store...");
        const loginResponse = await client.request("/api/auth/seller/login", {
            method: "POST",
            body: JSON.stringify({
                email: applicantEmail,
                password,
            }),
        });
        assert.equal(loginResponse.status, 200, `Expected 200 OK from /api/auth/seller/login, received ${loginResponse.status}: ${loginResponse.text}`);
        assert.equal(loginResponse.body?.success, true);
        assert.equal(loginResponse.body?.data?.requiresOnboarding, true);
        assert.deepEqual(loginResponse.body?.data?.stores, []);
        assert.equal(loginResponse.body?.data?.redirectTo, "/seller/store-application?from=seller-verify-email");
        console.log("   -> Login succeeded with requiresOnboarding=true and redirectTo set!");
        console.log("[2] Testing GET /api/auth/seller/me with applicant session...");
        const meResponse = await client.request("/api/auth/seller/me");
        assert.equal(meResponse.status, 200, `Expected 200 OK from /api/auth/seller/me, received ${meResponse.status}: ${meResponse.text}`);
        assert.equal(meResponse.body?.success, true);
        assert.equal(meResponse.body?.data?.requiresOnboarding, true);
        assert.deepEqual(meResponse.body?.data?.stores, []);
        console.log("   -> /api/auth/seller/me returned 200 without clearing cookies!");
        console.log("[3] Testing GET /api/user/store-applications/current with applicant session...");
        const currentAppInitial = await client.request("/api/user/store-applications/current");
        assert.equal(currentAppInitial.status, 200, `Expected 200 OK from current store applications, received ${currentAppInitial.status}: ${currentAppInitial.text}`);
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
        assert.equal(createDraftResponse.status, 201, `Expected 201 Created from draft creation, received ${createDraftResponse.status}: ${createDraftResponse.text}`);
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
        assert.equal(reLoginResponse.body?.data?.redirectTo, "/seller/store-application?from=seller-verify-email");
        console.log("[6] Verifying saved draft inputs are returned after re-login...");
        const currentAppAfterReLogin = await client.request("/api/user/store-applications/current");
        assert.equal(currentAppAfterReLogin.status, 200);
        const restoredApp = currentAppAfterReLogin.body?.data;
        assert.ok(restoredApp, "Expected restored application data");
        assert.equal(restoredApp.currentStep, "owner_identity");
        assert.equal(restoredApp.storeInformationSnapshot?.storeName, "Azman Fashion");
        assert.equal(restoredApp.ownerIdentitySnapshot?.fullName, "Muh. Azman");
        assert.equal(restoredApp.internalMetadata?.sellerOnboarding2026?.residentialAddress, "Jl. Boulevard No. 123");
        assert.equal(restoredApp.internalMetadata?.sellerOnboarding2026?.ownerCity, "Kota Makassar");
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
        });
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
        console.log("[8] Testing payload robustness & user-friendly error responses...");
        // 8a. Untrimmed email should succeed
        const untrimmedLogin = await client.request("/api/auth/seller/login", {
            method: "POST",
            body: JSON.stringify({
                email: `   ${existingSellerEmail}   `,
                password,
            }),
        });
        assert.equal(untrimmedLogin.status, 200, "Untrimmed email should be accepted and succeed");
        console.log("   -> Untrimmed email successfully trimmed and logged in!");
        // 8b. Phone number identifier should succeed
        client.clearCookies();
        const phoneLogin = await client.request("/api/auth/seller/login", {
            method: "POST",
            body: JSON.stringify({
                email: "081234567890",
                password,
            }),
        });
        assert.equal(phoneLogin.status, 200, "Phone number login should be accepted and succeed");
        console.log("   -> Phone number identifier successfully logged in!");
        // 8c. Invalid identifier format should return 400 with friendly message
        const invalidFormatLogin = await client.request("/api/auth/seller/login", {
            method: "POST",
            body: JSON.stringify({
                email: "invalid_username_format",
                password,
            }),
        });
        assert.equal(invalidFormatLogin.status, 400);
        assert.equal(invalidFormatLogin.body?.code, "INVALID_IDENTIFIER_FORMAT");
        assert.notEqual(invalidFormatLogin.body?.message, "Invalid payload");
        console.log("   -> Invalid identifier returned 400 with human-readable message (not 'Invalid payload')!");
        // 8d. Empty email should return 400 with clear message
        const emptyEmailLogin = await client.request("/api/auth/seller/login", {
            method: "POST",
            body: JSON.stringify({
                email: "",
                password,
            }),
        });
        assert.equal(emptyEmailLogin.status, 400);
        assert.equal(emptyEmailLogin.body?.message, "Email is required");
        console.log("   -> Empty email returned 'Email is required'!");
        // 8e. Short/wrong password should return 401 with 'Invalid credentials' (NOT 400 'Invalid payload')
        const shortPasswordLogin = await client.request("/api/auth/seller/login", {
            method: "POST",
            body: JSON.stringify({
                email: existingSellerEmail,
                password: "123",
            }),
        });
        assert.equal(shortPasswordLogin.status, 401);
        assert.equal(shortPasswordLogin.body?.message, "Invalid credentials");
        console.log("   -> Short wrong password cleanly evaluated to 401 Invalid credentials (never 400 'Invalid payload')!");
        console.log("\n>>> ALL ONBOARDING SELLER LOGIN SMOKE TESTS PASSED! <<<");
    }
    finally {
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
