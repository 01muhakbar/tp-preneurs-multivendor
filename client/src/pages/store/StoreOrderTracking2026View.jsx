import {
  ArrowLeft,
  Box,
  Check,
  CircleHelp,
  Download,
  Mail,
  MapPin,
  Package,
  Printer,
  ShieldCheck,
  Truck,
  WalletCards,
} from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import "./store-order-tracking-2026.css";

function StatusPill({ status }) {
  return (
    <span className={`tpord2026-pill tpord2026-pill--${status?.tone || "slate"}`}>
      {status?.label || "Not set"}
    </span>
  );
}

function LoadingState() {
  return (
    <div className="tpord2026-page">
      <div className="tpord2026-skeleton tpord2026-skeleton--hero" />
      <div className="tpord2026-layout">
        <div className="tpord2026-skeleton tpord2026-skeleton--tall" />
        <div className="tpord2026-skeleton tpord2026-skeleton--tall" />
      </div>
    </div>
  );
}

function ErrorState({ error, Link, T }) {
  return (
    <section className="tpord2026-state">
      <CircleHelp aria-hidden="true" />
      <h1>{T.orderTrackingUnavailable}</h1>
      <p>
        {error?.response?.data?.message ||
          error?.message ||
          (T.isIndo ? "Periksa kembali nomor pesanan Anda dan coba beberapa saat lagi." : "Check the order reference and try again.")}
      </p>
      <Link to="/" className="tpord2026-back-btn">
        <ArrowLeft aria-hidden="true" />
        {T.backToHome}
      </Link>
    </section>
  );
}

