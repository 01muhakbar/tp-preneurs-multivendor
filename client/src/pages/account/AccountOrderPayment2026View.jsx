import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Expand,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Store,
  UsersRound,
  WalletCards,
  X,
  MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./account-order-payment-2026.css";

const qrTypeLabel = (value) =>
  String(value || "QRIS_STATIC").toUpperCase() === "QRIS_STATIC"
    ? "QRIS Static"
    : String(value || "QRIS").replaceAll("_", " ");

function StatusBadge({ status, t }) {
  return (
    <span className={`tp-payment-2026__badge is-${status?.tone || "stone"}`}>
      <Clock3 aria-hidden="true" />
      {status?.label || t("orderPayment.unpaid")}
    </span>
  );
}

function SummaryCard({ icon: Icon, label, value }) {
  return (
    <article className="tp-payment-2026__metric">
      <span className="tp-payment-2026__metric-icon"><Icon aria-hidden="true" /></span>
      <div><small>{label}</small><strong>{value}</strong></div>
    </article>
  );
}

function PaymentProgress({ progress }) {
  const activeStep = Number(progress?.activeStep || 1);
  return (
    <div className="tp-payment-progress" aria-label="Payment progress">
      {(progress?.steps || []).map((step, index) => {
        const position = index + 1;
        const state = position < activeStep ? "done" : position === activeStep ? "active" : "idle";
        return (
          <div className={`tp-payment-progress__step is-${state}`} key={step}>
            <span className="tp-payment-progress__line" aria-hidden="true" />
            <i>{state === "done" ? <Check aria-hidden="true" /> : null}</i>
            <b>{step}</b>
          </div>
        );
      })}
    </div>
  );
}

function PaymentDestinationCard({ destination, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`tp-payment-2026__destination${selected ? " is-selected" : ""}`}
      onClick={() => onSelect?.(destination.paymentId)}
      aria-pressed={selected}
    >
      <span className="tp-payment-2026__destination-icon"><Store aria-hidden="true" /></span>
      <span className="tp-payment-2026__destination-copy">
        <strong>{destination.storeName}</strong>
        <small title={destination.paymentReference}>{destination.paymentReference || destination.suborderNumber}</small>
        <em>{destination.method} · {destination.accountName}</em>
      </span>
      <span className="tp-payment-2026__destination-amount">
        <strong>{destination.amountDisplay}</strong>
        <ChevronRight aria-hidden="true" />
      </span>
    </button>
  );
}

