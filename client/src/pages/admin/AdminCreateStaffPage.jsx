import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Store,
  Trash2,
  Upload,
  User,
  UserPlus,
  UsersRound,
} from "lucide-react";

import { createStaff } from "../../api/adminStaff.ts";
import { useAuth } from "../../auth/useAuth.js";
import PasswordStrengthIndicator from "../../components/auth/PasswordStrengthIndicator.jsx";
import {
  getSellerPreset,
  SELLER_PERMISSION_GROUPS,
  SELLER_ROLE_PRESETS,
  STAFF_IMAGE_UPLOAD_GUIDANCE,
} from "../../components/admin/staff/staffAccessConfig.js";
import { GENERIC_ERROR } from "../../constants/uiMessages.js";
import "./AdminCreateStaffPage.css";

const ROLE_OPTIONS = [
  {
    value: "super_admin",
    labelEn: "Super Admin",
    labelId: "Super Admin",
    descEn: "Full admin workspace access, including account and settings management.",
    descId: "Akses penuh ruang kerja admin, termasuk pengelolaan akun dan pengaturan.",
  },
  {
    value: "admin",
    labelEn: "Admin",
    labelId: "Admin",
    descEn: "Operational admin workspace access without super-admin global control.",
    descId: "Akses operasional ruang kerja admin tanpa kontrol global super-admin.",
  },
  {
    value: "staff",
    labelEn: "Staff",
    labelId: "Staf",
    descEn: "Standard admin workspace access for day-to-day dashboard and order lanes.",
    descId: "Akses standar admin untuk aktivitas dasbor harian dan pemrosesan pesanan.",
  },
  {
    value: "seller",
    labelEn: "Seller",
    labelId: "Penjual",
    descEn: "Seller workspace account. Manages store, products, orders, and withdrawals.",
    descId: "Akun ruang kerja penjual. Mengelola toko, produk, pesanan, dan penarikan.",
  },
];

const defaultSellerPreset = getSellerPreset(SELLER_ROLE_PRESETS[0]?.value);

const initialForm = {
  name: "",
  email: "",
  phoneNumber: "",
  password: "",
  passwordConfirm: "",
  role: "staff",
  isActive: true,
  storeName: "",
  sellerRoleCode: defaultSellerPreset?.value || "CATALOG_MANAGER",
  permissionKeys: defaultSellerPreset?.permissionKeys || [],
};

const isStrongPassword = (value) =>
  String(value || "").length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

