import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { getOrders, confirmQrPayment } from '../api/endpoints';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', packed: 'info',
  shipped: 'primary', delivered: 'success',
  cancelled: 'error', returned: 'error',
};

const PAYMENT_STATUS_COLORS = {
  pending: 'warning', advance_paid: 'info',
  paid: 'success', refunded: 'error', failed: 'error',
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', paymentMethod: '', paymentStatus: '' });
  const [qrDialog, setQrDialog] = useState(null);

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await getOrders(params);
      setOrders(data.data);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page, filters]);

  const handleConfirmQr = async (orderId) => {
    try {
      await confirmQrPayment(orderId);
      toast.success('QR payment confirmed!');
      setQrDialog(null);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm payment');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">Orders</Typography>
          <Typography variant="body2" color="text.secondary">{total} total orders</Typography>
        </Box>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ py: '12px !important' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterListIcon sx={{ color: '#999' }} />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                {['pending','confirmed','packed','shipped','delivered','cancelled','returned'].map(s => (
                  <MenuItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Payment</InputLabel>
              <Select label="Payment" value={filters.paymentMethod} onChange={e => setFilters(p => ({ ...p, paymentMethod: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="razorpay">Razorpay</MenuItem>
                <MenuItem value="qr_upi">QR / UPI</MenuItem>
                <MenuItem value="cod">COD</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Pay Status</InputLabel>
              <Select label="Pay Status" value={filters.paymentStatus} onChange={e => setFilters(p => ({ ...p, paymentStatus: e.target.value }))}>
                <MenuItem value="">All</MenuItem>
                {['pending','advance_paid','paid','refunded','failed'].map(s => (
                  <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#FAFAFA' }}>
                <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Pay Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4 }}>
                    <CircularProgress size={28} sx={{ color: '#FF6B00' }} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ textAlign: 'center', py: 4, color: '#999' }}>No orders found</TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{order.orderNumber}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.user?.name || 'N/A'}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.user?.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>₹{order.total}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={order.paymentMethod?.replace('_', '/')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.paymentStatus?.replace('_', ' ')}
                      size="small"
                      color={PAYMENT_STATUS_COLORS[order.paymentStatus] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      size="small"
                      color={STATUS_COLORS[order.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{dayjs(order.createdAt).format('DD MMM YYYY')}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button size="small" variant="outlined" startIcon={<VisibilityIcon />}
                        onClick={() => navigate(`/orders/${order._id}`)}>View</Button>
                      {order.paymentMethod === 'qr_upi' && order.paymentStatus === 'advance_paid' && (
                        <Button size="small" variant="contained" color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => setQrDialog(order)}>Confirm</Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 15 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={Math.ceil(total / 15)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>

      {/* QR Confirm Dialog */}
      {qrDialog && (
        <Dialog open onClose={() => setQrDialog(null)}>
          <DialogTitle>Confirm QR/UPI Payment</DialogTitle>
          <DialogContent>
            <Typography>Order: <strong>{qrDialog.orderNumber}</strong></Typography>
            <Typography>Amount: <strong>₹{qrDialog.total}</strong></Typography>
            {qrDialog.upiTransactionId && (
              <Typography>UPI Ref: <strong>{qrDialog.upiTransactionId}</strong></Typography>
            )}
            {qrDialog.upiPaymentProof && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">Payment Proof:</Typography>
                <img src={qrDialog.upiPaymentProof} alt="proof" style={{ width: '100%', maxWidth: 300, borderRadius: 8, marginTop: 4 }} />
              </Box>
            )}
            <Typography sx={{ mt: 2, color: '#666' }}>
              Verify the payment screenshot before confirming. This will mark the order as Confirmed.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQrDialog(null)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={() => handleConfirmQr(qrDialog._id)}>
              Confirm Payment
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
