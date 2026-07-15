const { body, param, query } = require('express-validator');

const generatePayrollValidator = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('A valid year is required'),
  body('employeeIds')
    .optional()
    .isArray()
    .withMessage('employeeIds must be an array of employee UUIDs'),
];

const payrollQueryValidator = [
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2000, max: 2100 }),
  query('status').optional().isIn(['draft', 'processed', 'approved', 'paid']),
];

const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

module.exports = { generatePayrollValidator, payrollQueryValidator, idParamValidator };
