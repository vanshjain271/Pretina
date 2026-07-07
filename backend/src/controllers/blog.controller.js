const Blog = require('../models/Blog');
const { logActivity } = require('../services/activity.service');

// GET all blogs
const getBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isPublished } = req.query;
    const filter = {};
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).populate('author', 'name'),
      Blog.countDocuments(filter),
    ]);
    res.json({ success: true, data: blogs, pagination: { total, page: Number(page) } });
  } catch (err) { next(err); }
};

// GET single blog
const getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name');
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: blog });
  } catch (err) { next(err); }
};

// POST create blog (admin/staff)
const createBlog = async (req, res, next) => {
  try {
    const blog = await Blog.create({ ...req.body, author: req.user._id });
    await logActivity({
      userId: req.user._id, userName: req.user.name,
      action: 'blog.created', description: `Created blog post: ${blog.title}`,
      entityType: 'blog', entityId: blog._id
    });
    res.status(201).json({ success: true, data: blog });
  } catch (err) { next(err); }
};

// PUT update blog (admin/staff)
const updateBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    await logActivity({
      userId: req.user._id, userName: req.user.name,
      action: 'blog.updated', description: `Updated blog post: ${blog.title}`,
      entityType: 'blog', entityId: blog._id
    });
    res.json({ success: true, data: blog });
  } catch (err) { next(err); }
};

// DELETE blog (admin/staff)
const deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    await logActivity({
      userId: req.user._id, userName: req.user.name,
      action: 'blog.deleted', description: `Deleted blog post: ${blog.title}`,
      entityType: 'blog', entityId: blog._id
    });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) { next(err); }
};

module.exports = { getBlogs, getBlog, createBlog, updateBlog, deleteBlog };
