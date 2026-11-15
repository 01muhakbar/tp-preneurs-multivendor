import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  PackageSearch,
  RotateCcw,
  Search,
  ShoppingBag,
  User,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchAdminCustomer,
  fetchAdminCustomerOrders,
} from "../../lib/adminApi.js";
import { ORDER_STATUS_OPTIONS } from "../../constants/orderStatus.js";
import { formatCurrency } from "../../utils/format.js";
import { getOrderTruthStatus } from "../../utils/orderTruth.js";

const STATUS_OPTIONS = ORDER_STATUS_OPTIONS;

const STATUS_STYLES = {
  pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  processing: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  cancelled: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  refunded: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  delivered: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  shipped: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  complete: "border-[#034c85]/20 bg-[#034c85]/10 text-[#034c85] dark:border-[#034c85]/40 dark:bg-[#034c85]/20 dark:text-[#38bdf8]",
  shipping: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
};

const tableHeadCell =
  "whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const tableCell = "px-4 py-3.5 align-middle text-sm text-slate-700 dark:text-slate-200";

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

const formatDate = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function OrderStatusBadge({ order, isId = false }) {
  const status = getOrderTruthStatus(order);
  const key = status.bucket;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
        STATUS_STYLES[key] || STATUS_STYLES.pending
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status.label}
    </span>
  );
}

