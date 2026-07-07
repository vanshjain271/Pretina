const mongoose = require('mongoose');

/**
 * Invoice Model
 * Linked to an Order — stores invoice number and generated PDF URL
 */
const invoiceLineSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity:    { type: Number, required: true, min: 1 },
  unitPrice:   { type: Number, required: true, min: 0 },
  mrp:         { type: Number, required: true, min: 0 },
  total:       { type: Number, required: true, min: 0 },
}, { _id: true });

const invoiceSchema = new mongoose.Schema({
  // Invoice number — e.g., INV-2024-0001
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },

  // Linked order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true, // One invoice per order
  },

  // Linked customer
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Snapshot of customer at time of invoice
  customerName:    { type: String, default: '' },
  customerPhone:   { type: String, default: '' },
  customerEmail:   { type: String, default: '' },
  shippingAddress: { type: String, default: '' },

  // Line items
  items: [invoiceLineSchema],

  // Totals
  subtotal:      { type: Number, required: true, min: 0 },
  discountAmount:{ type: Number, default: 0 },
  shippingCharge:{ type: Number, default: 0 },
  totalAmount:   { type: Number, required: true, min: 0 },

  // Payment info
  paymentMethod: { type: String, default: '' },
  amountPaid:    { type: Number, default: 0 },
  balanceDue:    { type: Number, default: 0 },

  // Company details (snapshot from Settings at time of invoice generation)
  companyName:    { type: String, default: '' },
  companyAddress: { type: String, default: '' },
  companyPhone:   { type: String, default: '' },
  companyEmail:   { type: String, default: '' },
  gstin:          { type: String, default: '' },

  // PDF storage
  pdfUrl: { type: String, default: '' }, // S3 URL if generated + stored

  // Status
  status: {
    type: String,
    enum: ['draft', 'issued', 'paid', 'cancelled'],
    default: 'issued',
  },

  issuedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

// Auto-generate invoice number
invoiceSchema.pre('save', async function (next) {
  if (this.isNew && !this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments();
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

invoiceSchema.index({ order: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
