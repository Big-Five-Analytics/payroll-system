const { Op } = require('sequelize');
const {
  sequelize,
  Employee,
  Department,
  EmployeeAllowance,
  EmployeeDeduction,
  Allowance,
  Deduction,
  User,
  TerminatedEmployee,
} = require('../models');
const ApiError = require('../utils/ApiError');

const generateEmployeeNumber = async () => {
  const count = await Employee.count();
  const year = new Date().getFullYear();
  return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
};

// Default employee listing excludes terminated staff - they've effectively been "moved"
// to the terminated_employees archive from the product's point of view, even though the
// underlying row is retained (see TerminatedEmployee.js for why). Pass includeTerminated
// to opt back in, e.g. for a report that needs full historical visibility.
const listEmployees = async ({ page = 1, limit = 20, search, departmentId, status, includeTerminated }) => {
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
  if (status) {
    where.status = status;
  } else if (!includeTerminated) {
    where.status = { [Op.ne]: 'terminated' };
  }

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

// Terminates an employee: archives a snapshot into terminated_employees (the HR-facing
// "terminated employees" table), deactivates any linked login so they can no longer sign
// in, and flips the employees row to status='terminated' so it drops out of headcount and
// directory listings - while payroll/payslip/leave/advance history stays intact and queryable.
const deleteEmployee = async (id, { terminatedBy, reason } = {}) => {
  const employee = await Employee.findByPk(id, { include: [{ model: Department, as: 'department' }] });
  if (!employee) throw ApiError.notFound('Employee not found');
  if (employee.status === 'terminated') {
    throw ApiError.badRequest('This employee has already been terminated');
  }

  const terminationDate = new Date();

  await sequelize.transaction(async (t) => {
    await TerminatedEmployee.create(
      {
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        nationalId: employee.nationalId,
        departmentName: employee.department ? employee.department.name : null,
        jobTitle: employee.jobTitle,
        dateOfHire: employee.dateOfHire,
        terminationDate,
        lastBasicSalary: employee.basicSalary,
        reason: reason || null,
        terminatedBy: terminatedBy || null,
      },
      { transaction: t }
    );

    employee.status = 'terminated';
    employee.terminationDate = terminationDate;
    await employee.save({ transaction: t });

    // A terminated employee's self-service login (if any) should no longer work.
    await User.update(
      { isActive: false },
      { where: { employeeId: employee.id }, transaction: t }
    );
  });

  return employee;
};

// The HR-facing archive listing - reads from terminated_employees, not the employees table.
const listTerminatedEmployees = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await TerminatedEmployee.findAndCountAll({
    include: [{ model: User, as: 'terminator', attributes: ['id', 'firstName', 'lastName'] }],
    limit: Number(limit),
    offset,
    order: [['terminationDate', 'DESC']],
  });
  return { terminatedEmployees: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
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

// Active employees who don't yet have a linked user login - used by the admin UI
// when creating any user account that should be linked to an employee record.
const getEmployeesWithoutAccount = async () => {
  const linkedIds = (await User.findAll({ where: { employeeId: { [Op.ne]: null } }, attributes: ['employeeId'] })).map(
    (u) => u.employeeId
  );
  return Employee.findAll({
    where: {
      status: 'active',
      ...(linkedIds.length ? { id: { [Op.notIn]: linkedIds } } : {}),
    },
    include: [{ model: Department, as: 'department' }],
    order: [['firstName', 'ASC']],
  });
};

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listTerminatedEmployees,
  setEmployeeAllowance,
  setEmployeeDeduction,
  getEmployeesWithoutAccount,
};
