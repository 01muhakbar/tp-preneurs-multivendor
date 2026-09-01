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
import { useTranslation } from "react-i18next";
import { useTheme } from "../../theme/ThemeProvider.jsx";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./account-order-detail-2026.css";
import { normalizeDashboardSettingCopy } from "../../utils/dashboardSettingCopy.js";
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

function ErrorState({ error, LinkComponent, onRetry, t }) {
  return (
    <section className="aod-root">
      <div className="aod-state" role="alert">
        <Package aria-hidden="true" />
        <h1>{t("orderDetail.unavailableTitle")}</h1>
        <p>
          {error?.response?.data?.message ||
            error?.message ||
            t("orderDetail.unavailableDesc")}
        </p>
        <div className="aod-state__actions">
          {onRetry ? (
            <button type="button" onClick={onRetry}>
              {t("orderDetail.tryAgain")}
            </button>
          ) : null}
          <LinkComponent to="/user/my-orders">{t("orderDetail.backToOrders")}</LinkComponent>
        </div>
      </div>
    </section>
  );
}

function EmptyInline({ children }) {
  return <p className="aod-empty">{children}</p>;
}

function OrderHero({ orderDetail, onCopy, t }) {
  const { order, payment, summary } = orderDetail;
  return (
    <section className="aod-card aod-hero">
      <div className="aod-card__top">
        <div>
          <h1>{t("orderDetail.title")}</h1>
          <p>{t("orderDetail.orderId")}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="aod-order-code">
        <strong title={order.code}>{order.code}</strong>
        <button
          type="button"
          onClick={() => onCopy(order.code, t("orderDetail.orderIdCopied"))}
          disabled={!orderDetail.actionability.copyOrderCode.enabled}
          aria-label="Copy Order ID"
        >
          <Copy aria-hidden="true" />
        </button>
      </div>

      <div className="aod-placed">
        <CalendarDays aria-hidden="true" />
        <span>{t("orderDetail.placedOn", { date: order.placedAtDisplay })}</span>
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
        <IconMetric icon={WalletCards} label={t("orderDetail.paymentMethod")} value={payment.method} />
        <IconMetric icon={ReceiptText} label={t("orderDetail.total")} value={summary.totalDisplay} />
        <IconMetric icon={FileText} label={t("orderDetail.subtotal")} value={summary.subtotalDisplay} />
        <IconMetric icon={Truck} label={t("orderDetail.shipping")} value={summary.shippingDisplay} />
      </div>
    </section>
  );
}

function ShipmentSummary({ shipment, onCopy, onTrack, t }) {
  const primary = shipment.primary;
  return (
    <section className="aod-card aod-shipment" id="aod-shipment-summary">
      <div className="aod-card__top">
        <div>
          <h2>{t("orderDetail.shipmentSummary")}</h2>
          <p>{t("orderDetail.quickView")}</p>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      <div className="aod-shipment-quick">
        <IconMetric icon={Truck} label={t("orderDetail.courier")} value={primary.courier} />
        <div className="aod-metric">
          <span className="aod-metric__icon">
            <ReceiptText aria-hidden="true" />
          </span>
          <span>
            <small>{t("orderDetail.trackingNo")}</small>
            <strong title={primary.trackingNumber}>{primary.trackingNumber}</strong>
          </span>
          <button
            type="button"
            className="aod-copy-mini"
            onClick={() => onCopy(primary.trackingNumber, t("orderDetail.trackingCopied"))}
            disabled={!primary.trackingNumber || primary.trackingNumber === "Not assigned"}
            aria-label="Copy Tracking No."
          >
            <Copy aria-hidden="true" />
          </button>
        </div>
        <IconMetric icon={MapPin} label={t("orderDetail.source")} value={primary.source} />
        <IconMetric icon={CalendarDays} label={t("orderDetail.deliveredOn")} value={primary.deliveredOnDisplay} />
      </div>

      <div className="aod-timeline" id="aod-order-timeline">
        <div className="aod-timeline__head">
          <h3>{t("orderDetail.orderTimeline")}</h3>
          <button
            type="button"
            onClick={onTrack}
            disabled={!shipment.timeline.length}
          >
            {t("orderDetail.trackOrder")}
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
          <EmptyInline>{t("orderDetail.noTimeline")}</EmptyInline>
        )}
      </div>
    </section>
  );
}

function StoreBreakdown({ stores, t }) {
  return (
    <section className="aod-card">
      <div className="aod-card__top">
        <div>
          <h2>{t("orderDetail.storeBreakdown")}</h2>
          <p>{t("orderDetail.storeBreakdownDesc")}</p>
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
                  <StatusBadge status={store.status} prefix={t("orderDetail.splitPrefix")} />
                  <StatusBadge status={store.paymentStatus} />
                  <StatusBadge status={store.shipmentStatus} prefix={t("orderDetail.shipping")} />
                </div>
                <small>{t("orderDetail.merchantLabel", { name: store.merchantName })}</small>
                <small>{t("orderDetail.accountLabel", { name: store.accountLabel })}</small>
              </div>
              <div className="aod-store__total">
                <strong>{store.totalAmountDisplay}</strong>
                <span>
                  {store.itemCount === 1 
                    ? t("orderDetail.itemsCount", { count: store.itemCount })
                    : t("orderDetail.itemsCountPlural", { count: store.itemCount })
                  }
                </span>
              </div>
            </article>
          ))
        ) : (
          <EmptyInline>{t("orderDetail.noStoreSplit")}</EmptyInline>
        )}
      </div>
    </section>
  );
}

