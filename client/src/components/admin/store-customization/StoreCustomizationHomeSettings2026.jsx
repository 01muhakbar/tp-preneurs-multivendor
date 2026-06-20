import { useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Boxes,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Edit3,
  Eye,
  EyeOff,
  Gauge,
  Gift,
  Globe2,
  Grid3X3,
  Home,
  Image,
  Layers3,
  Link,
  Megaphone,
  Monitor,
  Package,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Truck,
  UploadCloud,
  WandSparkles,
  X,
} from "lucide-react";
import { uploadAdminImage } from "../../../lib/adminApi.js";

const MAIN_SLIDER_LENGTH = 5;

const DEFAULT_CONFIG = {
  header: {
    headerText: "We're here to help you shop better!",
    phoneNumber: "+1 (888) 123-4567",
    whatsAppLink: "https://wa.me/18881234567",
  },
  menuEditor: {
    labels: {
      categories: "Categories",
      aboutUs: "About Us",
      contactUs: "Contact",
      offers: "Offers",
      faq: "FAQ",
      privacyPolicy: "Privacy Policy",
      termsAndConditions: "Terms & Conditions",
      pages: "Pages",
      myAccount: "My Account",
      login: "Login",
      logout: "Logout",
      checkout: "Checkout",
    },
    enabled: {
      showCategories: true,
      showAboutUs: true,
      showContactUs: true,
      showOffers: true,
      showFaq: true,
      showPrivacyPolicy: true,
      showTermsAndConditions: true,
    },
  },
  mainSlider: {
    sliders: Array.from({ length: MAIN_SLIDER_LENGTH }, (_, index) => ({
      imageDataUrl: "",
      title: index === 0 ? "Summer Sale is Live!" : "",
      description:
        index === 0
          ? "Up to 50% off on selected fashion, accessories & more."
          : "",
      buttonName: index === 0 ? "Shop Now" : "",
      buttonLink: index === 0 ? "/collections/summer-sale" : "",
      imageFocus: "right",
    })),
    options: {
      showArrows: true,
      showDots: true,
      showBoth: true,
      autoplayEnabled: true,
      autoplayDelaySeconds: 5,
    },
  },
  discountCouponBox: {
    enabled: true,
    title: "Grab extra savings with our exclusive coupons!",
    activeCouponCodes: ["SALE10", "FREESHIP", "NEW20", "WELCOME15"],
  },
  promotionBanner: {
    enabled: true,
    title: "Big Deals. Bigger Savings.",
    subtitle: "Limited time offers on top categories",
    description: "Shop handpicked products at special prices. Offer valid for a limited time only.",
    buttonName: "Shop Now",
    buttonLink: "/collections/deals",
    imageDataUrl: "",
    displayOn: "Desktop & Mobile",
    status: "needsReview",
  },
  featuredCategories: {
    enabled: true,
    title: "Shop by Category",
    subtitle: "Explore our top categories",
    description: "Find the best products across our most popular categories.",
    source: "Manually Selected",
    productsLimit: 6,
    buttonName: "View All Categories",
    buttonLink: "/collections",
    displayStyle: "Grid",
    status: "ready",
    selectedCategories: ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"],
  },
  popularProducts: {
    enabled: true,
    title: "Popular Products",
    subtitle: "Loved by our customers",
    description: "Check out our top-rated and best-selling products.",
    source: "Best Selling",
    productsLimit: 8,
    filterBy: "All Categories",
    sortBy: "Best Selling",
    buttonName: "Shop All",
    buttonLink: "/products",
    status: "ready",
  },
  quickDelivery: {
    enabled: true,
    subTitle: "Fast and reliable delivery to your doorstep.",
    title: "Quick Delivery",
    description: "Same-day delivery in select cities with real-time tracking.",
    buttonName: "Learn More",
    buttonLink: "/delivery",
    imageDataUrl: "",
    displayStyle: "Horizontal",
    status: "draft",
    features: [
      "Same-day delivery in select cities",
      "Real-time order tracking",
      "Safe & secure packaging",
      "Easy returns & exchanges",
    ],
  },
  footer: {
    block1: { enabled: true },
    block2: { enabled: true },
    block3: { enabled: true },
    block4: { enabled: true },
  },
};

const TAB_ITEMS = [
  { key: "home", label: "Home Page", icon: Home },
  { key: "productSlugPage", label: "Product Slug Page", icon: Package },
  { key: "aboutUs", label: "About Us", icon: BadgeCheck },
  { key: "privacyPolicyTerms", label: "Privacy & T&C", icon: ShieldCheck },
  { key: "faqs", label: "FAQs", icon: CircleHelp },
  { key: "offers", label: "Offers", icon: Gift },
  { key: "contactUs", label: "Contact", icon: ShoppingBag },
  { key: "checkout", label: "Checkout", icon: ShoppingCart },
  { key: "dashboardSetting", label: "Dashboard", icon: Grid3X3 },
  { key: "seoSettings", label: "SEO", icon: Search },
];

