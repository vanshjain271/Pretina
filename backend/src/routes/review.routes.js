const router = require('express').Router();
const Review = require('../models/Review');
const Product = require('../models/Product');

// Add a review (public/customer)
router.post('/', async (req, res) => {
  try {
    const { product, name, rating, comment, isVerifiedPurchase } = req.body;
    
    // Check if product exists
    const prod = await Product.findById(product);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const review = new Review({
      product,
      name: name || 'Anonymous',
      rating,
      comment,
      isVerifiedPurchase: isVerifiedPurchase || false
    });

    await review.save();
    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get all reviews (admin)
router.get('/', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name images sku')
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get approved reviews for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, status: 'APPROVED' })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update review status (admin)
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    res.status(200).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete a review (admin)
router.delete('/:id', async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
