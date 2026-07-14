const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

/**
 * Initialize Firebase Admin SDK.
 *
 * SETUP:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate New Private Key"
 *   3. Save the downloaded file to: backend/src/config/serviceAccountKey.json
 *   4. That file is in .gitignore — NEVER commit it.
 *
 * Until serviceAccountKey.json is placed, Firebase-dependent routes
 * (phone OTP verification) will return a 503. All other routes work normally.
 */

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, './serviceAccountKey.json');

let firebaseInitialized = false;

try {
  // Prevent double-init on nodemon hot reload
  admin.app();
  firebaseInitialized = true;
} catch {
  // Check if real key file exists (not the placeholder)
  if (fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    const serviceAccount = require('./serviceAccountKey.json');

    // Guard: reject the placeholder file
    if (serviceAccount.INSTRUCTIONS) {
      console.warn('⚠️  Firebase: serviceAccountKey.json is still the placeholder. Replace it with the real key.');
      console.warn('   Routes requiring Firebase Auth will return 503 until then.');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    }
  } else {
    console.warn('⚠️  Firebase: serviceAccountKey.json not found.');
    console.warn('   Place it at: backend/src/config/serviceAccountKey.json');
    console.warn('   Routes requiring Firebase Auth will return 503 until then.');
  }
}

/**
 * Middleware: verify Firebase is ready before using it.
 * Use this in routes that depend on Firebase Auth.
 */
const requireFirebase = (req, res, next) => {
  if (!firebaseInitialized) {
    return res.status(503).json({
      success: false,
      message: 'Firebase is not configured yet. Contact the administrator.',
      hint: process.env.NODE_ENV === 'development'
        ? 'Place serviceAccountKey.json in backend/src/config/'
        : undefined,
    });
  }
  next();
};

module.exports = admin;
module.exports.requireFirebase = requireFirebase;
module.exports.firebaseInitialized = firebaseInitialized;
