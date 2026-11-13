import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowDown,
  ArrowUp,
  Award,
  BadgeCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Eye,
  GripVertical,
  HelpCircle,
  Leaf,
  MapPin,
  Monitor,
  PackageCheck,
  Plus,
  RefreshCw,
  Rocket,
  RotateCcw,
  Save,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import "./StoreCustomizationSingleSetting2026.css";

const DESCRIPTION_KEYS = [
  "descriptionOne",
  "descriptionTwo",
  "descriptionThree",
  "descriptionFour",
  "descriptionFive",
  "descriptionSix",
  "descriptionSeven",
];

const DEFAULT_ITEMS_EN = [
  {
    id: "free-shipping",
    title: "Free Shipping",
    message: "Free shipping applies to all orders over Rp100.000",
    icon: "truck",
    visible: true,
  },
  {
    id: "one-hour-delivery",
    title: "1-Hour Delivery",
    message: "Home delivery available within 1 hour for local orders",
    icon: "clock",
    visible: true,
  },
  {
    id: "cash-on-delivery",
    title: "Cash on Delivery",
    message: "Cash on Delivery (COD) available for selected regions",
    icon: "wallet",
    visible: true,
  },
  {
    id: "seven-day-returns",
    title: "7-Day Returns",
    message: "7-day money-back return policy for damaged items",
    icon: "returns",
    visible: true,
  },
  {
    id: "warranty-info",
    title: "Quality Guarantee",
    message: "Verified authentic local products from certified sellers",
    icon: "shield",
    visible: true,
  },
  {
    id: "organic",
    title: "100% Authentic & Fresh",
    message: "Guaranteed freshly prepared with high quality ingredients",
    icon: "leaf",
    visible: true,
  },
  {
    id: "pickup-point",
    title: "Store Pickup Option",
    message: "Direct self-pickup available at merchant physical branch",
    icon: "pin",
    visible: true,
  },
];

const DEFAULT_ITEMS_ID = [
  {
    id: "free-shipping",
    title: "Gratis Ongkir",
    message: "Bebas ongkos kirim untuk pesanan minimal Rp100.000",
    icon: "truck",
    visible: true,
  },
  {
    id: "one-hour-delivery",
    title: "Pengiriman Cepat",
    message: "Layanan kirim kilat tiba di hari yang sama untuk area lokal",
    icon: "clock",
    visible: true,
  },
  {
    id: "cash-on-delivery",
    title: "Bayar di Tempat (COD)",
    message: "Mendukung pembayaran tunai saat paket diterima di rumah",
    icon: "wallet",
    visible: true,
  },
  {
    id: "seven-day-returns",
    title: "Jaminan Retur 7 Hari",
    message: "Garansi retur dan pengembalian dana jika barang tidak sesuai",
    icon: "returns",
    visible: true,
  },
  {
    id: "warranty-info",
    title: "Jaminan Kualitas UMKM",
    message: "Produk orisinal langsung dari produsen UMKM terverifikasi",
    icon: "shield",
    visible: true,
  },
  {
    id: "organic",
    title: "Bahan Segar & Alami",
    message: "Diproduksi higienis dengan bahan baku berkualitas tinggi",
    icon: "leaf",
    visible: true,
  },
  {
    id: "pickup-point",
    title: "Ambil di Toko",
    message: "Bisa diambil langsung di gerai merchant tanpa antre",
    icon: "pin",
    visible: true,
  },
];

const DEFAULT_SUMMARY_LABELS_EN = [
  { id: "organic", title: "100% Authentic", icon: "shield", visible: true },
  { id: "fresh-natural", title: "Fresh & Natural", icon: "badge", visible: true },
  { id: "fast-delivery", title: "Fast Delivery", icon: "truck", visible: true },
];

const DEFAULT_SUMMARY_LABELS_ID = [
  { id: "organic", title: "100% Orisinal", icon: "shield", visible: true },
  { id: "fresh-natural", title: "Segar & Alami", icon: "badge", visible: true },
  { id: "fast-delivery", title: "Kirim Cepat", icon: "truck", visible: true },
];

