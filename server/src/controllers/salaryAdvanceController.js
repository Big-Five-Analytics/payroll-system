const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const salaryAdvanceService = require('../services/salaryAdvanceService');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, NOTIFICATION_TYPES, ROLES } = require('../config/constants');

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

  await notificationService.notifyRoles([ROLES.ADMIN, ROLES.FINANCE], {
    type: NOTIFICATION_TYPES.SALARY_ADVANCE_SUBMITTED,
    title: 'New salary advance request',
    message: `${req.user.firstName} ${req.user.lastName} requested a salary advance of ZMW ${Number(application.amountRequested).toFixed(2)}.`,
    link: '/approvals/salary-advances',
    entityType: 'SalaryAdvanceApplication',
    entityId: application.id,
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

  await notificationService.notifyEmployeeUser(application.employeeId, {
    type: NOTIFICATION_TYPES.SALARY_ADVANCE_STATUS,
    title: `Salary advance ${application.status}`,
    message: `Your salary advance request for ZMW ${Number(application.amountRequested).toFixed(2)} was ${application.status}.`,
    link: '/my-advances',
    entityType: 'SalaryAdvanceApplication',
    entityId: application.id,
  });

  ApiResponse.send(res, 200, application, `Salary advance application ${req.body.status}`);
});

module.exports = { apply, listMine, listAll, review };
