import {
  AlertTriangle,
  Box,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
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
} from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./seller-order-detail-2026.css";

function StatusPill({ status }) {
  return (
    <span className={`tpsod2026-pill tpsod2026-pill--${status?.tone || "slate"}`}>
      <i aria-hidden="true" />
      {status?.label || "Not set"}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="tpsod2026-body">
      <div className="tpsod2026-skeleton tpsod2026-skeleton--hero" />
      <div className="tpsod2026-grid">
        <div className="tpsod2026-skeleton" />
        <div className="tpsod2026-skeleton" />
      </div>
      <div className="tpsod2026-skeleton tpsod2026-skeleton--wide" />
    </div>
  );
}

function ErrorState({ error, onClose }) {
  return (
    <div className="tpsod2026-state">
      <AlertTriangle aria-hidden="true" />
      <h3>Unable to load order detail</h3>
      <p>
        {error?.response?.data?.message ||
          error?.message ||
          "This seller suborder may no longer be available."}
      </p>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  );
}

function ProgressRail({ steps }) {
  return (
    <section className="tpsod2026-progress" aria-label="Order progress">
      {steps.map((step, index) => {
        const Icon =
          step.code === "SHIPPED"
            ? Truck
            : step.code === "PACKED"
              ? Package
              : step.complete
                ? Check
                : ShieldCheck;
        return (
          <article
            className={step.complete ? "is-complete" : step.active ? "is-active" : ""}
            key={step.code}
          >
            <span aria-hidden="true">
              <Icon />
            </span>
            <strong>{step.label}</strong>
            <small>{step.dateLabel || (index === 0 ? "Not set" : "Pending")}</small>
          </article>
        );
      })}
    </section>
  );
}

function CustomerBlock({ customer }) {
  return (
    <section className="tpsod2026-card tpsod2026-customer">
      <h3>A. Customer</h3>
      <div>
        <span aria-hidden="true"><UserRound /></span>
        <div>
          <strong>{customer.name}</strong>
          <small>{customer.phone || customer.email || "Not set"}</small>
          <p><MapPin aria-hidden="true" />{customer.address}</p>
        </div>
      </div>
    </section>
  );
}

