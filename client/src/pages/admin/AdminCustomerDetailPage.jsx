import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Filter,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  User,
  Wallet,
  X,
} from "lucide-react";
import {
  fetchAdminCustomer,
  fetchAdminCustomerOrders,
} from "../../lib/adminApi.js";
import { formatCurrency } from "../../utils/format.js";
import { getOrderTruthStatus } from "../../utils/orderTruth.js";

const STATUS_FILTER_ITEMS = [
  { value: "", labelEn: "All Statuses", labelId: "Semua Status" },
  { value: "pending", labelEn: "Pending", labelId: "Menunggu" },
  { value: "processing", labelEn: "Processing", labelId: "Diproses" },
  { value: "shipping", labelEn: "In Transit", labelId: "Dalam Pengiriman" },
  { value: "complete", labelEn: "Delivered", labelId: "Selesai" },
  { value: "cancelled", labelEn: "Cancelled", labelId: "Dibatalkan" },
  { value: "refunded", labelEn: "Refunded", labelId: "Dikembalikan" },
];

const STATUS_STYLES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  processing: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  refunded: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  complete: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  shipping: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
};

const tableHeadCell =
  "px-3.5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none";
const tableCell = "px-3.5 py-3 align-middle text-sm text-slate-700 dark:text-slate-200";

const normalizeOrdersResponse = (res) => {
  const root = res?.data ?? res;
  const items = Array.isArray(root)
    ? root
    : Array.isArray(root?.items)
      ? root.items
      : Array.isArray(root?.data?.items)
        ? root.data.items
        : Array.isArray(root?.data)
          ? root.data
          : [];
  const meta = root?.meta || root?.data?.meta || res?.meta || null;
  return { items, meta };
};

const orderInvoice = (order) =>
  order?.invoiceNo || order?.invoice || order?.ref || `#${order?.id}`;

const formatDateParts = (value, isId = false) => {
  if (!value) return { dateStr: "-", timeStr: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { dateStr: "-", timeStr: "" };
  const dateStr = new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return { dateStr, timeStr };
};

const toText = (value) => String(value ?? "").trim();

const getCustomerInitials = (name) => {
  const clean = String(name || "").trim();
  if (!clean || clean === "-") return "C";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

const getLocalizedTruthStatus = (order, isId = false) => {
  const status = getOrderTruthStatus(order);
  const bucket = String(status.bucket || "pending").toLowerCase();
  let label = status.label || "Pending";

  if (isId) {
    switch (bucket) {
      case "pending":
        label = "Menunggu";
        break;
      case "processing":
        label = "Diproses";
        break;
      case "shipping":
        label = "Dalam Pengiriman";
        break;
      case "complete":
      case "delivered":
        label = "Selesai";
        break;
      case "cancelled":
        label = "Dibatalkan";
        break;
      case "refunded":
        label = "Dikembalikan";
        break;
      default:
        label = status.label || "Diproses";
    }
  } else {
    switch (bucket) {
      case "pending":
        label = "Pending";
        break;
      case "processing":
        label = "Processing";
        break;
      case "shipping":
        label = "In Transit";
        break;
      case "complete":
      case "delivered":
        label = "Delivered";
        break;
      case "cancelled":
        label = "Cancelled";
        break;
      case "refunded":
        label = "Refunded";
        break;
      default:
        label = status.label || "Processing";
    }
  }

  return { bucket, label };
};

function OrderStatusBadge({ order, isId = false }) {
  const { bucket, label } = getLocalizedTruthStatus(order, isId);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
        STATUS_STYLES[bucket] || STATUS_STYLES.pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{label}</span>
    </span>
  );
}

function RoleBadge({ role }) {
  const clean = String(role || "user").toLowerCase();
  if (clean === "customer" || clean === "user" || clean === "pembeli") return null;

  const styleMap = {
    seller: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
    staff: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
    admin: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300",
    super_admin: "border-[#fe6f05]/30 bg-[#fe6f05]/10 text-[#fe6f05]",
  };

  const label = clean.replace(/_/g, " ").toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
        styleMap[clean] || "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {label}
    </span>
  );
}

