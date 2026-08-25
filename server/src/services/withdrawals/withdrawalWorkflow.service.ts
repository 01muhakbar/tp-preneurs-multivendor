import { Op, Transaction } from "sequelize";
import {
  sequelize,
  StoreAuditLog,
  StorePaymentProfile,
  StoreWithdrawal,
  Suborder,
} from "../../models/index.js";
import { buildWithdrawalEligibilityMeta } from "./withdrawalEligibility.service.js";

export type WithdrawalStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";

type BalanceOptions = {
  transaction?: Transaction;
  lock?: any;
};

type WithdrawalActionInput = {
  actorUserId?: number | null;
};

type CreateWithdrawalInput = WithdrawalActionInput & {
  storeId: number;
  amount: number;
};

type TransitionWithdrawalInput = WithdrawalActionInput & {
  withdrawalId: number;
  status: WithdrawalStatus;
  adminNote?: string | null;
  proofImageUrl?: string | null;
};

export const WITHDRAWAL_ADMIN_FEE_AMOUNT = 6500;

const NON_REJECTED_STATUSES: WithdrawalStatus[] = ["PENDING", "PROCESSING", "COMPLETED"];
const FINAL_STATUSES: WithdrawalStatus[] = ["COMPLETED", "REJECTED"];
const ALLOWED_TRANSITIONS: Record<WithdrawalStatus, WithdrawalStatus[]> = {
  PENDING: ["PROCESSING", "REJECTED"],
  PROCESSING: ["COMPLETED", "REJECTED"],
  COMPLETED: [],
  REJECTED: [],
};

export class WithdrawalWorkflowError extends Error {
  public statusCode: number;
  public code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "WithdrawalWorkflowError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const toNumber = (value: unknown): number => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const toPositiveInteger = (value: unknown): number => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
};

const getAttr = (model: any, key: string): any =>
  model?.getDataValue?.(key) ?? model?.get?.(key) ?? model?.[key] ?? null;

const normalizeText = (value: unknown) => String(value || "").trim();

const normalizeStatus = (value: unknown): WithdrawalStatus | null => {
  const status = String(value || "").trim().toUpperCase();
  if (["PENDING", "PROCESSING", "COMPLETED", "REJECTED"].includes(status)) {
    return status as WithdrawalStatus;
  }
  return null;
};

const snapshotWithdrawal = (withdrawal: any) => {
  const plain = typeof withdrawal?.get === "function" ? withdrawal.get({ plain: true }) : withdrawal;
  return {
    id: Number(plain?.id || 0),
    storeId: Number(plain?.storeId || 0),
    amount: toNumber(plain?.amount),
    adminFeeAmount: toNumber(plain?.adminFeeAmount),
    netTransferAmount: toNumber(plain?.netTransferAmount),
    status: String(plain?.status || ""),
    bankName: plain?.bankName || null,
    accountName: plain?.accountName || null,
    accountNumber: plain?.accountNumber || null,
    proofImageUrl: plain?.proofImageUrl || null,
    adminNote: plain?.adminNote || null,
    requestedAt: plain?.requestedAt || null,
    processedAt: plain?.processedAt || null,
  };
};

const writeWithdrawalAudit = async ({
  storeId,
  actorUserId,
  action,
  beforeState,
  afterState,
  transaction,
}: {
  storeId: number;
  actorUserId?: number | null;
  action: string;
  beforeState?: any;
  afterState?: any;
  transaction?: Transaction;
}) => {
  await StoreAuditLog.create(
    {
      storeId,
      actorUserId: actorUserId || null,
      action,
      beforeState: beforeState ? JSON.stringify(beforeState) : null,
      afterState: afterState ? JSON.stringify(afterState) : null,
    } as any,
    { transaction }
  );
};

