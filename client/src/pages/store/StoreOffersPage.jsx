import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Check,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Percent,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Ticket,
} from "lucide-react";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { fetchStoreCoupons } from "../../api/storeCoupons.ts";
import { useCart } from "../../hooks/useCart.ts";
import { useProducts } from "../../storefront.jsx";
import { formatCurrency } from "../../utils/format.js";
import { productHasVariantSelections } from "../../utils/publicProductVariations.js";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import ShopProductCard2026 from "./shop2026/ShopProductCard2026.jsx";
import ShopQuickViewModal2026 from "./shop2026/ShopQuickViewModal2026.jsx";
import {
  buildShopCartSnapshot,
  mapProductToShopCard,
} from "./shop2026/shopProductAdapter.js";
import "./store-offers-2026.css";
import "./shop2026/shop-2026-redesign.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const toBool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
};

const toPlainObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const normalizeOffers = (raw, isIndo) => {
  const source = toPlainObject(raw);
  const pageHeader = toPlainObject(source.pageHeader);
  const superDiscount = toPlainObject(source.superDiscount);
  const dealsSection = toPlainObject(source.dealsSection);

  const defaultEyebrow = isIndo ? "MEGA OFFER & PROMO" : "MEGA OFFER & PROMOTIONS";
  const defaultTitle = isIndo ? "Mega Offer & Diskon Eksklusif" : "Exclusive Mega Offer";
  const defaultDesc = isIndo
    ? "Dapatkan penawaran terbaik dan kupon diskon spesial untuk produk edukasi pilihan."
    : "Discover the best limited-time deals and discount coupons for top educational products.";

  const defaultDealsTitle = isIndo ? "Koleksi Produk Diskon" : "Discounted Deals Collection";
  const defaultDealsDesc = isIndo
    ? "Hemat lebih banyak untuk karya inovasi dan media belajar."
    : "Save big on student innovation works and digital learning products.";

  return {
    pageHeader: {
      enabled: toBool(pageHeader.enabled, true),
      eyebrow: toText(pageHeader.eyebrow, defaultEyebrow),
      pageTitle: toText(pageHeader.pageTitle, defaultTitle),
      description: toText(pageHeader.description, defaultDesc),
      backgroundImageDataUrl: toText(
        pageHeader.backgroundImageDataUrl ||
          pageHeader.backgroundImage ||
          pageHeader.imageDataUrl ||
          pageHeader.image,
        ""
      ),
    },
    superDiscount: {
      enabled: toBool(superDiscount.enabled, true),
      activeCouponCode: toText(
        superDiscount.activeCouponCode ?? superDiscount.couponCode,
        "ALL"
      ).toUpperCase(),
    },
    dealsSection: {
      enabled: toBool(dealsSection.enabled, true),
      title: toText(dealsSection.title, defaultDealsTitle),
      description: toText(dealsSection.description, defaultDealsDesc),
    },
  };
};

