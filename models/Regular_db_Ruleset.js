import { DataTypes } from "sequelize";
import sequelize from "../config/database-config.js";

const RegularDBRuleset = sequelize.define(
  "regular_db_ruleset",
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
    tableName: "regular_db_ruleset",
    timestamps: true,
    underscored: true,
  }
);

export default RegularDBRuleset;
