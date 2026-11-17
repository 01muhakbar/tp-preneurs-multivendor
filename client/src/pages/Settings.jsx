import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  CreditCard,
  FileText,
  Globe,
  Image as ImageIcon,
  Info,
  Layers,
  Lock,
  Mail,
  Navigation,
  Phone,
  RotateCcw,
  Save,
  Server,
  Settings as SettingsIcon,
  ShieldCheck,
  Sparkles,
  Truck,
  Upload,
  Zap,
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
  // Platform Master Shipping Governance (Fase 3)
  shippingMasterCouriers: JSON.stringify([
    "JNE", "JNT", "SICEPAT", "POS", "GRAB", "ANTERAJA", "LION", "WAHANA", "NINJA"
  ]),
  shippingMandatoryCouriers: JSON.stringify(["JNE", "JNT"]),
  shippingMasterCategories: JSON.stringify([
    "instant", "regular", "express", "economy", "cargo"
  ]),
  shippingZone1Multiplier: "1.0",
  shippingZone2Multiplier: "1.0",
  shippingZone3Multiplier: "1.0",
  shippingGrabBaseFare: "15000",
  shippingGrabPerKmRate: "3000",
  shippingMaxInstantDistanceKm: "40",
  shippingPlatformHandlingFee: "0",
  shippingMaintenanceNotices: JSON.stringify({}),
};

export const ADMIN_MASTER_COURIERS = [
  { code: "JNE", name: "JNE Express", services: "REG, YES, OKE, JTR Cargo", badge: "Nasional", color: "#2563eb" },
  { code: "JNT", name: "J&T Express", services: "EZ (Reguler), J&T Super", badge: "Populer", color: "#dc2626" },
  { code: "SICEPAT", name: "SiCepat Ekspres", services: "SIUNTUK, BEST, Gokil Cargo", badge: "Hemat/Kargo", color: "#d97706" },
  { code: "POS", name: "Pos Indonesia", services: "Pos Reguler, Next Day, Jumbo", badge: "BUMN Pelosok", color: "#ea580c" },
  { code: "GRAB", name: "GrabExpress", services: "Instant Motor, Instant Mobil, Same Day", badge: "Instan", color: "#059669" },
  { code: "ANTERAJA", name: "Anteraja", services: "Reguler, Next Day, Cargo", badge: "Reguler", color: "#7c3aed" },
  { code: "LION", name: "Lion Parcel", services: "REGPACK, ONEPACK, BIGPACK", badge: "Jalur Udara", color: "#e11d48" },
  { code: "WAHANA", name: "Wahana Express", services: "Service Normal, Cargo", badge: "Ekonomis", color: "#ca8a04" },
  { code: "NINJA", name: "Ninja Xpress", services: "Standard, Express", badge: "E-Commerce", color: "#991b1b" },
];

export const ADMIN_MASTER_CATEGORIES = [
  { code: "instant", labelId: "Instan & Same Day", labelEn: "Instant & Same Day", descId: "Radius Dekat 1-8 Jam (GrabExpress)", descEn: "Local 1-8 Hours (GrabExpress)" },
  { code: "regular", labelId: "Reguler", labelEn: "Regular", descId: "Standar 2 - 4 Hari Kerja (Seluruh Kurir)", descEn: "Standard 2 - 4 Business Days" },
  { code: "express", labelId: "Express / Kilat", labelEn: "Express / Next Day", descId: "1 - 2 Hari Cepat Sampai (YES, Super, BEST)", descEn: "1 - 2 Days Fast Delivery" },
  { code: "economy", labelId: "Hemat / Ekonomi", labelEn: "Economy / Budget", descId: "3 - 6 Hari Tarif Lebih Terjangkau", descEn: "3 - 6 Days Budget Friendly" },
  { code: "cargo", labelId: "Kargo / Muatan Berat", labelEn: "Cargo / Heavy Freight", descId: "Min. 10 kg Tarif Grosir / Truk", descEn: "Min. 10 kg Wholesale Trucking" },
];

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
    shippingMasterCouriers: toStringValue(
      merged.shippingMasterCouriers,
      DEFAULT_SETTINGS.shippingMasterCouriers
    ),
    shippingMandatoryCouriers: toStringValue(
      merged.shippingMandatoryCouriers,
      DEFAULT_SETTINGS.shippingMandatoryCouriers
    ),
    shippingMasterCategories: toStringValue(
      merged.shippingMasterCategories,
      DEFAULT_SETTINGS.shippingMasterCategories
    ),
    shippingZone1Multiplier: toStringValue(
      merged.shippingZone1Multiplier,
      DEFAULT_SETTINGS.shippingZone1Multiplier
    ),
    shippingZone2Multiplier: toStringValue(
      merged.shippingZone2Multiplier,
      DEFAULT_SETTINGS.shippingZone2Multiplier
    ),
    shippingZone3Multiplier: toStringValue(
      merged.shippingZone3Multiplier,
      DEFAULT_SETTINGS.shippingZone3Multiplier
    ),
    shippingGrabBaseFare: toStringValue(
      merged.shippingGrabBaseFare,
      DEFAULT_SETTINGS.shippingGrabBaseFare
    ),
    shippingGrabPerKmRate: toStringValue(
      merged.shippingGrabPerKmRate,
      DEFAULT_SETTINGS.shippingGrabPerKmRate
    ),
    shippingMaxInstantDistanceKm: toStringValue(
      merged.shippingMaxInstantDistanceKm,
      DEFAULT_SETTINGS.shippingMaxInstantDistanceKm
    ),
    shippingPlatformHandlingFee: toStringValue(
      merged.shippingPlatformHandlingFee,
      DEFAULT_SETTINGS.shippingPlatformHandlingFee
    ),
    shippingMaintenanceNotices: toStringValue(
      merged.shippingMaintenanceNotices,
      DEFAULT_SETTINGS.shippingMaintenanceNotices
    ),
  };
};

