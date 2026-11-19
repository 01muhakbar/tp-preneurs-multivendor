import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Trash2,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  clearAllAdminNotifications,
  deleteAdminNotification,
  fetchAdminNotifications,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "../../api/adminNotifications.ts";
import {
  formatNotificationContent,
  formatNotificationTimestamp,
} from "../../components/admin/AdminNotifications.jsx";

const PAGE_LIMIT = 50;

const DEFAULT_COLUMN_VISIBILITY = {
  status: true,
  notification: true,
  date: true,
  actions: true,
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
  if (invoiceNo) return `/admin/orders/${encodeURIComponent(invoiceNo)}`;
  if (orderId) return `/admin/orders?search=${encodeURIComponent(orderId)}`;
  return "/admin/orders";
};

export default function AdminNotificationsPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("admin");
  const [, setLangTick] = useState(0);

  const isIndo = Boolean(
    i18n.language?.toLowerCase().startsWith("id") ||
    (typeof window !== "undefined" && window.localStorage?.getItem("adminLanguage")?.includes('"isoCode":"id"'))
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_COLUMN_VISIBILITY);
  const [isMutating, setIsMutating] = useState(false);
  const [rowMenuOpenId, setRowMenuOpenId] = useState(null);

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

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchAdminNotifications({ limit: PAGE_LIMIT, offset: 0 });
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || t("notifications.error", "Failed to load notifications."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[data-admin-notify-view-menu]")) setViewMenuOpen(false);
      if (!target.closest("[data-admin-notify-row-menu]")) setRowMenuOpenId(null);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const totalCount = items.length;
  const unreadCount = useMemo(() => items.filter((item) => !item?.isRead).length, [items]);
  const readCount = useMemo(() => items.filter((item) => item?.isRead).length, [items]);

  const filteredItems = useMemo(() => {
    const keyword = String(search || "").trim().toLowerCase();
    return items.filter((item) => {
      const parsed = formatNotificationContent(item, isIndo);
      const matchesSearch =
        !keyword ||
        String(parsed.title || "").toLowerCase().includes(keyword) ||
        String(parsed.subtitle || "").toLowerCase().includes(keyword) ||
        String(parsed.badge || "").toLowerCase().includes(keyword) ||
        String(item?.title || "").toLowerCase().includes(keyword);

      const matchesStatus =
        status === "all" ||
        (status === "read" && item?.isRead) ||
        (status === "unread" && !item?.isRead);

      return matchesSearch && matchesStatus;
    });
  }, [items, search, status, isIndo]);

  const allVisibleSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedIds.has(Number(item.id)));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredItems.forEach((item) => next.delete(Number(item.id)));
      } else {
        filteredItems.forEach((item) => next.add(Number(item.id)));
      }
      return next;
    });
  };

  const toggleSelectRow = (id) => {
    const parsedId = Number(id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(parsedId)) next.delete(parsedId);
      else next.add(parsedId);
      return next;
    });
  };

  const selectedItems = filteredItems.filter((item) => selectedIds.has(Number(item.id)));

  const handleMarkSelectedRead = async () => {
    const unreadSelected = selectedItems.filter((item) => !item?.isRead);
    if (isMutating || unreadSelected.length === 0) return;
    try {
      setIsMutating(true);
      await Promise.all(unreadSelected.map((item) => markAdminNotificationRead(Number(item.id))));
      setItems((prev) =>
        prev.map((item) =>
          selectedIds.has(Number(item.id)) ? { ...item, isRead: true } : item
        )
      );
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to mark notifications as read.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (isMutating || unreadCount === 0) return;
    try {
      setIsMutating(true);
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      await markAllAdminNotificationsRead();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to mark all notifications as read.");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteMany = async (ids) => {
    if (isMutating || !Array.isArray(ids) || ids.length === 0) return;
    try {
      setIsMutating(true);
      await Promise.all(ids.map((id) => deleteAdminNotification(Number(id))));
      setItems((prev) => prev.filter((item) => !ids.includes(Number(item.id))));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(Number(id)));
        return next;
      });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to delete notifications.");
    } finally {
      setIsMutating(false);
      setRowMenuOpenId(null);
    }
  };

  const handleOpenNotification = async (item) => {
    if (!item) return;
    const target = buildNotificationTargetUrl(item);
    try {
      if (!item.isRead) {
        setIsMutating(true);
        await markAdminNotificationRead(Number(item.id));
        setItems((prev) =>
          prev.map((entry) =>
            Number(entry.id) === Number(item.id) ? { ...entry, isRead: true } : entry
          )
        );
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to update notification.");
      return;
    } finally {
      setIsMutating(false);
      setRowMenuOpenId(null);
    }

    if (target) navigate(target);
  };

  const viewColumns = [
    ["status", t("notifications.columns.status", "Status")],
    ["notification", t("notifications.columns.notification", "Notification")],
    ["date", t("notifications.columns.date", "Date")],
    ["actions", t("notifications.columns.actions", "Actions")],
  ];

  return (
    <div className="space-y-4">
      {/* 1. Header Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#0c182c] px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-[#034c85] dark:text-white">
                {t("notifications.pageTitle", "Notification Center")}
              </h1>
              {unreadCount > 0 ? (
                <span className="inline-flex items-center rounded-full bg-[#fe6f05]/10 px-2.5 py-0.5 text-xs font-bold text-[#fe6f05] border border-[#fe6f05]/20">
                  {unreadCount} {isIndo ? "Baru" : "Unread"}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t("notifications.pageSubtitle", "Monitor all store orders, payment settlements, and activities")}
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMutating}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-[#034c85]/20 bg-[#034c85]/5 px-3.5 text-xs font-bold text-[#034c85] transition hover:bg-[#034c85] hover:text-white dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-400 dark:hover:bg-sky-600 dark:hover:text-white disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                <span>{t("notifications.markAllRead", "Mark all read")}</span>
              </button>
            )}

            {selectedItems.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleMarkSelectedRead}
                  disabled={isMutating || selectedItems.filter((item) => !item.isRead).length === 0}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#034c85] px-3.5 text-xs font-bold text-white transition hover:bg-[#023862] disabled:opacity-50"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>{t("notifications.markAsRead", "Mark as Read")} ({selectedItems.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteMany(selectedItems.map((item) => Number(item.id)))}
                  disabled={isMutating}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-rose-50 px-3.5 text-xs font-bold text-rose-600 border border-rose-200 transition hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-900/60 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{t("notifications.deleteSelected", "Delete Selected")}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* 2. Controls Bar: Tabs & Search */}
        <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Segmented Filter Tabs */}
          <div className="inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatus("all")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                status === "all"
                  ? "bg-white dark:bg-[#0c182c] text-[#034c85] dark:text-white shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{t("notifications.all", "All")}</span>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[10px]">
                {totalCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatus("unread")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                status === "unread"
                  ? "bg-white dark:bg-[#0c182c] text-[#fe6f05] shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{t("notifications.unread", "Unread")}</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-[#fe6f05]/15 text-[#fe6f05] px-1.5 py-0.2 text-[10px] font-bold">
                  {unreadCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => setStatus("read")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition ${
                status === "read"
                  ? "bg-white dark:bg-[#0c182c] text-[#034c85] dark:text-sky-400 shadow-sm font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <span>{t("notifications.read", "Read")}</span>
              <span className="rounded-full bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 text-[10px]">
                {readCount}
              </span>
            </button>
          </div>

          {/* Search and Column Controls */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[220px] max-w-[320px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("notifications.searchPlaceholder", "Search notifications...")}
                className="h-9 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 pl-8 pr-3 text-xs text-slate-800 dark:text-slate-100 outline-none transition focus:border-[#034c85] dark:focus:border-sky-500"
              />
            </div>

            {/* Column Visibility Menu */}
            <div className="relative" data-admin-notify-view-menu>
              <button
                type="button"
                onClick={() => setViewMenuOpen((prev) => !prev)}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>{t("notifications.view", "View")}</span>
              </button>
              {viewMenuOpen ? (
                <div className="absolute right-0 z-30 mt-2 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c182c] p-2 shadow-xl">
                  {viewColumns.map(([key, label]) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(columnVisibility[key])}
                        onChange={() =>
                          setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        className="h-3.5 w-3.5 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700 dark:bg-rose-950/30 dark:border-rose-900 dark:text-rose-400">
            {error}
          </div>
        ) : null}
      </div>

      {/* 3. Notification Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-[#0c182c] shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <div className="tp-spin-loader mb-3" />
            <p className="text-xs">{t("notifications.loading", "Loading notifications...")}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {t("notifications.noNotificationsFound", "No notifications found.")}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
              {t("notifications.noNotificationsFoundHint", "Try changing the search keyword or status filter.")}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-left">
              <colgroup>
                <col style={{ width: "44px" }} />
                {columnVisibility.status ? <col style={{ width: "130px" }} /> : null}
                {columnVisibility.notification ? <col /> : null}
                {columnVisibility.date ? <col style={{ width: "170px" }} /> : null}
                {columnVisibility.actions ? <col style={{ width: "64px" }} /> : null}
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      className="h-3.5 w-3.5 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                      aria-label="Select all notifications"
                    />
                  </th>
                  {columnVisibility.status ? (
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("notifications.columns.status", "Status")}
                    </th>
                  ) : null}
                  {columnVisibility.notification ? (
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("notifications.columns.notification", "Notification")}
                    </th>
                  ) : null}
                  {columnVisibility.date ? (
                    <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("notifications.columns.date", "Date")}
                    </th>
                  ) : null}
                  {columnVisibility.actions ? (
                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {t("notifications.columns.actions", "Actions")}
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredItems.map((item) => {
                  const isSelected = selectedIds.has(Number(item.id));
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
                    <tr
                      key={item.id}
                      className={`group transition hover:bg-slate-50/80 dark:hover:bg-slate-850/60 cursor-pointer ${
                        !item.isRead
                          ? "bg-[#fe6f05]/[0.02] dark:bg-[#fe6f05]/[0.05]"
                          : ""
                      }`}
                      onClick={() => handleOpenNotification(item)}
                    >
                      {/* Checkbox */}
                      <td
                        className="px-4 py-3.5 align-middle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(item.id)}
                          className="h-3.5 w-3.5 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                        />
                      </td>

                      {/* Status Badge */}
                      {columnVisibility.status ? (
                        <td className="px-4 py-3.5 align-middle">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              item.isRead
                                ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                : "bg-[#fe6f05]/12 text-[#fe6f05] border border-[#fe6f05]/25"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                item.isRead ? "bg-slate-400" : "bg-[#fe6f05]"
                              }`}
                            />
                            {item.isRead
                              ? t("notifications.read", "Read")
                              : t("notifications.unread", "Unread")}
                          </span>
                        </td>
                      ) : null}

                      {/* Notification Content */}
                      {columnVisibility.notification ? (
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Category Icon */}
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition ${
                                parsed.typeKey === "order"
                                  ? "bg-[#034c85]/10 text-[#034c85] dark:bg-sky-500/15 dark:text-sky-400"
                                  : parsed.typeKey === "payment"
                                  ? "bg-[#fe6f05]/12 text-[#fe6f05] dark:bg-[#fe6f05]/20 dark:text-amber-400"
                                  : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                              }`}
                              aria-hidden="true"
                            >
                              <IconComponent className="h-4 w-4" />
                            </div>

                            {/* Text Info */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p
                                  className={`truncate text-sm transition group-hover:text-[#034c85] dark:group-hover:text-sky-400 ${
                                    item.isRead
                                      ? "font-medium text-slate-800 dark:text-slate-200"
                                      : "font-bold text-[#0f172a] dark:text-white"
                                  }`}
                                  title={parsed.title}
                                >
                                  {parsed.title}
                                </p>
                                <span className="inline-flex shrink-0 items-center rounded-full bg-[#034c85]/8 px-2 py-0.2 text-[10px] font-bold text-[#034c85] dark:bg-sky-500/15 dark:text-sky-300">
                                  {parsed.badge}
                                </span>
                              </div>

                              {parsed.subtitle ? (
                                <p className="mt-0.5 truncate text-xs font-semibold text-[#034c85] dark:text-sky-400">
                                  {parsed.subtitle}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      ) : null}

                      {/* Unified Date Column */}
                      {columnVisibility.date ? (
                        <td className="px-4 py-3.5 align-middle text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatNotificationTimestamp(item.createdAt, isIndo)}
                        </td>
                      ) : null}

                      {/* Actions Column */}
                      {columnVisibility.actions ? (
                        <td
                          className="px-4 py-3.5 align-middle text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left" data-admin-notify-row-menu>
                            <button
                              type="button"
                              onClick={() =>
                                setRowMenuOpenId((prev) =>
                                  prev === Number(item.id) ? null : Number(item.id)
                                )
                              }
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title={t("notifications.actions", "Actions")}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {rowMenuOpenId === Number(item.id) ? (
                              <div className="absolute right-0 z-30 mt-1.5 w-40 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c182c] p-1.5 shadow-xl text-left">
                                <button
                                  type="button"
                                  onClick={() => handleOpenNotification(item)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                >
                                  <ArrowRight className="h-3.5 w-3.5" />
                                  <span>{t("notifications.open", "Open")}</span>
                                </button>
                                {!item.isRead && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      try {
                                        setIsMutating(true);
                                        await markAdminNotificationRead(Number(item.id));
                                        setItems((prev) =>
                                          prev.map((entry) =>
                                            Number(entry.id) === Number(item.id)
                                              ? { ...entry, isRead: true }
                                              : entry
                                          )
                                        );
                                      } finally {
                                        setIsMutating(false);
                                        setRowMenuOpenId(null);
                                      }
                                    }}
                                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                  >
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    <span>{t("notifications.markAsRead", "Mark as Read")}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMany([Number(item.id)])}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>{t("notifications.delete", "Delete")}</span>
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
