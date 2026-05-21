import { Sequelize, Op } from "sequelize";
import { Student, Counsellor, LeadAssignmentRuleL3, UniversityCourse } from "./models/index.js";
import  CourseStatusJourney  from "./models/course_status_jounreny.js";
async function testAssignment() {
  const studentId = "STD-384ECDDA";
  console.log("Testing L3 Assignment for:", studentId);

  try {
    const student = await Student.findOne({ where: { student_id: studentId } });
    if (!student) {
      console.log("Student not found!");
      return;
    }
    console.log("Student Data:", {
      source: student.source,
      current_student_status: student.current_student_status,
      assigned_l3_counsellor_id: student.assigned_counsellor_l3_id
    });

    const journey = await CourseStatusJourney.findOne({
      where: { student_id: studentId },
      order: [['created_at', 'DESC']]
    });

    if (!journey) {
      console.log("No journey found for this student.");
      return;
    }

    const courseDetails = await UniversityCourse.findOne({
      where: { course_id: journey.course_id }
    });

    console.log("Course Details to Match:", {
      collegeName: courseDetails?.university_name,
      Course: courseDetails?.course_name,
      Degree: courseDetails?.degree_name,
      Specialization: courseDetails?.specialization,
      level: courseDetails?.level,
      source: student.source,
      stream: courseDetails?.stream,
    });

    // Let's do the manual rule matching check here
    const allRulesets = await LeadAssignmentRuleL3.findAll({
      where: { is_active: true },
    });
    console.log(`Found ${allRulesets.length} active rulesets`);

    const filteredRulesets = allRulesets.filter((ruleset) => {
      const universityMatch =
        !courseDetails?.university_name ||
        !ruleset.university_name ||
        ruleset.university_name.length === 0 ||
        ruleset.university_name.some((uni) => {
          if (!uni) return false;
          const normalizedUni = uni.toLowerCase().trim();
          const normalizedCollege = courseDetails.university_name.toLowerCase().trim();
          return normalizedUni === normalizedCollege ||
            normalizedUni.includes(normalizedCollege) ||
            normalizedCollege.includes(normalizedUni);
        });

      const sourceMatch =
        !student.source || !ruleset.source?.length || ruleset.source.includes(student.source);

      return universityMatch && sourceMatch;
    });

    console.log(`Matched rulesets: ${filteredRulesets.length}`);
    filteredRulesets.forEach(r => console.log(`- Rule: ${r.name} (ID: ${r.l3_assignment_rulesets_id})`));

  } catch (error) {
    console.error("Error:", error);
  }
  process.exit(0);
}

testAssignment();
