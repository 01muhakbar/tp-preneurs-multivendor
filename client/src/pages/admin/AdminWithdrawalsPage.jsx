import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  Building2,
  CheckCircle2,
  Clock3,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  FileCheck2,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  Wallet,
  X,
} from "lucide-react";

import {
  listAdminWithdrawals,
  updateWithdrawalStatus,
  uploadWithdrawalProof,
} from "../../api/adminWithdrawals";
import WithdrawalStatusTimeline from "../../components/withdrawals/WithdrawalStatusTimeline.jsx";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import {
  getWithdrawalFinancials,
  getWithdrawalStatusMeta,
  WITHDRAWAL_STATUS_CODES,
} from "../../lib/withdrawalStatus.js";
import "./AdminWithdrawalsPage.css";

const formatCurrency = (value) => `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const formatDateTime = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: !isId,
  }).format(date);
};

const maskAccountNumber = (value) => {
  const normalized = String(value || "").replace(/\s+/g, "");
  if (!normalized) return "-";
  if (normalized.length <= 4) return normalized;
  return `${"*".repeat(Math.max(0, normalized.length - 4))}${normalized.slice(-4)}`;
};

const getInitials = (text) => {
  const clean = String(text || "").trim();
  if (!clean || clean === "-") return "W";
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
};

export function AdminWithdrawalsPage() {
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");

  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!proofFile) {
      setProofPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(proofFile);
    setProofPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [proofFile]);

  const fetchWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listAdminWithdrawals(1, 100, statusFilter);
      setWithdrawals(res.data || []);
    } catch (err) {
      console.error(err);
      setError(
        isId
          ? "Gagal memuat daftar penarikan dana."
          : "Failed to load withdrawals."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, i18n.language]);

  const summary = useMemo(() => {
    const total = withdrawals.length;
    const pending = withdrawals.filter((w) => w.status === "PENDING").length;
    const processing = withdrawals.filter((w) => w.status === "PROCESSING").length;
    const completed = withdrawals.filter((w) => w.status === "COMPLETED").length;
    const totalDisbursed = withdrawals
      .filter((w) => w.status === "COMPLETED")
      .reduce(
        (sum, w) => sum + Number(getWithdrawalFinancials(w).netTransferAmount || 0),
        0
      );

    return { total, pending, processing, completed, totalDisbursed };
  }, [withdrawals]);

  const filteredWithdrawals = useMemo(() => {
    if (!searchQuery.trim()) return withdrawals;
    const q = searchQuery.toLowerCase().trim();
    return withdrawals.filter((w) => {
      const idStr = String(w.id || "");
      const storeName = String(w.store?.name || "").toLowerCase();
      const storeSlug = String(w.store?.slug || "").toLowerCase();
      const bankName = String(w.bankName || "").toLowerCase();
      const accNum = String(w.accountNumber || "").toLowerCase();
      const accName = String(w.accountName || "").toLowerCase();

      return (
        idStr.includes(q) ||
        storeName.includes(q) ||
        storeSlug.includes(q) ||
        bankName.includes(q) ||
        accNum.includes(q) ||
        accName.includes(q)
      );
    });
  }, [withdrawals, searchQuery]);

  const handleCopy = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success(
        isId ? `${label} berhasil disalin.` : `${label} copied to clipboard.`
      );
    });
  };

  const handleAction = async (status) => {
    if (!selectedWithdrawal) return;
    setActionLoading(true);
    setError(null);

    try {
      let proofUrl = undefined;

      if (status === "COMPLETED" && proofFile) {
        const uploadRes = await uploadWithdrawalProof(selectedWithdrawal.id, proofFile);
        proofUrl = uploadRes?.data?.proofImageUrl;
      }

      await updateWithdrawalStatus(selectedWithdrawal.id, status, adminNote, proofUrl);
      const statusMeta = getWithdrawalStatusMeta(status, { isId });
      toast.success(
        isId
          ? `Status penarikan diubah menjadi ${statusMeta.label}.`
          : `Withdrawal marked as ${statusMeta.label}.`
      );
      setSelectedWithdrawal(null);
      setAdminNote("");
      setProofFile(null);
      fetchWithdrawals();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        (isId ? "Gagal memperbarui status penarikan." : "Action failed.");
      toast.error(msg);
      setError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const meta = getWithdrawalStatusMeta(status, { isId });
    const code = String(status || "").toUpperCase();
    const styleMap = {
      PENDING: "withdrawals-badge--pending",
      PROCESSING: "withdrawals-badge--processing",
      COMPLETED: "withdrawals-badge--completed",
      REJECTED: "withdrawals-badge--rejected",
    };
    return (
      <span className={`withdrawals-badge ${styleMap[code] || "withdrawals-badge--pending"}`}>
        <span className="withdrawals-badge-dot" />
        {meta.label}
      </span>
    );
  };

  return (
    <div className="admin-withdrawals-2026">
      {/* HEADER SECTION */}
      <header className="withdrawals-hero">
        <div className="withdrawals-title">
          <div className="withdrawals-title__icon">
            <Wallet size={22} />
          </div>
          <div className="withdrawals-title-text">
            <div className="withdrawals-title-row">
              <h1>{isId ? "Penarikan Dana" : "Withdrawals"}</h1>
              <span className="withdrawals-badge-count">{withdrawals.length}</span>
            </div>
            <p>
              {isId
                ? "Kelola permintaan penarikan saldo penjual dan bukti transfer"
                : "Manage seller withdrawal requests and transfer proof."}
            </p>
          </div>
        </div>

        <div className="withdrawals-actions">
          <button
            type="button"
            className="withdrawals-btn"
            onClick={fetchWithdrawals}
            disabled={loading}
            title={isId ? "Segarkan data" : "Refresh list"}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            {isId ? "Segarkan" : "Refresh"}
          </button>
        </div>
      </header>

      {/* METRICS SUMMARY KPI CARDS */}
      <section className="withdrawals-metrics" aria-label="Withdrawal metrics summary">
        <div className="withdrawals-metric-card is-blue">
          <div className="withdrawals-metric-top">
            <span className="withdrawals-metric-title">
              {isId ? "Total Pengajuan" : "Total Requests"}
            </span>
            <div className="withdrawals-metric-icon">
              <CreditCard size={17} />
            </div>
          </div>
          <div className="withdrawals-metric-val-row">
            <span className="withdrawals-metric-val">{summary.total}</span>
            <span className="withdrawals-metric-sub">
              {isId ? "Pengajuan" : "Requests"}
            </span>
          </div>
        </div>

        <div className="withdrawals-metric-card is-orange">
          <div className="withdrawals-metric-top">
            <span className="withdrawals-metric-title">
              {isId ? "Menunggu Ditinjau" : "Pending Review"}
            </span>
            <div className="withdrawals-metric-icon">
              <Clock3 size={17} />
            </div>
          </div>
          <div className="withdrawals-metric-val-row">
            <span className="withdrawals-metric-val">{summary.pending}</span>
            <span className="withdrawals-metric-sub">
              {isId ? "Perlu Tindakan" : "Needs Action"}
            </span>
          </div>
        </div>

        <div className="withdrawals-metric-card is-blue">
          <div className="withdrawals-metric-top">
            <span className="withdrawals-metric-title">
              {isId ? "Sedang Diproses" : "Processing"}
            </span>
            <div className="withdrawals-metric-icon">
              <Building2 size={17} />
            </div>
          </div>
          <div className="withdrawals-metric-val-row">
            <span className="withdrawals-metric-val">{summary.processing}</span>
            <span className="withdrawals-metric-sub">
              {isId ? "Dalam Transfer" : "In Progress"}
            </span>
          </div>
        </div>

        <div className="withdrawals-metric-card is-green">
          <div className="withdrawals-metric-top">
            <span className="withdrawals-metric-title">
              {isId ? "Selesai Ditransfer" : "Completed"}
            </span>
            <div className="withdrawals-metric-icon">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="withdrawals-metric-val-row">
            <span className="withdrawals-metric-val">{summary.completed}</span>
            <span className="withdrawals-metric-sub">
              {formatCurrency(summary.totalDisbursed)}
            </span>
          </div>
        </div>
      </section>

      {/* FILTER & SEARCH TOOLBAR */}
      <section className="withdrawals-filter-card">
        {/* Quick Filter Chips */}
        <div className="withdrawals-quick-chips">
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            className={`withdrawals-quick-chip ${!statusFilter ? "is-active" : ""}`}
          >
            {isId ? "Semua" : "All"}
            <span className="withdrawals-quick-count">{summary.total}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PENDING")}
            className={`withdrawals-quick-chip ${statusFilter === "PENDING" ? "is-active is-orange" : ""}`}
          >
            {isId ? "Menunggu" : "Pending"}
            <span className="withdrawals-quick-count">{summary.pending}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PROCESSING")}
            className={`withdrawals-quick-chip ${statusFilter === "PROCESSING" ? "is-active" : ""}`}
          >
            {isId ? "Diproses" : "Processing"}
            <span className="withdrawals-quick-count">{summary.processing}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("COMPLETED")}
            className={`withdrawals-quick-chip ${statusFilter === "COMPLETED" ? "is-active is-green" : ""}`}
          >
            {isId ? "Selesai" : "Completed"}
            <span className="withdrawals-quick-count">{summary.completed}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("REJECTED")}
            className={`withdrawals-quick-chip ${statusFilter === "REJECTED" ? "is-active" : ""}`}
          >
            {isId ? "Ditolak" : "Rejected"}
          </button>
        </div>

        {/* Search & Select Grid */}
        <div className="withdrawals-filter-grid">
          <div className="withdrawals-input-wrap">
            <Search size={14} style={{ color: "var(--withdrawals-dim)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isId ? "Cari toko, bank, atau no. rekening..." : "Search store, bank, or account..."}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--withdrawals-dim)" }}
                title={isId ? "Hapus pencarian" : "Clear search"}
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="withdrawals-select"
            aria-label={isId ? "Filter status penarikan" : "Filter withdrawal status"}
          >
            <option value="">{isId ? "Semua Status" : "All Statuses"}</option>
            {WITHDRAWAL_STATUS_CODES.map((status) => (
              <option value={status} key={status}>
                {getWithdrawalStatusMeta(status, { isId }).label}
              </option>
            ))}
          </select>

          {(statusFilter || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter("");
                setSearchQuery("");
              }}
              className="withdrawals-btn"
              title={isId ? "Atur ulang filter" : "Reset filters"}
            >
              <RotateCcw size={13} />
              {isId ? "Atur Ulang" : "Reset"}
            </button>
          )}
        </div>
      </section>

      {/* TABLE / CARDS CONTENT */}
      <section className="withdrawals-table-card">
        <div className="withdrawals-table-toolbar">
          <div className="withdrawals-toolbar-count">
            {isId ? "Menampilkan " : "Showing "}
            <strong>{filteredWithdrawals.length}</strong>
            {isId ? " dari " : " of "}
            <strong>{withdrawals.length}</strong>
            {isId ? " pengajuan penarikan" : " withdrawal requests"}
          </div>
        </div>

        {loading ? (
          <div className="withdrawals-empty">
            <RefreshCw size={24} className="animate-spin" style={{ color: "var(--withdrawals-primary)" }} />
            <p className="withdrawals-empty-desc">
              {isId ? "Memuat data penarikan..." : "Loading withdrawals..."}
            </p>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="withdrawals-empty">
            <div className="withdrawals-empty-icon">
              <PackageCheck size={24} />
            </div>
            <h3 className="withdrawals-empty-title">
              {isId ? "Tidak ada pengajuan ditemukan" : "No withdrawals found"}
            </h3>
            <p className="withdrawals-empty-desc">
              {isId
                ? "Sesuaikan filter atau kriteria pencarian Anda."
                : "Adjust filters or search criteria."}
            </p>
          </div>
        ) : (
          <>
            {/* DESKTOP ZERO-SCROLL TABLE (>= 768px) */}
            <div className="withdrawals-table-scroll">
              <table className="withdrawals-table">
                <thead>
                  <tr>
                    <th style={{ width: "8%" }}>ID</th>
                    <th style={{ width: "23%" }}>{isId ? "Toko" : "Store"}</th>
                    <th style={{ width: "23%" }}>{isId ? "Rekening Tujuan" : "Destination"}</th>
                    <th style={{ width: "17%" }}>{isId ? "Jumlah Bersih" : "Net Amount"}</th>
                    <th style={{ width: "15%" }}>{isId ? "Waktu Pengajuan" : "Requested At"}</th>
                    <th style={{ width: "14%" }}>{isId ? "Status" : "Status"}</th>
                    <th style={{ width: "8%", textAlign: "right" }}>{isId ? "Aksi" : "Action"}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWithdrawals.map((withdrawal) => {
                    const financials = getWithdrawalFinancials(withdrawal);
                    const storeName = withdrawal.store?.name || "-";
                    const initials = getInitials(storeName);

                    return (
                      <tr key={withdrawal.id}>
                        <td>
                          <span className="withdrawals-id-badge">#{withdrawal.id}</span>
                        </td>
                        <td>
                          <div className="withdrawals-store-cell">
                            <div className="withdrawals-store-avatar" aria-hidden="true">
                              {initials}
                            </div>
                            <div className="withdrawals-store-info">
                              <span className="withdrawals-store-name" title={storeName}>
                                {storeName}
                              </span>
                              <span className="withdrawals-store-slug">
                                @{withdrawal.store?.slug || "-"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="withdrawals-dest-cell">
                            <div className="withdrawals-dest-top">
                              <span className="withdrawals-bank-badge">
                                {withdrawal.bankName || "-"}
                              </span>
                              <span className="withdrawals-acc-num">
                                {maskAccountNumber(withdrawal.accountNumber)}
                              </span>
                              {withdrawal.accountNumber && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCopy(
                                      withdrawal.accountNumber,
                                      isId ? "No. rekening" : "Account number"
                                    )
                                  }
                                  className="withdrawals-copy-btn"
                                  title={isId ? "Salin no. rekening" : "Copy account number"}
                                >
                                  <Copy size={12} />
                                </button>
                              )}
                            </div>
                            <span className="withdrawals-acc-name">
                              {withdrawal.accountName || "-"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="withdrawals-amount-cell">
                            <span className="withdrawals-net-amount">
                              {formatCurrency(financials.netTransferAmount)}
                            </span>
                            <span className="withdrawals-req-amount">
                              {isId ? "Ajuan: " : "Req: "}
                              {formatCurrency(financials.amount)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="withdrawals-date-cell">
                            {formatDateTime(withdrawal.requestedAt, isId)}
                          </span>
                        </td>
                        <td>{getStatusBadge(withdrawal.status)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            onClick={() => setSelectedWithdrawal(withdrawal)}
                            className="withdrawals-action-btn"
                            title={isId ? "Tinjau pengajuan" : "Review withdrawal"}
                          >
                            <Eye size={13} />
                            {isId ? "Tinjau" : "Review"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE ORDER CARDS (< 768px) */}
            <div className="withdrawals-mobile-feed">
              {filteredWithdrawals.map((withdrawal) => {
                const financials = getWithdrawalFinancials(withdrawal);
                const storeName = withdrawal.store?.name || "-";
                const initials = getInitials(storeName);

                return (
                  <div key={withdrawal.id} className="withdrawals-mobile-card">
                    <div className="withdrawals-mobile-top">
                      <span className="withdrawals-id-badge">#{withdrawal.id}</span>
                      {getStatusBadge(withdrawal.status)}
                    </div>

                    <div className="withdrawals-store-cell">
                      <div className="withdrawals-store-avatar" aria-hidden="true">
                        {initials}
                      </div>
                      <div className="withdrawals-store-info">
                        <span className="withdrawals-store-name">{storeName}</span>
                        <span className="withdrawals-store-slug">
                          @{withdrawal.store?.slug || "-"}
                        </span>
                      </div>
                    </div>

                    <div className="withdrawals-mobile-dest">
                      <span className="withdrawals-bank-badge">{withdrawal.bankName || "-"}</span>
                      <span className="withdrawals-acc-num">
                        {maskAccountNumber(withdrawal.accountNumber)}
                      </span>
                      {withdrawal.accountNumber && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              withdrawal.accountNumber,
                              isId ? "No. rekening" : "Account number"
                            )
                          }
                          className="withdrawals-copy-btn"
                          title={isId ? "Salin no. rekening" : "Copy account number"}
                        >
                          <Copy size={12} />
                        </button>
                      )}
                    </div>

                    <div className="withdrawals-mobile-mid">
                      <div className="withdrawals-amount-cell">
                        <span className="withdrawals-net-amount">
                          {formatCurrency(financials.netTransferAmount)}
                        </span>
                        <span className="withdrawals-req-amount">
                          {isId ? "Ajuan: " : "Req: "}
                          {formatCurrency(financials.amount)}
                        </span>
                      </div>
                      <span className="withdrawals-date-cell">
                        {formatDateTime(withdrawal.requestedAt, isId)}
                      </span>
                    </div>

                    <div className="withdrawals-mobile-actions">
                      <span className="withdrawals-acc-name">
                        {withdrawal.accountName || "-"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        className="withdrawals-btn withdrawals-btn--primary withdrawals-btn--sm"
                      >
                        <Eye size={13} />
                        {isId ? "Tinjau" : "Review"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* REVIEW & TRANSFER PROOF MODAL */}
      {selectedWithdrawal && (
        <div
          className="withdrawals-modal-overlay"
          onClick={() => setSelectedWithdrawal(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="withdrawals-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const selectedFinancials = getWithdrawalFinancials(selectedWithdrawal);
              const storeName = selectedWithdrawal.store?.name || "-";

              return (
                <>
                  <div className="withdrawals-modal-header">
                    <h2 className="withdrawals-modal-title">
                      <FileCheck2 size={18} style={{ color: "var(--withdrawals-primary)" }} />
                      {isId ? "Tinjau Penarikan Dana" : "Review Withdrawal"} #{selectedWithdrawal.id}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setSelectedWithdrawal(null)}
                      className="withdrawals-modal-close"
                      title={isId ? "Tutup" : "Close"}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="withdrawals-modal-body">
                    {/* Destination Grid */}
                    <div className="withdrawals-modal-grid">
                      <div className="withdrawals-modal-field">
                        <span className="withdrawals-field-label">
                          {isId ? "Nama Toko" : "Store Name"}
                        </span>
                        <span className="withdrawals-field-value">{storeName}</span>
                      </div>

                      <div className="withdrawals-modal-field">
                        <span className="withdrawals-field-label">
                          {isId ? "Bank Tujuan" : "Bank Destination"}
                        </span>
                        <span className="withdrawals-field-value">
                          {selectedWithdrawal.bankName || "-"}
                        </span>
                      </div>

                      <div className="withdrawals-modal-field">
                        <span className="withdrawals-field-label">
                          {isId ? "Nomor Rekening" : "Account Number"}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            className="withdrawals-field-value"
                            style={{
                              fontFamily:
                                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                            }}
                          >
                            {selectedWithdrawal.accountNumber || "-"}
                          </span>
                          {selectedWithdrawal.accountNumber && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(
                                  selectedWithdrawal.accountNumber,
                                  isId ? "No. rekening" : "Account number"
                                )
                              }
                              className="withdrawals-copy-btn"
                              title={isId ? "Salin no. rekening" : "Copy account number"}
                            >
                              <Copy size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="withdrawals-modal-field">
                        <span className="withdrawals-field-label">
                          {isId ? "Atas Nama" : "Account Holder"}
                        </span>
                        <span className="withdrawals-field-value">
                          {selectedWithdrawal.accountName || "-"}
                        </span>
                      </div>

                      <div className="withdrawals-modal-field span-2">
                        <span className="withdrawals-field-label">
                          {isId ? "Status Saat Ini" : "Current Status"}
                        </span>
                        <div style={{ marginTop: 4 }}>
                          {getStatusBadge(selectedWithdrawal.status)}
                        </div>
                      </div>
                    </div>

                    {/* Financial Breakdown */}
                    <div className="withdrawals-breakdown-card">
                      <div className="withdrawals-breakdown-row">
                        <span>{isId ? "Nominal Pengajuan" : "Requested Amount"}</span>
                        <strong>{formatCurrency(selectedFinancials.amount)}</strong>
                      </div>
                      <div className="withdrawals-breakdown-row">
                        <span>{isId ? "Biaya Administrasi" : "Admin Fee"}</span>
                        <strong>{formatCurrency(selectedFinancials.adminFeeAmount)}</strong>
                      </div>
                      <div className="withdrawals-breakdown-row is-total">
                        <span>{isId ? "Nominal Transfer Bersih" : "Net Transfer Amount"}</span>
                        <span className="withdrawals-breakdown-total">
                          {formatCurrency(selectedFinancials.netTransferAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    <div
                      style={{
                        padding: "14px",
                        borderRadius: "var(--withdrawals-radius-md)",
                        background: "var(--withdrawals-surface-soft)",
                        border: "1px solid var(--withdrawals-border-subtle)",
                      }}
                    >
                      <span className="withdrawals-field-label">
                        {isId ? "Linimasa Proses" : "Status Timeline"}
                      </span>
                      <WithdrawalStatusTimeline withdrawal={selectedWithdrawal} isId={isId} />
                    </div>

                    {/* Operational Action Form (If PENDING or PROCESSING) */}
                    {selectedWithdrawal.status !== "COMPLETED" &&
                      selectedWithdrawal.status !== "REJECTED" && (
                        <>
                          <div className="withdrawals-modal-field">
                            <label
                              htmlFor="admin-note-input"
                              className="withdrawals-field-label"
                              style={{ marginBottom: 4 }}
                            >
                              {isId ? "Catatan Admin (Wajib jika ditolak)" : "Admin Note (Required if rejected)"}
                            </label>
                            <textarea
                              id="admin-note-input"
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              placeholder={
                                isId
                                  ? "Alasan penolakan atau catatan transfer..."
                                  : "Reason for rejection or transfer note..."
                              }
                              style={{
                                width: "100%",
                                padding: "10px",
                                borderRadius: "var(--withdrawals-radius-sm)",
                                border: "1px solid var(--withdrawals-border)",
                                background: "var(--withdrawals-surface)",
                                color: "var(--withdrawals-text)",
                                minHeight: "72px",
                                fontSize: "0.813rem",
                                outline: "none",
                              }}
                            />
                          </div>

                          <div className="withdrawals-upload-zone">
                            <label>
                              {isId
                                ? "Unggah Bukti Transfer (Wajib untuk menyelesaikan)"
                                : "Upload Transfer Receipt (Required to complete)"}
                            </label>
                            <input
                              type="file"
                              onChange={(e) => setProofFile(e.target.files[0])}
                              accept="image/jpeg,image/png,image/webp"
                              style={{ fontSize: "0.8rem", color: "var(--withdrawals-body)" }}
                            />
                            {proofPreviewUrl && (
                              <div className="withdrawals-upload-preview">
                                <img src={proofPreviewUrl} alt="Transfer Proof Preview" />
                                <span style={{ fontSize: "0.75rem", color: "var(--withdrawals-muted)" }}>
                                  {proofFile?.name}
                                </span>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                    {/* Completed / Rejected Read-Only Info */}
                    {(selectedWithdrawal.status === "COMPLETED" ||
                      selectedWithdrawal.status === "REJECTED") && (
                      <div
                        style={{
                          padding: "14px",
                          borderRadius: "var(--withdrawals-radius-md)",
                          background: "var(--withdrawals-surface-soft)",
                          border: "1px solid var(--withdrawals-border-subtle)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        <div className="withdrawals-modal-field">
                          <span className="withdrawals-field-label">
                            {isId ? "Waktu Diproses" : "Processed At"}
                          </span>
                          <span className="withdrawals-field-value">
                            {formatDateTime(selectedWithdrawal.processedAt, isId)}
                          </span>
                        </div>

                        {selectedWithdrawal.adminNote && (
                          <div className="withdrawals-modal-field">
                            <span className="withdrawals-field-label">
                              {isId ? "Catatan Admin" : "Admin Note"}
                            </span>
                            <span className="withdrawals-field-value">
                              {selectedWithdrawal.adminNote}
                            </span>
                          </div>
                        )}

                        {selectedWithdrawal.proofImageUrl && (
                          <div className="withdrawals-modal-field">
                            <span className="withdrawals-field-label">
                              {isId ? "Bukti Struk Transfer" : "Transfer Receipt Proof"}
                            </span>
                            <div style={{ marginTop: 6, position: "relative" }}>
                              <img
                                src={resolveAssetUrl(selectedWithdrawal.proofImageUrl)}
                                alt={isId ? "Bukti Transfer" : "Transfer Receipt"}
                                style={{
                                  width: "100%",
                                  maxHeight: "260px",
                                  objectFit: "contain",
                                  borderRadius: "var(--withdrawals-radius-sm)",
                                  border: "1px solid var(--withdrawals-border)",
                                  background: "#000",
                                }}
                              />
                              <a
                                href={resolveAssetUrl(selectedWithdrawal.proofImageUrl)}
                                target="_blank"
                                rel="noreferrer"
                                className="withdrawals-btn withdrawals-btn--sm"
                                style={{
                                  marginTop: 8,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <ExternalLink size={13} />
                                {isId ? "Buka Gambar Penuh" : "Open Full Image"}
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Modal Footer Actions */}
                  {selectedWithdrawal.status !== "COMPLETED" &&
                    selectedWithdrawal.status !== "REJECTED" && (
                      <div className="withdrawals-modal-actions">
                        <button
                          type="button"
                          disabled={actionLoading || !adminNote.trim()}
                          onClick={() => handleAction("REJECTED")}
                          className="withdrawals-btn withdrawals-btn--danger"
                          style={{ flex: 1 }}
                          title={
                            !adminNote.trim()
                              ? isId
                                ? "Isi catatan admin untuk menolak"
                                : "Admin note required to reject"
                              : ""
                          }
                        >
                          {isId ? "Tolak" : "Reject"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionLoading || selectedWithdrawal.status === "PROCESSING"
                          }
                          onClick={() => handleAction("PROCESSING")}
                          className="withdrawals-btn withdrawals-btn--amber"
                          style={{ flex: 1 }}
                        >
                          {isId ? "Set Diproses" : "Set Processing"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionLoading ||
                            selectedWithdrawal.status !== "PROCESSING" ||
                            !proofFile
                          }
                          onClick={() => handleAction("COMPLETED")}
                          className="withdrawals-btn withdrawals-btn--emerald"
                          style={{ flex: 1 }}
                          title={
                            selectedWithdrawal.status !== "PROCESSING"
                              ? isId
                                ? "Ubah status ke Diproses terlebih dahulu"
                                : "Must be in Processing status first"
                              : !proofFile
                              ? isId
                                ? "Unggah bukti transfer terlebih dahulu"
                                : "Upload transfer proof first"
                              : ""
                          }
                        >
                          {isId ? "Selesaikan" : "Complete"}
                        </button>
                      </div>
                    )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminWithdrawalsPage;
