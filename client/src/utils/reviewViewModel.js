import { resolveAssetUrl } from "../lib/assetUrl.js";
import { resolveProductImageUrl } from "./productImage.js";

export const MAX_REVIEW_IMAGES = 4;
export const MAX_REVIEW_LENGTH = 2000;

export const REVIEW_TABS = [
  { id: "need", label: "Need Review" },
  { id: "reviewed", label: "Reviewed" },
];

const EMPTY_GIF = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

const toArray = (value) => (Array.isArray(value) ? value : []);

const toText = (value) => String(value ?? "").trim();

const toNumberOrNull = (value) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : null;
};

export const unwrapReviewCollection = (payload) => {
  const source = payload?.data ?? payload;
  const candidates = [
    source?.items,
    source?.reviews,
    source?.products,
    source?.data?.items,
    source?.data?.reviews,
    source?.data?.products,
    source?.data,
  ];
  const items = candidates.find((candidate) => Array.isArray(candidate));
  const list = Array.isArray(items) ? items : [];
  const totalItems = Number(
    source?.meta?.totalItems ??
      source?.meta?.total ??
      source?.totalItems ??
      source?.total ??
      source?.data?.meta?.totalItems ??
      list.length
  );

  return {
    items: list,
    totalItems: Number.isFinite(totalItems) ? totalItems : list.length,
  };
};

export const getAssetUrl = (value) => {
  if (!value) return "";
  if (typeof value === "string") {
    return resolveAssetUrl(value);
  }

  const product = value?.product ?? value;
  const productImage = resolveProductImageUrl(product);
  if (productImage) return resolveAssetUrl(productImage);

  const candidates = [
    value?.imageUrl,
    value?.image,
    value?.thumbnail,
    value?.thumbnailUrl,
    value?.photo,
    value?.url,
    value?.promoImagePath,
    value?.promo_image_path,
    product?.imageUrl,
    product?.image,
    product?.thumbnail,
    product?.promoImagePath,
    product?.promo_image_path,
  ];

  for (const candidate of candidates) {
    const text = toText(candidate);
    if (text) return resolveAssetUrl(text);
  }

  const imagePaths =
    value?.imagePaths ??
    value?.image_paths ??
    value?.images ??
    product?.imagePaths ??
    product?.image_paths ??
    product?.images;
  const firstImage = toArray(imagePaths)
    .map((image) => toText(image))
    .find(Boolean);

  return firstImage ? resolveAssetUrl(firstImage) : "";
};

export const getReviewImageUrls = (review) =>
  toArray(review?.images)
    .map((image) => getAssetUrl(image))
    .filter(Boolean)
    .slice(0, MAX_REVIEW_IMAGES);

export const formatReviewDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const normalizeNeedReviewItem = (item = {}) => {
  const productId = toNumberOrNull(item.productId ?? item.product_id ?? item.id);
  const orderId = toNumberOrNull(item.orderId ?? item.order_id);
  const name =
    toText(item.name ?? item.productName ?? item.product?.name) ||
    (productId ? `Product #${productId}` : "Product");

  return {
    id: productId ? `need-${productId}-${orderId ?? "order"}` : `need-${name}`,
    productId,
    orderId,
    orderRef: toText(item.orderRef ?? item.order_ref) || null,
    orderedAt: item.orderedAt ?? item.ordered_at ?? item.orderDate ?? null,
    name,
    slug: toText(item.slug ?? item.product?.slug) || null,
    imageUrl: getAssetUrl(item),
    storeName:
      toText(item.storeName ?? item.store?.name ?? item.vendor?.name) ||
      "Storefront order",
    raw: item,
  };
};

export const normalizeReviewedItem = (review = {}) => {
  const product = review.product ?? {};
  const productId = toNumberOrNull(
    review.productId ?? review.product_id ?? product.id
  );
  const reviewId = toNumberOrNull(review.id ?? review.reviewId);
  const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
  const name =
    toText(product.name ?? review.productName ?? review.name) ||
    (productId ? `Product #${productId}` : "Reviewed product");

  return {
    id: reviewId ? `review-${reviewId}` : `review-product-${productId ?? name}`,
    reviewId,
    productId,
    name,
    slug: toText(product.slug ?? review.slug) || null,
    imageUrl: getAssetUrl({ ...review, product }),
    rating,
    comment: toText(review.comment) || "",
    images: getReviewImageUrls(review),
    createdAt: review.createdAt ?? review.created_at ?? null,
    updatedAt: review.updatedAt ?? review.updated_at ?? null,
    storeName:
      toText(product.storeName ?? product.store?.name ?? review.storeName) ||
      "Storefront order",
    review,
  };
};

export const extractUploadUrl = (payload) => {
  if (typeof payload === "string") return payload;
  const candidates = [
    payload?.url,
    payload?.data?.url,
    payload?.data?.data?.url,
    payload?.file?.url,
    payload?.data?.file?.url,
  ];
  return candidates.map((candidate) => toText(candidate)).find(Boolean) || "";
};

export const buildReviewPayload = ({
  productId,
  rating,
  comment,
  existingImages = [],
  uploadedImages = [],
}) => {
  const normalizedProductId = Number(productId);
  const payload = {
    rating: Math.max(1, Math.min(5, Number(rating) || 0)),
    comment: toText(comment).slice(0, MAX_REVIEW_LENGTH),
    images: [...toArray(existingImages), ...toArray(uploadedImages)]
      .map((image) => toText(image))
      .filter((image) => image && image !== EMPTY_GIF)
      .slice(0, MAX_REVIEW_IMAGES),
  };

  if (Number.isFinite(normalizedProductId)) {
    payload.productId = normalizedProductId;
  }

  return payload;
};
