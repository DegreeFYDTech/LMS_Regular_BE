import { QueryTypes } from "sequelize";
import sequelize from "../config/database-config.js";
import ExcelJS from "exceljs";

export const getFirstRemarkTimeReport = async (req, res) => {
  const {
    date_from,
    date_to,
    source,
    source_url,
    campaign,
    type = "summary",
    group_by = "counsellor",
    drill_group,
    drill_bucket,
  } = req.query;

  const replacements = {};

  // Optional filters applied inside the first_activity CTE
  // source and campaign accept comma-separated values (multiselect from UI)
  let activityFilters = "";
  if (source) {
    const sourceList = source.split(",").map((s) => s.trim()).filter(Boolean);
    if (sourceList.length === 1) {
      activityFilters += ` AND la.source ILIKE :source`;
      replacements.source = `%${sourceList[0]}%`;
    } else if (sourceList.length > 1) {
      const clauses = sourceList.map((s, i) => {
        replacements[`source_${i}`] = s;
        return `la.source ILIKE :source_${i}`;
      });
      activityFilters += ` AND (${clauses.join(" OR ")})`;
    }
  }
  if (source_url) {
    const urlList = source_url.split(",").map((u) => u.trim()).filter(Boolean);
    if (urlList.length === 1) {
      activityFilters += ` AND la.source_url ILIKE :source_url`;
      replacements.source_url = `%${urlList[0]}%`;
    } else if (urlList.length > 1) {
      const clauses = urlList.map((u, i) => {
        replacements[`source_url_${i}`] = u;
        return `la.source_url ILIKE :source_url_${i}`;
      });
      activityFilters += ` AND (${clauses.join(" OR ")})`;
    }
  }
  if (campaign) {
    const campaignList = campaign.split(",").map((c) => c.trim()).filter(Boolean);
    if (campaignList.length === 1) {
      activityFilters += ` AND la.utm_campaign ILIKE :campaign`;
      replacements.campaign = `%${campaignList[0]}%`;
    } else if (campaignList.length > 1) {
      const clauses = campaignList.map((c, i) => {
        replacements[`campaign_${i}`] = c;
        return `la.utm_campaign ILIKE :campaign_${i}`;
      });
      activityFilters += ` AND (${clauses.join(" OR ")})`;
    }
  }

  const GROUP_FIELD_MAP = {
    counsellor: "counsellor_name",
    campaign: "utm_campaign",
    source: "source",
  };
  const groupField = GROUP_FIELD_MAP[group_by] || "counsellor_name";

  // first_activity: students filtered by students.created_at (matches dashboard)
  //                 first lead activity joined for source/campaign metadata
  // first_remark:  first remark ever for that student (any counsellor)
  // duration:      first_remark - student.created_at
  const baseCTE = `
    WITH first_activity AS (
      SELECT DISTINCT ON (s.student_id)
        s.student_id,
        (s.created_at + INTERVAL '5 hours 30 minutes') AS lead_created_at,
        la.source,
        la.source_url,
        la.utm_campaign
      FROM students s
      LEFT JOIN student_lead_activities la ON la.student_id = s.student_id
      WHERE 1=1
        ${date_from ? `AND (s.created_at + INTERVAL '5 hours 30 minutes') >= '${date_from} 00:00:00'::timestamp` : ""}
        ${date_to ? `AND (s.created_at + INTERVAL '5 hours 30 minutes') <= '${date_to} 23:59:59'::timestamp` : ""}
        ${activityFilters}
      ORDER BY s.student_id, la.created_at ASC
    ),
    first_remark AS (
      SELECT DISTINCT ON (sr.student_id)
        sr.student_id,
        (sr.created_at + INTERVAL '5 hours 30 minutes') AS remark_created_at
      FROM student_remarks sr
      WHERE sr.counsellor_id IS NOT NULL
      ORDER BY sr.student_id, sr.created_at ASC
    ),
    combined AS (
      SELECT
        fa.student_id,
        fa.lead_created_at,
        fa.source,
        fa.source_url,
        fa.utm_campaign,
        fr.remark_created_at,
        CASE
          WHEN fr.remark_created_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (fr.remark_created_at - fa.lead_created_at)) / 60.0
          ELSE NULL
        END AS duration_minutes,
        s.current_student_status,
        COALESCE(c.counsellor_name, 'Unassigned') AS counsellor_name
      FROM first_activity fa
      JOIN students s ON fa.student_id = s.student_id
      LEFT JOIN counsellors c ON s.assigned_counsellor_id = c.counsellor_id
      LEFT JOIN first_remark fr ON fa.student_id = fr.student_id
    )
  `;

  try {
    let query;

    if (type === "summary") {
      query = `
        ${baseCTE}
        SELECT
          COALESCE(${groupField}, 'Unknown') AS group_label,
          COUNT(*) FILTER (WHERE duration_minutes IS NOT NULL AND duration_minutes < 15)::int  AS below_15,
          COUNT(*) FILTER (WHERE duration_minutes >= 15 AND duration_minutes <= 30)::int        AS min_15_30,
          COUNT(*) FILTER (WHERE duration_minutes > 30)::int                                    AS above_30,
          COUNT(*) FILTER (WHERE duration_minutes IS NULL)::int                                 AS no_remark,
          COUNT(*)::int                                                                          AS total
        FROM combined
        GROUP BY ${groupField}
        ORDER BY ${groupField} NULLS LAST;
      `;
    } else if (type === "raw" || type === "export") {
      let drillFilters = "";

      if (drill_group) {
        if (drill_group === "Unknown") {
          drillFilters += ` AND ${groupField} IS NULL`;
        } else {
          drillFilters += ` AND ${groupField} = :drill_group`;
          replacements.drill_group = drill_group;
        }
      }
      if (drill_bucket) {
        if (drill_bucket === "below_15")
          drillFilters += ` AND duration_minutes IS NOT NULL AND duration_minutes < 15`;
        else if (drill_bucket === "min_15_30")
          drillFilters += ` AND duration_minutes >= 15 AND duration_minutes <= 30`;
        else if (drill_bucket === "above_30")
          drillFilters += ` AND duration_minutes > 30`;
        else if (drill_bucket === "no_remark")
          drillFilters += ` AND duration_minutes IS NULL`;
      }

      query = `
        ${baseCTE}
        SELECT
          student_id,
          counsellor_name,
          lead_created_at      AS created_at,
          remark_created_at    AS first_remark_date,
          ROUND(duration_minutes::numeric, 2) AS duration_minutes,
          current_student_status,
          source,
          source_url,
          utm_campaign         AS campaign
        FROM combined
        WHERE 1=1 ${drillFilters}
        ORDER BY lead_created_at DESC;
      `;
    } else {
      return res
        .status(400)
        .json({ message: "Invalid type. Use: summary, raw, export" });
    }

    const data = await sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    if (type === "export") {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("First Remark Time");

      sheet.columns = [
        { header: "Student ID", key: "student_id", width: 20 },
        { header: "Counsellor Name", key: "counsellor_name", width: 25 },
        { header: "Lead Created At", key: "created_at", width: 24 },
        { header: "First Remark Date", key: "first_remark_date", width: 24 },
        { header: "Duration (mins)", key: "duration_minutes", width: 18 },
        { header: "Current Status", key: "current_student_status", width: 22 },
        { header: "Source", key: "source", width: 20 },
        { header: "Source URL", key: "source_url", width: 45 },
        { header: "Campaign", key: "campaign", width: 25 },
      ];

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4B0082" },
      };

      data.forEach((row) => sheet.addRow(row));

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="first_remark_time_${date_from || "all"}_to_${date_to || "all"}.xlsx"`,
      );
      await workbook.xlsx.write(res);
      return res.end();
    }

    res.status(200).json(data);
  } catch (error) {
    console.error("Error in getFirstRemarkTimeReport:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
