const { User, Role } = require('../models');
const ApiError = require('../utils/ApiError');

const listUsers = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await User.findAndCountAll({
    include: [{ model: Role, as: 'role' }],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });
  return { users: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

const createUser = async (data) => {
  const existing = await User.findOne({ where: { email: data.email } });
  if (existing) throw ApiError.conflict('A user with this email already exists');
  return User.create(data);
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
