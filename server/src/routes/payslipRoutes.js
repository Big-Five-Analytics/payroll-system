const express = require('express');
const router = express.Router();
const payslipController = require('../controllers/payslipController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.post('/generate/:payrollId', authorize(ROLES.ADMIN, ROLES.FINANCE), payslipController.generatePayslip);

// Self-service: the logged-in account's own paid payslips (works for any role that has
// a linked employee record - HR/Finance/Admin are employees too, not just the Employee role)
router.get('/my', payslipController.listMine);

// Staff-facing: look up any employee's payslips
router.get('/employee/:employeeId', authorize(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), payslipController.listForEmployee);

// Ownership/paid-status is enforced inside the controller so Employee-role
// accounts can reach these two for their own paid payslips.
router.get('/:id', payslipController.getPayslip);
router.get('/:id/download', payslipController.downloadPayslip);

module.exports = router;
