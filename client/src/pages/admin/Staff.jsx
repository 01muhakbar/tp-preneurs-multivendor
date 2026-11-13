import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  CheckCheck,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Filter,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";

import {
  approveStaffAccount,
  deleteStaff,
  fetchStaff,
  updateStaff,
} from "../../api/adminStaff.ts";
import { useAuth } from "../../auth/useAuth.js";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import EditStaffDrawer from "../../components/admin/staff/EditStaffDrawer.jsx";
import DeleteCouponModal from "../../components/admin/coupons/DeleteCouponModal.jsx";
import {
  UiErrorState,
  UiSkeleton,
} from "../../components/primitives/state/index.js";
import {
  GENERIC_ERROR,
  NO_STAFF_FOUND,
} from "../../constants/uiMessages.js";
import "./AdminStaffPage.css";

const toText = (value) => String(value ?? "").trim();
const normalizeRole = (value) => toText(value).toLowerCase();

const formatRoleLabel = (value, isId = false) => {
  const norm = normalizeRole(value);
  if (norm === "super_admin" || norm === "superadmin") return "Super Admin";
  if (norm === "admin") return "Admin";
  if (norm === "staff") return isId ? "Staf" : "Staff";
  if (norm === "seller") return isId ? "Penjual" : "Seller";

  return value
    ? String(value)
        .replace(/[_-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ")
    : "-";
};

const formatJoiningDate = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getStaffName = (staff) => toText(staff?.name) || `#${staff?.id ?? "-"}`;
const getStaffEmail = (staff) => toText(staff?.email) || "-";
const getStaffPhone = (staff) => toText(staff?.phoneNumber || staff?.phone) || "-";
const getStaffAvatarUrl = (staff) => resolveAssetUrl(toText(staff?.avatarUrl) || "");

const getAvatarInitial = (staff) => {
  const name = getStaffName(staff);
  return name.charAt(0).toUpperCase() || "S";
};

const isSameAccount = (currentUser, staff) => {
  const currentId = Number(currentUser?.id || 0);
  const staffId = Number(staff?.id || 0);
  if (currentId > 0 && staffId > 0) {
    return currentId === staffId;
  }
  return (
    toText(currentUser?.email).toLowerCase() &&
    toText(currentUser?.email).toLowerCase() === toText(staff?.email).toLowerCase()
  );
};

const isPrivilegedRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "super_admin" || normalized === "superadmin";
};

const isSuperAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "super_admin" || normalized === "superadmin";
};

function RoleBadge({ role, isId }) {
  const normalized = normalizeRole(role);
  const styleMap = {
    super_admin: "staff-badge--superadmin",
    superadmin: "staff-badge--superadmin",
    admin: "staff-badge--admin",
    staff: "staff-badge--staff",
    seller: "staff-badge--seller",
  };
  return (
    <span className={`staff-badge ${styleMap[normalized] || "staff-badge--staff"}`}>
      {formatRoleLabel(role, isId)}
    </span>
  );
}

function StoreApplicationBadge({ staff, isId }) {
  if (normalizeRole(staff?.role) !== "seller" && !staff?.storeApplication) return null;

  const app = staff?.storeApplication;
  const store = staff?.store;

  if (store && String(store.status).toUpperCase() === "ACTIVE") {
    return (
      <span className="staff-sub-badge staff-sub-badge--active">
        ● {isId ? "Toko: Aktif" : "Store: Active"}
      </span>
    );
  }

  if (!app) {
    return (
      <span className="staff-sub-badge staff-sub-badge--none">
        {isId ? "Tanpa Toko" : "No Store"}
      </span>
    );
  }

  const status = String(app.status || "").toLowerCase();
  const labelMap = {
    submitted: isId ? "Diajukan" : "Submitted",
    under_review: isId ? "Ditinjau" : "In Review",
    revision_requested: isId ? "Revisi" : "Revision",
    approved: isId ? "Disetujui" : "Approved",
    rejected: isId ? "Ditolak" : "Rejected",
    draft: isId ? "Draf" : "Draft",
  };

  return (
    <span className="staff-sub-badge staff-sub-badge--submitted">
      {isId ? "Pengajuan: " : "App: "}
      {labelMap[status] || status}
    </span>
  );
}

