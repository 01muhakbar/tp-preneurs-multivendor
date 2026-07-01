import "dotenv/config";
import assert from "node:assert/strict";
import bcrypt from "bcrypt";
import { Op } from "sequelize";
import {
  sequelize,
  Store,
  StoreApplication,
  StoreMember,
  StorePaymentProfile,
  StorePaymentProfileRequest,
  User,
} from "../models/index.js";

const BASE_URL = String(process.env.BASE_URL || "http://localhost:3001").replace(/\/+$/, "");
const DEFAULT_PASSWORD = process.env.MVF_SMOKE_PASSWORD || "mvf-smoke-123";
const RUN_ID = `mvf-store-activation-${Date.now()}`;

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

type FixtureUser = {
  id: number;
  email: string;
  password: string;
};

const createdUserIds: number[] = [];
const createdApplicationIds: number[] = [];
const createdStoreIds: number[] = [];
const createdMemberIds: number[] = [];
const createdPaymentRequestIds: number[] = [];

const logStep = (label: string) => {
  console.log(`[mvf-store-activation] ${label}`);
};

const logPass = (label: string) => {
  console.log(`[mvf-store-activation] PASS ${label}`);
};

const assertStatus = (response: JsonResponse, status: number, label: string) => {
  assert.equal(
    response.status,
    status,
    `${label}: expected HTTP ${status}, received ${response.status} (${response.text})`
  );
};

const readJsonObject = (value: unknown) => {
  if (typeof value === "string") return JSON.parse(value);
  return value as Record<string, any> | null;
};

async function ensureServerReady() {
  const response = await fetch(`${BASE_URL}/api/health`);
  assert.equal(response.ok, true, `[mvf-store-activation] API not ready at ${BASE_URL}/api/health`);
}

async function createFixtureUser(label: string, role: string): Promise<FixtureUser> {
  const email = `${RUN_ID}-${label}@local.dev`;
  const password = DEFAULT_PASSWORD;
  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: `MVF ${label}`,
    email,
    password: hashed,
    role,
    status: "active",
    phoneNumber: `+6281${Math.floor(Math.random() * 1_000_000_000)
      .toString()
      .padStart(9, "0")}`,
  } as any);

  const id = Number(user.getDataValue("id"));
  createdUserIds.push(id);
  return { id, email, password };
}

async function login(client: CookieClient, email: string, password: string, label: string) {
  const response = await client.request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assertStatus(response, 200, label);
}

