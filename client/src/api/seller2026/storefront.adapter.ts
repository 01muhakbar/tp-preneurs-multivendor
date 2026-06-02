export type Seller2026StorefrontViewModel = {
  store: {
    id: string | number | null;
    slug: string;
    name: string;
    logoUrl: string | null;
    coverUrl: string | null;
    tagline: string;
    email: string;
    whatsapp: string;
    phone: string;
    businessCategory: string;
    businessSubcategory: string;
    address: string;
    operatingHours: Array<{ day: string; hours: string }>;
    shippingOrigin: string;
    socials: Array<{ channel: string; value: string; url?: string }>;
    description: string;
    policies: Array<{ label: string; status: "complete" | "missing" }>;
    saveStatus: string;
    editableProfile: {
      name: string;
      slug: string;
      description: string;
      email: string;
      whatsapp: string;
      phone: string;
      websiteUrl: string;
      instagramUrl: string;
      tiktokUrl: string;
      addressLine1: string;
      addressLine2: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
      shippingOriginContactName: string;
      shippingOriginPhone: string;
      shippingOriginAddressLine1: string;
      shippingOriginAddressLine2: string;
      shippingOriginDistrict: string;
      shippingOriginCity: string;
      shippingOriginProvince: string;
      shippingOriginPostalCode: string;
      shippingOriginCountry: string;
      shippingPickupNotes: string;
    };
  };
  readiness: {
    percent: number;
    completed: number;
    missing: number;
    notStarted: number;
    verifications: Array<{
      label: string;
      status: "verified" | "pending" | "optional" | "missing";
    }>;
    checklist: Array<{
      label: string;
      status: "complete" | "missing" | "not_started";
      actionLabel?: string;
      actionTo?: string;
    }>;
    canSubmitForReview: boolean;
  };
  microsite: {
    heroTitle: string;
    heroSubtitle: string;
    heroCtaLabel: string;
    categories: Array<{ id: string | number; name: string }>;
    featuredProducts: Array<{
      id: string | number;
      name: string;
      imageUrl: string | null;
      price: number;
      rating?: number;
      badge?: string;
    }>;
    benefits: Array<{ label: string; description: string }>;
  };
  theme: {
    mode: "light" | "dark";
    brandColors: string[];
    typography: string;
    sections: Array<{ key: string; label: string; enabled: boolean }>;
  };
};

const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const nullableText = (value: unknown) => {
  const normalized = text(value);
  return normalized || null;
};
const primitiveId = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? value : null;
const statusText = (value: unknown) => text(value).toLowerCase();

const joinAddress = (...parts: unknown[]) =>
  parts
    .map((part) => text(part))
    .filter(Boolean)
    .join(", ");

const normalizeChecklistStatus = (value: unknown): "complete" | "missing" | "not_started" => {
  const normalized = statusText(value);
  if (["complete", "completed", "done", "ready", "verified", "active", "selesai"].includes(normalized)) {
    return "complete";
  }
  if (["missing", "incomplete", "blocked", "required", "belum"].includes(normalized)) {
    return "missing";
  }
  return "not_started";
};

const normalizeVerificationStatus = (
  value: unknown
): "verified" | "pending" | "optional" | "missing" => {
  const normalized = statusText(value);
  if (["verified", "ready", "active", "complete", "completed"].includes(normalized)) {
    return "verified";
  }
  if (["optional", "info", "informational"].includes(normalized)) return "optional";
  if (["missing", "incomplete", "blocked", "required"].includes(normalized)) return "missing";
  return "pending";
};

const mapReadinessChecklist = (readiness: Record<string, unknown>) => {
  const checklist = Array.isArray(readiness.checklist) ? readiness.checklist : [];
  return checklist.map((entry) => {
    const item = object(entry);
    const status = object(item.status);
    const cta = object(item.cta);
    return {
      label: text(item.label, "Readiness item"),
      status: normalizeChecklistStatus(status.code || status.label || item.status),
      actionLabel: text(cta.label),
      actionTo: text(cta.lane),
    };
  });
};

