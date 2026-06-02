const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function normalizeProductStatus(value: unknown) {
  const status = text(value).toLowerCase();
  if (["active", "published"].includes(status)) return "Active";
  if (["submitted", "review_queue"].includes(status)) return "Submitted";
  if (["needs_revision", "revision"].includes(status)) return "Needs Revision";
  if (["inactive", "archived"].includes(status)) return "Inactive";
  return "Draft";
}

export function adaptSellerProduct(value: unknown) {
  const product = object(value);
  const category = object(product.category);
  const inventory = object(product.inventory);
  return {
    id: product?.id ?? product?.productId ?? null,
    name: text(product?.name || product?.title, "Untitled product"),
    sku: text(product?.sku || product?.code),
    thumbnail: product?.thumbnailUrl || product?.thumbnail || product?.image || null,
    category: text(product?.categoryName || category.name),
    stock: number(product?.stock ?? inventory.stock, 0),
    price: number(product?.price ?? product?.salePrice, 0),
    sales: number(product?.salesCount ?? product?.soldCount, 0),
    views: number(product?.viewCount ?? product?.views, 0),
    status: normalizeProductStatus(product?.status ?? product?.submissionStatus),
    updatedAt: product?.updatedAt || product?.updated_at || null,
  };
}

export function adaptSellerProductList(value: unknown) {
  const response = object(value);
  const data = object(response.data);
  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(data.items)
      ? data.items
      : [];
  return {
    items: items.map(adaptSellerProduct),
    pagination: response.pagination || data.pagination || null,
  };
}
