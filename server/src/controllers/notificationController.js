const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const notificationService = require('../services/notificationService');

const list = asyncHandler(async (req, res) => {
  const result = await notificationService.listForUser(req.user.id, req.query);
  ApiResponse.send(res, 200, result, 'Notifications retrieved');
});

const unreadCount = asyncHandler(async (req, res) => {
  const count = await notificationService.getUnreadCount(req.user.id);
  ApiResponse.send(res, 200, { count }, 'Unread count retrieved');
});

const markRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  ApiResponse.send(res, 200, notification, 'Notification marked as read');
});

const markAllRead = asyncHandler(async (req, res) => {
  await notificationService.markAllAsRead(req.user.id);
  ApiResponse.send(res, 200, null, 'All notifications marked as read');
});

module.exports = { list, unreadCount, markRead, markAllRead };
