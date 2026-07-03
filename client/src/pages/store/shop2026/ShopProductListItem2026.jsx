import { Eye, Heart, Image, Loader2, ShoppingCart, Star, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/format.js";

export default function ShopProductListItem2026({
  card,
  isWishlisted,
  onToggleWishlist,
  onQuickView,
  onAdd,
  onBuyNow,
}) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === 'id' || i18n.language === 'id-ID';
  const [imageFailed, setImageFailed] = useState(false);
  const [pending, setPending] = useState("");
  const roundedRating = Math.round(card.rating);

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
    <article className="tp-product-list-item">
      <div className="tp-product-list-item__media">
        <Link to={card.href} aria-label={`View ${card.name}`}>
          {card.image && !imageFailed ? (
            <img src={card.image} alt={card.name} onError={() => setImageFailed(true)} />
          ) : (
            <span className="tp-product-card__fallback"><Image /></span>
          )}
        </Link>
        {card.discount > 0 ? <span className="tp-product-card__discount">-{card.discount}%</span> : null}
        <button type="button" className="tp-product-list-item__quick" onClick={() => onQuickView(card)} aria-label={`Quick view ${card.name}`}>
          <Eye />
        </button>
      </div>

      <div className="tp-product-list-item__info">
        <p>{card.category}</p>
        <Link to={card.href}>{card.name}</Link>
        <span>{card.description || (isIndo ? `Kualitas ${card.category.toLowerCase()} dari penjual lokal terpercaya.` : `Quality ${card.category.toLowerCase()} from a trusted local seller.`)}</span>
        <small>{card.storeName}</small>
      </div>

      <div className="tp-product-list-item__rating">
        <span className="tp-shop-stars">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className={index < roundedRating ? "is-filled" : ""} />
          ))}
          <strong>{card.rating.toFixed(1)}</strong>
        </span>
        <small>({card.reviewCount})</small>
        <em>{card.isPurchasable ? (isIndo ? "Tersedia" : "In Stock") : card.purchaseLabel}</em>
      </div>

      <div className="tp-product-list-item__purchase">
        <button
          type="button"
          className={`tp-product-card__wishlist ${isWishlisted ? "is-active" : ""}`}
          onClick={() => onToggleWishlist(card)}
          aria-label={`${isWishlisted ? "Remove" : "Add"} ${card.name} ${isWishlisted ? "from" : "to"} wishlist`}
        >
          <Heart className={isWishlisted ? "is-filled" : ""} />
        </button>
        <div className="tp-product-card__price">
          <strong>{formatCurrency(card.price)}</strong>
          {card.originalPrice > card.price && card.price > 0 ? <del>{formatCurrency(card.originalPrice)}</del> : null}
        </div>
        <button type="button" className="tp-shop-btn tp-shop-btn--outline" disabled={!card.isPurchasable || Boolean(pending)} onClick={() => run("add", onAdd)}>
          {pending === "add" ? <Loader2 className="is-spinning" /> : <ShoppingCart />}
          {isIndo ? "Tambah ke Keranjang" : "Add to Cart"}
        </button>
        <button type="button" className="tp-shop-btn tp-shop-btn--primary" disabled={!card.isPurchasable || Boolean(pending)} onClick={() => run("buy", onBuyNow)}>
          {pending === "buy" ? <Loader2 className="is-spinning" /> : <Zap />}
          {isIndo ? "Beli Sekarang" : "Buy Now"}
        </button>
      </div>
    </article>
  );
}
