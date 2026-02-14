import express from "express";
import {
    createPayment,
    updatePaymentStatus,
    getPaymentsByStudent,
    getAllPayments,
    getPaymentsByStudentWithDetails,
    getPaymentReports
} from "../controllers/payment.controller.js";

const api = express.Router();

api.post("/", createPayment);
api.get("/student/:student_id", getPaymentsByStudent);
api.get("/student-details/:student_id", getPaymentsByStudentWithDetails); // New
api.get("/reports", getPaymentReports); // New
api.put("/:id/status", updatePaymentStatus);
api.get("/", getAllPayments);

export default api;
