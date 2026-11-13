import { useRef, useEffect } from "react";
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

const isTabActive = (tabKey, currentActive) => {
  if (!currentActive) return tabKey === "home";
  if (tabKey === currentActive) return true;
  const clean = String(currentActive).toLowerCase().replace(/_/g, "-");
  const keyLower = String(tabKey).toLowerCase();
  if (clean === keyLower) return true;

  if (tabKey === "home" && (clean === "home-settings" || clean === "home-setting" || clean === "homepage")) return true;
  if (tabKey === "shop" && (clean === "shop-settings" || clean === "shop-setting" || clean === "store")) return true;
  if (tabKey === "productSlugPage" && (clean === "single-setting" || clean === "single" || clean === "single-settings" || clean === "product-slug")) return true;
  if (tabKey === "aboutUs" && (clean === "about-us-setting" || clean === "about-us" || clean === "about" || clean === "aboutus")) return true;
  if (tabKey === "privacyPolicyTerms" && (clean === "privacy-setting" || clean === "privacy" || clean === "privacy-policy" || clean === "terms")) return true;
  if (tabKey === "faqs" && (clean === "faq-setting" || clean === "faq" || clean === "faqs-setting" || clean === "faq-settings")) return true;
  if (tabKey === "offers" && (clean === "offers-setting" || clean === "offer" || clean === "offers-settings" || clean === "promotions")) return true;
  if (tabKey === "contactUs" && (clean === "contact-us-setting" || clean === "contact-us" || clean === "contact" || clean === "contactus")) return true;
  if (tabKey === "shoppingCart" && (clean === "shopping-cart-setting" || clean === "cart" || clean === "shopping-cart" || clean === "cart-setting")) return true;
  if (tabKey === "checkout" && (clean === "checkout-setting" || clean === "checkout-settings" || clean === "check-out")) return true;
  if (tabKey === "categories" && (clean === "categories-setting" || clean === "category" || clean === "category-setting")) return true;
  if (tabKey === "dashboardSetting" && (clean === "dashboard-setting" || clean === "dashboard" || clean === "dasbor" || clean === "dashboardsetting")) return true;
  if (tabKey === "seoSettings" && (clean === "seo-settings" || clean === "seo" || clean === "seo-setting" || clean === "seosettings")) return true;

  return false;
};

export default function StoreCustomizationTabNav2026({
  activeTab,
  onTabChange,
  className = "",
}) {
  const { i18n } = useTranslation();
  const isId = Boolean(i18n.language?.toLowerCase().startsWith("id"));
  const containerRef = useRef(null);
  const activeTabRef = useRef(null);

  useEffect(() => {
    if (activeTabRef.current && containerRef.current) {
      try {
        activeTabRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      } catch {
        // Fallback for older browsers
      }
    }
  }, [activeTab]);

  return (
    <nav
      aria-label="Store customization tabs"
      className={`rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <div
        ref={containerRef}
        role="tablist"
        aria-orientation="horizontal"
        className="flex items-center gap-1 overflow-x-auto pb-1 min-[560px]:pb-0 scroll-smooth [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 dark:hover:scrollbar-thumb-slate-600"
      >
        {STORE_CUSTOMIZATION_TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const selected = isTabActive(tab.key, activeTab);
          const displayLabel = isId ? tab.labelId : tab.label;

          return (
            <button
              key={tab.key}
              ref={selected ? activeTabRef : null}
              type="button"
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTabChange?.(tab.key);
              }}
              className={`relative inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl px-3.5 text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#034c85] ${
                selected
                  ? "bg-[#034c85] text-white shadow-sm shadow-[#034c85]/30 dark:bg-[#034c85] dark:text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  selected ? "text-[#fe6f05]" : "text-slate-400 dark:text-slate-500"
                }`}
              />
              <span className="whitespace-nowrap">{displayLabel}</span>
              {selected ? (
                <span className="absolute -bottom-1 left-3 right-3 h-0.5 rounded-full bg-[#fe6f05] shadow-[0_0_8px_rgba(254,111,5,0.8)]" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
