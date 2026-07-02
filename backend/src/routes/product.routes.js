const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const { upload } = require('../services/s3.service');

// ── Public Routes ─────────────────────────────────────────
// NOTE: specific routes must come BEFORE /:id
router.get('/homepage', ctrl.getHomepageProducts);   // Dynamic randomized sections
router.get('/search',   ctrl.searchProducts);         // Full-text search
router.get('/',         ctrl.getProducts);             // Paginated list
router.get('/:id',      ctrl.getProduct);              // Single product

// ── Staff/Admin Routes ────────────────────────────────────
const setUploadFolder = (folder) => (req, res, next) => {
  req.uploadFolder = folder;
  next();
};

router.post(
  '/',
  protect, staffOnly,
  setUploadFolder('products'),
  upload.array('images', 8),
  ctrl.createProduct
);

router.put(
  '/:id',
  protect, staffOnly,
  setUploadFolder('products'),
  upload.array('images', 8),
  ctrl.updateProduct
);

router.delete('/:id', protect, adminOnly, ctrl.deleteProduct);

module.exports = router;
