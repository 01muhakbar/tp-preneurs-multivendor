import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Copy,
  FileText,
  Headphones,
  MapPin,
  Package,
  PackageCheck,
  Printer,
  ReceiptText,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./account-order-detail-2026.css";
import { buildAccountOrderInvoiceModel } from "./invoice/accountOrderInvoiceAdapter.js";
import AccountOrderInvoicePrint from "./invoice/AccountOrderInvoicePrint.jsx";

function StatusBadge({ status, prefix }) {
  if (!status) return null;
  return (
    <span className={`aod-chip aod-chip--${status.tone || "neutral"}`}>
      {prefix ? <small>{prefix}</small> : null}
      {status.label}
    </span>
  );
}

function IconMetric({ icon: Icon, label, value }) {
  return (
    <div className="aod-metric">
      <span className="aod-metric__icon">
        <Icon aria-hidden="true" />
      </span>
      <span>
        <small>{label}</small>
        <strong title={value}>{value}</strong>
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <section className="aod-root aod-loading" aria-label="Loading order details">
      <div className="aod-skeleton aod-skeleton--hero" />
      <div className="aod-skeleton" />
      <div className="aod-skeleton" />
      <div className="aod-skeleton aod-skeleton--rail" />
    </section>
  );
}

function ErrorState({ error, LinkComponent, onRetry }) {
  return (
    <section className="aod-root">
      <div className="aod-state" role="alert">
        <Package aria-hidden="true" />
        <h1>Order details are unavailable</h1>
        <p>
          {error?.response?.data?.message ||
            error?.message ||
            "The latest order information could not be loaded."}
        </p>
        <div className="aod-state__actions">
          {onRetry ? (
            <button type="button" onClick={onRetry}>
              Try Again
            </button>
          ) : null}
          <LinkComponent to="/user/my-orders">Back to Orders</LinkComponent>
        </div>
      </div>
    </section>
  );
}

function EmptyInline({ children }) {
  return <p className="aod-empty">{children}</p>;
}

function OrderHero({ orderDetail, onCopy }) {
  const { order, payment, summary } = orderDetail;
  return (
    <section className="aod-card aod-hero">
      <div className="aod-card__top">
        <div>
          <h1>Order Details</h1>
          <p>Order ID</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="aod-order-code">
        <strong title={order.code}>{order.code}</strong>
        <button
          type="button"
          onClick={() => onCopy(order.code, "Order ID copied.")}
          disabled={!orderDetail.actionability.copyOrderCode.enabled}
          aria-label="Copy Order ID"
        >
          <Copy aria-hidden="true" />
        </button>
      </div>

      <div className="aod-placed">
        <CalendarDays aria-hidden="true" />
        <span>Placed on {order.placedAtDisplay}</span>
      </div>

      <div className="aod-chip-row">
        {order.statusChips.map((status) => (
          <StatusBadge key={`${status.code}-${status.label}`} status={status} />
        ))}
      </div>

      <div className="aod-stepper" aria-label="Order progress">
        {order.progress.map((step) => (
          <div
            key={step.code}
            className={step.complete ? "aod-step aod-step--complete" : "aod-step"}
          >
            <span className="aod-step__dot">
              {step.complete ? <Check aria-hidden="true" /> : <Circle aria-hidden="true" />}
            </span>
            <strong>{step.label}</strong>
            <small>{step.timestampDisplay}</small>
          </div>
        ))}
      </div>

      <div className="aod-metric-grid">
        <IconMetric icon={WalletCards} label="Payment Method" value={payment.method} />
        <IconMetric icon={ReceiptText} label="Total" value={summary.totalDisplay} />
        <IconMetric icon={FileText} label="Subtotal" value={summary.subtotalDisplay} />
        <IconMetric icon={Truck} label="Shipping" value={summary.shippingDisplay} />
      </div>
    </section>
  );
}

