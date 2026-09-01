import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

const DUITKU_CHANNEL_BRANDS = {
  BC: { mark: "BCA", tone: "bca" },
  I1: { mark: "BNI", tone: "bni" },
  BR: { mark: "BRI", tone: "bri" },
  M2: { mark: "MDR", tone: "mandiri" },
  BT: { mark: "PRM", tone: "permata" },
  B1: { mark: "CIMB", tone: "cimb" },
  BV: { mark: "BSI", tone: "bsi" },
  DA: { mark: "DANA", tone: "dana" },
  OV: { mark: "OVO", tone: "ovo" },
  IR: { mark: "IDM", tone: "indomaret" },
  FT: { mark: "RET", tone: "retail" },
  SP: { mark: "SPay", tone: "qris" },
  NQ: { mark: "NOBU", tone: "qris" },
  GQ: { mark: "GV", tone: "qris" },
};

function DuitkuChannelMark({ method }) {
  const brand = DUITKU_CHANNEL_BRANDS[method?.code] || {
    mark: method?.code || "PAY",
    tone: "default",
  };
  return (
    <span className={`co26-duitku-mark co26-duitku-mark--${brand.tone}`} aria-hidden="true">
      {brand.mark}
    </span>
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

function ProductRow({ item, compact = false, disabled, formatMoney, itemPriceLabel, onDecrease, onIncrease, onRemove, onReselectVariant }) {
  const { t } = useTranslation();
  return (
    <div className={`co26-product${compact ? " co26-product--compact" : ""}${item.invalidItem ? " co26-product--invalid" : ""}`} data-checkout-invalid-item={item.invalidItem ? "true" : undefined}>
      <ProductImage item={item} />
      <div className="co26-product-copy">
        <strong>{item.name}</strong>
        {item.subtitle ? <span>{item.subtitle}</span> : null}
        {item.variantSelections.map((selection, index) => (
          <span key={`${item.lineId}-option-${index}`}>{selection.name}: {selection.value}</span>
        ))}
        <small>{itemPriceLabel || t("checkout.itemPrice")}&nbsp; {money(item.unitPrice, formatMoney)}</small>
      </div>
      {!compact ? <div className="co26-product-total">{money(item.lineTotal, formatMoney)}</div> : null}
      <QuantityControl item={item} disabled={disabled} onDecrease={onDecrease} onIncrease={onIncrease} />
      <button className="co26-remove" type="button" onClick={() => onRemove(item)} disabled={disabled} aria-label={t("checkout.removeAria", { name: item.name })}>
        <Trash2 aria-hidden="true" />
      </button>
      {item.invalidItem ? (
        <div className="co26-invalid-detail">
          <AlertTriangle aria-hidden="true" />
          <span>{item.invalidItem.message || t("checkout.invalidItem")}</span>
          {onReselectVariant ? <button type="button" onClick={() => onReselectVariant(item, item.invalidItem)}>{t("checkout.chooseVariantAgain")}</button> : null}
        </div>
      ) : null}
    </div>
  );
}

function CouponControl({ value, status, message, disabled, label, applyLabel, applyingLabel, onChange, onApply, onRemove }) {
  const { t } = useTranslation();
  const inputLabel = label || t("checkout.couponCode");
  const applyText = applyLabel || t("checkout.apply");
  const applyingText = applyingLabel || t("checkout.applying");
  return (
    <div className="co26-coupon-block">
      <div className="co26-coupon">
        <TicketPercent aria-hidden="true" />
        <input aria-label={inputLabel} value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} placeholder={inputLabel} disabled={disabled} />
        <button type="button" onClick={onApply} disabled={disabled}>{status === "loading" ? applyingText : applyText}</button>
      </div>
      {message ? <p className={`co26-coupon-message co26-coupon-message--${status}`}>{message}</p> : null}
      {status === "applied" && onRemove ? <button className="co26-coupon-remove" type="button" onClick={onRemove} disabled={disabled}>{t("checkout.removeCoupon")}</button> : null}
    </div>
  );
}

function Stepper({ activeStep }) {
  const { t } = useTranslation();
  const steps = [t("checkout.stepContact"), t("checkout.stepSummary"), t("checkout.stepReview"), t("checkout.stepPayment")];
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
  const { t } = useTranslation();
  return (
    <main className="co26-page"><div className="co26-empty">
      <span><ShoppingBag aria-hidden="true" /></span>
      <p className="co26-eyebrow">{t("checkout.secureCheckout")}</p>
      <h1>{t("checkout.emptyTitle")}</h1>
      <p>{t("checkout.emptyDesc")}</p>
      <div><Link to="/cart" className="co26-secondary-button"><ArrowLeft /> {t("checkout.backToCart")}</Link><Link to="/search" className="co26-primary-button">{t("checkout.browseProducts")}</Link></div>
    </div></main>
  );
}

export default function Checkout2026View({
  viewModel,
  copy,
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
  const { t } = useTranslation();

  if (status.redirectUrl) {
    return <main className="co26-page"><div className="co26-empty"><span className="co26-spinner" /><h1>{t("checkout.orderCreated")}</h1><p>{t("checkout.openingPayment")}</p><a className="co26-primary-button" href={status.redirectUrl}>{t("checkout.continueToPayment")}</a></div></main>;
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
          <div><p className="co26-eyebrow">{t("checkout.secureCheckout")}</p><h1>{t("checkout.title")}</h1></div>
          <label className="co26-saved-toggle">
            <span>{copy?.shippingDetails?.defaultShippingToggleLabel || t("checkout.useSavedAddress")}</span><Info aria-hidden="true" />
            <input type="checkbox" checked={form.useSavedAddress} onChange={onToggleSavedAddress} disabled={status.submitting || status.addressLoading} />
            <i aria-hidden="true" />
          </label>
        </header>

        <Stepper activeStep={activeStep} />

        {(status.error || viewModel.previewError || viewModel.invalidItems.length > 0) ? (
          <div className="co26-alert" role="alert" data-testid="checkout-preview-blocker-message">
            <AlertTriangle aria-hidden="true" />
            <div><strong>{t("checkout.attention")}</strong><p>{status.error || viewModel.previewError || t("checkout.itemsMustBeUpdated", { count: viewModel.invalidItems.length })}</p></div>
          </div>
        ) : null}

        <div className="co26-grid">
          <div className="co26-main-column">
            <section className="co26-card">
              <SectionHeader number="01" title={copy?.personalDetails?.sectionTitle || t("checkout.contactDetails")} subtitle={copy?.personalDetails?.sectionHint} />
              <div className="co26-form-grid">
                <Field label={copy?.personalDetails?.firstNameLabel || t("checkout.firstName")} icon={UserRound} required error={form.errors.firstName}><input ref={refs.firstName} value={form.firstName} onChange={(e) => onFieldChange("firstName", e.target.value)} placeholder={copy?.personalDetails?.firstNamePlaceholder || t("checkout.firstName")} disabled={busy} /></Field>
                <Field label={copy?.personalDetails?.lastNameLabel || t("checkout.lastName")} icon={CircleUserRound} required error={form.errors.lastName}><input value={form.lastName} onChange={(e) => onFieldChange("lastName", e.target.value)} placeholder={copy?.personalDetails?.lastNamePlaceholder || t("checkout.lastName")} disabled={busy} /></Field>
                <Field label={copy?.personalDetails?.emailLabel || t("checkout.email")} icon={Mail}><input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} placeholder={copy?.personalDetails?.emailPlaceholder || t("checkout.email")} disabled={busy} /></Field>
                <Field label={copy?.personalDetails?.phoneLabel || t("checkout.phone")} icon={Phone} required error={form.errors.phone}><input ref={refs.phone} value={form.phone} onChange={(e) => onFieldChange("phone", e.target.value)} placeholder={copy?.personalDetails?.phonePlaceholder || t("checkout.phone")} disabled={busy} /></Field>
              </div>
              {status.authHint ? <p className="co26-inline-note"><Info /> {t("checkout.authHint")}</p> : null}
              {status.addressMessage ? <p className="co26-inline-note"><Info /> {status.addressMessage}</p> : null}
            </section>

            <section className="co26-card">
              <SectionHeader number="02" title={copy?.shippingDetails?.sectionTitle || t("checkout.shippingDetails")} subtitle={copy?.shippingDetails?.sectionHint} />
              <div className="co26-form-grid">
                <Field label={copy?.shippingDetails?.provinceLabel || t("checkout.province")} required error={form.errors.province}><select ref={refs.province} value={form.shipping.province} onChange={(e) => onShippingChange("province", e.target.value)} disabled={form.lockAddress}><option value="">{copy?.shippingDetails?.provincePlaceholder || t("checkout.selectProvince")}</option>{options.provinces.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label={copy?.shippingDetails?.cityLabel || t("checkout.city")} required error={form.errors.city}><select value={form.shipping.city} onChange={(e) => onShippingChange("city", e.target.value)} disabled={form.lockAddress || !form.shipping.province}><option value="">{copy?.shippingDetails?.cityPlaceholder || t("checkout.selectCity")}</option>{options.cities.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label={copy?.shippingDetails?.districtLabel || t("checkout.subdistrict")} required error={form.errors.district}><select value={form.shipping.district} onChange={(e) => onShippingChange("district", e.target.value)} disabled={form.lockAddress || !form.shipping.city}><option value="">{copy?.shippingDetails?.districtPlaceholder || t("checkout.selectSubdistrict")}</option>{options.districts.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label={copy?.shippingDetails?.postalCodeLabel || t("checkout.postalCode")} required error={form.errors.postalCode}><input inputMode="numeric" value={form.shipping.postalCode} onChange={(e) => onShippingChange("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder={copy?.shippingDetails?.postalCodePlaceholder || t("checkout.postalCode")} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.streetNameLabel || t("checkout.streetAddress")} icon={MapPin} required error={form.errors.streetName}><input ref={refs.streetName} value={form.shipping.streetName} onChange={(e) => onShippingChange("streetName", e.target.value)} placeholder={copy?.shippingDetails?.streetNamePlaceholder || t("checkout.streetAddress")} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.houseNumberLabel || t("checkout.houseNumber")} required error={form.errors.houseNumber}><input value={form.shipping.houseNumber} onChange={(e) => onShippingChange("houseNumber", e.target.value)} placeholder={copy?.shippingDetails?.houseNumberPlaceholder || t("checkout.houseNumberPlaceholder")} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.buildingLabel || t("checkout.building")} icon={Building2}><input value={form.shipping.building} onChange={(e) => onShippingChange("building", e.target.value)} placeholder={copy?.shippingDetails?.buildingPlaceholder || t("checkout.buildingPlaceholder")} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.otherDetailsLabel || t("checkout.landmark")}><input value={form.shipping.otherDetails} onChange={(e) => onShippingChange("otherDetails", e.target.value)} placeholder={copy?.shippingDetails?.otherDetailsPlaceholder || t("checkout.landmarkPlaceholder")} disabled={form.lockAddress} /></Field>
              </div>
            </section>

            <section className="co26-card" data-testid="checkout-preview-groups-section">
              <SectionHeader number="03" title={t("checkout.summaryByStore")} subtitle={t("checkout.storeGroupSubtitle")} icon={Store} />
              {viewModel.previewLoading ? <p className="co26-preview-wait"><span className="co26-spinner" /> {t("checkout.refreshingPreview")}</p> : null}
              {!viewModel.previewLoading && viewModel.groups.length === 0 ? <p className="co26-preview-wait"><Info /> {t("checkout.waitingPreview")}</p> : null}
              <div className="co26-store-list">
                {viewModel.groups.map((group) => {
                  const storeCoupon = coupons.groups[String(group.storeId)] || {};
                  return <article className="co26-store" key={group.storeId} data-testid={`checkout-preview-group-container-${group.storeId}`}>
                    <div className="co26-store-head"><span className="co26-store-mark"><Store /></span><div><strong>{group.storeName}</strong><small>{t("checkout.itemCount", { count: group.items.length })}{group.shippingNote ? ` · ${group.shippingNote}` : ""}</small></div><span className={group.paymentReady ? "is-ready" : ""}><BadgeCheck /> {group.paymentReady ? t("checkout.paymentReady") : t("checkout.paymentPending")}</span></div>
                    <div className="co26-store-products">{group.items.map((item) => <ProductRow key={item.lineId} item={item} disabled={busy} formatMoney={formatMoney} onDecrease={onDecrease} onIncrease={onIncrease} onRemove={onRemove} onReselectVariant={onReselectVariant} />)}</div>
                    {viewModel.checkoutMode === "MULTI_STORE" ? <CouponControl label={copy?.cartItemSection?.couponCodeLabel || t("checkout.storeCouponLabel", { storeName: group.storeName })} applyLabel={copy?.cartItemSection?.applyButtonLabel} applyingLabel={copy?.cartItemSection?.applyingButtonLabel} value={storeCoupon.code || ""} status={storeCoupon.status} message={storeCoupon.message} disabled={busy || status.previewBlocked || storeCoupon.status === "loading"} onChange={(value) => coupons.onGroupChange(group.storeId, value)} onApply={() => coupons.onGroupApply(group.raw)} onRemove={() => coupons.onGroupRemove(group.storeId)} /> : null}
                    <div className="co26-store-total"><span>{t("checkout.storeSubtotal")}</span><strong>{money(group.subtotal, formatMoney)}</strong></div>
                  </article>;
                })}
              </div>
            </section>

            <section className="co26-card co26-payment-card" data-testid="checkout-payment-methods">
              <SectionHeader number="04" title={copy?.shippingDetails?.paymentMethodLabel || t("checkout.paymentAfterOrder")} subtitle={t("checkout.paymentOptionsSubtitle")} icon={CreditCard} />
              {viewModel.paymentReady ? (
                <div className="co26-payment-options-list">
                  {form.paymentOptions?.map((option) => {
                    const isSelected = form.paymentOptionId === option.id;
                    return (
                      <label
                        key={option.id}
                        className={`co26-payment-radio ${isSelected ? "is-selected" : ""}`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={option.id}
                          checked={isSelected}
                          onChange={() => form.setPaymentOptionId(option.id)}
                          disabled={busy}
                        />
                        <span className="co26-payment-radio__check" aria-hidden="true" />
                        {option.Icon ? <span className="co26-payment-radio__icon"><option.Icon aria-hidden="true" /></span> : null}
                        <span className="co26-payment-radio__copy">
                          <strong>{option.title}</strong>
                          {option.id === "duitku" ? <small>Direct to selected bank, wallet, retail, or QRIS channel.</small> : null}
                        </span>
                      </label>
                    );
                  })}
                  {form.paymentOptionId === "duitku" && Array.isArray(form.duitkuPaymentMethods) ? (
                    <div className="co26-duitku-channel-panel">
                      <div className="co26-duitku-panel-head">
                        <div>
                          <strong>Choose Duitku Channel</strong>
                        </div>
                        <span>POP</span>
                      </div>
                      <div className="co26-duitku-groups">
                        {[...new Set(form.duitkuPaymentMethods.map((method) => method.category))].map((category) => (
                          <div className="co26-duitku-group" key={category}>
                            <p>{category}</p>
                            <div className="co26-duitku-channel-grid">
                              {form.duitkuPaymentMethods
                                .filter((method) => method.category === category)
                                .map((method) => {
                                  const selected = form.duitkuPaymentMethod === method.code;
                                  return (
                                    <button
                                      key={method.code}
                                      type="button"
                                      onClick={() => form.setDuitkuPaymentMethod(method.code)}
                                      disabled={busy}
                                      aria-pressed={selected}
                                      className={`co26-duitku-channel ${selected ? "is-selected" : ""}`}
                                    >
                                      <DuitkuChannelMark method={method} />
                                      <span>
                                        <strong>{method.label}</strong>
                                        <small>{method.code}</small>
                                      </span>
                                      <i aria-hidden="true" />
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="co26-payment-state">
                  <span><LockKeyhole /></span>
                  <strong>{t("checkout.paymentUnavailableStatus")}</strong>
                  <p>{t("checkout.paymentUnavailableDesc")}</p>
                  <small>{t("checkout.paymentNote")}</small>
                </div>
              )}
              <button type="button" className="co26-secondary-button" onClick={onBackToCart}><ArrowLeft /> {copy?.buttons?.continueButtonLabel || t("checkout.backToCart")}</button>
            </section>
          </div>

          <aside className="co26-summary">
            <div className="co26-summary-card">
              <div className="co26-summary-head"><h2>{copy?.cartItemSection?.orderSummaryLabel || t("checkout.orderSummary")}</h2><span>{t("checkout.itemCount", { count: viewModel.itemCount })}</span></div>
              <div className="co26-summary-products">{summaryItems.map((item) => <ProductRow compact key={`summary-${item.lineId}`} item={item} disabled={busy} formatMoney={formatMoney} itemPriceLabel={copy?.cartItemSection?.itemPriceLabel} onDecrease={onDecrease} onIncrease={onIncrease} onRemove={onRemove} />)}</div>
              {viewModel.checkoutMode === "SINGLE_STORE" ? <CouponControl label={copy?.cartItemSection?.couponCodeLabel} applyLabel={copy?.cartItemSection?.applyButtonLabel} applyingLabel={copy?.cartItemSection?.applyingButtonLabel} value={coupons.code} status={coupons.status} message={coupons.message} disabled={busy || status.previewBlocked || coupons.status === "loading"} onChange={coupons.onChange} onApply={coupons.onApply} onRemove={coupons.onRemove} /> : <p className="co26-summary-coupon-note"><TicketPercent /> {t("checkout.applyCouponsInGroup")}</p>}
              <dl className="co26-totals"><div><dt>{copy?.cartItemSection?.subTotalLabel || t("checkout.subtotal")}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.subtotal, formatMoney) : dash}</dd></div><div><dt>{copy?.cartItemSection?.shippingLabel || t("checkout.shipping")}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.shipping, formatMoney) : dash}</dd></div><div><dt>{copy?.cartItemSection?.discountLabel || t("checkout.discount")}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.discount, formatMoney) : dash}</dd></div><div><dt>{copy?.cartItemSection?.taxLabel || t("checkout.tax")}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.tax, formatMoney) : dash}</dd></div><div className="co26-grand-total"><dt>{copy?.cartItemSection?.totalCostLabel || t("checkout.total")}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.total, formatMoney) : dash}</dd></div></dl>
              <p className="co26-secure-note"><LockKeyhole /> {t("checkout.taxesCalculatedNote")}</p>
              <button className="co26-place-order" type="submit" data-testid="checkout-submit-cta" disabled={busy || status.submitDisabled} aria-busy={status.submitting}><LockKeyhole /> {status.submitting ? (copy?.buttons?.processingButtonLabel || t("checkout.placingOrder")) : (copy?.buttons?.confirmButtonLabel || t("checkout.placeOrder"))}</button>
              {status.submitMessage ? <p className="co26-submit-message" data-testid="checkout-submit-blocker-message">{status.submitMessage}</p> : null}
              <p className="co26-protection"><ShieldCheck /> {t("checkout.secureCheckoutNote")}</p>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}
