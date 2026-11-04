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

function ProductRow({ item, compact = false, disabled, formatMoney, itemPriceLabel, onDecrease, onIncrease, onRemove, onReselectVariant, T }) {
  return (
    <div className={`co26-product${compact ? " co26-product--compact" : ""}${item.invalidItem ? " co26-product--invalid" : ""}`} data-checkout-invalid-item={item.invalidItem ? "true" : undefined}>
      <ProductImage item={item} />
      <div className="co26-product-copy">
        <strong>{item.name}</strong>
        {item.subtitle ? <span>{item.subtitle}</span> : null}
        {item.variantSelections?.map((selection, index) => (
          <span key={`${item.lineId}-option-${index}`}>{selection.name}: {selection.value}</span>
        ))}
        <small>{itemPriceLabel || T.itemPrice}&nbsp; {money(item.unitPrice, formatMoney)}</small>
      </div>
      {!compact ? <div className="co26-product-total">{money(item.lineTotal, formatMoney)}</div> : null}
      <QuantityControl item={item} disabled={disabled} onDecrease={onDecrease} onIncrease={onIncrease} />
      <button className="co26-remove" type="button" onClick={() => onRemove(item)} disabled={disabled} aria-label={`Remove ${item.name}`}>
        <Trash2 aria-hidden="true" />
      </button>
      {item.invalidItem ? (
        <div className="co26-invalid-detail">
          <AlertTriangle aria-hidden="true" />
          <span>{item.invalidItem.message || T.invalidItem}</span>
          {onReselectVariant ? <button type="button" onClick={() => onReselectVariant(item, item.invalidItem)}>{T.chooseVariantAgain}</button> : null}
        </div>
      ) : null}
    </div>
  );
}

function CouponControl({ value, status, message, disabled, label, applyLabel, applyingLabel, removeLabel, onChange, onApply, onRemove }) {
  const inputLabel = label || "Coupon Code";
  const applyText = applyLabel || "Apply";
  const applyingText = applyingLabel || "Applying...";
  return (
    <div className="co26-coupon-block">
      <div className="co26-coupon">
        <TicketPercent aria-hidden="true" />
        <input aria-label={inputLabel} value={value} onChange={(event) => onChange(event.target.value.toUpperCase())} placeholder={inputLabel} disabled={disabled} />
        <button type="button" onClick={onApply} disabled={disabled}>{status === "loading" ? applyingText : applyText}</button>
      </div>
      {message ? <p className={`co26-coupon-message co26-coupon-message--${status}`}>{message}</p> : null}
      {status === "applied" && onRemove ? <button className="co26-coupon-remove" type="button" onClick={onRemove} disabled={disabled}>{removeLabel || "Remove"}</button> : null}
    </div>
  );
}

