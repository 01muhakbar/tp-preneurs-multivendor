import { Op, Transaction } from "sequelize";
import {
  sequelize,
  Store,
  StoreApplication,
  StoreMember,
  StorePaymentProfile,
  StorePaymentProfileRequest,
  StoreRole,
} from "../models/index.js";
import {
  buildStoreApplicationMutationMetadata,
  normalizeStoreApplicationSnapshots,
} from "./storeApplication.js";
import { SELLER_ROLE_CODES } from "./seller/permissionMap.js";
import { ensureSystemStoreRoles } from "./seller/storeRoles.js";
import { openSellerPaymentRequestStatuses } from "./sharedContracts/storePaymentProfileState.js";

export class StoreApplicationActivationError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 409) {
    super(message);
    this.name = "StoreApplicationActivationError";
    this.code = code;
    this.status = status;
  }
}

const getAttr = (row: any, key: string) =>
  row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key] ?? row?.[key];

const toText = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

const normalizeObject = (value: unknown) => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Record<string, any>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
};

const normalizeStoreSlug = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const resolveTypedSocialUrl = (value: unknown, platform: "instagram" | "tiktok") => {
  const normalized = toText(value);
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();
  if (platform === "instagram" && lowered.includes("instagram")) return normalized;
  if (platform === "tiktok" && lowered.includes("tiktok")) return normalized;
  return null;
};

const readOnboardingMetadata = (application: any) => {
  const metadata = normalizeObject(getAttr(application, "internalMetadata"));
  return normalizeObject(metadata.sellerOnboarding2026);
};

const readUploadedAssetUrl = (value: unknown) => {
  const source = normalizeObject(value);
  return toText(source.url) || toText(value);
};

const mergeDefinedObject = (current: unknown, incoming: unknown) => ({
  ...normalizeObject(current),
  ...Object.fromEntries(
    Object.entries(normalizeObject(incoming)).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  ),
});

const buildStoreSlugBase = (application: any) => {
  const snapshots = normalizeStoreApplicationSnapshots(application);

  return (
    normalizeStoreSlug(snapshots.storeInformationSnapshot.storeSlug) ||
    normalizeStoreSlug(snapshots.storeInformationSnapshot.storeName) ||
    normalizeStoreSlug(snapshots.ownerIdentitySnapshot.fullName) ||
    `store-${Number(getAttr(application, "applicantUserId") || 0) || "applicant"}`
  );
};

const loadOwnerStoreRole = async (transaction?: Transaction) =>
  StoreRole.findOne({
    where: {
      code: SELLER_ROLE_CODES.STORE_OWNER,
      isActive: true,
    } as any,
    transaction,
  });

const findAvailableStoreSlug = async (
  application: any,
  transaction?: Transaction
): Promise<string> => {
  const applicationId = Number(getAttr(application, "id") || 0) || Date.now();
  const base = buildStoreSlugBase(application) || `store-${applicationId}`;
  const candidates = [base, `${base}-${applicationId}`];

  for (const candidate of candidates) {
    const existing = await Store.findOne({
      where: { slug: candidate } as any,
      attributes: ["id"],
      transaction,
    });
    if (!existing) return candidate;
  }

  let suffix = 2;
  while (suffix < 1000) {
    const candidate = `${base}-${applicationId}-${suffix}`;
    const existing = await Store.findOne({
      where: { slug: candidate } as any,
      attributes: ["id"],
      transaction,
    });
    if (!existing) return candidate;
    suffix += 1;
  }

  return `${base}-${Date.now()}`;
};

