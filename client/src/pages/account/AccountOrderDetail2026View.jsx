import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Headphones,
  HelpCircle,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  QrCode,
  RotateCcw,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { fetchStoreProducts } from "../../api/storeProducts.ts";
import { getStorePublicIdentityBySlug } from "../../api/storePublicIdentity.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { formatCurrency } from "../../utils/format.js";
import {
  buildStoreWhatsAppUrl,
  isIndonesianLanguage,
  DUITKU_PAYMENT_METHODS,
} from "./accountOrderDetail2026Adapter.js";
import { buildAccountOrderInvoiceModel } from "./invoice/accountOrderInvoiceAdapter.js";
import AccountOrderInvoicePrint from "./invoice/AccountOrderInvoicePrint.jsx";
import { useCart } from "../../hooks/useCart.ts";
import "./account-order-detail-2026.css";

const DETAIL_I18N = {
  en: {
    title: "Order Details",
    orderCompleted: "Order Completed",
    orderInTransit: "Order in Transit",
    orderPacking: "Order is Being Packed",
    orderUnpaid: "Awaiting Payment",
    orderCancelled: "Order Cancelled",
    guaranteeNotice: "Arrival Guarantee: On-time delivery guarantee protected by TP Preneurs.",
    shippingInfo: "Shipping Information",
    shippingStepDefault: "Package is on the way to destination address.",
    shippingDelivered: "Package arrived at destination address.",
    shippingAddress: "Shipping Address",
    store: "Store",
    visitStore: "Visit {{name}}",
    totalOrder: "Order Total",
    subtotalProducts: "Product Subtotal",
    shippingFee: "Shipping Fee",
    serviceFee: "Service Fee",
    discount: "Total Discount",
    totalPayment: "Total Payment",
    needHelp: "Need Help?",
    requestReturn: "Request Return / Refund",
    contactSeller: "Contact Seller",
    customerService: "Priority Customer Support",
    orderNo: "Order No.",
    copy: "Copy",
    copied: "Order number copied.",
    gatewayOrderId: "Gateway Order ID (Duitku)",
    gatewayOrderHint: "Matches reference in your Duitku email & transfer receipt",
    gatewayOrderCopied: "Gateway Order ID copied.",
    paymentMethod: "Payment Method",
    sellerNote: "Note to Seller",
    invoice: "Order Invoice / Receipt",
    view: "View",
    orderTime: "Order Time",
    paymentTime: "Payment Time",
    shippingTime: "Shipping Time",
    completedTime: "Completion Time",
    viewAll: "View More",
    viewLess: "View Less",
    youMayAlsoLike: "You May Also Like",
    buyAgain: "Buy Again",
    addingToCart: "Adding...",
    review: "Review",
    viewReview: "View Review",
    payNow: "Pay Now",
    paying: "Opening Payment...",
    cancelOrder: "Cancel Order",
    cancelling: "Cancelling...",
    cancelModalTitle: "Cancel Order?",
    cancelModalBody: "Are you sure you want to cancel this order? Cancelled orders cannot be resumed and reserved items will be returned to store stock.",
    cancelModalConfirm: "Yes, Cancel Order",
    cancelModalBack: "Back",
    track: "Track",
    details: "Details",
    loading: "Loading order details...",
    errorTitle: "Order details unavailable",
    tryAgain: "Try Again",
    backToOrders: "Back to Orders",
    paymentSuccessTitle: "Payment Successfully Received!",
    paymentSuccessDesc: "Your payment has been verified. The seller is preparing your order.",
    nextStepsTitle: "Next Steps",
    step1Title: "Packing Order",
    step1Desc: "Seller is preparing and packing your package.",
    step2Title: "Courier Tracking",
    step2Desc: "Tracking info updates automatically on this page.",
    btnTrackOrder: "Track Order Status",
    btnViewDetails: "View Details",
    btnContinueShopping: "Continue Shopping",
    paymentReference: "Payment Reference",
    changePaymentMethod: "Change Payment Method",
    changeMethod: "Change Method",
    selectPaymentMethodTitle: "Select Payment Method",
    selectPaymentMethodDesc: "Choose one of the official payment channels provided by Duitku to complete your payment.",
    confirmAndPay: "Confirm & Pay Now",
    currentPaymentMethod: "Current Method:",
  },
  id: {
    title: "Rincian Pesanan",
    orderCompleted: "Pesanan Selesai",
    orderInTransit: "Pesanan Sedang Dikirim",
    orderPacking: "Pesanan Sedang Dikemas",
    orderUnpaid: "Menunggu Pembayaran",
    orderCancelled: "Pesanan Dibatalkan",
    guaranteeNotice: "Garansi Tiba: Jaminan pesanan tepat waktu dilindungi TP Preneurs.",
    shippingInfo: "Info Pengiriman",
    shippingStepDefault: "Paket sedang dalam perjalanan menuju alamat tujuan.",
    shippingDelivered: "Pesanan tiba di alamat tujuan.",
    shippingAddress: "Alamat Pengiriman",
    store: "Toko",
    visitStore: "Kunjungi {{name}}",
    totalOrder: "Total Pesanan",
    subtotalProducts: "Subtotal Produk",
    shippingFee: "Total Ongkos Kirim",
    serviceFee: "Biaya Layanan",
    discount: "Total Diskon",
    totalPayment: "Total Pembayaran",
    needHelp: "Butuh Bantuan?",
    requestReturn: "Ajukan Pengembalian",
    contactSeller: "Hubungi Penjual",
    customerService: "Customer Service Prioritas",
    orderNo: "No. Pesanan",
    copy: "Salin",
    copied: "Nomor pesanan disalin.",
    gatewayOrderId: "ID Pembayaran Gateway (Duitku)",
    gatewayOrderHint: "Sesuai nomor referensi pada email & struk transfer Duitku",
    gatewayOrderCopied: "ID Pembayaran Gateway disalin.",
    paymentMethod: "Metode Pembayaran",
    sellerNote: "Catatan untuk Penjual",
    invoice: "Nota Pesanan / Faktur",
    view: "Lihat",
    orderTime: "Waktu Pemesanan",
    paymentTime: "Waktu Pembayaran",
    shippingTime: "Waktu Pengiriman",
    completedTime: "Waktu Pesanan Selesai",
    viewAll: "Lihat Semua",
    viewLess: "Lihat Lebih Sedikit",
    youMayAlsoLike: "Kamu Mungkin Juga Suka",
    buyAgain: "Beli Lagi",
    addingToCart: "Menambahkan...",
    review: "Nilai",
    viewReview: "Lihat Penilaian",
    payNow: "Bayar Sekarang",
    paying: "Membuka Pembayaran...",
    cancelOrder: "Batalkan Pesanan",
    cancelling: "Membatalkan...",
    cancelModalTitle: "Batalkan Pesanan?",
    cancelModalBody: "Apakah Anda yakin ingin membatalkan pesanan ini? Pesanan yang dibatalkan tidak dapat diproses lagi dan stok barang akan dikembalikan ke toko.",
    cancelModalConfirm: "Ya, Batalkan Pesanan",
    cancelModalBack: "Kembali",
    track: "Lacak",
    details: "Rincian",
    loading: "Memuat rincian pesanan...",
    errorTitle: "Rincian pesanan tidak tersedia",
    tryAgain: "Coba Lagi",
    backToOrders: "Kembali ke Pesanan",
    paymentSuccessTitle: "Pembayaran Berhasil Diterima!",
    paymentSuccessDesc: "Pembayaran terverifikasi. Penjual segera menyiapkan pesanan Anda.",
    nextStepsTitle: "Langkah Selanjutnya",
    step1Title: "Pesanan Dikemas",
    step1Desc: "Penjual sedang menyiapkan dan mengemas produk Anda.",
    step2Title: "Pelacakan Otomatis",
    step2Desc: "Nomor resi otomatis terlacak di linimasa pengiriman.",
    btnTrackOrder: "Lacak Status Pesanan",
    btnViewDetails: "Lihat Rincian",
    btnContinueShopping: "Lanjut Belanja",
    paymentReference: "Referensi Pembayaran",
    changePaymentMethod: "Ubah Metode Pembayaran",
    changeMethod: "Ubah Metode",
    selectPaymentMethodTitle: "Pilih Metode Pembayaran Duitku",
    selectPaymentMethodDesc: "Pilih salah satu metode pembayaran resmi yang disediakan oleh Duitku untuk menyelesaikan pesanan Anda.",
    confirmAndPay: "Konfirmasi & Bayar Sekarang",
    currentPaymentMethod: "Metode Saat Ini:",
  },
};

