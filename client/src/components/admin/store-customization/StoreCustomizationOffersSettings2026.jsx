import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Tag,
  Ticket,
  Percent,
  Flame,
  Monitor,
  Smartphone,
  Eye,
  Save,
  Rocket,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  X,
  Upload,
  Trash2,
  Image as ImageIcon,
  Gift,
  ShoppingBag,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import "./StoreCustomizationOffersSettings2026.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

// Canonical TP Preneurs Official Presets
const TP_OFFICIAL_OFFERS_PRESET = {
  id: {
    pageHeader: {
      eyebrow: "PROMO & PENAWARAN SPESIAL",
      pageTitle: "Mega Offer Eksklusif",
      description: "Dapatkan penawaran terbaik dan kupon diskon spesial untuk produk edukasi pilihan.",
    },
    superDiscount: {
      activeCouponCode: "ALL",
    },
    dealsSection: {
      title: "Koleksi Produk Diskon",
      description: "Hemat lebih banyak untuk karya inovasi dan media belajar.",
    },
  },
  en: {
    pageHeader: {
      eyebrow: "SPECIAL OFFERS & PROMOTIONS",
      pageTitle: "Exclusive Mega Offer",
      description: "Get the best limited-time deals and exclusive discount vouchers on curated learning products.",
    },
    superDiscount: {
      activeCouponCode: "ALL",
    },
    dealsSection: {
      title: "Featured Promotional Deals",
      description: "Save more on innovative student creations and digital learning resources.",
    },
  },
};

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className={`of26-toggle-btn ${checked ? "is-active" : "is-inactive"}`}
    >
      <span className="of26-toggle-knob" />
    </button>
  );
}

