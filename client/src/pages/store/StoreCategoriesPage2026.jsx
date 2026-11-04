import {
  ArrowRight,
  BadgeCheck,
  BadgeDollarSign,
  BookOpen,
  BriefcaseBusiness,
  Flame,
  Gem,
  Grid2X2,
  MapPin,
  Package,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Star,
  Store,
  Tags,
  UtensilsCrossed,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useCategories, useProducts } from "../../storefront.jsx";
import "./store-categories-2026.css";

const REAL_FALLBACK_CATEGORIES = [
  {
    name: "Makanan dan Minuman",
    nameEn: "Food & Beverage",
    slug: "makanan-dan-minuman",
    descId: "Kuliner lezat, kudapan, dan minuman inovatif karya edupreneur.",
    descEn: "Delicious culinary delights, snacks, and innovative beverages.",
    icon: UtensilsCrossed,
  },
  {
    name: "Kerajinan dan Kreatif",
    nameEn: "Crafts & Creative",
    slug: "kerajinan-dan-kreatif",
    descId: "Produk kriya, cinderamata, dan karya seni kreatif mahasiswa.",
    descEn: "Handicrafts, souvenirs, and creative student art pieces.",
    icon: Sparkles,
  },
  {
    name: "Jasa",
    nameEn: "Services",
    slug: "jasa",
    descId: "Layanan profesional, percetakan, dan jasa kreatif kampus.",
    descEn: "Professional services, printing, and campus creative solutions.",
    icon: BriefcaseBusiness,
  },
  {
    name: "Buku",
    nameEn: "Books",
    slug: "buku",
    descId: "Buku ajar, karya ilmiah, modul, dan referensi literasi.",
    descEn: "Textbooks, scientific works, modules, and literacy references.",
    icon: BookOpen,
  },
];

const REAL_CATEGORY_METAS = {
  "makanan dan minuman": {
    nameEn: "Food & Beverage",
    descId: "Kuliner lezat, kudapan, dan aneka minuman karya edupreneur.",
    descEn: "Delicious culinary delights, snacks, and edupreneur beverages.",
    icon: UtensilsCrossed,
  },
  "makanan & minuman": {
    nameEn: "Food & Beverage",
    descId: "Kuliner lezat, kudapan, dan aneka minuman karya edupreneur.",
    descEn: "Delicious culinary delights, snacks, and edupreneur beverages.",
    icon: UtensilsCrossed,
  },
  "kerajinan dan kreatif": {
    nameEn: "Crafts & Creative Works",
    descId: "Kriya eksklusif, cinderamata, dan karya seni mahasiswa.",
    descEn: "Exclusive handicrafts, souvenirs, and student creative works.",
    icon: Sparkles,
  },
  "kerajinan & kreatif": {
    nameEn: "Crafts & Creative Works",
    descId: "Kriya eksklusif, cinderamata, dan karya seni mahasiswa.",
    descEn: "Exclusive handicrafts, souvenirs, and student creative works.",
    icon: Sparkles,
  },
  "jasa": {
    nameEn: "Professional Services",
    descId: "Layanan profesional, jasa kreatif, dan keahlian kampus.",
    descEn: "Professional services, creative works, and campus expertise.",
    icon: BriefcaseBusiness,
  },
  "buku": {
    nameEn: "Books & Literature",
    descId: "Buku ajar, karya ilmiah, modul belajar, dan karya literasi.",
    descEn: "Textbooks, academic works, study modules, and literature.",
    icon: BookOpen,
  },
};

const quickFilters = [
  { labelId: "Semua", labelEn: "All", icon: Grid2X2, to: "/shop" },
  { labelId: "Tren Populer", labelEn: "Trending", icon: Flame, to: "/search?sort=popular&page=1" },
  { labelId: "Produk Baru", labelEn: "New Arrivals", icon: Sparkles, to: "/search?sort=newest&page=1" },
  { labelId: "Harga Hemat", labelEn: "Budget Friendly", icon: BadgeDollarSign, to: "/search?maxPrice=100000&page=1" },
  { labelId: "Karya Unggulan", labelEn: "Featured", icon: Gem, to: "/search?minPrice=1000000&page=1" },
  { labelId: "Karya Lokal", labelEn: "Local Campus", icon: MapPin, to: "/search?q=lokal&page=1" },
  { labelId: "Rating Tertinggi", labelEn: "Top Rated", icon: Star, to: "/search?minRating=4&page=1" },
];

