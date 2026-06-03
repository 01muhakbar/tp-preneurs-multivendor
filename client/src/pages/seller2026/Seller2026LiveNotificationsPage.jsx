import { useSearchParams } from "react-router-dom";
import Seller2026Workspace from "../../features/seller2026/Seller2026Workspace.jsx";
import { SELLER_2026_MUTATIONS } from "../../api/seller2026/mutation-flags.ts";
import { canUseSeller2026Action } from "../../api/seller2026/permissions.ts";
import { useSeller2026NotificationMutations } from "../../hooks/seller2026/useSeller2026NotificationMutations.ts";
import { useSeller2026Notifications } from "../../hooks/seller2026/useSeller2026Notifications.ts";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const applySearchParams = (currentParams, setSearchParams) => (nextQuery) => {
  const next = new URLSearchParams(currentParams);
  Object.entries(nextQuery).forEach(([key, value]) => {
    const paramKey = key === "search" ? "q" : key;
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "all" ||
      (paramKey === "page" && Number(value) <= 1) ||
      (paramKey === "limit" && Number(value) === 10)
    ) {
      next.delete(paramKey);
    } else {
      next.set(paramKey, String(value));
    }
  });
  setSearchParams(next);
};

export default function Seller2026LiveNotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can, permissions } = getSeller2026PagePermissions(sellerContext);
  const canView = can("NOTIFICATION_READ");
  const query = {
    search: searchParams.get("q") || "",
    priority: searchParams.get("priority") || "all",
    category: searchParams.get("category") || "all",
    unread: searchParams.get("unread") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };
  const notificationsQuery = useSeller2026Notifications(storeId, query, { enabled: canView });
  const canMutateNotifications = canUseSeller2026Action(
    {
      permissions,
      permission: "NOTIFICATION_READ",
      mutationEnabled: SELLER_2026_MUTATIONS.notifications,
    }
  );
  const notificationMutations = useSeller2026NotificationMutations(storeId, {
    enabled: canView && canMutateNotifications && SELLER_2026_MUTATIONS.notifications,
  });

  return (
    <Seller2026Workspace
      section="team"
      mode="embedded"
      storeContext={sellerContext}
      teamView="notifications"
      teamData={notificationsQuery.data}
      teamState={{
        isLoading: notificationsQuery.isLoading,
        isError: notificationsQuery.isError,
        error: notificationsQuery.error,
        refetch: notificationsQuery.refetch,
      }}
      teamQuery={query}
      onTeamQueryChange={applySearchParams(searchParams, setSearchParams)}
      notificationMutation={{
        canMutate: canMutateNotifications,
        isMarkingRead: notificationMutations.isMarkingRead,
        isMarkingAllRead: notificationMutations.isMarkingAllRead,
        error: notificationMutations.error,
        markRead: notificationMutations.markRead,
        markAllRead: notificationMutations.markAllRead,
        reset: notificationMutations.reset,
      }}
    />
  );
}
