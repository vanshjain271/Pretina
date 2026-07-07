const mongoose = require('mongoose');

// Global app settings — controlled from Admin Panel
// Single document, fetched by the app on startup
const settingsSchema = new mongoose.Schema({
  _id: { type: String, default: 'global' }, // Always one document

  // ── Store Identity ─────────────────────────────────────────
  businessName:    { type: String, default: 'Pretina' },
  businessPhone:   { type: String, default: '8169902291' },
  businessEmail:   { type: String, default: '' },
  businessAddress: { type: String, default: '' },
  storeLogo:       { type: String, default: '' },       // S3 URL of store logo

  // ── Announcement Ticker (scrolling text on app homescreen) ─
  tickerEnabled: { type: Boolean, default: false },
  tickerText:    { type: String, default: '' },

  // ── Store Features Banner (app homescreen feature chips) ───
  storeFeatures: {
    type: [{
      title:    { type: String, required: true },
      subtitle: { type: String, default: '' },
      iconName: { type: String, default: 'check-circle-outline' },
    }],
    default: [
      { title: 'Best Quality', subtitle: 'Guaranteed products', iconName: 'shield-check-outline' },
      { title: 'Fast Delivery', subtitle: 'Pan India shipping', iconName: 'truck-fast-outline' },
    ],
  },

  // ── Payment Methods — Admin toggles these on/off ───────────
  paymentRazorpayEnabled: { type: Boolean, default: true },
  paymentQrEnabled:       { type: Boolean, default: true },
  paymentCodEnabled:      { type: Boolean, default: true },

  // ── QR / UPI Settings ──────────────────────────────────────
  upiId:      { type: String, default: '' },
  qrImageUrl: { type: String, default: '' }, // S3 URL of QR code image
  upiName:    { type: String, default: 'Pretina' },

  // ── COD & Partial Payment ──────────────────────────────────
  codAdvancePercentage:  { type: Number, default: 10 }, // % of total required upfront
  advancePartialPayment: { type: Boolean, default: false },

  // ── Order Settings ─────────────────────────────────────────
  minOrderValue:      { type: Number, default: 0 },
  autoConfirmOrders:  { type: Boolean, default: false },
  orderNotes:         { type: String, default: '' },    // Admin note shown to customers at checkout

  // ── Delivery Settings ──────────────────────────────────────
  deliveryFee:          { type: Number, default: 0 },
  freeDeliveryAbove:    { type: Number, default: 0 },   // 0 = always charged
  allIndiaDelivery:     { type: Boolean, default: true },
  serviceType:          { type: String, enum: ['delivery', 'pickup', 'both'], default: 'delivery' },

  // ── SEO Settings ───────────────────────────────────────────
  metaTitle:       { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  metaKeywords:    { type: String, default: '' },

  // ── Notification Channels ──────────────────────────────────
  smsNotifications:   { type: Boolean, default: true },
  emailNotifications: { type: Boolean, default: true },
  pushNotifications:  { type: Boolean, default: true },

  // ── Return / Refund Settings ───────────────────────────────
  returnWindowDays:      { type: Number, default: 7 },
  returnPolicy:          { type: String, default: '' },
  refundPolicy:          { type: String, default: '' },
  cancellationPolicy:    { type: String, default: '' },
  shippingPolicy:        { type: String, default: '' },

  // ── Legal Policies ─────────────────────────────────────────
  termsAndConditions: { type: String, default: '' },
  privacyPolicy:      { type: String, default: '' },

  // ── About ──────────────────────────────────────────────────
  aboutUs: { type: String, default: '' },

  // ── Company / Invoice Details ──────────────────────────────
  companyLegalName:  { type: String, default: '' },
  companyTradeName:  { type: String, default: '' },
  companyAddress:    { type: String, default: '' },
  companyCity:       { type: String, default: '' },
  companyState:      { type: String, default: '' },
  companyPincode:    { type: String, default: '' },
  companyPhone:      { type: String, default: '' },
  companyEmail:      { type: String, default: '' },
  gstin:             { type: String, default: '' },
  pan:               { type: String, default: '' },
  bankName:          { type: String, default: '' },
  bankAccountNo:     { type: String, default: '' },
  bankAccountType:   { type: String, default: 'Current' },
  bankIfsc:          { type: String, default: '' },
  bankBranch:        { type: String, default: '' },

  // ── Social ─────────────────────────────────────────────────
  instagramUrl:   { type: String, default: '' },
  whatsappNumber: { type: String, default: '8169902291' },

  // ── App Maintenance ────────────────────────────────────────
  maintenanceMode:    { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'We are under maintenance. Back soon!' },
}, {
  timestamps: true,
});

// Helper to always get the single settings document
settingsSchema.statics.getSettings = async function () {
  let s = await this.findById('global');
  if (!s) s = await this.create({ _id: 'global' });
  return s;
};

module.exports = mongoose.model('Settings', settingsSchema);

