import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Database,
  FileText,
  GitBranch,
  Globe2,
  IdCard,
  ShieldCheck,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import { resolveAssetUrl } from "../../lib/assetUrl.js";
import {
  approveAdminStoreApplication,
  fetchAdminStoreApplicationDetail,
  rejectAdminStoreApplication,
  requestAdminStoreApplicationRevision,
} from "../../api/adminStoreApplications.ts";
import "./AdminStoreApplicationDetailPage.css";

const DASH = "-";
const DETAIL_QUERY_KEY = "admin-store-application";
const LIST_QUERY_KEY = "admin-store-applications";

const text = (value, fallback = DASH) => {
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const boolText = (value) => (value === true ? "Yes" : value === false ? "No" : DASH);

const unwrapApplication = (payload) =>
  payload?.data?.data ||
  payload?.data?.application ||
  payload?.data?.item ||
  payload?.data?.storeApplication ||
  payload?.data ||
  payload?.application ||
  payload?.item ||
  payload?.storeApplication ||
  payload ||
  null;

const firstObject = (...values) =>
  values.find((value) => value && typeof value === "object" && !Array.isArray(value)) || {};

const getCompleteness = (application) => {
  const source = firstObject(
    application?.completeness,
    application?.workflowSummary?.completeness
  );
  const completed = Number(
    source.completed ?? source.completedFields ?? application?.completedFields ?? 0
  );
  const total = Number(source.total ?? source.totalFields ?? application?.totalFields ?? 0);
  const explicitPercent = Number(
    source.percentage ?? source.completionPercent ?? application?.completionPercent
  );
  const percent = Number.isFinite(explicitPercent)
    ? explicitPercent
    : total > 0
      ? Math.round((completed / total) * 100)
      : 0;
  return {
    completed: Number.isFinite(completed) ? completed : 0,
    total: Number.isFinite(total) ? total : 0,
    percent: Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0)),
    label: source.label || (total > 0 && completed >= total ? "Ready" : "Needs completion"),
  };
};

const getStatusLabel = (status) => {
  const normalized = String(status || "draft").toLowerCase();
  const labels = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "In Review",
    revision_requested: "Needs Revision",
    approved: "Approved",
    rejected: "Rejected",
    cancelled: "Cancelled",
  };
  return labels[normalized] || text(status);
};

const getStatusTone = (status) => {
  const normalized = String(status || "draft").toLowerCase();
  if (["approved"].includes(normalized)) return "success";
  if (["submitted", "under_review"].includes(normalized)) return "info";
  if (["revision_requested"].includes(normalized)) return "warning";
  if (["rejected"].includes(normalized)) return "danger";
  return "neutral";
};

