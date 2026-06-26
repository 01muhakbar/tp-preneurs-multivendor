import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  ChevronDown,
  CircleUserRound,
  CreditCard,
  Info,
  LockKeyhole,
  Mail,
  MapPin,
  Minus,
  PackageCheck,
  Phone,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
  TicketPercent,
  Trash2,
  UserRound,
} from "lucide-react";
import "./checkout2026.css";

const dash = "—";

function money(value, formatMoney) {
  return value === null || value === undefined || !Number.isFinite(Number(value))
    ? dash
    : formatMoney(Number(value));
}

function Field({ label, error, icon: Icon, required, children }) {
  return (
    <label className={`co26-field${error ? " co26-field--error" : ""}`}>
      <span className="co26-label">
        {label}{required ? " *" : ""}
      </span>
      <span className="co26-control-wrap">
        {Icon ? <Icon aria-hidden="true" /> : null}
        {children}
      </span>
      {error ? <span className="co26-error-text">{error}</span> : null}
    </label>
  );
}

function SectionHeader({ number, title, subtitle, icon: Icon }) {
  return (
    <div className="co26-section-head">
      <span className="co26-section-number">{number}</span>
      {Icon ? <span className="co26-section-icon"><Icon aria-hidden="true" /></span> : null}
      <div>
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <ChevronDown className="co26-section-chevron" aria-hidden="true" />
    </div>
  );
}

function QuantityControl({ item, disabled, onDecrease, onIncrease }) {
  return (
    <div className="co26-qty" aria-label={`Quantity for ${item.name}`}>
      <button type="button" onClick={() => onDecrease(item)} disabled={disabled || item.quantity <= 1} aria-label={`Decrease ${item.name} quantity`}>
        <Minus aria-hidden="true" />
      </button>
      <span>{item.quantity}</span>
      <button type="button" onClick={() => onIncrease(item)} disabled={disabled} aria-label={`Increase ${item.name} quantity`}>
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}

function ProductImage({ item }) {
  return item.image ? (
    <img className="co26-product-image" src={item.image} alt="" />
  ) : (
    <span className="co26-product-image co26-product-image--empty"><ShoppingBag aria-hidden="true" /></span>
  );
}

function ProductRow({ item, compact = false, disabled, formatMoney, onDecrease, onIncrease, onRemove, onReselectVariant }) {
  return (
    <div className={`co26-product${compact ? " co26-product--compact" : ""}${item.invalidItem ? " co26-product--invalid" : ""}`} data-checkout-invalid-item={item.invalidItem ? "true" : undefined}>
      <ProductImage item={item} />
      <div className="co26-product-copy">
        <strong>{item.name}</strong>
        {item.subtitle ? <span>{item.subtitle}</span> : null}
        {item.variantSelections.map((selection, index) => (
          <span key={`${item.lineId}-option-${index}`}>{selection.name}: {selection.value}</span>
        ))}
        <small>Item Price&nbsp; {money(item.unitPrice, formatMoney)}</small>
      </div>
      {!compact ? <div className="co26-product-total">{money(item.lineTotal, formatMoney)}</div> : null}
      <QuantityControl item={item} disabled={disabled} onDecrease={onDecrease} onIncrease={onIncrease} />
      <button className="co26-remove" type="button" onClick={() => onRemove(item)} disabled={disabled} aria-label={`Remove ${item.name}`}>
        <Trash2 aria-hidden="true" />
      </button>
      {item.invalidItem ? (
        <div className="co26-invalid-detail">
          <AlertTriangle aria-hidden="true" />
          <span>{item.invalidItem.message || "This item is no longer valid for checkout."}</span>
          {onReselectVariant ? <button type="button" onClick={() => onReselectVariant(item, item.invalidItem)}>Choose variant again</button> : null}
        </div>
      ) : null}
    </div>
  );
}

function CouponControl({ value, status, message, disabled, label = "Coupon Code", onChange, onApply, onRemove }) {
  return (
    <div className="co26-coupon-block">
      <div className="co26-coupon">
        <TicketPercent aria-hidden="true" />
        <input aria-label={label} value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} placeholder={label} disabled={disabled} />
        <button type="button" onClick={onApply} disabled={disabled}>{status === "loading" ? "Applying..." : "Apply"}</button>
      </div>
      {message ? <p className={`co26-coupon-message co26-coupon-message--${status}`}>{message}</p> : null}
      {status === "applied" && onRemove ? <button className="co26-coupon-remove" type="button" onClick={onRemove} disabled={disabled}>Remove coupon</button> : null}
    </div>
  );
}

