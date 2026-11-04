import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Info,
  LockKeyhole,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
} from "lucide-react";
import CartQuantityControl from "../../../components/store/CartQuantityControl.jsx";
import { FALLBACK_PRODUCT_IMAGE } from "./storeCart2026Adapter.js";
import "./store-cart-2026.css";

const CART_STRINGS = {
  en: {
    eyebrow: "YOUR CART",
    pageTitle: "Shopping Cart",
    pageDescription: "Review your items and proceed to secure checkout.",
    activeItems: (count) => `${count} active item${count === 1 ? "" : "s"}`,
    storeItems: (count) => `${count} item${count === 1 ? "" : "s"}`,
    colItem: "Item",
    colUnitPrice: "Unit Price",
    colQuantity: "Quantity",
    colTotal: "Total",
    perItem: "per item",
    readyToCheckout: "Ready to checkout",
    actionNeeded: "Action needed",
    orderSummary: "Order Summary",
    estimatedTotal: "Estimated Total",
    subtotal: "Subtotal",
    discount: "Discount",
    shipping: "Shipping",
    tax: "Tax",
    calculatedAtCheckout: "Calculated at checkout",
    proceedToCheckout: "Proceed to Checkout",
    fixCartIssues: "Fix Cart Issues",
    continueShopping: "Continue Shopping",
    trustBadge: "Safe & Verified Checkout",
    emptyTitle: "Your Cart is Empty",
    emptyDescription: "Discover campus innovation works and add them to your cart.",
    startShopping: "Start Shopping",
    tryAgain: "Try Again",
    loadErrorTitle: "We couldn’t load your cart",
    removeItem: "Remove item",
    chooseVariantAgain: "Choose variant again",
    needsAttention: "Needs attention",
    reviewIssues: "Review issues",
    checkingSnapshot: "Checking latest cart stock before checkout.",
    cartIssuesWarning: "Some cart lines need attention before checkout.",
  },
  id: {
    eyebrow: "KERANJANG ANDA",
    pageTitle: "Keranjang Belanja",
    pageDescription: "Tinjau produk pilihan Anda dan lanjutkan ke pembayaran.",
    activeItems: (count) => `${count} produk aktif`,
    storeItems: (count) => `${count} produk`,
    colItem: "Produk",
    colUnitPrice: "Harga Satuan",
    colQuantity: "Jumlah",
    colTotal: "Total",
    perItem: "per produk",
    readyToCheckout: "Siap diproses",
    actionNeeded: "Perlu perhatian",
    orderSummary: "Ringkasan Pesanan",
    estimatedTotal: "Estimasi Total",
    subtotal: "Subtotal",
    discount: "Diskon",
    shipping: "Ongkos Kirim",
    tax: "Pajak",
    calculatedAtCheckout: "Dihitung saat checkout",
    proceedToCheckout: "Lanjut ke Pembayaran",
    fixCartIssues: "Periksa Masalah Produk",
    continueShopping: "Lanjut Belanja",
    trustBadge: "Transaksi Aman & Terverifikasi",
    emptyTitle: "Keranjang Belanja Kosong",
    emptyDescription: "Temukan karya inovasi kampus dan tambahkan ke keranjang.",
    startShopping: "Mulai Belanja",
    tryAgain: "Coba Lagi",
    loadErrorTitle: "Gagal memuat keranjang belanja",
    removeItem: "Hapus produk",
    chooseVariantAgain: "Pilih varian ulang",
    needsAttention: "Perlu perhatian",
    reviewIssues: "Tinjau masalah",
    checkingSnapshot: "Memverifikasi ketersediaan stok keranjang...",
    cartIssuesWarning: "Beberapa produk memerlukan perhatian sebelum checkout.",
  },
};

function formatVariant(item) {
  const selectionText = (item.variantSelections || [])
    .map((selection) => `${selection.attributeName}: ${selection.value}`)
    .filter(Boolean);
  return [item.variantLabel, ...selectionText].filter(Boolean);
}

