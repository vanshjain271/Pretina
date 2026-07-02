const router = require('express').Router();
const { protect, staffOnly, adminOnly } = require('../middleware/auth');
const Alert = require('../models/Alert');

// GET active alerts (public — mobile marquee)
router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const alerts = await Alert.find({
      isActive: true,
      $or: [
        { startDate: { $lte: now }, endDate: { $gte: now } },
        { startDate: null, endDate: null },
      ],
    }).sort({ priority: -1 });
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
});

router.get('/all', protect, staffOnly, async (req, res, next) => {
  try {
    const alerts = await Alert.find().sort({ priority: -1 });
    res.json({ success: true, data: alerts });
  } catch (err) { next(err); }
});

router.post('/', protect, staffOnly, async (req, res, next) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json({ success: true, data: alert });
  } catch (err) { next(err); }
});

router.put('/:id', protect, staffOnly, async (req, res, next) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found.' });
    res.json({ success: true, data: alert });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Alert deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
