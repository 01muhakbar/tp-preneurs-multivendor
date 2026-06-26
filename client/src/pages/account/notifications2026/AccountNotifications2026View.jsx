import { useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  CreditCard,
  Inbox,
  Mail,
  MoreVertical,
  PackageCheck,
  RefreshCw,
  SlidersHorizontal,
  Tag,
  Trash2,
  Truck,
  UserRound,
} from "lucide-react";
import { NOTIFICATION_FILTERS } from "./accountNotifications2026Adapter.js";
import "./account-notifications-2026.css";

const ICONS = {
  bell: Bell,
  card: CreditCard,
  mail: Mail,
  package: PackageCheck,
  tag: Tag,
  truck: Truck,
  user: UserRound,
};

const getBusyId = (value) => String(value ?? "");

function NotificationIcon({ item }) {
  const Icon = ICONS[item.iconName] || Bell;
  return (
    <span className={`tpn-row-icon tpn-row-icon--${item.iconTone || "blue"}`} aria-hidden="true">
      <Icon size={24} strokeWidth={2} />
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="tpn-notification-list" aria-label="Loading notifications">
      {Array.from({ length: 6 }).map((_, index) => (
        <article className="tpn-notification-row tpn-notification-row--skeleton" key={index}>
          <span className="tpn-skeleton-dot" />
          <span className="tpn-skeleton-icon" />
          <span className="tpn-skeleton-main">
            <span />
            <span />
            <span />
          </span>
          <span className="tpn-skeleton-action" />
        </article>
      ))}
    </div>
  );
}

