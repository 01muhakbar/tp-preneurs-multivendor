import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../app.js";
import { User, Store, StoreMember, sequelize } from "../models/index.js";
import bcrypt from "bcrypt";

type JsonResponse = {
  status: number;
  ok: boolean;
  body: any;
};

class CookieClient {
  private cookie = "";

  constructor(private readonly baseUrl: string) {}

  async request(path: string, init: RequestInit = {}): Promise<JsonResponse> {
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
    };
  }
}

async function run() {
  await sequelize.authenticate();

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

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

  // 1. Create seller via admin staff API
  const sellerEmail = `test_seller_${Date.now()}@test.local`;
  const sellerPassword = "SellerPass123!";
  const createSellerRes = await adminClient.request("/api/admin/staff", {
    method: "POST",
    body: JSON.stringify({
      name: "Toko Sophia",
      email: sellerEmail,
      phoneNumber: `081${Date.now().toString().slice(-8)}`,
      password: sellerPassword,
      role: "seller",
      storeName: "Sophia Boutique",
      sellerRoleCode: "CATALOG_MANAGER",
      isActive: true,
    }),
  });

  assert.equal(createSellerRes.status, 201, "Seller account should be created");
  assert.equal(createSellerRes.body?.store?.name, "Sophia Boutique");

  // 2. Seller logs in at /api/auth/seller/login
  const sellerClient = new CookieClient(baseUrl);
  const sellerLoginRes = await sellerClient.request("/api/auth/seller/login", {
    method: "POST",
    body: JSON.stringify({
      email: sellerEmail,
      password: sellerPassword,
    }),
  });

  assert.equal(sellerLoginRes.status, 200, "Seller should log in successfully");
  assert.equal(sellerLoginRes.body?.data?.stores?.length, 1);

  // 3. Test self-healing of orphaned seller account
  const orphanedEmail = `orphaned_seller_${Date.now()}@test.local`;
  const orphanedPassword = "Yohana1234-";
  const orphanedHash = await bcrypt.hash(orphanedPassword, 10);
  await User.create({
    name: "contoh",
    email: orphanedEmail,
    phoneNumber: "08218865824",
    password: orphanedHash,
    role: "seller",
    sellerRoleCode: "CATALOG_MANAGER",
    status: "active",
  });

  const orphanedClient = new CookieClient(baseUrl);
  const orphanedLoginRes = await orphanedClient.request("/api/auth/seller/login", {
    method: "POST",
    body: JSON.stringify({
      email: orphanedEmail,
      password: orphanedPassword,
    }),
  });

  assert.equal(orphanedLoginRes.status, 200, "Orphaned seller should heal and log in successfully");
  assert.equal(orphanedLoginRes.body?.success, true);
  assert.ok(orphanedLoginRes.body?.data?.stores?.length > 0);

  server.close();
  await once(server, "close").catch(() => null);

  await User.destroy({ where: { email: [superAdminEmail, sellerEmail, orphanedEmail] } as any, force: true }).catch(() => null);
  await sequelize.close().catch(() => null);

  console.log("\n[smokeSellerAccountCreationAndLogin] ALL CHECKS PASSED ✅");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
