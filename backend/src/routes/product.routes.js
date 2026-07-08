const router = require('express').Router();
const ctrl = require('../controllers/product.controller');
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const { upload } = require('../services/s3.service');

// ── Cache Middleware ──────────────────────────────────────
const setListCache = (req, res, next) => { res.set('Cache-Control', 'private, max-age=60'); next(); };
const setItemCache = (req, res, next) => { res.set('Cache-Control', 'private, max-age=300'); next(); };

// ── Public Routes ─────────────────────────────────────────
// NOTE: specific routes must come BEFORE /:id
router.get('/homepage', setListCache, ctrl.getHomepageProducts);   // Dynamic randomized sections
router.get('/search',   setListCache, ctrl.searchProducts);         // Full-text search
router.get('/',         setListCache, ctrl.getProducts);             // Paginated list
router.get('/:id',      setItemCache, ctrl.getProduct);              // Single product

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

// ── Additional Admin Routes ───────────────────────────────
router.post('/:id/duplicate', protect, staffOnly, ctrl.duplicateProduct);    // Clone a product
router.get('/admin/low-stock', protect, staffOnly, ctrl.getLowStockProducts); // Low stock alert

module.exports = router;