const getInitials = (text) => {
  const clean = String(text || "").trim();
  if (!clean) return "A";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

export default function AdminCreateStaffPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const { i18n } = useTranslation();
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);
  const [validationError, setValidationError] = useState("");

  const isSuperAdmin =
    String(currentUser?.role || "").toLowerCase() === "super_admin" ||
    String(currentUser?.role || "").toLowerCase() === "superadmin";

  // Allowed role options based on user privilege
  const allowedRoles = useMemo(() => {
    if (isSuperAdmin) return ROLE_OPTIONS;
    return ROLE_OPTIONS.filter((r) => r.value !== "super_admin");
  }, [isSuperAdmin]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const createMutation = useMutation({
    mutationFn: createStaff,
    onSuccess: () => {
      toast.success(
        isId ? "Akun baru berhasil dibuat!" : "New workspace account created!"
      );
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      navigate("/admin/all-accounts");
    },
    onError: (error) => {
      const msg =
        error?.response?.data?.message ?? error?.message ?? GENERIC_ERROR;
      toast.error(msg);
      setValidationError(msg);
    },
  });

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setValidationError("");
  };

  const handleRoleChange = (roleValue) => {
    setForm((prev) => {
      const next = { ...prev, role: roleValue };
      if (roleValue === "seller") {
        const preset = getSellerPreset(next.sellerRoleCode);
        next.permissionKeys = preset?.permissionKeys || [];
      }
      return next;
    });
  };

  const handleSellerPresetChange = (presetValue) => {
    const preset = getSellerPreset(presetValue);
    setForm((prev) => ({
      ...prev,
      sellerRoleCode: presetValue,
      permissionKeys: preset?.permissionKeys || [],
    }));
  };

  const handlePermissionToggle = (permKey) => {
    setForm((prev) => {
      const exists = prev.permissionKeys.includes(permKey);
      const nextKeys = exists
        ? prev.permissionKeys.filter((k) => k !== permKey)
        : [...prev.permissionKeys, permKey];
      return { ...prev, permissionKeys: nextKeys };
    });
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error(
        isId ? "Ukuran file foto maksimal 2 MB." : "Image file size max 2 MB."
      );
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
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

    if (form.role === "seller" && !form.storeName.trim()) {
      setValidationError(isId ? "Nama toko wajib diisi untuk peran penjual." : "Store name is required for seller role.");
      return;
    }

    if (!password) {
      setValidationError(isId ? "Kata sandi wajib diisi." : "Password is required.");
      return;
    }

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

    createMutation.mutate({
      name,
      email,
      phoneNumber: form.phoneNumber.trim() || null,
      role: form.role,
      storeName: form.role === "seller" ? form.storeName.trim() : null,
      sellerRoleCode: form.role === "seller" ? form.sellerRoleCode : null,
      permissionKeys: form.role === "seller" ? form.permissionKeys : [],
      isActive: form.isActive,
      password,
      image: imageFile,
    });
  };

  return (
    <div className="admin-create-staff-2026">
      {/* BREADCRUMBS */}
      <nav className="create-staff-breadcrumbs" aria-label="Breadcrumbs">
        <Link to="/admin">{isId ? "Admin" : "Admin"}</Link>
        <span>/</span>
        <Link to="/admin/all-accounts">{isId ? "Semua Akun" : "All Accounts"}</Link>
        <span>/</span>
        <span className="active">{isId ? "Tambah Akun" : "Create Account"}</span>
      </nav>

      {/* HERO SECTION */}
      <header className="create-staff-hero">
        <div className="create-staff-hero-left">
          <div className="create-staff-hero-icon">
            <UserPlus size={22} />
          </div>
          <div className="create-staff-hero-text">
            <h1>{isId ? "Tambah Akun Baru" : "Create Account"}</h1>
            <p>
              {isId
                ? "Buat akun ruang kerja baru dengan kontrol akses berbasis peran."
                : "Create a new workspace account and set its role-based permissions."}
            </p>
          </div>
        </div>

        <Link
          to="/admin/all-accounts"
          className="create-staff-btn"
          title={isId ? "Kembali ke daftar akun" : "Back to accounts list"}
        >
          <ArrowLeft size={14} />
          {isId ? "Kembali" : "Back to List"}
        </Link>
      </header>

      {/* ERROR BANNER */}
      {validationError && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--staff-radius-md)",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "0.813rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ShieldAlert size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* MAIN FORM */}
      <form onSubmit={handleSubmit} className="create-staff-form" noValidate>
        {/* CARD 1: PROFILE PICTURE */}
        <div className="create-staff-card">
          <div className="create-staff-card-header">
            <div className="create-staff-card-icon">
              <ImagePlus size={16} />
            </div>
            <div>
              <h2>{isId ? "Foto Profil" : "Profile Picture"}</h2>
              <p>
                {isId
                  ? "Unggah foto profil anggota (opsional)"
                  : "Upload member avatar picture (optional)"}
              </p>
            </div>
          </div>

          <div className="create-staff-avatar-grid">
            <div className="create-staff-avatar-preview">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview Avatar" />
              ) : (
                <span>{getInitials(form.name)}</span>
              )}
            </div>

            <div className="create-staff-upload-actions">
              <div className="create-staff-upload-btn-row">
                <label className="create-staff-btn create-staff-btn--primary">
                  <Upload size={14} />
                  {isId ? "Pilih Foto" : "Upload Image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageSelect}
                    style={{ display: "none" }}
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="create-staff-btn"
                    title={isId ? "Hapus foto" : "Remove photo"}
                  >
                    <Trash2 size={14} />
                    {isId ? "Hapus" : "Remove"}
                  </button>
                )}
              </div>
              <span className="create-staff-upload-help">
                {isId
                  ? `Format didukung: ${STAFF_IMAGE_UPLOAD_GUIDANCE.formats}. Maks. ${STAFF_IMAGE_UPLOAD_GUIDANCE.maxSize}, rasio 1:1.`
                  : `Supported: ${STAFF_IMAGE_UPLOAD_GUIDANCE.formats}. Max ${STAFF_IMAGE_UPLOAD_GUIDANCE.maxSize}, 1:1 square.`}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 2: BASIC INFORMATION */}
        <div className="create-staff-card">
          <div className="create-staff-card-header">
            <div className="create-staff-card-icon">
              <User size={16} />
            </div>
            <div>
              <h2>{isId ? "Informasi Dasar" : "Basic Information"}</h2>
              <p>
                {isId
                  ? "Detail identitas dan kontak pemilik akun"
                  : "Identity and contact details for the new account"}
              </p>
            </div>
          </div>

          <div className="create-staff-fields-grid">
            <div className="create-staff-field">
              <label className="create-staff-label">
                {isId ? "Nama Lengkap" : "Full Name"}
                <span className="create-staff-required">*</span>
              </label>
              <div className="create-staff-input-wrap">
                <User size={14} className="create-staff-icon-left" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  placeholder={isId ? "Contoh: Budi Santoso" : "e.g. John Doe"}
                  className="create-staff-input has-icon-left"
                />
              </div>
            </div>

            <div className="create-staff-field">
              <label className="create-staff-label">
                {isId ? "Alamat Email" : "Email Address"}
                <span className="create-staff-required">*</span>
              </label>
              <div className="create-staff-input-wrap">
                <Mail size={14} className="create-staff-icon-left" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  placeholder="name@example.com"
                  className="create-staff-input has-icon-left"
                />
              </div>
            </div>

            <div className="create-staff-field span-2">
              <label className="create-staff-label">
                {isId ? "Nomor Telepon / WhatsApp" : "Contact / Mobile Number"}
              </label>
              <div className="create-staff-input-wrap">
                <Phone size={14} className="create-staff-icon-left" />
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) => handleFieldChange("phoneNumber", e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="create-staff-input has-icon-left"
                />
              </div>
              <span className="create-staff-field-desc">
                {isId
                  ? "Digunakan untuk komunikasi operasional dan notifikasi penting."
                  : "Used for operational communication and critical alerts."}
              </span>
            </div>
          </div>
        </div>

        {/* CARD 3: ACCOUNT ROLE & PERMISSIONS */}
        <div className="create-staff-card">
          <div className="create-staff-card-header">
            <div className="create-staff-card-icon">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2>{isId ? "Peran & Hak Akses" : "Account Role & Permissions"}</h2>
              <p>
                {isId
                  ? "Tentukan tingkatan wewenang akun pada sistem"
                  : "Define the authorization level and scope of access"}
              </p>
            </div>
          </div>

          <div className="create-staff-roles-list">
            {allowedRoles.map((role) => (
              <label
                key={role.value}
                className={`create-staff-role-card ${form.role === role.value ? "is-selected" : ""}`}
              >
                <input
                  type="radio"
                  name="accountRole"
                  value={role.value}
                  checked={form.role === role.value}
                  onChange={() => handleRoleChange(role.value)}
                  className="create-staff-role-radio"
                />
                <div className="create-staff-role-info">
                  <span className="create-staff-role-title">
                    {isId ? role.labelId : role.labelEn}
                  </span>
                  <span className="create-staff-role-desc">
                    {isId ? role.descId : role.descEn}
                  </span>
                </div>
              </label>
            ))}
          </div>

          {/* Conditional Seller Configurations */}
          {form.role === "seller" && (
            <div className="create-staff-seller-box">
              <div className="create-staff-seller-badge">
                <Store size={13} />
                <span>{isId ? "Konfigurasi Toko Penjual" : "Seller Store Setup"}</span>
              </div>

              <div className="create-staff-field">
                <label className="create-staff-label">
                  {isId ? "Nama Toko Penjual" : "Seller Store Name"}
                  <span className="create-staff-required">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.storeName}
                  onChange={(e) => handleFieldChange("storeName", e.target.value)}
                  placeholder={isId ? "Contoh: Studio Kreatif Nusantara" : "e.g. Acme Craft Store"}
                  className="create-staff-input"
                />
              </div>

              <div className="create-staff-field">
                <label className="create-staff-label">
                  {isId ? "Preset Peran Penjual" : "Seller Role Preset"}
                </label>
                <select
                  value={form.sellerRoleCode}
                  onChange={(e) => handleSellerPresetChange(e.target.value)}
                  className="create-staff-input"
                >
                  {SELLER_ROLE_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="create-staff-perm-groups">
                <span className="create-staff-label">
                  {isId ? "Hak Akses Toko" : "Granular Store Permissions"}
                </span>
                {SELLER_PERMISSION_GROUPS.map((group) => (
                  <div key={group.id} className="create-staff-perm-group">
                    <span className="create-staff-perm-title">{group.title}</span>
                    <div className="create-staff-perm-chips">
                      {group.permissions.map((perm) => (
                        <label key={perm.value} className="create-staff-perm-chip">
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
        </div>

        {/* CARD 4: SECURITY & PASSWORDS */}
        <div className="create-staff-card">
          <div className="create-staff-card-header">
            <div className="create-staff-card-icon">
              <KeyRound size={16} />
            </div>
            <div>
              <h2>{isId ? "Keamanan & Kata Sandi" : "Security & Password"}</h2>
              <p>
                {isId
                  ? "Atur kata sandi awal untuk autentikasi masuk anggota"
                  : "Set secure initial sign-in credentials"}
              </p>
            </div>
          </div>

          <div className="create-staff-fields-grid">
            <div className="create-staff-field">
              <label className="create-staff-label">
                {isId ? "Kata Sandi" : "Password"}
                <span className="create-staff-required">*</span>
              </label>
              <div className="create-staff-input-wrap">
                <Lock size={14} className="create-staff-icon-left" />
                <input
                  type={passwordVisible ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  placeholder="••••••••"
                  className="create-staff-input has-icon-left has-icon-right"
                />
                <button
                  type="button"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                  className="create-staff-eye-btn"
                  title={passwordVisible ? "Hide password" : "Show password"}
                >
                  {passwordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Password Strength Indicator */}
              <div style={{ marginTop: 6 }}>
                <PasswordStrengthIndicator password={form.password} />
              </div>
            </div>

            <div className="create-staff-field">
              <label className="create-staff-label">
                {isId ? "Konfirmasi Kata Sandi" : "Confirm Password"}
                <span className="create-staff-required">*</span>
              </label>
              <div className="create-staff-input-wrap">
                <Lock size={14} className="create-staff-icon-left" />
                <input
                  type={passwordConfirmVisible ? "text" : "password"}
                  required
                  value={form.passwordConfirm}
                  onChange={(e) => handleFieldChange("passwordConfirm", e.target.value)}
                  placeholder="••••••••"
                  className="create-staff-input has-icon-left has-icon-right"
                />
                <button
                  type="button"
                  onClick={() => setPasswordConfirmVisible(!passwordConfirmVisible)}
                  className="create-staff-eye-btn"
                  title={passwordConfirmVisible ? "Hide password" : "Show password"}
                >
                  {passwordConfirmVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {form.passwordConfirm && form.password !== form.passwordConfirm && (
                <span style={{ fontSize: "0.72rem", color: "#ef4444", marginTop: 4 }}>
                  {isId ? "Konfirmasi kata sandi tidak cocok." : "Passwords do not match."}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="create-staff-actions-bar">
          <Link
            to="/admin/all-accounts"
            className="create-staff-btn"
            disabled={createMutation.isPending}
          >
            {isId ? "Batal" : "Cancel"}
          </Link>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="create-staff-btn create-staff-btn--primary"
          >
            {createMutation.isPending ? (
              isId ? "Menyimpan Akun..." : "Creating Account..."
            ) : (
              <>
                <UserPlus size={14} />
                {isId ? "Buat Akun Sekarang" : "Create Account"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

