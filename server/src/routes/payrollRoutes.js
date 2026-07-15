const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  generatePayrollValidator,
  payrollQueryValidator,
  idParamValidator,
} = require('../validators/payrollValidator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.get('/', payrollQueryValidator, validate, payrollController.listPayrolls);
router.get('/:id', idParamValidator, validate, payrollController.getPayroll);

router.post(
  '/generate',
  authorize(ROLES.ADMIN, ROLES.FINANCE),
  generatePayrollValidator,
  validate,
  payrollController.generatePayroll
);

router.patch('/:id/approve', authorize(ROLES.ADMIN, ROLES.FINANCE), idParamValidator, validate, payrollController.approvePayroll);
router.patch('/:id/mark-paid', authorize(ROLES.ADMIN, ROLES.FINANCE), idParamValidator, validate, payrollController.markPaid);

module.exports = router;
