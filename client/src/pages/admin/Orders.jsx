import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const getPaymentStatusOptions = (isId) => [
  { value: "", label: isId ? "Semua Status Pembayaran" : "All Payment Statuses" },
  { value: "PAID", label: isId ? "Lunas" : "Paid" },
  { value: "UNPAID", label: isId ? "Belum Bayar" : "Unpaid" },
  { value: "PENDING_CONFIRMATION", label: isId ? "Menunggu Konfirmasi" : "Pending confirmation" },
  { value: "FAILED", label: isId ? "Gagal" : "Failed" },
  { value: "EXPIRED", label: isId ? "Kedaluwarsa" : "Expired" },
  { value: "CANCELLED", label: isId ? "Dibatalkan" : "Cancelled" },
];

const getPaymentMethodOptions = (isId) => [
  { value: "", label: isId ? "Semua Metode Pembayaran" : "All Payment Methods" },
  { value: "qris", label: isId ? "QRIS Statis" : "Static QRIS" },
  { value: "duitku", label: "Duitku POP" },
];

const getDeliveryStatusOptions = (isId) => [
  { value: "", label: isId ? "Semua Status Pengiriman" : "All Delivery Statuses" },
  { value: "waiting_payment", label: isId ? "Menunggu Pembayaran" : "Waiting payment" },
  { value: "ready_to_fulfill", label: isId ? "Siap Diproses" : "Ready to fulfill" },
  { value: "processing", label: isId ? "Diproses" : "Processing" },
  { value: "in_delivery", label: isId ? "Dalam Pengiriman" : "In delivery" },
  { value: "delivered", label: isId ? "Terkirim" : "Delivered" },
  { value: "cancelled", label: isId ? "Dibatalkan" : "Cancelled" },
  { value: "failed", label: isId ? "Gagal" : "Failed" },
];

const ROW_LIMIT_OPTIONS = [10, 20, 50, 100];

const getColumnDefs = (isId) => [
  { key: "invoiceDate", label: isId ? "Invoice & Tanggal" : "Invoice & Date" },
  { key: "customer", label: isId ? "Pelanggan" : "Customer" },
  { key: "amountMethod", label: isId ? "Total & Metode" : "Total & Method" },
  { key: "paymentStatus", label: isId ? "Pembayaran" : "Payment" },
  { key: "orderStatus", label: isId ? "Status Pesanan" : "Order Status" },
];

const getBulkActions = (isId) => [
  {
    action: "MARK_DELIVERED",
    label: isId ? "Tandai Terkirim" : "Mark as Delivered",
    tone: "success",
    icon: CheckCircle2,
  },
  {
    action: "MARK_CANCELLED",
    label: isId ? "Tandai Dibatalkan" : "Mark as Cancelled",
    tone: "muted",
    icon: Ban,
  },
  {
    action: "MARK_FAILED",
    label: isId ? "Tandai Gagal" : "Mark as Failed",
    tone: "danger",
    icon: X,
  },
];

const toText = (value) => String(value ?? "").trim();

const normalizeToken = (value) =>
  toText(value)
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[\s-]+/g, "_")
    .toUpperCase();

const getInvoiceParam = (order, view) =>
  toText(view?.invoiceNo || order?.invoiceNo || order?.invoice || order?.orderRef || order?.reference || order?.ref || order?.id);

