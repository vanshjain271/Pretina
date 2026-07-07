import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Grid, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, Switch, FormControlLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getBlogs, createBlog, updateBlog, deleteBlog } from '../api/endpoints';
import toast from 'react-hot-toast';

export default function Blog() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  
  const [formData, setFormData] = useState({ title: '', content: '', imageUrl: '', isPublished: true });
  const [submitting, setSubmitting] = useState(false);

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const { data } = await getBlogs();
      setBlogs(data.data || []);
    } catch (e) { toast.error('Failed to load blog posts'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadBlogs(); }, []);

  const handleOpen = (blog = null) => {
    if (blog) {
      setEditingBlog(blog);
      setFormData({ title: blog.title, content: blog.content, imageUrl: blog.imageUrl, isPublished: blog.isPublished });
    } else {
      setEditingBlog(null);
      setFormData({ title: '', content: '', imageUrl: '', isPublished: true });
    }
    setDialogOpen(true);
  };

  const handleClose = () => setDialogOpen(false);

  const handleSave = async () => {
    if (!formData.title || !formData.content) return toast.error('Title and content are required');
    setSubmitting(true);
    try {
      if (editingBlog) await updateBlog(editingBlog._id, formData);
      else await createBlog(formData);
      
      toast.success(editingBlog ? 'Blog updated' : 'Blog created');
      handleClose();
      loadBlogs();
    } catch (e) {
      toast.error('Failed to save blog post');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this blog post?')) return;
    try {
      await deleteBlog(id);
      toast.success('Blog post deleted');
      loadBlogs();
    } catch (e) { toast.error('Failed to delete blog post'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Blog Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Write New Post
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Author</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Published On</TableCell>
                <TableCell sx={{ fontWeight: 700, align: 'center' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
              ) : blogs.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: '#999' }}>No blog posts found</TableCell></TableRow>
              ) : (
                blogs.map(blog => (
                  <TableRow key={blog._id} hover>
                    <TableCell>
                      {blog.imageUrl ? (
                        <img src={blog.imageUrl} alt={blog.title} style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <Box sx={{ width: 60, height: 40, bgcolor: '#f0f0f0', borderRadius: 4 }} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{blog.title}</Typography>
                    </TableCell>
                    <TableCell>{blog.author?.name || 'Admin'}</TableCell>
                    <TableCell>
                      <Chip label={blog.isPublished ? 'Published' : 'Draft'} size="small" color={blog.isPublished ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{new Date(blog.createdAt).toLocaleDateString('en-IN')}</TableCell>
                    <TableCell align="center">
                      <IconButton size="small" color="primary" onClick={() => handleOpen(blog)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(blog._id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{editingBlog ? 'Edit Blog Post' : 'Write New Post'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth label="Blog Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Cover Image URL" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              {formData.imageUrl && <img src={formData.imageUrl} alt="preview" style={{ marginTop: 16, height: 120, objectFit: 'cover', borderRadius: 8 }} />}
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth multiline rows={8} label="Blog Content" 
                value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} 
                required placeholder="Write your blog content here. HTML tags are supported."
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel 
                control={<Switch checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} />}
                label="Publish immediately"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : (editingBlog ? 'Update Post' : 'Publish Post')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
