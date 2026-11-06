import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  MessageCircle,
  Package,
  Search,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { fetchStoreProducts } from "../../api/storeProducts.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { formatCurrency } from "../../utils/format.js";
import { isIndonesianLanguage } from "./accountOrders2026Adapter.js";
import "./account-orders-2026.css";

const MY_ORDERS_I18N = {
  en: {
    title: "My Orders",
    tabAll: "All",
    tabUnpaid: "Unpaid",
    tabToPack: "To Pack",
    tabShipping: "Shipping",
    tabCompleted: "Completed",
    tabReturns: "Returns",
    tabCancelled: "Cancelled",
    searchPlaceholder: "Search order or product...",
    emptyTitle: "No orders yet",
    recommendationsTitle: "You May Also Like",
    totalProduct: "Total {{count}} product(s)",
    buyAgain: "Buy Again",
    review: "Review",
    requestReturn: "Return",
    payNow: "Pay Now",
    viewDetails: "Order Details",
    track: "Track",
    contactSeller: "Contact Seller",
    returnDetails: "Refund Details",
    store: "Store",
    visitStore: "Visit {{name}}",
    sold: "sold",
    rating: "Store Rating",
    back: "Back",
  },
  id: {
    title: "Pesanan Saya",
    tabAll: "Semua",
    tabUnpaid: "Belum Bayar",
    tabToPack: "Dikemas",
    tabShipping: "Dikirim",
    tabCompleted: "Selesai",
    tabReturns: "Pengembalian",
    tabCancelled: "Dibatalkan",
    searchPlaceholder: "Cari pesanan atau produk...",
    emptyTitle: "Belum ada pesanan",
    recommendationsTitle: "Kamu Mungkin Juga Suka",
    totalProduct: "Total {{count}} produk",
    buyAgain: "Beli Lagi",
    review: "Nilai",
    requestReturn: "Ajukan Pengembalian",
    payNow: "Bayar Sekarang",
    viewDetails: "Rincian Pesanan",
    track: "Lacak",
    contactSeller: "Hubungi Penjual",
    returnDetails: "Rincian Pengembalian",
    store: "Toko",
    visitStore: "Kunjungi {{name}}",
    sold: "terjual",
    rating: "Penilaian Toko",
    back: "Kembali",
  },
};

function EmptyClipboardIcon() {
  return (
    <div className="tp-empty-orders__icon-wrap" aria-hidden="true">
      <svg
        width="110"
        height="120"
        viewBox="0 0 110 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="tp-empty-orders__svg"
      >
        <circle cx="55" cy="62" r="48" fill="#F0F4F8" />
        <circle cx="38" cy="28" r="3.5" fill="#FFB74D" />
        <circle cx="78" cy="30" r="2.5" fill="#FFA726" />
        <circle cx="43" cy="23" r="2" fill="#81D4FA" />
        <rect
          x="32"
          y="26"
          width="46"
          height="62"
          rx="5"
          fill="#FFE0B2"
          stroke="#FFA726"
          strokeWidth="1.5"
        />
        <rect
          x="35"
          y="29"
          width="40"
          height="56"
          rx="3"
          fill="#FFFFFF"
        />
        <rect x="44" y="22" width="22" height="7" rx="3.5" fill="#4DB6AC" />
        <circle cx="55" cy="25" r="2" fill="#FFFFFF" />
        {/* checklist lines */}
        <rect x="42" y="38" width="5" height="5" rx="1" fill="#E0E6ED" />
        <rect x="50" y="39" width="20" height="3" rx="1.5" fill="#CFD8DC" />
        <rect x="42" y="47" width="5" height="5" rx="1" fill="#E0E6ED" />
        <rect x="50" y="48" width="18" height="3" rx="1.5" fill="#CFD8DC" />
        <rect x="42" y="56" width="5" height="5" rx="1" fill="#E0E6ED" />
        <rect x="50" y="57" width="22" height="3" rx="1.5" fill="#CFD8DC" />
        <rect x="42" y="65" width="5" height="5" rx="1" fill="#E0E6ED" />
        <rect x="50" y="66" width="16" height="3" rx="1.5" fill="#CFD8DC" />
        {/* pencil */}
        <g transform="translate(62, 58) rotate(35)">
          <rect x="0" y="0" width="8" height="28" rx="2" fill="#26A69A" />
          <path d="M0 28L4 35L8 28Z" fill="#FFCC80" />
          <path d="M3 33L4 35L5 33Z" fill="#37474F" />
          <rect x="0" y="0" width="8" height="5" fill="#EF5350" />
        </g>
      </svg>
    </div>
  );
}

