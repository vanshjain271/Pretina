/**
 * Order Routes — Pretina
 * Full YouthQit feature parity:
 *  - Bulk pricing auto-applied on order creation
 *  - FCM + SMS notifications on status change
 *  - Admin: edit order, bulk status update, delete order
 */

const router = require('express').Router();
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Settings = require('../models/Settings');
const Product = require('../models/Product');
const NotificationService = require('../services/notification.service');
const SMSService = require('../services/sms.service');

/* ── UTILITY: Resolve bulk-pricing tier ──────────────────────────
   Mirrors YouthQit's cart.service.js bulk pricing logic.
   Sorted by minQty DESC so the highest qualifying tier wins.
   ──────────────────────────────────────────────────────────── */
function resolvePrice(product, basePrice, qty) {
  if (!product.bulkPricing || product.bulkPricing.length === 0) return Number(basePrice);
  const applicableTier = [...product.bulkPricing]
    .sort((a, b) => b.minQty - a.minQty)
    .find(t => qty >= t.minQty);
  return applicableTier ? Number(applicableTier.salePrice) : Number(basePrice);
}

/* ─────────────────────────────────────────────────────────────────
   CUSTOMER ROUTES
   ───────────────────────────────────────────────────────────── */

// GET /orders/my  — customer's own orders
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

