const router = require('express').Router();
const { protect, staffOnly, adminOnly } = require('../middleware/auth');
const Coupon = require('../models/Coupon');

// POST validate coupon (customer applies at checkout)
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;
    const coupon = await Coupon.findOne({ code: code?.toUpperCase(), isActive: true });

    if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code.' });

    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      return res.status(400).json({ success: false, message: 'Coupon is not yet active.' });
    }
    if (coupon.endDate && now > coupon.endDate) {
      return res.status(400).json({ success: false, message: 'Coupon has expired.' });
    }
    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: 'Coupon usage limit reached.' });
    }
    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({
        success: false,
        message: `Minimum order value ₹${coupon.minOrderValue} required for this coupon.`,
      });
    }

    const alreadyUsed = coupon.usedBy.some(uid => uid.toString() === req.user._id.toString());
    if (alreadyUsed && coupon.perUserLimit === 1) {
      return res.status(400).json({ success: false, message: 'You have already used this coupon.' });
    }

    // Calculate discount
    let discount = coupon.type === 'percentage'
      ? Math.round((cartTotal * coupon.value) / 100)
      : coupon.value;
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);

    res.json({ success: true, coupon, discount });
  } catch (err) { next(err); }
});

// GET all (admin)
router.get('/', protect, staffOnly, async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, data: coupons });
  } catch (err) { next(err); }
});

router.post('/', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found.' });
    res.json({ success: true, data: coupon });
  } catch (err) { next(err); }
});

router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Coupon deleted.' });
  } catch (err) { next(err); }
});

module.exports = router;
