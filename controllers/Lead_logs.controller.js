import {LeadAssignmentLogs} from '../models/index.js';

export const createLeadLog = async ({ studentId, assignedCounsellorId, assignedBy = 'Rulset Based' }) => {
  try {
    // Basic validation
    undefined
    if (!studentId || !assignedCounsellorId) {
      throw new Error('studentId and assignedCounsellorId are required.');
    }

    const newLeadLog = await LeadAssignmentLogs.create({
      student_id:studentId,
      assigned_counsellor_id:assignedCounsellorId,
      assigned_by:assignedBy,
      created_at:new Date()
    });
    // undefined
    return { success: true, data: newLeadLog };
  } catch (error) {
    return { success: false, message: error.message };
  }
};
