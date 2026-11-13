import { useMemo, useRef, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Grid2X2,
  Grid3X3,
  Home,
  Image,
  Layers3,
  Link as LinkIcon,
  Mail,
  Megaphone,
  Monitor,
  Package,
  Phone,
  Plus,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Tag,
  Trash2,
  Truck,
  UploadCloud,
  X,
} from "lucide-react";
import { uploadAdminImage } from "../../../lib/adminApi.js";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import StoreCustomizationSaveActions2026 from "./StoreCustomizationSaveActions2026.jsx";
import "./StoreCustomizationHomeSettings2026.css";

const MAIN_SLIDER_LENGTH = 5;

const DEFAULT_CONFIG = {
  header: {
    headerText: "We're here to help you shop better!",
    phoneNumber: "+62821-8866-824",
    whatsAppLink: "https://wa.me/628218866824",
    headerLogoUrl: "",
    logoDataUrl: "",
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
      buttonLink: index === 0 ? "/shop" : "",
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
    title: "Karya Inovatif Mahasiswa & Edupreneur",
    subtitle: "Koleksi Eksklusif TP Preneurs",
    description: "Dukung karya technopreneur muda dengan produk kreatif dan solusi terbaik.",
    buttonName: "Jelajahi Produk",
    buttonLink: "/shop",
    imageDataUrl: "",
    displayOn: "Desktop & Mobile",
    status: "ready",
  },
  featuredCategories: {
    enabled: true,
    title: "Shop by Category",
    subtitle: "Explore our top categories",
    description: "Find the best products across our most popular categories.",
    source: "Manually Selected",
    productsLimit: 6,
    buttonName: "View All Categories",
    buttonLink: "/shop",
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
    buttonLink: "/shop",
    status: "ready",
  },
  quickDelivery: {
    enabled: true,
    subTitle: "PRODUK DIGITAL & INOVASI",
    title: "Belanja Online dengan Mudah",
    description: "Akses langsung produk digital, media belajar interaktif, dan karya riset mahasiswa.",
    buttonName: "Mulai Belanja",
    buttonLink: "/shop",
    imageDataUrl: "",
    displayOn: "Desktop & Mobile",
    status: "ready",
    features: [],
  },
  footer: {
    block1: {
      enabled: true,
      title: "Company",
      links: [
        { label: "About Us", href: "/about-us" },
        { label: "Contact Us", href: "/contact-us" },
        { label: "Careers", href: "#" },
        { label: "Latest News", href: "#" },
      ],
    },
    block2: {
      enabled: true,
      title: "Categories",
      links: [
        { label: "Electronics", href: "/search?category=electronics&page=1" },
        { label: "Fashion", href: "/search?category=fashion&page=1" },
        { label: "Grocery", href: "/search?category=grocery&page=1" },
        { label: "Books", href: "/search?category=books&page=1" },
      ],
    },
    block3: {
      enabled: true,
      title: "My Account",
      links: [
        { label: "Dashboard", href: "/user/dashboard" },
        { label: "My Orders", href: "/user/my-orders" },
        { label: "Recent Orders", href: "/user/dashboard" },
        { label: "Update Profile", href: "/user/update-profile" },
      ],
    },
    block4: {
      enabled: true,
      footerLogoDataUrl: "",
      address: "Fakultas Ilmu Pendidikan Kampus UNM Tidung Jl. Tamalate 1 Makassar",
      phone: "+62821-8866-824",
      email: "tp.fip@unm.ac.id",
    },
    socialLinks: {
      enabled: true,
      facebook: "https://www.facebook.com/",
      twitter: "https://twitter.com/",
      pinterest: "",
      linkedin: "https://www.linkedin.com/",
      whatsapp: "https://web.whatsapp.com/",
    },
    paymentMethod: {
      enabled: true,
      imageDataUrl: "",
    },
    bottomContact: {
      enabled: true,
      contactNumber: "+62821-8866-824",
    },
    newsletter: {
      enabled: true,
      title: "Berlangganan Newsletter & Info Inovasi",
      subtitle: "Dapatkan update katalog produk kreatif mahasiswa dan penawaran spesial.",
      productStatTitle: "Karya Inovatif Mahasiswa & Edupreneur",
      productStatSubtitle: "Katalog Produk Asli & Terverifikasi",
      buttonText: "Berlangganan",
      status: "ready",
    },
  },
};

const MENU_LABEL_FIELDS = [
  { key: "categories", labelEn: "Categories", labelId: "Kategori" },
  { key: "aboutUs", labelEn: "About Us", labelId: "Tentang Kami" },
  { key: "contactUs", labelEn: "Contact", labelId: "Kontak" },
  { key: "offers", labelEn: "Offers", labelId: "Penawaran" },
  { key: "faq", labelEn: "FAQ", labelId: "Tanya Jawab" },
  { key: "privacyPolicy", labelEn: "Privacy Policy", labelId: "Kebijakan Privasi" },
  { key: "termsAndConditions", labelEn: "Terms & Conditions", labelId: "Syarat & Ketentuan" },
  { key: "pages", labelEn: "Pages", labelId: "Halaman" },
  { key: "myAccount", labelEn: "My Account", labelId: "Akun Saya" },
  { key: "login", labelEn: "Login", labelId: "Masuk" },
  { key: "logout", labelEn: "Logout", labelId: "Keluar" },
  { key: "checkout", labelEn: "Checkout", labelId: "Checkout" },
];

const VISIBILITY_FIELDS = [
  { key: "showCategories", labelEn: "Show Categories", labelId: "Tampilkan Kategori" },
  { key: "showAboutUs", labelEn: "Show About Us", labelId: "Tampilkan Tentang Kami" },
  { key: "showContactUs", labelEn: "Show Contact", labelId: "Tampilkan Kontak" },
  { key: "showOffers", labelEn: "Show Offers", labelId: "Tampilkan Penawaran" },
  { key: "showFaq", labelEn: "Show FAQ", labelId: "Tampilkan FAQ" },
  { key: "showPrivacyPolicy", labelEn: "Show Privacy Policy", labelId: "Tampilkan Privasi" },
  { key: "showTermsAndConditions", labelEn: "Show Terms & Conditions", labelId: "Tampilkan Syarat Ketentuan" },
];

const FOOTER_LINK_BLOCKS = [
  { key: "block1", titleEn: "Company", titleId: "Perusahaan" },
  { key: "block2", titleEn: "Categories", titleId: "Kategori Belanja" },
  { key: "block3", titleEn: "My Account", titleId: "Akun Pengguna" },
];

const FOOTER_SOCIAL_FIELDS = [
  { key: "facebook", label: "Facebook" },
  { key: "twitter", label: "Twitter / X" },
  { key: "pinterest", label: "Pinterest" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "whatsapp", label: "WhatsApp" },
];

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

const normalizeFooterBlock = (value, fallback) => {
  const source = isPlainObject(value) ? value : {};
  const links = Array.isArray(source.links) ? source.links : fallback.links;
  return {
    ...fallback,
    ...source,
    links: links
      .map((item, index) => {
        const sourceItem = isPlainObject(item) ? item : {};
        const fallbackItem = fallback.links[index] || { label: "", href: "" };
        return {
          label: toText(sourceItem.label, fallbackItem.label),
          href: toText(sourceItem.href, fallbackItem.href),
        };
      })
      .filter((item) => item.label || item.href),
  };
};

const normalizeLink = (value, fallback = "/shop") => {
  const text = toText(value);
  if (!text || text === "#") return fallback;
  return text.startsWith("/") || text.startsWith("http://") || text.startsWith("https://")
    ? text
    : `/${text}`;
};

