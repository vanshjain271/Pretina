import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, CircularProgress, Chip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { getAlerts, createAlert, updateAlert, deleteAlert } from '../api/endpoints';

const EMPTY = { message: '', isActive: true, priority: 0 };

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => { setLoading(true); try { const { data } = await getAlerts(); setItems(data.data); } catch {} finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!form.message) { toast.error('Message is required'); return; }
    setSaving(true);
    try {
      if (dialog === 'add') { await createAlert(form); toast.success('Alert created!'); }
      else { await updateAlert(dialog._id, form); toast.success('Updated!'); }
      setDialog(null); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">Alerts</Typography>
          <Typography variant="body2" color="text.secondary">Scrolling marquee announcements shown in the app</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm(EMPTY); setDialog('add'); }}>Add Alert</Button>
      </Box>
      <Card>
        <TableContainer><Table>
          <TableHead><TableRow sx={{ background: '#FAFAFA' }}>
            <TableCell sx={{ fontWeight: 700 }}>Message</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={4} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
            : items.map(a => (
              <TableRow key={a._id} hover>
                <TableCell><Typography variant="body2">{a.message}</Typography></TableCell>
                <TableCell><Chip label={a.priority} size="small" /></TableCell>
                <TableCell><Chip label={a.isActive ? 'Active' : 'Hidden'} size="small" color={a.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => { setForm(a); setDialog(a); }} sx={{ color: '#FF6B00' }}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={async () => { if(!confirm('Delete?')) return; await deleteAlert(a._id); toast.success('Deleted'); load(); }} sx={{ color: '#e53e3e' }}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
      </Card>
      <Dialog open={!!dialog} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'add' ? 'Add Alert' : 'Edit Alert'}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Message *" size="small" multiline rows={2} value={form.message||''} onChange={e => setForm(p=>({...p,message:e.target.value}))} sx={{ mt:1, mb:2 }} />
          <TextField fullWidth label="Priority (higher = first)" size="small" type="number" value={form.priority||0} onChange={e => setForm(p=>({...p,priority:Number(e.target.value)}))} sx={{ mb:2 }} />
          <FormControlLabel control={<Switch checked={!!form.isActive} onChange={e => setForm(p=>({...p,isActive:e.target.checked}))} />} label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving?'Saving...':'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
