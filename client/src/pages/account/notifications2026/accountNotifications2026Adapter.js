export const NOTIFICATION_FILTERS = [
  { key: "all", label: "All" },
  { key: "orders", label: "Orders" },
  { key: "account", label: "Account" },
  { key: "promotions", label: "Promotions" },
];

const EMPTY_TEXT = new Set(["", "undefined", "null", "nan"]);
const BUYER_SAFE_PREFIXES = [
  "/user/",
  "/offers",
  "/shop",
  "/search",
  "/wishlist",
  "/contact-us",
  "/order/",
  "/product/",
  "/store/",
];

const toText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return EMPTY_TEXT.has(text.toLowerCase()) ? fallback : text;
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

const asArray = (value) => (Array.isArray(value) ? value : null);

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toPositiveId = (value) => {
  const parsed = toNumber(value, 0);
  return parsed > 0 ? parsed : 0;
};

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
    asArray(second) ||
    asArray(source.items) ||
    asArray(source.notifications) ||
    asArray(source.rows) ||
    asArray(source.results) ||
    [];
  const meta = toObject(source.meta || source.pagination || source.pageInfo);
  const unreadCount = toNumber(source.unreadCount ?? source.unread_count ?? source.count, 0);

  return { items, meta, unreadCount };
};

const isSafeBuyerPath = (value) => {
  const path = toText(value);
  if (!path || !path.startsWith("/") || path.startsWith("//")) return false;
  if (/^\/(?:admin|seller|seller-2026|seller-2026-preview)(?:\/|$)/i.test(path)) return false;
  if (/^\/https?:/i.test(path)) return false;
  return BUYER_SAFE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
};

const firstSafePath = (...values) => values.find((value) => isSafeBuyerPath(value)) || "";

const getNotificationMeta = (notification) => {
  const item = toObject(notification);
  return toObject(item.meta || item.metadata || item.payload || item.data);
};

const getOrderId = (item, meta) =>
  toPositiveId(
    item.orderId ||
      item.order_id ||
      item.order?.id ||
      meta.orderId ||
      meta.order_id ||
      meta.order?.id ||
      meta.orderID
  );

const getHaystack = (item, meta) =>
  [
    item.kind,
    item.type,
    item.category,
    item.actionCode,
    item.title,
    item.message,
    item.description,
    item.body,
    meta.kind,
    meta.type,
    meta.category,
    meta.actionCode,
    meta.title,
    meta.message,
    meta.status,
    meta.statusTo,
  ]
    .map((value) => toText(value).toLowerCase())
    .join(" ");

export const detectNotificationKind = (notification) => {
  const item = toObject(notification);
  const meta = getNotificationMeta(item);
  const haystack = getHaystack(item, meta);

  if (/\b(promo|promotion|coupon|offer|deal|discount)\b/.test(haystack)) return "promotion";
  if (/\b(invitation|invite|store invitation|member)\b/.test(haystack)) return "invitation";
  if (/\b(payment|paid|qris|invoice|proof)\b/.test(haystack)) return "payment";
  if (/\b(account|profile|password|address|security)\b/.test(haystack)) return "account";
  if (/\b(order|shipment|shipping|shipped|delivered|tracking|package|fulfill)\b/.test(haystack)) {
    return "order";
  }
  if (getOrderId(item, meta)) return "order";
  return "general";
};

const isDeliveredUpdate = (item, meta) => /\b(delivered|delivery complete)\b/.test(getHaystack(item, meta));

const resolveUnread = (item, meta) => {
  const explicitUnread = item.unread ?? item.isUnread ?? item.is_unread ?? meta.unread ?? meta.isUnread;
  if (explicitUnread === true) return true;
  if (explicitUnread === false) return false;

  const readValue = item.isRead ?? item.read ?? item.is_read ?? meta.isRead ?? meta.read;
  if (readValue === true) return false;
  if (readValue === false) return true;

  if (Object.prototype.hasOwnProperty.call(item, "readAt") && item.readAt === null) return true;
  if (Object.prototype.hasOwnProperty.call(item, "read_at") && item.read_at === null) return true;
  if (Object.prototype.hasOwnProperty.call(meta, "readAt") && meta.readAt === null) return true;
  if (item.readAt || item.read_at || meta.readAt || meta.read_at) return false;
  return false;
};

