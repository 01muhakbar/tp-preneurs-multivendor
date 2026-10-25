import { Router } from "express";
import requireSellerStoreAccess from "../middleware/requireSellerStoreAccess.js";
import { Store, StoreApplication } from "../models/index.js";
import { normalizeStoreApplicationSnapshots } from "../services/storeApplication.js";
import { readOnboardingMetadata } from "../services/storeApplicationActivation.js";
import {
  READ_ONLY_STORE_PROFILE_FIELDS,
  SELLER_EDITABLE_STORE_PROFILE_FIELDS,
  STORE_PROFILE_ATTRIBUTES,
  getStoreProfileAttr,
  mergeStoredProfileObjectPatch,
  normalizeStoredProfileObject,
  sellerStoreProfilePatchSchema,
  serializeStoreProfileSnapshot,
  shouldDeactivateStoreForMissingSellerRequirements,
} from "../services/sharedContracts/storeProfileGovernance.js";
import { mergeSellerShippingSetupPatch } from "../services/sellerShippingSetup.service.js";
import { buildPublicStoreOperationalReadiness } from "../services/sharedContracts/publicStoreIdentity.js";
import { STORE_PAYMENT_PROFILE_BASE_ATTRIBUTES } from "../services/sharedContracts/storePaymentProfileCompat.js";

const router = Router();

const deactivateStoreIfSellerRequirementsMissing = async (store: any) => {
  if (!store) return store;
  const currentStatus = String(store.get?.("status") ?? store.status ?? "").toUpperCase();
  if (
    currentStatus === "ACTIVE" &&
    shouldDeactivateStoreForMissingSellerRequirements(store)
  ) {
    await store.update({ status: "INACTIVE" } as any);
  }
  return store;
};

const serializeSellerStoreProfilePayload = (store: any, sellerAccess: any) => ({
  ...serializeStoreProfileSnapshot(store, {
    actor: "seller",
    canEdit: Array.isArray(sellerAccess?.permissionKeys)
      ? sellerAccess.permissionKeys.includes("STORE_EDIT")
      : false,
  }),
  operationalReadiness: buildPublicStoreOperationalReadiness(store),
  boundaries: {
    readinessSourceOfTruth:
      "Operational readiness is derived by the backend from store status and active payment profile readiness.",
    storefrontBoundary:
      "Public store and visit-store CTAs stay gated until operational readiness is READY.",
  },
});

