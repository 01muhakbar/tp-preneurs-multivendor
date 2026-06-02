export type Seller2026NotificationCategory =
  | "orders"
  | "inventory"
  | "payments"
  | "team"
  | "system"
  | "other";
export type Seller2026NotificationPriority = "critical" | "important" | "info" | "low";

export type Seller2026NotificationsViewModel = {
  summary: {
    all: number;
    unread: number;
    critical: number;
    important: number;
    info: number;
  };
  categories: Array<{
    key: string;
    label: string;
    count: number;
  }>;
  notifications: Array<{
    id: string | number;
    title: string;
    message: string;
    category: Seller2026NotificationCategory;
    priority: Seller2026NotificationPriority;
    createdAt: string | null;
    unread: boolean;
  }>;
};

const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const emptySeller2026Notifications: Seller2026NotificationsViewModel = {
  summary: {
    all: 0,
    unread: 0,
    critical: 0,
    important: 0,
    info: 0,
  },
  categories: [
    { key: "all", label: "All", count: 0 },
    { key: "orders", label: "Orders", count: 0 },
    { key: "inventory", label: "Stock & Inventory", count: 0 },
    { key: "payments", label: "Payments", count: 0 },
    { key: "team", label: "Team & Access", count: 0 },
    { key: "system", label: "System & Updates", count: 0 },
  ],
  notifications: [],
};

export function normalizeNotificationPriority(
  priority: unknown
): Seller2026NotificationPriority {
  const value = String(priority || "").toLowerCase();

  if (value.includes("critical") || value.includes("urgent")) return "critical";
  if (value.includes("important") || value.includes("high")) return "important";
  if (value.includes("low")) return "low";

  return "info";
}

function normalizeNotificationCategory(value: unknown): Seller2026NotificationCategory {
  const normalized = String(value || "").toLowerCase();

  if (normalized.includes("order") || normalized.includes("suborder")) return "orders";
  if (normalized.includes("stock") || normalized.includes("inventory") || normalized.includes("catalog")) return "inventory";
  if (normalized.includes("payment") || normalized.includes("payout")) return "payments";
  if (normalized.includes("team") || normalized.includes("member") || normalized.includes("invite") || normalized.includes("role")) return "team";
  if (normalized.includes("system") || normalized.includes("update") || normalized.includes("workspace")) return "system";

  return "other";
}

const categoryLabels: Record<string, string> = {
  all: "All",
  orders: "Orders",
  inventory: "Stock & Inventory",
  payments: "Payments",
  team: "Team & Access",
  system: "System & Updates",
  other: "Other",
};

export function adaptSeller2026Notifications(value: unknown): Seller2026NotificationsViewModel {
  const response = object(value);
  const data = object(response.data);
  const source = Object.keys(data).length ? data : response;
  const rawItems = Array.isArray(source.items) ? source.items : Array.isArray(source) ? source : [];

  const notifications = array(rawItems).map((entry) => {
    const notification = object(entry);
    const meta = object(notification.meta);
    const category = normalizeNotificationCategory(
      notification.category || notification.type || meta.category || meta.actionCode
    );
    const priority = normalizeNotificationPriority(
      notification.priority || notification.severity || meta.priority || meta.severity
    );
    return {
      id: (notification.id ?? notification.notificationId ?? notification.title ?? "notification") as string | number,
      title: text(notification.title || meta.title, "Notification"),
      message: text(notification.message || notification.body || meta.message || meta.description),
      category,
      priority,
      createdAt: (notification.createdAt || notification.updatedAt || null) as string | null,
      unread: !(notification.readAt || notification.isRead === true || notification.read === true),
    };
  });

  const counts = notifications.reduce<Record<string, number>>(
    (accumulator, notification) => {
      accumulator[notification.category] = number(accumulator[notification.category]) + 1;
      return accumulator;
    },
    {}
  );
  const unread = number(source.unreadCount, notifications.filter((item) => item.unread).length);
  const critical = notifications.filter((item) => item.priority === "critical").length;
  const important = notifications.filter((item) => item.priority === "important").length;
  const info = notifications.filter((item) => item.priority === "info").length;

  return {
    summary: {
      all: notifications.length,
      unread,
      critical,
      important,
      info,
    },
    categories: ["all", "orders", "inventory", "payments", "team", "system", "other"].map((key) => ({
      key,
      label: categoryLabels[key] || key,
      count: key === "all" ? notifications.length : number(counts[key]),
    })),
    notifications,
  };
}

export function adaptSellerNotification(value: unknown) {
  const notification = object(value);
  const meta = object(notification.meta);
  return {
    id: notification.id ?? null,
    title: text(notification.title || notification.message, "Notification"),
    message: text(notification.message || notification.body || meta.message),
    category: text(notification.category || notification.type, "Seller"),
    priority: text(notification.priority || notification.severity, "Low"),
    read: Boolean(notification.readAt || notification.isRead),
    route: text(meta.route),
    createdAt: notification.createdAt || null,
  };
}

export function adaptSellerNotificationList(value: unknown) {
  const response = object(value);
  const data = object(response.data);
  const items = Array.isArray(response.items)
    ? response.items
    : Array.isArray(data.items)
      ? data.items
      : [];
  return {
    items: items.map(adaptSellerNotification),
    unreadCount: Number(response.unreadCount ?? data.unreadCount ?? 0),
  };
}
