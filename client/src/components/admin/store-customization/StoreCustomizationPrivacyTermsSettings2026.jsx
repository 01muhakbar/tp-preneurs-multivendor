import { useState, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  FileText,
  Upload,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  RotateCcw,
  RotateCw,
  Sparkles,
  Monitor,
  Smartphone,
  Eye,
  Save,
  Rocket,
  CheckCircle2,
  ExternalLink,
  Heading2,
  Heading3,
} from "lucide-react";
import StoreCustomizationTabNav2026 from "./StoreCustomizationTabNav2026.jsx";
import { sanitizeRichTextHtml } from "../../../utils/sanitizeRichTextHtml.js";
import "./StoreCustomizationPrivacyTermsSettings2026.css";

const toText = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

// Official TP Preneurs Standard Legal Templates
const TP_TEMPLATES = {
  privacy: {
    en: [
      "<h2>TP Preneurs Privacy Policy</h2>",
      "<p>Welcome to TP Preneurs (<strong>tppreneurs.com</strong>). We are fully committed to respecting, protecting, and lawfully processing the personal data of our campus innovators, student edupreneurs, merchants, and buyers in compliance with Law of the Republic of Indonesia No. 27 of 2022 on Personal Data Protection (UU PDP) and relevant e-commerce standards.</p>",
      "<h3>1. Information We Collect</h3>",
      "<p>To enable multi-vendor campus marketplace transactions, educational tools, and support services, we collect:</p>",
      "<ul>",
      "<li><strong>Account Credentials:</strong> Full name, active email address, phone/WhatsApp number, profile avatar, and securely hashed passwords.</li>",
      "<li><strong>Vendor Verification Data (Seller KYC):</strong> National identity (KTP/Student Card), academic institution affiliation, payout bank account details, and merchant store profile.</li>",
      "<li><strong>Transaction & Logistics Data:</strong> Delivery destination address, purchased items, order receipts, shipping preferences, and payment confirmation metadata.</li>",
      "<li><strong>Device & Interaction Logs:</strong> IP address, browser type, operating system, unique device identifiers, and site interaction cookies.</li>",
      "</ul>",
      "<h3>2. Purpose & Lawful Processing</h3>",
      "<p>Your personal information is processed exclusively for legitimate purposes, including:</p>",
      "<ol>",
      "<li>Processing, fulfilling, and tracking multi-vendor orders for physical goods and verified digital products.</li>",
      "<li>Verifying buyer authenticity and validating academic innovation showcases submitted by student merchants.</li>",
      "<li>Delivering order notifications, invoices, shipping tracking status, and account security notices.</li>",
      "<li>Providing customer care, dispute mediation, and resolving order inquiries.</li>",
      "<li>Preventing fraudulent checkouts, payment abuse, and unauthorized workspace access.</li>",
      "<li>Complying with applicable Indonesian consumer protection, tax, and electronic commerce laws.</li>",
      "</ol>",
      "<h3>3. Data Disclosure & Third Parties</h3>",
      "<p>TP Preneurs <strong>never sells, rents, or trades your personal data</strong> to third parties for independent marketing. Information is shared strictly on a need-to-know operational basis with designated vendors for order packaging, integrated logistics carriers for package dispatch, and licensed payment gateways for transaction clearance.</p>",
      "<h3>4. Data Security & Retention</h3>",
      "<p>We deploy modern SSL/TLS encryption, granular role-based access controls, and robust infrastructure monitoring to prevent unauthorized access, alteration, or disclosure. Personal data is maintained as long as your account remains active or as required by regulatory audit requirements.</p>",
      "<h3>5. Your Rights as a Data Subject</h3>",
      "<p>Under Indonesian Personal Data Protection legislation, you hold the right to access, verify, request corrections to your records, or request complete account erasure and data deletion by contacting our official support desk at support@tppreneurs.com.</p>",
      "<h3>6. Contact & Support</h3>",
      "<p>For privacy inquiries or rights enforcement, contact our support team at <a href=\"mailto:support@tppreneurs.com\">support@tppreneurs.com</a> or via WhatsApp at <a href=\"https://wa.me/628218866824\" target=\"_blank\" rel=\"noreferrer\">+62 821-8866-824</a>.</p>",
    ].join(""),
    id: [
      "<h2>Kebijakan Privasi TP Preneurs</h2>",
      "<p>Selamat datang di TP Preneurs (<strong>tppreneurs.com</strong>). Kami berkomitmen penuh untuk menghormati, melindungi, dan memperlakukan data pribadi seluruh civitas akademika, mitra wirausaha kampus (edupreneur), penjual (seller), serta pembeli (buyer) dengan standar keamanan tertinggi sesuai Undang-Undang Republik Indonesia Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP).</p>",
      "<h3>1. Informasi yang Kami Kumpulkan</h3>",
      "<p>Untuk mendukung kelancaran ekosistem perdagangan elektronik multi-vendor dan media pembelajaran, kami mengumpulkan data yang mencakup:</p>",
      "<ul>",
      "<li><strong>Identitas Akun:</strong> Nama lengkap, alamat email aktif, nomor telepon/WhatsApp, foto profil, dan kata sandi yang terenkripsi.</li>",
      "<li><strong>Data Verifikasi Mitra Penjual (KYC Seller):</strong> Kartu Identitas (KTP/Kartu Mahasiswa/NIM), bukti afiliasi institusi kampus, rekening bank pencairan dana, dan profil toko.</li>",
      "<li><strong>Informasi Transaksi & Pengiriman:</strong> Alamat pengiriman, rincian produk yang dipesan, riwayat checkout, preferensi ekspedisi, dan metadata pembayaran.</li>",
      "<li><strong>Data Perangkat & Log Akses:</strong> Alamat IP, jenis peramban (browser), sistem operasi, pengidentifikasi perangkat unik, dan data cookie.</li>",
      "</ul>",
      "<h3>2. Tujuan Penggunaan Data Pribadi</h3>",
      "<p>Data pribadi yang dikumpulkan digunakan semata-mata untuk tujuan yang sah, antara lain:</p>",
      "<ol>",
      "<li>Memproses, mengonfirmasi, dan memfasilitasi pesanan produk fisik maupun akses modul digital antar-multi-vendor.</li>",
      "<li>Memverifikasi keabsahan identitas pembeli serta kelaikan etalase karya inovasi yang dijual oleh merchant kampus.</li>",
      "<li>Mengirimkan notifikasi pembaruan status transaksi, tanda terima pembayaran (invoice), dan informasi pengiriman pesanan.</li>",
      "<li>Menyediakan layanan bantuan pelanggan (customer service) dan penyelesaian kendala pesanan.</li>",
      "<li>Mendeteksi, mencegah kecurangan transaksi (fraud), dan melindungi keamanan akun dari akses tanpa hak.</li>",
      "<li>Memenuhi seluruh kewajiban hukum dan regulasi perdagangan elektronik yang berlaku di Indonesia.</li>",
      "</ol>",
      "<h3>3. Pengungkapan Informasi kepada Pihak Ketiga</h3>",
      "<p>TP Preneurs <strong>tidak pernah menjual, menyewakan, atau memperdagangkan data pribadi pengguna</strong> kepada pihak mana pun. Pengungkapan data hanya dilakukan secara terbatas untuk kebutuhan operasional: kepada Penjual terkait untuk pemenuhan pesanan, mitra logistik resmi untuk pengantaran paket, dan payment gateway resmi untuk verifikasi pembayaran.</p>",
      "<h3>4. Keamanan & Retensi Data</h3>",
      "<p>Kami menerapkan standar enkripsi Secure Sockets Layer (SSL/TLS), sistem autentikasi aman, serta protokol proteksi server untuk melindungi data dari kebocoran, kehilangan, atau manipulasi. Data disimpan selama akun aktif atau sesuai ketentuan regulasi transaksi komersial.</p>",
      "<h3>5. Hak-Hak Pemilik Data Pribadi</h3>",
      "<p>Sesuai UU PDP No. 27/2022, Anda memiliki hak penuh untuk mengakses, memperbaiki data yang tidak akurat, menarik persetujuan, atau mengajukan permohonan penutupan akun dan penghapusan data pribadi (right to erasure) dengan menghubungi tim bantuan resmi kami.</p>",
      "<h3>6. Kontak Pengendali Data & Bantuan</h3>",
      "<p>Untuk pertanyaan, konsultasi, atau permohonan terkait data pribadi, hubungi tim kami melalui email <a href=\"mailto:support@tppreneurs.com\">support@tppreneurs.com</a> atau WhatsApp resmi <a href=\"https://wa.me/628218866824\" target=\"_blank\" rel=\"noreferrer\">+62 821-8866-824</a>.</p>",
    ].join(""),
  },
  terms: {
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
  },
};

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={ariaLabel}
      onClick={() => onChange?.(!checked)}
      className={`pt26-toggle-btn ${checked ? "is-active" : "is-inactive"}`}
    >
      <span className="pt26-toggle-knob" />
    </button>
  );
}

