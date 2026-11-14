import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Printer,
  ShieldCheck,
  Truck,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import "../../../pages/seller/workspace/seller-suborder-detail-2026.css";
import "./admin-order-detail-2026.css";

const I18N = {
  id: {
    back: "Kembali ke Pesanan",
    title: "Rincian Pesanan",
    orderNo: "No. Pesanan",
    suborderNo: "No. Suborder",
    copy: "Salin",
    copied: "Berhasil disalin",
    customer: "Pelanggan",
    address: "Alamat Pengiriman",
    whatsapp: "WhatsApp",
    items: "Produk Pesanan",
    product: "Produk",
    variant: "Varian",
    qty: "Jumlah",
    price: "Harga",
    subtotal: "Subtotal",
    shipping: "Pengiriman & Ekspedisi",
    courier: "Kurir",
    service: "Layanan",
    shippingFee: "Total Ongkir",
    serviceFee: "Biaya Layanan",
    discount: "Diskon",
    totalWeight: "Berat Total Paket",
    autoCalculated: "Hitungan Otomatis",
    trackingNo: "Nomor Resi / Pelacakan",
    noTracking: "Belum ada resi",
    paymentSummary: "Ringkasan Pembayaran",
    method: "Metode Pembayaran",
    paymentStatus: "Status Bayar",
    totalPayment: "Total Pembayaran",
    notes: "Catatan Pesanan",
    buyerNote: "Catatan Pembeli",
    printLabel: "Cetak Label",
    messageBuyer: "Hubungi Pembeli",
    openSellerStore: "Buka di Seller Toko",
    adminActions: "Kelola Status Pesanan",
    updateStatus: "Perbarui Status",
    updating: "Memperbarui...",
    statusUpdated: "Status pesanan berhasil diperbarui.",
    selectStatus: "-- Pilih Status Pesanan --",
    orderCancelled: "Pesanan Dibatalkan",
    orderCancelledDesc: "Pesanan dibatalkan atau waktu pembayaran telah kedaluwarsa.",
    orderUnpaid: "Menunggu Pembayaran",
    orderUnpaidDesc: "Menunggu konfirmasi pembayaran dari pembeli.",
    orderProcessing: "Pesanan Diproses",
    orderProcessingDesc: "Pembayaran telah diverifikasi, pesanan siap diproses.",
    orderShipped: "Pesanan Dikirim",
    orderShippedDesc: "Paket telah diserahkan ke pihak ekspedisi.",
    orderCompleted: "Pesanan Selesai",
    orderCompletedDesc: "Pesanan telah diterima oleh pembeli.",
    steps: {
      new: "Baru",
      paid: "Dibayar",
      packed: "Dikemas",
      inTransit: "Sedang Dikirim",
      outForDelivery: "Menuju Alamat",
      orderArrived: "Pesanan Tiba",
      pending: "Menunggu",
    },
  },
  en: {
    back: "Back to Orders",
    title: "Order Details",
    orderNo: "Order No.",
    suborderNo: "Suborder No.",
    copy: "Copy",
    copied: "Copied",
    customer: "Customer",
    address: "Shipping Address",
    whatsapp: "WhatsApp",
    items: "Order Items",
    product: "Product",
    variant: "Variant",
    qty: "Qty",
    price: "Price",
    subtotal: "Subtotal",
    shipping: "Shipping & Courier",
    courier: "Courier",
    service: "Service",
    shippingFee: "Shipping Fee",
    serviceFee: "Service Fee",
    discount: "Discount",
    totalWeight: "Total Package Weight",
    autoCalculated: "Auto Calculated",
    trackingNo: "Tracking / Airway Bill No.",
    noTracking: "No tracking yet",
    paymentSummary: "Payment Summary",
    method: "Payment Method",
    paymentStatus: "Payment Status",
    totalPayment: "Total Payment",
    notes: "Order Notes",
    buyerNote: "Buyer Note",
    printLabel: "Print Label",
    messageBuyer: "Message Buyer",
    openSellerStore: "Open in Store Workspace",
    adminActions: "Order Status Actions",
    updateStatus: "Update Status",
    updating: "Updating...",
    statusUpdated: "Order status updated successfully.",
    selectStatus: "-- Select Order Status --",
    orderCancelled: "Order Cancelled",
    orderCancelledDesc: "Order was cancelled or payment expired.",
    orderUnpaid: "Waiting Payment",
    orderUnpaidDesc: "Awaiting payment confirmation from buyer.",
    orderProcessing: "Processing Order",
    orderProcessingDesc: "Payment verified, order ready to process.",
    orderShipped: "Order in Transit",
    orderShippedDesc: "Package has been dispatched to courier.",
    orderCompleted: "Order Completed",
    orderCompletedDesc: "Package delivered to customer successfully.",
    steps: {
      new: "New",
      paid: "Paid",
      packed: "Packed",
      inTransit: "In Transit",
      outForDelivery: "Out for Delivery",
      orderArrived: "Order Arrived",
      pending: "Pending",
    },
  },
};

