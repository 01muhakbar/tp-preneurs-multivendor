import { api } from "./axios";

export type SellerReviewsQuery = {
  status?: "all" | "pending" | "published" | "hidden";
  search?: string;
  sort?: "newest" | "oldest" | "rating_high" | "rating_low";
  productId?: number | string;
  rating?: number | string;
  page?: number;
  limit?: number;
};

export type SellerReviewReplyPayload = { reply: string };
export type SellerReviewStatusPayload = {
  status: "published" | "hidden";
  reason?: string;
};
export type SellerReviewReportPayload = { reason: string };

const path = (storeId: number | string, suffix = "") =>
  `/seller/stores/${encodeURIComponent(String(storeId))}/reviews${suffix}`;

const unwrap = (payload: unknown): unknown => {
  if (!payload || typeof payload !== "object") return payload;
  const record = payload as Record<string, unknown>;
  return record.data ?? payload;
};

export async function fetchSellerReviews(
  storeId: number | string,
  query: SellerReviewsQuery = {}
) {
  const { data } = await api.get(path(storeId), { params: query });
  return unwrap(data);
}

export async function fetchSellerReviewDetail(
  storeId: number | string,
  reviewId: number | string
) {
  const { data } = await api.get(path(storeId, `/${encodeURIComponent(String(reviewId))}`));
  return unwrap(data);
}

export async function replyToSellerReview(
  storeId: number | string,
  reviewId: number | string,
  payload: SellerReviewReplyPayload
) {
  const { data } = await api.patch(
    path(storeId, `/${encodeURIComponent(String(reviewId))}/reply`),
    payload
  );
  return unwrap(data);
}

export async function updateSellerReviewStatus(
  storeId: number | string,
  reviewId: number | string,
  payload: SellerReviewStatusPayload
) {
  const { data } = await api.patch(
    path(storeId, `/${encodeURIComponent(String(reviewId))}/status`),
    payload
  );
  return unwrap(data);
}

export async function reportSellerReview(
  storeId: number | string,
  reviewId: number | string,
  payload: SellerReviewReportPayload
) {
  const { data } = await api.post(
    path(storeId, `/${encodeURIComponent(String(reviewId))}/report`),
    payload
  );
  return unwrap(data);
}
