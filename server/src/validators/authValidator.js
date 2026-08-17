const { body } = require('express-validator');

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const registerUserValidator = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('roleId').isUUID().withMessage('A valid role is required'),
  body('employeeId').optional({ checkFalsy: true }).isUUID().withMessage('Invalid employee reference'),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('New password must contain at least one number'),
];

const forgotPasswordValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
];

module.exports = { loginValidator, registerUserValidator, changePasswordValidator, forgotPasswordValidator };
