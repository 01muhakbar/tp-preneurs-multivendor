const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function adaptSellerStorefrontProfile(value: unknown) {
  const source = object(value);
  const publicProfile = object(source.publicProfile || source);
  return {
    id: publicProfile.id ?? source?.id ?? null,
    name: text(publicProfile.name || source?.name, "Store"),
    slug: text(publicProfile.slug || source?.slug),
    logoUrl: publicProfile.logoUrl || publicProfile.logo || null,
    coverUrl: publicProfile.coverUrl || publicProfile.coverImage || null,
    contact: {
      email: text(publicProfile.email || source?.email),
      phone: text(publicProfile.phone || source?.phone),
      whatsapp: text(publicProfile.whatsapp || source?.whatsapp),
    },
    category: text(publicProfile.businessCategory || source?.businessCategory),
    address: text(publicProfile.address || source?.address),
    shippingOrigin: text(publicProfile.shippingOrigin || source?.shippingOrigin),
    hours: text(publicProfile.operatingHours || source?.operatingHours),
    socialLinks: Array.isArray(publicProfile.socialLinks) ? publicProfile.socialLinks : [],
    about: text(publicProfile.about || source?.about),
    policySnippet: text(publicProfile.policySnippet || source?.policySnippet),
    theme: publicProfile.theme || source?.theme || null,
  };
}