const ICON_REGISTRY = {
  truck: { label: "Truk / Kurir", labelEn: "Truck / Shipping", icon: Truck },
  clock: { label: "Jam / Kilat", labelEn: "Clock / Express", icon: Clock },
  wallet: { label: "Dompet / COD", labelEn: "Wallet / COD", icon: Wallet },
  returns: { label: "Retur / Putar", labelEn: "Returns / Refund", icon: RotateCcw },
  shield: { label: "Perisai / Garansi", labelEn: "Shield / Guarantee", icon: ShieldCheck },
  leaf: { label: "Daun / Organik", labelEn: "Leaf / Natural", icon: Leaf },
  pin: { label: "Lokasi / Toko", labelEn: "Pin / Location", icon: MapPin },
  sparkles: { label: "Bintang / Spesial", labelEn: "Sparkles / Special", icon: Sparkles },
  badge: { label: "Lencana / Cek", labelEn: "Badge / Verified", icon: BadgeCheck },
  award: { label: "Medali / Terbaik", labelEn: "Award / Premium", icon: Award },
  package: { label: "Paket / Box", labelEn: "Package / Box", icon: PackageCheck },
};

const SUMMARY_ICON_KEYS = ["shield", "badge", "truck", "leaf", "sparkles", "award"];
const BENEFIT_ICON_KEYS = [
  "truck",
  "clock",
  "wallet",
  "returns",
  "shield",
  "leaf",
  "pin",
  "sparkles",
  "package",
];

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const normalizeItems = (rightBox, isId) => {
  const defaults = isId ? DEFAULT_ITEMS_ID : DEFAULT_ITEMS_EN;
  const source = isPlainObject(rightBox) ? rightBox : {};
  const sourceItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.benefitItems)
      ? source.benefitItems
      : [];

  if (sourceItems.length > 0) {
    return sourceItems.map((item, index) => {
      const fallback = defaults[index] || defaults[defaults.length - 1];
      return {
        ...fallback,
        ...(isPlainObject(item) ? item : {}),
        id: toText(item?.id, `${fallback.id}-${index}`),
        title: toText(item?.title ?? item?.label, fallback.title),
        message: toText(item?.message ?? item?.description ?? item?.text, fallback.message),
        icon: toText(item?.icon, fallback.icon),
        visible:
          typeof item?.visible === "boolean"
            ? item.visible
            : typeof item?.enabled === "boolean"
              ? item.enabled
              : fallback.visible,
      };
    });
  }

  return defaults.map((item, index) => {
    const legacyDesc = Array.isArray(source.descriptions) ? source.descriptions[index] : "";
    return {
      ...item,
      message: toText(legacyDesc, item.message),
    };
  });
};

const normalizeSummaryLabels = (rightBox, isId) => {
  const defaults = isId ? DEFAULT_SUMMARY_LABELS_ID : DEFAULT_SUMMARY_LABELS_EN;
  const source = isPlainObject(rightBox) ? rightBox : {};
  const sourceLabels = Array.isArray(source.summaryLabels)
    ? source.summaryLabels
    : Array.isArray(source.summary_labels)
      ? source.summary_labels
      : [];

  return defaults.map((fallback, index) => {
    const item = isPlainObject(sourceLabels[index]) ? sourceLabels[index] : {};
    return {
      ...fallback,
      ...item,
      id: toText(item.id, fallback.id),
      title: toText(item.title ?? item.label ?? item.text, fallback.title),
      icon: toText(item.icon, fallback.icon),
      visible:
        typeof item.visible === "boolean"
          ? item.visible
          : typeof item.enabled === "boolean"
            ? item.enabled
            : fallback.visible,
    };
  });
};

const normalizeValue = (value, isId) => {
  const page = isPlainObject(value) ? value : {};
  const rightBox = isPlainObject(page.rightBox)
    ? page.rightBox
    : isPlainObject(page.right_box)
      ? page.right_box
      : page;

  return {
    ...page,
    rightBox: {
      ...(isPlainObject(rightBox) ? rightBox : {}),
      enabled:
        typeof rightBox?.enabled === "boolean"
          ? rightBox.enabled
          : typeof rightBox?.isEnabled === "boolean"
            ? rightBox.isEnabled
            : true,
      items: normalizeItems(rightBox, isId),
      summaryLabels: normalizeSummaryLabels(rightBox, isId),
    },
  };
};

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className={`ps26-toggle-btn ${checked ? "is-active" : "is-inactive"}`}
    >
      <span className="ps26-toggle-knob" />
    </button>
  );
}

