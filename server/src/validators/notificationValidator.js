const { param } = require('express-validator');

const idParamValidator = [param('id').isUUID().withMessage('Invalid notification id')];

module.exports = { idParamValidator };
