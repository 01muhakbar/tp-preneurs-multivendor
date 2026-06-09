import { useQuery } from "@tanstack/react-query";
import { getSellerCategories } from "../../../api/sellerCategories.ts";
import { adaptSeller2026Categories } from "../adapters/seller2026TaxonomyAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Categories(params = {}) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "categories", storeId, params],
    enabled: Boolean(storeId),
    queryFn: async () => adaptSeller2026Categories(await getSellerCategories(storeId, params)),
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => (data?.categories || []).length === 0) };
}
