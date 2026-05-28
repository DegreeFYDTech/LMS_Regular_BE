import {
  CourseStatus,
  StudentLeadActivity,
  UniversityCourse,
  sequelize,
} from "../models/index.js";
import { Op } from "sequelize";
export const normalizeLeadAnswers = (input) => {
  if (!Array.isArray(input)) return [];

  if (
    input.length &&
    typeof input[0] === "object" &&
    "question" in input[0] &&
    "answer" in input[0]
  ) {
    return input.filter(
      (i) => i.answer !== null && i.answer !== undefined && i.answer !== "",
    );
  }

  if (input.length && typeof input[0] === "object") {
    const obj = input[0];

    return Object.entries(obj)
      .filter(
        ([_, value]) => value !== null && value !== undefined && value !== "",
      )
      .map(([question, answer]) => ({
        question,
        answer: Array.isArray(answer) ? answer.join(", ") : String(answer),
      }));
  }

  return [];
};

export const createLeadActivity = async (leadData, studentId) => {
  try {
    console.log(
      "Creating lead activity with data:",
      leadData,
      "for student ID:",
      studentId,
    );
    const sourceurl =
      leadData.first_source_url ||
      leadData.sourceUrl ||
      leadData.source_url ||
      "";

    const source = leadData.source || "";

    const newLeadActivity = await StudentLeadActivity.create({
      student_id: studentId || "",
      preferred_college_cll: leadData.preferred_college_cll || [],
      student_name: leadData.name || "",
      student_email: leadData.email || "",
      student_phone: leadData.phoneNumber || leadData.mobile || "",
      parents_number: leadData.parentsNumber || leadData.parents_number || "",
      whatsapp: leadData.whatsapp || "",
      cta_name: leadData.ctaName || leadData.cta_name || "",
      form_name: leadData.formName || leadData.form_name || "",

      source: source,
      source_url: sourceurl,

      utm_source: leadData.utmSource || "",
      utm_medium: leadData.utmMedium || "",
      utm_keyword: leadData.utmKeyword || "",
      utm_campaign: leadData.utmCampaign || "",
      utm_campaign_id: leadData.utmCampaignId || "",
      utm_adgroup_id: leadData.utmAdgroupId || "",
      utm_creative_id: leadData.utmCreativeId || "",
      preferred_college_cll: leadData.preferred_college_cll || [],
      ip_city: leadData.ipCity || "",
      browser: leadData.browser || "",
      device: leadData.device || "",
      lead_type: leadData.lead_type || "",
      preferred_college_cll: leadData.preferred_college_cll || [],
      student_comment:
        source == "Google_Lead_Form"
          ? leadData.student_comment || []
          : normalizeLeadAnswers(leadData.student_comment || []),

      highest_qualification: leadData.highestQualification || "",
      working_professional: leadData.workingProfessional ?? false,
      student_status: "new",

      destination_number: leadData.DestinationNumber || "",
      dial_whom_number: leadData.DialWhomNumber || "",
      call_duration: leadData.CallDuration || "",
      ivr_status: leadData.Status || leadData.ivr_status || "",
      start_time: leadData.StartTime || "",
      end_time: leadData.EndTime || "",
      call_sid: leadData.CallSid || "",
      call_recording_url: leadData.call_recording_url || "",
      talk_duration: leadData.TalkDuration || "",
      is_transfer: leadData.isTransfer || false,
    });
    const shortlistColleges = leadData.preferred_college_cll || [];
    if (shortlistColleges.length > 0) {
      for (const collegeName of shortlistColleges) {
        console.log(
          `Processing college: ${collegeName} for student ID: ${studentId}`,
        );
        const courses = await UniversityCourse.findAll({
          where: {
            university_name: { [Op.iLike]: `%${collegeName}%` },
          },
          attributes: ["course_id"],
        });

        if (courses.length === 0) continue;

        const courseIds = courses.map((c) => c.course_id);

        const existingStatus = await CourseStatus.findOne({
          where: {
            student_id: studentId,
            course_id: courseIds,
          },
        });
        console.log(
          `Existing course status for student ${studentId} and courses ${courseIds}:`,
          existingStatus,
        );
        if (!existingStatus) {
          await CourseStatus.create({
            course_id: courseIds[0],
            student_id: studentId,
            selection_type: "student_selected",
            latest_course_status: "Shortlisted",
            is_shortlisted: true,
          });
        }
      }
    }

    return { success: true, leadActivity: newLeadActivity };
  } catch (error) {
    console.error("Error creating lead activity:", error);
    return { success: false, error: error.message };
  }
};

