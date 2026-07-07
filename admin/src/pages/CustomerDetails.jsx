import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, Chip, Divider,
  CircularProgress, Table, TableHead, TableBody, TableRow, TableCell,
  Button, List, ListItem, ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useParams, useNavigate } from 'react-router-dom';
import { getCustomer, getOrders } from '../api/endpoints';

export default function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [cRes, oRes] = await Promise.all([
          getCustomer(id),
          getOrders({ user: id, limit: 20 }),
        ]);
        setCustomer(cRes.data.data || cRes.data.user);
        setOrders(oRes.data.orders || oRes.data.data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}>
      <CircularProgress />
    </Box>
  );

  if (!customer) return (
    <Box sx={{ p: 3 }}>
      <Typography color="error">Customer not found</Typography>
    </Box>
  );

  const totalSpent = orders
    .filter(o => ['confirmed', 'packed', 'shipped', 'delivered'].includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/customers')} sx={{ mb: 2 }}>
        Back to Customers
      </Button>

      <Grid container spacing={2.5}>
        {/* Profile Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', pb: 2 }}>
              <Avatar
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: '#FF6B001A', color: '#FF6B00', fontSize: 32, fontWeight: 700 }}
              >
                {(customer.name || 'U')[0].toUpperCase()}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{customer.name || '—'}</Typography>
              <Typography color="text.secondary" fontSize={14}>{customer.phone}</Typography>
              {customer.email && <Typography color="text.secondary" fontSize={13}>{customer.email}</Typography>}
              <Chip
                label={customer.isActive ? 'Active' : 'Blocked'}
                color={customer.isActive ? 'success' : 'error'}
                size="small"
                sx={{ mt: 1, fontWeight: 600 }}
              />
            </CardContent>
            <Divider />
            <CardContent>
              <Grid container spacing={1}>
                {[
                  { label: 'Total Orders', value: orders.length },
                  { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}` },
                  { label: 'Joined', value: new Date(customer.createdAt).toLocaleDateString('en-IN') },
                  { label: 'Addresses', value: customer.addresses?.length || 0 },
                ].map(s => (
                  <Grid key={s.label} item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 1, bgcolor: '#fafafa', borderRadius: 1 }}>
                      <Typography fontWeight={700} color="primary">{s.value}</Typography>
                      <Typography fontSize={11} color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>

          {/* Addresses */}
          {customer.addresses?.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>Saved Addresses</Typography>
                {customer.addresses.map((addr, i) => (
                  <Box key={i} sx={{ mb: 1, p: 1.5, bgcolor: '#fafafa', borderRadius: 1 }}>
                    <Typography fontSize={13} fontWeight={600}>{addr.name} · {addr.phone}</Typography>
                    <Typography fontSize={12} color="text.secondary">
                      {[addr.line1, addr.line2, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                    </Typography>
                    {addr.isDefault && <Chip label="Default" size="small" color="primary" sx={{ mt: 0.5 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Orders */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Order History ({orders.length})</Typography>
              {orders.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={4}>No orders yet</Typography>
              ) : (
                <Box sx={{ overflowX: 'auto' }}>
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
                        <TableRow
                          key={o._id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/orders/${o._id}`)}
                        >
                          <TableCell><Typography fontSize={13} fontWeight={600} color="primary">{o.orderNumber}</Typography></TableCell>
                          <TableCell><Typography fontSize={13}>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Typography></TableCell>
                          <TableCell><Typography fontSize={13}>{o.items?.length} item(s)</Typography></TableCell>
                          <TableCell align="right"><Typography fontSize={13} fontWeight={600}>₹{o.total?.toLocaleString('en-IN')}</Typography></TableCell>
                          <TableCell>
                            <Chip
                              label={o.status}
                              size="small"
                              sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                              color={
                                o.status === 'delivered' ? 'success' :
                                o.status === 'cancelled' ? 'error' :
                                o.status === 'pending' ? 'warning' : 'primary'
                              }
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
