import axios from "axios";
import ExcelJS from "exceljs";
import {
  UniversityCourse,
  CourseStatus,
  Student,
  Counsellor,
  sequelize,
  StudentRemark,
  Registration,
} from "../models/index.js";

// Normalise a university/campus name to a canonical group key
const normalizeUniv = (name) => {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  if (n.includes("lpu") || n.includes("lovely professional") || n.includes("phagwara")) return "LPU";
  if (n.includes("amity")) return "AMITY";
  if (n.includes("chandigarh university") || n.includes("landran") === false && n === "chandigarh") return "CHANDIGARH_UNIVERSITY";
  if (n.includes("chandigarh group") || n.includes("cgc") || n.includes("landran")) return "CGC";
  if (n === "chandigarh") return "CHANDIGARH_UNIVERSITY";
  return n;
};

// Fast 2-query approach — resolves paid student IDs in JS, returns literal IN list
// Query 1: fetch completed registrations (small set)
// Query 2: join students + their course universities filtered by those phones
export const getFormTypeStudentCondition = async (formType) => {
  if (!formType) return { condition: null, sqlFragment: "", ids: null };

  try {
    // ── Step 1: completed registrations → phone + normalised campus group ──────
    const completedRegs = await Registration.findAll({
      where: { paymentStatus: "COMPLETED" },
      attributes: ["mobile", "campusLocation", "collegeForApplied"],
      raw: true,
    });

    if (completedRegs.length === 0) {
      return {
        condition: formType === "paid" ? { [Op.in]: [] } : null,
        sqlFragment: formType === "paid" ? "AND 1=0" : "",
        ids: [],
      };
    }

    // phone → Set of campus groups (a student can have multiple registrations)
    const phoneGroupMap = new Map();
    completedRegs.forEach(({ mobile, campusLocation, collegeForApplied }) => {
      if (!mobile) return;
      const group = normalizeUniv(campusLocation) || normalizeUniv(collegeForApplied);
      if (!group) return;
      if (!phoneGroupMap.has(mobile)) phoneGroupMap.set(mobile, new Set());
      phoneGroupMap.get(mobile).add(group);
    });

    const phones = [...phoneGroupMap.keys()];
    if (phones.length === 0) {
      return {
        condition: formType === "paid" ? { [Op.in]: [] } : null,
        sqlFragment: formType === "paid" ? "AND 1=0" : "",
        ids: [],
      };
    }

    // ── Step 2: students matching those phones → ALL their course universities ─
    const quotedPhones = phones.map((p) => `'${p.replace(/'/g, "''")}'`).join(",");
    const rows = await sequelize.query(
      `SELECT DISTINCT s.student_id, s.student_phone, uc.university_name
       FROM students s
       JOIN course_status_journeys csj ON csj.student_id = s.student_id
       JOIN university_courses uc ON uc.course_id = csj.course_id
       WHERE s.student_phone IN (${quotedPhones})`,
      { type: QueryTypes.SELECT },
    );

    // ── Step 3: match campus group to university group in JS ──────────────────
    const paidIdSet = new Set();
    rows.forEach(({ student_id, student_phone, university_name }) => {
      const regGroups = phoneGroupMap.get(student_phone);
      if (!regGroups) return;
      const courseGroup = normalizeUniv(university_name);
      if (courseGroup && regGroups.has(courseGroup)) {
        paidIdSet.add(student_id);
      }
    });

    const paidIds = [...paidIdSet];
    const quote = (id) => `'${id.replace(/'/g, "''")}'`;

    if (formType === "paid") {
      const sqlFragment = paidIds.length > 0
        ? `AND student_id IN (${paidIds.map(quote).join(",")})`
        : "AND 1=0";
      return {
        condition: paidIds.length > 0 ? { [Op.in]: paidIds } : { [Op.in]: [] },
        sqlFragment,
        ids: paidIds,
      };
    }

    // unpaid
    const sqlFragment = paidIds.length > 0
      ? `AND student_id NOT IN (${paidIds.map(quote).join(",")})`
      : "";
    return {
      condition: paidIds.length > 0 ? { [Op.notIn]: paidIds } : null,
      sqlFragment,
      ids: paidIds,
    };
  } catch (err) {
    return { condition: null, sqlFragment: "", ids: null };
  }
};
import { col, fn, literal, Op, QueryTypes, Sequelize } from "sequelize";
import CourseStatusJourney from "../models/course_status_jounreny.js";
import { convertToCSV } from "../helper/csv_helper.js";
import GenerateEmailFunction from "../utils/email/TriggerEmail.js";

const APPLICATION_STATUSES = [
  "Form Submitted – Portal Pending",
  "Form Submitted – Completed",
  "Form Submitted – Offline",
  "Form Filled_Partner website",
  "Form Filled_Degreefyd",
  "Walkin Completed",
  "Exam Interview Pending",
  "Exam/Interview Pending",
  "Exam/Interview Scheduled",
  "Offer Letter/Results Pending",
  "Offer Letter/Results Released",
  "Ready For Admission",
  "Application Fee Paid",
];

const ACTIVE_FORM_STATUSES_SQL = `'Exam Interview Pending','Ready For Admission','Offer Letter/Results Pending','Form Filled_Partner website','Form Submitted – Portal Pending','Offer Letter/Results Released','Application Fee Paid','Walkin Completed','Form Submitted – Offline','Form Filled_Degreefyd','Exam/Interview Scheduled','Form Submitted – Completed'`;

const COUNSELLOR_BUCKET_WHERE = {
  total_forms: `1=1`,
  active_forms: `b.latest_status IN (${ACTIVE_FORM_STATUSES_SQL})`,
  not_initiated_count: `b.first_remark_date IS NULL`,
  called_within_3_days: `b.first_remark_date IS NOT NULL AND b.days_to_first_action BETWEEN 0 AND 3`,
  called_4_to_6_days: `b.first_remark_date IS NOT NULL AND b.days_to_first_action BETWEEN 4 AND 6`,
  called_7_plus_days: `b.first_remark_date IS NOT NULL AND b.days_to_first_action >= 7`,
};

