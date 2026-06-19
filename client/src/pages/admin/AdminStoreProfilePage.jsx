import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Bot,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Filter,
  Grid2X2,
  LayoutList,
  PackageCheck,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import {
  fetchAdminStoreProfiles,
  updateAdminStoreProfile,
} from "../../api/adminStoreProfile.ts";
import {
  AdminOpsEmptyState,
  AdminOpsErrorState,
  AdminOpsLoadingState,
} from "../../components/admin/AdminOpsPrimitives.jsx";
import "./AdminStoreProfilePage.css";

const STORE_PROFILES_QUERY_KEY = ["admin-store-profiles"];

const PROFILE_FIELDS = [
  "name",
  "slug",
  "description",
  "logoUrl",
  "bannerUrl",
  "phone",
  "email",
  "addressLine1",
];

const SHIPPING_FIELDS = [
  "originContactName",
  "originPhone",
  "originAddressLine",
  "originCity",
  "originProvince",
  "originPostalCode",
];

const ISSUE_LABELS = {
  logoUrl: "Logo",
  bannerUrl: "Banner",
  phone: "Phone",
  email: "Contact",
  addressLine1: "Address",
  postalCode: "Postal code",
  description: "Description",
  originContactName: "Contact",
  originPhone: "Phone",
  originAddressLine: "Address",
  originCity: "City",
  originProvince: "Province",
  originPostalCode: "Postal code",
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "review", label: "Review" },
  { id: "profile", label: "Profile" },
  { id: "shipping", label: "Shipping" },
  { id: "public", label: "Public" },
  { id: "live", label: "Live" },
];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Unable to update store profile.";

const textValue = (value, fallback = "") => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const normalizeKey = (key) =>
  String(key || "")
    .replace(/[_-\s]+(.)?/g, (_, letter) => (letter ? letter.toUpperCase() : ""))
    .replace(/^(.)/, (letter) => letter.toLowerCase());

const formatFieldLabel = (value) => {
  const source = String(value || "").trim();
  const compact = ISSUE_LABELS[source] || ISSUE_LABELS[normalizeKey(source)];
  if (compact) return compact;
  return source
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const isPresent = (value) => {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return String(value ?? "").trim().length > 0;
};

export const normalizeStores = (payload) => {
  if (Array.isArray(payload)) return payload.filter(Boolean);
  if (Array.isArray(payload?.data)) return payload.data.filter(Boolean);
  if (Array.isArray(payload?.items)) return payload.items.filter(Boolean);
  if (Array.isArray(payload?.data?.items)) return payload.data.items.filter(Boolean);
  return [];
};

export const getStoreName = (entry) => {
  const store = entry?.store || entry || {};
  return (
    textValue(store.name) ||
    textValue(store.storeName) ||
    textValue(store.publicName) ||
    textValue(entry?.publicIdentity?.name) ||
    "Untitled Store"
  );
};

export const getStoreSlug = (entry) => {
  const store = entry?.store || entry || {};
  return (
    textValue(store.slug) ||
    textValue(store.storeSlug) ||
    textValue(entry?.publicIdentity?.slug) ||
    ""
  );
};

export const getStoreId = (entry) => {
  const store = entry?.store || entry || {};
  return store.id ?? store.storeId ?? entry?.id ?? entry?.storeId ?? getStoreSlug(entry);
};

export const getOwner = (entry) =>
  entry?.owner || entry?.user || entry?.seller || entry?.store?.owner || null;

export const readValue = (entry, key) => {
  const normalizedKey = normalizeKey(key);
  const sources = [
    entry?.store,
    entry,
    entry?.profile,
    entry?.publicProfile,
    entry?.publicIdentity,
    entry?.shipping,
    entry?.shippingOrigin,
    entry?.store?.profile,
    entry?.store?.publicProfile,
    entry?.store?.shipping,
    entry?.store?.shippingOrigin,
    entry?.store?.shippingSetupSummary,
    entry?.store?.shippingSetup,
  ];

  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    if (source[key] !== undefined && source[key] !== null) return source[key];
    if (source[normalizedKey] !== undefined && source[normalizedKey] !== null) {
      return source[normalizedKey];
    }
  }
  return undefined;
};