function EmptyCart({
  onContinueShopping,
  isIndo,
  customTitle,
  customDesc,
  customButton,
}) {
  const str = isIndo ? CART_STRINGS.id : CART_STRINGS.en;
  const title = customTitle || str.emptyTitle;
  const desc = customDesc || str.emptyDescription;
  const btnText = customButton || str.startShopping;

  return (
    <div className="sc26-empty">
      <div className="sc26-empty-icon">
        <ShoppingBag aria-hidden="true" />
      </div>
      <p className="sc26-eyebrow">{str.eyebrow}</p>
      <h1>{title}</h1>
      <p>{desc}</p>
      <button type="button" onClick={onContinueShopping} className="sc26-empty-btn">
        <span>{btnText}</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="sc26-skeleton">
      <i />
      <i />
      <i />
      <i />
    </div>
  );
}

function ProductRow({
  item,
  invalidItem,
  busy,
  formatMoney,
  onIncrease,
  onDecrease,
  onRemove,
  onReselect,
  isIndo,
}) {
  const str = isIndo ? CART_STRINGS.id : CART_STRINGS.en;
  const variantLines = formatVariant(item);

  return (
    <div
      className={`sc26-product${invalidItem ? " sc26-product--invalid" : ""}`}
      data-cart-page-invalid-item={invalidItem ? "true" : undefined}
    >
      <div className="sc26-product-main">
        <img
          src={item.image}
          onError={(event) => {
            event.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
          }}
          alt={item.name}
        />
        <div className="sc26-product-copy">
          <strong className="sc26-product-title">{item.name}</strong>
          {invalidItem ? (
            <span className="sc26-product-badge sc26-product-badge--alert">
              {str.needsAttention}
            </span>
          ) : item.badge ? (
            <span className="sc26-product-badge">{item.badge}</span>
          ) : null}
          {variantLines.length > 0 ? (
            <div className="sc26-product-variants">
              {variantLines.map((line) => (
                <span key={`${item.lineId}-${line}`} className="sc26-variant-tag">
                  {line}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="sc26-unit-price">
        <span className="sc26-mobile-label">{str.colUnitPrice}</span>
        <strong>{formatMoney(item.unitPrice)}</strong>
        <small>{str.perItem}</small>
      </div>

      <div className="sc26-quantity">
        <span className="sc26-mobile-label">{str.colQuantity}</span>
        <CartQuantityControl
          quantity={item.quantity}
          stock={item.stock}
          disabled={busy}
          name={item.name}
          onCommit={(quantity) => {
            if (quantity > item.quantity) onIncrease(item, quantity);
            else onDecrease(item, quantity);
          }}
        />
      </div>

      <div className="sc26-line-total">
        <span className="sc26-mobile-label">{str.colTotal}</span>
        <strong>{formatMoney(item.lineTotal)}</strong>
      </div>

      <button
        className="sc26-remove"
        type="button"
        onClick={() => onRemove(item)}
        disabled={busy}
        aria-label={`${str.removeItem}: ${item.name}`}
        title={str.removeItem}
      >
        <Trash2 />
      </button>

      {invalidItem ? (
        <div className="sc26-invalid">
          <AlertTriangle />
          <p>{invalidItem.message || str.cartIssuesWarning}</p>
          <div className="sc26-invalid-actions">
            <button type="button" onClick={() => onRemove(item)} disabled={busy}>
              {str.removeItem}
            </button>
            {onReselect ? (
              <button type="button" onClick={() => onReselect(item, invalidItem)} disabled={busy}>
                {str.chooseVariantAgain}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function StoreCart2026View({
  viewModel,
  customization,
  isIndo,
  status,
  formatMoney,
  getInvalidItem,
  canReselect,
  onIncrease,
  onDecrease,
  onRemove,
  onReselect,
  onRetry,
  onReviewIssues,
  onCheckout,
  onContinueShopping,
}) {
  const str = isIndo ? CART_STRINGS.id : CART_STRINGS.en;

  // Customization mappings with bilingual defaults
  const pageHeaderCfg = customization?.pageHeader;
  const orderSummaryCfg = customization?.orderSummary;

  const headerEnabled = pageHeaderCfg?.enabled !== false;
  const eyebrowText = pageHeaderCfg?.eyebrow || str.eyebrow;
  const pageTitleText = pageHeaderCfg?.pageTitle || str.pageTitle;
  const pageDescText = pageHeaderCfg?.description || str.pageDescription;
  const headerImageUrl = pageHeaderCfg?.headerImageDataUrl || "";

  const orderSummaryTitle = orderSummaryCfg?.orderSummaryTitle || str.orderSummary;
  const checkoutBtnText = orderSummaryCfg?.checkoutButtonText || str.proceedToCheckout;
  const continueShoppingBtnText = orderSummaryCfg?.continueShoppingText || str.continueShopping;
  const trustBadgeText = orderSummaryCfg?.trustBadgeText || str.trustBadge;

  if (status.loading) {
    return (
      <main className="sc26-page">
        <CartSkeleton />
      </main>
    );
  }

  if (status.fatalError) {
    return (
      <main className="sc26-page">
        <div className="sc26-empty sc26-empty--error">
          <AlertTriangle />
          <h1>{str.loadErrorTitle}</h1>
          <p>{status.errorMessage}</p>
          <button type="button" onClick={onRetry} className="sc26-empty-btn">
            {str.tryAgain}
          </button>
        </div>
      </main>
    );
  }

  if (viewModel.isEmpty) {
    return (
      <main className="sc26-page">
        <EmptyCart
          onContinueShopping={onContinueShopping}
          isIndo={isIndo}
          customTitle={orderSummaryCfg?.emptyCartTitle}
          customDesc={orderSummaryCfg?.emptyCartDescription}
          customButton={orderSummaryCfg?.emptyCartButtonText}
        />
      </main>
    );
  }

  return (
    <main className="sc26-page">
      <div className="sc26-shell">
        {headerEnabled ? (
          <header className={`sc26-hero${headerImageUrl ? " sc26-hero--banner" : ""}`}>
            {headerImageUrl ? (
              <div className="sc26-hero-banner">
                <img src={headerImageUrl} alt="" />
                <div className="sc26-hero-banner-overlay" />
              </div>
            ) : null}
            <div className="sc26-hero-content">
              <p className="sc26-eyebrow">{eyebrowText}</p>
              <h1>{pageTitleText}</h1>
              {pageDescText ? <p className="sc26-hero-desc">{pageDescText}</p> : null}
            </div>
            <span className="sc26-hero-count">
              <ShoppingBag aria-hidden="true" />
              <span>{str.activeItems(viewModel.itemCount)}</span>
            </span>
          </header>
        ) : null}

        {status.inlineError ? (
          <div className="sc26-alert sc26-alert--error">
            <AlertTriangle />
            <p>{status.errorMessage}</p>
            <button type="button" onClick={onRetry}>
              {str.tryAgain}
            </button>
          </div>
        ) : null}

        {status.hasInvalidItems ? (
          <div className="sc26-alert">
            <AlertTriangle />
            <p>{str.cartIssuesWarning}</p>
            <button type="button" onClick={onReviewIssues}>
              {str.reviewIssues}
            </button>
          </div>
        ) : status.preflightLoading ? (
          <div className="sc26-alert sc26-alert--info">
            <Info />
            <p>{str.checkingSnapshot}</p>
          </div>
        ) : null}

        <div className="sc26-grid">
          {/* Main items section */}
          <div className="sc26-groups">
            {viewModel.groups.map((group) => (
              <section className="sc26-store-card" key={group.key}>
                <header className="sc26-store-head">
                  <span className="sc26-store-logo">
                    <Store aria-hidden="true" />
                  </span>
                  <div className="sc26-store-info">
                    <h2>
                      {group.storeName}
                      {group.verified ? (
                        <BadgeCheck className="sc26-verified-icon" aria-label="Verified" />
                      ) : null}
                    </h2>
                    <p>
                      {group.category ? <span>{group.category} · </span> : null}
                      <span>{str.storeItems(group.items.length)}</span>
                    </p>
                  </div>
                </header>

                <div className="sc26-column-head">
                  <span>{str.colItem}</span>
                  <span>{str.colUnitPrice}</span>
                  <span>{str.colQuantity}</span>
                  <span>{str.colTotal}</span>
                  <span />
                </div>

                <div className="sc26-products">
                  {group.items.map((item) => {
                    const invalidItem = getInvalidItem(item);
                    return (
                      <ProductRow
                        key={item.lineId}
                        item={item}
                        invalidItem={invalidItem}
                        busy={status.busy}
                        formatMoney={formatMoney}
                        onIncrease={onIncrease}
                        onDecrease={onDecrease}
                        onRemove={onRemove}
                        onReselect={
                          invalidItem && canReselect(item, invalidItem) ? onReselect : null
                        }
                        isIndo={isIndo}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          {/* Sticky summary card */}
          <aside className="sc26-summary">
            <div className="sc26-summary-card">
              <div className="sc26-summary-header">
                <span className={`sc26-ready${status.hasInvalidItems ? " is-blocked" : ""}`}>
                  {status.hasInvalidItems ? <AlertTriangle /> : <CheckCircle2 />}
                  <span>{status.hasInvalidItems ? str.actionNeeded : str.readyToCheckout}</span>
                </span>
                <span className="sc26-summary-count">{str.storeItems(viewModel.itemCount)}</span>
              </div>

              <div className="sc26-summary-title">
                <h2>{orderSummaryTitle}</h2>
              </div>

              {/* High visibility Estimated Total block */}
              <div className="sc26-estimate">
                <p className="sc26-estimate-label">{str.estimatedTotal}</p>
                <strong className="sc26-estimate-amount">
                  {formatMoney(viewModel.estimatedTotal)}
                </strong>
                <ShoppingBag className="sc26-estimate-bg-icon" aria-hidden="true" />
              </div>

              {/* Order breakdown table */}
              <dl className="sc26-breakdown">
                <div>
                  <dt>{str.subtotal}</dt>
                  <dd>{formatMoney(viewModel.subtotal)}</dd>
                </div>
                <div>
                  <dt>{str.discount}</dt>
                  <dd className={viewModel.discount > 0 ? "sc26-discount-val" : ""}>
                    {viewModel.discount > 0
                      ? `− ${formatMoney(viewModel.discount)}`
                      : `− ${formatMoney(0)}`}
                  </dd>
                </div>
                <div>
                  <dt>{str.shipping}</dt>
                  <dd className="sc26-muted-note">{str.calculatedAtCheckout}</dd>
                </div>
                <div>
                  <dt>{str.tax}</dt>
                  <dd className="sc26-muted-note">{str.calculatedAtCheckout}</dd>
                </div>
              </dl>

              {/* Primary action buttons */}
              <button
                className="sc26-checkout"
                type="button"
                onClick={onCheckout}
                disabled={!status.canCheckout}
              >
                <LockKeyhole aria-hidden="true" />
                <span>{status.hasInvalidItems ? str.fixCartIssues : checkoutBtnText}</span>
              </button>

              <button
                className="sc26-continue"
                type="button"
                onClick={onContinueShopping}
              >
                <span>{continueShoppingBtnText}</span>
              </button>

              {/* Sleek trust badge */}
              <div className="sc26-trust-badge">
                <ShieldCheck aria-hidden="true" />
                <span>{trustBadgeText}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
