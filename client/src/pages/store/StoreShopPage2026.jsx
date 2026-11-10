import { ChevronLeft, ChevronRight, SearchX, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { useCategories, useProducts } from "../../storefront.jsx";
import { useCart } from "../../hooks/useCart.ts";
import { productHasVariantSelections } from "../../utils/publicProductVariations.js";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import ShopCategoryRail2026 from "./shop2026/ShopCategoryRail2026.jsx";
import ShopFilters2026 from "./shop2026/ShopFilters2026.jsx";
import ShopHero2026 from "./shop2026/ShopHero2026.jsx";
import ShopProductCard2026 from "./shop2026/ShopProductCard2026.jsx";
import ShopProductListItem2026 from "./shop2026/ShopProductListItem2026.jsx";
import ShopStoreSpotlight2026 from "./shop2026/ShopStoreSpotlight2026.jsx";
import ShopQuickViewModal2026 from "./shop2026/ShopQuickViewModal2026.jsx";
import ShopToolbar2026, { SHOP_SORT_OPTIONS } from "./shop2026/ShopToolbar2026.jsx";
import {
  buildShopCartSnapshot,
  getShopCategoryValue,
  mapProductToShopCard,
  normalizeShopArray,
  readShopText,
} from "./shop2026/shopProductAdapter.js";
import "./shop2026/shop-2026-redesign.css";

const DEFAULT_LIMIT = 12;

const toNonNegativeNumber = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
};

const toPositiveInteger = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
};

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

export const normalizeArray = normalizeShopArray;
export const getProductImage = (product) => mapProductToShopCard(product).image;
export const getProductPrice = (product) => mapProductToShopCard(product).price;
export const getOriginalPrice = (product) => mapProductToShopCard(product).originalPrice;
export const getDiscountPercent = (product) => mapProductToShopCard(product).discount;
export const getProductSlug = (product) => mapProductToShopCard(product).slug;
export const getCategoryName = (product) => mapProductToShopCard(product).category;

export const getProductsMeta = (payload, fallbackLength = 0) => {
  const source = payload?.meta ?? payload?.data?.meta ?? payload?.pagination ?? {};
  return {
    page: toPositiveInteger(source.page ?? source.currentPage, 1),
    limit: toPositiveInteger(source.limit ?? source.perPage ?? source.pageSize, DEFAULT_LIMIT),
    total: Math.max(0, Number(source.total ?? source.totalItems ?? source.count ?? fallbackLength) || 0),
  };
};

function ProductSkeleton() {
  return (
    <article className="tp-shopee-skeleton">
      <div className="tp-shopee-skeleton__media" />
      <div className="tp-shopee-skeleton__body">
        <span className="tp-shopee-skeleton__line w-3/4" />
        <span className="tp-shopee-skeleton__line w-1/2" />
        <span className="tp-shopee-skeleton__line w-1/3" />
      </div>
    </article>
  );
}

function Pagination({ page, total, limit, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, limit)));
  if (totalPages <= 1) return null;

  const first = Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index)
    .filter((item) => item <= totalPages);

  return (
    <nav className="tp-shopee-pagination" aria-label="Product pages">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="tp-shopee-page-nav"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          className={`tp-shopee-page-num ${item === page ? "is-active" : ""}`}
          onClick={() => onChange(item)}
          aria-current={item === page ? "page" : undefined}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
        className="tp-shopee-page-nav"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </nav>
  );
}

