import sendEmail from "../utils/email.js";
import { BugReportAttributes } from "../models/BugReport.js";

const BRAND_NAVY = "#034c85";
const BRAND_ACCENT = "#fe6f05";

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function resolveFullUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "https://tppreneurs.com";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `https://tppreneurs.com${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export async function sendBugReportAcknowledgementEmail(report: BugReportAttributes): Promise<boolean> {
  if (!report.reporterEmail) return false;

  const subject = `[Diterima] Laporan Kendala Anda di TP Preneurs (#${report.ticketNumber})`;
  const fullPageUrl = resolveFullUrl(report.pageUrl);

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Top Gradient Bar -->
    <tr>
      <td height="6" style="background: linear-gradient(90deg, ${BRAND_NAVY}, #38bdf8, ${BRAND_ACCENT});"></td>
    </tr>

    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px; text-align: left; border-bottom: 1px solid #f1f5f9;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: ${BRAND_NAVY}; letter-spacing: -0.5px;">
          TP PRENEURS <span style="font-size: 13px; font-weight: 600; color: #64748b; margin-left: 8px;">Dukungan Teknis</span>
        </h1>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 28px 32px;">
        <div style="display: inline-block; padding: 4px 12px; background-color: #e0f2fe; color: #0284c7; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-bottom: 16px;">
          Nomor Tiket: #${escapeHtml(report.ticketNumber)}
        </div>

        <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #0f172a;">
          Laporan Kendala Anda Telah Kami Terima
        </h2>

        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #475569;">
          Halo Rekan Preneur / Pengguna Setia TP Preneurs,
        </p>

        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
          Terima kasih telah melaporkan kendala teknis yang Anda alami. Bantuan Anda sangat berarti bagi kami untuk terus menjaga keandalan dan performa platform TP Preneurs.
        </p>

        <!-- Summary Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 16px;">
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600; width: 140px;">Halaman Terkendala:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-family: monospace; word-break: break-all;">
              <a href="${fullPageUrl}" target="_blank" style="color: ${BRAND_NAVY}; text-decoration: underline;">${escapeHtml(report.pageUrl)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">Jenis Kendala:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700;">${escapeHtml(report.errorName)}</td>
          </tr>
          ${report.userNote ? `
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">Catatan Anda:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #334155; font-style: italic;">"${escapeHtml(report.userNote)}"</td>
          </tr>
          ` : ""}
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">Status Saat Ini:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #0284c7; font-weight: 800;">Dalam Antrean Analisis Developer</td>
          </tr>
        </table>

        <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #475569;">
          Tim teknis kami sedang memeriksa penyebab kendala ini. Begitu perbaikan berhasil diterapkan ke sistem, kami akan secara otomatis mengirimkan pemberitahuan ke email ini.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
        <p style="margin: 0 0 6px;">Butuh bantuan mendesak? Hubungi kami di <strong>+62 821-8866-824</strong> atau balas email ini.</p>
        <p style="margin: 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} TP Preneurs. Semua Hak Dilindungi.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await sendEmail({
      email: report.reporterEmail,
      subject,
      text: `Laporan Kendala #${report.ticketNumber} telah kami terima untuk halaman: ${report.pageUrl}. Tim developer kami sedang menindaklanjuti.`,
      html,
    });
    return true;
  } catch (err) {
    console.warn(`[BugReportEmail] Failed to send acknowledgement email to ${report.reporterEmail}:`, err);
    return false;
  }
}

