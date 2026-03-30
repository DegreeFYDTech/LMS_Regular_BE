import express from 'express';
import { 
  upsertCounsellor, 
  updateAssignment, 
  updateSettings, 
  syncPassword,
  getAllCounsellors,
  upsertSupervisor,
  getAllSupervisors,
  syncSupervisorPassword,
  updateCounsellorStatus,
  updateSupervisorStatus,
  deleteCounsellor,
  deleteSupervisor,
  upsertCourse,
  deleteCourse,
  getAllCourses
} from '../controllers/centralMgmtController.js';

const router = express.Router();



router.get('/all', getAllCounsellors);
router.post('/upsert', upsertCounsellor);
router.put('/status/:id', updateCounsellorStatus);
router.put('/assignment/:id', updateAssignment);
router.put('/settings/:id', updateSettings);
router.put('/password/:id', syncPassword);

router.get('/supervisors/all', getAllSupervisors);
router.post('/upsert-supervisor', upsertSupervisor);
router.put('/supervisor-status/:id', updateSupervisorStatus);
router.put('/supervisor-password/:id', syncSupervisorPassword);
router.delete('/counsellors/:id', deleteCounsellor);
router.delete('/supervisors/:id', deleteSupervisor);

router.post('/upsert-course', upsertCourse);
router.delete('/delete-course/:id', deleteCourse);
router.get('/courses/all', getAllCourses);

export default router;
