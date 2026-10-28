import { Eye, Heart, Image, Loader2, ShoppingCart, Star, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/format.js";

import { resolveAssetUrl } from "../../../lib/assetUrl.js";

function Rating({ card }) {
  return (
    <div className="tp-product-card__rating" aria-label={`${card.rating.toFixed(1)} out of 5 stars`}>
      <span className="tp-shop-stars" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className={index < Math.round(card.rating) ? "is-filled" : ""} />
        ))}
      </span>
      <strong>{card.rating.toFixed(1)}</strong>
      <span>({card.reviewCount})</span>
    </div>
  );
}

export default function ShopProductCard2026({
  card,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onAdd,
  onBuyNow,
}) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';
  const [imageIndex, setImageIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [pending, setPending] = useState("");

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

  const run = async (action, callback) => {
    if (!card.id || !card.isPurchasable || pending) return;
    setPending(action);
    try {
      await callback(card);
    } finally {
      setPending("");
    }
  };

  return (
    <article className="tp-product-card">
      <div className="tp-product-card__media">
        <Link to={card.href} aria-label={`View ${card.name}`}>
          {activeImage && !imageFailed ? (
            <img src={activeImage} alt={card.name} onError={handleImageError} loading="lazy" />
          ) : (
            <span className="tp-product-card__fallback">
              <img
                src="/demo/placeholder-product.svg"
                alt={card.name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            </span>
          )}
        </Link>
        {card.discount > 0 ? <span className="tp-product-card__discount">-{card.discount}%</span> : null}
        <button
          type="button"
          className={`tp-product-card__wishlist ${isWishlisted ? "is-active" : ""}`}
          onClick={() => onToggleWishlist(card)}
          aria-label={`${isWishlisted ? "Remove" : "Add"} ${card.name} ${isWishlisted ? "from" : "to"} wishlist`}
        >
          <Heart className={isWishlisted ? "is-filled" : ""} />
        </button>
        <button
          type="button"
          className="tp-product-card__quick"
          onClick={() => onQuickView(card)}
          aria-label={`Quick view ${card.name}`}
        >
          <Eye />
        </button>
      </div>

      <div className="tp-product-card__body">
        <p className="tp-product-card__category">{card.category}</p>
        <Link to={card.href} className="tp-product-card__name">{card.name}</Link>
        <Rating card={card} />
        <div className="tp-product-card__price">
          <strong>{formatCurrency(card.price)}</strong>
          {card.originalPrice > card.price && card.price > 0 ? (
            <del>{formatCurrency(card.originalPrice)}</del>
          ) : null}
        </div>
        <div className="tp-product-card__actions">
          <button
            type="button"
            className="tp-shop-btn tp-shop-btn--outline"
            disabled={!card.id || !card.isPurchasable || Boolean(pending)}
            onClick={() => run("add", onAdd)}
          >
            {pending === "add" ? <Loader2 className="is-spinning" /> : <ShoppingCart />}
            <span>{card.isPurchasable ? (isIndo ? "Tambah ke Keranjang" : "Add to Cart") : card.purchaseLabel}</span>
          </button>
          <button
            type="button"
            className="tp-shop-btn tp-shop-btn--primary"
            disabled={!card.id || !card.isPurchasable || Boolean(pending)}
            onClick={() => run("buy", onBuyNow)}
          >
            {pending === "buy" ? <Loader2 className="is-spinning" /> : <Zap />}
            <span>{isIndo ? "Beli Sekarang" : "Buy Now"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
