// services/DialerAssignmentService.js
import { QueryTypes } from "sequelize";
import sequelize from "../config/database-config.js";
import { LeadAssignmentRuleL2 } from "../models/index.js";

/**
 * Get eligible leads for dialer with calculated scores based on L2 rules
 * @param {string} counsellorId - The L2 agent requesting leads
 * @param {number} limit - Number of leads to return
 * @returns {Promise<Array>} - Array of eligible leads with scores
 */
export const getEligibleLeadsForDialer = async (counsellorId, limit = 10) => {
  try {
    // Get all active L2 rules
    const rules = await LeadAssignmentRuleL2.findAll({
      where: { is_active: true },
      order: [["priority", "DESC"]],
    });

    if (rules.length === 0) {
      console.log("No active L2 rules found");
      return [];
    }

    // Query eligible leads with latest activity data
    const eligibleLeadsQuery = `
      WITH latest_activity AS (
        SELECT DISTINCT ON (student_id) 
          student_id,
          utm_campaign,
          utm_source,
          utm_medium,
          source as activity_source,
          source_url,
          created_at as activity_date
        FROM student_lead_activities
        ORDER BY student_id, created_at DESC
      )
      SELECT 
        s.student_id,
        s.student_name,
        s.student_email,
        s.student_phone,
        s.current_student_status,
        s.dialer_overall_count as total_attempts,
        s.dialer_today_count as daily_attempts,
        s.lead_score,
        COALESCE(la.activity_source, s.source) as source,
        s.mode,
        COALESCE(la.utm_campaign, '') as utm_campaign,
        COALESCE(la.source_url, s.first_source_url) as first_source_url,
        s.preferred_budget,
        s.current_profession,
        s.preferred_level,
        s.preferred_degree,
        s.preferred_specialization,
        s.preferred_city,
        s.preferred_state,
        s.created_at,
        s.is_reactivity,
        s.assigned_counsellor_id,
        s.temp_assigned_counsellor_id as temp_counsellor_id,
        jsonb_build_object(
          'utmCampaign', COALESCE(la.utm_campaign, ''),
          'first_source_url', COALESCE(la.source_url, s.first_source_url),
          'source', COALESCE(la.activity_source, s.source),
          'mode', s.mode,
          'preferred_budget', s.preferred_budget,
          'current_profession', s.current_profession,
          'preferred_level', s.preferred_level,
          'preferred_degree', s.preferred_degree,
          'preferred_specialization', s.preferred_specialization,
          'preferred_city', s.preferred_city,
          'preferred_state', s.preferred_state
        ) as lead_data
      FROM students s
      LEFT JOIN latest_activity la ON s.student_id = la.student_id
        AND s.temp_assigned_counsellor_id IS NULL
        AND s.assigned_counsellor_id IS NULL
        AND COALESCE(s.dialer_overall_count, 0) < 15
        AND COALESCE(s.dialer_today_count, 0) < 3
      ORDER BY s.lead_score DESC NULLS LAST
      LIMIT ${limit * 2}
    `;

    const eligibleLeads = await sequelize.query(eligibleLeadsQuery, {
      type: QueryTypes.SELECT,
    });

    if (eligibleLeads.length === 0) {
      return [];
    }

    // Calculate scores for each lead using L2 rules
    const leadsWithScores = await Promise.all(
      eligibleLeads.map(async (lead) => {
        const scoreResult = await calculateLeadScoreFromL2RulesForDialer(lead.lead_data, rules);
        return {
          ...lead,
          calculated_score: scoreResult.totalScore,
          matched_rules: scoreResult.matchedRules,
          best_match: scoreResult.bestMatch,
        };
      })
    );

    // Sort by calculated score (highest first)
    leadsWithScores.sort((a, b) => b.calculated_score - a.calculated_score);

    // Return top N leads
    return leadsWithScores.slice(0, limit);
  } catch (error) {
    console.error("Error in getEligibleLeadsForDialer:", error);
    return [];
  }
};