function Stepper({ activeStep }) {
  const steps = ["Contact & Shipping", "Summary by Store", "Review Order", "Payment"];
  return (
    <ol className="co26-stepper" aria-label="Checkout progress">
      {steps.map((label, index) => {
        const number = index + 1;
        return (
          <li key={label} className={number === activeStep ? "is-active" : number < activeStep ? "is-complete" : ""}>
            <span>{number}</span><small>{label}</small>
          </li>
        );
      })}
    </ol>
  );
}

function EmptyState() {
  return (
    <main className="co26-page"><div className="co26-empty">
      <span><ShoppingBag aria-hidden="true" /></span>
      <p className="co26-eyebrow">Secure Checkout</p>
      <h1>Your cart is empty</h1>
      <p>Add something you love, then come back when you are ready.</p>
      <div><Link to="/cart" className="co26-secondary-button"><ArrowLeft /> Back to Cart</Link><Link to="/search" className="co26-primary-button">Browse Products</Link></div>
    </div></main>
  );
}

export default function Checkout2026View({
  viewModel,
  form,
  options,
  refs,
  status,
  coupons,
  formatMoney,
  onFieldChange,
  onShippingChange,
  onToggleSavedAddress,
  onDecrease,
  onIncrease,
  onRemove,
  onReselectVariant,
  onSubmit,
  onBackToCart,
}) {
  if (status.loading) {
    return <main className="co26-page"><div className="co26-skeleton"><i /><i /><i /><i /></div></main>;
  }
  if (status.redirectUrl) {
    return <main className="co26-page"><div className="co26-empty"><span className="co26-spinner" /><h1>Order created</h1><p>Opening your secure payment page.</p><a className="co26-primary-button" href={status.redirectUrl}>Continue to Payment</a></div></main>;
  }
  if (!status.hasItems) return <EmptyState />;

  const previewItems = viewModel.groups.flatMap((group) => group.items);
  const summaryItems = previewItems.length ? previewItems : viewModel.cartItems;
  const activeStep = viewModel.previewReady ? 4 : 1;
  const busy = status.submitting || status.cartSyncing;

  return (
    <main className="co26-page">
      <form className="co26-shell" onSubmit={onSubmit} noValidate>
        <header className="co26-page-head">
          <div><p className="co26-eyebrow">Secure Checkout</p><h1>Checkout</h1></div>
          <label className="co26-saved-toggle">
            <span>Use Saved Address</span><Info aria-hidden="true" />
            <input type="checkbox" checked={form.useSavedAddress} onChange={onToggleSavedAddress} disabled={status.submitting || status.addressLoading} />
            <i aria-hidden="true" />
          </label>
        </header>

        <Stepper activeStep={activeStep} />

        {(status.error || viewModel.previewError || viewModel.invalidItems.length > 0) ? (
          <div className="co26-alert" role="alert" data-testid="checkout-preview-blocker-message">
            <AlertTriangle aria-hidden="true" />
            <div><strong>Checkout needs your attention</strong><p>{status.error || viewModel.previewError || `${viewModel.invalidItems.length} item(s) must be updated before placing the order.`}</p></div>
          </div>
        ) : null}

        <div className="co26-grid">
          <div className="co26-main-column">
            <section className="co26-card">
              <SectionHeader number="01" title="Contact Details" />
              <div className="co26-form-grid">
                <Field label="First Name" icon={UserRound} required error={form.errors.firstName}><input ref={refs.firstName} value={form.firstName} onChange={(e) => onFieldChange("firstName", e.target.value)} placeholder="First Name" disabled={busy} /></Field>
                <Field label="Last Name" icon={CircleUserRound} required error={form.errors.lastName}><input value={form.lastName} onChange={(e) => onFieldChange("lastName", e.target.value)} placeholder="Last Name" disabled={busy} /></Field>
                <Field label="Email Address" icon={Mail}><input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} placeholder="Email Address" disabled={busy} /></Field>
                <Field label="Phone Number" icon={Phone} required error={form.errors.phone}><input ref={refs.phone} value={form.phone} onChange={(e) => onFieldChange("phone", e.target.value)} placeholder="Phone Number" disabled={busy} /></Field>
              </div>
              {status.authHint ? <p className="co26-inline-note"><Info /> Sign in to use your saved checkout details.</p> : null}
              {status.addressMessage ? <p className="co26-inline-note"><Info /> {status.addressMessage}</p> : null}
            </section>

            <section className="co26-card">
              <SectionHeader number="02" title="Shipping Details" />
              <div className="co26-form-grid">
                <Field label="Province" required error={form.errors.province}><select ref={refs.province} value={form.shipping.province} onChange={(e) => onShippingChange("province", e.target.value)} disabled={form.lockAddress}><option value="">Select Province</option>{options.provinces.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label="City / Regency" required error={form.errors.city}><select value={form.shipping.city} onChange={(e) => onShippingChange("city", e.target.value)} disabled={form.lockAddress || !form.shipping.province}><option value="">Select City/Regency</option>{options.cities.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label="Subdistrict" required error={form.errors.district}><select value={form.shipping.district} onChange={(e) => onShippingChange("district", e.target.value)} disabled={form.lockAddress || !form.shipping.city}><option value="">Select Subdistrict</option>{options.districts.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label="Postal Code" required error={form.errors.postalCode}><input inputMode="numeric" value={form.shipping.postalCode} onChange={(e) => onShippingChange("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder="Postal Code" disabled={form.lockAddress} /></Field>
                <Field label="Street Address" icon={MapPin} required error={form.errors.streetName}><input ref={refs.streetName} value={form.shipping.streetName} onChange={(e) => onShippingChange("streetName", e.target.value)} placeholder="Street Address" disabled={form.lockAddress} /></Field>
                <Field label="House Number" required error={form.errors.houseNumber}><input value={form.shipping.houseNumber} onChange={(e) => onShippingChange("houseNumber", e.target.value)} placeholder="House / Unit No." disabled={form.lockAddress} /></Field>
                <Field label="Building" icon={Building2}><input value={form.shipping.building} onChange={(e) => onShippingChange("building", e.target.value)} placeholder="Building / Floor / Block" disabled={form.lockAddress} /></Field>
                <Field label="Notes / Landmark"><input value={form.shipping.otherDetails} onChange={(e) => onShippingChange("otherDetails", e.target.value)} placeholder="Landmark / Notes (optional)" disabled={form.lockAddress} /></Field>
              </div>
            </section>

            <section className="co26-card" data-testid="checkout-preview-groups-section">
              <SectionHeader number="03" title="Summary by Store" subtitle="Your items are grouped by store for faster, more accurate fulfillment." icon={Store} />
              {viewModel.previewLoading ? <p className="co26-preview-wait"><span className="co26-spinner" /> Refreshing the latest backend preview...</p> : null}
              {!viewModel.previewLoading && viewModel.groups.length === 0 ? <p className="co26-preview-wait"><Info /> Waiting for the backend preview to group your items.</p> : null}
              <div className="co26-store-list">
                {viewModel.groups.map((group) => {
                  const storeCoupon = coupons.groups[String(group.storeId)] || {};
                  return <article className="co26-store" key={group.storeId} data-testid={`checkout-preview-group-container-${group.storeId}`}>
                    <div className="co26-store-head"><span className="co26-store-mark"><Store /></span><div><strong>{group.storeName}</strong><small>{group.items.length} item{group.items.length === 1 ? "" : "s"}{group.shippingNote ? ` · ${group.shippingNote}` : ""}</small></div><span className={group.paymentReady ? "is-ready" : ""}><BadgeCheck /> {group.paymentReady ? "Ready" : "Payment pending"}</span></div>
                    <div className="co26-store-products">{group.items.map((item) => <ProductRow key={item.lineId} item={item} disabled={busy} formatMoney={formatMoney} onDecrease={onDecrease} onIncrease={onIncrease} onRemove={onRemove} onReselectVariant={onReselectVariant} />)}</div>
                    {viewModel.checkoutMode === "MULTI_STORE" ? <CouponControl label={`Coupon for ${group.storeName}`} value={storeCoupon.code || ""} status={storeCoupon.status} message={storeCoupon.message} disabled={busy || status.previewBlocked || storeCoupon.status === "loading"} onChange={(value) => coupons.onGroupChange(group.storeId, value)} onApply={() => coupons.onGroupApply(group.raw)} onRemove={() => coupons.onGroupRemove(group.storeId)} /> : null}
                    <div className="co26-store-total"><span>Store subtotal</span><strong>{money(group.subtotal, formatMoney)}</strong></div>
                  </article>;
                })}
              </div>
            </section>

            <section className="co26-card co26-payment-card" data-testid="checkout-payment-methods">
              <SectionHeader number="04" title="Payment After Order Placement" subtitle="Payment options will appear once your order preview is ready." icon={CreditCard} />
              <div className={viewModel.paymentReady ? "co26-payment-state is-ready" : "co26-payment-state"}><span>{viewModel.paymentReady ? <PackageCheck /> : <LockKeyhole />}</span><strong>{viewModel.paymentReady ? "Payment ready" : "Payment unavailable"}</strong><p>{viewModel.paymentReady ? "Continue to place the order and open the secure payment step." : "Available after order preview."}</p>{!viewModel.paymentReady ? <small>We’ll activate payment options once backend checkout readiness is confirmed.</small> : null}</div>
              <p className="co26-info-strip"><Info /> No payment is required at this step.</p>
              <button type="button" className="co26-secondary-button" onClick={onBackToCart}><ArrowLeft /> Back to Cart</button>
            </section>
          </div>

          <aside className="co26-summary">
            <div className="co26-summary-card">
              <div className="co26-summary-head"><h2>Order Summary</h2><span>{viewModel.itemCount} Item{Number(viewModel.itemCount) === 1 ? "" : "s"}</span></div>
              <div className="co26-summary-products">{summaryItems.map((item) => <ProductRow compact key={`summary-${item.lineId}`} item={item} disabled={busy} formatMoney={formatMoney} onDecrease={onDecrease} onIncrease={onIncrease} onRemove={onRemove} />)}</div>
              {viewModel.checkoutMode === "SINGLE_STORE" ? <CouponControl value={coupons.code} status={coupons.status} message={coupons.message} disabled={busy || status.previewBlocked || coupons.status === "loading"} onChange={coupons.onChange} onApply={coupons.onApply} onRemove={coupons.onRemove} /> : <p className="co26-summary-coupon-note"><TicketPercent /> Apply coupons inside the matching store group.</p>}
              <dl className="co26-totals"><div><dt>Subtotal</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.subtotal, formatMoney) : dash}</dd></div><div><dt>Shipping</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.shipping, formatMoney) : dash}</dd></div><div><dt>Discount</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.discount, formatMoney) : dash}</dd></div><div><dt>Tax</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.tax, formatMoney) : dash}</dd></div><div className="co26-grand-total"><dt>Total</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.total, formatMoney) : dash}</dd></div></dl>
              <p className="co26-secure-note"><LockKeyhole /> Taxes and shipping calculated at order preview.</p>
              <button className="co26-place-order" type="submit" data-testid="checkout-submit-cta" disabled={busy || status.submitDisabled} aria-busy={status.submitting}><LockKeyhole /> {status.submitting ? "Placing Order..." : "Place Order"}</button>
              {status.submitMessage ? <p className="co26-submit-message" data-testid="checkout-submit-blocker-message">{status.submitMessage}</p> : null}
              <p className="co26-protection"><ShieldCheck /> Secure checkout. We protect your data.</p>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}
