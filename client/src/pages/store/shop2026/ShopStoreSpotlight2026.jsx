import { ChevronRight, Sparkles, Star, Store } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/format.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";

export default function ShopStoreSpotlight2026({ store, products = [] }) {
  const { i18n } = useTranslation();
  const isIndo = i18n.language === "id" || i18n.language === "id-ID";

  if (!store || !store.name || !products.length) return null;

  const storeHref = store.slug ? `/store/${encodeURIComponent(store.slug)}` : "#";
  const storeLogo = store.logoUrl ? resolveAssetUrl(store.logoUrl) : null;
  const previewProducts = products.slice(0, 3);

  return (
    <div className="tp-shopee-store-spotlight">
      <div className="tp-shopee-store-spotlight__header">
        <div className="tp-shopee-store-spotlight__brand">
          <div className="tp-shopee-store-spotlight__avatar">
            {storeLogo ? (
              <img src={storeLogo} alt={store.name} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-[#fe6f05]" />
            )}
          </div>
          <div className="tp-shopee-store-spotlight__info">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="tp-shopee-inline-pill tp-shopee-inline-pill--store">Star+</span>
              <h4 className="tp-shopee-store-spotlight__name">{store.name}</h4>
            </div>
            <div className="tp-shopee-store-spotlight__meta">
              <Star className="w-3 h-3 text-[#fe6f05] fill-[#fe6f05]" />
              <span>5.0</span>
              <span className="opacity-60">•</span>
              <span>{isIndo ? "Toko Terverifikasi" : "Verified Store"}</span>
            </div>
          </div>
        </div>

        <Link to={storeHref} className="tp-shopee-store-spotlight__visit-btn">
          <span>{isIndo ? "Kunjungi" : "Visit"}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Mini Product Previews */}
      <div className="tp-shopee-store-spotlight__products">
        {previewProducts.map((p, idx) => (
          <Link
            key={p.id || p.slug || idx}
            to={p.href}
            className="tp-shopee-store-spotlight__mini-card"
          >
            <div className="tp-shopee-store-spotlight__mini-img-wrap">
              <img
                src={p.image || "/demo/placeholder-product.svg"}
                alt={p.name}
                className="tp-shopee-store-spotlight__mini-img"
              />
              {p.discount > 0 && (
                <span className="tp-shopee-mini-discount">-{p.discount}%</span>
              )}
            </div>
            <span className="tp-shopee-store-spotlight__mini-price">
              {formatCurrency(p.price)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

