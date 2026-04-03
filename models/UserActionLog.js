import { DataTypes } from 'sequelize';
import sequelize from '../config/database-config.js';

const UserActionLog = sequelize.define('user_action_log', {
  user_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  user_role: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  action: {
    type: DataTypes.STRING, // e.g., 'Update Student Info', 'Assign Lead', etc.
    allowNull: false,
  },
  target_id: {
    type: DataTypes.STRING, // The ID of the student or counsellor being updated.
    allowNull: true,
  },
  target_type: {
    type: DataTypes.STRING, // e.g., 'student', 'counsellor'
    allowNull: true,
  },
  details: {
    type: DataTypes.JSONB, // Details of the change (prev vs current)
    allowNull: true,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  tableName: 'user_action_logs',
  timestamps: true,
  underscored: true,
});

export default UserActionLog;
