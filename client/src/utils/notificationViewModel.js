export const NOTIFICATION_FILTERS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "account", label: "Account" },
  { key: "promotions", label: "Promotions" },
];

const TEXT_FALLBACKS = new Set(["", "undefined", "null", "nan"]);

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return TEXT_FALLBACKS.has(normalized.toLowerCase()) ? fallback : normalized;
};

const toObject = (value) => {
  if (!value) return {};
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return typeof value === "object" && !Array.isArray(value) ? value : {};
};

const toPositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const maybeArray = (value) => (Array.isArray(value) ? value : null);

const unwrapData = (payload) => {
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return payload.data ?? payload;
  }
  return payload;
};

export const unwrapNotifications = (payload) => {
  const first = unwrapData(payload);
  const second = unwrapData(first);
  const source = second && typeof second === "object" && !Array.isArray(second) ? second : {};
  const items =
    maybeArray(second) ||
    maybeArray(source.items) ||
    maybeArray(source.notifications) ||
    maybeArray(source.rows) ||
    maybeArray(source.results) ||
    [];
  const meta = source.meta || source.pagination || source.pageInfo || {};
  const unreadCount = Number(source.unreadCount ?? source.unread_count ?? source.count ?? 0);

  return {
    items,
    unreadCount: Number.isFinite(unreadCount) ? unreadCount : 0,
    meta: toObject(meta),
  };
};

export const inferNotificationKind = (notification) => {
  const item = toObject(notification);
  const meta = toObject(item.meta);
  const type = toText(item.kind || item.type || meta.type).toUpperCase();
  const haystack = [
    type,
    item.title,
    item.message,
    item.description,
    meta.message,
    meta.actionCode,
    meta.status,
    meta.statusTo,
  ]
    .map((value) => toText(value).toLowerCase())
    .join(" ");

  if (type.includes("PROMO") || type.includes("COUPON") || haystack.includes("offer")) {
    return "promotion";
  }
  if (type.includes("INVIT") || haystack.includes("invitation")) {
    return "invitation";
  }
  if (type.includes("PAYMENT") || haystack.includes("payment")) {
    return "payment";
  }
  if (type.includes("STATUS") || type.includes("SHIP") || haystack.includes("status")) {
    return "status";
  }
  if (type.includes("ORDER") || toPositiveNumber(meta.orderId || item.orderId)) {
    return "order";
  }
  if (
    type.includes("ACCOUNT") ||
    type.includes("PASSWORD") ||
    haystack.includes("password") ||
    haystack.includes("profile")
  ) {
    return "account";
  }
  return "account";
};

export const getNotificationMeta = (kind) => {
  const normalized = toText(kind, "account").toLowerCase();
  const metaByKind = {
    order: { label: "Order placed", tone: "order" },
    status: { label: "Status update", tone: "status" },
    payment: { label: "Payment received", tone: "payment" },
    invitation: { label: "Invitation", tone: "invitation" },
    account: { label: "Account", tone: "account" },
    promotion: { label: "Promotion", tone: "promotion" },
  };
  return metaByKind[normalized] || metaByKind.account;
};

export const formatNotificationTime = (input, options = {}) => {
  const date = new Date(input || "");
  if (Number.isNaN(date.getTime())) return "-";

  const now = options.now instanceof Date ? options.now : new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dayDiff = Math.round((startOfToday - startOfDate) / 86_400_000);
  const timeLabel = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (dayDiff === 0) return timeLabel;
  if (dayDiff === 1) return `Yesterday ${timeLabel}`;

  return new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

export const resolveNotificationAction = (notification) => {
  const item = toObject(notification);
  const kind = toText(item.kind, inferNotificationKind(item));
  const orderId = toPositiveNumber(item.orderId || item.meta?.orderId || item.raw?.meta?.orderId);

  if (["order", "status", "payment"].includes(kind) && orderId) {
    return `/user/my-orders/${encodeURIComponent(String(orderId))}`;
  }
  if (kind === "invitation") return "/user/store-invitations";
  if (kind === "promotion") return "/offers";
  return null;
};

export const normalizeNotification = (notification) => {
  const item = toObject(notification);
  const backendMeta = toObject(item.meta);
  const id = toPositiveNumber(item.id || item.notificationId || item._id);
  const kind = inferNotificationKind(item);
  const presentation = getNotificationMeta(kind);
  const orderId = toPositiveNumber(item.orderId || backendMeta.orderId);
  const orderRef = toText(
    item.orderRef ||
      item.invoiceNo ||
      item.invoice ||
      item.ref ||
      backendMeta.orderRef ||
      backendMeta.invoiceNo ||
      backendMeta.invoice ||
      backendMeta.ref
  );
  const title =
    toText(item.title) ||
    (orderRef ? `Order ${orderRef}` : presentation.label || "Notification");
  const description =
    toText(item.description || item.message || item.body || backendMeta.description || backendMeta.message) ||
    (kind === "order"
      ? "Your order has been successfully placed."
      : "We have an update for you.");
  const createdAt =
    item.createdAt || item.created_at || item.timestamp || item.date || backendMeta.createdAt || null;
  const normalized = {
    id,
    title,
    description,
    kind,
    meta: backendMeta,
    isRead: Boolean(item.isRead ?? item.read ?? item.is_read),
    createdAt,
    timeLabel: formatNotificationTime(createdAt),
    orderId,
    orderRef,
    actionUrl: null,
    label: presentation.label,
    tone: presentation.tone,
    raw: item,
  };

  normalized.actionUrl = resolveNotificationAction(normalized);
  return normalized;
};

export const filterNotification = (notification, filter = "all") => {
  const key = toText(filter, "all").toLowerCase();
  if (key === "all") return true;
  const kind = toText(notification?.kind, inferNotificationKind(notification));
  if (key === "orders") return ["order", "status", "payment"].includes(kind);
  if (key === "account") return ["account", "invitation"].includes(kind);
  if (key === "promotions") return kind === "promotion";
  return true;
};
