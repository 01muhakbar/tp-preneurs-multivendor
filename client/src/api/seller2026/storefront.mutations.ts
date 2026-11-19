import { updateSellerStoreProfile } from "../sellerStoreProfile.ts";

export type Seller2026OwnerIdentityPayload = {
  fullName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  identityType?: string | null;
  identityNumber?: string | null;
  taxNumber?: string | null;
  residentialAddress?: string | null;
  country?: string | null;
  province?: string | null;
  city?: string | null;
  subdistrict?: string | null;
  postalCode?: string | null;
};

export type Seller2026BusinessDetailsPayload = {
  category?: string | null;
  businessType?: string | null;
  legalEntity?: string | null;
  pickupSameAsBusiness?: boolean;
  pickupAddress?: string | null;
  businessAddress?: string | null;
  businessProvince?: string | null;
  businessCity?: string | null;
  businessSubdistrict?: string | null;
  businessPostalCode?: string | null;
  businessCountry?: string | null;
  timeZone?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  workingDays?: string | null;
  shippingMethod?: string | null;
  processingTime?: string | null;
};

export type Seller2026StoreProfileUpdatePayload = {
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  phone?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  country?: string | null;
  shippingSetup?: {
    shippingEnabled?: boolean;
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
    originLatitude?: number | null;
    originLongitude?: number | null;
    enabledCouriers?: string[];
    enabledCategories?: string[];
  };
  ownerIdentity?: Seller2026OwnerIdentityPayload;
  businessDetails?: Seller2026BusinessDetailsPayload;
};

const allowedTopLevelFields = new Set([
  "description",
  "logoUrl",
  "bannerUrl",
  "email",
  "whatsapp",
  "phone",
  "websiteUrl",
  "instagramUrl",
  "tiktokUrl",
  "addressLine1",
  "addressLine2",
  "district",
  "city",
  "province",
  "postalCode",
  "country",
  "shippingSetup",
  "ownerIdentity",
  "businessDetails",
]);

const allowedShippingFields = new Set([
  "shippingEnabled",
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
  "originLatitude",
  "originLongitude",
  "enabledCouriers",
  "enabledCategories",
]);

const allowedOwnerIdentityFields = new Set([
  "fullName",
  "email",
  "phoneNumber",
  "birthDate",
  "identityType",
  "identityNumber",
  "taxNumber",
  "residentialAddress",
  "country",
  "province",
  "city",
  "subdistrict",
  "postalCode",
]);

const allowedBusinessDetailsFields = new Set([
  "category",
  "businessType",
  "legalEntity",
  "pickupSameAsBusiness",
  "pickupAddress",
  "businessAddress",
  "businessProvince",
  "businessCity",
  "businessSubdistrict",
  "businessPostalCode",
  "businessCountry",
  "timeZone",
  "openTime",
  "closeTime",
  "workingDays",
  "shippingMethod",
  "processingTime",
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

  const ownerIdentity =
    payload.ownerIdentity && typeof payload.ownerIdentity === "object"
      ? compactRecord(payload.ownerIdentity as Record<string, unknown>, allowedOwnerIdentityFields)
      : undefined;

  const businessDetails =
    payload.businessDetails && typeof payload.businessDetails === "object"
      ? compactRecord(payload.businessDetails as Record<string, unknown>, allowedBusinessDetailsFields)
      : undefined;

  const safePayload = compactRecord(
    {
      ...payload,
      shippingSetup: shippingSetup && Object.keys(shippingSetup).length ? shippingSetup : undefined,
      ownerIdentity: ownerIdentity && Object.keys(ownerIdentity).length ? ownerIdentity : undefined,
      businessDetails: businessDetails && Object.keys(businessDetails).length ? businessDetails : undefined,
    },
    allowedTopLevelFields
  );

  return updateSellerStoreProfile(storeId, safePayload);
}
