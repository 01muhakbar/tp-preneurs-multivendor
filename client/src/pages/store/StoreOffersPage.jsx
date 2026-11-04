import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Check,
  Copy,
  ExternalLink,
  Flame,
  GraduationCap,
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

/* ---------------------------------------------------------
   BILINGUAL DICTIONARY & SMART RESOLVER
   Ensures accurate translations when language is toggled.
   --------------------------------------------------------- */
const OFFERS_BILINGUAL_MAP = {
  eyebrow: {
    id: "PROMO & PENAWARAN SPESIAL",
    en: "SPECIAL OFFERS & PROMOTIONS",
    aliases: [
      "promo & penawaran spesial",
      "penawaran spesial",
      "mega offer & promo",
      "special offers & promotions",
      "special offers",
      "mega offer & promotions",
      "exclusive mega deals",
      "mega promo",
      "promo spesial",
      "katalog promo",
    ],
  },
  pageTitle: {
    id: "Mega Offer",
    en: "Mega Offer",
    aliases: [
      "mega offer",
      "mega offer eksklusif",
      "exclusive mega offer",
      "mega offer & diskon eksklusif",
      "mega offer & diskon",
    ],
  },
  description: {
    id: "Nikmati penawaran harga terbaik untuk produk kreatif dan karya inovasi mahasiswa.",
    en: "Enjoy the best deals on creative products and student innovation works.",
    aliases: [
      "nikmati penawaran harga terbaik untuk produk kreatif dan karya inovasi mahasiswa.",
      "dapatkan penawaran terbaik dan kupon diskon spesial untuk produk edukasi pilihan.",
      "enjoy the best prices and exclusive deals on student creative and innovation products.",
      "enjoy the best deals on creative products and student innovation works.",
      "discover the best limited-time deals and discount coupons for top educational products.",
    ],
  },
  dealsTitle: {
    id: "Produk Promo Pilihan",
    en: "Featured Promotional Deals",
    aliases: [
      "produk promo pilihan",
      "koleksi produk diskon",
      "promo produk pilihan",
      "featured promotional deals",
      "special discounted deals",
      "discounted deals collection",
      "special promotional deals",
    ],
  },
  dealsDescription: {
    id: "Karya inovasi dan produk edupreneur dengan diskon spesial.",
    en: "Student innovation works and edupreneur products with exclusive discounts.",
    aliases: [
      "karya inovasi dan produk edupreneur dengan diskon spesial.",
      "hemat lebih banyak untuk karya inovasi dan media belajar.",
      "student innovation works and edupreneur products with exclusive discounts.",
      "save big on student innovation works and digital learning products.",
      "jelajahi produk berkualitas dengan potongan harga menarik.",
    ],
  },
};

const resolveOffersBilingual = (field, rawValue, isIndo) => {
  const text = toText(rawValue);
  const targetLang = isIndo ? "id" : "en";
  const oppositeLang = isIndo ? "en" : "id";
  const config = OFFERS_BILINGUAL_MAP[field];

  if (!config) return text;
  if (!text) return config[targetLang];

  const current = text.trim().toLowerCase();

  // 1. Direct alias match
  if (Array.isArray(config.aliases)) {
    const isMatched = config.aliases.some((alias) => alias.toLowerCase() === current);
    if (isMatched) return config[targetLang];
  }

  // 2. Canonical target / opposite match
  if (
    current === config[oppositeLang].toLowerCase() ||
    current === config[targetLang].toLowerCase()
  ) {
    return config[targetLang];
  }

  // 3. Smart contextual phrase matching
  if (field === "eyebrow") {
    if (
      current.includes("promo") ||
      current.includes("penawaran") ||
      current.includes("special offer") ||
      current.includes("mega offer")
    ) {
      return config[targetLang];
    }
  }

  if (field === "description") {
    if (
      current.includes("nikmati penawaran") ||
      current.includes("karya inovasi mahasiswa") ||
      current.includes("produk kreatif") ||
      current.includes("enjoy the best") ||
      current.includes("discover the best") ||
      current.includes("educational products")
    ) {
      return config[targetLang];
    }
  }

  if (field === "dealsTitle") {
    if (
      current.includes("produk promo") ||
      current.includes("produk diskon") ||
      current.includes("promo pilihan") ||
      current.includes("promotional deals") ||
      current.includes("discounted deals")
    ) {
      return config[targetLang];
    }
  }

  if (field === "dealsDescription") {
    if (
      current.includes("karya inovasi") ||
      current.includes("diskon spesial") ||
      current.includes("edupreneur") ||
      current.includes("student innovation") ||
      current.includes("exclusive discounts") ||
      current.includes("save big")
    ) {
      return config[targetLang];
    }
  }

  // 4. Fallback if current language is English but text contains Indonesian words
  if (!isIndo) {
    if (
      current.includes("dan ") ||
      current.includes("untuk ") ||
      current.includes("dengan ") ||
      current.includes("pilihan") ||
      current.includes("terbaik")
    ) {
      return config.en;
    }
  }

  return text;
};

