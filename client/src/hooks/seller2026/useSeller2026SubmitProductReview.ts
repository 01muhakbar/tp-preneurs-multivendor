import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitSeller2026ProductReview } from "../../api/seller2026/products.mutations.ts";

export function useSeller2026SubmitProductReview({
  storeId,
  enabled = true,
}: {
  storeId: string | number | null | undefined;
  enabled?: boolean;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ productId }: { productId: string | number }) => {
      if (!enabled) {
        throw new Error("Product submit review is not enabled for this session.");
      }
      if (!storeId) {
        throw new Error("Store context is not ready yet.");
      }
      if (!productId) {
        throw new Error("Product context is not ready yet.");
      }

      const result = await submitSeller2026ProductReview({ storeId, productId });
      if (!result.ok) {
        throw new Error(result.error.message);
      }
      return result.data;
    },
    onSuccess: (_product, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["seller2026", "products"] });
      if (storeId) {
        void queryClient.invalidateQueries({ queryKey: ["seller2026", "products", storeId] });
        void queryClient.invalidateQueries({
          queryKey: ["seller2026", "product-detail", storeId, variables.productId],
        });
      }
    },
  });

  return {
    canSubmitReview: Boolean(enabled && storeId),
    isSubmittingReview: mutation.isPending,
    submittingReviewProductId: mutation.variables?.productId ?? null,
    error: mutation.error,
    submitReview: mutation.mutateAsync,
  };
}
