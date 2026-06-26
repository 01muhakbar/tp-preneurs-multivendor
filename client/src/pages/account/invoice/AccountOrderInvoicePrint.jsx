import React from "react";
import { createPortal } from "react-dom";
import {
  Barcode,
  CalendarDays,
  Check,
  CircleCheckBig,
  CreditCard,
  Info,
  MapPin,
  Package,
  QrCode,
  ShieldCheck,
  Store,
  Truck,
  User,
} from "lucide-react";
import "./account-order-invoice.css";

const BrandLogo = () => (
  <div className="tp-invoice-brand" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ height: 24, width: 'auto', color: '#034c85' }}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
    <h1 style={{ fontSize: 18, color: '#034c85', fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>TP<span style={{ color: '#fe6f05' }}>PRENEURS</span></h1>
  </div>
);

const StoreBrandLogo = ({ identity }) => {
  if (identity.logoUrl) {
    return (
      <div className="tp-invoice-store-logo" style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid #e2e8f0', paddingLeft: 16 }}>
        <img src={identity.logoUrl} alt={identity.name} style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, border: '1px solid #e2e8f0' }} />
        <div className="tp-invoice-store-details" style={{ textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 2px 0', color: '#034c85', fontSize: 13 }}>{identity.name}</h4>
          <p style={{ margin: 0, color: '#fe6f05', fontWeight: 700, fontSize: 10 }}>{identity.merchantBadge}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="tp-invoice-store-logo" style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid #e2e8f0', paddingLeft: 16 }}>
      <div className="tp-invoice-store-monogram" style={{ width: 40, height: 40, borderRadius: 6, background: 'rgba(3, 76, 133, 0.1)', color: '#034c85', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800 }}>{identity.monogram}</div>
      <div className="tp-invoice-store-details" style={{ textAlign: 'left' }}>
        <h4 style={{ margin: '0 0 2px 0', color: '#034c85', fontSize: 13 }}>{identity.name}</h4>
        <p style={{ margin: 0, color: '#fe6f05', fontWeight: 700, fontSize: 10 }}>{identity.merchantBadge}</p>
      </div>
    </div>
  );
};

const HeaderSection = ({ meta, primaryIdentity }) => (
  <header className="tp-invoice-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, borderBottom: '1px solid #e2e8f0', paddingBottom: 16 }}>
    <div>
      <BrandLogo />
      <div className="tp-invoice-meta" style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 2px 0', color: '#64748b', fontSize: 11 }}>Order ID</p>
        <h3 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#034c85', display: 'flex', alignItems: 'center', gap: 8 }}>{meta.orderId}</h3>
        <div className="tp-invoice-meta-dates" style={{ display: 'flex', gap: 16, color: '#64748b', fontSize: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} /> Invoice Date: {meta.invoiceDate}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CalendarDays size={12} /> Payment Date: {meta.paymentDate}</span>
        </div>
      </div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div className="tp-invoice-title">
        <h2 style={{ fontSize: 20, fontWeight: 800, color: '#034c85', margin: '0 0 6px 0' }}>Invoice</h2>
        <span className={`tp-invoice-pill tp-invoice-pill--${meta.status.tone}`} style={{ fontSize: 10, padding: '2px 8px' }}>
          {meta.status.label}
        </span>
      </div>
      <div style={{ marginTop: 16 }}>
        <StoreBrandLogo identity={primaryIdentity} />
      </div>
    </div>
  </header>
);

const ProgressTracker = ({ tracker }) => (
  <div className="tp-invoice-tracker">
    {tracker.map((step, i) => (
      <div key={i} className={`tp-invoice-step ${step.done ? "done" : ""}`}>
        <div className="tp-invoice-step-icon">
          {step.done ? <Check size={14} /> : null}
        </div>
        <h5>{step.label}</h5>
        <p>{step.time}</p>
      </div>
    ))}
  </div>
);

const SinglePageInvoice = ({ data }) => {
  const { meta, customer, addresses, primaryIdentity, payment, shipment, storeBreakdown, items, notes } = data;

  return (
    <div className="tp-invoice-page single-page">
      <HeaderSection meta={meta} primaryIdentity={primaryIdentity} />

      {/* Grid 4 for Payment Method, Total, Status, Shipping */}
      <div className="tp-invoice-grid-4" style={{ marginBottom: 16 }}>
        <div className="tp-invoice-box" style={{ padding: 12 }}>
          <div className="tp-invoice-box-header">
            <CreditCard /> Payment Method
          </div>
          <h4 style={{ fontSize: 14 }}>{payment.method}</h4>
        </div>
        <div className="tp-invoice-box" style={{ padding: 12 }}>
          <div className="tp-invoice-box-header">
            <Package /> Total
          </div>
          <h4 style={{ fontSize: 14 }}>{payment.total}</h4>
        </div>
        <div className="tp-invoice-box" style={{ padding: 12 }}>
          <div className="tp-invoice-box-header">
            <ShieldCheck /> Status
          </div>
          <h4 style={{ fontSize: 14, color: meta.status.tone === 'success' ? '#16a34a' : '#034c85' }}>{meta.status.label}</h4>
        </div>
        <div className="tp-invoice-box" style={{ padding: 12 }}>
          <div className="tp-invoice-box-header">
            <Truck /> Shipping
          </div>
          <h4 style={{ fontSize: 14 }}>{payment.shipping}</h4>
        </div>
      </div>

      {/* Grid 3 for Customer, Billing, Shipping */}
      <div className="tp-invoice-grid-3" style={{ marginBottom: 16 }}>
        <div className="tp-invoice-address-box" style={{ padding: 12 }}>
          <h3 style={{ marginBottom: 8, fontSize: 12 }}>Customer</h3>
          <div className="tp-invoice-customer-info">
            <div className="tp-invoice-store-monogram" style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 12 }}>
              {customer.monogram}
            </div>
            <div>
              <h4 style={{ fontSize: 12 }}>{customer.name}</h4>
              <p style={{ fontSize: 10 }}>{customer.phone !== "-" ? customer.phone : ""}</p>
            </div>
          </div>
        </div>
        <div className="tp-invoice-address-box" style={{ padding: 12 }}>
          <h3 style={{ marginBottom: 8, fontSize: 12 }}>Billing Address</h3>
          <div className="tp-invoice-address-text" style={{ fontSize: 11 }}>
            <MapPin style={{ width: 14, height: 14 }} />
            <div>
              <strong>{customer.name}</strong><br />
              {addresses.billing.split(', ').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
            </div>
          </div>
        </div>
        <div className="tp-invoice-address-box" style={{ padding: 12 }}>
          <h3 style={{ marginBottom: 8, fontSize: 12 }}>Shipping Address</h3>
          <div className="tp-invoice-address-text" style={{ fontSize: 11 }}>
            <MapPin style={{ width: 14, height: 14 }} />
            <div>
              <strong>{customer.name}</strong><br />
              {addresses.shipping.split(', ').map((line, i) => <React.Fragment key={i}>{line}<br/></React.Fragment>)}
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="tp-invoice-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <table className="tp-invoice-table" style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: '8px 12px' }}>Item</th>
              <th style={{ padding: '8px 12px' }}>Variation</th>
              <th style={{ padding: '8px 12px' }}>Qty</th>
              <th style={{ padding: '8px 12px' }}>Unit Price</th>
              <th style={{ padding: '8px 12px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '8px 12px' }}>
                  <div className="tp-invoice-item-cell" style={{ gap: 8 }}>
                    <div className="tp-invoice-item-details">
                      <h4 style={{ fontSize: 12, margin: 0 }}>{item.name}</h4>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '8px 12px', color: '#64748b', fontSize: 12 }}>{item.variation}</td>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>{item.qty}</td>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>{item.unitPrice}</td>
                <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f1b33', fontSize: 12 }}>{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment & Store Breakdown Grid */}
      <div className="tp-invoice-grid-2" style={{ marginBottom: 16 }}>
        <div className="tp-invoice-card" style={{ padding: 16, marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#034c85', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CreditCard size={14} /> Payment Summary
          </h3>
          <div className="tp-invoice-breakdown">
            <div className="tp-invoice-summary-row" style={{ padding: '2px 0', fontSize: 12 }}><span>Subtotal ({payment.itemCount} items)</span><span>{payment.subtotal}</span></div>
            <div className="tp-invoice-summary-row" style={{ padding: '2px 0', fontSize: 12 }}><span>Shipping</span><span>{payment.shipping}</span></div>
            <div className="tp-invoice-summary-row" style={{ padding: '2px 0', fontSize: 12 }}><span>Service Fee</span><span>{payment.serviceFee}</span></div>
            <div className="tp-invoice-summary-row" style={{ padding: '2px 0', fontSize: 12 }}><span>Discount</span><span style={{ color: '#fe6f05' }}>{payment.discount}</span></div>
            <div className="tp-invoice-summary-row total" style={{ marginTop: 4, paddingTop: 8, fontSize: 14 }}>
              <span>Grand Total</span>
              <span style={{ color: '#034c85' }}>{payment.total}</span>
            </div>
          </div>
        </div>

        <div className="tp-invoice-card" style={{ padding: 16, marginBottom: 0 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 13, color: '#034c85', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Store size={14} /> Store & Shipment Info
          </h3>
          {storeBreakdown.map((store, idx) => (
            <div key={store.identity.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: idx !== storeBreakdown.length - 1 ? '1px dashed #cbd5e1' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {store.identity.logoUrl ? (
                  <img src={store.identity.logoUrl} alt="" style={{ width: 20, height: 20, borderRadius: 4 }} />
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: '#034c85', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>{store.identity.monogram}</div>
                )}
                <span style={{ fontSize: 12, fontWeight: 600 }}>{store.identity.name}</span>
              </div>
              <strong style={{ fontSize: 12 }}>{store.total}</strong>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, color: '#64748b', fontSize: 11 }}>Courier: <strong style={{ color: '#0f1b33' }}>{shipment.courier}</strong> &bull; Tracking: <strong style={{ color: '#0f1b33' }}>{shipment.trackingNo}</strong></p>
            {notes.buyerNote && (
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 11 }}>Note: <strong style={{ color: '#0f1b33' }}>{notes.buyerNote}</strong></p>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <QrCode size={40} strokeWidth={1} color="#0f1b33" />
          <div>
            <p style={{ margin: '0 0 2px 0', fontSize: 11, color: '#64748b' }}>Scan to verify or visit</p>
            <a href={`https://tpreneurs.com/verify/${meta.orderId}`} style={{ color: '#fe6f05', textDecoration: 'none', fontWeight: 600, fontSize: 12 }}>tpreneurs.com/verify</a>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <h3 style={{ margin: '0 0 2px 0', color: '#034c85', fontSize: 14 }}>Thank you for your purchase!</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: 11 }}>Need help? <a href="https://tpreneurs.com/support" style={{ color: '#fe6f05', textDecoration: 'none' }}>tpreneurs.com/support</a></p>
        </div>
      </div>
    </div>
  );
};

export default function AccountOrderInvoicePrint({ invoiceData, themeMode }) {
  if (!invoiceData) return null;
  const modeClass = themeMode === "dark" ? "dark" : "";

  const content = (
    <div className={`tp-invoice-root ${modeClass}`} aria-hidden="true">
      <SinglePageInvoice data={invoiceData} />
    </div>
  );

  return createPortal(content, document.body);
}