function ShipmentSummary({ shipment, onCopy, onTrack }) {
  const primary = shipment.primary;
  return (
    <section className="aod-card aod-shipment" id="aod-shipment-summary">
      <div className="aod-card__top">
        <div>
          <h2>Shipment Summary</h2>
          <p>Quick view</p>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      <div className="aod-shipment-quick">
        <IconMetric icon={Truck} label="Courier" value={primary.courier} />
        <div className="aod-metric">
          <span className="aod-metric__icon">
            <ReceiptText aria-hidden="true" />
          </span>
          <span>
            <small>Tracking No.</small>
            <strong title={primary.trackingNumber}>{primary.trackingNumber}</strong>
          </span>
          <button
            type="button"
            className="aod-copy-mini"
            onClick={() => onCopy(primary.trackingNumber, "Tracking number copied.")}
            disabled={!primary.trackingNumber || primary.trackingNumber === "Not assigned"}
            aria-label="Copy Tracking No."
          >
            <Copy aria-hidden="true" />
          </button>
        </div>
        <IconMetric icon={MapPin} label="Source" value={primary.source} />
        <IconMetric icon={CalendarDays} label="Delivered On" value={primary.deliveredOnDisplay} />
      </div>

      <div className="aod-timeline" id="aod-order-timeline">
        <div className="aod-timeline__head">
          <h3>Order Timeline</h3>
          <button
            type="button"
            onClick={onTrack}
            disabled={!shipment.timeline.length}
          >
            Track Order
          </button>
        </div>
        {shipment.timeline.length ? (
          shipment.timeline.map((event) => (
            <div key={event.id} className="aod-timeline__row">
              <span className={`aod-timeline__dot aod-timeline__dot--${event.tone}`} />
              <div>
                <strong>{event.label}</strong>
                <small>{event.happenedAtDisplay}</small>
              </div>
              <p>{event.note}</p>
            </div>
          ))
        ) : (
          <EmptyInline>No timeline updates yet.</EmptyInline>
        )}
      </div>
    </section>
  );
}

function StoreBreakdown({ stores }) {
  return (
    <section className="aod-card">
      <div className="aod-card__top">
        <div>
          <h2>Store Breakdown</h2>
          <p>Payment and shipment truth for each store split.</p>
        </div>
      </div>

      <div className="aod-store-list">
        {stores.length ? (
          stores.map((store) => (
            <article className="aod-store" key={store.id}>
              <span className="aod-store__icon">
                <Store aria-hidden="true" />
              </span>
              <div className="aod-store__body">
                <h3>{store.storeName}</h3>
                <p title={store.suborderNumber}>{store.suborderNumber}</p>
                <div className="aod-chip-row">
                  <StatusBadge status={store.status} prefix="Split" />
                  <StatusBadge status={store.paymentStatus} />
                  <StatusBadge status={store.shipmentStatus} prefix="Shipment" />
                </div>
                <small>Merchant: {store.merchantName}</small>
                <small>Account label: {store.accountLabel}</small>
              </div>
              <div className="aod-store__total">
                <strong>{store.totalAmountDisplay}</strong>
                <span>
                  {store.itemCount} item{store.itemCount === 1 ? "" : "s"}
                </span>
              </div>
            </article>
          ))
        ) : (
          <EmptyInline>No store split is available yet.</EmptyInline>
        )}
      </div>
    </section>
  );
}

function Items({ items }) {
  return (
    <section className="aod-card">
      <div className="aod-card__top">
        <div>
          <h2>Items</h2>
          <p>
            {items.length} item line{items.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="aod-items">
        {items.length ? (
          items.map((item) => (
            <article className="aod-item" key={item.id}>
              <div className="aod-item__image">
                {item.image ? (
                  <img src={resolveAssetUrl(item.image)} alt="" />
                ) : (
                  <Package aria-hidden="true" />
                )}
              </div>
              <div className="aod-item__copy">
                <h3>{item.name}</h3>
                <p title={item.variantLines.join(" / ")}>
                  {item.variantLines.length ? item.variantLines.join(" / ") : "Standard option"}
                </p>
              </div>
              <div className="aod-item__qty">
                {item.quantity} x {item.unitPriceDisplay}
              </div>
              <strong>{item.lineTotalDisplay}</strong>
            </article>
          ))
        ) : (
          <EmptyInline>No item details are available.</EmptyInline>
        )}
      </div>

      <div className="aod-notice">
        <PackageCheck aria-hidden="true" />
        <span>Return or help requests depend on the latest order status.</span>
      </div>
    </section>
  );
}

function RailAction({ icon: Icon, label, onClick, disabled, title }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title || label}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <ChevronRight aria-hidden="true" />
    </button>
  );
}

