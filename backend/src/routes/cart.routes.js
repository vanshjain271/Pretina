const router = require('express').Router();
const { protect } = require('../middleware/auth');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name images price salePrice hasVariants variants isActive isInStock');
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

// GET cart
router.get('/', protect, async (req, res, next) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ success: true, data: cart });
  } catch (err) { next(err); }
});

// POST add to cart
router.post('/items', protect, async (req, res, next) => {
  try {
    const { productId, quantity = 1, variantId, variantName } = req.body;
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    let price = product.salePrice;
    if (variantId) {
      const variant = product.variants.id(variantId);
      if (!variant) return res.status(400).json({ success: false, message: 'Variant not found.' });
      price = variant.price;
    }

    const cart = await getOrCreateCart(req.user._id);

    // Check if item already in cart
    const existingIdx = cart.items.findIndex(i =>
      i.product._id?.toString() === productId &&
      (variantId ? i.variantId?.toString() === variantId : !i.variantId)
    );

    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity;
      cart.items[existingIdx].price = price;
    } else {
      cart.items.push({ product: productId, quantity, price, variantId, variantName: variantName || '' });
    }

    await cart.save();
    const populated = await getOrCreateCart(req.user._id);
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// PATCH update cart item quantity
router.patch('/items/:itemId', protect, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
    const item = cart.items.id(req.params.itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found.' });
    if (quantity <= 0) {
      cart.items.pull(req.params.itemId);
    } else {
      item.quantity = quantity;
    }
    await cart.save();
    const populated = await getOrCreateCart(req.user._id);
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// DELETE remove item
router.delete('/items/:itemId', protect, async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
    cart.items.pull(req.params.itemId);
    await cart.save();
    const populated = await getOrCreateCart(req.user._id);
    res.json({ success: true, data: populated });
  } catch (err) { next(err); }
});

// DELETE clear cart
router.delete('/', protect, async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [], coupon: undefined, couponCode: '' });
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) { next(err); }
});

module.exports = router;
