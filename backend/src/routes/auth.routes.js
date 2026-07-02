const router = require('express').Router();
const { firebaseLogin, adminLogin, getMe, deleteAccount } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/firebase-login',  firebaseLogin);   // Mobile: Firebase Phone OTP
router.post('/admin-login',     adminLogin);       // Admin Panel: email + password

router.get('/me',               protect, getMe);
router.delete('/delete-account',protect, deleteAccount); // App Store compliance

module.exports = router;
