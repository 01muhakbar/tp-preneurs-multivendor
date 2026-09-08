import "dotenv/config";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { QueryTypes } from "sequelize";
import { sequelize } from "../models/index.js";

const BASE_URL = String(process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.MVF_ADMIN_EMAIL || "superadmin@local.dev";
const ADMIN_PASSWORD = process.env.MVF_ADMIN_PASSWORD || "supersecure123";
const SMOKE_LANG = `seo${String(Date.now()).slice(-8)}`;
const UPLOAD_DIR = path.resolve(process.cwd(), process.env.UPLOAD_DIR || "uploads");
const FAVICON_UPLOAD_PATH = `/uploads/${SMOKE_LANG}-favicon.png`;
const META_IMAGE_UPLOAD_PATH = `/uploads/${SMOKE_LANG}-meta-image.png`;
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lCwC8AAAAABJRU5ErkJggg==",
  "base64"
);

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

    return {
      status: response.status,
      ok: response.ok,
      body,
      text,
    };
  }
}

const logStep = (label: string) => {
  console.log(`[mvf-seo] ${label}`);
};

const logPass = (label: string) => {
  console.log(`[mvf-seo] PASS ${label}`);
};

const assertStatus = (response: JsonResponse, status: number, label: string) => {
  assert.equal(
    response.status,
    status,
    `${label}: expected HTTP ${status}, received ${response.status} (${response.text})`
  );
};

async function ensureServerReady() {
  const response = await fetch(`${BASE_URL}/api/health`);
  assert.equal(response.ok, true, `[mvf-seo] API not ready at ${BASE_URL}/api/health`);
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
  await Promise.allSettled([
    fs.unlink(path.join(UPLOAD_DIR, `${SMOKE_LANG}-favicon.png`)),
    fs.unlink(path.join(UPLOAD_DIR, `${SMOKE_LANG}-meta-image.png`)),
  ]);
}

async function createUploadFixtures() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(UPLOAD_DIR, `${SMOKE_LANG}-favicon.png`), TINY_PNG),
    fs.writeFile(path.join(UPLOAD_DIR, `${SMOKE_LANG}-meta-image.png`), TINY_PNG),
  ]);
}

async function run() {
  await ensureServerReady();
  await sequelize.authenticate();

  const adminClient = new CookieClient();
  await loginAdmin(adminClient);
  await createUploadFixtures();

  logStep("persist seo settings customization with public media aliases");
  const updateResponse = await adminClient.request(
    `/api/admin/store/customization?lang=${encodeURIComponent(SMOKE_LANG)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        customization: {
          seoSettings: {
            favicon: FAVICON_UPLOAD_PATH,
            metaTitle: "Store SEO Title",
            metaDescription: "Store SEO Description",
            metaUrl: "/seo-preview",
            metaKeywords: "store,seo,keywords",
            metaImage: META_IMAGE_UPLOAD_PATH,
          },
        },
      }),
    }
  );
  assertStatus(updateResponse, 200, "admin seo-settings update");
  assert.equal(Boolean(updateResponse.body?.success), true, "seo-settings update should succeed");
  logPass("admin seo-settings update");

  logStep("reload admin seo settings");
  const reloadedAdmin = await adminClient.request(
    `/api/admin/store/customization?lang=${encodeURIComponent(SMOKE_LANG)}`
  );
  assertStatus(reloadedAdmin, 200, "admin seo-settings reload");
  const adminSeo = reloadedAdmin.body?.data?.customization?.seoSettings;
  assert.equal(
    String(adminSeo?.faviconDataUrl || ""),
    FAVICON_UPLOAD_PATH,
    "favicon alias should normalize to faviconDataUrl"
  );
  assert.equal(
    String(adminSeo?.metaTitle || ""),
    "Store SEO Title",
    "meta title should persist"
  );
  assert.equal(
    String(adminSeo?.metaDescription || ""),
    "Store SEO Description",
    "meta description should persist"
  );
  assert.equal(
    String(adminSeo?.metaUrl || ""),
    "/seo-preview",
    "meta url should persist"
  );
  assert.equal(
    String(adminSeo?.metaImageDataUrl || ""),
    META_IMAGE_UPLOAD_PATH,
    "meta image alias should normalize to metaImageDataUrl"
  );
  logPass("admin seo-settings reload");

  logStep("verify public seo settings serialization");
  const publicResponse = await fetch(
    `${BASE_URL}/api/store/customization?lang=${encodeURIComponent(
      SMOKE_LANG
    )}&include=seo`
  );
  assert.equal(publicResponse.ok, true, "public seo-settings request should succeed");
  const publicBody = await publicResponse.json();
  assert.equal(Boolean(publicBody?.success), true, "public seo-settings should return success=true");
  const publicSeo = publicBody?.data?.customization?.seoSettings;
  assert.equal(
    String(publicSeo?.metaTitle || ""),
    "Store SEO Title",
    "public seo-settings should expose meta title"
  );
  assert.equal(
    String(publicSeo?.metaKeywords || ""),
    "store,seo,keywords",
    "public seo-settings should expose meta keywords"
  );
  assert.equal(
    String(publicSeo?.faviconDataUrl || ""),
    FAVICON_UPLOAD_PATH,
    "public seo-settings should expose favicon URL"
  );
  assert.equal(
    String(publicSeo?.metaImageDataUrl || ""),
    META_IMAGE_UPLOAD_PATH,
    "public seo-settings should expose meta image URL"
  );
  logPass("public seo-settings serialization");

  logStep("verify partial-empty seo settings remain safe");
  const partialResponse = await adminClient.request(
    `/api/admin/store/customization?lang=${encodeURIComponent(SMOKE_LANG)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        customization: {
          seoSettings: {
            metaTitle: "Title Only",
            metaDescription: "",
            metaUrl: "",
            metaKeywords: "",
            faviconDataUrl: "",
            metaImageDataUrl: "",
          },
        },
      }),
    }
  );
  assertStatus(partialResponse, 200, "admin seo partial update");
  const partialSeo = partialResponse.body?.data?.customization?.seoSettings;
  assert.equal(String(partialSeo?.metaTitle || ""), "Title Only", "partial meta title should persist");
  assert.equal(String(partialSeo?.metaDescription || ""), "", "partial meta description should stay empty");
  assert.equal(String(partialSeo?.metaUrl || ""), "", "partial meta url should stay empty");
  assert.equal(String(partialSeo?.faviconDataUrl || ""), "", "partial favicon should stay empty");
  assert.equal(String(partialSeo?.favicon || ""), "", "partial favicon alias should stay empty");
  assert.equal(String(partialSeo?.faviconImage || ""), "", "partial favicon image alias should stay empty");
  assert.equal(String(partialSeo?.metaImageDataUrl || ""), "", "partial meta image should stay empty");
  assert.equal(String(partialSeo?.metaImage || ""), "", "partial meta image alias should stay empty");
  assert.equal(String(partialSeo?.image || ""), "", "partial generic image alias should stay empty");
  logPass("partial seo-settings safety");

  console.log("[mvf-seo] OK");
}

run()
  .catch((error) => {
    console.error("[mvf-seo] FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup().catch((error) => {
      console.error("[mvf-seo] cleanup failed", error);
      process.exitCode = 1;
    });
    await sequelize.close().catch(() => null);
  });
