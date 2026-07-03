import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Chip, Button, Divider,
  TextField, MenuItem, Select, FormControl, InputLabel, Grid,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getOrder, updateOrderStatus } from '../api/endpoints';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const STATUS_STEPS = ['pending','confirmed','packed','shipped','delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [courier, setCourier] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getOrder(id).then(({ data }) => {
      setOrder(data.data);
      setNewStatus(data.data.status);
      setTracking(data.data.trackingNumber || '');
      setCourier(data.data.courierName || '');
    }).catch(() => toast.error('Order not found'));
  }, [id]);

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      const { data } = await updateOrderStatus(id, { status: newStatus, note, trackingNumber: tracking, courierName: courier });
      setOrder(data.data);
      toast.success('Order status updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  if (!order) return <Box sx={{ p: 4, textAlign: 'center' }}><Typography>Loading...</Typography></Box>;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 2, color: '#666' }}>
        Back to Orders
      </Button>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Order {order.orderNumber}</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Items</Typography>
              <Divider sx={{ mb: 2 }} />
              {order.items.map(item => (
                <Box key={item._id} sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: '1px solid #F0F0F0' }}>
                  {item.image && <img src={item.image} alt="" style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                    {item.variantName && <Typography variant="caption" color="text.secondary">{item.variantName}</Typography>}
                    <Typography variant="body2">₹{item.price} × {item.quantity} = ₹{item.total}</Typography>
                  </Box>
                </Box>
              ))}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4, mt: 1 }}>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" color="text.secondary">Subtotal: ₹{order.subtotal}</Typography><br />
                  {order.discount > 0 && <Typography variant="caption" color="success.main">Discount: -₹{order.discount}</Typography>}<br />
                  {order.deliveryFee > 0 && <Typography variant="caption">Delivery: ₹{order.deliveryFee}</Typography>}<br />
                  <Typography variant="subtitle2" fontWeight={700}>Total: ₹{order.total}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Update Status */}
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Update Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                      {['pending','confirmed','packed','shipped','delivered','cancelled','returned'].map(s => (
                        <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Courier Name" value={courier} onChange={e => setCourier(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Tracking Number" value={tracking} onChange={e => setTracking(e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth size="small" label="Note (optional)" value={note} onChange={e => setNote(e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <Button variant="contained" onClick={handleUpdateStatus} disabled={saving}>
                    {saving ? 'Saving...' : 'Update Status'}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Customer</Typography>
              <Typography variant="body2">{order.user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{order.user?.phone}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Shipping Address</Typography>
              <Typography variant="body2">{order.shippingAddress.name}</Typography>
              <Typography variant="body2">{order.shippingAddress.phone}</Typography>
              <Typography variant="body2" color="text.secondary">
                {order.shippingAddress.line1}, {order.shippingAddress.line2}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
              </Typography>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Payment</Typography>
              <Chip label={order.paymentMethod?.replace('_','/')} size="small" sx={{ mb: 1 }} />
              <Chip label={order.paymentStatus?.replace('_',' ')} size="small" color={order.paymentStatus === 'paid' ? 'success' : 'warning'} sx={{ mb: 1, ml: 1 }} />
              {order.upiTransactionId && <Typography variant="caption" display="block">UPI Ref: {order.upiTransactionId}</Typography>}
              {order.upiPaymentProof && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Payment Proof:</Typography>
                  <img src={order.upiPaymentProof} alt="proof" style={{ width: '100%', borderRadius: 8, marginTop: 4 }} />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
