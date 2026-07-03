import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
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

  const load = async () => { setLoading(true); try { const { data } = await getCategories(); setItems(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setImgFile(null); setPreview(''); setDialog('add'); };
  const openEdit = (c) => { setForm(c); setImgFile(null); setPreview(c.image || ''); setDialog(c); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
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

      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'add' ? 'Add Category' : 'Edit Category'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name *" size="small" value={form.name || ''} onChange={e => setForm(p => ({...p, name: e.target.value}))} sx={{ mt: 1, mb: 2 }} />
          <TextField fullWidth label="Description" size="small" value={form.description || ''} onChange={e => setForm(p => ({...p, description: e.target.value}))} sx={{ mb: 2 }} />
          <FormControlLabel control={<Switch checked={!!form.isActive} onChange={e => setForm(p => ({...p, isActive: e.target.checked}))} />} label="Active" sx={{ mb: 2 }} />
          <Button variant="outlined" component="label" size="small">
            {preview ? 'Change Image' : 'Upload Image'}
            <input type="file" hidden accept="image/*" onChange={e => { const f = e.target.files[0]; if(f){setImgFile(f); setPreview(URL.createObjectURL(f));} }} />
          </Button>
          {preview && <Box sx={{ mt: 1 }}><img src={preview} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} /></Box>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
