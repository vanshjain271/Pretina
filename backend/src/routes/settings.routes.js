const router = require('express').Router();
const { protect, adminOnly, staffOnly } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settings.controller');
const { upload } = require('../services/s3.service');

const setFolder = (f) => (req, res, next) => { req.uploadFolder = f; next(); };

router.get('/', getSettings); // Public — app reads this on startup
router.put('/', protect, adminOnly, setFolder('qr'), upload.single('qrImage'), updateSettings);

module.exports = router;
