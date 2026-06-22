import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  Banknote,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileImage,
  Grid2X2,
  List,
  MoreVertical,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";
import Seller2026PaymentProofDrawer from "../../components/seller2026/paymentReview/Seller2026PaymentProofDrawer.jsx";
import { useSeller2026PaymentReview } from "../../hooks/seller2026/useSeller2026PaymentReview.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { downloadCsvFile } from "../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/Seller2026PaymentReview.css";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

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

const roleLabel = (value) =>
  String(value || "Seller")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const matchLabel = {
  MATCHED: "Matched",
  NEEDS_REVIEW: "Needs Review",
  RISK_FLAG: "Risk Flag",
};

export default function Seller2026LivePaymentReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sellerContext, workspaceStoreId: storeId, workspaceRoutes } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("ORDER_READ") && can("PAYMENT_REVIEW_READ");
  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "awaiting",
    paymentMethod: searchParams.get("paymentMethod") || "all",
    matchStatus: searchParams.get("matchStatus") || "all",
    reviewer: searchParams.get("reviewer") || "all",
    dateFrom: searchParams.get("dateFrom") || "",
    dateTo: searchParams.get("dateTo") || "",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };
  const review = useSeller2026PaymentReview(storeId, query, {
    enabled: canView,
    canReview: canView,
  });
  const [view, setView] = useState("table");
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [notice, setNotice] = useState(null);
  const selectedRow = useMemo(
    () =>
      review.data.rows.find(
        (row) => String(row.paymentId) === String(selectedPaymentId)
      ) || null,
    [review.data.rows, selectedPaymentId]
  );
  const selectedOrderHref = selectedRow
    ? workspaceRoutes.orderDetail(selectedRow.suborderId)
    : "";

  const changeQuery = (patch) => {
    const next = new URLSearchParams(searchParams);
    const values = {
      ...patch,
      ...(Object.prototype.hasOwnProperty.call(patch, "page")
        ? {}
        : { page: 1 }),
    };
    Object.entries(values).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key;
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all" ||
        (paramKey === "page" && Number(value) <= 1) ||
        (paramKey === "limit" && Number(value) === 10)
      ) {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(value));
      }
    });
    setSearchParams(next);
  };

  const reset = () => {
    setSearchParams(new URLSearchParams());
    setNotice(null);
  };

  const exportQueue = () => {
    downloadCsvFile(
      [
        { key: "order", label: "Order" },
        { key: "buyer", label: "Buyer" },
        { key: "method", label: "Payment Method" },
        { key: "submitted", label: "Submitted" },
        { key: "match", label: "Match Check" },
        { key: "amount", label: "Amount" },
        { key: "status", label: "Status" },
      ],
      review.data.rows.map((row) => ({
        order: row.orderNumber,
        buyer: row.buyer.name,
        method: row.paymentMethod,
        submitted: dateTime(row.submittedAt),
        match: matchLabel[row.matchStatus],
        amount: row.expectedAmount,
        status: row.paymentStatusLabel,
      })),
      `seller-payment-review-${new Date().toISOString().slice(0, 10)}.csv`
    );
    setNotice({
      type: "success",
      text: `${review.data.rows.length} visible payment proof(s) exported.`,
    });
    toast.success(`${review.data.rows.length} visible payment proof(s) exported.`);
  };

  const mutationSucceeded = (message) => {
    setSelectedPaymentId(null);
    setNotice({ type: "success", text: message });
    toast.success(message);
  };

  const mutationFailed = (error) => {
    const message = error?.message || "Unable to review this payment proof.";
    setNotice({ type: "error", text: message });
    toast.error(message);
    throw error;
  };

  if (!canView) {
    return (
      <div className="s26-pr">
        <div className="s26-pr-state is-error">
          <AlertTriangle size={24} />
          <h1>Payment review access is unavailable</h1>
          <p>This page requires both order and payment-status visibility.</p>
        </div>
      </div>
    );
  }

  if (review.isLoading) {
    return (
      <div className="s26-pr">
        <div className="s26-pr-skeleton is-heading" />
        <div className="s26-pr-summary">
          {[1, 2, 3, 4].map((item) => (
            <div className="s26-pr-skeleton is-card" key={item} />
          ))}
        </div>
        <div className="s26-pr-skeleton is-table" />
      </div>
    );
  }

  if (review.isError) {
    return (
      <div className="s26-pr">
        <div className="s26-pr-state is-error">
          <AlertTriangle size={24} />
          <h1>Unable to load payment review</h1>
          <p>{review.error?.message || "Try again."}</p>
          <button type="button" onClick={() => review.refetch()}>Retry</button>
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Awaiting Review", value: review.data.summary.awaiting, icon: Clock3, tone: "amber", note: "Proofs waiting for a decision" },
    { label: "Approved Today", value: review.data.summary.approvedToday, icon: CheckCircle2, tone: "green", note: "Verified seller payments" },
    { label: "Rejected Today", value: review.data.summary.rejectedToday, icon: XCircle, tone: "red", note: "Proofs returned to buyers" },
    { label: "Total Verified Amount", value: money(review.data.summary.verifiedAmount), icon: Banknote, tone: "blue", note: "Across visible paid records" },
  ];
  const tabs = [
    ["awaiting", "Awaiting", review.data.counts.awaiting],
    ["approved", "Approved", review.data.counts.approved],
    ["rejected", "Rejected", review.data.counts.rejected],
    ["all", "All", review.data.counts.all],
  ];

  return (
    <div className="s26-pr">
      <nav className="s26-pr-breadcrumb" aria-label="Breadcrumb">
        <span>Stores</span><i>/</i>
        <span>{sellerContext?.store?.name || "Active Store"}</span><i>/</i>
        <span>Finance</span><i>/</i><strong>Payment Review</strong>
      </nav>

      <header className="s26-pr-header">
        <div>
          <h1>Payment Review</h1>
          <p>Review incoming payment proofs, verify matching orders, and record clear seller decisions.</p>
        </div>
        <div className="s26-pr-header__actions">
          <span>{review.data.store.name || sellerContext?.store?.name}</span>
          <span className={review.canReview ? "is-green" : "is-amber"}>
            {review.canReview ? "Can review" : "View only"}
          </span>
          <span className="is-blue">{roleLabel(review.data.governance.roleCode)}</span>
          <button type="button" onClick={exportQueue}><Download size={17} />Export Queue</button>
        </div>
      </header>

      {notice ? (
        <div className={`s26-pr-notice is-${notice.type}`}>
          {notice.type === "success" ? <Check size={16} /> : <AlertTriangle size={16} />}
          {notice.text}
        </div>
      ) : null}

      <section className="s26-pr-summary">
        {cards.map(({ label, value, icon: Icon, tone, note }) => (
          <article key={label}>
            <span className={`is-${tone}`}><Icon size={26} /></span>
            <div><small>{label}</small><strong>{value}</strong><em>{note}</em></div>
          </article>
        ))}
      </section>

      <section className="s26-pr-panel">
        <div className="s26-pr-tabs">
          <div>
            {tabs.map(([value, label, count]) => (
              <button
                type="button"
                className={query.status === value ? "is-active" : ""}
                key={value}
                onClick={() => changeQuery({ status: value })}
              >
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
          <div className="s26-pr-view">
            <span>View:</span>
            <button type="button" className={view === "table" ? "is-active" : ""} onClick={() => setView("table")}><List size={16} />Table</button>
            <button type="button" className={view === "board" ? "is-active" : ""} onClick={() => setView("board")}><Grid2X2 size={15} />Board</button>
            <button type="button" onClick={reset}><RotateCcw size={15} />Reset</button>
          </div>
        </div>

        <div className="s26-pr-filters">
          <label className="s26-pr-search"><Search size={17} /><input value={query.search} placeholder="Search by order ID, buyer, or notes..." onChange={(event) => changeQuery({ search: event.target.value })} /></label>
          <label><span>Payment Method</span><select value={query.paymentMethod} onChange={(event) => changeQuery({ paymentMethod: event.target.value })}><option value="all">All Methods</option><option value="qris">QRIS</option><option value="bank">Bank Transfer</option></select></label>
          <label><span>Match Status</span><select value={query.matchStatus} onChange={(event) => changeQuery({ matchStatus: event.target.value })}><option value="all">All Statuses</option><option value="MATCHED">Matched</option><option value="NEEDS_REVIEW">Needs Review</option><option value="RISK_FLAG">Risk Flag</option></select></label>
          <div className="s26-pr-date"><input type="date" aria-label="Date from" value={query.dateFrom} onChange={(event) => changeQuery({ dateFrom: event.target.value })} /><i>-</i><input type="date" aria-label="Date to" value={query.dateTo} onChange={(event) => changeQuery({ dateTo: event.target.value })} /></div>
          <label><span>Reviewer</span><select value={query.reviewer} onChange={(event) => changeQuery({ reviewer: event.target.value })}><option value="all">All Reviewers</option><option value="reviewed">Reviewed</option><option value="unreviewed">Unreviewed</option></select></label>
        </div>

        {review.data.rows.length === 0 ? (
          <div className="s26-pr-empty">
            <FileImage size={34} />
            <h2>No payment proofs found</h2>
            <p>New checkout proofs will appear here when they match the selected queue and filters.</p>
            <button type="button" onClick={reset}>Reset Filters</button>
          </div>
        ) : view === "table" ? (
          <div className="s26-pr-table-wrap">
            <table className="s26-pr-table">
              <thead><tr><th>Proof</th><th>Order</th><th>Buyer</th><th>Payment</th><th>Submitted</th><th>Match Check</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {review.data.rows.map((row) => {
                  const proof = resolveAssetUrl(row.proofUrl);
                  return (
                    <tr key={row.paymentId}>
                      <td><button type="button" className="s26-pr-proof-thumb" onClick={() => setSelectedPaymentId(row.paymentId)}>{proof ? <img src={proof} alt="" /> : <FileImage size={20} />}</button></td>
                      <td><button type="button" className="s26-pr-order" onClick={() => setSelectedPaymentId(row.paymentId)}>{row.orderNumber}</button><small>{row.suborderNumber}</small></td>
                      <td><div className="s26-pr-buyer"><span>{row.buyer.initials}</span><div><strong>{row.buyer.name}</strong><small>{row.buyer.email || row.buyer.phone || "Buyer"}</small></div></div></td>
                      <td><strong>{row.paymentMethod}</strong><small>{row.paymentReference}</small></td>
                      <td><span>{dateTime(row.submittedAt)}</span></td>
                      <td><span className={`s26-pr-chip is-${row.matchStatus.toLowerCase()}`}>{matchLabel[row.matchStatus]}</span></td>
                      <td><strong>{money(row.expectedAmount)}</strong></td>
                      <td><span className={`s26-pr-chip is-${row.paymentStatusTone}`}>{row.paymentStatusLabel}</span></td>
                      <td><div className="s26-pr-actions"><button type="button" className={row.canReview && review.canReview ? "is-primary" : ""} onClick={() => setSelectedPaymentId(row.paymentId)}>{row.canReview && review.canReview ? "Review" : "View"}</button><button type="button" disabled title="Additional payment actions are not enabled"><MoreVertical size={17} /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="s26-pr-board">
            {[
              ["awaiting", "Awaiting Review", "PENDING_CONFIRMATION"],
              ["approved", "Approved", "PAID"],
              ["rejected", "Rejected", "REJECTED"],
            ].map(([columnKey, label, status]) => {
              const columnRows = review.data.rows.filter((row) => row.paymentStatus === status);
              return (
                <section className={`s26-pr-board-column is-${columnKey}`} key={columnKey}>
                  <header>
                    <strong>{label}</strong>
                    <span>{columnRows.length}</span>
                    <MoreVertical size={16} />
                  </header>
                  <div>
                    {columnRows.length === 0 ? (
                      <div className="s26-pr-board-empty">
                        {status === "PAID" ? <CheckCircle2 size={28} /> : status === "REJECTED" ? <XCircle size={28} /> : <Clock3 size={28} />}
                        <strong>No {label.toLowerCase()} payments</strong>
                        <span>{label} payments will appear here</span>
                      </div>
                    ) : columnRows.map((row) => {
                      const proof = resolveAssetUrl(row.proofUrl);
                      return (
                        <article key={row.paymentId}>
                          <button type="button" className="s26-pr-board-card" onClick={() => setSelectedPaymentId(row.paymentId)}>
                            <span className="s26-pr-board-proof">{proof ? <img src={proof} alt="" /> : <FileImage size={20} />}</span>
                            <span>
                              <strong>{row.orderNumber}</strong>
                              <small>{row.buyer.name}</small>
                              <em>{row.paymentMethod}</em>
                              <small>{dateTime(row.submittedAt)}</small>
                            </span>
                            <b>{money(row.expectedAmount)}</b>
                          </button>
                          <footer>
                            <span className={`s26-pr-chip is-${row.paymentStatusTone}`}>{row.paymentStatusLabel}</span>
                            <button type="button" onClick={() => setSelectedPaymentId(row.paymentId)}>
                              {row.canReview && review.canReview ? "Review Proof" : "View Proof"}
                            </button>
                          </footer>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        <footer className="s26-pr-pagination">
          <span>Showing {review.data.rows.length} of {review.data.pagination.total} proofs</span>
          <div>
            <label>Rows per page<select value={query.limit} onChange={(event) => changeQuery({ limit: Number(event.target.value), page: 1 })}><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label>
            <button type="button" disabled={query.page <= 1} onClick={() => changeQuery({ page: query.page - 1 })}><ChevronLeft size={16} /></button>
            <strong>{review.data.pagination.page}</strong>
            <button type="button" disabled={query.page >= review.data.pagination.totalPages} onClick={() => changeQuery({ page: query.page + 1 })}><ChevronRight size={16} /></button>
          </div>
        </footer>
      </section>

      <Seller2026PaymentProofDrawer
        open={Boolean(selectedRow)}
        row={selectedRow}
        actorCanReview={review.canReview}
        governanceNote={review.data.governance.note}
        isMutating={review.isMutating}
        mutationError={review.mutationError}
        orderHref={selectedOrderHref}
        onClose={() => setSelectedPaymentId(null)}
        onViewOrder={() => {
          if (!selectedOrderHref) return;
          setSelectedPaymentId(null);
          navigate(selectedOrderHref);
        }}
        onApprove={async (variables) => {
          try {
            await review.approvePayment(variables);
            mutationSucceeded("Payment proof approved. The review queue is refreshing.");
          } catch (error) {
            mutationFailed(error);
          }
        }}
        onReject={async (variables) => {
          try {
            await review.rejectPayment(variables);
            mutationSucceeded("Payment proof rejected. The review queue is refreshing.");
          } catch (error) {
            mutationFailed(error);
          }
        }}
      />
    </div>
  );
}
