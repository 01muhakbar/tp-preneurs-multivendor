import {
  Apple,
  BookOpen,
  Coffee,
  Grid2X2,
  Home,
  Leaf,
  Milk,
  MoreHorizontal,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getShopCategoryValue, readShopText } from "./shopProductAdapter.js";

const iconForCategory = (name) => {
  const value = String(name || "").toLowerCase();
  if (value.includes("book") || value.includes("buku")) return BookOpen;
  if (value.includes("fruit") || value.includes("produce") || value.includes("fresh")) return Leaf;
  if (value.includes("milk") || value.includes("dairy")) return Milk;
  if (value.includes("drink") || value.includes("beverage")) return Coffee;
  if (value.includes("snack")) return ShoppingBag;
  if (value.includes("home") || value.includes("house")) return Home;
  if (value.includes("baby")) return Apple;
  return Sparkles;
};

export default function ShopCategoryRail2026({ categories, activeCategory, onChange }) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';

  const items = categories.slice(0, 8).map((category) => ({
    key: readShopText(category?.id, category?.slug, category?.name),
    label: readShopText(category?.name, category?.title, "Category"),
    value: getShopCategoryValue(category),
  }));

  return (
    <nav className="tp-shop-category-rail tp-shop-scrollbar-hidden" aria-label="Product categories">
      <button
        type="button"
        className={!activeCategory ? "is-active" : ""}
        onClick={() => onChange("")}
        aria-pressed={!activeCategory}
      >
        <Grid2X2 />
        <span>{isIndo ? "Semua Kategori" : "All Categories"}</span>
      </button>
      {items.map((item) => {
        const Icon = iconForCategory(item.label);
        const active = activeCategory === item.value;
        return (
          <button
            key={`${item.key}-${item.value}`}
            type="button"
            className={active ? "is-active" : ""}
            onClick={() => onChange(item.value)}
            aria-pressed={active}
          >
            <Icon />
            <span>{item.label}</span>
          </button>
        );
      })}
      {categories.length > 8 ? (
        <button type="button" onClick={() => onChange("")}>
          <MoreHorizontal />
          <span>{isIndo ? "Lihat Semua" : "View All"}</span>
        </button>
      ) : null}
    </nav>
  );
}
