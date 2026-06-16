import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  BadgePercent,
  Bell,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Inbox,
  Mail,
  MoreVertical,
  PackageCheck,
  SlidersHorizontal,
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
  NOTIFICATION_FILTERS,
  filterNotification,
  normalizeNotification,
  unwrapNotifications,
} from "../../utils/notificationViewModel.js";
import "./AccountNotificationsPage.css";

const PAGE_SIZE = 6;

const KIND_ICONS = {
  order: PackageCheck,
  status: Truck,
  payment: CreditCard,
  invitation: Mail,
  promotion: BadgePercent,
  account: UserRound,
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const invalidateNotifications = (queryClient) =>
  queryClient.invalidateQueries({ queryKey: ["account", "notifications"] });

function NotificationIcon({ kind }) {
  const Icon = KIND_ICONS[kind] || Bell;
  return (
    <span className={`an26-icon an26-icon--${kind || "account"}`} aria-hidden="true">
      <Icon size={20} strokeWidth={2} />
    </span>
  );
}

function NotificationSkeleton() {
  return (
    <div className="an26-list" aria-label="Loading notifications">
      {Array.from({ length: 5 }).map((_, index) => (
        <article className="an26-card an26-card--skeleton" key={`notification-skeleton-${index}`}>
          <span className="an26-skeleton-dot" />
          <span className="an26-skeleton-icon" />
          <div className="an26-skeleton-body">
            <span className="an26-skeleton-line an26-skeleton-line--title" />
            <span className="an26-skeleton-line an26-skeleton-line--copy" />
            <span className="an26-skeleton-chip" />
          </div>
          <span className="an26-skeleton-action" />
        </article>
      ))}
    </div>
  );
}

export default function AccountNotificationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const notificationsQuery = useQuery({
    queryKey: ["account", "notifications", { page, limit: PAGE_SIZE }],
    queryFn: () => fetchUserNotifications({ page, limit: PAGE_SIZE }),
    staleTime: 20_000,
    retry: 1,
  });

  const unreadQuery = useQuery({
    queryKey: ["account", "notifications", "unread-count"],
    queryFn: fetchUserUnreadNotificationCount,
    staleTime: 20_000,
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

  const payload = useMemo(
    () => unwrapNotifications(notificationsQuery.data),
    [notificationsQuery.data]
  );
  const normalizedItems = useMemo(
    () => payload.items.map(normalizeNotification).filter((item) => item.id > 0),
    [payload.items]
  );
  const visibleItems = useMemo(
    () =>
      normalizedItems.filter(
        (item) => filterNotification(item, activeFilter) && (!unreadOnly || !item.isRead)
      ),
    [activeFilter, normalizedItems, unreadOnly]
  );
  const unreadCount = Number(unreadQuery.data ?? payload.unreadCount ?? 0);
  const totalFromMeta = Number(payload.meta.total ?? payload.meta.totalItems ?? 0);
  const hasNextPage = totalFromMeta
    ? page * PAGE_SIZE < totalFromMeta
    : normalizedItems.length >= PAGE_SIZE;
  const hasPreviousPage = page > 1;
  const showingStart = visibleItems.length > 0 ? (page - 1) * PAGE_SIZE + 1 : 0;
  const showingEnd = visibleItems.length > 0 ? showingStart + visibleItems.length - 1 : 0;
  const activeReadId = Number(markReadMutation.variables || 0);
  const errorMessage = notificationsQuery.isError
    ? getErrorMessage(notificationsQuery.error, "Failed to load notifications.")
    : "";

  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    setPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilter("all");
    setUnreadOnly(false);
    setPage(1);
  };

  const handleMarkAllRead = () => {
    if (markAllReadMutation.isPending || unreadCount <= 0) return;
    markAllReadMutation.mutate();
  };

  const handleOpenNotification = async (item) => {
    if (!item?.id || markReadMutation.isPending) return;
    try {
      if (!item.isRead) {
        await markReadMutation.mutateAsync(item.id);
      }
      if (item.actionUrl) {
        navigate(item.actionUrl);
      }
    } catch {
      // The mutation error is surfaced by React Query state on the next render.
    }
  };

  return (
    <section className="account-notifications-2026" aria-labelledby="account-notifications-title">
      <header className="an26-hero">
        <div>
          <h1 id="account-notifications-title">Notifications</h1>
          <p>Order and account updates.</p>
        </div>
        <span className="an26-unread-pill">{unreadCount} unread</span>
      </header>

      <div className="an26-toolbar" aria-label="Notification controls">
        <div className="an26-tabs" role="tablist" aria-label="Notification filters">
          {NOTIFICATION_FILTERS.map((filter) => (
            <button
              type="button"
              key={filter.key}
              role="tab"
              aria-selected={activeFilter === filter.key}
              className={activeFilter === filter.key ? "is-active" : ""}
              onClick={() => handleFilterChange(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="an26-actions">
          <button
            type="button"
            className="an26-button"
            onClick={handleMarkAllRead}
            disabled={markAllReadMutation.isPending || unreadCount <= 0}
          >
            <CheckCheck size={16} />
            <span>{markAllReadMutation.isPending ? "Marking..." : "Mark all read"}</span>
          </button>
          <button type="button" className="an26-button" onClick={handleClearFilters}>
            Clear filters
          </button>
          <button
            type="button"
            className={`an26-button an26-button--icon ${unreadOnly ? "is-active" : ""}`}
            onClick={() => {
              setUnreadOnly((current) => !current);
              setPage(1);
            }}
            aria-pressed={unreadOnly}
          >
            <SlidersHorizontal size={16} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {markReadMutation.isError || markAllReadMutation.isError ? (
        <div className="an26-alert an26-alert--error" role="alert">
          {getErrorMessage(
            markReadMutation.error || markAllReadMutation.error,
            "Failed to update notification state."
          )}
        </div>
      ) : null}

      {notificationsQuery.isLoading ? <NotificationSkeleton /> : null}

      {!notificationsQuery.isLoading && errorMessage ? (
        <div className="an26-state an26-state--error" role="alert">
          <Bell size={22} />
          <strong>Notifications could not be loaded.</strong>
          <p>{errorMessage}</p>
          <button type="button" className="an26-button" onClick={() => notificationsQuery.refetch()}>
            Try again
          </button>
        </div>
      ) : null}

      {!notificationsQuery.isLoading && !errorMessage && visibleItems.length === 0 ? (
        <div className="an26-state">
          <Inbox size={24} />
          <strong>No notifications found.</strong>
          <p>New order, account, and offer updates will appear here.</p>
          {activeFilter !== "all" || unreadOnly ? (
            <button type="button" className="an26-button" onClick={handleClearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>
      ) : null}

      {!notificationsQuery.isLoading && !errorMessage && visibleItems.length > 0 ? (
        <div className="an26-list">
          {visibleItems.map((item) => (
            <article
              className={`an26-card ${item.isRead ? "is-read" : "is-unread"}`}
              key={item.id}
            >
              <span className="an26-unread-dot" aria-hidden="true" />
              <NotificationIcon kind={item.kind} />
              <button
                type="button"
                className="an26-card-main"
                onClick={() => handleOpenNotification(item)}
              >
                <span className="an26-card-title">{item.title}</span>
                <span className="an26-card-copy">{item.description}</span>
                <span className={`an26-chip an26-chip--${item.tone}`}>{item.label}</span>
              </button>
              <div className="an26-card-side">
                <span className="an26-card-time">{item.timeLabel}</span>
                {item.actionUrl ? (
                  <button
                    type="button"
                    className="an26-card-cta"
                    onClick={() => handleOpenNotification(item)}
                    disabled={markReadMutation.isPending && activeReadId === item.id}
                  >
                    {["order", "status", "payment"].includes(item.kind)
                      ? "View order"
                      : item.kind === "promotion"
                        ? "Shop now"
                        : "Open"}
                  </button>
                ) : null}
              </div>
              <button
                type="button"
                className="an26-more"
                aria-label={item.isRead ? "Notification options" : "Mark as read"}
                title={item.isRead ? "Notification options" : "Mark as read"}
                disabled={item.isRead || (markReadMutation.isPending && activeReadId === item.id)}
                onClick={() => {
                  if (!item.isRead) markReadMutation.mutate(item.id);
                }}
              >
                <MoreVertical size={18} />
              </button>
            </article>
          ))}
        </div>
      ) : null}

      {!notificationsQuery.isLoading && !errorMessage && normalizedItems.length > 0 ? (
        <footer className="an26-pagination">
          <span>
            Showing {showingStart}-{showingEnd} of{" "}
            {totalFromMeta || (hasNextPage ? `${page * PAGE_SIZE}+` : normalizedItems.length)}
          </span>
          <div className="an26-page-controls">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!hasPreviousPage}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <span>{page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasNextPage}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </footer>
      ) : null}
    </section>
  );
}
