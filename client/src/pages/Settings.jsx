import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Image as ImageIcon,
  Lock,
  Mail,
  Phone,
  Save,
  Server,
  Settings as SettingsIcon,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  fetchAdminSettings,
  fetchAdminStoreSettings,
  updateAdminSettings,
  updateAdminStoreSettings,
  uploadAdminBrandingLogo,
} from "../lib/adminApi.js";
import { resolveAssetUrl } from "../lib/assetUrl.js";
import {
  CANONICAL_CLIENT_LOGO_URL,
  getWorkspaceLogoUrl,
  hasCustomBrandingLogo,
  setCachedStoreBranding,
} from "../lib/branding.js";
import {
  AdminOpsErrorState,
  AdminOpsLoadingState,
} from "../components/admin/AdminOpsPrimitives.jsx";
import adminLoginHero from "../assets/admin-login-hero.jpg";
import "./Settings.css";

const DEFAULT_SETTINGS = {
  imagesPerProduct: "12",
  allowAutoTranslation: "false",
  defaultLanguage: "English",
  defaultCurrency: "IDR",
  defaultTimeZone: "Asia/Makassar",
  defaultDateFormat: "D MMM, YYYY",
  receiptWidth: "57 mm",
  invoiceEmailEnabled: "true",
  invoiceFromEmail: "sales@kachabazar.com",
  companyFromName: "TP PRENEURS",
  companyName: "TP Preneurs",
  vatNumber: "47589",
  companyAddress: "Jl. Tamalate No.1, Bonto Makkio, Kec. Rappocini, Kota Makassar, Sulawesi Selatan 90222",
  postCode: "90222",
  contactPhone: "+62 821-8866-824",
  contactEmail: "tppreneurs@gmail.com",
  website: "tppreneurs.com",
  smtpProvider: "Hostinger",
  smtpHost: "smtp.hostinger.com",
  smtpPort: "465",
  smtpSecure: "true",
  smtpUser: "noreply@tppreneurs.com",
  smtpPassword: "",
  smtpPasswordConfigured: "false",
  smtpFromEmail: "noreply@tppreneurs.com",
  smtpFromName: "TP PRENEURS",
};

const DEFAULT_BRANDING_SETTINGS = {
  clientLogoUrl: CANONICAL_CLIENT_LOGO_URL,
  adminLogoUrl: "",
  sellerLogoUrl: "",
  adminLoginHeroUrl: "",
  adminForgotPasswordHeroUrl: "",
  adminCreateAccountHeroUrl: "",
  workspaceBrandName: "TP PRENEURS",
};

const BRANDING_MAX_FILE_BYTES = 5 * 1024 * 1024;
const BRANDING_ACCEPT = "image/png,image/jpeg,image/webp";

const BRANDING_ITEMS = [
  {
    key: "client",
    field: "clientLogoUrl",
    labelEn: "Client Storefront Logo",
    labelId: "Logo Toko Client",
    spec: "1600×400 px • PNG/SVG",
    aspectClass: "sett-preview-client",
    assetType: "logo",
  },
  {
    key: "admin",
    field: "adminLogoUrl",
    labelEn: "Admin Workspace Logo",
    labelId: "Logo Admin Workspace",
    spec: "512×512 px (1:1)",
    aspectClass: "sett-preview-square",
    assetType: "logo",
  },
  {
    key: "seller",
    field: "sellerLogoUrl",
    labelEn: "Seller Workspace Logo",
    labelId: "Logo Seller Workspace",
    spec: "512×512 px (1:1)",
    aspectClass: "sett-preview-square",
    assetType: "logo",
  },
  {
    key: "admin-login-hero",
    field: "adminLoginHeroUrl",
    labelEn: "Admin Login Banner",
    labelId: "Banner Login Admin",
    spec: "4:5 Portrait • Maks 5MB",
    aspectClass: "sett-preview-hero",
    assetType: "hero",
  },
  {
    key: "admin-forgot-password-hero",
    field: "adminForgotPasswordHeroUrl",
    labelEn: "Forgot Password Banner",
    labelId: "Banner Lupa Password",
    spec: "4:5 Portrait • Maks 5MB",
    aspectClass: "sett-preview-hero",
    assetType: "hero",
  },
  {
    key: "admin-create-account-hero",
    field: "adminCreateAccountHeroUrl",
    labelEn: "Create Account Banner",
    labelId: "Banner Buat Akun",
    spec: "4:5 Portrait • Maks 5MB",
    aspectClass: "sett-preview-hero",
    assetType: "hero",
  },
];

const LANGUAGE_OPTIONS = [
  { value: "Indonesian", labelEn: "Indonesian (Bahasa Indonesia)", labelId: "Bahasa Indonesia" },
  { value: "English", labelEn: "English", labelId: "Bahasa Inggris (English)" },
  { value: "Arabic", labelEn: "Arabic", labelId: "Bahasa Arab" },
  { value: "French", labelEn: "French", labelId: "Bahasa Prancis" },
];