const buildStoreCreatePayload = (application: any, slug: string) => {
  const snapshots = normalizeStoreApplicationSnapshots(application);
  const onboarding = readOnboardingMetadata(application);
  const pickupSameAsBusiness = onboarding.pickupSameAsBusiness !== false;
  const pickupAddress = toText(onboarding.pickupAddress);
  const originAddressLine1 =
    !pickupSameAsBusiness && pickupAddress
      ? pickupAddress
      : toText(snapshots.operationalAddressSnapshot.addressLine1);

  return {
    ownerUserId: Number(getAttr(application, "applicantUserId") || 0),
    name:
      toText(snapshots.storeInformationSnapshot.storeName) ||
      toText(snapshots.ownerIdentitySnapshot.fullName) ||
      `Store ${Number(getAttr(application, "applicantUserId") || 0)}`,
    slug,
    status: "INACTIVE",
    description: toText(snapshots.storeInformationSnapshot.description),
    logoUrl: readUploadedAssetUrl(onboarding.storeLogo),
    bannerUrl: readUploadedAssetUrl(onboarding.storeBanner),
    email:
      toText(snapshots.complianceSnapshot.supportEmail) ||
      toText(snapshots.ownerIdentitySnapshot.email),
    phone:
      toText(snapshots.operationalAddressSnapshot.phoneNumber) ||
      toText(snapshots.ownerIdentitySnapshot.phoneNumber),
    whatsapp:
      toText(snapshots.operationalAddressSnapshot.phoneNumber) ||
      toText(snapshots.ownerIdentitySnapshot.phoneNumber),
    websiteUrl: toText(snapshots.complianceSnapshot.websiteUrl),
    instagramUrl: resolveTypedSocialUrl(
      snapshots.complianceSnapshot.socialMediaUrl,
      "instagram"
    ),
    tiktokUrl: resolveTypedSocialUrl(
      snapshots.complianceSnapshot.socialMediaUrl,
      "tiktok"
    ),
    addressLine1: toText(snapshots.operationalAddressSnapshot.addressLine1),
    addressLine2: toText(snapshots.operationalAddressSnapshot.addressLine2),
    city: toText(snapshots.operationalAddressSnapshot.city),
    district: toText(snapshots.operationalAddressSnapshot.district),
    province: toText(snapshots.operationalAddressSnapshot.province),
    postalCode: toText(snapshots.operationalAddressSnapshot.postalCode),
    country: toText(snapshots.operationalAddressSnapshot.country),
    ownerIdentity: {
      fullName: toText(snapshots.ownerIdentitySnapshot.fullName),
      email: toText(snapshots.ownerIdentitySnapshot.email),
      phoneNumber: toText(snapshots.ownerIdentitySnapshot.phoneNumber),
      birthDate: toText(snapshots.ownerIdentitySnapshot.birthDate),
      identityType: toText(snapshots.ownerIdentitySnapshot.identityType),
      identityNumber: toText(snapshots.complianceSnapshot.identityNumber),
      taxNumber: toText(snapshots.complianceSnapshot.taxId),
      residentialAddress: toText(onboarding.residentialAddress),
      country: toText(onboarding.ownerCountry) || "Indonesia",
      province: toText(onboarding.ownerProvince),
      city: toText(onboarding.ownerCity),
      subdistrict: toText(onboarding.ownerSubdistrict),
      postalCode: toText(onboarding.ownerPostalCode),
    },
    businessDetails: {
      category: toText(snapshots.storeInformationSnapshot.storeCategory),
      businessType: toText(snapshots.storeInformationSnapshot.sellerType),
      legalEntity:
        toText(onboarding.legalEntity) ||
        toText(snapshots.operationalAddressSnapshot.notes),
      pickupSameAsBusiness,
      pickupAddress,
      timeZone: toText(onboarding.timeZone),
      openTime: toText(onboarding.openTime),
      closeTime: toText(onboarding.closeTime),
      workingDays: toText(onboarding.workingDays),
      shippingMethod: toText(onboarding.shippingMethod),
      processingTime: toText(onboarding.processingTime),
    },
    shippingSetup: {
      shippingEnabled: true,
      originContactName:
        toText(snapshots.operationalAddressSnapshot.contactName) ||
        toText(snapshots.ownerIdentitySnapshot.fullName),
      originPhone:
        toText(snapshots.operationalAddressSnapshot.phoneNumber) ||
        toText(snapshots.ownerIdentitySnapshot.phoneNumber),
      originAddressLine1,
      originAddressLine2: pickupSameAsBusiness
        ? toText(snapshots.operationalAddressSnapshot.addressLine2)
        : null,
      originDistrict: toText(snapshots.operationalAddressSnapshot.district),
      originCity: toText(snapshots.operationalAddressSnapshot.city),
      originProvince: toText(snapshots.operationalAddressSnapshot.province),
      originPostalCode: toText(snapshots.operationalAddressSnapshot.postalCode),
      originCountry: toText(snapshots.operationalAddressSnapshot.country) || "Indonesia",
      pickupNotes: null,
    },
  };
};