function ProductRecommendationGrid({ isIndo }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
      .catch(() => { })
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
    <div className="tp-shopee-detail__rec-section">
      <div className="tp-shopee-detail__rec-header">
        <span className="tp-shopee-detail__rec-line" />
        <span className="tp-shopee-detail__rec-title">
          {isIndo ? DETAIL_I18N.id.youMayAlsoLike : DETAIL_I18N.en.youMayAlsoLike}
        </span>
        <span className="tp-shopee-detail__rec-line" />
      </div>

      <div className="tp-shopee-detail__rec-grid">
        {products.map((item) => {
          const imageSrc = resolveAssetUrl(item.image || item.thumbnail || "");
          const name = item.name || item.title || "Produk";
          const displayPrice = Number(item.price || item.salePrice || 0);
          const slug = item.slug || item.id;

          return (
            <Link
              key={item.id}
              to={`/product/${slug}`}
              className="tp-shopee-detail__rec-card"
            >
              <div className="tp-shopee-detail__rec-card-thumb">
                {imageSrc ? (
                  <img src={imageSrc} alt={name} loading="lazy" />
                ) : (
                  <div className="tp-shopee-detail__rec-card-thumb-fallback">
                    <Package size={24} />
                  </div>
                )}
                <span className="tp-shopee-detail__rec-card-badge">-5%</span>
              </div>
              <div className="tp-shopee-detail__rec-card-body">
                <h4 className="tp-shopee-detail__rec-card-title">{name}</h4>
                <div className="tp-shopee-detail__rec-card-price">
                  {formatCurrency(displayPrice)}
                </div>
                <div className="tp-shopee-detail__rec-card-meta">
                  <span className="tp-shopee-detail__rec-card-rating">
                    <Star size={11} fill="#fe6f05" color="#fe6f05" />
                    <span>5.0</span>
                  </span>
                  <span className="tp-shopee-detail__rec-card-loc">
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

export default function AccountOrderDetail2026View({
  orderDetail,
  isLoading,
  error,
  LinkComponent = Link,
  fromTab: fromTabProp,
  onPrint,
  onInvoice,
  onTrack,
  onTimeline,
  onContactSupport,
  onCancelOrder,
  isCancelling = false,
  onConfirmReceipt,
  isConfirmingReceipt = false,
  onPayNow,
  isPaying = false,
  onCopy,
  onRetry,
  rawOrder,
  groupedOrder,
  user,
  dashboardSettingCopy,
  isIndo: isIndoProp,
  showPaymentSuccessModal = false,
  onCloseSuccessModal,
  onTrackFromSuccessModal,
  returnReference = "",
  isPaymentSuccessReturn = false,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  const VALID_TABS = useMemo(
    () => ["all", "unpaid", "to_pack", "shipping", "completed", "returns", "cancelled"],
    []
  );

  const fromTab = useMemo(() => {
    const raw =
      fromTabProp ||
      location.state?.fromTab ||
      location.state?.tab ||
      new URLSearchParams(location.search).get("fromTab");
    if (raw && VALID_TABS.includes(raw.toLowerCase())) return raw.toLowerCase();
    try {
      const stored = sessionStorage.getItem("tp_my_orders_last_tab");
      if (stored && VALID_TABS.includes(stored.toLowerCase())) return stored.toLowerCase();
    } catch (_) {}
    return "all";
  }, [fromTabProp, location.state, location.search, VALID_TABS]);

  const backTargetUrl = useMemo(() => {
    return fromTab && fromTab !== "all"
      ? `/user/my-orders?tab=${encodeURIComponent(fromTab)}`
      : "/user/my-orders";
  }, [fromTab]);

  const handleGoBack = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      sessionStorage.setItem("tp_my_orders_last_tab", fromTab);
    } catch (_) {}
    navigate(backTargetUrl, { state: { fromTab, tab: fromTab } });
  };

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
  const t = isIndo ? DETAIL_I18N.id : DETAIL_I18N.en;

  const [isPriceBreakdownOpen, setIsPriceBreakdownOpen] = useState(false);
  const [isTimestampsOpen, setIsTimestampsOpen] = useState(false);
  const [isAddressExpanded, setIsAddressExpanded] = useState(false);
  const [isBuyingAgain, setIsBuyingAgain] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showConfirmReceiptModal, setShowConfirmReceiptModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState("DAMAGED");
  const [returnNotes, setReturnNotes] = useState("");
  const [showChangePaymentModal, setShowChangePaymentModal] = useState(false);
  const [selectedPaymentCode, setSelectedPaymentCode] = useState("SP");

  const { add: addToCart } = useCart();

  const shopee = orderDetail?.shopeeDetail || null;
  const storeSlug =
    shopee?.storeProducts?.storeSlug ||
    orderDetail?.storeProducts?.storeSlug ||
    rawOrder?.storeSlug ||
    rawOrder?.store?.slug ||
    "kreasi-singkong";

  // Must be called unconditionally at top of component according to React Rules of Hooks
  const { data: storeIdentityData } = useQuery({
    queryKey: ["public-store-identity", storeSlug],
    queryFn: () => getStorePublicIdentityBySlug(storeSlug),
    enabled: Boolean(storeSlug),
    staleTime: 60_000,
  });

  const formattedTotalPayment = useMemo(() => {
    const rawVal =
      orderDetail?.summary?.total ??
      orderDetail?.total ??
      orderDetail?.totalAmount ??
      rawOrder?.totalAmount ??
      shopee?.pricing?.total ??
      shopee?.storeProducts?.summary?.total;
    if (typeof rawVal === "number" && rawVal > 0) {
      return formatCurrency(rawVal);
    }
    if (typeof rawVal === "string" && /^\d+$/.test(rawVal.trim())) {
      return formatCurrency(Number(rawVal.trim()));
    }
    if (orderDetail?.summary?.totalDisplay) {
      return orderDetail.summary.totalDisplay;
    }
    return "-";
  }, [orderDetail, rawOrder, shopee]);

  const handleCopyOrderNo = async (val, customMsg) => {
    if (!val) return;
    const msg = customMsg || t.copied;
    if (onCopy) {
      onCopy(val, msg);
      return;
    }
    try {
      await navigator.clipboard.writeText(val);
      toast.success(msg);
    } catch {
      toast.error(isIndo ? "Gagal menyalin teks." : "Copy failed.");
    }
  };

  if (isLoading) {
    return (
      <div className="tp-shopee-detail tp-shopee-detail--loading">
        <div className="tp-shopee-detail__skeleton-banner" />
        <div className="tp-shopee-detail__skeleton-card" />
        <div className="tp-shopee-detail__skeleton-card" />
      </div>
    );
  }

  if (error || !orderDetail) {
    return (
      <div className="tp-shopee-detail tp-shopee-detail--error">
        <Package size={48} className="tp-shopee-detail__error-icon" />
        <h2>{t.errorTitle}</h2>
        <p>{error?.message || t.errorTitle}</p>
        <div className="tp-shopee-detail__error-actions">
          {onRetry && (
            <button type="button" onClick={onRetry} className="tp-btn-secondary">
              {t.tryAgain}
            </button>
          )}
          <LinkComponent
            to={backTargetUrl}
            state={{ fromTab, tab: fromTab }}
            className="tp-btn-primary"
            onClick={handleGoBack}
          >
            {t.backToOrders}
          </LinkComponent>
        </div>
      </div>
    );
  }

  const invoiceData = rawOrder
    ? buildAccountOrderInvoiceModel({ order: rawOrder, groupedOrder, user })
    : null;

  const banner = shopee?.banner || {
    title: t.orderCompleted,
    tone: "success",
    subnote: t.guaranteeNotice,
    isDelivered: true,
  };

  const shippingInfo = shopee?.shippingInfo || {
    courier: "Standard Delivery",
    trackingNumber: orderDetail.order?.code || "-",
    statusText: t.shippingDelivered,
    timestamp: orderDetail.order?.placedAtDisplay || "-",
  };

  const isDigitalOrder = Boolean(shopee?.isDigitalOrder || shippingInfo?.isDigital);
  const isOrderPaid = !banner.isUnpaid && !banner.isCancelled;
  const isCompleted =
    Boolean(banner?.isCompleted) ||
    /complete|selesai/i.test(
      String(orderDetail?.status?.code || rawOrder?.status || banner?.title || "")
    );
  const isDelivered =
    Boolean(banner?.isDelivered) ||
    isCompleted ||
    /delivered|tiba/i.test(
      String(orderDetail?.status?.code || rawOrder?.status || banner?.title || "")
    );

  const returnPolicy = shopee?.returnPolicy || null;
  const isReturnExpired = Boolean(returnPolicy?.isReturnExpired);
  const canConfirmReceipt = isOrderPaid && isDelivered && !isCompleted;
  const canRequestReturn = isOrderPaid && (isDelivered || isCompleted) && !isReturnExpired;

  const shippingAddress = shopee?.shippingAddress || {
    name: orderDetail.account?.customerName || "Pelanggan",
    phone: orderDetail.account?.customerPhone || "-",
    address: orderDetail.account?.customerAddress || "-",
  };

  const storeProducts = shopee?.storeProducts || {
    storeName: t.store,
    storeSlug: "kreasi-singkong",
    storeBadge: "Star",
    items: orderDetail.items || [],
    summary: {
      subtotal: orderDetail.summary?.subtotalDisplay,
      shipping: orderDetail.summary?.shippingDisplay,
      serviceFee: orderDetail.summary?.serviceFeeDisplay,
      discount: orderDetail.summary?.discountDisplay,
      total: orderDetail.summary?.totalDisplay,
    },
  };

  const orderMeta = shopee?.orderMeta || {
    orderNo: orderDetail.order?.code || "-",
    paymentMethod: orderDetail.payment?.method || "-",
    sellerNote: "",
    timeline: {
      orderPlaced: orderDetail.order?.placedAtDisplay || "-",
      paidAt: "-",
      shippedAt: "-",
      deliveredAt: "-",
    },
  };

  const effectiveWhatsapp =
    storeIdentityData?.data?.whatsapp ||
    storeIdentityData?.data?.phone ||
    storeProducts?.storeWhatsapp ||
    "0895800536593";

  const totalOrderAmount =
    orderDetail?.summary?.total ??
    rawOrder?.totalAmount ??
    orderDetail?.totalAmount ??
    orderDetail?.total ??
    storeProducts?.summary?.total ??
    0;

  const orderPlacedDate =
    orderDetail?.order?.placedAt ||
    rawOrder?.createdAt ||
    orderDetail?.order?.createdAt ||
    null;

  const sellerChatUrl =
    buildStoreWhatsAppUrl({
      whatsappNumber: effectiveWhatsapp,
      orderRef: orderMeta?.orderNo || orderDetail?.order?.code || "",
      storeName: storeProducts?.storeName || "",
      orderDate: orderPlacedDate,
      paymentMethod: orderMeta?.paymentMethod || orderDetail?.payment?.method || "",
      totalAmount: totalOrderAmount,
      items: storeProducts?.items || orderDetail?.items || [],
      isIndo,
    }) || shopee?.helpActions?.chatUrl || "https://wa.me/62895800536593";

  const fullShippingAddress = String(shippingAddress?.address || "-");

  return (
    <>
      <div className="tp-shopee-detail">
        {/* Top Header Bar */}
        <header className="tp-shopee-detail__header">
          <LinkComponent
            to={backTargetUrl}
            state={{ fromTab, tab: fromTab }}
            className="tp-shopee-detail__back-btn"
            title={t.backToOrders}
            onClick={handleGoBack}
          >
            <ArrowLeft size={20} />
          </LinkComponent>
          <h1 className="tp-shopee-detail__header-title">{t.title}</h1>
        </header>

        {/* 1. Status Banner */}
        <section className={`tp-shopee-detail__banner tp-shopee-detail__banner--${banner.tone}`}>
          <div className="tp-shopee-detail__banner-main">
            <h2 className="tp-shopee-detail__banner-title">{banner.title}</h2>
          </div>
          <div className="tp-shopee-detail__banner-sub">
            <ShieldCheck size={16} className="tp-shopee-detail__banner-icon" />
            <span className="tp-shopee-detail__banner-text">
              {banner.subnote || t.guaranteeNotice}
            </span>
          </div>
        </section>

        {/* 2. Info Pengiriman */}
        <section
          className={`tp-shopee-detail__card tp-shopee-detail__card--shipping ${
            shippingInfo.isUnpaid ? "tp-shopee-detail__card--shipping-unpaid" : ""
          }`}
          onClick={() => {
            if (shippingInfo.isUnpaid || shippingInfo.isCancelled) return;
            if (onTrack && orderDetail?.actionability?.track) {
              onTrack(orderDetail.actionability.track);
            } else if (onTimeline) {
              onTimeline();
            }
          }}
          style={{ cursor: shippingInfo.isUnpaid || shippingInfo.isCancelled ? "default" : "pointer" }}
        >
          <div className="tp-shopee-detail__card-header-link">
            <div className="tp-shopee-detail__card-heading">
              {isDigitalOrder ? (
                <Download size={17} className="tp-shopee-detail__icon-primary" />
              ) : (
                <Truck size={17} className="tp-shopee-detail__icon-primary" />
              )}
              <h3 className="tp-shopee-detail__card-title">
                {isDigitalOrder
                  ? (isIndo ? "Informasi Pengiriman Digital" : "Digital Delivery Info")
                  : t.shippingInfo}
              </h3>
            </div>
            {!(shippingInfo.isUnpaid || shippingInfo.isCancelled || isDigitalOrder) && (
              <ChevronRight size={16} className="tp-shopee-detail__chevron" />
            )}
          </div>

          <div className="tp-shopee-detail__shipping-courier">
            <span>{shippingInfo.courier}</span>:{" "}
            {/^https?:\/\//i.test(String(shippingInfo.trackingNumber || "").trim()) ? (
              <a
                href={shippingInfo.trackingNumber}
                target="_blank"
                rel="noopener noreferrer"
                className="tp-shopee-detail__live-tracking-link"
                onClick={(e) => e.stopPropagation()}
                title="Buka Peta Pelacakan Langsung Driver"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "12px",
                  background: "#034c85",
                  color: "#ffffff",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  textDecoration: "none",
                  marginLeft: "4px",
                }}
              >
                <ExternalLink size={12} />
                <span>{isIndo ? "Lacak Live Driver (Peta)" : "Live Driver Map"}</span>
              </a>
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                <strong className="tp-shopee-detail__tracking-code">{shippingInfo.trackingNumber}</strong>
                {shippingInfo.officialTrackingUrl && (
                  <a
                    href={shippingInfo.officialTrackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tp-shopee-detail__live-tracking-link"
                    onClick={(e) => e.stopPropagation()}
                    title={isIndo ? "Lacak di Website Resmi Kurir" : "Track on Official Courier Website"}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: "rgba(254, 111, 5, 0.15)",
                      color: "#fe6f05",
                      border: "1px solid rgba(254, 111, 5, 0.35)",
                      fontSize: "11px",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    <ExternalLink size={11} />
                    <span>{isIndo ? `Lacak di Web Resmi ${shippingInfo.courierName || shippingInfo.courier || "Kurir"}` : `Track via ${shippingInfo.courierName || shippingInfo.courier || "Courier"}`}</span>
                  </a>
                )}
              </span>
            )}
          </div>

          <div className="tp-shopee-detail__shipping-status-row">
            <span
              className={`tp-shopee-detail__shipping-bullet ${
                shippingInfo.isDelivered
                  ? "tp-shopee-detail__shipping-bullet--delivered"
                  : shippingInfo.isUnpaid
                    ? "tp-shopee-detail__shipping-bullet--unpaid"
                    : shippingInfo.isCancelled
                      ? "tp-shopee-detail__shipping-bullet--cancelled"
                      : "tp-shopee-detail__shipping-bullet--active"
              }`}
            >
              ●
            </span>
            <div className="tp-shopee-detail__shipping-status-content">
              <p
                className={`tp-shopee-detail__shipping-status-label ${
                  shippingInfo.isUnpaid
                    ? "tp-shopee-detail__shipping-status-label--unpaid"
                    : shippingInfo.isCancelled
                      ? "tp-shopee-detail__shipping-status-label--cancelled"
                      : shippingInfo.isDelivered
                        ? "tp-shopee-detail__shipping-status-label--delivered"
                        : "tp-shopee-detail__shipping-status-label--active"
                }`}
              >
                {shippingInfo.statusText}
              </p>
              {shippingInfo.description && (
                <p className="tp-shopee-detail__shipping-status-desc">{shippingInfo.description}</p>
              )}
              {shippingInfo.timestamp && shippingInfo.timestamp !== "-" && (
                <time className="tp-shopee-detail__shipping-status-time">{shippingInfo.timestamp}</time>
              )}
            </div>
          </div>
        </section>

        {/* 3. Alamat Pengiriman */}
        <section className="tp-shopee-detail__card tp-shopee-detail__card--address">
          <div className="tp-shopee-detail__card-heading">
            <MapPin size={17} className="tp-shopee-detail__icon-primary" />
            <h3 className="tp-shopee-detail__card-title">{t.shippingAddress}</h3>
          </div>
          <div className="tp-shopee-detail__address-content">
            <div className="tp-shopee-detail__address-recipient">
              <strong>{shippingAddress.name}</strong>
              <span className="tp-shopee-detail__address-phone">{shippingAddress.phone}</span>
            </div>
            <p className="tp-shopee-detail__address-text">
              {isAddressExpanded
                ? fullShippingAddress
                : fullShippingAddress.length > 85
                  ? `${fullShippingAddress.slice(0, 85)}... `
                  : fullShippingAddress}
              {fullShippingAddress.length > 85 && (
                <button
                  type="button"
                  className="tp-shopee-detail__inline-expand"
                  onClick={() => setIsAddressExpanded(!isAddressExpanded)}
                >
                  {isAddressExpanded ? t.viewLess : t.view}
                </button>
              )}
            </p>
          </div>
        </section>

        {/* 4. Produk Pesanan yang Dipesan */}
        <section className="tp-shopee-detail__card tp-shopee-detail__card--products">
          <header className="tp-shopee-detail__store-header">
            <Link
              to={`/store/${storeProducts.storeSlug || "kreasi-singkong"}`}
              className="tp-shopee-detail__store-btn"
              title={(t.visitStore || "Kunjungi {{name}}").replace("{{name}}", storeProducts.storeName)}
              aria-label={(t.visitStore || "Kunjungi {{name}}").replace("{{name}}", storeProducts.storeName)}
            >
              <span className="tp-shopee-detail__store-tag">{storeProducts.storeBadge || "Star"}</span>
              <strong className="tp-shopee-detail__store-name">{storeProducts.storeName}</strong>
              <ChevronRight size={14} className="tp-shopee-detail__store-chevron" />
            </Link>
          </header>

          <div className="tp-shopee-detail__items-list">
            {(storeProducts.items || []).map((item, idx) => {
              const itemImg = resolveAssetUrl(item.image || item.imageUrl);
              return (
                <div key={item.id || idx} className="tp-shopee-detail__item-row">
                  <div className="tp-shopee-detail__item-thumb">
                    {itemImg ? (
                      <img src={itemImg} alt={item.name} loading="lazy" />
                    ) : (
                      <div className="tp-shopee-detail__item-thumb-fallback">
                        <Package size={22} />
                      </div>
                    )}
                  </div>
                  <div className="tp-shopee-detail__item-info">
                    <h4 className="tp-shopee-detail__item-name" title={item.name}>
                      {item.name}
                    </h4>
                    <div className="tp-shopee-detail__item-variant-row">
                      {item.isDigital ? (
                        <span className="tp-shopee-detail__item-digital-badge">
                          <Download size={11} />
                          <span>{isIndo ? "Produk Digital" : "Digital Product"}</span>
                        </span>
                      ) : (
                        <span className="tp-shopee-detail__item-variant">
                          {item.variant || item.variantLabel || "Standard"}
                        </span>
                      )}
                      <span className="tp-shopee-detail__item-qty">x{item.quantity || item.qty || 1}</span>
                    </div>
                    <div className="tp-shopee-detail__item-price">
                      {formatCurrency(
                        item.price ||
                        item.unitPrice ||
                        (item.lineTotal && item.quantity ? Math.round(item.lineTotal / item.quantity) : 0) ||
                        (storeProducts?.items?.length === 1 && storeProducts?.summary?.subtotal ? storeProducts.summary.subtotal : 0)
                      )}
                    </div>

                    {/* Digital Asset Access Box */}
                    {item.isDigital && (
                      <div className="tp-shopee-detail__item-digital-box">
                        {item.digitalAssetUrl ? (
                          <div className="tp-shopee-detail__item-digital-actions">
                            <a
                              href={item.digitalAssetUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="tp-shopee-detail__btn-download-asset"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Download size={13} />
                              <span>{isIndo ? "Unduh File Sekarang" : "Download File Now"}</span>
                            </a>
                            <button
                              type="button"
                              className="tp-shopee-detail__btn-copy-asset"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(item.digitalAssetUrl);
                              }}
                              title={isIndo ? "Salin Link Unduhan" : "Copy Download Link"}
                            >
                              <Copy size={12} />
                              <span>{isIndo ? "Salin Link" : "Copy"}</span>
                            </button>
                          </div>
                        ) : (
                          <div className="tp-shopee-detail__item-digital-locked">
                            <Clock size={12} />
                            <span>
                              {isOrderPaid
                                ? isIndo
                                  ? "Tautan file unduhan sedang disiapkan oleh penjual."
                                  : "Download file link is being prepared by the seller."
                                : isIndo
                                  ? "Selesaikan pembayaran untuk membuka akses unduhan file digital."
                                  : "Complete payment to unlock digital file download."}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total Pesanan with breakdown toggle */}
          <div className="tp-shopee-detail__total-summary">
            <div
              className="tp-shopee-detail__total-row"
              onClick={() => setIsPriceBreakdownOpen(!isPriceBreakdownOpen)}
            >
              <div className="tp-shopee-detail__total-label">
                <span>{t.totalOrder}:</span>
                <strong className="tp-shopee-detail__total-amount">
                  {storeProducts.summary?.total || orderDetail.summary?.totalDisplay}
                </strong>
              </div>
              <button
                type="button"
                className="tp-shopee-detail__breakdown-toggle-btn"
                aria-label="Toggle price breakdown"
              >
                {isPriceBreakdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {isPriceBreakdownOpen && (
              <div className="tp-shopee-detail__breakdown-box">
                <div className="tp-shopee-detail__breakdown-line">
                  <span>{t.subtotalProducts}</span>
                  <span>{storeProducts.summary?.subtotal || orderDetail.summary?.subtotalDisplay}</span>
                </div>
                <div className="tp-shopee-detail__breakdown-line">
                  <span>{t.shippingFee}</span>
                  <span>
                    {isDigitalOrder
                      ? (isIndo ? "Rp 0 (Bebas Ongkir / Digital)" : "Rp 0 (Free / Digital)")
                      : (storeProducts.summary?.shipping || orderDetail.summary?.shippingDisplay)}
                  </span>
                </div>
                {Number(orderDetail.summary?.serviceFee || 0) > 0 && (
                  <div className="tp-shopee-detail__breakdown-line">
                    <span>{t.serviceFee}</span>
                    <span>{storeProducts.summary?.serviceFee || orderDetail.summary?.serviceFeeDisplay}</span>
                  </div>
                )}
                {Number(orderDetail.summary?.discount || 0) > 0 && (
                  <div className="tp-shopee-detail__breakdown-line tp-shopee-detail__breakdown-line--discount">
                    <span>{t.discount}</span>
                    <span>-{storeProducts.summary?.discount || orderDetail.summary?.discountDisplay}</span>
                  </div>
                )}
                <div className="tp-shopee-detail__breakdown-line tp-shopee-detail__breakdown-line--final">
                  <strong>{t.totalPayment}</strong>
                  <strong className="tp-shopee-detail__highlight-price">
                    {storeProducts.summary?.total || orderDetail.summary?.totalDisplay}
                  </strong>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Jaminan & Kebijakan Pengembalian */}
        {isOrderPaid && (isDelivered || isCompleted) && (
          <section
            className="tp-shopee-detail__card"
            style={{
              borderLeft: "4px solid #034c85",
              background: "linear-gradient(135deg, rgba(3, 76, 133, 0.03) 0%, rgba(254, 111, 5, 0.03) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={18} style={{ color: "#034c85" }} />
                <h3 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#034c85" }}>
                  {isIndo ? "Jaminan & Kebijakan Pengembalian" : "Return & Guarantee Policy"}
                </h3>
              </div>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: "999px",
                  backgroundColor: isReturnExpired ? "#fee2e2" : "#e0f2fe",
                  color: isReturnExpired ? "#b91c1c" : "#034c85",
                }}
              >
                {isReturnExpired
                  ? (isIndo ? "Batas Retur Berakhir" : "Return Window Expired")
                  : (isIndo ? "Maksimal 7 Hari" : "Max 7 Days")}
              </span>
            </div>

            <div style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.55, display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <Clock size={14} style={{ color: "#fe6f05", marginTop: "3px", flexShrink: 0 }} />
                <span>
                  {isIndo
                    ? "Batas pengajuan pengembalian barang dan dana maksimal 7 hari (dan 2 hari untuk penjual tertentu) setelah pesanan tiba di aplikasi TP Preneurs."
                    : "Return and refund requests are allowed within 7 days (or 2 days for specific sellers) after delivery."}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "6px",
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#9a3412",
                  fontWeight: 500,
                }}
              >
                <AlertTriangle size={14} style={{ color: "#fe6f05", marginTop: "2px", flexShrink: 0 }} />
                <span>
                  {isIndo
                    ? "Pengembalian barang dan dana tidak bisa diajukan jika melewati batas waktu yang telah ditentukan."
                    : "Return and refund requests cannot be submitted after the specified deadline has passed."}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.78rem", color: "#64748b" }}>
                <CheckCircle2 size={13} style={{ color: "#034c85", marginTop: "2px", flexShrink: 0 }} />
                <span>
                  {isIndo
                    ? "Jika Anda tidak mengajukan pengembalian dalam 7 hari atau klik 'Pesanan Diterima', sistem otomatis menyelesaikan pesanan dan meneruskan dana ke Saldo Tersedia penjual."
                    : "If you do not request a return within 7 days or confirm receipt, the system automatically completes the order and releases funds to the seller's available balance."}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* 5. Butuh Bantuan? */}
        <section className="tp-shopee-detail__card tp-shopee-detail__card--help">
          <h3 className="tp-shopee-detail__card-title tp-shopee-detail__card-title--pad">
            {t.needHelp}
          </h3>
          <div className="tp-shopee-detail__help-list">
            {!isDigitalOrder && (
              <button
                type="button"
                onClick={() => setShowReturnModal(true)}
                className="tp-shopee-detail__help-item"
                style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div className="tp-shopee-detail__help-left">
                  <RotateCcw size={17} className="tp-shopee-detail__help-icon" style={{ color: "#fe6f05" }} />
                  <span>{t.requestReturn}</span>
                </div>
                <ChevronRight size={16} className="tp-shopee-detail__chevron" />
              </button>
            )}

            <a
              href={sellerChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="tp-shopee-detail__help-item"
              title={`WhatsApp ${storeProducts.storeName}`}
            >
              <div className="tp-shopee-detail__help-left">
                <MessageCircle size={17} className="tp-shopee-detail__help-icon" />
                <span>{t.contactSeller}</span>
              </div>
              <ChevronRight size={16} className="tp-shopee-detail__chevron" />
            </a>

            <Link
              to={`/contact-us?topic=order&ref=${encodeURIComponent(orderMeta.orderNo)}`}
              className="tp-shopee-detail__help-item"
            >
              <div className="tp-shopee-detail__help-left">
                <Headphones size={17} className="tp-shopee-detail__help-icon" />
                <span>{t.customerService}</span>
              </div>
              <ChevronRight size={16} className="tp-shopee-detail__chevron" />
            </Link>
          </div>
        </section>

        {/* 6. No. Pesanan & Linimasa */}
        <section className="tp-shopee-detail__card tp-shopee-detail__card--meta">
          <div className="tp-shopee-detail__meta-row">
            <span className="tp-shopee-detail__meta-label">{t.orderNo}</span>
            <div className="tp-shopee-detail__meta-val-copy">
              <strong
                className="tp-shopee-detail__order-num"
                title={orderMeta.rawOrderNo ? `Invoice: ${orderMeta.rawOrderNo}` : orderMeta.orderNo}
              >
                {orderMeta.orderNo}
              </strong>
              <button
                type="button"
                className="tp-shopee-detail__copy-pill"
                title={t.copy}
                onClick={() => handleCopyOrderNo(orderMeta.orderNo)}
              >
                {t.copy}
              </button>
            </div>
          </div>

          {/* Synchronized Gateway Order ID / Reference (Duitku) */}
          {Boolean(
            (orderMeta.gatewayOrderId && orderMeta.gatewayOrderId !== orderMeta.orderNo) ||
            (orderMeta.rawOrderNo && orderMeta.rawOrderNo !== orderMeta.orderNo)
          ) && (
            <div className="tp-shopee-detail__meta-row tp-shopee-detail__meta-row--sub">
              <div className="tp-shopee-detail__meta-label-group">
                <span className="tp-shopee-detail__meta-label">{t.gatewayOrderId}</span>
                <span className="tp-shopee-detail__meta-hint">{t.gatewayOrderHint}</span>
              </div>
              <div className="tp-shopee-detail__meta-val-copy">
                <span className="tp-shopee-detail__gateway-id">
                  {orderMeta.gatewayOrderId || orderMeta.rawOrderNo}
                </span>
                <button
                  type="button"
                  className="tp-shopee-detail__copy-pill"
                  title={t.copy}
                  onClick={() =>
                    handleCopyOrderNo(
                      orderMeta.gatewayOrderId || orderMeta.rawOrderNo,
                      t.gatewayOrderCopied
                    )
                  }
                >
                  {t.copy}
                </button>
              </div>
            </div>
          )}

          <div className="tp-shopee-detail__meta-row">
            <span className="tp-shopee-detail__meta-label">{t.paymentMethod}</span>
            <div className="tp-shopee-detail__meta-val-wrap">
              <span className="tp-shopee-detail__meta-val">{orderMeta.paymentMethod}</span>
              {banner.isUnpaid && (
                <button
                  type="button"
                  className="tp-shopee-detail__change-payment-btn"
                  onClick={() => setShowChangePaymentModal(true)}
                  title={t.changePaymentMethod}
                >
                  <CreditCard size={13} />
                  <span>{t.changeMethod}</span>
                </button>
              )}
            </div>
          </div>

          {orderMeta.sellerNote && (
            <div className="tp-shopee-detail__meta-row">
              <span className="tp-shopee-detail__meta-label">{t.sellerNote}</span>
              <span className="tp-shopee-detail__meta-val">{orderMeta.sellerNote}</span>
            </div>
          )}

          <div className="tp-shopee-detail__meta-row">
            <span className="tp-shopee-detail__meta-label">{t.invoice}</span>
            <button
              type="button"
              className="tp-shopee-detail__invoice-link"
              onClick={() => {
                if (onInvoice) {
                  onInvoice(orderDetail.actionability?.invoice);
                } else if (onPrint) {
                  onPrint();
                } else {
                  window.print();
                }
              }}
            >
              <span>{t.view}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Timestamps */}
          {isTimestampsOpen && (
            <div className="tp-shopee-detail__timestamps-box">
              <div className="tp-shopee-detail__meta-row">
                <span className="tp-shopee-detail__meta-label">{t.orderTime}</span>
                <span className="tp-shopee-detail__meta-val">{orderMeta.timeline?.orderPlaced || "-"}</span>
              </div>
              {orderMeta.timeline?.paidAt && (
                <div className="tp-shopee-detail__meta-row">
                  <span className="tp-shopee-detail__meta-label">{t.paymentTime}</span>
                  <span className="tp-shopee-detail__meta-val">{orderMeta.timeline.paidAt}</span>
                </div>
              )}
              {orderMeta.timeline?.shippedAt && (
                <div className="tp-shopee-detail__meta-row">
                  <span className="tp-shopee-detail__meta-label">{t.shippingTime}</span>
                  <span className="tp-shopee-detail__meta-val">{orderMeta.timeline.shippedAt}</span>
                </div>
              )}
              {orderMeta.timeline?.deliveredAt && (
                <div className="tp-shopee-detail__meta-row">
                  <span className="tp-shopee-detail__meta-label">{t.completedTime}</span>
                  <span className="tp-shopee-detail__meta-val">{orderMeta.timeline.deliveredAt}</span>
                </div>
              )}
            </div>
          )}

          <div className="tp-shopee-detail__expand-wrap">
            <button
              type="button"
              className="tp-shopee-detail__expand-btn"
              onClick={() => setIsTimestampsOpen(!isTimestampsOpen)}
            >
              <span>{isTimestampsOpen ? t.viewLess : t.viewAll}</span>
              {isTimestampsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </section>

        {/* 7. Kamu Mungkin Juga Suka */}
        <ProductRecommendationGrid isIndo={isIndo} />

        {/* 8. Bottom Sticky Action Bar */}
        <div className="tp-shopee-detail__bottom-bar">
          {(() => {
            const handleBuyAgain = async () => {
              if (isBuyingAgain) return;
              setIsBuyingAgain(true);
              try {
                const itemsToBuy = Array.isArray(storeProducts?.items) && storeProducts.items.length > 0
                  ? storeProducts.items
                  : Array.isArray(orderDetail?.items)
                    ? orderDetail.items
                    : [];
                const validItems = itemsToBuy.filter((it) => Number(it.productId) > 0);
                if (validItems.length > 0) {
                  for (const it of validItems) {
                    await addToCart(Number(it.productId), Math.max(1, Number(it.quantity || it.qty) || 1), {
                      name: it.name,
                      price: Number(it.unitPrice || it.price) || 0,
                      imageUrl: it.image || null,
                      variantLabel: it.variant || it.variantLabel || null,
                    });
                  }
                  navigate("/cart");
                } else if (itemsToBuy[0]?.slug) {
                  navigate(`/products/${itemsToBuy[0].slug}`);
                } else {
                  navigate("/cart");
                }
              } catch (err) {
                console.error("Failed to buy again:", err);
                navigate("/cart");
              } finally {
                setIsBuyingAgain(false);
              }
            };

            return (
              <button
                type="button"
                onClick={handleBuyAgain}
                disabled={isBuyingAgain}
                className="tp-shopee-detail__btn-outline"
              >
                {isBuyingAgain ? t.addingToCart : t.buyAgain}
              </button>
            );
          })()}

          {/* Action: Pesanan Diterima (Confirmation) */}
          {canConfirmReceipt && onConfirmReceipt && (
            <button
              type="button"
              onClick={() => setShowConfirmReceiptModal(true)}
              disabled={isConfirmingReceipt}
              className="tp-shopee-detail__btn-orange"
              style={{ backgroundColor: "#034c85", borderColor: "#034c85" }}
            >
              {isConfirmingReceipt ? (
                <>
                  <Loader2 size={14} className="tp-spin" />
                  <span>{isIndo ? "Memproses..." : "Processing..."}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>{isIndo ? "Pesanan Diterima" : "Order Received"}</span>
                </>
              )}
            </button>
          )}

          {/* Action: Ajukan Pengembalian (Return Request) */}
          {canRequestReturn && (
            <button
              type="button"
              onClick={() => setShowReturnModal(true)}
              className="tp-shopee-detail__btn-outline"
              style={{ borderColor: "#fe6f05", color: "#fe6f05", fontWeight: 600 }}
            >
              <RotateCcw size={14} />
              <span>{isIndo ? "Ajukan Pengembalian" : "Request Return"}</span>
            </button>
          )}

          {banner.isUnpaid && orderDetail.actionability?.cancelOrder?.enabled && (
            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              disabled={isCancelling}
              className="tp-shopee-detail__btn-outline tp-shopee-detail__btn-outline--danger"
            >
              {isCancelling ? (
                <>
                  <Loader2 size={14} className="tp-spin" />
                  <span>{t.cancelling}</span>
                </>
              ) : (
                <span>{t.cancelOrder}</span>
              )}
            </button>
          )}

          {banner.isUnpaid && (
            <button
              type="button"
              onClick={() => setShowChangePaymentModal(true)}
              className="tp-shopee-detail__btn-outline tp-shopee-detail__btn-outline--change"
              title={t.changePaymentMethod}
            >
              <CreditCard size={14} />
              <span>{t.changeMethod}</span>
            </button>
          )}

          {banner.isUnpaid && (orderDetail.actionability?.payment?.url || orderDetail.actionability?.payment?.path || onPayNow) ? (
            <button
              type="button"
              onClick={() => {
                const payUrl = orderDetail.actionability?.payment?.url;
                if (payUrl && /^https?:\/\//i.test(payUrl)) {
                  window.location.href = payUrl;
                } else if (onPayNow) {
                  onPayNow();
                } else if (orderDetail.actionability?.payment?.path) {
                  if (/^https?:\/\//i.test(orderDetail.actionability.payment.path)) {
                    window.location.href = orderDetail.actionability.payment.path;
                  } else {
                    navigate(orderDetail.actionability.payment.path);
                  }
                }
              }}
              disabled={isPaying}
              className="tp-shopee-detail__btn-orange"
            >
              {isPaying ? t.paying : t.payNow}
            </button>
          ) : (() => {
            const targetPid =
              orderDetail.items?.find((it) => !it.isReviewed && Number(it.productId) > 0)?.productId ||
              orderDetail.items?.find((it) => Number(it.productId) > 0)?.productId ||
              null;
            const isOrderFullyReviewed =
              orderDetail.isReviewed ||
              (Array.isArray(orderDetail.items) &&
                orderDetail.items.length > 0 &&
                orderDetail.items.every((it) => it.isReviewed));

            if (isOrderFullyReviewed) {
              return (
                <LinkComponent
                  to={`/user/my-reviews?tab=reviewed${targetPid ? `&productId=${targetPid}` : ""}`}
                  className="tp-shopee-detail__btn-outline"
                >
                  {t.viewReview}
                </LinkComponent>
              );
            }

            return (
              <LinkComponent
                to={`/user/my-reviews${targetPid ? `?productId=${targetPid}` : ""}`}
                className="tp-shopee-detail__btn-orange"
              >
                {t.review}
              </LinkComponent>
            );
          })()}
        </div>
      </div>

      <AccountOrderInvoicePrint
        invoiceData={invoiceData}
        themeMode="light"
        dashboardSettingCopy={dashboardSettingCopy}
      />

      {showCancelModal && (
        <div
          className="tp-cancel-modal-backdrop"
          onClick={() => setShowCancelModal(false)}
        >
          <div
            className="tp-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-order-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top row: Warning Icon Badge & Close Button */}
            <div className="tp-cancel-modal__header">
              <div className="tp-cancel-modal__icon-badge">
                <AlertTriangle size={22} className="tp-cancel-modal__alert-svg" />
              </div>
              <button
                type="button"
                className="tp-cancel-modal__close-btn"
                onClick={() => setShowCancelModal(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content: Title, Order Context, Explanation */}
            <div className="tp-cancel-modal__content">
              <h3 id="cancel-order-modal-title" className="tp-cancel-modal__title">
                {t.cancelModalTitle}
              </h3>

              {orderMeta?.orderNo && (
                <div className="tp-cancel-modal__order-badge">
                  <span className="tp-cancel-modal__order-label">{t.orderNo}:</span>
                  <strong className="tp-cancel-modal__order-code">{orderMeta.orderNo}</strong>
                </div>
              )}

              <p className="tp-cancel-modal__desc">{t.cancelModalBody}</p>
            </div>

            {/* Actions: Back (Kembali) & Confirm (Ya, Batalkan Pesanan) */}
            <div className="tp-cancel-modal__actions">
              <button
                type="button"
                className="tp-cancel-modal__btn-back"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                {t.cancelModalBack}
              </button>
              <button
                type="button"
                className="tp-cancel-modal__btn-confirm"
                disabled={isCancelling}
                onClick={async () => {
                  setShowCancelModal(false);
                  if (onCancelOrder) await onCancelOrder();
                }}
              >
                {isCancelling ? (
                  <>
                    <Loader2 size={16} className="tp-spin" />
                    <span>{t.cancelling}</span>
                  </>
                ) : (
                  <span>{t.cancelModalConfirm}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmReceiptModal && (
        <div
          className="tp-cancel-modal-backdrop"
          onClick={() => setShowConfirmReceiptModal(false)}
        >
          <div
            className="tp-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tp-confirm-receipt-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tp-cancel-modal__icon">
              <CheckCircle2 size={24} style={{ color: "#034c85" }} />
            </div>
            <h3 id="tp-confirm-receipt-title" className="tp-cancel-modal__title">
              {isIndo ? "Konfirmasi Pesanan Diterima" : "Confirm Order Received"}
            </h3>
            <p className="tp-cancel-modal__desc">
              {isIndo
                ? "Apakah Anda yakin telah menerima semua produk pesanan ini dalam kondisi baik? Setelah dikonfirmasi, status pesanan akan selesai dan dana penjualan akan diteruskan ke Saldo Tersedia penjual."
                : "Are you sure you have received all items in good condition? Once confirmed, the order is marked as completed and funds will be released to the seller's available balance."}
            </p>
            <div className="tp-cancel-modal__actions">
              <button
                type="button"
                className="tp-cancel-modal__btn-back"
                onClick={() => setShowConfirmReceiptModal(false)}
                disabled={isConfirmingReceipt}
              >
                {isIndo ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                className="tp-cancel-modal__btn-confirm"
                style={{ backgroundColor: "#034c85", borderColor: "#034c85" }}
                disabled={isConfirmingReceipt}
                onClick={async () => {
                  setShowConfirmReceiptModal(false);
                  if (onConfirmReceipt) await onConfirmReceipt();
                }}
              >
                {isConfirmingReceipt ? (
                  <>
                    <Loader2 size={16} className="tp-spin" />
                    <span>{isIndo ? "Memproses..." : "Processing..."}</span>
                  </>
                ) : (
                  <span>{isIndo ? "Ya, Pesanan Diterima" : "Yes, Order Received"}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div
          className="tp-cancel-modal-backdrop"
          onClick={() => setShowReturnModal(false)}
        >
          <div
            className="tp-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tp-return-modal-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "480px" }}
          >
            <div className="tp-cancel-modal__header">
              <div
                className="tp-cancel-modal__icon-badge"
                style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa", color: "#fe6f05" }}
              >
                <RotateCcw size={22} />
              </div>
              <button
                type="button"
                className="tp-cancel-modal__close-btn"
                onClick={() => setShowReturnModal(false)}
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="tp-cancel-modal__content">
              <h3 id="tp-return-modal-title" className="tp-cancel-modal__title">
                {isIndo ? "Ajukan Pengembalian Barang & Dana" : "Request Return & Refund"}
              </h3>
              <div className="tp-cancel-modal__order-badge">
                <span className="tp-cancel-modal__order-label">{t.orderNo}:</span>
                <span className="tp-cancel-modal__order-code">{orderMeta.orderNo}</span>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "#fff7ed",
                  border: "1px solid #fed7aa",
                  color: "#9a3412",
                  fontSize: "0.82rem",
                  lineHeight: 1.5,
                  marginBottom: "14px",
                }}
              >
                <strong>{isIndo ? "Perhatian Penting: " : "Important Note: "}</strong>
                {isIndo
                  ? "Batas pengajuan pengembalian barang dan dana maksimal 7 hari (dan 2 hari untuk penjual tertentu) setelah pesanan tiba di aplikasi TP Preneurs. Pengembalian barang dan dana tidak bisa diajukan jika melewati batas waktu yang telah ditentukan."
                  : "Return and refund requests are allowed within 7 days (or 2 days for specific sellers) after delivery. Returns cannot be submitted once the deadline has expired."}
              </div>

              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "#334155",
                }}
              >
                {isIndo ? "Alasan Pengembalian:" : "Reason for Return:"}
              </label>
              <select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  marginBottom: "12px",
                  backgroundColor: "#ffffff",
                  color: "#0f172a",
                }}
              >
                <option value="DAMAGED">
                  {isIndo ? "Barang rusak atau cacat saat diterima" : "Item damaged or defective upon arrival"}
                </option>
                <option value="NOT_MATCH">
                  {isIndo ? "Produk tidak sesuai foto / deskripsi" : "Product doesn't match description or photo"}
                </option>
                <option value="INCOMPLETE">
                  {isIndo ? "Jumlah barang kurang / paket tidak lengkap" : "Incomplete package / missing items"}
                </option>
                <option value="WRONG_ITEM">
                  {isIndo ? "Salah kirim barang atau beda varian" : "Wrong item or different variant received"}
                </option>
                <option value="OTHER">
                  {isIndo ? "Kendala pengiriman lainnya" : "Other shipping issue"}
                </option>
              </select>

              <label
                style={{
                  display: "block",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  marginBottom: "6px",
                  color: "#334155",
                }}
              >
                {isIndo ? "Rincian / Catatan Tambahan (Opsional):" : "Additional Notes (Optional):"}
              </label>
              <textarea
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
                placeholder={
                  isIndo
                    ? "Jelaskan kendala produk yang Anda temukan secara singkat..."
                    : "Briefly describe the issue encountered with the product..."
                }
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.85rem",
                  marginBottom: "16px",
                  resize: "vertical",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              className="tp-cancel-modal__actions"
              style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}
            >
              <button
                type="button"
                className="tp-cancel-modal__btn-back"
                onClick={() => setShowReturnModal(false)}
              >
                {isIndo ? "Batal" : "Cancel"}
              </button>
              <a
                href={
                  buildStoreWhatsAppUrl({
                    whatsappNumber: storeProducts.storeWhatsapp,
                    orderRef: orderMeta.orderNo,
                    storeName: storeProducts.storeName,
                    orderDate: orderDetail?.order?.placedAt,
                    paymentMethod: orderMeta.paymentMethod,
                    totalAmount: storeProducts.summary?.total,
                    items: storeProducts.items,
                    isIndo,
                  }) +
                  `%0A%0A*Pengajuan%20Pengembalian*%3A%20${encodeURIComponent(returnReason)}%0A*Catatan*%3A%20${encodeURIComponent(returnNotes || "-")}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="tp-cancel-modal__btn-confirm"
                style={{ backgroundColor: "#25D366", borderColor: "#25D366" }}
                onClick={() => setShowReturnModal(false)}
              >
                <MessageCircle size={15} />
                <span>{isIndo ? "Hubungi Penjual (WA)" : "Contact Seller (WA)"}</span>
              </a>
              <button
                type="button"
                className="tp-cancel-modal__btn-confirm"
                style={{ backgroundColor: "#fe6f05", borderColor: "#fe6f05" }}
                onClick={() => {
                  setShowReturnModal(false);
                  navigate(
                    `/contact-us?topic=return&ref=${encodeURIComponent(orderMeta.orderNo)}&reason=${encodeURIComponent(returnReason)}&notes=${encodeURIComponent(returnNotes)}`
                  );
                }}
              >
                <span>{isIndo ? "Kirim ke CS Prioritas" : "Submit to CS Support"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentSuccessModal && (
        <div
          className="tp-payment-success-modal-backdrop"
          onClick={() => {
            if (onCloseSuccessModal) onCloseSuccessModal();
          }}
        >
          <div
            className="tp-payment-success-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tp-payment-success-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Header Icon with Animated Glowing Ring */}
            <div className="tp-payment-success-modal__icon-wrap">
              <div className="tp-payment-success-modal__pulse-ring" />
              <div className="tp-payment-success-modal__icon-badge">
                <CheckCircle2 size={30} className="tp-payment-success-modal__check-svg" />
              </div>
            </div>

            <button
              type="button"
              className="tp-payment-success-modal__close-btn"
              onClick={() => {
                if (onCloseSuccessModal) onCloseSuccessModal();
              }}
              aria-label="Tutup"
            >
              &times;
            </button>

            <div className="tp-payment-success-modal__content">
              <h2 id="tp-payment-success-title" className="tp-payment-success-modal__title">
                {t.paymentSuccessTitle}
              </h2>
              <p className="tp-payment-success-modal__desc">
                {t.paymentSuccessDesc}
              </p>

              {/* Receipt / Transaction Overview Card */}
              <div className="tp-payment-success-modal__receipt">
                <div className="tp-payment-success-modal__receipt-row">
                  <span className="tp-payment-success-modal__receipt-label">{t.orderNo}</span>
                  <div className="tp-payment-success-modal__receipt-code-wrap">
                    <strong className="tp-payment-success-modal__receipt-val tp-payment-success-modal__receipt-val--code">
                      {orderMeta.orderNo}
                    </strong>
                    <button
                      type="button"
                      className="tp-payment-success-modal__copy-pill"
                      title={t.copy}
                      onClick={() => handleCopyOrderNo(orderMeta.orderNo)}
                    >
                      <Copy size={11} />
                      <span>{t.copy}</span>
                    </button>
                  </div>
                </div>

                <div className="tp-payment-success-modal__receipt-row">
                  <span className="tp-payment-success-modal__receipt-label">{t.totalPayment}</span>
                  <span className="tp-payment-success-modal__receipt-val tp-payment-success-modal__receipt-val--total">
                    {formattedTotalPayment}
                  </span>
                </div>

                <div className="tp-payment-success-modal__receipt-row">
                  <span className="tp-payment-success-modal__receipt-label">{t.paymentMethod}</span>
                  <span className="tp-payment-success-modal__receipt-val">
                    {orderMeta.paymentMethod || "Duitku"}
                  </span>
                </div>

                {returnReference && (
                  <div className="tp-payment-success-modal__receipt-row">
                    <span className="tp-payment-success-modal__receipt-label">{t.paymentReference}</span>
                    <span className="tp-payment-success-modal__receipt-val tp-payment-success-modal__receipt-val--mono">
                      {returnReference}
                    </span>
                  </div>
                )}
              </div>

              {/* Next Steps Guide (Langkah Selanjutnya - Singkat & Padat) */}
              <div className="tp-payment-success-modal__guide">
                <div className="tp-payment-success-modal__guide-header">
                  <Sparkles size={13} className="tp-payment-success-modal__sparkle" />
                  <span className="tp-payment-success-modal__guide-title">{t.nextStepsTitle}</span>
                </div>

                <div className="tp-payment-success-modal__steps">
                  <div className="tp-payment-success-modal__step">
                    <div className="tp-payment-success-modal__step-icon">
                      <Package size={13} />
                    </div>
                    <div className="tp-payment-success-modal__step-body">
                      <strong className="tp-payment-success-modal__step-heading">{t.step1Title}</strong>
                      <p className="tp-payment-success-modal__step-text">{t.step1Desc}</p>
                    </div>
                  </div>

                  <div className="tp-payment-success-modal__step">
                    <div className="tp-payment-success-modal__step-icon">
                      <Truck size={13} />
                    </div>
                    <div className="tp-payment-success-modal__step-body">
                      <strong className="tp-payment-success-modal__step-heading">{t.step2Title}</strong>
                      <p className="tp-payment-success-modal__step-text">{t.step2Desc}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Layout Compact & Proporsional */}
              <div className="tp-payment-success-modal__actions">
                <div className="tp-payment-success-modal__btn-row">
                  <button
                    type="button"
                    className="tp-payment-success-modal__btn-primary"
                    onClick={() => {
                      if (onTrackFromSuccessModal) {
                        onTrackFromSuccessModal();
                      } else {
                        if (onCloseSuccessModal) onCloseSuccessModal();
                        if (onTimeline) onTimeline();
                      }
                    }}
                  >
                    <Truck size={15} />
                    <span>{t.btnTrackOrder}</span>
                  </button>

                  <button
                    type="button"
                    className="tp-payment-success-modal__btn-secondary"
                    onClick={() => {
                      if (onCloseSuccessModal) onCloseSuccessModal();
                    }}
                  >
                    <FileText size={15} />
                    <span>{t.btnViewDetails}</span>
                  </button>
                </div>

                <Link
                  to="/shop"
                  className="tp-payment-success-modal__btn-ghost"
                  onClick={() => {
                    if (onCloseSuccessModal) onCloseSuccessModal();
                  }}
                >
                  <ShoppingBag size={14} />
                  <span>{t.btnContinueShopping}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {showChangePaymentModal && (
        <div
          className="tp-change-payment-modal-backdrop"
          onClick={() => setShowChangePaymentModal(false)}
        >
          <div
            className="tp-change-payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tp-change-payment-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="tp-change-payment-modal__header">
              <div className="tp-change-payment-modal__header-left">
                <div className="tp-change-payment-modal__icon-badge">
                  <CreditCard size={20} className="tp-change-payment-modal__header-icon" />
                </div>
                <div>
                  <h3 id="tp-change-payment-title" className="tp-change-payment-modal__title">
                    {t.selectPaymentMethodTitle}
                  </h3>
                  <p className="tp-change-payment-modal__subtitle">
                    {t.selectPaymentMethodDesc}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="tp-change-payment-modal__close-btn"
                onClick={() => setShowChangePaymentModal(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Method notice */}
            <div className="tp-change-payment-modal__current-notice">
              <span className="tp-change-payment-modal__current-label">{t.currentPaymentMethod}</span>
              <strong className="tp-change-payment-modal__current-val">{orderMeta.paymentMethod}</strong>
            </div>

            {/* Order No confirmation banner */}
            <div className="tp-change-payment-modal__order-banner">
              <span className="tp-change-payment-modal__order-label">{t.orderNo}</span>
              <strong className="tp-change-payment-modal__order-value">{orderMeta.orderNo}</strong>
            </div>

            {/* Body: Channels grouped by Category */}
            <div className="tp-change-payment-modal__body">
              {(() => {
                const categories = [
                  {
                    id: "qris",
                    title: isIndo ? "QRIS (Semua E-Wallet & Mobile Banking)" : "QRIS (All E-Wallets & Mobile Banking)",
                    icon: <QrCode size={16} />,
                  },
                  {
                    id: "va",
                    title: isIndo ? "Virtual Account (Transfer Otomatis 24 Jam)" : "Virtual Account (Automatic Bank Transfer)",
                    icon: <CreditCard size={16} />,
                  },
                  {
                    id: "ewallet",
                    title: isIndo ? "E-Wallet" : "E-Wallet",
                    icon: <Wallet size={16} />,
                  },
                  {
                    id: "retail",
                    title: isIndo ? "Gerai Retail" : "Retail Store",
                    icon: <ShoppingBag size={16} />,
                  },
                ];

                return categories.map((cat) => {
                  const methods = DUITKU_PAYMENT_METHODS.filter((m) => m.category === cat.id);
                  if (!methods.length) return null;

                  return (
                    <div key={cat.id} className="tp-change-payment-modal__group">
                      <div className="tp-change-payment-modal__group-title">
                        {cat.icon}
                        <span>{cat.title}</span>
                      </div>
                      <div className="tp-change-payment-modal__group-grid">
                        {methods.map((m) => {
                          const isSelected = selectedPaymentCode === m.code;
                          return (
                            <div
                              key={m.code}
                              className={`tp-change-payment-modal__method-card ${
                                isSelected ? "tp-change-payment-modal__method-card--selected" : ""
                              }`}
                              onClick={() => setSelectedPaymentCode(m.code)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedPaymentCode(m.code);
                                }
                              }}
                            >
                              <div className="tp-change-payment-modal__radio-wrap">
                                <div
                                  className={`tp-change-payment-modal__radio ${
                                    isSelected ? "tp-change-payment-modal__radio--checked" : ""
                                  }`}
                                />
                              </div>
                              <div className="tp-change-payment-modal__method-info">
                                <div className="tp-change-payment-modal__method-top">
                                  <span className="tp-change-payment-modal__method-label">{m.label}</span>
                                  {m.badge && (
                                    <span className="tp-change-payment-modal__method-badge">{m.badge}</span>
                                  )}
                                </div>
                                <span className="tp-change-payment-modal__method-desc">{m.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer / Actions */}
            <div className="tp-change-payment-modal__actions">
              <button
                type="button"
                className="tp-change-payment-modal__btn-cancel"
                onClick={() => setShowChangePaymentModal(false)}
                disabled={isPaying}
              >
                {t.cancelModalBack}
              </button>
              <button
                type="button"
                className="tp-change-payment-modal__btn-confirm"
                disabled={isPaying || !selectedPaymentCode}
                onClick={async () => {
                  if (!selectedPaymentCode) return;
                  setShowChangePaymentModal(false);
                  if (onPayNow) {
                    await onPayNow(selectedPaymentCode);
                  }
                }}
              >
                {isPaying ? (
                  <>
                    <Loader2 size={16} className="tp-spin" />
                    <span>{t.paying}</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={16} />
                    <span>{t.confirmAndPay}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
