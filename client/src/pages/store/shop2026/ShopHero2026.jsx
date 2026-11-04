import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Award,
  CheckCircle2,
  GraduationCap,
  Search,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";
import { fetchStoreProducts } from "../../../api/storeProducts.ts";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

const DEFAULT_POPULAR_FALLBACK = [
  "Dapoer D'Sayang",
  "White Florist",
  "Picturestic",
  "Reparasi Kursi",
  "Kreasi Singkong",
];

export default function ShopHero2026({ query, onSearch, shopConfig }) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID";
  const [draft, setDraft] = useState(query || "");

  useEffect(() => {
    setDraft(query || "");
  }, [query]);

  // If explicitly disabled by admin, return null
  if (shopConfig && shopConfig.enabled === false) {
    return null;
  }

  // Fetch real popular products from DB
  const { data: popularProductsData } = useQuery({
    queryKey: ["storefront", "shop-hero-popular-products"],
    queryFn: () => fetchStoreProducts({ limit: 10, sort: "featured" }),
    staleTime: 5 * 60 * 1000,
  });

  // Resolve popular search tags
  const popularSearches = useMemo(() => {
    // 1. If admin configured custom popular searches in shop customization tab
    if (shopConfig?.popularSearches && typeof shopConfig.popularSearches === "string") {
      const customItems = shopConfig.popularSearches
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (customItems.length > 0) {
        return customItems.slice(0, 6);
      }
    }

    // 2. Real products from database query
    const items =
      popularProductsData?.data?.items ||
      popularProductsData?.items ||
      popularProductsData?.data ||
      [];
    if (Array.isArray(items) && items.length > 0) {
      const names = items
        .map((product) => String(product?.name || product?.title || "").trim())
        .filter(Boolean);
      const uniqueNames = Array.from(new Set(names));
      if (uniqueNames.length > 0) {
        return uniqueNames.slice(0, 5);
      }
    }

    // 3. Fallback to real TP Preneurs top products
    return DEFAULT_POPULAR_FALLBACK;
  }, [shopConfig?.popularSearches, popularProductsData]);

  // Resolve copy text with concise bilingual fallbacks
  const eyebrow =
    shopConfig?.eyebrow?.trim() ||
    (isIndo ? "Katalog Edupreneur Kampus" : "Campus Edupreneur Collection");

  const title =
    shopConfig?.title?.trim() ||
    (isIndo ? "Katalog Produk & Karya Inovasi," : "Explore Curated Works,");

  const titleAccent =
    shopConfig?.titleAccent?.trim() ||
    (isIndo ? "Edupreneur Kampus" : "From Campus Edupreneurs");

  const description =
    shopConfig?.description?.trim() ||
    (isIndo
      ? "Temukan media belajar digital, buku, dan produk kreatif unggulan karya mahasiswa."
      : "Discover student innovations, digital learning media, and curated campus creative works.");

  const searchPlaceholder =
    shopConfig?.searchPlaceholder?.trim() ||
    (isIndo
      ? "Cari produk, kategori, atau karya mahasiswa..."
      : "Search digital products, innovation works & books...");

  const bannerImage = resolveAssetUrl(shopConfig?.imageDataUrl || "");

  const submit = (event) => {
    event?.preventDefault();
    onSearch(draft.trim());
  };

  const handleSelectSearch = (term) => {
    setDraft(term);
    onSearch(term);
  };

  const handleClear = () => {
    setDraft("");
    onSearch("");
  };

  return (
    <section className="tp-shop-hero" aria-labelledby="tp-shop-title">
      <div className="tp-shop-hero__copy">
        <div className="tp-shop-hero__eyebrow-wrap">
          <span className="tp-shop-hero__eyebrow-dot" />
          <p className="tp-shop-hero__eyebrow">{eyebrow}</p>
        </div>

        <h1 id="tp-shop-title">
          {title}{" "}
          <span className="tp-shop-hero__accent-text">{titleAccent}</span>
        </h1>

        <p className="tp-shop-hero__subtext">{description}</p>

        <form className="tp-shop-hero__search" onSubmit={submit} role="search">
          <Search className="tp-shop-hero__search-icon" aria-hidden="true" />
          <label className="sr-only" htmlFor="tp-shop-hero-search">
            {searchPlaceholder}
          </label>
          <input
            id="tp-shop-hero-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={searchPlaceholder}
            autoComplete="off"
            style={{ backgroundColor: "transparent" }}
          />
          {draft ? (
            <button
              type="button"
              className="tp-shop-hero__clear"
              onClick={handleClear}
              aria-label={isIndo ? "Hapus pencarian" : "Clear search"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button type="submit" className="tp-shop-btn tp-shop-hero__search-btn">
            <Search className="w-4 h-4" aria-hidden="true" />
            <span>{isIndo ? "Cari" : "Search"}</span>
          </button>
        </form>

        <div className="tp-shop-hero__popular" aria-label="Popular searches">
          <span className="tp-shop-hero__popular-label">
            <Sparkles className="w-3.5 h-3.5 text-[#fe6f05]" />
            {isIndo ? "Pencarian populer:" : "Popular searches:"}
          </span>
          <div className="tp-shop-hero__popular-tags">
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="tp-shop-hero__popular-pill"
                onClick={() => handleSelectSearch(term)}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bannerImage ? (
        <div className="tp-shop-hero__banner-showcase">
          <div className="tp-shop-hero__banner-frame">
            <img
              src={bannerImage}
              alt={title}
              className="tp-shop-hero__banner-img"
            />
            <div className="tp-shop-hero__banner-overlay">
              <span className="tp-shop-hero__banner-badge">
                <Sparkles className="w-3 h-3 text-[#fe6f05]" />
                TP Preneurs Hub
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="tp-shop-showcase" aria-hidden="true">
          <div className="tp-shop-showcase__glow" />
          <div className="tp-shop-showcase__dots" />
          <div className="tp-shop-showcase__arc" />

          {/* Edupreneur Central Hub Card */}
          <div className="tp-shop-showcase__hub-card">
            <div className="tp-shop-showcase__hub-icon-wrap">
              <GraduationCap className="tp-shop-showcase__hub-icon" />
            </div>
            <p className="tp-shop-showcase__hub-name">TP PRENEURS</p>
            <span className="tp-shop-showcase__hub-tag">
              <Sparkles className="w-3 h-3 text-[#fe6f05]" />
              {isIndo ? "Inovasi Kampus" : "Campus Innovation"}
            </span>
          </div>

          {/* Floating Feature Badges */}
          <div className="tp-shop-showcase__float tp-shop-showcase__float--quality">
            <Award className="w-4 h-4 text-[#fe6f05]" />
            <small>{isIndo ? "Karya Terverifikasi" : "Verified Quality"}</small>
          </div>

          <div className="tp-shop-showcase__float tp-shop-showcase__float--student">
            <CheckCircle2 className="w-4 h-4 text-[#00c274]" />
            <small>{isIndo ? "100% Produk Kampus" : "Student Works"}</small>
          </div>

          <div className="tp-shop-showcase__float tp-shop-showcase__float--products">
            <ShoppingBag className="w-4 h-4 text-[#38bdf8]" />
            <small>{isIndo ? "Kreatif & Inovatif" : "Creative & Innovative"}</small>
          </div>
        </div>
      )}
    </section>
  );
}
