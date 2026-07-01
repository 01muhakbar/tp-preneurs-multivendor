import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronUp,
  CircleHelp,
  Info,
  Leaf,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Store,
  Trash2,
  Truck,
} from "lucide-react";
import CartQuantityControl from "../../../components/store/CartQuantityControl.jsx";
import { FALLBACK_PRODUCT_IMAGE } from "./storeCart2026Adapter.js";
import { useTranslation } from "react-i18next";
import "./store-cart-2026.css";

function formatVariant(item) {
  const selectionText = item.variantSelections
    .map((selection) => `${selection.attributeName}: ${selection.value}`)
    .filter(Boolean);
  return [item.variantLabel, ...selectionText].filter(Boolean);
}

function EmptyCart({ onContinueShopping }) {
  const { t } = useTranslation();
  return (
    <div className="sc26-empty">
      <span><ShoppingBag aria-hidden="true" /></span>
      <p className="sc26-eyebrow">{t("cart.title")}</p>
      <h1>{t("cart.empty")}</h1>
      <p>Discover something useful and add it to your cart.</p>
      <button type="button" onClick={onContinueShopping}>Continue Shopping</button>
    </div>
  );
}

function CartSkeleton() {
  return <div className="sc26-skeleton"><i /><i /><i /><i /></div>;
}

function ProductRow({ item, invalidItem, busy, formatMoney, onIncrease, onDecrease, onRemove, onReselect }) {
  return (
    <div className={`sc26-product${invalidItem ? " sc26-product--invalid" : ""}`} data-cart-page-invalid-item={invalidItem ? "true" : undefined}>
      <div className="sc26-product-main">
        <img src={item.image} onError={(event) => { event.currentTarget.src = FALLBACK_PRODUCT_IMAGE; }} alt="" />
        <div className="sc26-product-copy">
          <strong>{item.name}</strong>
          <span className="sc26-product-badge">{invalidItem ? "Needs attention" : item.badge}</span>
          {formatVariant(item).map((line) => <small key={`${item.lineId}-${line}`}>{line}</small>)}
          <p>Premium quality · Carefully packed</p>
          <em><Truck aria-hidden="true" /> Ships based on store availability</em>
        </div>
      </div>
      <div className="sc26-unit-price"><span>Unit Price</span><strong>{formatMoney(item.unitPrice)}</strong><small>per item</small></div>
      <div className="sc26-quantity">
        <span>Quantity</span>
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
      <div className="sc26-line-total"><span>Total</span><strong>{formatMoney(item.lineTotal)}</strong></div>
      <button className="sc26-remove" type="button" onClick={() => onRemove(item)} disabled={busy} aria-label={`Remove ${item.name}`}><Trash2 /></button>
      {invalidItem ? <div className="sc26-invalid"><AlertTriangle /><p>{invalidItem.message || "This cart line needs attention before checkout."}</p><button type="button" onClick={() => onRemove(item)} disabled={busy}>Remove item</button>{onReselect ? <button type="button" onClick={() => onReselect(item, invalidItem)} disabled={busy}>Choose variant again</button> : null}</div> : null}
    </div>
  );
}

