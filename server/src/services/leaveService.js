const { LeaveApplication, Employee, Department, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { REQUEST_STATUS } = require('../config/constants');

const daysBetweenInclusive = (start, end) => {
  const ms = new Date(end) - new Date(start);
  return Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
};

const applyForLeave = async (employeeId, { leaveType, startDate, endDate, reason }) => {
  const numberOfDays = daysBetweenInclusive(startDate, endDate);
  if (numberOfDays <= 0) {
    throw ApiError.badRequest('End date must be on or after the start date');
  }

  return LeaveApplication.create({
    employeeId,
    leaveType,
    startDate,
    endDate,
    numberOfDays,
    reason,
    status: REQUEST_STATUS.PENDING,
  });
};

const listMyApplications = (employeeId) =>
  LeaveApplication.findAll({
    where: { employeeId },
    order: [['createdAt', 'DESC']],
  });

const listApplications = async ({ page = 1, limit = 20, status }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const { rows, count } = await LeaveApplication.findAndCountAll({
    where,
    include: [
      { model: Employee, as: 'employee', include: [{ model: Department, as: 'department' }] },
      { model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName'] },
    ],
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  return { applications: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

const reviewApplication = async (id, reviewer, { status, reviewComment }) => {
  const application = await LeaveApplication.findByPk(id);
  if (!application) throw ApiError.notFound('Leave application not found');
  if (application.status !== REQUEST_STATUS.PENDING) {
    throw ApiError.badRequest(`This application has already been ${application.status}`);
  }
  if (reviewer.employeeId && reviewer.employeeId === application.employeeId) {
    throw ApiError.forbidden('You cannot review your own leave application');
  }

  application.status = status;
  application.reviewedBy = reviewer.id;
  application.reviewedAt = new Date();
  application.reviewComment = reviewComment || null;
  await application.save();

  return application;
};

module.exports = { applyForLeave, listMyApplications, listApplications, reviewApplication };
