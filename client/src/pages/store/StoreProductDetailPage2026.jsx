import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Facebook,
  Heart,
  Home,
  Instagram,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  SearchX,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Truck,
  Twitter,
} from "lucide-react";
import ProductSellerInfoCard from "../../components/store/ProductSellerInfoCard.jsx";
import { useCart } from "../../hooks/useCart.ts";
import { useProduct, useProducts } from "../../storefront.jsx";
import { ensureProductImageUrl, resolveProductImageUrl } from "../../utils/productImage.js";
import "./store-product-detail-2026.css";

const DEFAULT_LIMIT = 8;

const text = (...values) => {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositive = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value, 0));

export const normalizePayload = (payload) =>
  payload?.data?.data ?? payload?.data ?? payload?.product ?? payload ?? null;

export const normalizeArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getProductSlug = (product) =>
  text(product?.routeSlug, product?.slug, product?.seo?.slug, product?.id);

export const getProductName = (product) =>
  text(product?.name, product?.title, product?.productName, "Product");

export const getCategoryName = (product) =>
  text(product?.category?.name, product?.categoryName, product?.category?.title, "Fresh Fruits");

export const getFallbackVisual = (categoryName) => {
  const normalized = String(categoryName || "").toLowerCase();
  if (normalized.includes("bread") || normalized.includes("bakery")) return "Bakery";
  if (normalized.includes("milk") || normalized.includes("dairy")) return "Dairy";
  if (normalized.includes("meat") || normalized.includes("fish")) return "Fresh";
  if (normalized.includes("veg")) return "Greens";
  return "Fresh";
};

export const getProductImages = (product) => {
  const candidates = [
    resolveProductImageUrl(product),
    product?.variantImage,
    product?.imageUrl,
    product?.image,
    product?.thumbnail,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.imagePaths) ? product.imagePaths : []),
    ...(Array.isArray(product?.gallery) ? product.gallery.map((item) => item?.url ?? item?.imageUrl ?? item) : []),
  ];
  return Array.from(
    new Set(candidates.map((item) => ensureProductImageUrl(item)).filter(Boolean))
  );
};

export const getBasePrice = (product) =>
  toPositive(product?.salePrice, 0) ||
  toPositive(product?.price, 0) ||
  toPositive(product?.finalPrice, 0);

export const getOriginalPrice = (product) =>
  toPositive(product?.originalPrice, 0) ||
  toPositive(product?.compareAtPrice, 0) ||
  toPositive(product?.regularPrice, 0) ||
  toPositive(product?.price, 0);

export const getDiscountPercent = (product) => {
  const explicit = toPositive(product?.discountPercent ?? product?.discount?.percent, 0);
  if (explicit) return Math.round(explicit);
  const price = getBasePrice(product);
  const original = getOriginalPrice(product);
  if (original > price && price > 0) return Math.round(((original - price) / original) * 100);
  return 0;
};

export const getRating = (product) =>
  Math.min(5, Math.max(0, toNumber(product?.ratingAvg ?? product?.averageRating ?? product?.rating, 4.6)));

export const getReviewCount = (product) =>
  Math.max(0, Math.round(toNumber(product?.reviewCount ?? product?.reviewsCount ?? product?.ratingCount, 5)));

export const getStock = (product, selectedVariant) => {
  const value =
    selectedVariant?.stock ??
    selectedVariant?.quantity ??
    selectedVariant?.availableStock ??
    product?.stock ??
    product?.availableStock;
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
};

export const getUnit = (product) =>
  text(product?.unit, product?.weight ? `${product.weight} kg` : "", product?.tags?.unit, "1 kg");

export const getProductDescription = (product) =>
  text(
    product?.description,
    product?.shortDescription,
    product?.details,
    "Sweet and fresh product selected by trusted sellers for daily needs."
  );

