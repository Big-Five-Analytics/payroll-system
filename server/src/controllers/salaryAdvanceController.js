const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const salaryAdvanceService = require('../services/salaryAdvanceService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS } = require('../config/constants');

const requireEmployeeSelf = (req) => {
  if (!req.user.employeeId) {
    throw ApiError.forbidden('This account is not linked to an employee record');
  }
  return req.user.employeeId;
};

const apply = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);
  const application = await salaryAdvanceService.applyForAdvance(employeeId, req.body);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'SalaryAdvanceApplication',
    entityId: application.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 201, application, 'Salary advance application submitted');
});

const listMine = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);
  const applications = await salaryAdvanceService.listMyApplications(employeeId);
  ApiResponse.send(res, 200, applications, 'Your salary advance applications retrieved');
});

const listAll = asyncHandler(async (req, res) => {
  const result = await salaryAdvanceService.listApplications(req.query);
  ApiResponse.send(res, 200, result, 'Salary advance applications retrieved');
});

const review = asyncHandler(async (req, res) => {
  const application = await salaryAdvanceService.reviewApplication(req.params.id, req.user, req.body);

  await logAudit({
    userId: req.user.id,
    action: req.body.status === 'approved' ? AUDIT_ACTIONS.APPROVE : AUDIT_ACTIONS.REJECT,
    entityType: 'SalaryAdvanceApplication',
    entityId: application.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 200, application, `Salary advance application ${req.body.status}`);
});

module.exports = { apply, listMine, listAll, review };
