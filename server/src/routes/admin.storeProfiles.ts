import { Router } from "express";
import { Store, StoreApplication, User } from "../models/index.js";
import {
  ADMIN_OWNED_STORE_PROFILE_FIELDS,
  STORE_PROFILE_ATTRIBUTES,
  adminStoreProfilePatchSchema,
  getStoreProfileAttr,
  mergeStoredProfileObjectPatch,
  serializeStoreProfileSnapshot,
} from "../services/sharedContracts/storeProfileGovernance.js";
import { serializePublicStoreIdentityPayload } from "../services/sharedContracts/publicStoreIdentity.js";
import { STORE_PAYMENT_PROFILE_BASE_ATTRIBUTES } from "../services/sharedContracts/storePaymentProfileCompat.js";
import { mergeSellerShippingSetupPatch } from "../services/sellerShippingSetup.service.js";

const router = Router();

const ownerAttributes = ["id", "name", "email", "role"] as const;

const serializeAdminStoreProfileEntry = async (store: any) => ({
  store: serializeStoreProfileSnapshot(store, {
    actor: "admin",
    canEdit: true,
  }),
  publicIdentity: await serializePublicStoreIdentityPayload(store),
  owner: store?.owner
    ? {
        id: Number(store.owner.id),
        name: String(store.owner.name || ""),
        email: String(store.owner.email || ""),
        role: String(store.owner.role || ""),
      }
    : null,
});

router.get("/store/profiles", async (_req, res) => {
  try {
    const stores = await Store.findAll({
      attributes: [...STORE_PROFILE_ATTRIBUTES],
      include: [
        { model: User, as: "owner", attributes: [...ownerAttributes], required: false },
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
      order: [
        ["updatedAt", "DESC"],
        ["id", "DESC"],
      ],
    });

    const items = await Promise.all(stores.map((store) => serializeAdminStoreProfileEntry(store)));

    return res.json({
      success: true,
      data: items,
      governance: {
        adminOwnedFields: [...ADMIN_OWNED_STORE_PROFILE_FIELDS],
      },
    });
  } catch (error) {
    console.error("[admin/store-profiles:list] error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin store profiles.",
    });
  }
});

router.patch("/store/profiles/:storeId", async (req, res) => {
  try {
    const storeId = Number(req.params.storeId);
    if (!Number.isFinite(storeId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid store id.",
      });
    }

    const parsed = adminStoreProfilePatchSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        code: "INVALID_ADMIN_STORE_PROFILE_PAYLOAD",
        message: "Invalid payload.",
        errors: parsed.error.flatten(),
      });
    }

    const rawData = parsed.data as Record<string, any>;
    const updatePayload: Record<string, any> = {};
    for (const [key, value] of Object.entries(rawData)) {
      if (
        value !== undefined &&
        key !== "shippingSetup" &&
        key !== "ownerIdentity" &&
        key !== "businessDetails"
      ) {
        updatePayload[key] = value;
      }
    }

    if (
      Object.keys(updatePayload).length === 0 &&
      rawData.shippingSetup === undefined &&
      rawData.ownerIdentity === undefined &&
      rawData.businessDetails === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "No admin-owned store profile fields were provided.",
      });
    }

    const store = await Store.findByPk(storeId, {
      attributes: [...STORE_PROFILE_ATTRIBUTES],
      include: [
        { model: User, as: "owner", attributes: [...ownerAttributes], required: false },
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

    if (rawData.shippingSetup !== undefined) {
      updatePayload.shippingSetup = mergeSellerShippingSetupPatch(
        getStoreProfileAttr(store, "shippingSetup"),
        rawData.shippingSetup
      );
    }

    if (rawData.ownerIdentity !== undefined) {
      updatePayload.ownerIdentity = mergeStoredProfileObjectPatch(
        getStoreProfileAttr(store, "ownerIdentity"),
        rawData.ownerIdentity
      );
    }

    if (rawData.businessDetails !== undefined) {
      updatePayload.businessDetails = mergeStoredProfileObjectPatch(
        getStoreProfileAttr(store, "businessDetails"),
        rawData.businessDetails
      );
    }

    await store.update(updatePayload as any);

    if (updatePayload.status !== undefined) {
      const ownerUserId = Number(getStoreProfileAttr(store, "ownerUserId") || 0);
      if (ownerUserId > 0) {
        const linkedApp = await StoreApplication.findOne({
          where: { applicantUserId: ownerUserId } as any,
          order: [["updatedAt", "DESC"], ["id", "DESC"]],
        });
        if (linkedApp) {
          const meta = (linkedApp as any).internalMetadata || {};
          if (meta.activation) {
            meta.activation.storeStatus = updatePayload.status;
            await linkedApp.update({ internalMetadata: meta } as any);
          }
        }
      }
    }

    return res.json({
      success: true,
      data: await serializeAdminStoreProfileEntry(store),
    });
  } catch (error: any) {
    if (error?.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        code: "STORE_PROFILE_SLUG_CONFLICT",
        message: "Store slug is already in use.",
      });
    }
    console.error("[admin/store-profiles:patch] error", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update admin store profile.",
    });
  }
});

export default router;
