import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Box,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileText,
  MapPin,
  MessageCircle,
  MoreVertical,
  PackageCheck,
  Printer,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useSeller2026SuborderDetail } from "../../../hooks/seller2026/useSeller2026SuborderDetail.ts";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const tone = (value) => {
  const normalized = String(value || "").toUpperCase();
  if (normalized.includes("PAID") || normalized.includes("DELIVER")) return "green";
  if (normalized.includes("SHIP") || normalized.includes("TRANSIT")) return "blue";
  if (normalized.includes("PROCESS")) return "violet";
  if (normalized.includes("PENDING") || normalized.includes("UNPAID") || normalized.includes("UNFULFILLED")) return "amber";
  return "slate";
};

const label = (value) => String(value || "New").replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

function Chip({ value, children }) {
  return <span className={`s26-order-chip is-${tone(value)}`}><i />{children || label(value)}</span>;
}

export default function Seller2026OrderDetailDrawer({
  open,
  storeId,
  suborderId,
  canFulfill,
  onClose,
  onUpdated,
}) {
  const { workspaceStoreSlug } = useSellerWorkspaceRoute();
  const detail = useSeller2026SuborderDetail(storeId, suborderId, {
    enabled: open,
    permissions: { canFulfill },
  });

  if (!open) return null;

  const data = detail.data;
  const order = data.suborder;
  const deliveredAction = order?.fulfillmentActions?.find(
    (action) => action.code === "MARK_DELIVERED" && action.enabled !== false
  );
  const isUpdating = Boolean(detail.updatingStatusId);
  const steps = [
    { code: "NEW", label: "New", active: true },
    { code: "PAID", label: "Paid", active: !["UNPAID", "PENDING_CONFIRMATION"].includes(order?.paymentStatus) },
    { code: "PROCESSING", label: "Packed", active: ["PROCESSING", "SHIPPED", "DELIVERED"].includes(order?.status) },
    { code: "SHIPPED", label: "Shipped", active: ["SHIPPED", "DELIVERED"].includes(order?.status) },
    { code: "DELIVERED", label: "Delivered", active: order?.status === "DELIVERED" },
  ];

  const markDelivered = async () => {
    if (!deliveredAction || isUpdating) return;
    try {
      await detail.updateFulfillmentStatus({ payload: { action: "MARK_DELIVERED" } });
      onUpdated?.();
    } catch {
      // The mutation exposes its error below so the drawer can remain open for recovery.
    }
  };

  return (
    <div className="s26-order-drawer" role="dialog" aria-modal="true" aria-labelledby="s26-order-drawer-title">
      <button type="button" className="s26-order-drawer__backdrop" aria-label="Dismiss order detail" disabled={isUpdating} onClick={onClose} />
      <aside className="s26-order-drawer__panel">
        <header>
          <div><small>Order Detail</small><h2 id="s26-order-drawer-title">{order?.orderNumber || "Order"}</h2><p><Clock3 size={13} />Created {dateTime(order?.createdAt)} - Store-scoped suborder</p></div>
          <div><button type="button" disabled title="Additional order actions are not enabled"><MoreVertical size={18} /></button><button type="button" aria-label="Close order detail" disabled={isUpdating} onClick={onClose}><X size={19} /></button></div>
        </header>

        {detail.isLoading ? (
          <div className="s26-order-drawer__loading"><span /><span /><span /></div>
        ) : detail.isError || !order ? (
          <div className="s26-order-drawer__error"><AlertTriangle size={22} /><h3>Unable to load order detail</h3><p>{detail.error?.message || "This suborder may no longer be available to the active store."}</p><button type="button" onClick={() => detail.refetch()}>Retry</button></div>
        ) : (
          <>
            <div className="s26-order-drawer__body">
              <section className="s26-order-drawer-status">
                <div><Chip value={order.paymentStatus} /><Chip value={order.status} /><Chip value={order.shippingStatus}>{order.shippingStatus}</Chip></div>
                <ol>
                  {steps.map((step, index) => (
                    <li className={step.active ? "is-active" : ""} key={step.code}>
                      <span>{step.active ? <Check size={16} /> : index === 3 ? <Truck size={15} /> : <Box size={15} />}</span>
                      <small>{step.label}</small>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="s26-order-drawer-card">
                <h3>A. Customer</h3>
                <div className="s26-order-customer">
                  <span><UserRound size={20} /></span>
                  <div><strong>{data.customer?.name || "Customer"}</strong><small>{data.customer?.phone || data.customer?.email || "-"}</small><small><MapPin size={12} />{data.customer?.address || "No shipping address available."}</small></div>
                </div>
              </section>

              <section className="s26-order-drawer-card">
                <h3>B. Items ({data.items.length})</h3>
                <div className="s26-order-detail-items">
                  {data.items.map((item) => (
                    <article key={item.id}>
                      <span>{item.imageUrl ? <img src={resolveAssetUrl(item.imageUrl)} alt="" /> : <Box size={20} />}</span>
                      <div><strong>{item.productName}</strong><small>{item.variantLabel || "Standard item"}</small></div>
                      <b>{item.quantity}</b><em>{money(item.price)}</em><strong>{money(item.subtotal)}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="s26-order-drawer-card">
                <h3>C. Shipping / Courier</h3>
                <div className="s26-order-shipping">
                  <div><span><Truck size={21} /></span><strong>{data.shipping?.courier || data.shipping?.method || "Courier not assigned"}</strong><small>Tracking: {data.shipping?.trackingNo || "No tracking number yet."}</small><small>{data.shipping?.estimate ? `Estimated arrival ${data.shipping.estimate}` : "Tracking remains read-only."}</small></div>
                  <ol>
                    {data.timeline.length ? data.timeline.map((event) => (
                      <li key={event.id}><i /><span>{dateTime(event.createdAt)}</span><strong>{event.label}</strong></li>
                    )) : <li><i /><span>-</span><strong>No tracking timeline yet</strong></li>}
                  </ol>
                </div>
              </section>

              <section className="s26-order-drawer-card s26-order-payment-summary">
                <h3>D. Payment Summary</h3>
                <div><span>Payment Method</span><strong>{data.payment.method}</strong><small>Payment status is read-only in Seller Orders.</small></div>
                <dl><div><dt>Subtotal</dt><dd>{money(data.totals.subtotal)}</dd></div><div><dt>Shipping Fee</dt><dd>{money(data.totals.shippingFee)}</dd></div><div><dt>Service Fee</dt><dd>{money(data.totals.serviceFee)}</dd></div><div><dt>Discount</dt><dd>- {money(data.totals.discount)}</dd></div><div><dt>Total Paid</dt><dd>{money(data.totals.total)}</dd></div></dl>
              </section>

              {detail.mutationError ? <div className="s26-order-drawer__notice"><AlertTriangle size={15} />{detail.mutationError.message || "Unable to update fulfillment."}</div> : null}
            </div>

            <footer>
              <button type="button" disabled title="Print label endpoint is not available"><Printer size={16} />Print Label</button>
              <button type="button" disabled title="Buyer messaging is not enabled"><MessageCircle size={16} />Message Buyer</button>
              <Link to={`/seller/stores/${encodeURIComponent(workspaceStoreSlug)}/orders/${encodeURIComponent(String(suborderId))}`}><FileText size={16} />View Invoice<ExternalLink size={13} /></Link>
              <button
                type="button"
                className="is-primary"
                disabled={!canFulfill || !deliveredAction || isUpdating}
                title={deliveredAction?.reason || (!deliveredAction ? "Backend governance has not enabled MARK_DELIVERED." : undefined)}
                onClick={markDelivered}
              >
                {isUpdating ? <Clock3 size={16} /> : deliveredAction ? <CheckCircle2 size={16} /> : <PackageCheck size={16} />}
                {isUpdating ? "Updating..." : "Mark as Delivered"}
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