export default function StoreCustomizationSingleSetting2026({
  value,
  activeTab,
  onTabChange,
  onChange,
  onSave,
  onPublish,
  onReset,
  onPreview,
  isSaving,
  isPublishing,
  meta = {},
  isLoading = false,
}) {
  const { i18n } = useTranslation();
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));
  const [previewDevice, setPreviewDevice] = useState("desktop");

  const draft = useMemo(() => normalizeValue(value, isId), [value, isId]);
  const rightBox = draft.rightBox;
  const items = rightBox.items;
  const summaryLabels = rightBox.summaryLabels;
  const isBoxEnabled = Boolean(rightBox.enabled);

  const published =
    draft.status === "published" ||
    draft.publishStatus === "published" ||
    rightBox?.status === "published" ||
    rightBox?.publishStatus === "published";

  const emit = (nextRightBox) => {
    onChange?.({
      ...draft,
      status: "draft",
      publishStatus: "draft",
      rightBox: {
        ...nextRightBox,
        status: "draft",
        publishStatus: "draft",
        benefitItems: nextRightBox.items,
        descriptions: (nextRightBox.items || []).map((it) => it.message),
      },
    });
  };

  const setBoxEnabled = (enabled) => {
    emit({ ...rightBox, enabled });
  };

  const handleUpdateSummaryLabel = (index, field, val) => {
    const nextLabels = summaryLabels.map((lbl, idx) =>
      idx === index ? { ...lbl, [field]: val } : lbl
    );
    emit({ ...rightBox, summaryLabels: nextLabels });
  };

  const handleUpdateItem = (index, field, val) => {
    const nextItems = items.map((it, idx) => (idx === index ? { ...it, [field]: val } : it));
    emit({ ...rightBox, items: nextItems });
  };

  const handleAddItem = () => {
    const fallbackList = isId ? DEFAULT_ITEMS_ID : DEFAULT_ITEMS_EN;
    const template = fallbackList[items.length % fallbackList.length];
    const newItem = {
      id: `benefit-${Date.now()}`,
      title: isId ? `Keunggulan Baru ${items.length + 1}` : `New Highlight ${items.length + 1}`,
      message: isId ? "Deskripsi jaminan atau layanan..." : "Service guarantee description...",
      icon: template.icon || "shield",
      visible: true,
    };
    emit({ ...rightBox, items: [...items, newItem] });
  };

  const handleDeleteItem = (index) => {
    if (items.length <= 1) return;
    const nextItems = items.filter((_, idx) => idx !== index);
    emit({ ...rightBox, items: nextItems });
  };

  const handleDuplicateItem = (index) => {
    const source = items[index];
    if (!source) return;
    const duplicate = {
      ...source,
      id: `benefit-copy-${Date.now()}`,
      title: `${source.title} (${isId ? "Salinan" : "Copy"})`,
    };
    const nextItems = [...items.slice(0, index + 1), duplicate, ...items.slice(index + 1)];
    emit({ ...rightBox, items: nextItems });
  };

  const handleMoveItem = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const nextItems = [...items];
    const [moved] = nextItems.splice(from, 1);
    nextItems.splice(to, 0, moved);
    emit({ ...rightBox, items: nextItems });
  };

  const handleLoadPresets = () => {
    const presets = isId ? DEFAULT_ITEMS_ID : DEFAULT_ITEMS_EN;
    const labels = isId ? DEFAULT_SUMMARY_LABELS_ID : DEFAULT_SUMMARY_LABELS_EN;
    emit({
      ...rightBox,
      items: presets.map((it) => ({ ...it })),
      summaryLabels: labels.map((lb) => ({ ...lb })),
      enabled: true,
    });
  };

  const visibleSummaryCount = summaryLabels.filter((l) => l.visible).length;
  const visibleItemsCount = items.filter((it) => it.visible).length;

  return (
    <div className="ps26-container space-y-6 pb-20">
      {/* Top Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              {isId ? "Kustomisasi Toko" : "Store Customizations"}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                published ? "ps26-badge-navy" : "ps26-badge-orange"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${published ? "bg-[#034c85]" : "bg-[#fe6f05]"}`}
              />
              {published ? (isId ? "Diterbitkan" : "Published") : isId ? "Draf" : "Draft"}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
            {isId
              ? "Kelola tata letak konten, jaminan layanan, dan sorotan halaman detail produk."
              : "Configure content blocks, service guarantees, and product page highlights."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onPreview}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
          >
            <Eye className="h-4 w-4 text-[#034c85]" />
            <span>{isId ? "Pratinjau Toko" : "Preview Storefront"}</span>
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <StoreCustomizationTabNav2026 activeTab={activeTab} onTabChange={onTabChange} />

      {/* Main Settings Panel */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Form Editor */}
        <div className="space-y-6">
          {/* Master Toggle Card */}
          <section className="ps26-card p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white sm:text-lg">
                    {isId ? "Kotak Keunggulan & Jaminan Produk" : "Product Trust & Guarantee Box"}
                  </h2>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold ${
                      isBoxEnabled ? "ps26-badge-navy" : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    }`}
                  >
                    {isBoxEnabled ? (isId ? "AKTIF" : "ACTIVE") : isId ? "NONAKTIF" : "DISABLED"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Tampilkan label ringkas dan poin jaminan belanja pada halaman detail produk pembeli."
                    : "Display summary badges and trust highlights on the product page."}
                </p>
              </div>

              <Switch
                checked={isBoxEnabled}
                onChange={setBoxEnabled}
                ariaLabel={isId ? "Aktifkan kotak jaminan" : "Enable trust box"}
              />
            </div>
          </section>

          {/* Section 1: Summary Labels */}
          <section className="ps26-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isId ? "1. Label Ringkas Produk (Summary Labels)" : "1. Product Summary Badges"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "3 label ringkas yang tampil tepat di bawah tombol Beli Sekarang."
                    : "3 compact badges displayed directly below the Buy Now button."}
                </p>
              </div>
              <span className="ps26-badge-navy rounded-full px-2.5 py-0.5 text-xs font-bold">
                {visibleSummaryCount} / 3 {isId ? "Aktif" : "Active"}
              </span>
            </div>

            <div className="space-y-3">
              {summaryLabels.map((label, idx) => {
                const IconComp = ICON_REGISTRY[label.icon]?.icon || ShieldCheck;
                return (
                  <div
                    key={label.id || `lbl-${idx}`}
                    className="ps26-item-card flex flex-col gap-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex items-center gap-2.5 min-w-[130px]">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-sky-400">
                        <IconComp className="h-4 w-4" />
                      </div>
                      <div className="relative flex-1">
                        <select
                          value={label.icon}
                          onChange={(e) => handleUpdateSummaryLabel(idx, "icon", e.target.value)}
                          className="ps26-select text-xs font-semibold py-1.5"
                        >
                          {SUMMARY_ICON_KEYS.map((k) => (
                            <option key={k} value={k}>
                              {isId ? ICON_REGISTRY[k]?.label : ICON_REGISTRY[k]?.labelEn}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <input
                        type="text"
                        value={label.title}
                        maxLength={32}
                        placeholder={isId ? "Judul label..." : "Label title..."}
                        onChange={(e) => handleUpdateSummaryLabel(idx, "title", e.target.value)}
                        className="ps26-input text-xs font-bold"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <span className="text-[11px] font-semibold text-slate-500 sm:hidden">
                        {isId ? "Tampilkan" : "Visible"}
                      </span>
                      <Switch
                        checked={label.visible}
                        onChange={(val) => handleUpdateSummaryLabel(idx, "visible", val)}
                        ariaLabel={`Toggle label ${idx + 1}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: Benefit Items */}
          <section className="ps26-card p-5 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {isId ? "2. Poin Keunggulan & Jaminan Belanja" : "2. Trust & Guarantee Highlights"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Daftar jaminan layanan untuk meyakinkan pembeli berbelanja di toko."
                    : "Service value propositions to increase buyer confidence."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadPresets}
                  title={isId ? "Muat rekomendasi UMKM standar" : "Reset to default presets"}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
                  <span>{isId ? "Preset UMKM" : "Reset Presets"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#034c85] px-3 text-xs font-bold text-white shadow-sm hover:bg-[#023864]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{isId ? "Tambah Poin" : "Add Item"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => {
                const IconComp = ICON_REGISTRY[item.icon]?.icon || CheckCircle2;
                return (
                  <div key={item.id || `item-${index}`} className="ps26-item-card space-y-2.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 pb-2 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-200 text-[11px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          {index + 1}
                        </span>
                        <div className="relative">
                          <select
                            value={item.icon}
                            onChange={(e) => handleUpdateItem(index, "icon", e.target.value)}
                            className="ps26-select text-xs font-bold py-1 pl-7 pr-6 w-auto"
                          >
                            {BENEFIT_ICON_KEYS.map((k) => (
                              <option key={k} value={k}>
                                {isId ? ICON_REGISTRY[k]?.label : ICON_REGISTRY[k]?.labelEn}
                              </option>
                            ))}
                          </select>
                          <IconComp className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#034c85] dark:text-sky-400" />
                          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => handleMoveItem(index, index - 1)}
                          title={isId ? "Geser ke atas" : "Move up"}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 dark:border-white/10 dark:text-slate-400"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={index === items.length - 1}
                          onClick={() => handleMoveItem(index, index + 1)}
                          title={isId ? "Geser ke bawah" : "Move down"}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 dark:border-white/10 dark:text-slate-400"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          title={isId ? "Duplikat poin" : "Duplicate item"}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:text-[#034c85] dark:border-white/10 dark:text-slate-400"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(index)}
                          disabled={items.length <= 1}
                          title={isId ? "Hapus poin" : "Delete item"}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-30 dark:border-rose-900/50 dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="ml-1 pl-1 border-l border-slate-200 dark:border-white/10">
                          <Switch
                            checked={item.visible}
                            onChange={(val) => handleUpdateItem(index, "visible", val)}
                            ariaLabel={`Toggle item ${index + 1}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                      <div>
                        <input
                          type="text"
                          value={item.title}
                          maxLength={40}
                          placeholder={isId ? "Judul poin..." : "Item title..."}
                          onChange={(e) => handleUpdateItem(index, "title", e.target.value)}
                          className="ps26-input text-xs font-bold"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={item.message}
                          maxLength={120}
                          placeholder={isId ? "Deskripsi jaminan..." : "Guarantee message..."}
                          onChange={(e) => handleUpdateItem(index, "message", e.target.value)}
                          className="ps26-input text-xs text-slate-600 dark:text-slate-300"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Right Column: Realistic 1:1 Live Preview */}
        <div className="space-y-4">
          <section className="ps26-card p-5 sticky top-20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-white/10">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  {isId ? "Pratinjau Etalase Langsung" : "Live Storefront Preview"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isId
                    ? "Simulasi 1:1 tampilan produk pada etalase toko."
                    : "1:1 real-time simulation on the customer storefront."}
                </p>
              </div>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setPreviewDevice("desktop")}
                  title={isId ? "Mode Desktop" : "Desktop View"}
                  className={`flex h-7 w-8 items-center justify-center rounded-lg text-xs transition ${
                    previewDevice === "desktop"
                      ? "bg-white text-[#034c85] font-bold shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Monitor className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice("mobile")}
                  title={isId ? "Mode Ponsel" : "Mobile View"}
                  className={`flex h-7 w-8 items-center justify-center rounded-lg text-xs transition ${
                    previewDevice === "mobile"
                      ? "bg-white text-[#034c85] font-bold shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Smartphone className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mockup Frame */}
            <div
              className={`ps26-preview-frame transition-all duration-300 ${
                previewDevice === "mobile" ? "mx-auto max-w-[340px]" : "w-full"
              }`}
            >
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 space-y-4">
                {/* Mockup Product Header */}
                <div className="flex gap-3">
                  <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 dark:border-white/10 dark:bg-slate-800">
                    <ShoppingBag className="h-8 w-8 text-slate-300 dark:text-slate-600" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="inline-block text-[11px] font-extrabold text-[#fe6f05] uppercase">
                      Kreasi Singkong Keju
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      Kue Singkong Keju Lumer Crispy
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>5.0</span>
                      <span className="text-slate-400 font-normal">• 48 terjual</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-[#034c85] dark:text-sky-400">
                        Rp 25.000
                      </span>
                      <span className="rounded bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-600">
                        -20%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mock CTA Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl border-2 border-[#034c85] text-xs font-black text-[#034c85] dark:border-sky-400 dark:text-sky-400"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{isId ? "+ Keranjang" : "Add to Cart"}</span>
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[#fe6f05] text-xs font-black text-white shadow-sm"
                  >
                    <span>{isId ? "Beli Sekarang" : "Buy Now"}</span>
                  </button>
                </div>

                {/* Live Summary Badges Preview */}
                {isBoxEnabled && visibleSummaryCount > 0 ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      {isId ? "Label Ringkas Produk:" : "Product Summary Badges:"}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {summaryLabels
                        .filter((lbl) => lbl.visible && lbl.title)
                        .map((lbl, i) => {
                          const IconComp = ICON_REGISTRY[lbl.icon]?.icon || CheckCircle2;
                          return (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                            >
                              <IconComp className="h-3.5 w-3.5 text-[#034c85] dark:text-sky-400 shrink-0" />
                              <span>{lbl.title}</span>
                            </span>
                          );
                        })}
                    </div>
                  </div>
                ) : null}

                {/* Live Benefit Items Preview */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {isId ? "Jaminan & Layanan Toko:" : "Store Service Guarantees:"}
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">
                      {visibleItemsCount} {isId ? "Poin Aktif" : "Active Items"}
                    </span>
                  </div>

                  {isBoxEnabled ? (
                    <div className="space-y-2 rounded-xl border border-slate-200/80 bg-slate-50/50 p-2.5 dark:border-white/5 dark:bg-slate-800/40">
                      {items
                        .filter((it) => it.visible)
                        .map((it, idx) => {
                          const IconComp = ICON_REGISTRY[it.icon]?.icon || ShieldCheck;
                          return (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/30 dark:text-sky-400">
                                <IconComp className="h-2.5 w-2.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="font-bold text-slate-800 dark:text-slate-200">
                                  {it.title || (isId ? "Judul poin" : "Item title")}
                                </span>
                                {it.message ? (
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                                    {it.message}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 p-3 text-center text-xs text-slate-400 dark:border-white/10">
                      {isId
                        ? "Kotak keunggulan & jaminan sedang dinonaktifkan."
                        : "Trust & guarantee box is currently disabled."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <footer className="ps26-sticky-bar">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#fe6f05] animate-pulse" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {isId
              ? `${visibleSummaryCount} Label & ${visibleItemsCount} Poin Aktif`
              : `${visibleSummaryCount} Badges & ${visibleItemsCount} Items Active`}
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || isPublishing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{isId ? "Reset ke Awal" : "Reset Default"}</span>
          </button>

          <button
            type="button"
            onClick={() => onSave?.({ publish: false })}
            disabled={isSaving || isPublishing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 text-xs font-black text-slate-800 shadow-sm hover:border-[#034c85] hover:text-[#034c85] disabled:opacity-50 dark:border-white/15 dark:bg-slate-900 dark:text-white"
          >
            <Save className="h-3.5 w-3.5 text-slate-500" />
            <span>{isSaving ? (isId ? "Menyimpan..." : "Saving...") : isId ? "Simpan Draf" : "Save Draft"}</span>
          </button>

          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving || isPublishing}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#034c85] px-4 text-xs font-black text-white shadow-sm hover:bg-[#023864] disabled:opacity-50"
          >
            <Rocket className="h-3.5 w-3.5 text-[#fe6f05]" />
            <span>{isPublishing ? (isId ? "Menerbitkan..." : "Publishing...") : isId ? "Publikasikan" : "Publish Draft"}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
