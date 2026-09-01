import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Edit3,
  Eye,
  GripVertical,
  Leaf,
  MapPin,
  Monitor,
  PackageCheck,
  Plus,
  RefreshCcw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";

const DESCRIPTION_KEYS = [
  "descriptionOne",
  "descriptionTwo",
  "descriptionThree",
  "descriptionFour",
  "descriptionFive",
  "descriptionSix",
  "descriptionSeven",
];

const DEFAULT_ITEMS = [
  {
    id: "free-shipping",
    title: "Free Shipping",
    message: "Free shipping applies to all orders over shipping 100",
    icon: "truck",
    tone: "positive",
    visible: true,
  },
  {
    id: "one-hour-delivery",
    title: "1-Hour Delivery",
    message: "Home Delivery within 1 Hour",
    icon: "clock",
    tone: "positive",
    visible: true,
  },
  {
    id: "cash-on-delivery",
    title: "Cash on Delivery",
    message: "Cash on Delivery Available",
    icon: "wallet",
    tone: "neutral",
    visible: true,
  },
  {
    id: "seven-day-returns",
    title: "7-Day Returns",
    message: "7 Days returns money back guarantee",
    icon: "returns",
    tone: "neutral",
    visible: true,
  },
  {
    id: "warranty-info",
    title: "Warranty Info",
    message: "Warranty not available for this item",
    icon: "shield",
    tone: "neutral",
    visible: true,
  },
  {
    id: "organic",
    title: "100% Organic",
    message: "Guaranteed 100% organic from natural products.",
    icon: "leaf",
    tone: "positive",
    visible: true,
  },
  {
    id: "pickup-point",
    title: "Pickup Point Delivery",
    message: "Delivery from our pick point Boho One, Bridge Street West, Middlesbrough.",
    icon: "pin",
    tone: "neutral",
    visible: true,
  },
];

const TAB_ITEMS = [
  { key: "home", label: "Home Page" },
  { key: "productSlugPage", label: "Product Slug Page" },
  { key: "aboutUs", label: "About Us" },
  { key: "privacyPolicyTerms", label: "Privacy Policy & T&C" },
  { key: "faqs", label: "FAQs" },
  { key: "offers", label: "Offers" },
  { key: "contactUs", label: "Contact Us" },
  { key: "checkout", label: "Checkout" },
  { key: "dashboardSetting", label: "Dashboard Setting" },
  { key: "seoSettings", label: "SEO Settings" },
];

const ICON_OPTIONS = [
  { key: "truck", label: "Truck", icon: Truck },
  { key: "clock", label: "Clock", icon: PackageCheck },
  { key: "wallet", label: "Wallet", icon: Wallet },
  { key: "returns", label: "Returns", icon: RotateCcw },
  { key: "shield", label: "Shield", icon: ShieldCheck },
  { key: "leaf", label: "Leaf", icon: Leaf },
  { key: "pin", label: "Pin", icon: MapPin },
  { key: "sparkles", label: "Sparkles", icon: Sparkles },
];

const TONE_OPTIONS = [
  { key: "positive", label: "Positive", dot: "bg-emerald-500" },
  { key: "neutral", label: "Neutral", dot: "bg-amber-400" },
  { key: "info", label: "Info", dot: "bg-sky-500" },
];

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getIconMeta = (key) =>
  ICON_OPTIONS.find((item) => item.key === key) || ICON_OPTIONS[ICON_OPTIONS.length - 1];

const getToneMeta = (key) =>
  TONE_OPTIONS.find((item) => item.key === key) || TONE_OPTIONS[1];

const readLegacyDescriptions = (source) =>
  DEFAULT_ITEMS.map((fallback, index) => {
    const arrayValue = Array.isArray(source?.descriptions) ? source.descriptions[index] : "";
    const legacyValue = source?.[DESCRIPTION_KEYS[index]];
    return toText(arrayValue || legacyValue, fallback.message);
  });

