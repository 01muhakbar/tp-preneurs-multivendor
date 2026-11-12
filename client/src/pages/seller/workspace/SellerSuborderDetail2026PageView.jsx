import React, { useState } from "react";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  Package,
  Printer,
  ShieldCheck,
  Truck,
  UserRound,
  WalletCards,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import "./seller-suborder-detail-2026.css";

const I18N = {
  id: {
    back: "Kembali ke Pesanan",
    title: "Rincian Pesanan",
    orderNo: "No. Pesanan",
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
    trackingNo: "Nomor Resi",
    trackingPlaceholder: "Masukkan nomor resi...",
    courierPlaceholder: "contoh: JNE",
    servicePlaceholder: "contoh: REG",
    noTracking: "Belum ada resi",
    paymentSummary: "Ringkasan Pembayaran",
    method: "Metode",
    paymentStatus: "Status Bayar",
    paidAt: "Waktu Bayar",
    shippingFee: "Total Ongkir",
    serviceFee: "Biaya Layanan",
    discount: "Diskon",
    totalPayment: "Total Pembayaran",
    notes: "Catatan Pesanan",
    buyerNote: "Catatan Pembeli",
    internalNote: "Catatan Internal Toko",
    internalNotePlaceholder: "Tulis catatan internal toko...",
    saveNote: "Simpan Catatan",
    saving: "Menyimpan...",
    quickActions: "Aksi Pesanan",
    printLabel: "Cetak Label Pengiriman",
    printingLabel: "Memuat Label...",
    messageBuyer: "Hubungi Pembeli",
    copyOrderNo: "Salin No. Pesanan",
    btnMarkPacked: "Siap Dikemas",
    btnMarkShipped: "Kirim Pesanan",
    btnMarkDelivered: "Tandai Selesai",
    btnReviewPayment: "Tinjau Bukti Bayar",
    tipMarkPacked: "Tekan jika selesai mengemas & menunggu kurir",
    tipShipOrder: "Tekan setelah paket diserahkan & nomor resi terisi",
    courierHint: "Ekspedisi pilihan pembeli saat checkout",
    serviceHint: "Jenis paket layanan kurir",
    trackingHint: "Masukkan nomor resi ekspedisi untuk pelacakan pembeli",
    viewPublicTracking: "Lihat Live Tracking Pembeli",
    viewPublicTrackingSub: "Buka halaman pelacakan publik pelanggan",
    shippingRequired: "Harap masukkan Nomor Resi sebelum mengirim pesanan.",
    loading: "Memuat rincian pesanan...",
    errorTitle: "Gagal memuat rincian pesanan",
    errorFallback: "Pesanan ini tidak tersedia untuk toko aktif Anda.",
    retry: "Coba Lagi",
  },
  en: {
    back: "Back to Orders",
    title: "Order Details",
    orderNo: "Order No.",
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
    trackingNo: "Tracking Number",
    trackingPlaceholder: "Input tracking number...",
    courierPlaceholder: "e.g. JNE",
    servicePlaceholder: "e.g. REG",
    noTracking: "No tracking yet",
    paymentSummary: "Payment Summary",
    method: "Method",
    paymentStatus: "Payment Status",
    paidAt: "Paid At",
    shippingFee: "Shipping Fee",
    serviceFee: "Service Fee",
    discount: "Discount",
    totalPayment: "Total Payment",
    notes: "Order Notes",
    buyerNote: "Buyer Note",
    internalNote: "Internal Store Note",
    internalNotePlaceholder: "Add private store note...",
    saveNote: "Save Note",
    saving: "Saving...",
    quickActions: "Order Actions",
    printLabel: "Print Shipping Label",
    printingLabel: "Loading Label...",
    messageBuyer: "Message Buyer",
    copyOrderNo: "Copy Order No.",
    btnMarkPacked: "Mark as Packed",
    btnMarkShipped: "Ship Order",
    btnMarkDelivered: "Mark as Delivered",
    btnReviewPayment: "Review Payment Proof",
    tipMarkPacked: "Click when package is packed & awaiting courier pickup",
    tipShipOrder: "Click when dispatched & tracking number is entered",
    courierHint: "Buyer's selected courier from checkout",
    serviceHint: "Courier service level",
    trackingHint: "Enter tracking number for customer tracking",
    viewPublicTracking: "View Buyer Live Tracking",
    viewPublicTrackingSub: "Open public buyer tracking page",
    shippingRequired: "Please enter tracking number before marking shipped.",
    loading: "Loading order details...",
    errorTitle: "Unable to load order details",
    errorFallback: "This order is not available for your active store.",
    retry: "Try Again",
  },
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

function ProgressRail({ steps, isIndo }) {
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
                <span className="tpsodp2026-step__date">
                  {step.dateLabel || (isIndo ? "Menunggu" : "Pending")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function SellerSuborderDetail2026PageView({
  order,
  store,
  isLoading = false,
  error = null,
  isUpdating = false,
  LinkComponent = "a",
  fulfillmentDraft = {},
  notice = null,
  isIndo = false,
  onCopyText,
  onBack,
  onPrintLabel,
  isPrintingLabel = false,
  onMessageBuyer,
  onFulfillmentDraftChange,
  onFulfillmentAction,
  onMarkPacked,
  onMarkShipped,
  onMarkDelivered,
  internalNoteDraft = "",
  onInternalNoteChange,
  onSaveInternalNote,
}) {
  const t = isIndo ? I18N.id : I18N.en;
  const Link = LinkComponent;
  const [validationError, setValidationError] = useState("");

  if (isLoading) {
    return (
      <div className="tpsodp2026-page" data-seller2026-live-order-detail="true">
        <div className="tpsodp2026-loading">
          <div className="tpsodp2026-spinner" />
          <p>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="tpsodp2026-page" data-seller2026-live-order-detail="true">
        <div className="tpsodp2026-error-card">
          <AlertTriangle size={48} className="tpsodp2026-error-icon" />
          <h2>{t.errorTitle}</h2>
          <p>{error?.message || t.errorFallback}</p>
          <button type="button" className="tpsodp2026-btn-primary" onClick={onBack}>
            <ArrowLeft size={16} />
            <span>{t.back}</span>
          </button>
        </div>
      </div>
    );
  }

  const fulfillmentCode = order.fulfillmentStatus?.code || "UNFULFILLED";
  const paymentCode = order.paymentStatus?.code || "UNPAID";
  const isPaid = paymentCode === "PAID" || paymentCode === "SETTLED";
  const bucket = order.statusBucket || "to_pack";
  const isToPack = bucket === "to_pack";
  const isShipped = bucket === "shipping" || fulfillmentCode === "SHIPPED";
  const isDelivered = bucket === "completed" || fulfillmentCode === "DELIVERED";

  // Editable shipping details whenever order is ready to fulfill / to pack
  const canEditShipping = isToPack || (!isShipped && !isDelivered && isPaid);

  const handleActionClick = (action) => {
    setValidationError("");
    if (action === "MARK_SHIPPED") {
      const tracking = String(fulfillmentDraft.trackingNumber || "").trim();
      if (!tracking) {
        setValidationError(t.shippingRequired);
        return;
      }
    }
    if (onFulfillmentAction) {
      onFulfillmentAction(action, fulfillmentDraft);
    }
  };

  const nextStep = order.nextStep;

  return (
    <div className="tpsodp2026-page" data-seller2026-live-order-detail="true">
      {/* Notice Banner */}
      {notice && (
        <div className={`tpsodp2026-notice tpsodp2026-notice--${notice.type || "info"}`}>
          <span>{notice.text}</span>
        </div>
      )}

      {/* Top Header / Breadcrumb */}
      <div className="tpsodp2026-topbar">
        <button type="button" className="tpsodp2026-btn-back" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>{t.back}</span>
        </button>

        <div className="tpsodp2026-topbar__actions">
          <button
            type="button"
            className="tpsodp2026-btn-outline"
            onClick={onPrintLabel}
            disabled={isUpdating || isPrintingLabel}
            title={t.printLabel}
          >
            <Printer size={15} />
            <span>{isPrintingLabel ? t.printingLabel : t.printLabel}</span>
          </button>
          <button
            type="button"
            className="tpsodp2026-btn-outline"
            onClick={() => onMessageBuyer?.(order.customer)}
            disabled={isUpdating || !order.canMessageBuyer}
            title={t.messageBuyer}
          >
            <MessageCircle size={15} />
            <span>{t.messageBuyer}</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <header className="tpsodp2026-hero-card">
        <div className="tpsodp2026-hero-card__main">
          <div className="tpsodp2026-hero-card__meta-row">
            <span className="tpsodp2026-eyebrow">{t.title}</span>
            {order.orderId ? (
              <span
                className="tpsodp2026-order-id-badge"
                title={`Order #${order.orderId}`}
                onClick={() => onCopyText?.(String(order.orderId), `#${order.orderId}`)}
              >
                #{order.orderId}
              </span>
            ) : null}
            <div className="tpsodp2026-hero-card__chips">
              <StatusPill status={order.paymentStatus} />
              <StatusPill status={order.readinessStatus} />
            </div>
          </div>

          <div className="tpsodp2026-hero-card__title-row">
            <h1>{order.reference}</h1>
            <button
              type="button"
              className="tpsodp2026-btn-icon-copy"
              onClick={() => onCopyText?.(order.reference, t.orderNo)}
              title={t.copy}
              aria-label={t.copy}
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="tpsodp2026-hero-card__sub-row">
            <span className="tpsodp2026-time-stamp">
              <CalendarDays size={14} />
              {order.createdAtLabel}
            </span>
            <span className="tpsodp2026-divider">•</span>
            <span className="tpsodp2026-suborder-no">
              {order.suborderNo}
              <button
                type="button"
                className="tpsodp2026-btn-mini-copy"
                onClick={() => onCopyText?.(order.rawSuborderNo || order.suborderNo, "Suborder ID")}
                title={t.copy}
              >
                <Copy size={12} />
              </button>
            </span>
          </div>
        </div>
      </header>

      {/* 5-Step Visual Progress Rail */}
      <ProgressRail steps={order.progress} isIndo={isIndo} />

      {/* Prominent Next Step Guidance Card */}
      {nextStep && (
        <section className={`tpsodp2026-next-step-card tpsodp2026-next-step-card--${nextStep.bucket}`}>
          <div className="tpsodp2026-next-step-card__icon-wrap">
            {nextStep.icon === "package" ? (
              <Package size={22} className="tpsodp2026-icon-accent" />
            ) : nextStep.icon === "truck" ? (
              <Truck size={22} className="tpsodp2026-icon-primary" />
            ) : nextStep.icon === "check" ? (
              <CheckCircle2 size={22} className="tpsodp2026-icon-success" />
            ) : (
              <Clock3 size={22} className="tpsodp2026-icon-muted" />
            )}
          </div>
          <div className="tpsodp2026-next-step-card__content">
            <div className="tpsodp2026-next-step-card__title-row">
              <h3>{nextStep.title}</h3>
              {nextStep.badge && (
                <span className={`tpsodp2026-pill tpsodp2026-pill--${nextStep.badgeTone || "orange"}`}>
                  <span className="tpsodp2026-pill__dot" />
                  {nextStep.badge}
                </span>
              )}
            </div>
            <p className="tpsodp2026-next-step-card__desc">{nextStep.description}</p>
          </div>
          {isToPack && (
            <div className="tpsodp2026-next-step-card__actions">
              <button
                type="button"
                className="tpsodp2026-btn-accent"
                onClick={() => handleActionClick("MARK_SHIPPED")}
                disabled={isUpdating}
                title={t.tipShipOrder}
              >
                <Truck size={15} />
                <span>{nextStep.primaryLabel}</span>
              </button>
              <button
                type="button"
                className="tpsodp2026-btn-primary"
                onClick={() => handleActionClick("MARK_PROCESSING")}
                disabled={isUpdating}
                title={t.tipMarkPacked}
              >
                <CheckCircle2 size={15} />
                <span>{nextStep.secondaryLabel}</span>
              </button>
            </div>
          )}
          {isShipped && (
            <div className="tpsodp2026-next-step-card__actions">
              <button
                type="button"
                className="tpsodp2026-btn-primary"
                onClick={() => handleActionClick("MARK_DELIVERED")}
                disabled={isUpdating}
              >
                <CheckCircle2 size={15} />
                <span>{nextStep.primaryLabel}</span>
              </button>
            </div>
          )}
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
              <span className="tpsodp2026-badge-count">{order.items?.length || 0}</span>
            </header>

            <div className="tpsodp2026-items-list">
              {order.items?.length ? (
                order.items.map((item) => (
                  <article key={item.id} className="tpsodp2026-item-row">
                    <div className="tpsodp2026-item-row__media">
                      {item.imageUrl ? (
                        <img
                          src={resolveAssetUrl(item.imageUrl)}
                          alt={item.name}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <Box size={24} className="tpsodp2026-item-row__fallback" />
                      )}
                    </div>
                    <div className="tpsodp2026-item-row__info">
                      <strong className="tpsodp2026-item-row__name">{item.name}</strong>
                      {item.variantLabel && (
                        <span className="tpsodp2026-item-row__variant">{item.variantLabel}</span>
                      )}
                      <div className="tpsodp2026-item-row__pricing">
                        <span>{item.priceLabel}</span>
                        <span className="tpsodp2026-item-row__qty">× {item.quantity}</span>
                      </div>
                    </div>
                    <div className="tpsodp2026-item-row__total">
                      <strong>{item.subtotalLabel}</strong>
                    </div>
                  </article>
                ))
              ) : (
                <div className="tpsodp2026-empty-state">
                  <Box size={24} />
                  <p>{isIndo ? "Tidak ada produk." : "No items."}</p>
                </div>
              )}
            </div>
          </section>

          {/* Shipping & Courier Card */}
          <section className="tpsodp2026-card">
            <header className="tpsodp2026-card__header">
              <div className="tpsodp2026-card__header-title">
                <Truck size={18} className="tpsodp2026-icon-primary" />
                <h2>{t.shipping}</h2>
              </div>
              <StatusPill status={{ label: order.shipping?.status, tone: order.shipping?.statusTone }} />
            </header>

            <div className="tpsodp2026-shipping-grid">
              <div className="tpsodp2026-field">
                <label className="tpsodp2026-field__label">{t.courier}</label>
                {canEditShipping ? (
                  <input
                    type="text"
                    className="tpsodp2026-input"
                    value={fulfillmentDraft.shippingProvider || ""}
                    onChange={(e) => onFulfillmentDraftChange?.("shippingProvider", e.target.value)}
                    placeholder={t.courierPlaceholder}
                    disabled={isUpdating}
                  />
                ) : (
                  <div className="tpsodp2026-field__value">
                    <strong>{order.shipping?.courier || "-"}</strong>
                  </div>
                )}
                <span className="tpsodp2026-field__hint">{t.courierHint}</span>
              </div>

              <div className="tpsodp2026-field">
                <label className="tpsodp2026-field__label">{t.service}</label>
                {canEditShipping ? (
                  <input
                    type="text"
                    className="tpsodp2026-input"
                    value={fulfillmentDraft.courierService || ""}
                    onChange={(e) => onFulfillmentDraftChange?.("courierService", e.target.value)}
                    placeholder={t.servicePlaceholder}
                    disabled={isUpdating}
                  />
                ) : (
                  <div className="tpsodp2026-field__value">
                    <span>{order.shipping?.method || "-"}</span>
                  </div>
                )}
                <span className="tpsodp2026-field__hint">{t.serviceHint}</span>
              </div>

              <div className="tpsodp2026-field tpsodp2026-field--full">
                <label className="tpsodp2026-field__label">{t.trackingNo}</label>
                {canEditShipping ? (
                  <input
                    type="text"
                    className="tpsodp2026-input tpsodp2026-input--highlight"
                    value={fulfillmentDraft.trackingNumber || ""}
                    onChange={(e) => {
                      setValidationError("");
                      onFulfillmentDraftChange?.("trackingNumber", e.target.value);
                    }}
                    placeholder={t.trackingPlaceholder}
                    disabled={isUpdating}
                  />
                ) : (
                  <div className="tpsodp2026-tracking-display">
                    <strong>{order.shipping?.trackingNo || t.noTracking}</strong>
                    {order.shipping?.trackingNo && (
                      <button
                        type="button"
                        className="tpsodp2026-btn-mini-copy"
                        onClick={() => onCopyText?.(order.shipping.trackingNo, t.trackingNo)}
                        title={t.copy}
                      >
                        <Copy size={13} />
                      </button>
                    )}
                  </div>
                )}
                <span className="tpsodp2026-field__hint">{t.trackingHint}</span>
              </div>
            </div>

            {validationError && (
              <div className="tpsodp2026-field-error">
                <AlertTriangle size={14} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Action Buttons for Fulfillment */}
            <div className="tpsodp2026-fulfillment-actions">
              {paymentCode === "PENDING_CONFIRMATION" && (
                <button
                  type="button"
                  className="tpsodp2026-btn-primary"
                  onClick={() => handleActionClick("REVIEW_PAYMENT")}
                  disabled={isUpdating}
                >
                  <ShieldCheck size={16} />
                  <span>{t.btnReviewPayment}</span>
                </button>
              )}

              {isToPack && (
                <>
                  <button
                    type="button"
                    className="tpsodp2026-btn-accent"
                    onClick={() => handleActionClick("MARK_SHIPPED")}
                    disabled={isUpdating}
                    title={t.btnMarkShipped}
                  >
                    <Truck size={16} />
                    <span>{t.btnMarkShipped}</span>
                  </button>

                  <button
                    type="button"
                    className="tpsodp2026-btn-primary"
                    onClick={() => handleActionClick("MARK_PROCESSING")}
                    disabled={isUpdating}
                    title={t.btnMarkPacked}
                  >
                    <CheckCircle2 size={16} />
                    <span>{t.btnMarkPacked}</span>
                  </button>
                </>
              )}

              {isShipped && (
                <button
                  type="button"
                  className="tpsodp2026-btn-primary"
                  onClick={() => handleActionClick("MARK_DELIVERED")}
                  disabled={isUpdating}
                  title={t.btnMarkDelivered}
                >
                  <CheckCircle2 size={16} />
                  <span>{t.btnMarkDelivered}</span>
                </button>
              )}
            </div>
          </section>

          {/* Internal Notes Card */}
          <section className="tpsodp2026-card">
            <header className="tpsodp2026-card__header">
              <div className="tpsodp2026-card__header-title">
                <FileText size={18} className="tpsodp2026-icon-primary" />
                <h2>{t.notes}</h2>
              </div>
            </header>

            <div className="tpsodp2026-notes-form">
              <label className="tpsodp2026-field__label">{t.internalNote}</label>
              <textarea
                className="tpsodp2026-textarea"
                rows={3}
                value={internalNoteDraft}
                onChange={(e) => onInternalNoteChange?.(e.target.value)}
                placeholder={t.internalNotePlaceholder}
                disabled={isUpdating}
              />
              <div className="tpsodp2026-notes-form__footer">
                <button
                  type="button"
                  className="tpsodp2026-btn-primary"
                  onClick={onSaveInternalNote}
                  disabled={isUpdating}
                >
                  <span>{isUpdating ? t.saving : t.saveNote}</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Customer Info, Payment Summary, Actions */}
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
                <span>{order.customer?.name ? order.customer.name.slice(0, 2).toUpperCase() : "SU"}</span>
              </div>
              <div className="tpsodp2026-customer-box__details">
                <strong className="tpsodp2026-customer-box__name">{order.customer?.name}</strong>
                {order.customer?.phone && (
                  <div className="tpsodp2026-customer-box__contact-row">
                    <span>{order.customer.phone}</span>
                    {order.canMessageBuyer && (
                      <button
                        type="button"
                        className="tpsodp2026-badge-wa"
                        onClick={() => onMessageBuyer?.(order.customer)}
                        title={t.whatsapp}
                      >
                        <MessageCircle size={12} />
                        <span>{t.whatsapp}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="tpsodp2026-address-box">
              <MapPin size={15} className="tpsodp2026-address-box__icon" />
              <p className="tpsodp2026-address-box__text">{order.customer?.address}</p>
            </div>
          </section>

          {/* Payment Summary Card */}
          <section className="tpsodp2026-card">
            <header className="tpsodp2026-card__header">
              <div className="tpsodp2026-card__header-title">
                <WalletCards size={18} className="tpsodp2026-icon-primary" />
                <h2>{t.paymentSummary}</h2>
              </div>
              <StatusPill status={order.paymentStatus} />
            </header>

            <div className="tpsodp2026-payment-info">
              <div className="tpsodp2026-info-row">
                <span className="tpsodp2026-info-row__label">{t.method}</span>
                <strong className="tpsodp2026-info-row__value">{order.payment?.method}</strong>
              </div>

              {order.payment?.paidAt && (
                <div className="tpsodp2026-info-row">
                  <span className="tpsodp2026-info-row__label">{t.paidAt}</span>
                  <span className="tpsodp2026-info-row__value">{order.paidAtLabel}</span>
                </div>
              )}
            </div>

            <div className="tpsodp2026-totals-list">
              <div className="tpsodp2026-total-line">
                <span>{isIndo ? `Subtotal (${order.items?.length || 1} Produk)` : `Subtotal (${order.items?.length || 1} Items)`}</span>
                <span>{order.totals?.subtotalLabel}</span>
              </div>
              <div className="tpsodp2026-total-line">
                <span>{t.shippingFee}</span>
                <span>{order.totals?.shippingFeeLabel}</span>
              </div>
              <div className="tpsodp2026-total-line">
                <span>{t.serviceFee}</span>
                <span>{order.totals?.serviceFeeLabel}</span>
              </div>
              {order.totals?.discount > 0 && (
                <div className="tpsodp2026-total-line tpsodp2026-total-line--discount">
                  <span>{t.discount}</span>
                  <span>-{order.totals?.discountLabel}</span>
                </div>
              )}
              <div className="tpsodp2026-total-line tpsodp2026-total-line--grand">
                <strong>{t.totalPayment}</strong>
                <strong className="tpsodp2026-grand-amount">{order.totals?.totalLabel}</strong>
              </div>
            </div>
          </section>

          {/* Quick Actions Card */}
          <section className="tpsodp2026-card">
            <header className="tpsodp2026-card__header">
              <div className="tpsodp2026-card__header-title">
                <CheckCircle2 size={18} className="tpsodp2026-icon-primary" />
                <h2>{t.quickActions}</h2>
              </div>
            </header>

            <div className="tpsodp2026-actions-list">
              {order.shipping?.trackingUrl && (
                <a
                  href={order.shipping.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tpsodp2026-action-tile"
                  title={t.viewPublicTracking}
                >
                  <div className="tpsodp2026-action-tile__icon">
                    <ExternalLink size={16} />
                  </div>
                  <div className="tpsodp2026-action-tile__text">
                    <strong>{t.viewPublicTracking}</strong>
                    <span>{t.viewPublicTrackingSub}</span>
                  </div>
                </a>
              )}

              <button
                type="button"
                className="tpsodp2026-action-tile"
                onClick={onPrintLabel}
                disabled={isUpdating || isPrintingLabel}
              >
                <div className="tpsodp2026-action-tile__icon">
                  <Printer size={16} />
                </div>
                <div className="tpsodp2026-action-tile__text">
                  <strong>{t.printLabel}</strong>
                  <span>{isIndo ? "Label resi pengiriman" : "Standard courier label"}</span>
                </div>
              </button>

              <button
                type="button"
                className="tpsodp2026-action-tile"
                onClick={() => onMessageBuyer?.(order.customer)}
                disabled={isUpdating || !order.canMessageBuyer}
              >
                <div className="tpsodp2026-action-tile__icon">
                  <MessageCircle size={16} />
                </div>
                <div className="tpsodp2026-action-tile__text">
                  <strong>{t.messageBuyer}</strong>
                  <span>{isIndo ? "Hubungi via WhatsApp" : "Contact via WhatsApp"}</span>
                </div>
              </button>

              <button
                type="button"
                className="tpsodp2026-action-tile"
                onClick={() => onCopyText?.(order.reference, t.orderNo)}
              >
                <div className="tpsodp2026-action-tile__icon">
                  <Copy size={16} />
                </div>
                <div className="tpsodp2026-action-tile__text">
                  <strong>{t.copyOrderNo}</strong>
                  <span>{order.reference}</span>
                </div>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
