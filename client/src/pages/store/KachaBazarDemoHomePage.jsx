import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Grid3X3,
  Headphones,
  Heart,
  Leaf,
  Mail,
  ShieldCheck,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../hooks/useCart.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import VariantQuickAddModal from "../../components/store/VariantQuickAddModal.jsx";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { fetchStoreCoupons } from "../../api/public/storeCoupons.ts";
import { useCategories, useProducts } from "../../storefront.jsx";
import { formatCurrency } from "../../utils/format.js";
import { resolveProductImageUrl } from "../../utils/productImage.js";
import { productHasVariantSelections } from "../../utils/publicProductVariations.js";

const PRIMARY = "#034c85";
const ACCENT = "#fe6f05";
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

const chips = [
  "All",
  "Fresh Vegetables",
  "Fresh Fruits",
  "Bread & Bakery",
  "Milk & Dairy",
  "Meat & Fish",
  "Beverages",
  "Baby Care",
  "Snacks",
];

const benefitItems = [
  {
    title: "100% Natural & Organic",
    text: "Pure and safe products for a healthier you.",
    Icon: Leaf,
  },
  {
    title: "Quality You Can Trust",
    text: "Sourced with care, checked for quality.",
    Icon: ShieldCheck,
  },
  {
    title: "Fast & Free Delivery",
    text: "On orders over Rp 75.000 within local area.",
    Icon: Truck,
  },
  {
    title: "24/7 Customer Support",
    text: "We're here to help you anytime.",
    Icon: Headphones,
  },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#fe6f05]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#034c85] dark:text-white sm:text-4xl">
          {title} {accent ? <span className="text-[#fe6f05]">{accent}</span> : null}
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
      <div className="absolute inset-x-[12%] bottom-7 h-24 rounded-full bg-[#034c85]/10 blur-3xl" />
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
  const title = toText(discountCouponBox.title, "Latest Super Discount Active Coupon Code");

  return (
    <aside className="relative mx-auto flex min-h-[338px] w-full max-w-[252px] flex-col overflow-hidden rounded-[26px] border border-[#cdebdc] bg-white p-4 text-[#071a3f] shadow-[0_18px_34px_rgba(3,76,133,0.13)] dark:border-slate-700 dark:bg-slate-950 dark:text-white lg:mx-0 2xl:max-w-[260px]">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#fe6f05]" />
      <div className="text-left">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#fe6f05]">
          Coupon Box
        </p>
        <h3 className="mt-2 text-[17px] font-black leading-5 text-[#071a3f] dark:text-white">
          {title}
        </h3>
      </div>

      <div className="mt-4 flex flex-1 flex-col justify-between gap-3">
        {isLoading ? (
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#cdebdc] bg-[#f7fbff] px-4 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="h-9 w-9 animate-pulse rounded-full bg-[#dbe6f3]" />
            <p className="mt-3 text-xs font-bold text-[#557099] dark:text-slate-300">
              Loading coupons...
            </p>
          </div>
        ) : primaryCoupon ? (
          <>
            <button
              type="button"
              onClick={() => onCopy?.(primaryCoupon.code)}
              className="rounded-[20px] border-2 border-dashed border-[#00b876]/45 bg-[#f2fff8] px-3 py-4 text-center transition hover:border-[#00b876] hover:bg-[#ecfff5] dark:bg-slate-900"
              aria-label={`Copy coupon code ${primaryCoupon.code}`}
              title={`Copy ${primaryCoupon.code}`}
            >
              <span className="text-[9px] font-black uppercase tracking-[0.24em] text-[#00a46c]">
                {copiedCode === primaryCoupon.code ? "Copied!" : "Coupon Code"}
              </span>
              <span className="mt-2 block break-all text-[22px] font-black leading-none tracking-[0.14em] text-[#034c85] dark:text-sky-300">
                {primaryCoupon.code}
              </span>
            </button>

            <div className="rounded-2xl bg-[#f7fbff] p-3 text-left dark:bg-slate-900">
              <p className="text-[13px] font-black text-[#fe6f05]">
                {primaryCoupon.discountLabel || "Active discount"}
              </p>
              <p className="mt-1.5 text-[11px] font-semibold leading-5 text-[#557099] dark:text-slate-300">
                Min Order: {primaryCoupon.minimumOrderLabel || "See checkout"}
              </p>
              <p className="text-[11px] font-semibold leading-5 text-[#557099] dark:text-slate-300">
                Validity: {primaryCoupon.validityLabel || "No expiry limit"}
              </p>
            </div>

            {safeCoupons.length > 1 ? (
              <div className="flex flex-wrap gap-2">
                {safeCoupons.slice(1, 5).map((coupon) => (
                  <button
                    key={coupon.code}
                    type="button"
                    onClick={() => onCopy?.(coupon.code)}
                    className={`h-7 rounded-full border px-3 text-[10px] font-black tracking-[0.12em] transition ${
                      copiedCode === coupon.code
                        ? "border-[#fe6f05] bg-[#fe6f05] text-white"
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
              No active coupon yet
            </p>
            <p className="mt-2 text-xs leading-5 text-[#557099] dark:text-slate-300">
              {couponError || "Add coupon codes from homepage settings."}
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
    <section className="relative overflow-hidden rounded-[34px] bg-[#eef6ff] p-5 shadow-[0_18px_42px_rgba(3,76,133,0.08)] dark:bg-slate-900 sm:p-6 2xl:p-8">
      {imageSrc ? (
        <>
          <img
            src={imageSrc}
            alt={toText(slide.title, "Store promotion")}
            className={`absolute inset-0 h-full w-full object-cover ${getSliderImageFocusClass(slide.imageFocus)}`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#eef6ff]/96 via-[#eef6ff]/70 to-[#eef6ff]/8 dark:from-slate-950/92 dark:via-slate-950/62 dark:to-slate-950/12" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_58%_45%,rgba(3,76,133,0.12),transparent_35%)]" />
      )}

      {showArrows ? (
        <>
          <button
            type="button"
            onClick={goToPrevSlide}
            aria-label="Previous slider"
            className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[#034c85] shadow-[0_12px_28px_rgba(3,76,133,0.13)] transition hover:bg-white"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToNextSlide}
            aria-label="Next slider"
            className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/90 text-[#034c85] shadow-[0_12px_28px_rgba(3,76,133,0.13)] transition hover:bg-white"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div
        className={`relative grid gap-6 2xl:gap-8 ${
          imageSrc
            ? showCouponBox
              ? "min-h-[340px] items-center lg:min-h-[340px] lg:grid-cols-[minmax(0,1fr)_252px] 2xl:min-h-[360px] 2xl:grid-cols-[minmax(0,1fr)_260px]"
              : "min-h-[340px] items-center lg:min-h-[340px] 2xl:min-h-[360px]"
            : showCouponBox
              ? "lg:grid-cols-[minmax(320px,0.95fr)_minmax(340px,1fr)_252px] 2xl:grid-cols-[0.9fr_1.08fr_260px] lg:items-center"
              : "lg:grid-cols-[minmax(320px,0.95fr)_minmax(340px,1fr)] lg:items-center"
        }`}
      >
        <div className={`${imageSrc ? "max-w-xl" : ""} space-y-5 2xl:space-y-7`}>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-[#fe6f05]">
            100% Natural & Organic
          </p>
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
                  className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[#034c85] px-8 text-base font-black text-white shadow-[0_16px_30px_rgba(3,76,133,0.2)] transition hover:-translate-y-0.5 hover:bg-[#023f70]"
                >
                  {ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </a>
              ) : (
                <Link
                  to={ctaLink}
                  className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full bg-[#034c85] px-8 text-base font-black text-white shadow-[0_16px_30px_rgba(3,76,133,0.2)] transition hover:-translate-y-0.5 hover:bg-[#023f70]"
                >
                  {ctaLabel}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              )}
              {!imageSrc ? (
                <Link
                  to="/shop"
                  className="inline-flex h-14 items-center justify-center gap-3 whitespace-nowrap rounded-full border-2 border-[#034c85] bg-white/60 px-8 text-base font-black text-[#034c85] transition hover:-translate-y-0.5 hover:bg-white dark:bg-slate-950/60 dark:text-sky-300"
                >
                  <Grid3X3 className="h-5 w-5" />
                  Explore Categories
                </Link>
              ) : null}
            </div>
          ) : null}
          {showDots ? (
            <div className="flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={`main-slider-dot-${index}`}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Show slider ${index + 1}`}
                  className={`h-3 rounded-full transition-all ${
                    index === slideIndex ? "w-8 bg-[#fe6f05]" : "w-3 bg-[#adc6df]"
                  }`}
                />
              ))}
            </div>
          ) : null}
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

function BenefitStrip() {
  return (
    <section className="grid gap-4 rounded-[28px] bg-white p-5 shadow-[0_14px_34px_rgba(3,76,133,0.08)] dark:bg-slate-900 md:grid-cols-2 xl:grid-cols-4">
      {benefitItems.map(({ title, text, Icon }) => (
        <div key={title} className="flex gap-5 border-[#dbe6f3] p-3 xl:border-r xl:last:border-r-0 dark:border-slate-800">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-[#f7fbff] text-[#034c85] dark:bg-slate-800 dark:text-sky-300">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-black text-[#034c85] dark:text-white">{title}</h3>
            <p className="mt-2 text-sm font-medium leading-6 text-[#557099] dark:text-slate-300">
              {text}
            </p>
            <span className="mt-4 block h-1 w-7 rounded-full bg-[#fe6f05]" />
          </div>
        </div>
      ))}
    </section>
  );
}

function CategoryCard({ category, active }) {
  return (
    <Link
      to={`/search?category=${encodeURIComponent(category.slug)}&page=1`}
      className={`group min-h-[176px] rounded-[22px] border bg-white p-4 text-center shadow-[0_12px_28px_rgba(3,76,133,0.07)] transition hover:-translate-y-1 hover:border-[#034c85] dark:bg-slate-900 ${
        active ? "border-[#034c85]" : "border-[#dbe6f3] dark:border-slate-800"
      }`}
    >
      <div className="mx-auto grid h-24 w-full place-items-center rounded-[18px] bg-[#f7fbff] dark:bg-slate-800">
        {category.imageUrl ? (
          <img src={category.imageUrl} alt={category.name} loading="lazy" className="h-full w-full object-contain p-3" />
        ) : (
          <span className="text-6xl">{category.emoji}</span>
        )}
      </div>
      <h3 className="mt-4 line-clamp-2 text-sm font-black text-[#034c85] dark:text-white">
        {category.name}
      </h3>
      <span className={`mx-auto mt-3 grid h-9 w-9 place-items-center rounded-full border text-sm transition group-hover:border-[#fe6f05] group-hover:bg-[#fe6f05] group-hover:text-white ${
        active ? "border-[#034c85] bg-[#034c85] text-white" : "border-[#fe6f05] text-[#fe6f05]"
      }`}>
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
    <article className="group relative rounded-[18px] border border-[#dbe6f3] bg-white p-3 shadow-[0_12px_28px_rgba(3,76,133,0.07)] transition hover:-translate-y-1 hover:border-[#034c85] dark:border-slate-800 dark:bg-slate-900">
      {showDiscount && discount > 0 ? (
        <span className="absolute left-4 top-4 z-10 rounded-full bg-[#fe6f05] px-3 py-1 text-xs font-black text-white">
          -{discount}%
        </span>
      ) : null}
      <button
        type="button"
        aria-label={`Save ${product.name}`}
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-[#557099] shadow-[0_8px_20px_rgba(3,76,133,0.12)] transition hover:text-[#fe6f05] dark:bg-slate-950 dark:text-slate-300"
      >
        <Heart className="h-5 w-5" />
      </button>
      <Link to={`/product/${product.routeSlug || product.slug || product.id}`} className="block">
        <div className={`relative grid place-items-center overflow-hidden rounded-[16px] bg-[#f7fbff] dark:bg-slate-800 ${compact ? "aspect-[1.35]" : "aspect-square"}`}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              loading="lazy"
              onError={(event) => {
                event.currentTarget.src = PLACEHOLDER_IMAGE;
              }}
              className="h-full w-full object-contain p-5 transition duration-300 group-hover:scale-[1.04]"
            />
          ) : (
            <span className="text-7xl drop-shadow-sm">{product.emoji || "🛒"}</span>
          )}
          {!compact ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={isLoading || isAdding || !isPurchasable}
              aria-label={`Add ${product.name} to cart`}
              className="absolute bottom-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-[#034c85] text-white shadow-[0_10px_20px_rgba(3,76,133,0.2)] transition hover:bg-[#fe6f05] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAdding ? <BadgeCheck className="h-5 w-5" /> : <ShoppingCart className="h-5 w-5" />}
            </button>
          ) : null}
        </div>
      </Link>
      <div className="mt-3 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Link to={`/product/${product.routeSlug || product.slug || product.id}`} className="min-w-0">
            <h3 className="line-clamp-2 text-sm font-black leading-6 text-[#071a3f] transition group-hover:text-[#034c85] dark:text-white">
              {product.name}
            </h3>
          </Link>
          {compact ? (
            <Link
              to={`/product/${product.routeSlug || product.slug || product.id}`}
              aria-label={`View ${product.name}`}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#dbe6f3] text-[#034c85] transition hover:border-[#fe6f05] hover:bg-[#fe6f05] hover:text-white dark:border-slate-700"
            >
              <Eye className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
        {!compact ? (
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#557099] dark:text-slate-300">
            <StarRating value={product.ratingAvg} />
            <span>{toNumber(product.ratingAvg, 4.5).toFixed(1)}</span>
            <span>({toNumber(product.reviewCount, 0)} reviews)</span>
          </div>
        ) : null}
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-lg font-black text-[#034c85] dark:text-sky-300">
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

function PromoStrip() {
  return (
    <section className="grid gap-6 rounded-[28px] bg-white p-6 shadow-[0_14px_34px_rgba(3,76,133,0.08)] dark:bg-slate-900 xl:grid-cols-3">
      <div className="flex items-center gap-5">
        <div className="grid h-24 w-20 shrink-0 place-items-center rounded-[22px] border border-[#dbe6f3] bg-[#f7fbff] text-5xl dark:border-slate-800 dark:bg-slate-950">
          📱
        </div>
        <div>
          <h3 className="text-lg font-black text-[#034c85] dark:text-white">
            Download the TP Preneurs App
          </h3>
          <p className="mt-1 text-sm font-medium text-[#557099] dark:text-slate-300">
            Shop on the go & get exclusive app-only offers.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-black px-3 text-xs font-black text-white">
              <Download className="h-4 w-4" /> Google Play
            </span>
            <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-black px-3 text-xs font-black text-white">
              <Download className="h-4 w-4" /> App Store
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5 border-[#dbe6f3] xl:border-x xl:px-10 dark:border-slate-800">
        <div className="flex -space-x-3">
          {["A", "K", "M", "S"].map((item, index) => (
            <span
              key={item}
              className="grid h-11 w-11 place-items-center rounded-full border-2 border-white bg-[#034c85] text-sm font-black text-white dark:border-slate-900"
              style={{ background: index % 2 ? ACCENT : PRIMARY }}
            >
              {item}
            </span>
          ))}
        </div>
        <div>
          <h3 className="text-lg font-black text-[#034c85] dark:text-white">
            Trusted by Thousands of Happy Customers
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#034c85] px-3 py-2 text-sm font-black text-white">
              4.8
            </span>
            <StarRating value={5} />
            <span className="text-sm font-semibold text-[#557099] dark:text-slate-300">
              (120K+ Reviews)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-black text-[#034c85] dark:text-white">
            Subscribe to Our Newsletter
          </h3>
          <p className="mt-1 text-sm font-medium text-[#557099] dark:text-slate-300">
            Get the latest offers, tips & updates.
          </p>
          <form className="mt-4 flex overflow-hidden rounded-xl border border-[#dbe6f3] bg-white dark:border-slate-700 dark:bg-slate-950">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email address"
              className="min-w-0 flex-1 bg-transparent px-4 text-sm font-semibold text-[#071a3f] outline-none dark:text-white"
            />
            <button type="submit" className="bg-[#fe6f05] px-5 text-sm font-black text-white">
              Subscribe
            </button>
          </form>
        </div>
        <div className="hidden text-7xl md:block">
          <Mail className="h-20 w-20 text-[#034c85]" />
        </div>
      </div>
    </section>
  );
}

export default function KachaBazarDemoHomePage() {
  const [copiedCode, setCopiedCode] = useState("");
  const { data: categoriesData } = useCategories({ parentsOnly: true });
  const { data: popularData, isLoading: popularLoading } = useProducts({
    page: 1,
    limit: 5,
    sort: "popular",
  });
  const { data: discountedData, isLoading: discountedLoading } = useProducts({
    page: 1,
    limit: 5,
    discounted: true,
    sort: "featured",
  });
  const { data: homeCustomizationData } = useQuery({
    queryKey: ["store-customization", "home-page-main-slider", "en"],
    queryFn: () => getStoreCustomization({ lang: "en", include: "home" }),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
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

  const homeConfig =
    homeCustomizationData?.customization?.home ||
    homeCustomizationData?.data?.customization?.home ||
    {};
  const mainSlider = useMemo(() => normalizeMainSlider(homeConfig), [homeConfig]);
  const discountCouponBox = useMemo(
    () => normalizeDiscountCouponBox(homeConfig),
    [homeConfig]
  );

  const categories = useMemo(() => {
    const source = extractList(categoriesData);
    return (source.length ? source : fallbackCategories)
      .slice(0, 8)
      .map((category, index) => normalizeCategory(category, index));
  }, [categoriesData]);

  const popularProducts = useMemo(() => {
    const source = extractList(popularData);
    return (source.length ? source : fallbackProducts)
      .slice(0, 5)
      .map((product, index) => normalizeProduct(product, index));
  }, [popularData]);

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
  };

  return (
    <div className="-mx-1 space-y-6 bg-[#f7fbff] text-[#071a3f] dark:bg-slate-950 sm:-mx-2">
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
      <BenefitStrip />

      <section className="space-y-6">
        <SectionHeading
          eyebrow="Featured Categories"
          title="Shop by"
          accent="Category"
          description="Find everything you need in one place. Fresh, quality products delivered to your door."
          action={
            <Link
              to="/shop"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#034c85] px-5 text-sm font-black text-[#034c85] transition hover:bg-[#034c85] hover:text-white dark:text-sky-300"
            >
              View all categories
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} active={index === 0} />
          ))}
        </div>
      </section>

      <section className="space-y-5 rounded-[28px] bg-white p-5 shadow-[0_14px_34px_rgba(3,76,133,0.08)] dark:bg-slate-900 sm:p-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-black text-[#071a3f] dark:text-white">
              Popular Products
              <span className="h-2.5 w-2.5 rounded-full bg-[#fe6f05]" />
            </h2>
            <div className="mt-5 flex flex-wrap gap-3">
              {chips.map((chip, index) => (
                <Link
                  key={chip}
                  to={index === 0 ? "/shop" : `/search?category=${encodeURIComponent(chip.toLowerCase().replace(/\s+/g, "-"))}&page=1`}
                  className={`inline-flex h-9 items-center rounded-full border px-5 text-sm font-bold transition ${
                    index === 0
                      ? "border-[#034c85] bg-[#034c85] text-white"
                      : "border-[#dbe6f3] text-[#31486e] hover:border-[#034c85] hover:text-[#034c85] dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {chip}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex h-11 items-center gap-6 rounded-full border border-[#dbe6f3] px-5 text-sm font-bold text-[#31486e] dark:border-slate-700 dark:text-slate-300">
              Sort by: Popular <ChevronRight className="h-4 w-4 rotate-90" />
            </button>
            <Link
              to="/shop?sort=popular"
              className="inline-flex h-11 items-center gap-2 rounded-full border border-[#034c85] px-5 text-sm font-black text-[#034c85] transition hover:bg-[#034c85] hover:text-white"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        {popularLoading && extractList(popularData).length === 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-[18px] bg-[#f0f6fd] dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-2xl font-black text-[#071a3f] dark:text-white">
            Latest Discounted Products
            <span className="h-2.5 w-2.5 rounded-full bg-[#fe6f05]" />
          </h2>
          <div className="hidden items-center gap-3 sm:flex">
            <button className="grid h-11 w-11 place-items-center rounded-full border border-[#dbe6f3] text-[#034c85] dark:border-slate-700">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <Link
              to="/search?discounted=true&page=1"
              className="inline-flex h-11 items-center rounded-full border border-[#034c85] px-5 text-sm font-black text-[#034c85] transition hover:bg-[#034c85] hover:text-white"
            >
              View all
            </Link>
            <button className="grid h-11 w-11 place-items-center rounded-full bg-[#fe6f05] text-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
        {discountedLoading && extractList(discountedData).length === 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-56 animate-pulse rounded-[18px] bg-white dark:bg-slate-800" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {discountedProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact showDiscount />
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-[34px] bg-[#034c85] p-7 text-white shadow-[0_18px_42px_rgba(3,76,133,0.16)] sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#fe6f05]">
              Daily Essentials Delivered Fast
            </p>
            <h2 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
              Fresh groceries, household staples, and quick support in one dependable store.
            </h2>
            <p className="max-w-xl text-base font-medium leading-7 text-white/80">
              Build your weekly basket from trusted sellers, explore deals, and keep every order moving with a smooth storefront experience.
            </p>
            <Link
              to="/shop"
              className="inline-flex h-14 items-center gap-3 rounded-full bg-[#fe6f05] px-7 text-base font-black text-white transition hover:-translate-y-0.5"
            >
              Start Shopping
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <div className="relative min-h-[280px]">
            <div className="absolute inset-0 rounded-[30px] bg-white/10" />
            <div className="absolute left-8 top-8 text-8xl">🥬</div>
            <div className="absolute right-10 top-12 text-8xl">🍊</div>
            <div className="absolute bottom-8 left-[30%] text-8xl">🥛</div>
            <div className="absolute bottom-12 right-8 rounded-[28px] bg-white p-6 text-[#034c85] shadow-[0_20px_42px_rgba(0,0,0,0.2)]">
              <Truck className="h-12 w-12" />
              <p className="mt-3 text-lg font-black">Same-day ready</p>
            </div>
          </div>
        </div>
      </section>

      <PromoStrip />
    </div>
  );
}
