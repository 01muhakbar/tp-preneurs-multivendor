import { useQuery } from "@tanstack/react-query";
import { getSellerPaymentReviewSuborders } from "../../../api/sellerPayments.ts";
import { getSellerPaymentProfile } from "../../../api/sellerPaymentProfile.ts";
import {
  adaptSeller2026PaymentProfile,
  adaptSeller2026PaymentReview,
} from "../adapters/seller2026PaymentsAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Payments(params = {}) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "payments", storeId, params],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [review, profile] = await Promise.all([
        getSellerPaymentReviewSuborders(storeId, params),
        getSellerPaymentProfile(storeId),
      ]);
      return {
        review: adaptSeller2026PaymentReview(review),
        profile: adaptSeller2026PaymentProfile(profile),
      };
    },
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => !data?.review && !data?.profile) };
}