export const getReviews = (product) => {
  const raw = normalizeArray(product?.reviews, ["items", "reviews"]);
  if (raw.length === 0) {
    return [
      { id: "rina", name: "Rina Pratiwi", rating: 5, date: "Jun 11, 2026", comment: `Great ${getProductName(product).toLowerCase()} quality. Rating 5/5.` },
      { id: "andi", name: "Andi Saputra", rating: 4, date: "Jun 11, 2026", comment: `Great ${getProductName(product).toLowerCase()} quality. Rating 4/5.` },
      { id: "maya", name: "Maya Lestari", rating: 5, date: "Jun 11, 2026", comment: `Great ${getProductName(product).toLowerCase()} quality. Rating 5/5.` },
    ];
  }
  return raw.map((review, index) => ({
    id: review?.id ?? `review-${index}`,
    name: text(review?.user?.name, review?.customer?.name, review?.name, review?.author, `Customer ${index + 1}`),
    rating: Math.min(5, Math.max(0, toNumber(review?.rating, 0))),
    date: review?.createdAt
      ? new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    comment: text(review?.comment, review?.review, "Fresh product and good service."),
  }));
};

const selectionKey = (attributeId, valueId, value) =>
  `${attributeId}:${String(valueId ?? value ?? "").trim().toLowerCase()}`;

export const normalizeVariationGroups = (product) => {
  const raw = product?.variations || product?.variationOptions || product?.options;
  const groups = [];

  if (raw && !Array.isArray(raw) && Array.isArray(raw.selectedAttributes)) {
    const valueGroups = Array.isArray(raw.selectedAttributeValues) ? raw.selectedAttributeValues : [];
    raw.selectedAttributes.forEach((attribute, index) => {
      const attributeId = Number(attribute?.id ?? attribute?.attributeId ?? index + 1);
      const valuesEntry = valueGroups.find((item) => Number(item?.attributeId) === attributeId);
      const options = (Array.isArray(valuesEntry?.values) ? valuesEntry.values : [])
        .map((option, optionIndex) => {
          const label = text(option?.label, option?.value);
          if (!label) return null;
          return {
            id: `${attributeId}-${optionIndex}`,
            value: label,
            valueId: option?.id ?? option?.valueId ?? null,
            selectionKey: selectionKey(attributeId, option?.id ?? option?.valueId, label),
          };
        })
        .filter(Boolean);
      if (options.length > 0) {
        groups.push({
          id: String(attributeId),
          attributeId,
          label: text(attribute?.name, attribute?.label, `Option ${index + 1}`),
          options,
        });
      }
    });
    return groups;
  }

  return (Array.isArray(raw) ? raw : [])
    .map((group, index) => {
      const attributeId = Number(group?.attributeId ?? group?.id ?? index + 1);
      const options = normalizeArray(group?.options ?? group?.values, ["items", "options", "values"])
        .map((option, optionIndex) => {
          const label = text(option?.label, option?.value, option?.name, option);
          if (!label) return null;
          return {
            id: `${attributeId}-${optionIndex}`,
            value: label,
            valueId: option?.id ?? option?.valueId ?? null,
            selectionKey: selectionKey(attributeId, option?.id ?? option?.valueId, label),
          };
        })
        .filter(Boolean);
      if (options.length === 0) return null;
      return {
        id: String(attributeId),
        attributeId,
        label: text(group?.label, group?.name, group?.attributeName, `Option ${index + 1}`),
        options,
      };
    })
    .filter(Boolean);
};

export const normalizeVariants = (product) => {
  const raw =
    product?.variants ||
    product?.variantOptions ||
    product?.variationItems ||
    product?.variations?.variants ||
    [];
  return (Array.isArray(raw) ? raw : []).map((variant, index) => {
    const selections = normalizeArray(variant?.selections, ["items", "selections"]).map((selection) => {
      const attributeId = Number(selection?.attributeId ?? selection?.id);
      const value = text(selection?.value, selection?.label, selection?.name);
      return {
        attributeId,
        attributeName: text(selection?.attributeName, selection?.name),
        valueId: selection?.valueId ?? null,
        value,
        selectionKey: selectionKey(attributeId, selection?.valueId, value),
      };
    });
    const combinationKey =
      text(variant?.combinationKey) ||
      selections.map((selection) => selection.selectionKey).join("|");
    return {
      ...variant,
      id: variant?.id ?? `variant-${index}`,
      combinationKey,
      selections,
      variantKey: text(variant?.variantKey, combinationKey),
      variantLabel: text(variant?.combination, variant?.label, selections.map((item) => item.value).join(" / ")),
      sku: text(variant?.sku),
      barcode: text(variant?.barcode),
      price: variant?.price ?? variant?.regularPrice ?? null,
      salePrice: variant?.salePrice ?? variant?.sellingPrice ?? null,
      stock: variant?.stock ?? variant?.quantity ?? variant?.availableStock ?? null,
      image: ensureProductImageUrl(variant?.image ?? variant?.variantImage ?? ""),
    };
  });
};

