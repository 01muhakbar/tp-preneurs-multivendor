import { resolveAssetUrl } from "../../lib/assetUrl.js";

export type Seller2026ReviewStatus = "pending" | "published" | "hidden";

export type Seller2026Review = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productSku: string;
  productPrice: number;
  productImageUrl: string;
  reviewerName: string;
  reviewerInitials: string;
  verifiedBuyer: boolean;
  rating: number;
  ratingLabel: string;
  comment: string;
  images: string[];
  status: Seller2026ReviewStatus;
  statusLabel: string;
  isPublished: boolean;
  isPending: boolean;
  isHidden: boolean;
  reply: string;
  repliedAt: string | null;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string | null;
  createdAtLabel: string;
  reportedAt: string | null;
  reportReason: string;
  isReported: boolean;
  raw: Record<string, unknown>;
};

export type Seller2026ReviewsViewModel = {
  items: Seller2026Review[];
  stats: {
    totalReviews: number;
    averageRating: number;
    pendingReplies: number;
    responseRate: number;
    published: number;
    pending: number;
    hidden: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    from: number;
    to: number;
  };
};

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const text = (value: unknown, fallback = "") => String(value ?? "").trim() || fallback;
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const list = (value: unknown) => (Array.isArray(value) ? value : []);

const safeImageUrl = (value: unknown): string => {
  const url = resolveAssetUrl(text(value));
  return /^(javascript:|vbscript:|data:(?!image\/))/i.test(url) ? "" : url;
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "CU";

const status = (value: unknown): Seller2026ReviewStatus => {
  const normalized = text(value).toLowerCase();
  return normalized === "pending" || normalized === "hidden" ? normalized : "published";
};

const statusLabel = (value: Seller2026ReviewStatus) =>
  value === "pending" ? "Pending" : value === "hidden" ? "Hidden" : "Published";

const dateLabel = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "Not available";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Not available";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
};

export function normalizeSellerReview(raw: unknown): Seller2026Review {
  const review = object(raw);
  const product = object(review.product);
  const reviewer = object(review.user ?? review.reviewer ?? review.customer);
  const reviewerName = text(
    reviewer.name ?? review.reviewerName ?? review.customerName,
    "Customer"
  );
  const reviewStatus = status(review.status ?? review.reviewStatus);
  const rating = Math.max(0, Math.min(5, number(review.rating)));
  const createdAt = text(review.createdAt ?? review.created_at) || null;

  return {
    id: text(review.id ?? review.reviewId),
    productId: text(review.productId ?? review.product_id ?? product.id),
    productSlug: text(product.slug ?? review.productSlug),
    productName: text(product.name ?? review.productName, "Product"),
    productSku: text(product.sku ?? review.productSku, "No SKU"),
    productPrice: number(product.price ?? review.productPrice),
    productImageUrl: safeImageUrl(
      product.imageUrl ?? product.image ?? product.promoImagePath ?? review.productImageUrl
    ),
    reviewerName,
    reviewerInitials: initials(reviewerName),
    verifiedBuyer: Boolean(review.verifiedBuyer ?? review.isVerifiedBuyer ?? true),
    rating,
    ratingLabel: `${rating} out of 5 stars`,
    comment: text(review.comment ?? review.review),
    images: list(review.images)
      .map(safeImageUrl)
      .filter(Boolean)
      .slice(0, 4),
    status: reviewStatus,
    statusLabel: statusLabel(reviewStatus),
    isPublished: reviewStatus === "published",
    isPending: reviewStatus === "pending",
    isHidden: reviewStatus === "hidden",
    reply: text(review.sellerReply ?? review.reply),
    repliedAt: text(review.repliedAt ?? review.replied_at) || null,
    helpfulCount: Math.max(0, number(review.helpfulCount ?? review.helpful_count)),
    notHelpfulCount: Math.max(0, number(review.notHelpfulCount ?? review.not_helpful_count)),
    createdAt,
    createdAtLabel: dateLabel(createdAt),
    reportedAt: text(review.reportedAt ?? review.reported_at) || null,
    reportReason: text(review.reportReason ?? review.report_reason),
    isReported: Boolean(review.isReported ?? review.reportedAt ?? review.reported_at),
    raw: review,
  };
}

export function buildSellerReviewsViewModel(payload: unknown): Seller2026ReviewsViewModel {
  const root = object(payload);
  const data = object(root.data);
  const source = Object.keys(data).length ? data : root;
  const stats = object(source.stats);
  const items = list(source.items ?? source.reviews).map(normalizeSellerReview);
  const page = Math.max(1, number(source.page ?? object(source.meta).page, 1));
  const limit = Math.max(1, number(source.limit ?? object(source.meta).limit, 10));
  const total = Math.max(0, number(source.total ?? object(source.meta).totalItems, items.length));
  const totalPages = Math.max(1, number(source.totalPages ?? object(source.meta).totalPages, Math.ceil(total / limit)));

  return {
    items,
    stats: {
      totalReviews: Math.max(0, number(stats.totalReviews, total)),
      averageRating: Math.max(0, Math.min(5, number(stats.averageRating))),
      pendingReplies: Math.max(0, number(stats.pendingReplies)),
      responseRate: Math.max(0, Math.min(100, number(stats.responseRate))),
      published: Math.max(0, number(stats.published)),
      pending: Math.max(0, number(stats.pending)),
      hidden: Math.max(0, number(stats.hidden)),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages,
      from: total ? (page - 1) * limit + 1 : 0,
      to: Math.min(page * limit, total),
    },
  };
}
