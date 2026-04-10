import { LeadAssignmentRuleL2, Counsellor } from '../models/index.js';
import { Op } from 'sequelize';

const cleanConditions = (conditions) => {
  try {
    if (!conditions || typeof conditions !== 'object') return {};

    const cleaned = {};
    const priorityFields = [
      'utmCampaign',
      'first_source_url', 
      'source',
      'mode',
      'preferred_budget',
      'current_profession',
      'preferred_level',
      'preferred_degree',
      'preferred_specialization',
      'preferred_city',
      'preferred_state'
    ];

    for (const [key, value] of Object.entries(conditions)) {
      if (!priorityFields.includes(key)) continue;

      if (Array.isArray(value)) {
        const cleanedArray = value
          .map(item => {
            if (typeof item === 'object' && item !== null) {
              return item._id || item.value || null;
            }
            return item;
          })
          .filter(item =>
            item !== null &&
            item !== undefined &&
            String(item).trim() !== ''
          );

        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray;
        }
      } else if (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
      ) {
        cleaned[key] = value;
      }
    }

    return cleaned;
  } catch (e) {
    console.error('Error in cleanConditions:', e.message);
    return {};
  }
};

const validateConditionKeys = (conditions) => {
  const priorityFields = [
    'utmCampaign',
    'first_source_url',
    'source',
    'mode',
    'preferred_budget',
    'current_profession',
    'preferred_level',
    'preferred_degree',
    'preferred_specialization',
    'preferred_city',
    'preferred_state'
  ];
  
  const providedKeys = Object.keys(conditions);
  const invalidKeys = providedKeys.filter(key => !priorityFields.includes(key));
  
  if (invalidKeys.length > 0) {
    throw new Error(`Invalid condition keys: ${invalidKeys.join(', ')}. Only these 11 fields are allowed: ${priorityFields.join(', ')}`);
  }
};

