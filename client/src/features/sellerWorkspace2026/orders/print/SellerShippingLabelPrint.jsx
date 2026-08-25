import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import useStoreBranding from "../../../../hooks/useStoreBranding.js";
import { getWorkspaceLogoUrl } from "../../../../lib/branding.js";
import "./SellerShippingLabelPrint.css";

const text = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const clip = (value, max = 90) => {
  const normalized = text(value);
  return normalized.length > max ? `${normalized.slice(0, max - 3)}...` : normalized;
};

function PlatformLogo({ logoSrc, name }) {
  return (
    <div className="slabel-brand">
      <img src={logoSrc} alt={name} />
      <div>
        <strong>TP PRENEURS</strong>
        <span>RUANG KERJA PENJUAL</span>
      </div>
    </div>
  );
}

function CourierLogo({ courier }) {
  return (
    <div className="slabel-courier">
      {courier?.logoUrl ? <img src={courier.logoUrl} alt={courier.name} /> : null}
      <strong>{text(courier?.logoText, "TP")}</strong>
      <span>{text(courier?.name, "Courier")}</span>
    </div>
  );
}

export default function SellerShippingLabelPrint({ label, printToken, onReady }) {
  const barcodeRef = useRef(null);
  const readyTokenRef = useRef(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const { branding } = useStoreBranding({ enabled: Boolean(label) });
  const logoSrc = useMemo(
    () => getWorkspaceLogoUrl("seller", branding?.sellerLogoUrl),
    [branding?.sellerLogoUrl]
  );

  useEffect(() => {
    readyTokenRef.current = null;
    setQrDataUrl("");
  }, [printToken]);

  useEffect(() => {
    if (!label || !barcodeRef.current) return;

    try {
      JsBarcode(barcodeRef.current, text(label.shipment?.barcodeValue, label.order?.suborderNumber), {
        format: "CODE128",
        displayValue: false,
        margin: 0,
        height: 76,
        width: 2,
      });
    } catch {
      barcodeRef.current.textContent = "";
    }

    let cancelled = false;
    QRCode.toDataURL(text(label.shipment?.qrValue, label.order?.suborderNumber), {
      margin: 0,
      width: 116,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });

    return () => {
      cancelled = true;
    };
  }, [label, printToken]);

  useEffect(() => {
    if (!label || !printToken || readyTokenRef.current === printToken) return;
    if (!barcodeRef.current) return;
    if (!qrDataUrl) return;
    readyTokenRef.current = printToken;
    onReady?.();
  }, [label, onReady, printToken, qrDataUrl]);

  if (!label) return null;

  const destinationCity = text(label.recipient?.city, "KOTA TUJUAN").toUpperCase();
  const destinationDistrict = text(label.recipient?.district, "KECAMATAN").toUpperCase();
  const serviceLabel = text(label.serviceLabel, "STANDARD").toUpperCase();
  const cashLabel = label.order?.cod ? "COD" : "CASHLESS";

  const content = (
    <div className="seller-shipping-label-root" aria-hidden="true">
      <section className="slabel-page">
        <header className="slabel-top">
          <PlatformLogo logoSrc={logoSrc} name={label.platform?.name || "TP PRENEURS"} />
          <div className="slabel-service">{serviceLabel}</div>
          <CourierLogo courier={label.courier} />
        </header>

        <div className="slabel-row slabel-row--split">
          <div>
            <span>No. Pesanan:</span>
            <strong>{text(label.order?.orderNumber, "-")}</strong>
          </div>
          <div>
            <span>Kode Pengambilan:</span>
            <strong>{text(label.shipment?.pickupCode, "-")}</strong>
          </div>
        </div>

        <div className="slabel-barcode">
          <svg ref={barcodeRef} />
          <strong>{text(label.shipment?.barcodeValue, label.order?.suborderNumber)}</strong>
        </div>

        <div className="slabel-parties">
          <div>
            <h3>Penerima: {clip(label.recipient?.name, 32)}</h3>
            <p>{clip(label.recipient?.address, 168)}</p>
            <p>{text(label.recipient?.phone)}</p>
          </div>
          <div>
            <h3>Pengirim: {clip(label.sender?.name, 34)}</h3>
            <p>{clip(label.sender?.address, 138)}</p>
            <p>{text(label.sender?.phone)}</p>
          </div>
        </div>

        <div className="slabel-destination">
          <strong>{destinationCity}</strong>
          <strong>{destinationDistrict}</strong>
        </div>

        <div className="slabel-payment">
          <strong>{cashLabel}</strong>
          <span>Penjual tidak perlu bayar ongkir ke Kurir</span>
        </div>

        <div className="slabel-meta">
          <div>
            <p><b>Berat:</b> {text(label.package?.weightLabel, "-")}</p>
            <p><b>Batas Kirim:</b> {formatDate(label.shipment?.estimatedDelivery)}</p>
            <p><b>No. Pesanan:</b> {text(label.order?.orderNumber, "-")}</p>
          </div>
          <div>
            <p><b>COD Cek Dulu:</b> Tidak</p>
            <p><b>COD:</b> {label.order?.cod ? "Ya" : "Tidak"}</p>
          </div>
          <div className="slabel-qr">
            {qrDataUrl ? <img src={qrDataUrl} alt="" /> : null}
          </div>
        </div>

        <table className="slabel-items">
          <thead>
            <tr>
              <th>#</th>
              <th>Nama Produk</th>
              <th>SKU</th>
              <th>Variasi</th>
              <th>Qty</th>
            </tr>
          </thead>
          <tbody>
            {(label.items || []).slice(0, 6).map((item, index) => (
              <tr key={item.id || index}>
                <td>{index + 1}</td>
                <td>{clip(item.productName, 72)}</td>
                <td>{clip(item.sku || "-", 24)}</td>
                <td>{clip(item.variantLabel || "-", 24)}</td>
                <td>{item.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {label.meta?.hasNonPhysicalItems ? (
          <p className="slabel-note">
            Catatan: label ini hanya mencetak item Physical dari subpesanan ini.
          </p>
        ) : null}
      </section>
    </div>
  );

  return createPortal(content, document.body);
}
