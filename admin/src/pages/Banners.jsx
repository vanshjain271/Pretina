import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, CircularProgress, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../api/endpoints';
import dayjs from 'dayjs';

const EMPTY = { title: '', linkType: 'none', linkValue: '', isActive: true };

export default function Banners() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [imgFile, setImgFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const { data } = await getBanners(); setItems(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!imgFile && dialog === 'add') { toast.error('Please upload a banner image'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k,v]) => fd.append(k, v));
      if (imgFile) fd.append('image', imgFile);
      if (dialog === 'add') { await createBanner(fd); toast.success('Banner created!'); }
      else { await updateBanner(dialog._id, fd); toast.success('Updated!'); }
      setDialog(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">Banners</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(EMPTY); setImgFile(null); setPreview(''); setDialog('add'); }}>Add Banner</Button>
      </Box>
      <Card>
        <TableContainer><Table>
          <TableHead><TableRow sx={{ background: '#FAFAFA' }}>
            <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Active</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
            : items.map(b => (
              <TableRow key={b._id} hover>
                <TableCell><img src={b.image} alt="" style={{ width: 100, height: 50, objectFit: 'cover', borderRadius: 8 }} /></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{b.title || 'Untitled'}</Typography></TableCell>
                <TableCell><Chip label={b.isActive ? 'Active' : 'Hidden'} size="small" color={b.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setForm(b); setImgFile(null); setPreview(b.image||''); setDialog(b); }} sx={{ color: '#FF6B00' }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={async () => { if(!confirm('Delete?')) return; await deleteBanner(b._id); toast.success('Deleted'); load(); }} sx={{ color: '#e53e3e' }}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
      </Card>
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'add' ? 'Add Banner' : 'Edit Banner'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Title (optional)" size="small" value={form.title||''} onChange={e => setForm(p=>({...p,title:e.target.value}))} sx={{ mt:1, mb:2 }} />
          <FormControlLabel control={<Switch checked={!!form.isActive} onChange={e => setForm(p=>({...p,isActive:e.target.checked}))} />} label="Active" sx={{ mb:2, display:'block' }} />
          <Button variant="outlined" component="label" size="small">
            {preview ? 'Change Image' : 'Upload Banner Image *'}
            <input type="file" hidden accept="image/*" onChange={e => { const f=e.target.files[0]; if(f){setImgFile(f);setPreview(URL.createObjectURL(f));} }} />
          </Button>
          {preview && <Box sx={{mt:1}}><img src={preview} alt="" style={{width:'100%',maxHeight:160,objectFit:'cover',borderRadius:8}} /></Box>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
