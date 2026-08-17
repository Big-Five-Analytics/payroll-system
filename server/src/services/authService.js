const { User, Role } = require('../models');
const ApiError = require('../utils/ApiError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const notificationService = require('./notificationService');
const { ROLES, NOTIFICATION_TYPES } = require('../config/constants');

const login = async (email, password) => {
  const user = await User.scope('withPassword').findOne({
    where: { email },
    include: [{ model: Role, as: 'role' }],
  });

  if (!user) throw ApiError.unauthorized('Invalid email or password');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

  const payload = { id: user.id, role: user.role.name };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ id: user.id });

  user.refreshToken = refreshToken;
  user.lastLoginAt = new Date();
  await user.save();

  const safeUser = user.toJSON();
  delete safeUser.password;
  delete safeUser.refreshToken;

  return { user: safeUser, accessToken, refreshToken };
};

const refresh = async (token) => {
  if (!token) throw ApiError.unauthorized('No refresh token provided');

  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await User.scope('withPassword').findOne({
    where: { id: decoded.id, refreshToken: token },
    include: [{ model: Role, as: 'role' }],
  });
  if (!user) throw ApiError.unauthorized('Refresh token not recognized - please log in again');

  const accessToken = generateAccessToken({ id: user.id, role: user.role.name });
  return { accessToken };
};

const logout = async (userId) => {
  await User.update({ refreshToken: null }, { where: { id: userId } });
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.scope('withPassword').findByPk(userId);
  if (!user) throw ApiError.notFound('User not found');

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  user.password = newPassword; // beforeUpdate hook hashes this
  user.mustChangePassword = false;
  await user.save();
};

// No email delivery is configured for this app, so "forgot password" is admin-mediated:
// Administrators are notified in-app and issue a new password via the Users page. The
// caller always gets the same generic response regardless of the outcome here, so this
// never confirms or denies whether an email belongs to an account.
const requestPasswordReset = async (email) => {
  const user = await User.findOne({ where: { email } });
  if (!user) return;

  await notificationService.notifyRoles([ROLES.ADMIN], {
    type: NOTIFICATION_TYPES.PASSWORD_RESET_REQUESTED,
    title: 'Password reset requested',
    message: `${user.firstName} ${user.lastName} (${user.email}) has requested a password reset.`,
    link: '/admin/users',
    entityType: 'User',
    entityId: user.id,
  });
};

module.exports = { login, refresh, logout, changePassword, requestPasswordReset };
