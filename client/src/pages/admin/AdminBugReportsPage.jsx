import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bug,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  Copy,
  Check,
  Mail,
  Send,
  Terminal,
  User as UserIcon,
  RefreshCw,
  X,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import {
  fetchAdminBugReports,
  fetchAdminBugReportDetail,
  updateAdminBugReportStatus,
  resolveAdminBugReport,
} from "../../api/adminBugReports.ts";
import "./admin-bug-reports.css";

const STATUS_CONFIG = {
  NEW: {
    label: "Baru Masuk",
    bg: "rgba(239, 68, 68, 0.12)",
    color: "#ef4444",
    border: "rgba(239, 68, 68, 0.25)",
  },
  INVESTIGATING: {
    label: "Sedang Dianalisis",
    bg: "rgba(245, 158, 11, 0.12)",
    color: "#f59e0b",
    border: "rgba(245, 158, 11, 0.25)",
  },
  FIXED: {
    label: "Selesai Diperbaiki",
    bg: "rgba(16, 185, 129, 0.12)",
    color: "#10b981",
    border: "rgba(16, 185, 129, 0.25)",
  },
  CLOSED: {
    label: "Ditutup",
    bg: "rgba(100, 116, 139, 0.12)",
    color: "#64748b",
    border: "rgba(100, 116, 139, 0.25)",
  },
};

