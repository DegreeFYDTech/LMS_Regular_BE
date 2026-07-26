import express from 'express';
import { authorize } from '../middlewares/authMiddleware.js';
import { getCollegeStatus, getShortlistedColleges, updateStudentCourseStatus, getTrackReport, getTrackReportDrillDown, getTrackerReport2, downloadRecordsForView, getThreeRecordsOfFormFilled, debugCounsellorAttribution, getRecordsForAnalysis, getRecordsForAnalysishelper, downloadRecordsForAnalysis, getLeadStatusApiReport, getLeadAttemptTimeReport, getTrackerReportAnalysis3, getNotInterestedAfterCounselingReport, bulkInsertCourseStatus, getFormFilledFilterOptions } from '../controllers/studentcoursestatus.controller.js';
import { getniReports } from '../controllers/student.controller.js';
import { getActiveFormCollegeReport } from '../controllers/ActiveFormReportController.js';
const router = express.Router();


router.post('/update', updateStudentCourseStatus);
router.get('/shortlisted/:studentId/full', authorize(["l2", "l3", "Supervisor", 'to', 'to_l3']), getShortlistedColleges);
router.get('/download', downloadRecordsForAnalysis);
router.get('/download-shorilist', downloadRecordsForView);
// Single endpoint — plain call for summary, ?bucket=...+drill_* for drilldown
router.get('/getrecords/form-filled', authorize(["Supervisor", 'to', 'analyser', 'to_l3']), getThreeRecordsOfFormFilled);
router.get('/getrecords/form-filled/drilldown', authorize(["Supervisor", 'to', 'analyser', 'to_l3']), getThreeRecordsOfFormFilled);
router.get('/debug-counsellor-attribution', debugCounsellorAttribution);
router.get('/getrecords/form-filled/filter-options', authorize(["Supervisor", 'to', 'analyser', 'to_l3']), getFormFilledFilterOptions);
router.get('/getRecordsForAnalysis', getRecordsForAnalysishelper)
router.get(
  '/getrecords/form-filled/download',
  authorize(["Supervisor", 'to', 'analyser', 'to_l3']),
  (req, res, next) => { req.query.mode = 'export'; next(); },
  getThreeRecordsOfFormFilled,
);
router.get('/:courseId/:studentId', authorize(["l2", "l3", "Supervisor", 'to', 'to_l3']), getCollegeStatus);
router.get('/getRecordsForAnalysis/:type', authorize(["l2", "l3", "Supervisor", 'to', 'to_l3']), getRecordsForAnalysis);
// Single endpoint — ?type=summary (default) | raw (drilldown)
router.get('/lead-status-report', getLeadStatusApiReport);
router.get('/track-report', getTrackReport);
router.get('/track-report-drilldown', getTrackReportDrillDown);
// Single endpoint — ?type=summary (default) | raw (drilldown) | export (raw dump)
router.get('/track-report-2', authorize(["l2", "l3", "Supervisor", 'to', 'analyser', 'to_l3']), getTrackerReport2);
router.get('/report3', getTrackerReportAnalysis3);
router.get('/not-interested-after-counseling', getNotInterestedAfterCounselingReport);
// Single endpoint — ?type=summary (default) | raw (drilldown) | export (raw dump)
router.get('/lead-attempt-report', authorize(["l2", "l3", "Supervisor", 'to', 'analyser', 'to_l3']), getLeadAttemptTimeReport);
router.get('/getnireports', getniReports)
router.post('/bulkcreate', bulkInsertCourseStatus)
router.get('/active-form-college-report', getActiveFormCollegeReport);

export default router;
