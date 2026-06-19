import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoreVertical,
  RefreshCcw,
  RefreshCw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
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

const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "In Review" },
  { value: "revision_requested", label: "Needs Revision" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const COMPLETENESS_OPTIONS = [
  { value: "", label: "All levels" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "needs_action", label: "Needs action" },
];

const STATUS_LABELS = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "In Review",
  revision_requested: "Needs Revision",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

const STATUS_TONES = {
  draft: "neutral",
  submitted: "warning",
  under_review: "info",
  revision_requested: "danger",
  approved: "success",
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

const getApplicant = (entry) => {
  const applicant = entry?.applicant || entry?.user || entry?.owner || {};
  const identityMatch = applicant?.identityMatch || entry?.identityMatch || {};
  return {
    name:
      applicant.accountName ||
      applicant.name ||
      applicant.fullName ||
      entry?.ownerIdentity?.fullName ||
      "Unknown applicant",
    email: applicant.accountEmail || applicant.email || entry?.email || "-",
    match:
      identityMatch.summaryLabel ||
      applicant.identityMatchLabel ||
      entry?.identityMatchLabel ||
      "mostly match",
  };
};

const getStore = (entry) => {
  const store = entry?.store || entry?.storeInformation || entry?.storeSnapshot || {};
  return {
    name: store.storeName || store.name || entry?.storeName || "-",
    slug: store.storeSlug || store.slug || entry?.storeSlug || "",
    category: store.storeCategory || store.category || "-",
    ownerType: store.sellerType || store.ownerType || store.type || "-",
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
    label: completeness.label || (total > 0 && completed >= total ? "Ready to submit" : "Needs completion"),
  };
};

const getStatus = (entry) => String(entry?.status || "draft").trim().toLowerCase();

const getInitials = (name) =>
  text(name, "A")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
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
        <Icon size={24} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </section>
  );
}

function StatusBadge({ status }) {
  const normalized = String(status || "draft").toLowerCase();
  return (
    <span className={`asa-status asa-status--${STATUS_TONES[normalized] || "neutral"}`}>
      {STATUS_LABELS[normalized] || text(status, "Draft")}
    </span>
  );
}

function CompletionCell({ entry }) {
  const completion = getCompletion(entry);
  const barTone = completion.isComplete ? "success" : completion.percent >= 60 ? "info" : "warning";
  return (
    <div className="asa-completion">
      <strong>
        {completion.completed}/{completion.total || 0}
      </strong>
      <span className="asa-progress" aria-hidden="true">
        <span
          className={`asa-progress__bar asa-progress__bar--${barTone}`}
          style={{ width: `${completion.percent}%` }}
        />
      </span>
      <small>{completion.percent}% complete</small>
      <em>{completion.label}</em>
    </div>
  );
}

