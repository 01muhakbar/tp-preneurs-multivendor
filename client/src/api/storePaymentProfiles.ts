import { api } from "./axios.ts";

type ApiRecord = Record<string, unknown>;

const asRecord = (value: unknown): ApiRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : {};

const hasRecordShape = (value: unknown) => Object.keys(asRecord(value)).length > 0;

const textOrNull = (value: unknown) => {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
};

const textOrFallback = (value: unknown, fallback = "") => {
  const normalized = String(value || "").trim();
  return normalized || fallback;
};

const normalizeMissingFields = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((entry) => {
          const field = asRecord(entry);
          return {
            key: textOrFallback(field.key),
            label: textOrFallback(field.label, "Unknown field"),
          };
        })
        .filter((entry) => entry.key)
    : [];

const normalizeStatusChip = (
  value: unknown,
  fallbackLabel: string,
  fallbackTone: string,
  fallbackCode: string
) => {
  const chip = asRecord(value);
  return {
    code: textOrFallback(chip.code, fallbackCode),
    label: textOrFallback(chip.label, fallbackLabel),
    tone: textOrFallback(chip.tone, fallbackTone),
    description: textOrNull(chip.description),
  };
};

const normalizeActor = (value: unknown) => {
  const actor = asRecord(value);
  return hasRecordShape(actor)
    ? {
        id: Number(actor.id || 0) || null,
        name: textOrFallback(actor.name),
        email: textOrNull(actor.email),
      }
    : null;
};

const firstObject = (...values: unknown[]) =>
  (values.find((value) => value && typeof value === "object" && !Array.isArray(value)) as
    | ApiRecord
    | undefined) || null;

const getListPayload = (payload: unknown) => {
  const envelope = asRecord(payload);
  const dataEnvelope = asRecord(envelope.data);
  const source = dataEnvelope.data ?? envelope.data ?? payload;
  if (Array.isArray(source)) return source;

  const sourceRecord = asRecord(source);
  for (const key of ["items", "rows", "stores", "profiles", "paymentProfiles"]) {
    if (Array.isArray(sourceRecord[key])) return sourceRecord[key] as unknown[];
  }
  return [];
};

const qrisImage = (value: unknown) => {
  const profile = asRecord(value);
  const qris = asRecord(profile.qris);
  return textOrNull(profile.qrisImageUrl || profile.qrisUrl || qris.imageUrl || profile.qrImageUrl);
};

const normalizeSnapshot = (value: unknown) => {
  const snapshot = asRecord(value);
  if (!hasRecordShape(snapshot)) return null;
  const readiness = asRecord(snapshot.readiness);

  return {
    id: Number(snapshot.id || 0) || null,
    storeId: Number(snapshot.storeId || 0) || null,
    providerCode: textOrFallback(snapshot.providerCode, "MANUAL_QRIS"),
    paymentType: textOrFallback(snapshot.paymentType, "QRIS_STATIC"),
    version: Number(snapshot.version || 1),
    snapshotStatus: textOrFallback(snapshot.snapshotStatus, "INACTIVE"),
    accountName: textOrNull(snapshot.accountName || snapshot.account),
    merchantName: textOrNull(snapshot.merchantName || snapshot.merchant),
    merchantId: textOrNull(snapshot.merchantId),
    qrisImageUrl: qrisImage(snapshot),
    qrisPayload: textOrNull(snapshot.qrisPayload),
    instructionText: textOrNull(snapshot.instructionText),
    isActive: Boolean(snapshot.isActive),
    verificationStatus: textOrFallback(snapshot.verificationStatus, "INACTIVE"),
    verificationMeta: normalizeStatusChip(
      snapshot.verificationMeta,
      snapshot.isActive ? "Verified" : "Inactive",
      snapshot.isActive ? "success" : "neutral",
      textOrFallback(snapshot.verificationStatus, "INACTIVE")
    ),
    activityMeta: normalizeStatusChip(
      snapshot.activityMeta,
      snapshot.isActive ? "Active" : "Inactive",
      snapshot.isActive ? "success" : "neutral",
      snapshot.isActive ? "ACTIVE" : "INACTIVE"
    ),
    readiness: {
      code: textOrFallback(readiness.code, "INCOMPLETE"),
      label: textOrFallback(readiness.label, "Incomplete"),
      tone: textOrFallback(readiness.tone, "warning"),
      description: textOrNull(readiness.description),
      isReady: Boolean(readiness.isReady),
      completedFields: Number(readiness.completedFields || 0),
      totalFields: Number(readiness.totalFields || 0),
      missingFields: normalizeMissingFields(readiness.missingFields),
    },
    verifiedAt: snapshot.verifiedAt || null,
    updatedAt: snapshot.updatedAt || null,
  };
};

