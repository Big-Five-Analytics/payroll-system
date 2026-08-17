const { Notification, User, Role } = require('../models');
const ApiError = require('../utils/ApiError');

const createNotification = ({ userId, type, title, message, link, entityType, entityId }) =>
  Notification.create({ userId, type, title, message, link, entityType, entityId });

// Looks up the User login linked to this employee and notifies them - a safe no-op
// (returns null) if the employee has no portal account to deliver to (e.g. a general
// worker, or an employee who was never issued a login).
const notifyEmployeeUser = async (employeeId, payload) => {
  const user = await User.findOne({ where: { employeeId } });
  if (!user) return null;
  return createNotification({ userId: user.id, ...payload });
};

// Notifies every active user holding any of the given role names - e.g. alerting
// Administrators (and whichever role actually reviews a given request type) when
// something new needs their attention.
const notifyRoles = async (roleNames, payload) => {
  const users = await User.findAll({
    where: { isActive: true },
    include: [{ model: Role, as: 'role', where: { name: roleNames } }],
  });
  return Promise.all(users.map((user) => createNotification({ userId: user.id, ...payload })));
};

const listForUser = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { rows, count } = await Notification.findAndCountAll({
    where: { userId },
    limit: Number(limit),
    offset,
    order: [['createdAt', 'DESC']],
  });
  return { notifications: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) };
};

const getUnreadCount = (userId) => Notification.count({ where: { userId, isRead: false } });

const markAsRead = async (id, userId) => {
  const notification = await Notification.findOne({ where: { id, userId } });
  if (!notification) throw ApiError.notFound('Notification not found');
  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }
  return notification;
};

const markAllAsRead = (userId) =>
  Notification.update({ isRead: true, readAt: new Date() }, { where: { userId, isRead: false } });

module.exports = {
  createNotification,
  notifyEmployeeUser,
  notifyRoles,
  listForUser,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
