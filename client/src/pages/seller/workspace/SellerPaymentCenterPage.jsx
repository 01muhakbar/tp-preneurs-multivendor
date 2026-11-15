import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileText,
  HelpCircle,
  History,
  Info,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import { useSellerWorkspace2026PaymentCenter } from "../../../features/sellerWorkspace2026/hooks/useSellerWorkspace2026PaymentCenter.js";
import { resolveAssetUrl } from "../../../lib/assetUrl.js";
import {
  getWithdrawalFinancials,
  getWithdrawalStatusMeta,
} from "../../../lib/withdrawalStatus.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "./SellerWithdrawalsPage2026.css";

const formatMoney = (val) =>
  `Rp ${Number(val || 0).toLocaleString("id-ID")}`;

const formatDate = (val, isId = false) => {
  if (!val) return "-";
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

const maskAccountNumber = (val) => {
  const s = String(val || "").replace(/\s+/g, "");
  if (!s || s === "-") return "-";
  if (s.length <= 4) return s;
  return `${"*".repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
};

export function SellerPaymentCenterPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sellerContext, workspaceStoreSlug, isId = false } = useSellerWorkspaceRoute();
  const { can } = getSeller2026PagePermissions(sellerContext);
  const canView = can("STORE_VIEW") || can("PAYMENT_PROFILE_VIEW") || can("PAYMENT_STATUS_VIEW");

  const {
    data,
    loading,
    error,
    refetch,
    actions,
    actionState,
    withdrawals = [],
    withdrawalMeta,
  } = useSellerWorkspace2026PaymentCenter(workspaceStoreSlug);

  const [activeTab, setActiveTab] = useState("history"); // "history" | "breakdown"
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [proofModalUrl, setProofModalUrl] = useState(null);

  // Available Balance calculation
  const balanceObj = withdrawalMeta?.balance || {};
  const availableBalance = Number(
    balanceObj.availableBalance ??
    withdrawalMeta?.availableBalance ??
    data?.summary?.estimatedPayoutAmount ??
    0
  );
  const grossEligibleAmount = Number(
    balanceObj.grossEligibleAmount ??
    data?.summary?.estimatedPayoutAmount ??
    0
  );
  const deliveredEligibleCount = Number(
    balanceObj.deliveredEligibleCount ??
    data?.summary?.withdrawalEligiblePayments ??
    0
  );
  const waitingDeliveryCount = Number(
    balanceObj.waitingDeliveryCount ??
    data?.summary?.awaitingDeliveredPayments ??
    0
  );

  // Payout Destination Profile
  const payoutProfile = data?.payoutProfile || {};
  const payoutDestination = payoutProfile.destination || null;
  const payoutActive = payoutProfile.activationStatus === "Active";

  // Withdrawal preview financials
  const withdrawalPreview = getWithdrawalFinancials(withdrawAmount || 0, {
    adminFeeAmount: balanceObj.withdrawalAdminFeeAmount || 6500,
  });

  // Filtered withdrawals list
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter((item) => {
      const statusMatch =
        statusFilter === "ALL" ||
        String(item.status || "").toUpperCase() === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      if (!q) return statusMatch;

      const searchable = [
        String(item.id || ""),
        String(item.bankName || ""),
        String(item.accountNumber || ""),
        String(item.accountName || ""),
        String(item.amount || ""),
      ]
        .join(" ")
        .toLowerCase();

      return statusMatch && searchable.includes(q);
    });
  }, [withdrawals, statusFilter, searchQuery]);

  // Orders Breakdown from payment reviews / orders
  const paidOrdersList = useMemo(() => {
    const list = Array.isArray(data?.paymentReviews) ? data.paymentReviews : [];
    return list;
  }, [data?.paymentReviews]);

  const handleSubmitWithdrawal = async () => {
    const amountNum = Number(withdrawAmount);
    if (!amountNum || amountNum < 50000 || amountNum > availableBalance) return;

    const res = await actions.requestWithdrawal(amountNum);
    if (res?.success) {
      setIsWithdrawModalOpen(false);
      setWithdrawAmount("");
    }
  };

  const handleQuickAmount = (amount) => {
    setWithdrawAmount(Math.min(amount, availableBalance));
  };

  if (!canView) {
    return (
      <div className="seller-withdrawals-2026">
        <div className="sw-info-banner" style={{ background: "rgba(239, 68, 68, 0.15)", borderColor: "#ef4444" }}>
          <ShieldCheck size={20} className="sw-info-banner__icon" style={{ color: "#ef4444" }} />
          <div>
            <strong>{isId ? "Akses Dibatasi" : "Access Restricted"}</strong>
            <p>{isId ? "Anda tidak memiliki izin untuk melihat modul penarikan dana." : "You do not have permission to view store withdrawals."}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="seller-withdrawals-2026">
      {/* Header */}
      <header className="sw-header">
        <div className="sw-header__titles">
          <h1>
            <Wallet size={26} style={{ color: "#fe6f05" }} />
            <span>{isId ? "Penarikan Dana" : "Withdrawals"}</span>
          </h1>
          <p>
            {isId
              ? "Kelola saldo toko, pengajuan penarikan dana, dan riwayat transfer."
              : "Manage store balance, withdrawal requests, and payout history."}
          </p>
        </div>

        <div className="sw-header__actions">
          <button
            type="button"
            className="sw-btn sw-btn--outline"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            <span>{loading ? (isId ? "Memuat..." : "Refreshing...") : (isId ? "Segarkan" : "Refresh")}</span>
          </button>

          <Link
            to={sellerContext?.store?.slug ? `/seller/stores/${sellerContext.store.slug}/payment-setup` : "#"}
            className="sw-btn sw-btn--outline"
          >
            <Building2 size={15} />
            <span>{isId ? "Pengaturan Rekening" : "Payment Setup"}</span>
          </Link>

          <button
            type="button"
            className="sw-btn sw-btn--primary"
            style={{ backgroundColor: "#034c85" }}
            disabled={!payoutActive || availableBalance < 50000 || actionState.isUpdating}
            title={
              !payoutActive
                ? (isId ? "Pengaturan rekening bank aktif diperlukan sebelum penarikan." : "Active bank account setup is required for withdrawal.")
                : availableBalance < 50000
                ? (isId ? "Saldo tersedia minimal Rp 50.000 untuk penarikan." : "Minimum available balance is Rp 50,000 for withdrawal.")
                : (isId ? "Ajukan pencairan dana" : "Request withdrawal")
            }
            onClick={() => setIsWithdrawModalOpen(true)}
          >
            <CreditCard size={15} />
            <span>{isId ? "Ajukan Penarikan" : "Request Withdrawal"}</span>
          </button>
        </div>
      </header>

      {/* Action / Error Notification */}
      {(actionState.error || actionState.successMessage || error) && (
        <div
          className="sw-info-banner"
          style={{
            background: actionState.successMessage ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
            borderColor: actionState.successMessage ? "#10b981" : "#ef4444",
          }}
        >
          {actionState.successMessage ? (
            <CheckCircle2 size={18} className="sw-info-banner__icon" style={{ color: "#10b981" }} />
          ) : (
            <AlertTriangle size={18} className="sw-info-banner__icon" style={{ color: "#ef4444" }} />
          )}
          <div>
            <span>
              {actionState.successMessage || actionState.error || error?.message || (isId ? "Terjadi kesalahan." : "An error occurred.")}
            </span>
          </div>
        </div>
      )}

      {/* 4 Modern KPI Cards */}
      <section className="sw-kpi-grid">
        {/* Card 1: Saldo Tersedia (Hero) */}
        <div className="sw-kpi-card sw-kpi-card--hero">
          <div className="sw-kpi-card__top">
            <span className="sw-kpi-card__label">{isId ? "Saldo Tersedia" : "Available Balance"}</span>
            <span className="sw-kpi-card__icon sw-kpi-card__icon--accent">
              <Wallet size={20} />
            </span>
          </div>
          <div className="sw-kpi-card__value" style={{ color: "#fe6f05" }}>
            {formatMoney(availableBalance)}
          </div>
          <div className="sw-kpi-card__hint">
            <Check size={14} style={{ color: "#10b981" }} />
            <span>{isId ? "Siap ditarik ke rekening bank" : "Ready for bank withdrawal"}</span>
          </div>
        </div>

        {/* Card 2: Total Penjualan Selesai */}
        <div className="sw-kpi-card">
          <div className="sw-kpi-card__top">
            <span className="sw-kpi-card__label">{isId ? "Penjualan Selesai" : "Completed Sales"}</span>
            <span className="sw-kpi-card__icon sw-kpi-card__icon--emerald">
              <PackageCheck size={20} />
            </span>
          </div>
          <div className="sw-kpi-card__value">
            {formatMoney(grossEligibleAmount)}
          </div>
          <div className="sw-kpi-card__hint">
            <span>{deliveredEligibleCount} {isId ? "pesanan telah diterima pembeli" : "orders delivered to buyer"}</span>
          </div>
        </div>

        {/* Card 3: Menunggu Diterima Pembeli */}
        <div className="sw-kpi-card">
          <div className="sw-kpi-card__top">
            <span className="sw-kpi-card__label">{isId ? "Menunggu Diterima" : "Pending Delivery"}</span>
            <span className="sw-kpi-card__icon sw-kpi-card__icon--primary">
              <Truck size={20} />
            </span>
          </div>
          <div className="sw-kpi-card__value">
            {waitingDeliveryCount} <small style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--sw-text-muted)" }}>{isId ? "Pesanan" : "Orders"}</small>
          </div>
          <div className="sw-kpi-card__hint">
            <Clock3 size={13} />
            <span>{isId ? "Saldo bertambah saat barang diterima" : "Funds unlock upon delivery receipt"}</span>
          </div>
        </div>

        {/* Card 4: Rekening Penarikan */}
        <div className="sw-kpi-card">
          <div className="sw-kpi-card__top">
            <span className="sw-kpi-card__label">{isId ? "Rekening Bank" : "Payout Bank"}</span>
            <span className={`sw-kpi-card__badge ${payoutActive ? "sw-kpi-card__badge--green" : "sw-kpi-card__badge--amber"}`}>
              {payoutActive ? (isId ? "Aktif" : "Active") : (isId ? "Belum Diatur" : "Incomplete")}
            </span>
          </div>
          <div className="sw-kpi-card__value" style={{ fontSize: "1.2rem", fontWeight: 600 }}>
            {payoutDestination?.bankName || (isId ? "Belum Diatur" : "Not Set")}
          </div>
          <div className="sw-kpi-card__hint">
            <span>
              {payoutDestination?.accountNumberMasked || maskAccountNumber(payoutDestination?.accountNumber)}
              {payoutDestination?.accountHolderName ? ` (${payoutDestination.accountHolderName})` : ""}
            </span>
          </div>
        </div>
      </section>

      {/* Info Callout: Escrow Mechanism Explanation */}
      <div className="sw-info-banner">
        <Info size={18} className="sw-info-banner__icon" />
        <div>
          <strong>{isId ? "Prinsip Pelepasan Saldo Toko:" : "Store Fund Release Policy:"}</strong>{" "}
          <span>
            {isId
              ? "Saldo hasil transaksi penjualan otomatis bertambah ke Saldo Tersedia setelah pesanan dinyatakan telah diterima oleh Pembeli (atau ditandai Selesai oleh Penjual/Admin). Penarikan dana diproses oleh Admin dengan biaya admin Rp 6.500 per transfer."
              : "Sale proceeds automatically credit to Available Balance once the order is confirmed as Delivered by the Buyer (or marked Completed by Seller/Admin). Withdrawals are processed by Admin with a standard Rp 6,500 bank fee."}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <nav className="sw-tabs" aria-label="Withdrawal Views">
        <button
          type="button"
          className={`sw-tab-btn ${activeTab === "history" ? "is-active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <History size={16} />
          <span>{isId ? "Riwayat Penarikan" : "Withdrawal History"}</span>
          <span className="sw-tab-badge">{withdrawals.length}</span>
        </button>

        <button
          type="button"
          className={`sw-tab-btn ${activeTab === "breakdown" ? "is-active" : ""}`}
          onClick={() => setActiveTab("breakdown")}
        >
          <FileText size={16} />
          <span>{isId ? "Rincian Saldo Pesanan" : "Order Balance Breakdown"}</span>
          <span className="sw-tab-badge">{paidOrdersList.length}</span>
        </button>
      </nav>

      {/* TAB 1: WITHDRAWALS HISTORY */}
      {activeTab === "history" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Toolbar */}
          <div className="sw-toolbar">
            <div className="sw-toolbar__left">
              <div className="sw-search-input">
                <Search size={16} style={{ color: "var(--sw-text-dim)" }} />
                <input
                  type="text"
                  placeholder={isId ? "Cari nomor ID, bank, rekening..." : "Search ID, bank, account..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sw-text-dim)" }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <select
                className="sw-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">{isId ? "Semua Status" : "All Status"}</option>
                <option value="PENDING">{isId ? "Menunggu (Pending)" : "Pending"}</option>
                <option value="PROCESSING">{isId ? "Diproses (Processing)" : "Processing"}</option>
                <option value="COMPLETED">{isId ? "Selesai (Completed)" : "Completed"}</option>
                <option value="REJECTED">{isId ? "Ditolak (Rejected)" : "Rejected"}</option>
              </select>

              {(searchQuery || statusFilter !== "ALL") && (
                <button
                  type="button"
                  className="sw-btn sw-btn--outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("ALL");
                  }}
                  style={{ padding: "0.5rem 0.75rem", fontSize: "0.78rem" }}
                >
                  <RefreshCw size={13} /> {isId ? "Reset Filter" : "Reset Filters"}
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="sw-table-card">
            {filteredWithdrawals.length > 0 ? (
              <div className="sw-table-wrap">
                <table className="sw-table">
                  <thead>
                    <tr>
                      <th>{isId ? "No. Pengajuan & Tanggal" : "Reference & Date"}</th>
                      <th>{isId ? "Rekening Tujuan" : "Destination Account"}</th>
                      <th>{isId ? "Nominal Pengajuan" : "Requested Amount"}</th>
                      <th>{isId ? "Biaya Admin" : "Admin Fee"}</th>
                      <th>{isId ? "Estimasi Diterima" : "Net Received"}</th>
                      <th>Status</th>
                      <th>{isId ? "Bukti / Catatan" : "Proof / Note"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWithdrawals.map((item) => {
                      const meta = getWithdrawalStatusMeta(item.status, { isId });
                      const financials = getWithdrawalFinancials(item, {
                        adminFeeAmount: balanceObj.withdrawalAdminFeeAmount || 6500,
                      });
                      const isCompleted = String(item.status).toUpperCase() === "COMPLETED";
                      const isRejected = String(item.status).toUpperCase() === "REJECTED";
                      const isPending = String(item.status).toUpperCase() === "PENDING";

                      return (
                        <tr key={item.id}>
                          <td>
                            <strong>#WDR-{String(item.id).padStart(4, "0")}</strong>
                            <div style={{ fontSize: "0.74rem", color: "var(--sw-text-dim)", marginTop: "2px" }}>
                              {formatDate(item.requestedAt || item.createdAt, isId)}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.bankName || "-"}</div>
                            <div style={{ fontSize: "0.74rem", color: "var(--sw-text-dim)" }}>
                              {maskAccountNumber(item.accountNumber)} {item.accountName ? `a.n ${item.accountName}` : ""}
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: "var(--sw-text)" }}>{formatMoney(financials.amount)}</strong>
                          </td>
                          <td style={{ color: "var(--sw-text-dim)" }}>
                            -{formatMoney(financials.adminFeeAmount)}
                          </td>
                          <td>
                            <strong style={{ color: "#10b981", fontSize: "0.9rem" }}>
                              {formatMoney(financials.netTransferAmount)}
                            </strong>
                          </td>
                          <td>
                            <span className={`sw-status-pill sw-status-pill--${meta.pillTone}`}>
                              {isCompleted && <CheckCircle2 size={12} />}
                              {isPending && <Clock3 size={12} />}
                              {isRejected && <AlertCircle size={12} />}
                              <span>{meta.label}</span>
                            </span>
                          </td>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                              {item.proofImageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setProofModalUrl(resolveAssetUrl(item.proofImageUrl))}
                                  className="sw-btn sw-btn--outline"
                                  style={{ padding: "0.25rem 0.55rem", fontSize: "0.72rem", width: "fit-content" }}
                                >
                                  <Eye size={12} />
                                  <span>{isId ? "Bukti Transfer" : "Transfer Proof"}</span>
                                </button>
                              ) : null}

                              {item.adminNote ? (
                                <span style={{ fontSize: "0.72rem", color: "var(--sw-text-dim)", fontStyle: "italic" }}>
                                  "{item.adminNote}"
                                </span>
                              ) : null}

                              {!item.proofImageUrl && !item.adminNote ? (
                                <span style={{ color: "var(--sw-text-dim)" }}>-</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sw-empty">
                <div className="sw-empty__icon">
                  <Wallet size={28} />
                </div>
                <h3>{isId ? "Belum Ada Riwayat Penarikan" : "No Withdrawal History"}</h3>
                <p>
                  {isId
                    ? "Permintaan pencairan dana yang diajukan akan tercatat di sini dan diproses langsung oleh Admin."
                    : "Submitted payout requests will appear here and are processed directly by the Admin."}
                </p>
                {availableBalance >= 50000 && payoutActive && (
                  <button
                    type="button"
                    className="sw-btn sw-btn--primary"
                    style={{ backgroundColor: "#034c85", marginTop: "0.5rem" }}
                    onClick={() => setIsWithdrawModalOpen(true)}
                  >
                    <CreditCard size={15} />
                    <span>{isId ? "Ajukan Penarikan Sekarang" : "Request Withdrawal Now"}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ORDER BALANCE BREAKDOWN */}
      {activeTab === "breakdown" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="sw-table-card">
            {paidOrdersList.length > 0 ? (
              <div className="sw-table-wrap">
                <table className="sw-table">
                  <thead>
                    <tr>
                      <th>Invoice / Order</th>
                      <th>{isId ? "Pembeli" : "Buyer"}</th>
                      <th>{isId ? "Metode Pembayaran" : "Payment Method"}</th>
                      <th>{isId ? "Total Transaksi" : "Amount"}</th>
                      <th>{isId ? "Status Pengiriman & Saldo" : "Delivery & Balance Status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paidOrdersList.map((row) => {
                      const isRowDelivered =
                        String(row.fulfillmentStatus || "").toUpperCase() === "DELIVERED" ||
                        String(row.status || "").toLowerCase().includes("delivered");

                      return (
                        <tr key={row.id}>
                          <td>
                            <strong>{row.invoiceNumber || row.orderId || "-"}</strong>
                            <div style={{ fontSize: "0.74rem", color: "var(--sw-text-dim)" }}>
                              {formatDate(row.submittedAt, isId)}
                            </div>
                          </td>
                          <td>
                            <div>{row.buyerName || "Pelanggan"}</div>
                            <div style={{ fontSize: "0.74rem", color: "var(--sw-text-dim)" }}>
                              {row.buyerPhone || row.buyerEmail || ""}
                            </div>
                          </td>
                          <td>
                            <span>{row.method || "Duitku"}</span>
                          </td>
                          <td>
                            <strong style={{ color: "var(--sw-text)" }}>{formatMoney(row.amount)}</strong>
                          </td>
                          <td>
                            {isRowDelivered ? (
                              <span className="sw-status-pill sw-status-pill--completed">
                                <CheckCircle2 size={12} />
                                <span>{isId ? "Diterima (Saldo Aktif)" : "Delivered (Unlocked)"}</span>
                              </span>
                            ) : (
                              <span className="sw-status-pill sw-status-pill--pending">
                                <Clock3 size={12} />
                                <span>{isId ? "Dalam Pengiriman (Menunggu Diterima)" : "In Transit (Locked)"}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="sw-empty">
                <div className="sw-empty__icon">
                  <PackageCheck size={28} />
                </div>
                <h3>{isId ? "Belum Ada Pesanan Terbayar" : "No Paid Orders Yet"}</h3>
                <p>
                  {isId
                    ? "Pesanan yang sudah dibayar oleh pembeli akan muncul di sini untuk memantau pelepasan dana penarikan."
                    : "Orders paid by customers will appear here to monitor fund release for withdrawal."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* WITHDRAWAL REQUEST MODAL */}
      {isWithdrawModalOpen && (
        <div className="sw-modal-backdrop" onClick={() => setIsWithdrawModalOpen(false)}>
          <div className="sw-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="sw-modal__head">
              <h2>
                <CreditCard size={20} style={{ color: "#fe6f05" }} />
                <span>{isId ? "Ajukan Penarikan Dana" : "Request Withdrawal"}</span>
              </h2>
              <button
                type="button"
                className="sw-modal__close"
                onClick={() => setIsWithdrawModalOpen(false)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Balance */}
            <div className="sw-modal__balance-card">
              <div>
                <div style={{ fontSize: "0.75rem", color: "var(--sw-text-muted)" }}>{isId ? "Saldo Tersedia" : "Available Balance"}</div>
                <strong style={{ fontSize: "1.25rem", color: "#fe6f05" }}>{formatMoney(availableBalance)}</strong>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--sw-text-muted)" }}>{isId ? "Bank Tujuan" : "Destination Bank"}</div>
                <strong style={{ fontSize: "0.85rem", color: "var(--sw-text)" }}>
                  {payoutDestination?.bankName || "-"}
                </strong>
                <div style={{ fontSize: "0.72rem", color: "var(--sw-text-dim)" }}>
                  {payoutDestination?.accountNumberMasked || maskAccountNumber(payoutDestination?.accountNumber)}
                </div>
              </div>
            </div>

            {/* Input Nominal */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--sw-text)" }}>
                {isId ? "Nominal Penarikan (Rp)" : "Withdrawal Amount (Rp)"}
              </label>
              <div className="sw-search-input" style={{ maxWidth: "none", borderColor: "var(--sw-primary)" }}>
                <span style={{ fontWeight: 700, color: "var(--sw-text)" }}>Rp</span>
                <input
                  type="number"
                  min="50000"
                  max={availableBalance}
                  step="10000"
                  placeholder={isId ? "Minimal Rp 50.000" : "Minimum Rp 50,000"}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  style={{ fontSize: "0.95rem", fontWeight: 600 }}
                />
              </div>
            </div>

            {/* Quick Amount Chips */}
            <div className="sw-quick-chips">
              <button type="button" className="sw-chip-btn" onClick={() => handleQuickAmount(50000)}>
                Rp 50rb
              </button>
              <button type="button" className="sw-chip-btn" onClick={() => handleQuickAmount(100000)}>
                Rp 100rb
              </button>
              <button type="button" className="sw-chip-btn" onClick={() => handleQuickAmount(250000)}>
                Rp 250rb
              </button>
              <button type="button" className="sw-chip-btn" onClick={() => handleQuickAmount(availableBalance)}>
                {isId ? "Semua" : "Max"}
              </button>
            </div>

            {/* Realtime Breakdown */}
            <div className="sw-breakdown-box">
              <div className="sw-breakdown-row">
                <span>{isId ? "Nominal Penarikan" : "Requested Amount"}</span>
                <span>{formatMoney(withdrawalPreview.amount)}</span>
              </div>
              <div className="sw-breakdown-row">
                <span>{isId ? "Biaya Admin Transfer" : "Bank Admin Fee"}</span>
                <span>-{formatMoney(withdrawalPreview.adminFeeAmount)}</span>
              </div>
              <div className="sw-breakdown-row is-total">
                <span>{isId ? "Estimasi Bersih Diterima" : "Estimated Received"}</span>
                <span style={{ color: "#10b981", fontSize: "0.95rem" }}>
                  {formatMoney(withdrawalPreview.netTransferAmount)}
                </span>
              </div>
            </div>

            <p style={{ fontSize: "0.72rem", color: "var(--sw-text-dim)", margin: 0, lineHeight: 1.4 }}>
              {isId
                ? "* Biaya transfer antarbank sebesar Rp 6.500 dipotong otomatis dari nominal pencairan saat transfer diproses oleh Admin."
                : "* Standard Rp 6,500 bank fee is deducted from the payout amount when processed by Admin."}
            </p>

            {/* Modal Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.6rem", marginTop: "0.5rem" }}>
              <button
                type="button"
                className="sw-btn sw-btn--outline"
                onClick={() => setIsWithdrawModalOpen(false)}
                disabled={actionState.isUpdating}
              >
                {isId ? "Batal" : "Cancel"}
              </button>

              <button
                type="button"
                className="sw-btn sw-btn--primary"
                style={{ backgroundColor: "#034c85" }}
                disabled={
                  actionState.isUpdating ||
                  !withdrawAmount ||
                  Number(withdrawAmount) < 50000 ||
                  Number(withdrawAmount) > availableBalance
                }
                onClick={handleSubmitWithdrawal}
              >
                {actionState.isUpdating ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{isId ? "Mengirim..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <ArrowDownToLine size={15} />
                    <span>{isId ? "Kirim Pengajuan" : "Submit Request"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER PROOF PREVIEW MODAL */}
      {proofModalUrl && (
        <div className="sw-modal-backdrop" onClick={() => setProofModalUrl(null)}>
          <div
            className="sw-modal"
            style={{ maxWidth: "560px" }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sw-modal__head">
              <h2>
                <CheckCircle2 size={20} style={{ color: "#10b981" }} />
                <span>{isId ? "Bukti Transfer Pencairan" : "Transfer Proof Receipt"}</span>
              </h2>
              <button
                type="button"
                className="sw-modal__close"
                onClick={() => setProofModalUrl(null)}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ maxHeight: "450px", overflow: "auto", borderRadius: "0.75rem", background: "rgba(0,0,0,0.2)", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <img
                src={proofModalUrl}
                alt="Bukti Transfer"
                style={{ maxWidth: "100%", maxHeight: "420px", objectFit: "contain", borderRadius: "0.5rem" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <a
                href={proofModalUrl}
                target="_blank"
                rel="noreferrer"
                className="sw-btn sw-btn--outline"
                style={{ fontSize: "0.78rem" }}
              >
                <ExternalLink size={13} />
                <span>{isId ? "Buka Gambar Penuh" : "Open Full Image"}</span>
              </a>

              <button
                type="button"
                className="sw-btn sw-btn--primary"
                style={{ backgroundColor: "#034c85" }}
                onClick={() => setProofModalUrl(null)}
              >
                {isId ? "Tutup" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Export aliases for backwards compatibility and clarity
export const SellerWithdrawalsPage = SellerPaymentCenterPage;
export default SellerPaymentCenterPage;
