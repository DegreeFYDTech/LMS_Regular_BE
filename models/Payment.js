import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";
const Payment = sequelize.define(
  "payment",
  {
    student_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    college_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    course_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "PENDING",
    },
    payment_for: {
      type: DataTypes.STRING,
      allowNull: true,
      enum: ["admission", "application"],
    },
    base_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    final_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    couponCode: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    discount_amount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "INR",
    },
    razorpay_order_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    mongo_snapshot_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "payment",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
    underscored: true,
  },
);

import Student from "./Student.js";
Payment.belongsTo(Student, { foreignKey: "student_id", as: "student" });

export default Payment;