const formatCompactOrderNumber = (invoiceNo, orderId, createdAt) => {
  const raw = String(invoiceNo || "").trim();
  if (/^TP-\d{6}-\w+/i.test(raw)) return raw;
  const d = createdAt ? new Date(createdAt) : null;
  const dateStr =
    d && !Number.isNaN(d.getTime())
      ? `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`
      : "261111";
  const numPart = String(orderId || "").padStart(4, "0");
  return `TP-${dateStr}-${numPart}`;
};

const formatMoneyRp = (val) => {
  const num = Number(val || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
};

function StatusPill({ label, tone = "slate" }) {
  if (!label) return null;
  return (
    <span className={`tpsodp2026-pill tpsodp2026-pill--${tone}`}>
      <span className="tpsodp2026-pill__dot" />
      {label}
    </span>
  );
}

function ProgressRail({ steps }) {
  if (!Array.isArray(steps) || !steps.length) return null;
  return (
    <section className="tpsodp2026-stepper" aria-label="Progress Stepper">
      <div className="tpsodp2026-stepper__track">
        {steps.map((step, idx) => {
          const Icon =
            step.code === "DELIVERED"
              ? CheckCircle2
              : step.code === "OUT_FOR_DELIVERY"
              ? MapPin
              : step.code === "IN_TRANSIT" || step.code === "SHIPPED"
              ? Truck
              : step.code === "PACKED"
              ? Package
              : step.code === "PAID"
              ? ShieldCheck
              : step.complete
              ? Check
              : Box;

          const isLast = idx === steps.length - 1;
          const statusClass = step.complete
            ? "is-complete"
            : step.active
            ? "is-active"
            : "is-pending";

          return (
            <div key={step.code} className={`tpsodp2026-step ${statusClass}`}>
              <div className="tpsodp2026-step__node">
                <span className="tpsodp2026-step__icon">
                  <Icon size={16} />
                </span>
                {!isLast && <div className="tpsodp2026-step__line" />}
              </div>
              <div className="tpsodp2026-step__content">
                <strong className="tpsodp2026-step__label">{step.label}</strong>
                <span className="tpsodp2026-step__date">{step.dateLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function AdminOrderDetail2026View({
  order,
  isIndo = false,
  onUpdateStatus,
  isUpdating = false,
  onPrint,
  noticeMessage = "",
}) {
  const t = isIndo ? I18N.id : I18N.en;
  const [copiedKey, setCopiedKey] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const groups = Array.isArray(order?.groups) ? order.groups : [];
  const primaryGroup = groups[0] || null;

  const orderId = order?.id || order?.orderId || 0;
  const createdAt = order?.createdAt || order?.orderTime;
  const invoiceNo = order?.invoiceNo || order?.ref || "";
  const compactOrderNo = formatCompactOrderNumber(invoiceNo, orderId, createdAt);
  const suborderNumber =
    primaryGroup?.suborderNumber || `${compactOrderNo}-S01`;
  const storeSlug = primaryGroup?.storeSlug || "";
  const suborderId = primaryGroup?.suborderId || null;
  const storeName = primaryGroup?.storeName || "";

  const rawStatus = String(order?.rawStatus || order?.status || "pending").toLowerCase();
  const paymentStatus = String(order?.paymentStatus || "UNPAID").toUpperCase();

  useEffect(() => {
    setSelectedStatus(rawStatus);
  }, [rawStatus]);

  const handleCopy = async (val, key) => {
    if (!val || typeof navigator === "undefined") return;
    try {
      await navigator.clipboard.writeText(String(val));
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(""), 2000);
    } catch {
      // ignore
    }
  };

  // Date formatters
  const formatDateFull = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(isIndo ? "id-ID" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(iso);
    }
  };

  const formatDateShort = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(isIndo ? "id-ID" : "en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Customer info & WhatsApp
  const customerName = order?.customerName || order?.customer?.name || "Super Client";
  const customerPhone = order?.customerPhone || order?.customer?.phone || "";
  const customerEmail = order?.customerEmail || order?.customer?.email || "";
  const customerAddress =
    order?.customerAddress ||
    order?.shippingAddress ||
    order?.customer?.address ||
    "—";

  const avatarInitials = useMemo(() => {
    const parts = customerName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return (parts[0]?.slice(0, 2) || "CL").toUpperCase();
  }, [customerName]);

  const whatsAppLink = useMemo(() => {
    const raw = String(customerPhone).replace(/\D/g, "");
    if (!raw) return null;
    let clean = raw;
    if (clean.startsWith("0")) clean = "62" + clean.slice(1);
    if (!clean.startsWith("62")) clean = "62" + clean;
    const msg = encodeURIComponent(
      isIndo
        ? `Halo ${customerName}, kami dari Admin TP Preneurs terkait pesanan #${compactOrderNo}.`
        : `Hello ${customerName}, contacting you from TP Preneurs Admin regarding order #${compactOrderNo}.`
    );
    return `https://wa.me/${clean}?text=${msg}`;
  }, [customerPhone, customerName, compactOrderNo, isIndo]);

  // Stepper lifecycle calculation
  const isCancelled =
    rawStatus.includes("cancel") ||
    paymentStatus === "CANCELLED" ||
    paymentStatus === "EXPIRED";
  const isPaid = paymentStatus === "PAID" || paymentStatus === "SETTLED";
  const isPacked = ["processing", "packed", "shipped", "delivered"].includes(rawStatus);
  const isShipped = ["shipped", "delivered"].includes(rawStatus);
  const isDelivered = rawStatus === "delivered" || rawStatus === "complete";

  const timelineSteps = [
    {
      code: "NEW",
      label: t.steps.new,
      dateLabel: formatDateShort(createdAt),
      complete: true,
      active: false,
    },
    {
      code: "PAID",
      label: t.steps.paid,
      dateLabel: isPaid ? (isIndo ? "Selesai" : "Paid") : t.steps.pending,
      complete: isPaid,
      active: !isPaid && !isCancelled,
    },
    {
      code: "PACKED",
      label: t.steps.packed,
      dateLabel: isPacked ? (isIndo ? "Selesai" : "Done") : t.steps.pending,
      complete: isPacked,
      active: isPaid && !isPacked && !isCancelled,
    },
    {
      code: "IN_TRANSIT",
      label: t.steps.inTransit,
      dateLabel: isShipped ? (isIndo ? "Dikirim" : "Dispatched") : t.steps.pending,
      complete: isShipped,
      active: isPacked && !isShipped && !isCancelled,
    },
    {
      code: "OUT_FOR_DELIVERY",
      label: t.steps.outForDelivery,
      dateLabel: isShipped ? (isIndo ? "Dalam Perjalanan" : "In Route") : t.steps.pending,
      complete: isDelivered,
      active: isShipped && !isDelivered && !isCancelled,
    },
    {
      code: "DELIVERED",
      label: t.steps.orderArrived,
      dateLabel: isDelivered ? (isIndo ? "Tiba" : "Delivered") : t.steps.pending,
      complete: isDelivered,
      active: false,
    },
  ];

  // Contextual Banner
  const statusBanner = useMemo(() => {
    if (isCancelled) {
      return {
        tone: "red",
        badge: isIndo ? "Dibatalkan" : "Cancelled",
        title: t.orderCancelled,
        desc: t.orderCancelledDesc,
        Icon: Clock3,
      };
    }
    if (!isPaid) {
      return {
        tone: "amber",
        badge: isIndo ? "Belum Bayar" : "Waiting Payment",
        title: t.orderUnpaid,
        desc: t.orderUnpaidDesc,
        Icon: AlertTriangle,
      };
    }
    if (isDelivered) {
      return {
        tone: "green",
        badge: isIndo ? "Selesai" : "Completed",
        title: t.orderCompleted,
        desc: t.orderCompletedDesc,
        Icon: CheckCircle2,
      };
    }
    if (isShipped) {
      return {
        tone: "blue",
        badge: isIndo ? "Dikirim" : "In Transit",
        title: t.orderShipped,
        desc: t.orderShippedDesc,
        Icon: Truck,
      };
    }
    return {
      tone: "orange",
      badge: isIndo ? "Diproses" : "Processing",
      title: t.orderProcessing,
      desc: t.orderProcessingDesc,
      Icon: Package,
    };
  }, [isCancelled, isPaid, isDelivered, isShipped, isIndo, t]);

  // Order Items
  const items = useMemo(() => {
    if (Array.isArray(primaryGroup?.items) && primaryGroup.items.length > 0) {
      return primaryGroup.items;
    }
    if (Array.isArray(order?.items) && order.items.length > 0) {
      return order.items;
    }
    return [];
  }, [primaryGroup, order]);

  // Financial totals
  const subtotal = Number(order?.subtotal || primaryGroup?.subtotalAmount || 10000);
  const shippingFee = Number(order?.shipping || primaryGroup?.shippingAmount || 0);
  const serviceFee = Number(order?.tax || primaryGroup?.serviceFeeAmount || 0);
  const discount = Number(order?.discount || 0);
  const totalAmount = Number(order?.totalAmount || primaryGroup?.totalAmount || 5000);
  const paymentMethodLabel =
    order?.paymentMethodLabel ||
    order?.paymentMethod ||
    primaryGroup?.paymentMethodLabel ||
    "Duitku - ShopeePay QRIS";

  // Courier & Shipping details
  const courierName =
    order?.shipping?.courier ||
    primaryGroup?.courierName ||
    (isIndo ? "Belum ditentukan" : "Pending assignment");
  const courierService = order?.shipping?.service || primaryGroup?.courierService || "-";
  const trackingNumber = order?.shipping?.trackingNumber || primaryGroup?.trackingNumber || "";

  return (
    <div className="admin-order-detail-root">
      <div className="tpsodp2026-page">
        {/* Topbar Navigation */}
        <div className="tpsodp2026-topbar">
          <Link to="/admin/orders" className="tpsodp2026-btn-back">
            <ArrowLeft size={16} />
            <span>{t.back}</span>
          </Link>

          <div className="tpsodp2026-actions">
            {onPrint && (
              <button
                type="button"
                className="tpsodp2026-btn tpsodp2026-btn--outline"
                onClick={onPrint}
              >
                <Printer size={15} />
                <span>{t.printLabel}</span>
              </button>
            )}

            {whatsAppLink && (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="tpsodp2026-btn tpsodp2026-btn--outline"
              >
                <MessageCircle size={15} />
                <span>{t.messageBuyer}</span>
              </a>
            )}

            {storeSlug && suborderId && (
              <a
                href={`/seller/stores/${storeSlug}/orders/${suborderId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tpsodp2026-btn--store-link"
                title={storeName ? `Toko: ${storeName}` : "Seller Workspace"}
              >
                <span>{storeName ? `${t.openSellerStore}: ${storeName}` : t.openSellerStore}</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {noticeMessage ? (
          <div className="tpsodp2026-notice tpsodp2026-notice--success">
            <Check size={16} />
            <span>{noticeMessage}</span>
          </div>
        ) : null}

        {/* Hero Card */}
        <section className="tpsodp2026-hero">
          <div className="tpsodp2026-hero__main">
            <div className="tpsodp2026-hero__left">
              <span className="tpsodp2026-hero__tag">
                {t.title.toUpperCase()} #{orderId}
              </span>

              <div className="tpsodp2026-hero__number-wrap">
                <h1 className="tpsodp2026-hero__number">{compactOrderNo}</h1>
                <button
                  type="button"
                  className="tpsodp2026-btn-copy"
                  onClick={() => handleCopy(compactOrderNo, "orderNo")}
                  title={t.copy}
                >
                  <Copy size={14} />
                  {copiedKey === "orderNo" && (
                    <span className="tpsodp2026-btn-copy__tip">{t.copied}</span>
                  )}
                </button>
              </div>

              <div className="tpsodp2026-hero__meta">
                <span className="tpsodp2026-hero__date">
                  <CalendarDays size={14} />
                  {formatDateFull(createdAt)}
                </span>
                <span className="tpsodp2026-hero__dot">•</span>
                <span className="tpsodp2026-hero__suborder">
                  {suborderNumber}
                </span>
                <button
                  type="button"
                  className="tpsodp2026-btn-copy tpsodp2026-btn-copy--sm"
                  onClick={() => handleCopy(suborderNumber, "suborderNo")}
                  title={t.copy}
                >
                  <Copy size={12} />
                  {copiedKey === "suborderNo" && (
                    <span className="tpsodp2026-btn-copy__tip">{t.copied}</span>
                  )}
                </button>
              </div>
            </div>

            <div className="tpsodp2026-hero__right">
              {paymentStatus === "EXPIRED" && (
                <StatusPill label={isIndo ? "Kedaluwarsa" : "Expired"} tone="red" />
              )}
              {isCancelled && (
                <StatusPill label={isIndo ? "Dibatalkan" : "Cancelled"} tone="red" />
              )}
              {isPaid && !isCancelled && (
                <StatusPill label={isIndo ? "Lunas" : "Paid"} tone="green" />
              )}
              {!isPaid && !isCancelled && (
                <StatusPill label={isIndo ? "Belum Bayar" : "Unpaid"} tone="amber" />
              )}
            </div>
          </div>
        </section>

        {/* Progress Stepper */}
        <ProgressRail steps={timelineSteps} />

        {/* Contextual Status Banner */}
        {statusBanner && (
          <section className={`tpsodp2026-banner tpsodp2026-banner--${statusBanner.tone}`}>
            <span className="tpsodp2026-banner__icon">
              <statusBanner.Icon size={18} />
            </span>
            <div className="tpsodp2026-banner__body">
              <div className="tpsodp2026-banner__headline">
                <strong className="tpsodp2026-banner__title">{statusBanner.title}</strong>
                <span className="tpsodp2026-banner__badge">{statusBanner.badge}</span>
              </div>
              <p className="tpsodp2026-banner__text">{statusBanner.desc}</p>
            </div>
          </section>
        )}

        {/* 2-Column Responsive Grid */}
        <div className="tpsodp2026-grid">
          {/* Left Column: Items, Shipping, Notes */}
          <div className="tpsodp2026-col tpsodp2026-col--main">
            {/* Order Items */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__title-wrap">
                  <Package size={17} className="tpsodp2026-card__icon" />
                  <h2 className="tpsodp2026-card__title">{t.items}</h2>
                </div>
                <span className="tpsodp2026-card__count">{items.length}</span>
              </header>

              <div className="tpsodp2026-items-list">
                {items.map((item, idx) => {
                  const img = resolveAssetUrl(
                    item.image || item.imageSnapshot || "/uploads/products/singkong.jpg"
                  );
                  const name = item.productName || item.name || item.product?.name || "Kreasi Singkong";
                  const variant = item.variantLabel || item.variantKey || "Standard item";
                  const qty = Number(item.qty || item.quantity || 1);
                  const price = Number(item.price || item.priceSnapshot || 10000);
                  const lineTotal = Number(item.lineTotal || item.totalPrice || price * qty);

                  return (
                    <article key={item.id || idx} className="tpsodp2026-item">
                      <div className="tpsodp2026-item__media">
                        <img
                          src={img}
                          alt={name}
                          className="tpsodp2026-item__img"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'><rect width='20' height='20' x='2' y='2' rx='5'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                          }}
                        />
                      </div>
                      <div className="tpsodp2026-item__body">
                        <h3 className="tpsodp2026-item__name">{name}</h3>
                        <div className="tpsodp2026-item__details">
                          <span className="tpsodp2026-item__variant">{variant}</span>
                          <span className="tpsodp2026-item__dot">•</span>
                          <span className="tpsodp2026-item__weight">1 kg / unit</span>
                        </div>
                        <div className="tpsodp2026-item__price-calc">
                          {formatMoneyRp(price)} × {qty}
                        </div>
                      </div>
                      <div className="tpsodp2026-item__subtotal">
                        {formatMoneyRp(lineTotal)}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Shipping & Courier */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__title-wrap">
                  <Truck size={17} className="tpsodp2026-card__icon" />
                  <h2 className="tpsodp2026-card__title">{t.shipping}</h2>
                </div>
                {isCancelled ? (
                  <StatusPill label={isIndo ? "Dibatalkan" : "Cancelled"} tone="red" />
                ) : null}
              </header>

              <div className="tpsodp2026-shipping-form">
                <div className="tpsodp2026-form-row">
                  <div className="tpsodp2026-field">
                    <label className="tpsodp2026-field__label">{t.courier.toUpperCase()}</label>
                    <div className="tpsodp2026-readonly-val">{courierName}</div>
                  </div>
                  <div className="tpsodp2026-field">
                    <label className="tpsodp2026-field__label">{t.service.toUpperCase()}</label>
                    <div className="tpsodp2026-readonly-val">{courierService}</div>
                  </div>
                </div>

                <div className="tpsodp2026-form-row">
                  <div className="tpsodp2026-field">
                    <label className="tpsodp2026-field__label">{t.shippingFee.toUpperCase()}</label>
                    <div className="tpsodp2026-readonly-val">{formatMoneyRp(shippingFee)}</div>
                  </div>
                  <div className="tpsodp2026-field">
                    <div className="tpsodp2026-field__label-wrap">
                      <label className="tpsodp2026-field__label">{t.totalWeight.toUpperCase()}</label>
                      <span className="tpsodp2026-pill-badge tpsodp2026-pill-badge--auto">
                        {t.autoCalculated}
                      </span>
                    </div>
                    <div className="tpsodp2026-readonly-val">1 kg</div>
                  </div>
                </div>

                <div className="tpsodp2026-field">
                  <label className="tpsodp2026-field__label">{t.trackingNo.toUpperCase()}</label>
                  <div className="tpsodp2026-tracking-display">
                    <span className="tpsodp2026-tracking-val">
                      {trackingNumber || t.noTracking}
                    </span>
                    {trackingNumber ? (
                      <button
                        type="button"
                        className="tpsodp2026-btn-copy"
                        onClick={() => handleCopy(trackingNumber, "tracking")}
                        title={t.copy}
                      >
                        <Copy size={13} />
                        {copiedKey === "tracking" && (
                          <span className="tpsodp2026-btn-copy__tip">{t.copied}</span>
                        )}
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Notes Section (if note exists) */}
            {order?.notes || order?.customerNote ? (
              <section className="tpsodp2026-card">
                <header className="tpsodp2026-card__header">
                  <h2 className="tpsodp2026-card__title">{t.notes}</h2>
                </header>
                <p className="tpsodp2026-note-text">
                  {order?.notes || order?.customerNote}
                </p>
              </section>
            ) : null}
          </div>

          {/* Right Column: Customer, Payment Summary, Admin Actions */}
          <div className="tpsodp2026-col tpsodp2026-col--side">
            {/* Customer Card */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__title-wrap">
                  <ShieldCheck size={17} className="tpsodp2026-card__icon" />
                  <h2 className="tpsodp2026-card__title">{t.customer}</h2>
                </div>
              </header>

              <div className="tpsodp2026-customer">
                <div className="tpsodp2026-customer__top">
                  <div className="tpsodp2026-customer__avatar">
                    {avatarInitials}
                  </div>
                  <div className="tpsodp2026-customer__meta">
                    <strong className="tpsodp2026-customer__name">{customerName}</strong>
                    {customerEmail ? (
                      <span className="tpsodp2026-customer__email">{customerEmail}</span>
                    ) : null}
                    <div className="tpsodp2026-customer__contact-row">
                      <span className="tpsodp2026-customer__phone">
                        {customerPhone || "—"}
                      </span>
                      {whatsAppLink && (
                        <a
                          href={whatsAppLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tpsodp2026-btn-wa"
                        >
                          <MessageCircle size={13} />
                          <span>{t.whatsapp}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div className="tpsodp2026-customer__address-box">
                  <MapPin size={15} className="tpsodp2026-customer__pin" />
                  <p className="tpsodp2026-customer__address">{customerAddress}</p>
                </div>
              </div>
            </section>

            {/* Payment Summary */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__title-wrap">
                  <Clock3 size={17} className="tpsodp2026-card__icon" />
                  <h2 className="tpsodp2026-card__title">{t.paymentSummary}</h2>
                </div>
                {paymentStatus === "EXPIRED" && (
                  <StatusPill label={isIndo ? "Kedaluwarsa" : "Expired"} tone="red" />
                )}
                {paymentStatus === "PAID" && (
                  <StatusPill label={isIndo ? "Lunas" : "Paid"} tone="green" />
                )}
              </header>

              <div className="tpsodp2026-summary">
                <div className="tpsodp2026-summary__method-box">
                  <span className="tpsodp2026-summary__method-label">{t.method}</span>
                  <strong className="tpsodp2026-summary__method-val">
                    {paymentMethodLabel}
                  </strong>
                </div>

                <div className="tpsodp2026-summary__rows">
                  <div className="tpsodp2026-summary__row">
                    <span>{t.subtotal} ({items.length} {isIndo ? "Item" : "Items"})</span>
                    <span>{formatMoneyRp(subtotal)}</span>
                  </div>
                  <div className="tpsodp2026-summary__row">
                    <span>{t.shippingFee}</span>
                    <span>{formatMoneyRp(shippingFee)}</span>
                  </div>
                  <div className="tpsodp2026-summary__row">
                    <span>{t.serviceFee}</span>
                    <span>{formatMoneyRp(serviceFee)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="tpsodp2026-summary__row tpsodp2026-summary__row--discount">
                      <span>{t.discount}</span>
                      <span>-{formatMoneyRp(discount)}</span>
                    </div>
                  )}
                  <div className="tpsodp2026-summary__row tpsodp2026-summary__row--total">
                    <span className="tpsodp2026-summary__total-label">{t.totalPayment}</span>
                    <strong className="tpsodp2026-summary__total-val">
                      {formatMoneyRp(totalAmount)}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Admin Status Actions */}
            {onUpdateStatus && (
              <section className="tpsodp2026-card">
                <header className="tpsodp2026-card__header">
                  <h2 className="tpsodp2026-card__title">{t.adminActions}</h2>
                </header>

                <div className="admin-status-control">
                  <select
                    className="admin-status-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    disabled={isUpdating}
                  >
                    <option value="pending">Pending ({isIndo ? "Menunggu" : "Pending"})</option>
                    <option value="processing">Processing ({isIndo ? "Diproses" : "Processing"})</option>
                    <option value="shipped">Shipped ({isIndo ? "Dikirim" : "Shipped"})</option>
                    <option value="delivered">Delivered ({isIndo ? "Selesai" : "Delivered"})</option>
                    <option value="cancelled">Cancelled ({isIndo ? "Dibatalkan" : "Cancelled"})</option>
                  </select>

                  <button
                    type="button"
                    className="admin-status-btn"
                    onClick={() => onUpdateStatus(selectedStatus)}
                    disabled={isUpdating || selectedStatus === rawStatus}
                  >
                    {isUpdating ? t.updating : t.updateStatus}
                  </button>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
