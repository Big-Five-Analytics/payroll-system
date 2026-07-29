const { body, param } = require('express-validator');

const upsertOfficeNetworkValidator = [
  body('label').trim().notEmpty().withMessage('A label is required'),
  body('ipRange')
    .trim()
    .notEmpty()
    .withMessage('An IP address or CIDR range is required')
    .matches(/^[0-9a-fA-F:.]+(\/\d{1,3})?$/)
    .withMessage('Must be a valid IP address or CIDR range, e.g. 41.63.12.4 or 41.63.12.0/24'),
  body('isActive').optional().isBoolean(),
];

const idParamValidator = [param('id').isUUID().withMessage('Invalid id')];

module.exports = { upsertOfficeNetworkValidator, idParamValidator };