// POST /orders  — customer creates order from cart
router.post('/', protect, async (req, res, next) => {
  try {
    const { shippingAddressId, paymentMethod, couponCode, customerNote } = req.body;

    const settings = await Settings.findById('global');

    // Validate payment method
    if (paymentMethod === 'razorpay' && !settings?.paymentRazorpayEnabled)
      return res.status(400).json({ success: false, message: 'Razorpay is currently disabled.' });
    if (paymentMethod === 'qr_upi' && !settings?.paymentQrEnabled)
      return res.status(400).json({ success: false, message: 'QR/UPI payment is currently disabled.' });
    if (paymentMethod === 'cod' && !settings?.paymentCodEnabled)
      return res.status(400).json({ success: false, message: 'Cash on delivery is currently disabled.' });

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ success: false, message: 'Cart is empty.' });

    // Build order items with stock check and bulk pricing
    const items = [];
    let subtotal = 0;
    for (const cartItem of cart.items) {
      const product = cartItem.product;
      if (!product || !product.isActive)
        return res.status(400).json({ success: false, message: `Product is no longer available.` });

      let basePrice = Number(product.salePrice);
      let stockField = Number(product.stock);
      let variantName = '';

      if (cartItem.variantId) {
        const variant = product.variants.id(cartItem.variantId);
        if (!variant) return res.status(400).json({ success: false, message: 'Variant not found.' });
        basePrice = Number(variant.salePrice) || Number(product.salePrice);
        stockField = Number(variant.stock);
        // Build variant display name
        const parts = [];
        if (variant.name) parts.push(variant.name);
        if (variant.color) parts.push(variant.color);
        variantName = parts.join(' / ');
      }

      // ── Apply bulk pricing tier ────────────────────────────────
      const price = resolvePrice(product, basePrice, cartItem.quantity);

      if (stockField < cartItem.quantity)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}.` });

      const total = price * cartItem.quantity;
      subtotal += total;
      items.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0] || '',
        variantId: cartItem.variantId,
        variantName: variantName || cartItem.variantName || '',
        price,
        mrp: product.price || product.salePrice,
        quantity: cartItem.quantity,
        total,
      });
    }

    // Shipping address
    const shippingAddress = req.user.addresses.id(shippingAddressId);
    if (!shippingAddress)
      return res.status(400).json({ success: false, message: 'Shipping address not found.' });

    // Coupon
    let discount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (couponDoc) {
        discount = couponDoc.type === 'percentage'
          ? Math.round((subtotal * couponDoc.value) / 100)
          : couponDoc.value;
        if (couponDoc.maxDiscount > 0) discount = Math.min(discount, couponDoc.maxDiscount);
        couponDoc.usedCount = (couponDoc.usedCount || 0) + 1;
        if (!couponDoc.usedBy) couponDoc.usedBy = [];
        couponDoc.usedBy.push(req.user._id);
        await couponDoc.save();
      }
    }

    // Delivery fee
    const deliveryFee = settings?.freeDeliveryAbove > 0 && subtotal >= settings.freeDeliveryAbove
      ? 0
      : (settings?.deliveryFee || 0);

    const total = Math.max(0, subtotal - discount + deliveryFee);

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
        line2: shippingAddress.line2 || '',
        city: shippingAddress.city,
        state: shippingAddress.state,
        pincode: shippingAddress.pincode,
        country: shippingAddress.country || 'India',
      },
      paymentMethod,
      paymentStatus: 'pending',
      customerNote: customerNote || '',
      statusHistory: [{ status: 'pending', note: 'Order placed by customer.', updatedBy: req.user._id }],
    });

    // Clear cart
    cart.items = [];
    cart.coupon = undefined;
    cart.couponCode = '';
    await cart.save();

    // Notify admins of new order (async, non-blocking)
    NotificationService.notifyAdmins(
      '🛒 New Order!',
      `Order ${order.orderNumber} placed for ₹${order.total}.`,
      { type: 'NEW_ORDER', orderId: String(order._id) }
    ).catch(e => console.error('[order.routes] Admin notify failed:', e.message));

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

/* ─────────────────────────────────────────────────────────────────
   ADMIN / STAFF ROUTES
   ───────────────────────────────────────────────────────────── */

// GET /orders  — all orders list (admin/staff)
router.get('/', protect, staffOnly, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, paymentStatus, search, dateFrom, dateTo } = req.query;
    const filter = {};
    if (status)        filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo)   filter.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
    }
    if (search) {
      filter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        { 'shippingAddress.phone': { $regex: search, $options: 'i' } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('user', 'name phone email')
        .sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
      Order.countDocuments(filter),
    ]);
    res.json({ success: true, data: orders, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) } });
  } catch (err) { next(err); }
});

// GET /orders/abandoned  — abandoned carts
router.get('/abandoned', protect, staffOnly, async (req, res, next) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const thresholdTime = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const filter = {
      'items.0': { $exists: true },
      updatedAt: { $lt: thresholdTime },
    };

    if (dateFrom || dateTo) {
      filter.updatedAt = { $lt: thresholdTime }; // Base rule
      if (dateFrom) filter.updatedAt.$gte = new Date(dateFrom);
      if (dateTo) filter.updatedAt.$lte = new Date(dateTo); // Overwrite $lt if dateTo is earlier
    }

    const carts = await Cart.find(filter)
      .populate('user', 'name phone email')
      .populate('items.product', 'name price images')
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: carts });
  } catch (err) { next(err); }
});

// DELETE /orders/abandoned/:id  — dismiss abandoned cart
router.delete('/abandoned/:id', protect, staffOnly, async (req, res, next) => {
  try {
    const cart = await Cart.findByIdAndDelete(req.params.id);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.json({ success: true, message: 'Abandoned cart dismissed' });
  } catch (err) { next(err); }
});

// GET /orders/export  — CSV export
router.get('/export', protect, staffOnly, async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    const orders = await Order.find(filter).populate('user', 'name phone email').lean();
    let csv = 'Order Number,Date,Customer,Phone,Amount,Status,Payment Method\n';
    orders.forEach(o => {
      csv += `${o.orderNumber},${new Date(o.createdAt).toLocaleDateString('en-IN')},"${o.user?.name || o.shippingAddress?.name}","${o.user?.phone || o.shippingAddress?.phone}",${o.total},${o.status},${o.paymentMethod}\n`;
    });
    res.header('Content-Type', 'text/csv');
    res.attachment('orders_export.csv');
    return res.send(csv);
  } catch (err) { next(err); }
});

// GET /orders/:id  — single order (customer sees own, admin sees all)
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name phone email')
      .populate('items.product', 'name images');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (req.user.role === 'customer' && order.user._id.toString() !== req.user._id.toString())
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// PATCH /orders/:id/status  — update order status + fire notifications
router.patch('/:id/status', protect, staffOnly, async (req, res, next) => {
  try {
    const { status, note, trackingNumber, courierName, trackingUrl } = req.body;
    if (!status) return res.status(400).json({ success: false, message: '`status` is required.' });

    const update = {
      status,
      $push: { statusHistory: { status, note: note || `Status changed to ${status}`, updatedBy: req.user._id } },
    };
    if (trackingNumber) update.trackingNumber = trackingNumber;
    if (trackingUrl)    update.trackingUrl = trackingUrl;
    if (courierName)    update.courierName = courierName;
    if (status === 'delivered') update.paymentStatus = 'paid';

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('user', 'name phone fcmTokens');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // ── Notify customer (async, non-blocking) ─────────────────
    const userId = order.user?._id || order.user;
    const userPhone = order.user?.phone;

    NotificationService.sendOrderStatusNotification(userId, order, status)
      .catch(e => console.error('[order.routes] Push notify failed:', e.message));

    if (userPhone) {
      SMSService.sendOrderStatusUpdate(userPhone, order.orderNumber, status)
        .catch(e => console.error('[order.routes] SMS failed:', e.message));
    }

    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// PUT /orders/:id/edit  — admin edits order items / totals (YouthQit parity)
router.put('/:id/edit', protect, staffOnly, async (req, res, next) => {
  try {
    const { items, deliveryFee, discount, tokenReceived, adminNote } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Replace items if provided
    if (items && Array.isArray(items)) {
      order.items = items.map(item => ({
        product:    item.product,
        name:       item.name,
        image:      item.image || '',
        variantId:  item.variantId || null,
        variantName:item.variantName || '',
        price:      Number(item.price) || 0,
        mrp:        Number(item.mrp)   || Number(item.price) || 0,
        quantity:   Number(item.quantity) || 1,
        total:      (Number(item.quantity) || 1) * (Number(item.price) || 0),
      }));
    }

    // Recalculate subtotal from items
    const subtotal = order.items.reduce((sum, i) => sum + i.quantity * i.price, 0);
    order.subtotal = subtotal;

    const fee      = deliveryFee !== undefined ? Number(deliveryFee) : (order.deliveryFee || 0);
    const disc     = discount    !== undefined ? Number(discount)    : (order.discount    || 0);
    const token    = tokenReceived !== undefined ? Number(tokenReceived) : (order.tokenReceived || 0);

    order.deliveryFee    = fee;
    order.discount       = disc;
    order.tokenReceived  = token;
    order.total          = Math.max(0, subtotal + fee - disc);
    order.adminNote      = adminNote || order.adminNote || '';

    // Log the edit in statusHistory
    order.statusHistory.push({
      status: order.status,
      note: adminNote || 'Order edited by admin.',
      updatedBy: req.user._id,
    });

    await order.save();
    res.json({ success: true, data: order, message: 'Order updated successfully.' });
  } catch (err) { next(err); }
});

// POST /orders/bulk-status  — update many orders at once
router.post('/bulk-status', protect, staffOnly, async (req, res, next) => {
  try {
    const { orderIds, status, note } = req.body;
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0)
      return res.status(400).json({ success: false, message: 'orderIds array is required.' });
    if (!status)
      return res.status(400).json({ success: false, message: 'status is required.' });

    let updated = 0, failed = 0;
    const errors = [];

    for (const id of orderIds) {
      try {
        const upd = {
          status,
          $push: { statusHistory: { status, note: note || `Bulk update to ${status}`, updatedBy: req.user._id } },
        };
        if (status === 'delivered') upd.paymentStatus = 'paid';
        const o = await Order.findByIdAndUpdate(id, upd, { new: true });
        if (!o) { failed++; errors.push({ id, error: 'Order not found' }); continue; }
        updated++;
      } catch (e) {
        failed++;
        errors.push({ id, error: e.message });
      }
    }

    res.json({ success: true, message: `${updated} updated, ${failed} failed`, results: { updated, failed, errors } });
  } catch (err) { next(err); }
});

// PATCH /orders/:id/courier  — set courier / tracking info
router.patch('/:id/courier', protect, staffOnly, async (req, res, next) => {
  try {
    const { courierName, trackingNumber, trackingUrl } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { courierName, trackingNumber, trackingUrl },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// PATCH /orders/:id/token  — set token/advance received
router.patch('/:id/token', protect, staffOnly, async (req, res, next) => {
  try {
    const { tokenReceived } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { tokenReceived, $push: { statusHistory: { status: (await Order.findById(req.params.id))?.status, note: `Token received: ₹${tokenReceived}`, updatedBy: req.user._id } } },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
});

// DELETE /orders/:id  — admin delete order
router.delete('/:id', protect, adminOnly, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    await order.deleteOne();
    res.json({ success: true, message: 'Order deleted.' });
  } catch (err) { next(err); }
});

// POST /orders/manual  — admin creates manual order for a customer
router.post('/manual', protect, staffOnly, async (req, res, next) => {
  try {
    const { customerId, items, shippingAddress, paymentMethod, discount = 0, deliveryFee = 0, adminNote } = req.body;

    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) continue;

      // Resolve bulk pricing based on quantity ordered
      const basePrice = Number(item.price) || Number(product.salePrice);
      const price = resolvePrice(product, basePrice, item.quantity);
      const total = price * Number(item.quantity);
      subtotal += total;

      orderItems.push({
        product:    product._id,
        name:       product.name,
        image:      product.images?.[0] || '',
        variantId:  item.variantId || null,
        variantName:item.variantName || '',
        price,
        mrp:        product.price || product.salePrice,
        quantity:   Number(item.quantity),
        total,
      });
    }

    const total = Math.max(0, subtotal - Number(discount) + Number(deliveryFee));

    const order = await Order.create({
      user: customerId,
      items: orderItems,
      subtotal,
      discount: Number(discount),
      deliveryFee: Number(deliveryFee),
      total,
      shippingAddress,
      paymentMethod,
      paymentStatus: 'pending',
      adminNote: adminNote || '',
      statusHistory: [{
        status: 'pending',
        note: 'Manual order created by admin.',
        updatedBy: req.user._id,
      }],
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) { next(err); }
});

module.exports = router;
