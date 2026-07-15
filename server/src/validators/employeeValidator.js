const { body, param } = require('express-validator');

const createEmployeeValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('nationalId').trim().notEmpty().withMessage('National ID is required'),
  body('departmentId').isUUID().withMessage('A valid department is required'),
  body('jobTitle').trim().notEmpty().withMessage('Job title is required'),
  body('dateOfHire').isISO8601().withMessage('A valid hire date is required'),
  body('basicSalary').isFloat({ min: 0 }).withMessage('Basic salary must be a positive number'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Invalid phone number'),
];

const updateEmployeeValidator = [
  param('id').isUUID().withMessage('Invalid employee id'),
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('basicSalary').optional().isFloat({ min: 0 }).withMessage('Basic salary must be a positive number'),
  body('status').optional().isIn(['active', 'suspended', 'terminated']).withMessage('Invalid status'),
];

const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

module.exports = { createEmployeeValidator, updateEmployeeValidator, idParamValidator };