export default function StoreShopPage2026() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID";
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState("grid");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickViewCard, setQuickViewCard] = useState(null);
  const cart = useCart();
  const wishlist = useStorefrontWishlist();

  const query = readShopText(searchParams.get("q"), searchParams.get("query"), searchParams.get("search"));
  const category = readShopText(searchParams.get("category"));
  const minPrice = toNonNegativeNumber(searchParams.get("minPrice"));
  const maxPrice = toNonNegativeNumber(searchParams.get("maxPrice"));
  const minRating = toNonNegativeNumber(searchParams.get("minRating"));
  const requestedSort = searchParams.get("sort") || "featured";
  const sort = SHOP_SORT_OPTIONS.some((option) => option.value === requestedSort) ? requestedSort : "featured";
  const page = toPositiveInteger(searchParams.get("page"), 1);
  const limit = toPositiveInteger(searchParams.get("limit"), DEFAULT_LIMIT);

  const currentLang = isIndo ? "id" : "en";
  const { data: shopCustomizationData } = useQuery({
    queryKey: ["store-customization", "shop", currentLang],
    queryFn: () => getStoreCustomization({ lang: currentLang, include: "shop" }),
    staleTime: 60 * 1000,
  });
  const shopConfig = shopCustomizationData?.customization?.shop?.header;

  const commit = useCallback((next, { resetPage = true } = {}) => {
    const params = new URLSearchParams(searchParams);
    const assign = (key, value) => {
      if (value === "" || value === null || value === undefined || value === false) params.delete(key);
      else params.set(key, String(value));
    };

    if (hasOwn(next, "q")) {
      assign("q", next.q);
      params.delete("query");
      params.delete("search");
    }

    ["category", "minPrice", "maxPrice", "minRating"].forEach((key) => {
      if (hasOwn(next, key)) assign(key, next[key]);
    });

    if (hasOwn(next, "sort")) assign("sort", next.sort === "featured" ? "" : next.sort);
    if (hasOwn(next, "page")) assign("page", Math.max(1, Number(next.page) || 1));
    else if (resetPage) assign("page", 1);

    if (params.get("page") === "1") params.delete("page");
    if (params.get("limit") === String(DEFAULT_LIMIT)) params.delete("limit");
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  const productParams = useMemo(() => ({
    q: query || undefined,
    category: category || undefined,
    minPrice: minPrice ?? undefined,
    maxPrice: maxPrice ?? undefined,
    minRating: minRating ?? undefined,
    sort,
    page,
    limit,
    enabled: true,
    keepPreviousData: true,
  }), [category, limit, maxPrice, minPrice, minRating, page, query, sort]);

  const categoriesQuery = useCategories({ parentsOnly: true });
  const productsQuery = useProducts(productParams);
  const categories = useMemo(
    () => normalizeShopArray(categoriesQuery.data, ["categories", "items", "rows"]),
    [categoriesQuery.data]
  );
  const products = useMemo(
    () => normalizeShopArray(productsQuery.data, ["products", "items", "rows"]),
    [productsQuery.data]
  );
  const cards = useMemo(() => products.map(mapProductToShopCard), [products]);
  const meta = useMemo(() => getProductsMeta(productsQuery.data, cards.length), [cards.length, productsQuery.data]);
  const total = meta.total;
  const displayStart = total ? (page - 1) * limit + 1 : 0;
  const displayEnd = total ? Math.min(total, displayStart + cards.length - 1) : 0;
  const initialLoading = productsQuery.isLoading && !productsQuery.data;
  const activeCategoryName = categories.find((item) => getShopCategoryValue(item) === category)?.name || category;

  // Real store spotlight
  const spotlightStore = useMemo(() => {
    const productWithStore = cards.find(
      (c) => c.storeName && c.storeName !== "Local store" && c.storeSlug
    );
    if (!productWithStore) return null;
    const storeProducts = cards.filter(
      (c) => c.storeSlug === productWithStore.storeSlug
    );
    return {
      store: {
        name: productWithStore.storeName,
        slug: productWithStore.storeSlug,
        city: productWithStore.storeCity,
        logoUrl: productWithStore.storeLogo,
      },
      products: storeProducts,
    };
  }, [cards]);

  const activeFilters = [
    query ? { key: "q", label: isIndo ? `Cari: ${query}` : `Search: ${query}` } : null,
    category ? { key: "category", label: activeCategoryName } : null,
    minPrice !== null || maxPrice !== null
      ? { key: "price", label: isIndo ? `Rp ${minPrice ?? 0} - Rp ${maxPrice ?? "Maks"}` : `Rp ${minPrice ?? 0} - Rp ${maxPrice ?? "Max"}` }
      : null,
    minRating !== null ? { key: "minRating", label: isIndo ? `★ ${minRating}+` : `★ ${minRating}+` } : null,
  ].filter(Boolean);

  const clearAll = () => {
    const params = new URLSearchParams(searchParams);
    ["q", "query", "search", "category", "minPrice", "maxPrice", "minRating", "sort", "page"].forEach((key) => {
      params.delete(key);
    });
    setSearchParams(params, { replace: true });
    setFiltersOpen(false);
  };

  const removeFilter = (key) => {
    if (key === "price") commit({ minPrice: "", maxPrice: "" });
    else commit({ [key]: "" });
  };

  const addCardToCart = async (card) => {
    if (productHasVariantSelections(card.raw?.variations)) {
      toast(isIndo ? "Pilih varian produk terlebih dahulu." : "Please select product options first.");
      navigate(card.href);
      return false;
    }

    const added = await cart.add(card.id, 1, buildShopCartSnapshot(card));
    if (added) toast.success(isIndo ? `${card.name} masuk ke keranjang.` : `${card.name} added to cart.`);
    else if (!productHasVariantSelections(card.raw?.variations)) {
      toast.error(isIndo ? "Gagal menambahkan produk." : "Failed to add product.");
    }

    return added !== false;
  };

  const buyCardNow = async (card) => {
    const added = await addCardToCart(card);
    if (added) navigate("/cart");
  };

  const toggleWishlist = (card) => {
    const added = wishlist.toggle({ ...card.raw, ...card, imageUrl: card.image });
    toast.success(
      added
        ? (isIndo ? `${card.name} ditambahkan ke wishlist.` : `${card.name} added to wishlist.`)
        : (isIndo ? `${card.name} dihapus dari wishlist.` : `${card.name} removed from wishlist.`)
    );
  };

  const filters = (
    <ShopFilters2026
      categories={categories}
      activeCategory={category}
      minPrice={minPrice ?? ""}
      maxPrice={maxPrice ?? ""}
      minRating={minRating ?? ""}
      onCategoryChange={(value) => {
        commit({ category: value });
      }}
      onPriceChange={(minimum, maximum) => commit({ minPrice: minimum, maxPrice: maximum })}
      onRatingChange={(value) => {
        commit({ minRating: value });
      }}
      onClear={clearAll}
      onApply={() => setFiltersOpen(false)}
    />
  );

  const productProps = (card) => ({
    card,
    isWishlisted: wishlist.isWishlisted(card.id || card.slug),
    onToggleWishlist: toggleWishlist,
    onQuickView: setQuickViewCard,
    onAdd: addCardToCart,
    onBuyNow: buyCardNow,
  });

  return (
    <div className="tp-shopee-page">
      <div className="tp-shopee-container">
        {/* Compact Search Header */}
        <ShopHero2026
          query={query}
          onSearch={(value) => commit({ q: value })}
          shopConfig={shopConfig}
        />

        {/* Horizontal Category Rail */}
        <ShopCategoryRail2026
          categories={categories}
          activeCategory={category}
          onChange={(value) => commit({ category: value })}
        />

        {/* Main Catalog with Desktop Sidebar & Results */}
        <div className="tp-shopee-layout">
          {/* Desktop Left Filter Sidebar */}
          <aside className="tp-shopee-sidebar">
            {filters}
          </aside>

          {/* Catalog Results Column */}
          <main className="tp-shopee-main">
            {/* Quick-Sort Toolbar */}
            <ShopToolbar2026
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              total={total}
              displayStart={displayStart}
              displayEnd={displayEnd}
              sort={sort}
              onSortChange={(value) => commit({ sort: value })}
              isFetching={productsQuery.isFetching && !initialLoading}
              activeFilters={activeFilters}
              onRemoveFilter={removeFilter}
              onClear={clearAll}
              onOpenFilters={() => setFiltersOpen(true)}
            />

            {/* Official Store Spotlight (Matching Reference Image) */}
            {spotlightStore && !initialLoading && !category && (
              <ShopStoreSpotlight2026
                store={spotlightStore.store}
                products={spotlightStore.products}
              />
            )}

            {/* Loading skeletons */}
            {initialLoading && (
              <div className="tp-shopee-grid">
                {Array.from({ length: 8 }, (_, index) => (
                  <ProductSkeleton key={`skel-${index}`} />
                ))}
              </div>
            )}

            {/* Error state */}
            {productsQuery.isError && !cards.length && (
              <div className="tp-shopee-state">
                <SearchX className="w-10 h-10 text-[#fe6f05]" />
                <h3>{isIndo ? "Produk tidak dapat dimuat" : "Products could not be loaded"}</h3>
                <p>{isIndo ? "Silakan coba lagi beberapa saat." : "Please try again in a moment."}</p>
                <button
                  type="button"
                  className="tp-shopee-btn-apply"
                  onClick={() => productsQuery.refetch()}
                >
                  {isIndo ? "Coba Lagi" : "Retry"}
                </button>
              </div>
            )}

            {/* Empty state */}
            {!initialLoading && !productsQuery.isError && !cards.length && (
              <div className="tp-shopee-state">
                <SearchX className="w-10 h-10 text-slate-400" />
                <h3>{isIndo ? "Tidak ada produk ditemukan" : "No products found"}</h3>
                <p>{isIndo ? "Coba kata kunci atau filter lain." : "Try another keyword or filter."}</p>
                <button
                  type="button"
                  className="tp-shopee-btn-apply"
                  onClick={clearAll}
                >
                  {isIndo ? "Hapus Filter" : "Clear Filters"}
                </button>
              </div>
            )}

            {/* Product Grid / List */}
            {!initialLoading && cards.length > 0 && (
              <>
                <div className={viewMode === "grid" ? "tp-shopee-grid" : "tp-shopee-list"}>
                  {cards.map((card, index) => (
                    viewMode === "grid" ? (
                      <ShopProductCard2026
                        key={card.id || card.slug || index}
                        {...productProps(card)}
                      />
                    ) : (
                      <ShopProductListItem2026
                        key={card.id || card.slug || index}
                        {...productProps(card)}
                      />
                    )
                  ))}
                </div>

                {/* Pagination */}
                <Pagination
                  page={page}
                  total={total}
                  limit={limit}
                  onChange={(next) => commit({ page: next }, { resetPage: false })}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Preferences Drawer ("Pilih Preferensi") */}
      {filtersOpen && (
        <div className="tp-shopee-drawer">
          <button
            type="button"
            className="tp-shopee-drawer__backdrop"
            onClick={() => setFiltersOpen(false)}
            aria-label="Close filters"
          />
          <div className="tp-shopee-drawer__content">
            <header className="tp-shopee-drawer__header">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#fe6f05]" />
                <span>{isIndo ? "Pilih Preferensi" : "Filter Preferences"}</span>
              </div>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="tp-shopee-drawer__close"
                aria-label="Close filters"
              >
                <X className="w-5 h-5" />
              </button>
            </header>
            {filters}
          </div>
        </div>
      )}

      {/* Quick View Modal */}
      <ShopQuickViewModal2026
        card={quickViewCard}
        onClose={() => setQuickViewCard(null)}
        onAdd={addCardToCart}
        onBuyNow={buyCardNow}
      />
    </div>
  );
}
