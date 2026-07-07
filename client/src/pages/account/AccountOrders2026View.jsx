import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  CreditCard,
  Eye,
  Headphones,
  Package,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatCurrency } from "../../utils/format.js";
import "./account-orders-2026.css";

const FILTERS = [
  { code: "all", label: "All Orders" },
  { code: "pending", label: "Pending" },
  { code: "processing", label: "Processing" },
  { code: "completed", label: "Completed" },
  { code: "cancelled", label: "Cancelled" },
];

const formatDateTime = (value) => {
  if (!value) return { date: "-", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: "-", time: "" };
  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
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

function OrderCard({ order, LinkComponent, t }) {
  const placed = formatDateTime(order.date || order.createdAt);
  const status = order.status || {
    label: t("orders.unknownStatus"),
    tone: "neutral",
    bucket: "pending",
  };
  const paymentState = order.paymentState || order.payment || {
    label: t("orders.unpaid"),
    tone: "neutral",
  };
  const storeSearchLabel = order.storeNames?.length
    ? order.storeNames.join(", ")
    : order.checkoutMode?.label || order.storeMode || t("orders.store");

  return (
    <article className={`tp-order-card tp-order-card--${status.tone || "neutral"}`}>
      <div className="tp-order-card__identity">
        <span className="tp-order-card__icon" aria-hidden="true">
          <Package />
        </span>
        <div className="tp-order-card__main">
          <h2>{order.displayId || order.reference}</h2>
          <p>
            {placed.date}
            {placed.time ? (
              <>
                <i aria-hidden="true" />
                {placed.time}
              </>
            ) : null}
          </p>
          <span className="tp-order-card__mode">
            {order.storeMode || order.checkoutMode?.shortLabel || t("orders.singleStore")}
          </span>
          <span className="tp-order-card__store">{storeSearchLabel}</span>
        </div>
      </div>

      <div className="tp-order-card__payment">
        <div>
          <CreditCard aria-hidden="true" />
          <span>
            <small>{t("orders.payment")}</small>
            <strong>{order.paymentMethod}</strong>
          </span>
        </div>
        <div>
          <Truck aria-hidden="true" />
          <span>
            <small>{t("orders.shipping")}</small>
            <strong>{formatCurrency(order.shipping ?? order.shippingAmount)}</strong>
          </span>
        </div>
      </div>

      <div className="tp-order-card__state">
        <small>{t("orders.status")}</small>
        <StatusPill status={status} />
        <PaymentPill payment={paymentState} />
        {order.note ? <p>{order.note}</p> : null}
      </div>

      <div className="tp-order-card__total">
        <small>{t("orders.totalAmount")}</small>
        <strong>{formatCurrency(order.total ?? order.totalAmount)}</strong>
      </div>

      <div className="tp-order-card__actions">
        {order.href ? (
          <LinkComponent className="tp-order-card__cta" to={order.href}>
            {t("orders.viewDetails")}
          </LinkComponent>
        ) : null}
        {order.paymentAction?.path ? (
          <LinkComponent className="tp-order-card__payment-cta" to={order.paymentAction.path}>
            {order.paymentAction.label || t("orders.payment")}
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
      <h2>{hasFilters ? t("orders.emptyTitle") : t("orders.emptyTitleNoFilter")}</h2>
      <p>
        {hasFilters
          ? t("orders.emptyDesc")
          : t("orders.emptyDescNoFilter")}
      </p>
      {hasFilters ? (
        <button type="button" onClick={onClearFilters}>
          {t("orders.clearFilters")}
        </button>
      ) : (
        <LinkComponent to="/shop">{t("orders.startShopping")}</LinkComponent>
      )}
    </div>
  );
}

function HelpCard({ t }) {
  return (
    <a className="tp-orders-2026__help" href="tel:+6599887766">
      <span aria-hidden="true">
        <Headphones />
      </span>
      <strong>{t("orders.needHelp")}</strong>
      <small>{t("orders.available247")}</small>
      <ArrowRight aria-hidden="true" />
    </a>
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
  cartSummary,
}) {
  const { t } = useTranslation();
  
  const FILTERS = useMemo(() => [
    { code: "all", label: t("orders.filterAll") },
    { code: "pending", label: t("orders.filterPending") },
    { code: "processing", label: t("orders.filterProcessing") },
    { code: "completed", label: t("orders.filterCompleted") },
    { code: "cancelled", label: t("orders.filterCancelled") },
  ], [t]);

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
        <h1>{t("orders.title")}</h1>
        <p>{t("orders.subtitle")}</p>
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
            placeholder={t("orders.searchPlaceholder")}
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
            <option value="all">{t("orders.allStatuses")}</option>
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
          {t("orders.clearBtn")}
        </button>
      </div>

      {error ? (
        <div className="tp-orders-2026__alert" role="alert">
          {error?.response?.status === 401
            ? t("orders.authError")
            : error?.response?.data?.message || error?.message || t("orders.loadError")}
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
            />
          ))}
        </div>
      )}

      {!error && !isLoading && totalOrders > 0 && filteredOrders.length > 0 ? (
        <footer className="tp-orders-2026__pagination">
          <p>
            {t("orders.showing", {
              start: hasFilters ? 1 : firstVisible,
              end: hasFilters ? filteredOrders.length : lastVisible,
              total: hasFilters ? filteredOrders.length : totalOrders,
            })}
            {hasFilters && totalOrders !== filteredOrders.length
              ? ` (${t("orders.matching", { count: filteredOrders.length })})`
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

      <HelpCard t={t} />
      {cartSummary ? <aside className="tp-orders-2026__cart">{cartSummary}</aside> : null}
    </section>
  );
}
