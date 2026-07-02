const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId:   { type: mongoose.Schema.Types.ObjectId },
  variantName: { type: String, default: '' },
  quantity:    { type: Number, required: true, min: 1, default: 1 },
  price:       { type: Number, required: true }, // Sale price at time of adding
}, { _id: true });

const cartSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items:   [cartItemSchema],
  coupon:  { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponCode: { type: String, default: '' },
}, {
  timestamps: true,
});

// Virtual: subtotal
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Cart', cartSchema);
