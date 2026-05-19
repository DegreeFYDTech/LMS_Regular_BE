import { DataTypes } from 'sequelize';
import sequelize from '../config/database-config.js';

const CuBotSending = sequelize.define('cu_bot_sending', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  student_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'done', 'failed'),
    defaultValue: 'pending',
    allowNull: false
  },
  response_url: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'cu_bot_sending',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true
});

export default CuBotSending;
