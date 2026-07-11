import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Image as ImageIcon,
  RefreshCw,
  ShoppingCart,
  Store,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import {
  fetchAdminStorePaymentProfiles,
  reviewAdminStorePaymentProfile,
  updateAdminStoreIdentity,
} from "../../api/storePaymentProfiles.ts";
import "./AdminStorePaymentProfilesPage.css";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "action", label: "Action Needed" },
  { value: "active", label: "Checkout Ready" },
  { value: "pending", label: "Pending" },
  { value: "revision", label: "Revision" },
  { value: "incomplete", label: "Incomplete" },
];

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
    return { key: "pending", label: "Pending", tone: "warning", action: true };
  }
  if (requestStatus === "NEEDS_REVISION") {
    return { key: "revision", label: "Revision", tone: "blue", action: false };
  }
  if (isCheckoutReady(entry)) {
    return { key: "active", label: "Checkout ready", tone: "success", action: false };
  }
  if (!profile || !profile?.readiness?.isReady) {
    return { key: "incomplete", label: "Incomplete", tone: "danger", action: false };
  }
  return { key: "incomplete", label: "Incomplete", tone: "warning", action: false };
};

const statusTone = (value, fallback = "neutral") => {
  const normalized = String(value || fallback).toLowerCase();
  if (["success", "ready", "verified", "emerald", "active"].includes(normalized)) return "success";
  if (["warning", "attention", "amber", "pending"].includes(normalized)) return "warning";
  if (["danger", "rose", "red", "rejected"].includes(normalized)) return "danger";
  if (["blue", "info", "revision"].includes(normalized)) return "blue";
  return "neutral";
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
  const fallback = (label, value, tone = "neutral") => ({ label, value, tone });

  const store = byText("store");
  const shipping = byText("shipping");
  const payment = byText("payment");
  const product = byText("product");

  return [
    fallback("Store", store?.status?.label || entry?.store?.status || "Inactive", statusTone(store?.status?.tone)),
    fallback("Shipping", shipping?.status?.label || "Update", statusTone(shipping?.status?.tone, "warning")),
    fallback("Payment", payment?.status?.label || (isCheckoutReady(entry) ? "Ready" : "Not set"), statusTone(payment?.status?.tone, isCheckoutReady(entry) ? "success" : "danger")),
    fallback("Products", product?.status?.label || "No products", statusTone(product?.status?.tone, "warning")),
  ];
};

function Badge({ children, tone = "neutral" }) {
  return <span className={`spp-badge spp-badge--${tone}`}>{children}</span>;
}

function KpiCard({ icon: Icon, label, value, helper, tone }) {
  return (
    <section className={`spp-kpi spp-kpi--${tone}`}>
      <span className="spp-kpi__icon" aria-hidden="true">
        <Icon size={28} />
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{helper}</small>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="admin-store-payment-profiles-page">
      <div className="spp-state">
        <span className="spp-spinner" />
        <strong>Loading store payment</strong>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="admin-store-payment-profiles-page">
      <div className="spp-state spp-state--error">
        <AlertTriangle size={28} aria-hidden="true" />
        <strong>Unable to load store payment</strong>
        <p>{message}</p>
        <button type="button" onClick={onRetry}>
          <RefreshCw size={16} aria-hidden="true" />
          Retry
        </button>
      </div>
    </div>
  );
}

function EmptyState({ title }) {
  return (
    <div className="spp-empty">
      <Store size={28} aria-hidden="true" />
      <strong>{title}</strong>
      <span>Store payment profiles will appear here.</span>
    </div>
  );
}

function SnapshotCell({ label, value }) {
  return (
    <div className="spp-snapshot-cell">
      <span>{label}</span>
      <strong>{text(value)}</strong>
    </div>
  );
}

function QrisPanel({ title, imageUrl, profile, emptyLabel, badgeLabel }) {
  return (
    <section className="spp-panel">
      <div className="spp-panel__head">
        <h3>{title}</h3>
        <Badge tone={imageUrl ? "success" : "neutral"}>{imageUrl ? badgeLabel : "No snapshot"}</Badge>
      </div>
      {imageUrl ? (
        <div className="spp-qris-card">
          <img src={imageUrl} alt={`${title} QRIS`} />
          <div>
            <strong>QRIS</strong>
            <span>Merchant</span>
            <b>{text(profile?.merchantName)}</b>
            <span>Merchant ID</span>
            <b>{text(profile?.merchantId)}</b>
            <span>Version</span>
            <b>{profile?.version ? `v${profile.version}` : "-"}</b>
          </div>
        </div>
      ) : (
        <div className="spp-dashed">
          <ImageIcon size={26} aria-hidden="true" />
          <span>{emptyLabel}</span>
        </div>
      )}
    </section>
  );
}

