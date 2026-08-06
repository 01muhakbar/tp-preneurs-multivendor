import { Op } from "sequelize";
import {
  sequelize,
  Order,
  OrderCollectionClaim,
  OrderPaymentAttempt,
  DuitkuCallbackInbox,
  OrderPaymentAttemptEvent,
  Suborder,
  Payment,
  PaymentProof,
} from "../../models/index.js";
import { appendPaymentStatusLog } from "../paymentStatusLog.service.js";
import { appendAuditNote } from "../operationalAudit.service.js";
import { sha256Hex } from "../duitku/duitkuCallbackParser.service.js";
import { recalculateParentOrderPaymentStatus } from "../orderPaymentAggregation.service.js";

export const DUITKU_FINANCIAL_LOCK_ORDER = [
  "ORDER",
  "CLAIM",
  "ATTEMPT",
  "SUBORDERS",
  "PAYMENTS",
  "EVIDENCE",
] as const;

type ActorType = "SYSTEM" | "BUYER" | "SELLER" | "ADMIN" | "WEBHOOK";
type LockTrace = (step: (typeof DUITKU_FINANCIAL_LOCK_ORDER)[number]) => void;

type TransactionContext = {
  transaction: any;
  lockTrace?: LockTrace;
};

type FinancialResult = {
  ok: boolean;
  action: string;
  idempotent: boolean;
  orderId?: number;
  claimState?: string | null;
  attemptStatus?: string | null;
  paymentStatus?: string | null;
  processingResult?: string | null;
  reason?: string;
};

