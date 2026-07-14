import {
  createSellerProductDraft,
  submitSellerProductDraftForReview,
  updateSellerProductDraft,
} from "../sellerProducts.ts";
import { runSeller2026Mutation } from "./mutations.ts";

export type Seller2026ProductDraftPayload = {
  name: string;
  slug?: string | null;
  sku?: string | null;
  barcode?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  categoryIds?: Array<string | number>;
  defaultCategoryId?: string | number | null;
  brand?: string | null;
  tags?: string[];
  imageUrls?: string[];
  hasVariants?: boolean;
  price?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number | null;
  weight?: number | null;
  notes?: string | null;
  productType?: string | null;
  digitalAssetUrl?: string | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  dimensions?: { length?: number; width?: number; height?: number } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  ogImageUrl?: string | null;
};

const optionalText = (value: unknown) => {
  const normalized = String(value ?? "").trim();
  return normalized || null;
};

const nonNegativeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const positiveIds = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((entry) => Number(entry))
        .filter((entry) => Number.isInteger(entry) && entry > 0)
    : [];

const textList = (value: unknown) =>
  Array.isArray(value)
    ? value.map((entry) => String(entry || "").trim()).filter(Boolean).slice(0, 20)
    : [];

const buildSafeProductDraftPayload = (payload: Seller2026ProductDraftPayload) => {
  const seoTitle = optionalText(payload.seoTitle);
  const seoDescription = optionalText(payload.seoDescription);
  const categoryIds = positiveIds(payload.categoryIds);

  return {
    name: String(payload.name || "").trim(),
    slug: optionalText(payload.slug),
    sku: optionalText(payload.sku),
    barcode: optionalText(payload.barcode),
    shortDescription: optionalText(payload.shortDescription),
    description: optionalText(payload.description),
    brand: optionalText(payload.brand),
    categoryIds,
    defaultCategoryId:
      Number(payload.defaultCategoryId) > 0
        ? Number(payload.defaultCategoryId)
        : categoryIds[0] || null,
    price: nonNegativeNumber(payload.price) ?? 0,
    costPrice: nonNegativeNumber(payload.costPrice) ?? null,
    salePrice:
      typeof payload.compareAtPrice === "number" && payload.compareAtPrice > 0
        ? payload.compareAtPrice
        : null,
    stock: Math.floor(nonNegativeNumber(payload.stock) ?? 0),
    lowStockThreshold: nonNegativeNumber(payload.lowStockThreshold) ?? null,
    weight: nonNegativeNumber(payload.weight) ?? null,
    notes: optionalText(payload.notes),
    productType: optionalText(payload.productType),
    digitalAssetUrl: optionalText(payload.digitalAssetUrl),
    length: nonNegativeNumber(payload.length ?? payload.dimensions?.length) ?? null,
    width: nonNegativeNumber(payload.width ?? payload.dimensions?.width) ?? null,
    height: nonNegativeNumber(payload.height ?? payload.dimensions?.height) ?? null,
    dimensions: payload.dimensions ? {
      length: nonNegativeNumber(payload.dimensions.length) ?? 0,
      width: nonNegativeNumber(payload.dimensions.width) ?? 0,
      height: nonNegativeNumber(payload.dimensions.height) ?? 0,
    } : null,
    tags: textList(payload.tags),
    imageUrls: textList(payload.imageUrls).slice(0, 10),
    hasVariants: false,
    seo: seoTitle || seoDescription || (payload.seoKeywords && payload.seoKeywords.length) || payload.ogImageUrl ? { 
      metaTitle: seoTitle || "", 
      metaDescription: seoDescription || "",
      keywords: textList(payload.seoKeywords),
      ogImageUrl: optionalText(payload.ogImageUrl) || ""
    } : null,
  };
};

export async function createSeller2026ProductDraft({
  storeId,
  payload,
}: {
  storeId: string | number;
  payload: Seller2026ProductDraftPayload;
}) {
  return createSellerProductDraft(storeId, buildSafeProductDraftPayload(payload));
}

export async function updateSeller2026ProductDraft({
  storeId,
  productId,
  payload,
}: {
  storeId: string | number;
  productId: string | number;
  payload: Seller2026ProductDraftPayload;
}) {
  return updateSellerProductDraft(storeId, productId, buildSafeProductDraftPayload(payload));
}

export async function submitSeller2026ProductReview({
  storeId,
  productId,
}: {
  storeId: string | number;
  productId: string | number;
}) {
  return runSeller2026Mutation(() =>
    submitSellerProductDraftForReview(storeId, productId)
  );
}
