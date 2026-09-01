import {
  BadgeCheck,
  CircleHelp,
  Gift,
  Grid3X3,
  Home,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";

export const STORE_CUSTOMIZATION_TAB_ITEMS = [
  { key: "home", label: "Home Page", icon: Home },
  { key: "productSlugPage", label: "Product Slug Page", icon: Package },
  { key: "aboutUs", label: "About Us", icon: BadgeCheck },
  { key: "privacyPolicyTerms", label: "Privacy & T&C", icon: ShieldCheck },
  { key: "faqs", label: "FAQs", icon: CircleHelp },
  { key: "offers", label: "Offers", icon: Gift },
  { key: "contactUs", label: "Contact", icon: ShoppingBag },
  { key: "checkout", label: "Checkout", icon: ShoppingCart },
  { key: "dashboardSetting", label: "Dashboard", icon: Grid3X3 },
  { key: "seoSettings", label: "SEO", icon: Search },
];

export default function StoreCustomizationTabNav2026({
  activeTab,
  onTabChange,
  className = "",
}) {
  return (
    <nav
      aria-label="Store customization tabs"
      className={`rounded-3xl border border-slate-200/80 bg-white p-2 shadow-[0_18px_48px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-none ${className}`}
    >
      <div className="grid min-w-0 grid-cols-2 gap-1 min-[560px]:flex min-[560px]:flex-wrap min-[560px]:items-center">
        {STORE_CUSTOMIZATION_TAB_ITEMS.map((tab) => {
          const Icon = tab.icon;
          const selected = (activeTab || "home") === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange?.(tab.key)}
              className={`relative inline-flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-2xl px-2 text-xs font-bold transition min-[560px]:h-12 min-[560px]:gap-2 min-[560px]:px-4 min-[560px]:text-sm ${
                selected
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="min-w-0 truncate">{tab.label}</span>
              {selected ? (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-600" />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