const formatDate = (value) => {
  if (!value) return DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;
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

const getMatchValue = (fields, key) => {
  const found = fields.find((field) => String(field.key || "").toLowerCase() === key);
  if (!found) return null;
  return found.matched;
};

const normalizeDetail = (payload, fallbackId) => {
  const application = unwrapApplication(payload);
  if (!application) return null;

  const workflow = firstObject(application.workflowSummary);
  const applicant = firstObject(application.applicant, application.user);
  const reviewer = firstObject(application.reviewer, application.reviewedByUser, application.reviewedBy);
  const ownerIdentity = firstObject(
    application.ownerIdentitySnapshot,
    application.ownerIdentity,
    application.identitySnapshot,
    application.identity
  );
  const storeInfo = firstObject(
    application.storeInformationSnapshot,
    application.storeInformation,
    application.storeSnapshot,
    application.store
  );
  const operational = firstObject(
    application.operationalAddressSnapshot,
    application.addressSnapshot,
    application.operationalAddress,
    application.address,
    application.operationalVerification
  );
  const payout = firstObject(
    application.payoutSnapshot,
    application.paymentSnapshot,
    application.payout,
    application.payment,
    application.financialVerification
  );
  const compliance = firstObject(
    application.complianceSnapshot,
    application.compliance,
    application.riskSnapshot,
    application.complianceRisk
  );
  const activation = firstObject(workflow.activation, application.activation);
  const identityMatch = firstObject(applicant.identityMatch, application.identityMatch);
  const matchFields = Array.isArray(identityMatch.fields) ? identityMatch.fields : [];
  const completeness = getCompleteness(application);

  const status = text(application.status || workflow.applicationStatus || "draft", "draft").toLowerCase();
  const currentStep = firstObject(application.currentStepMeta, workflow.currentStepMeta);
  const actionGovernance = firstObject(workflow.actionGovernance, application.actionGovernance);

  return {
    id: application.id || fallbackId,
    status,
    statusLabel: application.statusMeta?.label || getStatusLabel(status),
    stepLabel: currentStep.label || text(application.currentStep || workflow.currentStep, "Review"),
    submittedAt: application.submittedAt || workflow.submittedAt,
    reviewedAt: application.reviewedAt || workflow.reviewedAt,
    reviewer: {
      name: reviewer.name || workflow.reviewedBy?.name || DASH,
      email: reviewer.email || workflow.reviewedBy?.email || null,
    },
    actionGovernance,
    completeness,
    activation,
    applicant: {
      userId: applicant.userId || applicant.id || application.applicantUserId,
      name: applicant.accountName || applicant.name || ownerIdentity.fullName,
      email: applicant.accountEmail || applicant.email,
      phone: applicant.accountPhone || applicant.phone || applicant.phoneNumber,
      role: applicant.accountRole || applicant.role,
      status: applicant.accountStatus || applicant.status,
    },
    identity: {
      number: ownerIdentity.identityNumber,
      birthDate: ownerIdentity.birthDate,
      type: ownerIdentity.identityType,
      idName: ownerIdentity.fullName,
      legalName: ownerIdentity.identityLegalName || ownerIdentity.legalName,
    },
    identityMatch: {
      summary: identityMatch.summaryLabel || application.identityMatchLabel || "Partial Match",
      name: getMatchValue(matchFields, "name"),
      email: getMatchValue(matchFields, "email"),
      phone: getMatchValue(matchFields, "phone"),
    },
    store: {
      name: storeInfo.storeName || storeInfo.name,
      slug: storeInfo.storeSlug || storeInfo.slug,
      category: storeInfo.storeCategory || storeInfo.category,
      sellerType: storeInfo.sellerType || storeInfo.ownerType,
      taxId: compliance.taxId || payout.taxId,
      businessType: storeInfo.businessType || storeInfo.sellerType,
      description: storeInfo.description,
    },
    operational: {
      contact: operational.contactName,
      phone: operational.phoneNumber || operational.phone,
      address: operational.fullAddress || [
        operational.addressLine1,
        operational.addressLine2,
        operational.district,
        operational.city,
        operational.province,
        operational.postalCode,
        operational.country,
      ].filter(Boolean).join(", "),
      province: operational.province,
      city: operational.city,
      district: operational.district,
      postalCode: operational.postalCode,
      country: operational.country,
    },
    financial: {
      provider: payout.providerCode || payout.bankChannel || payout.bankName,
      paymentType: payout.paymentType || payout.payoutMethod || payout.method,
      accountName: payout.accountName || payout.accountHolderName,
      merchantName: payout.merchantName,
      merchantId: payout.merchantId || payout.accountNumberMasked || payout.accountNumber,
      qrisImageUrl: payout.qrisImageUrl,
      qrisPayload: payout.qrisPayload,
      instructionText: payout.instructionText,
      sellerNote: payout.sellerNote,
      nameMatch: payout.accountHolderMatchesIdentity,
      taxId: payout.taxId || compliance.taxId,
    },
    compliance: {
      productTypes: compliance.productTypes,
      brandOwnership: compliance.brandOwnershipType,
      authenticity: compliance.authenticityConfirmed,
      prohibitedGoods: compliance.prohibitedGoodsConfirmed,
      website: compliance.websiteUrl,
      socialMedia: compliance.socialMediaUrl,
      supportEmail: compliance.supportEmail,
      supportPhone: compliance.supportPhone,
    },
  };
};

function Pill({ children, tone = "neutral" }) {
  return <span className={`asad-pill asad-pill--${tone}`}>{children}</span>;
}

function SummaryCard({ icon: Icon, label, value, helper, tone = "neutral", progress }) {
  return (
    <section className={`asad-summary-card asad-summary-card--${tone}`}>
      <span className="asad-summary-card__icon" aria-hidden="true">
        <Icon size={22} />
      </span>
      <div className="asad-summary-card__body">
        <span>{label}</span>
        <strong>{value}</strong>
        {progress !== undefined ? (
          <span className="asad-progress">
            <span style={{ width: `${progress}%` }} />
          </span>
        ) : null}
        {helper ? <small className="asad-summary-card__helper">{helper}</small> : null}
      </div>
    </section>
  );
}

function Section({ title, subtitle, children, className = "" }) {
  return (
    <section className={`asad-section ${className}`}>
      <div className="asad-section__head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function FieldGrid({ fields, columns = "auto" }) {
  return (
    <div className={`asad-field-grid asad-field-grid--${columns}`}>
      {fields.map((field) => (
        <div
          key={field.label}
          className={`asad-field ${field.wide ? "asad-field--wide" : ""}`}
        >
          <span>{field.label}</span>
          <strong>{text(field.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function MatchTile({ label, value }) {
  const isMatch = value === true;
  const isMismatch = value === false;
  return (
    <div className={`asad-match ${isMismatch ? "asad-match--danger" : "asad-match--success"}`}>
      {isMismatch ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
      <div>
        <span>{label}</span>
        <strong>{isMismatch ? "Mismatch" : isMatch ? "Match" : DASH}</strong>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="asad-page">
      <div className="asad-loading-card">
        <span className="asad-spinner" />
        <strong>Loading application</strong>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry }) {
  return (
    <div className="asad-page">
      <div className="asad-error-card">
        <h1>Application unavailable</h1>
        <p>{message}</p>
        <div>
          <Link to="/admin/store/applications" className="asad-secondary-button">
            Back to Queue
          </Link>
          <button type="button" className="asad-primary-button" onClick={onRetry}>
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStoreApplicationDetailPage() {
  const { applicationId } = useParams();
  const queryClient = useQueryClient();
  const reviewRef = useRef(null);
  const [activeAction, setActiveAction] = useState("");
  const [approveInternalNote, setApproveInternalNote] = useState("");
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionSummary, setRevisionSummary] = useState("");
  const [revisionInternalNote, setRevisionInternalNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectInternalNote, setRejectInternalNote] = useState("");

  const detailQuery = useQuery({
    queryKey: [DETAIL_QUERY_KEY, applicationId],
    queryFn: () => fetchAdminStoreApplicationDetail(applicationId),
    enabled: Boolean(applicationId),
  });

  const detail = useMemo(
    () => normalizeDetail(detailQuery.data, applicationId),
    [applicationId, detailQuery.data]
  );

  const invalidateApplications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [DETAIL_QUERY_KEY, applicationId] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "store-application", applicationId] }),
      queryClient.invalidateQueries({ queryKey: [LIST_QUERY_KEY], exact: false }),
      queryClient.invalidateQueries({ queryKey: ["admin", "store-applications"], exact: false }),
    ]);
  };

  const approveMutation = useMutation({
    mutationFn: () =>
      approveAdminStoreApplication(applicationId, {
        internalAdminNote: approveInternalNote || null,
      }),
    onSuccess: async () => {
      toast.success("Application approved");
      setActiveAction("");
      await invalidateApplications();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || error?.message || "Failed to approve application."),
  });

  const revisionMutation = useMutation({
    mutationFn: () =>
      requestAdminStoreApplicationRevision(applicationId, {
        revisionNote,
        revisionSummary: revisionSummary || null,
        internalAdminNote: revisionInternalNote || null,
      }),
    onSuccess: async () => {
      toast.success("Revision requested");
      setActiveAction("");
      await invalidateApplications();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || error?.message || "Failed to request revision."),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectAdminStoreApplication(applicationId, {
        rejectReason,
        internalAdminNote: rejectInternalNote || null,
      }),
    onSuccess: async () => {
      toast.success("Application rejected");
      setActiveAction("");
      await invalidateApplications();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || error?.message || "Failed to reject application."),
  });

  const isBusy =
    approveMutation.isPending || revisionMutation.isPending || rejectMutation.isPending;

  if (detailQuery.isLoading) return <LoadingState />;

  if (detailQuery.isError || !detail) {
    return (
      <ErrorState
        message={
          detailQuery.error?.response?.data?.message ||
          detailQuery.error?.message ||
          "Failed to load store application detail."
        }
        onRetry={() => detailQuery.refetch()}
      />
    );
  }

  const hasReviewAction =
    detail.actionGovernance.canApprove ||
    detail.actionGovernance.canRequestRevision ||
    detail.actionGovernance.canReject;
  const publicStatus = String(detail.activation.storeStatus || "").toUpperCase() === "ACTIVE";
  const provisionedStore = Boolean(detail.activation.storeId || detail.activation.storeSlug);
  const ownerAccess = Boolean(detail.activation.ownerMembershipId);
  const sellerAccess = Boolean(detail.activation.sellerAccessReady);
  const statusTone = getStatusTone(detail.status);

  return (
    <div className="asad-page">
      <header className="asad-header">
        <div>
          <nav className="asad-breadcrumb" aria-label="Breadcrumb">
            <span>Online Store</span>
            <span>/</span>
            <span>Store Applications</span>
          </nav>
          <h1>Store Application #{detail.id}</h1>
          <div className="asad-pills">
            <Pill tone={statusTone}>{detail.statusLabel}</Pill>
            <Pill tone={publicStatus ? "success" : "neutral"}>
              {publicStatus ? "Public" : "Not Public"}
            </Pill>
            {hasReviewAction ? <Pill tone="warning">Action Needed</Pill> : <Pill tone="success">Reviewed</Pill>}
          </div>
        </div>
        <div className="asad-header__actions">
          <Link to="/admin/store/applications" className="asad-secondary-button">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to Queue
          </Link>
          <button
            type="button"
            className="asad-primary-button"
            onClick={() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            Review
          </button>
        </div>
      </header>

      <section className="asad-summary-grid" aria-label="Application summary">
        <SummaryCard icon={FileText} label="Status" value={detail.statusLabel} tone={statusTone} />
        <SummaryCard icon={GitBranch} label="Step" value={detail.stepLabel} tone="info" />
        <SummaryCard
          icon={CheckCircle2}
          label="Progress"
          value={`${detail.completeness.completed}/${detail.completeness.total}`}
          helper={`${detail.completeness.percent}% complete`}
          tone="success"
          progress={detail.completeness.percent}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Submitted"
          value={formatDate(detail.submittedAt)}
          helper={formatTime(detail.submittedAt)}
          tone="warning"
        />
        <SummaryCard icon={UserRound} label="Reviewer" value={text(detail.reviewer.name)} tone="neutral" />
        <SummaryCard
          icon={ShieldCheck}
          label="Identity Match"
          value={text(detail.identityMatch.summary)}
          tone="purple"
        />
      </section>

      <main className="asad-main-grid">
        <Section title="Store Readiness" subtitle="Store access status.">
          <div className="asad-readiness-grid">
            <SummaryCard icon={Globe2} label="Visibility" value={publicStatus ? "Public" : "Not Public"} tone="warning" />
            <SummaryCard icon={Database} label="Provisioned Store" value={boolText(provisionedStore)} tone="neutral" />
            <SummaryCard icon={UsersRound} label="Owner Access" value={ownerAccess ? "Ready" : "Not Ready"} tone="neutral" />
            <SummaryCard icon={UserRound} label="Seller Access" value={sellerAccess ? "Ready" : "Not Ready"} tone="neutral" />
          </div>
          <div className="asad-notice">
            <AlertTriangle size={16} aria-hidden="true" />
            Approval creates the store and owner access.
          </div>
        </Section>

        <Section title="Applicant Identity" subtitle="Account and identity.">
          <FieldGrid
            fields={[
              { label: "User ID", value: detail.applicant.userId },
              { label: "Account Name", value: detail.applicant.name },
              { label: "Account Email", value: detail.applicant.email },
              { label: "Mobile / Phone", value: detail.applicant.phone },
              { label: "Account Role", value: detail.applicant.role },
              { label: "Account Status", value: detail.applicant.status },
              { label: "ID Number", value: detail.identity.number },
              { label: "Birth Date", value: detail.identity.birthDate },
              { label: "ID Type", value: detail.identity.type },
              { label: "ID Name", value: detail.identity.idName },
              { label: "Legal Name", value: detail.identity.legalName },
            ]}
          />
          <div className="asad-match-grid">
            <MatchTile label="Name Match" value={detail.identityMatch.name} />
            <MatchTile label="Email Match" value={detail.identityMatch.email} />
            <MatchTile label="Phone Match" value={detail.identityMatch.phone} />
          </div>
        </Section>

        <Section title="Store Information" subtitle="Store details.">
          <FieldGrid
            fields={[
              { label: "Store Name", value: detail.store.name },
              { label: "Store Slug", value: detail.store.slug },
              { label: "Category", value: detail.store.category },
              { label: "Seller Type", value: detail.store.sellerType },
              { label: "Tax ID / NPWP", value: detail.store.taxId },
              { label: "Business Type", value: detail.store.businessType },
              { label: "Store Description", value: detail.store.description, wide: true },
            ]}
          />
        </Section>

        <Section title="Operational Verification" subtitle="Contact and address.">
          <FieldGrid
            fields={[
              { label: "Contact", value: detail.operational.contact },
              { label: "Phone", value: detail.operational.phone },
              { label: "Address", value: detail.operational.address, wide: true },
              { label: "Province", value: detail.operational.province },
              { label: "City / Regency", value: detail.operational.city },
              { label: "District", value: detail.operational.district },
              { label: "Postal Code", value: detail.operational.postalCode },
              { label: "Country", value: detail.operational.country },
            ]}
          />
        </Section>

        <Section title="Payment Profile" subtitle="Static QRIS request prepared during onboarding.">
          {detail.financial.qrisImageUrl ? (
            <div className="asad-qris-preview">
              <img
                src={resolveAssetUrl(detail.financial.qrisImageUrl)}
                alt="Store application QRIS preview"
              />
              <div>
                <span>QRIS image</span>
                <strong>Ready for Payment Profile review</strong>
                <a
                  href={resolveAssetUrl(detail.financial.qrisImageUrl)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open full image
                </a>
              </div>
            </div>
          ) : null}
          <FieldGrid
            fields={[
              { label: "Payment Type", value: detail.financial.paymentType },
              { label: "Provider", value: detail.financial.provider },
              { label: "Account Name", value: detail.financial.accountName },
              { label: "Merchant Name", value: detail.financial.merchantName },
              { label: "Merchant ID", value: detail.financial.merchantId },
              { label: "Name Match", value: boolText(detail.financial.nameMatch) },
              { label: "QRIS Payload", value: detail.financial.qrisPayload, wide: true },
              { label: "Instruction Text", value: detail.financial.instructionText, wide: true },
              { label: "Seller Note", value: detail.financial.sellerNote, wide: true },
            ]}
          />
        </Section>

        <Section title="Compliance & Risk" subtitle="Risk signals.">
          <FieldGrid
            fields={[
              { label: "Product Types", value: detail.compliance.productTypes },
              { label: "Brand Ownership", value: detail.compliance.brandOwnership },
              { label: "Authenticity Statement", value: boolText(detail.compliance.authenticity) },
              { label: "Prohibited Goods", value: boolText(detail.compliance.prohibitedGoods) },
              { label: "Website", value: detail.compliance.website },
              { label: "Social Media", value: detail.compliance.socialMedia },
              { label: "Support Email", value: detail.compliance.supportEmail },
              { label: "Support Phone", value: detail.compliance.supportPhone },
            ]}
          />
        </Section>
      </main>

      <section className="asad-section asad-review" ref={reviewRef}>
        <div className="asad-section__head">
          <h2>Review Actions</h2>
          <p>Choose an action.</p>
        </div>
        <div className="asad-action-grid">
          <button
            type="button"
            className={`asad-action-card asad-action-card--approve ${activeAction === "approve" ? "is-active" : ""}`}
            onClick={() => setActiveAction("approve")}
          >
            <CheckCircle2 size={28} aria-hidden="true" />
            <span>
              <strong>Approve</strong>
              <small>Create store and grant access.</small>
            </span>
          </button>
          <button
            type="button"
            className={`asad-action-card asad-action-card--revision ${activeAction === "revision" ? "is-active" : ""}`}
            onClick={() => setActiveAction("revision")}
          >
            <AlertTriangle size={28} aria-hidden="true" />
            <span>
              <strong>Request Revision</strong>
              <small>Send back for changes.</small>
            </span>
          </button>
          <button
            type="button"
            className={`asad-action-card asad-action-card--reject ${activeAction === "reject" ? "is-active" : ""}`}
            onClick={() => setActiveAction("reject")}
          >
            <XCircle size={28} aria-hidden="true" />
            <span>
              <strong>Reject</strong>
              <small>Decline this application.</small>
            </span>
          </button>
        </div>

        {activeAction ? (
          <div className="asad-action-form">
            {activeAction === "approve" ? (
              <>
                <label>
                  <span>Internal Note</span>
                  <textarea
                    value={approveInternalNote}
                    onChange={(event) => setApproveInternalNote(event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <button
                  type="button"
                  className="asad-submit asad-submit--approve"
                  disabled={isBusy}
                  onClick={() => approveMutation.mutate()}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve Application"}
                </button>
              </>
            ) : null}

            {activeAction === "revision" ? (
              <>
                <label>
                  <span>Revision Note</span>
                  <textarea
                    value={revisionNote}
                    onChange={(event) => setRevisionNote(event.target.value)}
                    placeholder="Required"
                  />
                </label>
                <label>
                  <span>Summary</span>
                  <textarea
                    value={revisionSummary}
                    onChange={(event) => setRevisionSummary(event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <label>
                  <span>Internal Note</span>
                  <textarea
                    value={revisionInternalNote}
                    onChange={(event) => setRevisionInternalNote(event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <button
                  type="button"
                  className="asad-submit asad-submit--revision"
                  disabled={isBusy || !revisionNote.trim()}
                  onClick={() => revisionMutation.mutate()}
                >
                  {revisionMutation.isPending ? "Requesting..." : "Request Revision"}
                </button>
              </>
            ) : null}

            {activeAction === "reject" ? (
              <>
                <label>
                  <span>Reject Reason</span>
                  <textarea
                    value={rejectReason}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Required"
                  />
                </label>
                <label>
                  <span>Internal Note</span>
                  <textarea
                    value={rejectInternalNote}
                    onChange={(event) => setRejectInternalNote(event.target.value)}
                    placeholder="Optional"
                  />
                </label>
                <button
                  type="button"
                  className="asad-submit asad-submit--reject"
                  disabled={isBusy || !rejectReason.trim()}
                  onClick={() => rejectMutation.mutate()}
                >
                  {rejectMutation.isPending ? "Rejecting..." : "Reject Application"}
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
