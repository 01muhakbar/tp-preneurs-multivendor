import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  CircleAlert,
  CircleDot,
  EyeOff,
  FileCheck2,
  FileText,
  LoaderCircle,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Save,
  SendHorizonal,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  {
    key: "owner_identity",
    label: "Owner Details",
    helper: "Let's start with your personal information.",
    helperDetail: "This information will be used for verification during the review process.",
    Icon: UserRound,
  },
  {
    key: "store_information",
    label: "Store Information",
    helper: "Tell us about the store you want to open.",
    helperDetail: "Keep the store name, category, and description clear and concise.",
    Icon: Store,
  },
  {
    key: "operational_address",
    label: "Business Address",
    helper: "Add your operating address and contact details.",
    helperDetail: "This helps us verify the business and shipping origin.",
    Icon: MapPin,
  },
  {
    key: "payout_payment",
    label: "Payout Details",
    helper: "Set the payout details for your store.",
    helperDetail: "Use account information that matches the owner or business identity.",
    Icon: Banknote,
  },
  {
    key: "compliance",
    label: "Compliance",
    helper: "Confirm your policies and product declarations.",
    helperDetail: "These confirmations keep the marketplace safe and review-ready.",
    Icon: ShieldCheck,
  },
  {
    key: "review",
    label: "Review & Submit",
    helper: "Review your application before submission.",
    helperDetail: "Submit becomes available when all required fields are complete.",
    Icon: FileCheck2,
  },
];

const FIELD_CLASS =
  "mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-emerald-950";
const TEXTAREA_CLASS = `${FIELD_CLASS} min-h-[116px] resize-y`;
const CARD_CLASS =
  "rounded-[28px] border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";

const toText = (value, fallback = "-") => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  const normalized = String(value ?? "").trim();
  return normalized || fallback;
};

const toStatus = (application) => {
  const raw = String(
    application?.statusMeta?.code ||
      application?.status ||
      application?.applicationStatus ||
      application?.reviewStatus ||
      "draft"
  )
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (raw === "under_review") {
    return {
      code: "under_review",
      label: "In Review",
      tone: "sky",
      className: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
    };
  }
  if (raw === "submitted") {
    return {
      code: "submitted",
      label: "Submitted",
      tone: "amber",
      className: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
    };
  }
  if (raw === "approved") {
    return {
      code: "approved",
      label: "Approved",
      tone: "emerald",
      className:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
    };
  }
  if (raw === "revision_requested" || raw === "rejected" || raw === "declined") {
    return {
      code: raw,
      label: "Needs Revision",
      tone: "rose",
      className: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300",
    };
  }
  if (raw === "cancelled") {
    return {
      code: "cancelled",
      label: "Cancelled",
      tone: "slate",
      className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    };
  }
  return {
    code: "draft",
    label: "Draft",
    tone: "amber",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  };
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

const actionTokens = (application) => {
  const actions =
    application?.availableActions ||
    application?.actions ||
    application?.workflow?.availableActions ||
    application?.workflow?.nextAllowedTransitions ||
    [];
  return Array.isArray(actions)
    ? actions.map((entry) => String(entry || "").trim().toLowerCase()).filter(Boolean)
    : [];
};

const allowsSubmitAction = (application) => {
  const tokens = actionTokens(application);
  if (!tokens.length) {
    return Boolean(
      application?.workflow?.canSubmit ||
        application?.workflow?.canResubmit ||
        !application?.workflow
    );
  }
  return tokens.some((token) =>
    [
      "submit",
      "submitted",
      "resubmit",
      "submit_application",
      "resubmit_application",
    ].includes(token)
  );
};

const currentStepIndexOf = (currentStep) =>
  Math.max(
    0,
    STEPS.findIndex((step) => step.key === currentStep)
  );

function Field({
  label,
  section,
  name,
  value,
  onFieldChange,
  type = "text",
  options,
  multiline = false,
  disabled = false,
  placeholder,
  className = "",
}) {
  const handleChange = (event) => {
    const nextValue =
      type === "checkbox"
        ? event.target.checked
        : type === "number"
          ? event.target.value
          : event.target.value;
    onFieldChange(section, name, nextValue);
  };

  if (type === "checkbox") {
    return (
      <label className={`flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60 ${className}`}>
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={handleChange}
          disabled={disabled}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
        />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {label}
        </span>
      </label>
    );
  }

  return (
    <label className={className}>
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {options ? (
        <select
          value={value ?? ""}
          onChange={handleChange}
          disabled={disabled}
          className={FIELD_CLASS}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea
          value={value ?? ""}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={TEXTAREA_CLASS}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          onChange={handleChange}
          disabled={disabled}
          placeholder={placeholder}
          className={FIELD_CLASS}
        />
      )}
    </label>
  );
}

function MetricCard({ label, value, Icon = CircleDot, tone = "slate" }) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "sky"
          ? "text-sky-700 dark:text-sky-300"
          : tone === "rose"
            ? "text-rose-700 dark:text-rose-300"
            : "text-slate-900 dark:text-slate-100";
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/60">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-2 flex items-center gap-2 text-sm font-semibold ${toneClass}`}>
        <Icon className="h-4 w-4" />
        {value}
      </p>
    </div>
  );
}

