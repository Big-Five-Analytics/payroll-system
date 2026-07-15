const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { AuditLog, User } = require('../models');

const listAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, action, entityType } = req.query;
  const offset = (page - 1) * limit;
  const where = {};
  if (action) where.action = action;
  if (entityType) where.entityType = entityType;

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
  });

  ApiResponse.send(
    res,
    200,
    { logs: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) },
    'Audit logs retrieved'
  );
});

module.exports = { listAuditLogs };
