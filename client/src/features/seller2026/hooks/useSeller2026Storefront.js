import { useQuery } from "@tanstack/react-query";
import { getSellerWorkspaceReadiness } from "../../../api/sellerWorkspace.ts";
import { getSellerStoreProfile } from "../../../api/sellerStoreProfile.ts";
import { adaptSeller2026Storefront } from "../adapters/seller2026StorefrontAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Storefront() {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId, sellerContext } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "storefront", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [profile, readiness] = await Promise.all([
        getSellerStoreProfile(storeId),
        getSellerWorkspaceReadiness(storeId),
      ]);
      return adaptSeller2026Storefront({ sellerContext, profile, readiness });
    },
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => !data?.store) };
}
