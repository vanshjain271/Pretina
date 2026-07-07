const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getInvoices, getInvoice, generateInvoice, getActivityLog } = require('../controllers/invoice.controller');

router.use(protect, adminOnly);

router.get('/', getInvoices);
router.get('/activity-log', getActivityLog);
router.get('/:id', getInvoice);
router.post('/generate/:orderId', generateInvoice);

module.exports = router;
