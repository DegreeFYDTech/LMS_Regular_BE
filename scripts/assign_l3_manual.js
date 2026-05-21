import { Student, CourseStatusJourney, UniversityCourse } from "../models/index.js";
import { internalAssignL3 } from "../controllers/leadassignmentl3.controller.js";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log("\n❌ Missing arguments!");
    console.log("👉 Usage: node --experimental-vm-modules scripts/assign_l3_manual.js <student_id> <status_history_id>\n");
    process.exit(1);
  }

  const studentId = args[0];
  const statusHistoryId = args[1];

  console.log(`\n======================================================`);
  console.log(`🔄 Manual L3 Assignment`);
  console.log(`👤 Student: ${studentId}`);
  console.log(`🆔 Journey ID: ${statusHistoryId}`);
  console.log(`======================================================\n`);

  try {
    const student = await Student.findOne({ where: { student_id: studentId } });
    if (!student) {
      console.error("❌ Student not found in the database.");
      process.exit(1);
    }

    const journey = await CourseStatusJourney.findOne({
      where: { 
        student_id: studentId,
        status_history_id: statusHistoryId
      }
    });

    if (!journey) {
      console.error("❌ Journey entry (status_history_id) not found for this student.");
      process.exit(1);
    }

    if (journey.assigned_l3_counsellor_id) {
      console.log(`⚠️ This journey entry ALREADY has an assigned L3 counsellor: ${journey.assigned_l3_counsellor_id}.`);
      console.log(`We will NOT overwrite it.`);
      process.exit(0);
    }

    const courseDetails = await UniversityCourse.findOne({
      where: { course_id: journey.course_id },
    });

    if (!courseDetails) {
      console.error(`❌ Course details not found for course_id: ${journey.course_id}`);
      process.exit(1);
    }

    console.log(`🏫 College: ${courseDetails.university_name}`);
    console.log(`🎓 Course: ${courseDetails.course_name} (${courseDetails.level})`);
    console.log(`📈 Source: ${student.source}`);
    console.log("\n⚙️  Running Ruleset Matching Engine...\n");

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
    const counsellor_name = l3data?.counsellor_name_l3;

    if (assigned_l3_counsellor_id) {
      console.log(`\n✅ L3 Match Found! Assigned to: ${counsellor_name || assigned_l3_counsellor_id}`);
      console.log("💾 Saving to database...");
      
      await CourseStatusJourney.update(
        { assigned_l3_counsellor_id },
        { where: { status_history_id: statusHistoryId } }
      );
      
      console.log("🎉 Database updated successfully!");
    } else {
      console.log("\n❌ Ruleset logic completed, but no counsellor ID was returned.");
    }

  } catch (error) {
    console.error("\n❌ Error during manual assignment:");
    console.error(error.message);
  }

  console.log(`\n======================================================\n`);
  process.exit(0);
}

main();
