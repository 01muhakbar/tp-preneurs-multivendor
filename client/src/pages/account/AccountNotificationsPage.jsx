import { useEffect, useMemo, useState } from "react";
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

const FETCH_LIMIT = 100;
const PAGE_SIZE = 10;

const isIndonesianLanguage = (i18nInstance) => {
  if (i18nInstance?.language?.toLowerCase().startsWith("id")) return true;
  if (typeof window !== "undefined") {
    const storeLang = (localStorage.getItem("store_language") || "").toLowerCase();
    if (storeLang === "indonesia" || storeLang.startsWith("id")) return true;
    const i18nLng = (localStorage.getItem("i18nextLng") || "").toLowerCase();
    if (i18nLng.startsWith("id")) return true;
    const appLang = (localStorage.getItem("app_lang") || "").toLowerCase();
    if (appLang === "indonesia" || appLang.startsWith("id")) return true;
  }
  return false;
};

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
  const [page, setPage] = useState(1);

  const { i18n } = useTranslation();
  const [activeLang, setActiveLang] = useState(
    typeof window !== "undefined"
      ? (localStorage.getItem("store_language") === "Indonesia" ? "id" : i18n?.language || "en")
      : "en"
  );

  useEffect(() => {
    const handleSync = (lng) => setActiveLang(lng);
    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) setActiveLang(e.detail.isoCode);
    };
    const handleStorage = () => {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia") setActiveLang("id");
      else if (stored === "English") setActiveLang("en");
      else setActiveLang(i18n?.language || "en");
    };

    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", handleStorage);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", handleStorage);
    };
  }, [i18n]);

  const isIndo = useMemo(
    () => isIndonesianLanguage({ language: activeLang }),
    [activeLang]
  );

  const notificationsQuery = useQuery({
    queryKey: ["account", "notifications", { limit: FETCH_LIMIT, offset: 0 }],
    queryFn: () => fetchUserNotifications({ limit: FETCH_LIMIT, offset: 0 }),
    staleTime: 15_000,
    retry: 1,
  });

  const unreadQuery = useQuery({
    queryKey: ["account", "notifications", "unread-count"],
    queryFn: fetchUserUnreadNotificationCount,
    staleTime: 15_000,
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

  const allVisibleNotifications = useMemo(
    () =>
      unreadOnly
        ? viewModel.notifications.filter((item) => item.isUnread)
        : viewModel.notifications,
    [unreadOnly, viewModel.notifications]
  );

  const totalFilteredCount = allVisibleNotifications.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const pagedNotifications = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return allVisibleNotifications.slice(startIndex, startIndex + PAGE_SIZE);
  }, [allVisibleNotifications, currentPage]);

  const mutationError =
    markReadMutation.error ||
    markAllReadMutation.error ||
    deleteMutation.error ||
    clearAllMutation.error;

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilter("all");
    setUnreadOnly(false);
    setPage(1);
  };

  const handleToggleUnreadOnly = () => {
    setUnreadOnly((current) => !current);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    const target = Math.min(Math.max(1, newPage), totalPages);
    setPage(target);
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
      notifications={pagedNotifications}
      allNotificationsCount={viewModel.allNotifications.length}
      unreadCount={viewModel.unreadCount}
      counts={viewModel.counts}
      activeFilter={viewModel.activeFilter}
      filtersActive={unreadOnly}
      page={currentPage}
      totalPages={totalPages}
      totalFilteredCount={totalFilteredCount}
      pageSize={PAGE_SIZE}
      isIndo={isIndo}
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
      onOpenFilters={handleToggleUnreadOnly}
      onPageChange={handlePageChange}
      onOpenNotification={handleOpenNotification}
      onMarkNotificationRead={handleMarkNotificationRead}
      onDeleteNotification={handleDeleteNotification}
      onClearNotifications={handleClearNotifications}
      onRefresh={() => {
        notificationsQuery.refetch();
        unreadQuery.refetch();
      }}
    />
  );
}
