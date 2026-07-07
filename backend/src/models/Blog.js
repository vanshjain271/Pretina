const mongoose = require('mongoose');

/**
 * Blog Model
 * Store blog posts managed from admin panel, shown in mobile app
 */
const blogSchema = new mongoose.Schema({
  title:   { type: String, required: true, trim: true },
  slug:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  excerpt: { type: String, default: '', trim: true },  // Short preview text
  content: { type: String, required: true },            // Full HTML content

  // Cover image
  coverImage: { type: String, default: '' },            // S3 URL

  // Categorisation
  tags: [{ type: String, trim: true }],

  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
  },

  // SEO
  metaTitle:       { type: String, default: '' },
  metaDescription: { type: String, default: '' },

  publishedAt: { type: Date, default: null },
  views:       { type: Number, default: 0 },
}, {
  timestamps: true,
});

blogSchema.index({ slug: 1 }, { unique: true });
blogSchema.index({ status: 1, publishedAt: -1 });

// Auto-generate slug from title
blogSchema.pre('validate', function (next) {
  if (this.isNew && !this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);
