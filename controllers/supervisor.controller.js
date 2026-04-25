import { Counsellor, Supervisor, LoginAttempt } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { generateTokenAndSetCookie } from '../helper/getTimeForCookieExpires.js';
import { extractDevice, extractBrowser, extractOS, extractDeviceDetails } from '../helper/deviceLocationHelpers.js';

export const registerSupervisor = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Supervisor.findOne({
      where: {
        supervisor_email: email
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSupervisor = await Supervisor.create({
      supervisor_name: name,
      supervisor_email: email,
      supervisor_password: hashedPassword,
      supervisor_real_password: password
    });

    const token = generateTokenAndSetCookie(
      res,
      {
        id: newSupervisor.supervisor_id,
        role: 'Supervisor',
        name: newSupervisor.supervisor_name
      },
      'token',
      { expiresAtMidnight: false }
    );

    res.status(201).json({
      message: 'Registration successful',
      supervisor: {
        id: newSupervisor.supervisor_id,
        name: newSupervisor.supervisor_name,
        email: newSupervisor.supervisor_email,
      },
      token
    });
  } catch (error) {
    console.error('Register Supervisor Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const loginSupervisor = async (req, res) => {
  try {
    const { email, password, meta } = req.body;
    const device = req.body.device || req.body.deviceId || req.headers['x-device-id'] || meta?.device || meta?.deviceId || meta?.id;

    const serverIp = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '').split(',')[0].trim();

    const frontendIp = meta?.ip || req.body.ip;
    const isLoopback = (ip) => !ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'Unknown';
    const finalIp = (!isLoopback(frontendIp)) ? frontendIp : serverIp;

    console.log(`[Supervisor Login] User: ${email}, Frontend IP: ${frontendIp}, Server IP: ${serverIp}, Final IP: ${finalIp}`);

    let geoData = meta?.geo || req.body.geo || null;

    const uaStr = req.headers['user-agent'] || meta?.userAgent || '';
    const deviceDetails = extractDeviceDetails(uaStr);

    console.log(`[Supervisor Device] Detected: ${deviceDetails.type}, Vendor: ${deviceDetails.vendor}, Model: ${deviceDetails.model}, OS: ${extractOS(uaStr)}`);

    const combinedMeta = {
      ...meta,
      device: device || 'Unknown',
      device_type: deviceDetails.type,
      device_vendor: deviceDetails.vendor,
      device_model: deviceDetails.model,
      browser: extractBrowser(uaStr),
      os: extractOS(uaStr),
      ip: finalIp,
      user_agent: uaStr,
      geo: geoData
    };

    // Clean up redundant keys to avoid duplication
    delete combinedMeta.id;
    delete combinedMeta.userAgent;
    delete combinedMeta.deviceId;

    const supervisor = await Supervisor.findOne({ where: { supervisor_email: email } });

    if (!supervisor) {
      await LoginAttempt.create({
        user_type: 'supervisor',
        user_id: null,
        user_name: email,
        success: false,
        ip_address: finalIp,
        meta: { ...combinedMeta, reason: 'user_not_found' }
      }).catch(() => { });
      return res.status(401).json({ message: 'Supervisor not found' });
    }

    if (supervisor.status !== 'active') {
      await LoginAttempt.create({
        user_type: 'supervisor',
        user_id: supervisor.supervisor_id,
        user_name: supervisor.supervisor_name,
        success: false,
        ip_address: finalIp,
        meta: { ...combinedMeta, reason: 'account_inactive', status: supervisor.status }
      }).catch(() => { });
      return res.status(403).json({ message: `Account is ${supervisor.status}. Please contact administrator.` });
    }
   console.log("supervisor",supervisor,password);
    const isMatch = await bcrypt.compare(password, supervisor.supervisor_password);
    if (!isMatch) {
      await LoginAttempt.create({
        user_type: 'supervisor',
        user_id: supervisor.supervisor_id,
        user_name: email,
        success: false,
        ip_address: finalIp,
        meta: { ...combinedMeta, reason: 'invalid_credentials' }
      }).catch(() => { });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await Supervisor.update({
      supervisor_last_login: new Date(),
      is_logout: false
    }, {
      where: { supervisor_id: supervisor.supervisor_id }
    });

    const token = generateTokenAndSetCookie(
      res,
      {
        id: supervisor.supervisor_id,
        role: 'Supervisor',
        name: supervisor.supervisor_name
      },
      'token',
      { expiresAtMidnight: false }
    );

    await LoginAttempt.create({
      user_type: 'supervisor',
      user_id: supervisor.supervisor_id,
      user_name: supervisor.supervisor_name,
      success: true,
      ip_address: finalIp,
      meta: combinedMeta
    }).catch(() => { });

    res.status(200).json({
      message: 'Login successful',
      supervisor: {
        id: supervisor.supervisor_id,
        name: supervisor.supervisor_name,
        email: supervisor.supervisor_email,
        role: 'Supervisor',
        status: supervisor.status
      },
      token,
    });
  } catch (error) {
    console.error('Login Supervisor Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [updated] = await Supervisor.update(
      { supervisor_password: hashedPassword, supervisor_real_password: password },
      { where: { supervisor_id: userId } }
    );

    if (updated === 0) {
      return res.status(404).json({ message: 'Supervisor not found' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const logoutSupervisor = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (userId) {
      await Supervisor.update({
        is_logout: true
      }, {
        where: { supervisor_id: userId }
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Supervisor.findByPk(userId, {
      attributes: { exclude: ['supervisor_password'] },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get User Details Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

export const logoutFromAllDevices = async (req, res) => {
  try {
    const { id } = req.params;

    await Supervisor.update({
      is_logout: true
    }, {
      where: { supervisor_id: id }
    });

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logoutFromAllDevices:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const makeSupervisorLogout = async (req, res) => {
  try {
    const { supervisor_id } = req.params;
    const [updated] = await Supervisor.update(
      {
        is_logout: true
      },
      { where: { supervisor_id: supervisor_id } }
    );
    res.status(200).json({ message: 'Supervisor logged out successfully' });

  } catch (error) {
    console.error('Error in making Logout :', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

