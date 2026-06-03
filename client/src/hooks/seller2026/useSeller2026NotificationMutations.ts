import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markAllSeller2026NotificationsRead,
  markSeller2026NotificationRead,
} from "../../api/seller2026/notifications.mutations.ts";

type UseSeller2026NotificationMutationsOptions = {
  enabled?: boolean;
};

export function useSeller2026NotificationMutations(
  storeId: number | string | null | undefined,
  options: UseSeller2026NotificationMutationsOptions = {}
) {
  const queryClient = useQueryClient();
  const normalizedStoreId = Number(storeId);
  const enabled =
    Number.isFinite(normalizedStoreId) && normalizedStoreId > 0 && options.enabled !== false;

  const invalidateNotifications = () => {
    void queryClient.invalidateQueries({ queryKey: ["seller2026", "notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["seller", "notifications"] });
    void queryClient.invalidateQueries({ queryKey: ["sellerNotifications"] });
  };

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: number | string) => {
      if (!enabled) throw new Error("Notification mutation is not enabled for this session.");
      const parsedNotificationId = Number(notificationId);
      if (!Number.isInteger(parsedNotificationId) || parsedNotificationId <= 0) {
        throw new Error("Notification id is not valid.");
      }
      const result = await markSeller2026NotificationRead({
        storeId: normalizedStoreId,
        notificationId: parsedNotificationId,
      });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateNotifications,
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!enabled) throw new Error("Notification mutation is not enabled for this session.");
      const result = await markAllSeller2026NotificationsRead({ storeId: normalizedStoreId });
      if (!result.ok) throw result.error;
      return result.data;
    },
    onSuccess: invalidateNotifications,
  });

  return {
    canMutate: enabled,
    markRead: markReadMutation.mutateAsync,
    markAllRead: markAllReadMutation.mutateAsync,
    isMarkingRead: markReadMutation.isPending,
    isMarkingAllRead: markAllReadMutation.isPending,
    error: markReadMutation.error || markAllReadMutation.error,
    reset: () => {
      markReadMutation.reset();
      markAllReadMutation.reset();
    },
  };
}
