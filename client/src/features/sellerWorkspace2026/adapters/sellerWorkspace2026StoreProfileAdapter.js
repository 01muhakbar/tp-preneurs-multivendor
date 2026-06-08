import { getSellerStoreProfile, updateSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { getSellerWorkspaceContextBySlug } from "../../../api/sellerWorkspace.ts";
import { getStoreProfileFallback } from "../utils/sellerWorkspace2026Fallbacks.js";

// Exported for traceability
export const resolveStoreContext = async (storeSlug) => {
  return await getSellerWorkspaceContextBySlug(storeSlug);
};

export const fetchStoreProfile = async (storeId) => {
  return await getSellerStoreProfile(storeId);
};

export const mapStoreProfileResponseToViewModel = (profile) => {
  if (!profile) return null;
  return {
    store: profile, // Contains name, slug, email, etc.
    readiness: {
      checklist: [] // Can be mapped if needed from profile.completeness.missingFields
    },
    microsite: {}, // Fallbacks used by Seller2026Workspace
    theme: {}, // Fallbacks used by Seller2026Workspace
  };
};

export const mapStoreProfileFormToPayload = (formPayload) => {
  // `formPayload` is already built by `buildStoreProfileUpdatePayload` in Seller2026Workspace.jsx
  // We just ensure no sensitive fields are passed if they somehow sneaked in.
  const payload = { ...formPayload };
  
  // Explicitly strip sensitive fields
  delete payload.slug;
  delete payload.domain;
  delete payload.status;
  delete payload.verificationStatus;
  delete payload.published;
  delete payload.isPublic;
  delete payload.isActive;
  delete payload.ownerId;
  delete payload.name; // Cannot update name via this endpoint usually

  return payload;
};

export const fetchSellerWorkspace2026StoreProfile = async (storeSlug) => {
  const context = await resolveStoreContext(storeSlug);
  const storeId = context?.store?.id;
  if (!storeId) {
    return getStoreProfileFallback();
  }

  const profile = await fetchStoreProfile(storeId);
  if (!profile) {
    return getStoreProfileFallback();
  }

  return mapStoreProfileResponseToViewModel(profile);
};

export const saveSellerWorkspace2026StoreProfile = async ({ storeSlug, form }) => {
  const context = await resolveStoreContext(storeSlug);
  const storeId = context?.store?.id;
  if (!storeId) {
    throw new Error("Unable to resolve store ID for update.");
  }
  const payload = mapStoreProfileFormToPayload(form);
  const updatedProfile = await updateSellerStoreProfile(storeId, payload);
  return mapStoreProfileResponseToViewModel(updatedProfile);
};