/**
 * Calculate lead score based on L2 rules (for dialer)
 */
const calculateLeadScoreFromL2RulesForDialer = async (leadData, rules) => {
  try {
    const priorityFields = [
      "utmCampaign",
      "first_source_url",
      "source",
      "mode",
      "preferred_budget",
      "current_profession",
      "preferred_level",
      "preferred_degree",
      "preferred_specialization",
      "preferred_city",
      "preferred_state",
    ];

    let allMatchingRules = [];
    let totalScore = 0;
    let bestMatchScore = -1;
    let bestMatchDetails = null;

    // Helper function to normalize and format lead data values
    const formatLeadValue = (field, value) => {
      if (!value) return null;

      switch (field) {
        case "preferred_budget":
          if (typeof value === "number") return value.toString();
          if (typeof value === "string") {
            const numValue = value.replace(/[₹,]/g, "").trim();
            return isNaN(numValue) ? value : numValue;
          }
          return value.toString();

        case "preferred_degree":
        case "preferred_specialization":
          if (Array.isArray(value)) {
            return value.length > 0 ? value[0] : null;
          }
          return value;

        default:
          if (typeof value === "string") return value.trim();
          if (typeof value === "number") return value.toString();
          return value;
      }
    };

    // Helper to check if a value matches rule conditions
    const checkMatch = (field, value, ruleConditions) => {
      if (
        !value ||
        !ruleConditions ||
        ruleConditions.length === 0 ||
        ruleConditions.includes("Any")
      ) {
        return false;
      }

      const formattedValue = formatLeadValue(field, value);

      if (field === "first_source_url") {
        return ruleConditions.some(
          (cond) =>
            formattedValue &&
            cond &&
            formattedValue.toLowerCase().includes(cond.toLowerCase())
        );
      }

      if (field === "preferred_budget") {
        return ruleConditions.some((condition) => {
          if (!condition || !formattedValue) return false;

          if (condition.includes("-")) {
            const [min, max] = condition.split("-").map(Number);
            const budgetValue = Number(formattedValue);
            return !isNaN(budgetValue) && budgetValue >= min && budgetValue <= max;
          }

          return condition === formattedValue;
        });
      }

      if (Array.isArray(ruleConditions)) {
        return ruleConditions.some(
          (cond) =>
            cond &&
            formattedValue &&
            cond.toString() === formattedValue.toString()
        );
      }

      return ruleConditions.includes(formattedValue);
    };

    const normalizeConditions = (conditions) => {
      if (!conditions) return {};

      return {
        ...conditions,
        first_source_url: conditions.first_source_url || conditions.firstSourceUrl || [],
        utmCampaign: conditions.utmCampaign || conditions.utm_campaign || [],
        preferred_city: conditions.preferred_city || conditions.prefCity || conditions.pref_city || [],
        preferred_state: conditions.preferred_state || conditions.prefState || conditions.pref_state || [],
        preferred_degree: conditions.preferred_degree || conditions.prefDegree || [],
        preferred_specialization: conditions.preferred_specialization || conditions.prefSpec || [],
        preferred_budget: conditions.preferred_budget || conditions.budget || [],
        current_profession: conditions.current_profession || conditions.profession || [],
        preferred_level: conditions.preferred_level || conditions.level || [],
        mode: conditions.mode || [],
        source: conditions.source || [],
      };
    };

    // Process each rule
    for (const rule of rules) {
      const conditions = normalizeConditions(rule?.conditions);

      let ruleMatchScore = 0;
      let matchedFields = [];
      let ruleMatches = true;
      let totalConditions = 0;
      let satisfiedConditions = 0;
      let highestPriorityMatch = -1;

      for (let i = 0; i < priorityFields.length; i++) {
        const field = priorityFields[i];
        const ruleConditions = conditions[field];
        const fieldPriority = priorityFields.length - i;

        if (
          !ruleConditions ||
          ruleConditions.length === 0 ||
          ruleConditions.includes("Any")
        ) {
          continue;
        }

        totalConditions++;
        const value = leadData[field];

        if (value === undefined || value === null || value === "") {
          ruleMatches = false;
          break;
        }

        const isMatch = checkMatch(field, value, ruleConditions);

        if (isMatch) {
          satisfiedConditions++;
          matchedFields.push({
            field,
            value: formatLeadValue(field, value),
            matchedConditions: ruleConditions,
            priority: fieldPriority,
          });
          ruleMatchScore += fieldPriority;
          highestPriorityMatch = Math.max(highestPriorityMatch, fieldPriority);
        } else {
          ruleMatches = false;
          break;
        }
      }

      if (ruleMatches && satisfiedConditions === totalConditions && totalConditions > 0) {
        // Get score from rule
        const scoreType = rule.score_type || "numeric";
        const scoreValue = rule.score_value || 0;
        
        let ruleScore = scoreValue;
        if (scoreType === "percentage") {
          ruleScore = scoreValue;
        }

        const finalScore = ruleScore + (rule.priority || 0);

        const matchDetails = {
          matchedFields,
          highestPriorityMatch,
          totalMatchScore: ruleMatchScore,
          finalScore,
          rulePriority: rule.priority || 0,
          totalConditions,
          satisfiedConditions,
          ruleName: rule.custom_rule_name || rule.name || `Rule ${rule.lead_assignment_rule_l2_id}`,
          ruleId: rule.lead_assignment_rule_l2_id,
          scoreType,
          scoreValue: ruleScore,
        };

        allMatchingRules.push({
          rule,
          score: finalScore,
          scoreType,
          scoreValue: ruleScore,
          matchDetails,
        });

        totalScore += ruleScore;

        if (finalScore > bestMatchScore) {
          bestMatchScore = finalScore;
          bestMatchDetails = { ...matchDetails };
        }
      }
    }

    // Sort rules by score
    allMatchingRules.sort((a, b) => b.score - a.score);

    // Cap percentage total at 100
    const hasPercentageRule = allMatchingRules.some((r) => r.scoreType === "percentage");
    const finalTotalScore = hasPercentageRule && totalScore > 100 ? 100 : totalScore;

    return {
      totalScore: finalTotalScore,
      rawScore: totalScore,
      matchedRules: allMatchingRules.map((m) => ({
        ruleId: m.rule.lead_assignment_rule_l2_id,
        ruleName: m.matchDetails.ruleName,
        score: m.score,
        scoreType: m.scoreType,
        scoreValue: m.scoreValue,
        matchedFields: m.matchDetails.matchedFields?.map((f) => f.field) || [],
      })),
      bestMatch: bestMatchDetails
        ? {
            ruleId: bestMatchDetails.ruleId,
            ruleName: bestMatchDetails.ruleName,
            score: bestMatchScore,
            scoreType: bestMatchDetails.scoreType,
            scoreValue: bestMatchDetails.scoreValue,
            matchedFields: bestMatchDetails.matchedFields?.map((f) => f.field) || [],
          }
        : null,
      matchedCount: allMatchingRules.length,
    };
  } catch (error) {
    console.error("Error calculating score:", error);
    return {
      totalScore: 0,
      rawScore: 0,
      matchedRules: [],
      bestMatch: null,
      matchedCount: 0,
    };
  }
};

