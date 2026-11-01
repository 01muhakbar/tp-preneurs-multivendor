import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  assignAdminOrdersDelivery,
  bulkActionAdminOrders,
  bulkDeleteAdminOrders,
  exportAdminOrders,
  fetchAdminOrders,
  unassignAdminOrdersDelivery,
  updateAdminOrderStatus,
} from "../../lib/adminApi.js";
import { prevData } from "../../lib/rq.ts";
import useAdminLocale from "../../hooks/useAdminLocale.js";
import {
  ADMIN_ORDER_ACTION_OPTIONS,
  getAdminOrderTransitionErrorMeta,
  toAdminOrderActionValue,
} from "./orderLifecyclePresentation.js";
import { normalizeAdminOrder } from "../../services/adapters/orderAdapter.js";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileText,
  Grid2X2,
  PackageCheck,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  ShoppingBag,
  Trash2,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import {
  UiErrorState,
  UiSkeleton,
  UiUpdatingBadge,
} from "../../components/primitives/state/index.js";
import { GENERIC_ERROR } from "../../constants/uiMessages.js";
import "./AdminOrdersPage.css";

const todayInput = () => new Date().toISOString().slice(0, 10);

const daysAgoInput = (days) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const DEFAULT_FILTERS = {
  startDate: daysAgoInput(7),
  endDate: todayInput(),
  customer: "",
  paymentStatus: "",
  paymentMethod: "",
  deliveryStatus: "",
};

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All Payment Statuses" },
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PENDING_CONFIRMATION", label: "Pending confirmation" },
  { value: "FAILED", label: "Failed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All Payment Methods" },
  { value: "qris", label: "Static QRIS" },
  { value: "duitku", label: "Duitku" },
];

