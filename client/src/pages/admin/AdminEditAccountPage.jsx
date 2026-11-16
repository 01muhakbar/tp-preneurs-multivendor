import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Lock,
  Mail,
  Pencil,
  Phone,
  Power,
  RotateCcw,
  Save,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  User,
} from "lucide-react";

import { fetchStaffById, updateStaff } from "../../api/adminStaff.ts";
import { useAuth } from "../../auth/useAuth.js";
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator.jsx";
import {
  getSellerPreset,
  normalizePermissionKeys,
  SELLER_PERMISSION_GROUPS,
  SELLER_ROLE_PRESETS,
  STAFF_IMAGE_UPLOAD_GUIDANCE,
} from "../../components/admin/staff/staffAccessConfig.js";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { GENERIC_ERROR } from "../../constants/uiMessages.js";
import "./AdminEditAccountPage.css";

const ROLE_OPTIONS = [
  {
    value: "super_admin",
    labelEn: "Super Admin",
    labelId: "Super Admin",
    descEn: "Full workspace authority, configuration, and account access.",
    descId: "Akses penuh wewenang sistem, konfigurasi, dan akun.",
  },
  {
    value: "admin",
    labelEn: "Admin",
    labelId: "Admin",
    descEn: "Operational admin authority without super-admin global control.",
    descId: "Akses operasional admin tanpa kontrol global super-admin.",
  },
  {
    value: "staff",
    labelEn: "Staff",
    labelId: "Staf",
    descEn: "Standard workspace access for daily orders and catalog lanes.",
    descId: "Akses standar untuk pesanan harian dan manajemen katalog.",
  },
  {
    value: "seller",
    labelEn: "Seller",
    labelId: "Penjual",
    descEn: "Seller workspace account for store, catalog, and order handling.",
    descId: "Akun ruang kerja penjual untuk toko, katalog, dan pesanan.",
  },
];

const defaultSellerPreset = getSellerPreset(SELLER_ROLE_PRESETS[0]?.value);

const initialForm = {
  name: "",
  email: "",
  phoneNumber: "",
  role: "staff",
  isActive: true,
  sellerRoleCode: defaultSellerPreset?.value || "CATALOG_MANAGER",
  permissionKeys: defaultSellerPreset?.permissionKeys || [],
  password: "",
  passwordConfirm: "",
};

const toText = (value) => String(value ?? "").trim();
const toRoleValue = (value) => toText(value).toLowerCase().replace(/\s+/g, "_");

const isStrongPassword = (value) =>
  String(value || "").length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

