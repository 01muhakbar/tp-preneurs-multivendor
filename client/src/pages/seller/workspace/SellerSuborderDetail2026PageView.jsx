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
  Package,
  Printer,
  Truck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import "./seller-suborder-detail-2026.css";

const ORDER_DETAIL_I18N = {
  en: {
    orderTitle: "Order Details",
    singleStore: "Single Store",
    copy: "Copy",
    backToOrders: "Back to Orders",
    orders: "Orders",
    tabOverview: "Overview",
    tabItems: "Items",
    tabFulfillment: "Fulfillment",
    tabTimeline: "Timeline",
    tabNotes: "Internal Notes",
    customer: "Customer",
    shipping: "Shipping",
    payment: "Payment",
    costSummary: "Cost Summary",
    status: "Status",
    courier: "Courier",
    tracking: "Tracking",
    method: "Method",
    proof: "Proof",
    subtotal: "Subtotal",
    shippingFee: "Shipping",
    serviceFee: "Service Fee",
    discount: "Discount",
    total: "Total",
    colProduct: "Product",
    colVariant: "Variant",
    colQty: "Qty",
    colPrice: "Price",
    colSubtotal: "Subtotal",
    noItems: "No items snapshot available.",
    fulfillmentTitle: "Fulfillment & Shipment",
    fieldTracking: "Tracking Number",
    fieldProvider: "Shipping Provider",
    fieldService: "Courier Service",
    placeholderTracking: "Input tracking number...",
    placeholderProvider: "e.g. JNE, J&T, SiCepat...",
    placeholderService: "e.g. Regular, Next Day...",
    btnMarkPacked: "Mark as Packed",
    btnPrintReceipt: "Print Receipt",
    btnMarkShipped: "Mark as Shipped",
    btnMarkDelivered: "Mark as Delivered",
    timelineTitle: "Shipment Timeline",
    notesTitle: "Internal Notes",
    notesPlaceholder: "Add private note for this order...",
    btnSaveNote: "Save Note",
    loading: "Loading order details...",
    errorTitle: "Unable to load suborder detail",
    errorFallback: "This seller suborder is not available for the active store.",
    backBtn: "Back to Orders",
    buyerNote: "Note",
  },
  id: {
    orderTitle: "Rincian Pesanan",
    singleStore: "Toko Tunggal",
    copy: "Salin",
    backToOrders: "Kembali ke Pesanan",
    orders: "Pesanan",
    tabOverview: "Ringkasan",
    tabItems: "Produk",
    tabFulfillment: "Pengiriman",
    tabTimeline: "Riwayat",
    tabNotes: "Catatan Internal",
    customer: "Pelanggan",
    shipping: "Pengiriman",
    payment: "Pembayaran",
    costSummary: "Ringkasan Biaya",
    status: "Status",
    courier: "Kurir",
    tracking: "Nomor Resi",
    method: "Metode",
    proof: "Bukti Bayar",
    subtotal: "Subtotal",
    shippingFee: "Ongkir",
    serviceFee: "Biaya Layanan",
    discount: "Diskon",
    total: "Total",
    colProduct: "Produk",
    colVariant: "Varian",
    colQty: "Jumlah",
    colPrice: "Harga",
    colSubtotal: "Subtotal",
    noItems: "Tidak ada data produk.",
    fulfillmentTitle: "Proses & Pengiriman",
    fieldTracking: "Nomor Resi",
    fieldProvider: "Ekspedisi Pengiriman",
    fieldService: "Layanan Kurir",
    placeholderTracking: "Masukkan nomor resi...",
    placeholderProvider: "contoh: JNE, J&T, SiCepat...",
    placeholderService: "contoh: Reguler, Next Day...",
    btnMarkPacked: "Siap Dikemas",
    btnPrintReceipt: "Cetak Resi",
    btnMarkShipped: "Tandai Dikirim",
    btnMarkDelivered: "Tandai Selesai",
    timelineTitle: "Riwayat Pengiriman",
    notesTitle: "Catatan Internal",
    notesPlaceholder: "Tambah catatan internal untuk pesanan ini...",
    btnSaveNote: "Simpan Catatan",
    loading: "Memuat rincian pesanan...",
    errorTitle: "Gagal memuat rincian pesanan",
    errorFallback: "Pesanan ini tidak tersedia untuk toko aktif Anda.",
    backBtn: "Kembali ke Pesanan",
    buyerNote: "Catatan",
  },
};

function StatusPill({ status }) {
  return (
    <span className={`tpsodp2026-pill tpsodp2026-pill--${status?.tone || "slate"}`}>
      <i aria-hidden="true" />
      {status?.label || "-"}
    </span>
  );
}

