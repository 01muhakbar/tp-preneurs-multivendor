import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Image as ImageIcon,
  Plus,
  RefreshCw,
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

const isIndonesianLanguage = (i18nInstance) => {
  const current = String(
    i18nInstance?.language ||
      localStorage.getItem("app_lang") ||
      localStorage.getItem("store_language") ||
      localStorage.getItem("seller_language") ||
      localStorage.getItem("i18nextLng") ||
      "id"
  ).toLowerCase();
  return current.startsWith("id");
};

const TRANSLATIONS = {
  id: {
    eyebrow: "Ulasan Produk",
    title: "Ulasan Saya",
    subtitle: "Beri nilai produk dan kelola umpan balik pesanan selesai.",
    pendingStat: "Menunggu Diulas",
    pendingCaption: "Menunggu ulasan Anda",
    publishedStat: "Telah Diulas",
    publishedCaption: "Ulasan terkirim",
    tabNeed: "Menunggu Diulas",
    tabReviewed: "Sudah Diulas",
    emptyNeedTitle: "Belum ada produk yang perlu diulas",
    emptyNeedDesc: "Pesanan selesai yang memenuhi syarat ulasan akan muncul di sini.",
    emptyReviewedTitle: "Belum ada riwayat ulasan",
    emptyReviewedDesc: "Ulasan yang telah Anda kirimkan akan tampil di sini setelah dipublikasikan.",
    writeReview: "Beri Nilai",
    editReview: "Ubah Ulasan",
    storeReply: "Balasan Toko:",
    showing: "Menampilkan",
    of: "dari",
    reviewSubmitted: "Ulasan berhasil dikirim.",
    failedLoad: "Gagal memuat ulasan. Silakan muat ulang halaman.",
    retry: "Muat Ulang",
    pleaseLogin: "Silakan masuk terlebih dahulu.",
    goToLogin: "Ke Halaman Masuk",
    modalReviewProduct: "Beri Ulasan Produk",
    modalEditReview: "Ubah Ulasan Produk",
    orderDate: "Tanggal Pesanan",
    reviewedDate: "Tanggal Diulas",
    yourRating: "Penilaian Anda",
    excellent: "Sangat Bagus!",
    good: "Bagus",
    average: "Cukup",
    poor: "Kurang",
    terrible: "Sangat Kurang",
    addPhotos: "Tambah foto (hingga 4)",
    addPhotoBtn: "Tambah Foto",
    maxPhotosError: "Maksimal 4 foto.",
    formatError: "Hanya format foto JPG dan PNG yang diperbolehkan.",
    sizeError: "Setiap foto maksimal berukuran 2 MB.",
    yourReview: "Ulasan Anda",
    reviewPlaceholder: "Bagikan pengalaman Anda mengenai kualitas produk dan layanan toko...",
    selectRatingError: "Silakan pilih bintang penilaian.",
    minCharsError: "Silakan tulis ulasan minimal 3 karakter.",
    maxCharsError: "Ulasan tidak boleh lebih dari 2000 karakter.",
    submitting: "Mengirim...",
    updateReviewBtn: "Simpan Perubahan",
    submitReviewBtn: "Kirim Ulasan",
    storeLabel: "Toko",
    visitStore: "Kunjungi Toko",
  },
  en: {
    eyebrow: "Product feedback",
    title: "My Reviews",
    subtitle: "Rate products and manage feedback from completed orders.",
    pendingStat: "Pending",
    pendingCaption: "Awaiting your review",
    publishedStat: "Published",
    publishedCaption: "Reviews submitted",
    tabNeed: "Need Review",
    tabReviewed: "Reviewed",
    emptyNeedTitle: "No products waiting for review",
    emptyNeedDesc: "Completed orders that are eligible for review will appear here.",
    emptyReviewedTitle: "No reviewed products yet",
    emptyReviewedDesc: "Your submitted reviews will be listed here once published.",
    writeReview: "Write Review",
    editReview: "Edit Review",
    storeReply: "Store reply:",
    showing: "Showing",
    of: "of",
    reviewSubmitted: "Review submitted successfully.",
    failedLoad: "Failed to load reviews. Please reload.",
    retry: "Retry",
    pleaseLogin: "Please login.",
    goToLogin: "Go to login",
    modalReviewProduct: "Review Product",
    modalEditReview: "Edit Product Review",
    orderDate: "Order date",
    reviewedDate: "Reviewed",
    yourRating: "Your rating",
    excellent: "Excellent!",
    good: "Good",
    average: "Average",
    poor: "Poor",
    terrible: "Terrible",
    addPhotos: "Add photos (up to 4)",
    addPhotoBtn: "Add photo",
    maxPhotosError: "Maximum 4 photos.",
    formatError: "Only JPG and PNG photos are allowed.",
    sizeError: "Each photo must be 2 MB or smaller.",
    yourReview: "Your review",
    reviewPlaceholder: "Share your experience about product quality and store service...",
    selectRatingError: "Please select a rating.",
    minCharsError: "Please write at least 3 characters.",
    maxCharsError: "Review cannot exceed 2000 characters.",
    submitting: "Submitting...",
    updateReviewBtn: "Update Review",
    submitReviewBtn: "Submit Review",
    storeLabel: "Store",
    visitStore: "Visit Store",
  },
};

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

