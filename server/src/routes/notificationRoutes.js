const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { idParamValidator } = require('../validators/notificationValidator');

// Every account (any role, including plain Employee) can have notifications - each
// user only ever sees/acts on their own, scoped by req.user.id in the controller.
router.use(authenticate);

router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.patch('/read-all', notificationController.markAllRead);
router.patch('/:id/read', idParamValidator, validate, notificationController.markRead);

module.exports = router;
