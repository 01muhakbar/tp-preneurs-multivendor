import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowUpDown,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Headset,
  Heart,
  Mail,
  MapPin,
  MessageCircleMore,
  Package,
  PhoneCall,
  Search,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCart } from "../../../hooks/useCart.ts";
import { formatCurrency } from "../../../utils/format.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { resolveProductImageUrl } from "../../../utils/productImage.js";
import { productHasVariantSelections } from "../../../utils/publicProductVariations.js";
import VariantQuickAddModal from "../../../components/store/VariantQuickAddModal.jsx";
import "./store-microsite-2026.css";

function formatJoinedDate(dateValue, isIndo = true) {
  if (!dateValue) return isIndo ? "Toko Baru" : "New Store";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return isIndo ? "Toko Baru" : "New Store";
  return new Intl.DateTimeFormat(isIndo ? "id-ID" : "en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function MicrositeProductCard({ product, isIndo = true }) {
  const navigate = useNavigate();
  const { add, isLoading } = useCart();
  const resolvedImage = useMemo(() => resolveProductImageUrl(product), [product]);
  const [imageSrc, setImageSrc] = useState(resolvedImage);
  const [isAdding, setIsAdding] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const timerRef = useRef(null);

  const productId = product?.id ?? product?.slug;
  const productSlug = String(product?.routeSlug || product?.slug || product?.id || "").trim();
  const storeSlug = String(product?.storeSlug || "").trim();

  const productHref = useMemo(() => {
    if (productSlug) {
      return `/product/${encodeURIComponent(productSlug)}`;
    }
    if (productId) {
      return `/product/${encodeURIComponent(String(productId))}`;
    }
    const explicitHref = String(product?.productHref || "").trim();
    if (explicitHref && !explicitHref.includes("/products/")) return explicitHref;
    return "";
  }, [productId, productSlug, product?.productHref]);

  const productName = product?.name || product?.title || (isIndo ? "Produk" : "Product");
  const ratingValue = Number(product?.rating ?? product?.averageRating ?? 0);
  const safeRating = Number.isFinite(ratingValue) && ratingValue > 0 ? ratingValue : 4.5;
  const price = Number(product?.price ?? product?.salePrice ?? 0);
  const originalPrice = Number(product?.originalPrice ?? 0);
  const discountPercent = Number(product?.discountPercent ?? 0);
  const hasDiscount = discountPercent > 0 || (originalPrice > price && price > 0);
  const stockValue = Number(product?.stock);
  const isOutOfStock = Number.isFinite(stockValue) && stockValue <= 0;
  const purchaseState = product?.purchaseState || null;
  const isPurchasable =
    typeof purchaseState?.isPurchasable === "boolean"
      ? purchaseState.isPurchasable
      : !isOutOfStock;
  const hasVariants = productHasVariantSelections(product?.variations);
  const categoryName = product?.category?.name || product?.categoryName || (isIndo ? "Produk" : "Item");

  useEffect(() => {
    setImageSrc(resolvedImage);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resolvedImage]);

  const openProduct = () => {
    if (productHref) {
      navigate(productHref);
    } else if (productSlug) {
      navigate(`/product/${encodeURIComponent(productSlug)}`);
    } else if (productId) {
      navigate(`/product/${encodeURIComponent(String(productId))}`);
    }
  };

  const handleAdd = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (hasVariants) {
      setIsVariantModalOpen(true);
      return;
    }
    if (isAdding || !isPurchasable) return;
    setIsAdding(true);
    add(product?.id, 1, {
      name: productName,
      price: product?.price,
      imageUrl: imageSrc,
    });
    toast.success(isIndo ? "Ditambahkan ke keranjang" : "Added to cart", {
      id: `add-cart-${product?.id}`,
      duration: 2000,
    });
    timerRef.current = setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return (
    <>
      <article className="ms-product-card group">
        <div
          role="button"
          tabIndex={0}
          onClick={openProduct}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openProduct();
            }
          }}
          className="cursor-pointer flex flex-col h-full text-left focus:outline-none"
        >
          {/* Thumbnail box */}
          <div className="ms-product-img-box">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={productName}
                onError={() => setImageSrc("")}
                className="ms-product-img"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <ShoppingBag className="w-8 h-8 opacity-40" />
              </div>
            )}

            {hasDiscount && (
              <span className="ms-product-badge-discount">
                {discountPercent > 0 ? `-${Math.round(discountPercent)}%` : "PROMO"}
              </span>
            )}

            {/* Quick view button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                openProduct();
              }}
              aria-label={isIndo ? "Lihat Produk" : "View Product"}
              className="absolute bottom-2.5 left-2.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition hover:bg-white hover:text-[#034c85] dark:bg-slate-900/90 dark:text-slate-200"
            >
              <Eye size={14} />
            </button>
          </div>

          {/* Info section */}
          <div className="ms-product-info">
            <span className="ms-product-category truncate">{categoryName}</span>

            <h3 className="ms-product-title" title={productName}>
              {productName}
            </h3>

            {/* Rating */}
            <div className="ms-product-rating">
              <span className="text-[#f59e0b] font-black text-xs">★</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {safeRating.toFixed(1)}
              </span>
            </div>

            {/* Price and Cart Action */}
            <div className="ms-product-price-row">
              <div className="min-w-0">
                <span className="ms-product-price block">
                  {formatCurrency(price)}
                </span>
                {hasDiscount && originalPrice > price && (
                  <span className="text-[11px] text-slate-400 line-through block -mt-0.5">
                    {formatCurrency(originalPrice)}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={handleAdd}
                disabled={isAdding || isLoading || !isPurchasable}
                aria-label={isIndo ? "Tambah ke Keranjang" : "Add to Cart"}
                title={isIndo ? "Tambah ke Keranjang" : "Add to Cart"}
                className="ms-product-btn-cart"
              >
                {!isPurchasable ? (
                  <span className="text-[10px] font-bold">Habis</span>
                ) : isAdding ? (
                  <Check size={16} className="text-white animate-pulse" />
                ) : (
                  <ShoppingCart size={15} />
                )}
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Quick Add Variant Modal if product has variations */}
      {isVariantModalOpen && (
        <VariantQuickAddModal
          product={product}
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
        />
      )}
    </>
  );
}

