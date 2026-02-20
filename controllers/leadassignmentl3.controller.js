import sendMail from "../config/SendLmsEmail.js";
import CourseStatusJourney from "../models/course_status_jounreny.js";
import {
  CourseStatusHistory,
  Student,
  Counsellor,
  LeadAssignmentRuleL3,
} from "../models/index.js";

import { Op } from "sequelize";

const DUMMY_AGENT_ID = "CNS-119C84E3";
const DUMMY_AGENT_NAME = "DummyDegreeFyd";

const processArrayField = (field, key = "name") => {
  if (!field) return [];
  if (Array.isArray(field)) {
    return field
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") return item.trim();
        if (typeof item === "object") {
          return (item[key] || item.name || item._id || "").toString().trim();
        }
        return item.toString().trim();
      })
      .filter((item) => item && item !== "");
  }
  if (typeof field === "string") return field.trim() ? [field.trim()] : [];
  return [];
};

const validateL3Agents = async (assignedAgents) => {
  const agents = await Counsellor.findAll({
    where: {
      counsellor_id: { [Op.in]: assignedAgents },
      role: "l3",
    },
  });
  return agents.length === assignedAgents.length;
};

const sendAssignmentEmail = async (
  studentId,
  data,
  counselloremail,
  counsellorname,
) => {
  try {
    const student = await Student.findByPk(studentId, {
      attributes: [
        'student_id',
        'student_name',
        'student_email',
        'student_phone'
      ]
    });

    if (!student) return;

    const courses = await CourseStatusHistory.findOne({
      where: { student_id: student.student_id },
    });
    
    console.log("data", data);
    
    const emailData = {
      id: student.student_id,
      name: student.student_name,
      email: student.student_email,
      phone: student.student_phone,
      timestamp: new Date(),
      asigned_college: data?.collegeName || "N/A",
      asigned_course: data?.Course || "N/A",
      agent_name: counsellorname,
      agent_email: counselloremail,
    };
    
    const recipients = [
      "Bhuwan@degreefyd.com",
      "Sid@degreefyd.com",
      "Deepak@degreefyd.com",
      "Guruvinder.singh@degreefyd.com",
      counselloremail,
    ].filter(Boolean);

    await sendMail(emailData, recipients);
  } catch (error) {
    console.error("Error sending assignment email:", error);
  }
};

