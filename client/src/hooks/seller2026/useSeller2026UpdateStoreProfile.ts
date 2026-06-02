import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateSeller2026StoreProfile,
} from "../../api/seller2026/storefront.mutations.ts";
import type { Seller2026StoreProfileUpdatePayload } from "../../api/seller2026/storefront.mutations.ts";

export function useSeller2026UpdateStoreProfile({
  storeId,
  enabled = true,
  onSuccess,
}: {
  storeId: string | number | null | undefined;
  enabled?: boolean;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Seller2026StoreProfileUpdatePayload) => {
      if (!enabled) {
        throw new Error("Store profile update is not enabled for this session.");
      }
      if (!storeId) {
        throw new Error("Store context is not ready yet.");
      }
      return updateSeller2026StoreProfile({ storeId, payload });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["seller2026", "storefront"] });
      if (storeId) {
        void queryClient.invalidateQueries({ queryKey: ["seller2026", "storefront", "profile", storeId] });
        void queryClient.invalidateQueries({ queryKey: ["seller2026", "storefront", "readiness", storeId] });
      }
      onSuccess?.();
    },
  });
}
