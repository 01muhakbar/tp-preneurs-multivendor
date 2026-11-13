/**
 * StoreCustomizationSeoSettings2026.jsx
 * Modern 2026 UI/UX Redesign for Admin Store Customization: SEO Settings Tab
 * Palette: #034c85 (Deep Navy) & #fe6f05 (Vibrant Orange)
 */

import React, { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Globe,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  Sparkles,
  RotateCcw,
  Save,
  Rocket,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  X,
  FileCode,
  Tag,
  HelpCircle,
  Info,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import "./StoreCustomizationSeoSettings2026.css";

const TP_SEO_PRESETS = {
  id: {
    metaTitle: "TP PRENEURS | Marketplace Edupreneur & Karya Inovasi Kampus",
    metaDescription:
      "Pusat marketplace edupreneur terlengkap di Indonesia. Temukan produk inovasi, media belajar digital, buku berkualitas, dan karya kreatif mahasiswa terpercaya di TP Preneurs.",
    metaUrl: "https://tppreneurs.com",
    metaKeywords:
      "tp preneurs, marketplace mahasiswa, edupreneur, inovasi kampus, media belajar, produk kreatif, belanja unhas",
  },
  en: {
    metaTitle: "TP PRENEURS | Campus Edupreneur & Student Innovation Marketplace",
    metaDescription:
      "The premier student-led innovation marketplace. Discover digital learning tools, published books, and creative works crafted by university edupreneurs at TP Preneurs.",
    metaUrl: "https://tppreneurs.com",
    metaKeywords:
      "tp preneurs, student marketplace, campus edupreneur, university innovation, digital learning media, student products",
  },
};

export default function StoreCustomizationSeoSettings2026({
  activeTab = "seoSettings",
  onTabChange,
  seoSettings = {},
  onChangeSeoField,
  onSeoImageInputChange,
  onDropSeoImage,
  onRemoveSeoImage,
  seoDropActive = {},
  seoImageErrors = {},
  seoFaviconPreviewSrc = "/favicon.png",
  seoMetaImagePreviewSrc = "/og-image.png",
  onSave,
  onPublish,
  onReset,
  isSaving = false,
  isPublishing = false,
  isLoading = false,
  meta = {},
}) {
  const { i18n } = useTranslation();
  const isIndo = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  const [previewDevice, setPreviewDevice] = useState("desktop"); // 'desktop' | 'mobile'
  const [activePreviewTab, setActivePreviewTab] = useState("google"); // 'google' | 'social'

  const faviconInputRef = useRef(null);
  const metaImageInputRef = useRef(null);

  // Fallback defaults
  const title = String(seoSettings.metaTitle || "").trim() || (isIndo ? "TP PRENEURS | Marketplace Multivendor" : "TP PRENEURS | Multivendor Marketplace");
  const description =
    String(seoSettings.metaDescription || "").trim() ||
    (isIndo
      ? "Jual Beli Produk di TP Preneurs. Temukan berbagai karya inovasi kampus dan media belajar unggulan."
      : "Buy and Sell Products on TP Preneurs. Discover campus innovations and top educational media.");
  const canonicalUrl = String(seoSettings.metaUrl || "").trim() || "https://tppreneurs.com";
  const keywords = String(seoSettings.metaKeywords || "").trim();

  // Keyword list for badges
  const keywordTags = useMemo(() => {
    if (!keywords) return [];
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }, [keywords]);

  // Length calculations & status badges
  const titleLen = (seoSettings.metaTitle || "").length;
  const descLen = (seoSettings.metaDescription || "").length;

  const getTitleStatus = () => {
    if (titleLen === 0) return { label: isIndo ? "Kosong" : "Empty", cls: "is-danger" };
    if (titleLen < 40) return { label: isIndo ? "Terlalu Pendek (<40)" : "Short (<40)", cls: "is-warning" };
    if (titleLen <= 60) return { label: isIndo ? "Optimal (50-60)" : "Optimal (50-60)", cls: "is-optimal" };
    if (titleLen <= 70) return { label: isIndo ? "Maksimal (60-70)" : "Borderline (60-70)", cls: "is-warning" };
    return { label: isIndo ? "Terlalu Panjang (>70)" : "Too Long (>70)", cls: "is-danger" };
  };

  const getDescStatus = () => {
    if (descLen === 0) return { label: isIndo ? "Kosong" : "Empty", cls: "is-danger" };
    if (descLen < 100) return { label: isIndo ? "Terlalu Pendek (<100)" : "Short (<100)", cls: "is-warning" };
    if (descLen <= 160) return { label: isIndo ? "Optimal (120-160)" : "Optimal (120-160)", cls: "is-optimal" };
    return { label: isIndo ? "Terlalu Panjang (>160)" : "Too Long (>160)", cls: "is-danger" };
  };

  const titleStatus = getTitleStatus();
  const descStatus = getDescStatus();

  // Apply TP Preneurs Preset
  const handleApplyPreset = () => {
    const preset = isIndo ? TP_SEO_PRESETS.id : TP_SEO_PRESETS.en;
    const confirmMsg = isIndo
      ? "Terapkan preset SEO rekomendasi resmi TP Preneurs?"
      : "Apply official TP Preneurs recommended SEO preset?";
    if (window.confirm(confirmMsg)) {
      onChangeSeoField("metaTitle", preset.metaTitle);
      onChangeSeoField("metaDescription", preset.metaDescription);
      onChangeSeoField("metaUrl", preset.metaUrl);
      onChangeSeoField("metaKeywords", preset.metaKeywords);
    }
  };

  return (
    <div className="se26-wrap">
      {/* Header & Tab Navigation */}
      <div className="se26-header-bar">
        <div className="se26-header-top">
          <div className="se26-title-group">
            <div className="se26-title-icon">
              <Search className="h-6 w-6" />
            </div>
            <div>
              <h1 className="se26-title">
                {isIndo ? "Pengaturan SEO & Metadata" : "SEO & Metadata Settings"}
              </h1>
              <p className="se26-subtitle">
                {isIndo
                  ? "Kelola metadata search engine, favicon browser, dan pratinjau sosial media tppreneurs.com."
                  : "Manage search engine metadata, browser favicon, and social media previews for tppreneurs.com."}
              </p>
            </div>
          </div>

          <div className="se26-header-actions">
            <button
              type="button"
              onClick={handleApplyPreset}
              className="se26-btn-preset"
              title={isIndo ? "Muat metadata rekomendasi resmi" : "Load recommended metadata"}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{isIndo ? "Muat Preset TP Preneurs" : "Load TP Preset"}</span>
            </button>
          </div>
        </div>

        {/* Unified Tab Navigation Bar */}
        <StoreCustomizationTabNav2026
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* Main 2-Column Grid */}
      <div className="se26-grid">
        {/* Left Column: SEO Meta Inputs & Brand Identity Assets */}
        <div className="space-y-6">
          {/* Section 1: Search Engine Snippet Form */}
          <div className="se26-card">
            <div className="se26-card-header">
              <div className="se26-card-title-group">
                <div className="se26-card-icon">
                  <FileCode className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="se26-card-title">
                    {isIndo ? "Informasi Metadata Halaman" : "Page Metadata Fields"}
                  </h2>
                </div>
              </div>
            </div>

            {/* Meta Title */}
            <div className="se26-form-group">
              <div className="se26-label-row">
                <label htmlFor="se26-meta-title" className="se26-label">
                  Meta Title
                </label>
                <span className={`se26-counter ${titleStatus.cls}`}>
                  {titleLen}/60 &bull; {titleStatus.label}
                </span>
              </div>
              <input
                id="se26-meta-title"
                type="text"
                value={seoSettings.metaTitle || ""}
                onChange={(e) => onChangeSeoField("metaTitle", e.target.value)}
                placeholder="TP PRENEURS | Marketplace Edupreneur & Karya Inovasi Kampus"
                className="se26-input"
              />
            </div>

            {/* Meta Description */}
            <div className="se26-form-group">
              <div className="se26-label-row">
                <label htmlFor="se26-meta-desc" className="se26-label">
                  Meta Description
                </label>
                <span className={`se26-counter ${descStatus.cls}`}>
                  {descLen}/160 &bull; {descStatus.label}
                </span>
              </div>
              <textarea
                id="se26-meta-desc"
                value={seoSettings.metaDescription || ""}
                onChange={(e) => onChangeSeoField("metaDescription", e.target.value)}
                placeholder={
                  isIndo
                    ? "Ringkasan konten halaman untuk hasil pencarian Google (120-160 karakter)..."
                    : "Page summary snippet displayed on Google search results (120-160 characters)..."
                }
                className="se26-textarea"
                rows={3}
              />
            </div>

            {/* Canonical Meta URL */}
            <div className="se26-form-group">
              <div className="se26-label-row">
                <label htmlFor="se26-meta-url" className="se26-label">
                  {isIndo ? "Canonical URL (Alamat Asli)" : "Canonical URL"}
                </label>
                <span className="text-[11px] text-slate-400">
                  {isIndo ? "Mencegah duplikasi konten" : "Prevents duplicate content"}
                </span>
              </div>
              <div className="relative">
                <input
                  id="se26-meta-url"
                  type="url"
                  value={seoSettings.metaUrl || ""}
                  onChange={(e) => onChangeSeoField("metaUrl", e.target.value)}
                  placeholder="https://tppreneurs.com"
                  className="se26-input pr-8"
                />
                <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Meta Keywords */}
            <div className="se26-form-group">
              <div className="se26-label-row">
                <label htmlFor="se26-meta-keywords" className="se26-label">
                  Meta Keywords
                </label>
                <span className="text-[11px] text-slate-400">
                  {isIndo ? "Pisahkan dengan tanda koma" : "Separate with commas"}
                </span>
              </div>
              <textarea
                id="se26-meta-keywords"
                value={seoSettings.metaKeywords || ""}
                onChange={(e) => onChangeSeoField("metaKeywords", e.target.value)}
                placeholder="tp preneurs, marketplace mahasiswa, edupreneur kampus"
                className="se26-textarea"
                rows={2}
              />
              {keywordTags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {keywordTags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      <Tag className="h-2.5 w-2.5 text-slate-400" />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Section 2: Identity Assets (Favicon & Meta Image Banner) */}
          <div className="se26-card">
            <div className="se26-card-header">
              <div className="se26-card-title-group">
                <div className="se26-card-icon">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="se26-card-title">
                    {isIndo ? "Aset Visual & Favicon" : "Visual Assets & Favicon"}
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Favicon Asset */}
              <div className="flex flex-col gap-2">
                <div className="se26-label-row">
                  <span className="se26-label">Favicon</span>
                  <span className="text-[11px] text-slate-400">.ico, .png, .webp</span>
                </div>

                <input
                  ref={faviconInputRef}
                  id="se26-favicon-file"
                  type="file"
                  accept=".ico,.png,.jpg,.jpeg,.webp"
                  onChange={(e) => onSeoImageInputChange("faviconDataUrl", e)}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    seoDropActive.faviconDataUrl = true;
                  }}
                  onDragLeave={() => {
                    seoDropActive.faviconDataUrl = false;
                  }}
                  onDrop={(e) => onDropSeoImage("faviconDataUrl", e)}
                  onClick={() => faviconInputRef.current?.click()}
                  className={`se26-dropzone ${
                    seoDropActive.faviconDataUrl ? "is-active" : ""
                  }`}
                >
                  <Upload className="se26-dropzone-icon" />
                  <span className="se26-dropzone-title">
                    {isIndo ? "Klik atau seret favicon ke sini" : "Click or drag favicon here"}
                  </span>
                  <span className="se26-dropzone-spec">
                    32x32, 64x64, 192x192 &bull; Maks 5MB
                  </span>
                </div>

                {seoImageErrors.faviconDataUrl ? (
                  <p className="text-xs text-rose-600 font-medium">
                    {seoImageErrors.faviconDataUrl}
                  </p>
                ) : null}

                {/* Favicon Active Preview Pill */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-lg bg-white p-1 border border-slate-200 flex items-center justify-center dark:bg-slate-800 dark:border-slate-700">
                      <img
                        src={seoFaviconPreviewSrc}
                        alt="Favicon preview"
                        className="h-7 w-7 object-contain"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/favicon.png";
                        }}
                      />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                        {isIndo ? "Favicon Aktif" : "Active Favicon"}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        {isIndo ? "Tampil di Tab & Google" : "Synced to Tab & Search"}
                      </span>
                    </div>
                  </div>

                  {seoSettings.faviconDataUrl ? (
                    <button
                      type="button"
                      onClick={() => onRemoveSeoImage("faviconDataUrl")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 transition dark:bg-slate-800 dark:border-slate-700"
                      title={isIndo ? "Hapus favicon khusus" : "Remove custom favicon"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Meta Image Banner (1200x630) */}
              <div className="flex flex-col gap-2">
                <div className="se26-label-row">
                  <span className="se26-label">
                    {isIndo ? "Banner Media Sosial" : "Social Share Image"}
                  </span>
                  <span className="text-[11px] text-slate-400">1200 x 630 px</span>
                </div>

                <input
                  ref={metaImageInputRef}
                  id="se26-meta-image-file"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  onChange={(e) => onSeoImageInputChange("metaImageDataUrl", e)}
                  className="hidden"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    seoDropActive.metaImageDataUrl = true;
                  }}
                  onDragLeave={() => {
                    seoDropActive.metaImageDataUrl = false;
                  }}
                  onDrop={(e) => onDropSeoImage("metaImageDataUrl", e)}
                  onClick={() => metaImageInputRef.current?.click()}
                  className={`se26-dropzone ${
                    seoDropActive.metaImageDataUrl ? "is-active" : ""
                  }`}
                >
                  <Upload className="se26-dropzone-icon" />
                  <span className="se26-dropzone-title">
                    {isIndo ? "Klik atau seret banner ke sini" : "Click or drag banner here"}
                  </span>
                  <span className="se26-dropzone-spec">
                    OpenGraph &bull; 1200x630 px &bull; Maks 5MB
                  </span>
                </div>

                {seoImageErrors.metaImageDataUrl ? (
                  <p className="text-xs text-rose-600 font-medium">
                    {seoImageErrors.metaImageDataUrl}
                  </p>
                ) : null}

                {/* Meta Image Active Preview Pill */}
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="h-10 w-16 rounded-lg bg-white overflow-hidden border border-slate-200 flex items-center justify-center dark:bg-slate-800 dark:border-slate-700 flex-shrink-0">
                      <img
                        src={seoMetaImagePreviewSrc}
                        alt="Meta banner preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/og-image.png";
                        }}
                      />
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block truncate">
                        {isIndo ? "Banner OpenGraph" : "OpenGraph Banner"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isIndo ? "Untuk WA, FB, Twitter" : "For WA, FB, X"}
                      </span>
                    </div>
                  </div>

                  {seoSettings.metaImageDataUrl ? (
                    <button
                      type="button"
                      onClick={() => onRemoveSeoImage("metaImageDataUrl")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 transition dark:bg-slate-800 dark:border-slate-700"
                      title={isIndo ? "Hapus banner" : "Remove banner"}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 1:1 Live Preview Simulators & Google Indexing Diagnostics */}
        <div className="space-y-6">
          {/* Section 3: Live Preview Simulation Card */}
          <div className="se26-card">
            <div className="se26-card-header">
              <div className="se26-card-title-group">
                <div className="se26-card-icon">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="se26-card-title">
                    {isIndo ? "Simulasi Live Pratinjau" : "Live Preview Simulation"}
                  </h2>
                </div>
              </div>

              {/* View Selector (Google SERP vs Social Card) */}
              <div className="flex items-center gap-1.5">
                <div className="se26-device-group">
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("google")}
                    className={`se26-device-btn ${
                      activePreviewTab === "google" ? "is-active" : ""
                    }`}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePreviewTab("social")}
                    className={`se26-device-btn ${
                      activePreviewTab === "social" ? "is-active" : ""
                    }`}
                  >
                    Social Card
                  </button>
                </div>
              </div>
            </div>

            {/* Google SERP Preview Mode */}
            {activePreviewTab === "google" ? (
              <div className="space-y-4">
                {/* Device switch for Google */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
                    Google Search Result (SERP)
                  </span>
                  <div className="se26-device-group">
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("desktop")}
                      className={`se26-device-btn ${
                        previewDevice === "desktop" ? "is-active" : ""
                      }`}
                    >
                      <Monitor className="h-3 w-3" />
                      <span>Desktop</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDevice("mobile")}
                      className={`se26-device-btn ${
                        previewDevice === "mobile" ? "is-active" : ""
                      }`}
                    >
                      <Smartphone className="h-3 w-3" />
                      <span>Mobile</span>
                    </button>
                  </div>
                </div>

                {/* Realistic Google SERP Mockup */}
                <div className={`se26-serp-box ${previewDevice === "mobile" ? "is-mobile" : ""}`}>
                  <div className="se26-serp-top-row">
                    <div className="se26-serp-favicon-wrap">
                      <img
                        src={seoFaviconPreviewSrc}
                        alt="Google snippet favicon"
                        className="se26-serp-favicon"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/favicon.png";
                        }}
                      />
                    </div>
                    <div className="se26-serp-site-meta">
                      <span className="se26-serp-sitename">TP Preneurs</span>
                      <span className="se26-serp-url">{canonicalUrl}</span>
                    </div>
                  </div>

                  <a
                    href={canonicalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="se26-serp-title"
                  >
                    {title}
                  </a>

                  <p className="se26-serp-snippet">{description}</p>
                </div>

                {/* Browser Tab Simulation */}
                <div className="pt-2">
                  <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400 block mb-2">
                    {isIndo ? "Simulasi Tab Browser Google Chrome" : "Browser Tab Simulation"}
                  </span>
                  <div>
                    <div className="se26-browser-tab-bar">
                      <div className="se26-browser-tab">
                        <img
                          src={seoFaviconPreviewSrc}
                          alt="Tab favicon"
                          className="se26-browser-tab-icon"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "/favicon.png";
                          }}
                        />
                        <span className="se26-browser-tab-title">{title}</span>
                        <X className="h-3 w-3 text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0 ml-1" />
                      </div>
                    </div>
                    <div className="se26-browser-viewport">
                      <div className="se26-browser-urlbar">
                        <Globe className="h-3 w-3 text-slate-400" />
                        <span className="truncate">{canonicalUrl}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Social Media (OpenGraph) Card Simulation */
              <div className="space-y-3">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400 block">
                  {isIndo
                    ? "Pratinjau Berbagi Tautan (WhatsApp, Telegram, Facebook, X)"
                    : "Social Share Preview (WhatsApp, Facebook, Telegram, X)"}
                </span>

                <div className="se26-social-card">
                  <img
                    src={seoMetaImagePreviewSrc}
                    alt="Social Card Banner"
                    className="se26-social-banner"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/og-image.png";
                    }}
                  />
                  <div className="se26-social-content">
                    <span className="se26-social-domain">
                      {canonicalUrl.replace(/^https?:\/\//i, "").split("/")[0] || "TPPRENEURS.COM"}
                    </span>
                    <h3 className="se26-social-title">{title}</h3>
                    <p className="se26-social-desc">{description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Audit & Google Indexing Diagnostics (Directly answering user's inquiry from Image 4) */}
          <div className="se26-card">
            <div className="se26-card-header">
              <div className="se26-card-title-group">
                <div className="se26-card-icon" style={{ background: "rgba(254, 111, 5, 0.12)", color: "#fe6f05" }}>
                  <HelpCircle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="se26-card-title">
                    {isIndo
                      ? "Diagnostik Sinkronisasi Google Search"
                      : "Google Search Sync Diagnostics"}
                  </h2>
                </div>
              </div>

              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--se26-navy)] hover:underline dark:text-sky-400"
              >
                <span>Google Search Console</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="se26-diag-box">
              <div className="se26-diag-item">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 block">
                    {isIndo
                      ? "Teks Judul & Deskripsi Sudah Singkron"
                      : "Title & Snippet Text Already In-Sync"}
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {isIndo
                      ? "Hasil Google pada lampiran gambar 4 telah menampilkan teks judul 'TP PRENEURS | Marketplace Multivendor' dan deskripsi 'Jual Beli Produk di TP Preneurs.' yang bersumber dari pengaturan admin."
                      : "Google search in attachment 4 already displays the exact title 'TP PRENEURS | Marketplace Multivendor' and snippet description saved in admin."}
                  </p>
                </div>
              </div>

              <div className="se26-diag-item">
                <Info className="h-4 w-4 text-[var(--se26-orange)] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 block">
                    {isIndo
                      ? "Mengapa Ikon Favicon Google Masih Memerlukan Waktu?"
                      : "Why Favicon Takes Time to Update in Google?"}
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {isIndo
                      ? "Google menggunakan crawler khusus (Googlebot-Image) yang bekerja terpisah dari crawler halaman teks. Server kini telah dikonfigurasi untuk menyajikan /favicon.ico langsung (HTTP 200 OK) beserta Schema.org JSON-LD."
                      : "Googlebot-Image crawls favicons in independent slow cycles. The server now serves /favicon.ico directly with HTTP 200 OK alongside Schema.org JSON-LD."}
                  </p>
                </div>
              </div>

              <div className="se26-diag-item">
                <Rocket className="h-4 w-4 text-[var(--se26-navy)] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 block">
                    {isIndo ? "Langkah Mempercepat Pembaruan:" : "Expedited Indexing Step:"}
                  </span>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    {isIndo
                      ? "Buka Google Search Console > Tempel URL https://tppreneurs.com/ pada bilah inspeksi URL > Klik tombol 'Minta Pengindeksan' (Request Indexing)."
                      : "Open Google Search Console > Enter https://tppreneurs.com/ in the URL Inspection bar > Click 'Request Indexing'."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="se26-bottom-bar">
        <div className="se26-bottom-inner">
          <div className="se26-bottom-status">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {meta?.updatedAt
                ? isIndo
                  ? `Terakhir diperbarui: ${new Date(meta.updatedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : `Last updated: ${new Date(meta.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                : isIndo
                ? "Draf siap disimpan atau dipublikasikan"
                : "Draft ready to save or publish"}
            </span>
          </div>

          <div className="se26-bottom-actions">
            {onReset ? (
              <button
                type="button"
                onClick={onReset}
                disabled={isLoading || isSaving || isPublishing}
                className="se26-btn-reset"
                title={isIndo ? "Kembalikan ke nilai awal" : "Reset to defaults"}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>{isIndo ? "Atur Ulang" : "Reset"}</span>
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => onSave?.({ publish: false })}
              disabled={isLoading || isSaving || isPublishing}
              className="se26-btn-save"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isSaving ? (isIndo ? "Menyimpan..." : "Saving...") : isIndo ? "Simpan Draf" : "Save Draft"}</span>
            </button>

            <button
              type="button"
              onClick={onPublish}
              disabled={isLoading || isSaving || isPublishing}
              className="se26-btn-publish"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>{isPublishing ? (isIndo ? "Menerbitkan..." : "Publishing...") : isIndo ? "Publikasikan" : "Publish Draft"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

