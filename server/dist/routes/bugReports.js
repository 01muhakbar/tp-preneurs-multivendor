import { Router } from "express";
import { submitBugReport } from "../controllers/bugReportController.js";
const router = Router();
// Public route to submit bug reports (rate-limited / open to users & guests)
router.post("/", submitBugReport);
export default router;