function CustomerStatusBadge({ status, isId = false }) {
  const raw = String(status || "active").toLowerCase();
  const styles = {
    active:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
    inactive:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    blocked:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    pending_verification:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  };
  const dots = {
    active: "bg-emerald-500",
    inactive: "bg-slate-400",
    blocked: "bg-rose-500",
    pending_verification: "bg-amber-500",
  };
  const labels = {
    active: isId ? "Aktif" : "Active",
    inactive: isId ? "Nonaktif" : "Disabled",
    blocked: isId ? "Diblokir" : "Blocked",
    pending_verification: isId ? "Menunggu Verifikasi" : "Pending verification",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
        styles[raw] || styles.active
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[raw] || dots.active}`} />
      <span>{labels[raw] || (isId ? "Aktif" : "Active")}</span>
    </span>
  );
}

function CopyInvoiceButton({ invoice, isId = false }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!invoice) return;
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
      title={copied ? (isId ? "Tersalin!" : "Copied!") : (isId ? "Salin No. Faktur" : "Copy invoice")}
      aria-label={isId ? "Salin nomor faktur" : "Copy invoice"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export default function AdminCustomerDetailPage() {
  const { id } = useParams();
  const { i18n } = useTranslation("admin");
  const [, setLangSync] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSync((v) => v + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const isId =
    String(i18n.language || "").toLowerCase().startsWith("id") ||
    String(localStorage.getItem("admin_locale_lang") || "").toLowerCase().startsWith("id") ||
    String(localStorage.getItem("store_language") || "").toLowerCase().startsWith("id");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");

  const customerQuery = useQuery({
    queryKey: ["admin-customer", id],
    queryFn: () => fetchAdminCustomer(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setQ(qInput.trim());
    }, 400);
    return () => clearTimeout(handler);
  }, [qInput]);

  useEffect(() => {
    setPage(1);
  }, [q, status, limit, id]);

  const listParams = useMemo(
    () => ({
      page,
      limit,
      pageSize: limit,
      q: q || undefined,
      status: status || undefined,
    }),
    [page, limit, q, status]
  );

  const customerOrdersQuery = useQuery({
    queryKey: ["admin", "customerOrders", id, page, limit, q, status],
    queryFn: () => fetchAdminCustomerOrders(id, listParams),
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  });

  const customer = customerQuery.data?.data || null;
  const { items: orders, meta: ordersMeta } = normalizeOrdersResponse(customerOrdersQuery.data);

  const total = ordersMeta?.total ?? orders.length;
  const totalPages = ordersMeta?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  // Compute KPI Stats
  const totalOrdersCount = customer?.ordersCount ?? total;
  const totalSpentAmount = customer?.totalSpent ?? orders.reduce(
    (sum, o) => sum + Number(o.totalAmount || o.total || 0),
    0
  );
  const completedOrdersCount = orders.filter((o) => {
    const truth = getOrderTruthStatus(o);
    return truth.bucket === "complete" || truth.bucket === "delivered";
  }).length;
  const pendingOrdersCount = orders.filter((o) => {
    const truth = getOrderTruthStatus(o);
    return truth.bucket === "pending" || truth.bucket === "processing" || truth.bucket === "shipping";
  }).length;

  const handleResetFilters = () => {
    setQInput("");
    setQ("");
    setStatus("");
    setPage(1);
  };

  if (customerQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="space-y-2">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#034c85] border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isId ? "Memuat data pelanggan..." : "Loading customer details..."}
          </p>
        </div>
      </div>
    );
  }

  if (customerQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
        <p className="font-bold">{isId ? "Gagal memuat data pelanggan" : "Failed to load customer"}</p>
        <p className="mt-1 text-xs">
          {customerQuery.error?.response?.data?.message ||
            (isId ? "Terjadi kesalahan saat memuat data." : "An error occurred while loading customer.")}
        </p>
        <div className="mt-4">
          <Link
            to="/admin/customers"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{isId ? "Kembali ke Pelanggan" : "Back to Customers"}</span>
          </Link>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <User className="h-6 w-6" />
        </div>
        <p className="mt-3 text-base font-bold text-slate-800 dark:text-slate-200">
          {isId ? "Pelanggan tidak ditemukan" : "Customer not found"}
        </p>
        <div className="mt-4">
          <Link
            to="/admin/customers"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#034c85] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#023b68]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{isId ? "Kembali ke Pelanggan" : "Back to Customers"}</span>
          </Link>
        </div>
      </div>
    );
  }

  const customerName = toText(customer?.name) || "-";
  const customerEmail = toText(customer?.email) || "-";
  const customerPhone = toText(customer?.phone || customer?.phoneNumber) || "-";
  const customerAddress =
    toText(customer?.address || customer?.customerAddress || customer?.addressLine1) ||
    (isId ? "Belum ada data alamat tercatat" : "No address data recorded");
  const { dateStr: joinDate } = formatDateParts(customer?.createdAt, isId);
  const { dateStr: updateDate } = formatDateParts(customer?.updatedAt, isId);

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isId ? "Admin / Pelanggan / Detail" : "Admin / Customers / Details"}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#034c85] to-[#022e53] text-sm font-bold text-white shadow-md shadow-[#034c85]/20">
                {getCustomerInitials(customerName)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    {customerName}
                  </h1>
                  <RoleBadge role={customer?.role} />
                  <CustomerStatusBadge status={customer?.status} isId={isId} />
                </div>
                <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono font-semibold text-[#034c85] dark:text-[#38bdf8]">
                    ID #{customer.id}
                  </span>
                  <span>•</span>
                  <span>{isId ? `Bergabung ${joinDate}` : `Joined ${joinDate}`}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:self-center">
            <Link
              to="/admin/customers"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isId ? "Daftar Pelanggan" : "Back to Customers"}</span>
            </Link>

            <Link
              to={`/admin/customer-orders/${encodeURIComponent(customer.id)}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#fe6f05] px-3.5 text-xs font-semibold text-white shadow-sm shadow-[#fe6f05]/20 transition hover:bg-[#e06204] active:scale-[0.98]"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>{isId ? "Kelola Pesanan" : "Customer Orders Page"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Card 1: Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Total Pesanan" : "Total Orders"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {totalOrdersCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#034c85]" />
            <span>{isId ? "Transaksi terdaftar" : "Registered transactions"}</span>
          </div>
        </div>

        {/* Card 2: Total Spent */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Total Belanja" : "Total Spent"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fe6f05]/10 text-[#fe6f05] dark:bg-[#fe6f05]/20 dark:text-[#fe6f05]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(totalSpentAmount)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#fe6f05]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fe6f05]" />
            <span>{isId ? "Akumulasi nilai pesanan" : "Lifetime order value"}</span>
          </div>
        </div>

        {/* Card 3: Completed Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Pesanan Selesai" : "Completed Orders"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {completedOrdersCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{isId ? "Terkirim dan selesai" : "Successfully delivered"}</span>
          </div>
        </div>

        {/* Card 4: Pending / In Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Dalam Proses" : "In Progress"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {pendingOrdersCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>{isId ? "Menunggu penyelesaian" : "Awaiting fulfillment"}</span>
          </div>
        </div>
      </div>

      {/* 3 Customer Info Cards: Profile, Contact, Address */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
              <User className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {isId ? "Informasi Profil" : "Profile Details"}
            </h3>
          </div>
          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">{isId ? "Nama Lengkap" : "Full Name"}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{customerName}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">{isId ? "Peran Pengguna" : "Account Role"}</span>
              <span className="font-semibold uppercase text-slate-800 dark:text-slate-200">{customer?.role || "User"}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">{isId ? "Status Akun" : "Account Status"}</span>
              <CustomerStatusBadge status={customer?.status} isId={isId} />
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">{isId ? "Pembaruan Terakhir" : "Last Updated"}</span>
              <span className="text-slate-700 dark:text-slate-300">{updateDate}</span>
            </div>
          </div>
        </div>

        {/* Contact Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
              <Phone className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {isId ? "Kontak Pelanggan" : "Contact Details"}
            </h3>
          </div>
          <div className="mt-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-500 dark:text-slate-400">Email</span>
              {customerEmail !== "-" ? (
                <a
                  href={`mailto:${customerEmail}`}
                  className="font-medium text-[#034c85] hover:underline dark:text-[#38bdf8] truncate max-w-[180px]"
                  title={customerEmail}
                >
                  {customerEmail}
                </a>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">{isId ? "Nomor Telepon" : "Phone Number"}</span>
              {customerPhone !== "-" ? (
                <a
                  href={`tel:${customerPhone}`}
                  className="font-mono font-medium text-slate-800 hover:text-[#034c85] dark:text-slate-200 dark:hover:text-[#38bdf8]"
                >
                  {customerPhone}
                </a>
              ) : (
                <span className="text-slate-400">-</span>
              )}
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">{isId ? "Verifikasi Email" : "Email Status"}</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{isId ? "Terverifikasi" : "Verified"}</span>
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-t border-slate-50 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">{isId ? "Kanal Utama" : "Primary Channel"}</span>
              <span className="text-slate-700 dark:text-slate-300">Web Marketplace</span>
            </div>
          </div>
        </div>

        {/* Address Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#fe6f05]/10 text-[#fe6f05] dark:bg-[#fe6f05]/20 dark:text-[#fe6f05]">
              <MapPin className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              {isId ? "Alamat Pengiriman" : "Shipping Address"}
            </h3>
          </div>
          <div className="mt-3 text-xs">
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              {customerAddress}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-[#fe6f05]" />
              <span>{isId ? "Alamat pengiriman default" : "Default delivery destination"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Section (Consolidated Single Table - No Horizontal Scroll) */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Header & Filter Toolbar */}
        <div className="border-b border-slate-200 p-3 dark:border-slate-800 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
                <ShoppingBag className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-base">
                {isId ? "Riwayat Pesanan Pelanggan" : "Customer Order History"}
              </h3>
              <span className="rounded-md border border-[#034c85]/20 bg-[#034c85]/5 px-2 py-0.5 text-xs font-semibold text-[#034c85] dark:border-[#034c85]/40 dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
                {total}
              </span>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search Invoice */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  value={qInput}
                  onChange={(e) => setQInput(e.target.value)}
                  placeholder={isId ? "Cari nomor faktur..." : "Search invoice ID..."}
                  className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-7 text-xs text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-[#034c85]"
                />
                {qInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQInput("");
                      setQ("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={isId ? "Hapus pencarian" : "Clear search"}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </div>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {STATUS_FILTER_ITEMS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {isId ? item.labelId : item.labelEn}
                  </option>
                ))}
              </select>

              {/* Items Per Page */}
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / {isId ? "hal" : "page"}
                  </option>
                ))}
              </select>

              {(q || status) ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  title={isId ? "Atur ulang filter" : "Reset filters"}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{isId ? "Reset" : "Reset"}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Orders Table Container */}
        {customerOrdersQuery.isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#034c85] border-t-transparent" />
            <p className="mt-2">{isId ? "Memuat riwayat pesanan..." : "Loading order records..."}</p>
          </div>
        ) : customerOrdersQuery.isError ? (
          <div className="p-4 text-xs font-semibold text-rose-600 dark:text-rose-400">
            {customerOrdersQuery.error?.response?.data?.message ||
              (isId ? "Gagal memuat riwayat pesanan." : "Failed to load customer orders.")}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <p className="mt-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isId ? "Tidak ada pesanan ditemukan" : "No orders found"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              {isId ? "Coba sesuaikan kata kunci atau filter status Anda." : "Try adjusting your filter or search query."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (table-fixed w-full - ZERO Horizontal Scroll) */}
            <div className="hidden md:block w-full">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/60">
                  <tr>
                    <th className={`${tableHeadCell} w-[32%]`}>
                      {isId ? "Faktur / Invoice" : "Invoice"}
                    </th>
                    <th className={`${tableHeadCell} w-[20%]`}>
                      {isId ? "Tanggal" : "Date"}
                    </th>
                    <th className={`${tableHeadCell} w-[18%]`}>Total</th>
                    <th className={`${tableHeadCell} w-[18%]`}>Status</th>
                    <th className={`${tableHeadCell} w-[12%] text-right`}>
                      {isId ? "Aksi" : "Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {orders.map((order) => {
                    const invoice = orderInvoice(order);
                    const { dateStr, timeStr } = formatDateParts(order.createdAt, isId);

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                      >
                        {/* Invoice Column */}
                        <td className={tableCell}>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Link
                              to={`/admin/orders/${encodeURIComponent(order.invoiceNo || order.invoice || order.id)}`}
                              className="font-mono text-xs font-semibold text-slate-900 transition-colors hover:text-[#034c85] dark:text-slate-100 dark:hover:text-[#fe6f05] truncate"
                              title={invoice}
                            >
                              {invoice}
                            </Link>
                            <CopyInvoiceButton invoice={invoice} isId={isId} />
                          </div>
                        </td>

                        {/* Date Column */}
                        <td className={tableCell}>
                          <div className="text-xs text-slate-700 dark:text-slate-300">
                            <div>{dateStr}</div>
                            {timeStr ? (
                              <div className="text-[11px] text-slate-400">{timeStr}</div>
                            ) : null}
                          </div>
                        </td>

                        {/* Total Column */}
                        <td className={`${tableCell} font-semibold tabular-nums text-slate-900 dark:text-slate-100`}>
                          {formatCurrency(order.totalAmount || order.total || 0)}
                        </td>

                        {/* Status Column */}
                        <td className={tableCell}>
                          <OrderStatusBadge order={order} isId={isId} />
                        </td>

                        {/* Action Column */}
                        <td className={`${tableCell} text-right`}>
                          <Link
                            to={`/admin/orders/${encodeURIComponent(order.invoiceNo || order.invoice || order.id)}`}
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 transition hover:border-[#034c85] hover:bg-[#034c85]/10 hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#034c85] dark:hover:text-[#38bdf8]"
                            title={isId ? "Lihat rincian pesanan" : "View order details"}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{isId ? "Lihat" : "View"}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Feed View (< 768px) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {orders.map((order) => {
                const invoice = orderInvoice(order);
                const { dateStr, timeStr } = formatDateParts(order.createdAt, isId);

                return (
                  <div key={order.id} className="p-3.5 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Link
                            to={`/admin/orders/${encodeURIComponent(order.invoiceNo || order.invoice || order.id)}`}
                            className="font-mono text-xs font-bold text-slate-900 dark:text-white truncate"
                            title={invoice}
                          >
                            {invoice}
                          </Link>
                          <CopyInvoiceButton invoice={invoice} isId={isId} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {dateStr} {timeStr ? `• ${timeStr}` : ""}
                        </p>
                      </div>
                      <OrderStatusBadge order={order} isId={isId} />
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Total
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(order.totalAmount || order.total || 0)}
                        </span>
                      </div>

                      <Link
                        to={`/admin/orders/${encodeURIComponent(order.invoiceNo || order.invoice || order.id)}`}
                        className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>{isId ? "Lihat" : "View"}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {isId ? "Sebelumnya" : "Previous"}
              </button>

              <span className="text-slate-500 dark:text-slate-400">
                {isId ? "Halaman" : "Page"}{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">{page}</strong>{" "}
                {isId ? "dari" : "of"}{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</strong>
              </span>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page >= totalPages}
                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                {isId ? "Selanjutnya" : "Next"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