function StarRating({ value, onChange, readonly = false, isIndo = false }) {
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
            aria-label={
              isIndo
                ? `Beri bintang ${starValue}`
                : `Rate ${starValue} star${starValue > 1 ? "s" : ""}`
            }
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
  t,
  isIndo,
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
      setImageError(t.maxPhotosError);
      return;
    }

    const validFiles = [];
    for (const file of selected) {
      if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
        setImageError(t.formatError);
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setImageError(t.sizeError);
        return;
      }
      validFiles.push(file);
    }

    const nextFiles = validFiles.slice(0, remainingSlots);
    setNewFiles((current) => [...current, ...nextFiles]);
    setImageError(
      validFiles.length > nextFiles.length ? t.maxPhotosError : ""
    );
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (rating < 1) {
      setLocalError(t.selectRatingError);
      return;
    }
    if (trimmedComment.length < 3) {
      setLocalError(t.minCharsError);
      return;
    }
    if (trimmedComment.length > MAX_REVIEW_LENGTH) {
      setLocalError(t.maxCharsError);
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

  const getRatingFeedback = (val) => {
    switch (val) {
      case 5:
        return t.excellent;
      case 4:
        return t.good;
      case 3:
        return t.average;
      case 2:
        return t.poor;
      case 1:
        return t.terrible;
      default:
        return "";
    }
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
          <h2 id="review-modal-title">
            {mode === "edit" ? t.modalEditReview : t.modalReviewProduct}
          </h2>
          <button
            type="button"
            className="reviews-2026-icon-button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
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
              {item.storeName ? (
                <p>
                  <Store size={14} />
                  <span>{item.storeName}</span>
                </p>
              ) : null}
              <p>
                <CalendarDays size={14} />
                <span>
                  {mode === "edit" ? t.reviewedDate : t.orderDate}:{" "}
                  {formatReviewDate(item.orderedAt || item.createdAt, isIndo)}
                </span>
              </p>
            </div>
          </div>

          <div className="reviews-2026-field">
            <label>{t.yourRating}</label>
            <div className="reviews-2026-rating-row">
              <StarRating
                value={rating}
                onChange={setRating}
                isIndo={isIndo}
              />
              <span className="reviews-2026-rating-hint">
                {getRatingFeedback(rating)}
              </span>
            </div>
          </div>

          <div className="reviews-2026-field">
            <label>{t.addPhotos}</label>
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
                    aria-label="Remove"
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
                    aria-label="Remove"
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
                  <span>{t.addPhotoBtn}</span>
                </label>
              ) : null}
            </div>
            {imageError ? <p className="reviews-2026-error">{imageError}</p> : null}
          </div>

          <div className="reviews-2026-field">
            <label htmlFor="review-comment">{t.yourReview}</label>
            <div className="reviews-2026-textarea-wrap">
              <textarea
                id="review-comment"
                value={comment}
                maxLength={MAX_REVIEW_LENGTH}
                rows={4}
                onChange={(event) => setComment(event.target.value)}
                placeholder={t.reviewPlaceholder}
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
            <button
              type="button"
              className="reviews-2026-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="reviews-2026-btn-primary"
              disabled={!canSubmit}
            >
              {isSubmitting
                ? t.submitting
                : mode === "edit"
                  ? t.updateReviewBtn
                  : t.submitReviewBtn}
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
  const { i18n } = useTranslation();
  const [, setLangSync] = useState(0);

  useEffect(() => {
    const handleSync = () => setLangSync((c) => c + 1);
    i18n?.on?.("languageChanged", handleSync);
    window.addEventListener("storage", handleSync);
    window.addEventListener("store_language_changed", handleSync);
    return () => {
      i18n?.off?.("languageChanged", handleSync);
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("store_language_changed", handleSync);
    };
  }, [i18n]);

  const isIndo = isIndonesianLanguage(i18n);
  const t = isIndo ? TRANSLATIONS.id : TRANSLATIONS.en;

  const activeTab = searchParams.get("tab") === "reviewed" ? "reviewed" : "need";
  const page = clampPage(searchParams.get("page"));
  const targetProductId = Number(searchParams.get("productId")) || null;
  const autoOpenedRef = useRef(false);
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

  useEffect(() => {
    if (!targetProductId || autoOpenedRef.current) return;
    if (needQuery.isLoading || reviewedQuery.isLoading) return;

    const needMatch = needItems.find(
      (entry) => Number(entry.productId) === targetProductId
    );
    if (needMatch) {
      autoOpenedRef.current = true;
      setSubmitError("");
      setSubmitSuccess("");
      setModalState({ open: true, mode: "create", item: needMatch });
      return;
    }

    const reviewedMatch = reviewedItems.find(
      (entry) => Number(entry.productId) === targetProductId
    );
    if (reviewedMatch && activeTab !== "reviewed") {
      autoOpenedRef.current = true;
      routeTo("reviewed", 1);
    }
  }, [
    targetProductId,
    needItems,
    reviewedItems,
    needQuery.isLoading,
    reviewedQuery.isLoading,
    activeTab,
  ]);

  const saveReviewMutation = useMutation({
    mutationFn: async ({ item, mode, form }) => {
      if (
        mode === "create" &&
        !needItems.some((entry) => entry.productId === item.productId)
      ) {
        throw new Error(
          isIndo
            ? "Produk ini saat ini belum memenuhi syarat untuk diulas."
            : "This product is not currently eligible for review."
        );
      }
      if (mode === "edit" && !item.reviewId) {
        throw new Error(
          isIndo ? "ID ulasan tidak ditemukan." : "Review id is missing."
        );
      }

      const uploadedImages = [];
      for (const file of form.newFiles) {
        const uploaded = await uploadReviewAsset(file);
        const url = extractUploadUrl(uploaded);
        if (!url) {
          throw new Error(
            isIndo
              ? "Unggahan berhasil tetapi URL tidak ditemukan."
              : "Upload succeeded without URL."
          );
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["account", "reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["account", "orders"] }),
        queryClient.invalidateQueries({ queryKey: ["seller2026", "reviews"] }),
        queryClient.invalidateQueries({ queryKey: ["storefront", "product"] }),
      ]);
      setSubmitError("");
      setSubmitSuccess(t.reviewSubmitted);
      setModalState({ open: false, mode: "create", item: null });
      routeTo("reviewed", 1);
    },
    onError: (error) => {
      const status = error?.response?.status;
      const message =
        status === 409
          ? isIndo
            ? "Anda sudah memberikan ulasan untuk produk ini."
            : "You already reviewed this product."
          : error?.response?.data?.message ||
            error?.message ||
            (isIndo ? "Gagal mengirimkan ulasan." : "Failed to submit review.");
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

  const tabs = [
    { id: "need", label: t.tabNeed, count: needItems.length },
    { id: "reviewed", label: t.tabReviewed, count: reviewedItems.length },
  ];

  return (
    <div className="reviews-2026-page">
      <section className="reviews-2026-hero">
        <div>
          <span className="reviews-2026-eyebrow">{t.eyebrow}</span>
          <h1>{t.title}</h1>
          <p>{t.subtitle}</p>
        </div>
        <div className="reviews-2026-stats">
          <StatCard
            icon={Clock3}
            tone="pending"
            label={t.pendingStat}
            value={needItems.length}
            caption={t.pendingCaption}
          />
          <StatCard
            icon={CheckCircle2}
            tone="published"
            label={t.publishedStat}
            value={reviewedItems.length}
            caption={t.publishedCaption}
          />
        </div>
      </section>

      <div className="reviews-2026-tabs" role="tablist" aria-label="Review tabs">
        {tabs.map((tab) => (
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
              {t.pleaseLogin}{" "}
              <Link
                to="/auth/login"
                state={buildLoginRedirectState({
                  from: "/user/my-reviews",
                  authNotice: REVIEWS_LOGIN_REQUIRED_NOTICE,
                })}
              >
                {t.goToLogin}
              </Link>
            </p>
          ) : (
            <div className="reviews-2026-error-box">
              <p>{t.failedLoad}</p>
              <button
                type="button"
                className="reviews-2026-retry-btn"
                onClick={() => activeQuery.refetch()}
              >
                <RefreshCw size={15} />
                <span>{t.retry}</span>
              </button>
            </div>
          )}
        </section>
      ) : visibleItems.length === 0 ? (
        <section className="reviews-2026-empty">
          <ImageIcon size={32} />
          <h2>
            {activeTab === "need" ? t.emptyNeedTitle : t.emptyReviewedTitle}
          </h2>
          <p>
            {activeTab === "need" ? t.emptyNeedDesc : t.emptyReviewedDesc}
          </p>
        </section>
      ) : (
        <section className="reviews-2026-section">
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
                    {item.storeName ? (
                      <div className="reviews-2026-card__store-wrap">
                        <Store size={14} className="reviews-2026-card__store-icon" />
                        {item.storeSlug ? (
                          <Link
                            to={`/store/${item.storeSlug}`}
                            className="reviews-2026-card__store-btn"
                            title={`${t.visitStore} ${item.storeName}`}
                          >
                            {item.storeName}
                          </Link>
                        ) : (
                          <span className="reviews-2026-card__store-name">
                            {item.storeName}
                          </span>
                        )}
                      </div>
                    ) : null}
                    <span className="reviews-2026-card__date">
                      <CalendarDays size={14} />
                      {formatReviewDate(item.orderedAt, isIndo)}
                    </span>
                    <StarRating value={0} readonly isIndo={isIndo} />
                  </div>
                  <button
                    type="button"
                    className="reviews-2026-card__action-btn"
                    onClick={() => openCreateModal(item)}
                  >
                    {t.writeReview}
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
                    {item.storeName ? (
                      <div className="reviews-2026-card__store-wrap">
                        <Store size={14} className="reviews-2026-card__store-icon" />
                        {item.storeSlug ? (
                          <Link
                            to={`/store/${item.storeSlug}`}
                            className="reviews-2026-card__store-btn"
                            title={`${t.visitStore} ${item.storeName}`}
                          >
                            {item.storeName}
                          </Link>
                        ) : (
                          <span className="reviews-2026-card__store-name">
                            {item.storeName}
                          </span>
                        )}
                      </div>
                    ) : null}
                    {item.sellerReply ? (
                      <div className="reviews-2026-card__seller-reply">
                        <strong>{t.storeReply}</strong> {item.sellerReply}
                      </div>
                    ) : null}
                    <StarRating value={item.rating} readonly isIndo={isIndo} />
                    <span className="reviews-2026-card__date">
                      <CalendarDays size={14} />
                      {formatReviewDate(item.createdAt, isIndo)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="reviews-2026-card__action-btn is-edit"
                    onClick={() => openEditModal(item)}
                  >
                    {t.editReview}
                  </button>
                </article>
              )
            )}
          </div>

          <footer className="reviews-2026-pagination">
            <span>
              {t.showing} {startLabel}-{endLabel} {t.of} {totalItems}
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
        t={t}
        isIndo={isIndo}
      />
    </div>
  );
}
