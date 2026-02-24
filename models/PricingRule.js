import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const PricingRule = sequelize.define(
  "PricingRule",
  {
    pageSlug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    campusLocation: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    collegeName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pageType: {
      type: DataTypes.STRING,
    },
    baseAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: "INR",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    allowCoupons: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: "pricing_rules",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["page_slug", "campus_location"],
      },
    ],
  }
);

export default PricingRule;
