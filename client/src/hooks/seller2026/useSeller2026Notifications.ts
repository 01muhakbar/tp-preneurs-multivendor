import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSellerNotifications } from "../../api/sellerNotifications.ts";
import {
  adaptSeller2026Notifications,
  emptySeller2026Notifications,
  type Seller2026NotificationsViewModel,
} from "../../api/seller2026/notifications.adapter.ts";

export type Seller2026NotificationsQuery = {
  search?: string;
  priority?: string;
  category?: string;
  unread?: string;
  page?: number;
  limit?: number;
};

type UseSeller2026NotificationsOptions = {
  enabled?: boolean;
};

const filterNotifications = (
  data: Seller2026NotificationsViewModel,
  query: Seller2026NotificationsQuery
): Seller2026NotificationsViewModel => {
  const search = String(query.search || "").trim().toLowerCase();
  const priority = String(query.priority || "all");
  const category = String(query.category || "all");
  const unread = String(query.unread || "all");
  const notifications = data.notifications.filter((notification) => {
    const haystack = `${notification.title} ${notification.message}`.toLowerCase();
    const searchMatches = !search || haystack.includes(search);
    const priorityMatches = priority === "all" || notification.priority === priority;
    const categoryMatches = category === "all" || notification.category === category;
    const unreadMatches =
      unread === "all" ||
      (unread === "true" && notification.unread) ||
      (unread === "false" && !notification.unread);
    return searchMatches && priorityMatches && categoryMatches && unreadMatches;
  });

  return {
    ...data,
    notifications,
  };
};

export function useSeller2026Notifications(
  storeId: number | string | null | undefined,
  query: Seller2026NotificationsQuery = {},
  options: UseSeller2026NotificationsOptions = {}
) {
  const normalizedStoreId = Number(storeId);
  const enabled = Number.isFinite(normalizedStoreId) && normalizedStoreId > 0 && options.enabled !== false;
  const notificationsQuery = useQuery({
    queryKey: ["seller2026", "notifications", normalizedStoreId, query.page, query.limit],
    queryFn: () =>
      getSellerNotifications(normalizedStoreId, {
        page: Number(query.page || 1),
        limit: Number(query.limit || 10),
      }),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    if (!enabled && !notificationsQuery.data) return emptySeller2026Notifications;
    return filterNotifications(adaptSeller2026Notifications(notificationsQuery.data), query);
  }, [enabled, notificationsQuery.data, query]);

  return {
    data,
    isLoading: notificationsQuery.isLoading,
    isError: notificationsQuery.isError,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
  };
}
