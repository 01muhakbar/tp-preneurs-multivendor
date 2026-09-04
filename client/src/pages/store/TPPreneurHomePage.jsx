import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Grid3X3,
  Handshake,
  Heart,
  Lightbulb,
  Mail,
  Rocket,
  ShoppingCart,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useCart } from "../../hooks/useCart.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import VariantQuickAddModal from "../../components/store/VariantQuickAddModal.jsx";
import DiscoverDigitalProductsHero from "../../components/store/DiscoverDigitalProductsHero.jsx";
import PromoDeliveryBanner from "../../components/kachabazar-demo/PromoDeliveryBanner.jsx";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { fetchStoreCoupons } from "../../api/public/storeCoupons.ts";
import { useCategories, useProducts } from "../../storefront.jsx";
import { formatCurrency } from "../../utils/format.js";
import { resolveProductImageUrl } from "../../utils/productImage.js";
import { productHasVariantSelections } from "../../utils/publicProductVariations.js";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";

const PRIMARY = "var(--tp-primary)";
const ACCENT = "var(--tp-accent)";
const PLACEHOLDER_IMAGE = "/demo/placeholder-product.svg";
const MAIN_SLIDER_LENGTH = 5;

export const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  if (Array.isArray(payload?.data?.data?.items)) return payload.data.data.items;
  if (Array.isArray(payload?.data?.data?.products)) return payload.data.data.products;
  if (Array.isArray(payload?.data?.data?.categories)) return payload.data.data.categories;
  return [];
};

const fallbackCategories = [
  { id: "fallback-vegetables", name: "Fresh Vegetables", slug: "fresh-vegetables", emoji: "🥦" },
  { id: "fallback-fruits", name: "Fresh Fruits", slug: "fresh-fruits", emoji: "🍊" },
  { id: "fallback-bakery", name: "Bread & Bakery", slug: "bread-bakery", emoji: "🥖" },
  { id: "fallback-dairy", name: "Milk & Dairy", slug: "milk-dairy", emoji: "🥛" },
  { id: "fallback-meat", name: "Meat & Fish", slug: "meat-fish", emoji: "🥩" },
  { id: "fallback-beverages", name: "Beverages", slug: "beverages", emoji: "🧃" },
  { id: "fallback-snacks", name: "Snacks", slug: "snacks", emoji: "🥜" },
  { id: "fallback-pantry", name: "Pantry", slug: "pantry", emoji: "🍯" },
];

const fallbackProducts = [
  { id: 90001, name: "Organic Banana", slug: "organic-banana", price: 18000, originalPrice: 22000, ratingAvg: 4.6, reviewCount: 5, stock: 18, emoji: "🍌", isFallback: true },
  { id: 90002, name: "Milk 1L", slug: "milk-1l", price: 19900, originalPrice: 24000, ratingAvg: 4.4, reviewCount: 5, stock: 20, emoji: "🥛", isFallback: true },
  { id: 90003, name: "Salmon Fillet", slug: "salmon-fillet", price: 89900, originalPrice: 98000, ratingAvg: 4.8, reviewCount: 4, stock: 10, emoji: "🐟", isFallback: true },
  { id: 90004, name: "Chicken Breast Fillet", slug: "chicken-breast-fillet", price: 46500, originalPrice: 52000, ratingAvg: 4.5, reviewCount: 5, stock: 12, emoji: "🍗", isFallback: true },
  { id: 90005, name: "Greek Yogurt Plain", slug: "greek-yogurt-plain", price: 27900, originalPrice: 32000, ratingAvg: 4.5, reviewCount: 5, stock: 14, emoji: "🥣", isFallback: true },
];

const fallbackDiscountedProducts = [
  { id: 90101, name: "Orange Juice 1L", slug: "orange-juice-1l", price: 14800, originalPrice: 18500, discountPercent: 20, emoji: "🍊", isFallback: true },
  { id: 90102, name: "Milk Full Cream 1L", slug: "milk-full-cream-1l", price: 19500, originalPrice: 23000, discountPercent: 15, emoji: "🥛", isFallback: true },
  { id: 90103, name: "Brown Rice 1kg", slug: "brown-rice-1kg", price: 23500, originalPrice: 28500, discountPercent: 18, emoji: "🍚", isFallback: true },
  { id: 90104, name: "Honey Stars 300g", slug: "honey-stars-300g", price: 19800, originalPrice: 25500, discountPercent: 22, emoji: "🍯", isFallback: true },
  { id: 90105, name: "Peanut Butter 340g", slug: "peanut-butter-340g", price: 21900, originalPrice: 26000, discountPercent: 16, emoji: "🥜", isFallback: true },
];

const POPULAR_SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "highest_rated", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const benefitItems = [
  {
    title: "Learning Media Innovation",
    text: "Digital learning solutions shaped for quality, usefulness, and real classroom impact.",
    Icon: Lightbulb,
  },
  {
    title: "Collaborative Creation",
    text: "A student-powered space for turning creative ideas into practical education products.",
    Icon: Handshake,
  },
  {
    title: "Edupreneur Growth",
    text: "Helping students package, manage, and market their work professionally.",
    Icon: Rocket,
  },
  {
    title: "Accessible Learning Solutions",
    text: "Interactive media designed to answer today's education challenges.",
    Icon: BookOpen,
  },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toLimit = (value, fallback, maximum) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
};

const splitHeadingAccent = (value, fallback) => {
  const words = toText(value, fallback).split(/\s+/).filter(Boolean);
  if (words.length < 2) return { title: words.join(" "), accent: "" };
  return {
    title: words.slice(0, -1).join(" "),
    accent: words.at(-1),
  };
};

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const hasOwnValue = (source, key) =>
  source && Object.prototype.hasOwnProperty.call(source, key);

const toSliderText = (value, fallback = "", preserveEmpty = false) => {
  if (preserveEmpty && value != null) return String(value).trim();
  return toText(value, fallback);
};

const toBool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeMainSliderImageFocus = (value, fallback = "right") => {
  const normalized = toText(value, fallback).toLowerCase();
  if (normalized === "left" || normalized === "center" || normalized === "right") {
    return normalized;
  }
  return fallback;
};

const normalizeMainSliderAutoplayDelaySeconds = (value, fallback = 5) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (parsed === 5 || parsed === 10 || parsed === 15) {
    return parsed;
  }
  return fallback === 10 || fallback === 15 ? fallback : 5;
};

const normalizeLink = (value, fallback = "/shop") => {
  const normalized = toText(value);
  if (!normalized) return fallback;
  if (normalized.startsWith("/")) return normalized;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return fallback;
};

const normalizePopularProductsSort = (source, sortBy) => {
  const normalizedSort = toText(sortBy).toLowerCase();
  if (normalizedSort.includes("newest")) return "newest";
  if (normalizedSort.includes("highest")) return "highest_rated";
  if (normalizedSort.includes("price") && normalizedSort.includes("low")) return "price_asc";
  if (normalizedSort.includes("price") && normalizedSort.includes("high")) return "price_desc";

  const normalizedSource = toText(source).toLowerCase();
  if (normalizedSource.includes("newest")) return "newest";
  return "featured";
};

const normalizeFeaturedCategoriesSort = (source) => {
  const normalizedSource = toText(source).toLowerCase();
  if (normalizedSource.includes("popular")) return "popular";
  if (normalizedSource.includes("alphabet") || normalizedSource.includes("name")) return "name";
  return "newest";
};

const isDiscountedPopularFilter = (value) =>
  toText(value).toLowerCase().includes("discount");

const isExternalLink = (value) => /^https?:\/\//i.test(toText(value));

const getSliderImageFocusClass = (value) => {
  const normalized = normalizeMainSliderImageFocus(value);
  if (normalized === "left") return "object-left";
  if (normalized === "center") return "object-center";
  return "object-right";
};

