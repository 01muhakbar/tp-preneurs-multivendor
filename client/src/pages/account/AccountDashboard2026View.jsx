import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Headphones,
  Heart,
  MapPin,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/format.js";
import { resolvePublicOrderReference } from "../../utils/publicOrderReference.js";
import { readWishlistItems, WISHLIST_CHANGED_EVENT } from "../../utils/storefrontWishlist.js";
import "./account-dashboard-2026.css";

const money = (value) => formatCurrency(Number(value || 0));
const asNumber = (value) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const getOrderDateValue = (order) =>
  order?.createdAt || order?.created_at || order?.orderTime || null;

const formatDateTime = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const getPublicOrderRef = (order) =>
  resolvePublicOrderReference(order?.invoiceNo, order?.ref, order?.invoice, order?.orderRef);

const getOrderTone = (status) => {
  const value = `${status?.bucket || ""} ${status?.label || ""} ${status?.code || ""}`.toLowerCase();
  if (/fail|reject|cancel|expire/.test(value)) return "danger";
  if (/complete|paid|deliver|approve|final/.test(value)) return "success";
  if (/review|pending|split|await|action/.test(value)) return "warning";
  if (/process|ship|submit|confirm|ready/.test(value)) return "info";
  return "neutral";
};

// Comprehensive bilingual dictionary for Account Dashboard
const DASHBOARD_I18N = {
  en: {
    overviewTag: "ACCOUNT OVERVIEW",
    dashboardTitle: "Dashboard",
    welcome: "Welcome back, {{name}}. Here's what's happening with your account.",
    totalOrders: "Total Orders",
    allOrders: "All orders",
    pendingOrders: "Pending Orders",
    awaitingAction: "Awaiting action",
    processingOrders: "Processing Orders",
    inProgress: "In progress",
    completedOrders: "Completed Orders",
    done: "Done",

    startSelling: "Start Selling",
    startSellingDesc: "Complete your store details and submit them for review.",
    readyWhenYouAre: "Ready when you are",
    fieldsCompleted: "{{completed}} of {{total}} fields completed",
    openWorkspace: "Open Workspace",
    startApplication: "Start Application",
    continueApplication: "Continue Application",
    reviewResubmit: "Review & Resubmit",
    viewApplication: "View Application",
    viewDetails: "View Details",
    lastUpdated: "Last updated",
    noApplicationStarted: "No application started",

    wishlist: "Wishlist",
    browseSavedItems: "Browse saved items",
    savedItemsCount: "{{count}} saved items",
    addresses: "Addresses",
    addressesSaved: "{{count}} saved",
    addAddress: "Add address",
    notifications: "Notifications",
    newMessages: "{{count}} new messages",
    invitations: "Store Invitations",
    storeInvites: "{{count}} store invites",
    view: "View",

    recentOrders: "Recent Orders",
    viewAllOrders: "View all orders",
    noRecentOrders: "No recent orders yet",
    noRecentOrdersDesc: "Your latest purchases will appear here.",
    startShopping: "Start shopping",

    tableOrderId: "ORDER ID",
    tableDateTime: "DATE & TIME",
    tableMethod: "METHOD",
    tableStatus: "STATUS",
    tableShipping: "SHIPPING",
    tableTotal: "TOTAL",
    tableAction: "ACTION",

    statusWaitingPayment: "Waiting Payment",
    statusProcessing: "Processing",
    statusInDelivery: "In Delivery",
    statusDelivered: "Delivered",
    statusCompleted: "Completed",
    statusCancelled: "Cancelled",
    statusExpired: "Expired",
    statusFailed: "Failed",
    statusPending: "Pending",
    statusUnderReview: "Under Review",

    appStatusActive: "Active",
    appStatusReady: "Ready",
    appStatusCancelled: "Cancelled",
    appStatusRevision: "Revision Needed",
    appStatusUnderReview: "Under Review",
    appStatusDraft: "Draft",
    appStatusNotPublic: "Not Public",
    appStatusPublic: "Public",

    descCancelled: "This application was cancelled.",
    descReady: "Your seller access is ready. Open workspace to manage your store.",
    descDefault: "Complete the required details before you submit.",

    needHelp: "Need Help?",
    helpSubtitle: "Customer Support & Hub: +62821-8866-824 (24/7 Available)",
    contactSupport: "Contact Support",
  },
  id: {
    overviewTag: "RINGKASAN AKUN",
    dashboardTitle: "Dashboard",
    welcome: "Selamat datang kembali, {{name}}. Berikut ringkasan aktivitas akun Anda.",
    totalOrders: "Total Pesanan",
    allOrders: "Semua pesanan",
    pendingOrders: "Menunggu Diproses",
    awaitingAction: "Menunggu tindakan",
    processingOrders: "Sedang Diproses",
    inProgress: "Sedang berjalan",
    completedOrders: "Pesanan Selesai",
    done: "Selesai",

    startSelling: "Mulai Berjualan",
    startSellingDesc: "Lengkapi data toko Anda dan ajukan untuk ditinjau.",
    readyWhenYouAre: "Siap kapan pun Anda siap",
    fieldsCompleted: "{{completed}} dari {{total}} kolom selesai",
    openWorkspace: "Buka Workspace",
    startApplication: "Mulai Berjualan",
    continueApplication: "Lanjutkan Pendaftaran",
    reviewResubmit: "Tinjau & Kirim Ulang",
    viewApplication: "Lihat Pendaftaran",
    viewDetails: "Lihat Detail",
    lastUpdated: "Terakhir diperbarui",
    noApplicationStarted: "Belum ada pendaftaran",

    wishlist: "Favorit",
    browseSavedItems: "Lihat produk tersimpan",
    savedItemsCount: "{{count}} produk tersimpan",
    addresses: "Alamat Pengiriman",
    addressesSaved: "{{count}} tersimpan",
    addAddress: "Tambah alamat",
    notifications: "Notifikasi",
    newMessages: "{{count}} pesan baru",
    invitations: "Undangan Toko",
    storeInvites: "{{count}} undangan toko",
    view: "Lihat",

    recentOrders: "Pesanan Terbaru",
    viewAllOrders: "Lihat semua pesanan",
    noRecentOrders: "Belum ada pesanan terbaru",
    noRecentOrdersDesc: "Pesanan terbaru Anda akan muncul di sini.",
    startShopping: "Mulai belanja",

    tableOrderId: "ID PESANAN",
    tableDateTime: "TANGGAL & WAKTU",
    tableMethod: "METODE",
    tableStatus: "STATUS",
    tableShipping: "ONGKIR",
    tableTotal: "TOTAL",
    tableAction: "AKSI",

    statusWaitingPayment: "Menunggu Pembayaran",
    statusProcessing: "Sedang Diproses",
    statusInDelivery: "Dalam Pengiriman",
    statusDelivered: "Terkirim",
    statusCompleted: "Selesai",
    statusCancelled: "Dibatalkan",
    statusExpired: "Kedaluwarsa",
    statusFailed: "Gagal",
    statusPending: "Menunggu",
    statusUnderReview: "Sedang Ditinjau",

    appStatusActive: "Aktif",
    appStatusReady: "Siap",
    appStatusCancelled: "Dibatalkan",
    appStatusRevision: "Perlu Revisi",
    appStatusUnderReview: "Sedang Ditinjau",
    appStatusDraft: "Draf",
    appStatusNotPublic: "Belum Publik",
    appStatusPublic: "Publik",

    descCancelled: "Pendaftaran toko ini telah dibatalkan.",
    descReady: "Akses penjual Anda telah siap. Buka workspace untuk mengelola toko.",
    descDefault: "Lengkapi informasi yang diperlukan sebelum mengirimkan.",

    needHelp: "Butuh Bantuan?",
    helpSubtitle: "Layanan Pelanggan & Hub: +62821-8866-824 (Tersedia 24/7)",
    contactSupport: "Hubungi Bantuan",
  },
};

