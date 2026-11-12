import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Box,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Grid2X2,
  List,
  PackageCheck,
  RotateCcw,
  Search,
  Truck,
  WalletCards,
  FolderOpen,
  FileText,
  X,
} from "lucide-react";
import "./SellerOrders2026View.css";
import {
  normalizeOrderRow,
  formatMoney,
} from "./sellerOrders2026Utils.js";

const SELLER_ORDERS_I18N = {
  en: {
    pageTitle: "Orders",
    pageSubtitle: "Manage and process customer orders.",
    storeReady: "Store Active",
    actions: "Actions",
    export: "Export CSV",
    metricPendingPayment: "Pending Payment",
    metricReadyToPack: "Ready to Pack",
    metricInTransit: "In Transit",
    metricDelivered: "Delivered",
    searchPlaceholder: "Search order, buyer, invoice, ID...",
    filterStatus: "Status",
    filterPayment: "Payment",
    filterFulfillment: "Fulfillment",
    filterCourier: "Courier",
    all: "All",
    statusAwaitingPayment: "Awaiting Payment",
    statusReadyToPack: "Ready to Pack",
    statusInTransit: "In Transit",
    statusDelivered: "Delivered",
    statusCancelled: "Cancelled",
    payUnpaid: "Unpaid",
    payPaid: "Paid",
    payFailed: "Failed",
    payCancelled: "Cancelled",
    payExpired: "Expired",
    fulUnfulfilled: "Unfulfilled",
    fulReadyToPack: "Ready to Pack",
    fulInTransit: "In Transit",
    fulDelivered: "Delivered",
    fulCancelled: "Cancelled",
    viewTable: "Table",
    viewGrid: "Grid",
    noOrdersTitle: "No orders found",
    noOrdersFiltered: "Try adjusting your search or filters.",
    noOrdersEmpty: "No orders have been placed for this store yet.",
    resetFilters: "Reset Filters",
    colOrder: "Order No.",
    colBuyer: "Buyer",
    colItems: "Items",
    colPayment: "Payment",
    colFulfillment: "Order Status",
    colTotal: "Total",
    colUpdated: "Date",
    colActions: "Action",
    copyOrderNumber: "Copy order number",
    copied: "Copied!",
    viewDetail: "Detail",
    itemCount: (count) => `${count} ${count === 1 ? "item" : "items"}`,
    paginationText: (from, to, total) => `Showing ${from}-${to} of ${total} orders`,
    unableToLoad: "Unable to load orders",
    retry: "Retry",
  },
  id: {
    pageTitle: "Pesanan Toko",
    pageSubtitle: "Kelola dan proses pesanan pelanggan toko Anda.",
    storeReady: "Toko Aktif",
    actions: "Aksi",
    export: "Ekspor CSV",
    metricPendingPayment: "Menunggu Pembayaran",
    metricReadyToPack: "Siap Dikemas",
    metricInTransit: "Dalam Pengiriman",
    metricDelivered: "Selesai",
    searchPlaceholder: "Cari pesanan, pembeli, invoice, ID...",
    filterStatus: "Status",
    filterPayment: "Pembayaran",
    filterFulfillment: "Pengiriman",
    filterCourier: "Kurir",
    all: "Semua",
    statusAwaitingPayment: "Menunggu Pembayaran",
    statusReadyToPack: "Siap Dikemas",
    statusInTransit: "Dalam Pengiriman",
    statusDelivered: "Selesai",
    statusCancelled: "Dibatalkan",
    payUnpaid: "Belum Bayar",
    payPaid: "Lunas",
    payFailed: "Gagal",
    payCancelled: "Dibatalkan",
    payExpired: "Kedaluwarsa",
    fulUnfulfilled: "Belum Diproses",
    fulReadyToPack: "Siap Dikemas",
    fulInTransit: "Dalam Pengiriman",
    fulDelivered: "Selesai",
    fulCancelled: "Dibatalkan",
    viewTable: "Tabel",
    viewGrid: "Grid",
    noOrdersTitle: "Tidak ada pesanan",
    noOrdersFiltered: "Coba ubah kata kunci atau filter.",
    noOrdersEmpty: "Belum ada pesanan masuk untuk toko ini.",
    resetFilters: "Reset Filter",
    colOrder: "No. Pesanan",
    colBuyer: "Pembeli",
    colItems: "Produk",
    colPayment: "Pembayaran",
    colFulfillment: "Status Pesanan",
    colTotal: "Total",
    colUpdated: "Tanggal",
    colActions: "Aksi",
    copyOrderNumber: "Salin nomor pesanan",
    copied: "Tersalin!",
    viewDetail: "Detail",
    itemCount: (count) => `${count} produk`,
    paginationText: (from, to, total) => `Menampilkan ${from}-${to} dari ${total} pesanan`,
    unableToLoad: "Gagal memuat pesanan",
    retry: "Coba Lagi",
  },
};

