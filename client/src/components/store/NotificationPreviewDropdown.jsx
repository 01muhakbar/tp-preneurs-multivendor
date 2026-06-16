import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgePercent,
  Bell,
  ChevronRight,
  CreditCard,
  Mail,
  PackageCheck,
  Trash2,
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
  normalizeNotification,
  unwrapNotifications,
} from "../../utils/notificationViewModel.js";
import "./NotificationPreviewDropdown.css";

const KIND_ICONS = {
  order: PackageCheck,
  status: Truck,
  payment: CreditCard,
  invitation: Mail,
  promotion: BadgePercent,
  account: UserRound,
};

const invalidateNotifications = (queryClient) =>
  queryClient.invalidateQueries({ queryKey: ["account", "notifications"] });

function PreviewIcon({ kind }) {
  const Icon = KIND_ICONS[kind] || Bell;
  return (
    <span className={`np26-row-icon np26-row-icon--${kind || "account"}`} aria-hidden="true">
      <Icon size={18} strokeWidth={2} />
    </span>
  );
}

export default function NotificationPreviewDropdown({
  open,
  onNavigate,
}) {
  const queryClient = useQueryClient();
  const previewQuery = useQuery({
    queryKey: ["account", "notifications", "preview"],
    queryFn: () => fetchUserNotifications({ limit: 4, offset: 0 }),
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
  const rows = useMemo(
    () => payload.items.map(normalizeNotification).filter((item) => item.id > 0).slice(0, 4),
    [payload.items]
  );
  const unreadCount = Number(unreadQuery.data ?? payload.unreadCount ?? 0);

  if (!open) return null;

  const goTo = (url) => {
    if (typeof onNavigate === "function") {
      onNavigate(url);
    }
  };

  const handleClickRow = async (item) => {
    if (!item?.id || markReadMutation.isPending) return;
    if (!item.isRead) {
      await markReadMutation.mutateAsync(item.id);
    }
    goTo(item.actionUrl || "/user/notifications");
  };

  const handleMarkRead = async (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    if (!item?.id || item.isRead || markReadMutation.isPending) return;
    await markReadMutation.mutateAsync(item.id);
  };

  return (
    <div className="notification-preview-2026" role="dialog" aria-label="Notifications preview">
      <div className="np26-arrow" aria-hidden="true" />
      <header className="np26-head">
        <div>
          <div className="np26-title-row">
            <h2>Notifications</h2>
            <span>{unreadCount} unread</span>
          </div>
          <p>
            <span aria-hidden="true" />
            Realtime connected
          </p>
        </div>
        <button
          type="button"
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending || unreadCount <= 0}
        >
          {markAllReadMutation.isPending ? "Clearing..." : "Clear all"}
        </button>
      </header>

      <div className="np26-body">
        {previewQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div className="np26-row np26-row--skeleton" key={`notification-preview-skeleton-${index}`}>
              <span className="np26-row-dot" />
              <span className="np26-skeleton-icon" />
              <span className="np26-skeleton-lines" />
            </div>
          ))
        ) : null}

        {!previewQuery.isLoading && previewQuery.isError ? (
          <div className="np26-state">Notifications are temporarily unavailable.</div>
        ) : null}

        {!previewQuery.isLoading && !previewQuery.isError && rows.length === 0 ? (
          <div className="np26-state">No notifications yet.</div>
        ) : null}

        {!previewQuery.isLoading && !previewQuery.isError
          ? rows.map((item) => (
              <button
                type="button"
                className={`np26-row ${item.isRead ? "is-read" : "is-unread"}`}
                key={item.id}
                onClick={() => handleClickRow(item)}
              >
                <span className="np26-row-dot" aria-hidden="true" />
                <PreviewIcon kind={item.kind} />
                <span className="np26-row-main">
                  <strong>{item.title}</strong>
                  <span>
                    <em className={`np26-chip np26-chip--${item.tone}`}>{item.label}</em>
                    <time>{item.timeLabel}</time>
                  </span>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="np26-mark-read"
                  aria-label={item.isRead ? "Already read" : "Mark as read"}
                  title={item.isRead ? "Already read" : "Mark as read"}
                  onClick={(event) => handleMarkRead(event, item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      handleMarkRead(event, item);
                    }
                  }}
                >
                  <Trash2 size={15} />
                </span>
              </button>
            ))
          : null}
      </div>

      <button type="button" className="np26-view-all" onClick={() => goTo("/user/notifications")}>
        <span>View all notifications</span>
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
