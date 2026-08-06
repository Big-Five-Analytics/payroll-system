const { body, param, query } = require('express-validator');

const applyAdvanceValidator = [
  body('amountRequested').isFloat({ min: 0.01 }).withMessage('Amount requested must be a positive number'),
  body('reason').trim().notEmpty().withMessage('A reason is required'),
  body('repaymentPlan')
    .isIn(['full', 'two_months', 'three_months'])
    .withMessage('Please select a repayment plan'),
];

const reviewAdvanceValidator = [
  param('id').isUUID().withMessage('Invalid application id'),
  body('status').isIn(['approved', 'rejected']).withMessage('Status must be approved or rejected'),
  body('reviewComment').optional({ checkFalsy: true }).isString().isLength({ max: 500 }),
];

const listAdvanceQueryValidator = [
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
];

const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

module.exports = { applyAdvanceValidator, reviewAdvanceValidator, listAdvanceQueryValidator, idParamValidator };
