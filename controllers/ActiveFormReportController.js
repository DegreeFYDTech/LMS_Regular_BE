import { QueryTypes } from 'sequelize';
import sequelize from '../config/database-config.js';

export const getActiveFormCollegeReport = async (req, res) => {
    const {
        date_from,
        date_to,
        type = 'summary',
        drill_group,
        drill_category,
        group_by = 'college',
    } = req.query;

    if (!date_from || !date_to) {
        return res.status(400).json({ message: "date_from and date_to are required" });
    }

    const ACTIVE_FORM_STATUSES = [
        "Exam Interview Pending",
        "Ready For Admission",
        "Offer Letter/Results Pending",
        "Form Filled_Partner website",
        "Form Submitted – Portal Pending",
        "Offer Letter/Results Released",
        "Application Fee Paid",
        "Walkin Completed",
        "Form Submitted – Offline",
        "Form Filled_Degreefyd",
        "Exam/Interview Scheduled",
        "Form Submitted – Completed",
    ];

    try {
        // first_entry_in_range: only students whose FIRST EVER entry in those statuses
        // (per student+course) falls within the date range.
        const baseCTEs = `
            WITH latest_status AS (
                SELECT DISTINCT ON (student_id, course_id)
                    student_id,
                    course_id,
                    course_status,
                    assigned_l3_counsellor_id
                FROM course_status_journeys
                ORDER BY student_id, course_id, created_at DESC
            ),
            active_now AS (
                SELECT student_id, course_id, course_status, assigned_l3_counsellor_id
                FROM latest_status
                WHERE course_status IN (:statuses)
            ),
            first_entry_in_range AS (
                SELECT student_id, course_id,
                       MIN(created_at + interval '5 hours 30 minutes') AS entry_date
                FROM course_status_journeys
                WHERE course_status IN (:statuses)
                GROUP BY student_id, course_id
                HAVING MIN(created_at + interval '5 hours 30 minutes') >= :date_from_start ::timestamp
                   AND MIN(created_at + interval '5 hours 30 minutes') <= :date_to_end ::timestamp
            ),
            current_active_students AS (
                SELECT
                    fe.student_id,
                    fe.course_id,
                    fe.entry_date,
                    uc.university_name,
                    uc.course_name,
                    an.course_status,
                    an.assigned_l3_counsellor_id
                FROM first_entry_in_range fe
                JOIN active_now an ON fe.student_id = an.student_id AND fe.course_id = an.course_id
                JOIN university_courses uc ON fe.course_id = uc.course_id
            )
        `;

        const latestL3RemarkCTE = `
            latest_l3_remark AS (
                SELECT DISTINCT ON (sr.student_id)
                    sr.student_id,
                    (sr.created_at + interval '5 hours 30 minutes') AS remark_at_ist,
                    sr.remarks AS remark_content,
                    c.counsellor_name AS l3_counsellor_name
                FROM student_remarks sr
                JOIN counsellors c ON sr.counsellor_id = c.counsellor_id
                WHERE lower(c.role) = 'l3'
                ORDER BY sr.student_id, sr.created_at DESC
            )
        `;

        const daysSinceExpr = `EXTRACT(DAY FROM ((CURRENT_TIMESTAMP + interval '5 hours 30 minutes') - lsr.remark_at_ist))`;

        let query = '';

        if (type === 'l3_summary') {
            query = `
                ${baseCTEs},
                ${latestL3RemarkCTE},
                active_form_analysis AS (
                    SELECT
                        cas.*,
                        COALESCE(c.counsellor_name, 'Unassigned') AS assigned_l3_name,
                        lsr.remark_at_ist,
                        CASE WHEN lsr.student_id IS NULL THEN 'Not Worked' ELSE 'Worked' END AS worked_status,
                        CASE WHEN lsr.student_id IS NOT NULL THEN ${daysSinceExpr} ELSE NULL END AS days_since
                    FROM current_active_students cas
                    LEFT JOIN counsellors c ON cas.assigned_l3_counsellor_id = c.counsellor_id
                    LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id
                )
                SELECT
                    assigned_l3_name,
                    COUNT(*) FILTER (WHERE worked_status = 'Not Worked') AS not_worked_cases,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since >= 0 AND days_since <= 3) AS days_0_3,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since >= 4 AND days_since <= 6) AS days_4_6,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since > 6) AS days_6_plus,
                    COUNT(*) AS total_count
                FROM active_form_analysis
                GROUP BY assigned_l3_name
                ORDER BY assigned_l3_name;
            `;
        } else if (type === 'raw') {
            // Build optional drill-down filters — reference analysis CTE columns, not raw aliases
            let groupFilter = '';
            if (drill_group) {
                groupFilter = group_by === 'l3'
                    ? `AND assigned_l3_name = :drill_group`
                    : `AND university_name = :drill_group`;
            }

            let categoryFilter = '';
            if (drill_category === 'not_worked') {
                categoryFilter = `AND worked_status = 'Not Worked'`;
            } else if (drill_category === 'days_0_3') {
                categoryFilter = `AND worked_status = 'Worked' AND days_since >= 0 AND days_since <= 3`;
            } else if (drill_category === 'days_4_6') {
                categoryFilter = `AND worked_status = 'Worked' AND days_since >= 4 AND days_since <= 6`;
            } else if (drill_category === 'days_6_plus') {
                categoryFilter = `AND worked_status = 'Worked' AND days_since > 6`;
            }

            query = `
                ${baseCTEs},
                ${latestL3RemarkCTE},
                analysis AS (
                    SELECT
                        cas.student_id,
                        cas.course_id,
                        cas.course_name,
                        cas.university_name,
                        cas.course_status,
                        cas.entry_date,
                        cas.assigned_l3_counsellor_id,
                        COALESCE(lc.counsellor_name, 'Unassigned') AS assigned_l3_name,
                        lsr.remark_at_ist,
                        lsr.remark_content,
                        lsr.l3_counsellor_name,
                        CASE WHEN lsr.student_id IS NULL THEN 'Not Worked' ELSE 'Worked' END AS worked_status,
                        CASE WHEN lsr.student_id IS NOT NULL THEN ${daysSinceExpr} ELSE NULL END AS days_since
                    FROM current_active_students cas
                    LEFT JOIN counsellors lc ON cas.assigned_l3_counsellor_id = lc.counsellor_id
                    LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id
                )
                SELECT
                    student_id,
                    course_name,
                    university_name AS college_name,
                    course_status,
                    entry_date AS form_filled_date,
                    assigned_l3_name,
                    remark_at_ist AS last_l3_remark_date,
                    remark_content AS last_l3_remark,
                    l3_counsellor_name,
                    worked_status,
                    days_since
                FROM analysis
                WHERE 1=1
                  ${groupFilter}
                  ${categoryFilter}
                ORDER BY entry_date DESC;
            `;
        } else {
            // summary (default) — grouped by college
            query = `
                ${baseCTEs},
                ${latestL3RemarkCTE},
                active_form_analysis AS (
                    SELECT
                        cas.*,
                        lsr.remark_at_ist,
                        CASE WHEN lsr.student_id IS NULL THEN 'Not Worked' ELSE 'Worked' END AS worked_status,
                        CASE WHEN lsr.student_id IS NOT NULL THEN ${daysSinceExpr} ELSE NULL END AS days_since
                    FROM current_active_students cas
                    LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id
                )
                SELECT
                    university_name,
                    COUNT(*) FILTER (WHERE worked_status = 'Not Worked') AS not_worked_cases,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since >= 0 AND days_since <= 3) AS days_0_3,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since >= 4 AND days_since <= 6) AS days_4_6,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since > 6) AS days_6_plus,
                    COUNT(*) AS total_count
                FROM active_form_analysis
                GROUP BY university_name
                ORDER BY university_name;
            `;
        }

        const replacements = {
            statuses: ACTIVE_FORM_STATUSES,
            date_from_start: `${date_from} 00:00:00`,
            date_to_end: `${date_to} 23:59:59`,
        };
        if (drill_group) replacements.drill_group = drill_group;

        const reportData = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT,
        });

        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error in getActiveFormCollegeReport:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
