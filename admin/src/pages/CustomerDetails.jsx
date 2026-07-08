import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip,
  CircularProgress, Table, TableHead, TableBody, TableRow, TableCell,
  Button, IconButton, Dialog, DialogTitle, DialogContent, TextField,
  MenuItem, Select, FormControl, InputLabel, FormControlLabel, Checkbox, Tabs, Tab
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer, getOrders, updateCustomer, toggleCustomerStatus } from '../api/endpoints';
import toast from 'react-hot-toast';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabIndex, setTabIndex] = useState(0);

  // Edit Dialog State
  const [editDialog, setEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, oRes] = await Promise.all([
        getCustomer(id),
        getOrders({ user: id, limit: 100 }),
      ]);
      setCustomer(cRes.data.data || cRes.data.user);
      setOrders(oRes.data.orders || oRes.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [id]);

  const openEdit = () => {
    setEditForm({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      type: customer.type || 'Consumer',
      gstNo: customer.gstNo || '',
      isAffiliate: customer.isAffiliate || false,
      blockCod: customer.blockCod || false,
    });
    setEditDialog(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateCustomer(id, editForm);
      toast.success('Customer updated!');
      setEditDialog(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handleToggleStatus = async () => {
    if (!window.confirm(`Are you sure you want to ${customer.isActive ? 'block' : 'unblock'} this customer?`)) return;
    try {
      await toggleCustomerStatus(id);
      toast.success('Customer status changed');
      loadData();
    } catch (err) {
      toast.error('Failed to change status');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>;
  if (!customer) return <Box sx={{ p: 3 }}><Typography color="error">Customer not found</Typography></Box>;

  const totalSpent = orders.filter(o => ['confirmed', 'packed', 'shipped', 'delivered'].includes(o.status)).reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')} sx={{ mb: 2 }}>
        Back to Customers
      </Button>

      {/* Header Profile Section */}
      <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: '#4F46E5', color: '#fff', fontSize: 32, fontWeight: 700 }}>
              {(customer.name || 'U')[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {customer.name || '—'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Typography color="text.secondary" fontSize={14} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  📞 {customer.phone}
                </Typography>
                {customer.phone && (
                  <Typography component="a" href={`https://wa.me/${customer.phone.replace(/\D/g,'')}`} target="_blank" color="success.main" fontSize={14} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none', fontWeight: 600 }}>
                    <WhatsAppIcon fontSize="small" /> WhatsApp
                  </Typography>
                )}
                {customer.email && <Typography color="text.secondary" fontSize={14}>✉️ {customer.email}</Typography>}
              </Box>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={openEdit} color="primary" sx={{ bgcolor: '#f0f4ff', border: '1px solid #e0e7ff' }}><EditIcon /></IconButton>
            <IconButton onClick={handleToggleStatus} color="error" sx={{ bgcolor: '#fff0f0', border: '1px solid #ffe4e6' }}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </CardContent>
      </Card>

      {/* 4 Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Sales', value: `₹${totalSpent.toLocaleString('en-IN')}`, icon: '📊', color: '#fca5a5' },
          { label: 'Orders', value: orders.length, icon: '🛒', color: '#fcd34d' },
          { label: 'Purchases', value: orders.length, icon: '🛍️', color: '#f87171' }, // Dummy logic for purchases
          { label: 'Estimates', value: 0, icon: '📄', color: '#fbbf24' } // Dummy logic for estimates
        ].map(s => (
          <Grid key={s.label} item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2 }}>
                <Avatar sx={{ bgcolor: `${s.color}20`, color: s.color, width: 48, height: 48 }}>{s.icon}</Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700} color={s.label === 'Total Sales' ? 'error.main' : 'text.primary'}>{s.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabIndex} onChange={(e, v) => setTabIndex(v)}>
          <Tab label="DETAILS" sx={{ fontWeight: 600 }} />
          <Tab label="ORDER HISTORY" sx={{ fontWeight: 600 }} />
        </Tabs>
      </Box>

      {tabIndex === 0 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📍 Address
            </Typography>
            {customer.addresses?.length > 0 ? (
              <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 2, border: '1px solid #e5e7eb' }}>
                <Typography fontWeight={700} mb={0.5}>{customer.addresses[0].name}</Typography>
                <Typography color="text.secondary" fontSize={14} mb={1}>{customer.addresses[0].phone}</Typography>
                <Typography color="text.secondary" fontSize={14}>
                  {[customer.addresses[0].line1, customer.addresses[0].line2, customer.addresses[0].city, customer.addresses[0].state, customer.addresses[0].pincode].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">No address found.</Typography>
            )}

            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Typography fontWeight={600}>{customer.type || 'Consumer'}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">COD Status</Typography>
                <Typography fontWeight={600} color={customer.blockCod ? 'error.main' : 'success.main'}>
                  {customer.blockCod ? 'Blocked' : 'Allowed'}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" color="text.secondary">Affiliate</Typography>
                <Typography fontWeight={600}>{customer.isAffiliate ? 'Yes' : 'No'}</Typography>
              </Grid>
              {customer.gstNo && (
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">GST No.</Typography>
                  <Typography fontWeight={600}>{customer.gstNo}</Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabIndex === 1 && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <CardContent>
            {orders.length === 0 ? (
              <Typography color="text.secondary" textAlign="center" py={4}>No orders yet</Typography>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, background: '#fafafa' } }}>
                    <TableCell>Order #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Items</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map(o => (
                    <TableRow key={o._id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${o._id}`)}>
                      <TableCell><Typography fontSize={13} fontWeight={600} color="primary">{o.orderNumber}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Typography></TableCell>
                      <TableCell><Typography fontSize={13}>{o.items?.length} item(s)</Typography></TableCell>
                      <TableCell align="right"><Typography fontSize={13} fontWeight={600}>₹{o.total?.toLocaleString('en-IN')}</Typography></TableCell>
                      <TableCell>
                        <Chip label={o.status} size="small" sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                          color={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : 'primary'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Customer Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>Edit: {customer.name}</Typography>
          <Box>
            <Button onClick={() => setEditDialog(false)} sx={{ mr: 1, color: '#666' }}>Cancel</Button>
            <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Name" size="small" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" size="small" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" size="small" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select label="Type" value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  <MenuItem value="Consumer">Consumer</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="Wholesale">Wholesale</MenuItem>
                  <MenuItem value="Affiliate">Affiliate</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Customer has GST No. (Optional)" size="small" value={editForm.gstNo} onChange={e => setEditForm({ ...editForm, gstNo: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={editForm.isAffiliate} onChange={e => setEditForm({ ...editForm, isAffiliate: e.target.checked })} />} label="Affiliate Customer (Optional)" />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={editForm.blockCod} onChange={e => setEditForm({ ...editForm, blockCod: e.target.checked })} />} label="Block Cash on Delivery for this Customer" />
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
