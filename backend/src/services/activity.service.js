/**
 * Activity Service — Pretina V2
 * Logs admin/employee actions to ActivityLog collection
 */

const ActivityLog = require('../models/ActivityLog');

/**
 * Log an admin/employee action
 * @param {Object} params
 * @param {string} params.userId        — User who performed the action
 * @param {string} params.userName      — Name snapshot
 * @param {string} params.action        — e.g. 'order.status_updated'
 * @param {string} params.description   — Human-readable description
 * @param {string} [params.entityType]  — 'order' | 'product' | etc.
 * @param {string} [params.entityId]    — MongoDB ObjectId of affected entity
 * @param {Object} [params.meta]        — Extra JSON data
 * @param {string} [params.ipAddress]   — Request IP
 */
const logActivity = async ({
  userId,
  userName = '',
  action,
  description,
  entityType = 'other',
  entityId = null,
  meta = {},
  ipAddress = '',
}) => {
  try {
    await ActivityLog.create({
      user: userId,
      userName,
      action,
      description,
      entityType,
      entityId,
      meta,
      ipAddress,
    });
  } catch (err) {
    // Never let logging failure crash the main request
    console.error('ActivityLog write failed:', err.message);
  }
};

/**
 * Get paginated activity log (admin view)
 */
const getActivityLog = async ({ page = 1, limit = 30, entityType, userId } = {}) => {
  try {
    const query = {};
    if (entityType) query.entityType = entityType;
    if (userId) query.user = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email role')
        .lean(),
      ActivityLog.countDocuments(query),
    ]);

    return {
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    };
  } catch (err) {
    console.error('ActivityLog getActivityLog:', err);
    return { success: false, message: 'Failed to fetch activity log' };
  }
};

module.exports = { logActivity, getActivityLog };
