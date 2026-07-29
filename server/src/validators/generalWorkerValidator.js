const { body, param } = require('express-validator');

const createGeneralWorkerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('site').trim().notEmpty().withMessage('Site is required'),
  body('nationalId').optional({ checkFalsy: true }).trim(),
  body('workerNumber').optional({ checkFalsy: true }).trim(),
  body('jobTitle').optional({ checkFalsy: true }).trim(),
  body('payRate').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Pay rate must be a positive number'),
  body('payRateType').optional({ checkFalsy: true }).isIn(['daily', 'monthly']).withMessage('Invalid pay rate type'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  body('contractStartDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract start date'),
  body('contractEndDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract end date'),
  body('leaveBalance').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Leave balance must be a positive number'),
];

const updateGeneralWorkerValidator = [
  param('id').isUUID().withMessage('Invalid worker id'),
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('site').optional().trim().notEmpty().withMessage('Site cannot be empty'),
  body('payRate').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Pay rate must be a positive number'),
  body('payRateType').optional({ checkFalsy: true }).isIn(['daily', 'monthly']).withMessage('Invalid pay rate type'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone('any').withMessage('Invalid phone number'),
  body('contractStartDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract start date'),
  body('contractEndDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract end date'),
  body('leaveBalance').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Leave balance must be a positive number'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
];

const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

const uploadPreviewValidator = [body('site').trim().notEmpty().withMessage('Site is required')];

const uploadCommitValidator = [
  body('site').trim().notEmpty().withMessage('Site is required'),
  body('mapping').isObject().withMessage('Column mapping is required'),
  body('mapping.fullName').notEmpty().withMessage('Full name must be mapped to a column'),
  body('rows').isArray({ min: 1 }).withMessage('At least one row is required'),
  body('rows').custom((rows) => {
    if (rows.length > 5000) {
      throw new Error('A single upload cannot contain more than 5000 rows');
    }
    return true;
  }),
];

module.exports = {
  createGeneralWorkerValidator,
  updateGeneralWorkerValidator,
  idParamValidator,
  uploadPreviewValidator,
  uploadCommitValidator,
};
