import fs from 'fs';
import { cuBotQueue } from '../cu_bot/queues/cuBotQueue.js';
import { Student, CuBotSending } from '../models/index.js';

// Configuration
const LEADS_PER_DAY = 100;
const GAP_MINUTES = 8;
const START_HOUR_IST = 9; // 9 AM IST

function getNextStartTimeIST() {
  const now = new Date();
  // IST offset is UTC + 5:30
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  
  // Current time in IST
  const istNow = new Date(now.getTime() + istOffsetMs);
  
  // Set to 9:00 AM IST
  const targetIST = new Date(istNow);
  targetIST.setUTCHours(START_HOUR_IST, 0, 0, 0); // 9:00 AM

  // If 9:00 AM has already passed today, start tomorrow morning
  if (targetIST.getTime() <= istNow.getTime()) {
    targetIST.setUTCDate(targetIST.getUTCDate() + 1);
  }

  // Convert back to UTC for BullMQ delay calculation
  const targetUTC = new Date(targetIST.getTime() - istOffsetMs);
  return targetUTC;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    process.exit(1);
  }

  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    process.exit(1);
  }

  const rawData = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(rawData);
  
  if (!Array.isArray(data)) {
    process.exit(1);
  }

  // Parse optional arguments
  let gapMinutes = GAP_MINUTES;
  let immediate = false;

  for (let idx = 1; idx < args.length; idx++) {
    const val = args[idx];
    if (val === '--immediate') {
      immediate = true;
    } else if (!isNaN(parseInt(val))) {
      gapMinutes = parseInt(val);
    }
  }

  // If immediate, bypass daily limits
  const activeLeadsPerDay = immediate ? data.length : LEADS_PER_DAY;
  const currentStartUTC = immediate ? new Date() : getNextStartTimeIST();


  let scheduledCount = 0;
  let dayCounter = 1;
  let leadInDayCounter = 0;

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const studentId = typeof item === 'string' ? item : (item.student_id || item.studentId);

    if (!studentId) {
      continue;
    }

    // Fetch the student details required by the worker
    const student = await Student.findOne({ where: { student_id: studentId } });
    if (!student) {
      continue;
    }

    if (leadInDayCounter >= activeLeadsPerDay) {
      // Move to next day
      dayCounter++;
      leadInDayCounter = 0;
      currentStartUTC.setUTCDate(currentStartUTC.getUTCDate() + 1);
    }

    // Calculate exactly when this lead should run
    const additionalDelayMs = leadInDayCounter * gapMinutes * 60 * 1000;
    const executeAtUTC = new Date(currentStartUTC.getTime() + additionalDelayMs);
    const delayMs = Math.max(0, executeAtUTC.getTime() - Date.now());

    try {
      // 1. Create tracking record in DB (CuBotSending)
      const dbRecord = await CuBotSending.create({
        student_id: studentId,
        phone: student.student_phone,
        email: student.student_email,
        status: 'pending',
        request_data: {},
        send_type: 'bot'
      });

      // 2. Prepare payload for Worker
      const jobData = {
        dbRecordId: dbRecord.id,
        studentId: studentId,
        studentName: student.student_name,
        phone: student.student_phone,
        email: student.student_email,
        collegeName: "Chandigarh University" // will be dynamically resolved if CourseStatus exists
      };

      // 3. Add to BullMQ with calculated delay
      await cuBotQueue.add(`lead-submit-${studentId}`, jobData, {
        delay: delayMs
      });

      const executeTimeIST = new Date(executeAtUTC.getTime() + (5.5 * 60 * 60 * 1000)).toISOString().replace('T', ' ').substring(0, 16) + ' IST';
      
      scheduledCount++;
      leadInDayCounter++;

    } catch (error) {
    }
  }

  
  process.exit(0);
}

main();
