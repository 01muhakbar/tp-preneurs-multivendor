import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Globe,
  Image as ImageIcon,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import {
  fetchAdminStoreProfiles,
  updateAdminStoreProfile,
  uploadAdminStoreProfileImage,
} from "../../api/adminStoreProfile.ts";
import {
  AdminOpsEmptyState,
  AdminOpsErrorState,
  AdminOpsLoadingState,
} from "../../components/admin/AdminOpsPrimitives.jsx";
import {
  getCityOptions,
  getDistrictOptions,
  getProvinceOptions,
} from "../../utils/idRegions.ts";
import "./AdminStoreProfilePage.css";

const STORE_PROFILES_QUERY_KEY = ["admin-store-profiles"];
const ITEMS_PER_SLIDE = 10;

const PROFILE_FIELDS = [
  "name",
  "slug",
  "description",
  "logoUrl",
  "bannerUrl",
  "phone",
  "email",
  "addressLine1",
];

const SHIPPING_FIELDS = [
  "originContactName",
  "originPhone",
  "originAddressLine",
  "originCity",
  "originProvince",
  "originPostalCode",
];

const ISSUE_KEY_MAP = {
  logoUrl: "logoUrl",
  bannerUrl: "bannerUrl",
  phone: "phone",
  email: "email",
  addressLine1: "addressLine1",
  postalCode: "postalCode",
  description: "description",
  originContactName: "originContactName",
  originPhone: "originPhone",
  originAddressLine: "originAddressLine",
  originCity: "originCity",
  originProvince: "originProvince",
  originPostalCode: "originPostalCode",
};

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "";

const textValue = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeKey = (key) =>
  String(key || "")
    .replace(/[_-\s]+(.)?/g, (_, letter) => (letter ? letter.toUpperCase() : ""))
    .replace(/^(.)/, (letter) => letter.toLowerCase());

const formatFieldLabel = (value, isId = false) => {
  const source = String(value || "").trim();
  const normalized = normalizeKey(source);
  const map = {
    logoUrl: isId ? "Logo Toko" : "Store Logo",
    bannerUrl: isId ? "Banner Toko" : "Store Banner",
    phone: isId ? "Nomor Telepon" : "Phone Number",
    email: isId ? "Email Toko" : "Store Email",
    addressLine1: isId ? "Alamat Toko" : "Store Address",
    postalCode: isId ? "Kode Pos" : "Postal Code",
    description: isId ? "Deskripsi" : "Description",
    originContactName: isId ? "Nama Pengirim" : "Sender Contact",
    originPhone: isId ? "No. HP Pengirim" : "Sender Phone",
    originAddressLine: isId ? "Alamat Pengiriman" : "Origin Address",
    originCity: isId ? "Kota Pengiriman" : "Origin City",
    originProvince: isId ? "Provinsi Pengiriman" : "Origin Province",
    originPostalCode: isId ? "Kode Pos Pengiriman" : "Origin Postal Code",
  };
  return (
    map[source] ||
    map[normalized] ||
    source
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
};

const isPresent = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return String(value ?? "").trim().length > 0;
};

export const normalizeStores = (payload) => {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.data)) return payload.data.filter(Boolean);
  if (Array.isArray(payload?.items)) return payload.items.filter(Boolean);
  if (Array.isArray(payload?.data?.items)) return payload.data.items.filter(Boolean);
  return [];
};

export const getStoreName = (entry, fallback = "Toko Tanpa Nama") => {
  const store = entry?.store || entry || {};
  return (
    textValue(store.name) ||
    textValue(store.storeName) ||
    textValue(store.publicName) ||
    textValue(entry?.publicIdentity?.name) ||
    fallback
  );
};

export const getStoreSlug = (entry) => {
  const store = entry?.store || entry || {};
  return (
    textValue(store.slug) ||
    textValue(store.storeSlug) ||
    textValue(entry?.publicIdentity?.slug) ||
    ""
  );
};

export const getStoreId = (entry) => {
  const store = entry?.store || entry || {};
  return store.id ?? store.storeId ?? entry?.id ?? entry?.storeId ?? getStoreSlug(entry);
};

export const getOwner = (entry) =>
  entry?.owner || entry?.user || entry?.seller || entry?.store?.owner || null;

export const readValue = (entry, key) => {
  const normalizedKey = normalizeKey(key);
  const sources = [
    entry?.store,
    entry,
    entry?.profile,
    entry?.publicProfile,
    entry?.publicIdentity,
    entry?.shipping,
    entry?.shippingOrigin,
    entry?.store?.profile,
    entry?.store?.publicProfile,
    entry?.store?.shipping,
    entry?.store?.shippingOrigin,
    entry?.store?.shippingSetupSummary,
    entry?.store?.shippingSetup,
  ];

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    if (source[key] !== undefined && source[key] !== null) return source[key];
    if (source[normalizedKey] !== undefined && source[normalizedKey] !== null) {
      return source[normalizedKey];
    }
  }
  return undefined;
};

export const getMissing = (entry, fields, isId = false) => {
  const store = entry?.store || entry || {};
  const explicit =
    fields === PROFILE_FIELDS
      ? store?.completeness?.missingFields
      : fields === SHIPPING_FIELDS
        ? store?.missingShippingFields
        : null;

  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit
      .map((field) =>
        formatFieldLabel(field?.label || field?.field || field?.key || field, isId)
      )
      .filter(Boolean);
  }

  return fields
    .filter((field) => !isPresent(readValue(entry, field)))
    .map((field) => formatFieldLabel(field, isId));
};

