const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.ADMIN));
router.get('/', auditLogController.listAuditLogs);

module.exports = router;
