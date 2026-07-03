import { ChevronDown, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getShopCategoryValue, readShopText } from "./shopProductAdapter.js";

const RATINGS = [5, 4, 3, 2, 1];

const toNumberOrEmpty = (value) => {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : "";
};

function FilterHeading({ children }) {
  return (
    <h3 className="tp-shop-filters__section-title">
      {children}
      <ChevronDown aria-hidden="true" />
    </h3>
  );
}

export default function ShopFilters2026({
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
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';
  const [minimum, setMinimum] = useState(minPrice ?? "");
  const [maximum, setMaximum] = useState(maxPrice ?? "");

  useEffect(() => {
    setMinimum(minPrice ?? "");
    setMaximum(maxPrice ?? "");
  }, [minPrice, maxPrice]);

  const applyPrice = () => onPriceChange(toNumberOrEmpty(minimum), toNumberOrEmpty(maximum));

  return (
    <div className="tp-shop-filters">
      <div className="tp-shop-filters__header">
        <h2>{isIndo ? "Filter" : "Filters"}</h2>
        <button type="button" onClick={onClear}>{isIndo ? "Hapus Semua" : "Clear All"}</button>
      </div>

      <section className="tp-shop-filters__section">
        <FilterHeading>{isIndo ? "Kategori" : "Categories"}</FilterHeading>
        <div className="tp-shop-filters__choices">
          {categories.slice(0, 10).map((category) => {
            const value = getShopCategoryValue(category);
            const label = readShopText(category?.name, category?.title, value);
            const checked = activeCategory === value;
            return (
              <label key={`shop-filter-${value}`}>
                <span>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onCategoryChange(checked ? "" : value)}
                  />
                  {label}
                </span>
                {category?.count || category?.productCount ? (
                  <small>({category.count ?? category.productCount})</small>
                ) : null}
              </label>
            );
          })}
        </div>
      </section>

      <section className="tp-shop-filters__section">
        <FilterHeading>{isIndo ? "Rentang Harga" : "Price Range"}</FilterHeading>
        <div className="tp-shop-filters__price">
          <label>
            <span>{isIndo ? "Harga minimum" : "Minimum price"}</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={minimum}
              placeholder="Rp 0"
              onChange={(event) => setMinimum(event.target.value)}
              onBlur={applyPrice}
              onKeyDown={(event) => event.key === "Enter" && applyPrice()}
            />
          </label>
          <label>
            <span>{isIndo ? "Harga maksimum" : "Maximum price"}</span>
            <input
              type="number"
              min="0"
              inputMode="numeric"
              value={maximum}
              placeholder="Rp 1,000,000"
              onChange={(event) => setMaximum(event.target.value)}
              onBlur={applyPrice}
              onKeyDown={(event) => event.key === "Enter" && applyPrice()}
            />
          </label>
        </div>
        <div className="tp-shop-filters__range" aria-hidden="true">
          <span /><i /><span />
        </div>
      </section>

      <section className="tp-shop-filters__section">
        <FilterHeading>{isIndo ? "Peringkat" : "Ratings"}</FilterHeading>
        <div className="tp-shop-filters__choices tp-shop-filters__ratings">
          {RATINGS.map((rating) => (
            <label key={`shop-rating-${rating}`}>
              <span>
                <input
                  type="checkbox"
                  checked={Number(minRating || 0) === rating}
                  onChange={() => onRatingChange(Number(minRating || 0) === rating ? "" : rating)}
                />
                <span className="tp-shop-stars" aria-label={`${rating} stars and up`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} className={index < rating ? "is-filled" : ""} />
                  ))}
                </span>
                <small>{isIndo ? "ke atas" : "& up"}</small>
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
