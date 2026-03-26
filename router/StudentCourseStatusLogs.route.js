import express from "express";
import { authorize } from "../middlewares/authMiddleware.js";
import {
  createStatusLog,
  getCollegeStatusReports,
  getCounsellorStats,
  getDistinctL3CounsellorsByStudentIds,
  getFormToAdmissionsReport,
  getStudentJourneyDetails,
  replaceL3CounsellorForSpecificJourney,
  replaceL3CounsellorForStudents,
  getFormData,
} from "../controllers/StudentCourseStatusLogs.controller.js";
import { sentStatustoCollege } from "../controllers/Colleges_sending_logic.js";

const router = express.Router();

router.post("/sentStatustoCollege", sentStatustoCollege);
router.get("/get-forms-data", getFormData);
router.post(
  "/distinct-by-students",
  authorize(["Supervisor", "to", "to_l3"]),
  getDistinctL3CounsellorsByStudentIds,
);
router.get(
  "/counsellor-stats",
  authorize(["Supervisor", "to", "to_l3"]),
  getCounsellorStats,
);
router.use("/course-reports", getFormToAdmissionsReport);

// Add these routes to your counsellor routes file
router.post(
  "/student-journey-details",
  authorize(["Supervisor", "to", "to_l3"]),
  getStudentJourneyDetails,
);
router.post(
  "/replace-l3-specific-journey",
  replaceL3CounsellorForSpecificJourney,
);
router.post(
  "/replace",
  authorize(["Supervisor", "to", "to_l3"]),
  replaceL3CounsellorForStudents,
);

router.get("/reports", getCollegeStatusReports);

router.post(
  "/:courseId",
  authorize(["l2", "l3", "Supervisor", "to", "to_l3"]),
  createStatusLog,
);

export default router;
