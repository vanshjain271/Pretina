const Notification = require('../models/Notification');

// GET all notifications for a user (admin or customer)
const getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    
    // Admin sees all, customer sees only theirs
    const filter = req.user.role === 'customer' ? { user: req.user._id } : {};
    
    const [notifications, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Notification.countDocuments(filter),
    ]);
    
    res.json({ success: true, data: notifications, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
};

// PATCH mark as read
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: notification });
  } catch (err) { next(err); }
};

// POST send manual notification (admin/staff)
const sendNotification = async (req, res, next) => {
  try {
    const { user, title, body, type, link } = req.body;
    const notification = await Notification.create({ user, title, body, type, link });
    res.status(201).json({ success: true, data: notification });
  } catch (err) { next(err); }
};

module.exports = { getNotifications, markAsRead, sendNotification };
