import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { useSeller2026Dashboard } from "../../hooks/seller2026/useSeller2026Dashboard.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";

export default function Seller2026LiveDashboardPage() {
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const permissionKeys = sellerContext?.access?.permissionKeys || [];
  const hasPermission = (permission) => permissionKeys.includes(permission);
  const canViewStore = hasPermission("STORE_VIEW");
  const canViewOrders = hasPermission("ORDER_VIEW");
  const dashboardQuery = useSeller2026Dashboard(storeId, {
    enabled: canViewStore,
    sellerContext,
    canViewOrders,
  });

  return (
    <Seller2026Workspace
      section="dashboard"
      mode="embedded"
      storeContext={sellerContext}
      dashboardData={dashboardQuery.data}
      dashboardState={{
        isLoading: dashboardQuery.isLoading,
        isError: dashboardQuery.isError,
        error: dashboardQuery.error,
        refetch: dashboardQuery.refetch,
      }}
    />
  );
}
