import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSellerNotifications,
  getSellerNotificationUnreadCount,
  markAllSellerNotificationsRead,
  markSellerNotificationRead,
} from "../../../api/sellerNotifications.ts";
import { adaptSeller2026Notifications } from "../adapters/seller2026NotificationsAdapter.js";
import { toSeller2026HookState, useSeller2026LiveRoute } from "./useSeller2026LiveRoute.js";

export function useSeller2026Notifications(params = {}) {
  const queryClient = useQueryClient();
  const liveRoute = useSeller2026LiveRoute();
  const { storeId } = liveRoute;
  const queryKey = ["seller2026", "notifications", storeId, params];
  const query = useQuery({
    queryKey,
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [notifications, unread] = await Promise.all([
        getSellerNotifications(storeId, params),
        getSellerNotificationUnreadCount(storeId),
      ]);
      return {
        ...adaptSeller2026Notifications(notifications),
        unreadCount: unread?.count ?? 0,
      };
    },
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["seller2026", "notifications", storeId] });
  const markReadMutation = useMutation({
    mutationFn: (notificationId) => markSellerNotificationRead(storeId, notificationId),
    onSuccess: invalidate,
  });
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllSellerNotificationsRead(storeId),
    onSuccess: invalidate,
  });

  return {
    ...liveRoute,
    ...toSeller2026HookState(query, (data) => (data?.notifications || []).length === 0),
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
  };
}