const parseJsonArray = (val, fallback = []) => {
  if (Array.isArray(val)) return val;
  try {
    const res = JSON.parse(val || "[]");
    return Array.isArray(res) ? res : fallback;
  } catch {
    return fallback;
  }
};

const parseJsonObject = (val, fallback = {}) => {
  if (val && typeof val === "object" && !Array.isArray(val)) return val;
  try {
    const res = JSON.parse(val || "{}");
    return res && typeof res === "object" && !Array.isArray(res) ? res : fallback;
  } catch {
    return fallback;
  }
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
  const [searchParams, setSearchParams] = useSearchParams();

  const VALID_TABS = ["branding", "general", "smtp", "invoice", "contact", "shipping"];
  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : "branding"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (nextTab) => {
    setActiveTab(nextTab);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", nextTab);
        return next;
      },
      { replace: true }
    );
  };
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

  const handleToggleMasterCourier = (code) => {
    const active = parseJsonArray(form.shippingMasterCouriers, ["JNE", "JNT"]);
    const isSelected = active.includes(code);
    let next;
    if (isSelected) {
      if (active.length <= 1) {
        alert(isId ? "Minimal harus ada 1 mitra ekspedisi yang aktif di platform." : "At least 1 courier partner must remain active.");
        return;
      }
      next = active.filter((c) => c !== code);
    } else {
      next = [...active, code];
    }
    onInputChange("shippingMasterCouriers", JSON.stringify(next));

    if (isSelected) {
      const mand = parseJsonArray(form.shippingMandatoryCouriers, ["JNE", "JNT"]).filter((c) => c !== code);
      onInputChange("shippingMandatoryCouriers", JSON.stringify(mand));
    }
  };

  const handleToggleMandatoryCourier = (code) => {
    const mand = parseJsonArray(form.shippingMandatoryCouriers, ["JNE", "JNT"]);
    const isMandatory = mand.includes(code);
    let next;
    if (isMandatory) {
      if (mand.length <= 1) {
        alert(isId ? "Minimal harus ada 1 kurir wajib nasional (rekomendasi: JNE atau J&T)." : "At least 1 mandatory fallback courier must remain.");
        return;
      }
      next = mand.filter((c) => c !== code);
    } else {
      next = [...mand, code];
      const active = parseJsonArray(form.shippingMasterCouriers, []);
      if (!active.includes(code)) {
        onInputChange("shippingMasterCouriers", JSON.stringify([...active, code]));
      }
    }
    onInputChange("shippingMandatoryCouriers", JSON.stringify(next));
  };

  const handleToggleMasterCategory = (catCode) => {
    const cats = parseJsonArray(form.shippingMasterCategories, ["regular"]);
    const isSelected = cats.includes(catCode);
    let next;
    if (isSelected) {
      if (cats.length <= 1) {
        alert(isId ? "Minimal harus ada 1 kategori pengiriman aktif." : "At least 1 category must remain active.");
        return;
      }
      next = cats.filter((c) => c !== catCode);
    } else {
      next = [...cats, catCode];
    }
    onInputChange("shippingMasterCategories", JSON.stringify(next));
  };

  const handleCourierNoticeChange = (code, noticeText) => {
    const notices = parseJsonObject(form.shippingMaintenanceNotices, {});
    const updated = { ...notices };
    if (!noticeText || !noticeText.trim()) {
      delete updated[code];
    } else {
      updated[code] = noticeText.trim();
    }
    onInputChange("shippingMaintenanceNotices", JSON.stringify(updated));
  };

  const applyAdminPresetStandard = () => {
    onInputChange("shippingMasterCouriers", JSON.stringify(["JNE", "JNT", "SICEPAT", "POS", "GRAB", "ANTERAJA", "LION", "WAHANA", "NINJA"]));
    onInputChange("shippingMandatoryCouriers", JSON.stringify(["JNE", "JNT"]));
    onInputChange("shippingMasterCategories", JSON.stringify(["instant", "regular", "express", "economy", "cargo"]));
    onInputChange("shippingZone1Multiplier", "1.0");
    onInputChange("shippingZone2Multiplier", "1.0");
    onInputChange("shippingZone3Multiplier", "1.0");
    onInputChange("shippingGrabBaseFare", "15000");
    onInputChange("shippingGrabPerKmRate", "3000");
    onInputChange("shippingMaxInstantDistanceKm", "40");
    onInputChange("shippingPlatformHandlingFee", "0");
    onInputChange("shippingMaintenanceNotices", JSON.stringify({}));
  };

  const applyAdminPresetWeatherEmergency = () => {
    const cats = parseJsonArray(form.shippingMasterCategories, []).filter((c) => c !== "instant");
    onInputChange("shippingMasterCategories", JSON.stringify(cats.length > 0 ? cats : ["regular"]));
    const notices = parseJsonObject(form.shippingMaintenanceNotices, {});
    notices["JNE"] = isId ? "Estimasi keterlambatan 1-2 hari karena cuaca ekstrem" : "Estimated 1-2 days delay due to extreme weather";
    notices["POS"] = isId ? "Pengiriman antarpulau mengalami antrean di pelabuhan" : "Inter-island shipment backlog at seaport";
    onInputChange("shippingMaintenanceNotices", JSON.stringify(notices));
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
            onClick={() => handleTabChange("branding")}
          >
            <Sparkles size={14} />
            {isId ? "Branding & Logo" : "Branding & Logos"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "general" ? "is-active" : ""}`}
            onClick={() => handleTabChange("general")}
          >
            <SettingsIcon size={14} />
            {isId ? "Umum & Wilayah" : "General & Locale"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "smtp" ? "is-active" : ""}`}
            onClick={() => handleTabChange("smtp")}
          >
            <Server size={14} />
            {isId ? "Akun Google SMTP" : "Google SMTP Account"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "invoice" ? "is-active" : ""}`}
            onClick={() => handleTabChange("invoice")}
          >
            <FileText size={14} />
            {isId ? "Faktur & Perusahaan" : "Invoice & Company"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "contact" ? "is-active" : ""}`}
            onClick={() => handleTabChange("contact")}
          >
            <Phone size={14} />
            {isId ? "Informasi Kontak" : "Contact Information"}
          </button>
          <button
            type="button"
            className={`sett-tab-btn ${activeTab === "shipping" ? "is-active" : ""}`}
            onClick={() => handleTabChange("shipping")}
          >
            <Truck size={14} />
            {isId ? "Pengaturan Pengiriman" : "Shipping Governance"}
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

        {/* TAB 6: MASTER SHIPPING GOVERNANCE */}
        {activeTab === "shipping" && (
          <section className="sett-section-card">
            <div className="sett-section-header">
              <div>
                <h2>
                  <Truck size={18} color="var(--sett-accent)" />
                  {isId ? "Tata Kelola Pengiriman Platform (Master Governance)" : "Platform Shipping Master Governance"}
                </h2>
                <p>
                  {isId
                    ? "Kelola aktivasi mitra ekspedisi nasional, kurir wajib platform, pengali tarif zona, dan catatan pemeliharaan secara mandiri & tanpa biaya pihak ketiga."
                    : "Manage master couriers, platform mandatory fallbacks, zone tariff multipliers, and emergency maintenance notices autonomously."}
                </p>
              </div>
            </div>

            {/* Platform Stats & Quick Presets Bar */}
            <div className="sett-shipping-stats-banner">
              <div className="sett-shipping-stats-group">
                <div className="sett-shipping-stat-pill">
                  <span className="sett-shipping-stat-label">{isId ? "Mitra Aktif" : "Active Couriers"}</span>
                  <strong className="sett-shipping-stat-val text-blue-600">
                    {parseJsonArray(form.shippingMasterCouriers, []).length} / {ADMIN_MASTER_COURIERS.length}
                  </strong>
                </div>
                <div className="sett-shipping-stat-pill">
                  <span className="sett-shipping-stat-label">{isId ? "Kurir Wajib" : "Mandatory Fallbacks"}</span>
                  <strong className="sett-shipping-stat-val text-amber-600">
                    {parseJsonArray(form.shippingMandatoryCouriers, []).length}
                  </strong>
                </div>
                <div className="sett-shipping-stat-pill">
                  <span className="sett-shipping-stat-label">{isId ? "Kategori Aktif" : "Active Categories"}</span>
                  <strong className="sett-shipping-stat-val text-emerald-600">
                    {parseJsonArray(form.shippingMasterCategories, []).length} / {ADMIN_MASTER_CATEGORIES.length}
                  </strong>
                </div>
                <div className="sett-shipping-stat-pill">
                  <span className="sett-shipping-stat-label">{isId ? "Tarif Grab Motor" : "Grab Bike"}</span>
                  <strong className="sett-shipping-stat-val text-slate-700">
                    Rp {Number(form.shippingGrabBaseFare || 15000).toLocaleString("id-ID")}
                  </strong>
                </div>
              </div>

              {/* Action Presets */}
              <div className="sett-shipping-presets">
                <span className="sett-shipping-preset-title">
                  <Sparkles size={13} />
                  {isId ? "Preset Cepat:" : "Quick Presets:"}
                </span>
                <button
                  type="button"
                  onClick={applyAdminPresetStandard}
                  className="sett-preset-btn sett-preset-btn--primary"
                  title={isId ? "Aktifkan seluruh 9 ekspedisi dengan tarif normal standar" : "Enable all 9 couriers with standard rate"}
                >
                  🚀 {isId ? "Mode Standar Nasional" : "National Standard"}
                </button>
                <button
                  type="button"
                  onClick={applyAdminPresetWeatherEmergency}
                  className="sett-preset-btn sett-preset-btn--warning"
                  title={isId ? "Matikan instan sementara & pasang peringatan keterlambatan cuaca" : "Pause instant & set weather alert"}
                >
                  🌧️ {isId ? "Mode Darurat Cuaca" : "Weather Emergency"}
                </button>
              </div>
            </div>

            {/* SUB-SECTION 1: 9 MASTER COURIERS */}
            <div className="sett-shipping-subpanel">
              <div className="sett-shipping-subpanel-title">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} color="var(--sett-primary)" />
                  <h3>{isId ? "Mitra Ekspedisi Platform (Master Couriers)" : "Platform Courier Partners"}</h3>
                </div>
                <small className="text-slate-500">
                  {isId
                    ? "Ekspedisi yang dinonaktifkan di sini otomatis tersembunyi dari seluruh toko & checkout."
                    : "Couriers disabled here are hidden from all stores and checkout platform-wide."}
                </small>
              </div>

              <div className="sett-courier-grid">
                {ADMIN_MASTER_COURIERS.map((courier) => {
                  const activeCouriers = parseJsonArray(form.shippingMasterCouriers, []);
                  const mandatoryCouriers = parseJsonArray(form.shippingMandatoryCouriers, []);
                  const notices = parseJsonObject(form.shippingMaintenanceNotices, {});
                  const isEnabled = activeCouriers.includes(courier.code);
                  const isMandatory = mandatoryCouriers.includes(courier.code);
                  const noticeText = notices[courier.code] || "";

                  return (
                    <div
                      key={courier.code}
                      className={`sett-courier-card ${isEnabled ? "is-enabled" : "is-disabled"}`}
                    >
                      <div className="sett-courier-card-head">
                        <div className="flex items-center gap-2.5">
                          <span
                            className="sett-courier-badge-bullet"
                            style={{ backgroundColor: courier.color }}
                          />
                          <div>
                            <h4 className="sett-courier-name">{courier.name}</h4>
                            <span className="sett-courier-services">{courier.services}</span>
                          </div>
                        </div>
                        <span className="sett-courier-tag">{courier.badge}</span>
                      </div>

                      <div className="sett-courier-toggles">
                        {/* Master Activation Toggle */}
                        <label className="sett-courier-switch-row">
                          <span className="sett-courier-switch-label">
                            {isId ? "Aktifkan di Platform" : "Enable Courier"}
                          </span>
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleMasterCourier(courier.code)}
                            className="sett-switch-checkbox"
                          />
                        </label>

                        {/* Mandatory Platform Courier Toggle */}
                        <label
                          className={`sett-courier-switch-row ${
                            !isEnabled ? "opacity-50 pointer-events-none" : ""
                          }`}
                        >
                          <span className="sett-courier-switch-label flex items-center gap-1">
                            <span className="text-amber-500 font-bold">★</span>
                            {isId ? "Kurir Wajib Platform" : "Mandatory Fallback"}
                          </span>
                          <input
                            type="checkbox"
                            checked={isMandatory}
                            disabled={!isEnabled}
                            onChange={() => handleToggleMandatoryCourier(courier.code)}
                            className="sett-switch-checkbox sett-switch-checkbox--amber"
                          />
                        </label>
                      </div>

                      {/* Maintenance / Operational Notice Input */}
                      <div className="sett-courier-notice-box">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                          <AlertTriangle size={11} className={noticeText ? "text-amber-500" : "text-slate-400"} />
                          {isId ? "Catatan Operasional / Gangguan (Opsional):" : "Operational / Weather Notice (Optional):"}
                        </label>
                        <input
                          type="text"
                          value={noticeText}
                          onChange={(e) => handleCourierNoticeChange(courier.code, e.target.value)}
                          placeholder={isId ? "Misal: Estimasi lambat 1 hari karena banjir/libur" : "e.g. Delays expected due to weather"}
                          className="sett-courier-notice-input"
                          maxLength={120}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SUB-SECTION 2: 5 GLOBAL CATEGORIES */}
            <div className="sett-shipping-subpanel">
              <div className="sett-shipping-subpanel-title">
                <div className="flex items-center gap-2">
                  <Layers size={16} color="var(--sett-primary)" />
                  <h3>{isId ? "Kategori Layanan Global (Master Categories)" : "Global Service Categories"}</h3>
                </div>
                <small className="text-slate-500">
                  {isId
                    ? "Kontrol kategori pengiriman yang diizinkan untuk digunakan toko dan dipilih oleh pembeli."
                    : "Control allowed shipping service tiers across the entire platform."}
                </small>
              </div>

              <div className="sett-category-grid">
                {ADMIN_MASTER_CATEGORIES.map((cat) => {
                  const activeCats = parseJsonArray(form.shippingMasterCategories, []);
                  const isChecked = activeCats.includes(cat.code);

                  return (
                    <label
                      key={cat.code}
                      className={`sett-category-card ${isChecked ? "is-checked" : "is-unchecked"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleMasterCategory(cat.code)}
                        className="sett-switch-checkbox"
                      />
                      <div className="flex-1">
                        <strong className="block text-sm text-slate-900">
                          {isId ? cat.labelId : cat.labelEn}
                        </strong>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {isId ? cat.descId : cat.descEn}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* SUB-SECTION 3: MULTI-ZONE MULTIPLIERS & GRABEXPRESS BASE TARIFFS */}
            <div className="sett-shipping-subpanel">
              <div className="sett-shipping-subpanel-title">
                <div className="flex items-center gap-2">
                  <Navigation size={16} color="var(--sett-accent)" />
                  <h3>{isId ? "Penyesuaian Tarif Multi-Zona & Instan (Pricing Controls)" : "Tariff Multipliers & Instant Pricing"}</h3>
                </div>
                <small className="text-slate-500">
                  {isId
                    ? "Sesuaikan faktor pengali tarif per zona dan tarif dasar kalkulator jarak Haversine GrabExpress (100% mandiri tanpa kuota API)."
                    : "Adjust zone multiplier rates and GrabExpress Haversine distance pricing."}
                </small>
              </div>

              <div className="sett-form-grid">
                {/* Zone 1 Multiplier */}
                <div className="sett-field">
                  <label>{isId ? "Pengali Tarif Zona 1 (Intra-Kota)" : "Zone 1 Multiplier (Intra-City)"}</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="5.0"
                    value={form.shippingZone1Multiplier}
                    onChange={(e) => onInputChange("shippingZone1Multiplier", e.target.value)}
                    placeholder="1.0"
                  />
                  <small>{isId ? "Standar: 1.0. Berlaku untuk pengiriman dalam kota yang sama." : "Default: 1.0 for shipments within the same city."}</small>
                </div>

                {/* Zone 2 Multiplier */}
                <div className="sett-field">
                  <label>{isId ? "Pengali Tarif Zona 2 (Intra-Pulau)" : "Zone 2 Multiplier (Intra-Island)"}</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="5.0"
                    value={form.shippingZone2Multiplier}
                    onChange={(e) => onInputChange("shippingZone2Multiplier", e.target.value)}
                    placeholder="1.0"
                  />
                  <small>{isId ? "Standar: 1.0. Berlaku untuk pengiriman antarkota dalam satu pulau." : "Default: 1.0 for inter-city shipments within the same island."}</small>
                </div>

                {/* Zone 3 Multiplier */}
                <div className="sett-field">
                  <label>{isId ? "Pengali Tarif Zona 3 (Antar-Pulau)" : "Zone 3 Multiplier (Inter-Island)"}</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.5"
                    max="5.0"
                    value={form.shippingZone3Multiplier}
                    onChange={(e) => onInputChange("shippingZone3Multiplier", e.target.value)}
                    placeholder="1.0"
                  />
                  <small>{isId ? "Standar: 1.0. Berlaku untuk pengiriman antarpulau di Indonesia." : "Default: 1.0 for inter-island national shipments."}</small>
                </div>

                {/* Platform Handling Fee */}
                <div className="sett-field">
                  <label>{isId ? "Biaya Penanganan Platform (Rp)" : "Platform Handling Fee (IDR)"}</label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={form.shippingPlatformHandlingFee}
                    onChange={(e) => onInputChange("shippingPlatformHandlingFee", e.target.value)}
                    placeholder="0"
                  />
                  <small>{isId ? "Biaya packing aman / proteksi platform tambahan per paket (opsional, default: Rp 0)." : "Optional safety packaging or platform handling fee per package."}</small>
                </div>

                {/* GrabExpress Base Fare */}
                <div className="sett-field">
                  <label>{isId ? "Tarif Dasar Minimum Grab Motor (Rp)" : "GrabExpress Bike Base Fare (IDR)"}</label>
                  <input
                    type="number"
                    step="1000"
                    min="5000"
                    value={form.shippingGrabBaseFare}
                    onChange={(e) => onInputChange("shippingGrabBaseFare", e.target.value)}
                    placeholder="15000"
                  />
                  <small>{isId ? "Tarif awal untuk radius 0-4 km pertama (default: Rp 15.000)." : "Initial fare for first 0-4 km."}</small>
                </div>

                {/* GrabExpress Per-Km Rate */}
                <div className="sett-field">
                  <label>{isId ? "Tarif Tambahan Per Km Grab Motor (Rp/km)" : "GrabExpress Bike Rate Per Km (IDR)"}</label>
                  <input
                    type="number"
                    step="500"
                    min="1000"
                    value={form.shippingGrabPerKmRate}
                    onChange={(e) => onInputChange("shippingGrabPerKmRate", e.target.value)}
                    placeholder="3000"
                  />
                  <small>{isId ? "Tarif per km setelah 4 km pertama (default: Rp 3.000/km)." : "Rate per km beyond 4 km."}</small>
                </div>

                {/* Max Instant Distance */}
                <div className="sett-field sett-col-full">
                  <label>{isId ? "Radius Maksimum Pengiriman Instan (Km)" : "Max Instant Delivery Radius (Km)"}</label>
                  <input
                    type="number"
                    step="5"
                    min="10"
                    max="100"
                    value={form.shippingMaxInstantDistanceKm}
                    onChange={(e) => onInputChange("shippingMaxInstantDistanceKm", e.target.value)}
                    placeholder="40"
                  />
                  <small>{isId ? "Jarak maksimal radius GPS untuk menampilkan layanan GrabExpress di Checkout (default: 40 km)." : "Maximum GPS road distance for GrabExpress availability."}</small>
                </div>
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
