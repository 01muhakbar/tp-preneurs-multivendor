import { Image, Loader2, ShoppingCart, Star, X, Zap } from "lucide-react";
import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useProduct } from "../../../storefront.jsx";
import { formatCurrency } from "../../../utils/format.js";
import { mapProductToShopCard } from "./shopProductAdapter.js";

export default function ShopQuickViewModal2026({ card, onClose, onAdd, onBuyNow }) {
  const { data, isLoading, isError } = useProduct(card?.slug || "");
  const detail = useMemo(() => {
    const source = data?.data ?? data?.product ?? data;
    return source ? mapProductToShopCard(source) : card;
  }, [card, data]);

  useEffect(() => {
    if (!card) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKey = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [card, onClose]);

  if (!card || !detail) return null;

  return createPortal(
    <div className="tp-shop-modal" role="dialog" aria-modal="true" aria-labelledby="tp-quick-view-title">
      <button type="button" className="tp-shop-modal__backdrop" onClick={onClose} aria-label="Close quick view" />
      <div className="tp-shop-modal__panel">
        <button type="button" className="tp-shop-modal__close" onClick={onClose} aria-label="Close quick view">
          <X />
        </button>
        {isLoading ? (
          <div className="tp-shop-modal__loading"><Loader2 className="is-spinning" /> Loading product details...</div>
        ) : (
          <>
            <div className="tp-shop-modal__media">
              {detail.image ? <img src={detail.image} alt={detail.name} /> : <Image />}
              {detail.discount > 0 ? <span className="tp-product-card__discount">-{detail.discount}%</span> : null}
            </div>
            <div className="tp-shop-modal__content">
              <p>{detail.category}</p>
              <h2 id="tp-quick-view-title">{detail.name}</h2>
              <div className="tp-product-card__rating">
                <span className="tp-shop-stars">
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} className={index < Math.round(detail.rating) ? "is-filled" : ""} />)}
                </span>
                <strong>{detail.rating.toFixed(1)}</strong>
                <span>({detail.reviewCount} reviews)</span>
              </div>
              <div className="tp-product-card__price">
                <strong>{formatCurrency(detail.price)}</strong>
                {detail.originalPrice > detail.price ? <del>{formatCurrency(detail.originalPrice)}</del> : null}
              </div>
              <p className="tp-shop-modal__description">
                {detail.description || "A quality everyday essential selected from a trusted local seller."}
              </p>
              {isError ? <small>Some extended product details are currently unavailable.</small> : null}
              <div className="tp-shop-modal__actions">
                <button type="button" className="tp-shop-btn tp-shop-btn--outline" disabled={!detail.isPurchasable} onClick={() => onAdd(detail)}>
                  <ShoppingCart /> Add to Cart
                </button>
                <button type="button" className="tp-shop-btn tp-shop-btn--primary" disabled={!detail.isPurchasable} onClick={() => onBuyNow(detail)}>
                  <Zap /> Buy Now
                </button>
              </div>
              <Link to={detail.href} className="tp-shop-modal__detail-link">View full product details</Link>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
