import { Counsellor, Student, counsellorBreak, sequelize, UserActionLog, LoginAttempt } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookie } from '../helper/getTimeForCookieExpires.js';
import { Op, fn, col, literal } from 'sequelize';
import { createLeadLog } from './Lead_logs.controller.js'
import { SocketEmitter } from '../helper/leadAssignmentService.js';
import GenerateEmailFunction from '../config/SendLmsEmail.js'
import activityLogger from './supervisorController.js'
import { normalizeIP, isIPAllowed, extractDeviceDetails, extractBrowser, extractOS } from '../helper/deviceLocationHelpers.js';

export const registerCounsellor = async (req, res) => {
  try {
    const { name, email, password, role, preferredMode, teamOwnerId, login_start_time, login_end_time, max_active_sessions } = req.body;
    if (!name || !email || !password || !role || !preferredMode || !teamOwnerId) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }

    const existingCounsellor = await Counsellor.findOne({ where: { counsellor_email: email } });
    if (existingCounsellor) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newCounsellor = await Counsellor.create({
      counsellor_name: name,
      counsellor_email: email,
      counsellor_password: hashedPassword,
      counsellor_real_password: password,
      counsellor_role: role,
      role,
      counsellor_preferred_mode: preferredMode,
      assigned_to: teamOwnerId || null,
      ...(login_start_time && { login_start_time }),
      ...(login_end_time && { login_end_time }),
      ...(max_active_sessions && { max_active_sessions }),
    });

    // const token = generateTokenAndSetCookie(res, {
    //   id: newCounsellor.counsellor_id,
    //   role: newCounsellor.counsellor_role,
    //   name: newCounsellor.counsellor_name
    // }, 'token');

    res.status(201).json({
      counsellor: newCounsellor
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
export const getLoginAttempts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = (page - 1) * limit;
    const { user_type, user_id, success, search, startDate, endDate } = req.query;

    const where = {};
    if (user_type) where.user_type = user_type;
    if (user_id) where.user_id = user_id;
    if (success !== undefined) where.success = success === 'true' || success === '1';
    if (search) where.user_name = { [Op.iLike]: `%${search}%` };
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }

    const { rows, count } = await LoginAttempt.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      offset,
      limit,
    });

    res.json({ attempts: rows, total: count, page, limit });
  } catch (err) {
    console.error('getLoginAttempts error', err);
    res.status(500).json({ message: 'Server error' });
  }
};
export const loginCounsellor = async (req, res) => {
  try {
    const { email, password, forceLogout, deviceId: bodyDeviceId } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const finalIp = normalizeIP(
      (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '').split(',')[0].trim()
    );
    const uaStr = req.headers['user-agent'] || '';
    const device = req.headers['x-device-id'] || req.headers['device-id'] || req.headers['x-device-identifier'] || bodyDeviceId;

    const counsellor = await Counsellor.findOne({ where: { counsellor_email: email } });
    if (!counsellor) {
      await LoginAttempt.create({
        user_type: 'counsellor', user_id: null, user_name: email, success: false,
        ip_address: finalIp, meta: { reason: 'user_not_found', user_agent: uaStr }
      }).catch(() => { });
      return res.status(401).json({ message: 'Counsellor Not Found' });
    }

    if (counsellor.is_blocked) {
      await LoginAttempt.create({
        user_type: 'counsellor', user_id: counsellor.counsellor_id, user_name: email, success: false,
        ip_address: finalIp, meta: { reason: 'account_blocked', user_agent: uaStr }
      }).catch(() => { });
      return res.status(403).json({ message: 'Account is blocked. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, counsellor.counsellor_password);
    if (!isMatch) {
      await LoginAttempt.create({
        user_type: 'counsellor', user_id: counsellor.counsellor_id, user_name: email, success: false,
        ip_address: finalIp, meta: { reason: 'invalid_credentials', user_agent: uaStr }
      }).catch(() => { });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Max active sessions check (JioCinema style)
    let currentTokens = counsellor.active_session_tokens;
    if (typeof currentTokens === 'string') {
      try { currentTokens = JSON.parse(currentTokens); } catch (e) { currentTokens = []; }
    }
    if (!Array.isArray(currentTokens)) currentTokens = [];

    const maxActiveSessions = counsellor.max_active_sessions || 1;
    const isForceLogout = forceLogout === true || forceLogout === 'true';

    if (currentTokens.length >= maxActiveSessions && !isForceLogout) {
      return res.status(409).json({
        success: false,
        message: `You are already logged in from ${currentTokens.length} device(s). Logging in here will forcefully log out your other sessions.`,
        requires_force_logout: true
      });
    }

    // Login time window check
    const now = new Date();
    if (counsellor.login_start_time && counsellor.login_end_time) {
      const currentTimeStr = now.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
      if (currentTimeStr < counsellor.login_start_time || currentTimeStr > counsellor.login_end_time) {
        await LoginAttempt.create({
          user_type: 'counsellor', user_id: counsellor.counsellor_id, user_name: counsellor.counsellor_name, success: false,
          ip_address: finalIp, meta: { reason: 'outside_window', currentTime: currentTimeStr, start: counsellor.login_start_time, end: counsellor.login_end_time }
        }).catch(() => { });
        return res.status(403).json({ message: 'Login only allowed between ' + counsellor.login_start_time + ' and ' + counsellor.login_end_time });
      }
    }

    // IP whitelist check
    let allowedIps = counsellor.allowed_ips;
    if (allowedIps && !Array.isArray(allowedIps)) {
      try { allowedIps = typeof allowedIps === 'string' ? JSON.parse(allowedIps) : [allowedIps]; } catch (e) { allowedIps = [allowedIps]; }
    }
    if (Array.isArray(allowedIps) && allowedIps.length > 0) {
      if (!isIPAllowed(finalIp, allowedIps)) {
        await LoginAttempt.create({
          user_type: 'counsellor', user_id: counsellor.counsellor_id, user_name: counsellor.counsellor_name, success: false,
          ip_address: finalIp, meta: { reason: 'ip_not_allowed', allowed: allowedIps, user_agent: uaStr }
        }).catch(() => { });
        return res.status(403).json({ message: 'Access denied from this IP address' });
      }
    }

    // Device whitelist check
    let devices = counsellor.allowed_devices;
    if (devices && !Array.isArray(devices)) {
      try { devices = typeof devices === 'string' ? JSON.parse(devices) : [devices]; } catch (e) { devices = [devices]; }
    }
    if (Array.isArray(devices) && devices.length > 0) {
      const deviceDetails = extractDeviceDetails(uaStr);
      const currentDeviceType = deviceDetails.type.toLowerCase();
      const lowerWhitelist = devices.map(d => String(d).toLowerCase());
      const isAllowed = lowerWhitelist.includes(currentDeviceType) || (device && lowerWhitelist.includes(String(device).toLowerCase()));

      if (!isAllowed) {
        await LoginAttempt.create({
          user_type: 'counsellor', user_id: counsellor.counsellor_id, user_name: counsellor.counsellor_name, success: false,
          ip_address: finalIp,
          meta: { reason: 'device_not_allowed', detectedType: deviceDetails.type, vendor: deviceDetails.vendor, model: deviceDetails.model, browser: extractBrowser(uaStr), os: extractOS(uaStr), deviceId: device, allowed: devices }
        }).catch(() => { });
        return res.status(403).json({ message: 'Login not permitted from this device' });
      }
    }

    const token = generateTokenAndSetCookie(res, {
      id: counsellor.counsellor_id,
      role: counsellor.role,
      name: counsellor.counsellor_name,
      counsellorPreferredMode: counsellor.counsellor_preferred_mode
    }, 'token');

    const updatedTokens = isForceLogout ? [token] : [...currentTokens, token];

    await Counsellor.update({
      counsellor_last_login: new Date(),
      is_logout: false,
      active_session_tokens: updatedTokens
    }, {
      where: { counsellor_id: counsellor.counsellor_id }
    });

    await LoginAttempt.create({
      user_type: 'counsellor', user_id: counsellor.counsellor_id, user_name: counsellor.counsellor_name, success: true,
      ip_address: finalIp, meta: { browser: extractBrowser(uaStr), os: extractOS(uaStr), user_agent: uaStr, device }
    }).catch(() => { });

    res.status(200).json({
      message: 'Login successful',
      counsellor: {
        id: counsellor.counsellor_id,
        name: counsellor.counsellor_name,
        email: counsellor.counsellor_email,
        phoneNumber: counsellor?.counsellor_phone_number,
        role: counsellor?.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Login error' });
  }
};

export const logoutCounsellor = async (req, res) => {
  try {
    const userId = req.user?.id;
    const token = req.cookies?.token;

    if (userId) {
      const counsellor = await Counsellor.findByPk(userId, { attributes: ['active_session_tokens'] });
      let activeTokens = counsellor?.active_session_tokens || [];
      if (typeof activeTokens === 'string') {
        try { activeTokens = JSON.parse(activeTokens); } catch (e) { activeTokens = []; }
      }
      const newTokens = Array.isArray(activeTokens) ? activeTokens.filter(t => t !== token) : [];

      await Counsellor.update({
        is_logout: true,
        active_session_tokens: newTokens
      }, {
        where: { counsellor_id: userId }
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logoutFromAllDevices = async (req, res) => {
  try {
    const { id } = req.params;

    await Counsellor.update({
      is_logout: true
    }, {
      where: { counsellor_id: id }
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logoutFromAllDevices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const userId = req?.user?.id;

    const user = await Counsellor.findByPk(userId, {
      attributes: { exclude: ['counsellor_password'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ user });
  } catch (error) {
    console.error('getUserDetails error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const changePassword = async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  try {
    if (!password) return res.status(400).json({ message: 'Password is required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const [updated] = await Counsellor.update(
      { counsellor_password: hashedPassword, counsellor_real_password: password },
      { where: { counsellor_id: id } }
    );

    if (updated === 0) return res.status(404).json({ message: 'Counsellor not found' });
    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


export const getAllCounsellors = async (req, res) => {
  const { role } = req.query;
  const user = req.user;

  try {
    let whereClause = {};

    if (role) {
      if (role === "to") {
        whereClause.role = { [Op.in]: ["to", "to_l3"] };
      } else {
        whereClause.role = role;
      }
    } else {
      whereClause.role = { [Op.ne]: "to" };
    }

    if (user?.role === "to" && user?.id) {
      whereClause.assigned_to = user.id;
    }
    if (user?.role === "to_l3" && user?.id) {
      whereClause.assigned_to = user.id;
    }
    console.log("Fetching counsellors with where clause:", whereClause);
    const counsellors = await Counsellor.findAll({
      where: whereClause,
      attributes: {
        exclude: ["counsellor_password", "counsellor_real_password"],
      },
    });

    const supervisors = await Counsellor.findAll({
      where: {
        role: {
          [Op.in]: ["to","to_l3"],
        },
      },
      attributes: ["counsellor_id", "counsellor_name"],
    });

    const supervisorMap = {};
    supervisors.forEach((sup) => {
      supervisorMap[sup.counsellor_id] = sup.counsellor_name;
    });

    const formattedCounsellors = counsellors.map((c) => {
      const data = c.toJSON();
      return {
        ...data,
        supervisor_name: data.assigned_to
          ? supervisorMap[data.assigned_to] || null
          : null,
      };
    });

    res.status(200).json(formattedCounsellors);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching counsellors",
      error: error.message,
    });
  }
};


export const deleteCounsellor = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Counsellor.destroy({ where: { counsellor_id: id } });
    if (!deleted) return res.status(404).json({ message: 'Counsellor not found' });

    res.status(200).json({ message: 'Counsellor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting counsellor', error });
  }
};

export const updateCounsellorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    console.log(status, id)
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const [updated] = await Counsellor.update(
      { status: status },
      { where: { counsellor_id: id } }
    );

    console.log(': Counsellor not found', updated)

    if (updated === 0) return res.status(404).json({ message: 'Counsellor not found' });

    if (req.user && ["to", "to_l3", "Supervisor"].includes(req.user.role)) {
      try {
        await UserActionLog.create({
          user_id: req.user.id,
          user_role: req.user.role,
          action: "Update Counsellor Status",
          target_id: id,
          target_type: "counsellor",
          details: { status: status },
          ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
      } catch (logError) {
        console.error("Error logging user action:", logError);
      }
    }

    res.status(200).json({ message: 'Status updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating status', error });
  }
};

export const changeCounsellorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password: newPassword } = req.body;
    console.log(id, newPassword)
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log(hashedPassword, 'hasedPass')
    console.log(hashedPassword)
    const [updated] = await Counsellor.update(
      { counsellor_password: hashedPassword, counsellor_real_password: newPassword },
      { where: { counsellor_id: id } }
    );

    if (updated === 0) return res.status(404).json({ message: 'Counsellor not found' });

    if (req.user && ["to", "to_l3", "Supervisor"].includes(req.user.role)) {
      try {
        await UserActionLog.create({
          user_id: req.user.id,
          user_role: req.user.role,
          action: "Change Counsellor Password",
          target_id: id,
          target_type: "counsellor",
          details: { action: "Password changed" },
          ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
      } catch (logError) {
        console.error("Error logging user action:", logError);
      }
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error changing password', error });
  }
};

export const updateCounsellorPreferredMode = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferredMode } = req.body;
    console.log('id', id)
    if (!['Regular', 'Online'].includes(preferredMode)) {
      return res.status(400).json({ message: 'Invalid preferred mode' });
    }

    const [updated] = await Counsellor.update(
      { counsellor_preferred_mode: preferredMode },
      { where: { counsellor_id: id } }
    );
    if (updated === 0) return res.status(404).json({ message: 'Counsellor not found' });

    if (req.user && ["to", "to_l3", "Supervisor"].includes(req.user.role)) {
      try {
        await UserActionLog.create({
          user_id: req.user.id,
          user_role: req.user.role,
          action: "Update Counsellor Mode",
          target_id: id,
          target_type: "counsellor",
          details: { preferredMode: preferredMode },
          ip_address: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
        });
      } catch (logError) {
        console.error("Error logging user action:", logError);
      }
    }

    res.status(200).json({ message: 'Preferred mode updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating preferred mode', error });
  }
};

export const getCounsellorById = async (req, res) => {
  try {
    const { counsellorId } = req.params;

    const response = await Counsellor.findOne({
      where: { counsellor_id: counsellorId },
      attributes: { exclude: ['counsellor_password'] }
    });

    if (!response) {
      return res.status(404).json({ message: 'Counsellor not found' });
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error('Error in getCounsellorById:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const assignCounsellorsToStudents = async (req, res) => {
  try {
    const { assignmentType, selectedStudents, selectedAgents } = req.body;
    const { supervisorId } = req.user;

    if (
      !['L2', 'L3'].includes(assignmentType) ||
      !Array.isArray(selectedStudents) || selectedStudents.length === 0 ||
      !Array.isArray(selectedAgents) || selectedAgents.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing assignmentType, selectedStudents, or selectedAgents'
      });
    }

    const agentIds = selectedAgents.map(agent => agent.counsellorId);

    const validCounsellors = await Counsellor.findAll({
      where: {
        counsellor_id: { [Op.in]: agentIds },
        role: assignmentType.toLowerCase()
        // status: 'active'
      }
    });

    if (validCounsellors.length !== selectedAgents.length) {
      return res.status(400).json({
        success: false,
        message: `Some agents are invalid or not active ${assignmentType} counsellors`
      });
    }

    const students = await Student.findAll({
      where: { student_id: { [Op.in]: selectedStudents } },
    });

    if (students.length !== selectedStudents.length) {
      return res.status(400).json({
        success: false,
        message: 'Some selected students do not exist'
      });
    }

    // 1️⃣ Create a mapping of studentId -> counsellorId
    const studentCounsellorMap = {};

    const updatePromises = selectedStudents.map((studentId, index) => {
      const { counsellorId, name } = selectedAgents[index % selectedAgents.length];

      // Save mapping for logs later
      studentCounsellorMap[studentId] = counsellorId;

      const updateFields = assignmentType === 'L2'
        ? { assigned_counsellor_id: counsellorId, is_reassigned_yet: true }
        : { assigned_counsellor_l3_id: counsellorId, assigned_l3_date: new Date(), is_reassigned_yet: true };

      SocketEmitter({ student_id: studentId }, {
        counsellor_id: counsellorId,
        counsellor_name: name
      });

      return Student.update(updateFields, {
        where: { student_id: studentId }
      });
    });

    await Promise.all(updatePromises);

    const logPromises = Object.entries(studentCounsellorMap).map(([studentId, counsellorId]) => {
      return createLeadLog({
        studentId,
        assignedCounsellorId: counsellorId,
        assignedBy: supervisorId || req?.user?.id
      });
    });

    await Promise.all(logPromises);


    const updatedStudents = await Student.findAll({
      where: {
        student_id: { [Op.in]: selectedStudents }
      },
      include: [
        {
          model: Counsellor,
          as: 'assignedCounsellorL3',
          attributes: ['counsellor_name', 'counsellor_email']
        },
      ]
    });

    if (assignmentType.toLowerCase() === 'l3') {
      const emailPromises = updatedStudents.map(student => {
        return GenerateEmailFunction({
          id: student.student_id,
          name: student.student_name,
          email: student.student_email,
          phone: student.student_phone,
          timestamp: new Date(),
          asigned_college: student?.course?.collegeName || 'N/A',
          asigned_course: student?.course?.courseName || 'N/A',
          agent_name: student?.assignedCounsellorL3?.counsellor_name,
          agent_email: student?.assignedCounsellorL3?.counsellor_email
        }, [
          student?.assignedCounsellorL3?.counsellor_email
        ]);
      });
      await Promise.all(emailPromises);
    }


    res.status(200).json({
      success: true,
      message: `Assigned ${selectedStudents.length} students to ${selectedAgents.length} ${assignmentType} counsellor(s)`,
      data: {
        assignmentType,
        updatedStudents,
        summary: {
          totalStudents: selectedStudents.length,
          totalCounsellors: selectedAgents.length,
          assignmentDate: new Date()
        }
      }
    });
    await activityLogger(req, {
      success: true,
      message: `Assigned ${selectedStudents.length} students to ${selectedAgents.length} ${assignmentType} counsellor(s)`,
      data: {
        assignmentType,
        updatedStudents,
        summary: {
          totalStudents: selectedStudents.length,
          totalCounsellors: selectedAgents.length,
          assignmentDate: new Date()
        }
      }
    })

  } catch (error) {
    console.error('Error in assignCounsellorsToStudents:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    await activityLogger(req, {
      success: false,
      message: 'Internal server error',
      error: error
    })
  }
};

export const makeCounsellorLogout = async (req, res) => {
  try {
    const { counsellor_id } = req.params;
    const [updated] = await Counsellor.update(
      {
        is_logout: true
      },
      { where: { counsellor_id: counsellor_id } }
    );
    res.status(200).json({ message: 'Counsellor logged out successfully' });

  } catch (error) {
    console.error('Error in making Logout :', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const start_Counsellors_break = async (req, res) => {
  const { counselor_id, break_start, break_type, break_notes } = req.body;
  console.log(req.body)
  try {
    const row = await counsellorBreak.create({
      counsellor_id: counselor_id,
      break_start: new Date(),
      break_type: break_type,
      notes: break_notes

    })
    res.status(201).send({ success: true, data: row })
  }
  catch (e) {
    console.log(e.message, 'eror')
  }
}

export const end_Counsellors_break = async (req, res) => {
  const { counselor_id, break_end } = req.body;
  console.log(counselor_id, break_end)
  if (!counselor_id) {
    return res.status(400).json({
      success: false,
      message: 'counselor_id is required'
    });
  }

  const transaction = await sequelize.transaction();

  try {
    const activeBreak = await counsellorBreak.findOne({
      where: {
        counsellor_id: counselor_id,
        break_end: null
      },
      order: [['created_at', 'DESC']],
      transaction
    });

    if (!activeBreak) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'No active break found for this counselor'
      });
    }

    const breakEndTime = break_end ? new Date(break_end) : new Date();
    const breakStartTime = new Date(activeBreak.break_start);


    if (breakEndTime <= breakStartTime) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Break end time must be after break start time'
      });
    }

    const durationMs = breakEndTime - breakStartTime;
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationSeconds = Math.floor(durationMs / 1000);
    const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const [affectedRows] = await counsellorBreak.update(
      {
        break_end: breakEndTime,
        duration: durationMinutes,
        duration_seconds: durationSeconds,
        duration_formatted: formattedDuration,
        updated_at: new Date()
      },
      {
        where: { id: activeBreak.id },
        transaction
      }
    );

    const updatedBreak = await counsellorBreak.findByPk(activeBreak.id, {
      transaction
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      data: {
        breakRecord: updatedBreak,
        calculatedDuration: {
          milliseconds: durationMs,
          seconds: durationSeconds,
          minutes: durationMinutes,
          hours: parseFloat(durationHours),
          formatted: formattedDuration
        }
      },
      message: `Break ended successfully. Duration: ${formattedDuration}`
    });

  } catch (e) {
    await transaction.rollback();
    console.log(e.message, 'error');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: e.message
    });
  }
};

export const activeBreak = async (req, res) => {
  try {
    const { counsellor_id } = req.params;
    console.log(req.params)
    const activeBreak = await counsellorBreak.findOne({
      where: {
        counsellor_id: counsellor_id,
        break_end: null
      },
      order: [['created_at', 'DESC']]
    });
    console.log('active break', activeBreak)
    res.status(200).json({
      success: true,
      data: activeBreak
    })
  }
  catch (e) {
    console.log(e.message, 'error');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: e.message
    });
  }
}

export const formatBreakDuration = (startTime, endTime) => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMs = end - start;

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((durationMs % (1000 * 60)) / 1000);

  return {
    milliseconds: durationMs,
    seconds: Math.floor(durationMs / 1000),
    minutes: Math.floor(durationMs / (1000 * 60)),
    hours: (durationMs / (1000 * 60 * 60)).toFixed(2),
    formatted: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  };
};

export async function getCounsellorBreakStats(param = {}, userRole = null, userId = null) {
  const parseDate = (dateString, isEndDate = false) => {
    const date = new Date(dateString);
    if (isEndDate) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }
    return date;
  };

  let startDate, endDate;

  if (param.from && param.to) {
    startDate = parseDate(param.from);
    endDate = parseDate(param.to, true);
  } else if (param.from && !param.to) {
    startDate = parseDate(param.from);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  } else if (!param.from && param.to) {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate = parseDate(param.to, true);
  } else {
    startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
  }

  // Build where clause for counsellor inclusion
  const counsellorWhere = {};

  // If user is a Team Owner (to), only show counsellors assigned to them
  if (userRole === 'to' && userId) {
    counsellorWhere.assigned_to = userId;
  }

  const stats = await counsellorBreak.findAll({
    attributes: [
      'counsellor_id',
      [fn('COUNT', col('id')), 'no_of_breaks_today'],
      [fn('SUM', col('duration_seconds')), 'total_break_time'],
      [
        // Currently on break within this date range
        literal(`(
          SELECT CASE WHEN EXISTS (
            SELECT 1
            FROM "counsellor_break_logs" cb2
            WHERE cb2.counsellor_id = "counsellorBreak".counsellor_id
              AND cb2.break_end IS NULL
              AND cb2.break_start BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
          ) THEN TRUE ELSE FALSE END
        )`),
        'currently_on_break'
      ],
      [
        literal(`(
          SELECT row_to_json(cb_last)
          FROM "counsellor_break_logs" cb_last
          WHERE cb_last.counsellor_id = "counsellorBreak".counsellor_id
            AND cb_last.break_start BETWEEN '${startDate.toISOString()}' AND '${endDate.toISOString()}'
          ORDER BY cb_last.break_start DESC
          LIMIT 1
        )`),
        'last_break'
      ]
    ],
    where: {
      break_start: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: Counsellor,
        as: 'counsellor_details',
        attributes: ['counsellor_name', 'counsellor_email', 'counsellor_id', 'role', 'assigned_to'],
        where: counsellorWhere, // Apply the filter here
        required: true,
      }
    ],
    group: [
      '"counsellorBreak".counsellor_id',
      'counsellor_details.counsellor_id',
      'counsellor_details.counsellor_name',
      'counsellor_details.counsellor_email',
      'counsellor_details.role',
      'counsellor_details.assigned_to'
    ],
    order: [['counsellor_details', 'counsellor_name', 'ASC']],
  });

  return {
    data: stats,
    dateRange: {
      from: startDate.toISOString().split('T')[0],
      to: endDate.toISOString().split('T')[0]
    },
    totalRecords: stats.length,
    filteredByTeamOwner: userRole === 'to' && userId ? true : false
  };
}

export async function getCounsellor_break_stats(req, res) {
  try {
    const user = req.user;
    console.log('User accessing break stats:', user.id, 'Role:', user.role);

    // Pass user role and ID to the stats function
    const data = await getCounsellorBreakStats(req.query, user.role, user.id);

    // Add user info to response
    const response = {
      data: data,
      success: true,
      userInfo: {
        id: user.id,
        role: user.role,
        name: user.name
      },
      ...(user.role === 'to' && {
        note: 'Showing break stats for counsellors assigned to this Team Owner'
      })
    };

    res.status(200).send(response);
  } catch (e) {
    console.log('Error in getCounsellor_break_stats:', e.message);
    res.status(200).send({
      success: false,
      message: e.message,
      userInfo: req.user ? {
        id: req.user.id,
        role: req.user.role,
        name: req.user.name
      } : null
    });
  }
}

export const changeSupervisor = async (req, res) => {
  const { counsellor_id, supervisor_id } = req.body;
  console.log(counsellor_id, supervisor_id)
  try {
    if (supervisor_id) {
      const supervisor = await Counsellor.findOne({
        where: {
          counsellor_id: supervisor_id,
          role: { [Op.in]: ['to', 'to_l3'] }
        }
      });
      console.log(supervisor)
      if (!supervisor) {
        return res.status(404).json({
          message: 'Supervisor not found or not a valid supervisor (role must be "to")'
        });
      }
    }

    const [updated] = await Counsellor.update(
      {
        assigned_to: supervisor_id || null,
        updated_at: new Date()
      },
      {
        where: { counsellor_id: counsellor_id }
      }
    );

    if (updated === 0) {
      return res.status(404).json({ message: 'Counsellor not found' });
    }

    const updatedCounsellor = await Counsellor.findOne({
      where: { counsellor_id: counsellor_id },
      attributes: { exclude: ['counsellor_password'] },
      include: [
        {
          model: Counsellor,
          as: 'supervisor',
          foreignKey: 'assigned_to',
          attributes: ['counsellor_id', 'counsellor_name', 'role']
        }
      ]
    });

    const formattedCounsellor = updatedCounsellor.toJSON();
    formattedCounsellor.supervisor_name = formattedCounsellor.supervisor?.counsellor_name || null;

    res.status(200).json({
      message: 'Supervisor updated successfully',
      counsellor: formattedCounsellor
    });
  } catch (error) {
    console.error('Error changing supervisor:', error.message);
    res.status(500).json({ message: 'Error changing supervisor', error: error.message });
  }
};

export const getCounsellorAccessSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const counsellor = await Counsellor.findByPk(id, {
      attributes: ['counsellor_id', 'login_start_time', 'login_end_time', 'allowed_ips', 'allowed_devices', 'max_active_sessions']
    });
    if (!counsellor) return res.status(404).json({ message: 'Counsellor not found' });
    res.json({ accessSettings: counsellor });
  } catch (err) {
    console.error('getCounsellorAccessSettings error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCounsellorAccessSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const { login_start_time, login_end_time, allowed_ips, allowed_devices, max_active_sessions } = req.body;
    const updates = {};
    if (login_start_time !== undefined) updates.login_start_time = login_start_time;
    if (login_end_time !== undefined) updates.login_end_time = login_end_time;
    if (allowed_ips !== undefined) updates.allowed_ips = allowed_ips;
    if (allowed_devices !== undefined) updates.allowed_devices = allowed_devices;
    if (max_active_sessions !== undefined) updates.max_active_sessions = max_active_sessions;

    const [updated] = await Counsellor.update(updates, { where: { counsellor_id: id } });
    if (updated === 0) return res.status(404).json({ message: 'Counsellor not found or nothing changed' });
    res.json({ message: 'Access settings updated' });
  } catch (err) {
    console.error('updateCounsellorAccessSettings error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const bulkUpdateCounsellorAccessSettings = async (req, res) => {
  try {
    const { ids, login_start_time, login_end_time, allowed_ips, allowed_devices, max_active_sessions } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Array of ids is required' });
    }

    const updates = {};
    if (login_start_time !== undefined) updates.login_start_time = login_start_time;
    if (login_end_time !== undefined) updates.login_end_time = login_end_time;
    if (allowed_ips !== undefined) updates.allowed_ips = allowed_ips;
    if (allowed_devices !== undefined) updates.allowed_devices = allowed_devices;
    if (max_active_sessions !== undefined) updates.max_active_sessions = max_active_sessions;

    await Counsellor.update(updates, { where: { counsellor_id: { [Op.in]: ids } } });
    res.json({ message: 'Bulk access settings updated' });
  } catch (err) {
    console.error('bulkUpdateCounsellorAccessSettings error', err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const toggleBlockCounsellor = async (req, res) => {
  try {
    const { id } = req.params;
    const counsellor = await Counsellor.findByPk(id);
    if (!counsellor) {
      return res.status(404).json({ message: 'Counsellor not found' });
    }
    
    const newBlockedStatus = !counsellor.is_blocked;
    await counsellor.update({ is_blocked: newBlockedStatus });
    
    if (newBlockedStatus) {
      // Logout logic if blocked
      const activeTokens = counsellor.active_session_tokens || [];
      if (activeTokens.length > 0) {
        await counsellor.update({ is_logout: true, active_session_tokens: [] });
      }
    }
    
    res.status(200).json({ 
      message: `Counsellor successfully ${newBlockedStatus ? 'blocked' : 'unblocked'}`,
      is_blocked: newBlockedStatus 
    });
  } catch (error) {
    console.error('Error toggling block status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