function StorePayments({ destinations, selectedId, onSelect, t }) {
  if (!destinations?.length) return null;
  return (
    <section className="tp-payment-2026__store-payments">
      <div className="tp-payment-2026__section-heading">
        <h2>{t("orderPayment.storePaymentsTitle")}</h2>
        <p>{t("orderPayment.storePaymentsDesc")}</p>
      </div>
      <div className="tp-payment-2026__destination-list">
        {destinations.map((destination) => (
          <PaymentDestinationCard
            key={destination.id}
            destination={destination}
            selected={String(destination.paymentId) === String(selectedId)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
}

function QrModal({ payment, open, onClose, onCopyAmount, t }) {
  const closeRef = useRef(null);
  const imageUrl = payment?.qr?.imageUrl ? resolveAssetUrl(payment.qr.imageUrl) : "";

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKeyDown = (event) => event.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open || !imageUrl) return null;
  return (
    <div className="tp-payment-modal" role="presentation" onMouseDown={onClose}>
      <section
        className="tp-payment-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tp-payment-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="tp-payment-modal__handle" aria-hidden="true" />
        <button ref={closeRef} type="button" className="tp-payment-modal__close" onClick={onClose} aria-label="Close QR preview">
          <X aria-hidden="true" />
        </button>
        <div className="tp-payment-modal__image"><img src={imageUrl} alt={`QRIS payment for ${payment.qr.storeName}`} /></div>
        <div className="tp-payment-modal__details">
          <div><small>{t("orderPayment.merchant")}</small><h2 id="tp-payment-modal-title">{payment.qr.storeName}</h2><p>{payment.qr.merchantName}</p></div>
          <dl>
            <div><dt>{t("orderPayment.amount")}</dt><dd>{payment.amountDisplay}</dd></div>
            <div><dt>{t("orderPayment.destination")}</dt><dd>{payment.qr.destination}</dd></div>
            <div><dt>{t("orderPayment.reference")}</dt><dd>{payment.paymentReference}</dd></div>
          </dl>
          <button type="button" className="tp-payment-modal__copy" onClick={onCopyAmount}><Copy aria-hidden="true" />{t("orderPayment.copyAmount")}</button>
        </div>
      </section>
    </div>
  );
}

function QrPaymentCard({ payment, isSubmitting, onCopyAmount, onCopyReference, onSaveQr, onConfirmTransfer, onCancelPayment, t }) {
  const [modalOpen, setModalOpen] = useState(false);
  const imageUrl = payment?.qr?.imageUrl ? resolveAssetUrl(payment.qr.imageUrl) : "";
  return (
    <article className="tp-payment-qr-card">
      <div className="tp-payment-qr-card__heading">
        <div><h2>{t("orderPayment.qrPaymentTitle")}</h2><p>{t("orderPayment.qrPaymentDesc")}</p></div>
        <span>{qrTypeLabel(payment?.primaryPayment?.method)}</span>
      </div>
      <div className="tp-payment-qr-card__body">
        <button type="button" className="tp-payment-qr-card__preview" disabled={!imageUrl} onClick={() => setModalOpen(true)} aria-label="Open full QR code">
          {imageUrl ? <img src={imageUrl} alt={`QRIS payment for ${payment.qr.storeName}`} /> : <span><QrCode aria-hidden="true" />{import.meta.env.DEV ? t("orderPayment.qrPreviewDev") : t("orderPayment.qrPreviewUnavailable")}</span>}
          {imageUrl ? <em><Expand aria-hidden="true" />{t("orderPayment.viewFullQr")}</em> : null}
        </button>
        <dl className="tp-payment-qr-card__details">
          <div><dt>{t("orderPayment.amount")}</dt><dd className="is-amount">{payment.amountDisplay}</dd></div>
          <div><dt>{t("orderPayment.timeRemaining")}</dt><dd className="is-due">{payment.dueAtLabel}</dd></div>
          <div><dt>{t("orderPayment.destination")}</dt><dd>{payment.qr.destination}</dd><small>{payment.qr.accountName}</small></div>
          <div><dt>{t("orderPayment.merchant")}</dt><dd>{payment.qr.storeName}</dd><small>{payment.qr.merchantName}</small></div>
          <div><dt>{t("orderPayment.referenceId")}</dt><dd title={payment.paymentReference}>{payment.paymentReference}</dd><button type="button" onClick={onCopyReference} aria-label="Copy payment reference"><Copy aria-hidden="true" /></button></div>
        </dl>
      </div>
      <div className="tp-payment-qr-card__utilities">
        <button type="button" onClick={onCopyAmount}><Copy aria-hidden="true" />{t("orderPayment.copyAmount")}</button>
        <button type="button" onClick={onCopyReference}><Copy aria-hidden="true" />{t("orderPayment.copyReference")}</button>
        {imageUrl ? <button type="button" onClick={() => setModalOpen(true)}><Expand aria-hidden="true" />{t("orderPayment.viewQr")}</button> : null}
        {imageUrl ? <button type="button" onClick={onSaveQr}><Download aria-hidden="true" />{t("orderPayment.saveQr")}</button> : null}
      </div>
      {(onConfirmTransfer || onCancelPayment || payment?.primaryPayment?.whatsappContact) ? (
        <div className="tp-payment-qr-card__actions">
          {onConfirmTransfer ? <button type="button" className="is-primary" onClick={onConfirmTransfer} disabled={isSubmitting}><Check aria-hidden="true" />{isSubmitting ? t("orderPayment.submitting") : t("orderPayment.transferred")}</button> : null}
          {payment?.primaryPayment?.whatsappContact ? (
            <a
              href={payment.primaryPayment.whatsappContact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="is-whatsapp"
            >
              <MessageCircle aria-hidden="true" />
              {t("orderPayment.notifyWhatsapp")}
            </a>
          ) : null}
          {onCancelPayment ? <button type="button" className="is-danger" onClick={onCancelPayment} disabled={isSubmitting}><X aria-hidden="true" />{t("orderPayment.cancelPayment")}</button> : null}
        </div>
      ) : null}
      <div className="tp-payment-qr-card__notice"><ShieldCheck aria-hidden="true" /><span>{payment.qr.instruction || t("orderPayment.payDestinationOnly")}</span></div>
      <QrModal payment={payment} open={modalOpen} onClose={() => setModalOpen(false)} onCopyAmount={onCopyAmount} t={t} />
    </article>
  );
}

function PaymentSummary({ payment, t }) {
  return (
    <aside className="tp-payment-side-summary">
      <div className="tp-payment-summary-card__heading"><span><WalletCards aria-hidden="true" /></span><h2>{t("orderPayment.paymentSummary")}</h2></div>
      <dl>
        <div><dt>{t("orderPayment.items")}</dt><dd>{payment.totals.items}</dd></div>
        <div><dt>{t("orderPayment.subtotal")}</dt><dd>{payment.totals.subtotalDisplay}</dd></div>
        <div><dt>{t("orderPayment.shipping")}</dt><dd>{payment.totals.shippingDisplay}</dd></div>
        <div className="is-total"><dt>{t("orderPayment.total")}</dt><dd>{payment.totals.grandTotalDisplay}</dd></div>
      </dl>
      <div className="tp-payment-summary-card__safe"><ShieldCheck aria-hidden="true" />{t("orderPayment.payQrisOnly")}</div>
    </aside>
  );
}

function LoadingState() {
  return <section className="tp-payment-2026" aria-label="Loading payment"><div className="tp-payment-2026__loading"><span /><span /><span /><span /></div></section>;
}

function StateMessage({ title, message, LinkComponent, t }) {
  return (
    <section className="tp-payment-2026"><div className="tp-payment-2026__state" role="alert"><WalletCards aria-hidden="true" /><h1>{title}</h1><p>{message}</p><LinkComponent to="/user/my-orders"><ArrowLeft aria-hidden="true" />{t("orderPayment.backToOrders")}</LinkComponent></div></section>
  );
}

export default function AccountOrderPayment2026View({ payment, isLoading, error, status, isSubmitting = false, LinkComponent = "a", onSelectDestination, onCopyAmount, onCopyReference, onSaveQr, onConfirmTransfer, onCancelPayment }) {
  const { t } = useTranslation();
  if (isLoading) return <LoadingState />;
  if (error) return <StateMessage LinkComponent={LinkComponent} title={t("orderPayment.unavailableTitle")} message={error?.response?.data?.message || error?.message || t("orderPayment.unavailableDesc")} t={t} />;
  if (!payment) return <StateMessage LinkComponent={LinkComponent} title={t("orderPayment.notFoundTitle")} message={t("orderPayment.notFoundDesc")} t={t} />;

  return (
    <section className="tp-payment-2026">
      <LinkComponent className="tp-payment-2026__back" to="/user/my-orders"><ArrowLeft aria-hidden="true" />{t("orderPayment.backToOrders")}</LinkComponent>
      <header className="tp-payment-2026__hero">
        <div><p className="tp-payment-2026__breadcrumb">{t("orderPayment.myOrders")} <span>/</span> <b>{payment.reference}</b> <span>/</span> {t("orderPayment.payment")}</p><div className="tp-payment-2026__title"><h1>{t("orderPayment.orderPaymentTitle")}</h1><StatusBadge status={payment.status} t={t} /></div></div>
        <span className="tp-payment-2026__shield"><ShieldCheck aria-hidden="true" /></span>
      </header>
      {status?.message ? <div className={`tp-payment-2026__alert is-${status.tone || "slate"}`} role="status">{status.message}</div> : null}
      {payment.warnings?.map((warning) => <div className="tp-payment-2026__alert is-amber" key={warning}>{warning}</div>)}
      <div className="tp-payment-2026__metrics">
        <SummaryCard icon={ReceiptText} label={t("orderPayment.total")} value={payment.totals.grandTotalDisplay} />
        <SummaryCard icon={CalendarDays} label={t("orderPayment.due")} value={payment.dueAtLabel} />
        <SummaryCard icon={UsersRound} label={t("orderPayment.storeGroups")} value={payment.totals.storeGroups} />
        <SummaryCard icon={CalendarDays} label={t("orderPayment.created")} value={payment.createdAtLabel} />
      </div>
      <section className="tp-payment-2026__reference-progress">
        <div className="tp-payment-2026__reference"><small>{t("orderPayment.orderReference")}</small><button type="button" onClick={onCopyReference} title={payment.reference}><span>{payment.reference}</span><Copy aria-hidden="true" /></button></div>
        <div className="tp-payment-2026__progress-wrap"><small>{t("orderPayment.paymentProgress")}</small><PaymentProgress progress={payment.progress} /></div>
      </section>
      <div className="tp-payment-2026__content-grid">
        <div className="tp-payment-2026__main-column">
          <StorePayments destinations={payment.destinations} selectedId={payment.primaryPayment?.paymentId} onSelect={onSelectDestination} t={t} />
          <QrPaymentCard payment={payment} isSubmitting={isSubmitting} onCopyAmount={onCopyAmount} onCopyReference={onCopyReference} onSaveQr={onSaveQr} onConfirmTransfer={onConfirmTransfer} onCancelPayment={onCancelPayment} t={t} />
        </div>
        <PaymentSummary payment={payment} t={t} />
      </div>
      <LinkComponent className="tp-payment-2026__order-link" to={`/user/my-orders/${payment.orderId || ""}`}><ArrowLeft aria-hidden="true" />{t("orderPayment.backToOrder")}</LinkComponent>
    </section>
  );
}
