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
  shortDescription?: string | null;
  description?: string | null;
  categoryIds?: Array<string | number>;
  brand?: string | null;
  tags?: string[];
  price?: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  stock?: number;
  lowStockThreshold?: number | null;
  weight?: number | null;
  dimensions?: { length?: number; width?: number; height?: number } | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
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
    shortDescription: optionalText(payload.shortDescription),
    description: optionalText(payload.description),
    brand: optionalText(payload.brand),
    categoryIds,
    defaultCategoryId: categoryIds[0] || null,
    price: nonNegativeNumber(payload.price) ?? 0,
    costPrice: nonNegativeNumber(payload.costPrice) ?? null,
    salePrice:
      typeof payload.compareAtPrice === "number" && payload.compareAtPrice > 0
        ? payload.compareAtPrice
        : null,
    stock: Math.floor(nonNegativeNumber(payload.stock) ?? 0),
    lowStockThreshold: nonNegativeNumber(payload.lowStockThreshold) ?? null,
    weight: nonNegativeNumber(payload.weight) ?? null,
    dimensions: payload.dimensions ? {
      length: nonNegativeNumber(payload.dimensions.length) ?? 0,
      width: nonNegativeNumber(payload.dimensions.width) ?? 0,
      height: nonNegativeNumber(payload.dimensions.height) ?? 0,
    } : null,
    tags: textList(payload.tags),
    seo: seoTitle || seoDescription ? { title: seoTitle || "", description: seoDescription || "" } : null,
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
