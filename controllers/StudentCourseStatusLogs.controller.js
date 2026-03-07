import axios from "axios";
import {
  UniversityCourse,
  CourseStatusHistory,
  CourseStatus,
  Student,
  Counsellor,
  sequelize,
} from "../models/index.js";
import { Op, QueryTypes, Sequelize } from "sequelize";
import CourseStatusJourney from "../models/course_status_jounreny.js";

export const getCounsellorStats = async (req, res) => {
  try {
    const { start_date, end_date, counsellor_id } = req.query;

    let dateFilter = '';
    if (start_date && end_date) {
      dateFilter = `
        AND (lr.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date 
        BETWEEN '${start_date}' AND '${end_date}'
      `;
    }

    let counsellorFilter = '';
    if (counsellor_id) {
      counsellorFilter = ` AND s.assigned_counsellor_l3_id = ${counsellor_id} `;
    }

    const stats = await sequelize.query(`
      WITH lr AS (
        SELECT DISTINCT ON (student_id)
            student_id,
            remarks,
            created_at,
            counsellor_id
        FROM student_remarks 
        ORDER BY student_id, created_at DESC
      ),

      lr_with_counsellor_role AS (
        SELECT 
            lr.*,
            c.role AS counsellor_role
        FROM lr
        LEFT JOIN counsellors c ON lr.counsellor_id = c.counsellor_id
      ),

      base AS (
        SELECT 
            csj.student_id,
            csj.course_id,
            csj.latest_course_status,
            CASE 
                WHEN lr.counsellor_role = 'l3'
                THEN (lr.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
                ELSE (csj.updated_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')
            END AS last_action_ist,
            s.assigned_counsellor_l3_id,
            c.counsellor_name,
            CASE 
                WHEN lr.counsellor_role = 'l2' THEN 1
                ELSE 0
            END AS is_initiated
        FROM latest_course_statuses csj
        JOIN students s ON csj.student_id = s.student_id
        JOIN counsellors c ON s.assigned_counsellor_l3_id = c.counsellor_id
        LEFT JOIN lr_with_counsellor_role lr ON lr.student_id = csj.student_id
        WHERE csj.latest_course_status <> 'Shortlisted'
        ${dateFilter}
        ${counsellorFilter}
      ),

      active_forms AS (
        SELECT *
        FROM base
        WHERE latest_course_status <> 'Registration done'
      )

      SELECT 
          b.assigned_counsellor_l3_id,
          b.counsellor_name,
          COUNT(b.student_id) AS total_forms,
          COUNT(a.student_id) AS active_forms,
          COUNT(*) FILTER (WHERE b.is_initiated = 1) AS not_initiated_count,
          COUNT(*) FILTER (
              WHERE a.last_action_ist >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') - INTERVAL '3 days'
          ) AS called_within_3_days,
          COUNT(*) FILTER (
              WHERE a.last_action_ist < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') - INTERVAL '3 days'
              AND a.last_action_ist >= (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') - INTERVAL '6 days'
          ) AS called_4_to_6_days,
          COUNT(*) FILTER (
              WHERE a.last_action_ist < (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') - INTERVAL '6 days'
          ) AS called_7_plus_days
      FROM base b
      LEFT JOIN active_forms a ON b.student_id = a.student_id AND b.course_id = a.course_id
      GROUP BY b.assigned_counsellor_l3_id, b.counsellor_name
      ORDER BY total_forms DESC;
    `, {
      type: sequelize.QueryTypes.SELECT,
    });

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Counsellor statistics fetched successfully",
      filters: { start_date, end_date, counsellor_id }
    });

  } catch (error) {
    console.error("Error fetching counsellor stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch counsellor statistics",
      error: error.message
    });
  }
};

