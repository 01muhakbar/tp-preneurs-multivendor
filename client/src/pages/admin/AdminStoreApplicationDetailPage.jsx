import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  GitBranch,
  Globe2,
  Settings,
  ShieldCheck,
  UserRound,
  UsersRound,
  XCircle,
} from "lucide-react";
import {
  activateAdminStoreFromApplication,
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

const boolText = (value, isId) =>
  value === true
    ? (isId ? "Ya" : "Yes")
    : value === false
      ? (isId ? "Tidak" : "No")
      : (isId ? "Belum diatur" : DASH);

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

const getCompleteness = (application, isId) => {
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
    label: source.label || (total > 0 && completed >= total ? (isId ? "Lengkap" : "Ready") : (isId ? "Belum Lengkap" : "Needs completion")),
  };
};

const getStatusLabel = (status, isId) => {
  const normalized = String(status || "draft").toLowerCase();
  const labels = {
    draft: isId ? "Draf" : "Draft",
    submitted: isId ? "Diajukan" : "Submitted",
    under_review: isId ? "Ditinjau" : "In Review",
    revision_requested: isId ? "Perlu Revisi" : "Needs Revision",
    approved: isId ? "Disetujui" : "Approved",
    rejected: isId ? "Ditolak" : "Rejected",
    cancelled: isId ? "Dibatalkan" : "Cancelled",
  };
  return labels[normalized] || text(status);
};

const getStatusTone = (status) => {
  const normalized = String(status || "draft").toLowerCase();
  if (["approved"].includes(normalized)) return "blue";
  if (["submitted", "revision_requested"].includes(normalized)) return "orange";
  if (["under_review"].includes(normalized)) return "blue";
  if (["rejected"].includes(normalized)) return "danger";
  return "neutral";
};

