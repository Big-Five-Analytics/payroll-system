const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const leaveService = require('../services/leaveService');
const notificationService = require('../services/notificationService');
const { logAudit } = require('../middleware/auditLogger');
const { AUDIT_ACTIONS, NOTIFICATION_TYPES } = require('../config/constants');

const requireEmployeeSelf = (req) => {
  if (!req.user.employeeId) {
    throw ApiError.forbidden('This account is not linked to an employee record');
  }
  return req.user.employeeId;
};

const apply = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);
  const application = await leaveService.applyForLeave(employeeId, req.body);

  await logAudit({
    userId: req.user.id,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'LeaveApplication',
    entityId: application.id,
    ipAddress: req.ip,
  });

  ApiResponse.send(res, 201, application, 'Leave application submitted');
});

const listMine = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);
  const applications = await leaveService.listMyApplications(employeeId);
  ApiResponse.send(res, 200, applications, 'Your leave applications retrieved');
});

const listAll = asyncHandler(async (req, res) => {
  const result = await leaveService.listApplications(req.query);
  ApiResponse.send(res, 200, result, 'Leave applications retrieved');
});

const review = asyncHandler(async (req, res) => {
  const application = await leaveService.reviewApplication(req.params.id, req.user, req.body);

  await logAudit({
    userId: req.user.id,
    action: req.body.status === 'approved' ? AUDIT_ACTIONS.APPROVE : AUDIT_ACTIONS.REJECT,
    entityType: 'LeaveApplication',
    entityId: application.id,
    ipAddress: req.ip,
  });

  await notificationService.notifyEmployeeUser(application.employeeId, {
    type: NOTIFICATION_TYPES.LEAVE_STATUS,
    title: `Leave application ${application.status}`,
    message: `Your ${application.leaveType} leave request (${application.startDate} to ${application.endDate}) was ${application.status}.`,
    link: '/my-leave',
    entityType: 'LeaveApplication',
    entityId: application.id,
  });

  ApiResponse.send(res, 200, application, `Leave application ${req.body.status}`);
});

module.exports = { apply, listMine, listAll, review };