export const assignedtoL3byruleSet = async (req, res) => {
  try {
    const {
      studentId,
      collegeName,
      Course,
      Degree,
      Specialization,
      level,
      source,
      stream,
    } = req.body;

    console.log("=== L3 Assignment Process Started ===");
    console.log("Request body received:", JSON.stringify(req.body, null, 2));

    if (!studentId) {
      console.log("Validation failed: studentId is missing");
      return res.status(400).json({ message: "studentId is required" });
    }

    console.log(`Fetching student details for studentId: ${studentId}`);
    const studentDetails = await Student.findByPk(studentId);
    console.log(
      "Student details retrieved:",
      JSON.stringify(studentDetails, null, 2),
    );

    console.log("Fetching all active L3 rulesets...");
    const allRulesets = await LeadAssignmentRuleL3.findAll({
      where: { is_active: true },
    });
    console.log(`Found ${allRulesets?.length || 0} active rulesets`);

    if (!allRulesets || allRulesets.length === 0) {
      console.log(
        "No active rulesets found - proceeding to fallback assignment",
      );
      return res.status(404).json({ message: "No active ruleset found" });
    }

    console.log("Starting ruleset filtering process...");
    console.log("Filtering criteria:", {
      collegeName,
      source,
      Course,
      Degree,
      Specialization,
      level,
      stream,
    });

    const filteredRulesets = allRulesets.filter((ruleset) => {
      console.log(
        `\n--- Evaluating ruleset: "${ruleset.name}" (ID: ${ruleset.l3_assignment_rulesets_id}) ---`,
      );

      const universityMatch =
        !collegeName ||
        !ruleset.university_name ||
        ruleset.university_name.length === 0 ||
        ruleset.university_name.some((uni) => {
          if (!uni) return false;
          const normalizedUni = uni.toLowerCase().trim();
          const normalizedCollege = collegeName.toLowerCase().trim();
          const match =
            normalizedUni === normalizedCollege ||
            normalizedUni.includes(normalizedCollege) ||
            normalizedCollege.includes(normalizedUni);

          console.log(
            `University comparison: "${normalizedUni}" vs "${normalizedCollege}" -> ${match}`,
          );
          return match;
        });

      const sourceMatch =
        !source || !ruleset.source?.length || ruleset.source.includes(source);

      console.log(`Source match check:`, {
        sourceProvided: source,
        rulesetSources: ruleset.source,
        sourceMatch,
      });

      console.log(`Ruleset evaluation result:`, {
        universityMatch,
        sourceMatch,
        finalResult: universityMatch && sourceMatch,
      });

      return universityMatch && sourceMatch;
    });

    console.log(
      `\nFiltering complete. Found ${filteredRulesets.length} matching rulesets`,
    );

    if (filteredRulesets.length === 0) {
      console.log(
        "No matching rulesets found - initiating fallback assignment",
      );

      let fallbackAgentId = DUMMY_AGENT_ID;
      let fallbackAgentName = DUMMY_AGENT_NAME;

      console.log(`Checking for dummy agent with ID: ${DUMMY_AGENT_ID}`);
      const dummyAgent = await Counsellor.findOne({
        where: { counsellor_id: DUMMY_AGENT_ID },
      });

      if (!dummyAgent) {
        console.log("Dummy agent not found, searching for any L3 agent");
        const anyL3Agent = await Counsellor.findOne({ where: { role: "l3" } });
        if (anyL3Agent) {
          console.log(`Found L3 agent:`, JSON.stringify(anyL3Agent, null, 2));
          fallbackAgentId = anyL3Agent.counsellor_id;
          fallbackAgentName = anyL3Agent.counsellor_name;
        } else {
          console.error(
            "CRITICAL: No L3 agents found in the system for fallback assignment",
          );
          return res.status(404).json({
            message: "No active rulesets and no L3 agents found for fallback",
          });
        }
      }

      console.log("Triggering assignment email...");
      await sendAssignmentEmail(
        studentId,
        {
          collegeName,
          Course,
          Degree,
          Specialization,
          level,
          stream,
          assignmentType: "fallback",
        },
        dummyAgent?.counsellor_email || anyL3Agent?.counsellor_email || "",
        fallbackAgentName,
      );

      console.log("=== L3 Assignment Process Completed (Fallback) ===");
      return res.status(200).json({
        message: "No matching ruleset found, assigned fallback L3 counsellor",
        student_id: studentId,
        assigned_l3_counsellor_id: fallbackAgentId,
        counsellor_name_l3: fallbackAgentName,
        assignment_method: "dummy_fallback",
        reason: "No ruleset found matching collegeName and source criteria",
      });
    }

    const hierarchyChecks = [
      {
        name: "courseName",
        check: (ruleset) => {
          if (!Course || !ruleset.course_conditions?.courseName?.length)
            return false;
          return ruleset.course_conditions.courseName.some(
            (courseName) =>
              courseName.toLowerCase().includes(Course.toLowerCase()) ||
              Course.toLowerCase().includes(courseName.toLowerCase()),
          );
        },
      },
      {
        name: "degree",
        check: (ruleset) => {
          if (!Degree || !ruleset.course_conditions?.degree?.length)
            return false;
          return ruleset.course_conditions.degree.includes(Degree);
        },
      },
      {
        name: "specialization",
        check: (ruleset) => {
          if (
            !Specialization ||
            !ruleset.course_conditions?.specialization?.length
          )
            return false;
          return ruleset.course_conditions.specialization.some(
            (spec) =>
              spec.toLowerCase().includes(Specialization.toLowerCase()) ||
              Specialization.toLowerCase().includes(spec.toLowerCase()),
          );
        },
      },
      {
        name: "stream",
        check: (ruleset) => {
          if (!stream || !ruleset.course_conditions?.stream?.length)
            return false;
          return ruleset.course_conditions.stream.some(
            (s) =>
              s.toLowerCase().includes(stream.toLowerCase()) ||
              stream.toLowerCase().includes(s.toLowerCase()),
          );
        },
      },
      {
        name: "level",
        check: (ruleset) => {
          if (!level || !ruleset.course_conditions?.level?.length) return false;
          return ruleset.course_conditions.level.includes(level);
        },
      },
    ];

    console.log("\n=== Starting hierarchy-based matching ===");

    const hasAnyCourseMatch = filteredRulesets.some((ruleset) =>
      hierarchyChecks.some((hierarchyLevel) => hierarchyLevel.check(ruleset)),
    );
    console.log("Has any course match:", hasAnyCourseMatch);

    let selectedRuleset = null;
    let matchedAt = null;
    let currentFilteredRulesets = [...filteredRulesets];

    if (hasAnyCourseMatch) {
      console.log(
        "Course matches found - proceeding with hierarchical filtering",
      );

      for (const hierarchyLevel of hierarchyChecks) {
        console.log(`\nChecking hierarchy level: ${hierarchyLevel.name}`);
        console.log(
          `Current pool size: ${currentFilteredRulesets.length} rulesets`,
        );

        const matchingRulesets = currentFilteredRulesets.filter((ruleset) =>
          hierarchyLevel.check(ruleset),
        );

        console.log(
          `Rulesets matching ${hierarchyLevel.name}: ${matchingRulesets.length}`,
        );

        if (matchingRulesets.length > 0) {
          if (matchingRulesets.length === 1) {
            selectedRuleset = matchingRulesets[0];
            matchedAt = hierarchyLevel.name;
            console.log(
              `Single ruleset found at ${hierarchyLevel.name}:`,
              selectedRuleset.name,
            );
            break;
          } else {
            console.log(
              `Multiple rulesets found at ${hierarchyLevel.name}, moving to next level`,
            );
            currentFilteredRulesets = matchingRulesets;
          }
        } else {
          console.log(`No matches at ${hierarchyLevel.name} level`);
        }
      }

      if (!selectedRuleset && currentFilteredRulesets.length > 0) {
        console.log(
          "Multiple rulesets remain after hierarchy check - sorting by priority",
        );
        currentFilteredRulesets.sort(
          (a, b) => (b.priority || 0) - (a.priority || 0),
        );
        selectedRuleset = currentFilteredRulesets[0];
        matchedAt = "priority-based";
      }
    } else {
      console.log(
        "No course matches found - assigning from college-matched ruleset based on priority",
      );
      filteredRulesets.sort((a, b) => (b.priority || 0) - (a.priority || 0));
      selectedRuleset = filteredRulesets[0];
      matchedAt = "college-name-only";
    }

    if (!selectedRuleset) {
      console.log("No ruleset selected - throwing error");
      return res
        .status(404)
        .json({ message: "No matching ruleset found for the given criteria" });
    }

    console.log("\n=== Selected Ruleset Details ===");
    console.log("Selected ruleset:", JSON.stringify(selectedRuleset, null, 2));
    console.log("Matched at level:", matchedAt);

    const assignedCounsellors = selectedRuleset.assigned_counsellor_ids;
    console.log("Assigned counsellors from ruleset:", assignedCounsellors);

    if (!assignedCounsellors || assignedCounsellors.length === 0) {
      console.log("No counsellors assigned to ruleset - throwing error");
      return res
        .status(404)
        .json({ message: "No counsellors assigned to the selected ruleset" });
    }

    let selectedCounsellorId;
    let assignmentMethod;
    let currentRoundRobinIndex = 0;

    if (assignedCounsellors.length === 1) {
      selectedCounsellorId = assignedCounsellors[0];
      assignmentMethod = "direct";
      console.log(
        "Single counsellor assigned - using direct assignment:",
        selectedCounsellorId,
      );
    } else {
      console.log("Multiple counsellors found - using round-robin assignment");
      currentRoundRobinIndex = selectedRuleset.round_robin_index || 0;
      console.log("Current round-robin index:", currentRoundRobinIndex);

      if (currentRoundRobinIndex >= assignedCounsellors.length) {
        console.log("Round-robin index out of range - resetting to 0");
        currentRoundRobinIndex = 0;
      }

      selectedCounsellorId = assignedCounsellors[currentRoundRobinIndex];
      assignmentMethod = "round-robin";
      console.log("Selected counsellor via round-robin:", selectedCounsellorId);

      const nextIndex =
        (currentRoundRobinIndex + 1) % assignedCounsellors.length;
      console.log(
        `Updating round-robin index from ${currentRoundRobinIndex} to ${nextIndex}`,
      );

      await LeadAssignmentRuleL3.update(
        { round_robin_index: nextIndex },
        {
          where: {
            l3_assignment_rulesets_id:
              selectedRuleset.l3_assignment_rulesets_id,
          },
        },
      );
      console.log("Round-robin index updated successfully");
    }

    console.log(`Fetching counsellor details for ID: ${selectedCounsellorId}`);
    let counsellorDetails = await Counsellor.findOne({
      where: { counsellor_id: selectedCounsellorId },
    });
    console.log(
      "Counsellor details retrieved:",
      JSON.stringify(counsellorDetails, null, 2),
    );

    if (!counsellorDetails) {
      console.log("Selected counsellor not found - throwing error");
      return res.status(404).json({ message: "Selected counsellor not found" });
    }

    const responseMessage = hasAnyCourseMatch
      ? "L3 counsellor assigned successfully"
      : "L3 counsellor assigned based on college name match (no course criteria matched)";

    console.log("Triggering assignment email...");
    await sendAssignmentEmail(
      studentId,
      {
        collegeName,
        Course,
        Degree,
        Specialization,
        level,
        stream,
        assignmentType: hasAnyCourseMatch
          ? "hierarchy_match"
          : "college_only_match",
        matchedAt,
      },
      counsellorDetails.counsellor_email,
      counsellorDetails.counsellor_name,
    );
    console.log("Email trigger completed");

    console.log("\n=== L3 Assignment Process Completed Successfully ===");
    console.log("Assignment summary:", {
      studentId,
      assigned_l3_counsellor_id: counsellorDetails.counsellor_id,
      counsellor_name: counsellorDetails.counsellor_name,
      assignment_method: assignmentMethod,
      hasAnyCourseMatch,
      matched_ruleset: selectedRuleset.name,
    });

    res.status(200).json({
      message: responseMessage,
      student_id: studentId,
      assigned_l3_counsellor_id: counsellorDetails.counsellor_id,
      counsellor_name_l3: counsellorDetails.counsellor_name,
      assignment_method: assignmentMethod,
      course_fields_matched: hasAnyCourseMatch,
      matched_ruleset: {
        id: selectedRuleset.l3_assignment_rulesets_id,
        name: selectedRuleset.name,
        matched_at_level: matchedAt,
        priority: selectedRuleset.priority || 0,
      },
      round_robin_info:
        assignmentMethod === "round-robin"
          ? {
              used_index: currentRoundRobinIndex,
              total_counsellors: assignedCounsellors.length,
              next_index:
                (currentRoundRobinIndex + 1) % assignedCounsellors.length,
            }
          : null,
    });
  } catch (error) {
    console.error("\n=== ERROR IN L3 ASSIGNMENT ===");
    console.error("Error timestamp:", new Date().toISOString());
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error(
      "Request body that caused error:",
      JSON.stringify(req.body, null, 2),
    );
    console.error("=== End Error Log ===\n");

    res.status(500).json({
      message: "Error in assigning L3 counsellor",
      error: error.message,
    });
  }
};

