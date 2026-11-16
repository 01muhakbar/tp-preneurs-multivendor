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
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getShopCategoryValue, readShopText } from "./shopProductAdapter.js";

const CATEGORY_TRANSLATIONS = {
  "makanan dan minuman": "Food & Beverage",
  "makanan & minuman": "Food & Beverage",
  "kerajinan dan kreatif": "Crafts & Creative",
  "kerajinan & kreatif": "Crafts & Creative",
  "jasa": "Services",
  "buku": "Books",
  "produk pembelajaran": "Learning Media",
  "elektronik & gadget": "Electronics",
  "fashion & pakaian": "Fashion & Apparel",
  "tanaman & pertanian": "Agriculture",
};

const iconForCategory = (name) => {
  const value = String(name || "").toLowerCase();
  if (value.includes("book") || value.includes("buku")) return BookOpen;
  if (value.includes("makan") || value.includes("kuliner") || value.includes("food")) return Utensils;
  if (value.includes("minum") || value.includes("drink") || value.includes("kopi")) return Coffee;
  if (value.includes("jasa") || value.includes("service") || value.includes("reparasi")) return Wrench;
  if (value.includes("digital") || value.includes("software") || value.includes("web")) return Laptop;
  if (value.includes("karya") || value.includes("kampus") || value.includes("edu") || value.includes("belajar") || value.includes("learning")) return GraduationCap;
  if (value.includes("kreatif") || value.includes("craft") || value.includes("kerajinan")) return Sparkles;
  if (value.includes("fashion") || value.includes("baju")) return ShoppingBag;
  if (value.includes("fresh") || value.includes("tani") || value.includes("singkong")) return Leaf;
  if (value.includes("home") || value.includes("rumah")) return Home;
  return Package;
};

export default function ShopCategoryRail2026({ categories = [], activeCategory, onChange }) {
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

  const items = useMemo(() => {
    return categories.slice(0, 10).map((category) => {
      const rawName = readShopText(category?.name, category?.title, "Category");
      const normalizedKey = rawName.toLowerCase().trim();
      const label = !isIndo && CATEGORY_TRANSLATIONS[normalizedKey]
        ? CATEGORY_TRANSLATIONS[normalizedKey]
        : rawName;

      return {
        key: readShopText(category?.id, category?.slug, category?.name),
        label,
        value: getShopCategoryValue(category),
      };
    });
  }, [categories, isIndo]);

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
