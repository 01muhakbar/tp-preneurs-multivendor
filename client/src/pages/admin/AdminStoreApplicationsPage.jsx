import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MoreVertical,
  RefreshCcw,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  approveAdminStoreApplication,
  fetchAdminStoreApplications,
  rejectAdminStoreApplication,
  requestAdminStoreApplicationRevision,
} from "../../api/adminStoreApplications.ts";
import {
  AdminOpsEmptyState,
  AdminOpsErrorState,
} from "../../components/admin/AdminOpsPrimitives.jsx";
import "./AdminStoreApplicationsPage.css";

const QUERY_KEY = "admin-store-applications";

const getStatusLabels = (isId) => ({
  draft: isId ? "Draf" : "Draft",
  submitted: isId ? "Diajukan" : "Submitted",
  under_review: isId ? "Ditinjau" : "In Review",
  revision_requested: isId ? "Perlu Revisi" : "Needs Revision",
  approved: isId ? "Disetujui" : "Approved",
  rejected: isId ? "Ditolak" : "Rejected",
  cancelled: isId ? "Dibatalkan" : "Cancelled",
});

const STATUS_TONES = {
  draft: "neutral",
  submitted: "orange",
  under_review: "blue",
  revision_requested: "orange",
  approved: "blue",
  rejected: "danger",
  cancelled: "neutral",
};

const text = (value, fallback = "-") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeItems = (payload) => {
  const source =
    payload?.items ||
    payload?.applications ||
    payload?.rows ||
    payload?.data?.items ||
    payload?.data?.applications ||
    payload?.data?.rows ||
    payload?.data ||
    payload;
  return Array.isArray(source) ? source.filter(Boolean) : [];
};

const normalizeMeta = (payload, fallbackLength, params) => {
  const meta = payload?.meta || payload?.pagination || payload?.data?.meta || {};
  const limit = Number(meta.limit ?? meta.perPage ?? meta.pageSize ?? params.limit ?? 10);
  const total = Number(meta.total ?? meta.totalItems ?? fallbackLength);
  return {
    page: Math.max(Number(meta.page ?? meta.currentPage ?? params.page ?? 1) || 1, 1),
    limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
    total: Number.isFinite(total) ? total : fallbackLength,
    totalPages: Math.max(
      Number(meta.totalPages ?? meta.pages ?? Math.ceil((total || fallbackLength) / (limit || 10))) || 1,
      1
    ),
    needsAction: Number(meta.needsAction ?? meta.needs_action),
    verified: Number(meta.verified),
    ready: Number(meta.ready),
  };
};

const getApplicant = (entry, isId) => {
  const applicant = entry?.applicant || entry?.user || entry?.owner || {};
  const identityMatch = applicant?.identityMatch || entry?.identityMatch || {};
  const rawMatch = String(
    identityMatch.summaryLabel ||
    applicant.identityMatchLabel ||
    entry?.identityMatchLabel ||
    ""
  ).toLowerCase();

  let matchLabel = isId ? "Cocok Sebagian" : "Partial Match";
  let matchTone = "orange";
  if (rawMatch.includes("exact") || rawMatch.includes("full") || rawMatch.includes("all match")) {
    matchLabel = isId ? "Cocok Penuh" : "Full Match";
    matchTone = "blue";
  } else if (rawMatch.includes("mismatch") || rawMatch.includes("no match")) {
    matchLabel = isId ? "Tidak Cocok" : "Mismatch";
    matchTone = "orange";
  } else if (!rawMatch) {
    matchLabel = isId ? "Belum Verifikasi" : "Unverified";
    matchTone = "neutral";
  }

  return {
    name:
      applicant.accountName ||
      applicant.name ||
      applicant.fullName ||
      entry?.ownerIdentity?.fullName ||
      (isId ? "Pemohon Anonim" : "Unknown applicant"),
    email: applicant.accountEmail || applicant.email || entry?.email || "-",
    matchLabel,
    matchTone,
  };
};

const getStore = (entry, isId) => {
  const store = entry?.store || entry?.storeInformation || entry?.storeSnapshot || {};
  const category = String(store.storeCategory || store.category || "").trim();
  let ownerType = String(store.sellerType || store.ownerType || store.type || (isId ? "Perorangan" : "Individual")).trim();
  if (ownerType === "Individual / Sole Proprietor") ownerType = isId ? "Perorangan" : "Individual";
  const validCategory = category && category !== "-" ? category : null;
  const description = validCategory ? `${validCategory} • ${ownerType}` : ownerType;
  return {
    name: store.storeName || store.name || entry?.storeName || "-",
    slug: store.storeSlug || store.slug || entry?.storeSlug || "",
    description,
  };
};

