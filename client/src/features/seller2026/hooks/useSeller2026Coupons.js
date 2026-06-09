import { useQuery } from "@tanstack/react-query";
import { listSellerCoupons } from "../../../api/sellerCoupons.ts";
import { adaptSeller2026Coupons } from "../adapters/seller2026TaxonomyAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Coupons() {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "coupons", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => adaptSeller2026Coupons(await listSellerCoupons(storeId)),
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => (data?.coupons || []).length === 0) };
}
