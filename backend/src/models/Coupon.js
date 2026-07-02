const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:          { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:   { type: String, default: '' },
  type:          { type: String, enum: ['percentage', 'fixed'], required: true },
  value:         { type: Number, required: true },       // e.g., 20 (%) or 100 (₹)
  minOrderValue: { type: Number, default: 0 },           // Minimum cart value to apply
  maxDiscount:   { type: Number, default: 0 },           // Max discount cap (for % type)
  usageLimit:    { type: Number, default: 0 },           // 0 = unlimited
  usedCount:     { type: Number, default: 0 },
  perUserLimit:  { type: Number, default: 1 },
  isActive:      { type: Boolean, default: true },
  startDate:     { type: Date },
  endDate:       { type: Date },
  // Track who used this coupon
  usedBy:        [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Coupon', couponSchema);
