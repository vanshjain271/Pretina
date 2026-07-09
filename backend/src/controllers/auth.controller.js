const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebase');
const { firebaseInitialized } = require('../config/firebase');

// Helper: sign JWT for admin/employee
const signJwt = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * POST /api/v1/auth/firebase-login
 * Mobile customers login via Firebase Phone OTP.
 * The app verifies OTP on Firebase client-side, then sends the ID token here.
 */
exports.firebaseLogin = async (req, res, next) => {
  try {
    const { idToken, fcmToken } = req.body;
    let decoded;
    if (!firebaseInitialized && process.env.NODE_ENV === 'development') {
      // MOCK for development if service account is missing
      console.warn('⚠️ MOCK FIREBASE VERIFICATION: Using dummy user since Firebase Admin is not configured.');
      if (idToken) {
        // Decode without verifying (development only)
        const base64Url = idToken.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = Buffer.from(base64, 'base64').toString('utf8');
          const payload = JSON.parse(jsonPayload);
          decoded = {
            uid: payload.uid || payload.user_id || 'mock-uid-' + Math.random().toString(36).substring(7),
            phone_number: payload.phone_number || '+919999999999',
            name: payload.name || 'Mock User',
            picture: payload.picture || ''
          };
        }
      }
      
      if (!decoded) {
        decoded = {
          uid: 'mock-uid-' + Math.random().toString(36).substring(7),
          phone_number: '+91' + '9999999999', // dummy
          name: 'Mock User',
          picture: ''
        };
      }
    } else {
      if (!firebaseInitialized) {
        return res.status(503).json({
          success: false,
          message: 'Firebase Auth is not yet configured. Contact administrator.',
        });
      }
      if (!idToken) {
        return res.status(400).json({ success: false, message: 'Firebase ID token is required.' });
      }
      decoded = await admin.auth().verifyIdToken(idToken);
    }
    
    const { uid, phone_number, name, picture } = decoded;

    if (!phone_number) {
      return res.status(400).json({ success: false, message: 'Phone number not found in token.' });
    }

    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });
    let isNewUser = false;

    if (!user) {
      // Check if a user with this phone was migrated from old Pretina
      user = await User.findOne({ phone: phone_number });
      if (user) {
        // Link the Firebase UID to the migrated account
        user.firebaseUid = uid;
        user.isPhoneVerified = true;
        if (fcmToken) user.fcmToken = fcmToken;
        await user.save();
      } else {
        // Brand new user
        isNewUser = true;
        user = await User.create({
          firebaseUid: uid,
          phone: phone_number,
          name: name || 'Pretina User',
          photo: picture || '',
          role: 'customer',
          isPhoneVerified: true,
          fcmToken: fcmToken || '',
        });
      }
    } else {
      // Existing user — update FCM token if provided
      if (fcmToken && user.fcmToken !== fcmToken) {
        user.fcmToken = fcmToken;
        await user.save();
      }
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    res.status(isNewUser ? 201 : 200).json({
      success: true,
      isNewUser,
      user,
    });
  } catch (err) {
    if (err.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Firebase token expired. Please login again.' });
    }
    next(err);
  }
};

/**
 * POST /api/v1/auth/admin-login
 * Admin/Employee login with email + password → returns JWT.
 */
exports.adminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const query = email.trim();
    const user = await User.findOne({ 
      $or: [{ email: { $regex: new RegExp(`^${query}$`, 'i') } }, { phone: query }],
      role: { $in: ['admin', 'employee'] } 
    }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated.' });
    }

    const token = signJwt(user._id);

    res.json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/auth/me
 * Get the currently authenticated user.
 */
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/**
 * DELETE /api/v1/auth/delete-account
 * Account deletion (required for App Store compliance).
 * Deletes user from MongoDB and Firebase Auth.
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = req.user;

    // Delete from Firebase
    if (user.firebaseUid) {
      try {
        await admin.auth().deleteUser(user.firebaseUid);
      } catch (fbErr) {
        console.warn('Could not delete Firebase user:', fbErr.message);
      }
    }

    // Scrub user data from MongoDB
    await User.findByIdAndUpdate(user._id, {
      name: '[Deleted]',
      phone: `deleted_${user._id}`,
      email: '',
      photo: '',
      addresses: [],
      firebaseUid: '',
      isActive: false,
      fcmToken: '',
    });

    res.json({ success: true, message: 'Account deleted successfully.' });
  } catch (err) {
    next(err);
  }
};