function StatePanel({ type = "empty", title, message, actionLabel, onAction }) {
  const Icon = type === "error" ? Bell : Inbox;
  return (
    <div className={`tpn-state tpn-state--${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon size={28} />
      <strong>{title}</strong>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button type="button" className="tpn-action-button" onClick={onAction}>
          {type === "error" ? <RefreshCw size={16} /> : null}
          <span>{actionLabel}</span>
        </button>
      ) : null}
    </div>
  );
}

export default function AccountNotifications2026View({
  notifications = [],
  unreadCount = 0,
  counts = {},
  activeFilter = "all",
  filtersActive = false,
  loading = false,
  error = null,
  mutationError = null,
  busyNotificationId = null,
  deletingNotificationId = null,
  isMarkingAllRead = false,
  isClearingAll = false,
  onFilterChange,
  onMarkAllRead,
  onClearFilters,
  onOpenFilters,
  onOpenNotification,
  onMarkNotificationRead,
  onDeleteNotification,
  onClearNotifications,
  onRefresh,
}) {
  const [openMenuId, setOpenMenuId] = useState("");
  const [pageMenuOpen, setPageMenuOpen] = useState(false);
  const errorMessage =
    error?.response?.data?.message || error?.message || (typeof error === "string" ? error : "");
  const mutationMessage =
    mutationError?.response?.data?.message ||
    mutationError?.message ||
    (typeof mutationError === "string" ? mutationError : "");

  const handleOpen = (item) => {
    setOpenMenuId("");
    onOpenNotification?.(item);
  };

  const handleMarkRead = (item) => {
    setOpenMenuId("");
    onMarkNotificationRead?.(item);
  };

  const handleDelete = (item) => {
    setOpenMenuId("");
    onDeleteNotification?.(item);
  };

  const handleClearAll = () => {
    setPageMenuOpen(false);
    onClearNotifications?.();
  };

  return (
    <section className="tpn-page-shell" aria-labelledby="tpn-notifications-title">
      <div className="tpn-panel">
        <header className="tpn-panel-header">
          <div>
            <h1 id="tpn-notifications-title">Notifications</h1>
            <p>Order and account updates.</p>
          </div>
          <span className="tpn-unread-badge">{Number(unreadCount || 0)} unread</span>
        </header>

        <div className="tpn-toolbar" aria-label="Notification controls">
          <div className="tpn-tabs" role="tablist" aria-label="Notification filters">
            {NOTIFICATION_FILTERS.map((filter) => (
              <button
                type="button"
                key={filter.key}
                role="tab"
                aria-selected={activeFilter === filter.key}
                className={activeFilter === filter.key ? "is-active" : ""}
                onClick={() => onFilterChange?.(filter.key)}
              >
                <span>{filter.label}</span>
                {counts[filter.key] ? <em>{counts[filter.key]}</em> : null}
              </button>
            ))}
          </div>

          <div className="tpn-actions">
            <button
              type="button"
              className="tpn-action-button"
              onClick={onMarkAllRead}
              disabled={isMarkingAllRead || Number(unreadCount || 0) <= 0}
            >
              <Check size={17} />
              <span>{isMarkingAllRead ? "Marking..." : "Mark all read"}</span>
            </button>
            <button type="button" className="tpn-action-button" onClick={onClearFilters}>
              <CheckCheck size={17} />
              <span>Clear filters</span>
            </button>
            <button
              type="button"
              className={`tpn-action-button ${filtersActive ? "is-active" : ""}`}
              onClick={onOpenFilters}
              aria-pressed={filtersActive}
            >
              <SlidersHorizontal size={17} />
              <span>Filter</span>
            </button>
            {onClearNotifications ? (
              <div className="tpn-page-menu-wrap">
                <button
                  type="button"
                  className="tpn-action-button tpn-action-button--icon"
                  onClick={() => setPageMenuOpen((value) => !value)}
                  aria-label="More notification actions"
                  aria-expanded={pageMenuOpen}
                >
                  <MoreVertical size={18} />
                </button>
                {pageMenuOpen ? (
                  <div className="tpn-page-menu" role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className="is-danger"
                      onClick={handleClearAll}
                      disabled={isClearingAll || loading}
                    >
                      <Trash2 size={16} />
                      <span>{isClearingAll ? "Clearing..." : "Clear all"}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {mutationMessage ? (
          <div className="tpn-inline-alert" role="alert">
            {mutationMessage}
          </div>
        ) : null}

        {loading ? <LoadingSkeleton /> : null}

        {!loading && errorMessage ? (
          <StatePanel
            type="error"
            title="Notifications could not be loaded."
            message={errorMessage}
            actionLabel="Try again"
            onAction={onRefresh}
          />
        ) : null}

        {!loading && !errorMessage && notifications.length === 0 ? (
          <StatePanel
            title="No notifications found."
            message="New order, account, and offer updates will appear here."
            actionLabel={activeFilter !== "all" || filtersActive ? "Clear filters" : ""}
            onAction={onClearFilters}
          />
        ) : null}

        {!loading && !errorMessage && notifications.length > 0 ? (
          <div className="tpn-notification-list">
            {notifications.map((item) => {
              const rowBusy = getBusyId(busyNotificationId) === getBusyId(item.id);
              const rowDeleting = getBusyId(deletingNotificationId) === getBusyId(item.id);
              const menuOpen = openMenuId === getBusyId(item.id);
              return (
                <article
                  className={`tpn-notification-row ${item.isUnread ? "is-unread" : "is-read"}`}
                  key={item.id || item.rawId}
                >
                  <span className="tpn-unread-dot" aria-hidden="true" />
                  <NotificationIcon item={item} />

                  <button type="button" className="tpn-row-main" onClick={() => handleOpen(item)}>
                    <span className="tpn-row-title">{item.title}</span>
                    <span className="tpn-row-message">{item.message}</span>
                    <span className={`tpn-chip tpn-chip--${item.tone || "blue"}`}>
                      {item.chip || item.label}
                    </span>
                  </button>

                  <div className="tpn-row-meta">
                    <time>{item.timeLabel || "Recent"}</time>
                    <button
                      type="button"
                      className="tpn-row-cta"
                      onClick={() => handleOpen(item)}
                      disabled={rowBusy || rowDeleting}
                    >
                      <span>{item.actionLabel || "Open"}</span>
                    </button>
                  </div>

                  <div className="tpn-row-menu-wrap">
                    <button
                      type="button"
                      className="tpn-row-menu-trigger"
                      aria-label="Notification options"
                      aria-expanded={menuOpen}
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === getBusyId(item.id) ? "" : getBusyId(item.id)
                        )
                      }
                    >
                      <MoreVertical size={19} />
                    </button>
                    {menuOpen ? (
                      <div className="tpn-row-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleMarkRead(item)}
                          disabled={!item.isUnread || rowBusy}
                        >
                          Mark read
                        </button>
                        <button type="button" role="menuitem" onClick={() => handleOpen(item)}>
                          Open
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="is-danger"
                          onClick={() => handleDelete(item)}
                          disabled={rowDeleting}
                        >
                          {rowDeleting ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {!loading && !errorMessage && notifications.length > 0 ? (
          <footer className="tpn-panel-footer">
            <Bell size={17} />
            <span>Stay updated on your orders and account activity.</span>
            <ChevronRight size={17} aria-hidden="true" />
          </footer>
        ) : null}
      </div>
    </section>
  );
}