export const getFormToAdmissionsReport = async (req, res) => {
  try {
    const { till_date } = req.query;

    if (!till_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide till_date parameter (YYYY-MM-DD)"
      });
    }

    const selectedDate = new Date(till_date);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');

    // Calculate date ranges
    const ytdStartDate = `${year}-01-01`;
    const mtdStartDate = `${year}-${month}-01`;
    const ftdDate = till_date;

    const query = `
      WITH form_statuses AS (
        SELECT unnest(ARRAY[
          'Form Submitted â€“ Portal Pending',
          'Form Submitted â€“ Completed',
          'Walkin Completed',
          'Exam Interview Pending',
          'Offer Letter/Results Pending',
          'Offer Letter/Results Released'
        ]) AS status
      ),
      admission_statuses AS (
        SELECT unnest(ARRAY[
          'Registration done',
          'Semester fee paid',
          'Partially Paid'
        ]) AS status
      ),
      -- Get FIRST form date for each student-course
      first_form_dates AS (
        SELECT DISTINCT ON (student_id, course_id)
          student_id,
          course_id,
          created_at::date AS form_date
        FROM course_status_journeys
        WHERE course_status IN (SELECT status FROM form_statuses)
          AND created_at::date <= :tillDate::date
        ORDER BY student_id, course_id, created_at ASC
      ),
      -- Get FIRST admission date for each student-course
      first_admission_dates AS (
        SELECT DISTINCT ON (student_id, course_id)
          student_id,
          course_id,
          created_at::date AS admission_date
        FROM course_status_journeys
        WHERE course_status IN (SELECT status FROM admission_statuses)
          AND created_at::date <= :tillDate::date
        ORDER BY student_id, course_id, created_at ASC
      ),
      college_metrics AS (
        SELECT 
          c.university_name AS college_name,
          
          -- YTD Forms (based on first form date)
          COUNT(DISTINCT CASE 
            WHEN ffd.form_date >= :ytdStartDate::date
              AND ffd.form_date <= :tillDate::date
            THEN ffd.student_id || '-' || ffd.course_id
          END) AS ytd_forms,
          
          -- YTD Admissions (based on first admission date)
          COUNT(DISTINCT CASE 
            WHEN fad.admission_date >= :ytdStartDate::date
              AND fad.admission_date <= :tillDate::date
            THEN fad.student_id || '-' || fad.course_id
          END) AS ytd_admissions,
          
          -- MTD Forms
          COUNT(DISTINCT CASE 
            WHEN ffd.form_date >= :mtdStartDate::date
              AND ffd.form_date <= :tillDate::date
            THEN ffd.student_id || '-' || ffd.course_id
          END) AS mtd_forms,
          
          -- MTD Admissions
          COUNT(DISTINCT CASE 
            WHEN fad.admission_date >= :mtdStartDate::date
              AND fad.admission_date <= :tillDate::date
            THEN fad.student_id || '-' || fad.course_id
          END) AS mtd_admissions,
          
          -- FTD Forms
          COUNT(DISTINCT CASE 
            WHEN ffd.form_date = :ftdDate::date
            THEN ffd.student_id || '-' || ffd.course_id
          END) AS ftd_forms,
          
          -- FTD Admissions
          COUNT(DISTINCT CASE 
            WHEN fad.admission_date = :ftdDate::date
            THEN fad.student_id || '-' || fad.course_id
          END) AS ftd_admissions
          
        FROM university_courses c
        LEFT JOIN first_form_dates ffd ON c.course_id = ffd.course_id
        LEFT JOIN first_admission_dates fad ON c.course_id = fad.course_id 
        GROUP BY c.university_name
      )
      
      SELECT 
        college_name,
        ytd_forms,
        ytd_admissions,
        CASE 
          WHEN ytd_forms > 0 THEN ROUND((ytd_admissions * 100.0 / ytd_forms), 1)
          ELSE 0 
        END AS ytd_f2a,
        mtd_forms,
        mtd_admissions,
        CASE 
          WHEN mtd_forms > 0 THEN ROUND((mtd_admissions * 100.0 / mtd_forms), 1)
          ELSE 0 
        END AS mtd_f2a,
        ftd_forms,
        ftd_admissions,
        CASE 
          WHEN ftd_forms > 0 THEN ROUND((ftd_admissions * 100.0 / ftd_forms), 1)
          ELSE 0 
        END AS ftd_f2a
      FROM college_metrics
      WHERE ytd_forms > 0 OR mtd_forms > 0 OR ftd_forms > 0
      ORDER BY ytd_forms DESC;
    `;

    const results = await sequelize.query(query, {
      replacements: {
        ytdStartDate,
        mtdStartDate,
        ftdDate,
        tillDate: till_date
      },
      type: sequelize.QueryTypes.SELECT
    });

    // Calculate totals
    const totals = results.reduce((acc, curr) => ({
      ytd_forms: acc.ytd_forms + (parseInt(curr.ytd_forms) || 0),
      ytd_admissions: acc.ytd_admissions + (parseInt(curr.ytd_admissions) || 0),
      mtd_forms: acc.mtd_forms + (parseInt(curr.mtd_forms) || 0),
      mtd_admissions: acc.mtd_admissions + (parseInt(curr.mtd_admissions) || 0),
      ftd_forms: acc.ftd_forms + (parseInt(curr.ftd_forms) || 0),
      ftd_admissions: acc.ftd_admissions + (parseInt(curr.ftd_admissions) || 0),
    }), {
      ytd_forms: 0, ytd_admissions: 0,
      mtd_forms: 0, mtd_admissions: 0,
      ftd_forms: 0, ftd_admissions: 0,
    });

    // Add totals row
    const responseData = [
      ...results,
      {
        college_name: "Total",
        ytd_forms: totals.ytd_forms,
        ytd_admissions: totals.ytd_admissions,
        ytd_f2a: totals.ytd_forms > 0
          ? Number(((totals.ytd_admissions / totals.ytd_forms) * 100).toFixed(1))
          : 0,
        mtd_forms: totals.mtd_forms,
        mtd_admissions: totals.mtd_admissions,
        mtd_f2a: totals.mtd_forms > 0
          ? Number(((totals.mtd_admissions / totals.mtd_forms) * 100).toFixed(1))
          : 0,
        ftd_forms: totals.ftd_forms,
        ftd_admissions: totals.ftd_admissions,
        ftd_f2a: totals.ftd_forms > 0
          ? Number(((totals.ftd_admissions / totals.ftd_forms) * 100).toFixed(1))
          : 0,
      }
    ];

    return res.status(200).json({
      success: true,
      data: responseData,
      filters: {
        till_date,
        ytd_range: `${ytdStartDate} to ${till_date}`,
        mtd_range: `${mtdStartDate} to ${till_date}`,
        ftd_date: till_date
      },
      message: "Form to Admissions report fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching form to admissions report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch form to admissions report",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
export const getStudentJourneyDetails = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    const escapedIds = studentIds.map((id) => `'${id}'`).join(",");

    const query = `
            SELECT 
                csj.status_history_id,
                csj.student_id,
                csj.course_id,
                uc.university_name,
                uc.course_name,
                uc.degree_name,
                uc.level,
                csj.assigned_l3_counsellor_id as current_counsellor_id,
                c.counsellor_name as current_counsellor_name,
                csj.course_status,
                csj.created_at
            FROM course_status_journeys csj
            LEFT JOIN university_courses uc ON csj.course_id = uc.course_id
            LEFT JOIN counsellors c ON csj.assigned_l3_counsellor_id = c.counsellor_id
            WHERE csj.student_id IN (${escapedIds})
            ORDER BY csj.student_id, csj.created_at DESC;
        `;

    const journeys = await sequelize.query(query, {
      type: QueryTypes.SELECT,
    });

    return res.status(200).json({
      success: true,
      data: journeys,
      message: "Student journey details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching student journey details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student journey details",
      error: error.message,
    });
  }
};

