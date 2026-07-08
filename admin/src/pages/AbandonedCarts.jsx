import React, { useEffect, useState } from 'react';
import { 
  Box, Card, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell, 
  CircularProgress, TextField, Stack, Button, IconButton, Drawer, Divider, Chip,
  Grid, Avatar
} from '@mui/material';
import { 
  WhatsApp as WhatsAppIcon, 
  Close as CloseIcon, 
  DeleteOutline as DeleteOutlineIcon,
  ShoppingCart as ShoppingCartIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getAbandonedCarts, dismissAbandonedCart } from '../api/endpoints';
import toast from 'react-hot-toast';
import TimeframeFilter from '../components/TimeframeFilter';

dayjs.extend(relativeTime);

export default function AbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCart, setSelectedCart] = useState(null);
  
  const [timeframe, setTimeframe] = useState('all_time');
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });

  const fetchCarts = async () => {
    setLoading(true);
    try { 
      const params = {};
      if (dateRange.startDate) params.dateFrom = dateRange.startDate;
      if (dateRange.endDate) params.dateTo = dateRange.endDate;
      const r = await getAbandonedCarts(params); 
      setCarts(r.data.data || []); 
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    } 
  };

  useEffect(() => { 
    fetchCarts();
  }, [dateRange]);

  const filteredCarts = carts.filter(c => {
    const term = search.toLowerCase();
    const name = c.user?.name?.toLowerCase() || 'guest user';
    const phone = c.user?.phone?.toLowerCase() || '';
    return name.includes(term) || phone.includes(term);
  });

  const getCartValue = (cart) => {
    return cart.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
  };

  const totalAbandoned = carts.length;
  const lostRevenue = carts.reduce((sum, cart) => sum + getCartValue(cart), 0);
  const totalItems = carts.reduce((sum, cart) => sum + (cart.items?.reduce((s, i) => s + i.quantity, 0) || 0), 0);

  const openWhatsApp = (phone, name, itemsCount) => {
    if (!phone) return;
    const message = `Hi ${name},\nWe noticed you left ${itemsCount} item(s) in your Pretina cart. Let us know if you need any help completing your purchase!`;
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleDismiss = async (cartId) => {
    if (!window.confirm('Are you sure you want to dismiss this abandoned cart?')) return;
    
    try {
      const res = await dismissAbandonedCart(cartId);
      if (res.data.success) {
        toast.success('Abandoned cart dismissed');
        setCarts(prev => prev.filter(c => c._id !== cartId));
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to dismiss cart');
    }
  };

  return (
    <Box sx={{ p: 3, position: 'relative' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCartIcon fontSize="large" color="primary" /> Abandoned Carts
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Recover lost sales by reaching out to customers who left items in their cart
      </Typography>

      {/* Summary Cards */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary">{totalAbandoned}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Abandoned</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h4" fontWeight={800} color="error.main">
                  ₹{lostRevenue.toLocaleString('en-IN')}
                </Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Lost Revenue</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box>
                <Typography variant="h4" fontWeight={800} color="text.primary">{totalItems}</Typography>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>Total Items</Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Table Card */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ pb: 0, display: 'flex', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 300 }}
              InputProps={{ sx: { borderRadius: 2 } }}
            />
            <TimeframeFilter 
              value={timeframe} 
              onChange={({ timeframe, startDate, endDate }) => {
                setTimeframe(timeframe);
                setDateRange({ startDate, endDate });
              }} 
            />
          </Stack>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchCarts}
            sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}
          >
            Refresh
          </Button>
        </CardContent>
        <CardContent>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box>
          ) : (
            <Table size="medium">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', borderBottom: '2px solid #eee' } }}>
                  <TableCell>Customer</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Cart Value</TableCell>
                  <TableCell>Abandoned Since</TableCell>
                  <TableCell>Last Active</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCarts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>No abandoned carts found</TableCell>
                  </TableRow>
                ) : filteredCarts.map(c => {
                  const val = getCartValue(c);
                  const isRecent = dayjs().diff(dayjs(c.updatedAt), 'hour') < 24;
                  return (
                    <TableRow key={c._id} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Typography 
                          fontWeight={600} 
                          color="primary.main" 
                          sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          onClick={() => setSelectedCart(c)}
                        >
                          {c.user?.name || 'Guest User'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{c.user?.phone || '—'}</TableCell>
                      <TableCell>{c.items?.reduce((s, i) => s + i.quantity, 0) || 0}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>₹{val.toLocaleString('en-IN')}</TableCell>
                      <TableCell>{dayjs(c.updatedAt).fromNow()}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                        {dayjs(c.updatedAt).format('DD MMM YYYY, hh:mm A')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={isRecent ? 'Recent' : 'At Risk'} 
                          size="small"
                          sx={{ 
                            fontWeight: 600, 
                            bgcolor: isRecent ? '#e3f2fd' : '#fff3e0',
                            color: isRecent ? '#1565c0' : '#e65100',
                            borderRadius: 1
                          }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<WhatsAppIcon />}
                            onClick={() => openWhatsApp(c.user?.phone, c.user?.name || 'Guest User', c.items?.length || 0)}
                            sx={{ 
                              color: '#25D366', 
                              borderColor: '#25D366', 
                              borderRadius: 2, 
                              textTransform: 'none',
                              '&:hover': { borderColor: '#1DA851', bgcolor: 'rgba(37,211,102,0.05)' }
                            }}
                          >
                            WhatsApp
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<DeleteOutlineIcon />}
                            color="inherit"
                            onClick={() => handleDismiss(c._id)}
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                          >
                            Dismiss
                          </Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Drawer for Cart Details */}
      <Drawer
        anchor="right"
        open={Boolean(selectedCart)}
        onClose={() => setSelectedCart(null)}
        PaperProps={{ sx: { width: 420, display: 'flex', flexDirection: 'column' } }}
      >
        {selectedCart && (
          <>
            <Box sx={{ p: 3, bgcolor: '#1a1d27', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Cart #{selectedCart._id.slice(-6).toUpperCase()}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Value: ₹{getCartValue(selectedCart).toLocaleString('en-IN')}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                <IconButton size="small" sx={{ color: 'white' }} onClick={() => openWhatsApp(selectedCart.user?.phone, selectedCart.user?.name, selectedCart.items?.length)}>
                  <WhatsAppIcon />
                </IconButton>
                <IconButton size="small" sx={{ color: 'white' }} onClick={() => setSelectedCart(null)}>
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ p: 3, flex: 1, overflowY: 'auto', bgcolor: '#f8f9fa' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary' }}>Customer</Typography>
              <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <CardContent sx={{ p: '16px !important', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    {(selectedCart.user?.name || 'G').charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={700}>{selectedCart.user?.name || 'Guest User'}</Typography>
                    <Typography variant="body2" color="text.secondary">{selectedCart.user?.phone || 'No phone'}</Typography>
                  </Box>
                </CardContent>
              </Card>

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'text.secondary' }}>
                Products ({selectedCart.items?.reduce((s, i) => s + i.quantity, 0) || 0})
              </Typography>
              <Stack spacing={2}>
                {selectedCart.items?.map((item, idx) => (
                  <Card key={idx} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{ p: '16px !important', display: 'flex', gap: 2 }}>
                      <Box 
                        sx={{ 
                          width: 60, height: 60, borderRadius: 1, bgcolor: '#f0f0f0', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, overflow: 'hidden'
                        }}
                      >
                        {item.product?.images?.[0] ? (
                          <img src={item.product.images[0]} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Typography variant="caption" color="text.disabled">No Img</Typography>
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600} variant="body2" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                          {item.product?.name || 'Unknown Product'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          {item.variantName ? `Variant: ${item.variantName}` : 'Standard'}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary">
                            MRP: ₹{item.product?.price || item.price} &nbsp;|&nbsp; Qty: {item.quantity} &nbsp;|&nbsp; Unit: ₹{item.price}
                          </Typography>
                          <Typography fontWeight={700}>
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>

            <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #eee' }}>
              <Button 
                fullWidth 
                variant="contained" 
                startIcon={<WhatsAppIcon />}
                onClick={() => openWhatsApp(selectedCart.user?.phone, selectedCart.user?.name, selectedCart.items?.length)}
                sx={{ 
                  bgcolor: '#25D366', 
                  color: 'white', 
                  py: 1.5, 
                  fontWeight: 700,
                  fontSize: '1rem',
                  textTransform: 'none',
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(37,211,102,0.4)',
                  '&:hover': { bgcolor: '#1DA851' }
                }}
              >
                Recover via WhatsApp
              </Button>
            </Box>
          </>
        )}
      </Drawer>
    </Box>
  );
}
