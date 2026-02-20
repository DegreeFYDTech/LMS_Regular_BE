import express from "express";
import { authorize } from "../middlewares/authMiddleware.js";
import {
  createStatusLog,
  getCollegeStatusReports,
  getDistinctL3CounsellorsByStudentIds,
  replaceL3CounsellorForStudents,
} from "../controllers/StudentCourseStatusLogs.controller.js";
import { sentStatustoCollege } from "../controllers/Colleges_sending_logic.js";

const router = express.Router();

router.post("/sentStatustoCollege", sentStatustoCollege);

router.post(
  "/distinct-by-students",
  authorize(["Supervisor"]),
  getDistinctL3CounsellorsByStudentIds,
);

router.post(
  "/replace",
  authorize(["Supervisor"]),
  replaceL3CounsellorForStudents,
);

router.get("/reports", getCollegeStatusReports);

router.post(
  "/:courseId",
  authorize(["l2", "l3", "Supervisor", "to"]),
  createStatusLog,
);

export default router;