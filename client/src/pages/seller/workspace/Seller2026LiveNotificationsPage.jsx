import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Check,
  Search,
  X,
  ShoppingBag,
  CreditCard,
  Package,
  Users,
  Settings,
  AlertCircle,
  ExternalLink,
  Clock,
  RefreshCw,
} from "lucide-react";
import { SELLER_2026_MUTATIONS } from "../../../api/seller2026/mutation-flags.ts";
import { canUseSeller2026Action } from "../../../api/seller2026/permissions.ts";
import { useSeller2026NotificationMutations } from "../../../hooks/seller2026/useSeller2026NotificationMutations.ts";
import { useSeller2026Notifications } from "../../../hooks/seller2026/useSeller2026Notifications.ts";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "./Seller2026LiveNotificationsPage.css";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const getTranslations = (isId) => ({
  pageTitle: isId ? "Pusat Notifikasi" : "Notifications Center",
  pageSubtitle: isId
    ? "Kelola semua notifikasi operasional, pesanan, dan pembaruan toko Anda secara efisien."
    : "Manage operational notifications, orders, and store updates efficiently.",
  unreadBadge: (count) => (isId ? `${count} Belum Dibaca` : `${count} Unread`),
  allReadBadge: isId ? "Semua Terbaca" : "All Caught Up",
  markAllRead: isId ? "Tandai Semua Dibaca" : "Mark All as Read",
  markingAll: isId ? "Memproses..." : "Marking...",
  searchPlaceholder: isId ? "Cari notifikasi..." : "Search notifications...",
  allStatus: isId ? "Semua Status" : "All Status",
  statusUnread: isId ? "Belum Dibaca" : "Unread",
  statusRead: isId ? "Sudah Dibaca" : "Read",
  open: isId ? "Buka" : "Open",
  markRead: isId ? "Tandai Dibaca" : "Mark as read",
  newBadge: isId ? "Baru" : "New",
  emptyTitle: isId ? "Tidak Ada Notifikasi" : "No Notifications Found",
  emptyDesc: isId
    ? "Tidak ada notifikasi yang sesuai dengan filter atau pencarian Anda."
    : "There are no notifications matching your search or active filter.",
  clearFilter: isId ? "Reset Filter" : "Reset Filters",
  loading: isId ? "Memuat notifikasi toko..." : "Loading store notifications...",
  errorTitle: isId ? "Gagal Memuat Notifikasi" : "Failed to Load Notifications",
  errorDesc: isId
    ? "Terjadi kendala saat memuat data notifikasi. Silakan coba beberapa saat lagi."
    : "Could not load notifications at this time. Please try again.",
  retry: isId ? "Coba Lagi" : "Retry",
  justNow: isId ? "Baru saja" : "Just now",
  categories: {
    all: isId ? "Semua" : "All",
    orders: isId ? "Pesanan" : "Orders",
    payments: isId ? "Pembayaran" : "Payments",
    inventory: isId ? "Stok & Produk" : "Stock & Products",
    team: isId ? "Tim & Akses" : "Team & Access",
    system: isId ? "Sistem & Pembaruan" : "System & Updates",
    other: isId ? "Lainnya" : "Other",
  },
});

const localizeNotificationTitle = (title, isId) => {
  if (!isId) return title;
  const raw = String(title || "").trim();
  if (raw.startsWith("New Order:")) {
    return raw.replace(/^New Order:/, "Pesanan Baru:");
  }
  if (raw === "New Order" || raw === "New Order Received") {
    return "Pesanan Baru";
  }
  if (raw.startsWith("Payment Settled:")) {
    return raw.replace(/^Payment Settled:/, "Pembayaran Lunas:");
  }
  if (raw.startsWith("Payment Review:")) {
    return raw.replace(/^Payment Review:/, "Tinjauan Pembayaran:");
  }
  if (raw.startsWith("Payment Cancelled:")) {
    return raw.replace(/^Payment Cancelled:/, "Pembayaran Dibatalkan:");
  }
  return raw;
};

const localizeNotificationMessage = (message, isId) => {
  if (!isId) return message || "No details available.";
  const raw = String(message || "").trim();
  if (raw.includes("New suborder awaiting buyer payment")) {
    return "Pesanan baru menunggu pembayaran pembeli via Duitku.";
  }
  if (raw.includes("Payment settled via Duitku")) {
    return "Pembayaran lunas via Duitku. Siap diproses dan dikirim.";
  }
  if (raw.includes("Payment transaction under review")) {
    return "Transaksi pembayaran sedang ditinjau gateway Duitku.";
  }
  if (raw.includes("Order payment expired or was cancelled")) {
    return "Pembayaran pesanan dibatalkan atau waktu pembayaran habis.";
  }
  return raw || "Tidak ada detail tambahan.";
};

const getCategoryIcon = (category) => {
  switch (category) {
    case "orders":
      return <ShoppingBag size={18} />;
    case "payments":
      return <CreditCard size={18} />;
    case "inventory":
      return <Package size={18} />;
    case "team":
      return <Users size={18} />;
    case "system":
    case "other":
    default:
      return <Settings size={18} />;
  }
};

