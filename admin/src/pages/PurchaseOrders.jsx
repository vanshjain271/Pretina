import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Stack, Chip, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'pretina_purchase_orders';

export default function PurchaseOrders() {
  const [orders, setOrders] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  
  const [form, setForm] = useState({ supplierName: '', amount: '', date: '', status: 'Pending', notes: '' });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setOrders(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveToStorage = (newOrders) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newOrders));
    setOrders(newOrders);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ supplierName: '', amount: '', date: new Date().toISOString().split('T')[0], status: 'Pending', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (po) => {
    setEditing(po);
    setForm({ ...po });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.supplierName || !form.amount) return toast.error('Supplier Name and Amount are required');
    
    if (editing) {
      const updated = orders.map(o => o.id === editing.id ? { ...form, id: o.id } : o);
      saveToStorage(updated);
      toast.success('Purchase order updated!');
    } else {
      const newPO = { ...form, id: Date.now().toString() };
      saveToStorage([newPO, ...orders]);
      toast.success('Purchase order created!');
    }
    setDialogOpen(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase order?')) return;
    saveToStorage(orders.filter(o => o.id !== id));
    toast.success('Purchase order deleted');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Purchase Orders</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
          New Purchase Order
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Purchase orders are stored locally in your browser. They help you track wholesale orders placed with your suppliers.
      </Alert>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Supplier</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                <TableCell sx={{ fontWeight: 700, align: 'right' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: '#999' }}>No purchase orders recorded.</TableCell></TableRow>
              ) : orders.map(order => (
                <TableRow key={order.id} hover>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell><Typography fontWeight={600}>{order.supplierName}</Typography></TableCell>
                  <TableCell>₹{Number(order.amount).toLocaleString('en-IN')}</TableCell>
                  <TableCell>
                    <Chip 
                      label={order.status} 
                      size="small" 
                      color={order.status === 'Completed' ? 'success' : order.status === 'Pending' ? 'warning' : 'default'} 
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200 }} noWrap>{order.notes}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary" onClick={() => openEdit(order)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(order.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} mt={1}>
            <TextField label="Supplier Name" fullWidth size="small" value={form.supplierName} onChange={e => setForm({...form, supplierName: e.target.value})} required />
            <TextField label="Order Amount (₹)" type="number" fullWidth size="small" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required />
            <TextField label="Order Date" type="date" fullWidth size="small" InputLabelProps={{ shrink: true }} value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
            <TextField select SelectProps={{ native: true }} label="Status" fullWidth size="small" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="Shipped">Shipped</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </TextField>
            <TextField label="Notes / Reference" multiline rows={3} fullWidth size="small" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save Order</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