const ensureOwnerMembership = async (input: {
  storeId: number;
  ownerUserId: number;
  transaction?: Transaction;
}) => {
  const ownerRole = await loadOwnerStoreRole(input.transaction);
  if (!ownerRole) {
    throw new Error("STORE_OWNER role is missing.");
  }

  const existing = await StoreMember.findOne({
    where: {
      storeId: input.storeId,
      userId: input.ownerUserId,
    } as any,
    transaction: input.transaction,
  });

  if (!existing) {
    return StoreMember.create(
      {
        storeId: input.storeId,
        userId: input.ownerUserId,
        storeRoleId: Number(getAttr(ownerRole, "id") || 0),
        status: "ACTIVE",
        acceptedAt: new Date(),
        disabledAt: null,
        disabledByUserId: null,
        removedAt: null,
        removedByUserId: null,
      } as any,
      { transaction: input.transaction }
    );
  }

  const patch: Record<string, unknown> = {};
  if (String(getAttr(existing, "status") || "").toUpperCase() !== "ACTIVE") {
    patch.status = "ACTIVE";
    patch.acceptedAt = getAttr(existing, "acceptedAt") || new Date();
    patch.disabledAt = null;
    patch.disabledByUserId = null;
    patch.removedAt = null;
    patch.removedByUserId = null;
  }
  if (Number(getAttr(existing, "storeRoleId") || 0) !== Number(getAttr(ownerRole, "id") || 0)) {
    patch.storeRoleId = Number(getAttr(ownerRole, "id") || 0);
  }
  if (!getAttr(existing, "acceptedAt")) {
    patch.acceptedAt = getAttr(existing, "createdAt") || new Date();
  }

  if (Object.keys(patch).length > 0) {
    await existing.update(patch, { transaction: input.transaction });
    await existing.reload({ transaction: input.transaction });
  }

  return existing;
};

