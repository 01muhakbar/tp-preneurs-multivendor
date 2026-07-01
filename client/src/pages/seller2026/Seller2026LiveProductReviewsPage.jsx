import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Filter,
  Flag,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MessageSquareText,
  MoreHorizontal,
  PackageOpen,
  RefreshCw,
  Search,
  Send,
  Star,
  TrendingUp,
  X,
} from "lucide-react";
import { useSellerWorkspaceRoute } from "../../utils/sellerWorkspaceRoute.js";
import {
  useSeller2026ReviewDetail,
  useSeller2026ReviewMutations,
  useSeller2026Reviews,
} from "../../hooks/seller2026/useSeller2026Reviews.ts";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../features/sellerWorkspace2026/Seller2026Reviews.css";

const STATUS_TABS = [
  { id: "all", label: "All Reviews", countKey: "totalReviews" },
  { id: "pending", label: "Pending", countKey: "pending" },
  { id: "published", label: "Published", countKey: "published" },
  { id: "hidden", label: "Hidden", countKey: "hidden" },
];
const SORT_OPTIONS = [
  ["newest", "Newest"],
  ["oldest", "Oldest"],
  ["rating_high", "Rating High"],
  ["rating_low", "Rating Low"],
];

const readPositive = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};
const message = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;
const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function Stars({ rating, compact = false }) {
  return (
    <span className="s26-reviews-stars" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <Star
          key={index}
          size={compact ? 15 : 18}
          fill={index < rating ? "currentColor" : "none"}
          className={index < rating ? "is-filled" : ""}
        />
      ))}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, helper, tone, children }) {
  return (
    <article className={`s26-reviews-stat is-${tone}`}>
      <span className="s26-reviews-stat__icon"><Icon size={23} /></span>
      <div>
        <span>{label}</span>
        <strong>{value}{children}</strong>
        <small>{helper}</small>
      </div>
    </article>
  );
}

function ProductThumb({ review, large = false }) {
  return review.productImageUrl ? (
    <img
      className={large ? "s26-review-product-image is-large" : "s26-review-product-image"}
      src={review.productImageUrl}
      alt={review.productName}
    />
  ) : (
    <span className={large ? "s26-review-product-image is-large is-empty" : "s26-review-product-image is-empty"}>
      <ImageIcon size={large ? 30 : 20} />
    </span>
  );
}

function ReviewStatus({ review }) {
  return <span className={`s26-review-status is-${review.status}`}>{review.statusLabel}</span>;
}

function LoadingState() {
  return (
    <div className="s26-reviews-loading" aria-label="Loading product reviews">
      <div className="s26-review-skeleton is-title" />
      <div className="s26-reviews-stats">
        {[0, 1, 2, 3].map((item) => <div className="s26-review-skeleton is-card" key={item} />)}
      </div>
      <div className="s26-review-skeleton is-table" />
    </div>
  );
}

