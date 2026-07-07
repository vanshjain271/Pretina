const mongoose = require('mongoose');

/**
 * Notification Model
 * Stores push notifications sent to customers — for history/admin tracking
 */
const notificationSchema = new mongoose.Schema({
  // Title and body shown in push notification
  title:   { type: String, required: true, trim: true },
  body:    { type: String, required: true, trim: true },

  // Optional deep-link data payload
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // Target audience
  targetType: {
    type: String,
    enum: ['all', 'specific_user', 'segment'],
    default: 'all',
  },

  // If targetType === 'specific_user'
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // Who sent it
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Delivery stats
  sentCount:      { type: Number, default: 0 },
  deliveredCount: { type: Number, default: 0 },
  failedCount:    { type: Number, default: 0 },

  // Image URL (optional rich notification)
  imageUrl: { type: String, default: '' },

  status: {
    type: String,
    enum: ['draft', 'sent', 'failed'],
    default: 'sent',
  },

  sentAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

notificationSchema.index({ sentBy: 1, createdAt: -1 });
notificationSchema.index({ targetType: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