const mapSocials = (profile: Record<string, unknown>) =>
  [
    { channel: "Website", value: text(profile.websiteUrl), url: text(profile.websiteUrl) },
    { channel: "Instagram", value: text(profile.instagramUrl), url: text(profile.instagramUrl) },
    { channel: "TikTok", value: text(profile.tiktokUrl), url: text(profile.tiktokUrl) },
  ].filter((item) => item.value);

const mapPolicies = (profile: Record<string, unknown>) => [
  {
    label: "Store description",
    status: text(profile.description) ? ("complete" as const) : ("missing" as const),
  },
  {
    label: "Contact details",
    status:
      text(profile.email || profile.phone || profile.whatsapp)
        ? ("complete" as const)
        : ("missing" as const),
  },
  {
    label: "Shipping origin",
    status:
      object(profile.shippingSetup).originCity || object(profile.shippingSetup).originProvince
        ? ("complete" as const)
        : ("missing" as const),
  },
];

export function adaptSellerStorefrontProfile(value: unknown) {
  const source = object(value);
  const publicProfile = object(source.publicProfile || source);
  return {
    id: publicProfile.id ?? source.id ?? null,
    name: text(publicProfile.name || source.name, "Store"),
    slug: text(publicProfile.slug || source.slug),
    logoUrl: publicProfile.logoUrl || publicProfile.logo || null,
    coverUrl: publicProfile.coverUrl || publicProfile.coverImage || null,
    contact: {
      email: text(publicProfile.email || source.email),
      phone: text(publicProfile.phone || source.phone),
      whatsapp: text(publicProfile.whatsapp || source.whatsapp),
    },
    category: text(publicProfile.businessCategory || source.businessCategory),
    address: text(publicProfile.address || source.address),
    shippingOrigin: text(publicProfile.shippingOrigin || source.shippingOrigin),
    hours: text(publicProfile.operatingHours || source.operatingHours),
    socialLinks: Array.isArray(publicProfile.socialLinks) ? publicProfile.socialLinks : [],
    about: text(publicProfile.about || source.about),
    policySnippet: text(publicProfile.policySnippet || source.policySnippet),
    theme: publicProfile.theme || source.theme || null,
  };
}