function Items({ items, t }) {
  return (
    <section className="aod-card">
      <div className="aod-card__top">
        <div>
          <h2>{t("orderDetail.itemsTitle")}</h2>
          <p>
            {items.length === 1
              ? t("orderDetail.itemLinesCount", { count: items.length })
              : t("orderDetail.itemLinesCountPlural", { count: items.length })}
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
                  {item.variantLines.length ? item.variantLines.join(" / ") : t("orderDetail.standardOption")}
                </p>
              </div>
              <div className="aod-item__qty">
                {item.quantity} x {item.unitPriceDisplay}
              </div>
              <strong>{item.lineTotalDisplay}</strong>
            </article>
          ))
        ) : (
          <EmptyInline>{t("orderDetail.noItemDetails")}</EmptyInline>
        )}
      </div>

      <div className="aod-notice">
        <PackageCheck aria-hidden="true" />
        <span>{t("orderDetail.returnHelpNotice")}</span>
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
  t,
  copy,
}) {
  const actions = orderDetail.actionability;
  return (
    <section className="aod-rail-card">
      <h2>{t("orderDetail.orderActions")}</h2>
      <RailAction
        icon={FileText}
        label={copy.dashboard.downloadButtonValue}
        onClick={() => onInvoice(actions.invoice)}
        disabled={!actions.invoice.enabled}
        title={actions.invoice.reason}
      />
      <RailAction
        icon={Printer}
        label={copy.dashboard.printButtonValue}
        onClick={onPrint}
      />
      <RailAction
        icon={Truck}
        label={t("orderDetail.trackOrder")}
        onClick={() => onTrack(actions.track)}
        disabled={!actions.track.enabled}
        title={actions.track.reason}
      />
      <RailAction
        icon={Clock3}
        label={t("orderDetail.orderTimeline")}
        onClick={onTimeline}
        disabled={!actions.timeline.enabled}
        title={actions.timeline.reason}
      />
    </section>
  );
}

function SupportCard({ onContactSupport, t }) {
  return (
    <section className="aod-rail-card aod-support">
      <h2>{t("orderDetail.needHelp")}</h2>
      <p>{t("orderDetail.helpDesc")}</p>
      <button type="button" onClick={onContactSupport}>
        <Headphones aria-hidden="true" />
        <span>{t("orderDetail.contactSupport")}</span>
      </button>
    </section>
  );
}

function OrderSummary({ orderDetail, t }) {
  const { summary, payment } = orderDetail;
  return (
    <section className="aod-rail-card aod-summary" id="aod-order-summary">
      <h2>{t("orderDetail.orderSummary")}</h2>
      <dl>
        <div>
          <dt>{t("orderDetail.subtotal")}</dt>
          <dd>{summary.subtotalDisplay}</dd>
        </div>
        <div>
          <dt>{t("orderDetail.shipping")}</dt>
          <dd>{summary.shippingDisplay}</dd>
        </div>
        <div>
          <dt>{t("orderDetail.discount")}</dt>
          <dd>{summary.discountDisplay}</dd>
        </div>
        <div className="aod-summary__total">
          <dt>{t("orderDetail.total")}</dt>
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
  dashboardSettingCopy: rawCopy,
}) {
  const { theme, resolvedTheme } = useTheme();
  const { t } = useTranslation();
  const copy = rawCopy || normalizeDashboardSettingCopy({});

  if (isLoading) return <LoadingState />;
  if (error || !orderDetail) {
    return (
      <ErrorState
        error={error}
        LinkComponent={LinkComponent}
        onRetry={onRetry}
        t={t}
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
        <LinkComponent to="/user/my-orders">{t("orders.title")}</LinkComponent>
        <ChevronRight aria-hidden="true" />
        <span>{t("orderDetail.title")}</span>
      </nav>

      <div className="aod-layout">
        <div className="aod-main">
          <OrderHero orderDetail={orderDetail} onCopy={onCopy} t={t} />
          <ShipmentSummary
            shipment={orderDetail.shipment}
            onCopy={onCopy}
            onTrack={() => onTrack(orderDetail.actionability.track)}
            t={t}
          />
          <StoreBreakdown stores={orderDetail.storeBreakdown} t={t} />
          <Items items={orderDetail.items} t={t} />
          <LinkComponent className="aod-back" to="/user/my-orders">
            <ArrowLeft aria-hidden="true" />
            {t("orderDetail.backToOrders")}
          </LinkComponent>
        </div>

        <aside className="aod-rail">
          <OrderActions
            orderDetail={orderDetail}
            onInvoice={onInvoice}
            onPrint={onPrint}
            onTrack={onTrack}
            onTimeline={onTimeline}
            t={t}
            copy={copy}
          />
          <SupportCard onContactSupport={onContactSupport} t={t} />
          <OrderSummary orderDetail={orderDetail} t={t} />
        </aside>
      </div>
    </section>
    <AccountOrderInvoicePrint invoiceData={invoiceData} themeMode={resolvedTheme} dashboardSettingCopy={copy} />
    </>
  );
}