const CURRENCY_OPTIONS = ["IDR", "USD", "EUR", "GBP"];

const TIME_ZONE_OPTIONS = [
  { value: "Asia/Makassar", label: "Asia/Makassar (UTC+08:00 WITA)" },
  { value: "Asia/Jakarta", label: "Asia/Jakarta (UTC+07:00 WIB)" },
  { value: "Asia/Jayapura", label: "Asia/Jayapura (UTC+09:00 WIT)" },
  { value: "UTC", label: "UTC (UTC+00:00)" },
];

const DATE_FORMAT_OPTIONS = [
  "D MMM, YYYY",
  "DD/MM/YYYY",
  "YYYY-MM-DD",
  "MMM D, YYYY",
];

const RECEIPT_WIDTH_OPTIONS = [
  { value: "57 mm", labelEn: "57 mm (Thermal POS 58mm)", labelId: "57 mm (Struk Kasir Thermal 58mm)" },
  { value: "80 mm", labelEn: "80 mm (Standard POS 80mm)", labelId: "80 mm (Struk Kasir Standar 80mm)" },
];

const toStringValue = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;
  return String(value);
};

const normalizeBooleanString = (value, fallback = "false") => {
  if (value === "true" || value === true) return "true";
  if (value === "false" || value === false) return "false";
  return fallback;
};

const mapSettingsToForm = (settings) => {
  const merged = { ...DEFAULT_SETTINGS, ...(settings || {}) };
  return {
    imagesPerProduct: toStringValue(merged.imagesPerProduct, DEFAULT_SETTINGS.imagesPerProduct),
    allowAutoTranslation: normalizeBooleanString(merged.allowAutoTranslation, DEFAULT_SETTINGS.allowAutoTranslation),
    defaultLanguage: toStringValue(merged.defaultLanguage, DEFAULT_SETTINGS.defaultLanguage),
    defaultCurrency: toStringValue(merged.defaultCurrency, DEFAULT_SETTINGS.defaultCurrency),
    defaultTimeZone: toStringValue(merged.defaultTimeZone, DEFAULT_SETTINGS.defaultTimeZone),
    defaultDateFormat: toStringValue(merged.defaultDateFormat, DEFAULT_SETTINGS.defaultDateFormat),
    receiptWidth: toStringValue(merged.receiptWidth, DEFAULT_SETTINGS.receiptWidth),
    invoiceEmailEnabled: normalizeBooleanString(merged.invoiceEmailEnabled, DEFAULT_SETTINGS.invoiceEmailEnabled),
    invoiceFromEmail: toStringValue(merged.invoiceFromEmail, DEFAULT_SETTINGS.invoiceFromEmail),
    companyFromName: toStringValue(merged.companyFromName, DEFAULT_SETTINGS.companyFromName),
    companyName: toStringValue(merged.companyName, DEFAULT_SETTINGS.companyName),
    vatNumber: toStringValue(merged.vatNumber, DEFAULT_SETTINGS.vatNumber),
    companyAddress: toStringValue(merged.companyAddress, DEFAULT_SETTINGS.companyAddress),
    postCode: toStringValue(merged.postCode, DEFAULT_SETTINGS.postCode),
    contactPhone: toStringValue(merged.contactPhone, DEFAULT_SETTINGS.contactPhone),
    contactEmail: toStringValue(merged.contactEmail, DEFAULT_SETTINGS.contactEmail),
    website: toStringValue(merged.website, DEFAULT_SETTINGS.website),
    smtpProvider: toStringValue(merged.smtpProvider, DEFAULT_SETTINGS.smtpProvider),
    smtpHost: toStringValue(merged.smtpHost, DEFAULT_SETTINGS.smtpHost),
    smtpPort: toStringValue(merged.smtpPort, DEFAULT_SETTINGS.smtpPort),
    smtpSecure: normalizeBooleanString(merged.smtpSecure, DEFAULT_SETTINGS.smtpSecure),
    smtpUser: toStringValue(merged.smtpUser, DEFAULT_SETTINGS.smtpUser),
    smtpPassword: "",
    smtpPasswordConfigured: normalizeBooleanString(merged.smtpPasswordConfigured, DEFAULT_SETTINGS.smtpPasswordConfigured),
    smtpFromEmail: toStringValue(merged.smtpFromEmail, DEFAULT_SETTINGS.smtpFromEmail),
    smtpFromName: toStringValue(merged.smtpFromName, DEFAULT_SETTINGS.smtpFromName),
  };
};