const normalizeStatus = (value, fallback = "ready") => {
  const normalized = toText(value, fallback).toLowerCase();
  return normalized.replace(/\s+/g, "");
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

// Reusable Form Field
function ScField({
  label,
  value,
  onChange,
  max = 100,
  type = "text",
  placeholder = "",
  hint = "",
}) {
  return (
    <label className="block min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="sc-input-label">{label}</span>
        {hint ? <span className="text-[10px] text-slate-400">{hint}</span> : null}
      </div>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="sc-input"
      />
    </label>
  );
}

// Reusable Textarea Field
function ScTextAreaField({ label, value, onChange, max = 200, placeholder = "" }) {
  return (
    <label className="block min-w-0">
      <span className="sc-input-label">{label}</span>
      <textarea
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="sc-textarea"
      />
    </label>
  );
}

// Reusable Select Field
function ScSelectField({ label, value, onChange, options = [] }) {
  return (
    <label className="block min-w-0">
      <span className="sc-input-label">{label}</span>
      <select
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        className="sc-select"
      >
        {options.map((option) => {
          const val = typeof option === "object" ? option.value : option;
          const lab = typeof option === "object" ? option.label : option;
          return (
            <option key={val} value={val}>
              {lab}
            </option>
          );
        })}
      </select>
    </label>
  );
}

// Brand Switch Toggle (#034c85 & #fe6f05)
function ScToggle({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-pressed={Boolean(checked)}
      onClick={() => onChange(!checked)}
      className={`sc-toggle-btn ${checked ? "is-active" : ""}`}
    >
      <span className="sc-toggle-thumb" />
    </button>
  );
}

// Yes / No Segmented Toggle
function ScYesNoToggle({ checked, onChange, yesLabel = "Yes", noLabel = "No" }) {
  return (
    <div className="sc-yesno-toggle">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`sc-yesno-btn ${checked ? "is-selected" : ""}`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`sc-yesno-btn ${!checked ? "is-selected" : ""}`}
      >
        {noLabel}
      </button>
    </div>
  );
}

