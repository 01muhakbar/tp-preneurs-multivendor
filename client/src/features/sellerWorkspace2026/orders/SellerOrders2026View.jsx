import {
  AlertTriangle,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
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
  FolderOpen
} from "lucide-react";
import "./SellerOrders2026View.css";
import { normalizeOrderRow, statusLabel, statusTone, formatMoney } from "./sellerOrders2026Utils.js";

const generatePaginationArray = (currentPage, totalPages) => {
  const delta = 2;
  const range = [];
  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
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
  refetch
}) {
  if (isLoading) {
    return (
      <div className="tpsow2026-orders">
        <div className="tpsow2026-skeleton tpsow2026-sk-header" />
        <div className="tpsow2026-skeleton tpsow2026-sk-desc" />
        <div className="tpsow2026-summary-grid">
          {[1, 2, 3, 4].map(i => <div key={i} className="tpsow2026-skeleton tpsow2026-sk-card" />)}
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
          <AlertTriangle size={48} className="tpsow2026-empty-icon" style={{ color: '#ef4444', background: '#fef2f2' }} />
          <h2>Unable to load orders</h2>
          <p>{error?.message || "Failed to load orders from the server."}</p>
          <button type="button" className="tpsow2026-btn-outline" onClick={refetch}>
            <RotateCcw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const rawRows = orders.data?.suborders || [];
  const rows = rawRows.map(normalizeOrderRow);
  const summary = orders.data?.summary || {};
  const pagination = orders.data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  const summaryCards = [
    { label: "Pending Payment", value: summary.paymentPending || 0, amount: summaryAmounts.pending, icon: WalletCards, tone: "amber" },
    { label: "Ready to Pack", value: summary.processing || 0, amount: summaryAmounts.packing, icon: Box, tone: "green" },
    { label: "In Transit", value: summary.shipped || 0, amount: summaryAmounts.transit, icon: Truck, tone: "blue" },
    { label: "Delivered", value: summary.delivered || 0, amount: summaryAmounts.delivered, icon: PackageCheck, tone: "violet" },
  ];

  const isEmpty = rows.length === 0;
  const isFiltered = query.search || query.status !== "all" || query.paymentStatus !== "all" || query.fulfillmentStatus !== "all" || query.shippingMethod !== "all" || query.dateFrom || query.dateTo;

  return (
    <div className="tpsow2026-orders">
      <header className="tpsow2026-orders-header">
        <div>
          <h1>Orders</h1>
          <p>Manage, fulfill, and track seller orders.</p>
        </div>
        <div className="tpsow2026-orders-actions">
          <button type="button" className="tpsow2026-btn-outline is-ready"><Check size={16} /> Store Ready</button>
          <button type="button" className="tpsow2026-btn-outline" disabled><MoreVertical size={16} /> Actions <ChevronDown size={14}/></button>
          <button type="button" className="tpsow2026-btn-primary" onClick={exportOrders} disabled={isEmpty}><Download size={16} /> Export</button>
        </div>
      </header>

      {notice ? (
        <div className={`tpsow2026-notice is-${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />} {notice.text}
        </div>
      ) : null}

      <section className="tpsow2026-summary-grid">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="tpsow2026-summary-card">
              <div className={`tpsow2026-summary-icon is-${card.tone}`}><Icon size={24} /></div>
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
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search order, buyer, invoice..." 
            value={query.search} 
            onChange={(e) => changeQuery({ search: e.target.value })}
          />
        </div>
        <div className="tpsow2026-filter-select">
          <span>Status</span>
          <select value={query.status} onChange={(e) => changeQuery({ status: e.target.value, paymentStatus: "all", fulfillmentStatus: "all" })}>
            <option value="all">All</option>
            <option value="unpaid">Awaiting Payment</option>
            <option value="processing">Ready to Pack</option>
            <option value="shipped">In Transit</option>
            <option value="delivered">Delivered</option>
          </select>
        </div>
        <div className="tpsow2026-filter-select">
          <span>Payment</span>
          <select value={query.paymentStatus} onChange={(e) => changeQuery({ paymentStatus: e.target.value, status: "all" })}>
            <option value="all">All</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
        <div className="tpsow2026-filter-select">
          <span>Fulfillment</span>
          <select value={query.fulfillmentStatus} onChange={(e) => changeQuery({ fulfillmentStatus: e.target.value, status: "all" })}>
            <option value="all">All</option>
            <option value="UNFULFILLED">Unfulfilled</option>
            <option value="PROCESSING">Ready to Pack</option>
            <option value="SHIPPED">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="tpsow2026-filter-select">
          <span>Courier</span>
          <select value={query.shippingMethod} onChange={(e) => changeQuery({ shippingMethod: e.target.value })}>
            <option value="all">All</option>
            <option value="jne">JNE</option>
            <option value="jnt">J&T</option>
            <option value="sicepat">SiCepat</option>
          </select>
        </div>
        <div className="tpsow2026-filter-date">
          <input type="date" value={query.dateFrom} onChange={(e) => changeQuery({ dateFrom: e.target.value })} />
          <span>-</span>
          <input type="date" value={query.dateTo} onChange={(e) => changeQuery({ dateTo: e.target.value })} />
        </div>
        <div className="tpsow2026-view-toggle">
          <button type="button" className={view === "table" ? "is-active" : ""} onClick={() => setView("table")}><List size={14} /> Table</button>
          <button type="button" className={view === "grid" ? "is-active" : ""} onClick={() => setView("grid")}><Grid2X2 size={14} /> Grid</button>
        </div>
      </section>

      {isEmpty ? (
        <div className="tpsow2026-empty">
          <div className="tpsow2026-empty-icon"><FolderOpen size={48} /></div>
          <h2>No orders</h2>
          <p>{isFiltered ? "Try different filters." : "You don't have any orders yet."}</p>
          <button type="button" className="tpsow2026-btn-outline" onClick={resetFilters}>Reset Filters</button>
        </div>
      ) : (
        <>
          {view === "table" ? (
            <div className="tpsow2026-table-wrap">
              <table className="tpsow2026-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Buyer</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Fulfillment</th>
                    <th>Total</th>
                    <th>Updated</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => (
                    <tr key={row.id}>
                      <td>
                        <div className="tpsow2026-cell-order">
                          <div>
                            <strong title={row.reference}>{row.reference}</strong>
                            <button type="button" onClick={() => copyOrderNumber(row.reference)} aria-label="Copy order number"><Copy size={12} /></button>
                          </div>
                          <small>{row.createdLabel}</small>
                        </div>
                      </td>
                      <td>
                        <div className="tpsow2026-cell-buyer">
                          <span>{row.customer.initials}</span>
                          <div>
                            <strong>{row.customer.name}</strong>
                            <small title={row.customer.email}>{row.customer.email}</small>
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
                          <span className={`tpsow2026-pill is-${row.payment.tone}`}>{row.payment.label}</span>
                          <small>{row.payment.method}</small>
                        </div>
                      </td>
                      <td>
                        <div className="tpsow2026-cell-status">
                          <span className={`tpsow2026-pill is-${row.fulfillment.tone}`}>{row.fulfillment.label}</span>
                          <small>{row.fulfillment.status === 'SHIPPED' ? 'In Transit' : row.fulfillment.status === 'PROCESSING' ? 'Ready to fulfill' : row.fulfillment.status === 'UNFULFILLED' ? 'Waiting payment' : row.fulfillment.status}</small>
                        </div>
                      </td>
                      <td className="tpsow2026-cell-total">{formatMoney(row.totalAmount)}</td>
                      <td className="tpsow2026-cell-updated">{row.updatedLabel}</td>
                      <td>
                        <span className={`tpsow2026-pill is-${statusTone(row.status)}`}>{statusLabel(row.status)}</span>
                      </td>
                      <td className="tpsow2026-cell-actions">
                        <button type="button" onClick={() => handleViewInvoice(row.id)} aria-label="View order"><MoreVertical size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="tpsow2026-grid-wrap">
              {rows.map(row => (
                <article key={row.id} className="tpsow2026-grid-card">
                  <header className="tpsow2026-grid-header">
                    <div>
                      <div>
                        <strong>{row.reference}</strong>
                        <button type="button" onClick={() => copyOrderNumber(row.reference)}><Copy size={12} /></button>
                      </div>
                      <span className={`tpsow2026-pill is-${statusTone(row.status)}`}>{statusLabel(row.status)}</span>
                    </div>
                    <span>
                      <button type="button" onClick={() => handleViewInvoice(row.id)}><MoreVertical size={16} /></button>
                    </span>
                  </header>
                  
                  <div className="tpsow2026-grid-middle">
                    <div className="tpsow2026-grid-buyer">
                      <span>{row.customer.initials}</span>
                      <div>
                        <strong>{row.customer.name}</strong>
                        <small>{row.itemsCount} {row.itemsCount === 1 ? 'item' : 'items'}</small>
                      </div>
                    </div>
                    <div className="tpsow2026-grid-total">{formatMoney(row.totalAmount)}</div>
                  </div>

                  <footer className="tpsow2026-grid-footer">
                    <div className="tpsow2026-grid-statuses">
                      <div>
                        <small>Payment</small>
                        <span className={`tpsow2026-pill is-${row.payment.tone}`}>{row.payment.label}</span>
                      </div>
                      <div>
                        <small>Fulfillment</small>
                        <span className={`tpsow2026-pill is-${row.fulfillment.tone}`}>{row.fulfillment.label}</span>
                      </div>
                    </div>
                    <button type="button" className="tpsow2026-btn-outline" onClick={() => handleViewInvoice(row.id)}>View</button>
                  </footer>
                </article>
              ))}
            </div>
          )}

          <footer className="tpsow2026-pagination">
            <span>Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders</span>
            <div className="tpsow2026-pagination-controls">
              <button type="button" disabled={pagination.page <= 1} onClick={() => changeQuery({ page: pagination.page - 1 })}><ChevronLeft size={14} /></button>
              {generatePaginationArray(pagination.page, pagination.totalPages).map((p, i) => (
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
              <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => changeQuery({ page: pagination.page + 1 })}><ChevronRight size={14} /></button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
