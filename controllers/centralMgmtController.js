import { Counsellor, Supervisor, UniversityCourse } from '../models/index.js';
import bcrypt from 'bcryptjs';

/**
 * Register or update a counsellor from Central Manager
 */
export const upsertCounsellor = async (req, res) => {
  try {
    const { 
      counsellor_id, 
      counsellor_name, 
      counsellor_email, 
      counsellor_password, 
      counsellor_real_password, 
      role, 
      status, 
      counsellor_preferred_mode, 
      is_partner,
      assigned_to, // Team Owner / Supervisor ID
      ...extraSettings 
    } = req.body;

    if (!counsellor_id || !counsellor_email) {
      return res.status(400).json({ message: 'Missing required field: counsellor_id or counsellor_email' });
    }

    const hashedPassword = counsellor_password ? await bcrypt.hash(counsellor_password, 10) : undefined;

    const [counsellor, created] = await Counsellor.findOrCreate({
      where: { counsellor_id },
      defaults: {
        counsellor_name,
        counsellor_email,
        counsellor_password: hashedPassword,
        counsellor_real_password: counsellor_real_password || counsellor_password,
        role,
        status: status || 'active',
        counsellor_preferred_mode: counsellor_preferred_mode || 'Regular',
        is_partner: is_partner || false,
        assigned_to: assigned_to || null,
        ...extraSettings
      }
    });

    if (!created) {
      // Update existing
      const updates = {
        counsellor_name,
        counsellor_email,
        role,
        status,
        counsellor_preferred_mode,
        is_partner,
        assigned_to,
        ...extraSettings
      };
      
      if (hashedPassword) {
        updates.counsellor_password = hashedPassword;
        updates.counsellor_real_password = counsellor_real_password || counsellor_password;
      }

      await counsellor.update(updates);
    }

    res.status(200).json({ 
      message: created ? 'Counsellor created successfully' : 'Counsellor updated successfully',
      counsellor_id: counsellor.counsellor_id 
    });
  } catch (err) {
    console.error('Central Upsert error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Update assignment (Team Owner) specifically
 */
export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { assigned_to } = req.body;

    const counsellor = await Counsellor.findByPk(id);
    if (!counsellor) return res.status(404).json({ message: 'Counsellor not found' });

    await counsellor.update({ assigned_to });
    res.status(200).json({ message: 'Assignment updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Update settings (IPs, Windows, etc.)
 */
export const updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;

    const counsellor = await Counsellor.findByPk(id);
    if (!counsellor) return res.status(404).json({ message: 'Counsellor not found' });

    await counsellor.update(settings);
    res.status(200).json({ message: 'Settings updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const syncPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) return res.status(400).json({ message: 'Password is required' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const counsellor = await Counsellor.findByPk(id);
    if (!counsellor) return res.status(404).json({ message: 'Counsellor not found' });

    await counsellor.update({
      counsellor_password: hashedPassword,
      counsellor_real_password: password
    });

    res.status(200).json({ message: 'Password synced successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/**
 * Update counsellor status from central manager
 */
export const updateCounsellorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const counsellor = await Counsellor.findByPk(id);
    if (!counsellor) return res.status(404).json({ message: 'Counsellor not found' });

    await counsellor.update({ status: status || 'active' });
    res.status(200).json({ message: 'Counsellor status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const getAllCounsellors = async (req, res) => {
  try {
    const counsellors = await Counsellor.findAll({
      attributes: { exclude: ['active_session_tokens'] }
    });
    res.json(counsellors);
  } catch (err) {
    console.error('Central GetAll error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Register or update a supervisor from Central Manager
 */
export const upsertSupervisor = async (req, res) => {
  try {
    const { 
      supervisor_id, 
      supervisor_name, 
      supervisor_email, 
      supervisor_password, 
      supervisor_real_password, 
      status 
    } = req.body;

    if (!supervisor_id || !supervisor_email) {
      return res.status(400).json({ message: 'Missing required field: supervisor_id or supervisor_email' });
    }

    const hashedPassword = supervisor_password ? await bcrypt.hash(supervisor_password, 10) : undefined;

    const [supervisor, created] = await Supervisor.findOrCreate({
      where: { supervisor_id },
      defaults: {
        supervisor_name,
        supervisor_email,
        supervisor_password: hashedPassword,
        supervisor_real_password: supervisor_real_password || supervisor_password,
        status: status || 'active'
      }
    });

    if (!created) {
      const updates = { supervisor_name, supervisor_email, status };
      if (hashedPassword) {
        updates.supervisor_password = hashedPassword;
        updates.supervisor_real_password = supervisor_real_password || supervisor_password;
      }
      await supervisor.update(updates);
    }

    res.status(200).json({ message: created ? 'Supervisor created' : 'Supervisor updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Get all supervisors for migration
 */
export const getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.findAll();
    res.json(supervisors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Sync supervisor password
 */
export const syncSupervisorPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const supervisor = await Supervisor.findByPk(id);
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found' });

    await supervisor.update({
      supervisor_password: hashedPassword,
      supervisor_real_password: password
    });
    res.status(200).json({ message: 'Supervisor password synced' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/**
 * Update supervisor status from central manager
 */
export const updateSupervisorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const supervisor = await Supervisor.findByPk(id);
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found' });

    await supervisor.update({ status: status || 'active' });
    res.status(200).json({ message: 'Supervisor status updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Register or update a university course from Central Manager
 */
export const upsertCourse = async (req, res) => {
  try {
    const courseData = req.body;
    if (!courseData.course_id) {
      return res.status(400).json({ message: 'Missing course_id' });
    }

    const [course, created] = await UniversityCourse.upsert(courseData);
    res.status(200).json({ 
      message: created ? 'Course created' : 'Course updated',
      course_id: course.course_id 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

/**
 * Delete a university course from the local LMS
 */
export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await UniversityCourse.destroy({ where: { course_id: id } });
    
    if (deletedCount === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const deleteCounsellor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await Counsellor.destroy({ where: { counsellor_id: id } });
    if (deletedCount === 0) return res.status(404).json({ message: 'Counsellor not found' });
    res.status(200).json({ message: 'Counsellor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


export const deleteSupervisor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await Supervisor.destroy({ where: { supervisor_id: id } });
    if (deletedCount === 0) return res.status(404).json({ message: 'Supervisor not found' });
    res.status(200).json({ message: 'Supervisor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};


/**
 * Get all courses for central migration
 */
export const getAllCourses = async (req, res) => {
  try {
    const courses = await UniversityCourse.findAll();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
