const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const ctrl = require('../controllers/analytics.controller');

// All analytics routes — admin only
router.use(protect, adminOnly);

router.get('/dashboard', ctrl.getDashboardOverview);
router.get('/sales', ctrl.getSalesAnalytics);
router.get('/users', ctrl.getUserAnalytics);
router.get('/abandoned-carts', ctrl.getAbandonedCartAnalytics);
router.get('/low-stock', ctrl.getLowStockAlerts);
router.get('/products', ctrl.getProductPerformance);
router.get('/trends', ctrl.getOrderTrends);
router.get('/geography', ctrl.getGeographyAnalytics);
router.get('/peak-hours', ctrl.getPeakHoursAnalytics);
router.get('/dead-stock', ctrl.getDeadStockAnalytics);

module.exports = router;
