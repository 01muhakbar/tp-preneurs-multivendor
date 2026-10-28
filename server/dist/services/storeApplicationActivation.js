import { Op } from "sequelize";
import { sequelize, Store, StoreApplication, StoreMember, StorePaymentProfile, StorePaymentProfileRequest, StoreRole, User, } from "../models/index.js";
import { buildStoreApplicationMutationMetadata, normalizeStoreApplicationSnapshots, } from "./storeApplication.js";
import { SELLER_ROLE_CODES } from "./seller/permissionMap.js";
import { ensureSystemStoreRoles } from "./seller/storeRoles.js";
import { openSellerPaymentRequestStatuses } from "./sharedContracts/storePaymentProfileState.js";
export class StoreApplicationActivationError extends Error {
    constructor(code, message, status = 409) {
        super(message);
        this.name = "StoreApplicationActivationError";
        this.code = code;
        this.status = status;
    }
}
const getAttr = (row, key) => row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key] ?? row?.[key];
const toText = (value) => {
    const normalized = String(value ?? "").trim();
    return normalized || null;
};
const normalizeObject = (value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            return parsed && typeof parsed === "object" && !Array.isArray(parsed)
                ? parsed
                : {};
        }
        catch {
            return {};
        }
    }
    return {};
};
const normalizeStoreSlug = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
const resolveTypedSocialUrl = (value, platform) => {
    const normalized = toText(value);
    if (!normalized)
        return null;
    const lowered = normalized.toLowerCase();
    if (platform === "instagram" && lowered.includes("instagram"))
        return normalized;
    if (platform === "tiktok" && lowered.includes("tiktok"))
        return normalized;
    return null;
};
export const readOnboardingMetadata = (application) => {
    const metadata = normalizeObject(getAttr(application, "internalMetadata"));
    return normalizeObject(metadata.sellerOnboarding2026);
};
const readUploadedAssetUrl = (value) => {
    const source = normalizeObject(value);
    return toText(source.url) || toText(value);
};
const mergeDefinedObject = (current, incoming) => ({
    ...normalizeObject(current),
    ...Object.fromEntries(Object.entries(normalizeObject(incoming)).filter(([, value]) => value !== null && value !== undefined && value !== "")),
});
const buildStoreSlugBase = (application) => {
    const snapshots = normalizeStoreApplicationSnapshots(application);
    return (normalizeStoreSlug(snapshots.storeInformationSnapshot.storeSlug) ||
        normalizeStoreSlug(snapshots.storeInformationSnapshot.storeName) ||
        normalizeStoreSlug(snapshots.ownerIdentitySnapshot.fullName) ||
        `store-${Number(getAttr(application, "applicantUserId") || 0) || "applicant"}`);
};
const loadOwnerStoreRole = async (transaction) => StoreRole.findOne({
    where: {
        code: SELLER_ROLE_CODES.STORE_OWNER,
        isActive: true,
    },
    transaction,
});
const findAvailableStoreSlug = async (application, transaction) => {
    const applicationId = Number(getAttr(application, "id") || 0) || Date.now();
    const base = buildStoreSlugBase(application) || `store-${applicationId}`;
    const candidates = [base, `${base}-${applicationId}`];
    for (const candidate of candidates) {
        const existing = await Store.findOne({
            where: { slug: candidate },
            attributes: ["id"],
            transaction,
        });
        if (!existing)
            return candidate;
    }
    let suffix = 2;
    while (suffix < 1000) {
        const candidate = `${base}-${applicationId}-${suffix}`;
        const existing = await Store.findOne({
            where: { slug: candidate },
            attributes: ["id"],
            transaction,
        });
        if (!existing)
            return candidate;
        suffix += 1;
    }
    return `${base}-${Date.now()}`;
};
const buildStoreCreatePayload = (application, slug) => {
    const snapshots = normalizeStoreApplicationSnapshots(application);
    const onboarding = readOnboardingMetadata(application);
    const pickupSameAsBusiness = onboarding.pickupSameAsBusiness !== false;
    const pickupAddress = toText(onboarding.pickupAddress);
    const originAddressLine1 = (!pickupSameAsBusiness && pickupAddress
        ? pickupAddress
        : toText(snapshots.operationalAddressSnapshot.addressLine1)) ||
        toText(onboarding.addressLine1) ||
        toText(onboarding.businessAddress);
    return {
        ownerUserId: Number(getAttr(application, "applicantUserId") || 0),
        name: toText(snapshots.storeInformationSnapshot.storeName) ||
            toText(onboarding.storeName) ||
            toText(snapshots.ownerIdentitySnapshot.fullName) ||
            toText(onboarding.ownerName) ||
            `Store ${Number(getAttr(application, "applicantUserId") || 0)}`,
        slug,
        status: "INACTIVE",
        description: toText(snapshots.storeInformationSnapshot.description) ||
            toText(onboarding.description) ||
            "Toko resmi di TP Preneurs",
        logoUrl: readUploadedAssetUrl(onboarding.storeLogo),
        bannerUrl: readUploadedAssetUrl(onboarding.storeBanner),
        email: toText(snapshots.complianceSnapshot.supportEmail) ||
            toText(onboarding.email) ||
            toText(snapshots.ownerIdentitySnapshot.email) ||
            toText(onboarding.ownerEmail),
        phone: toText(onboarding.phone) ||
            toText(onboarding.whatsapp) ||
            toText(snapshots.operationalAddressSnapshot.phoneNumber) ||
            toText(snapshots.ownerIdentitySnapshot.phoneNumber) ||
            toText(onboarding.ownerPhone),
        whatsapp: toText(onboarding.whatsapp) ||
            toText(onboarding.phone) ||
            toText(snapshots.operationalAddressSnapshot.phoneNumber) ||
            toText(snapshots.ownerIdentitySnapshot.phoneNumber) ||
            toText(onboarding.ownerPhone),
        websiteUrl: toText(snapshots.complianceSnapshot.websiteUrl) ||
            toText(onboarding.websiteUrl),
        instagramUrl: resolveTypedSocialUrl(snapshots.complianceSnapshot.socialMediaUrl, "instagram") || toText(onboarding.instagramUrl),
        tiktokUrl: resolveTypedSocialUrl(snapshots.complianceSnapshot.socialMediaUrl, "tiktok") || toText(onboarding.tiktokUrl),
        addressLine1: toText(onboarding.addressLine1) ||
            toText(snapshots.operationalAddressSnapshot.addressLine1) ||
            toText(onboarding.businessAddress),
        addressLine2: toText(onboarding.addressLine2) ||
            toText(snapshots.operationalAddressSnapshot.addressLine2),
        city: toText(onboarding.city) ||
            toText(snapshots.operationalAddressSnapshot.city) ||
            toText(onboarding.businessCity),
        district: toText(onboarding.district) ||
            toText(snapshots.operationalAddressSnapshot.district) ||
            toText(onboarding.businessSubdistrict),
        province: toText(onboarding.province) ||
            toText(snapshots.operationalAddressSnapshot.province) ||
            toText(onboarding.businessProvince),
        postalCode: toText(onboarding.postalCode) ||
            toText(snapshots.operationalAddressSnapshot.postalCode) ||
            toText(onboarding.businessPostalCode),
        country: toText(onboarding.country) ||
            toText(snapshots.operationalAddressSnapshot.country) ||
            toText(onboarding.businessCountry) ||
            "Indonesia",
        ownerIdentity: {
            fullName: toText(snapshots.ownerIdentitySnapshot.fullName) ||
                toText(onboarding.ownerName),
            email: toText(snapshots.ownerIdentitySnapshot.email) ||
                toText(onboarding.ownerEmail),
            phoneNumber: toText(snapshots.ownerIdentitySnapshot.phoneNumber) ||
                toText(onboarding.ownerPhone),
            birthDate: toText(snapshots.ownerIdentitySnapshot.birthDate) ||
                toText(onboarding.birthDate),
            identityType: toText(snapshots.ownerIdentitySnapshot.identityType) ||
                toText(onboarding.identityType) ||
                "KTP",
            identityNumber: toText(snapshots.complianceSnapshot.identityNumber) ||
                toText(onboarding.identityNumber),
            taxNumber: toText(snapshots.complianceSnapshot.taxId) ||
                toText(onboarding.taxNumber),
            residentialAddress: toText(onboarding.residentialAddress),
            country: toText(onboarding.ownerCountry) || "Indonesia",
            province: toText(onboarding.ownerProvince),
            city: toText(onboarding.ownerCity),
            subdistrict: toText(onboarding.ownerSubdistrict),
            postalCode: toText(onboarding.ownerPostalCode),
        },
        businessDetails: {
            category: toText(snapshots.storeInformationSnapshot.storeCategory) ||
                toText(onboarding.category),
            businessType: toText(snapshots.storeInformationSnapshot.sellerType) ||
                toText(onboarding.businessType),
            legalEntity: toText(onboarding.legalEntity) ||
                toText(snapshots.operationalAddressSnapshot.notes),
            pickupSameAsBusiness,
            pickupAddress,
            businessAddress: toText(onboarding.businessAddress) ||
                toText(snapshots.operationalAddressSnapshot.addressLine1),
            businessProvince: toText(onboarding.businessProvince) ||
                toText(snapshots.operationalAddressSnapshot.province),
            businessCity: toText(onboarding.businessCity) ||
                toText(snapshots.operationalAddressSnapshot.city),
            businessSubdistrict: toText(onboarding.businessSubdistrict) ||
                toText(snapshots.operationalAddressSnapshot.district),
            businessPostalCode: toText(onboarding.businessPostalCode) ||
                toText(snapshots.operationalAddressSnapshot.postalCode),
            businessCountry: toText(onboarding.businessCountry) ||
                toText(snapshots.operationalAddressSnapshot.country) ||
                "Indonesia",
            timeZone: toText(onboarding.timeZone),
            openTime: toText(onboarding.openTime),
            closeTime: toText(onboarding.closeTime),
            workingDays: toText(onboarding.workingDays),
            shippingMethod: toText(onboarding.shippingMethod),
            processingTime: toText(onboarding.processingTime),
        },
        shippingSetup: {
            shippingEnabled: true,
            originContactName: toText(snapshots.operationalAddressSnapshot.contactName) ||
                toText(snapshots.ownerIdentitySnapshot.fullName) ||
                toText(onboarding.ownerName),
            originPhone: toText(snapshots.operationalAddressSnapshot.phoneNumber) ||
                toText(onboarding.phone) ||
                toText(snapshots.ownerIdentitySnapshot.phoneNumber) ||
                toText(onboarding.ownerPhone),
            originAddressLine1,
            originAddressLine2: pickupSameAsBusiness
                ? toText(snapshots.operationalAddressSnapshot.addressLine2) ||
                    toText(onboarding.addressLine2)
                : toText(onboarding.pickupAddressLine2),
            originDistrict: toText(snapshots.operationalAddressSnapshot.district) ||
                toText(onboarding.district) ||
                toText(onboarding.businessSubdistrict),
            originCity: toText(snapshots.operationalAddressSnapshot.city) ||
                toText(onboarding.city) ||
                toText(onboarding.businessCity),
            originProvince: toText(snapshots.operationalAddressSnapshot.province) ||
                toText(onboarding.province) ||
                toText(onboarding.businessProvince),
            originPostalCode: toText(snapshots.operationalAddressSnapshot.postalCode) ||
                toText(onboarding.postalCode) ||
                toText(onboarding.businessPostalCode),
            originCountry: toText(snapshots.operationalAddressSnapshot.country) ||
                toText(onboarding.country) ||
                "Indonesia",
            pickupNotes: toText(onboarding.pickupNotes),
        },
    };
};
const ensureOwnerMembership = async (input) => {
    const ownerRole = await loadOwnerStoreRole(input.transaction);
    if (!ownerRole) {
        throw new Error("STORE_OWNER role is missing.");
    }
    const existing = await StoreMember.findOne({
        where: {
            storeId: input.storeId,
            userId: input.ownerUserId,
        },
        transaction: input.transaction,
    });
    if (!existing) {
        return StoreMember.create({
            storeId: input.storeId,
            userId: input.ownerUserId,
            storeRoleId: Number(getAttr(ownerRole, "id") || 0),
            status: "ACTIVE",
            acceptedAt: new Date(),
            disabledAt: null,
            disabledByUserId: null,
            removedAt: null,
            removedByUserId: null,
        }, { transaction: input.transaction });
    }
    const patch = {};
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
const loadActivePaymentProfile = async (store, transaction) => {
    const activeProfileId = Number(getAttr(store, "activeStorePaymentProfileId") || 0);
    if (activeProfileId > 0) {
        const activeProfile = await StorePaymentProfile.findByPk(activeProfileId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        if (activeProfile)
            return activeProfile;
    }
    return StorePaymentProfile.findOne({
        where: {
            storeId: Number(getAttr(store, "id") || 0),
            snapshotStatus: "ACTIVE",
            isActive: true,
        },
        order: [
            ["version", "DESC"],
            ["id", "DESC"],
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
    });
};
const ensureSubmittedPaymentProfileRequest = async (input) => {
    const storeId = Number(getAttr(input.store, "id") || 0);
    const linkedRequestId = Number(input.currentActivation.paymentProfileRequestId || 0);
    if (linkedRequestId > 0) {
        const linkedRequest = await StorePaymentProfileRequest.findOne({
            where: { id: linkedRequestId, storeId },
            transaction: input.transaction,
            lock: input.transaction.LOCK.UPDATE,
        });
        if (linkedRequest)
            return linkedRequest;
    }
    const existingOpenRequest = await StorePaymentProfileRequest.findOne({
        where: {
            storeId,
            requestStatus: { [Op.in]: [...openSellerPaymentRequestStatuses] },
        },
        order: [
            ["updatedAt", "DESC"],
            ["id", "DESC"],
        ],
        transaction: input.transaction,
        lock: input.transaction.LOCK.UPDATE,
    });
    if (existingOpenRequest) {
        throw new StoreApplicationActivationError("PAYMENT_PROFILE_REQUEST_CONFLICT", "This store already has an open Payment Profile request. Resolve it before approving the Store Application.");
    }
    const payout = normalizeStoreApplicationSnapshots(input.application).payoutPaymentSnapshot;
    const accountName = toText(payout.accountName);
    const merchantName = toText(payout.merchantName);
    const qrisImageUrl = toText(payout.qrisImageUrl);
    if (!accountName || !merchantName || !qrisImageUrl) {
        return null;
    }
    const activeProfile = await loadActivePaymentProfile(input.store, input.transaction);
    return StorePaymentProfileRequest.create({
        storeId,
        basedOnProfileId: Number(getAttr(activeProfile, "id") || 0) || null,
        requestStatus: "SUBMITTED",
        accountName,
        merchantName,
        merchantId: toText(payout.merchantId),
        bankName: toText(payout.bankName),
        accountNumber: toText(payout.accountNumber),
        accountHolderName: toText(payout.accountHolderName) || accountName,
        payoutProofImageUrl: toText(payout.payoutProofImageUrl),
        qrisImageUrl,
        qrisPayload: toText(payout.qrisPayload),
        instructionText: toText(payout.instructionText),
        sellerNote: toText(payout.sellerNote),
        submittedByUserId: input.applicantUserId,
        submittedAt: input.approvalAt,
        reviewedByAdminId: null,
        reviewedAt: null,
        adminReviewNote: null,
    }, { transaction: input.transaction });
};
export async function provisionApprovedStoreApplication(application, options) {
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
            throw new StoreApplicationActivationError("STORE_APPLICATION_APPROVE_NOT_ALLOWED", "This store application cannot be approved from its current status.");
        }
        const currentMetadata = normalizeObject(getAttr(lockedApplication, "internalMetadata"));
        const currentActivation = normalizeObject(currentMetadata.activation);
        const currentAdminReview = normalizeObject(currentMetadata.adminReview);
        const approvalAt = new Date();
        let store = await Store.findOne({
            where: { ownerUserId: applicantUserId },
            transaction,
            lock: transaction.LOCK.UPDATE,
        });
        let provisionedMode = "reused_store";
        if (!store) {
            const slug = await findAvailableStoreSlug(lockedApplication, transaction);
            store = await Store.create(buildStoreCreatePayload(lockedApplication, slug), {
                transaction,
            });
            provisionedMode = "created_store";
        }
        else {
            const synchronizedProfile = buildStoreCreatePayload(lockedApplication, String(getAttr(store, "slug") || ""));
            const reusableStorePatch = Object.fromEntries(Object.entries(synchronizedProfile).filter(([key, value]) => !["ownerUserId", "slug", "status"].includes(key) && value !== null));
            reusableStorePatch.ownerIdentity = mergeDefinedObject(getAttr(store, "ownerIdentity"), synchronizedProfile.ownerIdentity);
            reusableStorePatch.businessDetails = mergeDefinedObject(getAttr(store, "businessDetails"), synchronizedProfile.businessDetails);
            reusableStorePatch.shippingSetup = mergeDefinedObject(getAttr(store, "shippingSetup"), synchronizedProfile.shippingSetup);
            await store.update(reusableStorePatch, { transaction });
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
        const nextMetadata = buildStoreApplicationMutationMetadata(currentMetadata, {
            adminReview: {
                ...currentAdminReview,
                internalAdminNote: options.internalAdminNote !== undefined
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
                paymentProfileRequestId: paymentProfileRequest
                    ? Number(getAttr(paymentProfileRequest, "id") || 0) || null
                    : null,
                paymentProfileRequestStatus: paymentProfileRequest
                    ? String(getAttr(paymentProfileRequest, "requestStatus") || "SUBMITTED")
                    : null,
                paymentProfileHandoffSource: paymentProfileRequest ? "store_application" : null,
            },
        });
        await lockedApplication.update({
            status: "approved",
            reviewedAt: approvalAt,
            reviewedByUserId: options.adminUserId,
            revisionNote: null,
            rejectReason: null,
            internalMetadata: nextMetadata,
        }, { transaction });
        if (User && applicantUserId > 0) {
            await User.update({ role: "seller" }, { where: { id: applicantUserId }, transaction });
        }
        return {
            store,
            membership,
            paymentProfileRequest,
            activation: nextMetadata.activation,
        };
    });
}