const normalizeMissingLabel = (field) =>
  formatFieldLabel(field?.label || field?.field || field?.key || field);

export const getMissing = (entry, fields) => {
  const store = entry?.store || entry || {};
  const explicit =
    fields === PROFILE_FIELDS
      ? store?.completeness?.missingFields
      : fields === SHIPPING_FIELDS
        ? store?.missingShippingFields
        : null;

  if (Array.isArray(explicit) && explicit.length > 0) {
    return explicit.map(normalizeMissingLabel).filter(Boolean);
  }

  return fields.filter((field) => !isPresent(readValue(entry, field))).map(formatFieldLabel);
};

export const getProfileScore = (entry) => {
  const store = entry?.store || entry || {};
  const completed = Number(store?.completeness?.completedFields);
  const total = Number(store?.completeness?.totalFields);
  if (Number.isFinite(completed) && Number.isFinite(total) && total > 0) {
    return { complete: completed, total, missing: Math.max(total - completed, 0) };
  }
  const missing = getMissing(entry, PROFILE_FIELDS).length;
  return { complete: PROFILE_FIELDS.length - missing, total: PROFILE_FIELDS.length, missing };
};

export const getShippingScore = (entry) => {
  const missing = getMissing(entry, SHIPPING_FIELDS).length;
  const total = SHIPPING_FIELDS.length;
  return { complete: total - missing, total, missing };
};

const hasPublicReadiness = (entry) => {
  const readiness = entry?.publicIdentity?.summary?.operationalReadiness;
  if (readiness && typeof readiness.isReady === "boolean") return readiness.isReady;
  return Boolean(getStoreSlug(entry) && getProfileScore(entry).complete >= 3);
};

export const getPriority = (entry) => {
  const profileMissing = getProfileScore(entry).missing;
  const shippingMissing = getShippingScore(entry).missing;
  const status = String(readValue(entry, "status") || "").toUpperCase();
  const totalMissing = profileMissing + shippingMissing;
  if (totalMissing >= 4 || status !== "ACTIVE" || !hasPublicReadiness(entry)) return "High";
  if (totalMissing > 0) return "Medium";
  return "Low";
};

export const filterStore = (entry, activeFilter) => {
  const profileMissing = getProfileScore(entry).missing;
  const shippingMissing = getShippingScore(entry).missing;
  const status = String(readValue(entry, "status") || "").toUpperCase();
  switch (activeFilter) {
    case "review":
      return profileMissing > 0 || shippingMissing > 0;
    case "profile":
      return profileMissing > 0;
    case "shipping":
      return shippingMissing > 0;
    case "public":
      return hasPublicReadiness(entry);
    case "live":
      return status === "ACTIVE";
    default:
      return true;
  }
};

const getStatusLabel = (entry) => {
  const status = String(readValue(entry, "status") || "ACTIVE").toUpperCase();
  return status === "ACTIVE" ? "Live" : "Inactive";
};

const getInitials = (name) => {
  const words = textValue(name, "S").split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
};

const getIssueList = (entry) => {
  const issues = [...getMissing(entry, PROFILE_FIELDS), ...getMissing(entry, SHIPPING_FIELDS)];
  return Array.from(new Set(issues)).slice(0, 6);
};

const getPreviewRows = (entry) => {
  const hasDescription = isPresent(readValue(entry, "description"));
  const hasContact =
    isPresent(readValue(entry, "email")) ||
    isPresent(readValue(entry, "phone")) ||
    isPresent(readValue(entry, "whatsapp"));
  const hasAddress =
    isPresent(readValue(entry, "addressLine1")) ||
    isPresent(readValue(entry, "originAddressLine"));
  return [
    { label: "Description", ready: hasDescription },
    { label: "Contact", ready: hasContact },
    { label: "Address", ready: hasAddress },
  ];
};

