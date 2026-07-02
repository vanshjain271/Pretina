const mongoose = require('mongoose');

// Global app settings — controlled from Admin Panel
// Single document, fetched by the app on startup
const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' }, // Always one document

  // Business Info
  businessName:    { type: String, default: 'Pretina' },
  businessPhone:   { type: String, default: '8169902291' },
  businessEmail:   { type: String, default: '' },
  businessAddress: { type: String, default: '' },

  // Payment Methods — Admin toggles these on/off
  paymentRazorpayEnabled: { type: Boolean, default: true },
  paymentQrEnabled:       { type: Boolean, default: true },
  paymentCodEnabled:      { type: Boolean, default: true },

  // QR / UPI Settings
  upiId:           { type: String, default: '' },
  qrImageUrl:      { type: String, default: '' }, // S3 URL of QR code image
  upiName:         { type: String, default: 'Pretina' },

  // COD Settings
  codAdvancePercentage: { type: Number, default: 10 }, // % of total required upfront

  // Minimum Order Value
  minOrderValue:   { type: Number, default: 0 },

  // Delivery Fee
  deliveryFee:     { type: Number, default: 0 },
  freeDeliveryAbove: { type: Number, default: 0 }, // 0 = always charged

  // Social
  instagramUrl:    { type: String, default: '' },
  whatsappNumber:  { type: String, default: '8169902291' },

  // App maintenance mode
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are under maintenance. Back soon!' },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Settings', settingsSchema);