export const getLeadActivitiesByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const leadActivities = await StudentLeadActivity.findAll({
      where: { student_id: studentId },
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      leadActivities,
    });
  } catch (error) {
    console.error("Error fetching lead activities:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching lead activities",
      error: error.message,
    });
  }
};

export const updateLeadActivityStatus = async (req, res) => {
  try {
    const { leadActivityId } = req.params;
    const { status, studentComment } = req.body;

    const leadActivity = await StudentLeadActivity.findByPk(leadActivityId);

    if (!leadActivity) {
      return res.status(404).json({
        success: false,
        message: "Lead activity not found",
      });
    }

    // Update the status
    leadActivity.student_status = status;

    // If there's a student comment, merge it with existing comments
    if (studentComment) {
      const existingComments = leadActivity.student_comment || {};
      leadActivity.student_comment = {
        ...existingComments,
        ...studentComment,
      };
    }

    await leadActivity.save();

    res.status(200).json({
      success: true,
      leadActivity,
    });
  } catch (error) {
    console.error("Error updating lead activity:", error);
    res.status(500).json({
      success: false,
      message: "Error updating lead activity",
      error: error.message,
    });
  }
};

export const getActivityByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const leadActivities = await StudentLeadActivity.findAll({
      where: { student_id: studentId },
      order: [["created_at", "DESC"]],
    });
    res.status(200).json({
      success: true,
      data: leadActivities,
    });
  } catch (error) {
    console.error("Error getting lead activity:", error);
    res.status(500).json({
      success: false,
      message: "Error getting lead activity",
      error: error.message,
    });
  }
};

// Additional helper functions for PostgreSQL with Sequelize

export const getAllLeadActivities = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.student_status = status;
    }

    const { count, rows } = await StudentLeadActivity.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page),
        hasNextPage: offset + rows.length < count,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error getting all lead activities:", error);
    res.status(500).json({
      success: false,
      message: "Error getting all lead activities",
      error: error.message,
    });
  }
};

export const getLeadActivityById = async (req, res) => {
  try {
    const { leadActivityId } = req.params;

    const leadActivity = await StudentLeadActivity.findByPk(leadActivityId, {
      include: [
        {
          model: Student,
          as: "student",
          attributes: [
            "student_id",
            "student_name",
            "student_email",
            "student_phone",
          ],
        },
      ],
    });

    if (!leadActivity) {
      return res.status(404).json({
        success: false,
        message: "Lead activity not found",
      });
    }

    res.status(200).json({
      success: true,
      data: leadActivity,
    });
  } catch (error) {
    console.error("Error getting lead activity by ID:", error);
    res.status(500).json({
      success: false,
      message: "Error getting lead activity",
      error: error.message,
    });
  }
};

export const deleteLeadActivity = async (req, res) => {
  try {
    const { leadActivityId } = req.params;

    const deleted = await StudentLeadActivity.destroy({
      where: { id: leadActivityId },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Lead activity not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Lead activity deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting lead activity:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting lead activity",
      error: error.message,
    });
  }
};

export const getLeadActivitiesByDateRange = async (req, res) => {
  try {
    const { startDate, endDate, studentId } = req.query;

    const whereClause = {};

    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (studentId) {
      whereClause.student_id = studentId;
    }

    const leadActivities = await StudentLeadActivity.findAll({
      where: whereClause,
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: leadActivities,
    });
  } catch (error) {
    console.error("Error getting lead activities by date range:", error);
    res.status(500).json({
      success: false,
      message: "Error getting lead activities by date range",
      error: error.message,
    });
  }
};

import fs from "fs";
import path from "path";