export const resolveSelectedVariant = (product, selectedOptions) => {
  const variants = normalizeVariants(product);
  if (variants.length === 0) return null;
  const selectedValues = Object.values(selectedOptions || {}).map((item) => String(item).toLowerCase());
  if (selectedValues.length === 0) return null;
  return (
    variants.find((variant) =>
      variant.selections.length > 0
        ? variant.selections.every((selection) => selectedValues.includes(String(selection.selectionKey).toLowerCase()))
        : String(variant.combinationKey || "").toLowerCase() === selectedValues.join("|")
    ) || null
  );
};

export const getSelectedPrice = (product, selectedVariant) =>
  toPositive(selectedVariant?.salePrice, 0) ||
  toPositive(selectedVariant?.price, 0) ||
  getBasePrice(product);

export const getSelectedOriginalPrice = (product, selectedVariant) =>
  toPositive(selectedVariant?.price, 0) || getOriginalPrice(product);

export const isPurchasable = (product, selectedVariant, quantity) => {
  if (product?.purchaseState && product.purchaseState.isPurchasable === false) return false;
  const stock = getStock(product, selectedVariant);
  if (stock !== null && stock <= 0) return false;
  if (stock !== null && quantity > stock) return false;
  return true;
};

function Stars({ rating, size = "h-4 w-4" }) {
  const rounded = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={`star-${index}`}
          className={`${size} ${index < rounded ? "fill-current" : "text-slate-300 dark:text-slate-600"}`}
        />
      ))}
    </span>
  );
}

function Badge({ children, tone = "blue" }) {
  const tones = {
    blue: "border-[var(--tp-primary)]/20 bg-[var(--tp-primary)]/8 text-[var(--tp-primary)] dark:border-sky-300/20 dark:bg-sky-300/10 dark:text-sky-200",
    green: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
    orange: "border-[var(--tp-accent)]/20 bg-[var(--tp-accent)]/10 text-[var(--tp-accent)] dark:border-[var(--tp-accent)]/30",
    slate: "border-slate-200 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-200",
  };
  return (
    <span className={`inline-flex h-8 items-center rounded-full border px-3 text-xs font-bold uppercase ${tones[tone]}`}>
      {children}
    </span>
  );
}

function ImageFallback({ categoryName }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 text-[var(--tp-primary)] dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 dark:text-slate-200">
      <div className="text-center">
        <ShoppingBag className="mx-auto h-14 w-14" />
        <p className="mt-2 text-sm font-bold">{getFallbackVisual(categoryName)}</p>
      </div>
    </div>
  );
}