const localizeOrderStatus = (truthStatus, isId) => {
  const dict = isId ? DASHBOARD_I18N.id : DASHBOARD_I18N.en;
  const raw = `${truthStatus?.code || ""} ${truthStatus?.label || ""} ${truthStatus?.bucket || ""}`.toLowerCase();

  if (/awaiting_payment|waiting payment|action_required/.test(raw)) return dict.statusWaitingPayment;
  if (/under_review|review/.test(raw)) return dict.statusUnderReview;
  if (/shipping|in_delivery|delivery/.test(raw)) return dict.statusInDelivery;
  if (/delivered/.test(raw)) return dict.statusDelivered;
  if (/complete|paid|final/.test(raw)) return dict.statusCompleted;
  if (/cancel/.test(raw)) return dict.statusCancelled;
  if (/expire/.test(raw)) return dict.statusExpired;
  if (/fail/.test(raw)) return dict.statusFailed;
  if (/process|in_progress|ready/.test(raw)) return dict.statusProcessing;
  return isId ? (truthStatus?.label || dict.statusPending) : (truthStatus?.label || "Pending");
};

const localizeAppStatusLabel = (label, isId) => {
  if (!label) return null;
  const dict = isId ? DASHBOARD_I18N.id : DASHBOARD_I18N.en;
  const lower = String(label).toLowerCase();
  if (/active/.test(lower)) return dict.appStatusActive;
  if (/ready/.test(lower)) return dict.appStatusReady;
  if (/cancel/.test(lower)) return dict.appStatusCancelled;
  if (/revision/.test(lower)) return dict.appStatusRevision;
  if (/review|submitted/.test(lower)) return dict.appStatusUnderReview;
  if (/draft/.test(lower)) return dict.appStatusDraft;
  if (/not public/.test(lower)) return dict.appStatusNotPublic;
  if (/public/.test(lower)) return dict.appStatusPublic;
  return label;
};

