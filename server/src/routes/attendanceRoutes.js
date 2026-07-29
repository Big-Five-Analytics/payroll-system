const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { listAttendanceQueryValidator, summaryQueryValidator } = require('../validators/attendanceValidator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Self-service - any account with a linked employee record (Employee role, or
// HR/Finance/Admin staff who are also employees).
router.post('/clock-in', attendanceController.clockIn);
router.post('/clock-out', attendanceController.clockOut);
router.get('/today', attendanceController.getTodayStatus);
router.get('/my', attendanceController.listMine);

// Staff-facing review
router.get('/summary', authorize(ROLES.ADMIN, ROLES.HR), summaryQueryValidator, validate, attendanceController.getSummary);
router.get('/', authorize(ROLES.ADMIN, ROLES.HR), listAttendanceQueryValidator, validate, attendanceController.listAll);

module.exports = router;
