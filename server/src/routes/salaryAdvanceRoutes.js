const express = require('express');
const router = express.Router();
const salaryAdvanceController = require('../controllers/salaryAdvanceController');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  applyAdvanceValidator,
  reviewAdvanceValidator,
  listAdvanceQueryValidator,
} = require('../validators/salaryAdvanceValidator');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Self-service: any account linked to an employee record can request their own advance -
// HR Officers, Finance Officers, and Admins are employees too.
router.post('/', applyAdvanceValidator, validate, salaryAdvanceController.apply);
router.get('/my', salaryAdvanceController.listMine);

router.get('/', authorize(ROLES.ADMIN, ROLES.FINANCE), listAdvanceQueryValidator, validate, salaryAdvanceController.listAll);
router.patch('/:id/review', authorize(ROLES.ADMIN, ROLES.FINANCE), reviewAdvanceValidator, validate, salaryAdvanceController.review);

module.exports = router;
