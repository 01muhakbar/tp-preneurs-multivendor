import {
  createSellerProductDraft,
  submitSellerProductDraftForReview,
  updateSellerProductDraft,
} from "../sellerProducts.ts";
import { runSeller2026Mutation } from "./mutations.ts";

export type Seller2026ProductDraftPayload = {
  name: string;
  sku?: string | null;
  description?: string | null;
  categoryIds?: Array<string | number>;
  tags?: string[];
  price?: number;
  compareAtPrice?: number | null;
  stock?: number;
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

  return {
    name: String(payload.name || "").trim(),
    sku: optionalText(payload.sku),
    description: optionalText(payload.description),
    categoryIds: positiveIds(payload.categoryIds),
    price: nonNegativeNumber(payload.price) ?? 0,
    salePrice:
      typeof payload.compareAtPrice === "number" && payload.compareAtPrice > 0
        ? payload.compareAtPrice
        : null,
    stock: Math.floor(nonNegativeNumber(payload.stock) ?? 0),
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
