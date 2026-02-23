import express from "express";
import {
    getPaymentsByStudent,
    getAllPayments,
    getPaymentsByStudentWithDetails,
    getPaymentReports,
    createAdmissionOrder,
    handleWebhook,
    initiateLead,
    updateLead,
    abandonLead,
    getPricingBySlug,
    validateCoupon
} from "../controllers/payment.controller.js";

const api = express.Router();

// Order & Webhook
api.post("/create-order", createAdmissionOrder);
api.post("/webhook", handleWebhook);

// Lead Management
api.post("/lead/initiate", initiateLead);
api.put("/lead/update", updateLead);
api.post("/lead/abandon", abandonLead);

api.get("/config/pricing/:pageSlug", getPricingBySlug);
api.post("/config/coupon/validate", validateCoupon);

api.get("/student/:student_id", getPaymentsByStudent);
api.get("/student-details/:student_id", getPaymentsByStudentWithDetails);
api.get("/reports", getPaymentReports);
api.get("/all", getAllPayments);

export default api;
