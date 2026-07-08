const router = require('express').Router();
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const { upload, deleteFile } = require('../services/s3.service');
const Brand = require('../models/Brand');

const setFolder = (f) => (req, res, next) => { req.uploadFolder = f; next(); };

// ── Cache Middleware ──────────────────────────────────────
const setCache = (req, res, next) => { res.set('Cache-Control', 'private, max-age=300'); next(); };

router.get('/', setCache, async (req, res, next) => {
  try {
    const brands = await Brand.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    res.json({ success: true, data: brands });
  } catch (err) { next(err); }
});

router.get('/:id', setCache, async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found.' });
    res.json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOnly, setFolder('brands'), upload.single('logo'), async (req, res, next) => {
  try {
    const logo = req.file?.location || '';
    const brand = await Brand.create({ ...req.body, logo });
    res.status(201).json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.put('/:id', protect, staffOnly, setFolder('brands'), upload.single('logo'), async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (req.file) update.logo = req.file.location;
    const brand = await Brand.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found.' });
    res.json({ success: true, data: brand });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ success: false, message: 'Brand not found.' });
    if (brand.logo) await deleteFile(brand.logo);
    await brand.deleteOne();
    res.json({ success: true, message: 'Brand deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
