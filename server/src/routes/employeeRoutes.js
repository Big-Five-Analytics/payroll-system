const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  createEmployeeValidator,
  updateEmployeeValidator,
  idParamValidator,
} = require('../validators/employeeValidator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Full employee directory browsing is a staff function - not exposed to Employee-role
// self-service accounts (they get their own record via GET /employees/me instead).
router.get('/without-account', authorize(ROLES.ADMIN), employeeController.listEmployeesWithoutAccount);
router.get('/terminated', authorize(ROLES.ADMIN, ROLES.HR), employeeController.listTerminatedEmployees);
router.get('/', authorize(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), employeeController.listEmployees);
router.get('/:id', authorize(ROLES.ADMIN, ROLES.HR, ROLES.FINANCE), idParamValidator, validate, employeeController.getEmployee);

router.post(
  '/',
  authorize(ROLES.ADMIN, ROLES.HR),
  createEmployeeValidator,
  validate,
  employeeController.createEmployee
);

router.put(
  '/:id',
  authorize(ROLES.ADMIN, ROLES.HR),
  updateEmployeeValidator,
  validate,
  employeeController.updateEmployee
);

router.delete('/:id', authorize(ROLES.ADMIN, ROLES.HR), idParamValidator, validate, employeeController.deleteEmployee);

router.post('/:id/allowances', authorize(ROLES.ADMIN, ROLES.HR), idParamValidator, validate, employeeController.setAllowance);
router.post('/:id/deductions', authorize(ROLES.ADMIN, ROLES.HR), idParamValidator, validate, employeeController.setDeduction);

module.exports = router;