export async function sendBugReportResolvedEmail(report: BugReportAttributes): Promise<boolean> {
  if (!report.reporterEmail) return false;

  const subject = `[Terselesaikan] Laporan Kendala Anda di TP Preneurs telah Berhasil Diperbaiki (#${report.ticketNumber})`;
  const fullPageUrl = resolveFullUrl(report.pageUrl);

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
    <!-- Top Green Success Bar -->
    <tr>
      <td height="6" style="background: linear-gradient(90deg, #10b981, #059669, #38bdf8);"></td>
    </tr>

    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px 20px; text-align: left; border-bottom: 1px solid #f1f5f9;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; color: ${BRAND_NAVY}; letter-spacing: -0.5px;">
          TP PRENEURS <span style="font-size: 13px; font-weight: 600; color: #10b981; margin-left: 8px;">✓ Kendala Terselesaikan</span>
        </h1>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 28px 32px;">
        <div style="display: inline-block; padding: 5px 14px; background-color: #dcfce7; color: #15803d; border-radius: 9999px; font-size: 12px; font-weight: 800; margin-bottom: 16px;">
          ✓ STATUS: BERHASIL DIPERBAIKI (#${escapeHtml(report.ticketNumber)})
        </div>

        <h2 style="margin: 0 0 12px; font-size: 19px; font-weight: 800; color: #0f172a;">
          Kabar Baik! Kendala yang Anda Laporkan Telah Berhasil Diperbaiki
        </h2>

        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #475569;">
          Halo Rekan Preneur / Pengguna Setia TP Preneurs,
        </p>

        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #475569;">
          Kami ingin menginformasikan bahwa laporan kendala teknis yang Anda kirimkan telah ditindaklanjuti dan <strong>berhasil diperbaiki serta diuji</strong> oleh Tim Pengembang TP Preneurs.
        </p>

        <!-- Technical Resolution Box -->
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 18px; margin-bottom: 24px;">
          <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #15803d; margin-bottom: 8px;">
            Catatan Perbaikan dari Tim Teknis:
          </div>
          <div style="font-size: 14px; line-height: 1.6; color: #166534; font-weight: 500;">
            "${escapeHtml(report.resolutionNote || "Pembaruan komponen dan optimasi data telah berhasil dirilis ke sistem. Halaman kini dapat diakses kembali dengan normal.")}"
          </div>
        </div>

        <!-- Ticket Details -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; padding: 16px;">
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600; width: 140px;">Halaman:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-family: monospace; word-break: break-all;">
              <a href="${fullPageUrl}" target="_blank" style="color: ${BRAND_NAVY}; text-decoration: underline;">${escapeHtml(report.pageUrl)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">Jenis Error:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 700;">${escapeHtml(report.errorName)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 12px; color: #64748b; font-weight: 600;">Waktu Selesai:</td>
            <td style="padding: 6px 0; font-size: 13px; color: #0f172a;">${new Date(report.resolvedAt || Date.now()).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}</td>
          </tr>
        </table>

        <!-- Action CTA Button -->
        <div style="text-align: center; margin: 28px 0;">
          <a href="${fullPageUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; background-color: ${BRAND_NAVY}; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; border-radius: 10px; box-shadow: 0 4px 12px rgba(3, 76, 133, 0.25);">
            Kunjungi Halaman Kembali &rarr;
          </a>
        </div>

        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #64748b; text-align: center;">
          Silakan muat ulang (*refresh*) halaman Anda untuk memverifikasi. Jika masih ada kendala lain, jangan ragu untuk membalas email ini.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center;">
        <p style="margin: 0 0 6px;">Terima kasih atas kontribusi Anda dalam memajukan ekosistem <strong>TP Preneurs</strong>.</p>
        <p style="margin: 0; color: #94a3b8;">&copy; ${new Date().getFullYear()} TP Preneurs. Semua Hak Dilindungi.</p>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  try {
    await sendEmail({
      email: report.reporterEmail,
      subject,
      text: `Kendala #${report.ticketNumber} pada halaman ${report.pageUrl} telah berhasil diperbaiki. Catatan tim: ${report.resolutionNote || "Perbaikan telah diterapkan"}. Silakan kunjungi: ${fullPageUrl}`,
      html,
    });
    return true;
  } catch (err) {
    console.error(`[BugReportEmail] Failed to send resolution email to ${report.reporterEmail}:`, err);
    return false;
  }
}
