import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSellerNotificationUnreadCount,
  getSellerNotifications,
} from "../../api/sellerNotifications.ts";
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
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const notificationsQuery = useQuery({
    queryKey: ["seller2026", "notifications", normalizedStoreId, page, limit],
    queryFn: () =>
      getSellerNotifications(normalizedStoreId, {
        limit,
        offset: Math.max(0, page - 1) * limit,
      }),
    enabled,
    retry: false,
  });
  const unreadCountQuery = useQuery({
    queryKey: ["seller2026", "notifications", normalizedStoreId, "unread-count"],
    queryFn: () => getSellerNotificationUnreadCount(normalizedStoreId),
    enabled,
    retry: false,
  });

  const data = useMemo(() => {
    if (!enabled && !notificationsQuery.data) return emptySeller2026Notifications;
    const source = notificationsQuery.data || emptySeller2026Notifications;
    return filterNotifications(
      adaptSeller2026Notifications({
        ...source,
        unreadCount: unreadCountQuery.data?.count ?? notificationsQuery.data?.unreadCount,
      }),
      query
    );
  }, [enabled, notificationsQuery.data, query, unreadCountQuery.data]);

  return {
    data,
    isLoading: notificationsQuery.isLoading || unreadCountQuery.isLoading,
    isError: notificationsQuery.isError || unreadCountQuery.isError,
    error: notificationsQuery.error || unreadCountQuery.error,
    refetch: async () => {
      const [notificationsResult] = await Promise.all([
        notificationsQuery.refetch(),
        unreadCountQuery.refetch(),
      ]);
      return notificationsResult;
    },
  };
}
