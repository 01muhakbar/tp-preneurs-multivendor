import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ChevronDown,
  Globe2,
  Headphones,
  Heart,
  Menu,
  Search,
  ShoppingCart,
  UserRound,
  Bell,
  Check,
} from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAccountAuth } from "../../auth/authDomainHooks.js";
import { useCart } from "../../hooks/useCart.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useCategories, useProducts } from "../../storefront.jsx";
import { formatCurrency } from "../../utils/format.js";
import { resolveProductImageUrl } from "../../utils/productImage.js";
import { useDebounce } from "../../hooks/useDebounce.ts";
import ThemeToggle from "../store/ThemeToggle.jsx";
import NotificationPreviewDropdown from "../store/NotificationPreviewDropdown.jsx";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import { fetchUserUnreadNotificationCount } from "../../api/userNotifications.ts";
import { getStoreHeaderCustomization, fetchPublicLanguages } from "../../api/public/storeCustomizationPublic.ts";

import { CANONICAL_CLIENT_LOGO_URL, getCachedClientLogoUrl } from "../../lib/branding.js";

const PRIMARY = "var(--tp-primary)";
const ACCENT = "var(--tp-accent)";

const extractList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.categories)) return payload.categories;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  if (Array.isArray(payload?.data?.categories)) return payload.data.categories;
  return [];
};