// Controller Functions
export const getRuleSets = async (req, res) => {
  try {
    const ruleSets = await LeadAssignmentRuleL3.findAll({
      order: [
        ["priority", "DESC"],
        ["created_at", "DESC"],
      ],
    });

    // Manually fetch counsellor details for each ruleset
    const ruleSetsWithCounsellors = await Promise.all(
      ruleSets.map(async (ruleSet) => {
        const counsellorDetails = await Counsellor.findAll({
          where: {
            counsellor_id: { [Op.in]: ruleSet.assigned_counsellor_ids },
          },
          attributes: [
            "counsellor_name",
            "counsellor_email",
            "role",
            "counsellor_id",
          ],
        });

        return {
          ...ruleSet.toJSON(),
          assignedCounsellorDetails: counsellorDetails,
        };
      }),
    );

    res.status(200).json(ruleSetsWithCounsellors);
  } catch (error) {
    console.error("Error fetching rulesets:", error.message);
    res.status(500).json({
      message: "Error fetching rulesets",
      error: error.message,
    });
  }
};

export const getRuleSetById = async (req, res) => {
  try {
    const { id } = req.params;
    const ruleSet = await LeadAssignmentRuleL3.findByPk(id);

    if (!ruleSet) {
      return res.status(404).json({ message: "RuleSet not found" });
    }

    res.status(200).json(ruleSet);
  } catch (error) {
    console.error("Error fetching ruleset:", error);
    res.status(500).json({
      message: "Error fetching ruleset",
      error: error.message,
    });
  }
};

