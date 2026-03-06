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
          'Form Submitted – Portal Pending',
          'Form Submitted – Completed',
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
      status == "Form Submitted – Portal Pending" ||
      status == "Form Submitted – Completed" ||
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
  console.log('========== COLLEGES PIVOT REPORT DEBUG ==========');
  console.log('Filters:', { startDate, endDate, firstTimeFrom, firstTimeTo });
  
  // Build the where clause for first occurrence filtering
  const firstOccurrenceWhere = {};
  
  // Add first time date range filter if provided
  if (firstTimeFrom || firstTimeTo) {
    firstOccurrenceWhere.created_at = {};
    if (firstTimeFrom) {
      const fromDateObj = new Date(firstTimeFrom + 'T00:00:00Z'); // UTC
      firstOccurrenceWhere.created_at[Op.gte] = fromDateObj;
      console.log('First time from:', fromDateObj.toISOString());
    }
    if (firstTimeTo) {
      const toDateObj = new Date(firstTimeTo + 'T23:59:59.999Z'); // UTC end of day
      firstOccurrenceWhere.created_at[Op.lte] = toDateObj;
      console.log('First time to:', toDateObj.toISOString());
    }
  }

  // Get the FIRST occurrence for each student-course combination
  console.log('Getting first occurrences...');
  const subquery = await CourseStatusHistory.findAll({
    where: firstOccurrenceWhere,
    attributes: [
      "student_id",
      "course_id",
      [Sequelize.fn("MIN", Sequelize.col("created_at")), "first_date"],
    ],
    group: ["student_id", "course_id"],
    raw: true,
  });

  console.log(`Found ${subquery.length} total student-course combinations before date filtering`);

  // Convert all dates to UTC strings to avoid timezone conversion
  const subqueryWithUTC = subquery.map(item => {
    const utcDate = new Date(item.first_date);
    return {
      ...item,
      first_date_utc: utcDate.toISOString(), // Full UTC timestamp
      first_date_only: utcDate.toISOString().split('T')[0] // YYYY-MM-DD only
    };
  });

  // Log all subquery results with UTC timestamps
  console.log('\n--- ALL SUBQUERY RESULTS (UTC) ---');
  subqueryWithUTC.forEach((item, index) => {
    console.log(`${index + 1}. Student: ${item.student_id}, Course: ${item.course_id}, UTC Date: ${item.first_date_utc}, Date Only: ${item.first_date_only}`);
  });

  if (subqueryWithUTC.length === 0) {
    console.log('No combinations found, returning empty result');
    return {
      view: "colleges-pivot",
      rows: [],
      columns: ["college", "total"],
      statuses: [],
      totals: {
        statusTotals: {},
        grandTotal: 0,
      },
    };
  }

  // Apply main date range filter if provided (filter on UTC date)
  let filteredSubquery = subqueryWithUTC;
  if (startDate || endDate) {
    console.log('\n--- APPLYING DATE FILTER (UTC) ---');
    console.log('Filter criteria:', { startDate, endDate });
    
    filteredSubquery = subqueryWithUTC.filter(item => {
      const datePart = item.first_date_only;
      let include = true;
      
      console.log(`\nChecking Student ${item.student_id}:`);
      console.log(`  UTC Date: ${item.first_date_utc}`);
      console.log(`  Date Part: ${datePart}`);
      
      if (startDate) {
        console.log(`  Start Date: ${startDate}`);
        console.log(`  Is ${datePart} >= ${startDate}? ${datePart >= startDate}`);
        if (datePart < startDate) {
          console.log(`  ❌ EXCLUDED: UTC date ${datePart} is before start date ${startDate}`);
          include = false;
        }
      }
      
      if (endDate && include) {
        console.log(`  End Date: ${endDate}`);
        console.log(`  Is ${datePart} <= ${endDate}? ${datePart <= endDate}`);
        if (datePart > endDate) {
          console.log(`  ❌ EXCLUDED: UTC date ${datePart} is after end date ${endDate}`);
          include = false;
        }
      }
      
      if (include) {
        console.log(`  ✅ INCLUDED: Student ${item.student_id} passes date filter`);
      }
      
      return include;
    });
    
    console.log(`\n--- DATE FILTER RESULTS ---`);
    console.log(`After date filtering: ${filteredSubquery.length} combinations`);
    console.log(`Filtered out ${subqueryWithUTC.length - filteredSubquery.length} combinations`);
    
    // Log which students passed/failed
    const passedIds = filteredSubquery.map(item => item.student_id);
    const failedIds = subqueryWithUTC
      .filter(item => !passedIds.includes(item.student_id))
      .map(item => item.student_id);
    
    console.log('Students PASSED:', passedIds);
    console.log('Students FAILED:', failedIds);
  }

  if (filteredSubquery.length === 0) {
    console.log('No combinations after date filtering, returning empty');
    return {
      view: "colleges-pivot",
      rows: [],
      columns: ["college", "total"],
      statuses: [],
      totals: {
        statusTotals: {},
        grandTotal: 0,
      },
    };
  }

  // Get the first status records - ONE RECORD PER STUDENT-COURSE COMBINATION
  console.log('\n--- FETCHING FIRST STATUS RECORDS ---');
  console.log('Looking for records with:');
  filteredSubquery.forEach((item, index) => {
    console.log(`  ${index + 1}. Student: ${item.student_id}, Course: ${item.course_id}, UTC Date: ${item.first_date_utc}`);
  });

  const firstRecords = await CourseStatusHistory.findAll({
    where: {
      [Op.or]: filteredSubquery.map((item) => ({
        student_id: item.student_id,
        course_id: item.course_id,
        created_at: item.first_date,
      })),
    },
    include: [
      {
        model: UniversityCourse,
        as: "university_course",
        required: true,
        where: courseWhereClause,
        attributes: ["university_name"],
      },
    ],
    attributes: [
      "student_id",
      "course_id",
      "course_status",
      "created_at",
      [Sequelize.col("university_course.university_name"), "college"],
    ],
    raw: true,
  });

  console.log(`\nRetrieved ${firstRecords.length} first status records`);

  // Convert to UTC for display
  const firstRecordsWithUTC = firstRecords.map(record => {
    const utcDate = new Date(record.created_at);
    return {
      ...record,
      created_at_utc: utcDate.toISOString(),
      created_at_date_only: utcDate.toISOString().split('T')[0]
    };
  });

  // Log all records with UTC timestamps
  console.log('\n--- ALL FIRST RECORDS WITH UTC TIMESTAMPS ---');
  const studentIdsList = [];
  firstRecordsWithUTC.forEach((record, index) => {
    console.log(`${index + 1}. Student: ${record.student_id}`);
    console.log(`   Course: ${record.course_id}`);
    console.log(`   College: "${record.college}"`);
    console.log(`   Status: "${record.course_status}"`);
    console.log(`   UTC Timestamp: ${record.created_at_utc}`);
    console.log(`   UTC Date Only: ${record.created_at_date_only}`);
    console.log('---');
    studentIdsList.push(record.student_id);
  });
  
  console.log('\n--- ALL STUDENT IDs INCLUDED IN COUNT ---');
  console.log(studentIdsList);
  console.log(`Total unique students: ${new Set(studentIdsList).size}`);

  // Process the data - count each student-course combination ONCE using UTC dates
  const collegeMap = new Map();
  const statusTotals = {};
  const studentCourseMap = new Map();

  firstRecordsWithUTC.forEach(record => {
    const college = record.college;
    const status = record.course_status;
    const studentCourseKey = `${record.student_id}_${record.course_id}`;
    const utcDate = record.created_at_date_only;
    const utcTimestamp = record.created_at_utc;

    // Track this student-course combination with UTC timestamp
    studentCourseMap.set(studentCourseKey, {
      student_id: record.student_id,
      course_id: record.course_id,
      college: college,
      status: status,
      utc_date: utcDate,
      utc_timestamp: utcTimestamp
    });

    if (!collegeMap.has(college)) {
      collegeMap.set(college, {
        college: college,
        total: 0,
        statuses: {},
        studentIds: [],
        studentUtcDates: {}
      });
    }

    const collegeData = collegeMap.get(college);
    
    // Count this student-course combination only once
    if (!collegeData.statuses[status]) {
      collegeData.statuses[status] = 0;
    }
    collegeData.statuses[status]++;
    collegeData.total++;
    collegeData.studentIds.push(record.student_id);
    collegeData.studentUtcDates[record.student_id] = {
      date: utcDate,
      timestamp: utcTimestamp
    };

    // Update status totals
    if (!statusTotals[status]) {
      statusTotals[status] = 0;
    }
    statusTotals[status]++;
  });

  // Log all student-course combinations counted with UTC dates
  console.log('\n--- ALL STUDENT-COURSE COMBINATIONS COUNTED (UTC) ---');
  console.log('Total combinations:', studentCourseMap.size);
  studentCourseMap.forEach((value, key) => {
    console.log(`Student-Course: ${key}`);
    console.log(`  College: ${value.college}`);
    console.log(`  Status: ${value.status}`);
    console.log(`  UTC Date: ${value.utc_date}`);
    console.log(`  UTC Timestamp: ${value.utc_timestamp}`);
  });

  // Log college-wise counts with student IDs and their UTC dates
  console.log('\n--- COLLEGE WISE COUNTS WITH STUDENT IDs AND UTC DATES ---');
  for (const [college, data] of collegeMap.entries()) {
    console.log(`College: "${college}"`);
    console.log(`  Total: ${data.total}`);
    console.log(`  Students with UTC Dates:`);
    data.studentIds.forEach(studentId => {
      const studentData = data.studentUtcDates[studentId];
      console.log(`    - ${studentId} @ ${studentData.date} (${studentData.timestamp})`);
    });
    console.log(`  Statuses:`, data.statuses);
  }

  // Log status totals
  console.log('\n--- STATUS TOTALS ---');
  console.log(statusTotals);

  // Get all unique statuses
  const allStatuses = Object.keys(statusTotals);

  // Convert to array format
  const rows = Array.from(collegeMap.values()).map(collegeData => {
    const row = {
      college: collegeData.college,
      total: collegeData.total
    };
    
    allStatuses.forEach(status => {
      row[status] = collegeData.statuses[status] || 0;
    });
    
    return row;
  });

  // Sort by college name
  rows.sort((a, b) => a.college.localeCompare(b.college));

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
  
  // Verify status totals sum equals grand total
  const statusSum = Object.values(statusTotals).reduce((sum, val) => sum + val, 0);
  console.log('\n--- FINAL VERIFICATION ---');
  console.log('Grand Total:', grandTotal);
  console.log('Sum of status totals:', statusSum);
  console.log('Match:', grandTotal === statusSum ? 'YES ✓' : 'NO ✗');
  
  if (grandTotal !== statusSum) {
    console.log('❌ MISMATCH DETECTED!');
    console.log('Status totals:', statusTotals);
  }

  console.log('========== END DEBUG ==========\n');

  return {
    view: "colleges-pivot",
    rows: rows,
    columns: ["college", ...allStatuses, "total"],
    statuses: allStatuses,
    totals: {
      statusTotals,
      grandTotal,
    },
    debug: {
      studentCourseCombinations: Array.from(studentCourseMap.values()),
      totalCombinations: studentCourseMap.size
    }
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
  console.log(`========== COUNSELLOR PIVOT REPORT DEBUG (${level}) ==========`);
  console.log('Filters:', { startDate, endDate, firstTimeFrom, firstTimeTo });
  
  // Build the where clause for first occurrence filtering
  const firstOccurrenceWhere = {};
  
  // Add first time date range filter if provided (using UTC)
  if (firstTimeFrom || firstTimeTo) {
    firstOccurrenceWhere.created_at = {};
    if (firstTimeFrom) {
      const fromDateObj = new Date(firstTimeFrom + 'T00:00:00Z'); // UTC
      firstOccurrenceWhere.created_at[Op.gte] = fromDateObj;
      console.log('First time from:', fromDateObj.toISOString());
    }
    if (firstTimeTo) {
      const toDateObj = new Date(firstTimeTo + 'T23:59:59.999Z'); // UTC end of day
      firstOccurrenceWhere.created_at[Op.lte] = toDateObj;
      console.log('First time to:', toDateObj.toISOString());
    }
  }

  // Get the FIRST occurrence for each student-course combination
  console.log('Getting first occurrences...');
  const subquery = await CourseStatusHistory.findAll({
    where: firstOccurrenceWhere,
    attributes: [
      "student_id",
      "course_id",
      [Sequelize.fn("MIN", Sequelize.col("created_at")), "first_date"],
    ],
    group: ["student_id", "course_id"],
    raw: true,
  });

  console.log(`Found ${subquery.length} total student-course combinations before date filtering`);

  // Convert all dates to UTC strings to avoid timezone conversion
  const subqueryWithUTC = subquery.map(item => {
    const utcDate = new Date(item.first_date);
    return {
      ...item,
      first_date_utc: utcDate.toISOString(), // Full UTC timestamp
      first_date_only: utcDate.toISOString().split('T')[0] // YYYY-MM-DD only
    };
  });

  if (subqueryWithUTC.length === 0) {
    console.log('No combinations found, returning empty result');
    return {
      view: `${level}-pivot`,
      rows: [],
      columns: ["counsellor", "total"],
      statuses: [],
      level: level,
      totals: {
        statusTotals: {},
        grandTotal: 0,
      },
    };
  }

  // Apply main date range filter if provided (using UTC dates)
  let filteredSubquery = subqueryWithUTC;
  if (startDate || endDate) {
    console.log('\n--- APPLYING DATE FILTER (UTC) ---');
    console.log('Filter criteria:', { startDate, endDate });
    
    filteredSubquery = subqueryWithUTC.filter(item => {
      const datePart = item.first_date_only;
      let include = true;
      
      if (startDate) {
        if (datePart < startDate) include = false;
      }
      
      if (endDate && include) {
        if (datePart > endDate) include = false;
      }
      
      return include;
    });
    
    console.log(`After date filtering: ${filteredSubquery.length} combinations`);
    console.log(`Filtered out ${subqueryWithUTC.length - filteredSubquery.length} combinations`);
  }

  if (filteredSubquery.length === 0) {
    console.log('No combinations after date filtering, returning empty');
    return {
      view: `${level}-pivot`,
      rows: [],
      columns: ["counsellor", "total"],
      statuses: [],
      level: level,
      totals: {
        statusTotals: {},
        grandTotal: 0,
      },
    };
  }

  // Get the first status records - ONE PER STUDENT-COURSE COMBINATION
  console.log('\n--- FETCHING FIRST STATUS RECORDS ---');
  
  const firstRecords = await CourseStatusHistory.findAll({
    where: {
      [Op.or]: filteredSubquery.map((item) => ({
        student_id: item.student_id,
        course_id: item.course_id,
        created_at: item.first_date,
      })),
    },
    include: [
      {
        model: UniversityCourse,
        as: "university_course",
        required: true,
        where: courseWhereClause,
        attributes: [],
      },
    ],
    attributes: ["student_id", "course_id", "course_status", "created_at"],
    raw: true,
  });

  console.log(`Retrieved ${firstRecords.length} first status records`);

  // Convert to UTC for processing
  const firstRecordsWithUTC = firstRecords.map(record => {
    const utcDate = new Date(record.created_at);
    return {
      ...record,
      created_at_utc: utcDate.toISOString(),
      created_at_date_only: utcDate.toISOString().split('T')[0]
    };
  });

  // Get student IDs from first records
  const studentIds = [...new Set(firstRecordsWithUTC.map((r) => r.student_id))];

  const studentCounsellorMap = {};

  if (level === "l2") {
    // For L2, use student table's assigned_counsellor_id
    const students = await Student.findAll({
      where: {
        student_id: studentIds,
      },
      attributes: ["student_id", "assigned_counsellor_id"],
      raw: true,
    });

    students.forEach((student) => {
      const counsellorId = student.assigned_counsellor_id;
      studentCounsellorMap[student.student_id] = counsellorId && counsellorId.trim() !== "" 
        ? counsellorId 
        : "unassigned";
    });
  } else {
    // For L3, get counsellor from journey table
    const journeyFirstRecords = await CourseStatusJourney.findAll({
      where: {
        student_id: studentIds,
        created_at: {
          [Op.in]: firstRecordsWithUTC.map(r => r.created_at)
        }
      },
      attributes: ["student_id", "course_id", "assigned_l3_counsellor_id"],
      raw: true,
    });

    const journeyMap = {};
    journeyFirstRecords.forEach(record => {
      const key = `${record.student_id}_${record.course_id}`;
      journeyMap[key] = record.assigned_l3_counsellor_id && record.assigned_l3_counsellor_id.trim() !== ""
        ? record.assigned_l3_counsellor_id
        : "unassigned";
    });

    firstRecordsWithUTC.forEach(record => {
      const key = `${record.student_id}_${record.course_id}`;
      studentCounsellorMap[key] = journeyMap[key] || "unassigned";
    });
  }

  // Process the data - count each student-course combination ONCE using UTC dates
  const counsellorMap = new Map();
  const statusTotals = {};
  const studentCourseMap = new Map();

  firstRecordsWithUTC.forEach((record) => {
    let counsellorId;

    if (level === "l2") {
      counsellorId = studentCounsellorMap[record.student_id] || "unassigned";
    } else {
      const key = `${record.student_id}_${record.course_id}`;
      counsellorId = studentCounsellorMap[key] || "unassigned";
    }

    const status = record.course_status;
    const studentCourseKey = `${record.student_id}_${record.course_id}`;
    const utcDate = record.created_at_date_only;
    const utcTimestamp = record.created_at_utc;

    // Track this student-course combination with UTC timestamp
    studentCourseMap.set(studentCourseKey, {
      student_id: record.student_id,
      course_id: record.course_id,
      counsellorId: counsellorId,
      status: status,
      utc_date: utcDate,
      utc_timestamp: utcTimestamp
    });

    if (!counsellorMap.has(counsellorId)) {
      counsellorMap.set(counsellorId, {
        counsellorId: counsellorId,
        total: 0,
        statuses: {},
        studentIds: [],
        studentUtcDates: {}
      });
    }

    const counsellorData = counsellorMap.get(counsellorId);
    
    // Count this student-course combination only once
    if (!counsellorData.statuses[status]) {
      counsellorData.statuses[status] = 0;
    }
    counsellorData.statuses[status]++;
    counsellorData.total++;
    counsellorData.studentIds.push(record.student_id);
    counsellorData.studentUtcDates[record.student_id] = {
      date: utcDate,
      timestamp: utcTimestamp,
      status: status
    };

    // Update status totals
    if (!statusTotals[status]) {
      statusTotals[status] = 0;
    }
    statusTotals[status]++;
  });

  // Log for debugging (optional)
  console.log(`\n--- ${level.toUpperCase()} COUNSELLOR COUNTS ---`);
  console.log('Total combinations:', studentCourseMap.size);
  
  // Get counsellor names
  const counsellorIds = Array.from(counsellorMap.keys()).filter(id => id !== "unassigned");
  const counsellorNameMap = {};

  if (counsellorIds.length > 0) {
    const counsellors = await Counsellor.findAll({
      where: {
        counsellor_id: counsellorIds,
      },
      attributes: ["counsellor_id", "counsellor_name"],
      raw: true,
    });

    counsellors.forEach((counsellor) => {
      counsellorNameMap[counsellor.counsellor_id] = counsellor.counsellor_name;
    });
  }

  const allStatuses = Object.keys(statusTotals);

  const rows = Array.from(counsellorMap.values()).map((item) => {
    let counsellorName;
    if (item.counsellorId === "unassigned") {
      counsellorName = "Unassigned";
    } else {
      counsellorName = counsellorNameMap[item.counsellorId] || `Unknown (${item.counsellorId})`;
    }

    const row = {
      counsellor: counsellorName,
      total: item.total,
    };

    allStatuses.forEach((status) => {
      row[status] = item.statuses[status] || 0;
    });

    return row;
  });

  rows.sort((a, b) => {
    if (a.counsellor === "Unassigned") return 1;
    if (b.counsellor === "Unassigned") return -1;
    return a.counsellor.localeCompare(b.counsellor);
  });

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

  console.log(`\n--- ${level.toUpperCase()} FINAL TOTALS ---`);
  console.log('Grand Total:', grandTotal);
  console.log('Status Totals:', statusTotals);
  console.log(`========== END COUNSELLOR ${level} DEBUG ==========\n`);

  return {
    view: `${level}-pivot`,
    rows: rows,
    columns: ["counsellor", ...allStatuses, "total"],
    statuses: allStatuses,
    level: level,
    totals: {
      statusTotals,
      grandTotal,
    },
    debug: {
      studentCourseCombinations: Array.from(studentCourseMap.values()),
      totalCombinations: studentCourseMap.size
    }
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
