import axios from 'axios';
import { UniversityCourse, CourseStatusHistory, CourseStatus, Student,Counsellor } from '../models/index.js';
import { assignedtoL3byruleSet } from './leadassignmentl3.controller.js';
import { Op,Sequelize } from 'sequelize';

export const createStatusLog = async (req, res) => {
  try {
    const {
      studentId,
      status,
      collegeName,
      courseName,
      notes,
      examInterviewDate,
      lastAdmissionDate,
      depositAmount = 0,
    } = req.body;
    const { courseId } = req.params;
    const userId = req.user?.id || req.user?.supervisorId || null;

    const courseDetails = await UniversityCourse.findOne({
      where: { course_id: courseId }
    });

    if (!courseDetails) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const log = await CourseStatusHistory.create({
      student_id: studentId,
      course_id: courseId,
      counsellor_id: userId,
      course_status: status,
      deposit_amount: depositAmount,
      currency: 'INR',
      exam_interview_date: examInterviewDate ? new Date(examInterviewDate) : null,
      last_admission_date: lastAdmissionDate ? new Date(lastAdmissionDate) : null,
      notes: notes,
      timestamp: new Date()
    });
    console.log("status", status)
    if (status == "Form Submitted – Portal Pending" || status == "Form Submitted – Completed" || status == "Walkin Completed" || status == "Exam Interview Pending" || status == "Offer Letter/Results Pending" || status == "Offer Letter/Results Released") {
      const l3data = await axios.post('http://localhost:3031/v1/leadassignmentl3/assign', {
        studentId,
        collegeName: courseDetails.university_name,
        Course: courseDetails.course_name,
        Degree: courseDetails.degree_name,
        Specialization: courseDetails.specialization,
        level: courseDetails.level,
        source: courseDetails.level,
        stream: courseDetails.stream
      })
      await Student.update({ first_form_filled_date: new Date() }, { where: { student_id: studentId, first_form_filled_date: null } })
    }


    res.status(201).json({
      message: 'Status log created successfully',
      logId: log.status_history_id
    });
    const updated = await CourseStatus.update({ latest_course_status: status }, { where: { course_id: courseId, student_id: studentId } })

  } catch (error) {
    console.error('Error creating status log:', error.message);
    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};





export const getCollegeStatusReports = async (req, res) => {
  try {
    const { 
      reportType = 'colleges',
      startDate, 
      endDate, 
      collegeId,
    } = req.query;
    
    const whereClause = {};
    const courseWhereClause = {};
    
    if (startDate || endDate) {
      whereClause.created_at = {};
      if (startDate) whereClause.created_at[Op.gte] = new Date(startDate);
      if (endDate) whereClause.created_at[Op.lte] = new Date(endDate);
    }
    
    if (collegeId) {
      courseWhereClause.course_id = collegeId;
    }

    let result;
    
    switch(reportType) {
      case 'colleges':
        result = await getCollegesPivotReport(whereClause, courseWhereClause);
        break;
        
      case 'l2':
        result = await getCounsellorPivotReport(whereClause, courseWhereClause, 'l2');
        break;
        
      case 'l3':
        result = await getCounsellorPivotReport(whereClause, courseWhereClause, 'l3');
        break;
        
      default:
        result = await getCollegesPivotReport(whereClause, courseWhereClause);
    }

    res.status(200).json({
      success: true,
      reportType,
      data: result,
      filters: {
        startDate,
        endDate,
        collegeId
      }
    });

  } catch (error) {
    console.error('Error in getCollegeStatusReports:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating reports',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getCollegesPivotReport = async (whereClause, courseWhereClause) => {
  const statusesResult = await CourseStatusHistory.findAll({
    where: whereClause,
    include: [{
      model: UniversityCourse,
      as: 'university_course',
      required: true,
      where: courseWhereClause,
      attributes: []
    }],
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('course_status')), 'status']
    ],
    raw: true
  });

  const statuses = statusesResult.map(item => item.status).filter(Boolean);
  
  const collegeData = await CourseStatusHistory.findAll({
    where: whereClause,
    include: [{
      model: UniversityCourse,
      as: 'university_course',
      required: true,
      attributes: [],
      where: courseWhereClause
    }],
    attributes: [
      [Sequelize.col('university_course.university_name'), 'college'],
      [Sequelize.col('course_status'), 'status'],
      [Sequelize.fn('COUNT', Sequelize.col('*')), 'count']
    ],
    group: [Sequelize.col('university_course.university_name'), Sequelize.col('course_status')],
    order: [[Sequelize.col('university_course.university_name'), 'ASC']],
    raw: true
  });

  const pivotData = {};
  const collegeTotals = {};
  const statusTotals = {};
  
  statuses.forEach(status => {
    statusTotals[status] = 0;
  });

  collegeData.forEach(item => {
    const college = item.college;
    const status = item.status;
    const count = parseInt(item.count) || 0;
    
    if (!pivotData[college]) {
      pivotData[college] = {
        college: college,
        total: 0
      };
      collegeTotals[college] = 0;
      
      statuses.forEach(status => {
        pivotData[college][status] = 0;
      });
    }
    
    if (status && pivotData[college].hasOwnProperty(status)) {
      pivotData[college][status] = count;
      pivotData[college].total += count;
      collegeTotals[college] += count;
      statusTotals[status] = (statusTotals[status] || 0) + count;
    }
  });

  const grandTotal = Object.values(collegeTotals).reduce((sum, total) => sum + total, 0);

  return {
    view: 'colleges-pivot',
    rows: Object.values(pivotData),
    columns: ['college', ...statuses, 'total'],
    statuses: statuses,
    totals: {
      statusTotals,
      grandTotal
    }
  };
};

const getCounsellorPivotReport = async (whereClause, courseWhereClause, level) => {
  // First, let's debug and see what data we have
  console.log(`Getting ${level} counsellor report with filters:`, whereClause);
  
  // Get counsellors based on role (assuming 'role' field contains 'l2' or 'l3')
  const counsellorWhereClause = {};
  if (level === 'l2' || level === 'l3') {
    counsellorWhereClause.role = { [Op.iLike]: `%${level}%` };
  }
  
  // Get all unique statuses for counsellors with this role
  const statusesResult = await CourseStatusHistory.findAll({
    where: whereClause,
    include: [
      {
        model: UniversityCourse,
        as: 'university_course',
        required: true,
        where: courseWhereClause,
        attributes: []
      },
      {
        model: Counsellor,
        as: 'counsellor',
        required: true,
        where: counsellorWhereClause,
        attributes: []
      }
    ],
    attributes: [
      [Sequelize.fn('DISTINCT', Sequelize.col('course_status')), 'status']
    ],
    raw: true
  });

  const statuses = statusesResult.map(item => item.status).filter(Boolean);
  console.log(`Found ${statuses.length} unique statuses for ${level}:`, statuses);
  
  // Get counsellor-wise status counts
  const counsellorData = await CourseStatusHistory.findAll({
    where: whereClause,
    include: [
      {
        model: UniversityCourse,
        as: 'university_course',
        required: true,
        where: courseWhereClause,
        attributes: []
      },
      {
        model: Counsellor,
        as: 'counsellor',
        required: true,
        where: counsellorWhereClause,
        attributes: ['counsellor_name']
      }
    ],
    attributes: [
      [Sequelize.col('counsellor.counsellor_name'), 'counsellor'],
      [Sequelize.col('course_status'), 'status'],
      [Sequelize.fn('COUNT', Sequelize.col('*')), 'count']
    ],
    group: [Sequelize.col('counsellor.counsellor_name'), Sequelize.col('course_status')],
    order: [[Sequelize.col('counsellor.counsellor_name'), 'ASC']],
    raw: true
  });

  console.log(`Found ${counsellorData.length} counsellor data records for ${level}`);
  
  const pivotData = {};
  const counsellorTotals = {};
  const statusTotals = {};
  
  statuses.forEach(status => {
    statusTotals[status] = 0;
  });

  counsellorData.forEach(item => {
    const counsellor = item.counsellor;
    const status = item.status;
    const count = parseInt(item.count) || 0;
    
    if (!pivotData[counsellor]) {
      pivotData[counsellor] = {
        counsellor: counsellor,
        total: 0
      };
      counsellorTotals[counsellor] = 0;
      
      statuses.forEach(status => {
        pivotData[counsellor][status] = 0;
      });
    }
    
    if (status && pivotData[counsellor].hasOwnProperty(status)) {
      pivotData[counsellor][status] = count;
      pivotData[counsellor].total += count;
      counsellorTotals[counsellor] += count;
      statusTotals[status] = (statusTotals[status] || 0) + count;
    }
  });

  const grandTotal = Object.values(counsellorTotals).reduce((sum, total) => sum + total, 0);
  console.log(`Processed ${Object.keys(pivotData).length} counsellors for ${level}, grand total: ${grandTotal}`);

  return {
    view: `${level}-pivot`,
    rows: Object.values(pivotData),
    columns: ['counsellor', ...statuses, 'total'],
    statuses: statuses,
    level: level,
    totals: {
      statusTotals,
      grandTotal
    }
  };
};

export const getCollegesList = async (req, res) => {
  try {
    const colleges = await UniversityCourse.findAll({
      attributes: [
        'course_id',
        'university_name',
        'level'
      ],
      group: ['course_id', 'university_name', 'level'],
      order: [['university_name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: colleges
    });
  } catch (error) {
    console.error('Error fetching colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching colleges list'
    });
  }
};