const MENU_LABEL_FIELDS = [
  ["categories", "Categories"],
  ["aboutUs", "About Us"],
  ["contactUs", "Contact"],
  ["offers", "Offers"],
  ["faq", "FAQ"],
  ["privacyPolicy", "Privacy Policy"],
  ["termsAndConditions", "Terms"],
  ["pages", "Pages"],
  ["myAccount", "My Account"],
  ["login", "Login"],
  ["logout", "Logout"],
  ["checkout", "Checkout"],
];

const VISIBILITY_FIELDS = [
  ["showCategories", "Show Categories"],
  ["showAboutUs", "Show About Us"],
  ["showContactUs", "Show Contact"],
  ["showOffers", "Show Offers"],
  ["showFaq", "Show FAQ"],
  ["showPrivacyPolicy", "Show Privacy Policy"],
  ["showTermsAndConditions", "Show Terms & Conditions"],
];

const cardClass =
  "rounded-3xl border border-slate-200/80 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none";
const inputClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/15";
const textareaClass =
  "min-h-[86px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-500 dark:focus:ring-emerald-500/15";

const isPlainObject = (value) =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const mergeDeep = (base, source) => {
  if (!isPlainObject(base)) return source;
  const output = { ...base };
  if (!isPlainObject(source)) return output;
  Object.entries(source).forEach(([key, value]) => {
    if (isPlainObject(output[key]) && isPlainObject(value)) {
      output[key] = mergeDeep(output[key], value);
    } else {
      output[key] = value;
    }
  });
  return output;
};

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeStatus = (value, fallback = "ready") => {
  const normalized = toText(value, fallback).toLowerCase();
  if (["ready", "needsreview", "needs review", "draft", "off"].includes(normalized)) {
    return normalized.replace(/\s+/g, "");
  }
  return fallback;
};

const normalizeHomeValue = (value) => {
  const source = isPlainObject(value) ? value : {};
  const merged = mergeDeep(DEFAULT_CONFIG, source);
  const sliders = Array.isArray(merged.mainSlider?.sliders)
    ? merged.mainSlider.sliders
    : [];

  return {
    ...merged,
    mainSlider: {
      ...merged.mainSlider,
      sliders: Array.from({ length: MAIN_SLIDER_LENGTH }, (_, index) => ({
        ...DEFAULT_CONFIG.mainSlider.sliders[index],
        ...(isPlainObject(sliders[index]) ? sliders[index] : {}),
      })),
      options: {
        ...DEFAULT_CONFIG.mainSlider.options,
        ...(isPlainObject(merged.mainSlider?.options) ? merged.mainSlider.options : {}),
      },
    },
    discountCouponBox: {
      ...DEFAULT_CONFIG.discountCouponBox,
      ...(isPlainObject(merged.discountCouponBox) ? merged.discountCouponBox : {}),
      activeCouponCodes: Array.isArray(merged.discountCouponBox?.activeCouponCodes)
        ? [...new Set(merged.discountCouponBox.activeCouponCodes.map((item) => toText(item).toUpperCase()).filter(Boolean))]
        : DEFAULT_CONFIG.discountCouponBox.activeCouponCodes,
    },
    quickDelivery: {
      ...DEFAULT_CONFIG.quickDelivery,
      ...(isPlainObject(merged.quickDelivery) ? merged.quickDelivery : {}),
      features: Array.isArray(merged.quickDelivery?.features)
        ? merged.quickDelivery.features.map((item) => toText(item)).filter(Boolean).slice(0, 4)
        : DEFAULT_CONFIG.quickDelivery.features,
    },
  };
};

const cloneWithPath = (source, path, nextValue) => {
  const keys = Array.isArray(path) ? path : String(path).split(".");
  const root = { ...source };
  let cursor = root;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = nextValue;
      return;
    }
    const current = cursor[key];
    cursor[key] = Array.isArray(current) ? [...current] : { ...(current || {}) };
    cursor = cursor[key];
  });

  return root;
};

const statusMeta = (status) => {
  const normalized = normalizeStatus(status);
  if (normalized === "needsreview") {
    return {
      label: "Needs Review",
      className:
        "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200",
    };
  }
  if (normalized === "draft") {
    return {
      label: "Draft",
      className:
        "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200",
    };
  }
  if (normalized === "off") {
    return {
      label: "Off",
      className:
        "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    };
  }
  return {
    label: "Ready",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200",
  };
};

function Field({ label, value, onChange, max = 100, type = "text", placeholder = "" }) {
  const count = String(value || "").length;
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
      <span className="mt-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
        {count} / {max}
      </span>
    </label>
  );
}

