import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Heart, ImageIcon, Loader2, Minus, Plus, ShoppingCart, Star } from "lucide-react";
import { fetchStoreProductById } from "../../api/public/storeProducts.ts";
import { getStorePublicIdentityBySlug } from "../../api/public/storePublicIdentity.ts";
import { formatCurrency } from "../../utils/format.js";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import {
  getPublicStoreOperationalReadiness,
  normalizePublicStoreIdentity,
} from "../../utils/storePublicIdentity.ts";
import { UiEmptyState, UiErrorState } from "../../components/primitives/state/index.js";
import StoreMicrositeShell from "../../components/store/StoreMicrositeShell.jsx";
import { useCart } from "../../hooks/useCart.ts";
import { useStorefrontWishlist } from "../../utils/storefrontWishlist.js";
import {
  getSelectedOriginalPrice,
  getSelectedPrice,
  isPurchasable,
  normalizeVariationGroups,
  resolveSelectedVariant,
} from "./StoreProductDetailPage2026.jsx";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatStockLabel = (stock) => {
  const parsed = Number(stock);
  if (!Number.isFinite(parsed)) return "Availability confirmed on request";
  if (parsed <= 0) return "Out of stock";
  return `${parsed} item${parsed === 1 ? "" : "s"} available`;
};

function MicrositeProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="aspect-square animate-pulse rounded-[32px] bg-slate-200" />
        <div className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-12 w-3/4 animate-pulse rounded bg-slate-100" />
          <div className="h-6 w-32 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </div>
    </div>
  );
}

function DetailMetaCard({ label, value, tone = "default" }) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-1.5 text-sm font-semibold">{value}</p>
    </div>
  );
}

