import axios from "axios";
import {
  sequelize,
  Payment,
  Student,
  PricingRule,
  Coupon,
  PricingSnapshot,
  PaymentOrder,
  WebhookEvent,
  StudentRemark,
  Admission,
  Registration
} from "../models/index.js";
import { Op } from "sequelize";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "placeholder_secret",
});

const getModel = (onModel) => {
  if (onModel === "registrations" || onModel === "Registration") return Registration;
  if (onModel === "admissions" || onModel === "Admission") return Admission;
  return Student;
};

const getModelName = (onModel) => {
  if (onModel === "registrations" || onModel === "Registration") return "registrations";
  if (onModel === "admissions" || onModel === "Admission") return "admissions";
  return "students";
};

export const initiateLead = async (req, res) => {
  try {
    const {
      email,
      mobile,
      fullName,
      contactNumber,
      collegeForApplied,
      onModel,
      ...rest
    } = req.body;

    const Model = getModel(onModel);
    const emailField = Model === Student ? "student_email" : "email";
    const phoneField = Model === Student ? "student_phone" : "mobile";
    const idField = Model === Student ? "student_id" : "id";

    let lead = await Model.findOne({
      where: {
        [Op.or]: [
          { [emailField]: email?.toLowerCase() || "" },
          { [phoneField]: mobile || contactNumber || "" },
        ],
      },
      order: [["updated_at", "DESC"]],
    });

    if (lead) {
      lead.updated_at = new Date();
      await lead.save();

      return res.json({
        success: true,
        leadId: lead[idField],
        reused: true,
        message: `Existing ${onModel || 'lead'} reused`,
      });
    }

    const newLeadData = {
      ...rest,
      [Model === Student ? "student_name" : "name"]: fullName,
      [phoneField]: mobile || contactNumber,
      [emailField]: email?.toLowerCase(),
      [Model === Student ? "preferred_university" : "collegeForApplied"]: Model === Student ? [collegeForApplied] : collegeForApplied,
      [Model === Student ? "first_source_url" : "pageUrl"]: req.body.pageUrl,
      paymentStatus: "PENDING",
    };

    const newEntry = await Model.create(newLeadData);

    return res.json({
      success: true,
      leadId: newEntry[idField],
      reused: false,
      message: `New ${onModel || 'lead'} initiated`,
    });
  } catch (error) {
    console.error("Lead Initiation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLead = async (req, res) => {
  try {
    const { leadId, onModel, formData } = req.body;

    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    const Model = getModel(onModel);
    const lead = await Model.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({ success: false, message: "Lead not found" });
    }

    // Mapping for Student vs Admission/Registration
    if (Model === Student) {
      if (formData.fullName) lead.student_name = formData.fullName;
      if (formData.contactNumber) lead.student_phone = formData.contactNumber;
      if (formData.email) lead.student_email = formData.email?.toLowerCase();
    } else {
      if (formData.fullName) lead.name = formData.fullName;
      if (formData.contactNumber) lead.mobile = formData.contactNumber;
      if (formData.email) lead.email = formData.email?.toLowerCase();
    }

    const safeFields = Model === Student ? [
      "highest_degree", "completion_year", "current_profession", "current_role",
      "work_experience", "student_age", "objective", "mode", "preferred_stream",
      "preferred_budget", "preferred_degree", "preferred_level", "preferred_specialization",
      "preferred_city", "preferred_state", "preferred_university"
    ] : [
      "alternateNumber", "gender", "dob", "state", "city", "address",
      "fatherName", "fatherPhone", "fatherOccupation", "fatherEmail",
      "campusLocation", "interestedCourse", "specialization", "lastQualification",
      "lastQualificationPercentage", "collegeForApplied"
    ];

    safeFields.forEach((field) => {
      if (formData[field] !== undefined) lead[field] = formData[field];
    });

    lead.updated_at = new Date();
    await lead.save();

    res.json({ success: true, message: "Lead updated" });
  } catch (error) {
    console.error("Lead Update Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const abandonLead = async (req, res) => {
  try {
    const { leadId, onModel } = req.body;
    if (!leadId) {
      return res.status(400).json({ success: false, message: "leadId is required" });
    }

    const Model = getModel(onModel);
    const lead = await Model.findByPk(leadId);
    if (!lead) return res.status(404).json({ success: false, message: "Lead not found" });

    lead.paymentStatus = "FAILED";
    await lead.save();

    res.json({ success: true, message: "Lead marked as abandoned" });
  } catch (error) {
    console.error("Lead Abandon Error:", error);
    res.status(200).json({ success: false, message: error.message });
  }
};

export const createAdmissionOrder = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      email,
      mobile,
      collegeForApplied,
      pageSlug,
      couponCode,
      paymentFor,
      onModel,
      leadId,
    } = req.body;

    if (!pageSlug) throw new Error("Page identifier (pageSlug) is required");

    const pricingRule = await PricingRule.findOne({
      where: { pageSlug, isActive: true },
      transaction,
    });
    if (!pricingRule) throw new Error("Pricing configuration invalid");

    let finalAmount = parseFloat(pricingRule.baseAmount);
    let discountAmount = 0;
    let appliedCoupon = null;

    if (couponCode && pricingRule.allowCoupons) {
      const coupon = await Coupon.findOne({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          validTill: { [Op.gte]: new Date() },
        },
        transaction,
      });

      if (coupon) {
        if (coupon.usedCount < coupon.usageLimitGlobal) {
          if (coupon.discountType === "FLAT") {
            discountAmount = parseFloat(coupon.discountValue);
          } else {
            discountAmount = (finalAmount * parseFloat(coupon.discountValue)) / 100;
            if (coupon.maxDiscountAmount)
              discountAmount = Math.min(discountAmount, parseFloat(coupon.maxDiscountAmount));
          }
          discountAmount = Math.min(discountAmount, finalAmount);
          finalAmount -= discountAmount;
          appliedCoupon = coupon.code;
        }
      }
    }

    const Model = getModel(onModel);
    const idField = Model === Student ? "student_id" : "id";
    let lead;

    if (leadId) {
      lead = await Model.findByPk(leadId, { transaction });
    }

    if (!lead) {
      const leadData = Model === Student ? {
        student_email: email?.toLowerCase(),
        student_phone: mobile,
        preferred_university: collegeForApplied ? [collegeForApplied] : [],
        ...req.body
      } : {
        email: email?.toLowerCase(),
        mobile: mobile,
        collegeForApplied: collegeForApplied,
        name: req.body.fullName,
        ...req.body
      };
      lead = await Model.create(leadData, { transaction });
    }

    const snapshot = await PricingSnapshot.create({
      admissionId: lead[idField],
      onModel: getModelName(onModel),
      paymentFor: paymentFor || "admission",
      baseAmount: pricingRule.baseAmount,
      appliedCouponCode: appliedCoupon,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      currency: pricingRule.currency,
      status: "LOCKED",
    }, { transaction });

    const options = {
      amount: Math.round(finalAmount * 100),
      currency: pricingRule.currency,
      receipt: lead[idField].toString(),
      notes: {
        snapshot_id: snapshot.id.toString(),
        lead_id: lead[idField].toString(),
        on_model: getModelName(onModel)
      },
    };

    const order = await razorpay.orders.create(options);

    snapshot.razorpayOrderId = order.id;
    await snapshot.save({ transaction });

    await PaymentOrder.create({
      pricingSnapshotId: snapshot.id,
      razorpayOrderId: order.id,
      amount: finalAmount,
      amountDue: finalAmount,
      currency: pricingRule.currency,
      status: order.status,
    }, { transaction });

    // legacy Payment record
    await Payment.create({
      student_id: Model === Student ? lead.student_id : null,
      college_name: collegeForApplied,
      course_name: req.body.interestedCourse,
      status: "PENDING",
      payment_for: paymentFor || "admission",
      base_amount: pricingRule.baseAmount,
      final_amount: finalAmount,
      couponCode: appliedCoupon,
      discount_amount: discountAmount,
      currency: pricingRule.currency,
      razorpay_order_id: order.id,
      mongo_snapshot_id: snapshot.id.toString(),
    }, { transaction });

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: {
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        key_id: process.env.RAZORPAY_KEY_ID,
        name: pricingRule.collegeName || "Nuvora Education",
        description: `Admission Fee for ${req.body.interestedCourse || 'Course'}`,
        prefill: {
          name: Model === Student ? lead.student_name : lead.name,
          email: Model === Student ? lead.student_email : lead.email,
          contact: Model === Student ? lead.student_phone : lead.mobile,
        },
      },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Order Creation Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const handleWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const body = JSON.stringify(req.body);

  if (secret) {
    const expectedSignature = crypto.createHmac("sha256", secret).update(body).digest("hex");
    if (expectedSignature !== signature) {
      return res.status(400).json({ status: "failure", message: "Invalid Signature" });
    }
  }

  const { event, payload } = req.body;
  const eventId = req.headers["x-razorpay-event-id"];

  const existingEvent = await WebhookEvent.findOne({ where: { eventId } });
  if (existingEvent) return res.status(200).json({ status: "success", message: "Event already processed" });

  const webhookEvent = await WebhookEvent.create({
    eventId, eventType: event, payload: payload, status: "PENDING",
  });

  const transaction = await sequelize.transaction();
  try {
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const paymentOrder = await PaymentOrder.findOne({
        where: { razorpayOrderId: orderId },
        transaction,
      });

      if (paymentOrder) {
        paymentOrder.status = "PAID";
        paymentOrder.amountPaid = paymentEntity.amount / 100;
        paymentOrder.amountDue = 0;

        const currentPayments = Array.isArray(paymentOrder.payments) ? paymentOrder.payments : [];
        currentPayments.push({
          razorpayPaymentId: paymentEntity.id,
          status: paymentEntity.status,
          method: paymentEntity.method,
          email: paymentEntity.email,
          contact: paymentEntity.contact,
          createdAt: new Date(),
        });
        paymentOrder.payments = currentPayments;
        await paymentOrder.save({ transaction });

        const snapshot = await PricingSnapshot.findByPk(paymentOrder.pricingSnapshotId, { transaction });
        if (snapshot) {
          snapshot.status = "PAID";
          await snapshot.save({ transaction });

          const Model = getModel(snapshot.onModel);
          const idField = Model === Student ? "student_id" : "id";
          const lead = await Model.findByPk(snapshot.admissionId, { transaction });

          if (lead) {
            lead.paymentStatus = "COMPLETED";
            if (Model !== Student) lead.UTRNumber = paymentEntity.id;
            await lead.save({ transaction });

            const legacyPayment = await Payment.findOne({
              where: { mongo_snapshot_id: snapshot.id.toString() },
              transaction,
            });
            if (legacyPayment) {
              await legacyPayment.update({ status: "COMPLETED", updated_at: new Date() }, { transaction });
            }

            const studentId = Model === Student ? lead.student_id : null;
            if (studentId) {
              await StudentRemark.create({
                student_id: studentId,
                lead_status: snapshot.paymentFor === "admission" ? "Admission" : "Application",
                lead_sub_status: snapshot.paymentFor === "admission" ? "Partially Paid" : "Form Filled_Degreefyd",
                calling_status: "Connected",
                sub_calling_status: "Warm",
                remarks: `Payment of amount ${snapshot.finalAmount} completed successfully. Payment ID: ${paymentEntity.id}`,
                fees: snapshot.finalAmount,
                created_at: new Date(),
              }, { transaction });
            }
          }

          if (snapshot.appliedCouponCode) {
            await Coupon.increment("usedCount", {
              by: 1,
              where: { code: snapshot.appliedCouponCode },
              transaction,
            });
          }
        }
      }
    } else if (event === "payment.failed") {
      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const paymentOrder = await PaymentOrder.findOne({
        where: { razorpayOrderId: orderId },
        transaction,
      });

      if (paymentOrder) {
        paymentOrder.status = "FAILED";
        paymentOrder.attempts += 1;
        const currentPayments = Array.isArray(paymentOrder.payments) ? paymentOrder.payments : [];
        currentPayments.push({
          razorpayPaymentId: paymentEntity.id,
          status: paymentEntity.status,
          method: paymentEntity.method,
          email: paymentEntity.email,
          contact: paymentEntity.contact,
          createdAt: new Date(),
          error_code: paymentEntity.error_code,
          error_description: paymentEntity.error_description,
        });
        paymentOrder.payments = currentPayments;
        await paymentOrder.save({ transaction });

        const snapshot = await PricingSnapshot.findByPk(paymentOrder.pricingSnapshotId, { transaction });
        if (snapshot) {
          snapshot.status = "FAILED";
          await snapshot.save({ transaction });
          const legacyPayment = await Payment.findOne({
            where: { mongo_snapshot_id: snapshot.id.toString() },
            transaction,
          });
          if (legacyPayment && legacyPayment.status !== "COMPLETED") {
            await legacyPayment.update({ status: "FAILED" }, { transaction });
          }
        }
      }
    }

    webhookEvent.status = "PROCESSED";
    webhookEvent.processedAt = new Date();
    await webhookEvent.save({ transaction });

    await transaction.commit();
    res.status(200).json({ status: "success" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error("Webhook processing error:", error);
    webhookEvent.status = "FAILED";
    webhookEvent.errorLog = error.message;
    await webhookEvent.save();
    res.status(500).json({ status: "failure", message: error.message });
  }
};

// Legacy UI Helper Functions
export const createPayment = async (req, res) => {
  try {
    const { email, phone } = req.body;
    let student_id = null;
    if (email) {
      const student = await Student.findOne({ where: { student_email: email } });
      if (student) student_id = student.student_id;
    }
    if (!student_id && phone) {
      const student = await Student.findOne({ where: { student_phone: phone } });
      if (student) student_id = student.student_id;
    }
    const newPayment = await Payment.create({ ...req.body, student_id: student_id });
    res.status(201).json(newPayment);
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const payment = await Payment.findOne({ where: { mongo_snapshot_id: id } });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    await payment.update({ status: status, updated_at: new Date() });
    res.status(200).json(payment);
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const getPaymentsByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const payments = await Payment.findAll({ where: { student_id } });
    res.status(200).json(payments);
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const payments = await Payment.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(payments);
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const getPaymentsByStudentWithDetails = async (req, res) => {
  try {
    const { student_id } = req.params;
    const payments = await Payment.findAll({ where: { student_id }, order: [["created_at", "DESC"]] });
    const student = await Student.findByPk(student_id);
    res.status(200).json({ student, payments });
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const getPaymentReports = async (req, res) => {
  try {
    const payments = await Payment.findAll({ order: [["created_at", "DESC"]] });
    res.status(200).json(payments);
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};
