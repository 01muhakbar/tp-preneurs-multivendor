import {
  BookOpen,
  Coffee,
  GraduationCap,
  Grid2X2,
  Home,
  Laptop,
  Leaf,
  MoreHorizontal,
  Package,
  ShoppingBag,
  Sparkles,
  Utensils,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getShopCategoryValue, readShopText } from "./shopProductAdapter.js";

const iconForCategory = (name) => {
  const value = String(name || "").toLowerCase();
  if (value.includes("book") || value.includes("buku")) return BookOpen;
  if (value.includes("makan") || value.includes("kuliner") || value.includes("food")) return Utensils;
  if (value.includes("minum") || value.includes("drink") || value.includes("kopi")) return Coffee;
  if (value.includes("jasa") || value.includes("service") || value.includes("reparasi")) return Wrench;
  if (value.includes("digital") || value.includes("software") || value.includes("web")) return Laptop;
  if (value.includes("karya") || value.includes("kampus") || value.includes("edu")) return GraduationCap;
  if (value.includes("kreatif") || value.includes("craft") || value.includes("kerajinan")) return Sparkles;
  if (value.includes("fashion") || value.includes("baju")) return ShoppingBag;
  if (value.includes("fresh") || value.includes("tani") || value.includes("singkong")) return Leaf;
  if (value.includes("home") || value.includes("rumah")) return Home;
  return Package;
};

export default function ShopCategoryRail2026({ categories = [], activeCategory, onChange }) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID";

  const items = categories.slice(0, 10).map((category) => ({
    key: readShopText(category?.id, category?.slug, category?.name),
    label: readShopText(category?.name, category?.title, "Category"),
    value: getShopCategoryValue(category),
  }));

  return (
    <nav className="tp-shopee-cat-rail tp-shop-scrollbar-hidden" aria-label="Product categories">
      <button
        type="button"
        className={`tp-shopee-cat-btn ${!activeCategory ? "is-active" : ""}`}
        onClick={() => onChange("")}
        aria-pressed={!activeCategory}
      >
        <Grid2X2 className="w-4 h-4" />
        <span>{isIndo ? "Semua" : "All"}</span>
      </button>

      {items.map((item) => {
        const Icon = iconForCategory(item.label);
        const active = activeCategory === item.value;
        return (
          <button
            key={`${item.key}-${item.value}`}
            type="button"
            className={`tp-shopee-cat-btn ${active ? "is-active" : ""}`}
            onClick={() => onChange(item.value)}
            aria-pressed={active}
          >
            <Icon className="w-4 h-4" />
            <span>{item.label}</span>
          </button>
        );
      })}

      {categories.length > 10 && (
        <button
          type="button"
          className="tp-shopee-cat-btn"
          onClick={() => onChange("")}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>{isIndo ? "Lainnya" : "More"}</span>
        </button>
      )}
    </nav>
  );
}
