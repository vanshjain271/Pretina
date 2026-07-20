const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const ctrl = require('../controllers/payment.controller');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../services/s3.service');

const setFolder = (f) => (req, res, next) => { req.uploadFolder = f; next(); };

// Rate limit: max 10 payment requests per minute per IP
const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many payment requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Razorpay
router.post('/razorpay/create-order', paymentLimiter, protect, ctrl.createRazorpayOrder);
router.post('/razorpay/verify',       paymentLimiter, protect, ctrl.verifyRazorpayPayment);
router.post('/razorpay/failed',       protect, ctrl.markPaymentFailed);

// QR / UPI
router.post('/qr/submit-proof',
  protect,
  setFolder('payment-proofs'),
  upload.single('proof'),
  ctrl.submitQrProof
);
router.post('/qr/confirm', protect, adminOnly, ctrl.confirmQrPayment);

module.exports = router;