function OrderActions({
  orderDetail,
  onInvoice,
  onPrint,
  onTrack,
  onTimeline,
}) {
  const actions = orderDetail.actionability;
  return (
    <section className="aod-rail-card">
      <h2>Order Actions</h2>
      <RailAction
        icon={FileText}
        label="Invoice"
        onClick={() => onInvoice(actions.invoice)}
        disabled={!actions.invoice.enabled}
        title={actions.invoice.reason}
      />
      <RailAction
        icon={Truck}
        label="Track Order"
        onClick={() => onTrack(actions.track)}
        disabled={!actions.track.enabled}
        title={actions.track.reason}
      />
      <RailAction
        icon={Clock3}
        label="Order Timeline"
        onClick={onTimeline}
        disabled={!actions.timeline.enabled}
        title={actions.timeline.reason}
      />
    </section>
  );
}

function SupportCard({ onContactSupport }) {
  return (
    <section className="aod-rail-card aod-support">
      <h2>Need Help?</h2>
      <p>We are here to help you.</p>
      <button type="button" onClick={onContactSupport}>
        <Headphones aria-hidden="true" />
        <span>Contact Support</span>
      </button>
    </section>
  );
}

function OrderSummary({ orderDetail }) {
  const { summary, payment } = orderDetail;
  return (
    <section className="aod-rail-card aod-summary" id="aod-order-summary">
      <h2>Order Summary</h2>
      <dl>
        <div>
          <dt>Subtotal</dt>
          <dd>{summary.subtotalDisplay}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{summary.shippingDisplay}</dd>
        </div>
        <div>
          <dt>Discount</dt>
          <dd>{summary.discountDisplay}</dd>
        </div>
        <div className="aod-summary__total">
          <dt>Total</dt>
          <dd>{summary.totalDisplay}</dd>
        </div>
      </dl>
      <StatusBadge status={payment.status} />
    </section>
  );
}

export default function AccountOrderDetail2026View({
  orderDetail,
  isLoading,
  error,
  LinkComponent,
  onPrint,
  onInvoice,
  onTrack,
  onTimeline,
  onContactSupport,
  onCopy,
  onRetry,
  rawOrder,
  groupedOrder,
  user,
}) {
  const { theme, resolvedTheme } = useTheme();

  if (isLoading) return <LoadingState />;
  if (error || !orderDetail) {
    return (
      <ErrorState
        error={error}
        LinkComponent={LinkComponent}
        onRetry={onRetry}
      />
    );
  }

  const invoiceData = rawOrder
    ? buildAccountOrderInvoiceModel({ order: rawOrder, groupedOrder, user })
    : null;

  return (
    <>
      <section
      className="aod-root"
      data-theme-preference={theme}
      data-resolved-theme={resolvedTheme}
    >
      <nav className="aod-breadcrumb" aria-label="Breadcrumb">
        <LinkComponent to="/user/my-orders">My Orders</LinkComponent>
        <ChevronRight aria-hidden="true" />
        <span>Order Details</span>
      </nav>

      <div className="aod-layout">
        <div className="aod-main">
          <OrderHero orderDetail={orderDetail} onCopy={onCopy} />
          <ShipmentSummary
            shipment={orderDetail.shipment}
            onCopy={onCopy}
            onTrack={() => onTrack(orderDetail.actionability.track)}
          />
          <StoreBreakdown stores={orderDetail.storeBreakdown} />
          <Items items={orderDetail.items} />
          <LinkComponent className="aod-back" to="/user/my-orders">
            <ArrowLeft aria-hidden="true" />
            Back to Orders
          </LinkComponent>
        </div>

        <aside className="aod-rail">
          <OrderActions
            orderDetail={orderDetail}
            onInvoice={onInvoice}
            onPrint={onPrint}
            onTrack={onTrack}
            onTimeline={onTimeline}
          />
          <SupportCard onContactSupport={onContactSupport} />
          <OrderSummary orderDetail={orderDetail} />
        </aside>
      </div>
    </section>
    <AccountOrderInvoicePrint invoiceData={invoiceData} themeMode={resolvedTheme} />
    </>
  );
}
