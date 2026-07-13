const mongoose = require('mongoose');
const Cart = require('./src/models/Cart');
require('dotenv').config();

const testCart = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const thresholdTime = new Date(Date.now() - 3 * 60 * 1000);
    const carts = await Cart.find({ 'items.0': { $exists: true } });
    console.log("ALL CARTS WITH ITEMS:");
    carts.forEach(c => {
      console.log(`Cart ID: ${c._id}, updatedAt: ${c.updatedAt}, Items: ${c.items.length}, isAbandoned (updatedAt < threshold): ${c.updatedAt < thresholdTime}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

testCart();
