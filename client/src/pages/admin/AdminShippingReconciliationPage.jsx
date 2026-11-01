import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  Info,
  Link2,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  Truck,
  X,
} from "lucide-react";
import { Toaster as SonnerToaster, toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  correctAdminShipmentException,
  fetchAdminShippingReconciliationReport,
} from "../../lib/adminApi.js";
import "./AdminShippingReconciliationPage.css";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "compatibilityMismatch", label: "Mismatch" },
  { value: "mixedShipmentOutcome", label: "Mixed Outcome" },
  { value: "activeShippingException", label: "Active Exception" },
  { value: "finalShippingException", label: "Final Exception" },
  { value: "trackingDataIncomplete", label: "Tracking Gap" },
  { value: "adminCorrectedRecent", label: "Corrected" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "INFO_RECEIVED", label: "Info Received" },
  { value: "READY_TO_FULFILL", label: "Ready" },
  { value: "PACKED", label: "Packed" },
  { value: "SHIPPED", label: "In Transit" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "FAILED_DELIVERY", label: "Delayed" },
  { value: "RETURNED", label: "Returned" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "PENDING", label: "Pending" },
];

const QUICK_FILTERS = [
  { value: "all", label: "All" },
  { value: "urgent", label: "Urgent" },
  { value: "mismatch", label: "Mismatch" },
  { value: "active", label: "Active" },
  { value: "final", label: "Final" },
  { value: "tracking", label: "Gaps" },
  { value: "corrected", label: "Corrected" },
];

const CATEGORY_META = {
  compatibilityMismatch: {
    label: "Mismatch",
    shortLabel: "Mismatch",
    color: "#8b5cf6",
    badgeClass: "asr2026-badge--neutral",
    Icon: AlertCircle,
  },
  mixedShipmentOutcome: {
    label: "Mixed outcome",
    shortLabel: "Mismatch",
    color: "#fe6f05",
    badgeClass: "asr2026-badge--urgent",
    Icon: AlertCircle,
  },
  activeShippingException: {
    label: "Active exception",
    shortLabel: "Active",
    color: "#fe6f05",
    badgeClass: "asr2026-badge--urgent",
    Icon: AlertCircle,
  },
  finalShippingException: {
    label: "Final exception",
    shortLabel: "Final",
    color: "#64748b",
    badgeClass: "asr2026-badge--neutral",
    Icon: ClipboardCheck,
  },
  trackingDataIncomplete: {
    label: "Tracking gap",
    shortLabel: "Gap",
    color: "#034c85",
    badgeClass: "asr2026-badge--blue",
    Icon: Link2,
  },
  adminCorrectedRecent: {
    label: "Corrected",
    shortLabel: "Corrected",
    color: "#059669",
    badgeClass: "asr2026-badge--success",
    Icon: CheckCircle2,
  },
};

const CHART_KEYS = [
  { key: "urgent", label: "Urgent", color: "#fe6f05" },
  { key: "active", label: "Active", color: "#f59e0b" },
  { key: "tracking", label: "Tracking Gap", color: "#034c85" },
  { key: "final", label: "Final", color: "#64748b" },
  { key: "corrected", label: "Corrected", color: "#059669" },
];

const EMPTY_TEXT = "—";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const DATETIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const normalizeText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const normalizeCode = (value, fallback = "") =>
  normalizeText(value, fallback).replace(/\s+/g, "_").toUpperCase();

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (value) => new Intl.NumberFormat("en-US").format(toNumber(value, 0));

const formatStatus = (value, fallback = "Pending") => {
  const source = normalizeText(value, fallback);
  if (!source) return fallback;
  return source
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (match) => match.toUpperCase());
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value) => {
  const date = parseDate(value);
  return date ? DATETIME_FORMATTER.format(date) : "-";
};

const formatShortDate = (value) => {
  const date = parseDate(value);
  return date ? DATE_FORMATTER.format(date) : null;
};

const getNested = (source, paths) => {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => acc?.[key], source);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
};

const unwrapArray = (response) => {
  const candidates = [
    response?.items,
    response?.rows,
    response?.exceptions,
    response?.shipments,
    response?.data?.items,
    response?.data?.rows,
    response?.data?.exceptions,
    response?.data?.shipments,
    response?.data?.data?.items,
    response?.data?.data?.rows,
    response?.data?.data?.exceptions,
    response?.data?.data?.shipments,
    response?.data?.data,
    response?.data,
    response,
  ];
  return candidates.find(Array.isArray) || [];
};