const defaultSliderSlides = [
  {
    imageDataUrl: "",
    title: "Fresh groceries for everyday living",
    description: "Premium quality fruits, vegetables, dairy & more. Delivered fresh to your door.",
    buttonName: "Shop Now",
    buttonLink: "/shop",
    imageFocus: "right",
  },
  ...Array.from({ length: MAIN_SLIDER_LENGTH - 1 }, () => ({
    imageDataUrl: "",
    title: "",
    description: "",
    buttonName: "",
    buttonLink: "",
    imageFocus: "right",
  })),
];

const defaultMainSliderOptions = {
  showArrows: false,
  showDots: true,
  showBoth: false,
  autoplayEnabled: false,
  autoplayDelaySeconds: 5,
};

const normalizeMainSlider = (homeConfig) => {
  const source = homeConfig?.mainSlider && typeof homeConfig.mainSlider === "object"
    ? homeConfig.mainSlider
    : {};
  const sourceSlides = Array.isArray(source.sliders) ? source.sliders : [];
  const sliders = Array.from({ length: MAIN_SLIDER_LENGTH }, (_, index) => {
    const order = index + 1;
    const nested = sourceSlides[index] && typeof sourceSlides[index] === "object"
      ? sourceSlides[index]
      : {};
    const legacyNested = source[`slider${order}`] && typeof source[`slider${order}`] === "object"
      ? source[`slider${order}`]
      : {};
    const fallback = defaultSliderSlides[index];
    const hasExplicitSlide =
      Object.keys(nested).length > 0 ||
      Object.keys(legacyNested).length > 0 ||
      hasOwnValue(source, `slider${order}ImageDataUrl`) ||
      hasOwnValue(source, `slider${order}Image`) ||
      hasOwnValue(source, `slider${order}Title`) ||
      hasOwnValue(source, `slider${order}Description`) ||
      hasOwnValue(source, `slider${order}ButtonName`) ||
      hasOwnValue(source, `slider${order}ButtonLink`);
    const textFallback = hasExplicitSlide ? "" : fallback.title;
    const descriptionFallback = hasExplicitSlide ? "" : fallback.description;
    const buttonFallback = hasExplicitSlide ? "" : fallback.buttonName;

    return {
      imageDataUrl: toText(
        nested.imageDataUrl ??
          nested.image ??
          legacyNested.imageDataUrl ??
          legacyNested.image ??
          source[`slider${order}ImageDataUrl`] ??
          source[`slider${order}Image`],
        fallback.imageDataUrl
      ),
      title: toSliderText(
        nested.title ?? legacyNested.title ?? source[`slider${order}Title`],
        textFallback,
        hasExplicitSlide
      ),
      description: toSliderText(
        nested.description ??
          nested.subtitle ??
          legacyNested.description ??
          legacyNested.subtitle ??
          source[`slider${order}Description`],
        descriptionFallback,
        hasExplicitSlide
      ),
      buttonName: toSliderText(
        nested.buttonName ??
          nested.cta ??
          legacyNested.buttonName ??
          legacyNested.cta ??
          source[`slider${order}ButtonName`],
        buttonFallback,
        hasExplicitSlide
      ),
      buttonLink: normalizeLink(
        nested.buttonLink ??
          legacyNested.buttonLink ??
          source[`slider${order}ButtonLink`],
        fallback.buttonLink
      ),
      imageFocus: normalizeMainSliderImageFocus(
        nested.imageFocus ?? legacyNested.imageFocus ?? source[`slider${order}ImageFocus`],
        fallback.imageFocus
      ),
    };
  });

  const optionsSource = source.options && typeof source.options === "object" ? source.options : {};
  const showArrows = toBool(
    optionsSource.showArrows ?? source.showArrows ?? source.leftAndRightArrows,
    defaultMainSliderOptions.showArrows
  );
  const showDots = toBool(
    optionsSource.showDots ?? source.showDots ?? source.bottomDots,
    defaultMainSliderOptions.showDots
  );
  const showBoth = toBool(
    optionsSource.showBoth ?? source.showBoth ?? source.both,
    showArrows && showDots
  );

  return {
    sliders,
    options: showBoth
      ? {
          showArrows: true,
          showDots: true,
          showBoth: true,
          autoplayEnabled: toBool(
            optionsSource.autoplayEnabled ?? optionsSource.autoPlay ?? source.autoplayEnabled ?? source.autoPlay,
            defaultMainSliderOptions.autoplayEnabled
          ),
          autoplayDelaySeconds: normalizeMainSliderAutoplayDelaySeconds(
            optionsSource.autoplayDelaySeconds ??
              optionsSource.autoPlayDelaySeconds ??
              source.autoplayDelaySeconds ??
              source.autoPlayDelaySeconds ??
              source.slideDurationSeconds,
            defaultMainSliderOptions.autoplayDelaySeconds
          ),
        }
      : {
          showArrows,
          showDots,
          showBoth: false,
          autoplayEnabled: toBool(
            optionsSource.autoplayEnabled ?? optionsSource.autoPlay ?? source.autoplayEnabled ?? source.autoPlay,
            defaultMainSliderOptions.autoplayEnabled
          ),
          autoplayDelaySeconds: normalizeMainSliderAutoplayDelaySeconds(
            optionsSource.autoplayDelaySeconds ??
              optionsSource.autoPlayDelaySeconds ??
              source.autoplayDelaySeconds ??
              source.autoPlayDelaySeconds ??
              source.slideDurationSeconds,
            defaultMainSliderOptions.autoplayDelaySeconds
          ),
        },
  };
};

const normalizeDiscountCouponBox = (homeConfig) => {
  const source =
    homeConfig?.discountCouponBox && typeof homeConfig.discountCouponBox === "object"
      ? homeConfig.discountCouponBox
      : {};
  const activeCouponCodes = Array.isArray(source.activeCouponCodes)
    ? source.activeCouponCodes.map((code) => toText(code).toUpperCase()).filter(Boolean)
    : ["SUMMER26", "WINTER25"];

  return {
    enabled: toBool(source.enabled, true),
    title: toText(source.title, "Latest Super Discount Active Coupon Code"),
    activeCouponCodes: [...new Set(activeCouponCodes)],
  };
};

