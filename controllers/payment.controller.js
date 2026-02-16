import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import { Op } from "sequelize";

export const createPayment = async (req, res) => {
    try {
        const { email, phone } = req.body;

        let student_id = null;

        // Try to link student
        if (email) {
            const student = await Student.findOne({ where: { student_email: email } });
            if (student) student_id = student.student_id;
        }

        if (!student_id && phone) {
            const student = await Student.findOne({ where: { student_phone: phone } });
            if (student) student_id = student.student_id;
        }

        const newPayment = await Payment.create({
            ...req.body,
            student_id: student_id
        });

        res.status(201).json(newPayment);
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        // Use mongo_snapshot_id to find record if needed
        const payment = await Payment.findOne({ where: { mongo_snapshot_id: id } });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.status === status) {
            return res.status(200).json({ message: "Status already updated" });
        }

        // Keep it simple as requested - just update the string status
        await payment.update({
            status: status,
            updated_at: new Date()
        });

        res.status(200).json(payment);
    } catch (error) {
        console.error("Error updating payment status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPaymentsByStudent = async (req, res) => {
    try {
        const { student_id } = req.params;
        const payments = await Payment.findAll({ where: { student_id } });
        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllPayments = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;
        const payments = await Payment.findAndCountAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });
        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching all payments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// 1. Get payments for a specific student with student details
export const getPaymentsByStudentWithDetails = async (req, res) => {
    try {
        const { student_id } = req.params;

        const payments = await Payment.findAll({
            where: { student_id },
            order: [['created_at', 'DESC']]
        });

        const student = await Student.findByPk(student_id);

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.status(200).json({
            student: {
                name: student.student_name,
                email: student.student_email,
                phone: student.student_phone,
                counsellor_id: student.assigned_counsellor_id
            },
            payments
        });
    } catch (error) {
        console.error("Error fetching student payments:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// 2. Role-based Payment Reports & Analytics
export const getPaymentReports = async (req, res) => {
    try {
        const {
            role,
            user_id, // The ID of the logged-in user (Counsellor ID)
            from_date,
            to_date,
            college_name,
            status
        } = req.query;

        let paymentWhere = {};
        let studentWhere = {};

        // Date Filtering
        if (from_date || to_date) {
            paymentWhere.created_at = {};
            if (from_date) paymentWhere.created_at[Op.gte] = new Date(from_date);
            if (to_date) paymentWhere.created_at[Op.lte] = new Date(new Date(to_date).setHours(23, 59, 59));
        }

        // Status Filtering
        if (status) {
            paymentWhere.status = status;
        }

        // College Filtering
        if (college_name) {
            paymentWhere.college_name = college_name;
        }

        // Role-based Access Control
        if (role === 'counsellor' || role === 'Counsellor') {
            // Counsellors can only see payments of students assigned to them
            if (!user_id) {
                return res.status(400).json({ message: "User ID is required for Counsellor role" });
            }
            // Filter students assigned to this counsellor
            studentWhere = {
                [Op.or]: [
                    { assigned_counsellor_id: user_id },
                    { assigned_counsellor_l3_id: user_id }
                ]
            };
        }

        // Count total initiated (matching the criteria)
        // Note: For accurate counts with association filters, we need to manually count or use careful Sequelize counting

        // Find payments and include linked student to filter by counsellor
        const payments = await Payment.findAll({
            where: paymentWhere,
            include: [{
                model: Student,
                as: 'student', // Specify the alias used in the association
                required: role === 'counsellor' || role === 'Counsellor',
                where: studentWhere,
                attributes: ['student_id', 'student_name','student_phone', 'student_email', 'assigned_counsellor_id']
            }],
            order: [['created_at', 'DESC']]
        });

        // Calculate Analytics
        const total_initiated = payments.length;
        let success_count = 0;
        let failed_count = 0;
        let pending_count = 0;
        let total_revenue = 0;

        payments.forEach(p => {
            if (p.status === 'COMPLETED' || p.status === 'PAID') {
                success_count++;
                // Sum final_amount if valid number
                const amount = p.final_amount || 0;
                total_revenue += amount;
            } else if (p.status === 'FAILED') {
                failed_count++;
            } else {
                pending_count++;
            }
        });

        res.status(200).json({
            analytics: {
                total_records: total_initiated,
                success: success_count,
                failed: failed_count,
                pending: pending_count,
                total_revenue: total_revenue
            },
            data: payments
        });

    } catch (error) {
        console.error("Error fetching payment reports:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
