import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Eye,
  Filter,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "../auth/useAuth.js";
import { can } from "../constants/permissions.js";
import {
  exportAdminCustomers,
  fetchAdminCustomers,
  importAdminCustomers,
  updateAdminCustomer,
} from "../lib/adminApi.js";
import { api } from "../api/axios.ts";
import DeleteCouponModal from "../components/admin/coupons/DeleteCouponModal.jsx";
import { UiErrorState, UiSkeleton } from "../components/primitives/state/index.js";
import { GENERIC_ERROR } from "../constants/uiMessages.js";

const tableHeadCell =
  "whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400";
const tableCell = "px-4 py-3 align-middle text-sm text-slate-700 dark:text-slate-200";

const customerStatusOptions = [
  { value: "active", labelEn: "Active", labelId: "Aktif" },
  { value: "inactive", labelEn: "Disabled", labelId: "Nonaktif" },
  { value: "blocked", labelEn: "Blocked", labelId: "Diblokir" },
  { value: "pending_verification", labelEn: "Pending verification", labelId: "Menunggu Verifikasi" },
];

const toText = (value) => String(value ?? "").trim();

const formatJoinDate = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getCustomerName = (customer) => toText(customer?.name) || "-";
const getCustomerEmail = (customer) => toText(customer?.email) || "-";
const getCustomerPhone = (customer) =>
  toText(customer?.phone || customer?.phoneNumber || customer?.phone_number) || "-";
const getCustomerId = (customer) => customer?.id || null;
const getShortId = (customer) => {
  const raw = toText(getCustomerId(customer));
  return raw ? (raw.length <= 6 ? raw : raw.slice(0, 6).toUpperCase()) : "-";
};
const getCustomerStatus = (customer) => {
  const raw = toText(customer?.status).toLowerCase();
  if (["active", "inactive", "blocked", "pending_verification"].includes(raw)) return raw;
  return "active";
};
const getOrderCount = (customer) => Number(customer?.ordersCount || 0);