export const updateCommentsFromFile = async (req, res) => {
  try {
    // File is named data.json in root directory
    const filePath = path.join(process.cwd(), "data.json");

    console.log("Reading file from:", filePath);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "data.json file not found in root directory",
      });
    }

    // Read and parse the file
    const fileContent = fs.readFileSync(filePath, "utf8");
    const jsonData = JSON.parse(fileContent);

    console.log(`Found ${jsonData.length} records in data.json`);

    let updatedCount = 0;
    let failedCount = 0;
    const errors = [];
    const notFoundEmails = [];

    // Process each record
    for (const record of jsonData) {
      try {
        const email = record.email;
        const question = record["additional_fields[0].question"];
        const answer = record["additional_fields[0].answer"];

        // Skip if missing data
        if (!email || !question || !answer) {
          failedCount++;
          continue;
        }

        // Clean email (lowercase, trim)
        const cleanEmail = email.toLowerCase().trim();

        // Create comment object
        const newComment = {
          question: question,
          answer: answer,
          timestamp: new Date().toISOString(),
          source: "data.json",
        };

        // Find existing student
        const student = await StudentLeadActivity.findOne({
          where: { student_email: cleanEmail },
        });

        if (student) {
          // Get existing comments or initialize as array
          const existingComments = student.student_comment || [];

          // Add new comment to the array
          const updatedComments = [...existingComments, newComment];

          // Update the record
          await StudentLeadActivity.update(
            {
              student_comment: updatedComments,
              updated_at: new Date(),
            },
            {
              where: { student_email: cleanEmail },
            },
          );

          updatedCount++;
          console.log(
            `✓ Updated: ${cleanEmail} (${existingComments.length} → ${updatedComments.length} comments)`,
          );
        } else {
          console.log(`✗ Not found in DB: ${cleanEmail}`);
          notFoundEmails.push(cleanEmail);
          failedCount++;
        }
      } catch (error) {
        failedCount++;
        errors.push(
          `Error processing ${record.email || "unknown"}: ${error.message}`,
        );
        console.error(`Error with ${record.email}:`, error.message);
      }
    }

    // Send response
    return res.status(200).json({
      success: true,
      message: `Processed ${jsonData.length} records from data.json`,
      stats: {
        totalRecords: jsonData.length,
        updated: updatedCount,
        failed: failedCount,
        successRate: `${((updatedCount / jsonData.length) * 100).toFixed(1)}%`,
      },
      notFound:
        notFoundEmails.length > 0 ? notFoundEmails.slice(0, 10) : undefined,
      totalNotFound: notFoundEmails.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      totalErrors: errors.length,
      filePath: filePath,
    });
  } catch (error) {
    console.error("Error updating from file:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing data.json file",
      error: error.message,
      suggestion:
        "Make sure data.json is valid JSON format and in the root directory",
    });
  }
};


export const bulkInsertStudentLeadActivities = async (req, res) => {
  try {
    const activities = req.body;

    if (!Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({
        success: false,
        message: "activities must be a non-empty array",
      });
    }

    // 1️⃣ Get all valid student_ids
    const students = await Student.findAll({
      attributes: ["student_id"],
      raw: true,
    });

    const validStudentIds = new Set(students.map((s) => s.student_id));

    // 2️⃣ Split valid & invalid records
    const validActivities = [];
    const skippedActivities = [];

    for (const activity of activities) {
      if (activity.student_id && validStudentIds.has(activity.student_id)) {
        validActivities.push(activity);
      } else {
        skippedActivities.push({
          student_id: activity.student_id || null,
          reason: "student_id not found in students table",
        });
      }
    }

    // 3️⃣ Insert only valid records
    let insertedCount = 0;
    if (validActivities.length > 0) {
      const inserted = await StudentLeadActivity.bulkCreate(validActivities, {
        validate: true,
      });
      insertedCount = inserted.length;
    }

    return res.status(200).json({
      success: true,
      message: "Bulk insert completed",
      inserted: insertedCount,
      skipped: skippedActivities.length,
      skippedRecords: skippedActivities,
    });
  } catch (error) {
    console.error("Bulk Lead Activity Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};