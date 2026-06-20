import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Apple,
  Beef,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Eye,
  Filter,
  Grid2X2,
  Heart,
  Leaf,
  List,
  Loader2,
  Milk,
  Search,
  SearchX,
  ShoppingBasket,
  ShoppingCart,
  SlidersHorizontal,
  Sparkles,
  Star,
  Wheat,
  X,
} from "lucide-react";
import { useCategories, useProducts } from "../../storefront.jsx";
import { useCart } from "../../hooks/useCart.ts";
import { formatCurrency } from "../../utils/format.js";
import { productHasVariantSelections } from "../../utils/publicProductVariations.js";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import { resolveProductImageUrl } from "../../utils/productImage.js";
import "./store-shop-2026.css";

const DEFAULT_LIMIT = 16;

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "highest_rated", label: "Highest Rated" },
];

const RATING_OPTIONS = [4, 3, 2, 1];

const toPositiveNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};

const toPositiveInteger = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const readText = (...values) => {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
};

export const normalizeArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    const value = payload?.[key];
    if (Array.isArray(value)) return value;
  }
  for (const key of keys) {
    const nested = payload?.data?.[key] ?? payload?.payload?.[key] ?? payload?.result?.[key];
    if (Array.isArray(nested)) return nested;
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
};

export const getProductsMeta = (payload, productsLength) => {
  const sources = [payload?.meta, payload?.data?.meta, payload?.pagination, payload?.data?.pagination];
  const source = sources.find(Boolean) || {};
  const page = toPositiveInteger(source.page ?? source.currentPage, 1);
  const limit = toPositiveInteger(source.limit ?? source.perPage ?? source.pageSize, DEFAULT_LIMIT);
  const total = Number(source.total ?? source.totalItems ?? source.count ?? productsLength);
  return {
    page,
    limit,
    total: Number.isFinite(total) && total >= 0 ? total : productsLength,
  };
};

export const getProductImage = (product) => {
  const resolved = resolveProductImageUrl(product);
  if (resolved) return resolved;
  const gallery = normalizeArray(product?.gallery ?? product?.media ?? product?.assets, [
    "items",
    "images",
  ]);
  const first = gallery[0];
  return readText(first?.url, first?.src, first?.imageUrl, first);
};

export const getProductPrice = (product) => {
  const price = Number(
    product?.salePrice ??
      product?.price ??
      product?.finalPrice ??
      product?.pricing?.salePrice ??
      product?.pricing?.price ??
      0
  );
  return Number.isFinite(price) ? Math.max(0, price) : 0;
};

export const getOriginalPrice = (product) => {
  const original = Number(
    product?.originalPrice ??
      product?.compareAtPrice ??
      product?.regularPrice ??
      product?.pricing?.originalPrice ??
      product?.pricing?.compareAtPrice ??
      0
  );
  return Number.isFinite(original) ? Math.max(0, original) : 0;
};

export const getDiscountPercent = (product) => {
  const explicit = Number(product?.discountPercent ?? product?.discount?.percent);
  if (Number.isFinite(explicit) && explicit > 0) return Math.round(explicit);
  const price = getProductPrice(product);
  const original = getOriginalPrice(product);
  if (original > price && price > 0) {
    return Math.round(((original - price) / original) * 100);
  }
  return 0;
};

export const getProductSlug = (product) =>
  readText(product?.routeSlug, product?.slug, product?.seo?.slug, product?.id);

export const getCategoryName = (product) =>
  readText(product?.category?.name, product?.categoryName, product?.category?.title, "Uncategorized");

const getCategoryValue = (category) =>
  readText(category?.slug, category?.code, category?.id, category?.name);

const getCategoryIcon = (name) => {
  const normalized = String(name || "").toLowerCase();
  if (normalized.includes("fruit")) return Apple;
  if (normalized.includes("veg")) return Leaf;
  if (normalized.includes("bakery") || normalized.includes("bread")) return Wheat;
  if (normalized.includes("dairy") || normalized.includes("milk")) return Milk;
  if (normalized.includes("meat") || normalized.includes("fish")) return Beef;
  if (normalized.includes("beverage") || normalized.includes("drink")) return Coffee;
  return Sparkles;
};

