import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Grid2X2,
  List,
  MoreVertical,
  PackageCheck,
  RotateCcw,
  Search,
  Truck,
  WalletCards,
  FolderOpen,
} from "lucide-react";
import "./SellerOrders2026View.css";
import {
  normalizeOrderRow,
  statusLabel,
  statusTone,
  formatMoney,
} from "./sellerOrders2026Utils.js";

const SELLER_ORDERS_I18N = {
  en: {
    pageTitle: "Orders",
    pageSubtitle: "Manage, fulfill, and track seller orders.",
    storeReady: "Store Ready",
    actions: "Actions",
    export: "Export",
    metricPendingPayment: "Pending Payment",
    metricReadyToPack: "Ready to Pack",
    metricInTransit: "In Transit",
    metricDelivered: "Delivered",
    searchPlaceholder: "Search order, buyer, invoice...",
    filterStatus: "Status",
    filterPayment: "Payment",
    filterFulfillment: "Fulfillment",
    filterCourier: "Courier",
    all: "All",
    statusAwaitingPayment: "Awaiting Payment",
    statusReadyToPack: "Ready to Pack",
    statusInTransit: "In Transit",
    statusDelivered: "Delivered",
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
    noOrdersTitle: "No orders",
    noOrdersFiltered: "Try different filters.",
    noOrdersEmpty: "You don't have any orders yet.",
    resetFilters: "Reset Filters",
    colOrder: "Order",
    colBuyer: "Buyer",
    colItems: "Items",
    colPayment: "Payment",
    colFulfillment: "Fulfillment",
    colTotal: "Total",
    colUpdated: "Updated",
    colStatus: "Status",
    colActions: "Actions",
    copyOrderNumber: "Copy order number",
    viewOrder: "View order",
    viewDetail: "View",
    itemCount: (count) => `${count} ${count === 1 ? "item" : "items"}`,
    paginationText: (from, to, total) => `Showing ${from} to ${to} of ${total} orders`,
    unableToLoad: "Unable to load orders",
    retry: "Retry",
  },
  id: {
    pageTitle: "Pesanan Toko",
    pageSubtitle: "Kelola, proses, dan lacak pesanan toko Anda.",
    storeReady: "Toko Aktif",
    actions: "Aksi",
    export: "Ekspor",
    metricPendingPayment: "Menunggu Pembayaran",
    metricReadyToPack: "Siap Dikemas",
    metricInTransit: "Dalam Pengiriman",
    metricDelivered: "Selesai",
    searchPlaceholder: "Cari pesanan, pembeli, invoice...",
    filterStatus: "Status",
    filterPayment: "Pembayaran",
    filterFulfillment: "Pengiriman",
    filterCourier: "Kurir",
    all: "Semua",
    statusAwaitingPayment: "Menunggu Pembayaran",
    statusReadyToPack: "Siap Dikemas",
    statusInTransit: "Dalam Pengiriman",
    statusDelivered: "Terkirim",
    payUnpaid: "Belum Bayar",
    payPaid: "Lunas",
    payFailed: "Gagal",
    payCancelled: "Dibatalkan",
    payExpired: "Kedaluwarsa",
    fulUnfulfilled: "Belum Diproses",
    fulReadyToPack: "Siap Dikemas",
    fulInTransit: "Dalam Pengiriman",
    fulDelivered: "Terkirim",
    fulCancelled: "Dibatalkan",
    viewTable: "Tabel",
    viewGrid: "Grid",
    noOrdersTitle: "Tidak ada pesanan",
    noOrdersFiltered: "Coba gunakan filter lain.",
    noOrdersEmpty: "Belum ada pesanan masuk untuk toko ini.",
    resetFilters: "Reset Filter",
    colOrder: "Pesanan",
    colBuyer: "Pembeli",
    colItems: "Produk",
    colPayment: "Pembayaran",
    colFulfillment: "Pengiriman",
    colTotal: "Total",
    colUpdated: "Diperbarui",
    colStatus: "Status",
    colActions: "Aksi",
    copyOrderNumber: "Salin nomor pesanan",
    viewOrder: "Lihat pesanan",
    viewDetail: "Lihat",
    itemCount: (count) => `${count} produk`,
    paginationText: (from, to, total) => `Menampilkan ${from} sampai ${to} dari ${total} pesanan`,
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
          <p>{error?.message || (isIndo ? "Gagal memuat daftar pesanan dari server." : "Failed to load orders from the server.")}</p>
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
    },
    {
      label: t.metricReadyToPack,
      value: summary.processing || 0,
      amount: summaryAmounts.packing,
      icon: Box,
      tone: "green",
    },
    {
      label: t.metricInTransit,
      value: summary.shipped || 0,
      amount: summaryAmounts.transit,
      icon: Truck,
      tone: "blue",
    },
    {
      label: t.metricDelivered,
      value: summary.delivered || 0,
      amount: summaryAmounts.delivered,
      icon: PackageCheck,
      tone: "violet",
    },
  ];

  const isEmpty = rows.length === 0;
  const isFiltered =
    query.search ||
    query.status !== "all" ||
    query.paymentStatus !== "all" ||
    query.fulfillmentStatus !== "all" ||
    query.shippingMethod !== "all" ||
    query.dateFrom ||
    query.dateTo;

  const firstVisible =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const lastVisible = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <div className="tpsow2026-orders">
      <header className="tpsow2026-orders-header">
        <div>
          <h1>{t.pageTitle}</h1>
          <p>{t.pageSubtitle}</p>
        </div>
        <div className="tpsow2026-orders-actions">
          <button type="button" className="tpsow2026-btn-accent">
            <Check size={16} /> {t.storeReady}
          </button>
          <button type="button" className="tpsow2026-btn-outline" disabled>
            <MoreVertical size={16} /> {t.actions} <ChevronDown size={14} />
          </button>
          <button
            type="button"
            className="tpsow2026-btn-primary"
            onClick={exportOrders}
            disabled={isEmpty}
          >
            <Download size={16} /> {t.export}
          </button>
        </div>
      </header>

      {notice ? (
        <div className={`tpsow2026-notice is-${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}{" "}
          {notice.text}
        </div>
      ) : null}

      <section className="tpsow2026-summary-grid">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="tpsow2026-summary-card">
              <div className={`tpsow2026-summary-icon is-${card.tone}`}>
                <Icon size={24} />
              </div>
              <div className="tpsow2026-summary-content">
                <header>
                  <small>{card.label}</small>
                  <i className={`is-${card.tone}`} />
                </header>
                <strong>{card.value}</strong>
                <b>{formatMoney(card.amount)}</b>
              </div>
            </div>
          );
        })}
      </section>

      <section className="tpsow2026-filter-bar">
        <div className="tpsow2026-filter-search">
          <Search size={16} color="var(--tpsow-text-muted)" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            value={query.search}
            onChange={(e) => changeQuery({ search: e.target.value })}
          />
        </div>
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
            <option value="FAILED">{t.payFailed}</option>
            <option value="CANCELLED">{t.payCancelled}</option>
            <option value="EXPIRED">{t.payExpired}</option>
          </select>
        </div>
        <div className="tpsow2026-filter-select">
          <span>{t.filterFulfillment}</span>
          <select
            value={query.fulfillmentStatus}
            onChange={(e) =>
              changeQuery({ fulfillmentStatus: e.target.value, status: "all" })
            }
          >
            <option value="all">{t.all}</option>
            <option value="UNFULFILLED">{t.fulUnfulfilled}</option>
            <option value="PROCESSING">{t.fulReadyToPack}</option>
            <option value="SHIPPED">{t.fulInTransit}</option>
            <option value="DELIVERED">{t.fulDelivered}</option>
            <option value="CANCELLED">{t.fulCancelled}</option>
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
            value={query.dateFrom}
            onChange={(e) => changeQuery({ dateFrom: e.target.value })}
          />
          <span>-</span>
          <input
            type="date"
            value={query.dateTo}
            onChange={(e) => changeQuery({ dateTo: e.target.value })}
          />
        </div>
        <div className="tpsow2026-view-toggle">
          <button
            type="button"
            className={view === "table" ? "is-active" : ""}
            onClick={() => setView("table")}
          >
            <List size={14} /> {t.viewTable}
          </button>
          <button
            type="button"
            className={view === "grid" ? "is-active" : ""}
            onClick={() => setView("grid")}
          >
            <Grid2X2 size={14} /> {t.viewGrid}
          </button>
        </div>
      </section>

      {isEmpty ? (
        <div className="tpsow2026-empty">
          <div className="tpsow2026-empty-icon">
            <FolderOpen size={48} />
          </div>
          <h2>{t.noOrdersTitle}</h2>
          <p>{isFiltered ? t.noOrdersFiltered : t.noOrdersEmpty}</p>
          <button
            type="button"
            className="tpsow2026-btn-outline"
            onClick={resetFilters}
          >
            {t.resetFilters}
          </button>
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
                    <th>{t.colStatus}</th>
                    <th style={{ textAlign: "right" }}>{t.colActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <div className="tpsow2026-cell-order">
                          <div>
                            <strong title={row.reference}>{row.reference}</strong>
                            <button
                              type="button"
                              onClick={() => copyOrderNumber(row.reference)}
                              aria-label={t.copyOrderNumber}
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <small>{row.createdLabel}</small>
                        </div>
                      </td>
                      <td>
                        <div className="tpsow2026-cell-buyer">
                          <span>{row.customer.initials}</span>
                          <div>
                            <strong>{row.customer.name}</strong>
                            <small title={row.customer.email}>
                              {row.customer.email}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="tpsow2026-cell-items">
                          <Box size={14} /> {row.itemsCount}
                        </div>
                      </td>
                      <td>
                        <div className="tpsow2026-cell-status">
                          <span
                            className={`tpsow2026-pill is-${row.payment.tone}`}
                          >
                            {row.payment.label}
                          </span>
                          <small>{row.payment.method}</small>
                        </div>
                      </td>
                      <td>
                        <div className="tpsow2026-cell-status">
                          <span
                            className={`tpsow2026-pill is-${row.fulfillment.tone}`}
                          >
                            {row.fulfillment.label}
                          </span>
                          {row.fulfillment.shippingMethod ||
                          row.fulfillment.trackingNumber ? (
                            <small>
                              {[
                                row.fulfillment.shippingMethod,
                                row.fulfillment.trackingNumber,
                              ]
                                .filter(Boolean)
                                .join(" - ")}
                            </small>
                          ) : null}
                        </div>
                      </td>
                      <td className="tpsow2026-cell-total">
                        {formatMoney(row.totalAmount)}
                      </td>
                      <td className="tpsow2026-cell-updated">
                        {row.updatedLabel}
                      </td>
                      <td>
                        <span
                          className={`tpsow2026-pill is-${statusTone(
                            row.status
                          )}`}
                        >
                          {row.statusLabel}
                        </span>
                      </td>
                      <td className="tpsow2026-cell-actions">
                        <button
                          type="button"
                          onClick={() => handleViewInvoice(row.id)}
                          aria-label={t.viewOrder}
                        >
                          <MoreVertical size={16} />
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
                      <div>
                        <strong>{row.reference}</strong>
                        <button
                          type="button"
                          onClick={() => copyOrderNumber(row.reference)}
                          aria-label={t.copyOrderNumber}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <span
                        className={`tpsow2026-pill is-${statusTone(row.status)}`}
                      >
                        {row.statusLabel}
                      </span>
                    </div>
                    <span>
                      <button
                        type="button"
                        onClick={() => handleViewInvoice(row.id)}
                        aria-label={t.viewOrder}
                      >
                        <MoreVertical size={16} />
                      </button>
                    </span>
                  </header>

                  <div className="tpsow2026-grid-middle">
                    <div className="tpsow2026-grid-buyer">
                      <span>{row.customer.initials}</span>
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
                        <span
                          className={`tpsow2026-pill is-${row.payment.tone}`}
                        >
                          {row.payment.label}
                        </span>
                      </div>
                      <div>
                        <small>{t.filterFulfillment}</small>
                        <span
                          className={`tpsow2026-pill is-${row.fulfillment.tone}`}
                        >
                          {row.fulfillment.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="tpsow2026-btn-outline"
                      onClick={() => handleViewInvoice(row.id)}
                    >
                      {t.viewDetail}
                    </button>
                  </footer>
                </article>
              ))}
            </div>
          )}

          <footer className="tpsow2026-pagination">
            <span>{t.paginationText(firstVisible, lastVisible, pagination.total)}</span>
            <div className="tpsow2026-pagination-controls">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => changeQuery({ page: pagination.page - 1 })}
              >
                <ChevronLeft size={14} />
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
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
