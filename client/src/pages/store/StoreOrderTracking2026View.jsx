import {
  ArrowLeft,
  Box,
  Check,
  CircleHelp,
  Download,
  Info,
  Mail,
  MapPin,
  Package,
  Printer,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./store-order-tracking-2026.css";

function StatusPill({ status }) {
  return (
    <span className={`tpord2026-pill tpord2026-pill--${status?.tone || "slate"}`}>
      {status?.label || "Not set"}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="tpord2026-page">
      <div className="tpord2026-skeleton tpord2026-skeleton--hero" />
      <div className="tpord2026-layout">
        <div className="tpord2026-skeleton tpord2026-skeleton--tall" />
        <div className="tpord2026-skeleton tpord2026-skeleton--tall" />
      </div>
    </div>
  );
}

function ErrorState({ error, Link }) {
  return (
    <section className="tpord2026-state">
      <CircleHelp aria-hidden="true" />
      <h1>Order tracking unavailable</h1>
      <p>
        {error?.response?.data?.message ||
          error?.message ||
          "Check the public order reference and try again."}
      </p>
      <Link to="/">
        <ArrowLeft aria-hidden="true" />
        Back to Home
      </Link>
    </section>
  );
}

function Progress({ steps, status }) {
  return (
    <section className="tpord2026-card tpord2026-progress-card">
      <header>
        <div>
          <span aria-hidden="true"><Package /></span>
          <div>
            <h2>Delivery Progress</h2>
            <p>Track every stage of this order</p>
          </div>
        </div>
        <StatusPill status={status} />
      </header>
      <div className="tpord2026-progress">
        {steps.map((step) => {
          const Icon =
            step.code === "SHIPPING"
              ? Truck
              : step.code === "DELIVERED"
                ? ShieldCheck
                : step.complete
                  ? Check
                  : Box;
          return (
            <article
              key={step.code}
              className={step.complete ? "is-complete" : step.active ? "is-active" : ""}
            >
              <span aria-hidden="true"><Icon /></span>
              <strong>{step.label}</strong>
              <small>{step.dateLabel}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShipmentCard({ shipment }) {
  return (
    <article className="tpord2026-shipment">
      <header>
        <div>
          <span aria-hidden="true"><Truck /></span>
          <div>
            <strong>{shipment.storeName}</strong>
            <small>{shipment.suborderNumber}</small>
            <small>Items: {shipment.itemCount}</small>
          </div>
        </div>
        <StatusPill status={shipment.status} />
      </header>
      <div className="tpord2026-shipment__body">
        <dl>
          <div><dt>Source</dt><dd>{shipment.sourceLabel}</dd></div>
          <div><dt>Tracking Number</dt><dd>{shipment.trackingNumber}</dd></div>
          <div><dt>Courier</dt><dd>{shipment.courier}</dd></div>
        </dl>
        <ol>
          {shipment.timeline.length ? (
            shipment.timeline.map((event) => (
              <li key={event.id}>
                <i aria-hidden="true" />
                <div>
                  <strong>{event.label}</strong>
                  <small>{event.happenedAtLabel}</small>
                  {event.description ? <p>{event.description}</p> : null}
                </div>
              </li>
            ))
          ) : (
            <li>
              <i aria-hidden="true" />
              <div>
                <strong>Waiting for tracking update</strong>
                <small>Not set</small>
              </div>
            </li>
          )}
        </ol>
      </div>
    </article>
  );
}

function ItemsTable({ items }) {
  return (
    <section className="tpord2026-card tpord2026-items">
      <header>
        <span aria-hidden="true"><Package /></span>
        <h2>Order Items</h2>
      </header>
      <div className="tpord2026-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Variant</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr key={item.id}>
                <td>
                  <span className="tpord2026-product">
                    <span aria-hidden="true">
                      {item.imageUrl ? <img src={resolveAssetUrl(item.imageUrl)} alt="" /> : <Box />}
                    </span>
                    <strong>{item.name}</strong>
                  </span>
                </td>
                <td>{item.variant}</td>
                <td>{item.quantity}</td>
                <td>{item.priceLabel}</td>
                <td>{item.subtotalLabel}</td>
              </tr>
            )) : (
              <tr><td colSpan={5}>No items found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StoreOrderTracking2026View({
  tracking,
  isLoading = false,
  error = null,
  isDownloading = false,
  downloadError = "",
  LinkComponent = "a",
  onDownloadInvoice,
  onPrintInvoice,
  onEmailSupport,
  onWhatsAppSupport,
}) {
  const Link = LinkComponent;
  if (isLoading) return <LoadingState />;
  if (error || !tracking) return <ErrorState error={error} Link={Link} />;

  return (
    <div className="tpord2026-page" data-public-order-tracking-2026="true">
      <div className="tpord2026-topline">
        <Link to="/"><ArrowLeft aria-hidden="true" /> Back to Home</Link>
        <span>Order Date: {tracking.createdAtLabel}</span>
      </div>

      <section className="tpord2026-hero">
        <div className="tpord2026-hero__main">
          <div className="tpord2026-title">
            <h1>Order #{tracking.reference}</h1>
            <StatusPill status={tracking.status} />
          </div>
          <p>{tracking.status.description}</p>
          <div className="tpord2026-facts">
            <div><WalletCards aria-hidden="true" /><span><small>Payment Method</small><strong>{tracking.payment.method}</strong></span></div>
            <div><Check aria-hidden="true" /><span><small>Payment Status</small><strong>{tracking.payment.label}</strong></span></div>
            <div><Truck aria-hidden="true" /><span><small>Shipment Status</small><strong>{tracking.shipment.countLabel}</strong></span></div>
            <div><Package aria-hidden="true" /><span><small>Total Amount</small><strong>{tracking.totals.totalLabel}</strong></span></div>
          </div>
        </div>
        <aside>
          <ShieldCheck aria-hidden="true" />
          <strong>We will keep you updated</strong>
          <span>Keep this page for the latest backend tracking status.</span>
        </aside>
      </section>

      <div className="tpord2026-layout">
        <main>
          <Progress steps={tracking.progress} status={tracking.status} />

          <section className="tpord2026-card">
            <header>
              <span aria-hidden="true"><Truck /></span>
              <div>
                <h2>Store Shipments ({tracking.shipments.length})</h2>
                <p>Shipping truth stays scoped per store shipment</p>
              </div>
            </header>
            <div className="tpord2026-shipment-list">
              {tracking.shipments.length ? tracking.shipments.map((shipment) => (
                <ShipmentCard shipment={shipment} key={shipment.id} />
              )) : <p className="tpord2026-empty">No persisted shipment is available yet.</p>}
            </div>
          </section>

          <ItemsTable items={tracking.items} />
        </main>

        <aside className="tpord2026-side">
          <section className="tpord2026-card">
            <header><span aria-hidden="true"><Truck /></span><h2>Shipping Information</h2></header>
            <dl className="tpord2026-details">
              <div><dt>Shipping Status</dt><dd>{tracking.shipment.label}</dd></div>
              <div><dt>Latest Information</dt><dd>{tracking.shipment.description}</dd></div>
            </dl>
            <p className="tpord2026-info"><Info aria-hidden="true" /> Tracking remains read-only.</p>
          </section>

          <section className="tpord2026-card">
            <header><span aria-hidden="true"><MapPin /></span><h2>Delivery Address</h2></header>
            <div className="tpord2026-address">
              <strong>{tracking.customer.name}</strong>
              {tracking.customer.phone ? <span>{tracking.customer.phone}</span> : null}
              {tracking.customer.email ? <span>{tracking.customer.email}</span> : null}
              <p>{tracking.customer.address}</p>
            </div>
          </section>

          <section className="tpord2026-card">
            <header><span aria-hidden="true"><WalletCards /></span><h2>Payment Information</h2></header>
            <dl className="tpord2026-details">
              <div><dt>Status</dt><dd><StatusPill status={tracking.payment} /></dd></div>
              <div><dt>Method</dt><dd>{tracking.payment.method}</dd></div>
              <div><dt>Visibility</dt><dd>Read-only</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      <section className="tpord2026-card tpord2026-summary">
        <header><span aria-hidden="true"><WalletCards /></span><h2>Order Summary</h2></header>
        <dl>
          <div><dt>Payment Method</dt><dd>{tracking.payment.method}</dd></div>
          <div><dt>Shipping</dt><dd>{tracking.totals.shippingLabel}</dd></div>
          <div><dt>Service Fee</dt><dd>{tracking.totals.serviceFeeLabel}</dd></div>
          <div><dt>Discount</dt><dd>{tracking.totals.discountLabel}</dd></div>
          <div><dt>Total Amount</dt><dd>{tracking.totals.totalLabel}</dd></div>
        </dl>
        {downloadError ? <p className="tpord2026-error">{downloadError}</p> : null}
        <div className="tpord2026-summary__footer">
          <p><ShieldCheck aria-hidden="true" /><span><strong>Thank You!</strong>Your order has been received and is being processed.</span></p>
          <div>
            <button type="button" onClick={onDownloadInvoice} disabled={isDownloading}>
              <Download aria-hidden="true" />
              {isDownloading ? "Preparing PDF..." : "Download Invoice"}
            </button>
            <button type="button" className="tpord2026-primary" onClick={onPrintInvoice}>
              <Printer aria-hidden="true" />
              Print Invoice
            </button>
          </div>
        </div>
      </section>

      <footer className="tpord2026-help">
        <span>Need help? Contact our support team</span>
        <div>
          <button type="button" onClick={onEmailSupport}><Mail aria-hidden="true" /> Email Us</button>
          <button type="button" onClick={onWhatsAppSupport}><CircleHelp aria-hidden="true" /> WhatsApp</button>
        </div>
      </footer>
    </div>
  );
}
