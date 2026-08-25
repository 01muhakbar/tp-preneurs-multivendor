import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { StoreWithdrawal } from "../models/StoreWithdrawal.js";
import { Store } from "../models/Store.js";
import {
  calculateWithdrawalBalance,
  transitionWithdrawalStatus,
  WithdrawalStatus,
  WithdrawalWorkflowError,
} from "../services/withdrawals/withdrawalWorkflow.service.js";

const VALID_FILTER_STATUSES = new Set(["PENDING", "PROCESSING", "COMPLETED", "REJECTED"]);
const WITHDRAWAL_PROOF_UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "withdrawals");
const MAX_PROOF_UPLOAD_BYTES = 3 * 1024 * 1024;
const ALLOWED_PROOF_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

fs.mkdirSync(WITHDRAWAL_PROOF_UPLOAD_DIR, { recursive: true });

const proofUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, WITHDRAWAL_PROOF_UPLOAD_DIR),
    filename: (req, file, cb) => {
      const withdrawalId = toPositiveInteger(req.params.id) || "unknown";
      const extension = path.extname(file.originalname || "").toLowerCase();
      const safeExtension = [".jpg", ".jpeg", ".png", ".webp"].includes(extension) ? extension : "";
      const name = `withdrawal-${withdrawalId}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExtension}`;
      cb(null, name);
    },
  }),
  limits: { fileSize: MAX_PROOF_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_PROOF_MIME_TYPES.has(String(file.mimetype || "").toLowerCase())) {
      cb(new Error("Only .jpeg, .png, and .webp files are allowed."));
      return;
    }
    cb(null, true);
  },
});

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

const listWithdrawals = async (req: Request, res: Response) => {
  try {
    const page = toPositiveInteger(req.query.page, 1);
    const limit = Math.min(toPositiveInteger(req.query.limit, 20), 100);
    const offset = (page - 1) * limit;
    const status = String(req.query.status || "").trim().toUpperCase();
    const whereClause: any = {};

    if (status) {
      if (!VALID_FILTER_STATUSES.has(status)) {
        return res.status(400).json({
          success: false,
          code: "INVALID_WITHDRAWAL_STATUS_FILTER",
          message: "Invalid withdrawal status filter.",
        });
      }
      whereClause.status = status;
    }

    const { count, rows } = await StoreWithdrawal.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Store,
          as: "store",
          attributes: ["id", "name", "slug"],
        },
      ],
      order: [["requestedAt", "DESC"]],
      limit,
      offset,
    });

    return res.status(200).json({
      success: true,
      data: rows,
      meta: {
        total: count,
        page,
        limit,
      },
    });
  } catch (error: any) {
    console.error("List Admin Withdrawals Error:", error);
    return sendWorkflowError(res, error, "Failed to list withdrawals");
  }
};

const updateWithdrawalStatus = async (req: Request, res: Response) => {
  try {
    const id = toPositiveInteger(req.params.id);
    const actorUserId = toPositiveInteger((req as any).user?.id) || null;
    const status = String(req.body?.status || "").trim().toUpperCase() as WithdrawalStatus;

    const withdrawal = await transitionWithdrawalStatus({
      withdrawalId: id,
      status,
      adminNote: req.body?.adminNote,
      proofImageUrl: req.body?.proofImageUrl,
      actorUserId,
    });
    const balance = await calculateWithdrawalBalance(Number((withdrawal as any).storeId || 0));

    return res.status(200).json({
      success: true,
      data: withdrawal,
      meta: {
        balance,
        availableBalance: balance.availableBalance,
      },
      message: `Withdrawal updated to ${status}.`,
    });
  } catch (error: any) {
    console.error("Update Withdrawal Status Error:", error);
    return sendWorkflowError(res, error, "Failed to update withdrawal status");
  }
};

const uploadWithdrawalProof = async (req: Request, res: Response) => {
  const withdrawalId = toPositiveInteger(req.params.id);
  if (!withdrawalId) {
    return res.status(400).json({
      success: false,
      code: "INVALID_WITHDRAWAL_ID",
      message: "Invalid withdrawal id.",
    });
  }

  const withdrawal = await StoreWithdrawal.findByPk(withdrawalId);
  if (!withdrawal) {
    return res.status(404).json({
      success: false,
      code: "WITHDRAWAL_NOT_FOUND",
      message: "Withdrawal not found.",
    });
  }
  if (["COMPLETED", "REJECTED"].includes(String((withdrawal as any).status || ""))) {
    return res.status(400).json({
      success: false,
      code: "WITHDRAWAL_FINAL_STATUS_LOCKED",
      message: "Cannot upload transfer proof for a completed or rejected withdrawal.",
    });
  }

  proofUpload.single("file")(req, res, (error: any) => {
    if (error) {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          code: "WITHDRAWAL_PROOF_TOO_LARGE",
          message: "Transfer proof image is too large (max 3MB).",
        });
      }
      return res.status(400).json({
        success: false,
        code: "INVALID_WITHDRAWAL_PROOF_UPLOAD",
        message: error?.message || "Invalid transfer proof upload.",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: "WITHDRAWAL_PROOF_REQUIRED",
        message: "Transfer proof image is required.",
      });
    }

    const proofImageUrl = `/uploads/withdrawals/${req.file.filename}`;
    return res.status(201).json({
      success: true,
      data: {
        proofImageUrl,
        filename: req.file.filename,
      },
      message: "Transfer proof uploaded successfully.",
    });
  });
};

const router = express.Router();
router.get("/", listWithdrawals);
router.post("/:id/proof", uploadWithdrawalProof);
router.put("/:id/status", updateWithdrawalStatus);

export default router;
