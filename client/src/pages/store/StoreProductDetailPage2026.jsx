import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Heart,
  Home,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  SearchX,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Star,
  Store,
  Tag,
  Truck,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCart } from "../../hooks/useCart.ts";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import { useProduct, useProducts } from "../../storefront.jsx";
import { ensureProductImageUrl, resolveProductImageUrl } from "../../utils/productImage.js";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import { toPreferredWhatsAppLink } from "../../utils/storePublicIdentity.ts";
import { getStorePublicIdentityBySlug } from "../../api/storePublicIdentity.ts";
import { fetchStoreCoupons } from "../../api/storeCoupons.ts";
import "./store-product-detail-2026.css";

const DEFAULT_LIMIT = 12;

const text = (...values) => {
  for (const value of values) {
    const normalized = String(value ?? "").trim();
    if (normalized) return normalized;
  }
  return "";
};

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toPositive = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const rupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(toNumber(value, 0));

export function CartPlusIcon({ className = "h-5 w-5", ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
      <line x1="10.5" y1="11.5" x2="16.5" y2="11.5" />
      <line x1="13.5" y1="8.5" x2="13.5" y2="14.5" />
    </svg>
  );
}

export const normalizePayload = (payload) =>
  payload?.data?.data ?? payload?.data ?? payload?.product ?? payload ?? null;

export const normalizeArray = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

export const getProductSlug = (product) =>
  text(product?.routeSlug, product?.slug, product?.seo?.slug, product?.id);

export const getProductName = (product) =>
  text(product?.name, product?.title, product?.productName, "Product");

export const getCategoryName = (product) =>
  text(product?.category?.name, product?.categoryName, product?.category?.title, "Umum");

export const getProductImages = (product) => {
  const candidates = [
    resolveProductImageUrl(product),
    product?.variantImage,
    product?.imageUrl,
    product?.image,
    product?.thumbnail,
    ...(Array.isArray(product?.images) ? product.images : []),
    ...(Array.isArray(product?.imagePaths) ? product.imagePaths : []),
    ...(Array.isArray(product?.imageUrls) ? product.imageUrls : []),
    ...(Array.isArray(product?.gallery)
      ? product.gallery.map((item) => item?.url ?? item?.imageUrl ?? item)
      : []),
  ];
  return Array.from(
    new Set(
      candidates
        .map((item) => ensureProductImageUrl(item))
        .filter(Boolean)
        .map((image) => resolveAssetUrl(image))
    )
  );
};

export const getBasePrice = (product) =>
  toPositive(product?.salePrice, 0) ||
  toPositive(product?.price, 0) ||
  toPositive(product?.finalPrice, 0);

export const getOriginalPrice = (product) =>
  toPositive(product?.originalPrice, 0) ||
  toPositive(product?.compareAtPrice, 0) ||
  toPositive(product?.regularPrice, 0) ||
  toPositive(product?.price, 0);

export const getDiscountPercent = (product) => {
  const explicit = toPositive(product?.discountPercent ?? product?.discount?.percent, 0);
  if (explicit) return Math.round(explicit);
  const price = getBasePrice(product);
  const original = getOriginalPrice(product);
  if (original > price && price > 0) return Math.round(((original - price) / original) * 100);
  return 0;
};

export const getRating = (product) =>
  Math.min(5, Math.max(0, toNumber(product?.ratingAvg ?? product?.averageRating ?? product?.rating, 0)));

export const getReviewCount = (product) =>
  Math.max(0, Math.round(toNumber(product?.reviewCount ?? product?.reviewsCount ?? product?.ratingCount, 0)));

export const getStock = (product, selectedVariant) => {
  const value =
    selectedVariant?.stock ??
    selectedVariant?.quantity ??
    selectedVariant?.availableStock ??
    product?.stock ??
    product?.availableStock;
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : null;
};

export const getUnit = (product) =>
  text(product?.unit, product?.weight ? `${product.weight} kg` : "", product?.tags?.unit, "1 pcs");

export const getProductDescription = (product) =>
  text(product?.description, product?.shortDescription, product?.details, "");

