import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, CircularProgress, Chip, Grid, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../api/endpoints';

const EMPTY = { code:'', type:'percentage', value:'', minOrderValue:0, maxDiscount:0, usageLimit:0, perUserLimit:1, isActive:true };

export default function Coupons() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(p=>({...p,[k]:v}));

  const load = async () => { setLoading(true); try { const { data } = await getCoupons(); setItems(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (dialog === 'add') { await createCoupon(form); toast.success('Coupon created!'); }
      else { await updateCoupon(dialog._id, form); toast.success('Updated!'); }
      setDialog(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">Coupons</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(EMPTY); setDialog('add'); }}>Add Coupon</Button>
      </Box>
      <Card>
        <TableContainer><Table>
          <TableHead><TableRow sx={{ background: '#FAFAFA' }}>
            <TableCell sx={{ fontWeight: 700 }}>Code</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Used</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
            : items.map(c => (
              <TableRow key={c._id} hover>
                <TableCell><Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', background: '#F5F5F5', px:1, py:0.3, borderRadius:1 }}>{c.code}</Typography></TableCell>
                <TableCell><Chip label={c.type} size="small" /></TableCell>
                <TableCell><Typography variant="body2" fontWeight={600}>{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</Typography></TableCell>
                <TableCell><Typography variant="body2">{c.usedCount}{c.usageLimit > 0 ? ` / ${c.usageLimit}` : ''}</Typography></TableCell>
                <TableCell><Chip label={c.isActive ? 'Active' : 'Off'} size="small" color={c.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setForm(c); setDialog(c); }} sx={{ color: '#FF6B00' }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={async () => { if(!confirm('Delete?')) return; await deleteCoupon(c._id); toast.success('Deleted'); load(); }} sx={{ color: '#e53e3e' }}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
      </Card>
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'add' ? 'Add Coupon' : 'Edit Coupon'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={6}><TextField fullWidth label="Code *" size="small" value={form.code||''} onChange={e => set('code', e.target.value.toUpperCase())} inputProps={{ style: { textTransform: 'uppercase', fontFamily: 'monospace' } }} /></Grid>
            <Grid item xs={6}>
              <FormControl fullWidth size="small"><InputLabel>Type</InputLabel>
                <Select label="Type" value={form.type||'percentage'} onChange={e => set('type', e.target.value)}>
                  <MenuItem value="percentage">Percentage (%)</MenuItem>
                  <MenuItem value="fixed">Fixed Amount (₹)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}><TextField fullWidth label={form.type === 'percentage' ? 'Value (%)' : 'Value (₹)'} size="small" type="number" value={form.value||''} onChange={e => set('value', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Max Discount (₹, 0=no cap)" size="small" type="number" value={form.maxDiscount||0} onChange={e => set('maxDiscount', Number(e.target.value))} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Min Order Value (₹)" size="small" type="number" value={form.minOrderValue||0} onChange={e => set('minOrderValue', Number(e.target.value))} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Usage Limit (0=unlimited)" size="small" type="number" value={form.usageLimit||0} onChange={e => set('usageLimit', Number(e.target.value))} /></Grid>
            <Grid item xs={6}><TextField fullWidth label="Per User Limit" size="small" type="number" value={form.perUserLimit||1} onChange={e => set('perUserLimit', Number(e.target.value))} /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={!!form.isActive} onChange={e => set('isActive', e.target.checked)} />} label="Active" /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