function Progress({ steps, status, T }) {
  return (
    <section className="tpord2026-card tpord2026-progress-card">
      <header>
        <div>
          <span className="tpord2026-card-icon" aria-hidden="true"><Package /></span>
          <div>
            <h2>{T.deliveryProgress}</h2>
            <p>{T.deliveryProgressDesc}</p>
          </div>
        </div>
      </header>
      <div className="tpord2026-progress">
        {steps.map((step) => {
          const Icon =
            step.code === "SHIPPING"
              ? Truck
              : step.code === "DELIVERED"
                ? ShieldCheck
                : step.complete
                  ? Check
                  : Box;
          return (
            <article
              key={step.code}
              className={step.complete ? "is-complete" : step.active ? "is-active" : ""}
            >
              <span aria-hidden="true"><Icon /></span>
              <strong>{step.label}</strong>
              <small>{step.dateLabel}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ShipmentCard({ shipment, T }) {
  return (
    <article className="tpord2026-shipment">
      <header>
        <div>
          <span className="tpord2026-shipment-icon" aria-hidden="true"><Truck /></span>
          <div>
            <strong>{shipment.storeName}</strong>
            <small>{shipment.suborderNumber} · {T.itemsCount(shipment.itemCount)}</small>
          </div>
        </div>
        <StatusPill status={shipment.status} />
      </header>
      <div className="tpord2026-shipment__body">
        <dl>
          <div><dt>{T.source}</dt><dd>{shipment.sourceLabel}</dd></div>
          <div><dt>{T.trackingNumber}</dt><dd>{shipment.trackingNumber}</dd></div>
          <div><dt>{T.courier}</dt><dd>{shipment.courier}</dd></div>
        </dl>
        <ol>
          {shipment.timeline.length ? (
            shipment.timeline.map((event) => (
              <li key={event.id}>
                <i aria-hidden="true" />
                <div>
                  <strong>{event.label}</strong>
                  <small>{event.happenedAtLabel}</small>
                  {event.description ? <p>{event.description}</p> : null}
                </div>
              </li>
            ))
          ) : (
            <li>
              <i aria-hidden="true" />
              <div>
                <strong>{T.waitingForTracking}</strong>
                <small>{T.trackingNotSet}</small>
              </div>
            </li>
          )}
        </ol>
      </div>
    </article>
  );
}

function ItemsTable({ items, T }) {
  return (
    <section className="tpord2026-card tpord2026-items">
      <header>
        <span className="tpord2026-card-icon" aria-hidden="true"><Package /></span>
        <h2>{T.orderItems}</h2>
      </header>
      <div className="tpord2026-table-wrap">
        <table>
          <thead>
            <tr>
              <th>{T.product}</th>
              <th>{T.variant}</th>
              <th>{T.qty}</th>
              <th>{T.price}</th>
              <th>{T.subtotal}</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="tpord2026-product">
                      <span aria-hidden="true">
                        {item.imageUrl ? <img src={resolveAssetUrl(item.imageUrl)} alt="" /> : <Box />}
                      </span>
                      <strong>{item.name}</strong>
                    </span>
                  </td>
                  <td>{item.variant}</td>
                  <td>{item.quantity}</td>
                  <td>{item.priceLabel}</td>
                  <td>{item.subtotalLabel}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5}>{T.noItems}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function StoreOrderTracking2026View({
  tracking,
  isIndo = false,
  lang = "en",
  isLoading = false,
  error = null,
  isDownloading = false,
  downloadError = "",
  LinkComponent = "a",
  onDownloadInvoice,
  onPrintInvoice,
  onEmailSupport,
  onWhatsAppSupport,
}) {
  const Link = LinkComponent;

  const T = isIndo
    ? {
        isIndo: true,
        backToHome: "Kembali ke Beranda",
        orderDate: "Tanggal Pesanan:",
        orderNumber: "Pesanan #",
        paymentMethod: "Metode Pembayaran",
        paymentStatus: "Status Pembayaran",
        shipmentStatus: "Status Pengiriman",
        totalAmount: "Total Pembayaran",
        weWillKeepYouUpdated: "Pembaruan Pengiriman",
        keepThisPage: "Simpan halaman ini untuk memantau status pesanan dan pengiriman secara langsung.",
        deliveryProgress: "Tahapan Pesanan",
        deliveryProgressDesc: "Lacak perkembangan proses pesanan Anda hingga tiba di tujuan.",
        storeShipments: (count) => `Pengiriman Toko (${count})`,
        shippingInformation: "Informasi Pengiriman",
        shippingStatus: "Status Pengiriman",
        deliveryAddress: "Alamat Pengiriman",
        paymentInformation: "Informasi Pembayaran",
        status: "Status",
        method: "Metode",
        orderItems: "Daftar Produk",
        product: "Produk",
        variant: "Varian",
        qty: "Jumlah",
        price: "Harga",
        subtotal: "Subtotal",
        orderSummary: "Ringkasan Pembayaran",
        shippingFee: "Ongkos Kirim",
        serviceFee: "Biaya Layanan",
        discount: "Diskon",
        thankYou: "Terima Kasih!",
        orderReceivedNotice: "Pesanan Anda telah dikonfirmasi dan sedang diproses.",
        downloadInvoice: "Unduh Invoice",
        preparingPdf: "Menyiapkan PDF...",
        printInvoice: "Cetak Invoice",
        needHelp: "Butuh bantuan terkait pesanan Anda?",
        emailUs: "Kirim Email",
        whatsapp: "Chat WhatsApp",
        source: "Pengiriman",
        trackingNumber: "Nomor Resi",
        courier: "Jasa Kurir",
        itemsCount: (count) => `${count} Produk`,
        waitingForTracking: "Menunggu pembaruan nomor resi",
        trackingNotSet: "Segera diperbarui oleh penjual",
        orderTrackingUnavailable: "Pelacakan Pesanan Tidak Ditemukan",
        noItems: "Tidak ada produk dalam pesanan ini.",
        noShipmentYet: "Belum ada rincian paket pengiriman yang aktif.",
      }
    : {
        isIndo: false,
        backToHome: "Back to Home",
        orderDate: "Order Date:",
        orderNumber: "Order #",
        paymentMethod: "Payment Method",
        paymentStatus: "Payment Status",
        shipmentStatus: "Shipment Status",
        totalAmount: "Total Amount",
        weWillKeepYouUpdated: "Live Tracking Updates",
        keepThisPage: "Check back here anytime for real-time delivery progress.",
        deliveryProgress: "Delivery Progress",
        deliveryProgressDesc: "Track every stage of this order from payment to delivery.",
        storeShipments: (count) => `Store Shipments (${count})`,
        shippingInformation: "Shipping Information",
        shippingStatus: "Shipping Status",
        deliveryAddress: "Delivery Address",
        paymentInformation: "Payment Information",
        status: "Status",
        method: "Method",
        orderItems: "Order Items",
        product: "Product",
        variant: "Variant",
        qty: "Qty",
        price: "Price",
        subtotal: "Subtotal",
        orderSummary: "Order Summary",
        shippingFee: "Shipping",
        serviceFee: "Service Fee",
        discount: "Discount",
        thankYou: "Thank You!",
        orderReceivedNotice: "Your order has been confirmed and is being processed.",
        downloadInvoice: "Download Invoice",
        preparingPdf: "Preparing PDF...",
        printInvoice: "Print Invoice",
        needHelp: "Need help? Contact our support team",
        emailUs: "Email Us",
        whatsapp: "WhatsApp",
        source: "Shipment",
        trackingNumber: "Tracking Number",
        courier: "Courier",
        itemsCount: (count) => `${count} item${count > 1 ? "s" : ""}`,
        waitingForTracking: "Waiting for tracking update",
        trackingNotSet: "Pending seller assignment",
        orderTrackingUnavailable: "Order tracking unavailable",
        noItems: "No items found in this order.",
        noShipmentYet: "No shipment details available yet.",
      };

  if (isLoading) return <LoadingState />;
  if (error || !tracking) return <ErrorState error={error} Link={Link} T={T} />;

  return (
    <div className="tpord2026-page" data-public-order-tracking-2026="true">
      <div className="tpord2026-topline">
        <Link to="/"><ArrowLeft aria-hidden="true" /> {T.backToHome}</Link>
        <span>{T.orderDate} {tracking.createdAtLabel}</span>
      </div>

      <section className="tpord2026-hero">
        <div className="tpord2026-hero__main">
          <div className="tpord2026-title">
            <h1>{T.orderNumber}{tracking.reference}</h1>
            <StatusPill status={tracking.status} />
          </div>
          <p>{tracking.status.description}</p>
          <div className="tpord2026-facts">
            <div>
              <WalletCards aria-hidden="true" />
              <span>
                <small>{T.paymentMethod}</small>
                <strong>{tracking.payment.method}</strong>
              </span>
            </div>
            <div>
              <Check aria-hidden="true" />
              <span>
                <small>{T.paymentStatus}</small>
                <strong>{tracking.payment.label}</strong>
              </span>
            </div>
            <div>
              <Truck aria-hidden="true" />
              <span>
                <small>{T.shipmentStatus}</small>
                <strong>{tracking.shipment.countLabel}</strong>
              </span>
            </div>
            <div>
              <Package aria-hidden="true" />
              <span>
                <small>{T.totalAmount}</small>
                <strong>{tracking.totals.totalLabel}</strong>
              </span>
            </div>
          </div>
        </div>
        <aside>
          <ShieldCheck aria-hidden="true" />
          <strong>{T.weWillKeepYouUpdated}</strong>
          <span>{T.keepThisPage}</span>
        </aside>
      </section>

      <div className="tpord2026-layout">
        <main>
          <Progress steps={tracking.progress} status={tracking.status} T={T} />

          <section className="tpord2026-card">
            <header>
              <span className="tpord2026-card-icon" aria-hidden="true"><Truck /></span>
              <div>
                <h2>{T.storeShipments(tracking.shipments.length)}</h2>
              </div>
            </header>
            <div className="tpord2026-shipment-list">
              {tracking.shipments.length ? (
                tracking.shipments.map((shipment) => (
                  <ShipmentCard shipment={shipment} key={shipment.id} T={T} />
                ))
              ) : (
                <p className="tpord2026-empty">{T.noShipmentYet}</p>
              )}
            </div>
          </section>

          <ItemsTable items={tracking.items} T={T} />
        </main>

        <aside className="tpord2026-side">
          <section className="tpord2026-card">
            <header>
              <span className="tpord2026-card-icon" aria-hidden="true"><Truck /></span>
              <h2>{T.shippingInformation}</h2>
            </header>
            <dl className="tpord2026-details">
              <div><dt>{T.shippingStatus}</dt><dd>{tracking.shipment.label}</dd></div>
              <div><dt>{T.courier}</dt><dd>{tracking.shipment.trackingNumber}</dd></div>
            </dl>
          </section>

          <section className="tpord2026-card">
            <header>
              <span className="tpord2026-card-icon" aria-hidden="true"><MapPin /></span>
              <h2>{T.deliveryAddress}</h2>
            </header>
            <div className="tpord2026-address">
              <strong>{tracking.customer.name}</strong>
              {tracking.customer.phone ? <span>{tracking.customer.phone}</span> : null}
              {tracking.customer.email ? <span>{tracking.customer.email}</span> : null}
              <p>{tracking.customer.address}</p>
            </div>
          </section>

          <section className="tpord2026-card">
            <header>
              <span className="tpord2026-card-icon" aria-hidden="true"><WalletCards /></span>
              <h2>{T.paymentInformation}</h2>
            </header>
            <dl className="tpord2026-details">
              <div><dt>{T.status}</dt><dd><StatusPill status={tracking.payment} /></dd></div>
              <div><dt>{T.method}</dt><dd>{tracking.payment.method}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      <section className="tpord2026-card tpord2026-summary">
        <header>
          <span className="tpord2026-card-icon" aria-hidden="true"><WalletCards /></span>
          <h2>{T.orderSummary}</h2>
        </header>
        <dl>
          <div><dt>{T.paymentMethod}</dt><dd>{tracking.payment.method}</dd></div>
          <div><dt>{T.shippingFee}</dt><dd>{tracking.totals.shippingLabel}</dd></div>
          <div><dt>{T.serviceFee}</dt><dd>{tracking.totals.serviceFeeLabel}</dd></div>
          <div><dt>{T.discount}</dt><dd>{tracking.totals.discountLabel}</dd></div>
          <div className="tpord2026-summary__total">
            <dt>{T.totalAmount}</dt>
            <dd>{tracking.totals.totalLabel}</dd>
          </div>
        </dl>
        {downloadError ? <p className="tpord2026-error">{downloadError}</p> : null}
        <div className="tpord2026-summary__footer">
          <p>
            <ShieldCheck aria-hidden="true" />
            <span>
              <strong>{T.thankYou}</strong>
              {T.orderReceivedNotice}
            </span>
          </p>
          <div className="tpord2026-action-buttons">
            <button
              type="button"
              className="tpord2026-outline-btn"
              onClick={onDownloadInvoice}
              disabled={isDownloading}
            >
              <Download aria-hidden="true" />
              {isDownloading ? T.preparingPdf : T.downloadInvoice}
            </button>
            <button
              type="button"
              className="tpord2026-primary-btn"
              onClick={onPrintInvoice}
            >
              <Printer aria-hidden="true" />
              {T.printInvoice}
            </button>
          </div>
        </div>
      </section>

      <footer className="tpord2026-help">
        <span>{T.needHelp}</span>
        <div>
          <button type="button" onClick={onEmailSupport}><Mail aria-hidden="true" /> {T.emailUs}</button>
          <button type="button" onClick={onWhatsAppSupport}><CircleHelp aria-hidden="true" /> {T.whatsapp}</button>
        </div>
      </footer>
    </div>
  );
}
