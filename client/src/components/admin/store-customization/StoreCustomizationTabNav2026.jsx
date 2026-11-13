import { useTranslation } from "react-i18next";
import {
  BadgeCheck,
  CircleHelp,
  CreditCard,
  Gift,
  Grid2X2,
  Grid3X3,
  Home,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
} from "lucide-react";

export const STORE_CUSTOMIZATION_TAB_ITEMS = [
  { key: "home", label: "Home Page", labelId: "Halaman Utama", icon: Home },
  { key: "shop", label: "Shop Page", labelId: "Halaman Toko", icon: Store },
  { key: "productSlugPage", label: "Product Slug Page", labelId: "Halaman Detail Produk", icon: Package },
  { key: "aboutUs", label: "About Us", labelId: "Tentang Kami", icon: BadgeCheck },
  { key: "privacyPolicyTerms", label: "Privacy & T&C", labelId: "Privasi & Syarat Ketentuan", icon: ShieldCheck },
  { key: "faqs", label: "FAQs", labelId: "Tanya Jawab (FAQ)", icon: CircleHelp },
  { key: "offers", label: "Offers", labelId: "Penawaran Khusus", icon: Gift },
  { key: "contactUs", label: "Contact", labelId: "Kontak Bantuan", icon: ShoppingBag },
  { key: "shoppingCart", label: "Shopping Cart", labelId: "Keranjang Belanja", icon: ShoppingCart },
  { key: "checkout", label: "Checkout", labelId: "Halaman Checkout", icon: CreditCard },
  { key: "categories", label: "Categories", labelId: "Kategori Produk", icon: Grid2X2 },
  { key: "dashboardSetting", label: "Dashboard", labelId: "Pengaturan Dasbor", icon: Grid3X3 },
  { key: "seoSettings", label: "SEO", labelId: "Metadata & SEO", icon: Search },
];

export default function StoreCustomizationTabNav2026({
  activeTab,
  onTabChange,
  className = "",
}) {
  const { i18n } = useTranslation();
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));

  return (
    <nav
      aria-label="Store customization tabs"
      className={`rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center gap-1 overflow-x-auto pb-1 min-[560px]:pb-0 scrollbar-thin">
        {STORE_CUSTOMIZATION_TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const selected = (activeTab || "home") === tab.key;
          const displayLabel = isId ? tab.labelId : tab.label;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange?.(tab.key)}
              className={`relative inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition ${
                selected
                  ? "bg-[#034c85] text-white shadow-sm shadow-[#034c85]/30 dark:bg-[#034c85] dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${selected ? "text-[#fe6f05]" : "text-slate-400"}`} />
              <span className="whitespace-nowrap">{displayLabel}</span>
              {selected ? (
                <span className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-[#fe6f05]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
