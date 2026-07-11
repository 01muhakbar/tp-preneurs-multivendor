import "dotenv/config";
import assert from "node:assert/strict";
import net from "node:net";
import { once } from "node:events";
import app from "../app.js";
import { User, sequelize } from "../models/index.js";

type JsonResponse = {
  status: number;
  ok: boolean;
  body: any;
  text: string;
  headers: Headers;
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
      text,
      headers: response.headers,
    };
  }
}

function logPass(message: string) {
  console.log(`  [PASS] ${message}`);
}

function assertStatus(res: JsonResponse, expected: number, context: string) {
  assert.equal(
    res.status,
    expected,
    `${context}: expected status ${expected}, got ${res.status} (body: ${JSON.stringify(res.body)})`
  );
}

const createdUserIds: number[] = [];

import bcrypt from "bcrypt";

async function createTestUser(attributes: Record<string, any>) {
  const payload = { ...attributes };
  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }
  const user = await User.create(payload as any);
  const id = Number(user.getDataValue("id"));
  createdUserIds.push(id);
  return user;
}

async function runAudit() {
  await sequelize.authenticate();

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address === "object", "server failed to bind");
  const baseUrl = `http://127.0.0.1:${Number(address.port)}`;

  const superAdminEmail = `audit_superadmin_${Date.now()}@test.local`;
  const adminEmail = `audit_admin_${Date.now()}@test.local`;

  const superAdmin = await createTestUser({
    name: "Audit Super Admin",
    email: superAdminEmail,
    password: "Password123!",
    role: "super_admin",
    status: "active",
  });

  const normalAdmin = await createTestUser({
    name: "Audit Normal Admin",
    email: adminEmail,
    password: "Password123!",
    role: "admin",
    status: "active",
  });

  const superClient = new CookieClient(baseUrl);
  const loginRes = await superClient.request("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: superAdminEmail, password: "Password123!" }),
  });
  assertStatus(loginRes, 200, "Super Admin login");
  logPass("Super admin authenticated");

  const adminClient = new CookieClient(baseUrl);
  const adminLoginRes = await adminClient.request("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: "Password123!" }),
  });
  assertStatus(adminLoginRes, 200, "Normal Admin login");

  // 1. Check Permissions: Normal Admin accessing /api/admin/staff should get 403
  const forbiddenList = await adminClient.request("/api/admin/staff");
  assertStatus(forbiddenList, 403, "Normal Admin GET /api/admin/staff");
  logPass("Non-SuperAdmin blocked from /api/admin/staff (403 Forbidden)");

  // 2. Super Admin GET list
  const listRes = await superClient.request("/api/admin/staff?page=1&limit=10");
  assertStatus(listRes, 200, "Super Admin GET /api/admin/staff");
  assert.ok(Array.isArray(listRes.body?.rows), "Rows must be an array");
  logPass("Super admin can list staff accounts");

  // 3. Staff CRUD: Create Staff account
  const newStaffEmail = `created_staff_${Date.now()}@test.local`;
  const createRes = await superClient.request("/api/admin/staff", {
    method: "POST",
    body: JSON.stringify({
      name: "Created Staff",
      email: newStaffEmail,
      password: "StrongPassword123",
      role: "staff",
      isActive: true,
    }),
  });
  assertStatus(createRes, 201, "Super Admin POST /api/admin/staff");
  const createdId = Number(createRes.body?.id);
  createdUserIds.push(createdId);
  logPass(`Staff account created via POST /api/admin/staff (ID: ${createdId})`);

  // 4. Read Detail
  const detailRes = await superClient.request(`/api/admin/staff/${createdId}`);
  assertStatus(detailRes, 200, "Super Admin GET /api/admin/staff/:id");
  assert.equal(detailRes.body?.email, newStaffEmail);
  logPass("Staff detail read successfully");

  // 5. Deactivate & Reactivate
  const deactivateRes = await superClient.request(`/api/admin/staff/${createdId}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: false }),
  });
  assertStatus(deactivateRes, 200, "Deactivate staff account");
  assert.equal(deactivateRes.body?.isActive, false);
  assert.equal(deactivateRes.body?.status, "inactive");
  logPass("Staff account deactivated successfully");

  const reactivateRes = await superClient.request(`/api/admin/staff/${createdId}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: true }),
  });
  assertStatus(reactivateRes, 200, "Reactivate staff account");
  assert.equal(reactivateRes.body?.isActive, true);
  assert.equal(reactivateRes.body?.status, "active");
  logPass("Staff account reactivated successfully");

  // 6. Approval flow for a pending_approval account
  const pendingStaffEmail = `pending_staff_${Date.now()}@test.local`;
  const pendingUser = await createTestUser({
    name: "Pending Staff",
    email: pendingStaffEmail,
    password: "Password123!",
    role: "staff",
    status: "pending_approval",
  });
  const pendingId = Number(pendingUser.getDataValue("id"));

  const approveRes = await superClient.request(`/api/admin/staff/${pendingId}/approve`, {
    method: "POST",
  });
  assertStatus(approveRes, 200, "Approve pending staff account");
  assert.equal(approveRes.body?.data?.user?.status, "active");
  logPass("Pending staff account approved successfully");

  // 7. No Self-Lockout Guards
  const selfDeactivateRes = await superClient.request(`/api/admin/staff/${superAdmin.getDataValue("id")}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive: false }),
  });
  assertStatus(selfDeactivateRes, 409, "Self deactivation guard");
  logPass("Self deactivation prevented (409 Conflict)");

  const selfDemoteRes = await superClient.request(`/api/admin/staff/${superAdmin.getDataValue("id")}`, {
    method: "PATCH",
    body: JSON.stringify({ role: "admin" }),
  });
  assertStatus(selfDemoteRes, 409, "Self role demotion guard");
  logPass("Self role demotion from super_admin prevented (409 Conflict)");

  const selfDeleteRes = await superClient.request(`/api/admin/staff/${superAdmin.getDataValue("id")}`, {
    method: "DELETE",
  });
  assertStatus(selfDeleteRes, 409, "Self delete guard");
  logPass("Self delete prevented (409 Conflict)");

  // 8. Delete created staff account
  const deleteRes = await superClient.request(`/api/admin/staff/${createdId}`, {
    method: "DELETE",
  });
  assertStatus(deleteRes, 200, "Delete staff account");
  logPass("Staff account deleted successfully");

  server.close();
  await once(server, "close").catch(() => null);
}

runAudit()
  .then(() => {
    console.log("\n[smokeAdminStaffWorkspaceAudit] ALL CHECKS PASSED ✅");
  })
  .catch((error) => {
    console.error("\n[smokeAdminStaffWorkspaceAudit] FAILED ❌", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (createdUserIds.length > 0) {
      await User.destroy({
        where: { id: createdUserIds } as any,
        force: true,
      }).catch(() => null);
    }
    await sequelize.close().catch(() => null);
  });
