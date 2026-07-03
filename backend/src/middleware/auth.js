const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const { firebaseInitialized } = require('../config/firebase');
const User = require('../models/User');

/**
 * Middleware: Protect routes requiring any authenticated user (customer, admin, employee).
 * Accepts both:
 *  1. Firebase ID Token (from mobile app) → Bearer <firebase_token>
 *  2. JWT (from admin panel login) → Bearer <jwt_token>
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
    }

    const token = authHeader.split(' ')[1];

    // Try JWT first (admin/employee)
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'User not found or inactive.' });
      }
      req.user = user;
      return next();
    } catch (jwtError) {
      // Not a JWT — try Firebase token (customer)
    }

    // Try Firebase ID Token (only if Firebase is configured)
    if (!firebaseInitialized) {
      return res.status(401).json({
        success: false,
        message: 'Firebase Auth is not yet configured on this server.',
      });
    }
    try {
      const decodedFirebase = await admin.auth().verifyIdToken(token);
      const { uid, phone_number, name, picture } = decodedFirebase;

      // Find or create user in MongoDB
      let user = await User.findOne({ firebaseUid: uid });
      if (!user) {
        // Auto-register on first Firebase login
        user = await User.create({
          firebaseUid: uid,
          phone: phone_number || '',
          name: name || 'Pretina User',
          photo: picture || '',
          role: 'customer',
          isPhoneVerified: true,
        });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account is deactivated.' });
      }

      req.user = user;
      return next();
    } catch (firebaseError) {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware: Restrict to admin only.
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ success: false, message: 'Admin access required.' });
};

/**
 * Middleware: Restrict to admin or employee.
 */
const staffOnly = (req, res, next) => {
  if (req.user && ['admin', 'employee'].includes(req.user.role)) return next();
  return res.status(403).json({ success: false, message: 'Staff access required.' });
};

module.exports = { protect, adminOnly, staffOnly };
