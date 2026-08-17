const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { loginValidator, changePasswordValidator, forgotPasswordValidator } = require('../validators/authValidator');

router.post('/login', loginValidator, validate, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, changePasswordValidator, validate, authController.changePassword);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);

module.exports = router;
