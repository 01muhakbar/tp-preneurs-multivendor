import {
  Heart,
  MapPin,
  Plus,
  ShoppingCart,
  Star,
  Truck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/format.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

export default function ShopProductCard2026({
  card,
  isWishlisted,
  onToggleWishlist,
  onAdd,
}) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID";
  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const imageCandidates = useMemo(() => {
    const list = [
      ...(Array.isArray(card.images) ? card.images : []),
      card.image,
      card.raw?.imageUrl,
      card.raw?.promoImagePath,
      card.raw?.image,
    ]
      .filter(Boolean)
      .map((src) => resolveAssetUrl(src));
    const unique = Array.from(new Set(list));
    if (unique.length > 0) {
      return [...unique, "/demo/placeholder-product.svg"];
    }
    return ["/demo/placeholder-product.svg"];
  }, [card.images, card.image, card.raw]);

  const activeImage = imageCandidates[imageIndex] || "/demo/placeholder-product.svg";

  const handleImageError = () => {
    if (imageIndex + 1 < imageCandidates.length) {
      setImageIndex((prev) => prev + 1);
    } else {
      setImageFailed(true);
    }
  };

  const handleQuickAdd = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!card.id || !card.isPurchasable || isAdding) return;
    setIsAdding(true);
    try {
      await onAdd(card);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onToggleWishlist(card);
  };

  // Format sold count nicely
  const soldText = useMemo(() => {
    const count = Number(card.soldCount || 0);
    if (count >= 1000) {
      const formatted = (count / 1000).toFixed(1).replace(/\.0$/, "");
      return isIndo ? `${formatted}RB+ terjual` : `${formatted}k+ sold`;
    }
    if (count > 0) {
      return isIndo ? `${count} terjual` : `${count} sold`;
    }
    if (card.reviewCount > 0) {
      return isIndo ? `${card.reviewCount} ulasan` : `${card.reviewCount} reviews`;
    }
    return isIndo ? "Baru" : "New";
  }, [card.soldCount, card.reviewCount, isIndo]);

  const ratingValue = Number(card.rating || 0).toFixed(1);
  const storeBadge = card.storeName && card.storeName !== "Local store" ? "Star" : "TP";

  return (
    <article className="tp-shopee-card">
      <Link to={card.href} className="tp-shopee-card__link" aria-label={`Detail ${card.name}`}>
        {/* Media Frame (1:1 aspect ratio) */}
        <div className="tp-shopee-card__media">
          {activeImage && !imageFailed ? (
            <img
              src={activeImage}
              alt={card.name}
              onError={handleImageError}
              loading="lazy"
              className="tp-shopee-card__img"
            />
          ) : (
            <div className="tp-shopee-card__fallback">
              <img
                src="/demo/placeholder-product.svg"
                alt={card.name}
                className="w-12 h-12 opacity-40"
              />
            </div>
          )}

          {/* Top-left Badges */}
          <div className="tp-shopee-card__badges-corner">
            <span className="tp-shopee-badge-star">
              <Star className="w-2.5 h-2.5 fill-current" />
              <span>{storeBadge}</span>
            </span>
          </div>

          {/* Discount Tag */}
          {card.discount > 0 && (
            <span className="tp-shopee-badge-discount">
              -{card.discount}%
            </span>
          )}

          {/* Wishlist Floating Button */}
          <button
            type="button"
            className={`tp-shopee-card__wishlist ${isWishlisted ? "is-active" : ""}`}
            onClick={handleWishlistClick}
            aria-label={`${isWishlisted ? "Remove" : "Add"} wishlist`}
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : "text-white"}`} />
          </button>
        </div>

        {/* Content Body */}
        <div className="tp-shopee-card__body">
          {/* Title with inline store pill */}
          <h3 className="tp-shopee-card__title">
            <span className="tp-shopee-inline-pill">{storeBadge}</span>
            {card.name}
          </h3>

          {/* Price row */}
          <div className="tp-shopee-card__price-row">
            <span className="tp-shopee-card__price">
              {formatCurrency(card.price)}
            </span>
            {card.originalPrice > card.price && card.price > 0 && (
              <del className="tp-shopee-card__original-price">
                {formatCurrency(card.originalPrice)}
              </del>
            )}
          </div>

          {/* Promo Tag */}
          <div className="tp-shopee-card__promo-row">
            <span className="tp-shopee-promo-pill">
              {isIndo ? "Gratis Ongkir" : "Free Shipping"}
            </span>
          </div>

          {/* Social Proof (Rating & Sold) */}
          <div className="tp-shopee-card__social-row">
            <div className="tp-shopee-card__rating">
              <Star className="w-3 h-3 text-[#fe6f05] fill-[#fe6f05]" />
              <span>{ratingValue}</span>
            </div>
            <span className="tp-shopee-card__dot">•</span>
            <span className="tp-shopee-card__sold">{soldText}</span>
          </div>

          {/* Location & Quick Cart Action */}
          <div className="tp-shopee-card__footer">
            <div className="tp-shopee-card__meta">
              <span className="tp-shopee-card__delivery">
                <Truck className="w-3 h-3 text-[#034c85]" />
                <small>{isIndo ? "< 2 Hari" : "< 2 Days"}</small>
              </span>
              <span className="tp-shopee-card__city">
                <MapPin className="w-2.5 h-2.5 opacity-60" />
                <small>{card.storeCity || "Makassar"}</small>
              </span>
            </div>

            {/* Quick Add to Cart Button */}
            {card.isPurchasable && (
              <button
                type="button"
                className="tp-shopee-card__quick-cart"
                onClick={handleQuickAdd}
                title={isIndo ? "Tambah ke Keranjang" : "Add to Cart"}
                aria-label={isIndo ? "Tambah ke Keranjang" : "Add to Cart"}
              >
                {isAdding ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