export const createRuleSet = async (req, res) => {
  try {
    const {
      college,
      universityName,
      university_name,
      course,
      course_conditions,
      source,
      assignedCounsellor,
      assigned_counsellor_ids,
      isActive,
      is_active,
      priority,
      custom_rule_name,
    } = req.body;

    // Normalize inputs
    const finalUniversityName = university_name || universityName;
    const finalCourse = course_conditions || course;
    const finalAssignedCounsellor =
      assigned_counsellor_ids || assignedCounsellor;
    const finalIsActive =
      is_active !== undefined
        ? is_active
        : isActive !== undefined
          ? isActive
          : true;

    // Process fields
    const processedUniversityName = processArrayField(finalUniversityName);
    const processedSource = processArrayField(source);
    const processedAssignedCounsellors = processArrayField(
      finalAssignedCounsellor,
      "_id",
    );

    const processedCourseConditions = {
      stream: processArrayField(finalCourse?.stream),
      degree: processArrayField(finalCourse?.degree),
      specialization: processArrayField(finalCourse?.specialization),
      level: processArrayField(finalCourse?.level),
      courseName: processArrayField(finalCourse?.courseName),
    };

    // Validate required fields
    if (
      !processedAssignedCounsellors ||
      processedAssignedCounsellors.length === 0
    ) {
      return res.status(400).json({
        message: "At least one assigned counsellor is required",
      });
    }

    // Verify all assigned counsellors exist and are L3 counsellors
    const isValidAgents = await validateL3Agents(processedAssignedCounsellors);
    if (!isValidAgents) {
      return res.status(400).json({
        message:
          "One or more assigned counsellors are invalid or not L3 counsellors",
      });
    }

    // Generate unique rule name
    const ruleName = await LeadAssignmentRuleL3.generateRuleName();

    // Create new ruleset
    const newRuleSet = await LeadAssignmentRuleL3.create({
      name: ruleName,
      college: college?.trim() || "",
      university_name: processedUniversityName,
      course_conditions: processedCourseConditions,
      source: processedSource,
      assigned_counsellor_ids: processedAssignedCounsellors,
      is_active: finalIsActive,
      priority: priority || 0,
      round_robin_index: 0,
      custom_rule_name: custom_rule_name || "",
    });

    // Fetch counsellor details
    const counsellorDetails = await Counsellor.findAll({
      where: {
        counsellor_id: { [Op.in]: newRuleSet.assigned_counsellor_ids },
      },
      attributes: [
        "counsellor_name",
        "counsellor_email",
        "role",
        "counsellor_id",
      ],
    });

    // Add counsellor details to response
    const ruleSetWithCounsellors = {
      ...newRuleSet.toJSON(),
      assignedCounsellorDetails: counsellorDetails,
    };

    res.status(201).json({
      message: "RuleSet created successfully",
      ruleSet: ruleSetWithCounsellors,
    });
  } catch (error) {
    console.error("Error creating ruleset:", error);
    res.status(500).json({
      message: "Error creating ruleset",
      error: error.message,
    });
  }
};

