const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.get('/', departmentController.listDepartments);
router.post('/', authorize(ROLES.ADMIN, ROLES.HR), departmentController.createDepartment);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.HR), departmentController.updateDepartment);
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.HR), departmentController.deleteDepartment);

module.exports = router;
