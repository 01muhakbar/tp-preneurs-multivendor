import { updateSellerStoreProfile } from "../sellerStoreProfile.ts";

export type Seller2026StoreProfileUpdatePayload = {
  description?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  shippingSetup?: {
    originContactName?: string | null;
    originPhone?: string | null;
    originAddressLine1?: string | null;
    originAddressLine2?: string | null;
    originDistrict?: string | null;
    originCity?: string | null;
    originProvince?: string | null;
    originPostalCode?: string | null;
    originCountry?: string | null;
    pickupNotes?: string | null;
  };
};

const allowedTopLevelFields = new Set([
  "description",
  "email",
  "whatsapp",
  "phone",
  "websiteUrl",
  "instagramUrl",
  "tiktokUrl",
  "addressLine1",
  "addressLine2",
  "city",
  "province",
  "postalCode",
  "country",
  "shippingSetup",
]);

const allowedShippingFields = new Set([
  "originContactName",
  "originPhone",
  "originAddressLine1",
  "originAddressLine2",
  "originDistrict",
  "originCity",
  "originProvince",
  "originPostalCode",
  "originCountry",
  "pickupNotes",
]);

const compactRecord = (value: Record<string, unknown>, allowed: Set<string>) =>
  Object.fromEntries(
    Object.entries(value).filter(([key, entryValue]) => allowed.has(key) && entryValue !== undefined)
  );

export async function updateSeller2026StoreProfile({
  storeId,
  payload,
}: {
  storeId: string | number;
  payload: Seller2026StoreProfileUpdatePayload;
}) {
  const shippingSetup =
    payload.shippingSetup && typeof payload.shippingSetup === "object"
      ? compactRecord(payload.shippingSetup as Record<string, unknown>, allowedShippingFields)
      : undefined;
  const safePayload = compactRecord(
    {
      ...payload,
      shippingSetup: shippingSetup && Object.keys(shippingSetup).length ? shippingSetup : undefined,
    },
    allowedTopLevelFields
  );

  return updateSellerStoreProfile(storeId, safePayload);
}
