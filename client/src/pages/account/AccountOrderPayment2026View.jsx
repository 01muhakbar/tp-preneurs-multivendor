import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  Download,
  Expand,
  MessageCircleMore,
  QrCode,
  ReceiptText,
  ShieldCheck,
  Store,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./account-order-payment-2026.css";

function StatusBadge({ status }) {
  return (
    <span className={`tppay2026-badge tppay2026-badge--${status?.tone || "stone"}`}>
      <Clock3 aria-hidden="true" />
      {status?.label || "Awaiting Payment"}
    </span>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <article className="tppay2026-metric">
      <span>
        <Icon aria-hidden="true" />
      </span>
      <p>
        <small>{label}</small>
        <strong>{value}</strong>
      </p>
    </article>
  );
}

function LoadingState() {
  return (
    <section className="tppay2026-root" aria-label="Loading payment">
      <div className="tppay2026-loading">
        <span />
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function StateMessage({ title, message, LinkComponent }) {
  return (
    <section className="tppay2026-root">
      <div className="tppay2026-state" role="alert">
        <WalletCards aria-hidden="true" />
        <h1>{title}</h1>
        <p>{message}</p>
        <LinkComponent to="/user/my-orders">
          <ArrowLeft aria-hidden="true" />
          Back to Orders
        </LinkComponent>
      </div>
    </section>
  );
}

function Progress({ progress }) {
  const activeStep = Number(progress?.activeStep || 1);
  return (
    <div className="tppay2026-progress" aria-label="Payment progress">
      {(progress?.steps || []).map((step, index) => {
        const position = index + 1;
        const state =
          position < activeStep ? "done" : position === activeStep ? "active" : "idle";
        return (
          <div className={`tppay2026-progress__step is-${state}`} key={step}>
            <i>{state === "done" ? <Check aria-hidden="true" /> : null}</i>
            <span>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

function QrPreviewModal({ payment, onClose, onCopyAmount }) {
  if (!payment?.qr?.imageUrl) return null;
  const imageUrl = resolveAssetUrl(payment.qr.imageUrl);
  return (
    <div className="tppay2026-modal" role="dialog" aria-modal="true">
      <div className="tppay2026-modal__panel">
        <button
          type="button"
          className="tppay2026-modal__close"
          onClick={onClose}
          aria-label="Close QR preview"
        >
          <X aria-hidden="true" />
        </button>
        <div className="tppay2026-modal__qr">
          <img src={imageUrl} alt={`QRIS ${payment.qr.storeName}`} />
        </div>
        <div className="tppay2026-modal__detail">
          <h2>{payment.qr.storeName}</h2>
          <p>{payment.qr.destination}</p>
          <strong>{payment.amountDisplay}</strong>
          <button type="button" onClick={onCopyAmount}>
            <Copy aria-hidden="true" />
            Copy Amount
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentCard({
  payment,
  isSubmitting,
  onCopyAmount,
  onCopyReference,
  onSaveQr,
  onConfirmTransfer,
  onCancelPayment,
}) {
  const [isPreviewOpen, setPreviewOpen] = useState(false);
  const qrImageUrl = payment?.qr?.imageUrl ? resolveAssetUrl(payment.qr.imageUrl) : "";

  return (
    <article className="tppay2026-payment-card">
      <div className="tppay2026-payment-card__head">
        <div>
          <h2>{payment?.qr?.storeName || "Payment"}</h2>
          <p>{payment?.primaryPayment?.status?.label || "Awaiting Payment"}</p>
        </div>
        <span>{payment?.primaryPayment?.method || "QRIS"}</span>
      </div>

      <div className="tppay2026-payment-card__body">
        <button
          type="button"
          className="tppay2026-qr"
          onClick={() => qrImageUrl && setPreviewOpen(true)}
          disabled={!qrImageUrl}
        >
          {qrImageUrl ? (
            <img src={qrImageUrl} alt={`QRIS ${payment.qr.storeName}`} />
          ) : (
            <span>
              <QrCode aria-hidden="true" />
              QRIS image is not available.
            </span>
          )}
        </button>
        <div className="tppay2026-payinfo">
          <p>
            <small>Amount</small>
            <strong>{payment.amountDisplay}</strong>
          </p>
          <p>
            <small>Time Remaining</small>
            <strong>{payment.dueAtLabel}</strong>
          </p>
          <p>
            <small>Destination</small>
            <strong>{payment.qr.destination}</strong>
            <em>{payment.qr.merchantName}</em>
          </p>
          <p>
            <small>Reference</small>
            <strong title={payment.paymentReference}>{payment.paymentReference}</strong>
          </p>
        </div>
      </div>

      <div className="tppay2026-actions">
        <button type="button" onClick={onCopyAmount}>
          <Copy aria-hidden="true" />
          Copy Amount
        </button>
        <button type="button" onClick={onCopyReference}>
          <Copy aria-hidden="true" />
          Copy Reference
        </button>
        {qrImageUrl ? (
          <>
            <button type="button" onClick={() => setPreviewOpen(true)}>
              <Expand aria-hidden="true" />
              View QR
            </button>
            <button type="button" onClick={onSaveQr}>
              <Download aria-hidden="true" />
              Save QR
            </button>
          </>
        ) : null}
      </div>

      <div className="tppay2026-primary-actions">
        {onConfirmTransfer ? (
          <button
            type="button"
            className="tppay2026-primary-actions__confirm"
            onClick={onConfirmTransfer}
            disabled={isSubmitting}
          >
            <Check aria-hidden="true" />
            {isSubmitting ? "Submitting..." : "I Have Transferred"}
          </button>
        ) : null}
        {onCancelPayment ? (
          <button
            type="button"
            className="tppay2026-primary-actions__cancel"
            onClick={onCancelPayment}
            disabled={isSubmitting}
          >
            <X aria-hidden="true" />
            Cancel Payment
          </button>
        ) : null}
      </div>

      <div className="tppay2026-note">
        <ShieldCheck aria-hidden="true" />
        <span>{payment.qr.instruction}</span>
      </div>

      {isPreviewOpen ? (
        <QrPreviewModal
          payment={payment}
          onClose={() => setPreviewOpen(false)}
          onCopyAmount={onCopyAmount}
        />
      ) : null}
    </article>
  );
}

function PaymentSummary({ payment }) {
  return (
    <aside className="tppay2026-summary">
      <div className="tppay2026-summary__head">
        <span>
          <WalletCards aria-hidden="true" />
        </span>
        <h2>Payment Summary</h2>
      </div>
      <dl>
        <div>
          <dt>Items</dt>
          <dd>{payment.totals.items}</dd>
        </div>
        <div>
          <dt>Subtotal</dt>
          <dd>{payment.totals.subtotalDisplay}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{payment.totals.shippingDisplay}</dd>
        </div>
        <div className="is-total">
          <dt>Total</dt>
          <dd>{payment.totals.grandTotalDisplay}</dd>
        </div>
      </dl>
      <div className="tppay2026-secure">
        <ShieldCheck aria-hidden="true" />
        Pay to this QRIS only.
      </div>
    </aside>
  );
}

function StoreGroups({ groups }) {
  if (!groups.length) return null;
  return (
    <section className="tppay2026-groups">
      <div className="tppay2026-section-title">
        <h2>Store Payments</h2>
        <p>Each QRIS destination belongs to its matching store payment.</p>
      </div>
      <div className="tppay2026-group-list">
        {groups.map((group) => (
          <article key={group.id} className="tppay2026-group">
            <span>
              <Store aria-hidden="true" />
            </span>
            <div>
              <h3>{group.storeName}</h3>
              <p title={group.paymentReference}>{group.paymentReference || group.suborderNumber}</p>
              <small>{group.method} - {group.accountName}</small>
            </div>
            <div className="tppay2026-group__action">
              <strong>{group.amountDisplay}</strong>
              {group.whatsappContact ? (
                <a
                  href={group.whatsappContact.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Notify ${group.storeName} via WhatsApp`}
                >
                  <MessageCircleMore aria-hidden="true" />
                  Notify Store
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AccountOrderPayment2026View({
  payment,
  isLoading,
  error,
  status,
  isSubmitting = false,
  LinkComponent = "a",
  onCopyAmount,
  onCopyReference,
  onSaveQr,
  onConfirmTransfer,
  onCancelPayment,
}) {
  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <StateMessage
        LinkComponent={LinkComponent}
        title="Payment details are unavailable"
        message={
          error?.response?.data?.message ||
          error?.message ||
          "The latest grouped payment read model could not be loaded."
        }
      />
    );
  }

  if (!payment) {
    return (
      <StateMessage
        LinkComponent={LinkComponent}
        title="Order payment view not found"
        message="Open this page from your order history so the payment lane can load the right store split."
      />
    );
  }

  return (
    <section className="tppay2026-root">
      <div className="tppay2026-topline">
        <LinkComponent to="/user/my-orders">
          <ArrowLeft aria-hidden="true" />
          Back to Orders
        </LinkComponent>
      </div>

      <header className="tppay2026-hero">
        <div>
          <p className="tppay2026-breadcrumb">
            My Orders <span>/</span> {payment.reference} <span>/</span> Payment
          </p>
          <div className="tppay2026-title-row">
            <h1>Order Payment</h1>
            <StatusBadge status={payment.status} />
          </div>
        </div>
        <div className="tppay2026-hero__icon">
          <ShieldCheck aria-hidden="true" />
        </div>
      </header>

      {status?.message ? (
        <div className={`tppay2026-alert tppay2026-alert--${status.tone || "slate"}`}>
          {status.message}
        </div>
      ) : null}

      {payment.warnings?.map((warning) => (
        <div className="tppay2026-alert tppay2026-alert--amber" key={warning}>
          {warning}
        </div>
      ))}

      <div className="tppay2026-metrics">
        <Metric icon={ReceiptText} label="Total" value={payment.totals.grandTotalDisplay} />
        <Metric icon={CalendarDays} label="Due" value={payment.dueAtLabel} />
        <Metric icon={UsersRound} label="Store Groups" value={payment.totals.storeGroups} />
        <Metric icon={CalendarDays} label="Created" value={payment.createdAtLabel} />
      </div>

      <section className="tppay2026-reference">
        <div>
          <small>Order Reference</small>
          <button type="button" onClick={onCopyReference} title={payment.paymentReference}>
            <span>{payment.paymentReference}</span>
            <Copy aria-hidden="true" />
          </button>
        </div>
        <div>
          <small>Payment Progress</small>
          <Progress progress={payment.progress} />
        </div>
      </section>

      <div className="tppay2026-main-grid">
        <PaymentCard
          payment={payment}
          isSubmitting={isSubmitting}
          onCopyAmount={onCopyAmount}
          onCopyReference={onCopyReference}
          onSaveQr={onSaveQr}
          onConfirmTransfer={onConfirmTransfer}
          onCancelPayment={onCancelPayment}
        />
        <PaymentSummary payment={payment} />
      </div>

      <StoreGroups groups={payment.groups} />

      <div className="tppay2026-footer-actions">
        <LinkComponent to={`/user/my-orders/${payment.orderId || ""}`}>
          <ArrowLeft aria-hidden="true" />
          Back to Order
        </LinkComponent>
      </div>
    </section>
  );
}