function TextAreaField({ label, value, onChange, max = 200, placeholder = "" }) {
  const count = String(value || "").length;
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <textarea
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={textareaClass}
      />
      <span className="mt-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
        {count} / {max}
      </span>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {label}
      </span>
      <select value={value || ""} onChange={(event) => onChange(event.target.value)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusChip({ value }) {
  const meta = statusMeta(value);
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}

const getPreviewImageFocusClass = (value) => {
  const normalized = toText(value, "right").toLowerCase();
  if (normalized === "left") return "object-left";
  if (normalized === "center") return "object-center";
  return "object-right";
};

function Toggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={Boolean(checked)}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 items-center rounded-full border transition ${
        checked
          ? "border-emerald-500 bg-emerald-600"
          : "border-slate-300 bg-slate-200 dark:border-slate-700 dark:bg-slate-800"
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function YesNoToggle({ checked, onChange }) {
  return (
    <div className="grid h-8 grid-cols-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
      {[
        ["yes", true],
        ["no", false],
      ].map(([label, value]) => (
        <button
          key={label}
          type="button"
          onClick={() => onChange(value)}
          className={`rounded-md text-xs font-bold transition ${
            checked === value
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          {value ? "Yes" : "No"}
        </button>
      ))}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-slate-950 dark:text-white">{title}</h2>
          <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      {action ? <div className="basis-full shrink-0 min-[560px]:basis-auto">{action}</div> : null}
    </div>
  );
}

export default function StoreCustomizationHomeSettings2026({
  value,
  activeTab,
  onTabChange,
  onChange,
  onSave,
  onPublish,
  onPreview,
  isSaving,
  isPublishing,
  language = "en",
  languages = [],
  onLanguageChange,
  isLoading,
}) {
  const [selectedSliderIndex, setSelectedSliderIndex] = useState(0);
  const [activeSliderTab, setActiveSliderTab] = useState("slider-0");
  const [couponInput, setCouponInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploadingSliderImage, setIsUploadingSliderImage] = useState(false);
  const fileInputRef = useRef(null);

  const draft = useMemo(() => normalizeHomeValue(value), [value]);
  const currentSlider = draft.mainSlider.sliders[selectedSliderIndex] || draft.mainSlider.sliders[0];
  const activeSlides = draft.mainSlider.sliders.filter(
    (slide) => toText(slide.title) || toText(slide.imageDataUrl)
  ).length;

  const updateDraft = (path, nextValue) => {
    onChange?.(cloneWithPath(draft, path, nextValue));
  };

  const updateSlider = (field, nextValue) => {
    updateDraft(["mainSlider", "sliders", selectedSliderIndex, field], nextValue);
  };

  const uploadSliderImage = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError("Use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError("Max file size is 2MB.");
      return;
    }
    setIsUploadingSliderImage(true);
    try {
      const result = await uploadAdminImage(file);
      const uploadedUrl = String(result?.url || result?.data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Upload succeeded without an image URL.");
      }
      setUploadError("");
      updateSlider("imageDataUrl", uploadedUrl);
    } catch (error) {
      setUploadError(error?.response?.data?.message || error?.message || "Failed to upload image.");
    } finally {
      setIsUploadingSliderImage(false);
    }
  };

  const addCoupon = () => {
    const parsed = couponInput
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    if (!parsed.length) return;
    const next = [...new Set([...(draft.discountCouponBox.activeCouponCodes || []), ...parsed])];
    updateDraft(["discountCouponBox", "activeCouponCodes"], next);
    setCouponInput("");
  };

  const removeCoupon = (code) => {
    updateDraft(
      ["discountCouponBox", "activeCouponCodes"],
      (draft.discountCouponBox.activeCouponCodes || []).filter((item) => item !== code)
    );
  };

  const generateWaLink = () => {
    const digits = toText(draft.header.phoneNumber).replace(/\D/g, "");
    if (!digits) return;
    updateDraft(["header", "whatsAppLink"], `https://wa.me/${digits.startsWith("0") ? `62${digits.slice(1)}` : digits}`);
  };

  const blocks = [
    {
      key: "mainSlider",
      title: "Main Slider",
      detail: "Hero banners and promotional sliders",
      icon: Image,
      status: activeSlides > 0 ? "ready" : "needsReview",
    },
    {
      key: "header",
      title: "Header",
      detail: "Logo, contacts and header information",
      icon: Store,
      status: draft.header.headerText ? "ready" : "needsReview",
    },
    {
      key: "featuredCategories",
      title: "Featured Categories",
      detail: "Showcase top categories",
      icon: Grid3X3,
      status: draft.featuredCategories.enabled ? "ready" : "draft",
    },
    {
      key: "popularProducts",
      title: "Popular Products",
      detail: "Highlight popular products",
      icon: ShoppingBag,
      status: draft.popularProducts.enabled ? "ready" : "draft",
    },
    {
      key: "promotionBanner",
      title: "Promotion Banner",
      detail: "Promotional text and banners",
      icon: Megaphone,
      status: draft.promotionBanner.status || "needsReview",
    },
    {
      key: "footer",
      title: "Footer Links",
      detail: "Footer menus and important links",
      icon: Link,
      status: draft.footer?.block4?.enabled ? "ready" : "needsReview",
    },
  ];

  const readyCount = blocks.filter((item) => normalizeStatus(item.status) === "ready").length;
  const reviewCount = blocks.length - readyCount;
  const completion = Math.max(45, Math.min(100, Math.round((readyCount / blocks.length) * 100)));
  const pendingItems = [
    "Promotion Banner image needs review",
    "Add more categories",
    "Quick Delivery Section description is too short",
  ];

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-clip pb-8 text-slate-900 dark:text-slate-100">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-normal text-slate-950 dark:text-white">
            Store Customization
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Manage homepage sections, labels, and storefront content.
          </p>
        </div>
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
          <label className="relative min-w-0 sm:w-auto">
            <Globe2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <select
              value={language}
              onChange={(event) => onLanguageChange?.(event.target.value)}
              className="h-11 w-full min-w-0 rounded-2xl border border-slate-200 bg-white pl-9 pr-9 text-sm font-semibold text-slate-700 shadow-sm outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 sm:w-auto"
            >
              {(languages.length ? languages : [{ isoCode: language || "en", name: "English" }]).map((item) => (
                <option key={item.isoCode || item.id} value={item.isoCode}>
                  {item.name || item.isoCode}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>
          <button
            type="button"
            className="inline-flex h-11 min-w-0 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            <Store className="h-4 w-4" />
            TP Preneurs Store
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          <div className="flex min-w-0 flex-wrap items-center gap-2 px-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
            <Check className="h-5 w-5 rounded-full bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" />
            <span>Autosaved</span>
            <span className="text-xs font-medium">2 min ago</span>
          </div>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving || isPublishing || isLoading}
            className="h-11 rounded-2xl border border-emerald-500 bg-white px-5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-slate-950 dark:hover:bg-emerald-500/10"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={isSaving || isPublishing || isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Rocket className="h-4 w-4" />
            {isPublishing ? "Publishing..." : "Publish Draft"}
          </button>
        </div>
      </header>

      <nav className={`${cardClass} overflow-hidden p-2`}>
        <div className="grid min-w-0 grid-cols-2 gap-1 min-[560px]:flex min-[560px]:flex-wrap min-[560px]:items-center">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const selected = (activeTab || "home") === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onTabChange?.(tab.key)}
                className={`relative inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-bold transition min-[560px]:h-12 min-[560px]:gap-2 min-[560px]:px-4 min-[560px]:text-sm ${
                  selected
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{tab.label}</span>
                {selected ? <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-600" /> : null}
              </button>
            );
          })}
        </div>
      </nav>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        {[
          ["Page", "Home Page", "Homepage Settings", Home, "emerald"],
          ["Language", String(language || "en").toUpperCase(), "Default Language", Globe2, "violet"],
          ["Sections Ready", `${readyCount} / ${blocks.length}`, "All sections active", Layers3, "sky"],
          ["Review Status", `${reviewCount} Needs Review`, "Tap to review", Star, "amber"],
          ["Last Updated", "May 20, 2025", "10:24 AM", CalendarDays, "emerald"],
          ["Completion", `${completion}%`, "Great job!", Gauge, "emerald"],
        ].map(([label, valueText, detail, Icon, tone]) => (
          <div key={label} className={`${cardClass} min-h-[116px] p-5`}>
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                  tone === "violet"
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : tone === "sky"
                      ? "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300"
                      : tone === "amber"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0 break-words text-sm font-semibold text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <div className="mt-4 text-2xl font-extrabold text-slate-950 dark:text-white">{valueText}</div>
            <div className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{detail}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className={`${cardClass} p-5`}>
          <SectionTitle
            icon={Boxes}
            title="Homepage Blocks"
            description="Review and customize each section of your homepage."
            action={
              <button type="button" aria-label="Collapse all homepage blocks" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                <ChevronDown className="h-4 w-4 rotate-180" />
                <span className="hidden min-[420px]:inline">Collapse All</span>
              </button>
            }
          />
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {blocks.map((block) => {
              const Icon = block.icon;
              return (
                <article key={block.key} className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg hover:shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/40 dark:hover:shadow-none">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-base font-extrabold text-slate-950 dark:text-white">{block.title}</h3>
                      <p className="mt-1 min-h-10 text-sm text-slate-500 dark:text-slate-400">{block.detail}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-col items-stretch gap-2 min-[520px]:flex-row min-[520px]:items-center min-[520px]:justify-between">
                    <StatusChip value={block.status} />
                    <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
                      <button type="button" className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        <Eye className="h-3.5 w-3.5" />
                        Review
                      </button>
                      <button type="button" className="inline-flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <button type="button" className="mx-auto mt-5 flex items-center gap-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            View All Sections
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        <aside className={`${cardClass} p-5`}>
          <SectionTitle icon={WandSparkles} title="Optimization Suggestions" description="Smart recommendations to boost store performance." action={<span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">AI Powered</span>} />
          <div className="mt-5 space-y-3">
            {[
              [Image, "Review hero slider content", "Your main slider has not been updated in 15 days. Fresh banners improve engagement.", "emerald"],
              [Grid3X3, "Check homepage sections", "5 sections need your attention to ensure optimal user experience.", "amber"],
              [Search, "Validate SEO settings", "Meta title and description can be improved to boost search rankings.", "sky"],
              [Gauge, "Enable product recommendations", "Add AI recommendations to increase conversion and average order value.", "violet"],
            ].map(([Icon, title, detail, tone]) => (
              <button key={title} type="button" className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 ${
                tone === "amber"
                  ? "border-amber-100 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10"
                  : tone === "sky"
                    ? "border-sky-100 bg-sky-50/70 dark:border-sky-500/20 dark:bg-sky-500/10"
                    : tone === "violet"
                      ? "border-violet-100 bg-violet-50/70 dark:border-violet-500/20 dark:bg-violet-500/10"
                      : "border-emerald-100 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10"
              }`}>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-slate-700 dark:bg-slate-950/70 dark:text-slate-200">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-slate-950 dark:text-white">{title}</span>
                  <span className="mt-0.5 block text-xs font-medium text-slate-500 dark:text-slate-400">{detail}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            ))}
          </div>
          <button type="button" className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700">
            <Sparkles className="h-4 w-4" />
            Generate Optimization Plan
          </button>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className={`${cardClass} p-5`}>
          <SectionTitle icon={Layers3} title="Advanced Section Editor" description="Fine-tune texts, labels, and visibility settings for your homepage." action={<button type="button" aria-label="Collapse all advanced sections" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300"><ChevronDown className="h-4 w-4 rotate-180" /><span className="hidden min-[420px]:inline">Collapse All</span></button>} />

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <SectionTitle icon={Store} title="Header" description="Update top bar information displayed on your store." />
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_190px]">
                <Field label="Support Text" value={draft.header.headerText} onChange={(next) => updateDraft(["header", "headerText"], next)} />
                <Field label="Phone Number" value={draft.header.phoneNumber} onChange={(next) => updateDraft(["header", "phoneNumber"], next)} max={20} />
                <Field label="WhatsApp Link" value={draft.header.whatsAppLink} onChange={(next) => updateDraft(["header", "whatsAppLink"], next)} max={120} type="url" />
                <button type="button" onClick={generateWaLink} className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-3 text-sm font-extrabold text-slate-700 dark:border-slate-800 dark:text-slate-200">
                  <Link className="h-4 w-4 text-emerald-600" />
                  Generate WA Link
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <SectionTitle icon={Grid3X3} title="Menu Labels" description="Customize the text labels used in your main navigation." />
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {MENU_LABEL_FIELDS.map(([key, label]) => (
                  <Field
                    key={key}
                    label={label}
                    value={draft.menuEditor.labels?.[key] || ""}
                    max={20}
                    onChange={(next) => updateDraft(["menuEditor", "labels", key], next)}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <SectionTitle icon={draft.menuEditor.enabled?.showCategories ? Eye : EyeOff} title="Visibility Controls" description="Show or hide sections and links on your homepage." />
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {VISIBILITY_FIELDS.map(([key, label]) => (
                  <div key={key}>
                    <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                    <YesNoToggle checked={Boolean(draft.menuEditor.enabled?.[key])} onChange={(next) => updateDraft(["menuEditor", "enabled", key], next)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className={`${cardClass} p-5`}>
          <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Editor Tips</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Best practices for a great storefront.</p>
          <div className="mt-4 space-y-3">
            {["Label Consistency", "Navigation Clarity", "Mobile Readiness", "Contact Accessibility", "Content Length"].map((item) => (
              <div key={item} className="flex min-w-0 gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-300" />
                <div className="min-w-0">
                  <p className="break-words text-sm font-extrabold text-slate-900 dark:text-white">{item}</p>
                  <p className="break-words text-xs text-slate-500 dark:text-slate-400">All recommended checks look good.</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Main Slider</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Configure the hero slider that appears at the top of your homepage.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-2 min-[520px]:flex">
            <button type="button" onClick={onPreview} className="inline-flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">
              <Eye className="h-4 w-4" />
              Preview on Store
            </button>
            <button type="button" className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800 min-[520px]:w-10">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800 min-[520px]:w-10">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-5 border-b border-slate-200 dark:border-slate-800">
          {[...Array(MAIN_SLIDER_LENGTH)].map((_, index) => {
            const key = `slider-${index}`;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedSliderIndex(index);
                  setActiveSliderTab(key);
                }}
                className={`border-b-2 px-4 py-3 text-sm font-extrabold transition ${
                  activeSliderTab === key
                    ? "border-emerald-600 text-emerald-700 dark:text-emerald-300"
                    : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                Slider {index + 1}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveSliderTab("options")}
            className={`border-b-2 px-4 py-3 text-sm font-extrabold transition ${
              activeSliderTab === "options"
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-300"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            Options
          </button>
        </div>

        {activeSliderTab === "options" ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["showArrows", "Show Arrows"],
              ["showDots", "Show Dots"],
              ["showBoth", "Show Both"],
              ["autoplayEnabled", "Auto Slide"],
            ].map(([key, label]) => (
              <div key={key} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <span className="mb-3 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
                <YesNoToggle checked={Boolean(draft.mainSlider.options?.[key])} onChange={(next) => updateDraft(["mainSlider", "options", key], next)} />
              </div>
            ))}
            <SelectField
              label="Slide Duration"
              value={String(draft.mainSlider.options?.autoplayDelaySeconds || 5)}
              onChange={(next) => updateDraft(["mainSlider", "options", "autoplayDelaySeconds"], Number(next))}
              options={["5", "10", "15"]}
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[410px_minmax(0,1fr)_320px]">
            <div>
              <span className="mb-2 block text-sm font-extrabold text-slate-900 dark:text-white">
                Slider Image <span className="text-rose-500">*</span>
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpeg,.jpg,.webp"
                className="hidden"
                onChange={async (event) => {
                  await uploadSliderImage(event.target.files?.[0]);
                  event.target.value = "";
                }}
                disabled={isUploadingSliderImage}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  uploadSliderImage(event.dataTransfer?.files?.[0]);
                }}
                disabled={isUploadingSliderImage}
                className="flex min-h-[250px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-emerald-500/50"
              >
                <UploadCloud className="h-10 w-10 text-emerald-600" />
                <span className="mt-4 text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  {isUploadingSliderImage ? "Uploading image..." : "Drag & drop your image here"}
                </span>
                <span className="mt-2 text-xs text-slate-500 dark:text-slate-400">or</span>
                <span className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200">
                  {isUploadingSliderImage ? "Please wait..." : "Upload Image"}
                </span>
              </button>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Recommended size: 1200 x 400px (3:1 aspect ratio). Keep the main subject near the center safe area since edges may be cropped on smaller screens. Max file size: 2MB
              </p>
              {uploadError ? <p className="mt-2 text-sm font-semibold text-rose-600">{uploadError}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Field label="Slider Title" value={currentSlider.title} onChange={(next) => updateSlider("title", next)} max={60} />
              <Field label="Button Label" value={currentSlider.buttonName} onChange={(next) => updateSlider("buttonName", next)} max={20} />
              <SelectField label="Image Focus" value={currentSlider.imageFocus || "right"} onChange={(next) => updateSlider("imageFocus", next)} options={["right", "center", "left"]} />
              <Field label="Button Link" value={currentSlider.buttonLink} onChange={(next) => updateSlider("buttonLink", next)} max={120} />
              <div className="lg:col-span-2">
                <TextAreaField label="Description" value={currentSlider.description} onChange={(next) => updateSlider("description", next)} max={160} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-950 dark:text-white">Live Preview (Storefront)</h3>
                <div className="hidden shrink-0 gap-2 min-[520px]:flex">
                  <Monitor className="h-5 w-5 text-emerald-600" />
                  <Smartphone className="h-5 w-5 text-slate-400" />
                </div>
              </div>
              <div className="relative min-h-[210px] overflow-hidden rounded-2xl bg-[#eef6ff] p-4 dark:bg-slate-900">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_45%,rgba(3,76,133,0.12),transparent_35%)]" />
                <div className="relative grid min-h-[178px] grid-cols-[minmax(0,1fr)_92px] items-stretch gap-3">
                  <div className={`relative flex flex-col justify-center overflow-hidden rounded-xl ${currentSlider.imageDataUrl ? "w-full h-full" : ""}`}>
                    {currentSlider.imageDataUrl ? (
                      <img
                        src={currentSlider.imageDataUrl}
                        alt=""
                        className={`absolute inset-0 h-full w-full object-contain ${getPreviewImageFocusClass(currentSlider.imageFocus)}`}
                      />
                    ) : null}
                    <div className={`relative z-10 ${currentSlider.imageDataUrl ? "p-3 sm:p-4" : ""} min-w-0`}>

                    {toText(currentSlider.title) ? (
                      <p className="mt-3 text-2xl font-black leading-none text-[#071a3f] dark:text-white">
                        {currentSlider.title}
                      </p>
                    ) : null}
                    {toText(currentSlider.description) ? (
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-[#4e6387] dark:text-slate-300">
                        {currentSlider.description}
                      </p>
                    ) : null}
                    {toText(currentSlider.buttonName) ? (
                      <span className="mt-3 inline-flex h-9 items-center rounded-full bg-[var(--tp-primary)] px-4 text-xs font-black text-white">
                        {currentSlider.buttonName}
                      </span>
                    ) : null}
                  </div>
                  </div>
                  {draft.discountCouponBox.enabled ? (
                    <div className="rounded-2xl border border-[#cdebdc] bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                      <p className="text-[7px] font-black uppercase tracking-[0.16em] text-[var(--tp-accent)]">
                        Coupon Box
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] font-black leading-3 text-[#071a3f] dark:text-white">
                        {draft.discountCouponBox.title}
                      </p>
                      <div className="mt-2 rounded-xl border border-dashed border-[#00b876]/50 bg-[#f2fff8] px-1.5 py-2 text-center dark:bg-slate-900">
                        <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#00a46c]">
                          Coupon
                        </p>
                        <p className="mt-1 truncate text-[11px] font-black tracking-[0.12em] text-[var(--tp-primary)] dark:text-sky-300">
                          {draft.discountCouponBox.activeCouponCodes?.[0] || "CODE"}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 flex justify-center gap-1.5">
                {[0, 1, 2].map((item) => (
                  <span key={item} className={`h-1.5 rounded-full ${item === 0 ? "w-6 bg-emerald-600" : "w-4 bg-slate-300 dark:bg-slate-700"}`} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className={`${cardClass} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950 dark:text-white">Discount Coupon Code Box</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enable and manage the coupon code box displayed on the right side of the main slider.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Enable Coupon Box</span>
            <YesNoToggle checked={Boolean(draft.discountCouponBox.enabled)} onChange={(next) => updateDraft(["discountCouponBox", "enabled"], next)} />
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <Field label="Box Title" value={draft.discountCouponBox.title} onChange={(next) => updateDraft(["discountCouponBox", "title"], next)} max={80} />
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Coupon Codes</span>
            <div className="flex flex-wrap gap-2">
              {(draft.discountCouponBox.activeCouponCodes || []).map((code) => (
                <span key={code} className="inline-flex h-9 max-w-full items-center gap-2 rounded-xl bg-emerald-100 px-3 text-sm font-extrabold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                  <span className="min-w-0 truncate">{code}</span>
                  <button type="button" className="shrink-0" onClick={() => removeCoupon(code)} aria-label={`Remove ${code}`}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              <input
                value={couponInput}
                onChange={(event) => setCouponInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    addCoupon();
                  }
                }}
                placeholder="ADDCODE"
                className="h-9 w-32 rounded-xl border border-dashed border-emerald-300 bg-white px-3 text-sm font-bold text-emerald-700 outline-none dark:bg-slate-950"
              />
              <button type="button" onClick={addCoupon} className="h-9 rounded-xl border border-dashed border-emerald-300 px-3 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
                + Add Coupon
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <MerchandisingCard
            icon={Megaphone}
            title="Promotion Banner"
            description="Display promotional banners to highlight offers and campaigns."
            status={draft.promotionBanner.status || "needsReview"}
            enabled={draft.promotionBanner.enabled}
            onEnabledChange={(next) => updateDraft(["promotionBanner", "enabled"], next)}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Field label="Title" value={draft.promotionBanner.title} onChange={(next) => updateDraft(["promotionBanner", "title"], next)} max={60} />
              <Field label="Button Name" value={draft.promotionBanner.buttonName} onChange={(next) => updateDraft(["promotionBanner", "buttonName"], next)} max={30} />
              <Field label="Button Link" value={draft.promotionBanner.buttonLink} onChange={(next) => updateDraft(["promotionBanner", "buttonLink"], next)} max={120} />
              <Field label="Subtitle" value={draft.promotionBanner.subtitle} onChange={(next) => updateDraft(["promotionBanner", "subtitle"], next)} max={100} />
              <SelectField label="Display On" value={draft.promotionBanner.displayOn || "Desktop & Mobile"} onChange={(next) => updateDraft(["promotionBanner", "displayOn"], next)} options={["Desktop & Mobile", "Desktop Only", "Mobile Only"]} />
              <SelectField label="Status" value={normalizeStatus(draft.promotionBanner.status, "needsReview")} onChange={(next) => updateDraft(["promotionBanner", "status"], next)} options={["ready", "needsReview", "draft"]} />
              <div className="lg:col-span-3">
                <TextAreaField label="Description" value={draft.promotionBanner.description} onChange={(next) => updateDraft(["promotionBanner", "description"], next)} max={200} />
              </div>
            </div>
          </MerchandisingCard>

          <MerchandisingCard icon={Layers3} title="Featured Categories" description="Showcase top categories to help customers explore quickly." status={draft.featuredCategories.status || "ready"} enabled={draft.featuredCategories.enabled} onEnabledChange={(next) => updateDraft(["featuredCategories", "enabled"], next)}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Field label="Title" value={draft.featuredCategories.title} onChange={(next) => updateDraft(["featuredCategories", "title"], next)} max={60} />
              <SelectField label="Category Source" value={draft.featuredCategories.source || "Manually Selected"} onChange={(next) => updateDraft(["featuredCategories", "source"], next)} options={["Manually Selected", "Newest", "Most Popular"]} />
              <SelectField label="Category Limit" value={String(draft.featuredCategories.productsLimit || 6)} onChange={(next) => updateDraft(["featuredCategories", "productsLimit"], Number(next))} options={["4", "6", "8", "12"]} />
              <Field label="Subtitle" value={draft.featuredCategories.subtitle} onChange={(next) => updateDraft(["featuredCategories", "subtitle"], next)} max={100} />
              <Field label="Button Name" value={draft.featuredCategories.buttonName} onChange={(next) => updateDraft(["featuredCategories", "buttonName"], next)} max={30} />
              <Field label="Button Link" value={draft.featuredCategories.buttonLink} onChange={(next) => updateDraft(["featuredCategories", "buttonLink"], next)} max={120} />
              <div className="lg:col-span-3">
                <TextAreaField label="Description" value={draft.featuredCategories.description} onChange={(next) => updateDraft(["featuredCategories", "description"], next)} max={200} />
              </div>
            </div>
          </MerchandisingCard>

          <MerchandisingCard icon={ShoppingBag} title="Popular Products" description="Highlight best-selling and most-viewed products." status={draft.popularProducts.status || "ready"} enabled={draft.popularProducts.enabled} onEnabledChange={(next) => updateDraft(["popularProducts", "enabled"], next)}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Field label="Title" value={draft.popularProducts.title} onChange={(next) => updateDraft(["popularProducts", "title"], next)} max={60} />
              <SelectField label="Product Source" value={draft.popularProducts.source || "Best Selling"} onChange={(next) => updateDraft(["popularProducts", "source"], next)} options={["Best Selling", "Most Viewed", "Newest"]} />
              <SelectField label="Product Limit" value={String(draft.popularProducts.productsLimit || 8)} onChange={(next) => updateDraft(["popularProducts", "productsLimit"], Number(next))} options={["4", "8", "12", "16"]} />
              <Field label="Subtitle" value={draft.popularProducts.subtitle} onChange={(next) => updateDraft(["popularProducts", "subtitle"], next)} max={100} />
              <SelectField label="Filter By" value={draft.popularProducts.filterBy || "All Categories"} onChange={(next) => updateDraft(["popularProducts", "filterBy"], next)} options={["All Categories", "Featured", "Discounted"]} />
              <SelectField label="Sort By" value={draft.popularProducts.sortBy || "Best Selling"} onChange={(next) => updateDraft(["popularProducts", "sortBy"], next)} options={["Best Selling", "Newest", "Highest Rated"]} />
              <div className="lg:col-span-3">
                <TextAreaField label="Description" value={draft.popularProducts.description} onChange={(next) => updateDraft(["popularProducts", "description"], next)} max={200} />
              </div>
            </div>
          </MerchandisingCard>

          <MerchandisingCard icon={Truck} title="Quick Delivery Section" description="Highlight fast delivery and service benefits." status={draft.quickDelivery.status || "draft"} enabled={draft.quickDelivery.enabled} onEnabledChange={(next) => updateDraft(["quickDelivery", "enabled"], next)}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Field label="Title" value={draft.quickDelivery.title} onChange={(next) => updateDraft(["quickDelivery", "title"], next)} max={60} />
              <Field label="Button Name" value={draft.quickDelivery.buttonName} onChange={(next) => updateDraft(["quickDelivery", "buttonName"], next)} max={30} />
              <Field label="Button Link" value={draft.quickDelivery.buttonLink} onChange={(next) => updateDraft(["quickDelivery", "buttonLink"], next)} max={120} />
              <TextAreaField label="Description" value={draft.quickDelivery.description || draft.quickDelivery.subTitle} onChange={(next) => updateDraft(["quickDelivery", "description"], next)} max={200} />
              <div className="lg:col-span-2">
                <span className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Feature Points (Max 4)</span>
                <div className="space-y-2">
                  {(draft.quickDelivery.features || []).map((feature, index) => (
                    <div key={`${feature}-${index}`} className="flex items-center gap-2">
                      <input
                        value={feature}
                        onChange={(event) => {
                          const next = [...(draft.quickDelivery.features || [])];
                          next[index] = event.target.value;
                          updateDraft(["quickDelivery", "features"], next);
                        }}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => updateDraft(["quickDelivery", "features"], (draft.quickDelivery.features || []).filter((_, itemIndex) => itemIndex !== index))}
                        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 dark:border-slate-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </MerchandisingCard>
        </div>

        <aside className="space-y-4">
          <div className={`${cardClass} p-5`}>
            <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">Homepage Readiness</h2>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-full border-[7px] border-emerald-600 text-lg font-extrabold text-slate-950 dark:text-white">
                {completion}%
              </div>
              <div>
                <p className="font-extrabold text-emerald-700 dark:text-emerald-300">Almost there!</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Complete the pending items to publish your homepage.</p>
              </div>
            </div>
          </div>
          <div className={`${cardClass} p-5`}>
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">3 Pending Items</h2>
            <div className="mt-4 space-y-3">
              {pendingItems.map((item) => (
                <div key={item} className="flex gap-3 text-sm">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{item}</p>
                </div>
              ))}
            </div>
            <button type="button" className="mt-4 h-10 w-full rounded-xl border border-slate-200 text-sm font-extrabold text-slate-700 dark:border-slate-800 dark:text-slate-200">View All Suggestions</button>
          </div>
          <div className={`${cardClass} p-5`}>
            <h2 className="text-base font-extrabold text-slate-950 dark:text-white">Preview Storefront</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">See how your homepage looks on your live store.</p>
            <button type="button" onClick={onPreview} className="mt-4 h-11 w-full rounded-2xl border border-emerald-500 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">Preview Store</button>
            <button type="button" onClick={onPublish} disabled={isSaving || isPublishing} className="mt-3 h-11 w-full rounded-2xl bg-emerald-600 text-sm font-extrabold text-white disabled:opacity-60">{isPublishing ? "Publishing..." : "Publish Draft"}</button>
            <p className="mt-3 text-center text-xs font-medium text-slate-400">Last draft saved 2 minutes ago</p>
          </div>
        </aside>
      </section>

      <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
        <ShieldCheck className="h-4 w-4 text-emerald-600" />
        <span>Draft Mode: Changes are saved as draft and not visible to customers until published.</span>
        <span className="text-emerald-700 dark:text-emerald-300">Learn more about store customization</span>
      </div>
    </div>
  );
}

function MerchandisingCard({ icon: Icon, title, description, status, enabled, onEnabledChange, children }) {
  return (
    <article className={`${cardClass} p-5`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="min-w-0 break-words text-lg font-extrabold text-slate-950 dark:text-white">{title}</h2>
              <StatusChip value={status} />
            </div>
            <p className="mt-1 break-words text-sm text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Enable This Block</span>
          <Toggle checked={enabled} onChange={onEnabledChange} ariaLabel={`Toggle ${title}`} />
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </article>
  );
}