function OffersSkeleton() {
  return (
    <div className="tp-offers-container space-y-8">
      <div className="tp-offers-skeleton-hero" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

export default function StoreOffersPage() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useStorefrontWishlist();

  const [copiedCode, setCopiedCode] = useState("");
  const [quickViewCard, setQuickViewCard] = useState(null);

  const isIndo =
    i18n.language === "id" ||
    i18n.language === "id-ID" ||
    i18n.language?.startsWith("id") ||
    (typeof window !== "undefined" && localStorage.getItem("store_language") === "Indonesia");
  const lang = isIndo ? "id" : "en";

  // Fetch offers customization
  const offersQuery = useQuery({
    queryKey: ["store-customization", "offers-page", lang],
    queryFn: () => getStoreCustomization({ lang, include: "offers" }),
    staleTime: 60_000,
  });

  // Fetch public coupons
  const couponsQuery = useQuery({
    queryKey: ["store-coupons-all"],
    queryFn: () => fetchStoreCoupons(),
    staleTime: 60_000,
  });

  // Fetch discounted products
  const productsQuery = useProducts({
    discounted: true,
    limit: 12,
  });

  const offersRaw = offersQuery.data?.customization?.offers;
  const offers = useMemo(() => normalizeOffers(offersRaw, isIndo), [offersRaw, isIndo]);

  // Public coupons list
  const publicCoupons = useMemo(() => {
    const raw = couponsQuery.data?.data ?? couponsQuery.data ?? [];
    if (!Array.isArray(raw)) return [];
    return raw.filter((c) => c && c.code);
  }, [couponsQuery.data]);

  // Featured coupon based on activeCouponCode
  const featuredCoupon = useMemo(() => {
    if (!offers.superDiscount.activeCouponCode || offers.superDiscount.activeCouponCode === "ALL") {
      return publicCoupons[0] || null;
    }
    return (
      publicCoupons.find(
        (c) => c.code.toUpperCase() === offers.superDiscount.activeCouponCode.toUpperCase()
      ) || publicCoupons[0] || null
    );
  }, [offers.superDiscount.activeCouponCode, publicCoupons]);

  // Normalized product cards
  const productCards = useMemo(() => {
    const items = productsQuery.data?.items ?? productsQuery.data?.data?.items ?? [];
    if (!Array.isArray(items)) return [];
    return items.map((p) => mapProductToShopCard(p));
  }, [productsQuery.data]);

  // Handle coupon copy
  const handleCopyCoupon = (code) => {
    if (!code || !navigator?.clipboard?.writeText) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      toast.success(
        isIndo
          ? `Kode voucher "${code}" berhasil disalin!`
          : `Coupon code "${code}" copied!`
      );
      setTimeout(() => setCopiedCode(""), 2200);
    }).catch(() => {
      toast.error(isIndo ? "Gagal menyalin kode." : "Failed to copy code.");
    });
  };

  // Cart actions
  const addCardToCart = async (card) => {
    if (productHasVariantSelections(card.raw?.variations)) {
      toast(
        isIndo
          ? "Pilih opsi produk sebelum menambahkannya ke keranjang."
          : "Choose product options before adding it to your cart."
      );
      navigate(card.href);
      return false;
    }

    const added = await cart.add(card.id, 1, buildShopCartSnapshot(card));
    if (added) {
      toast.success(
        isIndo ? `${card.name} ditambahkan ke keranjang.` : `${card.name} added to cart.`
      );
    } else if (!productHasVariantSelections(card.raw?.variations)) {
      toast.error(
        isIndo
          ? "Gagal menambahkan produk. Silakan coba lagi."
          : "Failed to add product. Please try again."
      );
    }
    return added;
  };

  const buyCardNow = async (card) => {
    const added = await addCardToCart(card);
    if (added) navigate("/cart");
  };

  if (offersQuery.isLoading) return <OffersSkeleton />;

  const isHeaderEnabled = offers.pageHeader.enabled;
  const hasHeaderBackground = Boolean(offers.pageHeader.backgroundImageDataUrl);
  const shouldRenderSuperDiscount = offers.superDiscount.enabled;
  const shouldRenderDeals = offers.dealsSection.enabled;

  return (
    <div className="tp-offers-container">
      {/* 1. HERO BANNER */}
      {isHeaderEnabled ? (
        <header
          className={`tp-offers-hero ${hasHeaderBackground ? "has-custom-bg" : ""}`}
          style={
            hasHeaderBackground
              ? {
                  backgroundImage: `linear-gradient(rgba(3, 76, 133, 0.88), rgba(2, 43, 77, 0.94)), url("${offers.pageHeader.backgroundImageDataUrl}")`,
                }
              : undefined
          }
        >
          <div className="tp-offers-hero__content">
            <div className="tp-offers-hero__eyebrow">
              <span className="tp-offers-hero__dot" />
              <span>{offers.pageHeader.eyebrow}</span>
            </div>

            <h1 className="tp-offers-hero__title">{offers.pageHeader.pageTitle}</h1>
            <p className="tp-offers-hero__desc">{offers.pageHeader.description}</p>

            <div className="tp-offers-hero__badges">
              <div className="tp-offers-hero__pill">
                <Flame />
                <span>{isIndo ? "Penawaran Terbatas" : "Limited Time"}</span>
              </div>
              <div className="tp-offers-hero__pill">
                <ShieldCheck />
                <span>{isIndo ? "Voucher Terverifikasi" : "Verified Coupons"}</span>
              </div>
              <div className="tp-offers-hero__pill">
                <ShoppingBag />
                <span>{isIndo ? "Diskon Otomatis" : "Instant Savings"}</span>
              </div>
            </div>

            {/* Featured Coupon pill in hero if enabled */}
            {shouldRenderSuperDiscount && featuredCoupon ? (
              <div className="tp-offers-super-badge">
                <Ticket className="h-4 w-4 text-[#fe6f05]" />
                <span className="text-xs font-semibold text-slate-200">
                  {isIndo ? "Kupon Unggulan:" : "Featured Coupon:"}
                </span>
                <span className="tp-offers-super-badge__code">{featuredCoupon.code}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(featuredCoupon.code)}
                  className="tp-offers-super-badge__btn"
                >
                  {copiedCode === featuredCoupon.code ? (
                    <>
                      <Check className="h-3 w-3" />
                      <span>{isIndo ? "Tersalin" : "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>{isIndo ? "Salin Kode" : "Copy Code"}</span>
                    </>
                  )}
                </button>
              </div>
            ) : null}
          </div>
        </header>
      ) : null}

      {/* 2. VOUCHERS / COUPONS SECTION */}
      {shouldRenderSuperDiscount ? (
        <section className="mt-8 sm:mt-12">
          <div className="tp-offers-section-header">
            <div>
              <div className="tp-offers-section-header__tag">
                {isIndo ? "Voucher Belanja" : "Shopping Vouchers"}
              </div>
              <h2 className="tp-offers-section-header__title">
                {isIndo ? "Klaim Voucher Diskon Spesial" : "Claim Special Discount Vouchers"}
              </h2>
              <p className="tp-offers-section-header__desc">
                {isIndo
                  ? "Salin kode voucher di bawah dan gunakan saat checkout."
                  : "Copy coupon codes below and apply them during checkout for instant savings."}
              </p>
            </div>
          </div>

          {publicCoupons.length > 0 ? (
            <div className="tp-offers-vouchers-grid">
              {publicCoupons.map((coupon) => {
                const isPercent = coupon.discountType === "percent";
                const discountDisplay = isPercent
                  ? `${coupon.amount}% OFF`
                  : `${formatCurrency(coupon.amount)} OFF`;
                const isCopied = copiedCode === coupon.code;

                return (
                  <article key={coupon.id || coupon.code} className="tp-voucher-card">
                    <div className="tp-voucher-card__top">
                      <div className="tp-voucher-card__discount">{discountDisplay}</div>
                      <span className="tp-voucher-card__badge">
                        {coupon.scopeType === "PLATFORM" ? "Platform" : "Store"}
                      </span>
                    </div>

                    <div className="tp-voucher-card__body">
                      <h3 className="tp-voucher-card__name">
                        {coupon.campaignName ||
                          (isIndo ? "Voucher Diskon Spesial" : "Special Discount Coupon")}
                      </h3>

                      <p className="tp-voucher-card__condition">
                        {coupon.minSpend > 0
                          ? isIndo
                            ? `Min. belanja ${formatCurrency(coupon.minSpend)}`
                            : `Min. spend ${formatCurrency(coupon.minSpend)}`
                          : isIndo
                            ? "Tanpa minimum belanja"
                            : "No minimum spend"}
                      </p>

                      <div className="tp-voucher-card__code-row">
                        <span className="tp-voucher-card__code">{coupon.code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyCoupon(coupon.code)}
                          className={`tp-voucher-card__copy-btn ${isCopied ? "is-copied" : ""}`}
                          aria-label={`Copy coupon ${coupon.code}`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              <span>{isIndo ? "Tersalin" : "Copied"}</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>{isIndo ? "Salin" : "Copy"}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <Ticket className="mx-auto h-8 w-8 text-[#fe6f05]" />
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isIndo ? "Kupon voucher sedang disiapkan." : "Vouchers are being prepared."}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isIndo
                  ? "Cek kembali secara berkala untuk promo menarik berikutnya."
                  : "Please check back soon for our next promotional deals."}
              </p>
            </div>
          )}
        </section>
      ) : null}

      {/* 3. DEALS CATALOG SECTION */}
      {shouldRenderDeals ? (
        <section className="mt-10 sm:mt-14">
          <div className="tp-offers-section-header">
            <div>
              <div className="tp-offers-section-header__tag">
                {isIndo ? "Katalog Promo" : "Promo Catalog"}
              </div>
              <h2 className="tp-offers-section-header__title">{offers.dealsSection.title}</h2>
              <p className="tp-offers-section-header__desc">{offers.dealsSection.description}</p>
            </div>

            <Link
              to="/shop"
              className="mt-3 sm:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-[#034c85] transition hover:text-[#fe6f05] dark:text-sky-400"
            >
              <span>{isIndo ? "Lihat Semua Produk" : "View All Products"}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {productsQuery.isLoading ? (
            <div className="tp-offers-products-grid">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : productCards.length > 0 ? (
            <div className="tp-offers-products-grid">
              {productCards.map((card) => (
                <ShopProductCard2026
                  key={card.id}
                  card={card}
                  isWishlisted={wishlist.has(card.id)}
                  onToggleWishlist={() => wishlist.toggle(card.id)}
                  onQuickView={() => setQuickViewCard(card)}
                  onAdd={addCardToCart}
                  onBuyNow={buyCardNow}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <ShoppingBag className="mx-auto h-8 w-8 text-[#034c85]" />
              <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                {isIndo ? "Belum ada produk diskon aktif saat ini." : "No discounted items active right now."}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {isIndo
                  ? "Kunjungi katalog utama untuk melihat semua produk inovasi edukasi kami."
                  : "Visit our shop catalog to browse all educational innovation products."}
              </p>
              <Link
                to="/shop"
                className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-[#034c85] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#02335a]"
              >
                {isIndo ? "Buka Katalog Belanja" : "Open Shop Catalog"}
              </Link>
            </div>
          )}
        </section>
      ) : null}

      {/* Quick View Modal */}
      <ShopQuickViewModal2026
        card={quickViewCard}
        onClose={() => setQuickViewCard(null)}
        onAdd={addCardToCart}
        onBuyNow={buyCardNow}
      />
    </div>
  );
}