function StatusPill({ label, tone = "neutral" }) {
  if (!label) return null;
  return <span className={`tp-status-pill tp-status-pill--${tone}`}>{label}</span>;
}

function DashboardSkeleton({ rows = 1 }) {
  return (
    <div className="tp-dashboard-skeleton" aria-label="Loading dashboard data" aria-busy="true">
      {Array.from({ length: rows }).map((_, index) => <span key={index} />)}
    </div>
  );
}

function StatCard({ label, value, hint, Icon, tone, loading }) {
  return (
    <article className="tp-dashboard-stat">
      <span className={`tp-dashboard-icon tp-dashboard-icon--${tone}`}><Icon aria-hidden="true" /></span>
      <div className="tp-dashboard-stat__info">
        <p className="tp-dashboard-stat__label">{label}</p>
        <strong className="tp-dashboard-stat__val">{loading ? "–" : asNumber(value)}</strong>
        <span className="tp-dashboard-stat__hint">{hint}</span>
      </div>
    </article>
  );
}

function resolveStoreActions(onboarding, isId) {
  const dict = isId ? DASHBOARD_I18N.id : DASHBOARD_I18N.en;
  if (onboarding?.workspaceHref) {
    return {
      primary: dict.openWorkspace,
      primaryHref: onboarding.workspaceHref,
      secondary: dict.viewApplication,
      hasSecondary: true,
    };
  }
  const status = String(onboarding?.status || "").toLowerCase();
  if (!onboarding?.hasApplication) {
    return {
      primary: dict.startApplication,
      primaryHref: "/user/store-application",
      secondary: null,
      hasSecondary: false,
    };
  }
  if (status === "revision_requested") {
    return {
      primary: onboarding?.workflow?.canResubmit ? dict.reviewResubmit : dict.continueApplication,
      primaryHref: "/user/store-application",
      secondary: null,
      hasSecondary: false,
    };
  }
  if (status === "draft") {
    return {
      primary: dict.continueApplication,
      primaryHref: "/user/store-application",
      secondary: null,
      hasSecondary: false,
    };
  }
  return {
    primary: dict.viewApplication,
    primaryHref: "/user/store-application",
    secondary: null,
    hasSecondary: false,
  };
}

