import sendMail from "../config/SendLmsEmail.js";
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


    if (!studentId) {
      return res.status(400).json({ message: "studentId is required" });
    }

    const studentDetails = await Student.findByPk(studentId);

    const allRulesets = await LeadAssignmentRuleL3.findAll({
      where: { is_active: true },
    });

    if (!allRulesets || allRulesets.length === 0) {
      return res.status(404).json({ message: "No active ruleset found" });
    }


    // All condition fields (University, Source, L2 Counsellor, Course Name, Degree,
    // Specialization, Stream, Level) are AND'd together. Within a single field's array,
    // any one matching value is enough (OR). A field left empty on the ruleset acts as
    // a wildcard - it does not block the match.
    const studentL2Id = studentDetails?.assigned_counsellor_id || null;

    const filteredRulesets = allRulesets.filter((ruleset) => {

      const universityMatch =
        !collegeName ||
        !ruleset.university_name ||
        ruleset.university_name.length === 0 ||
        ruleset.university_name.some((uni) => {
          if (!uni) return false;
          const normalizedUni = uni.toLowerCase().trim();
          const normalizedCollege = collegeName.toLowerCase().trim();
          return (
            normalizedUni === normalizedCollege ||
            normalizedUni.includes(normalizedCollege) ||
            normalizedCollege.includes(normalizedUni)
          );
        });

      const sourceMatch =
        !source || !ruleset.source?.length || ruleset.source.includes(source);

      const l2Match =
        !ruleset.l2_counsellor_ids?.length ||
        (studentL2Id && ruleset.l2_counsellor_ids.includes(studentL2Id));

      const courseNameMatch =
        !ruleset.course_conditions?.courseName?.length ||
        (!!Course &&
          ruleset.course_conditions.courseName.some(
            (courseName) =>
              courseName.toLowerCase().includes(Course.toLowerCase()) ||
              Course.toLowerCase().includes(courseName.toLowerCase()),
          ));

      const degreeMatch =
        !ruleset.course_conditions?.degree?.length ||
        (!!Degree && ruleset.course_conditions.degree.includes(Degree));

      const specializationMatch =
        !ruleset.course_conditions?.specialization?.length ||
        (!!Specialization &&
          ruleset.course_conditions.specialization.some(
            (spec) =>
              spec.toLowerCase().includes(Specialization.toLowerCase()) ||
              Specialization.toLowerCase().includes(spec.toLowerCase()),
          ));

      const streamMatch =
        !ruleset.course_conditions?.stream?.length ||
        (!!stream &&
          ruleset.course_conditions.stream.some(
            (s) =>
              s.toLowerCase().includes(stream.toLowerCase()) ||
              stream.toLowerCase().includes(s.toLowerCase()),
          ));

      const levelMatch =
        !ruleset.course_conditions?.level?.length ||
        (!!level && ruleset.course_conditions.level.includes(level));

      const finalResult =
        universityMatch &&
        sourceMatch &&
        l2Match &&
        courseNameMatch &&
        degreeMatch &&
        specializationMatch &&
        streamMatch &&
        levelMatch;


      return finalResult;
    });


    if (filteredRulesets.length === 0) {

      let fallbackAgentId = DUMMY_AGENT_ID;
      let fallbackAgentName = DUMMY_AGENT_NAME;

      const dummyAgent = await Counsellor.findOne({
        where: { counsellor_id: DUMMY_AGENT_ID },
      });

      if (!dummyAgent) {
        const anyL3Agent = await Counsellor.findOne({ where: { role: "l3", status: "active" } });
        if (anyL3Agent) {
          fallbackAgentId = anyL3Agent.counsellor_id;
          fallbackAgentName = anyL3Agent.counsellor_name;
        } else {
          return res.status(404).json({
            message: "No active rulesets and no L3 agents found for fallback",
          });
        }
      }

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

      return res.status(200).json({
        message: "No matching ruleset found, assigned fallback L3 counsellor",
        student_id: studentId,
        assigned_l3_counsellor_id: fallbackAgentId,
        counsellor_name_l3: fallbackAgentName,
        assignment_method: "dummy_fallback",
        reason: "No ruleset found matching all conditions (university, source, L2 counsellor, and course criteria)",
      });
    }


    filteredRulesets.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const selectedRuleset = filteredRulesets[0];



    const assignedCounsellors = selectedRuleset.assigned_counsellor_ids;

    if (!assignedCounsellors || assignedCounsellors.length === 0) {
      return res
        .status(404)
        .json({ message: "No counsellors assigned to the selected ruleset" });
    }

    let selectedCounsellorId;
    let assignmentMethod;
    let currentRoundRobinIndex = 0;

    // Fetch active status for all counsellors in the ruleset upfront
    const activeCounsellors = await Counsellor.findAll({
      where: {
        counsellor_id: { [Op.in]: assignedCounsellors },
        status: "active",
        is_blocked: false,
      },
      attributes: ["counsellor_id"],
    });
    const activeCounsellorIds = new Set(activeCounsellors.map(c => c.counsellor_id));

    if (activeCounsellors.length === 0) {
      return res.status(404).json({ message: "No active counsellors assigned to the selected ruleset" });
    }

    if (assignedCounsellors.length === 1) {
      selectedCounsellorId = assignedCounsellors[0];
      assignmentMethod = "direct";
    } else {
      currentRoundRobinIndex = selectedRuleset.round_robin_index || 0;

      if (currentRoundRobinIndex >= assignedCounsellors.length) {
        currentRoundRobinIndex = 0;
      }

      // Find next active counsellor starting from currentRoundRobinIndex
      let found = false;
      for (let i = 0; i < assignedCounsellors.length; i++) {
        const idx = (currentRoundRobinIndex + i) % assignedCounsellors.length;
        if (activeCounsellorIds.has(assignedCounsellors[idx])) {
          selectedCounsellorId = assignedCounsellors[idx];
          currentRoundRobinIndex = idx;
          found = true;
          break;
        }
      }

      if (!found) {
        return res.status(404).json({ message: "No active counsellors available in selected ruleset" });
      }

      assignmentMethod = "round-robin";

      const nextIndex = (currentRoundRobinIndex + 1) % assignedCounsellors.length;
      await LeadAssignmentRuleL3.update(
        { round_robin_index: nextIndex },
        { where: { l3_assignment_rulesets_id: selectedRuleset.l3_assignment_rulesets_id } },
      );
    }

    let counsellorDetails = await Counsellor.findOne({
      where: { counsellor_id: selectedCounsellorId, status: "active", is_blocked: false },
    });

    if (!counsellorDetails) {
      return res.status(404).json({ message: "Selected counsellor not found or is inactive" });
    }

    const responseMessage = "L3 counsellor assigned successfully based on matching ruleset conditions";

    await sendAssignmentEmail(
      studentId,
      {
        collegeName,
        Course,
        Degree,
        Specialization,
        level,
        stream,
        assignmentType: "condition_match",
      },
      counsellorDetails.counsellor_email,
      counsellorDetails.counsellor_name,
    );


    res.status(200).json({
      message: responseMessage,
      student_id: studentId,
      assigned_l3_counsellor_id: counsellorDetails.counsellor_id,
      counsellor_name_l3: counsellorDetails.counsellor_name,
      assignment_method: assignmentMethod,
      matched_ruleset: {
        id: selectedRuleset.l3_assignment_rulesets_id,
        name: selectedRuleset.name,
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
      l2_counsellor_ids,
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

    const processedL2CounsellorIds = processArrayField(l2_counsellor_ids);

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
      l2_counsellor_ids: processedL2CounsellorIds,
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

    if (updateData.l2_counsellor_ids !== undefined) {
      updateData.l2_counsellor_ids = processArrayField(updateData.l2_counsellor_ids);
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
    res.status(500).json({
      message: "Error toggling ruleset status",
      error: error.message,
    });
  }
};



export const internalAssignL3 = async (data) => {
  return new Promise(async (resolve, reject) => {
    const req = { body: data };
    const res = {
      status: (statusCode) => ({
        json: (response) => {
          if (statusCode >= 400) {
            reject(new Error(response.message || 'Assignment failed'));
          } else {
            resolve(response);
          }
        }
      })
    };
    try {
      await assignedtoL3byruleSet(req, res);
    } catch (err) {
      reject(err);
    }
  });
};