export const formatNotificationTimestamp = (input) => {
  const date = new Date(input || "");
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((today - day) / 86_400_000);
  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  if (diff === 0) return time;
  if (diff === 1) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const resolveRoute = (item, meta, kind, orderId) => {
  const provided = firstSafePath(
    item.route,
    item.actionUrl,
    item.action_url,
    item.url,
    meta.route,
    meta.actionUrl,
    meta.action_url,
    meta.url
  );
  if (provided) return provided;
  if ((kind === "order" || kind === "payment") && orderId) {
    return `/user/my-orders/${encodeURIComponent(String(orderId))}`;
  }
  if (kind === "invitation") return "/user/store-invitations";
  if (kind === "promotion") return "/offers";
  if (kind === "account") return "/user/my-account";
  return "/user/notifications";
};

const getPresentation = (kind, item, meta) => {
  const delivered = isDeliveredUpdate(item, meta);
  if (delivered) {
    return {
      chip: "Delivered",
      tone: "success",
      iconTone: "success",
      iconName: "package",
      actionLabel: "View order",
    };
  }

  const map = {
    order: {
      chip: "Order Update",
      tone: "blue",
      iconTone: "blue",
      iconName: "truck",
      actionLabel: "View order",
    },
    payment: {
      chip: "Payment Done",
      tone: "success",
      iconTone: "success",
      iconName: "card",
      actionLabel: "View order",
    },
    invitation: {
      chip: "Account",
      tone: "purple",
      iconTone: "purple",
      iconName: "mail",
      actionLabel: "Open",
    },
    promotion: {
      chip: "Promotion",
      tone: "orange",
      iconTone: "orange",
      iconName: "tag",
      actionLabel: "View deals",
    },
    account: {
      chip: "Account Update",
      tone: "blue",
      iconTone: "blue",
      iconName: "user",
      actionLabel: "Open",
    },
    general: {
      chip: "Update",
      tone: "blue",
      iconTone: "blue",
      iconName: "bell",
      actionLabel: "Open",
    },
  };

  return map[kind] || map.general;
};

const getStatusCopy = (kind, item, meta) => {
  const haystack = getHaystack(item, meta);
  if (/\b(delivered|delivery complete)\b/.test(haystack)) {
    return {
      title: "Order delivered",
      message: "Your order has been delivered.",
    };
  }
  if (/\b(shipped|shipping|on the way|tracking)\b/.test(haystack)) {
    return {
      title: "Order shipped",
      message: "Your order is on the way.",
    };
  }
  if (/\b(packed|ready to ship|ready_to_ship)\b/.test(haystack)) {
    return {
      title: "Order packed",
      message: "Packed and ready.",
    };
  }
  if (/\b(payment|paid|approved|confirmed|qris|proof)\b/.test(haystack) || kind === "payment") {
    return {
      title: "Payment confirmed",
      message: "We've received your payment.",
    };
  }
  if (kind === "invitation") {
    return {
      title: "Store invitation received",
      message: "You have a new store invitation.",
    };
  }
  if (kind === "promotion") {
    return {
      title: "Promotion update",
      message: "A new offer is available.",
    };
  }
  if (kind === "account") {
    return {
      title: "Account updated",
      message: "Your account information was updated.",
    };
  }
  if (kind === "order") {
    return {
      title: "Order update",
      message: "Your order status changed.",
    };
  }
  return {
    title: "Notification update",
    message: "You have a new update.",
  };
};

const isGenericMessage = (value) => {
  const text = toText(value).toLowerCase();
  return !text || text === "you have a new update." || text === "we have an update for you.";
};

export const normalizeNotification = (notification) => {
  const item = toObject(notification);
  const meta = getNotificationMeta(item);
  const kind = detectNotificationKind(item);
  const orderId = getOrderId(item, meta);
  const orderCode = toText(
    item.orderCode ||
      item.orderRef ||
      item.invoiceNo ||
      item.invoice ||
      item.ref ||
      meta.orderCode ||
      meta.orderRef ||
      meta.invoiceNo ||
      meta.invoice ||
      meta.ref
  );
  const presentation = getPresentation(kind, item, meta);
  const statusCopy = getStatusCopy(kind, item, meta);
  const providedTitle = toText(item.title || meta.title);
  const providedMessage = toText(
    item.message || item.description || item.body || meta.message || meta.description
  );
  const title =
    ["order", "payment"].includes(kind) || !providedTitle ? statusCopy.title : providedTitle;
  const message = isGenericMessage(providedMessage) ? statusCopy.message : providedMessage;
  const createdAt =
    item.createdAt ||
    item.created_at ||
    item.timestamp ||
    item.date ||
    item.updatedAt ||
    meta.createdAt ||
    meta.timestamp ||
    null;
  const isUnread = resolveUnread(item, meta);

  return {
    id: toPositiveId(item.id || item.notificationId || item.notification_id || item._id),
    rawId: item.id || item.notificationId || item.notification_id || item._id || null,
    kind,
    title,
    message,
    description: message,
    chip: toText(item.label || item.chip || meta.label || meta.chip, presentation.chip),
    label: toText(item.label || item.chip || meta.label || meta.chip, presentation.chip),
    tone: presentation.tone,
    iconTone: presentation.iconTone,
    iconName: presentation.iconName,
    actionLabel: presentation.actionLabel,
    isUnread,
    isRead: !isUnread,
    createdAt,
    timeLabel: formatNotificationTimestamp(createdAt),
    route: resolveRoute(item, meta, kind, orderId),
    actionUrl: resolveRoute(item, meta, kind, orderId),
    orderId,
    orderCode,
    meta,
    raw: item,
  };
};

const matchesFilter = (notification, filter) => {
  if (filter === "orders") return ["order", "payment"].includes(notification.kind);
  if (filter === "account") return ["account", "invitation", "general"].includes(notification.kind);
  if (filter === "promotions") return notification.kind === "promotion";
  return true;
};

export const buildNotificationsViewModel = ({
  notifications = [],
  activeFilter = "all",
  unreadCount,
} = {}) => {
  const filterKey = NOTIFICATION_FILTERS.some((item) => item.key === activeFilter)
    ? activeFilter
    : "all";
  const allNotifications = notifications
    .map(normalizeNotification)
    .filter((item) => item.id > 0 || item.rawId);
  const counts = allNotifications.reduce(
    (acc, item) => {
      acc.all += 1;
      if (["order", "payment"].includes(item.kind)) acc.orders += 1;
      else if (item.kind === "promotion") acc.promotions += 1;
      else acc.account += 1;
      return acc;
    },
    { all: 0, orders: 0, account: 0, promotions: 0 }
  );
  const computedUnread = allNotifications.filter((item) => item.isUnread).length;
  const normalizedUnread = toNumber(unreadCount, Number.NaN);

  return {
    notifications: allNotifications.filter((item) => matchesFilter(item, filterKey)),
    allNotifications,
    activeFilter: filterKey,
    counts,
    unreadCount: Number.isFinite(normalizedUnread) ? normalizedUnread : computedUnread,
  };
};
