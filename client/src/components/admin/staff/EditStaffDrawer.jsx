import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink, ImagePlus, LockKeyhole, ShieldCheck, UploadCloud, X } from "lucide-react";
import PasswordStrengthIndicator from "../../auth/PasswordStrengthIndicator.jsx";
import PasswordVisibilityButton from "../../auth/PasswordVisibilityButton.jsx";
import { GENERIC_ERROR } from "../../../constants/uiMessages.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import {
  PASSWORD_CONFIRM_HELPER,
  PASSWORD_RULES_HELPER,
} from "../../../utils/authUi.js";
import {
  getSellerPreset,
  normalizePermissionKeys,
  SELLER_PERMISSION_GROUPS,
  SELLER_ROLE_PRESETS,
  STAFF_IMAGE_UPLOAD_GUIDANCE,
} from "./staffAccessConfig.js";

const fallbackRoleOptions = [
  { value: "staff", label: "Staff", labelId: "Staf" },
  { value: "admin", label: "Admin", labelId: "Admin" },
  { value: "super_admin", label: "Super Admin", labelId: "Super Admin" },
  { value: "seller", label: "Seller", labelId: "Penjual" },
];

const sectionCardClass =
  "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm";
const fieldClass =
  "h-11 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 text-sm text-slate-800 dark:text-slate-100 focus:border-[#034c85] dark:focus:border-[#fe6f05] focus:outline-none transition-colors";

const toText = (value) => String(value ?? "").trim();
const toRoleValue = (value) => toText(value).toLowerCase().replace(/\s+/g, "_");

