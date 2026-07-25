import { Worker } from 'bullmq';
import bullConnection from '../queues/redisConnection.js';
import { submitCucetLead } from '../services/playwrightService.js';
import { getRandomizedData } from '../utils/randomGenerator.js';
import { CuBotSending } from '../../models/index.js';
import { createCollegeApiSentStatus } from '../../controllers/collegeApiSentStatus.controller.js';


export const startCuBotWorker = () => {
  const worker = new Worker('cu-bot', async (job) => {
    const { dbRecordId, studentId, studentName, phone, email, courseId, collegeName } = job.data;

    let resolvedCollegeName = collegeName;
    if (!resolvedCollegeName || resolvedCollegeName === "Chandigarh University") {
      try {
        const { CourseStatus, UniversityCourse } = await import('../../models/index.js');
        const shortlistedCourse = await CourseStatus.findOne({
          where: { student_id: studentId, is_shortlisted: true }
        });
        if (shortlistedCourse) {
          const uCourse = await UniversityCourse.findOne({
            where: { course_id: shortlistedCourse.course_id }
          });
          if (uCourse) {
            resolvedCollegeName = uCourse.university_name;
          }
        }
      } catch (dbErr) {
      }
    }

    try {
      await CuBotSending.update(
        { status: 'processing' }, 
        { where: { id: dbRecordId } }
      );

      const leadData = {
        campus: job.data.campus || "Mohali",
        city: job.data.city || "Chandigarh",
        discipline: job.data.discipline || "Engineering",
        program: job.data.program || "Bachelor of Engineering (Computer Science and Engineering)",
        dob: job.data.dob || "1990-10-10"
      };

      const delayMs = Math.floor(Math.random() * (8000 - 2000 + 1)) + 2000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      const result = await submitCucetLead(
        { studentId, studentName, phone, email }, 
        leadData
      );

      await CuBotSending.update({
        status: 'done',
        response_url: result.redirectUrl
      }, { where: { id: dbRecordId } });

      await createCollegeApiSentStatus({
        collegeName: resolvedCollegeName || "Chandigarh University",
        status: "Submitted via Bot (Direct Portal)", 
        studentId: studentId,
        requestToApi: { info: "Automated Bot Submission", leadData },
        responseFromApi: { 
          redirectUrl: result.redirectUrl,
          userId: result.leadId || null,
          user_id: result.leadId || null
        },
        sendType: "bot", 
        studentEmail: email,
        studentPhone: phone,
        isPrimary: true
      });

      return result;

    } catch (error) {
      
      await CuBotSending.update({
        status: 'failed',
        error_message: error.message
      }, { where: { id: dbRecordId } });

      await createCollegeApiSentStatus({
        collegeName: resolvedCollegeName || "Chandigarh University",
        status: "Failed due to Technical Issues",
        studentId: studentId,
        requestToApi: { info: "Automated Bot Submission Failed" },
        responseFromApi: { error: error.message },
        sendType: "bot",
        studentEmail: email,
        studentPhone: phone,
        isPrimary: true
      }).catch((syncError) => {
      });

      throw error;
    }
  }, {
    connection: bullConnection,
    prefix: 'regular_lms_cu_bot',
    concurrency: 2 
  });

  worker.on('completed', (job) => {
  });

  worker.on('failed', (job, err) => {
  });

  return worker;
};