function ImageUploadDropzone({
  id,
  label,
  value,
  onChange,
  onRemove,
  isId,
}) {
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert(
        isId
          ? "Format file harus berupa gambar (JPG, PNG, WEBP)."
          : "Please select an image file (JPG, PNG, WEBP)."
      );
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert(
        isId
          ? "Ukuran gambar maksimal 5MB."
          : "Image size must not exceed 5MB."
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === "string") {
        onChange(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  };

  return (
    <div className="pt26-field">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="pt26-label">
          {label}
        </label>
        <span className="pt26-dropzone-badge">
          {isId ? "1920x400 • Maks 5MB" : "1920x400 • Max 5MB"}
        </span>
      </div>

      {value ? (
        <div className="pt26-img-preview-box">
          <img src={value} alt="Banner Preview" />
          <button
            type="button"
            onClick={onRemove}
            className="pt26-img-remove-btn"
            title={isId ? "Hapus gambar" : "Remove image"}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="pt26-dropzone"
        >
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#034c85]/10 text-[#034c85] dark:bg-[#034c85]/20 dark:text-blue-300">
            <Upload className="h-5 w-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {isId ? "Klik atau seret gambar banner ke sini" : "Click or drag header banner image here"}
            </p>
            <p className="text-[11px] text-slate-400">
              {isId ? "Mendukung format JPG, PNG, WEBP (Maksimal 5MB)" : "Supports JPG, PNG, WEBP (Max 5MB)"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ModernPolicyEditor({
  value,
  onChange,
  onApplyTemplate,
  isId,
  policyType,
}) {
  const editorRef = useRef(null);
  const [showLinkBar, setShowLinkBar] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  useEffect(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const nextHtml = value || "<p></p>";
    if (currentHtml !== nextHtml) {
      editorRef.current.innerHTML = nextHtml;
    }
  }, [value]);

  const emitChange = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const applyCmd = (command, val = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    emitChange();
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) return;
    applyCmd("createLink", linkUrl.trim());
    setLinkUrl("");
    setShowLinkBar(false);
  };

  return (
    <div className="pt26-editor-container">
      <div className="pt26-editor-toolbar">
        <button
          type="button"
          onClick={() => applyCmd("formatBlock", "<h2>")}
          className="pt26-tool-btn"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("formatBlock", "<h3>")}
          className="pt26-tool-btn"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <span className="pt26-tool-divider" />
        <button
          type="button"
          onClick={() => applyCmd("bold")}
          className="pt26-tool-btn"
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("italic")}
          className="pt26-tool-btn"
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("underline")}
          className="pt26-tool-btn"
          title="Underline (Ctrl+U)"
        >
          <Underline className="h-4 w-4" />
        </button>
        <span className="pt26-tool-divider" />
        <button
          type="button"
          onClick={() => applyCmd("insertUnorderedList")}
          className="pt26-tool-btn"
          title={isId ? "Daftar Poin" : "Bullet List"}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("insertOrderedList")}
          className="pt26-tool-btn"
          title={isId ? "Daftar Nomor" : "Numbered List"}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setShowLinkBar(!showLinkBar)}
          className={`pt26-tool-btn ${showLinkBar ? "bg-slate-200 dark:bg-slate-700" : ""}`}
          title={isId ? "Sisipkan Tautan" : "Insert Link"}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <span className="pt26-tool-divider" />
        <button
          type="button"
          onClick={() => applyCmd("undo")}
          className="pt26-tool-btn"
          title={isId ? "Urungkan (Ctrl+Z)" : "Undo (Ctrl+Z)"}
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => applyCmd("redo")}
          className="pt26-tool-btn"
          title={isId ? "Ulangi (Ctrl+Y)" : "Redo (Ctrl+Y)"}
        >
          <RotateCw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onApplyTemplate}
          className="pt26-template-btn"
          title={
            isId
              ? "Gunakan Template Standar TP Preneurs"
              : "Insert TP Preneurs Standard Template"
          }
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{isId ? "Muat Template Standar" : "Insert Standard Template"}</span>
        </button>
      </div>

      {showLinkBar && (
        <div className="pt26-link-bar">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://tppreneurs.com/page"
            className="pt26-link-input"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleApplyLink();
              }
            }}
          />
          <button
            type="button"
            onClick={handleApplyLink}
            className="pt26-link-apply-btn"
          >
            {isId ? "Terapkan" : "Apply Link"}
          </button>
          <button
            type="button"
            onClick={() => setShowLinkBar(false)}
            className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400"
          >
            ✕
          </button>
        </div>
      )}

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        className="pt26-editor-content focus:outline-none"
      />
    </div>
  );
}

