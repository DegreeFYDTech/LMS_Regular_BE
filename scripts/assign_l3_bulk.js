import fs from "fs";
import { Student, UniversityCourse } from "../models/index.js";
import CourseStatusJourney from "../models/course_status_jounreny.js";
import { internalAssignL3 } from "../controllers/leadassignmentl3.controller.js";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log("\n❌ Missing arguments!");
    console.log("👉 Usage: node --experimental-vm-modules scripts/assign_l3_bulk.js <path_to_json_file>\n");
    console.log("Example format for the JSON file:");
    console.log(`[
  { "student_id": "STD-123456", "status_history_id": 11821 },
  { "student_id": "STD-789012", "status_history_id": 11822 }
]`);
    process.exit(1);
  }

  const filePath = args[0];
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found at path: ${filePath}`);
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
    console.error("❌ Error reading or parsing JSON file:", err.message);
    process.exit(1);
  }

  console.log(`\n======================================================`);
  console.log(`🔄 BULK L3 Assignment Started`);
  console.log(`Total records to process: ${data.length}`);
  console.log(`======================================================\n`);

  let successCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < data.length; i++) {
    const record = data[i];
    const studentId = record.student_id;
    const statusHistoryId = record.status_history_id;

    console.log(`[${i + 1}/${data.length}] Processing Student: ${studentId}, Journey: ${statusHistoryId}...`);

    if (!studentId || !statusHistoryId) {
      console.log(`   ❌ Missing student_id or status_history_id. Skipping.`);
      failedCount++;
      continue;
    }

    try {
      const student = await Student.findOne({ where: { student_id: studentId } });
      if (!student) {
        console.log(`   ❌ Student not found.`);
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
        console.log(`   ❌ Journey entry not found.`);
        failedCount++;
        continue;
      }

      if (journey.assigned_l3_counsellor_id) {
        console.log(`   ⚠️ Already assigned to: ${journey.assigned_l3_counsellor_id}. Skipping.`);
        skippedCount++;
        continue;
      }

      const courseDetails = await UniversityCourse.findOne({
        where: { course_id: journey.course_id },
      });

      if (!courseDetails) {
        console.log(`   ❌ Course details not found.`);
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
        console.log(`   ✅ Assigned to: ${assigned_l3_counsellor_id}`);
        successCount++;
      } else {
        console.log(`   ❌ No rule matched.`);
        failedCount++;
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failedCount++;
    }
  }

  console.log(`\n======================================================`);
  console.log(`✅ BULK PROCESSING COMPLETED`);
  console.log(`======================================================`);
  console.log(`🟢 Successfully Assigned: ${successCount}`);
  console.log(`🟡 Skipped (Already Assigned): ${skippedCount}`);
  console.log(`🔴 Failed / No Match: ${failedCount}`);
  console.log(`======================================================\n`);
  
  process.exit(0);
}

main();
