const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  name:     { type: String, required: true },  // e.g., "Color", "Size"
  value:    { type: String, required: true },  // e.g., "Red", "XL"
  price:    { type: Number, required: true },
  mrp:      { type: Number, required: true },
  stock:    { type: Number, required: true, default: 0 },
  sku:      { type: String, default: '' },
}, { _id: true });

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  shortDesc:   { type: String, default: '' },

  // Images — stored as S3 URLs
  images:      [{ type: String }], // First image = primary

  // Pricing (used when no variants)
  price:       { type: Number, required: true },  // MRP / original price
  salePrice:   { type: Number, required: true },  // Selling price
  
  // Product type
  hasVariants: { type: Boolean, default: false },
  variants:    [variantSchema],

  // Stock (used when no variants)
  stock:       { type: Number, default: 0 },
  sku:         { type: String, default: '' },

  // Categorization
  category:    { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brand:       { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
  tags:        [{ type: String }],

  // Visibility on home page sections
  isFeatured:    { type: Boolean, default: false, index: true },
  isRecommended: { type: Boolean, default: false, index: true },
  isTrending:    { type: Boolean, default: false, index: true },
  isNewArrival:  { type: Boolean, default: false, index: true },

  // Status
  isActive:    { type: Boolean, default: true, index: true },
  isInStock:   { type: Boolean, default: true },

  // Ratings (aggregated, updated on order delivery)
  rating:      { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

  // SEO
  slug:        { type: String, unique: true, sparse: true },

  // Sorting weight (admin can manually boost)
  sortOrder:   { type: Number, default: 0 },
}, {
  timestamps: true,
});

// Auto-generate slug from name
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
    this.isInStock = this.variants.some(v => v.stock > 0);
  }
  next();
});

// Discount percentage virtual
productSchema.virtual('discountPercentage').get(function () {
  if (this.price > this.salePrice) {
    return Math.round(((this.price - this.salePrice) / this.price) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

// Text search index
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
