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
  CalendarDays,
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
  MoreVertical,
  PackageCheck,
  Printer,
  RefreshCw,
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
  { value: "", label: "All Statuses" },
  { value: "PAID", label: "Paid" },
  { value: "UNPAID", label: "Unpaid" },
  { value: "PENDING_CONFIRMATION", label: "Pending confirmation" },
  { value: "FAILED", label: "Failed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All Methods" },
  { value: "card", label: "QRIS" },
  { value: "cash", label: "Cash" },
  { value: "credit", label: "Credit" },
];

const DELIVERY_STATUS_OPTIONS = [
  { value: "", label: "All Delivery Status" },
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
  { key: "orderDate", label: "Order Date" },
  { key: "customer", label: "Customer" },
  { key: "paymentMethod", label: "Payment Method" },
  { key: "amount", label: "Amount" },
  { key: "paymentStatus", label: "Payment Status" },
  { key: "deliveryStatus", label: "Delivery Status" },
  { key: "orderStatus", label: "Order Status" },
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

const formatDisplayDate = (value) => {
  if (!value) return "Any";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

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
  if (["PAID", "DELIVERED", "COMPLETED", "COMPLETE"].includes(value)) return "success";
  if (["PROCESSING", "READY_TO_FULFILL", "READY", "SHIPPED", "IN_DELIVERY", "IN_TRANSIT", "OUT_FOR_DELIVERY"].includes(value)) return "info";
  if (["PENDING", "WAITING_PAYMENT", "PENDING_CONFIRMATION", "EXPIRED", "UNFULFILLED"].includes(value)) return "warning";
  if (["FAILED", "REJECTED", "FAILED_DELIVERY"].includes(value)) return "danger";
  if (["CANCELLED", "CANCELED", "UNPAID"].includes(value)) return "muted";
  return "muted";
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
  const raw = toText(view?.method || order?.paymentMethod || order?.payment?.method || order?.method);
  const normalized = raw.toLowerCase();
  const checkoutMode = normalizeToken(order?.checkoutMode || "");
  if (
    normalized.includes("qris") ||
    normalized.includes("card") ||
    checkoutMode === "SINGLE_STORE" ||
    checkoutMode === "MULTI_STORE"
  ) {
    return "QRIS";
  }
  if (normalized.includes("cash") || normalized.includes("cod")) return "COD";
  if (normalized.includes("credit")) return "Credit";
  return raw || "QRIS";
};

const getOptionLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || labelize(value);

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
  const [openMoreId, setOpenMoreId] = useState(null);
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
        setOpenMoreId(null);
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
      const filename = downloadBlob(response, `tp-preneurs-orders-${stamp}.csv`);
      toast.success(`Orders downloaded as ${filename}.`);
    },
    onError: (error) => toast.error(getErrorMessage(error, "Failed to download orders.")),
  });

  const items = Array.isArray(ordersQuery.data?.data) ? ordersQuery.data.data : [];
  const rows = useMemo(() => normalizeRows(items), [items]);
  const meta = ordersQuery.data?.meta || { page: 1, limit: pageSize, total: 0, totalPages: 1 };
  const totalPages = Math.max(1, Number(meta.totalPages || 1));
  const summary = meta.summary || {
    totalOrders: Number(meta.total || 0),
    processing: rows.filter(({ order }) => getTone(getOrderStatus(order)) === "info").length,
    delivered: rows.filter(({ order }) => getTone(getOrderStatus(order)) === "success").length,
    paymentIssues: rows.filter(({ order }) => getTone(getPaymentStatus(order)) !== "success").length,
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
  const showInlineError = ordersQuery.isError && Boolean(ordersQuery.data);

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
        ? "Delete the selected order? This action cannot be undone."
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
    if (!invoiceParam) return toast.error("Order detail is unavailable for this record.");
    const printWindow = window.open(`/admin/orders/${encodeURIComponent(invoiceParam)}?print=1`, "_blank");
    if (!printWindow) toast.error("Pop-up blocked. Allow pop-ups to print invoice.");
  };

  const onGoToPage = (event) => {
    event.preventDefault();
    const nextPage = Math.max(1, Math.min(totalPages, Number(goToPage) || 1));
    setPage(nextPage);
  };

  const activeFilterChips = [
    filters.startDate || filters.endDate
      ? {
          key: "date",
          label: `Date: ${formatDisplayDate(filters.startDate)} - ${formatDisplayDate(filters.endDate)}`,
          clear: () => {
            updateFilter("startDate", "");
            updateFilter("endDate", "");
          },
        }
      : null,
    filters.paymentStatus
      ? {
          key: "paymentStatus",
          label: `Payment Status: ${labelize(filters.paymentStatus)}`,
          clear: () => updateFilter("paymentStatus", ""),
        }
      : null,
    filters.deliveryStatus
      ? {
          key: "deliveryStatus",
          label: `Delivery Status: ${labelize(filters.deliveryStatus)}`,
          clear: () => updateFilter("deliveryStatus", ""),
        }
      : null,
    filters.paymentMethod
      ? {
          key: "paymentMethod",
          label: `Payment Method: ${getOptionLabel(PAYMENT_METHOD_OPTIONS, filters.paymentMethod)}`,
          clear: () => updateFilter("paymentMethod", ""),
        }
      : null,
    filters.customer
      ? {
          key: "customer",
          label: `Customer: ${filters.customer}`,
          clear: () => {
            setCustomerInput("");
            updateFilter("customer", "");
          },
        }
      : null,
  ].filter(Boolean);

  const metricCards = [
    {
      label: "Total Orders",
      value: summary.totalOrders,
      detail: "This range",
      icon: ShoppingBag,
      tone: "primary",
    },
    {
      label: "Processing",
      value: summary.processing,
      detail: "Pending fulfillment",
      icon: Clock3,
      tone: "warning",
    },
    {
      label: "Delivered",
      value: summary.delivered,
      detail: "Successfully delivered",
      icon: CheckCircle2,
      tone: "success",
    },
    {
      label: "Payment Issues",
      value: summary.paymentIssues,
      detail: "Require attention",
      icon: CreditCard,
      tone: "danger",
    },
  ];

  return (
    <div className="admin-orders-2026">
      <section className="orders-hero">
        <div className="orders-title">
          <span className="orders-title__icon" aria-hidden="true">
            <CalendarDays size={24} />
          </span>
          <div>
            <h1>Orders</h1>
            <p>Manage and track customer orders</p>
          </div>
        </div>

        <div className="orders-actions">
          {selectedCount > 0 ? (
            <button type="button" className="orders-selection-pill" onClick={() => setSelectedIds(new Set())}>
              {selectedCount} selected <X size={16} />
            </button>
          ) : null}

          <div className="orders-menu-wrap" data-admin-orders-menu>
            <button
              type="button"
              className="orders-btn orders-btn--outline"
              onClick={(event) => {
                event.stopPropagation();
                setBulkMenuOpen((open) => !open);
              }}
              disabled={isBusy}
            >
              <FileText size={17} />
              Bulk Actions
              {selectedCount > 0 ? <span className="orders-count-badge">{selectedCount}</span> : null}
              <ChevronDown size={16} />
            </button>
            {bulkMenuOpen ? (
              <div className="orders-dropdown orders-dropdown--bulk">
                {BULK_ACTIONS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.action} type="button" onClick={() => runBulkAction(item.action)}>
                      <span className={`orders-menu-dot orders-menu-dot--${item.tone}`}>
                        <Icon size={15} />
                      </span>
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <button type="button" className="orders-btn orders-btn--outline" onClick={runAssign} disabled={isBusy}>
            <Truck size={17} />
            Assign Delivery
          </button>
          <button type="button" className="orders-btn orders-btn--outline" onClick={runUnassign} disabled={isBusy}>
            <UserRound size={17} />
            Unassign
          </button>
          <button type="button" className="orders-btn orders-btn--danger" onClick={runDelete} disabled={isBusy}>
            <Trash2 size={17} />
            Delete
          </button>
          <button type="button" className="orders-btn orders-btn--primary" onClick={runDownload} disabled={downloadMutation.isPending}>
            <Download size={17} />
            {downloadMutation.isPending ? "Downloading..." : "Download All Orders"}
          </button>
        </div>
      </section>

      <section className="orders-metrics" aria-label="Order summary">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="orders-metric">
              <span className={`orders-metric__icon orders-metric__icon--${card.tone}`}>
                <Icon size={24} />
              </span>
              <div>
                <p>{card.label}</p>
                <strong>{card.value}</strong>
                <span>{card.detail}</span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="orders-filter-panel">
        <label className="orders-field orders-field--date">
          <span>Date Range</span>
          <div className="orders-date-range">
            <CalendarDays size={16} />
            <input type="date" value={filters.startDate} onChange={(event) => updateFilter("startDate", event.target.value)} />
            <ChevronRight size={15} />
            <input type="date" value={filters.endDate} onChange={(event) => updateFilter("endDate", event.target.value)} />
          </div>
        </label>

        <label className="orders-field">
          <span>Customer</span>
          <div className="orders-input-with-icon">
            <Search size={17} />
            <input
              type="search"
              value={customerInput}
              onChange={(event) => setCustomerInput(event.target.value)}
              placeholder="Search customer..."
            />
          </div>
        </label>

        <label className="orders-field">
          <span>Payment Status</span>
          <select value={filters.paymentStatus} onChange={(event) => updateFilter("paymentStatus", event.target.value)}>
            {PAYMENT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="orders-field">
          <span>Payment Method</span>
          <select value={filters.paymentMethod} onChange={(event) => updateFilter("paymentMethod", event.target.value)}>
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <label className="orders-field">
          <span>Delivery Status</span>
          <select value={filters.deliveryStatus} onChange={(event) => updateFilter("deliveryStatus", event.target.value)}>
            {DELIVERY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <button type="button" className="orders-reset-btn" onClick={resetFilters}>
          <RefreshCw size={17} />
          Reset
        </button>
      </section>

      {activeFilterChips.length > 0 ? (
        <div className="orders-filter-chips">
          {activeFilterChips.map((chip) => (
            <button key={chip.key} type="button" onClick={chip.clear}>
              {chip.label}
              <X size={14} />
            </button>
          ))}
          <button type="button" className="orders-filter-clear" onClick={resetFilters}>
            Clear all
          </button>
        </div>
      ) : null}

      {isInitialLoading ? <UiSkeleton variant="table" rows={8} /> : null}

      {isErrorState ? (
        <UiErrorState
          title={GENERIC_ERROR}
          message={getErrorMessage(ordersQuery.error)}
          onRetry={() => ordersQuery.refetch()}
        />
      ) : null}

      {!isInitialLoading && !isErrorState ? (
        <section className="orders-table-card">
          {showInlineError ? (
            <div className="orders-inline-error">
              Could not refresh orders. Showing previous data.
              <button type="button" onClick={() => ordersQuery.refetch()}>Try again</button>
            </div>
          ) : null}

          <div className="orders-table-toolbar">
            <div>
              Showing {rows.length > 0 ? (Number(meta.page || page) - 1) * Number(meta.limit || pageSize) + 1 : 0} to{" "}
              {Math.min(Number(meta.total || 0), (Number(meta.page || page) - 1) * Number(meta.limit || pageSize) + rows.length)} of{" "}
              {Number(meta.total || 0)} orders
              {ordersQuery.isFetching && !isInitialLoading ? <UiUpdatingBadge /> : null}
            </div>
            <div className="orders-table-tools">
              <div className="orders-menu-wrap" data-admin-orders-menu>
                <button
                  type="button"
                  className="orders-icon-btn orders-columns-btn"
                  onClick={(event) => {
                    event.stopPropagation();
                    setColumnsMenuOpen((open) => !open);
                  }}
                >
                  <Grid2X2 size={18} />
                  Columns
                  <ChevronDown size={15} />
                </button>
                {columnsMenuOpen ? (
                  <div className="orders-dropdown orders-dropdown--columns">
                    {COLUMN_DEFS.map((column) => (
                      <label key={column.key}>
                        <input
                          type="checkbox"
                          checked={Boolean(visibleColumns[column.key])}
                          onChange={() =>
                            setVisibleColumns((current) => ({
                              ...current,
                              [column.key]: !current[column.key],
                            }))
                          }
                        />
                        {column.label}
                      </label>
                    ))}
                  </div>
                ) : null}
              </div>
              <button type="button" className="orders-icon-btn" onClick={runDownload} aria-label="Download orders">
                <Download size={18} />
              </button>
            </div>
          </div>

          {selectedCount > 0 ? (
            <div className="orders-selected-bar">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                aria-label="Select all visible orders"
              />
              <span>{selectedCount} of {rows.length} orders selected</span>
              <button type="button" onClick={toggleSelectAllVisible}>Select all {rows.length}</button>
            </div>
          ) : null}

          <div className="orders-table-scroll">
            <table className="orders-table">
              <thead>
                <tr>
                  <th className="orders-checkbox-col">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAllVisible}
                      aria-label="Select all current page orders"
                    />
                  </th>
                  {visibleColumns.invoice ? <th className="orders-col-invoice">Invoice ID</th> : null}
                  {visibleColumns.orderDate ? (
                    <th className="orders-col-date">
                      <button
                        type="button"
                        className="orders-sort-btn"
                        onClick={() => setSortDir((current) => (current === "desc" ? "asc" : "desc"))}
                      >
                        Order Date
                        <ChevronDown className={sortDir === "asc" ? "is-ascending" : ""} size={15} />
                      </button>
                    </th>
                  ) : null}
                  {visibleColumns.customer ? <th className="orders-col-customer">Customer</th> : null}
                  {visibleColumns.paymentMethod ? <th className="orders-col-method">Payment Method</th> : null}
                  {visibleColumns.amount ? <th className="orders-col-amount">Amount</th> : null}
                  {visibleColumns.paymentStatus ? <th className="orders-col-payment">Payment Status</th> : null}
                  {visibleColumns.deliveryStatus ? <th className="orders-col-delivery">Delivery Status</th> : null}
                  {visibleColumns.orderStatus ? <th className="orders-col-status">Order Status</th> : null}
                  <th className="orders-col-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? rows.map(({ order, view }) => {
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
                      : ADMIN_ORDER_ACTION_OPTIONS.map((option) => ({
                          code: option.value,
                          label: option.label,
                          enabled: option.value === actionStatus,
                        }));
                  const isUpdating = pendingUpdateId === invoiceParam || pendingUpdateId === rowId;

                  return (
                    <tr key={rowId || invoiceParam} className={selectedIds.has(rowId) ? "is-selected" : ""}>
                      <td className="orders-checkbox-col">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(rowId)}
                          onChange={() => toggleRowSelection(rowId)}
                          aria-label={`Select order ${invoiceParam}`}
                        />
                      </td>
                      {visibleColumns.invoice ? (
                        <td className="orders-col-invoice">
                          <Link className="orders-invoice-link" to={`/admin/orders/${encodeURIComponent(invoiceParam)}`}>
                            {invoiceParam}
                          </Link>
                        </td>
                      ) : null}
                      {visibleColumns.orderDate ? <td className="orders-col-date">{formatDateTime(orderDateValue)}</td> : null}
                      {visibleColumns.customer ? (
                        <td className="orders-col-customer">
                          <div className="orders-customer">
                            <strong>{view.customerName}</strong>
                            {view.customerType === "guest" ? <span>Guest</span> : null}
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.paymentMethod ? (
                        <td className="orders-col-method">
                          <div className="orders-method">
                            <span>{paymentMethod}</span>
                          </div>
                        </td>
                      ) : null}
                      {visibleColumns.amount ? <td className="orders-col-amount orders-amount">{formatMoney(view.amount)}</td> : null}
                      {visibleColumns.paymentStatus ? (
                        <td className="orders-col-payment">
                          <span className={`orders-chip orders-chip--${getTone(paymentStatus)}`}>{labelize(paymentStatus)}</span>
                        </td>
                      ) : null}
                      {visibleColumns.deliveryStatus ? (
                        <td className="orders-col-delivery">
                          <span className={`orders-chip orders-chip--${getTone(deliveryStatus)}`}>{labelize(deliveryStatus)}</span>
                        </td>
                      ) : null}
                      {visibleColumns.orderStatus ? (
                        <td className="orders-col-status">
                          <select
                            className={`orders-status-select orders-status-select--${getTone(orderStatus)}`}
                            value={actionStatus}
                            disabled={isUpdating}
                            onChange={(event) => onUpdateStatus(order, view, event.target.value)}
                          >
                            {actionOptions.map((option) => (
                              <option
                                key={option.code || option.value}
                                value={option.code || option.value}
                                disabled={option.enabled === false}
                              >
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      ) : null}
                      <td className="orders-col-actions">
                        <div className="orders-row-actions" data-admin-orders-menu>
                          <button type="button" onClick={() => navigate(`/admin/orders/${encodeURIComponent(invoiceParam)}`)} aria-label="View detail">
                            <Eye size={17} />
                          </button>
                          <button type="button" onClick={() => onPrintInvoice(order, view)} aria-label="Print invoice">
                            <Printer size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setOpenMoreId((current) => (current === rowId ? null : rowId));
                            }}
                            aria-label="More actions"
                          >
                            <MoreVertical size={17} />
                          </button>
                          {openMoreId === rowId ? (
                            <div className="orders-dropdown orders-dropdown--row">
                              <button type="button" onClick={() => navigator.clipboard.writeText(invoiceParam).then(() => toast.success("Invoice ID copied."))}>
                                <Copy size={15} />
                                Copy invoice ID
                              </button>
                              <button type="button" onClick={() => navigate(`/admin/orders/${encodeURIComponent(invoiceParam)}`)}>
                                <Eye size={15} />
                                View detail
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={10} className="orders-empty">
                      <PackageCheck size={34} />
                      <strong>No orders found</strong>
                      <span>Adjust filters or reset the current search.</span>
                      <button type="button" onClick={resetFilters}>Reset filters</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="orders-pagination">
            <label>
              Rows per page
              <select
                value={pageSize}
                onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }}
              >
                {ROW_LIMIT_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <div className="orders-pages">
              <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                <ChevronLeft size={18} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                const pageNumber = start + index;
                if (pageNumber > totalPages) return null;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    className={pageNumber === page ? "is-active" : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                <ChevronRight size={18} />
              </button>
            </div>
            <form className="orders-go-page" onSubmit={onGoToPage}>
              <span>Go to page</span>
              <input
                type="number"
                min="1"
                max={totalPages}
                value={goToPage}
                onChange={(event) => setGoToPage(event.target.value)}
              />
              <span>of {totalPages}</span>
            </form>
          </div>
        </section>
      ) : null}
    </div>
  );
}