function Stepper({ activeStep, steps }) {
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

function EmptyState({ T }) {
  return (
    <main className="co26-page"><div className="co26-empty">
      <span><ShoppingBag aria-hidden="true" /></span>
      <p className="co26-eyebrow">{T.secureCheckout}</p>
      <h1>{T.emptyTitle}</h1>
      <p>{T.emptyDesc}</p>
      <div><Link to="/cart" className="co26-secondary-button"><ArrowLeft /> {T.backToCart}</Link><Link to="/search" className="co26-primary-button">{T.browseProducts}</Link></div>
    </div></main>
  );
}

export default function Checkout2026View({
  viewModel,
  copy,
  isIndo: isIndoProp,
  lang: langProp,
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
  const { i18n } = useTranslation();
  const isIndo =
    isIndoProp !== undefined
      ? isIndoProp
      : i18n.language === "id" ||
        i18n.language === "id-ID" ||
        i18n.language?.startsWith("id") ||
        (typeof window !== "undefined" &&
          (localStorage.getItem("store_language") === "Indonesia" ||
            localStorage.getItem("store_language") === "Bahasa Indonesia"));

  const T = isIndo
    ? {
        secureCheckout: "CHECKOUT AMAN",
        title: "Checkout Pesanan",
        useSavedAddress: "Gunakan Alamat Utama",
        attention: "Perhatian",
        itemsMustBeUpdated: (count) => `${count} produk perlu diperbarui sebelum checkout.`,
        orderCreated: "Pesanan Dibuat",
        openingPayment: "Membuka halaman pembayaran aman...",
        continueToPayment: "Lanjutkan ke Pembayaran",
        backToCart: "Kembali ke Keranjang",
        browseProducts: "Jelajahi Produk",
        emptyTitle: "Keranjang Masih Kosong",
        emptyDesc: "Pilih produk favorit Anda terlebih dahulu sebelum checkout.",
        contactDetails: "Data Pemesan",
        shippingDetails: "Alamat Pengiriman",
        firstName: "Nama Depan",
        lastName: "Nama Belakang",
        email: "Alamat Email",
        phone: "Nomor Telepon",
        authHint: "Masuk ke akun Anda untuk menggunakan data alamat tersimpan.",
        province: "Provinsi",
        city: "Kota / Kabupaten",
        subdistrict: "Kecamatan",
        postalCode: "Kode Pos",
        streetAddress: "Nama Jalan / Alamat",
        houseNumber: "Nomor Rumah",
        houseNumberPlaceholder: "Nomor Rumah",
        building: "Gedung / Unit",
        buildingPlaceholder: "Gedung / Unit",
        landmark: "Catatan Tambahan",
        landmarkPlaceholder: "Patokan / Blok (opsional)",
        selectProvince: "Pilih Provinsi",
        selectCity: "Pilih Kota / Kabupaten",
        selectSubdistrict: "Pilih Kecamatan",
        summaryByStore: "Daftar Pesanan per Toko",
        itemPrice: "Harga Satuan:",
        itemCount: (count) => `${count} Produk`,
        paymentReady: "Siap Bayar",
        paymentPending: "Menunggu Verifikasi",
        storeSubtotal: "Subtotal Toko:",
        storeCouponLabel: (storeName) => `Kupon Toko (${storeName})`,
        paymentMethod: "Metode Pembayaran",
        duitkuSubtitle: "Bayar instan via Virtual Account, E-Wallet, Retail, atau QRIS.",
        chooseDuitkuChannel: "Pilih Saluran Pembayaran",
        popBadge: "Instant POP",
        paymentUnavailableStatus: "Pembayaran Belum Tersedia",
        paymentUnavailableDesc: "Lengkapi alamat pengiriman untuk memuat opsi pembayaran.",
        paymentNote: "Metode pembayaran akan aktif setelah kalkulasi pesanan siap.",
        orderSummary: "Ringkasan Pesanan",
        applyCouponsInGroup: "Gunakan kupon promo pada masing-masing grup toko di atas.",
        subtotal: "Subtotal",
        shipping: "Ongkos Kirim",
        discount: "Diskon",
        tax: "Pajak",
        total: "TOTAL PEMBAYARAN",
        placeOrder: "Buat Pesanan Sekarang",
        placingOrder: "Memproses Pesanan...",
        secureCheckoutNote: "Transaksi aman. Data pesanan Anda terlindungi.",
        invalidItem: "Produk tidak tersedia",
        chooseVariantAgain: "Pilih Ulang Varian",
        removeCoupon: "Hapus Kupon",
        couponCode: "Kode Kupon",
        apply: "Gunakan",
        applying: "Memproses...",
        categoryNames: {
          "Virtual Account": "Virtual Account",
          "E-Wallet": "Dompet Digital (E-Wallet)",
          "Retail": "Gerai Retail",
          "QRIS": "QRIS / Instant",
        },
        steps: ["Data Pemesan", "Alamat & Toko", "Periksa Pesanan", "Pembayaran"],
      }
    : {
        secureCheckout: "SECURE CHECKOUT",
        title: "Checkout",
        useSavedAddress: "Use Default Shipping Address",
        attention: "Attention",
        itemsMustBeUpdated: (count) => `${count} item(s) must be updated before checkout.`,
        orderCreated: "Order Created",
        openingPayment: "Opening secure payment...",
        continueToPayment: "Continue to Payment",
        backToCart: "Back to Cart",
        browseProducts: "Browse Products",
        emptyTitle: "Your cart is empty",
        emptyDesc: "Add items from the store before proceeding to checkout.",
        contactDetails: "Personal Details",
        shippingDetails: "Shipping Details",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email Address",
        phone: "Phone Number",
        authHint: "Sign in to use your saved checkout details.",
        province: "Province",
        city: "City/Regency",
        subdistrict: "Subdistrict",
        postalCode: "Postal Code",
        streetAddress: "Street Name",
        houseNumber: "House Number",
        houseNumberPlaceholder: "House Number",
        building: "Building",
        buildingPlaceholder: "Building / Floor / Unit",
        landmark: "Other Details",
        landmarkPlaceholder: "Block / Unit / Reference",
        selectProvince: "Select Province",
        selectCity: "Select City/Regency",
        selectSubdistrict: "Select Subdistrict",
        summaryByStore: "Order Summary by Store",
        itemPrice: "Item Price:",
        itemCount: (count) => `${count} Item${count !== 1 ? "s" : ""}`,
        paymentReady: "Payment Ready",
        paymentPending: "Payment Pending",
        storeSubtotal: "Store Subtotal:",
        storeCouponLabel: (storeName) => `Store Coupon (${storeName})`,
        paymentMethod: "Payment Method",
        duitkuSubtitle: "Direct to selected bank, wallet, retail, or QRIS channel.",
        chooseDuitkuChannel: "Choose Payment Channel",
        popBadge: "Instant POP",
        paymentUnavailableStatus: "Payment Unavailable",
        paymentUnavailableDesc: "Complete your shipping destination to load payment options.",
        paymentNote: "Payment options will appear once your order preview is ready.",
        orderSummary: "Order Summary",
        applyCouponsInGroup: "Apply coupons inside their matching store group above.",
        subtotal: "Subtotal",
        shipping: "Shipping",
        discount: "Discount",
        tax: "Tax",
        total: "TOTAL COST",
        placeOrder: "Place an Order",
        placingOrder: "Processing...",
        secureCheckoutNote: "Secure checkout. We protect your data.",
        invalidItem: "Invalid item",
        chooseVariantAgain: "Reselect Variant",
        removeCoupon: "Remove",
        couponCode: "Coupon Code",
        apply: "Apply",
        applying: "Applying...",
        categoryNames: {
          "Virtual Account": "Virtual Account",
          "E-Wallet": "E-Wallet",
          "Retail": "Retail Outlets",
          "QRIS": "QRIS / Instant",
        },
        steps: ["Personal Details", "Shipping Details", "Review Items", "Payment"],
      };

  if (status.loading) {
    return <main className="co26-page"><div className="co26-skeleton"><i /><i /><i /><i /></div></main>;
  }

  if (status.redirectUrl) {
    return <main className="co26-page"><div className="co26-empty"><span className="co26-spinner" /><h1>{T.orderCreated}</h1><p>{T.openingPayment}</p><a className="co26-primary-button" href={status.redirectUrl}>{T.continueToPayment}</a></div></main>;
  }
  if (!status.hasItems) return <EmptyState T={T} />;

  const previewItems = viewModel.groups.flatMap((group) => group.items);
  const summaryItems = previewItems.length ? previewItems : viewModel.cartItems;
  const activeStep = viewModel.previewReady ? 4 : 1;
  const busy = status.submitting || status.cartSyncing;

  return (
    <main className="co26-page">
      <form className="co26-shell" onSubmit={onSubmit} noValidate>
        <header className="co26-page-head">
          <div><p className="co26-eyebrow">{T.secureCheckout}</p><h1>{T.title}</h1></div>
          <label className="co26-saved-toggle">
            <span>{copy?.shippingDetails?.defaultShippingToggleLabel || T.useSavedAddress}</span><Info aria-hidden="true" />
            <input type="checkbox" checked={form.useSavedAddress} onChange={onToggleSavedAddress} disabled={status.submitting || status.addressLoading} />
            <i aria-hidden="true" />
          </label>
        </header>

        <Stepper activeStep={activeStep} steps={T.steps} />

        {(status.error || viewModel.previewError || viewModel.invalidItems.length > 0) ? (
          <div className="co26-alert" role="alert" data-testid="checkout-preview-blocker-message">
            <AlertTriangle aria-hidden="true" />
            <div><strong>{T.attention}</strong><p>{status.error || viewModel.previewError || T.itemsMustBeUpdated(viewModel.invalidItems.length)}</p></div>
          </div>
        ) : null}

        <div className="co26-grid">
          <div className="co26-main-column">
            <section className="co26-card">
              <SectionHeader number="01" title={copy?.personalDetails?.sectionTitle || T.contactDetails} subtitle={copy?.personalDetails?.sectionHint} icon={UserRound} />
              <div className="co26-form-grid">
                <Field label={copy?.personalDetails?.firstNameLabel || T.firstName} icon={UserRound} required error={form.errors.firstName}><input ref={refs.firstName} value={form.firstName} onChange={(e) => onFieldChange("firstName", e.target.value)} placeholder={copy?.personalDetails?.firstNamePlaceholder || T.firstName} disabled={busy} /></Field>
                <Field label={copy?.personalDetails?.lastNameLabel || T.lastName} icon={CircleUserRound} required error={form.errors.lastName}><input value={form.lastName} onChange={(e) => onFieldChange("lastName", e.target.value)} placeholder={copy?.personalDetails?.lastNamePlaceholder || T.lastName} disabled={busy} /></Field>
                <Field label={copy?.personalDetails?.emailLabel || T.email} icon={Mail}><input type="email" value={form.email} onChange={(e) => onFieldChange("email", e.target.value)} placeholder={copy?.personalDetails?.emailPlaceholder || T.email} disabled={busy} /></Field>
                <Field label={copy?.personalDetails?.phoneLabel || T.phone} icon={Phone} required error={form.errors.phone}><input ref={refs.phone} value={form.phone} onChange={(e) => onFieldChange("phone", e.target.value)} placeholder={copy?.personalDetails?.phonePlaceholder || T.phone} disabled={busy} /></Field>
              </div>
              {status.authHint ? <p className="co26-inline-note"><Info /> {T.authHint}</p> : null}
              {status.addressMessage ? <p className="co26-inline-note"><Info /> {status.addressMessage}</p> : null}
            </section>

            <section className="co26-card">
              <SectionHeader number="02" title={copy?.shippingDetails?.sectionTitle || T.shippingDetails} subtitle={copy?.shippingDetails?.sectionHint} icon={MapPin} />
              <div className="co26-form-grid">
                <Field label={copy?.shippingDetails?.provinceLabel || T.province} required error={form.errors.province}><select ref={refs.province} value={form.shipping.province} onChange={(e) => onShippingChange("province", e.target.value)} disabled={form.lockAddress}><option value="">{copy?.shippingDetails?.provincePlaceholder || T.selectProvince}</option>{options.provinces.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label={copy?.shippingDetails?.cityLabel || T.city} required error={form.errors.city}><select value={form.shipping.city} onChange={(e) => onShippingChange("city", e.target.value)} disabled={form.lockAddress || !form.shipping.province}><option value="">{copy?.shippingDetails?.cityPlaceholder || T.selectCity}</option>{options.cities.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label={copy?.shippingDetails?.districtLabel || T.subdistrict} required error={form.errors.district}><select value={form.shipping.district} onChange={(e) => onShippingChange("district", e.target.value)} disabled={form.lockAddress || !form.shipping.city}><option value="">{copy?.shippingDetails?.districtPlaceholder || T.selectSubdistrict}</option>{options.districts.map((option) => { const value = typeof option === "string" ? option : option.value; return <option key={value} value={value}>{typeof option === "string" ? option : option.label}</option>; })}</select></Field>
                <Field label={copy?.shippingDetails?.postalCodeLabel || T.postalCode} required error={form.errors.postalCode}><input inputMode="numeric" value={form.shipping.postalCode} onChange={(e) => onShippingChange("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))} placeholder={copy?.shippingDetails?.postalCodePlaceholder || T.postalCode} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.streetNameLabel || T.streetAddress} icon={MapPin} required error={form.errors.streetName}><input ref={refs.streetName} value={form.shipping.streetName} onChange={(e) => onShippingChange("streetName", e.target.value)} placeholder={copy?.shippingDetails?.streetNamePlaceholder || T.streetAddress} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.houseNumberLabel || T.houseNumber} required error={form.errors.houseNumber}><input value={form.shipping.houseNumber} onChange={(e) => onShippingChange("houseNumber", e.target.value)} placeholder={copy?.shippingDetails?.houseNumberPlaceholder || T.houseNumberPlaceholder} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.buildingLabel || T.building} icon={Building2}><input value={form.shipping.building} onChange={(e) => onShippingChange("building", e.target.value)} placeholder={copy?.shippingDetails?.buildingPlaceholder || T.buildingPlaceholder} disabled={form.lockAddress} /></Field>
                <Field label={copy?.shippingDetails?.otherDetailsLabel || T.landmark}><input value={form.shipping.otherDetails} onChange={(e) => onShippingChange("otherDetails", e.target.value)} placeholder={copy?.shippingDetails?.otherDetailsPlaceholder || T.landmarkPlaceholder} disabled={form.lockAddress} /></Field>
              </div>
            </section>

            <section className="co26-card" data-testid="checkout-preview-groups-section">
              <SectionHeader number="03" title={copy?.cartItemSection?.sectionTitle || T.summaryByStore} icon={Store} />
              {viewModel.previewLoading ? <p className="co26-preview-wait"><span className="co26-spinner" /> {isIndo ? "Memperbarui rincian pesanan..." : "Refreshing preview..."}</p> : null}
              {!viewModel.previewLoading && viewModel.groups.length === 0 ? <p className="co26-preview-wait"><Info /> {isIndo ? "Menunggu data kalkulasi toko..." : "Waiting for preview..."}</p> : null}
              <div className="co26-store-list">
                {viewModel.groups.map((group) => {
                  const storeCoupon = coupons.groups[String(group.storeId)] || {};
                  return (
                    <article className="co26-store" key={group.storeId} data-testid={`checkout-preview-group-container-${group.storeId}`}>
                      <div className="co26-store-head">
                        <span className="co26-store-mark"><Store /></span>
                        <div>
                          <strong>{group.storeName}</strong>
                          <small>{T.itemCount(group.items.length)}{group.shippingNote ? ` · ${group.shippingNote}` : ""}</small>
                        </div>
                        <span className={group.paymentReady ? "is-ready" : ""}>
                          <BadgeCheck /> {group.paymentReady ? T.paymentReady : T.paymentPending}
                        </span>
                      </div>
                      <div className="co26-store-products">
                        {group.items.map((item) => (
                          <ProductRow
                            key={item.lineId}
                            item={item}
                            disabled={busy}
                            formatMoney={formatMoney}
                            itemPriceLabel={copy?.cartItemSection?.itemPriceLabel}
                            onDecrease={onDecrease}
                            onIncrease={onIncrease}
                            onRemove={onRemove}
                            onReselectVariant={onReselectVariant}
                            T={T}
                          />
                        ))}
                      </div>
                      {viewModel.checkoutMode === "MULTI_STORE" ? (
                        <CouponControl
                          label={copy?.cartItemSection?.couponCodeLabel || T.storeCouponLabel(group.storeName)}
                          applyLabel={copy?.cartItemSection?.applyButtonLabel || T.apply}
                          applyingLabel={copy?.cartItemSection?.applyingButtonLabel || T.applying}
                          removeLabel={T.removeCoupon}
                          value={storeCoupon.code || ""}
                          status={storeCoupon.status}
                          message={storeCoupon.message}
                          disabled={busy || status.previewBlocked || storeCoupon.status === "loading"}
                          onChange={(value) => coupons.onGroupChange(group.storeId, value)}
                          onApply={() => coupons.onGroupApply(group.raw)}
                          onRemove={() => coupons.onGroupRemove(group.storeId)}
                        />
                      ) : null}
                      <div className="co26-store-total">
                        <span>{T.storeSubtotal}</span>
                        <strong>{money(group.subtotal, formatMoney)}</strong>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="co26-card co26-payment-card" data-testid="checkout-payment-methods">
              <SectionHeader number="04" title={copy?.shippingDetails?.paymentMethodLabel || T.paymentMethod} subtitle={T.duitkuSubtitle} icon={CreditCard} />
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
                          {option.id === "duitku" ? <small>{T.duitkuSubtitle}</small> : null}
                        </span>
                      </label>
                    );
                  })}
                  {form.paymentOptionId === "duitku" && Array.isArray(form.duitkuPaymentMethods) ? (
                    <div className="co26-duitku-channel-panel">
                      <div className="co26-duitku-panel-head">
                        <div>
                          <strong>{T.chooseDuitkuChannel}</strong>
                        </div>
                        <span>{T.popBadge}</span>
                      </div>
                      <div className="co26-duitku-groups">
                        {[...new Set(form.duitkuPaymentMethods.map((method) => method.category))].map((category) => (
                          <div className="co26-duitku-group" key={category}>
                            <p>{T.categoryNames[category] || category}</p>
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
                  <strong>{T.paymentUnavailableStatus}</strong>
                  <p>{T.paymentUnavailableDesc}</p>
                  <small>{T.paymentNote}</small>
                </div>
              )}
              <button type="button" className="co26-secondary-button" onClick={onBackToCart}><ArrowLeft /> {copy?.buttons?.continueButtonLabel || T.backToCart}</button>
            </section>
          </div>

          <aside className="co26-summary">
            <div className="co26-summary-card">
              <div className="co26-summary-head"><h2>{copy?.cartItemSection?.orderSummaryLabel || T.orderSummary}</h2><span>{T.itemCount(viewModel.itemCount)}</span></div>
              <div className="co26-summary-products">{summaryItems.map((item) => <ProductRow compact key={`summary-${item.lineId}`} item={item} disabled={busy} formatMoney={formatMoney} itemPriceLabel={copy?.cartItemSection?.itemPriceLabel} onDecrease={onDecrease} onIncrease={onIncrease} onRemove={onRemove} T={T} />)}</div>
              {viewModel.checkoutMode === "SINGLE_STORE" ? (
                <CouponControl
                  label={copy?.cartItemSection?.couponCodeLabel || T.couponCode}
                  applyLabel={copy?.cartItemSection?.applyButtonLabel || T.apply}
                  applyingLabel={copy?.cartItemSection?.applyingButtonLabel || T.applying}
                  removeLabel={T.removeCoupon}
                  value={coupons.code}
                  status={coupons.status}
                  message={coupons.message}
                  disabled={busy || status.previewBlocked || coupons.status === "loading"}
                  onChange={coupons.onChange}
                  onApply={coupons.onApply}
                  onRemove={coupons.onRemove}
                />
              ) : (
                <p className="co26-summary-coupon-note"><TicketPercent /> {T.applyCouponsInGroup}</p>
              )}
              <dl className="co26-totals">
                <div><dt>{copy?.cartItemSection?.subTotalLabel || T.subtotal}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.subtotal, formatMoney) : dash}</dd></div>
                <div><dt>{copy?.cartItemSection?.shippingLabel || T.shipping}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.shipping, formatMoney) : dash}</dd></div>
                <div><dt>{copy?.cartItemSection?.discountLabel || T.discount}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.discount, formatMoney) : dash}</dd></div>
                <div><dt>{copy?.cartItemSection?.taxLabel || T.tax}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.tax, formatMoney) : dash}</dd></div>
                <div className="co26-grand-total"><dt>{copy?.cartItemSection?.totalCostLabel || T.total}</dt><dd>{viewModel.previewReady ? money(viewModel.amounts.total, formatMoney) : dash}</dd></div>
              </dl>
              <button className="co26-place-order" type="submit" data-testid="checkout-submit-cta" disabled={busy || status.submitDisabled} aria-busy={status.submitting}><LockKeyhole /> {status.submitting ? (copy?.buttons?.processingButtonLabel || T.placingOrder) : (copy?.buttons?.confirmButtonLabel || T.placeOrder)}</button>
              {status.submitMessage ? <p className="co26-submit-message" data-testid="checkout-submit-blocker-message">{status.submitMessage}</p> : null}
              <p className="co26-protection"><ShieldCheck /> {T.secureCheckoutNote}</p>
            </div>
          </aside>
        </div>
      </form>
    </main>
  );
}
