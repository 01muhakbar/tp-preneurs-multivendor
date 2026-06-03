import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSeller2026ProductDraft,
  updateSeller2026ProductDraft,
} from "../../api/seller2026/products.mutations.ts";
import type { Seller2026ProductDraftPayload } from "../../api/seller2026/products.mutations.ts";

type SaveProductDraftMode = "create" | "edit";

export function useSeller2026SaveProductDraft({
  storeId,
  productId,
  mode,
  enabled = true,
  onSuccess,
}: {
  storeId: string | number | null | undefined;
  productId?: string | number | null | undefined;
  mode: SaveProductDraftMode;
  enabled?: boolean;
  onSuccess?: (product: unknown) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Seller2026ProductDraftPayload) => {
      if (!enabled) {
        throw new Error("Product draft save is not enabled for this session.");
      }
      if (!storeId) {
        throw new Error("Store context is not ready yet.");
      }
      if (mode === "edit") {
        if (!productId) {
          throw new Error("Product context is not ready yet.");
        }
        return updateSeller2026ProductDraft({ storeId, productId, payload });
      }
      return createSeller2026ProductDraft({ storeId, payload });
    },
    onSuccess: (product) => {
      void queryClient.invalidateQueries({ queryKey: ["seller2026", "products"] });
      if (storeId) {
        void queryClient.invalidateQueries({ queryKey: ["seller2026", "products", storeId] });
      }
      if (storeId && productId) {
        void queryClient.invalidateQueries({
          queryKey: ["seller2026", "product-detail", storeId, productId],
        });
      }
      onSuccess?.(product);
    },
  });
}
