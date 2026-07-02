const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { protect, adminOnly } = require('../middleware/auth');
const { upload } = require('../services/s3.service');

const setFolder = (f) => (req, res, next) => { req.uploadFolder = f; next(); };

// Razorpay
router.post('/razorpay/create-order', protect, ctrl.createRazorpayOrder);
router.post('/razorpay/verify',       protect, ctrl.verifyRazorpayPayment);

// QR / UPI
router.post('/qr/submit-proof',
  protect,
  setFolder('payment-proofs'),
  upload.single('proof'),
  ctrl.submitQrProof
);
router.post('/qr/confirm', protect, adminOnly, ctrl.confirmQrPayment);

module.exports = router;
