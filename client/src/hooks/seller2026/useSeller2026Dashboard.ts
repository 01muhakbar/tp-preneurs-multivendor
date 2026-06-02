import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSellerAnalyticsSummary,
  getSellerFinanceSummary,
  getSellerWorkspaceReadiness,
} from "../../api/sellerWorkspace.ts";
import { getSellerSuborders } from "../../api/sellerOrders.ts";
import { adaptSeller2026DashboardFromSummaries } from "../../api/seller2026/dashboard.adapter.ts";

type UseSeller2026DashboardOptions = {
  enabled?: boolean;
  sellerContext?: unknown;
  canViewOrders?: boolean;
};

const RECENT_SUBORDERS_LIMIT = 8;

export function useSeller2026Dashboard(
  storeId: number | string | null | undefined,
  options: UseSeller2026DashboardOptions = {}
) {
  const enabled = Boolean(storeId) && options.enabled !== false;
  const canViewOrders = options.canViewOrders !== false;

  const financeSummaryQuery = useQuery({
    queryKey: ["seller2026", "dashboard", "finance-summary", storeId],
    queryFn: () => getSellerFinanceSummary(storeId as number | string),
    enabled,
    retry: false,
  });

  const readinessQuery = useQuery({
    queryKey: ["seller2026", "dashboard", "readiness", storeId],
    queryFn: () => getSellerWorkspaceReadiness(storeId as number | string),
    enabled,
    retry: false,
  });

  const analyticsQuery = useQuery({
    queryKey: ["seller2026", "dashboard", "analytics-summary", storeId],
    queryFn: () => getSellerAnalyticsSummary(storeId as number | string),
    enabled,
    retry: false,
  });

  const subordersQuery = useQuery({
    queryKey: ["seller2026", "dashboard", "recent-suborders", storeId],
    queryFn: () =>
      getSellerSuborders(storeId as number | string, {
        page: 1,
        limit: RECENT_SUBORDERS_LIMIT,
      }),
    enabled: enabled && canViewOrders,
    retry: false,
  });

  const data = useMemo(
    () =>
      adaptSeller2026DashboardFromSummaries({
        sellerContext: options.sellerContext,
        financeSummary: financeSummaryQuery.data,
        readiness: readinessQuery.data,
        analytics: analyticsQuery.data,
        suborders: subordersQuery.data,
      }),
    [
      analyticsQuery.data,
      financeSummaryQuery.data,
      options.sellerContext,
      readinessQuery.data,
      subordersQuery.data,
    ]
  );

  const isLoading =
    financeSummaryQuery.isLoading ||
    readinessQuery.isLoading ||
    analyticsQuery.isLoading ||
    (canViewOrders && subordersQuery.isLoading);
  const isError =
    financeSummaryQuery.isError ||
    readinessQuery.isError ||
    analyticsQuery.isError ||
    (canViewOrders && subordersQuery.isError);

  return {
    data,
    isLoading,
    isError,
    error:
      financeSummaryQuery.error ||
      readinessQuery.error ||
      analyticsQuery.error ||
      subordersQuery.error,
    refetch: () => {
      void financeSummaryQuery.refetch();
      void readinessQuery.refetch();
      void analyticsQuery.refetch();
      if (canViewOrders) void subordersQuery.refetch();
    },
  };
}
