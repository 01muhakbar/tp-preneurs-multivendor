export type Seller2026NotificationCategory =
  | "orders"
  | "inventory"
  | "payments"
  | "team"
  | "system"
  | "other";
export type Seller2026NotificationPriority = "critical" | "important" | "info" | "low";
export type Seller2026NotificationReadStatus = "read" | "unread";

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
    storeId: number | null;
    title: string;
    message: string;
    type: string;
    severity: Seller2026NotificationPriority;
    status: Seller2026NotificationReadStatus;
    isRead: boolean;
    readAt: string | null;
    category: Seller2026NotificationCategory;
    priority: Seller2026NotificationPriority;
    createdAt: string;
    targetType: string | null;
    targetId: string | number | null;
    targetUrl: string | null;
    actionLabel: string | null;
    canonicalHref: string | null;
    metadata: Record<string, unknown>;
    unread: boolean;
  }>;
};

type AdaptSeller2026NotificationsOptions = {
  storeSlug?: string | null;
};

const text = (value: unknown, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? (value as Record<string, unknown>) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const number = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const canonicalBase = (storeSlug: unknown) => {
  const normalized = text(storeSlug);
  return normalized ? `/seller/stores/${encodeURIComponent(normalized)}` : "";
};

const positiveId = (value: unknown): string | null => {
  const normalized = text(value);
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? normalized : null;
};

const safeCanonicalPath = (candidate: unknown, storeSlug: unknown) => {
  const value = text(candidate);
  const base = canonicalBase(storeSlug);
  if (!value || !base) return null;
  if (!value.startsWith(base)) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("//")) return null;
  if (value.includes("/seller-2026")) return null;
  return value;
};

const inferTargetType = (notification: Record<string, unknown>, meta: Record<string, unknown>) => {
  const source = text(
    notification.targetType ||
      meta.targetType ||
      meta.target ||
      meta.actionCode ||
      notification.type
  ).toLowerCase();

  if (source.includes("product_review") || source.includes("product_edit")) return "product_edit";
  if (source.includes("product") || source.includes("catalog") || source.includes("stock")) return "product";
  if (source.includes("suborder") || source.includes("order")) return "order";
  if (source.includes("payment_profile")) return "payment_profile";
  if (source.includes("payment")) return "payment_review";
  if (source.includes("coupon") || source.includes("promo")) return "coupon";
  if (source.includes("team_audit") || source.includes("audit")) return "team_audit";
  if (source.includes("member") || source.includes("team")) return "team_member";
  if (source.includes("store_profile") || source.includes("storefront")) return "store_profile";
  if (source.includes("dashboard") || source.includes("workspace")) return "dashboard";
  return null;
};

const resolveTargetId = (
  targetType: string | null,
  notification: Record<string, unknown>,
  meta: Record<string, unknown>
) => {
  if (targetType === "product" || targetType === "product_edit") {
    return positiveId(notification.targetId || meta.productId || meta.targetId);
  }
  if (targetType === "order") {
    return positiveId(notification.targetId || meta.suborderId || meta.orderId || meta.targetId);
  }
  if (targetType === "team_member") {
    return positiveId(notification.targetId || meta.memberId || meta.userId || meta.targetId);
  }
  return positiveId(notification.targetId || meta.targetId);
};

export function resolveSeller2026NotificationHref({
  notification,
  meta,
  storeSlug,
}: {
  notification: Record<string, unknown>;
  meta: Record<string, unknown>;
  storeSlug?: string | null;
}) {
  const directRoute = safeCanonicalPath(notification.targetUrl || meta.targetUrl || meta.route, storeSlug);
  if (directRoute) return directRoute;

  const base = canonicalBase(storeSlug);
  if (!base) return null;

  const targetType = inferTargetType(notification, meta);
  const targetId = resolveTargetId(targetType, notification, meta);
  switch (targetType) {
    case "product":
      return targetId ? `${base}/catalog/products/${encodeURIComponent(targetId)}` : null;
    case "product_edit":
      return targetId ? `${base}/catalog/products/${encodeURIComponent(targetId)}/edit` : null;
    case "order":
      return targetId ? `${base}/orders/${encodeURIComponent(targetId)}` : null;
    case "payment_review":
      return `${base}/payment-review`;
    case "payment_profile":
      return `${base}/payment-profile`;
    case "coupon":
      return `${base}/catalog/coupons`;
    case "team_member":
      return targetId ? `${base}/team/${encodeURIComponent(targetId)}` : null;
    case "team_audit":
      return `${base}/team/audit`;
    case "store_profile":
      return `${base}/store-profile`;
    case "dashboard":
      return `${base}/dashboard`;
    default:
      return null;
  }
}

const formatNotificationCreatedAt = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "Recently";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleString("en-SG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const normalizeType = (value: unknown) => text(value, "general").toLowerCase().replace(/[^a-z0-9_:-]+/g, "_");

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

export function adaptSeller2026Notifications(
  value: unknown,
  options: AdaptSeller2026NotificationsOptions = {}
): Seller2026NotificationsViewModel {
  const response = object(value);
  const data = object(response.data);
  const source = Object.keys(data).length ? data : response;
  const rawItems = Array.isArray(source.items) ? source.items : Array.isArray(source) ? source : [];

  const notifications = array(rawItems).map((entry) => {
    const notification = object(entry);
    const meta = object(notification.metadata || notification.meta);
    const category = normalizeNotificationCategory(
      notification.category || notification.type || meta.category || meta.actionCode
    );
    const priority = normalizeNotificationPriority(
      notification.priority || notification.severity || meta.priority || meta.severity
    );
    const type = normalizeType(notification.type || meta.type);
    const targetType = inferTargetType(notification, meta);
    const targetId = resolveTargetId(targetType, notification, meta);
    const canonicalHref = resolveSeller2026NotificationHref({
      notification,
      meta,
      storeSlug: options.storeSlug,
    });
    const isRead = Boolean(
      notification.readAt || notification.isRead === true || notification.read === true
    );
    const status: Seller2026NotificationReadStatus = isRead ? "read" : "unread";
    return {
      id: (notification.id ?? notification.notificationId ?? notification.title ?? "notification") as string | number,
      storeId: number(notification.storeId || meta.storeId, 0) || null,
      title: text(notification.title || meta.title, "Notification"),
      message: text(notification.message || notification.body || meta.message || meta.description, "No details available."),
      type,
      severity: priority,
      status,
      isRead,
      readAt: (notification.readAt || null) as string | null,
      category,
      priority,
      createdAt: formatNotificationCreatedAt(notification.createdAt || notification.updatedAt),
      targetType,
      targetId,
      targetUrl: text(notification.targetUrl || meta.targetUrl || meta.route) || null,
      actionLabel: canonicalHref ? text(notification.actionLabel || meta.actionLabel, "Open") : null,
      canonicalHref,
      metadata: meta,
      unread: !isRead,
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