// Section Header Primitive
function ScSectionTitle({ icon: Icon, title, description, action }) {
  return (
    <div className="sc-section-header">
      <div className="sc-section-title-wrap">
        <span className="sc-section-icon">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="sc-section-title">{title}</h2>
          {description ? <p className="sc-section-desc">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

// Status Chip
function ScStatusChip({ value, isId = false }) {
  const norm = normalizeStatus(value);
  if (norm === "needsreview") {
    return (
      <span className="sc-status-badge sc-status-review">
        {isId ? "Perlu Ditinjau" : "Needs Review"}
      </span>
    );
  }
  if (norm === "draft" || norm === "off") {
    return (
      <span className="sc-status-badge sc-status-draft">
        {isId ? "Draf" : "Draft"}
      </span>
    );
  }
  return (
    <span className="sc-status-badge sc-status-ready">
      <CheckCircle2 className="h-3 w-3 text-[#fe6f05]" />
      <span>{isId ? "Aktif" : "Active"}</span>
    </span>
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
  isLoading,
  meta = {},
  language = "en",
}) {
  const { i18n } = useTranslation();
  const isId = Boolean(
    i18n.language?.toLowerCase().startsWith("id") ||
    String(language || "").toLowerCase().startsWith("id")
  );

  const [selectedSliderIndex, setSelectedSliderIndex] = useState(0);
  const [activeSliderTab, setActiveSliderTab] = useState("slider-0");
  const [couponInput, setCouponInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isUploadingSliderImage, setIsUploadingSliderImage] = useState(false);
  const [imageUploadErrors, setImageUploadErrors] = useState({});
  const [uploadingImageKey, setUploadingImageKey] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("mainSlider");

  const fileInputRef = useRef(null);
  const sectionRefs = useRef({});

  const draft = useMemo(() => {
    const source = isPlainObject(value) ? value : {};
    return mergeDeep(DEFAULT_CONFIG, source);
  }, [value]);

  const currentSlider =
    draft.mainSlider?.sliders?.[selectedSliderIndex] ||
    DEFAULT_CONFIG.mainSlider.sliders[0];

  const updateDraft = (path, nextValue) => {
    onChange?.(cloneWithPath(draft, path, nextValue));
  };

  const updateSlider = (field, nextValue) => {
    updateDraft(["mainSlider", "sliders", selectedSliderIndex, field], nextValue);
  };

  const registerSectionRef = (key) => (node) => {
    if (node) sectionRefs.current[key] = node;
  };

  const scrollToSection = (key) => {
    setActiveSectionId(key);
    const target = sectionRefs.current[key];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const uploadSliderImage = async (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setUploadError(isId ? "Gunakan format JPG, PNG, atau WEBP." : "Use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setUploadError(isId ? "Ukuran file maksimal 2MB." : "Max file size is 2MB.");
      return;
    }
    setIsUploadingSliderImage(true);
    try {
      const result = await uploadAdminImage(file);
      const uploadedUrl = String(result?.url || result?.data?.url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Upload succeeded without image URL.");
      }
      setUploadError("");
      updateSlider("imageDataUrl", uploadedUrl);
    } catch (error) {
      setUploadError(error?.response?.data?.message || error?.message || "Failed to upload.");
    } finally {
      setIsUploadingSliderImage(false);
    }
  };

  const uploadImageForPath = async (imageKey, path, file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageUploadErrors((prev) => ({
        ...prev,
        [imageKey]: isId ? "Gunakan JPG, PNG, atau WEBP." : "Use JPG, PNG, or WEBP.",
      }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImageUploadErrors((prev) => ({
        ...prev,
        [imageKey]: isId ? "Ukuran file maksimal 2MB." : "Max file size is 2MB.",
      }));
      return;
    }

    setUploadingImageKey(imageKey);
    try {
      const result = await uploadAdminImage(file);
      const uploadedUrl = String(result?.url || result?.data?.url || "").trim();
      if (!uploadedUrl) throw new Error("Upload succeeded without image URL.");
      setImageUploadErrors((prev) => ({ ...prev, [imageKey]: "" }));
      updateDraft(path, uploadedUrl);
    } catch (error) {
      setImageUploadErrors((prev) => ({
        ...prev,
        [imageKey]: error?.response?.data?.message || error?.message || "Failed to upload.",
      }));
    } finally {
      setUploadingImageKey("");
    }
  };

  const removeHeaderLogo = () => {
    onChange?.(
      cloneWithPath(
        cloneWithPath(draft, ["header", "headerLogoUrl"], ""),
        ["header", "logoDataUrl"],
        ""
      )
    );
  };

  const addCoupon = () => {
    const parsed = couponInput
      .split(",")
      .map((item) => item.trim().toUpperCase())
      .filter(Boolean);
    if (!parsed.length) return;
    const currentList = draft.discountCouponBox?.activeCouponCodes || [];
    const next = [...new Set([...currentList, ...parsed])];
    updateDraft(["discountCouponBox", "activeCouponCodes"], next);
    setCouponInput("");
  };

  const removeCoupon = (code) => {
    const currentList = draft.discountCouponBox?.activeCouponCodes || [];
    updateDraft(
      ["discountCouponBox", "activeCouponCodes"],
      currentList.filter((item) => item !== code)
    );
  };

  const updateFooterLink = (blockKey, index, field, nextValue) => {
    const links = [...(draft.footer?.[blockKey]?.links || [])];
    links[index] = {
      ...(links[index] || { label: "", href: "" }),
      [field]: nextValue,
    };
    updateDraft(["footer", blockKey, "links"], links);
  };

  const addFooterLink = (blockKey) => {
    const current = draft.footer?.[blockKey]?.links || [];
    updateDraft(["footer", blockKey, "links"], [
      ...current,
      { label: isId ? "Tautan Baru" : "New Link", href: "#" },
    ]);
  };

  const removeFooterLink = (blockKey, index) => {
    const current = draft.footer?.[blockKey]?.links || [];
    updateDraft(
      ["footer", blockKey, "links"],
      current.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const generateWaLink = () => {
    const phone = toText(draft.header?.phoneNumber || "");
    const cleaned = phone.replace(/[^\d]/g, "");
    const supportText = toText(draft.header?.headerText || "Halo TP Preneurs");
    const link = `https://wa.me/${cleaned}?text=${encodeURIComponent(supportText)}`;
    updateDraft(["header", "whatsAppLink"], link);
  };

  // Section items for Quick Jump Nav
  const sectionsList = [
    { key: "mainSlider", labelEn: "Hero Slider", labelId: "Slider Banner", icon: Image },
    { key: "couponBox", labelEn: "Coupons", labelId: "Kupon Diskon", icon: Tag },
    { key: "headerSection", labelEn: "Header & Menu", labelId: "Header & Menu", icon: Store },
    { key: "promotionBanner", labelEn: "Promo Banner", labelId: "Banner Promosi", icon: Megaphone },
    { key: "featuredCategories", labelEn: "Categories", labelId: "Kategori Unggulan", icon: Layers3 },
    { key: "popularProducts", labelEn: "Products", labelId: "Produk Populer", icon: ShoppingBag },
    { key: "quickDelivery", labelEn: "Innovation Showcase", labelId: "Showcase Inovasi", icon: Sparkles },
    { key: "newsletter", labelEn: "Newsletter", labelId: "Newsletter", icon: Mail },
    { key: "footerLinks", labelEn: "Footer & Contact", labelId: "Footer & Kontak", icon: LinkIcon },
  ];

  return (
    <div className="sc-container text-slate-900 dark:text-slate-100">
      {/* Page Header */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {isId ? "Kustomisasi Toko" : "Store Customization"}
            </h1>
            <span className="sc-status-badge sc-status-ready">
              {isId ? "Halaman Utama" : "Home Page"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {isId
              ? "Kelola seksi homepage, banner promosi, label navigasi, dan etalase storefront."
              : "Manage homepage sections, promotional banners, menu labels, and storefront content."}
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

      {/* Tab Navigation */}
      <StoreCustomizationTabNav2026 activeTab={activeTab} onTabChange={onTabChange} />

      {/* Modern Quick Section Navigator (Pill Jump Bar) */}
      <nav aria-label="Quick section navigation" className="sc-quick-nav">
        {sectionsList.map((sec) => {
          const SecIcon = sec.icon;
          const isActive = activeSectionId === sec.key;
          return (
            <button
              key={sec.key}
              type="button"
              onClick={() => scrollToSection(sec.key)}
              className={`sc-quick-pill ${isActive ? "is-active" : ""}`}
            >
              <SecIcon className="h-3.5 w-3.5" />
              <span>{isId ? sec.labelId : sec.labelEn}</span>
            </button>
          );
        })}
      </nav>

      {/* SECTION 1: MAIN SLIDER */}
      <section ref={registerSectionRef("mainSlider")} className="sc-card scroll-mt-36">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="sc-section-icon">
              <Image className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="sc-section-title">
                  {isId ? "Slider Banner Utama" : "Main Hero Slider"}
                </h2>
                <ScStatusChip value="ready" isId={isId} />
              </div>
              <p className="sc-section-desc">
                {isId
                  ? "Atur banner slider hero yang tampil di baris teratas halaman beranda."
                  : "Configure the top hero banner carousel displayed on your homepage."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPreview}
              className="sc-btn-secondary h-9 text-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{isId ? "Pratinjau Toko" : "Storefront Preview"}</span>
            </button>
          </div>
        </div>

        {/* Slider Index Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
          {Array.from({ length: MAIN_SLIDER_LENGTH }, (_, index) => {
            const key = `slider-${index}`;
            const isSelected = activeSliderTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setSelectedSliderIndex(index);
                  setActiveSliderTab(key);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[#034c85] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {isId ? `Slide ${index + 1}` : `Slider ${index + 1}`}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setActiveSliderTab("options")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeSliderTab === "options"
                ? "bg-[#fe6f05] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
            }`}
          >
            {isId ? "Opsi Carousel" : "Carousel Options"}
          </button>
        </div>

        {activeSliderTab === "options" ? (
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="sc-input-label mb-2">
                {isId ? "Tampilkan Panah Navigasi" : "Show Arrows"}
              </span>
              <ScYesNoToggle
                checked={Boolean(draft.mainSlider?.options?.showArrows)}
                onChange={(next) => updateDraft(["mainSlider", "options", "showArrows"], next)}
                yesLabel={isId ? "Ya" : "Yes"}
                noLabel={isId ? "Tidak" : "No"}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="sc-input-label mb-2">
                {isId ? "Tampilkan Titik Navigasi" : "Show Dots"}
              </span>
              <ScYesNoToggle
                checked={Boolean(draft.mainSlider?.options?.showDots)}
                onChange={(next) => updateDraft(["mainSlider", "options", "showDots"], next)}
                yesLabel={isId ? "Ya" : "Yes"}
                noLabel={isId ? "Tidak" : "No"}
              />
            </div>

            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <span className="sc-input-label mb-2">
                {isId ? "Putar Otomatis (Auto Slide)" : "Auto Slide"}
              </span>
              <ScYesNoToggle
                checked={Boolean(draft.mainSlider?.options?.autoplayEnabled)}
                onChange={(next) => updateDraft(["mainSlider", "options", "autoplayEnabled"], next)}
                yesLabel={isId ? "Ya" : "Yes"}
                noLabel={isId ? "Tidak" : "No"}
              />
            </div>

            <ScSelectField
              label={isId ? "Durasi Putar (Detik)" : "Slide Duration (Seconds)"}
              value={String(draft.mainSlider?.options?.autoplayDelaySeconds || 5)}
              onChange={(next) => updateDraft(["mainSlider", "options", "autoplayDelaySeconds"], Number(next))}
              options={[
                { value: "3", label: "3 Seconds" },
                { value: "5", label: "5 Seconds (Default)" },
                { value: "8", label: "8 Seconds" },
                { value: "10", label: "10 Seconds" },
              ]}
            />
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
            {/* Upload Zone */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="sc-input-label">
                  {isId ? "Gambar Banner Slider" : "Slider Image"}
                </span>
                <span className="sc-spec-chip">1200×400 px • 3:1</span>
              </div>

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

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  uploadSliderImage(e.dataTransfer?.files?.[0]);
                }}
                className="sc-upload-zone"
              >
                <UploadCloud className="h-9 w-9 text-[#034c85] dark:text-blue-400" />
                <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isUploadingSliderImage
                    ? (isId ? "Sedang mengunggah..." : "Uploading image...")
                    : (isId ? "Tarik & lepas gambar atau klik untuk unggah" : "Drag & drop image or click to upload")}
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5 justify-center">
                  <span className="sc-spec-chip">Maks 2MB</span>
                  <span className="sc-spec-chip">JPG / PNG / WEBP</span>
                </div>
              </div>

              {uploadError ? (
                <p className="text-xs font-semibold text-rose-600">{uploadError}</p>
              ) : null}

              {currentSlider.imageDataUrl ? (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentSlider.imageDataUrl}
                      alt="Slider thumb"
                      className="h-10 w-24 rounded-lg object-cover"
                    />
                    <span className="text-xs font-semibold truncate text-slate-600 dark:text-slate-300">
                      {isId ? "Gambar Terunggah" : "Uploaded Image"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSlider("imageDataUrl", "")}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title={isId ? "Hapus Gambar" : "Remove Image"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Inputs & Live Mini Preview */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <ScField
                  label={isId ? "Judul Slider" : "Slider Title"}
                  value={currentSlider.title}
                  onChange={(next) => updateSlider("title", next)}
                  placeholder={isId ? "Contoh: Promo Spesial Dies Natalis" : "Summer Sale is Live!"}
                />
                <ScField
                  label={isId ? "Teks Tombol" : "Button Label"}
                  value={currentSlider.buttonName}
                  onChange={(next) => updateSlider("buttonName", next)}
                  placeholder={isId ? "Beli Sekarang" : "Shop Now"}
                />
                <ScField
                  label={isId ? "Tautan Tombol" : "Button Link"}
                  value={currentSlider.buttonLink}
                  onChange={(next) => updateSlider("buttonLink", next)}
                  placeholder="/shop"
                />
                <ScSelectField
                  label={isId ? "Fokus Posisi Gambar" : "Image Focus"}
                  value={currentSlider.imageFocus || "right"}
                  onChange={(next) => updateSlider("imageFocus", next)}
                  options={[
                    { value: "right", label: isId ? "Kanan (Right)" : "Right" },
                    { value: "center", label: isId ? "Tengah (Center)" : "Center" },
                    { value: "left", label: isId ? "Kiri (Left)" : "Left" },
                  ]}
                />
              </div>

              <ScTextAreaField
                label={isId ? "Deskripsi Ringkas" : "Short Description"}
                value={currentSlider.description}
                onChange={(next) => updateSlider("description", next)}
                placeholder={isId ? "Dapatkan diskon eksklusif karya inovatif mahasiswa." : "Up to 50% off on selected items."}
              />

              {/* Storefront Mini Preview */}
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-r from-[#034c85] via-[#023b67] to-[#012543] p-4 text-white shadow-sm dark:border-slate-800">
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-200">
                    {isId ? "Pratinjau Banner Storefront" : "Storefront Slider Preview"}
                  </span>
                  <span className="text-[10px] text-blue-200">TP PRENEURS</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-black truncate text-white">
                      {currentSlider.title || (isId ? "Judul Banner Promosi" : "Promotion Banner Title")}
                    </h3>
                    <p className="text-xs text-blue-100 line-clamp-2">
                      {currentSlider.description || (isId ? "Deskripsi produk dan penawaran karya inovatif." : "Description of featured products and offers.")}
                    </p>
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#fe6f05] px-3 py-1 text-xs font-bold text-white shadow-sm">
                        {currentSlider.buttonName || (isId ? "Jelajahi" : "Explore")} →
                      </span>
                    </div>
                  </div>
                  {currentSlider.imageDataUrl ? (
                    <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg border border-white/20">
                      <img
                        src={currentSlider.imageDataUrl}
                        alt="Slider preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 2: DISCOUNT COUPON BOX */}
      <section ref={registerSectionRef("couponBox")} className="sc-card scroll-mt-36">
        <ScSectionTitle
          icon={Tag}
          title={isId ? "Kotak Kupon Diskon" : "Discount Coupon Box"}
          description={
            isId
              ? "Kelola kode kupon aktif yang tampil di sebelah kanan slider utama beranda."
              : "Enable and manage active coupon codes shown on the right side of the hero slider."
          }
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isId ? "Aktifkan Kupon" : "Enable Box"}
              </span>
              <ScToggle
                checked={Boolean(draft.discountCouponBox?.enabled)}
                onChange={(next) => updateDraft(["discountCouponBox", "enabled"], next)}
                ariaLabel="Toggle discount coupon box"
              />
            </div>
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
          <ScField
            label={isId ? "Judul Kotak Kupon" : "Coupon Box Title"}
            value={draft.discountCouponBox?.title}
            onChange={(next) => updateDraft(["discountCouponBox", "title"], next)}
            placeholder={isId ? "Gunakan kupon spesial untuk potongan harga!" : "Grab extra savings with our exclusive coupons!"}
          />

          <div>
            <span className="sc-input-label mb-1.5 block">
              {isId ? "Daftar Kode Kupon Aktif" : "Active Coupon Codes"}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(draft.discountCouponBox?.activeCouponCodes || []).map((code) => (
                <span
                  key={code}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#034c85]/20 bg-[#034c85]/10 px-2.5 py-1 text-xs font-black text-[#034c85] dark:bg-[#034c85]/25 dark:text-blue-300 dark:border-blue-400/30"
                >
                  <span>{code}</span>
                  <button
                    type="button"
                    onClick={() => removeCoupon(code)}
                    className="hover:text-rose-600 transition"
                    title={isId ? `Hapus ${code}` : `Remove ${code}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addCoupon();
                    }
                  }}
                  placeholder="KODEKUPON"
                  className="h-8 w-28 rounded-lg border border-slate-300 bg-white px-2 text-xs font-bold uppercase text-slate-800 outline-none focus:border-[#034c85] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <button
                  type="button"
                  onClick={addCoupon}
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-[#034c85] px-2.5 text-xs font-bold text-white hover:bg-[#023a66] transition shadow-sm"
                >
                  <Plus className="h-3 w-3" />
                  <span>{isId ? "Tambah" : "Add"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: HEADER & TOP BAR */}
      <section ref={registerSectionRef("headerSection")} className="sc-card scroll-mt-36">
        <ScSectionTitle
          icon={Store}
          title={isId ? "Header & Menu Navigasi" : "Header & Navigation Bar"}
          description={
            isId
              ? "Kelola informasi kontak layanan bantuan, WhatsApp, logo header, dan label menu utama."
              : "Update customer support contacts, WhatsApp link, header logo, and navigation labels."
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
          <ScField
            label={isId ? "Teks Bantuan Customer" : "Customer Support Text"}
            value={draft.header?.headerText}
            onChange={(next) => updateDraft(["header", "headerText"], next)}
            placeholder="+62821-8866-824"
          />
          <ScField
            label={isId ? "Nomor Telepon Toko" : "Store Phone Number"}
            value={draft.header?.phoneNumber}
            onChange={(next) => updateDraft(["header", "phoneNumber"], next)}
            placeholder="+62821-8866-824"
          />
          <div className="flex flex-col justify-end">
            <span className="sc-input-label mb-1">
              {isId ? "Tautan WhatsApp Resmi" : "Official WhatsApp Link"}
            </span>
            <div className="flex gap-2">
              <input
                type="url"
                value={draft.header?.whatsAppLink || ""}
                onChange={(e) => updateDraft(["header", "whatsAppLink"], e.target.value)}
                className="sc-input flex-1"
                placeholder="https://wa.me/628218866824"
              />
              <button
                type="button"
                onClick={generateWaLink}
                className="sc-btn-secondary h-10 shrink-0 px-3 text-xs"
                title={isId ? "Buat Tautan WA Otomatis" : "Generate WhatsApp Link"}
              >
                <Phone className="h-3.5 w-3.5 text-[#fe6f05]" />
                <span className="hidden sm:inline">{isId ? "Buat Link" : "Generate"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Header Logo Upload */}
        <div className="mt-4 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isId ? "Logo Khusus Header" : "Header Logo"}
                </span>
                <span className="sc-spec-chip">PNG / SVG / WEBP • Maks 2MB</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                {isId
                  ? "Tampil di navbar teratas storefront. Jika kosong, logo default workspace digunakan."
                  : "Displayed in the storefront header. If empty, default workspace logo is used."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="sc-btn-secondary h-9 cursor-pointer text-xs">
                <UploadCloud className="h-3.5 w-3.5 text-[#fe6f05]" />
                <span>
                  {uploadingImageKey === "headerLogo"
                    ? (isId ? "Mengunggah..." : "Uploading...")
                    : (isId ? "Unggah Logo" : "Upload Logo")}
                </span>
                <input
                  type="file"
                  accept=".png,.jpeg,.jpg,.webp,.svg"
                  className="hidden"
                  disabled={uploadingImageKey === "headerLogo"}
                  onChange={async (e) => {
                    await uploadImageForPath("headerLogo", ["header", "headerLogoUrl"], e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>

              {toText(draft.header?.headerLogoUrl || draft.header?.logoDataUrl) ? (
                <button
                  type="button"
                  onClick={removeHeaderLogo}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isId ? "Hapus" : "Remove"}</span>
                </button>
              ) : null}
            </div>
          </div>

          {toText(draft.header?.headerLogoUrl || draft.header?.logoDataUrl) ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
              <img
                src={draft.header?.headerLogoUrl || draft.header?.logoDataUrl}
                alt="Header Logo"
                className="h-10 max-w-[160px] object-contain bg-white dark:bg-slate-950 p-1 rounded"
              />
              <span className="text-xs font-semibold text-slate-500">
                {isId ? "Logo header aktif" : "Active header logo"}
              </span>
            </div>
          ) : null}
        </div>

        {/* Menu Labels */}
        <div className="mt-5 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 className="h-4 w-4 text-[#034c85] dark:text-blue-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isId ? "Label Teks Menu Navigasi" : "Main Navigation Menu Labels"}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {MENU_LABEL_FIELDS.map((item) => (
              <label key={item.key} className="block min-w-0">
                <span className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 truncate">
                  {isId ? item.labelId : item.labelEn}
                </span>
                <input
                  type="text"
                  value={draft.menuEditor?.labels?.[item.key] || ""}
                  onChange={(e) => updateDraft(["menuEditor", "labels", item.key], e.target.value)}
                  className="sc-input h-8 text-xs px-2"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Visibility Controls */}
        <div className="mt-4 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="h-4 w-4 text-[#fe6f05]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {isId ? "Kontrol Visibilitas Menu" : "Menu Visibility Controls"}
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {VISIBILITY_FIELDS.map((item) => (
              <div key={item.key} className="rounded-xl border border-slate-200 p-2.5 dark:border-slate-800">
                <span className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 truncate">
                  {isId ? item.labelId : item.labelEn}
                </span>
                <ScYesNoToggle
                  checked={Boolean(draft.menuEditor?.enabled?.[item.key])}
                  onChange={(next) => updateDraft(["menuEditor", "enabled", item.key], next)}
                  yesLabel={isId ? "Tampil" : "Show"}
                  noLabel={isId ? "Sembunyi" : "Hide"}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: PROMOTION BANNER */}
      <section ref={registerSectionRef("promotionBanner")} className="sc-card scroll-mt-36">
        <ScSectionTitle
          icon={Megaphone}
          title={isId ? "Banner Promosi" : "Promotion Banner"}
          description={
            isId
              ? "Tampilkan banner promosi untuk menonjolkan penawaran karya inovatif."
              : "Highlight special student innovation campaigns and promotional offers."
          }
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isId ? "Aktifkan Banner" : "Enable Block"}
              </span>
              <ScToggle
                checked={Boolean(draft.promotionBanner?.enabled)}
                onChange={(next) => updateDraft(["promotionBanner", "enabled"], next)}
                ariaLabel="Toggle promotion banner"
              />
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          <ScField
            label={isId ? "Judul Utama" : "Title"}
            value={draft.promotionBanner?.title}
            onChange={(next) => updateDraft(["promotionBanner", "title"], next)}
            placeholder={isId ? "Karya Inovatif Mahasiswa & Edupreneur" : "Innovative Student & Edupreneur Creation"}
          />
          <ScField
            label={isId ? "Subjudul / Eyebrow" : "Subtitle"}
            value={draft.promotionBanner?.subtitle}
            onChange={(next) => updateDraft(["promotionBanner", "subtitle"], next)}
            placeholder={isId ? "Koleksi Eksklusif TP Preneurs" : "TP Preneurs Exclusive Collection"}
          />
          <ScField
            label={isId ? "Label Tombol" : "Button Name"}
            value={draft.promotionBanner?.buttonName}
            onChange={(next) => updateDraft(["promotionBanner", "buttonName"], next)}
            placeholder={isId ? "Jelajahi Produk" : "Explore Products"}
          />
          <ScField
            label={isId ? "Tautan Tombol" : "Button Link"}
            value={draft.promotionBanner?.buttonLink}
            onChange={(next) => updateDraft(["promotionBanner", "buttonLink"], next)}
            placeholder="/shop"
          />
          <ScSelectField
            label={isId ? "Tampilkan Pada" : "Display On"}
            value={draft.promotionBanner?.displayOn || "Desktop & Mobile"}
            onChange={(next) => updateDraft(["promotionBanner", "displayOn"], next)}
            options={[
              { value: "Desktop & Mobile", label: "Desktop & Mobile" },
              { value: "Desktop Only", label: "Desktop Only" },
              { value: "Mobile Only", label: "Mobile Only" },
            ]}
          />
          <ScSelectField
            label={isId ? "Status Banner" : "Status"}
            value={normalizeStatus(draft.promotionBanner?.status, "ready")}
            onChange={(next) => updateDraft(["promotionBanner", "status"], next)}
            options={[
              { value: "ready", label: isId ? "Siap / Aktif" : "Ready / Active" },
              { value: "needsreview", label: isId ? "Perlu Ditinjau" : "Needs Review" },
              { value: "draft", label: isId ? "Draf" : "Draft" },
            ]}
          />
        </div>

        <div className="mt-3.5">
          <ScTextAreaField
            label={isId ? "Deskripsi Promosi" : "Description"}
            value={draft.promotionBanner?.description}
            onChange={(next) => updateDraft(["promotionBanner", "description"], next)}
            placeholder={isId ? "Dukung karya technopreneur muda dengan produk kreatif..." : "Support young technopreneurs with creative solutions..."}
          />
        </div>

        {/* Upload & Live Preview */}
        <div className="mt-4 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isId ? "Gambar Latar Banner Promosi" : "Promotion Banner Image"}
                </span>
                <span className="sc-spec-chip">16:9 • Maks 2MB</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isId ? "Format JPG, PNG, atau WEBP." : "JPG, PNG, or WEBP format."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="sc-btn-secondary h-9 cursor-pointer text-xs">
                <UploadCloud className="h-3.5 w-3.5 text-[#fe6f05]" />
                <span>
                  {uploadingImageKey === "promotionBanner"
                    ? (isId ? "Mengunggah..." : "Uploading...")
                    : (isId ? "Unggah Gambar" : "Upload Image")}
                </span>
                <input
                  type="file"
                  accept=".png,.jpeg,.jpg,.webp"
                  className="hidden"
                  disabled={uploadingImageKey === "promotionBanner"}
                  onChange={async (e) => {
                    await uploadImageForPath("promotionBanner", ["promotionBanner", "imageDataUrl"], e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>

              {draft.promotionBanner?.imageDataUrl ? (
                <button
                  type="button"
                  onClick={() => updateDraft(["promotionBanner", "imageDataUrl"], "")}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isId ? "Hapus" : "Remove"}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Mini Live Preview */}
          <div className="mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#034c85] via-[#023b67] to-[#012543] p-4 text-white shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                {draft.promotionBanner?.subtitle ? (
                  <span className="inline-block rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold text-orange-200">
                    {draft.promotionBanner.subtitle}
                  </span>
                ) : null}
                <h4 className="text-base font-black truncate text-white">
                  {draft.promotionBanner?.title || (isId ? "Karya Inovatif Mahasiswa" : "Innovative Student Creations")}
                </h4>
                <p className="text-xs text-blue-100 line-clamp-1">
                  {draft.promotionBanner?.description || (isId ? "Deskripsi banner promosi." : "Promotional banner description.")}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fe6f05] px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {draft.promotionBanner?.buttonName || (isId ? "Jelajahi" : "Explore")} →
                  </span>
                </div>
              </div>
              {draft.promotionBanner?.imageDataUrl ? (
                <img
                  src={draft.promotionBanner.imageDataUrl}
                  alt="Promo preview"
                  className="h-20 w-32 rounded-lg object-cover border border-white/20"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: FEATURED CATEGORIES & POPULAR PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Featured Categories */}
        <section ref={registerSectionRef("featuredCategories")} className="sc-card scroll-mt-36">
          <ScSectionTitle
            icon={Layers3}
            title={isId ? "Kategori Unggulan" : "Featured Categories"}
            description={
              isId
                ? "Sorot kategori terpopuler untuk membantu pembeli menjelajah katalog."
                : "Showcase top categories to help customers explore quickly."
            }
            action={
              <ScToggle
                checked={Boolean(draft.featuredCategories?.enabled)}
                onChange={(next) => updateDraft(["featuredCategories", "enabled"], next)}
                ariaLabel="Toggle featured categories"
              />
            }
          />

          <div className="space-y-3.5 mt-4">
            <ScField
              label={isId ? "Judul Seksi" : "Section Title"}
              value={draft.featuredCategories?.title}
              onChange={(next) => updateDraft(["featuredCategories", "title"], next)}
              placeholder="Featured Categories"
            />
            <div className="grid grid-cols-2 gap-3">
              <ScSelectField
                label={isId ? "Sumber Kategori" : "Category Source"}
                value={draft.featuredCategories?.source || "Manually Selected"}
                onChange={(next) => updateDraft(["featuredCategories", "source"], next)}
                options={[
                  { value: "Manually Selected", label: isId ? "Pilihan Manual" : "Manually Selected" },
                  { value: "Newest", label: isId ? "Terbaru" : "Newest" },
                  { value: "Most Popular", label: isId ? "Terpopuler" : "Most Popular" },
                ]}
              />
              <ScSelectField
                label={isId ? "Batas Jumlah" : "Category Limit"}
                value={String(draft.featuredCategories?.productsLimit || 6)}
                onChange={(next) => updateDraft(["featuredCategories", "productsLimit"], Number(next))}
                options={["4", "6", "8", "12"]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ScField
                label={isId ? "Subjudul" : "Subtitle"}
                value={draft.featuredCategories?.subtitle}
                onChange={(next) => updateDraft(["featuredCategories", "subtitle"], next)}
                placeholder={isId ? "Jelajahi kategori terpopuler" : "Explore our top categories"}
              />
              <ScField
                label={isId ? "Teks Tombol" : "Button Label"}
                value={draft.featuredCategories?.buttonName}
                onChange={(next) => updateDraft(["featuredCategories", "buttonName"], next)}
                placeholder={isId ? "Lihat Semua" : "View All"}
              />
            </div>
            <ScTextAreaField
              label={isId ? "Deskripsi" : "Description"}
              value={draft.featuredCategories?.description}
              onChange={(next) => updateDraft(["featuredCategories", "description"], next)}
              placeholder={isId ? "Pilih produk kebutuhan Anda dari kategori ini." : "Choose your products from these categories."}
            />
          </div>
        </section>

        {/* Popular Products */}
        <section ref={registerSectionRef("popularProducts")} className="sc-card scroll-mt-36">
          <ScSectionTitle
            icon={ShoppingBag}
            title={isId ? "Produk Populer" : "Popular Products"}
            description={
              isId
                ? "Sorot produk terlaris dan paling banyak dilihat oleh pengunjung."
                : "Highlight best-selling and most-viewed products."
            }
            action={
              <ScToggle
                checked={Boolean(draft.popularProducts?.enabled)}
                onChange={(next) => updateDraft(["popularProducts", "enabled"], next)}
                ariaLabel="Toggle popular products"
              />
            }
          />

          <div className="space-y-3.5 mt-4">
            <ScField
              label={isId ? "Judul Seksi" : "Section Title"}
              value={draft.popularProducts?.title}
              onChange={(next) => updateDraft(["popularProducts", "title"], next)}
              placeholder={isId ? "Produk Terpopuler" : "Popular Products"}
            />
            <div className="grid grid-cols-2 gap-3">
              <ScSelectField
                label={isId ? "Sumber Produk" : "Product Source"}
                value={draft.popularProducts?.source || "Best Selling"}
                onChange={(next) => updateDraft(["popularProducts", "source"], next)}
                options={[
                  { value: "Best Selling", label: isId ? "Terlaris (Best Selling)" : "Best Selling" },
                  { value: "Most Viewed", label: isId ? "Paling Dilihat" : "Most Viewed" },
                  { value: "Newest", label: isId ? "Terbaru" : "Newest" },
                ]}
              />
              <ScSelectField
                label={isId ? "Batas Jumlah" : "Product Limit"}
                value={String(draft.popularProducts?.productsLimit || 8)}
                onChange={(next) => updateDraft(["popularProducts", "productsLimit"], Number(next))}
                options={["4", "8", "12", "16"]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ScSelectField
                label={isId ? "Filter Kategori" : "Filter By"}
                value={draft.popularProducts?.filterBy || "All Categories"}
                onChange={(next) => updateDraft(["popularProducts", "filterBy"], next)}
                options={[
                  { value: "All Categories", label: isId ? "Semua Kategori" : "All Categories" },
                  { value: "Featured", label: isId ? "Unggulan" : "Featured" },
                  { value: "Discounted", label: isId ? "Diskon" : "Discounted" },
                ]}
              />
              <ScSelectField
                label={isId ? "Urutkan Berdasarkan" : "Sort By"}
                value={draft.popularProducts?.sortBy || "Best Selling"}
                onChange={(next) => updateDraft(["popularProducts", "sortBy"], next)}
                options={[
                  { value: "Best Selling", label: isId ? "Terlaris" : "Best Selling" },
                  { value: "Newest", label: isId ? "Terbaru" : "Newest" },
                  { value: "Highest Rated", label: isId ? "Rating Tertinggi" : "Highest Rated" },
                ]}
              />
            </div>
            <ScTextAreaField
              label={isId ? "Deskripsi" : "Description"}
              value={draft.popularProducts?.description}
              onChange={(next) => updateDraft(["popularProducts", "description"], next)}
              placeholder={isId ? "Temukan aneka produk terbaik minggu ini." : "See our popular products this week."}
            />
          </div>
        </section>
      </div>

      {/* SECTION 6: SHOP ONLINE WITH EASE (DIGITAL & INNOVATION SHOWCASE) */}
      <section ref={registerSectionRef("quickDelivery")} className="sc-card scroll-mt-36">
        <ScSectionTitle
          icon={Sparkles}
          title={isId ? "Showcase Produk Digital & Inovasi" : "Digital & Innovation Showcase"}
          description={
            isId
              ? "Kelola konten etalase karya inovasi TP Preneurs di halaman utama storefront."
              : "Manage the digital and innovation showcase banner on the storefront homepage."
          }
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isId ? "Aktifkan Showcase" : "Enable Block"}
              </span>
              <ScToggle
                checked={Boolean(draft.quickDelivery?.enabled)}
                onChange={(next) => updateDraft(["quickDelivery", "enabled"], next)}
                ariaLabel="Toggle digital showcase"
              />
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4">
          <ScField
            label={isId ? "Judul Utama" : "Title"}
            value={draft.quickDelivery?.title}
            onChange={(next) => updateDraft(["quickDelivery", "title"], next)}
            placeholder={isId ? "Belanja Online dengan Mudah" : "Shop Online with Ease"}
          />
          <ScField
            label={isId ? "Subjudul / Eyebrow" : "Eyebrow / Subtitle"}
            value={draft.quickDelivery?.subTitle || draft.quickDelivery?.subtitle}
            onChange={(next) => updateDraft(["quickDelivery", "subTitle"], next)}
            placeholder={isId ? "PRODUK DIGITAL & INOVASI" : "DIGITAL & INNOVATION PRODUCTS"}
          />
          <ScField
            label={isId ? "Nama Tombol" : "Button Name"}
            value={draft.quickDelivery?.buttonName}
            onChange={(next) => updateDraft(["quickDelivery", "buttonName"], next)}
            placeholder={isId ? "Mulai Belanja" : "Start Shopping"}
          />
          <ScField
            label={isId ? "Tautan Tombol" : "Button Link"}
            value={draft.quickDelivery?.buttonLink}
            onChange={(next) => updateDraft(["quickDelivery", "buttonLink"], next)}
            placeholder="/shop"
          />
          <ScSelectField
            label={isId ? "Tampilkan Pada" : "Display On"}
            value={draft.quickDelivery?.displayOn || "Desktop & Mobile"}
            onChange={(next) => updateDraft(["quickDelivery", "displayOn"], next)}
            options={["Desktop & Mobile", "Desktop Only", "Mobile Only"]}
          />
          <ScSelectField
            label={isId ? "Status" : "Status"}
            value={normalizeStatus(draft.quickDelivery?.status, "ready")}
            onChange={(next) => updateDraft(["quickDelivery", "status"], next)}
            options={[
              { value: "ready", label: isId ? "Siap / Aktif" : "Ready / Active" },
              { value: "needsreview", label: isId ? "Perlu Ditinjau" : "Needs Review" },
              { value: "draft", label: isId ? "Draf" : "Draft" },
            ]}
          />
        </div>

        <div className="mt-3.5">
          <ScTextAreaField
            label={isId ? "Deskripsi" : "Description"}
            value={draft.quickDelivery?.description}
            onChange={(next) => updateDraft(["quickDelivery", "description"], next)}
            placeholder={isId ? "Akses langsung produk digital, media belajar interaktif..." : "Instant access to curated student digital creations..."}
          />
        </div>

        {/* Visual Showcase Image & Live Preview */}
        <div className="mt-4 rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {isId ? "Gambar Visual Showcase (Opsional)" : "Showcase Visual Image (Optional)"}
                </span>
                <span className="sc-spec-chip">16:9 Landscape • Maks 2MB</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isId
                  ? "Jika kosong, grid pilar inovasi otomatis ditampilkan."
                  : "If empty, the interactive digital innovation grid is displayed."}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="sc-btn-secondary h-9 cursor-pointer text-xs">
                <UploadCloud className="h-3.5 w-3.5 text-[#fe6f05]" />
                <span>
                  {uploadingImageKey === "quickDelivery"
                    ? (isId ? "Mengunggah..." : "Uploading...")
                    : (isId ? "Unggah Gambar" : "Upload Image")}
                </span>
                <input
                  type="file"
                  accept=".png,.jpeg,.jpg,.webp"
                  className="hidden"
                  disabled={uploadingImageKey === "quickDelivery"}
                  onChange={async (e) => {
                    await uploadImageForPath("quickDelivery", ["quickDelivery", "imageDataUrl"], e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>

              {draft.quickDelivery?.imageDataUrl ? (
                <button
                  type="button"
                  onClick={() => updateDraft(["quickDelivery", "imageDataUrl"], "")}
                  className="inline-flex h-9 items-center justify-center gap-1 rounded-xl border border-rose-200 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900/40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isId ? "Hapus" : "Remove"}</span>
                </button>
              ) : null}
            </div>
          </div>

          {/* Mini Live Preview */}
          <div className="mt-3 overflow-hidden rounded-xl bg-gradient-to-r from-[#022f53] via-[#034c85] to-[#045a9a] p-4 text-white shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                {draft.quickDelivery?.subTitle ? (
                  <span className="inline-block rounded-full bg-[#fe6f05]/20 border border-[#fe6f05]/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-200">
                    {draft.quickDelivery.subTitle}
                  </span>
                ) : null}
                <h4 className="text-base font-black truncate text-white">
                  {draft.quickDelivery?.title || (isId ? "Belanja Online dengan Mudah" : "Shop Online with Ease")}
                </h4>
                <p className="text-xs text-blue-100 line-clamp-1">
                  {draft.quickDelivery?.description || (isId ? "Akses produk digital dan riset mahasiswa." : "Curated student digital creations.")}
                </p>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fe6f05] px-3 py-1 text-xs font-bold text-white shadow-sm">
                    {draft.quickDelivery?.buttonName || (isId ? "Mulai Belanja" : "Start Shopping")} →
                  </span>
                </div>
              </div>
              {draft.quickDelivery?.imageDataUrl ? (
                <img
                  src={draft.quickDelivery.imageDataUrl}
                  alt="Showcase preview"
                  className="h-20 w-32 rounded-lg object-cover border border-white/20"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7: NEWSLETTER & STATS */}
      <section ref={registerSectionRef("newsletter")} className="sc-card scroll-mt-36">
        <ScSectionTitle
          icon={Mail}
          title={isId ? "Newsletter & Statistik Produk Terunggah" : "Newsletter & Uploaded Products Stat"}
          description={
            isId
              ? "Kelola teks informasi langganan newsletter dan etalase jumlah produk terverifikasi."
              : "Manage newsletter subscription texts and verified uploaded product statistics."
          }
          action={
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {isId ? "Aktifkan Newsletter" : "Enable Newsletter"}
              </span>
              <ScToggle
                checked={Boolean(draft.footer?.newsletter?.enabled !== false)}
                onChange={(next) => updateDraft(["footer", "newsletter", "enabled"], next)}
                ariaLabel="Toggle newsletter section"
              />
            </div>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
          <ScField
            label={isId ? "Judul Statistik Produk" : "Product Stat Title"}
            value={draft.footer?.newsletter?.productStatTitle}
            onChange={(next) => updateDraft(["footer", "newsletter", "productStatTitle"], next)}
            placeholder={isId ? "Karya Inovatif Mahasiswa & Edupreneur" : "Innovative Student & Edupreneur Creations"}
          />
          <ScField
            label={isId ? "Subjudul Statistik Produk" : "Product Stat Subtitle"}
            value={draft.footer?.newsletter?.productStatSubtitle}
            onChange={(next) => updateDraft(["footer", "newsletter", "productStatSubtitle"], next)}
            placeholder={isId ? "Katalog Produk Asli & Terverifikasi" : "Authentic & Verified Product Catalog"}
          />
          <ScField
            label={isId ? "Judul Form Newsletter" : "Newsletter Title"}
            value={draft.footer?.newsletter?.title}
            onChange={(next) => updateDraft(["footer", "newsletter", "title"], next)}
            placeholder={isId ? "Berlangganan Newsletter & Info Inovasi" : "Subscribe to Newsletter & Innovation Updates"}
          />
          <ScField
            label={isId ? "Subjudul Form Newsletter" : "Newsletter Subtitle"}
            value={draft.footer?.newsletter?.subtitle}
            onChange={(next) => updateDraft(["footer", "newsletter", "subtitle"], next)}
            placeholder={isId ? "Dapatkan update katalog produk dan penawaran spesial." : "Get updates on student innovative creations and special offers."}
          />
          <div className="md:col-span-2">
            <ScField
              label={isId ? "Teks Tombol Berlangganan" : "Subscribe Button Text"}
              value={draft.footer?.newsletter?.buttonText}
              onChange={(next) => updateDraft(["footer", "newsletter", "buttonText"], next)}
              placeholder={isId ? "Berlangganan" : "Subscribe"}
            />
          </div>
        </div>

        {/* Live Preview */}
        <div className="mt-4 rounded-xl border border-[#034c85]/20 bg-gradient-to-br from-white via-[#f0f6fc] to-[#e6f0fa] p-4 text-slate-800 shadow-sm dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 dark:text-slate-100 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#034c85] text-[#fe6f05] shadow-sm">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-[#fe6f05] tracking-wider">
                  {isId ? "Katalog Terverifikasi" : "Verified Catalog"}
                </span>
                <h4 className="text-sm font-extrabold text-[#034c85] dark:text-white">
                  {draft.footer?.newsletter?.productStatTitle || (isId ? "Karya Inovatif Mahasiswa" : "Innovative Student Creations")}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {draft.footer?.newsletter?.productStatSubtitle || (isId ? "Katalog Produk Asli" : "Authentic Catalog")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <input
                type="email"
                disabled
                placeholder={isId ? "email@domain.com" : "email@domain.com"}
                className="sc-input h-9 text-xs w-full lg:w-56"
              />
              <button
                type="button"
                disabled
                className="sc-btn-primary h-9 px-3.5 text-xs shrink-0"
              >
                {draft.footer?.newsletter?.buttonText || (isId ? "Berlangganan" : "Subscribe")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 8: FOOTER LINKS & CONTACT */}
      <section ref={registerSectionRef("footerLinks")} className="sc-card scroll-mt-36">
        <ScSectionTitle
          icon={LinkIcon}
          title={isId ? "Tautan Footer & Kontak Resmi" : "Footer Links & Store Contacts"}
          description={
            isId
              ? "Kelola susunan tautan menu footer, alamat resmi, media sosial, dan metode pembayaran."
              : "Update footer navigation columns, official address, social media links, and payment badges."
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
          {/* Navigation Blocks */}
          <div className="lg:col-span-8 space-y-4">
            {FOOTER_LINK_BLOCKS.map((col) => {
              const blockData = draft.footer?.[col.key] || {};
              const blockTitle = isId ? col.titleId : col.titleEn;

              return (
                <div key={col.key} className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {blockData.title || blockTitle}
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        {isId ? "Kolom navigasi footer" : "Footer navigation block"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {isId ? "Aktifkan" : "Enable"}
                      </span>
                      <ScToggle
                        checked={Boolean(blockData.enabled)}
                        onChange={(next) => updateDraft(["footer", col.key, "enabled"], next)}
                        ariaLabel={`Toggle ${blockTitle}`}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <ScField
                      label={isId ? "Judul Kolom" : "Block Title"}
                      value={blockData.title}
                      onChange={(next) => updateDraft(["footer", col.key, "title"], next)}
                      placeholder={blockTitle}
                    />
                  </div>

                  <div className="space-y-2">
                    {(blockData.links || []).map((linkItem, idx) => (
                      <div
                        key={`${col.key}-${idx}`}
                        className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_36px] items-center gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900"
                      >
                        <input
                          type="text"
                          value={linkItem.label || ""}
                          onChange={(e) => updateFooterLink(col.key, idx, "label", e.target.value)}
                          placeholder={isId ? "Label Teks" : "Link Label"}
                          className="sc-input h-8 text-xs px-2"
                        />
                        <input
                          type="text"
                          value={linkItem.href || ""}
                          onChange={(e) => updateFooterLink(col.key, idx, "href", e.target.value)}
                          placeholder="/shop"
                          className="sc-input h-8 text-xs px-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeFooterLink(col.key, idx)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-100 transition dark:hover:bg-rose-950/40"
                          title={isId ? "Hapus Tautan" : "Remove Link"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addFooterLink(col.key)}
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg border border-dashed border-[#034c85] px-3 text-xs font-bold text-[#034c85] hover:bg-[#034c85]/5 transition dark:text-blue-300 dark:border-blue-400"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isId ? "Tambah Tautan Baru" : "Add Link"}</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Store Contact & Socials Side Column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Store Contact */}
            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isId ? "Kontak Resmi Toko" : "Store Contact Details"}
                </h3>
                <ScToggle
                  checked={Boolean(draft.footer?.block4?.enabled)}
                  onChange={(next) => updateDraft(["footer", "block4", "enabled"], next)}
                  ariaLabel="Toggle store contact"
                />
              </div>

              <div className="space-y-3">
                <ScField
                  label={isId ? "Alamat Kantor / Kampus" : "Address"}
                  value={draft.footer?.block4?.address}
                  onChange={(next) => updateDraft(["footer", "block4", "address"], next)}
                  placeholder="Jl. Tamalate 1 Makassar"
                />
                <ScField
                  label={isId ? "Telepon Kantor" : "Phone"}
                  value={draft.footer?.block4?.phone}
                  onChange={(next) => updateDraft(["footer", "block4", "phone"], next)}
                  placeholder="+62821-8866-824"
                />
                <ScField
                  label="Email"
                  value={draft.footer?.block4?.email}
                  onChange={(next) => updateDraft(["footer", "block4", "email"], next)}
                  placeholder="tp.fip@unm.ac.id"
                  type="email"
                />
              </div>

              {/* Footer Logo */}
              <div className="mt-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {isId ? "Logo Footer" : "Footer Logo"}
                  </span>
                  <label className="sc-btn-secondary h-7 px-2.5 text-[11px] cursor-pointer">
                    <UploadCloud className="h-3 w-3 text-[#fe6f05]" />
                    <span>{isId ? "Unggah" : "Upload"}</span>
                    <input
                      type="file"
                      accept=".png,.jpeg,.jpg,.webp,.svg"
                      className="hidden"
                      onChange={async (e) => {
                        await uploadImageForPath("footerLogo", ["footer", "block4", "footerLogoDataUrl"], e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {draft.footer?.block4?.footerLogoDataUrl ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                    <img
                      src={draft.footer.block4.footerLogoDataUrl}
                      alt="Footer Logo"
                      className="h-8 max-w-[120px] object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => updateDraft(["footer", "block4", "footerLogoDataUrl"], "")}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Social Media Links */}
            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isId ? "Media Sosial" : "Social Links"}
                </h3>
                <ScToggle
                  checked={Boolean(draft.footer?.socialLinks?.enabled)}
                  onChange={(next) => updateDraft(["footer", "socialLinks", "enabled"], next)}
                  ariaLabel="Toggle social links"
                />
              </div>

              <div className="space-y-2">
                {FOOTER_SOCIAL_FIELDS.map((soc) => (
                  <label key={soc.key} className="block min-w-0">
                    <span className="block text-[11px] font-semibold text-slate-500 mb-0.5">
                      {soc.label}
                    </span>
                    <input
                      type="url"
                      value={draft.footer?.socialLinks?.[soc.key] || ""}
                      onChange={(e) => updateDraft(["footer", "socialLinks", soc.key], e.target.value)}
                      placeholder="https://..."
                      className="sc-input h-8 text-xs px-2"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Method Badges */}
            <div className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  {isId ? "Badge Metode Pembayaran" : "Payment Methods Badge"}
                </h3>
                <ScToggle
                  checked={Boolean(draft.footer?.paymentMethod?.enabled)}
                  onChange={(next) => updateDraft(["footer", "paymentMethod", "enabled"], next)}
                  ariaLabel="Toggle payment methods"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  {isId ? "Gambar banner logo bank/e-wallet" : "Bank/e-wallet logo banner image"}
                </span>
                <label className="sc-btn-secondary h-7 px-2.5 text-[11px] cursor-pointer">
                  <UploadCloud className="h-3 w-3 text-[#fe6f05]" />
                  <span>{isId ? "Unggah" : "Upload"}</span>
                  <input
                    type="file"
                    accept=".png,.jpeg,.jpg,.webp"
                    className="hidden"
                    onChange={async (e) => {
                      await uploadImageForPath("paymentMethod", ["footer", "paymentMethod", "imageDataUrl"], e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {draft.footer?.paymentMethod?.imageDataUrl ? (
                <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
                  <img
                    src={draft.footer.paymentMethod.imageDataUrl}
                    alt="Payment Methods"
                    className="h-7 max-w-[140px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => updateDraft(["footer", "paymentMethod", "imageDataUrl"], "")}
                    className="text-rose-600 hover:text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

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
