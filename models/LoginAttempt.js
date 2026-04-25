import { DataTypes } from 'sequelize';
import sequelize from '../config/database-config.js';

const LoginAttempt = sequelize.define('LoginAttempt', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true,
  },
  user_type: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'counsellor|supervisor|other'
  },
  user_id: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  user_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  success: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ip_address: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meta: {
    type: DataTypes.JSON,
    allowNull: true,
  }
}, {
  tableName: 'login_attempts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

export default LoginAttempt;
