import React, { useEffect, useState } from 'react';
import {
  Drawer, Box, Typography, IconButton, Divider, Chip, Button, Grid,
  CircularProgress, TextField, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import LaunchIcon from '@mui/icons-material/Launch';
import { getOrder, updateOrderStatus } from '../api/endpoints';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', packed: 'info',
  shipped: 'primary', delivered: 'success', cancelled: 'error', returned: 'error',
};

export default function OrderDrawer({ orderId, onClose, onUpdate }) {
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Status Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [tracking, setTracking] = useState('');
  const [courier, setCourier] = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    getOrder(orderId).then(({ data }) => {
      setOrder(data.data);
      setNewStatus(data.data.status);
      setTracking(data.data.trackingNumber || '');
      setCourier(data.data.courierName || '');
      setIsEditing(false);
    }).catch(() => {
      toast.error('Failed to load order details');
      onClose();
    }).finally(() => setLoading(false));
  }, [orderId, onClose]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await updateOrderStatus(orderId, { status: newStatus, trackingNumber: tracking, courierName: courier });
      toast.success('Order status updated!');
      setIsEditing(false);
      if (onUpdate) onUpdate();
      // Reload order details
      const { data } = await getOrder(orderId);
      setOrder(data.data);
    } catch (err) {
      toast.error('Failed to update status');
    } finally { setSaving(false); }
  };

  if (!orderId) return null;

  return (
    <Drawer anchor="right" open={Boolean(orderId)} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 500, md: 600 }, bgcolor: '#F8F9FA' } }}>
      {loading || !order ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#1A1A2E', color: '#fff' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{order.orderNumber}</Typography>
              <Chip label={order.status.toUpperCase()} size="small" color={STATUS_COLORS[order.status] || 'default'} sx={{ mt: 0.5, fontWeight: 700, color: '#fff' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" sx={{ color: '#fff' }}><DeleteIcon fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setIsEditing(true)}><EditIcon fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: '#fff' }}><WhatsAppIcon fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: '#fff' }} onClick={() => window.open(`/invoices/${order._id}`, '_blank')}><PrintIcon fontSize="small" /></IconButton>
              <IconButton size="small" sx={{ color: '#fff', ml: 1 }} onClick={onClose}><CloseIcon /></IconButton>
            </Box>
          </Box>

          <Box sx={{ p: 2, flex: 1, overflowY: 'auto' }}>
            {/* Quick Info */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}><Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee' }}><Typography variant="caption" color="text.secondary">Order Date</Typography><Typography variant="body2" fontWeight={600}>{new Date(order.createdAt).toLocaleString('en-IN')}</Typography></Box></Grid>
              <Grid item xs={6}><Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee' }}><Typography variant="caption" color="text.secondary">Payment Mode</Typography><Typography variant="body2" fontWeight={600}>{order.paymentMethod?.toUpperCase().replace('_', ' ')}</Typography></Box></Grid>
              <Grid item xs={6}><Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee' }}><Typography variant="caption" color="text.secondary">Delivery Mode</Typography><Typography variant="body2" fontWeight={600}>Delivery</Typography></Box></Grid>
              <Grid item xs={6}><Box sx={{ p: 1.5, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee' }}><Typography variant="caption" color="text.secondary">Payment Status</Typography><Typography variant="body2" fontWeight={600} color={order.paymentStatus === 'paid' ? 'success.main' : 'warning.main'}>{order.paymentStatus?.toUpperCase()}</Typography></Box></Grid>
            </Grid>

            {/* Customer */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>👤 Customer</Typography>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee', mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="body2" fontWeight={700}>{order.user?.name || order.shippingAddress.name}</Typography>
                <Typography variant="body2" color="text.secondary">{order.user?.phone || order.shippingAddress.phone}</Typography>
              </Box>
              <IconButton size="small" color="primary" onClick={() => { onClose(); navigate(`/customers/${order.user?._id}`); }}><LaunchIcon fontSize="small" /></IconButton>
            </Box>

            {/* Shipping Address */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>📍 Shipping Address</Typography>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee', mb: 3 }}>
              <Typography variant="body2" fontWeight={700}>{order.shippingAddress.name}</Typography>
              <Typography variant="body2" color="text.secondary" mb={0.5}>{order.shippingAddress.phone}</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.shippingAddress.line1}, {order.shippingAddress.line2 && `${order.shippingAddress.line2}, `}
                {order.shippingAddress.city}, {order.shippingAddress.state}, {order.shippingAddress.pincode}
              </Typography>
            </Box>

            {/* Order Timeline (Status Editor) */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>📈 Order Timeline</Typography>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee', mb: 3 }}>
              {isEditing ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Status</InputLabel>
                      <Select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                        {['pending','confirmed','packed','shipped','delivered','cancelled','returned'].map(s => (
                          <MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {['shipped', 'delivered'].includes(newStatus) && (
                    <>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Courier Name" value={courier} onChange={e => setCourier(e.target.value)} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField fullWidth size="small" label="Tracking ID" value={tracking} onChange={e => setTracking(e.target.value)} />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={12} sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
                    <Button size="small" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="small" variant="contained" onClick={handleUpdateStatus} disabled={saving}>{saving ? 'Saving...' : 'Save Status'}</Button>
                  </Grid>
                </Grid>
              ) : (
                <Box>
                  <Typography variant="body2" fontWeight={700} color="primary">● {order.status.toUpperCase()}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 2, display: 'block' }}>{new Date(order.updatedAt).toLocaleString('en-IN')}</Typography>
                  {order.trackingNumber && (
                    <Typography variant="caption" sx={{ ml: 2, mt: 1, display: 'block' }}>
                      Courier: <strong>{order.courierName}</strong> | AWB: <strong>{order.trackingNumber}</strong>
                    </Typography>
                  )}
                </Box>
              )}
            </Box>

            {/* Items */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>📦 Items</Typography>
            <Box sx={{ p: 2, bgcolor: '#fff', borderRadius: 2, border: '1px solid #eee', mb: 3 }}>
              {order.items.map(item => (
                <Box key={item._id} sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: '1px solid #F0F0F0', '&:last-child': { border: 0, mb: 0, pb: 0 } }}>
                  {item.image ? <img src={item.image} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8 }} /> : <Box sx={{ width: 48, height: 48, bgcolor: '#eee', borderRadius: 2 }} />}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                    {item.variantName && <Typography variant="caption" color="text.secondary">{item.variantName}</Typography>}
                    <Typography variant="body2" mt={0.5}>₹{item.price} × {item.quantity}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700}>₹{item.total}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color="text.secondary">Subtotal</Typography><Typography variant="body2" fontWeight={600}>₹{order.subtotal}</Typography></Box>
              {order.deliveryFee > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color="text.secondary">Delivery</Typography><Typography variant="body2" fontWeight={600}>₹{order.deliveryFee}</Typography></Box>}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}><Typography variant="subtitle2" fontWeight={700}>Total</Typography><Typography variant="subtitle2" fontWeight={700} color="primary">₹{order.total}</Typography></Box>
            </Box>

          </Box>

          {/* Bottom Actions */}
          <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#fff', display: 'flex', gap: 2 }}>
            <Button variant="outlined" fullWidth onClick={() => setIsEditing(true)}>Update Status</Button>
            <Button variant="contained" fullWidth color="success" startIcon={<WhatsAppIcon />}>WhatsApp</Button>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}
