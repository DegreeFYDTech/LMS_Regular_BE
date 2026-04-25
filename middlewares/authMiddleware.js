import jwt from 'jsonwebtoken';
import Counsellor from '../models/Counsellor.js';
import LoginAttempt from '../models/LoginAttempt.js';
import { extractDeviceDetails, extractBrowser, extractOS, isIPAllowed, normalizeIP } from '../helper/deviceLocationHelpers.js';

async function enforceCounsellorRestrictions(userId, userRole, req) {
  const counsellorRoles = ['l2', 'l3', 'to', 'enrollment_counsellor', 'admission_to'];
  if (!userRole || !counsellorRoles.includes(userRole)) {
    return null;
  }

  if (!userId) return null;

  try {
    const counsellor = await Counsellor.findByPk(userId);
    if (!counsellor) {
      console.warn(`[Middleware] Counsellor not found by ID: ${userId}`);
      return null;
    }

    if (counsellor.is_blocked) {
      return 'Account is blocked. Please contact administrator.';
    }

    const now = new Date();
    if (counsellor.login_start_time && counsellor.login_end_time) {
      const currentTimeStr = now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour12: false
      });

      if (currentTimeStr < counsellor.login_start_time) {
        return 'Login not allowed before ' + counsellor.login_start_time;
      }

      if (currentTimeStr > counsellor.login_end_time) {
        await Counsellor.update({ is_logout: true }, { where: { counsellor_id: userId } });
        return 'Login window has closed';
      }
    }

    const finalIp = normalizeIP((req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || '').split(',')[0].trim());

    // IP whitelist check
    let allowedIps = counsellor.allowed_ips;
    if (allowedIps && !Array.isArray(allowedIps)) {
      try {
        allowedIps = typeof allowedIps === 'string' ? JSON.parse(allowedIps) : [allowedIps];
      } catch (e) {
        allowedIps = [allowedIps];
      }
    }

    if (Array.isArray(allowedIps) && allowedIps.length > 0) {
      if (!isIPAllowed(finalIp, allowedIps)) {
        console.warn(`[Middleware Blocked] IP Not Allowed: ${finalIp}`);
        await LoginAttempt.create({
          user_type: 'counsellor',
          user_id: counsellor.counsellor_id,
          user_name: counsellor.counsellor_name,
          success: false,
          ip_address: finalIp,
          meta: { reason: 'ip_not_allowed_middleware', allowed: allowedIps, user_agent: req.headers['user-agent'] }
        }).catch(() => { });
        return 'IP address not permitted';
      }
    }

    // Device whitelist check
    let devices = counsellor.allowed_devices;
    if (devices && !Array.isArray(devices)) {
      try {
        devices = typeof devices === 'string' ? JSON.parse(devices) : [devices];
      } catch (e) {
        devices = [devices];
      }
    }

    if (Array.isArray(devices) && devices.length > 0) {
      const uaStr = req.headers['user-agent'] || '';
      const deviceId = req.headers['x-device-id'] || req.headers['device-id'] || req.headers['x-device-identifier'] || req.query.deviceId;

      const deviceDetails = extractDeviceDetails(uaStr);
      const currentDeviceType = deviceDetails.type.toLowerCase();
      const lowerWhitelist = devices.map(d => String(d).toLowerCase());

      const isAllowed = lowerWhitelist.includes(currentDeviceType) || (deviceId && lowerWhitelist.includes(String(deviceId).toLowerCase()));

      if (!isAllowed) {
        console.warn(`[Device Denied] User: ${counsellor.counsellor_name}, Detected: ${currentDeviceType}, Whitelist: ${lowerWhitelist}`);

        await LoginAttempt.create({
          user_type: 'counsellor',
          user_id: counsellor.counsellor_id,
          user_name: counsellor.counsellor_name,
          success: false,
          ip_address: finalIp,
          meta: {
            reason: 'device_not_allowed_middleware',
            detectedType: deviceDetails.type,
            vendor: deviceDetails.vendor,
            model: deviceDetails.model,
            browser: extractBrowser(uaStr),
            os: extractOS(uaStr),
            deviceId,
            allowed: devices,
            user_agent: uaStr
          }
        }).catch((e) => { console.error('LoginAttempt creation failed in middleware', e.message); });
        return 'Access not permitted from this device';
      }
    }
  } catch (err) {
    console.error('CRITICAL: enforceCounsellorRestrictions error:', err);
    return null;
  }

  return null;
}

export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const origin = req.headers.origin;
      const referer = req.headers.referer;
      const userAgent = req.headers['user-agent'] || '';

      // Block known API tools
      if (userAgent.includes('PostmanRuntime') || userAgent.includes('Insomnia')) {
        return res.status(403).json({ message: 'API access via tools is prohibited' });
      }

      // Block direct browser hits (missing origin)
      if (!origin) {
        const isLocalReferer = referer && referer.includes('localhost');
        if (!isLocalReferer) {
          return res.status(403).json({ message: 'Forbidden: Direct API access is prohibited.' });
        }
      }

      const token = req.cookies.token;
      if (!token) return res.status(401).json({ message: 'Unauthorized' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret123');
      req.user = decoded;
      const userRole = String(decoded.role).trim().toLowerCase();
      const normalizedAllowedRoles = allowedRoles.map(r => r.toLowerCase());

      if (!normalizedAllowedRoles.includes(userRole)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Force logout / max session check
      const checkSessionUser = await Counsellor.findByPk(decoded.id, { attributes: ['active_session_tokens'] });
      if (checkSessionUser && checkSessionUser.active_session_tokens) {
        let activeTokens = checkSessionUser.active_session_tokens;
        if (typeof activeTokens === 'string') {
          try { activeTokens = JSON.parse(activeTokens); } catch (e) { activeTokens = []; }
        }

        if (Array.isArray(activeTokens) && activeTokens.length > 0 && !activeTokens.includes(token)) {
          res.clearCookie('token');
          return res.status(401).json({ message: 'Session expired. You were logged in from another device.' });
        }
      }

      // Counsellor-specific restrictions (IP, device, time window)
      const restrictionMessage = await enforceCounsellorRestrictions(decoded.id, userRole, req);
      if (restrictionMessage) {
        if (restrictionMessage === 'Login window has closed') {
          res.clearCookie('token');
        }
        return res.status(403).json({ message: restrictionMessage });
      }

      next();
    } catch (err) {
      console.error("Auth error:", err.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};
