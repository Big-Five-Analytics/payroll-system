const { AuditLog } = require('../models');
const logger = require('../config/logger');

// Fire-and-forget audit trail writer. Never throws - a logging failure
// should never break the actual request.
const logAudit = async ({ userId, action, entityType, entityId, details, ipAddress }) => {
  try {
    await AuditLog.create({ userId, action, entityType, entityId, details, ipAddress });
  } catch (err) {
    logger.error('Failed to write audit log', { error: err.message });
  }
};

module.exports = { logAudit };