function StoreHero({
  store,
  onChat,
  onFollowToggle,
  isFollowed,
  onShare,
  isIndo = true,
  T,
}) {
  const logoSrc = resolveAssetUrl(store.logoUrl);
  const bannerSrc = resolveAssetUrl(store.bannerUrl);
  const [logoLoadError, setLogoLoadError] = useState(false);
  const [bannerLoadError, setBannerLoadError] = useState(false);

  const hasValidBanner = Boolean(bannerSrc) && !bannerLoadError;
  const hasValidLogo = Boolean(logoSrc) && !logoLoadError;

  const joinedText = useMemo(() => {
    return formatJoinedDate(store.createdAt, isIndo);
  }, [store.createdAt, isIndo]);

  return (
    <div className="ms-hero-card">
      {/* Universal Top-Right Share Button */}
      <button
        type="button"
        onClick={onShare}
        className="ms-btn-share-top"
        title={T.share}
        aria-label={T.share}
      >
        <Share2 size={16} />
      </button>

      {/* Banner artwork */}
      {hasValidBanner ? (
        <>
          <img
            src={bannerSrc}
            alt=""
            aria-hidden="true"
            className="ms-hero-banner-img"
            onError={() => setBannerLoadError(true)}
          />
          <div className="ms-hero-scrim" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-[#034c85] via-[#023a66] to-[#01223e]" />
      )}

      {/* Hero Content */}
      <div className="ms-hero-content grid gap-4 lg:gap-8 lg:grid-cols-[1fr_auto] items-center">
        {/* Left Column: Logo & Store Info */}
        <div className="ms-hero-info-panel flex flex-col sm:flex-row items-start sm:items-center gap-3.5 sm:gap-6 min-w-0">
          {/* Mobile Top Row: Avatar + Name / Badges */}
          <div className="flex items-start gap-3.5 sm:hidden w-full pr-12">
            <div className="ms-hero-logo ms-hero-logo-mobile shrink-0">
              {hasValidLogo ? (
                <img
                  src={logoSrc}
                  alt={`${store.name} Logo`}
                  className="w-full h-full object-contain p-1"
                  onError={() => setLogoLoadError(true)}
                  loading="eager"
                />
              ) : (
                <Store className="w-7 h-7 text-[#034c85]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="ms-badge-store text-[10px] h-5 px-2">
                  <Store size={10} />
                  {T.store}
                </span>
                <span className="ms-badge-operational text-[10px] h-5 px-2">
                  <CheckCircle2 size={10} />
                  {store.isOperational ? T.operational : T.store}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug break-words">
                {store.name}
              </h1>
              {store.handle && (
                <p className="text-[11px] text-slate-300 font-medium">
                  {store.handle}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Logo Avatar (hidden on mobile via ms-hero-logo-desktop) */}
          <div className="ms-hero-logo ms-hero-logo-desktop shrink-0">
            {hasValidLogo ? (
              <img
                src={logoSrc}
                alt={`${store.name} Logo`}
                className="w-full h-full object-contain p-1.5"
                onError={() => setLogoLoadError(true)}
                loading="eager"
              />
            ) : (
              <Store className="w-10 h-10 text-[#034c85]" />
            )}
          </div>

          {/* Details (Shared) */}
          <div className="space-y-2 min-w-0 flex-1 w-full">
            {/* Desktop Only Badges & Name */}
            <div className="hidden sm:block space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="ms-badge-store">
                  <Store size={12} />
                  {T.store}
                </span>
                <span className="ms-badge-operational">
                  <CheckCircle2 size={12} />
                  {store.isOperational ? T.operational : T.store}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight break-words">
                {store.name}
              </h1>
              {store.handle && (
                <p className="text-xs sm:text-sm text-slate-200/90 font-medium">
                  {store.handle}
                </p>
              )}
            </div>

            {store.description && (
              <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed max-w-2xl line-clamp-2">
                {store.description}
              </p>
            )}

            {store.addressLabel && (
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-200/90 max-w-full">
                <MapPin size={13} className="text-[#fe6f05] shrink-0" />
                <span className="truncate">{store.addressLabel}</span>
              </div>
            )}

            {/* Actions: Chat & Follow */}
            <div className="flex items-center gap-2.5 pt-1.5 flex-wrap">
              <button
                type="button"
                onClick={onChat}
                className="ms-btn-chat"
                aria-label={T.chat}
              >
                <MessageCircleMore size={16} />
                <span>{T.chat}</span>
              </button>

              <button
                type="button"
                onClick={onFollowToggle}
                className={`ms-btn-follow ${isFollowed ? "is-following" : ""}`}
                aria-label={isFollowed ? T.following : T.follow}
              >
                <Heart size={15} className={isFollowed ? "fill-[#fe6f05] text-[#fe6f05]" : ""} />
                <span>{isFollowed ? T.following : T.follow}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Key Metrics (Clean & Compact) */}
        <div className="ms-hero-stats-grid">
          <div className="ms-stat-box">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between gap-2">
              <span>{T.totalProducts}</span>
              <Package size={13} className="text-[#fe6f05]" />
            </span>
            <strong className="text-lg sm:text-2xl font-black text-white block mt-0.5">
              {store.productCount || 0}
            </strong>
            <span className="text-[11px] text-slate-300 font-medium">
              {T.itemsSuffix}
            </span>
          </div>

          <div className="ms-stat-box">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between gap-2">
              <span>{T.joinedSince}</span>
              <CalendarDays size={13} className="text-[#fe6f05]" />
            </span>
            <strong className="text-sm sm:text-base font-black text-white block mt-0.5">
              {joinedText}
            </strong>
            <span className="text-[11px] text-[#fe6f05] font-bold">
              {T.operationalLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StoreMicrosite2026View({
  vm,
  loading,
  productsLoading,
  error,
  activeTab,
  searchValue,
  sortValue,
  isFollowed,
  onRetry,
  onTabChange,
  onSearchChange,
  onSearchSubmit,
  onSortChange,
  onFollowToggle,
  onChat,
  onEmail,
  onCall,
  onShare,
}) {
  const { i18n } = useTranslation();
  const currentLang = String(i18n.language || "").toLowerCase();
  const isIndo =
    currentLang === "id" ||
    currentLang === "id-id" ||
    currentLang.startsWith("id") ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("store_language") === "Indonesia" ||
        localStorage.getItem("store_language") === "id"));

  const { store, products, featuredProducts, richAboutHtml } = vm;

  // Bilingual strings
  const T = useMemo(
    () =>
      isIndo
        ? {
            store: "Toko",
            verifiedStore: "Toko Resmi",
            operational: "Operasional",
            chat: "Chat Penjual",
            follow: "Ikuti Toko",
            following: "Mengikuti",
            share: "Bagikan",
            shareSuccess: "Tautan toko berhasil disalin!",
            tabHome: "Beranda Toko",
            tabProducts: "Semua Produk",
            tabAbout: "Tentang Toko",
            topPicks: "Produk Unggulan",
            topPicksSub: "Koleksi pilihan terbaik dari toko ini",
            viewAll: "Lihat Semua",
            allProducts: "Daftar Produk",
            allProductsSub: "Jelajahi seluruh produk yang tersedia dari toko ini",
            searchPlaceholder: "Cari produk di toko ini...",
            sortLabel: "Urutkan",
            sortRelevance: "Paling Sesuai",
            sortNewest: "Terbaru",
            sortPriceAsc: "Harga: Rendah ke Tinggi",
            sortPriceDesc: "Harga: Tinggi ke Rendah",
            noProductsTitle: "Belum Ada Produk",
            noProductsDesc: "Toko ini belum menambahkan produk publik.",
            noSearchTitle: "Produk Tidak Ditemukan",
            noSearchDesc: (q) => `Tidak ada produk yang cocok dengan pencarian "${q}".`,
            browseAll: "Lihat Semua Produk",
            aboutStore: "Tentang Toko",
            aboutStoreSub: "Informasi resmi dan kontak toko",
            storeProfile: "Profil Toko",
            storeLocation: "Lokasi & Alamat",
            storeContact: "Kontak Resmi",
            whatsapp: "WhatsApp Penjual",
            phone: "Nomor Telepon",
            email: "Email Resmi",
            storeStats: "Ringkasan Toko",
            totalProducts: "Total Produk",
            joinedSince: "Bergabung",
            itemsSuffix: "produk",
            statusLabel: "Status Toko",
            operationalLabel: "Toko Aktif",
            trustSecureTitle: "Transaksi Aman",
            trustSecureDesc: "Pembayaran terenkripsi dan terlindungi",
            trustQualityTitle: "Produk Terjamin",
            trustQualityDesc: "Produk asli langsung dari wirausaha terpercaya",
            trustSupportTitle: "Layanan Pembeli",
            trustSupportDesc: "Bantuan dan konsultasi langsung dengan penjual",
          }
        : {
            store: "Store",
            verifiedStore: "Official Store",
            operational: "Operational",
            chat: "Chat Seller",
            follow: "Follow Store",
            following: "Following",
            share: "Share",
            shareSuccess: "Store link copied to clipboard!",
            tabHome: "Store Home",
            tabProducts: "All Products",
            tabAbout: "About Store",
            topPicks: "Top Picks",
            topPicksSub: "Curated favorites from this store",
            viewAll: "View All",
            allProducts: "Products",
            allProductsSub: "Browse all available products from this store",
            searchPlaceholder: "Search products in this store...",
            sortLabel: "Sort By",
            sortRelevance: "Relevance",
            sortNewest: "Newest",
            sortPriceAsc: "Price: Low to High",
            sortPriceDesc: "Price: High to Low",
            noProductsTitle: "No Products Yet",
            noProductsDesc: "This store hasn't published any public products yet.",
            noSearchTitle: "No Products Found",
            noSearchDesc: (q) => `No products match your search for "${q}".`,
            browseAll: "Browse All Products",
            aboutStore: "About This Store",
            aboutStoreSub: "Official information and store contact",
            storeProfile: "Store Profile",
            storeLocation: "Location & Address",
            storeContact: "Official Contact",
            whatsapp: "Seller WhatsApp",
            phone: "Phone Number",
            email: "Official Email",
            storeStats: "Store Summary",
            totalProducts: "Total Products",
            joinedSince: "Joined",
            itemsSuffix: "items",
            statusLabel: "Store Status",
            operationalLabel: "Active Store",
            trustSecureTitle: "Secure Payments",
            trustSecureDesc: "Encrypted and protected checkout",
            trustQualityTitle: "Quality Assured",
            trustQualityDesc: "Authentic products directly from trusted entrepreneurs",
            trustSupportTitle: "Customer Support",
            trustSupportDesc: "Direct assistance and consultation with seller",
          },
    [isIndo]
  );

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    } else if (navigator.share) {
      navigator
        .share({
          title: store.name || "Store",
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href).then(() => {
        toast.success(T.shareSuccess);
      });
    }
  };

  if (loading) {
    return (
      <div className="store-microsite-2026 w-full mx-auto max-w-7xl px-4 py-8 space-y-6">
        <div className="h-[320px] w-full rounded-[28px] store-microsite-2026-skeleton" />
        <div className="h-12 w-80 rounded-full store-microsite-2026-skeleton" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-64 rounded-2xl store-microsite-2026-skeleton" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="store-microsite-2026 flex items-center justify-center min-h-[50vh] px-4">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-slate-600 dark:text-slate-300 font-medium">
            {isIndo
              ? "Gagal memuat profil toko. Silakan coba kembali."
              : "Failed to load the store. Please try again."}
          </p>
          <button
            onClick={onRetry}
            className="bg-[#034c85] text-white px-6 py-2.5 rounded-full font-bold hover:bg-[#023a66] transition shadow-md"
          >
            {isIndo ? "Muat Ulang" : "Retry"}
          </button>
        </div>
      </div>
    );
  }

  const renderEmptyProducts = (title, desc) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-700">
      <div className="h-14 w-14 bg-orange-50 text-[#fe6f05] rounded-full flex items-center justify-center mb-3.5 dark:bg-orange-950/40">
        <ShoppingBag size={24} />
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
        {title || T.noProductsTitle}
      </h3>
      <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-xs">
        {desc || T.noProductsDesc}
      </p>
      {searchValue && (
        <button
          onClick={() => {
            onSearchChange?.("");
            onSearchSubmit?.(new Event("submit"));
          }}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-xs font-bold text-[#034c85] hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400"
        >
          {T.browseAll}
        </button>
      )}
    </div>
  );

  return (
    <div className="store-microsite-2026">
      <main className="mx-auto max-w-[1440px] px-3.5 py-4 sm:px-6 lg:px-8 space-y-6">
        {/* 1. Hero Header Card */}
        <StoreHero
          store={store}
          onChat={onChat}
          onFollowToggle={onFollowToggle}
          isFollowed={isFollowed}
          onShare={handleShareClick}
          isIndo={isIndo}
          T={T}
        />

        {/* 2. Sticky Segmented Tabs Bar */}
        <div className="ms-tabs-bar">
          <div className="ms-tabs-scroll">
            {[
              { id: "home", label: T.tabHome },
              { id: "products", label: T.tabProducts, count: store.productCount || products.length },
              { id: "about", label: T.tabAbout },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  className={`ms-tab-btn ${isActive ? "is-active" : ""}`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && tab.count > 0 && (
                    <span className={`ms-tab-count ${isActive ? "is-active" : ""}`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Tab Contents */}
        <div className="space-y-6">
          {/* TAB 1: Store Home */}
          {activeTab === "home" && (
            <section className="ms-card-section">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-[#fe6f05] mb-0.5">
                    <Sparkles size={18} />
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {T.topPicks}
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                    {T.topPicksSub}
                  </p>
                </div>
                {products.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onTabChange("products")}
                    className="inline-flex h-9 items-center justify-center gap-1 rounded-full border border-slate-300 bg-white px-4 text-xs font-bold text-[#034c85] hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-blue-400 shrink-0 self-start sm:self-auto"
                  >
                    <span>{T.viewAll}</span>
                    <ChevronRight size={14} />
                  </button>
                )}
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-72 rounded-2xl store-microsite-2026-skeleton"
                    />
                  ))}
                </div>
              ) : featuredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                  {featuredProducts.map((product) => (
                    <MicrositeProductCard
                      key={product.id || product.slug}
                      product={product}
                      isIndo={isIndo}
                    />
                  ))}
                </div>
              ) : (
                renderEmptyProducts()
              )}
            </section>
          )}

          {/* TAB 2: All Products */}
          {activeTab === "products" && (
            <section className="ms-card-section">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {T.allProducts}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    {T.allProductsSub}
                  </p>
                </div>

                {/* Search & Sort Controls */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <form onSubmit={onSearchSubmit}>
                      <input
                        type="text"
                        name="q"
                        placeholder={T.searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="ms-search-input"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </form>
                  </div>

                  <div className="relative shrink-0">
                    <select
                      value={sortValue}
                      onChange={(e) => onSortChange?.(e.target.value)}
                      className="ms-sort-select"
                      aria-label={T.sortLabel}
                    >
                      <option value="relevance">{T.sortRelevance}</option>
                      <option value="newest">{T.sortNewest}</option>
                      <option value="price-asc">{T.sortPriceAsc}</option>
                      <option value="price-desc">{T.sortPriceDesc}</option>
                    </select>
                    <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <div
                      key={i}
                      className="h-72 rounded-2xl store-microsite-2026-skeleton"
                    />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                  {products.map((product) => (
                    <MicrositeProductCard
                      key={product.id || product.slug}
                      product={product}
                      isIndo={isIndo}
                    />
                  ))}
                </div>
              ) : (
                renderEmptyProducts(
                  T.noSearchTitle,
                  searchValue ? T.noSearchDesc(searchValue) : T.noProductsDesc
                )
              )}
            </section>
          )}

          {/* TAB 3: About Store */}
          {activeTab === "about" && (
            <section className="ms-card-section">
              <div className="mb-6">
                <div className="flex items-center gap-2 text-[#fe6f05] mb-0.5">
                  <Store size={20} />
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {T.aboutStore}
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  {T.aboutStoreSub}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                {/* Left: Store Profile Description */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 sm:p-6 dark:bg-slate-800/40 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#034c85] dark:bg-slate-700">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {store.name}
                      </h3>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {store.handle || T.verifiedStore}
                      </span>
                    </div>
                  </div>

                  {richAboutHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: richAboutHtml }}
                    />
                  ) : (
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {store.description || T.noProductsDesc}
                    </p>
                  )}
                </div>

                {/* Right: Real Contact, Location, & Summary */}
                <div className="space-y-4">
                  {/* Location Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:bg-slate-900 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center gap-2 text-[#034c85] dark:text-blue-400">
                      <MapPin size={16} />
                      <h4 className="text-xs font-bold uppercase tracking-wider">
                        {T.storeLocation}
                      </h4>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {store.addressLabel || (isIndo ? "Indonesia" : "Indonesia")}
                    </p>
                  </div>

                  {/* Contact Channels */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:bg-slate-900 dark:border-slate-700 space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#034c85] dark:text-blue-400">
                      {T.storeContact}
                    </h4>

                    <div className="space-y-2 pt-1">
                      {/* WhatsApp / Chat */}
                      <button
                        type="button"
                        onClick={onChat}
                        className="ms-contact-row w-full text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <MessageCircleMore size={16} className="text-[#fe6f05]" />
                          <span className="text-xs sm:text-sm font-semibold">
                            {T.whatsapp}
                          </span>
                        </div>
                        <ChevronRight size={14} className="text-slate-400" />
                      </button>

                      {/* Phone Call */}
                      {store.phone && (
                        <button
                          type="button"
                          onClick={onCall}
                          className="ms-contact-row w-full text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <PhoneCall size={16} className="text-[#034c85] dark:text-blue-400" />
                            <span className="text-xs sm:text-sm font-semibold truncate">
                              {store.phone}
                            </span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      )}

                      {/* Email */}
                      {store.email && (
                        <button
                          type="button"
                          onClick={onEmail}
                          className="ms-contact-row w-full text-left"
                        >
                          <div className="flex items-center gap-2.5">
                            <Mail size={16} className="text-slate-500" />
                            <span className="text-xs sm:text-sm font-semibold truncate">
                              {store.email}
                            </span>
                          </div>
                          <ChevronRight size={14} className="text-slate-400" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* 4. Compact Trust Strip */}
        <div className="ms-trust-strip">
          <div className="ms-trust-item">
            <div className="ms-trust-icon-box">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {T.trustSecureTitle}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {T.trustSecureDesc}
              </p>
            </div>
          </div>

          <div className="ms-trust-item">
            <div className="ms-trust-icon-box">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {T.trustQualityTitle}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {T.trustQualityDesc}
              </p>
            </div>
          </div>

          <div className="ms-trust-item">
            <div className="ms-trust-icon-box">
              <Headset size={20} />
            </div>
            <div>
              <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                {T.trustSupportTitle}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {T.trustSupportDesc}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
