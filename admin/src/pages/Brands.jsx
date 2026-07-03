import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, CircularProgress } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../api/endpoints';

const EMPTY = { name: '', isActive: true };

export default function Brands() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imgFile, setImgFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const { data } = await getBrands(); setItems(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (imgFile) fd.append('logo', imgFile);
      if (dialog === 'add') { await createBrand(fd); toast.success('Brand created!'); }
      else { await updateBrand(dialog._id, fd); toast.success('Updated!'); }
      setDialog(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">Brands</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(EMPTY); setImgFile(null); setPreview(''); setDialog('add'); }}>Add Brand</Button>
      </Box>
      <Card>
        <TableContainer><Table>
          <TableHead><TableRow sx={{ background: '#FAFAFA' }}>
            <TableCell sx={{ fontWeight: 700 }}>Logo</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
            : items.map(b => (
              <TableRow key={b._id} hover>
                <TableCell>{b.logo ? <img src={b.logo} alt="" style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8 }} /> : <Box sx={{ width: 44, height: 44, background: '#F0F0F0', borderRadius: 8 }} />}</TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{b.name}</Typography></TableCell>
                <TableCell>{b.isActive ? '✅' : '❌'}</TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setForm(b); setImgFile(null); setPreview(b.logo||''); setDialog(b); }} sx={{ color: '#FF6B00' }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={async () => { if(!confirm('Delete?')) return; try { await deleteBrand(b._id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); } }} sx={{ color: '#e53e3e' }}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
      </Card>
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'add' ? 'Add Brand' : 'Edit Brand'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Name *" size="small" value={form.name||''} onChange={e => setForm(p=>({...p,name:e.target.value}))} sx={{ mt:1, mb:2 }} />
          <FormControlLabel control={<Switch checked={!!form.isActive} onChange={e => setForm(p=>({...p,isActive:e.target.checked}))} />} label="Active" sx={{ mb:2 }} />
          <Button variant="outlined" component="label" size="small">
            Upload Logo <input type="file" hidden accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){setImgFile(f);setPreview(URL.createObjectURL(f));} }} />
          </Button>
          {preview && <Box sx={{mt:1}}><img src={preview} alt="" style={{width:80,height:80,objectFit:'contain',borderRadius:8,border:'1px solid #E0E0E0'}} /></Box>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
