import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const Payment = sequelize.define(
  "payment",
  {
    campaign_id: {
      type: DataTypes.ARRAY(DataTypes.STRING), 
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    history: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
  },
  {
    tableName: "payment",
    timestamps: true,
    underscored: true,
  }
);

export default Payment;
