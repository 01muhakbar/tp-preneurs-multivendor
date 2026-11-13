import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { FileText, ChevronRight, Clock, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { getStoreCustomization } from "../../api/public/storeCustomizationPublic.ts";
import { UiEmptyState, UiErrorState } from "../../components/primitives/state/index.js";
import { sanitizeRichTextHtml } from "../../utils/sanitizeRichTextHtml.js";

const DEFAULT_LANG = "en";

// Official TP Preneurs Legal Templates
const TP_TEMPLATES_TERMS = {
  en: [
    "<h2>TP Preneurs Terms & Conditions of Service</h2>",
    "<p>Welcome to <strong>TP Preneurs</strong> (<strong>tppreneurs.com</strong>). Please review these Terms and Conditions carefully. By registering, browsing, or purchasing on TP Preneurs, you acknowledge that you have read, understood, and agreed to be bound by these platform terms.</p>",
    "<h3>1. Definitions & Platform Scope</h3>",
    "<ul>",
    "<li><strong>TP Preneurs:</strong> A multi-vendor digital marketplace designed to empower campus edupreneurs, student innovators, and verified businesses in showcasing and commercializing authentic products.</li>",
    "<li><strong>User:</strong> Any individual or entity accessing the platform, acting either as a Buyer or a Vendor/Seller.</li>",
    "<li><strong>Vendor/Seller:</strong> Verified campus students, faculty innovators, or affiliated business incubators authorized to operate storefronts.</li>",
    "<li><strong>Product:</strong> Physical merchandise, campus innovations, crafts, or digital goods (study modules, e-books, licensed creative assets).</li>",
    "</ul>",
    "<h3>2. Account Registration & Security</h3>",
    "<ol>",
    "<li>Users must supply accurate, complete, and verifiable details during account creation.</li>",
    "<li>You hold full responsibility for safeguarding your password credentials and for all actions performed under your account.</li>",
    "<li>TP Preneurs reserves the right to suspend accounts or revoke store privileges if fraudulent activity or policy violations are detected.</li>",
    "</ol>",
    "<h3>3. Orders, Pricing & Payment</h3>",
    "<ol>",
    "<li>All item prices are listed transparently in Indonesian Rupiah (IDR) prior to checkout confirmation.</li>",
    "<li>Buyers are expected to review product specifications, delivery fees, and terms prior to completing payment.</li>",
    "<li>Payments must be cleared through official payment channels (Licensed Payment Gateway or TP Preneurs Official Accounts). TP Preneurs assumes no liability for settlements made outside the platform.</li>",
    "<li>Orders are dispatched to vendors upon successful automated or audited payment clearance.</li>",
    "</ol>",
    "<h3>4. Shipping & Delivery Terms</h3>",
    "<ol>",
    "<li><strong>Physical Items:</strong> Sellers must securely pack products and transfer consignments to selected logistics carriers within platform deadlines.</li>",
    "<li><strong>Digital Downloads:</strong> Access to licensed learning media or digital assets is unlocked immediately upon order status confirmation.</li>",
    "<li>Vendors must provide valid courier tracking waybills to facilitate real-time delivery status updates.</li>",
    "</ol>",
    "<h3>5. Intellectual Property & Originality</h3>",
    "<ol>",
    "<li>Sellers warrant that all listed creations, designs, courseware, and photography are original works or backed by legitimate commercial licenses.</li>",
    "<li>Selling counterfeit items, pirated media, or material infringing on third-party trademarks/copyrights is strictly prohibited.</li>",
    "<li>All TP Preneurs brand identity assets, logos, interfaces, and proprietary code remain the exclusive property of TP Preneurs.</li>",
    "</ol>",
    "<h3>6. Cancellation, Return & Refund Policy</h3>",
    "<ol>",
    "<li>Buyers may cancel orders prior to vendor dispatch processing.</li>",
    "<li>Return claims for damaged or incorrect physical products must be submitted with an <strong>uninterrupted unboxing video recording</strong> within 48 hours of carrier delivery confirmation.</li>",
    "<li>Approved claims will be resolved through product replacement or refund to the buyer's original payment method.</li>",
    "<li>Digital downloads are non-refundable once accessed, except in cases of persistent file corruption verified by support.</li>",
    "</ol>",
    "<h3>7. Prohibited Conduct & Dispute Resolution</h3>",
    "<p>Users shall not utilize TP Preneurs for prohibited commercial items, fraudulent transactions, or system abuse. Disagreements between buyers and sellers are mediated internally in accordance with the laws of the Republic of Indonesia.</p>",
  ].join(""),
  id: [
    "<h2>Syarat & Ketentuan Layanan TP Preneurs</h2>",
    "<p>Selamat datang di <strong>TP Preneurs</strong> (<strong>tppreneurs.com</strong>). Harap membaca Syarat & Ketentuan ini dengan saksama. Dengan mendaftar, mengakses, atau bertransaksi di platform TP Preneurs, Anda menyatakan telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum di bawah ini.</p>",
    "<h3>1. Definisi & Peran Platform</h3>",
    "<ul>",
    "<li><strong>TP Preneurs:</strong> Platform pasar daring (marketplace multi-vendor) yang memfasilitasi temu-bisnis, promosi, dan transaksi produk edukasi, karya inovasi mahasiswa, serta komoditas UMKM kampus.</li>",
    "<li><strong>Pengguna:</strong> Seluruh pihak yang mengakses dan memanfaatkan layanan TP Preneurs, baik sebagai Pembeli (Buyer) maupun Penjual (Seller/Vendor).</li>",
    "<li><strong>Penjual/Vendor:</strong> Mahasiswa, dosen, inkubator bisnis, atau civitas akademika yang telah terverifikasi untuk membuka etalase toko dan menjual produk.</li>",
    "<li><strong>Produk:</strong> Barang fisik (kerajinan, merchandise, olahan pangan terdaftar, prototipe) atau produk digital (modul belajar, buku elektronik, aset desain, karya terlisensi).</li>",
    "</ul>",
    "<h3>2. Pendaftaran Akun & Keamanan Kredensial</h3>",
    "<ol>",
    "<li>Pengguna wajib memberikan data yang jujur, akurat, dan terkini saat membuat akun di TP Preneurs.</li>",
    "<li>Pengguna bertanggung jawab penuh atas kerahasiaan kata sandi dan seluruh aktivitas yang terjadi di bawah akun terdaftarnya.</li>",
    "<li>TP Preneurs berhak menolak pendaftaran, menonaktifkan fitur toko, atau membekukan akun yang terindikasi memberikan data palsu atau melakukan tindakan yang merugikan ekosistem platform.</li>",
    "</ol>",
    "<h3>3. Transaksi, Harga & Pembayaran</h3>",
    "<ol>",
    "<li>Semua harga produk tertera dalam mata uang Rupiah (IDR) secara transparan sebelum proses checkout dilakukan.</li>",
    "<li>Pembeli wajib meneliti deskripsi, spesifikasi, dan estimasi biaya pengiriman sebelum melakukan konfirmasi pembelian.</li>",
    "<li>Pembayaran wajib diselesaikan melalui saluran resmi (Payment Gateway / Rekening Resmi TP Preneurs) sesuai instruksi invoice. TP Preneurs tidak bertanggung jawab atas transaksi di luar sistem resmi.</li>",
    "<li>Pesanan akan diteruskan kepada penjual setelah pembayaran diverifikasi oleh sistem.</li>",
    "</ol>",
    "<h3>4. Pengiriman & Pemenuhan Pesanan</h3>",
    "<ol>",
    "<li><strong>Produk Fisik:</strong> Penjual wajib mengemas produk dengan standar aman dan menyerahkan paket ke pihak ekspedisi yang dipilih pembeli selambat-lambatnya dalam batas waktu yang ditentukan sistem.</li>",
    "<li><strong>Produk Digital:</strong> Akses unduh atau lisensi modul digital akan aktif secara instan pada menu dashboard akun pembeli setelah status pesanan terkonfirmasi selesai.</li>",
    "<li>Nomor resi pengiriman yang sah wajib diinput oleh penjual untuk memungkinkan pelacakan pesanan secara real-time.</li>",
    "</ol>",
    "<h3>5. Hak Kekayaan Intelektual (HAKI) & Orisinalitas Produk</h3>",
    "<ol>",
    "<li>Penjual menjamin bahwa seluruh karya inovasi, modul, desain, dan foto produk yang dipajang adalah karya orisinal atau memiliki hak lisensi komersial yang sah.</li>",
    "<li>Dilarang keras menjual barang bajakan, plagiat karya orang lain, atau materi yang melanggar hak cipta, merek, atau paten pihak ketiga.</li>",
    "<li>Seluruh logo, merek dagang, desain antarmuka, dan kode sumber platform TP Preneurs adalah kekayaan intelektual milik TP Preneurs dan dilindungi oleh undang-undang.</li>",
    "</ol>",
    "<h3>6. Kebijakan Pembatalan, Retur & Pengembalian Dana (Refund)</h3>",
    "<ol>",
    "<li>Pembeli dapat membatalkan pesanan selama penjual belum memproses atau mengirimkan barang.</li>",
    "<li>Pengajuan komplain atau retur barang fisik wajib menyertakan <strong>bukti rekaman video unboxing utuh tanpa jeda</strong> maksimal 2x24 jam sejak paket berstatus diterima menurut kurir.</li>",
    "<li>Komplain yang disetujui akibat kerusakan barang, cacat produksi, atau ketidaksesuaian varian akan diselesaikan melalui penggantian barang atau pengembalian dana (refund) melalui dompet/rekening pembeli.</li>",
    "<li>Produk digital yang telah diunduh tidak dapat dibatalkan atau direfund, kecuali terdapat kerusakan file yang tidak dapat diperbaiki oleh penjual.</li>",
    "</ol>",
    "<h3>7. Larangan Penggunaan & Penyelesaian Sengketa</h3>",
    "<p>Pengguna dilarang keras melakukan transaksi fiktif, ulasan palsu, atau penyalahgunaan platform. Perselisihan antara pembeli dan penjual difasilitasi melalui musyawarah internal dan tunduk pada yurisdiksi hukum Negara Republik Indonesia.</p>",
  ].join(""),
};

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const toBool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
};