const getInitials = (value) => {
  const text = String(value || "").trim();
  if (!text) return "U";
  if (text.includes("@")) return text.split("@")[0].slice(0, 2).toUpperCase();
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const INDO_HEADER_CATS = {
  "Electronics": "Elektronik",
  "Fashion": "Fashion",
  "Grocery": "Kebutuhan Pokok",
  "Home & Living": "Rumah & Tempat Tinggal",
  "Beauty": "Kecantikan",
  "Sports": "Olahraga",
  "Books": "Buku",
  "Kids & Toys": "Anak & Mainan",
  "Health": "Kesehatan",
  "Automotive": "Otomotif",
  "Office": "Kantor",
  "Gift Ideas": "Ide Hadiah",
  "Fish & Meat": "Ikan & Daging",
  "Soft Drink": "Minuman Ringan",
  "Milk & Dairy": "Susu & Olahan",
  "Beauty & Health": "Kecantikan & Kesehatan",
  "Snacks": "Camilan",
  "Beverages": "Minuman",
  "Baby Care": "Perawatan Bayi",
  "Fruits & Vegetables": "Buah & Sayur",
  "Fresh Produce": "Produk Segar",
  "Rice & Grains": "Beras & Biji-bijian",
};

const getNavItems = (t) => [
  { label: t("header.home", "Home"), href: "/" },
  { label: t("header.shop"), href: "/shop" },
  { label: t("header.offers"), href: "/offers" },
  { label: t("header.aboutUs"), href: "/about-us" },
  { label: t("header.contactUs"), href: "/contact-us" },
];

const isNavItemActive = (pathname, href) => {
  if (href === "/") return pathname === "/";
  if (href === "/shop") return pathname === "/shop" || pathname === "/search";
  return pathname === href || pathname.startsWith(`${href}/`);
};

function LogoMark({ logoUrl, logoVersion }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  const canonicalUrl = resolveAssetUrl(getCachedClientLogoUrl() || CANONICAL_CLIENT_LOGO_URL);
  const primaryUrl = resolveAssetUrl(logoUrl) || canonicalUrl;
  const src = !imgError ? primaryUrl : (primaryUrl !== canonicalUrl ? canonicalUrl : "");

  if (src) {
    const separator = src.includes("?") ? "&" : "?";
    const versionedSrc = logoVersion ? `${src}${separator}v=${logoVersion}` : src;
    return (
      <Link
        to="/"
        className="flex h-[44px] w-auto max-w-[190px] shrink-0 items-center sm:h-[52px] sm:max-w-[240px] lg:h-[58px] lg:max-w-[280px]"
        aria-label="TP Preneurs home"
      >
        <img
          src={versionedSrc}
          alt="TP Preneurs logo"
          onError={() => {
            if (!imgError && primaryUrl !== canonicalUrl) {
              setImgError(true);
            } else {
              setImgError(true);
            }
          }}
          className="h-full w-auto max-w-full object-contain object-left"
        />
      </Link>
    );
  }

  return (
    <Link
      to="/"
      className="flex h-[44px] min-w-[138px] items-center gap-2.5 sm:h-[52px] sm:min-w-[164px] lg:h-[58px] lg:min-w-[180px]"
      aria-label="TP Preneurs home"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#034c85] to-[#023157] shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor">
          <path
            d="M9 18h6m-4 4h2m-5-8.5a6 6 0 1 1 8 0c-.8 1-1.5 2-1.5 3.5h-5c0-1.5-.7-2.5-1.5-3.5Z"
            stroke="#fe6f05"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="leading-none">
        <div className="text-[20px] font-black tracking-tight text-[#034c85] dark:text-white">
          TP <span className="text-[#fe6f05]">PRENEURS</span>
        </div>
      </div>
    </Link>
  );
}

function IconButton({ as: Component = "button", to, children, label, title, badge, onClick }) {
  const commonClass =
    "relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#d8e4f2] bg-white text-[#071a3f] shadow-[0_6px_16px_rgba(var(--tp-primary-rgb)/0.07)] transition-all duration-200 hover:scale-105 hover:border-[#fe6f05] hover:text-[#fe6f05] hover:bg-[#fe6f05]/5 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05] dark:hover:bg-slate-800";

  if (Component === Link) {
    return (
      <Link to={to} aria-label={label} title={title || label} className={commonClass}>
        {children}
        {badge ? (
          <span className="absolute -right-0.5 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white" style={{ background: ACCENT }}>
            {badge}
          </span>
        ) : null}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} aria-label={label} title={title || label} className={commonClass}>
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white" style={{ background: ACCENT }}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function LiveSearchDropdown({ searchFocused, debouncedSearch, searchFetching, searchResults, submitSearch, setSearchFocused, setSearch, isIndo }) {
  if (!searchFocused || debouncedSearch.trim().length === 0) return null;
  return (
    <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full overflow-hidden rounded-[22px] border border-[#d8e4f2] bg-white py-2 shadow-[0_22px_45px_rgba(var(--tp-primary-rgb)/0.16)] dark:border-slate-700 dark:bg-slate-900">
      {searchFetching ? (
        <div className="px-5 py-4 text-sm font-medium text-slate-500">{isIndo ? "Mencari..." : "Searching..."}</div>
      ) : searchResults.length > 0 ? (
        <div>
          {searchResults.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.routeSlug || product.slug || product.id}`}
              onClick={() => { setSearchFocused(false); setSearch(""); }}
              className="flex items-center gap-4 px-4 py-2.5 transition hover:bg-[var(--tp-primary-soft)] dark:hover:bg-slate-800"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-[10px] border border-slate-100 bg-[#f7fbff] dark:border-slate-700 dark:bg-slate-800">
                {resolveProductImageUrl(product) ? (
                  <img src={resolveProductImageUrl(product)} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-xl">{product.emoji || "🛒"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="truncate text-[13px] font-bold text-[#071a3f] dark:text-slate-100">{product.name}</h4>
                <div className="mt-0.5 text-xs font-black text-[var(--tp-primary)]">
                  {formatCurrency(product.price)}
                </div>
              </div>
            </Link>
          ))}
          <div className="border-t border-slate-100 px-3 pb-1 pt-2 dark:border-slate-800 mt-1">
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); submitSearch({ preventDefault: () => {} }); setSearchFocused(false); }}
              className="w-full rounded-xl py-2.5 text-center text-[13px] font-bold text-[#557099] transition hover:bg-slate-50 hover:text-[var(--tp-primary)] dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {isIndo ? `Lihat semua hasil untuk "${debouncedSearch}"` : `View all results for "${debouncedSearch}"`}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-5 py-4 text-sm font-medium text-slate-500">{isIndo ? `Produk tidak ditemukan untuk "${debouncedSearch}"` : `No products found for "${debouncedSearch}"`}</div>
      )}
    </div>
  );
}

export default function StoreHeaderKacha({
  onCartClick,
  publicIdentityOverride = null,
  brandingLogoUrl = "",
  storeSettings = null,
  customization = null,
  identity = null,
}) {
  const { t, i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID" || i18n.language?.startsWith("id") || (typeof window !== "undefined" && localStorage.getItem("store_language") === "Indonesia");
  const currentLang = isIndo ? "id" : "en";

  const headerCustomizationQuery = useQuery({
    queryKey: ["store-customization", "header", currentLang],
    queryFn: () => getStoreHeaderCustomization({ lang: currentLang }),
    staleTime: 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    initialData: () => {
      if (typeof window === "undefined") return undefined;
      try {
        const raw = window.localStorage.getItem(`tp_header_customization_${currentLang}`);
        return raw ? JSON.parse(raw) : undefined;
      } catch {
        return undefined;
      }
    },
  });

  useEffect(() => {
    if (headerCustomizationQuery.data && typeof window !== "undefined") {
      try {
        window.localStorage.setItem(
          `tp_header_customization_${currentLang}`,
          JSON.stringify(headerCustomizationQuery.data)
        );
      } catch {}
    }
  }, [headerCustomizationQuery.data, currentLang]);
  const headerCust = headerCustomizationQuery.data?.data || customization?.header || {};
  // Platform Support Phone: Always use WhatsApp phone number from admin store customization (home-settings)
  const rawPhone = headerCust.phoneNumber || storeSettings?.contact?.phone || "+62 821-8866-824";
  const displayPhone = String(rawPhone).includes("565555") || !rawPhone ? "+62 821-8866-824" : rawPhone;
  const rawHeaderText = headerCust.headerText;
  const isDummyHeader = !rawHeaderText || rawHeaderText.includes("We are available 24/7") || rawHeaderText.includes("565555");
  const displayHeaderText = isDummyHeader
    ? (isIndo ? "Layanan Bantuan & Konsultasi" : "Customer Support & Hub")
    : rawHeaderText;
  const phoneDigits = String(displayPhone).replace(/[^0-9]/g, "");
  const phoneHref = phoneDigits ? `https://wa.me/${phoneDigits}` : "https://wa.me/628218866824";
  // Platform Logo: Always use Client Logo from admin settings (or header customization logo), never individual store logo
  const displayLogoUrl = brandingLogoUrl || headerCust.headerLogoUrl || getCachedClientLogoUrl() || CANONICAL_CLIENT_LOGO_URL;
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { count } = useCart();
  const wishlist = useStorefrontWishlist();
  const { user, isAccountSession, logout } = useAccountAuth();
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({
    parentsOnly: true,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRootRef = useRef(null);

  const { data: searchResultsData, isFetching: searchFetching } = useProducts({
    search: debouncedSearch,
    limit: 5,
    enabled: Boolean(debouncedSearch.trim().length > 0 && searchFocused),
  });
  const searchResults = useMemo(() => extractList(searchResultsData), [searchResultsData]);

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesRootRef = useRef(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const notificationRootRef = useRef(null);

  // LANGUAGE STATE
  const [languageOpen, setLanguageOpen] = useState(false);
  const languageRootRef = useRef(null);
  const [mobileLanguageOpen, setMobileLanguageOpen] = useState(false);
  const mobileLanguageRootRef = useRef(null);
  const [language, setLanguage] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("store_language") || "English";
    }
    return "English";
  });

  const languagesQuery = useQuery({
    queryKey: ["store-navbar-languages"],
    queryFn: () => fetchPublicLanguages(),
    staleTime: 60_000,
  });
  
  const publishedLanguages = useMemo(
    () => {
      const list = languagesQuery.data?.data || [];
      return list.filter((item) => item.name && item.isoCode && (item.published === true || String(item.published) === "true" || item.published === 1));
    },
    [languagesQuery.data]
  );
  
  useEffect(() => {
    if (publishedLanguages.length > 0) {
      const stored = typeof window !== "undefined" ? localStorage.getItem("store_language") : null;
      let matched = null;
      if (stored) {
        matched = publishedLanguages.find(l => l.name === stored || l.isoCode === stored);
      }
      if (!matched) {
        matched = publishedLanguages.find(l => l.isoCode === "en") || publishedLanguages[0];
      }
      if (matched && matched.name !== language) {
        setLanguage(matched.name);
        if (typeof window !== "undefined") {
          localStorage.setItem("store_language", matched.name);
          i18n.changeLanguage(matched.isoCode);
          window.dispatchEvent(new Event("storage"));
          window.dispatchEvent(new CustomEvent("store_language_changed", { detail: matched }));
        }
      }
    }
  }, [publishedLanguages, language, i18n]);
  
  const changeLanguage = (langObj) => {
    setLanguage(langObj.name);
    if (typeof window !== "undefined") {
      localStorage.setItem("store_language", langObj.name);
      i18n.changeLanguage(langObj.isoCode);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new CustomEvent("store_language_changed", { detail: langObj }));
    }
    setLanguageOpen(false);
    setMobileLanguageOpen(false);
  };
  
  useEffect(() => {
    if (!languageOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!languageRootRef.current?.contains(event.target)) {
        setLanguageOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [languageOpen]);

  useEffect(() => {
    if (!mobileLanguageOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!mobileLanguageRootRef.current?.contains(event.target)) {
        setMobileLanguageOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setMobileLanguageOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileLanguageOpen]);

  const categories = useMemo(() => extractList(categoriesData).slice(0, 8), [categoriesData]);
  const accountDisplayName = user?.name || user?.fullName || user?.email || "Account";
  const accountAvatarSrc = resolveAssetUrl(user?.avatarUrl || user?.avatar || "");
  const accountInitials = getInitials(user?.name || user?.fullName || user?.email);
  const unreadQuery = useQuery({
    queryKey: ["account", "notifications", "unread-count"],
    queryFn: fetchUserUnreadNotificationCount,
    enabled: Boolean(isAccountSession),
    staleTime: 20_000,
    retry: 1,
  });
  const unreadCount = Number(unreadQuery.data || 0);
  const unreadBadge = unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  useEffect(() => {
    setSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!searchFocused) return undefined;
    const handlePointerDown = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!searchRootRef.current?.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [searchFocused]);

  useEffect(() => {
    if (!categoriesOpen) return undefined;

    const closeOnOutsidePointer = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!categoriesRootRef.current?.contains(event.target)) {
        setCategoriesOpen(false);
      }
    };
    const closeOnScroll = () => setCategoriesOpen(false);
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setCategoriesOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("scroll", closeOnScroll, true);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("scroll", closeOnScroll, true);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [categoriesOpen]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!(event.target instanceof Node)) return;
      if (!notificationRootRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notificationsOpen]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    const q = search.trim();
    if (!q) {
      navigate("/shop");
      return;
    }
    params.set("q", q);
    params.set("page", "1");
    navigate(`/search?${params.toString()}`);
  };

  const closeCategories = () => setCategoriesOpen(false);

  const handleToggleNotifications = () => {
    if (!isAccountSession) {
      navigate("/auth/login");
      return;
    }
    setNotificationsOpen((value) => !value);
  };

  const handleNotificationNavigate = (path) => {
    setNotificationsOpen(false);
    navigate(path || "/user/notifications");
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout?.();
      navigate("/auth/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const utilityItems = [
    {
      key: "my-account",
      label: t("header.myAccount"),
      href: isAccountSession ? "/user/my-account" : "/auth/login",
    },
    isAccountSession
      ? { key: "session-action", label: isLoggingOut ? t("header.loggingOut") : t("header.logout"), action: handleLogout }
      : { key: "session-action", label: t("header.login"), href: "/auth/login" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#e3edf8] bg-[#f7fbff]/95 text-[#071a3f] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/95 dark:text-slate-100">
      {/* MOBILE HEADER (lg:hidden) */}
      <div className="lg:hidden w-full flex flex-col bg-white dark:bg-slate-900 border-b border-[#e3edf8] dark:border-slate-800 shadow-xs">
        {/* Top mini info strip: Support + Language */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-1 text-[11px] font-semibold bg-[#034c85] text-white">
          <a
            href={phoneHref}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-center gap-1.5 font-bold text-white transition hover:text-[#fe6f05]"
            title={isIndo ? "Hubungi Bantuan via WhatsApp" : "Contact Support via WhatsApp"}
          >
            <Headphones className="h-3.5 w-3.5 shrink-0 text-[#fe6f05]" />
            <span className="truncate text-[10px] sm:text-[11px] tracking-tight">{displayPhone}</span>
          </a>

          <div className="relative shrink-0" ref={mobileLanguageRootRef}>
            <button
              type="button"
              onClick={() => setMobileLanguageOpen((prev) => !prev)}
              title={isIndo ? "Pilih Bahasa / Select Language" : "Select Language / Pilih Bahasa"}
              className="group inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-black text-white shadow-xs transition hover:bg-white/20 active:scale-95"
              aria-expanded={mobileLanguageOpen}
            >
              <Globe2 className="h-3.5 w-3.5 text-[#fe6f05] transition-transform duration-200 group-hover:rotate-12" />
              <span>{isIndo ? "ID" : "EN"}</span>
              <ChevronDown className={`h-3 w-3 text-white/80 transition-transform duration-200 ${mobileLanguageOpen ? "rotate-180 text-[#fe6f05]" : ""}`} />
            </button>
            {mobileLanguageOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-36 overflow-hidden rounded-xl border border-white/15 bg-[#022847] p-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.35)] backdrop-blur-md">
                {(publishedLanguages.length > 0 ? publishedLanguages : [
                  { name: "Indonesia", isoCode: "id" },
                  { name: "English", isoCode: "en" },
                ]).map((langObj) => {
                  const isSelected = language === langObj.name;
                  const flag = langObj.isoCode === "id" ? "🇮🇩" : langObj.isoCode === "en" ? "🇬🇧" : "🌐";
                  return (
                    <button
                      key={langObj.isoCode}
                      type="button"
                      onClick={() => changeLanguage(langObj)}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-bold transition ${
                        isSelected
                          ? "bg-[#fe6f05] text-white shadow-xs"
                          : "text-white/90 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-sm">{flag}</span>
                        <span>{langObj.name}</span>
                      </span>
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Row 1: Logo + Theme + Wishlist + Cart + Account */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
          <div className="shrink-0 max-w-[145px] sm:max-w-[180px]">
            <LogoMark logoUrl={displayLogoUrl} />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle
              variant="icon"
              title={isIndo ? "Ganti tema tampilan (Terang / Gelap)" : "Toggle appearance (Light / Dark)"}
              className="h-9 w-9 border-slate-200 text-[#034c85] dark:border-slate-700 dark:text-slate-100 cursor-pointer transition-all duration-200 hover:scale-105 hover:border-[#fe6f05] hover:text-[#fe6f05] dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
            />
            <Link
              to="/wishlist"
              aria-label={isIndo ? "Favorit" : "Wishlist"}
              title={isIndo ? "Produk Favorit / Wishlist" : "Wishlist"}
              className="relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-[#034c85] shadow-xs transition-all duration-200 hover:scale-105 hover:border-[#fe6f05] hover:text-[#fe6f05] active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
            >
              <Heart className="h-4.5 w-4.5" />
              {wishlist.count > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-[#fe6f05] px-1 text-[10px] font-black text-white">
                  {wishlist.count}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              aria-label={isIndo ? "Buka keranjang belanja" : "Open cart"}
              title={isIndo ? "Keranjang Belanja" : "Shopping Cart"}
              onClick={onCartClick}
              className="relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-[#034c85] shadow-xs transition-all duration-200 hover:scale-105 hover:border-[#fe6f05] hover:text-[#fe6f05] active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
            >
              <ShoppingCart className="h-4.5 w-4.5" />
              {count > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4.5 h-4.5 items-center justify-center rounded-full bg-[#fe6f05] px-1 text-[10px] font-black text-white">
                  {count}
                </span>
              ) : null}
            </button>
            <Link
              to={isAccountSession ? "/user/my-account" : "/auth/login"}
              aria-label={isAccountSession ? (isIndo ? "Akun saya" : "My account") : (isIndo ? "Masuk" : "Login")}
              title={isAccountSession ? (isIndo ? "Akun Saya" : "My Account") : (isIndo ? "Masuk ke Akun" : "Login")}
              className="relative inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-[#034c85] shadow-xs transition-all duration-200 hover:scale-105 hover:border-[#fe6f05] hover:text-[#fe6f05] active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
            >
              <UserRound className="h-4.5 w-4.5" />
            </Link>
          </div>
        </div>

        {/* Row 2: Search input */}
        <div className="px-3.5 pb-2.5 pt-0.5">
          <div ref={searchRootRef} className="relative w-full">
            <form onSubmit={submitSearch}>
              <label className="relative block">
                <span className="sr-only">Search products</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={isIndo ? "Cari produk digital, karya & buku..." : "Search products & campus works..."}
                  className="h-10 w-full rounded-full border border-[#c8d7ea] bg-slate-50 px-4 pr-[46px] text-xs sm:text-sm font-semibold text-[#034c85] outline-none transition placeholder:text-slate-400 focus:border-[#034c85] focus:bg-white focus:ring-2 focus:ring-[#034c85]/15 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
                <button
                  type="submit"
                  aria-label={isIndo ? "Cari" : "Search"}
                  title={isIndo ? "Cari Produk" : "Search Products"}
                  className="absolute right-1 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white bg-[#034c85] shadow-xs transition-all duration-200 hover:bg-[#fe6f05] hover:scale-105 active:scale-95"
                >
                  <Search className="h-4 w-4" />
                </button>
              </label>
            </form>
            <LiveSearchDropdown
              searchFocused={searchFocused}
              debouncedSearch={debouncedSearch}
              searchFetching={searchFetching}
              searchResults={searchResults}
              submitSearch={submitSearch}
              setSearchFocused={setSearchFocused}
              setSearch={setSearch}
              isIndo={isIndo}
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex mx-auto w-full max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-xs sm:text-sm text-slate-600 sm:px-5 lg:px-6 dark:text-slate-300">
        <div className="flex min-w-0 items-center gap-2.5">
          <Headphones className="h-4 w-4 shrink-0 text-[#034c85] dark:text-sky-300" />
          <span className="truncate font-medium">{displayHeaderText}:</span>
          <a href={phoneHref} target="_blank" rel="noreferrer" className="font-black text-[#fe6f05] hover:underline">
            {displayPhone}
          </a>
        </div>
        <nav className="hidden items-center gap-5 lg:flex">
          {utilityItems.map((item, index) => (
            <div key={item.key} className="flex items-center gap-5">
              {index > 0 ? <span className="h-4 w-px bg-slate-300 dark:bg-slate-700" /> : null}
              {item.action ? (
                <button
                  type="button"
                  onClick={item.action}
                  disabled={isLoggingOut}
                  className="font-semibold transition hover:text-[#fe6f05] disabled:cursor-wait disabled:opacity-60"
                >
                  {item.label}
                </button>
              ) : (
                <Link to={item.href} className="font-semibold transition hover:text-[#fe6f05]">
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="hidden lg:block mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-6">
        <div className="rounded-[18px] border border-white/80 bg-white px-4 py-2 shadow-[0_10px_24px_rgba(var(--tp-primary-rgb)/0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-[0_14px_30px_rgba(0,0,0,0.22)]">
          <div className="flex items-center gap-3 lg:gap-5">
            <div className="shrink-0">
              <LogoMark logoUrl={displayLogoUrl} />
            </div>

            <div ref={searchRootRef} className="hidden min-w-0 flex-1 md:block relative">
              <form onSubmit={submitSearch}>
                <label className="relative block">
                  <span className="sr-only">Search products</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    placeholder={isIndo ? "Cari produk digital, karya inovasi & buku..." : "Search digital products, innovation works & books..."}
                    className="h-11 w-full rounded-full border border-[#c8d7ea] bg-white px-6 pr-[58px] text-base font-semibold text-[#42577b] outline-none transition placeholder:text-[#667798] focus:border-[#034c85] focus:ring-4 focus:ring-[#034c85]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    aria-label={isIndo ? "Cari" : "Search"}
                    title={isIndo ? "Cari Produk" : "Search Products"}
                    className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white bg-[#034c85] shadow-[0_4px_12px_rgba(3,76,133,0.25)] transition-all duration-200 hover:bg-[#fe6f05] hover:shadow-[0_4px_14px_rgba(254,111,5,0.4)] hover:scale-105 active:scale-95"
                  >
                    <Search className="h-5 w-5" />
                  </button>
                </label>
              </form>
              <LiveSearchDropdown
                searchFocused={searchFocused}
                debouncedSearch={debouncedSearch}
                searchFetching={searchFetching}
                searchResults={searchResults}
                submitSearch={submitSearch}
                setSearchFocused={setSearchFocused}
                setSearch={setSearch}
                isIndo={isIndo}
              />
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block">
                <ThemeToggle
                  variant="icon"
                  title={isIndo ? "Ganti tema tampilan (Terang / Gelap)" : "Toggle appearance (Light / Dark)"}
                  className="h-10 w-10 border-[#d8e4f2] text-[#071a3f] shadow-[0_6px_16px_rgba(var(--tp-primary-rgb)/0.07)] hover:text-[#fe6f05] hover:border-[#fe6f05] dark:border-slate-700 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05]"
                />
              </div>
              <div className="hidden sm:block">
                <IconButton
                  as={Link}
                  to="/wishlist"
                  label={isIndo ? "Favorit" : "Wishlist"}
                  title={isIndo ? "Produk Favorit / Wishlist" : "Wishlist"}
                  badge={wishlist.count > 0 ? wishlist.count : null}
                >
                  <Heart className="h-5 w-5" />
                </IconButton>
              </div>
              <IconButton
                label={isIndo ? "Buka keranjang belanja" : "Open shopping cart"}
                title={isIndo ? "Keranjang Belanja" : "Shopping Cart"}
                badge={count > 0 ? count : null}
                onClick={onCartClick}
              >
                <ShoppingCart className="h-5 w-5" />
              </IconButton>
              <div ref={notificationRootRef} className="store-header-notification-anchor">
                <button
                  type="button"
                  aria-label={isIndo ? "Notifikasi" : "Notifications"}
                  title={isIndo ? "Notifikasi" : "Notifications"}
                  aria-expanded={notificationsOpen}
                  onClick={handleToggleNotifications}
                  className={`store-header-notification-button relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#d8e4f2] bg-white text-[#071a3f] shadow-[0_6px_16px_rgba(var(--tp-primary-rgb)/0.07)] transition-all duration-200 hover:scale-105 hover:border-[#fe6f05] hover:text-[#fe6f05] hover:bg-[#fe6f05]/5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fe6f05]/35 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05] dark:hover:bg-slate-800 ${notificationsOpen ? "is-open" : ""}`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadBadge ? (
                    <span
                      className="absolute -right-0.5 -top-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white"
                      style={{ background: ACCENT }}
                    >
                      {unreadBadge}
                    </span>
                  ) : null}
                </button>
                <NotificationPreviewDropdown
                  open={notificationsOpen}
                  onClose={() => setNotificationsOpen(false)}
                  onNavigate={handleNotificationNavigate}
                />
              </div>
              <IconButton
                as={Link}
                to={isAccountSession ? "/user/my-account" : "/auth/login"}
                label={isAccountSession ? (isIndo ? "Akun saya" : "My account") : (isIndo ? "Masuk" : "Login")}
                title={isAccountSession ? (isIndo ? "Akun Saya" : "My Account") : (isIndo ? "Masuk ke Akun" : "Login")}
              >
                {isAccountSession ? (
                  accountAvatarSrc ? (
                    <img
                      src={accountAvatarSrc}
                      alt={`${accountDisplayName} profile`}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--tp-primary-soft)] text-xs font-black text-[var(--tp-primary)] dark:bg-slate-800 dark:text-sky-200"
                      aria-hidden="true"
                    >
                      {accountInitials}
                    </span>
                  )
                ) : (
                  <UserRound className="h-5 w-5" />
                )}
              </IconButton>
            </div>
          </div>

          <div className="mt-3 md:hidden relative">
            <form onSubmit={submitSearch}>
              <label className="relative block">
                <span className="sr-only">Search products</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder={isIndo ? "Cari produk digital, karya inovasi & buku..." : "Search digital products, innovation works & books..."}
                  className="h-11 w-full rounded-full border border-[#c8d7ea] bg-white px-5 pr-14 text-sm font-semibold text-[#42577b] outline-none focus:border-[#034c85] focus:ring-4 focus:ring-[#034c85]/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="submit"
                  aria-label={isIndo ? "Cari" : "Search"}
                  title={isIndo ? "Cari Produk" : "Search Products"}
                  className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-white bg-[#034c85] shadow-xs transition-all duration-200 hover:bg-[#fe6f05] hover:scale-105 active:scale-95"
                >
                  <Search className="h-5 w-5" />
                </button>
              </label>
            </form>
            <LiveSearchDropdown
              searchFocused={searchFocused}
              debouncedSearch={debouncedSearch}
              searchFetching={searchFetching}
              searchResults={searchResults}
              submitSearch={submitSearch}
              setSearchFocused={setSearchFocused}
              setSearch={setSearch}
              isIndo={isIndo}
            />
          </div>
        </div>
      </div>

      <div className="hidden lg:block mx-auto mt-2 w-full max-w-7xl px-4 pb-2 sm:px-5 lg:px-6">
        <div className="flex min-h-[52px] items-center justify-between gap-4 overflow-visible rounded-[18px] border border-white/80 bg-white px-4 py-1.5 shadow-[0_8px_20px_rgba(var(--tp-primary-rgb)/0.06)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <div className="relative" ref={categoriesRootRef} data-demo-dropdown>
              <button
                type="button"
                onClick={() => setCategoriesOpen((value) => !value)}
                title={isIndo ? "Kategori Produk" : "Product Categories"}
                className="group inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-full px-4 text-base font-black text-white bg-[#034c85] hover:bg-[#023863] shadow-[0_4px_14px_rgba(3,76,133,0.25)] transition-all duration-200 hover:scale-[1.02] active:scale-95 sm:px-5"
                aria-expanded={categoriesOpen}
              >
                <Menu className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
                <span>{t("header.categories")}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${categoriesOpen ? "rotate-180 text-[#fe6f05]" : "group-hover:translate-y-0.5"}`} />
              </button>
              {categoriesOpen ? (
                <div className="absolute left-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-[22px] border border-[#d8e4f2] bg-white p-2 shadow-[0_22px_45px_rgba(var(--tp-primary-rgb)/0.16)] dark:border-slate-700 dark:bg-slate-900">
                  {categoriesLoading ? (
                    <div className="px-3 py-3 text-sm text-slate-500">{isIndo ? "Memuat kategori..." : "Loading categories..."}</div>
                  ) : categories.length > 0 ? (
                    <>
                      {categories.map((category) => (
                        <Link
                          key={category.id ?? category.slug ?? category.name}
                          to={`/search?category=${encodeURIComponent(category.slug ?? category.id ?? category.name)}&page=1`}
                          onClick={closeCategories}
                          className="block rounded-2xl px-4 py-3 text-sm font-bold text-[#071a3f] transition hover:bg-[var(--tp-primary-soft)] hover:text-[var(--tp-accent)] dark:text-slate-100 dark:hover:bg-slate-800"
                        >
                          {isIndo ? (INDO_HEADER_CATS[category.name] || category.name) : category.name}
                        </Link>
                      ))}
                      <Link
                        to="/categories"
                        onClick={closeCategories}
                        className="mt-1 block border-t border-slate-100 px-4 py-3 text-sm font-black text-[var(--tp-primary)] transition hover:bg-[var(--tp-primary-soft)] hover:text-[var(--tp-accent)] dark:border-slate-800 dark:text-sky-200 dark:hover:bg-slate-800"
                      >
                        {isIndo ? "Semua Kategori" : "All Categories"}
                      </Link>
                    </>
                  ) : (
                    <Link
                      to="/categories"
                      onClick={closeCategories}
                      className="block rounded-2xl px-4 py-3 text-sm font-black text-[var(--tp-primary)] transition hover:bg-[var(--tp-primary-soft)] hover:text-[var(--tp-accent)] dark:text-sky-200"
                    >
                      {isIndo ? "Semua Kategori" : "All Categories"}
                    </Link>
                  )}
                </div>
              ) : null}
            </div>

            <nav className="hidden items-center gap-2 lg:flex">
              {getNavItems(t).map((item) => {
                const isActive = isNavItemActive(location.pathname, item.href);
                return (
                <Link
                  key={item.label}
                  to={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-base font-black transition ${
                    isActive
                      ? "bg-[#034c85]/10 text-[#034c85] dark:bg-sky-950/60 dark:text-sky-300"
                      : "text-[#071a3f] hover:bg-slate-100 hover:text-[#034c85] dark:text-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
                );
              })}
            </nav>
          </div>

          <div className="relative" ref={languageRootRef}>
            <button
              type="button"
              onClick={() => setLanguageOpen(!languageOpen)}
              title={isIndo ? "Pilih Bahasa / Select Language" : "Select Language / Pilih Bahasa"}
              className="group inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-[#034c85]/20 bg-slate-50/80 px-3.5 text-base font-black text-[#034c85] shadow-xs transition-all duration-200 hover:scale-[1.02] hover:border-[#fe6f05] hover:bg-[#fe6f05]/5 hover:text-[#fe6f05] active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#fe6f05] dark:hover:text-[#fe6f05] sm:px-4"
              aria-expanded={languageOpen}
            >
              <Globe2 className="h-5 w-5 transition-transform duration-200 group-hover:rotate-12 text-[#034c85] group-hover:text-[#fe6f05] dark:text-slate-100 dark:group-hover:text-[#fe6f05]" />
              <span className="hidden sm:inline">{language}</span>
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${languageOpen ? "rotate-180 text-[#fe6f05]" : "group-hover:translate-y-0.5"}`} />
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-40 overflow-hidden rounded-[18px] border border-[#d8e4f2] bg-white p-2 shadow-[0_22px_45px_rgba(var(--tp-primary-rgb)/0.16)] dark:border-slate-700 dark:bg-slate-900">
                {languagesQuery.isLoading ? (
                  <div className="px-4 py-2 text-sm text-slate-500">Loading...</div>
                ) : publishedLanguages.length === 0 ? (
                  <div className="px-4 py-2 text-sm text-slate-500">No languages</div>
                ) : (
                  publishedLanguages.map((langObj) => (
                    <button
                      key={langObj.isoCode}
                      type="button"
                      onClick={() => changeLanguage(langObj)}
                      className={`block w-full cursor-pointer rounded-xl px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#034c85]/10 hover:text-[#fe6f05] dark:hover:bg-slate-800 ${language === langObj.name ? "text-[#fe6f05] bg-[#034c85]/10 dark:bg-slate-800" : "text-[#071a3f] dark:text-slate-100"}`}
                    >
                      {langObj.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
