import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Monitor,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { uploadAdminImage } from "../../../lib/adminApi.js";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import StoreCustomizationSaveActions2026 from "./StoreCustomizationSaveActions2026.jsx";
import "./StoreCustomizationShopSettings2026.css";

const DEFAULT_SHOP_CONFIG = {
  header: {
    enabled: true,
    eyebrow: "KATALOG EDUPRENEUR KAMPUS",
    title: "Katalog Produk & Karya Inovasi,",
    titleAccent: "Edupreneur Kampus",
    description: "Temukan media belajar digital, buku, dan produk kreatif unggulan mahasiswa.",
    searchPlaceholder: "Cari produk, kategori, atau karya mahasiswa...",
    popularSearches: "Dapoer D'Sayang, White Florist, Picturestic, Reparasi Kursi, Kreasi Singkong",
    imageDataUrl: "",
  },
};

const SUGGESTED_PRESETS = [
  "Dapoer D'Sayang",
  "White Florist",
  "Picturestic",
  "Reparasi Kursi",
  "Kreasi Singkong",
];

export default function StoreCustomizationShopSettings2026({
  value,
  activeTab,
  onTabChange,
  onChange,
  onSave,
  onPublish,
  onPreview,
  isSaving,
  isPublishing,
  isLoading,
  meta = {},
  language = "en",
}) {
  const { i18n } = useTranslation();
  const isId = Boolean(
    i18n.language?.toLowerCase().startsWith("id") ||
    String(language || "").toLowerCase().startsWith("id")
  );

  const [previewMode, setPreviewMode] = useState("desktop");
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef(null);

  const draft = useMemo(() => {
    const raw = typeof value === "object" && value !== null ? value : {};
    return {
      ...DEFAULT_SHOP_CONFIG,
      ...raw,
      header: {
        ...DEFAULT_SHOP_CONFIG.header,
        ...(raw.header || {}),
      },
    };
  }, [value]);

  const updateHeader = (field, nextValue) => {
    onChange?.({
      ...draft,
      header: {
        ...draft.header,
        [field]: nextValue,
      },
    });
  };

  const parsedTags = useMemo(() => {
    const raw = String(draft.header?.popularSearches || "").trim();
    if (!raw) return [];
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [draft.header?.popularSearches]);

  const handleAddTag = (tagToAdd) => {
    const clean = String(tagToAdd || tagInput).trim();
    if (!clean) return;
    const exists = parsedTags.some((t) => t.toLowerCase() === clean.toLowerCase());
    if (exists) {
      setTagInput("");
      return;
    }
    const nextList = [...parsedTags, clean];
    updateHeader("popularSearches", nextList.join(", "));
    setTagInput("");
  };

  const handleRemoveTag = (tagToRemove) => {
    const nextList = parsedTags.filter((t) => t !== tagToRemove);
    updateHeader("popularSearches", nextList.join(", "));
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError(isId ? "Gunakan format JPG, PNG, atau WEBP." : "Use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(isId ? "Ukuran file maksimal 2MB." : "Max file size is 2MB.");
      return;
    }

    setIsUploading(true);
    setUploadError("");
    try {
      const result = await uploadAdminImage(file);
      const url = String(result?.url || result?.data?.url || "").trim();
      if (!url) throw new Error("Upload succeeded without image URL.");
      updateHeader("imageDataUrl", url);
    } catch (err) {
      // Fallback to data URL if direct upload fails
      try {
        const reader = new FileReader();
        reader.onload = () => updateHeader("imageDataUrl", reader.result);
        reader.readAsDataURL(file);
      } catch {
        setUploadError(err?.message || (isId ? "Gagal memproses gambar." : "Failed to process image."));
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="sc-shop-container text-slate-900 dark:text-slate-100">
      {/* Top Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {isId ? "Kustomisasi Toko" : "Store Customization"}
            </h1>
            <span className="sc-status-badge sc-status-ready">
              {isId ? "Halaman Toko (Shop)" : "Shop Page"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {isId
              ? "Kelola tampilan header, banner visual, judul beraksen, dan kata kunci pencarian katalog /shop."
              : "Manage header banner, accent titles, search placeholder, and popular keywords for /shop."}
          </p>
        </div>

        <StoreCustomizationSaveActions2026
          onSave={onSave}
          onPublish={onPublish}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isLoading={isLoading}
          meta={meta}
        />
      </header>

      {/* Tabs */}
      <StoreCustomizationTabNav2026 activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Form & Live Preview Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section 1: Header Banner Settings */}
          <div className="sc-shop-card">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/25 dark:text-blue-300">
                  <Store className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {isId ? "Header & Banner Halaman Toko" : "Shop Page Header & Banner"}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    https://tppreneurs.com/shop
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isId ? "Status Banner" : "Banner Status"}
                </span>
                <button
                  type="button"
                  aria-pressed={Boolean(draft.header?.enabled)}
                  onClick={() => updateHeader("enabled", !draft.header?.enabled)}
                  className={`sc-toggle-btn ${draft.header?.enabled ? "is-active" : ""}`}
                >
                  <span className="sc-toggle-thumb" />
                </button>
              </div>
            </div>

            {/* Banner Image Upload */}
            <div className="mb-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isId ? "Gambar Banner / Showcase Visual" : "Banner Showcase Visual"}
                </span>
                <span className="sc-shop-spec">1200×320 px • Maks 2MB</span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpeg,.jpg,.webp"
                className="hidden"
                disabled={isUploading}
                onChange={async (e) => {
                  await handleImageUpload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleImageUpload(e.dataTransfer?.files?.[0]);
                }}
                className="sc-shop-upload"
              >
                <UploadCloud className="h-8 w-8 text-[#034c85] dark:text-blue-400" />
                <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isUploading
                    ? (isId ? "Sedang mengunggah gambar..." : "Uploading image...")
                    : (isId ? "Tarik gambar ke sini atau klik untuk unggah" : "Drag images here or click to upload")}
                </span>
                <span className="mt-1 text-[11px] text-slate-400">
                  (JPG, PNG, WEBP)
                </span>
              </div>

              {uploadError ? (
                <p className="mt-2 text-xs font-semibold text-rose-600">{uploadError}</p>
              ) : null}

              {draft.header?.imageDataUrl ? (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={draft.header.imageDataUrl}
                      alt="Banner Preview"
                      className="h-12 w-28 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                    />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      {isId ? "Gambar banner terunggah" : "Uploaded banner image"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateHeader("imageDataUrl", "")}
                    className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>{isId ? "Hapus" : "Remove"}</span>
                  </button>
                </div>
              ) : null}
            </div>

            {/* Input Fields */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block min-w-0">
                  <span className="sc-shop-label">
                    <span>{isId ? "Teks Eyebrow / Label Atas" : "Eyebrow Text / Top Tag"}</span>
                  </span>
                  <input
                    type="text"
                    value={draft.header?.eyebrow || ""}
                    onChange={(e) => updateHeader("eyebrow", e.target.value)}
                    placeholder="KATALOG EDUPRENEUR KAMPUS"
                    className="sc-shop-input"
                  />
                </label>

                <label className="block min-w-0">
                  <div className="sc-shop-label">
                    <span>{isId ? "Aksen Judul (Warna Oranye)" : "Title Accent Word"}</span>
                    <span className="sc-shop-spec text-[#fe6f05] font-black">#FE6F05</span>
                  </div>
                  <input
                    type="text"
                    value={draft.header?.titleAccent || ""}
                    onChange={(e) => updateHeader("titleAccent", e.target.value)}
                    placeholder="Edupreneur Kampus"
                    className="sc-shop-input font-bold text-[#fe6f05]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="sc-shop-label">
                  <span>{isId ? "Judul Utama" : "Main Title"}</span>
                </span>
                <input
                  type="text"
                  value={draft.header?.title || ""}
                  onChange={(e) => updateHeader("title", e.target.value)}
                  placeholder="Katalog Produk & Karya Inovasi,"
                  className="sc-shop-input"
                />
              </label>

              <label className="block">
                <span className="sc-shop-label">
                  <span>{isId ? "Deskripsi Ringkas" : "Short Description"}</span>
                </span>
                <textarea
                  value={draft.header?.description || ""}
                  onChange={(e) => updateHeader("description", e.target.value)}
                  placeholder={isId ? "Temukan media belajar digital, buku, dan produk kreatif unggulan mahasiswa." : "Discover digital learning media, books, and student creative innovations."}
                  className="sc-shop-textarea"
                />
              </label>

              <label className="block">
                <span className="sc-shop-label">
                  <span>{isId ? "Placeholder Kolom Pencarian" : "Search Input Placeholder"}</span>
                </span>
                <input
                  type="text"
                  value={draft.header?.searchPlaceholder || ""}
                  onChange={(e) => updateHeader("searchPlaceholder", e.target.value)}
                  placeholder={isId ? "Cari produk, kategori, atau karya mahasiswa..." : "Search digital products, innovation works & books..."}
                  className="sc-shop-input"
                />
              </label>

              {/* Popular Searches Tag Manager */}
              <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {isId ? "Kata Kunci Pencarian Populer" : "Popular Search Keywords"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {parsedTags.length} {isId ? "kata kunci" : "keywords"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {parsedTags.map((tag) => (
                    <span key={tag} className="sc-shop-tag">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-rose-600 transition"
                        title={isId ? `Hapus ${tag}` : `Remove ${tag}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}

                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === ",") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      placeholder={isId ? "+ Kata kunci..." : "+ Add keyword..."}
                      className="h-7 w-28 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-800 outline-none focus:border-[#034c85] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddTag()}
                      className="inline-flex h-7 items-center gap-1 rounded-lg bg-[#034c85] px-2 text-[11px] font-bold text-white hover:bg-[#023863] transition"
                    >
                      <Plus className="h-3 w-3" />
                      <span>{isId ? "Tambah" : "Add"}</span>
                    </button>
                  </div>
                </div>

                {/* Preset suggestions */}
                <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-400">
                  <span>{isId ? "Saran Cepat:" : "Suggested:"}</span>
                  {SUGGESTED_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleAddTag(preset)}
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-[#034c85]/10 hover:text-[#034c85] dark:bg-slate-800 dark:text-slate-300 transition"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-Time Live Storefront Preview */}
        <div className="lg:col-span-5 space-y-4 sticky top-20">
          <div className="sc-shop-card">
            <div className="flex items-center justify-between mb-3 border-b border-slate-200 dark:border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#fe6f05]" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isId ? "Pratinjau Langsung Storefront" : "Live Storefront Preview"}
                </h3>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`inline-flex h-6 w-7 items-center justify-center rounded-md text-xs transition ${
                    previewMode === "desktop"
                      ? "bg-white text-[#034c85] shadow-sm font-bold dark:bg-slate-800 dark:text-blue-300"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Desktop View"
                >
                  <Monitor className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`inline-flex h-6 w-7 items-center justify-center rounded-md text-xs transition ${
                    previewMode === "mobile"
                      ? "bg-white text-[#034c85] shadow-sm font-bold dark:bg-slate-800 dark:text-blue-300"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                  title="Mobile View"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Mock Header Card in Deep Navy */}
            <div
              className={`sc-shop-preview-card transition-all ${
                previewMode === "mobile" ? "max-w-[340px] mx-auto text-center" : ""
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-200">
                  TP PRENEURS • SHOP
                </span>
                <span className="text-[10px] rounded-full bg-white/15 px-2 py-0.5 font-bold text-blue-200">
                  {draft.header?.enabled ? (isId ? "Banner Aktif" : "Banner Active") : (isId ? "Banner Nonaktif" : "Banner Hidden")}
                </span>
              </div>

              {draft.header?.enabled ? (
                <div className="space-y-3">
                  {/* Eyebrow & Titles */}
                  <div className="space-y-1">
                    {draft.header?.eyebrow ? (
                      <span className="inline-block rounded-full bg-[#fe6f05]/20 border border-[#fe6f05]/40 px-2.5 py-0.5 text-[9px] font-extrabold uppercase text-orange-200 tracking-wider">
                        {draft.header.eyebrow}
                      </span>
                    ) : null}

                    <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                      {draft.header?.title || "Katalog Produk & Karya Inovasi,"}{" "}
                      <span className="text-[#fe6f05]">
                        {draft.header?.titleAccent || "Edupreneur Kampus"}
                      </span>
                    </h2>

                    {draft.header?.description ? (
                      <p className="text-[11px] text-blue-100/90 line-clamp-2">
                        {draft.header.description}
                      </p>
                    ) : null}
                  </div>

                  {/* Banner Image Mock if present */}
                  {draft.header?.imageDataUrl ? (
                    <div className="h-20 w-full overflow-hidden rounded-xl border border-white/15">
                      <img
                        src={draft.header.imageDataUrl}
                        alt="Header Banner"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  {/* Mock Search Box */}
                  <div className="relative flex items-center rounded-xl bg-[#081427] border border-blue-400/25 p-1">
                    <Search className="h-4 w-4 ml-2.5 text-slate-400 shrink-0" />
                    <span className="px-2 text-xs text-slate-400 truncate flex-1 select-none">
                      {draft.header?.searchPlaceholder || "Cari produk, kategori, atau karya mahasiswa..."}
                    </span>
                    <button
                      type="button"
                      disabled
                      className="inline-flex h-7 items-center justify-center rounded-lg bg-[#fe6f05] px-3 text-[11px] font-black text-white shadow-sm"
                    >
                      {isId ? "Cari" : "Search"}
                    </button>
                  </div>

                  {/* Mock Popular Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-200">
                      <Zap className="h-3 w-3 text-[#fe6f05]" />
                      <span>{isId ? "Populer:" : "Popular:"}</span>
                    </span>
                    {parsedTags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white border border-white/10"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-blue-200/80">
                  {isId
                    ? "Banner header dinonaktifkan. Pengunjung akan langsung melihat filter & katalog produk."
                    : "Header banner is disabled. Shoppers will immediately see the catalog grid."}
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="text-[11px]">
                {isId ? "Tampilan sinkron 1:1 dengan halaman publik" : "1:1 synchronized storefront view"}
              </span>
              <button
                type="button"
                onClick={onPreview}
                className="inline-flex items-center gap-1 font-bold text-[#034c85] hover:underline dark:text-blue-400"
              >
                <span>/shop</span>
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Save Action Bar */}
      <footer className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <ShieldCheck className="h-4 w-4 text-[#034c85] dark:text-blue-400" />
          <span>
            {isId
              ? "Perubahan disimpan sebagai draf sampai Anda mengklik Terbitkan Draf."
              : "Changes are saved as draft until you click Publish Draft."}
          </span>
        </div>

        <StoreCustomizationSaveActions2026
          onSave={onSave}
          onPublish={onPublish}
          isSaving={isSaving}
          isPublishing={isPublishing}
          isLoading={isLoading}
          meta={meta}
        />
      </footer>
    </div>
  );
}

