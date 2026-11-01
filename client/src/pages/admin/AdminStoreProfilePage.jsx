import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Grid2X2,
  LayoutList,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Search,
  Store,
  Truck,
  Upload,
  UserRound,
} from "lucide-react";
import {
  fetchAdminStoreProfiles,
  updateAdminStoreProfile,
  uploadAdminStoreProfileImage,
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
  phone: "Telepon",
  email: "Email",
  addressLine1: "Alamat",
  postalCode: "Kode Pos",
  description: "Deskripsi",
  originContactName: "Kontak Pengirim",
  originPhone: "Telepon Pengirim",
  originAddressLine: "Alamat Asal",
  originCity: "Kota Asal",
  originProvince: "Provinsi Asal",
  originPostalCode: "Kode Pos Asal",
};

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "review", label: "Perlu Tinjau" },
  { id: "profile", label: "Profil" },
  { id: "shipping", label: "Pengiriman" },
  { id: "public", label: "Publik" },
  { id: "live", label: "Aktif" },
];

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Gagal memperbarui profil toko.";

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
    "Toko Tanpa Nama"
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
  const hasLogo = isPresent(readValue(entry, "logoUrl"));
  const hasBanner = isPresent(readValue(entry, "bannerUrl"));
  const hasDescription = isPresent(readValue(entry, "description"));
  const hasContact =
    isPresent(readValue(entry, "email")) ||
    isPresent(readValue(entry, "phone")) ||
    isPresent(readValue(entry, "whatsapp"));
  const hasAddress =
    isPresent(readValue(entry, "addressLine1")) ||
    isPresent(readValue(entry, "originAddressLine"));
  return [
    { label: "Logo", ready: hasLogo },
    { label: "Banner", ready: hasBanner },
    { label: "Deskripsi", ready: hasDescription },
    { label: "Kontak", ready: hasContact },
    { label: "Alamat", ready: hasAddress },
  ];
};

const getPriorityRank = (entry) => {
  const priority = getPriority(entry);
  if (priority === "High") return 0;
  if (priority === "Medium") return 1;
  return 2;
};

