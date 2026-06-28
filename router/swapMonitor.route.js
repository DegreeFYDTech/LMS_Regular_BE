import express from "express";
import { authorize } from "../middlewares/authMiddleware.js";
import {
  getSwapMonitorData,
  getSwapMonitorDashboard,
  executeSwapNow,
  executeSwapSingle,
  getSwapAnalysisData,
  getSwapAnalysisFilters,
  getSwapDrilldown,
} from "../controllers/swapMonitor.controller.js";

const router = express.Router();

// Simple in-memory rate limit: max 1 execute per IP per 10 seconds
const lastCall = new Map();
const rateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  if (now - (lastCall.get(ip) || 0) < 10_000) {
    return res.status(429).json({ success: false, message: "Too many requests — wait a few seconds." });
  }
  lastCall.set(ip, now);
  next();
};

router.get("/dashboard", getSwapMonitorDashboard);

// Execute routes — actual swap operations
router.post("/execute",        rateLimit, executeSwapNow);
router.post("/execute-single", rateLimit, executeSwapSingle);

// JSON analysis endpoints — consumed by React frontend
router.get("/analysis-data",    getSwapAnalysisData);
router.get("/analysis-filters", getSwapAnalysisFilters);
router.get("/drilldown",        getSwapDrilldown);

router.get("/", getSwapMonitorData);

export default router;
