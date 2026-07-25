import { Sequelize, Op } from "sequelize";
import { Student, Counsellor, LeadAssignmentRuleL3, UniversityCourse } from "./models/index.js";
import  CourseStatusJourney  from "./models/course_status_jounreny.js";
async function testAssignment() {
  const studentId = "STD-384ECDDA";

  try {
    const student = await Student.findOne({ where: { student_id: studentId } });
    if (!student) {
      return;
    }

    const journey = await CourseStatusJourney.findOne({
      where: { student_id: studentId },
      order: [['created_at', 'DESC']]
    });

    if (!journey) {
      return;
    }

    const courseDetails = await UniversityCourse.findOne({
      where: { course_id: journey.course_id }
    });


    // Let's do the manual rule matching check here
    const allRulesets = await LeadAssignmentRuleL3.findAll({
      where: { is_active: true },
    });

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

    filteredRulesets.forEach(r => undefined);

  } catch (error) {
  }
  process.exit(0);
}

testAssignment();
