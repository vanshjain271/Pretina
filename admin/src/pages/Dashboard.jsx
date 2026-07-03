import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography,
  Chip, Divider, CircularProgress,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import InventoryIcon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { getOrders, getProducts, getUsers, getSettings } from '../api/endpoints';

const StatCard = ({ icon, label, value, color, sub }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Box sx={{
          width: 44, height: 44, borderRadius: '12px',
          background: `${color}18`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
        }}>
          {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">{value}</Typography>
        </Box>
      </Box>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </CardContent>
  </Card>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, productsRes, usersRes, settingsRes] = await Promise.all([
          getOrders({ limit: 5 }),
          getProducts({ limit: 1 }),
          getUsers({ limit: 1 }),
          getSettings(),
        ]);
        setStats({
          orders: ordersRes.data.pagination?.total || 0,
          products: productsRes.data.pagination?.total || 0,
          users: usersRes.data.pagination?.total || 0,
          pendingOrders: ordersRes.data.data?.filter(o => o.status === 'pending').length || 0,
          recentOrders: ordersRes.data.data || [],
        });
        setSettings(settingsRes.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress sx={{ color: '#FF6B00' }} />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">Welcome back — here's what's happening today.</Typography>
      </Box>

      {/* Payment Methods Status */}
      {settings && (
        <Card sx={{ mb: 3, border: '1px solid #E0E0E0' }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} color="#1A1A2E" gutterBottom>
              Payment Methods Active
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                label="Razorpay" size="small"
                color={settings.paymentRazorpayEnabled ? 'success' : 'default'}
                variant={settings.paymentRazorpayEnabled ? 'filled' : 'outlined'}
              />
              <Chip
                label="QR / UPI" size="small"
                color={settings.paymentQrEnabled ? 'success' : 'default'}
                variant={settings.paymentQrEnabled ? 'filled' : 'outlined'}
              />
              <Chip
                label="Cash on Delivery" size="small"
                color={settings.paymentCodEnabled ? 'success' : 'default'}
                variant={settings.paymentCodEnabled ? 'filled' : 'outlined'}
              />
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<ShoppingCartIcon />} label="Total Orders" value={stats?.orders || 0} color="#FF6B00" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PendingActionsIcon />} label="Pending Orders" value={stats?.pendingOrders || 0} color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<InventoryIcon />} label="Products" value={stats?.products || 0} color="#6366f1" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<PeopleIcon />} label="Customers" value={stats?.users || 0} color="#10b981" />
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="#1A1A2E" gutterBottom>
            Recent Orders
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {stats?.recentOrders.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No orders yet.
            </Typography>
          ) : (
            stats?.recentOrders.map((order) => (
              <Box key={order._id} sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                py: 1.5, borderBottom: '1px solid #F0F0F0',
              }}>
                <Box>
                  <Typography variant="body2" fontWeight={600}>{order.orderNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {order.user?.name} · ₹{order.total}
                  </Typography>
                </Box>
                <Chip
                  label={order.status}
                  size="small"
                  color={
                    order.status === 'delivered' ? 'success' :
                    order.status === 'pending' ? 'warning' :
                    order.status === 'cancelled' ? 'error' : 'default'
                  }
                />
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
