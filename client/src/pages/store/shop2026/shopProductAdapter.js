import { resolveProductImageUrl } from "../../../utils/productImage.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

export const readShopText = (...values) => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

export const normalizeShopArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  for (const key of keys) {
    const nested = payload?.data?.[key] ?? payload?.payload?.[key] ?? payload?.result?.[key];
    if (Array.isArray(nested)) return nested;
  }
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getShopCategoryValue = (category) =>
  readShopText(category?.slug, category?.code, category?.id, category?.name);

export const getProductImages = (product) => {
  const images = [];
  const primary = resolveProductImageUrl(product);
  if (primary) {
    const resolvedPrimary = resolveAssetUrl(primary);
    if (resolvedPrimary) images.push(resolvedPrimary);
  }

  const rawList = Array.isArray(product?.imagePaths)
    ? product.imagePaths
    : Array.isArray(product?.imageUrls)
      ? product.imageUrls
      : Array.isArray(product?.images)
        ? product.images
        : [];

  for (const item of rawList) {
    if (!item) continue;
    const raw = resolveProductImageUrl(typeof item === "string" ? { imageUrl: item } : item);
    const resolved = resolveAssetUrl(raw);
    if (resolved && !images.includes(resolved)) {
      images.push(resolved);
    }
  }

  const gallery = normalizeShopArray(product?.gallery ?? product?.media ?? product?.assets, [
    "items",
    "images",
  ]);
  for (const item of gallery) {
    const raw = readShopText(item?.url, item?.src, item?.imageUrl, item);
    if (raw) {
      const resolved = resolveAssetUrl(resolveProductImageUrl({ imageUrl: raw }));
      if (resolved && !images.includes(resolved)) {
        images.push(resolved);
      }
    }
  }

  if (images.length === 0) {
    images.push("/demo/placeholder-product.svg");
  }

  return images;
};

const getImage = (product) => {
  const allImages = getProductImages(product);
  return allImages[0] || "";
};

const getPrice = (product) => {
  const value = Number(
    product?.salePrice ??
      product?.price ??
      product?.finalPrice ??
      product?.pricing?.salePrice ??
      product?.pricing?.price ??
      0
  );
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

const getOriginalPrice = (product) => {
  const value = Number(
    product?.originalPrice ??
      product?.compareAtPrice ??
      product?.regularPrice ??
      product?.pricing?.originalPrice ??
      product?.pricing?.compareAtPrice ??
      product?.price ??
      0
  );
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

export function mapProductToShopCard(product) {
  const price = getPrice(product);
  const originalPrice = getOriginalPrice(product);
  const explicitDiscount = Number(product?.discountPercent ?? product?.discount?.percent);
  const computedDiscount =
    originalPrice > price && price > 0
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;
  const stockValue = Number(product?.stock ?? product?.availableStock);
  const purchaseState = product?.purchaseState || null;
  const id = Number(product?.id ?? product?.productId);
  const slug = readShopText(product?.routeSlug, product?.slug, product?.seo?.slug, product?.id);
  const name = readShopText(product?.name, product?.title, "Product");
  const category = readShopText(
    product?.category?.name,
    product?.categoryName,
    product?.category?.title,
    "Uncategorized"
  );
  const ratingValue = Number(
    product?.ratingAvg ?? product?.rating ?? product?.averageRating ?? product?.reviews?.average ?? 0
  );
  const reviewValue = Number(
    product?.reviewCount ?? product?.reviewsCount ?? product?.reviews?.count ?? 0
  );
  const isPurchasable =
    typeof purchaseState?.isPurchasable === "boolean"
      ? purchaseState.isPurchasable
      : !(Number.isFinite(stockValue) && stockValue <= 0);

  const allImages = getProductImages(product);

  return {
    raw: product,
    id: Number.isFinite(id) ? id : null,
    slug,
    href: slug ? `/product/${encodeURIComponent(slug)}` : "#",
    name,
    category,
    image: allImages[0] || "",
    images: allImages,
    price,
    originalPrice,
    discount: Math.max(
      0,
      Number.isFinite(explicitDiscount) ? Math.round(explicitDiscount) : computedDiscount
    ),
    rating: Number.isFinite(ratingValue) ? ratingValue : 0,
    reviewCount: Number.isFinite(reviewValue) ? reviewValue : 0,
    stock: Number.isFinite(stockValue) ? stockValue : null,
    isPurchasable,
    purchaseLabel: purchaseState?.label || (stockValue <= 0 ? "Out of stock" : "Unavailable"),
    storeName: readShopText(product?.store?.name, product?.seller?.name, "Local store"),
    storeSlug: readShopText(product?.storeSlug, product?.store?.slug),
    description: readShopText(product?.shortDescription, product?.description),
  };
}

export const buildShopCartSnapshot = (card) => ({
  name: card.name,
  price: card.price,
  imageUrl: card.image || null,
  stock: card.stock,
  slug: card.slug,
  storeId: card.raw?.storeId ?? card.raw?.store?.id ?? null,
  storeSlug: card.storeSlug,
  category: card.category,
});