// Replace L3 counsellor for selected students across all journey entries
export const replaceL3CounsellorForStudents = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { studentIds, fromCounsellorId, toCounsellorId } = req.body;

    // Validation
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    if (!fromCounsellorId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide the source counsellor ID to replace",
      });
    }

    if (!toCounsellorId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide the target counsellor ID",
      });
    }

    // Check if target counsellor exists and is L3 - using parameterized query
    const targetCounsellor = await sequelize.query(
      `SELECT counsellor_id FROM counsellors 
       WHERE counsellor_id = $1 AND role = 'l3'`,
      {
        bind: [toCounsellorId],
        type: QueryTypes.SELECT,
        transaction,
      },
    );

    if (!targetCounsellor || targetCounsellor.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Target counsellor not found or is not an L3 counsellor",
      });
    }

    // Check if fromCounsellorId exists (optional, for validation)
    if (fromCounsellorId !== "any") {
      // Allow 'any' as a special value to replace regardless of current
      const fromCounsellor = await sequelize.query(
        `SELECT counsellor_id FROM counsellors 
         WHERE counsellor_id = $1 AND role = 'l3'`,
        {
          bind: [fromCounsellorId],
          type: QueryTypes.SELECT,
          transaction,
        },
      );

      if (!fromCounsellor || fromCounsellor.length === 0) {
        console.warn(
          `Source counsellor ${fromCounsellorId} not found, but continuing with replacement`,
        );
      }
    }

    // Count records to be updated - using parameterized query
    const countResult = await sequelize.query(
      `SELECT COUNT(*) as count
       FROM course_status_journeys
       WHERE student_id = ANY($1::text[])
         AND assigned_l3_counsellor_id = $2`,
      {
        bind: [studentIds, fromCounsellorId],
        type: QueryTypes.SELECT,
        transaction,
      },
    );

    const recordsToUpdate = parseInt(countResult[0]?.count || 0);

    if (recordsToUpdate === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message:
          "No journey entries found with the specified counsellor for these students",
      });
    }

    // Update all journey entries for the selected students - using parameterized query
    await sequelize.query(
      `UPDATE course_status_journeys
       SET assigned_l3_counsellor_id = $1
       WHERE student_id = ANY($2::text[])
         AND assigned_l3_counsellor_id = $3`,
      {
        bind: [toCounsellorId, studentIds, fromCounsellorId],
        type: QueryTypes.UPDATE,
        transaction,
      },
    );

    // Commit transaction
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Successfully replaced L3 counsellor for ${recordsToUpdate} journey entries across ${studentIds.length} students`,
      data: {
        studentIds,
        fromCounsellorId,
        toCounsellorId,
        recordsUpdated: recordsToUpdate,
      },
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error rolling back transaction:", rollbackError);
    }

    console.error("Error replacing L3 counsellor:", error);

    // Check for connection errors
    if (error.code === "ECONNRESET" || error.parent?.code === "ECONNRESET") {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again.",
        error: "Connection reset",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to replace L3 counsellor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Replace L3 counsellor for a specific journey entry
export const replaceL3CounsellorForSpecificJourney = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { studentId, courseId, toCounsellorId } = req.body;

    // Validation
    if (!studentId || !courseId || !toCounsellorId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide studentId, courseId, and toCounsellorId",
      });
    }

    // Check if target counsellor exists and is L3 - using parameterized query
    const targetCounsellor = await sequelize.query(
      `SELECT counsellor_id FROM counsellors 
       WHERE counsellor_id = $1 AND role = 'l3'`,
      {
        bind: [toCounsellorId],
        type: QueryTypes.SELECT,
        transaction,
      },
    );

    if (!targetCounsellor || targetCounsellor.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Target counsellor not found or is not an L3 counsellor",
      });
    }

    // Update the specific journey entry - using parameterized query
    const [updatedCount] = await sequelize.query(
      `UPDATE course_status_journeys
       SET assigned_l3_counsellor_id = $1
       WHERE student_id = $2 
         AND course_id = $3`,
      {
        bind: [toCounsellorId, studentId, courseId],
        type: QueryTypes.UPDATE,
        transaction,
      },
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Successfully updated counsellor for student ${studentId} and course ${courseId}`,
      data: {
        studentId,
        courseId,
        toCounsellorId,
        updated: true,
      },
    });
  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error rolling back transaction:", rollbackError);
    }

    console.error("Error replacing L3 counsellor for specific journey:", error);

    if (error.code === "ECONNRESET" || error.parent?.code === "ECONNRESET") {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again.",
        error: "Connection reset",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to replace L3 counsellor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const createStatusLog = async (req, res) => {
  try {
    const {
      studentId,
      status,
      collegeName,
      courseName,
      notes,
      examInterviewDate,
      lastAdmissionDate,
      depositAmount = 0,
    } = req.body;
    const { courseId } = req.params;
    const userId = req.user?.id || req.user?.supervisorId || null;

    const courseDetails = await UniversityCourse.findOne({
      where: { course_id: courseId },
    });

    if (!courseDetails) {
      return res.status(404).json({ message: "Course not found" });
    }
    console.log("hello");
    const journeyEntry = await CourseStatusJourney.create({
      student_id: studentId,
      course_id: courseId,
      counsellor_id: userId,
      course_status: status,
      deposit_amount: depositAmount,
      currency: "INR",
      exam_interview_date: examInterviewDate
        ? new Date(examInterviewDate)
        : null,
      last_admission_date: lastAdmissionDate
        ? new Date(lastAdmissionDate)
        : null,
      notes: notes,
    });
    const updated = await CourseStatus.update(
      { latest_course_status: status },
      { where: { course_id: courseId, student_id: studentId } },
    );
    console.log("Journey entry created:", journeyEntry.status_history_id);
    console.log("Journey entry created:", journeyEntry.status_history_id);

    if (
      status == "Form Submitted â€“ Portal Pending" ||
      status == "Form Submitted â€“ Completed" ||
      status == "Walkin Completed" ||
      status == "Exam Interview Pending" ||
      status == "Offer Letter/Results Pending" ||
      status == "Offer Letter/Results Released"
    ) {
      try {
        const l3data = await axios.post(
          "http://localhost:3031/v1/leadassignmentl3/assign",
          {
            studentId,
            collegeName: courseDetails.university_name,
            Course: courseDetails.course_name,
            Degree: courseDetails.degree_name,
            Specialization: courseDetails.specialization,
            level: courseDetails.level,
            source: courseDetails.level,
            stream: courseDetails.stream,
          },
        );
        if (l3data.data.assigned_l3_counsellor_id) {
          await journeyEntry.update({
            assigned_l3_counsellor_id: l3data.data.assigned_l3_counsellor_id,
          });
        }
      } catch (l3Error) {
        console.error("L3 assignment error:", l3Error.message);
      }
    }

    await Student.update(
      { first_form_filled_date: new Date() },
      { where: { student_id: studentId, first_form_filled_date: null } },
    );

    res.status(201).json({
      message: "Status log created successfully",
      logId: journeyEntry.status_history_id,
    });
  } catch (error) {
    console.error("Error creating status log:", error.message);
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const getCollegeStatusReports = async (req, res) => {
  try {
    const {
      reportType = "colleges",
      startDate,
      endDate,
      collegeId,
      firstTimeFrom,  // New: First time date range start
      firstTimeTo,    // New: First time date range end
    } = req.query;

    const whereClause = {};
    const courseWhereClause = {};

    if (collegeId) {
      courseWhereClause.course_id = collegeId;
    }

    let result;

    switch (reportType) {
      case "colleges":
        result = await getCollegesPivotReport(
          whereClause,
          startDate,
          endDate,
          courseWhereClause,
          firstTimeFrom,  // Pass to helper
          firstTimeTo,    // Pass to helper
        );
        break;

      case "l2":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l2",
          courseWhereClause,
          firstTimeFrom,  // Pass to helper
          firstTimeTo,    // Pass to helper
        );
        break;

      case "l3":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l3",
          courseWhereClause,
          firstTimeFrom,  // Pass to helper
          firstTimeTo,    // Pass to helper
        );
        break;

      default:
        result = await getCollegesPivotReport(
          whereClause,
          startDate,
          endDate,
          courseWhereClause,
          firstTimeFrom,  // Pass to helper
          firstTimeTo,    // Pass to helper
        );
    }

    res.status(200).json({
      success: true,
      reportType,
      data: result,
      filters: {
        startDate,
        endDate,
        collegeId,
        firstTimeFrom,
        firstTimeTo,
      },
    });
  } catch (error) {
    console.error("Error in getCollegeStatusReports:", error);
    res.status(500).json({
      success: false,
      message: "Error generating reports",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const getCollegesPivotReport = async (
  whereClause,
  startDate,
  endDate,
  courseWhereClause,
  firstTimeFrom,
  firstTimeTo,
) => {
  const isFirstTimeDateFilter = !!(firstTimeFrom || firstTimeTo);
  const isMainDateFilter = !!(startDate || endDate);
  const aggFn = isFirstTimeDateFilter ? 'MIN' : 'MAX';

  // Build single raw SQL query
  let innerWhere = '';
  const replacements = {};

  if (isFirstTimeDateFilter) {
    const conditions = [];
    if (firstTimeFrom) {
      conditions.push(`csh_inner.created_at >= :firstTimeFrom`);
      replacements.firstTimeFrom = firstTimeFrom + 'T00:00:00Z';
    }
    if (firstTimeTo) {
      conditions.push(`csh_inner.created_at <= :firstTimeTo`);
      replacements.firstTimeTo = firstTimeTo + 'T23:59:59.999Z';
    }
    innerWhere = `WHERE ${conditions.join(' AND ')}`;
  }

  let havingClause = '';
  if (isMainDateFilter) {
    const havingConditions = [];
    if (startDate) {
      havingConditions.push(`DATE(${aggFn}(csh_inner.created_at)) >= :startDate`);
      replacements.startDate = startDate;
    }
    if (endDate) {
      havingConditions.push(`DATE(${aggFn}(csh_inner.created_at)) <= :endDate`);
      replacements.endDate = endDate;
    }
    havingClause = `HAVING ${havingConditions.join(' AND ')}`;
  }

  let courseFilter = '';
  if (courseWhereClause.course_id) {
    courseFilter = `AND uc.course_id = :courseId`;
    replacements.courseId = courseWhereClause.course_id;
  }

  const sql = `
    SELECT 
      csh.student_id,
      csh.course_id,
      csh.course_status,
      uc.university_name AS college
    FROM course_status_journeys csh
    INNER JOIN (
      SELECT 
        csh_inner.student_id, 
        csh_inner.course_id, 
        ${aggFn}(csh_inner.created_at) AS target_date
      FROM course_status_journeys csh_inner
      ${innerWhere}
      GROUP BY csh_inner.student_id, csh_inner.course_id
      ${havingClause}
    ) sub ON csh.student_id = sub.student_id 
         AND csh.course_id = sub.course_id 
         AND csh.created_at = sub.target_date
    INNER JOIN university_courses uc ON csh.course_id = uc.course_id ${courseFilter}
  `;

  const records = await sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
  });

  if (records.length === 0) {
    return {
      view: "colleges-pivot",
      rows: [],
      columns: ["college", "total"],
      statuses: [],
      totals: { statusTotals: {}, grandTotal: 0 },
    };
  }

  // Aggregate by college
  const collegeMap = new Map();
  const statusTotals = {};

  records.forEach(record => {
    const { college, course_status: status } = record;

    if (!collegeMap.has(college)) {
      collegeMap.set(college, { college, total: 0, statuses: {} });
    }

    const data = collegeMap.get(college);
    data.statuses[status] = (data.statuses[status] || 0) + 1;
    data.total++;
    statusTotals[status] = (statusTotals[status] || 0) + 1;
  });

  const allStatuses = Object.keys(statusTotals);
  const rows = Array.from(collegeMap.values()).map(d => {
    const row = { college: d.college, total: d.total };
    allStatuses.forEach(s => { row[s] = d.statuses[s] || 0; });
    return row;
  });

  rows.sort((a, b) => a.college.localeCompare(b.college));
  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return {
    view: "colleges-pivot",
    rows,
    columns: ["college", ...allStatuses, "total"],
    statuses: allStatuses,
    totals: { statusTotals, grandTotal },
  };
};

const getCounsellorPivotReport = async (
  whereClause,
  startDate,
  endDate,
  level,
  courseWhereClause,
  firstTimeFrom,
  firstTimeTo,
) => {
  const isFirstTimeDateFilter = !!(firstTimeFrom || firstTimeTo);
  const isMainDateFilter = !!(startDate || endDate);
  const aggFn = isFirstTimeDateFilter ? 'MIN' : 'MAX';

  // Build single raw SQL query
  let innerWhere = '';
  const replacements = {};

  if (isFirstTimeDateFilter) {
    const conditions = [];
    if (firstTimeFrom) {
      conditions.push(`csh_inner.created_at >= :firstTimeFrom`);
      replacements.firstTimeFrom = firstTimeFrom + 'T00:00:00Z';
    }
    if (firstTimeTo) {
      conditions.push(`csh_inner.created_at <= :firstTimeTo`);
      replacements.firstTimeTo = firstTimeTo + 'T23:59:59.999Z';
    }
    innerWhere = `WHERE ${conditions.join(' AND ')}`;
  }

  let havingClause = '';
  if (isMainDateFilter) {
    const havingConditions = [];
    if (startDate) {
      havingConditions.push(`DATE(${aggFn}(csh_inner.created_at)) >= :startDate`);
      replacements.startDate = startDate;
    }
    if (endDate) {
      havingConditions.push(`DATE(${aggFn}(csh_inner.created_at)) <= :endDate`);
      replacements.endDate = endDate;
    }
    havingClause = `HAVING ${havingConditions.join(' AND ')}`;
  }

  let courseFilter = '';
  if (courseWhereClause.course_id) {
    courseFilter = `AND uc.course_id = :courseId`;
    replacements.courseId = courseWhereClause.course_id;
  }

  const sql = `
    SELECT 
      csh.student_id,
      csh.course_id,
      csh.course_status,
      csh.created_at
    FROM course_status_journeys csh
    INNER JOIN (
      SELECT 
        csh_inner.student_id, 
        csh_inner.course_id, 
        ${aggFn}(csh_inner.created_at) AS target_date
      FROM course_status_journeys csh_inner
      ${innerWhere}
      GROUP BY csh_inner.student_id, csh_inner.course_id
      ${havingClause}
    ) sub ON csh.student_id = sub.student_id 
         AND csh.course_id = sub.course_id 
         AND csh.created_at = sub.target_date
    INNER JOIN university_courses uc ON csh.course_id = uc.course_id ${courseFilter}
  `;

  const records = await sequelize.query(sql, {
    replacements,
    type: QueryTypes.SELECT,
  });

  if (records.length === 0) {
    return {
      view: `${level}-pivot`,
      rows: [],
      columns: ["counsellor", "total"],
      statuses: [],
      level,
      totals: { statusTotals: {}, grandTotal: 0 },
    };
  }

  // Get student IDs from records
  const studentIds = [...new Set(records.map(r => r.student_id))];
  const studentCounsellorMap = {};

  if (level === "l2") {
    const students = await Student.findAll({
      where: { student_id: studentIds },
      attributes: ["student_id", "assigned_counsellor_id"],
      raw: true,
    });
    students.forEach(student => {
      const cId = student.assigned_counsellor_id;
      studentCounsellorMap[student.student_id] = cId && cId.trim() !== "" ? cId : "unassigned";
    });
  } else {
    // For L3, get counsellor from journey table
    const journeyRecords = await CourseStatusJourney.findAll({
      where: {
        student_id: studentIds,
        created_at: { [Op.in]: records.map(r => r.created_at) },
      },
      attributes: ["student_id", "course_id", "assigned_l3_counsellor_id"],
      raw: true,
    });
    const journeyMap = {};
    journeyRecords.forEach(r => {
      const key = `${r.student_id}_${r.course_id}`;
      journeyMap[key] = r.assigned_l3_counsellor_id && r.assigned_l3_counsellor_id.trim() !== ""
        ? r.assigned_l3_counsellor_id : "unassigned";
    });
    records.forEach(r => {
      const key = `${r.student_id}_${r.course_id}`;
      studentCounsellorMap[key] = journeyMap[key] || "unassigned";
    });
  }

  // Aggregate by counsellor
  const counsellorMap = new Map();
  const statusTotals = {};

  records.forEach(record => {
    let counsellorId;
    if (level === "l2") {
      counsellorId = studentCounsellorMap[record.student_id] || "unassigned";
    } else {
      counsellorId = studentCounsellorMap[`${record.student_id}_${record.course_id}`] || "unassigned";
    }

    const status = record.course_status;

    if (!counsellorMap.has(counsellorId)) {
      counsellorMap.set(counsellorId, { counsellorId, total: 0, statuses: {} });
    }

    const data = counsellorMap.get(counsellorId);
    data.statuses[status] = (data.statuses[status] || 0) + 1;
    data.total++;
    statusTotals[status] = (statusTotals[status] || 0) + 1;
  });

  // Get counsellor names
  const counsellorIds = Array.from(counsellorMap.keys()).filter(id => id !== "unassigned");
  const counsellorNameMap = {};

  if (counsellorIds.length > 0) {
    const counsellors = await Counsellor.findAll({
      where: { counsellor_id: counsellorIds },
      attributes: ["counsellor_id", "counsellor_name"],
      raw: true,
    });
    counsellors.forEach(c => { counsellorNameMap[c.counsellor_id] = c.counsellor_name; });
  }

  const allStatuses = Object.keys(statusTotals);

  const rows = Array.from(counsellorMap.values()).map(item => {
    const counsellorName = item.counsellorId === "unassigned"
      ? "Unassigned"
      : counsellorNameMap[item.counsellorId] || `Unknown (${item.counsellorId})`;

    const row = { counsellor: counsellorName, total: item.total };
    allStatuses.forEach(s => { row[s] = item.statuses[s] || 0; });
    return row;
  });

  rows.sort((a, b) => {
    if (a.counsellor === "Unassigned") return 1;
    if (b.counsellor === "Unassigned") return -1;
    return a.counsellor.localeCompare(b.counsellor);
  });

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  return {
    view: `${level}-pivot`,
    rows,
    columns: ["counsellor", ...allStatuses, "total"],
    statuses: allStatuses,
    level,
    totals: { statusTotals, grandTotal },
  };
};





export const getCollegesList = async (req, res) => {
  try {
    const colleges = await UniversityCourse.findAll({
      attributes: ["course_id", "university_name", "level"],
      group: ["course_id", "university_name", "level"],
      order: [["university_name", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: colleges,
    });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching colleges list",
    });
  }
};

export const getDistinctL3CounsellorsByStudentIds = async (req, res) => {
  try {
    const { studentIds } = req.body;
    console.log(
      "Received student IDs for distinct L3 counsellors:",
      studentIds,
    );

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs",
      });
    }

    const escapedIds = studentIds.map((id) => `'${id}'`).join(",");

    // First query: Get distinct counsellors
    const counsellorsQuery = `
      SELECT DISTINCT 
        csj.assigned_l3_counsellor_id,
        c.counsellor_name,
        c.counsellor_email,
        c.role,
        COUNT(DISTINCT csj.student_id) as student_count
      FROM course_status_journeys csj
      LEFT JOIN counsellors c ON csj.assigned_l3_counsellor_id = c.counsellor_id
      WHERE csj.student_id IN (${escapedIds})
        AND csj.assigned_l3_counsellor_id IS NOT NULL
      GROUP BY csj.assigned_l3_counsellor_id, c.counsellor_name, c.counsellor_email, c.role
      ORDER BY c.counsellor_name;
    `;

    const counsellors = await sequelize.query(counsellorsQuery, {
      type: QueryTypes.SELECT,
    });

    // Get ONLY the latest journey entry for each student-course combination
    const journeyDetailsQuery = `
      WITH latest_journeys AS (
        SELECT 
          student_id,
          course_id,
          MAX(created_at) as latest_created_at
        FROM course_status_journeys
        WHERE student_id IN (${escapedIds})
        GROUP BY student_id, course_id
      )
      SELECT 
        csj.student_id,
        csj.course_id,
        uc.university_name,
        uc.course_name,
        uc.degree_name,
        uc.level,
        csj.assigned_l3_counsellor_id as current_counsellor_id,
        c.counsellor_name as current_counsellor_name,
        csj.course_status,
        csj.created_at,
        csj.status_history_id,
        -- Count total journeys per student (for backward compatibility)
        COUNT(*) OVER (PARTITION BY csj.student_id) as student_journey_count
      FROM course_status_journeys csj
      INNER JOIN latest_journeys lj 
        ON csj.student_id = lj.student_id 
        AND csj.course_id = lj.course_id 
        AND csj.created_at = lj.latest_created_at
      LEFT JOIN university_courses uc ON csj.course_id = uc.course_id
      LEFT JOIN counsellors c ON csj.assigned_l3_counsellor_id = c.counsellor_id
      WHERE csj.student_id IN (${escapedIds})
      ORDER BY csj.student_id, uc.university_name;
    `;

    const journeyDetails = await sequelize.query(journeyDetailsQuery, {
      type: QueryTypes.SELECT,
    });

    // NEW: Query to count course_status that include "Form"
    const formStatusCountQuery = `
      SELECT 
        COUNT(*) as total_form_status_count,
        COUNT(DISTINCT student_id) as students_with_form_status,
        course_status,
        COUNT(*) as status_count
      FROM course_status_journeys
      WHERE student_id IN (${escapedIds})
        AND course_status ILIKE '%Form%'
      GROUP BY course_status
      ORDER BY status_count DESC;
    `;

    const formStatusCounts = await sequelize.query(formStatusCountQuery, {
      type: QueryTypes.SELECT,
    });

    // NEW: Get total count of all statuses that include "Form"
    const totalFormStatusCountQuery = `
      SELECT COUNT(*) as total
      FROM course_status_journeys
      WHERE student_id IN (${escapedIds})
        AND course_status ILIKE '%Form%';
    `;

    const totalFormStatusResult = await sequelize.query(
      totalFormStatusCountQuery,
      {
        type: QueryTypes.SELECT,
      },
    );

    const totalFormStatusCount = totalFormStatusResult[0]?.total || 0;

    // Calculate journey statistics
    const journeyStats = {
      totalStudents: studentIds.length,
      studentsWithMultipleJourneys: 0,
      studentJourneyMap: {},
      // NEW: Add form status statistics
      formStatusStats: {
        totalFormStatusCount: totalFormStatusCount,
        studentsWithFormStatus:
          formStatusCounts.length > 0
            ? formStatusCounts[0]?.students_with_form_status || 0
            : 0,
        formStatusBreakdown: formStatusCounts.map((item) => ({
          status: item.course_status,
          count: parseInt(item.status_count),
        })),
      },
    };

    // Group journeys by student and count them
    const journeyMap = {};
    journeyDetails.forEach((journey) => {
      if (!journeyMap[journey.student_id]) {
        journeyMap[journey.student_id] = {
          student_id: journey.student_id,
          journey_count: 0,
          journeys: [],
        };
      }
      journeyMap[journey.student_id].journey_count++;
      journeyMap[journey.student_id].journeys.push(journey);
    });

    // Count students with multiple journeys
    Object.values(journeyMap).forEach((student) => {
      if (student.journey_count > 1) {
        journeyStats.studentsWithMultipleJourneys++;
      }
    });

    // Check if any student has multiple journeys
    const hasMultipleJourneys = Object.values(journeyMap).some(
      (student) => student.journey_count > 1,
    );

    return res.status(200).json({
      success: true,
      data: {
        distinctCounsellors: counsellors,
        journeyDetails: journeyDetails,
        journeyStats: journeyStats,
        hasMultipleJourneys: hasMultipleJourneys,
        journeysByStudent: journeyMap,
        // NEW: Add form status summary at the top level for easy access
        formStatusSummary: {
          totalCount: totalFormStatusCount,
          studentsWithFormStatus:
            formStatusCounts.length > 0
              ? formStatusCounts[0]?.students_with_form_status || 0
              : 0,
          breakdown: formStatusCounts.map((item) => ({
            status: item.course_status,
            count: parseInt(item.status_count),
          })),
        },
      },
      message: "L3 counsellors and latest journey details fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching distinct L3 counsellors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch L3 counsellors data",
      error: error.message,
    });
  }
};
