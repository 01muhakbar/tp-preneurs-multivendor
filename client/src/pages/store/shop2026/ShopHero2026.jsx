import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { fetchStoreProducts } from "../../../api/storeProducts.ts";

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

  if (shopConfig && shopConfig.enabled === false) {
    return null;
  }

  // Fetch real popular products from DB for chips
  const { data: popularProductsData } = useQuery({
    queryKey: ["storefront", "shop-hero-popular-products"],
    queryFn: () => fetchStoreProducts({ limit: 8, sort: "top_sales" }),
    staleTime: 5 * 60 * 1000,
  });

  const popularSearches = useMemo(() => {
    if (shopConfig?.popularSearches && typeof shopConfig.popularSearches === "string") {
      const customItems = shopConfig.popularSearches
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (customItems.length > 0) return customItems.slice(0, 6);
    }

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
      if (uniqueNames.length > 0) return uniqueNames.slice(0, 5);
    }

    return DEFAULT_POPULAR_FALLBACK;
  }, [shopConfig?.popularSearches, popularProductsData]);

  const searchPlaceholder =
    shopConfig?.searchPlaceholder?.trim() ||
    (isIndo
      ? "Cari produk digital, karya inovasi & buku..."
      : "Search digital products, innovation works & books...");

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
    <div className="tp-shop-search-header">
      {/* Optional Banner Hero Header when title or eyebrow or image is configured */}
      {shopConfig && (shopConfig.title || shopConfig.eyebrow || shopConfig.imageDataUrl) ? (
        <div className="tp-shop-hero-banner-inner mb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            {shopConfig.eyebrow ? (
              <span className="inline-block rounded-full bg-[#fe6f05]/15 border border-[#fe6f05]/30 px-2.5 py-0.5 text-[10px] font-bold text-orange-400 uppercase tracking-wider">
                {shopConfig.eyebrow}
              </span>
            ) : null}
            {shopConfig.title ? (
              <h1 className="text-base sm:text-xl font-black text-white tracking-tight">
                {shopConfig.title}{" "}
                {shopConfig.titleAccent ? (
                  <span className="text-[#fe6f05]">{shopConfig.titleAccent}</span>
                ) : null}
              </h1>
            ) : null}
            {shopConfig.description ? (
              <p className="text-xs text-slate-300 max-w-xl line-clamp-2">
                {shopConfig.description}
              </p>
            ) : null}
          </div>
          {shopConfig.imageDataUrl ? (
            <div className="h-16 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 hidden sm:block">
              <img
                src={shopConfig.imageDataUrl}
                alt={shopConfig.title || "Shop header banner"}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <form className="tp-shop-search-box" onSubmit={submit} role="search">
        <Search className="tp-shop-search-box__icon" aria-hidden="true" />
        <label className="sr-only" htmlFor="tp-shop-search-input">
          {searchPlaceholder}
        </label>
        <input
          id="tp-shop-search-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={searchPlaceholder}
          autoComplete="off"
        />
        {draft ? (
          <button
            type="button"
            className="tp-shop-search-box__clear"
            onClick={handleClear}
            aria-label={isIndo ? "Hapus pencarian" : "Clear search"}
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
        <button type="submit" className="tp-shop-search-box__btn">
          <Search className="w-4 h-4" aria-hidden="true" />
          <span>{isIndo ? "Cari" : "Search"}</span>
        </button>
      </form>

      {/* Quick popular chips */}
      <div className="tp-shop-search-chips tp-shop-scrollbar-hidden" aria-label="Popular searches">
        <span className="tp-shop-chip-label">
          <Sparkles className="w-3.5 h-3.5 text-[#fe6f05]" />
          <span>{isIndo ? "Populer:" : "Popular:"}</span>
        </span>
        <button
          type="button"
          className="tp-shop-chip tp-shop-chip--instant"
          onClick={() => handleSelectSearch("Singkong")}
        >
          <Zap className="w-3 h-3 text-[#fe6f05]" />
          <span>{isIndo ? "Siap Kirim" : "Fast Delivery"}</span>
        </button>
        {popularSearches.map((term) => (
          <button
            key={term}
            type="button"
            className={`tp-shop-chip ${query === term ? "is-active" : ""}`}
            onClick={() => handleSelectSearch(term)}
          >
            {term}
          </button>
        ))}
      </div>
    </div>
  );
}
