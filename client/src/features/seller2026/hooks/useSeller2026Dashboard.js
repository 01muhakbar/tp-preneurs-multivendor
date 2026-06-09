import { useQuery } from "@tanstack/react-query";
import {
  getSellerAnalyticsSummary,
  getSellerFinanceSummary,
  getSellerWorkspaceReadiness,
} from "../../../api/sellerWorkspace.ts";
import { getSellerNotifications, getSellerNotificationUnreadCount } from "../../../api/sellerNotifications.ts";
import { getSellerProducts } from "../../../api/sellerProducts.ts";
import { getSellerSuborders } from "../../../api/sellerOrders.ts";
import { adaptSeller2026DashboardFromSummaries } from "../adapters/seller2026DashboardAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Dashboard() {
  const liveRoute = useSeller2026LiveRoute();
  const { storeId, sellerContext } = liveRoute;
  const query = useQuery({
    queryKey: ["seller2026", "dashboard", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [readiness, financeSummary, analytics, products, suborders, notifications, unread] =
        await Promise.all([
          getSellerWorkspaceReadiness(storeId),
          getSellerFinanceSummary(storeId),
          getSellerAnalyticsSummary(storeId),
          getSellerProducts(storeId, { limit: 5 }),
          getSellerSuborders(storeId, { limit: 6 }),
          getSellerNotifications(storeId, { limit: 6 }),
          getSellerNotificationUnreadCount(storeId),
        ]);

      return {
        ...adaptSeller2026DashboardFromSummaries({
          sellerContext,
          financeSummary,
          readiness,
          analytics,
          suborders,
        }),
        products,
        notifications,
        notificationsUnread: unread?.count ?? 0,
      };
    },
  });

  return { ...liveRoute, ...toSeller2026HookState(query, (data) => !data) };
}