const syncStoreFromStoreApplication = async (store: any, req: any) => {
  if (!store) return store;
  try {
    const storeId = Number(getStoreProfileAttr(store, "id") || 0);
    const ownerUserId = Number(
      getStoreProfileAttr(store, "ownerUserId") ||
        (store as any).ownerUserId ||
        req?.user?.id ||
        0
    );

    let application: any = null;
    if (ownerUserId > 0) {
      const userApps = await StoreApplication.findAll({
        where: { applicantUserId: ownerUserId } as any,
        order: [["updatedAt", "DESC"], ["id", "DESC"]],
      });
      application =
        userApps.find((app: any) => app.status === "approved") ||
        userApps.find((app: any) => ["under_review", "submitted"].includes(app.status)) ||
        userApps[0];
    }

    if (!application && storeId > 0) {
      const candidates = await StoreApplication.findAll({
        limit: 50,
        order: [["updatedAt", "DESC"], ["id", "DESC"]],
      });
      application = candidates.find((cand: any) => {
        const meta = cand.internalMetadata || {};
        return Number(meta?.activation?.storeId) === storeId;
      });
    }

    if (!application) return store;

    const snapshots = normalizeStoreApplicationSnapshots(application);
    const onboarding = readOnboardingMetadata(application);

    const currentBusinessDetails =
      normalizeStoredProfileObject(getStoreProfileAttr(store, "businessDetails")) || {};
    const currentOwnerIdentity =
      normalizeStoredProfileObject(getStoreProfileAttr(store, "ownerIdentity")) || {};
    const currentShippingSetup =
      normalizeStoredProfileObject(getStoreProfileAttr(store, "shippingSetup")) || {};

    const patch: Record<string, any> = {};

    const backfill = (key: string, incoming: any) => {
      const current = getStoreProfileAttr(store, key);
      const normalized = String(incoming ?? "").trim();
      if ((current === null || current === undefined || String(current).trim() === "") && normalized) {
        patch[key] = normalized;
      }
    };

    backfill("description", snapshots.storeInformationSnapshot.description || onboarding.description);
    backfill(
      "email",
      snapshots.complianceSnapshot.supportEmail ||
        onboarding.email ||
        snapshots.ownerIdentitySnapshot.email ||
        onboarding.ownerEmail
    );
    backfill(
      "phone",
      onboarding.phone ||
        onboarding.whatsapp ||
        snapshots.operationalAddressSnapshot.phoneNumber ||
        snapshots.ownerIdentitySnapshot.phoneNumber ||
        onboarding.ownerPhone
    );
    backfill(
      "whatsapp",
      onboarding.whatsapp ||
        onboarding.phone ||
        snapshots.operationalAddressSnapshot.phoneNumber ||
        snapshots.ownerIdentitySnapshot.phoneNumber ||
        onboarding.ownerPhone
    );
    backfill(
      "addressLine1",
      onboarding.addressLine1 ||
        snapshots.operationalAddressSnapshot.addressLine1 ||
        onboarding.businessAddress
    );
    backfill(
      "addressLine2",
      onboarding.addressLine2 || snapshots.operationalAddressSnapshot.addressLine2
    );
    backfill(
      "city",
      onboarding.city ||
        snapshots.operationalAddressSnapshot.city ||
        onboarding.businessCity
    );
    backfill(
      "district",
      onboarding.district ||
        snapshots.operationalAddressSnapshot.district ||
        onboarding.businessSubdistrict
    );
    backfill(
      "province",
      onboarding.province ||
        snapshots.operationalAddressSnapshot.province ||
        onboarding.businessProvince
    );
    backfill(
      "postalCode",
      onboarding.postalCode ||
        snapshots.operationalAddressSnapshot.postalCode ||
        onboarding.businessPostalCode
    );
    backfill(
      "country",
      onboarding.country ||
        snapshots.operationalAddressSnapshot.country ||
        onboarding.businessCountry ||
        "Indonesia"
    );

    // Sync businessDetails
    const nextBusinessDetails: Record<string, any> = { ...currentBusinessDetails };
    let businessDetailsChanged = false;
    const setBusinessDetail = (k: string, v: any) => {
      const norm = String(v ?? "").trim();
      if (
        (nextBusinessDetails[k] === null ||
          nextBusinessDetails[k] === undefined ||
          String(nextBusinessDetails[k]).trim() === "") &&
        norm
      ) {
        nextBusinessDetails[k] = norm;
        businessDetailsChanged = true;
      }
    };

    setBusinessDetail(
      "category",
      snapshots.storeInformationSnapshot.storeCategory || onboarding.category
    );
    setBusinessDetail(
      "businessType",
      snapshots.storeInformationSnapshot.sellerType || onboarding.businessType
    );
    setBusinessDetail(
      "legalEntity",
      onboarding.legalEntity || snapshots.operationalAddressSnapshot.notes
    );
    setBusinessDetail(
      "businessAddress",
      onboarding.businessAddress || snapshots.operationalAddressSnapshot.addressLine1
    );
    setBusinessDetail(
      "businessProvince",
      onboarding.businessProvince || snapshots.operationalAddressSnapshot.province
    );
    setBusinessDetail(
      "businessCity",
      onboarding.businessCity || snapshots.operationalAddressSnapshot.city
    );
    setBusinessDetail(
      "businessSubdistrict",
      onboarding.businessSubdistrict || snapshots.operationalAddressSnapshot.district
    );
    setBusinessDetail(
      "businessPostalCode",
      onboarding.businessPostalCode || snapshots.operationalAddressSnapshot.postalCode
    );
    setBusinessDetail(
      "businessCountry",
      onboarding.businessCountry || snapshots.operationalAddressSnapshot.country || "Indonesia"
    );
    if (businessDetailsChanged) {
      patch.businessDetails = nextBusinessDetails;
    }

    // Sync ownerIdentity
    const nextOwnerIdentity: Record<string, any> = { ...currentOwnerIdentity };
    let ownerIdentityChanged = false;
    const setOwnerId = (k: string, v: any) => {
      const norm = String(v ?? "").trim();
      if (
        (nextOwnerIdentity[k] === null ||
          nextOwnerIdentity[k] === undefined ||
          String(nextOwnerIdentity[k]).trim() === "") &&
        norm
      ) {
        nextOwnerIdentity[k] = norm;
        ownerIdentityChanged = true;
      }
    };

    setOwnerId("fullName", snapshots.ownerIdentitySnapshot.fullName || onboarding.ownerName);
    setOwnerId("email", snapshots.ownerIdentitySnapshot.email || onboarding.ownerEmail);
    setOwnerId("phoneNumber", snapshots.ownerIdentitySnapshot.phoneNumber || onboarding.ownerPhone);
    setOwnerId("birthDate", snapshots.ownerIdentitySnapshot.birthDate || onboarding.birthDate);
    setOwnerId("identityType", snapshots.ownerIdentitySnapshot.identityType || onboarding.identityType || "KTP");
    setOwnerId("identityNumber", snapshots.complianceSnapshot.identityNumber || onboarding.identityNumber);
    setOwnerId("taxNumber", snapshots.complianceSnapshot.taxId || onboarding.taxNumber);
    setOwnerId("residentialAddress", onboarding.residentialAddress);
    setOwnerId("country", onboarding.ownerCountry || "Indonesia");
    setOwnerId("province", onboarding.ownerProvince);
    setOwnerId("city", onboarding.ownerCity);
    setOwnerId("subdistrict", onboarding.ownerSubdistrict);
    setOwnerId("postalCode", onboarding.ownerPostalCode);
    if (ownerIdentityChanged) {
      patch.ownerIdentity = nextOwnerIdentity;
    }

    // Sync shippingSetup
    const nextShippingSetup: Record<string, any> = { ...currentShippingSetup };
    let shippingChanged = false;
    const setShipping = (k: string, v: any) => {
      const norm = String(v ?? "").trim();
      if (
        (nextShippingSetup[k] === null ||
          nextShippingSetup[k] === undefined ||
          String(nextShippingSetup[k]).trim() === "") &&
        norm
      ) {
        nextShippingSetup[k] = norm;
        shippingChanged = true;
      }
    };

    setShipping(
      "originContactName",
      snapshots.operationalAddressSnapshot.contactName ||
        snapshots.ownerIdentitySnapshot.fullName ||
        onboarding.ownerName
    );
    setShipping(
      "originPhone",
      snapshots.operationalAddressSnapshot.phoneNumber ||
        onboarding.phone ||
        snapshots.ownerIdentitySnapshot.phoneNumber ||
        onboarding.ownerPhone
    );
    setShipping(
      "originAddressLine1",
      onboarding.addressLine1 ||
        snapshots.operationalAddressSnapshot.addressLine1 ||
        onboarding.businessAddress
    );
    setShipping(
      "originDistrict",
      snapshots.operationalAddressSnapshot.district ||
        onboarding.district ||
        onboarding.businessSubdistrict
    );
    setShipping(
      "originCity",
      snapshots.operationalAddressSnapshot.city ||
        onboarding.city ||
        onboarding.businessCity
    );
    setShipping(
      "originProvince",
      snapshots.operationalAddressSnapshot.province ||
        onboarding.province ||
        onboarding.businessProvince
    );
    setShipping(
      "originPostalCode",
      snapshots.operationalAddressSnapshot.postalCode ||
        onboarding.postalCode ||
        onboarding.businessPostalCode
    );
    setShipping(
      "originCountry",
      snapshots.operationalAddressSnapshot.country || onboarding.country || "Indonesia"
    );
    if (shippingChanged) {
      patch.shippingSetup = nextShippingSetup;
    }

    if (Object.keys(patch).length > 0) {
      await store.update(patch as any);
      await store.reload();
    }
  } catch (err) {
    console.warn("[seller/store-profile:syncStoreFromStoreApplication] sync warning", err);
  }
  return store;
};

