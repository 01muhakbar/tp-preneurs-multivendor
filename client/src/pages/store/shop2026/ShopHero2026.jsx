import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useCategories } from "../../../storefront.jsx";
import {
  Leaf,
  MapPin,
  Package,
  Search,
  ShoppingBasket,
  Store,
  Truck,
} from "lucide-react";

const POPULAR_SEARCHES = ["Milk & Dairy", "Rice & Grains", "Beverages", "Baby Care", "Snacks"];

export default function ShopHero2026({ query, onSearch }) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';
  const [draft, setDraft] = useState(query);
  const { data: categoriesData } = useCategories();

  useEffect(() => setDraft(query), [query]);
  
  const popularSearches = categoriesData?.length > 0 
    ? categoriesData.slice(0, 5).map(c => c.name) 
    : POPULAR_SEARCHES;

  const submit = (event) => {
    event.preventDefault();
    onSearch(draft.trim());
  };

  return (
    <section className="tp-shop-hero" aria-labelledby="tp-shop-title">
      <div className="tp-shop-hero__copy">
        <p className="tp-shop-hero__eyebrow">{isIndo ? "Belanja cerdas, hidup lebih baik" : "Shop smart, live better"}</p>
        <h1 id="tp-shop-title">
          {isIndo ? "Pilihan lokal terpercaya," : "Trusted local picks,"}
          <br />
          <span>{isIndo ? "diantar" : "delivered"}</span> {isIndo ? "ke tempat Anda" : "to you"}
        </h1>
        <p className="tp-shop-hero__subtext">
          {isIndo ? "Kebutuhan segar, favorit harian, semua di satu tempat." : "Fresh essentials, daily favourites, all in one place."}
        </p>

        <form className="tp-shop-hero__search" onSubmit={submit} role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="tp-shop-hero-search">
            {isIndo ? "Cari produk, toko, atau kebutuhan harian" : "Search products, stores, or daily essentials"}
          </label>
          <input
            id="tp-shop-hero-search"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={isIndo ? "Cari produk, toko, atau kebutuhan harian" : "Search products, stores, or daily essentials"}
            autoComplete="off"
          />
          {draft ? (
            <button
              type="button"
              className="tp-shop-hero__clear"
              onClick={() => {
                setDraft("");
                onSearch("");
              }}
              aria-label={isIndo ? "Hapus pencarian" : "Clear search"}
            >
              {isIndo ? "Hapus" : "Clear"}
            </button>
          ) : null}
          <button type="submit" className="tp-shop-btn tp-shop-btn--primary">
            <Search aria-hidden="true" />
            {isIndo ? "Cari" : "Search"}
          </button>
        </form>

        <div className="tp-shop-hero__popular" aria-label="Popular searches">
          <span>{isIndo ? "Pencarian populer:" : "Popular searches:"}</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setDraft(term);
                onSearch(term);
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      <div className="tp-shop-showcase" aria-hidden="true">
        <div className="tp-shop-showcase__dots" />
        <div className="tp-shop-showcase__arc" />
        <div className="tp-shop-showcase__pedestal tp-shop-showcase__pedestal--back" />
        <div className="tp-shop-showcase__pedestal tp-shop-showcase__pedestal--front" />
        <div className="tp-shop-showcase__card">
          <span className="tp-shop-showcase__awning"><Store /></span>
          <ShoppingBasket className="tp-shop-showcase__basket" />
        </div>
        <span className="tp-shop-showcase__float tp-shop-showcase__float--pin">
          <MapPin />
          <small>{isIndo ? "Pilihan lokal" : "Local picks"}</small>
        </span>
        <span className="tp-shop-showcase__float tp-shop-showcase__float--truck">
          <Truck />
          <small>{isIndo ? "Pengiriman cepat" : "Fast delivery"}</small>
        </span>
        <span className="tp-shop-showcase__float tp-shop-showcase__float--leaf"><Leaf /></span>
        <span className="tp-shop-showcase__float tp-shop-showcase__float--package"><Package /></span>
      </div>
    </section>
  );
}