export const getReviews = (product) => {
  const raw = normalizeArray(product?.reviews, ["items", "reviews"]);
  return raw.map((review, index) => ({
    id: review?.id ?? `review-${index}`,
    name: text(review?.user?.name, review?.customer?.name, review?.name, review?.author, `Pelanggan ${index + 1}`),
    rating: Math.min(5, Math.max(1, toNumber(review?.rating, 5))),
    date: review?.createdAt
      ? new Date(review.createdAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "",
    comment: text(review?.comment, review?.review),
    sellerReply: text(review?.sellerReply, review?.reply),
    images: (Array.isArray(review?.images) ? review.images : [])
      .map((image) => resolveAssetUrl(image))
      .filter(Boolean)
      .slice(0, 4),
  }));
};

const selectionKey = (attributeId, valueId, value) =>
  `${attributeId}:${String(valueId ?? value ?? "").trim().toLowerCase()}`;

export const normalizeVariationGroups = (product) => {
  const raw = product?.variations || product?.variationOptions || product?.options;
  const groups = [];

  if (raw && !Array.isArray(raw) && Array.isArray(raw.selectedAttributes)) {
    const valueGroups = Array.isArray(raw.selectedAttributeValues) ? raw.selectedAttributeValues : [];
    raw.selectedAttributes.forEach((attribute, index) => {
      const attributeId = Number(attribute?.id ?? attribute?.attributeId ?? index + 1);
      const valuesEntry = valueGroups.find((item) => Number(item?.attributeId) === attributeId);
      const options = (Array.isArray(valuesEntry?.values) ? valuesEntry.values : [])
        .map((option, optionIndex) => {
          const label = text(option?.label, option?.value);
          if (!label) return null;
          return {
            id: `${attributeId}-${optionIndex}`,
            value: label,
            valueId: option?.id ?? option?.valueId ?? null,
            selectionKey: selectionKey(attributeId, option?.id ?? option?.valueId, label),
          };
        })
        .filter(Boolean);
      if (options.length > 0) {
        groups.push({
          id: String(attributeId),
          attributeId,
          label: text(attribute?.name, attribute?.label, `Pilihan ${index + 1}`),
          options,
        });
      }
    });
    return groups;
  }

  return (Array.isArray(raw) ? raw : [])
    .map((group, index) => {
      const attributeId = Number(group?.attributeId ?? group?.id ?? index + 1);
      const options = normalizeArray(group?.options ?? group?.values, ["items", "options", "values"])
        .map((option, optionIndex) => {
          const label = text(option?.label, option?.value, option?.name, option);
          if (!label) return null;
          return {
            id: `${attributeId}-${optionIndex}`,
            value: label,
            valueId: option?.id ?? option?.valueId ?? null,
            selectionKey: selectionKey(attributeId, option?.id ?? option?.valueId, label),
          };
        })
        .filter(Boolean);
      if (options.length === 0) return null;
      return {
        id: String(attributeId),
        attributeId,
        label: text(group?.label, group?.name, group?.attributeName, `Pilihan ${index + 1}`),
        options,
      };
    })
    .filter(Boolean);
};

export const normalizeVariants = (product) => {
  const raw =
    product?.variants ||
    product?.variantOptions ||
    product?.variationItems ||
    product?.variations?.variants ||
    [];
  return (Array.isArray(raw) ? raw : []).map((variant, index) => {
    const selections = normalizeArray(variant?.selections, ["items", "selections"]).map((selection) => {
      const attributeId = Number(selection?.attributeId ?? selection?.id);
      const value = text(selection?.value, selection?.label, selection?.name);
      return {
        attributeId,
        attributeName: text(selection?.attributeName, selection?.name),
        valueId: selection?.valueId ?? null,
        value,
        selectionKey: selectionKey(attributeId, selection?.valueId, value),
      };
    });
    const combinationKey =
      text(variant?.combinationKey) || selections.map((selection) => selection.selectionKey).join("|");
    return {
      ...variant,
      id: variant?.id ?? `variant-${index}`,
      combinationKey,
      selections,
      variantKey: text(variant?.variantKey, combinationKey),
      variantLabel: text(variant?.combination, variant?.label, selections.map((item) => item.value).join(" / ")),
      sku: text(variant?.sku),
      barcode: text(variant?.barcode),
      price: variant?.price ?? variant?.regularPrice ?? null,
      salePrice: variant?.salePrice ?? variant?.sellingPrice ?? null,
      stock: variant?.stock ?? variant?.quantity ?? variant?.availableStock ?? null,
      image: ensureProductImageUrl(variant?.image ?? variant?.variantImage ?? ""),
    };
  });
};

export const resolveSelectedVariant = (product, selectedOptions) => {
  const variants = normalizeVariants(product);
  if (variants.length === 0) return null;
  const selectedValues = Object.values(selectedOptions || {}).map((item) => String(item).toLowerCase());
  if (selectedValues.length === 0) return null;
  return (
    variants.find((variant) =>
      variant.selections.length > 0
        ? variant.selections.every((selection) => selectedValues.includes(String(selection.selectionKey).toLowerCase()))
        : String(variant.combinationKey || "").toLowerCase() === selectedValues.join("|")
    ) || null
  );
};

export const getSelectedPrice = (product, selectedVariant) =>
  toPositive(selectedVariant?.salePrice, 0) ||
  toPositive(selectedVariant?.price, 0) ||
  getBasePrice(product);

export const getSelectedOriginalPrice = (product, selectedVariant) =>
  toPositive(selectedVariant?.price, 0) || getOriginalPrice(product);

export const isPurchasable = (product, selectedVariant, quantity) => {
  if (product?.purchaseState && product.purchaseState.isPurchasable === false) return false;
  const stock = getStock(product, selectedVariant);
  if (stock !== null && stock <= 0) return false;
  if (stock !== null && quantity > stock) return false;
  return true;
};

/* Reusable Touch & Mouse Swipe Slider Hook for PDP Hero Gallery & Lightbox */
function useSwipeSlider({
  itemCount,
  activeIndex,
  onChangeIndex,
  disabled = false,
  minSwipeDistance = 40,
}) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const currentDxRef = useRef(0);
  const directionRef = useRef(null); // 'horizontal' | 'vertical' | null
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const wasDraggingRef = useRef(false);

  const resetState = () => {
    isPointerDownRef.current = false;
    directionRef.current = null;
    currentDxRef.current = 0;
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (disabled || itemCount <= 1 || e.touches.length !== 1) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    currentDxRef.current = 0;
    directionRef.current = null;
    hasMovedRef.current = false;
    isPointerDownRef.current = true;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleTouchMove = (e) => {
    if (!isPointerDownRef.current || disabled || itemCount <= 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const dx = currentX - startXRef.current;
    const dy = currentY - startYRef.current;

    if (!directionRef.current) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
        directionRef.current = "horizontal";
        setIsDragging(true);
      } else if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
        directionRef.current = "vertical";
        isPointerDownRef.current = false;
        return;
      }
    }

    if (directionRef.current === "horizontal") {
      if (e.cancelable) e.preventDefault();
      hasMovedRef.current = true;
      currentDxRef.current = dx;

      // Elastic resistance at boundaries
      let effectiveDx = dx;
      if ((activeIndex === 0 && dx > 0) || (activeIndex === itemCount - 1 && dx < 0)) {
        effectiveDx = dx * 0.3;
      }
      setDragOffset(effectiveDx);
    }
  };

  const handleTouchEnd = () => {
    if (!isPointerDownRef.current && !directionRef.current) return;
    const dx = currentDxRef.current;

    if (directionRef.current === "horizontal") {
      if (hasMovedRef.current) {
        wasDraggingRef.current = true;
        setTimeout(() => {
          wasDraggingRef.current = false;
        }, 80);
      }
      if (Math.abs(dx) >= minSwipeDistance) {
        if (dx < 0 && activeIndex < itemCount - 1) {
          onChangeIndex(activeIndex + 1);
        } else if (dx > 0 && activeIndex > 0) {
          onChangeIndex(activeIndex - 1);
        }
      }
    }

    resetState();
  };

  const handleMouseDown = (e) => {
    if (disabled || itemCount <= 1 || e.button !== 0) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    currentDxRef.current = 0;
    directionRef.current = null;
    hasMovedRef.current = false;
    isPointerDownRef.current = true;
    setIsDragging(false);
    setDragOffset(0);
  };

  const handleMouseMove = (e) => {
    if (!isPointerDownRef.current || disabled || itemCount <= 1) return;
    const dx = e.clientX - startXRef.current;
    const dy = e.clientY - startYRef.current;

    if (!directionRef.current) {
      if (Math.abs(dx) > 6) {
        directionRef.current = "horizontal";
        setIsDragging(true);
      }
    }

    if (directionRef.current === "horizontal") {
      hasMovedRef.current = true;
      currentDxRef.current = dx;
      let effectiveDx = dx;
      if ((activeIndex === 0 && dx > 0) || (activeIndex === itemCount - 1 && dx < 0)) {
        effectiveDx = dx * 0.3;
      }
      setDragOffset(effectiveDx);
    }
  };

  const handleMouseUp = () => {
    if (!isPointerDownRef.current) return;
    handleTouchEnd();
  };

  return {
    dragOffset,
    isDragging,
    wasDraggingRef,
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: handleTouchEnd,
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseUp,
    },
  };
}

