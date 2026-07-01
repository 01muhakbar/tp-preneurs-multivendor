import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchSellerReviewDetail,
  fetchSellerReviews,
  replyToSellerReview,
  reportSellerReview,
  updateSellerReviewStatus,
  type SellerReviewReplyPayload,
  type SellerReviewReportPayload,
  type SellerReviewsQuery,
  type SellerReviewStatusPayload,
} from "../../api/sellerReviews.ts";
import {
  buildSellerReviewsViewModel,
  normalizeSellerReview,
} from "../../api/seller2026/reviews.adapter.ts";

export const sellerReviewsKeys = {
  all: (storeId: number | string | null | undefined) =>
    ["seller2026", "reviews", storeId] as const,
  list: (storeId: number | string | null | undefined, query: SellerReviewsQuery) =>
    [...sellerReviewsKeys.all(storeId), "list", query] as const,
  detail: (storeId: number | string | null | undefined, reviewId: number | string | null) =>
    [...sellerReviewsKeys.all(storeId), "detail", reviewId] as const,
};

export function useSeller2026Reviews(
  storeId: number | string | null | undefined,
  query: SellerReviewsQuery
) {
  return useQuery({
    queryKey: sellerReviewsKeys.list(storeId, query),
    queryFn: async () => buildSellerReviewsViewModel(await fetchSellerReviews(storeId!, query)),
    enabled: Boolean(storeId),
    retry: false,
  });
}

export function useSeller2026ReviewDetail(
  storeId: number | string | null | undefined,
  reviewId: number | string | null
) {
  return useQuery({
    queryKey: sellerReviewsKeys.detail(storeId, reviewId),
    queryFn: async () => normalizeSellerReview(await fetchSellerReviewDetail(storeId!, reviewId!)),
    enabled: Boolean(storeId && reviewId),
    retry: false,
  });
}

export function useSeller2026ReviewMutations(
  storeId: number | string | null | undefined
) {
  const queryClient = useQueryClient();
  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: sellerReviewsKeys.all(storeId) }),
      queryClient.invalidateQueries({ queryKey: ["storefront", "product"] }),
      queryClient.invalidateQueries({ queryKey: ["storefront", "products"] }),
      queryClient.invalidateQueries({ queryKey: ["account", "reviews"] }),
    ]);
  };

  const replyMutation = useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number | string; payload: SellerReviewReplyPayload }) =>
      replyToSellerReview(storeId!, reviewId, payload),
    onSuccess: invalidate,
  });
  const statusMutation = useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number | string; payload: SellerReviewStatusPayload }) =>
      updateSellerReviewStatus(storeId!, reviewId, payload),
    onSuccess: invalidate,
  });
  const reportMutation = useMutation({
    mutationFn: ({ reviewId, payload }: { reviewId: number | string; payload: SellerReviewReportPayload }) =>
      reportSellerReview(storeId!, reviewId, payload),
    onSuccess: invalidate,
  });

  return {
    replyMutation,
    statusMutation,
    reportMutation,
    isMutating:
      replyMutation.isPending || statusMutation.isPending || reportMutation.isPending,
  };
}
