const router = require('express').Router();
const { protect, staffOnly } = require('../middleware/auth');
const { upload } = require('../services/s3.service');

const setFolder = (f) => (req, res, next) => { req.uploadFolder = f; next(); };

// POST upload single image — for general use
router.post('/image',
  protect, staffOnly,
  setFolder('general'),
  upload.single('image'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    res.json({ success: true, url: req.file.location });
  }
);

// POST upload QR code image
router.post('/qr',
  protect, staffOnly,
  setFolder('qr'),
  upload.single('qr'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    res.json({ success: true, url: req.file.location });
  }
);

// POST upload payment proof (customer)
router.post('/payment-proof',
  protect,
  setFolder('payment-proofs'),
  upload.single('proof'),
  (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded.' });
    res.json({ success: true, url: req.file.location });
  }
);

module.exports = router;
