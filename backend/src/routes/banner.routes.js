const router = require('express').Router();
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const { upload, deleteFile } = require('../services/s3.service');
const Banner = require('../models/Banner');

const setFolder = (f) => (req, res, next) => { req.uploadFolder = f; next(); };

// GET active banners (public — used by mobile app)
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const query = {
      isActive: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
      ],
    };
    const banners = await Banner.find(query).sort({ sortOrder: 1 });
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
});

// GET all banners including inactive (admin)
router.get('/all', protect, staffOnly, async (req, res, next) => {
  try {
    const banners = await Banner.find().sort({ sortOrder: 1 });
    res.json({ success: true, data: banners });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOnly, setFolder('banners'), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Banner image is required.' });
    const banner = await Banner.create({ ...req.body, image: req.file.location });
    res.status(201).json({ success: true, data: banner });
  } catch (err) { next(err); }
});

router.put('/:id', protect, staffOnly, setFolder('banners'), upload.single('image'), async (req, res, next) => {
  try {
    const update = { ...req.body };
    if (req.file) update.image = req.file.location;
    const banner = await Banner.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    res.json({ success: true, data: banner });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const banner = await Banner.findById(req.params.id);
    if (!banner) return res.status(404).json({ success: false, message: 'Banner not found.' });
    await deleteFile(banner.image);
    await banner.deleteOne();
    res.json({ success: true, message: 'Banner deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
