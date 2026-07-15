const { Op } = require('sequelize');
const {
  Employee,
  Department,
  EmployeeAllowance,
  EmployeeDeduction,
  Allowance,
  Deduction,
} = require('../models');
const ApiError = require('../utils/ApiError');

const generateEmployeeNumber = async () => {
  const count = await Employee.count();
  const year = new Date().getFullYear();
  return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
};

const listEmployees = async ({ page = 1, limit = 20, search, departmentId, status }) => {
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { employeeNumber: { [Op.iLike]: `%${search}%` } },
    ];
  }
  if (departmentId) where.departmentId = departmentId;
  if (status) where.status = status;

  const { rows, count } = await Employee.findAndCountAll({
    where,
    include: [{ model: Department, as: 'department' }],
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  });

  return { employees: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

const getEmployeeById = async (id) => {
  const employee = await Employee.findByPk(id, {
    include: [
      { model: Department, as: 'department' },
      { model: EmployeeAllowance, as: 'allowances', include: [{ model: Allowance, as: 'allowance' }] },
      { model: EmployeeDeduction, as: 'deductions', include: [{ model: Deduction, as: 'deduction' }] },
    ],
  });
  if (!employee) throw ApiError.notFound('Employee not found');
  return employee;
};

const createEmployee = async (data) => {
  const existing = await Employee.findOne({
    where: { [Op.or]: [{ email: data.email }, { nationalId: data.nationalId }] },
  });
  if (existing) throw ApiError.conflict('An employee with this email or national ID already exists');

  const employeeNumber = await generateEmployeeNumber();
  return Employee.create({ ...data, employeeNumber });
};

const updateEmployee = async (id, data) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw ApiError.notFound('Employee not found');
  await employee.update(data);
  return employee;
};

const deleteEmployee = async (id) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw ApiError.notFound('Employee not found');
  // Soft delete pattern: mark terminated rather than hard-deleting payroll history.
  employee.status = 'terminated';
  employee.terminationDate = new Date();
  await employee.save();
  return employee;
};

const setEmployeeAllowance = async (employeeId, allowanceId, amount) => {
  const [record] = await EmployeeAllowance.findOrCreate({
    where: { employeeId, allowanceId },
    defaults: { amount },
  });
  if (record.amount !== amount) {
    record.amount = amount;
    await record.save();
  }
  return record;
};

const setEmployeeDeduction = async (employeeId, deductionId, amount) => {
  const [record] = await EmployeeDeduction.findOrCreate({
    where: { employeeId, deductionId },
    defaults: { amount },
  });
  if (record.amount !== amount) {
    record.amount = amount;
    await record.save();
  }
  return record;
};

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  setEmployeeAllowance,
  setEmployeeDeduction,
};