function ReviewDrawer({ storeId, reviewId, canMutate, onClose }) {
  const detailQuery = useSeller2026ReviewDetail(storeId, reviewId);
  const { replyMutation, statusMutation, reportMutation, isMutating } =
    useSeller2026ReviewMutations(storeId);
  const [reply, setReply] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const textareaRef = useRef(null);
  const review = detailQuery.data;

  useEffect(() => {
    if (review) setReply(review.reply || "");
  }, [review]);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const sendReply = async () => {
    const value = reply.trim();
    if (!value) return toast.error("Write a reply before sending.");
    try {
      await replyMutation.mutateAsync({ reviewId, payload: { reply: value } });
      toast.success("Reply sent to the customer.");
      void detailQuery.refetch();
    } catch (error) {
      toast.error(message(error, "Unable to send the reply."));
    }
  };

  const changeStatus = async () => {
    if (!review) return;
    const nextStatus = review.isHidden ? "published" : "hidden";
    try {
      await statusMutation.mutateAsync({
        reviewId,
        payload: {
          status: nextStatus,
          reason: nextStatus === "hidden" ? "Hidden by seller review management" : "",
        },
      });
      toast.success(nextStatus === "hidden" ? "Review hidden from the storefront." : "Review published.");
      void detailQuery.refetch();
    } catch (error) {
      toast.error(message(error, "Unable to update review visibility."));
    }
  };

  const submitReport = async () => {
    const reason = reportReason.trim();
    if (!reason) return toast.error("Add a reason for the report.");
    try {
      await reportMutation.mutateAsync({ reviewId, payload: { reason } });
      toast.success("Review reported for platform audit.");
      setShowReport(false);
      setReportReason("");
      void detailQuery.refetch();
    } catch (error) {
      toast.error(message(error, "Unable to report the review."));
    }
  };

  return (
    <div className="s26-review-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="s26-review-drawer" role="dialog" aria-modal="true" aria-label="Review detail">
        <header className="s26-review-drawer__header">
          <div>
            <span>Catalog / Reviews</span>
            <h2>Review Detail</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close review detail"><X size={20} /></button>
        </header>

        {detailQuery.isLoading ? (
          <div className="s26-review-drawer__loading"><Loader2 className="animate-spin" /> Loading review...</div>
        ) : detailQuery.isError || !review ? (
          <div className="s26-review-drawer__error">
            <p>{message(detailQuery.error, "Unable to load review detail.")}</p>
            <button type="button" onClick={() => detailQuery.refetch()}><RefreshCw size={16} /> Retry</button>
          </div>
        ) : (
          <div className="s26-review-drawer__body">
            <section className="s26-review-detail-card">
              <div className="s26-review-detail-product">
                <ProductThumb review={review} large />
                <div>
                  <span>Product</span>
                  <h3>{review.productName}</h3>
                  <p>SKU: {review.productSku}</p>
                  <strong>{rupiah(review.productPrice)}</strong>
                  {review.productSlug ? (
                    <Link to={`/product/${encodeURIComponent(review.productSlug)}`}>View Product</Link>
                  ) : null}
                </div>
              </div>
              <div className="s26-review-detail-reviewer">
                <span className="s26-review-avatar">{review.reviewerInitials}</span>
                <div><strong>{review.reviewerName}</strong><span>Verified Buyer</span></div>
                <time>{review.createdAtLabel}</time>
              </div>
              <Stars rating={review.rating} />
              <p className="s26-review-detail-comment">{review.comment || "No written comment."}</p>
              {review.images.length ? (
                <div className="s26-review-detail-images">
                  {review.images.map((image, index) => (
                    <a href={image} target="_blank" rel="noreferrer" key={`${review.id}-${index}`}>
                      <img src={image} alt={`Customer review ${index + 1}`} />
                    </a>
                  ))}
                </div>
              ) : null}
              {review.reply ? (
                <div className="s26-review-existing-reply">
                  <strong>Store reply</strong><p>{review.reply}</p>
                </div>
              ) : null}
              <div className="s26-review-votes">
                Helpful ({review.helpfulCount}) <span>•</span> Not Helpful ({review.notHelpfulCount})
              </div>
            </section>

            <section className="s26-review-action-card">
              <div className="s26-review-action-card__title">
                <h3>Review Status</h3><ReviewStatus review={review} />
              </div>
              <button
                type="button"
                className={`s26-review-visibility ${review.isHidden ? "is-publish" : ""}`}
                onClick={changeStatus}
                disabled={!canMutate || isMutating}
              >
                {review.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                {review.isHidden ? "Publish Review" : "Hide Review"}
              </button>
            </section>

            <section className="s26-review-action-card">
              <div className="s26-review-action-card__title">
                <h3>Reply to Customer</h3><span>{reply.length}/500</span>
              </div>
              <textarea
                ref={textareaRef}
                value={reply}
                maxLength={500}
                onChange={(event) => setReply(event.target.value)}
                placeholder="Write a thoughtful reply to your customer..."
                disabled={!canMutate || isMutating}
              />
              <div className="s26-review-action-card__footer">
                <small>Your reply becomes visible on the product review.</small>
                <button type="button" onClick={sendReply} disabled={!canMutate || isMutating || !reply.trim()}>
                  {replyMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  Send Reply
                </button>
              </div>
            </section>

            <section className="s26-review-action-card">
              <div className="s26-review-action-card__title">
                <h3>Platform Report</h3>
                {review.isReported ? <span className="is-reported">Reported</span> : null}
              </div>
              {showReport ? (
                <>
                  <textarea
                    value={reportReason}
                    maxLength={1000}
                    onChange={(event) => setReportReason(event.target.value)}
                    placeholder="Explain why this review needs platform attention..."
                    disabled={!canMutate || isMutating}
                  />
                  <div className="s26-review-report-actions">
                    <button type="button" onClick={() => setShowReport(false)} disabled={isMutating}>Cancel</button>
                    <button type="button" onClick={submitReport} disabled={!canMutate || isMutating || !reportReason.trim()}>
                      {reportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />} Submit Report
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="s26-review-report" onClick={() => setShowReport(true)} disabled={!canMutate || isMutating}>
                  <Flag size={17} /> Report Review
                </button>
              )}
              {review.isReported && review.reportReason ? <p className="s26-review-report-note">Latest reason: {review.reportReason}</p> : null}
            </section>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function Seller2026LiveProductReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [searchDraft, setSearchDraft] = useState(searchParams.get("search") || "");
  const { sellerContext, workspaceStoreId: storeId } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("CATALOG_PRODUCT_READ");
  const canMutate = can("CATALOG_PRODUCT_UPDATE");
  const status = ["pending", "published", "hidden"].includes(searchParams.get("status"))
    ? searchParams.get("status")
    : "all";
  const sort = SORT_OPTIONS.some(([value]) => value === searchParams.get("sort"))
    ? searchParams.get("sort")
    : "newest";
  const page = readPositive(searchParams.get("page"), 1);
  const limit = Math.min(50, readPositive(searchParams.get("limit"), 10));
  const search = searchParams.get("search") || "";
  const query = useMemo(() => ({ status, sort, page, limit, search: search || undefined }), [limit, page, search, sort, status]);
  const reviewsQuery = useSeller2026Reviews(storeId, query);
  const view = reviewsQuery.data;

  useEffect(() => setSearchDraft(search), [search]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      const isDefault =
        value === "" || value == null ||
        (key === "status" && value === "all") ||
        (key === "sort" && value === "newest") ||
        (key === "page" && Number(value) === 1) ||
        (key === "limit" && Number(value) === 10);
      if (isDefault) next.delete(key);
      else next.set(key, String(value));
    });
    if (!Object.prototype.hasOwnProperty.call(updates, "page")) next.delete("page");
    setSearchParams(next);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateQuery({ search: searchDraft.trim(), page: 1 });
  };

  if (!canView) {
    return (
      <div className="seller2026-reviews-page">
        <section className="s26-reviews-state is-error"><h2>Reviews unavailable</h2><p>You do not have permission to view product reviews.</p></section>
      </div>
    );
  }
  if (reviewsQuery.isLoading) return <div className="seller2026-reviews-page"><LoadingState /></div>;

  const stats = view?.stats || {};
  const pagination = view?.pagination || { page: 1, totalPages: 1, total: 0, from: 0, to: 0 };
  const pages = Array.from({ length: Math.min(5, pagination.totalPages) }, (_, index) => {
    const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
    return start + index;
  }).filter((value) => value <= pagination.totalPages);

  return (
    <div className="seller2026-reviews-page">
      <header className="s26-reviews-heading">
        <div><h1>Product Reviews</h1><p>Monitor and respond to customer feedback.</p></div>
      </header>

      <section className="s26-reviews-stats">
        <StatCard icon={MessageSquareText} label="Total Reviews" value={stats.totalReviews || 0} helper="All time reviews" tone="primary" />
        <StatCard icon={Star} label="Average Rating" value={(stats.averageRating || 0).toFixed(1)} helper="Based on all reviews" tone="accent">
          <Stars rating={Math.round(stats.averageRating || 0)} compact />
        </StatCard>
        <StatCard icon={MessageCircle} label="Pending Replies" value={stats.pendingReplies || 0} helper="Need your attention" tone="orange" />
        <StatCard icon={TrendingUp} label="Response Rate" value={`${stats.responseRate || 0}%`} helper="Customer response coverage" tone="success" />
      </section>

      <section className="s26-reviews-toolbar">
        <div className="s26-reviews-tabs" role="tablist" aria-label="Review status">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={status === tab.id}
              className={status === tab.id ? "is-active" : ""}
              onClick={() => updateQuery({ status: tab.id, page: 1 })}
            >
              {tab.label} <span>{stats[tab.countKey] || 0}</span>
            </button>
          ))}
        </div>
        <div className="s26-reviews-controls">
          <form onSubmit={submitSearch} className="s26-reviews-search">
            <Search size={18} />
            <input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} placeholder="Search reviews..." aria-label="Search reviews" />
          </form>
          <button type="button" className={filtersOpen ? "is-active" : ""} onClick={() => setFiltersOpen((value) => !value)}><Filter size={18} /> Filters</button>
          <select value={sort} onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })} aria-label="Sort reviews">
            {SORT_OPTIONS.map(([value, label]) => <option value={value} key={value}>Sort: {label}</option>)}
          </select>
        </div>
      </section>

      {filtersOpen ? (
        <section className="s26-reviews-filter-panel">
          <label>Status<select value={status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}>{STATUS_TABS.map((tab) => <option value={tab.id} key={tab.id}>{tab.label}</option>)}</select></label>
          <label>Rows per page<select value={limit} onChange={(event) => updateQuery({ limit: Number(event.target.value), page: 1 })}>{[10, 20, 50].map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
          <button type="button" onClick={() => { setSearchDraft(""); setSearchParams({}); }}>Reset filters</button>
        </section>
      ) : null}

      {reviewsQuery.isError ? (
        <section className="s26-reviews-state is-error">
          <MessageSquareText size={34} /><h2>Unable to load reviews</h2><p>{message(reviewsQuery.error, "Please try again.")}</p>
          <button type="button" onClick={() => reviewsQuery.refetch()}><RefreshCw size={16} /> Retry</button>
        </section>
      ) : view?.items.length === 0 ? (
        <section className="s26-reviews-state">
          <PackageOpen size={38} /><h2>No reviews found</h2><p>{search || status !== "all" ? "Try another search or review status." : "Customer reviews for this store will appear here."}</p>
          {search || status !== "all" ? <button type="button" onClick={() => { setSearchDraft(""); setSearchParams({}); }}>Clear filters</button> : null}
        </section>
      ) : (
        <section className="s26-reviews-table-wrap">
          <table className="s26-reviews-table">
            <thead><tr><th>Product</th><th>Reviewer</th><th>Rating</th><th>Comment</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {view.items.map((review) => (
                <tr key={review.id}>
                  <td data-label="Product"><div className="s26-review-product"><ProductThumb review={review} /><div><strong>{review.productName}</strong><span>SKU: {review.productSku}</span><small>{rupiah(review.productPrice)}</small></div></div></td>
                  <td data-label="Reviewer"><div className="s26-review-reviewer"><span className="s26-review-avatar">{review.reviewerInitials}</span><div><strong>{review.reviewerName}</strong>{review.verifiedBuyer ? <span>Verified Buyer</span> : null}</div></div></td>
                  <td data-label="Rating"><Stars rating={review.rating} compact /></td>
                  <td data-label="Comment"><p className="s26-review-comment">{review.comment || "No written comment."}</p>{review.reply ? <small className="s26-review-replied">Store replied</small> : null}</td>
                  <td data-label="Date"><time className="s26-review-date">{review.createdAtLabel}</time></td>
                  <td data-label="Status"><ReviewStatus review={review} /></td>
                  <td data-label="Actions"><div className="s26-review-row-actions"><button type="button" onClick={() => setSelectedReviewId(review.id)}><MessageCircle size={16} /> {review.reply ? "View" : "Reply"}</button><button type="button" aria-label={`View ${review.productName} review`} onClick={() => setSelectedReviewId(review.id)}><Eye size={17} /></button><button type="button" aria-label="More review actions" onClick={() => setSelectedReviewId(review.id)}><MoreHorizontal size={17} /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!reviewsQuery.isError && pagination.total > 0 ? (
        <footer className="s26-reviews-pagination">
          <span>Showing {pagination.from} to {pagination.to} of {pagination.total} reviews</span>
          <div>
            <button type="button" disabled={pagination.page <= 1} onClick={() => updateQuery({ page: pagination.page - 1 })} aria-label="Previous page"><ChevronLeft size={17} /></button>
            {pages.map((number) => <button type="button" key={number} className={number === pagination.page ? "is-active" : ""} onClick={() => updateQuery({ page: number })}>{number}</button>)}
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateQuery({ page: pagination.page + 1 })} aria-label="Next page"><ChevronRight size={17} /></button>
            <select value={limit} onChange={(event) => updateQuery({ limit: Number(event.target.value), page: 1 })} aria-label="Reviews per page">{[10, 20, 50].map((value) => <option value={value} key={value}>{value} / page</option>)}</select>
          </div>
        </footer>
      ) : null}

      {selectedReviewId ? <ReviewDrawer storeId={storeId} reviewId={selectedReviewId} canMutate={canMutate} onClose={() => setSelectedReviewId(null)} /> : null}
    </div>
  );
}
