import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Car,
  Dumbbell,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  Grid2X2,
  Headphones,
  HeartPulse,
  Home,
  Laptop,
  MapPin,
  Monitor,
  PackageSearch,
  RotateCcw,
  Search,
  ShieldCheck,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Sofa,
  Sparkles,
  Star,
  Store,
  Tags,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useCategories, useProducts } from "../../storefront.jsx";
import "./store-categories-2026.css";

const fallbackCategories = [
  { name: "Electronics", slug: "electronics", description: "Smart tech for every lifestyle.", iconKey: "electronics", productCount: 18450 },
  { name: "Fashion", slug: "fashion", description: "Trendy styles for every you.", iconKey: "fashion", productCount: 24120 },
  { name: "Grocery", slug: "grocery", description: "Daily essentials delivered.", iconKey: "grocery", productCount: 12840 },
  { name: "Home & Living", slug: "home-living", description: "Make your house a happy home.", iconKey: "home", productCount: 16730 },
  { name: "Beauty", slug: "beauty", description: "Glow with confidence.", iconKey: "beauty", productCount: 8210 },
  { name: "Sports", slug: "sports", description: "Gear up, stay active.", iconKey: "sports", productCount: 9140 },
  { name: "Books", slug: "books", description: "Stories that inspire.", iconKey: "books", productCount: 6530 },
  { name: "Kids & Toys", slug: "kids-toys", description: "Fun, safe, educational.", iconKey: "kids", productCount: 11250 },
  { name: "Health", slug: "health", description: "Healthier you, better life.", iconKey: "health", productCount: 7890 },
  { name: "Automotive", slug: "automotive", description: "Performance you can trust.", iconKey: "automotive", productCount: 13640 },
  { name: "Office", slug: "office", description: "Everything for a productive day.", iconKey: "office", productCount: 5780 },
  { name: "Gift Ideas", slug: "gift-ideas", description: "Perfect gifts for every occasion.", iconKey: "gift", productCount: 4210 },
];

const quickFilters = [
  { label: "All", icon: Grid2X2, to: "/shop" },
  { label: "Trending", icon: Flame, to: "/search?sort=popular&page=1" },
  { label: "New", icon: Sparkles, to: "/search?sort=newest&page=1" },
  { label: "Budget", icon: BadgeDollarSign, to: "/search?maxPrice=100000&page=1" },
  { label: "Premium", icon: Gem, to: "/search?minPrice=1000000&page=1" },
  { label: "Local Brands", icon: MapPin, to: "/search?q=local+brands&page=1" },
  { label: "Best Rated", icon: Star, to: "/search?minRating=4&page=1" },
];

const popularTerms = [
  ["Headphones", Headphones],
  ["Skincare", Sparkles],
  ["Kitchen", ShoppingBasket],
  ["Sneakers", Shirt],
  ["Gaming", Gamepad2],
  ["Books", BookOpen],
];

const featuredCollections = [
  {
    title: "Tech Essentials",
    query: "tech essentials",
    description: "Must-have gadgets for modern life.",
    icon: Laptop,
  },
  {
    title: "Home Refresh",
    query: "home refresh",
    description: "Upgrade your space with comfort.",
    icon: Sofa,
  },
  {
    title: "Weekend Picks",
    query: "weekend picks",
    description: "Top picks for your best weekend.",
    icon: ShoppingBag,
  },
];

const iconMap = {
  electronics: Monitor,
  fashion: Shirt,
  grocery: ShoppingBasket,
  home: Home,
  beauty: Sparkles,
  sports: Dumbbell,
  books: BookOpen,
  kids: Baby,
  health: HeartPulse,
  automotive: Car,
  office: BriefcaseBusiness,
  gift: Gift,
};

const categoryIconKeys = Object.keys(iconMap);

const toText = (value, fallback = "") => {
  const text = String(value ?? "").trim();
  return text || fallback;
};

