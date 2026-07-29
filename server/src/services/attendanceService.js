const { Op } = require('sequelize');
const { AttendanceLog, Employee, Department } = require('../models');
const ApiError = require('../utils/ApiError');
const { WORK_START_HOUR, WORK_END_HOUR } = require('../config/constants');

const todayDateOnly = () => new Date().toISOString().slice(0, 10);

// Minutes past the given hour boundary (server local time), 0 if not past it yet.
const minutesPast = (timestamp, hourBoundary) => {
  const boundary = new Date(timestamp);
  boundary.setHours(hourBoundary, 0, 0, 0);
  const diffMs = new Date(timestamp) - boundary;
  return diffMs > 0 ? Math.round(diffMs / 60000) : 0;
};

const clockIn = async (employeeId, ip) => {
  const logDate = todayDateOnly();
  const existing = await AttendanceLog.findOne({ where: { employeeId, logDate } });
  if (existing) {
    throw ApiError.badRequest("You've already clocked in today");
  }

  const clockInAt = new Date();
  return AttendanceLog.create({
    employeeId,
    logDate,
    clockInAt,
    clockInIp: ip,
    lateMinutes: minutesPast(clockInAt, WORK_START_HOUR),
  });
};

const clockOut = async (employeeId, ip) => {
  const logDate = todayDateOnly();
  const record = await AttendanceLog.findOne({ where: { employeeId, logDate } });
  if (!record) {
    throw ApiError.badRequest('You need to clock in before you can clock out today');
  }
  if (record.clockOutAt) {
    throw ApiError.badRequest("You've already clocked out today");
  }

  const clockOutAt = new Date();
  record.clockOutAt = clockOutAt;
  record.clockOutIp = ip;
  record.overtimeMinutes = minutesPast(clockOutAt, WORK_END_HOUR);
  await record.save();
  return record;
};

// Today's record (or null) - lets the frontend decide whether to show "Clock In" or
// "Clock Out" without the client needing to track state itself.
const getTodayStatus = async (employeeId) => {
  const logDate = todayDateOnly();
  return AttendanceLog.findOne({ where: { employeeId, logDate } });
};

const listMine = async (employeeId, { month, year }) => {
  const where = { employeeId };
  if (month && year) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).getDate(); // last day of month
    const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`;
    where.logDate = { [Op.between]: [start, end] };
  }
  return AttendanceLog.findAll({ where, order: [['logDate', 'DESC']] });
};

const listAll = async ({ page = 1, limit = 30, employeeId, departmentId, from, to }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (employeeId) where.employeeId = employeeId;
  if (from || to) {
    where.logDate = {};
    if (from) where.logDate[Op.gte] = from;
    if (to) where.logDate[Op.lte] = to;
  }

  const employeeWhere = {};
  if (departmentId) employeeWhere.departmentId = departmentId;

  const { rows, count } = await AttendanceLog.findAndCountAll({
    where,
    include: [
      {
        model: Employee,
        as: 'employee',
        where: Object.keys(employeeWhere).length ? employeeWhere : undefined,
        include: [{ model: Department, as: 'department' }],
      },
    ],
    limit: Number(limit),
    offset,
    order: [['logDate', 'DESC']],
    distinct: true,
  });

  return { logs: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

// Per-employee totals for a period - late count, total late minutes, total overtime
// minutes - so HR can review who's chronically late or racking up unpaid overtime
// without scrolling through a raw daily log.
const getSummary = async (month, year) => {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).getDate();
  const end = `${year}-${String(month).padStart(2, '0')}-${String(endDate).padStart(2, '0')}`;

  const logs = await AttendanceLog.findAll({
    where: { logDate: { [Op.between]: [start, end] } },
    include: [{ model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] }],
  });

  const byEmployee = {};
  for (const log of logs) {
    const key = log.employeeId;
    if (!byEmployee[key]) {
      byEmployee[key] = {
        employeeId: key,
        employeeName: `${log.employee.firstName} ${log.employee.lastName}`,
        department: log.employee.department ? log.employee.department.name : 'Unassigned',
        daysLogged: 0,
        daysLate: 0,
        totalLateMinutes: 0,
        totalOvertimeMinutes: 0,
      };
    }
    const entry = byEmployee[key];
    entry.daysLogged += 1;
    if (log.lateMinutes > 0) entry.daysLate += 1;
    entry.totalLateMinutes += log.lateMinutes;
    entry.totalOvertimeMinutes += log.overtimeMinutes;
  }

  return { month, year, employees: Object.values(byEmployee) };
};

module.exports = { clockIn, clockOut, getTodayStatus, listMine, listAll, getSummary };