function StoreApplicationCard({ onboarding = {}, loading, isId }) {
  const dict = isId ? DASHBOARD_I18N.id : DASHBOARD_I18N.en;
  if (loading) return <article className="tp-store-card"><DashboardSkeleton rows={5} /></article>;

  const total = Math.max(0, asNumber(onboarding.totalFields));
  const completed = Math.min(total || Infinity, Math.max(0, asNumber(onboarding.completedFields)));
  const percent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
  const actions = resolveStoreActions(onboarding, isId);

  // Localize description if known standard text
  let description = onboarding.description;
  if (String(onboarding.status).toLowerCase() === "cancelled") {
    description = dict.descCancelled;
  } else if (onboarding.workspaceHref) {
    description = dict.descReady;
  } else if (!description || description.includes("Complete your store details") || description.includes("Complete the required details")) {
    description = dict.startSellingDesc;
  }

  return (
    <article className="tp-store-card">
      <div className="tp-store-card__content">
        <div className="tp-store-card__heading">
          <span className="tp-dashboard-icon tp-dashboard-icon--navy"><Store aria-hidden="true" /></span>
          <div className="tp-store-card__header-text">
            <div className="tp-store-card__title">
              <h2>{dict.startSelling}</h2>
              <StatusPill
                label={localizeAppStatusLabel(onboarding.applicationStatus?.label, isId)}
                tone={
                  onboarding.applicationStatus?.tone === "rose"
                    ? "danger"
                    : onboarding.applicationStatus?.tone === "emerald"
                    ? "success"
                    : onboarding.applicationStatus?.tone === "sky"
                    ? "info"
                    : onboarding.applicationStatus?.tone === "warning" || onboarding.applicationStatus?.tone === "amber"
                    ? "warning"
                    : "neutral"
                }
              />
              <StatusPill
                label={localizeAppStatusLabel(onboarding.readinessStatus?.label, isId)}
                tone={onboarding.readinessStatus?.tone === "emerald" ? "success" : "neutral"}
              />
            </div>
            <p>{description}</p>
          </div>
        </div>

        <div className="tp-store-card__progress">
          <strong>
            {total
              ? dict.fieldsCompleted.replace("{{completed}}", completed).replace("{{total}}", total)
              : dict.readyWhenYouAre}
          </strong>
          <span aria-label={`${percent}% complete`}><i style={{ width: `${percent}%` }} /></span>
        </div>

        <div className="tp-store-card__actions">
          <Link className="tp-dashboard-button tp-dashboard-button--primary" to={actions.primaryHref}>
            {actions.primary}<ArrowRight aria-hidden="true" />
          </Link>
          {actions.hasSecondary && (
            <Link className="tp-dashboard-button tp-dashboard-button--secondary" to="/user/store-application">
              {actions.secondary}
            </Link>
          )}
        </div>

        <div className="tp-store-card__updated">
          <CalendarDays aria-hidden="true" />
          {onboarding.updatedAt
            ? `${dict.lastUpdated}: ${formatDateTime(onboarding.updatedAt, isId)}`
            : dict.noApplicationStarted}
        </div>
      </div>

      <div className="tp-store-card__visual" aria-hidden="true">
        <div className="tp-store-card__visual-art">
          <div className="tp-store-card__visual-glow" />
          <div className="tp-store-card__visual-badge">
            <Store className="tp-store-card__visual-store" />
            <ShieldCheck className="tp-store-card__visual-shield" />
          </div>
        </div>
      </div>
    </article>
  );
}

function QuickAction({ label, value, href, Icon, tone, isId }) {
  const dict = isId ? DASHBOARD_I18N.id : DASHBOARD_I18N.en;
  return (
    <Link className="tp-quick-action" to={href} aria-label={`${label}: ${value}`}>
      <span className={`tp-dashboard-icon tp-dashboard-icon--${tone}`}><Icon aria-hidden="true" /></span>
      <div>
        <strong>{label}</strong>
        <span>{value}</span>
      </div>
      <em>{dict.view} <ArrowRight aria-hidden="true" /></em>
    </Link>
  );
}

