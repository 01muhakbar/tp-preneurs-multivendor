import {
  markAllSellerNotificationsRead,
  markSellerNotificationRead,
} from "../sellerNotifications.ts";
import { runSeller2026Mutation } from "./mutations.ts";

export async function markSeller2026NotificationRead({
  storeId,
  notificationId,
}: {
  storeId: number;
  notificationId: number;
}) {
  return runSeller2026Mutation(() => markSellerNotificationRead(storeId, notificationId));
}

export async function markAllSeller2026NotificationsRead({ storeId }: { storeId: number }) {
  return runSeller2026Mutation(() => markAllSellerNotificationsRead(storeId));
}
