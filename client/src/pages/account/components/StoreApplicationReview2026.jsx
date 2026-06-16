import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Bell,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock3,
  EyeOff,
  FileCheck2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  Pencil,
  Rocket,
  ShieldCheck,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  { label: "Owner Details", Icon: UserRound },
  { label: "Store Information", Icon: Store },
  { label: "Business Address", Icon: MapPin },
  { label: "Payout Details", Icon: Banknote },
  { label: "Compliance", Icon: ShieldCheck },
  { label: "Review & Submit", Icon: FileCheck2 },
];

const STATUS_META = {
  draft: {
    label: "Draft",
    message: "Complete your store application.",
    detail: "Review the remaining details before submitting.",
    tone: "slate",
    Icon: FileText,
  },
  submitted: {
    label: "Submitted",
    message: "Your application is under review.",
    detail: "You will be notified when the review is complete.",
    tone: "amber",
    Icon: Clock3,
  },
  under_review: {
    label: "In Review",
    message: "Your application is under review.",
    detail: "You will be notified when the review is complete.",
    tone: "sky",
    Icon: Clock3,
  },
  approved: {
    label: "Approved",
    message: "Your store application has been approved.",
    detail: "Seller access may take a moment to finish syncing.",
    tone: "emerald",
    Icon: BadgeCheck,
  },
  revision_requested: {
    label: "Needs Revision",
    message: "Your application needs revision.",
    detail: "Update the requested details and submit it again.",
    tone: "rose",
    Icon: AlertTriangle,
  },
  rejected: {
    label: "Needs Revision",
    message: "Your application needs revision.",
    detail: "Review the decision note before starting a new application.",
    tone: "rose",
    Icon: AlertTriangle,
  },
  cancelled: {
    label: "Cancelled",
    message: "This application was cancelled.",
    detail: "You can return to your dashboard at any time.",
    tone: "slate",
    Icon: FileText,
  },
};

const TONE_CLASSES = {
  slate: {
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    alert:
      "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-200",
    icon: "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300",
  },
  amber: {
    badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    alert:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    icon: "bg-white text-amber-600 dark:bg-slate-900 dark:text-amber-300",
  },
  sky: {
    badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    alert:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200",
    icon: "bg-white text-sky-600 dark:bg-slate-900 dark:text-sky-300",
  },
  emerald: {
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    alert:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    icon: "bg-white text-emerald-600 dark:bg-slate-900 dark:text-emerald-300",
  },
  rose: {
    badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    alert:
      "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    icon: "bg-white text-rose-600 dark:bg-slate-900 dark:text-rose-300",
  },
};

const CARD_CLASS =
  "rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.04)] dark:border-slate-700 dark:bg-slate-900";

const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const firstValue = (...values) => {
  for (const value of values) {
    if (value === false || value === 0) return value;
    if (value !== null && value !== undefined && String(value).trim() !== "") return value;
  }
  return null;
};

const displayValue = (value) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const normalized = String(value ?? "").trim();
  return normalized || "-";
};

