const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.ADMIN, ROLES.FINANCE, ROLES.HR));

router.get('/monthly-summary', reportController.monthlySummary);
router.get('/employee/:employeeId/history', reportController.employeeHistory);
router.get('/export/csv', reportController.exportCsv);

// Contains bank account numbers - narrower than the general HR/Finance/Admin access above.
router.get('/export/bank-file', authorize(ROLES.ADMIN, ROLES.FINANCE), reportController.exportBankFile);

module.exports = router;
