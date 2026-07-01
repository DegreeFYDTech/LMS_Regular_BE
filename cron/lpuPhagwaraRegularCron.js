import cron from "node-cron";
import { Op, Sequelize } from "sequelize";
import { Student, StudentLeadActivity, StudentCollegeApiSentStatus } from "../models/index.js";
import { processStandardUniversity } from "../controllers/Colleges_sending_logic.js";

const startLpuPhagwaraRegularCron = () => {
  cron.schedule("0 * * * *", async () => {
    console.log(" [CRON] Starting Lovely Professional University lead sync...");

    try {
      const collegeName = "Lovely Professional University";
      
      const leadsToProcess = await Student.findAll({
        where: {
          created_at: {
            [Op.between]: ["2026-04-01T00:00:00.000Z", "2026-05-31T23:59:59.999Z"],
          },
          student_id: {
            [Op.notIn]: Sequelize.literal(`(
              SELECT student_id 
              FROM student_college_api_sent_status 
              WHERE college_name = 'Lovely Professional University' 
                AND api_sent_status IN ('Proceed', 'Do not Proceed')
            )`)
          }
        },
        include: [
          {
            model: StudentLeadActivity,
            as: "lead_activities",
            required: true,
            where: {
              [Op.or]: [
                { utm_campaign: { [Op.in]: ["23463111599", "23292287218", "Panjab_Admissions"] } },
                { utm_campaign_id: { [Op.in]: ["23463111599", "23292287218", "Panjab_Admissions"] } }
              ]
            }
          }
        ],
        order: [["created_at", "DESC"]],
        limit: 4,
        subQuery: false
      });

      if (leadsToProcess.length === 0) {
        console.log(" [CRON] No eligible Lovely Professional University leads found to sync.");
        return;
      }

      console.log(`[CRON] Processing ${leadsToProcess.length} leads for Lovely Professional University...`);

      for (const student of leadsToProcess) {
        try {
          const userResponse = {
            student_name: student.student_name,
            student_email: student.student_email,
            student_phone: student.student_phone,
            student_id: student.student_id
          };

          await processStandardUniversity(
            {},
            collegeName,
            userResponse,
            student.student_id,
            "cron",
            student.student_email,
            student.student_phone,
            true,
            'CRS-CF7C1787',
            false
          );
          
          console.log(` [CRON] Processed student ID: ${student.student_id}`);
        } catch (err) {
          console.error(` [CRON] Error processing student ${student.student_id}:`, err.message);
        }
      }
      
      console.log("🏁 [CRON] Finished Lovely Professional University lead sync.");
    } catch (error) {
      console.error("❌ [CRON] Error in LPU Phagwara Regular cron:", error);
    }
  });

  console.log("[CRON] Lovely Professional University cron registered (Hourly).");
};

export default startLpuPhagwaraRegularCron;
