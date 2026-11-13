import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Store as StoreIcon,
  MessageCircleMore,
  Mail,
  ArrowLeft,
  Search,
  Sparkles,
  PhoneCall,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { fetchStoreProducts } from "../../api/public/storeProducts.ts";
import { getStoreMicrositeRichAboutBySlug } from "../../api/public/storeCustomizationPublic.ts";
import { getStorePublicIdentityBySlug } from "../../api/public/storePublicIdentity.ts";
import { toPreferredWhatsAppLink } from "../../utils/storePublicIdentity.ts";
import { buildStoreMicrosite2026ViewModel } from "./microsite2026/storeMicrosite2026Adapter.js";
import StoreMicrosite2026View from "./microsite2026/StoreMicrosite2026View.jsx";
import StoreMicrositeShell from "../../components/store/StoreMicrositeShell.jsx";
import { UiEmptyState } from "../../components/primitives/state/index.js";
import "./microsite2026/store-microsite-2026.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

// Local storage fallback for follow store
const STORE_FOLLOW_KEY = "tp_followed_stores_v1";
const getFollowedStores = () => {
  try {
    return JSON.parse(localStorage.getItem(STORE_FOLLOW_KEY) || "[]");
  } catch {
    return [];
  }
};
const toggleFollowStore = (slug) => {
  try {
    let stores = getFollowedStores();
    if (stores.includes(slug)) {
      stores = stores.filter((s) => s !== slug);
    } else {
      stores.push(slug);
    }
    localStorage.setItem(STORE_FOLLOW_KEY, JSON.stringify(stores));
    return stores.includes(slug);
  } catch {
    return false;
  }
};
const isStoreFollowed = (slug) => {
  return getFollowedStores().includes(slug);
};

