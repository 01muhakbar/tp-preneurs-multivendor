import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Flag,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  X,
} from "lucide-react";
import { fetchAdminPaymentAudit } from "../../api/adminPaymentAudit.ts";
import { formatCurrency } from "../../utils/format.js";
import "./AdminPaymentAuditPage.css";

const RISK_TABS = [
  { value: "all", label: "All" },
  { value: "urgent", label: "Urgent" },
  { value: "proof_review", label: "Proof Review" },
  { value: "mismatch", label: "Mismatch" },
  { value: "blocked", label: "Blocked" },
  { value: "clear", label: "Clear" },
];

const PARENT_PAYMENT_OPTIONS = [
  { value: "", label: "All" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REFUNDED", label: "Refunded" },
];

const PROOF_REVIEW_OPTIONS = [
  { value: "", label: "All" },
  { value: "APPROVED", label: "Approved" },
  { value: "PENDING", label: "Pending" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NO_PROOF", label: "No Proof" },
];

const CHECKOUT_MODE_OPTIONS = [
  { value: "", label: "All" },
  { value: "SINGLE_STORE", label: "Single Store" },
  { value: "MULTI_STORE", label: "Multi-Store" },
];

const PAID_LIKE = new Set(["PAID", "APPROVED", "SETTLED", "SUCCESS", "COMPLETED"]);
const REVIEW_LIKE = new Set(["PENDING", "UNDER_REVIEW", "NEEDS_REVIEW", "SUBMITTED"]);
const BLOCKED_LIKE = new Set(["BLOCKED", "FAILED", "REJECTED", "EXPIRED", "CANCELLED"]);
const BACKEND_PARENT_FILTERS = new Set(["PAID", "UNPAID", "PARTIALLY_PAID"]);
const BACKEND_REVIEW_FILTERS = new Set(["PENDING", "APPROVED", "REJECTED"]);

const text = (value, fallback = "-") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeStatus = (value, fallback = "UNKNOWN") => text(value, fallback).toUpperCase();

const isPaidLike = (value) => PAID_LIKE.has(normalizeStatus(value));
const isReviewLike = (value) => REVIEW_LIKE.has(normalizeStatus(value));
const isBlockedLike = (value) => BLOCKED_LIKE.has(normalizeStatus(value));

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const initials = (value) =>
  text(value, "NA")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const labelize = (value, fallback = "Unknown") =>
  text(value, fallback)
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const getOrderNumber = (entry) =>
  text(
    entry?.invoiceNo ||
      entry?.invoiceNumber ||
      entry?.orderNumber ||
      entry?.orderNo ||
      entry?.order?.invoiceNo ||
      entry?.order?.invoiceNumber ||
      entry?.order?.orderNumber ||
      entry?.id
  );

const getOrderId = (entry) =>
  entry?.orderId || entry?.id || entry?.order?.id || entry?.order?.orderId || getOrderNumber(entry);

const getBuyer = (entry) => {
  const source = entry?.customer || entry?.buyer || entry?.user || entry?.order?.customer || {};
  return {
    name: text(entry?.buyerName || source.name || entry?.customerName, "Guest"),
    email: entry?.buyerEmail || source.email || entry?.customerEmail || null,
  };
};

const getParentPayment = (entry) => {
  const payment = entry?.parentPayment || entry?.payment || entry?.order?.payment || {};
  const status = normalizeStatus(
    payment.status || entry?.paymentStatus || entry?.parentPaymentStatus,
    "UNKNOWN"
  );
  return {
    reference: text(
      payment.internalReference ||
        payment.externalReference ||
        payment.reference ||
        entry?.paymentReference ||
        entry?.parentPaymentReference ||
        `PP-${getOrderId(entry)}`
    ),
    amount: Number(payment.amount || entry?.grandTotal || entry?.totalAmount || 0),
    status,
    label: entry?.paymentStatusMeta?.label || payment.statusMeta?.label || labelize(status),
    tone: entry?.paymentStatusMeta?.tone || payment.statusMeta?.tone || getStatusTone(status),
  };
};

const getSplitStatus = (entry) => {
  const counts = entry?.operationalCounts || entry?.counts || {};
  const paid = Number(counts.paidSuborders || 0);
  const pending = Number(counts.pendingSuborders || 0);
  const unpaid = Number(counts.unpaidSuborders || 0);
  const rejected = Number(counts.rejectedPayments || 0) + Number(counts.finalNegativeSuborders || 0);

  if (entry?.splitStatus || entry?.splitPaymentStatus) {
    return normalizeStatus(entry.splitStatus || entry.splitPaymentStatus);
  }
  if (rejected > 0) return "BLOCKED";
  if (pending > 0) return "PENDING";
  if (unpaid > 0) return paid > 0 ? "MISMATCH" : "PENDING";
  if (paid > 0) return "PAID";
  return normalizeStatus(entry?.paymentStatus, "UNKNOWN");
};

const getProofReviewStatus = (entry) => {
  const proof =
    entry?.proof ||
    entry?.paymentProof ||
    entry?.parentPayment?.proof ||
    entry?.payment?.proof ||
    entry?.latestProof ||
    {};
  const explicit = proof.reviewStatus || entry?.proofReviewStatus || entry?.reviewStatus;
  if (explicit) return normalizeStatus(explicit);

  const counts = entry?.operationalCounts || entry?.counts || {};
  if (Number(counts.rejectedPayments || 0) > 0) return "REJECTED";
  if (Number(counts.pendingSuborders || 0) > 0) return "UNDER_REVIEW";
  if (Number(counts.paidSuborders || 0) > 0) return "APPROVED";
  return "NO_PROOF";
};

const getCheckoutMode = (entry) => {
  const mode = normalizeStatus(entry?.checkoutMode || entry?.order?.checkoutMode, "SINGLE_STORE");
  if (mode === "MULTI_STORE") return { code: mode, label: "Multi-Store" };
  return { code: "SINGLE_STORE", label: "Single Store" };
};

const getStores = (entry) => {
  const candidates = entry?.stores || entry?.storeSummaries || entry?.suborders || entry?.split?.groups;
  if (Array.isArray(candidates) && candidates.length) {
    return candidates.map((item, index) => {
      const store = item?.store || item;
      return {
        id: store?.id || store?.storeId || item?.storeId || index + 1,
        name: text(store?.name || store?.storeName || item?.storeName, `Store ${index + 1}`),
      };
    });
  }
  const count = Math.max(0, Number(entry?.totalStores || entry?.storeCount || 0));
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Store ${index + 1}`,
  }));
};

const getUpdatedAt = (entry) =>
  entry?.updatedAt || entry?.payment?.updatedAt || entry?.parentPayment?.updatedAt || entry?.order?.updatedAt || entry?.createdAt;

function getStatusTone(status) {
  const value = normalizeStatus(status, "UNKNOWN");
  if (PAID_LIKE.has(value)) return "success";
  if (REVIEW_LIKE.has(value)) return "warning";
  if (["MISMATCH", "REVIEW"].includes(value)) return "info";
  if (BLOCKED_LIKE.has(value)) return "danger";
  if (["NONE", "NO_PROOF", "UNKNOWN"].includes(value)) return "neutral";
  return "neutral";
}

const getRisk = (entry) => {
  const parent = getParentPayment(entry).status;
  const split = getSplitStatus(entry);
  const proof = getProofReviewStatus(entry);
  const explicit = normalizeStatus(entry?.risk || entry?.riskLevel || "", "");

  if (explicit && explicit !== "UNKNOWN") {
    return explicit === "PROOF_REVIEW" ? "proof_review" : explicit.toLowerCase();
  }
  if (isBlockedLike(parent) || isBlockedLike(split) || isBlockedLike(proof)) return "blocked";
  if (isReviewLike(proof)) return "proof_review";
  if (parent !== split && !(isPaidLike(parent) && isPaidLike(split))) return "mismatch";
  if (!isPaidLike(parent) || !isPaidLike(split)) return "urgent";
  return "clear";
};

const getRiskRank = (risk) =>
  ({ blocked: 5, mismatch: 4, proof_review: 3, urgent: 2, clear: 0 }[risk] ?? 1);

function Badge({ children, tone = "neutral" }) {
  return <span className={`paa-badge paa-badge--${tone}`}>{children}</span>;
}

function KpiCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <section className={`paa-kpi paa-kpi--${tone}`}>
      <span className="paa-kpi__icon" aria-hidden="true">
        <Icon size={28} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </section>
  );
}

function SkeletonRows() {
  return (
    <div className="paa-table-wrap">
      <table className="paa-table">
        <tbody>
          {Array.from({ length: 6 }).map((_, index) => (
            <tr key={index}>
              {Array.from({ length: 9 }).map((__, cellIndex) => (
                <td key={cellIndex}>
                  <span className="paa-skeleton" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="paa-empty">
      <ShieldCheck size={30} aria-hidden="true" />
      <strong>No payment audit rows</strong>
      <span>Try a different filter.</span>
      <button type="button" onClick={onReset}>
        Reset filters
      </button>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="paa-error">
      <Flag size={30} aria-hidden="true" />
      <strong>Failed to load payment audit</strong>
      <span>{message}</span>
      <button type="button" onClick={onRetry}>
        <RefreshCw size={16} aria-hidden="true" />
        Retry
      </button>
    </div>
  );
}

export default function AdminPaymentAuditPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [riskFilter, setRiskFilter] = useState("all");
  const [draft, setDraft] = useState({
    search: searchParams.get("search") || "",
    paymentStatus: searchParams.get("paymentStatus") || "",
    reviewStatus: searchParams.get("reviewStatus") || "",
    checkoutMode: searchParams.get("checkoutMode") || "",
    storeId: searchParams.get("storeId") || "",
  });

  const params = useMemo(() => {
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const pageSize = Math.max(1, Number(searchParams.get("pageSize") || 10));
    const paymentStatus = searchParams.get("paymentStatus") || "";
    const reviewStatus = searchParams.get("reviewStatus") || "";

    return {
      page,
      pageSize,
      search: searchParams.get("search") || "",
      paymentStatus: BACKEND_PARENT_FILTERS.has(paymentStatus) ? paymentStatus : "",
      reviewStatus: BACKEND_REVIEW_FILTERS.has(reviewStatus) ? reviewStatus : "",
      checkoutMode: searchParams.get("checkoutMode") || "",
      storeId: searchParams.get("storeId") || "",
      uiPaymentStatus: paymentStatus,
      uiReviewStatus: reviewStatus,
    };
  }, [searchParams]);

  const queryParams = useMemo(
    () => ({
      page: params.page,
      pageSize: params.pageSize,
      search: params.search,
      paymentStatus: params.paymentStatus,
      reviewStatus: params.reviewStatus,
      checkoutMode: params.checkoutMode,
      storeId: params.storeId,
    }),
    [params]
  );

  const auditQuery = useQuery({
    queryKey: ["admin", "payment-audit", queryParams],
    queryFn: () => fetchAdminPaymentAudit(queryParams),
  });

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      const normalized = String(value ?? "").trim();
      if (!normalized) next.delete(key);
      else next.set(key, normalized);
    });
    if (!Object.prototype.hasOwnProperty.call(patch, "page")) next.set("page", "1");
    setSearchParams(next);
  };

  const applyFilters = () => updateParams(draft);

  const resetFilters = () => {
    setDraft({ search: "", paymentStatus: "", reviewStatus: "", checkoutMode: "", storeId: "" });
    setRiskFilter("all");
    setSearchParams(new URLSearchParams({ page: "1", pageSize: String(params.pageSize || 10) }));
  };

  const items = Array.isArray(auditQuery.data?.items) ? auditQuery.data.items : [];
  const meta = auditQuery.data || { total: 0, page: 1, pageSize: 10, totalPages: 1 };

  const locallyFilteredItems = useMemo(() => {
    return items.filter((entry) => {
      if (params.uiPaymentStatus && !BACKEND_PARENT_FILTERS.has(params.uiPaymentStatus)) {
        if (getParentPayment(entry).status !== params.uiPaymentStatus) return false;
      }
      if (params.uiReviewStatus && !BACKEND_REVIEW_FILTERS.has(params.uiReviewStatus)) {
        if (getProofReviewStatus(entry) !== params.uiReviewStatus) return false;
      }
      if (riskFilter !== "all" && getRisk(entry) !== riskFilter) return false;
      return true;
    });
  }, [items, params.uiPaymentStatus, params.uiReviewStatus, riskFilter]);

  const summary = useMemo(() => {
    return items.reduce(
      (acc, entry) => {
        const risk = getRisk(entry);
        const parent = getParentPayment(entry).status;
        const split = getSplitStatus(entry);
        const proof = getProofReviewStatus(entry);

        if (risk !== "clear") acc.flagged += 1;
        if (isPaidLike(parent)) acc.paid += 1;
        if (isReviewLike(proof)) acc.proofReview += 1;
        if (parent !== split && !(isPaidLike(parent) && isPaidLike(split))) acc.mismatch += 1;
        acc[risk] = (acc[risk] || 0) + 1;
        return acc;
      },
      {
        flagged: 0,
        paid: 0,
        proofReview: 0,
        mismatch: 0,
        urgent: 0,
        proof_review: 0,
        blocked: 0,
        clear: 0,
      }
    );
  }, [items]);

  const clearCount = summary.clear || 0;
  const attentionCount = items.length - clearCount;
  const start = meta.total ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const end = Math.min(meta.total || items.length, (meta.page || 1) * (meta.pageSize || 10));
  const totalPages = Math.max(1, Number(meta.totalPages || 1));

  return (
    <div className="admin-payment-audit-page">
      <section className="paa-hero">
        <div>
          <span className="paa-eyebrow">Online Store</span>
          <h1>Payment Audit</h1>
          <p>Split payment review and order truth.</p>
          <div className="paa-hero__badges">
            <Badge tone="success">Ready</Badge>
            <Badge tone="success">Verified</Badge>
          </div>
        </div>
        <div className="paa-hero__actions">
          <span className="paa-total">{meta.total || 0} orders</span>
          <button type="button" className="paa-refresh" onClick={() => auditQuery.refetch()}>
            <RefreshCw size={17} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </section>

      <section className="paa-kpis">
        <KpiCard icon={Flag} label="Flagged" value={summary.flagged} helper="Need attention" tone="red" />
        <KpiCard icon={CheckCircle2} label="Paid" value={summary.paid} helper="Confirmed as paid" tone="green" />
        <KpiCard icon={Eye} label="Proof Review" value={summary.proofReview} helper="Awaiting proof" tone="amber" />
        <KpiCard icon={ShieldCheck} label="Mismatch" value={summary.mismatch} helper="Mismatch detected" tone="blue" />
      </section>

      <section className="paa-risk">
        <div className="paa-risk__tabs">
          <h2>
            <ShieldCheck size={18} aria-hidden="true" />
            Risk Queue
          </h2>
          <div>
            {RISK_TABS.map((tab) => {
              const count = tab.value === "all" ? items.length : summary[tab.value] || 0;
              return (
                <button
                  key={tab.value}
                  type="button"
                  className={riskFilter === tab.value ? "is-active" : ""}
                  onClick={() => setRiskFilter(tab.value)}
                >
                  {tab.label}
                  {count > 0 ? <span>{count}</span> : null}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`paa-risk-banner ${attentionCount > 0 ? "is-attention" : ""}`}>
          <div className="paa-spark" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div>
            <strong>
              {attentionCount > 0
                ? `${attentionCount} orders need attention`
                : "Audit queue looks healthy"}
            </strong>
            <p>{clearCount} orders are clear</p>
          </div>
          <button type="button" aria-label="Dismiss banner">
            <X size={18} />
          </button>
        </div>
      </section>

      <section className="paa-filters">
        <label>
          <span>Search Order / Buyer</span>
          <div className="paa-search-field">
            <Search size={18} aria-hidden="true" />
            <input
              value={draft.search}
              onChange={(event) => setDraft((value) => ({ ...value, search: event.target.value }))}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilters();
              }}
              placeholder="Order # or buyer name..."
            />
          </div>
        </label>
        <label>
          <span>Parent Payment</span>
          <select
            value={draft.paymentStatus}
            onChange={(event) => setDraft((value) => ({ ...value, paymentStatus: event.target.value }))}
          >
            {PARENT_PAYMENT_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Proof Review</span>
          <select
            value={draft.reviewStatus}
            onChange={(event) => setDraft((value) => ({ ...value, reviewStatus: event.target.value }))}
          >
            {PROOF_REVIEW_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Checkout Mode</span>
          <select
            value={draft.checkoutMode}
            onChange={(event) => setDraft((value) => ({ ...value, checkoutMode: event.target.value }))}
          >
            {CHECKOUT_MODE_OPTIONS.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Store ID</span>
          <input
            value={draft.storeId}
            onChange={(event) => setDraft((value) => ({ ...value, storeId: event.target.value }))}
            placeholder="All"
            inputMode="numeric"
          />
        </label>
        <button type="button" className="paa-search-button" onClick={applyFilters}>
          <Search size={17} aria-hidden="true" />
          Search
        </button>
        <button type="button" className="paa-reset-button" onClick={resetFilters}>
          Reset
        </button>
      </section>

      <section className="paa-table-card">
        {auditQuery.isLoading ? <SkeletonRows /> : null}
        {auditQuery.isError ? (
          <ErrorState
            message={
              auditQuery.error?.response?.data?.message ||
              auditQuery.error?.message ||
              "Please retry."
            }
            onRetry={() => auditQuery.refetch()}
          />
        ) : null}
        {!auditQuery.isLoading && !auditQuery.isError && items.length === 0 ? (
          <EmptyState onReset={resetFilters} />
        ) : null}
        {!auditQuery.isLoading && !auditQuery.isError && items.length > 0 ? (
          <div className="paa-table-wrap">
            <table className="paa-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Buyer</th>
                  <th>Parent Payment</th>
                  <th>Split Status</th>
                  <th>Proof Review</th>
                  <th>Checkout Mode</th>
                  <th>Stores</th>
                  <th>Updated</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {locallyFilteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState onReset={resetFilters} />
                    </td>
                  </tr>
                ) : null}
                {locallyFilteredItems.map((entry) => {
                  const orderNumber = getOrderNumber(entry);
                  const orderId = getOrderId(entry);
                  const buyer = getBuyer(entry);
                  const parent = getParentPayment(entry);
                  const split = getSplitStatus(entry);
                  const proof = getProofReviewStatus(entry);
                  const mode = getCheckoutMode(entry);
                  const stores = getStores(entry);
                  const visibleStores = stores.slice(0, 2);

                  return (
                    <tr key={orderId}>
                      <td>
                        <strong>{orderNumber}</strong>
                        <span>{formatDateTime(entry?.createdAt)}</span>
                      </td>
                      <td>
                        <div className="paa-buyer">
                          <span>{initials(buyer.name)}</span>
                          <div>
                            <strong>{buyer.name}</strong>
                            <small>{buyer.email || "-"}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{parent.reference}</strong>
                        <span>{formatCurrency(parent.amount)}</span>
                      </td>
                      <td>
                        <Badge tone={getStatusTone(split)}>{labelize(split)}</Badge>
                      </td>
                      <td>
                        <Badge tone={getStatusTone(proof)}>{labelize(proof)}</Badge>
                      </td>
                      <td>{mode.label}</td>
                      <td>
                        <div className="paa-stores">
                          {visibleStores.map((store) => (
                            <span key={`${orderId}-${store.id}`} title={store.name}>
                              <Store size={14} aria-hidden="true" />
                            </span>
                          ))}
                          {stores.length > 2 ? <b>+{stores.length - 2}</b> : null}
                        </div>
                      </td>
                      <td>{formatDateTime(getUpdatedAt(entry))}</td>
                      <td>
                        <Link
                          className="paa-action"
                          to={`/admin/online-store/payment-audit/${encodeURIComponent(String(orderId))}`}
                          aria-label={`Open payment audit ${orderNumber}`}
                        >
                          <MoreHorizontal size={20} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      <section className="paa-pagination">
        <p>
          Showing {start} to {end} of {meta.total || 0} orders
        </p>
        <div>
          <select
            value={String(meta.pageSize || params.pageSize || 10)}
            onChange={(event) => updateParams({ pageSize: event.target.value, page: 1 })}
          >
            <option value="10">10 / page</option>
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
          <button
            type="button"
            disabled={(meta.page || 1) <= 1}
            onClick={() => updateParams({ page: Math.max(1, (meta.page || 1) - 1) })}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <span>{meta.page || 1}</span>
          <button
            type="button"
            disabled={(meta.page || 1) >= totalPages}
            onClick={() => updateParams({ page: Math.min(totalPages, (meta.page || 1) + 1) })}
            aria-label="Next page"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