const formatCompactOrderNumber = (invoiceNo, orderId, createdAt) => {
  const raw = String(invoiceNo || "").trim();
  if (!raw && !orderId) return "-";
  if (/^TP-\d{6}-\w+/i.test(raw)) return raw;

  const d = createdAt ? new Date(createdAt) : null;
  const dateStr =
    d && !Number.isNaN(d.getTime())
      ? `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
      : "261104";

  const numPart = orderId
    ? String(orderId).padStart(4, "0")
    : raw.replace(/[^A-Za-z0-9]/g, "").slice(-4) || "0001";

  return `TP-${dateStr}-${numPart}`;
};

const getOrderDateValue = (order, view) =>
  view?.orderTime || order?.orderDate || order?.createdAt || order?.created_at || order?.order_time || null;

const formatOrderDateTime = (value, isId = false) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: !isId,
  }).format(d);
};

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

const getLocalizedPaymentStatus = (status, isId) => {
  const token = normalizeToken(status);
  const labels = {
    PAID: isId ? "Lunas" : "Paid",
    UNPAID: isId ? "Belum Bayar" : "Unpaid",
    PENDING_CONFIRMATION: isId ? "Menunggu" : "Pending",
    FAILED: isId ? "Gagal" : "Failed",
    EXPIRED: isId ? "Kedaluwarsa" : "Expired",
    CANCELLED: isId ? "Batal" : "Cancelled",
  };
  return labels[token] || (isId ? "Belum Bayar" : "Unpaid");
};

const getLocalizedDeliveryStatus = (status, isId) => {
  const token = normalizeToken(status);
  const labels = {
    DELIVERED: isId ? "Terkirim" : "Delivered",
    IN_DELIVERY: isId ? "Dikirim" : "In delivery",
    PROCESSING: isId ? "Diproses" : "Processing",
    READY_TO_FULFILL: isId ? "Siap Kirim" : "Ready to fulfill",
    WAITING_PAYMENT: isId ? "Tunggu Bayar" : "Waiting payment",
    CANCELLED: isId ? "Batal" : "Cancelled",
    FAILED: isId ? "Gagal" : "Failed",
  };
  return labels[token] || (isId ? "Diproses" : "Processing");
};

const getLocalizedActionLabel = (value, isId) => {
  const map = {
    pending: isId ? "Menunggu" : "Pending",
    processing: isId ? "Diproses" : "Processing",
    shipping: isId ? "Dikirim" : "On delivery",
    delivered: isId ? "Selesai" : "Delivered",
    cancel: isId ? "Dibatalkan" : "Cancelled",
  };
  return map[value] || value;
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

const getCustomerInitials = (name) => {
  const clean = String(name || "").trim();
  if (!clean || clean === "-") return "C";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
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
  const { formatMoney } = useAdminLocale();
  const { i18n } = useTranslation();
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortDir, setSortDir] = useState("desc");
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [customerInput, setCustomerInput] = useState(DEFAULT_FILTERS.customer);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkMenuOpen, setBulkMenuOpen] = useState(false);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    invoiceDate: true,
    customer: true,
    amountMethod: true,
    paymentStatus: true,
    orderStatus: true,
  });
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
      toast.success(payload?.message || (isId ? "Aksi pesanan selesai." : "Order action completed."));
      setSelectedIds(new Set());
      invalidateOrders();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, isId ? "Aksi pesanan gagal." : "Order action failed."));
    },
  };

  const updateMutation = useMutation({
    mutationFn: ({ target, status }) => updateAdminOrderStatus(target, { status }),
    meta: { suppressGlobalToast: true },
    onMutate: ({ target }) => setPendingUpdateId(target),
    onSuccess: () => {
      toast.success(isId ? "Status pesanan diperbarui." : "Order status updated.");
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
      toast.success(isId ? `Berhasil diekspor sebagai ${filename}.` : `Exported as ${filename}.`);
    },
    onError: (error) => toast.error(getErrorMessage(error, isId ? "Gagal mengunduh pesanan." : "Failed to download orders.")),
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
      toast.error(isId ? "Pilih minimal satu pesanan terlebih dahulu." : "Select at least one order first.");
      return;
    }
    bulkMutation.mutate({ ...selectedPayload(), action });
  };

  const runAssign = () => {
    if (selectedCount === 0) {
      return toast.error(isId ? "Pilih minimal satu pesanan terlebih dahulu." : "Select at least one order first.");
    }
    assignMutation.mutate(selectedPayload());
  };

  const runUnassign = () => {
    if (selectedCount === 0) {
      return toast.error(isId ? "Pilih minimal satu pesanan terlebih dahulu." : "Select at least one order first.");
    }
    unassignMutation.mutate(selectedPayload());
  };

  const runDelete = () => {
    if (selectedCount === 0) {
      return toast.error(isId ? "Pilih minimal satu pesanan terlebih dahulu." : "Select at least one order first.");
    }
    const confirmed = window.confirm(
      selectedCount === 1
        ? isId
          ? "Hapus pesanan terpilih? Tindakan ini tidak dapat dibatalkan."
          : "Delete selected order? This action cannot be undone."
        : isId
        ? `Hapus ${selectedCount} pesanan terpilih? Tindakan ini tidak dapat dibatalkan.`
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
    const rowId = Number(view?.id || order?.id || 0);
    const orderDateValue = getOrderDateValue(order, view);
    const compactNo = formatCompactOrderNumber(invoiceParam, rowId, orderDateValue);
    const targetRef = compactNo && compactNo !== "-" ? compactNo : invoiceParam;
    if (!targetRef) {
      return toast.error(isId ? "Detail pesanan tidak tersedia." : "Order detail unavailable.");
    }
    const printWindow = window.open(`/admin/orders/${encodeURIComponent(targetRef)}?print=1`, "_blank");
    if (!printWindow) {
      toast.error(isId ? "Pop-up diblokir. Izinkan pop-up untuk mencetak invoice." : "Pop-up blocked. Allow pop-ups to print invoice.");
    }
  };

  const copyInvoice = (invoiceParam) => {
    navigator.clipboard.writeText(invoiceParam).then(() => {
      toast.success(isId ? "Invoice berhasil disalin." : "Invoice copied.");
    });
  };

  const columnDefs = getColumnDefs(isId);
  const bulkActions = getBulkActions(isId);
  const paymentStatusOptions = getPaymentStatusOptions(isId);
  const deliveryStatusOptions = getDeliveryStatusOptions(isId);
  const paymentMethodOptions = getPaymentMethodOptions(isId);

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
              <h1>{isId ? "Pesanan" : "Orders"}</h1>
              <span className="orders-badge-count">{meta.total || rows.length}</span>
            </div>
            <p>{isId ? "Kelola pesanan pelanggan" : "Manage customer orders"}</p>
          </div>
        </div>

        <div className="orders-actions">
          <button
            type="button"
            className="orders-btn"
            onClick={() => invalidateOrders()}
            disabled={ordersQuery.isFetching}
            title={isId ? "Segarkan daftar" : "Refresh list"}
          >
            <RefreshCw size={14} className={ordersQuery.isFetching ? "animate-spin" : ""} />
            {isId ? "Segarkan" : "Refresh"}
          </button>
          <button
            type="button"
            className="orders-btn orders-btn--primary"
            onClick={runDownload}
            disabled={downloadMutation.isPending}
            title={isId ? "Ekspor CSV" : "Export CSV"}
          >
            <Download size={14} />
            {downloadMutation.isPending
              ? isId
                ? "Mengekspor..."
                : "Exporting..."
              : isId
              ? "Ekspor CSV"
              : "Export CSV"}
          </button>
        </div>
      </header>

      {/* DYNAMIC SELECTION ACTION BAR (Appears when >= 1 item selected) */}
      {selectedCount > 0 && (
        <section className="orders-floating-bar" aria-label="Selected actions">
          <div className="orders-floating-info">
            <span className="orders-floating-badge">{selectedCount}</span>
            <span>{isId ? "pesanan dipilih" : "orders selected"}</span>
          </div>
          <div className="orders-floating-actions">
            <button
              type="button"
              className="orders-floating-btn"
              onClick={runAssign}
              disabled={isBusy}
            >
              <Truck size={14} />
              {isId ? "Tugaskan" : "Assign"}
            </button>
            <button
              type="button"
              className="orders-floating-btn"
              onClick={runUnassign}
              disabled={isBusy}
            >
              <UserRound size={14} />
              {isId ? "Lepas Kurir" : "Unassign"}
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
                {isId ? "Status" : "Status"} <ChevronDown size={13} />
              </button>
              {bulkMenuOpen && (
                <div className="orders-dropdown">
                  {bulkActions.map((item) => (
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
              {isId ? "Hapus" : "Delete"}
            </button>
            <button
              type="button"
              className="orders-floating-close"
              onClick={() => setSelectedIds(new Set())}
              title={isId ? "Batalkan pilihan" : "Clear selection"}
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
            <span className="orders-metric-title">{isId ? "Total Pesanan" : "Total Orders"}</span>
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
            <span className="orders-metric-title">{isId ? "Sedang Diproses" : "Processing"}</span>
            <div className="orders-metric-icon">
              <Clock3 size={17} />
            </div>
          </div>
          <div className="orders-metric-val-row">
            <span className="orders-metric-val">{summary.processing}</span>
            <span className="orders-metric-sub">{isId ? "Pemrosesan" : "Fulfillment"}</span>
          </div>
        </div>

        <div className="orders-metric-card is-orange">
          <div className="orders-metric-top">
            <span className="orders-metric-title">{isId ? "Masalah Pembayaran" : "Payment Issues"}</span>
            <div className="orders-metric-icon">
              <CreditCard size={17} />
            </div>
          </div>
          <div className="orders-metric-val-row">
            <span className="orders-metric-val">{summary.paymentIssues}</span>
            <span className="orders-metric-sub">{isId ? "Perhatian" : "Attention"}</span>
          </div>
        </div>

        <div className="orders-metric-card is-green">
          <div className="orders-metric-top">
            <span className="orders-metric-title">{isId ? "Terkirim" : "Delivered"}</span>
            <div className="orders-metric-icon">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="orders-metric-val-row">
            <span className="orders-metric-val">{summary.delivered}</span>
            <span className="orders-metric-sub">{isId ? "Selesai" : "Completed"}</span>
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
            {isId ? "Semua" : "All"}
            <span className="orders-quick-count">{meta.total || rows.length}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              updateFilter("paymentStatus", "UNPAID");
              updateFilter("deliveryStatus", "");
            }}
            className={`orders-quick-chip ${filters.paymentStatus === "UNPAID" ? "is-active is-orange" : ""}`}
          >
            {isId ? "Masalah Pembayaran" : "Payment Issues"}
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
            {isId ? "Sedang Diproses" : "Processing"}
            <span className="orders-quick-count">{summary.processing}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              updateFilter("paymentStatus", "");
              updateFilter("deliveryStatus", "delivered");
            }}
            className={`orders-quick-chip ${filters.deliveryStatus === "delivered" ? "is-active is-green" : ""}`}
          >
            {isId ? "Terkirim" : "Delivered"}
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
              placeholder={isId ? "Cari pelanggan atau invoice..." : "Search customer or invoice..."}
            />
            {customerInput && (
              <button
                type="button"
                onClick={() => setCustomerInput("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--orders-dim)" }}
                title={isId ? "Hapus pencarian" : "Clear search"}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={filters.paymentStatus}
            onChange={(e) => updateFilter("paymentStatus", e.target.value)}
            className="orders-select"
            aria-label={isId ? "Filter status pembayaran" : "Filter payment status"}
          >
            {paymentStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.deliveryStatus}
            onChange={(e) => updateFilter("deliveryStatus", e.target.value)}
            className="orders-select"
            aria-label={isId ? "Filter status pengiriman" : "Filter delivery status"}
          >
            {deliveryStatusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.paymentMethod}
            onChange={(e) => updateFilter("paymentMethod", e.target.value)}
            className="orders-select"
            aria-label={isId ? "Filter metode pembayaran" : "Filter payment method"}
          >
            {paymentMethodOptions.map((opt) => (
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
              aria-label={isId ? "Tanggal mulai" : "Start date"}
            />
            <span style={{ color: "var(--orders-dim)", fontSize: "0.75rem" }}>—</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter("endDate", e.target.value)}
              aria-label={isId ? "Tanggal selesai" : "End date"}
            />
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="orders-btn"
            title={isId ? "Atur ulang filter" : "Reset filters"}
          >
            <RotateCcw size={13} />
            {isId ? "Atur Ulang" : "Reset"}
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
            <div className="orders-toolbar-count">
              {isId ? "Menampilkan " : "Showing "}
              <strong>
                {rows.length > 0 ? (Number(meta.page || page) - 1) * Number(meta.limit || pageSize) + 1 : 0}
              </strong>
              {isId ? " sampai " : " to "}
              <strong>
                {Math.min(Number(meta.total || 0), (Number(meta.page || page) - 1) * Number(meta.limit || pageSize) + rows.length)}
              </strong>
              {isId ? " dari " : " of "}
              <strong>{Number(meta.total || 0)}</strong>
              {isId ? " pesanan" : " orders"}
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
                  {isId ? "Kolom" : "Columns"}
                  <ChevronDown size={12} />
                </button>
                {columnsMenuOpen && (
                  <div className="orders-dropdown">
                    {columnDefs.map((col) => (
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
                <PackageCheck size={24} />
              </div>
              <h3 className="orders-empty-title">{isId ? "Tidak ada pesanan ditemukan" : "No orders found"}</h3>
              <p className="orders-empty-desc">{isId ? "Sesuaikan filter atau kriteria pencarian Anda." : "Adjust filters or search criteria."}</p>
              <button
                type="button"
                onClick={resetFilters}
                className="orders-btn orders-btn--sm"
                style={{ marginTop: 8 }}
              >
                {isId ? "Atur Ulang Filter" : "Reset Filters"}
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP STREAMLINED ZERO-SCROLL TABLE (>= 768px) */}
              <div className="orders-table-scroll">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAllVisible}
                          aria-label={isId ? "Pilih semua baris" : "Select all rows"}
                        />
                      </th>
                      {visibleColumns.invoiceDate && (
                        <th style={{ width: "23%" }}>
                          <button
                            type="button"
                            onClick={() => setSortDir((c) => (c === "desc" ? "asc" : "desc"))}
                            className="orders-th-sort"
                            title={isId ? "Urutkan berdasarkan tanggal" : "Sort by date"}
                          >
                            <span>{isId ? "Invoice & Tanggal" : "Invoice & Date"}</span>
                            <ChevronDown
                              size={13}
                              style={{ transform: sortDir === "asc" ? "rotate(180deg)" : "none", transition: "transform 0.15s ease" }}
                            />
                          </button>
                        </th>
                      )}
                      {visibleColumns.customer && (
                        <th style={{ width: "23%" }}>{isId ? "Pelanggan" : "Customer"}</th>
                      )}
                      {visibleColumns.amountMethod && (
                        <th style={{ width: "19%" }}>{isId ? "Total & Metode" : "Total & Method"}</th>
                      )}
                      {visibleColumns.paymentStatus && (
                        <th style={{ width: "13%" }}>{isId ? "Pembayaran" : "Payment"}</th>
                      )}
                      {visibleColumns.orderStatus && (
                        <th style={{ width: "16%" }}>{isId ? "Status Pesanan" : "Order Status"}</th>
                      )}
                      <th style={{ width: "6%", textAlign: "right" }}>{isId ? "Aksi" : "Action"}</th>
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
                      const customerName = view.customerName || "-";
                      const initials = getCustomerInitials(customerName);
                      const compactOrderNo = formatCompactOrderNumber(invoiceParam, rowId, orderDateValue);
                      const targetOrderRef = compactOrderNo && compactOrderNo !== "-" ? compactOrderNo : invoiceParam;

                      return (
                        <tr key={rowId || invoiceParam} className={isSelected ? "is-selected" : ""}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleRowSelection(rowId)}
                              aria-label={isId ? `Pilih pesanan ${invoiceParam}` : `Select order ${invoiceParam}`}
                            />
                          </td>
                          {visibleColumns.invoiceDate && (
                            <td>
                              <div className="orders-inv-date-stack">
                                <div className="orders-invoice-cell">
                                  <Link
                                    to={`/admin/orders/${encodeURIComponent(targetOrderRef)}`}
                                    className="orders-invoice-link"
                                    title={invoiceParam}
                                  >
                                    {compactOrderNo}
                                  </Link>
                                  <button
                                    type="button"
                                    onClick={() => copyInvoice(invoiceParam)}
                                    className="orders-copy-icon"
                                    title={isId ? `Salin ${invoiceParam}` : `Copy ${invoiceParam}`}
                                  >
                                    <Copy size={12} />
                                  </button>
                                </div>
                                <div className="orders-date-sub">
                                  {formatOrderDateTime(orderDateValue, isId)}
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.customer && (
                            <td>
                              <div className="orders-customer-flex">
                                <div className="orders-avatar-badge" aria-hidden="true">
                                  {initials}
                                </div>
                                <div className="orders-customer-name" title={customerName}>
                                  {customerName}
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.amountMethod && (
                            <td>
                              <div className="orders-amount-method-stack">
                                <div className="orders-amount-text">
                                  {formatMoney(view.amount)}
                                </div>
                                <div className="orders-method-tag">
                                  {paymentMethod}
                                </div>
                              </div>
                            </td>
                          )}
                          {visibleColumns.paymentStatus && (
                            <td>
                              <span className={`orders-badge ${paymentStatus === "PAID" ? "orders-badge--green" : "orders-badge--orange"}`}>
                                <span className={`orders-badge-dot ${paymentStatus === "PAID" ? "is-green" : "is-orange"}`} />
                                {getLocalizedPaymentStatus(paymentStatus, isId)}
                              </span>
                            </td>
                          )}
                          {visibleColumns.orderStatus && (
                            <td>
                              <div className="orders-status-stack">
                                <select
                                  className="orders-status-select"
                                  value={actionStatus}
                                  disabled={isUpdating}
                                  onChange={(e) => onUpdateStatus(order, view, e.target.value)}
                                  aria-label={isId ? "Ubah status pesanan" : "Change order status"}
                                >
                                  {actionOptions.map((opt) => (
                                    <option
                                      key={opt.code || opt.value}
                                      value={opt.code || opt.value}
                                      disabled={opt.enabled === false}
                                    >
                                      {getLocalizedActionLabel(opt.code || opt.value, isId)}
                                    </option>
                                  ))}
                                </select>
                                <span className="orders-delivery-indicator" title={getLocalizedDeliveryStatus(deliveryStatus, isId)}>
                                  {getLocalizedDeliveryStatus(deliveryStatus, isId)}
                                </span>
                              </div>
                            </td>
                          )}
                          <td style={{ textAlign: "right" }}>
                            <div className="orders-row-actions">
                              <button
                                type="button"
                                onClick={() => navigate(`/admin/orders/${encodeURIComponent(targetOrderRef)}`)}
                                className="orders-action-btn"
                                title={isId ? "Lihat Detail" : "View Detail"}
                              >
                                <Eye size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onPrintInvoice(order, view)}
                                className="orders-action-btn"
                                title={isId ? "Cetak Invoice" : "Print Invoice"}
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
                  const orderDateValue = getOrderDateValue(order, view);
                  const paymentStatus = getPaymentStatus(order);
                  const deliveryStatus = getDeliveryStatus(order, view);
                  const orderStatus = getOrderStatus(order);
                  const actionStatus = toAdminOrderActionValue(orderStatus);
                  const isSelected = selectedIds.has(rowId);
                  const customerName = view.customerName || "-";
                  const initials = getCustomerInitials(customerName);
                  const compactOrderNo = formatCompactOrderNumber(invoiceParam, rowId, orderDateValue);
                  const targetOrderRef = compactOrderNo && compactOrderNo !== "-" ? compactOrderNo : invoiceParam;

                  return (
                    <div
                      key={rowId || invoiceParam}
                      className={`orders-mobile-card ${isSelected ? "is-selected" : ""}`}
                    >
                      <div className="orders-mobile-top">
                        <div className="orders-mobile-inv-wrap">
                          <span className="orders-mobile-inv" title={invoiceParam}>
                            {formatCompactOrderNumber(invoiceParam, rowId, orderDateValue)}
                          </span>
                          <span className="orders-mobile-date">
                            {formatOrderDateTime(orderDateValue, isId)}
                          </span>
                        </div>
                        <span className={`orders-badge ${paymentStatus === "PAID" ? "orders-badge--green" : "orders-badge--orange"}`}>
                          <span className={`orders-badge-dot ${paymentStatus === "PAID" ? "is-green" : "is-orange"}`} />
                          {getLocalizedPaymentStatus(paymentStatus, isId)}
                        </span>
                      </div>

                      <div className="orders-mobile-mid">
                        <div className="orders-customer-flex">
                          <div className="orders-avatar-badge" aria-hidden="true">
                            {initials}
                          </div>
                          <span className="orders-mobile-customer">{customerName}</span>
                        </div>
                        <span className="orders-mobile-amount">{formatMoney(view.amount)}</span>
                      </div>

                      <div className="orders-mobile-badges">
                        <span className="orders-badge orders-badge--blue">
                          {getPaymentMethodLabel(view, order)}
                        </span>
                        <span className={`orders-badge ${deliveryStatus === "DELIVERED" ? "orders-badge--green" : "orders-badge--blue"}`}>
                          {getLocalizedDeliveryStatus(deliveryStatus, isId)}
                        </span>
                        <span className="orders-badge orders-badge--neutral">
                          {getLocalizedActionLabel(actionStatus, isId)}
                        </span>
                      </div>

                      <div className="orders-mobile-actions">
                        <button
                          type="button"
                          onClick={() => copyInvoice(invoiceParam)}
                          className="orders-btn orders-btn--sm"
                          title={isId ? "Salin Invoice" : "Copy Invoice"}
                        >
                          <Copy size={13} />
                          {isId ? "Salin" : "Copy"}
                        </button>
                        <button
                          type="button"
                          onClick={() => onPrintInvoice(order, view)}
                          className="orders-btn orders-btn--sm"
                          title={isId ? "Cetak Invoice" : "Print Invoice"}
                        >
                          <Printer size={13} />
                          {isId ? "Cetak" : "Print"}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/orders/${encodeURIComponent(targetOrderRef)}`)}
                          className="orders-btn orders-btn--primary orders-btn--sm"
                          title={isId ? "Lihat Detail" : "View Detail"}
                        >
                          <Eye size={13} />
                          {isId ? "Detail" : "Detail"}
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
            <div className="orders-page-limit-wrap">
              <span>{isId ? "Baris per halaman:" : "Rows per page:"}</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="orders-select orders-page-limit-select"
                aria-label={isId ? "Pilih jumlah baris per halaman" : "Select rows per page"}
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
                aria-label={isId ? "Halaman sebelumnya" : "Previous page"}
                title={isId ? "Halaman sebelumnya" : "Previous page"}
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
                aria-label={isId ? "Halaman berikutnya" : "Next page"}
                title={isId ? "Halaman berikutnya" : "Next page"}
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