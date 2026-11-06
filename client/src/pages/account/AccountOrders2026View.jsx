import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  Package,
  RotateCcw,
  Search,
  Store,
  Truck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/format.js";
import "./account-orders-2026.css";

const MY_ORDERS_I18N = {
  en: {
    title: "My Orders",
    subtitle: "Track and manage all your orders in one place.",
    filterAll: "All Orders",
    filterPending: "Pending",
    filterProcessing: "Processing",
    filterCompleted: "Completed",
    filterCancelled: "Cancelled",
    searchPlaceholder: "Search order ID or store...",
    allStatuses: "All statuses",
    clearBtn: "Clear",
    copy: "Copy",
    copied: "Copied!",
    payment: "Payment",
    shipping: "Shipping",
    status: "Status",
    totalAmount: "Total Amount",
    viewDetails: "View Details",
    continuePayment: "Pay Now",
    store: "Store",
    unknownStatus: "Unknown",
    unpaid: "Unpaid",
    emptyTitle: "No matching orders found",
    emptyTitleNoFilter: "No orders yet",
    emptyDesc: "Try adjusting your search, status, or date filters.",
    emptyDescNoFilter: "Your order history will appear here once you make a purchase.",
    clearFilters: "Clear filters",
    startShopping: "Start Shopping",
    authError: "Please log in again to view your orders.",
    loadError: "Failed to load orders.",
    showing: "Showing {{start}} to {{end}} of {{total}} orders",
    matching: ", {{count}} matching on this page",
    supportTitle: "Need assistance? Call +62 821-8866-824",
    supportDesc: "Customer support is ready to help you.",
  },
  id: {
    title: "Pesanan Saya",
    subtitle: "Lacak dan kelola semua pesanan Anda dalam satu tempat.",
    filterAll: "Semua Pesanan",
    filterPending: "Menunggu",
    filterProcessing: "Diproses",
    filterCompleted: "Selesai",
    filterCancelled: "Dibatalkan",
    searchPlaceholder: "Cari ID pesanan atau toko...",
    allStatuses: "Semua status",
    clearBtn: "Reset",
    copy: "Salin",
    copied: "Tersalin!",
    payment: "Pembayaran",
    shipping: "Pengiriman",
    status: "Status",
    totalAmount: "Total Belanja",
    viewDetails: "Lihat Detail",
    continuePayment: "Bayar Sekarang",
    store: "Toko",
    unknownStatus: "Tidak diketahui",
    unpaid: "Belum Bayar",
    emptyTitle: "Tidak ada pesanan yang sesuai",
    emptyTitleNoFilter: "Belum ada pesanan",
    emptyDesc: "Coba sesuaikan pencarian, status, atau filter tanggal.",
    emptyDescNoFilter: "Riwayat pesanan Anda akan muncul di sini setelah berbelanja.",
    clearFilters: "Hapus filter",
    startShopping: "Mulai Belanja",
    authError: "Silakan masuk kembali untuk melihat pesanan Anda.",
    loadError: "Gagal memuat pesanan.",
    showing: "Menampilkan {{start}} sampai {{end}} dari {{total}} pesanan",
    matching: ", {{count}} cocok di halaman ini",
    supportTitle: "Butuh bantuan? Hubungi +62 821-8866-824",
    supportDesc: "Layanan bantuan pelanggan siap mendampingi Anda.",
  },
};

