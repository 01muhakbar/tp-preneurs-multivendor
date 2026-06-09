import { useQuery } from "@tanstack/react-query";
import { fetchSellerWorkspace2026Analytics } from "../adapters/sellerWorkspace2026AnalyticsAdapter.js";

export function useSellerWorkspace2026Analytics(storeId, options = {}) {
  const enabled = Boolean(storeId) && options.enabled !== false;

  return useQuery({
    queryKey: ["seller2026", "analytics", "summary", storeId],
    queryFn: () => fetchSellerWorkspace2026Analytics(storeId),
    enabled,
    retry: false,
  });
}