function SummaryBlock({ title, fields }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <h3 className="text-sm font-semibold text-slate-950 dark:text-white">{title}</h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              {toText(value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default function StoreApplicationWizard2026({
  application,
  form,
  errors = {},
  currentStep,
  completedStepKeys = [],
  missingFields = [],
  onFieldChange,
  onBackStep,
  onNextStep,
  onSaveDraft,
  onSubmitApplication,
  isSaving = false,
  isSubmitting = false,
}) {
  const stepIndex = currentStepIndexOf(currentStep);
  const activeStep = STEPS[stepIndex] || STEPS[0];
  const ActiveIcon = activeStep.Icon;
  const status = toStatus(application);
  const completedSet = new Set(completedStepKeys);
  const isLocked = !application?.workflow?.canEdit;
  const canSubmit =
    currentStep === "review" &&
    missingFields.length === 0 &&
    allowsSubmitAction(application) &&
    !isLocked;
  const completionTotal = Math.max(missingFields.length + completedSet.size, 1);
  const completionDisplay =
    application?.completeness?.totalFields > 0
      ? `${application.completeness.completedFields}/${application.completeness.totalFields}`
      : `${Math.max(0, completionTotal - missingFields.length)}/${completionTotal}`;
  const visibility =
    String(application?.activation?.storeStatus || "").toUpperCase() === "ACTIVE"
      ? "Public"
      : "Not Public";
  const sellerAccess = application?.activation?.sellerAccessReady ? "Ready" : "Not Ready";

  const owner = form.ownerIdentitySnapshot || {};
  const store = form.storeInformationSnapshot || {};
  const business = form.operationalAddressSnapshot || {};
  const payout = form.payoutPaymentSnapshot || {};
  const compliance = form.complianceSnapshot || {};
  const disabled = isLocked || isSaving || isSubmitting;
  const hasError = Object.keys(errors || {}).length > 0;

  const renderFields = () => {
    if (currentStep === "store_information") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Store Name" section="storeInformationSnapshot" name="storeName" value={store.storeName} onFieldChange={onFieldChange} disabled={disabled} placeholder="Store name" />
          <Field label="Store Slug" section="storeInformationSnapshot" name="storeSlug" value={store.storeSlug} onFieldChange={onFieldChange} disabled={disabled} placeholder="example-store" />
          <Field label="Business Category" section="storeInformationSnapshot" name="storeCategory" value={store.storeCategory} onFieldChange={onFieldChange} disabled={disabled} placeholder="Fresh groceries" />
          <Field label="Seller Type" section="storeInformationSnapshot" name="sellerType" value={store.sellerType} onFieldChange={onFieldChange} disabled={disabled} options={[
            { value: "", label: "Select a seller type" },
            { value: "INDIVIDUAL", label: "Individual" },
            { value: "UMKM", label: "SME" },
            { value: "COMPANY", label: "Company" },
            { value: "DISTRIBUTOR", label: "Distributor" },
          ]} />
          <Field label="Self Produced" section="storeInformationSnapshot" name="isSelfProduced" value={store.isSelfProduced} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" />
          <Field label="Initial Product Count" section="storeInformationSnapshot" name="initialProductCount" value={store.initialProductCount ?? ""} onFieldChange={onFieldChange} disabled={disabled} type="number" placeholder="0" />
          <Field label="Store Description" section="storeInformationSnapshot" name="description" value={store.description} onFieldChange={onFieldChange} disabled={disabled} multiline className="md:col-span-2" placeholder="Briefly describe what you sell" />
        </div>
      );
    }

    if (currentStep === "operational_address") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Contact Name" section="operationalAddressSnapshot" name="contactName" value={business.contactName} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Business Phone" section="operationalAddressSnapshot" name="phoneNumber" value={business.phoneNumber} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Address Line 1" section="operationalAddressSnapshot" name="addressLine1" value={business.addressLine1} onFieldChange={onFieldChange} disabled={disabled} className="md:col-span-2" />
          <Field label="Address Line 2" section="operationalAddressSnapshot" name="addressLine2" value={business.addressLine2} onFieldChange={onFieldChange} disabled={disabled} className="md:col-span-2" />
          <Field label="Province" section="operationalAddressSnapshot" name="province" value={business.province} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="City" section="operationalAddressSnapshot" name="city" value={business.city} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="District" section="operationalAddressSnapshot" name="district" value={business.district} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Postal Code" section="operationalAddressSnapshot" name="postalCode" value={business.postalCode} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Country" section="operationalAddressSnapshot" name="country" value={business.country} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Address Notes" section="operationalAddressSnapshot" name="notes" value={business.notes} onFieldChange={onFieldChange} disabled={disabled} multiline className="md:col-span-2" />
        </div>
      );
    }

    if (currentStep === "payout_payment") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Account Holder Name" section="payoutPaymentSnapshot" name="accountHolderName" value={payout.accountHolderName} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Bank or Channel" section="payoutPaymentSnapshot" name="bankName" value={payout.bankName} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Payout Method" section="payoutPaymentSnapshot" name="payoutMethod" value={payout.payoutMethod} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Account Number" section="payoutPaymentSnapshot" name="accountNumber" value={payout.accountNumber} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Tax ID" section="complianceSnapshot" name="taxId" value={compliance.taxId} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="QRIS URL" section="payoutPaymentSnapshot" name="qrisImageUrl" value={payout.qrisImageUrl} onFieldChange={onFieldChange} disabled={disabled} placeholder="https://..." />
          <Field label="Account Matches Identity" section="payoutPaymentSnapshot" name="accountHolderMatchesIdentity" value={payout.accountHolderMatchesIdentity} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" className="md:col-span-2" />
        </div>
      );
    }

    if (currentStep === "compliance") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Support Email" section="complianceSnapshot" name="supportEmail" value={compliance.supportEmail} onFieldChange={onFieldChange} disabled={disabled} type="email" />
          <Field label="Support Phone" section="complianceSnapshot" name="supportPhone" value={compliance.supportPhone} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Product Types" section="complianceSnapshot" name="productTypes" value={compliance.productTypes} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Brand Ownership" section="complianceSnapshot" name="brandOwnershipType" value={compliance.brandOwnershipType} onFieldChange={onFieldChange} disabled={disabled} />
          <Field label="Website" section="complianceSnapshot" name="websiteUrl" value={compliance.websiteUrl} onFieldChange={onFieldChange} disabled={disabled} placeholder="https://..." />
          <Field label="Social Profile" section="complianceSnapshot" name="socialMediaUrl" value={compliance.socialMediaUrl} onFieldChange={onFieldChange} disabled={disabled} placeholder="https://..." />
          <Field label="Additional Notes" section="complianceSnapshot" name="notes" value={compliance.notes} onFieldChange={onFieldChange} disabled={disabled} multiline className="md:col-span-2" />
          <Field label="Authentic Products" section="complianceSnapshot" name="authenticityConfirmed" value={compliance.authenticityConfirmed} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" />
          <Field label="No Prohibited Goods" section="complianceSnapshot" name="prohibitedGoodsConfirmed" value={compliance.prohibitedGoodsConfirmed} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" />
          <Field label="Information Confirmed" section="complianceSnapshot" name="agreedToTerms" value={compliance.agreedToTerms} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" />
          <Field label="Admin Review Consent" section="complianceSnapshot" name="agreedToAdminReview" value={compliance.agreedToAdminReview} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" />
          <Field label="Platform Policy Consent" section="complianceSnapshot" name="agreedToPlatformPolicy" value={compliance.agreedToPlatformPolicy} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" />
          <Field label="Inactive Until Approval" section="complianceSnapshot" name="understandsStoreInactiveUntilApproved" value={compliance.understandsStoreInactiveUntilApproved} onFieldChange={onFieldChange} disabled={disabled} type="checkbox" />
        </div>
      );
    }

    if (currentStep === "review") {
      return (
        <div className="grid gap-4 xl:grid-cols-2">
          <SummaryBlock title="Owner Details" fields={[
            { label: "Full Name", value: owner.fullName },
            { label: "Email", value: owner.email },
            { label: "Phone", value: owner.phoneNumber },
            { label: "ID Type", value: owner.identityType },
          ]} />
          <SummaryBlock title="Store Information" fields={[
            { label: "Store Name", value: store.storeName },
            { label: "Slug", value: store.storeSlug },
            { label: "Category", value: store.storeCategory },
            { label: "Seller Type", value: store.sellerType },
          ]} />
          <SummaryBlock title="Business Address" fields={[
            { label: "Contact", value: business.contactName },
            { label: "Phone", value: business.phoneNumber },
            { label: "Address", value: [business.addressLine1, business.city, business.province, business.country].filter(Boolean).join(", ") },
            { label: "Postal Code", value: business.postalCode },
          ]} />
          <SummaryBlock title="Payout & Compliance" fields={[
            { label: "Payout Method", value: payout.payoutMethod },
            { label: "Account Holder", value: payout.accountHolderName },
            { label: "Support Email", value: compliance.supportEmail },
            { label: "Policy Consent", value: compliance.agreedToPlatformPolicy },
          ]} />
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Full Name" section="ownerIdentitySnapshot" name="fullName" value={owner.fullName} onFieldChange={onFieldChange} disabled={disabled} />
        <Field label="Primary Contact" section="ownerIdentitySnapshot" name="operationalContactName" value={owner.operationalContactName} onFieldChange={onFieldChange} disabled={disabled} />
        <Field label="Email Address" section="ownerIdentitySnapshot" name="email" value={owner.email} onFieldChange={onFieldChange} disabled={disabled} type="email" />
        <Field label="Phone Number" section="ownerIdentitySnapshot" name="phoneNumber" value={owner.phoneNumber} onFieldChange={onFieldChange} disabled={disabled} />
        <Field label="Birth Date" section="ownerIdentitySnapshot" name="birthDate" value={owner.birthDate} onFieldChange={onFieldChange} disabled={disabled} type="date" />
        <Field label="ID Type" section="ownerIdentitySnapshot" name="identityType" value={owner.identityType} onFieldChange={onFieldChange} disabled={disabled} options={[
          { value: "", label: "Select an ID type" },
          { value: "KTP", label: "National ID" },
          { value: "SIM", label: "Driver License" },
          { value: "PASSPORT", label: "Passport" },
          { value: "OTHER", label: "Other" },
        ]} />
        <Field label="ID Number" section="complianceSnapshot" name="identityNumber" value={compliance.identityNumber} onFieldChange={onFieldChange} disabled={disabled} />
        <Field label="Legal Name" section="ownerIdentitySnapshot" name="identityLegalName" value={owner.identityLegalName} onFieldChange={onFieldChange} disabled={disabled} />
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 text-slate-900 dark:text-slate-100">
      <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-end">
        <div>
          <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link className="hover:text-emerald-600" to="/user/dashboard">
              My Account
            </Link>
            <span aria-hidden="true">/</span>
            <span>Store Application</span>
          </nav>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Store Application
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Complete your store details and submit for review.
          </p>
        </div>
        <div className="hidden justify-end lg:flex" aria-hidden="true">
          <div className="relative h-28 w-44 rounded-[28px] bg-emerald-50 dark:bg-emerald-950/30">
            <Store className="absolute bottom-7 left-12 h-16 w-16 text-emerald-600" strokeWidth={1.7} />
            <PackageCheck className="absolute bottom-8 right-10 h-8 w-8 text-emerald-500" />
          </div>
        </div>
      </header>

      {hasError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          Please review the highlighted fields before continuing.
        </div>
      ) : null}

      <section className={`${CARD_CLASS} p-5 sm:p-6`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            Application Progress
          </h2>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
            {status.label}
          </span>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-6">
          {STEPS.map((step, index) => {
            const done = completedSet.has(step.key);
            const active = step.key === currentStep;
            return (
              <div className="relative flex flex-col items-center text-center" key={step.key}>
                {index > 0 ? (
                  <span className="absolute right-1/2 top-5 hidden h-px w-full bg-slate-200 xl:block dark:bg-slate-700" />
                ) : null}
                <span
                  className={[
                    "relative z-10 flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold shadow-sm",
                    done
                      ? "border-emerald-200 bg-emerald-600 text-white"
                      : active
                        ? "border-emerald-200 bg-emerald-600 text-white"
                        : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900",
                  ].join(" ")}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                </span>
                <span className="mt-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {step.label}
                </span>
                {active ? (
                  <span className="mt-1 text-xs font-semibold text-emerald-600">Current</span>
                ) : null}
              </div>
            );
          })}
        </div>
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <ActiveIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-950 dark:text-white">
                {activeStep.helper}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {activeStep.helperDetail}
              </p>
            </div>
          </div>
          {currentStep !== "review" ? (
            <button
              type="button"
              onClick={onNextStep}
              disabled={disabled || stepIndex >= STEPS.length - 1}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1fr]">
        <article className={`${CARD_CLASS} p-5 sm:p-6`}>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
            Application Overview
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Track your application progress and status.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <MetricCard label="Status" value={status.label} Icon={CircleDot} tone={status.tone} />
            <MetricCard label="Completion" value={completionDisplay} Icon={CheckCircle2} tone="emerald" />
            <MetricCard label="Last Updated" value={formatDateTime(application?.updatedAt)} Icon={FileText} />
            <MetricCard label="Current Step" value={activeStep.label} Icon={ActiveIcon} />
          </div>
        </article>

        <article className={`${CARD_CLASS} p-5 sm:p-6`}>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Store Status</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Approval does not guarantee public visibility.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MetricCard label="Public Visibility" value={visibility} Icon={EyeOff} />
            <MetricCard
              label="Seller Access"
              value={sellerAccess}
              Icon={LockKeyhole}
              tone={sellerAccess === "Ready" ? "emerald" : "rose"}
            />
            <MetricCard label="Application" value={status.label} Icon={FileText} tone={status.tone} />
          </div>
          <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
            Complete all required fields to submit your application.
          </div>
        </article>
      </section>

      <section className={`${CARD_CLASS} p-5 sm:p-6`}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {activeStep.label}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeStep.helperDetail}
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </div>
        {renderFields()}
      </section>

      <section className={`${CARD_CLASS} p-5 sm:p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              Missing Required Fields
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Please complete the following items to continue.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            missingFields.length
              ? "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          }`}>
            {missingFields.length ? `${missingFields.length} Fields` : "Complete"}
          </span>
        </div>
        {missingFields.length ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {missingFields.map((field) => (
              <span
                key={field.key || field.label}
                className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              >
                <CircleAlert className="h-3.5 w-3.5" />
                {field.label}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
            All required fields are complete.
          </div>
        )}
      </section>

      <section className={`${CARD_CLASS} p-4`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onBackStep}
              disabled={disabled || stepIndex <= 0}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={disabled}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <Link
              to="/user/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Back to Dashboard
            </Link>
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            {currentStep !== "review" ? (
              <button
                type="button"
                onClick={onNextStep}
                disabled={disabled || stepIndex >= STEPS.length - 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmitApplication}
                disabled={!canSubmit || isSubmitting || isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <SendHorizonal className="h-4 w-4" />
                )}
                {application?.status === "revision_requested"
                  ? "Resubmit Application"
                  : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