const normalizeStatus = (value) => {
  const status = String(value || "draft").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (status === "declined") return "rejected";
  if (status === "in_review") return "under_review";
  return STATUS_META[status] ? status : "draft";
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatAddress = (address) =>
  [
    address.addressLine1,
    address.addressLine2,
    address.district,
    address.city,
    address.province,
    address.postalCode,
    address.country,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ") || "-";

export const normalizeStoreApplicationReview = (application) => {
  const source = asObject(application);
  const owner = {
    ...asObject(source.profile),
    ...asObject(source.user),
    ...asObject(source.owner),
    ...asObject(source.ownerIdentitySnapshot),
  };
  const store = {
    ...asObject(source.store),
    ...asObject(source.storeInformationSnapshot),
  };
  const business = {
    ...asObject(source.business),
    ...asObject(source.address),
    ...asObject(source.operationalAddressSnapshot),
  };
  const payout = {
    ...asObject(source.payout),
    ...asObject(source.payoutPaymentSnapshot),
  };
  const compliance = {
    ...asObject(source.compliance),
    ...asObject(source.complianceSnapshot),
  };
  const activation = asObject(source.activation);
  const completeness = asObject(source.completeness);
  const workflow = asObject(source.workflow);
  const status = normalizeStatus(
    firstValue(source.status, source.applicationStatus, source.reviewStatus)
  );
  const completedFields = Number(completeness.completedFields || 0);
  const totalFields = Number(completeness.totalFields || 0);
  const completionPercent =
    totalFields > 0
      ? Math.min(100, Math.round((completedFields / totalFields) * 100))
      : ["submitted", "under_review", "approved"].includes(status)
        ? 100
        : 0;

  return {
    id: displayValue(firstValue(source.id, source.applicationId, source.reference)),
    status,
    statusMeta: STATUS_META[status],
    completionPercent,
    submittedAt: firstValue(source.submittedAt, source.submitted_at),
    updatedAt: firstValue(source.updatedAt, source.updated_at),
    reviewNote: displayValue(
      firstValue(source.revisionNote, source.rejectReason, source.reviewNote)
    ),
    canEdit: Boolean(workflow.canEdit),
    canCancel: Boolean(workflow.canCancel),
    visibility:
      String(firstValue(activation.storeStatus, source.storeStatus) || "").toUpperCase() ===
      "ACTIVE"
        ? "Public"
        : "Not Public",
    access: activation.sellerAccessReady ? "Ready" : "Not Ready",
    owner: {
      fullName: displayValue(
        firstValue(owner.fullName, source.fullName, source.profile?.fullName, source.user?.name)
      ),
      email: displayValue(firstValue(owner.email, source.email, source.user?.email)),
      phone: displayValue(firstValue(owner.phoneNumber, owner.phone, source.phoneNumber)),
      contactName: displayValue(
        firstValue(owner.operationalContactName, owner.contactName)
      ),
      birthDate: displayValue(firstValue(owner.birthDate, owner.dateOfBirth)),
      identityType: displayValue(firstValue(owner.identityType, owner.idType)),
      legalName: displayValue(firstValue(owner.identityLegalName, owner.legalName)),
      identityNumber: displayValue(
        firstValue(compliance.identityNumber, owner.identityNumber)
      ),
    },
    store: {
      name: displayValue(firstValue(store.name, store.storeName, source.storeName, source.name)),
      slug: displayValue(firstValue(store.slug, store.storeSlug, source.storeSlug, source.slug)),
      category: displayValue(firstValue(store.storeCategory, store.category)),
      sellerType: displayValue(firstValue(store.sellerType, store.businessType)),
      description: displayValue(firstValue(store.description, store.summary)),
      isSelfProduced: displayValue(store.isSelfProduced),
      initialProductCount: displayValue(store.initialProductCount),
    },
    business: {
      contactName: displayValue(firstValue(business.contactName, business.name)),
      phone: displayValue(firstValue(business.phoneNumber, business.phone)),
      addressLine1: displayValue(firstValue(business.addressLine1, source.addressLine1)),
      addressLine2: displayValue(business.addressLine2),
      district: displayValue(business.district),
      city: displayValue(business.city),
      province: displayValue(business.province),
      postalCode: displayValue(business.postalCode),
      country: displayValue(business.country),
      notes: displayValue(business.notes),
    },
    payout: {
      method: displayValue(firstValue(payout.method, payout.payoutMethod, source.payoutMethod)),
      bankName: displayValue(firstValue(payout.bankName, payout.channel)),
      accountHolder: displayValue(
        firstValue(payout.accountHolderName, payout.accountName)
      ),
      accountNumber: displayValue(payout.accountNumber),
      holderMatchesIdentity: displayValue(payout.accountHolderMatchesIdentity),
    },
    compliance: {
      supportEmail: displayValue(
        firstValue(compliance.supportEmail, source.supportEmail)
      ),
      supportPhone: displayValue(compliance.supportPhone),
      taxId: displayValue(compliance.taxId),
      productTypes: displayValue(compliance.productTypes),
      brandOwnership: displayValue(compliance.brandOwnershipType),
      website: displayValue(compliance.websiteUrl),
      socialMedia: displayValue(compliance.socialMediaUrl),
      authenticityConfirmed: displayValue(compliance.authenticityConfirmed),
      prohibitedGoodsConfirmed: displayValue(compliance.prohibitedGoodsConfirmed),
      agreedToTerms: displayValue(compliance.agreedToTerms),
      agreedToAdminReview: displayValue(compliance.agreedToAdminReview),
      agreedToPlatformPolicy: displayValue(compliance.agreedToPlatformPolicy),
    },
  };
};

function Metric({ label, value, tone = "default", Icon = CircleDot }) {
  const toneClass =
    tone === "green"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "orange"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "blue"
          ? "text-sky-700 dark:text-sky-300"
          : "text-slate-900 dark:text-white";
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 flex items-center gap-2 text-sm font-semibold ${toneClass}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
        {value}
      </p>
    </div>
  );
}

function FieldGrid({ fields }) {
  return (
    <dl className="grid gap-x-8 gap-y-5 p-5 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(({ label, value }) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
          <dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">
            {displayValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ReviewSection({ title, description, Icon, fields, defaultOpen = false }) {
  return (
    <details
      className="group border-b border-slate-200 last:border-b-0 dark:border-slate-700"
      open={defaultOpen}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 marker:hidden sm:px-5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block text-sm font-semibold text-slate-900 dark:text-white">
            {title}
          </strong>
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
            {description}
          </span>
        </span>
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300 sm:flex">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Completed
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500 transition group-open:rotate-180" />
      </summary>
      <FieldGrid fields={fields} />
    </details>
  );
}

export default function StoreApplicationReview2026({
  application,
  onCancel,
  onEdit,
  isCancelling = false,
  canEdit,
  canCancel,
}) {
  const view = normalizeStoreApplicationReview(application);
  const status = view.statusMeta;
  const tone = TONE_CLASSES[status.tone] || TONE_CLASSES.slate;
  const StatusIcon = status.Icon;
  const allowEdit = canEdit ?? view.canEdit;
  const allowCancel = canCancel ?? view.canCancel;
  const reviewSections = [
    {
      title: "Owner Details",
      description: "Personal and contact information.",
      Icon: UserRound,
      fields: [
        { label: "Full Name", value: view.owner.fullName },
        { label: "Email", value: view.owner.email },
        { label: "Phone", value: view.owner.phone },
        { label: "Primary Contact", value: view.owner.contactName },
        { label: "Birth Date", value: view.owner.birthDate },
        { label: "ID Type", value: view.owner.identityType },
        { label: "Legal Name", value: view.owner.legalName },
        { label: "ID Number", value: view.owner.identityNumber },
      ],
    },
    {
      title: "Store Information",
      description: "Store name, category, and business summary.",
      Icon: Store,
      fields: [
        { label: "Store Name", value: view.store.name },
        { label: "Store Slug", value: view.store.slug },
        { label: "Category", value: view.store.category },
        { label: "Seller Type", value: view.store.sellerType },
        { label: "Self Produced", value: view.store.isSelfProduced },
        { label: "Initial Products", value: view.store.initialProductCount },
        { label: "Description", value: view.store.description },
      ],
    },
    {
      title: "Business Address",
      description: "Business contact and operating address.",
      Icon: MapPin,
      fields: [
        { label: "Contact Name", value: view.business.contactName },
        { label: "Business Phone", value: view.business.phone },
        { label: "Full Address", value: formatAddress(view.business) },
        { label: "Address Notes", value: view.business.notes },
      ],
    },
    {
      title: "Payout Details",
      description: "Payment method and account information.",
      Icon: Banknote,
      fields: [
        { label: "Payout Method", value: view.payout.method },
        { label: "Bank or Channel", value: view.payout.bankName },
        { label: "Account Holder", value: view.payout.accountHolder },
        { label: "Account Number", value: view.payout.accountNumber },
        {
          label: "Holder Matches Identity",
          value: view.payout.holderMatchesIdentity,
        },
      ],
    },
    {
      title: "Compliance",
      description: "Declarations, policies, and product information.",
      Icon: ShieldCheck,
      fields: [
        { label: "Support Email", value: view.compliance.supportEmail },
        { label: "Support Phone", value: view.compliance.supportPhone },
        { label: "Tax ID", value: view.compliance.taxId },
        { label: "Product Types", value: view.compliance.productTypes },
        { label: "Brand Ownership", value: view.compliance.brandOwnership },
        { label: "Website", value: view.compliance.website },
        { label: "Social Media", value: view.compliance.socialMedia },
        {
          label: "Authenticity Confirmed",
          value: view.compliance.authenticityConfirmed,
        },
        {
          label: "Prohibited Goods Confirmed",
          value: view.compliance.prohibitedGoodsConfirmed,
        },
        { label: "Terms Accepted", value: view.compliance.agreedToTerms },
        { label: "Admin Review Accepted", value: view.compliance.agreedToAdminReview },
        { label: "Platform Policy Accepted", value: view.compliance.agreedToPlatformPolicy },
      ],
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 text-slate-900 dark:text-slate-100">
      <nav
        className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400"
        aria-label="Breadcrumb"
      >
        <Link className="transition hover:text-emerald-600" to="/user/dashboard">
          My Account
        </Link>
        <span aria-hidden="true">/</span>
        <span>Store Application</span>
      </nav>

      <header>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
              Review your store application
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Review your information and track the approval process.
            </p>
          </div>
          {allowEdit && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Pencil className="h-4 w-4" />
              Edit Application
            </button>
          ) : null}
        </div>
      </header>

      <section className={`${CARD_CLASS} p-5 sm:p-6`} aria-labelledby="application-progress-title">
        <div className="flex items-center justify-between gap-3">
          <h2 id="application-progress-title" className="text-base font-semibold dark:text-white">
            Application Progress
          </h2>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
            6 / 6 Completed
          </span>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {STEPS.map(({ label, Icon }, index) => (
            <div className="relative flex min-w-0 flex-col items-center text-center" key={label}>
              {index > 0 ? (
                <span className="absolute right-1/2 top-4 hidden h-px w-full bg-emerald-200 lg:block dark:bg-emerald-800" />
              ) : null}
              <span className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-600 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300">
                {index === STEPS.length - 1 ? (
                  <Icon className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </span>
              <span className="mt-2 text-[11px] font-medium leading-4 text-slate-600 dark:text-slate-300">
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className={`mt-6 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${tone.alert}`}>
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}>
            <StatusIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{status.message}</p>
            <p className="mt-0.5 text-xs opacity-80">{status.detail}</p>
          </div>
          <span className="whitespace-nowrap rounded-full border border-current/15 px-3 py-1.5 text-xs font-medium">
            Application ID: {view.id === "-" ? "-" : `#APP-${view.id}`}
          </span>
        </div>
      </section>

      {view.reviewNote !== "-" ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          <strong>Review note:</strong> {view.reviewNote}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article className={`${CARD_CLASS} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Application Overview
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Current submission details.
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Metric label="Application Status" value={status.label} Icon={CircleDot} tone="green" />
            <Metric
              label="Completion"
              value={`${view.completionPercent}%`}
              Icon={CheckCircle2}
              tone="green"
            />
            <Metric label="Submitted On" value={formatDateTime(view.submittedAt)} Icon={FileCheck2} />
            <Metric label="Last Updated" value={formatDateTime(view.updatedAt)} Icon={Clock3} />
          </div>
          {allowCancel && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isCancelling}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40"
            >
              {isCancelling ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {isCancelling ? "Cancelling..." : "Cancel Application"}
            </button>
          ) : null}
        </article>

        <article className={`${CARD_CLASS} p-5`}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                Store Status
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Approval and storefront access are managed separately.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Visibility" value={view.visibility} Icon={EyeOff} />
            <Metric label="Access" value={view.access} Icon={LockKeyhole} tone="orange" />
            <Metric label="Status" value={status.label} Icon={Clock3} tone="blue" />
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-emerald-100 bg-emerald-50/70 px-3 py-2.5 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CircleDot className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Keep this page updated. We will notify you when there is progress.
          </div>
        </article>
      </section>

      <section className={CARD_CLASS} aria-labelledby="review-submit-title">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div>
            <h2 id="review-submit-title" className="text-base font-semibold text-slate-950 dark:text-white">
              Review & Submit
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Open each section to review the submitted information.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone.badge}`}>
            {status.label}
          </span>
        </div>
        <div className="border-t border-slate-200 dark:border-slate-700">
          {reviewSections.map((section, index) => (
            <ReviewSection
              key={section.title}
              {...section}
              defaultOpen={index === 0}
            />
          ))}
          <ReviewSection
            title="Review & Submit"
            description="Final review and submission status."
            Icon={FileCheck2}
            fields={[
              { label: "Application Status", value: status.label },
              { label: "Completion", value: `${view.completionPercent}%` },
              { label: "Submitted On", value: formatDateTime(view.submittedAt) },
              { label: "Last Updated", value: formatDateTime(view.updatedAt) },
            ]}
          />
        </div>
      </section>

      <section className={`${CARD_CLASS} p-5`}>
        <h2 className="text-sm font-semibold text-slate-950 dark:text-white">
          You&apos;re all set
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Your application details are saved. We will get back to you with any updates.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Stay updated",
              detail: "Check notifications for updates.",
              Icon: Bell,
              className: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
            },
            {
              title: "Respond fast",
              detail: "Reply quickly if we request info.",
              Icon: FileText,
              className: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
            },
            {
              title: "Go live soon",
              detail: "We will notify you when approved.",
              Icon: Rocket,
              className: "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
            },
          ].map(({ title, detail, Icon, className }) => (
            <div className="flex items-center gap-3" key={title}>
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${className}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/user/dashboard"
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