const normalizeItems = (rightBox) => {
  const source = isPlainObject(rightBox) ? rightBox : {};
  const sourceItems = Array.isArray(source.items)
    ? source.items
    : Array.isArray(source.benefitItems)
      ? source.benefitItems
      : [];
  const legacyDescriptions = readLegacyDescriptions(source);

  if (sourceItems.length > 0) {
    return sourceItems.map((item, index) => {
      const fallback = DEFAULT_ITEMS[index] || DEFAULT_ITEMS[DEFAULT_ITEMS.length - 1];
      return {
        ...fallback,
        ...(isPlainObject(item) ? item : {}),
        id: toText(item?.id, `${fallback.id}-${index}`),
        title: toText(item?.title ?? item?.label, fallback.title),
        message: toText(
          item?.message ?? item?.description ?? item?.text,
          legacyDescriptions[index] || fallback.message
        ),
        icon: toText(item?.icon, fallback.icon),
        tone: toText(item?.tone, fallback.tone),
        visible:
          typeof item?.visible === "boolean"
            ? item.visible
            : typeof item?.enabled === "boolean"
              ? item.enabled
              : fallback.visible,
      };
    });
  }

  return DEFAULT_ITEMS.map((item, index) => ({
    ...item,
    message: legacyDescriptions[index] || item.message,
  }));
};

const normalizeValue = (value) => {
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
      items: normalizeItems(rightBox),
    },
  };
};

const cloneWithItems = (draft, items) => ({
  ...draft,
  rightBox: {
    ...draft.rightBox,
    items,
    benefitItems: items,
    descriptions: items.map((item) => toText(item.message)),
  },
});

function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={Boolean(checked)}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border transition ${
        checked
          ? "border-emerald-500 bg-emerald-600"
          : "border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800"
      }`}
    >
      <span
        className={`h-6 w-6 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function IconBadge({ iconKey, className = "" }) {
  const Icon = getIconMeta(iconKey).icon;
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300 ${className}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
}

function IconButton({ label, onClick, children, disabled = false }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-200"
    >
      {children}
    </button>
  );
}

function ActionButton({ children, onClick, variant = "secondary", disabled = false }) {
  const className =
    variant === "primary"
      ? "border-emerald-600 bg-emerald-600 text-white shadow-[0_14px_28px_rgba(5,150,105,0.22)] hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400"
      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/10";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {children}
    </button>
  );
}

