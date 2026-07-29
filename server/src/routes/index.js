const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/employees', require('./employeeRoutes'));
router.use('/departments', require('./departmentRoutes'));
router.use('/payroll', require('./payrollRoutes'));
router.use('/payslips', require('./payslipRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/dashboard', require('./dashboardRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/audit-logs', require('./auditLogRoutes'));
router.use('/leave', require('./leaveRoutes'));
router.use('/salary-advances', require('./salaryAdvanceRoutes'));
router.use('/attendance', require('./attendanceRoutes'));
router.use('/office-networks', require('./officeNetworkRoutes'));
router.use('/general-workers', require('./generalWorkerRoutes'));

module.exports = router;