export default function StoreCart2026View({
  viewModel,
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
  const { t } = useTranslation();
  if (status.loading) return <main className="sc26-page"><CartSkeleton /></main>;
  if (status.fatalError) {
    return <main className="sc26-page"><div className="sc26-empty sc26-empty--error"><AlertTriangle /><h1>We couldn’t load your cart</h1><p>{status.errorMessage}</p><button type="button" onClick={onRetry}>Try Again</button></div></main>;
  }
  if (viewModel.isEmpty) return <main className="sc26-page"><EmptyCart onContinueShopping={onContinueShopping} /></main>;

  return (
    <main className="sc26-page">
      <div className="sc26-shell">
        <header className="sc26-hero">
          <div><p className="sc26-eyebrow">{t("cart.title")}</p><h1>Shopping Cart</h1><p>Review your items and proceed to secure checkout.</p></div>
          <span><ShoppingBag /> {viewModel.itemCount} active item{viewModel.itemCount === 1 ? "" : "s"}</span>
        </header>

        {status.inlineError ? <div className="sc26-alert sc26-alert--error"><AlertTriangle /><p>{status.errorMessage}</p><button type="button" onClick={onRetry}>Try again</button></div> : null}
        {status.hasInvalidItems ? <div className="sc26-alert"><AlertTriangle /><p>Some cart lines need attention before checkout.</p><button type="button" onClick={onReviewIssues}>Review issues</button></div> : status.preflightLoading ? <div className="sc26-alert sc26-alert--info"><Info /><p>Checking the latest cart snapshot before checkout.</p></div> : null}

        <div className="sc26-grid">
          <div className="sc26-groups">
            {viewModel.groups.map((group) => (
              <section className="sc26-store-card" key={group.key}>
                <header className="sc26-store-head">
                  <span className="sc26-store-logo"><Store /></span>
                  <div><h2>{group.storeName} {group.verified ? <BadgeCheck aria-label="Verified store" /> : null}</h2><p>{group.category} <i>·</i> {group.items.length} item{group.items.length === 1 ? "" : "s"}</p></div>
                  <span className="sc26-delivery"><Leaf /><b>Delivered fresh</b><small>Quality products, fast delivery.</small></span>
                  <ChevronUp className="sc26-collapse" aria-hidden="true" />
                </header>
                <div className="sc26-column-head"><span>Item</span><span>Unit Price</span><span>Quantity</span><span>Total</span><span /></div>
                <div className="sc26-products">
                  {group.items.map((item) => {
                    const invalidItem = getInvalidItem(item);
                    return <ProductRow key={item.lineId} item={item} invalidItem={invalidItem} busy={status.busy} formatMoney={formatMoney} onIncrease={onIncrease} onDecrease={onDecrease} onRemove={onRemove} onReselect={invalidItem && canReselect(item, invalidItem) ? onReselect : null} />;
                  })}
                </div>
                <footer><ShieldCheck /> Shop with confidence. Store items and checkout details are protected.</footer>
              </section>
            ))}
          </div>

          <aside className="sc26-summary">
            <div className="sc26-summary-card">
              <span className={`sc26-ready${status.hasInvalidItems ? " is-blocked" : ""}`}>{status.hasInvalidItems ? <AlertTriangle /> : <CheckCircle2 />} {status.hasInvalidItems ? "Action needed" : "Ready to checkout"}</span>
              <div className="sc26-summary-title"><h2>Order Summary</h2><span>{viewModel.itemCount} item{viewModel.itemCount === 1 ? "" : "s"}</span></div>
              <div className="sc26-estimate"><p>Estimated Total</p><strong>{formatMoney(viewModel.estimatedTotal)}</strong><small>Final shipping and tax are shown on the next step.</small><ShoppingBag /></div>
              <dl><div><dt>{t("cart.subtotal")}</dt><dd>{formatMoney(viewModel.subtotal)}</dd></div><div><dt>Discount</dt><dd>{viewModel.discount > 0 ? `− ${formatMoney(viewModel.discount)}` : `− ${formatMoney(0)}`}</dd></div><div><dt>Shipping</dt><dd>Calculated at checkout</dd></div><div><dt>Tax</dt><dd>Calculated at checkout</dd></div></dl>
              <p className="sc26-note"><CircleHelp /> Shipping fees and taxes are calculated from your delivery address.</p>
              <button className="sc26-checkout" type="button" onClick={onCheckout} disabled={!status.canCheckout}><LockKeyhole /> {status.hasInvalidItems ? "Fix Cart Issues" : t("cart.checkout")}</button>
              <button className="sc26-continue" type="button" onClick={onContinueShopping}>Continue Shopping</button>
              <p className="sc26-security"><PackageCheck /> Variant and stock details are revalidated at checkout.</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
