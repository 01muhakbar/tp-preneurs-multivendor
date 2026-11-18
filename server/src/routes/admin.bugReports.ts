import { Router } from "express";
import {
  listBugReports,
  getBugReportDetail,
  updateBugReportStatus,
  resolveBugReport,
} from "../controllers/admin/adminBugReportsController.js";

const router = Router();

router.get("/", listBugReports);
router.get("/:id", getBugReportDetail);
router.patch("/:id/status", updateBugReportStatus);
router.post("/:id/resolve", resolveBugReport);

export default router;
