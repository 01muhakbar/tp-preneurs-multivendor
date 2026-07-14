import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { getPrimaryProductImageUrl } from "../../../utils/productDisplay.js";
import { moneyIDR } from "../../../utils/money.js";

export const PRODUCT_LIST_LIMIT = 10;
export const FALLBACK_PRODUCT_IMAGE = "/demo/placeholder-product.svg";

export const DEFAULT_PRODUCTS_2026_FILTERS = {
  q: "",
  categoryId: "all",
  published: "all",
  stock: "all",
  sort: "date_added",
};

const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "published", "active"].includes(normalized)) return true;
    if (["false", "0", "no", "unpublished", "draft"].includes(normalized)) return false;
  }
  return Boolean(value);
};

const firstDefined = (...values) =>
  values.find((value) => value !== null && typeof value !== "undefined" && value !== "");

const formatRelativeTime = (value) => {
  const timestamp = value ? new Date(value).getTime() : Number.NaN;
  if (!Number.isFinite(timestamp)) return "-";

  const diffMs = Date.now() - timestamp;
  const absMs = Math.abs(diffMs);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (absMs < minute) return "Just now";
  if (absMs < hour) return `${Math.max(1, Math.round(absMs / minute))}m ago`;
  if (absMs < day) return `${Math.max(1, Math.round(absMs / hour))}h ago`;
  if (absMs < 30 * day) return `${Math.max(1, Math.round(absMs / day))}d ago`;

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
};

const resolveCategoryName = (product) => {
  const categories = Array.isArray(product?.categories) ? product.categories.filter(Boolean) : [];
  const defaultCategoryId = asNumber(product?.defaultCategoryId ?? product?.categoryId, 0);
  const matchedDefault = categories.find((category) => asNumber(category?.id) === defaultCategoryId);
  return (
    matchedDefault?.name ||
    product?.defaultCategory?.name ||
    product?.category?.name ||
    categories[0]?.name ||
    "Uncategorized"
  );
};

const resolveSku = (product) =>
  String(firstDefined(product?.sku, product?.SKU, product?.barcode, `ID-${product?.id || "N/A"}`));

const normalizeSellerSubmissionStatus = (value) => {
  const normalized = String(value || "none").trim().toLowerCase();
  if (normalized === "submitted") return "submitted";
  if (normalized === "needs_revision") return "needs_revision";
  return "none";
};

const resolveSellerSubmission = (product) => {
  const source =
    product?.sellerSubmission && typeof product.sellerSubmission === "object"
      ? product.sellerSubmission
      : {};
  const status = normalizeSellerSubmissionStatus(
    source.status || product?.sellerSubmissionStatus || product?.submissionStatus
  );

  return {
    ...source,
    status,
    label:
      source.label ||
      (status === "submitted"
        ? "Submitted for Review"
        : status === "needs_revision"
          ? "Needs Revision"
          : "Not Submitted"),
    publishGate:
      source.publishGate && typeof source.publishGate === "object"
        ? source.publishGate
        : null,
  };
};

