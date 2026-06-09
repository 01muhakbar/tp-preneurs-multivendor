import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";

export function useSeller2026LiveRoute() {
  const route = useSellerWorkspaceRoute();
  const storeId = route.workspaceStoreId;
  const storeSlug = route.workspaceStoreSlug || route.routeStoreSlug;

  return {
    ...route,
    storeId,
    storeSlug,
    workspaceRoutes: route.workspaceRoutes,
  };
}

export function toSeller2026HookState(query, selectEmpty) {
  const data = query.data;
  const isEmpty =
    typeof selectEmpty === "function"
      ? selectEmpty(data)
      : Array.isArray(data)
        ? data.length === 0
        : !data;

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isEmpty: !query.isLoading && !query.isError && isEmpty,
    refetch: query.refetch,
    query,
  };
}