function ProductGallery({ product, selectedVariant }) {
  const categoryName = getCategoryName(product);
  const images = useMemo(() => {
    const variantImage = selectedVariant?.image ? [selectedVariant.image] : [];
    return Array.from(new Set([...variantImage, ...getProductImages(product)]));
  }, [product, selectedVariant]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] || images[0] || "";

  useEffect(() => {
    setActiveIndex(0);
  }, [getProductSlug(product), selectedVariant?.image]);

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-[0_24px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
      <div className="relative overflow-hidden rounded-[1.6rem] bg-slate-100 dark:bg-slate-950">
        <div className="aspect-square min-h-[300px] sm:min-h-[420px] lg:min-h-[520px]">
          {activeImage ? (
            <img
              src={activeImage}
              alt={getProductName(product)}
              className="h-full w-full object-contain p-4 sm:p-6"
            />
          ) : (
            <ImageFallback categoryName={categoryName} />
          )}
        </div>
        <div className="absolute left-5 top-5 rounded-full border-2 border-lime-400 bg-white/90 px-3 py-2 text-center text-[10px] font-black uppercase text-lime-600 shadow-sm dark:bg-slate-950/80">
          100%<br />Organic
        </div>
        <button
          type="button"
          aria-label="Wishlist"
          className="absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-[var(--tp-accent)] dark:border-white/10 dark:bg-slate-900 dark:text-white"
        >
          <Heart className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-4 flex items-center gap-3">
        {images.length > 4 ? (
          <button
            type="button"
            onClick={() => setActiveIndex((index) => (index - 1 + images.length) % images.length)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--tp-primary)] dark:border-white/10 dark:bg-slate-950 dark:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
        <div className="shop-product-2026-hide-scroll flex flex-1 gap-3 overflow-x-auto">
          {(images.length ? images : [""]).map((image, index) => (
            <button
              key={`${image || "fallback"}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-20 w-24 shrink-0 overflow-hidden rounded-xl border bg-slate-50 transition dark:bg-slate-950 ${
                index === activeIndex
                  ? "border-[var(--tp-primary)] shadow-[0_0_0_2px_rgba(3,76,133,0.12)]"
                  : "border-slate-200 dark:border-white/10"
              }`}
            >
              {image ? (
                <img src={image} alt={`${getProductName(product)} ${index + 1}`} className="h-full w-full object-contain p-1" />
              ) : (
                <ImageFallback categoryName={categoryName} />
              )}
            </button>
          ))}
        </div>
        {images.length > 4 ? (
          <button
            type="button"
            onClick={() => setActiveIndex((index) => (index + 1) % images.length)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--tp-primary)] dark:border-white/10 dark:bg-slate-950 dark:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </section>
  );
}

function QuantityStepper({ quantity, stock, disabled, onDecrease, onIncrease }) {
  return (
    <div className="grid h-12 grid-cols-3 overflow-hidden rounded-[1rem] border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= 1}
        className="inline-flex items-center justify-center border-r border-slate-200 text-[var(--tp-primary)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="inline-flex items-center justify-center text-base font-bold text-slate-950 dark:text-white">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || (stock !== null && quantity >= stock)}
        className="inline-flex items-center justify-center border-l border-slate-200 text-[var(--tp-primary)] disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-white"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function ProductSummary({
  product,
  selectedVariant,
  selectedOptions,
  onSelectOption,
  quantity,
  onDecrease,
  onIncrease,
  onAddToCart,
  onBuyNow,
  isAdding,
}) {
  const categoryName = getCategoryName(product);
  const groups = normalizeVariationGroups(product);
  const price = getSelectedPrice(product, selectedVariant);
  const originalPrice = getSelectedOriginalPrice(product, selectedVariant);
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : getDiscountPercent(product);
  const stock = getStock(product, selectedVariant);
  const canPurchase = isPurchasable(product, selectedVariant, quantity);
  const purchaseMessage =
    product?.purchaseState?.isPurchasable === false
      ? text(product?.purchaseState?.description, product?.purchaseState?.reason, product?.purchaseState?.message, product?.purchaseState?.label)
      : stock !== null && stock <= 0
        ? "This item is currently out of stock."
        : stock !== null && quantity > stock
          ? `Only ${stock} item${stock === 1 ? "" : "s"} available.`
          : "";

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none sm:p-7">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={canPurchase ? "green" : "orange"}>{canPurchase ? "In Stock" : "Unavailable"}</Badge>
          <Badge tone="slate">{categoryName}</Badge>
          {discount > 0 ? <Badge tone="orange">-{discount}%</Badge> : null}
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-normal text-slate-950 dark:text-white sm:text-4xl">
            {getProductName(product)}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <Stars rating={getRating(product)} />
            <span className="font-semibold">{getRating(product).toFixed(1)} ({getReviewCount(product)} reviews)</span>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <span className="text-4xl font-black text-slate-950 dark:text-white">{rupiah(price)}</span>
          {originalPrice > price ? (
            <span className="pb-1 text-xl font-bold text-slate-400 line-through">{rupiah(originalPrice)}</span>
          ) : null}
        </div>

        {groups.length > 0 ? (
          <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
            {groups.map((group) => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-500 dark:text-slate-400">
                  <span>{group.label}</span>
                  <span>{group.options.find((option) => option.selectionKey === selectedOptions[group.id])?.value || "Choose"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const active = selectedOptions[group.id] === option.selectionKey;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onSelectOption(group.id, option.selectionKey)}
                        className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                          active
                            ? "border-[var(--tp-primary)] bg-[var(--tp-primary)] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-[var(--tp-primary)]/30 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
                        }`}
                      >
                        {option.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {purchaseMessage ? (
          <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
            {purchaseMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-[190px_minmax(0,1fr)]">
          <QuantityStepper
            quantity={quantity}
            stock={stock}
            disabled={!canPurchase || isAdding}
            onDecrease={onDecrease}
            onIncrease={onIncrease}
          />
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!canPurchase || isAdding}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-[var(--tp-accent)] px-6 text-sm font-black text-white shadow-lg shadow-[var(--tp-accent)]/25 transition hover:bg-[#d95700] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
            Add to Cart
          </button>
        </div>
        <button
          type="button"
          onClick={onBuyNow}
          disabled={!canPurchase || isAdding}
          className="inline-flex h-12 w-full items-center justify-center rounded-[1rem] bg-[var(--tp-primary)] px-6 text-sm font-black text-white shadow-lg shadow-[var(--tp-primary)]/20 transition hover:bg-[#023b68] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          Buy Now
        </button>

        <div className="grid grid-cols-3 gap-2 border-t border-slate-200 pt-5 text-xs font-semibold text-slate-600 dark:border-white/10 dark:text-slate-300">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" />100% Organic</div>
          <div className="flex items-center gap-2"><BadgeCheck className="h-5 w-5 text-[var(--tp-primary)] dark:text-sky-300" />Fresh & Natural</div>
          <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-[var(--tp-primary)] dark:text-sky-300" />Fast Delivery</div>
        </div>

        <div className="space-y-3 border-t border-slate-200 pt-5 text-sm text-slate-600 dark:border-white/10 dark:text-slate-300">
          <p><span className="mr-4 font-bold text-slate-700 dark:text-slate-200">Category</span>{categoryName}</p>
          <p><span className="mr-8 font-bold text-slate-700 dark:text-slate-200">Weight</span><span className="rounded-lg bg-slate-100 px-3 py-1 dark:bg-white/10">{getUnit(product)}</span></p>
        </div>
      </div>
    </section>
  );
}

function SellerCardFallback({ product }) {
  const seller = product?.sellerInfo || product?.store || {};
  const name = text(seller?.name, "Super Admin");
  const storeSlug = text(seller?.slug, product?.storeSlug);
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_1.3fr] lg:items-center">
        <div className="flex items-start gap-4">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--tp-primary)]/20 bg-[var(--tp-primary)]/8 text-[var(--tp-primary)] dark:border-white/10 dark:bg-white/10 dark:text-white">
            <Store className="h-8 w-8" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black text-slate-950 dark:text-white">{name}</h2>
              <Badge tone="green">Operational</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sold by this store.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={storeSlug ? `/store/${encodeURIComponent(storeSlug)}` : "/shop"}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:border-[var(--tp-primary)]/30 hover:text-[var(--tp-primary)] dark:border-white/10 dark:bg-slate-950 dark:text-slate-200"
              >
                <Store className="h-4 w-4" /> Visit Store
              </Link>
              <button
                type="button"
                disabled
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-5 text-sm font-bold text-slate-400 dark:border-white/10 dark:bg-slate-950"
              >
                <MessageCircle className="h-4 w-4" /> Chat
              </button>
            </div>
            <p className="mt-2 text-xs text-[var(--tp-primary)] dark:text-sky-300">Chat not available yet.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-center dark:divide-white/10 dark:border-white/10 dark:bg-slate-950">
          <div><p className="text-2xl font-black text-slate-950 dark:text-white">16</p><p className="text-sm text-slate-500 dark:text-slate-400">Products</p></div>
          <div><p className="text-2xl font-black text-slate-950 dark:text-white">4.4 / 5</p><p className="text-sm text-slate-500 dark:text-slate-400">61 Reviews</p></div>
          <div><p className="text-2xl font-black text-slate-950 dark:text-white">Jun 2026</p><p className="text-sm text-slate-500 dark:text-slate-400">Joined</p></div>
        </div>
      </div>
    </section>
  );
}

function ReviewsAndDetails({ product }) {
  const [tab, setTab] = useState("reviews");
  const reviews = getReviews(product);
  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
      <div className="flex border-b border-slate-200 px-5 pt-4 dark:border-white/10">
        {[
          ["reviews", `Reviews (${getReviewCount(product)})`],
          ["details", "Details"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`border-b-4 px-4 pb-4 text-sm font-black transition ${
              tab === value
                ? "border-[var(--tp-primary)] text-[var(--tp-primary)] dark:border-sky-300 dark:text-white"
                : "border-transparent text-slate-500 dark:text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-4 p-5">
        {tab === "reviews" ? (
          reviews.length > 0 ? (
            reviews.map((review) => (
              <article key={review.id} className="rounded-[1.25rem] border border-slate-200 p-4 dark:border-white/10">
                <div className="flex gap-4">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 font-black text-slate-700 dark:bg-white/10 dark:text-white">
                    {review.name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-black text-slate-950 dark:text-white">{review.name}</p>
                      <span className="text-xs text-slate-400">{review.date}</span>
                    </div>
                    <Stars rating={review.rating} size="h-3.5 w-3.5" />
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{review.comment}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-white/10 dark:text-slate-400">No customer reviews yet.</div>
          )
        ) : (
          <div className="shop-product-2026-prose text-sm leading-7 text-slate-600 dark:text-slate-300">
            <p>{getProductDescription(product)}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Highlights({ product }) {
  const items = [
    "Free shipping on orders over Rp100.000",
    "Home delivery within 1 hour",
    "Cash on delivery available",
    "7-day money-back guarantee",
    "Warranty not available for this item",
    `100% organic from natural ${getCategoryName(product).toLowerCase()} products`,
    "Pickup: Boho One, Bridge Street West, Middlesbrough, North Yorkshire, TS2 1AE.",
  ];
  const icons = [Truck, Home, Package, ShieldCheck, BadgeCheck, Sparkles, MapPin];
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
      <h2 className="text-2xl font-black text-[var(--tp-primary)] dark:text-white">Highlights</h2>
      <ul className="mt-4 divide-y divide-slate-200 text-sm text-slate-600 dark:divide-white/10 dark:text-slate-300">
        {items.map((item, index) => {
          const Icon = icons[index] || Sparkles;
          return (
            <li key={item} className="flex gap-3 py-2.5">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--tp-primary)] dark:text-sky-300" />
              <span>{item}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ShareCard() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 dark:shadow-none">
      <h2 className="text-2xl font-black text-[var(--tp-primary)] dark:text-white">Share</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Send this item to someone else.</p>
      <div className="mt-4 flex gap-3">
        {[
          ["Facebook", Facebook],
          ["Instagram", Instagram],
          ["Twitter", Twitter],
          ["Chat", MessageCircle],
        ].map(([label, Icon]) => (
          <a
            key={label}
            href="#"
            aria-label={`Share to ${label}`}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-[var(--tp-primary)] transition hover:border-[var(--tp-primary)]/30 hover:bg-[var(--tp-primary)]/5 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
          >
            <Icon className="h-5 w-5" />
          </a>
        ))}
      </div>
    </section>
  );
}

function RelatedProductCard({ product, onAdd }) {
  const [isAdding, setIsAdding] = useState(false);
  const image = getProductImages(product)[0] || "";
  const price = getBasePrice(product);
  const original = getOriginalPrice(product);
  const discount = getDiscountPercent(product);
  const slug = getProductSlug(product);
  return (
    <article className="w-[190px] shrink-0 rounded-[1.25rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:w-auto">
      <Link to={`/product/${encodeURIComponent(slug)}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
          {image ? (
            <img src={image} alt={getProductName(product)} className="h-full w-full object-contain p-3" />
          ) : (
            <ImageFallback categoryName={getCategoryName(product)} />
          )}
          {discount > 0 ? (
            <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">
              -{discount}%
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-[11px] font-semibold text-slate-400">{getCategoryName(product)}</p>
        <h3 className="line-clamp-2 min-h-[2.25rem] text-sm font-black text-slate-950 dark:text-white">{getProductName(product)}</h3>
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <Stars rating={getRating(product)} size="h-3 w-3" />
          <span>{getRating(product).toFixed(1)}</span>
        </div>
      </Link>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-950 dark:text-white">{rupiah(price)}</p>
          {original > price ? <p className="text-xs text-slate-400 line-through">{rupiah(original)}</p> : null}
        </div>
        <button
          type="button"
          onClick={async () => {
            setIsAdding(true);
            await onAdd(product);
            setTimeout(() => setIsAdding(false), 500);
          }}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 text-[var(--tp-primary)] transition hover:border-[var(--tp-primary)]/30 hover:bg-[var(--tp-primary)]/5 dark:border-white/10 dark:text-white"
          aria-label={`Add ${getProductName(product)} to cart`}
        >
          {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
        </button>
      </div>
    </article>
  );
}

function RelatedProducts({ products, onAdd }) {
  const shelfRef = useRef(null);
  if (products.length === 0) return null;
  const scroll = (direction) => {
    shelfRef.current?.scrollBy({ left: direction * 360, behavior: "smooth" });
  };
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">Related Products</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">More great items you might love.</p>
        </div>
        <Link to="/shop" className="inline-flex items-center gap-1 text-sm font-black text-[var(--tp-primary)] dark:text-sky-300">
          View more <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="relative">
        <button
          type="button"
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 z-10 hidden h-11 w-11 -translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--tp-primary)] shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-white sm:inline-flex"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div
          ref={shelfRef}
          className="shop-product-2026-hide-scroll grid grid-flow-col auto-cols-[minmax(180px,1fr)] gap-4 overflow-x-auto pb-2 sm:auto-cols-[minmax(190px,1fr)] lg:grid-flow-row lg:grid-cols-4 xl:grid-cols-6"
        >
          {products.map((product) => (
            <RelatedProductCard key={product?.id ?? product?.slug} product={product} onAdd={onAdd} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 z-10 hidden h-11 w-11 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[var(--tp-primary)] shadow-md dark:border-white/10 dark:bg-slate-900 dark:text-white sm:inline-flex"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="h-[560px] animate-pulse rounded-[2rem] bg-slate-100 dark:bg-slate-900" />
      <div className="h-[560px] animate-pulse rounded-[2rem] bg-slate-100 dark:bg-slate-900" />
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--tp-primary)]/8 text-[var(--tp-primary)] dark:bg-white/10 dark:text-white">
        <SearchX className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Product not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">
        {message || "Try opening another product from the shop."}
      </p>
      <Link
        to="/shop"
        className="mt-5 inline-flex h-11 items-center justify-center rounded-[1rem] bg-[var(--tp-primary)] px-5 text-sm font-black text-white"
      >
        Back to Shop
      </Link>
    </section>
  );
}

export default function StoreProductDetailPage2026() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const productQuery = useProduct(slug);
  const product = normalizePayload(productQuery.data);
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isAdding, setIsAdding] = useState(false);

  const variationGroups = useMemo(() => normalizeVariationGroups(product), [product]);
  const selectedVariant = useMemo(
    () => resolveSelectedVariant(product, selectedOptions),
    [product, selectedOptions]
  );

  useEffect(() => {
    const defaults = {};
    variationGroups.forEach((group) => {
      if (group.options[0]) defaults[group.id] = group.options[0].selectionKey;
    });
    setSelectedOptions(defaults);
    setQuantity(1);
  }, [getProductSlug(product), variationGroups.length]);

  const relatedQuery = useProducts({
    category: product ? getCategoryName(product) : undefined,
    limit: DEFAULT_LIMIT,
    page: 1,
    sort: "featured",
    enabled: Boolean(product),
    keepPreviousData: true,
  });

  const relatedProducts = useMemo(() => {
    const currentSlug = getProductSlug(product);
    return normalizeArray(relatedQuery.data, ["items", "products", "rows"])
      .filter((item) => getProductSlug(item) !== currentSlug)
      .slice(0, DEFAULT_LIMIT);
  }, [product, relatedQuery.data]);

  const stock = getStock(product, selectedVariant);

  const buildSnapshot = (item, variant = null) => {
    const image = (variant?.image ? ensureProductImageUrl(variant.image) : "") || getProductImages(item)[0] || "";
    const variantSelections = Array.isArray(variant?.selections)
      ? variant.selections.map((selection) => ({
          attributeId: selection.attributeId,
          attributeName: selection.attributeName,
          valueId: selection.valueId,
          value: selection.value,
        }))
      : [];
    return {
      name: getProductName(item),
      price: getSelectedPrice(item, variant),
      imageUrl: image,
      stock: getStock(item, variant),
      slug: getProductSlug(item),
      storeId: item?.storeId ?? item?.store?.id ?? null,
      storeSlug: text(item?.storeSlug, item?.store?.slug),
      category: getCategoryName(item),
      variantKey: variant?.variantKey ?? variant?.combinationKey ?? null,
      variantLabel: variant?.variantLabel ?? null,
      variantSelections,
      variantSku: variant?.sku ?? null,
      variantBarcode: variant?.barcode ?? null,
      variantPrice: variant?.price ?? null,
      variantSalePrice: variant?.salePrice ?? null,
      variantImage: variant?.image ?? null,
    };
  };

  const addProduct = async (item, qty = 1, variant = null) => {
    const productId = Number(item?.id ?? item?.productId);
    if (!Number.isFinite(productId) || productId <= 0) return false;
    await cart.add(productId, qty, buildSnapshot(item, variant));
    return true;
  };

  const handleAddToCart = async () => {
    if (!isPurchasable(product, selectedVariant, quantity)) return;
    setIsAdding(true);
    try {
      await addProduct(product, quantity, selectedVariant);
    } finally {
      setTimeout(() => setIsAdding(false), 550);
    }
  };

  const handleBuyNow = async () => {
    if (!isPurchasable(product, selectedVariant, quantity)) return;
    setIsAdding(true);
    try {
      const ok = await addProduct(product, quantity, selectedVariant);
      if (ok) navigate("/cart");
    } finally {
      setTimeout(() => setIsAdding(false), 550);
    }
  };

  if (productQuery.isLoading) return <LoadingState />;
  if (productQuery.isError || !product) {
    return <ErrorState message={productQuery.error?.response?.data?.message || productQuery.error?.message} />;
  }

  const categoryName = getCategoryName(product);
  const categorySlug = text(product?.category?.slug, product?.category?.code, categoryName);

  return (
    <div className="space-y-6 bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="inline-flex items-center gap-1 font-semibold hover:text-[var(--tp-primary)] dark:hover:text-white">
          <Home className="h-4 w-4" /> Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link to={`/search?category=${encodeURIComponent(categorySlug)}&page=1`} className="font-semibold hover:text-[var(--tp-primary)] dark:hover:text-white">
          {categoryName}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="font-bold text-slate-950 dark:text-white">{getProductName(product)}</span>
      </nav>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,0.95fr)] lg:items-start">
        <ProductGallery product={product} selectedVariant={selectedVariant} />
        <ProductSummary
          product={product}
          selectedVariant={selectedVariant}
          selectedOptions={selectedOptions}
          onSelectOption={(groupId, value) => setSelectedOptions((current) => ({ ...current, [groupId]: value }))}
          quantity={quantity}
          onDecrease={() => setQuantity((value) => Math.max(1, value - 1))}
          onIncrease={() => setQuantity((value) => (stock === null ? value + 1 : Math.min(stock, value + 1)))}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
          isAdding={isAdding || cart.isLoading}
        />
      </section>

      {product?.sellerInfo?.name ? (
        <ProductSellerInfoCard sellerInfo={product.sellerInfo} />
      ) : (
        <SellerCardFallback product={product} />
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-start">
        <ReviewsAndDetails product={product} />
        <div className="space-y-6">
          <Highlights product={product} />
          <ShareCard />
        </div>
      </section>

      <RelatedProducts
        products={relatedProducts}
        onAdd={(item) => addProduct(item, 1, null)}
      />
    </div>
  );
}
