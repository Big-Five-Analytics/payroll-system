const { SalaryAdvanceApplication, Employee, Department, User } = require('../models');
const ApiError = require('../utils/ApiError');
const { REQUEST_STATUS } = require('../config/constants');

const applyForAdvance = async (employeeId, { amountRequested, reason, repaymentPlan }) => {
  return SalaryAdvanceApplication.create({
    employeeId,
    amountRequested,
    reason,
    repaymentPlan,
    dateRequested: new Date(),
    status: REQUEST_STATUS.PENDING,
  });
};

const listMyApplications = (employeeId) =>
  SalaryAdvanceApplication.findAll({
    where: { employeeId },
    order: [['createdAt', 'DESC']],
  });

const listApplications = async ({ page = 1, limit = 20, status }) => {
  const offset = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;

  const { rows, count } = await SalaryAdvanceApplication.findAndCountAll({
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
  const application = await SalaryAdvanceApplication.findByPk(id);
  if (!application) throw ApiError.notFound('Salary advance application not found');
  if (application.status !== REQUEST_STATUS.PENDING) {
    throw ApiError.badRequest(`This application has already been ${application.status}`);
  }
  if (reviewer.employeeId && reviewer.employeeId === application.employeeId) {
    throw ApiError.forbidden('You cannot review your own salary advance application');
  }

  application.status = status;
  application.reviewedBy = reviewer.id;
  application.reviewedAt = new Date();
  application.reviewComment = reviewComment || null;
  await application.save();

  return application;
};

module.exports = { applyForAdvance, listMyApplications, listApplications, reviewApplication };
