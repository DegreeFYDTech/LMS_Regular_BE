import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const StudentQuestionResponse = sequelize.define(
  "student_question_responses",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
      references: {
        model: 'students',
        key: 'student_id',
      },
      onDelete: 'CASCADE',
    },
    lead_activity_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'student_lead_activities',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    answer: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: false,
  }
);

export default StudentQuestionResponse;
