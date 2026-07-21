const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name:         { type: String, required: true },    // Snapshot of product name
  image:        { type: String, default: '' },       // Snapshot of product image
  variantId:    { type: mongoose.Schema.Types.ObjectId },
  variantName:  { type: String, default: '' },       // e.g., "Color: Red"
  price:        { type: Number, required: true },    // Snapshot of sale price at time of order
  mrp:          { type: Number, required: true },    // Snapshot of MRP
  quantity:     { type: Number, required: true, min: 1 },
  total:        { type: Number, required: true },    // price * quantity
}, { _id: true });

const shippingAddressSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  companyName: { type: String, default: '' },
  phone:   { type: String, required: true },
  line1:   { type: String, required: true },
  line2:   { type: String, default: '' },
  city:    { type: String, required: true },
  state:   { type: String, required: true },
  pincode: { type: String, required: true },
  country: { type: String, default: 'India' },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  // Order identification
  orderNumber: { type: String, unique: true }, // e.g., PRE-20240101-0001

  // Customer
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Items
  items:       [orderItemSchema],

  // Pricing
  subtotal:    { type: Number, required: true },
  discount:    { type: Number, default: 0 },      // From coupon
  deliveryFee: { type: Number, default: 0 },

  total:       { type: Number, required: true },

  // Coupon applied
  coupon:      { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponCode:  { type: String, default: '' },

  // Shipping
  shippingAddress: { type: shippingAddressSchema, required: true },

  // Payment
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'partial_razorpay', 'qr_upi', 'cod'],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'advance_paid', 'paid', 'refunded', 'failed', 'payment_failed'],
    default: 'pending',
  },
  razorpayOrderId:  { type: String, default: '' },
  razorpayPaymentId:{ type: String, default: '' },
  // QR/UPI payment reference
  upiTransactionId: { type: String, default: '' },
  upiPaymentProof:  { type: String, default: '' }, // S3 URL of uploaded screenshot
  // COD advance amount
  codAdvanceAmount: { type: Number, default: 0 },

  // Order status
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'returned'],
    default: 'pending',
    index: true,
  },

  // Tracking
  trackingNumber: { type: String, default: '' },
  trackingUrl:    { type: String, default: '' },
  courierName:    { type: String, default: '' },

  // Advance / Token payment (partial COD payment collected before shipping)
  tokenReceived:  { type: Number, default: 0, min: 0 },

  // Status history
  statusHistory: [{
    status:    String,
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  }],

  // Cancellation
  cancelledBy:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  cancellationReason:  { type: String, default: '' },
  cancelledAt:         { type: Date, default: null },

  // Invoice reference (generated after confirmation)
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },

  // Notes
  customerNote: { type: String, default: '' },
  adminNote:    { type: String, default: '' },
}, {
  timestamps: true,
});

const Counter = require('./Counter');

// Auto-generate order number using atomic counter (prevents E11000 duplicate key errors)
orderSchema.pre('save', async function (next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
    // getNextSequence is atomic — safe against concurrent order creation
    const seq = await Counter.getNextSequence('orderNumber');
    this.orderNumber = `PRE-${dateStr}-${String(seq).padStart(4, '0')}`;
  }
  next();
});


module.exports = mongoose.model('Order', orderSchema);
