import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { fetchStoreProducts } from "../../api/public/storeProducts.ts";
import { getStoreMicrositeRichAboutBySlug } from "../../api/public/storeCustomizationPublic.ts";
import { getStorePublicIdentityBySlug } from "../../api/public/storePublicIdentity.ts";
import { buildStoreMicrosite2026ViewModel } from "./microsite2026/storeMicrosite2026Adapter.js";
import StoreMicrosite2026View from "./microsite2026/StoreMicrosite2026View.jsx";
import StoreMicrositeShell from "../../components/store/StoreMicrositeShell.jsx";
import { UiEmptyState, UiErrorState } from "../../components/primitives/state/index.js";
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
      stores = stores.filter(s => s !== slug);
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

  const activeTabFromQuery = toText(searchParams.get("view"), "home").toLowerCase();
  const activeSearchQuery = toText(searchParams.get("q") || searchParams.get("query") || searchParams.get("search"));
  const sortValue = toText(searchParams.get("sort"), "relevance").toLowerCase();

  const [activeTab, setActiveTab] = useState(activeTabFromQuery);
  const [isFollowed, setIsFollowed] = useState(() => isStoreFollowed(safeSlug));

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
        limit: 50, // Increase limit for client side operations if needed, or pagination
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

  // Sync tab state with query params
  useEffect(() => {
    if (activeTabFromQuery !== activeTab) {
      setActiveTab(activeTabFromQuery === "products" || activeTabFromQuery === "about" ? activeTabFromQuery : "home");
    }
  }, [activeTabFromQuery]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const next = new URLSearchParams(searchParams);
    next.set("view", tabId);
    setSearchParams(next, { replace: true });
    
    // Smooth scroll to top of tabs section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (val) => {
    // Just update UI state if needed, but we rely on form submit for actual query
  };

  const handleSearchSubmit = (e) => {
    if(e && e.preventDefault) e.preventDefault();
    const formData = new FormData(e.target);
    const val = formData.get("q") || e.target[0].value;
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set("q", val);
      next.set("view", "products"); // switch to products tab automatically
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
    if (storeData?.whatsapp) {
      const waNumber = storeData.whatsapp.replace(/\D+/g, "");
      window.open(`https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(storeData.name || 'Store')},%20I%20have%20a%20question.`, '_blank');
    } else if (storeData?.phone) {
      window.open(`tel:${storeData.phone}`);
    } else {
      // Fallback
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
      navigator.share({
        title: micrositeQuery.data?.data?.name || "Store",
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href).then(() => {
        alert("Link copied to clipboard!");
      });
    }
  };

  const handleRetry = () => {
    micrositeQuery.refetch();
    productsQuery.refetch();
    richAboutQuery.refetch();
  };

  const isNotFound = micrositeQuery.error?.response?.status === 404;
  const isStoreOperationallyGated = micrositeQuery.data?.data?.summary?.operationalReadiness && !micrositeQuery.data.data.summary.operationalReadiness.isReady;

  if (!safeSlug) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <UiEmptyState
          title="Store slug is missing."
          description="Use a valid /store/:slug route."
          actions={
            <Link to="/" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back to Marketplace
            </Link>
          }
        />
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <UiEmptyState
          title="Store not found."
          description={`We could not find an eligible public store for "${safeSlug}".`}
          actions={
            <Link to="/" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back to Marketplace
            </Link>
          }
        />
      </div>
    );
  }

  if (isStoreOperationallyGated) {
    const readiness = micrositeQuery.data?.data?.summary?.operationalReadiness || {};
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <UiEmptyState
          title={readiness.label || "Store Currently Unavailable"}
          description={readiness.description || `The store "${safeSlug}" is not operational yet and cannot be accessed on public storefront routes.`}
          actions={
            <Link to="/" className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back to Marketplace
            </Link>
          }
        />
      </div>
    );
  }

  // Use adapter to build view model
  const vm = useMemo(() => {
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
       // Relevance / Popular
       sortedProducts.sort((a, b) => {
          const reviewDiff = (Number(b?.reviewCount) || 0) - (Number(a?.reviewCount) || 0);
          if (reviewDiff !== 0) return reviewDiff;
          return (Number(b?.ratingAvg) || 0) - (Number(a?.ratingAvg) || 0);
       });
    }
    
    // Apply store-scoped links to product cards
    const applyProductLinks = (productsArray) => {
       return productsArray.map(product => {
         const productSlug = toText(product?.routeSlug || product?.slug || product?.id);
         const productHref = productSlug ? `/store/${encodeURIComponent(baseVm.slug)}/products/${encodeURIComponent(productSlug)}` : `/product/${productSlug}`;
         return {
           ...product,
           productHref
         };
       });
    };

    return {
      ...baseVm,
      products: applyProductLinks(sortedProducts),
      featuredProducts: applyProductLinks(baseVm.featuredProducts)
    };
  }, [micrositeQuery.data, productsQuery.data, richAboutQuery.data, safeSlug, sortValue]);

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