const generatePaginationArray = (currentPage, totalPages) => {
  const delta = 2;
  const range = [];
  for (
    let i = Math.max(2, currentPage - delta);
    i <= Math.min(totalPages - 1, currentPage + delta);
    i++
  ) {
    range.push(i);
  }
  if (currentPage - delta > 2) range.unshift("...");
  if (currentPage + delta < totalPages - 1) range.push("...");
  range.unshift(1);
  if (totalPages > 1) range.push(totalPages);
  return range;
};

export default function SellerOrders2026View({
  orders,
  query,
  changeQuery,
  view,
  setView,
  notice,
  summaryAmounts,
  exportOrders,
  resetFilters,
  copyOrderNumber,
  handleViewInvoice,
  isLoading,
  isError,
  error,
  refetch,
}) {
  const { i18n } = useTranslation();
  const [, setLangSyncCounter] = useState(0);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

  const isIndo = (() => {
    const lang = (i18n.language || "").toLowerCase();
    if (lang.startsWith("id")) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem("seller_language") || "null"
        );
        if (stored?.isoCode?.toLowerCase()?.startsWith("id")) return true;
        if (stored?.name?.toLowerCase()?.includes("indonesia")) return true;
      } catch {
        // ignore
      }
      const storeLang = window.localStorage.getItem("store_language") || "";
      if (
        storeLang.toLowerCase().includes("indonesia") ||
        storeLang.toLowerCase() === "id"
      ) {
        return true;
      }
    }
    return false;
  })();

  const t = isIndo ? SELLER_ORDERS_I18N.id : SELLER_ORDERS_I18N.en;

  const onCopy = (ref, id) => {
    copyOrderNumber(ref);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="tpsow2026-orders">
        <div className="tpsow2026-skeleton tpsow2026-sk-header" />
        <div className="tpsow2026-skeleton tpsow2026-sk-desc" />
        <div className="tpsow2026-summary-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="tpsow2026-skeleton tpsow2026-sk-card" />
          ))}
        </div>
        <div className="tpsow2026-skeleton tpsow2026-sk-filter" />
        <div className="tpsow2026-skeleton tpsow2026-sk-table" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="tpsow2026-orders">
        <div className="tpsow2026-empty">
          <AlertTriangle
            size={48}
            className="tpsow2026-empty-icon"
            style={{
              color: "var(--tpsow-danger-text)",
              background: "var(--tpsow-danger-bg)",
            }}
          />
          <h2>{t.unableToLoad}</h2>
          <p>
            {error?.message ||
              (isIndo
                ? "Gagal memuat daftar pesanan dari server."
                : "Failed to load orders from the server.")}
          </p>
          <button type="button" className="tpsow2026-btn-outline" onClick={refetch}>
            <RotateCcw size={16} /> {t.retry}
          </button>
        </div>
      </div>
    );
  }

  const rawRows = orders.data?.suborders || [];
  const rows = rawRows.map((r) => normalizeOrderRow(r, isIndo));
  const summary = orders.data?.summary || {};
  const pagination = orders.data?.pagination || {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  };

  const summaryCards = [
    {
      label: t.metricPendingPayment,
      value: summary.paymentPending || 0,
      amount: summaryAmounts.pending,
      icon: WalletCards,
      tone: "amber",
      filterStatus: "unpaid",
    },
    {
      label: t.metricReadyToPack,
      value: summary.processing || 0,
      amount: summaryAmounts.packing,
      icon: Box,
      tone: "accent",
      filterStatus: "processing",
    },
    {
      label: t.metricInTransit,
      value: summary.shipped || 0,
      amount: summaryAmounts.transit,
      icon: Truck,
      tone: "blue",
      filterStatus: "shipped",
    },
    {
      label: t.metricDelivered,
      value: summary.delivered || 0,
      amount: summaryAmounts.delivered,
      icon: PackageCheck,
      tone: "green",
      filterStatus: "delivered",
    },
  ];

  const isEmpty = rows.length === 0;
  const isFiltered =
    Boolean(query.search) ||
    query.status !== "all" ||
    query.paymentStatus !== "all" ||
    query.fulfillmentStatus !== "all" ||
    query.shippingMethod !== "all" ||
    Boolean(query.dateFrom) ||
    Boolean(query.dateTo);

  const firstVisible =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const lastVisible = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <div className="tpsow2026-orders">
      <header className="tpsow2026-orders-header">
        <div className="tpsow2026-header-text">
          <h1>{t.pageTitle}</h1>
          <p>{t.pageSubtitle}</p>
        </div>
        <div className="tpsow2026-orders-actions">
          <span className="tpsow2026-status-pill">
            <Check size={14} /> {t.storeReady}
          </span>
          <button
            type="button"
            className="tpsow2026-btn-primary"
            onClick={exportOrders}
            disabled={isEmpty}
            title={t.export}
          >
            <Download size={15} /> <span>{t.export}</span>
          </button>
        </div>
      </header>

      {notice ? (
        <div className={`tpsow2026-notice is-${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}{" "}
          {notice.text}
        </div>
      ) : null}

      {/* Modern Summary Metric Cards */}
      <section className="tpsow2026-summary-grid">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          const isActiveFilter = query.status === card.filterStatus;
          return (
            <div
              key={i}
              className={`tpsow2026-summary-card is-${card.tone} ${isActiveFilter ? "is-active-filter" : ""}`}
              onClick={() => {
                if (isActiveFilter) {
                  changeQuery({ status: "all" });
                } else {
                  changeQuery({ status: card.filterStatus });
                }
              }}
              role="button"
              tabIndex={0}
              title={`Filter: ${card.label}`}
            >
              <div className={`tpsow2026-summary-icon is-${card.tone}`}>
                <Icon size={22} />
              </div>
              <div className="tpsow2026-summary-content">
                <header>
                  <small>{card.label}</small>
                  <i className={`is-${card.tone}`} />
                </header>
                <div className="tpsow2026-summary-numbers">
                  <strong>{card.value}</strong>
                  <b>{formatMoney(card.amount)}</b>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Filter Toolbar */}
      <section className="tpsow2026-filter-bar">
        <div className="tpsow2026-filter-search">
          <Search size={16} className="tpsow2026-search-icon" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            value={query.search}
            onChange={(e) => changeQuery({ search: e.target.value })}
          />
          {query.search ? (
            <button
              type="button"
              className="tpsow2026-search-clear"
              onClick={() => changeQuery({ search: "" })}
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        <div className="tpsow2026-filters-group">
          <div className="tpsow2026-filter-select">
            <span>{t.filterStatus}</span>
            <select
              value={query.status}
              onChange={(e) =>
                changeQuery({
                  status: e.target.value,
                  paymentStatus: "all",
                  fulfillmentStatus: "all",
                })
              }
            >
              <option value="all">{t.all}</option>
              <option value="unpaid">{t.statusAwaitingPayment}</option>
              <option value="processing">{t.statusReadyToPack}</option>
              <option value="shipped">{t.statusInTransit}</option>
              <option value="delivered">{t.statusDelivered}</option>
            </select>
          </div>

          <div className="tpsow2026-filter-select">
            <span>{t.filterPayment}</span>
            <select
              value={query.paymentStatus}
              onChange={(e) =>
                changeQuery({ paymentStatus: e.target.value, status: "all" })
              }
            >
              <option value="all">{t.all}</option>
              <option value="UNPAID">{t.payUnpaid}</option>
              <option value="PAID">{t.payPaid}</option>
              <option value="EXPIRED">{t.payExpired}</option>
              <option value="CANCELLED">{t.payCancelled}</option>
              <option value="FAILED">{t.payFailed}</option>
            </select>
          </div>

          <div className="tpsow2026-filter-select">
            <span>{t.filterCourier}</span>
            <select
              value={query.shippingMethod}
              onChange={(e) => changeQuery({ shippingMethod: e.target.value })}
            >
              <option value="all">{t.all}</option>
              <option value="jne">JNE</option>
              <option value="jnt">J&T</option>
              <option value="sicepat">SiCepat</option>
            </select>
          </div>

          <div className="tpsow2026-filter-date">
            <input
              type="date"
              aria-label="Dari Tanggal"
              value={query.dateFrom}
              onChange={(e) => changeQuery({ dateFrom: e.target.value })}
            />
            <span>-</span>
            <input
              type="date"
              aria-label="Sampai Tanggal"
              value={query.dateTo}
              onChange={(e) => changeQuery({ dateTo: e.target.value })}
            />
          </div>

          {isFiltered && (
            <button
              type="button"
              className="tpsow2026-btn-reset"
              onClick={resetFilters}
              title={t.resetFilters}
            >
              <RotateCcw size={13} /> <span>{t.resetFilters}</span>
            </button>
          )}

          <div className="tpsow2026-view-toggle">
            <button
              type="button"
              className={view === "table" ? "is-active" : ""}
              onClick={() => setView("table")}
              title={t.viewTable}
              aria-label={t.viewTable}
            >
              <List size={15} />
            </button>
            <button
              type="button"
              className={view === "grid" ? "is-active" : ""}
              onClick={() => setView("grid")}
              title={t.viewGrid}
              aria-label={t.viewGrid}
            >
              <Grid2X2 size={15} />
            </button>
          </div>
        </div>
      </section>

      {isEmpty ? (
        <div className="tpsow2026-empty">
          <div className="tpsow2026-empty-icon">
            <FolderOpen size={44} />
          </div>
          <h2>{t.noOrdersTitle}</h2>
          <p>{isFiltered ? t.noOrdersFiltered : t.noOrdersEmpty}</p>
          {isFiltered && (
            <button
              type="button"
              className="tpsow2026-btn-outline"
              onClick={resetFilters}
            >
              {t.resetFilters}
            </button>
          )}
        </div>
      ) : (
        <>
          {view === "table" ? (
            <div className="tpsow2026-table-wrap">
              <table className="tpsow2026-table">
                <thead>
                  <tr>
                    <th>{t.colOrder}</th>
                    <th>{t.colBuyer}</th>
                    <th>{t.colItems}</th>
                    <th>{t.colPayment}</th>
                    <th>{t.colFulfillment}</th>
                    <th>{t.colTotal}</th>
                    <th>{t.colUpdated}</th>
                    <th style={{ textAlign: "right" }}>{t.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      {/* ORDER CODE & DATE */}
                      <td>
                        <div className="tpsow2026-cell-order">
                          <div className="tpsow2026-order-ref-row">
                            <strong
                              className="tpsow2026-order-code"
                              title={row.invoiceNo}
                              onClick={() => handleViewInvoice(row.id)}
                              style={{ cursor: "pointer" }}
                            >
                              {row.reference}
                            </strong>
                            {row.orderId ? (
                              <span
                                className="tpsow2026-order-id-badge"
                                title={`Order ID: ${row.orderId}`}
                              >
                                #{row.orderId}
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className={`tpsow2026-copy-btn ${copiedId === row.id ? "is-copied" : ""}`}
                              onClick={() => onCopy(row.reference, row.id)}
                              title={t.copyOrderNumber}
                              aria-label={t.copyOrderNumber}
                            >
                              {copiedId === row.id ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                          <small className="tpsow2026-order-date">{row.createdLabel}</small>
                        </div>
                      </td>

                      {/* BUYER */}
                      <td>
                        <div className="tpsow2026-cell-buyer">
                          <div className="tpsow2026-buyer-avatar">
                            {row.customer.initials}
                          </div>
                          <div className="tpsow2026-buyer-info">
                            <strong>{row.customer.name}</strong>
                            <small title={row.customer.email}>
                              {row.customer.email}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* ITEMS */}
                      <td>
                        <div className="tpsow2026-cell-items">
                          <Box size={14} className="tpsow2026-items-icon" />
                          <span>{t.itemCount(row.itemsCount)}</span>
                        </div>
                      </td>

                      {/* PAYMENT */}
                      <td>
                        <div className="tpsow2026-cell-status">
                          <span className={`tpsow2026-pill is-${row.payment.tone}`}>
                            {row.payment.label}
                          </span>
                          <small className="tpsow2026-payment-method">
                            {row.payment.method}
                          </small>
                        </div>
                      </td>

                      {/* ORDER / FULFILLMENT STATUS */}
                      <td>
                        <div className="tpsow2026-cell-status">
                          <span className={`tpsow2026-pill is-${row.fulfillment.tone}`}>
                            {row.fulfillment.label}
                          </span>
                          {row.fulfillment.shippingMethod || row.fulfillment.trackingNumber ? (
                            <small className="tpsow2026-courier-tag">
                              {[row.fulfillment.shippingMethod, row.fulfillment.trackingNumber]
                                .filter(Boolean)
                                .join(" - ")}
                            </small>
                          ) : null}
                        </div>
                      </td>

                      {/* TOTAL */}
                      <td className="tpsow2026-cell-total">
                        {formatMoney(row.totalAmount)}
                      </td>

                      {/* UPDATED DATE */}
                      <td className="tpsow2026-cell-updated">
                        {row.updatedLabel}
                      </td>

                      {/* ACTIONS */}
                      <td className="tpsow2026-cell-actions">
                        <button
                          type="button"
                          className="tpsow2026-btn-detail"
                          onClick={() => handleViewInvoice(row.id)}
                          title={t.viewDetail}
                        >
                          <FileText size={14} />
                          <span>{t.viewDetail}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tpsow2026-grid-wrap">
              {rows.map((row) => (
                <article key={row.id} className="tpsow2026-grid-card">
                  <header className="tpsow2026-grid-header">
                    <div>
                      <div className="tpsow2026-order-ref-row">
                        <strong title={row.invoiceNo}>{row.reference}</strong>
                        {row.orderId ? (
                          <span className="tpsow2026-order-id-badge">#{row.orderId}</span>
                        ) : null}
                        <button
                          type="button"
                          className={`tpsow2026-copy-btn ${copiedId === row.id ? "is-copied" : ""}`}
                          onClick={() => onCopy(row.reference, row.id)}
                          aria-label={t.copyOrderNumber}
                        >
                          {copiedId === row.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                      </div>
                      <small className="tpsow2026-order-date">{row.createdLabel}</small>
                    </div>
                    <span className={`tpsow2026-pill is-${row.fulfillment.tone}`}>
                      {row.fulfillment.label}
                    </span>
                  </header>

                  <div className="tpsow2026-grid-middle">
                    <div className="tpsow2026-grid-buyer">
                      <div className="tpsow2026-buyer-avatar">{row.customer.initials}</div>
                      <div>
                        <strong>{row.customer.name}</strong>
                        <small>{t.itemCount(row.itemsCount)}</small>
                      </div>
                    </div>
                    <div className="tpsow2026-grid-total">
                      {formatMoney(row.totalAmount)}
                    </div>
                  </div>

                  <footer className="tpsow2026-grid-footer">
                    <div className="tpsow2026-grid-statuses">
                      <div>
                        <small>{t.filterPayment}</small>
                        <span className={`tpsow2026-pill is-${row.payment.tone}`}>
                          {row.payment.label}
                        </span>
                      </div>
                      {row.fulfillment.shippingMethod ? (
                        <div>
                          <small>{t.filterCourier}</small>
                          <span className="tpsow2026-courier-pill">
                            {row.fulfillment.shippingMethod}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      className="tpsow2026-btn-detail"
                      onClick={() => handleViewInvoice(row.id)}
                    >
                      <FileText size={14} />
                      <span>{t.viewDetail}</span>
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          )}

          <footer className="tpsow2026-pagination">
            <span className="tpsow2026-pagination-info">
              {t.paginationText(firstVisible, lastVisible, pagination.total)}
            </span>
            <div className="tpsow2026-pagination-controls">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => changeQuery({ page: pagination.page - 1 })}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              {generatePaginationArray(
                pagination.page,
                pagination.totalPages
              ).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  className={p === pagination.page ? "is-active" : ""}
                  disabled={p === "..."}
                  onClick={() => p !== "..." && changeQuery({ page: p })}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => changeQuery({ page: pagination.page + 1 })}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