export const normalizeAdminProduct2026 = (product) => {
  const id = firstDefined(product?.id, product?.productId);
  const price = asNumber(product?.price, 0);
  const salePriceRaw = firstDefined(product?.salePrice, product?.sale_price);
  const salePrice = salePriceRaw === undefined ? null : asNumber(salePriceRaw, 0);
  const hasSalePrice = salePrice !== null && salePrice > 0 && salePrice < price;
  const stock = asNumber(firstDefined(product?.stock, product?.quantity), 0);
  const published = asBoolean(firstDefined(product?.published, product?.isPublished, false));
  const status = String(product?.status || "").trim().toLowerCase();
  const isDraft = !published || status === "draft";
  const imageUrl = getPrimaryProductImageUrl(product) || product?.imageUrl || product?.promoImagePath;
  const sellerSubmission = resolveSellerSubmission(product);
  const isSubmittedForReview = sellerSubmission.status === "submitted";
  const needsRevision = sellerSubmission.status === "needs_revision";
  const canUseListToggle = sellerSubmission.publishGate?.canUseListToggle !== false;
  const statusCode = isSubmittedForReview
    ? "review_submitted"
    : needsRevision
      ? "needs_revision"
      : stock <= 0
        ? "out_of_stock"
        : isDraft
          ? "draft"
          : "published";
  const statusLabel = isSubmittedForReview
    ? "Submitted for Review"
    : needsRevision
      ? "Needs Revision"
      : stock <= 0
        ? "Out of Stock"
        : isDraft
          ? "Draft"
          : "Published";

  return {
    id,
    name: product?.name || product?.title || `Product #${id}`,
    sku: resolveSku(product),
    category: resolveCategoryName(product),
    price,
    priceLabel: moneyIDR(price),
    salePrice: hasSalePrice ? salePrice : null,
    salePriceLabel: hasSalePrice ? moneyIDR(salePrice) : "-",
    stock,
    published,
    statusCode,
    statusLabel,
    sellerSubmission,
    sellerSubmissionStatus: sellerSubmission.status,
    canApproveReview: isSubmittedForReview,
    canRequestRevision: isSubmittedForReview,
    canUseListToggle,
    updatedAt: product?.updatedAt || product?.updated_at || product?.createdAt || product?.created_at,
    updatedLabel: formatRelativeTime(
      product?.updatedAt || product?.updated_at || product?.createdAt || product?.created_at
    ),
    imageUrl: imageUrl ? resolveAssetUrl(imageUrl) : FALLBACK_PRODUCT_IMAGE,
    raw: product,
  };
};

export const normalizeAdminProducts2026 = (items = []) =>
  (Array.isArray(items) ? items : []).map(normalizeAdminProduct2026).filter((item) => item.id);

export const normalizeAdminCategories2026 = (payload) => {
  const items = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
  return items
    .map((category) => ({
      id: String(category?.id || ""),
      name: String(category?.name || category?.title || "Untitled category"),
    }))
    .filter((category) => category.id)
    .sort((left, right) => left.name.localeCompare(right.name, "id"));
};

export const buildAdminProducts2026Params = ({ filters, page, limit = PRODUCT_LIST_LIMIT }) => {
  const published =
    filters.published === "published"
      ? true
      : filters.published === "unpublished"
        ? false
        : undefined;

  return {
    page,
    limit,
    q: filters.q || undefined,
    categoryIds: filters.categoryId !== "all" ? filters.categoryId : undefined,
    published: filters.published === "review_queue" ? undefined : published,
    sellerSubmissionStatus: filters.published === "review_queue" ? "review_queue" : undefined,
    inventoryStatus: filters.stock !== "all" ? filters.stock : undefined,
    sort: filters.sort || undefined,
  };
};

export const computeAdminProducts2026Stats = ({ products, meta }) => {
  const rows = Array.isArray(products) ? products : [];
  return {
    total: asNumber(meta?.total, rows.length),
    published: rows.filter((product) => product.published).length,
    draft: rows.filter((product) => !product.published || product.statusCode === "draft").length,
    reviewQueue: asNumber(meta?.reviewQueue?.total, 0),
    outOfStock: rows.filter((product) => product.stock <= 0).length,
  };
};

export const getProducts2026PageWindow = (meta) => {
  const page = Math.max(1, asNumber(meta?.page, 1));
  const limit = Math.max(1, asNumber(meta?.limit, PRODUCT_LIST_LIMIT));
  const total = Math.max(0, asNumber(meta?.total, 0));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);
  return { page, limit, total, start, end, totalPages: Math.max(1, asNumber(meta?.totalPages, 1)) };
};

export const downloadAdminProducts2026Export = async (response, fallbackName) => {
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] || fallbackName;

  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);

  return filename;
};