const getPriorityRank = (entry) => {
  const priority = getPriority(entry);
  if (priority === "High") return 0;
  if (priority === "Medium") return 1;
  return 2;
};

function MetricCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <section className={`asp2026-metric asp2026-metric--${tone}`}>
      <span className="asp2026-metric__icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <div className="asp2026-metric__body">
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      {helper ? <span className="asp2026-metric__helper">{helper}</span> : null}
    </section>
  );
}

function Chip({ children, tone = "neutral" }) {
  return <span className={`asp2026-chip asp2026-chip--${tone}`}>{children}</span>;
}

function DetailsButton({ icon: Icon, label }) {
  return (
    <button type="button" className="asp2026-detail-button">
      <Icon size={17} aria-hidden="true" />
      <span>{label}</span>
      <ChevronDown size={15} aria-hidden="true" />
    </button>
  );
}

function StoreReviewCard({
  entry,
  draft,
  expanded,
  saving,
  mutationError,
  onToggle,
  onDraftChange,
  onSave,
}) {
  const storeId = getStoreId(entry);
  const name = getStoreName(entry);
  const slug = getStoreSlug(entry);
  const profileScore = getProfileScore(entry);
  const shippingScore = getShippingScore(entry);
  const priority = getPriority(entry);
  const issues = getIssueList(entry);
  const owner = getOwner(entry);
  const storefrontHref = slug ? `/store/${encodeURIComponent(slug)}` : null;
  const publicReady = hasPublicReadiness(entry);
  const statusLabel = getStatusLabel(entry);
  const summaryId = `asp2026-store-summary-${storeId}`;
  const detailId = `asp2026-store-detail-${storeId}`;

  const priorityTone =
    priority === "High" ? "danger" : priority === "Medium" ? "warning" : "success";

  return (
    <article className={`asp2026-store-card ${expanded ? "is-expanded" : ""}`}>
      <button
        type="button"
        id={summaryId}
        className="asp2026-store-summary"
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
      >
        <span className="asp2026-avatar">{getInitials(name)}</span>
        <span className="asp2026-store-title">
          <strong>{name}</strong>
          <small>{slug || "no-slug"}</small>
        </span>
        <span className="asp2026-summary-meta">
          <span className="asp2026-summary-item">
            <small>Status</small>
            <Chip tone={statusLabel === "Live" ? "success" : "neutral"}>{statusLabel}</Chip>
          </span>
          <span className="asp2026-summary-item">
            <small>Profile</small>
            <strong>
              {profileScore.complete}/{profileScore.total}
            </strong>
          </span>
          <span className="asp2026-summary-item">
            <small>Shipping</small>
            <Chip tone={shippingScore.missing ? "warning" : "success"}>
              {shippingScore.missing ? `${shippingScore.missing} Missing` : "Ready"}
            </Chip>
          </span>
          <span className="asp2026-summary-item">
            <small>Priority</small>
            <Chip tone={priorityTone}>{priority}</Chip>
          </span>
        </span>
        <span className="asp2026-chevron" aria-hidden="true">
          <ChevronDown size={20} />
        </span>
      </button>

      {expanded ? (
        <div
          id={detailId}
          className="asp2026-card-detail"
          role="region"
          aria-labelledby={summaryId}
        >
          <section className="asp2026-panel asp2026-panel--issues">
            <div className="asp2026-panel__head">
              <h2>Issues</h2>
              <Chip tone={issues.length ? "danger" : "success"}>
                {issues.length ? `${issues.length} Missing` : "Clear"}
              </Chip>
            </div>
            <div className="asp2026-issue-grid">
              {issues.length ? (
                issues.map((issue) => (
                  <span key={`${storeId}-${issue}`} className="asp2026-issue-chip">
                    <span aria-hidden="true">!</span>
                    {issue}
                  </span>
                ))
              ) : (
                <p className="asp2026-muted">Ready for publishing review.</p>
              )}
            </div>
          </section>

          <section className="asp2026-panel">
            <div className="asp2026-panel__head">
              <h2>Preview</h2>
              <Chip tone={publicReady ? "success" : "warning"}>
                {publicReady ? "Operational" : "Gated"}
              </Chip>
            </div>
            <div className="asp2026-preview-list">
              {getPreviewRows(entry).map((row) => (
                <div key={row.label}>
                  <span>{row.label}</span>
                  <strong className={row.ready ? "is-ready" : "is-missing"}>
                    {row.ready ? "Ready" : "Missing"}
                  </strong>
                </div>
              ))}
            </div>
            {storefrontHref ? (
              <Link className="asp2026-soft-button" to={storefrontHref}>
                Open Storefront
                <ExternalLink size={15} aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" className="asp2026-soft-button" disabled>
                Open Storefront
              </button>
            )}
          </section>

          <section className="asp2026-panel asp2026-panel--ai">
            <div className="asp2026-panel__head">
              <h2>AI</h2>
              <Bot size={18} aria-hidden="true" />
            </div>
            <button
              type="button"
              className="asp2026-ai-button"
              onClick={() => toast("AI suggestions are preview-only for now.")}
            >
              <Bot size={17} aria-hidden="true" />
              Suggest Fixes
            </button>
          </section>

          <section className="asp2026-panel asp2026-panel--core">
            <div className="asp2026-panel__head">
              <h2>Core</h2>
            </div>
            <form className="asp2026-core-form" onSubmit={onSave}>
              <label>
                <span>Store Name</span>
                <input
                  value={draft.name}
                  onChange={(event) => onDraftChange({ name: event.target.value })}
                  disabled={saving}
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  value={draft.slug}
                  onChange={(event) => onDraftChange({ slug: event.target.value })}
                  disabled={saving}
                />
              </label>
              <label>
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(event) => onDraftChange({ status: event.target.value })}
                  disabled={saving}
                >
                  <option value="ACTIVE">Live</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <button type="submit" className="asp2026-primary-button" disabled={saving}>
                <Save size={16} aria-hidden="true" />
                {saving ? "Saving" : "Save Core"}
              </button>
              {mutationError ? (
                <p className="asp2026-form-error">{getErrorMessage(mutationError)}</p>
              ) : null}
            </form>
          </section>

          <section className="asp2026-panel asp2026-panel--details">
            <div className="asp2026-panel__head">
              <h2>Details</h2>
            </div>
            <div className="asp2026-detail-list">
              <DetailsButton icon={UserRound} label={owner?.name || owner?.email || "Seller"} />
              <DetailsButton icon={Store} label="Public" />
              <DetailsButton icon={Truck} label="Shipping" />
              <DetailsButton icon={ShieldCheck} label="Ownership" />
            </div>
          </section>

          <section className="asp2026-panel asp2026-panel--ownership">
            <div className="asp2026-panel__head">
              <h2>Ownership</h2>
            </div>
            <div className="asp2026-ownership-grid">
              <div>
                <span className="asp2026-dot asp2026-dot--green" />
                <strong>Admin</strong>
                <small>Name, Slug, Status</small>
              </div>
              <div>
                <span className="asp2026-dot asp2026-dot--blue" />
                <strong>Seller</strong>
                <small>Logo, Phone, Address</small>
              </div>
              <div>
                <span className="asp2026-dot asp2026-dot--purple" />
                <strong>Shared</strong>
                <small>Description, Contact, Social</small>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </article>
  );
}

export default function AdminStoreProfilePage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortMode, setSortMode] = useState("priority");
  const [viewMode, setViewMode] = useState("list");
  const [expandedStoreId, setExpandedStoreId] = useState(null);
  const [drafts, setDrafts] = useState({});
  const [pendingStoreId, setPendingStoreId] = useState(null);
  const [failedStoreId, setFailedStoreId] = useState(null);

  const profilesQuery = useQuery({
    queryKey: STORE_PROFILES_QUERY_KEY,
    queryFn: fetchAdminStoreProfiles,
  });

  const stores = useMemo(() => normalizeStores(profilesQuery.data), [profilesQuery.data]);

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };
      stores.forEach((entry) => {
        const id = getStoreId(entry);
        if (id === undefined || id === null || next[id]) return;
        next[id] = {
          name: getStoreName(entry),
          slug: getStoreSlug(entry),
          status: String(readValue(entry, "status") || "ACTIVE").toUpperCase(),
        };
      });
      return next;
    });
  }, [stores]);

  useEffect(() => {
    if (expandedStoreId !== null) return;
    if (stores.length > 0) setExpandedStoreId(getStoreId(stores[0]));
  }, [expandedStoreId, stores]);

  const mutation = useMutation({
    mutationFn: ({ storeId, payload }) => updateAdminStoreProfile(storeId, payload),
    meta: { suppressGlobalToast: true },
    onMutate: ({ storeId }) => {
      setPendingStoreId(storeId);
      setFailedStoreId(null);
    },
    onSuccess: async () => {
      setFailedStoreId(null);
      toast.success("Core saved", { id: "admin-store-profile-core-saved" });
      await queryClient.invalidateQueries({ queryKey: STORE_PROFILES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["storefront"], exact: false });
    },
    onError: (error, variables) => {
      setFailedStoreId(variables?.storeId ?? null);
      toast.error(getErrorMessage(error), { id: "admin-store-profile-core-error" });
    },
    onSettled: () => {
      setPendingStoreId(null);
    },
  });

  const summary = useMemo(() => {
    const review = stores.filter((entry) => filterStore(entry, "review")).length;
    const profile = stores.filter((entry) => filterStore(entry, "profile")).length;
    const shipping = stores.filter((entry) => filterStore(entry, "shipping")).length;
    return { stores: stores.length, review, profile, shipping };
  }, [stores]);

  const chipCounts = useMemo(
    () =>
      FILTERS.reduce((acc, filter) => {
        acc[filter.id] =
          filter.id === "all"
            ? stores.length
            : stores.filter((entry) => filterStore(entry, filter.id)).length;
        return acc;
      }, {}),
    [stores]
  );

  const visibleStores = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return stores
      .filter((entry) => filterStore(entry, activeFilter))
      .filter((entry) => {
        if (!query) return true;
        const owner = getOwner(entry);
        return [getStoreName(entry), getStoreSlug(entry), owner?.name, owner?.email]
          .some((value) => String(value || "").toLowerCase().includes(query));
      })
      .sort((a, b) => {
        if (sortMode === "name") {
          return getStoreName(a).localeCompare(getStoreName(b));
        }
        return (
          getPriorityRank(a) - getPriorityRank(b) ||
          getStoreName(a).localeCompare(getStoreName(b))
        );
      });
  }, [activeFilter, searchTerm, sortMode, stores]);

  const updateDraft = (storeId, patch) => {
    setDrafts((current) => ({
      ...current,
      [storeId]: {
        ...(current[storeId] || {}),
        ...patch,
      },
    }));
  };

  const saveCore = (event, entry) => {
    event.preventDefault();
    const storeId = getStoreId(entry);
    const draft = drafts[storeId] || {};
    mutation.mutate({
      storeId,
      payload: {
        name: textValue(draft.name),
        slug: textValue(draft.slug),
        status: textValue(draft.status, "ACTIVE"),
      },
    });
  };

  if (profilesQuery.isLoading) {
    return <AdminOpsLoadingState title="Loading store profiles..." />;
  }

  if (profilesQuery.isError) {
    return (
      <AdminOpsErrorState
        message={getErrorMessage(profilesQuery.error) || "Failed to load store profiles."}
        onRetry={() => profilesQuery.refetch()}
      />
    );
  }

  return (
    <div className={`asp2026 asp2026--${viewMode}`}>
      <header className="asp2026-header">
        <div>
          <h1>Store Profile</h1>
          <p>Review store readiness before publishing.</p>
        </div>
        <div className="asp2026-header__actions">
          <Link className="asp2026-primary-button" to="/admin/store/applications">
            <Plus size={17} aria-hidden="true" />
            Add Store
          </Link>
        </div>
      </header>

      <section className="asp2026-metrics" aria-label="Store profile metrics">
        <MetricCard icon={Store} label="Stores" value={summary.stores} helper="+3" tone="green" />
        <MetricCard
          icon={ClipboardList}
          label="Review"
          value={summary.review}
          helper={summary.stores ? `${Math.round((summary.review / summary.stores) * 100)}%` : "0%"}
          tone="orange"
        />
        <MetricCard
          icon={PackageCheck}
          label="Profile"
          value={summary.profile}
          helper={summary.stores ? `${Math.round((summary.profile / summary.stores) * 100)}%` : "0%"}
          tone="blue"
        />
        <MetricCard
          icon={Truck}
          label="Shipping"
          value={summary.shipping}
          helper={
            summary.stores ? `${Math.round((summary.shipping / summary.stores) * 100)}%` : "0%"
          }
          tone="red"
        />
      </section>

      <section className="asp2026-toolbar" aria-label="Store profile controls">
        <label className="asp2026-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search store</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search store"
          />
        </label>
        <select
          className="asp2026-select"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value)}
          aria-label="Sort stores"
        >
          <option value="priority">Priority: High first</option>
          <option value="name">Name A-Z</option>
        </select>
        <div className="asp2026-view-toggle" aria-label="View mode">
          <button
            type="button"
            className={viewMode === "list" ? "is-active" : ""}
            onClick={() => setViewMode("list")}
            title="List view"
            aria-pressed={viewMode === "list"}
          >
            <LayoutList size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={viewMode === "grid" ? "is-active" : ""}
            onClick={() => setViewMode("grid")}
            title="Grid view"
            aria-pressed={viewMode === "grid"}
          >
            <Grid2X2 size={18} aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          className="asp2026-filter-button"
          onClick={() => toast("Advanced filters are not connected yet.")}
        >
          <Filter size={17} aria-hidden="true" />
          Filters
        </button>
      </section>

      <nav className="asp2026-filters" aria-label="Store profile filters">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilter === filter.id ? "is-active" : ""}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
            <span>{chipCounts[filter.id] || 0}</span>
          </button>
        ))}
      </nav>

      {stores.length === 0 ? (
        <AdminOpsEmptyState
          title="No store profiles yet"
          description="Store profiles will appear here after stores are created."
          actions={
            <Link className="asp2026-primary-button" to="/admin/store/applications">
              <Plus size={17} aria-hidden="true" />
              Add Store
            </Link>
          }
        />
      ) : visibleStores.length === 0 ? (
        <AdminOpsEmptyState
          title="No matching stores"
          description="Try a different search or filter."
          actions={
            <button
              type="button"
              className="asp2026-soft-button"
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("all");
              }}
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <section className="asp2026-store-list" aria-label="Store review list">
          {visibleStores.map((entry) => {
            const storeId = getStoreId(entry);
            const draft = drafts[storeId] || {
              name: getStoreName(entry),
              slug: getStoreSlug(entry),
              status: String(readValue(entry, "status") || "ACTIVE").toUpperCase(),
            };
            const isSaving = mutation.isPending && pendingStoreId === storeId;
            const mutationError =
              mutation.isError && failedStoreId === storeId ? mutation.error : null;

            return (
              <StoreReviewCard
                key={storeId}
                entry={entry}
                draft={draft}
                expanded={expandedStoreId === storeId}
                saving={isSaving}
                mutationError={mutationError}
                onToggle={() =>
                  setExpandedStoreId((current) => (current === storeId ? null : storeId))
                }
                onDraftChange={(patch) => updateDraft(storeId, patch)}
                onSave={(event) => saveCore(event, entry)}
              />
            );
          })}
        </section>
      )}
    </div>
  );
}