const formatDateTime = (value, isIndo) => {
  if (!value) return { date: "-", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };
  const locale = isIndo ? "id-ID" : "en-US";
  return {
    date: new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: !isIndo,
    }).format(date),
  };
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPageNumbers = (page, totalPages) => {
  const size = Math.min(5, totalPages);
  let start = Math.max(1, page - Math.floor(size / 2));
  const end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

function LoadingCards() {
  return (
    <div className="tp-orders-2026__loading" aria-label="Loading orders">
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function FilterTab({ filter, count, isActive, onClick }) {
  return (
    <button
      type="button"
      className={`tp-orders-filter-tab${isActive ? " is-active" : ""}`}
      onClick={onClick}
    >
      <span>{filter.label}</span>
      <strong>{count || 0}</strong>
    </button>
  );
}

function StatusPill({ status }) {
  return (
    <span
      className={`tp-orders-status tp-orders-status--${status.tone || "neutral"}`}
    >
      <i aria-hidden="true" />
      {status.label}
    </span>
  );
}

function PaymentPill({ payment }) {
  return (
    <span
      className={`tp-orders-payment-pill tp-orders-payment-pill--${
        payment.tone || "neutral"
      }`}
    >
      {payment.label}
    </span>
  );
}

function OrderCard({ order, LinkComponent, t, isIndo }) {
  const [copied, setCopied] = useState(false);
  const placed = formatDateTime(order.date || order.createdAt, isIndo);
  const status = order.status || {
    label: t.unknownStatus,
    tone: "neutral",
    bucket: "pending",
  };
  const paymentState = order.paymentState || order.payment || {
    label: t.unpaid,
    tone: "neutral",
  };
  const storeDisplay = order.primaryStoreName || (order.storeNames && order.storeNames[0]) || null;
  const rawId = String(order.displayId || order.reference || "");

  const handleCopy = (e) => {
    e.stopPropagation();
    const cleanId = rawId.replace(/^#/, "");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(cleanId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <article className={`tp-order-card tp-order-card--${status.tone || "neutral"}`}>
      <div className="tp-order-card__identity">
        <span className="tp-order-card__icon" aria-hidden="true">
          <Package />
        </span>
        <div className="tp-order-card__main">
          <div className="tp-order-card__ref-row">
            <h2 className="tp-order-card__ref" title={rawId}>
              {rawId}
            </h2>
            <button
              type="button"
              className="tp-order-card__copy-btn"
              onClick={handleCopy}
              title={copied ? t.copied : t.copy}
              aria-label={copied ? t.copied : t.copy}
            >
              {copied ? <Check size={13} className="tp-order-card__copy-success" /> : <Copy size={13} />}
              <span className="tp-order-card__copy-tooltip">{copied ? t.copied : t.copy}</span>
            </button>
          </div>
          <p className="tp-order-card__date">
            {placed.date}
            {placed.time ? (
              <>
                <i aria-hidden="true" />
                {placed.time}
              </>
            ) : null}
          </p>
          <div className="tp-order-card__store-row">
            <span className="tp-order-card__store-pill">
              <Store size={12} aria-hidden="true" />
              <span>{storeDisplay || t.store}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="tp-order-card__payment">
        <div>
          <CreditCard aria-hidden="true" />
          <span>
            <small>{t.payment}</small>
            <strong>{order.paymentMethod}</strong>
          </span>
        </div>
        <div>
          <Truck aria-hidden="true" />
          <span>
            <small>{t.shipping}</small>
            <strong>{formatCurrency(order.shipping ?? order.shippingAmount)}</strong>
          </span>
        </div>
      </div>

      <div className="tp-order-card__state">
        <small>{t.status}</small>
        <div className="tp-order-card__pills">
          <StatusPill status={status} />
          <PaymentPill payment={paymentState} />
        </div>
      </div>

      <div className="tp-order-card__total">
        <small>{t.totalAmount}</small>
        <strong>{formatCurrency(order.total ?? order.totalAmount)}</strong>
      </div>

      <div className="tp-order-card__actions">
        {order.href ? (
          <LinkComponent className="tp-order-card__cta" to={order.href}>
            {t.viewDetails}
          </LinkComponent>
        ) : null}
        {order.paymentAction?.path ? (
          <LinkComponent className="tp-order-card__payment-cta" to={order.paymentAction.path}>
            {order.paymentAction.label || t.continuePayment}
          </LinkComponent>
        ) : null}
      </div>
    </article>
  );
}

function EmptyOrders({ hasFilters, onClearFilters, LinkComponent, t }) {
  return (
    <div className="tp-orders-2026__empty">
      <Package aria-hidden="true" />
      <h2>{hasFilters ? t.emptyTitle : t.emptyTitleNoFilter}</h2>
      <p>{hasFilters ? t.emptyDesc : t.emptyDescNoFilter}</p>
      {hasFilters ? (
        <button type="button" onClick={onClearFilters}>
          {t.clearFilters}
        </button>
      ) : (
        <LinkComponent to="/shop">{t.startShopping}</LinkComponent>
      )}
    </div>
  );
}

export default function AccountOrders2026View({
  LinkComponent,
  orders,
  counts,
  page,
  pageSize,
  totalPages,
  totalOrders,
  isLoading,
  error,
  onPageChange,
  isIndo: isIndoProp,
  cartSummary,
}) {
  const { i18n } = useTranslation();
  const [langCode, setLangCode] = useState(() => {
    if (typeof isIndoProp === "boolean") return isIndoProp ? "id" : "en";
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia" || stored === "id") return "id";
    }
    const current = i18n?.language || "";
    return current.toLowerCase().startsWith("id") ? "id" : "en";
  });

  useEffect(() => {
    if (typeof isIndoProp === "boolean") {
      setLangCode(isIndoProp ? "id" : "en");
    }
  }, [isIndoProp]);

  useEffect(() => {
    const handleLangChange = () => {
      let code = "en";
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("store_language");
        if (stored === "Indonesia" || stored === "id") code = "id";
        else if (i18n?.language?.toLowerCase().startsWith("id")) code = "id";
      }
      setLangCode(code);
    };

    i18n?.on?.("languageChanged", handleLangChange);
    window.addEventListener("storage", handleLangChange);
    return () => {
      i18n?.off?.("languageChanged", handleLangChange);
      window.removeEventListener("storage", handleLangChange);
    };
  }, [i18n]);

  const isIndo = langCode === "id";
  const t = isIndo ? MY_ORDERS_I18N.id : MY_ORDERS_I18N.en;

  const FILTERS = useMemo(
    () => [
      { code: "all", label: t.filterAll },
      { code: "pending", label: t.filterPending },
      { code: "processing", label: t.filterProcessing },
      { code: "completed", label: t.filterCompleted },
      { code: "cancelled", label: t.filterCancelled },
    ],
    [t]
  );

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState("all");
  const [dateValue, setDateValue] = useState("");
  const normalizedSearch = searchValue.trim().toLowerCase();
  const effectiveStatus = statusValue !== "all" ? statusValue : activeFilter;
  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = useMemo(
    () =>
      safeOrders.filter((order) => {
        if (effectiveStatus !== "all" && order.status?.bucket !== effectiveStatus) {
          return false;
        }
        if (normalizedSearch) {
          const searchable = [
            order.displayId,
            order.reference,
            order.primaryStoreName,
            order.status?.label,
            order.paymentState?.label,
            order.payment?.label,
            order.paymentMethod,
            order.storeMode,
            order.checkoutMode?.label,
            ...(Array.isArray(order.storeNames) ? order.storeNames : []),
          ]
            .join(" ")
            .toLowerCase();
          if (!searchable.includes(normalizedSearch)) return false;
        }
        if (dateValue && toDateInputValue(order.date || order.createdAt) !== dateValue) {
          return false;
        }
        return true;
      }),
    [dateValue, effectiveStatus, normalizedSearch, safeOrders]
  );
  const pageNumbers = getPageNumbers(page, totalPages);
  const firstVisible = totalOrders === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(totalOrders, (page - 1) * pageSize + safeOrders.length);
  const clearFilters = () => {
    setActiveFilter("all");
    setStatusValue("all");
    setSearchValue("");
    setDateValue("");
  };
  const hasFilters =
    activeFilter !== "all" ||
    statusValue !== "all" ||
    Boolean(normalizedSearch) ||
    Boolean(dateValue);

  return (
    <section className="tp-orders-2026 tporders2026-root">
      <header className="tp-orders-2026__heading">
        <h1>{t.title}</h1>
        <p>{t.subtitle}</p>
      </header>

      <div className="tp-orders-2026__tabs" aria-label="Order status filters">
        {FILTERS.map((filter) => (
          <FilterTab
            filter={filter}
            count={counts?.[filter.code] || 0}
            isActive={activeFilter === filter.code}
            onClick={() => {
              setActiveFilter(filter.code);
              setStatusValue("all");
            }}
            key={filter.code}
          />
        ))}
      </div>

      <div className="tp-orders-toolbar">
        <label className="tp-orders-toolbar__field tp-orders-toolbar__search">
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={t.searchPlaceholder}
          />
          <Search aria-hidden="true" />
        </label>

        <label className="tp-orders-toolbar__field tp-orders-toolbar__select">
          <select
            value={statusValue}
            onChange={(event) => {
              setStatusValue(event.target.value);
              if (event.target.value !== "all") setActiveFilter("all");
            }}
            aria-label="Filter by status"
          >
            <option value="all">{t.allStatuses}</option>
            {FILTERS.slice(1).map((filter) => (
              <option value={filter.code} key={filter.code}>
                {filter.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" />
        </label>

        <label className="tp-orders-toolbar__field tp-orders-toolbar__date">
          <CalendarDays aria-hidden="true" />
          <input
            type="date"
            value={dateValue}
            onChange={(event) => setDateValue(event.target.value)}
            aria-label="Filter by order date"
          />
        </label>

        <button
          type="button"
          className="tp-orders-toolbar__clear"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          <RotateCcw aria-hidden="true" />
          {t.clearBtn}
        </button>
      </div>

      {error ? (
        <div className="tp-orders-2026__alert" role="alert">
          {error?.response?.status === 401
            ? t.authError
            : error?.response?.data?.message || error?.message || t.loadError}
        </div>
      ) : isLoading ? (
        <LoadingCards />
      ) : filteredOrders.length === 0 ? (
        <EmptyOrders
          hasFilters={hasFilters}
          onClearFilters={clearFilters}
          LinkComponent={LinkComponent}
          t={t}
        />
      ) : (
        <div className="tp-orders-2026__list">
          {filteredOrders.map((order) => (
            <OrderCard
              order={order}
              LinkComponent={LinkComponent}
              key={order.id || order.displayId || order.reference}
              t={t}
              isIndo={isIndo}
            />
          ))}
        </div>
      )}

      {!error && !isLoading && totalOrders > 0 && filteredOrders.length > 0 ? (
        <footer className="tp-orders-2026__pagination">
          <p>
            {t.showing
              .replace("{{start}}", String(hasFilters ? 1 : firstVisible))
              .replace("{{end}}", String(hasFilters ? filteredOrders.length : lastVisible))
              .replace("{{total}}", String(hasFilters ? filteredOrders.length : totalOrders))}
            {hasFilters && totalOrders !== filteredOrders.length
              ? t.matching.replace("{{count}}", String(filteredOrders.length))
              : ""}
          </p>
          <nav aria-label="Order pagination">
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Previous page"
            >
              <ArrowLeft aria-hidden="true" />
            </button>
            {pageNumbers.map((pageNumber) => (
              <button
                type="button"
                className={pageNumber === page ? "is-active" : ""}
                onClick={() => onPageChange(pageNumber)}
                aria-current={pageNumber === page ? "page" : undefined}
                key={pageNumber}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              aria-label="Next page"
            >
              <ArrowRight aria-hidden="true" />
            </button>
          </nav>
        </footer>
      ) : null}

      {cartSummary ? <aside className="tp-orders-2026__cart">{cartSummary}</aside> : null}
    </section>
  );
}
