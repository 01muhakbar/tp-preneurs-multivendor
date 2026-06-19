import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  Filter,
  Info,
  Link2,
  Loader2,
  MoreVertical,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
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

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "compatibilityMismatch", label: "Final mismatch" },
  { value: "mixedShipmentOutcome", label: "Mixed outcome" },
  { value: "activeShippingException", label: "Active exception" },
  { value: "finalShippingException", label: "Final exception" },
  { value: "trackingDataIncomplete", label: "Tracking gap" },
  { value: "adminCorrectedRecent", label: "Corrected" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "INFO_RECEIVED", label: "Info Received" },
  { value: "READY_TO_FULFILL", label: "Ready To Fulfill" },
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
  { value: "active", label: "Active Exception" },
  { value: "final", label: "Final Exception" },
  { value: "tracking", label: "Tracking Gap" },
  { value: "corrected", label: "Corrected" },
];

const CATEGORY_META = {
  compatibilityMismatch: {
    label: "Final mismatch",
    shortLabel: "Final mismatch",
    color: "#8b5cf6",
    bg: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200",
    Icon: Sparkles,
  },
  mixedShipmentOutcome: {
    label: "Mixed outcome",
    shortLabel: "Mismatch",
    color: "#f97316",
    bg: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
    Icon: AlertCircle,
  },
  activeShippingException: {
    label: "Active exception",
    shortLabel: "Active",
    color: "#ef4444",
    bg: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
    Icon: AlertCircle,
  },
  finalShippingException: {
    label: "Final exception",
    shortLabel: "Final",
    color: "#64748b",
    bg: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
    Icon: ClipboardCheck,
  },
  trackingDataIncomplete: {
    label: "Tracking gap",
    shortLabel: "Tracking gap",
    color: "#f59e0b",
    bg: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
    Icon: Link2,
  },
  adminCorrectedRecent: {
    label: "Corrected",
    shortLabel: "Corrected",
    color: "#059669",
    bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
    Icon: CheckCircle2,
  },
};

const STATUS_STYLES = {
  DELIVERED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  SHIPPED: "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200",
  INFO_RECEIVED: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
  FAILED_DELIVERY: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  RETURNED: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  CANCELLED: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200",
};

const PRIORITY_STYLES = {
  Urgent: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200",
  Active: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-200",
  Corrected: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200",
  Review: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
};

const CHART_KEYS = [
  { key: "urgent", label: "Urgent", color: "#ef4444" },
  { key: "active", label: "Active", color: "#f59e0b" },
  { key: "tracking", label: "Tracking Gap", color: "#3b82f6" },
  { key: "final", label: "Final", color: "#8b5cf6" },
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
  year: "numeric",
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
      label: CATEGORY_META[category]?.label || formatStatus(category, "Shipment issue"),
      detail: null,
    };
  }
  const code = normalizeText(category?.code || category?.key || category?.value);
  return {
    code,
    label: normalizeText(category?.label, CATEGORY_META[code]?.label || formatStatus(code, "Shipment issue")),
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
      primaryCategory.label || categories[0]?.label || "Shipment issue"
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

const getIssueColor = (row) =>
  CATEGORY_META[row.primaryCategory?.code]?.bg ||
  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";

const getIssueIcon = (row) => CATEGORY_META[row.primaryCategory?.code]?.Icon || Info;

const getCategoryColor = (code) => CATEGORY_META[code]?.color || "#64748b";

const getStatusStyle = (status) =>
  STATUS_STYLES[status] || "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200";

const getEtaDrift = (row) => {
  const explicit = normalizeText(row.etaDrift);
  if (explicit) return explicit;
  const updated = parseDate(row.updatedAt);
  if (!updated) return EMPTY_TEXT;
  const hours = Math.round((Date.now() - updated.getTime()) / 3600000);
  if (hours <= 0) return EMPTY_TEXT;
  if (hours < 24) return `+${hours}h`;
  const days = Math.max(1, Math.round(hours / 24));
  return `+${days}d ${hours % 24}h`;
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
    const label = formatShortDate(row.updatedAt) || "No date";
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
      label: CATEGORY_META[code]?.label || formatStatus(code, "Shipment issue"),
      color: getCategoryColor(code),
    }));
};

const csvEscape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

function StatusBadge({ children, className = "" }) {
  return (
    <span className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      <span className="truncate">{children}</span>
    </span>
  );
}