function updateSearchParams(searchParams, setSearchParams, next, options = {}) {
  const params = new URLSearchParams(searchParams);
  const resetPage = options.resetPage !== false;

  const assign = (key, value) => {
    if (value === undefined) return;
    if (value === null || value === "" || value === false) {
      params.delete(key);
      return;
    }
    params.set(key, String(value));
  };

  if (next.search !== undefined) {
    assign("q", next.search);
    params.delete("query");
    params.delete("search");
  }
  assign("category", next.category);
  assign("minPrice", next.minPrice);
  assign("maxPrice", next.maxPrice);
  assign("minRating", next.minRating);
  assign("limit", next.limit);

  if (next.sort !== undefined) {
    if (!next.sort || next.sort === "featured") params.delete("sort");
    else params.set("sort", String(next.sort));
  }

  if (next.page !== undefined) {
    params.set("page", String(Math.max(1, Number(next.page) || 1)));
  } else if (resetPage) {
    params.set("page", "1");
  }

  if (params.get("page") === "1") params.delete("page");
  if (params.get("limit") === String(DEFAULT_LIMIT)) params.delete("limit");
  setSearchParams(params, { replace: true });
}

function ShopHero({ query, onSearch }) {
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-900 sm:p-7 lg:p-8">
      <div className="absolute right-0 top-0 hidden h-full w-1/2 bg-[radial-gradient(circle_at_60%_35%,rgba(254,111,5,0.12),transparent_34%),radial-gradient(circle_at_72%_68%,rgba(3,76,133,0.13),transparent_36%)] lg:block" />
      <div className="relative grid items-center gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="max-w-3xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#034c85]/15 bg-[#034c85]/5 px-4 py-2 text-xs font-semibold text-[#034c85] dark:border-white/10 dark:bg-white/5 dark:text-slate-200">
            <Leaf className="h-4 w-4 text-[#fe6f05]" />
            Fresh picks from trusted sellers
          </span>
          <div className="space-y-3">
            <h1 className="text-3xl font-bold tracking-normal text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
              Shop fresh daily needs
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Discover produce, pantry staples, drinks, and household favorites from verified local stores.
            </p>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              onSearch(draft.trim());
            }}
            className="flex flex-col gap-3 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-2 shadow-inner dark:border-white/10 dark:bg-slate-950 sm:flex-row"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Search for products, stores, or daily essentials"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
              />
            </div>
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-[1.15rem] bg-[#034c85] px-6 text-sm font-semibold text-white shadow-lg shadow-[#034c85]/20 transition hover:bg-[#023b68]"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>
        </div>

        <div className="relative mx-auto h-56 w-full max-w-sm lg:h-64">
          <div className="absolute inset-x-8 bottom-4 h-24 rounded-full bg-[#034c85]/10 blur-2xl" />
          <div className="absolute left-1/2 top-8 flex h-40 w-48 -translate-x-1/2 items-center justify-center rounded-[2rem] bg-[#034c85] text-white shadow-2xl shadow-[#034c85]/20">
            <ShoppingBasket className="h-20 w-20" />
          </div>
          <div className="absolute left-8 top-6 rounded-3xl bg-white p-4 text-[#fe6f05] shadow-xl dark:bg-slate-800">
            <Apple className="h-9 w-9" />
          </div>
          <div className="absolute bottom-5 right-8 rounded-3xl bg-white p-4 text-[#034c85] shadow-xl dark:bg-slate-800 dark:text-slate-100">
            <Leaf className="h-10 w-10" />
          </div>
          <div className="absolute right-10 top-5 rounded-full bg-[#fe6f05] px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-[#fe6f05]/30">
            Daily deal
          </div>
        </div>
      </div>
    </section>
  );
}

