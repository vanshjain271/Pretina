const router = require('express').Router();
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const Product = require('../models/Product');

// GET my orders (customer)
router.get('/my', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id })
        .populate('items.product', 'name images')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Order.countDocuments({ user: req.user._id }),
    ]);
    res.json({ success: true, data: orders, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
});

// GET single order (customer can only see their own)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone')
      .populate('items.product', 'name images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    // Customer can only see own orders
    if (req.user.role === 'customer' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// POST create order (customer)
router.post('/', protect, async (req, res, next) => {
  try {
    const { shippingAddressId, paymentMethod, couponCode, customerNote } = req.body;

    const settings = await Settings.findById('global');

    // Validate payment method is enabled
    if (paymentMethod === 'razorpay' && !settings?.paymentRazorpayEnabled) {
      return res.status(400).json({ success: false, message: 'Razorpay is currently disabled.' });
    }
    if (paymentMethod === 'qr_upi' && !settings?.paymentQrEnabled) {
      return res.status(400).json({ success: false, message: 'QR/UPI payment is currently disabled.' });
    }
    if (paymentMethod === 'cod' && !settings?.paymentCodEnabled) {
      return res.status(400).json({ success: false, message: 'Cash on delivery is currently disabled.' });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // Validate stock and build items
    const items = [];
    let subtotal = 0;
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product || !product.isActive) {
        return res.status(400).json({ success: false, message: `Product ${cartItem.product.name} is no longer available.` });
      }

      let price = product.salePrice;
      let stockField = product.stock;

      if (cartItem.variantId) {
        const variant = product.variants.id(cartItem.variantId);
        if (!variant) return res.status(400).json({ success: false, message: 'Variant not found.' });
        price = variant.price;
        stockField = variant.stock;
      }

      if (stockField < cartItem.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });
      }

      const total = price * cartItem.quantity;
      subtotal += total;
      items.push({
        product: product._id,
        name: product.name,
        image: product.images[0] || '',
        variantId: cartItem.variantId,
        variantName: cartItem.variantName,
        price,
        mrp: product.price,
        quantity: cartItem.quantity,
        total,
      });
    }

    // Get shipping address
    const shippingAddress = req.user.addresses.id(shippingAddressId);
    if (!shippingAddress) {
      return res.status(400).json({ success: false, message: 'Shipping address not found.' });
    }

    // Apply coupon
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (couponDoc) {
        discount = couponDoc.type === 'percentage'
          ? Math.round((subtotal * couponDoc.value) / 100)
          : couponDoc.value;
        if (couponDoc.maxDiscount > 0) discount = Math.min(discount, couponDoc.maxDiscount);
        couponDoc.usedCount += 1;
        couponDoc.usedBy.push(req.user._id);
        await couponDoc.save();
      }
    }

    // Delivery fee
    const deliveryFee = settings?.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove
      ? 0
      : (settings?.deliveryFee || 0);

    const total = subtotal - discount + deliveryFee;

    // Create order
    const order = await Order.create({
      user: req.user._id,
      items,
      subtotal,
      discount,
      deliveryFee,
      total,
      coupon: couponDoc?._id,
      couponCode: couponDoc?.code || '',
      shippingAddress: {
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country,
      },
      paymentMethod,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
      customerNote: customerNote || '',
      statusHistory: [{ status: 'pending', note: 'Order placed.' }],
    });

    // Clear cart
    cart.items = [];
    cart.coupon = undefined;
    cart.couponCode = '';
    await cart.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

// PATCH update order status (admin/staff)
router.patch('/:id/status', protect, staffOnly, async (req, res, next) => {
  try {
    const { status, note, trackingNumber, courierName } = req.body;
    const update = {
      status,
      $push: { statusHistory: { status, note: note || '', updatedBy: req.user._id } },
    };
    if (trackingNumber) update.trackingNumber = trackingNumber;
    if (courierName) update.courierName = courierName;
    if (status === 'delivered') update.paymentStatus = 'paid';

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name phone fcmToken');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// GET all orders (admin/staff)
router.get('/', protect, staffOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, paymentStatus } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name phone')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders, pagination: { total, page: Number(page), limit: Number(limit) } });
  } catch (err) { next(err); }
});

module.exports = router;
