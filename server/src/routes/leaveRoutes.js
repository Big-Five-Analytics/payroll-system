const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  applyLeaveValidator,
  reviewLeaveValidator,
  listLeaveQueryValidator,
} = require('../validators/leaveValidator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Self-service: any account linked to an employee record can apply for their own leave -
// HR Officers, Finance Officers, and Admins are employees too. The controller enforces
// req.user.employeeId is actually set (403 if this account has no linked employee).
router.post('/', applyLeaveValidator, validate, leaveController.apply);
router.get('/my', leaveController.listMine);

router.get('/', authorize(ROLES.ADMIN, ROLES.HR), listLeaveQueryValidator, validate, leaveController.listAll);
router.patch('/:id/review', authorize(ROLES.ADMIN, ROLES.HR), reviewLeaveValidator, validate, leaveController.review);

module.exports = router;
