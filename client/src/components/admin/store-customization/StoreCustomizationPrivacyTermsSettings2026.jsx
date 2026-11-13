import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  FileText,
  Upload,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  RotateCcw,
  RotateCw,
  Sparkles,
  Monitor,
  Smartphone,
  Eye,
  Save,
  Rocket,
  CheckCircle2,
  ExternalLink,
  Heading2,
  Heading3,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import { sanitizeRichTextHtml } from "../../../utils/sanitizeRichTextHtml.js";
import "./StoreCustomizationPrivacyTermsSettings2026.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

// Official TP Preneurs Standard Legal Templates
const TP_TEMPLATES = {
  privacy: {
    en: [
      "<h3>1. User Consent & Acceptance</h3>",
      "<p>By accessing, registering, or shopping on the TP Preneurs marketplace, you consent to the collection, processing, and lawful handling of your information as outlined in this Privacy Policy to ensure reliable order fulfillment and support services.</p>",
      "<h3>2. Information We Collect</h3>",
      "<p>We may collect account credentials, full name, institutional affiliation (if applicable), billing and shipping addresses, telephone numbers, and transaction metadata required to process educational products and services.</p>",
      "<h3>3. How We Use Your Data</h3>",
      "<ol>",
      "<li>To verify buyer and vendor identity and maintain workspace security.</li>",
      "<li>To process, deliver, and track orders across multi-vendor logistics.</li>",
      "<li>To prevent fraudulent payments and secure checkout transactions.</li>",
      "<li>To deliver personalized learning media and product recommendations.</li>",
      "<li>To comply with Indonesian commerce and data protection regulations.</li>",
      "</ol>",
      "<h3>4. Data Protection & Safeguards</h3>",
      "<p>We implement rigorous organizational and technical security safeguards to shield your data against unauthorized access, loss, alteration, or unlawful disclosure.</p>",
      "<h3>5. User Rights & Inquiries</h3>",
      "<p>You hold the right to review, update, or request erasure of your personal data at any time by contacting our official support desk at support@tppreneurs.com.</p>",
    ].join(""),
    id: [
      "<h3>1. Persetujuan & Penerimaan Pengguna</h3>",
      "<p>Dengan mengakses, mendaftar, atau berbelanja di marketplace TP Preneurs, Anda menyetujui pengumpulan, pengelolaan, dan pemrosesan data pribadi Anda sebagaimana dijelaskan dalam Kebijakan Privasi ini demi kelancaran transaksi dan layanan pelanggan.</p>",
      "<h3>2. Informasi yang Kami Kumpulkan</h3>",
      "<p>Kami dapat mengumpulkan identitas akun, nama lengkap, afiliasi institusi/kampus, alamat penagihan dan pengiriman, nomor kontak, serta bukti pembayaran yang diperlukan untuk memproses produk dan media pembelajaran digital.</p>",
      "<h3>3. Penggunaan Informasi Pribadi</h3>",
      "<ol>",
      "<li>Memverifikasi identitas pembeli dan penjual serta menjaga keamanan akun.</li>",
      "<li>Memproses, mengirimkan, dan melacak status pesanan secara akurat.</li>",
      "<li>Mencegah penipuan serta menjamin keamanan transaksi pembayaran multi-vendor.</li>",
      "<li>Menyediakan rekomendasi karya kreatif dan edupreneur yang relevan.</li>",
      "<li>Memenuhi ketentuan hukum perlindungan data yang berlaku di Indonesia.</li>",
      "</ol>",
      "<h3>4. Perlindungan & Keamanan Data</h3>",
      "<p>Kami menerapkan enkripsi dan prosedur operasional ketat untuk melindungi data pribadi Anda dari akses tidak sah, kebocoran, modifikasi, atau penyalahgunaan data.</p>",
      "<h3>5. Hak Pengguna & Layanan Bantuan</h3>",
      "<p>Anda berhak meninjau, memperbarui, atau mengajukan permohonan penghapusan data pribadi Anda kapan saja dengan menghubungi tim bantuan resmi di support@tppreneurs.com.</p>",
    ].join(""),
  },
  terms: {
    en: [
      "<h2>Terms of Service & Marketplace Agreement</h2>",
      "<p>Welcome to TP Preneurs. These terms and conditions govern your access to and use of TP Preneurs platform, catalog, checkout services, and vendor interactions.</p>",
      "<h3>1. Account & Membership</h3>",
      "<p>Users must provide accurate account information and maintain confidential login credentials. You are responsible for all activities conducted under your verified account.</p>",
      "<h3>2. Purchases & Payment Verification</h3>",
      "<p>All orders placed through TP Preneurs are subject to product availability and payment verification. Pricing and delivery estimates are specified clearly prior to checkout.</p>",
      "<h3>3. Intellectual Property</h3>",
      "<p>All trademarks, digital products, course materials, logos, and software interfaces displayed on TP Preneurs belong to their respective creators and TP Preneurs licensors. Unauthorized duplication or redistribution is strictly prohibited.</p>",
      "<h3>4. Merchant & Buyer Conduct</h3>",
      "<p>Buyers and vendors agree to conduct all transactions ethically, without fraudulent representations, harassment, or violation of applicable educational commerce laws.</p>",
      "<h3>5. Service Modifications & Disclaimer</h3>",
      "<p>TP Preneurs reserves the right to modify services, policies, or fee structures with prior notice. To the extent permissible by law, platform services are provided on an 'as-is' and 'as-available' basis.</p>",
    ].join(""),
    id: [
      "<h2>Ketentuan Layanan & Perjanjian Marketplace</h2>",
      "<p>Selamat datang di TP Preneurs. Syarat dan ketentuan ini mengatur penggunaan platform, proses belanja, transaksi toko, dan interaksi antara pembeli serta penjual.</p>",
      "<h3>1. Pendaftaran Akun & Keanggotaan</h3>",
      "<p>Pengguna wajib memberikan data yang valid saat mendaftar dan bertanggung jawab penuh atas kerahasiaan kredensial serta aktivitas akun masing-masing.</p>",
      "<h3>2. Pesanan & Verifikasi Pembayaran</h3>",
      "<p>Setiap transaksi diproses sesuai ketersediaan stok produk dan verifikasi pembayaran. Rincian ongkos kirim dan estimasi pengiriman tertera secara transparan sebelum checkout.</p>",
      "<h3>3. Hak Kekayaan Intelektual</h3>",
      "<p>Seluruh materi, produk digital, karya inovasi edupreneur, dan merek dagang di TP Preneurs dilindungi undang-undang hak cipta. Dilarang keras menduplikasi atau mendistribusikan tanpa izin tertulis.</p>",
      "<h3>4. Etika Penjual dan Pembeli</h3>",
      "<p>Pembeli dan penjual wajib mematuhi ketentuan jual-beli yang jujur, tidak melakukan transaksi palsu, dan menaati regulasi perdagangan elektronik di Indonesia.</p>",
      "<h3>5. Ketentuan Tambahan & Batasan Tanggung Jawab</h3>",
      "<p>TP Preneurs berhak memperbarui ketentuan layanan sewaktu-waktu demi peningkatan mutu ekosistem dengan pemberitahuan melalui platform resmi.</p>",
    ].join(""),
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
      className={`pt26-toggle-btn ${checked ? "is-active" : "is-inactive"}`}
    >
      <span className="pt26-toggle-knob" />
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
    <div className="pt26-field">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="pt26-label">
          {label}
        </label>
        <span className="pt26-dropzone-badge">
          {isId ? "1920x400 • Maks 5MB" : "1920x400 • Max 5MB"}
        </span>
      </div>

      {value ? (
        <div className="pt26-img-preview-box">
          <img src={value} alt="Banner Preview" />
          <button
            type="button"
            onClick={onRemove}
            className="pt26-img-remove-btn"
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
          className="pt26-dropzone"
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
              {isId ? "Klik atau seret gambar banner ke sini" : "Click or drag header banner image here"}
            </p>
            <p className="text-[11px] text-slate-400">
              {isId ? "Mendukung format JPG, PNG, WEBP (Maksimal 5MB)" : "Supports JPG, PNG, WEBP (Max 5MB)"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ModernPolicyEditor({
  value,
  onChange,
  onApplyTemplate,
  isId,
  policyType,
}) {
  const editorRef = useRef(null);
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const nextHtml = value || "<p></p>";
    if (currentHtml !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [value]);

  const emitChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const applyCmd = (command, val = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    emitChange();
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    applyCmd("createLink", linkUrl.trim());
    setLinkUrl("");
    setShowLinkBar(false);
  };

  return (
    <div className="pt26-editor-container">
      <div className="pt26-editor-toolbar">
        <button
          type="button"
          onClick={() => applyCmd("formatBlock", "<h2>")}
          className="pt26-tool-btn"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("formatBlock", "<h3>")}
          className="pt26-tool-btn"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <span className="pt26-tool-divider" />
        <button
          type="button"
          onClick={() => applyCmd("bold")}
          className="pt26-tool-btn"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("italic")}
          className="pt26-tool-btn"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("underline")}
          className="pt26-tool-btn"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </button>
        <span className="pt26-tool-divider" />
        <button
          type="button"
          onClick={() => applyCmd("insertUnorderedList")}
          className="pt26-tool-btn"
          title={isId ? "Daftar Poin" : "Bullet List"}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("insertOrderedList")}
          className="pt26-tool-btn"
          title={isId ? "Daftar Nomor" : "Numbered List"}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowLinkBar(!showLinkBar)}
          className={`pt26-tool-btn ${showLinkBar ? "bg-slate-200 dark:bg-slate-700" : ""}`}
          title={isId ? "Sisipkan Tautan" : "Insert Link"}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <span className="pt26-tool-divider" />
        <button
          type="button"
          onClick={() => applyCmd("undo")}
          className="pt26-tool-btn"
          title={isId ? "Urungkan (Ctrl+Z)" : "Undo (Ctrl+Z)"}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("redo")}
          className="pt26-tool-btn"
          title={isId ? "Ulangi (Ctrl+Y)" : "Redo (Ctrl+Y)"}
        >
          <RotateCw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onApplyTemplate}
          className="pt26-template-btn"
          title={
            isId
              ? "Gunakan Template Standar TP Preneurs"
              : "Insert TP Preneurs Standard Template"
          }
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isId ? "Muat Template Standar" : "Insert Standard Template"}</span>
        </button>
      </div>

      {showLinkBar && (
        <div className="pt26-link-bar">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://tppreneurs.com/page"
            className="pt26-link-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyLink();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="pt26-link-apply-btn"
          >
            {isId ? "Terapkan" : "Apply Link"}
          </button>
          <button
            type="button"
            onClick={() => setShowLinkBar(false)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400"
          >
            ✕
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        className="pt26-editor-content focus:outline-none"
      />
    </div>
  );
}

export default function StoreCustomizationPrivacyTermsSettings2026({
  privacyPolicy,
  termsAndConditions,
  activeTab,
  onTabChange,
  onChangePolicy,
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

  // Sub-document switcher: "privacy" | "terms"
  const [subDoc, setSubDoc] = useState("privacy");

  // Device switcher for preview: "desktop" | "mobile"
  const [previewDevice, setPreviewDevice] = useState("desktop");

  const activePolicyData = subDoc === "privacy" ? privacyPolicy : termsAndConditions;
  const policyKey = subDoc === "privacy" ? "privacyPolicy" : "termsAndConditions";

  const isBlockEnabled = Boolean(activePolicyData?.enabled);
  const pageTitle = toText(
    activePolicyData?.pageTitle,
    subDoc === "privacy"
      ? isId
        ? "Kebijakan Privasi"
        : "Privacy Policy"
      : isId
      ? "Syarat & Ketentuan"
      : "Terms & Conditions"
  );
  const headerBg = toText(activePolicyData?.pageHeaderBackgroundDataUrl, "");
  const pageHtml = toText(activePolicyData?.pageTextHtml, "");

  const safePreviewHtml = useMemo(() => {
    return sanitizeRichTextHtml(pageHtml);
  }, [pageHtml]);

  const handleApplyTemplate = () => {
    const langKey = isId ? "id" : "en";
    const templateText = TP_TEMPLATES[subDoc][langKey];
    onChangePolicy(policyKey, "pageTextHtml", templateText);
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

  return (
    <div className="pt26-wrap">
      {/* Top Header & Integrated Tab Navigation */}
      <div className="pt26-header-bar">
        <div className="pt26-header-top">
          <div className="pt26-title-group">
            <div className="pt26-title-icon">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="pt26-title">
                {isId
                  ? "Kustomisasi Privasi & Syarat Ketentuan"
                  : "Privacy & Terms Customization"}
              </h1>
              <p className="pt26-subtitle">
                {isId
                  ? "Kelola konten hukum, kebijakan data, dan ketentuan platform TP Preneurs."
                  : "Manage legal content, data privacy safeguards, and TP Preneurs marketplace terms."}
              </p>
            </div>
          </div>

          {/* Sub-document Switcher Segmented Pills */}
          <div className="pt26-subnav">
            <button
              type="button"
              onClick={() => setSubDoc("privacy")}
              className={`pt26-subnav-btn ${subDoc === "privacy" ? "is-active" : ""}`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isId ? "Kebijakan Privasi" : "Privacy Policy"}</span>
              <span className="pt26-subnav-badge">
                {privacyPolicy?.enabled ? (isId ? "Aktif" : "Active") : (isId ? "Nonaktif" : "Off")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubDoc("terms")}
              className={`pt26-subnav-btn ${subDoc === "terms" ? "is-active" : ""}`}
            >
              <FileText className="h-4 w-4" />
              <span>{isId ? "Syarat & Ketentuan" : "Terms & Conditions"}</span>
              <span className="pt26-subnav-badge">
                {termsAndConditions?.enabled ? (isId ? "Aktif" : "Active") : (isId ? "Nonaktif" : "Off")}
              </span>
            </button>
          </div>
        </div>

        {/* Global Store Customization Tab Navigation */}
        <StoreCustomizationTabNav2026
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* Main Form & Preview Grid */}
      <div className="pt26-grid">
        {/* Left Column: Form Controls */}
        <div className="flex flex-col gap-5">
          {/* Section Card: Header Banner & Status */}
          <div className="pt26-card">
            <div className="pt26-card-header">
              <div className="pt26-card-title-group">
                <div className="pt26-card-icon">
                  {subDoc === "privacy" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="pt26-card-heading">
                    {subDoc === "privacy"
                      ? isId
                        ? "Header & Pengaturan Privasi"
                        : "Privacy Policy Header & Status"
                      : isId
                      ? "Header & Pengaturan Syarat Ketentuan"
                      : "Terms & Conditions Header & Status"}
                  </h2>
                  <p className="pt26-card-subheading">
                    {isId
                      ? "Atur visibilitas halaman, judul hero, dan latar belakang visual."
                      : "Configure page visibility, hero headline, and banner visual."}
                  </p>
                </div>
              </div>

              {/* Master Block Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isBlockEnabled ? (isId ? "Aktif" : "Enabled") : (isId ? "Nonaktif" : "Disabled")}
                </span>
                <Switch
                  checked={isBlockEnabled}
                  onChange={(val) => onChangePolicy(policyKey, "enabled", val)}
                  ariaLabel="Toggle policy block"
                />
              </div>
            </div>

            {/* Page Title Field */}
            <div className="pt26-field">
              <label htmlFor="pt26-page-title" className="pt26-label">
                {isId ? "Judul Halaman (Page Title)" : "Page Title"}
              </label>
              <input
                id="pt26-page-title"
                type="text"
                value={activePolicyData?.pageTitle ?? ""}
                onChange={(e) =>
                  onChangePolicy(policyKey, "pageTitle", e.target.value)
                }
                placeholder={
                  subDoc === "privacy"
                    ? isId
                      ? "Kebijakan Privasi"
                      : "Privacy Policy"
                    : isId
                    ? "Syarat & Ketentuan"
                    : "Terms & Conditions"
                }
                className="pt26-input"
              />
            </div>

            {/* Banner Background Upload */}
            <ImageUploadDropzone
              id={`pt26-bg-${subDoc}`}
              label={
                isId
                  ? "Gambar Latar Banner Header (Opsional)"
                  : "Page Header Background Banner (Optional)"
              }
              value={headerBg}
              onChange={(dataUrl) =>
                onChangePolicy(policyKey, "pageHeaderBackgroundDataUrl", dataUrl)
              }
              onRemove={() =>
                onChangePolicy(policyKey, "pageHeaderBackgroundDataUrl", "")
              }
              isId={isId}
            />
          </div>

          {/* Section Card: Rich Text Content Editor */}
          <div className="pt26-card">
            <div className="pt26-card-header">
              <div className="pt26-card-title-group">
                <div className="pt26-card-icon">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="pt26-card-heading">
                    {isId ? "Isi Dokumen Kebijakan" : "Document Legal Content"}
                  </h2>
                  <p className="pt26-card-subheading">
                    {isId
                      ? "Format teks isi dengan heading, poin daftar, dan tautan resmi."
                      : "Format body text with headings, structured bullet points, and hyperlinks."}
                  </p>
                </div>
              </div>

              {/* Direct Storefront Public Link Button */}
              <a
                href={subDoc === "privacy" ? "/privacy-policy" : "/terms-and-conditions"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <span>{isId ? "Buka Halaman" : "Open Live Page"}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#fe6f05]" />
              </a>
            </div>

            <ModernPolicyEditor
              value={pageHtml}
              onChange={(nextHtml) =>
                onChangePolicy(policyKey, "pageTextHtml", nextHtml)
              }
              onApplyTemplate={handleApplyTemplate}
              isId={isId}
              policyType={subDoc}
            />
          </div>
        </div>

        {/* Right Column: 1:1 Live Storefront Preview */}
        <div className="pt26-preview-shell">
          <div className="pt26-preview-controls">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#fe6f05]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isId ? "Pratinjau Etalase Langsung" : "Live Storefront Preview"}
              </span>
            </div>

            {/* Desktop / Mobile Device Selector */}
            <div className="pt26-device-selector">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`pt26-device-btn ${previewDevice === "desktop" ? "is-active" : ""}`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`pt26-device-btn ${previewDevice === "mobile" ? "is-active" : ""}`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div
            className={`pt26-preview-frame ${
              previewDevice === "mobile" ? "is-mobile" : ""
            }`}
          >
            {/* Header Mockup */}
            <header
              className={`pt26-storefront-header ${headerBg ? "has-bg" : ""}`}
              style={
                headerBg
                  ? {
                      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.65)), url(${headerBg})`,
                    }
                  : undefined
              }
            >
              <div className="pt26-storefront-header-content">
                <span className="pt26-storefront-badge">
                  {subDoc === "privacy" ? "TP PRENEURS PRIVACY" : "TP PRENEURS TERMS"}
                </span>
                <h1 className="pt26-storefront-title">{pageTitle}</h1>
              </div>
            </header>

            {/* Body Content Simulation */}
            {!isBlockEnabled ? (
              <div className="pt26-storefront-disabled-banner">
                {isId
                  ? "Halaman ini saat ini sedang dinonaktifkan dari etalase publik."
                  : "This page is currently marked as disabled and hidden from public visitors."}
              </div>
            ) : safePreviewHtml.trim() ? (
              <div
                className="pt26-storefront-body prose prose-slate max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                {isId
                  ? "Belum ada teks isi yang ditulis. Gunakan editor di sebelah kiri untuk mengisi konten."
                  : "No content entered yet. Use the editor on the left to write policy content."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="pt26-sticky-bar">
        <div className="pt26-sticky-inner">
          <div className="pt26-status-pill">
            <span className="pt26-status-dot" />
            <span>{statusLabel}</span>
          </div>

          <div className="pt26-action-btns">
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading || isSaving || isPublishing}
              className="pt26-btn-reset"
              title={isId ? "Atur ulang ke draf terakhir" : "Reset to last saved draft"}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isId ? "Atur Ulang" : "Reset Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => onSave({ publish: false })}
              disabled={isLoading || isSaving || isPublishing}
              className="pt26-btn-save"
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
              className="pt26-btn-publish"
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