function PaymentStatusBadge({ paymentStatus, isId = false }) {
  const raw = String(paymentStatus || "UNPAID").toUpperCase();
  const isPaid = raw === "PAID" || raw === "SETTLED" || raw === "COMPLETED";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
        isPaid
          ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
          : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isPaid ? "bg-emerald-500" : "bg-amber-500"}`} />
      {isPaid ? (isId ? "Sudah Dibayar" : "Paid") : (isId ? "Belum Dibayar" : "Unpaid")}
    </span>
  );
}

export default function AdminCustomerOrdersPage() {
  const { id } = useParams();
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

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

  // Compute 4 KPI stats
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

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(isId ? `${label} disalin!` : `${label} copied!`);
  };

  if (customerQuery.isLoading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#034c85] border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {isId ? "Memuat data pesanan pelanggan..." : "Loading customer orders..."}
          </p>
        </div>
      </div>
    );
  }

  if (customerQuery.isError) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
        <p className="font-bold">{isId ? "Gagal memuat pelanggan" : "Failed to load customer"}</p>
        <p className="mt-1 text-xs">
          {customerQuery.error?.response?.data?.message || (isId ? "Terjadi kesalahan pada server." : "Customer not found.")}
        </p>
        <Link
          to="/admin/customers"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isId ? "Kembali ke Pelanggan" : "Back to Customers"}</span>
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
        <p className="font-semibold text-slate-800 dark:text-slate-200">
          {isId ? "Pelanggan tidak ditemukan." : "Customer not found."}
        </p>
        <Link
          to="/admin/customers"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{isId ? "Kembali ke Pelanggan" : "Back to Customers"}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Customer Profile Header Banner */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#034c85] to-[#022e53] text-sm font-bold text-white shadow-md shadow-[#034c85]/20 sm:h-14 sm:w-14 sm:text-base">
              {getCustomerInitials(customer.name)}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Admin / {isId ? "Pelanggan" : "Customers"} / {isId ? "Pesanan" : "Orders"}
                </span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                {customer.name || (isId ? "Pelanggan" : "Customer")}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>{customer.email || "-"}</span>
                {customer.phone ? (
                  <>
                    <span>•</span>
                    <span>{customer.phone}</span>
                  </>
                ) : null}
                <span>•</span>
                <span className="font-mono font-semibold text-[#034c85] dark:text-[#38bdf8]">
                  ID #{customer.id}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Navigation */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/admin/customers"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{isId ? "Kembali ke Pelanggan" : "Back to Customers"}</span>
            </Link>
            <Link
              to={`/admin/customers/${encodeURIComponent(customer.id)}`}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#034c85]/20 bg-[#034c85]/5 px-3.5 text-xs font-semibold text-[#034c85] transition hover:bg-[#034c85]/10 dark:border-[#034c85]/40 dark:bg-[#034c85]/20 dark:text-[#38bdf8]"
            >
              <User className="h-3.5 w-3.5" />
              <span>{isId ? "Lihat Detail Profil" : "View Customer Detail"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 4 KPI Stat Cards for Customer */}
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
            <span>{isId ? "Seluruh transaksi akun" : "All account transactions"}</span>
          </div>
        </div>

        {/* Card 2: Total Spent */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Total Pengeluaran" : "Total Spent"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fe6f05]/10 text-[#fe6f05] dark:bg-[#fe6f05]/20 dark:text-[#fe6f05]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {formatCurrency(totalSpentAmount || 0)}
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
            <span>{isId ? "Transaksi sukses terkirim" : "Successfully delivered"}</span>
          </div>
        </div>

        {/* Card 4: Pending / In Progress */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Menunggu / Diproses" : "Pending / In Progress"}
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
            <span>{isId ? "Sedang berjalan/diproses" : "Active / awaiting fulfillment"}</span>
          </div>
        </div>
      </div>

      {/* Orders Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {/* Toolbar Bar */}
        <div className="border-b border-slate-200/90 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#034c85] dark:text-[#38bdf8]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                {isId ? "Daftar Pesanan" : "Orders"}
              </h3>
            </div>

            <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center lg:justify-end">
              {/* Search Invoice */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-[280px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={qInput}
                  onChange={(event) => setQInput(event.target.value)}
                  placeholder={isId ? "Cari nomor faktur..." : "Search invoice..."}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                />
                {qInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQInput("");
                      setQ("");
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Status Filter */}
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="">{isId ? "Semua Status" : "All Status"}</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>

              {/* Page Size */}
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>
                    {size} / {isId ? "halaman" : "page"}
                  </option>
                ))}
              </select>

              {(q || status) ? (
                <button
                  type="button"
                  onClick={() => {
                    setQInput("");
                    setQ("");
                    setStatus("");
                    setPage(1);
                  }}
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>{isId ? "Atur Ulang" : "Reset"}</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Count Info Header */}
        <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
          {isId ? "Menampilkan" : "Showing"}{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{orders.length}</span>{" "}
          {isId ? "dari" : "of"}{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span>{" "}
          {isId ? "data pesanan" : "order records"}
        </div>

        {/* Loading / Error / Empty / Table States */}
        {customerOrdersQuery.isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center p-8">
            <div className="text-center">
              <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-[#034c85] border-t-transparent" />
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                {isId ? "Memuat pesanan..." : "Loading orders..."}
              </p>
            </div>
          </div>
        ) : customerOrdersQuery.isError ? (
          <div className="p-6 text-center text-xs text-rose-600 dark:text-rose-400">
            {customerOrdersQuery.error?.response?.data?.message || (isId ? "Gagal memuat pesanan." : "Failed to load orders.")}
          </div>
        ) : orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
              <PackageSearch className="h-7 w-7" />
            </div>
            <p className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
              {isId ? "Pelanggan ini belum memiliki pesanan." : "This customer has no order yet."}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {isId
                ? "Aktivitas pesanan pelanggan akan muncul di sini setelah transaksi selesai."
                : "Customer order activity will appear here after checkout is completed."}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/60">
                  <tr>
                    <th className={`${tableHeadCell} w-[24%]`}>
                      {isId ? "Nomor Faktur" : "Invoice"}
                    </th>
                    <th className={`${tableHeadCell} w-[18%]`}>
                      {isId ? "Tanggal" : "Date"}
                    </th>
                    <th className={`${tableHeadCell} w-[20%]`}>
                      {isId ? "Total & Metode" : "Total & Method"}
                    </th>
                    <th className={`${tableHeadCell} w-[14%]`}>
                      {isId ? "Pembayaran" : "Payment"}
                    </th>
                    <th className={`${tableHeadCell} w-[14%]`}>
                      {isId ? "Status Pesanan" : "Order Status"}
                    </th>
                    <th className={`${tableHeadCell} w-[10%] text-right`}>
                      {isId ? "Aksi" : "Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {orders.map((order) => {
                    const invoice = orderInvoice(order);
                    const invoiceUrl = `/admin/orders/${encodeURIComponent(order.invoiceNo || order.invoice || order.id)}`;

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                      >
                        {/* Invoice & Copy */}
                        <td className={tableCell}>
                          <div className="flex items-center gap-1.5">
                            <Link
                              to={invoiceUrl}
                              className="font-mono text-xs font-bold text-[#034c85] hover:underline dark:text-[#38bdf8]"
                            >
                              {invoice}
                            </Link>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(invoice, "Invoice")}
                              className="rounded p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title={isId ? "Salin nomor faktur" : "Copy invoice"}
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </td>

                        {/* Date */}
                        <td className={`${tableCell} whitespace-nowrap text-xs text-slate-600 dark:text-slate-400`}>
                          {formatDate(order.createdAt, isId)}
                        </td>

                        {/* Total & Method */}
                        <td className={tableCell}>
                          <div className="space-y-0.5">
                            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                              {formatCurrency(order.totalAmount || order.total || 0)}
                            </span>
                            {order.paymentMethod ? (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {order.paymentMethod}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td className={tableCell}>
                          <PaymentStatusBadge paymentStatus={order.paymentStatus} isId={isId} />
                        </td>

                        {/* Order Truth Status */}
                        <td className={tableCell}>
                          <OrderStatusBadge order={order} isId={isId} />
                        </td>

                        {/* Action Link */}
                        <td className={`${tableCell} text-right`}>
                          <Link
                            to={invoiceUrl}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:border-[#034c85] hover:bg-[#034c85]/10 hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#034c85] dark:hover:text-[#38bdf8]"
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
                const invoiceUrl = `/admin/orders/${encodeURIComponent(order.invoiceNo || order.invoice || order.id)}`;

                return (
                  <div key={order.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={invoiceUrl}
                          className="font-mono text-xs font-bold text-[#034c85] dark:text-[#38bdf8] hover:underline"
                        >
                          {invoice}
                        </Link>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(invoice, "Invoice")}
                          className="p-1 text-slate-400 hover:text-slate-600"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {formatCurrency(order.totalAmount || order.total || 0)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span>{formatDate(order.createdAt, isId)}</span>
                      {order.paymentMethod ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">
                          {order.paymentMethod}
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <PaymentStatusBadge paymentStatus={order.paymentStatus} isId={isId} />
                        <OrderStatusBadge order={order} isId={isId} />
                      </div>
                      <Link
                        to={invoiceUrl}
                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">
                {isId ? "Halaman" : "Page"}{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">{page}</strong>{" "}
                {isId ? "dari" : "of"}{" "}
                <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {isId ? "Sebelumnya" : "Previous"}
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {isId ? "Selanjutnya" : "Next"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
