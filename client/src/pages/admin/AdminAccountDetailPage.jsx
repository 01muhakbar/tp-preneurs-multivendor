import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Power,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  User,
  UsersRound,
} from "lucide-react";

import {
  approveStaffAccount,
  deleteStaff,
  fetchStaffById,
  updateStaff,
} from "../../api/adminStaff.ts";
import { useAuth } from "../../auth/useAuth.js";
import EditStaffDrawer from "../../components/admin/staff/EditStaffDrawer.jsx";
import DeleteCouponModal from "../../components/admin/coupons/DeleteCouponModal.jsx";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { GENERIC_ERROR } from "../../constants/uiMessages.js";
import "./AdminAccountDetailPage.css";

const toText = (value) => String(value ?? "").trim();
const normalizeRole = (value) => toText(value).toLowerCase();

const formatRoleLabel = (value, isId = false) => {
  const norm = normalizeRole(value);
  if (norm === "super_admin" || norm === "superadmin") return "Super Admin";
  if (norm === "admin") return "Admin";
  if (norm === "staff") return isId ? "Staf" : "Staff";
  if (norm === "seller") return isId ? "Penjual" : "Seller";
  if (norm === "customer" || norm === "buyer") return isId ? "Pelanggan" : "Customer";

  return value
    ? String(value)
        .replace(/[_-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(" ")
    : "-";
};

const formatFullDate = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatShortDate = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getAvatarInitial = (name, email) => {
  const clean = toText(name) || toText(email) || "U";
  return clean.charAt(0).toUpperCase();
};

const cleanWhatsAppNumber = (phone) => {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  if (digits.startsWith("62")) return digits;
  return digits;
};

const isPrivilegedRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "admin" || normalized === "super_admin" || normalized === "superadmin";
};

const isSuperAdminRole = (role) => {
  const normalized = normalizeRole(role);
  return normalized === "super_admin" || normalized === "superadmin";
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

const PERMISSION_LABEL_MAP = {
  CATALOG_READ: { id: "Lihat Katalog", en: "View Catalog" },
  CATALOG_WRITE: { id: "Kelola Produk & Stok", en: "Manage Products & Stock" },
  CATALOG_MANAGE: { id: "Akses Penuh Katalog", en: "Full Catalog Access" },
  ORDER_READ: { id: "Lihat Pesanan", en: "View Orders" },
  ORDER_WRITE: { id: "Proses & Kirim Pesanan", en: "Process & Ship Orders" },
  ORDER_MANAGE: { id: "Akses Penuh Pesanan", en: "Full Order Access" },
  WITHDRAW_READ: { id: "Lihat Saldo & Penarikan", en: "View Balance & Withdrawals" },
  WITHDRAW_WRITE: { id: "Ajukan Penarikan Dana", en: "Request Withdrawals" },
  WITHDRAW_MANAGE: { id: "Akses Penuh Penarikan", en: "Full Withdrawal Access" },
  STORE_PROFILE_MANAGE: { id: "Kelola Profil Toko", en: "Manage Store Profile" },
  COUPON_MANAGE: { id: "Kelola Kupon Promosi", en: "Manage Coupons & Promos" },
  REVIEW_MANAGE: { id: "Tanggapi Ulasan Produk", en: "Manage Product Reviews" },
  STAFF_MANAGE: { id: "Kelola Akun & Tim", en: "Manage Accounts & Team" },
};

export default function AdminAccountDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [copiedKey, setCopiedKey] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDrawerError, setEditDrawerError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState("");

  const staffQuery = useQuery({
    queryKey: ["admin-staff-detail", id],
    queryFn: () => fetchStaffById(id),
    enabled: Boolean(id),
    retry: 1,
  });

  const staff = staffQuery.data;

  const roleOptions = useMemo(() => {
    return ["staff", "admin", "super_admin", "seller"];
  }, []);

  const copyToClipboard = (text, key) => {
    if (!text || text === "-") return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    toast.success(
      isId ? "Teks disalin ke papan klip!" : "Copied to clipboard!"
    );
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? "" : curr));
    }, 2000);
  };

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ payload }) => updateStaff(id, payload),
    onSuccess: (updated) => {
      setEditDrawerError("");
      setIsEditModalOpen(false);
      toast.success(isId ? "Akun berhasil diperbarui." : "Account updated successfully.");
      queryClient.setQueryData(["admin-staff-detail", id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || GENERIC_ERROR;
      setEditDrawerError(msg);
      toast.error(msg);
    },
  });

  const publishMutation = useMutation({
    mutationFn: ({ nextStatus }) =>
      updateStaff(id, {
        isPublished: nextStatus,
        isActive: nextStatus,
      }),
    onSuccess: (updated) => {
      toast.success(
        updated?.isActive
          ? isId
            ? "Akun berhasil diaktifkan."
            : "Account activated."
          : isId
          ? "Akun dinonaktifkan."
          : "Account deactivated."
      );
      queryClient.setQueryData(["admin-staff-detail", id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || GENERIC_ERROR;
      toast.error(msg);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveStaffAccount(id),
    onSuccess: (res) => {
      toast.success(
        res?.message ||
          (isId
            ? "Akun berhasil disetujui. Pengguna kini dapat masuk."
            : "Account approved successfully.")
      );
      queryClient.invalidateQueries({ queryKey: ["admin-staff-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || GENERIC_ERROR;
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteStaff(id),
    onSuccess: () => {
      setDeleteModalError("");
      setIsDeleteModalOpen(false);
      toast.success(isId ? "Akun berhasil dihapus." : "Account permanently deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      navigate("/admin/all-accounts");
    },
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || GENERIC_ERROR;
      setDeleteModalError(msg);
      toast.error(msg);
    },
  });

  // Handlers
  const handleToggleStatus = () => {
    if (!staff) return;
    const currentActive = staff.isActive !== false && staff.isPublished !== false;
    publishMutation.mutate({ nextStatus: !currentActive });
  };

  const handleApprove = () => {
    if (!staff) return;
    approveMutation.mutate();
  };

  const handleOpenEdit = () => {
    setEditDrawerError("");
    setIsEditModalOpen(true);
  };

  const handleCloseEdit = () => {
    if (updateMutation.isPending) return;
    setIsEditModalOpen(false);
    setEditDrawerError("");
  };

  const handleSubmitEdit = (payload) => {
    setEditDrawerError("");
    updateMutation.mutate({ payload });
  };

  const handleOpenDelete = () => {
    setDeleteModalError("");
    setIsDeleteModalOpen(true);
  };

  const handleCloseDelete = () => {
    if (deleteMutation.isPending) return;
    setIsDeleteModalOpen(false);
    setDeleteModalError("");
  };

  const handleConfirmDelete = () => {
    deleteMutation.mutate();
  };

  // Access checks
  const canDelete = staff ? !isPrivilegedRole(staff.role) && !isSameAccount(currentUser, staff) : false;
  const isSelf = staff ? isSameAccount(currentUser, staff) : false;
  const isPrivileged = staff ? isPrivilegedRole(staff.role) : false;

  const deleteDisabledTooltip = isSelf
    ? isId
      ? "Anda tidak dapat menghapus akun Anda sendiri."
      : "You cannot delete your own account."
    : isPrivileged
    ? isId
      ? "Akun administrator dilindungi dari penghapusan."
      : "Privileged administrator accounts cannot be deleted."
    : undefined;

  // Render Loading Skeleton
  if (staffQuery.isLoading) {
    return (
      <div className="admin-acc-detail-page">
        <div className="acc-detail-breadcrumbs-skeleton" />
        <div className="acc-detail-hero-skeleton" />
        <div className="acc-detail-grid-skeleton">
          <div className="acc-card-skeleton" />
          <div className="acc-card-skeleton" />
        </div>
      </div>
    );
  }

  // Render Error State
  if (staffQuery.isError || !staff) {
    return (
      <div className="admin-acc-detail-page">
        <nav className="acc-detail-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin">{isId ? "Admin" : "Admin"}</Link>
          <span>/</span>
          <Link to="/admin/all-accounts">{isId ? "Semua Akun" : "All Accounts"}</Link>
          <span>/</span>
          <span className="active">{isId ? "Detail Akun" : "Account Detail"}</span>
        </nav>

        <div className="acc-detail-error-card">
          <div className="acc-detail-error-icon">
            <ShieldAlert size={36} />
          </div>
          <h2>{isId ? "Akun Tidak Ditemukan" : "Account Not Found"}</h2>
          <p>
            {isId
              ? "Akun yang Anda cari mungkin telah dihapus atau ID tidak valid."
              : "The account you are looking for does not exist or has been removed."}
          </p>
          <Link to="/admin/all-accounts" className="acc-detail-btn acc-detail-btn--primary">
            <ArrowLeft size={16} />
            {isId ? "Kembali ke Semua Akun" : "Back to All Accounts"}
          </Link>
        </div>
      </div>
    );
  }

  const staffName = toText(staff.name) || `#${staff.id}`;
  const staffEmail = toText(staff.email) || "-";
  const staffPhone = toText(staff.phoneNumber) || "-";
  const waNumber = cleanWhatsAppNumber(staffPhone);
  const avatarUrl = resolveAssetUrl(toText(staff.avatarUrl));
  const isLive = staff.isActive !== false && staff.isPublished !== false && toText(staff.status).toLowerCase() === "active";
  const isPendingApproval = toText(staff.status).toLowerCase() === "pending_approval" || staff.isPendingApproval;
  const store = staff.store;
  const storeApp = staff.storeApplication;
  const permissions = Array.isArray(staff.permissionKeys) ? staff.permissionKeys : [];

  return (
    <div className="admin-acc-detail-page">
      {/* BREADCRUMB */}
      <nav className="acc-detail-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/admin">{isId ? "Admin" : "Admin"}</Link>
        <span>/</span>
        <Link to="/admin/all-accounts">{isId ? "Semua Akun" : "All Accounts"}</Link>
        <span>/</span>
        <span className="active">{staffName}</span>
      </nav>

      {/* TOP BAR / BACK NAVIGATION */}
      <div className="acc-detail-topbar">
        <Link to="/admin/all-accounts" className="acc-detail-back-btn">
          <ArrowLeft size={16} />
          <span>{isId ? "Kembali ke Daftar Akun" : "Back to All Accounts"}</span>
        </Link>

        <div className="acc-detail-topbar-meta">
          <span className="acc-detail-id-tag">ID #{staff.id}</span>
          <span className="acc-detail-timestamp">
            <Clock size={13} />
            {isId ? "Terdaftar: " : "Joined: "}
            {formatShortDate(staff.createdAt, isId)}
          </span>
        </div>
      </div>

      {/* HERO PROFILE CARD */}
      <section className="acc-detail-hero">
        <div className="acc-hero-left">
          <div className="acc-hero-avatar-wrap">
            {avatarUrl ? (
              <img src={avatarUrl} alt={staffName} className="acc-hero-avatar-img" />
            ) : (
              <div className="acc-hero-avatar-fallback">
                {getAvatarInitial(staffName, staffEmail)}
              </div>
            )}
            <span
              className={`acc-hero-avatar-dot ${
                isPendingApproval
                  ? "is-pending"
                  : isLive
                  ? "is-active"
                  : "is-inactive"
              }`}
            />
          </div>

          <div className="acc-hero-info">
            <div className="acc-hero-name-row">
              <h1 className="acc-hero-name">{staffName}</h1>
              <div className="acc-hero-badges">
                <span
                  className={`staff-badge staff-badge--${
                    normalizeRole(staff.role) === "super_admin" ||
                    normalizeRole(staff.role) === "superadmin"
                      ? "superadmin"
                      : normalizeRole(staff.role) === "admin"
                      ? "admin"
                      : normalizeRole(staff.role) === "seller"
                      ? "seller"
                      : "staff"
                  }`}
                >
                  {formatRoleLabel(staff.role, isId)}
                </span>

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
                      ? "Menunggu Persetujuan"
                      : "Pending Approval"
                    : isLive
                    ? isId
                      ? "Aktif"
                      : "Active"
                    : isId
                    ? "Nonaktif"
                    : "Inactive"}
                </span>
              </div>
            </div>

            <div className="acc-hero-contact-row">
              {staffEmail && staffEmail !== "-" && (
                <div className="acc-hero-contact-item">
                  <Mail size={14} className="acc-hero-contact-icon" />
                  <span className="acc-hero-contact-text">{staffEmail}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(staffEmail, "email")}
                    className="acc-copy-btn"
                    title={isId ? "Salin email" : "Copy email"}
                  >
                    {copiedKey === "email" ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              )}

              {staffPhone && staffPhone !== "-" && (
                <div className="acc-hero-contact-item">
                  <Phone size={14} className="acc-hero-contact-icon" />
                  <span className="acc-hero-contact-text">{staffPhone}</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(staffPhone, "phone")}
                    className="acc-copy-btn"
                    title={isId ? "Salin nomor" : "Copy phone"}
                  >
                    {copiedKey === "phone" ? (
                      <Check size={13} className="text-emerald-500" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>

                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="acc-wa-btn"
                      title={isId ? "Hubungi via WhatsApp" : "Contact via WhatsApp"}
                    >
                      <MessageCircle size={13} />
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* HERO ACTIONS */}
        <div className="acc-hero-actions">
          {isPendingApproval && (
            <button
              type="button"
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="acc-detail-btn acc-detail-btn--approve"
            >
              <CheckCheck size={16} />
              <span>
                {approveMutation.isPending
                  ? isId
                    ? "Memproses..."
                    : "Approving..."
                  : isId
                  ? "Setujui Akun"
                  : "Approve Account"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={publishMutation.isPending}
            className={`acc-detail-btn ${
              isLive ? "acc-detail-btn--deactivate" : "acc-detail-btn--activate"
            }`}
          >
            <Power size={16} />
            <span>
              {publishMutation.isPending
                ? isId
                  ? "Memproses..."
                  : "Updating..."
                : isLive
                ? isId
                  ? "Nonaktifkan"
                  : "Deactivate"
                : isId
                ? "Aktifkan Akun"
                : "Activate Account"}
            </span>
          </button>

          <Link
            to={`/admin/all-accounts/${id}/edit`}
            className="acc-detail-btn acc-detail-btn--primary"
          >
            <Pencil size={15} />
            <span>{isId ? "Edit Akun" : "Edit Account"}</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenDelete}
            disabled={!canDelete || deleteMutation.isPending}
            className="acc-detail-btn acc-detail-btn--danger"
            title={deleteDisabledTooltip}
          >
            <Trash2 size={15} />
            <span>{isId ? "Hapus" : "Delete"}</span>
          </button>
        </div>
      </section>

      {/* MAIN CONTENT GRID */}
      <div className="acc-detail-grid">
        {/* CARD 1: ACCOUNT & CONTACT DETAILS */}
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-card-header-icon is-navy">
              <User size={18} />
            </div>
            <div>
              <h2 className="acc-card-title">
                {isId ? "Informasi Akun & Kontak" : "Account & Contact Info"}
              </h2>
              <p className="acc-card-subtitle">
                {isId
                  ? "Identitas dasar dan status kredensial pengguna"
                  : "Primary identity and account status"}
              </p>
            </div>
          </div>

          <div className="acc-card-body">
            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "ID Akun" : "Account ID"}</span>
              <span className="acc-info-value font-mono">#{staff.id}</span>
            </div>

            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "Nama Lengkap" : "Full Name"}</span>
              <span className="acc-info-value font-medium">{staffName}</span>
            </div>

            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "Alamat Email" : "Email Address"}</span>
              <span className="acc-info-value">
                <a href={`mailto:${staffEmail}`} className="acc-link">
                  {staffEmail}
                </a>
              </span>
            </div>

            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "Nomor Telepon" : "Phone Number"}</span>
              <span className="acc-info-value font-mono">
                {staffPhone && staffPhone !== "-" ? staffPhone : (isId ? "Belum diisi" : "Not provided")}
              </span>
            </div>

            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "Peran Sistem" : "System Role"}</span>
              <div className="acc-info-value">
                <span
                  className={`staff-badge staff-badge--${
                    normalizeRole(staff.role) === "super_admin" ||
                    normalizeRole(staff.role) === "superadmin"
                      ? "superadmin"
                      : normalizeRole(staff.role) === "admin"
                      ? "admin"
                      : normalizeRole(staff.role) === "seller"
                      ? "seller"
                      : "staff"
                  }`}
                >
                  {formatRoleLabel(staff.role, isId)}
                </span>
              </div>
            </div>

            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "Status Akun" : "Account Status"}</span>
              <div className="acc-info-value">
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
                      ? "Menunggu Persetujuan"
                      : "Pending Approval"
                    : isLive
                    ? isId
                      ? "Aktif"
                      : "Active"
                    : isId
                    ? "Nonaktif"
                    : "Inactive"}
                </span>
              </div>
            </div>

            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "Terdaftar Sejak" : "Joined Date"}</span>
              <span className="acc-info-value">
                {formatFullDate(staff.createdAt, isId)}
              </span>
            </div>

            <div className="acc-info-row">
              <span className="acc-info-label">{isId ? "Pembaruan Terakhir" : "Last Updated"}</span>
              <span className="acc-info-value">
                {formatFullDate(staff.updatedAt, isId)}
              </span>
            </div>
          </div>
        </section>

        {/* CARD 2: CONNECTED STORE & OPERATIONS */}
        <section className="acc-card">
          <div className="acc-card-header">
            <div className="acc-card-header-icon is-orange">
              <Store size={18} />
            </div>
            <div>
              <h2 className="acc-card-title">
                {isId ? "Toko & Operasional" : "Store & Operations"}
              </h2>
              <p className="acc-card-subtitle">
                {isId
                  ? "Entitas toko dan permohonan operasional penjual"
                  : "Store entity and seller workspace verification"}
              </p>
            </div>
          </div>

          <div className="acc-card-body">
            {store ? (
              <div className="acc-store-box">
                <div className="acc-store-header">
                  <div>
                    <h3 className="acc-store-name">{store.name}</h3>
                    <p className="acc-store-slug">@{store.slug}</p>
                  </div>
                  <span
                    className={`acc-store-status-badge ${
                      String(store.status).toUpperCase() === "ACTIVE"
                        ? "is-active"
                        : "is-inactive"
                    }`}
                  >
                    ● {String(store.status).toUpperCase() === "ACTIVE"
                      ? isId
                        ? "Toko Aktif"
                        : "Store Active"
                      : store.status}
                  </span>
                </div>

                <div className="acc-store-links">
                  <a
                    href={`/stores/${store.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acc-store-link-btn"
                  >
                    <ExternalLink size={14} />
                    <span>{isId ? "Buka Toko Publik" : "Visit Public Store"}</span>
                  </a>

                  <Link
                    to={`/seller/stores/${store.slug}/workspace`}
                    className="acc-store-link-btn is-navy"
                  >
                    <Store size={14} />
                    <span>{isId ? "Ruang Kerja Penjual" : "Seller Workspace"}</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="acc-empty-box">
                <Store size={28} className="acc-empty-box-icon" />
                <p className="acc-empty-box-text">
                  {isId
                    ? "Akun ini belum memiliki toko terhubung."
                    : "No connected store associated with this account."}
                </p>
              </div>
            )}

            {/* Store Application details if present */}
            {storeApp && (
              <div className="acc-app-box">
                <div className="acc-app-box-top">
                  <div>
                    <span className="acc-app-label">
                      {isId ? "Permohonan Toko" : "Store Application"}
                    </span>
                    <h4 className="acc-app-id">ID #{storeApp.id}</h4>
                  </div>
                  <span className="acc-app-status-badge">
                    {storeApp.status}
                  </span>
                </div>

                {storeApp.submittedAt && (
                  <p className="acc-app-date">
                    <Calendar size={13} />
                    {isId ? "Diajukan: " : "Submitted: "}
                    {formatShortDate(storeApp.submittedAt, isId)}
                  </p>
                )}

                <Link
                  to={`/admin/store/applications/${storeApp.id}`}
                  className="acc-app-link"
                >
                  <ExternalLink size={14} />
                  <span>{isId ? "Tinjau Berkas Permohonan" : "Review Application Dossier"}</span>
                </Link>
              </div>
            )}

            {/* Quick action buttons */}
            <div className="acc-quick-actions">
              <span className="acc-quick-title">
                {isId ? "Pintasan Tindakan" : "Quick Actions"}
              </span>
              <div className="acc-quick-btn-grid">
                <a
                  href={`mailto:${staffEmail}`}
                  className="acc-quick-btn"
                  title={isId ? "Kirim Email" : "Send Email"}
                >
                  <Mail size={14} />
                  <span>Email</span>
                </a>

                {waNumber ? (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="acc-quick-btn is-wa"
                    title={isId ? "Kirim Pesan WhatsApp" : "Send WhatsApp"}
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </a>
                ) : null}

                <Link
                  to={`/admin/orders`}
                  className="acc-quick-btn"
                  title={isId ? "Semua Pesanan" : "All Orders"}
                >
                  <ExternalLink size={14} />
                  <span>{isId ? "Pesanan" : "Orders"}</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CARD 3: PERMISSIONS & ROLES */}
        <section className="acc-card acc-card--full">
          <div className="acc-card-header">
            <div className="acc-card-header-icon is-navy">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="acc-card-title">
                {isId ? "Hak Akses & Otoritas" : "Permissions & Authority"}
              </h2>
              <p className="acc-card-subtitle">
                {isId
                  ? "Daftar hak akses dan batasan operasional untuk akun ini"
                  : "Assigned access rights and system capabilities"}
              </p>
            </div>
          </div>

          <div className="acc-card-body">
            {staff.sellerRoleCode && (
              <div className="acc-rolecode-banner">
                <span className="acc-rolecode-title">
                  {isId ? "Paket Peran Penjual: " : "Seller Preset: "}
                </span>
                <strong className="acc-rolecode-val">{staff.sellerRoleCode}</strong>
              </div>
            )}

            {permissions.length > 0 ? (
              <div className="acc-perms-wrap">
                <span className="acc-perms-summary">
                  {isId
                    ? `${permissions.length} Hak Akses Terpasang:`
                    : `${permissions.length} Assigned Permissions:`}
                </span>
                <div className="acc-perms-list">
                  {permissions.map((key) => {
                    const labelObj = PERMISSION_LABEL_MAP[key];
                    const label = labelObj
                      ? isId
                        ? labelObj.id
                        : labelObj.en
                      : key;

                    return (
                      <div key={key} className="acc-perm-pill">
                        <Check size={13} className="acc-perm-check" />
                        <span className="acc-perm-title">{label}</span>
                        <code className="acc-perm-key">{key}</code>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="acc-empty-box">
                <p className="acc-empty-box-text">
                  {isPrivilegedRole(staff.role)
                    ? isId
                      ? "Akun Administrator memiliki akses menyeluruh ke seluruh modul sistem."
                      : "Administrator account possesses full unrestricted access to system modules."
                    : isId
                    ? "Tidak ada perizinan kustom yang disematkan."
                    : "No specific individual permission overrides configured."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* EDIT DRAWER */}
      <EditStaffDrawer
        open={isEditModalOpen}
        onClose={handleCloseEdit}
        staff={staff}
        currentUser={currentUser}
        rolesOptions={roleOptions}
        onSubmit={handleSubmitEdit}
        isSubmitting={updateMutation.isPending}
        error={editDrawerError}
        canManageRoles={isSuperAdminRole(currentUser?.role)}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteCouponModal
        open={isDeleteModalOpen}
        onClose={handleCloseDelete}
        onConfirm={handleConfirmDelete}
        title={isId ? "Hapus Akun Pengguna?" : "Delete User Account?"}
        description={
          isId
            ? `Apakah Anda yakin ingin menghapus akun ${staffName}? Seluruh riwayat akses terkait akan dinonaktifkan.`
            : `Are you sure you want to delete ${staffName}'s account? This action cannot be reversed.`
        }
        cancelLabel={isId ? "Batal" : "Cancel"}
        confirmLabel={isId ? "Ya, Hapus Akun" : "Yes, Delete Account"}
        isLoading={deleteMutation.isPending}
        errorMessage={deleteModalError}
      />
    </div>
  );
}
