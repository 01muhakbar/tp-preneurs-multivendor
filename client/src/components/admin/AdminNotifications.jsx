import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Trash2,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  CheckCheck,
  ArrowRight,
} from "lucide-react";
import {
  clearAllAdminNotifications,
  deleteAdminNotification,
  fetchAdminNotificationPreferences,
  fetchAdminNotifications,
  fetchAdminUnreadCount,
  markAllAdminNotificationsRead,
  markAdminNotificationRead,
  updateAdminNotificationPreferences,
} from "../../api/adminNotifications.ts";

const MONTH_LABELS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_LABELS_ID = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const idrCurrencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const formatMoney = (val) => {
  const num = Number(val);
  if (!Number.isFinite(num) || num <= 0) return "";
  return idrCurrencyFormatter.format(num);
};

export const formatNotificationTimestamp = (input, isIndo = false) => {
  const date = new Date(input || "");
  if (Number.isNaN(date.getTime())) return "-";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return isIndo ? "Baru saja" : "Just now";
  if (diffMinutes < 60) return isIndo ? `${diffMinutes} mnt lalu` : `${diffMinutes}m ago`;
  if (diffHours < 24) return isIndo ? `${diffHours} jam lalu` : `${diffHours}h ago`;
  if (diffDays === 1) return isIndo ? "Kemarin" : "Yesterday";
  if (diffDays < 7) return isIndo ? `${diffDays} hari lalu` : `${diffDays}d ago`;

  const months = isIndo ? MONTH_LABELS_ID : MONTH_LABELS_EN;
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()] || "";
  const year = date.getFullYear();
  const hour24 = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, "0");

  if (isIndo) {
    return `${day} ${month} ${year}, ${String(hour24).padStart(2, "0")}:${minute}`;
  }
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  return `${day} ${month}, ${year} ${hour12}:${minute} ${period}`;
};

export const formatNotificationContent = (item, isIndo = false) => {
  if (!item || typeof item !== "object") {
    return {
      title: isIndo ? "Notifikasi Sistem" : "System Notification",
      subtitle: "",
      badge: isIndo ? "Umum" : "General",
      typeKey: "general",
    };
  }

  const type = String(item.type || "").trim().toUpperCase();
  const rawTitle = String(item.title || "").trim();
  const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
  const customerName = String(meta.customerName || meta.customer || "").trim();
  const rawAmount = meta.amount ? formatMoney(meta.amount) : "";
  const invoiceNo = String(meta.invoiceNo || meta.ref || "").trim();
  const orderId = String(meta.orderId || meta.id || "").trim();
  const orderRef = invoiceNo ? `#${invoiceNo}` : (orderId ? `#${orderId}` : "");

  if (type === "ORDER_CREATED" || type === "NEW_ORDER") {
    let name = customerName;
    if (!name && rawTitle) {
      const match = rawTitle.match(/^(.*?)\s+placed an order/i);
      if (match && match[1]) name = match[1].trim();
    }
    const amountStr = rawAmount || (rawTitle.match(/Rp\s*[\d.]+/i)?.[0] || "");
    const titleText = isIndo
      ? (name ? `Pesanan Baru: ${name}` : "Pesanan Baru Masuk")
      : (name ? `New Order: ${name}` : "New Order Received");

    const subtitleText = [amountStr, orderRef].filter(Boolean).join(" • ");

    return {
      title: titleText,
      subtitle: subtitleText || (isIndo ? "Pesanan perlu diproses" : "Order needs fulfillment"),
      badge: isIndo ? "Pesanan Baru" : "New Order",
      typeKey: "order",
    };
  }

  if (type === "PAYMENT_SETTLED") {
    const amountStr = rawAmount || (rawTitle.match(/Rp\s*[\d.]+/i)?.[0] || "");
    const titleText = isIndo ? "Pembayaran Duitku Berhasil" : "Duitku Payment Received";
    const subtitleText = [amountStr, orderRef, isIndo ? "Terverifikasi" : "Verified"].filter(Boolean).join(" • ");

    return {
      title: titleText,
      subtitle: subtitleText || (isIndo ? "Transaksi otomatis terkonfirmasi" : "Transaction automatically confirmed"),
      badge: isIndo ? "Pembayaran Duitku" : "Duitku Payment",
      typeKey: "payment",
    };
  }

  if (type === "CONTACT_MESSAGE") {
    return {
      title: isIndo ? "Pesan Kontak Pelanggan" : "Customer Support Message",
      subtitle: String(meta.subject || rawTitle || (isIndo ? "Pesan bantuan masuk" : "New helpdesk inquiry")).replace(/!+$/, ""),
      badge: isIndo ? "Pesan" : "Message",
      typeKey: "contact",
    };
  }

  if (type === "ORDER_STATUS_CHANGED" || type === "ORDER_STATUS_UPDATED") {
    return {
      title: isIndo ? "Status Pesanan Diperbarui" : "Order Status Updated",
      subtitle: orderRef ? `${orderRef} • ${isIndo ? "Status diperbarui" : "Status changed"}` : rawTitle.replace(/!+$/, ""),
      badge: isIndo ? "Status" : "Status",
      typeKey: "status",
    };
  }

  const cleaned = rawTitle.replace(/!+$/, "");
  return {
    title: cleaned || (isIndo ? "Notifikasi Admin" : "Admin Notification"),
    subtitle: orderRef || "",
    badge: isIndo ? "Notifikasi" : "Notification",
    typeKey: "general",
  };
};

