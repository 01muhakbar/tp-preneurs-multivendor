import { useEffect, useState } from "react";
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
  }, [order?.note, order?.fulfillmentDraft]);

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
                <p>Order Detail</p>
                <h2 id="tpsodd2026-title">{order.reference}</h2>
                <p>
                  {order.createdAtLabel} <span>&middot;</span> {order.suborderNo}
                  <button type="button" onClick={() => onCopyReference(order.suborderNo)} aria-label="Copy suborder ref">
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
            <p>Loading order details...</p>
          </div>
        ) : error ? (
          <div className="tpsodd2026-body">
            <AlertTriangle color="#ef4444" size={48} />
            <h3>Unable to load order detail</h3>
            <p>{error?.message || "Failed to load from server."}</p>
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
                      <small>{step.dateLabel || "Pending"}</small>
                    </div>
                  );
                })}
              </section>

              <div className="tpsodd2026-grid">
                <section className="tpsodd2026-card">
                  <header className="tpsodd2026-card-header">
                    <span><UserRound size={14} /></span>
                    Customer
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
                    Items ({order.items.length})
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
                            <div><dt>Qty</dt><dd>{item.quantity}</dd></div>
                            <div><dt>Price</dt><dd>{item.priceLabel}</dd></div>
                            <div><dt>Total</dt><dd className="is-total">{item.subtotalLabel}</dd></div>
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
                    Shipping / Courier
                  </header>
                  <div className="tpsodd2026-shipping-info">
                    <div className="tpsodd2026-fields">
                      <label>
                        <span>Tracking Number</span>
                        <input
                          value={fulfillmentDraft?.trackingNumber || ""}
                          onChange={changeFulfillmentField("trackingNumber")}
                          placeholder="Input tracking number"
                        />
                      </label>
                      <label>
                        <span>Shipping Provider</span>
                        <input
                          value={fulfillmentDraft?.shippingProvider || ""}
                          onChange={changeFulfillmentField("shippingProvider")}
                          placeholder="JNE"
                        />
                      </label>
                      <label>
                        <span>Courier Service</span>
                        <input
                          value={fulfillmentDraft?.courierService || ""}
                          onChange={changeFulfillmentField("courierService")}
                          placeholder="REG"
                        />
                      </label>
                    </div>
                    {order.shipping.estimate && (
                      <div className="tpsodd2026-shipping-hint">
                        <Clock3 size={16} />
                        <div>
                          <strong>Drop-off by {order.shipping.estimate}</strong>
                          <div>Ship within SLA to avoid late shipment.</div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                <section className="tpsodd2026-card">
                  <header className="tpsodd2026-card-header">
                    <span><FileText size={14} /></span>
                    Internal Note
                  </header>
                  <div className="tpsodd2026-note">
                    <textarea 
                      placeholder="Add a private note about this order..."
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      onBlur={handleNoteBlur}
                      disabled={isSavingNote || isUpdating}
                    />
                    <footer>
                      <span>Only visible to your store</span>
                      {isSavingNote ? <span>Saving...</span> : null}
                    </footer>
                  </div>
                </section>
              </div>

              <section className="tpsodd2026-card">
                <header className="tpsodd2026-card-header">
                  <span><Check size={14} /></span>
                  Payment Summary
                </header>
                <div className="tpsodd2026-payment-method">
                  <div>
                    <span>Method</span>
                    <strong>{order.payment.method}</strong>
                  </div>
                  <span className={`tpsodd2026-pill is-${order.paymentStatus.tone}`}>
                    {order.paymentStatus.label}
                  </span>
                </div>
                <div className="tpsodd2026-payment-summary">
                  <div><dt>Subtotal ({order.items.length} Item)</dt><dd>{order.totals.subtotalLabel}</dd></div>
                  <div><dt>Shipping</dt><dd>{order.totals.shippingFeeLabel}</dd></div>
                  <div><dt>Service Fee</dt><dd>{order.totals.serviceFeeLabel}</dd></div>
                  <div><dt>Discount</dt><dd className="is-discount">-{order.totals.discountLabel}</dd></div>
                  <div className="tpsodd2026-payment-total">
                    <dt>Total Paid</dt>
                    <dd>{order.totals.totalLabel}</dd>
                  </div>
                </div>
              </section>
            </div>

            <footer className="tpsodd2026-footer">
              <button type="button" className="tpsodd2026-btn-outline" onClick={onPrintLabel} disabled={isUpdating}>
                <Printer size={16} /> Print Label
              </button>
              <button type="button" className="tpsodd2026-btn-outline" onClick={() => onMessageBuyer(order.customer)} disabled={!order.canMessageBuyer || isUpdating} title={order.canMessageBuyer ? "" : "Buyer contact info unavailable"}>
                <MessageCircle size={16} /> Message Buyer
              </button>
              <button type="button" className="tpsodd2026-btn-outline" onClick={() => onCopyReference(order.reference)} disabled={isUpdating}>
                <Copy size={16} /> Copy Ref
              </button>
              <button type="button" className="tpsodd2026-btn-outline" onClick={onViewInvoice} disabled={isUpdating}>
                <ExternalLink size={16} /> View Invoice
              </button>

              {order.primaryAction && (() => {
                const isMarkShipped = order.primaryAction.action === "MARK_SHIPPED";
                const isShippingIncomplete = isMarkShipped && (!fulfillmentDraft?.trackingNumber?.trim() || !fulfillmentDraft?.shippingProvider?.trim() || !fulfillmentDraft?.courierService?.trim());
                const isDisabled = order.primaryAction.disabled || isUpdating || isShippingIncomplete;
                const disableReason = isShippingIncomplete 
                  ? "Please fill in Tracking Number, Shipping Provider, and Courier Service." 
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
