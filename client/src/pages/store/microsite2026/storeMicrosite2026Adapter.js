import { resolveAssetUrl } from "../../../lib/assetUrl.js";

function formatMonthYear(value) {
  if (!value) return "New store";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "New store";
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(date);
}

export function normalizePublicStoreIdentity(raw, fallbackSlug) {
  const data = raw?.data ?? raw ?? {};
  const slug = data.slug || fallbackSlug || "";
  const name = data.name || data.storeName || "Store";
  const createdAt = data.createdAt || data.created_at || data.joinedAt;

  const isOperational = String(data.status || data.operationalReadiness || data?.summary?.status?.code || data?.summary?.status?.label || "")
    .toLowerCase()
    .includes("active") || String(data.status || data?.summary?.status?.label || "").toLowerCase().includes("operational") || String(data?.summary?.operationalReadiness?.label || "").toLowerCase().includes("active");

  return {
    id: data.id || data.storeId || null,
    slug,
    name,
    handle: slug ? `@${slug}` : "",
    logoUrl: data.logoUrl || data.logo || data.imageUrl || "",
    bannerUrl: data.bannerUrl || data.coverUrl || "",
    description:
      data.description ||
      data.summary?.description ||
      data.shortDescription ||
      "Quality products, trusted by entrepreneurs.",
    phone: data.phone || data.whatsapp || "",
    email: data.email || "",
    whatsapp: data.whatsapp || data.phone || "",
    addressLabel: [
      data.addressLine1,
      data.city,
      data.province,
      data.country,
    ].filter(Boolean).join(", "),
    joinedLabel: formatMonthYear(createdAt),
    isOperational,
    rawSummary: data.summary, // preserve for original shell
  };
}

export function normalizePublicProducts(raw) {
  const payload = raw?.data ?? raw ?? {};
  const list =
    payload.items ||
    payload.products ||
    payload.rows ||
    payload.data ||
    [];

  const products = Array.isArray(list) ? list : [];

  return {
    products,
    total:
      Number(payload.total ?? payload.count ?? payload.totalItems ?? products.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    totalPages: Number(payload.totalPages ?? payload.pages ?? 1) || 1,
  };
}

export function buildStoreMicrosite2026ViewModel({ identity, productsPayload, richAbout, slug }) {
  const store = normalizePublicStoreIdentity(identity, slug);
  const productState = normalizePublicProducts(productsPayload);
  const rich = richAbout?.data ?? richAbout ?? {};

  // For the case when the product API doesn't return the total number
  const totalProducts = Math.max(productState.total, identity?.data?.summary?.productCount || 0);

  return {
    slug: store.slug || slug,
    store: {
      ...store,
      productCount: totalProducts,
      operationalLabel: store.isOperational ? "Operational" : "Store",
    },
    products: productState.products,
    featuredProducts: [...productState.products]
      .sort((a, b) => {
        // Fallback sort for Top Picks if needed
        const ratingDiff = (Number(b?.ratingAvg) || 0) - (Number(a?.ratingAvg) || 0);
        if (ratingDiff !== 0) return ratingDiff;
        const reviewDiff = (Number(b?.reviewCount) || 0) - (Number(a?.reviewCount) || 0);
        if (reviewDiff !== 0) return reviewDiff;
        return (Number(b?.price) || 0) - (Number(a?.price) || 0);
      })
      .slice(0, 8),
    productState,
    richAboutHtml: rich.effective?.body || rich.richAbout || rich.html || rich.content || "",
    notes: [
      "Only active public products are shown.",
      "Store identity follows the public store profile.",
      "Metrics only appear when public data is available.",
    ],
    hasProducts: productState.products.length > 0,
  };
}
