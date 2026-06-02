const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export function adaptSellerNotification(value: unknown) {
  const notification = object(value);
  const meta = object(notification.meta);
  return {
    id: notification?.id ?? null,
    title: text(notification?.title || notification?.message, "Notification"),
    message: text(notification?.message || notification?.body),
    category: text(notification?.category || notification?.type, "Seller"),
    priority: text(notification?.priority || notification?.severity, "Low"),
    read: Boolean(notification?.readAt || notification?.isRead),
    route: text(meta.route),
    createdAt: notification?.createdAt || null,
  };
}

export function adaptSellerNotificationList(value: unknown) {
  const response = object(value);
  const data = object(response.data);
  const items = Array.isArray(response?.items)
    ? response.items
    : Array.isArray(data.items)
      ? data.items
      : [];
  return {
    items: items.map(adaptSellerNotification),
    unreadCount: Number(response.unreadCount ?? data.unreadCount ?? 0),
  };
}
