import express from 'express';
import {
  registerCounsellor,
  loginCounsellor,
  changePassword,
  logoutCounsellor,
  getUserDetails,
  getAllCounsellors,
  deleteCounsellor,
  updateCounsellorStatus,
  changeCounsellorPassword,
  updateCounsellorPreferredMode,
  getCounsellorById, assignCounsellorsToStudents,
  makeCounsellorLogout, start_Counsellors_break, end_Counsellors_break, activeBreak, getCounsellor_break_stats,
  changeSupervisor,
  getCounsellorAccessSettings,
  updateCounsellorAccessSettings,
  bulkUpdateCounsellorAccessSettings,
} from '../controllers/counsellor.controller.js';
import { authorize } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.get('/getAllCounsellors', authorize(['to', "Supervisor", 'to_l3']), getAllCounsellors);
router.get('/getUserDetails', authorize(["l2", "l3", 'to', 'to_l3']), getUserDetails);
router.get('/logoutCounsellor/:counsellor_id', authorize(["Supervisor"]), makeCounsellorLogout);
router.get('/getcounsellorByID/:counsellorId', getCounsellorById);
router.get('/get-latest-break/:counsellor_id', activeBreak);
router.get('/daily-counsellor-break-activities', authorize(['to', 'Supervisor', 'to_l3']), getCounsellor_break_stats)
router.post('/register', registerCounsellor);
router.post('/login', loginCounsellor);
router.put('/change-password/:id', authorize(["Supervisor", "to", 'to_l3']), changePassword);
router.post('/logout', authorize(["l2", "l3", "to", 'to_l3']), logoutCounsellor);
router.post('/break/start', start_Counsellors_break);
// -------------For Counsellor-------------------
// router.delete('/deleteCounsellor/:id', authorize(["Supervisor"]),activityLogger, deleteCounsellor);
router.put('/updateCounsellorStatus/:id', authorize(["Supervisor", "to", 'to_l3']), updateCounsellorStatus);
router.put('/changeCounsellorPassword/:id', authorize(["Supervisor", "to", 'to_l3']), changeCounsellorPassword);
router.put('/updateCounsellorPreferredMode/:id', authorize(["Supervisor", "to", 'to_l3']), updateCounsellorPreferredMode);
router.put('/assignCounsellors', authorize(["Supervisor", "to", 'to_l3']), assignCounsellorsToStudents);
router.put('/break/end', end_Counsellors_break)
router.put('/change-supervisor', authorize(["Supervisor", "to", 'to_l3']), changeSupervisor);
router.put('/access-settings/bulk', authorize(["Supervisor", "to", 'to_l3']), bulkUpdateCounsellorAccessSettings);
router.get('/access-settings/:id', authorize(["Supervisor", "to", 'to_l3']), getCounsellorAccessSettings);
router.put('/access-settings/:id', authorize(["Supervisor", "to", 'to_l3']), updateCounsellorAccessSettings);

export default router;