const getCategoryIconBoxClass = (category) => {
  switch (category) {
    case "orders":
      return "seller-notif-icon-box--order";
    case "payments":
      return "seller-notif-icon-box--payment";
    case "inventory":
      return "seller-notif-icon-box--stock";
    case "team":
      return "seller-notif-icon-box--team";
    default:
      return "seller-notif-icon-box--general";
  }
};

export default function Seller2026LiveNotificationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug,
    isId,
    isDark,
  } = useSellerWorkspaceRoute();

  const t = useMemo(() => getTranslations(Boolean(isId)), [isId]);
  const { can, permissions } = getSeller2026PagePermissions(sellerContext);
  const canView = can("NOTIFICATION_READ");

  const activeCategory = searchParams.get("category") || "all";
  const activeStatus = searchParams.get("unread") || "all";
  const activeSearch = searchParams.get("q") || "";
  const page = readPageNumber(searchParams.get("page"), 1);

  const [searchInput, setSearchInput] = useState(activeSearch);

  const query = useMemo(
    () => ({
      search: activeSearch,
      priority: searchParams.get("priority") || "all",
      category: activeCategory,
      unread: activeStatus,
      page,
      limit: 50,
    }),
    [activeSearch, activeCategory, activeStatus, page, searchParams]
  );

  const notificationsQuery = useSeller2026Notifications(storeId, query, {
    enabled: canView,
    storeSlug: workspaceStoreSlug,
  });

  const canMutateNotifications = canUseSeller2026Action({
    permissions,
    permission: "NOTIFICATION_READ",
    mutationEnabled: SELLER_2026_MUTATIONS.notifications,
  });

  const notificationMutations = useSeller2026NotificationMutations(storeId, {
    enabled: canView && canMutateNotifications && SELLER_2026_MUTATIONS.notifications,
  });

  const updateFilters = (nextValues) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(nextValues).forEach(([k, v]) => {
      const paramKey = k === "search" ? "q" : k;
      if (!v || v === "all") {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(v));
      }
    });
    next.delete("page");
    setSearchParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateFilters({ search: searchInput });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateFilters({ search: "" });
  };

  const handleMarkAllRead = async () => {
    if (!canMutateNotifications || notificationMutations.isMarkingAllRead) return;
    try {
      await notificationMutations.markAllRead();
      void notificationsQuery.refetch();
    } catch {
      // Mutation errors handled by query cache
    }
  };

  const handleMarkSingleRead = async (id) => {
    if (!canMutateNotifications || notificationMutations.isMarkingRead) return;
    try {
      await notificationMutations.markRead(id);
      void notificationsQuery.refetch();
    } catch {
      // Mutation errors handled by query cache
    }
  };

  const notifications = notificationsQuery.data?.notifications || [];
  const categories = notificationsQuery.data?.categories || [];
  const summary = notificationsQuery.data?.summary || { all: 0, unread: 0 };
  const unreadCount = summary.unread || 0;

  // Build category tabs list with fallback keys
  const categoryTabList = useMemo(() => {
    const defaultTabs = ["all", "orders", "payments", "inventory", "team", "system", "other"];
    const countMap = {};
    countMap.all = summary.all || notifications.length;

    categories.forEach((cat) => {
      countMap[cat.key] = cat.count;
    });

    return defaultTabs.map((key) => ({
      key,
      label: t.categories[key] || key,
      count: countMap[key] ?? 0,
    }));
  }, [categories, notifications.length, summary.all, t.categories]);

  return (
    <div className={`seller-notif-page ${isDark ? "admin-theme-dark dark" : "admin-theme-light"}`}>
      {/* Page Header */}
      <header className="seller-notif-header">
        <div className="seller-notif-header-title-wrap">
          <div className="seller-notif-header-title">
            <h1>{t.pageTitle}</h1>
            {unreadCount > 0 ? (
              <span className="seller-notif-badge-unread" role="status">
                <Bell size={13} />
                {t.unreadBadge(unreadCount)}
              </span>
            ) : (
              <span className="seller-notif-badge-all-read" role="status">
                <Check size={13} />
                {t.allReadBadge}
              </span>
            )}
          </div>
          <p className="seller-notif-header-subtitle">{t.pageSubtitle}</p>
        </div>

        <div>
          <button
            type="button"
            className="seller-notif-btn-mark-all"
            disabled={
              !canMutateNotifications ||
              notificationMutations.isMarkingAllRead ||
              unreadCount <= 0
            }
            onClick={handleMarkAllRead}
            title={unreadCount <= 0 ? t.allReadBadge : t.markAllRead}
          >
            <CheckCheck size={16} />
            <span>
              {notificationMutations.isMarkingAllRead ? t.markingAll : t.markAllRead}
            </span>
          </button>
        </div>
      </header>

      {/* Category Filter Tabs */}
      <div className="seller-notif-tabs-wrap" role="tablist" aria-label="Notification Categories">
        {categoryTabList.map((tab) => {
          const isActive = activeCategory === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`seller-notif-tab ${isActive ? "is-active" : ""}`}
              onClick={() => updateFilters({ category: tab.key })}
            >
              <span>{tab.label}</span>
              {tab.count > 0 ? (
                <span className="seller-notif-tab-count">{tab.count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Controls Bar: Search & Status Filter */}
      <div className="seller-notif-controls">
        <form className="seller-notif-search-wrap" onSubmit={handleSearchSubmit}>
          <Search size={16} className="seller-notif-search-icon" />
          <input
            type="text"
            className="seller-notif-search-input"
            placeholder={t.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onBlur={() => {
              if (searchInput !== activeSearch) {
                updateFilters({ search: searchInput });
              }
            }}
          />
          {searchInput ? (
            <button
              type="button"
              className="seller-notif-search-clear"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <X size={15} />
            </button>
          ) : null}
        </form>

        <div>
          <select
            className="seller-notif-status-select"
            value={activeStatus}
            onChange={(e) => updateFilters({ unread: e.target.value })}
            aria-label="Filter status"
          >
            <option value="all">{t.allStatus}</option>
            <option value="true">{t.statusUnread}</option>
            <option value="false">{t.statusRead}</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {notificationsQuery.isLoading ? (
        <div className="seller-notif-empty">
          <div className="seller-notif-empty-icon">
            <RefreshCw size={26} className="animate-spin" />
          </div>
          <h2 className="seller-notif-empty-title">{t.loading}</h2>
        </div>
      ) : notificationsQuery.isError ? (
        <div className="seller-notif-empty">
          <div className="seller-notif-empty-icon" style={{ color: "#ef4444" }}>
            <AlertCircle size={26} />
          </div>
          <h2 className="seller-notif-empty-title">{t.errorTitle}</h2>
          <p className="seller-notif-empty-desc">{t.errorDesc}</p>
          <button
            type="button"
            className="seller-notif-btn-mark-all"
            onClick={() => notificationsQuery.refetch()}
          >
            <RefreshCw size={15} />
            <span>{t.retry}</span>
          </button>
        </div>
      ) : notifications.length === 0 ? (
        <div className="seller-notif-empty">
          <div className="seller-notif-empty-icon">
            <Bell size={26} />
          </div>
          <h2 className="seller-notif-empty-title">{t.emptyTitle}</h2>
          <p className="seller-notif-empty-desc">{t.emptyDesc}</p>
          {(activeCategory !== "all" || activeStatus !== "all" || activeSearch) && (
            <button
              type="button"
              className="seller-notif-btn-read"
              onClick={() => {
                setSearchInput("");
                setSearchParams(new URLSearchParams());
              }}
              style={{ marginTop: 8 }}
            >
              {t.clearFilter}
            </button>
          )}
        </div>
      ) : (
        <div className="seller-notif-list">
          {notifications.map((item) => {
            const isUnread = Boolean(item.unread);
            const localizedTitle = localizeNotificationTitle(item.title, Boolean(isId));
            const localizedMsg = localizeNotificationMessage(item.message, Boolean(isId));
            const categoryLabel =
              t.categories[item.category] || item.category || t.categories.other;

            return (
              <article
                key={item.id}
                className={`seller-notif-card ${isUnread ? "is-unread" : ""}`}
              >
                {/* Category Icon */}
                <div
                  className={`seller-notif-icon-box ${getCategoryIconBoxClass(item.category)}`}
                  aria-hidden="true"
                >
                  {getCategoryIcon(item.category)}
                </div>

                {/* Card Main Content */}
                <div className="seller-notif-card-body">
                  <div className="seller-notif-card-head">
                    <h2 className="seller-notif-card-title">{localizedTitle}</h2>
                    {isUnread && (
                      <span className="seller-notif-new-dot">{t.newBadge}</span>
                    )}
                  </div>

                  <p className="seller-notif-card-message">{localizedMsg}</p>

                  <div className="seller-notif-card-meta">
                    <span className="seller-notif-tag">{categoryLabel}</span>
                    <span className="seller-notif-card-time">
                      <Clock size={11} style={{ display: "inline", marginRight: 4 }} />
                      {item.createdAt || t.justNow}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="seller-notif-card-actions">
                  {item.canonicalHref ? (
                    <Link to={item.canonicalHref} className="seller-notif-btn-open">
                      <span>{t.open}</span>
                      <ExternalLink size={13} />
                    </Link>
                  ) : null}

                  {isUnread && canMutateNotifications ? (
                    <button
                      type="button"
                      className="seller-notif-btn-read"
                      disabled={notificationMutations.isMarkingRead}
                      onClick={() => handleMarkSingleRead(item.id)}
                      title={t.markRead}
                    >
                      <Check size={14} />
                      <span>{t.markRead}</span>
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