function LoadingRows() {
  return (
    <div className="asa-table-card">
      <div className="asa-table-scroll">
        <table className="asa-table">
          <thead>
            <tr>
              {["Applicant", "Store", "Status", "Completion", "Submitted", "Reviewed", "Actions"].map(
                (heading) => (
                  <th key={heading}>{heading}</th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, index) => (
              <tr key={`asa-loading-${index}`}>
                {Array.from({ length: 7 }).map((__, cellIndex) => (
                  <td key={`asa-loading-${index}-${cellIndex}`}>
                    <span className="asa-skeleton" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RowActions({ entry, isOpen, onToggle, onMutate }) {
  return (
    <div className="asa-actions">
      <Link
        className={`asa-row-primary ${getStatus(entry) === "submitted" ? "is-review" : ""}`}
        to={`/admin/store/applications/${entry.id}`}
      >
        {getStatus(entry) === "submitted" || getStatus(entry) === "under_review"
          ? "Review"
          : getStatus(entry) === "draft"
            ? "Open"
            : "View"}
      </Link>
      <div className="asa-kebab">
        <button
          type="button"
          className="asa-icon-button"
          aria-label="More actions"
          aria-expanded={isOpen}
          onClick={onToggle}
        >
          <MoreVertical size={18} aria-hidden="true" />
        </button>
        {isOpen ? (
          <div className="asa-menu">
            <Link to={`/admin/store/applications/${entry.id}`}>View detail</Link>
            <button
              type="button"
              disabled={!canMutate(entry, "approve")}
              onClick={() => onMutate("approve", entry)}
            >
              Approve
            </button>
            <button
              type="button"
              disabled={!canMutate(entry, "revision")}
              onClick={() => onMutate("revision", entry)}
            >
              Request revision
            </button>
            <button
              type="button"
              disabled={!canMutate(entry, "reject")}
              onClick={() => onMutate("reject", entry)}
            >
              Reject
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function AdminStoreApplicationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    status: searchParams.get("status") || "",
    completeness: searchParams.get("completeness") || "",
    search: searchParams.get("search") || "",
  });
  const [openMenuId, setOpenMenuId] = useState(null);

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
      const applicant = getApplicant(entry);
      const store = getStore(entry);
      const matchesCompleteness =
        !appliedCompleteness ||
        (appliedCompleteness === "complete" && completion.isComplete) ||
        (appliedCompleteness === "incomplete" && !completion.isComplete) ||
        (appliedCompleteness === "needs_action" &&
          ["submitted", "under_review", "revision_requested"].includes(status));
      const matchesSearch =
        !search ||
        [applicant.name, applicant.email, store.name, store.slug, store.category]
          .some((value) => String(value || "").toLowerCase().includes(search));
      return matchesCompleteness && matchesSearch;
    });
  }, [appliedCompleteness, appliedSearch, rawItems]);

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
    mutationFn: async ({ action, entry }) => {
      if (action === "approve") {
        return approveAdminStoreApplication(entry.id, { internalAdminNote: null });
      }
      if (action === "revision") {
        const note = window.prompt("Revision note for applicant:");
        if (!note || !note.trim()) throw new Error("Revision note is required.");
        const internalAdminNote = window.prompt("Internal admin note (optional):") || null;
        return requestAdminStoreApplicationRevision(entry.id, {
          revisionNote: note.trim(),
          revisionSummary: null,
          internalAdminNote,
        });
      }
      if (action === "reject") {
        const note = window.prompt("Reject reason:");
        if (!note || !note.trim()) throw new Error("Reject reason is required.");
        const internalAdminNote = window.prompt("Internal admin note (optional):") || null;
        return rejectAdminStoreApplication(entry.id, {
          rejectReason: note.trim(),
          internalAdminNote,
        });
      }
      return null;
    },
    onSuccess: async (_data, variables) => {
      const message =
        variables.action === "approve"
          ? "Application approved"
          : variables.action === "revision"
            ? "Revision requested"
            : "Application rejected";
      toast.success(message);
      setOpenMenuId(null);
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY], exact: false });
      await queryClient.invalidateQueries({ queryKey: ["admin", "store-applications"], exact: false });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Action failed."));
    },
  });

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

  const start = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const end = Math.min(meta.page * meta.limit, meta.total || items.length);

  return (
    <div className="asa-page">
      <header className="asa-header">
        <div>
          <span className="asa-eyebrow">Online Store</span>
          <h1>Store Applications</h1>
          <p>Review onboarding submissions and approve stores.</p>
        </div>
        <div className="asa-header__actions">
          <span className="asa-total-badge">{kpis.total} applications</span>
          <button
            type="button"
            className="asa-primary"
            onClick={() => applicationsQuery.refetch()}
            disabled={applicationsQuery.isFetching}
          >
            <RefreshCw size={17} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </header>

      <section className="asa-kpis" aria-label="Application metrics">
        <KpiCard
          icon={AlertTriangle}
          label="Needs Action"
          value={kpis.needsAction}
          helper="Requires your attention"
          tone="warning"
        />
        <KpiCard
          icon={ShieldCheck}
          label="Verified"
          value={kpis.verified}
          helper="All set"
          tone="success"
        />
        <KpiCard icon={Clock3} label="Ready" value={kpis.ready} helper="Waiting for updates" tone="info" />
        <KpiCard icon={Archive} label="Total" value={kpis.total} helper="All applications" tone="neutral" />
      </section>

      <section className="asa-filter-panel">
        <div className="asa-status-tabs">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value || "all"}
              type="button"
              className={filters.status === option.value ? "is-active" : ""}
              onClick={() => setFilters((current) => ({ ...current, status: option.value }))}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="asa-filter-grid">
          <label>
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({ ...current, status: event.target.value }))
              }
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value || "all-statuses"} value={option.value}>
                  {option.value ? option.label : "All statuses"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Completeness</span>
            <select
              value={filters.completeness}
              onChange={(event) =>
                setFilters((current) => ({ ...current, completeness: event.target.value }))
              }
            >
              {COMPLETENESS_OPTIONS.map((option) => (
                <option key={option.value || "all-levels"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="asa-search-field">
            <span>Search</span>
            <Search size={18} aria-hidden="true" />
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({ ...current, search: event.target.value }))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") applyFilters();
              }}
              placeholder="Search applicant or store..."
            />
          </label>
          <button type="button" className="asa-primary" onClick={applyFilters}>
            <SlidersHorizontal size={17} aria-hidden="true" />
            Apply Filter
          </button>
          <button type="button" className="asa-secondary" onClick={resetFilters}>
            <RefreshCcw size={17} aria-hidden="true" />
            Reset
          </button>
        </div>
      </section>

      {applicationsQuery.isLoading ? <LoadingRows /> : null}

      {applicationsQuery.isError ? (
        <AdminOpsErrorState
          message={getErrorMessage(applicationsQuery.error, "Failed to load store applications.")}
          onRetry={() => applicationsQuery.refetch()}
        />
      ) : null}

      {!applicationsQuery.isLoading && !applicationsQuery.isError ? (
        <section className="asa-table-card">
          {items.length === 0 ? (
            <AdminOpsEmptyState
              title="No applications found"
              description="Reset filters or refresh the list."
              actions={
                <button type="button" className="asa-secondary" onClick={resetFilters}>
                  Reset filters
                </button>
              }
            />
          ) : (
            <div className="asa-table-scroll">
              <table className="asa-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Store</th>
                    <th>Status</th>
                    <th>Completion</th>
                    <th>Submitted</th>
                    <th>Reviewed</th>
                    <th className="asa-th-actions">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((entry) => {
                    const applicant = getApplicant(entry);
                    const store = getStore(entry);
                    const status = getStatus(entry);
                    return (
                      <tr key={entry.id}>
                        <td>
                          <div className="asa-person">
                            <span className={`asa-avatar asa-avatar--${status}`}>
                              {getInitials(applicant.name)}
                            </span>
                            <div>
                              <strong>{applicant.name}</strong>
                              <small>{applicant.email}</small>
                              <em>Identity match: {applicant.match}</em>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="asa-store-cell">
                            <strong>{store.name}</strong>
                            <small>{store.slug ? `@${store.slug}` : "No slug"}</small>
                            <em>
                              {store.category} • {store.ownerType}
                            </em>
                          </div>
                        </td>
                        <td>
                          <div className="asa-status-stack">
                            <StatusBadge status={status} />
                            <span className="asa-step">{entry?.currentStepMeta?.label || "Review"}</span>
                          </div>
                        </td>
                        <td>
                          <CompletionCell entry={entry} />
                        </td>
                        <td>
                          <div className="asa-date">
                            <CalendarDays size={14} aria-hidden="true" />
                            <span>{formatDate(entry.submittedAt)}</span>
                            <small>{formatTime(entry.submittedAt)}</small>
                          </div>
                        </td>
                        <td>
                          <div className="asa-date">
                            <span>{formatDate(entry.reviewedAt)}</span>
                            <small>{entry.reviewedBy?.name || formatTime(entry.reviewedAt) || "-"}</small>
                          </div>
                        </td>
                        <td className="asa-cell-actions">
                          <RowActions
                            entry={entry}
                            isOpen={openMenuId === entry.id}
                            onToggle={() =>
                              setOpenMenuId((current) => (current === entry.id ? null : entry.id))
                            }
                            onMutate={(action, target) => mutation.mutate({ action, entry: target })}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <footer className="asa-pagination">
        <p>
          Showing {start} to {end} of {meta.total || items.length} applications
        </p>
        <div className="asa-pagination__controls">
          <button
            type="button"
            className="asa-page-button"
            disabled={meta.page <= 1}
            onClick={() => updateParams({ page: Math.max(1, meta.page - 1) })}
            aria-label="Previous page"
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <span className="asa-current-page">{meta.page}</span>
          <button
            type="button"
            className="asa-page-button"
            disabled={meta.page >= meta.totalPages}
            onClick={() => updateParams({ page: Math.min(meta.totalPages, meta.page + 1) })}
            aria-label="Next page"
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
          <label className="asa-per-page">
            <span className="sr-only">Rows per page</span>
            <select
              value={perPage}
              onChange={(event) =>
                updateParams({ limit: event.target.value, page: "1" })
              }
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
            <ChevronDown size={15} aria-hidden="true" />
          </label>
        </div>
      </footer>
    </div>
  );
}