const normalizeOffers = (raw, isIndo) => {
  const source = toPlainObject(raw);
  const pageHeader = toPlainObject(source.pageHeader);
  const superDiscount = toPlainObject(source.superDiscount);
  const dealsSection = toPlainObject(source.dealsSection);

  const rawEyebrow = toText(pageHeader.eyebrow);
  const rawTitle = toText(pageHeader.pageTitle);
  const rawDesc = toText(pageHeader.description);
  const rawDealsTitle = toText(dealsSection.title);
  const rawDealsDesc = toText(dealsSection.description);

  return {
    pageHeader: {
      enabled: toBool(pageHeader.enabled, true),
      eyebrow: resolveOffersBilingual("eyebrow", rawEyebrow, isIndo),
      pageTitle: resolveOffersBilingual("pageTitle", rawTitle, isIndo),
      description: resolveOffersBilingual("description", rawDesc, isIndo),
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
      title: resolveOffersBilingual("dealsTitle", rawDealsTitle, isIndo),
      description: resolveOffersBilingual("dealsDescription", rawDealsDesc, isIndo),
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
  const [, setLangSyncCounter] = useState(0);

  // Reactive language detection that listens to header language changes
  const isIndo =
    i18n.language === "id" ||
    i18n.language === "id-ID" ||
    i18n.language?.startsWith("id") ||
    (typeof window !== "undefined" &&
      (localStorage.getItem("store_language") === "Indonesia" ||
        localStorage.getItem("store_language") === "Bahasa Indonesia"));
  const lang = isIndo ? "id" : "en";

  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

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
    navigator.clipboard
      .writeText(code)
      .then(() => {
        setCopiedCode(code);
        toast.success(
          isIndo
            ? `Kode voucher "${code}" berhasil disalin!`
            : `Coupon code "${code}" copied!`
        );
        setTimeout(() => setCopiedCode(""), 2200);
      })
      .catch(() => {
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
      {/* 1. HERO BANNER WITH 2-COLUMN BALANCED LAYOUT */}
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
          <div className="tp-offers-hero__grid">
            {/* Left Content Column */}
            <div className="tp-offers-hero__left">
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
            </div>

            {/* Right Column: Visual Ticket Showcase Card (Solves Empty Void) */}
            {shouldRenderSuperDiscount && featuredCoupon ? (
              <div className="tp-offers-hero__right">
                <div className="tp-hero-showcase-ticket">
                  <div className="tp-hero-showcase-ticket__header">
                    <span className="tp-hero-showcase-ticket__badge">
                      <Sparkles className="h-3 w-3" />
                      {isIndo ? "Kupon Unggulan" : "Featured Voucher"}
                    </span>
                    <span className="tp-hero-showcase-ticket__discount">
                      {featuredCoupon.discountType === "percent"
                        ? `${featuredCoupon.amount}% OFF`
                        : `${formatCurrency(featuredCoupon.amount)} OFF`}
                    </span>
                  </div>

                  <div className="tp-hero-showcase-ticket__divider">
                    <span className="tp-hero-showcase-ticket__notch-left" />
                    <span className="tp-hero-showcase-ticket__notch-right" />
                  </div>

                  <div className="tp-hero-showcase-ticket__body">
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        {featuredCoupon.campaignName ||
                          (isIndo ? "Voucher Diskon Spesial" : "Special Discount Coupon")}
                      </h4>
                      <p className="mt-0.5 text-xs text-slate-300">
                        {featuredCoupon.minSpend > 0
                          ? isIndo
                            ? `Min. belanja ${formatCurrency(featuredCoupon.minSpend)}`
                            : `Min. spend ${formatCurrency(featuredCoupon.minSpend)}`
                          : isIndo
                            ? "Tanpa minimum belanja"
                            : "No minimum spend required"}
                      </p>
                    </div>

                    <div className="tp-hero-showcase-ticket__code-box">
                      <span className="tp-hero-showcase-ticket__code">{featuredCoupon.code}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyCoupon(featuredCoupon.code)}
                        className={`tp-hero-showcase-ticket__copy-btn ${
                          copiedCode === featuredCoupon.code ? "is-copied" : ""
                        }`}
                        aria-label={`Copy coupon ${featuredCoupon.code}`}
                      >
                        {copiedCode === featuredCoupon.code ? (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>{isIndo ? "Tersalin" : "Copied"}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{isIndo ? "Salin Kode" : "Copy Code"}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="tp-hero-showcase-ticket__meta">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3 w-3 text-[#fe6f05]" />
                        <span>{isIndo ? "Potongan saat checkout" : "Applied at checkout"}</span>
                      </span>
                      <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
                        {featuredCoupon.scopeType === "PLATFORM" ? "Platform" : "Store"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="tp-offers-hero__right">
                <div className="tp-hero-showcase-ticket">
                  <div className="tp-hero-showcase-ticket__header">
                    <span className="tp-hero-showcase-ticket__badge">
                      <Sparkles className="h-3 w-3" />
                      {isIndo ? "Promo Spesial" : "Special Promo"}
                    </span>
                    <span className="tp-hero-showcase-ticket__discount">
                      {isIndo ? "Diskon Eksklusif" : "Exclusive Deals"}
                    </span>
                  </div>
                  <div className="tp-hero-showcase-ticket__body">
                    <p className="text-xs text-slate-200">
                      {isIndo
                        ? "Dapatkan potongan harga langsung untuk berbagai produk inovasi & karya kreatif mahasiswa."
                        : "Enjoy instant discounts on various student innovation products and creative works."}
                    </p>
                    <Link
                      to="/shop"
                      className="tp-hero-showcase-ticket__copy-btn justify-center text-center"
                    >
                      {isIndo ? "Jelajahi Produk Diskon" : "Explore Discounted Deals"}
                    </Link>
                  </div>
                </div>
              </div>
            )}
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
                            : "No minimum spend required"}
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

      {/* 3. DEALS CATALOG SECTION (BILINGUAL SYNCHRONIZED) */}
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