export default function StoreCustomizationPrivacyTermsSettings2026({
  privacyPolicy,
  termsAndConditions,
  activeTab,
  onTabChange,
  onChangePolicy,
  onSave,
  onPublish,
  onReset,
  onPreview,
  isSaving = false,
  isPublishing = false,
  meta = {},
  language = "en",
  languages = [],
  onLanguageChange,
  isLoading = false,
}) {
  const { i18n } = useTranslation();
  const isId =
    String(language || "").toLowerCase().startsWith("id") ||
    String(i18n?.language || "").toLowerCase().startsWith("id");

  // Sub-document switcher: "privacy" | "terms"
  const [subDoc, setSubDoc] = useState("privacy");

  // Device switcher for preview: "desktop" | "mobile"
  const [previewDevice, setPreviewDevice] = useState("desktop");

  const activePolicyData = subDoc === "privacy" ? privacyPolicy : termsAndConditions;
  const policyKey = subDoc === "privacy" ? "privacyPolicy" : "termsAndConditions";

  const isBlockEnabled = Boolean(activePolicyData?.enabled);
  const pageTitle = toText(
    activePolicyData?.pageTitle,
    subDoc === "privacy"
      ? isId
        ? "Kebijakan Privasi"
        : "Privacy Policy"
      : isId
      ? "Syarat & Ketentuan"
      : "Terms & Conditions"
  );
  const headerBg = toText(activePolicyData?.pageHeaderBackgroundDataUrl, "");
  const pageHtml = toText(activePolicyData?.pageTextHtml, "");

  const safePreviewHtml = useMemo(() => {
    return sanitizeRichTextHtml(pageHtml);
  }, [pageHtml]);

  const handleApplyTemplate = () => {
    const langKey = isId ? "id" : "en";
    const templateText = TP_TEMPLATES[subDoc][langKey];
    onChangePolicy(policyKey, "pageTextHtml", templateText);
  };

  const statusLabel = isPublishing
    ? isId
      ? "Menerbitkan draf..."
      : "Publishing draft..."
    : isSaving
    ? isId
      ? "Menyimpan draf..."
      : "Saving draft..."
    : meta?.hasUnpublishedChanges
    ? isId
      ? "Draf Tersimpan (Belum Rilis)"
      : "Draft Saved (Unpublished)"
    : meta?.publishedAt
    ? isId
      ? "Telah Diterbitkan"
      : "Published"
    : isId
    ? "Siap"
    : "Ready";

  return (
    <div className="pt26-wrap">
      {/* Top Header & Integrated Tab Navigation */}
      <div className="pt26-header-bar">
        <div className="pt26-header-top">
          <div className="pt26-title-group">
            <div className="pt26-title-icon">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="pt26-title">
                {isId
                  ? "Kustomisasi Privasi & Syarat Ketentuan"
                  : "Privacy & Terms Customization"}
              </h1>
              <p className="pt26-subtitle">
                {isId
                  ? "Kelola konten hukum, kebijakan data, dan ketentuan platform TP Preneurs."
                  : "Manage legal content, data privacy safeguards, and TP Preneurs marketplace terms."}
              </p>
            </div>
          </div>

          {/* Sub-document Switcher Segmented Pills */}
          <div className="pt26-subnav">
            <button
              type="button"
              onClick={() => setSubDoc("privacy")}
              className={`pt26-subnav-btn ${subDoc === "privacy" ? "is-active" : ""}`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>{isId ? "Kebijakan Privasi" : "Privacy Policy"}</span>
              <span className="pt26-subnav-badge">
                {privacyPolicy?.enabled ? (isId ? "Aktif" : "Active") : (isId ? "Nonaktif" : "Off")}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSubDoc("terms")}
              className={`pt26-subnav-btn ${subDoc === "terms" ? "is-active" : ""}`}
            >
              <FileText className="h-4 w-4" />
              <span>{isId ? "Syarat & Ketentuan" : "Terms & Conditions"}</span>
              <span className="pt26-subnav-badge">
                {termsAndConditions?.enabled ? (isId ? "Aktif" : "Active") : (isId ? "Nonaktif" : "Off")}
              </span>
            </button>
          </div>
        </div>

        {/* Global Store Customization Tab Navigation */}
        <StoreCustomizationTabNav2026
          activeTab={activeTab}
          onTabChange={onTabChange}
        />
      </div>

      {/* Main Form & Preview Grid */}
      <div className="pt26-grid">
        {/* Left Column: Form Controls */}
        <div className="flex flex-col gap-5">
          {/* Section Card: Header Banner & Status */}
          <div className="pt26-card">
            <div className="pt26-card-header">
              <div className="pt26-card-title-group">
                <div className="pt26-card-icon">
                  {subDoc === "privacy" ? (
                    <ShieldCheck className="h-5 w-5" />
                  ) : (
                    <FileText className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h2 className="pt26-card-heading">
                    {subDoc === "privacy"
                      ? isId
                        ? "Header & Pengaturan Privasi"
                        : "Privacy Policy Header & Status"
                      : isId
                      ? "Header & Pengaturan Syarat Ketentuan"
                      : "Terms & Conditions Header & Status"}
                  </h2>
                  <p className="pt26-card-subheading">
                    {isId
                      ? "Atur visibilitas halaman, judul hero, dan latar belakang visual."
                      : "Configure page visibility, hero headline, and banner visual."}
                  </p>
                </div>
              </div>

              {/* Master Block Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {isBlockEnabled ? (isId ? "Aktif" : "Enabled") : (isId ? "Nonaktif" : "Disabled")}
                </span>
                <Switch
                  checked={isBlockEnabled}
                  onChange={(val) => onChangePolicy(policyKey, "enabled", val)}
                  ariaLabel="Toggle policy block"
                />
              </div>
            </div>

            {/* Page Title Field */}
            <div className="pt26-field">
              <label htmlFor="pt26-page-title" className="pt26-label">
                {isId ? "Judul Halaman (Page Title)" : "Page Title"}
              </label>
              <input
                id="pt26-page-title"
                type="text"
                value={activePolicyData?.pageTitle ?? ""}
                onChange={(e) =>
                  onChangePolicy(policyKey, "pageTitle", e.target.value)
                }
                placeholder={
                  subDoc === "privacy"
                    ? isId
                      ? "Kebijakan Privasi"
                      : "Privacy Policy"
                    : isId
                    ? "Syarat & Ketentuan"
                    : "Terms & Conditions"
                }
                className="pt26-input"
              />
            </div>

            {/* Banner Background Upload */}
            <ImageUploadDropzone
              id={`pt26-bg-${subDoc}`}
              label={
                isId
                  ? "Gambar Latar Banner Header (Opsional)"
                  : "Page Header Background Banner (Optional)"
              }
              value={headerBg}
              onChange={(dataUrl) =>
                onChangePolicy(policyKey, "pageHeaderBackgroundDataUrl", dataUrl)
              }
              onRemove={() =>
                onChangePolicy(policyKey, "pageHeaderBackgroundDataUrl", "")
              }
              isId={isId}
            />
          </div>

          {/* Section Card: Rich Text Content Editor */}
          <div className="pt26-card">
            <div className="pt26-card-header">
              <div className="pt26-card-title-group">
                <div className="pt26-card-icon">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="pt26-card-heading">
                    {isId ? "Isi Dokumen Kebijakan" : "Document Legal Content"}
                  </h2>
                  <p className="pt26-card-subheading">
                    {isId
                      ? "Format teks isi dengan heading, poin daftar, dan tautan resmi."
                      : "Format body text with headings, structured bullet points, and hyperlinks."}
                  </p>
                </div>
              </div>

              {/* Direct Storefront Public Link Button */}
              <a
                href={subDoc === "privacy" ? "/privacy-policy" : "/terms-and-conditions"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <span>{isId ? "Buka Halaman" : "Open Live Page"}</span>
                <ExternalLink className="h-3.5 w-3.5 text-[#fe6f05]" />
              </a>
            </div>

            <ModernPolicyEditor
              value={pageHtml}
              onChange={(nextHtml) =>
                onChangePolicy(policyKey, "pageTextHtml", nextHtml)
              }
              onApplyTemplate={handleApplyTemplate}
              isId={isId}
              policyType={subDoc}
            />
          </div>
        </div>

        {/* Right Column: 1:1 Live Storefront Preview */}
        <div className="pt26-preview-shell">
          <div className="pt26-preview-controls">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-[#fe6f05]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isId ? "Pratinjau Etalase Langsung" : "Live Storefront Preview"}
              </span>
            </div>

            {/* Desktop / Mobile Device Selector */}
            <div className="pt26-device-selector">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={`pt26-device-btn ${previewDevice === "desktop" ? "is-active" : ""}`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={`pt26-device-btn ${previewDevice === "mobile" ? "is-active" : ""}`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile</span>
              </button>
            </div>
          </div>

          {/* Device Mockup Frame */}
          <div
            className={`pt26-preview-frame ${
              previewDevice === "mobile" ? "is-mobile" : ""
            }`}
          >
            {/* Header Mockup */}
            <header
              className={`pt26-storefront-header ${headerBg ? "has-bg" : ""}`}
              style={
                headerBg
                  ? {
                      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.65)), url(${headerBg})`,
                    }
                  : undefined
              }
            >
              <div className="pt26-storefront-header-content">
                <span className="pt26-storefront-badge">
                  {subDoc === "privacy" ? "TP PRENEURS PRIVACY" : "TP PRENEURS TERMS"}
                </span>
                <h1 className="pt26-storefront-title">{pageTitle}</h1>
              </div>
            </header>

            {/* Body Content Simulation */}
            {!isBlockEnabled ? (
              <div className="pt26-storefront-disabled-banner">
                {isId
                  ? "Halaman ini saat ini sedang dinonaktifkan dari etalase publik."
                  : "This page is currently marked as disabled and hidden from public visitors."}
              </div>
            ) : safePreviewHtml.trim() ? (
              <div
                className="pt26-storefront-body prose prose-slate max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
              />
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                {isId
                  ? "Belum ada teks isi yang ditulis. Gunakan editor di sebelah kiri untuk mengisi konten."
                  : "No content entered yet. Use the editor on the left to write policy content."}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="pt26-sticky-bar">
        <div className="pt26-sticky-inner">
          <div className="pt26-status-pill">
            <span className="pt26-status-dot" />
            <span>{statusLabel}</span>
          </div>

          <div className="pt26-action-btns">
            <button
              type="button"
              onClick={onReset}
              disabled={isLoading || isSaving || isPublishing}
              className="pt26-btn-reset"
              title={isId ? "Atur ulang ke draf terakhir" : "Reset to last saved draft"}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{isId ? "Atur Ulang" : "Reset Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => onSave({ publish: false })}
              disabled={isLoading || isSaving || isPublishing}
              className="pt26-btn-save"
            >
              <Save className="h-3.5 w-3.5 text-[#fe6f05]" />
              <span>
                {isSaving && !isPublishing
                  ? isId
                    ? "Menyimpan..."
                    : "Saving..."
                  : isId
                  ? "Simpan Draf"
                  : "Save Draft"}
              </span>
            </button>

            <button
              type="button"
              onClick={onPublish}
              disabled={isLoading || isSaving || isPublishing}
              className="pt26-btn-publish"
            >
              <Rocket className="h-3.5 w-3.5" />
              <span>
                {isPublishing
                  ? isId
                    ? "Menerbitkan..."
                    : "Publishing..."
                  : isId
                  ? "Publikasikan Draf"
                  : "Publish Draft"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

