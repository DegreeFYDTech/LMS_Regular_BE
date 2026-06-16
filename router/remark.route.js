import express from 'express';

import { authorize } from '../middlewares/authMiddleware.js';
import { getRemarkByStudentId, getAllRemarksofData, getAnalysisReportSQL, getAnalysisReportDrillDown, downloadAnalysisReport, getConnectedCallsAnalysis, getConnectedCallsDrillDown, bulkCreateStudentRemarks } from '../controllers/remark.controller.js';


const router = express.Router();
router.get('/getallRemarksToExcel', getAllRemarksofData);
router.get('/getAnalysisReport', authorize(['supervisor', 'Supervisor', 'to', "analyser", "to_l3"]), getAnalysisReportSQL);
router.get('/analysis-report-drilldown', authorize(['supervisor', 'Supervisor', 'to', "analyser", "to_l3"]), getAnalysisReportDrillDown);
router.get('/downloadAnalysisReport', downloadAnalysisReport);
router.get('/connected-calls', authorize(['supervisor', 'Supervisor', 'to', "analyser", "to_l3"]), getConnectedCallsAnalysis);
router.get('/connected-calls-drilldown', authorize(['supervisor', 'Supervisor', 'to', "analyser", "to_l3"]), getConnectedCallsDrillDown);

router.get('/:studentId', getRemarkByStudentId)
router.post('/bulkCreateStudentRemarks', bulkCreateStudentRemarks)

export default router;
