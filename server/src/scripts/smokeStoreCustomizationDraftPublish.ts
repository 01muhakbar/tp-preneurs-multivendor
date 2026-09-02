import "dotenv/config";
import assert from "node:assert/strict";
import { QueryTypes } from "sequelize";
import { sequelize } from "../models/index.js";

const BASE_URL = String(process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.MVF_ADMIN_EMAIL || "superadmin@local.dev";
const ADMIN_PASSWORD = process.env.MVF_ADMIN_PASSWORD || "supersecure123";
const SMOKE_LANG = `cdp${String(Date.now()).slice(-8)}`;
const DRAFT_MARKER = `Draft publish marker ${Date.now()}`;

type JsonResponse = {
  status: number;
  ok: boolean;
  body: any;
  text: string;
};

class CookieClient {
  private cookie = "";

  async request(path: string, init: RequestInit = {}): Promise<JsonResponse> {
    const headers = new Headers(init.headers || {});
    headers.set("Accept", "application/json");
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (this.cookie) {
      headers.set("Cookie", this.cookie);
    }

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

    return { status: response.status, ok: response.ok, body, text };
  }
}

const assertStatus = (response: JsonResponse, status: number, label: string) => {
  assert.equal(
    response.status,
    status,
    `${label}: expected HTTP ${status}, received ${response.status} (${response.text})`
  );
};

const publicHeaderText = (body: any) =>
  String(
    body?.data?.customization?.home?.header?.headerText ||
      body?.customization?.home?.header?.headerText ||
      ""
  );

async function ensureServerReady() {
  const response = await fetch(`${BASE_URL}/api/health`);
  assert.equal(response.ok, true, `API not ready at ${BASE_URL}/api/health`);
}

async function loginAdmin(client: CookieClient) {
  const response = await client.request("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assertStatus(response, 200, "admin login");
}

async function cleanup() {
  await sequelize.query("DELETE FROM store_customizations WHERE lang = :lang", {
    replacements: { lang: SMOKE_LANG },
    type: QueryTypes.DELETE,
  });
}

async function fetchPublicHome() {
  const response = await fetch(
    `${BASE_URL}/api/store/customization?lang=${encodeURIComponent(SMOKE_LANG)}&include=home`
  );
  assert.equal(response.ok, true, "public customization request should succeed");
  return response.json();
}

async function run() {
  await ensureServerReady();
  await sequelize.authenticate();
  await cleanup();

  const adminClient = new CookieClient();
  await loginAdmin(adminClient);

  console.log("[store-customization-draft-publish] load default draft/live payload");
  const initialAdmin = await adminClient.request(
    `/api/admin/store/customization?lang=${encodeURIComponent(SMOKE_LANG)}`
  );
  assertStatus(initialAdmin, 200, "admin customization load");
  assert.equal(Boolean(initialAdmin.body?.success), true, "admin load should succeed");
  assert.equal(
    Boolean(initialAdmin.body?.data?.meta?.hasUnpublishedChanges),
    false,
    "newly initialized customization should not have unpublished changes"
  );

  console.log("[store-customization-draft-publish] save draft only");
  const draftResponse = await adminClient.request(
    `/api/admin/store/customization/draft?lang=${encodeURIComponent(SMOKE_LANG)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        customization: {
          home: {
            header: {
              headerText: DRAFT_MARKER,
            },
          },
        },
      }),
    }
  );
  assertStatus(draftResponse, 200, "save draft");
  assert.equal(Boolean(draftResponse.body?.data?.meta?.hasUnpublishedChanges), true);

  const reloadedDraft = await adminClient.request(
    `/api/admin/store/customization?lang=${encodeURIComponent(SMOKE_LANG)}`
  );
  assertStatus(reloadedDraft, 200, "reload draft");
  assert.equal(
    reloadedDraft.body?.data?.customization?.home?.header?.headerText,
    DRAFT_MARKER,
    "admin reload should expose the draft payload"
  );

  const publicBeforePublish = await fetchPublicHome();
  assert.notEqual(
    publicHeaderText(publicBeforePublish),
    DRAFT_MARKER,
    "public API must not expose draft-only changes"
  );

  console.log("[store-customization-draft-publish] publish draft");
  const publishResponse = await adminClient.request(
    `/api/admin/store/customization/publish?lang=${encodeURIComponent(SMOKE_LANG)}`,
    {
      method: "POST",
    }
  );
  assertStatus(publishResponse, 200, "publish draft");
  assert.equal(Boolean(publishResponse.body?.data?.meta?.hasUnpublishedChanges), false);

  const publicAfterPublish = await fetchPublicHome();
  assert.equal(
    publicHeaderText(publicAfterPublish),
    DRAFT_MARKER,
    "public API should expose the draft after publish"
  );

  console.log("[store-customization-draft-publish] OK");
}

run()
  .catch((error) => {
    console.error("[store-customization-draft-publish] FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch((error) => {
      console.error("[store-customization-draft-publish] cleanup failed", error);
      process.exitCode = 1;
    });
    await sequelize.close().catch(() => null);
  });
