import type { Seller2026ProductDetailViewModel } from "./products.adapter.ts";

export type Seller2026ProductEditorForm = {
  id?: string | number | null;
  name: string;
  description: string;
  categoryIds: string[];
  defaultCategoryId: string;
  price: string;
  salePrice: string;
  quantity: string;
  sku: string;
  barcode: string;
  slug: string;
  tags: string[];
  images: string[];
  hasVariants: boolean;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  ogImageUrl: string;
  imageAlt: string;
};

export type Seller2026ProductCategoryOption = {
  value: string;
  label: string;
};

const text = (value: unknown) => String(value ?? "").trim();
const array = (value: unknown) => (Array.isArray(value) ? value : []);

export const slugifySeller2026Product = (value: unknown) =>
  text(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function createSeller2026ProductEditorForm(
  detail?: Seller2026ProductDetailViewModel | null
): Seller2026ProductEditorForm {
  const product = detail?.product;
  const editable = detail?.editableDraft;
  return {
    id: product?.id ?? null,
    name: text(editable?.name),
    description: text(editable?.description),
    categoryIds: array(editable?.categoryIds).map(String),
    defaultCategoryId: String(editable?.categoryIds?.[0] ?? ""),
    price: editable ? String(editable.price ?? 0) : "0",
    salePrice: editable?.compareAtPrice ? String(editable.compareAtPrice) : "",
    quantity: editable ? String(editable.stock ?? 0) : "0",
    sku: text(editable?.sku),
    barcode: text((product as any)?.barcode),
    slug: text(product?.slug),
    tags: array(editable?.tags).map(String),
    images: array(product?.gallery).map(String),
    hasVariants: Boolean(detail?.variants?.length),
    seoTitle: text((editable as any)?.seo?.metaTitle || (editable as any)?.seo?.title || (editable as any)?.seoTitle),
    seoDescription: text((editable as any)?.seo?.metaDescription || (editable as any)?.seo?.description || (editable as any)?.seoDescription),
    seoKeywords: array((editable as any)?.seo?.keywords).map(String),
    ogImageUrl: text((editable as any)?.seo?.ogImageUrl),
    imageAlt: text((editable as any)?.imageAlt), // TODO: Map from actual API if supported
  };
}

export function adaptSeller2026ProductCategories(meta: unknown): Seller2026ProductCategoryOption[] {
  const references = (meta && typeof meta === "object" ? (meta as any).references : null) || {};
  return array(references.categories)
    .map((entry: any) => ({
      value: String(entry?.id ?? ""),
      label: text(entry?.name),
    }))
    .filter((entry) => entry.value && entry.label);
}

export function validateSeller2026ProductForm(form: Seller2026ProductEditorForm) {
  const errors: Record<string, string> = {};
  const price = Number(form.price);
  const salePrice = form.salePrice === "" ? null : Number(form.salePrice);
  const quantity = Number(form.quantity);
  if (!text(form.name)) errors.name = "Product name is required.";
  if (!form.categoryIds.length) errors.categoryIds = "Select at least one category.";
  if (!Number.isFinite(price) || price < 0) errors.price = "Enter a valid product price.";
  if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) {
    errors.salePrice = "Sale price cannot exceed the product price.";
  }
  if (!Number.isFinite(quantity) || quantity < 0) errors.quantity = "Enter a valid quantity.";
  return errors;
}

export function buildSeller2026ProductDraftPayload(form: Seller2026ProductEditorForm) {
  return {
    name: text(form.name),
    slug: text(form.slug) || slugifySeller2026Product(form.name),
    sku: text(form.sku) || null,
    barcode: text(form.barcode) || null,
    description: text(form.description) || null,
    categoryIds: form.categoryIds,
    defaultCategoryId: form.defaultCategoryId || form.categoryIds[0] || null,
    price: Number(form.price || 0),
    compareAtPrice: form.salePrice === "" ? null : Number(form.salePrice),
    stock: Math.floor(Number(form.quantity || 0)),
    tags: form.tags,
    imageUrls: form.images,
    hasVariants: false,
    seoTitle: text(form.seoTitle) || null,
    seoDescription: text(form.seoDescription) || null,
    seoKeywords: form.seoKeywords,
    ogImageUrl: text(form.ogImageUrl) || null,
    // imageAlt: text(form.imageAlt) || null, // TODO: Send to API when endpoint supports image alt
  };
}