const formatRoleLabel = (value, isId = false) => {
  const norm = toRoleValue(value);
  if (norm === "super_admin" || norm === "superadmin") return "Super Admin";
  if (norm === "admin") return "Admin";
  if (norm === "staff") return isId ? "Staf" : "Staff";
  if (norm === "seller") return isId ? "Penjual" : "Seller";

  return value
    ? String(value)
        .replace(/[_-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ")
    : "-";
};

const truncateFileName = (value, maxLength = 36) => {
  const text = toText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

const defaultSellerPreset = getSellerPreset(SELLER_ROLE_PRESETS[0]?.value);

const initialForm = {
  name: "",
  email: "",
  password: "",
  passwordConfirm: "",
  phoneNumber: "",
  role: "staff",
  isActive: true,
  sellerRoleCode: defaultSellerPreset?.value || "CATALOG_MANAGER",
  permissionKeys: defaultSellerPreset?.permissionKeys || [],
  avatarUrl: "",
};

const isStrongPassword = (value) =>
  String(value || "").length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value);

export default function EditStaffDrawer({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  error,
  staff,
  rolesOptions = [],
  canManageRoles = true,
  currentUser = null,
}) {
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [validationError, setValidationError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordConfirmVisible, setPasswordConfirmVisible] = useState(false);

  useEffect(() => {
    if (!open || !staff) return;
    const normalizedRole = toRoleValue(staff.role) || "staff";
    const preset = getSellerPreset(staff?.sellerRoleCode || defaultSellerPreset?.value);
    setForm({
      name: toText(staff.name),
      email: toText(staff.email),
      password: "",
      passwordConfirm: "",
      phoneNumber: toText(staff.phoneNumber ?? staff.phone),
      role: normalizedRole,
      isActive: staff.isActive !== false && staff.isPublished !== false,
      sellerRoleCode: preset?.value || defaultSellerPreset?.value || "CATALOG_MANAGER",
      permissionKeys:
        normalizedRole === "seller"
          ? normalizePermissionKeys(staff?.permissionKeys?.length ? staff.permissionKeys : preset?.permissionKeys)
          : [],
      avatarUrl: resolveAssetUrl(toText(staff.avatarUrl)),
    });
    setImageFile(null);
    setImagePreview("");
    setValidationError("");
    setPasswordVisible(false);
    setPasswordConfirmVisible(false);
  }, [open, staff]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const isSellerRole = form.role === "seller";
  const isPendingApproval = toText(staff?.status).toLowerCase() === "pending_approval";
  const isEditingOwnAccount =
    Number(currentUser?.id || 0) > 0 &&
    Number(staff?.id || 0) > 0 &&
    Number(currentUser?.id) === Number(staff?.id);
  const isOwnManagedAccount =
    isEditingOwnAccount &&
    ["staff", "admin", "super_admin", "superadmin"].includes(toRoleValue(currentUser?.role));
  const isOwnSuperAdminAccount =
    isEditingOwnAccount &&
    toRoleValue(currentUser?.role) === "super_admin" &&
    toRoleValue(staff?.role) === "super_admin";
  const submitError = validationError || error || "";

  const normalizedRoleOptions =
    rolesOptions.length > 0
      ? rolesOptions.map((role) => ({
          value: toRoleValue(role),
          label: formatRoleLabel(role, isId),
        }))
      : fallbackRoleOptions.map((role) => ({
          value: role.value,
          label: isId ? role.labelId : role.label,
        }));

  const roleSelectDisabled = isSubmitting || !canManageRoles || isOwnSuperAdminAccount;

  const setField = (patch) => {
    setValidationError("");
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const applySellerPreset = (presetCode) => {
    const preset = getSellerPreset(presetCode);
    setField({
      sellerRoleCode: preset.value,
      permissionKeys: [...preset.permissionKeys],
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setValidationError(isId ? "Ukuran gambar maksimal 2 MB." : "Image file size exceeds 2 MB.");
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setValidationError("");
  };

  const togglePermission = (permissionKey) => {
    setValidationError("");
    setForm((prev) => {
      const nextKeys = prev.permissionKeys.includes(permissionKey)
        ? prev.permissionKeys.filter((entry) => entry !== permissionKey)
        : [...prev.permissionKeys, permissionKey];
      return {
        ...prev,
        permissionKeys: normalizePermissionKeys(nextKeys),
      };
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    const passwordConfirm = form.passwordConfirm.trim();

    if (!name || !email) {
      setValidationError(isId ? "Nama dan email wajib diisi." : "Name and email are required.");
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setValidationError(isId ? "Format email tidak valid." : "Please enter a valid email.");
      return;
    }
    if (password && !isStrongPassword(password)) {
      setValidationError(
        isId
          ? "Kata sandi minimal 8 karakter dan mengandung huruf & angka."
          : PASSWORD_RULES_HELPER
      );
      return;
    }
    if (password && password !== passwordConfirm) {
      setValidationError(isId ? "Konfirmasi kata sandi tidak cocok." : "Password confirmation does not match.");
      return;
    }
    if (isSellerRole && form.permissionKeys.length === 0) {
      setValidationError(isId ? "Pilih minimal satu hak akses penjual." : "Select at least one seller permission.");
      return;
    }

    onSubmit({
      name,
      email,
      phoneNumber: form.phoneNumber.trim() || null,
      role: form.role,
      isActive: Boolean(form.isActive),
      isPublished: Boolean(form.isActive),
      image: imageFile,
      sellerRoleCode: isSellerRole ? form.sellerRoleCode : null,
      permissionKeys: isSellerRole ? normalizePermissionKeys(form.permissionKeys) : [],
      ...(password ? { password } : {}),
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={() => !isSubmitting && onClose()}
        aria-label={isId ? "Tutup laci edit akun" : "Close update account drawer"}
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[640px] flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 shadow-2xl">
        {/* HEADER */}
        <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[#034c85] dark:text-[#fe6f05]">
                {isId ? "Admin / Akun / Edit" : "Admin / Accounts / Edit"}
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {isId ? "Perbarui Akun Pengguna" : "Update Account"}
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {isId
                  ? "Perbarui foto, kontak, peran, hak akses, dan kata sandi akun."
                  : "Update profile, role, access permissions, and password."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {staff?.id && (
                <Link
                  to={`/admin/all-accounts/${staff.id}/edit`}
                  onClick={onClose}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#034c85] dark:hover:text-[#fe6f05] transition"
                  title={isId ? "Buka halaman penuh" : "Open full page"}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span>{isId ? "Halaman Penuh" : "Full Page"}</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => !isSubmitting && onClose()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                aria-label="Close drawer"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
            {/* PROFILE IMAGE */}
            <section className={sectionCardClass}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {isId ? "Foto Profil" : "Profile Image"}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {isId ? "Format: JPG, PNG, WEBP (maks. 2 MB)." : "JPG, PNG, or WEBP (max 2 MB)."}
                  </p>
                </div>
                <label className="inline-flex h-9 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 text-xs font-semibold text-[#034c85] dark:text-[#fe6f05] transition hover:bg-slate-200 dark:hover:bg-slate-700">
                  <UploadCloud className="h-3.5 w-3.5" />
                  <span>{isId ? "Ganti Foto" : "Replace"}</span>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <div className="h-16 w-16 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex-shrink-0">
                  {imagePreview || form.avatarUrl ? (
                    <img
                      src={imagePreview || form.avatarUrl}
                      alt="Staff preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400 font-bold text-lg">
                      {form.name ? form.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  <p className="font-medium text-slate-700 dark:text-slate-300">
                    {imageFile
                      ? truncateFileName(imageFile.name)
                      : form.avatarUrl
                      ? (isId ? "Foto profil aktif" : "Active profile photo")
                      : (isId ? "Belum ada foto yang diunggah" : "No photo uploaded")}
                  </p>
                  <p className="mt-0.5">
                    {isId ? "Pratinjau foto akan tampil di daftar akun admin." : "Avatar appears in tables and profile cards."}
                  </p>
                </div>
              </div>
            </section>

            {/* BASIC INFO */}
            <section className={sectionCardClass}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isId ? "Informasi Kontak & Identitas" : "Basic Information"}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {isId ? "Nama Lengkap" : "Full Name"} *
                  </label>
                  <input
                    id="admin-edit-staff-name"
                    value={form.name}
                    onChange={(event) => setField({ name: event.target.value })}
                    placeholder={isId ? "Nama lengkap" : "Full name"}
                    className={fieldClass}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {isId ? "Alamat Email" : "Email Address"} *
                  </label>
                  <input
                    id="admin-edit-staff-email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setField({ email: event.target.value })}
                    placeholder="name@example.com"
                    className={fieldClass}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {isId ? "Nomor Telepon / WhatsApp" : "Phone / WhatsApp Number"}
                  </label>
                  <input
                    id="admin-edit-staff-phone"
                    value={form.phoneNumber}
                    onChange={(event) => setField({ phoneNumber: event.target.value })}
                    placeholder="+62 812 3456 7890"
                    className={fieldClass}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </section>

            {/* ROLE & ACCESS */}
            <section className={sectionCardClass}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isId ? "Peran & Hak Akses" : "Role & Access"}
              </h3>
              <div className="mt-3 space-y-3">
                <div>
                  <label
                    htmlFor="admin-edit-account-role"
                    className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400"
                  >
                    {isId ? "Tingkat Peran Akun" : "Account Role"}
                  </label>
                  <select
                    id="admin-edit-account-role"
                    value={form.role}
                    onChange={(event) => {
                      const nextRole = toRoleValue(event.target.value) || "staff";
                      const nextPreset = getSellerPreset(defaultSellerPreset?.value);
                      setField({
                        role: nextRole,
                        sellerRoleCode: nextRole === "seller"
                          ? nextPreset?.value || "CATALOG_MANAGER"
                          : nextPreset?.value || "CATALOG_MANAGER",
                        permissionKeys:
                          nextRole === "seller"
                            ? [...(nextPreset?.permissionKeys || [])]
                            : [],
                      });
                    }}
                    className={fieldClass}
                    disabled={roleSelectDisabled}
                  >
                    {normalizedRoleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                  <span>{isId ? "Status Akun Aktif" : "Active Status"}</span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setField({ isActive: event.target.checked })}
                    disabled={isSubmitting || isPendingApproval || isOwnManagedAccount}
                    className="h-4 w-4 accent-[#034c85] rounded cursor-pointer"
                  />
                </label>

                {/* SELLER SPECIFIC CONFIGURATION */}
                {isSellerRole && (
                  <div className="space-y-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/60 dark:bg-amber-950/20 p-3.5">
                    {staff?.store && (
                      <div className="rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 p-2.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                          {isId ? "Toko Terhubung" : "Connected Store"}
                        </p>
                        <div className="mt-0.5 flex items-center justify-between">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{staff.store.name}</p>
                          <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-400">
                            {staff.store.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">@{staff.store.slug}</p>
                      </div>
                    )}

                    <div>
                      <label className="mb-1 block text-xs font-medium text-amber-900 dark:text-amber-300">
                        {isId ? "Preset Peran Penjual" : "Seller Role Preset"}
                      </label>
                      <select
                        value={form.sellerRoleCode}
                        onChange={(event) => applySellerPreset(event.target.value)}
                        className={fieldClass}
                        disabled={isSubmitting}
                      >
                        {SELLER_ROLE_PRESETS.map((preset) => (
                          <option key={preset.value} value={preset.value}>
                            {preset.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                        {isId ? "Hak Akses Penjual" : "Seller Permissions"}
                      </p>
                      {SELLER_PERMISSION_GROUPS.map((group) => (
                        <div key={group.id} className="space-y-1">
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {group.title}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.permissions.map((perm) => {
                              const checked = form.permissionKeys.includes(perm.value);
                              return (
                                <button
                                  key={perm.value}
                                  type="button"
                                  onClick={() => togglePermission(perm.value)}
                                  className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-colors ${
                                    checked
                                      ? "border-[#fe6f05] bg-[#fe6f05] text-white"
                                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400"
                                  }`}
                                >
                                  {perm.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* SECURITY */}
            <section className={sectionCardClass}>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {isId ? "Keamanan & Kata Sandi" : "Security & Password"}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {isId
                  ? "Kosongkan jika tidak ingin mengubah kata sandi saat ini."
                  : "Leave password fields empty to keep existing password."}
              </p>

              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {isId ? "Kata Sandi Baru (Opsional)" : "New Password (Optional)"}
                  </label>
                  <div className="relative">
                    <input
                      id="admin-edit-staff-password"
                      type={passwordVisible ? "text" : "password"}
                      value={form.password}
                      onChange={(event) => setField({ password: event.target.value })}
                      placeholder={isId ? "Kosongkan jika tetap sama" : "Leave blank to keep unchanged"}
                      className={`${fieldClass} pr-11`}
                      disabled={isSubmitting}
                    />
                    <PasswordVisibilityButton
                      visible={passwordVisible}
                      onToggle={() => setPasswordVisible((prev) => !prev)}
                    />
                  </div>
                  {form.password && (
                    <div className="mt-2">
                      <PasswordStrengthIndicator password={form.password} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    {isId ? "Konfirmasi Kata Sandi Baru" : "Confirm New Password"}
                  </label>
                  <div className="relative">
                    <input
                      id="admin-edit-staff-password-confirm"
                      type={passwordConfirmVisible ? "text" : "password"}
                      value={form.passwordConfirm}
                      onChange={(event) => setField({ passwordConfirm: event.target.value })}
                      placeholder={isId ? "Ulangi kata sandi baru" : "Repeat new password"}
                      className={`${fieldClass} pr-11`}
                      disabled={isSubmitting}
                    />
                    <PasswordVisibilityButton
                      visible={passwordConfirmVisible}
                      onToggle={() => setPasswordConfirmVisible((prev) => !prev)}
                    />
                  </div>
                </div>
              </div>
            </section>

            {submitError ? (
              <div
                id="admin-edit-staff-error"
                className="rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400"
              >
                {submitError || GENERIC_ERROR}
              </div>
            ) : null}
          </div>

          {/* FOOTER */}
          <footer className="sticky bottom-0 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-6 py-4 backdrop-blur">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => !isSubmitting && onClose()}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                disabled={isSubmitting}
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#034c85] hover:bg-[#023864] text-xs font-semibold text-white transition disabled:opacity-70 shadow-sm"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? isId
                    ? "Menyimpan..."
                    : "Updating..."
                  : isId
                  ? "Simpan Perubahan Akun"
                  : "Save Account Changes"}
              </button>
            </div>
          </footer>
        </form>
      </aside>
    </div>
  );
}