export const calculateWithdrawalBalance = async (storeIdInput: number, options: BalanceOptions = {}) => {
  const storeId = toPositiveInteger(storeIdInput);
  if (!storeId) {
    throw new WithdrawalWorkflowError(400, "INVALID_STORE_ID", "Invalid store id.");
  }

  const paidSuborders = await Suborder.findAll({
    where: {
      storeId,
      paymentStatus: "PAID",
      fulfillmentStatus: { [Op.ne]: "CANCELLED" },
    } as any,
    attributes: ["id", "totalAmount", "serviceFeeAmount", "paymentStatus", "fulfillmentStatus"],
    transaction: options.transaction,
    lock: options.lock,
  } as any);

  const eligibilityRows = paidSuborders.map((suborder) =>
    buildWithdrawalEligibilityMeta({
      paymentStatus: getAttr(suborder, "paymentStatus"),
      fulfillmentStatus: getAttr(suborder, "fulfillmentStatus"),
      totalAmount: getAttr(suborder, "totalAmount"),
      serviceFeeAmount: getAttr(suborder, "serviceFeeAmount"),
    })
  );
  const deliveredSuborders = paidSuborders.filter(
    (suborder) => buildWithdrawalEligibilityMeta({
      paymentStatus: getAttr(suborder, "paymentStatus"),
      fulfillmentStatus: getAttr(suborder, "fulfillmentStatus"),
      totalAmount: getAttr(suborder, "totalAmount"),
      serviceFeeAmount: getAttr(suborder, "serviceFeeAmount"),
    }).code === "ELIGIBLE"
  );

  const grossEligibleAmount = deliveredSuborders.reduce(
    (sum, suborder) => sum + toNumber(getAttr(suborder, "totalAmount")),
    0
  );
  const serviceFeeAmount = deliveredSuborders.reduce(
    (sum, suborder) => sum + toNumber(getAttr(suborder, "serviceFeeAmount")),
    0
  );
  const netEligibleAmount = Math.max(0, grossEligibleAmount - serviceFeeAmount);

  const withdrawals = await StoreWithdrawal.findAll({
    where: {
      storeId,
      status: { [Op.in]: NON_REJECTED_STATUSES },
    } as any,
    attributes: ["id", "amount", "status"],
    transaction: options.transaction,
    lock: options.lock,
  } as any);

  const totalsByStatus = withdrawals.reduce(
    (totals, withdrawal: any) => {
      const status = normalizeStatus(getAttr(withdrawal, "status"));
      const amount = toNumber(getAttr(withdrawal, "amount"));
      if (status === "PENDING") totals.pendingWithdrawalAmount += amount;
      if (status === "PROCESSING") totals.processingWithdrawalAmount += amount;
      if (status === "COMPLETED") totals.completedWithdrawalAmount += amount;
      return totals;
    },
    {
      pendingWithdrawalAmount: 0,
      processingWithdrawalAmount: 0,
      completedWithdrawalAmount: 0,
    }
  );

  const reservedWithdrawalAmount =
    totalsByStatus.pendingWithdrawalAmount +
    totalsByStatus.processingWithdrawalAmount +
    totalsByStatus.completedWithdrawalAmount;

  return {
    storeId,
    grossEligibleAmount,
    serviceFeeAmount,
    netEligibleAmount,
    paidSuborderCount: paidSuborders.length,
    waitingDeliveryCount: eligibilityRows.filter((row) => row.code === "WAITING_DELIVERY").length,
    deliveredEligibleCount: eligibilityRows.filter((row) => row.code === "ELIGIBLE").length,
    blockedCount: eligibilityRows.filter((row) => row.code === "BLOCKED").length,
    ...totalsByStatus,
    reservedWithdrawalAmount,
    availableBalance: Math.max(0, netEligibleAmount - reservedWithdrawalAmount),
    withdrawalAdminFeeAmount: WITHDRAWAL_ADMIN_FEE_AMOUNT,
  };
};

