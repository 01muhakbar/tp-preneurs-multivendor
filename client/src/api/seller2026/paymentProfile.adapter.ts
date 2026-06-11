type UnknownRecord = Record<string, unknown>;

const object = (value: unknown): UnknownRecord =>
  value && typeof value === "object" ? (value as UnknownRecord) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown, fallback = "") => String(value ?? fallback).trim();
const nullableText = (value: unknown) => text(value) || null;
const boolean = (value: unknown) => Boolean(value);

const status = (value: unknown, fallback = "INACTIVE") =>
  text(value, fallback).toUpperCase();

const formatPaymentType = (value: unknown) => {
  const normalized = status(value, "QRIS_STATIC");
  if (normalized === "QRIS_STATIC") return "Static QRIS";
  return normalized
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const normalizeMissingFields = (value: unknown) =>
  array(value)
    .map((entry) => {
      const field = object(entry);
      return {
        key: text(field.key),
        label: text(field.label, "Required field"),
      };
    })
    .filter((field) => field.key);

export type Seller2026PaymentProfileForm = {
  accountName: string;
  merchantName: string;
  merchantId: string;
  qrisImageUrl: string;
  qrisPayload: string;
  instructionText: string;
  sellerNote: string;
};

export type Seller2026PaymentProfileModel = {
  store: { id: number | null; name: string; slug: string };
  activeSnapshot: {
    id: number | null;
    paymentType: string;
    paymentTypeLabel: string;
    accountName: string;
    merchantName: string;
    merchantId: string;
    qrisImageUrl: string;
    qrisPayload: string;
    instructionText: string;
    isActive: boolean;
    verificationStatus: string;
    verificationLabel: string;
    updatedAt: string | null;
    verifiedAt: string | null;
  } | null;
  form: Seller2026PaymentProfileForm;
  checkoutReady: boolean;
  checkoutStatus: string;
  requestStatus: {
    code: string;
    label: string;
    description: string | null;
    isSubmitted: boolean;
    isDraft: boolean;
  };
  review: {
    code: string;
    label: string;
    description: string | null;
    note: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
  };
  completeness: {
    completedFields: number;
    totalFields: number;
    allRequiredPresent: boolean;
    missingFields: Array<{ key: string; label: string }>;
  };
  progress: Array<{
    key: "account" | "merchant" | "qris" | "approval";
    label: string;
    complete: boolean;
    detail: string;
  }>;
  governance: {
    canView: boolean;
    canEdit: boolean;
    permissionCanEdit: boolean;
    isReviewLocked: boolean;
    lockReason: string | null;
    note: string | null;
    mode: string;
    nextStep: string | null;
  };
  updatedAt: string | null;
  raw: unknown;
};

export const emptySeller2026PaymentProfile: Seller2026PaymentProfileModel = {
  store: { id: null, name: "", slug: "" },
  activeSnapshot: null,
  form: {
    accountName: "",
    merchantName: "",
    merchantId: "",
    qrisImageUrl: "",
    qrisPayload: "",
    instructionText: "",
    sellerNote: "",
  },
  checkoutReady: false,
  checkoutStatus: "Needs setup",
  requestStatus: {
    code: "INACTIVE",
    label: "No request",
    description: null,
    isSubmitted: false,
    isDraft: false,
  },
  review: {
    code: "NOT_REVIEWED",
    label: "Not reviewed",
    description: null,
    note: null,
    submittedAt: null,
    reviewedAt: null,
    reviewedBy: null,
  },
  completeness: {
    completedFields: 0,
    totalFields: 3,
    allRequiredPresent: false,
    missingFields: [
      { key: "accountName", label: "Account name" },
      { key: "merchantName", label: "Merchant name" },
      { key: "qrisImageUrl", label: "QRIS image" },
    ],
  },
  progress: [
    { key: "account", label: "Account", complete: false, detail: "Required" },
    { key: "merchant", label: "Merchant", complete: false, detail: "Required" },
    { key: "qris", label: "QRIS Image", complete: false, detail: "Required" },
    { key: "approval", label: "Admin Approval", complete: false, detail: "Pending" },
  ],
  governance: {
    canView: false,
    canEdit: false,
    permissionCanEdit: false,
    isReviewLocked: false,
    lockReason: null,
    note: null,
    mode: "READ_ONLY_SNAPSHOT",
    nextStep: null,
  },
  updatedAt: null,
  raw: null,
};

export function adaptSeller2026PaymentProfile(
  value: unknown
): Seller2026PaymentProfileModel {
  if (!value) return emptySeller2026PaymentProfile;

  const profile = object(value);
  const store = object(profile.store);
  const active = object(profile.activeSnapshot);
  const pending = object(profile.pendingRequest);
  const draft = object(profile.requestDraft);
  const governance = object(profile.governance);
  const readModel = object(profile.readModel);
  const reviewStatus = object(readModel.reviewStatus);
  const governanceReview = object(governance.reviewStatus);
  const reviewFeedback = object(profile.reviewFeedback);
  const requestStatus = object(profile.requestStatus);
  const requestState = object(readModel.requestState);
  const completenessSource = object(readModel.completeness);
  const activeReadiness = object(active.readiness);
  const nextStep = object(governance.nextStep);

  const form: Seller2026PaymentProfileForm = {
    accountName: text(draft.accountName ?? pending.accountName ?? active.accountName),
    merchantName: text(draft.merchantName ?? pending.merchantName ?? active.merchantName),
    merchantId: text(draft.merchantId ?? pending.merchantId ?? active.merchantId),
    qrisImageUrl: text(draft.qrisImageUrl ?? pending.qrisImageUrl ?? active.qrisImageUrl),
    qrisPayload: text(draft.qrisPayload ?? pending.qrisPayload ?? active.qrisPayload),
    instructionText: text(
      draft.instructionText ?? pending.instructionText ?? active.instructionText
    ),
    sellerNote: text(draft.sellerNote ?? pending.sellerNote),
  };

  const verificationStatus = status(active.verificationStatus);
  const checkoutReady =
    Boolean(Object.keys(active).length) &&
    (boolean(activeReadiness.isReady) ||
      (boolean(active.isActive) &&
        ["ACTIVE", "APPROVED", "VERIFIED"].includes(verificationStatus)));
  const missingFields = normalizeMissingFields(
    completenessSource.missingFields ?? activeReadiness.missingFields
  );
  const allRequiredPresent =
    completenessSource.allRequiredPresent !== undefined
      ? boolean(completenessSource.allRequiredPresent)
      : Boolean(form.accountName && form.merchantName && form.qrisImageUrl);
  const reviewCode = status(
    governanceReview.code ?? reviewStatus.code ?? reviewFeedback.code,
    checkoutReady ? "ACTIVE" : "PENDING"
  );
  const reviewedBy = object(governanceReview.reviewedBy ?? reviewStatus.reviewedBy);
  const requestCode = status(requestStatus.code ?? requestState.code, "DRAFT");

  return {
    store: {
      id: Number(store.id || profile.storeId || 0) || null,
      name: text(store.name),
      slug: text(store.slug),
    },
    activeSnapshot: Object.keys(active).length
      ? {
          id: Number(active.id || 0) || null,
          paymentType: status(active.paymentType, "QRIS_STATIC"),
          paymentTypeLabel: formatPaymentType(active.paymentType),
          accountName: text(active.accountName),
          merchantName: text(active.merchantName),
          merchantId: text(active.merchantId),
          qrisImageUrl: text(active.qrisImageUrl),
          qrisPayload: text(active.qrisPayload),
          instructionText: text(active.instructionText),
          isActive: boolean(active.isActive),
          verificationStatus,
          verificationLabel: text(
            object(active.verificationMeta).label,
            verificationStatus === "ACTIVE" ? "Approved" : verificationStatus
          ),
          updatedAt: nullableText(active.updatedAt),
          verifiedAt: nullableText(active.verifiedAt),
        }
      : null,
    form,
    checkoutReady,
    checkoutStatus: checkoutReady ? "Active" : "Not active",
    requestStatus: {
      code: requestCode,
      label: text(requestStatus.label ?? requestState.label, "Draft request"),
      description: nullableText(requestStatus.description ?? requestState.description),
      isSubmitted: boolean(requestStatus.isSubmitted ?? requestState.isSubmitted),
      isDraft:
        requestStatus.isDraft !== undefined
          ? boolean(requestStatus.isDraft)
          : requestCode === "DRAFT",
    },
    review: {
      code: reviewCode,
      label: text(
        governanceReview.label ?? reviewStatus.label,
        checkoutReady ? "Approved" : "Pending admin review"
      ),
      description: nullableText(
        governanceReview.description ?? reviewStatus.description
      ),
      note: nullableText(
        governanceReview.adminReviewNote ??
          reviewStatus.adminReviewNote ??
          reviewFeedback.adminReviewNote
      ),
      submittedAt: nullableText(governance.submittedAt ?? pending.submittedAt),
      reviewedAt: nullableText(
        governance.reviewedAt ??
          governanceReview.reviewedAt ??
          reviewStatus.reviewedAt ??
          active.verifiedAt
      ),
      reviewedBy: nullableText(reviewedBy.name ?? reviewedBy.email),
    },
    completeness: {
      completedFields: Number(completenessSource.completedFields || 0),
      totalFields: Number(completenessSource.totalFields || 3),
      allRequiredPresent,
      missingFields,
    },
    progress: [
      {
        key: "account",
        label: "Account",
        complete: Boolean(form.accountName),
        detail: form.accountName ? "Complete" : "Required",
      },
      {
        key: "merchant",
        label: "Merchant",
        complete: Boolean(form.merchantName),
        detail: form.merchantName ? "Complete" : "Required",
      },
      {
        key: "qris",
        label: "QRIS Image",
        complete: Boolean(form.qrisImageUrl),
        detail: form.qrisImageUrl ? "Complete" : "Required",
      },
      {
        key: "approval",
        label: "Admin Approval",
        complete: checkoutReady,
        detail: checkoutReady ? "Approved" : text(governanceReview.label, "Pending"),
      },
    ],
    governance: {
      canView: governance.canView !== false,
      canEdit: boolean(governance.canEdit),
      permissionCanEdit: boolean(
        governance.permissionCanEdit ?? governance.canEdit
      ),
      isReviewLocked: boolean(governance.isReviewLocked),
      lockReason: nullableText(governance.lockReason),
      note: nullableText(governance.note),
      mode: text(governance.mode, "READ_ONLY_SNAPSHOT"),
      nextStep: nullableText(nextStep.description ?? nextStep.label),
    },
    updatedAt: nullableText(
      profile.updatedAt ?? pending.updatedAt ?? active.updatedAt
    ),
    raw: value,
  };
}
