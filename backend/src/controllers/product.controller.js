/**
 * Product Controller — Pretina
 * Full YouthQit feature parity:
 *  - All new fields: taxMode, taxRate, bulkPricing (salePrice tiers),
 *    lowStockThreshold, minOrderQty, color, modelSeries, measuringUnit,
 *    paymentMode, youtubeUrl, warranty, variants with color/isActive
 *  - Multi-category support
 *  - Homepage section booleans (isFeatured, isTrending, isRecommended, isNewArrival)
 *  - Duplicate product
 *  - Low-stock list
 */

const Product = require('../models/Product');
const { deleteFile } = require('../services/s3.service');

/* ── Homepage Products ───────────────────────────────────────── */
exports.getHomepageProducts = async (req, res, next) => {
  try {
    const LIMIT = 12;
    const [featured, recommended, trending, newArrivals] = await Promise.all([
      Product.aggregate([
        { $match: { isFeatured: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands',     localField: 'brand',    foreignField: '_id', as: 'brand'    } },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      ]),
      Product.aggregate([
        { $match: { isRecommended: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands',     localField: 'brand',    foreignField: '_id', as: 'brand'    } },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      ]),
      Product.aggregate([
        { $match: { isTrending: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands',     localField: 'brand',    foreignField: '_id', as: 'brand'    } },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      ]),
      Product.aggregate([
        { $match: { isNewArrival: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands',     localField: 'brand',    foreignField: '_id', as: 'brand'    } },
        { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      ]),
    ]);
    res.json({ success: true, data: { featured, recommended, trending, newArrivals } });
  } catch (err) { next(err); }
};

/* ── List Products ───────────────────────────────────────────── */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      category, brand, search,
      minPrice, maxPrice,
      sortBy = 'createdAt', sortOrder = 'desc',
      inStock, status,
    } = req.query;

    const filter = {};

    // Admin can see inactive products; public API only sees active
    if (req.user?.role && ['admin', 'employee'].includes(req.user.role)) {
      if (status === 'active')   filter.isActive = true;
      if (status === 'inactive') filter.isActive = false;
    } else {
      filter.isActive = true;
    }

    if (category) filter.category = { $in: Array.isArray(category) ? category : [category] };
    if (brand)    filter.brand = brand;
    if (inStock === 'true') filter.isInStock = true;
    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku:  { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('category', 'name image slug')
        .populate('brand', 'name logo')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: {
        total, page: Number(page), limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) { next(err); }
};

/* ── Search Products ─────────────────────────────────────────── */
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;
    if (!q) return res.json({ success: true, data: [], pagination: { total: 0 } });

    const filter = { isActive: true, $text: { $search: q } };
    const skip = (Number(page) - 1) * Number(limit);

    const [products, total] = await Promise.all([
      Product.find(filter, { score: { $meta: 'textScore' } })
        .populate('category', 'name slug')
        .populate('brand', 'name logo')
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(Number(limit)),
      Product.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: products,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

/* ── Single Product ──────────────────────────────────────────── */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name image slug')
      .populate('brand', 'name logo');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

/* ── Low-stock Products (admin) ──────────────────────────────── */
exports.getLowStockProducts = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$stock', '$lowStockThreshold'] },
    })
      .select('name sku stock lowStockThreshold images category')
      .populate('category', 'name')
      .sort({ stock: 1 })
      .limit(50)
      .lean();
    res.json({ success: true, count: products.length, data: products });
  } catch (err) { next(err); }
};

/* ─── INTERNAL: parse and sanitize product body ─────────────── */
function parseProductBody(body, files) {
  const data = { ...body };

  // Parse JSON strings (from FormData)
  ['variants', 'bulkPricing', 'tags', 'category'].forEach(field => {
    if (typeof data[field] === 'string') {
      try { data[field] = JSON.parse(data[field]); } catch (_) { /* leave as-is */ }
    }
  });

  // category: normalize to array of ObjectId strings
  if (data.category && !Array.isArray(data.category)) {
    data.category = [data.category];
  }

  // Numeric coercions
  ['price', 'salePrice', 'stock', 'taxRate', 'lowStockThreshold', 'minOrderQty', 'sortOrder'].forEach(f => {
    if (data[f] !== undefined) data[f] = Number(data[f]) || 0;
  });

  // Boolean coercions
  ['isActive', 'hasVariants', 'isFeatured', 'isRecommended', 'isTrending', 'isNewArrival'].forEach(f => {
    if (data[f] !== undefined) data[f] = String(data[f]) === 'true';
  });

  // bulkPricing: ensure numeric fields
  if (Array.isArray(data.bulkPricing)) {
    data.bulkPricing = data.bulkPricing
      .filter(t => t.minQty && t.salePrice)
      .map(t => ({ minQty: Number(t.minQty), salePrice: Number(t.salePrice) }))
      .sort((a, b) => a.minQty - b.minQty);
  }

  // variants: ensure numeric fields
  if (Array.isArray(data.variants)) {
    data.variants = data.variants.map(v => ({
      ...v,
      mrp:       Number(v.mrp) || 0,
      salePrice: Number(v.salePrice) || 0,
      stock:     Number(v.stock) || 0,
      isActive:  String(v.isActive) !== 'false',
    }));
  }

  // Images from S3 upload middleware
  if (files && files.length > 0) {
    data.images = files.map(f => f.location || f.path);
  }

  return data;
}

/* ── Create Product ──────────────────────────────────────────── */
exports.createProduct = async (req, res, next) => {
  try {
    const data = parseProductBody(req.body, req.files);
    if (!data.price)     data.price     = data.salePrice || 0;
    if (!data.salePrice) data.salePrice = data.price || 0;

    const product = await Product.create(data);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
};

/* ── Update Product ──────────────────────────────────────────── */
exports.updateProduct = async (req, res, next) => {
  try {
    const update = parseProductBody(req.body, req.files);

    // Handle existing images: if existingImages field sent, merge with new uploads
    if (req.body.existingImages) {
      let existing = [];
      try { existing = JSON.parse(req.body.existingImages); } catch (_) {}
      const newUploads = req.files && req.files.length > 0
        ? req.files.map(f => f.location || f.path)
        : [];
      update.images = [...existing, ...newUploads];
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) { next(err); }
};

/* ── Delete Product ──────────────────────────────────────────── */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    for (const imageUrl of product.images) {
      await deleteFile(imageUrl).catch(() => {});
    }
    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) { next(err); }
};

/* ── Duplicate Product ───────────────────────────────────────── */
exports.duplicateProduct = async (req, res, next) => {
  try {
    const original = await Product.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Strip unique / auto fields
    delete original._id;
    delete original.__v;
    delete original.createdAt;
    delete original.updatedAt;
    delete original.slug; // Will auto-generate from name

    original.name   = `${original.name} (Copy)`;
    original.sku    = original.sku ? `${original.sku}-COPY` : '';
    original.stock  = 0;
    original.isActive = false; // Keep inactive until admin reviews

    if (Array.isArray(original.variants)) {
      original.variants = original.variants.map(v => ({ ...v, _id: undefined, stock: 0 }));
    }

    const newProduct = await Product.create(original);
    res.status(201).json({ success: true, data: newProduct, message: 'Product duplicated. Review and activate it.' });
  } catch (err) { next(err); }
};
