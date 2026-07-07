import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Checkbox, Stack, Tooltip, IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useNavigate } from 'react-router-dom';
import { getOrders, confirmQrPayment, updateOrderCourier } from '../api/endpoints';
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
  
  // Filtering & Tabs
  const [tabIndex, setTabIndex] = useState(0); // 0=All, 1=Pending, 2=Ready to Ship, 3=Shipped, 4=Delivered
  const [filters, setFilters] = useState({ paymentMethod: '', paymentStatus: '', search: '' });
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Dialogs
  const [qrDialog, setQrDialog] = useState(null);
  const [courierDialog, setCourierDialog] = useState(null);
  const [courierForm, setCourierForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '' });

  const getStatusFromTab = (idx) => {
    switch(idx) {
      case 1: return 'pending';
      case 2: return 'packed'; // Ready to ship
      case 3: return 'shipped';
      case 4: return 'delivered';
      default: return '';
    }
  };

  const load = async (pg = 1) => {
    setLoading(true);
    try {
      const status = getStatusFromTab(tabIndex);
      const params = { page: pg, limit: 15, status, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      
      const { data } = await getOrders(params);
      setOrders(data.data);
      setTotal(data.pagination?.total || 0);
      setSelectedIds([]);
    } catch (err) {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page, tabIndex, filters.paymentMethod, filters.paymentStatus]);

  // Bulk Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(orders.map(o => o._id));
    else setSelectedIds([]);
  };
  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

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

  const handleUpdateCourier = async () => {
    try {
      await updateOrderCourier(courierDialog._id, courierForm);
      toast.success('Courier details updated');
      setCourierDialog(null);
      load(page);
    } catch (err) {
      toast.error('Failed to update courier details');
    }
  };

  const handleExportCSV = () => {
    const status = getStatusFromTab(tabIndex);
    const token = localStorage.getItem('pretina_admin_token');
    const url = `${import.meta.env.VITE_API_URL}/api/v1/orders/export?status=${status}&token=${token}`;
    window.open(url, '_blank');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">Orders</Typography>
          <Typography variant="body2" color="text.secondary">{total} total orders</Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV}>
            Export CSV
          </Button>
          <Button variant="contained" onClick={() => navigate('/orders/add')}>
            Create Manual Order
          </Button>
        </Stack>
      </Box>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tabIndex} onChange={(e, v) => { setTabIndex(v); setPage(1); }} variant="scrollable">
          <Tab label="All Orders" />
          <Tab label="Pending" />
          <Tab label="Ready to Ship (Packed)" />
          <Tab label="Shipped" />
          <Tab label="Delivered" />
        </Tabs>
        
        <CardContent sx={{ py: 2, background: '#fafafa', borderTop: '1px solid #eee' }}>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 140, bgcolor: '#fff' }}>
                <InputLabel>Payment</InputLabel>
                <Select label="Payment" value={filters.paymentMethod} onChange={e => { setFilters(p => ({ ...p, paymentMethod: e.target.value })); setPage(1); }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="razorpay">Razorpay</MenuItem>
                  <MenuItem value="qr_upi">QR / UPI</MenuItem>
                  <MenuItem value="cod">COD</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 140, bgcolor: '#fff' }}>
                <InputLabel>Pay Status</InputLabel>
                <Select label="Pay Status" value={filters.paymentStatus} onChange={e => { setFilters(p => ({ ...p, paymentStatus: e.target.value })); setPage(1); }}>
                  <MenuItem value="">All</MenuItem>
                  {['pending','advance_paid','paid','refunded','failed'].map(s => (
                    <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            {selectedIds.length > 0 && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" fontWeight={600} color="primary">{selectedIds.length} selected</Typography>
                <Button size="small" variant="outlined" color="primary">Bulk Actions</Button>
              </Stack>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#FAFAFA' }}>
                <TableCell padding="checkbox">
                  <Checkbox 
                    checked={orders.length > 0 && selectedIds.length === orders.length}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < orders.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Order Info</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Amount & Pay</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Courier / AWB</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                    <CircularProgress size={28} sx={{ color: '#FF6B00' }} />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6, color: '#999' }}>No orders found in this view</TableCell>
                </TableRow>
              ) : orders.map((order) => (
                <TableRow key={order._id} hover selected={selectedIds.includes(order._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox checked={selectedIds.includes(order._id)} onChange={() => handleSelectOne(order._id)} />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary" sx={{ cursor: 'pointer' }} onClick={() => navigate(`/orders/${order._id}`)}>
                      {order.orderNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{dayjs(order.createdAt).format('DD MMM, h:mm A')}</Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{order.shippingAddress?.name || order.user?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.shippingAddress?.city}, {order.shippingAddress?.state}</Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>₹{order.total?.toLocaleString('en-IN')}</Typography>
                    <Stack direction="row" spacing={1} mt={0.5}>
                      <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>{order.paymentMethod?.replace('_', '/')}</Typography>
                      <Chip label={order.paymentStatus?.replace('_', ' ')} size="small" color={PAYMENT_STATUS_COLORS[order.paymentStatus] || 'default'} sx={{ height: 18, fontSize: '10px' }} />
                    </Stack>
                  </TableCell>

                  <TableCell>
                    {order.trackingNumber ? (
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{order.courierName}</Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="caption">{order.trackingNumber}</Typography>
                          <IconButton size="small" onClick={() => navigator.clipboard.writeText(order.trackingNumber)} sx={{ p: 0.5 }}>
                            <ContentCopyIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Stack>
                      </Box>
                    ) : (
                      <Button size="small" color="inherit" onClick={() => { setCourierDialog(order); setCourierForm({ courierName: order.courierName||'', trackingNumber: order.trackingNumber||'', trackingUrl: order.trackingUrl||'' }); }}>
                        + Add Tracking
                      </Button>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Chip label={order.status} size="small" color={STATUS_COLORS[order.status] || 'default'} sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
                  </TableCell>
                  
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => navigate(`/orders/${order._id}`)}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Update Tracking">
                        <IconButton size="small" color="primary" onClick={() => { setCourierDialog(order); setCourierForm({ courierName: order.courierName||'', trackingNumber: order.trackingNumber||'', trackingUrl: order.trackingUrl||'' }); }}>
                          <LocalShippingIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {order.paymentMethod === 'qr_upi' && order.paymentStatus === 'advance_paid' && (
                        <Tooltip title="Confirm Payment">
                          <IconButton size="small" color="success" onClick={() => setQrDialog(order)}>
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
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
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setQrDialog(null)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={() => handleConfirmQr(qrDialog._id)}>
              Confirm Payment
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Courier Update Dialog */}
      {courierDialog && (
        <Dialog open onClose={() => setCourierDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Update Courier Tracking</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Courier Partner Name" size="small" fullWidth value={courierForm.courierName} onChange={e => setCourierForm(f => ({...f, courierName: e.target.value}))} placeholder="e.g. Delhivery, Bluedart" />
              <TextField label="Tracking AWB Number" size="small" fullWidth value={courierForm.trackingNumber} onChange={e => setCourierForm(f => ({...f, trackingNumber: e.target.value}))} />
              <TextField label="Tracking URL (Optional)" size="small" fullWidth value={courierForm.trackingUrl} onChange={e => setCourierForm(f => ({...f, trackingUrl: e.target.value}))} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCourierDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateCourier}>Save Tracking Info</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
