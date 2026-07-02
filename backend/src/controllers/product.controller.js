const Product = require('../models/Product');
const { deleteFile } = require('../services/s3.service');

/**
 * GET /api/v1/products/homepage
 * Returns randomized products for each home page section.
 * Called every time the app opens or pull-to-refreshes.
 */
exports.getHomepageProducts = async (req, res, next) => {
  try {
    const LIMIT = 12; // Products per section

    const [featured, recommended, trending, newArrivals] = await Promise.all([
      Product.aggregate([
        { $match: { isFeatured: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
        { $unwind: { path: '$category', preserveNullAndEmpty: true } },
        { $unwind: { path: '$brand', preserveNullAndEmpty: true } },
      ]),
      Product.aggregate([
        { $match: { isRecommended: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
        { $unwind: { path: '$category', preserveNullAndEmpty: true } },
        { $unwind: { path: '$brand', preserveNullAndEmpty: true } },
      ]),
      Product.aggregate([
        { $match: { isTrending: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
        { $unwind: { path: '$category', preserveNullAndEmpty: true } },
        { $unwind: { path: '$brand', preserveNullAndEmpty: true } },
      ]),
      Product.aggregate([
        { $match: { isNewArrival: true, isActive: true } },
        { $sample: { size: LIMIT } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $lookup: { from: 'brands', localField: 'brand', foreignField: '_id', as: 'brand' } },
        { $unwind: { path: '$category', preserveNullAndEmpty: true } },
        { $unwind: { path: '$brand', preserveNullAndEmpty: true } },
      ]),
    ]);

    res.json({
      success: true,
      data: { featured, recommended, trending, newArrivals },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/products
 * List products with filtering, sorting, and pagination.
 */
exports.getProducts = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20,
      category, brand, search,
      minPrice, maxPrice,
      sortBy = 'createdAt', sortOrder = 'desc',
      inStock,
    } = req.query;

    const filter = { isActive: true };
    if (category)  filter.category = category;
    if (brand)     filter.brand = brand;
    if (inStock === 'true') filter.isInStock = true;
    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$text = { $search: search };
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
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/products/search
 * Server-side full-text search.
 */
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
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/products/:id
 */
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name image slug')
      .populate('brand', 'name logo');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/products — Admin only
 */
exports.createProduct = async (req, res, next) => {
  try {
    // Images come from S3 upload middleware as req.files
    const images = req.files ? req.files.map(f => f.location) : [];
    const product = await Product.create({ ...req.body, images });
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/products/:id — Admin only
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (req.files && req.files.length > 0) {
      update.images = req.files.map(f => f.location);
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/products/:id — Admin only
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    // Delete images from S3
    for (const imageUrl of product.images) {
      await deleteFile(imageUrl);
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    next(err);
  }
};