export const getProfileScore = (entry) => {
  const store = entry?.store || entry || {};
  const completed = Number(store?.completeness?.completedFields);
  const total = Number(store?.completeness?.totalFields);
  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {
    return { complete: completed, total, missing: Math.max(total - completed, 0) };
  }
  const missing = getMissing(entry, PROFILE_FIELDS).length;
  return { complete: PROFILE_FIELDS.length - missing, total: PROFILE_FIELDS.length, missing };
};

export const getShippingScore = (entry) => {
  const missing = getMissing(entry, SHIPPING_FIELDS).length;
  const total = SHIPPING_FIELDS.length;
  return { complete: total - missing, total, missing };
};

const hasPublicReadiness = (entry) => {
  const readiness = entry?.publicIdentity?.summary?.operationalReadiness;
  if (readiness && typeof readiness.isReady === "boolean") return readiness.isReady;
  return Boolean(getStoreSlug(entry) && getProfileScore(entry).complete >= 3);
};

export const getPriority = (entry) => {
  const profileMissing = getProfileScore(entry).missing;
  const shippingMissing = getShippingScore(entry).missing;
  const status = String(readValue(entry, "status") || "").toUpperCase();
  const totalMissing = profileMissing + shippingMissing;
  if (totalMissing >= 4 || status !== "ACTIVE" || !hasPublicReadiness(entry)) return "High";
  if (totalMissing > 0) return "Medium";
  return "Low";
};

export const filterStore = (entry, activeFilter) => {
  const profileMissing = getProfileScore(entry).missing;
  const shippingMissing = getShippingScore(entry).missing;
  const status = String(readValue(entry, "status") || "").toUpperCase();
  switch (activeFilter) {
    case "review":
      return profileMissing > 0 || shippingMissing > 0;
    case "profile":
      return profileMissing > 0;
    case "shipping":
      return shippingMissing > 0;
    case "public":
      return hasPublicReadiness(entry);
    case "live":
      return status === "ACTIVE";
    default:
      return true;
  }
};

const getInitials = (name) => {
  const words = textValue(name, "S").split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
};

/* ==========================================================================
   MANAGEMENT MODAL / DRAWER COMPONENT
   ========================================================================== */
