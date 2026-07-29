const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const attendanceService = require('../services/attendanceService');
const { isOnOfficeNetwork } = require('../utils/officeNetwork');
const { logAudit } = require('../middleware/auditLogger');
const { ATTENDANCE_ACTIONS } = require('../config/constants');

const requireEmployeeSelf = (req) => {
  if (!req.user.employeeId) {
    throw ApiError.forbidden('This account is not linked to an employee record');
  }
  return req.user.employeeId;
};

const clockIn = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);

  const networkCheck = await isOnOfficeNetwork(req.ip);
  if (!networkCheck.allowed) {
    throw ApiError.forbidden(networkCheck.reason);
  }

  const record = await attendanceService.clockIn(employeeId, req.ip);

  await logAudit({
    userId: req.user.id,
    action: ATTENDANCE_ACTIONS.CLOCK_IN,
    entityType: 'AttendanceLog',
    entityId: record.id,
    details: { lateMinutes: record.lateMinutes },
    ipAddress: req.ip,
  });

  const message =
    record.lateMinutes > 0
      ? `Clocked in - ${record.lateMinutes} minute(s) after the 08:00 start time`
      : 'Clocked in on time';
  ApiResponse.send(res, 201, record, message);
});

const clockOut = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);

  const networkCheck = await isOnOfficeNetwork(req.ip);
  if (!networkCheck.allowed) {
    throw ApiError.forbidden(networkCheck.reason);
  }

  const record = await attendanceService.clockOut(employeeId, req.ip);

  await logAudit({
    userId: req.user.id,
    action: ATTENDANCE_ACTIONS.CLOCK_OUT,
    entityType: 'AttendanceLog',
    entityId: record.id,
    details: { overtimeMinutes: record.overtimeMinutes },
    ipAddress: req.ip,
  });

  const message =
    record.overtimeMinutes > 0
      ? `Clocked out - ${record.overtimeMinutes} minute(s) of overtime logged`
      : 'Clocked out';
  ApiResponse.send(res, 200, record, message);
});

const getTodayStatus = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);
  const record = await attendanceService.getTodayStatus(employeeId);
  ApiResponse.send(res, 200, record, "Today's attendance status retrieved");
});

const listMine = asyncHandler(async (req, res) => {
  const employeeId = requireEmployeeSelf(req);
  const logs = await attendanceService.listMine(employeeId, req.query);
  ApiResponse.send(res, 200, logs, 'Your attendance log retrieved');
});

const listAll = asyncHandler(async (req, res) => {
  const result = await attendanceService.listAll(req.query);
  ApiResponse.send(res, 200, result, 'Attendance logs retrieved');
});

const getSummary = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const summary = await attendanceService.getSummary(Number(month), Number(year));
  ApiResponse.send(res, 200, summary, 'Attendance summary retrieved');
});

module.exports = { clockIn, clockOut, getTodayStatus, listMine, listAll, getSummary };
