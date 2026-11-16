import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Download,
  Eye,
  Filter,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Upload,
  User,
  UserCheck,
  Users,
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
  "px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none";
const tableCell = "px-4 py-3.5 align-middle text-sm text-slate-700 dark:text-slate-200";

const customerStatusOptions = [
  { value: "active", labelEn: "Active", labelId: "Aktif" },
  { value: "inactive", labelEn: "Disabled", labelId: "Nonaktif" },
  { value: "blocked", labelEn: "Blocked", labelId: "Diblokir" },
  { value: "pending_verification", labelEn: "Pending verification", labelId: "Menunggu Verifikasi" },
];

const customerRoleOptions = [
  { value: "", labelEn: "All Roles", labelId: "Semua Peran" },
  { value: "customer", labelEn: "Customer", labelId: "Pelanggan" },
  { value: "user", labelEn: "Buyer", labelId: "Pembeli" },
  { value: "seller", labelEn: "Seller", labelId: "Penjual" },
  { value: "staff", labelEn: "Staff", labelId: "Staf" },
  { value: "admin", labelEn: "Admin", labelId: "Admin" },
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
const getCustomerRole = (customer) => toText(customer?.role || "user").toLowerCase();
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
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-300",
    inactive:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400",
    blocked:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-300",
    pending_verification:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-300",
  };
  const dots = {
    active: "bg-emerald-500",
    inactive: "bg-slate-400",
    blocked: "bg-rose-500",
    pending_verification: "bg-amber-500 animate-pulse",
  };
  const labels = {
    active: isId ? "Aktif" : "Active",
    inactive: isId ? "Nonaktif" : "Disabled",
    blocked: isId ? "Diblokir" : "Blocked",
    pending_verification: isId ? "Menunggu" : "Pending",
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

  const qc = useQueryClient();
  const { user } = useAuth() || {};
  const canMutateCustomers = can(user, "CUSTOMERS_UPDATE");
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
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

  // Close drawer on Escape key press
  useEffect(() => {
    if (!isEditOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !updateMutation.isPending) {
        closeEdit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditOpen]);

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      q: appliedSearch || undefined,
      status: statusFilter || undefined,
      role: roleFilter || undefined,
    }),
    [page, appliedSearch, statusFilter, roleFilter]
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
          ? `Impor selesai: ${updated} diperbarui, ${skipped} dilewati, ${failed} gagal.`
          : `Import finished: ${updated} updated, ${skipped} skipped, ${failed} failed.`
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

  const kpis = meta?.kpis || null;
  const totalCustomersCount = kpis?.totalCustomers ?? Number(meta.total || items.length);
  const activeCustomersCount =
    kpis?.activeCustomers ?? items.filter((c) => getCustomerStatus(c) === "active").length;
  const totalOrdersPlacedCount =
    kpis?.totalOrdersPlaced ?? items.reduce((acc, c) => acc + getOrderCount(c), 0);
  const pendingOrDisabledCount =
    kpis?.pendingOrDisabled ?? items.filter((c) => getCustomerStatus(c) !== "active").length;

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

    const trimmedName = editForm.name.trim();
    const trimmedEmail = editForm.email.trim();
    const errors = {};
    if (!trimmedName) {
      errors.name = isId ? "Nama lengkap wajib diisi." : "Full name is required.";
    }
    if (!trimmedEmail) {
      errors.email = isId ? "Alamat email wajib diisi." : "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = isId ? "Format email tidak valid." : "Invalid email format.";
    }

    if (Object.keys(errors).length > 0) {
      setEditFieldErrors(errors);
      return;
    }

    updateMutation.mutate({
      id: editTarget.id,
      payload: {
        name: trimmedName,
        email: trimmedEmail,
        phone: editForm.phone.trim() || null,
        status: editForm.status,
      },
      meta: "edit",
    });
  };

  const toggleStatus = (customer) => {
    const id = getCustomerId(customer);
    if (!id || !canMutateCustomers || pendingStatusId === id) return;
    const current = getCustomerStatus(customer);
    if (!["active", "inactive"].includes(current)) return;
    const nextStatus = current === "active" ? "inactive" : "active";
    setPendingStatusId(id);
    updateMutation.mutate({
      id,
      payload: { status: nextStatus },
      meta: "toggle",
    });
  };

  const downloadExport = async () => {
    try {
      setIsDownloading(true);
      setRowError("");
      const res = await exportAdminCustomers({
        q: appliedSearch || undefined,
        status: statusFilter || undefined,
        role: roleFilter || undefined,
      });
      const disposition = res.headers.get("content-disposition") || "";
      const filename = disposition.match(/filename="?([^"]+)"?/i)?.[1] || "customers-export.json";
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setRowError(error?.message || (isId ? "Gagal mengunduh berkas ekspor." : GENERIC_ERROR));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setAppliedSearch("");
    setStatusFilter("");
    setRoleFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-5">
      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) importMutation.mutate(file);
        }}
      />

      {/* Header Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Admin / {isId ? "Pelanggan" : "Customers"}
            </span>
          </div>
          <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {isId ? "Pelanggan" : "Customers"}
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {isId
              ? "Kelola akun pelanggan, riwayat transaksi, dan status akses."
              : "Manage customer accounts, order history, and access status."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#034c85]/20 bg-[#034c85]/5 px-3 py-1.5 text-xs font-semibold text-[#034c85] dark:border-[#034c85]/40 dark:bg-[#034c85]/20 dark:text-slate-200">
            <span className="h-2 w-2 rounded-full bg-[#fe6f05]" />
            <span>{isId ? "Total Akun:" : "Total Accounts:"}</span>
            <span className="font-bold text-[#fe6f05]">{totalCustomersCount}</span>
          </div>
        </div>
      </div>

      {/* 4 KPI Summary Cards (Refined with Top Accent Borders) */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Card 1: Total Customers */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 border-t-2 border-t-[#034c85] bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:border-t-[#034c85] dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Total Pelanggan" : "Total Customers"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {totalCustomersCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#034c85]" />
            <span>{isId ? "Akun terdaftar" : "Registered accounts"}</span>
          </div>
        </div>

        {/* Card 2: Active Customers */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 border-t-2 border-t-emerald-500 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:border-t-emerald-500 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Pelanggan Aktif" : "Active Customers"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {activeCustomersCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>{isId ? "Status aktif" : "Active status"}</span>
          </div>
        </div>

        {/* Card 3: Total Orders Placed */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 border-t-2 border-t-[#fe6f05] bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:border-t-[#fe6f05] dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Total Pesanan" : "Total Orders"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fe6f05]/10 text-[#fe6f05] dark:bg-[#fe6f05]/20 dark:text-[#fe6f05]">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {totalOrdersPlacedCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-[#fe6f05]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#fe6f05]" />
            <span>{isId ? "Seluruh transaksi" : "All transactions"}</span>
          </div>
        </div>

        {/* Card 4: Pending / Disabled */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 border-t-2 border-t-amber-500 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:border-t-amber-500 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isId ? "Menunggu / Nonaktif" : "Pending / Disabled"}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {pendingOrDisabledCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>{isId ? "Perlu tinjauan" : "Needs review"}</span>
          </div>
        </div>
      </div>

      {/* Search and Action Toolbar */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative min-w-[220px] flex-1">
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
                  onClick={() => {
                    setSearchInput("");
                    setAppliedSearch("");
                    setPage(1);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={isId ? "Hapus pencarian" : "Clear search"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="">{isId ? "Semua Status" : "All Status"}</option>
              {customerStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isId ? opt.labelId : opt.labelEn}
                </option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {customerRoleOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {isId ? opt.labelId : opt.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setAppliedSearch(searchInput.trim());
                setPage(1);
              }}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#034c85] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#023b68] active:scale-[0.98]"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{isId ? "Filter" : "Filter"}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isId ? "Atur Ulang" : "Reset"}</span>
            </button>

            <button
              type="button"
              onClick={downloadExport}
              disabled={isDownloading}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-[#fe6f05] hover:text-[#fe6f05] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
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
              disabled={importMutation.isPending || !canMutateCustomers}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition hover:border-[#034c85] hover:text-[#034c85] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#034c85] dark:hover:text-[#38bdf8]"
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
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {notice ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice("")}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {rowError ? (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <span>{rowError}</span>
          <button
            type="button"
            onClick={() => setRowError("")}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {/* Loading & Error States */}
      {customersQuery.isLoading && !customersQuery.data ? <UiSkeleton variant="table" rows={8} /> : null}
      {customersQuery.isError && !customersQuery.data ? (
        <UiErrorState
          title={isId ? "Gagal memuat pelanggan" : "Failed to load customers"}
          message={customersQuery.error?.response?.data?.message || (isId ? "Terjadi kesalahan pada sistem." : GENERIC_ERROR)}
          onRetry={customersQuery.refetch}
        />
      ) : null}

      {/* Empty State */}
      {!customersQuery.isLoading && !customersQuery.isError && items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
            <Users className="h-7 w-7" />
          </div>
          <p className="mt-4 text-base font-semibold text-slate-800 dark:text-slate-200">
            {isId ? "Pelanggan tidak ditemukan" : "No customers found"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isId
              ? "Coba gunakan kata kunci lain atau atur ulang pencarian Anda."
              : "Try another keyword or reset your search."}
          </p>
        </div>
      ) : null}

      {/* Data Container: Desktop Table (No Horizontal Scroll) + Mobile Cards */}
      {!customersQuery.isLoading && !customersQuery.isError && items.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Header Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            <span>
              {isId
                ? `Menampilkan ${items.length} dari ${Number(meta.total || items.length)} pelanggan`
                : `Showing ${items.length} of ${Number(meta.total || items.length)} customers`}
            </span>
            <div className="flex items-center gap-2">
              {appliedSearch ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#034c85]/10 px-2 py-0.5 text-[11px] font-medium text-[#034c85] dark:bg-[#034c85]/30 dark:text-[#38bdf8]">
                  "{appliedSearch}"
                </span>
              ) : null}
              {roleFilter ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                  {roleFilter}
                </span>
              ) : null}
            </div>
          </div>

          {/* Desktop Consolidated 5-Column Table (Guaranteed 100% Fit, Zero Horizontal Scroll) */}
          <div className="hidden md:block w-full">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-800/60">
                <tr>
                  <th className={`${tableHeadCell} w-[32%]`}>
                    {isId ? "Pelanggan" : "Customer"}
                  </th>
                  <th className={`${tableHeadCell} w-[26%]`}>
                    {isId ? "Kontak" : "Contact"}
                  </th>
                  <th className={`${tableHeadCell} w-[14%]`}>
                    {isId ? "Pesanan" : "Orders"}
                  </th>
                  <th className={`${tableHeadCell} w-[14%]`}>Status</th>
                  <th className={`${tableHeadCell} w-[14%] text-right`}>
                    {isId ? "Aksi" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {items.map((customer) => {
                  const id = getCustomerId(customer);
                  const status = getCustomerStatus(customer);
                  const role = getCustomerRole(customer);
                  const canToggle = canMutateCustomers && ["active", "inactive"].includes(status);
                  const name = getCustomerName(customer);
                  const orderCount = getOrderCount(customer);

                  return (
                    <tr
                      key={id || `${name}-${getCustomerEmail(customer)}`}
                      className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/50"
                    >
                      {/* Column 1: Customer (Luminous Avatar, Name, Role badge, #ID, Joined Date) */}
                      <td className={tableCell}>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#034c85]/40 bg-gradient-to-br from-[#034c85] to-[#0a4d80] text-xs font-bold text-white shadow-sm shadow-[#034c85]/25 ring-1 ring-white/10 dark:from-[#034c85] dark:to-[#023b68]">
                            {getCustomerInitials(name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {id ? (
                                <Link
                                  to={`/admin/customers/${id}`}
                                  className="truncate font-semibold text-slate-900 transition-colors hover:text-[#034c85] dark:text-slate-100 dark:hover:text-[#fe6f05]"
                                  title={name}
                                >
                                  {name}
                                </Link>
                              ) : (
                                <span className="truncate font-semibold text-slate-900 dark:text-slate-100">
                                  {name}
                                </span>
                              )}
                              <RoleBadge role={role} />
                            </div>
                            <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="rounded bg-[#034c85]/10 px-1.5 py-0.2 font-mono font-bold text-[#034c85] dark:bg-[#034c85]/25 dark:text-[#38bdf8]">
                                #{getShortId(customer)}
                              </span>
                              <span>•</span>
                              <span>{formatJoinDate(customer?.createdAt, isId)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Contact (Email & Phone with Clickable Links) */}
                      <td className={tableCell}>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-800 dark:text-slate-200" title={getCustomerEmail(customer)}>
                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                            <a
                              href={`mailto:${getCustomerEmail(customer)}`}
                              className="truncate hover:text-[#034c85] dark:hover:text-[#38bdf8] transition-colors"
                            >
                              {getCustomerEmail(customer)}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                            {getCustomerPhone(customer) !== "-" ? (
                              <a
                                href={`tel:${getCustomerPhone(customer)}`}
                                className="truncate hover:text-[#034c85] dark:hover:text-[#38bdf8] transition-colors"
                              >
                                {getCustomerPhone(customer)}
                              </a>
                            ) : (
                              <span className="truncate">-</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Orders (Clickable pill linking to customer orders) */}
                      <td className={tableCell}>
                        {id ? (
                          <Link
                            to={`/admin/customer-orders/${id}`}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition hover:scale-[1.02] ${
                              orderCount > 0
                                ? "border-[#fe6f05]/30 bg-[#fe6f05]/10 text-[#fe6f05] hover:bg-[#fe6f05]/20"
                                : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                            }`}
                            title={isId ? `Lihat ${orderCount} pesanan` : `View ${orderCount} orders`}
                          >
                            <ShoppingBag className="h-3.5 w-3.5 shrink-0" />
                            <span>{orderCount} {isId ? "pesanan" : "orders"}</span>
                          </Link>
                        ) : (
                          <span className="text-xs text-slate-400">0</span>
                        )}
                      </td>

                      {/* Column 4: Status Badge */}
                      <td className={tableCell}>
                        <CustomerStatusBadge status={status} isId={isId} />
                      </td>

                      {/* Column 5: Actions (Switch + View Details + Edit + Delete) */}
                      <td className={`${tableCell} text-right`}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Status Toggle Switch */}
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

                          {/* View Customer Details (Themed Deep Navy #034c85) */}
                          {id ? (
                            <Link
                              to={`/admin/customers/${id}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#034c85] hover:bg-[#034c85]/10 hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#034c85] dark:hover:bg-[#034c85]/20 dark:hover:text-[#38bdf8]"
                              title={isId ? "Lihat profil pelanggan" : "View customer details"}
                              aria-label={isId ? "Lihat profil" : "View details"}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          ) : null}

                          {/* Edit Customer (Themed Vibrant Orange #fe6f05) */}
                          <button
                            type="button"
                            onClick={() => openEdit(customer)}
                            disabled={!canMutateCustomers || !id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-[#fe6f05] hover:bg-[#fe6f05]/10 hover:text-[#fe6f05] disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#fe6f05] dark:hover:bg-[#fe6f05]/20 dark:hover:text-[#fe6f05]"
                            title={isId ? "Edit data pelanggan" : "Edit customer"}
                            aria-label={isId ? "Edit data pelanggan" : "Edit customer"}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Delete Customer (Themed Rose Red) */}
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteTarget(customer);
                              setDeleteModalError("");
                            }}
                            disabled={!canMutateCustomers || !id}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-rose-500/50 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
                            title={isId ? "Hapus pelanggan" : "Delete customer"}
                            aria-label={isId ? "Hapus pelanggan" : "Delete customer"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Feed View (< 768px) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((customer) => {
              const id = getCustomerId(customer);
              const status = getCustomerStatus(customer);
              const role = getCustomerRole(customer);
              const canToggle = canMutateCustomers && ["active", "inactive"].includes(status);
              const name = getCustomerName(customer);
              const orderCount = getOrderCount(customer);

              return (
                <div key={id || `${name}-${getCustomerEmail(customer)}`} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#034c85]/40 bg-gradient-to-br from-[#034c85] to-[#0a4d80] text-xs font-bold text-white shadow-sm shadow-[#034c85]/20 ring-1 ring-white/10 dark:from-[#034c85] dark:to-[#023b68]">
                        {getCustomerInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {id ? (
                            <Link
                              to={`/admin/customers/${id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-[#034c85] truncate"
                            >
                              {name}
                            </Link>
                          ) : (
                            <span className="font-bold text-slate-900 dark:text-white truncate">{name}</span>
                          )}
                          <RoleBadge role={role} />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {getCustomerEmail(customer)}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md border border-[#034c85]/20 bg-[#034c85]/5 px-2 py-0.5 font-mono text-[11px] font-bold text-[#034c85] dark:border-[#034c85]/40 dark:bg-[#034c85]/20 dark:text-[#38bdf8]">
                      #{getShortId(customer)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {isId ? "Bergabung" : "Joined"}
                      </span>
                      <span>{formatJoinDate(customer?.createdAt, isId)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        {isId ? "Telepon" : "Phone"}
                      </span>
                      <span className="truncate block font-mono">{getCustomerPhone(customer)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <CustomerStatusBadge status={status} isId={isId} />
                      {id ? (
                        <Link
                          to={`/admin/customer-orders/${id}`}
                          className="inline-flex items-center gap-1 rounded-md border border-[#fe6f05]/30 bg-[#fe6f05]/10 px-2 py-0.5 text-[11px] font-bold text-[#fe6f05]"
                          title={isId ? `${orderCount} pesanan` : `${orderCount} orders`}
                        >
                          <ShoppingBag className="h-3 w-3" />
                          <span>{orderCount}</span>
                        </Link>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {id ? (
                        <Link
                          to={`/admin/customers/${id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-[#034c85] hover:text-[#034c85] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#034c85] dark:hover:text-[#38bdf8]"
                          title={isId ? "Lihat profil" : "View profile"}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openEdit(customer)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-[#fe6f05] hover:text-[#fe6f05] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
                        title={isId ? "Edit" : "Edit"}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(customer);
                          setDeleteModalError("");
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-500 hover:border-rose-400 dark:border-slate-700 dark:bg-slate-800 dark:text-rose-400"
                        title={isId ? "Hapus" : "Delete"}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <StatusSwitch
                        checked={status === "active"}
                        disabled={!canToggle || pendingStatusId === id}
                        onClick={() => toggleStatus(customer)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Edit Customer Drawer (Modern UI/UX Redesign) */}
      {isEditOpen ? (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <button
            type="button"
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={closeEdit}
            aria-label={isId ? "Tutup panel edit pelanggan" : "Close update customer drawer"}
          />

          {/* Drawer Panel */}
          <aside className="fixed inset-y-0 right-0 flex h-full w-full max-w-full sm:max-w-[500px] flex-col border-l border-slate-200/90 bg-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900">
            {/* Sticky Header */}
            <header className="sticky top-0 z-10 border-b border-slate-200/90 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
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

            {/* Scrollable Form Body */}
            <form onSubmit={submitEdit} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                {/* Identity Summary Card */}
                {editTarget ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#034c85]/40 bg-gradient-to-br from-[#034c85] to-[#0a4d80] text-sm font-bold text-white shadow-md shadow-[#034c85]/20 ring-1 ring-white/10 dark:from-[#034c85] dark:to-[#023b68]">
                      {getCustomerInitials(getCustomerName(editTarget))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {getCustomerName(editTarget)}
                        </span>
                        <RoleBadge role={getCustomerRole(editTarget)} />
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-semibold text-[#034c85] dark:text-[#38bdf8]">
                          #{getShortId(editTarget)}
                        </span>
                        <span>•</span>
                        <span className="truncate">{getCustomerEmail(editTarget)}</span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Field 1: Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span>{isId ? "Nama Lengkap" : "Full Name"}</span>
                    <span className="text-[#fe6f05]">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, name: event.target.value }));
                      setEditFieldErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder={isId ? "Masukkan nama lengkap pelanggan" : "Enter customer full name"}
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 transition focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
                      editFieldErrors.name
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800"
                        : "border-slate-200 focus:border-[#034c85] focus:ring-[#034c85]/15 dark:border-slate-700 dark:focus:border-[#034c85]"
                    }`}
                    disabled={updateMutation.isPending}
                  />
                  {editFieldErrors.name ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {editFieldErrors.name}
                    </p>
                  ) : null}
                </div>

                {/* Field 2: Alamat Email */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{isId ? "Alamat Email" : "Email Address"}</span>
                    <span className="text-[#fe6f05]">*</span>
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, email: event.target.value }));
                      setEditFieldErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder={isId ? "contoh@email.com" : "user@email.com"}
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-800 transition focus:outline-none focus:ring-2 dark:bg-slate-950 dark:text-slate-100 ${
                      editFieldErrors.email
                        ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-800"
                        : "border-slate-200 focus:border-[#034c85] focus:ring-[#034c85]/15 dark:border-slate-700 dark:focus:border-[#034c85]"
                    }`}
                    disabled={updateMutation.isPending}
                  />
                  {editFieldErrors.email ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {editFieldErrors.email}
                    </p>
                  ) : null}
                </div>

                {/* Field 3: Nomor Telepon */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{isId ? "Nomor Telepon" : "Phone Number"}</span>
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, phone: event.target.value }));
                      setEditFieldErrors((prev) => ({ ...prev, phone: "" }));
                    }}
                    placeholder="+628..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-sm text-slate-800 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-[#034c85]"
                    disabled={updateMutation.isPending}
                  />
                  {editFieldErrors.phone ? (
                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">
                      {editFieldErrors.phone}
                    </p>
                  ) : null}
                </div>

                {/* Field 4: Status Akun */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    <span>{isId ? "Status Akun" : "Account Status"}</span>
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(event) => {
                      setEditForm((prev) => ({ ...prev, status: event.target.value }));
                      setEditFieldErrors((prev) => ({ ...prev, status: "" }));
                    }}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-800 transition focus:border-[#034c85] focus:outline-none focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-[#034c85]"
                    disabled={updateMutation.isPending}
                  >
                    {customerStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {isId ? option.labelId : option.labelEn}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400">
                    {isId
                      ? "Menentukan hak akses masuk dan transaksi pelanggan di marketplace."
                      : "Determines sign in and shopping access permissions for this customer."}
                  </p>
                </div>

                {/* Error Banner */}
                {editError && !Object.keys(editFieldErrors).length ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
                    {editError}
                  </div>
                ) : null}
              </div>

              {/* Sticky High-Contrast Footer */}
              <footer className="sticky bottom-0 border-t border-slate-200/90 bg-white/95 px-6 py-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    disabled={updateMutation.isPending}
                  >
                    {isId ? "Batal" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#034c85] to-[#023b68] px-5 text-xs font-semibold text-white shadow-md shadow-[#034c85]/20 transition hover:from-[#023b68] hover:to-[#012847] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? (
                      <>
                        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{isId ? "Menyimpan..." : "Saving..."}</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>{isId ? "Simpan Perubahan" : "Save Changes"}</span>
                      </>
                    )}
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
