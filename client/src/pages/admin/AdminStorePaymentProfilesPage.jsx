import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  QrCode,
  RefreshCw,
  Search,
  ShieldCheck,
  Store,
  UserCheck,
  Wrench,
  X,
} from "lucide-react";
import {
  fetchAdminStorePaymentProfiles,
  reviewAdminStorePaymentProfile,
  updateAdminStoreIdentity,
} from "../../api/storePaymentProfiles.ts";
import "./AdminStorePaymentProfilesPage.css";

const text = (value, fallback = "-") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const percent = (value) => Math.max(0, Math.min(100, Number(value || 0)));

const getRequestStatus = (entry) =>
  String(entry?.pendingRequest?.requestStatus || entry?.workflow?.requestState?.code || "")
    .trim()
    .toUpperCase();

const hasProfileQris = (profile) => Boolean(profile?.qrisImageUrl);

const isCheckoutReady = (entry) => {
  const profile = entry?.paymentProfile;
  return Boolean(profile?.isActive && (profile?.readiness?.isReady || hasProfileQris(profile)));
};

const getLane = (entry) => {
  const requestStatus = getRequestStatus(entry);
  const profile = entry?.paymentProfile;
  const governance = entry?.workflow?.governance || {};
  const hasSubmittedRequest = requestStatus === "SUBMITTED";

  if (hasSubmittedRequest || governance.canApprovePromotion) {
    return { key: "pending", label: "Menunggu Review", tone: "pending", action: true };
  }
  if (requestStatus === "NEEDS_REVISION") {
    return { key: "revision", label: "Perlu Revisi", tone: "revision", action: false };
  }
  if (isCheckoutReady(entry)) {
    return { key: "active", label: "Aktif / Terverifikasi", tone: "active", action: false };
  }
  return { key: "incomplete", label: "Belum Lengkap", tone: "incomplete", action: false };
};

const getMissingLabels = (entry) => {
  const missing =
    entry?.paymentProfile?.readiness?.missingFields ||
    entry?.pendingRequest?.readiness?.missingFields ||
    entry?.workflow?.completeness?.missingFields ||
    [];
  return missing.map((field) => field.label || field.key).filter(Boolean);
};

const getReadinessItems = (entry) => {
  const checklist = Array.isArray(entry?.workspaceReadiness?.checklist)
    ? entry.workspaceReadiness.checklist
    : [];
  const byText = (needle) =>
    checklist.find((item) => String(item.label || item.key || "").toLowerCase().includes(needle));

  const store = byText("store");
  const shipping = byText("shipping");
  const payment = byText("payment");
  const product = byText("product");

  return [
    { label: "Toko", value: store?.status?.label || entry?.store?.status || "Aktif", tone: store?.status?.tone || "neutral" },
    { label: "Pengiriman", value: shipping?.status?.label || "Perlu Update", tone: shipping?.status?.tone || "warning" },
    { label: "Pembayaran", value: payment?.status?.label || (isCheckoutReady(entry) ? "Siap" : "Belum Diatur"), tone: isCheckoutReady(entry) ? "success" : "danger" },
    { label: "Produk", value: product?.status?.label || "Belum Ada", tone: product?.status?.tone || "warning" },
  ];
};

export default function AdminStorePaymentProfilesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("directory"); // "queue" | "directory"
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [selectedStoreForReview, setSelectedStoreForReview] = useState(null);
  const [selectedStoreForIdentity, setSelectedStoreForIdentity] = useState(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState(null);
  const [reviewDraft, setReviewDraft] = useState({ action: null, note: "" });

  const profilesQuery = useQuery({
    queryKey: ["admin-store-payment-profiles"],
    queryFn: fetchAdminStorePaymentProfiles,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ storeId, payload }) => reviewAdminStorePaymentProfile(storeId, payload),
    onSuccess: async () => {
      toast.success("Status pembayaran toko berhasil diperbarui");
      setSelectedStoreForReview(null);
      setReviewDraft({ action: null, note: "" });
      await queryClient.invalidateQueries({ queryKey: ["admin-store-payment-profiles"] });
      profilesQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Gagal memperbarui status pembayaran."
      );
    },
  });

  const identityMutation = useMutation({
    mutationFn: ({ storeId, payload }) => updateAdminStoreIdentity(storeId, payload),
    onSuccess: async () => {
      toast.success("Identitas toko berhasil diperbarui");
      setSelectedStoreForIdentity(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-store-payment-profiles"] });
      profilesQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Gagal memperbarui identitas toko."
      );
    },
  });

  const rawItems = useMemo(
    () => (Array.isArray(profilesQuery.data) ? profilesQuery.data.filter((item) => item?.store?.id) : []),
    [profilesQuery.data]
  );

  const summary = useMemo(() => {
    const active = rawItems.filter((entry) => getLane(entry).key === "active").length;
    const pending = rawItems.filter((entry) => getLane(entry).key === "pending").length;
    const followUp = rawItems.filter((entry) => getLane(entry).key === "revision").length;
    const setup = rawItems.filter((entry) => getLane(entry).key === "incomplete").length;
    return { active, pending, followUp, setup, total: rawItems.length };
  }, [rawItems]);

  // Stores in queue
  const queueItems = useMemo(() => {
    return rawItems.filter((entry) => getLane(entry).key === "pending");
  }, [rawItems]);

  // Filtered and searched stores for directory
  const filteredDirectoryItems = useMemo(() => {
    let result = rawItems;

    if (filterStatus !== "all") {
      result = result.filter((entry) => getLane(entry).key === filterStatus);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((entry) => {
        const storeName = String(entry.store?.name || "").toLowerCase();
        const storeSlug = String(entry.store?.slug || "").toLowerCase();
        const ownerName = String(entry.owner?.name || "").toLowerCase();
        const ownerEmail = String(entry.owner?.email || "").toLowerCase();
        const bankName = String(entry.paymentProfile?.bankName || entry.pendingRequest?.bankName || "").toLowerCase();
        const accountNum = String(entry.paymentProfile?.accountNumber || entry.pendingRequest?.accountNumber || "").toLowerCase();
        const accountHolder = String(entry.paymentProfile?.accountHolderName || entry.pendingRequest?.accountHolderName || "").toLowerCase();
        return (
          storeName.includes(q) ||
          storeSlug.includes(q) ||
          ownerName.includes(q) ||
          ownerEmail.includes(q) ||
          bankName.includes(q) ||
          accountNum.includes(q) ||
          accountHolder.includes(q)
        );
      });
    }

    return result;
  }, [rawItems, filterStatus, search]);

  // Pagination slice
  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredDirectoryItems.slice(start, start + pageSize);
  }, [filteredDirectoryItems, page, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredDirectoryItems.length / pageSize));

  const handleReviewAction = (storeId, action, note = "") => {
    reviewMutation.mutate({
      storeId,
      payload: {
        action,
        decision: action,
        status: action,
        note: note || null,
        adminNote: note || null,
        reviewNote: note || null,
      },
    });
  };

  if (profilesQuery.isLoading) {
    return (
      <div className="admin-store-payment-profiles-page">
        <div className="aspp-empty-queue">
          <RefreshCw size={32} className="animate-spin text-sky-500 mb-3" />
          <h3>Memuat Data Profil Pembayaran Toko...</h3>
          <p>Mengambil data rekening payout dan QRIS toko dari server.</p>
        </div>
      </div>
    );
  }

  if (profilesQuery.isError) {
    return (
      <div className="admin-store-payment-profiles-page">
        <div className="aspp-empty-queue" style={{ borderColor: "rgba(239, 68, 68, 0.4)" }}>
          <AlertTriangle size={36} className="text-red-500 mb-2" />
          <h3>Gagal Memuat Profil Pembayaran</h3>
          <p>{profilesQuery.error?.message || "Terjadi kesalahan pada sambungan server."}</p>
          <button
            type="button"
            className="aspp-btn aspp-btn--primary"
            style={{ marginTop: 16 }}
            onClick={() => profilesQuery.refetch()}
          >
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-store-payment-profiles-page">
      {/* Header & KPI Card */}
      <section className="aspp-header-card">
        <div className="aspp-header-top">
          <div>
            <span className="aspp-eyebrow">
              <Building2 size={12} />
              Manajemen Pembayaran Toko
            </span>
            <h1 className="aspp-title">Verifikasi Pembayaran & Payout Toko</h1>
            <p className="aspp-subtitle">
              Validasi rekening bank pencairan dana (*payout*) dan instrumen QRIS toko penjual untuk memastikan kelayakan transaksi penarikan saldo dan penerimaan pesanan.
            </p>
          </div>

          <div className="aspp-header-actions">
            <span className="aspp-badge-count">
              <Store size={14} />
              {summary.total} Toko Terdaftar
            </span>
            <button
              type="button"
              className="aspp-btn-refresh"
              onClick={() => {
                profilesQuery.refetch();
                toast.success("Data diperbarui");
              }}
            >
              <RefreshCw size={14} />
              Segarkan
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="aspp-kpis-grid">
          <div className="aspp-kpi-card aspp-kpi-card--green">
            <div className="aspp-kpi-icon">
              <CheckCircle2 size={22} />
            </div>
            <div className="aspp-kpi-content">
              <span className="aspp-kpi-val">{summary.active}</span>
              <span className="aspp-kpi-lbl">Aktif / Siap Payout</span>
              <span className="aspp-kpi-helper">Rekening terverifikasi aktif</span>
            </div>
          </div>

          <div
            className={`aspp-kpi-card aspp-kpi-card--amber ${
              summary.pending > 0 ? "aspp-kpi-highlight" : ""
            }`}
          >
            <div className="aspp-kpi-icon">
              <Clock3 size={22} />
            </div>
            <div className="aspp-kpi-content">
              <span className="aspp-kpi-val">{summary.pending}</span>
              <span className="aspp-kpi-lbl">Menunggu Verifikasi</span>
              <span className="aspp-kpi-helper">Pengajuan butuh tindakan admin</span>
            </div>
          </div>

          <div className="aspp-kpi-card aspp-kpi-card--blue">
            <div className="aspp-kpi-icon">
              <FileText size={22} />
            </div>
            <div className="aspp-kpi-content">
              <span className="aspp-kpi-val">{summary.followUp}</span>
              <span className="aspp-kpi-lbl">Perlu Revisi</span>
              <span className="aspp-kpi-helper">Menunggu respons penjual</span>
            </div>
          </div>

          <div className="aspp-kpi-card aspp-kpi-card--purple">
            <div className="aspp-kpi-icon">
              <Wrench size={22} />
            </div>
            <div className="aspp-kpi-content">
              <span className="aspp-kpi-val">{summary.setup}</span>
              <span className="aspp-kpi-lbl">Belum Lengkap</span>
              <span className="aspp-kpi-helper">Profil belum diisi penjual</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Bar */}
      <div className="aspp-tabs-bar" role="tablist">
        <button
          type="button"
          className={`aspp-tab-btn ${activeTab === "queue" ? "is-active" : ""}`}
          onClick={() => setActiveTab("queue")}
        >
          <Clock3 size={16} />
          Antrean Verifikasi
          <span
            className={`aspp-tab-badge ${
              summary.pending > 0 ? "aspp-tab-badge--highlight" : ""
            }`}
          >
            {summary.pending}
          </span>
        </button>

        <button
          type="button"
          className={`aspp-tab-btn ${activeTab === "directory" ? "is-active" : ""}`}
          onClick={() => setActiveTab("directory")}
        >
          <Store size={16} />
          Direktori Semua Toko
          <span className="aspp-tab-badge">{summary.total}</span>
        </button>
      </div>

      {/* TAB 1: PENDING QUEUE */}
      {activeTab === "queue" && (
        <div className="aspp-queue-container">
          {queueItems.length === 0 ? (
            <div className="aspp-empty-queue">
              <div className="aspp-empty-queue-icon">
                <ShieldCheck size={28} />
              </div>
              <h3>Antrean Bersih: Tidak Ada Pengajuan Tertunda</h3>
              <p>
                Seluruh pengajuan nomor rekening bank dan QRIS toko telah diverifikasi. Pengajuan baru atau pembaruan rekening dari penjual akan otomatis muncul di sini untuk ditinjau.
              </p>
              <button
                type="button"
                className="aspp-btn aspp-btn--secondary"
                style={{ marginTop: 16 }}
                onClick={() => setActiveTab("directory")}
              >
                Buka Direktori Toko
              </button>
            </div>
          ) : (
            queueItems.map((entry) => {
              const req = entry.pendingRequest;
              const storeId = entry.store?.id;
              const isBusy = reviewMutation.isPending && Number(reviewMutation.variables?.storeId) === Number(storeId);

              return (
                <article key={storeId} className="aspp-queue-card">
                  <div className="aspp-queue-card-head">
                    <div className="aspp-queue-store-info">
                      <div className="aspp-store-avatar">
                        {String(entry.store?.name || "T")[0].toUpperCase()}
                      </div>
                      <div className="aspp-queue-store-title">
                        <h4>{text(entry.store?.name, "Toko Tanpa Nama")}</h4>
                        <p>Pemilik: {text(entry.owner?.name || entry.owner?.email)}</p>
                      </div>
                    </div>

                    <div className="aspp-actions-group">
                      <span className="aspp-badge aspp-badge--pending">
                        <Clock3 size={12} /> Menunggu Verifikasi
                      </span>
                    </div>
                  </div>

                  {/* Submission Details Grid */}
                  <div className="aspp-queue-grid">
                    <div className="aspp-queue-col">
                      <span className="aspp-queue-col-title">Rekening Bank Payout Diajukan</span>
                      <div className="aspp-queue-detail-row">
                        <span>Nama Bank:</span>
                        <strong>{text(req?.bankName)}</strong>
                      </div>
                      <div className="aspp-queue-detail-row">
                        <span>Nomor Rekening:</span>
                        <strong className="aspp-account-num">{text(req?.accountNumber)}</strong>
                      </div>
                      <div className="aspp-queue-detail-row">
                        <span>Nama Pemilik:</span>
                        <strong>{text(req?.accountHolderName)}</strong>
                      </div>
                    </div>

                    <div className="aspp-queue-col">
                      <span className="aspp-queue-col-title">Instrumen QRIS Toko</span>
                      {req?.qrisImageUrl ? (
                        <div
                          className="aspp-queue-qris-box"
                          onClick={() => setLightboxImageUrl(req.qrisImageUrl)}
                          title="Klik untuk perbesar QRIS"
                        >
                          <img
                            src={req.qrisImageUrl}
                            alt="QRIS Diajukan"
                            className="aspp-queue-qris-thumb"
                          />
                          <div>
                            <strong style={{ display: "block", fontSize: 13 }}>QRIS Terlampir</strong>
                            <span style={{ fontSize: 11, color: "var(--aspp-info)" }}>
                              Klik untuk melihat resolusi penuh
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: 13, color: "var(--aspp-muted)" }}>
                          Tidak melampirkan file QRIS
                        </span>
                      )}
                    </div>

                    {req?.sellerNote && (
                      <div className="aspp-queue-col" style={{ gridColumn: "1 / -1" }}>
                        <span className="aspp-queue-col-title">Catatan Penjual:</span>
                        <div className="aspp-note-box aspp-note-box--info">{req.sellerNote}</div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="aspp-queue-actions">
                    <button
                      type="button"
                      className="aspp-btn aspp-btn--secondary"
                      onClick={() => setSelectedStoreForReview(entry)}
                    >
                      <Eye size={14} /> Lihat Detail Lengkap
                    </button>

                    <button
                      type="button"
                      className="aspp-btn aspp-btn--danger-outline"
                      disabled={isBusy}
                      onClick={() => {
                        setSelectedStoreForReview(entry);
                        setReviewDraft({ action: "REJECTED", note: "" });
                      }}
                    >
                      Tolak
                    </button>

                    <button
                      type="button"
                      className="aspp-btn aspp-btn--secondary"
                      disabled={isBusy}
                      onClick={() => {
                        setSelectedStoreForReview(entry);
                        setReviewDraft({ action: "REVISION", note: "" });
                      }}
                    >
                      Minta Revisi
                    </button>

                    <button
                      type="button"
                      className="aspp-btn aspp-btn--success"
                      disabled={isBusy}
                      onClick={() => handleReviewAction(storeId, "APPROVE")}
                    >
                      <CheckCircle2 size={14} />
                      {isBusy ? "Menyetujui..." : "Setujui Rekening"}
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ALL STORES DIRECTORY */}
      {activeTab === "directory" && (
        <div className="aspp-directory-container">
          {/* Filter Toolbar */}
          <div className="aspp-filter-toolbar">
            <div className="aspp-search-box">
              <Search size={16} className="aspp-search-icon" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari nama toko, pemilik, email, bank, nomor rekening..."
                className="aspp-search-input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setPage(1);
                  }}
                  className="aspp-search-clear"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="aspp-filters-right">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="aspp-select"
              >
                <option value="all">Semua Status ({summary.total})</option>
                <option value="active">Aktif / Siap Payout ({summary.active})</option>
                <option value="pending">Menunggu Review ({summary.pending})</option>
                <option value="revision">Perlu Revisi ({summary.followUp})</option>
                <option value="incomplete">Belum Lengkap ({summary.setup})</option>
              </select>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="aspp-select"
              >
                <option value={10}>10 per hal</option>
                <option value={25}>25 per hal</option>
                <option value={50}>50 per hal</option>
              </select>
            </div>
          </div>

          {/* Table Card */}
          <div className="aspp-table-card">
            <div className="aspp-table-responsive">
              <table className="aspp-table">
                <thead>
                  <tr>
                    <th>Toko & Pemilik</th>
                    <th>Bank Payout</th>
                    <th>Nomor Rekening & Atas Nama</th>
                    <th>QRIS Toko</th>
                    <th>Kesiapan Toko</th>
                    <th>Status Verifikasi</th>
                    <th style={{ textAlign: "right" }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px" }}>
                        <Store size={36} className="text-slate-500 mb-2" style={{ margin: "0 auto 8px auto" }} />
                        <h4 style={{ margin: 0, color: "var(--aspp-text)" }}>Tidak Ada Toko yang Cocok</h4>
                        <p style={{ margin: "4px 0 0 0", color: "var(--aspp-muted)", fontSize: 13 }}>
                          Coba sesuaikan kata kunci pencarian atau reset filter status.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((entry) => {
                      const profile = entry.paymentProfile;
                      const pending = entry.pendingRequest;
                      const lane = getLane(entry);
                      const readinessPct = percent(entry.workspaceReadiness?.completionPercent);
                      const qrisUrl = profile?.qrisImageUrl || pending?.qrisImageUrl;
                      const bankName = profile?.bankName || pending?.bankName;
                      const accNum = profile?.accountNumber || pending?.accountNumber;
                      const accHolder = profile?.accountHolderName || pending?.accountHolderName;
                      const isStoreActive =
                        String(entry.store?.status || "").toUpperCase() === "ACTIVE";

                      return (
                        <tr key={entry.store?.id}>
                          {/* Store & Owner */}
                          <td>
                            <div className="aspp-store-cell">
                              <div className="aspp-store-avatar">
                                {String(entry.store?.name || "T")[0].toUpperCase()}
                              </div>
                              <div className="aspp-owner-cell">
                                <span className="aspp-store-name">
                                  {text(entry.store?.name, "Toko Tanpa Nama")}
                                  <span
                                    className={`aspp-badge aspp-badge--store-${
                                      isStoreActive ? "active" : "inactive"
                                    }`}
                                  >
                                    {isStoreActive ? "AKTIF" : "NONAKTIF"}
                                  </span>
                                </span>
                                <span className="aspp-owner-email">
                                  {text(entry.owner?.name)} • {text(entry.owner?.email)}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Bank Payout */}
                          <td>
                            {bankName ? (
                              <span className="aspp-bank-badge">
                                <Building2 size={12} /> {bankName}
                              </span>
                            ) : (
                              <span style={{ color: "var(--aspp-muted)", fontSize: 12 }}>-</span>
                            )}
                          </td>

                          {/* Account & Holder */}
                          <td>
                            {accNum ? (
                              <div className="aspp-owner-cell">
                                <span className="aspp-account-num">{accNum}</span>
                                <span style={{ fontSize: 11.5, color: "var(--aspp-muted)" }}>
                                  a.n. {text(accHolder)}
                                </span>
                              </div>
                            ) : (
                              <span style={{ color: "var(--aspp-muted)", fontSize: 12 }}>
                                Belum diatur
                              </span>
                            )}
                          </td>

                          {/* QRIS */}
                          <td>
                            {qrisUrl ? (
                              <img
                                src={qrisUrl}
                                alt="QRIS Toko"
                                className="aspp-qris-thumb-mini"
                                onClick={() => setLightboxImageUrl(qrisUrl)}
                                title="Klik untuk memperbesar QRIS"
                              />
                            ) : (
                              <span style={{ color: "var(--aspp-muted)", fontSize: 12 }}>
                                Belum Ada
                              </span>
                            )}
                          </td>

                          {/* Readiness Bar */}
                          <td>
                            <div className="aspp-readiness-box" title={`Kesiapan Toko: ${readinessPct}%`}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                                <span>Kesiapan</span>
                                <strong>{readinessPct}%</strong>
                              </div>
                              <div className="aspp-progress-bar">
                                <div
                                  className="aspp-progress-fill"
                                  style={{
                                    width: `${readinessPct}%`,
                                    background:
                                      readinessPct === 100
                                        ? "var(--aspp-success)"
                                        : readinessPct >= 50
                                        ? "var(--aspp-warning)"
                                        : "var(--aspp-info)",
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td>
                            <span className={`aspp-badge aspp-badge--${lane.tone}`}>
                              {lane.key === "active" && <CheckCircle2 size={12} />}
                              {lane.key === "pending" && <Clock3 size={12} />}
                              {lane.key === "revision" && <FileText size={12} />}
                              {lane.key === "incomplete" && <Wrench size={12} />}
                              {lane.label}
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ textAlign: "right" }}>
                            <div className="aspp-actions-group" style={{ justifyContent: "flex-end" }}>
                              <button
                                type="button"
                                className="aspp-btn-review"
                                onClick={() => {
                                  setSelectedStoreForReview(entry);
                                  setReviewDraft({ action: null, note: "" });
                                }}
                              >
                                <Eye size={13} />
                                Review / Detail
                              </button>

                              <button
                                type="button"
                                className="aspp-btn-icon"
                                onClick={() => setSelectedStoreForIdentity(entry)}
                                title="Edit Nama & Status Toko"
                              >
                                <Edit3 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredDirectoryItems.length > 0 && (
              <div className="aspp-pagination">
                <span className="aspp-pagination-info">
                  Menampilkan {(page - 1) * pageSize + 1} -{" "}
                  {Math.min(page * pageSize, filteredDirectoryItems.length)} dari{" "}
                  {filteredDirectoryItems.length} toko
                </span>

                <div className="aspp-pagination-btns">
                  <button
                    type="button"
                    className="aspp-page-btn"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} /> Sebelumnya
                  </button>

                  <span style={{ fontSize: 13, fontWeight: 700, padding: "0 8px" }}>
                    Hal {page} / {totalPages}
                  </span>

                  <button
                    type="button"
                    className="aspp-page-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Selanjutnya <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DETAIL & REVIEW MODAL */}
      {selectedStoreForReview && (
        <div className="aspp-modal-overlay" onClick={() => setSelectedStoreForReview(null)}>
          <div className="aspp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="aspp-modal-head">
              <div className="aspp-modal-title">
                <h3>{text(selectedStoreForReview.store?.name, "Detail Pembayaran Toko")}</h3>
                <p>
                  Pemilik: {text(selectedStoreForReview.owner?.name)} ({text(selectedStoreForReview.owner?.email)})
                </p>
              </div>
              <button
                type="button"
                className="aspp-modal-close"
                onClick={() => setSelectedStoreForReview(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="aspp-modal-body">
              {/* Section 1: Active Snapshot */}
              <div className="aspp-section-card">
                <span className="aspp-section-title">
                  <CreditCard size={14} /> Rekening Payout Terverifikasi (Aktif)
                </span>

                {selectedStoreForReview.paymentProfile ? (
                  <div className="aspp-kv-grid">
                    <div className="aspp-kv-item">
                      <span>Bank Payout:</span>
                      <strong>{text(selectedStoreForReview.paymentProfile.bankName)}</strong>
                    </div>
                    <div className="aspp-kv-item">
                      <span>Nomor Rekening:</span>
                      <strong className="aspp-account-num">
                        {text(selectedStoreForReview.paymentProfile.accountNumber)}
                      </strong>
                    </div>
                    <div className="aspp-kv-item">
                      <span>Nama Pemilik Rekening:</span>
                      <strong>{text(selectedStoreForReview.paymentProfile.accountHolderName)}</strong>
                    </div>
                    <div className="aspp-kv-item">
                      <span>Status Snapshot:</span>
                      <strong style={{ color: "var(--aspp-success)" }}>
                        {selectedStoreForReview.paymentProfile.isActive ? "AKTIF" : "NONAKTIF"}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="aspp-note-box aspp-note-box--warning">
                    Toko ini belum memiliki rekening payout yang aktif atau terverifikasi.
                  </div>
                )}
              </div>

              {/* Section 2: Pending Request if any */}
              {selectedStoreForReview.pendingRequest && (
                <div
                  className="aspp-section-card"
                  style={{ borderColor: "rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.05)" }}
                >
                  <span className="aspp-section-title" style={{ color: "var(--aspp-warning)" }}>
                    <Clock3 size={14} /> Pengajuan Perubahan Rekening Baru
                  </span>

                  <div className="aspp-kv-grid">
                    <div className="aspp-kv-item">
                      <span>Bank Diajukan:</span>
                      <strong>{text(selectedStoreForReview.pendingRequest.bankName)}</strong>
                    </div>
                    <div className="aspp-kv-item">
                      <span>Nomor Rekening Diajukan:</span>
                      <strong className="aspp-account-num">
                        {text(selectedStoreForReview.pendingRequest.accountNumber)}
                      </strong>
                    </div>
                    <div className="aspp-kv-item">
                      <span>Nama Pemilik:</span>
                      <strong>{text(selectedStoreForReview.pendingRequest.accountHolderName)}</strong>
                    </div>
                    <div className="aspp-kv-item">
                      <span>Status Pengajuan:</span>
                      <strong style={{ color: "var(--aspp-warning)" }}>
                        {getRequestStatus(selectedStoreForReview)}
                      </strong>
                    </div>
                  </div>

                  {selectedStoreForReview.pendingRequest.sellerNote && (
                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--aspp-muted)" }}>Catatan Penjual:</span>
                      <div className="aspp-note-box aspp-note-box--info" style={{ marginTop: 4 }}>
                        {selectedStoreForReview.pendingRequest.sellerNote}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: QRIS Preview */}
              <div className="aspp-section-card">
                <span className="aspp-section-title">
                  <QrCode size={14} /> Instrumen Pembayaran QRIS
                </span>

                {selectedStoreForReview.paymentProfile?.qrisImageUrl ||
                selectedStoreForReview.pendingRequest?.qrisImageUrl ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <img
                      src={
                        selectedStoreForReview.pendingRequest?.qrisImageUrl ||
                        selectedStoreForReview.paymentProfile?.qrisImageUrl
                      }
                      alt="QRIS Toko"
                      style={{
                        width: 90,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid var(--aspp-border)",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setLightboxImageUrl(
                          selectedStoreForReview.pendingRequest?.qrisImageUrl ||
                            selectedStoreForReview.paymentProfile?.qrisImageUrl
                        )
                      }
                    />
                    <div>
                      <strong style={{ display: "block", fontSize: 14 }}>QRIS Terpasang</strong>
                      <p style={{ margin: "4px 0", fontSize: 12, color: "var(--aspp-muted)" }}>
                        Klik gambar di samping untuk melihat barcode dalam ukuran penuh.
                      </p>
                      <button
                        type="button"
                        className="aspp-btn aspp-btn--secondary"
                        style={{ padding: "4px 10px", fontSize: 12 }}
                        onClick={() =>
                          setLightboxImageUrl(
                            selectedStoreForReview.pendingRequest?.qrisImageUrl ||
                              selectedStoreForReview.paymentProfile?.qrisImageUrl
                          )
                        }
                      >
                        <Eye size={12} /> Buka Gambar QRIS
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ color: "var(--aspp-muted)", fontSize: 13 }}>
                    Penjual belum mengunggah barcode QRIS untuk toko ini.
                  </div>
                )}
              </div>

              {/* Section 4: Seller Readiness Breakdown */}
              <div className="aspp-section-card">
                <span className="aspp-section-title">
                  <UserCheck size={14} /> Indikator Kesiapan Toko ({percent(selectedStoreForReview.workspaceReadiness?.completionPercent)}%)
                </span>

                <div className="aspp-kv-grid">
                  {getReadinessItems(selectedStoreForReview).map((item) => (
                    <div key={item.label} className="aspp-kv-item">
                      <span>{item.label}:</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Review Action Inputs if Action Triggered */}
              {reviewDraft.action && (
                <div className="aspp-section-card" style={{ borderColor: "var(--aspp-primary)" }}>
                  <span className="aspp-section-title" style={{ color: "var(--aspp-primary)" }}>
                    <FileText size={14} /> Berikan Catatan{" "}
                    {reviewDraft.action === "REVISION" ? "Permintaan Revisi" : "Penolakan"}
                  </span>

                  <textarea
                    className="aspp-textarea"
                    placeholder={`Tuliskan alasan dan instruksi perbaikan yang jelas untuk penjual...`}
                    value={reviewDraft.note}
                    onChange={(e) => setReviewDraft((prev) => ({ ...prev, note: e.target.value }))}
                  />

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="aspp-btn aspp-btn--secondary"
                      onClick={() => setReviewDraft({ action: null, note: "" })}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      className={`aspp-btn ${
                        reviewDraft.action === "REVISION" ? "aspp-btn--primary" : "aspp-btn--danger"
                      }`}
                      disabled={reviewMutation.isPending || !reviewDraft.note.trim()}
                      onClick={() =>
                        handleReviewAction(
                          selectedStoreForReview.store?.id,
                          reviewDraft.action,
                          reviewDraft.note
                        )
                      }
                    >
                      {reviewMutation.isPending
                        ? "Mengirim..."
                        : reviewDraft.action === "REVISION"
                        ? "Kirim Permintaan Revisi"
                        : "Konfirmasi Tolak"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="aspp-modal-footer">
              <button
                type="button"
                className="aspp-btn aspp-btn--secondary"
                onClick={() => setSelectedStoreForReview(null)}
              >
                Tutup
              </button>

              {getRequestStatus(selectedStoreForReview) === "SUBMITTED" && !reviewDraft.action && (
                <>
                  <button
                    type="button"
                    className="aspp-btn aspp-btn--danger-outline"
                    onClick={() => setReviewDraft({ action: "REJECTED", note: "" })}
                  >
                    Tolak Pengajuan
                  </button>
                  <button
                    type="button"
                    className="aspp-btn aspp-btn--secondary"
                    onClick={() => setReviewDraft({ action: "REVISION", note: "" })}
                  >
                    Minta Revisi
                  </button>
                  <button
                    type="button"
                    className="aspp-btn aspp-btn--success"
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      handleReviewAction(selectedStoreForReview.store?.id, "APPROVE")
                    }
                  >
                    <CheckCircle2 size={14} /> Setujui Rekening
                  </button>
                </>
              )}

              {selectedStoreForReview.paymentProfile &&
                getRequestStatus(selectedStoreForReview) !== "SUBMITTED" &&
                !reviewDraft.action && (
                  <button
                    type="button"
                    className={`aspp-btn ${
                      selectedStoreForReview.paymentProfile.isActive
                        ? "aspp-btn--danger-outline"
                        : "aspp-btn--success"
                    }`}
                    disabled={reviewMutation.isPending}
                    onClick={() =>
                      handleReviewAction(
                        selectedStoreForReview.store?.id,
                        selectedStoreForReview.paymentProfile.isActive ? "INACTIVE" : "APPROVE"
                      )
                    }
                  >
                    {selectedStoreForReview.paymentProfile.isActive
                      ? "Nonaktifkan Rekening"
                      : "Aktifkan Rekening"}
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT STORE IDENTITY MODAL */}
      {selectedStoreForIdentity && (
        <EditStoreIdentityModal
          entry={selectedStoreForIdentity}
          onClose={() => setSelectedStoreForIdentity(null)}
          onSave={(payload) =>
            identityMutation.mutate({
              storeId: selectedStoreForIdentity.store?.id,
              payload,
            })
          }
          isSaving={identityMutation.isPending}
        />
      )}

      {/* QRIS LIGHTBOX MODAL */}
      {lightboxImageUrl && (
        <div className="aspp-modal-overlay" onClick={() => setLightboxImageUrl(null)}>
          <div
            style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="aspp-modal-close"
              style={{
                position: "absolute",
                top: -40,
                right: 0,
                background: "rgba(255,255,255,0.2)",
                color: "#ffffff",
              }}
              onClick={() => setLightboxImageUrl(null)}
            >
              <X size={24} />
            </button>
            <img src={lightboxImageUrl} alt="QRIS Resolusi Penuh" className="aspp-lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}

function EditStoreIdentityModal({ entry, onClose, onSave, isSaving }) {
  const [name, setName] = useState(entry.store?.name || "");
  const [status, setStatus] = useState(
    String(entry.store?.status || "ACTIVE").toUpperCase() === "INACTIVE" ? "INACTIVE" : "ACTIVE"
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama toko wajib diisi");
      return;
    }
    onSave({ name: name.trim(), status });
  };

  return (
    <div className="aspp-modal-overlay" onClick={onClose}>
      <div className="aspp-modal-card" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <div className="aspp-modal-head">
          <div className="aspp-modal-title">
            <h3>Edit Identitas Toko</h3>
            <p>ID Toko: #{entry.store?.id}</p>
          </div>
          <button type="button" className="aspp-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="aspp-modal-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--aspp-text)" }}>
                Nama Toko *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama toko"
                className="aspp-search-input"
                style={{ padding: "9px 12px" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "var(--aspp-text)" }}>
                Status Toko *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="aspp-select"
                style={{ width: "100%", padding: "9px 12px" }}
              >
                <option value="ACTIVE">ACTIVE (Toko Buka / Beroperasi)</option>
                <option value="INACTIVE">INACTIVE (Toko Tutup / Nonaktif)</option>
              </select>
            </div>
          </div>

          <div className="aspp-modal-footer">
            <button type="button" className="aspp-btn aspp-btn--secondary" onClick={onClose}>
              Batal
            </button>
            <button type="submit" className="aspp-btn aspp-btn--primary" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
