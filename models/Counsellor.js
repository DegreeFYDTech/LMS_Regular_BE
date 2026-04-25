import { DataTypes } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import sequelize from '../config/database-config.js';

const Counsellor = sequelize.define('counsellors', {
  counsellor_id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    defaultValue: () => 'CNS-' + uuidv4().substr(0, 8).toUpperCase(),
  },
  counsellor_name: DataTypes.STRING,
  counsellor_email: { type: DataTypes.STRING, unique: true },
  counsellor_password: DataTypes.STRING,
  counsellor_real_password: DataTypes.STRING,
  status: {
    type: DataTypes.STRING,
    defaultValue: 'active',
    validate: { isIn: [['active', 'inactive', 'suspended']] },
  },
  role: DataTypes.STRING,
  counsellor_preferred_mode: {
    type: DataTypes.STRING,
    defaultValue: 'Regular',
    validate: { isIn: [['Regular', 'Online']] },
  },
  total_leads: { type: DataTypes.INTEGER, defaultValue: 0 },
  current_lead_capacity: { type: DataTypes.INTEGER, defaultValue: 0 },
  counsellor_last_login: DataTypes.DATE,
  is_logout: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_blocked: { type: DataTypes.BOOLEAN, defaultValue: false },

  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  assigned_to: {
    type: DataTypes.STRING,
  },
  login_start_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Allowed login window start (HH:MM:SS)'
  },
  login_end_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Allowed login window end (HH:MM:SS)'
  },
  allowed_ips: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Array of permitted IP addresses for this counsellor'
  },
  allowed_devices: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Optional list of allowed device types (e.g. mobile, desktop)'
  },
  max_active_sessions: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Max simultaneous active devices allowed'
  },
  active_session_tokens: {
    type: DataTypes.JSON,
    defaultValue: [],
    comment: 'Current valid JWT tokens to enforce max session limits'
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Counsellor;