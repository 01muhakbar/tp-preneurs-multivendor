import { useState, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CircleHelp,
  HelpCircle,
  Upload,
  Trash2,
  ChevronDown,
  Sparkles,
  Monitor,
  Smartphone,
  Eye,
  Save,
  Rocket,
  RotateCcw,
  ExternalLink,
  Search,
  CheckCircle2,
  Plus,
  Minimize2,
  Maximize2,
  Image as ImageIcon,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import "./StoreCustomizationFaqsSettings2026.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const FAQ_ITEMS_COUNT = 8;

// Official TP Preneurs Standard FAQ Templates
const TP_STANDARD_FAQS = {
  id: [
    {
      title: "Bagaimana cara berbelanja produk di TP Preneurs?",
      description:
        "Anda dapat menjelajahi katalog produk, memilih produk atau media pembelajaran yang diinginkan, menambahkannya ke keranjang belanja, dan menyelesaikan checkout dengan metode pembayaran resmi yang tersedia.",
    },
    {
      title: "Metode pembayaran apa saja yang didukung?",
      description:
        "TP Preneurs mendukung pembayaran melalui Transfer Bank Virtual Account, QRIS (ShopeePay, GoPay, OVO, Dana), dan dompet digital yang terintegrasi secara aman.",
    },
    {
      title: "Bagaimana cara melacak pengiriman pesanan saya?",
      description:
        "Anda dapat memantau status pesanan dan nomor resi pengiriman kurir secara langsung melalui menu Pesanan Saya di dasbor akun pelanggan atau halaman Lacak Pesanan.",
    },
    {
      title: "Apakah saya bisa membatalkan pesanan yang sudah dibayar?",
      description:
        "Pembatalan dapat diajukan sebelum pesanan diproses atau dikirim oleh penjual (merchant). Silakan hubungi penjual melalui chat atau layanan bantuan kami.",
    },
    {
      title: "Bagaimana cara mendaftar sebagai penjual (Edupreneur) di TP Preneurs?",
      description:
        "Klik tombol 'Menjadi Penjual' di bagian header atau footer, lengkapi formulir pendaftaran toko, unggah data verifikasi usaha/karya, dan tunggu proses persetujuan tim admin.",
    },
    {
      title: "Apakah produk digital (e-book, modul, video tutorial) dapat langsung diunduh?",
      description:
        "Ya. Setelah pembayaran diverifikasi oleh sistem, tautan unduhan produk digital akan otomatis aktif dan dapat diunduh di halaman rincian pesanan akun Anda.",
    },
    {
      title: "Bagaimana jika produk fisik yang diterima rusak atau tidak sesuai?",
      description:
        "Anda dapat mengajukan klaim penggantian atau retur dalam kurun waktu 2x24 jam sejak pesanan diterima dengan menyertakan bukti foto dan video unboxing paket.",
    },
    {
      title: "Bagaimana cara menghubungi pusat bantuan pelanggan TP Preneurs?",
      description:
        "Anda dapat menghubungi tim layanan pelanggan kami melalui WhatsApp resmi, email support@tppreneurs.com, atau formulir kontak pada halaman Kontak Kami.",
    },
  ],
  en: [
    {
      title: "How do I purchase products on TP Preneurs?",
      description:
        "Browse our catalog, select the educational tools or creative goods you need, add them to your cart, and proceed through our secure multi-vendor checkout.",
    },
    {
      title: "What payment methods are supported?",
      description:
        "We accept Virtual Accounts (BCA, Mandiri, BNI, BRI), QRIS instant payments (GoPay, OVO, ShopeePay, DANA), and major digital wallets.",
    },
    {
      title: "How can I track my shipment status?",
      description:
        "You can track live courier milestones and tracking numbers directly from the My Orders section in your customer account or via our Track Order page.",
    },
    {
      title: "Can I cancel my order after payment?",
      description:
        "Cancellations can be requested before the vendor confirms and ships the package. Please contact the merchant or our support desk immediately.",
    },
    {
      title: "How do I register as an Edupreneur vendor on TP Preneurs?",
      description:
        "Click 'Become a Seller', fill out the onboarding application, submit your business/student credentials, and our verification team will review your shop.",
    },
    {
      title: "Are digital learning resources available for instant download?",
      description:
        "Yes. Once payment is confirmed, your download links for digital modules, assets, and learning kits will unlock immediately in your order detail page.",
    },
    {
      title: "What is the return or refund policy for damaged goods?",
      description:
        "You may request a replacement or refund within 48 hours of delivery by providing unboxing video evidence and order references.",
    },
    {
      title: "How can I contact TP Preneurs customer support?",
      description:
        "Reach out through our official WhatsApp desk, email us at support@tppreneurs.com, or submit a request on our Contact Us page.",
    },
  ],
};

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className={`faq26-toggle-btn ${checked ? "is-active" : "is-inactive"}`}
    >
      <span className="faq26-toggle-knob" />
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
  specNote = "1920x400 • Maks 5MB",
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
          ? "Ukuran gambar maksimal 5MB."
          : "Image size must not exceed 5MB."
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  return (
    <div className="faq26-field">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="faq26-label">
          {label}
        </label>
        <span className="faq26-dropzone-badge">{specNote}</span>
      </div>

      {value ? (
        <div className="faq26-img-preview-box">
          <img src={value} alt="Preview" />
          <button
            type="button"
            onClick={onRemove}
            className="faq26-img-remove-btn"
            title={isId ? "Hapus gambar" : "Remove image"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="faq26-dropzone"
        >
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
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

export default function StoreCustomizationFaqsSettings2026({
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

  // State for Hide/Show accordion in FAQ list (set of open item indices)
  const [expandedIndexes, setExpandedIndexes] = useState(() => new Set([0]));

  // Search filter inside FAQ editor
  const [searchQuery, setSearchQuery] = useState("");

  // Device switcher for preview: "desktop" | "mobile"
  const [previewDevice, setPreviewDevice] = useState("desktop");

  // Interactive accordion state inside live preview mockup
  const [previewOpenIndex, setPreviewOpenIndex] = useState(0);

  const pageHeader = value?.pageHeader || {};
  const leftColumn = value?.leftColumn || {};
  const content = value?.content || {};
  const rawItems = Array.isArray(content?.items) ? content.items : [];

  // Guarantee 8 items
  const items = useMemo(() => {
    return Array.from({ length: FAQ_ITEMS_COUNT }).map((_, index) => {
      const item = rawItems[index] || {};
      return {
        title: toText(item.title, ""),
        description: toText(item.description, ""),
      };
    });
  }, [rawItems]);

  const toggleItem = (index) => {
    setExpandedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIndexes(new Set(Array.from({ length: FAQ_ITEMS_COUNT }, (_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedIndexes(new Set());
  };

  const handleUpdateItem = (index, field, val) => {
    const nextItems = [...items];
    nextItems[index] = {
      ...nextItems[index],
      [field]: val,
    };
    onChange((prev) => ({
      ...prev,
      content: {
        ...prev?.content,
        items: nextItems,
      },
    }));
  };

  const handleApplyStandardTemplate = () => {
    const templateList = isId ? TP_STANDARD_FAQS.id : TP_STANDARD_FAQS.en;
    onChange((prev) => ({
      ...prev,
      pageHeader: {
        ...prev?.pageHeader,
        pageTitle: isId ? "Tanya Jawab (FAQ)" : "Frequently Asked Questions",
      },
      content: {
        ...prev?.content,
        items: templateList,
      },
    }));
    expandAll();
  };

  const statusLabel = isPublishing
    ? isId
      ? "Menerbitkan draf..."
      : "Publishing draft..."
    : isSaving
    ? isId
      ? "Menyimpan draf..."
      : "Saving draft..."
    : meta?.hasUnpublishedChanges
    ? isId
      ? "Draf Tersimpan (Belum Rilis)"
      : "Draft Saved (Unpublished)"
    : meta?.publishedAt
    ? isId
      ? "Telah Diterbitkan"
      : "Published"
    : isId
    ? "Siap"
    : "Ready";

  const filledCount = items.filter(
    (item) => item.title.trim().length > 0 || item.description.trim().length > 0
  ).length;

  return (
    <div className="faq26-wrap">
      {/* Top Header Bar & Global Tab Nav */}
      <div className="faq26-header-bar">
        <div className="faq26-header-top">
          <div className="faq26-title-group">
            <div className="faq26-title-icon">
              <CircleHelp className="h-6 w-6" />
            </div>
            <div>
              <h1 className="faq26-title">
                {isId ? "Kustomisasi Halaman FAQ" : "FAQs Customization"}
              </h1>
              <p className="faq26-subtitle">
                {isId
                  ? "Kelola pertanyaan umum pelanggan dan edupreneur yang tampil di https://tppreneurs.com/faq."
                  : "Manage customer and seller FAQs displayed on https://tppreneurs.com/faq."}
              </p>
            </div>
          </div>

          <a
            href="/faq"
            target="_blank"
            rel="noreferrer"
            className="faq26-page-link-badge"
          >
            <span>{isId ? "Lihat Halaman /faq" : "View Live /faq"}</span>
            <ExternalLink className="h-3.5 w-3.5 text-[#fe6f05]" />
          </a>
        </div>

        {/* Global Store Customization Tab Navigation */}
        <StoreCustomizationTabNav2026
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* Main Grid: Left Controls vs Right 1:1 Live Preview */}
      <div className="faq26-grid">
        {/* Left Form Controls */}
        <div className="flex flex-col gap-5">
          {/* Card 1: Page Header Configuration */}
          <div className="faq26-card">
            <div className="faq26-card-header">
              <div className="faq26-card-title-group">
                <div className="faq26-card-icon">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="faq26-card-heading">
                    {isId ? "Header & Judul FAQ" : "FAQs Header & Banner"}
                  </h2>
                  <p className="faq26-card-subheading">
                    {isId
                      ? "Aktifkan banner atas dan tentukan judul hero halaman."
                      : "Enable top header banner and set hero page title."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {pageHeader?.enabled ? (isId ? "Aktif" : "Enabled") : (isId ? "Nonaktif" : "Disabled")}
                </span>
                <Switch
                  checked={Boolean(pageHeader?.enabled)}
                  onChange={(val) =>
                    onChange((prev) => ({
                      ...prev,
                      pageHeader: { ...prev?.pageHeader, enabled: val },
                    }))
                  }
                  ariaLabel="Toggle FAQ page header"
                />
              </div>
            </div>

            {/* Page Title Input */}
            <div className="faq26-field">
              <label htmlFor="faq-page-title" className="faq26-label">
                {isId ? "Judul Halaman (Page Title)" : "Page Title"}
              </label>
              <input
                id="faq-page-title"
                type="text"
                value={pageHeader?.pageTitle ?? ""}
                onChange={(e) =>
                  onChange((prev) => ({
                    ...prev,
                    pageHeader: { ...prev?.pageHeader, pageTitle: e.target.value },
                  }))
                }
                placeholder={isId ? "Tanya Jawab (FAQ)" : "FAQs"}
                className="faq26-input"
              />
            </div>

            {/* Header Background Image */}
            <ImageUploadDropzone
              id="faq-header-bg-input"
              label={
                isId
                  ? "Gambar Latar Banner Header (Opsional)"
                  : "Header Banner Background Image (Optional)"
              }
              value={pageHeader?.backgroundImageDataUrl}
              onChange={(dataUrl) =>
                onChange((prev) => ({
                  ...prev,
                  pageHeader: {
                    ...prev?.pageHeader,
                    backgroundImageDataUrl: dataUrl,
                  },
                }))
              }
              onRemove={() =>
                onChange((prev) => ({
                  ...prev,
                  pageHeader: { ...prev?.pageHeader, backgroundImageDataUrl: "" },
                }))
              }
              isId={isId}
              specNote="1920x400 • Maks 5MB"
            />
          </div>

          {/* Card 2: Left Column Visual Graphic */}
          <div className="faq26-card">
            <div className="faq26-card-header">
              <div className="faq26-card-title-group">
                <div className="faq26-card-icon">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="faq26-card-heading">
                    {isId ? "Kolom Visual Samping (Grafis)" : "Left Column Visual Graphic"}
                  </h2>
                  <p className="faq26-card-subheading">
                    {isId
                      ? "Ilustrasi atau foto di sisi kiri daftar pertanyaan."
                      : "Side illustration or photo alongside the FAQ questions list."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {leftColumn?.enabled ? (isId ? "Aktif" : "Enabled") : (isId ? "Nonaktif" : "Disabled")}
                </span>
                <Switch
                  checked={Boolean(leftColumn?.enabled)}
                  onChange={(val) =>
                    onChange((prev) => ({
                      ...prev,
                      leftColumn: { ...prev?.leftColumn, enabled: val },
                    }))
                  }
                  ariaLabel="Toggle left column visual"
                />
              </div>
            </div>

            <ImageUploadDropzone
              id="faq-left-graphic-input"
              label={
                isId
                  ? "Gambar Ilustrasi Kolom Kiri"
                  : "Left Column Graphic Illustration"
              }
              value={leftColumn?.leftImageDataUrl}
              onChange={(dataUrl) =>
                onChange((prev) => ({
                  ...prev,
                  leftColumn: {
                    ...prev?.leftColumn,
                    leftImageDataUrl: dataUrl,
                  },
                }))
              }
              onRemove={() =>
                onChange((prev) => ({
                  ...prev,
                  leftColumn: { ...prev?.leftColumn, leftImageDataUrl: "" },
                }))
              }
              isId={isId}
              specNote="800x800 • Maks 5MB"
            />
          </div>

          {/* Card 3: FAQ Questions & Hide/Show Accordion List */}
          <div className="faq26-card">
            <div className="faq26-card-header">
              <div className="faq26-card-title-group">
                <div className="faq26-card-icon">
                  <CircleHelp className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="faq26-card-heading">
                    {isId ? "Daftar Pertanyaan & Jawaban" : "FAQ Questions & Answers"}
                  </h2>
                  <p className="faq26-card-subheading">
                    {isId
                      ? "Gunakan fitur Hide/Show untuk melipat atau membuka setiap pertanyaan."
                      : "Use Hide/Show controls to collapse or expand individual questions."}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {content?.enabled ? (isId ? "Aktif" : "Enabled") : (isId ? "Nonaktif" : "Disabled")}
                </span>
                <Switch
                  checked={Boolean(content?.enabled)}
                  onChange={(val) =>
                    onChange((prev) => ({
                      ...prev,
                      content: { ...prev?.content, enabled: val },
                    }))
                  }
                  ariaLabel="Toggle FAQ content block"
                />
              </div>
            </div>

            {/* List Toolbar: Counter, Hide/Show All, Presets, Search */}
            <div className="faq26-list-toolbar">
              <div className="faq26-toolbar-left">
                <span className="faq26-item-counter">
                  {filledCount}/{FAQ_ITEMS_COUNT} {isId ? "Terisi" : "Configured"}
                </span>
                <button
                  type="button"
                  onClick={expandAll}
                  className="faq26-action-link-btn"
                  title={isId ? "Buka Semua Pertanyaan" : "Expand All"}
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>{isId ? "Buka Semua" : "Expand All"}</span>
                </button>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="faq26-action-link-btn"
                  title={isId ? "Tutup Semua Pertanyaan" : "Collapse All"}
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>{isId ? "Tutup Semua" : "Collapse All"}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleApplyStandardTemplate}
                className="faq26-preset-btn"
                title={isId ? "Gunakan Template Standar TP Preneurs" : "Load TP Preneurs Standard Template"}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isId ? "Muat Template Standar" : "Insert Standard Template"}</span>
              </button>
            </div>

            {/* Search Input for Quick Finding */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isId ? "Cari pertanyaan dalam daftar..." : "Search questions..."}
                className="faq26-input pl-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Accordion Questions List */}
            <div className="faq26-accordion-list">
              {items.map((item, index) => {
                const isExpanded = expandedIndexes.has(index);
                const isFilled =
                  item.title.trim().length > 0 || item.description.trim().length > 0;

                // Match search query
                if (
                  searchQuery.trim() &&
                  !item.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
                  !item.description.toLowerCase().includes(searchQuery.toLowerCase())
                ) {
                  return null;
                }

                return (
                  <div
                    key={`faq-edit-item-${index}`}
                    className={`faq26-item ${isExpanded ? "is-expanded" : ""}`}
                  >
                    {/* Collapsible Header (Click to Hide / Show) */}
                    <div
                      className="faq26-item-header"
                      onClick={() => toggleItem(index)}
                    >
                      <div className="faq26-item-title-wrap">
                        <span className="faq26-item-num">#{index + 1}</span>
                        <span className="faq26-item-summary">
                          {item.title ||
                            (isId
                              ? `Pertanyaan FAQ #${index + 1} (Klik untuk menulis)`
                              : `FAQ Question #${index + 1} (Click to edit)`)}
                        </span>
                      </div>

                      <div className="faq26-item-controls">
                        <span
                          className={`faq26-status-chip ${
                            isFilled ? "is-active" : ""
                          }`}
                        >
                          {isFilled
                            ? isId
                              ? "Tampil"
                              : "Visible"
                            : isId
                            ? "Kosong"
                            : "Empty"}
                        </span>
                        <ChevronDown className="faq26-chevron" />
                      </div>
                    </div>

                    {/* Accordion Body (Form Controls) */}
                    {isExpanded && (
                      <div className="faq26-item-body">
                        <div className="faq26-field">
                          <label
                            htmlFor={`faq-title-input-${index}`}
                            className="faq26-label"
                          >
                            {isId
                              ? `Pertanyaan #${index + 1}`
                              : `Question #${index + 1}`}
                          </label>
                          <input
                            id={`faq-title-input-${index}`}
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              handleUpdateItem(index, "title", e.target.value)
                            }
                            placeholder={
                              isId
                                ? "Tuliskan pertanyaan di sini..."
                                : "Enter question headline..."
                            }
                            className="faq26-input"
                          />
                        </div>

                        <div className="faq26-field">
                          <label
                            htmlFor={`faq-desc-input-${index}`}
                            className="faq26-label"
                          >
                            {isId
                              ? `Jawaban / Penjelasan #${index + 1}`
                              : `Answer / Explanation #${index + 1}`}
                          </label>
                          <textarea
                            id={`faq-desc-input-${index}`}
                            value={item.description}
                            onChange={(e) =>
                              handleUpdateItem(index, "description", e.target.value)
                            }
                            placeholder={
                              isId
                                ? "Tuliskan jawaban yang ringkas dan jelas bagi pelanggan..."
                                : "Write a concise and helpful answer for customers..."
                            }
                            className="faq26-textarea"
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-400">
                            {isId
                              ? "Item kosong otomatis disembunyikan dari etalase publik."
                              : "Empty items are automatically hidden from the public storefront."}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              handleUpdateItem(index, "title", "");
                              handleUpdateItem(index, "description", "");
                            }}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{isId ? "Kosongkan" : "Clear"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: 1:1 Live Storefront Preview */}
        <div className="faq26-preview-shell">
          <div className="faq26-preview-controls">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#fe6f05]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isId ? "Pratinjau Etalase Langsung" : "Live Storefront Preview"}
              </span>
            </div>

            {/* Desktop / Mobile Device Selector */}
            <div className="faq26-device-selector">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`faq26-device-btn ${
                  previewDevice === "desktop" ? "is-active" : ""
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`faq26-device-btn ${
                  previewDevice === "mobile" ? "is-active" : ""
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div
            className={`faq26-preview-frame ${
              previewDevice === "mobile" ? "is-mobile" : ""
            }`}
          >
            {/* Header Mockup */}
            {pageHeader?.enabled ? (
              <header
                className={`faq26-storefront-header ${
                  pageHeader?.backgroundImageDataUrl ? "has-bg" : ""
                }`}
                style={
                  pageHeader?.backgroundImageDataUrl
                    ? {
                        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.65)), url(${pageHeader.backgroundImageDataUrl})`,
                      }
                    : undefined
                }
              >
                <div className="faq26-storefront-header-content">
                  <span className="faq26-storefront-badge">
                    {isId ? "PUSAT BANTUAN" : "HELP CENTER"}
                  </span>
                  <h1 className="faq26-storefront-title">
                    {pageHeader?.pageTitle || (isId ? "Tanya Jawab (FAQ)" : "FAQs")}
                  </h1>
                </div>
              </header>
            ) : null}

            {/* Body Simulation */}
            <div className="faq26-storefront-body">
              <div
                className={`faq26-sim-grid ${
                  leftColumn?.enabled && leftColumn?.leftImageDataUrl
                    ? "has-graphic"
                    : ""
                }`}
              >
                {/* Left Column Graphic if enabled */}
                {leftColumn?.enabled ? (
                  <div className="faq26-sim-graphic-box">
                    {leftColumn?.leftImageDataUrl ? (
                      <img
                        src={leftColumn.leftImageDataUrl}
                        alt="FAQ Visual"
                      />
                    ) : (
                      <span className="p-4 text-center text-xs text-slate-400">
                        {isId
                          ? "Ilustrasi Kolom Kiri Belum Diunggah"
                          : "Left Graphic Not Uploaded"}
                      </span>
                    )}
                  </div>
                ) : null}

                {/* FAQ Questions List Simulation */}
                {content?.enabled ? (
                  <div className="space-y-2">
                    {items.map((item, index) => {
                      if (!item.title.trim() && !item.description.trim()) {
                        return null;
                      }
                      const isOpen = previewOpenIndex === index;
                      return (
                        <div
                          key={`faq-sim-${index}`}
                          className="faq26-sim-accordion-item"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewOpenIndex((prev) =>
                                prev === index ? -1 : index
                              )
                            }
                            className="faq26-sim-question"
                          >
                            <span>{item.title}</span>
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform ${
                                isOpen ? "rotate-180 text-[#fe6f05]" : "text-slate-400"
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="faq26-sim-answer">
                              {item.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-rose-500">
                    {isId
                      ? "Blok daftar FAQ saat ini dinonaktifkan."
                      : "FAQ content list is currently disabled."}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="faq26-sticky-bar">
        <div className="faq26-sticky-inner">
          <div className="faq26-status-pill">
            <span className="faq26-status-dot" />
            <span>{statusLabel}</span>
          </div>

          <div className="faq26-action-btns">
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading || isSaving || isPublishing}
              className="faq26-btn-reset"
              title={isId ? "Atur ulang ke draf terakhir" : "Reset to last saved draft"}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isId ? "Atur Ulang" : "Reset Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => onSave({ publish: false })}
              disabled={isLoading || isSaving || isPublishing}
              className="faq26-btn-save"
            >
              <Save className="h-3.5 w-3.5 text-[#fe6f05]" />
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
              disabled={isLoading || isSaving || isPublishing}
              className="faq26-btn-publish"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>
                {isPublishing
                  ? isId
                    ? "Menerbitkan..."
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

