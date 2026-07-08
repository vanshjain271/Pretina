const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title:      { type: String, default: '' },
  description:{ type: String, default: '' },
  image:      { type: String, required: true },  // S3 URL
  placement:  {
    type: String,
    enum: ['HOME_TOP', 'HOME_MIDDLE', 'HOME_BOTTOM', 'PRODUCT_PAGE', 'CART_PAGE'],
    default: 'HOME_TOP',
  },
  linkType:   {
    type: String,
    enum: ['NONE', 'PRODUCT', 'CATEGORY', 'URL', 'none', 'product', 'category', 'brand', 'url'], // keeping old ones for backward compatibility
    default: 'NONE',
  },
  linkTarget: { type: String, default: '' }, // Replaces linkId for generic target (product/category ID)
  linkUrl:    { type: String, default: '' }, // External URL
  isActive:   { type: Boolean, default: true },
  sortOrder:  { type: Number, default: 0 },
  startDate:  { type: Date },
  endDate:    { type: Date },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Banner', bannerSchema);