const toSlug = (value) =>
  toText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.payload?.items)) return payload.payload.items;
  return [];
};

const INDO_CATEGORY_TRANSLATIONS = {
  // Category Names
  "Electronics": "Elektronik",
  "Fashion": "Fashion",
  "Grocery": "Kebutuhan Pokok",
  "Home & Living": "Rumah & Tempat Tinggal",
  "Beauty": "Kecantikan",
  "Sports": "Olahraga",
  "Books": "Buku",
  "Kids & Toys": "Anak & Mainan",
  "Health": "Kesehatan",
  "Automotive": "Otomotif",
  "Office": "Kantor",
  "Gift Ideas": "Ide Hadiah",
  "Fish & Meat": "Ikan & Daging",
  "Soft Drink": "Minuman Ringan",
  "Milk & Dairy": "Susu & Olahan",
  "Beauty & Health": "Kecantikan & Kesehatan",
  "Snacks": "Camilan",
  "Beverages": "Minuman",
  "Baby Care": "Perawatan Bayi",
  "Fruits & Vegetables": "Buah & Sayur",
  "Fresh Produce": "Produk Segar",
  "Rice & Grains": "Beras & Biji-bijian",
  "Kitchen": "Dapur",
  "Sneakers": "Sepatu Kets",
  "Gaming": "Gaming",
  "Headphones": "Headphone",
  "Skincare": "Perawatan Kulit",
  "Category": "Kategori",
  "All": "Semua",
  "Trending": "Tren",
  "New": "Baru",
  "Budget": "Hemat",
  "Premium": "Premium",
  "Local Brands": "Brand Lokal",
  "Best Rated": "Rating Tertinggi",
  "Tech Essentials": "Kebutuhan Teknologi",
  "Home Refresh": "Pembaruan Rumah",
  "Weekend Picks": "Pilihan Akhir Pekan",

  // Category Descriptions
  "Smart tech for every lifestyle.": "Teknologi pintar untuk setiap gaya hidup.",
  "Trendy styles for every you.": "Gaya trendi untuk penampilanmu.",
  "Daily essentials delivered.": "Kebutuhan harian dikirim ke rumah.",
  "Make your house a happy home.": "Jadikan rumahmu tempat yang nyaman.",
  "Glow with confidence.": "Tampil bersinar dengan percaya diri.",
  "Gear up, stay active.": "Lengkapi perlengkapan, tetap aktif.",
  "Stories that inspire.": "Cerita yang menginspirasi.",
  "Fun, safe, educational.": "Seru, aman, dan edukatif.",
  "Healthier you, better life.": "Diri lebih sehat, hidup lebih baik.",
  "Performance you can trust.": "Performa yang dapat diandalkan.",
  "Everything for a productive day.": "Semua kebutuhan untuk hari produktif.",
  "Perfect gifts for every occasion.": "Hadiah sempurna untuk setiap momen.",
  "Must-have gadgets for modern life.": "Gadget wajib untuk gaya hidup modern.",
  "Upgrade your space with comfort.": "Tingkatkan kenyamanan ruangan Anda.",
  "Top picks for your best weekend.": "Pilihan terbaik untuk akhir pekan Anda.",
  "Explore products.": "Jelajahi produk.",
  "Explore products": "Jelajahi produk"
};

const translateText = (text, isIndo) => {
  if (!isIndo || !text) return text;
  return INDO_CATEGORY_TRANSLATIONS[text] || text;
};

const formatCount = (value, t, isIndo) => {
  const number = toNumber(value);
  if (number === null || number <= 0) return t ? t("categoriesPage.exploreProducts", "Explore products") : "Explore products";
  const numStr = isIndo ? number.toLocaleString("id-ID") : number.toLocaleString("en-US");
  return t ? t("categoriesPage.productsCount", "{{count}}+ products", { count: numStr }) : `${numStr}+ products`;
};

const buildSearchPath = (params) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      query.set(key, String(value));
    }
  });
  if (!query.has("page")) query.set("page", "1");
  return `/search?${query.toString()}`;
};