export function adaptSeller2026Storefront({
  sellerContext,
  profile,
  readiness,
  publicIdentity,
  richAbout,
}: {
  sellerContext?: unknown;
  profile?: unknown;
  readiness?: unknown;
  publicIdentity?: unknown;
  richAbout?: unknown;
}): Seller2026StorefrontViewModel {
  const context = object(sellerContext);
  const contextStore = object(context.store);
  const source = object(profile);
  const readinessSource = object(readiness);
  const readinessSummary = object(readinessSource.summary);
  const identityData = object(object(publicIdentity).data);
  const publicStore = object(identityData.store || identityData.identity);
  const richAboutData = object(object(richAbout).data);
  const shippingSetup = object(source.shippingSetup);
  const shippingSummary = object(source.shippingSetupSummary);
  const storeName = text(source.name || contextStore.name || publicStore.name, "Toko Kamu");
  const slug = text(source.slug || contextStore.slug || publicStore.slug);
  const description = text(
    richAboutData.content || source.description || publicStore.description,
    "Bangun brand dan jangkau lebih banyak pelanggan."
  );
  const address = joinAddress(
    source.addressLine1,
    source.addressLine2,
    source.city,
    source.province,
    source.postalCode,
    source.country
  );
  const shippingOrigin = joinAddress(
    shippingSetup.originAddressLine1 || shippingSummary.originAddressLine,
    shippingSetup.originDistrict,
    shippingSetup.originCity || source.city,
    shippingSetup.originProvince || source.province,
    shippingSetup.originPostalCode,
    shippingSetup.originCountry || source.country
  );
  const checklist = mapReadinessChecklist(readinessSource);
  const completed = number(readinessSummary.completedItems, checklist.filter((item) => item.status === "complete").length);
  const total = number(readinessSummary.totalItems, checklist.length);
  const missing = checklist.filter((item) => item.status === "missing").length;
  const percent = number(
    readinessSummary.completionPercent,
    total > 0 ? Math.round((completed / total) * 100) : number(object(source.completeness).score, 0)
  );

  return {
    store: {
      id: primitiveId(source.id) || primitiveId(contextStore.id),
      slug,
      name: storeName,
      logoUrl: nullableText(source.logoUrl || publicStore.logoUrl),
      coverUrl: nullableText(source.bannerUrl || publicStore.bannerUrl || publicStore.coverUrl),
      tagline: text(publicStore.tagline, "Bangun brand dan jangkau lebih banyak pelanggan."),
      email: text(source.email),
      whatsapp: text(source.whatsapp),
      phone: text(source.phone),
      businessCategory: text(publicStore.businessCategory, "Storefront"),
      businessSubcategory: text(publicStore.businessSubcategory, "General"),
      address: address || "Alamat toko belum lengkap.",
      operatingHours: [{ day: "Setiap hari", hours: "Belum diatur" }],
      shippingOrigin: shippingOrigin || "Asal pengiriman belum lengkap.",
      socials: mapSocials(source),
      description,
      policies: mapPolicies(source),
      saveStatus: source.updatedAt ? `Updated ${text(source.updatedAt)}` : "Live fallback profile",
      editableProfile: {
        name: storeName,
        slug,
        description,
        email: text(source.email),
        whatsapp: text(source.whatsapp),
        phone: text(source.phone),
        websiteUrl: text(source.websiteUrl),
        instagramUrl: text(source.instagramUrl),
        tiktokUrl: text(source.tiktokUrl),
        addressLine1: text(source.addressLine1),
        addressLine2: text(source.addressLine2),
        city: text(source.city),
        province: text(source.province),
        postalCode: text(source.postalCode),
        country: text(source.country),
        shippingOriginContactName: text(shippingSetup.originContactName),
        shippingOriginPhone: text(shippingSetup.originPhone),
        shippingOriginAddressLine1: text(shippingSetup.originAddressLine1),
        shippingOriginAddressLine2: text(shippingSetup.originAddressLine2),
        shippingOriginDistrict: text(shippingSetup.originDistrict),
        shippingOriginCity: text(shippingSetup.originCity),
        shippingOriginProvince: text(shippingSetup.originProvince),
        shippingOriginPostalCode: text(shippingSetup.originPostalCode),
        shippingOriginCountry: text(shippingSetup.originCountry),
        shippingPickupNotes: text(shippingSetup.pickupNotes),
      },
    },
    readiness: {
      percent,
      completed,
      missing,
      notStarted: Math.max(total - completed - missing, 0),
      verifications: [
        {
          label: "Store status",
          status: normalizeVerificationStatus(source.status || contextStore.status),
        },
        {
          label: "Profile completeness",
          status: percent >= 100 ? "verified" : percent > 0 ? "pending" : "missing",
        },
        {
          label: "Shipping origin",
          status: shippingOrigin ? "verified" : "missing",
        },
        {
          label: "Payment readiness",
          status: normalizeVerificationStatus(object(source.operationalReadiness).paymentProfileCode),
        },
      ],
      checklist,
      canSubmitForReview: false,
    },
    microsite: {
      heroTitle: storeName,
      heroSubtitle: description,
      heroCtaLabel: "Belanja Sekarang",
      categories: [
        { id: "profile", name: text(publicStore.businessCategory, "Pilihan Toko") },
        { id: "featured", name: "Produk Unggulan" },
        { id: "new", name: "Terbaru" },
      ],
      featuredProducts: [],
      benefits: [
        {
          label: "Store-scoped",
          description: "Preview memakai data publik toko, bukan metadata internal seller.",
        },
        {
          label: "Brand ready",
          description: "Logo, banner, kontak, dan asal pengiriman mengikuti profil toko.",
        },
        {
          label: "Safe preview",
          description: "Draft, audit, payment credential, dan data tim tidak ditampilkan.",
        },
      ],
    },
    theme: {
      mode: "light",
      brandColors: ["#14532d", "#0f766e", "#a7f3d0", "#f59e0b", "#dc2626"],
      typography: "Inter / System",
      sections: [
        { key: "hero", label: "Hero Banner", enabled: true },
        { key: "categories", label: "Kategori Populer", enabled: true },
        { key: "featured", label: "Produk Unggulan", enabled: true },
        { key: "benefits", label: "Keunggulan Toko", enabled: true },
        { key: "about", label: "Tentang Kami", enabled: Boolean(description) },
        { key: "policies", label: "Kebijakan Toko", enabled: true },
      ],
    },
  };
}