function ProductRecommendationGrid({ t }) {
  const productsQuery = useQuery({
    queryKey: ["storefront", "recommendations", "my-orders"],
    queryFn: () => fetchStoreProducts({ limit: 6 }),
    staleTime: 5 * 60 * 1000,
  });

  const products = Array.isArray(productsQuery.data?.products)
    ? productsQuery.data.products
    : [];

  if (products.length === 0) return null;

  return (
    <div className="tp-orders-recommendations">
      <div className="tp-orders-recommendations__divider">
        <span />
        <h3>{t.recommendationsTitle}</h3>
        <span />
      </div>

      <div className="tp-orders-recommendations__grid">
        {products.slice(0, 6).map((product) => {
          const imageSrc = resolveAssetUrl(product.image || product.images?.[0] || "");
          const discount = product.discountPercent || (product.salePrice && product.price > product.salePrice ? Math.round(((product.price - product.salePrice) / product.price) * 100) : null);
          const displayPrice = product.salePrice || product.price || 0;
          return (
            <Link
              key={product.id}
              to={product.slug ? `/products/${product.slug}` : "/shop"}
              className="tp-rec-card"
            >
              <div className="tp-rec-card__image-wrap">
                {imageSrc ? (
                  <img src={imageSrc} alt={product.name} loading="lazy" />
                ) : (
                  <div className="tp-rec-card__image-placeholder">
                    <Package size={28} />
                  </div>
                )}
                {discount ? (
                  <span className="tp-rec-card__discount-tag">-{discount}%</span>
                ) : null}
              </div>
              <div className="tp-rec-card__body">
                <h4 className="tp-rec-card__title" title={product.name}>
                  {product.name}
                </h4>
                <div className="tp-rec-card__price-row">
                  <span className="tp-rec-card__price">
                    {formatCurrency(displayPrice)}
                  </span>
                </div>
                <div className="tp-rec-card__meta">
                  <span className="tp-rec-card__rating">
                    <Star size={11} fill="#fe6f05" color="#fe6f05" />
                    <span>5.0</span>
                  </span>
                  <span className="tp-rec-card__location">
                    <Truck size={11} />
                    <span>Kota Makassar</span>
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ShopeeOrderCard({ order, LinkComponent, t }) {
  const items = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : [
        {
          id: order.id,
          name: order.primaryStoreName ? `${order.primaryStoreName} Produk` : order.reference,
          image: "",
          variant: "Standard",
          price: order.total || order.totalAmount,
          quantity: 1,
        },
      ];

  const totalCount = order.totalItemCount || items.reduce((acc, it) => acc + (it.quantity || 1), 0);
  const storeName = order.primaryStoreName || order.storeNames?.[0] || t.store;
  const storeSlug = order.primaryStoreSlug || order.storeSlug || "kreasi-singkong";
  const visitStoreLabel = (t.visitStore || "Kunjungi {{name}}").replace("{{name}}", storeName);
  const statusLabel = order.status?.label || t.tabCompleted;
  const bucket = order.status?.bucket || "completed";

  return (
    <article className="tp-shopee-card">
      {/* 1. Header: Store Badge + Store Name + Status */}
      <header className="tp-shopee-card__header">
        <Link
          to={`/store/${storeSlug}`}
          className="tp-shopee-card__store-btn"
          title={visitStoreLabel}
          aria-label={visitStoreLabel}
        >
          <span className="tp-shopee-card__store-tag">Star</span>
          <strong className="tp-shopee-card__store-name">{storeName}</strong>
          <ChevronRight size={14} className="tp-shopee-card__store-chevron" aria-hidden="true" />
        </Link>
        <span className="tp-shopee-card__status-text">{statusLabel}</span>
      </header>

      {/* 2. Product Items */}
      <div className="tp-shopee-card__items">
        {items.map((item, idx) => {
          const itemImg = resolveAssetUrl(item.image);
          return (
            <Link
              key={item.id || idx}
              to={order.href || "#"}
              className="tp-shopee-card__item-link"
            >
              <div className="tp-shopee-card__item">
                <div className="tp-shopee-card__thumb">
                  {itemImg ? (
                    <img src={itemImg} alt={item.name} loading="lazy" />
                  ) : (
                    <div className="tp-shopee-card__thumb-fallback">
                      <Package size={22} />
                    </div>
                  )}
                </div>
                <div className="tp-shopee-card__info">
                  <h3 className="tp-shopee-card__product-name" title={item.name}>
                    {item.name}
                  </h3>
                  <div className="tp-shopee-card__variant-row">
                    <span className="tp-shopee-card__variant">
                      {item.variant ? item.variant : "Standard item"}
                    </span>
                    <span className="tp-shopee-card__qty">x{item.quantity || 1}</span>
                  </div>
                  <div className="tp-shopee-card__item-price">
                    {formatCurrency(item.price || order.total || 0)}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 3. Total Order Summary Row */}
      <div className="tp-shopee-card__summary">
        <span className="tp-shopee-card__total-label">
          {t.totalProduct.replace("{{count}}", String(totalCount))}:
        </span>
        <strong className="tp-shopee-card__total-amount">
          {formatCurrency(order.total ?? order.totalAmount)}
        </strong>
      </div>

      {/* 4. Action Buttons */}
      <footer className="tp-shopee-card__actions">
        {bucket === "completed" && (
          <>
            <LinkComponent
              to={items[0]?.slug ? `/products/${items[0].slug}` : "/shop"}
              className="tp-shopee-btn tp-shopee-btn--secondary"
            >
              {t.buyAgain}
            </LinkComponent>
            <LinkComponent
              to={order.href || "#"}
              className="tp-shopee-btn tp-shopee-btn--accent"
            >
              {t.review}
            </LinkComponent>
          </>
        )}

        {bucket === "unpaid" && (
          <>
            <LinkComponent
              to={order.href || "#"}
              className="tp-shopee-btn tp-shopee-btn--secondary"
            >
              {t.viewDetails}
            </LinkComponent>
            <LinkComponent
              to={order.paymentAction?.path || `${order.href}/payment`}
              className="tp-shopee-btn tp-shopee-btn--primary"
            >
              {t.payNow}
            </LinkComponent>
          </>
        )}

        {bucket === "to_pack" && (
          <>
            <a
              href="https://wa.me/628218866824"
              target="_blank"
              rel="noopener noreferrer"
              className="tp-shopee-btn tp-shopee-btn--secondary"
            >
              {t.contactSeller}
            </a>
            <LinkComponent
              to={order.href || "#"}
              className="tp-shopee-btn tp-shopee-btn--accent"
            >
              {t.viewDetails}
            </LinkComponent>
          </>
        )}

        {bucket === "shipping" && (
          <>
            <LinkComponent
              to={order.href || "#"}
              className="tp-shopee-btn tp-shopee-btn--secondary"
            >
              {t.track}
            </LinkComponent>
            <LinkComponent
              to={order.href || "#"}
              className="tp-shopee-btn tp-shopee-btn--accent"
            >
              {t.viewDetails}
            </LinkComponent>
          </>
        )}

        {bucket === "returns" && (
          <LinkComponent
            to={order.href || "#"}
            className="tp-shopee-btn tp-shopee-btn--accent"
          >
            {t.returnDetails}
          </LinkComponent>
        )}

        {bucket === "cancelled" && (
          <LinkComponent
            to={order.href || "#"}
            className="tp-shopee-btn tp-shopee-btn--secondary"
          >
            {t.viewDetails}
          </LinkComponent>
        )}
      </footer>
    </article>
  );
}

export default function AccountOrders2026View({
  LinkComponent = Link,
  orders,
  counts,
  page,
  pageSize,
  totalPages,
  totalOrders,
  isLoading,
  error,
  onPageChange,
  isIndo: isIndoProp,
}) {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSync((prev) => prev + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const isIndo = typeof isIndoProp === "boolean" ? isIndoProp : isIndonesianLanguage(i18n);
  const t = isIndo ? MY_ORDERS_I18N.id : MY_ORDERS_I18N.en;

  // 7 Status Tabs as required by user
  const TABS = useMemo(
    () => [
      { code: "all", label: t.tabAll },
      { code: "unpaid", label: t.tabUnpaid },
      { code: "to_pack", label: t.tabToPack },
      { code: "shipping", label: t.tabShipping },
      { code: "completed", label: t.tabCompleted },
      { code: "returns", label: t.tabReturns },
      { code: "cancelled", label: t.tabCancelled },
    ],
    [t]
  );

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const safeOrders = Array.isArray(orders) ? orders : [];
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredOrders = useMemo(
    () =>
      safeOrders.filter((order) => {
        if (activeTab !== "all" && order.status?.bucket !== activeTab) {
          return false;
        }
        if (normalizedSearch) {
          const searchable = [
            order.displayId,
            order.reference,
            order.primaryStoreName,
            order.status?.label,
            order.paymentMethod,
            ...(Array.isArray(order.storeNames) ? order.storeNames : []),
            ...(Array.isArray(order.items) ? order.items.map((it) => it.name) : []),
          ]
            .join(" ")
            .toLowerCase();
          if (!searchable.includes(normalizedSearch)) return false;
        }
        return true;
      }),
    [activeTab, normalizedSearch, safeOrders]
  );

  return (
    <div className="tp-shopee-orders-page">
      {/* 1. Mobile/Desktop Top Header Bar */}
      <header className="tp-shopee-header">
        <div className="tp-shopee-header__left">
          <button
            type="button"
            className="tp-shopee-header__back-btn"
            onClick={() => navigate("/user/dashboard")}
            aria-label={t.back}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="tp-shopee-header__title">{t.title}</h1>
        </div>

        <div className="tp-shopee-header__right">
          <button
            type="button"
            className={`tp-shopee-header__icon-btn${isSearchOpen ? " is-active" : ""}`}
            onClick={() => setIsSearchOpen((prev) => !prev)}
            aria-label="Search"
          >
            <Search size={20} />
          </button>
          <a
            href="https://wa.me/628218866824"
            target="_blank"
            rel="noopener noreferrer"
            className="tp-shopee-header__icon-btn relative"
            aria-label="Chat support"
          >
            <MessageCircle size={20} />
            <span className="tp-shopee-header__badge">10</span>
          </a>
        </div>
      </header>

      {/* Expandable Search Input (if active) */}
      {isSearchOpen && (
        <div className="tp-shopee-search-bar">
          <div className="tp-shopee-search-bar__inner">
            <Search size={16} className="text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* 2. 7 Status Tabs Bar (Horizontal Scrollable) */}
      <nav className="tp-shopee-tabs" aria-label="Status Pesanan">
        <div className="tp-shopee-tabs__scroll">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.code;
            const count = counts?.[tab.code] || 0;
            return (
              <button
                type="button"
                key={tab.code}
                className={`tp-shopee-tab${isActive ? " is-active" : ""}`}
                onClick={() => setActiveTab(tab.code)}
              >
                <span>{tab.label}</span>
                {count > 0 && activeTab !== tab.code ? (
                  <small className="tp-shopee-tab__count">({count})</small>
                ) : null}
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Main Content: Orders List OR Empty State + Recommendations */}
      <main className="tp-shopee-orders-content">
        {isLoading ? (
          <div className="tp-shopee-loading" aria-label="Memuat pesanan">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="tp-shopee-loading__skeleton" />
            ))}
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="tp-shopee-card-list">
            {filteredOrders.map((order) => (
              <ShopeeOrderCard
                key={order.id || order.displayId || order.reference}
                order={order}
                LinkComponent={LinkComponent}
                t={t}
              />
            ))}
          </div>
        ) : (
          /* Empty State + Recommendations as in Reference Images 2, 3, 4 */
          <div className="tp-empty-orders">
            <EmptyClipboardIcon />
            <p className="tp-empty-orders__title">{t.emptyTitle}</p>
            <ProductRecommendationGrid t={t} />
          </div>
        )}
      </main>
    </div>
  );
}
