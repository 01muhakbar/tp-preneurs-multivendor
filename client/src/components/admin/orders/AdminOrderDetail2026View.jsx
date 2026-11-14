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
  Scale,
  ShieldCheck,
  Truck,
  UserRound,
  WalletCards,
  AlertTriangle,
  RotateCcw,
  Sparkles,
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
    printLabel: "Cetak Label Pengiriman",
    messageBuyer: "Hubungi Pembeli",
    openSellerStore: "Buka di Seller Toko",
    adminActions: "Kelola Status Pesanan",
    updateStatus: "Perbarui Status",
    updating: "Memperbarui...",
    statusUpdated: "Status pesanan berhasil diperbarui.",
    orderCancelled: "Pesanan Dibatalkan",
    orderCancelledDesc: "Pesanan dibatalkan atau waktu pembayaran telah kedaluwarsa.",
    orderUnpaid: "Menunggu Pembayaran",
    orderUnpaidDesc: "Menunggu konfirmasi pembayaran dari pembeli.",
    orderProcessing: "Pesanan Sedang Diproses",
    orderProcessingDesc: "Pembayaran telah diverifikasi, pesanan siap diproses.",
    orderShipped: "Pesanan Sedang Dikirim",
    orderShippedDesc: "Paket telah diserahkan ke pihak ekspedisi untuk pengiriman.",
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
      done: "Selesai",
    },
    statusBadge: {
      paid: "Lunas",
      unpaid: "Belum Bayar",
      processing: "Diproses",
      shipped: "Dikirim",
      delivered: "Selesai",
      cancelled: "Dibatalkan",
      expired: "Kedaluwarsa",
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
    printLabel: "Print Shipping Label",
    messageBuyer: "Message Buyer",
    openSellerStore: "Open in Store Workspace",
    adminActions: "Order Status Actions",
    updateStatus: "Update Status",
    updating: "Updating...",
    statusUpdated: "Order status updated successfully.",
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
      done: "Done",
    },
    statusBadge: {
      paid: "Paid",
      unpaid: "Unpaid",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      cancelled: "Cancelled",
      expired: "Expired",
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

function StatusPill({ status }) {
  if (!status) return null;
  const tone = status.tone || "slate";
  return (
    <span className={`tpsodp2026-pill tpsodp2026-pill--${tone}`}>
      <span className="tpsodp2026-pill__dot" />
      {status.label || "-"}
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

  // Clean suborder code: never display raw STORE-IDEMP in subtitle!
  const cleanSuborderNo = useMemo(() => {
    const raw = String(primaryGroup?.suborderNumber || "").trim();
    if (!raw || raw.includes("STORE-IDEMP") || !raw.startsWith("TP-")) {
      return `${compactOrderNo}-S01`;
    }
    return raw;
  }, [primaryGroup?.suborderNumber, compactOrderNo]);

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
  const customerName = order?.customerName || order?.customer?.name || "Customer";
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

  // Stepper calculations
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
      dateLabel: isPaid ? t.steps.done : t.steps.pending,
      complete: isPaid,
      active: !isPaid && !isCancelled,
    },
    {
      code: "PACKED",
      label: t.steps.packed,
      dateLabel: isPacked ? t.steps.done : t.steps.pending,
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
      dateLabel: isShipped ? (isIndo ? "Dalam Rute" : "In Route") : t.steps.pending,
      complete: isDelivered,
      active: isShipped && !isDelivered && !isCancelled,
    },
    {
      code: "DELIVERED",
      label: t.steps.orderArrived,
      dateLabel: isDelivered ? t.steps.done : t.steps.pending,
      complete: isDelivered,
      active: false,
    },
  ];

  // Contextual Guidance Banner
  const statusBanner = useMemo(() => {
    if (isCancelled) {
      return {
        bucket: "cancelled",
        tone: "red",
        badge: t.statusBadge.cancelled,
        title: t.orderCancelled,
        desc: t.orderCancelledDesc,
        Icon: Clock3,
      };
    }
    if (!isPaid) {
      return {
        bucket: "unpaid",
        tone: "amber",
        badge: t.statusBadge.unpaid,
        title: t.orderUnpaid,
        desc: t.orderUnpaidDesc,
        Icon: AlertTriangle,
      };
    }
    if (isDelivered) {
      return {
        bucket: "completed",
        tone: "green",
        badge: t.statusBadge.delivered,
        title: t.orderCompleted,
        desc: t.orderCompletedDesc,
        Icon: CheckCircle2,
      };
    }
    if (isShipped) {
      return {
        bucket: "shipping",
        tone: "blue",
        badge: t.statusBadge.shipped,
        title: t.orderShipped,
        desc: t.orderShippedDesc,
        Icon: Truck,
      };
    }
    return {
      bucket: "to_pack",
      tone: "orange",
      badge: t.statusBadge.processing,
      title: t.orderProcessing,
      desc: t.orderProcessingDesc,
      Icon: Package,
    };
  }, [isCancelled, isPaid, isDelivered, isShipped, t]);

  // Order items
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
  const subtotal = Number(order?.subtotal || primaryGroup?.subtotalAmount || 0);
  const shippingFee = Number(order?.shipping || primaryGroup?.shippingAmount || 0);
  const serviceFee = Number(order?.tax || primaryGroup?.serviceFeeAmount || 0);
  const discount = Number(order?.discount || 0);
  const totalAmount = Number(order?.totalAmount || primaryGroup?.totalAmount || 0);
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

  // Payment status pill
  const paymentStatusPill = useMemo(() => {
    if (paymentStatus === "EXPIRED") return { label: t.statusBadge.expired, tone: "red" };
    if (paymentStatus === "PAID" || paymentStatus === "SETTLED") return { label: t.statusBadge.paid, tone: "green" };
    if (paymentStatus === "CANCELLED") return { label: t.statusBadge.cancelled, tone: "red" };
    return { label: t.statusBadge.unpaid, tone: "amber" };
  }, [paymentStatus, t]);

  return (
    <div className="admin-order-detail-root">
      <div className="tpsodp2026-page">
        {/* Top Header / Breadcrumb & Action Buttons */}
        <div className="tpsodp2026-topbar">
          <Link to="/admin/orders" className="tpsodp2026-btn-back">
            <ArrowLeft size={16} />
            <span>{t.back}</span>
          </Link>

          <div className="tpsodp2026-topbar__actions">
            {onPrint && (
              <button
                type="button"
                className="tpsodp2026-btn-outline"
                onClick={onPrint}
                title={t.printLabel}
              >
                <Printer size={15} />
                <span>{t.printLabel}</span>
              </button>
            )}

            <a
              href={`/order/tracking/${encodeURIComponent(compactOrderNo || invoiceNo)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="tpsodp2026-btn-outline"
              title={isIndo ? "Lacak Pesanan Publik" : "Public Order Tracking"}
            >
              <Truck size={15} />
              <span>{isIndo ? "Lacak Pesanan" : "Track Order"}</span>
            </a>

            {whatsAppLink && (
              <a
                href={whatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="tpsodp2026-btn-outline"
                title={t.messageBuyer}
              >
                <MessageCircle size={15} />
                <span>{t.messageBuyer}</span>
              </a>
            )}

            {storeSlug && (suborderId || compactOrderNo) && (
              <a
                href={`/seller/stores/${storeSlug}/orders/${encodeURIComponent(compactOrderNo || suborderId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tpsodp2026-btn-primary"
                title={storeName ? `Toko: ${storeName}` : t.openSellerStore}
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

        {/* Hero Header Card */}
        <header className="tpsodp2026-hero-card">
          <div className="tpsodp2026-hero-card__main">
            <div className="tpsodp2026-hero-card__meta-row">
              <span className="tpsodp2026-eyebrow">{t.title}</span>
              {orderId ? (
                <span
                  className="tpsodp2026-order-id-badge"
                  title={`Order #${orderId}`}
                  onClick={() => handleCopy(String(orderId), "orderId")}
                >
                  #{orderId}
                </span>
              ) : null}
              <div className="tpsodp2026-hero-card__chips">
                <StatusPill status={paymentStatusPill} />
                {rawStatus === "processing" && (
                  <StatusPill status={{ label: t.statusBadge.processing, tone: "orange" }} />
                )}
                {isDelivered && (
                  <StatusPill status={{ label: t.statusBadge.delivered, tone: "green" }} />
                )}
              </div>
            </div>

            <div className="tpsodp2026-hero-card__title-row">
              <h1>{compactOrderNo}</h1>
              <button
                type="button"
                className="tpsodp2026-btn-icon-copy"
                onClick={() => handleCopy(compactOrderNo, "orderNo")}
                title={t.copy}
                aria-label={t.copy}
              >
                <Copy size={16} />
              </button>
            </div>

            <div className="tpsodp2026-hero-card__sub-row">
              <span className="tpsodp2026-time-stamp">
                <CalendarDays size={14} />
                {formatDateFull(createdAt)}
              </span>
              <span className="tpsodp2026-divider">•</span>
              <span className="tpsodp2026-suborder-no">
                {cleanSuborderNo}
                <button
                  type="button"
                  className="tpsodp2026-btn-mini-copy"
                  onClick={() => handleCopy(cleanSuborderNo, "suborderNo")}
                  title={t.copy}
                >
                  <Copy size={12} />
                </button>
              </span>
            </div>
          </div>
        </header>

        {/* 6-Step Visual Progress Rail */}
        <ProgressRail steps={timelineSteps} />

        {/* Prominent Next Step Guidance Card */}
        {statusBanner && (
          <section className={`tpsodp2026-next-step-card tpsodp2026-next-step-card--${statusBanner.bucket}`}>
            <div className="tpsodp2026-next-step-card__icon-wrap">
              <statusBanner.Icon size={22} className={`tpsodp2026-icon-${statusBanner.tone === "green" ? "success" : statusBanner.tone === "orange" ? "accent" : statusBanner.tone === "blue" ? "primary" : "muted"}`} />
            </div>
            <div className="tpsodp2026-next-step-card__content">
              <div className="tpsodp2026-next-step-card__title-row">
                <h3>{statusBanner.title}</h3>
                <span className={`tpsodp2026-pill tpsodp2026-pill--${statusBanner.tone}`}>
                  <span className="tpsodp2026-pill__dot" />
                  {statusBanner.badge}
                </span>
              </div>
              <p className="tpsodp2026-next-step-card__desc">{statusBanner.desc}</p>
            </div>
          </section>
        )}

        {/* 2-Column Responsive Dashboard Layout */}
        <main className="tpsodp2026-grid">
          {/* Left Column: Products, Shipping & Courier, Notes */}
          <div className="tpsodp2026-col-main">
            {/* Products Card */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__header-title">
                  <Package size={18} className="tpsodp2026-icon-primary" />
                  <h2>{t.items}</h2>
                </div>
                <span className="tpsodp2026-badge-count">{items.length}</span>
              </header>

              <div className="tpsodp2026-items-list">
                {items.map((item, idx) => {
                  const img = resolveAssetUrl(
                    item.image || item.imageSnapshot || "/uploads/products/default.jpg"
                  );
                  const name = item.productName || item.name || item.product?.name || "Product";
                  const variant = item.variantLabel || item.variantKey || "Standard item";
                  const qty = Number(item.qty || item.quantity || 1);
                  const price = Number(item.price || item.priceSnapshot || 0);
                  const lineTotal = Number(item.lineTotal || item.totalPrice || price * qty);

                  return (
                    <article key={item.id || idx} className="tpsodp2026-item-row">
                      <div className="tpsodp2026-item-row__media">
                        <img
                          src={img}
                          alt={name}
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='1.5'><rect width='20' height='20' x='2' y='2' rx='5'/><circle cx='8.5' cy='8.5' r='1.5'/><polyline points='21 15 16 10 5 21'/></svg>";
                          }}
                        />
                      </div>
                      <div className="tpsodp2026-item-row__info">
                        <h3 className="tpsodp2026-item-row__name">{name}</h3>
                        <div className="tpsodp2026-item-row__submeta">
                          <span className="tpsodp2026-item-row__variant">{variant}</span>
                          <span className="tpsodp2026-item-row__weight">
                            <Scale size={11} />
                            1 kg / unit
                          </span>
                        </div>
                        <div className="tpsodp2026-item-row__pricing">
                          <span className="tpsodp2026-item-row__qty">
                            {formatMoneyRp(price)} × {qty}
                          </span>
                        </div>
                      </div>
                      <div className="tpsodp2026-item-row__total">
                        <strong>{formatMoneyRp(lineTotal)}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {/* Shipping & Courier Card */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__header-title">
                  <Truck size={18} className="tpsodp2026-icon-primary" />
                  <h2>{t.shipping}</h2>
                </div>
                {isCancelled && (
                  <StatusPill status={{ label: t.statusBadge.cancelled, tone: "red" }} />
                )}
              </header>

              <div className="tpsodp2026-shipping-grid">
                <div className="tpsodp2026-field">
                  <label className="tpsodp2026-field__label">{t.courier}</label>
                  <div className="tpsodp2026-field__value">{courierName}</div>
                </div>

                <div className="tpsodp2026-field">
                  <label className="tpsodp2026-field__label">{t.service}</label>
                  <div className="tpsodp2026-field__value">{courierService}</div>
                </div>

                <div className="tpsodp2026-field">
                  <label className="tpsodp2026-field__label">{t.shippingFee}</label>
                  <div className="tpsodp2026-field__value">{formatMoneyRp(shippingFee)}</div>
                </div>

                <div className="tpsodp2026-field">
                  <div className="tpsodp2026-field__label-row">
                    <label className="tpsodp2026-field__label">{t.totalWeight}</label>
                    <span className="tpsodp2026-badge-synced">
                      <Sparkles size={11} />
                      {t.autoCalculated}
                    </span>
                  </div>
                  <div className="tpsodp2026-weight-display">
                    <Scale size={15} className="tpsodp2026-icon-weight" />
                    <strong className="tpsodp2026-weight-val">1 kg</strong>
                  </div>
                </div>

                <div className="tpsodp2026-field tpsodp2026-field--full">
                  <label className="tpsodp2026-field__label">{t.trackingNo}</label>
                  <div className="tpsodp2026-tracking-display">
                    <span>{trackingNumber || t.noTracking}</span>
                    {trackingNumber ? (
                      <button
                        type="button"
                        className="tpsodp2026-btn-mini-copy"
                        onClick={() => handleCopy(trackingNumber, "tracking")}
                        title={t.copy}
                      >
                        <Copy size={13} />
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            {/* Notes Section (if customer note exists) */}
            {order?.notes || order?.customerNote ? (
              <section className="tpsodp2026-card">
                <header className="tpsodp2026-card__header">
                  <h2>{t.notes}</h2>
                </header>
                <div className="tpsodp2026-buyer-note-box">
                  <span className="tpsodp2026-note-tag">{t.buyerNote}</span>
                  <p>{order?.notes || order?.customerNote}</p>
                </div>
              </section>
            ) : null}
          </div>

          {/* Right Column: Customer, Payment Summary, Admin Actions */}
          <div className="tpsodp2026-col-side">
            {/* Customer Card */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__header-title">
                  <UserRound size={18} className="tpsodp2026-icon-primary" />
                  <h2>{t.customer}</h2>
                </div>
              </header>

              <div className="tpsodp2026-customer-box">
                <div className="tpsodp2026-customer-box__avatar">
                  {avatarInitials}
                </div>
                <div className="tpsodp2026-customer-box__details">
                  <h3 className="tpsodp2026-customer-box__name">{customerName}</h3>
                  {customerEmail ? (
                    <span className="tpsodp2026-suborder-no">{customerEmail}</span>
                  ) : null}
                  <div className="tpsodp2026-customer-box__contact-row">
                    <span className="tpsodp2026-customer-box__phone">
                      {customerPhone || "—"}
                    </span>
                    {whatsAppLink && (
                      <a
                        href={whatsAppLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tpsodp2026-badge-wa"
                      >
                        <MessageCircle size={13} />
                        <span>{t.whatsapp}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="tpsodp2026-address-box">
                <MapPin size={15} className="tpsodp2026-address-box__icon" />
                <p className="tpsodp2026-address-box__text">{customerAddress}</p>
              </div>
            </section>

            {/* Payment Summary */}
            <section className="tpsodp2026-card">
              <header className="tpsodp2026-card__header">
                <div className="tpsodp2026-card__header-title">
                  <WalletCards size={18} className="tpsodp2026-icon-primary" />
                  <h2>{t.paymentSummary}</h2>
                </div>
                <StatusPill status={paymentStatusPill} />
              </header>

              <div className="tpsodp2026-payment-info">
                <div className="tpsodp2026-info-row">
                  <span className="tpsodp2026-info-row__label">{t.method}</span>
                  <span className="tpsodp2026-info-row__value">{paymentMethodLabel}</span>
                </div>
              </div>

              <div className="tpsodp2026-totals-list">
                <div className="tpsodp2026-total-line">
                  <span>{t.subtotal} ({items.length} {isIndo ? "Item" : "Items"})</span>
                  <strong>{formatMoneyRp(subtotal)}</strong>
                </div>
                <div className="tpsodp2026-total-line">
                  <span>{t.shippingFee}</span>
                  <strong>{formatMoneyRp(shippingFee)}</strong>
                </div>
                <div className="tpsodp2026-total-line">
                  <span>{t.serviceFee}</span>
                  <strong>{formatMoneyRp(serviceFee)}</strong>
                </div>
                {discount > 0 && (
                  <div className="tpsodp2026-total-line tpsodp2026-total-line--discount">
                    <span>{t.discount}</span>
                    <strong>-{formatMoneyRp(discount)}</strong>
                  </div>
                )}
                <div className="tpsodp2026-total-line tpsodp2026-total-line--grand">
                  <strong>{t.totalPayment}</strong>
                  <strong className="tpsodp2026-grand-amount">
                    {formatMoneyRp(totalAmount)}
                  </strong>
                </div>
              </div>
            </section>

            {/* Admin Order Status Actions */}
            {onUpdateStatus && (
              <section className="tpsodp2026-card">
                <header className="tpsodp2026-card__header">
                  <div className="tpsodp2026-card__header-title">
                    <RotateCcw size={18} className="tpsodp2026-icon-primary" />
                    <h2>{t.adminActions}</h2>
                  </div>
                </header>

                <div className="admin-status-control">
                  <select
                    className="tpsodp2026-select"
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
                    className="tpsodp2026-btn-accent"
                    onClick={() => onUpdateStatus(selectedStatus)}
                    disabled={isUpdating || selectedStatus === rawStatus}
                  >
                    {isUpdating ? t.updating : t.updateStatus}
                  </button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
