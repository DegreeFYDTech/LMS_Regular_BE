import { QueryTypes } from 'sequelize';
import ExcelJS from 'exceljs';
import sequelize from '../config/database-config.js';
import { getFormTypeStudentCondition } from './StudentCourseStatusLogs.controller.js';

export const getActiveFormCollegeReport = async (req, res) => {
    const {
        date_from,
        date_to,
        type = 'summary',
        drill_group,
        drill_category,
        group_by = 'college',
        form_type,
    } = req.query;

    const { sqlFragment: formTypeSql } = await getFormTypeStudentCondition(form_type);

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
        // Date range is optional — when omitted, the report covers all-time data (no entry_date filter).
        const entryDateFilter = date_from && date_to
            ? `AND sca.entry_date >= :date_from_start ::timestamp
               AND sca.entry_date <= :date_to_end ::timestamp`
            : '';

        // student_course_agg: one pass over course_status_journeys per (student_id, course_id) —
        // ARRAY_AGG(...)[1] recovers the latest course_status/counsellor (replaces a DISTINCT ON
        // scan+sort), while MIN(...) FILTER recovers the first-ever entry into an active status
        // (replaces a second GROUP BY scan). Folding both into one GROUP BY avoids scanning this
        // large table twice.
        const baseCTEs = `
            WITH student_course_agg AS (
                SELECT
                    student_id,
                    course_id,
                    (ARRAY_AGG(course_status ORDER BY created_at DESC))[1] AS course_status,
                    (ARRAY_AGG(assigned_l3_counsellor_id ORDER BY created_at DESC))[1] AS assigned_l3_counsellor_id,
                    MIN(created_at AT TIME ZONE 'Asia/Kolkata') FILTER (WHERE course_status IN (:statuses)) AS entry_date
                FROM course_status_journeys
                WHERE 1=1
                ${formTypeSql}
                GROUP BY student_id, course_id
            ),
            current_active_students AS (
                SELECT
                    sca.student_id,
                    sca.course_id,
                    sca.entry_date,
                    uc.university_name,
                    uc.course_name,
                    sca.course_status,
                    sca.assigned_l3_counsellor_id
                FROM student_course_agg sca
                JOIN university_courses uc ON sca.course_id = uc.course_id
                WHERE sca.course_status IN (:statuses)
                ${entryDateFilter}
            )
        `;

        // Matches the Counsellor Performance Dashboard's "not initiated" rule: only a remark from
        // the counsellor actually assigned to this student+course counts as "worked" — a remark
        // from a different L3 counsellor does not. Tracked per (student_id, course_id), not
        // shared across a student's other active courses.
        const latestL3RemarkCTE = `
            latest_l3_remark AS (
                SELECT DISTINCT ON (cas.student_id, cas.course_id)
                    cas.student_id,
                    cas.course_id,
                    (sr.created_at AT TIME ZONE 'Asia/Kolkata') AS remark_at_ist,
                    sr.remarks AS remark_content,
                    c.counsellor_name AS l3_counsellor_name
                FROM current_active_students cas
                JOIN student_remarks sr ON sr.student_id = cas.student_id
                    AND sr.counsellor_id = cas.assigned_l3_counsellor_id
                JOIN counsellors c ON sr.counsellor_id = c.counsellor_id
                ORDER BY cas.student_id, cas.course_id, sr.created_at DESC
            )
        `;

        const daysSinceExpr = `EXTRACT(DAY FROM ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata') - lsr.remark_at_ist))`;

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
                    LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id AND cas.course_id = lsr.course_id
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
        } else if (type === 'raw' || type === 'export') {
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
                    LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id AND cas.course_id = lsr.course_id
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
                    LEFT JOIN latest_l3_remark lsr ON cas.student_id = lsr.student_id AND cas.course_id = lsr.course_id
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
        };
        if (date_from && date_to) {
            replacements.date_from_start = `${date_from} 00:00:00`;
            replacements.date_to_end = `${date_to} 23:59:59`;
        }
        if (drill_group) replacements.drill_group = drill_group;

        const reportData = await sequelize.query(query, {
            replacements,
            type: QueryTypes.SELECT,
        });

        if (type === 'export') {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Active Form Report');

            sheet.columns = [
                { header: 'Student ID', key: 'student_id', width: 20 },
                { header: 'Course Name', key: 'course_name', width: 30 },
                { header: 'College', key: 'college_name', width: 30 },
                { header: 'Current Status', key: 'course_status', width: 28 },
                { header: 'Assigned L3', key: 'assigned_l3_name', width: 22 },
                { header: 'Form Filled Date', key: 'form_filled_date', width: 20 },
                { header: 'Last L3 Remark Date', key: 'last_l3_remark_date', width: 20 },
                { header: 'Last L3 Remark', key: 'last_l3_remark', width: 40 },
                { header: 'L3 Counsellor (Remarked)', key: 'l3_counsellor_name', width: 22 },
                { header: 'Worked Status', key: 'worked_status', width: 16 },
                { header: 'Days Since Remark', key: 'days_since', width: 18 },
            ];

            const headerRow = sheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4B0082' },
            };

            reportData.forEach((row) => sheet.addRow(row));

            res.setHeader(
                'Content-Type',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
            res.setHeader(
                'Content-Disposition',
                `attachment; filename="active_form_report_${date_from || 'all'}_to_${date_to || 'all'}.xlsx"`,
            );
            await workbook.xlsx.write(res);
            return res.end();
        }

        res.status(200).json(reportData);
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
