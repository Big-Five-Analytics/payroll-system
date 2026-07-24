const { body, param, query } = require('express-validator');
const { LEAVE_TYPES } = require('../config/constants');

const applyLeaveValidator = [
  body('leaveType').isIn(LEAVE_TYPES).withMessage(`Leave type must be one of: ${LEAVE_TYPES.join(', ')}`),
  body('startDate').isISO8601().withMessage('A valid start date is required'),
  body('endDate').isISO8601().withMessage('A valid end date is required'),
  body('reason').trim().notEmpty().withMessage('A reason is required'),
];

const reviewLeaveValidator = [
  param('id').isUUID().withMessage('Invalid leave application id'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reviewComment').optional({ checkFalsy: true }).isString().isLength({ max: 500 }),
];

const listLeaveQueryValidator = [
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
];

const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

module.exports = { applyLeaveValidator, reviewLeaveValidator, listLeaveQueryValidator, idParamValidator };
