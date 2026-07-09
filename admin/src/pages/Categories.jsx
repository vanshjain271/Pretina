import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, CircularProgress, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import toast from 'react-hot-toast';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/endpoints';

const EMPTY = { name: '', description: '', isActive: true };

export default function Categories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imgFile, setImgFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const { data } = await getCategories({ t: Date.now() }); setItems(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setImgFile(null); setPreview(''); setDialog('add'); };
  const openEdit = (c) => { setForm(c); setImgFile(null); setPreview(c.image || ''); setDialog(c); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => {
        if (k === 'parentCategory' && !v) return;
        fd.append(k, v);
      });
      if (imgFile) fd.append('image', imgFile);
      if (dialog === 'add') { await createCategory(fd); toast.success('Category created!'); }
      else { await updateCategory(dialog._id, fd); toast.success('Category updated!'); }
      setDialog(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete?')) return;
    try { await deleteCategory(id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Category</Button>
      </Box>
      <Card>
        <TableContainer>
          <Table>
            <TableHead><TableRow sx={{ background: '#FAFAFA' }}>
              <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
              : items.map(c => (
                <TableRow key={c._id} hover>
                  <TableCell>{c.image ? <img src={c.image} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} /> : <Box sx={{ width: 44, height: 44, background: '#F0F0F0', borderRadius: 8 }} />}</TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{c.name}</Typography></TableCell>
                  <TableCell>{c.isActive ? '✅' : '❌'}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(c)} sx={{ color: '#FF6B00' }}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(c._id)} sx={{ color: '#e53e3e' }}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{dialog === 'add' ? 'Add Category' : 'Edit Category'}</DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          {/* Image Upload Area */}
          <Box sx={{
            display: 'block',
            border: '2px dashed #e0e0e0',
            borderRadius: 2,
            p: 3,
            textAlign: 'center',
            mb: 3,
            mt: 1,
            cursor: 'pointer',
            '&:hover': { borderColor: '#1976d2', bgcolor: '#f5f9ff' },
            position: 'relative'
          }} component="label">
            {preview ? (
              <img src={preview} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }} />
            ) : (
              <Box>
                <CloudUploadIcon sx={{ fontSize: 40, color: '#9e9e9e', mb: 1 }} />
                <Typography variant="body2" color="#FF6B00" fontWeight={600}>Upload Photo</Typography>
              </Box>
            )}
            <input type="file" style={{ display: 'none' }} accept="image/*" onChange={e => { const f = e.target.files[0]; if(f){setImgFile(f); setPreview(URL.createObjectURL(f));} }} />
          </Box>

          <TextField fullWidth label="Category Name *" size="small" value={form.name || ''} onChange={e => setForm(p => ({...p, name: e.target.value}))} sx={{ mb: 2 }} />
          
          <TextField fullWidth label="Description" size="small" multiline rows={3} value={form.description || ''} onChange={e => setForm(p => ({...p, description: e.target.value}))} sx={{ mb: 2 }} />
          
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Parent Category (Optional)</InputLabel>
            <Select
              label="Parent Category (Optional)"
              value={form.parentCategory || ''}
              onChange={e => setForm(p => ({...p, parentCategory: e.target.value}))}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              {items.filter(c => c._id !== form._id).map(c => (
                <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel control={<Switch color="primary" checked={!!form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} />} label="Active" sx={{ mb: 1 }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialog(null)} sx={{ color: '#1976d2' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' }, borderRadius: 1.5, px: 3, textTransform: 'none' }}>
            {saving ? 'Saving...' : (dialog === 'add' ? 'Create' : 'Save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
