import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  RotateCcw,
  Search,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import { useSeller2026PaymentReview } from "../../../hooks/seller2026/useSeller2026PaymentReview.ts";
import { downloadCsvFile } from "../../../utils/exportFiles.js";
import { useSellerWorkspaceRoute } from "../../../utils/sellerWorkspaceRoute.js";
import { getSeller2026PagePermissions } from "./seller2026PagePermissions.js";
import "./Seller2026LivePaymentReviewPage.css";

const readPageNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

const formatMoney = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDateTime = (value, isId = false) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export default function Seller2026LivePaymentReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    sellerContext,
    workspaceStoreId: storeId,
    workspaceStoreSlug,
    workspaceRoutes,
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
  const canView = can("ORDER_READ") && can("PAYMENT_STATUS_VIEW");

  const query = {
    search: searchParams.get("q") || "",
    status: searchParams.get("status") || "all",
    paymentMethod: searchParams.get("paymentMethod") || "all",
    page: readPageNumber(searchParams.get("page"), 1),
    limit: readPageNumber(searchParams.get("limit"), 10),
  };

  const review = useSeller2026PaymentReview(storeId, query, {
    enabled: canView,
    canReview: false, // Read-only mode
  });

  const changeQuery = (patch) => {
    const next = new URLSearchParams(searchParams);
    const values = {
      ...patch,
      ...(Object.prototype.hasOwnProperty.call(patch, "page") ? {} : { page: 1 }),
    };
    Object.entries(values).forEach(([key, value]) => {
      const paramKey = key === "search" ? "q" : key;
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        value === "all" ||
        (paramKey === "page" && Number(value) <= 1) ||
        (paramKey === "limit" && Number(value) === 10)
      ) {
        next.delete(paramKey);
      } else {
        next.set(paramKey, String(value));
      }
    });
    setSearchParams(next);
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const exportCsv = () => {
    downloadCsvFile(
      [
        { key: "orderNumber", label: isId ? "No. Pesanan" : "Order Number" },
        { key: "suborderNumber", label: isId ? "No. Suborder" : "Suborder Number" },
        { key: "buyerName", label: isId ? "Pembeli" : "Buyer" },
        { key: "paymentMethod", label: isId ? "Metode Pembayaran" : "Payment Method" },
        { key: "amount", label: isId ? "Jumlah" : "Amount" },
        { key: "paymentStatus", label: isId ? "Status Pembayaran" : "Payment Status" },
        { key: "date", label: isId ? "Waktu Transaksi" : "Transaction Time" },
      ],
      review.data.rows.map((row) => ({
        orderNumber: row.orderNumber,
        suborderNumber: row.suborderNumber,
        buyerName: row.buyerName,
        paymentMethod: row.paymentMethod || "Duitku Gateway",
        amount: row.expectedAmount,
        paymentStatus: row.paymentStatus,
        date: formatDateTime(row.submittedAt || row.createdAt, isId),
      })),
      `riwayat-pembayaran-${workspaceStoreSlug}-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const summary = review.data.summary;
  const counts = review.data.counts;

  const currentTab = query.status;

  return (
    <div className="seller2026-payment-history-container">
      {/* Eyebrow Badge */}
      <div className="sph-eyebrow">
        <Sparkles size={13} />
        <span>{isId ? "Transaksi Gateway Terverifikasi" : "Verified Gateway Settlements"}</span>
      </div>

      {/* Breadcrumb */}
      <nav className="sph-breadcrumb" aria-label="Breadcrumb">
        <Link to={`/seller/stores/${workspaceStoreSlug}`}>{isId ? "Toko" : "Store"}</Link>
        <span>/</span>
        <Link to={`/seller/stores/${workspaceStoreSlug}/withdrawals`}>
          {isId ? "Keuangan" : "Finance"}
        </Link>
        <span>/</span>
        <span className="current">{isId ? "Riwayat Pembayaran" : "Payment History"}</span>
      </nav>

      {/* Header */}
      <header className="sph-header">
        <div>
          <h1>{isId ? "Riwayat Pembayaran Masuk" : "Incoming Payments History"}</h1>
          <p>
            {isId
              ? "Catatan transaksi pembayaran pesanan dari pembeli yang telah terverifikasi otomatis via Payment Gateway Duitku."
              : "Automated payment settlement records from customer orders processed via Duitku Payment Gateway."}
          </p>
        </div>

        <div className="sph-header-actions">
          <button
            type="button"
            className="sph-btn-export"
            onClick={exportCsv}
            disabled={review.data.rows.length === 0}
            title={isId ? "Unduh laporan CSV" : "Export CSV report"}
          >
            <Download size={15} />
            <span>{isId ? "Ekspor CSV" : "Export CSV"}</span>
          </button>
        </div>
      </header>

      {/* 4-Card Summary Grid */}
      <section className="sph-kpi-grid">
        <article className="sph-kpi-card">
          <div className="sph-kpi-icon-wrap is-blue">
            <Wallet size={22} />
          </div>
          <div className="sph-kpi-body">
            <span className="sph-kpi-label">
              {isId ? "Total Dana Terverifikasi" : "Total Settled Revenue"}
            </span>
            <strong className="sph-kpi-value">{formatMoney(summary.verifiedAmount)}</strong>
            <span className="sph-kpi-sub">
              {isId ? "Akumulasi pembayaran pesanan lunas" : "Gross paid order accumulation"}
            </span>
          </div>
        </article>

        <article className="sph-kpi-card">
          <div className="sph-kpi-icon-wrap is-green">
            <CheckCircle2 size={22} />
          </div>
          <div className="sph-kpi-body">
            <span className="sph-kpi-label">{isId ? "Transaksi Lunas" : "Settled Orders"}</span>
            <strong className="sph-kpi-value">
              {counts.approved} {isId ? "Pesanan" : "Orders"}
            </strong>
            <span className="sph-kpi-sub">
              {isId ? "Terverifikasi otomatis gateway" : "Automated gateway settlement"}
            </span>
          </div>
        </article>

        <article className="sph-kpi-card">
          <div className="sph-kpi-icon-wrap is-orange">
            <Clock3 size={22} />
          </div>
          <div className="sph-kpi-body">
            <span className="sph-kpi-label">
              {isId ? "Menunggu Pembayaran" : "Pending Settlement"}
            </span>
            <strong className="sph-kpi-value">
              {counts.awaiting} {isId ? "Pesanan" : "Orders"}
            </strong>
            <span className="sph-kpi-sub">
              {isId ? "Menunggu pelunasan pembeli" : "Awaiting customer payment"}
            </span>
          </div>
        </article>

        <article className="sph-kpi-card">
          <div className="sph-kpi-icon-wrap is-blue">
            <CreditCard size={22} />
          </div>
          <div className="sph-kpi-body">
            <span className="sph-kpi-label">{isId ? "Gateway Pembayaran" : "Payment Rail"}</span>
            <strong className="sph-kpi-value">Duitku Gateway</strong>
            <span className="sph-kpi-sub">
              {isId ? "Otomatis & Terpusat" : "Automated & Central"}
            </span>
          </div>
        </article>
      </section>

      {/* Main Table Card */}
      <section className="sph-table-card">
        {/* Status Tabs */}
        <div className="sph-tabs-bar">
          <button
            type="button"
            className={`sph-tab-btn ${currentTab === "all" ? "is-active" : ""}`}
            onClick={() => changeQuery({ status: "all" })}
          >
            <span>{isId ? "Semua Transaksi" : "All Payments"}</span>
            <span className="sph-tab-count">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`sph-tab-btn ${currentTab === "approved" ? "is-active" : ""}`}
            onClick={() => changeQuery({ status: "approved" })}
          >
            <span>{isId ? "Lunas" : "Settled"}</span>
            <span className="sph-tab-count">{counts.approved}</span>
          </button>
          <button
            type="button"
            className={`sph-tab-btn ${currentTab === "awaiting" ? "is-active" : ""}`}
            onClick={() => changeQuery({ status: "awaiting" })}
          >
            <span>{isId ? "Menunggu" : "Pending"}</span>
            <span className="sph-tab-count">{counts.awaiting}</span>
          </button>
          <button
            type="button"
            className={`sph-tab-btn ${currentTab === "rejected" ? "is-active" : ""}`}
            onClick={() => changeQuery({ status: "rejected" })}
          >
            <span>{isId ? "Batal / Kadaluwarsa" : "Cancelled / Expired"}</span>
            <span className="sph-tab-count">{counts.rejected}</span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="sph-toolbar">
          <div className="sph-search-box">
            <Search size={15} className="sph-search-icon" />
            <input
              type="text"
              className="sph-search-input"
              placeholder={isId ? "Cari nomor invoice, nama pembeli..." : "Search invoice, buyer name..."}
              value={query.search}
              onChange={(e) => changeQuery({ search: e.target.value })}
            />
          </div>

          <div>
            <button
              type="button"
              className="sph-btn-reset"
              onClick={resetFilters}
              title={isId ? "Atur ulang filter" : "Reset filters"}
            >
              <RotateCcw size={14} />
              <span>{isId ? "Atur Ulang" : "Reset"}</span>
            </button>
          </div>
        </div>

        {/* Table Content or Empty State */}
        {review.data.rows.length === 0 ? (
          <div className="sph-empty-state">
            <div className="sph-empty-icon">
              <CreditCard size={28} />
            </div>
            <h2 className="sph-empty-title">
              {isId ? "Belum Ada Riwayat Pembayaran Masuk" : "No Incoming Payments Found"}
            </h2>
            <p className="sph-empty-text">
              {isId
                ? "Transaksi pembayaran dari pembeli via gateway akan otomatis tercatat dan muncul di sini begitu pesanan dibuat atau dilunasi."
                : "Payment transactions from buyers will appear here automatically once orders are placed or settled."}
            </p>
            {(query.search || currentTab !== "all") && (
              <button
                type="button"
                className="sph-btn-reset"
                onClick={resetFilters}
                style={{ padding: "8px 16px" }}
              >
                <span>{isId ? "Hapus Filter Pencarian" : "Clear Filters"}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="sph-table-wrap">
            <table className="sph-table">
              <thead>
                <tr>
                  <th style={{ width: "24%" }}>{isId ? "No. Pesanan" : "Order / Invoice"}</th>
                  <th style={{ width: "22%" }}>{isId ? "Pelanggan" : "Customer"}</th>
                  <th style={{ width: "22%" }}>{isId ? "Metode Pembayaran" : "Payment Method"}</th>
                  <th style={{ width: "16%" }}>{isId ? "Status Pembayaran" : "Payment Status"}</th>
                  <th style={{ width: "16%", textAlign: "right" }}>
                    {isId ? "Jumlah & Aksi" : "Amount & Action"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {review.data.rows.map((row) => {
                  const isPaid = row.paymentStatus === "PAID";
                  const isPending = row.paymentStatus === "PENDING_CONFIRMATION";
                  const isRejected = row.paymentStatus === "REJECTED";

                  return (
                    <tr key={row.id}>
                      {/* Order Identity */}
                      <td>
                        <Link
                          to={workspaceRoutes.orderDetail(row.suborderId)}
                          className="sph-order-link"
                          title={isId ? "Buka detail pesanan" : "View order details"}
                        >
                          {row.orderNumber || row.suborderNumber}
                        </Link>
                        <div className="sph-order-date">
                          {formatDateTime(row.submittedAt || row.createdAt, isId)}
                        </div>
                      </td>

                      {/* Customer */}
                      <td>
                        <div className="sph-buyer-name">{row.buyerName}</div>
                        <div className="sph-buyer-meta">{row.buyerEmail || row.buyer?.phone || "-"}</div>
                      </td>

                      {/* Payment Method */}
                      <td>
                        <span className="sph-method-badge">
                          <CreditCard size={13} style={{ color: "var(--sph-muted)" }} />
                          <span>{row.paymentMethod || "Duitku Gateway"}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className={`sph-status-badge ${
                            isPaid
                              ? "is-paid"
                              : isPending
                              ? "is-pending"
                              : isRejected
                              ? "is-rejected"
                              : "is-unpaid"
                          }`}
                        >
                          <span className="sph-status-dot" />
                          <span>
                            {isPaid
                              ? (isId ? "Lunas" : "Settled")
                              : isPending
                              ? (isId ? "Menunggu Bayar" : "Pending")
                              : isRejected
                              ? (isId ? "Kadaluwarsa" : "Expired")
                              : row.paymentStatusLabel}
                          </span>
                        </span>
                      </td>

                      {/* Amount & Action Button */}
                      <td style={{ textAlign: "right" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "10px",
                          }}
                        >
                          <strong style={{ fontSize: "14px", fontWeight: 700 }}>
                            {formatMoney(row.expectedAmount)}
                          </strong>
                          <Link
                            to={workspaceRoutes.orderDetail(row.suborderId)}
                            className="sph-btn-detail"
                            title={isId ? "Lihat Detail Pesanan" : "View Order Detail"}
                          >
                            <ArrowRight size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
