import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  clearAllUserNotifications,
  deleteUserNotification,
  fetchUserNotifications,
  fetchUserUnreadNotificationCount,
  markAllUserNotificationsRead,
  markUserNotificationAsRead,
} from "../../api/userNotifications.ts";
import AccountNotifications2026View from "./notifications2026/AccountNotifications2026View.jsx";
import {
  buildNotificationsViewModel,
  unwrapNotifications,
} from "./notifications2026/accountNotifications2026Adapter.js";
import { useTranslation } from "react-i18next";

const PAGE_SIZE = 20;

const invalidateNotifications = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["account", "notifications"] });
  queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
};

export default function AccountNotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useOutletContext() || {};
  const [activeFilter, setActiveFilter] = useState("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id";

  const notificationsQuery = useQuery({
    queryKey: ["account", "notifications", { limit: PAGE_SIZE, offset: 0 }],
    queryFn: () => fetchUserNotifications({ limit: PAGE_SIZE, offset: 0 }),
    staleTime: 20_000,
    retry: 1,
  });

  const unreadQuery = useQuery({
    queryKey: ["account", "notifications", "unread-count"],
    queryFn: fetchUserUnreadNotificationCount,
    staleTime: 20_000,
    retry: 1,
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => markUserNotificationAsRead(id),
    onSuccess: () => invalidateNotifications(queryClient),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllUserNotificationsRead,
    onSuccess: () => invalidateNotifications(queryClient),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteUserNotification(id),
    onSuccess: () => invalidateNotifications(queryClient),
  });

  const clearAllMutation = useMutation({
    mutationFn: clearAllUserNotifications,
    onSuccess: () => invalidateNotifications(queryClient),
  });

  const payload = useMemo(
    () => unwrapNotifications(notificationsQuery.data),
    [notificationsQuery.data]
  );
  const viewModel = useMemo(
    () =>
      buildNotificationsViewModel({
        notifications: payload.items,
        activeFilter,
        unreadCount: unreadQuery.data ?? payload.unreadCount,
        isIndo,
      }),
    [activeFilter, payload.items, payload.unreadCount, unreadQuery.data, isIndo]
  );
  const visibleNotifications = useMemo(
    () =>
      unreadOnly
        ? viewModel.notifications.filter((item) => item.isUnread)
        : viewModel.notifications,
    [unreadOnly, viewModel.notifications]
  );

  const mutationError =
    markReadMutation.error ||
    markAllReadMutation.error ||
    deleteMutation.error ||
    clearAllMutation.error;

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
  };

  const handleClearFilters = () => {
    setActiveFilter("all");
    setUnreadOnly(false);
  };

  const handleMarkAllRead = () => {
    if (markAllReadMutation.isPending || Number(viewModel.unreadCount || 0) <= 0) return;
    markAllReadMutation.mutate();
  };

  const handleMarkNotificationRead = (item) => {
    if (!item?.id || !item.isUnread || markReadMutation.isPending) return;
    markReadMutation.mutate(item.id);
  };

  const handleDeleteNotification = (item) => {
    if (!item?.id || deleteMutation.isPending) return;
    deleteMutation.mutate(item.id);
  };

  const handleClearNotifications = () => {
    if (clearAllMutation.isPending || viewModel.allNotifications.length === 0) return;
    clearAllMutation.mutate();
  };

  const handleOpenNotification = async (item) => {
    if (!item) return;
    try {
      if (item.id && item.isUnread) {
        await markReadMutation.mutateAsync(item.id);
      }
    } catch {
      // Keep navigation usable even if read state update fails.
    } finally {
      navigate(item.route || item.actionUrl || "/user/notifications");
    }
  };

  return (
    <AccountNotifications2026View
      user={user}
      notifications={visibleNotifications}
      unreadCount={viewModel.unreadCount}
      counts={viewModel.counts}
      activeFilter={viewModel.activeFilter}
      filtersActive={unreadOnly}
      loading={notificationsQuery.isLoading}
      error={notificationsQuery.isError ? notificationsQuery.error : null}
      mutationError={mutationError}
      busyNotificationId={markReadMutation.variables}
      deletingNotificationId={deleteMutation.variables}
      isMarkingAllRead={markAllReadMutation.isPending}
      isClearingAll={clearAllMutation.isPending}
      onFilterChange={handleFilterChange}
      onMarkAllRead={handleMarkAllRead}
      onClearFilters={handleClearFilters}
      onOpenFilters={() => setUnreadOnly((current) => !current)}
      onOpenNotification={handleOpenNotification}
      onMarkNotificationRead={handleMarkNotificationRead}
      onDeleteNotification={handleDeleteNotification}
      onClearNotifications={handleClearNotifications}
      onRefresh={() => notificationsQuery.refetch()}
    />
  );
}
