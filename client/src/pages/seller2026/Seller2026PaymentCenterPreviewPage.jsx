import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  Eye,
  Grid2X2,
  List,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { useSellerWorkspace2026PaymentCenter } from "../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026PaymentCenter.js";
import WithdrawalStatusTimeline from "../../components/withdrawals/WithdrawalStatusTimeline.jsx";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { getWithdrawalFinancials, getWithdrawalStatusMeta } from "../../lib/withdrawalStatus.js";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/SellerWorkspace2026.css";

const readNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const currency = (value) =>
  `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(Number(value || 0))}`;

const dateLabel = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const normalizeText = (value) => String(value || "").trim();
const maskAccountNumber = (value) => {
  const normalized = normalizeText(value).replace(/\s+/g, "");
  if (!normalized) return "-";
  if (normalized.length <= 4) return normalized;
  return `${"*".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
};

const statusTone = (value) => {
  const normalized = normalizeText(value).toLowerCase();
  if (["verified", "completed", "active", "ready", "approved"].some((item) => normalized.includes(item))) {
    return "success";
  }
  if (["pending", "review", "processing", "submitted"].some((item) => normalized.includes(item))) {
    return "warning";
  }
  if (["rejected", "failed", "inactive", "missing"].some((item) => normalized.includes(item))) {
    return "danger";
  }
  return "neutral";
};

function Pill({ children }) {
  return <span className={`seller2026-pill seller2026-pill--${statusTone(children)}`}>{children || "-"}</span>;
}

function PaymentCenterSkeleton() {
  return (
    <div className="seller2026-dashboard seller2026-payment-center" aria-label="Loading payment center">
      <div className="seller2026-skeleton" />
      <div className="seller2026-skeleton seller2026-skeleton--hero" />
    </div>
  );
}

export function Seller2026PaymentCenterPreviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreSlug, isId = false } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("PAYMENT_STATUS_VIEW") || can("PAYMENT_PROFILE_VIEW");
  const {
    data,
    loading,
    error,
    usingFallback,
    selectedPaymentId,
    setSelectedPaymentId,
    refetch,
    actions,
    actionState,
    withdrawals,
    withdrawalMeta,
  } = useSellerWorkspace2026PaymentCenter(workspaceStoreSlug);
  const [reviewNote, setReviewNote] = useState("");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [view, setView] = useState("list");

  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    method: searchParams.get("method") || "all",
    page: readNumber(searchParams.get("page"), 1),
    limit: readNumber(searchParams.get("limit"), 10),
  };

  const reviews = Array.isArray(data?.paymentReviews) ? data.paymentReviews : [];
  const methods = useMemo(() => {
    const unique = new Set(reviews.map((row) => normalizeText(row.method)).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [reviews]);

  const statuses = useMemo(() => {
    const unique = new Set(reviews.map((row) => normalizeText(row.status)).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    const needle = normalizeText(query.search).toLowerCase();
    return reviews.filter((row) => {
      const searchable = [
        row.invoiceNumber,
        row.orderId,
        row.buyerName,
        row.buyerEmail,
        row.buyerPhone,
        row.method,
        row.status,
      ]
        .map((item) => normalizeText(item).toLowerCase())
        .join(" ");
      const statusOk = query.status === "all" || normalizeText(row.status) === query.status;
      const methodOk = query.method === "all" || normalizeText(row.method) === query.method;
      return (!needle || searchable.includes(needle)) && statusOk && methodOk;
    });
  }, [query.method, query.search, query.status, reviews]);

  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / query.limit));
  const safePage = Math.min(query.page, totalPages);
  const pagedReviews = filteredReviews.slice((safePage - 1) * query.limit, safePage * query.limit);
  const selectedReview = reviews.find((row) => row.id === selectedPaymentId);
  const payoutActive = data?.payoutProfile?.activationStatus === "Active";
  const availableBalance =
    withdrawalMeta?.balance?.availableBalance ??
    withdrawalMeta?.availableBalance ??
    data?.summary?.estimatedPayoutAmount ??
    0;
  const withdrawalPreview = getWithdrawalFinancials(withdrawAmount || 0, {
    adminFeeAmount: withdrawalMeta?.balance?.withdrawalAdminFeeAmount,
  });
  const payoutDestination = data?.payoutProfile?.destination || null;
  const start = filteredReviews.length ? (safePage - 1) * query.limit + 1 : 0;
  const end = Math.min(safePage * query.limit, filteredReviews.length);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      const param = key === "search" ? "q" : key;
      if (!value || value === "all" || (param === "page" && Number(value) === 1) || (param === "limit" && Number(value) === 10)) {
        next.delete(param);
      } else {
        next.set(param, String(value));
      }
    });
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams({});
    setSelectedPaymentId(null);
  };

  const openReview = (review) => {
    setSelectedPaymentId(review.id);
    setReviewNote("");
  };

  const submitWithdrawal = async () => {
    const result = await actions.requestWithdrawal(withdrawAmount);
    if (result?.success) {
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
    }
  };

  if (!canView) {
    return (
      <div className="seller2026-dashboard">
        <div className="seller2026-error">
          <ShieldCheck size={18} />
          {isId ? "Anda tidak memiliki izin untuk melihat pusat pembayaran." : "You do not have permission to view Payment Center."}
        </div>
      </div>
    );
  }

  if (loading && !reviews.length) return <PaymentCenterSkeleton />;

  return (
    <div className="seller2026-dashboard seller2026-payment-center">
      <header className="seller2026-products__header seller2026-payment-center__header">
        <div>
          <h1>{isId ? "Pusat Pembayaran" : "Payment Center"}</h1>
          <p>{isId ? "Pantau tinjauan pembayaran, kesiapan payout, dan permintaan pencairan dana." : "Monitor payment reviews, payout readiness, and withdrawal requests."}</p>
        </div>
        <div className="seller2026-products__actions">
          <button type="button" disabled title={isId ? "Ekspor akan mengikuti laporan settlement" : "Export will follow settlement reporting"}>
            <Download size={16} /> {isId ? "Ekspor" : "Export"}
          </button>
          <button type="button" onClick={refetch} disabled={loading}>
            <RefreshCw size={16} /> {loading ? (isId ? "Memuat..." : "Refreshing...") : (isId ? "Segarkan" : "Refresh")}
          </button>
          <button
            type="button"
            className="is-primary"
            disabled={!payoutActive || actionState.isUpdating}
            title={
              !payoutActive
                ? (isId ? "Profil pembayaran aktif diperlukan sebelum pencairan dana." : "Active payment profile is required for withdrawal.")
                : (isId ? "Ajukan pencairan dana" : "Request withdrawal")
            }
            onClick={() => setIsWithdrawModalOpen(true)}
          >
            <CreditCard size={16} /> {isId ? "Ajukan Pencairan" : "Request Withdrawal"}
          </button>
        </div>
      </header>

      {error || usingFallback || actionState.error || actionState.successMessage ? (
        <div className={`seller2026-profile__notice seller2026-profile__notice--${actionState.successMessage ? "success" : "error"}`}>
          {actionState.successMessage ? <Check size={16} /> : <AlertTriangle size={16} />}
          {actionState.successMessage ||
            actionState.error ||
            data?.meta?.message ||
            error?.message ||
            (isId ? "Data live pembayaran belum tersedia." : "Live payment data is unavailable.")}
        </div>
      ) : null}

      <section className="seller2026-product-kpis seller2026-payment-kpis">
        {[
          [isId ? "Tinjauan Tertunda" : "Pending Reviews", data?.summary?.pendingReviews ?? 0, isId ? "Menunggu validasi" : "Awaiting validation", Clock3, "amber"],
          [
            isId ? "Order Paid" : "Paid Orders",
            data?.summary?.verifiedPayments ?? 0,
            isId
              ? `${data?.summary?.withdrawalEligiblePayments ?? 0} delivered, ${data?.summary?.awaitingDeliveredPayments ?? 0} menunggu delivered`
              : `${data?.summary?.withdrawalEligiblePayments ?? 0} delivered, ${data?.summary?.awaitingDeliveredPayments ?? 0} waiting delivered`,
            CheckCircle2,
            "green",
          ],
          [isId ? "Saldo Tersedia" : "Available Balance", currency(availableBalance), isId ? "Net setelah pencairan aktif" : "Net after active requests", CreditCard, "blue"],
          [isId ? "Kesiapan Profil" : "Profile Readiness", data?.summary?.payoutReadiness ?? "Unknown", data?.payoutProfile?.status || "Payment profile", BadgeCheck, payoutActive ? "green" : "amber"],
        ].map(([label, value, note, Icon, color]) => (
          <div className="seller2026-product-kpi" key={label}>
            <span className={`is-${color}`}><Icon size={20} /></span>
            <div><small>{label}</small><strong>{value}</strong><em>{note}</em></div>
          </div>
        ))}
      </section>

      <section className="seller2026-products__catalog seller2026-payment-surface">
        <div className="seller2026-products-toolbar seller2026-payment-toolbar">
          <label>
            <Search size={17} />
            <input
              value={query.search}
              onChange={(event) => updateQuery({ search: event.target.value, page: 1 })}
              placeholder={isId ? "Cari invoice, pembeli, atau order..." : "Search invoice, buyer, or order..."}
            />
          </label>
          <select value={query.status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}>
            {statuses.map((status) => <option value={status} key={status}>{status === "all" ? (isId ? "Semua Status" : "All Status") : status}</option>)}
          </select>
          <select value={query.method} onChange={(event) => updateQuery({ method: event.target.value, page: 1 })}>
            {methods.map((method) => <option value={method} key={method}>{method === "all" ? (isId ? "Semua Metode" : "All Methods") : method}</option>)}
          </select>
          <button type="button" onClick={resetFilters}><RefreshCw size={16} /> Reset</button>
          <div className="seller2026-products__view">
            <button className={view === "list" ? "is-active" : ""} type="button" onClick={() => setView("list")} aria-label="List view"><List size={17} /></button>
            <button className={view === "compact" ? "is-active" : ""} type="button" onClick={() => setView("compact")} aria-label="Compact view"><Grid2X2 size={17} /></button>
          </div>
        </div>

        {pagedReviews.length ? (
          <div className={`seller2026-payment-table seller2026-payment-table--${view}`}>
            <div className="seller2026-payment-table__head">
              {(isId
                ? ["Invoice", "Pembeli", "Nominal", "Metode", "Status", "Diajukan", "Aksi"]
                : ["Invoice", "Buyer", "Amount", "Method", "Status", "Submitted", "Actions"]
              ).map((item) => <span key={item}>{item}</span>)}
            </div>
            {pagedReviews.map((review) => (
              <article className="seller2026-payment-row" key={review.id}>
                <div className="seller2026-payment-row__identity">
                  <span><CreditCard size={18} /></span>
                  <div>
                    <strong>{review.invoiceNumber || "-"}</strong>
                    <small>Order {review.orderId || "-"}</small>
                  </div>
                </div>
                <span data-label={isId ? "Pembeli" : "Buyer"}>{review.buyerName || "-"}</span>
                <span data-label={isId ? "Nominal" : "Amount"}>{currency(review.amount)}</span>
                <span data-label={isId ? "Metode" : "Method"}>{review.method || "-"}</span>
                <span data-label={isId ? "Status" : "Status"}><Pill>{review.status}</Pill></span>
                <span data-label={isId ? "Diajukan" : "Submitted"}>{dateLabel(review.submittedAt)}</span>
                <div className="seller2026-product-row__menu">
                  <button type="button" aria-label="Payment actions"><MoreHorizontal size={18} /></button>
                  <div>
                    <button type="button" onClick={() => openReview(review)}><Eye size={14} /> {isId ? "Lihat Detail" : "View Details"}</button>
                    <span>{isId ? "Settlement dibaca admin" : "Admin audit controls settlement"}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="seller2026-products__empty">
            <ShieldCheck size={38} />
            <h2>{isId ? "Tidak ada tinjauan pembayaran" : "No payment reviews"}</h2>
            <p>{isId ? "Data tinjauan pembayaran yang cocok belum tersedia." : "No payment review rows match the current filters."}</p>
          </div>
        )}

        <footer className="seller2026-products__pagination">
          <span>{isId ? `Menampilkan ${start} hingga ${end} dari ${filteredReviews.length} pembayaran` : `Showing ${start} to ${end} of ${filteredReviews.length} payments`}</span>
          <div>
            <button type="button" disabled={safePage <= 1} onClick={() => updateQuery({ page: safePage - 1 })}>Prev</button>
            <strong>{safePage}</strong>
            <span>{isId ? `dari ${totalPages}` : `of ${totalPages}`}</span>
            <button type="button" disabled={safePage >= totalPages} onClick={() => updateQuery({ page: safePage + 1 })}>Next</button>
          </div>
          <select value={query.limit} onChange={(event) => updateQuery({ limit: event.target.value, page: 1 })}>
            <option value="10">{isId ? "10 / halaman" : "10 / page"}</option>
            <option value="20">{isId ? "20 / halaman" : "20 / page"}</option>
            <option value="50">{isId ? "50 / halaman" : "50 / page"}</option>
          </select>
        </footer>
      </section>

      <section className="seller2026-payment-bottom">
        <article className="seller2026-payment-panel">
          <header>
            <div>
              <h2>{isId ? "Profil Pencairan" : "Payout Profile"}</h2>
              <p>{isId ? "Ringkasan rekening/QRIS aktif untuk pencairan dana." : "Active payout and QRIS readiness summary."}</p>
            </div>
            <Pill>{data?.payoutProfile?.activationStatus || "Unknown"}</Pill>
          </header>
          <dl>
            <div><dt>{isId ? "Bank Pencairan" : "Payout Bank"}</dt><dd>{payoutDestination?.bankName || "Not configured"}</dd></div>
            <div><dt>{isId ? "Nomor Rekening" : "Account Number"}</dt><dd>{payoutDestination?.accountNumberMasked || "Not configured"}</dd></div>
            <div><dt>{isId ? "Nama Pemilik" : "Account Holder"}</dt><dd>{payoutDestination?.accountHolderName || "Not configured"}</dd></div>
            <div><dt>Status</dt><dd>{data?.payoutProfile?.status || "Unknown"}</dd></div>
            <div><dt>{isId ? "Jadwal" : "Schedule"}</dt><dd>{data?.payoutProfile?.payoutSchedule || "Weekly"}</dd></div>
            <div><dt>{isId ? "Minimum" : "Minimum"}</dt><dd>{currency(data?.payoutProfile?.minimumPayout || 50000)}</dd></div>
          </dl>
        </article>

        <article className="seller2026-payment-panel">
          <header>
            <div>
              <h2>{isId ? "Pencairan Terbaru" : "Recent Withdrawals"}</h2>
              <p>{isId ? "Status permintaan pencairan seller." : "Latest seller payout request status."}</p>
            </div>
          </header>
          {withdrawals?.length ? (
            <div className="seller2026-withdrawal-list">
              {withdrawals.slice(0, 5).map((withdrawal) => {
                const meta = getWithdrawalStatusMeta(withdrawal.status, { isId });
                const financials = getWithdrawalFinancials(withdrawal, {
                  adminFeeAmount: withdrawalMeta?.balance?.withdrawalAdminFeeAmount,
                });
                return (
                  <div className="seller2026-withdrawal-card" key={withdrawal.id}>
                    <div className="seller2026-withdrawal-card__head">
                      <span>
                        <strong>{currency(financials.netTransferAmount)}</strong>
                        <small>{dateLabel(withdrawal.requestedAt)}</small>
                        <small>{isId ? `Request ${currency(financials.amount)} - biaya admin ${currency(financials.adminFeeAmount)}` : `Request ${currency(financials.amount)} - admin fee ${currency(financials.adminFeeAmount)}`}</small>
                        <small>
                          {withdrawal.bankName || "-"} - {maskAccountNumber(withdrawal.accountNumber)} a.n. {withdrawal.accountName || "-"}
                        </small>
                        {withdrawal.adminNote ? <small>{withdrawal.adminNote}</small> : null}
                        {withdrawal.proofImageUrl ? (
                          <small>
                            <a href={resolveAssetUrl(withdrawal.proofImageUrl)} target="_blank" rel="noreferrer">
                              {isId ? "Lihat bukti transfer" : "View transfer proof"}
                            </a>
                          </small>
                        ) : null}
                      </span>
                      <span className={`seller2026-pill seller2026-pill--${meta.pillTone}`}>{meta.label}</span>
                    </div>
                    <WithdrawalStatusTimeline withdrawal={withdrawal} isId={isId} compact />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="seller2026-payment-empty-note">{isId ? "Belum ada permintaan pencairan dana." : "No withdrawal requests yet."}</p>
          )}
        </article>
      </section>

      {selectedReview ? (
        <div className="seller2026-payment-drawer" role="dialog" aria-modal="true" aria-labelledby="payment-review-title">
          <button type="button" className="seller2026-payment-drawer__backdrop" aria-label="Close details" onClick={() => setSelectedPaymentId(null)} />
          <aside className="seller2026-payment-drawer__panel">
            <header>
              <div>
                <small>{isId ? "Detail Tinjauan" : "Review Detail"}</small>
                <h2 id="payment-review-title">{selectedReview.invoiceNumber || selectedReview.orderId || "Payment"}</h2>
                <p>{selectedReview.buyerName || "Customer"} - {currency(selectedReview.amount)}</p>
              </div>
              <button type="button" onClick={() => setSelectedPaymentId(null)} aria-label="Close details"><X size={18} /></button>
            </header>
            <div className="seller2026-payment-drawer__body">
              <section>
                <h3>{isId ? "Bukti Pembayaran" : "Payment Proof"}</h3>
                {selectedReview.proofThumbnails?.length ? (
                  <div className="seller2026-payment-proof-grid">
                    {selectedReview.proofThumbnails.map((url, index) => (
                      <img src={url} alt="Payment proof" key={`${url}-${index}`} />
                    ))}
                  </div>
                ) : (
                  <p className="seller2026-payment-empty-note">{isId ? "Tidak ada bukti pembayaran." : "No proof image provided."}</p>
                )}
              </section>
              <section>
                <h3>{isId ? "Detail" : "Details"}</h3>
                <dl>
                  <div><dt>Order</dt><dd>{selectedReview.orderId || "-"}</dd></div>
                  <div><dt>{isId ? "Metode" : "Method"}</dt><dd>{selectedReview.method || "-"}</dd></div>
                  <div><dt>Status</dt><dd><Pill>{selectedReview.status}</Pill></dd></div>
                  <div><dt>{isId ? "Diajukan" : "Submitted"}</dt><dd>{dateLabel(selectedReview.submittedAt)}</dd></div>
                </dl>
              </section>
              {selectedReview.allowedActions?.length && !usingFallback ? (
                <section>
                  <h3>{isId ? "Catatan Review" : "Review Note"}</h3>
                  <input value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder={isId ? "Catatan opsional..." : "Optional review note..."} />
                  <div className="seller2026-payment-drawer__actions">
                    {selectedReview.allowedActions.includes("APPROVE") ? (
                      <button type="button" className="is-primary" disabled={actionState.isUpdating} onClick={() => actions.approvePayment(selectedReview.paymentId, reviewNote)}>
                        {isId ? "Setujui" : "Approve"}
                      </button>
                    ) : null}
                    {selectedReview.allowedActions.includes("REJECT") ? (
                      <button type="button" className="is-danger" disabled={actionState.isUpdating} onClick={() => actions.rejectPayment(selectedReview.paymentId, reviewNote)}>
                        {isId ? "Tolak" : "Reject"}
                      </button>
                    ) : null}
                  </div>
                </section>
              ) : (
                <section className="seller2026-payment-governance">
                  <ShieldCheck size={18} />
                  <span>{isId ? "Audit admin adalah otoritas akhir settlement." : "Admin audit remains the final settlement authority."}</span>
                </section>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      {isWithdrawModalOpen ? (
        <div className="seller2026-payment-modal" role="dialog" aria-modal="true" aria-labelledby="withdrawal-title">
          <button type="button" aria-label="Close withdrawal dialog" onClick={() => setIsWithdrawModalOpen(false)} />
          <section>
            <header>
              <h2 id="withdrawal-title">{isId ? "Ajukan Pencairan Dana" : "Request Withdrawal"}</h2>
              <p>{isId ? "Admin akan meninjau permintaan pencairan ini." : "Admin will review this payout request."}</p>
            </header>
            <div className="seller2026-payment-modal__balance">
              <small>{isId ? "Saldo tersedia" : "Available balance"}</small>
              <strong>{currency(availableBalance)}</strong>
            </div>
            <div className="seller2026-payment-modal__fees">
              <div>
                <span>{isId ? "Bank tujuan" : "Destination bank"}</span>
                <strong>{payoutDestination?.bankName || "-"}</strong>
              </div>
              <div>
                <span>{isId ? "Nomor rekening" : "Account number"}</span>
                <strong>{payoutDestination?.accountNumberMasked || "-"}</strong>
              </div>
              <div>
                <span>{isId ? "Nama pemilik" : "Account holder"}</span>
                <strong>{payoutDestination?.accountHolderName || "-"}</strong>
              </div>
            </div>
            <label>
              <span>{isId ? "Nominal Pencairan" : "Withdrawal Amount"}</span>
              <input type="number" min="50000" placeholder="Min Rp 50.000" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} />
            </label>
            <div className="seller2026-payment-modal__fees">
              <div>
                <span>{isId ? "Nominal request" : "Requested amount"}</span>
                <strong>{currency(withdrawalPreview.amount)}</strong>
              </div>
              <div>
                <span>{isId ? "Biaya admin" : "Admin fee"}</span>
                <strong>{currency(withdrawalPreview.adminFeeAmount)}</strong>
              </div>
              <div>
                <span>{isId ? "Estimasi diterima" : "Estimated received"}</span>
                <strong>{currency(withdrawalPreview.netTransferAmount)}</strong>
              </div>
              <p>{isId ? "Biaya admin Rp 6.500 dipotong dari nominal pencairan saat transfer diproses." : "The Rp 6,500 admin fee is deducted from the requested withdrawal amount when the transfer is processed."}</p>
            </div>
            <footer>
              <button type="button" onClick={() => setIsWithdrawModalOpen(false)} disabled={actionState.isUpdating}>{isId ? "Batal" : "Cancel"}</button>
              <button type="button" className="is-primary" disabled={actionState.isUpdating || !withdrawAmount || Number(withdrawAmount) < 50000 || Number(withdrawAmount) > Number(availableBalance)} onClick={submitWithdrawal}>
                {actionState.isUpdating ? (isId ? "Mengirim..." : "Submitting...") : (isId ? "Ajukan Pencairan" : "Submit Request")}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export default Seller2026PaymentCenterPreviewPage;
