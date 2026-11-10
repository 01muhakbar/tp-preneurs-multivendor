import { ChevronDown, RotateCcw, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getShopCategoryValue, readShopText } from "./shopProductAdapter.js";

const RATINGS = [5, 4, 3, 2, 1];

const toNumberOrEmpty = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : "";
};

export default function ShopFilters2026({
  categories = [],
  activeCategory = "",
  minPrice = "",
  maxPrice = "",
  minRating = "",
  onCategoryChange,
  onPriceChange,
  onRatingChange,
  onClear,
  onApply,
}) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID";
  const [minimum, setMinimum] = useState(minPrice ?? "");
  const [maximum, setMaximum] = useState(maxPrice ?? "");

  useEffect(() => {
    setMinimum(minPrice ?? "");
    setMaximum(maxPrice ?? "");
  }, [minPrice, maxPrice]);

  const handleApplyPrice = () => {
    onPriceChange(toNumberOrEmpty(minimum), toNumberOrEmpty(maximum));
    if (onApply) onApply();
  };

  const handlePresetPrice = (minVal, maxVal) => {
    setMinimum(minVal);
    setMaximum(maxVal);
    onPriceChange(minVal, maxVal);
    if (onApply) onApply();
  };

  return (
    <div className="tp-shopee-filters">
      {/* Sidebar / Drawer Header */}
      <div className="tp-shopee-filters__header">
        <h2 className="tp-shopee-filters__title">
          {isIndo ? "Pilih Preferensi" : "Filter Preferences"}
        </h2>
        <button
          type="button"
          className="tp-shopee-filters__reset-btn"
          onClick={onClear}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{isIndo ? "Atur Ulang" : "Reset"}</span>
        </button>
      </div>

      <div className="tp-shopee-filters__body">
        {/* Category section as chips */}
        <section className="tp-shopee-filters__group">
          <h3 className="tp-shopee-filters__group-title">
            {isIndo ? "Kategori" : "Categories"}
          </h3>
          <div className="tp-shopee-chips-grid">
            <button
              type="button"
              className={`tp-shopee-filter-chip ${!activeCategory ? "is-selected" : ""}`}
              onClick={() => {
                onCategoryChange("");
                if (onApply) onApply();
              }}
            >
              {isIndo ? "Semua" : "All"}
            </button>
            {categories.slice(0, 12).map((cat) => {
              const value = getShopCategoryValue(cat);
              const label = readShopText(cat?.name, cat?.title, value);
              const isSelected = activeCategory === value;
              return (
                <button
                  key={`filter-cat-${value}`}
                  type="button"
                  className={`tp-shopee-filter-chip ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    onCategoryChange(isSelected ? "" : value);
                    if (onApply) onApply();
                  }}
                >
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Price Range */}
        <section className="tp-shopee-filters__group">
          <h3 className="tp-shopee-filters__group-title">
            {isIndo ? "Batas Harga" : "Price Range"}
          </h3>
          <div className="tp-shopee-price-inputs">
            <div className="tp-shopee-price-field">
              <span className="tp-shopee-currency">Rp</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={minimum}
                placeholder="MIN"
                onChange={(event) => setMinimum(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleApplyPrice()}
              />
            </div>
            <span className="tp-shopee-price-dash">—</span>
            <div className="tp-shopee-price-field">
              <span className="tp-shopee-currency">Rp</span>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={maximum}
                placeholder="MAKS"
                onChange={(event) => setMaximum(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleApplyPrice()}
              />
            </div>
          </div>

          {/* Quick price chips */}
          <div className="tp-shopee-price-presets">
            <button
              type="button"
              className={`tp-shopee-preset-chip ${maximum === 50000 && !minimum ? "is-selected" : ""}`}
              onClick={() => handlePresetPrice("", 50000)}
            >
              &lt; 50RB
            </button>
            <button
              type="button"
              className={`tp-shopee-preset-chip ${minimum === 50000 && maximum === 150000 ? "is-selected" : ""}`}
              onClick={() => handlePresetPrice(50000, 150000)}
            >
              50RB - 150RB
            </button>
            <button
              type="button"
              className={`tp-shopee-preset-chip ${minimum === 150000 && !maximum ? "is-selected" : ""}`}
              onClick={() => handlePresetPrice(150000, "")}
            >
              &gt; 150RB
            </button>
          </div>
        </section>

        {/* Rating section */}
        <section className="tp-shopee-filters__group">
          <h3 className="tp-shopee-filters__group-title">
            {isIndo ? "Penilaian" : "Rating"}
          </h3>
          <div className="tp-shopee-rating-chips">
            {RATINGS.map((rating) => {
              const isSelected = Number(minRating || 0) === rating;
              return (
                <button
                  key={`rating-chip-${rating}`}
                  type="button"
                  className={`tp-shopee-rating-chip ${isSelected ? "is-selected" : ""}`}
                  onClick={() => {
                    onRatingChange(isSelected ? "" : rating);
                    if (onApply) onApply();
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-[#fe6f05] text-[#fe6f05]" />
                    <span className="font-semibold">{rating}</span>
                  </div>
                  <span className="tp-shopee-rating-sub">
                    {rating === 5
                      ? (isIndo ? "Bintang" : "Stars")
                      : (isIndo ? "ke atas" : "& up")}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sticky footer for drawer / panel */}
      <div className="tp-shopee-filters__footer">
        <button
          type="button"
          className="tp-shopee-btn-reset"
          onClick={onClear}
        >
          {isIndo ? "Atur Ulang" : "Reset"}
        </button>
        <button
          type="button"
          className="tp-shopee-btn-apply"
          onClick={handleApplyPrice}
        >
          {isIndo ? "Terapkan" : "Apply"}
        </button>
      </div>
    </div>
  );
}
