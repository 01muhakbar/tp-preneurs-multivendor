import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../app.js";
import { User, sequelize } from "../models/index.js";
import bcrypt from "bcrypt";
class CookieClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.cookie = "";
    }
    async request(path, init = {}) {
        const headers = new Headers(init.headers || {});
        headers.set("Accept", "application/json");
        if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json");
        }
        if (this.cookie) {
            headers.set("Cookie", this.cookie);
        }
        const response = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers,
        });
        const setCookie = response.headers.get("set-cookie");
        if (setCookie) {
            this.cookie = setCookie.split(";")[0] || this.cookie;
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
        };
    }
}
async function run() {
    await sequelize.authenticate();
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    console.log("\n--- TEST: Seller Account Deactivation & Login Block ---");
    const superAdminEmail = `superadmin_${Date.now()}@test.local`;
    const superAdminPassword = "Password123!";
    const hash = await bcrypt.hash(superAdminPassword, 10);
    const superAdmin = await User.create({
        name: "Audit Super Admin",
        email: superAdminEmail,
        password: hash,
        role: "super_admin",
        status: "active",
    });
    const adminClient = new CookieClient(baseUrl);
    const adminLogin = await adminClient.request("/api/auth/admin/login", {
        method: "POST",
        body: JSON.stringify({ email: superAdminEmail, password: superAdminPassword }),
    });
    assert.equal(adminLogin.status, 200, "Super admin should log in");
    // 1. Create a seller
    const sellerEmail = `seller_audit_${Date.now()}@test.local`;
    const sellerPassword = "SellerPass123!";
    const createSellerRes = await adminClient.request("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({
            name: "Sophia Deactivation Test",
            email: sellerEmail,
            phoneNumber: `081${Date.now().toString().slice(-8)}`,
            password: sellerPassword,
            role: "seller",
            isActive: true,
        }),
    });
    assert.equal(createSellerRes.status, 201);
    const sellerId = createSellerRes.body.id;
    // 2. Initial login should succeed
    const sellerClient = new CookieClient(baseUrl);
    const login1 = await sellerClient.request("/api/auth/seller/login", {
        method: "POST",
        body: JSON.stringify({ email: sellerEmail, password: sellerPassword }),
    });
    assert.equal(login1.status, 200, "Initial seller login should succeed");
    console.log("✅ Initial active seller login passed");
    // 3. Admin toggles the seller to inactive (sending isPublished: false, as the current toggle does)
    console.log("Simulating Admin toggling switch to OFF (sending isPublished: false)...");
    const toggleOffRes = await adminClient.request(`/api/admin/staff/${sellerId}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: false }),
    });
    assert.equal(toggleOffRes.status, 200);
    console.log("Toggle OFF response body:", {
        status: toggleOffRes.body.status,
        isActive: toggleOffRes.body.isActive,
        isPublished: toggleOffRes.body.isPublished,
    });
    // 4. Seller attempts to login when toggled off -> MUST BE BLOCKED
    const login2 = await sellerClient.request("/api/auth/seller/login", {
        method: "POST",
        body: JSON.stringify({ email: sellerEmail, password: sellerPassword }),
    });
    console.log("Seller login after toggle OFF status:", login2.status, login2.body);
    assert.equal(login2.status, 403, "Deactivated/Unpublished seller must be rejected with 403");
    assert.equal(login2.body?.code, "ACCOUNT_NOT_ACTIVE");
    console.log("✅ Deactivated seller login was properly blocked (HTTP 403 ACCOUNT_NOT_ACTIVE)");
    // 5. Admin toggles the seller back to active
    console.log("Simulating Admin toggling switch to ON...");
    const toggleOnRes = await adminClient.request(`/api/admin/staff/${sellerId}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: true }),
    });
    assert.equal(toggleOnRes.status, 200);
    assert.equal(toggleOnRes.body.isActive, true);
    assert.equal(toggleOnRes.body.status, "active");
    // 6. Seller can login again
    const login3 = await sellerClient.request("/api/auth/seller/login", {
        method: "POST",
        body: JSON.stringify({ email: sellerEmail, password: sellerPassword }),
    });
    assert.equal(login3.status, 200, "Reactivated seller should log in successfully");
    console.log("✅ Reactivated seller login passed");
    server.close();
    await once(server, "close").catch(() => null);
    await User.destroy({ where: { email: [superAdminEmail, sellerEmail] }, force: true }).catch(() => null);
    await sequelize.close().catch(() => null);
    console.log("\n[testSellerDeactivationAudit] ALL CHECKS PASSED ✅");
}
run().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
