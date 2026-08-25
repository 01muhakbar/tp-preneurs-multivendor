import express, { Request, Response } from "express";
import requireSellerStoreAccess from "../middleware/requireSellerStoreAccess.js";
import { StoreWithdrawal } from "../models/StoreWithdrawal.js";
import {
  calculateWithdrawalBalance,
  createWithdrawalRequest,
  WithdrawalWorkflowError,
} from "../services/withdrawals/withdrawalWorkflow.service.js";

const toPositiveInteger = (value: unknown, fallback = 0): number => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const sendWorkflowError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof WithdrawalWorkflowError) {
    return res.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
    });
  }
  return res.status(500).json({ success: false, message: fallbackMessage });
};

export const listSellerWithdrawals = async (req: Request, res: Response) => {
  try {
    const storeId = toPositiveInteger(req.params.storeId);
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 10), 50);
    const offset = (page - 1) * limit;

    const { count, rows } = await StoreWithdrawal.findAndCountAll({
      where: { storeId } as any,
      order: [["requestedAt", "DESC"]],
      limit,
      offset,
    });

    const balance = await calculateWithdrawalBalance(storeId);

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page,
        limit,
        balance,
        availableBalance: balance.availableBalance,
      },
    });
  } catch (error: any) {
    console.error("List Withdrawals Error:", error);
    return sendWorkflowError(res, error, "Failed to list withdrawals");
  }
};

export const requestWithdrawal = async (req: Request, res: Response) => {
  try {
    const storeId = toPositiveInteger(req.params.storeId);
    const amount = Number(req.body?.amount);
    const actorUserId = toPositiveInteger((req as any).user?.id) || null;

    const { withdrawal, balance } = await createWithdrawalRequest({
      storeId,
      amount,
      actorUserId,
    });

    return res.status(201).json({
      success: true,
      data: withdrawal,
      meta: {
        balance,
        availableBalance: balance.availableBalance,
      },
      message: "Withdrawal request submitted successfully.",
    });
  } catch (error: any) {
    console.error("Request Withdrawal Error:", error);
    return sendWorkflowError(res, error, "Failed to request withdrawal");
  }
};

const router = express.Router();
router.get("/stores/:storeId/withdrawals", requireSellerStoreAccess(["STORE_VIEW"]), listSellerWithdrawals);
router.post("/stores/:storeId/withdrawals", requireSellerStoreAccess(["PAYMENT_PROFILE_VIEW"]), requestWithdrawal);

export default router;
