import express from "express";
import { authorize } from "../middlewares/authMiddleware.js";
import {
  createStudent,
  updateStudentStatus,
  findByContact,
  getStudentById,
  studentWindowOpenByCounsellor,
  updateStudentDetails,
  bulkReassignLeads,
  bulkCreateLeads,
  addLeadDirect,
  getAllLeadsofDatatest,
  bulkCreateStudents,
  markWalkin,
} from "../controllers/student.controller.js";
import { exportStudentsCSV } from "../controllers/exports/leads_csv_export.js";
import { getStudents } from "../controllers/students.table.js";
import { bearerAuth } from "../middlewares/bearerAuthMiddleware.js";
const router = express.Router();
router.get(
  "/",
  authorize(["l2", "l3", "supervisor", "Supervisor", "to", "analyser", "to_l3"]),
  getStudents,
);
router.get(
  "/studentWindowOpenByCounsellor",
  authorize(["l2", "l3"]),
  studentWindowOpenByCounsellor,
);

router.post("/create", createStudent);
router.post("/create-student", bearerAuth, createStudent);
router.post("/mark-walkin",   authorize(["l2", "l3", "supervisor", "Supervisor", "to", "analyser", "to_l3"]), markWalkin);

router.get(
  "/export",
  authorize(["supervisor", "Supervisor", "analyser"]),
  exportStudentsCSV,
);
router.get("/getDataTolooker", getAllLeadsofDatatest);
router.post("/findByContact", findByContact);

router.get(
  "/:id",
  authorize(["l2", "l3", "supervisor", "Supervisor", "to", "analyser", "to_l3"]),
  getStudentById,
);
router.put(
  "/updateStudentStatus/:studentId",
  authorize(["l2", "l3", "to", "supervisor", "Supervisor", "to_l3"]),
  updateStudentStatus,
);
router.put(
  "/updateStudentDetails/:studentId",
  authorize(["l2", "l3", "to", "supervisor", "Supervisor", "to_l3"]),
  updateStudentDetails,
);
router.post(
  "/bulkReassign",
  authorize(["Supervisor", "to", "to_l3"]),
  bulkReassignLeads,
);
router.post("/bulkCreate", authorize(["Supervisor", "to", "to_l3"]), bulkCreateLeads);
router.post(
  "/addLeadDirect",
  authorize(["l2", "l3", "to", "Supervisor", "to_l3"]),
  addLeadDirect,
);
router.post("/bulk-transfer", bulkCreateStudents);

export default router;
