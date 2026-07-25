import { Student, CourseStatusJourney, UniversityCourse } from "../models/index.js";
import { internalAssignL3 } from "../controllers/leadassignmentl3.controller.js";

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    process.exit(1);
  }

  const studentId = args[0];
  const statusHistoryId = args[1];


  try {
    const student = await Student.findOne({ where: { student_id: studentId } });
    if (!student) {
      process.exit(1);
    }

    const journey = await CourseStatusJourney.findOne({
      where: { 
        student_id: studentId,
        status_history_id: statusHistoryId
      }
    });

    if (!journey) {
      process.exit(1);
    }

    if (journey.assigned_l3_counsellor_id) {
      process.exit(0);
    }

    const courseDetails = await UniversityCourse.findOne({
      where: { course_id: journey.course_id },
    });

    if (!courseDetails) {
      process.exit(1);
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
    const counsellor_name = l3data?.counsellor_name_l3;

    if (assigned_l3_counsellor_id) {
      
      await CourseStatusJourney.update(
        { assigned_l3_counsellor_id },
        { where: { status_history_id: statusHistoryId } }
      );
      
    } else {
    }

  } catch (error) {
  }

  process.exit(0);
}

main();
