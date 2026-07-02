const Settings = require('../models/Settings');

/**
 * GET /api/v1/settings
 * Returns global app settings (payment methods enabled, UPI details, etc.)
 * Called by mobile app on startup.
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findById('global');
    if (!settings) {
      // Auto-create with defaults on first call
      settings = await Settings.create({ _id: 'global' });
    }
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/settings — Admin only
 * Update global settings (payment toggles, UPI ID, QR image, etc.)
 */
exports.updateSettings = async (req, res, next) => {
  try {
    // If a new QR image was uploaded
    if (req.file) {
      req.body.qrImageUrl = req.file.location;
    }

    const settings = await Settings.findByIdAndUpdate(
      'global',
      req.body,
      { new: true, upsert: true, runValidators: true }
    );
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};