const popularTerms = [
  { id: "Kuliner", en: "Culinary" },
  { id: "Kue & Snack", en: "Snacks" },
  { id: "Kriya", en: "Handicrafts" },
  { id: "Jasa Desain", en: "Design Services" },
  { id: "Buku Ajar", en: "Textbooks" },
  { id: "Merchandise", en: "Merchandise" },
];

const featuredCollections = [
  {
    titleId: "Kuliner & Kudapan Edupreneur",
    titleEn: "Campus Culinary & Snacks",
    query: "makanan",
    descId: "Aneka rasa hidangan dan cemilan karya mahasiswa.",
    descEn: "Delicious meals and snacks crafted by student entrepreneurs.",
    icon: ShoppingBasket,
  },
  {
    titleId: "Kriya & Cinderamata",
    titleEn: "Crafts & Memorabilia",
    query: "kerajinan",
    descId: "Karya seni unik dan cinderamata beridentitas kampus.",
    descEn: "Unique handcrafted items and campus souvenirs.",
    icon: Sparkles,
  },
  {
    titleId: "Pustaka & Referensi Ilmiah",
    titleEn: "Books & Academic References",
    query: "buku",
    descId: "Buku kurikulum, referensi keilmuan, dan jurnal.",
    descEn: "Curriculum books, academic references, and journals.",
    icon: BookOpen,
  },
];

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

const normalizeCategory = (category, index, isIndo, productCountFallback = 0) => {
  const rawName = toText(
    category?.name || category?.title || category?.label || category?.categoryName,
    ""
  );
  const normalizedKey = rawName.toLowerCase();
  const meta = REAL_CATEGORY_METAS[normalizedKey] || null;

  let displayName = rawName;
  if (!displayName) {
    const fallback = REAL_FALLBACK_CATEGORIES[index % REAL_FALLBACK_CATEGORIES.length];
    displayName = isIndo ? fallback.name : fallback.nameEn;
  } else if (!isIndo && meta?.nameEn) {
    displayName = meta.nameEn;
  }

  const slug = toText(category?.slug || category?.code || category?.id, toSlug(displayName));

  let description = toText(category?.description || category?.shortDescription || category?.summary, "");
  if (!description) {
    if (meta) {
      description = isIndo ? meta.descId : meta.descEn;
    } else {
      const fallback = REAL_FALLBACK_CATEGORIES[index % REAL_FALLBACK_CATEGORIES.length];
      description = isIndo ? fallback.descId : fallback.descEn;
    }
  }

  const Icon = meta?.icon || (index % 4 === 0 ? UtensilsCrossed : index % 4 === 1 ? Sparkles : index % 4 === 2 ? BriefcaseBusiness : BookOpen);

  const productCount =
    category?.productCount ??
    category?.productsCount ??
    category?.totalProducts ??
    category?.count ??
    category?.products_count ??
    productCountFallback;

  return {
    ...category,
    id: category?.id ?? category?._id ?? slug,
    name: displayName,
    slug,
    description,
    image: resolveAssetUrl(toText(category?.image || category?.imageUrl || category?.iconUrl)),
    Icon,
    productCount,
  };
};

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

