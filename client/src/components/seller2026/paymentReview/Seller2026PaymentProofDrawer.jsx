import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileImage,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

const money = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const truncateId = (value, maxLength = 24) => {
  const str = String(value || "");
  if (str.length <= maxLength) return str || "-";
  return `${str.slice(0, 12)}...${str.slice(-8)}`;
};

const matchCopy = {
  MATCHED: {
    label: "Matched",
    note: "Proof amount matches the expected payment amount.",
  },
  NEEDS_REVIEW: {
    label: "Needs Review",
    note: "Verify the amount and proof details before deciding.",
  },
  RISK_FLAG: {
    label: "Risk Flag",
    note: "This payment has a rejected or exception state.",
  },
};

export default function Seller2026PaymentProofDrawer({
  open,
  row,
  actorCanReview,
  governanceNote,
  isMutating,
  mutationError,
  orderHref,
  onClose,
  onViewOrder,
  onApprove,
  onReject,
}) {
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [validation, setValidation] = useState("");
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    setNote("");
    setConfirmed(false);
    setValidation("");
    setZoom(100);
  }, [row?.paymentId]);

  const match = matchCopy[row?.matchStatus] || matchCopy.NEEDS_REVIEW;
  const proofUrl = resolveAssetUrl(row?.proofUrl);
  const reviewEnabled = Boolean(actorCanReview && row?.canReview);
  const checklist = useMemo(
    () => [
      {
        label: "Proof amount matches expected total",
        pass:
          row?.expectedAmount > 0 &&
          row?.expectedAmount === row?.paidAmount,
      },
      { label: "Payment proof image is available", pass: Boolean(proofUrl) },
      {
        label: "Payment is awaiting seller review",
        pass: row?.paymentStatus === "PENDING_CONFIRMATION",
      },
      {
        label: "Backend actionability allows review",
        pass: Boolean(row?.canReview),
      },
    ],
    [proofUrl, row]
  );

  if (!open || !row) return null;

  const approve = async () => {
    if (!reviewEnabled || !confirmed || isMutating) return;
    setValidation("");
    try {
      await onApprove({ paymentId: row.paymentId, payload: { note: note || null } });
      onClose();
    } catch {
      // The mutation error remains visible in the drawer.
    }
  };

  const reject = async () => {
    if (!reviewEnabled || isMutating) return;
    if (!note.trim()) {
      setValidation("Add a clear reason before rejecting this proof.");
      return;
    }
    setValidation("");
    try {
      await onReject({
        paymentId: row.paymentId,
        payload: { reason: note.trim() },
      });
      onClose();
    } catch {
      // The mutation error remains visible in the drawer.
    }
  };

  return (
    <div
      className="s26-pr-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="s26-pr-drawer-title"
    >
      <button
        type="button"
        className="s26-pr-drawer__backdrop"
        aria-label="Dismiss payment proof"
        disabled={isMutating}
        onClick={onClose}
      />
      <aside className="s26-pr-drawer__panel">
        <header className="s26-pr-drawer__header">
          <div>
            <small>Review Proof</small>
            <h2 id="s26-pr-drawer-title" title={row.orderNumber}>{truncateId(row.orderNumber)}</h2>
            <p title={row.suborderNumber}>{truncateId(row.suborderNumber)}</p>
          </div>
          <div className="s26-pr-drawer__header-actions">
            <span className={`s26-pr-chip is-${row.paymentStatusTone}`}>
              {row.paymentStatusLabel}
            </span>
            <span className={`s26-pr-chip is-${row.matchStatus.toLowerCase()}`}>
              {match.label}
            </span>
            <button
              type="button"
              aria-label="Close payment proof"
              disabled={isMutating}
              onClick={onClose}
            >
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="s26-pr-drawer__body">
          <section className="s26-pr-proof-card">
            <h3>1. Proof Preview</h3>
            <div className="s26-pr-proof-preview">
              {proofUrl ? (
                <img
                  src={proofUrl}
                  alt={`Payment proof for ${row.orderNumber}`}
                  style={{ transform: `scale(${zoom / 100})` }}
                />
              ) : (
                <div className="s26-pr-proof-empty">
                  <FileImage size={34} />
                  <strong>Proof image unavailable</strong>
                  <span>Review the submitted metadata before deciding.</span>
                </div>
              )}
            </div>
            <footer>
              <button
                type="button"
                aria-label="Zoom out"
                onClick={() => setZoom((value) => Math.max(75, value - 25))}
              >
                <Minus size={15} />
              </button>
              <strong>{zoom}%</strong>
              <button
                type="button"
                aria-label="Zoom in"
                onClick={() => setZoom((value) => Math.min(175, value + 25))}
              >
                <Plus size={15} />
              </button>
              {proofUrl ? (
                <a href={proofUrl} target="_blank" rel="noreferrer">
                  Open in new tab <ExternalLink size={13} />
                </a>
              ) : null}
            </footer>
          </section>

          <section className="s26-pr-match-card">
            <header>
              <h3>2. Match Summary</h3>
              <span className={`s26-pr-chip is-${row.matchStatus.toLowerCase()}`}>
                {match.label}
              </span>
            </header>
            <dl>
              <div><dt>Buyer Name</dt><dd>{row.buyer.name}</dd></div>
              <div><dt>Expected Amount</dt><dd>{money(row.expectedAmount)}</dd></div>
              <div><dt>Paid Amount</dt><dd>{money(row.paidAmount)}</dd></div>
              <div><dt>Payment Method</dt><dd>{row.paymentMethod}</dd></div>
              <div><dt>Submitted Time</dt><dd>{dateTime(row.submittedAt)}</dd></div>
              <div><dt>Sender / Account</dt><dd>{row.senderAccount}</dd></div>
            </dl>
            <p className={`is-${row.matchStatus.toLowerCase()}`}>
              {row.matchStatus === "MATCHED" ? (
                <CheckCircle2 size={15} />
              ) : (
                <AlertTriangle size={15} />
              )}
              {match.note}
            </p>
          </section>

          <section className="s26-pr-drawer-card">
            <h3>3. Linked Order</h3>
            <dl>
              <div><dt>Order ID</dt><dd title={row.orderNumber}>{truncateId(row.orderNumber)}</dd></div>
              <div><dt>Customer</dt><dd>{row.buyer.name}</dd></div>
              <div><dt>Items</dt><dd>{row.items.length}</dd></div>
              <div><dt>Total Amount</dt><dd>{money(row.expectedAmount)}</dd></div>
              <div><dt>Payment Channel</dt><dd>{row.paymentMethod}</dd></div>
              <div><dt>Fulfillment State</dt><dd>{row.fulfillmentLabel}</dd></div>
            </dl>
            <button
              type="button"
              className="s26-pr-view-order"
              disabled={!orderHref || isMutating}
              onClick={onViewOrder}
            >
              View Order <ExternalLink size={14} />
            </button>
          </section>

          <section className="s26-pr-drawer-card">
            <h3>4. Review Checklist</h3>
            <ul className="s26-pr-checklist">
              {checklist.map((item) => (
                <li className={item.pass ? "is-pass" : "is-warning"} key={item.label}>
                  {item.pass ? <Check size={14} /> : <AlertTriangle size={14} />}
                  {item.label}
                </li>
              ))}
            </ul>
          </section>

          <section className="s26-pr-drawer-card">
            <h3>Activity Timeline</h3>
            <ol className="s26-pr-timeline">
              <li><i /><span>{dateTime(row.submittedAt)}</span><strong>Submitted by buyer</strong></li>
              <li><i /><span>{dateTime(row.transferTime)}</span><strong>Transfer time reported</strong></li>
              {row.reviewedAt ? (
                <li><i /><span>{dateTime(row.reviewedAt)}</span><strong>Review completed</strong></li>
              ) : (
                <li><i /><span>Pending</span><strong>Waiting for seller decision</strong></li>
              )}
            </ol>
          </section>

          <section className="s26-pr-notes">
            <h3>5. Notes / Internal Comment</h3>
            <textarea
              value={note}
              maxLength={500}
              disabled={isMutating}
              placeholder="Add notes or a clear rejection reason..."
              onChange={(event) => {
                setNote(event.target.value);
                setValidation("");
              }}
            />
            <span>{note.length} / 500</span>
            {row.buyerNote ? <p><UserRound size={14} />Buyer note: {row.buyerNote}</p> : null}
          </section>

          <label className="s26-pr-confirm">
            <span><ShieldCheck size={20} /></span>
            <div><strong>Confirm match</strong><small>I have verified the submitted proof details.</small></div>
            <input
              type="checkbox"
              checked={confirmed}
              disabled={!reviewEnabled || isMutating}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <i />
          </label>

          {!reviewEnabled ? (
            <div className="s26-pr-drawer-notice is-warning">
              <AlertTriangle size={16} />
              {!actorCanReview
                ? governanceNote ||
                  "Your seller role can view proofs but cannot approve or reject them."
                : row.reviewReason ||
                  "This payment state is read-only for seller review."}
            </div>
          ) : null}
          {validation ? (
            <div className="s26-pr-drawer-notice is-error">
              <AlertTriangle size={16} />{validation}
            </div>
          ) : null}
          {mutationError ? (
            <div className="s26-pr-drawer-notice is-error">
              <AlertTriangle size={16} />
              {mutationError.message || "Unable to review this payment proof."}
            </div>
          ) : null}
        </div>

        <footer className="s26-pr-drawer__footer">
          <button
            type="button"
            disabled
            title="No backend-approved clarification endpoint is available."
          >
            <MessageCircle size={17} />Request Clarification
          </button>
          <button
            type="button"
            className="is-reject"
            disabled={!reviewEnabled || isMutating}
            onClick={reject}
          >
            <XCircle size={17} />Reject Proof
          </button>
          <button
            type="button"
            className="is-approve"
            disabled={!reviewEnabled || !confirmed || isMutating}
            onClick={approve}
          >
            {isMutating ? <Clock3 size={17} /> : <PackageCheck size={17} />}
            {isMutating ? "Saving..." : "Approve Payment"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