const getSellerStoreProfileResponse = async (req: any, res: any) => {
  try {
    const storeId = Number(req.params.storeId);
    const sellerAccess = req.sellerAccess;
    const store = await Store.findByPk(storeId, {
      attributes: [...STORE_PROFILE_ATTRIBUTES],
      include: [
        {
          association: "paymentProfile",
          attributes: [...STORE_PAYMENT_PROFILE_BASE_ATTRIBUTES],
          required: false,
        },
        {
          association: "activePaymentProfile",
          attributes: [...STORE_PAYMENT_PROFILE_BASE_ATTRIBUTES],
          required: false,
        },
      ],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    await syncStoreFromStoreApplication(store, req);
    await deactivateStoreIfSellerRequirementsMissing(store);

    return res.json({
      success: true,
      data: serializeSellerStoreProfilePayload(store, sellerAccess),
    });
  } catch (error) {
    console.error("[seller/store-profile:get] error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load seller store profile.",
    });
  }
};

const patchSellerStoreProfileResponse = async (req: any, res: any) => {
  try {
    const storeId = Number(req.params.storeId);
    const sellerAccess = req.sellerAccess;
    const requestBody =
      req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const forbiddenFields = Object.keys(requestBody).filter((field) =>
      (READ_ONLY_STORE_PROFILE_FIELDS as readonly string[]).includes(field)
    );

    if (forbiddenFields.length > 0) {
      return res.status(403).json({
        success: false,
        code: "READ_ONLY_STORE_PROFILE_FIELDS",
        message: "One or more read-only store fields cannot be updated from seller workspace.",
        fields: forbiddenFields,
      });
    }

    const parsed = sellerStoreProfilePatchSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        code: "INVALID_STORE_PROFILE_PAYLOAD",
        message: "Invalid payload.",
        errors: parsed.error.flatten(),
      });
    }

    const store = await Store.findByPk(storeId, {
      attributes: [...STORE_PROFILE_ATTRIBUTES],
      include: [
        {
          association: "paymentProfile",
          attributes: [...STORE_PAYMENT_PROFILE_BASE_ATTRIBUTES],
          required: false,
        },
        {
          association: "activePaymentProfile",
          attributes: [...STORE_PAYMENT_PROFILE_BASE_ATTRIBUTES],
          required: false,
        },
      ],
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const updatePayload = Object.fromEntries(
      Object.entries(parsed.data).filter(
        ([key, value]) =>
          value !== undefined &&
          (SELLER_EDITABLE_STORE_PROFILE_FIELDS as readonly string[]).includes(key)
      )
    );

    if (parsed.data.shippingSetup !== undefined) {
      updatePayload.shippingSetup = mergeSellerShippingSetupPatch(
        getStoreProfileAttr(store, "shippingSetup"),
        parsed.data.shippingSetup
      );
    }

    if (parsed.data.ownerIdentity !== undefined) {
      updatePayload.ownerIdentity = mergeStoredProfileObjectPatch(
        getStoreProfileAttr(store, "ownerIdentity"),
        parsed.data.ownerIdentity
      );
    }

    if (parsed.data.businessDetails !== undefined) {
      updatePayload.businessDetails = mergeStoredProfileObjectPatch(
        getStoreProfileAttr(store, "businessDetails"),
        parsed.data.businessDetails
      );
    }

    if (Object.keys(updatePayload).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No allowed store profile fields were provided.",
      });
    }

    await store.update(updatePayload as any);
    await deactivateStoreIfSellerRequirementsMissing(store);

    return res.json({
      success: true,
      data: serializeSellerStoreProfilePayload(store, sellerAccess),
    });
  } catch (error) {
    console.error("[seller/store-profile:patch] error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update seller store profile.",
    });
  }
};

router.get(
  "/stores/:storeId/profile",
  requireSellerStoreAccess(["STORE_VIEW"]),
  getSellerStoreProfileResponse
);

router.get(
  "/stores/:storeId/store-profile",
  requireSellerStoreAccess(["STORE_VIEW"]),
  getSellerStoreProfileResponse
);

router.patch(
  "/stores/:storeId/profile",
  requireSellerStoreAccess(["STORE_EDIT"]),
  patchSellerStoreProfileResponse
);

router.patch(
  "/stores/:storeId/store-profile",
  requireSellerStoreAccess(["STORE_EDIT"]),
  patchSellerStoreProfileResponse
);

export default router;