// Single controller for the Counsellor Performance Dashboard — type=summary (default) for the
// grouped table, type=raw for the (unpaginated, client-paginated) drilldown, type=export for the
// full xlsx download. All three share the same base CTEs (mirrors ActiveFormReportController.js).
export const getCounsellorStats = async (req, res) => {
  const { start_date, end_date, counsellor_id, form_type, type = "summary", bucket } = req.query;

  try {
    const { sqlFragment: formTypeSql } = await getFormTypeStudentCondition(form_type);

    const cteDateFilter = start_date && end_date
      ? `WHERE (first_status_date AT TIME ZONE 'Asia/Kolkata')::date BETWEEN '${start_date}' AND '${end_date}'`
      : "";

    let counsellorFilter = "";
    if (counsellor_id === "Unassigned") {
      counsellorFilter = ` AND fs.assigned_l3_counsellor_id IS NULL `;
    } else if (counsellor_id) {
      counsellorFilter = ` AND fs.assigned_l3_counsellor_id = '${counsellor_id}' `;
    }

    if (type === "raw" || type === "export") {
      if (type === "raw" && (!counsellor_id || !bucket)) {
        return res.status(400).json({ success: false, message: "counsellor_id and bucket are required" });
      }
      if (bucket && !COUNSELLOR_BUCKET_WHERE[bucket]) {
        return res.status(400).json({ success: false, message: "Invalid bucket" });
      }
      const bucketFilter = COUNSELLOR_BUCKET_WHERE[bucket] || "1=1";

      const rows = await sequelize.query(
        `
        WITH
        first_status_ever AS (
          SELECT DISTINCT ON (student_id, course_id)
              student_id,
              course_id,
              course_status,
              created_at AS first_status_date,
              counsellor_id AS status_created_by,
              assigned_l3_counsellor_id
          FROM course_status_journeys
          WHERE course_status IN (${ACTIVE_FORM_STATUSES_SQL})
          ${formTypeSql}
          ORDER BY student_id, course_id, created_at ASC
        ),
        first_status AS (
          SELECT * FROM first_status_ever
          ${cteDateFilter}
        ),
        first_remark_by_l3 AS (
          SELECT DISTINCT ON (fs.student_id, fs.course_id)
              fs.student_id,
              fs.course_id,
              sr.created_at AS first_remark_date
          FROM first_status fs
          LEFT JOIN student_remarks sr
              ON sr.student_id = fs.student_id
              AND sr.counsellor_id = fs.assigned_l3_counsellor_id
          ORDER BY fs.student_id, fs.course_id, sr.created_at ASC
        ),
        latest_status AS (
          SELECT DISTINCT ON (student_id, course_id)
              student_id,
              course_id,
              course_status AS latest_status
          FROM course_status_journeys
          ORDER BY student_id, course_id, created_at DESC
        ),
        base AS (
          SELECT
              fs.student_id,
              fs.course_id,
              fs.first_status_date,
              fs.assigned_l3_counsellor_id,
              fr.first_remark_date,
              ls.latest_status,
              CASE
                  WHEN fr.first_remark_date IS NOT NULL
                  THEN GREATEST(0, EXTRACT(DAY FROM (fr.first_remark_date - fs.first_status_date)))
                  ELSE NULL
              END AS days_to_first_action,
              c.counsellor_name
          FROM first_status fs
          LEFT JOIN first_remark_by_l3 fr ON fs.student_id = fr.student_id AND fs.course_id = fr.course_id
          LEFT JOIN latest_status ls ON fs.student_id = ls.student_id AND fs.course_id = ls.course_id
          LEFT JOIN counsellors c ON fs.assigned_l3_counsellor_id = c.counsellor_id
          WHERE ${!counsellor_id ? "1=1" : counsellor_id === "Unassigned" ? "fs.assigned_l3_counsellor_id IS NULL" : "fs.assigned_l3_counsellor_id = :counsellorId"}
        )
        SELECT
          b.student_id,
          b.course_id,
          b.first_status_date,
          b.first_remark_date,
          b.latest_status,
          b.days_to_first_action,
          s.student_name,
          s.student_phone,
          s.student_email,
          s.source,
          COALESCE(b.counsellor_name, 'Unassigned') AS counsellor_name,
          uc.university_name,
          uc.course_name
        FROM base b
        INNER JOIN students s ON s.student_id = b.student_id
        LEFT JOIN university_courses uc ON uc.course_id = b.course_id
        WHERE ${bucketFilter}
        ORDER BY b.first_status_date DESC
        `,
        {
          replacements: { counsellorId: counsellor_id === "Unassigned" ? null : counsellor_id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (type === "export") {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Counsellor Performance");

        sheet.columns = [
          { header: "Student ID", key: "student_id", width: 20 },
          { header: "Name", key: "student_name", width: 25 },
          { header: "Phone", key: "student_phone", width: 18 },
          { header: "Email", key: "student_email", width: 28 },
          { header: "Source", key: "source", width: 18 },
          { header: "University", key: "university_name", width: 30 },
          { header: "Course", key: "course_name", width: 30 },
          { header: "Assigned L3", key: "counsellor_name", width: 22 },
          { header: "Latest Status", key: "latest_status", width: 28 },
          { header: "First Status Date", key: "first_status_date", width: 20 },
          { header: "First Remark Date", key: "first_remark_date", width: 20 },
          { header: "Days To First Action", key: "days_to_first_action", width: 18 },
        ];

        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B0082" } };

        rows.forEach((row) => sheet.addRow(row));

        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", `attachment; filename="counsellor_performance_${start_date || "all"}_to_${end_date || "all"}.xlsx"`);
        await workbook.xlsx.write(res);
        return res.end();
      }

      return res.json({ success: true, data: rows });
    }

    const stats = await sequelize.query(
      `
      WITH
      -- First active-status entry EVER for each student-course (no date filter)
      first_status_ever AS (
        SELECT DISTINCT ON (student_id, course_id)
            student_id,
            course_id,
            course_status,
            created_at AS first_status_date,
            counsellor_id AS status_created_by,
            assigned_l3_counsellor_id
        FROM course_status_journeys
        WHERE course_status IN (
            'Exam Interview Pending',
            'Ready For Admission',
            'Offer Letter/Results Pending',
            'Form Filled_Partner website',
            'Form Submitted – Portal Pending',
            'Offer Letter/Results Released',
            'Application Fee Paid',
            'Walkin Completed',
            'Form Submitted – Offline',
            'Form Filled_Degreefyd',
            'Exam/Interview Scheduled',
            'Form Submitted – Completed'
        )
        ${formTypeSql}
        ORDER BY student_id, course_id, created_at ASC
      ),
      -- Keep only those whose first-ever entry falls within the requested date range
      first_status AS (
        SELECT * FROM first_status_ever
        ${cteDateFilter}
      ),

      -- Get FIRST remark by the ASSIGNED L3 COUNSELLOR for each student-course
      first_remark_by_l3 AS (
        SELECT DISTINCT ON (fs.student_id, fs.course_id)
            fs.student_id,
            fs.course_id,
            sr.created_at AS first_remark_date
        FROM first_status fs
        LEFT JOIN student_remarks sr 
            ON sr.student_id = fs.student_id 
            AND sr.counsellor_id = fs.assigned_l3_counsellor_id  -- Only remarks by the assigned L3 counsellor
        ORDER BY fs.student_id, fs.course_id, sr.created_at ASC
      ),

      -- Get latest status for active check
      latest_status AS (
        SELECT DISTINCT ON (student_id, course_id)
            student_id,
            course_id,
            course_status AS latest_status
        FROM course_status_journeys
        ORDER BY student_id, course_id, created_at DESC
      ),

      -- Base table: all student-course combos that entered an active status
      base AS (
        SELECT
            fs.student_id,
            fs.course_id,
            fs.first_status_date,
            fs.status_created_by,
            fs.assigned_l3_counsellor_id,
            fr.first_remark_date,
            ls.latest_status,
            CASE
                WHEN fr.first_remark_date IS NOT NULL
                THEN GREATEST(0, EXTRACT(DAY FROM (fr.first_remark_date - fs.first_status_date)))
                ELSE NULL
            END AS days_to_first_action,
            c.counsellor_name,
            CONCAT(fs.student_id, '_', fs.course_id) AS student_course_key
        FROM first_status fs
        LEFT JOIN first_remark_by_l3 fr ON fs.student_id = fr.student_id AND fs.course_id = fr.course_id
        LEFT JOIN latest_status ls ON fs.student_id = ls.student_id AND fs.course_id = ls.course_id
        LEFT JOIN counsellors c ON fs.assigned_l3_counsellor_id = c.counsellor_id
        WHERE 1=1
        ${counsellorFilter}
      )

      SELECT 
          COALESCE(b.assigned_l3_counsellor_id, 'Unassigned') AS assigned_l3_counsellor_id,
          COALESCE(b.counsellor_name, 'Unassigned') AS counsellor_name,
          
          -- TOTAL FORMS: All combinations for this L3 counsellor
          COUNT(DISTINCT b.student_course_key) AS total_forms,
          
          -- ACTIVE FORMS: Where latest status is one of the 12 active form statuses
          COUNT(DISTINCT CASE
              WHEN b.latest_status IN (
                'Exam Interview Pending',
                'Ready For Admission',
                'Offer Letter/Results Pending',
                'Form Filled_Partner website',
                'Form Submitted – Portal Pending',
                'Offer Letter/Results Released',
                'Application Fee Paid',
                'Walkin Completed',
                'Form Submitted – Offline',
                'Form Filled_Degreefyd',
                'Exam/Interview Scheduled',
                'Form Submitted – Completed'
              )
              THEN b.student_course_key
          END) AS active_forms,
          
          -- NOT INITIATED: NO remark from assigned L3 counsellor
          COUNT(DISTINCT CASE 
              WHEN b.first_remark_date IS NULL 
              THEN b.student_course_key 
          END) AS not_initiated_count,
          
          -- CALLED WITHIN 3 DAYS: First remark by L3 counsellor within 3 days (including before status)
          COUNT(DISTINCT CASE 
              WHEN b.first_remark_date IS NOT NULL 
              AND b.days_to_first_action BETWEEN 0 AND 3
              THEN b.student_course_key 
          END) AS called_within_3_days,
          
          -- CALLED 4-6 DAYS: First remark by L3 counsellor 4-6 days after status
          COUNT(DISTINCT CASE 
              WHEN b.first_remark_date IS NOT NULL 
              AND b.days_to_first_action BETWEEN 4 AND 6
              THEN b.student_course_key 
          END) AS called_4_to_6_days,
          
          -- CALLED 7+ DAYS: First remark by L3 counsellor 7+ days after status
          COUNT(DISTINCT CASE 
              WHEN b.first_remark_date IS NOT NULL 
              AND b.days_to_first_action >= 7
              THEN b.student_course_key 
          END) AS called_7_plus_days
          
      FROM base b
      GROUP BY b.assigned_l3_counsellor_id, b.counsellor_name
      ORDER BY total_forms DESC;
    `,
      {
        type: sequelize.QueryTypes.SELECT,
      },
    );

    return res.status(200).json({
      success: true,
      data: stats,
      message: "Counsellor statistics fetched successfully",
      filters: { start_date, end_date, counsellor_id },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch counsellor statistics",
      error: error.message,
    });
  }
};

export const getFormData = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      college,
      course,
      leadSubStatus,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Build filter conditions
    const whereConditions = [];
    const replacements = {
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    // College filter
    if (college) {
      const colleges = college.split(',');
      whereConditions.push(`uc.university_name IN (:college)`);
      replacements.college = colleges;
    }
    
    // Course filter
    if (course) {
      const courses = course.split(',');
      whereConditions.push(`uc.course_name IN (:course)`);
      replacements.course = courses;
    }
    
    // Search filter
    if (search) {
      whereConditions.push(`(
        s.student_name ILIKE :search OR 
        s.student_email ILIKE :search OR 
        s.student_phone ILIKE :search
      )`);
      replacements.search = `%${search}%`;
    }

    // Lead sub status filter
    let leadSubStatusCondition = '';
    if (leadSubStatus) {
      const subStatuses = leadSubStatus.split(',');
      leadSubStatusCondition = `AND EXISTS (
        SELECT 1 FROM student_remarks sr 
        WHERE sr.student_id = cj.student_id 
        AND sr.lead_sub_status IN (:leadSubStatus)
        AND sr.created_at = (
          SELECT MAX(created_at) 
          FROM student_remarks sr2 
          WHERE sr2.student_id = cj.student_id
        )
      )`;
      replacements.leadSubStatus = subStatuses;
    }

    const whereClause = whereConditions.length > 0 
      ? 'AND ' + whereConditions.join(' AND ') 
      : '';

    // Get total count of distinct student-course combinations
    const countQuery = `
      SELECT COUNT(DISTINCT cj.student_id || '-' || cj.course_id) as total
      FROM course_status_journeys cj
      INNER JOIN students s ON s.student_id = cj.student_id
      INNER JOIN university_courses uc ON uc.course_id = cj.course_id
      WHERE 1=1
      ${whereClause}
      ${leadSubStatusCondition}
    `;

    // Get paginated distinct student-course combinations with their latest created_at
    const paginatedQuery = `
      WITH ranked_course_status AS (
        SELECT 
          cj.student_id,
          cj.course_id,
          cj.created_at,
          ROW_NUMBER() OVER (PARTITION BY cj.student_id, cj.course_id ORDER BY cj.created_at DESC) as rn
        FROM course_status_journeys cj
        INNER JOIN students s ON s.student_id = cj.student_id
        INNER JOIN university_courses uc ON uc.course_id = cj.course_id
        WHERE 1=1
        ${whereClause}
        ${leadSubStatusCondition}
      )
      SELECT 
        student_id,
        course_id
      FROM ranked_course_status
      WHERE rn = 1
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    // Get the paginated combinations
    const paginatedCombinations = await sequelize.query(paginatedQuery, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });

    if (paginatedCombinations.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            total: 0,
            fresh: 0,
            admission: 0,
            enrollment: 0
          },
          students: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    }

    // Create a temporary table with the paginated combinations
    const combinationValues = paginatedCombinations
      .map(comb => `('${comb.student_id}', '${comb.course_id}')`)
      .join(',');

    // Main query - FIXED: Get everything in one go without separate CTEs that might cause duplicates
    const mainQuery = `
      WITH paginated_combinations AS (
        SELECT * FROM (VALUES ${combinationValues}) AS t(student_id, course_id)
      ),
      latest_course_status AS (
        SELECT DISTINCT ON (cj.student_id, cj.course_id)
          cj.status_history_id,
          cj.student_id,
          cj.course_id,
          cj.counsellor_id,
          cj.course_status,
          cj.deposit_amount,
          cj.currency,
          cj.exam_interview_date,
          cj.last_admission_date,
          cj.notes,
          cj.assigned_l3_counsellor_id,
          cj.created_at
        FROM course_status_journeys cj
        INNER JOIN paginated_combinations pc ON pc.student_id = cj.student_id AND pc.course_id = cj.course_id
        ORDER BY cj.student_id, cj.course_id, cj.created_at DESC
      ),
      -- Combine fresh status directly without a separate CTE that might cause duplicates
      student_data AS (
        SELECT 
          lcs.*,
          s.student_name,
          s.student_email,
          s.student_phone,
          s.parents_number,
          s.whatsapp,
          s.assigned_counsellor_id,
          s.assigned_counsellor_l3_id,
          s.highest_degree,
          s.completion_year,
          s.current_profession,
          s.current_role,
          s.work_experience,
          s.student_age,
          s.objective,
          s.mode,
          s.preferred_stream,
          s.preferred_budget,
          s.preferred_degree,
          s.preferred_level,
          s.preferred_specialization,
          s.preferred_city,
          s.preferred_state,
          s.preferred_university,
          s.source as student_source,
          s.first_source_url,
          s.created_at as student_created_at,
          
          -- University Course details
          uc.university_name,
          uc.university_state,
          uc.university_city,
          uc.degree_name,
          uc.specialization,
          uc.stream,
          uc.level,
          uc.course_name,
          uc.total_fees,
          uc.semester_fees,
          uc.annual_fees,
          uc.study_mode,
          uc.duration,
          uc.duration_type,
          uc.brochure_url,
          uc.usp,
          uc.eligibility,
          
          -- Latest remark
          lr.remark_id as latest_remark_id,
          lr.lead_status as latest_lead_status,
          lr.lead_sub_status as latest_lead_sub_status,
          lr.calling_status as latest_calling_status,
          lr.sub_calling_status as latest_sub_calling_status,
          lr.remarks as latest_remarks,
          lr.callback_date as latest_callback_date,
          lr.callback_time as latest_callback_time,
          lr.created_at as latest_remark_created_at,
          
          -- First activity
          fa.source as first_activity_source,
          fa.utm_source as first_utm_source,
          fa.utm_medium as first_utm_medium,
          fa.utm_campaign as first_utm_campaign,
          fa.utm_keyword as first_utm_keyword,
          fa.source_url as first_source_url,
          fa.created_at as first_activity_created_at,
          
          -- Fresh status - calculate directly without separate CTE
          CASE 
            WHEN lcs.assigned_l3_counsellor_id IS NOT NULL 
             AND NOT EXISTS (
              SELECT 1 FROM student_remarks sr 
              WHERE sr.student_id = lcs.student_id 
              AND sr.counsellor_id = lcs.assigned_l3_counsellor_id
            ) THEN 1 ELSE 0 
          END as is_fresh,
          
          -- Counsellor details
          c2.counsellor_name as l2_counsellor_name,
          c2.counsellor_email as l2_counsellor_email,
          c2.role as l2_counsellor_role,
          c3.counsellor_name as l3_counsellor_name,
          c3.counsellor_email as l3_counsellor_email,
          c3.role as l3_counsellor_role
          
        FROM latest_course_status lcs
        INNER JOIN students s ON s.student_id = lcs.student_id
        INNER JOIN university_courses uc ON uc.course_id = lcs.course_id
        LEFT JOIN counsellors c2 ON c2.counsellor_id = s.assigned_counsellor_id
        LEFT JOIN counsellors c3 ON c3.counsellor_id = s.assigned_counsellor_l3_id
        LEFT JOIN LATERAL (
          SELECT * FROM student_remarks sr 
          WHERE sr.student_id = lcs.student_id 
          ORDER BY sr.created_at DESC 
          LIMIT 1
        ) lr ON true
        LEFT JOIN LATERAL (
          SELECT * FROM student_lead_activities sla 
          WHERE sla.student_id = lcs.student_id 
          ORDER BY sla.created_at ASC 
          LIMIT 1
        ) fa ON true
      )
      SELECT * FROM student_data
      ORDER BY created_at DESC
    `;

    // Stats query - FIXED: Use LATERAL joins to avoid duplicates
    const statsQuery = `
      WITH filtered_combinations AS (
        SELECT DISTINCT cj.student_id, cj.course_id
        FROM course_status_journeys cj
        INNER JOIN students s ON s.student_id = cj.student_id
        INNER JOIN university_courses uc ON uc.course_id = cj.course_id
        WHERE 1=1
        ${whereClause}
        ${leadSubStatusCondition}
      ),
      combination_stats AS (
        SELECT 
          fc.student_id,
          fc.course_id,
          (
            SELECT lead_status 
            FROM student_remarks sr 
            WHERE sr.student_id = fc.student_id 
            ORDER BY sr.created_at DESC 
            LIMIT 1
          ) as latest_lead_status,
          CASE 
            WHEN EXISTS (
              SELECT 1 FROM course_status_journeys cj 
              WHERE cj.student_id = fc.student_id 
              AND cj.course_id = fc.course_id
              AND cj.assigned_l3_counsellor_id IS NOT NULL
              AND NOT EXISTS (
                SELECT 1 FROM student_remarks sr 
                WHERE sr.student_id = cj.student_id 
                AND sr.counsellor_id = cj.assigned_l3_counsellor_id
              )
            ) THEN 1 ELSE 0 
          END as is_fresh
        FROM filtered_combinations fc
      )
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN latest_lead_status = 'Admission' THEN 1 END) as admission,
        COUNT(CASE WHEN latest_lead_status = 'Enrollment' THEN 1 END) as enrollment,
        SUM(is_fresh) as fresh
      FROM combination_stats
    `;

    // Execute queries in parallel
    const [mainResult, countResult, statsResult] = await Promise.all([
      sequelize.query(mainQuery, {
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(countQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      }),
      sequelize.query(statsQuery, {
        replacements,
        type: sequelize.QueryTypes.SELECT
      })
    ]);

    const totalCount = parseInt(countResult[0]?.total || 0);
    const stats = statsResult[0] || { total: 0, admission: 0, enrollment: 0, fresh: 0 };

    // Format response
    const formattedStudents = mainResult.map(row => ({
      statusHistoryId: row.status_history_id,
      studentId: row.student_id,
      courseId: row.course_id,
      counsellorId: row.counsellor_id,
      courseStatus: row.course_status,
      depositAmount: row.deposit_amount,
      currency: row.currency,
      examInterviewDate: row.exam_interview_date,
      lastAdmissionDate: row.last_admission_date,
      notes: row.notes,
      assignedL3CounsellorId: row.assigned_l3_counsellor_id,
      createdAt: row.created_at,
      
      student: {
        studentId: row.student_id,
        studentName: row.student_name,
        studentEmail: row.student_email,
        studentPhone: row.student_phone,
        parentsNumber: row.parents_number,
        whatsapp: row.whatsapp,
        assignedCounsellorId: row.assigned_counsellor_id,
        assignedCounsellorL3Id: row.assigned_counsellor_l3_id,
        highestDegree: row.highest_degree,
        completionYear: row.completion_year,
        currentProfession: row.current_profession,
        currentRole: row.current_role,
        workExperience: row.work_experience,
        studentAge: row.student_age,
        objective: row.objective,
        mode: row.mode,
        preferredStream: row.preferred_stream,
        preferredBudget: row.preferred_budget,
        preferredDegree: row.preferred_degree,
        preferredLevel: row.preferred_level,
        preferredSpecialization: row.preferred_specialization,
        preferredCity: row.preferred_city,
        preferredState: row.preferred_state,
        preferredUniversity: row.preferred_university,
        source: row.student_source,
        firstSourceUrl: row.first_source_url,
        createdAt: row.student_created_at
      },
      
      universityCourse: {
        courseId: row.course_id,
        universityName: row.university_name,
        universityState: row.university_state,
        universityCity: row.university_city,
        degreeName: row.degree_name,
        specialization: row.specialization,
        stream: row.stream,
        level: row.level,
        courseName: row.course_name,
        totalFees: row.total_fees,
        semesterFees: row.semester_fees,
        annualFees: row.annual_fees,
        studyMode: row.study_mode,
        duration: row.duration,
        durationType: row.duration_type,
        brochureUrl: row.brochure_url,
        usp: row.usp,
        eligibility: row.eligibility
      },
      
      latestRemark: row.latest_remark_id ? {
        remarkId: row.latest_remark_id,
        leadStatus: row.latest_lead_status,
        leadSubStatus: row.latest_lead_sub_status,
        callingStatus: row.latest_calling_status,
        subCallingStatus: row.latest_sub_calling_status,
        remarks: row.latest_remarks,
        callbackDate: row.latest_callback_date,
        callbackTime: row.latest_callback_time,
        createdAt: row.latest_remark_created_at
      } : null,
      
      firstLeadActivity: row.first_activity_source ? {
        source: row.first_activity_source,
        utmSource: row.first_utm_source,
        utmMedium: row.first_utm_medium,
        utmCampaign: row.first_utm_campaign,
        utmKeyword: row.first_utm_keyword,
        sourceUrl: row.first_source_url,
        createdAt: row.first_activity_created_at
      } : null,
      
      isFresh: row.is_fresh === 1,
      l2CounsellorName: row.l2_counsellor_name,
      l3CounsellorName: row.l3_counsellor_name
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          total: parseInt(stats.total || 0),
          fresh: parseInt(stats.fresh || 0),
          admission: parseInt(stats.admission || 0),
          enrollment: parseInt(stats.enrollment || 0)
        },
        students: formattedStudents,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};


// ─────────────────────────────────────────────────────────────────────────
// Form to Admissions report shared core. The raw drilldown and the summary
// aggregation must use the exact same "who counts as a form" / "who counts
// as admitted" CTEs, or their numbers drift apart — this already happened
// once (the drilldown's CTEs were missing the form_type filter the summary
// applied). Build them here once; every branch interpolates this same
// string. Change eligibility/admission-status logic ONLY here.
// ─────────────────────────────────────────────────────────────────────────

const buildFormToAdmissionsCTEs = (formTypeSql) => `
  form_statuses AS (
    SELECT unnest(ARRAY[
      'Form Submitted – Portal Pending',
      'Form Submitted – Completed',
      'Walkin Completed',
      'Exam Interview Pending',
      'Exam/Interview Pending',
      'Exam/Interview Scheduled',
      'Offer Letter/Results Pending',
      'Offer Letter/Results Released',
      'Ready For Admission',
      'Form Filled_Partner website',
      'Form Filled_Degreefyd',
      'Application Fee Paid',
      'Form Submitted – Offline'
    ]) AS status
  ),
  admission_statuses AS (
    SELECT unnest(ARRAY[
      'Registration done',
      'Semester fee paid',
      'Partially Paid',
      'Admission Blocked',
      'Admission'
    ]) AS status
  ),
  first_form_ever AS (
    SELECT DISTINCT ON (student_id, course_id)
      student_id,
      course_id,
      assigned_l3_counsellor_id,
      (created_at + interval '5 hours 30 minutes')::date AS form_date
    FROM course_status_journeys
    WHERE course_status IN (SELECT status FROM form_statuses)
    ${formTypeSql}
    ORDER BY student_id, course_id, created_at ASC
  ),
  got_admission_ever AS (
    SELECT DISTINCT ON (student_id, course_id)
      student_id,
      course_id,
      (created_at + interval '5 hours 30 minutes')::date AS admission_date
    FROM course_status_journeys
    WHERE course_status IN (SELECT status FROM admission_statuses)
    ${formTypeSql}
    ORDER BY student_id, course_id, created_at ASC
  )
`;

// Which calendar month to attribute a date range to: if the range spans two
// months, use whichever month has the majority of the range in it (start
// month, unless fewer than 7 days of it remain — then end month).
const computeReportMonthDate = (start_date, end_date) => {
  const startD = new Date(start_date + 'T00:00:00');
  const endD   = new Date(end_date   + 'T00:00:00');
  if (startD.getMonth() === endD.getMonth() && startD.getFullYear() === endD.getFullYear()) {
    return startD;
  }
  const lastDayOfStartMonth = new Date(startD.getFullYear(), startD.getMonth() + 1, 0).getDate();
  const daysLeftInStartMonth = lastDayOfStartMonth - startD.getDate();
  return daysLeftInStartMonth < 7 ? startD : endD;
};

export const getFormToAdmissionsReport = async (req, res) => {
  try {
    const { start_date, end_date, group_by = 'college', type, college_name, metric, form_type } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: "Please provide start_date and end_date parameters (YYYY-MM-DD)",
      });
    }

    const { sqlFragment: formTypeSql } = await getFormTypeStudentCondition(form_type);
    const cteSQL = buildFormToAdmissionsCTEs(formTypeSql);

    const pad = (n) => String(n).padStart(2, '0');
    const reportMonthDate = computeReportMonthDate(start_date, end_date);
    const reportYear  = reportMonthDate.getFullYear();
    const reportMonth = reportMonthDate.getMonth();
    const monthStart  = `${reportYear}-${pad(reportMonth + 1)}-01`;
    const monthEnd    = `${reportYear}-${pad(reportMonth + 1)}-${pad(new Date(reportYear, reportMonth + 1, 0).getDate())}`;
    const yearStart   = `${reportYear}-01-01`;
    const yearEnd     = `${reportYear}-12-31`;
    const groupByL3   = group_by === 'l3';

    // ── RAW DRILL-DOWN ──────────────────────────────────────────────────────────
    if (type === 'raw' && college_name && metric) {
      const metricConfig = {
        range_forms:       { dateStart: start_date, dateEnd: end_date,  admissionOnly: false },
        range_admissions:  { dateStart: start_date, dateEnd: end_date,  admissionOnly: true  },
        month_forms:       { dateStart: monthStart,  dateEnd: monthEnd,  admissionOnly: false },
        month_admissions:  { dateStart: monthStart,  dateEnd: monthEnd,  admissionOnly: true  },
        year_forms:        { dateStart: yearStart,   dateEnd: yearEnd,   admissionOnly: false },
        year_admissions:   { dateStart: yearStart,   dateEnd: yearEnd,   admissionOnly: true  },
      };

      const cfg = metricConfig[metric];
      if (!cfg) {
        return res.status(400).json({ success: false, message: `Invalid metric: ${metric}` });
      }

      const groupFilter = groupByL3
        ? `COALESCE(co.counsellor_name, 'Unassigned') = :collegeName`
        : `uc.university_name = :collegeName`;

      const admissionJoin = cfg.admissionOnly
        ? `INNER JOIN got_admission_ever ga ON ffd.student_id = ga.student_id AND ffd.course_id = ga.course_id`
        : `LEFT JOIN got_admission_ever ga ON ffd.student_id = ga.student_id AND ffd.course_id = ga.course_id`;

      const rawQuery = `
        WITH
        ${cteSQL}
        SELECT
          ffd.student_id,
          s.student_name,
          uc.university_name  AS college_name,
          uc.course_name,
          ffd.form_date       AS form_filled_date,
          ga.admission_date,
          COALESCE(co.counsellor_name, 'Unassigned') AS assigned_l3_name
        FROM first_form_ever ffd
        JOIN university_courses uc ON ffd.course_id = uc.course_id
        JOIN students s             ON ffd.student_id = s.student_id
        ${admissionJoin}
        LEFT JOIN counsellors co    ON ffd.assigned_l3_counsellor_id = co.counsellor_id
        WHERE ${groupFilter}
          AND ffd.form_date BETWEEN :dateStart::date AND :dateEnd::date
        ORDER BY ffd.form_date DESC;
      `;

      const rows = await sequelize.query(rawQuery, {
        replacements: {
          collegeName: college_name,
          dateStart: cfg.dateStart,
          dateEnd: cfg.dateEnd,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      return res.status(200).json({ success: true, data: rows });
    }
    // ── END RAW DRILL-DOWN ──────────────────────────────────────────────────────

    const monthName = reportMonthDate.toLocaleString('en-US', { month: 'long' });
    const rangeStart = start_date;
    const rangeEnd = end_date;

    const combinedCTE = groupByL3
      ? `combined AS (
          SELECT
            ffd.student_id,
            ffd.course_id,
            ffd.form_date,
            COALESCE(c.counsellor_name, 'Unassigned') AS group_label,
            CASE WHEN ga.student_id IS NOT NULL THEN 1 ELSE 0 END AS converted
          FROM first_form_ever ffd
          LEFT JOIN counsellors c ON ffd.assigned_l3_counsellor_id = c.counsellor_id
          LEFT JOIN got_admission_ever ga
            ON ffd.student_id = ga.student_id AND ffd.course_id = ga.course_id
        )`
      : `combined AS (
          SELECT
            ffd.student_id,
            ffd.course_id,
            ffd.form_date,
            uc.university_name AS group_label,
            CASE WHEN ga.student_id IS NOT NULL THEN 1 ELSE 0 END AS converted
          FROM first_form_ever ffd
          JOIN university_courses uc ON ffd.course_id = uc.course_id
          LEFT JOIN got_admission_ever ga
            ON ffd.student_id = ga.student_id AND ffd.course_id = ga.course_id
        )`;

    const query = `
      WITH
      ${cteSQL},
      ${combinedCTE}
      SELECT
        group_label AS college_name,
        COUNT(DISTINCT CASE WHEN form_date BETWEEN :rangeStart::date AND :rangeEnd::date
          THEN student_id||'-'||course_id END) AS range_forms,
        COUNT(DISTINCT CASE WHEN form_date BETWEEN :rangeStart::date AND :rangeEnd::date AND converted = 1
          THEN student_id||'-'||course_id END) AS range_admissions,
        COUNT(DISTINCT CASE WHEN form_date BETWEEN :monthStart::date AND :monthEnd::date
          THEN student_id||'-'||course_id END) AS month_forms,
        COUNT(DISTINCT CASE WHEN form_date BETWEEN :monthStart::date AND :monthEnd::date AND converted = 1
          THEN student_id||'-'||course_id END) AS month_admissions,
        COUNT(DISTINCT CASE WHEN form_date BETWEEN :yearStart::date AND :yearEnd::date
          THEN student_id||'-'||course_id END) AS year_forms,
        COUNT(DISTINCT CASE WHEN form_date BETWEEN :yearStart::date AND :yearEnd::date AND converted = 1
          THEN student_id||'-'||course_id END) AS year_admissions
      FROM combined
      GROUP BY group_label
      HAVING COUNT(DISTINCT CASE WHEN form_date BETWEEN :yearStart::date AND :yearEnd::date
          THEN student_id||'-'||course_id END) > 0
      ORDER BY year_forms DESC;
    `;

    const results = await sequelize.query(query, {
      replacements: {
        rangeStart,
        rangeEnd,
        monthStart,
        monthEnd,
        yearStart,
        yearEnd,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    // Calculate totals
    const totals = results.reduce(
      (acc, curr) => ({
        range_forms: acc.range_forms + (parseInt(curr.range_forms) || 0),
        range_admissions: acc.range_admissions + (parseInt(curr.range_admissions) || 0),
        month_forms: acc.month_forms + (parseInt(curr.month_forms) || 0),
        month_admissions: acc.month_admissions + (parseInt(curr.month_admissions) || 0),
        year_forms: acc.year_forms + (parseInt(curr.year_forms) || 0),
        year_admissions: acc.year_admissions + (parseInt(curr.year_admissions) || 0),
      }),
      {
        range_forms: 0,
        range_admissions: 0,
        month_forms: 0,
        month_admissions: 0,
        year_forms: 0,
        year_admissions: 0,
      },
    );

    const responseData = [
      ...results,
      {
        college_name: "Total",
        range_forms: totals.range_forms,
        range_admissions: totals.range_admissions,
        month_forms: totals.month_forms,
        month_admissions: totals.month_admissions,
        year_forms: totals.year_forms,
        year_admissions: totals.year_admissions,
      },
    ];

    return res.status(200).json({
      success: true,
      data: responseData,
      meta: {
        rangeLabel: `${rangeStart} ~ ${rangeEnd}`,
        monthLabel: `${monthName} ${reportYear}`,
        yearLabel: `Year ${reportYear}`,
        groupBy: group_by,
      },
      message: "Form to Admissions report fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch form to admissions report",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};
export const getFormToAdmissionsFilterOptions = async (req, res) => {
  try {
    const [colleges, l3Counsellors] = await Promise.all([
      sequelize.query(
        `SELECT DISTINCT uc.university_name
         FROM university_courses uc
         INNER JOIN course_status_journeys csj ON csj.course_id = uc.course_id
         WHERE uc.university_name IS NOT NULL AND uc.university_name <> ''
         ORDER BY uc.university_name ASC`,
        { type: sequelize.QueryTypes.SELECT },
      ),
      sequelize.query(
        `SELECT DISTINCT c.counsellor_id, c.counsellor_name
         FROM counsellors c
         INNER JOIN course_status_journeys csj ON csj.assigned_l3_counsellor_id = c.counsellor_id
         WHERE c.counsellor_name IS NOT NULL AND c.counsellor_name <> ''
         ORDER BY c.counsellor_name ASC`,
        { type: sequelize.QueryTypes.SELECT },
      ),
    ]);

    return res.status(200).json({
      success: true,
      colleges: colleges.map((r) => r.university_name),
      l3Counsellors: l3Counsellors.map((r) => ({
        id: r.counsellor_id,
        name: r.counsellor_name,
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Internal Server Error" });
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
    }


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
    }


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

    // Check BEFORE creating whether this is the student's first application entry for this course
    let isFirstApplicationEntry = false;
    if (APPLICATION_STATUSES.includes(status)) {
      const existingCount = await CourseStatusJourney.count({
        where: {
          student_id: studentId,
          course_id: courseId,
          course_status: APPLICATION_STATUSES,
        },
      });
      isFirstApplicationEntry = existingCount === 0;
    }

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
      }
    }

    await Student.update(
      { first_form_filled_date: new Date() },
      { where: { student_id: studentId, first_form_filled_date: null } },
    );

    if (isFirstApplicationEntry) {
      try {
        const student = await Student.findOne({
          where: { student_id: studentId },
          attributes: ["student_name", "student_email", "student_phone", "student_current_state"],
        });
        await GenerateEmailFunction(
          {
            student_id: studentId,
            student_name: student?.student_name,
            student_email: student?.student_email,
            student_phone: student?.student_phone,
            student_current_state: student?.student_current_state,
            college_For_Applied: courseDetails.university_name,
          },
          `New Application – ${courseDetails.university_name}`,
        );
      } catch (emailErr) {
      }
    }

    res.status(201).json({
      message: "Status log created successfully",
      logId: journeyEntry.status_history_id,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const collegeStatusReportsSummary = async (req, res) => {
  try {
    const {
      reportType = "colleges",
      startDate,
      endDate,
      collegeId,
      firstTimeFrom,
      firstTimeTo,
      form_type,
    } = req.query;

    const { sqlFragment: formTypeSql } = await getFormTypeStudentCondition(form_type);

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
          firstTimeFrom,
          firstTimeTo,
          formTypeSql,
        );
        break;

      case "l2":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l2",
          courseWhereClause,
          firstTimeFrom,
          firstTimeTo,
          formTypeSql,
        );
        break;

      case "l3":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l3",
          courseWhereClause,
          firstTimeFrom,
          firstTimeTo,
          formTypeSql,
        );
        break;

      default:
        result = await getCollegesPivotReport(
          whereClause,
          startDate,
          endDate,
          courseWhereClause,
          firstTimeFrom,
          firstTimeTo,
          formTypeSql,
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
    res.status(500).json({
      success: false,
      message: "Error generating reports",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Drill-down: given the same filters used to build the pivot (reportType, date range, form_type)
// plus the specific cell (groupLabel + status), re-run the underlying query scoped to that cell
// and return a paginated, live result — mirrors how the F2A report's drilldown works.
const collegeStatusReportsRaw = async (req, res) => {
  try {
    const {
      reportType = "colleges",
      groupLabel,
      status,
      startDate,
      endDate,
      collegeId,
      firstTimeFrom,
      firstTimeTo,
      form_type,
      page = 1,
      limit = 20,
    } = req.query;

    if (!groupLabel || !status) {
      return res.status(400).json({ success: false, message: "groupLabel and status are required" });
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { sqlFragment: formTypeSql } = await getFormTypeStudentCondition(form_type);

    const isFirstTimeFilter = !!(firstTimeFrom || firstTimeTo);
    const isDateFilter = !!(startDate || endDate);

    const replacements = { status, groupLabel, limit: limitNum, offset };

    // Same "first-entry" / "latest-entry" / "no filter" semantics as getCollegesPivotReport / getCounsellorPivotReport.
    let baseSql;
    if (isFirstTimeFilter) {
      baseSql = `
        SELECT csh.student_id, csh.course_id, csh.course_status, csh.created_at, csh.assigned_l3_counsellor_id
        FROM course_status_journeys csh
        INNER JOIN (
          SELECT student_id, course_id, MIN(created_at) AS first_entry_date
          FROM course_status_journeys
          WHERE 1=1 ${formTypeSql}
          GROUP BY student_id, course_id
        ) first_entry ON csh.student_id = first_entry.student_id
                      AND csh.course_id = first_entry.course_id
                      AND csh.created_at = first_entry.first_entry_date
        WHERE csh.course_status != 'Walkin Marked'
        ${firstTimeFrom ? `AND (csh.created_at AT TIME ZONE 'Asia/Kolkata')::date >= :firstTimeFrom` : ''}
        ${firstTimeTo ? `AND (csh.created_at AT TIME ZONE 'Asia/Kolkata')::date <= :firstTimeTo` : ''}
      `;
      if (firstTimeFrom) replacements.firstTimeFrom = firstTimeFrom;
      if (firstTimeTo) replacements.firstTimeTo = firstTimeTo;
    } else if (isDateFilter) {
      baseSql = `
        SELECT csh.student_id, csh.course_id, csh.course_status, csh.created_at, csh.assigned_l3_counsellor_id
        FROM course_status_journeys csh
        INNER JOIN (
          SELECT csh_inner.student_id, csh_inner.course_id, MAX(csh_inner.created_at) AS latest_date
          FROM course_status_journeys csh_inner
          WHERE csh_inner.course_status != 'Walkin Marked'
          ${startDate ? `AND (csh_inner.created_at AT TIME ZONE 'Asia/Kolkata')::date >= :startDate` : ''}
          ${endDate ? `AND (csh_inner.created_at AT TIME ZONE 'Asia/Kolkata')::date <= :endDate` : ''}
          ${formTypeSql}
          GROUP BY csh_inner.student_id, csh_inner.course_id
        ) latest ON csh.student_id = latest.student_id
                 AND csh.course_id = latest.course_id
                 AND csh.created_at = latest.latest_date
        WHERE csh.course_status != 'Walkin Marked'
      `;
      if (startDate) replacements.startDate = startDate;
      if (endDate) replacements.endDate = endDate;
    } else {
      baseSql = `
        SELECT csh.student_id, csh.course_id, csh.course_status, csh.created_at, csh.assigned_l3_counsellor_id
        FROM course_status_journeys csh
        INNER JOIN (
          SELECT student_id, course_id, MAX(created_at) AS latest_date
          FROM course_status_journeys
          WHERE course_status != 'Walkin Marked'
          ${formTypeSql}
          GROUP BY student_id, course_id
        ) latest ON csh.student_id = latest.student_id
                 AND csh.course_id = latest.course_id
                 AND csh.created_at = latest.latest_date
        WHERE csh.course_status != 'Walkin Marked'
      `;
    }

    let outerSql;
    if (reportType === "l2") {
      // groupLabel is a counsellor name (or "Unassigned"); assigned_counsellor_id lives on `students`.
      // L3, however, is only reliably populated per-course on the journey row (students.assigned_counsellor_l3_id is unused/null).
      outerSql = `
        SELECT filtered.student_id, filtered.course_id, filtered.created_at,
               st.student_name, st.student_phone, st.student_email, st.source,
               filtered.course_status AS current_student_status,
               uc.course_name, uc.university_name,
               COALESCE(cl2.counsellor_name, 'Unassigned') AS counsellor_name_l2,
               COALESCE(cl3j.counsellor_name, 'Unassigned') AS counsellor_name_l3,
               COUNT(*) OVER() AS _total_count
        FROM (${baseSql}) filtered
        JOIN students st ON st.student_id = filtered.student_id
        LEFT JOIN counsellors cl2 ON st.assigned_counsellor_id = cl2.counsellor_id
        LEFT JOIN counsellors cl3j ON filtered.assigned_l3_counsellor_id = cl3j.counsellor_id
        LEFT JOIN university_courses uc ON uc.course_id = filtered.course_id
        WHERE filtered.course_status = :status
          AND COALESCE(cl2.counsellor_name, 'Unassigned') = :groupLabel
        ORDER BY filtered.created_at DESC
        LIMIT :limit OFFSET :offset
      `;
    } else if (reportType === "l3") {
      // assigned_l3_counsellor_id lives directly on the journey row (per student+course).
      outerSql = `
        SELECT filtered.student_id, filtered.course_id, filtered.created_at,
               st.student_name, st.student_phone, st.student_email, st.source,
               filtered.course_status AS current_student_status,
               uc.course_name, uc.university_name,
               COALESCE(cl2.counsellor_name, 'Unassigned') AS counsellor_name_l2,
               COALESCE(cl3j.counsellor_name, 'Unassigned') AS counsellor_name_l3,
               COUNT(*) OVER() AS _total_count
        FROM (${baseSql}) filtered
        LEFT JOIN students st ON st.student_id = filtered.student_id
        LEFT JOIN counsellors cl2 ON st.assigned_counsellor_id = cl2.counsellor_id
        LEFT JOIN counsellors cl3j ON filtered.assigned_l3_counsellor_id = cl3j.counsellor_id
        LEFT JOIN university_courses uc ON uc.course_id = filtered.course_id
        WHERE filtered.course_status = :status
          AND COALESCE(cl3j.counsellor_name, 'Unassigned') = :groupLabel
        ORDER BY filtered.created_at DESC
        LIMIT :limit OFFSET :offset
      `;
    } else {
      // colleges — L3 comes from the journey row, same reasoning as the l2 branch above.
      outerSql = `
        SELECT filtered.student_id, filtered.course_id, filtered.created_at,
               st.student_name, st.student_phone, st.student_email, st.source,
               filtered.course_status AS current_student_status,
               uc.course_name, uc.university_name,
               COALESCE(cl2.counsellor_name, 'Unassigned') AS counsellor_name_l2,
               COALESCE(cl3j.counsellor_name, 'Unassigned') AS counsellor_name_l3,
               COUNT(*) OVER() AS _total_count
        FROM (${baseSql}) filtered
        JOIN university_courses uc ON uc.course_id = filtered.course_id
        LEFT JOIN students st ON st.student_id = filtered.student_id
        LEFT JOIN counsellors cl2 ON st.assigned_counsellor_id = cl2.counsellor_id
        LEFT JOIN counsellors cl3j ON filtered.assigned_l3_counsellor_id = cl3j.counsellor_id
        WHERE filtered.course_status = :status
          AND uc.university_name = :groupLabel
          ${collegeId ? `AND uc.course_id = :collegeId` : ''}
        ORDER BY filtered.created_at DESC
        LIMIT :limit OFFSET :offset
      `;
      if (collegeId) replacements.collegeId = collegeId;
    }

    const rows = await sequelize.query(outerSql, { replacements, type: QueryTypes.SELECT });
    const total = rows.length > 0 ? parseInt(rows[0]._total_count) : 0;
    const data = rows.map(({ _total_count, ...r }) => r);

    res.json({ success: true, data, total, page: pageNum, limit: limitNum });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching drill-down students" });
  }
};

const getCollegesPivotReport = async (
  whereClause,
  startDate,
  endDate,
  courseWhereClause,
  firstTimeFrom,
  firstTimeTo,
  formTypeSql = '',
) => {
  const isFirstTimeFilter = !!(firstTimeFrom || firstTimeTo);
  const isDateFilter = !!(startDate || endDate);
  
  let sql = "";
  const replacements = {};

  // CASE 1: First Time Filter - Get absolute first entries within the date range
  if (isFirstTimeFilter) {
    sql = `
      SELECT 
        csh.student_id,
        csh.course_id,
        csh.course_status,
        csh.created_at,
        uc.university_name AS college
      FROM course_status_journeys csh
      INNER JOIN (
        SELECT
          student_id,
          course_id,
          MIN(created_at) AS first_entry_date
        FROM course_status_journeys
        WHERE 1=1 ${formTypeSql}
        GROUP BY student_id, course_id
      ) first_entry ON csh.student_id = first_entry.student_id
                    AND csh.course_id = first_entry.course_id
                    AND csh.created_at = first_entry.first_entry_date
      INNER JOIN university_courses uc ON csh.course_id = uc.course_id
      WHERE csh.course_status != 'Walkin Marked'
    `;

    // Add date range filter on the first entry date
    if (firstTimeFrom) {
      sql += ` AND (csh.created_at AT TIME ZONE 'Asia/Kolkata')::date >= :firstTimeFrom`;
      replacements.firstTimeFrom = firstTimeFrom;
    }
    if (firstTimeTo) {
      sql += ` AND (csh.created_at AT TIME ZONE 'Asia/Kolkata')::date <= :firstTimeTo`;
      replacements.firstTimeTo = firstTimeTo;
    }

    // Add course filter
    if (courseWhereClause.course_id) {
      sql += ` AND uc.course_id = :courseId`;
      replacements.courseId = courseWhereClause.course_id;
    }
  }
  // CASE 2: Regular Date Filter - Get latest entries within the date range
  else if (isDateFilter) {
    sql = `
      SELECT
        csh.student_id,
        csh.course_id,
        csh.course_status,
        csh.created_at,
        uc.university_name AS college
      FROM course_status_journeys csh
      INNER JOIN (
        SELECT
          csh_inner.student_id,
          csh_inner.course_id,
          MAX(csh_inner.created_at) AS latest_date
        FROM course_status_journeys csh_inner
        WHERE csh_inner.course_status != 'Walkin Marked'
    `;

    if (startDate) {
      sql += ` AND (csh_inner.created_at AT TIME ZONE 'Asia/Kolkata')::date >= :startDate`;
      replacements.startDate = startDate;
    }
    if (endDate) {
      sql += ` AND (csh_inner.created_at AT TIME ZONE 'Asia/Kolkata')::date <= :endDate`;
      replacements.endDate = endDate;
    }
    if (formTypeSql) sql += ` ${formTypeSql}`;

    sql += `
        GROUP BY csh_inner.student_id, csh_inner.course_id
      ) latest ON csh.student_id = latest.student_id
               AND csh.course_id = latest.course_id
               AND csh.created_at = latest.latest_date
      INNER JOIN university_courses uc ON csh.course_id = uc.course_id
      WHERE csh.course_status != 'Walkin Marked'
    `;

    // Add course filter
    if (courseWhereClause.course_id) {
      sql += ` AND uc.course_id = :courseId`;
      replacements.courseId = courseWhereClause.course_id;
    }
  }
  // CASE 3: No filters - Get latest entries overall
  else {
    sql = `
      SELECT
        csh.student_id,
        csh.course_id,
        csh.course_status,
        csh.created_at,
        uc.university_name AS college
      FROM course_status_journeys csh
      INNER JOIN (
        SELECT
          student_id,
          course_id,
          MAX(created_at) AS latest_date
        FROM course_status_journeys
        WHERE course_status != 'Walkin Marked'
        ${formTypeSql}
        GROUP BY student_id, course_id
      ) latest ON csh.student_id = latest.student_id
               AND csh.course_id = latest.course_id
               AND csh.created_at = latest.latest_date
      INNER JOIN university_courses uc ON csh.course_id = uc.course_id
      WHERE csh.course_status != 'Walkin Marked'
    `;

    // Add course filter
    if (courseWhereClause.course_id) {
      sql += ` AND uc.course_id = :courseId`;
      replacements.courseId = courseWhereClause.course_id;
    }
  }


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

  records.forEach((record) => {
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
  const rows = Array.from(collegeMap.values()).map((d) => {
    const row = { college: d.college, total: d.total };
    allStatuses.forEach((s) => {
      row[s] = d.statuses[s] || 0;
    });
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
  formTypeSql = '',
) => {
  const isFirstTimeFilter = !!(firstTimeFrom || firstTimeTo);
  const isDateFilter = !!(startDate || endDate);
  
  let sql = "";
  const replacements = {};

  // CASE 1: First Time Filter - Get absolute first entries within the date range
  if (isFirstTimeFilter) {
    sql = `
      SELECT
        csh.student_id,
        csh.course_id,
        csh.course_status,
        csh.created_at
      FROM course_status_journeys csh
      INNER JOIN (
        SELECT
          student_id,
          course_id,
          MIN(created_at) AS first_entry_date
        FROM course_status_journeys
        WHERE course_status != 'Walkin Marked'
        ${formTypeSql}
        GROUP BY student_id, course_id
      ) first_entry ON csh.student_id = first_entry.student_id
                    AND csh.course_id = first_entry.course_id
                    AND csh.created_at = first_entry.first_entry_date
      INNER JOIN university_courses uc ON csh.course_id = uc.course_id
      WHERE csh.course_status != 'Walkin Marked'
    `;

    // Add date range filter on the first entry date
    if (firstTimeFrom) {
      sql += ` AND (csh.created_at AT TIME ZONE 'Asia/Kolkata')::date >= :firstTimeFrom`;
      replacements.firstTimeFrom = firstTimeFrom;
    }
    if (firstTimeTo) {
      sql += ` AND (csh.created_at AT TIME ZONE 'Asia/Kolkata')::date <= :firstTimeTo`;
      replacements.firstTimeTo = firstTimeTo;
    }

    // Add course filter
    if (courseWhereClause.course_id) {
      sql += ` AND uc.course_id = :courseId`;
      replacements.courseId = courseWhereClause.course_id;
    }
  }
  // CASE 2: Regular Date Filter - Get latest entries within the date range
  else if (isDateFilter) {
    sql = `
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
          MAX(csh_inner.created_at) AS latest_date
        FROM course_status_journeys csh_inner
        WHERE csh_inner.course_status != 'Walkin Marked'
    `;

    if (startDate) {
      sql += ` AND (csh_inner.created_at AT TIME ZONE 'Asia/Kolkata')::date >= :startDate`;
      replacements.startDate = startDate;
    }
    if (endDate) {
      sql += ` AND (csh_inner.created_at AT TIME ZONE 'Asia/Kolkata')::date <= :endDate`;
      replacements.endDate = endDate;
    }
    if (formTypeSql) sql += ` ${formTypeSql}`;

    sql += `
        GROUP BY csh_inner.student_id, csh_inner.course_id
      ) latest ON csh.student_id = latest.student_id
               AND csh.course_id = latest.course_id
               AND csh.created_at = latest.latest_date
      INNER JOIN university_courses uc ON csh.course_id = uc.course_id
      WHERE csh.course_status != 'Walkin Marked'
    `;

    // Add course filter
    if (courseWhereClause.course_id) {
      sql += ` AND uc.course_id = :courseId`;
      replacements.courseId = courseWhereClause.course_id;
    }
  }
  // CASE 3: No filters - Get latest entries overall
  else {
    sql = `
      SELECT
        csh.student_id,
        csh.course_id,
        csh.course_status,
        csh.created_at
      FROM course_status_journeys csh
      INNER JOIN (
        SELECT
          student_id,
          course_id,
          MAX(created_at) AS latest_date
        FROM course_status_journeys
        WHERE course_status != 'Walkin Marked'
        ${formTypeSql}
        GROUP BY student_id, course_id
      ) latest ON csh.student_id = latest.student_id
               AND csh.course_id = latest.course_id
               AND csh.created_at = latest.latest_date
      INNER JOIN university_courses uc ON csh.course_id = uc.course_id
      WHERE csh.course_status != 'Walkin Marked'
    `;

    // Add course filter
    if (courseWhereClause.course_id) {
      sql += ` AND uc.course_id = :courseId`;
      replacements.courseId = courseWhereClause.course_id;
    }
  }

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
  const studentIds = [...new Set(records.map((r) => r.student_id))];
  const studentCounsellorMap = {};

  if (level === "l2") {
    const students = await Student.findAll({
      where: { student_id: studentIds },
      attributes: ["student_id", "assigned_counsellor_id"],
      raw: true,
    });
    students.forEach((student) => {
      const cId = student.assigned_counsellor_id;
      studentCounsellorMap[student.student_id] =
        cId && cId.trim() !== "" ? cId : "unassigned";
    });
  } else {
    // For L3, get counsellor from journey table
    const journeyRecords = await CourseStatusJourney.findAll({
      where: {
        student_id: studentIds,
        created_at: { [Op.in]: records.map((r) => r.created_at) },
      },
      attributes: ["student_id", "course_id", "assigned_l3_counsellor_id"],
      raw: true,
    });
    const journeyMap = {};
    journeyRecords.forEach((r) => {
      const key = `${r.student_id}_${r.course_id}`;
      journeyMap[key] =
        r.assigned_l3_counsellor_id && r.assigned_l3_counsellor_id.trim() !== ""
          ? r.assigned_l3_counsellor_id
          : "unassigned";
    });
    records.forEach((r) => {
      const key = `${r.student_id}_${r.course_id}`;
      studentCounsellorMap[key] = journeyMap[key] || "unassigned";
    });
  }

  // Aggregate by counsellor
  const counsellorMap = new Map();
  const statusTotals = {};

  records.forEach((record) => {
    let counsellorId;
    if (level === "l2") {
      counsellorId = studentCounsellorMap[record.student_id] || "unassigned";
    } else {
      counsellorId =
        studentCounsellorMap[`${record.student_id}_${record.course_id}`] ||
        "unassigned";
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
  const counsellorIds = Array.from(counsellorMap.keys()).filter(
    (id) => id !== "unassigned",
  );
  const counsellorNameMap = {};

  if (counsellorIds.length > 0) {
    const counsellors = await Counsellor.findAll({
      where: { counsellor_id: counsellorIds },
      attributes: ["counsellor_id", "counsellor_name"],
      raw: true,
    });
    counsellors.forEach((c) => {
      counsellorNameMap[c.counsellor_id] = c.counsellor_name;
    });
  }

  const allStatuses = Object.keys(statusTotals);

  const getCounsellorName = (counsellorId) =>
    counsellorId === "unassigned"
      ? "Unassigned"
      : counsellorNameMap[counsellorId] || `Unknown (${counsellorId})`;

  const rows = Array.from(counsellorMap.values()).map((item) => {
    const row = { counsellor: getCounsellorName(item.counsellorId), total: item.total };
    allStatuses.forEach((s) => {
      row[s] = item.statuses[s] || 0;
    });
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
// export const getCollegesList = async (req, res) => {
//   try {
//     const colleges = await UniversityCourse.findAll({
//       attributes: ["course_id", "university_name", "level"],
//       group: ["course_id", "university_name", "level"],
//       order: [["university_name", "ASC"]],
//     });

//     res.status(200).json({
//       success: true,
//       data: colleges,
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Error fetching colleges list",
//     });
//   }
// };

export const getDistinctL3CounsellorsByStudentIds = async (req, res) => {
  try {
    const { studentIds } = req.body;

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
    return res.status(500).json({
      success: false,
      message: "Failed to fetch L3 counsellors data",
      error: error.message,
    });
  }
};


const collegeStatusReportsExport = async (req, res) => {
  try {
    const {
      reportType = "colleges",
      startDate,
      endDate,
      collegeId,
      firstTimeFrom,
      firstTimeTo,
    } = req.query;

    const isFirstTimeFilter = !!(firstTimeFrom || firstTimeTo);
    const isDateFilter = !!(startDate || endDate);

    let sql = "";
    const replacements = {};

    // ================= FIRST TIME FILTER =================
    if (isFirstTimeFilter) {
      sql = `
        SELECT
          csh.student_id,
          s.student_name,
          s.student_email,
          s.student_phone,
          csh.course_id,
          csh.course_status,
          csh.created_at,
          uc.university_name AS college,
          uc.course_name,
          c.counsellor_name,

          scc.form_id,
          scc.coupon_code,
          scc.user_name,
          scc.password

        FROM course_status_journeys csh

        INNER JOIN (
          SELECT student_id, course_id, MIN(created_at) AS first_entry_date
          FROM course_status_journeys
          GROUP BY student_id, course_id
        ) first_entry 
          ON csh.student_id = first_entry.student_id
         AND csh.course_id = first_entry.course_id
         AND csh.created_at = first_entry.first_entry_date

        INNER JOIN university_courses uc 
          ON csh.course_id = uc.course_id

        LEFT JOIN counsellors c 
          ON csh.counsellor_id = c.counsellor_id

        LEFT JOIN students s 
          ON csh.student_id = s.student_id

        LEFT JOIN student_college_credentials scc 
          ON csh.student_id = scc.student_id 
         AND csh.course_id = scc.course_id

        WHERE 1=1
      `;

      if (firstTimeFrom) {
        sql += ` AND DATE(csh.created_at) >= :firstTimeFrom`;
        replacements.firstTimeFrom = firstTimeFrom;
      }
      if (firstTimeTo) {
        sql += ` AND DATE(csh.created_at) <= :firstTimeTo`;
        replacements.firstTimeTo = firstTimeTo;
      }
    }

    // ================= DATE FILTER =================
    else if (isDateFilter) {
      sql = `
        SELECT
          csh.student_id,
          s.student_name,
          s.student_email,
          s.student_phone,
          csh.course_id,
          csh.course_status,
          csh.created_at,
          uc.university_name AS college,
          uc.course_name,
          c.counsellor_name,

          scc.form_id,
          scc.coupon_code,
          scc.user_name,
          scc.password

        FROM course_status_journeys csh

        INNER JOIN (
          SELECT
            csh_inner.student_id,
            csh_inner.course_id,
            MAX(csh_inner.created_at) AS latest_date
          FROM course_status_journeys csh_inner
          WHERE 1=1
      `;

      if (startDate) {
        sql += ` AND DATE(csh_inner.created_at) >= :startDate`;
        replacements.startDate = startDate;
      }
      if (endDate) {
        sql += ` AND DATE(csh_inner.created_at) <= :endDate`;
        replacements.endDate = endDate;
      }

      sql += `
          GROUP BY csh_inner.student_id, csh_inner.course_id
        ) latest 
          ON csh.student_id = latest.student_id
         AND csh.course_id = latest.course_id
         AND csh.created_at = latest.latest_date

        INNER JOIN university_courses uc 
          ON csh.course_id = uc.course_id

        LEFT JOIN counsellors c 
          ON csh.counsellor_id = c.counsellor_id

        LEFT JOIN students s 
          ON csh.student_id = s.student_id

        LEFT JOIN student_college_credentials scc 
          ON csh.student_id = scc.student_id 
         AND csh.course_id = scc.course_id

        WHERE 1=1
      `;
    }

    // ================= DEFAULT =================
    else {
      sql = `
        SELECT
          csh.student_id,
          s.student_name,
          s.student_email,
          s.student_phone,
          csh.course_id,
          csh.course_status,
          csh.created_at,
          uc.university_name AS college,
          uc.course_name,
          c.counsellor_name,

          scc.form_id,
          scc.coupon_code,
          scc.user_name,
          scc.password

        FROM course_status_journeys csh

        INNER JOIN (
          SELECT student_id, course_id, MAX(created_at) AS latest_date
          FROM course_status_journeys
          GROUP BY student_id, course_id
        ) latest 
          ON csh.student_id = latest.student_id
         AND csh.course_id = latest.course_id
         AND csh.created_at = latest.latest_date

        INNER JOIN university_courses uc 
          ON csh.course_id = uc.course_id

        LEFT JOIN counsellors c 
          ON csh.counsellor_id = c.counsellor_id

        LEFT JOIN students s 
          ON csh.student_id = s.student_id

        LEFT JOIN student_college_credentials scc 
          ON csh.student_id = scc.student_id 
         AND csh.course_id = scc.course_id

        WHERE 1=1
      `;
    }

    // ================= COMMON FILTER =================
    if (collegeId) {
      sql += ` AND uc.course_id = :courseId`;
      replacements.courseId = collegeId;
    }

    sql += ` ORDER BY uc.university_name, csh.student_id`;

    const records = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    // ================= EMPTY CSV =================
    if (records.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="college_status_report.csv"`
      );
      return res.send(
        "Student ID,Student Name,Email,Phone,College,Course,Counsellor,Status,Form ID,Coupon Code,Username,Password,Created At\n"
      );
    }

    // ================= FORMAT =================
    const formatted = records.map((r) => ({
      student_id: r.student_id || "",
      student_name: r.student_name || "",
      student_email: r.student_email || "",
      student_phone: r.student_phone || "",
      college: r.college || "",
      course_name: r.course_name || "",
      counsellor_name: r.counsellor_name || "",
      course_status: r.course_status || "",
      form_id: r.form_id || "",
      coupon_code: r.coupon_code || "",
      user_name: r.user_name || "",
      // ⚠️ SECURITY: mask password if needed
      password: r.password || "",
      created_at: r.created_at
        ? new Date(r.created_at).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })
        : "",
    }));

    const fields = [
      "student_id",
      "student_name",
      "student_email",
      "student_phone",
      "college",
      "course_name",
      "counsellor_name",
      "course_status",
      "form_id",
      "coupon_code",
      "user_name",
      "password",
      "created_at",
    ];

    const fieldNames = [
      "Student ID",
      "Student Name",
      "Email",
      "Phone",
      "College",
      "Course",
      "Counsellor",
      "Status",
      "Form ID",
      "Coupon Code",
      "Username",
      "Password",
      "Created At",
    ];

    const csvData = convertToCSV(formatted, fields, fieldNames);

    const date = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="college_status_report_${date}.csv"`
    );

    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error exporting reports",
    });
  }
};

// Single controller for College Status Reports — type=summary (default) for the pivot table,
// type=raw for the paginated drilldown, type=export for the full CSV download. Each branch
// keeps its original query logic untouched; this just merges them behind one route (mirrors
// ActiveFormReportController.js).
export const getCollegeStatusReports = async (req, res) => {
  const { type = "summary" } = req.query;
  if (type === "raw") return collegeStatusReportsRaw(req, res);
  if (type === "export") return collegeStatusReportsExport(req, res);
  return collegeStatusReportsSummary(req, res);
};

export const getCollegesList = async (req, res) => {
  try {
    const results = await sequelize.query(
      `SELECT DISTINCT university_name FROM university_courses WHERE university_name IS NOT NULL ORDER BY university_name`,
      { type: sequelize.QueryTypes.SELECT }
    );
    return res.json({ success: true, data: results.map(r => r.university_name) });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getCourseGraphReport = async (req, res) => {
  try {
    const { start_date, end_date, colleges } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ success: false, message: 'start_date and end_date are required' });
    }

    const collegeList = colleges
      ? (Array.isArray(colleges) ? colleges : colleges.split(',').map(c => c.trim()).filter(Boolean))
      : [];

    const collegeReplacements = {};
    const collegePlaceholders = collegeList.map((c, i) => {
      collegeReplacements[`college_${i}`] = c;
      return `:college_${i}`;
    }).join(', ');
    const collegeCondition = collegeList.length > 0 ? `AND uc.university_name IN (${collegePlaceholders})` : '';
    const replacements = { start_date, end_date, ...collegeReplacements };

    const formsQuery = `
      WITH ranked AS (
        SELECT
          student_id,
          course_id,
          course_status,
          created_at,
          ROW_NUMBER() OVER (PARTITION BY student_id, course_id ORDER BY created_at ASC) AS rn
        FROM course_status_journeys
      ),
      first_entry AS (
        SELECT student_id, course_id, course_status, created_at FROM ranked WHERE rn = 1
      ),
      second_entry AS (
        SELECT student_id, course_id, course_status, created_at FROM ranked WHERE rn = 2
      ),
      effective_form AS (
        SELECT
          f.student_id,
          f.course_id,
          CASE
            WHEN f.course_status = 'Walkin Completed' AND s.student_id IS NOT NULL
              THEN s.created_at
            WHEN f.course_status = 'Walkin Completed' AND s.student_id IS NULL
              THEN NULL
            ELSE f.created_at
          END AS effective_created_at
        FROM first_entry f
        LEFT JOIN second_entry s
          ON s.student_id = f.student_id AND s.course_id = f.course_id
      )
      SELECT
        DATE(ef.effective_created_at)::text AS date,
        uc.university_name AS college,
        COUNT(*) AS count
      FROM effective_form ef
      JOIN university_courses uc ON ef.course_id = uc.course_id
      WHERE ef.effective_created_at IS NOT NULL
        AND ef.effective_created_at >= :start_date::timestamp
        AND ef.effective_created_at < (:end_date::date + INTERVAL '1 day')::timestamp
        ${collegeCondition}
      GROUP BY DATE(ef.effective_created_at), uc.university_name
      ORDER BY date
    `;

    const admissionsQuery = `
      SELECT
        DATE(first_adm.min_created AT TIME ZONE 'Asia/Kolkata')::text AS date,
        uc.university_name AS college,
        COUNT(*) AS count
      FROM (
        SELECT student_id, course_id, MIN(created_at) AS min_created
        FROM course_status_journeys
        WHERE course_status = 'Admission'
        GROUP BY student_id, course_id
      ) first_adm
      JOIN university_courses uc ON first_adm.course_id = uc.course_id
      WHERE DATE(first_adm.min_created AT TIME ZONE 'Asia/Kolkata') >= :start_date::date
        AND DATE(first_adm.min_created AT TIME ZONE 'Asia/Kolkata') <= :end_date::date
        ${collegeCondition}
      GROUP BY DATE(first_adm.min_created AT TIME ZONE 'Asia/Kolkata'), uc.university_name
      ORDER BY date
    `;

    const [formsData, admissionsData] = await Promise.all([
      sequelize.query(formsQuery, { replacements, type: sequelize.QueryTypes.SELECT }),
      sequelize.query(admissionsQuery, { replacements, type: sequelize.QueryTypes.SELECT }),
    ]);

    // Build full date range array
    const dates = [];
    const start = new Date(start_date);
    const end = new Date(end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    // Collect unique colleges from results
    const collegesSet = new Set([
      ...formsData.map(r => r.college),
      ...admissionsData.map(r => r.college),
    ]);
    const uniqueColleges = [...collegesSet].sort();

    const series = uniqueColleges.map(college => {
      const formsMap = {};
      formsData.filter(r => r.college === college).forEach(r => { formsMap[r.date] = parseInt(r.count, 10); });
      const admissionsMap = {};
      admissionsData.filter(r => r.college === college).forEach(r => { admissionsMap[r.date] = parseInt(r.count, 10); });
      return {
        college,
        forms: dates.map(d => formsMap[d] || 0),
        admissions: dates.map(d => admissionsMap[d] || 0),
      };
    });

    return res.json({ success: true, data: { dates, series } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ============================================================================
// Admission Report — team-owner/counsellor wise first-time Admission or
// Application counts, with a drilldown into the underlying student rows.
// ============================================================================

// Resolves the counsellor_id list a 'to' user is allowed to see admissions for
// (themselves + their subordinate counsellors). Returns null when unrestricted.
const resolveCounsellorScope = async (userRole, userId) => {
  if (userRole !== "to") return null;

  const subordinates = await Counsellor.findAll({
    where: {
      [Op.or]: [{ assigned_to: userId }, { counsellor_id: userId }],
    },
    attributes: ["counsellor_id"],
  });

  const ids = Array.from(
    new Set(subordinates.map((c) => c.counsellor_id).filter(Boolean)),
  );
  return ids.length > 0 ? ids : ["DUMMY_COUNSELLOR_NONE"];
};

// "Application" is a whole family of course_status values, not a single
// literal one — a journey that reaches any of these has been submitted as
// an application, even if it never passes through a status literally named
// "Application" (most go straight to one of the more specific sub-statuses).
// Reuses the module-level APPLICATION_STATUSES defined near the top of this
// file (used elsewhere for the same grouping) plus the literal "Application"
// status itself, which that list doesn't include.
const ADMISSION_REPORT_APPLICATION_STATUSES = [...APPLICATION_STATUSES, "Application"];

// Shared context (role scope + date range + base CTE) so every admission-report
// endpoint (detail list, drilldown, summary) derives counts from the exact same
// underlying rows — this is what keeps the summary counts and drilldown data in sync.
// Only these two literal status groups are ever allowed here — req.query.type is
// never interpolated into SQL directly, it just selects one of these two constants.
const REPORT_TYPE_STATUSES = {
  admission: ["Admission"],
  application: ADMISSION_REPORT_APPLICATION_STATUSES,
};

const buildAdmissionContext = async (req) => {
  const userRole = String(req.user.role).trim().toLowerCase();
  const userId = req.user.id;

  const counsellorScope = await resolveCounsellorScope(userRole, userId);

  const reportType = req.query.type === "application" ? "application" : "admission";
  const courseStatusList = REPORT_TYPE_STATUSES[reportType]
    .map((s) => `'${s.replace(/'/g, "''")}'`)
    .join(",");

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filter range for the table + FTD stat: defaults to "today"
  const rangeStart = req.query.startDate ? new Date(req.query.startDate) : todayStart;
  const rangeEnd = req.query.endDate
    ? new Date(req.query.endDate)
    : new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const scopeCondition = counsellorScope
    ? "AND fa.counsellor_id IS NOT NULL AND fa.counsellor_id IN (:counsellorScope)"
    : "";

  const baseReplacements = {
    ...(counsellorScope ? { counsellorScope } : {}),
  };

  const firstAdmissionBase = `
    SELECT DISTINCT ON (student_id, course_id)
      student_id, course_id, counsellor_id, deposit_amount, created_at AS admission_date
    FROM course_status_journeys
    WHERE course_status IN (${courseStatusList})
    ORDER BY student_id, course_id, created_at ASC
  `;

  return {
    now,
    monthStart,
    rangeStart,
    rangeEnd,
    scopeCondition,
    baseReplacements,
    firstAdmissionBase,
    reportType,
  };
};