function BenefitRow({ item, index, total, onChange, onMove, onDelete, onCopy }) {
  const tone = getToneMeta(item.tone);

  return (
    <article className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[34px_44px_minmax(150px,1.1fr)_minmax(220px,1.7fr)_84px_130px_82px_156px] lg:items-center">
      <div className="hidden justify-center text-slate-300 dark:text-slate-600 lg:flex">
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-3 lg:block">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
          {index + 1}
        </span>
        <span className="text-xs font-semibold text-slate-400 lg:hidden">Drag handle</span>
      </div>
      <label className="min-w-0">
        <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Item Title
        </span>
        <input
          type="text"
          value={item.title}
          onChange={(event) => onChange({ ...item, title: event.target.value })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-500/15"
        />
      </label>
      <label className="min-w-0">
        <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Message <span className="font-normal">({String(item.message || "").length}/80)</span>
        </span>
        <input
          type="text"
          value={item.message}
          maxLength={140}
          onChange={(event) => onChange({ ...item, message: event.target.value })}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-500/15"
        />
      </label>
      <label className="min-w-0">
        <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Icon
        </span>
        <span className="relative block">
          <select
            value={item.icon}
            onChange={(event) => onChange({ ...item, icon: event.target.value })}
            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-500/15"
          >
            {ICON_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </span>
      </label>
      <label className="min-w-0">
        <span className="mb-1 block text-xs font-semibold text-slate-500 dark:text-slate-400">
          Tone
        </span>
        <span className="relative block">
          <select
            value={item.tone}
            onChange={(event) => onChange({ ...item, tone: event.target.value })}
            className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm font-semibold text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-500/15"
          >
            {TONE_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <span
            className={`pointer-events-none absolute right-7 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${tone.dot}`}
          />
        </span>
      </label>
      <div className="flex items-center justify-between gap-3 lg:justify-center">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 lg:hidden">
          Visible
        </span>
        <Toggle
          checked={item.visible}
          ariaLabel={`Toggle ${item.title || `item ${index + 1}`} visibility`}
          onChange={(next) => onChange({ ...item, visible: next })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <IconButton
          label={`Move ${item.title || `item ${index + 1}`} up`}
          onClick={() => onMove(index, index - 1)}
          disabled={index === 0}
        >
          <ArrowUp className="h-4 w-4" />
        </IconButton>
        <IconButton
          label={`Move ${item.title || `item ${index + 1}`} down`}
          onClick={() => onMove(index, index + 1)}
          disabled={index === total - 1}
        >
          <ArrowDown className="h-4 w-4" />
        </IconButton>
        <IconButton label={`Copy ${item.title || `item ${index + 1}`}`} onClick={() => onCopy(index)}>
          <Copy className="h-4 w-4" />
        </IconButton>
        <IconButton label={`Edit ${item.title || `item ${index + 1}`}`}>
          <Edit3 className="h-4 w-4" />
        </IconButton>
        <IconButton label={`Delete ${item.title || `item ${index + 1}`}`} onClick={() => onDelete(index)}>
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </article>
  );
}

function ReadinessRing({ completion }) {
  const circumference = 2 * Math.PI * 39;
  const dash = (completion / 100) * circumference;

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="39"
          className="fill-none stroke-slate-100 dark:stroke-slate-800"
          strokeWidth="7"
        />
        <circle
          cx="48"
          cy="48"
          r="39"
          className="fill-none stroke-emerald-500"
          strokeWidth="7"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold text-slate-950 dark:text-white">
          {completion}%
        </span>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Complete
        </span>
      </div>
    </div>
  );
}

function PreviewPanel({ enabled, items, mode, onModeChange }) {
  const visibleItems = items.filter((item) => item.visible && toText(item.message));

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
            Live Storefront Preview
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
            See how it appears on the product page.
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            aria-label="Desktop preview"
            onClick={() => onModeChange("desktop")}
            className={`inline-flex h-9 w-11 items-center justify-center rounded-xl ${
              mode === "desktop"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Mobile preview"
            onClick={() => onModeChange("mobile")}
            className={`inline-flex h-9 w-11 items-center justify-center rounded-xl ${
              mode === "mobile"
                ? "bg-white text-emerald-700 shadow-sm dark:bg-slate-950 dark:text-emerald-300"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        className={`mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60 ${
          mode === "mobile" ? "mx-auto max-w-[360px]" : ""
        }`}
      >
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <span key={item} className="h-2 w-12 rounded-full bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className={`grid gap-4 ${mode === "mobile" ? "grid-cols-1" : "lg:grid-cols-[1.1fr_1fr]"}`}>
          <div className="min-h-[260px] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
            <span className="m-4 inline-flex rounded-lg bg-emerald-600 px-2 py-1 text-xs font-bold text-white">
              -20%
            </span>
          </div>
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-base font-extrabold text-slate-950 dark:text-white">
              Readiness Overview
            </h3>
            {enabled ? (
              <ul className="mt-4 space-y-3">
                {visibleItems.map((item) => {
                  const Icon = getIconMeta(item.icon).icon;
                  return (
                    <li key={item.id} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-300" />
                      <span className="break-words">{item.title}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Right Box is disabled.
              </p>
            )}
          </aside>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((item) => (
            <span key={item} className="h-14 rounded-xl bg-slate-200/80 dark:bg-slate-800" />
          ))}
        </div>
      </div>
      <p className="mt-4 text-center text-xs font-medium text-slate-400 dark:text-slate-500">
        Preview may vary slightly from the live site.
      </p>
    </section>
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
  language = "en",
  languages = [],
  onLanguageChange,
}) {
  const [previewMode, setPreviewMode] = useState("desktop");
  const draft = useMemo(() => normalizeValue(value), [value]);
  const items = draft.rightBox.items;
  const visibleItems = items.filter((item) => item.visible);
  const hasContent =
    visibleItems.length > 0 &&
    visibleItems.every((item) => toText(item.title) && toText(item.message));
  const enabled = Boolean(draft.rightBox.enabled);
  const noEmptyFields = items.every((item) => toText(item.title) && toText(item.message));
  const published =
    draft.status === "published" ||
    draft.publishStatus === "published" ||
    draft.rightBox?.status === "published" ||
    draft.rightBox?.publishStatus === "published";
  const readyChecks = [
    enabled,
    visibleItems.length >= 5,
    hasContent,
    noEmptyFields,
  ];
  const completion = Math.round((readyChecks.filter(Boolean).length / readyChecks.length) * 100);
  const status = enabled && visibleItems.length >= 5 && hasContent
    ? published
      ? "Published"
      : "Ready"
    : "Draft";
  const statusDotClass =
    status === "Published" || status === "Ready" ? "bg-emerald-500" : "bg-amber-400";
  const statusHint =
    status === "Published"
      ? "Published to storefront"
      : status === "Ready"
        ? "Ready to publish"
        : "Draft changes";

  const emit = (nextDraft) =>
    onChange?.({
      ...nextDraft,
      status: "draft",
      publishStatus: "draft",
      rightBox: {
        ...nextDraft.rightBox,
        status: "draft",
        publishStatus: "draft",
      },
    });

  const updateRightBox = (patch) => {
    emit({
      ...draft,
      rightBox: {
        ...draft.rightBox,
        ...patch,
      },
    });
  };

  const updateItem = (index, nextItem) => {
    const nextItems = items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
    emit(cloneWithItems(draft, nextItems));
  };

  const addItem = () => {
    const nextIndex = items.length + 1;
    const nextItem = {
      ...DEFAULT_ITEMS[(nextIndex - 1) % DEFAULT_ITEMS.length],
      id: `custom-benefit-${Date.now()}`,
      title: `Benefit ${nextIndex}`,
      message: "",
      visible: true,
    };
    emit(cloneWithItems(draft, [...items, nextItem]));
  };

  const deleteItem = (index) => {
    if (items.length <= 1) return;
    emit(cloneWithItems(draft, items.filter((_, itemIndex) => itemIndex !== index)));
  };

  const moveItem = (from, to) => {
    if (to < 0 || to >= items.length || from === to) return;
    const nextItems = [...items];
    const [item] = nextItems.splice(from, 1);
    nextItems.splice(to, 0, item);
    emit(cloneWithItems(draft, nextItems));
  };

  const copyItem = (index) => {
    const source = items[index];
    if (!source) return;
    const nextItems = [
      ...items.slice(0, index + 1),
      { ...source, id: `${source.id || "benefit"}-copy-${Date.now()}`, title: `${source.title} Copy` },
      ...items.slice(index + 1),
    ];
    emit(cloneWithItems(draft, nextItems));
  };

  const languageItems = languages.length
    ? languages
    : [{ isoCode: language || "en", name: "English" }];

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-clip pb-8 text-slate-900 dark:text-slate-100">
      <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-normal text-slate-950 dark:text-white">
            Store Customizations
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Configure content blocks, messages, and storefront SEO.
          </p>
        </div>
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <label className="relative min-w-0 sm:w-auto">
            <span className="sr-only">Language</span>
            <select
              value={language}
              onChange={(event) => onLanguageChange?.(event.target.value)}
              disabled={isSaving || isPublishing}
              className="h-11 w-full min-w-0 appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-emerald-500/15 sm:w-44"
            >
              {languageItems.map((item) => (
                <option key={item.isoCode || item.id} value={item.isoCode}>
                  {item.isoCode || "en"}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>
          <ActionButton onClick={onReset} disabled={isSaving || isPublishing}>
            <RefreshCcw className="h-4 w-4" />
            Reset
          </ActionButton>
          <ActionButton onClick={() => onSave?.()} disabled={isSaving || isPublishing} variant="primary">
            <Save className="h-4 w-4" />
            {isSaving && !isPublishing ? "Saving..." : "Save Changes"}
          </ActionButton>
        </div>
      </header>

      <nav className="flex flex-wrap gap-x-5 gap-y-2 border-b border-slate-200/80 dark:border-slate-800">
        {TAB_ITEMS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange?.(tab.key)}
            className={`relative h-11 text-sm font-bold transition ${
              activeTab === tab.key
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {tab.label}
            {activeTab === tab.key ? (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-emerald-500" />
            ) : null}
          </button>
        ))}
      </nav>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 dark:border-slate-800 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">
              Single Setting (Right Box)
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Manage the key messages displayed on the product slug page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">Status:</span>
            <span className="inline-flex h-9 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
              <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
              {status}
            </span>
            <ActionButton onClick={onPreview}>
              <Eye className="h-4 w-4" />
              Live Preview
            </ActionButton>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 dark:border-slate-800 sm:flex-row sm:items-center">
          <Toggle
            checked={enabled}
            ariaLabel="Enable Right Box"
            onChange={(next) => updateRightBox({ enabled: next })}
          />
          <div>
            <p className="text-sm font-extrabold text-slate-950 dark:text-white">
              Enable Right Box
            </p>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Display this message box on the product slug page.
            </p>
          </div>
        </div>

        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-9 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
                {status}
              </span>
              <span className="inline-flex h-9 items-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                {items.length} items
              </span>
              <span className="inline-flex h-9 items-center gap-2 rounded-2xl px-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <Check className="h-4 w-4 text-emerald-600" />
                {statusHint}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ActionButton onClick={addItem}>
                <Plus className="h-4 w-4" />
                Add Item
              </ActionButton>
              <ActionButton onClick={() => emit(cloneWithItems(draft, [...items].reverse()))}>
                <SlidersHorizontal className="h-4 w-4" />
                Reorder
              </ActionButton>
              <ActionButton onClick={() => onSave?.()} disabled={isSaving || isPublishing}>
                <Save className="h-4 w-4" />
                Save Draft
              </ActionButton>
              <ActionButton onClick={onPreview}>
                <Eye className="h-4 w-4" />
                Preview
              </ActionButton>
              <ActionButton onClick={onPublish} disabled={isSaving || isPublishing} variant="primary">
                <Send className="h-4 w-4" />
                {isPublishing ? "Publishing..." : "Publish"}
              </ActionButton>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-lg font-extrabold text-slate-950 dark:text-white">
                Benefit Item Editor
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Manage the key messages displayed in the product slug page right box.
              </p>
            </div>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Showing 1 to {items.length} of {items.length} items
            </p>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <BenefitRow
                key={item.id || `${item.title}-${index}`}
                item={item}
                index={index}
                total={items.length}
                onChange={(nextItem) => updateItem(index, nextItem)}
                onMove={moveItem}
                onDelete={deleteItem}
                onCopy={copyItem}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <PreviewPanel
          enabled={enabled}
          items={items}
          mode={previewMode}
          onModeChange={setPreviewMode}
        />

        <aside className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Readiness Overview
            </h2>
            <div className="mt-5 flex items-center gap-4">
              <ReadinessRing completion={completion} />
              <div>
                <p className="text-sm font-extrabold text-slate-950 dark:text-white">
                  Great job! You're almost ready.
                </p>
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {readyChecks.filter(Boolean).length} of {readyChecks.length} items configured
                </p>
              </div>
            </div>
            <ul className="mt-6 space-y-3">
              {[
                ["Right Box Enabled", enabled],
                ["At least 5 benefit items", visibleItems.length >= 5],
                ["All items have content", hasContent],
                ["No empty fields", noEmptyFields],
              ].map(([label, checked]) => (
                <li key={label} className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                      checked
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : "border-slate-300 text-transparent dark:border-slate-700"
                    }`}
                  >
                    <Check className="h-3 w-3" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
              Quick Actions
            </h2>
            <div className="mt-5 grid gap-3">
              <ActionButton onClick={onPublish} disabled={isSaving || isPublishing} variant="primary">
                <Send className="h-4 w-4" />
                Publish
              </ActionButton>
              <ActionButton onClick={onPreview}>
                <Eye className="h-4 w-4" />
                Preview Storefront
              </ActionButton>
              <ActionButton>
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </ActionButton>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
              Get AI suggestions to improve your messages and conversions.
            </p>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950">
            <h2 className="text-sm font-extrabold uppercase tracking-normal text-slate-500 dark:text-slate-400">
              Visible Items
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {visibleItems.slice(0, 6).map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                  <IconBadge iconKey={item.icon} />
                  <p className="mt-2 truncate text-xs font-bold text-slate-700 dark:text-slate-200">
                    {item.title}
                  </p>
                </div>
              ))}
              {visibleItems.length === 0 ? (
                <div className="col-span-2 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No visible items yet.
                </div>
              ) : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
