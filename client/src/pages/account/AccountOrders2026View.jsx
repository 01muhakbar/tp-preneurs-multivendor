import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Eye,
  Package,
  Search,
  Store,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
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
    date: new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date),
    time: new Intl.DateTimeFormat("en-US", { timeStyle: "short" }).format(date),
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
  let end = Math.min(totalPages, start + size - 1);
  start = Math.max(1, end - size + 1);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

function LoadingCards() {
  return (
    <div className="tporders2026-loading" aria-label="Loading orders">
      {Array.from({ length: 3 }).map((_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`tporders2026-status tporders2026-status--${status.tone}`}>
      <i />
      {status.label}
    </span>
  );
}

function PaymentPill({ payment }) {
  return (
    <span className={`tporders2026-payment tporders2026-payment--${payment.tone}`}>
      {payment.label}
    </span>
  );
}

function OrderCard({ order, LinkComponent }) {
  const placed = formatDateTime(order.createdAt);

  return (
    <article className="tporders2026-order">
      <div className="tporders2026-order__summary">
        <div className="tporders2026-order__identity">
          <span className="tporders2026-order__icon">
            <Package aria-hidden="true" />
          </span>
          <div>
            <h2>{order.reference}</h2>
            <p>
              {placed.date}
              {placed.time ? <><i />{placed.time}</> : null}
            </p>
            <span className="tporders2026-mode">{order.checkoutMode.label}</span>
          </div>
        </div>

        <div className="tporders2026-order__status">
          <StatusPill status={order.status} />
          <PaymentPill payment={order.payment} />
          {order.payment.description ? <p>{order.payment.description}</p> : null}
        </div>

        <div className="tporders2026-order__total">
          <strong>{formatCurrency(order.totalAmount)}</strong>
          <span>Order total</span>
          {order.detailPath ? (
            <LinkComponent
              className="tporders2026-eye"
              to={order.detailPath}
              aria-label={`View order ${order.reference}`}
            >
              <Eye aria-hidden="true" />
            </LinkComponent>
          ) : null}
        </div>
      </div>

      <div className="tporders2026-order__details">
        <div>
          <Store aria-hidden="true" />
          <span>
            <small>Order</small>
            <strong>{order.reference}</strong>
          </span>
        </div>
        <div>
          <Truck aria-hidden="true" />
          <span>
            <small>Shipping</small>
            <strong>{formatCurrency(order.shippingAmount)}</strong>
          </span>
        </div>
        <div>
          <WalletCards aria-hidden="true" />
          <span>
            <small>Payment</small>
            <strong>{order.paymentMethod}</strong>
          </span>
        </div>
        {order.detailPath ? (
          <LinkComponent className="tporders2026-details-cta" to={order.detailPath}>
            View Order Details
            <ArrowRight aria-hidden="true" />
          </LinkComponent>
        ) : null}
      </div>
    </article>
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
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchValue, setSearchValue] = useState("");
  const [statusValue, setStatusValue] = useState("all");
  const [dateValue, setDateValue] = useState("");
  const normalizedSearch = searchValue.trim().toLowerCase();
  const effectiveStatus = statusValue !== "all" ? statusValue : activeFilter;
  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        if (effectiveStatus !== "all" && order.status.bucket !== effectiveStatus) {
          return false;
        }
        if (
          normalizedSearch &&
          ![
            order.reference,
            order.status.label,
            order.payment.label,
            order.paymentMethod,
            order.checkoutMode.label,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedSearch)
        ) {
          return false;
        }
        if (dateValue && toDateInputValue(order.createdAt) !== dateValue) return false;
        return true;
      }),
    [dateValue, effectiveStatus, normalizedSearch, orders]
  );
  const pageNumbers = getPageNumbers(page, totalPages);
  const firstVisible = totalOrders === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(totalOrders, (page - 1) * pageSize + orders.length);
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
    <section className="tporders2026-root">
      <header className="tporders2026-heading">
        <div>
          <h1>My Orders</h1>
          <p>Track and manage all your orders in one place.</p>
        </div>
      </header>

      <div className="tporders2026-tabs" aria-label="Order status filters">
        {FILTERS.map((filter) => (
          <button
            type="button"
            className={activeFilter === filter.code ? "is-active" : ""}
            onClick={() => {
              setActiveFilter(filter.code);
              setStatusValue("all");
            }}
            key={filter.code}
          >
            {filter.label}
            <span>{counts[filter.code] || 0}</span>
          </button>
        ))}
      </div>

      <div className="tporders2026-filter-row">
        <label className="tporders2026-search">
          <Search aria-hidden="true" />
          <input
            type="search"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search order"
          />
        </label>

        <label className="tporders2026-select">
          <select
            value={statusValue}
            onChange={(event) => {
              setStatusValue(event.target.value);
              if (event.target.value !== "all") setActiveFilter("all");
            }}
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            {FILTERS.slice(1).map((filter) => (
              <option value={filter.code} key={filter.code}>
                {filter.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" />
        </label>

        <label className="tporders2026-date">
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
          className="tporders2026-clear"
          onClick={clearFilters}
          disabled={!hasFilters}
        >
          <X aria-hidden="true" />
          Clear
        </button>
      </div>

      {error ? (
        <div className="tporders2026-alert" role="alert">
          {error?.response?.status === 401
            ? "Please sign in again to view your orders."
            : error?.response?.data?.message || error?.message || "Failed to load orders."}
        </div>
      ) : isLoading ? (
        <LoadingCards />
      ) : filteredOrders.length === 0 ? (
        <div className="tporders2026-empty">
          <Package aria-hidden="true" />
          <h2>{orders.length === 0 ? "No orders yet" : "No matching orders"}</h2>
          <p>
            {orders.length === 0
              ? "Your order history will appear here after checkout."
              : "Try another status, date, or order reference."}
          </p>
          {hasFilters ? (
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          ) : (
            <LinkComponent to="/search">Browse products</LinkComponent>
          )}
        </div>
      ) : (
        <div className="tporders2026-list">
          {filteredOrders.map((order) => (
            <OrderCard order={order} LinkComponent={LinkComponent} key={order.id || order.reference} />
          ))}
        </div>
      )}

      {!error && !isLoading && totalOrders > 0 ? (
        <footer className="tporders2026-pagination">
          <p>
            Showing {firstVisible} to {lastVisible} of {totalOrders} orders
            {hasFilters ? `, ${filteredOrders.length} matching this page` : ""}
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

      {cartSummary ? <aside className="tporders2026-cart">{cartSummary}</aside> : null}
    </section>
  );
}
