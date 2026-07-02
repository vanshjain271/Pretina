const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
  title:      { type: String, default: '' },
  image:      { type: String, required: true },  // S3 URL
  linkType:   {
    type: String,
    enum: ['none', 'product', 'category', 'brand', 'url'],
    default: 'none',
  },
  linkId:     { type: mongoose.Schema.Types.ObjectId }, // Product/Category/Brand ID
  linkUrl:    { type: String, default: '' },             // External URL
  isActive:   { type: Boolean, default: true },
  sortOrder:  { type: Number, default: 0 },
  startDate:  { type: Date },
  endDate:    { type: Date },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Banner', bannerSchema);
