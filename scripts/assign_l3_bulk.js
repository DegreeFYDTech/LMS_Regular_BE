import fs from "fs";
import { Student, UniversityCourse } from "../models/index.js";
import CourseStatusJourney from "../models/course_status_jounreny.js";
import { internalAssignL3 } from "../controllers/leadassignmentl3.controller.js";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    process.exit(1);
  }

  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    process.exit(1);
  }

  let data;
  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(rawData);
    if (!Array.isArray(data)) {
      throw new Error("JSON must be an array of objects.");
    }
  } catch (err) {
    process.exit(1);
  }


  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    const studentId = record.student_id;
    const statusHistoryId = record.status_history_id;


    if (!studentId || !statusHistoryId) {
      failedCount++;
      continue;
    }

    try {
      const student = await Student.findOne({ where: { student_id: studentId } });
      if (!student) {
        failedCount++;
        continue;
      }

      const journey = await CourseStatusJourney.findOne({
        where: { 
          student_id: studentId,
          status_history_id: statusHistoryId
        }
      });

      if (!journey) {
        failedCount++;
        continue;
      }

      if (journey.assigned_l3_counsellor_id) {
        skippedCount++;
        continue;
      }

      const courseDetails = await UniversityCourse.findOne({
        where: { course_id: journey.course_id },
      });

      if (!courseDetails) {
        failedCount++;
        continue;
      }

      const l3data = await internalAssignL3({
        studentId,
        collegeName: courseDetails?.university_name,
        Course: courseDetails?.course_name,
        Degree: courseDetails?.degree_name,
        Specialization: courseDetails?.specialization,
        level: courseDetails?.level,
        source: student.source,
        stream: courseDetails?.stream,
      });

      const assigned_l3_counsellor_id = l3data?.assigned_l3_counsellor_id;

      if (assigned_l3_counsellor_id) {
        await CourseStatusJourney.update(
          { assigned_l3_counsellor_id },
          { where: { status_history_id: statusHistoryId } }
        );
        successCount++;
      } else {
        failedCount++;
      }

    } catch (error) {
      failedCount++;
    }
  }

  
  process.exit(0);
}

main();