const normalizePendingRequest = (value: unknown, snapshotValue: unknown) => {
  const request = asRecord(value);
  if (!hasRecordShape(request)) return null;
  const snapshot = asRecord(snapshotValue);
  const readiness = asRecord(request.readiness);

  return {
    id: Number(request.id || 0) || null,
    storeId: Number(request.storeId || snapshot.storeId || 0) || null,
    basedOnProfileId: Number(request.basedOnProfileId || 0) || null,
    requestStatus: textOrFallback(request.requestStatus, "SUBMITTED"),
    accountName: textOrFallback(request.accountName, textOrFallback(snapshot.accountName)),
    merchantName: textOrFallback(request.merchantName, textOrFallback(snapshot.merchantName)),
    merchantId: textOrNull(request.merchantId),
    qrisImageUrl: qrisImage(request),
    qrisPayload: textOrNull(request.qrisPayload),
    instructionText: textOrNull(request.instructionText),
    sellerNote: textOrNull(request.sellerNote),
    adminReviewNote: textOrNull(request.adminReviewNote),
    readiness: {
      code: textOrFallback(readiness.code, "INCOMPLETE"),
      label: textOrFallback(readiness.label, "Incomplete"),
      tone: textOrFallback(readiness.tone, "warning"),
      description: textOrNull(readiness.description),
      isReady: Boolean(readiness.isReady),
      completedFields: Number(readiness.completedFields || 0),
      totalFields: Number(readiness.totalFields || 0),
      missingFields: normalizeMissingFields(readiness.missingFields),
    },
    submittedAt: request.submittedAt || null,
    reviewedAt: request.reviewedAt || null,
    submittedBy: normalizeActor(request.submittedBy),
    reviewedBy: normalizeActor(request.reviewedBy),
  };
};

const normalizeWorkflow = (value: unknown) => {
  const workflow = asRecord(value);
  const reviewStatus = asRecord(workflow.reviewStatus);
  const completeness = asRecord(workflow.completeness);
  const nextStep = asRecord(workflow.nextStep);
  const governance = asRecord(workflow.governance);

  return {
    primaryStatus: normalizeStatusChip(
      workflow.primaryStatus,
      "Waiting for seller setup",
      "neutral",
      "WAITING_SELLER"
    ),
    requestState: {
      ...normalizeStatusChip(workflow.requestState, "No open request", "neutral", "INACTIVE"),
    },
    reviewStatus: {
      ...normalizeStatusChip(workflow.reviewStatus, "Not reviewed yet", "neutral", "NOT_CONFIGURED"),
      reviewedAt: reviewStatus.reviewedAt || null,
      reviewedBy: normalizeActor(reviewStatus.reviewedBy),
      adminReviewNote: textOrNull(reviewStatus.adminReviewNote),
      source: textOrFallback(reviewStatus.source, "ACTIVE_SNAPSHOT"),
    },
    completeness: {
      completedFields: Number(completeness.completedFields || 0),
      totalFields: Number(completeness.totalFields || 0),
      allRequiredPresent: Boolean(completeness.allRequiredPresent),
      missingFields: normalizeMissingFields(completeness.missingFields),
    },
    nextStep: {
      code: textOrFallback(nextStep.code, "WAIT_FOR_SUBMISSION"),
      label: textOrFallback(nextStep.label, "Wait for seller submission"),
      lane: textOrFallback(nextStep.lane, "SELLER_PAYMENT_SETUP"),
      actor: textOrFallback(nextStep.actor, "SELLER"),
      description: textOrNull(nextStep.description),
    },
    governance: {
      managedBy: textOrFallback(governance.managedBy, "ADMIN_FINAL_APPROVAL"),
      canApprovePromotion: Boolean(governance.canApprovePromotion),
      canRequestRevision: Boolean(governance.canRequestRevision),
      canToggleActiveSnapshot: Boolean(governance.canToggleActiveSnapshot),
      note: textOrNull(governance.note),
    },
  };
};

