const mongoose = require('mongoose');
require('dotenv').config();
const Product = require('./src/models/Product');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const products = await Product.find().select('name isActive category').limit(5);
  console.log("Sample:", products);
  process.exit(0);
}).catch(console.error);
