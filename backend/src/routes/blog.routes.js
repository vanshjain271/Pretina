const express = require('express');
const router = express.Router();
const { protect, staffOnly } = require('../middleware/auth');
const ctrl = require('../controllers/blog.controller');

router.get('/', ctrl.getBlogs);
router.get('/:id', ctrl.getBlog);
router.post('/', protect, staffOnly, ctrl.createBlog);
router.put('/:id', protect, staffOnly, ctrl.updateBlog);
router.delete('/:id', protect, staffOnly, ctrl.deleteBlog);

module.exports = router;