const getCompletion = (entry) => {
  const completeness = entry?.completeness || entry?.workflowSummary?.completeness || {};
  const completed = Number(completeness.completedFields ?? completeness.completed ?? 0);
  const total = Number(completeness.totalFields ?? completeness.total ?? 0);
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return {
    completed,
    total,
    percent: Math.max(0, Math.min(100, percent)),
    isComplete: Boolean(completeness.isComplete || (total > 0 && completed >= total)),
    label: completeness.label || (total > 0 && completed >= total ? "Ready" : "Incomplete"),
  };
};

const getStatus = (entry) => String(entry?.status || "draft").trim().toLowerCase();

const getInitials = (name) =>
  text(name, "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const formatDate = (value, isId) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatTime = (value, isId) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(isId ? "id-ID" : "en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
};

const getErrorMessage = (error, fallback = "Something went wrong.") =>
  error?.response?.data?.message || error?.message || fallback;

const canMutate = (entry, action) => {
  const governance = entry?.actionGovernance || entry?.workflowSummary?.actionGovernance || {};
  const status = getStatus(entry);
  const reviewable = ["submitted", "under_review"].includes(status);
  if (action === "approve") return governance.canApprove ?? reviewable;
  if (action === "revision") return governance.canRequestRevision ?? reviewable;
  if (action === "reject") return governance.canReject ?? reviewable;
  return true;
};

function KpiCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <section className={`asa-kpi asa-kpi--${tone}`}>
      <span className="asa-kpi__icon" aria-hidden="true">
        <Icon size={20} />
      </span>
      <div className="asa-kpi__content">
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </section>
  );
}

function StatusBadge({ status, isId }) {
  const normalized = String(status || "draft").toLowerCase();
  const labels = getStatusLabels(isId);
  return (
    <span className={`asa-status asa-status--${STATUS_TONES[normalized] || "neutral"}`}>
      {labels[normalized] || text(status, isId ? "Draf" : "Draft")}
    </span>
  );
}

function CompletionCell({ entry, isId }) {
  const completion = getCompletion(entry);
  const status = getStatus(entry);
  const isSubmitted = status === "submitted" || status === "under_review" || status === "approved";
  const statusLabel = isSubmitted
    ? status === "approved"
      ? (isId ? "Disetujui" : "Approved")
      : (isId ? "Dalam Antrean" : "In Queue")
    : completion.isComplete
      ? (isId ? "Siap" : "Ready")
      : (isId ? "Belum Lengkap" : "Incomplete");

  return (
    <div className="asa-completion">
      <div className="asa-completion__header">
        <strong>{completion.percent}%</strong>
        <small>({completion.completed}/{completion.total || 9})</small>
      </div>
      <span className="asa-progress" aria-hidden="true">
        <span
          className={`asa-progress__bar ${completion.percent === 100 ? "asa-progress__bar--blue" : "asa-progress__bar--orange"}`}
          style={{ width: `${completion.percent}%` }}
        />
      </span>
      <em style={{ fontStyle: "normal", fontSize: "11px", color: "var(--asa-muted)" }}>{statusLabel}</em>
    </div>
  );
}

