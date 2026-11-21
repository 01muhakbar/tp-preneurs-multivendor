import sendEmail from "../utils/email.js";
import { formatCompactOrderNumber } from "./notification.service.js";

export interface OrderDeliveredEmailPayload {
  recipientEmail: string;
  recipientName: string;
  orderNumber: string;
  orderId?: number | null;
  createdAt?: Date | string | null;
  rawInvoiceNo?: string | null;
  storeName?: string;
  totalAmount?: number;
  deliveryDate?: Date | string;
  courierName?: string;
  trackingNumber?: string;
  returnWindowDays?: number;
  storeReturnDays?: number;
}

const formatRupiah = (val?: number) =>
  val && Number.isFinite(val)
    ? `Rp ${Math.round(val).toLocaleString("id-ID")}`
    : "";

export const sendOrderDeliveredEmail = async (
  payload: OrderDeliveredEmailPayload
): Promise<boolean> => {
  const {
    recipientEmail,
    recipientName,
    orderNumber,
    orderId,
    createdAt,
    rawInvoiceNo,
    storeName = "TP Preneurs Store",
    totalAmount,
    deliveryDate = new Date(),
    courierName = "Kurir Pengiriman",
    trackingNumber = "-",
    returnWindowDays = 7,
    storeReturnDays = 2,
  } = payload;

  const canonicalOrderNumber = formatCompactOrderNumber(
    orderNumber || rawInvoiceNo,
    orderId,
    createdAt || deliveryDate
  );

  const cleanStoreName = String(storeName || "").trim() || "TP Preneurs Store";

  if (!recipientEmail || !recipientEmail.includes("@")) {
    console.warn(
      `[orderDeliveredEmail] Skipping email: invalid recipient "${recipientEmail}" for order ${canonicalOrderNumber}`
    );
    return false;
  }

  const orderUrl = `https://tppreneurs.com/user/my-orders/${encodeURIComponent(canonicalOrderNumber)}`;
  const returnUrl = `https://tppreneurs.com/user/my-orders/${encodeURIComponent(canonicalOrderNumber)}?action=return`;
  const trackingUrl = `https://tppreneurs.com/order/tracking/${encodeURIComponent(canonicalOrderNumber)}`;

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(deliveryDate));

  const totalDisplay = formatRupiah(totalAmount);

  const subject = `[TP Preneurs] Pesanan Anda Telah Tiba! - ${canonicalOrderNumber}`;

  const textBody = `Halo ${recipientName},

Pesanan Anda dengan nomor ${canonicalOrderNumber} dari toko ${cleanStoreName} telah berhasil tiba di alamat tujuan pada ${formattedDate}.

Detail Pengiriman:
- Kurir: ${courierName}
- No. Resi: ${trackingNumber}
${totalDisplay ? `- Total Belanja: ${totalDisplay}\n` : ""}

Silakan periksa pesanan Anda sekarang:
1. Konfirmasi Pesanan Diterima: ${orderUrl}
2. Ajukan Pengembalian Barang & Dana: ${returnUrl}

INFORMASI PENTING PENGEMBALIAN BARANG DAN DANA:
- Batas waktu pengajuan pengembalian barang dan dana adalah maksimal ${returnWindowDays} hari (dan ${storeReturnDays} hari untuk penjual produk segar/tertentu) setelah pesanan tiba melalui aplikasi TP Preneurs pada halaman Rincian Pesanan.
- Catatan: Pengembalian barang dan dana tidak bisa diajukan jika melewati batas waktu yang telah ditentukan.
- Jika Anda tidak melakukan konfirmasi atau pengajuan pengembalian dalam waktu ${returnWindowDays} hari, sistem secara otomatis akan menganggap pesanan telah diterima dengan baik dan menyelesaikan transaksi.

Lacak Pesanan: ${trackingUrl}

Salam hangat,
Tim TP Preneurs`;

  const htmlBody = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pesanan Anda Telah Tiba</title>
  <style>
    body { margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; }
    .email-container { max-width: 600px; margin: 24px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #034c85 0%, #02335a 100%); padding: 32px 28px; text-align: center; }
    .brand-title { color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: 0.5px; }
    .brand-accent { color: #fe6f05; }
    .brand-badge { display: inline-block; background-color: rgba(254, 111, 5, 0.18); color: #fe6f05; border: 1px solid #fe6f05; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 10px; }
    .email-body { padding: 32px 28px; }
    .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
    .hero-card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .hero-title { font-size: 15px; font-weight: 700; color: #034c85; margin: 0 0 10px 0; display: flex; align-items: center; }
    .order-meta-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .order-meta-table td { padding: 6px 0; vertical-align: top; }
    .meta-label { color: #64748b; width: 38%; }
    .meta-val { color: #0f172a; font-weight: 600; }
    .btn-group { margin: 26px 0 20px 0; text-align: center; }
    .btn-primary { display: inline-block; background-color: #034c85; color: #ffffff !important; text-decoration: none; padding: 13px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 6px; box-shadow: 0 2px 8px rgba(3, 76, 133, 0.25); }
    .btn-secondary { display: inline-block; background-color: #ffffff; color: #fe6f05 !important; border: 2px solid #fe6f05; text-decoration: none; padding: 11px 24px; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 6px; }
    .policy-box { background: #fff7ed; border-left: 4px solid #fe6f05; border-radius: 8px; padding: 16px; margin: 24px 0; font-size: 13px; line-height: 1.6; color: #7c2d12; }
    .policy-title { font-weight: 700; font-size: 14px; color: #c2410c; margin-bottom: 6px; }
    .warning-text { margin-top: 8px; font-weight: 700; color: #9a3412; }
    .auto-release-notice { font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e2e8f0; }
    .email-footer { background-color: #f8fafc; padding: 20px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="brand-title">TP <span class="brand-accent">PRENEURS</span></div>
      <div class="brand-badge">Pesanan Tiba di Tujuan</div>
    </div>
    <div class="email-body">
      <div class="greeting">Halo, ${recipientName}! 👋</div>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-top: 0;">
        Kabar gembira! Pesanan Anda dari toko <strong>${cleanStoreName}</strong> telah berhasil tiba di alamat tujuan Anda.
      </p>

      <div class="hero-card">
        <div class="hero-title">📦 Rincian Pengiriman Pesanan</div>
        <table class="order-meta-table">
          <tr>
            <td class="meta-label">Nomor Pesanan</td>
            <td class="meta-val">${canonicalOrderNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">Toko Penjual</td>
            <td class="meta-val">${cleanStoreName}</td>
          </tr>
          <tr>
            <td class="meta-label">Kurir & Layanan</td>
            <td class="meta-val">${courierName}</td>
          </tr>
          <tr>
            <td class="meta-label">Nomor Resi</td>
            <td class="meta-val">${trackingNumber}</td>
          </tr>
          <tr>
            <td class="meta-label">Waktu Tiba</td>
            <td class="meta-val">${formattedDate}</td>
          </tr>
          ${totalDisplay ? `
          <tr>
            <td class="meta-label">Total Pembayaran</td>
            <td class="meta-val" style="color: #034c85; font-size: 15px;">${totalDisplay}</td>
          </tr>` : ""}
        </table>
      </div>

      <p style="font-size: 14px; line-height: 1.6; color: #334155;">
        Silakan periksa kondisi fisik paket dan kelengkapan produk Anda. Setelah memeriksa barang, pilih langkah berikut:
      </p>

      <div class="btn-group">
        <a href="${orderUrl}" class="btn-primary" target="_blank">✓ Konfirmasi Pesanan Diterima</a>
        <a href="${returnUrl}" class="btn-secondary" target="_blank">Ajukan Pengembalian</a>
      </div>

      <div class="policy-box">
        <div class="policy-title">🛡️ Informasi Kebijakan Pengembalian Barang & Dana</div>
        <div>
          Pengajuan pengembalian barang dan dana maksimal <strong>${returnWindowDays} hari</strong> (dan <strong>${storeReturnDays} hari</strong> untuk penjual produk segar/tertentu) setelah pesanan tiba melalui aplikasi TP Preneurs pada halaman Rincian Pesanan.
        </div>
        <div class="warning-text">
          ⚠️ Catatan: Pengembalian barang dan dana tidak bisa diajukan jika melewati batas waktu yang telah ditentukan.
        </div>
      </div>

      <div class="auto-release-notice">
        ℹ️ <strong>Ketentuan Penyelesaian Otomatis:</strong><br>
        Jika Anda tidak mengonfirmasi penerimaan atau mengajukan pengembalian dalam waktu <strong>${returnWindowDays} hari</strong> sejak pesanan tiba, sistem secara otomatis menganggap bahwa pesanan telah diterima dengan baik oleh Anda, dan dana transaksi akan otomatis diteruskan ke Saldo Tersedia penjual.
      </div>
    </div>
    <div class="email-footer">
      <p style="margin: 0 0 6px 0;">Email ini dikirim otomatis oleh sistem TP Preneurs Multi-Vendor Marketplace.</p>
      <p style="margin: 0;">Butuh bantuan? Kunjungi <a href="https://tppreneurs.com/contact-us" style="color: #034c85; text-decoration: none;">Pusat Bantuan TP Preneurs</a>.</p>
    </div>
  </div>
</body>
</html>`;

  try {
    await sendEmail({
      email: recipientEmail,
      subject,
      text: textBody,
      html: htmlBody,
    });
    console.log(
      `[orderDeliveredEmail] Successfully dispatched delivery email for order ${orderNumber} to ${recipientEmail}`
    );
    return true;
  } catch (error: any) {
    console.error(
      `[orderDeliveredEmail] Failed to send delivery email for order ${orderNumber} to ${recipientEmail}:`,
      error?.message || error
    );
    return false;
  }
};
