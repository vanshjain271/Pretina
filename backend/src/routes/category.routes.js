const router = require('express').Router();
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const { upload } = require('../services/s3.service');
const Category = require('../models/Category');
const { deleteFile } = require('../services/s3.service');

const setFolder = (f) => (req, res, next) => { req.uploadFolder = f; next(); };

// ── Cache Middleware ──────────────────────────────────────
const setCache = (req, res, next) => { res.set('Cache-Control', 'private, max-age=300'); next(); };

// GET all active categories (public)
router.get('/', setCache, async (req, res, next) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: categories });
  } catch (err) { next(err); }
});

// GET single category
router.get('/:id', setCache, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
});

// POST create (admin)
router.post('/', protect, staffOnly, setFolder('categories'), upload.single('image'), async (req, res, next) => {
  try {
    const image = req.file?.location || '';
    const category = await Category.create({ ...req.body, image });
    res.status(201).json({ success: true, data: category });
  } catch (err) { next(err); }
});

// PUT update (admin)
router.put('/:id', protect, staffOnly, setFolder('categories'), upload.single('image'), async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (req.file) update.image = req.file.location;
    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    res.json({ success: true, data: category });
  } catch (err) { next(err); }
});

// DELETE (admin)
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found.' });
    if (category.image) await deleteFile(category.image);
    await category.deleteOne();
    res.json({ success: true, message: 'Category deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