export default function StoreMicrositePage() {
  const { slug } = useParams();
  const safeSlug = useMemo(() => toText(slug).toLowerCase(), [slug]);
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { i18n } = useTranslation();
  const currentLang = String(i18n.language || "").toLowerCase();
  const isIndo =
    currentLang === "id" ||
    currentLang === "id-id" ||
    currentLang.startsWith("id") ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("store_language") === "Indonesia" ||
        localStorage.getItem("store_language") === "id"));

  const activeTabFromQuery = toText(searchParams.get("view"), "home").toLowerCase();
  const activeSearchQuery = toText(
    searchParams.get("q") || searchParams.get("query") || searchParams.get("search")
  );
  const sortValue = toText(searchParams.get("sort"), "relevance").toLowerCase();

  const [activeTab, setActiveTab] = useState(activeTabFromQuery);
  const [isFollowed, setIsFollowed] = useState(() => isStoreFollowed(safeSlug));

  // 1. Unconditional React Queries
  const micrositeQuery = useQuery({
    queryKey: ["store-public-identity", "slug", safeSlug],
    queryFn: () => getStorePublicIdentityBySlug(safeSlug),
    enabled: Boolean(safeSlug),
    staleTime: 60_000,
    retry: false,
  });

  const productsQuery = useQuery({
    queryKey: ["storefront", "products", "store-slug", safeSlug, activeSearchQuery],
    queryFn: () =>
      fetchStoreProducts({
        storeSlug: safeSlug,
        q: activeSearchQuery || undefined,
        page: 1,
        limit: 50,
      }),
    enabled: Boolean(safeSlug),
    staleTime: 60_000,
    retry: 1,
  });

  const richAboutQuery = useQuery({
    queryKey: ["store-customization", "microsite-rich-about", safeSlug, "en"],
    queryFn: () => getStoreMicrositeRichAboutBySlug(safeSlug, { lang: "en" }),
    enabled: Boolean(safeSlug),
    staleTime: 60_000,
    retry: 1,
  });

  // 2. Unconditional Effects
  useEffect(() => {
    if (activeTabFromQuery !== activeTab) {
      setActiveTab(
        activeTabFromQuery === "products" || activeTabFromQuery === "about"
          ? activeTabFromQuery
          : "home"
      );
    }
  }, [activeTabFromQuery]);

  useEffect(() => {
    const storeData = micrositeQuery.data?.data;
    if (!storeData?.name) return;

    const pageTitle = `Toko Online ${storeData.name} | TP Preneurs`;
    document.title = pageTitle;

    const rawDesc = toText(storeData.description);
    const snippet = rawDesc.length > 170 ? `${rawDesc.slice(0, 167)}...` : rawDesc;
    const metaDescription = snippet
      ? `${storeData.name} adalah toko online resmi di TP Preneurs. ${snippet}`
      : `Kunjungi toko online resmi ${storeData.name} di TP Preneurs. Temukan produk berkualitas, penawaran terbaik, dan belanja online aman.`;

    const setMeta = (nameOrProperty, value, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let el = document.head.querySelector(`meta[${attr}='${nameOrProperty}']`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, nameOrProperty);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    setMeta("description", metaDescription);
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", metaDescription, true);
    setMeta("og:url", window.location.href, true);
    setMeta("og:site_name", "TP Preneurs", true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", metaDescription);

    const imageUrl = storeData.logoUrl || storeData.bannerUrl;
    if (imageUrl) {
      setMeta("og:image", imageUrl, true);
      setMeta("twitter:image", imageUrl);
    }
  }, [micrositeQuery.data?.data]);

  // 3. Unconditional View Model computation (ALWAYS runs in exact same order)
  const vm = useMemo(() => {
    if (!micrositeQuery.data) {
      return {
        store: { name: "", slug: safeSlug, description: "" },
        products: [],
        featuredProducts: [],
      };
    }

    const baseVm = buildStoreMicrosite2026ViewModel({
      identity: micrositeQuery.data,
      productsPayload: productsQuery.data,
      richAbout: richAboutQuery.data,
      slug: safeSlug,
    });

    // Apply client-side sorting
    let sortedProducts = [...baseVm.products];
    if (sortValue === "newest") {
      sortedProducts.sort((a, b) => {
        const dateA = Date.parse(String(a?.updatedAt || "")) || 0;
        const dateB = Date.parse(String(b?.updatedAt || "")) || 0;
        return dateB - dateA;
      });
    } else if (sortValue === "price-asc") {
      sortedProducts.sort((a, b) => (Number(a?.price) || 0) - (Number(b?.price) || 0));
    } else if (sortValue === "price-desc") {
      sortedProducts.sort((a, b) => (Number(b?.price) || 0) - (Number(a?.price) || 0));
    } else {
      sortedProducts.sort((a, b) => {
        const reviewDiff = (Number(b?.reviewCount) || 0) - (Number(a?.reviewCount) || 0);
        if (reviewDiff !== 0) return reviewDiff;
        return (Number(b?.ratingAvg) || 0) - (Number(a?.ratingAvg) || 0);
      });
    }

    const applyProductLinks = (productsArray) => {
      return productsArray.map((product) => {
        const productSlug = toText(product?.routeSlug || product?.slug || product?.id);
        const productHref = productSlug
          ? `/product/${encodeURIComponent(productSlug)}`
          : `/product/${product?.id || ""}`;
        return {
          ...product,
          productHref,
        };
      });
    };

    return {
      ...baseVm,
      products: applyProductLinks(sortedProducts),
      featuredProducts: applyProductLinks(baseVm.featuredProducts),
    };
  }, [micrositeQuery.data, productsQuery.data, richAboutQuery.data, safeSlug, sortValue]);

  // Handler functions
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    next.set("view", tabId);
    setSearchParams(next, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = () => {};

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const formData = new FormData(e.target);
    const val = formData.get("q") || e.target[0].value;
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set("q", val);
      next.set("view", "products");
    } else {
      next.delete("q");
    }
    setSearchParams(next);
  };

  const handleSortChange = (val) => {
    const next = new URLSearchParams(searchParams);
    if (val && val !== "relevance") {
      next.set("sort", val);
    } else {
      next.delete("sort");
    }
    setSearchParams(next);
  };

  const handleFollowToggle = () => {
    const nextState = toggleFollowStore(safeSlug);
    setIsFollowed(nextState);
  };

  const handleChat = () => {
    const storeData = micrositeQuery.data?.data;
    const waUrl = toPreferredWhatsAppLink(
      storeData?.whatsapp || storeData?.phone,
      "",
      `Halo ${storeData?.name || "Store"}, saya ingin bertanya tentang produk Anda di TP Preneurs.`
    );
    if (waUrl) {
      window.open(waUrl, "_blank");
    } else if (storeData?.phone) {
      window.open(`tel:${storeData.phone}`);
    } else {
      window.location.href = "/contact-us";
    }
  };

  const handleEmail = () => {
    const storeData = micrositeQuery.data?.data;
    if (storeData?.email) {
      window.open(`mailto:${storeData.email}`);
    }
  };

  const handleCall = () => {
    const storeData = micrositeQuery.data?.data;
    if (storeData?.phone) {
      window.open(`tel:${storeData.phone}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: micrositeQuery.data?.data?.name || (isIndo ? "Toko" : "Store"),
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href).then(() => {
        toast.success(isIndo ? "Tautan toko berhasil disalin!" : "Store link copied to clipboard!");
      });
    }
  };

  const handleRetry = () => {
    micrositeQuery.refetch();
    productsQuery.refetch();
    richAboutQuery.refetch();
  };

  // Operational & Error state checks
  const isNotFound = micrositeQuery.error?.response?.status === 404;
  const storeData = micrositeQuery.data?.data;
  const isStoreInactive =
    storeData &&
    (String(storeData.status?.code || "").toUpperCase() === "INACTIVE" ||
      (storeData.summary?.operationalReadiness &&
        !storeData.summary.operationalReadiness.isReady));

  // --- RENDER CONDITIONAL BRANCHES (All Hooks already executed above) ---

  // A. Missing slug
  if (!safeSlug) {
    return (
      <StoreMicrositeShell safeSlug="" hideHero={true}>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <UiEmptyState
            title={isIndo ? "Tautan toko tidak valid" : "Invalid store link"}
            description={
              isIndo
                ? "Format tautan toko yang Anda akses tidak sesuai. Silakan kembali ke beranda."
                : "The store URL accessed is invalid. Please return to the homepage."
            }
            actions={
              <Link
                to="/"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-[#034c85] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#023864] transition-colors"
              >
                {isIndo ? "Kembali ke Beranda" : "Back to Marketplace"}
              </Link>
            }
          />
        </div>
      </StoreMicrositeShell>
    );
  }

  // B. Loading state
  if (micrositeQuery.isLoading && !micrositeQuery.data) {
    return (
      <StoreMicrositeShell safeSlug={safeSlug} hideHero={true}>
        <div className="mx-auto flex min-h-[50vh] max-w-4xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="relative flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-800" />
            <div className="absolute inset-0 rounded-full border-4 border-[#034c85] border-t-transparent animate-spin" />
            <StoreIcon size={22} className="text-[#034c85]" />
          </div>
          <h3 className="mt-5 text-base font-bold text-slate-800 dark:text-slate-100">
            {isIndo ? "Memuat Etalase Toko..." : "Loading Storefront..."}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {isIndo ? "Menyiapkan identitas dan produk toko..." : "Preparing store details and catalog..."}
          </p>
        </div>
      </StoreMicrositeShell>
    );
  }

  // C. Store not found (404)
  if (isNotFound) {
    return (
      <StoreMicrositeShell safeSlug={safeSlug} hideHero={true}>
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200/80 bg-white/95 p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900/90 sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-[#034c85] dark:bg-slate-800 dark:text-sky-400">
              <StoreIcon size={32} />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
              {isIndo ? "Toko Tidak Ditemukan" : "Store Not Found"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              {isIndo
                ? `Toko dengan tautan "/store/${safeSlug}" tidak terdaftar atau belum aktif di TP Preneurs.`
                : `We could not find an active registered store for "/store/${safeSlug}".`}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#034c85] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#023864] transition-colors"
              >
                <ArrowLeft size={16} />
                {isIndo ? "Kembali ke Beranda" : "Back to Home"}
              </Link>
              <Link
                to="/search"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Search size={16} />
                {isIndo ? "Cari Produk Lain" : "Explore Products"}
              </Link>
            </div>
          </div>
        </div>
      </StoreMicrositeShell>
    );
  }

  // D. Store Inactive / Needs Setup / Operational Gated
  if (isStoreInactive) {
    const storeName = storeData?.name || safeSlug;
    const storeLogo = storeData?.logoUrl;
    const storeWa = storeData?.whatsapp || storeData?.phone;
    const storeEmail = storeData?.email;

    return (
      <StoreMicrositeShell safeSlug={safeSlug} identity={storeData} hideHero={true}>
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header banner strip with brand colors */}
            <div className="h-32 bg-gradient-to-r from-[#034c85] via-[#023864] to-[#fe6f05] relative">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]" />
            </div>

            {/* Content area */}
            <div className="relative px-6 pb-8 pt-0 sm:px-10 sm:pb-10">
              {/* Avatar overlap */}
              <div className="-mt-14 mb-4 flex items-center justify-between">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden dark:border-slate-900 dark:bg-slate-800">
                  {storeLogo ? (
                    <img
                      src={storeLogo}
                      alt={storeName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#034c85]/10 text-xl font-bold text-[#034c85] dark:text-sky-400">
                      {storeName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                  <Clock size={13} className="text-amber-600 dark:text-amber-400" />
                  {isIndo ? "Toko Sedang Dalam Persiapan" : "Store Under Preparation"}
                </span>
              </div>

              {/* Title & info */}
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white sm:text-3xl">
                  {storeName}
                </h1>
                <p className="mt-0.5 text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400">
                  @{safeSlug} • TP Preneurs Official Merchant
                </p>
              </div>

              <div className="mt-6 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-[#034c85]/10 p-2 text-[#034c85] dark:bg-sky-500/15 dark:text-sky-300">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isIndo
                        ? "Toko Resmi Sedang Menyiapkan Etalase Produk"
                        : "Official Store is Preparing Catalog"}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {isIndo
                        ? `Toko "${storeName}" telah resmi disetujui di ekosistem TP Preneurs dan saat ini sedang mempersiapkan daftar produk serta operasional pengiriman. Silakan kembali dalam waktu dekat untuk menemukan penawaran terbaik!`
                        : `The store "${storeName}" has been officially approved in the TP Preneurs ecosystem and is currently setting up its product catalog and shipping fulfillment. Please check back soon for great deals!`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact actions if available */}
              {(storeWa || storeEmail) && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {isIndo ? "Kontak Langsung Penjual" : "Direct Seller Contact"}
                  </h4>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {storeWa && (
                      <button
                        type="button"
                        onClick={handleChat}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                      >
                        <MessageCircleMore size={15} />
                        {isIndo ? "Chat WhatsApp" : "WhatsApp"}
                      </button>
                    )}
                    {storeEmail && (
                      <button
                        type="button"
                        onClick={handleEmail}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 transition-colors"
                      >
                        <Mail size={15} />
                        {storeEmail}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation CTAs */}
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-6 dark:border-slate-800">
                <Link
                  to="/"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#034c85] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#023864] transition-colors"
                >
                  <ArrowLeft size={16} />
                  {isIndo ? "Kembali ke Beranda" : "Back to Home"}
                </Link>
                <Link
                  to="/search"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#fe6f05] px-6 text-sm font-semibold text-white shadow-sm hover:bg-[#e05e00] transition-colors"
                >
                  <Sparkles size={16} />
                  {isIndo ? "Jelajahi Produk Lain" : "Explore Other Products"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </StoreMicrositeShell>
    );
  }

  // E. Normal Active Store: Full Storefront
  return (
    <StoreMicrositeShell
      identity={micrositeQuery.data?.data}
      safeSlug={safeSlug}
      description={vm.store.description}
      compact={false}
      hideHero={true}
    >
      <StoreMicrosite2026View
        vm={vm}
        loading={micrositeQuery.isLoading && !micrositeQuery.data}
        productsLoading={productsQuery.isLoading || productsQuery.isFetching}
        error={micrositeQuery.isError}
        activeTab={activeTab}
        searchValue={activeSearchQuery}
        sortValue={sortValue}
        isFollowed={isFollowed}
        onRetry={handleRetry}
        onTabChange={handleTabChange}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        onSortChange={handleSortChange}
        onFollowToggle={handleFollowToggle}
        onChat={handleChat}
        onEmail={handleEmail}
        onCall={handleCall}
        onShare={handleShare}
      />
    </StoreMicrositeShell>
  );
}
