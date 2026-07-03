import { Filter, Grid2X2, List, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SHOP_SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
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
  activeFilters,
  onRemoveFilter,
  onClear,
  onOpenFilters,
}) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';

  const TRANSLATED_SORT_OPTIONS = [
    { value: "featured", label: isIndo ? "Unggulan" : "Featured" },
    { value: "newest", label: isIndo ? "Terbaru" : "Newest" },
    { value: "price_asc", label: isIndo ? "Harga: Rendah ke Tinggi" : "Price: Low to High" },
    { value: "price_desc", label: isIndo ? "Harga: Tinggi ke Rendah" : "Price: High to Low" },
    { value: "highest_rated", label: isIndo ? "Rating Tertinggi" : "Highest Rated" },
  ];

  return (
    <div className="tp-shop-toolbar">
      <div className="tp-shop-toolbar__top">
        <div className="tp-shop-view-toggle" aria-label="Product view">
          <button
            type="button"
            onClick={() => onViewModeChange("grid")}
            className={viewMode === "grid" ? "is-active" : ""}
            aria-label="Grid view"
            aria-pressed={viewMode === "grid"}
          >
            <Grid2X2 />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("list")}
            className={viewMode === "list" ? "is-active" : ""}
            aria-label="List view"
            aria-pressed={viewMode === "list"}
          >
            <List />
          </button>
        </div>

        <p className="tp-shop-toolbar__count">
          {isIndo ? "Menampilkan " : "Showing "}<strong>{total ? `${displayStart}-${displayEnd}` : "0"}</strong> {isIndo ? "dari " : "of "}{total} {isIndo ? "produk" : "products"}
        </p>
        {isFetching ? (
          <span className="tp-shop-toolbar__updating"><Loader2 /> {isIndo ? "Memperbarui" : "Updating"}</span>
        ) : null}

        <button type="button" className="tp-shop-toolbar__filter-button" onClick={onOpenFilters}>
          <Filter /> {isIndo ? "Filter" : "Filters"}
        </button>

        <label className="tp-shop-toolbar__sort">
          <span>{isIndo ? "Urutkan:" : "Sort by:"}</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value)}>
            {TRANSLATED_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {activeFilters.length ? (
        <div className="tp-shop-toolbar__filters">
          <span>{isIndo ? "Filter aktif:" : "Active filters:"}</span>
          {activeFilters.map((filter) => (
            <button key={filter.key} type="button" onClick={() => onRemoveFilter(filter.key)}>
              {filter.label}
              <X aria-hidden="true" />
            </button>
          ))}
          <button type="button" className="tp-shop-toolbar__clear" onClick={onClear}>{isIndo ? "Hapus Semua" : "Clear All"}</button>
        </div>
      ) : null}
    </div>
  );
}