export const createWithdrawalRequest = async ({
  storeId: storeIdInput,
  amount: amountInput,
  actorUserId,
}: CreateWithdrawalInput) => {
  const storeId = toPositiveInteger(storeIdInput);
  const amount = toNumber(amountInput);

  if (!storeId) {
    throw new WithdrawalWorkflowError(400, "INVALID_STORE_ID", "Invalid store id.");
  }
  if (!Number.isFinite(amount) || amount < 50000) {
    throw new WithdrawalWorkflowError(400, "WITHDRAWAL_MINIMUM_NOT_MET", "Minimum withdrawal amount is Rp 50.000.");
  }

  return sequelize.transaction(async (transaction) => {
    const balance = await calculateWithdrawalBalance(storeId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (amount > balance.availableBalance) {
      throw new WithdrawalWorkflowError(
        400,
        "INSUFFICIENT_WITHDRAWAL_BALANCE",
        `Insufficient balance. Available: Rp ${new Intl.NumberFormat("id-ID").format(balance.availableBalance)}.`
      );
    }

    const paymentProfile = await StorePaymentProfile.findOne({
      where: { storeId, isActive: true } as any,
      transaction,
      lock: transaction.LOCK.UPDATE,
    } as any);

    if (!paymentProfile) {
      throw new WithdrawalWorkflowError(
        400,
        "ACTIVE_PAYMENT_PROFILE_REQUIRED",
        "Store does not have an active payment profile."
      );
    }

    const bankName = normalizeText(getAttr(paymentProfile, "bankName"));
    const accountName = normalizeText(
      getAttr(paymentProfile, "accountHolderName") || getAttr(paymentProfile, "accountName")
    );
    const accountNumber = normalizeText(
      getAttr(paymentProfile, "accountNumber") || getAttr(paymentProfile, "merchantId")
    );

    if (!bankName || !accountName || !accountNumber) {
      throw new WithdrawalWorkflowError(
        400,
        "PAYOUT_BANK_ACCOUNT_REQUIRED",
        "Complete payout bank name, account holder, and account number before requesting withdrawal."
      );
    }

    const withdrawal = await StoreWithdrawal.create(
      {
        storeId,
        amount,
        adminFeeAmount: WITHDRAWAL_ADMIN_FEE_AMOUNT,
        netTransferAmount: Math.max(0, amount - WITHDRAWAL_ADMIN_FEE_AMOUNT),
        status: "PENDING",
        bankName,
        accountName,
        accountNumber,
      } as any,
      { transaction }
    );

    await writeWithdrawalAudit({
      storeId,
      actorUserId,
      action: "WITHDRAWAL_REQUESTED",
      afterState: snapshotWithdrawal(withdrawal),
      transaction,
    });

    const updatedBalance = await calculateWithdrawalBalance(storeId, { transaction });
    return { withdrawal, balance: updatedBalance };
  });
};

export const transitionWithdrawalStatus = async ({
  withdrawalId: withdrawalIdInput,
  status: statusInput,
  adminNote,
  proofImageUrl,
  actorUserId,
}: TransitionWithdrawalInput) => {
  const withdrawalId = toPositiveInteger(withdrawalIdInput);
  const status = normalizeStatus(statusInput);

  if (!withdrawalId) {
    throw new WithdrawalWorkflowError(400, "INVALID_WITHDRAWAL_ID", "Invalid withdrawal id.");
  }
  if (!status || status === "PENDING") {
    throw new WithdrawalWorkflowError(400, "INVALID_WITHDRAWAL_STATUS", "Invalid withdrawal status.");
  }

  return sequelize.transaction(async (transaction) => {
    const withdrawal = await StoreWithdrawal.findByPk(withdrawalId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    } as any);

    if (!withdrawal) {
      throw new WithdrawalWorkflowError(404, "WITHDRAWAL_NOT_FOUND", "Withdrawal not found.");
    }

    const currentStatus = normalizeStatus(getAttr(withdrawal, "status"));
    if (!currentStatus) {
      throw new WithdrawalWorkflowError(400, "INVALID_CURRENT_STATUS", "Withdrawal has an invalid current status.");
    }
    if (FINAL_STATUSES.includes(currentStatus)) {
      throw new WithdrawalWorkflowError(
        400,
        "WITHDRAWAL_FINAL_STATUS_LOCKED",
        "Cannot change status of completed or rejected withdrawal."
      );
    }
    if (!ALLOWED_TRANSITIONS[currentStatus].includes(status)) {
      throw new WithdrawalWorkflowError(
        400,
        "WITHDRAWAL_STATUS_TRANSITION_NOT_ALLOWED",
        `Cannot change withdrawal from ${currentStatus} to ${status}.`
      );
    }

    const normalizedAdminNote = String(adminNote || "").trim();
    const normalizedProofImageUrl = String(proofImageUrl || "").trim();
    if (status === "REJECTED" && !normalizedAdminNote) {
      throw new WithdrawalWorkflowError(400, "WITHDRAWAL_REJECTION_NOTE_REQUIRED", "Admin note is required when rejecting a withdrawal.");
    }
    if (status === "COMPLETED" && !normalizedProofImageUrl) {
      throw new WithdrawalWorkflowError(400, "WITHDRAWAL_TRANSFER_PROOF_REQUIRED", "Transfer proof is required when completing a withdrawal.");
    }

    const beforeState = snapshotWithdrawal(withdrawal);
    await withdrawal.update(
      {
        status,
        adminNote: normalizedAdminNote || getAttr(withdrawal, "adminNote") || null,
        proofImageUrl: normalizedProofImageUrl || getAttr(withdrawal, "proofImageUrl") || null,
        processedAt: FINAL_STATUSES.includes(status) ? new Date() : getAttr(withdrawal, "processedAt"),
      } as any,
      { transaction }
    );

    await writeWithdrawalAudit({
      storeId: toPositiveInteger(getAttr(withdrawal, "storeId")),
      actorUserId,
      action: `WITHDRAWAL_${status}`,
      beforeState,
      afterState: snapshotWithdrawal(withdrawal),
      transaction,
    });

    return withdrawal;
  });
};
