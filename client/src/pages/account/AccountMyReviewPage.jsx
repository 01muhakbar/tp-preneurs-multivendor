import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  Plus,
  Star,
  Store,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  createProductReview,
  fetchMyReviewNeeds,
  fetchMyReviews,
  updateProductReview,
  uploadReviewAsset,
} from "../../api/reviews.service.ts";
import {
  buildReviewPayload,
  extractUploadUrl,
  formatReviewDate,
  getAssetUrl,
  MAX_REVIEW_IMAGES,
  MAX_REVIEW_LENGTH,
  normalizeNeedReviewItem,
  normalizeReviewedItem,
  REVIEW_TABS,
  unwrapReviewCollection,
} from "../../utils/reviewViewModel.js";
import {
  buildLoginRedirectState,
  REVIEWS_LOGIN_REQUIRED_NOTICE,
} from "../../auth/loginRedirectState.ts";
import "./AccountMyReviewPage.css";

const PAGE_SIZE = 6;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const clampPage = (value) => {
  const nextPage = Number(value || 1);
  return Number.isFinite(nextPage) && nextPage > 0 ? Math.floor(nextPage) : 1;
};

function ProductImage({ src, alt, className }) {
  const [imageSrc, setImageSrc] = useState(src || "");

  useEffect(() => {
    setImageSrc(src || "");
  }, [src]);

  if (!imageSrc) {
    return (
      <span className={`${className || ""} reviews-2026-image-fallback`}>
        <ImageIcon size={22} />
      </span>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setImageSrc("")}
    />
  );
}

