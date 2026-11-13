import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Mail,
  PhoneCall,
  MapPin,
  Send,
  Sparkles,
  Monitor,
  Smartphone,
  Eye,
  Save,
  Rocket,
  RotateCcw,
  ExternalLink,
  Upload,
  Trash2,
  CheckCircle2,
  MessageSquare,
  HelpCircle,
  Building,
  Headphones,
  Image as ImageIcon,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import "./StoreCustomizationContactSettings2026.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

// Official TP Preneurs Presets
const TP_OFFICIAL_CONTACT_PRESET = {
  id: {
    pageHeader: {
      pageTitle: "Hubungi Kami",
    },
    emailBox: {
      title: "Email Kami",
      email: "tppreneurs@gmail.com",
      text: "Respon cepat 1x24 jam",
    },
    callBox: {
      title: "Telepon & WhatsApp",
      phone: "+62821-8866-824",
      text: "Senin - Jumat, 09:00 - 17:00 WITA",
    },
    addressBox: {
      title: "Alamat Operasional",
      address: "Jl. Tamalate No.1, Bonto Makkio, Kec. Rappocini, Kota Makassar, Sulawesi Selatan 90222",
    },
    contactForm: {
      title: "Kirim Pesan Langsung",
      description: "Tim layanan pelanggan kami siap membantu pertanyaan dan kebutuhan kerjasama Anda.",
    },
  },
  en: {
    pageHeader: {
      pageTitle: "Contact Us",
    },
    emailBox: {
      title: "Email Us",
      email: "tppreneurs@gmail.com",
      text: "Fast response within 24h",
    },
    callBox: {
      title: "Phone & WhatsApp",
      phone: "+62821-8866-824",
      text: "Mon - Fri, 09:00 - 17:00 WITA",
    },
    addressBox: {
      title: "Office Address",
      address: "Jl. Tamalate No.1, Bonto Makkio, Kec. Rappocini, Kota Makassar, South Sulawesi 90222",
    },
    contactForm: {
      title: "Send Us a Message",
      description: "Our customer support team is ready to answer inquiries and collaboration requests.",
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
      className={`cu26-toggle-btn ${checked ? "is-active" : "is-inactive"}`}
    >
      <span className="cu26-toggle-knob" />
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
  specNote = "1920x400 • JPG, PNG, WEBP",
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
        <span className="cu26-label">{label}</span>
        <span className="cu26-dropzone-badge">{specNote}</span>
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
        <div className="cu26-img-preview-box group">
          <img src={value} alt={label} />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="cu26-img-remove-btn"
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
          className="cu26-dropzone"
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
              {isId ? "Klik atau seret gambar ke sini" : "Click or drag image here"}
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

export default function StoreCustomizationContactSettings2026({
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
}) {
  const { i18n } = useTranslation();
  const isId =
    String(language || "").toLowerCase().startsWith("id") ||
    String(i18n?.language || "").toLowerCase().startsWith("id");
  const isIndo = isId;

  // Active channel subtab: "email" | "phone" | "address"
  const [activeChannelTab, setActiveChannelTab] = useState("email");

  // Device switcher for preview: "desktop" | "mobile"
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Normalized safe data structure
  const safeData = useMemo(() => {
    const raw = value && typeof value === "object" ? value : {};
    return {
      pageHeader: {
        enabled: Boolean(raw.pageHeader?.enabled),
        backgroundImageDataUrl: toText(raw.pageHeader?.backgroundImageDataUrl),
        pageTitle: toText(raw.pageHeader?.pageTitle),
      },
      emailBox: {
        enabled: Boolean(raw.emailBox?.enabled),
        title: toText(raw.emailBox?.title),
        email: toText(raw.emailBox?.email),
        text: toText(raw.emailBox?.text),
      },
      callBox: {
        enabled: Boolean(raw.callBox?.enabled),
        title: toText(raw.callBox?.title),
        phone: toText(raw.callBox?.phone),
        text: toText(raw.callBox?.text),
      },
      addressBox: {
        enabled: Boolean(raw.addressBox?.enabled),
        title: toText(raw.addressBox?.title),
        address: toText(raw.addressBox?.address),
      },
      middleLeftColumn: {
        enabled: Boolean(raw.middleLeftColumn?.enabled),
        imageDataUrl: toText(raw.middleLeftColumn?.imageDataUrl),
      },
      contactForm: {
        enabled: Boolean(raw.contactForm?.enabled),
        title: toText(raw.contactForm?.title),
        description: toText(raw.contactForm?.description),
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
    const preset = isId ? TP_OFFICIAL_CONTACT_PRESET.id : TP_OFFICIAL_CONTACT_PRESET.en;
    onChange?.((prev) => {
      const prevSource = prev && typeof prev === "object" ? prev : {};
      return {
        ...prevSource,
        pageHeader: {
          ...prevSource.pageHeader,
          pageTitle: preset.pageHeader.pageTitle,
          enabled: true,
        },
        emailBox: {
          ...prevSource.emailBox,
          ...preset.emailBox,
          enabled: true,
        },
        callBox: {
          ...prevSource.callBox,
          ...preset.callBox,
          enabled: true,
        },
        addressBox: {
          ...prevSource.addressBox,
          ...preset.addressBox,
          enabled: true,
        },
        contactForm: {
          ...prevSource.contactForm,
          ...preset.contactForm,
          enabled: true,
        },
      };
    });
  };

  return (
    <div className="cu26-wrap">
      {/* 2026 Header Top Bar & Tab Navigation */}
      <div className="cu26-header-bar">
        <div className="cu26-header-top">
          <div className="cu26-title-group">
            <div className="cu26-title-icon">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h1 className="cu26-title">
                {isId ? "Kustomisasi Halaman Kontak" : "Contact Page Customization"}
              </h1>
              <p className="cu26-subtitle">
                {isId
                  ? "Kelola saluran kontak resmi, banner header, dan formulir pertanyaan."
                  : "Manage official contact channels, header banner, and inquiry form."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApplyOfficialPreset}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#fe6f05]/30 bg-[#fe6f05]/10 px-3 py-1.5 text-xs font-bold text-[#fe6f05] transition hover:bg-[#fe6f05]/20 dark:border-[#fe6f05]/40 dark:bg-[#fe6f05]/20 dark:text-orange-300"
              title={isId ? "Muat template kontak standar resmi" : "Load official contact preset"}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#fe6f05]" />
              <span>{isId ? "Muat Preset Kontak" : "Load Official Preset"}</span>
            </button>

            <a
              href="/contact-us"
              target="_blank"
              rel="noreferrer"
              className="cu26-page-link-badge"
              title={isId ? "Buka halaman kontak storefront di tab baru" : "Open storefront contact page"}
            >
              <span>{isId ? "Halaman Kontak" : "Contact Page"}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Unified Tab Navigation */}
        <StoreCustomizationTabNav2026 activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Main 2-Column Grid: Left Editor (Form Cards) / Right Live Preview */}
      <div className="cu26-grid">
        {/* Left Column: Form Controls */}
        <div className="flex flex-col gap-5">
          {/* CARD 1: Page Header */}
          <section className="cu26-card">
            <div className="cu26-card-header">
              <div className="cu26-card-title-group">
                <div className="cu26-card-icon">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="cu26-card-heading">
                    {isId ? "Banner Header Kontak" : "Contact Header Banner"}
                  </h2>
                  <p className="cu26-card-subheading">
                    {isId
                      ? "Kelola judul utama dan gambar latar header halaman kontak."
                      : "Manage hero title and background image for the contact page."}
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
              <div className="cu26-field">
                <label className="cu26-label" htmlFor="cu26-page-title-input">
                  {isId ? "Judul Banner (Page Title)" : "Page Title"}
                </label>
                <input
                  id="cu26-page-title-input"
                  type="text"
                  value={safeData.pageHeader.pageTitle}
                  onChange={(e) => updateSectionField("pageHeader", "pageTitle", e.target.value)}
                  placeholder={isId ? "Contoh: Hubungi Kami" : "e.g. Contact Us"}
                  className="cu26-input"
                />
              </div>

              <ImageUploadDropzone
                id="cu26-page-header-bg-input"
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

          {/* CARD 2: Unified Official Contact Channels (Email, Phone, Address) */}
          <section className="cu26-card">
            <div className="cu26-card-header">
              <div className="cu26-card-title-group">
                <div className="cu26-card-icon">
                  <Headphones className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="cu26-card-heading">
                    {isId ? "Saluran Kontak Resmi" : "Official Contact Channels"}
                  </h2>
                  <p className="cu26-card-subheading">
                    {isId
                      ? "3 kanal komunikasi (Email, Telepon/WA, Alamat) dalam panel ringkas."
                      : "3 communication channels (Email, Phone/WA, Address) in one panel."}
                  </p>
                </div>
              </div>
            </div>

            {/* Channels Subtabs */}
            <div className="cu26-channels-nav">
              <button
                type="button"
                onClick={() => setActiveChannelTab("email")}
                className={`cu26-channel-tab-btn ${activeChannelTab === "email" ? "is-active" : ""}`}
              >
                <Mail className="h-4 w-4 text-[#fe6f05]" />
                <span>{isId ? "Email" : "Email"}</span>
                {safeData.emailBox.enabled && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveChannelTab("phone")}
                className={`cu26-channel-tab-btn ${activeChannelTab === "phone" ? "is-active" : ""}`}
              >
                <PhoneCall className="h-4 w-4 text-[#fe6f05]" />
                <span>{isId ? "Telepon / WA" : "Phone / WA"}</span>
                {safeData.callBox.enabled && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveChannelTab("address")}
                className={`cu26-channel-tab-btn ${activeChannelTab === "address" ? "is-active" : ""}`}
              >
                <MapPin className="h-4 w-4 text-[#fe6f05]" />
                <span>{isId ? "Alamat Kantor" : "Address"}</span>
                {safeData.addressBox.enabled && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>

            {/* Tab 1: Email Box */}
            {activeChannelTab === "email" && (
              <div className="cu26-channel-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-[#034c85] dark:text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {isId ? "Pengaturan Kotak Email" : "Email Box Settings"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {safeData.emailBox.enabled
                        ? isId
                          ? "Aktif"
                          : "Enabled"
                        : isId
                        ? "Nonaktif"
                        : "Disabled"}
                    </span>
                    <Switch
                      checked={safeData.emailBox.enabled}
                      onChange={(val) => updateSectionEnabled("emailBox", val)}
                      ariaLabel="Toggle Email Box"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="cu26-field">
                    <label className="cu26-label" htmlFor="cu26-email-title">
                      {isId ? "Judul Kartu Email" : "Card Title"}
                    </label>
                    <input
                      id="cu26-email-title"
                      type="text"
                      value={safeData.emailBox.title}
                      onChange={(e) => updateSectionField("emailBox", "title", e.target.value)}
                      placeholder={isId ? "Contoh: Email Kami" : "e.g. Email Us"}
                      className="cu26-input"
                    />
                  </div>

                  <div className="cu26-field">
                    <label className="cu26-label" htmlFor="cu26-email-address">
                      {isId ? "Alamat Email" : "Email Address"}
                    </label>
                    <input
                      id="cu26-email-address"
                      type="email"
                      value={safeData.emailBox.email}
                      onChange={(e) => updateSectionField("emailBox", "email", e.target.value)}
                      placeholder="tppreneurs@gmail.com"
                      className="cu26-input"
                    />
                  </div>
                </div>

                <div className="cu26-field">
                  <label className="cu26-label" htmlFor="cu26-email-text">
                    {isId ? "Keterangan / SLA Respon" : "Subtitle / Response SLA"}
                  </label>
                  <input
                    id="cu26-email-text"
                    type="text"
                    value={safeData.emailBox.text}
                    onChange={(e) => updateSectionField("emailBox", "text", e.target.value)}
                    placeholder={
                      isId ? "Contoh: Respon cepat 1x24 jam" : "e.g. Fast response within 24h"
                    }
                    className="cu26-input"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Call Us Box */}
            {activeChannelTab === "phone" && (
              <div className="cu26-channel-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PhoneCall className="h-4 w-4 text-[#034c85] dark:text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {isId ? "Pengaturan Kotak Telepon / WA" : "Phone & WhatsApp Settings"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {safeData.callBox.enabled
                        ? isId
                          ? "Aktif"
                          : "Enabled"
                        : isId
                        ? "Nonaktif"
                        : "Disabled"}
                    </span>
                    <Switch
                      checked={safeData.callBox.enabled}
                      onChange={(val) => updateSectionEnabled("callBox", val)}
                      ariaLabel="Toggle Call Box"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                  <div className="cu26-field">
                    <label className="cu26-label" htmlFor="cu26-phone-title">
                      {isId ? "Judul Kartu Telepon" : "Card Title"}
                    </label>
                    <input
                      id="cu26-phone-title"
                      type="text"
                      value={safeData.callBox.title}
                      onChange={(e) => updateSectionField("callBox", "title", e.target.value)}
                      placeholder={isId ? "Contoh: Telepon & WhatsApp" : "e.g. Call Us"}
                      className="cu26-input"
                    />
                  </div>

                  <div className="cu26-field">
                    <label className="cu26-label" htmlFor="cu26-phone-number">
                      {isId ? "Nomor Telepon / WhatsApp" : "Phone / WA Number"}
                    </label>
                    <input
                      id="cu26-phone-number"
                      type="text"
                      value={safeData.callBox.phone}
                      onChange={(e) => updateSectionField("callBox", "phone", e.target.value)}
                      placeholder="+62821-8866-824"
                      className="cu26-input"
                    />
                  </div>
                </div>

                <div className="cu26-field">
                  <label className="cu26-label" htmlFor="cu26-phone-text">
                    {isId ? "Jam Layanan Operasional" : "Support Hours / Schedule"}
                  </label>
                  <input
                    id="cu26-phone-text"
                    type="text"
                    value={safeData.callBox.text}
                    onChange={(e) => updateSectionField("callBox", "text", e.target.value)}
                    placeholder={
                      isId
                        ? "Contoh: Senin - Jumat, 09:00 - 17:00 WITA"
                        : "e.g. Mon - Fri, 09:00 - 17:00 WITA"
                    }
                    className="cu26-input"
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Address Box */}
            {activeChannelTab === "address" && (
              <div className="cu26-channel-panel">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#034c85] dark:text-blue-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {isId ? "Pengaturan Kotak Alamat" : "Office Address Settings"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {safeData.addressBox.enabled
                        ? isId
                          ? "Aktif"
                          : "Enabled"
                        : isId
                        ? "Nonaktif"
                        : "Disabled"}
                    </span>
                    <Switch
                      checked={safeData.addressBox.enabled}
                      onChange={(val) => updateSectionEnabled("addressBox", val)}
                      ariaLabel="Toggle Address Box"
                    />
                  </div>
                </div>

                <div className="cu26-field">
                  <label className="cu26-label" htmlFor="cu26-address-title">
                    {isId ? "Judul Kartu Alamat" : "Card Title"}
                  </label>
                  <input
                    id="cu26-address-title"
                    type="text"
                    value={safeData.addressBox.title}
                    onChange={(e) => updateSectionField("addressBox", "title", e.target.value)}
                    placeholder={isId ? "Contoh: Alamat Operasional" : "e.g. Office Location"}
                    className="cu26-input"
                  />
                </div>

                <div className="cu26-field">
                  <label className="cu26-label" htmlFor="cu26-address-text">
                    {isId ? "Alamat Lengkap Kantor" : "Full Office Address"}
                  </label>
                  <textarea
                    id="cu26-address-text"
                    value={safeData.addressBox.address}
                    onChange={(e) => updateSectionField("addressBox", "address", e.target.value)}
                    placeholder="Jl. Tamalate No.1, Bonto Makkio, Kec. Rappocini, Kota Makassar, Sulawesi Selatan 90222"
                    rows={3}
                    className="cu26-textarea"
                  />
                </div>
              </div>
            )}
          </section>

          {/* CARD 3: Combined Inquiry Form & Visual Banner */}
          <section className="cu26-card">
            <div className="cu26-card-header">
              <div className="cu26-card-title-group">
                <div className="cu26-card-icon">
                  <MessageSquare className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="cu26-card-heading">
                    {isId ? "Formulir Pesan & Visual Pendukung" : "Inquiry Form & Visual Graphic"}
                  </h2>
                  <p className="cu26-card-subheading">
                    {isId
                      ? "Kelola judul formulir kirim pesan dan banner visual sisi samping."
                      : "Manage contact form heading and companion illustrative graphic."}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {/* Form Title & Description */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                    {isId ? "Formulir Kirim Pesan" : "Inquiry Contact Form"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {safeData.contactForm.enabled
                        ? isId
                          ? "Aktif"
                          : "Enabled"
                        : isId
                        ? "Nonaktif"
                        : "Disabled"}
                    </span>
                    <Switch
                      checked={safeData.contactForm.enabled}
                      onChange={(val) => updateSectionEnabled("contactForm", val)}
                      ariaLabel="Toggle Contact Form"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="cu26-field">
                    <label className="cu26-label" htmlFor="cu26-form-title">
                      {isId ? "Judul Formulir" : "Form Heading"}
                    </label>
                    <input
                      id="cu26-form-title"
                      type="text"
                      value={safeData.contactForm.title}
                      onChange={(e) => updateSectionField("contactForm", "title", e.target.value)}
                      placeholder={isId ? "Contoh: Kirim Pesan Langsung" : "e.g. Send Us a Message"}
                      className="cu26-input"
                    />
                  </div>

                  <div className="cu26-field">
                    <label className="cu26-label" htmlFor="cu26-form-description">
                      {isId ? "Deskripsi / Petunjuk Pengisian" : "Form Subtitle / Instructions"}
                    </label>
                    <textarea
                      id="cu26-form-description"
                      value={safeData.contactForm.description}
                      onChange={(e) =>
                        updateSectionField("contactForm", "description", e.target.value)
                      }
                      placeholder={
                        isId
                          ? "Kirimkan pertanyaan atau pesan Anda kepada kami."
                          : "Send us your questions or inquiries."
                      }
                      rows={2}
                      className="cu26-textarea"
                    />
                  </div>
                </div>
              </div>

              {/* Companion Graphic (middleLeftColumn) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                    {isId ? "Visual Grafis Samping (Companion Graphic)" : "Side Companion Graphic"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      {safeData.middleLeftColumn.enabled
                        ? isId
                          ? "Aktif"
                          : "Enabled"
                        : isId
                        ? "Nonaktif"
                        : "Disabled"}
                    </span>
                    <Switch
                      checked={safeData.middleLeftColumn.enabled}
                      onChange={(val) => updateSectionEnabled("middleLeftColumn", val)}
                      ariaLabel="Toggle Side Graphic"
                    />
                  </div>
                </div>

                <ImageUploadDropzone
                  id="cu26-middle-left-image-input"
                  label={isId ? "Gambar Ilustrasi Samping" : "Companion Graphic Image"}
                  value={safeData.middleLeftColumn.imageDataUrl}
                  onChange={(dataUrl) =>
                    updateSectionField("middleLeftColumn", "imageDataUrl", dataUrl)
                  }
                  onRemove={() => updateSectionField("middleLeftColumn", "imageDataUrl", "")}
                  isId={isId}
                  specNote="800x600 • Maks 5MB"
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: 1:1 Live Storefront Preview */}
        <div className="cu26-preview-shell">
          <div className="cu26-preview-controls">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#fe6f05]" />
              <span className="text-xs font-bold uppercase tracking-wide text-slate-700 dark:text-slate-300">
                {isId ? "Pratinjau Langsung 1:1" : "Live Storefront Preview"}
              </span>
            </div>

            {/* Device Switcher */}
            <div className="cu26-device-selector">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`cu26-device-btn ${previewDevice === "desktop" ? "is-active" : ""}`}
                title={isId ? "Tampilan Desktop" : "Desktop View"}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`cu26-device-btn ${previewDevice === "mobile" ? "is-active" : ""}`}
                title={isId ? "Tampilan Mobile" : "Mobile View"}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div className={`cu26-preview-frame ${previewDevice === "mobile" ? "is-mobile" : ""}`}>
            {/* Header Simulation */}
            {safeData.pageHeader.enabled && (
              <div
                className={`cu26-storefront-header ${
                  safeData.pageHeader.backgroundImageDataUrl ? "has-bg" : ""
                }`}
                style={
                  safeData.pageHeader.backgroundImageDataUrl
                    ? {
                        backgroundImage: `url(${safeData.pageHeader.backgroundImageDataUrl})`,
                      }
                    : { background: "linear-gradient(135deg, #034c85 0%, #022340 100%)" }
                }
              >
                <div className="cu26-storefront-header-content">
                  <span className="cu26-storefront-badge">
                    {isId ? "Layanan Resmi" : "Official Support"}
                  </span>
                  <h3 className="cu26-storefront-title">
                    {safeData.pageHeader.pageTitle || (isId ? "Hubungi Kami" : "Contact Us")}
                  </h3>
                </div>
              </div>
            )}

            {/* Storefront Body Content */}
            <div className="cu26-storefront-body">
              {/* 3 Channel Cards Grid */}
              <div className="cu26-sim-channels-grid">
                {/* Email Sim Card */}
                {safeData.emailBox.enabled ? (
                  <div className="cu26-sim-channel-card border-t-2 border-t-[#034c85]">
                    <div className="cu26-sim-channel-icon">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                      {safeData.emailBox.title || (isId ? "Email Kami" : "Email Us")}
                    </span>
                    <span className="break-all text-[11px] font-semibold text-[#034c85] dark:text-blue-400">
                      {safeData.emailBox.email || "tppreneurs@gmail.com"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {safeData.emailBox.text || (isId ? "Respon 1x24 jam" : "Response 24h")}
                    </span>
                  </div>
                ) : (
                  <div className="cu26-sim-channel-card opacity-40">
                    <span className="text-[10px] text-slate-400">
                      {isId ? "(Email Nonaktif)" : "(Email Disabled)"}
                    </span>
                  </div>
                )}

                {/* Call Sim Card */}
                {safeData.callBox.enabled ? (
                  <div className="cu26-sim-channel-card border-t-2 border-t-[#fe6f05]">
                    <div className="cu26-sim-channel-icon text-[#fe6f05]">
                      <PhoneCall className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                      {safeData.callBox.title || (isId ? "Telepon / WA" : "Phone / WA")}
                    </span>
                    <span className="text-[11px] font-semibold text-[#fe6f05]">
                      {safeData.callBox.phone || "+62821-8866-824"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {safeData.callBox.text ||
                        (isId ? "Senin - Jumat 09-17" : "Mon - Fri 09-17")}
                    </span>
                  </div>
                ) : (
                  <div className="cu26-sim-channel-card opacity-40">
                    <span className="text-[10px] text-slate-400">
                      {isId ? "(Telepon Nonaktif)" : "(Phone Disabled)"}
                    </span>
                  </div>
                )}

                {/* Address Sim Card */}
                {safeData.addressBox.enabled ? (
                  <div className="cu26-sim-channel-card border-t-2 border-t-slate-400">
                    <div className="cu26-sim-channel-icon text-slate-600">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-100">
                      {safeData.addressBox.title || (isId ? "Kantor" : "Office")}
                    </span>
                    <span className="line-clamp-2 text-[10px] leading-tight text-slate-600 dark:text-slate-300">
                      {safeData.addressBox.address || "Jl. Tamalate No.1, Makassar"}
                    </span>
                  </div>
                ) : (
                  <div className="cu26-sim-channel-card opacity-40">
                    <span className="text-[10px] text-slate-400">
                      {isId ? "(Alamat Nonaktif)" : "(Address Disabled)"}
                    </span>
                  </div>
                )}
              </div>

              {/* Inquiry Form Simulation */}
              {safeData.contactForm.enabled && (
                <div className="cu26-sim-form-box">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#034c85]/10 text-[#034c85] dark:text-blue-300">
                      <Send className="h-3 w-3" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {safeData.contactForm.title || (isId ? "Kirim Pesan" : "Send Message")}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {safeData.contactForm.description ||
                          (isId
                            ? "Kirimkan pertanyaan Anda."
                            : "Send us your questions.")}
                      </p>
                    </div>
                  </div>

                  {/* Dummy input controls simulating client form */}
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[10px] text-slate-400 flex items-center dark:border-slate-700 dark:bg-slate-900">
                        {isId ? "Nama Anda" : "Your Name"}
                      </div>
                      <div className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[10px] text-slate-400 flex items-center dark:border-slate-700 dark:bg-slate-900">
                        {isId ? "Email Anda" : "Your Email"}
                      </div>
                    </div>
                    <div className="h-12 rounded-md border border-slate-200 bg-white p-2 text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-900">
                      {isId ? "Tuliskan pesan atau pertanyaan..." : "Write message..."}
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1 rounded-md bg-[#034c85] px-3 py-1 text-[10px] font-bold text-white opacity-90"
                      >
                        <Send className="h-2.5 w-2.5" />
                        <span>{isId ? "Kirim Pesan" : "Send Message"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Side Graphic Simulation */}
              {safeData.middleLeftColumn.enabled &&
                safeData.middleLeftColumn.imageDataUrl && (
                  <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                    <img
                      src={safeData.middleLeftColumn.imageDataUrl}
                      alt="Companion Graphic"
                      className="h-32 w-full object-cover"
                    />
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="cu26-sticky-bar">
        <div className="cu26-sticky-inner">
          <div className="flex items-center gap-2">
            <span className="cu26-status-pill">
              <span className="cu26-status-dot" />
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

          <div className="cu26-action-btns">
            <button
              type="button"
              onClick={onReset}
              disabled={isSaving || isPublishing || isLoading}
              className="cu26-btn-reset"
              title={isId ? "Reset draf ke data tersimpan" : "Reset draft to stored"}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isId ? "Reset Draf" : "Reset Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => onSave?.({ publish: false })}
              disabled={isSaving || isPublishing || isLoading}
              className="cu26-btn-save"
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
              className="cu26-btn-publish"
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

