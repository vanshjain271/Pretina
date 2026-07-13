const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const Settings = require('../models/Settings');

const getRazorpayInstance = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * POST /api/v1/payments/razorpay/create-order
 * Creates a Razorpay order. Called before opening the Razorpay payment sheet.
 */
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const settings = await Settings.findById('global');
    if (!settings?.paymentRazorpayEnabled) {
      return res.status(400).json({ success: false, message: 'Razorpay payments are currently disabled.' });
    }

    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    let amountToPay = Math.round(order.total * 100);
    
    if (order.paymentMethod === 'partial_razorpay') {
      let advanceAmount = 0;
      if (settings.codAdvanceType === 'percentage') {
        advanceAmount = (order.total * (settings.codAdvancePercentage || 10)) / 100;
      } else {
        advanceAmount = settings.codAdvanceFixedAmount || 0;
      }
      amountToPay = Math.round(advanceAmount * 100);
    }

    const razorpayOrder = await getRazorpayInstance().orders.create({
      amount: amountToPay, // Razorpay expects paise
      currency: 'INR',
      receipt: order.orderNumber,
    });

    // Save Razorpay order ID to our order
    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/payments/razorpay/verify
 * Verifies the Razorpay signature after payment completion.
 */
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    let order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    // Update order status
    const isPartial = order.paymentMethod === 'partial_razorpay';
    const newPaymentStatus = isPartial ? 'advance_paid' : 'paid';
    
    // If it was partial, let's also update the tokenReceived amount so admin knows how much was paid
    let updateFields = {
      paymentStatus: newPaymentStatus,
      status: 'confirmed',
      razorpayPaymentId: razorpay_payment_id,
      $push: { statusHistory: { status: 'confirmed', note: `Payment received via Razorpay (${isPartial ? 'Advance' : 'Full'}).` } },
    };
    
    if (isPartial) {
      // Calculate what they paid based on Razorpay verification (we could also check razorpay order amount but we know it's the advance)
      let advanceAmount = 0;
      const settings = await Settings.findById('global');
      if (settings.codAdvanceType === 'percentage') {
        advanceAmount = (order.total * (settings.codAdvancePercentage || 10)) / 100;
      } else {
        advanceAmount = settings.codAdvanceFixedAmount || 0;
      }
      updateFields.tokenReceived = advanceAmount;
    }

    order = await Order.findByIdAndUpdate(
      orderId,
      updateFields,
      { new: true }
    );

    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/payments/qr/submit-proof
 * Customer uploads UPI payment screenshot for manual admin verification.
 */
exports.submitQrProof = async (req, res, next) => {
  try {
    const settings = await Settings.findById('global');
    if (!settings?.paymentQrEnabled) {
      return res.status(400).json({ success: false, message: 'QR/UPI payments are currently disabled.' });
    }

    const { orderId, upiTransactionId } = req.body;
    const proofUrl = req.file?.location;

    if (!proofUrl) {
      return res.status(400).json({ success: false, message: 'Payment proof image is required.' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    order.upiTransactionId = upiTransactionId || '';
    order.upiPaymentProof = proofUrl;
    order.paymentStatus = 'advance_paid'; // Admin will confirm
    order.statusHistory.push({ status: order.status, note: 'UPI payment proof submitted. Awaiting admin confirmation.' });
    await order.save();

    res.json({ success: true, message: 'Payment proof submitted. Admin will confirm shortly.', order });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/payments/qr/confirm — Admin only
 * Admin confirms the QR/UPI payment after verifying the screenshot.
 */
exports.confirmQrPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: 'paid',
        status: 'confirmed',
        $push: { statusHistory: { status: 'confirmed', note: 'QR/UPI payment confirmed by admin.', updatedBy: req.user._id } },
      },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