export default function AdminBugReportsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [resolutionNoteInput, setResolutionNoteInput] = useState("");
  const [sendEmailChecked, setSendEmailChecked] = useState(true);
  const [copiedStack, setCopiedStack] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState("");

  // Fetch list of bug reports
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-bug-reports", activeTab, search],
    queryFn: () => fetchAdminBugReports({ status: activeTab, search, limit: 30 }),
  });

  // Fetch detail for selected report
  const { data: detailData, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["admin-bug-report-detail", selectedReportId],
    queryFn: () => fetchAdminBugReportDetail(selectedReportId),
    enabled: !!selectedReportId,
  });

  // Mutation to resolve bug and notify reporter
  const resolveMutation = useMutation({
    mutationFn: ({ id, resolutionNote, sendEmailNotification }) =>
      resolveAdminBugReport(id, { resolutionNote, sendEmailNotification }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["admin-bug-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bug-report-detail", selectedReportId] });
      const emailMsg = result?.emailSent ? " Email notifikasi telah terkirim ke pelapor." : "";
      setActionSuccessMsg(`Bug berhasil ditandai selesai!${emailMsg}`);
      setTimeout(() => setActionSuccessMsg(""), 6000);
    },
  });

  // Mutation to update status
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateAdminBugReportStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bug-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bug-report-detail", selectedReportId] });
      setActionSuccessMsg("Status laporan berhasil diperbarui.");
      setTimeout(() => setActionSuccessMsg(""), 4000);
    },
  });

  const handleOpenDetail = (item) => {
    setSelectedReportId(item.id);
    setResolutionNoteInput(
      item.resolutionNote ||
        "Kendala pada komponen terkait telah diperbaiki dan dioptimalkan pada pembaruan sistem terbaru."
    );
    setSendEmailChecked(true);
    setActionSuccessMsg("");
  };

  const handleCloseDetail = () => {
    setSelectedReportId(null);
    setActionSuccessMsg("");
  };

  const handleCopyStack = (stackText) => {
    if (!stackText || !navigator?.clipboard) return;
    navigator.clipboard.writeText(stackText).then(() => {
      setCopiedStack(true);
      setTimeout(() => setCopiedStack(false), 2000);
    });
  };

  const items = data?.items || [];
  const summary = data?.summary || { total: 0, new: 0, investigating: 0, fixed: 0, closed: 0 };

  return (
    <div className="abr26-root">
      {/* Header Bar */}
      <div className="abr26-header">
        <div>
          <div className="abr26-badge">
            <ShieldCheck size={14} />
            <span>Pusat Kendala Sistem</span>
          </div>
          <h1 className="abr26-title">Manajemen Laporan Bug & Resolusi</h1>
          <p className="abr26-subtitle">
            Kelola laporan kendala teknis dari pengguna, tinjau stack trace, dan beri tahu pelapor secara otomatis saat perbaikan selesai.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="abr26-btn-refresh"
          title="Segarkan Data"
        >
          <RefreshCw size={15} className={isFetching ? "animate-spin" : ""} />
          <span>Segarkan</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="abr26-kpi-grid">
        <div className="abr26-kpi-card is-total">
          <div className="abr26-kpi-icon"><Bug size={20} /></div>
          <div>
            <div className="abr26-kpi-val">{summary.total}</div>
            <div className="abr26-kpi-lbl">Total Laporan</div>
          </div>
        </div>

        <div className="abr26-kpi-card is-new">
          <div className="abr26-kpi-icon"><AlertTriangle size={20} /></div>
          <div>
            <div className="abr26-kpi-val">{summary.new}</div>
            <div className="abr26-kpi-lbl">Perlu Ditinjau (Baru)</div>
          </div>
        </div>

        <div className="abr26-kpi-card is-investigating">
          <div className="abr26-kpi-icon"><Clock size={20} /></div>
          <div>
            <div className="abr26-kpi-val">{summary.investigating}</div>
            <div className="abr26-kpi-lbl">Sedang Dianalisis</div>
          </div>
        </div>

        <div className="abr26-kpi-card is-fixed">
          <div className="abr26-kpi-icon"><CheckCircle2 size={20} /></div>
          <div>
            <div className="abr26-kpi-val">{summary.fixed}</div>
            <div className="abr26-kpi-lbl">Berhasil Diperbaiki</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="abr26-filter-bar">
        <div className="abr26-tabs" role="tablist">
          {[
            { key: "ALL", label: `Semua (${summary.total})` },
            { key: "NEW", label: `Baru (${summary.new})` },
            { key: "INVESTIGATING", label: `Dianalisis (${summary.investigating})` },
            { key: "FIXED", label: `Selesai (${summary.fixed})` },
            { key: "CLOSED", label: `Ditutup (${summary.closed})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`abr26-tab ${activeTab === tab.key ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="abr26-search-wrap">
          <Search size={15} className="abr26-search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari tiket, URL, email..."
            className="abr26-search-input"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} className="abr26-search-clear">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="abr26-table-card">
        {isLoading ? (
          <div className="abr26-empty-state">
            <RefreshCw size={24} className="animate-spin text-sky-500 mb-2" />
            <p>Memuat daftar laporan bug...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="abr26-empty-state">
            <CheckCircle2 size={36} className="text-emerald-500 mb-2" />
            <h3>Tidak Ada Laporan Bug</h3>
            <p>Tidak ditemukan laporan kendala teknis pada kriteria ini.</p>
          </div>
        ) : (
          <div className="abr26-table-responsive">
            <table className="abr26-table">
              <thead>
                <tr>
                  <th>No. Tiket</th>
                  <th>Halaman Terkendala</th>
                  <th>Jenis Error</th>
                  <th>Pelapor</th>
                  <th>Status</th>
                  <th>Waktu Masuk</th>
                  <th style={{ textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const statusConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.NEW;
                  return (
                    <tr
                      key={item.id}
                      className={selectedReportId === item.id ? "is-selected" : ""}
                      onClick={() => handleOpenDetail(item)}
                    >
                      <td>
                        <span className="abr26-ticket-chip">#{item.ticketNumber}</span>
                      </td>
                      <td>
                        <div className="abr26-page-url" title={item.pageUrl}>
                          {item.pageUrl}
                        </div>
                      </td>
                      <td>
                        <span className="abr26-error-name">{item.errorName}</span>
                      </td>
                      <td>
                        <div className="abr26-reporter">
                          <span className="abr26-reporter-email">{item.reporterEmail}</span>
                          {item.reporter ? (
                            <span className="abr26-role-pill">{item.reporter.role}</span>
                          ) : (
                            <span className="abr26-guest-pill">Tamu / Browser</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span
                          className="abr26-status-pill"
                          style={{
                            backgroundColor: statusConf.bg,
                            color: statusConf.color,
                            borderColor: statusConf.border,
                          }}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td>
                        <span className="abr26-date">
                          {new Date(item.createdAt).toLocaleString("id-ID", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          type="button"
                          className="abr26-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item);
                          }}
                        >
                          Tinjau & Resolusi &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-over Drawer / Modal for Detail & Resolution */}
      {selectedReportId && (
        <div className="abr26-modal-backdrop" onClick={handleCloseDetail}>
          <div className="abr26-modal-content" onClick={(e) => e.stopPropagation()}>
            {isLoadingDetail || !detailData ? (
              <div className="p-8 text-center">
                <RefreshCw size={24} className="animate-spin text-sky-500 mb-2 inline" />
                <p>Memuat detail kendala...</p>
              </div>
            ) : (
              <>
                {/* Modal Header */}
                <div className="abr26-modal-header">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="abr26-ticket-chip">#{detailData.ticketNumber}</span>
                      <span
                        className="abr26-status-pill"
                        style={{
                          backgroundColor: (STATUS_CONFIG[detailData.status] || STATUS_CONFIG.NEW).bg,
                          color: (STATUS_CONFIG[detailData.status] || STATUS_CONFIG.NEW).color,
                          borderColor: (STATUS_CONFIG[detailData.status] || STATUS_CONFIG.NEW).border,
                        }}
                      >
                        {(STATUS_CONFIG[detailData.status] || STATUS_CONFIG.NEW).label}
                      </span>
                    </div>
                    <h2 className="abr26-modal-title">{detailData.errorName}</h2>
                  </div>

                  <button type="button" onClick={handleCloseDetail} className="abr26-modal-close">
                    <X size={18} />
                  </button>
                </div>

                {/* Feedback Alert */}
                {actionSuccessMsg && (
                  <div className="abr26-feedback-alert">
                    <Check size={16} />
                    <span>{actionSuccessMsg}</span>
                  </div>
                )}

                {/* Modal Body */}
                <div className="abr26-modal-body">
                  {/* Section 1: Halaman & Pesan Error */}
                  <div className="abr26-detail-card">
                    <h3 className="abr26-section-title">Informasi Kejadian</h3>
                    <div className="abr26-info-grid">
                      <div className="abr26-info-row">
                        <span className="abr26-lbl">Halaman URL:</span>
                        <a
                          href={detailData.pageUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="abr26-val-link"
                        >
                          <span>{detailData.pageUrl}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="abr26-info-row">
                        <span className="abr26-lbl">Email Pelapor:</span>
                        <span className="abr26-val">{detailData.reporterEmail}</span>
                      </div>
                      <div className="abr26-info-row">
                        <span className="abr26-lbl">Waktu Lapor:</span>
                        <span className="abr26-val">
                          {new Date(detailData.createdAt).toLocaleString("id-ID", {
                            dateStyle: "full",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                      <div className="abr26-info-row">
                        <span className="abr26-lbl">Pesan Error:</span>
                        <div className="abr26-val-error">{detailData.errorMessage}</div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Catatan Pengguna (jika ada) */}
                  {detailData.userNote && (
                    <div className="abr26-detail-card is-note">
                      <h3 className="abr26-section-title">Catatan Kronologi dari Pengguna</h3>
                      <p className="abr26-user-note">"{detailData.userNote}"</p>
                    </div>
                  )}

                  {/* Section 3: Technical Stack Trace */}
                  <div className="abr26-detail-card">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="abr26-section-title flex items-center gap-1.5">
                        <Terminal size={14} className="text-amber-500" />
                        <span>Technical Stack Trace</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => handleCopyStack(detailData.errorStack)}
                        className="abr26-btn-copy"
                      >
                        {copiedStack ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedStack ? "Tersalin" : "Salin Stack"}</span>
                      </button>
                    </div>
                    <pre className="abr26-stack-box">
                      {detailData.errorStack || "Tidak ada stack trace yang tersimpan."}
                    </pre>

                    {detailData.userAgent && (
                      <div className="mt-2 text-[11px] text-slate-400">
                        <span className="font-semibold text-slate-300">User Agent:</span>{" "}
                        {detailData.userAgent}
                      </div>
                    )}
                  </div>

                  {/* Section 4: FORM RESOLUSI & NOTIFIKASI KE PELAPOR */}
                  <div className="abr26-detail-card is-resolution">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <h3 className="abr26-section-title font-black text-emerald-500 m-0">
                        Penyelesaian Bug & Notifikasi Pelapor
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">
                      Ketik catatan perbaikan di bawah. Saat Anda menekan tombol di bawah, sistem otomatis menandai status menjadi <strong>FIXED</strong>, membuat notifikasi in-app, dan <strong>mengirimkan email resmi ke pelapor ({detailData.reporterEmail})</strong>.
                    </p>

                    <div className="mb-3">
                      <label className="block text-xs font-bold text-slate-200 mb-1">
                        Catatan Perbaikan dari Tim Teknis:
                      </label>
                      <textarea
                        rows={3}
                        value={resolutionNoteInput}
                        onChange={(e) => setResolutionNoteInput(e.target.value)}
                        placeholder="Contoh: Komponen telah diperbaiki dan optimasi data telah diterapkan. Silakan akses kembali halaman terkait."
                        className="abr26-textarea"
                      />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <input
                        type="checkbox"
                        id="chk-send-email"
                        checked={sendEmailChecked}
                        onChange={(e) => setSendEmailChecked(e.target.checked)}
                        className="abr26-checkbox"
                      />
                      <label htmlFor="chk-send-email" className="text-xs text-slate-200 cursor-pointer">
                        Kirimkan email notifikasi perbaikan otomatis ke <strong>{detailData.reporterEmail}</strong>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={resolveMutation.isPending}
                        onClick={() =>
                          resolveMutation.mutate({
                            id: detailData.id,
                            resolutionNote: resolutionNoteInput,
                            sendEmailNotification: sendEmailChecked,
                          })
                        }
                        className="abr26-btn-resolve"
                      >
                        <Send size={14} />
                        <span>
                          {resolveMutation.isPending
                            ? "Mengirim Notifikasi..."
                            : "✓ Tandai Selesai & Beri Tahu Pelapor"}
                        </span>
                      </button>

                      {detailData.status !== "INVESTIGATING" && detailData.status !== "FIXED" && (
                        <button
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({ id: detailData.id, status: "INVESTIGATING" })
                          }
                          className="abr26-btn-secondary"
                        >
                          Ubah ke "Sedang Dianalisis"
                        </button>
                      )}

                      {detailData.status !== "CLOSED" && (
                        <button
                          type="button"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({ id: detailData.id, status: "CLOSED" })
                          }
                          className="abr26-btn-secondary"
                        >
                          Tutup Tiket
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
