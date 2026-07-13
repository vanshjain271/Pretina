require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB.");
    
    // Create a temporary schema for Product
    const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
    const products = await Product.find({}).limit(5).select('name images');
    console.log("Products:");
    products.forEach(p => console.log(p.name, p.images));

    mongoose.disconnect();
  })
  .catch(err => {
    console.error("Connection error:", err);
  });