const PAGE_LIMIT = 5;
const NOTIFICATION_STREAM_CONNECT_DELAY_MS = 4000;
const NOTIFICATION_TYPE_OPTIONS = [
  { value: "ORDER_CREATED", label: "Order Created" },
  { value: "PAYMENT_SETTLED", label: "Payment Settled (Duitku)" },
  { value: "ORDER_STATUS_CHANGED", label: "Order Status Changed" },
  { value: "ORDER_STATUS_UPDATED", label: "Order Status Updated" },
  { value: "CONTACT_MESSAGE", label: "Contact Message" },
];
const DEFAULT_ENABLED_TYPES = NOTIFICATION_TYPE_OPTIONS.map((item) => item.value);

const normalizeEnabledTypes = (value) => {
  if (!Array.isArray(value)) return [];
  const unique = new Set();
  value.forEach((entry) => {
    const normalized = String(entry || "").trim().toUpperCase();
    if (!normalized) return;
    unique.add(normalized);
  });
  return Array.from(unique);
};

const toMetaString = (value) => {
  const normalized = String(value ?? "").trim();
  const lowered = normalized.toLowerCase();
  if (!normalized || lowered === "undefined" || lowered === "null") return "";
  return normalized;
};

const buildNotificationTargetUrl = (item) => {
  if (!item || typeof item !== "object") return null;
  const type = String(item.type || "").trim().toUpperCase();
  const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
  const invoiceNo = toMetaString(meta.invoiceNo || meta.invoice || meta.ref);
  const orderId = toMetaString(meta.orderId || meta.orderID || meta.id);

  const isOrderNotification =
    type === "ORDER_CREATED" ||
    type === "NEW_ORDER" ||
    type === "PAYMENT_SETTLED" ||
    type === "ORDER_STATUS_CHANGED" ||
    type === "ORDER_STATUS_UPDATED";

  if (type === "CONTACT_MESSAGE") return "/admin/settings";
  if (!isOrderNotification) return null;
  if (invoiceNo) {
    return `/admin/orders/${encodeURIComponent(invoiceNo)}`;
  }
  if (orderId) {
    return `/admin/orders?search=${encodeURIComponent(orderId)}`;
  }
  return "/admin/orders";
};

const isNewTabIntent = (event) =>
  Boolean(event?.ctrlKey || event?.metaKey || event?.button === 1 || event?.which === 2);

