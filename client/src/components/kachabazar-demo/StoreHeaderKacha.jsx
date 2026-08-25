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
  const src = resolveAssetUrl(logoUrl);

  if (src) {
    const separator = src.includes("?") ? "&" : "?";
    const versionedSrc = logoVersion ? `${src}${separator}v=${logoVersion}` : src;
    return (
      <Link
        to="/"
        className="flex h-[42px] w-[138px] shrink-0 items-center sm:h-[48px] sm:w-[164px]"
        aria-label="TP Preneurs home"
      >
        <img
          src={versionedSrc}
          alt="TP Preneurs logo"
          className="h-full w-full object-contain object-left"
        />
      </Link>
    );
  }

  return (
    <Link
      to="/"
      className="flex h-[42px] min-w-[138px] items-center gap-2.5 sm:h-[48px] sm:min-w-[164px]"
      aria-label="TP Preneurs home"
    >
      <div className="relative h-11 w-[52px]">
        <div
          className="absolute left-0 top-1.5 h-8 w-9 rounded-r-[15px] rounded-tl-lg"
          style={{ background: PRIMARY }}
        />
        <div
          className="absolute left-6 top-0 h-11 w-4 rounded-full"
          style={{ background: PRIMARY }}
        />
        <div
          className="absolute right-0 top-1.5 grid h-8 w-8 place-items-center rounded-full"
          style={{ background: ACCENT }}
        >
          <div className="h-4 w-4 rounded-full bg-white" />
        </div>
      </div>
      <div className="leading-none">
        <div className="text-[21px] font-black tracking-tight text-[var(--tp-primary)]">
          TP <span className="text-[var(--tp-accent)]">Preneurs</span>
        </div>
        <div className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-[var(--tp-primary)]">
          The Preneurs Power Hub
        </div>
      </div>
    </Link>
  );
}

