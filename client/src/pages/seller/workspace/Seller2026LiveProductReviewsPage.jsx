import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import {
  useSeller2026ReviewDetail,
  useSeller2026ReviewMutations,
  useSeller2026Reviews,
} from "../../../hooks/seller2026/useSeller2026Reviews.ts";
import { useSeller2026Products } from "../../../hooks/seller2026/useSeller2026Products.ts";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "../../../features/sellerWorkspace2026/Seller2026Reviews.css";

const isIndonesianLanguage = (i18nInstance) => {
  const current = String(
    i18nInstance?.language ||
      localStorage.getItem("app_lang") ||
      localStorage.getItem("seller_language") ||
      localStorage.getItem("store_language") ||
      localStorage.getItem("i18nextLng") ||
      "id"
  ).toLowerCase();
  return current.startsWith("id");
};

const SELLER_REVIEWS_I18N = {
  id: {
    pageTitle: "Ulasan Produk",
    pageSubtitle: "Pantau dan tanggapi ulasan dari pembeli.",
    totalReviews: "Total Ulasan",
    totalReviewsHelper: "Semua ulasan produk",
    averageRating: "Rata-rata Penilaian",
    averageRatingHelper: "Berdasarkan seluruh ulasan",
    pendingReplies: "Menunggu Balasan",
    pendingRepliesHelper: "Perlu ditanggapi segera",
    responseRate: "Tingkat Balasan",
    responseRateHelper: "Cakupan respon ulasan",
    allReviews: "Semua Ulasan",
    pending: "Menunggu",
    published: "Dipublikasikan",
    hidden: "Disembunyikan",
    searchPlaceholder: "Cari di dalam ulasan produk...",
    filters: "Filter",
    sortPrefix: "Urutkan:",
    newest: "Terbaru",
    oldest: "Terlama",
    ratingHigh: "Rating Tertinggi",
    ratingLow: "Rating Terendah",
    allProducts: "Semua Produk",
    allRatings: "Semua Rating",
    rowsPerPage: "Baris per halaman",
    resetFilters: "Atur Ulang Filter",
    activeFilters: "Filter Aktif:",
    clearAll: "Hapus Semua",
    clearFilters: "Hapus Filter",
    noReviewsFound: "Belum ada ulasan ditemukan",
    noReviewsDescEmpty: "Ulasan pembeli untuk toko ini akan muncul di sini.",
    noReviewsDescFiltered: "Coba kata kunci pencarian atau status ulasan lain.",
    tableProduct: "Produk",
    tableReviewer: "Pembeli",
    tableRating: "Penilaian",
    tableComment: "Ulasan",
    tableDate: "Tanggal",
    tableStatus: "Status",
    tableActions: "Aksi",
    replyBtn: "Balas",
    viewBtn: "Lihat",
    storeReplied: "Toko membalas",
    verifiedBuyer: "Pembeli Terverifikasi",
    noComment: "Tidak ada komentar tertulis.",
    showing: "Menampilkan",
    to: "hingga",
    of: "dari",
    reviews: "ulasan",
    drawerTitle: "Detail Ulasan",
    sku: "SKU",
    viewProduct: "Lihat Produk",
    storeReplyTitle: "Balasan Toko",
    helpful: "Membantu",
    notHelpful: "Tidak Membantu",
    reviewStatus: "Status Ulasan",
    publishReview: "Tampilkan Ulasan",
    hideReview: "Sembunyikan Ulasan",
    replyToCustomer: "Balas Ulasan Pembeli",
    replyPlaceholder: "Tulis balasan yang ramah dan solutif untuk pembeli...",
    replyHint: "Balasan Anda akan tampil pada ulasan produk.",
    sendReply: "Kirim Balasan",
    sendingReply: "Mengirim...",
    platformReport: "Laporan ke Platform",
    reported: "Dilaporkan",
    reportReview: "Laporkan Ulasan",
    reportPlaceholder: "Jelaskan mengapa ulasan ini perlu ditinjau oleh platform...",
    cancel: "Batal",
    submitReport: "Kirim Laporan",
    latestReason: "Alasan terkini:",
    writeReplyError: "Tulis balasan sebelum mengirim.",
    replySentSuccess: "Balasan berhasil dikirim ke pembeli.",
    replySendError: "Gagal mengirimkan balasan.",
    hideSuccess: "Ulasan berhasil disembunyikan dari etalase.",
    publishSuccess: "Ulasan berhasil dipublikasikan.",
    statusError: "Gagal memperbarui visibilitas ulasan.",
    reportSuccess: "Ulasan berhasil dilaporkan untuk audit platform.",
    reportReasonError: "Tuliskan alasan pelaporan ulasan.",
    reportError: "Gagal melaporkan ulasan.",
    retry: "Coba Lagi",
    filterByProduct: "Filter berdasarkan produk ini",
    perPage: "/ halaman",
  },
  en: {
    pageTitle: "Product Reviews",
    pageSubtitle: "Monitor and respond to customer feedback.",
    totalReviews: "Total Reviews",
    totalReviewsHelper: "All time reviews",
    averageRating: "Average Rating",
    averageRatingHelper: "Based on all reviews",
    pendingReplies: "Pending Replies",
    pendingRepliesHelper: "Need your attention",
    responseRate: "Response Rate",
    responseRateHelper: "Customer response coverage",
    allReviews: "All Reviews",
    pending: "Pending",
    published: "Published",
    hidden: "Hidden",
    searchPlaceholder: "Search reviews...",
    filters: "Filters",
    sortPrefix: "Sort:",
    newest: "Newest",
    oldest: "Oldest",
    ratingHigh: "Rating High",
    ratingLow: "Rating Low",
    allProducts: "All Products",
    allRatings: "All Ratings",
    rowsPerPage: "Rows per page",
    resetFilters: "Reset filters",
    activeFilters: "Active Filters:",
    clearAll: "Clear All",
    clearFilters: "Clear filters",
    noReviewsFound: "No reviews found",
    noReviewsDescEmpty: "Customer reviews for this store will appear here.",
    noReviewsDescFiltered: "Try another search or review status.",
    tableProduct: "Product",
    tableReviewer: "Reviewer",
    tableRating: "Rating",
    tableComment: "Comment",
    tableDate: "Date",
    tableStatus: "Status",
    tableActions: "Actions",
    replyBtn: "Reply",
    viewBtn: "View",
    storeReplied: "Store replied",
    verifiedBuyer: "Verified Buyer",
    noComment: "No written comment.",
    showing: "Showing",
    to: "to",
    of: "of",
    reviews: "reviews",
    drawerTitle: "Review Detail",
    sku: "SKU",
    viewProduct: "View Product",
    storeReplyTitle: "Store reply",
    helpful: "Helpful",
    notHelpful: "Not Helpful",
    reviewStatus: "Review Status",
    publishReview: "Publish Review",
    hideReview: "Hide Review",
    replyToCustomer: "Reply to Customer",
    replyPlaceholder: "Write a thoughtful reply to your customer...",
    replyHint: "Your reply becomes visible on the product review.",
    sendReply: "Send Reply",
    sendingReply: "Sending...",
    platformReport: "Platform Report",
    reported: "Reported",
    reportReview: "Report Review",
    reportPlaceholder: "Explain why this review needs platform attention...",
    cancel: "Cancel",
    submitReport: "Submit Report",
    latestReason: "Latest reason:",
    writeReplyError: "Write a reply before sending.",
    replySentSuccess: "Reply sent to the customer.",
    replySendError: "Unable to send the reply.",
    hideSuccess: "Review hidden from the storefront.",
    publishSuccess: "Review published.",
    statusError: "Unable to update review visibility.",
    reportSuccess: "Review reported for platform audit.",
    reportReasonError: "Add a reason for the report.",
    reportError: "Unable to report the review.",
    retry: "Retry",
    filterByProduct: "Filter by this product",
    perPage: "/ page",
  },
};

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
      onError={(event) => { event.currentTarget.style.display = "none"; }}
    />
  ) : (
    <span className={large ? "s26-review-product-image is-large is-empty" : "s26-review-product-image is-empty"}>
      <ImageIcon size={large ? 30 : 20} />
    </span>
  );
}

