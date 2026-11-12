import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Copy,
  ExternalLink,
  Headphones,
  Package,
  Star,
  Truck,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { formatCurrency } from "../../utils/format.js";
import { fetchStoreProducts } from "../../api/storeProducts.ts";
import "./store-order-tracking-2026.css";

const TRACKING_I18N = {
  id: {
    home: "Beranda",
    trackOrder: "Lacak Pesanan",
    back: "Kembali",
    inTransit: "Sedang Dikirim",
    outForDelivery: "Menuju Alamatmu",
    delivered: "Pesanan Tiba",
    orderDetails: "Rincian Pesanan",
    copied: "Nomor resi berhasil disalin!",
    copyFailed: "Gagal menyalin nomor resi",
    youMayAlsoLike: "Kamu Mungkin Juga Suka",
    sold: "terjual",
    instant: "INSTANT",
    loading: "Memuat pelacakan pesanan...",
    notFound: "Pelacakan Pesanan Tidak Ditemukan",
    notFoundDesc: "Nomor referensi pesanan tidak ditemukan atau belum terdaftar.",
    backToHome: "Kembali ke Beranda",
    needHelp: "Bantuan Pesanan",
  },
  en: {
    home: "Home",
    trackOrder: "Track Order",
    back: "Back",
    inTransit: "In Transit",
    outForDelivery: "Out for Delivery",
    delivered: "Order Arrived",
    orderDetails: "Order Details",
    copied: "Tracking number copied to clipboard!",
    copyFailed: "Failed to copy tracking number",
    youMayAlsoLike: "You Might Also Like",
    sold: "sold",
    instant: "INSTANT",
    loading: "Loading order tracking...",
    notFound: "Order Tracking Unavailable",
    notFoundDesc: "The order reference was not found or is no longer accessible.",
    backToHome: "Back to Home",
    needHelp: "Order Help",
  },
};

