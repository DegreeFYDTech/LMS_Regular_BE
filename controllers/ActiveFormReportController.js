import { QueryTypes } from 'sequelize';
import sequelize from '../config/database-config.js';

/**
 * Report college wise active forms categorized by last L3 remark activity.
 * Supports two types of reports:
 * 1. summary (default): Grouped by college with counts.
 * 2. raw: Detailed list of students with their statuses and remarks.
 * 
 * Filters: date_from, date_to, type (summary|raw)
 * Timezone: IST (UTC+5:30)
 */
export const getActiveFormCollegeReport = async (req, res) => {
    const { date_from, date_to, type = 'summary' } = req.query;

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
        const baseCTEs = `
            WITH latest_status AS (
                SELECT DISTINCT ON (student_id, course_id)
                    student_id,
                    course_id,
                    course_status
                FROM course_status_journeys
                ORDER BY student_id, course_id, created_at DESC
            ),
            active_now AS (
                SELECT student_id, course_id, course_status
                FROM latest_status
                WHERE course_status IN (:statuses)
            ),
            first_entry_in_range AS (
                SELECT DISTINCT ON (student_id, course_id)
                    student_id,
                    course_id,
                    (created_at + interval '5 hours 30 minutes') as entry_date
                FROM course_status_journeys
                WHERE course_status IN (:statuses)
                  AND (created_at + interval '5 hours 30 minutes') >= :date_from_start
                  AND (created_at + interval '5 hours 30 minutes') <= :date_to_end
                ORDER BY student_id, course_id, (created_at + interval '5 hours 30 minutes') ASC
            ),
            current_active_students AS (
                SELECT 
                    fe.student_id,
                    fe.course_id,
                    fe.entry_date,
                    uc.university_name,
                    uc.course_name,
                    an.course_status
                FROM first_entry_in_range fe
                JOIN active_now an ON fe.student_id = an.student_id AND fe.course_id = an.course_id
                JOIN university_courses uc ON fe.course_id = uc.course_id
            )
        `;

        let query = '';
        if (type === 'raw') {
            query = `
                ${baseCTEs},
                latest_l3_remark AS (
                    SELECT DISTINCT ON (sr.student_id)
                        sr.student_id,
                        (sr.created_at + interval '5 hours 30 minutes') as remark_at_ist,
                        sr.remarks as remark_content,
                        c.counsellor_name as l3_counsellor_name
                    FROM student_remarks sr
                    JOIN counsellors c ON sr.counsellor_id = c.counsellor_id
                    WHERE lower(c.role) = 'l3'
                    ORDER BY sr.student_id, sr.created_at DESC
                )
                SELECT 
                    cas.student_id,
                    cas.course_name,
                    cas.university_name as college_name,
                    cas.course_status,
                    cas.entry_date as form_filled_date,
                    lsr.remark_at_ist as last_l3_remark_date,
                    lsr.remark_content as last_l3_remark,
                    lsr.l3_counsellor_name
                FROM current_active_students cas
                LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id
                ORDER BY cas.entry_date DESC;
            `;
        } else {
            query = `
                ${baseCTEs},
                latest_l3_remark AS (
                    SELECT DISTINCT ON (sr.student_id)
                        sr.student_id,
                        (sr.created_at + interval '5 hours 30 minutes') as remark_at_ist
                    FROM student_remarks sr
                    JOIN counsellors c ON sr.counsellor_id = c.counsellor_id
                    WHERE lower(c.role) = 'l3'
                    ORDER BY sr.student_id, sr.created_at DESC
                ),
                active_form_analysis AS (
                    SELECT
                        cas.*,
                        lsr.remark_at_ist,
                        CASE
                            WHEN lsr.student_id IS NULL THEN 'Not Worked'
                            ELSE 'Worked'
                        END as worked_status,
                        CASE
                            WHEN lsr.student_id IS NOT NULL THEN
                                EXTRACT(DAY FROM ((CURRENT_TIMESTAMP + interval '5 hours 30 minutes') - lsr.remark_at_ist))
                            ELSE NULL
                        END as days_since
                    FROM current_active_students cas
                    LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id
                )
                SELECT 
                    university_name,
                    COUNT(*) FILTER (WHERE worked_status = 'Not Worked') as not_worked_cases,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since >= 0 AND days_since <= 3) as days_0_3,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since >= 4 AND days_since <= 6) as days_4_6,
                    COUNT(*) FILTER (WHERE worked_status = 'Worked' AND days_since > 6) as days_6_plus,
                    COUNT(*) as total_count
                FROM active_form_analysis
                GROUP BY university_name
                ORDER BY university_name;
            `;
        }

        const reportData = await sequelize.query(query, {
            replacements: { 
                statuses: ACTIVE_FORM_STATUSES, 
                date_from_start: `${date_from} 00:00:00`, 
                date_to_end: `${date_to} 23:59:59` 
            },
            type: QueryTypes.SELECT
        });

        res.status(200).json(reportData);
    } catch (error) {
        console.error("Error in getActiveFormCollegeReport:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
