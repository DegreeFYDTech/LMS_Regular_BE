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

// Add these functions to your counsellor controller

// Get detailed journey information for students
export const getStudentJourneyDetails = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs"
      });
    }

    const escapedIds = studentIds.map(id => `'${id}'`).join(',');

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
      type: QueryTypes.SELECT
    });

    return res.status(200).json({
      success: true,
      data: journeys,
      message: "Student journey details fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching student journey details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student journey details",
      error: error.message
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
        message: "Please provide an array of student IDs"
      });
    }

    if (!fromCounsellorId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide the source counsellor ID to replace"
      });
    }

    if (!toCounsellorId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Please provide the target counsellor ID"
      });
    }

    // Check if target counsellor exists and is L3 - using parameterized query
    const targetCounsellor = await sequelize.query(
      `SELECT counsellor_id FROM counsellors 
       WHERE counsellor_id = $1 AND role = 'l3'`,
      {
        bind: [toCounsellorId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!targetCounsellor || targetCounsellor.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Target counsellor not found or is not an L3 counsellor"
      });
    }

    // Check if fromCounsellorId exists (optional, for validation)
    if (fromCounsellorId !== 'any') { // Allow 'any' as a special value to replace regardless of current
      const fromCounsellor = await sequelize.query(
        `SELECT counsellor_id FROM counsellors 
         WHERE counsellor_id = $1 AND role = 'l3'`,
        {
          bind: [fromCounsellorId],
          type: QueryTypes.SELECT,
          transaction
        }
      );

      if (!fromCounsellor || fromCounsellor.length === 0) {
        console.warn(`Source counsellor ${fromCounsellorId} not found, but continuing with replacement`);
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
        transaction
      }
    );

    const recordsToUpdate = parseInt(countResult[0]?.count || 0);

    if (recordsToUpdate === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "No journey entries found with the specified counsellor for these students"
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
        transaction
      }
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
        recordsUpdated: recordsToUpdate
      }
    });

  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error rolling back transaction:", rollbackError);
    }

    console.error("Error replacing L3 counsellor:", error);

    // Check for connection errors
    if (error.code === 'ECONNRESET' || error.parent?.code === 'ECONNRESET') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again.",
        error: "Connection reset"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to replace L3 counsellor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
        message: "Please provide studentId, courseId, and toCounsellorId"
      });
    }

    // Check if target counsellor exists and is L3 - using parameterized query
    const targetCounsellor = await sequelize.query(
      `SELECT counsellor_id FROM counsellors 
       WHERE counsellor_id = $1 AND role = 'l3'`,
      {
        bind: [toCounsellorId],
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (!targetCounsellor || targetCounsellor.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Target counsellor not found or is not an L3 counsellor"
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
        transaction
      }
    );

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `Successfully updated counsellor for student ${studentId} and course ${courseId}`,
      data: {
        studentId,
        courseId,
        toCounsellorId,
        updated: true
      }
    });

  } catch (error) {
    try {
      await transaction.rollback();
    } catch (rollbackError) {
      console.error("Error rolling back transaction:", rollbackError);
    }

    console.error("Error replacing L3 counsellor for specific journey:", error);

    if (error.code === 'ECONNRESET' || error.parent?.code === 'ECONNRESET') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please try again.",
        error: "Connection reset"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to replace L3 counsellor",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
          "http://localhost:3032/v1/leadassignmentl3/assign",
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
        console.log(l3data.data.assigned_l3_counsellor_id)
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
        );
        break;

      case "l2":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l2",
          courseWhereClause,
        );
        break;

      case "l3":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l3",
          courseWhereClause,
        );
        break;

      default:
        result = await getCollegesPivotReport(
          whereClause,
          startDate,
          endDate,
          courseWhereClause,
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
) => {
  // First, get the latest status for each student-course combination
  const subqueryWhere = {};

  // Add date filter based on CourseStatusHistory created_at
  if (startDate || endDate) {
    subqueryWhere.created_at = {};
    if (startDate) {
      // Start from beginning of start date
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      subqueryWhere.created_at[Op.gte] = startDateObj;
    }
    if (endDate) {
      // End at beginning of next day (include full end date)
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDateObj.setHours(0, 0, 0, 0);
      subqueryWhere.created_at[Op.lt] = endDateObj;
    }
  }

  const subquery = await CourseStatusHistory.findAll({
    where: subqueryWhere,
    attributes: [
      "student_id",
      "course_id",
      [Sequelize.fn("MAX", Sequelize.col("created_at")), "latest_date"],
    ],
    group: ["student_id", "course_id"],
    raw: true,
  });

  if (subquery.length === 0) {
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

  // Get the latest status records
  const collegeData = await CourseStatusHistory.findAll({
    where: {
      [Op.or]: subquery.map((item) => ({
        student_id: item.student_id,
        course_id: item.course_id,
        created_at: item.latest_date,
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
      [Sequelize.col("university_course.university_name"), "college"],
      [Sequelize.col("course_status"), "status"],
      [Sequelize.fn("COUNT", Sequelize.col("*")), "count"],
    ],
    group: [
      Sequelize.col("university_course.university_name"),
      Sequelize.col("course_status"),
    ],
    order: [[Sequelize.col("university_course.university_name"), "ASC"]],
    raw: true,
  });

  // Get all unique statuses from data
  const statuses = [
    ...new Set(collegeData.map((item) => item.status).filter(Boolean)),
  ];

  const pivotData = {};
  const collegeTotals = {};
  const statusTotals = {};

  statuses.forEach((status) => {
    statusTotals[status] = 0;
  });

  collegeData.forEach((item) => {
    const college = item.college;
    const status = item.status;
    const count = parseInt(item.count) || 0;

    if (!pivotData[college]) {
      pivotData[college] = {
        college: college,
        total: 0,
      };
      collegeTotals[college] = 0;

      statuses.forEach((status) => {
        pivotData[college][status] = 0;
      });
    }

    if (status && pivotData[college].hasOwnProperty(status)) {
      pivotData[college][status] = count;
      pivotData[college].total += count;
      collegeTotals[college] += count;
      statusTotals[status] = (statusTotals[status] || 0) + count;
    }
  });

  const grandTotal = Object.values(collegeTotals).reduce(
    (sum, total) => sum + total,
    0,
  );

  return {
    view: "colleges-pivot",
    rows: Object.values(pivotData),
    columns: ["college", ...statuses, "total"],
    statuses: statuses,
    totals: {
      statusTotals,
      grandTotal,
    },
  };
};

const getCounsellorPivotReport = async (
  whereClause,
  startDate,
  endDate,
  level,
  courseWhereClause,
) => {
  const subqueryWhere = {};

  if (startDate || endDate) {
    subqueryWhere.created_at = {};
    if (startDate) {
      const startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0);
      subqueryWhere.created_at[Op.gte] = startDateObj;
    }
    if (endDate) {
      const endDateObj = new Date(endDate);
      endDateObj.setDate(endDateObj.getDate() + 1);
      endDateObj.setHours(0, 0, 0, 0);
      subqueryWhere.created_at[Op.lt] = endDateObj;
    }
  }

  const subquery = await CourseStatusHistory.findAll({
    where: subqueryWhere,
    attributes: [
      "student_id",
      "course_id",
      [Sequelize.fn("MAX", Sequelize.col("created_at")), "latest_date"],
    ],
    group: ["student_id", "course_id"],
    raw: true,
  });

  if (subquery.length === 0) {
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

  const latestRecords = await CourseStatusHistory.findAll({
    where: {
      [Op.or]: subquery.map((item) => ({
        student_id: item.student_id,
        course_id: item.course_id,
        created_at: item.latest_date,
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
    attributes: ["student_id", "course_id", "course_status"],
    raw: true,
  });

  // Get student IDs from latest records
  const studentIds = [...new Set(latestRecords.map((r) => r.student_id))];

  const studentCounsellorMap = {};
  const unassignedStudents = [];

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
      if (counsellorId && counsellorId.trim() !== "") {
        studentCounsellorMap[student.student_id] = counsellorId;
      } else {
        studentCounsellorMap[student.student_id] = null;
        unassignedStudents.push(student.student_id);
      }
    });
  } else {
    // For L3, get counsellor from journey table's assigned_l3_counsellor_id
    // Get the latest journey entry for each student-course combination
    const journeySubquery = await CourseStatusJourney.findAll({
      where: {
        student_id: studentIds,
      },
      attributes: [
        "student_id",
        "course_id",
        [Sequelize.fn("MAX", Sequelize.col("created_at")), "latest_date"],
      ],
      group: ["student_id", "course_id"],
      raw: true,
    });

    if (journeySubquery.length > 0) {
      const latestJourneyEntries = await CourseStatusJourney.findAll({
        where: {
          [Op.or]: journeySubquery.map((item) => ({
            student_id: item.student_id,
            course_id: item.course_id,
            created_at: item.latest_date,
          })),
        },
        attributes: ["student_id", "course_id", "assigned_l3_counsellor_id"],
        raw: true,
      });

      latestJourneyEntries.forEach((entry) => {
        const key = `${entry.student_id}_${entry.course_id}`;
        const counsellorId = entry.assigned_l3_counsellor_id;

        if (counsellorId && counsellorId.trim() !== "") {
          studentCounsellorMap[key] = counsellorId;
        } else {
          studentCounsellorMap[key] = null;
          unassignedStudents.push(`${entry.student_id} (Course: ${entry.course_id})`);
        }
      });
    }
  }

  // Log unassigned students for debugging
  if (unassignedStudents.length > 0) {
    console.log(
      `${level.toUpperCase()} Unassigned Students:`,
      unassignedStudents,
    );
  }

  const counsellorCounts = {};
  const statusTotals = {};
  const uniqueCombinations = new Set();

  latestRecords.forEach((record) => {
    let counsellorId;

    if (level === "l2") {
      // For L2, use student-level mapping
      counsellorId = studentCounsellorMap[record.student_id];
    } else {
      // For L3, use student-course level mapping
      const key = `${record.student_id}_${record.course_id}`;
      counsellorId = studentCounsellorMap[key];
    }

    const status = record.course_status;

    // Use "Unassigned" for records without counsellor
    const displayCounsellorId = counsellorId || "unassigned";

    const combinationKey = `${displayCounsellorId}_${record.student_id}_${record.course_id}`;

    if (uniqueCombinations.has(combinationKey)) {
      return;
    }
    uniqueCombinations.add(combinationKey);

    if (!counsellorCounts[displayCounsellorId]) {
      counsellorCounts[displayCounsellorId] = {
        counsellorId: displayCounsellorId,
        total: 0,
        statuses: {},
      };
    }

    if (!counsellorCounts[displayCounsellorId].statuses[status]) {
      counsellorCounts[displayCounsellorId].statuses[status] = 0;
    }

    counsellorCounts[displayCounsellorId].statuses[status]++;
    counsellorCounts[displayCounsellorId].total++;

    if (!statusTotals[status]) {
      statusTotals[status] = 0;
    }
    statusTotals[status]++;
  });

  const counsellorIds = Object.keys(counsellorCounts);

  // Get counsellor names for assigned counsellors
  const assignedCounsellorIds = counsellorIds.filter(
    (id) => id !== "unassigned",
  );
  const counsellorNameMap = {};

  if (assignedCounsellorIds.length > 0) {
    const counsellors = await Counsellor.findAll({
      where: {
        counsellor_id: assignedCounsellorIds,
      },
      attributes: ["counsellor_id", "counsellor_name"],
      raw: true,
    });

    counsellors.forEach((counsellor) => {
      counsellorNameMap[counsellor.counsellor_id] = counsellor.counsellor_name;
    });
  }

  const allStatuses = Object.keys(statusTotals);

  const rows = Object.values(counsellorCounts).map((item) => {
    let counsellorName;
    if (item.counsellorId === "unassigned") {
      counsellorName = "Unassigned";
    } else {
      counsellorName =
        counsellorNameMap[item.counsellorId] ||
        `Unknown (${item.counsellorId})`;
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
    // Put "Unassigned" at the end
    if (a.counsellor === "Unassigned") return 1;
    if (b.counsellor === "Unassigned") return -1;
    return a.counsellor.localeCompare(b.counsellor);
  });

  const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);

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
    note: level === "l3" ? "L3 counsellors mapped from journey table (student-course level)" : undefined,
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


// Update your existing getDistinctL3CounsellorsByStudentIds function
export const getDistinctL3CounsellorsByStudentIds = async (req, res) => {
  try {
    const { studentIds } = req.body;
    console.log("Received student IDs for distinct L3 counsellors:", studentIds);

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide an array of student IDs"
      });
    }

    const escapedIds = studentIds.map(id => `'${id}'`).join(',');

    // First query: Get distinct counsellors (same as before)
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
      type: QueryTypes.SELECT
    });

    // Second query: Get journey details with counts per student
    const journeyDetailsQuery = `
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
        -- Count total journeys per student
        COUNT(*) OVER (PARTITION BY csj.student_id) as student_journey_count
      FROM course_status_journeys csj
      LEFT JOIN university_courses uc ON csj.course_id = uc.course_id
      LEFT JOIN counsellors c ON csj.assigned_l3_counsellor_id = c.counsellor_id
      WHERE csj.student_id IN (${escapedIds})
      ORDER BY csj.student_id, csj.created_at DESC;
    `;

    const journeyDetails = await sequelize.query(journeyDetailsQuery, {
      type: QueryTypes.SELECT
    });

    // Calculate journey statistics
    const journeyStats = {
      totalStudents: studentIds.length,
      studentsWithMultipleJourneys: 0,
      studentJourneyMap: {}
    };

    // Group journeys by student and count them
    const journeyMap = {};
    journeyDetails.forEach(journey => {
      if (!journeyMap[journey.student_id]) {
        journeyMap[journey.student_id] = {
          student_id: journey.student_id,
          journey_count: 0,
          journeys: []
        };
      }
      journeyMap[journey.student_id].journey_count++;
      journeyMap[journey.student_id].journeys.push(journey);
    });

    // Count students with multiple journeys
    Object.values(journeyMap).forEach(student => {
      if (student.journey_count > 1) {
        journeyStats.studentsWithMultipleJourneys++;
      }
    });

    // Check if any student has multiple journeys
    const hasMultipleJourneys = Object.values(journeyMap).some(
      student => student.journey_count > 1
    );

    return res.status(200).json({
      success: true,
      data: {
        // Distinct counsellors (for the single journey replacement UI)
        distinctCounsellors: counsellors,

        // Detailed journey information (for the multiple journeys UI)
        journeyDetails: journeyDetails,

        // Journey statistics
        journeyStats: journeyStats,

        // Flag for UI to determine which view to show
        hasMultipleJourneys: hasMultipleJourneys,

        // Grouped by student for easier frontend processing
        journeysByStudent: journeyMap
      },
      message: "L3 counsellors and journey details fetched successfully"
    });

  } catch (error) {
    console.error("Error fetching distinct L3 counsellors:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch L3 counsellors data",
      error: error.message
    });
  }
};