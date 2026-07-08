const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name:           { type: String, required: true, trim: true, unique: true },
  description:    { type: String, default: '' },
  image:          { type: String, default: '' },   // S3 URL
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  isActive:       { type: Boolean, default: true },
  sortOrder:      { type: Number, default: 0 },
  slug:           { type: String, unique: true, sparse: true },
}, {
  timestamps: true,
});

categorySchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

module.exports = mongoose.model('Category', categorySchema);