const DELIVERY_STATUS_OPTIONS = [
  { value: "", label: "All Delivery Statuses" },
  { value: "waiting_payment", label: "Waiting payment" },
  { value: "ready_to_fulfill", label: "Ready to fulfill" },
  { value: "processing", label: "Processing" },
  { value: "in_delivery", label: "In delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
  { value: "failed", label: "Failed" },
];

const ROW_LIMIT_OPTIONS = [10, 20, 50, 100];

const COLUMN_DEFS = [
  { key: "invoice", label: "Invoice ID" },
  { key: "orderDate", label: "Date" },
  { key: "customer", label: "Customer" },
  { key: "paymentMethod", label: "Method" },
  { key: "amount", label: "Amount" },
  { key: "paymentStatus", label: "Payment" },
  { key: "deliveryStatus", label: "Delivery" },
  { key: "orderStatus", label: "Status" },
];

const INITIAL_VISIBLE_COLUMNS = COLUMN_DEFS.reduce(
  (acc, column) => ({ ...acc, [column.key]: true }),
  {}
);

const BULK_ACTIONS = [
  { action: "MARK_DELIVERED", label: "Mark as Delivered", tone: "success", icon: CheckCircle2 },
  { action: "MARK_CANCELLED", label: "Mark as Cancelled", tone: "muted", icon: Ban },
  { action: "MARK_FAILED", label: "Mark as Failed", tone: "danger", icon: X },
];

const toText = (value) => String(value ?? "").trim();

const normalizeToken = (value) =>
  toText(value)
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();

const getInvoiceParam = (order, view) =>
  toText(view?.invoiceNo || order?.invoiceNo || order?.invoice || order?.orderRef || order?.reference || order?.ref || order?.id);

const getOrderDateValue = (order, view) =>
  view?.orderTime || order?.orderDate || order?.createdAt || order?.created_at || order?.order_time || null;

const getPaymentStatus = (order) =>
  normalizeToken(order?.paymentStatus || order?.payment?.status || order?.payment_state || "UNPAID");

const getOrderStatus = (order) =>
  toText(order?.orderStatus || order?.rawStatus || order?.status || "pending");

const getDeliveryStatus = (order, view) => {
  const raw =
    order?.deliveryStatus ||
    order?.shipmentStatus ||
    order?.shippingStatus ||
    order?.fulfillmentStatus ||
    order?.shippingStatusMeta?.label ||
    view?.deliveryName ||
    "";
  return normalizeToken(raw || (view?.deliveryAssigned ? "PROCESSING" : "WAITING_PAYMENT"));
};

const getTone = (raw) => {
  const value = normalizeToken(raw);
  if (["PAID", "DELIVERED", "COMPLETED", "COMPLETE"].includes(value)) return "green";
  if (["PROCESSING", "READY_TO_FULFILL", "READY", "SHIPPED", "IN_DELIVERY", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(value)) return "blue";
  if (["PENDING", "WAITING_PAYMENT", "PENDING_CONFIRMATION", "EXPIRED", "UNFULFILLED"].includes(value)) return "orange";
  if (["FAILED", "REJECTED", "FAILED_DELIVERY"].includes(value)) return "orange";
  if (["CANCELLED", "CANCELED", "UNPAID"].includes(value)) return "neutral";
  return "neutral";
};

const labelize = (raw) => {
  const value = toText(raw);
  if (!value) return "-";
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getPaymentMethodLabel = (view, order) => {
  const raw = toText(
    view?.paymentMethodLabel ||
      view?.methodLabel ||
      order?.paymentMethodLabel ||
      order?.methodLabel ||
      order?.payment?.paymentMethodLabel ||
      view?.method ||
      order?.paymentMethod ||
      order?.payment?.method ||
      order?.method
  );
  const normalized = raw.toLowerCase();
  if (normalized === "duitku") return "Duitku POP";
  if (normalized.includes("duitku")) return raw || "Duitku POP";
  if (normalized === "qris") return "Static QRIS";
  if (normalized.includes("qris")) return raw || "Static QRIS";
  if (normalized.includes("card")) return "Static QRIS";
  if (normalized.includes("cash") || normalized.includes("cod")) return "COD";
  if (normalized.includes("credit")) return "Credit";
  return raw || "Static QRIS";
};

const normalizeRows = (items) =>
  items.map((order) => ({
    order,
    view: normalizeAdminOrder({
      ...order,
      invoiceNo: order?.invoiceNo || order?.invoice || order?.orderRef || order?.reference,
      createdAt: order?.orderDate || order?.createdAt || order?.created_at || order?.order_time,
      customerName:
        order?.customerName ||
        order?.customer?.name ||
        order?.user?.name ||
        order?.buyerName,
      paymentMethod: order?.paymentMethod || order?.payment?.method || order?.method,
      paymentMethodLabel: order?.paymentMethodLabel || order?.methodLabel,
      totalAmount: order?.amount || order?.total || order?.grandTotal || order?.totalAmount,
    }),
  }));

const downloadBlob = (response, fallbackName) => {
  const blob = response?.data;
  const objectUrl = window.URL.createObjectURL(blob);
  const disposition = response?.headers?.["content-disposition"] || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] || fallbackName;
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(objectUrl);
  return filename;
};

const getErrorMessage = (error, fallback = GENERIC_ERROR) =>
  error?.response?.data?.message || error?.message || fallback;

export default function Orders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { formatDateTime, formatMoney } = useAdminLocale();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [goToPage, setGoToPage] = useState("1");
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [customerInput, setCustomerInput] = useState(DEFAULT_FILTERS.customer);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
  const [pendingUpdateId, setPendingUpdateId] = useState(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) =>
        current.customer === customerInput ? current : { ...current, customer: customerInput.trim() }
      );
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [customerInput]);

  useEffect(() => {
    setGoToPage(String(page));
  }, [page]);

  useEffect(() => {
    const closeMenus = (event) => {
      const target = event.target;
      if (!target.closest?.("[data-admin-orders-menu]")) {
        setBulkMenuOpen(false);
        setColumnsMenuOpen(false);
      }
    };
    document.addEventListener("click", closeMenus);
    return () => document.removeEventListener("click", closeMenus);
  }, []);

  const queryParams = useMemo(
    () => ({
      page,
      limit: pageSize,
      startDate: filters.startDate,
      endDate: filters.endDate,
      customer: filters.customer,
      paymentStatus: filters.paymentStatus,
      paymentMethod: filters.paymentMethod,
      deliveryStatus: filters.deliveryStatus,
      sortBy: "orderDate",
      sortDir,
    }),
    [filters, page, pageSize, sortDir]
  );

  const ordersQuery = useQuery({
    queryKey: ["admin-orders", queryParams],
    queryFn: () => fetchAdminOrders(queryParams),
    placeholderData: prevData,
  });

  const invalidateOrders = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-orders"], exact: false });

  const mutationOptions = {
    meta: { suppressGlobalToast: true },
    onSuccess: (payload) => {
      toast.success(payload?.message || "Order action completed.");
      setSelectedIds(new Set());
      invalidateOrders();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Order action failed."));
    },
  };

  const updateMutation = useMutation({
    mutationFn: ({ target, status }) => updateAdminOrderStatus(target, { status }),
    meta: { suppressGlobalToast: true },
    onMutate: ({ target }) => setPendingUpdateId(target),
    onSuccess: () => {
      toast.success("Order status updated.");
      invalidateOrders();
    },
    onError: (error) => {
      const errorMeta = getAdminOrderTransitionErrorMeta(error);
      toast.error([errorMeta.title, errorMeta.message, errorMeta.detail].filter(Boolean).join(". "));
    },
    onSettled: () => setPendingUpdateId(null),
  });

  const bulkMutation = useMutation({
    mutationFn: bulkActionAdminOrders,
    ...mutationOptions,
  });

  const assignMutation = useMutation({
    mutationFn: assignAdminOrdersDelivery,
    ...mutationOptions,
  });

  const unassignMutation = useMutation({
    mutationFn: unassignAdminOrdersDelivery,
    ...mutationOptions,
  });

  const deleteMutation = useMutation({
    mutationFn: bulkDeleteAdminOrders,
    ...mutationOptions,
  });

  const downloadMutation = useMutation({
    mutationFn: exportAdminOrders,
    meta: { suppressGlobalToast: true },
    onSuccess: (response) => {
      const stamp = new Date().toISOString().slice(0, 10);
      const filename = downloadBlob(response, `orders-${stamp}.csv`);
      toast.success(`Exported as ${filename}.`);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to download orders.")),
  });

  const items = Array.isArray(ordersQuery.data?.data) ? ordersQuery.data.data : [];
  const rows = useMemo(() => normalizeRows(items), [items]);
  const meta = ordersQuery.data?.meta || { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const totalPages = Math.max(1, Number(meta.totalPages || 1));
  const summary = meta.summary || {
    totalOrders: Number(meta.total || 0),
    processing: rows.filter(({ order }) => getTone(getOrderStatus(order)) === "blue").length,
    delivered: rows.filter(({ order }) => getTone(getOrderStatus(order)) === "green").length,
    paymentIssues: rows.filter(({ order }) => getTone(getPaymentStatus(order)) !== "green").length,
  };

  useEffect(() => {
    const visibleIds = new Set(rows.map(({ view }) => Number(view?.id)).filter(Boolean));
    setSelectedIds((previous) => {
      const next = new Set();
      previous.forEach((id) => {
        if (visibleIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [rows]);

  const selectedRows = rows.filter(({ view }) => selectedIds.has(Number(view?.id)));
  const selectedCount = selectedRows.length;
  const visibleIds = rows.map(({ view }) => Number(view?.id)).filter(Boolean);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const isBusy =
    updateMutation.isPending ||
    bulkMutation.isPending ||
    assignMutation.isPending ||
    unassignMutation.isPending ||
    deleteMutation.isPending;
  const isInitialLoading = ordersQuery.isLoading && !ordersQuery.data;
  const isErrorState = ordersQuery.isError && !ordersQuery.data;

  const selectedPayload = () => ({
    ids: selectedRows.map(({ view }) => Number(view.id)).filter(Boolean),
    invoiceNos: selectedRows.map(({ order, view }) => getInvoiceParam(order, view)).filter(Boolean),
  });

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setSelectedIds(new Set());
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({ ...DEFAULT_FILTERS, customer: "" });
    setCustomerInput("");
    setSelectedIds(new Set());
    setPage(1);
  };

  const toggleRowSelection = (id) => {
    const normalizedId = Number(id || 0);
    if (!normalizedId) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(normalizedId)) next.delete(normalizedId);
      else next.add(normalizedId);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    if (visibleIds.length === 0) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      visibleIds.forEach((id) => {
        if (allVisibleSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const runBulkAction = (action) => {
    setBulkMenuOpen(false);
    if (selectedCount === 0) {
      toast.error("Select at least one order first.");
      return;
    }
    bulkMutation.mutate({ ...selectedPayload(), action });
  };

  const runAssign = () => {
    if (selectedCount === 0) return toast.error("Select at least one order first.");
    assignMutation.mutate(selectedPayload());
  };

  const runUnassign = () => {
    if (selectedCount === 0) return toast.error("Select at least one order first.");
    unassignMutation.mutate(selectedPayload());
  };

  const runDelete = () => {
    if (selectedCount === 0) return toast.error("Select at least one order first.");
    const confirmed = window.confirm(
      selectedCount === 1
        ? "Delete selected order? This action cannot be undone."
        : `Delete ${selectedCount} selected orders? This action cannot be undone.`
    );
    if (!confirmed) return;
    deleteMutation.mutate(selectedPayload().ids);
  };

  const runDownload = () => {
    downloadMutation.mutate({
      ...filters,
      sortBy: "orderDate",
      sortDir,
    });
  };

  const onUpdateStatus = (order, view, status) => {
    const target = getInvoiceParam(order, view) || view?.id || order?.id;
    if (!target || !status) return;
    updateMutation.mutate({ target, status });
  };

  const onPrintInvoice = (order, view) => {
    const invoiceParam = getInvoiceParam(order, view);
    if (!invoiceParam) return toast.error("Order detail unavailable.");
    const printWindow = window.open(`/admin/orders/${encodeURIComponent(invoiceParam)}?print=1`, "_blank");
    if (!printWindow) toast.error("Pop-up blocked. Allow pop-ups to print invoice.");
  };

  const copyInvoice = (invoiceParam) => {
    navigator.clipboard.writeText(invoiceParam).then(() => toast.success("Invoice copied."));
  };

  return (
    <div className="admin-orders-2026">
      {/* HEADER SECTION */}
      <header className="orders-hero">
        <div className="orders-title">
          <div className="orders-title__icon">
            <ShoppingBag size={22} />
          </div>
          <div className="orders-title-text">
            <div className="orders-title-row">
              <h1>Orders</h1>
              <span className="orders-badge-count">{meta.total || rows.length}</span>
            </div>
            <p>Manage customer orders</p>
          </div>
        </div>

        <div className="orders-actions">
          <button
            type="button"
            className="orders-btn"
            onClick={() => invalidateOrders()}
            disabled={ordersQuery.isFetching}
            title="Refresh list"
          >
            <RefreshCw size={14} className={ordersQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            className="orders-btn orders-btn--primary"
            onClick={runDownload}
            disabled={downloadMutation.isPending}
            title="Export CSV"
          >
            <Download size={14} />
            {downloadMutation.isPending ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </header>

      {/* DYNAMIC SELECTION ACTION BAR (Appears when >= 1 item selected) */}
      {selectedCount > 0 && (
        <section className="orders-floating-bar" aria-label="Selected actions">
          <div className="orders-floating-info">
            <span className="orders-floating-badge">{selectedCount}</span>
            <span>orders selected</span>
          </div>
          <div className="orders-floating-actions">
            <button
              type="button"
              className="orders-floating-btn"
              onClick={runAssign}
              disabled={isBusy}
            >
              <Truck size={14} />
              Assign
            </button>
            <button
              type="button"
              className="orders-floating-btn"
              onClick={runUnassign}
              disabled={isBusy}
            >
              <UserRound size={14} />
              Unassign
            </button>
            <div className="orders-menu-wrap" data-admin-orders-menu>
              <button
                type="button"
                className="orders-floating-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setBulkMenuOpen(!bulkMenuOpen);
                }}
                disabled={isBusy}
              >
                <FileText size={14} />
                Status <ChevronDown size={13} />
              </button>
              {bulkMenuOpen && (
                <div className="orders-dropdown">
                  {BULK_ACTIONS.map((item) => (
                    <button
                      key={item.action}
                      type="button"
                      onClick={() => runBulkAction(item.action)}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              className="orders-floating-btn orders-floating-btn--danger"
              onClick={runDelete}
              disabled={isBusy}
            >
              <Trash2 size={14} />
              Delete
            </button>
            <button
              type="button"
              className="orders-floating-close"
              onClick={() => setSelectedIds(new Set())}
              title="Clear selection"
            >
              <X size={16} />
            </button>
          </div>
        </section>
      )}

      {/* METRICS SUMMARY CARDS */}
      <section className="orders-metrics" aria-label="Order summary">
        <div className="orders-metric-card is-blue">
          <div className="orders-metric-top">
            <span className="orders-metric-title">Total Orders</span>
            <div className="orders-metric-icon">
              <ShoppingBag size={17} />
            </div>
          </div>
          <div className="orders-metric-val-row">
            <span className="orders-metric-val">{summary.totalOrders}</span>
            <span className="orders-metric-sub">Total</span>
          </div>
        </div>

        <div className="orders-metric-card is-blue">
          <div className="orders-metric-top">
            <span className="orders-metric-title">Processing</span>
            <div className="orders-metric-icon">
              <Clock3 size={17} />
            </div>
          </div>
          <div className="orders-metric-val-row">
            <span className="orders-metric-val">{summary.processing}</span>
            <span className="orders-metric-sub">Fulfillment</span>
          </div>
        </div>

        <div className="orders-metric-card is-orange">
          <div className="orders-metric-top">
            <span className="orders-metric-title">Payment Issues</span>
            <div className="orders-metric-icon">
              <CreditCard size={17} />
            </div>
          </div>
          <div className="orders-metric-val-row">
            <span className="orders-metric-val">{summary.paymentIssues}</span>
            <span className="orders-metric-sub">Attention</span>
          </div>
        </div>

        <div className="orders-metric-card is-green">
          <div className="orders-metric-top">
            <span className="orders-metric-title">Delivered</span>
            <div className="orders-metric-icon">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="orders-metric-val-row">
            <span className="orders-metric-val">{summary.delivered}</span>
            <span className="orders-metric-sub">Completed</span>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="orders-filter-card">
        {/* Quick Filter Chips */}
        <div className="orders-quick-chips">
          <button
            type="button"
            onClick={() => {
              updateFilter("paymentStatus", "");
              updateFilter("deliveryStatus", "");
            }}
            className={`orders-quick-chip ${!filters.paymentStatus && !filters.deliveryStatus ? "is-active" : ""}`}
          >
            All
            <span className="orders-quick-count">{meta.total || rows.length}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              updateFilter("paymentStatus", "UNPAID");
              updateFilter("deliveryStatus", "");
            }}
            className={`orders-quick-chip ${filters.paymentStatus === "UNPAID" ? "is-active" : ""}`}
          >
            Payment Issues
            <span className="orders-quick-count">{summary.paymentIssues}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              updateFilter("paymentStatus", "");
              updateFilter("deliveryStatus", "processing");
            }}
            className={`orders-quick-chip ${filters.deliveryStatus === "processing" ? "is-active" : ""}`}
          >
            Processing
            <span className="orders-quick-count">{summary.processing}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              updateFilter("paymentStatus", "");
              updateFilter("deliveryStatus", "delivered");
            }}
            className={`orders-quick-chip ${filters.deliveryStatus === "delivered" ? "is-active" : ""}`}
          >
            Delivered
            <span className="orders-quick-count">{summary.delivered}</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="orders-filter-grid">
          <div className="orders-input-wrap">
            <Search size={14} style={{ color: "var(--orders-dim)" }} />
            <input
              type="text"
              value={customerInput}
              onChange={(e) => setCustomerInput(e.target.value)}
              placeholder="Search customer or invoice..."
            />
            {customerInput && (
              <button
                type="button"
                onClick={() => setCustomerInput("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--orders-dim)" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={filters.paymentStatus}
            onChange={(e) => updateFilter("paymentStatus", e.target.value)}
            className="orders-select"
          >
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.deliveryStatus}
            onChange={(e) => updateFilter("deliveryStatus", e.target.value)}
            className="orders-select"
          >
            {DELIVERY_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.paymentMethod}
            onChange={(e) => updateFilter("paymentMethod", e.target.value)}
            className="orders-select"
          >
            {PAYMENT_METHOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="orders-date-group">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter("startDate", e.target.value)}
            />
            <span style={{ color: "var(--orders-dim)", fontSize: "0.75rem" }}>—</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="orders-btn"
            title="Reset filters"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </section>

      {/* SKELETON / ERROR */}
      {isInitialLoading && <UiSkeleton variant="table" rows={6} />}

      {isErrorState && (
        <UiErrorState
          title={GENERIC_ERROR}
          message={getErrorMessage(ordersQuery.error)}
          onRetry={() => ordersQuery.refetch()}
        />
      )}

      {/* TABLE / CARDS CONTENT */}
      {!isInitialLoading && !isErrorState && (
        <section className="orders-table-card">
          <div className="orders-table-toolbar">
            <div>
              Showing {rows.length > 0 ? (Number(meta.page || page) - 1) * Number(meta.limit || pageSize) + 1 : 0} to{" "}
              {Math.min(Number(meta.total || 0), (Number(meta.page || page) - 1) * Number(meta.limit || pageSize) + rows.length)} of{" "}
              {Number(meta.total || 0)} orders
              {ordersQuery.isFetching && <UiUpdatingBadge />}
            </div>

            <div className="orders-table-tools">
              <div className="orders-menu-wrap" data-admin-orders-menu>
                <button
                  type="button"
                  className="orders-btn orders-btn--sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setColumnsMenuOpen(!columnsMenuOpen);
                  }}
                >
                  <Grid2X2 size={13} />
                  Columns
                  <ChevronDown size={12} />
                </button>
                {columnsMenuOpen && (
                  <div className="orders-dropdown">
                    {COLUMN_DEFS.map((col) => (
                      <label key={col.key}>
                        <input
                          type="checkbox"
                          checked={Boolean(visibleColumns[col.key])}
                          onChange={() =>
                            setVisibleColumns((cur) => ({
                              ...cur,
                              [col.key]: !cur[col.key],
                            }))
                          }
                        />
                        {col.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {rows.length === 0 ? (
            <div className="orders-empty">
              <div className="orders-empty-icon">
                <PackageCheck size={22} />
              </div>
              <h3 className="orders-empty-title">No orders found</h3>
              <p className="orders-empty-desc">Adjust filters or search criteria.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="orders-btn orders-btn--sm"
                style={{ marginTop: 8 }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE (>= 768px) */}
              <div className="orders-table-scroll">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          aria-label="Select all"
                        />
                      </th>
                      {visibleColumns.invoice && <th>Invoice</th>}
                      {visibleColumns.orderDate && (
                        <th>
                          <button
                            type="button"
                            onClick={() => setSortDir((c) => (c === "desc" ? "asc" : "desc"))}
                            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, font: "inherit", color: "inherit", fontWeight: 700 }}
                          >
                            Date
                            <ChevronDown size={13} style={{ transform: sortDir === "asc" ? "rotate(180deg)" : "none" }} />
                          </button>
                        </th>
                      )}
                      {visibleColumns.customer && <th>Customer</th>}
                      {visibleColumns.paymentMethod && <th>Method</th>}
                      {visibleColumns.amount && <th>Amount</th>}
                      {visibleColumns.paymentStatus && <th>Payment</th>}
                      {visibleColumns.deliveryStatus && <th>Delivery</th>}
                      {visibleColumns.orderStatus && <th>Status</th>}
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ order, view }) => {
                      const rowId = Number(view?.id || order?.id || 0);
                      const invoiceParam = getInvoiceParam(order, view);
                      const orderDateValue = getOrderDateValue(order, view);
                      const paymentStatus = getPaymentStatus(order);
                      const deliveryStatus = getDeliveryStatus(order, view);
                      const orderStatus = getOrderStatus(order);
                      const paymentMethod = getPaymentMethodLabel(view, order);
                      const actionStatus = toAdminOrderActionValue(orderStatus);
                      const contract = order?.contract || null;
                      const actionOptions =
                        Array.isArray(contract?.availableActions) && contract.availableActions.length > 0
                          ? contract.availableActions
                          : ADMIN_ORDER_ACTION_OPTIONS.map((opt) => ({
                              code: opt.value,
                              label: opt.label,
                              enabled: opt.value === actionStatus,
                            }));
                      const isUpdating = pendingUpdateId === invoiceParam || pendingUpdateId === rowId;
                      const isSelected = selectedIds.has(rowId);

                      return (
                        <tr key={rowId || invoiceParam} className={isSelected ? "is-selected" : ""}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(rowId)}
                            />
                          </td>
                          {visibleColumns.invoice && (
                            <td>
                              <div className="orders-invoice-cell">
                                <Link
                                  to={`/admin/orders/${encodeURIComponent(invoiceParam)}`}
                                  className="orders-invoice-link"
                                  title={invoiceParam}
                                >
                                  {invoiceParam.length > 20
                                    ? `${invoiceParam.slice(0, 14)}...${invoiceParam.slice(-4)}`
                                    : invoiceParam}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => copyInvoice(invoiceParam)}
                                  className="orders-copy-icon"
                                  title="Copy Invoice ID"
                                >
                                  <Copy size={12} />
                                </button>
                              </div>
                            </td>
                          )}
                          {visibleColumns.orderDate && (
                            <td style={{ whiteSpace: "nowrap", color: "var(--orders-muted)" }}>
                              {formatDateTime(orderDateValue)}
                            </td>
                          )}
                          {visibleColumns.customer && (
                            <td>
                              <div className="orders-customer-name" title={view.customerName}>
                                {view.customerName}
                              </div>
                            </td>
                          )}
                          {visibleColumns.paymentMethod && (
                            <td>
                              <span className="orders-badge orders-badge--blue">
                                {paymentMethod}
                              </span>
                            </td>
                          )}
                          {visibleColumns.amount && (
                            <td>
                              <span className="orders-amount-text">
                                {formatMoney(view.amount)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.paymentStatus && (
                            <td>
                              <span className={`orders-badge ${paymentStatus === "PAID" ? "orders-badge--green" : "orders-badge--orange"}`}>
                                {labelize(paymentStatus)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.deliveryStatus && (
                            <td>
                              <span className={`orders-badge ${deliveryStatus === "DELIVERED" ? "orders-badge--green" : deliveryStatus === "IN_DELIVERY" || deliveryStatus === "PROCESSING" ? "orders-badge--blue" : "orders-badge--orange"}`}>
                                {labelize(deliveryStatus)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.orderStatus && (
                            <td>
                              <select
                                className="orders-status-select"
                                value={actionStatus}
                                disabled={isUpdating}
                                onChange={(e) => onUpdateStatus(order, view, e.target.value)}
                              >
                                {actionOptions.map((opt) => (
                                  <option
                                    key={opt.code || opt.value}
                                    value={opt.code || opt.value}
                                    disabled={opt.enabled === false}
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}
                          <td style={{ textAlign: "right" }}>
                            <div className="orders-row-actions">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/orders/${encodeURIComponent(invoiceParam)}`)}
                                className="orders-action-btn"
                                title="View Detail"
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onPrintInvoice(order, view)}
                                className="orders-action-btn"
                                title="Print Invoice"
                              >
                                <Printer size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE ORDER CARDS (< 768px) */}
              <div className="orders-mobile-feed">
                {rows.map(({ order, view }) => {
                  const rowId = Number(view?.id || order?.id || 0);
                  const invoiceParam = getInvoiceParam(order, view);
                  const paymentStatus = getPaymentStatus(order);
                  const deliveryStatus = getDeliveryStatus(order, view);
                  const isSelected = selectedIds.has(rowId);

                  return (
                    <div
                      key={rowId || invoiceParam}
                      className={`orders-mobile-card ${isSelected ? "is-selected" : ""}`}
                    >
                      <div className="orders-mobile-top">
                        <span className="orders-mobile-inv">
                          {invoiceParam.length > 22
                            ? `${invoiceParam.slice(0, 16)}...`
                            : invoiceParam}
                        </span>
                        <span className={`orders-badge ${paymentStatus === "PAID" ? "orders-badge--green" : "orders-badge--orange"}`}>
                          {labelize(paymentStatus)}
                        </span>
                      </div>

                      <div className="orders-mobile-mid">
                        <span className="orders-mobile-customer">{view.customerName}</span>
                        <span className="orders-mobile-amount">{formatMoney(view.amount)}</span>
                      </div>

                      <div className="orders-mobile-badges">
                        <span className="orders-badge orders-badge--neutral">
                          {getPaymentMethodLabel(view, order)}
                        </span>
                        <span className={`orders-badge ${deliveryStatus === "DELIVERED" ? "orders-badge--green" : "orders-badge--blue"}`}>
                          {labelize(deliveryStatus)}
                        </span>
                      </div>

                      <div className="orders-mobile-actions">
                        <button
                          type="button"
                          onClick={() => onPrintInvoice(order, view)}
                          className="orders-btn orders-btn--sm"
                        >
                          <Printer size={13} />
                          Print
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/orders/${encodeURIComponent(invoiceParam)}`)}
                          className="orders-btn orders-btn--primary orders-btn--sm"
                        >
                          <Eye size={13} />
                          Detail
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* PAGINATION */}
          <div className="orders-pagination">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="orders-select"
                style={{ height: 32, padding: "0 8px" }}
              >
                {ROW_LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="orders-pages">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pageNum = start + idx;
                if (pageNum > totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={pageNum === page ? "is-active" : ""}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((c) => Math.min(totalPages, c + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
