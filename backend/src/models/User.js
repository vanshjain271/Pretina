const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:       { type: String, default: 'Home' }, // Home, Work, Other
  name:        { type: String, required: true },
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
  addresses:   [addressSchema],

  // Role: 'customer' | 'admin' | 'employee'
  role:        { type: String, enum: ['customer', 'admin', 'employee'], default: 'customer' },

  // Admin / Employee fields
  password:    { type: String, default: '' }, // Only for admin/employee
  permissions: {
    manageProducts: { type: Boolean, default: false },
    manageOrders:   { type: Boolean, default: false },
    manageUsers:    { type: Boolean, default: false },
  },

  // Status
  isActive:       { type: Boolean, default: true },
  isPhoneVerified:{ type: Boolean, default: false },
  fcmToken:       { type: String, default: '' }, // For push notifications

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
