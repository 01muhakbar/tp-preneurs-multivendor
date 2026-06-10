import type { Seller2026ProductDetailViewModel } from "./products.adapter.ts";

const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function adaptSeller2026ProductDetailPresentation(
  detail: Seller2026ProductDetailViewModel | null
) {
  if (!detail) return null;
  const product = detail.product;
  const regularPrice = Math.max(number(product.price), number(product.salePrice));
  const effectivePrice = product.salePrice && product.salePrice > 0
    ? Math.min(number(product.price), number(product.salePrice))
    : number(product.price);
  const discount =
    regularPrice > 0 && effectivePrice < regularPrice
      ? Math.round(((regularPrice - effectivePrice) / regularPrice) * 100)
      : 0;
  const inventory =
    product.stock <= 0 ? "Out of Stock" :
    product.stock <= Math.max(product.lowStockThreshold || 10, 10) ? "Low Stock" :
    "In Stock";
  const visibility = product.isPublished ? "Visible in Storefront" : "Hidden";
  const review =
    product.submissionStatus === "submitted" || product.submissionStatus === "review_queue"
      ? "Pending Review"
      : product.status === "active"
        ? "Approved"
        : product.status === "needs_revision"
          ? "Needs Revision"
          : "Not submitted";
  const healthSignals = [
    Boolean(product.name),
    Boolean(product.description),
    Boolean(product.gallery.length),
    Boolean(product.category && product.category !== "Uncategorized"),
    regularPrice > 0,
  ];
  return {
    ...detail,
    pricing: { regularPrice, effectivePrice, discount },
    labels: { inventory, visibility, review },
    listingHealth: Math.round(
      (healthSignals.filter(Boolean).length / healthSignals.length) * 100
    ),
  };
}

