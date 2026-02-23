import express from "express";
import {
    createPayment,
    updatePaymentStatus,
    getPaymentsByStudent,
    getAllPayments,
    getPaymentsByStudentWithDetails,
    getPaymentReports,
    createAdmissionOrder,
    handleWebhook,
    initiateLead,
    updateLead,
    abandonLead
} from "../controllers/payment.controller.js";

const api = express.Router();

// Legacy / Internal UI Routes
api.post("/", createPayment);
api.get("/student/:student_id", getPaymentsByStudent);
api.get("/student-details/:student_id", getPaymentsByStudentWithDetails);
api.get("/reports", getPaymentReports);
api.put("/:id/status", updatePaymentStatus);
api.get("/", getAllPayments);

// Migrated Payment Logic Routes
api.post("/create-order", createAdmissionOrder);
api.post("/webhook", handleWebhook);

// Lead Management Routes
api.post("/lead/initiate", initiateLead);
api.put("/lead/update", updateLead);
api.post("/lead/abandon", abandonLead);

export default api;