const normalizeCategory = (category, index, isIndo) => {
  const rawName = toText(
    category?.name || category?.title || category?.label || category?.categoryName,
    fallbackCategories[index % fallbackCategories.length]?.name || "Category"
  );
  const name = translateText(rawName, isIndo);
  const slug = toText(category?.slug || category?.code || category?.id, toSlug(rawName));
  const iconKey =
    fallbackCategories.find((item) => item.slug === slug || item.name === rawName || item.name === name)?.iconKey ||
    categoryIconKeys[index % categoryIconKeys.length];

  const rawDesc = toText(
    category?.description || category?.shortDescription || category?.summary,
    fallbackCategories[index % fallbackCategories.length]?.description || "Explore products."
  );
  const description = translateText(rawDesc, isIndo);

  return {
    ...category,
    id: category?.id ?? category?._id ?? slug,
    name,
    slug,
    description,
    image: resolveAssetUrl(toText(category?.image || category?.imageUrl || category?.iconUrl)),
    iconKey,
    productCount:
      category?.productCount ??
      category?.productsCount ??
      category?.totalProducts ??
      category?.count ??
      category?.products_count,
  };
};

const normalizeProductImage = (product) =>
  resolveAssetUrl(
    toText(
      product?.imageUrl ||
        product?.thumbnail ||
        product?.image ||
        product?.images?.[0] ||
        product?.media?.[0]?.url
    )
  );

const buildTopStores = (products) => {
  const storeMap = new Map();

  products.forEach((product) => {
    const storeSlug = toText(
      product?.storeSlug || product?.store?.slug || product?.seller?.slug || product?.sellerInfo?.slug
    );
    const name = toText(
      product?.store?.name ||
        product?.seller?.name ||
        product?.sellerInfo?.name ||
        product?.storeName,
      storeSlug ? storeSlug.replace(/-/g, " ") : ""
    );
    if (!name) return;

    const key = storeSlug || name.toLowerCase();
    const existing = storeMap.get(key) || {
      name,
      slug: storeSlug,
      products: 0,
      ratingTotal: 0,
      ratingCount: 0,
      image: resolveAssetUrl(toText(product?.store?.logoUrl || product?.seller?.logoUrl || product?.sellerInfo?.logoUrl)),
    };
    const rating = toNumber(
      product?.store?.ratingAverage ||
        product?.seller?.ratingAverage ||
        product?.sellerInfo?.ratingAverage ||
        product?.rating
    );

    existing.products += 1;
    if (rating !== null && rating > 0) {
      existing.ratingTotal += rating;
      existing.ratingCount += 1;
    }
    if (!existing.image) {
      existing.image = resolveAssetUrl(
        toText(product?.store?.logoUrl || product?.seller?.logoUrl || product?.sellerInfo?.logoUrl)
      );
    }
    storeMap.set(key, existing);
  });

  return Array.from(storeMap.values())
    .map((storeItem) => ({
      ...storeItem,
      rating: storeItem.ratingCount ? storeItem.ratingTotal / storeItem.ratingCount : 4.8,
    }))
    .sort((first, second) => second.products - first.products)
    .slice(0, 4);
};

function CategorySkeletonGrid({ t, isIndo }) {
  return (
    <div className="store-categories-2026__grid" aria-label={t ? t("categoriesPage.loadingCategories", "Loading categories") : "Loading categories"}>
      {Array.from({ length: 10 }, (_, index) => (
        <div className="store-categories-2026__skeleton-card" key={`category-skeleton-${index}`}>
          <span />
          <i />
          <b />
          <em />
        </div>
      ))}
    </div>
  );
}

