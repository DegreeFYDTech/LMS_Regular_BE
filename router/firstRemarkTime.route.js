import express from "express";
import { authorize } from "../middlewares/authMiddleware.js";
import { getFirstRemarkTimeReport } from "../controllers/FirstRemarkTimeReportController.js";

const router = express.Router();

// GET /v1/first-remark-time?date_from=&date_to=&source=&source_url=&campaign=&type=summary|raw|export
// type=summary   → grouped counts per counsellor (below_15 / 15-30 / above_30 / no_remark)
// type=raw       → drill-down rows for popup (?drill_counsellor=&drill_bucket=)
// type=export    → Excel download (same filters + optional drill params)
router.get(
  "/",
  authorize(["Supervisor", "to", "to_l3", "analyser"]),
  getFirstRemarkTimeReport,
);

export default router;
