import { DataTypes } from 'sequelize';
import sequelize from '../config/database-config.js';

const LeadSwapLog = sequelize.define('lead_swap_logs', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  student_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  from_counsellor_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  to_counsellor_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  trigger_label: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lead_type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status_at_swap: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  age_hours_condition: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  remarks_hidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  swapped_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'lead_swap_logs',
  timestamps: false,
});

export default LeadSwapLog;
