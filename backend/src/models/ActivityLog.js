const mongoose = require('mongoose');

/**
 * ActivityLog Model
 * Tracks every significant admin/employee action for audit trail
 */
const activityLogSchema = new mongoose.Schema({
  // Who did it
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  userName: { type: String, default: '' }, // Snapshot — in case user is deleted

  // What they did
  action: {
    type: String,
    required: true,
    trim: true,
    // e.g., 'order.status_updated', 'product.created', 'coupon.deleted'
  },

  // Human-readable description
  description: {
    type: String,
    required: true,
    trim: true,
    // e.g., 'Updated order PRE-20240101-0001 status to Shipped'
  },

  // Entity affected
  entityType: {
    type: String,
    enum: ['order', 'product', 'category', 'brand', 'coupon', 'banner',
           'alert', 'user', 'employee', 'settings', 'blog', 'invoice', 'other'],
    default: 'other',
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },

  // Extra data (JSON snapshot)
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  // IP address for security audit
  ipAddress: { type: String, default: '' },
}, {
  timestamps: true,
});

activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
