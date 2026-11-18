import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  CreditCard,
  Pencil,
  QrCode,
  RefreshCw,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import { useSeller2026PaymentProfile } from "../../../hooks/seller2026/useSeller2026PaymentProfile.ts";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "./SellerPaymentSetupPage.css";

const POPULAR_BANKS = [
  "BCA (Bank Central Asia)",
  "Bank Mandiri",
  "BRI (Bank Rakyat Indonesia)",
  "BNI (Bank Negara Indonesia)",
  "BSI (Bank Syariah Indonesia)",
  "Bank CIMB Niaga",
  "Bank Permata",
  "Bank Danamon",
  "Bank Jago",
  "Blu by BCA Digital",
  "SeaBank",
];

const formatDate = (val, isId = false) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
};

export default function Seller2026LivePaymentProfilePage() {
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug,
    isId: outletIsId,
    selectedLanguage,
  } = useSellerWorkspaceRoute();
  const { i18n } = useTranslation();

  const isId = Boolean(
    outletIsId !== undefined
      ? outletIsId
      : String(selectedLanguage?.isoCode || "").toLowerCase() === "id" ||
        String(i18n?.language || "").toLowerCase().startsWith("id") ||
        String(localStorage.getItem("seller_language") || "").toLowerCase().includes("id")
  );

  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("STORE_PAYMENT_PROFILE_READ");
  const permissionCanEdit = can("STORE_PAYMENT_PROFILE_SUBMIT");

  const profileQuery = useSeller2026PaymentProfile(storeId, {
    enabled: canView,
    canEdit: permissionCanEdit,
  });

  const { data: profile } = profileQuery;
  const canEdit = profileQuery.canEdit;

  // Local form state
  const [form, setForm] = useState(profile?.form || {});
  const [isEditing, setIsEditing] = useState(false);
  const [showQrisAccordion, setShowQrisAccordion] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState(null);
  const [customBank, setCustomBank] = useState("");
  const [isOtherBank, setIsOtherBank] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (profile?.form) {
      setForm(profile.form);
      const isKnown = POPULAR_BANKS.some((b) =>
        b.toLowerCase().includes(String(profile.form.bankName || "").toLowerCase())
      );
      if (profile.form.bankName && !isKnown) {
        setIsOtherBank(true);
        setCustomBank(profile.form.bankName);
      } else {
        setIsOtherBank(false);
        setCustomBank("");
      }
    }
  }, [profile?.form]);

  // Active snapshot data
  const active = profile?.activeSnapshot;
  const hasActiveAccount = Boolean(active?.bankName && active?.accountNumber);
  const isApproved =
    profile?.checkoutReady ||
    (profile?.activeSnapshot?.isActive &&
      profile?.activeSnapshot?.verificationStatus === "ACTIVE");
  const isUnderReview = profile?.requestStatus?.isSubmitted;
  const isRevision = String(profile?.review?.code || "")
    .toUpperCase()
    .includes("REVISION");

  const handleCopyAccount = (accountNo) => {
    if (!accountNo) return;
    navigator.clipboard.writeText(accountNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const setField = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const handleBankSelect = (e) => {
    const val = e.target.value;
    if (val === "__OTHER__") {
      setIsOtherBank(true);
      setField("bankName", customBank || "");
    } else {
      setIsOtherBank(false);
      setField("bankName", val);
    }
  };

  const handleCustomBankChange = (e) => {
    const val = e.target.value;
    setCustomBank(val);
    setField("bankName", val);
  };

  const handleSaveDraft = async () => {
    try {
      await profileQuery.saveDraft(form);
      setNotice({
        type: "success",
        message: isId ? "Draf rekening berhasil disimpan." : "Account draft saved successfully.",
      });
      setIsEditing(false);
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || (isId ? "Gagal menyimpan draf." : "Failed to save draft."),
      });
    }
  };

  const handleSubmitForReview = async () => {
    if (!form.bankName || !form.accountNumber || !form.accountHolderName) {
      setNotice({
        type: "error",
        message: isId
          ? "Nama bank, nomor rekening, dan nama pemilik wajib diisi."
          : "Bank name, account number, and account holder name are required.",
      });
      return;
    }
    try {
      await profileQuery.submitForReview(form);
      setNotice({
        type: "success",
        message: isId
          ? "Pengaturan rekening berhasil dikirim untuk verifikasi Admin."
          : "Payment setup submitted successfully for Admin review.",
      });
      setIsEditing(false);
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || (isId ? "Gagal mengirim verifikasi." : "Failed to submit for review."),
      });
    }
  };

  const handleUploadQris = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await profileQuery.uploadQris(file);
      setField("qrisImageUrl", url);
      setNotice({
        type: "success",
        message: isId ? "Gambar QRIS berhasil diunggah." : "QRIS image uploaded successfully.",
      });
    } catch (err) {
      setNotice({
        type: "error",
        message: err?.message || (isId ? "Gagal mengunggah QRIS." : "Failed to upload QRIS."),
      });
    }
  };

  if (!canView) {
    return (
      <main className="s26-setup">
        <div className="s26-alert s26-alert--warning">
          <ShieldCheck size={20} />
          <span>
            {isId
              ? "Akses Pengaturan Pembayaran tidak tersedia untuk peran akun Anda."
              : "Payment setup access is not available for your role."}
          </span>
        </div>
      </main>
    );
  }

  if (profileQuery.isLoading) {
    return (
      <main className="s26-setup">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "350px",
            gap: "10px",
            color: "var(--s26-muted)",
          }}
        >
          <RefreshCw size={22} className="animate-spin" />
          <span>{isId ? "Memuat pengaturan pembayaran..." : "Loading payment setup..."}</span>
        </div>
      </main>
    );
  }

  return (
    <main className="s26-setup">
      {/* Eyebrow Badge */}
      <div className="s26-eyebrow">
        <Sparkles size={13} />
        <span>{isId ? "Keuangan & Pencairan" : "Finance & Payout"}</span>
      </div>

      {/* Breadcrumb */}
      <nav className="s26-setup-breadcrumb" aria-label="Breadcrumb">
        <Link to={`/seller/stores/${workspaceStoreSlug}`}>{isId ? "Toko" : "Store"}</Link>
        <span>/</span>
        <Link to={`/seller/stores/${workspaceStoreSlug}/withdrawals`}>
          {isId ? "Keuangan" : "Finance"}
        </Link>
        <span>/</span>
        <span className="current">{isId ? "Pengaturan Rekening" : "Payment Setup"}</span>
      </nav>

      {/* Header Bar */}
      <header className="s26-setup-header">
        <div>
          <h1>{isId ? "Pengaturan Pembayaran & Rekening Pencairan" : "Payment & Payout Setup"}</h1>
          <p>
            {isId
              ? "Kelola rekening bank untuk pencairan dana toko Anda. Pembayaran pembeli diproses otomatis via Duitku Gateway."
              : "Manage your payout bank details for store revenue disbursements. Buyer checkout is processed via Duitku Gateway."}
          </p>
        </div>

        <div className="s26-setup-header__actions">
          {/* Status Badge */}
          {isApproved ? (
            <span className="s26-badge s26-badge--green">
              <CheckCircle2 size={14} />
              {isId ? "Aktif & Siap Pencairan" : "Active & Ready"}
            </span>
          ) : isUnderReview ? (
            <span className="s26-badge s26-badge--amber">
              <Clock3 size={14} />
              {isId ? "Menunggu Verifikasi Admin" : "Pending Admin Review"}
            </span>
          ) : isRevision ? (
            <span className="s26-badge s26-badge--red">
              <AlertCircle size={14} />
              {isId ? "Perlu Revisi" : "Needs Revision"}
            </span>
          ) : (
            <span className="s26-badge s26-badge--slate">
              <Clock3 size={14} />
              {isId ? "Belum Diatur" : "Incomplete"}
            </span>
          )}

          {/* Direct link to Withdrawals page */}
          <Link
            to={`/seller/stores/${workspaceStoreSlug}/withdrawals`}
            className="s26-btn s26-btn--outline"
          >
            <Wallet size={16} />
            <span>{isId ? "Penarikan Dana" : "Withdrawals"}</span>
          </Link>

          {!isEditing && canEdit && (
            <button
              type="button"
              className="s26-btn s26-btn--primary"
              onClick={() => setIsEditing(true)}
            >
              <Pencil size={15} />
              <span>{isId ? "Ubah Rekening" : "Edit Details"}</span>
            </button>
          )}
        </div>
      </header>

      {/* Feedback Alert Notice */}
      {notice && (
        <div className={`s26-alert s26-alert--${notice.type}`}>
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* 4-Card Summary Grid (KPIs) */}
      <section className="s26-kpi-grid">
        <article className="s26-kpi-card">
          <div className="s26-kpi-card__icon s26-kpi-card__icon--navy">
            <Building2 size={22} />
          </div>
          <div className="s26-kpi-card__body">
            <span className="s26-kpi-card__label">{isId ? "Metode Pencairan" : "Payout Method"}</span>
            <strong className="s26-kpi-card__value">
              {active?.bankName || form.bankName || (isId ? "Belum Diatur" : "Not Set")}
            </strong>
            <span className="s26-kpi-card__sub">
              {active?.accountNumber
                ? `•••• ${String(active.accountNumber).slice(-4)}`
                : (isId ? "Transfer Bank" : "Bank Transfer")}
            </span>
          </div>
        </article>

        <article className="s26-kpi-card">
          <div
            className={`s26-kpi-card__icon ${
              isApproved ? "s26-kpi-card__icon--green" : "s26-kpi-card__icon--amber"
            }`}
          >
            <Wallet size={22} />
          </div>
          <div className="s26-kpi-card__body">
            <span className="s26-kpi-card__label">
              {isId ? "Kesiapan Penarikan" : "Withdrawal Readiness"}
            </span>
            <strong className="s26-kpi-card__value">
              {isApproved
                ? (isId ? "Siap Pencairan" : "Ready for Payout")
                : isUnderReview
                ? (isId ? "Dalam Peninjauan" : "In Review")
                : (isId ? "Perlu Dilengkapi" : "Needs Setup")}
            </strong>
            <span className="s26-kpi-card__sub">
              {isApproved
                ? (isId ? "Terhubung ke Penarikan Dana" : "Linked to Withdrawals")
                : (isId ? "Diperlukan untuk pencairan saldo" : "Required for disbursements")}
            </span>
          </div>
        </article>

        <article className="s26-kpi-card">
          <div
            className={`s26-kpi-card__icon ${
              isApproved
                ? "s26-kpi-card__icon--green"
                : isRevision
                ? "s26-kpi-card__icon--orange"
                : "s26-kpi-card__icon--navy"
            }`}
          >
            <ShieldCheck size={22} />
          </div>
          <div className="s26-kpi-card__body">
            <span className="s26-kpi-card__label">{isId ? "Verifikasi Admin" : "Admin Approval"}</span>
            <strong className="s26-kpi-card__value">
              {isApproved
                ? (isId ? "Disetujui" : "Approved")
                : isUnderReview
                ? (isId ? "Menunggu Verifikasi" : "Pending Review")
                : isRevision
                ? (isId ? "Perlu Perbaikan" : "Revision Needed")
                : (isId ? "Draf Pengajuan" : "Draft Request")}
            </strong>
            <span className="s26-kpi-card__sub">
              {isId ? "Keamanan dana toko" : "Protects store funds"}
            </span>
          </div>
        </article>

        <article className="s26-kpi-card">
          <div className="s26-kpi-card__icon s26-kpi-card__icon--navy">
            <CreditCard size={22} />
          </div>
          <div className="s26-kpi-card__body">
            <span className="s26-kpi-card__label">{isId ? "Pembayaran Pembeli" : "Buyer Checkout"}</span>
            <strong className="s26-kpi-card__value">Duitku Gateway</strong>
            <span className="s26-kpi-card__sub">{isId ? "Otomatis & Terpusat" : "Automated & Central"}</span>
          </div>
        </article>
      </section>

      {/* Main 2-Column Responsive Layout Grid */}
      <section className="s26-main-grid">
        {/* Left Column: Payout Bank Account Details / Form */}
        <div className="s26-panel">
          <div className="s26-panel__header">
            <div>
              <h2 className="s26-panel__title">
                <CreditCard size={18} style={{ color: "var(--s26-navy-light)" }} />
                <span>{isId ? "Rekening Bank Pencairan Dana" : "Disbursement Bank Account"}</span>
              </h2>
              <p className="s26-panel__desc">
                {isId
                  ? "Rekening resmi toko untuk menerima hasil penarikan saldo penjualan."
                  : "Official store bank account for receiving store revenue disbursements."}
              </p>
            </div>

            {hasActiveAccount && !isEditing && canEdit && (
              <button
                type="button"
                className="s26-btn s26-btn--outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={14} />
                <span>{isId ? "Ubah" : "Edit"}</span>
              </button>
            )}
          </div>

          {/* VIEW MODE: Sleek ATM Bank Card */}
          {hasActiveAccount && !isEditing ? (
            <div>
              <div className="s26-atm-card">
                <div className="s26-atm-card__top">
                  <span className="s26-atm-card__bank">
                    {active.bankName
                      ? `BANK ${String(active.bankName).toUpperCase()}`
                      : "BANK TRANSFER"}
                  </span>
                  <div className="s26-atm-card__chip" />
                </div>

                <div className="s26-atm-card__number-wrap">
                  <span className="s26-atm-card__number">
                    {active.accountNumber || "•••• •••• ••••"}
                  </span>
                  <button
                    type="button"
                    className="s26-atm-card__copy"
                    onClick={() => handleCopyAccount(active.accountNumber)}
                    title={isId ? "Salin nomor rekening" : "Copy account number"}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copied ? (isId ? "Tersalin" : "Copied") : (isId ? "Salin" : "Copy")}</span>
                  </button>
                </div>

                <div className="s26-atm-card__bottom">
                  <div>
                    <span className="s26-atm-card__holder-label">
                      {isId ? "Nama Pemilik Rekening" : "Account Holder"}
                    </span>
                    <div className="s26-atm-card__holder-name">
                      {active.accountHolderName ||
                        active.accountName ||
                        sellerContext?.store?.name ||
                        "-"}
                    </div>
                  </div>

                  <div className="s26-atm-card__verified">
                    <CheckCircle2 size={13} />
                    <span>{isId ? "Terverifikasi" : "Verified"}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons under card */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "16px" }}>
                <Link
                  to={`/seller/stores/${workspaceStoreSlug}/withdrawals`}
                  className="s26-btn s26-btn--primary"
                >
                  <Wallet size={15} />
                  <span>{isId ? "Buka Penarikan Dana" : "Go to Withdrawals"}</span>
                </Link>

                {canEdit && (
                  <button
                    type="button"
                    className="s26-btn s26-btn--outline"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil size={15} />
                    <span>{isId ? "Perbarui Rekening Bank" : "Update Bank Account"}</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* EDIT / SETUP FORM MODE */
            <form
              className="s26-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmitForReview();
              }}
            >
              {/* Bank Name Field */}
              <div className="s26-form-group">
                <label>
                  <span>{isId ? "Nama Bank Pencairan *" : "Disbursement Bank Name *"}</span>
                  <small style={{ color: "var(--s26-dim)" }}>
                    {isId ? "Tujuan transfer dana" : "Disbursement destination"}
                  </small>
                </label>
                <select
                  className="s26-select"
                  value={isOtherBank ? "__OTHER__" : form.bankName || ""}
                  onChange={handleBankSelect}
                  disabled={profileQuery.submitting || profileQuery.saving}
                >
                  <option value="" disabled>
                    {isId ? "-- Pilih Bank Pencairan --" : "-- Select Payout Bank --"}
                  </option>
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="__OTHER__">
                    {isId ? "Lainnya (Tulis Manual)" : "Other Bank (Type Manual)"}
                  </option>
                </select>
                {isOtherBank && (
                  <input
                    type="text"
                    className="s26-input"
                    style={{ marginTop: "6px" }}
                    placeholder={isId ? "Masukkan nama bank lainnya..." : "Enter other bank name..."}
                    value={customBank}
                    onChange={handleCustomBankChange}
                    maxLength={100}
                    disabled={profileQuery.submitting || profileQuery.saving}
                  />
                )}
              </div>

              {/* Account Number Field */}
              <div className="s26-form-group">
                <label>
                  <span>{isId ? "Nomor Rekening Bank *" : "Bank Account Number *"}</span>
                </label>
                <input
                  type="text"
                  className="s26-input"
                  style={{ fontFamily: "monospace", letterSpacing: "0.05em" }}
                  placeholder={isId ? "Contoh: 1234567890" : "E.g. 1234567890"}
                  value={form.accountNumber || ""}
                  onChange={(e) =>
                    setField("accountNumber", e.target.value.replace(/[^0-9]/g, ""))
                  }
                  maxLength={50}
                  disabled={profileQuery.submitting || profileQuery.saving}
                />
                <span className="s26-form-hint">
                  {isId
                    ? "Pastikan nomor rekening aktif dan hanya berisi angka."
                    : "Ensure account is active and digits only."}
                </span>
              </div>

              {/* Account Holder Name Field */}
              <div className="s26-form-group">
                <label>
                  <span>{isId ? "Nama Pemilik Rekening *" : "Account Holder Name *"}</span>
                </label>
                <input
                  type="text"
                  className="s26-input"
                  style={{ textTransform: "uppercase" }}
                  placeholder={isId ? "Contoh: BUDI SANTOSO" : "E.g. JOHN DOE"}
                  value={form.accountHolderName || ""}
                  onChange={(e) => setField("accountHolderName", e.target.value)}
                  maxLength={120}
                  disabled={profileQuery.submitting || profileQuery.saving}
                />
                <span className="s26-form-hint">
                  {isId
                    ? "Harus sama dengan nama pada buku tabungan atau rekening koran."
                    : "Must match name on bank passbook / statement."}
                </span>
              </div>

              {/* Store & Additional Notes */}
              <div className="s26-form-group">
                <label>
                  <span>
                    {isId
                      ? "Catatan Tambahan untuk Admin (Opsional)"
                      : "Additional Notes for Admin (Optional)"}
                  </span>
                </label>
                <textarea
                  className="s26-textarea"
                  rows={2}
                  placeholder={
                    isId
                      ? "Contoh: Rekening operasional resmi toko..."
                      : "E.g. Official operating store account..."
                  }
                  value={form.sellerNote || ""}
                  onChange={(e) => setField("sellerNote", e.target.value)}
                  maxLength={500}
                  disabled={profileQuery.submitting || profileQuery.saving}
                />
              </div>

              {/* Collapsible QRIS Reference */}
              <div className="s26-accordion">
                <div
                  className="s26-accordion__summary"
                  onClick={() => setShowQrisAccordion(!showQrisAccordion)}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <QrCode size={16} style={{ color: "var(--s26-orange)" }} />
                    <span>{isId ? "Gambar QRIS Toko (Opsional)" : "Store QRIS Image (Optional)"}</span>
                  </span>
                  {showQrisAccordion ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {showQrisAccordion && (
                  <div className="s26-accordion__content">
                    <p style={{ margin: "0 0 10px", fontSize: "12px", color: "var(--s26-muted)" }}>
                      {isId
                        ? "Opsional. Seluruh checkout pembeli ditangani secara terpusat oleh Payment Gateway Duitku."
                        : "Optional. All buyer checkouts are processed via centralized Duitku Payment Gateway."}
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      hidden
                      onChange={handleUploadQris}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        type="button"
                        className="s26-btn s26-btn--outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={profileQuery.uploading}
                      >
                        <Upload size={14} />
                        <span>
                          {profileQuery.uploading
                            ? (isId ? "Mengunggah..." : "Uploading...")
                            : (isId ? "Unggah Gambar QRIS" : "Upload QRIS")}
                        </span>
                      </button>
                      {form.qrisImageUrl && (
                        <span style={{ fontSize: "12px", color: "var(--s26-green)" }}>
                          ✓ {isId ? "Gambar QRIS Terpasang" : "QRIS Attached"}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="s26-form-actions">
                <button
                  type="submit"
                  className="s26-btn s26-btn--orange"
                  disabled={profileQuery.submitting || profileQuery.saving}
                >
                  <Send size={15} />
                  <span>
                    {profileQuery.submitting
                      ? (isId ? "Mengirim..." : "Submitting...")
                      : (isId ? "Kirim untuk Verifikasi Admin" : "Submit for Admin Review")}
                  </span>
                </button>

                <button
                  type="button"
                  className="s26-btn s26-btn--outline"
                  onClick={handleSaveDraft}
                  disabled={profileQuery.submitting || profileQuery.saving}
                >
                  <Save size={15} />
                  <span>
                    {profileQuery.saving
                      ? (isId ? "Menyimpan..." : "Saving...")
                      : (isId ? "Simpan Draf" : "Save Draft")}
                  </span>
                </button>

                {hasActiveAccount && (
                  <button
                    type="button"
                    className="s26-btn s26-btn--outline"
                    onClick={() => setIsEditing(false)}
                    disabled={profileQuery.submitting || profileQuery.saving}
                  >
                    <span>{isId ? "Batal" : "Cancel"}</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Right Column: Withdrawals Requirements & Admin Review Notes */}
        <div className="s26-side-col">
          {/* Card 1: Withdrawals Integration & Terms */}
          <div className="s26-info-card">
            <h3 className="s26-info-card__title">
              <Wallet size={17} style={{ color: "var(--s26-orange)" }} />
              <span>{isId ? "Ketentuan Penarikan Saldo" : "Withdrawal Conditions"}</span>
            </h3>

            <p
              style={{
                margin: "0 0 14px",
                fontSize: "12.5px",
                color: "var(--s26-muted)",
                lineHeight: 1.45,
              }}
            >
              {isId
                ? "Hasil penjualan dari pesanan yang telah diterima pembeli akan dicairkan ke rekening terverifikasi ini."
                : "Proceeds from delivered customer orders will be disbursed to the approved bank account configured here."}
            </p>

            <ul className="s26-info-list">
              <li>
                <span className="label">{isId ? "Minimal Penarikan" : "Minimum Payout"}</span>
                <span className="value" style={{ color: "var(--s26-orange)" }}>
                  Rp 50.000
                </span>
              </li>
              <li>
                <span className="label">{isId ? "Biaya Administrasi" : "Transfer Fee"}</span>
                <span className="value">Rp 6.500 / {isId ? "transaksi" : "request"}</span>
              </li>
              <li>
                <span className="label">{isId ? "Estimasi Proses" : "Processing Time"}</span>
                <span className="value">1x24 {isId ? "Jam Kerja" : "Business Day"}</span>
              </li>
              <li>
                <span className="label">{isId ? "Status Rekening" : "Account Status"}</span>
                <span
                  className="value"
                  style={{ color: isApproved ? "var(--s26-green)" : "var(--s26-amber)" }}
                >
                  {isApproved
                    ? (isId ? "Siap Pencairan" : "Ready for Payout")
                    : (isId ? "Perlu Verifikasi" : "Needs Review")}
                </span>
              </li>
            </ul>

            <div style={{ marginTop: "16px" }}>
              <Link
                to={`/seller/stores/${workspaceStoreSlug}/withdrawals`}
                className="s26-btn s26-btn--primary"
                style={{ width: "100%" }}
              >
                <span>{isId ? "Ke Halaman Penarikan Dana" : "Go to Withdrawals Page"}</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Card 2: Admin Verification Status & History */}
          <div className="s26-info-card">
            <h3 className="s26-info-card__title">
              <ShieldCheck size={17} style={{ color: "var(--s26-navy-light)" }} />
              <span>{isId ? "Riwayat Peninjauan Admin" : "Admin Review History"}</span>
            </h3>

            <ul className="s26-info-list">
              <li>
                <span className="label">{isId ? "Status Saat Ini" : "Current Status"}</span>
                <span className="value">
                  {isApproved
                    ? (isId ? "Disetujui" : "Approved")
                    : isUnderReview
                    ? (isId ? "Sedang Ditinjau" : "In Review")
                    : isRevision
                    ? (isId ? "Perlu Perbaikan" : "Revision Needed")
                    : (isId ? "Draf" : "Draft")}
                </span>
              </li>
              <li>
                <span className="label">{isId ? "Terakhir Diajukan" : "Last Submitted"}</span>
                <span className="value">{formatDate(profile?.review?.submittedAt, isId)}</span>
              </li>
              <li>
                <span className="label">{isId ? "Waktu Ditinjau" : "Reviewed At"}</span>
                <span className="value">{formatDate(profile?.review?.reviewedAt, isId)}</span>
              </li>
            </ul>

            {/* Admin Revision Note Banner if present */}
            {profile?.review?.note && (
              <div
                style={{
                  marginTop: "12px",
                  padding: "10px 12px",
                  borderRadius: "var(--s26-radius-sm)",
                  background: isRevision ? "var(--s26-red-soft)" : "var(--s26-navy-soft)",
                  border: `1px solid ${
                    isRevision ? "rgba(239, 68, 68, 0.3)" : "var(--s26-navy-border)"
                  }`,
                }}
              >
                <strong
                  style={{
                    fontSize: "11px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    color: isRevision ? "var(--s26-red)" : "var(--s26-navy-light)",
                    display: "block",
                  }}
                >
                  {isId ? "Catatan dari Admin:" : "Admin Review Note:"}
                </strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: "12px",
                    color: "var(--s26-text)",
                    lineHeight: 1.45,
                  }}
                >
                  {profile.review.note}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
