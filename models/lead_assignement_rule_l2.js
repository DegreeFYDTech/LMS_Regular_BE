// models/leadAssignmentRule.js (Updated - Only 2 new fields)
import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";
import { v4 as uuidv4 } from "uuid";

const LeadAssignmentRule = sequelize.define(
  "l2_assignment_rulesets",
  {
    lead_assignment_rule_l2_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    conditions: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    score_type: {
      type: DataTypes.ENUM("percentage", "numeric"),
      defaultValue: "numeric",
    },
    score_value: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      validate: {
        isValidScore(value) {
          if (this.score_type === "percentage") {
            if (value < 0 || value > 100) {
              throw new Error("Percentage score must be between 0 and 100");
            }
          } else {
            if (value < -100 || value > 500) {
              throw new Error("Numeric score must be between -100 and 500");
            }
          }
        },
      },
    },
    assigned_counsellor_ids: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    round_robin_index: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    custom_rule_name: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  },
  {
    timestamps: false,
    underscored: true,
    freezeTableName: true,
  },
);

LeadAssignmentRule.generateRuleName = async function () {
  let ruleName;
  let exists = true;

  while (exists) {
    const randomString = uuidv4().slice(0, 6);
    ruleName = `Rule_${randomString}`;
    exists = await LeadAssignmentRule.findOne({ where: { name: ruleName } });
  }

  return ruleName;
};

LeadAssignmentRule.prototype.getNextCounsellor = function () {
  const list = this.assigned_counsellor_ids;
  if (!list || list.length === 0) return null;

  const index = this.round_robin_index || 0;
  const nextCounsellor = list[index];

  this.round_robin_index = (index + 1) % list.length;

  return nextCounsellor;
};

export default LeadAssignmentRule;
