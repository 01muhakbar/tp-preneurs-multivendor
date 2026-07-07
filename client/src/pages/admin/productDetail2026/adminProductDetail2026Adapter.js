import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { buildAdminProductVariantRows } from "../../../utils/adminProductVariations.js";
import {
  getProductVisibleImageUrls,
  normalizeProductDisplayTags,
} from "../../../utils/productDisplay.js";

export const PRODUCT_DETAIL_FALLBACK_IMAGE = "/demo/placeholder-product.svg";

const asText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const asNumber = (value, fallback = 0) => {
  if (value === null || typeof value === "undefined" || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

export const unwrapAdminProductDetail = (payload) => {
  let current = payload;
  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) break;
    if (current.product && typeof current.product === "object") {
      current = current.product;
      continue;
    }
    if (current.data && typeof current.data === "object" && !Array.isArray(current.data)) {
      current = current.data;
      continue;
    }
    break;
  }
  return current && typeof current === "object" && !Array.isArray(current) ? current : null;
};

const normalizePerson = (value, fallback = "System") => {
  if (!value) return fallback;
  if (typeof value === "string") return asText(value, fallback);
  return asText(value.name || value.fullName || value.displayName || value.email, fallback);
};

const normalizeCategories = (raw) => {
  const candidates = [
    ...asArray(raw?.categories),
    raw?.defaultCategory,
    raw?.category,
  ].filter(Boolean);
  const seen = new Set();
  return candidates
    .map((entry) =>
      typeof entry === "string"
        ? { id: entry, name: entry }
        : {
            id: entry?.id ?? entry?.code ?? entry?.name,
            name: asText(entry?.name || entry?.title || entry?.label),
          }
    )
    .filter((entry) => {
      const key = asText(entry.name).toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const normalizeImages = (raw) => {
  const media = raw?.media && typeof raw.media === "object" ? raw.media : {};
  const candidates = [
    ...getProductVisibleImageUrls(raw),
    raw?.image,
    raw?.thumbnail,
    raw?.promoImagePath,
    media?.promoImageUrl,
    ...asArray(raw?.images).map((entry) =>
      typeof entry === "string" ? entry : entry?.url || entry?.path || entry?.src
    ),
    ...asArray(raw?.gallery).map((entry) =>
      typeof entry === "string" ? entry : entry?.url || entry?.path || entry?.src
    ),
    ...asArray(media?.imageUrls),
  ];
  const seen = new Set();
  const images = candidates
    .map((entry) => asText(entry))
    .filter((entry) => {
      if (!entry || seen.has(entry)) return false;
      seen.add(entry);
      return true;
    })
    .map((entry) => resolveAssetUrl(entry));
  return images.length ? images : [PRODUCT_DETAIL_FALLBACK_IMAGE];
};

const normalizeVariants = (raw, fallbackImage) => {
  const rows = buildAdminProductVariantRows(raw, fallbackImage);
  if (rows.length) {
    return rows.map((row) => ({
      ...row,
      name: row.combination || "Default",
      stock: asNumber(row.quantity),
      price: asNumber(row.salePrice || row.originalPrice),
      lowStock: asNumber(row.quantity) > 0 && asNumber(row.quantity) <= asNumber(raw?.lowStockThreshold, 10),
    }));
  }

  const source = asArray(raw?.variants).length
    ? asArray(raw.variants)
    : asArray(raw?.variations?.variants);
  if (source.length) {
    return source.map((variant, index) => ({
      id: variant?.id || `variant-${index + 1}`,
      name: asText(variant?.name || variant?.combination || variant?.title, `Variant ${index + 1}`),
      sku: asText(variant?.sku, raw?.sku || "—"),
      price: asNumber(variant?.salePrice ?? variant?.price, asNumber(raw?.salePrice ?? raw?.price)),
      stock: asNumber(variant?.quantity ?? variant?.stock, asNumber(raw?.stock)),
      lowStock:
        asNumber(variant?.quantity ?? variant?.stock, asNumber(raw?.stock)) > 0 &&
        asNumber(variant?.quantity ?? variant?.stock, asNumber(raw?.stock)) <=
          asNumber(raw?.lowStockThreshold, 10),
    }));
  }

  return [
    {
      id: `default-${raw?.id || "product"}`,
      name: "Default",
      sku: asText(raw?.sku, "—"),
      price: asNumber(raw?.salePrice ?? raw?.price),
      stock: asNumber(raw?.stock ?? raw?.quantity),
      lowStock:
        asNumber(raw?.stock ?? raw?.quantity) > 0 &&
        asNumber(raw?.stock ?? raw?.quantity) <= asNumber(raw?.lowStockThreshold, 10),
    },
  ];
};

const normalizeTimeline = (raw, published, createdBy, updatedBy) => {
  const source = [
    ...asArray(raw?.timeline),
    ...asArray(raw?.audit),
    ...asArray(raw?.auditLogs),
    ...asArray(raw?.activity),
    ...asArray(raw?.activityLogs),
  ];
  const normalized = source.map((entry, index) => ({
    id: entry?.id || `activity-${index}`,
    title: asText(entry?.title || entry?.action || entry?.event, "Product updated"),
    date: entry?.createdAt || entry?.date || entry?.timestamp || raw?.updatedAt,
    actor: normalizePerson(entry?.actor || entry?.user || entry?.createdBy, updatedBy),
    tone: index === 0 ? "green" : "blue",
  }));
  if (normalized.length) return normalized.slice(0, 6);

  const fallback = [];
  if (published) {
    fallback.push({
      id: "published",
      title: "Product published",
      date: raw?.publishedAt || raw?.updatedAt,
      actor: updatedBy,
      tone: "green",
    });
  }
  if (raw?.updatedAt) {
    fallback.push({
      id: "updated",
      title: "Product updated",
      date: raw.updatedAt,
      actor: updatedBy,
      tone: "blue",
    });
  }
  if (raw?.createdAt) {
    fallback.push({
      id: "created",
      title: "Product created",
      date: raw.createdAt,
      actor: createdBy,
      tone: "slate",
    });
  }
  return fallback;
};

export const normalizeAdminProductDetail2026 = (payload) => {
  const raw = unwrapAdminProductDetail(payload);
  if (!raw || raw.id == null) return null;

  const images = normalizeImages(raw);
  const price = asNumber(raw?.price ?? raw?.pricing?.basePrice ?? raw?.pricing?.price);
  const saleCandidate = asNumber(raw?.salePrice ?? raw?.pricing?.salePrice, 0);
  const salePrice = saleCandidate > 0 && (!price || saleCandidate < price) ? saleCandidate : null;
  const published = Boolean(raw?.published ?? raw?.isPublished);
  const categories = normalizeCategories(raw);
  const createdBy = normalizePerson(
    raw?.createdBy || raw?.creator || raw?.createdByUser,
    "Not available"
  );
  const updatedBy = normalizePerson(raw?.updatedBy || raw?.updater || raw?.updatedByUser, createdBy);
  const stock = asNumber(raw?.stock ?? raw?.quantity ?? raw?.inventory?.stock);
  const lowStockThreshold = asNumber(raw?.lowStockThreshold ?? raw?.inventory?.lowStockThreshold, 10);
  const store = raw?.store && typeof raw.store === "object" ? raw.store : null;
  const storeId = raw?.storeId ?? store?.id ?? null;
  const hasExplicitStoreScope =
    Object.prototype.hasOwnProperty.call(raw, "storeId") || Boolean(store);
  const tags = normalizeProductDisplayTags(raw?.tags, { filterInternal: true, maxLength: 48 });
  const seoKeywords = normalizeProductDisplayTags(raw?.seo?.keywords, {
    filterInternal: true,
    maxLength: 48,
  });
  const visibilityCode = asText(raw?.visibility?.stateCode || raw?.storefrontVisibilityState).toUpperCase();
  const variants = normalizeVariants(raw, images[0]);
  const isVariable = variants.length > 1 || Boolean(raw?.variations?.hasVariants);

  return {
    raw,
    id: raw.id,
    code: asText(raw?.code || raw?.productCode, `PRD-${String(raw.id).padStart(6, "0")}`),
    name: asText(raw?.name || raw?.title, "Untitled product"),
    slug: asText(raw?.slug),
    sku: asText(raw?.sku || raw?.barcode, "—"),
    barcode: asText(raw?.barcode, "—"),
    description: asText(raw?.description || raw?.shortDescription, "No product description has been added."),
    shortDescription: asText(raw?.shortDescription || raw?.notes),
    price,
    salePrice,
    effectivePrice: salePrice ?? price,
    discountPercent:
      price > 0 && salePrice ? Math.max(0, Math.round(((price - salePrice) / price) * 100)) : 0,
    stock,
    lowStockThreshold,
    backorder: Boolean(raw?.backorder ?? raw?.allowBackorder ?? raw?.inventory?.backorder),
    published,
    status: asText(raw?.status, published ? "published" : "draft").toLowerCase(),
    visibility:
      visibilityCode === "STOREFRONT_VISIBLE" || (published && !visibilityCode) ? "Public" : "Hidden",
    featured: Boolean(raw?.featured ?? raw?.isFeatured),
    digital: Boolean(raw?.digital ?? raw?.isDigital),
    productType: asText(raw?.productType || raw?.type, isVariable ? "Variable Product" : "Simple Product"),
    images,
    categories,
    category: categories[0]?.name || "Uncategorized",
    tags,
    storeId,
    storeName: asText(
      store?.name || raw?.storeName,
      storeId ? `Store #${storeId}` : hasExplicitStoreScope ? "Global (Admin)" : "Not available"
    ),
    createdAt: raw?.createdAt || null,
    updatedAt: raw?.updatedAt || null,
    createdBy,
    updatedBy,
    variants,
    timeline: normalizeTimeline(raw, published, createdBy, updatedBy),
    submissionStatus: asText(raw?.sellerSubmission?.status || raw?.sellerSubmissionStatus, "none").toLowerCase(),
    revisionNote: asText(raw?.sellerSubmission?.revisionNote || raw?.sellerRevisionNote),
    seo: {
      title: asText(raw?.seo?.metaTitle || raw?.metaTitle),
      description: asText(raw?.seo?.metaDescription || raw?.metaDescription),
      keywords: seoKeywords.length ? seoKeywords : tags,
    },
    publicationNotes: asText(raw?.publicationNotes || raw?.notes || raw?.sellerSubmission?.reviewNote),
  };
};

export const getDuplicatedProductId = (payload) => {
  const value = unwrapAdminProductDetail(payload);
  return value?.id ?? payload?.id ?? null;
};
