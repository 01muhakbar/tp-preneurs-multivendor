import { useQuery } from "@tanstack/react-query";
import { getSellerSuborderDetail, getSellerSuborders } from "../../../api/sellerOrders.ts";
import {
  adaptSeller2026Orders,
  adaptSeller2026SuborderDetail,
} from "../adapters/seller2026OrdersAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Orders(params = {}) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "orders", storeId, params],
    enabled: Boolean(storeId),
    queryFn: async () => adaptSeller2026Orders(await getSellerSuborders(storeId, params)),
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => (data?.orders || []).length === 0) };
}

export function useSeller2026SuborderDetail(suborderId) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "suborder", storeId, suborderId],
    enabled: Boolean(storeId && suborderId),
    queryFn: async () => adaptSeller2026SuborderDetail(await getSellerSuborderDetail(storeId, suborderId)),
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => !data?.suborder) };
}
