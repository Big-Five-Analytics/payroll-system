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

module.exports = router;