function MetricCard({ title, value, delta, icon: Icon, accent = "emerald", spark = "up" }) {
  const accentClass =
    accent === "rose"
      ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200"
      : accent === "amber"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
        : accent === "sky"
          ? "bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200";
  const lineClass =
    accent === "rose" ? "bg-rose-500" : accent === "amber" ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-950 dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div className={`grid size-14 shrink-0 place-items-center rounded-full ${accentClass}`}>
          <Icon className="size-6" aria-hidden="true" />
        </div>
        <div className="mt-6 flex h-10 w-24 items-end gap-1 opacity-80" aria-hidden="true">
          {[35, 42, 38, 48, spark === "down" ? 30 : 58, 44, spark === "down" ? 24 : 68].map((height, index) => (
            <span
              key={`${title}-spark-${index}`}
              className={`w-full rounded-full ${lineClass}`}
              style={{ height: `${height}%`, opacity: 0.35 + index * 0.07 }}
            />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          {title}
          <Info className="size-3.5" aria-hidden="true" />
        </div>
        <p className="mt-1 text-3xl font-semibold leading-none text-slate-950 dark:text-white">{value}</p>
        <p
          className={`mt-3 text-xs font-semibold ${
            spark === "down" ? "text-emerald-600 dark:text-emerald-300" : "text-emerald-600 dark:text-emerald-300"
          }`}
        >
          {delta}
        </p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={`shipping-skeleton-card-${index}`}
            className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
          />
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
      </div>
      <div className="h-96 animate-pulse rounded-2xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900" />
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Shipping reconciliation could not load</h2>
            <p className="mt-1 text-sm opacity-85">{message}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-slate-950">
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
        <FileSearch className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-950 dark:text-white">No reconciliation rows found</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
        Current filters do not match any shipment exceptions from the report.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Reset filters
      </button>
    </div>
  );
}

export default function AdminShippingReconciliationPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quickFilter, setQuickFilter] = useState("all");
  const [draftFilters, setDraftFilters] = useState({
    invoice: "",
    category: "",
    status: "",
    store: "",
  });
  const [filters, setFilters] = useState(draftFilters);
  const [selectedKey, setSelectedKey] = useState("");

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
    const invoice = filters.invoice.trim().toLowerCase();
    const store = filters.store.trim().toLowerCase();
    const status = normalizeCode(filters.status);
    return rows
      .filter((row) => matchesQuickFilter(row, quickFilter))
      .filter((row) => !invoice || row.invoiceNo.toLowerCase().includes(invoice))
      .filter((row) => !filters.category || hasCategory(row, filters.category))
      .filter((row) => !status || row.status === status)
      .filter((row) => {
        if (!store) return true;
        return String(row.storeId || "").toLowerCase() === store || row.storeName.toLowerCase() === store;
      })
      .sort((a, b) => getPriority(b).rank - getPriority(a).rank);
  }, [filters, quickFilter, rows]);

  const selectedRow = useMemo(
    () => visibleRows.find((row) => row._key === selectedKey) || visibleRows[0] || null,
    [selectedKey, visibleRows]
  );

  useEffect(() => {
    if (selectedRow && selectedRow._key !== selectedKey) setSelectedKey(selectedRow._key);
    if (!selectedRow && selectedKey) setSelectedKey("");
  }, [selectedKey, selectedRow]);

  const allCounts = useMemo(() => buildCounts(rows), [rows]);
  const visibleCounts = useMemo(() => buildCounts(visibleRows), [visibleRows]);
  const chartData = useMemo(() => buildChartData(visibleRows), [visibleRows]);
  const topCategories = useMemo(
    () => buildCategoryRows(rows, report.meta.categoryCounts),
    [report.meta.categoryCounts, rows]
  );

  const dateRange = useMemo(() => {
    const dates = rows.map((row) => parseDate(row.updatedAt)).filter(Boolean).sort((a, b) => a - b);
    if (dates.length === 0) return "Current scan window";
    const first = DATE_FORMATTER.format(dates[0]);
    const last = DATE_FORMATTER.format(dates[dates.length - 1]);
    return `${first} - ${last}, ${dates[dates.length - 1].getFullYear()}`;
  }, [rows]);

  const lastSync = useMemo(() => {
    const dates = rows.map((row) => parseDate(row.updatedAt)).filter(Boolean).sort((a, b) => b - a);
    return dates[0] ? formatDate(dates[0]) : "Just now";
  }, [rows]);

  const correctionMutation = useMutation({
    mutationFn: ({ row, targetStatus }) =>
      correctAdminShipmentException(row.orderId, row.suborderId, {
        targetStatus,
        reason: `Admin shipping reconciliation correction for ${row.invoiceNo}.`,
      }),
    meta: { suppressGlobalToast: true },
    onSuccess: (payload) => {
      toast.success(payload?.message || "Shipment correction applied.");
      queryClient.invalidateQueries({ queryKey: ["admin", "shipping-reconciliation"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["admin-order"], exact: false });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Failed to apply correction.");
    },
  });

  const applySearch = () => setFilters({ ...draftFilters });

  const resetFilters = () => {
    const empty = { invoice: "", category: "", status: "", store: "" };
    setDraftFilters(empty);
    setFilters(empty);
    setQuickFilter("all");
  };

  const handleRefresh = async () => {
    await reportQuery.refetch();
    toast.success("Shipping reconciliation refreshed.");
  };

  const handleExport = () => {
    const headers = [
      "Invoice",
      "Store",
      "Courier",
      "Tracking",
      "Issue",
      "ETA Drift",
      "Shipment Status",
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
    toast.success("CSV export generated.");
  };

  const handleCopyTracking = async (row) => {
    if (!row.trackingNumber || row.trackingNumber === EMPTY_TEXT) {
      toast.error("Tracking number is unavailable.");
      return;
    }
    await navigator.clipboard.writeText(row.trackingNumber);
    toast.success("Tracking number copied.");
  };

  const handleCorrect = (row) => {
    if (!row.orderId || !row.suborderId) {
      toast.error("This row is missing order or suborder information.");
      return;
    }
    const targetStatus = getCorrectionTarget(row);
    if (!targetStatus) {
      toast.error("No safe correction target is available for this shipment status.");
      return;
    }
    correctionMutation.mutate({ row, targetStatus });
  };

  if (reportQuery.isLoading) {
    return (
      <div className="space-y-6">
        <SonnerToaster richColors position="top-right" />
        <LoadingSkeleton />
      </div>
    );
  }

  if (reportQuery.isError) {
    return (
      <div className="space-y-6">
        <SonnerToaster richColors position="top-right" />
        <ErrorState
          message={
            reportQuery.error?.response?.data?.message ||
            reportQuery.error?.message ||
            "Failed to load shipping reconciliation report."
          }
          onRetry={() => reportQuery.refetch()}
        />
      </div>
    );
  }

  const totalExceptions = report.meta.total || rows.length;
  const selectedPriority = selectedRow ? getPriority(selectedRow) : { label: "Review" };
  const selectedIssueIcon = selectedRow ? getIssueIcon(selectedRow) : Info;
  const SelectedIssueIcon = selectedIssueIcon;

  return (
    <div className="space-y-5 text-slate-900 dark:text-slate-100">
      <SonnerToaster richColors position="top-right" />

      <section className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
            Shipping Reconciliation
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Track delivery gaps, timing mismatches, and shipment exceptions.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge className="gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
              Live
            </StatusBadge>
            <StatusBadge className="gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Verified
            </StatusBadge>
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <CalendarDays className="size-4" aria-hidden="true" />
              {dateRange}
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <RefreshCw className={`size-4 ${reportQuery.isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
            >
              <Download className="size-4" aria-hidden="true" />
              Export Report
            </button>
          </div>
          <p className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="size-4 text-emerald-500" aria-hidden="true" />
            Last sync {lastSync}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Orders Scanned"
          value={formatNumber(report.meta.scannedOrders || rows.length)}
          delta={`${formatNumber(visibleRows.length)} visible exceptions`}
          icon={BarChart3}
          accent="emerald"
        />
        <MetricCard
          title="Urgent Exceptions"
          value={formatNumber(allCounts.urgent)}
          delta={`${formatNumber(visibleCounts.urgent)} in current view`}
          icon={AlertCircle}
          accent="rose"
          spark="up"
        />
        <MetricCard
          title="Tracking Gaps"
          value={formatNumber(allCounts.tracking)}
          delta={`${formatNumber(visibleCounts.tracking)} filtered rows`}
          icon={Link2}
          accent="amber"
          spark="down"
        />
        <MetricCard
          title="Corrected Today"
          value={formatNumber(allCounts.corrected)}
          delta={`${formatNumber(visibleCounts.corrected)} visible corrections`}
          icon={CheckCircle2}
          accent="emerald"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Exception Overview</h2>
            <StatusBadge className="gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
              <Sparkles className="size-3.5" aria-hidden="true" />
              Stable view
            </StatusBadge>
          </div>
          <div className="mt-5 flex flex-wrap gap-4">
            {CHART_KEYS.map((item) => (
              <span key={item.key} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="size-2 rounded-sm" style={{ backgroundColor: item.color }} aria-hidden="true" />
                {item.label}
              </span>
            ))}
          </div>
          <div className="mt-4 h-52">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip
                    cursor={{ fill: "rgba(15, 23, 42, 0.05)" }}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                    }}
                  />
                  {CHART_KEYS.map((item) => (
                    <Bar key={item.key} dataKey={item.key} stackId="exceptions" fill={item.color} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                No chartable exceptions in this view.
              </div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Exceptions</p>
              <p className="mt-1 text-2xl font-semibold text-slate-950 dark:text-white">{formatNumber(totalExceptions)}</p>
            </div>
            <button
              type="button"
              onClick={() => setQuickFilter("all")}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:text-slate-300"
            >
              View All Insights
              <ExternalLink className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Top Categories</h2>
            <StatusBadge className="gap-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200">
              <PackageCheck className="size-3.5" aria-hidden="true" />
              Updated
            </StatusBadge>
          </div>
          <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
            {topCategories.length > 0 ? (
              topCategories.map((category) => {
                const percent = totalExceptions ? Math.round((category.count / totalExceptions) * 1000) / 10 : 0;
                const Icon = CATEGORY_META[category.code]?.Icon || Info;
                return (
                  <div key={category.code} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-full"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <span className="truncate text-sm font-medium text-slate-600 dark:text-slate-300">
                        {category.label}
                      </span>
                    </div>
                    <div className="grid min-w-[210px] grid-cols-[42px_48px_minmax(80px,1fr)] items-center gap-4 text-sm">
                      <span className="text-right font-semibold text-slate-950 dark:text-white">{category.count}</span>
                      <span className="text-right text-xs text-slate-500 dark:text-slate-400">{percent}%</span>
                      <span className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                        <span
                          className="block h-full rounded-full"
                          style={{ width: `${Math.min(100, percent)}%`, backgroundColor: category.color }}
                        />
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                No category counts are available.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Quick Filters</span>
              {QUICK_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setQuickFilter(filter.value)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    quickFilter === filter.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-500/15 dark:text-emerald-200"
                      : "border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-slate-100 p-4 dark:border-slate-800">
            <div className="grid gap-3 lg:grid-cols-[minmax(180px,1.1fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_minmax(170px,0.8fr)_auto_auto]">
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Invoice No.</span>
                <span className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
                  <Search className="size-4 text-slate-400" aria-hidden="true" />
                  <input
                    value={draftFilters.invoice}
                    onChange={(event) => setDraftFilters((current) => ({ ...current, invoice: event.target.value }))}
                    placeholder="Search invoice..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                </span>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Category</span>
                <select
                  value={draftFilters.category}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, category: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Shipment Status</span>
                <select
                  value={draftFilters.status}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value || "all"} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Store</span>
                <select
                  value={draftFilters.store}
                  onChange={(event) => setDraftFilters((current) => ({ ...current, store: event.target.value }))}
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="">All Stores</option>
                  {stores.map((store) => (
                    <option key={store.value} value={store.value}>
                      {store.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={applySearch}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Filter className="size-4" aria-hidden="true" />
                Search
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                Reset
              </button>
            </div>
          </div>

          {visibleRows.length === 0 ? (
            <div className="p-4">
              <EmptyState onReset={resetFilters} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                  <tr>
                    <th className="w-10 px-4 py-3">
                      <span className="sr-only">Select</span>
                    </th>
                    <th className="px-4 py-3">Invoice</th>
                    <th className="px-4 py-3">Store</th>
                    <th className="px-4 py-3">Courier</th>
                    <th className="px-4 py-3">Tracking</th>
                    <th className="px-4 py-3">Issue</th>
                    <th className="px-4 py-3">ETA Drift</th>
                    <th className="px-4 py-3">Shipment Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="w-10 px-4 py-3">
                      <span className="sr-only">More</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {visibleRows.map((row) => {
                    const priority = getPriority(row);
                    const IssueIcon = getIssueIcon(row);
                    const isSelected = selectedRow?._key === row._key;
                    const correctionTarget = getCorrectionTarget(row);
                    return (
                      <tr
                        key={row._key}
                        className={`transition ${
                          isSelected
                            ? "bg-emerald-50/70 dark:bg-emerald-500/10"
                            : "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-label={`Select ${row.invoiceNo}`}
                            onClick={() => setSelectedKey(row._key)}
                            className={`grid size-4 place-items-center rounded border ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-slate-300 bg-white text-transparent dark:border-slate-700 dark:bg-slate-900"
                            }`}
                          >
                            <Check className="size-3" aria-hidden="true" />
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {row.invoiceNo !== EMPTY_TEXT ? (
                            <Link
                              to={`/admin/orders/${encodeURIComponent(row.invoiceNo)}`}
                              className="font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300"
                            >
                              {row.invoiceNo}
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-500">{EMPTY_TEXT}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.storeName}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{row.courier}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                            {row.trackingNumber}
                            {row.trackingNumber !== EMPTY_TEXT ? (
                              <button
                                type="button"
                                aria-label={`Copy tracking number ${row.trackingNumber}`}
                                onClick={() => handleCopyTracking(row)}
                                className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700 dark:hover:bg-slate-800"
                              >
                                <Copy className="size-3.5" aria-hidden="true" />
                              </button>
                            ) : null}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge className={`gap-1.5 ${getIssueColor(row)}`}>
                            <IssueIcon className="size-3.5" aria-hidden="true" />
                            {row.issue}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3 font-semibold text-rose-500 dark:text-rose-300">{getEtaDrift(row)}</td>
                        <td className="px-4 py-3">
                          <StatusBadge className={getStatusStyle(row.status)}>{row.statusLabel}</StatusBadge>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge className={PRIORITY_STYLES[priority.label]}>{priority.label}</StatusBadge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(row.updatedAt)}</td>
                        <td className="px-4 py-3">
                          {correctionTarget ? (
                            <button
                              type="button"
                              onClick={() => handleCorrect(row)}
                              disabled={correctionMutation.isPending}
                              className="inline-flex h-9 min-w-20 items-center justify-center rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {correctionMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                              ) : (
                                "Correct"
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => row.invoiceNo !== EMPTY_TEXT && navigate(`/admin/orders/${encodeURIComponent(row.invoiceNo)}`)}
                              disabled={row.invoiceNo === EMPTY_TEXT}
                              className="inline-flex h-9 min-w-20 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
                            >
                              Review
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            aria-label={`More actions for ${row.invoiceNo}`}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <MoreVertical className="size-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Selected Exception</h2>
            <button
              type="button"
              aria-label="Clear selected exception"
              onClick={() => setSelectedKey("")}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {selectedRow ? (
            <div className="mt-5">
              <div className="flex items-start gap-3">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${getIssueColor(selectedRow)}`}>
                  <SelectedIssueIcon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-emerald-700 dark:text-emerald-300">{selectedRow.invoiceNo}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">{selectedRow.storeName}</p>
                </div>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                {[
                  ["Courier", selectedRow.courier],
                  ["Tracking No.", selectedRow.trackingNumber],
                  ["Status", selectedRow.statusLabel],
                  ["ETA", formatDate(selectedRow.updatedAt)],
                  ["ETA Drift", getEtaDrift(selectedRow)],
                  ["Issue", selectedRow.issue],
                  ["Priority", selectedPriority.label],
                ].map(([label, value]) => (
                  <div key={label} className="grid grid-cols-[96px_minmax(0,1fr)] gap-3">
                    <dt className="text-xs font-semibold text-slate-400 dark:text-slate-500">{label}</dt>
                    <dd className="min-w-0 text-slate-600 dark:text-slate-300">
                      {label === "Tracking No." && value !== EMPTY_TEXT ? (
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span className="truncate">{value}</span>
                          <button
                            type="button"
                            aria-label={`Copy tracking number ${value}`}
                            onClick={() => handleCopyTracking(selectedRow)}
                            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700 dark:hover:bg-slate-800"
                          >
                            <Copy className="size-3.5" aria-hidden="true" />
                          </button>
                        </span>
                      ) : label === "Status" ? (
                        <StatusBadge className={getStatusStyle(selectedRow.status)}>{value}</StatusBadge>
                      ) : label === "Priority" ? (
                        <StatusBadge className={PRIORITY_STYLES[selectedPriority.label]}>{value}</StatusBadge>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Notes</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-500 dark:text-slate-400">
                  {selectedRow.categories.slice(0, 3).map((category) => (
                    <li key={category.code} className="flex gap-2">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" aria-hidden="true" />
                      <span>{category.detail || category.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 grid gap-2">
                <button
                  type="button"
                  onClick={() => handleCorrect(selectedRow)}
                  disabled={!getCorrectionTarget(selectedRow) || correctionMutation.isPending}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {correctionMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Truck className="size-4" aria-hidden="true" />
                  )}
                  Add Reconciliation Note
                </button>
                <button
                  type="button"
                  onClick={() => selectedRow.invoiceNo !== EMPTY_TEXT && navigate(`/admin/orders/${encodeURIComponent(selectedRow.invoiceNo)}`)}
                  disabled={selectedRow.invoiceNo === EMPTY_TEXT}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:text-slate-300"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Open Order
                </button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center text-center text-sm text-slate-500 dark:text-slate-400">
              Select a row to inspect its shipment exception.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