export default function StoreMicrositeProductDetailPage() {
  const { slug, productSlug } = useParams();
  const navigate = useNavigate();
  const cart = useCart();
  const wishlist = useStorefrontWishlist();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [isAdding, setIsAdding] = useState(false);
  const safeSlug = useMemo(() => toText(slug).toLowerCase(), [slug]);
  const safeProductSlug = useMemo(() => toText(productSlug), [productSlug]);

  const storeQuery = useQuery({
    queryKey: ["store-public-identity", "slug", safeSlug],
    queryFn: () => getStorePublicIdentityBySlug(safeSlug),
    enabled: Boolean(safeSlug),
    staleTime: 60_000,
    retry: false,
  });
  const productQuery = useQuery({
    queryKey: ["storefront", "product", "microsite", safeSlug, safeProductSlug],
    queryFn: () =>
      fetchStoreProductById(safeProductSlug, {
        storeSlug: safeSlug,
      }),
    enabled: Boolean(safeSlug && safeProductSlug),
    staleTime: 60_000,
    retry: false,
  });

  const store = useMemo(
    () => normalizePublicStoreIdentity(storeQuery.data),
    [storeQuery.data]
  );
  const publicOperationalReadiness = getPublicStoreOperationalReadiness(store);
  const isStoreOperationallyGated = Boolean(
    publicOperationalReadiness && !publicOperationalReadiness.isReady
  );
  const product = productQuery.data?.data ?? null;
  const productImageSrc = resolveAssetUrl(product?.imageUrl);
  const isStoreNotFound = storeQuery.error?.response?.status === 404;
  const isProductNotFound = productQuery.error?.response?.status === 404;
  const storeIdentityDescription = toText(
    store.description,
    "Shop public products from this store."
  );

  const variationGroups = useMemo(() => normalizeVariationGroups(product), [product]);
  const selectedVariant = useMemo(
    () => resolveSelectedVariant(product, selectedOptions),
    [product, selectedOptions]
  );

  useEffect(() => {
    const defaults = {};
    variationGroups.forEach((group) => {
      if (group?.options?.[0]) defaults[group.id] = group.options[0].selectionKey;
    });
    setSelectedOptions(defaults);
    setQuantity(1);
  }, [product?.id, product?.slug, variationGroups.length]);

  if (!safeSlug || !safeProductSlug) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <UiEmptyState
          title="Product route is incomplete."
          description="Use a valid /store/:slug/products/:productSlug route."
          actions={
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Marketplace
            </Link>
          }
        />
      </div>
    );
  }

  if (storeQuery.isLoading || productQuery.isLoading) {
    return <MicrositeProductDetailSkeleton />;
  }

  if (isStoreNotFound || isStoreOperationallyGated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <UiEmptyState
          title="Store not found."
          description={`We could not find an eligible public store for slug "${safeSlug}".`}
          actions={
            <Link
              to="/"
              className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Marketplace
            </Link>
          }
        />
      </div>
    );
  }

  if (storeQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <UiErrorState
          title="Failed to load store context."
          message={
            storeQuery.error?.response?.data?.message ||
            storeQuery.error?.message ||
            "Store context is temporarily unavailable."
          }
          onRetry={() => storeQuery.refetch()}
        />
      </div>
    );
  }

  if (isProductNotFound) {
    return (
      <StoreMicrositeShell
        identity={store}
        safeSlug={safeSlug}
        currentLabel={safeProductSlug}
        compact
        description={storeIdentityDescription}
      >
        <div className="mx-auto max-w-4xl">
          <UiEmptyState
            title="Product not found in this store."
            description={`We could not find a public product "${safeProductSlug}" inside ${store.name || "this store"}.`}
            actions={
              <Link
                to={`/store/${encodeURIComponent(store.slug || safeSlug)}`}
                className="inline-flex h-11 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Store Microsite
              </Link>
            }
          />
        </div>
      </StoreMicrositeShell>
    );
  }

  if (productQuery.isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <UiErrorState
          title="Failed to load store product."
          message={
            productQuery.error?.response?.data?.message ||
            productQuery.error?.message ||
            "Store product detail is temporarily unavailable."
          }
          onRetry={() => productQuery.refetch()}
        />
      </div>
    );
  }

  const currentPrice = getSelectedPrice(product, selectedVariant) || toSafeNumber(product?.price, 0);
  const originalPrice = getSelectedOriginalPrice(product, selectedVariant) || toSafeNumber(product?.originalPrice, 0);
  const hasDiscount = originalPrice > currentPrice && currentPrice > 0;
  const ratingAvg = toSafeNumber(product?.ratingAvg, 0);
  const reviewCount = Math.max(0, Math.round(toSafeNumber(product?.reviewCount, 0)));
  const unit = toText(product?.unit, "Unit not specified");
  const categoryName = toText(product?.category?.name, "Uncategorized");
  const stock = selectedVariant?.stock !== undefined && selectedVariant?.stock !== null
    ? Number(selectedVariant.stock)
    : (product?.stock !== undefined && product?.stock !== null ? Number(product.stock) : null);
  const stockLabel = formatStockLabel(stock);
  const canPurchase = isPurchasable(product, selectedVariant, quantity);

  const buildSnapshot = () => {
    const variantSelections = Array.isArray(selectedVariant?.selections)
      ? selectedVariant.selections.map((s) => ({
          attributeId: s.attributeId,
          attributeName: s.attributeName,
          valueId: s.valueId,
          value: s.value,
        }))
      : [];
    return {
      name: product?.name || "Product",
      price: currentPrice,
      imageUrl: resolveAssetUrl(selectedVariant?.image || product?.imageUrl) || "",
      stock: stock,
      slug: product?.routeSlug || product?.slug || safeProductSlug,
      storeId: product?.storeId ?? store?.id ?? null,
      storeSlug: store?.slug || safeSlug,
      category: categoryName,
      variantKey: selectedVariant?.variantKey ?? selectedVariant?.combinationKey ?? null,
      variantLabel: selectedVariant?.variantLabel ?? null,
      variantSelections,
      variantSku: selectedVariant?.sku ?? null,
      variantBarcode: selectedVariant?.barcode ?? null,
      variantPrice: selectedVariant?.price ?? null,
      variantSalePrice: selectedVariant?.salePrice ?? null,
      variantImage: selectedVariant?.image ?? null,
    };
  };

  const handleAddToCart = async () => {
    if (!canPurchase || isAdding) return;
    setIsAdding(true);
    try {
      const productId = Number(product?.id ?? product?.productId);
      if (Number.isFinite(productId) && productId > 0) {
        await cart.add(productId, quantity, buildSnapshot());
        window.dispatchEvent(new Event("cart-drawer:open"));
      }
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };

  const handleBuyNow = async () => {
    if (!canPurchase || isAdding) return;
    setIsAdding(true);
    try {
      const productId = Number(product?.id ?? product?.productId);
      if (Number.isFinite(productId) && productId > 0) {
        const added = await cart.add(productId, quantity, buildSnapshot());
        if (added !== false) {
          navigate("/cart");
        }
      }
    } finally {
      setTimeout(() => setIsAdding(false), 500);
    }
  };
  return (
    <StoreMicrositeShell
      identity={store}
      safeSlug={safeSlug}
      currentLabel={product?.name || safeProductSlug}
      compact
      description={storeIdentityDescription}
    >
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.08)]">
            <div className="aspect-square bg-slate-100">
              {productImageSrc ? (
                <img
                  src={productImageSrc}
                  alt={product?.name || "Product"}
                  className="h-full w-full object-contain p-8"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-400">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
            </div>
            {product && (
              <button
                type="button"
                onClick={() => {
                  const variantSelections = Array.isArray(selectedVariant?.selections)
                    ? selectedVariant.selections.map((s) => ({
                        attributeId: s.attributeId,
                        attributeName: s.attributeName,
                        valueId: s.valueId,
                        value: s.value,
                      }))
                    : [];
                  wishlist.toggle({
                    id: product?.id ?? product?.productId,
                    productId: product?.productId ?? product?.id,
                    slug: product?.routeSlug || product?.slug || safeProductSlug,
                    name: product?.name || "Product",
                    category: categoryName,
                    price: currentPrice,
                    originalPrice: originalPrice,
                    imageUrl: productImageSrc || "",
                    rating: ratingAvg,
                    reviewCount: reviewCount,
                    stock: stock,
                    storeId: product?.storeId ?? store?.id ?? null,
                    storeSlug: store?.slug || safeSlug,
                    variantKey: selectedVariant?.variantKey ?? selectedVariant?.combinationKey ?? null,
                    variantLabel: selectedVariant?.variantLabel ?? null,
                    variantSelections,
                    variantSku: selectedVariant?.sku ?? null,
                    variantBarcode: selectedVariant?.barcode ?? null,
                  });
                }}
                aria-label="Toggle wishlist"
                className={`absolute right-5 top-5 inline-flex h-12 w-12 items-center justify-center rounded-full border shadow-sm transition ${
                  wishlist.isWishlisted(product?.id ?? product?.productId ?? safeProductSlug)
                    ? "border-rose-500 bg-rose-500 text-white hover:bg-rose-600"
                    : "border-slate-200 bg-white text-slate-700 hover:border-rose-500/40 hover:text-rose-500"
                }`}
              >
                <Heart className={`h-5 w-5 ${wishlist.isWishlisted(product?.id ?? product?.productId ?? safeProductSlug) ? "fill-current" : ""}`} />
              </button>
            )}
          </section>

          <section className="space-y-5 rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_20px_45px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                Store Product
              </p>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {product?.name || "Product"}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
                  {categoryName}
                </span>
                {ratingAvg > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                    <Star className="h-4 w-4 fill-current" />
                    {ratingAvg.toFixed(1)} • {reviewCount} review{reviewCount === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                Price
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <span className="text-3xl font-bold leading-none text-slate-900 sm:text-[38px]">
                  {formatCurrency(currentPrice)}
                </span>
                {hasDiscount ? (
                  <span className="text-sm text-slate-400 line-through">
                    {formatCurrency(originalPrice)}
                  </span>
                ) : null}
              </div>
            </div>

            {variationGroups.length > 0 ? (
              <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-5">
                {variationGroups.map((group) => (
                  <div key={group.id} className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                      <span>{group.label}</span>
                      {selectedOptions[group.id] ? (
                        <span className="text-emerald-600">
                          {group.options.find((item) => item.selectionKey === selectedOptions[group.id])?.value}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => {
                        const active = selectedOptions[group.id] === option.selectionKey;
                        return (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => setSelectedOptions((current) => ({ ...current, [group.id]: option.selectionKey }))}
                            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                              active
                                ? "border-emerald-600 bg-emerald-600 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-emerald-600/30 hover:bg-slate-50"
                            }`}
                          >
                            {option.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="space-y-3 rounded-[28px] border border-slate-200 bg-slate-50/50 p-5">
              <div className="grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
                <div className="grid h-12 grid-cols-3 overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                    disabled={!canPurchase || isAdding || quantity <= 1}
                    className="inline-flex items-center justify-center border-r border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="inline-flex items-center justify-center text-base font-bold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((value) => (stock === null ? value + 1 : Math.min(stock, value + 1)))}
                    disabled={!canPurchase || isAdding || (stock !== null && quantity >= stock)}
                    className="inline-flex items-center justify-center border-l border-slate-200 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!canPurchase || isAdding}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[1rem] bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingCart className="h-4 w-4" />}
                  Add to Cart
                </button>
              </div>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canPurchase || isAdding}
                className="inline-flex h-12 w-full items-center justify-center rounded-[1rem] border border-slate-300 bg-white px-6 text-sm font-bold text-slate-900 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
              >
                Buy Now
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailMetaCard label="Unit" value={unit} />
              <DetailMetaCard
                label="Availability"
                value={stockLabel}
                tone={toSafeNumber(product?.stock, -1) === 0 ? "default" : "positive"}
              />
            </div>

            {product?.description ? (
              <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Description
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
                  {product.description}
                </p>
              </div>
            ) : null}
          </section>
      </div>
    </StoreMicrositeShell>
  );
}