async function loginAdmin(client: CookieClient, email: string, password: string, label: string) {
  const response = await client.request("/api/auth/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  assertStatus(response, 200, label);
}

const buildDraftPayload = (label: string) => ({
  currentStep: "review",
  ownerIdentitySnapshot: {
    fullName: `Applicant ${label}`,
    operationalContactName: `PIC ${label}`,
    email: `${RUN_ID}-${label}@seller.local`,
    phoneNumber: `+62811${label.length}000000`,
    birthDate: "1990-01-01",
    identityType: "KTP",
    identityLegalName: `Applicant ${label}`,
  },
  storeInformationSnapshot: {
    storeName: `Store ${label}`,
    storeSlug: `${RUN_ID}-${label}`,
    storeCategory: "fashion",
    description: `Store description ${label}`,
    sellerType: "UMKM",
    isSelfProduced: true,
    initialProductCount: 12,
  },
  operationalAddressSnapshot: {
    contactName: `Ops ${label}`,
    phoneNumber: `+62812${label.length}111111`,
    addressLine1: `Jl. ${label} No. 1`,
    city: "Jakarta",
    province: "DKI Jakarta",
    district: "Setiabudi",
    postalCode: "12910",
    country: "Indonesia",
    notes: `Address note ${label}`,
  },
  payoutPaymentSnapshot: {
    providerCode: "MANUAL_QRIS",
    paymentType: "QRIS_STATIC",
    accountName: `Applicant ${label}`,
    merchantName: `Store ${label}`,
    merchantId: `MERCHANT-${label}`,
    qrisImageUrl: `/uploads/products/${RUN_ID}-${label}-qris.png`,
    qrisPayload: `QRIS-PAYLOAD-${label}`,
    instructionText: `Scan QRIS for ${label}`,
    sellerNote: `Seller note ${label}`,
    payoutMethod: "QRIS_STATIC",
    accountHolderName: `Applicant ${label}`,
    bankName: "MANUAL_QRIS",
    accountHolderMatchesIdentity: true,
  },
  complianceSnapshot: {
    supportEmail: `${RUN_ID}-${label}@support.local`,
    supportPhone: `+62813${label.length}222222`,
    taxId: "12.345.678.9-000.000",
    identityNumber: `3174${label.length}000001`,
    productTypes: "fashion muslim",
    brandOwnershipType: "OWN_BRAND",
    authenticityConfirmed: true,
    prohibitedGoodsConfirmed: true,
    websiteUrl: "https://example.test",
    socialMediaUrl: "https://instagram.com/example",
    notes: `Compliance note ${label}`,
    agreedToTerms: true,
    agreedToAdminReview: true,
    agreedToPlatformPolicy: true,
    understandsStoreInactiveUntilApproved: true,
  },
  sellerOnboardingSnapshot: {
    storeLogo: {
      url: `/uploads/products/${RUN_ID}-${label}-logo.png`,
      fileName: `${label}-logo.png`,
    },
    storeBanner: {
      url: `/uploads/products/${RUN_ID}-${label}-banner.png`,
      fileName: `${label}-banner.png`,
    },
    residentialAddress: `Jl. Residential ${label} No. 2`,
    ownerCountry: "Indonesia",
    ownerProvince: "DKI Jakarta",
    ownerCity: "Kota Jakarta Selatan",
    ownerSubdistrict: "Setiabudi",
    ownerPostalCode: "12910",
    legalEntity: "Sole Proprietorship",
    pickupSameAsBusiness: false,
    pickupAddress: `Gudang ${label}, Jakarta`,
    timeZone: "Asia/Jakarta",
    openTime: "09:00",
    closeTime: "18:00",
    workingDays: "Monday – Saturday",
    shippingMethod: "TP Preneurs Logistics",
    processingTime: "1–2 business days",
  },
});

async function createAndSubmitApplication(client: CookieClient, label: string) {
  const createDraftResponse = await client.request("/api/user/store-applications/draft", {
    method: "POST",
    body: JSON.stringify(buildDraftPayload(label)),
  });
  assertStatus(createDraftResponse, 201, `${label} create draft`);
  const applicationId = Number(createDraftResponse.body?.data?.id || 0);
  assert.ok(applicationId > 0, `${label} create draft: invalid application id`);
  createdApplicationIds.push(applicationId);

  const submitResponse = await client.request(
    `/api/user/store-applications/${applicationId}/submit`,
    { method: "POST" }
  );
  assertStatus(submitResponse, 200, `${label} submit`);

  return {
    applicationId,
    slug: String(
      submitResponse.body?.data?.storeInformationSnapshot?.storeSlug ||
        buildDraftPayload(label).storeInformationSnapshot.storeSlug
    ),
  };
}

async function cleanupFixtures() {
  if (createdMemberIds.length > 0) {
    await StoreMember.destroy({
      where: { id: { [Op.in]: createdMemberIds } } as any,
      force: true,
    }).catch(() => null);
  }

  if (createdPaymentRequestIds.length > 0) {
    await StorePaymentProfileRequest.destroy({
      where: { id: { [Op.in]: createdPaymentRequestIds } } as any,
      force: true,
    }).catch(() => null);
  }

  if (createdStoreIds.length > 0) {
    await Store.destroy({
      where: { id: { [Op.in]: createdStoreIds } } as any,
      force: true,
    }).catch(() => null);
  }

  if (createdApplicationIds.length > 0) {
    await StoreApplication.destroy({
      where: { id: { [Op.in]: createdApplicationIds } } as any,
      force: true,
    }).catch(() => null);
  }

  if (createdUserIds.length > 0) {
    await User.destroy({
      where: { id: { [Op.in]: createdUserIds } } as any,
      force: true,
    }).catch(() => null);
  }
}

async function trackProvisionedArtifacts(ownerUserId: number) {
  const store = await Store.findOne({
    where: { ownerUserId } as any,
    attributes: ["id"],
  });
  if (store) {
    const storeId = Number(store.getDataValue("id"));
    if (storeId > 0 && !createdStoreIds.includes(storeId)) {
      createdStoreIds.push(storeId);
    }

    const members = await StoreMember.findAll({
      where: { storeId } as any,
      attributes: ["id"],
    });
    members.forEach((member: any) => {
      const memberId = Number(member.getDataValue("id"));
      if (memberId > 0 && !createdMemberIds.includes(memberId)) {
        createdMemberIds.push(memberId);
      }
    });

    const paymentRequests = await StorePaymentProfileRequest.findAll({
      where: { storeId } as any,
      attributes: ["id"],
    });
    paymentRequests.forEach((request: any) => {
      const requestId = Number(request.getDataValue("id"));
      if (requestId > 0 && !createdPaymentRequestIds.includes(requestId)) {
        createdPaymentRequestIds.push(requestId);
      }
    });
  }
}

async function run() {
  await ensureServerReady();
  await sequelize.authenticate();

  const admin = await createFixtureUser("admin", "admin");
  const approvedApplicant = await createFixtureUser("approved", "customer");
  const revisionApplicant = await createFixtureUser("revision", "customer");
  const rejectedApplicant = await createFixtureUser("rejected", "customer");
  const conflictApplicant = await createFixtureUser("conflict", "customer");

  const adminClient = new CookieClient();
  const approvedClient = new CookieClient();
  const revisionClient = new CookieClient();
  const rejectedClient = new CookieClient();
  const conflictClient = new CookieClient();

  await loginAdmin(adminClient, admin.email, admin.password, "admin login");
  await login(approvedClient, approvedApplicant.email, approvedApplicant.password, "approved applicant login");
  await login(revisionClient, revisionApplicant.email, revisionApplicant.password, "revision applicant login");
  await login(rejectedClient, rejectedApplicant.email, rejectedApplicant.password, "rejected applicant login");
  await login(conflictClient, conflictApplicant.email, conflictApplicant.password, "conflict applicant login");

  const approvedApplication = await createAndSubmitApplication(approvedClient, "approved");
  const revisionApplication = await createAndSubmitApplication(revisionClient, "revision");
  const rejectedApplication = await createAndSubmitApplication(rejectedClient, "rejected");
  const conflictApplication = await createAndSubmitApplication(conflictClient, "conflict");

  logStep("public boundary safe before approval");
  const publicBeforeApproval = await approvedClient.request(
    `/api/store/customization/identity/${encodeURIComponent(approvedApplication.slug)}`
  );
  assertStatus(publicBeforeApproval, 404, "public boundary safe before approval");
  logPass("public boundary safe before approval");

  logStep("non-approved user blocked from seller access");
  const revisionStoresBefore = await revisionClient.request("/api/seller/stores");
  assertStatus(revisionStoresBefore, 200, "revision applicant seller stores before approval");
  assert.equal(
    Array.isArray(revisionStoresBefore.body?.data) ? revisionStoresBefore.body.data.length : -1,
    0,
    "revision applicant should not have seller stores before approval"
  );
  logPass("non-approved user blocked from seller access");

  logStep("admin approve provisions seller activation");
  const approveResponse = await adminClient.request(
    `/api/admin/store-applications/${approvedApplication.applicationId}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify({
        internalAdminNote: "Activation smoke approval.",
      }),
    }
  );
  assertStatus(approveResponse, 200, "admin approve");
  assert.equal(String(approveResponse.body?.data?.status || ""), "approved", "approved application status mismatch");
  await trackProvisionedArtifacts(approvedApplicant.id);
  logPass("admin approve provisions seller activation");

  logStep("approval hands QRIS to Payment Profile as one submitted request");
  const provisionedStore = await Store.findOne({
    where: { ownerUserId: approvedApplicant.id } as any,
    attributes: [
      "id",
      "activeStorePaymentProfileId",
      "logoUrl",
      "bannerUrl",
      "district",
      "shippingSetup",
      "ownerIdentity",
      "businessDetails",
    ],
  });
  assert.ok(provisionedStore, "approved store should exist for Payment Profile handoff");
  const provisionedStoreId = Number(provisionedStore!.getDataValue("id"));
  const paymentRequest = await StorePaymentProfileRequest.findOne({
    where: { storeId: provisionedStoreId } as any,
    order: [["id", "DESC"]],
  });
  assert.ok(paymentRequest, "approval should create a Payment Profile request");
  assert.equal(paymentRequest!.getDataValue("requestStatus"), "SUBMITTED");
  assert.equal(paymentRequest!.getDataValue("accountName"), "Applicant approved");
  assert.equal(paymentRequest!.getDataValue("merchantName"), "Store approved");
  assert.equal(
    paymentRequest!.getDataValue("qrisImageUrl"),
    `/uploads/products/${RUN_ID}-approved-qris.png`
  );
  assert.equal(
    Number(provisionedStore!.getDataValue("activeStorePaymentProfileId") || 0),
    0,
    "Store Application approval must not activate a Payment Profile"
  );
  assert.equal(
    await StorePaymentProfile.count({ where: { storeId: provisionedStoreId } as any }),
    0,
    "Store Application approval must not create an active snapshot"
  );
  assert.equal(
    provisionedStore!.getDataValue("logoUrl"),
    `/uploads/products/${RUN_ID}-approved-logo.png`
  );
  assert.equal(provisionedStore!.getDataValue("district"), "Setiabudi");
  assert.equal(
    readJsonObject(provisionedStore!.getDataValue("ownerIdentity"))?.residentialAddress,
    "Jl. Residential approved No. 2"
  );
  assert.equal(
    readJsonObject(provisionedStore!.getDataValue("businessDetails"))?.timeZone,
    "Asia/Jakarta"
  );
  assert.equal(
    readJsonObject(provisionedStore!.getDataValue("shippingSetup"))?.originAddressLine1,
    "Gudang approved, Jakarta"
  );

  const synchronizedProfileResponse = await approvedClient.request(
    `/api/seller/stores/${provisionedStoreId}/store-profile`
  );
  assertStatus(synchronizedProfileResponse, 200, "synchronized seller store profile");
  assert.equal(
    synchronizedProfileResponse.body?.data?.ownerIdentity?.ownerPostalCode ||
      synchronizedProfileResponse.body?.data?.ownerIdentity?.postalCode,
    "12910"
  );
  assert.equal(
    synchronizedProfileResponse.body?.data?.businessDetails?.processingTime,
    "1–2 business days"
  );

  const updatedProfileResponse = await approvedClient.request(
    `/api/seller/stores/${provisionedStoreId}/store-profile`,
    {
      method: "PATCH",
      body: JSON.stringify({
        ownerIdentity: { residentialAddress: "Updated residential address" },
        businessDetails: { openTime: "08:30" },
      }),
    }
  );
  assertStatus(updatedProfileResponse, 200, "update synchronized seller store profile");
  assert.equal(
    updatedProfileResponse.body?.data?.ownerIdentity?.residentialAddress,
    "Updated residential address"
  );
  assert.equal(
    updatedProfileResponse.body?.data?.ownerIdentity?.postalCode,
    "12910",
    "partial owner update must preserve synchronized application fields"
  );
  assert.equal(updatedProfileResponse.body?.data?.businessDetails?.openTime, "08:30");
  assert.equal(
    updatedProfileResponse.body?.data?.businessDetails?.processingTime,
    "1–2 business days",
    "partial business update must preserve synchronized application fields"
  );

  const paymentProfileResponse = await approvedClient.request(
    `/api/seller/stores/${provisionedStoreId}/payment-profile`
  );
  assertStatus(paymentProfileResponse, 200, "seller Payment Profile after application approval");
  assert.equal(paymentProfileResponse.body?.data?.requestStatus?.code, "SUBMITTED");
  assert.equal(paymentProfileResponse.body?.data?.requestDraft?.merchantName, "Store approved");
  assert.equal(Boolean(paymentProfileResponse.body?.data?.isActive), false);

  const repeatApproveResponse = await adminClient.request(
    `/api/admin/store-applications/${approvedApplication.applicationId}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify({ internalAdminNote: "Idempotent retry." }),
    }
  );
  assertStatus(repeatApproveResponse, 200, "idempotent admin approve retry");
  assert.equal(
    await StorePaymentProfileRequest.count({ where: { storeId: provisionedStoreId } as any }),
    1,
    "idempotent approval must not duplicate Payment Profile requests"
  );
  logPass("approval hands QRIS to Payment Profile as one submitted request");

  logStep("approved user gets seller access");
  const approvedStoresResponse = await approvedClient.request("/api/seller/stores");
  assertStatus(approvedStoresResponse, 200, "approved user seller stores");
  const approvedStores = Array.isArray(approvedStoresResponse.body?.data)
    ? approvedStoresResponse.body.data
    : [];
  assert.ok(approvedStores.length > 0, "approved user seller store list should not be empty");
  const approvedStore = approvedStores.find(
    (entry: any) => String(entry?.store?.slug || "") === approvedApplication.slug
  );
  assert.ok(approvedStore, "approved user seller store slug should be present");
  assert.equal(
    String(approvedStore?.store?.status || ""),
    "INACTIVE",
    "approved store should remain INACTIVE for public boundary safety"
  );
  logPass("approved user gets seller access");

  logStep("approved user sees seller workspace entry point");
  const sellerContextResponse = await approvedClient.request(
    `/api/seller/stores/slug/${encodeURIComponent(approvedApplication.slug)}/context`
  );
  assertStatus(sellerContextResponse, 200, "approved seller context by slug");
  assert.equal(
    String(sellerContextResponse.body?.data?.store?.slug || ""),
    approvedApplication.slug,
    "approved seller context slug mismatch"
  );
  const currentApplicationResponse = await approvedClient.request("/api/user/store-applications/current");
  assertStatus(currentApplicationResponse, 200, "approved current application");
  assert.equal(
    Boolean(currentApplicationResponse.body?.data?.activation?.sellerAccessReady),
    true,
    "approved current application should expose seller access readiness"
  );
  logPass("approved user sees seller workspace entry point");

  logStep("public storefront boundary still safe after approval");
  const publicAfterApproval = await approvedClient.request(
    `/api/store/customization/identity/${encodeURIComponent(approvedApplication.slug)}`
  );
  assertStatus(publicAfterApproval, 404, "public boundary after approval");
  logPass("public storefront boundary still safe after approval");

  logStep("open Payment Profile request rolls back Store Application approval");
  const conflictStore = await Store.create({
    ownerUserId: conflictApplicant.id,
    name: "Store conflict",
    slug: conflictApplication.slug,
    status: "INACTIVE",
  } as any);
  const conflictStoreId = Number(conflictStore.getDataValue("id"));
  createdStoreIds.push(conflictStoreId);
  const existingConflictRequest = await StorePaymentProfileRequest.create({
    storeId: conflictStoreId,
    requestStatus: "DRAFT",
    accountName: "Existing account",
    merchantName: "Existing merchant",
    qrisImageUrl: "/uploads/products/existing-qris.png",
  } as any);
  createdPaymentRequestIds.push(Number(existingConflictRequest.getDataValue("id")));

  const conflictApproveResponse = await adminClient.request(
    `/api/admin/store-applications/${conflictApplication.applicationId}/approve`,
    {
      method: "PATCH",
      body: JSON.stringify({ internalAdminNote: "Must roll back." }),
    }
  );
  assertStatus(conflictApproveResponse, 409, "Payment Profile request conflict");
  assert.equal(conflictApproveResponse.body?.code, "PAYMENT_PROFILE_REQUEST_CONFLICT");
  const conflictApplicationRow = await StoreApplication.findByPk(
    conflictApplication.applicationId
  );
  assert.equal(
    conflictApplicationRow?.getDataValue("status"),
    "submitted",
    "conflicting approval must leave the application submitted"
  );
  assert.equal(
    await StorePaymentProfileRequest.count({ where: { storeId: conflictStoreId } as any }),
    1,
    "conflicting approval must not create another Payment Profile request"
  );
  assert.equal(
    await StoreMember.count({ where: { storeId: conflictStoreId } as any }),
    0,
    "conflicting approval must roll back owner membership provisioning"
  );
  logPass("open Payment Profile request rolls back Store Application approval");

  logStep("revision requested does not activate seller store");
  const revisionRequestResponse = await adminClient.request(
    `/api/admin/store-applications/${revisionApplication.applicationId}/revision-request`,
    {
      method: "PATCH",
      body: JSON.stringify({
        revisionNote: "Please revise address details.",
        revisionSummary: "Address needs clarification.",
        internalAdminNote: "Activation smoke revision.",
      }),
    }
  );
  assertStatus(revisionRequestResponse, 200, "revision request");
  const revisionStoresAfter = await revisionClient.request("/api/seller/stores");
  assertStatus(revisionStoresAfter, 200, "revision applicant seller stores after revision");
  assert.equal(
    Array.isArray(revisionStoresAfter.body?.data) ? revisionStoresAfter.body.data.length : -1,
    0,
    "revision-requested applicant should still have no seller stores"
  );
  logPass("revision requested does not activate seller store");

  logStep("rejected application does not activate seller store");
  const rejectResponse = await adminClient.request(
    `/api/admin/store-applications/${rejectedApplication.applicationId}/reject`,
    {
      method: "PATCH",
      body: JSON.stringify({
        rejectReason: "Compliance declaration is not acceptable.",
        internalAdminNote: "Activation smoke reject.",
      }),
    }
  );
  assertStatus(rejectResponse, 200, "reject application");
  const rejectedStoresAfter = await rejectedClient.request("/api/seller/stores");
  assertStatus(rejectedStoresAfter, 200, "rejected applicant seller stores after reject");
  assert.equal(
    Array.isArray(rejectedStoresAfter.body?.data) ? rejectedStoresAfter.body.data.length : -1,
    0,
    "rejected applicant should still have no seller stores"
  );
  logPass("rejected application does not activate seller store");

  console.log("[mvf-store-activation] OK");
}

run()
  .catch((error) => {
    console.error("[mvf-store-activation] FAIL", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanupFixtures().catch((cleanupError) => {
      console.error("[mvf-store-activation] cleanup failed", cleanupError);
      process.exitCode = 1;
    });
    await sequelize.close().catch(() => null);
  });
