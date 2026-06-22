import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Box,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
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
} from "lucide-react";
import { useSeller2026Orders } from "../../hooks/seller2026/useSeller2026Orders.ts";
import { useSeller2026SuborderDetail } from "../../hooks/seller2026/useSeller2026SuborderDetail.ts";
import { downloadCsvFile } from "../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import SellerOrderDetail2026Panel from "./SellerOrderDetail2026Panel.jsx";
import { normalizeSellerOrderDetailFor2026 } from "./sellerOrderDetail2026Adapter.js";
import "../../features/sellerWorkspace2026/Seller2026Orders.css";

const EXPORT_COLUMNS = [
  { key: "order", label: "Order" },
  { key: "buyer", label: "Buyer" },
  { key: "items", label: "Items" },
  { key: "payment", label: "Payment" },
  { key: "fulfillment", label: "Fulfillment" },
  { key: "total", label: "Total" },
  { key: "updated", label: "Updated" },
];

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const errorMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

const statusLabel = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "UNPAID") return "Awaiting Payment";
  if (normalized === "PENDING_CONFIRMATION") return "Awaiting Review";
  if (normalized === "PROCESSING") return "Ready to Pack";
  if (normalized === "SHIPPED") return "In Transit";
  if (normalized === "DELIVERED") return "Delivered";
  if (normalized === "CANCELLED") return "Cancelled";
  return "New";
};

function StatusChip({ tone = "slate", children }) {
  return <span className={`s26-order-chip is-${tone}`}><i />{children}</span>;
}

function ItemStack({ order }) {
  const items = order.items?.slice(0, 3) || [];
  const count = Math.max(order.itemsCount || 0, items.length);
  return (
    <div className="s26-order-items">
      <div>
        {(items.length ? items : Array.from({ length: Math.min(3, count || 1) })).map((item, index) => (
          <span className={`is-${index % 3}`} key={item?.id ?? index}>
            {item?.imageUrl ? <img src={item.imageUrl} alt="" /> : <Box size={14} />}
          </span>
        ))}
        {count > 3 ? <em>+{count - 3}</em> : null}
      </div>
      <small>{count} {count === 1 ? "item" : "items"}</small>
    </div>
  );
}

