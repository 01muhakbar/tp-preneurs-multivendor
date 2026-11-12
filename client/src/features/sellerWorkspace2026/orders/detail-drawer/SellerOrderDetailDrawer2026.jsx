import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  Box,
  Check,
  ChevronLeft,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  MoreVertical,
  Package,
  PackageCheck,
  Printer,
  ShieldCheck,
  Truck,
  UserRound,
  X,
  FileText
} from "lucide-react";
import { updateSeller2026OrderInternalNote } from "../../../../api/seller2026/orders.mutations.ts";
import { normalizeDrawerOrderDetail } from "./sellerOrderDetailDrawerUtils.js";
import "./SellerOrderDetailDrawer2026.css";

export default function SellerOrderDetailDrawer2026({
  orderData,
  storeId,
  isLoading = false,
  error = null,
  isUpdating = false,
  onClose,
  onCopyReference,
  onPrintLabel,
  onMessageBuyer,
  onViewInvoice,
  onFulfillmentAction,
}) {
  const { i18n } = useTranslation();
  const [, setLangSyncCounter] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSyncCounter((c) => c + 1);
    i18n.on("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      i18n.off("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, [i18n]);

  const isIndo = (() => {
    const lang = (i18n.language || "").toLowerCase();
    if (lang.startsWith("id")) return true;
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          window.localStorage.getItem("seller_language") || "null"
        );
        if (
          stored?.isoCode?.toLowerCase()?.startsWith("id") ||
          stored?.name?.toLowerCase()?.includes("indonesia")
        ) {
          return true;
        }
      } catch {
        // ignore
      }
      const storeLang = window.localStorage.getItem("store_language") || "";
      if (
        storeLang.toLowerCase().includes("indonesia") ||
        storeLang.toLowerCase() === "id"
      ) {
        return true;
      }
    }
    return false;
  })();

  const [internalNote, setInternalNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [fulfillmentDraft, setFulfillmentDraft] = useState({});

  const order = normalizeDrawerOrderDetail(orderData);

  useEffect(() => {
    if (order?.note) {
      setInternalNote(order.note);
    } else {
      setInternalNote("");
    }
    
    if (order?.fulfillmentDraft) {
      setFulfillmentDraft(order.fulfillmentDraft);
    }
    // Only initialize when opening a new order to prevent overriding user input on re-renders
  }, [order?.id]);

  const changeFulfillmentField = (field) => (event) => {
    setFulfillmentDraft((current) => ({ ...current, [field]: event.target.value }));
  };

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleNoteBlur = async () => {
    if (!order || isSavingNote || internalNote === order.note) return;
    try {
      setIsSavingNote(true);
      await updateSeller2026OrderInternalNote({
        storeId,
        suborderId: order.id,
        note: internalNote,
      });
      // Optionally toast success here, though background save is usually silent
    } catch (err) {
      console.error("Failed to save note", err);
    } finally {
      setIsSavingNote(false);
    }
  };

  if (!order && !isLoading && !error) return null;

  // The inputs should ONLY be active when the order is Packed (PROCESSING)
  // because that's when the user inputs tracking data to mark it as Shipped.
  const isShippingReadonly = order?.status?.code !== "PROCESSING" && order?.status?.code !== "PACKED";

  return (
    <div className="tpsodd2026-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="tpsodd2026-drawer" role="dialog" aria-modal="true" aria-labelledby="tpsodd2026-title">
        <header className="tpsodd2026-header">
          <div className="tpsodd2026-header-top">
            <button type="button" className="tpsodd2026-back-btn" onClick={onClose} disabled={isUpdating}>
              <ChevronLeft size={18} />
              Back to Orders
            </button>
            <div className="tpsodd2026-header-actions">
              <button type="button" className="tpsodd2026-icon-btn" disabled title="More actions not enabled">
                <MoreVertical size={18} />
              </button>
              <button type="button" className="tpsodd2026-icon-btn" onClick={onClose} disabled={isUpdating} aria-label="Close drawer">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isLoading && !error && order ? (
            <div className="tpsodd2026-titlebar">
              <div>
                <p>{isIndo ? "Rincian Pesanan" : "Order Detail"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <h2 id="tpsodd2026-title">{order.reference}</h2>
                  {order.orderId ? (
                    <span className="tpsow2026-order-id-badge" title={`Order ID: ${order.orderId}`}>
                      #{order.orderId}
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onCopyReference(order.reference)}
                    title={isIndo ? "Salin No. Pesanan" : "Copy Order No."}
                    aria-label="Copy order no"
                    style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--tpsow-text-muted, #64748b)", display: "flex", alignItems: "center", padding: "2px" }}
                  >
                    <Copy size={13} />
                  </button>
                </div>
                <p>
                  {order.createdAtLabel} <span>&middot;</span> {order.suborderNo}
                  <button type="button" onClick={() => onCopyReference(order.suborderNo)} aria-label="Copy suborder ref" title={isIndo ? "Salin Suborder ID" : "Copy Suborder ID"}>
                    <Copy size={12} />
                  </button>
                </p>
              </div>
              <span className={`tpsodd2026-pill is-${order.paymentStatus.tone}`}>
                {order.paymentStatus.label}
              </span>
            </div>
          ) : null}
        </header>

        {isLoading ? (
          <div className="tpsodd2026-body">
            <p>{isIndo ? "Memuat rincian pesanan..." : "Loading order details..."}</p>
          </div>
        ) : error ? (
          <div className="tpsodd2026-body">
            <AlertTriangle color="#ef4444" size={48} />
            <h3>{isIndo ? "Gagal memuat rincian pesanan" : "Unable to load order detail"}</h3>
            <p>{error?.message || (isIndo ? "Gagal memuat dari server." : "Failed to load from server.")}</p>
          </div>
        ) : order ? (
          <>
            <div className="tpsodd2026-body">
              <section className="tpsodd2026-stepper">
                {order.progress.map((step) => {
                  const Icon =
                    step.code === "SHIPPED" ? Truck
                      : step.code === "PACKED" ? Package
                      : step.complete ? Check
                      : ShieldCheck;
                  return (
                    <div key={step.code} className={`tpsodd2026-step ${step.complete ? 'is-complete' : step.active ? 'is-active' : ''}`}>
                      <div className="tpsodd2026-step-icon"><Icon size={16} /></div>
                      <strong>{step.label}</strong>
                      <small>{step.dateLabel || (isIndo ? "Menunggu" : "Pending")}</small>
                    </div>
                  );
                })}
              </section>

              <div className="tpsodd2026-grid">
                <section className="tpsodd2026-card">
                  <header className="tpsodd2026-card-header">
                    <span><UserRound size={14} /></span>
                    {isIndo ? "Pelanggan" : "Customer"}
                  </header>
                  <div className="tpsodd2026-customer">
                    <div className="tpsodd2026-customer-avatar">
                      {order.customer.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="tpsodd2026-customer-info">
                      <strong>{order.customer.name}</strong>
                      <small>{order.customer.phone}</small>
                      <p><MapPin size={14} /> {order.customer.address}</p>
                    </div>
                  </div>
                </section>

                <section className="tpsodd2026-card tpsodd2026-items-card">
                  <header className="tpsodd2026-card-header">
                    <span><Box size={14} /></span>
                    {isIndo ? `Produk (${order.items.length})` : `Items (${order.items.length})`}
                  </header>
                  <div className="tpsodd2026-items-list">
                    {order.items.map((item) => (
                      <article key={item.id} className="tpsodd2026-item">
                        <div className="tpsodd2026-item-img">
                          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <Box size={24} />}
                        </div>
                        <div className="tpsodd2026-item-details">
                          <strong>{item.name}</strong>
                          <small>{item.variantLabel}</small>
                          <div className="tpsodd2026-item-price">
                            <div><dt>{isIndo ? "Jml" : "Qty"}</dt><dd>{item.quantity}</dd></div>
                            <div><dt>{isIndo ? "Harga" : "Price"}</dt><dd>{item.priceLabel}</dd></div>
                            <div><dt>{isIndo ? "Total" : "Total"}</dt><dd className="is-total">{item.subtotalLabel}</dd></div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <div className="tpsodd2026-grid">
                <section className="tpsodd2026-card">
                  <header className="tpsodd2026-card-header">
                    <span><Truck size={14} /></span>
                    {isIndo ? "Pengiriman / Kurir" : "Shipping / Courier"}
                  </header>
                  <div className="tpsodd2026-shipping-info">
                    <div className="tpsodd2026-fields">
                      <label>
                        <span>{isIndo ? "Nomor Resi" : "Tracking Number"}</span>
                        <input
                          value={fulfillmentDraft?.trackingNumber || ""}
                          onChange={changeFulfillmentField("trackingNumber")}
                          placeholder={isIndo ? "Masukkan nomor resi" : "Input tracking number"}
                          disabled={isShippingReadonly || isUpdating}
                        />
                      </label>
                      <label>
                        <span>{isIndo ? "Ekspedisi / Kurir" : "Shipping Provider"}</span>
                        <input
                          value={fulfillmentDraft?.shippingProvider || ""}
                          onChange={changeFulfillmentField("shippingProvider")}
                          placeholder="JNE"
                          disabled={isShippingReadonly || isUpdating}
                        />
                      </label>
                      <label>
                        <span>{isIndo ? "Layanan" : "Courier Service"}</span>
                        <input
                          value={fulfillmentDraft?.courierService || ""}
                          onChange={changeFulfillmentField("courierService")}
                          placeholder="REG"
                          disabled={isShippingReadonly || isUpdating}
                        />
                      </label>
                    </div>
                    {order.shipping.estimate && (
                      <div className="tpsodd2026-shipping-hint">
                        <Clock3 size={16} />
                        <div>
                          <strong>{isIndo ? `Kirim sebelum ${order.shipping.estimate}` : `Drop-off by ${order.shipping.estimate}`}</strong>
                          <div>{isIndo ? "Kirim tepat waktu sesuai SLA untuk menghindari keterlambatan." : "Ship within SLA to avoid late shipment."}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="tpsodd2026-card">
                  <header className="tpsodd2026-card-header">
                    <span><FileText size={14} /></span>
                    {isIndo ? "Catatan Internal" : "Internal Note"}
                  </header>
                  <div className="tpsodd2026-note">
                    <textarea 
                      placeholder={isIndo ? "Tambahkan catatan internal toko mengenai pesanan ini..." : "Add a private note about this order..."}
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      onBlur={handleNoteBlur}
                      disabled={isSavingNote || isUpdating}
                    />
                    <footer>
                      <span>{isIndo ? "Hanya terlihat oleh toko Anda" : "Only visible to your store"}</span>
                      {isSavingNote ? <span>{isIndo ? "Menyimpan..." : "Saving..."}</span> : null}
                    </footer>
                  </div>
                </section>
              </div>

              <section className="tpsodd2026-card">
                <header className="tpsodd2026-card-header">
                  <span><Check size={14} /></span>
                  {isIndo ? "Ringkasan Pembayaran" : "Payment Summary"}
                </header>
                <div className="tpsodd2026-payment-method">
                  <div>
                    <span>{isIndo ? "Metode" : "Method"}</span>
                    <strong>{order.payment.method}</strong>
                  </div>
                  <span className={`tpsodd2026-pill is-${order.paymentStatus.tone}`}>
                    {order.paymentStatus.label}
                  </span>
                </div>
                <div className="tpsodd2026-payment-summary">
                  <div><dt>{isIndo ? `Subtotal (${order.items.length} Produk)` : `Subtotal (${order.items.length} Item)`}</dt><dd>{order.totals.subtotalLabel}</dd></div>
                  <div><dt>{isIndo ? "Ongkos Kirim" : "Shipping"}</dt><dd>{order.totals.shippingFeeLabel}</dd></div>
                  <div><dt>{isIndo ? "Biaya Layanan" : "Service Fee"}</dt><dd>{order.totals.serviceFeeLabel}</dd></div>
                  <div><dt>{isIndo ? "Diskon" : "Discount"}</dt><dd className="is-discount">-{order.totals.discountLabel}</dd></div>
                  <div className="tpsodd2026-payment-total">
                    <dt>{isIndo ? "Total Dibayar" : "Total Paid"}</dt>
                    <dd>{order.totals.totalLabel}</dd>
                  </div>
                </div>
              </section>
            </div>

            <footer className="tpsodd2026-footer">
              <button
                type="button"
                className="tpsodd2026-btn-outline"
                onClick={onPrintLabel}
                disabled={isUpdating || !order.canPrintLabel}
                title={order.printLabelReason}
              >
                <Printer size={16} /> {isIndo ? "Cetak Label" : "Print Label"}
              </button>
              <button type="button" className="tpsodd2026-btn-outline" onClick={() => onMessageBuyer(order.customer)} disabled={!order.canMessageBuyer || isUpdating} title={order.canMessageBuyer ? "" : (isIndo ? "Kontak pembeli tidak tersedia" : "Buyer contact info unavailable")}>
                <MessageCircle size={16} /> {isIndo ? "Hubungi Pembeli" : "Message Buyer"}
              </button>
              <button type="button" className="tpsodd2026-btn-outline" onClick={() => onCopyReference(order.reference)} disabled={isUpdating}>
                <Copy size={16} /> {isIndo ? "Salin Ref" : "Copy Ref"}
              </button>
              <button type="button" className="tpsodd2026-btn-outline" onClick={onViewInvoice} disabled={isUpdating}>
                <ExternalLink size={16} /> {isIndo ? "Lihat Invoice" : "View Invoice"}
              </button>

              {order.primaryAction && (() => {
                const isMarkShipped = order.primaryAction.action === "MARK_SHIPPED";
                const isShippingIncomplete = isMarkShipped && (!fulfillmentDraft?.trackingNumber?.trim() || !fulfillmentDraft?.shippingProvider?.trim() || !fulfillmentDraft?.courierService?.trim());
                const isDisabled = order.primaryAction.disabled || isUpdating || isShippingIncomplete;
                const disableReason = isShippingIncomplete 
                  ? (isIndo ? "Silakan isi Nomor Resi, Ekspedisi, dan Layanan Kurir." : "Please fill in Tracking Number, Shipping Provider, and Courier Service.")
                  : order.primaryAction.reason;

                return (
                  <button
                    type="button"
                    className="tpsodd2026-btn-primary"
                    onClick={() => onFulfillmentAction(order.primaryAction.action, fulfillmentDraft)}
                    disabled={isDisabled}
                    title={isDisabled ? disableReason : order.primaryAction.label}
                  >
                    {order.primaryAction.action === "REVIEW_PAYMENT" ? <ShieldCheck size={16} /> : <Truck size={16} />} {order.primaryAction.label}
                  </button>
                );
              })()}
            </footer>
          </>
        ) : null}
      </aside>
    </div>
  );
}