/* Lightbox Component with 1/N counter & Touch/Mouse Swipe Slider */
function ProductImageLightbox({ images, activeIndex, onChangeIndex, onClose, productName }) {
  const [zoom, setZoom] = useState(1);
  const activeImage = images[activeIndex] || "";

  useEffect(() => {
    setZoom(1);
  }, [activeIndex]);

  const { dragOffset, isDragging, wasDraggingRef, swipeHandlers } = useSwipeSlider({
    itemCount: images.length,
    activeIndex,
    onChangeIndex,
    disabled: zoom > 1,
  });

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft" && images.length > 1) {
        onChangeIndex((activeIndex - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        onChangeIndex((activeIndex + 1) % images.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length, onChangeIndex, onClose]);

  if (!activeImage && images.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/95 p-4 select-none"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-30 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Counter Pill in Lightbox */}
      <div className="absolute top-5 left-6 z-30 rounded-full bg-slate-900/80 px-4 py-1.5 text-xs font-bold text-white backdrop-blur">
        {activeIndex + 1} / {images.length}
      </div>

      <div className="absolute top-4 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.max(z - 0.5, 1));
          }}
          disabled={zoom <= 1}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => Math.min(z + 0.5, 3));
          }}
          disabled={zoom >= 3}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20 disabled:opacity-30"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChangeIndex((activeIndex - 1 + images.length) % images.length);
            }}
            className="absolute left-4 top-1/2 z-30 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChangeIndex((activeIndex + 1) % images.length);
            }}
            className="absolute right-4 top-1/2 z-30 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {zoom > 1 ? (
        <div className="h-full w-full overflow-auto" onClick={(e) => e.stopPropagation()}>
          <div className="flex min-h-full min-w-full items-center justify-center">
            <img
              src={activeImage}
              alt={productName || "Product"}
              className="transition-all duration-200 cursor-zoom-out select-none"
              style={{
                height: `${85 * zoom}vh`,
                maxWidth: "none",
                objectFit: "contain",
              }}
              onClick={() => setZoom(1)}
            />
          </div>
        </div>
      ) : (
        <div
          className="h-full w-full overflow-hidden touch-pan-y"
          onClick={(e) => e.stopPropagation()}
          {...swipeHandlers}
        >
          <div
            className={`flex h-full w-full items-center ${
              isDragging ? "" : "transition-transform duration-300 ease-out"
            }`}
            style={{
              transform: `translateX(calc(-${activeIndex * 100}% + ${dragOffset}px))`,
            }}
          >
            {images.map((img, idx) => (
              <div
                key={`lightbox-slide-${idx}`}
                className="flex h-full w-full shrink-0 items-center justify-center p-4 cursor-zoom-in"
                onClick={() => {
                  if (!wasDraggingRef.current) {
                    setZoom(2);
                  }
                }}
              >
                <img
                  src={img}
                  alt={`${productName || "Product"} - ${idx + 1}`}
                  className="max-h-[85vh] max-w-full object-contain pointer-events-none select-none transition-all duration-200"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* Stepper Component */
function QuantityStepper({ quantity, stock, disabled, onDecrease, onIncrease, onChange }) {
  return (
    <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900">
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || quantity <= 1}
        className="inline-flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Jumlah produk"
        value={quantity}
        onChange={(e) => {
          const val = Number(e.target.value.replace(/[^\d]/g, "")) || 1;
          onChange(stock !== null ? Math.min(stock, Math.max(1, val)) : Math.max(1, val));
        }}
        disabled={disabled}
        className="h-full w-12 border-0 bg-transparent text-center text-sm font-bold text-slate-900 outline-none dark:text-white"
      />
      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || (stock !== null && quantity >= stock)}
        className="inline-flex h-9 w-9 items-center justify-center text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export default function StoreProductDetailPage2026() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useStorefrontWishlist();
  const { t, i18n } = useTranslation();

  const isIndo =
    i18n.language === "id" ||
    i18n.language === "id-ID" ||
    i18n.language?.startsWith("id") ||
    (typeof window !== "undefined" && localStorage.getItem("store_language") === "Indonesia");

  const productQuery = useProduct(slug);
  const product = normalizePayload(productQuery.data);

  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [activeReviewFilter, setActiveReviewFilter] = useState("all");

  const variationGroups = useMemo(() => normalizeVariationGroups(product), [product]);
  const selectedVariant = useMemo(
    () => resolveSelectedVariant(product, selectedOptions),
    [product, selectedOptions]
  );

  const images = useMemo(() => {
    const variantImage = selectedVariant?.image ? [selectedVariant.image] : [];
    const all = Array.from(new Set([...variantImage, ...getProductImages(product)]));
    return all.length > 0 ? all : [""];
  }, [product, selectedVariant]);

  const {
    dragOffset: heroDragOffset,
    isDragging: isHeroDragging,
    wasDraggingRef: wasHeroDraggingRef,
    swipeHandlers: heroSwipeHandlers,
  } = useSwipeSlider({
    itemCount: images.length,
    activeIndex: activeImageIndex,
    onChangeIndex: setActiveImageIndex,
  });

  const activeImage = images[activeImageIndex] || images[0] || "";
  const price = getSelectedPrice(product, selectedVariant);
  const originalPrice = getSelectedOriginalPrice(product, selectedVariant);
  const discount =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : getDiscountPercent(product);
  const stock = getStock(product, selectedVariant);
  const canPurchase = isPurchasable(product, selectedVariant, quantity);
  const rating = getRating(product);
  const reviewCount = getReviewCount(product);
  const reviews = useMemo(() => getReviews(product), [product]);

  const productId = product?.id ?? product?.productId;
  const isWishlisted = wishlist.isWishlisted(productId);

  const storeInfo = product?.sellerInfo || product?.store || {};
  const storeName = text(storeInfo?.name, product?.storeName, "Toko Penjual");
  const storeSlug = text(storeInfo?.slug, product?.storeSlug, product?.store?.slug);
  const storeCity = text(product?.store?.city, storeInfo?.city, "Kota Makassar");
  const storeLogo = resolveAssetUrl(storeInfo?.logoUrl || product?.store?.logoUrl);

  const identityQuery = useQuery({
    queryKey: ["storefront", "identity", storeSlug],
    queryFn: () => getStorePublicIdentityBySlug(storeSlug),
    enabled: Boolean(storeSlug),
    staleTime: 60 * 1000,
  });

  const storeSummary = identityQuery.data?.data?.summary;
  const storeRatingAverage =
    storeSummary?.ratingAverage !== undefined && storeSummary?.ratingAverage !== null
      ? Number(storeSummary.ratingAverage)
      : storeInfo?.ratingAverage !== undefined && storeInfo?.ratingAverage !== null
        ? Number(storeInfo.ratingAverage)
        : rating;
  const storeRatingCount =
    storeSummary?.ratingCount !== undefined && storeSummary?.ratingCount !== null
      ? Number(storeSummary.ratingCount)
      : storeInfo?.ratingCount !== undefined && storeInfo?.ratingCount !== null
        ? Number(storeInfo.ratingCount)
        : reviewCount;
  const storeProductCount =
    storeSummary?.productCount !== undefined && storeSummary?.productCount !== null
      ? Number(storeSummary.productCount)
      : storeInfo?.productCount || 1;
  const storeResponseRate =
    storeSummary?.responseRate !== undefined && storeSummary?.responseRate !== null
      ? Number(storeSummary.responseRate)
      : storeInfo?.responseRate || 100;

  const filteredReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    if (activeReviewFilter === "photo") {
      return reviews.filter((r) => Array.isArray(r.images) && r.images.length > 0);
    }
    if (activeReviewFilter === "5star") return reviews.filter((r) => r.rating === 5);
    if (activeReviewFilter === "4star") return reviews.filter((r) => r.rating === 4);
    if (activeReviewFilter === "3star") return reviews.filter((r) => r.rating === 3);
    if (activeReviewFilter === "2star") return reviews.filter((r) => r.rating === 2);
    if (activeReviewFilter === "1star") return reviews.filter((r) => r.rating === 1);
    return reviews;
  }, [reviews, activeReviewFilter]);

  /* Store & Platform Coupons Query for Real Voucher Pricing */
  const storeId = product?.storeId ?? storeInfo?.storeId ?? product?.store?.id ?? null;
  const couponsQuery = useQuery({
    queryKey: ["storefront", "coupons", storeId, storeSlug],
    queryFn: () => fetchStoreCoupons({ storeId: storeId || undefined, storeSlug: storeSlug || undefined }),
    enabled: Boolean(storeId || storeSlug),
    staleTime: 60 * 1000,
  });

  const availableCoupons = useMemo(() => {
    const list = couponsQuery.data?.data;
    if (!Array.isArray(list)) return [];
    const now = new Date();
    return list.filter((c) => {
      if (!c || !c.code || c.published === false) return false;
      if (c.status && c.status.code !== "ACTIVE") return false;
      if (c.isPubliclyRedeemable === false) return false;
      if (c.startsAt && new Date(c.startsAt) > now) return false;
      if (c.expiresAt && new Date(c.expiresAt) < now) return false;
      return true;
    });
  }, [couponsQuery.data]);

  const bestVoucher = useMemo(() => {
    if (!availableCoupons.length || !price) return null;
    let best = null;
    let maxSaving = 0;
    for (const c of availableCoupons) {
      const minSpend = Number(c.minSpend) || 0;
      if (price < minSpend) continue;

      const discountType = String(c.discountType || "").toLowerCase();
      const amount = Number(c.amount || c.discountValue || 0);
      let saving = 0;
      if (discountType === "percent" || discountType === "percentage") {
        saving = Math.round((price * amount) / 100);
        const maxDiscount = Number(c.maxDiscount);
        if (Number.isFinite(maxDiscount) && maxDiscount > 0) {
          saving = Math.min(saving, maxDiscount);
        }
      } else {
        saving = Math.min(price, amount);
      }

      if (saving > maxSaving) {
        maxSaving = saving;
        best = { ...c, saving };
      }
    }
    return best;
  }, [availableCoupons, price]);

  const hasVoucher = Boolean(bestVoucher && bestVoucher.saving > 0);
  const voucherDiscount = hasVoucher ? bestVoucher.saving : 0;
  const priceWithVoucher = hasVoucher ? Math.max(0, price - voucherDiscount) : price;

  const rawWhatsApp =
    storeInfo?.chatHref ||
    storeInfo?.whatsapp ||
    storeInfo?.phone ||
    product?.store?.whatsapp ||
    product?.store?.phone;
  const defaultChatText = product?.name
    ? `Halo ${storeName}, saya tertarik dengan produk "${product.name}" di TP Preneurs.`
    : `Halo ${storeName}, saya tertarik dengan produk di toko Anda di TP Preneurs.`;
  const whatsappChatHref = rawWhatsApp
    ? toPreferredWhatsAppLink(rawWhatsApp, "", defaultChatText)
    : null;

  /* Fetch other products from the same store */
  const storeProductsQuery = useProducts({
    storeSlug: storeSlug || undefined,
    limit: 8,
    page: 1,
    enabled: Boolean(storeSlug),
  });

  const storeOtherProducts = useMemo(() => {
    const currentSlug = getProductSlug(product);
    return normalizeArray(storeProductsQuery.data, ["items", "products", "rows"])
      .filter((item) => getProductSlug(item) !== currentSlug)
      .slice(0, 6);
  }, [product, storeProductsQuery.data]);

  /* Recommendations query ("Kamu Mungkin Juga Suka") */
  const recsQuery = useProducts({
    category: product ? getCategoryName(product) : undefined,
    limit: DEFAULT_LIMIT,
    page: 1,
    sort: "featured",
    enabled: Boolean(product),
    keepPreviousData: true,
  });

  const recommendations = useMemo(() => {
    const currentSlug = getProductSlug(product);
    return normalizeArray(recsQuery.data, ["items", "products", "rows"])
      .filter((item) => getProductSlug(item) !== currentSlug)
      .slice(0, 6);
  }, [product, recsQuery.data]);

  useEffect(() => {
    const defaults = {};
    variationGroups.forEach((group) => {
      if (group.options[0]) defaults[group.id] = group.options[0].selectionKey;
    });
    setSelectedOptions(defaults);
    setQuantity(1);
    setActiveImageIndex(0);
    setIsDescExpanded(false);
  }, [getProductSlug(product), variationGroups.length]);

  const handleWishlistToggle = () => {
    wishlist.toggle({
      id: productId,
      productId: productId,
      slug: getProductSlug(product),
      name: getProductName(product),
      category: getCategoryName(product),
      price,
      originalPrice,
      imageUrl: activeImage,
      rating,
      reviewCount,
      stock,
      storeId: product?.storeId ?? storeInfo?.storeId ?? null,
      storeSlug,
    });
  };

  const buildSnapshot = (item, variant = null) => {
    const image = (variant?.image ? ensureProductImageUrl(variant.image) : "") || getProductImages(item)[0] || "";
    return {
      name: getProductName(item),
      price: getSelectedPrice(item, variant),
      imageUrl: image,
      stock: getStock(item, variant),
      slug: getProductSlug(item),
      storeId: item?.storeId ?? item?.store?.id ?? null,
      storeName: text(item?.storeName, item?.store?.name, item?.sellerInfo?.name),
      storeSlug: text(item?.storeSlug, item?.store?.slug),
      category: getCategoryName(item),
      variantKey: variant?.variantKey ?? variant?.combinationKey ?? null,
      variantLabel: variant?.variantLabel ?? null,
      variantSku: variant?.sku ?? null,
    };
  };

  const handleAddToCart = async () => {
    if (!canPurchase) return;
    setIsAdding(true);
    try {
      await cart.add(Number(product.id), quantity, buildSnapshot(product, selectedVariant));
    } finally {
      setTimeout(() => setIsAdding(false), 400);
    }
  };

  const handleBuyNow = async () => {
    if (!canPurchase) return;
    setIsAdding(true);
    try {
      const ok = await cart.add(Number(product.id), quantity, buildSnapshot(product, selectedVariant));
      if (ok) navigate("/cart");
    } finally {
      setTimeout(() => setIsAdding(false), 400);
    }
  };

  if (productQuery.isLoading) {
    return (
      <div className="pdp26-container px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[480px] animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-12 w-1/2 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
            <div className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.isError || !product) {
    return (
      <div className="pdp26-container px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--pdp-navy)]/10 text-[var(--pdp-navy)]">
          <SearchX className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-slate-900 dark:text-white">
          {t("productDetail.notFound")}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{t("productDetail.tryAnother")}</p>
        <Link
          to="/shop"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[var(--pdp-navy)] px-6 text-sm font-bold text-white transition hover:bg-[#023b68]"
        >
          {t("productDetail.backToShop")}
        </Link>
      </div>
    );
  }

  const categoryName = getCategoryName(product);
  const categorySlug = text(product?.category?.slug, product?.category?.code, categoryName);
  const rawDescription = getProductDescription(product);

  return (
    <div className="pdp26-container space-y-0 sm:space-y-4 px-0 sm:px-4 lg:px-6">
      {/* 1. Breadcrumb Navigation (Desktop Only - Hidden on Mobile to save vertical space) */}
      <nav className="hidden sm:flex flex-wrap items-center gap-1.5 pt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Link to="/" className="inline-flex items-center gap-1 hover:text-[var(--pdp-navy)] dark:hover:text-white">
          <Home className="h-3.5 w-3.5" />
          <span>{t("productDetail.home")}</span>
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link
          to={`/search?category=${encodeURIComponent(categorySlug)}&page=1`}
          className="hover:text-[var(--pdp-navy)] dark:hover:text-white"
        >
          {categoryName}
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="line-clamp-1 font-bold text-slate-900 dark:text-white">
          {getProductName(product)}
        </span>
      </nav>

      {/* 2. Top Main Card: Hero Gallery (Left) & Price/Title/Actions (Right) */}
      <div className="pdp26-card grid gap-0 sm:gap-6 p-0 sm:p-6 lg:grid-cols-2">
        {/* Left: Gallery with Shopee Counter (1/3) & Swipe Chevrons */}
        <div className="space-y-0 sm:space-y-3">
          <div
            className="relative aspect-square w-full overflow-hidden bg-slate-50 dark:bg-slate-900 sm:rounded-xl select-none touch-pan-y"
            {...heroSwipeHandlers}
          >
            {images.length > 0 && images[0] ? (
              <div
                className={`flex h-full w-full ${
                  isHeroDragging ? "" : "transition-transform duration-300 ease-out"
                }`}
                style={{
                  transform: `translateX(calc(-${activeImageIndex * 100}% + ${heroDragOffset}px))`,
                }}
              >
                {images.map((img, idx) => (
                  <div
                    key={`hero-img-${idx}`}
                    className="relative h-full w-full shrink-0 flex items-center justify-center p-2 cursor-zoom-in"
                    onClick={() => {
                      if (!wasHeroDraggingRef.current) {
                        setIsLightboxOpen(true);
                      }
                    }}
                    title={isIndo ? "Klik untuk memperbesar" : "Click to zoom"}
                  >
                    <img
                      src={img}
                      alt={`${getProductName(product)} - ${idx + 1}`}
                      className="h-full w-full object-contain pointer-events-none select-none transition duration-200 hover:scale-105"
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-slate-400">
                <ShoppingBag className="h-16 w-16" />
              </div>
            )}

            {/* Tap Chevrons for Easy Image Navigation on Mobile & Desktop */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((idx) => (idx - 1 + images.length) % images.length);
                  }}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/40 text-white backdrop-blur transition hover:bg-slate-900/60"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImageIndex((idx) => (idx + 1) % images.length);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/40 text-white backdrop-blur transition hover:bg-slate-900/60"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Shopee Style Counter Badge 1/N */}
            {images.length > 1 && (
              <div className="pdp26-counter-badge">
                {activeImageIndex + 1}/{images.length}
              </div>
            )}
          </div>

          {/* Thumbnails row (Desktop Only - hidden on mobile to avoid pushing content below fold) */}
          {images.length > 1 && (
            <div className="pdp26-hide-scroll hidden sm:flex gap-2 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`thumb-${idx}`}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-slate-50 transition dark:bg-slate-900 ${
                    idx === activeImageIndex
                      ? "border-[var(--pdp-orange)] ring-2 ring-[var(--pdp-orange)]/20"
                      : "border-slate-200 hover:border-slate-400 dark:border-white/10"
                  }`}
                >
                  <img
                    src={img}
                    alt={`${getProductName(product)} ${idx + 1}`}
                    className="h-full w-full object-contain p-1"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Shopee Price, Benefit Badges, Title & Variants */}
        <div className="flex flex-col justify-between space-y-4 p-4 sm:p-0">
          <div className="space-y-3">
            {/* Price Row with Shopee Orange, Voucher Badge & Right-aligned Heart Wishlist Icon */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="pdp26-price-main">
                  {rupiah(priceWithVoucher)}
                </span>
                {hasVoucher ? (
                  <span className="text-xs sm:text-sm font-bold text-slate-400 line-through">
                    {rupiah(price)}
                  </span>
                ) : originalPrice > price ? (
                  <span className="text-xs sm:text-sm font-bold text-slate-400 line-through">
                    {rupiah(originalPrice)}
                  </span>
                ) : null}
                {!hasVoucher && discount > 0 && (
                  <span className="rounded bg-rose-50 px-1.5 py-0.5 text-xs font-black text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
                    -{discount}%
                  </span>
                )}
                {hasVoucher && (
                  <span
                    className="pdp26-voucher-badge"
                    title={
                      isIndo
                        ? `Hemat ${rupiah(voucherDiscount)} dengan voucher ${bestVoucher.code}`
                        : `Save ${rupiah(voucherDiscount)} with voucher ${bestVoucher.code}`
                    }
                  >
                    <Tag className="h-3 w-3" />
                    <span>{t("productDetail.withVoucher")}</span>
                  </span>
                )}
              </div>

              {/* Shopee-style Wishlist Heart Button right beside price */}
              <button
                type="button"
                onClick={handleWishlistToggle}
                aria-label="Wishlist"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-[var(--pdp-orange)] transition"
              >
                <Heart
                  className={`h-5 w-5 ${
                    isWishlisted ? "fill-[var(--pdp-orange)] text-[var(--pdp-orange)]" : ""
                  }`}
                />
              </button>
            </div>

            {/* Installment / Payment Hint Row */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>{isIndo ? "Pembayaran Aman & Bergaransi" : "Secure Payment & Guaranteed"}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Product Title */}
            <h1 className="text-base sm:text-2xl font-black text-slate-900 leading-snug dark:text-white">
              {getProductName(product)}
            </h1>

            {/* Ratings, Review Count & Stock Pill */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {rating > 0 ? rating.toFixed(1) : "0.0"}
                </span>
              </div>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>
                {reviewCount > 0
                  ? t("productDetail.reviewsCount", { count: reviewCount })
                  : isIndo
                  ? "0 Ulasan"
                  : "0 Reviews"}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span>
                {product?.soldCount ? `${product.soldCount} ${isIndo ? "Terjual" : "Sold"}` : isIndo ? "0 Terjual" : "0 Sold"}
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  canPurchase
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                }`}
              >
                {canPurchase
                  ? stock !== null
                    ? `${t("productDetail.inStock")} (${stock})`
                    : t("productDetail.inStock")
                  : t("productDetail.unavailable")}
              </span>
            </div>

            {/* Variations / Options (if any) */}
            {variationGroups.length > 0 && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-white/10 dark:bg-slate-900/60">
                {variationGroups.map((group) => (
                  <div key={group.id} className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span>{group.label}</span>
                      <span className="text-[var(--pdp-navy)] dark:text-sky-400">
                        {group.options.find((opt) => opt.selectionKey === selectedOptions[group.id])?.value ||
                          t("productDetail.choose")}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((opt) => {
                        const active = selectedOptions[group.id] === opt.selectionKey;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() =>
                              setSelectedOptions((prev) => ({ ...prev, [group.id]: opt.selectionKey }))
                            }
                            className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold transition ${
                              active
                                ? "border-[var(--pdp-orange)] bg-[var(--pdp-orange-soft)] text-[var(--pdp-orange)]"
                                : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800 dark:text-slate-200"
                            }`}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity Stepper Row (Desktop only or optional) */}
            <div className="hidden sm:flex items-center gap-4 pt-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {isIndo ? "Kuantitas:" : "Quantity:"}
              </span>
              <QuantityStepper
                quantity={quantity}
                stock={stock}
                disabled={!canPurchase || isAdding}
                onDecrease={() => setQuantity((q) => Math.max(1, q - 1))}
                onIncrease={() => setQuantity((q) => (stock !== null ? Math.min(stock, q + 1) : q + 1))}
                onChange={setQuantity}
              />
              {stock !== null && (
                <span className="text-xs text-slate-500">
                  {isIndo ? `Tersisa ${stock} buah` : `${stock} pieces available`}
                </span>
              )}
            </div>
          </div>

          {/* Delivery & Protection Trust Rows (Shopee Style) */}
          <div className="space-y-0 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden dark:border-white/10 dark:bg-slate-900/40">
            <div className="pdp26-trust-row">
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {t("productDetail.deliveryEstimate")}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t("productDetail.deliveryHint")} ({storeCity})
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>

            <div className="pdp26-trust-row">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-[var(--pdp-navy)] dark:text-sky-400 shrink-0" />
                <span className="font-bold text-slate-900 dark:text-white">
                  {t("productDetail.returnGuarantee")} • {t("productDetail.productProtection")}
                </span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
            </div>
          </div>

          {/* Desktop Direct CTA Buttons */}
          <div className="hidden gap-3 sm:flex">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canPurchase || isAdding}
              className="pdp26-btn-add-cart"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
              <span>{t("productDetail.addToCart")}</span>
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!canPurchase || isAdding}
              className="pdp26-btn-buy-now"
            >
              <span>{t("productDetail.buyNow")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Shopee Section Divider */}
      <div className="pdp26-section-divider" />

      {/* 3. Penilaian Toko / Penilaian Produk (Shopee Style matching Gambar 1 & 5) */}
      <div className="pdp26-card p-4 sm:p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {storeRatingCount > 0 && storeRatingAverage ? Number(storeRatingAverage).toFixed(1) : "0.0"}
            </span>
            <div className="flex items-center gap-1 text-sm font-bold text-amber-500">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {t("productDetail.storeRating")} ({storeRatingCount})
              </span>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--pdp-navy)] dark:text-sky-400"
          >
            <span>{t("productDetail.viewAll")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Shopee Review Star Filter Pills */}
        <div className="pdp26-hide-scroll flex gap-2 overflow-x-auto pb-1">
          {[
            { key: "all", label: isIndo ? "Semua" : "All" },
            { key: "photo", label: isIndo ? "Dengan Foto" : "With Photos" },
            { key: "5star", label: isIndo ? "5 Bintang" : "5 Stars" },
            { key: "4star", label: isIndo ? "4 Bintang" : "4 Stars" },
            { key: "3star", label: isIndo ? "3 Bintang" : "3 Stars" },
            { key: "2star", label: isIndo ? "2 Bintang" : "2 Stars" },
            { key: "1star", label: isIndo ? "1 Bintang" : "1 Star" },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setActiveReviewFilter(item.key)}
              className={`pdp26-review-pill shrink-0 ${
                activeReviewFilter === item.key ? "is-active" : ""
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Reviews List */}
        {filteredReviews.length > 0 ? (
          <div className="space-y-3.5 pt-2 divide-y divide-slate-100 dark:divide-white/5">
            {filteredReviews.map((rev) => (
              <div key={rev.id} className="pt-3 first:pt-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--pdp-navy)]/10 text-xs font-black text-[var(--pdp-navy)]">
                      {rev.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{rev.name}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 ${
                              i < rev.rating
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">{rev.date}</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{rev.comment}</p>
                {rev.sellerReply && (
                  <div className="rounded-lg border-l-2 border-[var(--pdp-navy)] bg-slate-50 p-2 text-xs dark:bg-slate-900">
                    <span className="font-bold text-[var(--pdp-navy)] dark:text-sky-400">
                      {t("productDetail.storeReply")}:
                    </span>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300">{rev.sellerReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-2.5 text-xs text-slate-500 dark:text-slate-400">
            {storeRatingCount === 0
              ? isIndo
                ? "Belum ada ulasan untuk toko ini."
                : "No reviews for this store yet."
              : isIndo
                ? "Tidak ada ulasan pada filter ini."
                : "No reviews found for this filter."}
          </div>
        )}
      </div>

      {/* Shopee Section Divider */}
      <div className="pdp26-section-divider" />

      {/* 4. Shopee Seller / Store Card */}
      <div className="pdp26-card pdp26-store-card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="pdp26-store-avatar" />
            ) : (
              <div className="pdp26-store-avatar flex items-center justify-center text-[var(--pdp-navy)]">
                <Store className="h-6 w-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <Link
                  to={storeSlug ? `/store/${encodeURIComponent(storeSlug)}` : "/shop"}
                  className="text-sm sm:text-base font-black text-slate-900 hover:text-[var(--pdp-navy)] dark:text-white"
                >
                  {storeName}
                </Link>
                <BadgeCheck className="h-4 w-4 fill-emerald-500 text-white" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isIndo ? "Aktif beberapa saat lalu" : "Active recently"}
              </p>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3 w-3 text-slate-400" />
                <span>{storeCity}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={storeSlug ? `/store/${encodeURIComponent(storeSlug)}` : "/shop"}
              className="pdp26-btn-visit"
            >
              <span>{t("productDetail.visitStore")}</span>
            </Link>
          </div>
        </div>

        {/* 3 Metrics: Penilaian, Produk, Chat Dibalas */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/60 dark:divide-white/10 dark:border-white/10 dark:bg-slate-900/40">
          <div className="pdp26-metric-box">
            <span className="pdp26-metric-val">
              {storeRatingCount > 0 && storeRatingAverage ? Number(storeRatingAverage).toFixed(1) : "0.0"}
            </span>
            <span className="pdp26-metric-lbl">{t("productDetail.rating")}</span>
          </div>
          <div className="pdp26-metric-box">
            <span className="pdp26-metric-val">{storeProductCount}</span>
            <span className="pdp26-metric-lbl">{t("productDetail.productsCount")}</span>
          </div>
          <div className="pdp26-metric-box">
            <span className="pdp26-metric-val">{storeResponseRate ? `${storeResponseRate}%` : "100%"}</span>
            <span className="pdp26-metric-lbl">{t("productDetail.chatResponseRate")}</span>
          </div>
        </div>
      </div>

      {/* Shopee Section Divider */}
      <div className="pdp26-section-divider" />

      {/* 5. "Produk Lain Dari Toko Ini" Shelf */}
      {storeOtherProducts.length > 0 && (
        <>
          <div className="pdp26-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                {t("productDetail.otherProductsFromStore")}
              </h2>
              <Link
                to={storeSlug ? `/store/${encodeURIComponent(storeSlug)}` : "/shop"}
                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--pdp-navy)] dark:text-sky-400"
              >
                <span>{t("productDetail.viewAll")}</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="pdp26-shelf-scroll">
              {storeOtherProducts.map((item) => {
                const itemImg = getProductImages(item)[0] || "";
                const itemSlug = getProductSlug(item);
                const itemPrice = getBasePrice(item);
                return (
                  <Link
                    key={item.id || itemSlug}
                    to={`/product/${encodeURIComponent(itemSlug)}`}
                    className="pdp26-mini-card p-2.5 flex flex-col justify-between"
                  >
                    <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                      {itemImg ? (
                        <img
                          src={itemImg}
                          alt={getProductName(item)}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <ShoppingBag className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="line-clamp-2 text-xs font-bold text-slate-900 dark:text-white">
                        {getProductName(item)}
                      </p>
                      <p className="text-xs font-black text-[var(--pdp-orange)]">
                        {rupiah(itemPrice)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="pdp26-section-divider" />
        </>
      )}

      {/* 6. Specifications & Description Section (Shopee Style) */}
      <div className="pdp26-card p-4 sm:p-5 space-y-4">
        {/* Specifications Table */}
        <div className="space-y-3">
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {t("productDetail.specifications")}
          </h2>
          <div className="space-y-0 border-t border-slate-200 dark:border-white/10">
            <div className="pdp26-spec-row">
              <span className="pdp26-spec-label">{t("productDetail.category")}</span>
              <span className="pdp26-spec-value text-[var(--pdp-navy)] dark:text-sky-400">
                {categoryName}
              </span>
            </div>
            <div className="pdp26-spec-row">
              <span className="pdp26-spec-label">{t("productDetail.stock") || (isIndo ? "Stok" : "Stock")}</span>
              <span className="pdp26-spec-value">{stock !== null ? stock : "-"}</span>
            </div>
            <div className="pdp26-spec-row">
              <span className="pdp26-spec-label">{t("productDetail.shipsFrom")}</span>
              <span className="pdp26-spec-value">{storeCity}</span>
            </div>
            {product?.sku && (
              <div className="pdp26-spec-row">
                <span className="pdp26-spec-label">SKU</span>
                <span className="pdp26-spec-value">{product.sku}</span>
              </div>
            )}
            <div className="pdp26-spec-row">
              <span className="pdp26-spec-label">{t("productDetail.condition")}</span>
              <span className="pdp26-spec-value">{t("productDetail.conditionNew")}</span>
            </div>
          </div>
        </div>

        {/* Description Accordion with "Selengkapnya / Show More" */}
        <div className="space-y-2 border-t border-slate-200 pt-3 dark:border-white/10">
          <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
            {t("productDetail.description")}
          </h2>
          <div className={`pdp26-desc-box ${!isDescExpanded ? "is-collapsed" : ""}`}>
            <p className="text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-line dark:text-slate-300">
              {rawDescription ||
                (isIndo
                  ? "Layanan penyediaan produk berkualitas pilihan seller terpercaya."
                  : "High quality product provided by verified store.")}
            </p>
          </div>

          {rawDescription && rawDescription.length > 100 && (
            <button
              type="button"
              onClick={() => setIsDescExpanded((expanded) => !expanded)}
              className="pdp26-toggle-btn"
            >
              <span>{isDescExpanded ? t("productDetail.showLess") : t("productDetail.showMore")}</span>
              {isDescExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Shopee Section Divider */}
      <div className="pdp26-section-divider" />

      {/* 7. "Kamu Mungkin Juga Suka" Recommendation Grid */}
      {recommendations.length > 0 && (
        <div className="pdp26-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
              {t("productDetail.youMayAlsoLike")}
            </h2>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--pdp-navy)] dark:text-sky-400"
            >
              <span>{t("productDetail.viewMore")}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="pdp26-rec-grid">
            {recommendations.map((item) => {
              const itemImg = getProductImages(item)[0] || "";
              const itemSlug = getProductSlug(item);
              const itemPrice = getBasePrice(item);
              const itemRating = getRating(item);
              return (
                <Link
                  key={item.id || itemSlug}
                  to={`/product/${encodeURIComponent(itemSlug)}`}
                  className="pdp26-rec-card p-2 sm:p-2.5 justify-between"
                >
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {itemImg ? (
                      <img
                        src={itemImg}
                        alt={getProductName(item)}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ShoppingBag className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 space-y-1">
                    <p className="line-clamp-2 text-xs font-bold text-slate-900 dark:text-white">
                      {getProductName(item)}
                    </p>
                    <p className="text-xs sm:text-sm font-black text-[var(--pdp-orange)]">
                      {rupiah(itemPrice)}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span>{itemRating > 0 ? itemRating.toFixed(1) : "5.0"}</span>
                      </div>
                      <span className="truncate max-w-[80px]">{storeCity}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. Lightbox Modal Preview */}
      {isLightboxOpen && (
        <ProductImageLightbox
          images={images}
          activeIndex={activeImageIndex}
          onChangeIndex={setActiveImageIndex}
          onClose={() => setIsLightboxOpen(false)}
          productName={getProductName(product)}
        />
      )}

      {/* 9. Shopee Sticky Bottom Action Bar (Clean 3-CTA Layout on Mobile 375px!) */}
      <div className="pdp26-sticky-bar">
        <div className="pdp26-sticky-inner">
          {/* 1. Chat Action Button */}
          {whatsappChatHref ? (
            <a
              href={whatsappChatHref}
              target="_blank"
              rel="noreferrer"
              className="pdp26-icon-action"
              title={t("productDetail.chatSeller")}
            >
              <MessageCircle className="h-5 w-5" />
              <span>{t("productDetail.chat")}</span>
            </a>
          ) : (
            <button type="button" disabled className="pdp26-icon-action opacity-40">
              <MessageCircle className="h-5 w-5" />
              <span>{t("productDetail.chat")}</span>
            </button>
          )}

          <div className="h-7 w-[1px] bg-slate-200 dark:bg-white/10 shrink-0" />

          {/* 2. Mobile Keranjang Action Button (Cart icon with '+' inside basket) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canPurchase || isAdding}
            className="pdp26-icon-action sm:hidden text-[var(--pdp-navy)] dark:text-sky-400"
            title={t("productDetail.addToCart")}
          >
            {isAdding ? <Loader2 className="h-5 w-5 animate-spin" /> : <CartPlusIcon className="h-5 w-5" />}
            <span className="text-[10px] leading-tight font-bold mt-0.5 whitespace-nowrap">{isIndo ? "Keranjang" : "Cart"}</span>
          </button>

          {/* 3. Mobile Beli Sekarang Button (Full Flex-1 with Price) */}
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canPurchase || isAdding}
            className="pdp26-mobile-buy-btn sm:hidden"
          >
            <span className="text-[11px] font-black tracking-wide leading-tight uppercase">
              {hasVoucher
                ? t("productDetail.buyWithVoucher") || (isIndo ? "Beli Dengan Voucher" : "Buy with Voucher")
                : t("productDetail.buyNow")}
            </span>
            <span className="text-xs font-black leading-tight">
              {rupiah(priceWithVoucher)}
            </span>
          </button>

          {/* Desktop Direct CTA Buttons (Strictly isolated on sm: and above >= 640px) */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canPurchase || isAdding}
            className="hidden sm:flex pdp26-btn-add-cart"
          >
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <CartPlusIcon className="h-4 w-4" />}
            <span>{t("productDetail.addToCart")}</span>
          </button>

          <button
            type="button"
            onClick={handleBuyNow}
            disabled={!canPurchase || isAdding}
            className="hidden sm:flex pdp26-btn-buy-now"
          >
            <span>
              {hasVoucher
                ? t("productDetail.buyWithVoucher") || (isIndo ? "Beli Dengan Voucher" : "Buy with Voucher")
                : t("productDetail.buyNow")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
