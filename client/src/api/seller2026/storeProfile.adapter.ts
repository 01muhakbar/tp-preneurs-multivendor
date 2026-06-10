const asText = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;
const asObject = (value: unknown): Record<string, any> =>
  value && typeof value === "object" ? (value as Record<string, any>) : {};

const FRIENDLY_FIELD_LABELS: Record<string, string> = {
  addressLine1: "Address",
  addressLine2: "Address line 2",
  bannerUrl: "Banner image",
  city: "City",
  country: "Country",
  description: "Description",
  email: "Store email",
  instagramUrl: "Instagram",
  logoUrl: "Logo image",
  phone: "Phone",
  postalCode: "Postal code",
  province: "Province",
  tiktokUrl: "TikTok",
  websiteUrl: "Website",
  whatsapp: "WhatsApp",
};

const statusTone = (value: unknown) => {
  const normalized = asText(value).toLowerCase();
  if (["ready", "active", "complete", "unlocked"].some((key) => normalized.includes(key))) {
    return "success";
  }
  if (["missing", "need", "incomplete", "disabled"].some((key) => normalized.includes(key))) {
    return "warning";
  }
  return "info";
};

const formatAddress = (...values: unknown[]) =>
  values.map((value) => asText(value)).filter(Boolean).join(", ");

const findChecklistItem = (items: any[], terms: string[]) =>
  items.find((item) => {
    const haystack = `${asText(item?.key)} ${asText(item?.label)}`.toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });

export function createSeller2026StoreProfileForm(profile: any) {
  const shipping = asObject(profile?.shippingSetup);
  return {
    description: asText(profile?.description),
    logoUrl: asText(profile?.logoUrl),
    bannerUrl: asText(profile?.bannerUrl),
    email: asText(profile?.email),
    phone: asText(profile?.phone),
    whatsapp: asText(profile?.whatsapp),
    websiteUrl: asText(profile?.websiteUrl),
    instagramUrl: asText(profile?.instagramUrl),
    tiktokUrl: asText(profile?.tiktokUrl),
    addressLine1: asText(profile?.addressLine1),
    addressLine2: asText(profile?.addressLine2),
    city: asText(profile?.city),
    province: asText(profile?.province),
    postalCode: asText(profile?.postalCode),
    country: asText(profile?.country, "Indonesia"),
    shippingEnabled: shipping.shippingEnabled !== false,
    originContactName: asText(shipping.originContactName),
    originPhone: asText(shipping.originPhone),
    originAddressLine1: asText(shipping.originAddressLine1),
    originAddressLine2: asText(shipping.originAddressLine2),
    originDistrict: asText(shipping.originDistrict),
    originCity: asText(shipping.originCity),
    originProvince: asText(shipping.originProvince),
    originPostalCode: asText(shipping.originPostalCode),
    originCountry: asText(shipping.originCountry, "Indonesia"),
    pickupNotes: asText(shipping.pickupNotes),
  };
}

export function adaptSeller2026StoreProfile({
  sellerContext,
  profile,
  readiness,
  publicIdentity,
}: {
  sellerContext?: unknown;
  profile?: unknown;
  readiness?: unknown;
  publicIdentity?: unknown;
}) {
  if (!profile) return null;

  const source = asObject(profile);
  const context = asObject(sellerContext);
  const access = asObject(context.access);
  const readinessSource = asObject(readiness);
  const checklist = Array.isArray(readinessSource.checklist) ? readinessSource.checklist : [];
  const profileItem = findChecklistItem(checklist, ["profile", "identity"]);
  const paymentItem = findChecklistItem(checklist, ["payment"]);
  const shippingItem = findChecklistItem(checklist, ["shipping", "origin"]);
  const missingFields = Array.isArray(source.completeness?.missingFields)
    ? source.completeness.missingFields.map((field: any) => ({
        key: asText(field?.key),
        label:
          FRIENDLY_FIELD_LABELS[asText(field?.key)] ||
          asText(field?.label, "Missing information"),
      }))
    : [];
  const score = Math.max(0, Math.min(100, Number(source.completeness?.score || 0)));
  const shippingReady = Boolean(source.isShippingReady || shippingItem?.isComplete);
  const paymentReady = Boolean(paymentItem?.isComplete || source.operationalReadiness?.isReady);
  const storeStatus = asText(source.statusMeta?.label || source.status, "Active");
  const publicReady = missingFields.length === 0;
  const storefrontUnlocked = Boolean(publicIdentity) || asText(source.status).toUpperCase() === "ACTIVE";

  return {
    id: Number(source.id || context.store?.id || 0) || null,
    name: asText(source.name || context.store?.name, "Store"),
    slug: asText(source.slug || context.store?.slug),
    status: storeStatus,
    statusTone: statusTone(storeStatus),
    description: asText(source.description, "Add a concise description to introduce your store."),
    logoUrl: asText(source.logoUrl || context.store?.logoUrl || context.store?.imageUrl),
    bannerUrl: asText(source.bannerUrl),
    publicUrl: source.slug ? `/store/${encodeURIComponent(source.slug)}` : null,
    websiteUrl: asText(source.websiteUrl),
    readiness: {
      percent: score,
      label: source.completeness?.isComplete ? "Ready" : "Ready",
      missingCount: missingFields.length,
      missingFields,
      tiles: [
        {
          key: "public",
          label: "Public Profile",
          status: publicReady ? "Ready" : "Needs info",
          note: publicReady ? "Public information complete" : `${missingFields.length} items missing`,
          tone: publicReady ? "success" : "warning",
        },
        {
          key: "payment",
          label: "Payment Setup",
          status: paymentReady ? "Ready" : "Needs review",
          note: paymentReady ? "Ready for checkout" : asText(paymentItem?.status?.label, "Setup incomplete"),
          tone: paymentReady ? "success" : "warning",
        },
        {
          key: "shipping",
          label: "Shipping Origin",
          status: shippingReady ? "Ready" : "Needs info",
          note: shippingReady ? "Pickup origin ready" : asText(source.shippingSetupStatus?.label, "Setup incomplete"),
          tone: shippingReady ? "success" : "warning",
        },
        {
          key: "visibility",
          label: "Storefront Visibility",
          status: storefrontUnlocked ? "Unlocked" : "Locked",
          note: storefrontUnlocked ? "Visible to buyers" : "Activation required",
          tone: storefrontUnlocked ? "success" : "warning",
        },
      ],
      source: asText(profileItem?.status?.label, source.completeness?.label),
    },
    contact: {
      email: asText(source.email),
      phone: asText(source.phone),
      whatsapp: asText(source.whatsapp),
    },
    address: {
      line1: asText(source.addressLine1),
      line2: asText(source.addressLine2),
      city: asText(source.city),
      province: asText(source.province),
      postalCode: asText(source.postalCode),
      country: asText(source.country),
      formatted: formatAddress(
        source.addressLine1,
        source.addressLine2,
        source.city,
        source.province,
        source.postalCode,
        source.country
      ),
    },
    shipping: {
      ...asObject(source.shippingSetup),
      ready: shippingReady,
      status: asText(source.shippingSetupStatus?.label, shippingReady ? "Ready" : "Needs info"),
      address: asText(source.shippingSetupSummary?.originAddressLine),
    },
    governance: {
      canEdit: Boolean(source.governance?.canEdit),
      managedBy: asText(source.governance?.managedBy, "ADMIN"),
      editableFields: Array.isArray(source.governance?.editableFields)
        ? source.governance.editableFields.map(String)
        : [],
      role: asText(access.roleCode, "STORE_OWNER"),
    },
    form: createSeller2026StoreProfileForm(source),
  };
}
