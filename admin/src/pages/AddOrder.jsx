import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid, Autocomplete,
  IconButton, Divider, Stack, CircularProgress, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNavigate } from 'react-router-dom';
import { getCustomers, getProducts, createManualOrder, createCustomer } from '../api/endpoints';
import toast from 'react-hot-toast';

export default function AddOrder() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);

  // New Customer Form State
  const [customerDialog, setCustomerDialog] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', city: '', state: '' });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Form State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // Temp selection before adding to list
  const [cartItems, setCartItems] = useState([]);
  
  const [shippingAddress, setShippingAddress] = useState({
    name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India'
  });
  
  const [discount, setDiscount] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [tokenReceived, setTokenReceived] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cod');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cRes, pRes] = await Promise.all([
          getCustomers({ limit: 100 }),
          getProducts({ limit: 100 })
        ]);
        setCustomers(cRes.data.data || []);
        setProducts(pRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load customers and products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectCustomer = (val) => {
    setSelectedCustomer(val);
    if (val) {
      setShippingAddress({
        name: val.name || '',
        phone: val.phone || '',
        line1: val.addresses?.[0]?.line1 || '',
        line2: val.addresses?.[0]?.line2 || '',
        city: val.addresses?.[0]?.city || '',
        state: val.addresses?.[0]?.state || '',
        pincode: val.addresses?.[0]?.pincode || '',
        country: val.addresses?.[0]?.country || 'India'
      });
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomer.phone) return toast.error('Phone number is required');
    
    setCreatingCustomer(true);
    try {
      const payload = {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        addresses: [{
          isDefault: true,
          name: newCustomer.name,
          phone: newCustomer.phone,
          city: newCustomer.city,
          state: newCustomer.state,
          country: 'India'
        }]
      };
      
      const res = await createCustomer(payload);
      const createdUser = res.data.data;
      
      // Add to list and auto-select
      setCustomers([createdUser, ...customers]);
      handleSelectCustomer(createdUser);
      
      toast.success('Customer created successfully!');
      setCustomerDialog(false);
      setNewCustomer({ name: '', phone: '', email: '', city: '', state: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const productOptions = useMemo(() => {
    const options = [];
    products.forEach(p => {
      if (p.hasVariants && p.variants?.length > 0) {
        p.variants.forEach(v => {
          options.push({
            _id: p._id,
            variantId: v._id,
            name: p.name,
            variantName: `${v.name}${v.color ? ` - ${v.color}` : ''}`,
            displayLabel: `${p.name} - ${v.name}${v.color ? ` (${v.color})` : ''}`,
            price: v.salePrice || v.mrp || p.salePrice || p.price || 0,
            image: v.images?.[0] || p.images?.[0]
          });
        });
      } else {
        options.push({
          _id: p._id,
          name: p.name,
          variantName: '',
          displayLabel: p.name,
          price: p.salePrice || p.price || 0,
          image: p.images?.[0]
        });
      }
    });
    return options;
  }, [products]);

  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    // Check if already added
    const existing = cartItems.find(item => item.productId === selectedProduct._id && item.variantId === selectedProduct.variantId);
    if (existing) {
      setCartItems(cartItems.map(i => (i.productId === selectedProduct._id && i.variantId === selectedProduct.variantId) ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCartItems([...cartItems, { 
        productId: selectedProduct._id, 
        variantId: selectedProduct.variantId,
        variantName: selectedProduct.variantName,
        name: selectedProduct.name, 
        price: selectedProduct.price,
        quantity: 1,
        image: selectedProduct.image 
      }]);
    }
    setSelectedProduct(null);
  };

  const handleUpdateQty = (idx, qty) => {
    if (qty < 1) return;
    const newItems = [...cartItems];
    newItems[idx].quantity = qty;
    setCartItems(newItems);
  };

  const handleRemoveItem = (idx) => {
    setCartItems(cartItems.filter((_, i) => i !== idx));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const total = subtotal - Number(discount) + Number(deliveryFee);
  const due = total - Number(tokenReceived);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return toast.error('Please select a customer');
    if (cartItems.length === 0) return toast.error('Add at least one product');
    
    setSubmitting(true);
    try {
      const payload = {
        customerId: selectedCustomer._id,
        items: cartItems,
        shippingAddress,
        paymentMethod,
        discount: Number(discount),
        deliveryFee: Number(deliveryFee),
        tokenReceived: Number(tokenReceived)
      };
      
      const res = await createManualOrder(payload);
      toast.success('Manual order created successfully!');
      navigate(`/orders`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/orders')} sx={{ mb: 2 }}>
        Back to Orders
      </Button>

      <Typography variant="h5" fontWeight={700} mb={3}>Create Manual Order</Typography>

      <Grid container spacing={3}>
        {/* LEFT COLUMN */}
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            {/* Products Selection */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Order Items</Typography>
                
                <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                  <Autocomplete
                    options={productOptions}
                    getOptionLabel={(option) => `${option.displayLabel} (₹${option.price})`}
                    value={selectedProduct}
                    onChange={(e, val) => setSelectedProduct(val)}
                    fullWidth
                    size="small"
                    renderInput={(params) => <TextField {...params} label="Search and add products" />}
                  />
                  <Button variant="contained" onClick={handleAddProduct} disabled={!selectedProduct}>Add</Button>
                </Box>

                {cartItems.length > 0 ? (
                  <Box>
                    {cartItems.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', alignItems: 'center', py: 1.5, borderBottom: '1px solid #eee' }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, marginRight: 16 }} />
                        ) : (
                          <Box sx={{ width: 50, height: 50, bgcolor: '#f5f5f5', borderRadius: 6, mr: 2 }} />
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography fontWeight={600} fontSize={14}>{item.name}</Typography>
                          {item.variantName && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{item.variantName}</Typography>}
                          <Typography color="text.secondary" fontSize={13}>₹{item.price}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField 
                            type="number" size="small" sx={{ width: 70 }} 
                            value={item.quantity} 
                            onChange={(e) => handleUpdateQty(idx, parseInt(e.target.value))}
                          />
                          <Typography fontWeight={700} sx={{ minWidth: 80, textAlign: 'right' }}>
                            ₹{item.price * item.quantity}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => handleRemoveItem(idx)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="info">No products added yet.</Alert>
                )}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Shipping Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Name" value={shippingAddress.name} onChange={e => setShippingAddress(p => ({...p, name: e.target.value}))} required /></Grid>
                  <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Phone" value={shippingAddress.phone} onChange={e => setShippingAddress(p => ({...p, phone: e.target.value}))} required /></Grid>
                  <Grid item xs={12}><TextField fullWidth size="small" label="Address Line 1" value={shippingAddress.line1} onChange={e => setShippingAddress(p => ({...p, line1: e.target.value}))} required /></Grid>
                  <Grid item xs={12}><TextField fullWidth size="small" label="Address Line 2 (Optional)" value={shippingAddress.line2} onChange={e => setShippingAddress(p => ({...p, line2: e.target.value}))} /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="City" value={shippingAddress.city} onChange={e => setShippingAddress(p => ({...p, city: e.target.value}))} required /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="State" value={shippingAddress.state} onChange={e => setShippingAddress(p => ({...p, state: e.target.value}))} required /></Grid>
                  <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Pincode" value={shippingAddress.pincode} onChange={e => setShippingAddress(p => ({...p, pincode: e.target.value}))} required /></Grid>
                </Grid>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* RIGHT COLUMN */}
        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            {/* Customer Selection */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Select Customer</Typography>
                  <Button size="small" startIcon={<PersonAddIcon />} onClick={() => setCustomerDialog(true)}>
                    New Customer
                  </Button>
                </Box>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => `${option.name} (${option.phone})`}
                  value={selectedCustomer}
                  onChange={(e, val) => handleSelectCustomer(val)}
                  fullWidth
                  size="small"
                  renderInput={(params) => <TextField {...params} label="Search Customers" />}
                />
                {!selectedCustomer && (
                  <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                    Note: Customer must be registered first before you can create an order for them.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Payment & Summary */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Payment & Summary</Typography>
                
                <Stack spacing={2} mb={3}>
                  <TextField 
                    select 
                    SelectProps={{ native: true }}
                    label="Payment Method" 
                    size="small" 
                    fullWidth
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="qr_upi">Paid via QR/UPI</option>
                    <option value="razorpay">Paid via Razorpay Link</option>
                  </TextField>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField fullWidth size="small" label="Extra Discount (₹)" type="number" value={discount} onChange={e => setDiscount(e.target.value)} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField fullWidth size="small" label="Delivery Fee (₹)" type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth size="small" label="Advance Token Paid (₹)" type="number" value={tokenReceived} onChange={e => setTokenReceived(e.target.value)} helperText="Advance payment subtracted from total due" />
                    </Grid>
                  </Grid>
                </Stack>

                <Divider sx={{ my: 2 }} />
                
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Subtotal</Typography>
                    <Typography fontWeight={600}>₹{subtotal}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Discount</Typography>
                    <Typography fontWeight={600} color="error">-₹{discount || 0}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography color="text.secondary">Delivery Fee</Typography>
                    <Typography fontWeight={600}>+₹{deliveryFee || 0}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={700} fontSize={16}>Total Amount</Typography>
                    <Typography fontWeight={700} fontSize={16} color="primary">₹{total}</Typography>
                  </Box>
                  {Number(tokenReceived) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography fontWeight={600} fontSize={14} color="text.secondary">Advance Paid</Typography>
                      <Typography fontWeight={600} fontSize={14} color="success.main">-₹{tokenReceived}</Typography>
                    </Box>
                  )}
                  {Number(tokenReceived) > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography fontWeight={700} fontSize={18} color="error.main">Due Amount</Typography>
                      <Typography fontWeight={700} fontSize={20} color="error.main">₹{Math.max(due, 0)}</Typography>
                    </Box>
                  )}
                </Stack>

                <Button 
                  fullWidth 
                  variant="contained" 
                  size="large" 
                  sx={{ mt: 3 }}
                  onClick={handleSubmit}
                  disabled={submitting || cartItems.length === 0 || !selectedCustomer}
                >
                  {submitting ? <CircularProgress size={24} color="inherit" /> : 'Create Order'}
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      {/* New Customer Dialog */}
      <Dialog open={customerDialog} onClose={() => setCustomerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Customer</DialogTitle>
        <form onSubmit={handleCreateCustomer}>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField label="Full Name" size="small" fullWidth value={newCustomer.name} onChange={e => setNewCustomer(p => ({...p, name: e.target.value}))} required />
              <TextField label="Phone Number" size="small" fullWidth value={newCustomer.phone} onChange={e => setNewCustomer(p => ({...p, phone: e.target.value}))} required />
              <TextField label="Email Address (Optional)" type="email" size="small" fullWidth value={newCustomer.email} onChange={e => setNewCustomer(p => ({...p, email: e.target.value}))} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField label="City" size="small" fullWidth value={newCustomer.city} onChange={e => setNewCustomer(p => ({...p, city: e.target.value}))} />
                </Grid>
                <Grid item xs={6}>
                  <TextField label="State" size="small" fullWidth value={newCustomer.state} onChange={e => setNewCustomer(p => ({...p, state: e.target.value}))} />
                </Grid>
              </Grid>
              <Typography variant="caption" color="text.secondary">
                The customer can later log into the app directly using this phone number.
              </Typography>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomerDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={creatingCustomer}>
              {creatingCustomer ? 'Creating...' : 'Create Customer'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