// FTD (respects the applied date filter) and MTD (always current month), regardless
// of which endpoint/drilldown is asking — same first_admission CTE + scope each time.
const fetchAdmissionStats = async (ctx) => {
  const { firstAdmissionBase, scopeCondition, baseReplacements, rangeStart, rangeEnd, monthStart, now } = ctx;

  const statsQuery = `
    WITH first_admission AS (${firstAdmissionBase})
    SELECT
      COUNT(*) FILTER (
        WHERE fa.admission_date >= :rangeStart AND fa.admission_date < :rangeEnd
      ) AS ftd,
      COUNT(*) FILTER (
        WHERE fa.admission_date >= :monthStart AND fa.admission_date < :nextRangeCheck
      ) AS mtd
    FROM first_admission fa
    WHERE 1=1 ${scopeCondition}
  `;

  const [statsRow] = await sequelize.query(statsQuery, {
    replacements: {
      ...baseReplacements,
      rangeStart,
      rangeEnd,
      monthStart,
      nextRangeCheck: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
    type: sequelize.QueryTypes.SELECT,
  });

  return {
    ftd: parseInt(statsRow?.ftd || 0, 10),
    mtd: parseInt(statsRow?.mtd || 0, 10),
  };
};

// Detail list — the raw student-level rows. Doubles as the drilldown endpoint when
// counsellorId / teamOwnerId query params are supplied (from clicking a summary count).
export const getAdmissionReport = async (req, res) => {
  try {
    const ctx = await buildAdmissionContext(req);
    const { firstAdmissionBase, scopeCondition, baseReplacements, rangeStart, rangeEnd } = ctx;

    const page = req.query.all ? 1 : parseInt(req.query.page, 10) || 1;
    const limit = req.query.all ? 100000 : parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let drilldownCondition = "";
    const drilldownReplacements = {};
    if (req.query.counsellorId) {
      drilldownCondition += " AND fa.counsellor_id = :counsellorId";
      drilldownReplacements.counsellorId = req.query.counsellorId;
    }
    if (req.query.teamOwnerId) {
      if (req.query.teamOwnerId === "UNASSIGNED") {
        drilldownCondition += " AND cns.assigned_to IS NULL";
      } else {
        drilldownCondition += " AND cns.assigned_to = :teamOwnerId";
        drilldownReplacements.teamOwnerId = req.query.teamOwnerId;
      }
    }

    const stats = await fetchAdmissionStats(ctx);

    const dataQuery = `
      WITH first_admission AS (${firstAdmissionBase}),
           first_entry AS (
             SELECT DISTINCT ON (student_id, course_id)
               student_id, course_id, created_at AS form_filled_date
             FROM course_status_journeys
             ORDER BY student_id, course_id, created_at ASC
           )
      SELECT
        fa.student_id,
        s.student_name,
        fa.admission_date,
        fe.form_filled_date,
        uc.university_name AS college_name,
        uc.course_name,
        fa.deposit_amount AS fees_amount,
        cns.counsellor_name,
        team_owner.counsellor_name AS team_owner_name,
        l2cns.counsellor_name AS l2_counsellor_name
      FROM first_admission fa
      JOIN students s ON s.student_id = fa.student_id
      LEFT JOIN university_courses uc ON uc.course_id = fa.course_id
      LEFT JOIN first_entry fe ON fe.student_id = fa.student_id AND fe.course_id = fa.course_id
      LEFT JOIN counsellors cns ON cns.counsellor_id = fa.counsellor_id
      LEFT JOIN counsellors team_owner ON team_owner.counsellor_id = cns.assigned_to
      LEFT JOIN counsellors l2cns ON l2cns.counsellor_id = s.assigned_counsellor_id
      WHERE fa.admission_date >= :rangeStart AND fa.admission_date < :rangeEnd
        ${scopeCondition} ${drilldownCondition}
      ORDER BY fa.admission_date DESC
      LIMIT :limit OFFSET :offset
    `;

    const countQuery = `
      WITH first_admission AS (${firstAdmissionBase})
      SELECT COUNT(*) AS total
      FROM first_admission fa
      LEFT JOIN counsellors cns ON cns.counsellor_id = fa.counsellor_id
      WHERE fa.admission_date >= :rangeStart AND fa.admission_date < :rangeEnd
        ${scopeCondition} ${drilldownCondition}
    `;

    const [rows, [countRow]] = await Promise.all([
      sequelize.query(dataQuery, {
        replacements: { ...baseReplacements, ...drilldownReplacements, rangeStart, rangeEnd, limit, offset },
        type: sequelize.QueryTypes.SELECT,
      }),
      sequelize.query(countQuery, {
        replacements: { ...baseReplacements, ...drilldownReplacements, rangeStart, rangeEnd },
        type: sequelize.QueryTypes.SELECT,
      }),
    ]);

    return res.json({
      success: true,
      type: ctx.reportType,
      stats,
      data: rows,
      total: parseInt(countRow?.total || 0, 10),
      page,
      limit,
    });
  } catch (error) {
    console.error("Error in getAdmissionReport:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Team-owner -> counsellor grouped admission counts for the main report view.
// Built from the exact same first_admission CTE as getAdmissionReport, so the
// counts here always reconcile with what the drilldown (getAdmissionReport) returns.
export const getAdmissionReportSummary = async (req, res) => {
  try {
    const ctx = await buildAdmissionContext(req);
    const { firstAdmissionBase, scopeCondition, baseReplacements, rangeStart, rangeEnd } = ctx;

    const stats = await fetchAdmissionStats(ctx);

    const summaryQuery = `
      WITH first_admission AS (${firstAdmissionBase})
      SELECT
        cns.assigned_to AS team_owner_id,
        team_owner.counsellor_name AS team_owner_name,
        fa.counsellor_id,
        cns.counsellor_name,
        COUNT(*) AS admission_count
      FROM first_admission fa
      LEFT JOIN counsellors cns ON cns.counsellor_id = fa.counsellor_id
      LEFT JOIN counsellors team_owner ON team_owner.counsellor_id = cns.assigned_to
      WHERE fa.admission_date >= :rangeStart AND fa.admission_date < :rangeEnd
        ${scopeCondition}
      GROUP BY cns.assigned_to, team_owner.counsellor_name, fa.counsellor_id, cns.counsellor_name
    `;

    const rows = await sequelize.query(summaryQuery, {
      replacements: { ...baseReplacements, rangeStart, rangeEnd },
      type: sequelize.QueryTypes.SELECT,
    });

    const teamMap = new Map();
    rows.forEach((row) => {
      const teamOwnerId = row.team_owner_id || "UNASSIGNED";
      const teamOwnerName = row.team_owner_name || "Unassigned";
      const count = parseInt(row.admission_count, 10) || 0;

      if (!teamMap.has(teamOwnerId)) {
        teamMap.set(teamOwnerId, {
          team_owner_id: teamOwnerId,
          team_owner_name: teamOwnerName,
          admission_count: 0,
          counsellors: [],
        });
      }
      const team = teamMap.get(teamOwnerId);
      team.admission_count += count;
      team.counsellors.push({
        counsellor_id: row.counsellor_id || "UNASSIGNED",
        counsellor_name: row.counsellor_name || "Unassigned",
        admission_count: count,
      });
    });

    teamMap.forEach((team) => {
      team.counsellors.sort((a, b) => b.admission_count - a.admission_count);
    });

    const data = Array.from(teamMap.values()).sort((a, b) => b.admission_count - a.admission_count);

    return res.json({ success: true, type: ctx.reportType, stats, data });
  } catch (error) {
    console.error("Error in getAdmissionReportSummary:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// reuse the module-level normalizeUniv defined near the top

// Internal API used by other BE services (e.g. CGC BE) that don't have direct DB access
// to the registrations table. Returns phone → campus-group mappings for all COMPLETED registrations.
export const getPaidPhones = async (req, res) => {
  try {
    const completedRegs = await Registration.findAll({
      where: { paymentStatus: "COMPLETED" },
      attributes: ["mobile", "campusLocation", "collegeForApplied"],
      raw: true,
    });

    const phoneMap = new Map();
    completedRegs.forEach(({ mobile, campusLocation, collegeForApplied }) => {
      if (!mobile) return;
      const group = normalizeUniv(campusLocation) || normalizeUniv(collegeForApplied);
      if (!group) return;
      if (!phoneMap.has(mobile)) phoneMap.set(mobile, new Set());
      phoneMap.get(mobile).add(group);
    });

    const data = [...phoneMap.entries()].map(([mobile, groups]) => ({
      mobile,
      groups: [...groups],
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const checkRegistrationFormType = async (req, res) => {
  try {
    const { phone, university_name, course_id } = req.body;

    if (!phone) {
      return res.status(400).json({ success: false, message: "phone is required" });
    }

    const [registration, courseInfo] = await Promise.all([
      Registration.findOne({
        where: { mobile: phone },
        attributes: ["interestedCourse", "collegeForApplied", "campusLocation", "paymentStatus"],
        raw: true,
      }),
      course_id
        ? UniversityCourse.findOne({
            where: { course_id },
            attributes: ["university_name"],
            raw: true,
          })
        : Promise.resolve(null),
    ]);

    const resolvedUniversity = university_name || courseInfo?.university_name || null;

    const courseGroup = normalizeUniv(resolvedUniversity);
    const regCollegeGroup = normalizeUniv(registration?.collegeForApplied);
    const regCampusGroup = normalizeUniv(registration?.campusLocation);

    const collegeMatches =
      courseGroup &&
      (regCollegeGroup === courseGroup || regCampusGroup === courseGroup);

    const form_type =
      collegeMatches && registration?.paymentStatus === "COMPLETED"
        ? "paid"
        : "web";

    return res.json({
      success: true,
      form_type,
      details: {
        phone,
        university_name: resolvedUniversity,
        university_group: courseGroup,
        registration_college: registration?.collegeForApplied || null,
        registration_campus: registration?.campusLocation || null,
        payment_status: registration?.paymentStatus || null,
        interested_course: registration?.interestedCourse || null,
        college_matched: !!collegeMatches,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// ─────────────────────────────────────────────────────────────────────────
// F2A report shared core, ported from Amity's implementation (which fixed
// this same summary-vs-drilldown mismatch there): buildF2AWithClause builds
// the ENTIRE WITH clause — base_students AND every funnel CTE — as a single
// string, and summary / totals-recompute / drilldown all interpolate that
// same string, so they cannot drift apart. Counting is by student_id alone
// (a student can qualify via multiple courses; they count once, not once
// per course). Change eligibility/funnel logic ONLY here.
//
// Adapted from Amity for Regular: keeps Regular's "|||" filter delimiter
// (raw filter values can contain literal commas) and its form_type
// (paid-student) filter, neither of which exist in Amity's version.
// ─────────────────────────────────────────────────────────────────────────

// "Admitted" for F2A means the same thing it means in the Form to Admissions
// report — any of these journey statuses, not just the literal 'Admission'
// one. Keep these two definitions in sync; a narrower F2A-only list caused a
// summary mismatch between the two reports.
const F2A_ADMISSION_STATUSES = `'Registration done','Semester fee paid','Partially Paid','Admission Blocked','Admission'`;

const buildF2AWithClause = async (reqQuery) => {
  const { type = 'agent', start_date, end_date, form_type } = reqQuery;

  const esc = (v) => String(v).replace(/'/g, "''");
  // Delimiter is "|||", not ",", because raw filter values (e.g. "Chandigarh University, Mohali")
  // can contain literal commas — splitting on "," would corrupt those values.
  const toArr = (v) => v ? String(v).split('|||').map(s => s.trim()).filter(Boolean) : [];
  const toIn  = (arr) => arr.map(v => `'${esc(v)}'`).join(',');

  const sources        = toArr(reqQuery.source);
  const sourceUrls     = toArr(reqQuery.source_url);
  const campaigns      = toArr(reqQuery.campaign);
  const universities   = toArr(reqQuery.university_name);
  const l3Counsellors  = toArr(reqQuery.l3_counsellor);

  const { sqlFragment: formTypeSql } = await getFormTypeStudentCondition(form_type);
  const formTypeSqlQualified = formTypeSql.replace(/\bstudent_id\b/, 'csj.student_id');

  const hasFilters        = sources.length || sourceUrls.length || campaigns.length;
  const filterCTE         = hasFilters ? `
    filter_students AS (
      SELECT DISTINCT s.student_id
      FROM students s
      LEFT JOIN (
        SELECT DISTINCT ON (student_id) student_id, utm_campaign
        FROM student_lead_activities ORDER BY student_id, created_at ASC
      ) fla ON fla.student_id = s.student_id
      WHERE 1=1
      ${sources.length    ? `AND s.source IN (${toIn(sources)})`                                   : ''}
      ${sourceUrls.length ? `AND SPLIT_PART(s.first_source_url, '?', 1) IN (${toIn(sourceUrls)})` : ''}
      ${campaigns.length  ? `AND fla.utm_campaign IN (${toIn(campaigns)})`                         : ''}
    ),` : '';

  const filterCondition    = hasFilters ? `AND csj.student_id IN (SELECT student_id FROM filter_students)` : '';
  const filterConditionRaw = hasFilters ? `AND student_id IN (SELECT student_id FROM filter_students)` : '';

  const univJoin         = universities.length ? `JOIN university_courses uc ON csj.course_id = uc.course_id` : '';
  const univCondition    = universities.length ? `AND uc.university_name IN (${toIn(universities)})` : '';
  const univJoinRaw      = universities.length ? `JOIN university_courses uc ON course_status_journeys.course_id = uc.course_id` : '';
  const univConditionRaw = universities.length ? `AND uc.university_name IN (${toIn(universities)})` : '';

  const l3Condition    = l3Counsellors.length ? `AND csj.assigned_l3_counsellor_id IN (SELECT counsellor_id FROM counsellors WHERE counsellor_name IN (${toIn(l3Counsellors)}))` : '';
  const l3ConditionRaw = l3Counsellors.length ? `AND course_status_journeys.assigned_l3_counsellor_id IN (SELECT counsellor_id FROM counsellors WHERE counsellor_name IN (${toIn(l3Counsellors)}))` : '';

  const FORM_STATUSES = `'Form Submitted – Portal Pending','Form Submitted – Completed','Walkin Completed','Exam Interview Pending','Exam/Interview Pending','Exam/Interview Scheduled','Offer Letter/Results Pending','Offer Letter/Results Released','Ready For Admission','Form Filled_Partner website','Form Filled_Degreefyd','Application Fee Paid','Form Submitted – Offline'`;

  const groupExprs = {
    agent:      { label: `COALESCE(c.counsellor_name, 'Unassigned')`,                              join: `LEFT JOIN counsellors c ON csj.assigned_l3_counsellor_id = c.counsellor_id` },
    source:     { label: `COALESCE(s.source, 'Unknown')`,                                          join: `LEFT JOIN students s ON csj.student_id = s.student_id` },
    source_url: { label: `COALESCE(SPLIT_PART(s.first_source_url, '?', 1), 'Unknown')`,           join: `LEFT JOIN students s ON csj.student_id = s.student_id` },
    campaign:   { label: `COALESCE(la.utm_campaign, 'Direct')`,                                    join: `LEFT JOIN first_la la ON la.student_id = csj.student_id` },
    created_at: { label: `TO_CHAR((csj.created_at + interval '5 hours 30 minutes'), 'YYYY-MM-DD')`, join: `` },
  };
  const { label: groupLabel, join: groupJoin } = groupExprs[type] || groupExprs.agent;

  const baseStudentsSQL = type === 'agent' ? `
    SELECT _first.student_id, _first.course_id, COALESCE(c.counsellor_name, 'Unassigned') AS group_label
    FROM (
      SELECT DISTINCT ON (course_status_journeys.student_id, course_status_journeys.course_id)
        course_status_journeys.student_id, course_status_journeys.course_id, course_status_journeys.assigned_l3_counsellor_id,
        TO_CHAR((course_status_journeys.created_at + interval '5 hours 30 minutes'), 'YYYY-MM-DD') AS first_date
      FROM course_status_journeys
      ${univJoinRaw}
      WHERE course_status IN (${FORM_STATUSES})
      ${filterConditionRaw} ${univConditionRaw} ${l3ConditionRaw} ${formTypeSql}
      ORDER BY course_status_journeys.student_id, course_status_journeys.course_id, course_status_journeys.created_at ASC
    ) _first
    LEFT JOIN counsellors c ON _first.assigned_l3_counsellor_id = c.counsellor_id
    ${(start_date && end_date) ? `WHERE _first.first_date >= '${start_date}' AND _first.first_date <= '${end_date}'` : ''}
  ` : type === 'created_at' ? `
    SELECT _first.student_id, _first.course_id, _first.group_label
    FROM (
      SELECT DISTINCT ON (csj.student_id, csj.course_id)
        csj.student_id, csj.course_id,
        TO_CHAR((csj.created_at + interval '5 hours 30 minutes'), 'YYYY-MM-DD') AS group_label
      FROM course_status_journeys csj
      ${univJoin}
      WHERE csj.course_status IN (${FORM_STATUSES})
      ${filterCondition} ${univCondition} ${l3Condition} ${formTypeSqlQualified}
      ORDER BY csj.student_id, csj.course_id, csj.created_at ASC
    ) _first
    ${(start_date && end_date) ? `WHERE _first.group_label >= '${start_date}' AND _first.group_label <= '${end_date}'` : ''}
  ` : `
    SELECT _first.student_id, _first.course_id, _first.group_label
    FROM (
      SELECT DISTINCT ON (csj.student_id, csj.course_id)
        csj.student_id, csj.course_id,
        ${groupLabel} AS group_label,
        TO_CHAR((csj.created_at + interval '5 hours 30 minutes'), 'YYYY-MM-DD') AS first_date
      FROM course_status_journeys csj
      ${groupJoin}
      ${univJoin}
      WHERE csj.course_status IN (${FORM_STATUSES})
      ${filterCondition} ${univCondition} ${l3Condition} ${formTypeSqlQualified}
      ORDER BY csj.student_id, csj.course_id, csj.created_at ASC
    ) _first
    ${(start_date && end_date) ? `WHERE _first.first_date >= '${start_date}' AND _first.first_date <= '${end_date}'` : ''}
  `;

  const withSQL = `
    WITH
    ${filterCTE}
    first_la AS (
      SELECT DISTINCT ON (student_id) student_id, utm_campaign
      FROM student_lead_activities
      ORDER BY student_id, created_at ASC
    ),
    base_students AS (${baseStudentsSQL}),
    student_journey_flags AS (
      SELECT
        student_id,
        BOOL_OR(course_status = 'Form Submitted – Portal Pending')                                        AS form_pp,
        BOOL_OR(course_status = 'Form Submitted – Completed')                                             AS form_completed,
        BOOL_OR(course_status = 'Walkin Completed')                                                       AS walkin_completed,
        BOOL_OR(course_status IN ('Exam/Interview Pending','Exam Interview Pending'))                      AS exam_pending,
        BOOL_OR(course_status IN ('Exam/Interview Scheduled','Exam Interview Scheduled'))                  AS exam_scheduled,
        BOOL_OR(course_status = 'Offer Letter/Results Pending')                                           AS offer_pending,
        BOOL_OR(course_status = 'Offer Letter/Results Released')                                          AS offer_released,
        BOOL_OR(course_status = 'Ready For Admission')                                                    AS ready_for_admission,
        BOOL_OR(course_status IN (${F2A_ADMISSION_STATUSES}))                                              AS ever_admitted
      FROM course_status_journeys
      GROUP BY student_id
    ),
    l3_remark_stats AS (
      SELECT sr.student_id,
        TRUE                                                          AS has_remark,
        BOOL_OR(LOWER(TRIM(sr.calling_status)) = 'connected')        AS has_connected
      FROM student_remarks sr
      INNER JOIN counsellors c ON sr.counsellor_id = c.counsellor_id AND LOWER(c.role) = 'l3'
      GROUP BY sr.student_id
    ),
    ni_students AS (
      SELECT student_id
      FROM (
        SELECT DISTINCT ON (student_id) student_id, course_status
        FROM course_status_journeys
        ORDER BY student_id, created_at DESC
      ) last_csj
      WHERE course_status = 'NotInterested'
    )
  `;

  return {
    withSQL,
    type,
    start_date,
    end_date,
    filterCTE,
    filterConditionRaw,
    univJoinRaw,
    univConditionRaw,
    l3ConditionRaw,
    formTypeSql,
    FORM_STATUSES,
  };
};

// Single controller for F2A Report — mode=summary (default) for the grouped view,
// mode=raw for the paginated drilldown. (Named `mode` rather than `type` since `type`
// is already the grouping-dimension param here.)
export const getF2AReport = async (req, res) => {
  const { mode = 'summary' } = req.query;
  if (mode === 'raw') return f2aReportDrilldown(req, res);
  return f2aReportSummary(req, res);
};

const f2aReportSummary = async (req, res) => {
  try {
    const { type = 'agent' } = req.query;
    const validTypes = ['agent', 'source', 'source_url', 'campaign', 'created_at'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Invalid type' });
    }

    const {
      withSQL, start_date, end_date,
      filterCTE, filterConditionRaw, univJoinRaw, univConditionRaw, l3ConditionRaw, formTypeSql, FORM_STATUSES,
    } = await buildF2AWithClause(req.query);

    const query = `
      ${withSQL}
      SELECT
        bs.group_label,
        COUNT(DISTINCT bs.student_id)                                                                    AS leads,
        COUNT(DISTINCT CASE WHEN lrs.has_remark           THEN bs.student_id END)                       AS attempted,
        COUNT(DISTINCT CASE WHEN sjf.form_pp              THEN bs.student_id END)                       AS form_submitted_pp,
        COUNT(DISTINCT CASE WHEN sjf.form_completed       THEN bs.student_id END)                       AS form_submitted_completed,
        COUNT(DISTINCT CASE WHEN sjf.walkin_completed     THEN bs.student_id END)                       AS walkin_completed,
        COUNT(DISTINCT CASE WHEN sjf.exam_pending         THEN bs.student_id END)                       AS exam_pending,
        COUNT(DISTINCT CASE WHEN sjf.exam_scheduled       THEN bs.student_id END)                       AS exam_scheduled,
        COUNT(DISTINCT CASE WHEN sjf.offer_pending        THEN bs.student_id END)                       AS offer_pending,
        COUNT(DISTINCT CASE WHEN sjf.offer_released       THEN bs.student_id END)                       AS offer_released,
        COUNT(DISTINCT CASE WHEN sjf.ready_for_admission  THEN bs.student_id END)                       AS ready_for_admission,
        COUNT(DISTINCT CASE WHEN sjf.ever_admitted        THEN bs.student_id END)                       AS admission,
        COUNT(DISTINCT CASE WHEN ni.student_id IS NOT NULL THEN bs.student_id END)                      AS ni_count,
        ROUND(100.0 * COUNT(DISTINCT CASE WHEN sjf.ever_admitted THEN bs.student_id END)
              / NULLIF(COUNT(DISTINCT bs.student_id), 0), 1)                                            AS f2a_pct
      FROM base_students bs
      LEFT JOIN student_journey_flags sjf ON bs.student_id = sjf.student_id
      LEFT JOIN l3_remark_stats lrs        ON bs.student_id = lrs.student_id
      LEFT JOIN ni_students ni             ON bs.student_id = ni.student_id
      GROUP BY bs.group_label
      ORDER BY ${type === 'created_at' ? 'bs.group_label DESC' : 'leads DESC'}
    `;

    const rows = await sequelize.query(query, { type: QueryTypes.SELECT });
    const num  = (v) => parseInt(v || 0, 10);

    let totals;
    if (type === 'created_at') {
      // For created_at grouping, per-row student counts can overlap across dates.
      // Compute true totals with a separate deduplicated query.
      const totalQuery = `
        WITH
        ${filterCTE}
        base AS (
          SELECT _first.student_id, _first.course_id
          FROM (
            SELECT DISTINCT ON (course_status_journeys.student_id, course_status_journeys.course_id)
              course_status_journeys.student_id, course_status_journeys.course_id,
              TO_CHAR((course_status_journeys.created_at + interval '5 hours 30 minutes'), 'YYYY-MM-DD') AS first_date
            FROM course_status_journeys
            ${univJoinRaw}
            WHERE course_status_journeys.course_status IN (${FORM_STATUSES})
            ${filterConditionRaw} ${univConditionRaw} ${l3ConditionRaw} ${formTypeSql}
            ORDER BY course_status_journeys.student_id, course_status_journeys.course_id, course_status_journeys.created_at ASC
          ) _first
          ${(start_date && end_date) ? `WHERE _first.first_date >= '${start_date}' AND _first.first_date <= '${end_date}'` : ''}
        ),
        sjf AS (
          SELECT student_id,
            BOOL_OR(course_status = 'Form Submitted – Portal Pending')                       AS form_pp,
            BOOL_OR(course_status = 'Form Submitted – Completed')                             AS form_completed,
            BOOL_OR(course_status = 'Walkin Completed')                                       AS walkin_completed,
            BOOL_OR(course_status IN ('Exam/Interview Pending','Exam Interview Pending'))      AS exam_pending,
            BOOL_OR(course_status IN ('Exam/Interview Scheduled','Exam Interview Scheduled'))  AS exam_scheduled,
            BOOL_OR(course_status = 'Offer Letter/Results Pending')                           AS offer_pending,
            BOOL_OR(course_status = 'Offer Letter/Results Released')                          AS offer_released,
            BOOL_OR(course_status = 'Ready For Admission')                                    AS ready_for_admission,
            BOOL_OR(course_status IN (${F2A_ADMISSION_STATUSES}))                              AS ever_admitted
          FROM course_status_journeys GROUP BY student_id
        ),
        lrs AS (
          SELECT sr.student_id, TRUE AS has_remark
          FROM student_remarks sr
          INNER JOIN counsellors c ON sr.counsellor_id = c.counsellor_id AND LOWER(c.role) = 'l3'
          GROUP BY sr.student_id
        ),
        ni AS (
          SELECT student_id FROM (
            SELECT DISTINCT ON (student_id) student_id, course_status
            FROM course_status_journeys ORDER BY student_id, created_at DESC
          ) last_csj WHERE course_status = 'NotInterested'
        )
        SELECT
          COUNT(DISTINCT b.student_id)                                                        AS leads,
          COUNT(DISTINCT CASE WHEN lrs.has_remark           THEN b.student_id END)           AS attempted,
          COUNT(DISTINCT CASE WHEN sjf.form_pp              THEN b.student_id END)           AS form_submitted_pp,
          COUNT(DISTINCT CASE WHEN sjf.form_completed       THEN b.student_id END)           AS form_submitted_completed,
          COUNT(DISTINCT CASE WHEN sjf.walkin_completed     THEN b.student_id END)           AS walkin_completed,
          COUNT(DISTINCT CASE WHEN sjf.exam_pending         THEN b.student_id END)           AS exam_pending,
          COUNT(DISTINCT CASE WHEN sjf.exam_scheduled       THEN b.student_id END)           AS exam_scheduled,
          COUNT(DISTINCT CASE WHEN sjf.offer_pending        THEN b.student_id END)           AS offer_pending,
          COUNT(DISTINCT CASE WHEN sjf.offer_released       THEN b.student_id END)           AS offer_released,
          COUNT(DISTINCT CASE WHEN sjf.ready_for_admission  THEN b.student_id END)           AS ready_for_admission,
          COUNT(DISTINCT CASE WHEN sjf.ever_admitted        THEN b.student_id END)           AS admission,
          COUNT(DISTINCT CASE WHEN ni.student_id IS NOT NULL THEN b.student_id END)          AS ni_count
        FROM base b
        LEFT JOIN sjf ON b.student_id = sjf.student_id
        LEFT JOIN lrs ON b.student_id = lrs.student_id
        LEFT JOIN ni  ON b.student_id = ni.student_id
      `;
      const [tr] = await sequelize.query(totalQuery, { type: QueryTypes.SELECT });
      totals = { group_label: 'Total', ...Object.fromEntries(Object.entries(tr).map(([k, v]) => [k, num(v)])) };
    } else {
      totals = rows.reduce(
        (acc, r) => {
          acc.leads                    += num(r.leads);
          acc.attempted                += num(r.attempted);
          acc.form_submitted_pp        += num(r.form_submitted_pp);
          acc.form_submitted_completed += num(r.form_submitted_completed);
          acc.walkin_completed         += num(r.walkin_completed);
          acc.exam_pending             += num(r.exam_pending);
          acc.exam_scheduled           += num(r.exam_scheduled);
          acc.offer_pending            += num(r.offer_pending);
          acc.offer_released           += num(r.offer_released);
          acc.ready_for_admission      += num(r.ready_for_admission);
          acc.admission                += num(r.admission);
          acc.ni_count                 += num(r.ni_count);
          return acc;
        },
        { group_label: 'Total', leads: 0, attempted: 0, form_submitted_pp: 0, form_submitted_completed: 0, walkin_completed: 0, exam_pending: 0, exam_scheduled: 0, offer_pending: 0, offer_released: 0, ready_for_admission: 0, admission: 0, ni_count: 0 }
      );
    }
    totals.f2a_pct = totals.leads > 0 ? parseFloat((totals.admission / totals.leads * 100).toFixed(1)) : 0;

    return res.status(200).json({ success: true, data: [...rows, totals] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const f2aReportDrilldown = async (req, res) => {
  try {
    const { type = 'agent', group_label, bucket = 'leads' } = req.query;
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = 10;
    const offset = (page - 1) * limit;

    const validTypes   = ['agent', 'source', 'source_url', 'campaign', 'created_at'];
    const validBuckets = ['leads', 'attempted', 'connected', 'form_submitted_pp', 'form_submitted_completed',
      'walkin_completed', 'exam_pending', 'exam_scheduled', 'offer_pending', 'offer_released',
      'ready_for_admission', 'admission', 'ni_count'];

    if (!validTypes.includes(type))     return res.status(400).json({ success: false, message: 'Invalid type' });
    if (!validBuckets.includes(bucket)) return res.status(400).json({ success: false, message: 'Invalid bucket' });
    if (!group_label)                   return res.status(400).json({ success: false, message: 'group_label is required' });

    const { withSQL } = await buildF2AWithClause(req.query);

    const BUCKET_WHERE = {
      leads:                    `1=1`,
      attempted:                `lrs.has_remark IS TRUE`,
      connected:                `lrs.has_connected IS TRUE`,
      form_submitted_pp:        `sjf.form_pp IS TRUE`,
      form_submitted_completed: `sjf.form_completed IS TRUE`,
      walkin_completed:         `sjf.walkin_completed IS TRUE`,
      exam_pending:             `sjf.exam_pending IS TRUE`,
      exam_scheduled:           `sjf.exam_scheduled IS TRUE`,
      offer_pending:            `sjf.offer_pending IS TRUE`,
      offer_released:           `sjf.offer_released IS TRUE`,
      ready_for_admission:      `sjf.ready_for_admission IS TRUE`,
      admission:                `sjf.ever_admitted IS TRUE`,
      ni_count:                 `ni.student_id IS NOT NULL`,
    };

    const query = `
      ${withSQL}
      SELECT *, COUNT(*) OVER() AS _total_count FROM (SELECT DISTINCT ON (bs.student_id)
        bs.student_id,
        st.student_name,
        st.student_phone,
        st.student_email,
        st.source,
        st.current_student_status,
        uc_out.course_name,
        uc_out.university_name,
        COALESCE(cl.counsellor_name, 'Unassigned') AS counsellor_name,
        st.created_at
      FROM base_students bs
      LEFT JOIN student_journey_flags sjf ON bs.student_id = sjf.student_id
      LEFT JOIN l3_remark_stats lrs        ON bs.student_id = lrs.student_id
      LEFT JOIN ni_students ni             ON bs.student_id = ni.student_id
      LEFT JOIN students st                ON st.student_id = bs.student_id
      LEFT JOIN counsellors cl             ON st.assigned_counsellor_id = cl.counsellor_id
      LEFT JOIN university_courses uc_out  ON uc_out.course_id = bs.course_id
      WHERE bs.group_label = $group_label
        AND (${BUCKET_WHERE[bucket]})
      -- base_students has one row per (student_id, course_id) — a student
      -- with multiple courses would otherwise appear as multiple rows here,
      -- inflating the drilldown count above the summary's
      -- COUNT(DISTINCT bs.student_id). DISTINCT ON collapses to one row per
      -- student, matching the summary's per-student semantics.
      ORDER BY bs.student_id, st.created_at DESC) _sub
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await sequelize.query(query, {
      type: QueryTypes.SELECT,
      bind: { group_label },
    });

    const total = rows.length > 0 ? parseInt(rows[0]._total_count) : 0;
    const data  = rows.map(({ _total_count, ...r }) => r);
    return res.status(200).json({ success: true, data, total, page, limit });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

export const getF2AFilterOptions = async (req, res) => {
  try {
    const [sources, sourceUrls, campaigns, universities, l3Counsellors] = await Promise.all([
      sequelize.query(
        `SELECT DISTINCT source FROM students WHERE source IS NOT NULL AND source != '' ORDER BY source`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DISTINCT SPLIT_PART(first_source_url, '?', 1) AS source_url FROM students WHERE first_source_url IS NOT NULL AND first_source_url != '' ORDER BY source_url`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DISTINCT utm_campaign FROM student_lead_activities WHERE utm_campaign IS NOT NULL AND utm_campaign != '' ORDER BY utm_campaign`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DISTINCT uc.university_name
         FROM university_courses uc
         JOIN course_status_journeys csj ON csj.course_id = uc.course_id
         WHERE csj.course_status IN (
           'Form Submitted – Portal Pending','Form Submitted – Completed','Walkin Completed',
           'Exam Interview Pending','Exam/Interview Pending','Exam/Interview Scheduled',
           'Offer Letter/Results Pending','Offer Letter/Results Released','Ready For Admission',
           'Form Filled_Partner website','Form Filled_Degreefyd','Application Fee Paid','Form Submitted – Offline'
         )
         AND uc.university_name IS NOT NULL AND uc.university_name != ''
         ORDER BY uc.university_name`,
        { type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT DISTINCT c.counsellor_name
         FROM counsellors c
         JOIN course_status_journeys csj ON csj.assigned_l3_counsellor_id = c.counsellor_id
         WHERE LOWER(c.role) = 'l3'
           AND c.counsellor_name IS NOT NULL AND c.counsellor_name != ''
           AND csj.course_status IN (
             'Form Submitted – Portal Pending','Form Submitted – Completed','Walkin Completed',
             'Exam Interview Pending','Exam/Interview Pending','Exam/Interview Scheduled',
             'Offer Letter/Results Pending','Offer Letter/Results Released','Ready For Admission',
             'Form Filled_Partner website','Form Filled_Degreefyd','Application Fee Paid','Form Submitted – Offline'
           )
         ORDER BY c.counsellor_name`,
        { type: QueryTypes.SELECT }
      ),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        sources:        sources.map(r => r.source),
        source_urls:    sourceUrls.map(r => r.source_url),
        campaigns:      campaigns.map(r => r.utm_campaign),
        universities:   universities.map(r => r.university_name),
        l3_counsellors: l3Counsellors.map(r => r.counsellor_name),
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};