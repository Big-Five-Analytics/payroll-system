const { query, param, body } = require('express-validator');

const listAttendanceQueryValidator = [
  query('employeeId').optional().isUUID(),
  query('departmentId').optional().isUUID(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

const summaryQueryValidator = [
  query('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  query('year').isInt({ min: 2000, max: 2100 }).withMessage('A valid year is required'),
];

module.exports = { listAttendanceQueryValidator, summaryQueryValidator };