function CategoryPills({ categories, activeCategory, onCategoryChange }) {
  const visibleCategories = categories.slice(0, 10);
  const items = [{ id: "all", name: "All", value: "" }].concat(
    visibleCategories.map((category) => ({
      id: readText(category?.id, category?.slug, category?.name),
      name: readText(category?.name, category?.title, "Category"),
      value: getCategoryValue(category),
    }))
  );

  return (
    <div className="shop2026-hide-scroll flex gap-3 overflow-x-auto pb-1">
      {items.map((item) => {
        const isActive = (!item.value && !activeCategory) || item.value === activeCategory;
        const Icon = item.value ? getCategoryIcon(item.name) : Sparkles;
        return (
          <button
            key={`${item.id}-${item.value || "all"}`}
            type="button"
            onClick={() => onCategoryChange(item.value)}
            className={`inline-flex h-12 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
              isActive
                ? "border-[#034c85] bg-[#034c85] text-white shadow-lg shadow-[#034c85]/20"
                : "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-[#034c85]/30 hover:text-[#034c85] dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                isActive ? "bg-white/15" : "bg-[#034c85]/8 text-[#034c85] dark:bg-white/10 dark:text-white"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive && item.value ? "text-[#fe6f05]" : ""}`} />
            </span>
            <span>{item.name}</span>
          </button>
        );
      })}
    </div>
  );
}

