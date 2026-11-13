import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  ChevronLeft,
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
      <Icon size={22} strokeWidth={2.2} />
    </span>
  );
}

function LoadingSkeleton() {
  return (
    <div className="tpn-notification-list" aria-label="Loading notifications">
      {Array.from({ length: 5 }).map((_, index) => (
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
      <Icon size={32} />
      <strong>{title}</strong>
      <p>{message}</p>
      {actionLabel && onAction ? (
        <button type="button" className="tpn-action-button" onClick={onAction}>
          {type === "error" ? <RefreshCw size={15} /> : null}
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
  page = 1,
  totalPages = 1,
  totalFilteredCount = 0,
  pageSize = 10,
  isIndo = false,
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
  onPageChange,
  onOpenNotification,
  onMarkNotificationRead,
  onDeleteNotification,
  onClearNotifications,
  onRefresh,
}) {
  const [openMenuId, setOpenMenuId] = useState("");
  const [pageMenuOpen, setPageMenuOpen] = useState(false);

  useEffect(() => {
    if (!openMenuId && !pageMenuOpen) return undefined;
    const handleClickOutside = (event) => {
      if (!event.target?.closest?.(".tpn-row-menu-wrap") && !event.target?.closest?.(".tpn-page-menu-wrap")) {
        setOpenMenuId("");
        setPageMenuOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpenMenuId("");
        setPageMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenuId, pageMenuOpen]);

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

  // Translations
  const t = {
    title: isIndo ? "Notifikasi" : "Notifications",
    subtitle: isIndo ? "Pembaruan pesanan dan akun." : "Order and account updates.",
    unreadBadge: isIndo
      ? `${Number(unreadCount || 0)} belum dibaca`
      : `${Number(unreadCount || 0)} unread`,
    markAllRead: isIndo ? "Tandai semua dibaca" : "Mark all read",
    marking: isIndo ? "Menandai..." : "Marking...",
    clearFilters: isIndo ? "Hapus filter" : "Clear filters",
    filter: isIndo ? "Belum Dibaca" : "Unread Only",
    clearAll: isIndo ? "Hapus semua" : "Clear all",
    clearing: isIndo ? "Menghapus..." : "Clearing...",
    errorTitle: isIndo ? "Gagal memuat notifikasi." : "Notifications could not be loaded.",
    tryAgain: isIndo ? "Coba Lagi" : "Try again",
    emptyTitle: isIndo ? "Belum ada notifikasi." : "No notifications found.",
    emptyMessage: isIndo
      ? "Pembaruan pesanan, akun, dan promo baru akan muncul di sini."
      : "New order, account, and offer updates will appear here.",
    open: isIndo ? "Buka" : "Open",
    markRead: isIndo ? "Tandai dibaca" : "Mark read",
    delete: isIndo ? "Hapus" : "Delete",
    deleting: isIndo ? "Menghapus..." : "Deleting...",
    previous: isIndo ? "Sebelumnya" : "Previous",
    next: isIndo ? "Selanjutnya" : "Next",
  };

  // Pagination calculation
  const fromIndex = totalFilteredCount > 0 ? (page - 1) * pageSize + 1 : 0;
  const toIndex = Math.min(page * pageSize, totalFilteredCount);
  const paginationSummary = isIndo
    ? `Menampilkan ${fromIndex}–${toIndex} dari ${totalFilteredCount} notifikasi`
    : `Showing ${fromIndex}–${toIndex} of ${totalFilteredCount} notifications`;

  // Page numbers generator
  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 4, "...", totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, "...", page - 1, page, page + 1, "...", totalPages];
  };

  return (
    <section className="tpn-page-shell" aria-labelledby="tpn-notifications-title">
      <div className="tpn-panel">
        <header className="tpn-panel-header">
          <div>
            <h1 id="tpn-notifications-title">{t.title}</h1>
            <p>{t.subtitle}</p>
          </div>
          <span className="tpn-unread-badge">{t.unreadBadge}</span>
        </header>

        <div className="tpn-toolbar" aria-label="Notification controls">
          <div className="tpn-tabs" role="tablist" aria-label="Notification filters">
            {NOTIFICATION_FILTERS.map((filter) => {
              const label = isIndo ? filter.idLabel : filter.label;
              const countVal = counts[filter.key];
              return (
                <button
                  type="button"
                  key={filter.key}
                  role="tab"
                  aria-selected={activeFilter === filter.key}
                  className={activeFilter === filter.key ? "is-active" : ""}
                  onClick={() => onFilterChange?.(filter.key)}
                >
                  <span>{label}</span>
                  {countVal ? <em>{countVal}</em> : null}
                </button>
              );
            })}
          </div>

          <div className="tpn-actions">
            <button
              type="button"
              className="tpn-action-button"
              onClick={onMarkAllRead}
              disabled={isMarkingAllRead || Number(unreadCount || 0) <= 0}
            >
              <Check size={16} />
              <span>{isMarkingAllRead ? t.marking : t.markAllRead}</span>
            </button>
            <button type="button" className="tpn-action-button" onClick={onClearFilters}>
              <CheckCheck size={16} />
              <span>{t.clearFilters}</span>
            </button>
            <button
              type="button"
              className={`tpn-action-button ${filtersActive ? "is-active" : ""}`}
              onClick={onOpenFilters}
              aria-pressed={filtersActive}
            >
              <SlidersHorizontal size={16} />
              <span>{t.filter}</span>
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
                      <Trash2 size={15} />
                      <span>{isClearingAll ? t.clearing : t.clearAll}</span>
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
            title={t.errorTitle}
            message={errorMessage}
            actionLabel={t.tryAgain}
            onAction={onRefresh}
          />
        ) : null}

        {!loading && !errorMessage && notifications.length === 0 ? (
          <StatePanel
            title={t.emptyTitle}
            message={t.emptyMessage}
            actionLabel={activeFilter !== "all" || filtersActive ? t.clearFilters : ""}
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
                    <time>{item.timeLabel}</time>
                    <button
                      type="button"
                      className="tpn-row-cta"
                      onClick={() => handleOpen(item)}
                      disabled={rowBusy || rowDeleting}
                    >
                      <span>{item.actionLabel || t.open}</span>
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
                      <MoreVertical size={18} />
                    </button>
                    {menuOpen ? (
                      <div className="tpn-row-menu" role="menu">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => handleMarkRead(item)}
                          disabled={!item.isUnread || rowBusy}
                        >
                          {t.markRead}
                        </button>
                        <button type="button" role="menuitem" onClick={() => handleOpen(item)}>
                          {t.open}
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          className="is-danger"
                          onClick={() => handleDelete(item)}
                          disabled={rowDeleting}
                        >
                          {rowDeleting ? t.deleting : t.delete}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}

        {/* Clean, Modern Pagination (Slide 1, Slide 2, etc.) */}
        {!loading && !errorMessage && totalFilteredCount > 0 ? (
          <footer className="tpn-pagination" aria-label="Notifications pagination">
            <span className="tpn-pagination-summary">{paginationSummary}</span>

            {totalPages > 1 ? (
              <div className="tpn-pagination-controls">
                <button
                  type="button"
                  className="tpn-page-btn tpn-page-nav"
                  onClick={() => onPageChange?.(page - 1)}
                  disabled={page <= 1}
                  aria-label={t.previous}
                >
                  <ChevronLeft size={16} />
                  <span>{t.previous}</span>
                </button>

                <div className="tpn-page-numbers">
                  {getPageNumbers().map((num, idx) =>
                    num === "..." ? (
                      <span key={`dots-${idx}`} className="tpn-page-ellipsis">
                        …
                      </span>
                    ) : (
                      <button
                        type="button"
                        key={num}
                        className={`tpn-page-btn tpn-page-num ${page === num ? "is-active" : ""}`}
                        onClick={() => onPageChange?.(num)}
                        aria-current={page === num ? "page" : undefined}
                      >
                        {num}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  className="tpn-page-btn tpn-page-nav"
                  onClick={() => onPageChange?.(page + 1)}
                  disabled={page >= totalPages}
                  aria-label={t.next}
                >
                  <span>{t.next}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}
          </footer>
        ) : null}
      </div>
    </section>
  );
}
