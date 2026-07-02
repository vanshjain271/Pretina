const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  logo:        { type: String, default: '' },   // S3 URL — circular logo shown on home page
  isActive:    { type: Boolean, default: true },
  sortOrder:   { type: Number, default: 0 },
  slug:        { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
});

brandSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Brand', brandSchema);