export const updateRuleSet = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    console.log("Update Data:", updateData);
    // If assignedCounsellor are being updated, verify they exist and are L3
    if (updateData.assignedCounsellor || updateData.assigned_counsellor_ids) {
      const rawAgents =
        updateData.assigned_counsellor_ids || updateData.assignedCounsellor;
      const processedAgents = processArrayField(rawAgents, "_id");

      const isValidAgents = await validateL3Agents(processedAgents);
      if (!isValidAgents) {
        return res.status(400).json({
          message:
            "One or more assigned counsellors are invalid or not L3 counsellors",
        });
      }
      updateData.assigned_counsellor_ids = processedAgents;
      delete updateData.assignedCounsellor;
    }

    // Normalize other possible fields if sent in snake_case
    if (updateData.university_name) {
      updateData.university_name = processArrayField(
        updateData.university_name,
      );
    } else if (updateData.universityName) {
      updateData.university_name = processArrayField(updateData.universityName);
      delete updateData.universityName;
    }

    if (updateData.course_conditions || updateData.course) {
      const courseData = updateData.course_conditions || updateData.course;
      updateData.course_conditions = {
        stream: processArrayField(courseData?.stream),
        degree: processArrayField(courseData?.degree),
        specialization: processArrayField(courseData?.specialization),
        level: processArrayField(courseData?.level),
        courseName: processArrayField(courseData?.courseName),
      };
      delete updateData.course;
    }

    if (updateData.source) {
      updateData.source = processArrayField(updateData.source);
    }

    if (updateData.is_active !== undefined) {
      // Already set, but ensuring it's used correctly
    } else if (updateData.isActive !== undefined) {
      updateData.is_active = updateData.isActive;
      delete updateData.isActive;
    }

    const [updatedRowsCount] = await LeadAssignmentRuleL3.update(
      { ...updateData, updated_at: new Date() },
      { where: { l3_assignment_rulesets_id: id } },
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({
        message: "RuleSet not found",
      });
    }

    const updatedRuleSet = await LeadAssignmentRuleL3.findByPk(id);

    res.status(200).json({
      message: "RuleSet updated successfully",
      ruleSet: updatedRuleSet,
    });
  } catch (error) {
    console.error("Error updating ruleset:", error);
    res.status(500).json({
      message: "Error updating ruleset",
      error: error.message,
    });
  }
};

