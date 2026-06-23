import React from "react";
import {
  ArrowLeft,
  Box,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  LockKeyhole,
  Package,
  Printer,
  Search,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./seller-suborder-detail-2026.css";

function StatusPill({ status }) {
  return (
    <span className={`tpsodp2026-pill tpsodp2026-pill--${status?.tone || "slate"}`}>
      <i aria-hidden="true" />
      {status?.label || "-"}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="tpsodp2026-page">
      <div className="tpsodp2026-skeleton tpsodp2026-skeleton--hero" />
      <div className="tpsodp2026-summary-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="tpsodp2026-skeleton" key={item} />
        ))}
      </div>
      <div className="tpsodp2026-skeleton tpsodp2026-skeleton--wide" />
    </div>
  );
}

function ErrorState({ error, onBack }) {
  return (
    <section className="tpsodp2026-state">
      <ClipboardList aria-hidden="true" />
      <h2>Unable to load suborder detail</h2>
      <p>
        {error?.response?.data?.message ||
          error?.message ||
          "This seller suborder is not available for the active store."}
      </p>
      <button type="button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        Back to Orders
      </button>
    </section>
  );
}

function ProgressRail({ steps }) {
  return (
    <section className="tpsodp2026-progress" aria-label="Fulfillment progress">
      {steps.map((step) => {
        const Icon =
          step.code === "SHIPPED"
            ? Truck
            : step.code === "PACKED"
              ? Package
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
            <small>{step.dateLabel || "Pending"}</small>
          </article>
        );
      })}
    </section>
  );
}