function LoadingState({ t }) {
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

function ErrorState({ error, onBack, t }) {
  return (
    <section className="tpsodp2026-state">
      <ClipboardList aria-hidden="true" />
      <h2>{t.errorTitle}</h2>
      <p>
        {error?.response?.data?.message ||
          error?.message ||
          t.errorFallback}
      </p>
      <button type="button" onClick={onBack}>
        <ArrowLeft aria-hidden="true" />
        {t.backBtn}
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
            <span aria-hidden="true"><Icon size={18} /></span>
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
        <span aria-hidden="true"><Icon size={16} /></span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

function ItemsTable({ items, t }) {
  return (
    <section className="tpsodp2026-card tpsodp2026-items">
      <header>
        <span aria-hidden="true"><Package size={16} /></span>
        <h2>{t.tabItems}</h2>
      </header>
      <div className="tpsodp2026-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t.colProduct}</th>
              <th>{t.colVariant}</th>
              <th>{t.colQty}</th>
              <th>{t.colPrice}</th>
              <th>{t.colSubtotal}</th>
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
                          <Box size={20} />
                        )}
                      </span>
                      <strong>{item.name}</strong>
                    </span>
                  </td>
                  <td>{item.variantLabel}</td>
                  <td>{item.quantity}</td>
                  <td>{item.priceLabel}</td>
                  <td><strong>{item.subtotalLabel}</strong></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>{t.noItems}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Timeline({ items, t }) {
  return (
    <InfoCard icon={CalendarDays} title={t.timelineTitle}>
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
  t,
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
        <span aria-hidden="true"><Truck size={16} /></span>
        <h2>{t.fulfillmentTitle}</h2>
      </header>
      <div className="tpsodp2026-fields">
        <label>
          <span>{t.fieldTracking}</span>
          <input
            value={draft?.trackingNumber || ""}
            onChange={changeField("trackingNumber")}
            placeholder={t.placeholderTracking}
          />
        </label>
        <label>
          <span>{t.fieldProvider}</span>
          <input
            value={draft?.shippingProvider || ""}
            onChange={changeField("shippingProvider")}
            placeholder={t.placeholderProvider}
          />
        </label>
        <label>
          <span>{t.fieldService}</span>
          <input
            value={draft?.courierService || ""}
            onChange={changeField("courierService")}
            placeholder={t.placeholderService}
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
          title={onMarkPacked ? t.btnMarkPacked : order.actions.markPackedReason}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          {t.btnMarkPacked}
        </button>
        <button type="button" onClick={onPrintReceipt} disabled={isUpdating}>
          <Printer size={16} aria-hidden="true" />
          {t.btnPrintReceipt}
        </button>
        <button
          type="button"
          onClick={onMarkShipped}
          disabled={!onMarkShipped || isUpdating}
          title={onMarkShipped ? t.btnMarkShipped : order.actions.markShippedReason}
        >
          <Truck size={16} aria-hidden="true" />
          {t.btnMarkShipped}
        </button>
        <button
          type="button"
          onClick={onMarkDelivered}
          disabled={!onMarkDelivered || isUpdating}
          title={onMarkDelivered ? t.btnMarkDelivered : order.actions.markDeliveredReason}
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          {t.btnMarkDelivered}
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
  t,
}) {
  return (
    <section className="tpsodp2026-card tpsodp2026-notes">
      <header>
        <span aria-hidden="true"><ClipboardList size={16} /></span>
        <h2>{t.notesTitle}</h2>
      </header>
      <div className="tpsodp2026-notes-inner">
        <label>
          <span className="tpsodp2026-sr-only">{t.notesTitle}</span>
          <textarea
            value={internalNoteDraft || ""}
            onChange={(e) => onInternalNoteChange?.(e.target.value)}
            placeholder={t.notesPlaceholder}
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
            {t.btnSaveNote}
          </button>
        </div>
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
  searchQuery = "",
  fulfillmentDraft = {},
  notice = null,
  isIndo = false,
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
  const t = isIndo ? ORDER_DETAIL_I18N.id : ORDER_DETAIL_I18N.en;

  const TABS = [
    { id: "overview", label: t.tabOverview },
    { id: "items", label: t.tabItems },
    { id: "fulfillment", label: t.tabFulfillment },
    { id: "timeline", label: t.tabTimeline },
    { id: "notes", label: t.tabNotes },
  ];

  if (isLoading) return <LoadingState t={t} />;
  if (error) return <ErrorState error={error} onBack={onBack} t={t} />;
  if (!order) return <ErrorState error={null} onBack={onBack} t={t} />;

  return (
    <div className="tpsodp2026-page" data-seller2026-live-order-detail="true">
      {notice ? (
        <p className={`tpsodp2026-notice tpsodp2026-notice--${notice.type || "info"}`}>
          {notice.text}
        </p>
      ) : null}

      {/* Streamlined Hero Header: No redundant order box below! */}
      <header className="tpsodp2026-hero">
        <div className="tpsodp2026-hero-main">
          <div className="tpsodp2026-hero-eyebrow">{t.orderTitle}</div>
          <div className="tpsodp2026-hero-title-row">
            <h1>{order.reference}</h1>
            <button
              type="button"
              onClick={onCopyReference}
              className="tpsodp2026-btn-copy"
              title={t.copy}
              aria-label={t.copy}
            >
              <Copy size={15} />
              <span>{t.copy}</span>
            </button>
          </div>
          <small>
            <CalendarDays size={14} aria-hidden="true" />
            {order.createdAtLabel}
            <span aria-hidden="true">•</span>
            {order.scopeLabel}
          </small>
        </div>

        <div className="tpsodp2026-hero-side">
          <div className="tpsodp2026-hero__chips">
            <StatusPill status={order.paymentStatus} />
            <StatusPill status={order.readinessStatus} />
          </div>
          <Link to={order.ordersPath} className="tpsodp2026-btn-back">
            <ArrowLeft size={15} />
            <span>{t.backToOrders}</span>
          </Link>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="tpsodp2026-tabs" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`tpsodp2026-tab ${activeTab === tab.id ? "is-active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tpsodp2026-tab-content">
        {activeTab === "overview" && (
          <div className="tpsodp2026-summary-grid">
            <InfoCard icon={UserRound} title={t.customer}>
              <div className="tpsodp2026-stack">
                <strong>{order.customer.name}</strong>
                <span>{order.customer.phone || order.customer.email || "-"}</span>
                <p>{order.customer.address}</p>
                {order.customer.note ? (
                  <p className="tpsodp2026-buyer-note">
                    <em>{t.buyerNote}: {order.customer.note}</em>
                  </p>
                ) : null}
              </div>
            </InfoCard>

            <InfoCard icon={Truck} title={t.shipping}>
              <div className="tpsodp2026-stack">
                <StatusPill status={{ label: order.shipping.status, tone: order.shipping.statusTone }} />
                <span>
                  {t.courier}: <strong>{order.shipping.courier}</strong>
                </span>
                <span>
                  {t.tracking}: <strong>{order.shipping.trackingLabel}</strong>
                </span>
                {order.shipping.method && order.shipping.method !== "-" ? (
                  <span>
                    {t.method}: {order.shipping.method}
                  </span>
                ) : null}
              </div>
            </InfoCard>

            <InfoCard icon={WalletCards} title={t.payment}>
              <div className="tpsodp2026-stack">
                <span>
                  {t.status}: <StatusPill status={order.paymentStatus} />
                </span>
                <span>
                  {t.method}: <strong>{order.payment.method}</strong>
                </span>
                <span>
                  {t.proof}: {order.payment.proof}
                </span>
                {order.paidAtLabel && order.paymentStatus?.code === "PAID" ? (
                  <small>{order.paidAtLabel}</small>
                ) : null}
              </div>
            </InfoCard>

            <InfoCard icon={FileText} title={t.costSummary}>
              <dl className="tpsodp2026-costs">
                <div>
                  <dt>{t.subtotal}</dt>
                  <dd>{order.totals.subtotalLabel}</dd>
                </div>
                <div>
                  <dt>{t.shippingFee}</dt>
                  <dd>{order.totals.shippingFeeLabel}</dd>
                </div>
                <div>
                  <dt>{t.serviceFee}</dt>
                  <dd>{order.totals.serviceFeeLabel}</dd>
                </div>
                <div>
                  <dt>{t.discount}</dt>
                  <dd>{order.totals.discountLabel}</dd>
                </div>
                <div className="tpsodp2026-cost-total">
                  <dt>{t.total}</dt>
                  <dd>{order.totals.totalLabel}</dd>
                </div>
              </dl>
            </InfoCard>
          </div>
        )}

        {activeTab === "items" && <ItemsTable items={order.items} t={t} />}

        {activeTab === "fulfillment" && (
          <FulfillmentSection
            order={order}
            draft={fulfillmentDraft}
            isUpdating={isUpdating}
            t={t}
            onDraftChange={onFulfillmentDraftChange}
            onMarkPacked={onMarkPacked}
            onMarkShipped={onMarkShipped}
            onMarkDelivered={onMarkDelivered}
            onPrintReceipt={onPrintReceipt}
          />
        )}

        {activeTab === "timeline" && <Timeline items={order.timeline} t={t} />}

        {activeTab === "notes" && (
          <InternalNotes
            internalNoteDraft={internalNoteDraft}
            onInternalNoteChange={onInternalNoteChange}
            onSaveInternalNote={onSaveInternalNote}
            isUpdating={isUpdating}
            t={t}
          />
        )}
      </div>
    </div>
  );
}