function CategoryCard({ category, index, t, isIndo }) {
  const Icon = iconMap[category.iconKey] || iconMap[categoryIconKeys[index % categoryIconKeys.length]];
  const isFeature = index === 0 || index === 3;

  return (
    <Link
      to={buildSearchPath({ category: category.slug })}
      className={`store-categories-2026__category-card ${isFeature ? "is-featured" : ""}`}
      style={{ "--category-index": index % 6 }}
    >
      <span className="store-categories-2026__category-icon">
        <Icon size={24} />
      </span>
      <span className="store-categories-2026__category-copy">
        <strong>{category.name}</strong>
        <small>{category.description}</small>
        <em>{formatCount(category.productCount, t, isIndo)}</em>
      </span>
      {category.image ? (
        <span className="store-categories-2026__category-media" aria-hidden="true">
          <img src={category.image} alt="" loading="lazy" />
        </span>
      ) : null}
      <span className="store-categories-2026__round-arrow" aria-hidden="true">
        <ArrowRight size={17} />
      </span>
    </Link>
  );
}

export default function StoreCategoriesPage2026() {
  const { t, i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID" || i18n.language?.startsWith("id") || (typeof window !== "undefined" && localStorage.getItem("store_language") === "Indonesia");
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const categoriesQuery = useCategories({ parentsOnly: true });
  const productsQuery = useProducts({
    page: 1,
    limit: 24,
    sort: "popular",
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const liveCategories = useMemo(
    () => extractList(categoriesQuery.data).map((cat, idx) => normalizeCategory(cat, idx, isIndo)),
    [categoriesQuery.data, isIndo]
  );
  const categories = liveCategories.length
    ? liveCategories.slice(0, 12)
    : fallbackCategories.map((cat, idx) => normalizeCategory(cat, idx, isIndo));
  const products = useMemo(() => extractList(productsQuery.data), [productsQuery.data]);
  const topStores = useMemo(() => buildTopStores(products), [products]);
  const productImages = useMemo(
    () => products.map(normalizeProductImage).filter(Boolean).slice(0, 6),
    [products]
  );

  const submitSearch = (event) => {
    event.preventDefault();
    const keyword = searchValue.trim();
    if (!keyword) {
      navigate("/shop");
      return;
    }
    navigate(buildSearchPath({ q: keyword }));
  };

  const isInitialLoading = categoriesQuery.isLoading && !categoriesQuery.data;
  const showFallbackNotice =
    !isInitialLoading && !categoriesQuery.isError && liveCategories.length === 0;

  return (
    <div className="store-categories-2026">
      <section className="store-categories-2026__hero">
        <div className="store-categories-2026__hero-copy">
          <p className="store-categories-2026__eyebrow">
            <Tags size={17} />
            {t("categoriesPage.heroEyebrow", "Curated marketplace discovery")}
          </p>
          <h1>{t("categoriesPage.heroTitle", "Explore Categories")}</h1>
          <p>
            {t("categoriesPage.heroSubtitle", "Browse curated collections across the marketplace and jump into trusted product selections faster.")}
          </p>

          <form className="store-categories-2026__search" onSubmit={submitSearch}>
            <Search size={19} />
            <input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={t("categoriesPage.searchPlaceholder", "Search products, categories, or stores")}
              aria-label={t("categoriesPage.searchPlaceholder", "Search products, categories, or stores")}
            />
            <button type="submit">{t("categoriesPage.searchBtn", "Search")}</button>
          </form>

          <div className="store-categories-2026__value-chips" aria-label="Marketplace highlights">
            <span><Grid2X2 size={17} />{t("categoriesPage.chip1", "120+ Categories")}</span>
            <span><ShieldCheck size={17} />{t("categoriesPage.chip2", "Trusted Sellers")}</span>
            <span><Zap size={17} />{t("categoriesPage.chip3", "Fast Discovery")}</span>
          </div>

          <div className="store-categories-2026__hero-actions">
            <Link className="store-categories-2026__btn store-categories-2026__btn--primary" to="/shop">
              {t("categoriesPage.shopAllBtn", "Shop All Categories")} <ArrowRight size={18} />
            </Link>
            <Link className="store-categories-2026__btn store-categories-2026__btn--outline" to="/offers">
              {t("categoriesPage.viewTopOffersBtn", "View Top Offers")} <Tags size={18} />
            </Link>
          </div>
        </div>

        <div className="store-categories-2026__hero-visual" aria-hidden="true">
          <div className="store-categories-2026__visual-badge"><Headphones /></div>
          <div className="store-categories-2026__visual-card">
            {productImages[0] ? <img src={productImages[0]} alt="" /> : <PackageSearch />}
            <span />
            <span />
          </div>
          <div className="store-categories-2026__shopping-bags">
            <span />
            <span />
          </div>
          <div className="store-categories-2026__visual-product">
            {productImages[1] ? <img src={productImages[1]} alt="" /> : <ShoppingBag />}
          </div>
        </div>
      </section>

      <section className="store-categories-2026__filters" aria-label={t("categoriesPage.quickFilters", "Quick filters")}>
        <div className="store-categories-2026__filter-row">
          {quickFilters.map(({ label, icon: Icon, to }, index) => (
            <Link
              key={label}
              to={to}
              className={`store-categories-2026__filter-chip ${index === 0 ? "is-active" : ""}`}
            >
              <Icon size={17} />
              {translateText(label, isIndo)}
            </Link>
          ))}
          <Link className="store-categories-2026__view-link" to="/shop">
            {t("categoriesPage.viewAll", "View all")} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="store-categories-2026__popular-row">
          <strong>{t("categoriesPage.popularLabel", "Popular:")}</strong>
          {popularTerms.map(([label, Icon]) => (
            <Link key={label} to={buildSearchPath({ q: label })}>
              <Icon size={17} />
              {translateText(label, isIndo)}
            </Link>
          ))}
        </div>
      </section>

      <section className="store-categories-2026__section" aria-labelledby="category-grid-title">
        <div className="store-categories-2026__section-heading">
          <div>
            <h2 id="category-grid-title">{t("categoriesPage.shopByCategoryTitle", "Shop by Category")}</h2>
            <p>{t("categoriesPage.shopByCategorySubtitle", "Browse live public catalog categories from the marketplace API.")}</p>
          </div>
          <Link to="/shop">{t("categoriesPage.viewAll", "View all")} <ArrowRight size={16} /></Link>
        </div>

        {categoriesQuery.isError ? (
          <div className="store-categories-2026__notice store-categories-2026__notice--error">
            <div>
              <strong>{t("categoriesPage.categoriesNotLoadedTitle", "Categories could not be loaded")}</strong>
              <p>{categoriesQuery.error?.response?.data?.message || categoriesQuery.error?.message || t("categoriesPage.categoriesNotLoadedMsg", "Please try again in a moment.")}</p>
            </div>
            <button type="button" onClick={() => categoriesQuery.refetch()}>
              <RotateCcw size={16} />
              {t("categoriesPage.retryBtn", "Retry")}
            </button>
          </div>
        ) : null}

        {showFallbackNotice ? (
          <div className="store-categories-2026__notice">
            <strong>{t("categoriesPage.liveNotPublishedTitle", "Live categories are not published yet.")}</strong>
            <p>{t("categoriesPage.liveNotPublishedMsg", "Showing guided discovery cards while public categories become available.")}</p>
          </div>
        ) : null}

        {isInitialLoading ? (
          <CategorySkeletonGrid t={t} isIndo={isIndo} />
        ) : (
          <div className="store-categories-2026__grid">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id || category.slug || category.name}
                category={category}
                index={index}
                t={t}
                isIndo={isIndo}
              />
            ))}
          </div>
        )}
      </section>

      <section className="store-categories-2026__section" aria-labelledby="featured-collections-title">
        <div className="store-categories-2026__section-heading">
          <div>
            <h2 id="featured-collections-title">{t("categoriesPage.featuredCollectionsTitle", "Featured Collections")}</h2>
            <p>{t("categoriesPage.featuredCollectionsSubtitle", "Useful product paths for shoppers who know the moment, not the exact item.")}</p>
          </div>
          <Link to="/shop">{t("categoriesPage.viewAllCollections", "View all collections")} <ArrowRight size={16} /></Link>
        </div>
        <div className="store-categories-2026__collection-grid">
          {featuredCollections.map(({ title, query, description, icon: Icon }, index) => (
            <Link key={title} to={buildSearchPath({ q: query })} className="store-categories-2026__collection-card">
              <span>
                <strong>{translateText(title, isIndo)}</strong>
                <small>{translateText(description, isIndo)}</small>
                <em>{t("categoriesPage.shopCollections", "Shop collections")} <ArrowRight size={15} /></em>
              </span>
              <i aria-hidden="true">
                {productImages[index + 2] ? <img src={productImages[index + 2]} alt="" /> : <Icon />}
              </i>
            </Link>
          ))}
        </div>
      </section>

      <section className="store-categories-2026__section" aria-labelledby="top-stores-title">
        <div className="store-categories-2026__section-heading">
          <div>
            <h2 id="top-stores-title">{t("categoriesPage.topStoresTitle", "Top Stores in This Category")}</h2>
            <p>{t("categoriesPage.topStoresSubtitle", "Derived from popular public products when seller metadata is available.")}</p>
          </div>
          <Link to="/shop">{t("categoriesPage.viewAllStores", "View all stores")} <ArrowRight size={16} /></Link>
        </div>

        {productsQuery.isError ? (
          <div className="store-categories-2026__notice store-categories-2026__notice--error">
            <div>
              <strong>{t("categoriesPage.storeSignalsNotLoadedTitle", "Store signals could not be loaded")}</strong>
              <p>{productsQuery.error?.response?.data?.message || productsQuery.error?.message || t("categoriesPage.storeSignalsNotLoadedMsg", "Popular product data is temporarily unavailable.")}</p>
            </div>
            <button type="button" onClick={() => productsQuery.refetch()}>
              <RotateCcw size={16} />
              {t("categoriesPage.retryBtn", "Retry")}
            </button>
          </div>
        ) : null}

        {productsQuery.isLoading && !productsQuery.data ? (
          <div className="store-categories-2026__store-grid">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="store-categories-2026__store-card is-loading" key={`store-loading-${index}`} />
            ))}
          </div>
        ) : topStores.length ? (
          <div className="store-categories-2026__store-grid">
            {topStores.map((storeItem) => {
              const content = (
                <>
                  <span className="store-categories-2026__store-avatar">
                    {storeItem.image ? <img src={storeItem.image} alt="" /> : <Store size={22} />}
                  </span>
                  <span>
                    <strong>{storeItem.name}</strong>
                    <small><BadgeCheck size={14} /> {t("categoriesPage.verified", "Verified")}</small>
                    <em>{storeItem.rating.toFixed(1)} <Star size={13} /> ({t("categoriesPage.storeProductsCount", "{{count}} products", { count: storeItem.products })})</em>
                  </span>
                  <ArrowRight size={17} />
                </>
              );

              return storeItem.slug ? (
                <Link
                  key={storeItem.slug}
                  className="store-categories-2026__store-card"
                  to={`/store/${encodeURIComponent(storeItem.slug)}`}
                >
                  {content}
                </Link>
              ) : (
                <Link
                  key={storeItem.name}
                  className="store-categories-2026__store-card"
                  to="/shop"
                >
                  {content}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="store-categories-2026__notice">
            <strong>{t("categoriesPage.topStoresEmptyTitle", "Top stores will appear here soon.")}</strong>
            <p>{t("categoriesPage.topStoresEmptyMsg", "Popular products need store metadata before this block can rank stores.")}</p>
            <Link to="/shop">{t("categoriesPage.browseProductsBtn", "Browse products")} <ArrowRight size={16} /></Link>
          </div>
        )}
      </section>
    </div>
  );
}