function ItemsBlock({ items }) {
  return (
    <section className="tpsod2026-card tpsod2026-items">
      <h3>B. Items ({items.length})</h3>
      {items.length ? (
        <div className="tpsod2026-items__list">
          {items.map((item) => (
            <article key={item.id}>
              <span aria-hidden="true">
                {item.imageUrl ? (
                  <img src={resolveAssetUrl(item.imageUrl)} alt="" />
                ) : (
                  <Box />
                )}
              </span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.variantLabel}</small>
              </div>
              <dl>
                <div><dt>Qty</dt><dd>{item.quantity}</dd></div>
                <div><dt>Price</dt><dd>{item.priceLabel}</dd></div>
                <div><dt>Total</dt><dd>{item.subtotalLabel}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className="tpsod2026-empty">No item snapshot available.</p>
      )}
    </section>
  );
}

function ShippingBlock({ shipping }) {
  return (
    <section className="tpsod2026-card tpsod2026-shipping">
      <h3>C. Shipping / Courier</h3>
      <div className="tpsod2026-shipping__main">
        <span aria-hidden="true"><Truck /></span>
        <div>
          <strong>{shipping.courier}</strong>
          <small>Tracking: {shipping.trackingNo}</small>
          <small>{shipping.estimate ? `Estimated arrival ${shipping.estimate}` : "Tracking remains read-only."}</small>
        </div>
        <StatusPill status={{ label: shipping.status, tone: shipping.statusTone }} />
      </div>
      <ol className="tpsod2026-timeline">
        {shipping.timeline.length ? (
          shipping.timeline.map((event) => (
            <li key={event.id}>
              <i aria-hidden="true" />
              <span>{event.createdAtLabel}</span>
              <strong>{event.label}</strong>
            </li>
          ))
        ) : (
          <li>
            <i aria-hidden="true" />
            <span>Not set</span>
            <strong>No tracking timeline yet</strong>
          </li>
        )}
      </ol>
    </section>
  );
}

function PaymentBlock({ order }) {
  return (
    <section className="tpsod2026-card tpsod2026-payment">
      <h3>D. Payment Summary</h3>
      <div className="tpsod2026-payment__status">
        <span>Payment Method</span>
        <strong>{order.payment.method}</strong>
        <StatusPill status={order.paymentStatus} />
        <small>Payment status is read-only in Seller Orders.</small>
      </div>
      <dl>
        <div><dt>Subtotal</dt><dd>{order.totals.subtotalLabel}</dd></div>
        <div><dt>Shipping Fee</dt><dd>{order.totals.shippingFeeLabel}</dd></div>
        <div><dt>Service Fee</dt><dd>{order.totals.serviceFeeLabel}</dd></div>
        <div><dt>Discount</dt><dd>{order.totals.discountLabel}</dd></div>
        <div><dt>Total Paid</dt><dd>{order.totals.totalLabel}</dd></div>
      </dl>
    </section>
  );
}

export default function SellerOrderDetail2026Panel({
  order,
  isLoading = false,
  error = null,
  isUpdating = false,
  onClose,
  onBack,
  onCopyReference,
  onPrintLabel,
  onMessageBuyer,
  onViewInvoice,
  onMarkDelivered,
}) {
  if (!order && !isLoading && !error) return null;

  return (
    <div className="tpsod2026-shell" role="dialog" aria-modal="true" aria-labelledby="tpsod2026-title">
      <button
        type="button"
        className="tpsod2026-backdrop"
        aria-label="Close order detail"
        onClick={onClose}
        disabled={isUpdating}
      />
      <aside className="tpsod2026-panel">
        <header className="tpsod2026-header">
          <div className="tpsod2026-header__top">
            <button type="button" className="tpsod2026-back" onClick={onBack || onClose} disabled={isUpdating}>
              <ChevronLeft aria-hidden="true" />
              Back to Orders
            </button>
            <div className="tpsod2026-icon-actions">
              <button type="button" disabled title="Additional actions are not enabled">
                <MoreVertical aria-hidden="true" />
              </button>
              <button type="button" onClick={onClose} disabled={isUpdating} aria-label="Close order detail">
                <X aria-hidden="true" />
              </button>
            </div>
          </div>

          {isLoading || error ? null : (
            <div className="tpsod2026-titlebar">
              <div>
                <small>Order Detail</small>
                <h2 id="tpsod2026-title">{order.reference}</h2>
                <p>
                  <Clock3 aria-hidden="true" />
                  {order.createdAtLabel}
                  <span aria-hidden="true">.</span>
                  {order.suborderNo}
                </p>
              </div>
              <StatusPill status={order.paymentStatus} />
            </div>
          )}
        </header>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState error={error} onClose={onClose} />
        ) : (
          <>
            <div className="tpsod2026-body">
              <ProgressRail steps={order.progress} />
              <div className="tpsod2026-grid">
                <CustomerBlock customer={order.customer} />
                <ItemsBlock items={order.items} />
              </div>
              <ShippingBlock shipping={order.shipping} />
              <PaymentBlock order={order} />
            </div>

            <footer className="tpsod2026-footer">
              <button
                type="button"
                onClick={onPrintLabel}
                disabled={!onPrintLabel || !order.canPrintLabel || isUpdating}
                title={order.printLabelReason}
              >
                <Printer aria-hidden="true" />
                Print Label
              </button>
              <button
                type="button"
                onClick={onMessageBuyer}
                disabled={!onMessageBuyer || !order.canMessageBuyer || isUpdating}
                title={order.canMessageBuyer ? "Message buyer" : "Buyer contact is not available"}
              >
                <MessageCircle aria-hidden="true" />
                Message Buyer
              </button>
              <button type="button" onClick={onCopyReference} disabled={!onCopyReference || isUpdating}>
                <Copy aria-hidden="true" />
                Copy Ref
              </button>
              <button type="button" onClick={onViewInvoice} disabled={!onViewInvoice || isUpdating}>
                <FileText aria-hidden="true" />
                View Invoice
                <ExternalLink aria-hidden="true" />
              </button>
              <button
                type="button"
                className="tpsod2026-primary"
                onClick={onMarkDelivered}
                disabled={!onMarkDelivered || isUpdating}
                title={onMarkDelivered ? "Mark this store suborder as delivered" : order.markDeliveredReason}
              >
                {isUpdating ? <Clock3 aria-hidden="true" /> : onMarkDelivered ? <CheckCircle2 aria-hidden="true" /> : <PackageCheck aria-hidden="true" />}
                {isUpdating ? "Updating..." : "Mark as Delivered"}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