function ImageUploadDropzone({
  id,
  label,
  value,
  onChange,
  onRemove,
  isId,
  specNote = "1920x360 • JPG, PNG, WEBP",
}) {
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(
        isId
          ? "Format file harus berupa gambar (JPG, PNG, WEBP)."
          : "Please select an image file (JPG, PNG, WEBP)."
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(
        isId
          ? "Ukuran file maksimal 5MB."
          : "Maximum image file size is 5MB."
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange?.(String(e.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="of26-label">{label}</span>
        <span className="of26-dropzone-badge">{specNote}</span>
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFile(e.target.files[0]);
            e.target.value = "";
          }
        }}
      />

      {value ? (
        <div className="of26-img-preview-box group">
          <img src={value} alt={label} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="of26-img-remove-btn"
            title={isId ? "Hapus gambar" : "Remove image"}
            aria-label={isId ? "Hapus gambar" : "Remove image"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={handleDrop}
          className="of26-dropzone"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-blue-300">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isId ? "Klik atau seret banner ke sini" : "Click or drag banner here"}
            </p>
            <p className="text-[11px] text-slate-400">
              {isId ? "JPG, PNG, WEBP (Maksimal 5MB)" : "JPG, PNG, WEBP (Max 5MB)"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StoreCustomizationOffersSettings2026({
  value,
  onChange,
  activeTab,
  onTabChange,
  onSave,
  onPublish,
  onReset,
  onPreview,
  isSaving = false,
  isPublishing = false,
  meta = {},
  language = "en",
  languages = [],
  onLanguageChange,
  isLoading = false,
  couponOptions = [],
  isLoadingCoupons = false,
}) {
  const { i18n } = useTranslation();
  const isId =
    String(language || "").toLowerCase().startsWith("id") ||
    String(i18n?.language || "").toLowerCase().startsWith("id");

  // Device switcher for preview: "desktop" | "mobile"
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Normalized safe data structure
  const safeData = useMemo(() => {
    const raw = value && typeof value === "object" ? value : {};
    return {
      pageHeader: {
        enabled: Boolean(raw.pageHeader?.enabled),
        eyebrow: toText(raw.pageHeader?.eyebrow, "MEGA OFFER & PROMO"),
        backgroundImageDataUrl: toText(raw.pageHeader?.backgroundImageDataUrl),
        pageTitle: toText(raw.pageHeader?.pageTitle, "Mega Offer Eksklusif"),
        description: toText(
          raw.pageHeader?.description,
          "Dapatkan penawaran terbaik dan kupon diskon spesial untuk produk edukasi pilihan."
        ),
      },
      superDiscount: {
        enabled: Boolean(raw.superDiscount?.enabled),
        activeCouponCode: toText(raw.superDiscount?.activeCouponCode, "ALL").toUpperCase(),
      },
      dealsSection: {
        enabled: Boolean(raw.dealsSection?.enabled),
        title: toText(raw.dealsSection?.title, "Koleksi Produk Diskon"),
        description: toText(
          raw.dealsSection?.description,
          "Hemat lebih banyak untuk karya inovasi dan media belajar."
        ),
      },
    };
  }, [value]);

  const updateSectionField = (sectionKey, fieldKey, fieldValue) => {
    onChange?.((prev) => {
      const prevSource = prev && typeof prev === "object" ? prev : {};
      const prevSection =
        prevSource[sectionKey] && typeof prevSource[sectionKey] === "object"
          ? prevSource[sectionKey]
          : {};
      return {
        ...prevSource,
        [sectionKey]: {
          ...prevSection,
          [fieldKey]: fieldValue,
        },
      };
    });
  };

  const updateSectionEnabled = (sectionKey, enabledValue) => {
    onChange?.((prev) => {
      const prevSource = prev && typeof prev === "object" ? prev : {};
      const prevSection =
        prevSource[sectionKey] && typeof prevSource[sectionKey] === "object"
          ? prevSource[sectionKey]
          : {};
      return {
        ...prevSource,
        [sectionKey]: {
          ...prevSection,
          enabled: Boolean(enabledValue),
        },
      };
    });
  };

  // Handler to apply official preset
  const handleApplyOfficialPreset = () => {
    const preset = isId ? TP_OFFICIAL_OFFERS_PRESET.id : TP_OFFICIAL_OFFERS_PRESET.en;
    onChange?.((prev) => {
      const prevSource = prev && typeof prev === "object" ? prev : {};
      return {
        ...prevSource,
        pageHeader: {
          ...prevSource.pageHeader,
          eyebrow: preset.pageHeader.eyebrow,
          pageTitle: preset.pageHeader.pageTitle,
          description: preset.pageHeader.description,
          enabled: true,
        },
        superDiscount: {
          ...prevSource.superDiscount,
          activeCouponCode: preset.superDiscount.activeCouponCode,
          enabled: true,
        },
        dealsSection: {
          ...prevSource.dealsSection,
          title: preset.dealsSection.title,
          description: preset.dealsSection.description,
          enabled: true,
        },
      };
    });
  };

  const selectedCouponCode = safeData.superDiscount.activeCouponCode || "ALL";

  return (
    <div className="of26-wrap">
      {/* 2026 Header Top Bar & Tab Navigation */}
      <div className="of26-header-bar">
        <div className="of26-header-top">
          <div className="of26-title-group">
            <div className="of26-title-icon">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h1 className="of26-title">
                {isId ? "Kustomisasi Halaman Offers" : "Offers Page Customization"}
              </h1>
              <p className="of26-subtitle">
                {isId
                  ? "Kelola banner Mega Offer, voucher kupon diskon, dan katalog promo TP Preneurs."
                  : "Manage Mega Offer banners, coupon vouchers, and promotional deal catalogs."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApplyOfficialPreset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50/80 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300"
              title={isId ? "Muat template promo resmi" : "Load official promo preset"}
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              <span>{isId ? "Muat Preset Promo TP Preneurs" : "Load Official Preset"}</span>
            </button>

            <a
              href="/offers"
              target="_blank"
              rel="noreferrer"
              className="of26-badge-link"
              title={isId ? "Buka halaman promo storefront di tab baru" : "Open storefront offers page"}
            >
              <span>{isId ? "Halaman Offers" : "Offers Page"}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Quick Campaign Redirect Notice */}
        <div className="of26-campaigns-notice">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#fe6f05]" />
            <span>
              {isIndo
                ? "Kelola banner promosi dan voucher Mega Offer lebih lengkap di menu Katalog > Campaigns."
                : "Manage full campaign hero banners and vouchers in Catalog > Campaigns."}
            </span>
          </div>
          <Link
            to="/admin/catalog/campaigns"
            className="inline-flex items-center gap-1 font-bold text-[#034c85] hover:underline dark:text-sky-300"
          >
            <span>{isId ? "Buka Campaigns" : "Open Campaigns"}</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Unified Tab Navigation */}
        <StoreCustomizationTabNav2026 activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Main 2-Column Grid: Left Editor (Form Cards) / Right Live Preview */}
      <div className="of26-grid">
        {/* Left Column: Form Controls */}
        <div className="flex flex-col gap-5">
          {/* CARD 1: Page Header */}
          <section className="of26-card">
            <div className="of26-card-header">
              <div className="of26-card-title-group">
                <div className="of26-card-icon">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="of26-card-heading">
                    {isId ? "Banner Header Mega Offer" : "Mega Offer Header Banner"}
                  </h2>
                  <p className="of26-card-subheading">
                    {isId
                      ? "Kelola tag badge, judul banner, deskripsi promo, dan latar header."
                      : "Manage badge eyebrow, title, description, and header background."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {safeData.pageHeader.enabled
                    ? isId
                      ? "Aktif"
                      : "Enabled"
                    : isId
                    ? "Nonaktif"
                    : "Disabled"}
                </span>
                <Switch
                  checked={safeData.pageHeader.enabled}
                  onChange={(val) => updateSectionEnabled("pageHeader", val)}
                  ariaLabel="Toggle Page Header"
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <div className="of26-field">
                  <label className="of26-label" htmlFor="of26-header-eyebrow">
                    {isId ? "Tag Badge (Eyebrow)" : "Badge Tag (Eyebrow)"}
                  </label>
                  <input
                    id="of26-header-eyebrow"
                    type="text"
                    value={safeData.pageHeader.eyebrow}
                    onChange={(e) => updateSectionField("pageHeader", "eyebrow", e.target.value)}
                    placeholder="MEGA OFFER & PROMO"
                    className="of26-input font-bold text-[#fe6f05]"
                  />
                </div>

                <div className="of26-field">
                  <label className="of26-label" htmlFor="of26-header-title">
                    {isId ? "Judul Utama (Page Title)" : "Page Title"}
                  </label>
                  <input
                    id="of26-header-title"
                    type="text"
                    value={safeData.pageHeader.pageTitle}
                    onChange={(e) => updateSectionField("pageHeader", "pageTitle", e.target.value)}
                    placeholder={isId ? "Mega Offer Eksklusif" : "Exclusive Mega Offer"}
                    className="of26-input font-bold"
                  />
                </div>
              </div>

              <div className="of26-field">
                <label className="of26-label" htmlFor="of26-header-desc">
                  {isId ? "Deskripsi Promo" : "Promo Description"}
                </label>
                <textarea
                  id="of26-header-desc"
                  value={safeData.pageHeader.description}
                  onChange={(e) => updateSectionField("pageHeader", "description", e.target.value)}
                  placeholder={
                    isId
                      ? "Dapatkan penawaran terbaik dan kupon diskon spesial untuk produk edukasi pilihan."
                      : "Get the best limited-time deals and discount coupons."
                  }
                  rows={2}
                  className="of26-textarea"
                />
              </div>

              <ImageUploadDropzone
                id="of26-header-bg-input"
                label={isId ? "Gambar Latar Banner (Background)" : "Header Background Image"}
                value={safeData.pageHeader.backgroundImageDataUrl}
                onChange={(dataUrl) =>
                  updateSectionField("pageHeader", "backgroundImageDataUrl", dataUrl)
                }
                onRemove={() => updateSectionField("pageHeader", "backgroundImageDataUrl", "")}
                isId={isId}
                specNote="1920x360 • Maks 5MB"
              />
            </div>
          </section>

          {/* CARD 2: Super Discount Active Coupon */}
          <section className="of26-card">
            <div className="of26-card-header">
              <div className="of26-card-title-group">
                <div className="of26-card-icon text-[#fe6f05]">
                  <Ticket className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="of26-card-heading">
                    {isId ? "Kupon Super Diskon Aktif" : "Active Super Discount Coupon"}
                  </h2>
                  <p className="of26-card-subheading">
                    {isId
                      ? "Pilih kupon diskon platform yang disorot pada banner Mega Offer."
                      : "Select the featured platform voucher for the Mega Offer highlight banner."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {safeData.superDiscount.enabled
                    ? isId
                      ? "Aktif"
                      : "Enabled"
                    : isId
                    ? "Nonaktif"
                    : "Disabled"}
                </span>
                <Switch
                  checked={safeData.superDiscount.enabled}
                  onChange={(val) => updateSectionEnabled("superDiscount", val)}
                  ariaLabel="Toggle Super Discount"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3.5">
              <div className="of26-field">
                <label className="of26-label" htmlFor="of26-coupon-select">
                  {isId ? "Pilihan Kode Kupon Voucher" : "Voucher Coupon Code"}
                </label>
                <div className="of26-coupon-select-wrap">
                  <div className="relative flex-1">
                    <select
                      id="of26-coupon-select"
                      value={selectedCouponCode}
                      onChange={(e) =>
                        updateSectionField("superDiscount", "activeCouponCode", e.target.value)
                      }
                      className="of26-coupon-select font-mono font-bold"
                    >
                      <option value="ALL">
                        {isId
                          ? "✦ Semua Kupon Aktif (Tampilkan Seluruh Diskon)"
                          : "✦ All Active Coupons (Display All)"}
                      </option>
                      {couponOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      {selectedCouponCode !== "ALL" &&
                        !couponOptions.some((item) => item.value === selectedCouponCode) && (
                          <option value={selectedCouponCode}>{selectedCouponCode}</option>
                        )}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      updateSectionField("superDiscount", "activeCouponCode", "ALL")
                    }
                    disabled={selectedCouponCode === "ALL"}
                    className="of26-coupon-clear-btn"
                    title={isId ? "Kembalikan ke semua kupon" : "Reset to all coupons"}
                    aria-label="Reset coupon selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {isLoadingCoupons && (
                  <p className="text-[11px] text-slate-400">
                    {isId ? "Memuat daftar kupon..." : "Loading coupons..."}
                  </p>
                )}
              </div>

              {/* Informative Chip */}
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-[#fe6f05] flex-shrink-0" />
                <span>
                  {selectedCouponCode === "ALL"
                    ? isId
                      ? "Mode Semua Kupon: Storefront akan menampilkan seluruh kupon promo yang aktif."
                      : "All Coupons Mode: The storefront will showcase all available active vouchers."
                    : isId
                    ? `Kupon Terpilih: Voucher ${selectedCouponCode} akan ditonjolkan secara otomatis pada hero banner.`
                    : `Selected Coupon: Voucher ${selectedCouponCode} will be highlighted on the hero banner.`}
                </span>
              </div>
            </div>
          </section>

          {/* CARD 3: Deals Section */}
          <section className="of26-card">
            <div className="of26-card-header">
              <div className="of26-card-title-group">
                <div className="of26-card-icon">
                  <ShoppingBag className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="of26-card-heading">
                    {isId ? "Katalog Produk Diskon" : "Discounted Deals Catalog"}
                  </h2>
                  <p className="of26-card-subheading">
                    {isId
                      ? "Kelola judul dan keterangan pada seksi katalog produk promo."
                      : "Manage heading and description for the deals product catalog section."}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  {safeData.dealsSection.enabled
                    ? isId
                      ? "Aktif"
                      : "Enabled"
                    : isId
                    ? "Nonaktif"
                    : "Disabled"}
                </span>
                <Switch
                  checked={safeData.dealsSection.enabled}
                  onChange={(val) => updateSectionEnabled("dealsSection", val)}
                  ariaLabel="Toggle Deals Section"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div className="of26-field">
                <label className="of26-label" htmlFor="of26-deals-title">
                  {isId ? "Judul Seksi Katalog" : "Section Title"}
                </label>
                <input
                  id="of26-deals-title"
                  type="text"
                  value={safeData.dealsSection.title}
                  onChange={(e) => updateSectionField("dealsSection", "title", e.target.value)}
                  placeholder={isId ? "Koleksi Produk Diskon" : "Featured Promotional Deals"}
                  className="of26-input"
                />
              </div>

              <div className="of26-field">
                <label className="of26-label" htmlFor="of26-deals-desc">
                  {isId ? "Keterangan Singkat" : "Section Subtitle"}
                </label>
                <input
                  id="of26-deals-desc"
                  type="text"
                  value={safeData.dealsSection.description}
                  onChange={(e) =>
                    updateSectionField("dealsSection", "description", e.target.value)
                  }
                  placeholder={
                    isId
                      ? "Hemat lebih banyak untuk karya inovasi..."
                      : "Save more on innovative student creations..."
                  }
                  className="of26-input"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: 1:1 Live Storefront Preview */}
        <div className="of26-preview-shell">
          <div className="of26-preview-controls">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#fe6f05]" />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                {isId ? "Pratinjau Langsung 1:1" : "Live Storefront Preview"}
              </span>
            </div>

            {/* Device Switcher */}
            <div className="of26-device-selector">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`of26-device-btn ${previewDevice === "desktop" ? "is-active" : ""}`}
                title={isId ? "Tampilan Desktop" : "Desktop View"}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`of26-device-btn ${previewDevice === "mobile" ? "is-active" : ""}`}
                title={isId ? "Tampilan Mobile" : "Mobile View"}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div className={`of26-preview-frame ${previewDevice === "mobile" ? "is-mobile" : ""}`}>
            {/* Header Simulation */}
            {safeData.pageHeader.enabled && (
              <div
                className={`of26-storefront-header ${
                  safeData.pageHeader.backgroundImageDataUrl ? "has-bg" : ""
                }`}
                style={
                  safeData.pageHeader.backgroundImageDataUrl
                    ? {
                        backgroundImage: `url(${safeData.pageHeader.backgroundImageDataUrl})`,
                      }
                    : { background: "linear-gradient(135deg, #034c85 0%, #01203a 100%)" }
                }
              >
                <div className="of26-storefront-header-content">
                  <span className="of26-storefront-badge">
                    <Sparkles className="h-3 w-3" />
                    <span>{safeData.pageHeader.eyebrow || "MEGA OFFER & PROMO"}</span>
                  </span>
                  <h3 className="of26-storefront-title">
                    {safeData.pageHeader.pageTitle || (isId ? "Mega Offer Eksklusif" : "Mega Offer")}
                  </h3>
                  <p className="of26-storefront-desc">
                    {safeData.pageHeader.description ||
                      (isId
                        ? "Dapatkan penawaran terbaik dan kupon diskon spesial."
                        : "Discover exclusive offers and deals.")}
                  </p>
                </div>
              </div>
            )}

            {/* Storefront Body Content */}
            <div className="of26-storefront-body">
              {/* Super Discount Voucher Banner Simulation */}
              {safeData.superDiscount.enabled && (
                <div className="of26-sim-superdiscount-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-[#fe6f05]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-white">
                        {isId ? "Kupon Super Diskon" : "Super Discount Voucher"}
                      </span>
                    </div>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/90">
                      {isId ? "Waktu Terbatas" : "Limited Time"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <div className="of26-sim-coupon-badge">
                        <Ticket className="h-3 w-3" />
                        <span>{selectedCouponCode === "ALL" ? "DISCOUNT-PLATFORM" : selectedCouponCode}</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-1">
                        {isId
                          ? "Gunakan kode kupon saat proses checkout pesanan."
                          : "Apply coupon code at checkout."}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-[#fe6f05]">-25%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Deals Catalog Section Simulation */}
              {safeData.dealsSection.enabled && (
                <div className="of26-sim-deals-box">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {safeData.dealsSection.title || (isId ? "Koleksi Produk Diskon" : "Deals")}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {safeData.dealsSection.description ||
                          (isId ? "Produk pilihan edupreneur." : "Selected edupreneur items.")}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-[#034c85] dark:text-blue-400">
                      {isId ? "Lihat Semua" : "View All"}
                    </span>
                  </div>

                  {/* Dummy Products Grid */}
                  <div className="of26-sim-deals-grid">
                    <div className="of26-sim-deal-card">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                          -20%
                        </span>
                        <Tag className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="h-14 w-full rounded bg-slate-200/70 dark:bg-slate-800" />
                      <span className="line-clamp-1 text-[11px] font-bold text-slate-800 dark:text-slate-100">
                        Modul Inovasi Edupreneur
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[11px] font-extrabold text-[#034c85] dark:text-blue-400">
                          Rp 48.000
                        </span>
                        <span className="text-[9px] text-slate-400 line-through">Rp 60.000</span>
                      </div>
                    </div>

                    <div className="of26-sim-deal-card">
                      <div className="flex items-center justify-between">
                        <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-300">
                          -15%
                        </span>
                        <Tag className="h-3 w-3 text-slate-400" />
                      </div>
                      <div className="h-14 w-full rounded bg-slate-200/70 dark:bg-slate-800" />
                      <span className="line-clamp-1 text-[11px] font-bold text-slate-800 dark:text-slate-100">
                        Media Kreatif Pembelajaran
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[11px] font-extrabold text-[#034c85] dark:text-blue-400">
                          Rp 85.000
                        </span>
                        <span className="text-[9px] text-slate-400 line-through">Rp 100.000</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="of26-sticky-bar">
        <div className="of26-sticky-inner">
          <div className="flex items-center gap-2">
            <span className="of26-status-pill">
              <span className="of26-status-dot" />
              <span>
                {meta?.status === "published"
                  ? isId
                    ? "Telah Dipublikasikan"
                    : "Published"
                  : isId
                  ? "Draf Tersimpan"
                  : "Draft"}
              </span>
            </span>
          </div>

          <div className="of26-action-btns">
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving || isPublishing || isLoading}
              className="of26-btn-reset"
              title={isId ? "Reset draf ke data tersimpan" : "Reset draft to stored"}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isId ? "Reset Draf" : "Reset Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => onSave?.({ publish: false })}
              disabled={isSaving || isPublishing || isLoading}
              className="of26-btn-save"
              title={isId ? "Simpan perubahan sebagai draf" : "Save changes as draft"}
            >
              <Save className="h-3.5 w-3.5" />
              <span>
                {isSaving && !isPublishing
                  ? isId
                    ? "Menyimpan..."
                    : "Saving..."
                  : isId
                  ? "Simpan Draf"
                  : "Save Draft"}
              </span>
            </button>

            <button
              type="button"
              onClick={onPublish}
              disabled={isSaving || isPublishing || isLoading}
              className="of26-btn-publish"
              title={isId ? "Publikasikan ke storefront live" : "Publish to live storefront"}
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>
                {isPublishing
                  ? isId
                    ? "Memublikasikan..."
                    : "Publishing..."
                  : isId
                  ? "Publikasikan Draf"
                  : "Publish Draft"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
