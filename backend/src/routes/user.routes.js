const router = require('express').Router();
const { protect, adminOnly } = require('../middleware/auth');
const User = require('../models/User');

// GET my profile
router.get('/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// PUT update my profile
router.put('/me', protect, async (req, res, next) => {
  try {
    const allowedFields = ['name', 'photo', 'fcmToken'];
    const update = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true, runValidators: true });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// POST add address
router.post('/me/addresses', protect, async (req, res, next) => {
  try {
    const user = req.user;
    if (req.body.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }
    user.addresses.push(req.body);
    await user.save();
    res.status(201).json({ success: true, data: user.addresses });
  } catch (err) { next(err); }
});

// PUT update address
router.put('/me/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = req.user;
    const address = user.addresses.id(req.params.addressId);
    if (!address) return res.status(404).json({ success: false, message: 'Address not found.' });
    if (req.body.isDefault) {
      user.addresses.forEach(a => { a.isDefault = false; });
    }
    Object.assign(address, req.body);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) { next(err); }
});

// DELETE address
router.delete('/me/addresses/:addressId', protect, async (req, res, next) => {
  try {
    const user = req.user;
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ success: true, data: user.addresses });
  } catch (err) { next(err); }
});

// POST toggle wishlist
router.post('/me/wishlist/:productId', protect, async (req, res, next) => {
  try {
    const user = req.user;
    const productId = req.params.productId;
    const index = user.wishlist.findIndex(id => id.toString() === productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    res.json({ success: true, data: user.wishlist, inWishlist: index === -1 });
  } catch (err) { next(err); }
});

// GET all users — Admin only
router.get('/', protect, adminOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = { role: 'customer' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    res.json({ success: true, data: users, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
});

// GET single user — Admin only
router.get('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PUT update user (Customer Details Edit) — Admin only
router.put('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'email', 'type', 'gstNo', 'isAffiliate', 'blockCod'];
    const update = {};
    allowedFields.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// PATCH toggle user status — Admin only
router.patch('/:id/toggle', protect, adminOnly, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

module.exports = router;