const normalizeCategory = (category) => {
  if (typeof category === "string") {
    return {
      code: category,
      label: CATEGORY_META[category]?.label || formatStatus(category, "Issue"),
      detail: null,
    };
  }
  const code = normalizeText(category?.code || category?.key || category?.value);
  return {
    code,
    label: normalizeText(category?.label, CATEGORY_META[code]?.label || formatStatus(code, "Issue")),
    detail: normalizeText(category?.detail || category?.description, ""),
  };
};

const inferCategories = (item) => {
  const categories = Array.isArray(item?.categories)
    ? item.categories.map(normalizeCategory).filter((entry) => entry.code)
    : [];
  if (categories.length > 0) return categories;

  const primaryCode = normalizeText(item?.primaryCategory?.code || item?.category || item?.issueCode);
  if (primaryCode) return [normalizeCategory(primaryCode)];

  const status = normalizeCode(item?.canonicalShipmentStatus || item?.shipmentStatus || item?.status);
  if (status === "FAILED_DELIVERY") return [normalizeCategory("activeShippingException")];
  if (status === "RETURNED" || status === "CANCELLED") return [normalizeCategory("finalShippingException")];
  return [normalizeCategory("trackingDataIncomplete")];
};

const normalizeRow = (item, index) => {
  const categories = inferCategories(item);
  const primaryCategory = normalizeCategory(item?.primaryCategory || categories[0]);
  const status = normalizeCode(
    getNested(item, [
      "canonicalShipmentStatus",
      "shipmentStatus",
      "shippingStatus",
      "tracking.status",
      "status",
    ]),
    "PENDING"
  );
  const invoiceNo = normalizeText(
    getNested(item, ["invoiceNo", "invoice", "order.invoiceNo", "orderNumber"]),
    EMPTY_TEXT
  );
  const storeName = normalizeText(
    getNested(item, ["store.name", "storeName", "sellerStore.name", "merchantName"]),
    "Unknown Store"
  );
  const trackingNumber = normalizeText(
    getNested(item, [
      "tracking.trackingNumber",
      "tracking.number",
      "trackingNo",
      "trackingNumber",
      "shipment.trackingNumber",
    ]),
    EMPTY_TEXT
  );
  const updatedAt = getNested(item, [
    "orderUpdatedAt",
    "updatedAt",
    "suborderUpdatedAt",
    "tracking.lastTransitionAt",
    "createdAt",
  ]);

  return {
    ...item,
    _key: `${invoiceNo}-${item?.orderId || item?.id || index}-${item?.suborderId || "suborder"}`,
    orderId: toNumber(item?.orderId || item?.order?.id || item?.id, 0) || null,
    suborderId: toNumber(item?.suborderId || item?.suborder?.id, 0) || null,
    invoiceNo,
    storeName,
    storeId: toNumber(item?.store?.id || item?.storeId || item?.suborder?.storeId, 0) || null,
    courier: normalizeText(
      getNested(item, [
        "tracking.courier",
        "tracking.courierName",
        "courier",
        "courierName",
        "shipment.courierCode",
      ]),
      EMPTY_TEXT
    ),
    trackingNumber,
    status,
    statusLabel:
      item?.canonicalShipmentStatusMeta?.label ||
      item?.shipmentStatusMeta?.label ||
      formatStatus(status, "Pending"),
    categories,
    primaryCategory: primaryCategory.code ? primaryCategory : categories[0],
    issue: normalizeText(
      getNested(item, ["issue", "issueLabel", "primaryCategory.label"]),
      primaryCategory.label || categories[0]?.label || "Issue"
    ),
    etaDrift: normalizeText(getNested(item, ["etaDrift", "eta.drift", "tracking.etaDrift"]), ""),
    updatedAt,
    suborderNumber: normalizeText(item?.suborderNumber || item?.suborder?.suborderNumber, ""),
    checkoutMode: normalizeText(item?.checkoutMode, ""),
    orderDetailHref:
      normalizeText(item?.orderDetailHref, "") ||
      (invoiceNo && invoiceNo !== EMPTY_TEXT ? `/admin/orders/${encodeURIComponent(invoiceNo)}` : ""),
    tracking: item?.tracking && typeof item.tracking === "object" ? item.tracking : {},
    mixedOutcome: item?.mixedOutcome && typeof item.mixedOutcome === "object" ? item.mixedOutcome : {},
    hasAdminCorrection: Boolean(item?.tracking?.hasAdminCorrection || item?.hasAdminCorrection),
  };
};