export const deleteRuleSet = async (req, res) => {
  try {
    const { id } = req.params;

    const ruleSet = await LeadAssignmentRuleL3.findByPk(id);
    if (!ruleSet) {
      return res.status(404).json({
        message: "RuleSet not found",
      });
    }

    await LeadAssignmentRuleL3.destroy({
      where: { l3_assignment_rulesets_id: id },
    });

    res.status(200).json({
      message: "RuleSet deleted successfully",
      ruleSet: ruleSet,
    });
  } catch (error) {
    console.error("Error deleting ruleset:", error);
    res.status(500).json({
      message: "Error deleting ruleset",
      error: error.message,
    });
  }
};

export const toggleRuleSetStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const ruleSet = await LeadAssignmentRuleL3.findByPk(id);
    if (!ruleSet) {
      return res.status(404).json({
        message: "RuleSet not found",
      });
    }

    await ruleSet.update({
      is_active: !ruleSet.is_active,
    });

    res.status(200).json({
      message: `RuleSet ${ruleSet.is_active ? "activated" : "deactivated"} successfully`,
      ruleSet: ruleSet,
    });
  } catch (error) {
    console.error("Error toggling ruleset status:", error);
    res.status(500).json({
      message: "Error toggling ruleset status",
      error: error.message,
    });
  }
};