const normalizeTerms = (raw, lang = DEFAULT_LANG) => {
  const isId = String(lang || "").toLowerCase().startsWith("id");
  const source = raw && typeof raw === "object" ? raw : {};
  const defaultTitle = isId ? "Syarat & Ketentuan" : "Terms & Conditions";
  const defaultHtml = isId ? TP_TEMPLATES_TERMS.id : TP_TEMPLATES_TERMS.en;

  return {
    enabled: toBool(source.enabled, true),
    pageHeaderBackgroundDataUrl: toText(
      source.pageHeaderBackgroundDataUrl ?? source.backgroundImageDataUrl ?? source.backgroundImage,
      ""
    ),
    pageTitle: toText(source.pageTitle, defaultTitle),
    pageTextHtml: toText(
      source.pageTextHtml ?? source.pageText ?? source.contentHtml ?? source.content ?? "",
      defaultHtml
    ),
  };
};

function TermsPageSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-6 w-36 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="h-44 animate-pulse rounded-3xl bg-slate-200 dark:bg-slate-800 sm:h-52" />
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="h-6 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
        <div className="h-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}

export default function StoreTermsAndConditionsPage() {
  const { i18n } = useTranslation();
  const lang = String(i18n?.language || DEFAULT_LANG).toLowerCase().startsWith("id") ? "id" : "en";
  const isId = lang === "id";

  const termsQuery = useQuery({
    queryKey: ["store-customization", "terms-and-conditions", lang],
    queryFn: () => getStoreCustomization({ lang, include: "policy" }),
    staleTime: 60_000,
  });

  // Safely extract from either data envelope format
  const customization =
    termsQuery.data?.data?.customization ||
    termsQuery.data?.customization ||
    termsQuery.data;
  const pageRaw = customization?.termsAndConditions;
  const page = useMemo(() => normalizeTerms(pageRaw, lang), [pageRaw, lang]);
  const safeHtml = useMemo(() => sanitizeRichTextHtml(page.pageTextHtml), [page.pageTextHtml]);

  if (termsQuery.isLoading) return <TermsPageSkeleton />;

  if (termsQuery.isError) {
    const errorMessage =
      termsQuery.error?.response?.data?.message ||
      termsQuery.error?.message ||
      (isId ? "Gagal memuat syarat & ketentuan." : "Failed to load terms and conditions.");
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <UiErrorState
          title={isId ? "Gagal Memuat Syarat & Ketentuan" : "Failed to load Terms & Conditions"}
          message={errorMessage}
          onRetry={() => termsQuery.refetch()}
        />
      </div>
    );
  }

  if (!page.enabled) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <UiEmptyState
          title={isId ? "Halaman Sedang Dinonaktifkan" : "This page is disabled."}
          description={
            isId
              ? "Syarat & ketentuan saat ini sedang tidak dapat diakses."
              : "Terms & conditions is currently disabled."
          }
        />
      </div>
    );
  }

  const hasBackground = Boolean(page.pageHeaderBackgroundDataUrl);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 dark:bg-slate-950">
      <div className="mx-auto max-w-5xl space-y-6 px-4 pt-6 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Link to="/" className="transition hover:text-[#034c85] dark:hover:text-sky-400">
            {isId ? "Beranda" : "Home"}
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {page.pageTitle}
          </span>
        </nav>

        {/* Hero Header Banner */}
        <header
          className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-[#034c85] via-[#02335a] to-slate-950 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14 dark:border-slate-800"
          style={
            hasBackground
              ? {
                  backgroundImage: `linear-gradient(rgba(3, 76, 133, 0.88), rgba(2, 51, 90, 0.94)), url(${page.pageHeaderBackgroundDataUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        >
          {/* Subtle Accent Glow */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#fe6f05]/15 blur-3xl" />

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300 backdrop-blur-sm">
              <FileText className="h-3.5 w-3.5 text-[#fe6f05]" />
              <span>TP PRENEURS TERMS</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight sm:text-4xl text-white">
              {page.pageTitle}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-2xl">
              {isId
                ? "Ketentuan operasional, standar transaksi, hak kekayaan intelektual, serta hak & kewajiban pengguna dalam ekosistem TP Preneurs."
                : "Operational terms, transaction standards, intellectual property rules, and mutual user obligations across TP Preneurs."}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-300">
              <div className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-[#fe6f05]" />
                <span>{isId ? "Status: Ketentuan Resmi Berlaku" : "Status: Official Active Terms"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Legal Text Content Card */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
          <div
            className="prose prose-slate max-w-none text-sm sm:text-base leading-relaxed dark:prose-invert
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[#034c85] dark:prose-headings:text-sky-300
              prose-h2:text-xl sm:prose-h2:text-2xl prose-h2:border-b prose-h2:border-slate-100 dark:prose-h2:border-slate-800 prose-h2:pb-3
              prose-h3:text-base sm:prose-h3:text-lg prose-h3:text-slate-800 dark:prose-h3:text-slate-200 prose-h3:mt-6
              prose-p:text-slate-600 dark:prose-p:text-slate-300
              prose-li:text-slate-600 dark:prose-li:text-slate-300
              prose-strong:text-slate-900 dark:prose-strong:text-white
              prose-a:font-semibold prose-a:text-[#034c85] dark:prose-a:text-[#fe6f05] hover:prose-a:text-[#fe6f05] transition-colors"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />
        </section>

        {/* Customer Support Direct Contact Card */}
        <aside className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-100/70 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#034c85] text-white shadow-sm">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                {isId ? "Butuh Konsultasi Ketentuan Layanan?" : "Need Guidance on Terms & Policies?"}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isId
                  ? "Hubungi tim bantuan operasional kami untuk pertanyaan transaksi, perizinan toko, atau kemitraan."
                  : "Contact our operations team for transaction queries, store licensing, or campus partnerships."}
              </p>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-2.5">
            <a
              href="mailto:support@tppreneurs.com"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Mail className="h-3.5 w-3.5 text-[#034c85]" />
              <span>Email</span>
            </a>
            <a
              href="https://wa.me/628218866824"
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 sm:flex-initial items-center justify-center gap-1.5 rounded-lg bg-[#fe6f05] px-3.5 py-2 text-xs font-bold text-white shadow transition hover:bg-[#e05f00]"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