function RecentOrders({ orders = [], loading, isId }) {
  const dict = isId ? DASHBOARD_I18N.id : DASHBOARD_I18N.en;

  return (
    <section className="tp-recent-orders" aria-labelledby="tp-recent-orders-title">
      <div className="tp-recent-orders__heading">
        <h2 id="tp-recent-orders-title">{dict.recentOrders}</h2>
        <Link to="/user/my-orders" className="tp-recent-orders__viewall">
          {dict.viewAllOrders} <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      {loading ? (
        <DashboardSkeleton rows={3} />
      ) : orders.length === 0 ? (
        <div className="tp-recent-orders__empty">
          <ShoppingBag aria-hidden="true" />
          <div>
            <strong>{dict.noRecentOrders}</strong>
            <span>{dict.noRecentOrdersDesc}</span>
          </div>
          <Link to="/shop" className="tp-dashboard-button tp-dashboard-button--primary">
            {dict.startShopping} <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="tp-recent-orders__scroll">
          <table>
            <thead>
              <tr>
                <th>{dict.tableOrderId}</th>
                <th>{dict.tableDateTime}</th>
                <th>{dict.tableMethod}</th>
                <th>{dict.tableStatus}</th>
                <th>{dict.tableShipping}</th>
                <th>{dict.tableTotal}</th>
                <th>{dict.tableAction}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(({ order = {}, truthStatus = {} }) => {
                const orderId = order.id;
                const reference = getPublicOrderRef(order) || (orderId ? `#${orderId}` : "Order");
                const shipping = order.shipping ?? order.shippingAmount ?? order.deliveryFee ?? null;
                const total = order.totalAmount ?? order.total ?? 0;
                const detailHref = orderId ? `/user/my-orders/${encodeURIComponent(orderId)}` : null;
                const statusLabel = localizeOrderStatus(truthStatus, isId);

                return (
                  <tr key={orderId || reference}>
                    <td data-label="Order ID" className="tp-order-ref-cell">{reference}</td>
                    <td data-label="Date & Time">{formatDateTime(getOrderDateValue(order), isId)}</td>
                    <td data-label="Method">{order.paymentMethod || order.method || "–"}</td>
                    <td data-label="Status">
                      <StatusPill label={statusLabel} tone={getOrderTone(truthStatus)} />
                    </td>
                    <td data-label="Shipping">{shipping == null || shipping === "" ? "–" : money(shipping)}</td>
                    <td data-label="Total" className="tp-order-total-cell">{money(total)}</td>
                    <td data-label="Action">
                      {detailHref ? (
                        <Link className="tp-recent-orders__view" to={detailHref} aria-label={`View order ${reference}`}>
                          <Eye aria-hidden="true" />
                        </Link>
                      ) : (
                        "–"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AccountDashboard2026View({
  user,
  stats = {},
  recentOrders = [],
  onboarding = {},
  notificationCount = 0,
  invitationCount = 0,
  addressCount = 0,
  isOrdersLoading = false,
  isOnboardingLoading = false,
  errors = [],
}) {
  const { i18n } = useTranslation();

  // Reactive language detection state that reacts immediately to i18n change or storage event
  const [activeLang, setActiveLang] = useState(() => i18n.language || "en");
  const [wishlistCount, setWishlistCount] = useState(() => {
    try {
      return readWishlistItems().length;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const handleLanguageChanged = (lng) => {
      setActiveLang(lng);
    };
    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) setActiveLang(e.detail.isoCode);
    };
    const handleStorage = () => {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia") setActiveLang("id");
      else if (stored === "English") setActiveLang("en");
      else setActiveLang(i18n.language || "en");
      try {
        setWishlistCount(readWishlistItems().length);
      } catch {
        // ignore
      }
    };
    const handleWishlistChange = () => {
      try {
        setWishlistCount(readWishlistItems().length);
      } catch {
        // ignore
      }
    };

    i18n.on("languageChanged", handleLanguageChanged);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", handleStorage);
    window.addEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChange);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(WISHLIST_CHANGED_EVENT, handleWishlistChange);
    };
  }, [i18n]);

  const isId = useMemo(() => {
    if (activeLang?.startsWith("id")) return true;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia") return true;
      const i18nLng = localStorage.getItem("i18nextLng");
      if (i18nLng?.startsWith("id")) return true;
    }
    return false;
  }, [activeLang]);

  const dict = isId ? DASHBOARD_I18N.id : DASHBOARD_I18N.en;
  const name = user?.name || user?.fullName || user?.email?.split("@")[0] || "User";

  const statCards = [
    [dict.totalOrders, stats.total, dict.allOrders, ShoppingBag, "navy"],
    [dict.pendingOrders, stats.pending, dict.awaitingAction, Clock3, "orange"],
    [dict.processingOrders, stats.processing, dict.inProgress, Truck, "navy-soft"],
    [dict.completedOrders, stats.completed, dict.done, CheckCircle2, "emerald"],
  ];

  const quickLinks = [
    [
      dict.wishlist,
      wishlistCount > 0
        ? dict.savedItemsCount.replace("{{count}}", wishlistCount)
        : dict.browseSavedItems,
      "/wishlist",
      Heart,
      "navy",
    ],
    [
      dict.addresses,
      addressCount
        ? dict.addressesSaved.replace("{{count}}", addressCount)
        : dict.addAddress,
      "/user/shipping-address",
      MapPin,
      "navy-soft",
    ],
    [
      dict.notifications,
      dict.newMessages.replace("{{count}}", asNumber(notificationCount)),
      "/user/notifications",
      Bell,
      "orange",
    ],
    [
      dict.invitations,
      dict.storeInvites.replace("{{count}}", asNumber(invitationCount)),
      "/user/store-invitations",
      Store,
      "navy",
    ],
  ];

  return (
    <div className="tp-account-dashboard-2026">
      {/* Header & Greeting */}
      <header className="tp-account-dashboard-2026__heading">
        <span className="tp-account-dashboard-2026__badge">{dict.overviewTag}</span>
        <h1>{dict.dashboardTitle}</h1>
        <p>{dict.welcome.replace("{{name}}", name)}</p>
      </header>

      {errors.length > 0 ? (
        <div className="tp-account-dashboard-2026__alert" role="status">
          {errors.join(" ")}
        </div>
      ) : null}

      {/* 4 Stat Cards */}
      <section className="tp-account-dashboard-2026__stats" aria-label="Order summary">
        {statCards.map(([label, value, hint, Icon, tone]) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            hint={hint}
            Icon={Icon}
            tone={tone}
            loading={isOrdersLoading}
          />
        ))}
      </section>

      {/* Middle Section: Store Application & Quick Actions */}
      <section className="tp-account-dashboard-2026__middle">
        <StoreApplicationCard onboarding={onboarding} loading={isOnboardingLoading} isId={isId} />
        <div className="tp-account-dashboard-2026__quick" aria-label="Quick account links">
          {quickLinks.map(([label, value, href, Icon, tone]) => (
            <QuickAction
              key={label}
              label={label}
              value={value}
              href={href}
              Icon={Icon}
              tone={tone}
              isId={isId}
            />
          ))}
        </div>
      </section>

      {/* Recent Orders Section */}
      <RecentOrders orders={recentOrders} loading={isOrdersLoading} isId={isId} />

      {/* 24/7 Help & Support Banner */}
      <aside className="tp-account-dashboard-2026__help">
        <div className="tp-account-dashboard-2026__help-icon">
          <Headphones aria-hidden="true" />
        </div>
        <div className="tp-account-dashboard-2026__help-content">
          <strong>{dict.needHelp}</strong>
          <span>{dict.helpSubtitle}</span>
        </div>
        <Link to="/contact-us?topic=account" className="tp-dashboard-button tp-dashboard-button--help">
          {dict.contactSupport} <ArrowRight aria-hidden="true" />
        </Link>
      </aside>
    </div>
  );
}
