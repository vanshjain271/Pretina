import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Checkbox, Stack, Tooltip, IconButton, Menu
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import OrderDrawer from '../components/OrderDrawer';
import { getOrders, confirmQrPayment, updateOrderCourier, bulkUpdateOrderStatus, editOrder } from '../api/endpoints';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import TimeframeFilter from '../components/TimeframeFilter';

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
  const [filters, setFilters] = useState({ paymentMethod: '', paymentStatus: '', search: '', dateFrom: '', dateTo: '' });
  const [timeframe, setTimeframe] = useState('all_time');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Dialogs
  const [qrDialog, setQrDialog] = useState(null);
  const [courierDialog, setCourierDialog] = useState(null);
  const [courierForm, setCourierForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '' });
  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({ discount: 0, deliveryFee: 0, tokenReceived: 0, adminNote: '' });
  
  // Drawer State
  const [drawerOrderId, setDrawerOrderId] = useState(null);

  const getStatusFromTab = (idx) => {
    switch(idx) {
      case 1: return 'pending';
      case 2: return 'packed';
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

  useEffect(() => { load(page); }, [page, tabIndex, filters.paymentMethod, filters.paymentStatus, filters.dateFrom, filters.dateTo]);

  // Bulk Selection
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(orders.map(o => o._id));
    else setSelectedIds([]);
  };
  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleBulkAction = async (status) => {
    setAnchorEl(null);
    if (!status || selectedIds.length === 0) return;
    try {
      await bulkUpdateOrderStatus({ orderIds: selectedIds, status });
      toast.success(`Updated ${selectedIds.length} orders to ${status}`);
      load(page);
    } catch (err) {
      toast.error('Failed to update orders');
    }
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

  const handleEditOrder = async () => {
    try {
      await editOrder(editDialog._id, editForm);
      toast.success('Order updated successfully');
      setEditDialog(null);
      load(page);
    } catch (err) {
      toast.error('Failed to update order');
    }
  };

  const openEditDialog = (order) => {
    setEditDialog(order);
    setEditForm({
      discount: order.discount || 0,
      deliveryFee: order.deliveryFee || 0,
      tokenReceived: order.tokenReceived || 0,
      adminNote: order.adminNote || '',
    });
  };

  const handleExportCSV = () => {
    const status = getStatusFromTab(tabIndex);
    const token = localStorage.getItem('token') || localStorage.getItem('pretina_admin_token');
    let url = `${import.meta.env.VITE_API_URL || ''}/api/v1/orders/export?token=${token}`;
    if (status) url += `&status=${status}`;
    if (filters.dateFrom) url += `&startDate=${filters.dateFrom}`;
    if (filters.dateTo) url += `&endDate=${filters.dateTo}`;
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
            <Stack direction="row" spacing={2} sx={{ flex: 1, flexWrap: 'wrap' }}>
              <TextField 
                size="small" 
                placeholder="Search by ID or Name..."
                value={filters.search}
                onChange={e => { setFilters(p => ({ ...p, search: e.target.value })); setPage(1); }}
                sx={{ bgcolor: '#fff', minWidth: 200, flex: 1, maxWidth: 250 }}
              />
              <TimeframeFilter
                value={timeframe}
                onChange={({ timeframe: tf, startDate, endDate }) => {
                  setTimeframe(tf);
                  setFilters(p => ({ ...p, dateFrom: startDate, dateTo: endDate }));
                  setPage(1);
                }}
              />
              <FormControl size="small" sx={{ minWidth: 120, bgcolor: '#fff' }}>
                <InputLabel>Payment</InputLabel>
                <Select label="Payment" value={filters.paymentMethod} onChange={e => { setFilters(p => ({ ...p, paymentMethod: e.target.value })); setPage(1); }}>
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="razorpay">Razorpay</MenuItem>
                  <MenuItem value="qr_upi">QR / UPI</MenuItem>
                  <MenuItem value="cod">COD</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120, bgcolor: '#fff' }}>
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
                <Button 
                  size="small" variant="contained" color="primary" 
                  endIcon={<KeyboardArrowDownIcon />}
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  Update Status
                </Button>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                  <MenuItem onClick={() => handleBulkAction('confirmed')}>Mark Confirmed</MenuItem>
                  <MenuItem onClick={() => handleBulkAction('packed')}>Mark Packed</MenuItem>
                  <MenuItem onClick={() => handleBulkAction('shipped')}>Mark Shipped</MenuItem>
                  <MenuItem onClick={() => handleBulkAction('delivered')}>Mark Delivered</MenuItem>
                  <MenuItem onClick={() => handleBulkAction('cancelled')}>Mark Cancelled</MenuItem>
                </Menu>
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
                    <Typography variant="body2" fontWeight={700} color="primary" sx={{ cursor: 'pointer' }} onClick={() => setDrawerOrderId(order._id)}>
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
                        <IconButton size="small" onClick={() => setDrawerOrderId(order._id)}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Update Tracking">
                        <IconButton size="small" color="primary" onClick={() => { setCourierDialog(order); setCourierForm({ courierName: order.courierName||'', trackingNumber: order.trackingNumber||'', trackingUrl: order.trackingUrl||'' }); }}>
                          <LocalShippingIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Pricing/Token">
                        <IconButton size="small" color="secondary" onClick={() => openEditDialog(order)}>
                          <EditIcon fontSize="small" />
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

      {/* Edit Order Dialog */}
      {editDialog && (
        <Dialog open onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Order Totals</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField 
                label="Discount (₹)" type="number" size="small" fullWidth 
                value={editForm.discount} onChange={e => setEditForm(f => ({...f, discount: Number(e.target.value)}))} 
              />
              <TextField 
                label="Delivery Fee (₹)" type="number" size="small" fullWidth 
                value={editForm.deliveryFee} onChange={e => setEditForm(f => ({...f, deliveryFee: Number(e.target.value)}))} 
              />
              <TextField 
                label="Token / Advance Received (₹)" type="number" size="small" fullWidth 
                value={editForm.tokenReceived} onChange={e => setEditForm(f => ({...f, tokenReceived: Number(e.target.value)}))} 
              />
              <TextField 
                label="Admin Note" size="small" fullWidth multiline rows={2}
                value={editForm.adminNote} onChange={e => setEditForm(f => ({...f, adminNote: e.target.value}))} 
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleEditOrder}>Save Order</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Order Drawer */}
      <OrderDrawer 
        orderId={drawerOrderId} 
        onClose={() => setDrawerOrderId(null)} 
        onUpdate={load} 
      />
    </Box>
  );
}
