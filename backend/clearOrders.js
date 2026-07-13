const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const Cart = require('./src/models/Cart');
const Notification = require('./src/models/Notification');
require('dotenv').config();

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const orderRes = await Order.deleteMany({});
    console.log(`Deleted ${orderRes.deletedCount} orders`);

    const cartRes = await Cart.updateMany({}, { $set: { items: [], totalAmount: 0 } });
    console.log(`Cleared items from ${cartRes.modifiedCount} carts`);

    const notifRes = await Notification.deleteMany({ title: /Order/i });
    console.log(`Deleted ${notifRes.deletedCount} order notifications`);

    console.log('Done!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

clearData();
