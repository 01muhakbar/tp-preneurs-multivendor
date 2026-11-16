import {
  ArrowDownUp,
  ChevronDown,
  ChevronUp,
  Filter,
  Grid2X2,
  List,
  Loader2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

export const SHOP_SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "top_sales", label: "Top Sales" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "highest_rated", label: "Highest Rated" },
];

export default function ShopToolbar2026({
  viewMode,
  onViewModeChange,
  total,
  displayStart,
  displayEnd,
  sort,
  onSortChange,
  isFetching,
  activeFilters = [],
  onRemoveFilter,
  onClear,
  onOpenFilters,
}) {
  const { i18n } = useTranslation();

  // Reactive language detection
  const [activeLang, setActiveLang] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia" || stored === "id") return "id";
      if (stored === "English" || stored === "en") return "en";
      const i18nLng = localStorage.getItem("i18nextLng");
      if (i18nLng?.startsWith("id")) return "id";
    }
    return i18n.language || "en";
  });

  useEffect(() => {
    const handleLanguageChanged = (lng) => setActiveLang(lng);
    const handleCustomLang = (e) => {
      if (e?.detail?.isoCode) setActiveLang(e.detail.isoCode);
      else if (e?.detail?.name === "Indonesia") setActiveLang("id");
      else if (e?.detail?.name === "English") setActiveLang("en");
    };
    const handleStorage = () => {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia" || stored === "id") setActiveLang("id");
      else if (stored === "English" || stored === "en") setActiveLang("en");
      else setActiveLang(i18n.language || "en");
    };

    i18n.on("languageChanged", handleLanguageChanged);
    window.addEventListener("store_language_changed", handleCustomLang);
    window.addEventListener("storage", handleStorage);

    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
      window.removeEventListener("store_language_changed", handleCustomLang);
      window.removeEventListener("storage", handleStorage);
    };
  }, [i18n]);

  const isIndo = useMemo(() => {
    if (activeLang?.startsWith("id")) return true;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("store_language");
      if (stored === "Indonesia" || stored === "id") return true;
      if (stored === "English" || stored === "en") return false;
      const i18nLng = localStorage.getItem("i18nextLng");
      if (i18nLng?.startsWith("id")) return true;
    }
    return false;
  }, [activeLang]);

  const isPriceSort = sort === "price_asc" || sort === "price_desc";

  const handlePriceClick = () => {
    if (sort === "price_asc") {
      onSortChange("price_desc");
    } else {
      onSortChange("price_asc");
    }
  };

  return (
    <div className="tp-shop-sort-toolbar">
      {/* Horizontal Sort Tabs */}
      <div className="tp-shop-sort-row">
        <span className="tp-shop-sort-label">
          {isIndo ? "Urutkan:" : "Sort:"}
        </span>

        <div className="tp-shop-sort-tabs">
          <button
            type="button"
            className={`tp-shop-sort-tab ${sort === "featured" ? "is-active" : ""}`}
            onClick={() => onSortChange("featured")}
          >
            {isIndo ? "Terkait" : "Featured"}
          </button>

          <button
            type="button"
            className={`tp-shop-sort-tab ${sort === "newest" ? "is-active" : ""}`}
            onClick={() => onSortChange("newest")}
          >
            {isIndo ? "Terbaru" : "Newest"}
          </button>

          <button
            type="button"
            className={`tp-shop-sort-tab ${sort === "top_sales" ? "is-active" : ""}`}
            onClick={() => onSortChange("top_sales")}
          >
            {isIndo ? "Terlaris" : "Top Sales"}
          </button>

          {/* Toggleable Price Tab */}
          <button
            type="button"
            className={`tp-shop-sort-tab tp-shop-sort-tab--price ${isPriceSort ? "is-active" : ""}`}
            onClick={handlePriceClick}
          >
            <span>{isIndo ? "Harga" : "Price"}</span>
            {sort === "price_asc" ? (
              <ChevronUp className="w-3.5 h-3.5 text-[#fe6f05]" />
            ) : sort === "price_desc" ? (
              <ChevronDown className="w-3.5 h-3.5 text-[#fe6f05]" />
            ) : (
              <ArrowDownUp className="w-3 h-3 opacity-60" />
            )}
          </button>
        </div>

        {/* Right side controls: Filter button & View Mode */}
        <div className="tp-shop-sort-actions">
          <button
            type="button"
            className={`tp-shop-sort-filter-btn ${activeFilters.length > 0 ? "has-filters" : ""}`}
            onClick={onOpenFilters}
          >
            <Filter className="w-4 h-4" />
            <span>{isIndo ? "Filter" : "Filters"}</span>
            {activeFilters.length > 0 && (
              <span className="tp-shop-sort-filter-count">{activeFilters.length}</span>
            )}
          </button>

          <div className="tp-shop-view-toggle" aria-label="Product view">
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={viewMode === "grid" ? "is-active" : ""}
              aria-label="Grid view"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("list")}
              className={viewMode === "list" ? "is-active" : ""}
              aria-label="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info & Active filters tags */}
      <div className="tp-shop-sort-status-row">
        <p className="tp-shop-sort-count">
          {total > 0 ? (
            <>
              {isIndo ? "Menampilkan " : "Showing "}
              <strong>{displayStart}-{displayEnd}</strong>
              {isIndo ? " dari " : " of "}
              <strong>{total}</strong>
              {isIndo ? " produk" : " products"}
            </>
          ) : (
            isIndo ? "0 produk" : "0 products"
          )}
        </p>

        {isFetching && (
          <span className="tp-shop-sort-updating">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>{isIndo ? "Memperbarui..." : "Updating..."}</span>
          </span>
        )}

        {activeFilters.length > 0 && (
          <div className="tp-shop-sort-active-tags">
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                className="tp-shop-sort-tag"
                onClick={() => onRemoveFilter(filter.key)}
              >
                <span>{filter.label}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              type="button"
              className="tp-shop-sort-clear-all"
              onClick={onClear}
            >
              {isIndo ? "Hapus Semua" : "Clear All"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