const loadActivePaymentProfile = async (store: any, transaction: Transaction) => {
  const activeProfileId = Number(getAttr(store, "activeStorePaymentProfileId") || 0);
  if (activeProfileId > 0) {
    const activeProfile = await StorePaymentProfile.findByPk(activeProfileId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (activeProfile) return activeProfile;
  }

  return StorePaymentProfile.findOne({
    where: {
      storeId: Number(getAttr(store, "id") || 0),
      snapshotStatus: "ACTIVE",
      isActive: true,
    } as any,
    order: [
      ["version", "DESC"],
      ["id", "DESC"],
    ],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
};

const ensureSubmittedPaymentProfileRequest = async (input: {
  application: any;
  store: any;
  applicantUserId: number;
  approvalAt: Date;
  currentActivation: Record<string, any>;
  transaction: Transaction;
}) => {
  const storeId = Number(getAttr(input.store, "id") || 0);
  const linkedRequestId = Number(input.currentActivation.paymentProfileRequestId || 0);

  if (linkedRequestId > 0) {
    const linkedRequest = await StorePaymentProfileRequest.findOne({
      where: { id: linkedRequestId, storeId } as any,
      transaction: input.transaction,
      lock: input.transaction.LOCK.UPDATE,
    });
    if (linkedRequest) return linkedRequest;
  }

  const existingOpenRequest = await StorePaymentProfileRequest.findOne({
    where: {
      storeId,
      requestStatus: { [Op.in]: [...openSellerPaymentRequestStatuses] },
    } as any,
    order: [
      ["updatedAt", "DESC"],
      ["id", "DESC"],
    ],
    transaction: input.transaction,
    lock: input.transaction.LOCK.UPDATE,
  });

  if (existingOpenRequest) {
    throw new StoreApplicationActivationError(
      "PAYMENT_PROFILE_REQUEST_CONFLICT",
      "This store already has an open Payment Profile request. Resolve it before approving the Store Application."
    );
  }

  const payout = normalizeStoreApplicationSnapshots(input.application).payoutPaymentSnapshot;
  const accountName = toText(payout.accountName);
  const merchantName = toText(payout.merchantName);
  const qrisImageUrl = toText(payout.qrisImageUrl);
  if (!accountName || !merchantName || !qrisImageUrl) {
    throw new StoreApplicationActivationError(
      "PAYMENT_PROFILE_INCOMPLETE",
      "Complete Account name, Merchant name, and QRIS image before approving this Store Application."
    );
  }

  const activeProfile = await loadActivePaymentProfile(input.store, input.transaction);
  return StorePaymentProfileRequest.create(
    {
      storeId,
      basedOnProfileId: Number(getAttr(activeProfile, "id") || 0) || null,
      requestStatus: "SUBMITTED",
      accountName,
      merchantName,
      merchantId: toText(payout.merchantId),
      bankName: toText(payout.bankName),
      accountNumber: toText(payout.accountNumber),
      accountHolderName: toText(payout.accountHolderName) || accountName,
      payoutProofImageUrl: toText((payout as any).payoutProofImageUrl),
      qrisImageUrl,
      qrisPayload: toText(payout.qrisPayload),
      instructionText: toText(payout.instructionText),
      sellerNote: toText(payout.sellerNote),
      submittedByUserId: input.applicantUserId,
      submittedAt: input.approvalAt,
      reviewedByAdminId: null,
      reviewedAt: null,
      adminReviewNote: null,
    } as any,
    { transaction: input.transaction }
  );
};

export async function provisionApprovedStoreApplication(
  application: any,
  options: { adminUserId: number; internalAdminNote?: string | null }
) {
  await ensureSystemStoreRoles();

  return sequelize.transaction(async (transaction) => {
    const applicationId = Number(getAttr(application, "id") || 0);
    const applicantUserId = Number(getAttr(application, "applicantUserId") || 0);
    if (!(applicationId > 0) || !(applicantUserId > 0)) {
      throw new Error("Invalid store application for provisioning.");
    }

    const lockedApplication = await StoreApplication.findByPk(applicationId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!lockedApplication) {
      throw new Error("Store application not found during provisioning.");
    }

    const currentStatus = String(getAttr(lockedApplication, "status") || "draft");
    if (!["submitted", "under_review"].includes(currentStatus)) {
      throw new StoreApplicationActivationError(
        "STORE_APPLICATION_APPROVE_NOT_ALLOWED",
        "This store application cannot be approved from its current status."
      );
    }

    const currentMetadata = normalizeObject(getAttr(lockedApplication, "internalMetadata"));
    const currentActivation =
      normalizeObject(currentMetadata.activation);
    const currentAdminReview = normalizeObject(currentMetadata.adminReview);
    const approvalAt = new Date();

    let store = await Store.findOne({
      where: { ownerUserId: applicantUserId } as any,
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    let provisionedMode: "created_store" | "reused_store" = "reused_store";
    if (!store) {
      const slug = await findAvailableStoreSlug(lockedApplication, transaction);
      store = await Store.create(buildStoreCreatePayload(lockedApplication, slug) as any, {
        transaction,
      });
      provisionedMode = "created_store";
    } else {
      const synchronizedProfile = buildStoreCreatePayload(
        lockedApplication,
        String(getAttr(store, "slug") || "")
      );
      const reusableStorePatch: Record<string, any> = Object.fromEntries(
        Object.entries(synchronizedProfile).filter(
          ([key, value]) =>
            !["ownerUserId", "slug", "status"].includes(key) && value !== null
        )
      );
      reusableStorePatch.ownerIdentity = mergeDefinedObject(
        getAttr(store, "ownerIdentity"),
        synchronizedProfile.ownerIdentity
      );
      reusableStorePatch.businessDetails = mergeDefinedObject(
        getAttr(store, "businessDetails"),
        synchronizedProfile.businessDetails
      );
      reusableStorePatch.shippingSetup = mergeDefinedObject(
        getAttr(store, "shippingSetup"),
        synchronizedProfile.shippingSetup
      );
      await store.update(reusableStorePatch as any, { transaction });
    }

    const membership = await ensureOwnerMembership({
      storeId: Number(getAttr(store, "id") || 0),
      ownerUserId: applicantUserId,
      transaction,
    });

    const paymentProfileRequest = await ensureSubmittedPaymentProfileRequest({
      application: lockedApplication,
      store,
      applicantUserId,
      approvalAt,
      currentActivation,
      transaction,
    });

    const nextMetadata: any = buildStoreApplicationMutationMetadata(currentMetadata, {
      adminReview: {
        ...currentAdminReview,
        internalAdminNote:
          options.internalAdminNote !== undefined
            ? options.internalAdminNote || null
            : currentAdminReview.internalAdminNote || null,
        lastAction: "approved",
        lastActionAt: approvalAt.toISOString(),
      },
      activation: {
        ...currentActivation,
        storeId: Number(getAttr(store, "id") || 0),
        storeSlug: toText(getAttr(store, "slug")),
        storeStatus: toText(getAttr(store, "status")) || "INACTIVE",
        ownerMembershipId: Number(getAttr(membership, "id") || 0) || null,
        ownerMembershipStatus: toText(getAttr(membership, "status")) || "ACTIVE",
        sellerAccessReady: true,
        provisionedAt: new Date().toISOString(),
        provisionedMode,
        source: "store_application_approval",
        paymentProfileRequestId: Number(getAttr(paymentProfileRequest, "id") || 0),
        paymentProfileRequestStatus: String(
          getAttr(paymentProfileRequest, "requestStatus") || "SUBMITTED"
        ),
        paymentProfileHandoffSource: "store_application",
      },
    });

    await lockedApplication.update(
      {
        status: "approved",
        reviewedAt: approvalAt,
        reviewedByUserId: options.adminUserId,
        revisionNote: null,
        rejectReason: null,
        internalMetadata: nextMetadata,
      } as any,
      { transaction }
    );

    return {
      store,
      membership,
      paymentProfileRequest,
      activation: nextMetadata.activation,
    };
  });
}