const formatDate = (value, isId) => {
  if (!value) return DASH;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return DASH;
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

const getMatchValue = (fields, key) => {
  const found = fields.find((field) => String(field.key || "").toLowerCase() === key);
  if (!found) return null;
  return found.matched;
};

const normalizeDetail = (payload, fallbackId, isId) => {
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
  const completeness = getCompleteness(application, isId);

  const status = text(application.status || workflow.applicationStatus || "draft", "draft").toLowerCase();
  const currentStep = firstObject(application.currentStepMeta, workflow.currentStepMeta);
  const actionGovernance = firstObject(workflow.actionGovernance, application.actionGovernance);

  // Parse match status concisely
  const rawMatchSummary = String(identityMatch.summaryLabel || application.identityMatchLabel || "").toLowerCase();
  let matchSummary = isId ? "Cocok Sebagian" : "Partial Match";
  if (rawMatchSummary.includes("exact") || rawMatchSummary.includes("full") || rawMatchSummary.includes("all match")) {
    matchSummary = isId ? "Cocok Penuh" : "Full Match";
  } else if (rawMatchSummary.includes("mismatch") || rawMatchSummary.includes("no match")) {
    matchSummary = isId ? "Tidak Cocok" : "Mismatch";
  } else if (!rawMatchSummary) {
    matchSummary = isId ? "Belum Verifikasi" : "Unverified";
  }

  return {
    id: application.id || fallbackId,
    status,
    statusLabel: getStatusLabel(status, isId),
    stepLabel: currentStep.label || text(application.currentStep || workflow.currentStep, isId ? "Peninjauan" : "Review"),
    submittedAt: application.submittedAt || workflow.submittedAt,
    reviewedAt: application.reviewedAt || workflow.reviewedAt,
    reviewer: {
      name: reviewer.name || workflow.reviewedBy?.name || (isId ? "Belum Ditinjau" : DASH),
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
      type: ownerIdentity.identityType || "KTP",
      idName: ownerIdentity.fullName,
      legalName: ownerIdentity.identityLegalName || ownerIdentity.legalName,
      residentialAddress: ownerIdentity.residentialAddress,
      region: [
        ownerIdentity.subdistrict,
        ownerIdentity.city,
        ownerIdentity.province,
        ownerIdentity.postalCode,
        ownerIdentity.country,
      ]
        .filter(Boolean)
        .join(", "),
    },
    identityMatch: {
      summary: matchSummary,
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
        <Icon size={18} />
      </span>
      <div className="asad-summary-card__body">
        <span className="asad-summary-card__label">{label}</span>
        <strong className="asad-summary-card__value" title={typeof value === "string" ? value : undefined}>
          {value}
        </strong>
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

function ReadinessItem({ icon: Icon, label, value, isReady }) {
  return (
    <div className={`asad-readiness-chip ${isReady ? "asad-readiness-chip--ready" : "asad-readiness-chip--pending"}`}>
      <span className="asad-readiness-chip__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <div className="asad-readiness-chip__body">
        <span className="asad-readiness-chip__label">{label}</span>
        <strong className="asad-readiness-chip__value">{value}</strong>
      </div>
    </div>
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

function FieldGrid({ fields, columns = "2", isId }) {
  return (
    <div className={`asad-field-grid asad-field-grid--${columns}`}>
      {fields.map((field) => {
        const valText = text(field.value, isId ? "Belum diatur" : DASH);
        const isEmpty = valText === DASH || valText === (isId ? "Belum diatur" : DASH) || !field.value;
        return (
          <div
            key={field.label}
            className={`asad-field ${field.wide ? "asad-field--wide" : ""}`}
          >
            <span>{field.label}</span>
            <strong className={isEmpty ? "is-empty" : "has-value"}>{valText}</strong>
          </div>
        );
      })}
    </div>
  );
}

function MatchTile({ label, value, isId }) {
  const isMatch = value === true;
  const isMismatch = value === false;
  return (
    <div className={`asad-match ${isMismatch ? "asad-match--warning" : "asad-match--success"}`}>
      {isMismatch ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
      <div>
        <span>{label}</span>
        <strong>
          {isMismatch
            ? (isId ? "Tidak Cocok" : "Mismatch")
            : isMatch
              ? (isId ? "Cocok" : "Match")
              : (isId ? "Belum diatur" : DASH)}
        </strong>
      </div>
    </div>
  );
}

function LoadingState({ isId }) {
  return (
    <div className="asad-page">
      <div className="asad-loading-card">
        <span className="asad-spinner" />
        <strong>{isId ? "Memuat pengajuan toko..." : "Loading application..."}</strong>
      </div>
    </div>
  );
}

function ErrorState({ message, onRetry, isId }) {
  return (
    <div className="asad-page">
      <div className="asad-error-card">
        <h1>{isId ? "Pengajuan Tidak Tersedia" : "Application unavailable"}</h1>
        <p>{message}</p>
        <div style={{ display: "flex", gap: "10px" }}>
          <Link to="/admin/store/applications" className="asad-secondary-button">
            {isId ? "Kembali ke Antrean" : "Back to Queue"}
          </Link>
          <button type="button" className="asad-primary-button" onClick={onRetry}>
            {isId ? "Coba Lagi" : "Retry"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminStoreApplicationDetailPage() {
  const { i18n } = useTranslation("admin");
  const isId = String(i18n.language || "").toLowerCase().startsWith("id");
  const params = useParams();
  const applicationId = params.applicationId || params.id;
  const numericId = Number(applicationId);
  const isInvalidId = !Number.isInteger(numericId) || numericId <= 0;

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
    enabled: Boolean(applicationId) && !isInvalidId,
  });

  const detail = useMemo(
    () => normalizeDetail(detailQuery.data, applicationId, isId),
    [applicationId, detailQuery.data, isId]
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
      toast.success(isId ? "Pengajuan toko berhasil disetujui." : "Application approved successfully.");
      setActiveAction("");
      await invalidateApplications();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || error?.message || (isId ? "Gagal menyetujui pengajuan." : "Failed to approve application.")),
  });

  const revisionMutation = useMutation({
    mutationFn: () =>
      requestAdminStoreApplicationRevision(applicationId, {
        revisionNote,
        revisionSummary: revisionSummary || null,
        internalAdminNote: revisionInternalNote || null,
      }),
    onSuccess: async () => {
      toast.success(isId ? "Permintaan revisi berhasil dikirim." : "Revision requested successfully.");
      setActiveAction("");
      await invalidateApplications();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || error?.message || (isId ? "Gagal meminta revisi." : "Failed to request revision.")),
  });

  const rejectMutation = useMutation({
    mutationFn: () =>
      rejectAdminStoreApplication(applicationId, {
        rejectReason,
        internalAdminNote: rejectInternalNote || null,
      }),
    onSuccess: async () => {
      toast.success(isId ? "Pengajuan toko berhasil ditolak." : "Application rejected successfully.");
      setActiveAction("");
      await invalidateApplications();
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || error?.message || (isId ? "Gagal menolak pengajuan." : "Failed to reject application.")),
  });

  const activateStoreMutation = useMutation({
    mutationFn: () => activateAdminStoreFromApplication(applicationId),
    onSuccess: async () => {
      toast.success(isId ? "Toko berhasil diaktifkan (Live)!" : "Store activated successfully (Live)!");
      await invalidateApplications();
      queryClient.invalidateQueries({ queryKey: ["admin-store-profiles"] });
    },
    onError: (error) => {
      toast.error(
        error?.response?.data?.message ||
          (isId ? "Gagal mengaktifkan toko." : "Failed to activate store.")
      );
    },
  });

  const isBusy =
    approveMutation.isPending ||
    revisionMutation.isPending ||
    rejectMutation.isPending ||
    activateStoreMutation.isPending;

  if (isInvalidId) {
    return (
      <ErrorState
        message={isId ? `ID pengajuan "${applicationId}" tidak valid.` : `Invalid store application ID "${applicationId}".`}
        onRetry={() => {}}
        isId={isId}
      />
    );
  }

  if (detailQuery.isLoading) return <LoadingState isId={isId} />;

  if (detailQuery.isError || !detail) {
    return (
      <ErrorState
        message={
          detailQuery.error?.response?.data?.message ||
          detailQuery.error?.message ||
          (isId ? "Gagal memuat rincian pengajuan toko." : "Failed to load store application detail.")
        }
        onRetry={() => detailQuery.refetch()}
        isId={isId}
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
            <Link to="/admin">{isId ? "Toko Online" : "Online Store"}</Link>
            <span>/</span>
            <Link to="/admin/store/applications">{isId ? "Pengajuan Toko" : "Store Applications"}</Link>
            <span>/</span>
            <span>#{detail.id}</span>
          </nav>
          <h1>
            {isId ? "Pengajuan Toko #" : "Store Application #"}
            {detail.id}
          </h1>
          <div className="asad-pills">
            <Pill tone={statusTone}>{detail.statusLabel}</Pill>
            <Pill tone={publicStatus ? "blue" : "neutral"}>
              {publicStatus ? (isId ? "Publik" : "Public") : (isId ? "Belum Publik" : "Not Public")}
            </Pill>
            {hasReviewAction ? (
              <Pill tone="orange">{isId ? "Perlu Tindakan" : "Action Needed"}</Pill>
            ) : (
              <Pill tone="blue">{isId ? "Selesai Ditinjau" : "Reviewed"}</Pill>
            )}
          </div>
        </div>
        <div className="asad-header__actions">
          <Link to="/admin/store/applications" className="asad-secondary-button">
            <ArrowLeft size={16} aria-hidden="true" />
            {isId ? "Kembali ke Antrean" : "Back to Queue"}
          </Link>
          {hasReviewAction ? (
            <button
              type="button"
              className="asad-primary-button"
              onClick={() => reviewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              {isId ? "Tinjau Pengajuan" : "Review Application"}
            </button>
          ) : detail.status === "approved" ? (
            <Link to="/admin/online-store/store-profile" className="asad-primary-button">
              <Settings size={16} aria-hidden="true" />
              {isId ? "Lihat Profil Toko" : "View Store Profile"}
            </Link>
          ) : null}
        </div>
      </header>

      {/* Summary KPI Grid */}
      <section className="asad-summary-grid" aria-label={isId ? "Ringkasan pengajuan" : "Application summary"}>
        <SummaryCard
          icon={FileText}
          label={isId ? "Status" : "Status"}
          value={detail.statusLabel}
          tone={statusTone}
        />
        <SummaryCard
          icon={GitBranch}
          label={isId ? "Tahap" : "Step"}
          value={detail.stepLabel}
          tone="blue"
        />
        <SummaryCard
          icon={CheckCircle2}
          label={isId ? "Kelengkapan" : "Completeness"}
          value={`${detail.completeness.completed}/${detail.completeness.total}`}
          helper={`${detail.completeness.percent}% ${isId ? "selesai" : "complete"}`}
          tone="orange"
          progress={detail.completeness.percent}
        />
        <SummaryCard
          icon={CalendarDays}
          label={isId ? "Diajukan" : "Submitted"}
          value={formatDate(detail.submittedAt, isId)}
          helper={formatTime(detail.submittedAt, isId)}
          tone="blue"
        />
        <SummaryCard
          icon={UserRound}
          label={isId ? "Peninjau" : "Reviewer"}
          value={text(detail.reviewer.name)}
          tone="neutral"
        />
        <SummaryCard
          icon={ShieldCheck}
          label={isId ? "Kecocokan Identitas" : "Identity Match"}
          value={detail.identityMatch.summary}
          helper={isId ? "Verifikasi KTP & Akun" : "KYC & Account data"}
          tone="orange"
        />
      </section>

      {/* 2-Column Main Layout Grid */}
      <main className="asad-main-grid">
        {/* Left Column: Store Readiness & Applicant Identity */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <Section title={isId ? "Kesiapan Toko" : "Store Readiness"}>
            <div className="asad-readiness-grid">
              <ReadinessItem
                icon={Globe2}
                label={isId ? "Visibilitas Toko" : "Store Visibility"}
                value={publicStatus ? (isId ? "Publik" : "Public") : (isId ? "Belum Publik" : "Not Public")}
                isReady={publicStatus}
              />
              <ReadinessItem
                icon={Database}
                label={isId ? "Toko Tersedia" : "Provisioned Store"}
                value={boolText(provisionedStore, isId)}
                isReady={provisionedStore}
              />
              <ReadinessItem
                icon={UsersRound}
                label={isId ? "Akses Pemilik" : "Owner Access"}
                value={ownerAccess ? (isId ? "Siap" : "Ready") : (isId ? "Belum Siap" : "Not Ready")}
                isReady={ownerAccess}
              />
              <ReadinessItem
                icon={UserRound}
                label={isId ? "Akses Penjual" : "Seller Access"}
                value={sellerAccess ? (isId ? "Siap" : "Ready") : (isId ? "Belum Siap" : "Not Ready")}
                isReady={sellerAccess}
              />
            </div>
            <div className="asad-notice">
              <AlertTriangle size={15} aria-hidden="true" />
              <span>
                {isId
                  ? "Persetujuan akan mengaktifkan ruang kerja toko dan akses penjual."
                  : "Approval provisions store workspace & seller access."}
              </span>
            </div>
          </Section>

          <Section title={isId ? "Identitas Pemohon" : "Applicant Identity"}>
            <FieldGrid
              isId={isId}
              fields={[
                { label: isId ? "User ID" : "User ID", value: detail.applicant.userId },
                { label: isId ? "Nama Akun" : "Account Name", value: detail.applicant.name },
                { label: isId ? "Email Akun" : "Account Email", value: detail.applicant.email },
                { label: isId ? "No. Telepon / HP" : "Mobile / Phone", value: detail.applicant.phone },
                { label: isId ? "Peran Akun" : "Account Role", value: detail.applicant.role },
                { label: isId ? "Status Akun" : "Account Status", value: detail.applicant.status },
                { label: isId ? "Nomor KTP / ID" : "ID Number", value: detail.identity.number },
                { label: isId ? "Tanggal Lahir" : "Birth Date", value: detail.identity.birthDate },
                { label: isId ? "Jenis Identitas" : "ID Type", value: detail.identity.type },
                { label: isId ? "Nama di KTP" : "ID Name", value: detail.identity.idName },
                { label: isId ? "Nama Legal" : "Legal Name", value: detail.identity.legalName },
                { label: isId ? "Alamat Domisili" : "Residential Address", value: detail.identity.residentialAddress, wide: true },
                { label: isId ? "Wilayah Domisili" : "Residential Region", value: detail.identity.region, wide: true },
              ]}
            />
            <div className="asad-match-grid">
              <MatchTile label={isId ? "Kecocokan Nama" : "Name Match"} value={detail.identityMatch.name} isId={isId} />
              <MatchTile label={isId ? "Kecocokan Email" : "Email Match"} value={detail.identityMatch.email} isId={isId} />
              <MatchTile label={isId ? "Kecocokan Telepon" : "Phone Match"} value={detail.identityMatch.phone} isId={isId} />
            </div>
          </Section>
        </div>

        {/* Right Column: Store Information & Operational Verification */}
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <Section title={isId ? "Informasi Toko" : "Store Information"}>
            <FieldGrid
              isId={isId}
              fields={[
                { label: isId ? "Nama Toko" : "Store Name", value: detail.store.name },
                { label: isId ? "Slug Toko" : "Store Slug", value: detail.store.slug ? `@${detail.store.slug}` : null },
                { label: isId ? "Kategori" : "Category", value: detail.store.category },
                { label: isId ? "Tipe Penjual" : "Seller Type", value: detail.store.sellerType },
                { label: isId ? "NPWP / Tax ID" : "Tax ID / NPWP", value: detail.store.taxId },
                { label: isId ? "Bentuk Bisnis" : "Business Type", value: detail.store.businessType },
                { label: isId ? "Deskripsi Toko" : "Store Description", value: detail.store.description, wide: true },
              ]}
            />
          </Section>

          <Section title={isId ? "Verifikasi Operasional" : "Operational Verification"}>
            <FieldGrid
              isId={isId}
              fields={[
                { label: isId ? "Kontak Person" : "Contact", value: detail.operational.contact },
                { label: isId ? "Telepon Operasional" : "Phone", value: detail.operational.phone },
                { label: isId ? "Alamat Operasional" : "Address", value: detail.operational.address, wide: true },
                { label: isId ? "Provinsi" : "Province", value: detail.operational.province },
                { label: isId ? "Kota / Kabupaten" : "City / Regency", value: detail.operational.city },
                { label: isId ? "Kecamatan" : "District", value: detail.operational.district },
                { label: isId ? "Kode Pos" : "Postal Code", value: detail.operational.postalCode },
                { label: isId ? "Negara" : "Country", value: detail.operational.country },
              ]}
            />
          </Section>
        </div>

        {/* Full-Width Section: Compliance & Risk */}
        <Section title={isId ? "Kepatuhan & Penilaian Risiko" : "Compliance & Risk"} className="asad-section--full">
          <FieldGrid
            columns="4"
            isId={isId}
            fields={[
              { label: isId ? "Tipe Produk" : "Product Types", value: detail.compliance.productTypes },
              { label: isId ? "Kepemilikan Merek" : "Brand Ownership", value: detail.compliance.brandOwnership },
              { label: isId ? "Pernyataan Keaslian" : "Authenticity Statement", value: boolText(detail.compliance.authenticity, isId) },
              { label: isId ? "Barang Terlarang" : "Prohibited Goods", value: boolText(detail.compliance.prohibitedGoods, isId) },
              { label: isId ? "Situs Web" : "Website", value: detail.compliance.website },
              { label: isId ? "Media Sosial" : "Social Media", value: detail.compliance.socialMedia },
              { label: isId ? "Email Dukungan" : "Support Email", value: detail.compliance.supportEmail },
              { label: isId ? "Telepon Dukungan" : "Support Phone", value: detail.compliance.supportPhone },
            ]}
          />
        </Section>
      </main>

      {/* Review Actions / Decision Resolution Section */}
      <section className="asad-section asad-review" ref={reviewRef}>
        {detail.status === "approved" ? (
          <div>
            <div className="asad-section__head" style={{ marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
                    {isId ? "Status Keputusan: Pengajuan Disetujui" : "Decision Status: Application Approved"}
                  </h2>
                  <p style={{ margin: 0, marginTop: 4, color: "var(--asad-text-muted)", fontSize: "0.85rem" }}>
                    {isId
                      ? "Pengajuan toko ini telah disetujui. Toko dan hak akses penjual telah dibuat."
                      : "This store application has been approved. The store and seller access have been provisioned."}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {/* Card 1: Review Metadata */}
              <div style={{ background: "var(--asad-surface-card)", border: "1px solid var(--asad-border)", borderRadius: "14px", padding: "18px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--asad-text-muted)" }}>
                  {isId ? "Ringkasan Peninjauan" : "Review Summary"}
                </span>
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--asad-text-muted)" }}>{isId ? "Keputusan" : "Decision"}</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "999px", fontSize: 12, fontWeight: 700, background: "rgba(3, 76, 133, 0.2)", color: "#38bdf8", border: "1px solid rgba(3, 76, 133, 0.4)" }}>
                      ✓ {isId ? "Disetujui" : "Approved"}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--asad-text-muted)" }}>{isId ? "Peninjau" : "Reviewer"}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{text(detail.reviewer.name, isId ? "Super Admin" : "Admin")}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--asad-text-muted)" }}>{isId ? "Waktu Disetujui" : "Approved At"}</span>
                    <span style={{ fontSize: 13 }}>{formatDate(detail.reviewedAt, isId)}</span>
                  </div>
                  {detail.reviewSummary.internalAdminNote ? (
                    <div style={{ marginTop: "6px", padding: "10px 12px", borderRadius: "8px", background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--asad-text-muted)", display: "block" }}>{isId ? "Catatan Internal:" : "Internal Note:"}</span>
                      <span style={{ fontSize: 12, color: "var(--asad-text)" }}>{detail.reviewSummary.internalAdminNote}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Card 2: Store Connection & Live Status */}
              <div style={{ background: "var(--asad-surface-card)", border: "1px solid var(--asad-border)", borderRadius: "14px", padding: "18px" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--asad-text-muted)" }}>
                  {isId ? "Toko & Visibilitas Etalase" : "Store & Storefront Visibility"}
                </span>
                <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--asad-text-muted)" }}>{isId ? "Nama Toko" : "Store Name"}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9" }}>{detail.store.name}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--asad-text-muted)" }}>{isId ? "Tautan / Slug" : "Store Slug"}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#38bdf8" }}>@{detail.store.slug}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13, color: "var(--asad-text-muted)" }}>{isId ? "Status Etalase" : "Storefront Status"}</span>
                    {publicStatus ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "999px", fontSize: 12, fontWeight: 700, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#10b981" }} />
                        {isId ? "Aktif (Live)" : "Active (Live)"}
                      </span>
                    ) : (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "3px 10px", borderRadius: "999px", fontSize: 12, fontWeight: 700, background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#f59e0b" }} />
                        {isId ? "Nonaktif (Inactive)" : "Inactive"}
                      </span>
                    )}
                  </div>

                  {!publicStatus && (
                    <div style={{ padding: "10px 12px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", fontSize: 12, color: "#fbbf24" }}>
                      {isId
                        ? "Visibilitas toko saat ini masih Nonaktif. Klik tombol di bawah untuk mengaktifkannya secara langsung agar dapat diakses pembeli."
                        : "Store is currently Inactive. Click below to activate it so buyers can view the storefront."}
                    </div>
                  )}

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                    {!publicStatus && (
                      <button
                        type="button"
                        onClick={() => activateStoreMutation.mutate()}
                        disabled={activateStoreMutation.isPending}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "8px 16px",
                          borderRadius: "10px",
                          fontSize: 12,
                          fontWeight: 700,
                          background: "linear-gradient(135deg, #034c85 0%, #023864 100%)",
                          color: "#fff",
                          border: "1px solid rgba(56, 189, 248, 0.4)",
                          cursor: activateStoreMutation.isPending ? "wait" : "pointer",
                          boxShadow: "0 2px 8px rgba(3, 76, 133, 0.35)",
                        }}
                      >
                        <CheckCircle2 size={14} />
                        {activateStoreMutation.isPending
                          ? (isId ? "Mengaktifkan..." : "Activating...")
                          : (isId ? "Aktifkan Toko Sekarang (Live)" : "Activate Store Now (Live)")}
                      </button>
                    )}

                    <Link
                      to="/admin/online-store/store-profile"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: "rgba(255, 255, 255, 0.05)",
                        color: "var(--asad-text)",
                        border: "1px solid var(--asad-border)",
                        textDecoration: "none",
                      }}
                    >
                      <Settings size={14} />
                      {isId ? "Profil Toko" : "Store Profile"}
                    </Link>

                    <a
                      href={`/store/${encodeURIComponent(detail.store.slug || "")}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 14px",
                        borderRadius: "10px",
                        fontSize: 12,
                        fontWeight: 600,
                        background: "rgba(254, 111, 5, 0.12)",
                        color: "#fe6f05",
                        border: "1px solid rgba(254, 111, 5, 0.35)",
                        textDecoration: "none",
                      }}
                    >
                      <ExternalLink size={14} />
                      {isId ? "Buka Etalase" : "Visit Storefront"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : detail.status === "rejected" ? (
          <div>
            <div className="asad-section__head">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <XCircle size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{isId ? "Status Keputusan: Pengajuan Ditolak" : "Decision Status: Application Rejected"}</h2>
                  <p style={{ margin: 0, marginTop: 4, color: "var(--asad-text-muted)" }}>
                    {isId ? "Pengajuan onboarding toko ini telah ditolak." : "This store application has been rejected."}
                  </p>
                </div>
              </div>
            </div>
            {detail.reviewSummary.rejectReason && (
              <div style={{ marginTop: "14px", padding: "14px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#ef4444", display: "block" }}>{isId ? "Alasan Penolakan:" : "Rejection Reason:"}</span>
                <p style={{ margin: 0, marginTop: 4, fontSize: 13, color: "var(--asad-text)" }}>{detail.reviewSummary.rejectReason}</p>
              </div>
            )}
          </div>
        ) : detail.status === "revision_requested" ? (
          <div>
            <div className="asad-section__head">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 style={{ margin: 0 }}>{isId ? "Status Keputusan: Menunggu Revisi Penjual" : "Decision Status: Awaiting Revision"}</h2>
                  <p style={{ margin: 0, marginTop: 4, color: "var(--asad-text-muted)" }}>
                    {isId ? "Permintaan revisi telah dikirim kepada penjual." : "Revision requested from the seller."}
                  </p>
                </div>
              </div>
            </div>
            {detail.reviewSummary.revisionNote && (
              <div style={{ marginTop: "14px", padding: "14px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#f59e0b", display: "block" }}>{isId ? "Catatan Revisi untuk Penjual:" : "Revision Note for Seller:"}</span>
                <p style={{ margin: 0, marginTop: 4, fontSize: 13, color: "var(--asad-text)" }}>{detail.reviewSummary.revisionNote}</p>
              </div>
            )}
          </div>
        ) : (
          /* Normal Interactive Actions for Pending Review */
          <>
            <div className="asad-section__head">
              <h2>{isId ? "Tindakan Peninjauan" : "Review Actions"}</h2>
              <p>{isId ? "Pilih keputusan untuk pengajuan onboarding toko ini." : "Select a decision for this store onboarding application."}</p>
            </div>
            <div className="asad-action-grid">
              <button
                type="button"
                className={`asad-action-card asad-action-card--approve ${activeAction === "approve" ? "is-active" : ""}`}
                onClick={() => setActiveAction(activeAction === "approve" ? "" : "approve")}
              >
                <CheckCircle2 size={24} aria-hidden="true" />
                <span>
                  <strong>{isId ? "Setujui Toko" : "Approve"}</strong>
                  <small>{isId ? "Buat toko & aktifkan akses seller" : "Provision store & activate access"}</small>
                </span>
              </button>
              <button
                type="button"
                className={`asad-action-card asad-action-card--revision ${activeAction === "revision" ? "is-active" : ""}`}
                onClick={() => setActiveAction(activeAction === "revision" ? "" : "revision")}
              >
                <AlertTriangle size={24} aria-hidden="true" />
                <span>
                  <strong>{isId ? "Minta Revisi" : "Request Revision"}</strong>
                  <small>{isId ? "Kirim catatan perbaikan ke seller" : "Send notes for seller correction"}</small>
                </span>
              </button>
              <button
                type="button"
                className={`asad-action-card asad-action-card--reject ${activeAction === "reject" ? "is-active" : ""}`}
                onClick={() => setActiveAction(activeAction === "reject" ? "" : "reject")}
              >
                <XCircle size={24} aria-hidden="true" />
                <span>
                  <strong>{isId ? "Tolak Pengajuan" : "Reject"}</strong>
                  <small>{isId ? "Batalkan pengajuan toko ini" : "Decline this application"}</small>
                </span>
              </button>
            </div>

            {activeAction ? (
              <div className="asad-action-form">
                {activeAction === "approve" ? (
                  <>
                    <label>
                      <span>{isId ? "Catatan Internal Admin (Opsional)" : "Internal Note (Optional)"}</span>
                      <textarea
                        value={approveInternalNote}
                        onChange={(event) => setApproveInternalNote(event.target.value)}
                        placeholder={isId ? "Catatan tambahan untuk tim admin..." : "Optional internal notes..."}
                      />
                    </label>
                    <button
                      type="button"
                      className="asad-submit asad-submit--approve"
                      disabled={isBusy}
                      onClick={() => approveMutation.mutate()}
                    >
                      {approveMutation.isPending
                        ? (isId ? "Menyetujui..." : "Approving...")
                        : (isId ? "Konfirmasi Persetujuan Toko" : "Confirm Store Approval")}
                    </button>
                  </>
                ) : null}

                {activeAction === "revision" ? (
                  <>
                    <label>
                      <span>{isId ? "Catatan Revisi untuk Penjual *" : "Revision Note for Seller *"}</span>
                      <textarea
                        value={revisionNote}
                        onChange={(event) => setRevisionNote(event.target.value)}
                        placeholder={isId ? "Tuliskan data yang perlu diperbaiki oleh penjual..." : "Explain required corrections for the seller..."}
                        required
                      />
                    </label>
                    <label>
                      <span>{isId ? "Ringkasan Revisi (Opsional)" : "Summary (Optional)"}</span>
                      <textarea
                        value={revisionSummary}
                        onChange={(event) => setRevisionSummary(event.target.value)}
                        placeholder={isId ? "Ringkasan singkat..." : "Brief summary..."}
                      />
                    </label>
                    <label>
                      <span>{isId ? "Catatan Internal Admin (Opsional)" : "Internal Admin Note (Optional)"}</span>
                      <textarea
                        value={revisionInternalNote}
                        onChange={(event) => setRevisionInternalNote(event.target.value)}
                        placeholder={isId ? "Catatan tim admin..." : "Admin-only notes..."}
                      />
                    </label>
                    <button
                      type="button"
                      className="asad-submit asad-submit--revision"
                      disabled={isBusy || !revisionNote.trim()}
                      onClick={() => revisionMutation.mutate()}
                    >
                      {revisionMutation.isPending
                        ? (isId ? "Mengirim Permintaan..." : "Requesting...")
                        : (isId ? "Kirim Permintaan Revisi" : "Request Revision")}
                    </button>
                  </>
                ) : null}

                {activeAction === "reject" ? (
                  <>
                    <label>
                      <span>{isId ? "Alasan Penolakan *" : "Reject Reason *"}</span>
                      <textarea
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                        placeholder={isId ? "Tuliskan alasan penolakan secara jelas..." : "Explain reason for rejection..."}
                        required
                      />
                    </label>
                    <label>
                      <span>{isId ? "Catatan Internal Admin (Opsional)" : "Internal Admin Note (Optional)"}</span>
                      <textarea
                        value={rejectInternalNote}
                        onChange={(event) => setRejectInternalNote(event.target.value)}
                        placeholder={isId ? "Catatan tim admin..." : "Admin-only notes..."}
                      />
                    </label>
                    <button
                      type="button"
                      className="asad-submit asad-submit--reject"
                      disabled={isBusy || !rejectReason.trim()}
                      onClick={() => rejectMutation.mutate()}
                    >
                      {rejectMutation.isPending
                        ? (isId ? "Menolak..." : "Rejecting...")
                        : (isId ? "Konfirmasi Penolakan Pengajuan" : "Confirm Application Rejection")}
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
