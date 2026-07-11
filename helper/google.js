import axios from "axios";
import { QueryTypes } from "sequelize";
import sequelize from "../config/database-config.js";

export const inform_Google = async (student_id) => {
  try {
    const query = `
      SELECT
        s.student_phone,
        s.student_email,
        sla.gcl_id,
        sla.utm_campaign_id,
        sla.utm_campaign
      FROM students AS s
      JOIN student_lead_activities AS sla
        ON s.student_id = sla.student_id
      WHERE s.student_id = :student_id
      ORDER BY sla.created_at ASC
      LIMIT 1
    `;

    const leadData = await sequelize.query(query, {
      replacements: { student_id },
      type: QueryTypes.SELECT,
    });

    if (!leadData.length) {
      console.warn(`No lead data found for student: ${student_id}`);
      return;
    }

    const sending_data = {
      phone_number: leadData[0].student_phone,
      email: leadData[0].student_email,
      gcl_id: leadData[0].gcl_id,
      campaign_id: leadData[0].utm_campaign_id,
      campaign_name: leadData[0].utm_campaign,
      lms_type: "Regular LMS(CU)",
    };

    const response = await axios.post(
      `${process.env.ENTERPRISE_HUB_URL}/sheets/push`,
      sending_data
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error informing Google:",
      error.response?.data || error.message
    );

    throw error;
  }
};