const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { registerUserValidator } = require('../validators/authValidator');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/', userController.listUsers);
router.get('/roles', userController.listRoles);
router.post('/', registerUserValidator, validate, userController.createUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/deactivate', userController.deactivateUser);
router.patch('/:id/reactivate', userController.reactivateUser);

module.exports = router;