function ReviewStatus({ review, t }) {
  const label =
    review.status === "pending"
      ? (t?.pending || "Pending")
      : review.status === "hidden"
        ? (t?.hidden || "Hidden")
        : (t?.published || "Published");
  return <span className={`s26-review-status is-${review.status}`}>{label}</span>;
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

function ReviewDrawer({ storeId, reviewId, canMutate, onClose, t }) {
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
    if (!value) return toast.error(t.writeReplyError);
    try {
      await replyMutation.mutateAsync({ reviewId, payload: { reply: value } });
      toast.success(t.replySentSuccess);
      void detailQuery.refetch();
    } catch (error) {
      toast.error(message(error, t.replySendError));
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
      toast.success(nextStatus === "hidden" ? t.hideSuccess : t.publishSuccess);
      void detailQuery.refetch();
    } catch (error) {
      toast.error(message(error, t.statusError));
    }
  };

  const submitReport = async () => {
    const reason = reportReason.trim();
    if (!reason) return toast.error(t.reportReasonError);
    try {
      await reportMutation.mutateAsync({ reviewId, payload: { reason } });
      toast.success(t.reportSuccess);
      setShowReport(false);
      setReportReason("");
      void detailQuery.refetch();
    } catch (error) {
      toast.error(message(error, t.reportError));
    }
  };

  return (
    <div className="s26-review-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="s26-review-drawer" role="dialog" aria-modal="true" aria-label="Review detail">
        <header className="s26-review-drawer__header">
          <div>
            <span>Catalog / Reviews</span>
            <h2>{t.drawerTitle}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </header>

        {detailQuery.isLoading ? (
          <div className="s26-review-drawer__loading"><Loader2 className="animate-spin" /> Loading review...</div>
        ) : detailQuery.isError || !review ? (
          <div className="s26-review-drawer__error">
            <p>{message(detailQuery.error, "Unable to load review detail.")}</p>
            <button type="button" onClick={() => detailQuery.refetch()}><RefreshCw size={16} /> {t.retry}</button>
          </div>
        ) : (
          <div className="s26-review-drawer__body">
            <section className="s26-review-detail-card">
              <div className="s26-review-detail-product">
                <ProductThumb review={review} large />
                <div>
                  <span>{t.tableProduct}</span>
                  <h3>{review.productName}</h3>
                  <p>{t.sku}: {review.productSku || "-"}</p>
                  <strong>{rupiah(review.productPrice)}</strong>
                  {review.productSlug ? (
                    <Link to={`/product/${encodeURIComponent(review.productSlug)}`}>{t.viewProduct}</Link>
                  ) : null}
                </div>
              </div>
              <div className="s26-review-detail-reviewer">
                <span className="s26-review-avatar">{review.reviewerInitials}</span>
                <div><strong>{review.reviewerName}</strong><span>{t.verifiedBuyer}</span></div>
                <time>{review.createdAtLabel}</time>
              </div>
              <Stars rating={review.rating} />
              <p className="s26-review-detail-comment">{review.comment || t.noComment}</p>
              {review.images.length ? (
                <div className="s26-review-detail-images">
                  {review.images.map((image, index) => (
                    <a href={image} target="_blank" rel="noopener noreferrer" key={`${review.id}-${index}`}>
                      <img src={image} alt={`Review photo ${index + 1}`} onError={(event) => { event.currentTarget.style.display = "none"; }} />
                    </a>
                  ))}
                </div>
              ) : null}
              {review.reply ? (
                <div className="s26-review-existing-reply">
                  <strong>{t.storeReplyTitle}</strong><p>{review.reply}</p>
                </div>
              ) : null}
              <div className="s26-review-votes">
                {t.helpful} ({review.helpfulCount}) <span>•</span> {t.notHelpful} ({review.notHelpfulCount})
              </div>
            </section>

            <section className="s26-review-action-card">
              <div className="s26-review-action-card__title">
                <h3>{t.reviewStatus}</h3><ReviewStatus review={review} t={t} />
              </div>
              <button
                type="button"
                className={`s26-review-visibility ${review.isHidden ? "is-publish" : ""}`}
                onClick={changeStatus}
                disabled={!canMutate || isMutating}
              >
                {review.isHidden ? <Eye size={18} /> : <EyeOff size={18} />}
                {review.isHidden ? t.publishReview : t.hideReview}
              </button>
            </section>

            <section className="s26-review-action-card">
              <div className="s26-review-action-card__title">
                <h3>{t.replyToCustomer}</h3><span>{reply.length}/500</span>
              </div>
              <textarea
                ref={textareaRef}
                value={reply}
                maxLength={500}
                onChange={(event) => setReply(event.target.value)}
                placeholder={t.replyPlaceholder}
                disabled={!canMutate || isMutating}
              />
              <div className="s26-review-action-card__footer">
                <small>{t.replyHint}</small>
                <button type="button" onClick={sendReply} disabled={!canMutate || isMutating || !reply.trim()}>
                  {replyMutation.isPending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                  {replyMutation.isPending ? t.sendingReply : t.sendReply}
                </button>
              </div>
            </section>

            <section className="s26-review-action-card">
              <div className="s26-review-action-card__title">
                <h3>{t.platformReport}</h3>
                {review.isReported ? <span className="is-reported">{t.reported}</span> : null}
              </div>
              {showReport ? (
                <>
                  <textarea
                    value={reportReason}
                    maxLength={1000}
                    onChange={(event) => setReportReason(event.target.value)}
                    placeholder={t.reportPlaceholder}
                    disabled={!canMutate || isMutating}
                  />
                  <div className="s26-review-report-actions">
                    <button type="button" onClick={() => setShowReport(false)} disabled={isMutating}>{t.cancel}</button>
                    <button type="button" onClick={submitReport} disabled={!canMutate || isMutating || !reportReason.trim()}>
                      {reportMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Flag size={16} />} {t.submitReport}
                    </button>
                  </div>
                </>
              ) : (
                <button type="button" className="s26-review-report" onClick={() => setShowReport(true)} disabled={!canMutate || isMutating}>
                  <Flag size={17} /> {t.reportReview}
                </button>
              )}
              {review.isReported && review.reportReason ? <p className="s26-review-report-note">{t.latestReason} {review.reportReason}</p> : null}
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

  const { i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSync((c) => c + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("seller_language_changed", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("seller_language_changed", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const isIndo = isIndonesianLanguage(i18n);
  const t = isIndo ? SELLER_REVIEWS_I18N.id : SELLER_REVIEWS_I18N.en;

  const STATUS_TABS = useMemo(() => [
    { id: "all", label: t.allReviews, countKey: "totalReviews" },
    { id: "pending", label: t.pending, countKey: "pending" },
    { id: "published", label: t.published, countKey: "published" },
    { id: "hidden", label: t.hidden, countKey: "hidden" },
  ], [t]);

  const SORT_OPTIONS = useMemo(() => [
    ["newest", t.newest],
    ["oldest", t.oldest],
    ["rating_high", t.ratingHigh],
    ["rating_low", t.ratingLow],
  ], [t]);

  const status = ["pending", "published", "hidden"].includes(searchParams.get("status"))
    ? searchParams.get("status")
    : "all";
  const sort = ["newest", "oldest", "rating_high", "rating_low"].includes(searchParams.get("sort"))
    ? searchParams.get("sort")
    : "newest";
  const page = readPositive(searchParams.get("page"), 1);
  const limit = Math.min(50, readPositive(searchParams.get("limit"), 10));
  const productId = readPositive(searchParams.get("productId"), 0);
  const rating = readPositive(searchParams.get("rating"), 0);
  const search = searchParams.get("search") || "";
  const query = useMemo(() => ({
    status,
    sort,
    page,
    limit,
    search: search || undefined,
    productId: productId || undefined,
    rating: rating || undefined,
  }), [limit, page, search, sort, status, productId, rating]);
  const reviewsQuery = useSeller2026Reviews(storeId, query);
  const view = reviewsQuery.data;
  const productsQuery = useSeller2026Products(storeId, { limit: 100 });
  const products = productsQuery.data?.items || [];

  useEffect(() => setSearchDraft(search), [search]);

  const updateQuery = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      const isDefault =
        value === "" || value == null ||
        (key === "status" && value === "all") ||
        (key === "sort" && value === "newest") ||
        (key === "page" && Number(value) === 1) ||
        (key === "limit" && Number(value) === 10) ||
        (key === "productId" && Number(value) === 0) ||
        (key === "rating" && Number(value) === 0);
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
        <section className="s26-reviews-state is-error">
          <h2>{isIndo ? "Akses Ulasan Tidak Tersedia" : "Reviews unavailable"}</h2>
          <p>{isIndo ? "Anda tidak memiliki izin untuk melihat ulasan produk." : "You do not have permission to view product reviews."}</p>
        </section>
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
        <div>
          <h1>{t.pageTitle}</h1>
          <p>{t.pageSubtitle}</p>
        </div>
      </header>

      <section className="s26-reviews-stats">
        <StatCard icon={MessageSquareText} label={t.totalReviews} value={stats.totalReviews || 0} helper={t.totalReviewsHelper} tone="primary" />
        <StatCard icon={Star} label={t.averageRating} value={(stats.averageRating || 0).toFixed(1)} helper={t.averageRatingHelper} tone="accent">
          <Stars rating={Math.round(stats.averageRating || 0)} compact />
        </StatCard>
        <StatCard icon={MessageCircle} label={t.pendingReplies} value={stats.pendingReplies || 0} helper={t.pendingRepliesHelper} tone="orange" />
        <StatCard icon={TrendingUp} label={t.responseRate} value={`${stats.responseRate || 0}%`} helper={t.responseRateHelper} tone="success" />
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
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
            />
          </form>
          <button type="button" className={filtersOpen ? "is-active" : ""} onClick={() => setFiltersOpen((value) => !value)}>
            <Filter size={18} /> {t.filters}
          </button>
          <select value={sort} onChange={(event) => updateQuery({ sort: event.target.value, page: 1 })} aria-label="Sort reviews">
            {SORT_OPTIONS.map(([value, label]) => (
              <option value={value} key={value}>{t.sortPrefix} {label}</option>
            ))}
          </select>
        </div>
      </section>

      {filtersOpen ? (
        <section className="s26-reviews-filter-panel">
          <label>
            {t.tableStatus}
            <select value={status} onChange={(event) => updateQuery({ status: event.target.value, page: 1 })}>
              {STATUS_TABS.map((tab) => <option value={tab.id} key={tab.id}>{tab.label}</option>)}
            </select>
          </label>
          <label>
            {t.tableProduct}
            <select value={productId || ""} onChange={(event) => updateQuery({ productId: event.target.value, page: 1 })}>
              <option value="">{t.allProducts}</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <label>
            {t.tableRating}
            <select value={rating || ""} onChange={(event) => updateQuery({ rating: event.target.value, page: 1 })}>
              <option value="">{t.allRatings}</option>
              {[5, 4, 3, 2, 1].map((value) => (
                <option value={value} key={value}>{value} {isIndo ? "Bintang" : `Star${value > 1 ? "s" : ""}`}</option>
              ))}
            </select>
          </label>
          <label>
            {t.rowsPerPage}
            <select value={limit} onChange={(event) => updateQuery({ limit: Number(event.target.value), page: 1 })}>
              {[10, 20, 50].map((value) => <option value={value} key={value}>{value}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => { setSearchDraft(""); setSearchParams({}); }}>{t.resetFilters}</button>
        </section>
      ) : null}

      {productId || rating ? (
        <div className="s26-reviews-active-filters" style={{ display: "flex", gap: "8px", alignItems: "center", margin: "10px 0", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "var(--s26-text-muted, #64748b)" }}>{t.activeFilters}</span>
          {productId ? (
            <span className="s26-review-status is-published" style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }} onClick={() => updateQuery({ productId: "" })}>
              {t.tableProduct} <X size={13} />
            </span>
          ) : null}
          {rating ? (
            <span className="s26-review-status is-published" style={{ display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer" }} onClick={() => updateQuery({ rating: "" })}>
              {rating} {isIndo ? "Bintang" : `Star${rating > 1 ? "s" : ""}`} <X size={13} />
            </span>
          ) : null}
          <button type="button" style={{ border: "none", background: "none", color: "var(--review-primary, #034c85)", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }} onClick={() => { setSearchDraft(""); setSearchParams({}); }}>
            {t.clearAll}
          </button>
        </div>
      ) : null}

      {reviewsQuery.isError ? (
        <section className="s26-reviews-state is-error">
          <MessageSquareText size={34} />
          <h2>{isIndo ? "Gagal memuat ulasan" : "Unable to load reviews"}</h2>
          <p>{message(reviewsQuery.error, isIndo ? "Silakan coba lagi." : "Please try again.")}</p>
          <button type="button" onClick={() => reviewsQuery.refetch()}><RefreshCw size={16} /> {t.retry}</button>
        </section>
      ) : view?.items.length === 0 ? (
        <section className="s26-reviews-state">
          <PackageOpen size={38} />
          <h2>{t.noReviewsFound}</h2>
          <p>{search || status !== "all" || productId || rating ? t.noReviewsDescFiltered : t.noReviewsDescEmpty}</p>
          {search || status !== "all" || productId || rating ? (
            <button type="button" onClick={() => { setSearchDraft(""); setSearchParams({}); }}>{t.clearFilters}</button>
          ) : null}
        </section>
      ) : (
        <section className="s26-reviews-table-wrap">
          <table className="s26-reviews-table">
            <thead>
              <tr>
                <th>{t.tableProduct}</th>
                <th>{t.tableReviewer}</th>
                <th>{t.tableRating}</th>
                <th>{t.tableComment}</th>
                <th>{t.tableDate}</th>
                <th>{t.tableStatus}</th>
                <th>{t.tableActions}</th>
              </tr>
            </thead>
            <tbody>
              {view.items.map((review) => (
                <tr key={review.id}>
                  <td data-label={t.tableProduct}>
                    <div
                      className="s26-review-product"
                      style={{ cursor: "pointer" }}
                      onClick={() => updateQuery({ productId: review.productId, page: 1 })}
                      title={t.filterByProduct}
                    >
                      <ProductThumb review={review} />
                      <div>
                        <strong>{review.productName}</strong>
                        <span>{t.sku}: {review.productSku || "-"}</span>
                        <small>{rupiah(review.productPrice)}</small>
                      </div>
                    </div>
                  </td>
                  <td data-label={t.tableReviewer}>
                    <div className="s26-review-reviewer">
                      <span className="s26-review-avatar">{review.reviewerInitials}</span>
                      <div>
                        <strong>{review.reviewerName}</strong>
                        {review.verifiedBuyer ? <span>{t.verifiedBuyer}</span> : null}
                      </div>
                    </div>
                  </td>
                  <td data-label={t.tableRating}><Stars rating={review.rating} compact /></td>
                  <td data-label={t.tableComment}>
                    <p className="s26-review-comment">{review.comment || t.noComment}</p>
                    {review.reply ? <small className="s26-review-replied">{t.storeReplied}</small> : null}
                  </td>
                  <td data-label={t.tableDate}><time className="s26-review-date">{review.createdAtLabel}</time></td>
                  <td data-label={t.tableStatus}><ReviewStatus review={review} t={t} /></td>
                  <td data-label={t.tableActions}>
                    <div className="s26-review-row-actions">
                      <button type="button" onClick={() => setSelectedReviewId(review.id)}>
                        <MessageCircle size={16} /> {review.reply ? t.viewBtn : t.replyBtn}
                      </button>
                      <button type="button" aria-label={`View ${review.productName} review`} onClick={() => setSelectedReviewId(review.id)}>
                        <Eye size={17} />
                      </button>
                      <button type="button" aria-label="More review actions" onClick={() => setSelectedReviewId(review.id)}>
                        <MoreHorizontal size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {!reviewsQuery.isError && pagination.total > 0 ? (
        <footer className="s26-reviews-pagination">
          <span>
            {t.showing} {pagination.from} {t.to} {pagination.to} {t.of} {pagination.total} {t.reviews}
          </span>
          <div>
            <button type="button" disabled={pagination.page <= 1} onClick={() => updateQuery({ page: pagination.page - 1 })} aria-label="Previous page">
              <ChevronLeft size={17} />
            </button>
            {pages.map((number) => (
              <button type="button" key={number} className={number === pagination.page ? "is-active" : ""} onClick={() => updateQuery({ page: number })}>
                {number}
              </button>
            ))}
            <button type="button" disabled={pagination.page >= pagination.totalPages} onClick={() => updateQuery({ page: pagination.page + 1 })} aria-label="Next page">
              <ChevronRight size={17} />
            </button>
            <select value={limit} onChange={(event) => updateQuery({ limit: Number(event.target.value), page: 1 })} aria-label="Reviews per page">
              {[10, 20, 50].map((value) => <option value={value} key={value}>{value} {t.perPage}</option>)}
            </select>
          </div>
        </footer>
      ) : null}

      {selectedReviewId ? (
        <ReviewDrawer
          storeId={storeId}
          reviewId={selectedReviewId}
          canMutate={canMutate}
          onClose={() => setSelectedReviewId(null)}
          t={t}
        />
      ) : null}
    </div>
  );
}