function FilterPanel({
  categories,
  activeCategory,
  minPrice,
  maxPrice,
  minRating,
  onCategoryChange,
  onPriceChange,
  onRatingChange,
  onClear,
}) {
  const [minDraft, setMinDraft] = useState(minPrice ?? "");
  const [maxDraft, setMaxDraft] = useState(maxPrice ?? "");

  useEffect(() => {
    setMinDraft(minPrice ?? "");
    setMaxDraft(maxPrice ?? "");
  }, [minPrice, maxPrice]);

  const applyPrice = () => {
    onPriceChange(toPositiveNumber(minDraft), toPositiveNumber(maxDraft));
  };

  return (
    <div className="space-y-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold uppercase text-slate-950 dark:text-white">Filters</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Refine your daily picks</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-[#fe6f05] hover:text-[#d95700]"
        >
          Clear All
        </button>
      </div>

      <section className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Categories</h3>
        <div className="space-y-2">
          {categories.slice(0, 12).map((category) => {
            const value = getCategoryValue(category);
            const label = readText(category?.name, category?.title, value);
            const checked = activeCategory === value;
            return (
              <label
                key={`filter-category-${value}`}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-1 py-1.5 text-sm text-slate-600 hover:text-[#034c85] dark:text-slate-300 dark:hover:text-white"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onCategoryChange(checked ? "" : value)}
                    className="h-4 w-4 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
                  />
                  <span className="line-clamp-2">{label}</span>
                </span>
                {category?.count || category?.productCount ? (
                  <span className="text-xs text-slate-400">({category.count ?? category.productCount})</span>
                ) : null}
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Price Range</h3>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            min="0"
            value={minDraft}
            onChange={(event) => setMinDraft(event.target.value)}
            onBlur={applyPrice}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyPrice();
            }}
            placeholder="Rp 0"
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#034c85] dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
          <input
            type="number"
            min="0"
            value={maxDraft}
            onChange={(event) => setMaxDraft(event.target.value)}
            onBlur={applyPrice}
            onKeyDown={(event) => {
              if (event.key === "Enter") applyPrice();
            }}
            placeholder="Rp 1.000.000"
            className="h-11 min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-[#034c85] dark:border-white/10 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </section>

      <section className="space-y-3 border-t border-slate-200 pt-5 dark:border-white/10">
        <h3 className="text-sm font-semibold text-slate-950 dark:text-white">Rating</h3>
        <div className="space-y-2">
          {RATING_OPTIONS.map((rating) => (
            <label
              key={`rating-${rating}`}
              className="flex cursor-pointer items-center gap-2 text-sm text-slate-600 dark:text-slate-300"
            >
              <input
                type="checkbox"
                checked={Number(minRating || 0) === rating}
                onChange={() => onRatingChange(Number(minRating || 0) === rating ? "" : rating)}
                className="h-4 w-4 rounded border-slate-300 text-[#034c85] focus:ring-[#034c85]"
              />
              <span className="flex items-center gap-0.5 text-[#fe6f05]">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={`${rating}-${index}`}
                    className={`h-3.5 w-3.5 ${index < rating ? "fill-current" : "text-slate-300 dark:text-slate-600"}`}
                  />
                ))}
              </span>
              <span>& up</span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductImageFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 via-white to-slate-200 text-[#034c85] dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 dark:text-slate-300">
      <ShoppingBasket className="h-12 w-12" />
    </div>
  );
}

function ProductCard({ product, viewMode, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const wishlist = useStorefrontWishlist();
  const timerRef = useRef(null);
  const image = getProductImage(product);
  const name = readText(product?.name, product?.title, "Product");
  const slug = getProductSlug(product);
  const categoryName = getCategoryName(product);
  const price = getProductPrice(product);
  const originalPrice = getOriginalPrice(product);
  const discount = getDiscountPercent(product);
  const rating = Number(product?.rating ?? product?.averageRating ?? product?.reviews?.average ?? 4.6);
  const reviewCount = Number(product?.reviewsCount ?? product?.reviewCount ?? product?.reviews?.count ?? 64);
  const stock = Number(product?.stock ?? product?.availableStock);
  const purchaseState = product?.purchaseState || null;
  const isPurchasable =
    typeof purchaseState?.isPurchasable === "boolean"
      ? purchaseState.isPurchasable
      : !(Number.isFinite(stock) && stock <= 0);
  const productId = Number(product?.id ?? product?.productId);
  const productHref = slug ? `/product/${encodeURIComponent(slug)}` : "#";
  const isList = viewMode === "list";

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const handleAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!Number.isFinite(productId) || !isPurchasable || isAdding) return;
    setIsAdding(true);
    await onAdd(product, image);
    timerRef.current = setTimeout(() => setIsAdding(false), 650);
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_55px_rgba(15,23,42,0.12)] dark:border-white/10 dark:bg-slate-900 ${
        isList ? "grid gap-4 p-4 sm:grid-cols-[210px_minmax(0,1fr)]" : "p-3.5"
      }`}
    >
      <div
        className={`relative overflow-hidden rounded-[1.25rem] bg-slate-100 ${
          isList ? "aspect-square sm:h-full sm:min-h-52" : "aspect-square"
        }`}
      >
        <Link to={productHref} className="block h-full w-full min-w-0 focus:outline-none">
          {image && !imageFailed ? (
            <img
              src={image}
              alt={name}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-contain p-4 transition duration-200 group-hover:scale-[1.035]"
            />
          ) : (
            <ProductImageFallback />
          )}
        </Link>
        {discount > 0 ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#fe6f05] px-3 py-1 text-[10px] font-bold uppercase text-white shadow-lg shadow-[#fe6f05]/30">
            {discount}% Off
          </span>
        ) : null}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); wishlist.toggle(product); }}
          aria-label={`Save ${name}`}
          className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition ${
            wishlist.isWishlisted(product.id || product.slug)
              ? "border-[#fe6f05] bg-[#fe6f05] text-white hover:bg-[#d95700]"
              : "border-slate-200 bg-white text-slate-500 hover:border-[#fe6f05]/40 hover:text-[#fe6f05] dark:border-white/10 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Heart className={`h-4 w-4 ${wishlist.isWishlisted(product.id || product.slug) ? "fill-current" : ""}`} />
        </button>
        <Link
          to={productHref}
          aria-label={`Quick view ${name}`}
          className="absolute bottom-3 left-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-[#034c85] shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-white"
        >
          <Eye className="h-4 w-4" />
        </Link>
        {!isList ? (
          <button
            type="button"
            onClick={handleAdd}
            disabled={!Number.isFinite(productId) || !isPurchasable || isAdding}
            aria-label={`Add ${name} to cart`}
            className="absolute bottom-3 right-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#034c85] text-white shadow-lg shadow-[#034c85]/20 transition hover:bg-[#023b68] disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
          </button>
        ) : null}
      </div>

      <div className={`min-w-0 ${isList ? "flex flex-col justify-between" : "mt-4"}`}>
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase text-slate-400 dark:text-slate-500">
            {categoryName}
          </p>
          <Link
            to={productHref}
            className="line-clamp-2 min-h-[2.75rem] text-sm font-bold leading-6 text-slate-950 transition hover:text-[#034c85] dark:text-white dark:hover:text-slate-200"
          >
            {name}
          </Link>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-0.5 text-[#fe6f05]">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={`${name}-star-${index}`}
                  className={`h-3.5 w-3.5 ${index < Math.round(rating) ? "fill-current" : "text-slate-300 dark:text-slate-600"}`}
                />
              ))}
            </span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">
              {Number.isFinite(rating) ? rating.toFixed(1) : "4.6"}
            </span>
            <span className="text-slate-400">({Number.isFinite(reviewCount) ? reviewCount : 0})</span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-lg font-extrabold text-slate-950 dark:text-white">
              {formatCurrency(price)}
            </span>
            {originalPrice > price && price > 0 ? (
              <span className="text-xs font-semibold text-slate-400 line-through">
                {formatCurrency(originalPrice)}
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!Number.isFinite(productId) || !isPurchasable || isAdding}
            className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-[1rem] px-4 text-sm font-bold text-white shadow-lg transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-700 ${
              isPurchasable ? "bg-[#034c85] shadow-[#034c85]/20 hover:bg-[#023b68]" : "bg-slate-300"
            }`}
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
            <span>{isPurchasable ? "Add to Cart" : purchaseState?.label || "Unavailable"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

function ProductSkeleton() {
  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-3.5 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="aspect-square animate-pulse rounded-[1.25rem] bg-slate-100 dark:bg-slate-800" />
      <div className="mt-4 space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="h-10 w-full animate-pulse rounded-[1rem] bg-slate-100 dark:bg-slate-800" />
      </div>
    </article>
  );
}

function Pagination2026({ page, total, limit, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    const start = Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4));
    return start + index;
  }).filter((value) => value <= totalPages);

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#034c85]/30 hover:text-[#034c85] disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-slate-200"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>
      {pages.map((item) => (
        <button
          key={`page-${item}`}
          type="button"
          onClick={() => onPageChange(item)}
          className={`inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-bold transition ${
            item === page
              ? "bg-[#fe6f05] text-white shadow-lg shadow-[#fe6f05]/30"
              : "border border-slate-200 text-slate-700 hover:border-[#034c85]/30 hover:text-[#034c85] dark:border-white/10 dark:text-slate-200"
          }`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="inline-flex h-10 items-center gap-1 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-[#034c85]/30 hover:text-[#034c85] disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:text-slate-200"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export default function StoreShopPage2026() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const cart = useCart();

  const query = readText(searchParams.get("q"), searchParams.get("query"), searchParams.get("search"));
  const category = readText(searchParams.get("category"));
  const minPrice = toPositiveNumber(searchParams.get("minPrice"));
  const maxPrice = toPositiveNumber(searchParams.get("maxPrice"));
  const minRating = toPositiveNumber(searchParams.get("minRating"));
  const sort = SORT_OPTIONS.some((option) => option.value === searchParams.get("sort"))
    ? searchParams.get("sort")
    : "featured";
  const page = toPositiveInteger(searchParams.get("page"), 1);
  const limit = toPositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT);

  const productParams = useMemo(
    () => ({
      q: query || undefined,
      search: query || undefined,
      category: category || undefined,
      minPrice: minPrice ?? undefined,
      maxPrice: maxPrice ?? undefined,
      minRating: minRating ?? undefined,
      sort,
      page,
      limit,
      enabled: true,
      keepPreviousData: true,
    }),
    [category, limit, maxPrice, minPrice, minRating, page, query, sort]
  );

  const {
    data: categoriesPayload,
    isLoading: categoriesLoading,
    isError: categoriesError,
  } = useCategories({ parentsOnly: true });

  const {
    data: productsPayload,
    isLoading: productsLoading,
    isFetching: productsFetching,
    isError: productsError,
    error: productsErrorObj,
    refetch,
  } = useProducts(productParams);

  const categories = useMemo(
    () => normalizeArray(categoriesPayload, ["items", "categories", "rows"]),
    [categoriesPayload]
  );
  const products = useMemo(
    () => normalizeArray(productsPayload, ["items", "products", "rows"]),
    [productsPayload]
  );
  const meta = useMemo(() => getProductsMeta(productsPayload, products.length), [productsPayload, products.length]);
  const total = meta.total;
  const displayStart = total > 0 ? (page - 1) * limit + 1 : 0;
  const displayEnd = total > 0 ? Math.min(total, displayStart + products.length - 1) : 0;
  const isInitialLoading = productsLoading && !productsPayload;
  const isEmpty = !isInitialLoading && !productsError && products.length === 0;
  const activeFilterCount = [
    query,
    category,
    minPrice !== null,
    maxPrice !== null,
    minRating !== null,
    sort !== "featured",
  ].filter(Boolean).length;

  const commitParams = (next, options) => {
    updateSearchParams(searchParams, setSearchParams, next, options);
  };

  const clearAll = () => {
    commitParams(
      {
        search: "",
        category: "",
        minPrice: "",
        maxPrice: "",
        minRating: "",
        sort: "featured",
        page: 1,
      },
      { resetPage: false }
    );
    setIsFilterOpen(false);
  };

  const handleAdd = async (product, imageUrl) => {
    const productId = Number(product?.id ?? product?.productId);
    if (!Number.isFinite(productId) || productId <= 0) return;
    const slug = getProductSlug(product);
    await cart.add(productId, 1, {
      name: readText(product?.name, product?.title, "Product"),
      price: getProductPrice(product),
      imageUrl,
      stock: Number.isFinite(Number(product?.stock ?? product?.availableStock))
        ? Number(product?.stock ?? product?.availableStock)
        : null,
      slug,
      storeId: product?.storeId ?? product?.store?.id ?? null,
      storeSlug: readText(product?.storeSlug, product?.store?.slug),
      category: getCategoryName(product),
    });
  };

  const filterPanel = (
    <FilterPanel
      categories={categories}
      activeCategory={category}
      minPrice={minPrice ?? ""}
      maxPrice={maxPrice ?? ""}
      minRating={minRating ?? ""}
      onCategoryChange={(value) => {
        commitParams({ category: value || "", page: 1 });
        setIsFilterOpen(false);
      }}
      onPriceChange={(nextMin, nextMax) => commitParams({ minPrice: nextMin ?? "", maxPrice: nextMax ?? "", page: 1 })}
      onRatingChange={(value) => {
        commitParams({ minRating: value || "", page: 1 });
        setIsFilterOpen(false);
      }}
      onClear={clearAll}
    />
  );

  return (
    <main className="bg-slate-50 px-4 pb-24 pt-4 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-5 lg:px-6 xl:px-8">
      <div className="mx-auto max-w-[1480px] space-y-6">
        <ShopHero query={query} onSearch={(value) => commitParams({ search: value, page: 1 })} />

        <CategoryPills
          categories={categories}
          activeCategory={category}
          onCategoryChange={(value) => commitParams({ category: value || "", page: 1 })}
        />

        <section className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start">
          <aside className="hidden lg:sticky lg:top-24 lg:block">{filterPanel}</aside>

          <div className="min-w-0 space-y-5">
            <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-slate-900 sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-12 items-center rounded-[1rem] border border-slate-200 bg-slate-50 p-1 dark:border-white/10 dark:bg-slate-950">
                    <button
                      type="button"
                      onClick={() => setViewMode("grid")}
                      aria-label="Grid view"
                      aria-pressed={viewMode === "grid"}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        viewMode === "grid"
                          ? "bg-[#034c85] text-white"
                          : "text-slate-500 hover:bg-white hover:text-[#034c85] dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      aria-label="List view"
                      aria-pressed={viewMode === "list"}
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition ${
                        viewMode === "list"
                          ? "bg-[#034c85] text-white"
                          : "text-slate-500 hover:bg-white hover:text-[#034c85] dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    <span className="text-slate-950 dark:text-white">{total}</span> results
                  </div>
                  {productsFetching && !isInitialLoading ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#034c85]/8 px-3 py-1.5 text-xs font-semibold text-[#034c85] dark:bg-white/10 dark:text-slate-200">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Updating
                    </span>
                  ) : null}
                  {activeFilterCount > 0 ? (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="rounded-full bg-[#fe6f05]/10 px-3 py-1.5 text-xs font-bold text-[#fe6f05] hover:bg-[#fe6f05]/15"
                    >
                      {activeFilterCount} active
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(true)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-[1rem] border border-slate-200 bg-white px-4 text-sm font-bold text-[#034c85] shadow-sm transition hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-white lg:hidden"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </button>
                  <label htmlFor="shop-sort" className="text-sm text-slate-500 dark:text-slate-400">
                    Sort by:
                  </label>
                  <select
                    id="shop-sort"
                    value={sort}
                    onChange={(event) => commitParams({ sort: event.target.value, page: 1 })}
                    className="h-11 min-w-44 rounded-[1rem] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-950 outline-none focus:border-[#034c85] dark:border-white/10 dark:bg-slate-950 dark:text-white"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {categoriesError ? (
              <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                Category list is unavailable right now. Product results are still available.
              </div>
            ) : null}

            {isInitialLoading ? (
              <div
                className={`grid gap-4 ${
                  viewMode === "list" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                }`}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <ProductSkeleton key={`product-skeleton-${index}`} />
                ))}
              </div>
            ) : null}

            {productsError && products.length === 0 ? (
              <div className="rounded-[2rem] border border-rose-200 bg-white p-8 text-center shadow-sm dark:border-rose-400/20 dark:bg-slate-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-400/10 dark:text-rose-200">
                  <SearchX className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
                  Products could not be loaded
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">
                  {productsErrorObj?.response?.data?.message || productsErrorObj?.message || "Please try again in a moment."}
                </p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-[1rem] bg-[#034c85] px-5 text-sm font-bold text-white shadow-lg shadow-[#034c85]/20 hover:bg-[#023b68]"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {isEmpty ? (
              <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-white/10 dark:bg-slate-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#034c85]/8 text-[#034c85] dark:bg-white/10 dark:text-white">
                  <SearchX className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-bold text-slate-950 dark:text-white">
                  No products found
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Try another keyword, category, price range, or rating filter.
                </p>
                <button
                  type="button"
                  onClick={clearAll}
                  className="mt-5 inline-flex h-11 items-center justify-center rounded-[1rem] bg-[#fe6f05] px-5 text-sm font-bold text-white shadow-lg shadow-[#fe6f05]/30 hover:bg-[#d95700]"
                >
                  Clear Filters
                </button>
              </div>
            ) : null}

            {!isInitialLoading && products.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-950 dark:text-white">{displayStart}-{displayEnd}</span> of{" "}
                    <span className="font-bold text-slate-950 dark:text-white">{total}</span> products
                  </p>
                </div>

                <div
                  className={`grid gap-4 ${
                    viewMode === "list"
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                  }`}
                >
                  {products.map((product, index) => (
                    <ProductCard
                      key={readText(product?.id, product?.productId, product?.slug, `${index}`)}
                      product={product}
                      viewMode={viewMode}
                      onAdd={handleAdd}
                    />
                  ))}
                </div>

                <Pagination2026
                  page={page}
                  total={total}
                  limit={limit}
                  onPageChange={(nextPage) => commitParams({ page: nextPage }, { resetPage: false })}
                />
              </>
            ) : null}
          </div>
        </section>
      </div>

      {isFilterOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            aria-label="Close filters"
            onClick={() => setIsFilterOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-[2rem] bg-slate-50 p-4 shadow-2xl dark:bg-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-950 dark:text-white">
                <SlidersHorizontal className="h-4 w-4 text-[#034c85] dark:text-slate-200" />
                Filters
              </div>
              <button
                type="button"
                onClick={() => setIsFilterOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      ) : null}
    </main>
  );
}
