/**
 * Notification Controller — Pretina
 * Handles manual push notification sends and history.
 */

const Notification = require('../models/Notification');
const User = require('../models/User');
const NotificationService = require('../services/notification.service');

/* ─────────────────────────────────────────────────────────────────
   GET /notifications  — history (admin sees all, customer sees own)
   ───────────────────────────────────────────────────────────── */
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Admin sees broadcast history; customer not applicable via this route
    const filter = req.user.role === 'customer' ? { targetUser: req.user._id } : {};

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('sentBy', 'name')
        .populate('targetUser', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: notifications,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────────────────────────────
   PATCH /notifications/:id/read  — mark as read (customer)
   ───────────────────────────────────────────────────────────── */
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { 'data.read': true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────────────────────────────
   POST /notifications  — send push notification (admin/staff)
   Body: { title, body, link?, imageUrl?, user?, broadcast? }
   ───────────────────────────────────────────────────────────── */
const sendNotification = async (req, res, next) => {
  try {
    const { title, body, linkType, linkId, link, imageUrl, user: targetUserId, broadcast } = req.body;

    if (!title || !body) {
      return res.status(400).json({ success: false, message: 'title and body are required.' });
    }

    let sentCount = 0;
    let fcmResult = { success: false, reason: 'Not attempted' };
    const data = { 
      link: link || '', 
      linkType: linkType || 'none',
      linkId: linkId || '',
      type: 'CUSTOM' 
    };

    if (broadcast || !targetUserId) {
      // ── Broadcast to all users ─────────────────────────────────
      fcmResult = await NotificationService.broadcast({ title, body, data, imageUrl: imageUrl || null });

      // Count active users (approximate sent count)
      sentCount = await User.countDocuments({ isActive: true });

      // Save to notification history as broadcast
      await NotificationService.saveRecord({
        sentBy: req.user._id,
        title,
        body,
        data,
        targetType: 'all',
        imageUrl: imageUrl || '',
        sentCount,
        status: fcmResult.success ? 'sent' : 'failed',
      });
    } else {
      // ── Single user ────────────────────────────────────────────
      const targetUser = await User.findById(targetUserId).lean();
      if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });

      fcmResult = await NotificationService.sendToUser(targetUserId, { title, body, data, imageUrl: imageUrl || null });
      sentCount = fcmResult.success ? 1 : 0;

      await NotificationService.saveRecord({
        sentBy: req.user._id,
        title,
        body,
        data,
        targetType: 'specific_user',
        targetUser: targetUserId,
        imageUrl: imageUrl || '',
        sentCount,
        status: fcmResult.success ? 'sent' : 'sent', // always 'sent' (DB record is always created)
      });
    }

    res.status(201).json({
      success: true,
      message: broadcast || !targetUserId ? `Notification broadcast (${sentCount} users)` : 'Notification sent.',
      fcm: fcmResult,
    });
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────────────────────────────
   POST /notifications/fcm-token  — register FCM token for a user
   Body: { token, device }
   ───────────────────────────────────────────────────────────── */
const registerFcmToken = async (req, res, next) => {
  try {
    const { token, device = 'android' } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'token is required.' });

    await NotificationService.registerFCMToken(req.user._id, token, device);
    res.json({ success: true, message: 'FCM token registered.' });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAsRead, sendNotification, registerFcmToken };
