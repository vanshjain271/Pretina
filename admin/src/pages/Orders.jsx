import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Chip, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  MenuItem, Select, FormControl, InputLabel, CircularProgress,
  Pagination, Dialog, DialogTitle, DialogContent, DialogActions,
  Tabs, Tab, Checkbox, Stack, Tooltip, IconButton, Menu, Autocomplete,
  Divider, InputAdornment, Avatar
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import EditIcon from '@mui/icons-material/Edit';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InventoryIcon from '@mui/icons-material/Inventory';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import OrderDrawer from '../components/OrderDrawer';
import { 
  getOrders, confirmQrPayment, updateOrderCourier, bulkUpdateOrderStatus, 
  editOrder, getInvoicePDF, getPackingSlipPDF, deleteOrder, getProducts 
} from '../api/endpoints';
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
  const [tabIndex, setTabIndex] = useState(0); 
  const [filters, setFilters] = useState({ paymentMethod: '', paymentStatus: '', search: '', dateFrom: '', dateTo: '' });
  const [timeframe, setTimeframe] = useState('all_time');
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Dialogs
  const [qrDialog, setQrDialog] = useState(null);
  const [courierDialog, setCourierDialog] = useState(null);
  const [courierForm, setCourierForm] = useState({ courierName: '', trackingNumber: '', trackingUrl: '' });
  
  // Edit Dialog State
  const [editDialog, setEditDialog] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editShipping, setEditShipping] = useState('0');
  const [editDiscount, setEditDiscount] = useState('0');
  const [editTokenReceived, setEditTokenReceived] = useState('0');
  const [editAdminNote, setEditAdminNote] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  
  // Autocomplete Products
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  
  // Drawer State
  const [drawerOrder, setDrawerOrder] = useState(null);

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
      // Update drawer order if it was open
      if (drawerOrder) {
        const updatedOrder = data.data.find(o => o._id === drawerOrder._id);
        if (updatedOrder) setDrawerOrder(updatedOrder);
      }
    } catch (err) {
      toast.error('Failed to load orders');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page, tabIndex, filters.paymentMethod, filters.paymentStatus, filters.dateFrom, filters.dateTo]);

  const debouncedSearchProducts = useMemo(() => {
    let timeoutId;
    return (query) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        executeSearchProducts(query);
      }, 300);
    };
  }, []);

  const searchProducts = (query) => {
    if (!query || query.length < 2) return;
    setProductSearchLoading(true);
    debouncedSearchProducts(query);
  };

  const executeSearchProducts = async (query) => {
    try {
      const resp = await getProducts({ search: query, limit: 10 });
      const products = resp?.data?.data || [];
      const flatOptions = [];
      products.forEach((p) => {
        flatOptions.push({
          _id: p._id,
          variantId: null,
          name: p.name,
          variantName: '',
          displayName: p.sku ? `${p.name} (${p.sku})` : p.name,
          sku: p.sku || '',
          salePrice: p.salePrice || p.price || 0,
          mrp: p.price || p.salePrice || 0,
          image: p.images?.[0] || ''
        });
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v) => {
            flatOptions.push({
              _id: p._id,
              variantId: v._id,
              name: p.name,
              variantName: v.name,
              displayName: `${p.name} - ${v.name} ${v.sku ? `(${v.sku})` : ''}`,
              sku: v.sku || p.sku || '',
              salePrice: v.salePrice || p.salePrice || 0,
              mrp: v.price || p.price || 0,
              image: v.images?.[0] || p.images?.[0] || ''
            });
          });
        }
      });
      setProductOptions(flatOptions);
    } catch (error) {
      console.error('Search failed', error);
    }
    setProductSearchLoading(false);
  };

  const openEditDialog = (order) => {
    setDrawerOrder(null);
    setEditDialog(order);
    setEditItems((order.items || []).map(item => ({ ...item, _id: undefined })));
    setEditShipping(String(order.deliveryFee || 0));
    setEditDiscount(String(order.discount || 0));
    setEditTokenReceived(String(order.tokenReceived || 0));
    setEditAdminNote(order.adminNote || '');
  };

  const handleEditSave = async () => {
    if (!editDialog) return;
    setEditSaving(true);
    try {
      await editOrder(editDialog._id, {
        items: editItems,
        deliveryFee: parseFloat(editShipping) || 0,
        discount: parseFloat(editDiscount) || 0,
        tokenReceived: parseFloat(editTokenReceived) || 0,
        adminNote: editAdminNote,
      });
      toast.success('Order updated successfully');
      setEditDialog(null);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update order');
    }
    setEditSaving(false);
  };

  const handleDeleteOrder = async (orderToDel) => {
    if (!orderToDel) return;
    if (!window.confirm('Are you sure you want to completely delete this order? This action cannot be undone.')) return;
    try {
      await deleteOrder(orderToDel._id);
      toast.success('Order deleted successfully');
      setDrawerOrder(null);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete order');
    }
  };

  const downloadInvoice = async (order) => {
    if (!order) return;
    try {
      const res = await getInvoicePDF(order._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Invoice downloaded!');
    } catch (err) {
      toast.error('Failed to download invoice');
    }
  };

  const downloadPackingSlip = async (order) => {
    if (!order) return;
    try {
      const res = await getPackingSlipPDF(order._id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `packing-slip-${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('Packing slip downloaded!');
    } catch (err) {
      toast.error('Failed to download packing slip');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(orders.map(o => o._id));
    else setSelectedIds([]);
  };
  const handleSelectOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

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

  const handleExportCSV = () => {
    const status = getStatusFromTab(tabIndex);
    const token = localStorage.getItem('token') || localStorage.getItem('pretina_admin_token');
    let url = `${import.meta.env.VITE_API_URL || ''}/api/v1/orders/export?token=${token}`;
    if (status) url += `&status=${status}`;
    if (filters.dateFrom) url += `&startDate=${filters.dateFrom}`;
    if (filters.dateTo) url += `&endDate=${filters.dateTo}`;
    window.open(url, '_blank');
  };

  const editSubtotal = editItems.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
  const editTotal = Math.max(0, editSubtotal + (parseFloat(editShipping) || 0) - (parseFloat(editDiscount) || 0));

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
                    <Typography variant="body2" fontWeight={700} color="primary" sx={{ cursor: 'pointer' }} onClick={() => setDrawerOrder(order)}>
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
                        <IconButton size="small" onClick={() => setDrawerOrder(order)}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Update Tracking">
                        <IconButton size="small" color="primary" onClick={() => { setCourierDialog(order); setCourierForm({ courierName: order.courierName||'', trackingNumber: order.trackingNumber||'', trackingUrl: order.trackingUrl||'' }); }}>
                          <LocalShippingIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Order">
                        <IconButton size="small" color="secondary" onClick={() => openEditDialog(order)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {['packed', 'shipped', 'delivered'].includes(order.status) && (
                        <Tooltip title="Invoice">
                          <IconButton size="small" color="info" onClick={() => downloadInvoice(order)}>
                            <ReceiptIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
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
        <Dialog open onClose={() => setEditDialog(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon sx={{ mr: 1 }} /> Edit Order: {editDialog.orderNumber}
          </DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Modify items, quantities, prices. Totals are auto-calculated.
            </Typography>

            {/* Items */}
            {editItems.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  {item.image && (
                    <Box sx={{ width: 45, height: 45, borderRadius: 1, overflow: 'hidden', border: '1px solid #E2E8F0', flexShrink: 0, bgcolor: 'white' }}>
                      <img src={item.image} alt="item" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    </Box>
                  )}
                  <Box sx={{ flex: 1 }}>
                    <Autocomplete
                      freeSolo
                      size="small"
                      options={productOptions}
                      getOptionLabel={(option) => typeof option === 'string' ? option : option.displayName}
                      loading={productSearchLoading}
                      onInputChange={(_, val) => searchProducts(val)}
                      onChange={(_, val) => {
                        const copy = [...editItems];
                        if (val && typeof val !== 'string') {
                          copy[idx].name = val.name;
                          copy[idx].productId = val._id;
                          if (val.variantId) copy[idx].variantId = val.variantId;
                          if (val.variantName) copy[idx].variantName = val.variantName;
                          if (val.image) copy[idx].image = val.image;
                          copy[idx].price = val.salePrice || 0;
                        } else if (typeof val === 'string') {
                          copy[idx].name = val;
                        }
                        setEditItems(copy);
                      }}
                      value={item.variantName ? `${item.name} - ${item.variantName}` : (item.name || '')}
                      renderInput={(params) => (
                        <TextField {...params} label="Product Name & Variant" multiline maxRows={3} />
                      )}
                    />
                  </Box>
                  <IconButton size="small" color="error" onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))} sx={{ mt: 0.5 }}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Box sx={{ width: 80 }}>
                      <TextField size="small" label="Qty" type="number" value={item.quantity}
                        onChange={(e) => { const copy = [...editItems]; copy[idx].quantity = Number(e.target.value) || 1; setEditItems(copy); }}
                        inputProps={{ min: 1 }} />
                    </Box>
                    <Box sx={{ width: 110 }}>
                      <TextField size="small" label="Price (₹)" type="number" value={item.price}
                        onChange={(e) => { const copy = [...editItems]; copy[idx].price = Number(e.target.value) || 0; setEditItems(copy); }}
                        inputProps={{ min: 0 }} />
                    </Box>
                  </Box>
                  
                  <Box sx={{ textAlign: 'right', px: 2, py: 1, bgcolor: '#EFF6FF', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1 }}>Item Total</Typography>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E40AF' }}>
                      ₹{((Number(item.quantity) || 0) * (Number(item.price) || 0)).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}

            <Button startIcon={<AddIcon />} size="small" sx={{ mb: 2 }}
              onClick={() => setEditItems([...editItems, { name: '', quantity: 1, price: 0, productId: null }])}>
              Add Item
            </Button>

            <Divider sx={{ my: 2 }} />

            {/* Shipping & Discount */}
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField label="Delivery Fee (₹)" type="number" size="small" value={editShipping}
                onChange={(e) => setEditShipping(e.target.value)} inputProps={{ min: 0 }} />
              <TextField label="Flat Discount (₹)" type="number" size="small" value={editDiscount}
                onChange={(e) => setEditDiscount(e.target.value)} inputProps={{ min: 0 }} />
              <TextField label="Advance / Token (₹)" type="number" size="small" value={editTokenReceived}
                onChange={(e) => setEditTokenReceived(e.target.value)} inputProps={{ min: 0 }} />
            </Box>

            <TextField 
              label="Admin Note" size="small" fullWidth multiline rows={2} sx={{ mb: 2 }}
              value={editAdminNote} onChange={e => setEditAdminNote(e.target.value)} 
            />

            {/* Auto-calculated Totals */}
            <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 1.5, p: 2, border: '1px solid #BFDBFE' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Subtotal</Typography>
                <Typography variant="body2">₹{editSubtotal.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Delivery Fee</Typography>
                <Typography variant="body2">₹{(parseFloat(editShipping) || 0).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Discount</Typography>
                <Typography variant="body2" sx={{ color: 'success.main' }}>−₹{(parseFloat(editDiscount) || 0).toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Advance Token</Typography>
                <Typography variant="body2" sx={{ color: 'success.main' }}>−₹{(parseFloat(editTokenReceived) || 0).toLocaleString()}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>New Total</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#2563EB' }}>₹{editTotal.toLocaleString()}</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleEditSave} disabled={editSaving || editItems.length === 0}>
              {editSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Order Drawer */}
      <OrderDrawer 
        order={drawerOrder} 
        open={Boolean(drawerOrder)}
        onClose={() => setDrawerOrder(null)} 
        onEditStatus={(order) => { 
          const o = order || drawerOrder;
          setDrawerOrder(null);
          if (o?._id) {
            setSelectedIds([o._id]);
            toast('Select a new status from the bulk dropdown above ☝️', { icon: '👆' });
          }
        }}
        onEditOrder={() => openEditDialog(drawerOrder)}
        onPrintInvoice={() => downloadInvoice(drawerOrder)}
        onPrintPackingSlip={() => downloadPackingSlip(drawerOrder)}
        onDelete={() => handleDeleteOrder(drawerOrder)}
      />
    </Box>
  );
}
