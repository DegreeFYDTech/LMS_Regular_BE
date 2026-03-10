import axios from "axios";
import {
  UniversityCourse,
  CourseStatus,
  Student,
  Counsellor,
  sequelize,
  StudentRemark,
} from "../models/index.js";
import { col, fn, literal, Op, QueryTypes, Sequelize } from "sequelize";
import CourseStatusJourney from "../models/course_status_jounreny.js";

export const getCounsellorStats = async (req, res) => {
  try {
    const { start_date, end_date, counsellor_id } = req.query;

    let dateFilter = "";
    if (start_date && end_date) {
      dateFilter = `
        AND (fs.first_status_date AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date 
        BETWEEN '${start_date}' AND '${end_date}'
      `;
    }

    let counsellorFilter = "";
    if (counsellor_id) {
      counsellorFilter = ` AND fs.assigned_l3_counsellor_id = '${counsellor_id}' `;
    }

    const stats = await sequelize.query(
      `
      WITH 
      -- ALL distinct student-course combinations
      all_combinations AS (
        SELECT DISTINCT 
            student_id, 
            course_id
        FROM course_status_journeys
      ),

      -- Get first status details for each combination
      first_status AS (
        SELECT DISTINCT ON (student_id, course_id)
            student_id,
            course_id,
            course_status,
            created_at AS first_status_date,
            counsellor_id AS status_created_by,
            assigned_l3_counsellor_id  -- The L3 counsellor assigned to this student-course
        FROM course_status_journeys
        ORDER BY student_id, course_id, created_at ASC
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

      -- Base table with ALL combinations
      base AS (
        SELECT 
            ac.student_id,
            ac.course_id,
            fs.first_status_date,
            fs.status_created_by,
            fs.assigned_l3_counsellor_id,
            fr.first_remark_date,  -- First remark by assigned L3 counsellor (NULL if no remark)
            ls.latest_status,
            -- Calculate days difference ONLY if remark exists
            CASE 
                WHEN fr.first_remark_date IS NOT NULL 
                THEN GREATEST(0, EXTRACT(DAY FROM (fr.first_remark_date - fs.first_status_date)))
                ELSE NULL
            END AS days_to_first_action,
            c.counsellor_name,
            CONCAT(ac.student_id, '_', ac.course_id) AS student_course_key
        FROM all_combinations ac
        JOIN first_status fs ON ac.student_id = fs.student_id AND ac.course_id = fs.course_id
        LEFT JOIN first_remark_by_l3 fr ON ac.student_id = fr.student_id AND ac.course_id = fr.course_id
        LEFT JOIN latest_status ls ON ac.student_id = ls.student_id AND ac.course_id = ls.course_id
        LEFT JOIN counsellors c ON fs.assigned_l3_counsellor_id = c.counsellor_id
        WHERE fs.course_status <> 'Shortlisted'
        ${dateFilter}
        ${counsellorFilter}
      )

      SELECT 
          COALESCE(b.assigned_l3_counsellor_id, 'Unassigned') AS assigned_l3_counsellor_id,
          COALESCE(b.counsellor_name, 'Unassigned') AS counsellor_name,
          
          -- TOTAL FORMS: All combinations for this L3 counsellor
          COUNT(DISTINCT b.student_course_key) AS total_forms,
          
          -- ACTIVE FORMS: Where latest status is not completed
          COUNT(DISTINCT CASE 
              WHEN b.latest_status NOT IN (
                'Registration done',
                'Partially Paid',
                'Semester Paid',
                'Enrollment in Process',
                'Enrolled'
              ) OR b.latest_status IS NULL
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
    console.error("Error fetching counsellor stats:", error);
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
    console.error('Error in getFormData:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
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
        message: "Please provide till_date parameter (YYYY-MM-DD)",
      });
    }

    const selectedDate = new Date(till_date);
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");

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
        tillDate: till_date,
      },
      type: sequelize.QueryTypes.SELECT,
    });

    // Calculate totals
    const totals = results.reduce(
      (acc, curr) => ({
        ytd_forms: acc.ytd_forms + (parseInt(curr.ytd_forms) || 0),
        ytd_admissions:
          acc.ytd_admissions + (parseInt(curr.ytd_admissions) || 0),
        mtd_forms: acc.mtd_forms + (parseInt(curr.mtd_forms) || 0),
        mtd_admissions:
          acc.mtd_admissions + (parseInt(curr.mtd_admissions) || 0),
        ftd_forms: acc.ftd_forms + (parseInt(curr.ftd_forms) || 0),
        ftd_admissions:
          acc.ftd_admissions + (parseInt(curr.ftd_admissions) || 0),
      }),
      {
        ytd_forms: 0,
        ytd_admissions: 0,
        mtd_forms: 0,
        mtd_admissions: 0,
        ftd_forms: 0,
        ftd_admissions: 0,
      },
    );

    // Add totals row
    const responseData = [
      ...results,
      {
        college_name: "Total",
        ytd_forms: totals.ytd_forms,
        ytd_admissions: totals.ytd_admissions,
        ytd_f2a:
          totals.ytd_forms > 0
            ? Number(
                ((totals.ytd_admissions / totals.ytd_forms) * 100).toFixed(1),
              )
            : 0,
        mtd_forms: totals.mtd_forms,
        mtd_admissions: totals.mtd_admissions,
        mtd_f2a:
          totals.mtd_forms > 0
            ? Number(
                ((totals.mtd_admissions / totals.mtd_forms) * 100).toFixed(1),
              )
            : 0,
        ftd_forms: totals.ftd_forms,
        ftd_admissions: totals.ftd_admissions,
        ftd_f2a:
          totals.ftd_forms > 0
            ? Number(
                ((totals.ftd_admissions / totals.ftd_forms) * 100).toFixed(1),
              )
            : 0,
      },
    ];

    return res.status(200).json({
      success: true,
      data: responseData,
      filters: {
        till_date,
        ytd_range: `${ytdStartDate} to ${till_date}`,
        mtd_range: `${mtdStartDate} to ${till_date}`,
        ftd_date: till_date,
      },
      message: "Form to Admissions report fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching form to admissions report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch form to admissions report",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
      firstTimeFrom, // New: First time date range start
      firstTimeTo, // New: First time date range end
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
          firstTimeFrom, // Pass to helper
          firstTimeTo, // Pass to helper
        );
        break;

      case "l2":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l2",
          courseWhereClause,
          firstTimeFrom, // Pass to helper
          firstTimeTo, // Pass to helper
        );
        break;

      case "l3":
        result = await getCounsellorPivotReport(
          whereClause,
          startDate,
          endDate,
          "l3",
          courseWhereClause,
          firstTimeFrom, // Pass to helper
          firstTimeTo, // Pass to helper
        );
        break;

      default:
        result = await getCollegesPivotReport(
          whereClause,
          startDate,
          endDate,
          courseWhereClause,
          firstTimeFrom, // Pass to helper
          firstTimeTo, // Pass to helper
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
  const aggFn = isFirstTimeDateFilter ? "MIN" : "MAX";

  // Build single raw SQL query
  let innerWhere = "";
  const replacements = {};

  if (isFirstTimeDateFilter) {
    const conditions = [];
    if (firstTimeFrom) {
      conditions.push(`csh_inner.created_at >= :firstTimeFrom`);
      replacements.firstTimeFrom = firstTimeFrom + "T00:00:00Z";
    }
    if (firstTimeTo) {
      conditions.push(`csh_inner.created_at <= :firstTimeTo`);
      replacements.firstTimeTo = firstTimeTo + "T23:59:59.999Z";
    }
    innerWhere = `WHERE ${conditions.join(" AND ")}`;
  }

  let havingClause = "";
  if (isMainDateFilter) {
    const havingConditions = [];
    if (startDate) {
      havingConditions.push(
        `DATE(${aggFn}(csh_inner.created_at)) >= :startDate`,
      );
      replacements.startDate = startDate;
    }
    if (endDate) {
      havingConditions.push(`DATE(${aggFn}(csh_inner.created_at)) <= :endDate`);
      replacements.endDate = endDate;
    }
    havingClause = `HAVING ${havingConditions.join(" AND ")}`;
  }

  let courseFilter = "";
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
) => {
  const isFirstTimeDateFilter = !!(firstTimeFrom || firstTimeTo);
  const isMainDateFilter = !!(startDate || endDate);
  const aggFn = isFirstTimeDateFilter ? "MIN" : "MAX";

  // Build single raw SQL query
  let innerWhere = "";
  const replacements = {};

  if (isFirstTimeDateFilter) {
    const conditions = [];
    if (firstTimeFrom) {
      conditions.push(`csh_inner.created_at >= :firstTimeFrom`);
      replacements.firstTimeFrom = firstTimeFrom + "T00:00:00Z";
    }
    if (firstTimeTo) {
      conditions.push(`csh_inner.created_at <= :firstTimeTo`);
      replacements.firstTimeTo = firstTimeTo + "T23:59:59.999Z";
    }
    innerWhere = `WHERE ${conditions.join(" AND ")}`;
  }

  let havingClause = "";
  if (isMainDateFilter) {
    const havingConditions = [];
    if (startDate) {
      havingConditions.push(
        `DATE(${aggFn}(csh_inner.created_at)) >= :startDate`,
      );
      replacements.startDate = startDate;
    }
    if (endDate) {
      havingConditions.push(`DATE(${aggFn}(csh_inner.created_at)) <= :endDate`);
      replacements.endDate = endDate;
    }
    havingClause = `HAVING ${havingConditions.join(" AND ")}`;
  }

  let courseFilter = "";
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

  const rows = Array.from(counsellorMap.values()).map((item) => {
    const counsellorName =
      item.counsellorId === "unassigned"
        ? "Unassigned"
        : counsellorNameMap[item.counsellorId] ||
          `Unknown (${item.counsellorId})`;

    const row = { counsellor: counsellorName, total: item.total };
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
