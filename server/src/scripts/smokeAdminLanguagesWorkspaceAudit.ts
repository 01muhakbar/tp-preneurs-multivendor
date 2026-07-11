import "dotenv/config";
import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../app.js";
import { User, sequelize } from "../models/index.js";
import bcrypt from "bcrypt";

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

  const superAdminEmail = `audit_superadmin_lang_${Date.now()}@test.local`;
  const adminEmail = `audit_admin_lang_${Date.now()}@test.local`;

  await createTestUser({
    name: "Audit Super Admin Lang",
    email: superAdminEmail,
    password: "Password123!",
    role: "super_admin",
    status: "active",
  });

  await createTestUser({
    name: "Audit Normal Admin Lang",
    email: adminEmail,
    password: "Password123!",
    role: "admin",
    status: "active",
  });

  const superClient = new CookieClient(baseUrl);
  const superLogin = await superClient.request("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: superAdminEmail, password: "Password123!" }),
  });
  assertStatus(superLogin, 200, "Super Admin login");
  logPass("Super admin logged in");

  const adminClient = new CookieClient(baseUrl);
  const adminLogin = await adminClient.request("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: adminEmail, password: "Password123!" }),
  });
  assertStatus(adminLogin, 200, "Normal Admin login");
  logPass("Normal admin logged in");

  // 1. Check GET /api/admin/languages works for both staff/admin and super_admin
  const listSuper = await superClient.request("/api/admin/languages");
  assertStatus(listSuper, 200, "GET /api/admin/languages by super admin");
  assert.ok(Array.isArray(listSuper.body?.data), "expected data array");
  logPass("GET /api/admin/languages accessible by super admin");

  const listAdmin = await adminClient.request("/api/admin/languages");
  assertStatus(listAdmin, 200, "GET /api/admin/languages by normal admin");
  logPass("GET /api/admin/languages accessible by normal admin (Navbar language selector)");

  // 2. Check SETTINGS_MANAGE guard (mutation blocked for normal admin)
  const createByNormalAdmin = await adminClient.request("/api/admin/languages", {
    method: "POST",
    body: JSON.stringify({
      name: "Blocked Lang",
      isoCode: "bl",
      flag: "BL",
      published: true,
    }),
  });
  assertStatus(createByNormalAdmin, 403, "POST /api/admin/languages by normal admin should be blocked");
  logPass("SETTINGS_MANAGE guard verified: normal admin cannot mutate languages");

  // 3. Super Admin Language CRUD flow
  const testIso = `xx${String(Date.now()).slice(-4)}`;
  const createLang = await superClient.request("/api/admin/languages", {
    method: "POST",
    body: JSON.stringify({
      name: "Audit Test Language",
      isoCode: testIso,
      flag: "XT",
      published: true,
    }),
  });
  assertStatus(createLang, 201, "POST /api/admin/languages by super admin");
  const langId = Number(createLang.body?.data?.id || 0);
  assert.ok(langId > 0, "expected created language ID");
  logPass("Language created successfully");

  const updateLang = await superClient.request(`/api/admin/languages/${langId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: "Audit Test Language Updated",
    }),
  });
  assertStatus(updateLang, 200, "PUT /api/admin/languages/:id");
  assert.equal(updateLang.body?.data?.name, "Audit Test Language Updated");
  logPass("Language updated successfully");

  const toggleLang = await superClient.request(`/api/admin/languages/${langId}`, {
    method: "PUT",
    body: JSON.stringify({
      published: false,
    }),
  });
  assertStatus(toggleLang, 200, "PUT toggle published");
  assert.equal(toggleLang.body?.data?.published, false);
  logPass("Language status toggle (published: false) successful");

  const deleteLang = await superClient.request(`/api/admin/languages/${langId}`, {
    method: "DELETE",
  });
  assertStatus(deleteLang, 204, "DELETE /api/admin/languages/:id");
  logPass("Language deleted successfully");

  // 4. Verify delete restrictions
  // Ensure we check attempting to delete remaining languages won't drop below 1 remaining language or 1 published language
  const allLanguagesRes = await superClient.request("/api/admin/languages");
  const allLangs = Array.isArray(allLanguagesRes.body?.data) ? allLanguagesRes.body.data : [];
  if (allLangs.length === 1) {
    const lastLangId = Number(allLangs[0].id);
    const deleteLast = await superClient.request(`/api/admin/languages/${lastLangId}`, {
      method: "DELETE",
    });
    assertStatus(deleteLast, 409, "Delete last remaining language should fail with 409");
    logPass("Delete restriction verified: cannot delete last remaining language");
  }

  server.close();
}

runAudit()
  .then(async () => {
    console.log("\n[smokeAdminLanguagesWorkspaceAudit] ALL CHECKS PASSED ✅");
  })
  .catch((err) => {
    console.error("\n[smokeAdminLanguagesWorkspaceAudit] FAILED ❌", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (createdUserIds.length > 0) {
      await User.destroy({ where: { id: createdUserIds } });
    }
    await sequelize.close();
  });
