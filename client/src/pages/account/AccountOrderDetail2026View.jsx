import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  FileText,
  Headphones,
  MapPin,
  Package,
  Printer,
  ReceiptText,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";
import { formatCurrency } from "../../utils/format.js";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./account-order-detail-2026.css";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

function StatusBadge({ status, prefix }) {
  return (
    <span className={`tpo2026-status tpo2026-status--${status.tone}`}>
      {prefix ? <small>{prefix}</small> : null}
      {status.label}
    </span>
  );
}

function LoadingState() {
  return (
    <section className="tpo2026-root tpo2026-loading" aria-label="Loading order details">
      <span />
      <span />
      <span />
      <span />
    </section>
  );
}

function ErrorState({ error, LinkComponent }) {
  return (
    <section className="tpo2026-root">
      <div className="tpo2026-state" role="alert">
        <Package aria-hidden="true" />
        <h1>Order details are unavailable</h1>
        <p>
          {error?.response?.data?.message ||
            error?.message ||
            "The latest order information could not be loaded."}
        </p>
        <LinkComponent to="/user/my-orders">Back to orders</LinkComponent>
      </div>
    </section>
  );
}

function ShipmentSummary({ shipments, shipmentStatus }) {
  const primary = shipments[0] || null;
  const timeline = shipments.flatMap((shipment) => shipment.events).slice(0, 4);

  return (
    <section className="tpo2026-section" id="tpo2026-order-timeline">
      <div className="tpo2026-section__heading">
        <div>
          <h2>Shipment Summary</h2>
          <p>{shipments.length} shipment record{shipments.length === 1 ? "" : "s"}</p>
        </div>
        <StatusBadge status={primary?.status || shipmentStatus} />
      </div>
      <div className="tpo2026-shipment-grid">
        <div>
          <WalletCards aria-hidden="true" />
          <span><small>Source</small><strong>{primary?.source || "Not available"}</strong></span>
        </div>
        <div>
          <Truck aria-hidden="true" />
          <span><small>Courier</small><strong>{primary?.courier || "Pending assignment"}</strong></span>
        </div>
        <div>
          <MapPin aria-hidden="true" />
          <span><small>Tracking</small><strong>{primary?.trackingNumber || "Not assigned"}</strong></span>
        </div>
        <div>
          <Clock3 aria-hidden="true" />
          <span><small>Status</small><strong>{primary?.status.label || shipmentStatus.label}</strong></span>
        </div>
      </div>
      {timeline.length ? (
        <div className="tpo2026-timeline">
          <h3>Tracking timeline</h3>
          {timeline.map((event) => (
            <div key={event.id}>
              <i />
              <span>
                <strong>{event.status.label}</strong>
                <small>{event.note}</small>
              </span>
              <time>{formatDateTime(event.happenedAt)}</time>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function StoreBreakdown({ stores }) {
  return (
    <section className="tpo2026-section">
      <div className="tpo2026-section__heading">
        <div>
          <h2>Store Breakdown</h2>
          <p>Payment and shipment truth for each store split.</p>
        </div>
      </div>
      <div className="tpo2026-stores">
        {stores.map((store) => (
          <article key={store.id}>
            <div className="tpo2026-store-icon"><Store aria-hidden="true" /></div>
            <div className="tpo2026-store-copy">
              <h3>{store.storeName}</h3>
              <p title={store.suborderNumber}>{store.suborderNumber}</p>
              <div>
                <StatusBadge status={store.status} prefix="Split" />
                <StatusBadge status={store.paymentStatus} prefix="Payment" />
                <StatusBadge status={store.shipmentStatus} prefix="Shipment" />
              </div>
              <small>Merchant: {store.merchantName}</small>
              <small>Account label: {store.accountLabel}</small>
            </div>
            <div className="tpo2026-store-total">
              <strong>{formatCurrency(store.totalAmount)}</strong>
              <span>{store.itemCount} item{store.itemCount === 1 ? "" : "s"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Items({ items }) {
  return (
    <section className="tpo2026-section">
      <div className="tpo2026-section__heading">
        <div>
          <h2>Items</h2>
          <p>{items.length} item line{items.length === 1 ? "" : "s"}</p>
        </div>
      </div>
      <div className="tpo2026-items">
        {items.length ? items.map((item) => (
          <article key={item.id}>
            <div className="tpo2026-item-image">
              {item.image ? (
                <img src={resolveAssetUrl(item.image)} alt="" />
              ) : (
                <Package aria-hidden="true" />
              )}
            </div>
            <div className="tpo2026-item-copy">
              <h3>{item.name}</h3>
              {item.variantLines.length ? (
                <p title={item.variantLines.join(" · ")}>{item.variantLines.join(" · ")}</p>
              ) : (
                <p>Standard option</p>
              )}
            </div>
            <div className="tpo2026-item-quantity">
              {item.quantity} × {formatCurrency(item.unitPrice)}
            </div>
            <strong>{formatCurrency(item.lineTotal)}</strong>
          </article>
        )) : (
          <p className="tpo2026-muted">No item details are available.</p>
        )}
      </div>
    </section>
  );
}

function OrderActions({
  orderDetail,
  LinkComponent,
  onPrint,
  onViewInvoice,
  onContactSupport,
}) {
  return (
    <section className="tpo2026-side-card">
      <h2>Order Actions</h2>
      <button type="button" onClick={onViewInvoice}>
        <FileText aria-hidden="true" /> View Invoice
      </button>
      <button type="button" onClick={onPrint}>
        <Printer aria-hidden="true" /> Print Order
      </button>
      <a href="#tpo2026-order-timeline">
        <Clock3 aria-hidden="true" /> Order Timeline
      </a>
      {orderDetail.paymentAction ? (
        <LinkComponent to={orderDetail.paymentAction.path}>
          <WalletCards aria-hidden="true" /> {orderDetail.paymentAction.label}
        </LinkComponent>
      ) : null}
      <button type="button" onClick={onContactSupport}>
        <Headphones aria-hidden="true" /> Contact Support
      </button>
    </section>
  );
}

function OrderSummary({ orderDetail }) {
  const { totals } = orderDetail;
  return (
    <section className="tpo2026-side-card" id="tpo2026-order-summary">
      <h2>Order Summary</h2>
      <dl>
        <div><dt>Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
        <div><dt>Shipping</dt><dd>{formatCurrency(totals.shipping)}</dd></div>
        <div><dt>Discount</dt><dd>{formatCurrency(totals.discount)}</dd></div>
        <div className="tpo2026-summary-total">
          <dt>Total</dt><dd>{formatCurrency(totals.total)}</dd>
        </div>
      </dl>
      <StatusBadge status={orderDetail.paymentStatus} prefix="Parent" />
    </section>
  );
}

export default function AccountOrderDetail2026View({
  orderDetail,
  isLoading,
  error,
  LinkComponent,
  onPrint,
  onViewInvoice,
  onContactSupport,
}) {
  if (isLoading) return <LoadingState />;
  if (error || !orderDetail) return <ErrorState error={error} LinkComponent={LinkComponent} />;

  return (
    <section className="tpo2026-root">
      <nav className="tpo2026-breadcrumb" aria-label="Breadcrumb">
        <LinkComponent to="/user/my-orders">My Orders</LinkComponent>
        <span>/</span>
        <span>Order Details</span>
      </nav>

      <div className="tpo2026-layout">
        <div className="tpo2026-main">
          <section className="tpo2026-hero">
            <p>Order</p>
            <h1 title={orderDetail.reference}>{orderDetail.reference}</h1>
            <div className="tpo2026-placed">
              <CalendarDays aria-hidden="true" />
              Placed on {formatDateTime(orderDetail.placedAt)}
            </div>
            <div className="tpo2026-hero-statuses">
              <span>{orderDetail.checkoutMode}</span>
              <StatusBadge status={orderDetail.orderStatus} />
              <StatusBadge status={orderDetail.paymentStatus} prefix="Parent" />
            </div>
            {orderDetail.paymentSummary ? <small>{orderDetail.paymentSummary}</small> : null}

            <div className="tpo2026-metrics">
              <div><WalletCards /><span><small>Payment</small><strong>{orderDetail.paymentMethod}</strong></span></div>
              <div><ReceiptText /><span><small>Total</small><strong>{formatCurrency(orderDetail.totals.total)}</strong></span></div>
              <div><FileText /><span><small>Subtotal</small><strong>{formatCurrency(orderDetail.totals.subtotal)}</strong></span></div>
              <div><Truck /><span><small>Shipping</small><strong>{formatCurrency(orderDetail.totals.shipping)}</strong></span></div>
            </div>
          </section>

          <ShipmentSummary
            shipments={orderDetail.shipments}
            shipmentStatus={orderDetail.shipmentStatus}
          />
          <StoreBreakdown stores={orderDetail.stores} />
          <Items items={orderDetail.items} />

          <LinkComponent className="tpo2026-back" to="/user/my-orders">
            <ArrowLeft aria-hidden="true" /> Back to orders
          </LinkComponent>
        </div>

        <aside className="tpo2026-sidebar">
          <OrderActions
            orderDetail={orderDetail}
            LinkComponent={LinkComponent}
            onPrint={onPrint}
            onViewInvoice={onViewInvoice}
            onContactSupport={onContactSupport}
          />
          <section className="tpo2026-side-card tpo2026-support">
            <h2>Support</h2>
            <strong>Need help?</strong>
            <p>We are here to assist with this order.</p>
            <button type="button" onClick={onContactSupport}>
              <Headphones aria-hidden="true" /> Contact Support
            </button>
          </section>
          <OrderSummary orderDetail={orderDetail} />
        </aside>
      </div>
    </section>
  );
}
