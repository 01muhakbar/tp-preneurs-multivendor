import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Mail,
  PackageCheck,
  SlidersHorizontal,
  Tag,
  Truck,
  UserRound,
} from "lucide-react";
import {
  fetchUserNotifications,
  fetchUserUnreadNotificationCount,
  markAllUserNotificationsRead,
  markUserNotificationAsRead,
} from "../../api/userNotifications.ts";
import {
  buildNotificationsViewModel,
  unwrapNotifications,
} from "../../pages/account/notifications2026/accountNotifications2026Adapter.js";
import "./notification-preview-dropdown-2026.css";
import { useTranslation } from "react-i18next";

const ICONS = {
  bell: Bell,
  card: CreditCard,
  mail: Mail,
  package: PackageCheck,
  tag: Tag,
  truck: Truck,
  user: UserRound,
};

const invalidateNotifications = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["account", "notifications"] });
  queryClient.invalidateQueries({ queryKey: ["user", "notifications"] });
};

function PreviewIcon({ item }) {
  const Icon = ICONS[item.iconName] || Bell;
  return (
    <span
      className={`tpn-preview-row-icon tpn-preview-row-icon--${item.iconTone || "blue"}`}
      aria-hidden="true"
    >
      <Icon size={23} strokeWidth={2} />
    </span>
  );
}

export default function NotificationPreviewDropdown({ open, onNavigate, onClose }) {
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id";
  const previewQuery = useQuery({
    queryKey: ["account", "notifications", "preview", { limit: 5 }],
    queryFn: () => fetchUserNotifications({ limit: 5, offset: 0 }),
    enabled: Boolean(open),
    staleTime: 15_000,
    retry: 1,
  });
  const unreadQuery = useQuery({
    queryKey: ["account", "notifications", "unread-count"],
    queryFn: fetchUserUnreadNotificationCount,
    enabled: Boolean(open),
    staleTime: 15_000,
    retry: 1,
  });
  const markReadMutation = useMutation({
    mutationFn: (id) => markUserNotificationAsRead(id),
    onSuccess: () => invalidateNotifications(queryClient),
  });
  const markAllReadMutation = useMutation({
    mutationFn: markAllUserNotificationsRead,
    onSuccess: () => invalidateNotifications(queryClient),
  });

  const payload = useMemo(() => unwrapNotifications(previewQuery.data), [previewQuery.data]);
  const viewModel = useMemo(
    () =>
      buildNotificationsViewModel({
        notifications: payload.items,
        activeFilter: "all",
        unreadCount: unreadQuery.data ?? payload.unreadCount,
        isIndo,
      }),
    [payload.items, payload.unreadCount, unreadQuery.data, isIndo]
  );
  const rows = viewModel.notifications.slice(0, 5);
  const unreadCount = Number(viewModel.unreadCount || 0);

  if (!open) return null;

  const goTo = (url) => {
    onClose?.();
    onNavigate?.(url || "/user/notifications");
  };

  const handleClickRow = async (item) => {
    if (!item) return;
    try {
      if (item.id && item.isUnread) {
        await markReadMutation.mutateAsync(item.id);
      }
    } catch {
      // Navigation remains available if read state update fails.
    } finally {
      goTo(item.route || item.actionUrl || "/user/notifications");
    }
  };

  return (
    <div className="tpn-preview-dropdown" role="dialog" aria-label="Notifications">
      <div className="tpn-preview-arrow" aria-hidden="true" />
      <header className="tpn-preview-header">
        <div>
          <h2>Notifications</h2>
          <span className="tpn-preview-unread">{unreadCount} unread</span>
        </div>
        <div className="tpn-preview-actions">
          <button
            type="button"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending || unreadCount <= 0}
          >
            <Check size={17} />
            <span>{markAllReadMutation.isPending ? "Marking..." : "Mark all read"}</span>
          </button>
          <button type="button" onClick={() => goTo("/user/notifications")}>
            <SlidersHorizontal size={17} />
            <span>Filter</span>
          </button>
          <button type="button" onClick={() => goTo("/user/notifications")}>
            <ExternalLink size={17} />
            <span>View all</span>
          </button>
        </div>
      </header>

      <div className="tpn-preview-list">
        {previewQuery.isLoading ? (
          Array.from({ length: 5 }).map((_, index) => (
            <div className="tpn-preview-row tpn-preview-row--skeleton" key={index}>
              <span className="tpn-preview-dot" />
              <span className="tpn-preview-skeleton-icon" />
              <span className="tpn-preview-skeleton-main" />
            </div>
          ))
        ) : null}

        {!previewQuery.isLoading && previewQuery.isError ? (
          <div className="tpn-preview-state">Notifications are temporarily unavailable.</div>
        ) : null}

        {!previewQuery.isLoading && !previewQuery.isError && rows.length === 0 ? (
          <div className="tpn-preview-state">No notifications yet.</div>
        ) : null}

        {!previewQuery.isLoading && !previewQuery.isError
          ? rows.map((item) => (
              <button
                type="button"
                className={`tpn-preview-row ${item.isUnread ? "is-unread" : "is-read"}`}
                key={item.id || item.rawId}
                onClick={() => handleClickRow(item)}
              >
                <span className="tpn-preview-dot" aria-hidden="true" />
                <PreviewIcon item={item} />
                <span className="tpn-preview-main">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <em className={`tpn-preview-chip tpn-preview-chip--${item.tone || "blue"}`}>
                    {item.chip || item.label}
                  </em>
                </span>
                <time>{item.timeLabel || "Recent"}</time>
                <ChevronRight size={20} aria-hidden="true" />
              </button>
            ))
          : null}
      </div>

      <button type="button" className="tpn-preview-footer" onClick={() => goTo("/user/notifications")}>
        <span>View all notifications</span>
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