export default function Seller2026LiveOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("ORDER_READ");
  const canFulfill = can("ORDER_FULFILLMENT_UPDATE");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    paymentStatus: searchParams.get("paymentStatus") || "all",
    fulfillmentStatus: searchParams.get("fulfillmentStatus") || "all",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    channel: searchParams.get("channel") || "all",
    shippingMethod: searchParams.get("shippingMethod") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };
  const orders = useSeller2026Orders(storeId, query, {
    enabled: canView,
    permissions: { canFulfill },
  });
  const [view, setView] = useState("table");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [notice, setNotice] = useState(null);
  const detailQuery = useSeller2026SuborderDetail(storeId, selectedOrderId, {
    enabled: canView && Boolean(selectedOrderId),
    permissions: { canFulfill },
  });
  const orderDetail2026 = useMemo(
    () =>
      selectedOrderId
        ? normalizeSellerOrderDetailFor2026({
            suborder: detailQuery.data,
          })
        : null,
    [detailQuery.data, selectedOrderId]
  );

  const changeQuery = (patch) => {
    const next = new URLSearchParams(searchParams);
    const values = { ...patch, ...(Object.prototype.hasOwnProperty.call(patch, "page") ? {} : { page: 1 }) };
    Object.entries(values).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key;
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all" ||
        (paramKey === "page" && Number(value) <= 1) ||
        (paramKey === "limit" && Number(value) === 10)
      ) {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(value));
      }
    });
    setSearchParams(next);
  };

  const rows = orders.data.suborders;
  const summaryAmounts = useMemo(() => ({
    pending: rows
      .filter((order) => ["UNPAID", "PENDING_CONFIRMATION", "PARTIALLY_PAID"].includes(order.paymentStatus))
      .reduce((sum, order) => sum + order.totalAmount, 0),
    packing: rows
      .filter((order) => order.fulfillmentStatus === "PROCESSING")
      .reduce((sum, order) => sum + order.totalAmount, 0),
    transit: rows
      .filter((order) => order.fulfillmentStatus === "SHIPPED")
      .reduce((sum, order) => sum + order.totalAmount, 0),
    delivered: rows
      .filter((order) => order.fulfillmentStatus === "DELIVERED")
      .reduce((sum, order) => sum + order.totalAmount, 0),
  }), [rows]);

  const exportOrders = () => {
    downloadCsvFile(
      EXPORT_COLUMNS,
      rows.map((order) => ({
        order: order.orderNumber,
        buyer: order.customerName,
        items: order.itemsCount,
        payment: order.paymentLabel,
        fulfillment: order.fulfillmentLabel,
        total: order.totalAmount,
        updated: order.updatedLabel,
      })),
      `seller-orders-${new Date().toISOString().slice(0, 10)}.csv`
    );
    setNotice({ type: "success", text: `${rows.length} visible order(s) exported.` });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
    setNotice(null);
  };

  const copyOrderNumber = async (orderNumber) => {
    try {
      await navigator.clipboard.writeText(orderNumber);
      setNotice({ type: "success", text: `${orderNumber} copied.` });
    } catch {
      setNotice({ type: "error", text: "Unable to copy order number." });
    }
  };

  const closeOrderDetail = () => {
    if (detailQuery.updatingStatusId) return;
    setSelectedOrderId(null);
  };

  const handleCopyReference = () => {
    if (orderDetail2026?.reference) {
      void copyOrderNumber(orderDetail2026.reference);
    }
  };

  const handlePrintLabel = () => {
    setNotice({
      type: "error",
      text: "Print label is not available for this seller order yet.",
    });
  };

  const handleMessageBuyer = () => {
    setNotice({
      type: "success",
      text: "Buyer messaging placeholder opened. Chat backend is not enabled yet.",
    });
  };

  const handleViewInvoice = () => {
    if (!selectedOrderId) return;
    navigate(workspaceRoutes.orderDetail(selectedOrderId));
  };

  const handleFulfillmentAction = async (action) => {
    if (!selectedOrderId || !canFulfill || detailQuery.updatingStatusId) return;
    try {
      await detailQuery.updateFulfillmentStatus({
        payload: { action },
      });
      await Promise.all([
        orders.refetch(),
        detailQuery.refetch(),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "dashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["seller", "notifications", storeId] }),
      ]);
      setNotice({ type: "success", text: "Order fulfillment updated." });
    } catch (mutationError) {
      setNotice({
        type: "error",
        text: errorMessage(mutationError, "Unable to update fulfillment."),
      });
    }
  };

  if (orders.isLoading) {
    return (
      <div className="s26-orders">
        <div className="s26-orders-skeleton is-heading" />
        <div className="s26-orders-summary">{[1, 2, 3, 4].map((item) => <div className="s26-orders-skeleton is-card" key={item} />)}</div>
        <div className="s26-orders-skeleton is-table" />
      </div>
    );
  }

  if (orders.isError) {
    return (
      <div className="s26-orders">
        <div className="s26-orders-error">
          <AlertTriangle size={20} />
          <div><strong>Unable to load orders</strong><span>{errorMessage(orders.error, "Try again.")}</span></div>
          <button type="button" onClick={() => orders.refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: "Pending Payment", value: orders.data.summary.paymentPending, amount: summaryAmounts.pending, icon: WalletCards, tone: "amber", hint: "Awaiting payment from buyers" },
    { label: "Ready to Pack", value: orders.data.summary.processing, amount: summaryAmounts.packing, icon: Box, tone: "green", hint: "Pack paid orders within SLA" },
    { label: "In Transit", value: orders.data.summary.shipped, amount: summaryAmounts.transit, icon: Truck, tone: "blue", hint: "On the way to buyers" },
    { label: "Delivered", value: orders.data.summary.delivered, amount: summaryAmounts.delivered, icon: PackageCheck, tone: "violet", hint: "Completed store orders" },
  ];

  return (
    <div className="s26-orders" data-seller2026-live-orders="true">
      <span className="tpsod2026-sr-only">Live store-owned suborders</span>
      <nav className="s26-orders-breadcrumb" aria-label="Breadcrumb">
        <span>Stores</span><i>/</i><span>{sellerContext?.store?.name || "Active Store"}</span><i>/</i><strong>Orders</strong>
      </nav>

      <header className="s26-orders-header">
        <div>
          <h1>Orders</h1>
          <p>Manage, fulfill, and track seller orders from one place.</p>
        </div>
        <div className="s26-orders-header__actions">
          <span className="s26-orders-ready"><Check size={16} />Store Ready</span>
          <button type="button" disabled title="Batch operations remain disabled pending review"><ClipboardList size={16} />Actions<ChevronDown size={15} /></button>
          <button type="button" className="is-primary" onClick={exportOrders}><Download size={17} />Export Orders</button>
        </div>
      </header>

      {notice ? <div className={`s26-orders-notice is-${notice.type}`}>{notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}{notice.text}</div> : null}

      <section className="s26-orders-summary">
        {summaryCards.map(({ label, value, amount, icon: Icon, tone, hint }) => (
          <article key={label}>
            <span className={`is-${tone}`}><Icon size={25} /></span>
            <div><small>{label}</small><strong>{value}</strong><b>{formatMoney(amount)}</b><em>{hint}</em></div>
          </article>
        ))}
      </section>

      <section className="s26-orders-panel">
        <div className="s26-orders-toolbar">
          <label className="s26-orders-search"><Search size={18} /><input value={query.search} placeholder="Search orders, buyer, invoice, or tracking..." onChange={(event) => changeQuery({ search: event.target.value })} /></label>
          <label><span>Status</span><select value={query.status} onChange={(event) => changeQuery({ status: event.target.value, paymentStatus: "all", fulfillmentStatus: "all" })}><option value="all">All Statuses</option><option value="unpaid">Awaiting Payment</option><option value="processing">Ready to Pack</option><option value="shipped">In Transit</option><option value="delivered">Delivered</option></select></label>
          <label><span>Payment</span><select value={query.paymentStatus} onChange={(event) => changeQuery({ paymentStatus: event.target.value, status: "all" })}><option value="all">All Payments</option><option value="UNPAID">Unpaid</option><option value="PENDING_CONFIRMATION">Awaiting Review</option><option value="PAID">Paid</option><option value="FAILED">Failed</option><option value="CANCELLED">Cancelled</option></select></label>
          <label><span>Fulfillment</span><select value={query.fulfillmentStatus} onChange={(event) => changeQuery({ fulfillmentStatus: event.target.value, status: "all" })}><option value="all">All Fulfillments</option><option value="UNFULFILLED">Unfulfilled</option><option value="PROCESSING">Ready to Pack</option><option value="SHIPPED">In Transit</option><option value="DELIVERED">Delivered</option></select></label>
          <label><span>Courier</span><select value={query.shippingMethod} onChange={(event) => changeQuery({ shippingMethod: event.target.value })}><option value="all">All Couriers</option><option value="jne">JNE</option><option value="jnt">J&T</option><option value="sicepat">SiCepat</option><option value="waiting">Unassigned</option></select></label>
          <div className="s26-orders-date"><input type="date" aria-label="Date from" value={query.dateFrom} onChange={(event) => changeQuery({ dateFrom: event.target.value })} /><i>-</i><input type="date" aria-label="Date to" value={query.dateTo} onChange={(event) => changeQuery({ dateTo: event.target.value })} /></div>
          <div className="s26-orders-view"><button type="button" className={view === "table" ? "is-active" : ""} onClick={() => setView("table")}><List size={16} />Table</button><button type="button" className={view === "board" ? "is-active" : ""} onClick={() => setView("board")}><Grid2X2 size={15} />Board</button></div>
          <button type="button" className="s26-orders-reset" onClick={resetFilters}><RotateCcw size={16} />Reset</button>
        </div>

        {rows.length === 0 ? (
          <div className="s26-orders-empty"><ClipboardList size={32} /><h2>No orders found</h2><p>Try adjusting the filters. Store-scoped orders appear after checkout succeeds.</p><button type="button" onClick={resetFilters}>Reset Filters</button></div>
        ) : view === "table" ? (
          <div className="s26-orders-table-wrap">
            <table className="s26-orders-table">
              <thead><tr><th>Order</th><th>Buyer</th><th>Items</th><th>Payment</th><th>Fulfillment</th><th>Total</th><th>Updated</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {rows.map((order) => (
                  <tr key={order.id} className={String(selectedOrderId) === String(order.id) ? "is-selected" : ""}>
                    <td><button type="button" className="s26-order-number" onClick={() => setSelectedOrderId(order.suborderId)}>{order.orderNumber}</button><button type="button" className="s26-order-copy" onClick={() => copyOrderNumber(order.orderNumber)} aria-label={`Copy ${order.orderNumber}`}><Copy size={13} /></button><small>{order.createdLabel}</small></td>
                    <td><div className="s26-order-buyer"><span>{order.customerInitials}</span><div><strong>{order.customerName}</strong><small>{order.customerEmail || order.customerPhone || "Buyer"}</small></div></div></td>
                    <td><ItemStack order={order} /></td>
                    <td><StatusChip tone={order.paymentTone}>{order.paymentLabel}</StatusChip><small>{order.paymentMethod}</small></td>
                    <td><StatusChip tone={order.fulfillmentTone}>{order.fulfillmentLabel}</StatusChip><small>{order.shippingStatus}</small><i className="s26-order-progress"><b style={{ width: `${order.fulfillmentProgress}%` }} /></i></td>
                    <td><strong>{formatMoney(order.totalAmount)}</strong></td>
                    <td><span>{order.updatedLabel}</span></td>
                    <td><StatusChip tone={order.fulfillmentTone}>{statusLabel(order.status)}</StatusChip></td>
                    <td><div className="s26-order-actions"><button type="button" onClick={() => setSelectedOrderId(order.suborderId)}>View</button><button type="button" aria-label={`More actions for ${order.orderNumber}`} disabled title="Additional order actions are not enabled"><MoreVertical size={17} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="s26-orders-board">
            {rows.map((order) => (
              <article key={order.id}>
                <header><StatusChip tone={order.fulfillmentTone}>{statusLabel(order.status)}</StatusChip><span>{order.updatedLabel}</span></header>
                <button type="button" onClick={() => setSelectedOrderId(order.suborderId)}>{order.orderNumber}</button>
                <div className="s26-order-buyer"><span>{order.customerInitials}</span><div><strong>{order.customerName}</strong><small>{order.customerEmail || "Buyer"}</small></div></div>
                <ItemStack order={order} />
                <dl><div><dt>Payment</dt><dd>{order.paymentLabel}</dd></div><div><dt>Fulfillment</dt><dd>{order.fulfillmentLabel}</dd></div><div><dt>Total</dt><dd>{formatMoney(order.totalAmount)}</dd></div></dl>
                <footer><button type="button" onClick={() => setSelectedOrderId(order.suborderId)}>View Order</button></footer>
              </article>
            ))}
          </div>
        )}

        <footer className="s26-orders-pagination">
          <span>Showing page {orders.data.pagination.page} of {orders.data.pagination.totalPages} - {orders.data.pagination.total} orders</span>
          <div>
            <select value={query.limit} onChange={(event) => changeQuery({ limit: Number(event.target.value), page: 1 })}><option value="10">10 rows</option><option value="20">20 rows</option><option value="50">50 rows</option></select>
            <button type="button" disabled={query.page <= 1} onClick={() => changeQuery({ page: 1 })}><ChevronsLeft size={16} /></button>
            <button type="button" disabled={query.page <= 1} onClick={() => changeQuery({ page: query.page - 1 })}><ChevronLeft size={16} /></button>
            <strong>{query.page}</strong>
            <button type="button" disabled={query.page >= orders.data.pagination.totalPages} onClick={() => changeQuery({ page: query.page + 1 })}><ChevronRight size={16} /></button>
            <button type="button" disabled={query.page >= orders.data.pagination.totalPages} onClick={() => changeQuery({ page: orders.data.pagination.totalPages })}><ChevronsRight size={16} /></button>
          </div>
        </footer>
      </section>

      {selectedOrderId ? (
        <SellerOrderDetail2026Panel
          order={orderDetail2026}
          isLoading={detailQuery.isLoading}
          error={detailQuery.isError ? detailQuery.error : null}
          isUpdating={Boolean(detailQuery.updatingStatusId)}
          onClose={closeOrderDetail}
          onBack={closeOrderDetail}
          onCopyReference={handleCopyReference}
          onPrintLabel={handlePrintLabel}
          onMessageBuyer={handleMessageBuyer}
          onViewInvoice={handleViewInvoice}
          onMarkDelivered={
            orderDetail2026?.canMarkDelivered && canFulfill
              ? () => handleFulfillmentAction("MARK_DELIVERED")
              : undefined
          }
        />
      ) : null}
    </div>
  );
}
