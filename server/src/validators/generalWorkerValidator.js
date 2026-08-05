const { body, param } = require('express-validator');

// Monthly wage-bill snapshot fields (hours worked, overtime, allowances, total pay) -
// all optional, all non-negative numbers/integers. Shared between create and update.
const WAGE_BILL_INTEGER_FIELDS = ['daysWorkedWeekday', 'daysWorkedSaturday', 'daysWorkedSundayPH'];
const WAGE_BILL_DECIMAL_FIELDS = [
  'normalHoursWeekday', 'normalHoursSaturday', 'totalNormalHours', 'basicPay',
  'otHoursWeekday', 'otPayWeekday', 'otHoursSaturday', 'otPaySaturday',
  'otHoursSundayPH', 'otPaySundayPH', 'monthlyNormalHoursTarget',
  'housingAllowance', 'transportAllowance', 'totalPay',
];

const wageBillValidators = () => [
  ...WAGE_BILL_INTEGER_FIELDS.map((field) =>
    body(field).optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage(`${field} must be a positive integer`)
  ),
  ...WAGE_BILL_DECIMAL_FIELDS.map((field) =>
    body(field).optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage(`${field} must be a positive number`)
  ),
  body('wageBillMonth').optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }).withMessage('Invalid wage bill month'),
  body('wageBillYear').optional({ checkFalsy: true }).isInt({ min: 2000 }).withMessage('Invalid wage bill year'),
];

const createGeneralWorkerValidator = [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('site').trim().notEmpty().withMessage('Site is required'),
  body('jobTitle').optional({ checkFalsy: true }).trim(),
  body('payRate').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Pay rate must be a positive number'),
  body('payRateType').optional({ checkFalsy: true }).isIn(['hourly', 'daily', 'monthly']).withMessage('Invalid pay rate type'),
  body('contractStartDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract start date'),
  body('contractEndDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract end date'),
  body('leaveBalance').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Leave balance must be a positive number'),
  ...wageBillValidators(),
];

const updateGeneralWorkerValidator = [
  param('id').isUUID().withMessage('Invalid worker id'),
  body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
  body('site').optional().trim().notEmpty().withMessage('Site cannot be empty'),
  body('payRate').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Pay rate must be a positive number'),
  body('payRateType').optional({ checkFalsy: true }).isIn(['hourly', 'daily', 'monthly']).withMessage('Invalid pay rate type'),
  body('contractStartDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract start date'),
  body('contractEndDate').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid contract end date'),
  body('leaveBalance').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Leave balance must be a positive number'),
  body('status').optional().isIn(['active', 'inactive']).withMessage('Invalid status'),
  ...wageBillValidators(),
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
  body('wageBillMonth').optional({ checkFalsy: true }).isInt({ min: 1, max: 12 }).withMessage('Invalid wage bill month'),
  body('wageBillYear').optional({ checkFalsy: true }).isInt({ min: 2000 }).withMessage('Invalid wage bill year'),
];

module.exports = {
  createGeneralWorkerValidator,
  updateGeneralWorkerValidator,
  idParamValidator,
  uploadPreviewValidator,
  uploadCommitValidator,
};