function ActionForm({ action, note, setNote, onCancel, onSubmit, isBusy }) {
  if (!action || action === "approve" || action === "deactivate") return null;
  return (
    <div className="spp-action-note">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={action === "revision" ? "Revision note" : "Reject reason"}
      />
      <div>
        <button type="button" className="spp-secondary" onClick={onCancel} disabled={isBusy}>
          Cancel
        </button>
        <button type="button" className="spp-primary" onClick={onSubmit} disabled={isBusy || !note.trim()}>
          {isBusy ? "Sending..." : action === "revision" ? "Send Revision" : "Reject"}
        </button>
      </div>
    </div>
  );
}

function StorePaymentCard({ entry, mutation, identityMutation, activeDraft, setActiveDraft }) {
  const profile = entry.paymentProfile;
  const pendingRequest = entry.pendingRequest;
  const lane = getLane(entry);
  const missingLabels = getMissingLabels(entry);
  const readinessItems = getReadinessItems(entry);
  const readinessPercent = percent(entry.workspaceReadiness?.completionPercent);
  const governance = entry.workflow?.governance || {};
  const requestStatus = getRequestStatus(entry);
  const storeId = entry.store?.id;
  const isBusy = mutation.isPending && Number(mutation.variables?.storeId) === Number(storeId);
  const activeSnapshot = Boolean(profile?.isActive);
  const hasAction = requestStatus === "SUBMITTED" || (profile && !pendingRequest);
  const draftKey = `${storeId}:${activeDraft?.action || ""}`;
  const isCurrentDraft = activeDraft?.storeId === storeId;
  const note = isCurrentDraft ? activeDraft.note : "";
  const setNote = (value) => setActiveDraft((current) => ({ ...(current || {}), storeId, note: value }));

  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [identityName, setIdentityName] = useState(entry.store?.name || "");
  const [identityStatus, setIdentityStatus] = useState(
    String(entry.store?.status?.code || entry.store?.status?.label || "ACTIVE").toUpperCase() === "INACTIVE"
      ? "INACTIVE"
      : "ACTIVE"
  );

  const submitReview = (action, noteValue = "") => {
    mutation.mutate({
      storeId,
      payload: {
        action,
        decision: action,
        status: action,
        note: noteValue || null,
        adminNote: noteValue || null,
        reviewNote: noteValue || null,
      },
    });
  };

  return (
    <article className="spp-store-card">
      <header className="spp-store-card__head">
        <div className="spp-store-title">
          <span className="spp-store-icon">
            <Store size={20} aria-hidden="true" />
          </span>
          <div>
            <h2>{text(entry.store?.name, "Unnamed Store")}</h2>
            <p>Owner: {text(entry.owner?.name || entry.owner?.email)}</p>
          </div>
        </div>
        <div className="spp-store-badges">
          <Badge tone={profile ? "success" : "neutral"}>
            {profile ? "Active snapshot" : "No snapshot"}
          </Badge>
          <Badge tone={pendingRequest ? "warning" : activeSnapshot ? "success" : "neutral"}>
            {pendingRequest ? "Pending" : activeSnapshot ? "Verified" : "Not reviewed"}
          </Badge>
          <Badge tone={lane.action ? "warning" : "success"}>{lane.action ? "Action" : "Clear"}</Badge>
          <Badge tone={lane.key === "active" ? "success" : lane.tone}>{lane.label}</Badge>
          <button
            type="button"
            className="spp-edit-identity-btn"
            onClick={() => {
              setIdentityName(entry.store?.name || "");
              setIdentityStatus(
                String(entry.store?.status?.code || entry.store?.status?.label || "ACTIVE").toUpperCase() === "INACTIVE"
                  ? "INACTIVE"
                  : "ACTIVE"
              );
              setIsEditingIdentity(!isEditingIdentity);
            }}
          >
            <Wrench size={13} aria-hidden="true" />
            <span>Edit Identity</span>
          </button>
        </div>
      </header>

      {isEditingIdentity ? (
        <div className="spp-identity-editor">
          <input
            type="text"
            value={identityName}
            onChange={(e) => setIdentityName(e.target.value)}
            placeholder="Store Name"
          />
          <select
            value={identityStatus}
            onChange={(e) => setIdentityStatus(e.target.value)}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <button
            type="button"
            className="spp-primary"
            disabled={identityMutation?.isPending}
            onClick={() => {
              if (!identityName.trim()) {
                toast.error("Store name is required");
                return;
              }
              identityMutation?.mutate(
                {
                  storeId,
                  payload: { name: identityName.trim(), status: identityStatus },
                },
                {
                  onSuccess: () => setIsEditingIdentity(false),
                }
              );
            }}
          >
            {identityMutation?.isPending ? "Saving..." : "Save Identity"}
          </button>
          <button
            type="button"
            className="spp-secondary"
            onClick={() => setIsEditingIdentity(false)}
          >
            Cancel
          </button>
        </div>
      ) : null}

      <div className="spp-card-grid">
        <div className="spp-left-column">
          <section className="spp-panel">
            <div className="spp-panel__head">
              <h3>Active Snapshot</h3>
              <Badge tone={activeSnapshot ? "success" : "neutral"}>
                {activeSnapshot ? "Active" : "No snapshot"}
              </Badge>
            </div>
            <div className="spp-snapshot-grid">
              <SnapshotCell label="Account" value={profile?.accountName} />
              <SnapshotCell label="Merchant" value={profile?.merchantName} />
              <SnapshotCell label="Merchant ID" value={profile?.merchantId} />
              <SnapshotCell label="Version" value={profile?.version ? `v${profile.version}` : "-"} />
            </div>
            <div className="spp-note spp-note--info">Approval required</div>
            {missingLabels.length ? (
              <div className="spp-note spp-note--warning">
                Missing: {missingLabels.join(", ")}
              </div>
            ) : null}
          </section>

          <section className="spp-panel">
            <div className="spp-readiness-head">
              <h3>Seller Readiness</h3>
              <strong>{readinessPercent}%</strong>
              <div className="spp-progress">
                <span style={{ width: `${readinessPercent}%` }} />
              </div>
            </div>
            <div className="spp-readiness-grid">
              {readinessItems.map((item) => (
                <div key={item.label}>
                  <span>{item.label}</span>
                  <strong className={`spp-readiness--${item.tone}`}>{item.value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="spp-admin-actions">
            <span>Admin action</span>
            <div>
              {requestStatus === "SUBMITTED" ? (
                <>
                  <button
                    type="button"
                    className="spp-primary"
                    disabled={isBusy || !governance.canApprovePromotion}
                    onClick={() => submitReview("APPROVE")}
                  >
                    {isBusy ? "Updating..." : "Approve"}
                  </button>
                  <button
                    type="button"
                    className="spp-secondary"
                    disabled={isBusy || !governance.canRequestRevision}
                    onClick={() => setActiveDraft({ storeId, action: "revision", note: "" })}
                  >
                    Revision
                  </button>
                  <button
                    type="button"
                    className="spp-danger"
                    disabled={isBusy || !governance.canRequestRevision}
                    onClick={() => setActiveDraft({ storeId, action: "reject", note: "" })}
                  >
                    Reject
                  </button>
                </>
              ) : profile ? (
                <button
                  type="button"
                  className="spp-danger spp-danger--outline"
                  disabled={isBusy || !governance.canToggleActiveSnapshot}
                  onClick={() => submitReview(activeSnapshot ? "INACTIVE" : "APPROVE")}
                >
                  {activeSnapshot ? "Deactivate Snapshot" : "Activate Snapshot"}
                </button>
              ) : (
                <button type="button" className="spp-secondary" disabled>
                  No action
                </button>
              )}
            </div>
          </section>

          <ActionForm
            key={draftKey}
            action={isCurrentDraft ? activeDraft.action : ""}
            note={note}
            setNote={setNote}
            isBusy={isBusy}
            onCancel={() => setActiveDraft(null)}
            onSubmit={() => {
              const action = activeDraft?.action === "revision" ? "REVISION" : "REJECTED";
              submitReview(action, note);
            }}
          />
        </div>

        <div className="spp-right-column">
          <QrisPanel
            title="Active QRIS"
            imageUrl={profile?.qrisImageUrl}
            profile={profile}
            emptyLabel="No QRIS"
            badgeLabel="Available"
          />
          <QrisPanel
            title="Pending Request"
            imageUrl={pendingRequest?.qrisImageUrl}
            profile={pendingRequest}
            emptyLabel="No request"
            badgeLabel="Submitted"
          />
        </div>
      </div>
    </article>
  );
}

export default function AdminStorePaymentProfilesPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const initialFilter = searchParams.get("filter");
  const [activeFilter, setActiveFilter] = useState(() =>
    FILTERS.some((f) => f.value === initialFilter) ? initialFilter : "all"
  );
  const [activeDraft, setActiveDraft] = useState(null);

  const profilesQuery = useQuery({
    queryKey: ["admin-store-payment-profiles"],
    queryFn: fetchAdminStorePaymentProfiles,
  });

  const mutation = useMutation({
    mutationFn: ({ storeId, payload }) => reviewAdminStorePaymentProfile(storeId, payload),
    onSuccess: async () => {
      toast.success("Store payment updated");
      setActiveDraft(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-store-payment-profiles"] });
      profilesQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update store payment."
      );
    },
  });

  const identityMutation = useMutation({
    mutationFn: ({ storeId, payload }) => updateAdminStoreIdentity(storeId, payload),
    onSuccess: async () => {
      toast.success("Store identity updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-store-payment-profiles"] });
      profilesQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to update store identity."
      );
    },
  });

  const items = useMemo(
    () => (Array.isArray(profilesQuery.data) ? profilesQuery.data.filter((item) => item?.store?.id) : []),
    [profilesQuery.data]
  );

  const summary = useMemo(() => {
    const active = items.filter((entry) => getLane(entry).key === "active").length;
    const pending = items.filter((entry) => getLane(entry).key === "pending").length;
    const followUp = items.filter((entry) => getLane(entry).key === "revision").length;
    const setup = items.filter((entry) => getLane(entry).key === "incomplete").length;
    return { active, pending, followUp, setup };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (activeFilter === "all") return items;
    if (activeFilter === "action") return items.filter((entry) => getLane(entry).action);
    return items.filter((entry) => getLane(entry).key === activeFilter);
  }, [activeFilter, items]);

  const queueClear = summary.pending === 0;

  if (profilesQuery.isLoading) return <LoadingState />;

  if (profilesQuery.isError) {
    return (
      <ErrorState
        message={
          profilesQuery.error?.response?.data?.message ||
          profilesQuery.error?.message ||
          "Failed to load store payment."
        }
        onRetry={() => profilesQuery.refetch()}
      />
    );
  }

  return (
    <div className="admin-store-payment-profiles-page">
      <section className="spp-hero">
        <div className="spp-hero__top">
          <div>
            <span className="spp-eyebrow">Online Store</span>
            <h1>Store Payment</h1>
            <p>QRIS review and checkout readiness.</p>
            <div className="spp-hero__badges">
              <Badge tone={summary.setup ? "warning" : "success"}>Ready</Badge>
              <Badge tone={summary.active ? "success" : "neutral"}>Verified</Badge>
            </div>
          </div>
          <div className="spp-hero__actions">
            <Badge tone="neutral">{items.length} store{items.length === 1 ? "" : "s"}</Badge>
            <button type="button" className="spp-refresh" onClick={() => profilesQuery.refetch()}>
              <RefreshCw size={16} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </div>

        <div className="spp-kpis">
          <KpiCard icon={ShoppingCart} label="Active" value={summary.active} helper="Checkout live" tone="green" />
          <KpiCard icon={Clock3} label="Pending" value={summary.pending} helper="Awaiting review" tone="amber" />
          <KpiCard icon={UserRoundCheck} label="Follow-up" value={summary.followUp} helper="Needs seller update" tone="blue" />
          <KpiCard icon={Wrench} label="Setup" value={summary.setup} helper="Not ready" tone="purple" />
        </div>

        <section className="spp-readiness-filter">
          <div className="spp-filter-head">
            <h2>Payment Readiness</h2>
            <div className="spp-tabs">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={activeFilter === filter.value ? "is-active" : ""}
                  onClick={() => setActiveFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
          <div className={`spp-queue ${queueClear ? "spp-queue--clear" : "spp-queue--action"}`}>
            <CheckCircle2 size={22} aria-hidden="true" />
            <div>
              <strong>{queueClear ? "Queue clear" : `${summary.pending} pending review`}</strong>
              <span>{queueClear ? "No admin action waiting" : "Admin decision required"}</span>
            </div>
          </div>
        </section>
      </section>

      <section className="spp-list">
        {items.length === 0 ? <EmptyState title="No store payment data" /> : null}
        {items.length > 0 && filteredItems.length === 0 ? (
          <EmptyState title="No stores match this filter" />
        ) : null}
        {filteredItems.map((entry) => (
          <StorePaymentCard
            key={entry.store.id}
            entry={entry}
            mutation={mutation}
            identityMutation={identityMutation}
            activeDraft={activeDraft}
            setActiveDraft={setActiveDraft}
          />
        ))}
      </section>
    </div>
  );
}