const getCustomerInitials = (name) => {
  const clean = String(name || "").trim();
  if (!clean || clean === "-") return "C";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

function CustomerStatusBadge({ status, isId = false }) {
  const styles = {
    active:
      "border-[#034c85]/20 bg-[#034c85]/10 text-[#034c85] dark:border-[#034c85]/40 dark:bg-[#034c85]/25 dark:text-[#38bdf8]",
    inactive:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    blocked:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
    pending_verification:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  };
  const dots = {
    active: "bg-[#034c85] dark:bg-[#38bdf8]",
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
      className={`inline-flex min-h-6 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
        styles[status] || styles.active
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] || dots.active}`} />
      {labels[status] || (isId ? "Aktif" : "Active")}
    </span>
  );
}

function StatusSwitch({ checked, disabled, onClick, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#034c85]/30 ${
        checked
          ? "bg-[#034c85] shadow-[0_0_8px_rgba(3,76,133,0.35)]"
          : "bg-slate-300 dark:bg-slate-700"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

const emptyEditForm = { name: "", email: "", phone: "", status: "active" };

export default function Customers() {
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");
  const qc = useQueryClient();
  const { user } = useAuth() || {};
  const canMutateCustomers = can(user, "CUSTOMERS_UPDATE");
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [rowError, setRowError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState(null);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteModalError, setDeleteModalError] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editFieldErrors, setEditFieldErrors] = useState({});
  const [editError, setEditError] = useState("");

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const params = useMemo(
    () => ({ page, limit: 10, q: appliedSearch || undefined }),
    [page, appliedSearch]
  );

  const customersQuery = useQuery({
    queryKey: ["admin-customers", params],
    queryFn: () => fetchAdminCustomers(params),
    keepPreviousData: true,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { data } = await api.delete(`/admin/customers/${id}`);
      return data;
    },
    onSuccess: () => {
      setDeleteModalError("");
      setRowError("");
      setNotice(isId ? "Pelanggan berhasil dihapus." : "Customer deleted successfully.");
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload, meta }) =>
      updateAdminCustomer(id, payload).then((data) => ({ data, meta, id })),
    onSuccess: ({ meta, id }) => {
      setPendingStatusId(null);
      setEditError("");
      setEditFieldErrors({});
      setRowError("");
      setNotice(
        meta === "toggle"
          ? isId
            ? "Status akun pelanggan diperbarui."
            : "Customer account status updated."
          : isId
            ? "Data pelanggan berhasil diperbarui."
            : "Customer updated successfully."
      );
      if (meta !== "toggle") {
        setIsEditOpen(false);
        setEditTarget(null);
      }
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
      qc.invalidateQueries({ queryKey: ["admin-customer", String(id)] });
    },
    onError: (error, variables) => {
      const message = error?.response?.data?.message || (isId ? "Terjadi kesalahan." : GENERIC_ERROR);
      if (variables?.meta === "toggle") {
        setPendingStatusId(null);
        setRowError(message);
        return;
      }
      setEditFieldErrors(error?.response?.data?.errors?.fieldErrors || {});
      setEditError(message);
    },
    onSettled: (_, __, variables) => {
      if (variables?.meta === "toggle") setPendingStatusId(null);
    },
  });

  const importMutation = useMutation({
    mutationFn: (file) => importAdminCustomers(file),
    onSuccess: (payload) => {
      const data = payload?.data || payload || {};
      const updated = Number(data.updated || 0);
      const skipped = Number(data.skipped || 0);
      const failed = Number(data.failed || 0);
      setNotice(
        isId
          ? `Impor pelanggan selesai: ${updated} diperbarui, ${skipped} dilewati, ${failed} gagal.`
          : `Customer import finished: ${updated} updated, ${skipped} skipped, ${failed} failed.`
      );
      setRowError(Array.isArray(data.errors) ? data.errors[0]?.message || "" : "");
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
    onError: (error) => {
      setRowError(error?.response?.data?.message || error?.message || (isId ? "Gagal mengimpor pelanggan." : GENERIC_ERROR));
    },
  });

  const items = Array.isArray(customersQuery.data?.data) ? customersQuery.data.data : [];
  const meta = customersQuery.data?.meta || { page, totalPages: 1, total: 0 };
  const totalPages = Math.max(1, Number(meta.totalPages || 1));

  const openEdit = (customer) => {
    if (!customer?.id || !canMutateCustomers) return;
    setEditTarget(customer);
    setEditError("");
    setEditFieldErrors({});
    setEditForm({
      name: getCustomerName(customer) === "-" ? "" : getCustomerName(customer),
      email: getCustomerEmail(customer) === "-" ? "" : getCustomerEmail(customer),
      phone: getCustomerPhone(customer) === "-" ? "" : getCustomerPhone(customer),
      status: getCustomerStatus(customer),
    });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    if (updateMutation.isPending) return;
    setIsEditOpen(false);
    setEditTarget(null);
    setEditError("");
    setEditFieldErrors({});
    setEditForm(emptyEditForm);
  };

  const submitEdit = (event) => {
    event.preventDefault();
    if (!editTarget?.id) return;
    setEditError("");
    setEditFieldErrors({});
    updateMutation.mutate({
      id: editTarget.id,
      payload: {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim() || null,
        status: editForm.status,
      },
      meta: "edit",
    });
  };

  const toggleStatus = (customer) => {
    const id = getCustomerId(customer);
    const status = getCustomerStatus(customer);
    if (!id || !canMutateCustomers || pendingStatusId === id) return;
    if (!["active", "inactive"].includes(status)) return;
    setRowError("");
    setPendingStatusId(id);
    updateMutation.mutate({
      id,
      payload: { status: status === "active" ? "inactive" : "active" },
      meta: "toggle",
    });
  };

  const downloadExport = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    setRowError("");
    try {
      const response = await exportAdminCustomers({ q: appliedSearch || undefined });
      const blob = await response.blob();
      const href = URL.createObjectURL(blob);
      const disposition = response.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="?([^"]+)"?/i)?.[1] || "customers-export.json";
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(href);
      setNotice(
        isId
          ? `Ekspor pelanggan diunduh sebagai ${filename}.`
          : `Customers export downloaded as ${filename}.`
      );
    } catch (error) {
      setRowError(error?.message || (isId ? "Gagal mengunduh ekspor pelanggan." : GENERIC_ERROR));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) importMutation.mutate(file);
        }}
      />

      {/* Header Card */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isId ? "Pelanggan" : "Customers"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {isId
              ? "Kelola akun pelanggan dan akses pesanan."
              : "Manage customer accounts and order access."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#034c85]/20 bg-[#034c85]/5 px-3 py-1.5 text-xs font-semibold text-[#034c85] dark:border-[#034c85]/40 dark:bg-[#034c85]/20 dark:text-slate-200">
            <span className="h-2 w-2 rounded-full bg-[#fe6f05]" />
            <span>{isId ? "Total Pelanggan:" : "Total Customers:"}</span>
            <span className="font-bold text-[#fe6f05]">{Number(meta.total || items.length)}</span>
          </div>
        </div>
      </div>

      {/* Search and Action Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center md:justify-between">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setAppliedSearch(searchInput.trim());
                  setPage(1);
                }
              }}
              placeholder={
                isId
                  ? "Cari nama, email, atau no. telepon..."
                  : "Search by name, email, or phone..."
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-sm text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:border-[#034c85]"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label={isId ? "Hapus pencarian" : "Clear search"}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAppliedSearch(searchInput.trim());
                setPage(1);
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#034c85] px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#023b68] active:scale-[0.98]"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{isId ? "Filter" : "Filter"}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                setAppliedSearch("");
                setPage(1);
              }}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isId ? "Atur Ulang" : "Reset"}</span>
            </button>

            <button
              type="button"
              onClick={downloadExport}
              disabled={isDownloading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-[#fe6f05] hover:text-[#fe6f05] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
            >
              <Download className="h-3.5 w-3.5" />
              <span>
                {isDownloading
                  ? isId
                    ? "Mengunduh..."
                    : "Downloading..."
                  : isId
                    ? "Ekspor"
                    : "Export"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canMutateCustomers || importMutation.isPending}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 transition hover:border-[#034c85] hover:text-[#034c85] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#034c85] dark:hover:text-[#034c85]"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>
                {importMutation.isPending
                  ? isId
                    ? "Mengimpor..."
                    : "Importing..."
                  : isId
                    ? "Impor"
                    : "Import"}
              </span>
            </button>

            {customersQuery.isFetching ? (
              <span className="text-[11px] font-medium text-slate-400">
                {isId ? "Memperbarui..." : "Updating..."}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Notifications and Alerts */}
      {notice ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          {notice}
        </div>
      ) : null}
      {rowError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300">
          {rowError}
        </div>
      ) : null}

      {/* Loading & Error States */}
      {customersQuery.isLoading && !customersQuery.data ? <UiSkeleton variant="table" rows={8} /> : null}
      {customersQuery.isError && !customersQuery.data ? (
        <UiErrorState
          title={isId ? "Gagal Memuat Data" : "Failed to Load Data"}
          message={customersQuery.error?.response?.data?.message || (isId ? "Terjadi kesalahan pada sistem." : GENERIC_ERROR)}
          onRetry={customersQuery.refetch}
        />
      ) : null}

      {/* Empty State */}
      {!customersQuery.isLoading && !customersQuery.isError && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            {isId ? "Pelanggan tidak ditemukan" : "No customers found"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isId
              ? "Coba gunakan kata kunci lain atau atur ulang pencarian Anda."
              : "Try another keyword or reset your search."}
          </p>
        </div>
      ) : null}

      {/* Table Data */}
      {!customersQuery.isLoading && !customersQuery.isError && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            <span>
              {isId
                ? `Menampilkan ${items.length} dari ${Number(meta.total || items.length)} pelanggan`
                : `Showing ${items.length} of ${Number(meta.total || items.length)} customers`}
            </span>
            {appliedSearch ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#034c85]/10 px-2 py-0.5 text-[11px] font-medium text-[#034c85] dark:bg-[#034c85]/30 dark:text-[#38bdf8]">
                {isId ? "Pencarian:" : "Search:"} "{appliedSearch}"
              </span>
            ) : null}
          </div>

          <div className="-mx-3 w-auto overflow-x-auto px-3 pb-1 md:mx-0 md:w-full md:px-0">
            <table className="w-full min-w-[1020px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/60">
                <tr>
                  <th className={`${tableHeadCell} w-[8%]`}>ID</th>
                  <th className={`${tableHeadCell} w-[14%]`}>
                    {isId ? "Tanggal Bergabung" : "Joining Date"}
                  </th>
                  <th className={`${tableHeadCell} w-[22%]`}>
                    {isId ? "Nama" : "Name"}
                  </th>
                  <th className={`${tableHeadCell} w-[22%]`}>Email</th>
                  <th className={`${tableHeadCell} w-[14%]`}>
                    {isId ? "No. Telepon" : "Phone"}
                  </th>
                  <th className={`${tableHeadCell} w-[10%]`}>Status</th>
                  <th className={`${tableHeadCell} w-[10%] text-right`}>
                    {isId ? "Aksi" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {items.map((customer) => {
                  const id = getCustomerId(customer);
                  const status = getCustomerStatus(customer);
                  const canToggle = canMutateCustomers && ["active", "inactive"].includes(status);
                  const name = getCustomerName(customer);

                  return (
                    <tr
                      key={id || `${name}-${getCustomerEmail(customer)}`}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                    >
                      <td className={tableCell}>
                        <span className="rounded-md border border-slate-200/80 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {getShortId(customer)}
                        </span>
                      </td>
                      <td className={`${tableCell} whitespace-nowrap text-xs text-slate-600 dark:text-slate-400`}>
                        {formatJoinDate(customer?.createdAt, isId)}
                      </td>
                      <td className={tableCell}>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#034c85] to-[#022e53] text-[11px] font-bold text-white shadow-sm shadow-[#034c85]/20">
                            {getCustomerInitials(name)}
                          </div>
                          <div className="min-w-0">
                            {id ? (
                              <Link
                                to={`/admin/customers/${id}`}
                                className="block truncate font-semibold text-slate-900 transition-colors hover:text-[#034c85] dark:text-slate-100 dark:hover:text-[#fe6f05]"
                              >
                                {name}
                              </Link>
                            ) : (
                              <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">
                                {name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={`${tableCell} text-xs text-slate-600 dark:text-slate-400`}>
                        {getCustomerEmail(customer)}
                      </td>
                      <td className={`${tableCell} whitespace-nowrap text-xs text-slate-600 dark:text-slate-400`}>
                        {getCustomerPhone(customer)}
                      </td>
                      <td className={tableCell}>
                        <CustomerStatusBadge status={status} isId={isId} />
                      </td>
                      <td className={`${tableCell} text-right`}>
                        <div className="flex items-center justify-end gap-1.5">
                          {id ? (
                            <Link
                              to={`/admin/customer-orders/${id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#034c85] hover:bg-[#034c85]/10 hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-[#034c85] dark:hover:text-[#38bdf8]"
                              title={
                                isId
                                  ? `Lihat daftar pesanan (${getOrderCount(customer)} pesanan)`
                                  : `View order list (${getOrderCount(customer)} orders)`
                              }
                              aria-label={isId ? "Lihat pesanan" : "View orders"}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => openEdit(customer)}
                            disabled={!canMutateCustomers || !id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#034c85] hover:bg-[#034c85]/10 hover:text-[#034c85] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-[#034c85] dark:hover:text-[#38bdf8]"
                            title={isId ? "Edit data pelanggan" : "Edit customer"}
                            aria-label={isId ? "Edit data pelanggan" : "Edit customer"}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(customer);
                              setDeleteModalError("");
                            }}
                            disabled={!canMutateCustomers || !id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                            title={isId ? "Hapus pelanggan" : "Delete customer"}
                            aria-label={isId ? "Hapus pelanggan" : "Delete customer"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>

                          <StatusSwitch
                            checked={status === "active"}
                            disabled={!canToggle || pendingStatusId === id}
                            onClick={() => toggleStatus(customer)}
                            title={
                              canToggle
                                ? `${status === "active" ? (isId ? "Nonaktifkan" : "Disable") : (isId ? "Aktifkan" : "Activate")} ${name}`
                                : `${isId ? "Pergantian status tidak tersedia untuk" : "Status toggle unavailable for"} ${status.replace(/_/g, " ")}`
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Pagination Footer */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-2 text-xs shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <button
          type="button"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          disabled={meta.page <= 1}
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
        >
          {isId ? "Sebelumnya" : "Previous"}
        </button>

        <span className="text-slate-500 dark:text-slate-400">
          {isId ? "Halaman" : "Page"}{" "}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">{meta.page}</strong>{" "}
          {isId ? "dari" : "of"}{" "}
          <strong className="font-semibold text-slate-800 dark:text-slate-200">{totalPages}</strong>
        </span>

        <button
          type="button"
          className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          disabled={meta.page >= totalPages}
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
        >
          {isId ? "Selanjutnya" : "Next"}
        </button>
      </div>

      {/* Edit Drawer */}
      {isEditOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[1px]"
            onClick={closeEdit}
            aria-label={isId ? "Tutup panel edit pelanggan" : "Close update customer drawer"}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-[620px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    {isId ? "Admin / Pelanggan / Edit" : "Admin / Customers / Edit"}
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {isId ? "Perbarui Pelanggan" : "Update Customer"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  disabled={updateMutation.isPending}
                  aria-label={isId ? "Tutup" : "Close"}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <form onSubmit={submitEdit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {[
                  [isId ? "Nama Lengkap" : "Name", "name"],
                  [isId ? "Alamat Email" : "Email", "email"],
                  [isId ? "No. Telepon" : "Phone", "phone"],
                ].map(([label, key]) => (
                  <div key={key} className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {label}
                    </label>
                    <input
                      type={key === "email" ? "email" : "text"}
                      value={editForm[key]}
                      onChange={(event) => {
                        setEditForm((prev) => ({ ...prev, [key]: event.target.value }));
                        setEditFieldErrors((prev) => ({ ...prev, [key]: "" }));
                      }}
                      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-[#034c85]"
                      disabled={updateMutation.isPending}
                    />
                    {editFieldErrors[key] ? (
                      <p className="text-xs font-medium text-rose-600">{editFieldErrors[key]}</p>
                    ) : null}
                  </div>
                ))}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isId ? "Status Akun" : "Account Status"}
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, status: event.target.value }));
                      setEditFieldErrors((prev) => ({ ...prev, status: "" }));
                    }}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-[#034c85]"
                    disabled={updateMutation.isPending}
                  >
                    {customerStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {isId ? option.labelId : option.labelEn}
                      </option>
                    ))}
                  </select>
                  {editFieldErrors.status ? (
                    <p className="text-xs font-medium text-rose-600">{editFieldErrors.status}</p>
                  ) : null}
                </div>

                {editError && !Object.keys(editFieldErrors).length ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    {editError}
                  </div>
                ) : null}
              </div>

              <footer className="sticky bottom-0 border-t border-slate-200 bg-white/95 px-6 py-4 dark:border-slate-800 dark:bg-slate-900/95">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    disabled={updateMutation.isPending}
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-[#034c85] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#023b68] disabled:opacity-70"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending
                      ? isId
                        ? "Menyimpan..."
                        : "Saving..."
                      : isId
                        ? "Simpan Perubahan"
                        : "Save Changes"}
                  </button>
                </div>
              </footer>
            </form>
          </aside>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      <DeleteCouponModal
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteTarget(null);
            setDeleteModalError("");
          }
        }}
        onConfirm={async () => {
          if (!deleteTarget?.id) return;
          setDeleteModalError("");
          setRowError("");
          try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          } catch (error) {
            const message =
              error?.response?.data?.message ||
              (isId ? "Gagal menghapus pelanggan." : GENERIC_ERROR);
            setDeleteModalError(message);
            setRowError(message);
          }
        }}
        title={isId ? "Hapus Pelanggan?" : "Delete Customer?"}
        description={
          isId
            ? `Apakah Anda yakin ingin menghapus pelanggan "${deleteTarget?.name || deleteTarget?.email || "ini"}"? Tindakan ini tidak dapat dibatalkan.`
            : `Are you sure you want to delete customer "${deleteTarget?.name || deleteTarget?.email || "this customer"}"? This action cannot be undone.`
        }
        cancelLabel={isId ? "Batal" : "Cancel"}
        confirmLabel={isId ? "Hapus" : "Delete"}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteModalError}
      />
    </div>
  );
}
