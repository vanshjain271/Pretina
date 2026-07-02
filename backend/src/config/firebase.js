const admin = require('firebase-admin');

/**
 * Initialize Firebase Admin SDK.
 * Requires serviceAccountKey.json downloaded from Firebase Console:
 * Firebase Console → Project Settings → Service Accounts → Generate New Private Key
 * 
 * Place the downloaded file at: backend/src/config/serviceAccountKey.json
 * (This file is in .gitignore — never commit it)
 */
let firebaseApp;

try {
  // Check if already initialized (prevents error on hot reload)
  firebaseApp = admin.app();
} catch {
  // First initialization
  const serviceAccount = require('./serviceAccountKey.json');
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'pretina-656c3',
  });
  console.log('✅ Firebase Admin SDK initialized');
}

module.exports = admin;