function RowActions({ entry, isOpen, onToggle, onRequestAction, isId }) {
  const status = getStatus(entry);
  const isReviewable = status === "submitted" || status === "under_review";
  const buttonLabel = isReviewable
    ? (isId ? "Tinjau" : "Review")
    : status === "draft"
      ? (isId ? "Buka" : "Open")
      : (isId ? "Lihat" : "View");

  return (
    <div className="asa-actions">
      <Link
        className={`asa-row-primary ${isReviewable ? "is-review" : ""}`}
        to={`/admin/store/applications/${entry.id}`}
        title={buttonLabel}
      >
        {buttonLabel}
      </Link>
      <div className="asa-kebab">
        <button
          type="button"
          className="asa-icon-button"
          aria-label={isId ? "Menu opsi aksi" : "More actions"}
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <MoreVertical size={16} aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className="asa-menu">
            <Link to={`/admin/store/applications/${entry.id}`}>
              <ExternalLink size={14} />
              {isId ? "Lihat Detail" : "View detail"}
            </Link>
            <button
              type="button"
              disabled={!canMutate(entry, "approve")}
              onClick={() => onRequestAction("approve", entry)}
            >
              <CheckCircle2 size={14} />
              {isId ? "Setujui Toko" : "Approve store"}
            </button>
            <button
              type="button"
              disabled={!canMutate(entry, "revision")}
              onClick={() => onRequestAction("revision", entry)}
            >
              <AlertTriangle size={14} />
              {isId ? "Minta Revisi" : "Request revision"}
            </button>
            <button
              type="button"
              className="asa-menu__danger"
              disabled={!canMutate(entry, "reject")}
              onClick={() => onRequestAction("reject", entry)}
            >
              <X size={14} />
              {isId ? "Tolak Pengajuan" : "Reject"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminStoreApplicationsPage() {
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    completeness: searchParams.get("completeness") || "",
    search: searchParams.get("search") || "",
  });
  const [openMenuId, setOpenMenuId] = useState(null);

  // Action Dialog State
  const [actionDialog, setActionDialog] = useState({
    open: false,
    type: "", // 'approve' | 'revision' | 'reject'
    entry: null,
    note: "",
    internalNote: "",
  });

  const page = Math.max(Number(searchParams.get("page") || 1) || 1, 1);
  const perPage = [10, 25, 50].includes(Number(searchParams.get("limit")))
    ? Number(searchParams.get("limit"))
    : 10;
  const appliedStatus = searchParams.get("status") || "";
  const appliedCompleteness = searchParams.get("completeness") || "";
  const appliedSearch = searchParams.get("search") || "";

  const queryParams = useMemo(
    () => ({
      page,
      limit: perPage,
      status: appliedStatus,
    }),
    [appliedStatus, page, perPage]
  );

  const applicationsQuery = useQuery({
    queryKey: [QUERY_KEY, queryParams],
    queryFn: () => fetchAdminStoreApplications(queryParams),
  });

  const rawItems = normalizeItems(applicationsQuery.data);
  const meta = normalizeMeta(applicationsQuery.data, rawItems.length, queryParams);

  const items = useMemo(() => {
    const search = appliedSearch.trim().toLowerCase();
    return rawItems.filter((entry) => {
      const completion = getCompletion(entry);
      const status = getStatus(entry);
      const applicant = getApplicant(entry, isId);
      const store = getStore(entry, isId);
      const matchesCompleteness =
        !appliedCompleteness ||
        (appliedCompleteness === "complete" && completion.isComplete) ||
        (appliedCompleteness === "incomplete" && !completion.isComplete) ||
        (appliedCompleteness === "needs_action" &&
          ["submitted", "under_review", "revision_requested"].includes(status));
      const matchesSearch =
        !search ||
        [applicant.name, applicant.email, store.name, store.slug, store.description]
          .some((value) => String(value || "").toLowerCase().includes(search));
      return matchesCompleteness && matchesSearch;
    });
  }, [appliedCompleteness, appliedSearch, isId, rawItems]);

  const kpis = useMemo(() => {
    const needsAction = rawItems.filter((entry) =>
      ["submitted", "under_review", "revision_requested"].includes(getStatus(entry))
    ).length;
    const verified = rawItems.filter((entry) => getCompletion(entry).percent === 100).length;
    const ready = rawItems.filter((entry) => getStatus(entry) === "draft" && getCompletion(entry).percent === 100).length;
    return {
      needsAction: Number.isFinite(meta.needsAction) ? meta.needsAction : needsAction,
      verified: Number.isFinite(meta.verified) ? meta.verified : verified,
      ready: Number.isFinite(meta.ready) ? meta.ready : ready,
      total: meta.total || rawItems.length,
    };
  }, [meta.needsAction, meta.ready, meta.total, meta.verified, rawItems]);

  const mutation = useMutation({
    mutationFn: async ({ action, entry, note, internalNote }) => {
      if (action === "approve") {
        return approveAdminStoreApplication(entry.id, { internalAdminNote: internalNote || null });
      }
      if (action === "revision") {
        if (!note || !note.trim()) throw new Error(isId ? "Catatan revisi wajib diisi." : "Revision note is required.");
        return requestAdminStoreApplicationRevision(entry.id, {
          revisionNote: note.trim(),
          revisionSummary: null,
          internalAdminNote: internalNote || null,
        });
      }
      if (action === "reject") {
        if (!note || !note.trim()) throw new Error(isId ? "Alasan penolakan wajib diisi." : "Reject reason is required.");
        return rejectAdminStoreApplication(entry.id, {
          rejectReason: note.trim(),
          internalAdminNote: internalNote || null,
        });
      }
      return null;
    },
    onSuccess: async (_data, variables) => {
      const message =
        variables.action === "approve"
          ? (isId ? "Pengajuan toko disetujui." : "Application approved.")
          : variables.action === "revision"
            ? (isId ? "Permintaan revisi dikirim." : "Revision requested.")
            : (isId ? "Pengajuan toko ditolak." : "Application rejected.");
      toast.success(message);
      setOpenMenuId(null);
      setActionDialog({ open: false, type: "", entry: null, note: "", internalNote: "" });
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["admin", "store-applications"], exact: false });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, isId ? "Gagal memproses aksi." : "Action failed."));
    },
  });

  const handleOpenAction = (type, entry) => {
    setOpenMenuId(null);
    setActionDialog({
      open: true,
      type,
      entry,
      note: "",
      internalNote: "",
    });
  };

  const handleConfirmAction = () => {
    mutation.mutate({
      action: actionDialog.type,
      entry: actionDialog.entry,
      note: actionDialog.note,
      internalNote: actionDialog.internalNote,
    });
  };

  const updateParams = (patch) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      const normalized = String(value ?? "").trim();
      if (!normalized) next.delete(key);
      else next.set(key, normalized);
    });
    if (!Object.prototype.hasOwnProperty.call(patch, "page")) {
      next.set("page", "1");
    }
    setSearchParams(next);
  };

  const applyFilters = () => {
    updateParams({
      status: filters.status,
      completeness: filters.completeness,
      search: filters.search,
    });
  };

  const resetFilters = () => {
    setFilters({ status: "", completeness: "", search: "" });
    setSearchParams({ page: "1", limit: String(perPage) });
  };

  const statusOptions = useMemo(
    () => [
      { value: "", label: isId ? "Semua" : "All" },
      { value: "draft", label: isId ? "Draf" : "Draft" },
      { value: "submitted", label: isId ? "Diajukan" : "Submitted" },
      { value: "under_review", label: isId ? "Ditinjau" : "In Review" },
      { value: "revision_requested", label: isId ? "Perlu Revisi" : "Needs Revision" },
      { value: "approved", label: isId ? "Disetujui" : "Approved" },
      { value: "rejected", label: isId ? "Ditolak" : "Rejected" },
      { value: "cancelled", label: isId ? "Dibatalkan" : "Cancelled" },
    ],
    [isId]
  );

  const completenessOptions = useMemo(
    () => [
      { value: "", label: isId ? "Semua Level" : "All levels" },
      { value: "complete", label: isId ? "Lengkap (100%)" : "Complete (100%)" },
      { value: "incomplete", label: isId ? "Belum Lengkap" : "Incomplete" },
      { value: "needs_action", label: isId ? "Perlu Tindakan" : "Needs action" },
    ],
    [isId]
  );

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total || items.length);

  return (
    <div className="asa-page">
      <header className="asa-header">
        <div>
          <span className="asa-eyebrow">{isId ? "Toko Online" : "Online Store"}</span>
          <h1>{isId ? "Pengajuan Toko" : "Store Applications"}</h1>
          <p>
            {isId
              ? "Tinjau pendaftaran seller dan kelola persetujuan toko."
              : "Review onboarding submissions and approve stores."}
          </p>
        </div>
        <div className="asa-header__actions">
          <span className="asa-total-badge">
            {kpis.total} {isId ? "pengajuan" : "applications"}
          </span>
          <button
            type="button"
            className="asa-primary"
            onClick={() => applicationsQuery.refetch()}
            disabled={applicationsQuery.isFetching}
            title={isId ? "Segarkan pengajuan toko" : "Refresh store applications"}
          >
            <RefreshCw size={16} aria-hidden="true" />
            {isId ? "Segarkan" : "Refresh"}
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="asa-kpis" aria-label={isId ? "Ringkasan metrik pengajuan" : "Application metrics"}>
        <KpiCard
          icon={AlertTriangle}
          label={isId ? "Perlu Tindakan" : "Needs Action"}
          value={kpis.needsAction}
          helper={isId ? "Menunggu peninjauan" : "Awaiting review"}
          tone="orange"
        />
        <KpiCard
          icon={ShieldCheck}
          label={isId ? "Terverifikasi" : "Verified"}
          value={kpis.verified}
          helper={isId ? "100% lengkap" : "100% complete"}
          tone="blue"
        />
        <KpiCard
          icon={Clock3}
          label={isId ? "Siap Diproses" : "Ready"}
          value={kpis.ready}
          helper={isId ? "Draf siap proses" : "Ready to process"}
          tone="orange"
        />
        <KpiCard
          icon={Archive}
          label={isId ? "Total Pengajuan" : "Total"}
          value={kpis.total}
          helper={isId ? "Semua berkas" : "All submissions"}
          tone="blue"
        />
      </section>

      {/* Filter Tabs & Bar */}
      <section className="asa-filter-panel">
        <div className="asa-status-tabs" role="tablist">
          {statusOptions.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              className={filters.status === option.value ? "is-active" : ""}
              onClick={() => {
                setFilters((current) => ({ ...current, status: option.value }));
                updateParams({ status: option.value, page: "1" });
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="asa-filter-grid">
          <label>
            <span>{isId ? "Kelengkapan" : "Completeness"}</span>
            <select
              value={filters.completeness}
              onChange={(event) =>
                setFilters((current) => ({ ...current, completeness: event.target.value }))
              }
            >
              {completenessOptions.map((option) => (
                <option key={option.value || "all-levels"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="asa-search-field">
            <span>{isId ? "Pencarian" : "Search"}</span>
            <Search size={17} aria-hidden="true" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilters();
              }}
              placeholder={isId ? "Cari nama pemohon atau toko..." : "Search applicant or store..."}
            />
          </label>
          <button type="button" className="asa-primary" onClick={applyFilters}>
            <SlidersHorizontal size={16} aria-hidden="true" />
            {isId ? "Terapkan Filter" : "Apply Filter"}
          </button>
          <button type="button" className="asa-secondary" onClick={resetFilters}>
            <RefreshCcw size={16} aria-hidden="true" />
            {isId ? "Atur Ulang" : "Reset"}
          </button>
        </div>
      </section>

      {applicationsQuery.isError ? (
        <AdminOpsErrorState
          message={getErrorMessage(applicationsQuery.error, isId ? "Gagal memuat pengajuan toko." : "Failed to load store applications.")}
          onRetry={() => applicationsQuery.refetch()}
        />
      ) : null}

      {!applicationsQuery.isLoading && !applicationsQuery.isError && items.length === 0 ? (
        <AdminOpsEmptyState
          title={isId ? "Tidak ada pengajuan ditemukan" : "No applications found"}
          description={isId ? "Ubah filter pencarian atau segarkan data." : "Reset filters or refresh the list."}
          actions={
            <button type="button" className="asa-secondary" onClick={resetFilters}>
              {isId ? "Atur Ulang Filter" : "Reset filters"}
            </button>
          }
        />
      ) : null}

      {!applicationsQuery.isError && items.length > 0 ? (
        <section className="asa-table-card">
          {/* Zero-Scroll Desktop Table */}
          <div className="asa-table-scroll">
            <table className="asa-table">
              <colgroup>
                <col className="asa-col-applicant" />
                <col className="asa-col-store" />
                <col className="asa-col-status" />
                <col className="asa-col-submitted" />
                <col className="asa-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>{isId ? "Pemohon" : "Applicant"}</th>
                  <th>{isId ? "Toko & Kategori" : "Store & Category"}</th>
                  <th>{isId ? "Status & Kelengkapan" : "Status & Progress"}</th>
                  <th>{isId ? "Waktu Pengajuan" : "Submission"}</th>
                  <th style={{ textAlign: "right" }}>{isId ? "Aksi" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((entry) => {
                  const applicant = getApplicant(entry, isId);
                  const store = getStore(entry, isId);
                  const status = getStatus(entry);
                  return (
                    <tr key={entry.id}>
                      {/* 1. Applicant */}
                      <td>
                        <div className="asa-person">
                          <span className="asa-avatar">
                            {getInitials(applicant.name)}
                          </span>
                          <div className="asa-person__info">
                            <strong>{applicant.name}</strong>
                            <small>{applicant.email}</small>
                            <span className={`asa-match-badge asa-match-badge--${applicant.matchTone}`}>
                              {applicant.matchLabel}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Store */}
                      <td>
                        <div className="asa-store-cell">
                          <strong>{store.name}</strong>
                          <small>{store.slug ? `@${store.slug}` : (isId ? "Tanpa slug" : "No slug")}</small>
                          <em>{store.description}</em>
                        </div>
                      </td>

                      {/* 3. Status & Progress */}
                      <td>
                        <div className="asa-status-stack">
                          <StatusBadge status={status} isId={isId} />
                          <CompletionCell entry={entry} isId={isId} />
                        </div>
                      </td>

                      {/* 4. Submission & Reviewer */}
                      <td>
                        <div className="asa-date">
                          <span>{formatDate(entry.submittedAt, isId)}</span>
                          <small>
                            {entry.reviewedBy?.name
                              ? `${isId ? "Ditinjau:" : "By:"} ${entry.reviewedBy.name}`
                              : formatTime(entry.submittedAt, isId)}
                          </small>
                        </div>
                      </td>

                      {/* 5. Actions */}
                      <td>
                        <RowActions
                          entry={entry}
                          isOpen={openMenuId === entry.id}
                          onToggle={() =>
                            setOpenMenuId((current) => (current === entry.id ? null : entry.id))
                          }
                          onRequestAction={handleOpenAction}
                          isId={isId}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Responsive Mobile Feed (< 768px) */}
          <div className="asa-mobile-feed">
            {items.map((entry) => {
              const applicant = getApplicant(entry, isId);
              const store = getStore(entry, isId);
              const status = getStatus(entry);
              const isReviewable = status === "submitted" || status === "under_review";
              return (
                <article key={`mob-${entry.id}`} className="asa-mobile-card">
                  <div className="asa-mobile-card__header">
                    <div className="asa-person">
                      <span className="asa-avatar">{getInitials(applicant.name)}</span>
                      <div className="asa-person__info">
                        <strong>{applicant.name}</strong>
                        <small>{applicant.email}</small>
                        <span className={`asa-match-badge asa-match-badge--${applicant.matchTone}`}>
                          {applicant.matchLabel}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={status} isId={isId} />
                  </div>

                  <div className="asa-mobile-card__store">
                    <strong>{store.name}</strong>
                    <small>{store.slug ? `@${store.slug}` : (isId ? "Tanpa slug" : "No slug")}</small>
                    <span style={{ fontSize: "11px", color: "var(--asa-subtle)" }}>{store.description}</span>
                  </div>

                  <CompletionCell entry={entry} isId={isId} />

                  <div className="asa-mobile-card__footer">
                    <div className="asa-date">
                      <span>{formatDate(entry.submittedAt, isId)}</span>
                      <small>{entry.reviewedBy?.name ? entry.reviewedBy.name : formatTime(entry.submittedAt, isId)}</small>
                    </div>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <Link
                        className={`asa-row-primary ${isReviewable ? "is-review" : ""}`}
                        to={`/admin/store/applications/${entry.id}`}
                      >
                        {isReviewable ? (isId ? "Tinjau" : "Review") : (isId ? "Lihat" : "View")}
                      </Link>
                      <button
                        type="button"
                        className="asa-icon-button"
                        onClick={() => handleOpenAction("approve", entry)}
                        title={isId ? "Setujui" : "Approve"}
                        disabled={!canMutate(entry, "approve")}
                      >
                        <CheckCircle2 size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Pagination Footer */}
      <footer className="asa-pagination">
        <p>
          {isId
            ? `Menampilkan ${start} sampai ${end} dari ${meta.total || items.length} pengajuan`
            : `Showing ${start} to ${end} of ${meta.total || items.length} applications`}
        </p>
        <div className="asa-pagination__controls">
          <button
            type="button"
            className="asa-page-button"
            disabled={meta.page <= 1}
            onClick={() => updateParams({ page: Math.max(1, meta.page - 1) })}
            aria-label={isId ? "Halaman sebelumnya" : "Previous page"}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          <span className="asa-current-page">{meta.page}</span>
          <button
            type="button"
            className="asa-page-button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => updateParams({ page: Math.min(meta.totalPages, meta.page + 1) })}
            aria-label={isId ? "Halaman berikutnya" : "Next page"}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </button>
          <label className="asa-per-page">
            <span className="sr-only">{isId ? "Baris per halaman" : "Rows per page"}</span>
            <select
              value={perPage}
              onChange={(event) =>
                updateParams({ limit: event.target.value, page: "1" })
              }
            >
              <option value="10">10 {isId ? "per hal." : "per page"}</option>
              <option value="25">25 {isId ? "per hal." : "per page"}</option>
              <option value="50">50 {isId ? "per hal." : "per page"}</option>
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
        </div>
      </footer>

      {/* Modal Dialog for Actions (Approve, Revision, Reject) */}
      {actionDialog.open ? (
        <div className="asa-modal-backdrop" onClick={() => setActionDialog({ open: false, type: "", entry: null, note: "", internalNote: "" })}>
          <div className="asa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="asa-modal__header">
              <h3>
                {actionDialog.type === "approve"
                  ? (isId ? "Setujui Pengajuan Toko" : "Approve Store Application")
                  : actionDialog.type === "revision"
                    ? (isId ? "Minta Revisi Pengajuan" : "Request Application Revision")
                    : (isId ? "Tolak Pengajuan Toko" : "Reject Store Application")}
              </h3>
              <button
                type="button"
                className="asa-icon-button"
                onClick={() => setActionDialog({ open: false, type: "", entry: null, note: "", internalNote: "" })}
                aria-label={isId ? "Tutup" : "Close"}
              >
                <X size={16} />
              </button>
            </div>

            <div className="asa-modal__body">
              <p style={{ margin: 0, fontSize: "13px", color: "var(--asa-muted)" }}>
                {actionDialog.type === "approve"
                  ? (isId ? "Toko akan diaktifkan dan penjual akan mendapatkan akses ruang kerja toko." : "The store will be provisioned and the seller will gain workspace access.")
                  : actionDialog.type === "revision"
                    ? (isId ? "Tuliskan catatan perbaikan yang harus dipenuhi oleh pemohon." : "Provide specific revision instructions for the seller.")
                    : (isId ? "Tuliskan alasan penolakan pengajuan toko ini." : "Provide the reason for rejecting this application.")}
              </p>

              {actionDialog.type === "revision" || actionDialog.type === "reject" ? (
                <label>
                  <span>{actionDialog.type === "revision" ? (isId ? "Catatan Revisi *" : "Revision Note *") : (isId ? "Alasan Penolakan *" : "Reject Reason *")}</span>
                  <textarea
                    value={actionDialog.note}
                    onChange={(e) => setActionDialog((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder={actionDialog.type === "revision" ? (isId ? "Contoh: Mohon unggah KTP yang lebih jelas..." : "e.g. Please re-upload a clearer ID photo...") : (isId ? "Contoh: Kategori produk tidak sesuai kebijakan..." : "e.g. Products violate store policy...")}
                    required
                  />
                </label>
              ) : null}

              <label>
                <span>{isId ? "Catatan Internal Admin (Opsional)" : "Internal Admin Note (Optional)"}</span>
                <textarea
                  value={actionDialog.internalNote}
                  onChange={(e) => setActionDialog((prev) => ({ ...prev, internalNote: e.target.value }))}
                  placeholder={isId ? "Catatan khusus tim admin..." : "Notes for admin team only..."}
                />
              </label>
            </div>

            <div className="asa-modal__footer">
              <button
                type="button"
                className="asa-secondary"
                onClick={() => setActionDialog({ open: false, type: "", entry: null, note: "", internalNote: "" })}
                disabled={mutation.isPending}
              >
                {isId ? "Batal" : "Cancel"}
              </button>
              <button
                type="button"
                className={actionDialog.type === "reject" ? "asa-primary" : actionDialog.type === "revision" ? "asa-row-primary is-review" : "asa-primary"}
                style={actionDialog.type === "reject" ? { background: "var(--asa-danger)", borderColor: "var(--asa-danger)" } : {}}
                onClick={handleConfirmAction}
                disabled={
                  mutation.isPending ||
                  ((actionDialog.type === "revision" || actionDialog.type === "reject") && !actionDialog.note.trim())
                }
              >
                {mutation.isPending
                  ? (isId ? "Memproses..." : "Processing...")
                  : actionDialog.type === "approve"
                    ? (isId ? "Konfirmasi Setujui" : "Confirm Approval")
                    : actionDialog.type === "revision"
                      ? (isId ? "Kirim Permintaan" : "Send Revision")
                      : (isId ? "Konfirmasi Tolak" : "Confirm Rejection")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
