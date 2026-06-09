import { useQuery } from "@tanstack/react-query";
import { getSellerProductAuthoringMeta, getSellerProducts } from "../../../api/sellerProducts.ts";
import { adaptSeller2026Products } from "../adapters/seller2026ProductsAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Products(params = {}) {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "products", storeId, params],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [products, authoringMeta] = await Promise.all([
        getSellerProducts(storeId, params),
        getSellerProductAuthoringMeta(storeId),
      ]);
      return adaptSeller2026Products(products, authoringMeta, params);
    },
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => (data?.products || []).length === 0) };
}
