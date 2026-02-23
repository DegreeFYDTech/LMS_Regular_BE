import axios from "axios";
import {
  sequelize,
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
      lastQualificationPercentage: (req.body.lastQualificationPercentage === "" || req.body.lastQualificationPercentage === undefined) ? null : req.body.lastQualificationPercentage,
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

    if (formData.lastQualificationPercentage === "") lead.lastQualificationPercentage = null;

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
        ...req.body,
        lastQualificationPercentage: (req.body.lastQualificationPercentage === "" || req.body.lastQualificationPercentage === undefined) ? null : req.body.lastQualificationPercentage,
      } : {
        email: email?.toLowerCase(),
        mobile: mobile,
        collegeForApplied: collegeForApplied,
        name: req.body.fullName,
        ...req.body,
        lastQualificationPercentage: (req.body.lastQualificationPercentage === "" || req.body.lastQualificationPercentage === undefined) ? null : req.body.lastQualificationPercentage,
      };
      lead = await Model.create(leadData, { transaction });
    }

    const snapshot = await PricingSnapshot.create({
      admissionId: lead[idField].toString(),
      onModel: getModelName(onModel),
      paymentFor: paymentFor || "admission",
      baseAmount: pricingRule.baseAmount,
      collegeName: pricingRule.collegeName || collegeForApplied,
      interestedCourse: req.body.interestedCourse || lead.interestedCourse || lead.preferred_degree || "N/A",
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

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: {
        id: order.id,
        currency: order.currency,
        amount: order.amount,
        key_id: process.env.RAZORPAY_KEY_ID,
        name: pricingRule.collegeName || "Nuvora Education",
        description: `${paymentFor || 'Admission'} Fee for ${req.body.interestedCourse || 'Course'}`,
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
console.log("triggered webhook with body:", body);
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

export const getPricingBySlug = async (req, res) => {
  try {
    const { pageSlug } = req.params;
    const rule = await PricingRule.findOne({ where: { pageSlug, isActive: true } });

    if (!rule) {
      return res.status(404).json({ success: false, message: "Pricing not configured for this page" });
    }

    res.status(200).json({
      success: true,
      data: {
        baseAmount: rule.baseAmount,
        currency: rule.currency,
        allowCoupons: rule.allowCoupons,
        collegeName: rule.collegeName
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code, pageSlug, orderAmount } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Coupon code required" });

    const coupon = await Coupon.findOne({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        validTill: { [Op.gte]: new Date() }
      }
    });

    if (!coupon) {
      return res.status(404).json({ success: false, message: "Invalid or expired coupon" });
    }

    if (coupon.usedCount >= coupon.usageLimitGlobal) {
      return res.status(400).json({ success: false, message: "Coupon usage limit exceeded" });
    }

    if (coupon.applicablePages && Array.isArray(coupon.applicablePages) && coupon.applicablePages.length > 0) {
      if (!coupon.applicablePages.includes(pageSlug)) {
        return res.status(400).json({ success: false, message: "Coupon not applicable for this page" });
      }
    }

    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ success: false, message: `Minimum order amount of ${coupon.minOrderAmount} required` });
    }

    let discount = 0;
    const baseAmount = parseFloat(orderAmount);
    if (coupon.discountType === 'FLAT') {
      discount = parseFloat(coupon.discountValue);
    } else if (coupon.discountType === 'PERCENTAGE') {
      discount = (baseAmount * parseFloat(coupon.discountValue)) / 100;
      if (coupon.maxDiscountAmount) {
        discount = Math.min(discount, parseFloat(coupon.maxDiscountAmount));
      }
    }
    discount = Math.min(discount, baseAmount);

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        discountAmount: discount,
        finalAmount: baseAmount - discount,
        message: "Coupon applied successfully"
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPaymentsByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const snapshots = await PricingSnapshot.findAll({
      where: { admissionId: student_id, onModel: 'students' },
      include: [{ model: PaymentOrder, as: 'paymentOrder' }],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(snapshots);
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const getAllPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    const orders = await PaymentOrder.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [{ model: PricingSnapshot, as: 'snapshot' }],
      order: [["created_at", "DESC"]],
    });
    res.status(200).json(orders);
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const getPaymentsByStudentWithDetails = async (req, res) => {
  try {
    const { student_id } = req.params;
    const snapshots = await PricingSnapshot.findAll({
      where: { admissionId: student_id, onModel: 'students' },
      include: [{ model: PaymentOrder, as: 'paymentOrder' }],
      order: [["created_at", "DESC"]]
    });
    const student = await Student.findByPk(student_id);
    res.status(200).json({ student, payments: snapshots });
  } catch (error) { res.status(500).json({ message: "Internal server error" }); }
};

export const getPaymentReports = async (req, res) => {
  try {
    const { status, startDate, endDate, onModel } = req.query;

    const orderWhere = {};
    if (status) {
      if (status.toLowerCase() === "success" || status.toLowerCase() === "completed") {
        orderWhere.status = "PAID";
      } else {
        orderWhere.status = status.toUpperCase();
      }
    }

    const snapshotWhere = {};
    if (onModel) snapshotWhere.onModel = onModel;

    // Add date filtering if provided
    if (startDate && endDate) {
      orderWhere.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const orders = await PaymentOrder.findAll({
      where: orderWhere,
      include: [{
        model: PricingSnapshot,
        as: 'snapshot',
        where: snapshotWhere,
      }],
      order: [["created_at", "DESC"]]
    });

    // Group admissionIds by model for efficient fetching
    const modelMap = {
      students: new Set(),
      admissions: new Set(),
      registrations: new Set()
    };

    orders.forEach(o => {
      const snap = o.snapshot;
      if (snap && snap.onModel && modelMap[snap.onModel]) {
        modelMap[snap.onModel].add(snap.admissionId);
      }
    });

    // Fetch leads for each model
    const leadsData = {
      students: {},
      admissions: {},
      registrations: {}
    };

    if (modelMap.students.size > 0) {
      const students = await Student.findAll({ where: { student_id: Array.from(modelMap.students) } });
      students.forEach(s => leadsData.students[s.student_id] = s);
    }
    if (modelMap.admissions.size > 0) {
      // Postgres: Cast admissionIds to INTEGER if needed, but since they are stored as strings in modelMap, we just use them.
      // If admissionIds are numbers like "144", findAll with where: { id: [...] } usually handles it if Postgres allows string-to-int conversion in IN clause.
      // To be safe, we cast to Numbers.
      const ids = Array.from(modelMap.admissions).map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const admissions = await Admission.findAll({ where: { id: ids } });
        admissions.forEach(a => leadsData.admissions[a.id] = a);
      }
    }
    if (modelMap.registrations.size > 0) {
      const ids = Array.from(modelMap.registrations).map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        const registrations = await Registration.findAll({ where: { id: ids } });
        registrations.forEach(r => leadsData.registrations[r.id] = r);
      }
    }

    // Map data to match exact frontend expected format
    const formattedData = orders.map(order => {
      const snap = order.snapshot || {};
      const lead = leadsData[snap.onModel] ? leadsData[snap.onModel][snap.admissionId] : null;

      return {
        id: order.id,
        student_id: snap.admissionId,
        college_name: snap.collegeName || "N/A",
        course_name: snap.interestedCourse || "N/A",
        status: order.status === 'PAID' ? 'COMPLETED' : order.status,
        payment_for: snap.paymentFor,
        base_amount: snap.baseAmount,
        final_amount: snap.finalAmount,
        couponCode: snap.appliedCouponCode,
        discount_amount: snap.discountAmount,
        currency: order.currency,
        razorpay_order_id: order.razorpayOrderId,
        created_at: order.createdAt,
        updated_at: order.updatedAt,
        student: lead ? {
          student_id: snap.admissionId,
          student_name: lead.student_name || lead.name || "N/A",
          student_phone: lead.student_phone || lead.mobile || "N/A",
          student_email: lead.student_email || lead.email || "N/A",
          assigned_counsellor_id: lead.assigned_counsellor_id || lead.counsellor_id || "N/A",
        } : null
      };
    });

    // Calculate Summary Stats in expected format
    const analytics = {
      total_records: orders.length,
      success: orders.filter(o => o.status === 'PAID').length,
      failed: orders.filter(o => o.status === 'FAILED').length,
      pending: orders.filter(o => o.status === 'PENDING' || o.status === 'CREATED').length,
      total_revenue: orders.filter(o => o.status === 'PAID').reduce((sum, o) => sum + parseFloat(o.amount || 0), 0),
    };

    res.status(200).json({
      analytics,
      data: formattedData
    });
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