function AdminStoreManageModal({ entry, isOpen, onClose, onSave, isSaving, isId }) {
  const [activeTab, setActiveTab] = useState("identity");
  const [form, setForm] = useState(null);
  const [uploading, setUploading] = useState("");
  const logoFileRef = useRef(null);
  const bannerFileRef = useRef(null);

  useEffect(() => {
    if (entry && isOpen) {
      const store = entry?.store || entry || {};
      const owner = getOwner(entry);
      setForm({
        name: getStoreName(entry),
        slug: getStoreSlug(entry),
        status: String(readValue(entry, "status") || "ACTIVE").toUpperCase(),
        description: textValue(readValue(entry, "description")),
        logoUrl: textValue(readValue(entry, "logoUrl")),
        bannerUrl: textValue(readValue(entry, "bannerUrl")),
        email: textValue(readValue(entry, "email") || owner?.email),
        phone: textValue(readValue(entry, "phone")),
        whatsapp: textValue(readValue(entry, "whatsapp")),
        websiteUrl: textValue(readValue(entry, "websiteUrl")),
        instagramUrl: textValue(readValue(entry, "instagramUrl")),
        tiktokUrl: textValue(readValue(entry, "tiktokUrl")),
        addressLine1: textValue(readValue(entry, "addressLine1")),
        addressLine2: textValue(readValue(entry, "addressLine2")),
        province: textValue(readValue(entry, "province") || readValue(entry, "originProvince")),
        city: textValue(readValue(entry, "city") || readValue(entry, "originCity")),
        district: textValue(readValue(entry, "district") || readValue(entry, "originDistrict")),
        postalCode: textValue(readValue(entry, "postalCode") || readValue(entry, "originPostalCode")),
        country: textValue(readValue(entry, "country"), "Indonesia"),
      });
      setActiveTab("identity");
    }
  }, [entry, isOpen]);

  if (!isOpen || !entry || !form) return null;

  const storeId = getStoreId(entry);
  const storeName = getStoreName(entry);

  const provinces = getProvinceOptions(form.province);
  const cities = getCityOptions(form.province, form.city);
  const districts = getDistrictOptions(form.province, form.city, form.district);

  const handleFieldChange = (field) => (e) => {
    const val = e.target.value;
    setForm((curr) => {
      const next = { ...curr, [field]: val };
      if (field === "province") {
        next.city = "";
        next.district = "";
      } else if (field === "city") {
        next.district = "";
      }
      return next;
    });
  };

  const handleFileUpload = async (field, file) => {
    if (!file) return;
    setUploading(field);
    try {
      const url = await uploadAdminStoreProfileImage(file);
      if (url) {
        setForm((curr) => ({ ...curr, [field]: url }));
        toast.success(
          isId
            ? `${field === "logoUrl" ? "Logo" : "Banner"} berhasil diunggah`
            : `${field === "logoUrl" ? "Logo" : "Banner"} uploaded successfully`
        );
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err) || (isId ? "Gagal mengunggah berkas" : "Failed to upload file")
      );
    } finally {
      setUploading("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(storeId, form);
  };

  return (
    <div className="asp2026-modal-overlay" onClick={onClose}>
      <div className="asp2026-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="asp2026-modal-header">
          <div className="asp2026-modal-header-left">
            <div className="asp2026-avatar">
              {form.logoUrl ? (
                <img src={form.logoUrl} alt="" className="asp2026-avatar__img" />
              ) : (
                getInitials(storeName)
              )}
            </div>
            <div>
              <h2>{storeName}</h2>
              <p>ID #{storeId} &bull; /@{form.slug}</p>
            </div>
          </div>
          <button
            type="button"
            className="asp2026-modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="asp2026-modal-tabs">
          <button
            type="button"
            className={`asp2026-modal-tab ${activeTab === "identity" ? "is-active" : ""}`}
            onClick={() => setActiveTab("identity")}
          >
            <Store size={14} />
            {isId ? "Identitas & Media" : "Identity & Media"}
          </button>
          <button
            type="button"
            className={`asp2026-modal-tab ${activeTab === "contact" ? "is-active" : ""}`}
            onClick={() => setActiveTab("contact")}
          >
            <Phone size={14} />
            {isId ? "Kontak & Sosmed" : "Contact & Social"}
          </button>
          <button
            type="button"
            className={`asp2026-modal-tab ${activeTab === "address" ? "is-active" : ""}`}
            onClick={() => setActiveTab("address")}
          >
            <MapPin size={14} />
            {isId ? "Alamat & Wilayah" : "Address & Region"}
          </button>
          <button
            type="button"
            className={`asp2026-modal-tab ${activeTab === "readiness" ? "is-active" : ""}`}
            onClick={() => setActiveTab("readiness")}
          >
            <ShieldCheck size={14} />
            {isId ? "Kesiapan Operasional" : "Readiness Status"}
          </button>
        </div>

        {/* Form Body */}
        <form id="asp2026-manage-form" onSubmit={handleSubmit} className="asp2026-modal-body">
          {activeTab === "identity" && (
            <div className="asp2026-form-grid">
              <div className="asp2026-field">
                <label>{isId ? "Nama Toko" : "Store Name"}</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleFieldChange("name")}
                  required
                />
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Slug Toko (URL)" : "Store Slug (URL)"}</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={handleFieldChange("slug")}
                  required
                />
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Status Toko" : "Store Status"}</label>
                <select value={form.status} onChange={handleFieldChange("status")}>
                  <option value="ACTIVE">{isId ? "Aktif (Live)" : "Active (Live)"}</option>
                  <option value="INACTIVE">{isId ? "Nonaktif (Inactive)" : "Inactive"}</option>
                </select>
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Tautan Etalase" : "Storefront Preview"}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, height: 38 }}>
                  <span className="asp2026-store-slug">/@{form.slug}</span>
                  <a
                    href={`/store/${encodeURIComponent(form.slug)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="asp2026-preview-btn"
                    title={isId ? "Lihat di tab baru" : "View storefront in new tab"}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </div>

              <div className="asp2026-field asp2026-form-col-full">
                <label>{isId ? "Deskripsi Toko" : "Store Description"}</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={handleFieldChange("description")}
                  placeholder={isId ? "Deskripsi singkat profil toko..." : "Short store description..."}
                />
              </div>

              {/* Logo Box */}
              <div className="asp2026-field">
                <label>{isId ? "Logo Toko" : "Store Logo"}</label>
                <div className="asp2026-media-box">
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Logo" className="asp2026-media-thumb" />
                  ) : (
                    <div className="asp2026-media-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon size={22} color="#94a3b8" />
                    </div>
                  )}
                  <div className="asp2026-media-actions">
                    <input
                      type="file"
                      ref={logoFileRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={(e) => handleFileUpload("logoUrl", e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      className="asp2026-media-btn"
                      onClick={() => logoFileRef.current?.click()}
                      disabled={uploading === "logoUrl"}
                    >
                      <Upload size={12} />
                      {uploading === "logoUrl"
                        ? (isId ? "Mengunggah..." : "Uploading...")
                        : (isId ? "Unggah Logo" : "Upload Logo")}
                    </button>
                    {form.logoUrl && (
                      <button
                        type="button"
                        className="asp2026-media-btn asp2026-media-btn--danger"
                        onClick={() => setForm((curr) => ({ ...curr, logoUrl: "" }))}
                      >
                        <Trash2 size={12} />
                        {isId ? "Hapus" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Banner Box */}
              <div className="asp2026-field">
                <label>{isId ? "Banner Toko" : "Store Banner"}</label>
                <div className="asp2026-media-box">
                  {form.bannerUrl ? (
                    <img src={form.bannerUrl} alt="Banner" className="asp2026-media-thumb" style={{ width: 80 }} />
                  ) : (
                    <div className="asp2026-media-thumb" style={{ width: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ImageIcon size={22} color="#94a3b8" />
                    </div>
                  )}
                  <div className="asp2026-media-actions">
                    <input
                      type="file"
                      ref={bannerFileRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={(e) => handleFileUpload("bannerUrl", e.target.files?.[0])}
                    />
                    <button
                      type="button"
                      className="asp2026-media-btn"
                      onClick={() => bannerFileRef.current?.click()}
                      disabled={uploading === "bannerUrl"}
                    >
                      <Upload size={12} />
                      {uploading === "bannerUrl"
                        ? (isId ? "Mengunggah..." : "Uploading...")
                        : (isId ? "Unggah Banner" : "Upload Banner")}
                    </button>
                    {form.bannerUrl && (
                      <button
                        type="button"
                        className="asp2026-media-btn asp2026-media-btn--danger"
                        onClick={() => setForm((curr) => ({ ...curr, bannerUrl: "" }))}
                      >
                        <Trash2 size={12} />
                        {isId ? "Hapus" : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "contact" && (
            <div className="asp2026-form-grid">
              <div className="asp2026-field">
                <label>{isId ? "Email Toko" : "Store Email"}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleFieldChange("email")}
                  placeholder="store@example.com"
                />
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Nomor Telepon" : "Phone Number"}</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={handleFieldChange("phone")}
                  placeholder="+62 8..."
                />
              </div>

              <div className="asp2026-field">
                <label>WhatsApp</label>
                <input
                  type="text"
                  value={form.whatsapp}
                  onChange={handleFieldChange("whatsapp")}
                  placeholder="+62 8..."
                />
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Website Resmi" : "Website URL"}</label>
                <input
                  type="url"
                  value={form.websiteUrl}
                  onChange={handleFieldChange("websiteUrl")}
                  placeholder="https://..."
                />
              </div>

              <div className="asp2026-field">
                <label>Instagram URL</label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={handleFieldChange("instagramUrl")}
                  placeholder="https://instagram.com/..."
                />
              </div>

              <div className="asp2026-field">
                <label>TikTok URL</label>
                <input
                  type="url"
                  value={form.tiktokUrl}
                  onChange={handleFieldChange("tiktokUrl")}
                  placeholder="https://tiktok.com/@..."
                />
              </div>
            </div>
          )}

          {activeTab === "address" && (
            <div className="asp2026-form-grid">
              <div className="asp2026-field asp2026-form-col-full">
                <label>{isId ? "Alamat Lengkap (Baris 1)" : "Address Line 1"}</label>
                <input
                  type="text"
                  value={form.addressLine1}
                  onChange={handleFieldChange("addressLine1")}
                  placeholder={isId ? "Nama jalan, nomor rumah/gedung..." : "Street name, building number..."}
                />
              </div>

              <div className="asp2026-field asp2026-form-col-full">
                <label>{isId ? "Detail Tambahan (Baris 2)" : "Address Line 2 (Optional)"}</label>
                <input
                  type="text"
                  value={form.addressLine2}
                  onChange={handleFieldChange("addressLine2")}
                  placeholder={isId ? "Lantai, blok, patokan (opsional)..." : "Floor, block, landmark (optional)..."}
                />
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Provinsi" : "Province"}</label>
                <select value={form.province} onChange={handleFieldChange("province")}>
                  <option value="">{isId ? "-- Pilih Provinsi --" : "-- Select Province --"}</option>
                  {provinces.map((prov) => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Kota / Kabupaten" : "City / Regency"}</label>
                <select
                  value={form.city}
                  onChange={handleFieldChange("city")}
                  disabled={!form.province}
                >
                  <option value="">{isId ? "-- Pilih Kota --" : "-- Select City --"}</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Kecamatan" : "District / Subdistrict"}</label>
                <select
                  value={form.district}
                  onChange={handleFieldChange("district")}
                  disabled={!form.city}
                >
                  <option value="">{isId ? "-- Pilih Kecamatan --" : "-- Select District --"}</option>
                  {districts.map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div className="asp2026-field">
                <label>{isId ? "Kode Pos" : "Postal Code"}</label>
                <input
                  type="text"
                  value={form.postalCode}
                  onChange={handleFieldChange("postalCode")}
                  placeholder="90222"
                />
              </div>
            </div>
          )}

          {activeTab === "readiness" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: 14, background: "var(--asp-bg-subpanel)", borderRadius: 8, border: "1px solid var(--asp-border)" }}>
                  <small style={{ color: "var(--asp-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    {isId ? "Kelengkapan Profil" : "Profile Completeness"}
                  </small>
                  <div style={{ fontSize: 18, fontWeight: 750, marginTop: 4, color: "var(--asp-text-title)" }}>
                    {getProfileScore(entry).complete} / {getProfileScore(entry).total}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--asp-text-muted)", marginTop: 2 }}>
                    {getProfileScore(entry).missing === 0
                      ? (isId ? "Semua field profil lengkap" : "All profile fields filled")
                      : (isId ? `${getProfileScore(entry).missing} field belum lengkap` : `${getProfileScore(entry).missing} fields missing`)}
                  </div>
                </div>

                <div style={{ padding: 14, background: "var(--asp-bg-subpanel)", borderRadius: 8, border: "1px solid var(--asp-border)" }}>
                  <small style={{ color: "var(--asp-text-muted)", textTransform: "uppercase", fontWeight: 700 }}>
                    {isId ? "Status Pengiriman" : "Shipping Setup"}
                  </small>
                  <div style={{ fontSize: 18, fontWeight: 750, marginTop: 4, color: "var(--asp-text-title)" }}>
                    {getShippingScore(entry).missing === 0
                      ? (isId ? "Siap Kirim" : "Shipping Ready")
                      : `${getShippingScore(entry).missing} ${isId ? "Field Kurang" : "Missing"}`}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--asp-text-muted)", marginTop: 2 }}>
                    {getShippingScore(entry).missing === 0
                      ? (isId ? "Asal ekspedisi terkonfigurasi" : "Origin logistics configured")
                      : (isId ? "Perlu melengkapi alamat asal" : "Needs origin address")}
                  </div>
                </div>
              </div>

              {/* Missing Fields list if any */}
              {getMissing(entry, PROFILE_FIELDS, isId).length > 0 && (
                <div style={{ padding: 12, borderRadius: 8, background: "rgba(254, 111, 5, 0.08)", border: "1px solid rgba(254, 111, 5, 0.25)" }}>
                  <strong style={{ fontSize: 12, color: "#e05e00", display: "block", marginBottom: 6 }}>
                    {isId ? "Field Profil yang Belum Diisi:" : "Missing Profile Fields:"}
                  </strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {getMissing(entry, PROFILE_FIELDS, isId).map((f) => (
                      <span key={f} style={{ fontSize: 11, background: "white", padding: "2px 8px", borderRadius: 4, border: "1px solid #fed7aa", color: "#c2410c" }}>
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Footer */}
        <div className="asp2026-modal-footer">
          <button type="button" className="asp2026-btn-secondary" onClick={onClose} disabled={isSaving}>
            {isId ? "Batal" : "Cancel"}
          </button>
          <button
            type="submit"
            form="asp2026-manage-form"
            className="asp2026-btn-primary"
            disabled={isSaving || Boolean(uploading)}
          >
            <Save size={14} />
            {isSaving
              ? (isId ? "Menyimpan..." : "Saving...")
              : (isId ? "Simpan Perubahan" : "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN ADMIN STORE PROFILE PAGE
   ========================================================================== */
export default function AdminStoreProfilePage() {
  const { t, i18n } = useTranslation(["admin", "common"]);
  const queryClient = useQueryClient();
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortMode, setSortMode] = useState("priority");
  const [currentSlide, setCurrentSlide] = useState(1);
  const [managingStore, setManagingStore] = useState(null);

  const profilesQuery = useQuery({
    queryKey: STORE_PROFILES_QUERY_KEY,
    queryFn: fetchAdminStoreProfiles,
  });

  const stores = useMemo(() => normalizeStores(profilesQuery.data), [profilesQuery.data]);

  // Reset to slide 1 on search or filter change
  useEffect(() => {
    setCurrentSlide(1);
  }, [activeFilter, searchTerm, sortMode]);

  const mutation = useMutation({
    mutationFn: ({ storeId, payload }) => updateAdminStoreProfile(storeId, payload),
    meta: { suppressGlobalToast: true },
    onSuccess: async () => {
      toast.success(
        isId ? "Profil toko berhasil disimpan" : "Store profile saved successfully",
        { id: "admin-store-profile-saved" }
      );
      setManagingStore(null);
      await queryClient.invalidateQueries({ queryKey: STORE_PROFILES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["storefront"], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["seller2026"], exact: false });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error) ||
          (isId ? "Gagal memperbarui profil toko." : "Failed to update store profile."),
        { id: "admin-store-profile-error" }
      );
    },
  });

  const summary = useMemo(() => {
    const review = stores.filter((entry) => filterStore(entry, "review")).length;
    const profile = stores.filter((entry) => filterStore(entry, "profile")).length;
    const shipping = stores.filter((entry) => filterStore(entry, "shipping")).length;
    return { stores: stores.length, review, profile, shipping };
  }, [stores]);

  const FILTERS = useMemo(
    () => [
      { id: "all", label: isId ? "Semua" : "All" },
      { id: "review", label: isId ? "Perlu Tinjau" : "Needs Review" },
      { id: "profile", label: isId ? "Profil Belum Lengkap" : "Profile Missing" },
      { id: "shipping", label: isId ? "Pengiriman" : "Shipping Missing" },
      { id: "public", label: isId ? "Publik Siap" : "Public Ready" },
      { id: "live", label: isId ? "Aktif" : "Active" },
    ],
    [isId]
  );

  const chipCounts = useMemo(
    () =>
      FILTERS.reduce((acc, filter) => {
        acc[filter.id] =
          filter.id === "all"
            ? stores.length
            : stores.filter((entry) => filterStore(entry, filter.id)).length;
        return acc;
      }, {}),
    [FILTERS, stores]
  );

  const visibleStores = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return stores
      .filter((entry) => filterStore(entry, activeFilter))
      .filter((entry) => {
        if (!query) return true;
        const owner = getOwner(entry);
        return [getStoreName(entry), getStoreSlug(entry), owner?.name, owner?.email].some(
          (value) => String(value || "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        if (sortMode === "name") {
          return getStoreName(a).localeCompare(getStoreName(b));
        }
        const pRankA = getPriority(a) === "High" ? 0 : getPriority(a) === "Medium" ? 1 : 2;
        const pRankB = getPriority(b) === "High" ? 0 : getPriority(b) === "Medium" ? 1 : 2;
        return pRankA - pRankB || getStoreName(a).localeCompare(getStoreName(b));
      });
  }, [activeFilter, searchTerm, sortMode, stores]);

  // Slide Pagination (10 Items per slide)
  const totalSlides = Math.max(1, Math.ceil(visibleStores.length / ITEMS_PER_SLIDE));
  const currentSlideStores = useMemo(() => {
    const start = (currentSlide - 1) * ITEMS_PER_SLIDE;
    return visibleStores.slice(start, start + ITEMS_PER_SLIDE);
  }, [currentSlide, visibleStores]);

  const slideFrom = visibleStores.length === 0 ? 0 : (currentSlide - 1) * ITEMS_PER_SLIDE + 1;
  const slideTo = Math.min(currentSlide * ITEMS_PER_SLIDE, visibleStores.length);

  const handleQuickToggle = (entry) => {
    const storeId = getStoreId(entry);
    const currStatus = String(readValue(entry, "status") || "ACTIVE").toUpperCase();
    const nextStatus = currStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    mutation.mutate({
      storeId,
      payload: { status: nextStatus },
    });
  };

  const handleSaveModal = (storeId, formValues) => {
    mutation.mutate({
      storeId,
      payload: {
        name: formValues.name,
        slug: formValues.slug,
        status: formValues.status,
        description: formValues.description,
        logoUrl: formValues.logoUrl,
        bannerUrl: formValues.bannerUrl,
        email: formValues.email,
        phone: formValues.phone,
        whatsapp: formValues.whatsapp,
        websiteUrl: formValues.websiteUrl,
        instagramUrl: formValues.instagramUrl,
        tiktokUrl: formValues.tiktokUrl,
        addressLine1: formValues.addressLine1,
        addressLine2: formValues.addressLine2,
        province: formValues.province,
        city: formValues.city,
        district: formValues.district,
        postalCode: formValues.postalCode,
        country: formValues.country,
      },
    });
  };

  return (
    <div className="asp2026">
      {/* Header */}
      <header className="asp2026-header">
        <div>
          <div className="asp2026-title-with-count">
            <h1>{isId ? "Profil Toko" : "Store Profile"}</h1>
            <span className="asp2026-count-pill">{stores.length}</span>
          </div>
          <p>
            {isId
              ? "Tinjau kesiapan, kelengkapan profil, dan kelola sinkronisasi toko."
              : "Review store readiness, completeness, and manage store synchronization."}
          </p>
        </div>
        <div className="asp2026-header__actions">
          <button
            type="button"
            className="asp2026-refresh-btn"
            onClick={() => profilesQuery.refetch()}
            disabled={profilesQuery.isFetching}
          >
            <RefreshCw size={14} className={profilesQuery.isFetching ? "spin" : ""} />
            {isId ? "Muat Ulang" : "Refresh"}
          </button>
          <Link to="/admin/store/applications" className="asp2026-primary-btn">
            <Plus size={15} />
            {isId ? "Aplikasi Toko" : "Store Applications"}
          </Link>
        </div>
      </header>

      {/* Metrics Section */}
      <section className="asp2026-metrics" aria-label="Store Metrics">
        <div className="asp2026-metric asp2026-metric--navy">
          <div className="asp2026-metric__icon">
            <Store size={20} />
          </div>
          <div className="asp2026-metric__body">
            <p>{isId ? "Total Toko" : "Total Stores"}</p>
            <strong>{summary.stores}</strong>
          </div>
        </div>

        <div className="asp2026-metric asp2026-metric--orange">
          <div className="asp2026-metric__icon">
            <AlertCircle size={20} />
          </div>
          <div className="asp2026-metric__body">
            <p>{isId ? "Perlu Tinjau" : "Needs Review"}</p>
            <strong>{summary.review}</strong>
          </div>
        </div>

        <div className="asp2026-metric asp2026-metric--teal">
          <div className="asp2026-metric__icon">
            <UserRound size={20} />
          </div>
          <div className="asp2026-metric__body">
            <p>{isId ? "Profil Belum Lengkap" : "Missing Profile"}</p>
            <strong>{summary.profile}</strong>
          </div>
        </div>

        <div className="asp2026-metric asp2026-metric--amber">
          <div className="asp2026-metric__icon">
            <Truck size={20} />
          </div>
          <div className="asp2026-metric__body">
            <p>{isId ? "Asal Pengiriman Belum Ada" : "Missing Shipping"}</p>
            <strong>{summary.shipping}</strong>
          </div>
        </div>
      </section>

      {/* Toolbar & Filter Bar */}
      <section className="asp2026-toolbar">
        <div className="asp2026-search">
          <Search size={15} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={
              isId
                ? "Cari nama toko, slug, atau nama penjual..."
                : "Search store name, slug, or seller..."
            }
          />
        </div>

        <div className="asp2026-toolbar-right">
          <select
            className="asp2026-select"
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
          >
            <option value="priority">{isId ? "Prioritas: Tertinggi" : "Priority: Highest"}</option>
            <option value="name">{isId ? "Nama Toko (A-Z)" : "Store Name (A-Z)"}</option>
          </select>
        </div>
      </section>

      {/* Filter Tabs */}
      <nav className="asp2026-filters" aria-label="Filter stores">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilter === filter.id ? "is-active" : ""}
            onClick={() => setActiveFilter(filter.id)}
          >
            <span>{filter.label}</span>
            <span className="asp2026-filter-count">{chipCounts[filter.id] ?? 0}</span>
          </button>
        ))}
      </nav>

      {/* Content Rendering */}
      {profilesQuery.isLoading ? (
        <AdminOpsLoadingState
          title={isId ? "Memuat profil toko..." : "Loading store profiles..."}
          message={isId ? "Menghubungkan data toko dan kesiapan operasional." : "Fetching store data and operational readiness."}
        />
      ) : profilesQuery.isError ? (
        <AdminOpsErrorState
          title={isId ? "Gagal memuat profil toko" : "Failed to load store profiles"}
          message={getErrorMessage(profilesQuery.error) || (isId ? "Terjadi kesalahan saat memuat data toko." : "An error occurred while loading store data.")}
          retryAction={profilesQuery.refetch}
        />
      ) : visibleStores.length === 0 ? (
        <AdminOpsEmptyState
          title={isId ? "Tidak ada toko ditemukan" : "No stores found"}
          message={
            searchTerm
              ? (isId ? `Tidak ada toko yang cocok dengan pencarian "${searchTerm}".` : `No stores matched "${searchTerm}".`)
              : (isId ? "Belum ada profil toko pada filter ini." : "No store profiles for this filter.")
          }
          resetAction={searchTerm ? () => setSearchTerm("") : null}
          resetLabel={isId ? "Reset Pencarian" : "Reset Search"}
        />
      ) : (
        <>
          {/* ZERO-SCROLL DESKTOP TABLE */}
          <div className="asp2026-table-wrap">
            <table className="asp2026-table">
              <thead>
                <tr>
                  <th style={{ width: "28%" }}>{isId ? "Toko & Brand" : "Store & Brand"}</th>
                  <th style={{ width: "22%" }}>{isId ? "Penjual / Pemilik" : "Seller / Owner"}</th>
                  <th style={{ width: "16%" }}>{isId ? "Status & Visibilitas" : "Status & Visibility"}</th>
                  <th style={{ width: "18%" }}>{isId ? "Kelengkapan" : "Completeness"}</th>
                  <th className="asp2026-th--actions" style={{ width: "16%" }}>
                    {isId ? "Aksi" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentSlideStores.map((entry) => {
                  const storeId = getStoreId(entry);
                  const name = getStoreName(entry);
                  const slug = getStoreSlug(entry);
                  const owner = getOwner(entry);
                  const logoUrl = textValue(readValue(entry, "logoUrl"));
                  const status = String(readValue(entry, "status") || "ACTIVE").toUpperCase();
                  const isLive = status === "ACTIVE";
                  const profileScore = getProfileScore(entry);
                  const shippingScore = getShippingScore(entry);
                  const publicReady = hasPublicReadiness(entry);

                  return (
                    <tr key={storeId}>
                      {/* 1. Store & Brand */}
                      <td>
                        <div className="asp2026-store-cell">
                          <div className="asp2026-avatar">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" className="asp2026-avatar__img" />
                            ) : (
                              getInitials(name)
                            )}
                          </div>
                          <div className="asp2026-store-info">
                            <span className="asp2026-store-name" title={name}>
                              {name}
                            </span>
                            <a
                              href={`/store/${encodeURIComponent(slug)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="asp2026-store-slug"
                            >
                              /@{slug}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* 2. Seller / Owner */}
                      <td>
                        <div className="asp2026-owner-cell">
                          <span className="asp2026-owner-name">
                            {owner?.name || (isId ? "Belum tertaut" : "Unassigned")}
                          </span>
                          <span className="asp2026-owner-email" title={owner?.email || ""}>
                            {owner?.email || (isId ? "Email belum diatur" : "No email")}
                          </span>
                        </div>
                      </td>

                      {/* 3. Status & Visibility */}
                      <td>
                        <div className="asp2026-status-cell">
                          <span
                            className={`asp2026-status-pill ${
                              isLive ? "asp2026-status-pill--live" : "asp2026-status-pill--inactive"
                            }`}
                          >
                            <span className="asp2026-status-dot" />
                            {isLive ? (isId ? "Aktif" : "Live") : (isId ? "Nonaktif" : "Inactive")}
                          </span>
                          <span className="asp2026-vis-badge">
                            {publicReady
                              ? (isId ? "Publik Siap" : "Public Ready")
                              : (isId ? "Perlu Konfigurasi" : "Needs Setup")}
                          </span>
                        </div>
                      </td>

                      {/* 4. Readiness & Completeness */}
                      <td>
                        <div className="asp2026-readiness-cell">
                          <span
                            className={`asp2026-score-badge ${
                              profileScore.missing === 0
                                ? "asp2026-score-badge--ready"
                                : "asp2026-score-badge--warn"
                            }`}
                          >
                            {isId ? "Profil: " : "Profile: "}
                            {profileScore.complete}/{profileScore.total}
                          </span>
                          <span className="asp2026-shipping-chip">
                            <Truck size={12} />
                            {shippingScore.missing === 0
                              ? (isId ? "Siap Kirim" : "Shipping Ready")
                              : `${shippingScore.missing} ${isId ? "Kurang" : "Missing"}`}
                          </span>
                        </div>
                      </td>

                      {/* 5. Actions */}
                      <td>
                        <div className="asp2026-actions-cell">
                          <label
                            className="asp2026-switch"
                            title={isLive ? (isId ? "Klik untuk nonaktifkan" : "Click to deactivate") : (isId ? "Klik untuk aktifkan" : "Click to activate")}
                          >
                            <input
                              type="checkbox"
                              checked={isLive}
                              onChange={() => handleQuickToggle(entry)}
                            />
                            <span className="asp2026-slider" />
                          </label>

                          <button
                            type="button"
                            className="asp2026-manage-btn"
                            onClick={() => setManagingStore(entry)}
                          >
                            <Settings size={13} />
                            {isId ? "Kelola" : "Manage"}
                          </button>

                          <a
                            href={`/store/${encodeURIComponent(slug)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="asp2026-preview-btn"
                            title={isId ? "Buka etalase toko" : "Open storefront"}
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD FEED (SCREENS <= 768px) */}
          <div className="asp2026-mobile-card-list">
            {currentSlideStores.map((entry) => {
              const storeId = getStoreId(entry);
              const name = getStoreName(entry);
              const slug = getStoreSlug(entry);
              const owner = getOwner(entry);
              const logoUrl = textValue(readValue(entry, "logoUrl"));
              const status = String(readValue(entry, "status") || "ACTIVE").toUpperCase();
              const isLive = status === "ACTIVE";
              const profileScore = getProfileScore(entry);
              const shippingScore = getShippingScore(entry);

              return (
                <div key={storeId} className="asp2026-mobile-card">
                  <div className="asp2026-mobile-card-top">
                    <div className="asp2026-store-cell">
                      <div className="asp2026-avatar">
                        {logoUrl ? (
                          <img src={logoUrl} alt="" className="asp2026-avatar__img" />
                        ) : (
                          getInitials(name)
                        )}
                      </div>
                      <div className="asp2026-store-info">
                        <span className="asp2026-store-name">{name}</span>
                        <span className="asp2026-store-slug">/@{slug}</span>
                      </div>
                    </div>
                    <span
                      className={`asp2026-status-pill ${
                        isLive ? "asp2026-status-pill--live" : "asp2026-status-pill--inactive"
                      }`}
                    >
                      <span className="asp2026-status-dot" />
                      {isLive ? (isId ? "Aktif" : "Live") : (isId ? "Nonaktif" : "Inactive")}
                    </span>
                  </div>

                  <div className="asp2026-mobile-card-meta">
                    <div className="asp2026-mobile-meta-item">
                      <small>{isId ? "Penjual" : "Seller"}</small>
                      <strong>{owner?.name || "-"}</strong>
                    </div>
                    <div className="asp2026-mobile-meta-item">
                      <small>{isId ? "Kesiapan" : "Readiness"}</small>
                      <strong>
                        {profileScore.complete}/{profileScore.total} {isId ? "Profil" : "Profile"}
                      </strong>
                    </div>
                  </div>

                  <div className="asp2026-mobile-card-actions">
                    <label className="asp2026-switch">
                      <input
                        type="checkbox"
                        checked={isLive}
                        onChange={() => handleQuickToggle(entry)}
                      />
                      <span className="asp2026-slider" />
                    </label>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <button
                        type="button"
                        className="asp2026-manage-btn"
                        onClick={() => setManagingStore(entry)}
                      >
                        <Settings size={13} />
                        {isId ? "Kelola" : "Manage"}
                      </button>
                      <a
                        href={`/store/${encodeURIComponent(slug)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="asp2026-preview-btn"
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SLIDE PAGINATION (EXACTLY 10 PER SLIDE) */}
          <div className="asp2026-slide-pagination">
            <div className="asp2026-pagination-info">
              {isId ? (
                <>
                  Slide <strong>{currentSlide}</strong> dari <strong>{totalSlides}</strong> (Menampilkan{" "}
                  <strong>{slideFrom}–{slideTo}</strong> dari <strong>{visibleStores.length}</strong> toko)
                </>
              ) : (
                <>
                  Slide <strong>{currentSlide}</strong> of <strong>{totalSlides}</strong> (Showing{" "}
                  <strong>{slideFrom}–{slideTo}</strong> of <strong>{visibleStores.length}</strong> stores)
                </>
              )}
            </div>

            <div className="asp2026-pagination-controls">
              <button
                type="button"
                className="asp2026-slide-btn"
                onClick={() => setCurrentSlide((s) => Math.max(1, s - 1))}
                disabled={currentSlide <= 1}
              >
                <ChevronLeft size={14} />
                {isId ? "Slide Sebelumnya" : "Previous Slide"}
              </button>

              {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slideNum) => (
                <button
                  key={slideNum}
                  type="button"
                  className={`asp2026-slide-num ${currentSlide === slideNum ? "is-active" : ""}`}
                  onClick={() => setCurrentSlide(slideNum)}
                >
                  {isId ? `Slide ${slideNum}` : `Slide ${slideNum}`}
                </button>
              ))}

              <button
                type="button"
                className="asp2026-slide-btn"
                onClick={() => setCurrentSlide((s) => Math.min(totalSlides, s + 1))}
                disabled={currentSlide >= totalSlides}
              >
                {isId ? "Slide Berikutnya" : "Next Slide"}
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Store Profile Management Modal / Drawer */}
      <AdminStoreManageModal
        entry={managingStore}
        isOpen={Boolean(managingStore)}
        onClose={() => setManagingStore(null)}
        onSave={handleSaveModal}
        isSaving={mutation.isPending}
        isId={isId}
      />
    </div>
  );
}