function StarRating({ value, onChange, readonly = false }) {
  const rating = Number(value) || 0;

  return (
    <div className="reviews-2026-stars" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const active = starValue <= rating;
        const Icon = (
          <Star
            size={readonly ? 16 : 28}
            fill={active ? "currentColor" : "none"}
            strokeWidth={readonly ? 2.2 : 2}
          />
        );

        if (readonly) {
          return (
            <span
              key={starValue}
              className={active ? "is-active" : ""}
              aria-hidden="true"
            >
              {Icon}
            </span>
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            className={active ? "is-active" : ""}
            onClick={() => onChange?.(starValue)}
            aria-label={`Rate ${starValue} star`}
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value, caption }) {
  return (
    <article className={`reviews-2026-stat is-${tone}`}>
      <span className="reviews-2026-stat__icon">
        <Icon size={24} />
      </span>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{caption}</small>
      </div>
    </article>
  );
}

function ReviewModal({
  open,
  mode,
  item,
  onClose,
  onSubmit,
  isSubmitting,
  submitError,
}) {
  const initialImages = useMemo(
    () => (Array.isArray(item?.images) ? item.images : []),
    [item?.images]
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [localError, setLocalError] = useState("");
  const [imageError, setImageError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRating(mode === "edit" ? Number(item?.rating || 0) : 5);
    setComment(mode === "edit" ? String(item?.comment || "") : "");
    setExistingImages(initialImages.slice(0, MAX_REVIEW_IMAGES));
    setNewFiles([]);
    setLocalError("");
    setImageError("");
  }, [initialImages, item?.comment, item?.rating, mode, open]);

  const newFilePreviews = useMemo(
    () =>
      newFiles.map((file, index) => ({
        id: `${file.name}-${file.lastModified}-${index}`,
        file,
        preview: URL.createObjectURL(file),
      })),
    [newFiles]
  );

  useEffect(
    () => () => {
      newFilePreviews.forEach((entry) => URL.revokeObjectURL(entry.preview));
    },
    [newFilePreviews]
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) {
        onClose?.();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose, open]);

  if (!open || !item) return null;

  const selectedCount = existingImages.length + newFiles.length;
  const remainingSlots = Math.max(0, MAX_REVIEW_IMAGES - selectedCount);
  const trimmedComment = comment.trim();
  const canSubmit =
    rating >= 1 &&
    trimmedComment.length >= 3 &&
    trimmedComment.length <= MAX_REVIEW_LENGTH &&
    !isSubmitting;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !isSubmitting) {
      onClose?.();
    }
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = "";
    if (!selected.length) return;

    if (remainingSlots <= 0) {
      setImageError("Maximum 4 photos.");
      return;
    }

    const validFiles = [];
    for (const file of selected) {
      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        setImageError("Only JPG and PNG photos are allowed.");
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError("Each photo must be 2 MB or smaller.");
        return;
      }
      validFiles.push(file);
    }

    const nextFiles = validFiles.slice(0, remainingSlots);
    setNewFiles((current) => [...current, ...nextFiles]);
    setImageError(
      validFiles.length > nextFiles.length ? "Maximum 4 photos." : ""
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rating < 1) {
      setLocalError("Please select a rating.");
      return;
    }
    if (trimmedComment.length < 3) {
      setLocalError("Please write at least 3 characters.");
      return;
    }
    if (trimmedComment.length > MAX_REVIEW_LENGTH) {
      setLocalError(`Review cannot exceed ${MAX_REVIEW_LENGTH} characters.`);
      return;
    }
    setLocalError("");
    onSubmit?.({
      rating,
      comment: trimmedComment,
      existingImages,
      newFiles,
    });
  };

  return (
    <div className="reviews-2026-modal-backdrop" onClick={handleBackdropClick}>
      <section
        className="reviews-2026-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
      >
        <header className="reviews-2026-modal__header">
          <h2 id="review-modal-title">{mode === "edit" ? "Edit Review" : "Review Product"}</h2>
          <button
            type="button"
            className="reviews-2026-icon-button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close review modal"
          >
            <X size={21} />
          </button>
        </header>

        <form className="reviews-2026-modal__body" onSubmit={handleSubmit}>
          <div className="reviews-2026-modal-product">
            <ProductImage
              src={item.imageUrl}
              alt={item.name}
              className="reviews-2026-modal-product__image"
            />
            <div>
              <h3>{item.name}</h3>
              <p>
                <Store size={14} />
                {item.storeName}
              </p>
              <p>
                <CalendarDays size={14} />
                {mode === "edit" ? "Reviewed" : "Order date"}:{" "}
                {formatReviewDate(item.orderedAt || item.createdAt)}
              </p>
            </div>
          </div>

          <div className="reviews-2026-field">
            <label>Your rating</label>
            <div className="reviews-2026-rating-row">
              <StarRating value={rating} onChange={setRating} />
              {rating === 5 ? <span>Excellent!</span> : null}
            </div>
          </div>

          <div className="reviews-2026-field">
            <label>Add photos (up to 4)</label>
            <div className="reviews-2026-photo-grid">
              {existingImages.map((image, index) => (
                <figure key={`existing-${image}-${index}`}>
                  <img src={getAssetUrl(image)} alt="" />
                  <button
                    type="button"
                    onClick={() =>
                      setExistingImages((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    disabled={isSubmitting}
                    aria-label="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </figure>
              ))}
              {newFilePreviews.map((entry, index) => (
                <figure key={entry.id}>
                  <img src={entry.preview} alt="" />
                  <button
                    type="button"
                    onClick={() =>
                      setNewFiles((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    disabled={isSubmitting}
                    aria-label="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </figure>
              ))}
              {remainingSlots > 0 ? (
                <label className="reviews-2026-photo-add">
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    onChange={handleFileChange}
                    disabled={isSubmitting}
                  />
                  <Plus size={24} />
                  <span>Add photo</span>
                </label>
              ) : null}
            </div>
            {imageError ? <p className="reviews-2026-error">{imageError}</p> : null}
          </div>

          <div className="reviews-2026-field">
            <label htmlFor="review-comment">Your review</label>
            <div className="reviews-2026-textarea-wrap">
              <textarea
                id="review-comment"
                value={comment}
                maxLength={MAX_REVIEW_LENGTH}
                rows={5}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Excellent product and smooth service. Highly recommended."
                disabled={isSubmitting}
              />
              <span>
                {comment.length}/{MAX_REVIEW_LENGTH}
              </span>
            </div>
          </div>

          {localError || submitError ? (
            <p className="reviews-2026-error">{localError || submitError}</p>
          ) : null}

          <footer className="reviews-2026-modal__footer">
            <button type="submit" disabled={!canSubmit}>
              {isSubmitting
                ? "Submitting..."
                : mode === "edit"
                  ? "Update Review"
                  : "Submit Review"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function AccountMyReviewPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "reviewed" ? "reviewed" : "need";
  const page = clampPage(searchParams.get("page"));
  const [modalState, setModalState] = useState({
    open: false,
    mode: "create",
    item: null,
  });
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const routeTo = (tab, nextPage) => {
    const params = new URLSearchParams(searchParams);
    if (tab === "reviewed") {
      params.set("tab", "reviewed");
    } else {
      params.delete("tab");
    }
    params.set("page", String(Math.max(1, nextPage)));
    setSearchParams(params);
  };

  const requestParams = useMemo(
    () => ({ page, limit: PAGE_SIZE }),
    [page]
  );

  const needQuery = useQuery({
    queryKey: ["account", "reviews", "need", requestParams],
    queryFn: () => fetchMyReviewNeeds(requestParams),
    staleTime: 30_000,
  });

  const reviewedQuery = useQuery({
    queryKey: ["account", "reviews", "reviewed", requestParams],
    queryFn: () => fetchMyReviews(requestParams),
    staleTime: 30_000,
  });

  const needCollection = useMemo(
    () => unwrapReviewCollection(needQuery.data),
    [needQuery.data]
  );
  const reviewedCollection = useMemo(
    () => unwrapReviewCollection(reviewedQuery.data),
    [reviewedQuery.data]
  );

  const needItems = useMemo(
    () => needCollection.items.map(normalizeNeedReviewItem),
    [needCollection.items]
  );
  const reviewedItems = useMemo(
    () => reviewedCollection.items.map(normalizeReviewedItem),
    [reviewedCollection.items]
  );

  const activeItems = activeTab === "need" ? needItems : reviewedItems;
  const activeTotal =
    activeTab === "need" ? needCollection.totalItems : reviewedCollection.totalItems;
  const shouldClientPaginate =
    activeItems.length > PAGE_SIZE || activeTotal <= activeItems.length;
  const visibleItems = shouldClientPaginate
    ? activeItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : activeItems;
  const totalItems = shouldClientPaginate ? activeItems.length : activeTotal;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startLabel = totalItems === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endLabel = totalItems === 0 ? 0 : Math.min(totalItems, page * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const maxButtons = 4;
    const start = Math.max(1, Math.min(page, totalPages - maxButtons + 1));
    const end = Math.min(totalPages, start + maxButtons - 1);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [page, totalPages]);

  useEffect(() => {
    if (page > totalPages) {
      routeTo(activeTab, totalPages);
    }
  }, [activeTab, page, totalPages]);

  const saveReviewMutation = useMutation({
    mutationFn: async ({ item, mode, form }) => {
      if (mode === "create" && !needItems.some((entry) => entry.productId === item.productId)) {
        throw new Error("This product is not currently eligible for review.");
      }
      if (mode === "edit" && !item.reviewId) {
        throw new Error("Review id is missing.");
      }

      const uploadedImages = [];
      for (const file of form.newFiles) {
        const uploaded = await uploadReviewAsset(file);
        const url = extractUploadUrl(uploaded);
        if (!url) {
          throw new Error("Upload succeeded without URL.");
        }
        uploadedImages.push(url);
      }

      const payload = buildReviewPayload({
        productId: item.productId,
        rating: form.rating,
        comment: form.comment,
        existingImages: form.existingImages,
        uploadedImages,
      });

      if (mode === "edit") {
        const { productId: _productId, ...updatePayload } = payload;
        return updateProductReview(item.reviewId, updatePayload);
      }

      return createProductReview(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["account", "reviews"] });
      setSubmitError("");
      setSubmitSuccess("Review submitted successfully.");
      setModalState({ open: false, mode: "create", item: null });
      routeTo("reviewed", 1);
    },
    onError: (error) => {
      const status = error?.response?.status;
      const message =
        status === 409
          ? "You already reviewed this product."
          : error?.response?.data?.message ||
            error?.message ||
            "Failed to submit review.";
      setSubmitError(message);
    },
  });

  const activeQuery = activeTab === "need" ? needQuery : reviewedQuery;
  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;
  const error = activeQuery.error;
  const isUnauthorized = error?.response?.status === 401;

  const openCreateModal = (item) => {
    setSubmitError("");
    setSubmitSuccess("");
    setModalState({ open: true, mode: "create", item });
  };

  const openEditModal = (item) => {
    setSubmitError("");
    setSubmitSuccess("");
    setModalState({ open: true, mode: "edit", item });
  };

  const handleTabChange = (tab) => {
    setSubmitError("");
    setSubmitSuccess("");
    routeTo(tab, 1);
  };

  return (
    <div className="reviews-2026-page">
      <section className="reviews-2026-hero">
        <div>
          <span className="reviews-2026-eyebrow">Product feedback</span>
          <h1>My Reviews</h1>
          <p>Rate products and manage feedback from completed orders.</p>
        </div>
        <div className="reviews-2026-stats">
          <StatCard
            icon={Clock3}
            tone="pending"
            label="Pending"
            value={needItems.length}
            caption="Awaiting your review"
          />
          <StatCard
            icon={CheckCircle2}
            tone="published"
            label="Published"
            value={reviewedItems.length}
            caption="Reviews submitted"
          />
        </div>
      </section>

      <div className="reviews-2026-tabs" role="tablist" aria-label="Review tabs">
        {REVIEW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={activeTab === tab.id ? "is-active" : ""}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {submitSuccess ? (
        <div className="reviews-2026-success" role="status">
          {submitSuccess}
        </div>
      ) : null}

      {isLoading ? (
        <section className="reviews-2026-section">
          <div className="reviews-2026-skeleton" />
          <div className="reviews-2026-skeleton" />
        </section>
      ) : isError ? (
        <section className="reviews-2026-empty is-error">
          {isUnauthorized ? (
            <p>
              Please login.{" "}
              <Link
                to="/auth/login"
                state={buildLoginRedirectState({
                  from: "/user/my-reviews",
                  authNotice: REVIEWS_LOGIN_REQUIRED_NOTICE,
                })}
              >
                Go to login
              </Link>
            </p>
          ) : (
            <p>Failed to load reviews.</p>
          )}
        </section>
      ) : visibleItems.length === 0 ? (
        <section className="reviews-2026-empty">
          <ImageIcon size={28} />
          <h2>
            {activeTab === "need"
              ? "No products waiting for review"
              : "No reviewed products yet"}
          </h2>
          <p>
            {activeTab === "need"
              ? "Completed orders that are eligible for review will appear here."
              : "Your submitted reviews will be listed here once published."}
          </p>
        </section>
      ) : (
        <section className="reviews-2026-section">
          <h2>{activeTab === "need" ? "Pending Reviews" : "Your Reviewed Products"}</h2>
          <div className="reviews-2026-list">
            {visibleItems.map((item) =>
              activeTab === "need" ? (
                <article className="reviews-2026-card is-pending" key={item.id}>
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="reviews-2026-card__image"
                  />
                  <div className="reviews-2026-card__content">
                    <h3>{item.name}</h3>
                    <p>{item.storeName}</p>
                    <span>
                      <CalendarDays size={14} />
                      {formatReviewDate(item.orderedAt)}
                    </span>
                    <StarRating value={0} readonly />
                  </div>
                  <button type="button" onClick={() => openCreateModal(item)}>
                    Write Review
                  </button>
                </article>
              ) : (
                <article className="reviews-2026-card is-reviewed" key={item.id}>
                  <ProductImage
                    src={item.imageUrl}
                    alt={item.name}
                    className="reviews-2026-card__image"
                  />
                  <div className="reviews-2026-card__content">
                    <h3>{item.name}</h3>
                    <p>{item.storeName}</p>
                    {item.sellerReply ? (
                      <p className="reviews-2026-card__seller-reply">
                        <strong>Store reply:</strong> {item.sellerReply}
                      </p>
                    ) : null}
                    <StarRating value={item.rating} readonly />
                    <span>
                      <CalendarDays size={14} />
                      {formatReviewDate(item.createdAt)}
                    </span>
                  </div>
                  <button type="button" onClick={() => openEditModal(item)}>
                    Edit Review
                  </button>
                </article>
              )
            )}
          </div>

          <footer className="reviews-2026-pagination">
            <span>
              Showing {startLabel}-{endLabel} of {totalItems}
            </span>
            <div>
              <button
                type="button"
                onClick={() => routeTo(activeTab, page - 1)}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft size={18} />
              </button>
              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  className={pageNumber === page ? "is-active" : ""}
                  onClick={() => routeTo(activeTab, pageNumber)}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                onClick={() => routeTo(activeTab, page + 1)}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </footer>
        </section>
      )}

      <ReviewModal
        open={modalState.open}
        mode={modalState.mode}
        item={modalState.item}
        onClose={() => setModalState({ open: false, mode: "create", item: null })}
        onSubmit={(form) =>
          saveReviewMutation.mutate({
            item: modalState.item,
            mode: modalState.mode,
            form,
          })
        }
        isSubmitting={saveReviewMutation.isPending}
        submitError={submitError}
      />
    </div>
  );
}