const extractReport = (response) => {
  const items = unwrapArray(response).map(normalizeRow);
  const meta =
    response?.meta ||
    response?.data?.meta ||
    response?.data?.data?.meta ||
    response?.pagination ||
    response?.data?.pagination ||
    {};

  return {
    items,
    meta: {
      page: toNumber(meta.page, 1),
      pageSize: toNumber(meta.pageSize || meta.limit, items.length || 20),
      total: toNumber(meta.total ?? meta.count, items.length),
      totalPages: toNumber(meta.totalPages, 1),
      scannedOrders: toNumber(meta.scannedOrders ?? meta.scanned ?? meta.totalScanned, items.length),
      maxScanLimit: toNumber(meta.maxScanLimit, 500),
      categoryCounts: meta.categoryCounts && typeof meta.categoryCounts === "object" ? meta.categoryCounts : {},
      filters: meta.filters && typeof meta.filters === "object" ? meta.filters : {},
    },
  };
};

const hasCategory = (row, code) => row.categories.some((category) => category.code === code);

const getPriority = (row) => {
  if (hasCategory(row, "activeShippingException") || row.status === "FAILED_DELIVERY") {
    return { label: "Urgent", rank: 4 };
  }
  if (hasCategory(row, "compatibilityMismatch") || hasCategory(row, "mixedShipmentOutcome")) {
    return { label: "Active", rank: 3 };
  }
  if (hasCategory(row, "adminCorrectedRecent") || row.hasAdminCorrection) {
    return { label: "Corrected", rank: 1 };
  }
  return { label: "Review", rank: 2 };
};

const matchesQuickFilter = (row, filter) => {
  if (filter === "all") return true;
  if (filter === "urgent") return getPriority(row).label === "Urgent";
  if (filter === "mismatch") {
    return hasCategory(row, "compatibilityMismatch") || hasCategory(row, "mixedShipmentOutcome");
  }
  if (filter === "active") return hasCategory(row, "activeShippingException");
  if (filter === "final") return hasCategory(row, "finalShippingException");
  if (filter === "tracking") return hasCategory(row, "trackingDataIncomplete");
  if (filter === "corrected") return hasCategory(row, "adminCorrectedRecent") || row.hasAdminCorrection;
  return true;
};

const getCorrectionTarget = (row) => {
  if (row.status === "FAILED_DELIVERY") return "DELIVERED";
  if (row.status === "RETURNED") return "CANCELLED";
  return "";
};

const getCategoryColor = (code) => CATEGORY_META[code]?.color || "#64748b";

const getEtaDrift = (row) => {
  const explicit = normalizeText(row.etaDrift);
  if (explicit) return explicit;
  const updated = parseDate(row.updatedAt);
  if (!updated) return EMPTY_TEXT;
  const hours = Math.round((Date.now() - updated.getTime()) / 3600000);
  if (hours <= 0) return EMPTY_TEXT;
  if (hours < 24) return `+${hours}h`;
  const days = Math.max(1, Math.round(hours / 24));
  return `+${days}d`;
};

const buildCounts = (rows) =>
  rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (getPriority(row).label === "Urgent") acc.urgent += 1;
      if (hasCategory(row, "trackingDataIncomplete")) acc.tracking += 1;
      if (hasCategory(row, "adminCorrectedRecent") || row.hasAdminCorrection) acc.corrected += 1;
      if (hasCategory(row, "activeShippingException")) acc.active += 1;
      if (hasCategory(row, "finalShippingException")) acc.final += 1;
      if (hasCategory(row, "compatibilityMismatch") || hasCategory(row, "mixedShipmentOutcome")) {
        acc.mismatch += 1;
      }
      return acc;
    },
    { total: 0, urgent: 0, tracking: 0, corrected: 0, active: 0, final: 0, mismatch: 0 }
  );