const getInitials = (text) => {
  const clean = String(text || "").trim();
  if (!clean) return "U";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

export default function AdminEditAccountPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);
  const [validationError, setValidationError] = useState("");

  const staffQuery = useQuery({
    queryKey: ["admin-staff-detail", id],
    queryFn: () => fetchStaffById(id),
    enabled: Boolean(id),
  });

  const staff = staffQuery.data;

  // Initialize form when staff data loads
  useEffect(() => {
    if (!staff) return;

    const normalizedRole = toRoleValue(staff.role) || "staff";
    const preset = getSellerPreset(staff.sellerRoleCode || defaultSellerPreset?.value);

    setForm({
      name: toText(staff.name),
      email: toText(staff.email),
      phoneNumber: toText(staff.phoneNumber ?? staff.phone),
      role: normalizedRole,
      isActive: staff.isActive !== false && staff.isPublished !== false,
      sellerRoleCode: preset?.value || defaultSellerPreset?.value || "CATALOG_MANAGER",
      permissionKeys:
        normalizedRole === "seller"
          ? normalizePermissionKeys(
              staff.permissionKeys?.length ? staff.permissionKeys : preset?.permissionKeys
            )
          : [],
      password: "",
      passwordConfirm: "",
    });

    setCurrentAvatarUrl(resolveAssetUrl(toText(staff.avatarUrl)));
    setImageFile(null);
    setImagePreview("");
    setValidationError("");
  }, [staff]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const isSuperAdmin =
    toRoleValue(currentUser?.role) === "super_admin" ||
    toRoleValue(currentUser?.role) === "superadmin";

  const isEditingOwnAccount =
    Number(currentUser?.id || 0) > 0 &&
    Number(id || 0) > 0 &&
    Number(currentUser?.id) === Number(id);

  const isOwnSuperAdminAccount =
    isEditingOwnAccount &&
    toRoleValue(currentUser?.role) === "super_admin" &&
    toRoleValue(staff?.role) === "super_admin";

  // Filter allowed roles based on privilege
  const allowedRoles = useMemo(() => {
    if (isSuperAdmin) return ROLE_OPTIONS;
    return ROLE_OPTIONS.filter((r) => r.value !== "super_admin");
  }, [isSuperAdmin]);

  const updateMutation = useMutation({
    mutationFn: (payload) => updateStaff(id, payload),
    onSuccess: (updated) => {
      toast.success(
        isId ? "Perubahan akun berhasil disimpan!" : "Account changes saved successfully!"
      );
      queryClient.setQueryData(["admin-staff-detail", id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      navigate(`/admin/all-accounts/${id}`);
    },
    onError: (error) => {
      const msg = error?.response?.data?.message ?? error?.message ?? GENERIC_ERROR;
      toast.error(msg);
      setValidationError(msg);
    },
  });

  const handleFieldChange = (field, value) => {
    setValidationError("");
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (role) => {
    if (isOwnSuperAdminAccount) return;
    setValidationError("");
    setForm((prev) => {
      const nextRole = role;
      const isSeller = nextRole === "seller";
      const preset = getSellerPreset(prev.sellerRoleCode);
      return {
        ...prev,
        role: nextRole,
        permissionKeys: isSeller ? normalizePermissionKeys(preset?.permissionKeys) : [],
      };
    });
  };

  const handleSellerPresetChange = (presetCode) => {
    const preset = getSellerPreset(presetCode);
    setValidationError("");
    setForm((prev) => ({
      ...prev,
      sellerRoleCode: preset.value,
      permissionKeys: [...preset.permissionKeys],
    }));
  };

  const handlePermissionToggle = (permKey) => {
    setValidationError("");
    setForm((prev) => {
      const exists = prev.permissionKeys.includes(permKey);
      const next = exists
        ? prev.permissionKeys.filter((k) => k !== permKey)
        : [...prev.permissionKeys, permKey];
      return {
        ...prev,
        permissionKeys: normalizePermissionKeys(next),
      };
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      const msg = isId
        ? "Ukuran berkas maksimal 2 MB."
        : "File size exceeds 2 MB limit.";
      toast.error(msg);
      setValidationError(msg);
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setValidationError("");
  };

  const handleRemoveNewImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError("");

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password;
    const confirm = form.passwordConfirm;

    if (!name) {
      setValidationError(isId ? "Nama lengkap wajib diisi." : "Full name is required.");
      return;
    }

    if (!email || !email.includes("@")) {
      setValidationError(isId ? "Alamat email tidak valid." : "Valid email address is required.");
      return;
    }

    if (password) {
      if (!isStrongPassword(password)) {
        setValidationError(
          isId
            ? "Kata sandi minimal 8 karakter dan mengandung huruf & angka."
            : "Password must be at least 8 characters with letters and numbers."
        );
        return;
      }

      if (password !== confirm) {
        setValidationError(
          isId
            ? "Konfirmasi kata sandi tidak cocok."
            : "Password confirmation does not match."
        );
        return;
      }
    }

    if (form.role === "seller" && form.permissionKeys.length === 0) {
      setValidationError(
        isId
          ? "Pilih minimal satu hak akses untuk peran penjual."
          : "Select at least one permission for the seller role."
      );
      return;
    }

    const payload = {
      name,
      email,
      phoneNumber: form.phoneNumber.trim() || null,
      role: form.role,
      isActive: Boolean(form.isActive),
      isPublished: Boolean(form.isActive),
      sellerRoleCode: form.role === "seller" ? form.sellerRoleCode : null,
      permissionKeys: form.role === "seller" ? normalizePermissionKeys(form.permissionKeys) : [],
      ...(password ? { password } : {}),
      ...(imageFile ? { image: imageFile } : {}),
    };

    updateMutation.mutate(payload);
  };

  // Loading Skeleton
  if (staffQuery.isLoading) {
    return (
      <div className="admin-edit-account-page">
        <div className="edit-acc-skeleton-bar" style={{ width: 180, height: 16 }} />
        <div className="edit-acc-skeleton-hero" />
        <div className="edit-acc-skeleton-card" />
        <div className="edit-acc-skeleton-card" />
      </div>
    );
  }

  // Error State
  if (staffQuery.isError || !staff) {
    return (
      <div className="admin-edit-account-page">
        <nav className="edit-acc-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/admin">Admin</Link>
          <span>/</span>
          <Link to="/admin/all-accounts">{isId ? "Semua Akun" : "All Accounts"}</Link>
          <span>/</span>
          <span className="active">{isId ? "Edit Akun" : "Edit Account"}</span>
        </nav>

        <div className="edit-acc-error-box">
          <ShieldAlert size={36} className="text-rose-500" />
          <h2>{isId ? "Akun Tidak Ditemukan" : "Account Not Found"}</h2>
          <p>
            {isId
              ? "Akun yang ingin diperbarui tidak ditemukan di sistem."
              : "The account you are attempting to edit does not exist."}
          </p>
          <Link to="/admin/all-accounts" className="edit-acc-btn edit-acc-btn--primary">
            <ArrowLeft size={16} />
            {isId ? "Kembali ke Semua Akun" : "Back to All Accounts"}
          </Link>
        </div>
      </div>
    );
  }

  const staffName = staff.name || `#${staff.id}`;
  const displayAvatar = imagePreview || currentAvatarUrl;

  return (
    <div className="admin-edit-account-page">
      {/* BREADCRUMBS */}
      <nav className="edit-acc-breadcrumbs" aria-label="Breadcrumb">
        <Link to="/admin">Admin</Link>
        <span>/</span>
        <Link to="/admin/all-accounts">{isId ? "Semua Akun" : "All Accounts"}</Link>
        <span>/</span>
        <Link to={`/admin/all-accounts/${id}`}>{staffName}</Link>
        <span>/</span>
        <span className="active">{isId ? "Edit Akun" : "Edit Account"}</span>
      </nav>

      {/* TOP HERO */}
      <header className="edit-acc-hero">
        <div className="edit-acc-hero-left">
          <Link to={`/admin/all-accounts/${id}`} className="edit-acc-back-btn">
            <ArrowLeft size={16} />
          </Link>
          <div className="edit-acc-hero-text">
            <h1>{isId ? "Perbarui Akun Pengguna" : "Update User Account"}</h1>
            <p>
              {isId
                ? `Edit data profil, hak akses, dan kata sandi untuk akun #${staff.id} (${staffName}).`
                : `Edit profile, access scope, and credentials for account #${staff.id} (${staffName}).`}
            </p>
          </div>
        </div>

        <div className="edit-acc-hero-actions">
          <Link
            to={`/admin/all-accounts/${id}`}
            className="edit-acc-btn edit-acc-btn--secondary"
          >
            {isId ? "Batal" : "Cancel"}
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={updateMutation.isPending}
            className="edit-acc-btn edit-acc-btn--primary"
          >
            <Save size={16} />
            <span>
              {updateMutation.isPending
                ? isId
                  ? "Menyimpan..."
                  : "Saving..."
                : isId
                ? "Simpan Perubahan"
                : "Save Changes"}
            </span>
          </button>
        </div>
      </header>

      {/* VALIDATION ERROR BANNER */}
      {validationError && (
        <div className="edit-acc-alert is-error">
          <ShieldAlert size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="edit-acc-form">
        {/* CARD 1: PROFILE IMAGE */}
        <section className="edit-acc-card">
          <div className="edit-acc-card-header">
            <div className="edit-acc-card-icon is-navy">
              <ImagePlus size={18} />
            </div>
            <div>
              <h2>{isId ? "Foto Profil" : "Profile Picture"}</h2>
              <p className="edit-acc-card-desc">
                {isId
                  ? "Format didukung: JPG, PNG, WEBP (maks. 2 MB)."
                  : "Supported formats: JPG, PNG, WEBP (max 2 MB)."}
              </p>
            </div>
          </div>

          <div className="edit-acc-avatar-row">
            <div className="edit-acc-avatar-preview">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={form.name || "Preview"}
                  className="edit-acc-avatar-img"
                />
              ) : (
                <div className="edit-acc-avatar-placeholder">
                  {getInitials(form.name || staffName)}
                </div>
              )}
            </div>

            <div className="edit-acc-avatar-controls">
              <label className="edit-acc-upload-btn">
                <Upload size={14} />
                <span>{displayAvatar ? (isId ? "Ganti Foto" : "Change Photo") : (isId ? "Unggah Foto" : "Upload Photo")}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="sr-only"
                />
              </label>

              {imageFile && (
                <button
                  type="button"
                  onClick={handleRemoveNewImage}
                  className="edit-acc-remove-btn"
                  title={isId ? "Batal ganti foto" : "Cancel new photo"}
                >
                  <RotateCcw size={14} />
                  <span>{isId ? "Batal" : "Revert"}</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* CARD 2: BASIC INFO */}
        <section className="edit-acc-card">
          <div className="edit-acc-card-header">
            <div className="edit-acc-card-icon is-navy">
              <User size={18} />
            </div>
            <div>
              <h2>{isId ? "Informasi Kontak & Identitas" : "Identity & Contact Details"}</h2>
              <p className="edit-acc-card-desc">
                {isId
                  ? "Nama lengkap, alamat email resmi, dan nomor telepon kontak"
                  : "Full name, primary email address, and operational phone number"}
              </p>
            </div>
          </div>

          <div className="edit-acc-grid-2">
            <div className="edit-acc-field">
              <label className="edit-acc-label">
                {isId ? "Nama Lengkap" : "Full Name"}
                <span className="edit-acc-req">*</span>
              </label>
              <div className="edit-acc-input-wrap">
                <User size={15} className="edit-acc-input-icon" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder={isId ? "Contoh: Budi Santoso" : "e.g. John Doe"}
                  className="edit-acc-input has-icon"
                />
              </div>
            </div>

            <div className="edit-acc-field">
              <label className="edit-acc-label">
                {isId ? "Alamat Email" : "Email Address"}
                <span className="edit-acc-req">*</span>
              </label>
              <div className="edit-acc-input-wrap">
                <Mail size={15} className="edit-acc-input-icon" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="user@example.com"
                  className="edit-acc-input has-icon"
                />
              </div>
            </div>

            <div className="edit-acc-field span-full">
              <label className="edit-acc-label">
                {isId ? "Nomor Telepon / WhatsApp" : "Phone / WhatsApp Number"}
              </label>
              <div className="edit-acc-input-wrap">
                <Phone size={15} className="edit-acc-input-icon" />
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="edit-acc-input has-icon"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CARD 3: ROLE & ACCESS */}
        <section className="edit-acc-card">
          <div className="edit-acc-card-header">
            <div className="edit-acc-card-icon is-orange">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2>{isId ? "Peran & Status Akses" : "Role & Access Scope"}</h2>
              <p className="edit-acc-card-desc">
                {isId
                  ? "Tentukan tingkat kewenangan sistem dan status operasional akun"
                  : "Configure system authorization tier and operational account status"}
              </p>
            </div>
          </div>

          {/* STATUS TOGGLE */}
          <div className="edit-acc-status-box">
            <div className="edit-acc-status-info">
              <span className="edit-acc-status-title">
                {isId ? "Status Akun Aktif" : "Account Active Status"}
              </span>
              <p className="edit-acc-status-desc">
                {form.isActive
                  ? isId
                    ? "Akun dapat masuk dan mengakses seluruh fitur sesuai perannya."
                    : "Account can sign in and perform workspace actions."
                  : isId
                  ? "Akun dinonaktifkan dan diblokir dari login sementara."
                  : "Account is disabled and blocked from logging in."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleFieldChange("isActive", !form.isActive)}
              className={`staff-toggle-switch ${form.isActive ? "is-on" : "is-off"}`}
              title={isId ? "Ubah status aktif" : "Toggle active state"}
            >
              <span className="staff-toggle-knob" />
            </button>
          </div>

          {/* ROLE SELECTOR CARDS */}
          <div className="edit-acc-roles-grid">
            {allowedRoles.map((role) => {
              const isSelected = form.role === role.value;
              const isDisabled = isOwnSuperAdminAccount && role.value !== "super_admin";

              return (
                <label
                  key={role.value}
                  className={`edit-acc-role-card ${isSelected ? "is-selected" : ""} ${
                    isDisabled ? "is-disabled" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="accountRole"
                    value={role.value}
                    checked={isSelected}
                    disabled={isDisabled}
                    onChange={() => handleRoleChange(role.value)}
                    className="sr-only"
                  />
                  <div className="edit-acc-role-top">
                    <span className="edit-acc-role-title">
                      {isId ? role.labelId : role.labelEn}
                    </span>
                    {isSelected && <Check size={14} className="edit-acc-role-check" />}
                  </div>
                  <span className="edit-acc-role-desc">
                    {isId ? role.descId : role.descEn}
                  </span>
                </label>
              );
            })}
          </div>

          {/* SELLER SPECIFIC CONFIGURATION */}
          {form.role === "seller" && (
            <div className="edit-acc-seller-box">
              {staff.store && (
                <div className="edit-acc-connected-store">
                  <Store size={16} className="text-[#fe6f05]" />
                  <div>
                    <span className="edit-acc-store-name">{staff.store.name}</span>
                    <span className="edit-acc-store-slug"> (@{staff.store.slug})</span>
                  </div>
                  <span className="edit-acc-store-badge">
                    {staff.store.status || "ACTIVE"}
                  </span>
                </div>
              )}

              <div className="edit-acc-field">
                <label className="edit-acc-label">
                  {isId ? "Preset Peran Penjual" : "Seller Role Preset"}
                </label>
                <select
                  value={form.sellerRoleCode}
                  onChange={(e) => handleSellerPresetChange(e.target.value)}
                  className="edit-acc-input"
                >
                  {SELLER_ROLE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="edit-acc-perm-groups">
                <span className="edit-acc-label">
                  {isId ? "Hak Akses Toko Terpasang" : "Granted Store Permissions"}
                </span>
                {SELLER_PERMISSION_GROUPS.map((group) => (
                  <div key={group.id} className="edit-acc-perm-group">
                    <span className="edit-acc-perm-group-title">{group.title}</span>
                    <div className="edit-acc-perm-chips">
                      {group.permissions.map((perm) => (
                        <label key={perm.value} className="edit-acc-perm-chip">
                          <input
                            type="checkbox"
                            checked={form.permissionKeys.includes(perm.value)}
                            onChange={() => handlePermissionToggle(perm.value)}
                          />
                          <span>{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CARD 4: PASSWORD & SECURITY */}
        <section className="edit-acc-card">
          <div className="edit-acc-card-header">
            <div className="edit-acc-card-icon is-navy">
              <KeyRound size={18} />
            </div>
            <div>
              <h2>{isId ? "Keamanan & Kata Sandi" : "Security & Password"}</h2>
              <p className="edit-acc-card-desc">
                {isId
                  ? "Kosongkan kolom jika Anda tidak ingin mengubah kata sandi akun saat ini."
                  : "Leave password fields empty to keep existing password."}
              </p>
            </div>
          </div>

          <div className="edit-acc-grid-2">
            <div className="edit-acc-field">
              <label className="edit-acc-label">
                {isId ? "Kata Sandi Baru (Opsional)" : "New Password (Optional)"}
              </label>
              <div className="edit-acc-input-wrap">
                <Lock size={15} className="edit-acc-input-icon" />
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  placeholder={
                    isId ? "Kosongkan jika tetap sama" : "Leave blank to keep unchanged"
                  }
                  className="edit-acc-input has-icon has-toggle"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible((prev) => !prev)}
                  className="edit-acc-pwd-toggle"
                  title={passwordVisible ? "Sembunyikan" : "Tampilkan"}
                >
                  {passwordVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {form.password && (
                <div className="edit-acc-pwd-strength">
                  <PasswordStrengthIndicator password={form.password} />
                </div>
              )}
            </div>

            <div className="edit-acc-field">
              <label className="edit-acc-label">
                {isId ? "Konfirmasi Kata Sandi Baru" : "Confirm New Password"}
              </label>
              <div className="edit-acc-input-wrap">
                <Lock size={15} className="edit-acc-input-icon" />
                <input
                  type={passwordConfirmVisible ? "text" : "password"}
                  value={form.passwordConfirm}
                  onChange={(e) => handleFieldChange("passwordConfirm", e.target.value)}
                  placeholder={
                    isId ? "Ulangi kata sandi baru" : "Repeat new password"
                  }
                  className="edit-acc-input has-icon has-toggle"
                />
                <button
                  type="button"
                  onClick={() => setPasswordConfirmVisible((prev) => !prev)}
                  className="edit-acc-pwd-toggle"
                  title={passwordConfirmVisible ? "Sembunyikan" : "Tampilkan"}
                >
                  {passwordConfirmVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* BOTTOM STICKY BAR */}
        <div className="edit-acc-bottom-bar">
          <Link
            to={`/admin/all-accounts/${id}`}
            className="edit-acc-btn edit-acc-btn--secondary"
          >
            {isId ? "Batal" : "Cancel"}
          </Link>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="edit-acc-btn edit-acc-btn--primary"
          >
            <Save size={16} />
            <span>
              {updateMutation.isPending
                ? isId
                  ? "Menyimpan..."
                  : "Saving Changes..."
                : isId
                ? "Simpan Perubahan Akun"
                : "Save Account Changes"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