/**
 * Assign next lead to counsellor from dialer queue
 * @param {string} counsellorId - L2 agent ID
 * @returns {Promise<Object|null>} - Assigned lead or null
 */
export const assignNextLeadFromDialer = async (counsellorId) => {
  try {
    // Get eligible leads with scores
    const eligibleLeads = await getEligibleLeadsForDialer(counsellorId, 1);

    if (eligibleLeads.length === 0) {
      return null;
    }

    const selectedLead = eligibleLeads[0];

    // Assign temp_assigned_counsellor_id to this lead
    await sequelize.query(
      `
      UPDATE students 
      SET temp_assigned_counsellor_id = ${escape(counsellorId)},
          dialer_status = 'in_progress',
          dialer_today_count = COALESCE(dialer_today_count, 0) + 1,
          dialer_overall_count = COALESCE(dialer_overall_count, 0) + 1,
          updated_at = NOW()
      WHERE student_id = ${escape(selectedLead.student_id)}
        AND temp_assigned_counsellor_id IS NULL
        AND assigned_counsellor_id IS NULL
    `,
      { type: QueryTypes.UPDATE }
    );

    // Return the assigned lead
    return {
      ...selectedLead,
      assigned_to: counsellorId,
      assigned_at: new Date(),
    };
  } catch (error) {
    console.error("Error in assignNextLeadFromDialer:", error);
    return null;
  }
};