function MetricCard({ icon: Icon, label, value, tone = "blue" }) {
  return (
    <div className={`asp2026-metric asp2026-metric--${tone}`}>
      <div className="asp2026-metric__icon" aria-hidden="true">
        <Icon size={20} />
      </div>
      <div className="asp2026-metric__body">
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Chip({ children, tone = "neutral" }) {
  return <span className={`asp2026-chip asp2026-chip--${tone}`}>{children}</span>;
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
  const previewRows = getPreviewRows(entry);

  const logoUrl = textValue(readValue(entry, "logoUrl"));
  const [uploadingField, setUploadingField] = useState(null);

  const handleUpload = async (event, fieldName) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingField(fieldName);
    try {
      const url = await uploadAdminStoreProfileImage(file);
      if (url) {
        onDraftChange({ [fieldName]: url });
        toast.success(`${fieldName === "logoUrl" ? "Logo" : "Banner"} tersimpan`);
      }
    } catch (error) {
      toast.error(getErrorMessage(error) || "Gagal upload");
    } finally {
      setUploadingField(null);
      event.target.value = "";
    }
  };

  const priorityTone =
    priority === "High" ? "danger" : priority === "Medium" ? "warning" : "success";

  return (
    <article className={`asp2026-store-card ${expanded ? "is-expanded" : ""}`}>
      {/* SUMMARY HEADER ROW */}
      <div
        id={summaryId}
        className="asp2026-store-summary"
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-controls={detailId}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <div className="asp2026-avatar">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="asp2026-avatar__img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          <span>{getInitials(name)}</span>
        </div>

        <div className="asp2026-store-title">
          <div className="asp2026-title-row">
            <strong>{name}</strong>
            {owner?.name ? (
              <span className="asp2026-owner-badge" title={`Pemilik: ${owner.name}`}>
                <UserRound size={12} aria-hidden="true" />
                {owner.name}
              </span>
            ) : null}
          </div>
          <span className="asp2026-slug-text">/{slug || "tanpa-slug"}</span>
        </div>

        <div className="asp2026-summary-meta">
          <div className="asp2026-summary-item">
            <small>Status</small>
            <Chip tone={statusLabel === "Live" ? "success" : "neutral"}>
              {statusLabel === "Live" ? "Aktif" : "Nonaktif"}
            </Chip>
          </div>
          <div className="asp2026-summary-item">
            <small>Profil</small>
            <strong className="asp2026-score-text">
              {profileScore.complete}/{profileScore.total}
            </strong>
          </div>
          <div className="asp2026-summary-item">
            <small>Pengiriman</small>
            <Chip tone={shippingScore.missing ? "warning" : "success"}>
              {shippingScore.missing ? `${shippingScore.missing} Kurang` : "Siap"}
            </Chip>
          </div>
          <div className="asp2026-summary-item">
            <small>Prioritas</small>
            <Chip tone={priorityTone}>
              {priority === "High" ? "Tinggi" : priority === "Medium" ? "Sedang" : "Normal"}
            </Chip>
          </div>
        </div>

        <div className="asp2026-chevron" aria-hidden="true">
          <ChevronDown size={18} />
        </div>
      </div>

      {/* EXPANDED CONTENT: 2-COLUMN MODERN LAYOUT */}
      {expanded ? (
        <div
          id={detailId}
          className="asp2026-card-detail"
          role="region"
          aria-labelledby={summaryId}
        >
          {/* KOLOM KIRI: KESIAPAN & AUDIT */}
          <section className="asp2026-panel asp2026-panel--readiness">
            <div className="asp2026-panel__head">
              <div className="asp2026-head-title">
                <h2>Kesiapan Toko</h2>
                <Chip tone={publicReady ? "success" : "warning"}>
                  {publicReady ? "Siap Tayang" : "Belum Siap"}
                </Chip>
              </div>
              <button
                type="button"
                className="asp2026-ai-pill-btn"
                title="Saran AI Kesiapan Toko"
                onClick={() =>
                  toast.success(
                    issues.length
                      ? `Perlu dilengkapi: ${issues.slice(0, 3).join(", ")}.`
                      : "Profil toko lengkap dan siap digunakan!",
                    { id: "ai-audit-toast" }
                  )
                }
              >
                <Bot size={13} aria-hidden="true" />
                <span>Audit AI</span>
              </button>
            </div>

            {/* CHECKLIST KESIAPAN */}
            <div className="asp2026-checklist-grid">
              {previewRows.map((row) => (
                <div
                  key={row.label}
                  className={`asp2026-check-item ${row.ready ? "is-ready" : "is-missing"}`}
                >
                  <span className="asp2026-check-icon" aria-hidden="true">
                    {row.ready ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  </span>
                  <span className="asp2026-check-name">{row.label}</span>
                  <span className="asp2026-check-status">{row.ready ? "Siap" : "Kurang"}</span>
                </div>
              ))}
              <div
                className={`asp2026-check-item ${
                  shippingScore.missing === 0 ? "is-ready" : "is-missing"
                }`}
              >
                <span className="asp2026-check-icon" aria-hidden="true">
                  {shippingScore.missing === 0 ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <AlertCircle size={14} />
                  )}
                </span>
                <span className="asp2026-check-name">Kurir</span>
                <span className="asp2026-check-status">
                  {shippingScore.missing === 0 ? "Siap" : `${shippingScore.missing} Kurang`}
                </span>
              </div>
            </div>

            {/* MISSING TAGS */}
            {issues.length > 0 ? (
              <div className="asp2026-missing-section">
                <span className="asp2026-missing-title">Perlu Dilengkapi:</span>
                <div className="asp2026-missing-tags">
                  {issues.map((issue) => (
                    <span key={`${storeId}-${issue}`} className="asp2026-tag-missing">
                      {issue}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* ACTION STOREFRONT */}
            <div className="asp2026-readiness-footer">
              {storefrontHref ? (
                <Link
                  className="asp2026-action-btn asp2026-action-btn--secondary"
                  to={storefrontHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Buka Storefront</span>
                  <ExternalLink size={14} aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  className="asp2026-action-btn asp2026-action-btn--secondary"
                  disabled
                >
                  <span>Storefront Belum Siap</span>
                </button>
              )}
            </div>
          </section>

          {/* KOLOM KANAN: FORM DATA UTAMA */}
          <section className="asp2026-panel asp2026-panel--form">
            <div className="asp2026-panel__head">
              <h2>Data Utama</h2>
              {owner?.email ? (
                <span className="asp2026-owner-email" title="Email Pemilik">
                  {owner.email}
                </span>
              ) : null}
            </div>

            <form className="asp2026-core-form" onSubmit={onSave}>
              <div className="asp2026-form-row-grid">
                <label className="asp2026-form-field">
                  <span className="asp2026-label-text">Nama Toko</span>
                  <input
                    type="text"
                    value={draft.name || ""}
                    onChange={(e) => onDraftChange({ name: e.target.value })}
                    disabled={saving}
                    placeholder="Nama Toko"
                  />
                </label>

                <label className="asp2026-form-field">
                  <span className="asp2026-label-text">Slug</span>
                  <input
                    type="text"
                    value={draft.slug || ""}
                    onChange={(e) => onDraftChange({ slug: e.target.value })}
                    disabled={saving}
                    placeholder="slug-toko"
                  />
                </label>

                <label className="asp2026-form-field">
                  <span className="asp2026-label-text">Status</span>
                  <select
                    value={draft.status || "ACTIVE"}
                    onChange={(e) => onDraftChange({ status: e.target.value })}
                    disabled={saving}
                  >
                    <option value="ACTIVE">Aktif (Live)</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </label>
              </div>

              {/* MEDIA LOGO */}
              <div className="asp2026-media-field">
                <span className="asp2026-label-text">Logo Toko</span>
                <div className="asp2026-media-input-group">
                  <input
                    type="text"
                    value={draft.logoUrl || ""}
                    onChange={(e) => onDraftChange({ logoUrl: e.target.value })}
                    placeholder="/uploads/... atau https://..."
                    disabled={saving}
                  />
                  <label
                    className={`asp2026-upload-btn ${
                      uploadingField === "logoUrl" ? "is-uploading" : ""
                    }`}
                  >
                    <Upload size={13} aria-hidden="true" />
                    <span>{uploadingField === "logoUrl" ? "..." : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      disabled={saving || Boolean(uploadingField)}
                      onChange={(e) => handleUpload(e, "logoUrl")}
                    />
                  </label>
                  {draft.logoUrl ? (
                    <div className="asp2026-thumb-preview">
                      <img
                        src={draft.logoUrl}
                        alt="Logo"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* MEDIA BANNER */}
              <div className="asp2026-media-field">
                <span className="asp2026-label-text">Banner Toko</span>
                <div className="asp2026-media-input-group">
                  <input
                    type="text"
                    value={draft.bannerUrl || ""}
                    onChange={(e) => onDraftChange({ bannerUrl: e.target.value })}
                    placeholder="/uploads/... atau https://..."
                    disabled={saving}
                  />
                  <label
                    className={`asp2026-upload-btn ${
                      uploadingField === "bannerUrl" ? "is-uploading" : ""
                    }`}
                  >
                    <Upload size={13} aria-hidden="true" />
                    <span>{uploadingField === "bannerUrl" ? "..." : "Upload"}</span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: "none" }}
                      disabled={saving || Boolean(uploadingField)}
                      onChange={(e) => handleUpload(e, "bannerUrl")}
                    />
                  </label>
                  {draft.bannerUrl ? (
                    <div className="asp2026-thumb-preview asp2026-thumb-preview--banner">
                      <img
                        src={draft.bannerUrl}
                        alt="Banner"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              </div>

              {/* FORM FOOTER */}
              <div className="asp2026-form-footer">
                <button
                  type="submit"
                  className="asp2026-action-btn asp2026-action-btn--primary"
                  disabled={saving}
                >
                  <Save size={15} aria-hidden="true" />
                  <span>{saving ? "Menyimpan..." : "Simpan Profil"}</span>
                </button>
              </div>

              {mutationError ? (
                <p className="asp2026-form-error">{getErrorMessage(mutationError)}</p>
              ) : null}
            </form>
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
          logoUrl: textValue(readValue(entry, "logoUrl")),
          bannerUrl: textValue(readValue(entry, "bannerUrl")),
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
      toast.success("Profil toko berhasil disimpan", { id: "admin-store-profile-saved" });
      await queryClient.invalidateQueries({ queryKey: STORE_PROFILES_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: ["storefront"], exact: false });
    },
    onError: (error, variables) => {
      setFailedStoreId(variables?.storeId ?? null);
      toast.error(getErrorMessage(error), { id: "admin-store-profile-error" });
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
        return [getStoreName(entry), getStoreSlug(entry), owner?.name, owner?.email].some(
          (value) => String(value || "").toLowerCase().includes(query)
        );
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
        logoUrl: textValue(draft.logoUrl) || null,
        bannerUrl: textValue(draft.bannerUrl) || null,
      },
    });
  };

  if (profilesQuery.isLoading) {
    return <AdminOpsLoadingState title="Memuat profil toko..." />;
  }

  if (profilesQuery.isError) {
    return (
      <AdminOpsErrorState
        message={getErrorMessage(profilesQuery.error) || "Gagal memuat profil toko."}
        onRetry={() => profilesQuery.refetch()}
      />
    );
  }

  return (
    <div className={`asp2026 asp2026--${viewMode}`}>
      {/* HEADER SECTION */}
      <header className="asp2026-header">
        <div>
          <div className="asp2026-title-with-count">
            <h1>Profil Toko</h1>
            <span className="asp2026-count-pill">{stores.length}</span>
          </div>
          <p>Kesiapan operasional dan kelengkapan profil toko.</p>
        </div>
        <div className="asp2026-header__actions">
          <button
            type="button"
            className="asp2026-refresh-btn"
            title="Segarkan data"
            onClick={() => profilesQuery.refetch()}
          >
            <RefreshCw size={15} aria-hidden="true" />
            <span>Segarkan</span>
          </button>
          <Link className="asp2026-primary-btn" to="/admin/store/applications">
            <Plus size={16} aria-hidden="true" />
            <span>Tambah Toko</span>
          </Link>
        </div>
      </header>

      {/* 4 SLEEK METRIC CARDS */}
      <section className="asp2026-metrics" aria-label="Metrik profil toko">
        <MetricCard
          icon={Store}
          label="Total Toko"
          value={summary.stores}
          tone="navy"
        />
        <MetricCard
          icon={AlertCircle}
          label="Perlu Tinjau"
          value={summary.review}
          tone="orange"
        />
        <MetricCard
          icon={PackageCheck}
          label="Profil Kurang"
          value={summary.profile}
          tone="navy-soft"
        />
        <MetricCard
          icon={Truck}
          label="Kurir Kurang"
          value={summary.shipping}
          tone="orange-soft"
        />
      </section>

      {/* TOOLBAR */}
      <section className="asp2026-toolbar" aria-label="Pencarian dan kontrol toko">
        <label className="asp2026-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Cari toko</span>
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari nama toko, slug, atau pemilik..."
          />
        </label>

        <select
          className="asp2026-select"
          value={sortMode}
          onChange={(event) => setSortMode(event.target.value)}
          aria-label="Urutkan toko"
        >
          <option value="priority">Prioritas: Tertinggi</option>
          <option value="name">Nama: A-Z</option>
        </select>

        <div className="asp2026-view-toggle" aria-label="Mode tampilan">
          <button
            type="button"
            className={viewMode === "list" ? "is-active" : ""}
            onClick={() => setViewMode("list")}
            title="Tampilan List"
            aria-pressed={viewMode === "list"}
          >
            <LayoutList size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={viewMode === "grid" ? "is-active" : ""}
            onClick={() => setViewMode("grid")}
            title="Tampilan Grid"
            aria-pressed={viewMode === "grid"}
          >
            <Grid2X2 size={16} aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* FILTER TABS */}
      <nav className="asp2026-filters" aria-label="Filter status toko">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilter === filter.id ? "is-active" : ""}
            onClick={() => setActiveFilter(filter.id)}
          >
            {filter.label}
            <span className="asp2026-filter-count">{chipCounts[filter.id] || 0}</span>
          </button>
        ))}
      </nav>

      {/* STORE LIST */}
      {stores.length === 0 ? (
        <AdminOpsEmptyState
          title="Belum ada profil toko"
          description="Profil toko akan tampil di sini setelah toko dibuat."
          actions={
            <Link className="asp2026-primary-btn" to="/admin/store/applications">
              <Plus size={16} aria-hidden="true" />
              <span>Tambah Toko</span>
            </Link>
          }
        />
      ) : visibleStores.length === 0 ? (
        <AdminOpsEmptyState
          title="Toko tidak ditemukan"
          description="Coba ubah kata kunci pencarian atau ganti filter."
          actions={
            <button
              type="button"
              className="asp2026-action-btn asp2026-action-btn--secondary"
              onClick={() => {
                setSearchTerm("");
                setActiveFilter("all");
              }}
            >
              Reset Filter
            </button>
          }
        />
      ) : (
        <section className="asp2026-store-list" aria-label="Daftar tinjauan toko">
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