const normalizeWorkspaceReadiness = (value: unknown) => {
  const workspace = asRecord(value);
  if (!hasRecordShape(workspace)) return null;
  const summary = asRecord(workspace.summary);
  const nextStep = asRecord(workspace.nextStep);

  return {
    summary: normalizeStatusChip(workspace.summary, "In progress", "neutral", "IN_PROGRESS"),
    completedItems: Number(summary.completedItems || 0),
    totalItems: Number(summary.totalItems || 0),
    completionPercent: Number(summary.completionPercent || 0),
    checklist: Array.isArray(workspace.checklist)
      ? workspace.checklist
          .map((entry) => {
            const item = asRecord(entry);
            const status = asRecord(item.status);
            const progress = asRecord(item.progress);
            const cta = asRecord(item.cta);
            return {
              key: textOrFallback(item.key),
              label: textOrFallback(item.label, "Unknown"),
              required: Boolean(item.required),
              infoOnly: Boolean(item.infoOnly),
              visible: item.visible !== false,
              isComplete: Boolean(item.isComplete),
              status: normalizeStatusChip(status, "Unknown", "neutral", "UNKNOWN"),
              progress: {
                completed: Number(progress.completed || 0),
                total: Number(progress.total || 0),
                missingFields: normalizeMissingFields(progress.missingFields),
              },
              cta: hasRecordShape(cta)
                ? {
                    label: textOrFallback(cta.label, "Open lane"),
                    lane: textOrFallback(cta.lane, "HOME"),
                    actor: textOrFallback(cta.actor, "SELLER"),
                    description: textOrNull(cta.description),
                  }
                : null,
            };
          })
          .filter((entry) => entry.key)
      : [],
    nextStep: hasRecordShape(nextStep)
      ? {
          code: textOrFallback(nextStep.code, "HOME"),
          label: textOrFallback(nextStep.label, "Follow next step"),
          lane: textOrFallback(nextStep.lane, "HOME"),
          actor: textOrFallback(nextStep.actor, "SELLER"),
          description: textOrNull(nextStep.description),
        }
      : null,
  };
};

const normalizeAdminStorePaymentProfile = (value: unknown) => {
  const entry = asRecord(value);
  if (!hasRecordShape(entry)) return null;

  const storeRecord = asRecord(entry.store);
  const storeSource = firstObject(entry.store, entry);
  const ownerSource = firstObject(entry.owner, entry.user, storeRecord.owner, storeRecord.user);
  const paymentProfile = normalizeSnapshot(
    entry.activeProfile ||
      entry.activeSnapshot ||
      entry.activeStorePaymentProfile ||
      entry.paymentProfile ||
      entry.profile
  );
  const pendingRequest = normalizePendingRequest(
    entry.pendingRequest || entry.request || entry.latestRequest,
    paymentProfile
  );
  const workflow = normalizeWorkflow(entry.workflow);

  return {
    store: storeSource
      ? {
          id: Number(entry.storeId || storeSource.id || 0) || null,
          ownerUserId: Number(storeSource.ownerUserId || 0) || null,
          activeStorePaymentProfileId: Number(storeSource.activeStorePaymentProfileId || 0) || null,
          name: textOrFallback(entry.storeName || entry.name || storeSource.name),
          slug: textOrFallback(storeSource.slug),
          status: textOrFallback(storeSource.status, "ACTIVE"),
        }
      : null,
    owner: normalizeActor(
      ownerSource || {
        name: entry.ownerName,
        email: entry.ownerEmail,
      }
    ),
    paymentProfile,
    pendingRequest,
    workflow,
    reviewStatus: workflow.reviewStatus,
    workspaceReadiness: normalizeWorkspaceReadiness(
      entry.workspaceReadiness ||
        entry.readiness ||
        entry.sellerReadiness ||
        entry.checkoutReadiness
    ),
  };
};

export const getMyStore = async () => {
  const { data } = await api.get("/stores/mine");
  return data?.data ?? null;
};

export const getStorePaymentProfile = async (storeId: number | string) => {
  const { data } = await api.get(`/stores/${storeId}/payment-profile`);
  return data?.data ?? null;
};

export const upsertStorePaymentProfile = async (
  storeId: number | string,
  payload: Record<string, unknown>
) => {
  const { data } = await api.post(`/stores/${storeId}/payment-profile`, payload);
  return data?.data ?? null;
};

export const fetchAdminStorePaymentProfiles = async () => {
  const { data } = await api.get("/admin/stores/payment-profiles");
  return getListPayload(data).map(normalizeAdminStorePaymentProfile).filter(Boolean);
};

export const reviewAdminStorePaymentProfile = async (
  storeId: number | string,
  payload: {
    verificationStatus?: string;
    action?: string;
    decision?: string;
    status?: string;
    note?: string | null;
    adminNote?: string | null;
    reviewNote?: string | null;
    adminReviewNote?: string | null;
  }
) => {
  const decision = String(
    payload.verificationStatus ||
      payload.decision ||
      payload.status ||
      payload.action ||
      ""
  ).toUpperCase();
  const verificationStatus =
    decision === "APPROVE" || decision === "APPROVED" || decision === "ACTIVE"
      ? "ACTIVE"
      : decision === "INACTIVE" || decision === "DEACTIVATE"
        ? "INACTIVE"
        : "REJECTED";
  const { data } = await api.patch(`/admin/stores/${storeId}/payment-profile/review`, {
    verificationStatus,
    adminReviewNote:
      payload.adminReviewNote ??
      payload.reviewNote ??
      payload.adminNote ??
      payload.note ??
      null,
  });
  return normalizeAdminStorePaymentProfile(data?.data ?? null);
};