function TrackingRecommendationGrid({ isIndo, LinkComponent }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const T = isIndo ? TRACKING_I18N.id : TRACKING_I18N.en;

  useEffect(() => {
    let active = true;
    fetchStoreProducts({ limit: 6 })
      .then((res) => {
        if (!active) return;
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.items)
            ? res.items
            : Array.isArray(res)
              ? res
              : [];
        setProducts(list.slice(0, 4));
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (isLoading && products.length === 0) return null;
  if (!products.length) return null;

  return (
    <section className="tp-track-rec">
      <div className="tp-track-rec__header">
        <span className="tp-track-rec__line" />
        <h2 className="tp-track-rec__title">{T.youMayAlsoLike}</h2>
        <span className="tp-track-rec__line" />
      </div>

      <div className="tp-track-rec__grid">
        {products.map((item) => {
          const imageSrc = resolveAssetUrl(item.image || item.thumbnail || "");
          const name = item.name || item.title || "Produk";
          const displayPrice = Number(item.price || item.salePrice || 0);
          const slug = item.slug || item.id;
          const rating = (Number(item.rating || item.avgRating || 5.0)).toFixed(1);
          const soldCount = item.soldCount || item.sales || Math.floor(Math.random() * 25 + 5);

          return (
            <LinkComponent
              key={item.id}
              to={`/product/${slug}`}
              className="tp-track-rec__card"
            >
              <div className="tp-track-rec__thumb">
                {imageSrc ? (
                  <img src={imageSrc} alt={name} loading="lazy" />
                ) : (
                  <div className="tp-track-rec__fallback">
                    <Package aria-hidden="true" />
                  </div>
                )}
                <span className="tp-track-rec__discount">-8%</span>
              </div>
              <div className="tp-track-rec__info">
                <div className="tp-track-rec__badges">
                  <span className="tp-track-rec__badge tp-track-rec__badge--star">Star+</span>
                  <span className="tp-track-rec__badge tp-track-rec__badge--mall">Mall</span>
                </div>
                <h3 className="tp-track-rec__name">{name}</h3>
                <div className="tp-track-rec__price">{formatCurrency(displayPrice)}</div>
                <div className="tp-track-rec__meta">
                  <span className="tp-track-rec__rating">
                    <Star aria-hidden="true" /> {rating}
                  </span>
                  <span className="tp-track-rec__sold">{soldCount} {T.sold}</span>
                </div>
                <div className="tp-track-rec__origin">
                  <span className="tp-track-rec__instant">{T.instant}</span>
                  <span>KOTA MAKASSAR</span>
                </div>
              </div>
            </LinkComponent>
          );
        })}
      </div>
    </section>
  );
}

export default function StoreOrderTracking2026View({
  tracking,
  isIndo = false,
  isLoading = false,
  error = null,
  LinkComponent = "a",
  onWhatsAppSupport,
}) {
  const T = isIndo ? TRACKING_I18N.id : TRACKING_I18N.en;

  const handleCopy = (text) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      toast.success(T.copied);
    } else {
      toast.error(T.copyFailed);
    }
  };

  const handleHelpNotice = () => {
    toast(
      isIndo
        ? "Informasi pelacakan ini sinkron langsung dengan sistem pengiriman penjual dan admin."
        : "This tracking status is synchronized with seller fulfillment and admin operations.",
      { icon: "ℹ️" }
    );
  };

  if (isLoading) {
    return (
      <div className="tp-track-wrapper">
        <div className="tp-track-skeleton tp-track-skeleton--header" />
        <div className="tp-track-skeleton tp-track-skeleton--card" />
        <div className="tp-track-skeleton tp-track-skeleton--timeline" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="tp-track-wrapper">
        <div className="tp-track-error-card">
          <CircleHelp aria-hidden="true" className="tp-track-error-icon" />
          <h1>{T.notFound}</h1>
          <p>{T.notFoundDesc}</p>
          <LinkComponent to="/" className="tp-track-back-home">
            <ArrowLeft aria-hidden="true" /> {T.backToHome}
          </LinkComponent>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-track-wrapper">
      {/* 1. Header Navigation Bar */}
      <header className="tp-track-header">
        <LinkComponent to={tracking.orderDetailUrl || "/user/my-orders"} className="tp-track-header__back" aria-label={T.back}>
          <ArrowLeft aria-hidden="true" />
        </LinkComponent>
        <h1 className="tp-track-header__title">{tracking.statusTitle}</h1>
        <div className="tp-track-header__actions">
          <button
            type="button"
            className="tp-track-header__icon-btn"
            onClick={onWhatsAppSupport}
            aria-label="Customer Support"
            title="Customer Support"
          >
            <Headphones aria-hidden="true" />
          </button>
          <button
            type="button"
            className="tp-track-header__icon-btn"
            onClick={handleHelpNotice}
            aria-label={T.needHelp}
            title={T.needHelp}
          >
            <CircleHelp aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Desktop Breadcrumbs */}
      <nav className="tp-track-breadcrumb" aria-label="Breadcrumb">
        <LinkComponent to="/">{T.home}</LinkComponent>
        <ChevronRight aria-hidden="true" className="tp-track-breadcrumb__sep" />
        <LinkComponent to="/user/my-orders">{T.trackOrder}</LinkComponent>
        <ChevronRight aria-hidden="true" className="tp-track-breadcrumb__sep" />
        <span className="tp-track-breadcrumb__current">{tracking.reference}</span>
      </nav>

      <main className="tp-track-main">
        {/* 2. Top Status Card with Horizontal 3-Step Stepper */}
        <section className="tp-track-card tp-track-status-card">
          <div className="tp-track-status__title">
            {tracking.statusHeadline}
          </div>

          <div className="tp-track-stepper">
            {tracking.steps.map((step, idx) => {
              const isPast = idx < tracking.activeStepIndex;
              const isCurrent = idx === tracking.activeStepIndex;
              const isDone = isPast || (isCurrent && tracking.activeStepIndex === 2);

              return (
                <div
                  key={step.code}
                  className={`tp-track-step ${isDone ? "is-done" : ""} ${isCurrent ? "is-current" : ""}`}
                >
                  <div className="tp-track-step__icon-box">
                    {idx === 0 && <Package aria-hidden="true" />}
                    {idx === 1 && <Truck aria-hidden="true" />}
                    {idx === 2 && <CheckCircle2 aria-hidden="true" />}
                  </div>
                  <div className="tp-track-step__label">{step.label}</div>
                  {idx < tracking.steps.length - 1 && (
                    <div
                      className={`tp-track-step__line ${isPast ? "is-done" : ""}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Courier & Shipment Card */}
        <section className="tp-track-card tp-track-courier-card">
          <div className="tp-track-courier__thumb">
            {tracking.primaryThumbnail ? (
              <img
                src={resolveAssetUrl(tracking.primaryThumbnail)}
                alt="Product thumbnail"
                loading="lazy"
              />
            ) : (
              <div className="tp-track-courier__fallback">
                <Package aria-hidden="true" />
              </div>
            )}
          </div>

          <div className="tp-track-courier__info">
            <div className="tp-track-courier__name">{tracking.courierName}</div>
            <div className="tp-track-courier__resi">
              {/^https?:\/\//i.test(String(tracking.trackingNumber || "").trim()) ? (
                <a
                  href={tracking.trackingNumber}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tp-track-live-btn"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "4px 10px",
                    borderRadius: "14px",
                    background: "#034c85",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={12} />
                  <span>{isIndo ? "Lacak Live Driver (Peta)" : "Live Driver Map"}</span>
                </a>
              ) : (
                <>
                  <span>{tracking.trackingNumberDisplay}</span>
                  {tracking.hasRealTrackingNumber ? (
                    <button
                      type="button"
                      className="tp-track-copy-btn"
                      onClick={() => handleCopy(tracking.trackingNumber)}
                      aria-label="Salin nomor resi"
                      title="Salin nomor resi"
                    >
                      <Copy aria-hidden="true" />
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </div>

          <div className="tp-track-courier__action">
            <LinkComponent
              to={tracking.orderDetailUrl || "/user/my-orders"}
              className="tp-track-order-details-btn"
            >
              {T.orderDetails}
            </LinkComponent>
          </div>
        </section>

        {/* 4. Linimasa Pengiriman (Vertical Tracking Timeline) */}
        <section className="tp-track-card tp-track-timeline-card">
          <div className="tp-track-timeline">
            {tracking.timeline.map((event, idx) => (
              <div
                key={event.id || idx}
                className={`tp-track-timeline__item ${event.isLatest ? "is-latest" : ""}`}
              >
                <div className="tp-track-timeline__time">{event.dateLabel}</div>
                <div className="tp-track-timeline__node">
                  <span className="tp-track-timeline__dot" />
                  {idx < tracking.timeline.length - 1 && (
                    <span className="tp-track-timeline__line" />
                  )}
                </div>
                <div className="tp-track-timeline__content">
                  <p className="tp-track-timeline__label">{event.label}</p>
                  {event.description && (
                    <p className="tp-track-timeline__desc">{event.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Product Recommendations Section */}
        <TrackingRecommendationGrid isIndo={isIndo} LinkComponent={LinkComponent} />
      </main>
    </div>
  );
}