function CategoryCard({ category, index, isIndo }) {
  const Icon = category.Icon;
  const isFeature = index === 0;

  return (
    <Link
      to={buildSearchPath({ category: category.slug })}
      className={`store-categories-2026__category-card ${isFeature ? "is-featured" : ""}`}
    >
      <div className="store-categories-2026__category-card-top">
        <span className="store-categories-2026__category-icon" aria-hidden="true">
          <Icon size={24} />
        </span>
        <span className="store-categories-2026__category-count-badge">
          {category.productCount > 0
            ? `${category.productCount} ${isIndo ? "Produk" : "Products"}`
            : (isIndo ? "Lihat Produk" : "Browse Items")}
        </span>
      </div>

      <div className="store-categories-2026__category-copy">
        <strong className="store-categories-2026__category-name">{category.name}</strong>
        <p className="store-categories-2026__category-desc">{category.description}</p>
      </div>

      <div className="store-categories-2026__category-footer">
        <span className="store-categories-2026__explore-text">
          {isIndo ? "Jelajahi Produk" : "Explore Products"}
        </span>
        <span className="store-categories-2026__round-arrow" aria-hidden="true">
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}

export default function StoreCategoriesPage2026() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [, setLangSyncCounter] = useState(0);

  const isIndo =
    i18n.language === "id" ||
    i18n.language === "id-ID" ||
    i18n.language?.startsWith("id") ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("store_language") === "Indonesia" ||
        localStorage.getItem("store_language") === "Bahasa Indonesia"));
  const lang = isIndo ? "id" : "en";

  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

  const [searchValue, setSearchValue] = useState("");

  const customizationQuery = useQuery({
    queryKey: ["store-customization", "categories", lang],
    queryFn: () => getStoreCustomization({ lang, include: "categories" }),
    staleTime: 60_000,
  });

  const categoriesConfig = customizationQuery.data?.customization?.categories;

  const categoriesQuery = useCategories({ parentsOnly: true });
  const productsQuery = useProducts({
    page: 1,
    limit: 30,
    sort: "popular",
    keepPreviousData: true,
    staleTime: 60_000,
  });

  const products = useMemo(() => extractList(productsQuery.data), [productsQuery.data]);

  const rawCategories = useMemo(() => extractList(categoriesQuery.data), [categoriesQuery.data]);

  // Compute product count per category slug from fetched products
  const categoryCountMap = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      const catSlug = toSlug(p?.category?.slug || p?.category?.name || p?.categoryName || "");
      if (catSlug) {
        map.set(catSlug, (map.get(catSlug) || 0) + 1);
      }
    });
    return map;
  }, [products]);

  const liveCategories = useMemo(() => {
    if (!rawCategories.length) return [];
    return rawCategories.map((cat, idx) => {
      const count = categoryCountMap.get(toSlug(cat?.slug || cat?.name || "")) || 0;
      return normalizeCategory(cat, idx, isIndo, count);
    });
  }, [rawCategories, categoryCountMap, isIndo]);

  const categories = useMemo(() => {
    if (liveCategories.length) return liveCategories;
    return REAL_FALLBACK_CATEGORIES.map((cat, idx) => normalizeCategory(cat, idx, isIndo, 0));
  }, [liveCategories, isIndo]);

  const topStores = useMemo(() => buildTopStores(products), [products]);

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

  // Customization variables with localized fallbacks
  const heroEnabled = categoriesConfig?.hero?.enabled ?? true;
  const heroEyebrow = categoriesConfig?.hero?.eyebrow || (isIndo ? "JELAJAHI KATALOG" : "CURATED DISCOVERY");
  const heroTitle = categoriesConfig?.hero?.title || (isIndo ? "Kategori Produk" : "Explore Categories");
  const heroSubtitle =
    categoriesConfig?.hero?.subtitle ||
    (isIndo
      ? "Temukan ragam karya inovasi, produk edupreneur, dan solusi kreatif kampus."
      : "Browse curated collections across campus innovations and trusted edupreneur products.");
  const searchPlaceholder =
    categoriesConfig?.hero?.searchPlaceholder ||
    (isIndo ? "Cari produk, kategori, atau toko..." : "Search products, categories, or stores...");
  const chip1 = categoriesConfig?.hero?.chip1 || (isIndo ? "Kategori Terverifikasi" : "Verified Categories");
  const chip2 = categoriesConfig?.hero?.chip2 || (isIndo ? "Penjual Terpercaya" : "Trusted Sellers");
  const chip3 = categoriesConfig?.hero?.chip3 || (isIndo ? "Akses Cepat" : "Instant Access");
  const primaryButtonLabel = categoriesConfig?.hero?.primaryButtonLabel || (isIndo ? "Semua Kategori" : "Shop All Categories");
  const primaryButtonLink = categoriesConfig?.hero?.primaryButtonLink || "/shop";
  const secondaryButtonLabel = categoriesConfig?.hero?.secondaryButtonLabel || (isIndo ? "Penawaran Terbaik" : "View Top Offers");
  const secondaryButtonLink = categoriesConfig?.hero?.secondaryButtonLink || "/offers";
  const heroImageDataUrl = categoriesConfig?.hero?.heroImageDataUrl || "";

  const shopByCategoryTitle =
    categoriesConfig?.sections?.shopByCategoryTitle ||
    (isIndo ? "Pilihan Berdasarkan Kategori" : "Shop by Category");
  const shopByCategorySubtitle =
    categoriesConfig?.sections?.shopByCategorySubtitle ||
    (isIndo
      ? "Pilihan produk berdasarkan rumpun karya dan inovasi kampus."
      : "Curated products organized by campus innovation categories.");

  const featuredCollectionsTitle =
    categoriesConfig?.sections?.featuredCollectionsTitle ||
    (isIndo ? "Koleksi Unggulan" : "Featured Collections");
  const featuredCollectionsSubtitle =
    categoriesConfig?.sections?.featuredCollectionsSubtitle ||
    (isIndo
      ? "Pilihan kurasi produk untuk momen dan kebutuhan terbaik Anda."
      : "Curated selections for your moments and essential needs.");

  const topStoresTitle =
    categoriesConfig?.sections?.topStoresTitle ||
    (isIndo ? "Toko & Penjual Terverifikasi" : "Top Verified Stores");
  const topStoresSubtitle =
    categoriesConfig?.sections?.topStoresSubtitle ||
    (isIndo
      ? "Daftar toko edupreneur kampus dengan reputasi dan produk terpercaya."
      : "Trusted campus edupreneurs with verified ratings and quality works.");

  return (
    <div className="store-categories-2026">
      {heroEnabled ? (
        <section className="store-categories-2026__hero">
          <div className="store-categories-2026__hero-copy">
            <p className="store-categories-2026__eyebrow">
              <Tags size={16} />
              {heroEyebrow}
            </p>
            <h1>{heroTitle}</h1>
            <p className="store-categories-2026__hero-subtitle">{heroSubtitle}</p>

            <form className="store-categories-2026__search" onSubmit={submitSearch}>
              <Search size={18} />
              <input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
              />
              <button type="submit">{isIndo ? "Cari" : "Search"}</button>
            </form>

            <div className="store-categories-2026__value-chips" aria-label="Marketplace highlights">
              <span>
                <Grid2X2 size={16} />
                {chip1}
              </span>
              <span>
                <ShieldCheck size={16} />
                {chip2}
              </span>
              <span>
                <Zap size={16} />
                {chip3}
              </span>
            </div>

            <div className="store-categories-2026__hero-actions">
              <Link className="store-categories-2026__btn store-categories-2026__btn--primary" to={primaryButtonLink}>
                {primaryButtonLabel} <ArrowRight size={17} />
              </Link>
              <Link className="store-categories-2026__btn store-categories-2026__btn--outline" to={secondaryButtonLink}>
                {secondaryButtonLabel} <Tags size={17} />
              </Link>
            </div>
          </div>

          <div className="store-categories-2026__hero-visual" aria-hidden="true">
            {heroImageDataUrl ? (
              <img
                src={resolveAssetUrl(heroImageDataUrl)}
                alt="Categories Hero"
                className="store-categories-2026__hero-custom-img"
              />
            ) : (
              <div className="store-categories-2026__showcase-card">
                <div className="store-categories-2026__showcase-header">
                  <div className="store-categories-2026__showcase-badge">
                    <BadgeCheck size={18} />
                    <span>TP-Preneurs Catalog</span>
                  </div>
                  <span className="store-categories-2026__showcase-pill">100% Real</span>
                </div>

                <div className="store-categories-2026__showcase-list">
                  {categories.slice(0, 4).map((cat, idx) => {
                    const CatIcon = cat.Icon;
                    return (
                      <div key={cat.slug || idx} className="store-categories-2026__showcase-row">
                        <span className="store-categories-2026__showcase-icon">
                          <CatIcon size={16} />
                        </span>
                        <div className="store-categories-2026__showcase-info">
                          <strong>{cat.name}</strong>
                          <small>{cat.description}</small>
                        </div>
                        <ArrowRight size={14} className="store-categories-2026__showcase-arrow" />
                      </div>
                    );
                  })}
                </div>

                <div className="store-categories-2026__showcase-footer">
                  <Package size={14} />
                  <span>{isIndo ? "Karya Inovatif & Edupreneur Kampus" : "Innovative Campus & Edupreneur Works"}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      ) : null}

      <section className="store-categories-2026__filters" aria-label={isIndo ? "Filter Cepat" : "Quick filters"}>
        <div className="store-categories-2026__filter-row">
          {quickFilters.map(({ labelId, labelEn, icon: Icon, to }, index) => (
            <Link
              key={labelEn}
              to={to}
              className={`store-categories-2026__filter-chip ${index === 0 ? "is-active" : ""}`}
            >
              <Icon size={16} />
              {isIndo ? labelId : labelEn}
            </Link>
          ))}
          <Link className="store-categories-2026__view-link" to="/shop">
            {isIndo ? "Lihat Semua" : "View all"} <ArrowRight size={15} />
          </Link>
        </div>

        <div className="store-categories-2026__popular-row">
          <strong>{isIndo ? "Pencarian Populer:" : "Popular Searches:"}</strong>
          {popularTerms.map((term) => (
            <Link key={term.en} to={buildSearchPath({ q: isIndo ? term.id : term.en })}>
              {isIndo ? term.id : term.en}
            </Link>
          ))}
        </div>
      </section>

      <section className="store-categories-2026__section" aria-labelledby="category-grid-title">
        <div className="store-categories-2026__section-heading">
          <div>
            <h2 id="category-grid-title">{shopByCategoryTitle}</h2>
            <p>{shopByCategorySubtitle}</p>
          </div>
          <Link to="/shop">
            {isIndo ? "Lihat Semua" : "View all"} <ArrowRight size={15} />
          </Link>
        </div>

        {categoriesQuery.isError ? (
          <div className="store-categories-2026__notice store-categories-2026__notice--error">
            <div>
              <strong>{isIndo ? "Gagal memuat kategori" : "Categories could not be loaded"}</strong>
              <p>
                {categoriesQuery.error?.response?.data?.message ||
                  categoriesQuery.error?.message ||
                  (isIndo ? "Silakan coba beberapa saat lagi." : "Please try again in a moment.")}
              </p>
            </div>
            <button type="button" onClick={() => categoriesQuery.refetch()}>
              <RotateCcw size={15} />
              {isIndo ? "Coba Lagi" : "Retry"}
            </button>
          </div>
        ) : null}

        {isInitialLoading ? (
          <div className="store-categories-2026__grid">
            {Array.from({ length: 4 }, (_, idx) => (
              <div key={`cat-skel-${idx}`} className="store-categories-2026__skeleton-card" />
            ))}
          </div>
        ) : (
          <div className="store-categories-2026__grid">
            {categories.map((category, index) => (
              <CategoryCard
                key={category.id || category.slug || category.name}
                category={category}
                index={index}
                isIndo={isIndo}
              />
            ))}
          </div>
        )}
      </section>

      <section className="store-categories-2026__section" aria-labelledby="featured-collections-title">
        <div className="store-categories-2026__section-heading">
          <div>
            <h2 id="featured-collections-title">{featuredCollectionsTitle}</h2>
            <p>{featuredCollectionsSubtitle}</p>
          </div>
          <Link to="/shop">
            {isIndo ? "Lihat Semua Koleksi" : "View all collections"} <ArrowRight size={15} />
          </Link>
        </div>
        <div className="store-categories-2026__collection-grid">
          {featuredCollections.map(({ titleId, titleEn, query, descId, descEn, icon: Icon }) => (
            <Link key={titleEn} to={buildSearchPath({ q: query })} className="store-categories-2026__collection-card">
              <span className="store-categories-2026__collection-copy">
                <strong>{isIndo ? titleId : titleEn}</strong>
                <small>{isIndo ? descId : descEn}</small>
                <em>
                  {isIndo ? "Buka Koleksi" : "Shop Collection"} <ArrowRight size={14} />
                </em>
              </span>
              <span className="store-categories-2026__collection-icon" aria-hidden="true">
                <Icon size={28} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="store-categories-2026__section" aria-labelledby="top-stores-title">
        <div className="store-categories-2026__section-heading">
          <div>
            <h2 id="top-stores-title">{topStoresTitle}</h2>
            <p>{topStoresSubtitle}</p>
          </div>
          <Link to="/shop">
            {isIndo ? "Lihat Semua Toko" : "View all stores"} <ArrowRight size={15} />
          </Link>
        </div>

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
                  <div className="store-categories-2026__store-info">
                    <strong>{storeItem.name}</strong>
                    <small>
                      <BadgeCheck size={14} /> {isIndo ? "Terverifikasi" : "Verified"}
                    </small>
                    <em>
                      {storeItem.rating.toFixed(1)} <Star size={13} /> · {storeItem.products} {isIndo ? "Produk" : "Products"}
                    </em>
                  </div>
                  <ArrowRight size={16} className="store-categories-2026__store-arrow" />
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
            <strong>{isIndo ? "Daftar toko edupreneur segera hadir" : "Top stores will appear here soon."}</strong>
            <p>
              {isIndo
                ? "Jelajahi berbagai produk pilihan di marketplace TP-Preneurs."
                : "Browse curated products across the TP-Preneurs marketplace."}
            </p>
            <Link to="/shop" className="store-categories-2026__link-inline">
              {isIndo ? "Mulai Belanja" : "Browse products"} <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