export class FinancialTransactionError extends Error {
  code: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode = 409) {
    super(message);
    this.name = "FinancialTransactionError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

const assertLocalStep6Runtime = () => {
  if (process.env.NODE_ENV === "production") {
    throw new FinancialTransactionError(
      "STEP6_NOT_APPROVED_FOR_PRODUCTION",
      "Duitku Step 6 financial transaction service is not approved for production runtime.",
      403
    );
  }
};

const getAttr = (row: any, key: string) =>
  row?.getDataValue?.(key) ?? row?.get?.(key) ?? row?.dataValues?.[key];

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeUpper = (value: unknown) => String(value || "").trim().toUpperCase();

const asId = (value: unknown, label: string) => {
  const id = toNumber(value, 0);
  if (!Number.isInteger(id) || id <= 0) {
    throw new FinancialTransactionError("INVALID_INPUT", `${label} must be a positive integer.`, 400);
  }
  return id;
};

const trace = (ctx: TransactionContext, step: (typeof DUITKU_FINANCIAL_LOCK_ORDER)[number]) => {
  ctx.lockTrace?.(step);
};

const lockParentOrder = async (ctx: TransactionContext, orderId: number) => {
  trace(ctx, "ORDER");
  const order = await Order.findByPk(orderId, {
    transaction: ctx.transaction,
    lock: ctx.transaction.LOCK.UPDATE,
  });
  if (!order) throw new FinancialTransactionError("ORDER_NOT_FOUND", "Parent order not found.", 404);
  return order;
};

const lockClaim = async (ctx: TransactionContext, orderId: number) => {
  trace(ctx, "CLAIM");
  return OrderCollectionClaim.findOne({
    where: { orderId },
    transaction: ctx.transaction,
    lock: ctx.transaction.LOCK.UPDATE,
  });
};

const lockAttempts = async (ctx: TransactionContext, orderId: number, attemptId?: number | null) => {
  trace(ctx, "ATTEMPT");
  const where = attemptId ? { id: attemptId, orderId } : { orderId };
  return OrderPaymentAttempt.findAll({
    where,
    order: [["id", "ASC"]],
    transaction: ctx.transaction,
    lock: ctx.transaction.LOCK.UPDATE,
  });
};

const lockSuborders = async (ctx: TransactionContext, orderId: number) => {
  trace(ctx, "SUBORDERS");
  return Suborder.findAll({
    where: { orderId },
    order: [["id", "ASC"]],
    transaction: ctx.transaction,
    lock: ctx.transaction.LOCK.UPDATE,
  });
};

const lockPayments = async (ctx: TransactionContext, suborderIds: number[]) => {
  trace(ctx, "PAYMENTS");
  if (suborderIds.length === 0) return [];
  return Payment.findAll({
    where: { suborderId: { [Op.in]: suborderIds } },
    order: [["id", "ASC"]],
    transaction: ctx.transaction,
    lock: ctx.transaction.LOCK.UPDATE,
  });
};

const loadDuitkuCallbackLocator = async (callbackInboxId: number) => {
  const inbox = await DuitkuCallbackInbox.findByPk(callbackInboxId, {
    attributes: [
      "id",
      "paymentAttemptId",
      "resolvedPaymentAttemptId",
      "merchantOrderIdRaw",
      "providerReferenceRaw",
      "amountRaw",
      "resultCodeRaw",
    ],
  });
  if (!inbox) {
    throw new FinancialTransactionError("CALLBACK_NOT_FOUND", "Duitku callback inbox row not found.", 404);
  }
  const attemptId = toNumber(getAttr(inbox, "paymentAttemptId"), 0) || toNumber(getAttr(inbox, "resolvedPaymentAttemptId"), 0);
  if (!attemptId) {
    return { inbox, attempt: null };
  }
  const attempt = await OrderPaymentAttempt.findByPk(attemptId, {
    attributes: ["id", "orderId"],
  });
  return { inbox, attempt };
};

const lockEvidence = async (
  ctx: TransactionContext,
  input: { callbackInboxId?: number; paymentProofId?: number }
) => {
  trace(ctx, "EVIDENCE");
  const callbackInbox = input.callbackInboxId
    ? await DuitkuCallbackInbox.findByPk(input.callbackInboxId, {
        transaction: ctx.transaction,
        lock: ctx.transaction.LOCK.UPDATE,
      })
    : null;
  const paymentProof = input.paymentProofId
    ? await PaymentProof.findByPk(input.paymentProofId, {
        transaction: ctx.transaction,
        lock: ctx.transaction.LOCK.UPDATE,
      })
    : null;
  return { callbackInbox, paymentProof };
};

const withTransaction = async <T>(callback: (ctx: TransactionContext) => Promise<T>, lockTrace?: LockTrace) => {
  assertLocalStep6Runtime();
  return sequelize.transaction(async (transaction) => callback({ transaction, lockTrace }));
};

const requireClaim = (claim: any) => {
  if (!claim) {
    throw new FinancialTransactionError("COLLECTION_CLAIM_REQUIRED", "Collection claim is required before financial mutation.");
  }
  return claim;
};

const ensureClaim = (claim: any, rail: "DUITKU_POP" | "QRIS_STATIC", state = "CLAIMED") => {
  requireClaim(claim);
  const currentRail = normalizeUpper(getAttr(claim, "rail"));
  const currentState = normalizeUpper(getAttr(claim, "claimState"));
  if (currentRail !== rail || currentState !== state) {
    throw new FinancialTransactionError(
      "COLLECTION_CLAIM_MISMATCH",
      `Expected ${rail}/${state} claim, found ${currentRail || "NONE"}/${currentState || "NONE"}.`
    );
  }
};

const updateParentToProcessingIfPaid = async (order: any, transaction: any) => {
  const orderStatus = String(getAttr(order, "status") || "pending").toLowerCase().trim();
  const paymentStatus = normalizeUpper(getAttr(order, "paymentStatus"));
  if (paymentStatus === "PAID" && orderStatus === "pending") {
    await order.update({ status: "processing" } as any, { transaction });
  }
};

const appendPaymentLogIfChanged = async (
  payment: any,
  oldStatus: string,
  newStatus: string,
  input: {
    actorType: ActorType;
    actorId?: number | null;
    note: string;
    source: string;
    traceId?: string | null;
  },
  transaction: any
) => {
  if (oldStatus === newStatus) return;
  await appendPaymentStatusLog(
    {
      paymentId: toNumber(getAttr(payment, "id"), 0),
      oldStatus,
      newStatus,
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      traceId: input.traceId ?? null,
      note: appendAuditNote(input.note, {
        source: input.source,
        traceId: input.traceId ?? null,
        paymentId: toNumber(getAttr(payment, "id"), 0),
        suborderId: toNumber(getAttr(payment, "suborderId"), 0),
      }),
    },
    transaction
  );
};

const upsertAttemptEventForCallback = async (
  input: {
    attempt: any;
    inbox: any;
    processingResult: "APPLIED" | "IGNORED" | "QUARANTINED" | "ERROR";
    amountNormalized: number | null;
  },
  transaction: any
) => {
  const callbackInboxId = toNumber(getAttr(input.inbox, "id"), 0);
  const existing = await OrderPaymentAttemptEvent.findOne({
    where: { callbackInboxId },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (existing) {
    await existing.update(
      {
        duplicateCount: toNumber(getAttr(existing, "duplicateCount"), 0) + 1,
        lastReceivedAt: new Date(),
      } as any,
      { transaction }
    );
    return { event: existing, duplicate: true };
  }

  const now = new Date();
  const occurrenceKey = sha256Hex(`step6-callback-event\n${callbackInboxId}`);
  const eventHash = sha256Hex(
    [
      "step6-callback-event-v1",
      callbackInboxId,
      getAttr(input.inbox, "eventHash"),
      getAttr(input.inbox, "rawBodyDigest"),
    ].join("\n")
  );
  const event = await OrderPaymentAttemptEvent.create(
    {
      paymentAttemptId: toNumber(getAttr(input.attempt, "id"), 0),
      callbackInboxId,
      eventType: "CALLBACK",
      occurrenceKey,
      merchantOrderId: String(getAttr(input.attempt, "merchantOrderId") || "").trim() || null,
      providerReference: String(getAttr(input.inbox, "providerReferenceRaw") || "").trim() || null,
      providerAmountRaw: String(getAttr(input.inbox, "amountRaw") || "").trim() || null,
      amountNormalized: input.amountNormalized,
      providerResultCode: String(getAttr(input.inbox, "resultCodeRaw") || "").trim() || null,
      signatureState: "VALID",
      processingResult: input.processingResult,
      eventHash,
      rawBodyDigest: String(getAttr(input.inbox, "rawBodyDigest") || "").trim() || null,
      duplicateCount: 0,
      firstReceivedAt: now,
      lastReceivedAt: now,
    },
    { transaction }
  );
  return { event, duplicate: false };
};

export const applyDuitkuCallback = async (input: {
  callbackInboxId: number;
  actorType?: ActorType;
  traceId?: string | null;
  lockTrace?: LockTrace;
}): Promise<FinancialResult> => {
  const callbackInboxId = asId(input.callbackInboxId, "callbackInboxId");
  const locator = await loadDuitkuCallbackLocator(callbackInboxId);
  if (!locator.attempt) {
    return withTransaction(async (ctx) => {
      const { callbackInbox } = await lockEvidence(ctx, { callbackInboxId });
      if (callbackInbox) {
        await callbackInbox.update(
          { processingResult: "QUARANTINED", quarantineReason: "UNBOUND_CALLBACK" } as any,
          { transaction: ctx.transaction }
        );
      }
      return {
        ok: true,
        action: "QUARANTINED",
        idempotent: true,
        processingResult: "QUARANTINED",
        reason: "UNBOUND_CALLBACK",
      };
    }, input.lockTrace);
  }

  const orderId = toNumber(getAttr(locator.attempt, "orderId"), 0);
  return withTransaction(async (ctx) => {
    const order = await lockParentOrder(ctx, orderId);
    const claim = requireClaim(await lockClaim(ctx, orderId));
    const attempts = await lockAttempts(ctx, orderId, toNumber(getAttr(locator.attempt, "id"), 0));
    const attempt = attempts[0];
    if (!attempt) {
      throw new FinancialTransactionError("ATTEMPT_NOT_FOUND", "Duitku payment attempt not found.", 404);
    }
    const suborders = await lockSuborders(ctx, orderId);
    const suborderIds = suborders.map((suborder: any) => toNumber(getAttr(suborder, "id"), 0)).filter(Boolean);
    const payments = await lockPayments(ctx, suborderIds);
    const { callbackInbox } = await lockEvidence(ctx, { callbackInboxId });
    if (!callbackInbox) {
      throw new FinancialTransactionError("CALLBACK_NOT_FOUND", "Duitku callback inbox row not found.", 404);
    }

    const resultCode = String(getAttr(callbackInbox, "resultCodeRaw") || "").trim();
    const amount = toNumber(getAttr(callbackInbox, "amountRaw"), NaN);
    const attemptAmount = toNumber(getAttr(attempt, "amount"), NaN);
    const existingEvent = await OrderPaymentAttemptEvent.findOne({
      where: { callbackInboxId },
      transaction: ctx.transaction,
      lock: ctx.transaction.LOCK.UPDATE,
    });
    if (existingEvent && normalizeUpper(getAttr(existingEvent, "processingResult")) === "APPLIED") {
      return {
        ok: true,
        action: "IDEMPOTENT",
        idempotent: true,
        orderId,
        claimState: getAttr(claim, "claimState") || null,
        attemptStatus: getAttr(attempt, "status") || null,
        processingResult: "APPLIED",
      };
    }

    ensureClaim(claim, "DUITKU_POP", "CLAIMED");
    if (toNumber(getAttr(claim, "orderPaymentAttemptId"), 0) !== toNumber(getAttr(attempt, "id"), 0)) {
      throw new FinancialTransactionError("CLAIM_ATTEMPT_MISMATCH", "Duitku claim does not belong to this attempt.");
    }
    if (!Number.isFinite(amount) || amount !== attemptAmount) {
      await callbackInbox.update(
        { processingResult: "QUARANTINED", quarantineReason: "AMOUNT_MISMATCH" } as any,
        { transaction: ctx.transaction }
      );
      await upsertAttemptEventForCallback(
        { attempt, inbox: callbackInbox, processingResult: "QUARANTINED", amountNormalized: Number.isFinite(amount) ? amount : null },
        ctx.transaction
      );
      return {
        ok: true,
        action: "QUARANTINED",
        idempotent: false,
        orderId,
        processingResult: "QUARANTINED",
        reason: "AMOUNT_MISMATCH",
      };
    }

    const now = new Date();
    const duitkuPayments = payments.filter((payment: any) => {
      const channel = normalizeUpper(getAttr(payment, "paymentChannel"));
      const type = normalizeUpper(getAttr(payment, "paymentType"));
      const paidBy = toNumber(getAttr(payment, "paidByOrderPaymentAttemptId"), 0);
      return channel === "DUITKU" || type === "DUITKU_POP" || paidBy === toNumber(getAttr(attempt, "id"), 0);
    });

    if (resultCode === "00") {
      if (duitkuPayments.length === 0) {
        await callbackInbox.update(
          { processingResult: "QUARANTINED", quarantineReason: "NO_DUITKU_ALLOCATIONS" } as any,
          { transaction: ctx.transaction }
        );
        await upsertAttemptEventForCallback(
          { attempt, inbox: callbackInbox, processingResult: "QUARANTINED", amountNormalized: amount },
          ctx.transaction
        );
        return {
          ok: true,
          action: "QUARANTINED",
          idempotent: false,
          orderId,
          processingResult: "QUARANTINED",
          reason: "NO_DUITKU_ALLOCATIONS",
        };
      }

      await attempt.update(
        {
          status: "PAID",
          paidAt: now,
          providerReference: getAttr(attempt, "providerReference") || getAttr(callbackInbox, "providerReferenceRaw") || null,
          providerLastCode: resultCode,
        } as any,
        { transaction: ctx.transaction }
      );
      await claim.update(
        { claimState: "PAID", paidAt: now, terminalAt: now } as any,
        { transaction: ctx.transaction }
      );
      for (const suborder of suborders) {
        await suborder.update(
          {
            paymentMethod: "DUITKU",
            paymentStatus: "PAID",
            fulfillmentStatus: normalizeUpper(getAttr(suborder, "fulfillmentStatus")) || "UNFULFILLED",
            paidAt: now,
          } as any,
          { transaction: ctx.transaction }
        );
      }
      for (const payment of duitkuPayments) {
        const oldStatus = normalizeUpper(getAttr(payment, "status")) || "CREATED";
        await payment.update(
          {
            status: "PAID",
            paymentChannel: "DUITKU",
            paymentType: "DUITKU_POP",
            paidAt: now,
            paidByOrderPaymentAttemptId: toNumber(getAttr(attempt, "id"), 0),
            externalReference: getAttr(payment, "externalReference") || getAttr(callbackInbox, "providerReferenceRaw") || null,
          } as any,
          { transaction: ctx.transaction }
        );
        await appendPaymentLogIfChanged(
          payment,
          oldStatus,
          "PAID",
          {
            actorType: input.actorType || "WEBHOOK",
            note: "Duitku callback marked allocation paid.",
            source: "duitku:callback:paid",
            traceId: input.traceId,
          },
          ctx.transaction
        );
      }
      await callbackInbox.update(
        {
          bindingState: "BOUND",
          resolvedPaymentAttemptId: toNumber(getAttr(attempt, "id"), 0),
          processingResult: "APPLIED",
          quarantineReason: null,
          resolvedAt: now,
        } as any,
        { transaction: ctx.transaction }
      );
      await upsertAttemptEventForCallback(
        { attempt, inbox: callbackInbox, processingResult: "APPLIED", amountNormalized: amount },
        ctx.transaction
      );
      await recalculateParentOrderPaymentStatus(orderId, ctx.transaction);
      await order.reload({ transaction: ctx.transaction });
      await updateParentToProcessingIfPaid(order, ctx.transaction);
      return {
        ok: true,
        action: "APPLIED_PAID",
        idempotent: false,
        orderId,
        claimState: "PAID",
        attemptStatus: "PAID",
        processingResult: "APPLIED",
      };
    }

    if (resultCode === "01") {
      await attempt.update(
        { status: "FAILED", providerLastCode: resultCode } as any,
        { transaction: ctx.transaction }
      );
      await claim.update(
        { claimState: "FAILED", terminalAt: now } as any,
        { transaction: ctx.transaction }
      );
      for (const payment of duitkuPayments) {
        const oldStatus = normalizeUpper(getAttr(payment, "status")) || "CREATED";
        await payment.update(
          { status: "FAILED", paidAt: null } as any,
          { transaction: ctx.transaction }
        );
        await appendPaymentLogIfChanged(
          payment,
          oldStatus,
          "FAILED",
          {
            actorType: input.actorType || "WEBHOOK",
            note: "Duitku callback marked allocation failed.",
            source: "duitku:callback:failed",
            traceId: input.traceId,
          },
          ctx.transaction
        );
      }
      for (const suborder of suborders) {
        if (normalizeUpper(getAttr(suborder, "paymentStatus")) !== "PAID") {
          await suborder.update(
            { paymentStatus: "FAILED", paidAt: null } as any,
            { transaction: ctx.transaction }
          );
        }
      }
      await callbackInbox.update(
        {
          bindingState: "BOUND",
          resolvedPaymentAttemptId: toNumber(getAttr(attempt, "id"), 0),
          processingResult: "APPLIED",
          quarantineReason: null,
          resolvedAt: now,
        } as any,
        { transaction: ctx.transaction }
      );
      await upsertAttemptEventForCallback(
        { attempt, inbox: callbackInbox, processingResult: "APPLIED", amountNormalized: amount },
        ctx.transaction
      );
      await recalculateParentOrderPaymentStatus(orderId, ctx.transaction);
      return {
        ok: true,
        action: "APPLIED_FAILED",
        idempotent: false,
        orderId,
        claimState: "FAILED",
        attemptStatus: "FAILED",
        processingResult: "APPLIED",
      };
    }

    await attempt.update(
      { status: "UNKNOWN", requiresManualReview: true, manualReviewReason: "UNKNOWN_CALLBACK_RESULT", manualReviewCreatedAt: now } as any,
      { transaction: ctx.transaction }
    );
    await callbackInbox.update(
      { processingResult: "QUARANTINED", quarantineReason: "UNKNOWN_RESULT_CODE" } as any,
      { transaction: ctx.transaction }
    );
    await upsertAttemptEventForCallback(
      { attempt, inbox: callbackInbox, processingResult: "QUARANTINED", amountNormalized: Number.isFinite(amount) ? amount : null },
      ctx.transaction
    );
    return {
      ok: true,
      action: "QUARANTINED",
      idempotent: false,
      orderId,
      attemptStatus: "UNKNOWN",
      processingResult: "QUARANTINED",
      reason: "UNKNOWN_RESULT_CODE",
    };
  }, input.lockTrace);
};

const loadPaymentLocator = async (paymentId: number) => {
  const payment = await Payment.findByPk(paymentId, {
    attributes: ["id", "suborderId"],
  });
  if (!payment) throw new FinancialTransactionError("PAYMENT_NOT_FOUND", "Payment not found.", 404);
  const suborder = await Suborder.findByPk(toNumber(getAttr(payment, "suborderId"), 0), {
    attributes: ["id", "orderId"],
  });
  if (!suborder) throw new FinancialTransactionError("SUBORDER_NOT_FOUND", "Suborder not found.", 404);
  return { payment, suborder, orderId: toNumber(getAttr(suborder, "orderId"), 0) };
};

export const approveQrisProof = async (input: {
  paymentId: number;
  proofId: number;
  actorUserId: number;
  note?: string | null;
  traceId?: string | null;
  lockTrace?: LockTrace;
}): Promise<FinancialResult> => {
  const paymentId = asId(input.paymentId, "paymentId");
  const proofId = asId(input.proofId, "proofId");
  const locator = await loadPaymentLocator(paymentId);
  return withTransaction(async (ctx) => {
    const order = await lockParentOrder(ctx, locator.orderId);
    const claim = requireClaim(await lockClaim(ctx, locator.orderId));
    await lockAttempts(ctx, locator.orderId);
    const suborders = await lockSuborders(ctx, locator.orderId);
    const payments = await lockPayments(
      ctx,
      suborders.map((suborder: any) => toNumber(getAttr(suborder, "id"), 0)).filter(Boolean)
    );
    const { paymentProof } = await lockEvidence(ctx, { paymentProofId: proofId });
    const payment = payments.find((row: any) => toNumber(getAttr(row, "id"), 0) === paymentId);
    const suborder = suborders.find((row: any) => toNumber(getAttr(row, "id"), 0) === toNumber(getAttr(payment, "suborderId"), 0));
    if (!payment || !suborder || !paymentProof) {
      throw new FinancialTransactionError("PAYMENT_EVIDENCE_NOT_FOUND", "Payment proof evidence was not found.", 404);
    }

    ensureClaim(claim, "QRIS_STATIC", "CLAIMED");
    if (normalizeUpper(getAttr(payment, "paymentChannel")) !== "QRIS") {
      throw new FinancialTransactionError("PAYMENT_RAIL_MISMATCH", "Only QRIS allocations can be approved by seller proof.");
    }
    const currentStatus = normalizeUpper(getAttr(payment, "status")) || "CREATED";
    const proofStatus = normalizeUpper(getAttr(paymentProof, "reviewStatus")) || "PENDING";
    if (currentStatus === "PAID" && proofStatus === "APPROVED") {
      return {
        ok: true,
        action: "IDEMPOTENT",
        idempotent: true,
        orderId: locator.orderId,
        paymentStatus: "PAID",
      };
    }
    if (currentStatus !== "PENDING_CONFIRMATION" && currentStatus !== "CREATED") {
      throw new FinancialTransactionError("PAYMENT_REVIEW_STATUS_INVALID", "QRIS proof can only approve CREATED or PENDING_CONFIRMATION payments.");
    }
    if (proofStatus !== "PENDING") {
      throw new FinancialTransactionError("PAYMENT_PROOF_ALREADY_REVIEWED", "Payment proof has already been reviewed.");
    }

    const now = new Date();
    await payment.update({ status: "PAID", paidAt: now } as any, { transaction: ctx.transaction });
    await suborder.update(
      { paymentStatus: "PAID", fulfillmentStatus: "UNFULFILLED", paidAt: now } as any,
      { transaction: ctx.transaction }
    );
    await paymentProof.update(
      {
        reviewStatus: "APPROVED",
        reviewNote: input.note || null,
        reviewedByUserId: input.actorUserId,
        reviewedAt: now,
      } as any,
      { transaction: ctx.transaction }
    );
    await appendPaymentLogIfChanged(
      payment,
      currentStatus,
      "PAID",
      {
        actorType: "SELLER",
        actorId: input.actorUserId,
        note: input.note || "Seller approved QRIS payment proof.",
        source: "shared-financial:qris-proof:approve",
        traceId: input.traceId,
      },
      ctx.transaction
    );
    const nextParentPaymentStatus = await recalculateParentOrderPaymentStatus(locator.orderId, ctx.transaction);
    if (normalizeUpper(nextParentPaymentStatus) === "PAID") {
      await claim.update({ claimState: "PAID", paidAt: now, terminalAt: now } as any, {
        transaction: ctx.transaction,
      });
      await order.reload({ transaction: ctx.transaction });
      await updateParentToProcessingIfPaid(order, ctx.transaction);
    }
    return {
      ok: true,
      action: "APPLIED_QRIS_APPROVED",
      idempotent: false,
      orderId: locator.orderId,
      paymentStatus: "PAID",
      claimState: getAttr(claim, "claimState") || null,
    };
  }, input.lockTrace);
};

export const rejectQrisProof = async (input: {
  paymentId: number;
  proofId: number;
  actorUserId: number;
  note?: string | null;
  traceId?: string | null;
  lockTrace?: LockTrace;
}): Promise<FinancialResult> => {
  const paymentId = asId(input.paymentId, "paymentId");
  const proofId = asId(input.proofId, "proofId");
  const locator = await loadPaymentLocator(paymentId);
  return withTransaction(async (ctx) => {
    await lockParentOrder(ctx, locator.orderId);
    const claim = requireClaim(await lockClaim(ctx, locator.orderId));
    await lockAttempts(ctx, locator.orderId);
    const suborders = await lockSuborders(ctx, locator.orderId);
    const payments = await lockPayments(
      ctx,
      suborders.map((suborder: any) => toNumber(getAttr(suborder, "id"), 0)).filter(Boolean)
    );
    const { paymentProof } = await lockEvidence(ctx, { paymentProofId: proofId });
    const payment = payments.find((row: any) => toNumber(getAttr(row, "id"), 0) === paymentId);
    const suborder = suborders.find((row: any) => toNumber(getAttr(row, "id"), 0) === toNumber(getAttr(payment, "suborderId"), 0));
    if (!payment || !suborder || !paymentProof) {
      throw new FinancialTransactionError("PAYMENT_EVIDENCE_NOT_FOUND", "Payment proof evidence was not found.", 404);
    }
    ensureClaim(claim, "QRIS_STATIC", "CLAIMED");
    const currentStatus = normalizeUpper(getAttr(payment, "status")) || "CREATED";
    const proofStatus = normalizeUpper(getAttr(paymentProof, "reviewStatus")) || "PENDING";
    if (currentStatus === "REJECTED" && proofStatus === "REJECTED") {
      return {
        ok: true,
        action: "IDEMPOTENT",
        idempotent: true,
        orderId: locator.orderId,
        paymentStatus: "REJECTED",
      };
    }
    if (proofStatus !== "PENDING") {
      throw new FinancialTransactionError("PAYMENT_PROOF_ALREADY_REVIEWED", "Payment proof has already been reviewed.");
    }
    const now = new Date();
    await payment.update({ status: "REJECTED", paidAt: null } as any, { transaction: ctx.transaction });
    await suborder.update({ paymentStatus: "UNPAID", paidAt: null } as any, {
      transaction: ctx.transaction,
    });
    await paymentProof.update(
      {
        reviewStatus: "REJECTED",
        reviewNote: input.note || null,
        reviewedByUserId: input.actorUserId,
        reviewedAt: now,
      } as any,
      { transaction: ctx.transaction }
    );
    await appendPaymentLogIfChanged(
      payment,
      currentStatus,
      "REJECTED",
      {
        actorType: "SELLER",
        actorId: input.actorUserId,
        note: input.note || "Seller rejected QRIS payment proof.",
        source: "shared-financial:qris-proof:reject",
        traceId: input.traceId,
      },
      ctx.transaction
    );
    await recalculateParentOrderPaymentStatus(locator.orderId, ctx.transaction);
    return {
      ok: true,
      action: "APPLIED_QRIS_REJECTED",
      idempotent: false,
      orderId: locator.orderId,
      paymentStatus: "REJECTED",
    };
  }, input.lockTrace);
};

export const cancelBuyerPayment = async (input: {
  orderId: number;
  actorUserId?: number | null;
  traceId?: string | null;
  lockTrace?: LockTrace;
}): Promise<FinancialResult> => {
  const orderId = asId(input.orderId, "orderId");
  return withTransaction(async (ctx) => {
    const order = await lockParentOrder(ctx, orderId);
    const claim = await lockClaim(ctx, orderId);
    const attempts = await lockAttempts(ctx, orderId);
    const suborders = await lockSuborders(ctx, orderId);
    const payments = await lockPayments(ctx, suborders.map((suborder: any) => toNumber(getAttr(suborder, "id"), 0)).filter(Boolean));
    await lockEvidence(ctx, {});
    const claimState = normalizeUpper(getAttr(claim, "claimState"));
    if (claimState === "PAID") {
      throw new FinancialTransactionError("PAID_CLAIM_CANNOT_BE_CANCELLED", "Paid collection claim cannot be cancelled.");
    }
    const now = new Date();
    if (claim) {
      await claim.update({ claimState: "CANCELLED", terminalAt: now } as any, {
        transaction: ctx.transaction,
      });
    }
    for (const attempt of attempts) {
      if (!["PAID", "FAILED", "CANCELLED", "EXPIRED"].includes(normalizeUpper(getAttr(attempt, "status")))) {
        await attempt.update({ status: "CANCELLED", cancelledAt: now } as any, {
          transaction: ctx.transaction,
        });
      }
    }
    for (const payment of payments) {
      const oldStatus = normalizeUpper(getAttr(payment, "status")) || "CREATED";
      if (!["PAID", "CANCELLED"].includes(oldStatus)) {
        await payment.update({ status: "CANCELLED", paidAt: null } as any, {
          transaction: ctx.transaction,
        });
        await appendPaymentLogIfChanged(
          payment,
          oldStatus,
          "CANCELLED",
          {
            actorType: input.actorUserId ? "BUYER" : "SYSTEM",
            actorId: input.actorUserId ?? null,
            note: "Buyer payment was cancelled through shared financial transaction service.",
            source: "shared-financial:buyer-cancel",
            traceId: input.traceId,
          },
          ctx.transaction
        );
      }
    }
    for (const suborder of suborders) {
      if (normalizeUpper(getAttr(suborder, "paymentStatus")) !== "PAID") {
        await suborder.update({ paymentStatus: "CANCELLED", paidAt: null } as any, {
          transaction: ctx.transaction,
        });
      }
    }
    await order.update({ status: "cancelled", paymentStatus: "UNPAID" } as any, {
      transaction: ctx.transaction,
    });
    return { ok: true, action: "APPLIED_CANCELLED", idempotent: false, orderId };
  }, input.lockTrace);
};

export const expirePayment = async (input: {
  paymentId: number;
  traceId?: string | null;
  lockTrace?: LockTrace;
}): Promise<FinancialResult> => {
  const paymentId = asId(input.paymentId, "paymentId");
  const locator = await loadPaymentLocator(paymentId);
  return withTransaction(async (ctx) => {
    await lockParentOrder(ctx, locator.orderId);
    const claim = await lockClaim(ctx, locator.orderId);
    await lockAttempts(ctx, locator.orderId);
    const suborders = await lockSuborders(ctx, locator.orderId);
    const payments = await lockPayments(ctx, suborders.map((suborder: any) => toNumber(getAttr(suborder, "id"), 0)).filter(Boolean));
    await lockEvidence(ctx, {});
    const payment = payments.find((row: any) => toNumber(getAttr(row, "id"), 0) === paymentId);
    const suborder = suborders.find((row: any) => toNumber(getAttr(row, "id"), 0) === toNumber(getAttr(payment, "suborderId"), 0));
    if (!payment || !suborder) {
      throw new FinancialTransactionError("PAYMENT_NOT_FOUND", "Payment not found.", 404);
    }
    const currentStatus = normalizeUpper(getAttr(payment, "status")) || "CREATED";
    if (currentStatus !== "CREATED") {
      return {
        ok: true,
        action: "IDEMPOTENT",
        idempotent: true,
        orderId: locator.orderId,
        paymentStatus: currentStatus,
      };
    }
    if (claim && normalizeUpper(getAttr(claim, "claimState")) === "PAID") {
      throw new FinancialTransactionError("PAID_CLAIM_CANNOT_EXPIRE", "Paid collection claim cannot be expired.");
    }
    await payment.update({ status: "EXPIRED", paidAt: null } as any, { transaction: ctx.transaction });
    await suborder.update({ paymentStatus: "EXPIRED", paidAt: null } as any, {
      transaction: ctx.transaction,
    });
    await appendPaymentLogIfChanged(
      payment,
      currentStatus,
      "EXPIRED",
      {
        actorType: "SYSTEM",
        note: "Payment expired through shared financial transaction service.",
        source: "shared-financial:expire-payment",
        traceId: input.traceId,
      },
      ctx.transaction
    );
    await recalculateParentOrderPaymentStatus(locator.orderId, ctx.transaction);
    return {
      ok: true,
      action: "APPLIED_EXPIRED",
      idempotent: false,
      orderId: locator.orderId,
      paymentStatus: "EXPIRED",
    };
  }, input.lockTrace);
};

export const activateQrisFallback = async (input: {
  orderId: number;
  traceId?: string | null;
  lockTrace?: LockTrace;
}): Promise<FinancialResult> => {
  const orderId = asId(input.orderId, "orderId");
  return withTransaction(async (ctx) => {
    await lockParentOrder(ctx, orderId);
    const claim = requireClaim(await lockClaim(ctx, orderId));
    const attempts = await lockAttempts(ctx, orderId);
    const suborders = await lockSuborders(ctx, orderId);
    const payments = await lockPayments(ctx, suborders.map((suborder: any) => toNumber(getAttr(suborder, "id"), 0)).filter(Boolean));
    await lockEvidence(ctx, {});
    const currentRail = normalizeUpper(getAttr(claim, "rail"));
    const currentState = normalizeUpper(getAttr(claim, "claimState"));
    if (currentRail === "QRIS_STATIC" && currentState === "CLAIMED") {
      return { ok: true, action: "IDEMPOTENT", idempotent: true, orderId, claimState: "CLAIMED" };
    }
    if (currentRail !== "DUITKU_POP" || !["FAILED", "EXPIRED", "CANCELLED"].includes(currentState)) {
      throw new FinancialTransactionError("QRIS_FALLBACK_NOT_ALLOWED", "QRIS fallback requires terminal non-paid Duitku claim.");
    }
    const terminalAttempt = attempts.some((attempt: any) =>
      ["FAILED", "EXPIRED", "CANCELLED"].includes(normalizeUpper(getAttr(attempt, "status")))
    );
    if (!terminalAttempt) {
      throw new FinancialTransactionError("QRIS_FALLBACK_ATTEMPT_NOT_TERMINAL", "Duitku attempt is not terminal.");
    }
    await claim.update(
      {
        rail: "QRIS_STATIC",
        claimState: "CLAIMED",
        claimSource: "QRIS_FALLBACK",
        orderPaymentAttemptId: null,
        paidAt: null,
        terminalAt: null,
      } as any,
      { transaction: ctx.transaction }
    );
    for (const suborder of suborders) {
      if (normalizeUpper(getAttr(suborder, "paymentStatus")) !== "PAID") {
        await suborder.update({ paymentMethod: "QRIS", paymentStatus: "UNPAID", paidAt: null } as any, {
          transaction: ctx.transaction,
        });
      }
    }
    for (const payment of payments) {
      if (normalizeUpper(getAttr(payment, "status")) !== "PAID") {
        await payment.update({ paymentChannel: "QRIS", paymentType: "QRIS_STATIC" } as any, {
          transaction: ctx.transaction,
        });
      }
    }
    return { ok: true, action: "APPLIED_QRIS_FALLBACK", idempotent: false, orderId, claimState: "CLAIMED" };
  }, input.lockTrace);
};

export const applyDuitkuReconciliation = async (input: {
  callbackInboxId: number;
  traceId?: string | null;
  lockTrace?: LockTrace;
}) =>
  applyDuitkuCallback({
    callbackInboxId: input.callbackInboxId,
    actorType: "SYSTEM",
    traceId: input.traceId,
    lockTrace: input.lockTrace,
  });
