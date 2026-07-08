const express = require('express');
const router = express.Router();
const { protect, staffOnly } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

// GET  /notifications       — notification history (admin: all, customer: own)
router.get('/', protect, ctrl.getNotifications);

// PATCH /notifications/:id/read  — mark single notification as read
router.patch('/:id/read', protect, ctrl.markAsRead);

// POST /notifications       — send push notification (admin/staff)
router.post('/', protect, staffOnly, ctrl.sendNotification);

// POST /notifications/fcm-token — register device FCM token
router.post('/fcm-token', protect, ctrl.registerFcmToken);

module.exports = router;