export default function AdminNotifications({
  open = false,
  onToggle,
  containerRef,
}) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin");
  const [, setLangTick] = useState(0);

  const isIndo = Boolean(
    i18n.language?.toLowerCase().startsWith("id") ||
    (typeof window !== "undefined" && window.localStorage?.getItem("adminLanguage")?.includes('"isoCode":"id"'))
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isMutating, setIsMutating] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [enabledTypes, setEnabledTypes] = useState(DEFAULT_ENABLED_TYPES);
  const [draftEnabledTypes, setDraftEnabledTypes] = useState(DEFAULT_ENABLED_TYPES);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [preferencesError, setPreferencesError] = useState("");
  const [realtimeStatus, setRealtimeStatus] = useState("connected");
  const openRef = useRef(Boolean(open));
  const previousOpenRef = useRef(Boolean(open));
  const eventSourceRef = useRef(null);
  const pollingTimerRef = useRef(null);
  const connectTimerRef = useRef(null);

  // Sync re-render on language change
  useEffect(() => {
    const onLangChange = () => setLangTick((t) => t + 1);
    window.addEventListener("adminLanguageChange", onLangChange);
    i18n?.on?.("languageChanged", onLangChange);
    return () => {
      window.removeEventListener("adminLanguageChange", onLangChange);
      i18n?.off?.("languageChanged", onLangChange);
    };
  }, [i18n]);

  useEffect(() => {
    openRef.current = Boolean(open);
  }, [open]);

  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await fetchAdminUnreadCount();
      setUnreadCount(Number(count || 0));
    } catch {
      // keep current count on transient failures
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current) {
      window.clearInterval(pollingTimerRef.current);
      pollingTimerRef.current = null;
    }
  }, []);

  const startPollingUnreadCount = useCallback(() => {
    if (typeof window === "undefined" || pollingTimerRef.current) return;
    pollingTimerRef.current = window.setInterval(() => {
      fetchAdminUnreadCount()
        .then((count) => {
          setUnreadCount(Number(count || 0));
        })
        .catch(() => {
          // keep last unread count during transient polling failures
        });
    }, 60_000);
  }, []);

  const loadPreferences = useCallback(async () => {
    try {
      setIsLoadingPreferences(true);
      setPreferencesError("");
      const data = await fetchAdminNotificationPreferences();
      const normalizedEnabled = normalizeEnabledTypes(data?.enabledTypes);
      const nextEnabled =
        normalizedEnabled.length > 0 || Array.isArray(data?.enabledTypes)
          ? normalizedEnabled
          : DEFAULT_ENABLED_TYPES;
      setEnabledTypes(nextEnabled);
      setDraftEnabledTypes(nextEnabled);
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to load notification preferences.";
      setPreferencesError(String(message));
    } finally {
      setIsLoadingPreferences(false);
    }
  }, []);

  const loadNotificationsPage = useCallback(async (options = {}) => {
    const { nextOffset = 0, append = false, withLoading = true } = options;
    if (withLoading && !append) setLoading(true);
    if (append) setIsLoadingMore(true);
    setError("");
    try {
      const data = await fetchAdminNotifications({
        limit: PAGE_LIMIT,
        offset: nextOffset,
      });
      const safeItems = Array.isArray(data?.items) ? data.items : [];
      setItems((previous) => (append ? [...previous, ...safeItems] : safeItems));
      setOffset(nextOffset);
      setHasMore(safeItems.length === PAGE_LIMIT);
      if (Number.isFinite(Number(data?.unreadCount))) {
        setUnreadCount(Number(data?.unreadCount || 0));
      }
      return safeItems;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to load notifications.";
      setError(String(message));
      return [];
    } finally {
      if (withLoading && !append) setLoading(false);
      if (append) setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
  }, [loadUnreadCount]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    if (!open) return undefined;
    Promise.allSettled([
      loadNotificationsPage({ nextOffset: 0, append: false, withLoading: true }),
      loadUnreadCount(),
    ]);
    return undefined;
  }, [open, loadNotificationsPage, loadUnreadCount]);

  useEffect(() => {
    if (!open) {
      setPreferencesOpen(false);
      setPreferencesError("");
    }
  }, [open]);

  const handleMarkAllRead = useCallback(async () => {
    if (isMutating) return;
    try {
      setIsMutating(true);
      // Immediately reset badge in UI for responsive feedback
      setUnreadCount(0);
      setItems((previous) =>
        previous.map((current) => ({ ...current, isRead: true }))
      );
      await markAllAdminNotificationsRead();
      await loadUnreadCount();
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to mark all notifications as read.";
      setError(String(message));
    } finally {
      setIsMutating(false);
    }
  }, [isMutating, loadUnreadCount]);

  // UX Requirement: When the user closes the notification popover (after viewing it),
  // automatically mark all as read and clear the red badge number!
  useEffect(() => {
    if (previousOpenRef.current && !open) {
      if (unreadCount > 0) {
        void handleMarkAllRead();
      }
    }
    previousOpenRef.current = Boolean(open);
  }, [open, unreadCount, handleMarkAllRead]);

  // Handle bell icon click:
  // If popover is currently open, clicking again closes it and triggers mark all read!
  const handleToggle = () => {
    if (open && unreadCount > 0) {
      void handleMarkAllRead();
    }
    onToggle?.();
  };

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return undefined;
    }
    setRealtimeStatus("connecting");

    connectTimerRef.current = window.setTimeout(() => {
      const eventSource = new EventSource("/api/admin/notifications/stream", {
        withCredentials: true,
      });
      eventSourceRef.current = eventSource;

      const onHello = (event) => {
        try {
          const payload = JSON.parse(String(event?.data || "{}"));
          if (Number.isFinite(Number(payload?.unreadCount))) {
            setUnreadCount(Number(payload.unreadCount || 0));
          }
          setRealtimeStatus("connected");
          stopPolling();
        } catch {
          // ignore malformed payload
        }
      };

      const onNotificationNew = (event) => {
        try {
          const payload = JSON.parse(String(event?.data || "{}"));
          const nextUnreadCount = Number(payload?.unreadCount);
          const notification = payload?.notification;
          if (Number.isFinite(nextUnreadCount)) {
            setUnreadCount(nextUnreadCount);
          }
          if (!openRef.current || !notification?.id) return;
          setItems((previous) => {
            const deduped = previous.filter(
              (item) => Number(item?.id) !== Number(notification.id)
            );
            return [notification, ...deduped].slice(0, 50);
          });
        } catch {
          // ignore malformed payload
        }
      };

      const onPing = () => {};
      const onOpen = () => {
        setRealtimeStatus("connected");
        stopPolling();
      };
      const onError = () => {
        setRealtimeStatus("disconnected");
        startPollingUnreadCount();
      };

      eventSource.onopen = onOpen;
      eventSource.addEventListener("hello", onHello);
      eventSource.addEventListener("notification:new", onNotificationNew);
      eventSource.addEventListener("ping", onPing);
      eventSource.onerror = onError;

      eventSourceRef.current.__cleanup = () => {
        eventSource.onopen = null;
        eventSource.removeEventListener("hello", onHello);
        eventSource.removeEventListener("notification:new", onNotificationNew);
        eventSource.removeEventListener("ping", onPing);
        eventSource.onerror = null;
        eventSource.close();
      };
    }, NOTIFICATION_STREAM_CONNECT_DELAY_MS);

    return () => {
      stopPolling();
      if (connectTimerRef.current) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      if (eventSourceRef.current?.__cleanup) {
        eventSourceRef.current.__cleanup();
      }
      eventSourceRef.current = null;
    };
  }, [startPollingUnreadCount, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling();
      if (connectTimerRef.current) {
        window.clearTimeout(connectTimerRef.current);
        connectTimerRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.__cleanup?.();
        eventSourceRef.current = null;
      }
    };
  }, [stopPolling]);

  const handleDelete = async (id) => {
    try {
      setIsMutating(true);
      await deleteAdminNotification(id);
      await Promise.all([
        loadNotificationsPage({ nextOffset: 0, append: false, withLoading: false }),
        loadUnreadCount(),
      ]);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to delete notification.";
      setError(String(message));
    } finally {
      setIsMutating(false);
    }
  };

  const handleMarkRead = async (item) => {
    if (!item || item.isRead) return true;
    try {
      setIsMutating(true);
      await markAdminNotificationRead(Number(item.id));
      setItems((previous) =>
        previous.map((current) =>
          Number(current?.id) === Number(item.id)
            ? { ...current, isRead: true }
            : current
        )
      );
      await loadUnreadCount();
      return true;
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to update notification.";
      setError(String(message));
      return false;
    } finally {
      setIsMutating(false);
    }
  };

  const handleNotificationClick = async (item, event, forceNewTab = false) => {
    const target = buildNotificationTargetUrl(item);
    const hasKnownTarget = typeof target === "string";
    const safeTarget =
      hasKnownTarget && target.startsWith("/admin") ? target : "/admin/orders";
    const shouldOpenNewTab = forceNewTab || isNewTabIntent(event);

    if (shouldOpenNewTab) {
      event?.preventDefault?.();
      if (hasKnownTarget) {
        window.open(safeTarget, "_blank", "noreferrer");
      }
      if (open) onToggle?.();
      void handleMarkRead(item);
      return;
    }

    const updated = await handleMarkRead(item);
    if (!updated) return;
    if (open) onToggle?.();
    if (!hasKnownTarget) return;
    try {
      navigate(safeTarget);
    } catch {
      navigate("/admin/orders");
    }
  };

  const handleClearAll = async () => {
    if (isMutating) return;
    const confirmed = window.confirm(
      t("notifications.clearAllConfirm", "Clear all notifications?")
    );
    if (!confirmed) return;
    try {
      setIsMutating(true);
      await clearAllAdminNotifications();
      setItems([]);
      setOffset(0);
      setHasMore(false);
      setUnreadCount(0);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to clear notifications.";
      setError(String(message));
    } finally {
      setIsMutating(false);
    }
  };

  const handleShowAllNotifications = () => {
    if (open) {
      if (unreadCount > 0) {
        void handleMarkAllRead();
      }
      onToggle?.();
    }
    navigate("/admin/notifications");
  };

  return (
    <div className="navbar__notify" ref={containerRef}>
      <button
        type="button"
        className="navbar__icon navbar__icon--notify"
        aria-label={t("notifications.title", "Notifications")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={handleToggle}
        title={t("notifications.title", "Notifications")}
      >
        <Bell size={18} />
        {unreadCount > 0 ? (
          <span className="navbar__badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="navbar__notify-menu" role="menu">
          {/* Header */}
          <div className="navbar__notify-head">
            <div className="navbar__notify-head-title-wrap">
              <p className="navbar__notify-head-title">
                {t("notifications.title", "Notifications")}
              </p>
              {unreadCount > 0 ? (
                <span className="navbar__notify-unread-badge">
                  {unreadCount} {isIndo ? "Baru" : "Unread"}
                </span>
              ) : (
                <span className="navbar__notify-head-sub">
                  {isIndo ? "Semua telah dibaca" : "All caught up"}
                </span>
              )}
            </div>

            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMutating || loading || items.length === 0}
                className="navbar__notify-head-action"
                title={t("notifications.markAllRead", "Mark all read")}
              >
                <CheckCheck size={13} />
                <span>{t("notifications.markAllRead", "Mark all read")}</span>
              </button>
            ) : null}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="navbar__notify-empty">
              <div className="tp-spin-loader" />
              <span>{t("notifications.loading", "Loading notifications...")}</span>
            </div>
          ) : null}

          {/* Error state */}
          {!loading && error ? (
            <p className="navbar__notify-empty navbar__notify-empty--error">{error}</p>
          ) : null}

          {/* Empty state */}
          {!loading && !error && items.length === 0 ? (
            <div className="navbar__notify-empty">
              <Bell size={24} className="navbar__notify-empty-icon" />
              <span>{t("notifications.empty", "No notifications yet.")}</span>
            </div>
          ) : null}

          {/* Notifications List */}
          {!loading && !error && items.length > 0 ? (
            <div className="navbar__notify-list">
              {items.map((item) => {
                const parsed = formatNotificationContent(item, isIndo);
                const IconComponent =
                  parsed.typeKey === "order"
                    ? ShoppingBag
                    : parsed.typeKey === "payment"
                    ? CreditCard
                    : parsed.typeKey === "contact"
                    ? MessageSquare
                    : Bell;

                return (
                  <div
                    key={item.id}
                    className={`navbar__notify-item ${item.isRead ? "is-read" : "is-unread"}`.trim()}
                  >
                    {/* Category Icon */}
                    <div
                      className={`navbar__notify-icon-wrap navbar__notify-icon-wrap--${parsed.typeKey}`}
                      aria-hidden="true"
                    >
                      <IconComponent size={15} />
                    </div>

                    {/* Notification Main Content */}
                    <div
                      className="navbar__notify-main"
                      role="button"
                      tabIndex={0}
                      onClick={(event) => handleNotificationClick(item, event)}
                      onAuxClick={(event) => {
                        if (event.button !== 1) return;
                        handleNotificationClick(item, event, true);
                      }}
                      onMouseDown={(event) => {
                        if (event.button === 1) event.preventDefault();
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleNotificationClick(item, event);
                        }
                      }}
                    >
                      <div className="navbar__notify-row-top">
                        <p className="navbar__notify-title" title={parsed.title}>
                          {parsed.title}
                        </p>
                        {!item.isRead && (
                          <span
                            className="navbar__notify-dot"
                            title={isIndo ? "Belum dibaca" : "Unread"}
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      {parsed.subtitle ? (
                        <p className="navbar__notify-subtext">
                          {parsed.subtitle}
                        </p>
                      ) : null}

                      <div className="navbar__notify-meta">
                        <span className="navbar__notify-label">{parsed.badge}</span>
                        <span className="navbar__notify-time">
                          {formatNotificationTimestamp(item.createdAt, isIndo)}
                        </span>
                      </div>
                    </div>

                    {/* Delete action button */}
                    <button
                      type="button"
                      className="navbar__notify-delete"
                      aria-label={t("notifications.delete", "Delete notification")}
                      title={t("notifications.delete", "Delete notification")}
                      disabled={isMutating}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* Footer Action */}
          {!loading && !error && items.length > 0 ? (
            <div className="navbar__notify-footer">
              <button
                type="button"
                onClick={handleShowAllNotifications}
                disabled={isMutating}
                className="navbar__notify-footer-action"
              >
                <span>{t("notifications.showAll", "Show all notifications")}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