const formatCouponDate = (value) => {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

const normalizeCouponForPanel = (coupon) => {
  const amount = Number(coupon?.amount || 0);
  const discountLabel =
    coupon?.discountType === "percent"
      ? `${Math.round(amount)}% off`
      : `${formatCurrency(amount)} off`;
  const status = coupon?.status || {};

  return {
    ...coupon,
    code: toText(coupon?.code).toUpperCase(),
    discountLabel,
    statusLabel: status.label || "Active",
    statusTone: status.tone || "emerald",
    minimumOrderLabel: Number(coupon?.minSpend || 0) > 0
      ? formatCurrency(Number(coupon.minSpend))
      : "No minimum order",
    validityLabel: coupon?.expiresAt ? `Until ${formatCouponDate(coupon.expiresAt)}` : "No expiry limit",
    scopeLabel: coupon?.scopeLabel || (coupon?.scopeType === "STORE" ? "Store" : "Platform"),
    storeName: coupon?.store?.name || "",
    storeSlug: coupon?.store?.slug || "",
  };
};

const normalizeCategory = (category, index) => ({
  id: category?.id ?? category?._id ?? category?.slug ?? `category-${index}`,
  name: toText(category?.name ?? category?.title, fallbackCategories[index % fallbackCategories.length].name),
  slug: toText(category?.slug ?? category?.id, fallbackCategories[index % fallbackCategories.length].slug),
  imageUrl: resolveAssetUrl(category?.imageUrl ?? category?.image ?? category?.iconUrl ?? ""),
  emoji: category?.emoji ?? fallbackCategories[index % fallbackCategories.length].emoji,
});

const normalizeProduct = (product, index) => {
  const name = toText(product?.name ?? product?.title, fallbackProducts[index % fallbackProducts.length].name);
  const basePrice = toNumber(product?.price ?? product?.sellingPrice ?? product?.salePrice, 0);
  const salePrice = toNumber(product?.salePrice, basePrice);
  const displayPrice =
    salePrice > 0 && (basePrice <= 0 || salePrice < basePrice) ? salePrice : basePrice;
  const originalPrice = toNumber(
    product?.originalPrice ?? product?.compareAtPrice ?? product?.regularPrice,
    salePrice > 0 && basePrice > salePrice ? basePrice : displayPrice
  );
  const productImage = resolveAssetUrl(resolveProductImageUrl(product));
  const stock = Number.isFinite(Number(product?.stock ?? product?.availableStock))
    ? Number(product?.stock ?? product?.availableStock)
    : null;

  return {
    ...product,
    id: product?.id ?? product?._id ?? fallbackProducts[index % fallbackProducts.length].id,
    name,
    title: name,
    slug: toText(product?.slug ?? product?.id, fallbackProducts[index % fallbackProducts.length].slug),
    routeSlug: toText(product?.routeSlug ?? product?.slug ?? product?.id, fallbackProducts[index % fallbackProducts.length].slug),
    price: displayPrice,
    originalPrice,
    ratingAvg: toNumber(product?.ratingAvg ?? product?.averageRating ?? product?.rating, 4.5),
    reviewCount: toNumber(product?.reviewCount ?? product?.reviewsCount, 5),
    discountPercent: toNumber(product?.discountPercent, 0),
    imageUrl: productImage,
    stock,
    emoji: product?.emoji ?? fallbackProducts[index % fallbackProducts.length].emoji,
    isFallback: Boolean(product?.isFallback),
    purchaseState: product?.purchaseState ?? null,
    variations: product?.variations ?? null,
  };
};

const calcDiscount = (product) => {
  const explicit = toNumber(product?.discountPercent, 0);
  if (explicit > 0) return Math.round(explicit);
  const price = toNumber(product?.price, 0);
  const original = toNumber(product?.originalPrice, 0);
  if (original > price && price > 0) {
    return Math.round(((original - price) / original) * 100);
  }
  return 0;
};

function SectionHeading({ eyebrow, title, accent, description, action }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--tp-accent)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[var(--tp-primary)] dark:text-white sm:text-4xl">
          {title} {accent ? <span className="text-[var(--tp-accent)]">{accent}</span> : null}
        </h2>
        {description ? (
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#557099] dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function HeroVisual({ products }) {
  const visualProducts = products.filter((product) => product.imageUrl).slice(0, 4);

  return (
    <div className="relative min-h-[300px] overflow-hidden rounded-[32px] md:min-h-[360px] 2xl:min-h-[390px]">
      <div className="absolute inset-x-[12%] bottom-7 h-24 rounded-full bg-[var(--tp-primary)]/10 blur-3xl" />
      <div className="absolute bottom-8 left-[8%] right-[10%] top-7 rounded-[34px] bg-gradient-to-br from-white/85 to-[#e8f3ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] dark:from-slate-800 dark:to-slate-900" />
      <div className="absolute bottom-10 left-[24%] h-44 w-52 rounded-b-[32px] rounded-t-[14px] bg-[#9b6336] shadow-[0_25px_45px_rgba(68,36,14,0.25)] sm:h-56 sm:w-[17rem] 2xl:h-60 2xl:w-72">
        <div className="absolute left-7 top-6 h-16 w-9 rounded-full border-4 border-[#d49358] 2xl:h-20 2xl:w-10" />
        <div className="absolute right-7 top-6 h-16 w-9 rounded-full border-4 border-[#d49358] 2xl:h-20 2xl:w-10" />
        <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-[14px] bg-[#c98b4e]" />
      </div>
      <div className="absolute left-[12%] top-16 text-7xl drop-shadow-lg sm:text-8xl">🥬</div>
      <div className="absolute left-[42%] top-10 text-6xl drop-shadow-lg sm:text-7xl">🌶️</div>
      <div className="absolute right-[18%] top-20 text-6xl drop-shadow-lg sm:text-7xl">🥦</div>
      <div className="absolute bottom-12 left-[13%] text-6xl drop-shadow-lg sm:text-7xl">🍎</div>
      <div className="absolute bottom-16 left-[42%] text-7xl drop-shadow-lg sm:text-8xl">🧀</div>
      <div className="absolute bottom-10 right-[12%] text-7xl drop-shadow-lg sm:text-8xl">🥚</div>
      {visualProducts.map((product, index) => (
        <img
          key={product.id}
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
          className={`absolute hidden rounded-[24px] bg-white/70 object-contain p-3 shadow-[0_16px_36px_rgba(3,76,133,0.14)] lg:block ${
            index === 0
              ? "left-[5%] top-[12%] h-24 w-24"
              : index === 1
                ? "right-[10%] top-[8%] h-28 w-28"
                : index === 2
                  ? "bottom-[9%] left-[2%] h-24 w-24"
                  : "bottom-[12%] right-[3%] h-24 w-24"
          }`}
        />
      ))}
    </div>
  );
}

function CompactHeroCouponCard({
  discountCouponBox,
  couponList,
  isLoading,
  couponError,
  copiedCode,
  onCopy,
}) {
  if (!discountCouponBox?.enabled) return null;

  const safeCoupons = Array.isArray(couponList) ? couponList.filter((coupon) => toText(coupon?.code)) : [];
  const primaryCoupon = safeCoupons[0] || null;
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';
  const title = toText(discountCouponBox.title, "Latest Super Discount Active Coupon Code");
  const displayTitle = isIndo && title === "Latest Super Discount Active Coupon Code" ? "Kode Kupon Diskon Super Terbaru" : title;

  return (
    <aside className="relative mx-auto flex min-h-0 w-full max-w-none flex-col overflow-hidden rounded-[22px] border border-[#cdebdc] bg-white p-3 text-[#071a3f] shadow-[0_18px_34px_rgba(3,76,133,0.13)] dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:min-h-[300px] sm:max-w-[360px] sm:rounded-[26px] sm:p-4 lg:mx-0 lg:min-h-[338px] lg:max-w-[252px] 2xl:max-w-[260px]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--tp-accent)]" />
      <div className="text-left">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--tp-accent)]">
          {isIndo ? "Kotak Kupon" : "Coupon Box"}
        </p>
        <h3 className="mt-1.5 text-[14px] font-black leading-5 text-[#071a3f] dark:text-white sm:mt-2 sm:text-[17px]">
          {displayTitle}
        </h3>
      </div>

      <div className="mt-3 flex flex-1 flex-col justify-between gap-3 sm:mt-4">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdebdc] bg-[#f7fbff] px-4 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#dbe6f3]" />
            <p className="mt-3 text-xs font-bold text-[#557099] dark:text-slate-300">
              {isIndo ? "Memuat kupon..." : "Loading coupons..."}
            </p>
          </div>
        ) : primaryCoupon ? (
          <>
            <button
              type="button"
              onClick={() => onCopy?.(primaryCoupon.code)}
              className="rounded-[18px] border-2 border-dashed border-[#00b876]/45 bg-[#f2fff8] px-3 py-2.5 text-center transition hover:border-[#00b876] hover:bg-[#ecfff5] dark:bg-slate-900 sm:rounded-[20px] sm:py-4"
              aria-label={`Copy coupon code ${primaryCoupon.code}`}
              title={`Copy ${primaryCoupon.code}`}
            >
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#00a46c]">
                {copiedCode === primaryCoupon.code ? (isIndo ? "Tersalin!" : "Copied!") : (isIndo ? "Kode Kupon" : "Coupon Code")}
              </span>
              <span className="mt-2 block break-all text-[18px] font-black leading-none tracking-[0.14em] text-[var(--tp-primary)] dark:text-sky-300 sm:text-[22px]">
                {primaryCoupon.code}
              </span>
            </button>

            <div className="hidden rounded-2xl bg-[#f7fbff] p-3 text-left dark:bg-slate-900 sm:block">
              <p className="text-[13px] font-black text-[var(--tp-accent)]">
                {primaryCoupon.discountLabel || (isIndo ? "Diskon aktif" : "Active discount")}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold leading-5 text-[#557099] dark:text-slate-300">
                {isIndo ? "Min Order:" : "Min Order:"} {primaryCoupon.minimumOrderLabel || (isIndo ? "Lihat checkout" : "See checkout")}
              </p>
              <p className="text-[11px] font-semibold leading-5 text-[#557099] dark:text-slate-300">
                {isIndo ? "Masa Berlaku:" : "Validity:"} {primaryCoupon.validityLabel || (isIndo ? "Tanpa batas kedaluwarsa" : "No expiry limit")}
              </p>
            </div>

            {safeCoupons.length > 1 ? (
              <div className="hidden flex-wrap gap-2 sm:flex">
                {safeCoupons.slice(1, 5).map((coupon) => (
                  <button
                    key={coupon.code}
                    type="button"
                    onClick={() => onCopy?.(coupon.code)}
                    className={`h-7 rounded-full border px-3 text-[10px] font-black tracking-[0.12em] transition ${
                      copiedCode === coupon.code
                        ? "border-[var(--tp-accent)] bg-[var(--tp-accent)] text-white"
                        : "border-[#cdebdc] bg-white text-[#00a46c] hover:border-[#00a46c] dark:bg-slate-950"
                    }`}
                  >
                    {coupon.code}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdebdc] bg-[#f7fbff] px-4 text-center dark:border-slate-700 dark:bg-slate-900">
            <p className="text-sm font-black text-[#071a3f] dark:text-white">
              {isIndo ? "Belum ada kupon aktif" : "No active coupon yet"}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#557099] dark:text-slate-300">
              {couponError || (isIndo ? "Tambahkan kode kupon dari pengaturan beranda." : "Add coupon codes from homepage settings.")}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

function MainSliderSection({
  mainSlider,
  products,
  discountCouponBox,
  couponList,
  couponsLoading,
  couponError,
  copiedCode,
  onCopyCoupon,
}) {
  const [activeSlide, setActiveSlide] = useState(0);
  const slides = useMemo(() => {
    const normalized = Array.isArray(mainSlider?.sliders) ? mainSlider.sliders : defaultSliderSlides;
    const active = normalized.filter(
      (slide) =>
        toText(slide?.imageDataUrl) ||
        toText(slide?.title) ||
        toText(slide?.description) ||
        toText(slide?.buttonName)
    );
    return active.length > 0 ? active : [defaultSliderSlides[0]];
  }, [mainSlider?.sliders]);
  const options = mainSlider?.options || defaultMainSliderOptions;
  const slideIndex = Math.max(0, Math.min(activeSlide, slides.length - 1));
  const slide = slides[slideIndex] || slides[0] || defaultSliderSlides[0];
  const imageSrc = resolveAssetUrl(slide.imageDataUrl);
  const titleText = toText(slide.title);
  const ctaLabel = toText(slide.buttonName);
  const ctaLink = normalizeLink(slide.buttonLink, "/shop");
  const ctaIsExternal = isExternalLink(ctaLink);
  const showArrows = Boolean(options.showArrows || options.showBoth) && slides.length > 1;
  const showDots = Boolean(options.showDots || options.showBoth) && slides.length > 1;
  const showCouponBox = Boolean(discountCouponBox?.enabled);

  useEffect(() => {
    if (!options.autoplayEnabled || slides.length <= 1) return undefined;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, normalizeMainSliderAutoplayDelaySeconds(options.autoplayDelaySeconds, 5) * 1000);

    return () => window.clearInterval(interval);
  }, [options.autoplayDelaySeconds, options.autoplayEnabled, slides.length]);

  useEffect(() => {
    setActiveSlide((current) => Math.min(current, Math.max(0, slides.length - 1)));
  }, [slides.length]);

  const goToPrevSlide = () => {
    if (slides.length <= 1) return;
    setActiveSlide((current) => (current - 1 + slides.length) % slides.length);
  };

  const goToNextSlide = () => {
    if (slides.length <= 1) return;
    setActiveSlide((current) => (current + 1) % slides.length);
  };

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[#eef6ff] p-3 shadow-[0_18px_42px_rgba(3,76,133,0.08)] dark:bg-slate-900 sm:rounded-[34px] sm:p-6 2xl:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_45%,rgba(3,76,133,0.12),transparent_35%)]" />

      {showArrows ? (
        <>
          <button
            type="button"
            onClick={goToPrevSlide}
            aria-label="Previous slider"
            className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[var(--tp-primary)] shadow-[0_12px_28px_rgba(3,76,133,0.13)] transition hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNextSlide}
            aria-label="Next slider"
            className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[var(--tp-primary)] shadow-[0_12px_28px_rgba(3,76,133,0.13)] transition hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div
        className={`relative grid gap-4 sm:gap-6 2xl:gap-8 ${
          imageSrc
            ? showCouponBox
              ? "items-stretch lg:min-h-[340px] lg:grid-cols-[minmax(0,1fr)_252px] 2xl:min-h-[360px] 2xl:grid-cols-[minmax(0,1fr)_260px]"
              : "items-stretch lg:min-h-[340px] 2xl:min-h-[360px]"
            : showCouponBox
              ? "lg:grid-cols-[minmax(320px,0.95fr)_minmax(340px,1fr)_252px] 2xl:grid-cols-[0.9fr_1.08fr_260px] lg:items-center"
              : "lg:grid-cols-[minmax(320px,0.95fr)_minmax(340px,1fr)] lg:items-center"
        }`}
      >
        <div className={`relative flex flex-col justify-center overflow-hidden rounded-[18px] sm:rounded-[24px] ${imageSrc ? "aspect-[2/1] min-h-[150px] w-full sm:min-h-[260px] lg:aspect-auto lg:h-full lg:min-h-0" : "max-w-xl"} space-y-5 2xl:space-y-7`}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={toText(slide.title, "Store promotion")}
              className={`absolute inset-0 h-full w-full object-contain ${getSliderImageFocusClass(slide.imageFocus)}`}
            />
          ) : null}
          <div className={`relative z-10 ${imageSrc ? "p-4 sm:p-8" : ""} flex flex-col h-full justify-center space-y-5 2xl:space-y-7`}>
            <div className="space-y-4 2xl:space-y-5">
              {titleText ? (
                <h1 className="max-w-2xl text-5xl font-black leading-[1.05] tracking-tight text-[#071a3f] dark:text-white 2xl:text-6xl">
                  {titleText}
                </h1>
              ) : null}
              {toText(slide.description) ? (
                <p className="max-w-lg text-base font-medium leading-7 text-[#4e6387] dark:text-slate-300 2xl:text-lg 2xl:leading-8">
                  {slide.description}
                </p>
              ) : null}
            </div>
          {ctaLabel ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              {ctaIsExternal ? (
                <a
                  href={ctaLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[var(--tp-primary)] px-8 text-base font-black text-white shadow-[0_16px_30px_rgba(3,76,133,0.2)] transition hover:-translate-y-0.5 hover:bg-[#023f70]"
                >
                  {ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </a>
              ) : (
                <Link
                  to={ctaLink}
                  className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[var(--tp-primary)] px-8 text-base font-black text-white shadow-[0_16px_30px_rgba(3,76,133,0.2)] transition hover:-translate-y-0.5 hover:bg-[#023f70]"
                >
                  {ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              {!imageSrc ? (
                <Link
                  to="/shop"
                  className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full border-2 border-[var(--tp-primary)] bg-white/60 px-8 text-base font-black text-[var(--tp-primary)] transition hover:-translate-y-0.5 hover:bg-white dark:bg-slate-950/60 dark:text-sky-300"
                >
                  <Grid3X3 className="h-5 w-5" />
                  Explore Categories
                </Link>
              ) : null}
            </div>
          ) : null}
          {showDots ? (
            <div className="absolute bottom-4 left-4 z-20 flex gap-2 sm:bottom-8 sm:left-8">
              {slides.map((_, index) => (
                <button
                  key={`main-slider-dot-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slider ${index + 1}`}
                  className={`h-3 rounded-full transition-all ${
                    index === slideIndex ? "w-8 bg-[var(--tp-accent)]" : "w-3 bg-[#adc6df]"
                  }`}
                />
              ))}
            </div>
          ) : null}
          </div>
        </div>

        {!imageSrc ? (
          <HeroVisual products={products} />
        ) : null}
        {showCouponBox ? (
          <CompactHeroCouponCard
            discountCouponBox={discountCouponBox}
            couponList={couponList}
            isLoading={couponsLoading}
            couponError={couponError}
            copiedCode={copiedCode}
            onCopy={onCopyCoupon}
          />
        ) : null}
      </div>
    </section>
  );
}

function BenefitStrip({ isIndo }) {
  const items = isIndo ? [
    {
      title: "Inovasi Media Pembelajaran",
      text: "Solusi pembelajaran digital yang berkualitas, bernilai guna, dan berdampak nyata.",
      Icon: Lightbulb,
    },
    {
      title: "Kolaborasi Cipta Karya",
      text: "Ruang bagi mahasiswa untuk mengubah ide kreatif menjadi produk edukasi aplikatif.",
      Icon: Handshake,
    },
    {
      title: "Pertumbuhan Edupreneur",
      text: "Membantu mahasiswa mengelola, mengemas, dan memasarkan karya secara profesional.",
      Icon: Rocket,
    },
    {
      title: "Solusi Belajar Aksesibel",
      text: "Media interaktif yang dirancang untuk menjawab tantangan pendidikan masa kini.",
      Icon: BookOpen,
    },
  ] : benefitItems;
  const content = isIndo
    ? {
        eyebrow: "KOMITMEN VISI MISI",
        title: "Dibangun untuk dampak pembelajaran digital",
        description:
          "Ringkasan praktis visi dan misi TP Preneurs: berkarya, meningkatkan kualitas, bertumbuh, dan memudahkan akses belajar.",
      }
    : {
        eyebrow: "VISION-MISSION COMMITMENTS",
        title: "Built for meaningful digital learning impact",
        description:
          "A practical snapshot of TP Preneurs' vision and mission: create, improve, grow, and make learning easier to access.",
      };

  return (
    <section className="rounded-[24px] border border-[#dbe6f3] bg-white p-4 shadow-[0_18px_40px_rgba(3,76,133,0.08)] dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[0.82fr_1.45fr] lg:items-stretch">
        <div className="rounded-xl bg-[#f7fbff] p-5 dark:bg-slate-950 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--tp-accent)]">
            {content.eyebrow}
          </p>
          <h2 className="mt-3 max-w-md text-2xl font-black leading-tight text-[var(--tp-primary)] dark:text-white sm:text-3xl">
            {content.title}
          </h2>
          <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-[#557099] dark:text-slate-300">
            {content.description}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {items.map(({ title, text, Icon }, index) => (
            <article
              key={title}
              className="group min-h-[154px] rounded-lg border border-[#dbe6f3] bg-white p-4 transition duration-300 hover:-translate-y-1 hover:border-[var(--tp-accent)] hover:shadow-[0_16px_30px_rgba(3,76,133,0.14)] dark:border-slate-800 dark:bg-slate-950 dark:hover:border-orange-400 sm:p-5"
            >
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[#edf6ff] text-[var(--tp-primary)] transition duration-300 group-hover:bg-[var(--tp-primary)] group-hover:text-white dark:bg-slate-800 dark:text-sky-300">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="ml-auto text-xs font-black text-[#adc6df] transition duration-300 group-hover:text-[var(--tp-accent)]">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 text-base font-black leading-snug text-[#071a3f] dark:text-white">
                {title}
              </h3>
              <p className="mt-2 text-sm font-medium leading-6 text-[#557099] dark:text-slate-300">
                {text}
              </p>
              <span className="mt-4 block h-1 w-8 rounded-full bg-[var(--tp-accent)] transition-all duration-300 group-hover:w-14" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionStatus({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-[22px] border border-dashed border-[#cbdced] bg-white/70 px-6 py-8 text-center dark:border-slate-700 dark:bg-slate-900/70">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-[#edf6ff] text-[var(--tp-primary)] dark:bg-slate-800 dark:text-sky-300">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 text-base font-black text-[#071a3f] dark:text-white">{title}</h3>
      <p className="mt-2 max-w-lg text-sm font-medium leading-6 text-[#557099] dark:text-slate-300">
        {description}
      </p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 rounded-full border border-[var(--tp-primary)] px-4 py-2 text-xs font-black text-[var(--tp-primary)] transition hover:bg-[var(--tp-primary)] hover:text-white dark:text-sky-300"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

function CategoryCard({ category }) {
  return (
    <Link
      to={`/search?category=${encodeURIComponent(category.slug)}&page=1`}
      className="group min-h-[176px] rounded-[22px] border border-[#dbe6f3] bg-white p-4 text-center shadow-[0_12px_28px_rgba(3,76,133,0.07)] transition hover:-translate-y-1 hover:border-[var(--tp-primary)] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="mx-auto grid h-24 w-full place-items-center rounded-[18px] bg-[#f7fbff] dark:bg-slate-800">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name} loading="lazy" className="h-full w-full object-contain p-3" />
        ) : (
          <span className="text-6xl">{category.emoji}</span>
        )}
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-black text-[var(--tp-primary)] dark:text-white">
        {category.name}
      </h3>
      <span className="mx-auto mt-3 grid h-9 w-9 place-items-center rounded-full border border-[var(--tp-accent)] text-sm text-[var(--tp-accent)] transition group-hover:border-[var(--tp-accent)] group-hover:bg-[var(--tp-accent)] group-hover:text-white">
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}

function StarRating({ value }) {
  const rating = Math.max(0, Math.min(5, toNumber(value, 0)));
  return (
    <div className="flex items-center gap-0.5 text-[#ffad0d]">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index < Math.round(rating) ? "fill-current" : "text-slate-300"}`}
        />
      ))}
    </div>
  );
}

function ProductCard({ product, compact = false, showDiscount = false }) {
  const { add, isLoading } = useCart();
  const { t, i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';
  const wishlist = useStorefrontWishlist();
  const [isAdding, setIsAdding] = useState(false);
  const [variantOpen, setVariantOpen] = useState(false);
  const timerRef = useRef(null);
  const imageSrc = product.imageUrl || "";
  const discount = calcDiscount(product);
  const hasVariants = productHasVariantSelections(product?.variations);
  const stockValue = Number(product?.stock);
  const isOutOfStock = Number.isFinite(stockValue) && stockValue <= 0;
  const purchaseState = product?.purchaseState || null;
  const isPurchasable =
    typeof purchaseState?.isPurchasable === "boolean"
      ? purchaseState.isPurchasable
      : !isOutOfStock;

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (hasVariants) {
      setVariantOpen(true);
      return;
    }
    if (isLoading || isAdding || !isPurchasable) return;
    setIsAdding(true);
    add(product.id, 1, {
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: imageSrc || null,
      stock: product.stock ?? null,
    });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsAdding(false), 700);
  };

  return (
    <article className="group relative flex h-full flex-col rounded-[18px] border border-[#dbe6f3] bg-white p-2.5 shadow-[0_12px_28px_rgba(3,76,133,0.07)] transition hover:-translate-y-1 hover:border-[var(--tp-primary)] dark:border-slate-800 dark:bg-slate-900 sm:p-3">
      {showDiscount && discount > 0 ? (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-[var(--tp-accent)] px-3 py-1 text-xs font-black text-white">
          -{discount}%
        </span>
      ) : null}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); wishlist.toggle(product); }}
        aria-label={`Save ${product.name}`}
        className={`absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full shadow-[0_8px_20px_rgba(3,76,133,0.12)] transition ${
          wishlist.isWishlisted(product.id || product.slug)
            ? "bg-[var(--tp-accent)] text-white hover:bg-[#d95700]"
            : "bg-white text-[#557099] hover:text-[var(--tp-accent)] dark:bg-slate-950 dark:text-slate-300"
        }`}
      >
        <Heart className={`h-5 w-5 ${wishlist.isWishlisted(product.id || product.slug) ? "fill-current" : ""}`} />
      </button>
      <div className="relative flex h-44 w-full overflow-hidden rounded-[16px] bg-[#f7fbff] p-2 dark:bg-slate-800 sm:h-48 sm:p-3">
        <Link to={`/product/${product.routeSlug || product.slug || product.id}`} className="flex h-full w-full items-center justify-center">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
              className="block h-full w-full object-contain object-center transition duration-300 group-hover:opacity-95"
              style={{ objectFit: "contain", objectPosition: "center" }}
            />
          ) : (
            <span className="text-7xl drop-shadow-sm">{product.emoji || "🛒"}</span>
          )}
        </Link>
        {!compact ? (
          <>
            <Link
              to={`/product/${product.routeSlug || product.slug || product.id}`}
              aria-label={`View ${product.name}`}
              className="absolute bottom-3 left-3 z-10 grid h-11 w-11 place-items-center rounded-full border border-white/80 bg-white text-[var(--tp-primary)] shadow-[0_10px_20px_rgba(3,76,133,0.12)] transition hover:bg-[var(--tp-accent)] hover:text-white dark:border-sky-400/60 dark:bg-slate-950/90 dark:!text-sky-100 dark:shadow-[0_10px_24px_rgba(14,165,233,0.18)] dark:hover:border-[var(--tp-accent)] dark:hover:bg-[var(--tp-accent)] dark:hover:!text-white"
            >
              <Eye className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={handleAdd}
              disabled={isLoading || isAdding || !isPurchasable}
              aria-label={`Add ${product.name} to cart`}
              className="absolute bottom-3 right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-[var(--tp-primary)] text-white shadow-[0_10px_20px_rgba(3,76,133,0.2)] transition hover:bg-[var(--tp-accent)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAdding ? <BadgeCheck className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            </button>
          </>
        ) : null}
      </div>
      <div className="mt-2.5 flex flex-1 flex-col justify-between space-y-2">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
          <Link to={`/product/${product.routeSlug || product.slug || product.id}`} className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-black leading-6 text-[#071a3f] transition group-hover:text-[var(--tp-primary)] dark:text-white">
              {product.name}
            </h3>
          </Link>
          {compact ? (
            <Link
              to={`/product/${product.routeSlug || product.slug || product.id}`}
              aria-label={`View ${product.name}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#dbe6f3] bg-white text-[var(--tp-primary)] transition hover:border-[var(--tp-accent)] hover:bg-[var(--tp-accent)] hover:text-white dark:border-sky-400/60 dark:bg-slate-950/90 dark:!text-sky-100 dark:hover:border-[var(--tp-accent)] dark:hover:bg-[var(--tp-accent)] dark:hover:!text-white"
            >
              <Eye className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        {!compact ? (
          toNumber(product.reviewCount, 0) > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#557099] dark:text-slate-300">
              <StarRating value={product.ratingAvg} />
              <span>{toNumber(product.ratingAvg, 0).toFixed(1)}</span>
              <span>({toNumber(product.reviewCount, 0)} {isIndo ? "ulasan" : "reviews"})</span>
            </div>
          ) : (
            <p className="text-xs font-semibold text-[#7185a4] dark:text-slate-400">{isIndo ? "Belum ada ulasan" : "No reviews yet"}</p>
          )
        ) : null}
        </div>
        <div className="flex flex-wrap items-baseline gap-3 pt-1">
          <span className="text-lg font-black text-[var(--tp-primary)] dark:text-sky-300">
            {formatCurrency(product.price)}
          </span>
          {product.originalPrice > product.price ? (
            <span className="text-sm font-semibold text-slate-400 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          ) : null}
        </div>
      </div>
      <VariantQuickAddModal
        open={variantOpen}
        onClose={() => setVariantOpen(false)}
        product={product}
        fallbackImageSrc={imageSrc}
      />
    </article>
  );
}

function PromoStrip({ isIndo }) {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(isIndo ? "Silakan masukkan alamat email." : "Please enter an email address.");
      return;
    }
    toast.success(isIndo ? "Berhasil berlangganan newsletter!" : "Successfully subscribed to our newsletter!");
    setEmail("");
  };

  return (
    <section className="grid gap-6 rounded-[24px] bg-white p-4 shadow-[0_14px_34px_rgba(3,76,133,0.08)] dark:bg-slate-900 sm:rounded-[28px] sm:p-6 xl:grid-cols-2">
      <div className="flex flex-col gap-4 border-[#dbe6f3] dark:border-slate-800 sm:flex-row sm:items-center sm:gap-5 xl:border-r xl:pr-10">
        <div className="flex -space-x-3">
          {["A", "K", "M", "S"].map((item, index) => (
            <span
              key={item}
              className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-[var(--tp-primary)] text-sm font-black text-white dark:border-slate-900"
              style={{ background: index % 2 ? ACCENT : PRIMARY }}
            >
              {item}
            </span>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-black text-[var(--tp-primary)] dark:text-white">
            {isIndo ? "Dipercaya oleh Ribuan Pelanggan yang Puas" : "Trusted by Thousands of Happy Customers"}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[var(--tp-primary)] px-3 py-2 text-sm font-black text-white">
              4.8
            </span>
            <StarRating value={5} />
            <span className="text-sm font-semibold text-[#557099] dark:text-slate-300">
              ({isIndo ? "120Rb+ Ulasan" : "120K+ Reviews"})
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-[var(--tp-primary)] dark:text-white">
            {isIndo ? "Berlangganan Newsletter Kami" : "Subscribe to Our Newsletter"}
          </h3>
          <p className="mt-1 text-sm font-medium text-[#557099] dark:text-slate-300">
            {isIndo ? "Dapatkan penawaran, tips & pembaruan terbaru." : "Get the latest offers, tips & updates."}
          </p>
          <form onSubmit={handleSubscribe} className="mt-4 flex flex-col overflow-hidden rounded-xl border border-[#dbe6f3] bg-white dark:border-slate-700 dark:bg-slate-950 sm:flex-row">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <div className="hidden items-center pl-4 pr-2 text-[#557099] dark:text-slate-400 sm:flex">
              <Mail className="h-5 w-5" />
            </div>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isIndo ? "Masukkan alamat email Anda" : "Enter your email address"}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm font-semibold text-[#071a3f] outline-none dark:text-white sm:px-0 sm:py-2.5 sm:pr-4"
            />
            <button type="submit" className="bg-[var(--tp-accent)] px-5 py-3 text-sm font-black text-white sm:py-0">
              {isIndo ? "Berlangganan" : "Subscribe"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default function TPPreneurHomePage() {
  const { t, i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID' || i18n.language?.startsWith("id") || (typeof window !== "undefined" && localStorage.getItem("store_language") === "Indonesia");
  const currentLang = isIndo ? "id" : "en";
  const [copiedCode, setCopiedCode] = useState("");
  const [popularCategory, setPopularCategory] = useState("all");
  const [popularSort, setPopularSort] = useState("");
  const { data: homeCustomizationData } = useQuery({
    queryKey: ["store-customization", "home-page", currentLang],
    queryFn: () => getStoreCustomization({ lang: currentLang, include: "home" }),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const homeConfig =
    homeCustomizationData?.customization?.home ||
    homeCustomizationData?.data?.customization?.home ||
    {};
  const featuredCategoriesConfig = useMemo(() => {
    const source = homeConfig?.featuredCategories || {};
    return {
      enabled: toBool(source.enabled, true),
      title: toText(source.title, "Shop by Category"),
      description: toText(
        source.description,
        "Explore the categories currently available in our marketplace."
      ),
      limit: toLimit(source.productsLimit, 8, 12),
      buttonName: toText(source.buttonName, "View all categories"),
      buttonLink: normalizeLink(source.buttonLink, "/shop"),
      sort: normalizeFeaturedCategoriesSort(source.source),
    };
  }, [homeConfig]);
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories({ parentsOnly: true, sort: featuredCategoriesConfig.sort });
  const popularProductsConfig = useMemo(() => {
    const source = homeConfig?.popularProducts || {};
    const filterBy = toText(source.filterBy, "All Categories");
    const sort = normalizePopularProductsSort(source.source, source.sortBy);
    return {
      enabled: toBool(source.enabled, true),
      title: toText(source.title, "Popular Products").replace(" for Daily Shopping", ""),
      description: toText(
        source.description,
        "Discover products customers are exploring across the marketplace."
      ),
      limit: toLimit(source.productsLimit, 10, 20),
      buttonName: toText(source.buttonName, "View all"),
      buttonLink: normalizeLink(source.buttonLink, "/shop"),
      sort,
      discounted: isDiscountedPopularFilter(filterBy),
    };
  }, [homeConfig]);
  const effectivePopularSort = popularSort || popularProductsConfig.sort;
  const {
    data: popularData,
    isLoading: popularLoading,
    isFetching: popularFetching,
    error: popularError,
    refetch: refetchPopular,
  } = useProducts({
    page: 1,
    limit: popularProductsConfig.limit,
    category: popularCategory === "all" ? undefined : popularCategory,
    sort: effectivePopularSort,
    discounted: popularProductsConfig.discounted,
  });
  const { data: discountedData, isLoading: discountedLoading } = useProducts({
    page: 1,
    limit: 5,
    discounted: true,
    sort: "featured",
  });
  const {
    data: couponData,
    isLoading: couponsLoading,
    error: couponError,
  } = useQuery({
    queryKey: ["storefront", "home-page-coupons"],
    queryFn: () => fetchStoreCoupons(),
    staleTime: 60_000,
    retry: 1,
  });

  const mainSlider = useMemo(() => normalizeMainSlider(homeConfig), [homeConfig]);
  const discountCouponBox = useMemo(
    () => normalizeDiscountCouponBox(homeConfig),
    [homeConfig]
  );
  const promotionBannerConfig = useMemo(() => {
    const source =
      homeConfig?.promotionBanner && typeof homeConfig.promotionBanner === "object"
        ? homeConfig.promotionBanner
        : {};
    return {
      enabled: toBool(source.enabled, false),
      title: toText(source.title, "Big Deals. Bigger Savings."),
      subTitle: toText(source.subtitle),
      description: toText(
        source.description,
        "Shop handpicked products at special prices. Offer valid for a limited time only."
      ),
      buttonName: toText(source.buttonName, "Shop Now"),
      buttonLink: normalizeLink(source.buttonLink, "/shop"),
      imageDataUrl: toText(source.imageDataUrl),
      displayOn: toText(source.displayOn, "Desktop & Mobile"),
    };
  }, [homeConfig]);

  const categories = useMemo(() => {
    const source = extractList(categoriesData);
    return source
      .slice(0, featuredCategoriesConfig.limit)
      .map((category, index) => normalizeCategory(category, index));
  }, [categoriesData, featuredCategoriesConfig.limit]);

  const popularProducts = useMemo(() => {
    const source = extractList(popularData);
    return source
      .slice(0, popularProductsConfig.limit)
      .map((product, index) => normalizeProduct(product, index));
  }, [popularData, popularProductsConfig.limit]);

  useEffect(() => {
    if (popularCategory === "all" || categoriesLoading || categories.length === 0) return;
    if (!categories.some((category) => category.slug === popularCategory)) {
      setPopularCategory("all");
    }
  }, [categories, popularCategory, categoriesLoading]);

  const displayFeaturedTitle = isIndo && featuredCategoriesConfig.title === "Featured Categories" ? "Kategori Unggulan" : (isIndo && featuredCategoriesConfig.title === "Shop by Category" ? "Belanja berdasarkan Kategori" : featuredCategoriesConfig.title);
  const displayFeaturedDesc = isIndo && featuredCategoriesConfig.description === "Choose your necessary products from this feature categories." ? "Pilih produk kebutuhan Anda dari kategori unggulan ini." : (isIndo && featuredCategoriesConfig.description === "Explore the categories currently available in our marketplace." ? "Jelajahi kategori yang tersedia saat ini di pasar kami." : featuredCategoriesConfig.description);
  const displayFeaturedBtn = isIndo && featuredCategoriesConfig.buttonName === "View all categories" ? "Lihat semua kategori" : featuredCategoriesConfig.buttonName;
  
  const displayPopularTitle = isIndo && popularProductsConfig.title === "Popular Products" ? "Produk Populer" : popularProductsConfig.title;
  const displayPopularBtn = isIndo && popularProductsConfig.buttonName === "View all" ? "Lihat semua" : popularProductsConfig.buttonName;

  const featuredHeading = useMemo(
    () => splitHeadingAccent(displayFeaturedTitle, isIndo ? "Kategori Unggulan" : "Shop by Category"),
    [displayFeaturedTitle, isIndo]
  );
  const popularViewAllHref = useMemo(() => {
    const configuredLink = popularProductsConfig.buttonLink;
    if (configuredLink !== "/shop") return configuredLink;
    const params = new URLSearchParams();
    if (popularCategory !== "all") params.set("category", popularCategory);
    if (effectivePopularSort !== "featured") params.set("sort", effectivePopularSort);
    if (popularProductsConfig.discounted) params.set("discounted", "true");
    const query = params.toString();
    return query ? `/shop?${query}` : "/shop";
  }, [effectivePopularSort, popularCategory, popularProductsConfig.buttonLink, popularProductsConfig.discounted]);

  const discountedProducts = useMemo(() => {
    const source = extractList(discountedData);
    return (source.length ? source : fallbackDiscountedProducts)
      .slice(0, 5)
      .map((product, index) => normalizeProduct(product, index));
  }, [discountedData]);

  const couponList = useMemo(() => {
    const selectedCodes = discountCouponBox.activeCouponCodes || [];
    if (!selectedCodes.length) return [];

    const apiCoupons = extractList(couponData).map(normalizeCouponForPanel);
    const couponByCode = new Map(apiCoupons.map((coupon) => [coupon.code, coupon]));

    return selectedCodes.map((code) => {
      const normalizedCode = toText(code).toUpperCase();
      return (
        couponByCode.get(normalizedCode) || {
          id: `configured-${normalizedCode}`,
          code: normalizedCode,
          discountLabel: "Coupon code",
          statusLabel: "Configured",
          statusTone: "emerald",
          scopeLabel: "Storefront",
          minimumOrderLabel: "See checkout",
          validityLabel: "Configured in homepage settings",
          expiresAt: null,
        }
      );
    });
  }, [couponData, discountCouponBox.activeCouponCodes]);

  const copyCouponCode = async (code) => {
    const normalizedCode = toText(code).toUpperCase();
    if (!normalizedCode) return;
    try {
      await navigator.clipboard?.writeText(normalizedCode);
    } catch {
      // Clipboard permission can be unavailable; the visual feedback still confirms the click.
    }
    setCopiedCode(normalizedCode);
    setTimeout(() => setCopiedCode(""), 3000);
  };

  return (
    <div className="mx-0 space-y-5 bg-[#f7fbff] pb-8 text-[#071a3f] dark:bg-slate-950 sm:mx-1 sm:space-y-6 sm:pb-0 lg:mx-2">
      <MainSliderSection
        mainSlider={mainSlider}
        products={popularProducts}
        discountCouponBox={discountCouponBox}
        couponList={couponList}
        couponsLoading={couponsLoading}
        couponError={couponError?.message}
        copiedCode={copiedCode}
        onCopyCoupon={copyCouponCode}
      />
      {popularProductsConfig.enabled ? (
        <section className="space-y-5 rounded-[28px] bg-white p-5 shadow-[0_14px_34px_rgba(3,76,133,0.08)] dark:bg-slate-900 sm:p-7" aria-busy={popularFetching}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <h2 className="flex items-center gap-3 text-2xl font-black text-[#071a3f] dark:text-white">
                {displayPopularTitle}
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[var(--tp-accent)]" />
              </h2>
              {popularProductsConfig.description ? (
                <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-[#557099] dark:text-slate-300">
                  {popularProductsConfig.description}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-nowrap">
              <label className="relative">
                <span className="sr-only">Sort popular products</span>
                <select
                  value={effectivePopularSort}
                  onChange={(event) => setPopularSort(event.target.value)}
                  className="h-11 min-w-52 appearance-none rounded-full border border-[#dbe6f3] bg-white py-0 pl-5 pr-11 text-sm font-bold text-[#31486e] outline-none transition focus:border-[var(--tp-primary)] focus:ring-2 focus:ring-[var(--tp-primary)]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {POPULAR_SORT_OPTIONS.map((option) => {
                    let label = option.label;
                    if (isIndo) {
                      if (option.value === "featured") label = "Unggulan";
                      else if (option.value === "newest") label = "Terbaru";
                      else if (option.value === "highest_rated") label = "Rating Tertinggi";
                      else if (option.value === "price_asc") label = "Harga: Rendah ke Tinggi";
                      else if (option.value === "price_desc") label = "Harga: Tinggi ke Rendah";
                    }
                    return <option key={option.value} value={option.value}>{label}</option>;
                  })}
                </select>
                <ChevronRight className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rotate-90 text-[#557099] dark:!text-sky-300" />
              </label>
              <Link
                to={popularViewAllHref}
                className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-[var(--tp-primary)] bg-white/70 px-5 text-sm font-black text-[var(--tp-primary)] transition hover:bg-[var(--tp-primary)] hover:text-white dark:border-sky-400/70 dark:bg-slate-950/70 dark:!text-sky-100 dark:hover:border-sky-300 dark:hover:bg-[var(--tp-primary)] dark:hover:!text-white"
              >
                {displayPopularBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-[#e8f0f8] pt-5 dark:border-slate-800">
            {[{ id: "all", slug: "all", name: isIndo ? "Semua" : "All" }, ...categories].map((category) => {
              const active = popularCategory === category.slug;
              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPopularCategory(category.slug)}
                  className={`inline-flex h-9 items-center rounded-full border px-5 text-sm font-bold transition ${
                    active
                      ? "border-[var(--tp-primary)] bg-[var(--tp-primary)] text-white"
                      : "border-[#dbe6f3] text-[#31486e] hover:border-[var(--tp-primary)] hover:text-[var(--tp-primary)] dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
            {popularFetching && popularProducts.length > 0 ? (
              <span className="ml-auto text-xs font-bold text-[#7185a4] dark:text-slate-400">{isIndo ? "Memperbarui produk..." : "Updating products..."}</span>
            ) : null}
          </div>

          {popularLoading && popularProducts.length === 0 ? (
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" aria-label="Loading products">
              {Array.from({ length: Math.min(popularProductsConfig.limit, 10) }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-[18px] bg-[#f0f6fd] dark:bg-slate-800" />
              ))}
            </div>
          ) : popularError && popularProducts.length === 0 ? (
            <SectionStatus
              icon={ShoppingCart}
              title="Products are unavailable"
              description={popularError?.response?.data?.message || popularError?.message || "We could not load popular products."}
              actionLabel="Try again"
              onAction={() => refetchPopular()}
            />
          ) : popularProducts.length === 0 ? (
            <SectionStatus
              icon={ShoppingCart}
              title={popularCategory === "all" ? "No products yet" : "No products in this category"}
              description={popularCategory === "all" ? "Published products will appear here as soon as they are available." : "Choose another category or view all available products."}
              actionLabel={popularCategory === "all" ? undefined : "Show all products"}
              onAction={popularCategory === "all" ? undefined : () => setPopularCategory("all")}
            />
          ) : (
            <>
              {popularError ? (
                <div className="flex items-center justify-between gap-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <span>Could not refresh the latest products.</span>
                  <button type="button" onClick={() => refetchPopular()} className="underline">Try again</button>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} showDiscount />
                ))}
              </div>
            </>
          )}
        </section>
      ) : null}

      {featuredCategoriesConfig.enabled ? (
        <section className="space-y-6">
          <SectionHeading
            eyebrow={isIndo ? "KATEGORI UNGGULAN" : "Featured Categories"}
            title={featuredHeading.title}
            accent={featuredHeading.accent}
            description={displayFeaturedDesc}
            action={
              <Link
                to={featuredCategoriesConfig.buttonLink}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[var(--tp-primary)] bg-white/70 px-5 text-sm font-black text-[var(--tp-primary)] transition hover:bg-[var(--tp-primary)] hover:text-white dark:border-sky-400/70 dark:bg-slate-950/70 dark:!text-sky-100 dark:hover:border-sky-300 dark:hover:bg-[var(--tp-primary)] dark:hover:!text-white"
              >
                {displayFeaturedBtn}
                <ArrowRight className="h-4 w-4" />
              </Link>
            }
          />
          {categoriesLoading && categories.length === 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8" aria-label="Loading categories">
              {Array.from({ length: Math.min(featuredCategoriesConfig.limit, 8) }).map((_, index) => (
                <div key={index} className="h-52 animate-pulse rounded-[22px] bg-white dark:bg-slate-800" />
              ))}
            </div>
          ) : categoriesError && categories.length === 0 ? (
            <SectionStatus
              icon={Grid3X3}
              title="Categories are unavailable"
              description={categoriesError?.response?.data?.message || categoriesError?.message || "We could not load the category list."}
              actionLabel="Try again"
              onAction={() => refetchCategories()}
            />
          ) : categories.length === 0 ? (
            <SectionStatus
              icon={Grid3X3}
              title="No categories yet"
              description="Published categories will appear here as soon as they are available."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
              {categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-2xl font-black text-[#071a3f] dark:text-white">
            {isIndo ? "Produk Diskon Terbaru" : "Latest Discounted Products"}
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--tp-accent)]" />
          </h2>
          <div className="hidden items-center gap-3 sm:flex">
            <button className="grid h-11 w-11 place-items-center rounded-full border border-[#dbe6f3] bg-white text-[var(--tp-primary)] transition hover:border-[var(--tp-primary)] hover:bg-[var(--tp-primary)] hover:text-white dark:border-sky-400/60 dark:bg-slate-950/70 dark:!text-sky-100 dark:hover:border-sky-300 dark:hover:bg-[var(--tp-primary)] dark:hover:!text-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link
              to="/search?discounted=true&page=1"
              className="inline-flex h-11 items-center rounded-full border border-[var(--tp-primary)] bg-white/70 px-5 text-sm font-black text-[var(--tp-primary)] transition hover:bg-[var(--tp-primary)] hover:text-white dark:border-sky-400/70 dark:bg-slate-950/70 dark:!text-sky-100 dark:hover:border-sky-300 dark:hover:bg-[var(--tp-primary)] dark:hover:!text-white"
            >
              {isIndo ? "Lihat semua" : "View all"}
            </Link>
            <button className="grid h-11 w-11 place-items-center rounded-full border border-[var(--tp-accent)] bg-[var(--tp-accent)] text-white shadow-[0_10px_22px_rgba(255,111,0,0.22)] transition hover:bg-[#d95700]">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        {discountedLoading && extractList(discountedData).length === 0 ? (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-[18px] bg-white dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} showDiscount />
            ))}
          </div>
        )}
      </section>

      <BenefitStrip isIndo={isIndo} />

      {promotionBannerConfig.enabled ? (
        <div
          className={
            promotionBannerConfig.displayOn === "Desktop Only"
              ? "hidden lg:block"
              : promotionBannerConfig.displayOn === "Mobile Only"
                ? "lg:hidden"
                : ""
          }
        >
          <PromoDeliveryBanner
            subTitle={promotionBannerConfig.subTitle}
            title={promotionBannerConfig.title}
            description={promotionBannerConfig.description}
            buttonName={promotionBannerConfig.buttonName}
            buttonLink={promotionBannerConfig.buttonLink}
            imageDataUrl={promotionBannerConfig.imageDataUrl}
          />
        </div>
      ) : null}


      <DiscoverDigitalProductsHero />

      <PromoStrip isIndo={isIndo} />
    </div>
  );
}