export const createLeadAssignmentforL2 = async (req, res) => {
  try {
    const { 
      conditions, 
      score_type = 'numeric',
      score_value = 0,
      assigned_counsellor_ids, 
      is_active = true, 
      priority = 0, 
      custom_rule_name 
    } = req.body;
    
    // Validate score
    if (score_type === 'percentage') {
      if (score_value < 0 || score_value > 100) {
        return res.status(400).json({ 
          success: false, 
          message: 'Percentage score must be between 0 and 100' 
        });
      }
    } else {
      if (score_value < -100 || score_value > 500) {
        return res.status(400).json({ 
          success: false, 
          message: 'Numeric score must be between -100 and 500' 
        });
      }
    }

    if (!assigned_counsellor_ids || !Array.isArray(assigned_counsellor_ids) || assigned_counsellor_ids.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one counsellor must be assigned' });
    }

    const cleanedConditions = cleanConditions(conditions);
    
    if (Object.keys(cleanedConditions).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'At least one valid condition must be provided from the allowed fields' 
      });
    }
    
    validateConditionKeys(cleanedConditions);
    
    const counsellors = await Counsellor.findAll({
      where: {
        counsellor_id: { [Op.in]: assigned_counsellor_ids }
      }
    });

    if (counsellors.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid counsellors found' });
    }

    const name = await LeadAssignmentRuleL2.generateRuleName();
    const newRule = await LeadAssignmentRuleL2.create({
      name,
      conditions: cleanedConditions,
      score_type,
      score_value,
      assigned_counsellor_ids: counsellors.map(c => c.counsellor_id),
      is_active,
      priority,
      custom_rule_name
    });

    const fetchedCounsellors = await Counsellor.findAll({
      where: { counsellor_id: { [Op.in]: newRule.assigned_counsellor_ids } },
      attributes: ['counsellor_id', 'counsellor_name', 'counsellor_email']
    });

    newRule.dataValues.counsellors = fetchedCounsellors;

    res.status(201).json({
      success: true,
      message: 'Rule created successfully',
      data: newRule
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLeadAssignmentforL2 = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      conditions, 
      score_type, 
      score_value, 
      assigned_counsellor_ids, 
      is_active, 
      priority, 
      custom_rule_name 
    } = req.body;
    
    const updateData = {};

    if (score_type !== undefined) {
      updateData.score_type = score_type;
    }

    if (score_value !== undefined) {
      // Get current rule to check score_type
      const currentRule = await LeadAssignmentRuleL2.findByPk(id);
      const finalScoreType = score_type || currentRule?.score_type || 'numeric';
      
      if (finalScoreType === 'percentage') {
        if (score_value < 0 || score_value > 100) {
          return res.status(400).json({ 
            success: false, 
            message: 'Percentage score must be between 0 and 100' 
          });
        }
      } else {
        if (score_value < -100 || score_value > 500) {
          return res.status(400).json({ 
            success: false, 
            message: 'Numeric score must be between -100 and 500' 
          });
        }
      }
      updateData.score_value = score_value;
    }

    if (conditions !== undefined) {
      const cleanedConditions = cleanConditions(conditions);
      if (Object.keys(cleanedConditions).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'At least one valid condition must be provided' 
        });
      }
      validateConditionKeys(cleanedConditions);
      updateData.conditions = cleanedConditions;
    }
    
    if (is_active !== undefined) updateData.is_active = is_active;
    if (priority !== undefined) updateData.priority = priority;
    if (assigned_counsellor_ids !== undefined) {
      const counsellors = await Counsellor.findAll({
        where: { counsellor_id: { [Op.in]: assigned_counsellor_ids } }
      });
      updateData.assigned_counsellor_ids = counsellors.map(c => c.counsellor_id);
    }
    if (custom_rule_name !== undefined) updateData.custom_rule_name = custom_rule_name;

    const [updatedRowsCount] = await LeadAssignmentRuleL2.update(updateData, {
      where: { lead_assignment_rule_l2_id: id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const updatedRule = await LeadAssignmentRuleL2.findByPk(id);
    const counsellors = await Counsellor.findAll({
      where: { counsellor_id: { [Op.in]: updatedRule.assigned_counsellor_ids || [] } },
      attributes: ['counsellor_id', 'counsellor_name', 'counsellor_email']
    });
    updatedRule.dataValues.counsellors = counsellors;

    res.json({ 
      success: true, 
      message: 'Rule updated successfully',
      data: updatedRule
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllLeadAssignmentforL2 = async (req, res) => {
  try {
    const { page = 1, is_active, limit = 10, priority, score_type, min_score, max_score } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    const whereClause = {};
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';
    if (priority !== undefined) whereClause.priority = parseInt(priority);
    if (score_type !== undefined) whereClause.score_type = score_type;
    
    // Score range filtering
    if (min_score !== undefined || max_score !== undefined) {
      whereClause.score_value = {};
      if (min_score !== undefined) whereClause.score_value[Op.gte] = parseInt(min_score);
      if (max_score !== undefined) whereClause.score_value[Op.lte] = parseInt(max_score);
    }

    const { count, rows } = await LeadAssignmentRuleL2.findAndCountAll({
      where: whereClause,
      order: [['priority', 'DESC'], ['created_at', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    // Fetch counsellors for each rule
    for (let rule of rows) {
      const counsellors = await Counsellor.findAll({
        where: { counsellor_id: { [Op.in]: rule.assigned_counsellor_ids } },
        attributes: ['counsellor_id', 'counsellor_name', 'counsellor_email']
      });
      rule.dataValues.counsellors = counsellors;
    }
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / parseInt(limit)),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeadAssignmentforL2ById = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await LeadAssignmentRuleL2.findByPk(id);

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const counsellors = await Counsellor.findAll({
      where: { counsellor_id: { [Op.in]: rule.assigned_counsellor_ids || [] } },
      attributes: ['counsellor_id', 'counsellor_name', 'counsellor_email']
    });

    rule.dataValues.counsellors = counsellors;

    res.json({ 
      success: true, 
      data: rule 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteLeadAssignmentforL2 = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await LeadAssignmentRuleL2.findByPk(id);
    
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    const ruleName = rule.name;
    await rule.destroy();

    res.json({ 
      success: true, 
      message: 'Rule deleted successfully', 
      data: { deletedRule: ruleName } 
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleLeadAssignmentforL2Status = async (req, res) => {
  try {
    const { id } = req.params;
    const rule = await LeadAssignmentRuleL2.findByPk(id);
    
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }

    rule.is_active = !rule.is_active;
    await rule.save();

    res.json({
      success: true,
      message: `Rule ${rule.is_active ? 'activated' : 'deactivated'} successfully`,
      data: { 
        is_active: rule.is_active, 
        ruleName: rule.name,
        custom_rule_name: rule.custom_rule_name,
        score_type: rule.score_type,
        score_value: rule.score_value
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to calculate score from L2 rules
export const calculateScoreFromL2Rules = async (leadData) => {
  try {
    const activeRules = await LeadAssignmentRuleL2.findAll({
      where: { is_active: true },
      order: [['priority', 'DESC']]
    });

    let totalScore = 0;
    const matchedRules = [];

    for (const rule of activeRules) {
      let isMatch = true;
      
      // Check all conditions
      for (const [key, expectedValue] of Object.entries(rule.conditions)) {
        const actualValue = leadData[key];
        
        if (Array.isArray(expectedValue)) {
          if (!Array.isArray(actualValue)) {
            if (!expectedValue.includes(actualValue)) {
              isMatch = false;
              break;
            }
          } else {
            if (!actualValue.some(val => expectedValue.includes(val))) {
              isMatch = false;
              break;
            }
          }
        } else {
          if (actualValue !== expectedValue) {
            isMatch = false;
            break;
          }
        }
      }
      
      if (isMatch) {
        matchedRules.push({
          rule_id: rule.lead_assignment_rule_l2_id,
          name: rule.name,
          score_type: rule.score_type,
          score_value: rule.score_value
        });
        
        totalScore += rule.score_value;
        
        // Update last_matched_at
        await rule.update({ last_matched_at: new Date() });
      }
    }

    return {
      totalScore,
      matchedRules,
      matchedCount: matchedRules.length,
      // Cap percentage at 100
      finalScore: totalScore > 100 && matchedRules.some(r => r.score_type === 'percentage') ? 100 : totalScore
    };
  } catch (error) {
    console.error('Error calculating score from L2 rules:', error);
    return {
      totalScore: 0,
      matchedRules: [],
      matchedCount: 0,
      finalScore: 0,
      error: error.message
    };
  }
};