/**
 * Release lead from dialer (after call/remark)
 * @param {string} studentId - Student ID
 * @param {string} counsellorId - L2 agent ID
 * @param {boolean} isPermanent - Whether to make permanent assignment
 */
export const releaseLeadFromDialer = async (studentId, counsellorId, isPermanent = false) => {
  try {
    if (isPermanent) {
      // Make permanent assignment
      await sequelize.query(
        `
        UPDATE students 
        SET assigned_counsellor_id = ${escape(counsellorId)},
            temp_assigned_counsellor_id = NULL,
            dialer_status = 'converted',
            current_student_status = 'Assigned',
            updated_at = NOW()
        WHERE student_id = ${escape(studentId)}
      `,
        { type: QueryTypes.UPDATE }
      );
    } else {
      // Just clear temp assignment, keep for retry
      await sequelize.query(
        `
        UPDATE students 
        SET temp_assigned_counsellor_id = NULL,
            dialer_status = 'retry',
            updated_at = NOW()
        WHERE student_id = ${escape(studentId)}
      `,
        { type: QueryTypes.UPDATE }
      );
    }
    return true;
  } catch (error) {
    console.error("Error in releaseLeadFromDialer:", error);
    return false;
  }
};

/**
 * Reset daily dialer counts (should be called once per day)
 */
export const resetDailyDialerCounts = async () => {
  try {
    await sequelize.query(
      `
      UPDATE students 
      SET dialer_today_count = 0
      WHERE dialer_today_count > 0
    `,
      { type: QueryTypes.UPDATE }
    );
    console.log("Daily dialer counts reset successfully");
    return true;
  } catch (error) {
    console.error("Error resetting daily dialer counts:", error);
    return false;
  }
};

/**
 * Get dialer statistics for a counsellor
 * @param {string} counsellorId - L2 agent ID
 * @returns {Promise<Object>} - Statistics object
 */
export const getDialerStats = async (counsellorId) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(CASE WHEN temp_assigned_counsellor_id = ${escape(counsellorId)} AND dialer_status = 'in_progress' THEN 1 END) as active_calls,
        COUNT(CASE WHEN assigned_counsellor_id = ${escape(counsellorId)} THEN 1 END) as permanent_assignments,
        COUNT(CASE WHEN temp_assigned_counsellor_id = ${escape(counsellorId)} AND dialer_status = 'retry' THEN 1 END) as retry_leads,
        COUNT(CASE WHEN temp_assigned_counsellor_id = ${escape(counsellorId)} THEN 1 END) as total_temp_assignments
      FROM students
      WHERE temp_assigned_counsellor_id = ${escape(counsellorId)} 
         OR assigned_counsellor_id = ${escape(counsellorId)}
    `;
    
    const stats = await sequelize.query(statsQuery, {
      type: QueryTypes.SELECT,
    });
    
    return stats[0] || { active_calls: 0, permanent_assignments: 0, retry_leads: 0, total_temp_assignments: 0 };
  } catch (error) {
    console.error("Error getting dialer stats:", error);
    return { active_calls: 0, permanent_assignments: 0, retry_leads: 0, total_temp_assignments: 0 };
  }
};

const escape = (val) =>
  typeof val === "string"
    ? "'" + val.replace(/'/g, "''") + "'"
    : val === null || val === undefined
    ? "NULL"
    : val;