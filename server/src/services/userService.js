const crypto = require('crypto');
const { User, Role, Employee } = require('../models');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');

const listUsers = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await User.findAndCountAll({
    include: [
      { model: Role, as: 'role' },
      { model: Employee, as: 'employee', attributes: ['id', 'employeeNumber', 'firstName', 'lastName'] },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
  return { users: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

// Generates a readable-but-random default password, e.g. "Bf-4k9pQ2rT".
// Returned once in the create-user response so the admin can hand it to the user directly.
const generateDefaultPassword = () => `Bf-${crypto.randomBytes(6).toString('base64url')}`;

const createUser = async (data) => {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const role = await Role.findByPk(data.roleId);
  if (!role) throw ApiError.badRequest('Invalid role selected');

  if (role.name === ROLES.EMPLOYEE && !data.employeeId) {
    throw ApiError.badRequest('An Employee-role account must be linked to an employee record');
  }

  // Any role can optionally link to an employee record - HR/Finance/Admin staff are
  // employees of the company too, and linking gives them the same self-service access
  // (leave, salary advances, payslips) as a pure Employee-role account.
  if (data.employeeId) {
    const employee = await Employee.findByPk(data.employeeId);
    if (!employee) throw ApiError.badRequest('Selected employee record does not exist');

    const linkedAccount = await User.findOne({ where: { employeeId: data.employeeId } });
    if (linkedAccount) throw ApiError.conflict('This employee already has a user account');
  }

  const defaultPassword = generateDefaultPassword();

  const user = await User.create({
    ...data,
    password: defaultPassword,
    mustChangePassword: true,
  });

  return { user, defaultPassword };
};

const updateUser = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound('User not found');
  await user.update(data);
  return user;
};

const setUserActive = async (id, isActive) => {
  const user = await User.findByPk(id);
  if (!user) throw ApiError.notFound('User not found');
  user.isActive = isActive;
  await user.save();
  return user;
};

const listRoles = () => Role.findAll({ order: [['name', 'ASC']] });

module.exports = { listUsers, createUser, updateUser, setUserActive, listRoles };