function IconButton({ as: Component = "button", to, children, label, badge, onClick }) {
  const commonClass =
    "relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8e4f2] bg-white text-[#071a3f] shadow-[0_6px_16px_rgba(var(--tp-primary-rgb)/0.07)] transition hover:border-[var(--tp-primary)]/35 hover:text-[var(--tp-primary)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[var(--tp-primary)]";

  if (Component === Link) {
    return (
      <Link to={to} aria-label={label} className={commonClass}>
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
    <button type="button" onClick={onClick} aria-label={label} className={commonClass}>
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
  });
  const headerCust = headerCustomizationQuery.data?.data || customization?.header || {};
  const activeIdentity = publicIdentityOverride || identity || null;
  const displayPhone = activeIdentity?.phone || headerCust.phoneNumber || storeSettings?.contact?.phone || "565555";
  const displayHeaderText = headerCust.headerText || t("header.help");
  const displayLogoUrl = activeIdentity?.logoUrl || headerCust.headerLogoUrl || brandingLogoUrl;
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
        }
      }
    }
  }, [publishedLanguages, language, i18n]);
  
  const changeLanguage = (langObj) => {
    setLanguage(langObj.name);
    if (typeof window !== "undefined") {
      localStorage.setItem("store_language", langObj.name);
      i18n.changeLanguage(langObj.isoCode);
    }
    setLanguageOpen(false);
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
    { key: "about-us", label: t("header.aboutUs"), href: "/about-us" },
    { key: "contact-us", label: t("header.contactUs"), href: "/contact-us" },
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
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-sm text-slate-600 sm:px-5 lg:px-6 dark:text-slate-300">
        <div className="flex min-w-0 items-center gap-3">
          <Headphones className="h-[18px] w-[18px] shrink-0 text-[var(--tp-primary)] dark:text-sky-300" />
          <span className="truncate">{displayHeaderText}</span>
          <a href={`tel:${String(displayPhone).replace(/\s+/g, "")}`} className="font-black text-[var(--tp-accent)]">
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
                  className="font-semibold transition hover:text-[var(--tp-accent)] disabled:cursor-wait disabled:opacity-60"
                >
                  {item.label}
                </button>
              ) : (
                <Link to={item.href} className="font-semibold transition hover:text-[var(--tp-accent)]">
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-6">
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
                    placeholder={t("header.searchPlaceholder")}
                    className="h-11 w-full rounded-full border border-[#c8d7ea] bg-white px-6 pr-[58px] text-base font-semibold text-[#42577b] outline-none transition placeholder:text-[#667798] focus:border-[var(--tp-primary)] focus:ring-4 focus:ring-[rgb(var(--tp-primary-rgb)/0.1)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="submit"
                    aria-label="Search"
                    className="absolute right-1.5 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-[0_10px_20px_rgba(var(--tp-primary-rgb)/0.2)] transition hover:scale-[1.03]"
                    style={{ background: PRIMARY }}
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
                  className="h-10 w-10 border-[#d8e4f2] text-[#071a3f] shadow-[0_6px_16px_rgba(var(--tp-primary-rgb)/0.07)] hover:text-[var(--tp-primary)] dark:border-slate-700"
                />
              </div>
              <div className="hidden sm:block">
                <IconButton as={Link} to="/wishlist" label="Wishlist" badge={wishlist.count > 0 ? wishlist.count : null}>
                  <Heart className="h-5 w-5" />
                </IconButton>
              </div>
              <IconButton label="Open cart" badge={count > 0 ? count : null} onClick={onCartClick}>
                <ShoppingCart className="h-5 w-5" />
              </IconButton>
              <div ref={notificationRootRef} className="store-header-notification-anchor">
                <button
                  type="button"
                  aria-label="Notifications"
                  aria-expanded={notificationsOpen}
                  onClick={handleToggleNotifications}
                  className={`store-header-notification-button relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8e4f2] bg-white text-[#071a3f] shadow-[0_6px_16px_rgba(var(--tp-primary-rgb)/0.07)] transition hover:border-[var(--tp-primary)]/35 hover:text-[var(--tp-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--tp-primary-rgb)/0.24)] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-[var(--tp-primary)] ${notificationsOpen ? "is-open" : ""}`}
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
                label={isAccountSession ? "My account" : "Login"}
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
                  placeholder="Search products"
                  className="h-12 w-full rounded-full border border-[#c8d7ea] bg-white px-5 pr-14 text-base font-semibold text-[#42577b] outline-none focus:border-[var(--tp-primary)] focus:ring-4 focus:ring-[rgb(var(--tp-primary-rgb)/0.1)] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1.5 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-white"
                  style={{ background: PRIMARY }}
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
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-2 w-full max-w-7xl px-4 pb-2 sm:px-5 lg:px-6">
        <div className="flex min-h-[52px] items-center justify-between gap-4 overflow-visible rounded-[18px] border border-white/80 bg-white px-3 py-1.5 shadow-[0_8px_20px_rgba(var(--tp-primary-rgb)/0.06)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex min-w-0 items-center gap-2 md:gap-4">
            <div className="relative" ref={categoriesRootRef} data-demo-dropdown>
              <button
                type="button"
                onClick={() => setCategoriesOpen((value) => !value)}
                className="inline-flex h-10 items-center gap-2.5 rounded-full px-4 text-base font-black text-white shadow-[0_10px_22px_rgba(var(--tp-primary-rgb)/0.17)] sm:px-5"
                style={{ background: PRIMARY }}
                aria-expanded={categoriesOpen}
              >
                <Menu className="h-5 w-5" />
                <span>{t("header.categories")}</span>
                <ChevronDown className="h-4 w-4" />
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
                  className={`relative inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-base font-black transition hover:bg-[var(--tp-primary-soft)] hover:text-[var(--tp-primary)] dark:hover:bg-slate-800 ${
                    isActive
                      ? "bg-[var(--tp-primary-soft)] text-[var(--tp-primary)] dark:text-sky-200"
                      : "text-[#071a3f] dark:text-slate-100"
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
              className="inline-flex h-9 shrink-0 items-center gap-2.5 rounded-full px-3 text-base font-black text-[#071a3f] transition hover:bg-[var(--tp-primary-soft)] dark:text-slate-100 dark:hover:bg-slate-800 sm:px-4"
              aria-expanded={languageOpen}
            >
              <Globe2 className="h-5 w-5" />
              <span className="hidden sm:inline">{language}</span>
              <ChevronDown className="h-4 w-4" />
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
                      className={`block w-full rounded-xl px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[var(--tp-primary-soft)] hover:text-[var(--tp-accent)] dark:hover:bg-slate-800 ${language === langObj.name ? "text-[var(--tp-accent)] bg-[var(--tp-primary-soft)] dark:bg-slate-800" : "text-[#071a3f] dark:text-slate-100"}`}
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
