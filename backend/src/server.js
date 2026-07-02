const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// ── Security Middleware ──────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://admin.pretina.in', 'https://pretina.in']
    : '*',
  credentials: true,
}));

// ── Rate Limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Body Parsing ─────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Database Connection ──────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// ── API Routes ───────────────────────────────────────────
app.use('/api/v1/auth',       require('./routes/auth.routes'));
app.use('/api/v1/users',      require('./routes/user.routes'));
app.use('/api/v1/products',   require('./routes/product.routes'));
app.use('/api/v1/categories', require('./routes/category.routes'));
app.use('/api/v1/brands',     require('./routes/brand.routes'));
app.use('/api/v1/orders',     require('./routes/order.routes'));
app.use('/api/v1/cart',       require('./routes/cart.routes'));
app.use('/api/v1/banners',    require('./routes/banner.routes'));
app.use('/api/v1/alerts',     require('./routes/alert.routes'));
app.use('/api/v1/coupons',    require('./routes/coupon.routes'));
app.use('/api/v1/payments',   require('./routes/payment.routes'));
app.use('/api/v1/settings',   require('./routes/settings.routes'));
app.use('/api/v1/upload',     require('./routes/upload.routes'));

// ── Health Check ─────────────────────────────────────────
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'Pretina API is running',
    version: '2.0.0',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 Handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Global Error:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start Server ─────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Pretina API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;