const normalizeBrandingSettings = (settings) => {
  const branding = settings?.storeSettings?.branding || settings?.branding || {};
  return {
    clientLogoUrl: toStringValue(branding.clientLogoUrl),
    adminLogoUrl: toStringValue(branding.adminLogoUrl),
    sellerLogoUrl: toStringValue(branding.sellerLogoUrl),
    adminLoginHeroUrl: toStringValue(branding.adminLoginHeroUrl),
    adminForgotPasswordHeroUrl: toStringValue(branding.adminForgotPasswordHeroUrl),
    adminCreateAccountHeroUrl: toStringValue(branding.adminCreateAccountHeroUrl),
    workspaceBrandName: toStringValue(
      branding.workspaceBrandName,
      DEFAULT_BRANDING_SETTINGS.workspaceBrandName
    ),
  };
};

/* ==========================================================================
   BRANDING CARD COMPONENT
   ========================================================================== */
function BrandingCard({ item, logoUrl, isUploading, onFileChange, isId }) {
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const hasCustomLogo = hasCustomBrandingLogo(logoUrl);
  const canonicalFallback =
    item.key === "client" ? resolveAssetUrl(CANONICAL_CLIENT_LOGO_URL) : null;

  const primarySrc =
    item.assetType === "hero"
      ? resolveAssetUrl(logoUrl) || adminLoginHero
      : item.key === "client"
      ? resolveAssetUrl(logoUrl) || canonicalFallback
      : getWorkspaceLogoUrl(item.key, logoUrl);

  const previewSrc = !imgError ? (primarySrc || canonicalFallback) : canonicalFallback;

  return (
    <div className="sett-branding-card">
      <div className="sett-branding-card-header">
        <strong>{isId ? item.labelId : item.labelEn}</strong>
        <span className={hasCustomLogo && !imgError ? "sett-pill-custom" : "sett-pill-fallback"}>
          {hasCustomLogo && !imgError
            ? (isId ? "Kustom" : "Custom")
            : (isId ? "Bawaan" : "Fallback")}
        </span>
      </div>

      <div className={`sett-branding-preview ${item.aspectClass}`}>
        {previewSrc ? (
          <img
            src={previewSrc}
            alt=""
            onError={() => {
              if (!imgError && primarySrc !== canonicalFallback) {
                setImgError(true);
              }
            }}
          />
        ) : (
          <ImageIcon size={28} color="#94a3b8" />
        )}
      </div>

      <div className="sett-branding-footer">
        <span className="sett-spec-chip">{item.spec}</span>
        <input
          ref={fileInputRef}
          type="file"
          accept={BRANDING_ACCEPT}
          style={{ display: "none" }}
          disabled={isUploading}
          onChange={(e) => onFileChange(item, e)}
        />
        <button
          type="button"
          className="sett-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload size={12} />
          {isUploading
            ? (isId ? "Mengunggah..." : "Uploading...")
            : (isId ? "Ganti Gambar" : "Replace Image")}
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN GLOBAL SETTINGS COMPONENT
   ========================================================================== */
export default function Settings() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  const [activeTab, setActiveTab] = useState("branding");
  const [form, setForm] = useState(() => mapSettingsToForm());
  const [feedback, setFeedback] = useState(null);
  const [brandingFeedback, setBrandingFeedback] = useState(null);
  const [activeBrandingTarget, setActiveBrandingTarget] = useState("");
  const [brandingForm, setBrandingForm] = useState(() => DEFAULT_BRANDING_SETTINGS);

  const settingsQuery = useQuery({
    queryKey: ["admin-settings"],
    queryFn: fetchAdminSettings,
  });

  const brandingSettingsQuery = useQuery({
    queryKey: ["admin-store-settings", "branding"],
    queryFn: fetchAdminStoreSettings,
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(mapSettingsToForm(settingsQuery.data));
    }
  }, [settingsQuery.data]);

  useEffect(() => {
    if (!brandingSettingsQuery.data) return;
    setBrandingForm(normalizeBrandingSettings(brandingSettingsQuery.data));
  }, [brandingSettingsQuery.data]);

  const mutation = useMutation({
    mutationFn: updateAdminSettings,
    onSuccess: (data) => {
      setForm(mapSettingsToForm(data));
      setFeedback({
        type: "success",
        message: isId ? "Pengaturan berhasil diperbarui." : "Settings updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        (isId ? "Gagal memperbarui pengaturan." : "Failed to update settings.");
      setFeedback({ type: "error", message });
    },
  });

  const brandingUploadMutation = useMutation({
    mutationFn: ({ target, file }) => uploadAdminBrandingLogo(target, file),
  });

  const brandingMutation = useMutation({
    mutationFn: (payload) => updateAdminStoreSettings(payload),
    onSuccess: (data) => {
      const nextBranding = normalizeBrandingSettings(data);
      setBrandingForm(nextBranding);
      setCachedStoreBranding(nextBranding);
      setBrandingFeedback({
        type: "success",
        message: isId ? "Nama brand workspace berhasil diperbarui." : "Workspace brand name updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["admin-store-settings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["store-settings", "public"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["store-settings", "public", "branding"], exact: false });
    },
    onError: (error) => {
      setBrandingFeedback({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          (isId ? "Gagal memperbarui nama brand." : "Failed to update brand name."),
      });
    },
  });

  const isSaving = mutation.isPending;
  const isSavingBrandingText = brandingMutation.isPending;

  const branding = useMemo(
    () => normalizeBrandingSettings(brandingSettingsQuery.data),
    [brandingSettingsQuery.data]
  );
  const customBrandingCount = useMemo(
    () => BRANDING_ITEMS.filter((item) => hasCustomBrandingLogo(branding[item.field])).length,
    [branding]
  );
  const smtpReady = normalizeBooleanString(form.smtpPasswordConfigured, "false") === "true";

  const onInputChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const onSubmit = (event) => {
    event.preventDefault();
    setFeedback(null);
    mutation.mutate({
      ...form,
      allowAutoTranslation: normalizeBooleanString(form.allowAutoTranslation, "false"),
      invoiceEmailEnabled: normalizeBooleanString(form.invoiceEmailEnabled, "true"),
      smtpSecure: normalizeBooleanString(form.smtpSecure, "true"),
    });
  };

  const handleBrandingFileChange = async (item, event) => {
    const input = event.target;
    const file = input?.files?.[0];
    input.value = "";
    if (!file) return;

    setBrandingFeedback(null);
    if (!String(file.type || "").startsWith("image/")) {
      setBrandingFeedback({
        type: "error",
        message: isId ? "Berkas harus berupa gambar." : `${item.labelEn} must be an image file.`,
      });
      return;
    }

    if (Number(file.size || 0) > BRANDING_MAX_FILE_BYTES) {
      setBrandingFeedback({
        type: "error",
        message: isId ? "Ukuran gambar maksimal 5MB." : `${item.labelEn} must be 5MB or smaller.`,
      });
      return;
    }

    try {
      setActiveBrandingTarget(item.key);
      await brandingUploadMutation.mutateAsync({ target: item.key, file });
      setBrandingFeedback({
        type: "success",
        message: isId ? "Gambar berhasil diperbarui." : `${item.labelEn} updated successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin-store-settings"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["store-settings", "public"], exact: false });
      queryClient.invalidateQueries({ queryKey: ["store-settings", "public", "branding"], exact: false });
    } catch (error) {
      setBrandingFeedback({
        type: "error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          (isId ? "Gagal mengunggah gambar." : `Failed to upload image.`),
      });
    } finally {
      setActiveBrandingTarget("");
    }
  };

  const handleBrandingTextSubmit = (event) => {
    event.preventDefault();
    setBrandingFeedback(null);
    brandingMutation.mutate({
      storeSettings: {
        branding: {
          workspaceBrandName: String(
            brandingForm.workspaceBrandName || DEFAULT_BRANDING_SETTINGS.workspaceBrandName
          ).trim(),
        },
      },
    });
  };

  if (settingsQuery.isLoading) {
    return (
      <div className="settings-page-2026">
        <AdminOpsLoadingState
          title={isId ? "Memuat pengaturan global..." : "Loading global settings..."}
        />
      </div>
    );
  }

  if (settingsQuery.isError) {
    const message =
      settingsQuery.error?.response?.data?.message ||
      settingsQuery.error?.message ||
      (isId ? "Gagal memuat pengaturan." : "Failed to load settings.");
    return (
      <div className="settings-page-2026">
        <AdminOpsErrorState message={message} onRetry={() => settingsQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="settings-page-2026">
      <form onSubmit={onSubmit}>
        {/* Header */}
        <header className="sett-header">
          <div>
            <h1>{isId ? "Pengaturan Global" : "Global Settings"}</h1>
            <p>
              {isId
                ? "Kelola identitas brand, wilayah, faktur, dan konfigurasi SMTP."
                : "Brand identity, regional locale, invoice, and SMTP controls."}
            </p>
          </div>
          <div className="sett-header__actions">
            <button
              type="submit"
              disabled={isSaving}
              className="sett-btn-primary"
            >
              <Save size={15} />
              {isSaving
                ? (isId ? "Menyimpan..." : "Saving...")
                : (isId ? "Simpan Pengaturan" : "Save Settings")}
            </button>
          </div>
        </header>

        {/* KPI Metrics Summary */}
        <section className="sett-metrics" aria-label="Settings Overview">
          <div className="sett-metric sett-metric--navy">
            <div className="sett-metric__icon">
              <Sparkles size={22} />
            </div>
            <div className="sett-metric__body">
              <span>{isId ? "Aset Brand" : "Brand Assets"}</span>
              <strong>{customBrandingCount} / {BRANDING_ITEMS.length}</strong>
              <small>{isId ? "Logo & banner terpasang" : "Custom logos & banners"}</small>
            </div>
          </div>

          <div className="sett-metric sett-metric--orange">
            <div className="sett-metric__icon">
              <Building2 size={22} />
            </div>
            <div className="sett-metric__body">
              <span>{isId ? "Brand Workspace" : "Workspace Brand"}</span>
              <strong>{branding.workspaceBrandName || DEFAULT_BRANDING_SETTINGS.workspaceBrandName}</strong>
              <small>{isId ? "Tampil di sidebar Admin & Seller" : "Visible in Admin & Seller"}</small>
            </div>
          </div>

          <div className="sett-metric sett-metric--teal">
            <div className="sett-metric__icon">
              <Server size={22} />
            </div>
            <div className="sett-metric__body">
              <span>{isId ? "Layanan SMTP" : "SMTP Service"}</span>
              <strong>
                {smtpReady
                  ? (isId ? "Terkonfigurasi" : "Configured")
                  : (isId ? "Perlu Kunci" : "Needs Secret")}
              </strong>
              <small>{isId ? "OTP & email transaksi" : "OTP & transactional email"}</small>
            </div>
          </div>
        </section>

        {/* Feedback Notices */}
        {feedback && (
          <div
            className={`sett-notice ${
              feedback.type === "success" ? "sett-notice--success" : "sett-notice--error"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="sett-tabs" aria-label="Settings tabs">
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "branding" ? "is-active" : ""}`}
            onClick={() => setActiveTab("branding")}
          >
            <Sparkles size={14} />
            {isId ? "Branding & Logo" : "Branding & Logos"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "general" ? "is-active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            <SettingsIcon size={14} />
            {isId ? "Umum & Wilayah" : "General & Locale"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "smtp" ? "is-active" : ""}`}
            onClick={() => setActiveTab("smtp")}
          >
            <Server size={14} />
            {isId ? "Akun Google SMTP" : "Google SMTP Account"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "invoice" ? "is-active" : ""}`}
            onClick={() => setActiveTab("invoice")}
          >
            <FileText size={14} />
            {isId ? "Faktur & Perusahaan" : "Invoice & Company"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "contact" ? "is-active" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            <Phone size={14} />
            {isId ? "Informasi Kontak" : "Contact Information"}
          </button>
        </nav>

        {/* TAB 1: BRANDING SETTINGS */}
        {activeTab === "branding" && (
          <section className="sett-section-card">
            <div className="sett-section-header">
              <div>
                <h2>
                  <Sparkles size={18} color="var(--sett-accent)" />
                  {isId ? "Pengaturan Identitas Brand" : "Branding & Identity Settings"}
                </h2>
                <p>
                  {isId
                    ? "Kelola nama brand sidebar dan aset visual logo di seluruh ekosistem."
                    : "Manage sidebar brand title and ecosystem visual logos."}
                </p>
              </div>
            </div>

            {/* Workspace Brand Text Input */}
            <div className="sett-branding-banner-box">
              <div className="sett-branding-banner-input">
                <div className="sett-field">
                  <label>{isId ? "Nama Brand Workspace" : "Workspace Brand Text"}</label>
                  <input
                    type="text"
                    value={brandingForm.workspaceBrandName}
                    onChange={(e) =>
                      setBrandingForm((prev) => ({
                        ...prev,
                        workspaceBrandName: e.target.value,
                      }))
                    }
                    placeholder="TP PRENEURS"
                    maxLength={60}
                  />
                  <small>
                    {isId
                      ? "Tampil di header sidebar Admin dan Seller Workspace."
                      : "Displayed in Admin and Seller Workspace sidebar header."}
                  </small>
                </div>
              </div>
              <button
                type="button"
                onClick={handleBrandingTextSubmit}
                disabled={isSavingBrandingText}
                className="sett-branding-banner-btn"
              >
                <Save size={14} />
                {isSavingBrandingText
                  ? (isId ? "Menyimpan..." : "Updating...")
                  : (isId ? "Perbarui Nama Brand" : "Update Brand Name")}
              </button>
            </div>

            {brandingFeedback && (
              <div
                className={`sett-notice ${
                  brandingFeedback.type === "success"
                    ? "sett-notice--success"
                    : "sett-notice--error"
                }`}
              >
                {brandingFeedback.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                <span>{brandingFeedback.message}</span>
              </div>
            )}

            {/* Branding Logo & Hero Cards Grid */}
            <div className="sett-branding-grid">
              {BRANDING_ITEMS.map((item) => (
                <BrandingCard
                  key={item.key}
                  item={item}
                  logoUrl={branding[item.field]}
                  isUploading={activeBrandingTarget === item.key}
                  onFileChange={handleBrandingFileChange}
                  isId={isId}
                />
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: GENERAL SETTINGS */}
        {activeTab === "general" && (
          <section className="sett-section-card">
            <div className="sett-section-header">
              <div>
                <h2>
                  <SettingsIcon size={18} color="var(--sett-primary)" />
                  {isId ? "Pengaturan Umum & Wilayah" : "General & Regional Settings"}
                </h2>
                <p>
                  {isId
                    ? "Konfigurasi kuota foto produk, bahasa default, mata uang, zona waktu, dan format cetak struk."
                    : "Configure product image quota, default locale, currency, timezone, and receipt size."}
                </p>
              </div>
            </div>

            <div className="sett-form-grid">
              <div className="sett-field">
                <label>{isId ? "Jumlah Foto per Produk" : "Number of Images per Product"}</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={form.imagesPerProduct}
                  onChange={(e) => onInputChange("imagesPerProduct", e.target.value)}
                />
                <small>
                  {isId
                    ? "Batas maksimal upload foto pada halaman kelola produk Admin & Seller."
                    : "Maximum image upload limit on Admin & Seller product management forms."}
                </small>
              </div>

              <div className="sett-field">
                <label>{isId ? "Bahasa Bawaan (Default)" : "Default Language"}</label>
                <select
                  value={form.defaultLanguage}
                  onChange={(e) => onInputChange("defaultLanguage", e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {isId ? opt.labelId : opt.labelEn}
                    </option>
                  ))}
                </select>
                <small>{isId ? "Bahasa awal saat pengunjung pertama kali membuka web." : "Initial language for new visitors."}</small>
              </div>

              <div className="sett-toggle-box">
                <span>{isId ? "Terjemahan Otomatis" : "Allow Auto Translation"}</span>
                <div className="sett-toggle-segmented">
                  <button
                    type="button"
                    className={`sett-toggle-btn ${form.allowAutoTranslation === "true" ? "is-active" : ""}`}
                    onClick={() => onInputChange("allowAutoTranslation", "true")}
                  >
                    {isId ? "Aktif (Yes)" : "Yes"}
                  </button>
                  <button
                    type="button"
                    className={`sett-toggle-btn ${form.allowAutoTranslation === "false" ? "is-active" : ""}`}
                    onClick={() => onInputChange("allowAutoTranslation", "false")}
                  >
                    {isId ? "Nonaktif (No)" : "No"}
                  </button>
                </div>
              </div>

              <div className="sett-field">
                <label>{isId ? "Mata Uang Bawaan (Default)" : "Default Currency"}</label>
                <select
                  value={form.defaultCurrency}
                  onChange={(e) => onInputChange("defaultCurrency", e.target.value)}
                >
                  {CURRENCY_OPTIONS.map((curr) => (
                    <option key={curr} value={curr}>
                      {curr}
                    </option>
                  ))}
                </select>
                <small>{isId ? "Format kurs dasar pada katalog dan pesanan." : "Base currency format on catalog and checkout."}</small>
              </div>

              <div className="sett-field">
                <label>{isId ? "Zona Waktu (Timezone)" : "Default Time Zone"}</label>
                <select
                  value={form.defaultTimeZone}
                  onChange={(e) => onInputChange("defaultTimeZone", e.target.value)}
                >
                  {TIME_ZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <small>{isId ? "Digunakan untuk timestamp dan laporan transaksi harian." : "Used for transaction timestamps and reporting boundaries."}</small>
              </div>

              <div className="sett-field">
                <label>{isId ? "Format Tanggal" : "Default Date Format"}</label>
                <select
                  value={form.defaultDateFormat}
                  onChange={(e) => onInputChange("defaultDateFormat", e.target.value)}
                >
                  {DATE_FORMAT_OPTIONS.map((df) => (
                    <option key={df} value={df}>
                      {df}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sett-field sett-col-full">
                <label>{isId ? "Lebar Kertas Struk / Resi (Thermal POS)" : "Receipt Size (Thermal POS Width)"}</label>
                <select
                  value={form.receiptWidth}
                  onChange={(e) => onInputChange("receiptWidth", e.target.value)}
                >
                  {RECEIPT_WIDTH_OPTIONS.map((rw) => (
                    <option key={rw.value} value={rw.value}>
                      {isId ? rw.labelId : rw.labelEn}
                    </option>
                  ))}
                </select>
                <small>{isId ? "Menentukan lebar cetak printer struk kasir atau label ekspedisi." : "Determines printing format for thermal POS receipts and courier slips."}</small>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: GOOGLE SMTP ACCOUNT */}
        {activeTab === "smtp" && (
          <section className="sett-section-card">
            <div className="sett-section-header">
              <div>
                <h2>
                  <Server size={18} color="var(--sett-primary)" />
                  {isId ? "Konfigurasi Akun Google / Hostinger SMTP" : "Google / Hostinger SMTP Account"}
                </h2>
                <p>
                  {isId
                    ? "Digunakan untuk pengiriman OTP verifikasi registrasi akun, reset password, dan notifikasi pesanan."
                    : "Used for account OTP verification, password resets, and operational email notifications."}
                </p>
              </div>
            </div>

            <div className="sett-form-grid">
              <div className="sett-field">
                <label>{isId ? "Penyedia (Provider)" : "Provider"}</label>
                <input
                  type="text"
                  value={form.smtpProvider}
                  onChange={(e) => onInputChange("smtpProvider", e.target.value)}
                  placeholder="Hostinger / Google"
                />
              </div>

              <div className="sett-toggle-box">
                <span>{isId ? "Gunakan SMTP Aman (SSL/TLS)" : "Use Secure SMTP"}</span>
                <div className="sett-toggle-segmented">
                  <button
                    type="button"
                    className={`sett-toggle-btn ${form.smtpSecure === "true" ? "is-active" : ""}`}
                    onClick={() => onInputChange("smtpSecure", "true")}
                  >
                    {isId ? "Ya (Yes)" : "Yes"}
                  </button>
                  <button
                    type="button"
                    className={`sett-toggle-btn ${form.smtpSecure === "false" ? "is-active" : ""}`}
                    onClick={() => onInputChange("smtpSecure", "false")}
                  >
                    {isId ? "Tidak (No)" : "No"}
                  </button>
                </div>
              </div>

              <div className="sett-field">
                <label>SMTP Host</label>
                <input
                  type="text"
                  value={form.smtpHost}
                  onChange={(e) => onInputChange("smtpHost", e.target.value)}
                  placeholder="smtp.hostinger.com"
                />
              </div>

              <div className="sett-field">
                <label>SMTP Port</label>
                <input
                  type="number"
                  value={form.smtpPort}
                  onChange={(e) => onInputChange("smtpPort", e.target.value)}
                  placeholder="465"
                />
              </div>

              <div className="sett-field">
                <label>{isId ? "Username SMTP / Email" : "SMTP Username / Email"}</label>
                <input
                  type="email"
                  value={form.smtpUser}
                  onChange={(e) => onInputChange("smtpUser", e.target.value)}
                  placeholder="noreply@tppreneurs.com"
                />
              </div>

              <div className="sett-field">
                <label>{isId ? "Password / App Password" : "SMTP Password"}</label>
                <input
                  type="password"
                  value={form.smtpPassword}
                  onChange={(e) => onInputChange("smtpPassword", e.target.value)}
                  placeholder={
                    form.smtpPasswordConfigured === "true"
                      ? (isId ? "•••••••••••• (Tersimpan - Kosongkan jika tidak diganti)" : "•••••••••••• (Configured - Leave empty to keep)")
                      : (isId ? "Masukkan password SMTP" : "Enter SMTP secret")
                  }
                />
                <small>
                  {form.smtpPasswordConfigured === "true"
                    ? (isId ? "Password sudah tersimpan aman di server." : "Password already stored securely in database.")
                    : (isId ? "Masukkan App Password untuk mulai mengaktifkan kirim email." : "Enter App Password to enable email dispatch.")}
                </small>
              </div>

              <div className="sett-field">
                <label>{isId ? "Email Pengirim (From Email)" : "From Email"}</label>
                <input
                  type="email"
                  value={form.smtpFromEmail}
                  onChange={(e) => onInputChange("smtpFromEmail", e.target.value)}
                  placeholder="noreply@tppreneurs.com"
                />
              </div>

              <div className="sett-field">
                <label>{isId ? "Nama Pengirim (From Name)" : "From Name"}</label>
                <input
                  type="text"
                  value={form.smtpFromName}
                  onChange={(e) => onInputChange("smtpFromName", e.target.value)}
                  placeholder="TP PRENEURS"
                />
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: INVOICE & COMPANY INFORMATION */}
        {activeTab === "invoice" && (
          <section className="sett-section-card">
            <div className="sett-section-header">
              <div>
                <h2>
                  <FileText size={18} color="var(--sett-primary)" />
                  {isId ? "Pengaturan Faktur & Perusahaan" : "Invoice & Company Settings"}
                </h2>
                <p>
                  {isId
                    ? "Tampil di kop faktur pesanan pembeli (cetak PDF) dan email bukti pembelian."
                    : "Appears on order invoice headers (printable PDF) and purchase receipts."}
                </p>
              </div>
            </div>

            <div className="sett-form-grid">
              <div className="sett-toggle-box">
                <span>{isId ? "Kirim Faktur Otomatis ke Email Pembeli" : "Enable Invoice Send to Customer by Email"}</span>
                <div className="sett-toggle-segmented">
                  <button
                    type="button"
                    className={`sett-toggle-btn ${form.invoiceEmailEnabled === "true" ? "is-active" : ""}`}
                    onClick={() => onInputChange("invoiceEmailEnabled", "true")}
                  >
                    {isId ? "Ya (Yes)" : "Yes"}
                  </button>
                  <button
                    type="button"
                    className={`sett-toggle-btn ${form.invoiceEmailEnabled === "false" ? "is-active" : ""}`}
                    onClick={() => onInputChange("invoiceEmailEnabled", "false")}
                  >
                    {isId ? "Tidak (No)" : "No"}
                  </button>
                </div>
              </div>

              <div className="sett-field">
                <label>{isId ? "Email Pengirim Faktur" : "Invoice From Email"}</label>
                <input
                  type="email"
                  value={form.invoiceFromEmail}
                  onChange={(e) => onInputChange("invoiceFromEmail", e.target.value)}
                  placeholder="noreply@tppreneurs.com"
                />
              </div>

              {/* Company Details */}
              <div className="sett-field">
                <label>{isId ? "Nama Pengirim Faktur (Company/Sender Name)" : "Invoice Sender / Company Name"}</label>
                <input
                  type="text"
                  value={form.companyFromName}
                  onChange={(e) => onInputChange("companyFromName", e.target.value)}
                  placeholder="TP PRENEURS"
                />
              </div>

              <div className="sett-field">
                <label>{isId ? "Nama Badan Usaha / Perusahaan" : "Official Company Name"}</label>
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => onInputChange("companyName", e.target.value)}
                  placeholder="TP Preneurs Indonesia"
                />
              </div>

              <div className="sett-field">
                <label>{isId ? "Nomor NPWP / Pajak (VAT Number)" : "VAT / Tax Number"}</label>
                <input
                  type="text"
                  value={form.vatNumber}
                  onChange={(e) => onInputChange("vatNumber", e.target.value)}
                  placeholder="47589"
                />
              </div>

              <div className="sett-field">
                <label>{isId ? "Kode Pos Kantor" : "Postal Code"}</label>
                <input
                  type="text"
                  value={form.postCode}
                  onChange={(e) => onInputChange("postCode", e.target.value)}
                  placeholder="90222"
                />
              </div>

              <div className="sett-field sett-col-full">
                <label>{isId ? "Alamat Lengkap Perusahaan" : "Official Company Address"}</label>
                <textarea
                  rows={3}
                  value={form.companyAddress}
                  onChange={(e) => onInputChange("companyAddress", e.target.value)}
                  placeholder={isId ? "Alamat lengkap kantor resmi..." : "Full company registered address..."}
                />
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: CONTACT INFORMATION */}
        {activeTab === "contact" && (
          <section className="sett-section-card">
            <div className="sett-section-header">
              <div>
                <h2>
                  <Phone size={18} color="var(--sett-accent)" />
                  {isId ? "Informasi Kontak & Layanan Bantuan" : "Contact & Support Information"}
                </h2>
                <p>
                  {isId
                    ? "Tampil pada footer seluruh halaman toko (Storefront), top info bar, dan halaman Hubungi Kami."
                    : "Displayed on the storefront footer, top info bar, and Contact Us page."}
                </p>
              </div>
            </div>

            <div className="sett-form-grid">
              <div className="sett-field">
                <label>{isId ? "Nomor Telepon / Hotline CS" : "Customer Support Phone / Hotline"}</label>
                <input
                  type="text"
                  value={form.contactPhone}
                  onChange={(e) => onInputChange("contactPhone", e.target.value)}
                  placeholder="+62 821-8866-824"
                />
                <small>{isId ? "Tampil pada header Customer Support & Hub toko." : "Visible on top Customer Support & Hub bar."}</small>
              </div>

              <div className="sett-field">
                <label>{isId ? "Email Layanan Bantuan" : "Support Email"}</label>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => onInputChange("contactEmail", e.target.value)}
                  placeholder="tppreneurs@gmail.com"
                />
                <small>{isId ? "Email resmi untuk pertanyaan pembeli dan seller." : "Official email for buyer and seller inquiries."}</small>
              </div>

              <div className="sett-field sett-col-full">
                <label>{isId ? "Tautan Website Resmi" : "Official Website URL"}</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={(e) => onInputChange("website", e.target.value)}
                  placeholder="tppreneurs.com"
                />
                <small>{isId ? "Domain utama website toko." : "Primary marketplace web domain."}</small>
              </div>
            </div>
          </section>
        )}

        {/* Sticky Bottom Save Bar */}
        <div className="sett-sticky-bar">
          <div className="sett-sticky-info">
            <SettingsIcon size={16} />
            <span>
              {isId
                ? "Simpan perubahan untuk menerapkan ke seluruh sistem."
                : "Save changes to apply across all storefront and workspace systems."}
            </span>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="sett-btn-primary"
          >
            <Save size={15} />
            {isSaving
              ? (isId ? "Menyimpan Perubahan..." : "Saving Changes...")
              : (isId ? "Simpan Semua Pengaturan" : "Save All Settings")}
          </button>
        </div>
      </form>
    </div>
  );
}
