import axios from 'axios';
import { UniversityCourse } from '../models/index.js';

const WHAPI_URL   = 'https://gate.whapi.cloud/messages/text';
const WHAPI_TOKEN = process.env.WHAPI_TOKEN;
const ALERT_TO    = process.env.WHAPI_ALERT_TO; // group JID or phone e.g. "918796457951"

async function lookupCourseName(collegeName) {
  try {
    const course = await UniversityCourse.findOne({
      where: { university_name: collegeName },
      attributes: ['course_name'],
    });
    return course?.course_name || 'N/A';
  } catch {
    return 'N/A';
  }
}

export async function sendCollegeTechFailureAlert(studentId, collegeName, status, courseName) {
  if (!WHAPI_TOKEN || !ALERT_TO) return;

  const resolvedCourse = courseName || await lookupCourseName(collegeName);
  const timeIST = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const body =
    `🚨 *College API Tech Failure*\n\n` +
    `*Student ID:* ${studentId}\n` +
    `*College:* ${collegeName}\n` +
    `*Course:* ${resolvedCourse}\n` +
    `*Status:* ${status}\n` +
    `*Time:* ${timeIST} IST`;

  try {
    await axios.post(
      WHAPI_URL,
      { to: ALERT_TO, body },
      {
        headers: {
          Authorization: `Bearer ${WHAPI_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      },
    );
  } catch (err) {
    console.error('[WhatsApp Alert] Failed to send tech failure alert:', err.message);
  }
}
