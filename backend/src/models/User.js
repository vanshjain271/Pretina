const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:       { type: String, default: 'Home' }, // Home, Work, Other
  name:        { type: String, required: true },
  companyName: { type: String, default: '' },
  phone:       { type: String, required: true },
  line1:       { type: String, required: true },
  line2:       { type: String, default: '' },
  city:        { type: String, required: true },
  state:       { type: String, required: true },
  pincode:     { type: String, required: true },
  country:     { type: String, default: 'India' },
  isDefault:   { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
  // Identity
  name:        { type: String, required: true, trim: true },
  email:       { type: String, default: '' },
  phone:       { type: String, required: true, unique: true },

  // Firebase Auth — links existing Pretina users after migration
  firebaseUid: { type: String, default: '', index: true },

  // Profile
  photo:       { type: String, default: '' },
  pincode:     { type: String, default: '' },
  addresses:   [addressSchema],

  // B2B & Customer Settings (YouthQit Parity)
  gstNo:       { type: String, default: '' },
  type:        { type: String, enum: ['Consumer', 'Business', 'Wholesale', 'Affiliate'], default: 'Consumer' },
  isAffiliate: { type: Boolean, default: false },
  blockCod:    { type: Boolean, default: false },

  // Role: 'customer' | 'admin' | 'employee'
  role:        { type: String, enum: ['customer', 'admin', 'employee'], default: 'customer' },

  // Admin / Employee fields
  password:    { type: String, default: '' }, // Only for admin/employee

  // Granular permissions for employees (string array — matches YouthQit pattern)
  permissions: {
    type: [String],
    enum: [
      'products.view', 'products.manage',
      'orders.view', 'orders.manage',
      'invoices.view', 'invoices.manage',
      'customers.view', 'customers.manage',
      'reports.view',
      'settings.manage',
      'coupons.view', 'coupons.manage',
      'brands.view', 'brands.manage',
      'categories.view', 'categories.manage',
      'employees.view', 'employees.manage',
      'blog.view', 'blog.manage',
      'activity.view',
      'banners.view', 'banners.manage',
    ],
    default: [],
  },

  // Who created this employee (for audit trail)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Status
  isActive:       { type: Boolean, default: true },
  isPhoneVerified:{ type: Boolean, default: false },

  // Push notification tokens (multi-device support)
  fcmTokens: [{
    token:    { type: String, required: true },
    device:   { type: String, enum: ['android', 'ios', 'web'], default: 'android' },
    addedAt:  { type: Date, default: Date.now },
  }],

  // Legacy single FCM token (keep for backward compatibility)
  fcmToken:  { type: String, default: '' },

  // Wishlist (array of product IDs)
  wishlist:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
}, {
  timestamps: true,
});

// Hash password before saving (for admin/employee accounts only)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