export default function AdminStaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [roleInput, setRoleInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ q: "", role: "" });

  const [editDrawerError, setEditDrawerError] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingPublishedId, setPendingPublishedId] = useState(null);
  const [pendingApproveId, setPendingApproveId] = useState(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteModalError, setDeleteModalError] = useState("");
  const [publishedMap, setPublishedMap] = useState({});

  const params = useMemo(
    () => ({
      page,
      limit,
      q: appliedFilters.q || undefined,
    }),
    [page, limit, appliedFilters.q]
  );

  const staffQuery = useQuery({
    queryKey: ["admin-staff", params],
    queryFn: () => fetchStaff(params),
    placeholderData: (prev) => prev,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateStaff(id, payload),
    onSuccess: () => {
      setEditDrawerError("");
      setIsEditModalOpen(false);
      setEditTarget(null);
      toast.success(isId ? "Akun berhasil diperbarui." : "Account updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? error?.message ?? GENERIC_ERROR;
      setEditDrawerError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteStaff(id),
    onSuccess: () => {
      setDeleteModalError("");
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      setPendingDeleteId(null);
      toast.success(isId ? "Akun berhasil dihapus." : "Account deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? error?.message ?? GENERIC_ERROR;
      setDeleteModalError(message);
      toast.error(message);
      setPendingDeleteId(null);
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished, isActive }) =>
      updateStaff(id, {
        isPublished,
        isActive: typeof isActive === "boolean" ? isActive : isPublished,
      }),
    onSuccess: () => {
      toast.success(isId ? "Status akun diperbarui." : "Account status updated.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error, variables) => {
      const message = error?.response?.data?.message ?? error?.message ?? GENERIC_ERROR;
      setPublishedMap((prev) => ({ ...prev, [variables.id]: variables.previousValue }));
      toast.error(message);
    },
    onSettled: () => {
      setPendingPublishedId(null);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => approveStaffAccount(id),
    onSuccess: (result) => {
      toast.success(
        result?.message ||
          (isId
            ? "Akun berhasil disetujui. Pengguna kini dapat masuk."
            : "Staff account approved. The user can now sign in.")
      );
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => {
      const message = error?.response?.data?.message ?? error?.message ?? GENERIC_ERROR;
      toast.error(message);
    },
    onSettled: () => {
      setPendingApproveId(null);
    },
  });

  const items = Array.isArray(staffQuery.data?.rows) ? staffQuery.data.rows : [];
  const meta = staffQuery.data || { page: 1, limit, count: 0, totalPages: 1 };
  const totalPages = Math.max(1, Number(meta.totalPages || 1));

  useEffect(() => {
    if (!items.length) return;
    setPublishedMap((prev) => {
      const next = { ...prev };
      items.forEach((staff) => {
        const id = Number(staff?.id);
        if (!id) return;
        if (typeof next[id] !== "boolean") {
          const isLive =
            staff?.isActive !== false &&
            staff?.isPublished !== false &&
            toText(staff?.status).toLowerCase() === "active";
          next[id] = isLive;
        }
      });
      return next;
    });
  }, [items]);

  const roleOptions = useMemo(() => {
    const map = new Map([
      ["staff", "staff"],
      ["admin", "admin"],
      ["super_admin", "super_admin"],
      ["seller", "seller"],
    ]);
    items.forEach((staff) => {
      const raw = toText(staff?.role);
      if (!raw) return;
      const key = normalizeRole(raw);
      if (!map.has(key)) map.set(key, raw);
    });
    return Array.from(map.values());
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((staff) => {
      const keyword = appliedFilters.q.toLowerCase();
      if (keyword) {
        const haystack = [getStaffName(staff), getStaffEmail(staff), getStaffPhone(staff)]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      if (appliedFilters.role) {
        if (normalizeRole(staff?.role) !== normalizeRole(appliedFilters.role)) return false;
      }

      return true;
    });
  }, [items, appliedFilters]);

  // KPI Summary calculations
  const summary = useMemo(() => {
    const total = Number(meta.count || items.length);
    const admins = items.filter((s) => ["admin", "super_admin", "superadmin", "staff"].includes(normalizeRole(s.role))).length;
    const sellers = items.filter((s) => normalizeRole(s.role) === "seller").length;
    const active = items.filter((s) => s.isActive !== false && toText(s.status).toLowerCase() === "active").length;

    return { total, admins, sellers, active };
  }, [items, meta.count]);

  const isInitialLoading = staffQuery.isLoading && !staffQuery.data;
  const isErrorState = staffQuery.isError && !staffQuery.data;
  const isEmpty = !isInitialLoading && !isErrorState && filteredItems.length === 0;
  const tableErrorMessage =
    staffQuery.error?.response?.data?.message || staffQuery.error?.message || GENERIC_ERROR;

  const isDeletePending = deleteMutation.isPending;

  const getPublished = (staff) => {
    const id = Number(staff?.id);
    if (id && typeof publishedMap[id] === "boolean") return publishedMap[id];
    return (
      staff?.isActive !== false &&
      staff?.isPublished !== false &&
      toText(staff?.status).toLowerCase() === "active"
    );
  };

  const applyFilters = () => {
    setAppliedFilters({ q: searchInput.trim(), role: roleInput });
    setPage(1);
  };

  const resetFilters = () => {
    setSearchInput("");
    setRoleInput("");
    setAppliedFilters({ q: "", role: "" });
    setPage(1);
  };

  const openViewModal = (staff) => {
    setViewTarget(staff || null);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewTarget(null);
  };

  const openEditModal = (staff) => {
    setEditDrawerError("");
    setEditTarget(staff || null);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    if (updateMutation.isPending) return;
    setIsEditModalOpen(false);
    setEditTarget(null);
    setEditDrawerError("");
  };

  const openDeleteModal = (staff) => {
    setDeleteTarget(staff || null);
    setDeleteModalError("");
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (isDeletePending) return;
    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
    setDeleteModalError("");
  };

  const onConfirmDelete = () => {
    if (!deleteTarget?.id) return;
    setPendingDeleteId(deleteTarget.id);
    deleteMutation.mutate(deleteTarget.id);
  };

  const onSubmitEdit = (payload) => {
    if (!editTarget?.id) return;
    setEditDrawerError("");
    updateMutation.mutate({
      id: editTarget.id,
      payload,
    });
  };

  const onTogglePublished = (staff) => {
    const id = Number(staff?.id);
    if (!id || pendingPublishedId === id) return;
    const previousValue = getPublished(staff);
    const nextValue = !previousValue;
    setPendingPublishedId(id);
    setPublishedMap((prev) => ({ ...prev, [id]: nextValue }));
    publishMutation.mutate({
      id,
      isPublished: nextValue,
      isActive: nextValue,
      previousValue,
    });
  };

  const onApproveStaff = (staff) => {
    const id = Number(staff?.id);
    if (!id || pendingApproveId === id) return;
    setPendingApproveId(id);
    approveMutation.mutate(id);
  };

  const canDeleteStaff = (staff) => {
    const roleProtected = isPrivilegedRole(staff?.role);
    const isSelf = isSameAccount(currentUser, staff);
    return !roleProtected && !isSelf;
  };

  const getDeleteDisabledReason = (staff) => {
    if (isSameAccount(currentUser, staff)) {
      return isId
        ? "Anda tidak dapat menghapus akun Anda sendiri."
        : "You cannot delete your own account.";
    }
    if (isPrivilegedRole(staff?.role)) {
      return isId
        ? "Akun administrator dilindungi dari penghapusan."
        : "Cannot delete this privileged account.";
    }
    return undefined;
  };

  const canApproveStaff = (staff) =>
    normalizeRole(staff?.role) === "staff" &&
    toText(staff?.status).toLowerCase() === "pending_approval";

  return (
    <div className="admin-staff-2026">
      {/* HEADER SECTION */}
      <header className="staff-hero">
        <div className="staff-title">
          <div className="staff-title__icon">
            <UsersRound size={22} />
          </div>
          <div className="staff-title-text">
            <div className="staff-title-row">
              <h1>{isId ? "Semua Akun" : "All Accounts"}</h1>
              <span className="staff-badge-count">{meta.count || items.length}</span>
            </div>
            <p>
              {isId
                ? "Kelola akun pengguna, staf admin, dan penjual dalam ruang kerja."
                : "Create workspace accounts and manage role-based admin or seller access."}
            </p>
          </div>
        </div>

        <div className="staff-actions">
          <button
            type="button"
            className="staff-btn"
            onClick={() => staffQuery.refetch()}
            disabled={staffQuery.isFetching}
            title={isId ? "Segarkan data" : "Refresh accounts"}
          >
            <RefreshCw size={14} className={staffQuery.isFetching ? "animate-spin" : ""} />
            {isId ? "Segarkan" : "Refresh"}
          </button>
          <Link
            to="/admin/all-accounts/create"
            className="staff-btn staff-btn--primary"
            title={isId ? "Tambah akun baru" : "Create new account"}
          >
            <Plus size={14} />
            {isId ? "Tambah Akun" : "Create Account"}
          </Link>
        </div>
      </header>

      {/* METRICS SUMMARY KPI CARDS */}
      <section className="staff-metrics" aria-label="Account summary metrics">
        <div className="staff-metric-card is-blue">
          <div className="staff-metric-top">
            <span className="staff-metric-title">{isId ? "Total Akun" : "Total Accounts"}</span>
            <div className="staff-metric-icon">
              <UsersRound size={17} />
            </div>
          </div>
          <div className="staff-metric-val-row">
            <span className="staff-metric-val">{summary.total}</span>
            <span className="staff-metric-sub">{isId ? "Pengguna" : "Members"}</span>
          </div>
        </div>

        <div className="staff-metric-card is-blue">
          <div className="staff-metric-top">
            <span className="staff-metric-title">{isId ? "Admin & Staf" : "Admins & Staff"}</span>
            <div className="staff-metric-icon">
              <ShieldCheck size={17} />
            </div>
          </div>
          <div className="staff-metric-val-row">
            <span className="staff-metric-val">{summary.admins}</span>
            <span className="staff-metric-sub">{isId ? "Operator" : "Operators"}</span>
          </div>
        </div>

        <div className="staff-metric-card is-orange">
          <div className="staff-metric-top">
            <span className="staff-metric-title">{isId ? "Penjual" : "Sellers"}</span>
            <div className="staff-metric-icon">
              <Store size={17} />
            </div>
          </div>
          <div className="staff-metric-val-row">
            <span className="staff-metric-val">{summary.sellers}</span>
            <span className="staff-metric-sub">{isId ? "Merchant" : "Merchants"}</span>
          </div>
        </div>

        <div className="staff-metric-card is-green">
          <div className="staff-metric-top">
            <span className="staff-metric-title">{isId ? "Akun Aktif" : "Active Accounts"}</span>
            <div className="staff-metric-icon">
              <UserCheck size={17} />
            </div>
          </div>
          <div className="staff-metric-val-row">
            <span className="staff-metric-val">{summary.active}</span>
            <span className="staff-metric-sub">{isId ? "Status Aktif" : "Live Status"}</span>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="staff-filter-card">
        {/* Quick Filter Chips */}
        <div className="staff-quick-chips">
          <button
            type="button"
            onClick={() => {
              setRoleInput("");
              setAppliedFilters((c) => ({ ...c, role: "" }));
            }}
            className={`staff-quick-chip ${!appliedFilters.role ? "is-active" : ""}`}
          >
            {isId ? "Semua Peran" : "All Roles"}
            <span className="staff-quick-count">{summary.total}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleInput("staff");
              setAppliedFilters((c) => ({ ...c, role: "staff" }));
            }}
            className={`staff-quick-chip ${appliedFilters.role === "staff" ? "is-active" : ""}`}
          >
            {isId ? "Staf" : "Staff"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleInput("seller");
              setAppliedFilters((c) => ({ ...c, role: "seller" }));
            }}
            className={`staff-quick-chip ${appliedFilters.role === "seller" ? "is-active is-orange" : ""}`}
          >
            {isId ? "Penjual" : "Seller"}
            <span className="staff-quick-count">{summary.sellers}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setRoleInput("admin");
              setAppliedFilters((c) => ({ ...c, role: "admin" }));
            }}
            className={`staff-quick-chip ${appliedFilters.role === "admin" ? "is-active" : ""}`}
          >
            {isId ? "Admin" : "Admin"}
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="staff-filter-grid">
          <div className="staff-input-wrap">
            <Search size={14} style={{ color: "var(--staff-dim)" }} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters();
              }}
              placeholder={isId ? "Cari nama, email, atau telepon..." : "Search by name, email, or phone..."}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  setAppliedFilters((c) => ({ ...c, q: "" }));
                }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--staff-dim)" }}
                title={isId ? "Hapus pencarian" : "Clear search"}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            className="staff-select"
            aria-label={isId ? "Pilih peran" : "Filter by role"}
          >
            <option value="">{isId ? "Semua Peran" : "All Roles"}</option>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {formatRoleLabel(role, isId)}
              </option>
            ))}
          </select>

          <button type="button" onClick={applyFilters} className="staff-btn staff-btn--primary">
            <Filter size={13} />
            {isId ? "Terapkan" : "Apply"}
          </button>

          {(appliedFilters.q || appliedFilters.role || searchInput || roleInput) && (
            <button type="button" onClick={resetFilters} className="staff-btn" title={isId ? "Atur ulang filter" : "Reset filters"}>
              <RotateCcw size={13} />
              {isId ? "Atur Ulang" : "Reset"}
            </button>
          )}
        </div>
      </section>

      {/* SKELETON / ERROR */}
      {isInitialLoading && <UiSkeleton variant="table" rows={6} />}

      {isErrorState && (
        <UiErrorState
          title={GENERIC_ERROR}
          message={tableErrorMessage}
          onRetry={staffQuery.refetch}
        />
      )}

      {/* EMPTY STATE */}
      {isEmpty && (
        <div className="staff-empty">
          <div className="staff-empty-icon">
            <UsersRound size={24} />
          </div>
          <h3 className="staff-empty-title">
            {isId ? "Tidak ada akun ditemukan" : NO_STAFF_FOUND}
          </h3>
          <p className="staff-empty-desc">
            {isId
              ? "Coba gunakan kata kunci lain atau atur ulang filter pencarian Anda."
              : "Try another keyword or reset your filters."}
          </p>
          <Link to="/admin/all-accounts/create" className="staff-btn staff-btn--primary" style={{ marginTop: 8 }}>
            <Plus size={14} />
            {isId ? "Tambah Akun Baru" : "Create Account"}
          </Link>
        </div>
      )}

      {/* ZERO-SCROLL TABLE CONTENT */}
      {!isInitialLoading && !isErrorState && !isEmpty && (
        <section className="staff-table-card">
          <div className="staff-table-toolbar">
            <div className="staff-toolbar-count">
              {isId ? "Menampilkan " : "Showing "}
              <strong>{filteredItems.length}</strong>
              {isId ? " dari " : " of "}
              <strong>{Number(meta.count || items.length)}</strong>
              {isId ? " akun pengguna" : " workspace accounts"}
            </div>
          </div>

          {/* DESKTOP TABLE (>= 768px) - ZERO HORIZONTAL SCROLL */}
          <div className="staff-table-scroll">
            <table className="staff-table">
              <thead>
                <tr>
                  <th style={{ width: "36%" }}>{isId ? "Anggota / Akun" : "Staff / Account"}</th>
                  <th style={{ width: "20%" }}>{isId ? "Peran" : "Role"}</th>
                  <th style={{ width: "16%" }}>{isId ? "Bergabung" : "Joined"}</th>
                  <th style={{ width: "16%" }}>{isId ? "Status" : "Status"}</th>
                  <th style={{ width: "12%", textAlign: "right" }}>{isId ? "Aksi" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((staff) => {
                  const canDelete = canDeleteStaff(staff);
                  const isDeleting = pendingDeleteId === staff?.id;
                  const isPublishing = pendingPublishedId === staff?.id;
                  const isApproving = pendingApproveId === staff?.id;
                  const isLive = getPublished(staff);
                  const staffName = getStaffName(staff);
                  const staffEmail = getStaffEmail(staff);
                  const staffPhone = getStaffPhone(staff);
                  const isPendingApproval = toText(staff?.status).toLowerCase() === "pending_approval";

                  return (
                    <tr key={staff?.id || `${staffEmail}-${staffName}`}>
                      <td>
                        <div className="staff-user-cell">
                          <div className="staff-avatar-badge" aria-hidden="true">
                            {getStaffAvatarUrl(staff) ? (
                              <img src={getStaffAvatarUrl(staff)} alt={staffName} />
                            ) : (
                              getAvatarInitial(staff)
                            )}
                          </div>
                          <div className="staff-user-info">
                            <span className="staff-user-name" title={staffName}>
                              {staffName}
                            </span>
                            <div className="staff-user-sub">
                              <span title={staffEmail}>{staffEmail}</span>
                              {staffPhone !== "-" && (
                                <>
                                  <span>•</span>
                                  <span>{staffPhone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="staff-role-cell">
                          <RoleBadge role={staff?.role} isId={isId} />
                          <StoreApplicationBadge staff={staff} isId={isId} />
                        </div>
                      </td>

                      <td style={{ color: "var(--staff-muted)" }}>
                        {formatJoiningDate(staff?.createdAt, isId)}
                      </td>

                      <td>
                        <div className="staff-status-stack">
                          <span
                            className={`staff-status-pill ${
                              isPendingApproval
                                ? "staff-status-pill--pending"
                                : isLive
                                ? "staff-status-pill--active"
                                : "staff-status-pill--inactive"
                            }`}
                          >
                            <span className="staff-badge-dot" />
                            {isPendingApproval
                              ? isId
                                ? "Menunggu"
                                : "Pending approval"
                              : isLive
                              ? isId
                                ? "Aktif"
                                : "Active"
                              : isId
                              ? "Nonaktif"
                              : "Inactive"}
                          </span>

                          <button
                            type="button"
                            onClick={() => onTogglePublished(staff)}
                            disabled={isPublishing}
                            className={`staff-toggle-switch ${isLive ? "is-on" : "is-off"}`}
                            title={isId ? "Ubah status aktif/nonaktif" : "Toggle active/inactive status"}
                            aria-label={`Toggle status for ${staffName}`}
                          >
                            <span className="staff-toggle-knob" />
                          </button>
                        </div>
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="staff-row-actions">
                          {canApproveStaff(staff) && (
                            <button
                              type="button"
                              onClick={() => onApproveStaff(staff)}
                              disabled={isApproving}
                              className="staff-action-icon-btn is-amber"
                              title={isId ? "Setujui akun staf" : "Approve staff account"}
                            >
                              <CheckCheck size={14} />
                            </button>
                          )}

                          {staff?.storeApplication?.id && (
                            <Link
                              to={`/admin/store/applications/${staff.storeApplication.id}`}
                              className="staff-action-icon-btn is-amber"
                              title={isId ? "Tinjau Permohonan Toko" : "Review Store Application"}
                            >
                              <ClipboardCheck size={14} />
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => openViewModal(staff)}
                            className="staff-action-icon-btn"
                            title={isId ? "Lihat Detail" : "View Detail"}
                          >
                            <Eye size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(staff)}
                            className="staff-action-icon-btn"
                            title={isId ? "Edit Akun" : "Edit Account"}
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteModal(staff)}
                            disabled={!canDelete || isDeleting}
                            className="staff-action-icon-btn is-danger"
                            title={!canDelete ? getDeleteDisabledReason(staff) : isId ? "Hapus Akun" : "Delete Account"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE FEED (< 768px) */}
          <div className="staff-mobile-feed">
            {filteredItems.map((staff) => {
              const canDelete = canDeleteStaff(staff);
              const isDeleting = pendingDeleteId === staff?.id;
              const isPublishing = pendingPublishedId === staff?.id;
              const isApproving = pendingApproveId === staff?.id;
              const isLive = getPublished(staff);
              const staffName = getStaffName(staff);
              const staffEmail = getStaffEmail(staff);
              const isPendingApproval = toText(staff?.status).toLowerCase() === "pending_approval";

              return (
                <div key={staff?.id || `${staffEmail}-${staffName}`} className="staff-mobile-card">
                  <div className="staff-mobile-top">
                    <div className="staff-user-cell">
                      <div className="staff-avatar-badge" aria-hidden="true">
                        {getStaffAvatarUrl(staff) ? (
                          <img src={getStaffAvatarUrl(staff)} alt={staffName} />
                        ) : (
                          getAvatarInitial(staff)
                        )}
                      </div>
                      <div className="staff-user-info">
                        <span className="staff-user-name">{staffName}</span>
                        <span className="staff-user-sub">{staffEmail}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onTogglePublished(staff)}
                      disabled={isPublishing}
                      className={`staff-toggle-switch ${isLive ? "is-on" : "is-off"}`}
                    >
                      <span className="staff-toggle-knob" />
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div className="staff-role-cell">
                      <RoleBadge role={staff?.role} isId={isId} />
                      <StoreApplicationBadge staff={staff} isId={isId} />
                    </div>

                    <span style={{ fontSize: "0.75rem", color: "var(--staff-muted)" }}>
                      {formatJoiningDate(staff?.createdAt, isId)}
                    </span>
                  </div>

                  <div className="staff-mobile-actions">
                    <span
                      className={`staff-status-pill ${
                        isPendingApproval
                          ? "staff-status-pill--pending"
                          : isLive
                          ? "staff-status-pill--active"
                          : "staff-status-pill--inactive"
                      }`}
                    >
                      <span className="staff-badge-dot" />
                      {isPendingApproval
                        ? isId
                          ? "Menunggu"
                          : "Pending approval"
                        : isLive
                        ? isId
                          ? "Aktif"
                          : "Active"
                        : isId
                        ? "Nonaktif"
                        : "Inactive"}
                    </span>

                    <div className="staff-row-actions">
                      {canApproveStaff(staff) && (
                        <button
                          type="button"
                          onClick={() => onApproveStaff(staff)}
                          disabled={isApproving}
                          className="staff-action-icon-btn is-amber"
                        >
                          <CheckCheck size={14} />
                        </button>
                      )}

                      {staff?.storeApplication?.id && (
                        <Link
                          to={`/admin/store/applications/${staff.storeApplication.id}`}
                          className="staff-action-icon-btn is-amber"
                        >
                          <ClipboardCheck size={14} />
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => openViewModal(staff)}
                        className="staff-action-icon-btn"
                      >
                        <Eye size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(staff)}
                        className="staff-action-icon-btn"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => openDeleteModal(staff)}
                        disabled={!canDelete || isDeleting}
                        className="staff-action-icon-btn is-danger"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          <div className="staff-pagination">
            <span style={{ fontSize: "0.775rem", color: "var(--staff-muted)" }}>
              {isId ? `Halaman ${meta.page} dari ${totalPages}` : `Page ${meta.page} of ${totalPages}`}
            </span>

            <div className="staff-pages">
              <button
                type="button"
                disabled={meta.page <= 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                {isId ? "Sebelumnya" : "Previous"}
              </button>
              <button
                type="button"
                disabled={meta.page >= totalPages}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              >
                {isId ? "Berikutnya" : "Next"}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* EDIT STAFF DRAWER */}
      <EditStaffDrawer
        open={isEditModalOpen}
        onClose={closeEditModal}
        staff={editTarget}
        currentUser={currentUser}
        rolesOptions={roleOptions}
        onSubmit={onSubmitEdit}
        isSubmitting={updateMutation.isPending}
        error={editDrawerError}
        canManageRoles={isSuperAdminRole(currentUser?.role)}
      />

      {/* VIEW STAFF DETAIL MODAL */}
      {isViewModalOpen && viewTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1050,
            padding: 16,
          }}
          onClick={closeViewModal}
        >
          <div
            style={{
              background: "var(--staff-surface)",
              border: "1px solid var(--staff-border)",
              borderRadius: "var(--staff-radius-lg)",
              boxShadow: "var(--staff-shadow-md)",
              width: "480px",
              maxWidth: "100%",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderBottom: "1px solid var(--staff-border-subtle)",
                background: "var(--staff-surface-soft)",
              }}
            >
              <h2 style={{ fontSize: "1.05rem", fontWeight: 700, margin: 0, color: "var(--staff-text)" }}>
                {isId ? "Detail Akun" : "Account Detail"}
              </h2>
              <button
                type="button"
                onClick={closeViewModal}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--staff-dim)" }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="staff-avatar-badge" style={{ width: 48, height: 48, fontSize: "1.2rem" }}>
                  {getStaffAvatarUrl(viewTarget) ? (
                    <img src={getStaffAvatarUrl(viewTarget)} alt={getStaffName(viewTarget)} />
                  ) : (
                    getAvatarInitial(viewTarget)
                  )}
                </div>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: 0, color: "var(--staff-text)" }}>
                    {getStaffName(viewTarget)}
                  </h3>
                  <p style={{ fontSize: "0.775rem", color: "var(--staff-muted)", margin: "2px 0 0" }}>
                    {getStaffEmail(viewTarget)}
                  </p>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  padding: "14px",
                  borderRadius: "var(--staff-radius-md)",
                  background: "var(--staff-surface-soft)",
                  border: "1px solid var(--staff-border-subtle)",
                  fontSize: "0.813rem",
                }}
              >
                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--staff-muted)", fontWeight: 700 }}>
                    {isId ? "TELEPON" : "CONTACT"}
                  </span>
                  <div style={{ fontWeight: 600, color: "var(--staff-text)", marginTop: 2 }}>
                    {getStaffPhone(viewTarget)}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--staff-muted)", fontWeight: 700 }}>
                    {isId ? "PERAN" : "ROLE"}
                  </span>
                  <div style={{ marginTop: 2 }}>
                    <RoleBadge role={viewTarget?.role} isId={isId} />
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--staff-muted)", fontWeight: 700 }}>
                    {isId ? "STATUS" : "STATUS"}
                  </span>
                  <div style={{ fontWeight: 600, color: "var(--staff-text)", marginTop: 2 }}>
                    {getPublished(viewTarget) ? (isId ? "Aktif" : "Active") : (isId ? "Nonaktif" : "Inactive")}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: "0.72rem", color: "var(--staff-muted)", fontWeight: 700 }}>
                    {isId ? "BERGABUNG" : "JOINED"}
                  </span>
                  <div style={{ fontWeight: 600, color: "var(--staff-text)", marginTop: 2 }}>
                    {formatJoiningDate(viewTarget?.createdAt, isId)}
                  </div>
                </div>
              </div>

              {viewTarget?.store && (
                <div
                  style={{
                    padding: "12px",
                    borderRadius: "var(--staff-radius-md)",
                    background: "rgba(3, 76, 133, 0.08)",
                    border: "1px solid rgba(3, 76, 133, 0.2)",
                    fontSize: "0.8rem",
                  }}
                >
                  <span style={{ fontWeight: 700, color: "var(--staff-primary)" }}>
                    {isId ? "Toko Terhubung:" : "Connected Store:"}
                  </span>
                  <p style={{ margin: "3px 0 0", color: "var(--staff-text)", fontWeight: 600 }}>
                    {viewTarget.store.name}{" "}
                    <span style={{ color: "var(--staff-muted)", fontWeight: 400 }}>
                      (@{viewTarget.store.slug})
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteCouponModal
        open={isDeleteModalOpen}
        onClose={closeDeleteModal}
        onConfirm={onConfirmDelete}
        title={isId ? "Hapus Akun Pengguna?" : "Are You Sure! Want to Delete ?"}
        description={
          isId
            ? `Apakah Anda yakin ingin menghapus akun ${deleteTarget?.name || deleteTarget?.email || "ini"}? Tindakan ini tidak dapat dibatalkan.`
            : `Do you really want to delete ${deleteTarget?.name || deleteTarget?.email || "this staff"}? You cannot undo this action!`
        }
        cancelLabel={isId ? "Batal" : "No, Keep It"}
        confirmLabel={isId ? "Ya, Hapus Akun" : "Yes, Delete It"}
        isLoading={isDeletePending}
        errorMessage={deleteModalError}
      />
    </div>
  );
}
