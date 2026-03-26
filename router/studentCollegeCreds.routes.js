import express from 'express';
import {
  createStudentCollegeCreds,
  getStudentCredsByCourseAndStudent,
  getStudentCredsByStudentId, getCollegeCredsForReport, downloadCollegeCredsForReport
} from '../controllers/studentCollegeCreds.controller.js';
import { authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/getCollegeCredsForReport', getCollegeCredsForReport);
router.get('/downloadCollegeCredsForReport', downloadCollegeCredsForReport);
router.post('/', authorize(["l2", "l3", "Supervisor", 'to', 'to_l3']), createStudentCollegeCreds);
router.get('/', authorize(["l2", "l3", "Supervisor", 'to', 'to_l3']), getStudentCredsByCourseAndStudent); // GET with query params
router.get('/:studentId', authorize(["l2", "l3", "Supervisor", 'to', 'to_l3']), getStudentCredsByStudentId); // GET by studentId

export default router;
