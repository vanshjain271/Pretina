const mongoose = require('mongoose');

/**
 * Variant Sub-Schema
 * Matches YouthQit's variant structure for full parity.
 */
const variantSchema = new mongoose.Schema({
  name:      { type: String, required: true },  // e.g., "Small", "Red"
  sku:       { type: String, default: '' },
  color:     { type: String, default: '' },     // Display color for UI
  mrp:       { type: Number, default: 0 },
  salePrice: { type: Number, default: 0 },      // YQ uses salePrice on variants
  stock:     { type: Number, default: 0, min: 0 },
  isActive:  { type: Boolean, default: true },
  // images per variant (optional, falls back to product images)
  images:    [{ type: String }],
}, { _id: true });

/**
 * Bulk / Tiered Pricing Sub-Schema
 * e.g. order 10+ get ₹80/piece, order 50+ get ₹70/piece
 * Sorted ascending by minQty — the cart service picks the highest eligible tier.
 */
const bulkPricingSchema = new mongoose.Schema({
  minQty:    { type: Number, required: true, min: 1 }, // minimum quantity for this tier
  salePrice: { type: Number, required: true, min: 0 }, // per-unit price at this tier
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  shortDesc:   { type: String, default: '' },

  // Images — stored as S3 URLs; first = primary
  images:      [{ type: String }],

  // ── Pricing (used when hasVariants = false) ─────────────────
  price:       { type: Number, required: true },       // MRP / original price
  salePrice:   { type: Number, required: true },       // Selling price

  // ── Tax ─────────────────────────────────────────────────────
  taxMode:     { type: String, enum: ['included', 'excluded'], default: 'excluded' },
  taxRate:     { type: Number, default: 0 },           // 0 | 5 | 12 | 18 | 28

  // ── Variants ─────────────────────────────────────────────────
  hasVariants: { type: Boolean, default: false },
  variants:    [variantSchema],

  // ── Bulk / Tiered Pricing ────────────────────────────────────
  // Automatically applied when cart item quantity >= tier.minQty
  bulkPricing: [bulkPricingSchema],

  // ── Inventory (used when hasVariants = false) ────────────────
  stock:              { type: Number, default: 0 },
  sku:                { type: String, default: '' },
  lowStockThreshold:  { type: Number, default: 10 },   // alert when stock <= this

  // ── Product Details ──────────────────────────────────────────
  color:         { type: String, default: '' },        // colour(s) displayed on app
  modelSeries:   { type: String, default: '' },        // e.g. "iPhone 15 Pro"
  measuringUnit: { type: String, default: 'Pcs' },     // Pcs, Box, Kg, Set
  minOrderQty:   { type: Number, default: 1, min: 1 }, // min order qty enforced at checkout
  paymentMode:   {
    type: String,
    enum: ['default', 'cod', 'prepaid'],
    default: 'default',
  },
  youtubeUrl:    { type: String, default: '' },
  warranty:      { type: String, default: '' },

  // ── Categorization ───────────────────────────────────────────
  category:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // supports multi-category
  brand:       { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  tags:        [{ type: String }],

  // ── Homepage Section Visibility ──────────────────────────────
  // Controls which sections on the app homepage this product appears in.
  isFeatured:    { type: Boolean, default: false, index: true },
  isRecommended: { type: Boolean, default: false, index: true },
  isTrending:    { type: Boolean, default: false, index: true },
  isNewArrival:  { type: Boolean, default: false, index: true },

  // ── Status ───────────────────────────────────────────────────
  isActive:    { type: Boolean, default: true, index: true },
  isInStock:   { type: Boolean, default: true },

  // ── Ratings (aggregated) ─────────────────────────────────────
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

  // ── SEO ──────────────────────────────────────────────────────
  slug:        { type: String, unique: true, sparse: true },

  // ── Admin Sorting ─────────────────────────────────────────────
  sortOrder:   { type: Number, default: 0 },
}, {
  timestamps: true,
});

// ── Auto-generate slug from name ─────────────────────────────
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + Date.now();
  }
  // Sync isInStock
  if (!this.hasVariants) {
    this.isInStock = this.stock > 0;
  } else {
    this.isInStock = this.variants.some(v => v.stock > 0 && v.isActive);
  }
  next();
});

// ── Virtual: discount percentage ─────────────────────────────
productSchema.virtual('discountPercentage').get(function () {
  if (this.price > this.salePrice) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// ── Full-text search index ────────────────────────────────────
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