const buildChartData = (rows) => {
  const buckets = new Map();
  rows.forEach((row) => {
    const label = formatShortDate(row.updatedAt) || "N/A";
    if (!buckets.has(label)) {
      buckets.set(label, { name: label, urgent: 0, active: 0, tracking: 0, final: 0, corrected: 0 });
    }
    const bucket = buckets.get(label);
    if (getPriority(row).label === "Urgent") bucket.urgent += 1;
    if (hasCategory(row, "activeShippingException")) bucket.active += 1;
    if (hasCategory(row, "trackingDataIncomplete")) bucket.tracking += 1;
    if (hasCategory(row, "finalShippingException")) bucket.final += 1;
    if (hasCategory(row, "adminCorrectedRecent") || row.hasAdminCorrection) bucket.corrected += 1;
  });
  return Array.from(buckets.values()).slice(-7);
};

const buildCategoryRows = (rows, metaCounts) => {
  const counts = new Map();
  Object.entries(metaCounts || {}).forEach(([code, count]) => {
    counts.set(code, toNumber(count, 0));
  });
  rows.forEach((row) => {
    row.categories.forEach((category) => {
      counts.set(category.code, Math.max(counts.get(category.code) || 0, 0));
      if (!metaCounts?.[category.code]) counts.set(category.code, (counts.get(category.code) || 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([code, count]) => ({
      code,
      count,
      label: CATEGORY_META[code]?.label || formatStatus(code, "Issue"),
      color: getCategoryColor(code),
    }));
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function AdminShippingReconciliationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quickFilter, setQuickFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [storeFilter, setStoreFilter] = useState("");
  const [selectedKey, setSelectedKey] = useState("");
  const [showOverview, setShowOverview] = useState(true);

  const reportQuery = useQuery({
    queryKey: ["admin", "shipping-reconciliation", "report"],
    queryFn: () => fetchAdminShippingReconciliationReport({ pageSize: 50 }),
  });

  const report = useMemo(() => extractReport(reportQuery.data), [reportQuery.data]);
  const rows = report.items;

  const stores = useMemo(() => {
    const seen = new Map();
    rows.forEach((row) => {
      const key = row.storeId ? String(row.storeId) : row.storeName;
      if (key && !seen.has(key)) seen.set(key, { value: key, label: row.storeName });
    });
    return Array.from(seen.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows]);

  const visibleRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const store = storeFilter.trim().toLowerCase();
    const status = normalizeCode(statusFilter);

    return rows
      .filter((row) => matchesQuickFilter(row, quickFilter))
      .filter((row) => {
        if (!term) return true;
        return (
          row.invoiceNo.toLowerCase().includes(term) ||
          row.storeName.toLowerCase().includes(term) ||
          row.trackingNumber.toLowerCase().includes(term)
        );
      })
      .filter((row) => !categoryFilter || hasCategory(row, categoryFilter))
      .filter((row) => !status || row.status === status)
      .filter((row) => {
        if (!store) return true;
        return String(row.storeId || "").toLowerCase() === store || row.storeName.toLowerCase() === store;
      })
      .sort((a, b) => getPriority(b).rank - getPriority(a).rank);
  }, [categoryFilter, quickFilter, rows, searchTerm, statusFilter, storeFilter]);

  const selectedRow = useMemo(
    () => visibleRows.find((row) => row._key === selectedKey) || null,
    [selectedKey, visibleRows]
  );

  const allCounts = useMemo(() => buildCounts(rows), [rows]);
  const chartData = useMemo(() => buildChartData(visibleRows), [visibleRows]);
  const topCategories = useMemo(
    () => buildCategoryRows(rows, report.meta.categoryCounts),
    [report.meta.categoryCounts, rows]
  );

  const lastSync = useMemo(() => {
    const dates = rows.map((row) => parseDate(row.updatedAt)).filter(Boolean).sort((a, b) => b - a);
    return dates[0] ? formatDate(dates[0]) : "Live";
  }, [rows]);

  const correctionMutation = useMutation({
    mutationFn: ({ row, targetStatus }) =>
      correctAdminShipmentException(row.orderId, row.suborderId, {
        targetStatus,
        reason: `Reconciliation correction: ${row.invoiceNo}`,
      }),
    meta: { suppressGlobalToast: true },
    onSuccess: (payload) => {
      toast.success(payload?.message || "Correction applied.");
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["admin-order"], exact: false });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to apply correction.");
    },
  });

  const resetFilters = () => {
    setSearchTerm("");
    setCategoryFilter("");
    setStatusFilter("");
    setStoreFilter("");
    setQuickFilter("all");
  };

  const handleRefresh = async () => {
    await reportQuery.refetch();
    toast.success("Reconciliation refreshed.");
  };

  const handleExport = () => {
    const headers = [
      "Invoice",
      "Store",
      "Courier",
      "Tracking",
      "Issue",
      "Drift",
      "Status",
      "Priority",
      "Updated",
    ];
    const lines = visibleRows.map((row) => [
      row.invoiceNo,
      row.storeName,
      row.courier,
      row.trackingNumber,
      row.issue,
      getEtaDrift(row),
      row.statusLabel,
      getPriority(row).label,
      formatDate(row.updatedAt),
    ]);
    const csv = [headers, ...lines].map((line) => line.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const date = new Date().toISOString().slice(0, 10);
    anchor.href = url;
    anchor.download = `shipping-reconciliation-${date}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV export downloaded.");
  };

  const handleCopy = async (text, label = "Item") => {
    if (!text || text === EMPTY_TEXT) return;
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied.`);
  };

  const handleCorrect = (row, explicitTargetStatus) => {
    if (!row.orderId || !row.suborderId) {
      toast.error("Missing order or suborder ID.");
      return;
    }
    const targetStatus = explicitTargetStatus || getCorrectionTarget(row);
    if (!targetStatus) {
      toast.error("No safe correction target available.");
      return;
    }
    correctionMutation.mutate({ row, targetStatus });
  };

  if (reportQuery.isLoading) {
    return (
      <div className="asr2026">
        <SonnerToaster richColors position="top-right" />
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="asr2026-skeleton" style={{ height: 60 }} />
          <div className="asr2026-metrics-grid">
            <div className="asr2026-skeleton" style={{ height: 96 }} />
            <div className="asr2026-skeleton" style={{ height: 96 }} />
            <div className="asr2026-skeleton" style={{ height: 96 }} />
            <div className="asr2026-skeleton" style={{ height: 96 }} />
          </div>
          <div className="asr2026-skeleton" style={{ height: 180 }} />
          <div className="asr2026-skeleton" style={{ height: 260 }} />
        </div>
      </div>
    );
  }

  if (reportQuery.isError) {
    return (
      <div className="asr2026">
        <SonnerToaster richColors position="top-right" />
        <div className="asr2026-error-card">
          <div className="asr2026-error-info">
            <AlertCircle size={22} color="var(--asr-orange)" />
            <div>
              <h3 className="asr2026-error-title">Failed to load reconciliation</h3>
              <p className="asr2026-error-desc">
                {reportQuery.error?.response?.data?.message ||
                  reportQuery.error?.message ||
                  "Unable to connect to shipping service."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => reportQuery.refetch()}
            className="asr2026-btn asr2026-btn--primary asr2026-btn--sm"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalExceptions = report.meta.total || rows.length;

  return (
    <div className="asr2026">
      <SonnerToaster richColors position="top-right" />

      {/* HEADER SECTION */}
      <header className="asr2026-header">
        <div className="asr2026-header-left">
          <div className="asr2026-title-row">
            <h1 className="asr2026-title">
              Shipping Reconciliation
            </h1>
            <span className="asr2026-title-badge">Live Queue</span>
          </div>
          <p className="asr2026-subtitle">
            Monitor & reconcile delivery exceptions.
          </p>
        </div>

        <div className="asr2026-header-actions">
          <span className="asr2026-sync-info">
            <CheckCircle2 size={13} style={{ color: "var(--asr-blue)" }} />
            {lastSync}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={reportQuery.isFetching}
            className="asr2026-btn"
            title="Refresh data"
          >
            <RefreshCw size={14} className={reportQuery.isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="asr2026-btn asr2026-btn--primary"
            title="Export CSV report"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </header>

      {/* METRICS SUMMARY GRID */}
      <section className="asr2026-metrics-grid">
        <div className="asr2026-metric-card is-blue">
          <div className="asr2026-metric-top">
            <span className="asr2026-metric-title">Scanned Orders</span>
            <div className="asr2026-metric-icon-wrap">
              <BarChart3 size={17} />
            </div>
          </div>
          <div className="asr2026-metric-value-row">
            <span className="asr2026-metric-value">
              {formatNumber(report.meta.scannedOrders || rows.length)}
            </span>
            <span className="asr2026-metric-pill">
              {visibleRows.length} visible
            </span>
          </div>
        </div>

        <div className="asr2026-metric-card is-orange">
          <div className="asr2026-metric-top">
            <span className="asr2026-metric-title">Urgent Exceptions</span>
            <div className="asr2026-metric-icon-wrap">
              <AlertCircle size={17} />
            </div>
          </div>
          <div className="asr2026-metric-value-row">
            <span className="asr2026-metric-value">{allCounts.urgent}</span>
            {allCounts.urgent > 0 && (
              <span className="asr2026-metric-pill has-alert">Action needed</span>
            )}
          </div>
        </div>

        <div className="asr2026-metric-card is-blue">
          <div className="asr2026-metric-top">
            <span className="asr2026-metric-title">Tracking Gaps</span>
            <div className="asr2026-metric-icon-wrap">
              <Link2 size={17} />
            </div>
          </div>
          <div className="asr2026-metric-value-row">
            <span className="asr2026-metric-value">{allCounts.tracking}</span>
            <span className="asr2026-metric-sub">missing data</span>
          </div>
        </div>

        <div className="asr2026-metric-card">
          <div className="asr2026-metric-top">
            <span className="asr2026-metric-title">Resolved</span>
            <div className="asr2026-metric-icon-wrap">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="asr2026-metric-value-row">
            <span className="asr2026-metric-value">{allCounts.corrected}</span>
            <span className="asr2026-metric-sub">corrected</span>
          </div>
        </div>
      </section>

      {/* OVERVIEW SECTION (COMPACT WITH TOGGLE) */}
      <section className="asr2026-overview-card">
        <div className="asr2026-overview-header">
          <h2 className="asr2026-overview-heading">
            Exceptions Overview
            <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--asr-text-muted)" }}>
              ({totalExceptions} total)
            </span>
          </h2>
          <button
            type="button"
            onClick={() => setShowOverview(!showOverview)}
            className="asr2026-btn asr2026-btn--sm"
          >
            {showOverview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showOverview ? "Compact" : "Expand"}
          </button>
        </div>

        {showOverview && (
          <div className="asr2026-overview-grid">
            <div className="asr2026-chart-container">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--asr-border-subtle)" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--asr-text-muted)" }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--asr-text-muted)" }} />
                    <Tooltip
                      cursor={{ fill: "rgba(3, 76, 133, 0.06)" }}
                      contentStyle={{
                        borderRadius: 8,
                        background: "var(--asr-surface)",
                        border: "1px solid var(--asr-border)",
                        fontSize: 12,
                        color: "var(--asr-text-title)",
                      }}
                    />
                    {CHART_KEYS.map((item) => (
                      <Bar key={item.key} dataKey={item.key} stackId="exceptions" fill={item.color} radius={[3, 3, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: "grid", height: "100%", placeItems: "center", fontSize: "0.8rem", color: "var(--asr-text-muted)" }}>
                  No exceptions recorded.
                </div>
              )}
            </div>

            <div className="asr2026-category-list">
              {topCategories.map((category) => {
                const percent = totalExceptions ? Math.round((category.count / totalExceptions) * 100) : 0;
                return (
                  <div key={category.code} className="asr2026-category-item">
                    <div className="asr2026-cat-info">
                      <span className="asr2026-cat-dot" style={{ backgroundColor: category.color }} />
                      <span className="asr2026-cat-label" title={category.label}>
                        {category.label}
                      </span>
                    </div>
                    <div className="asr2026-cat-meta">
                      <span className="asr2026-cat-count">{category.count}</span>
                      <div className="asr2026-cat-bar-wrap">
                        <div
                          className="asr2026-cat-bar-fill"
                          style={{ width: `${percent}%`, backgroundColor: category.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="asr2026-toolbar-card">
        {/* Quick Filter Pills */}
        <div className="asr2026-quick-filters">
          {QUICK_FILTERS.map((f) => {
            const count =
              f.value === "all"
                ? rows.length
                : f.value === "urgent"
                ? allCounts.urgent
                : f.value === "mismatch"
                ? allCounts.mismatch
                : f.value === "active"
                ? allCounts.active
                : f.value === "final"
                ? allCounts.final
                : f.value === "tracking"
                ? allCounts.tracking
                : allCounts.corrected;

            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setQuickFilter(f.value)}
                className={`asr2026-quick-btn ${quickFilter === f.value ? "is-active" : ""}`}
              >
                {f.label}
                <span className="asr2026-quick-count">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Input Controls */}
        <div className="asr2026-filter-inputs">
          <div className="asr2026-input-box">
            <Search size={14} style={{ color: "var(--asr-text-dim)" }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoice or store..."
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--asr-text-dim)" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="asr2026-select"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="asr2026-select"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value)}
            className="asr2026-select"
          >
            <option value="">All Stores</option>
            {stores.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetFilters}
            className="asr2026-btn"
            title="Reset all filters"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </section>

      {/* WORKSPACE: TABLE / FEED + SLIDE-OVER DETAIL */}
      <section className={`asr2026-workspace ${selectedRow ? "has-drawer" : ""}`}>
        <div className="asr2026-table-card">
          {visibleRows.length === 0 ? (
            <div className="asr2026-empty">
              <div className="asr2026-empty-icon">
                <FileSearch size={22} />
              </div>
              <h3 className="asr2026-empty-title">No reconciliation records found</h3>
              <p className="asr2026-empty-desc">
                Current filter combination does not match any shipment exceptions.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="asr2026-btn asr2026-btn--sm"
                style={{ marginTop: 8 }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="asr2026-table-wrapper">
                <table className="asr2026-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Invoice</th>
                      <th>Store</th>
                      <th>Status & Issue</th>
                      <th>Tracking</th>
                      <th>Drift</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => {
                      const isSelected = selectedRow?._key === row._key;
                      const correctionTarget = getCorrectionTarget(row);
                      const issueMeta = CATEGORY_META[row.primaryCategory?.code];
                      const IssueIcon = issueMeta?.Icon || Info;

                      return (
                        <tr
                          key={row._key}
                          className={isSelected ? "is-selected" : ""}
                          onClick={() => setSelectedKey(isSelected ? "" : row._key)}
                        >
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="radio"
                              name="selected_exception"
                              checked={isSelected}
                              onChange={() => setSelectedKey(row._key)}
                              style={{ accentColor: "var(--asr-blue)", cursor: "pointer" }}
                            />
                          </td>
                          <td>
                            <Link
                              to={row.orderDetailHref}
                              onClick={(e) => e.stopPropagation()}
                              className="asr2026-invoice-link"
                              title={row.invoiceNo}
                            >
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.invoiceNo}
                              </span>
                            </Link>
                          </td>
                          <td>
                            <div className="asr2026-store-name" title={row.storeName}>
                              {row.storeName}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                              <span className={`asr2026-badge ${row.status === "CANCELLED" || row.status === "FAILED_DELIVERY" ? "asr2026-badge--urgent" : "asr2026-badge--neutral"}`}>
                                {row.statusLabel}
                              </span>
                              <span className={`asr2026-badge ${issueMeta?.badgeClass || "asr2026-badge--neutral"}`}>
                                <IssueIcon size={12} />
                                {row.issue}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="asr2026-tracking-cell">
                              <span>{row.trackingNumber}</span>
                              {row.trackingNumber !== EMPTY_TEXT && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopy(row.trackingNumber, "Tracking number");
                                  }}
                                  className="asr2026-copy-btn"
                                  title="Copy tracking"
                                >
                                  <Copy size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td>
                            {row.etaDrift ? (
                              <span className="asr2026-drift-tag">{getEtaDrift(row)}</span>
                            ) : (
                              <span style={{ color: "var(--asr-text-dim)" }}>—</span>
                            )}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            {correctionTarget ? (
                              <button
                                type="button"
                                onClick={() => handleCorrect(row)}
                                disabled={correctionMutation.isPending}
                                className="asr2026-btn asr2026-btn--primary asr2026-btn--sm"
                              >
                                {correctionMutation.isPending ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  "Reconcile"
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => navigate(row.orderDetailHref)}
                                className="asr2026-btn asr2026-btn--sm"
                              >
                                Review
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS FEED (< 768px) */}
              <div className="asr2026-mobile-feed">
                {visibleRows.map((row) => {
                  const isSelected = selectedRow?._key === row._key;
                  const issueMeta = CATEGORY_META[row.primaryCategory?.code];
                  const IssueIcon = issueMeta?.Icon || Info;

                  return (
                    <div
                      key={row._key}
                      className={`asr2026-mobile-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => setSelectedKey(isSelected ? "" : row._key)}
                    >
                      <div className="asr2026-mobile-card-top">
                        <span className="asr2026-mobile-invoice">{row.invoiceNo}</span>
                        <span className={`asr2026-badge ${row.status === "CANCELLED" || row.status === "FAILED_DELIVERY" ? "asr2026-badge--urgent" : "asr2026-badge--neutral"}`}>
                          {row.statusLabel}
                        </span>
                      </div>

                      <div className="asr2026-mobile-store-row">
                        <span>{row.storeName}</span>
                        {row.etaDrift && (
                          <span className="asr2026-drift-tag">{getEtaDrift(row)}</span>
                        )}
                      </div>

                      <div className="asr2026-mobile-badges">
                        <span className={`asr2026-badge ${issueMeta?.badgeClass || "asr2026-badge--neutral"}`}>
                          <IssueIcon size={12} />
                          {row.issue}
                        </span>
                        {row.courier !== EMPTY_TEXT && (
                          <span className="asr2026-badge asr2026-badge--neutral">
                            {row.courier}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* SELECTED EXCEPTION DETAIL DRAWER */}
        {selectedRow && (
          <aside className="asr2026-drawer">
            <div className="asr2026-drawer-header">
              <h3 className="asr2026-drawer-title">Exception Detail</h3>
              <button
                type="button"
                onClick={() => setSelectedKey("")}
                className="asr2026-drawer-close"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="asr2026-drawer-target">
              <div className="asr2026-drawer-icon">
                <Truck size={18} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="asr2026-drawer-inv">{selectedRow.invoiceNo}</div>
                <div className="asr2026-drawer-store">{selectedRow.storeName}</div>
              </div>
            </div>

            <div className="asr2026-spec-grid">
              <span className="asr2026-spec-label">Status</span>
              <span className="asr2026-spec-val">
                <span className={`asr2026-badge ${selectedRow.status === "CANCELLED" || selectedRow.status === "FAILED_DELIVERY" ? "asr2026-badge--urgent" : "asr2026-badge--neutral"}`}>
                  {selectedRow.statusLabel}
                </span>
              </span>

              <span className="asr2026-spec-label">Issue</span>
              <span className="asr2026-spec-val">{selectedRow.issue}</span>

              <span className="asr2026-spec-label">Courier</span>
              <span className="asr2026-spec-val">{selectedRow.courier}</span>

              <span className="asr2026-spec-label">Tracking</span>
              <span className="asr2026-spec-val">
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  {selectedRow.trackingNumber}
                  {selectedRow.trackingNumber !== EMPTY_TEXT && (
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedRow.trackingNumber, "Tracking number")}
                      className="asr2026-copy-btn"
                    >
                      <Copy size={12} />
                    </button>
                  )}
                </span>
              </span>

              <span className="asr2026-spec-label">Drift</span>
              <span className="asr2026-spec-val asr2026-drift-tag">
                {getEtaDrift(selectedRow)}
              </span>

              <span className="asr2026-spec-label">Updated</span>
              <span className="asr2026-spec-val">{formatDate(selectedRow.updatedAt)}</span>
            </div>

            <div className="asr2026-drawer-actions">
              {selectedRow.status === "FAILED_DELIVERY" ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleCorrect(selectedRow, "DELIVERED")}
                    disabled={correctionMutation.isPending}
                    className="asr2026-btn asr2026-btn--primary"
                  >
                    {correctionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                    Reconcile Delivered
                  </button>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => handleCorrect(selectedRow, "RETURNED")}
                      disabled={correctionMutation.isPending}
                      className="asr2026-btn asr2026-btn--sm"
                    >
                      Returned
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCorrect(selectedRow, "SHIPPED")}
                      disabled={correctionMutation.isPending}
                      className="asr2026-btn asr2026-btn--sm"
                    >
                      In Transit
                    </button>
                  </div>
                </>
              ) : selectedRow.status === "RETURNED" ? (
                <button
                  type="button"
                  onClick={() => handleCorrect(selectedRow, "CANCELLED")}
                  disabled={correctionMutation.isPending}
                  className="asr2026-btn asr2026-btn--primary"
                >
                  {correctionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Reconcile Cancelled
                </button>
              ) : getCorrectionTarget(selectedRow) ? (
                <button
                  type="button"
                  onClick={() => handleCorrect(selectedRow)}
                  disabled={correctionMutation.isPending}
                  className="asr2026-btn asr2026-btn--primary"
                >
                  {correctionMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Truck size={14} />}
                  Reconcile ({getCorrectionTarget(selectedRow)})
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => navigate(selectedRow.orderDetailHref)}
                className="asr2026-btn"
              >
                <ExternalLink size={14} />
                Open Order
              </button>
            </div>
          </aside>
        )}
      </section>
    </div>
  );
}
