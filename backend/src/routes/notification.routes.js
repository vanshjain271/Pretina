const express = require('express');
const router = express.Router();
const { protect, staffOnly } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

router.get('/', protect, ctrl.getNotifications);
router.patch('/:id/read', protect, ctrl.markAsRead);
router.post('/', protect, staffOnly, ctrl.sendNotification);

module.exports = router;
