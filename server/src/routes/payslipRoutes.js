const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.post('/generate/:payrollId', authorize(ROLES.ADMIN, ROLES.FINANCE), payslipController.generatePayslip);
router.get('/:id', payslipController.getPayslip);
router.get('/:id/download', payslipController.downloadPayslip);
router.get('/employee/:employeeId', payslipController.listMyPayslips);

module.exports = router;