function InfoCard({ icon: Icon, title, children }) {
  return (
    <section className="tpsodp2026-card">
      <header>
        <span aria-hidden="true"><Icon /></span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function ItemsTable({ items }) {
  return (
    <section className="tpsodp2026-card tpsodp2026-items">
      <header>
        <span aria-hidden="true"><Package /></span>
        <h2>Items</h2>
      </header>
      <div className="tpsodp2026-table-wrap">
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
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="tpsodp2026-product">
                      <span aria-hidden="true">
                        {item.imageUrl ? (
                          <img src={resolveAssetUrl(item.imageUrl)} alt="" />
                        ) : (
                          <Box />
                        )}
                      </span>
                      <strong>{item.name}</strong>
                    </span>
                  </td>
                  <td>{item.variantLabel}</td>
                  <td>{item.quantity}</td>
                  <td>{item.priceLabel}</td>
                  <td>{item.subtotalLabel}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>No item snapshot available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Timeline({ items }) {
  return (
    <InfoCard icon={CalendarDays} title="Shipment Timeline">
      <ol className="tpsodp2026-timeline">
        {items.map((item) => (
          <li className={item.complete ? "is-complete" : ""} key={item.id}>
            <i aria-hidden="true" />
            <div>
              <strong>{item.label}</strong>
              <span>{item.createdAtLabel}</span>
              {item.description ? <p>{item.description}</p> : null}
            </div>
          </li>
        ))}
      </ol>
    </InfoCard>
  );
}

function FulfillmentSection({
  order,
  draft,
  isUpdating,
  onDraftChange,
  onMarkPacked,
  onMarkShipped,
  onMarkDelivered,
  onPrintReceipt,
}) {
  const changeField = (field) => (event) => onDraftChange?.(field, event.target.value);
  return (
    <section className="tpsodp2026-card tpsodp2026-fulfillment">
      <header>
        <span aria-hidden="true"><Truck /></span>
        <h2>Fulfillment & Shipment</h2>
      </header>
      <div className="tpsodp2026-fields">
        <label>
          <span>Tracking Number</span>
          <input
            value={draft?.trackingNumber || ""}
            onChange={changeField("trackingNumber")}
            placeholder="Input tracking number"
          />
        </label>
        <label>
          <span>Shipping Provider</span>
          <input
            value={draft?.shippingProvider || ""}
            onChange={changeField("shippingProvider")}
            placeholder="JNE"
          />
        </label>
        <label>
          <span>Courier Service</span>
          <input
            value={draft?.courierService || ""}
            onChange={changeField("courierService")}
            placeholder="REG"
          />
        </label>
      </div>
      <ProgressRail steps={order.progress} />
      <div className="tpsodp2026-actions">
        <button
          type="button"
          className="tpsodp2026-primary"
          onClick={onMarkPacked}
          disabled={!onMarkPacked || isUpdating}
          title={onMarkPacked ? "Mark this suborder as packed" : order.actions.markPackedReason}
        >
          <CheckCircle2 aria-hidden="true" />
          Mark as Packed
        </button>
        <button type="button" onClick={onPrintReceipt} disabled={isUpdating}>
          <Printer aria-hidden="true" />
          Print Receipt
        </button>
        <button
          type="button"
          onClick={onMarkShipped}
          disabled={!onMarkShipped || isUpdating}
          title={onMarkShipped ? "Mark this suborder as shipped" : order.actions.markShippedReason}
        >
          <Truck aria-hidden="true" />
          Mark as Shipped
        </button>
        <button
          type="button"
          onClick={onMarkDelivered}
          disabled={!onMarkDelivered || isUpdating}
          title={onMarkDelivered ? "Mark this suborder as delivered" : order.actions.markDeliveredReason}
        >
          <CheckCircle2 aria-hidden="true" />
          Mark as Delivered
        </button>
      </div>
    </section>
  );
}
function InternalNotes({
  internalNoteDraft,
  onInternalNoteChange,
  onSaveInternalNote,
  isUpdating,
}) {
  return (
    <section className="tpsodp2026-card tpsodp2026-notes">
      <header>
        <span aria-hidden="true"><ClipboardList /></span>
        <h2>Internal Notes</h2>
      </header>
      <div className="tpsodp2026-notes-inner">
        <label>
          <span className="tpsodp2026-sr-only">Private note</span>
          <textarea
            value={internalNoteDraft || ""}
            onChange={(e) => onInternalNoteChange?.(e.target.value)}
            placeholder="Add note..."
            rows={4}
          />
        </label>
        <div className="tpsodp2026-notes-actions">
          <button
            type="button"
            className="tpsodp2026-primary s26-btn-small"
            onClick={onSaveInternalNote}
            disabled={isUpdating}
          >
            Save
          </button>
        </div>
      </div>
    </section>
  );
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "items", label: "Items" },
  { id: "fulfillment", label: "Fulfillment" },
  { id: "timeline", label: "Timeline" },
  { id: "notes", label: "Internal Notes" },
];

export default function SellerSuborderDetail2026PageView({
  order,
  store,
  isLoading = false,
  error = null,
  isUpdating = false,
  LinkComponent = "a",
  searchQuery = "",
  fulfillmentDraft = {},
  notice = null,
  onSearchChange,
  onCopyReference,
  onBack,
  onPrintReceipt,
  onFulfillmentDraftChange,
  onMarkPacked,
  onMarkShipped,
  onMarkDelivered,
  internalNoteDraft = "",
  onInternalNoteChange,
  onSaveInternalNote,
}) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const Link = LinkComponent;

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onBack={onBack} />;
  if (!order) return <ErrorState error={null} onBack={onBack} />;

  return (
    <div className="tpsodp2026-page" data-seller2026-live-order-detail="true">
      <span className="tpsodp2026-sr-only">Store-scoped order detail</span>
      <span className="tpsodp2026-sr-only s26-card soft">
        Payment <strong>Read-only</strong>
      </span>

      {notice ? (
        <p className={`tpsodp2026-notice tpsodp2026-notice--${notice.type || "info"}`}>
          {notice.text}
        </p>
      ) : null}

      <header className="tpsodp2026-hero">
        <div>
          <p>Order Details</p>
          <h1>{order.reference}</h1>
          <small>
            <CalendarDays aria-hidden="true" />
            {order.createdAtLabel}
            <span aria-hidden="true">.</span>
            {order.scopeLabel}
          </small>
        </div>
        <div className="tpsodp2026-hero__chips">
          <StatusPill status={order.paymentStatus} />
          <StatusPill status={order.readinessStatus} />
          <span className="tpsodp2026-lock"><LockKeyhole aria-hidden="true" /> {order.payment.readOnlyReason}</span>
        </div>
      </header>

      <section className="tpsodp2026-reference">
        <div>
          <span>Order Reference</span>
          <strong>{order.reference}</strong>
        </div>
        <div className="tpsodp2026-reference-actions">
          <button type="button" onClick={onCopyReference} className="s26-btn-outline">
            <Copy aria-hidden="true" />
            Copy
          </button>
          <Link to={order.ordersPath} className="s26-btn-outline">
            <ArrowLeft aria-hidden="true" />
            Orders
          </Link>
        </div>
      </section>

      <div className="tpsodp2026-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tpsodp2026-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tpsodp2026-tab-content">
        {activeTab === "overview" && (
          <div className="tpsodp2026-summary-grid">
            <InfoCard icon={UserRound} title="Customer">
              <div className="tpsodp2026-stack">
                <strong>{order.customer.name}</strong>
                <span>{order.customer.phone || order.customer.email || "-"}</span>
                <p>{order.customer.address}</p>
              </div>
            </InfoCard>

            <InfoCard icon={Truck} title="Shipping">
              <div className="tpsodp2026-stack">
                <StatusPill status={{ label: order.shipping.status, tone: order.shipping.statusTone }} />
                <span>Tracking: {order.shipping.trackingLabel}</span>
                <span>Courier: {order.shipping.courier || "-"}</span>
              </div>
            </InfoCard>

            <InfoCard icon={WalletCards} title="Payment">
              <div className="tpsodp2026-stack">
                <span>Status: <StatusPill status={order.paymentStatus} /></span>
                <span>Method: {order.payment.method}</span>
                <span>Proof: {order.payment.proof}</span>
                <span className="tpsodp2026-lock"><LockKeyhole aria-hidden="true" /> {order.payment.readOnlyReason}</span>
              </div>
            </InfoCard>

            <InfoCard icon={FileText} title="Cost Summary">
              <dl className="tpsodp2026-costs">
                <div><dt>Subtotal</dt><dd>{order.totals.subtotalLabel}</dd></div>
                <div><dt>Shipping</dt><dd>{order.totals.shippingFeeLabel}</dd></div>
                <div><dt>Service</dt><dd>{order.totals.serviceFeeLabel}</dd></div>
                <div><dt>Discount</dt><dd>{order.totals.discountLabel}</dd></div>
                <div><dt>Total</dt><dd>{order.totals.totalLabel}</dd></div>
              </dl>
            </InfoCard>
          </div>
        )}

        {activeTab === "items" && <ItemsTable items={order.items} />}

        {activeTab === "fulfillment" && (
          <FulfillmentSection
            order={order}
            draft={fulfillmentDraft}
            isUpdating={isUpdating}
            onDraftChange={onFulfillmentDraftChange}
            onMarkPacked={onMarkPacked}
            onMarkShipped={onMarkShipped}
            onMarkDelivered={onMarkDelivered}
            onPrintReceipt={onPrintReceipt}
          />
        )}

        {activeTab === "timeline" && <Timeline items={order.timeline} />}

        {activeTab === "notes" && (
          <InternalNotes
            internalNoteDraft={internalNoteDraft}
            onInternalNoteChange={onInternalNoteChange}
            onSaveInternalNote={onSaveInternalNote}
            isUpdating={isUpdating}
          />
        )}
      </div>
    </div>
  );
}
