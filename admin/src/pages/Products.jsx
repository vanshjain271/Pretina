import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  CircularProgress, Pagination, InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import toast from 'react-hot-toast';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCategories, getBrands,
} from '../api/endpoints';

const EMPTY = {
  name: '', description: '', price: '', salePrice: '', stock: '',
  category: '', brand: '', isFeatured: false, isRecommended: false,
  isTrending: false, isNewArrival: false, isActive: true,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // null | 'add' | product obj
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 15 };
      if (search) params.search = search;
      const { data } = await getProducts(params);
      setProducts(data.data);
      setTotal(data.pagination?.total || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(page); }, [page, search]);
  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.data));
    getBrands().then(({ data }) => setBrands(data.data));
  }, []);

  const openAdd = () => { setForm(EMPTY); setImages([]); setPreviews([]); setDialog('add'); };
  const openEdit = (p) => {
    setForm({ ...p, category: p.category?._id || p.category, brand: p.brand?._id || p.brand || '' });
    setImages([]); setPreviews(p.images || []);
    setDialog(p);
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach(img => fd.append('images', img));
      if (dialog === 'add') {
        await createProduct(fd);
        toast.success('Product created!');
      } else {
        await updateProduct(dialog._id, fd);
        toast.success('Product updated!');
      }
      setDialog(null);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      load(page);
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">Products</Typography>
          <Typography variant="body2" color="text.secondary">{total} products</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Product</Button>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField size="small" placeholder="Search products..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#999' }} /></InputAdornment> }}
            sx={{ width: 280 }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#FAFAFA' }}>
                <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Price</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Flags</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
              ) : products.map(p => (
                <TableRow key={p._id} hover>
                  <TableCell>
                    {p.images?.[0] ? <img src={p.images[0]} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} /> : <Box sx={{ width: 44, height: 44, background: '#F0F0F0', borderRadius: 8 }} />}
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="#FF6B00">₹{p.salePrice}</Typography>
                    <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#999' }}>₹{p.price}</Typography>
                  </TableCell>
                  <TableCell><Chip label={p.stock} size="small" color={p.stock > 0 ? 'success' : 'error'} /></TableCell>
                  <TableCell><Typography variant="caption">{p.category?.name || '-'}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                      {p.isFeatured && <Chip label="F" size="small" sx={{ bgcolor: '#FF6B0020', color: '#FF6B00', fontSize: 10 }} />}
                      {p.isRecommended && <Chip label="R" size="small" sx={{ bgcolor: '#6366f120', color: '#6366f1', fontSize: 10 }} />}
                      {p.isTrending && <Chip label="T" size="small" sx={{ bgcolor: '#f59e0b20', color: '#f59e0b', fontSize: 10 }} />}
                      {p.isNewArrival && <Chip label="N" size="small" sx={{ bgcolor: '#10b98120', color: '#10b981', fontSize: 10 }} />}
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={p.isActive ? 'Active' : 'Hidden'} size="small" color={p.isActive ? 'success' : 'default'} /></TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(p)} sx={{ color: '#FF6B00' }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(p._id)} sx={{ color: '#e53e3e' }}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 15 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={Math.ceil(total / 15)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>{dialog === 'add' ? 'Add Product' : 'Edit Product'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><TextField fullWidth label="Name *" size="small" value={form.name} onChange={e => set('name', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" size="small" multiline rows={3} value={form.description} onChange={e => set('description', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="MRP (₹) *" size="small" type="number" value={form.price} onChange={e => set('price', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Sale Price (₹) *" size="small" type="number" value={form.salePrice} onChange={e => set('salePrice', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Stock *" size="small" type="number" value={form.stock} onChange={e => set('stock', e.target.value)} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Category *</InputLabel>
                <Select label="Category *" value={form.category} onChange={e => set('category', e.target.value)}>
                  {categories.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Brand</InputLabel>
                <Select label="Brand" value={form.brand} onChange={e => set('brand', e.target.value)}>
                  <MenuItem value="">None</MenuItem>
                  {brands.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" fontWeight={600} color="#666" sx={{ display: 'block', mb: 1 }}>Home Page Visibility</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[['isFeatured','Featured'],['isRecommended','Recommended'],['isTrending','Trending'],['isNewArrival','New Arrival']].map(([k, l]) => (
                  <FormControlLabel key={k} control={<Switch size="small" checked={!!form[k]} onChange={e => set(k, e.target.checked)} />} label={l} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch checked={!!form.isActive} onChange={e => set('isActive', e.target.checked)} />} label="Active (visible to customers)" />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" size="small">
                Upload Images (max 8)
                <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
              </Button>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                {previews.map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid #E0E0E0' }} />
                ))}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
