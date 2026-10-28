import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../app.js";
import { User, Store, StoreMember, sequelize } from "../models/index.js";
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
    console.log("\n--- TEST CASE 1: New Seller Account via Admin Staff POST API ---");
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
    const sellerEmail = `test_seller_${Date.now()}@test.local`;
    const sellerPassword = "SellerPass123!";
    const createSellerRes = await adminClient.request("/api/admin/staff", {
        method: "POST",
        body: JSON.stringify({
            name: "Toko Sophia",
            email: sellerEmail,
            phoneNumber: "08123456789",
            password: sellerPassword,
            role: "seller",
            sellerRoleCode: "CATALOG_MANAGER",
            isActive: true,
        }),
    });
    assert.equal(createSellerRes.status, 201, "Seller account should be created");
    assert.ok(createSellerRes.body?.store?.id, "Store should be provisioned in response");
    console.log("✅ Case 1: Account created with store:", createSellerRes.body.store);
    const sellerClient = new CookieClient(baseUrl);
    const sellerLoginRes = await sellerClient.request("/api/auth/seller/login", {
        method: "POST",
        body: JSON.stringify({
            email: sellerEmail,
            password: sellerPassword,
        }),
    });
    assert.equal(sellerLoginRes.status, 200, "Seller should log in successfully");
    assert.equal(sellerLoginRes.body?.data?.stores?.length, 1, "Should have 1 store");
    console.log("✅ Case 1: Seller logged in successfully with store slug:", sellerLoginRes.body.data.stores[0].slug);
    console.log("\n--- TEST CASE 2: Simulating Existing Orphaned Seller Account (Like sophiahatijamks@gmail.com) ---");
    const orphanedEmail = `orphaned_seller_${Date.now()}@test.local`;
    const orphanedPassword = "Yohana1234-";
    const orphanedHash = await bcrypt.hash(orphanedPassword, 10);
    const orphanedUser = await User.create({
        name: "contoh",
        email: orphanedEmail,
        phoneNumber: "08218865824",
        password: orphanedHash,
        role: "seller",
        sellerRoleCode: "CATALOG_MANAGER",
        status: "active",
    });
    const orphanedId = Number(orphanedUser.getDataValue("id"));
    // Verify that this user starts with ZERO stores
    const initialStores = await Store.findAll({ where: { ownerUserId: orphanedId } });
    const initialMembers = await StoreMember.findAll({ where: { userId: orphanedId } });
    assert.equal(initialStores.length, 0, "Orphaned user has no stores");
    assert.equal(initialMembers.length, 0, "Orphaned user has no memberships");
    console.log("Verified initial state: user has 0 stores and 0 memberships");
    // Attempt login at /api/auth/seller/login
    const orphanedClient = new CookieClient(baseUrl);
    const orphanedLoginRes = await orphanedClient.request("/api/auth/seller/login", {
        method: "POST",
        body: JSON.stringify({
            email: orphanedEmail,
            password: orphanedPassword,
        }),
    });
    assert.equal(orphanedLoginRes.status, 200, "Orphaned seller should be healed and log in successfully");
    assert.equal(orphanedLoginRes.body?.success, true);
    assert.ok(orphanedLoginRes.body?.data?.stores?.length > 0, "Healed seller now has stores");
    console.log("✅ Case 2: Orphaned seller self-healing succeeded! Store name:", orphanedLoginRes.body.data.stores[0].name, "slug:", orphanedLoginRes.body.data.stores[0].slug);
    server.close();
    await once(server, "close").catch(() => null);
    // Clean up
    await User.destroy({ where: { email: [superAdminEmail, sellerEmail, orphanedEmail] }, force: true }).catch(() => null);
    await sequelize.close().catch(() => null);
}
run().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});
