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

router.get('/', employeeController.listEmployees);
router.get('/:id', idParamValidator, validate, employeeController.getEmployee);

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
