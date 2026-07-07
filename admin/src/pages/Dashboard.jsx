import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Avatar,
  CircularProgress, Button, Divider, List, ListItem, ListItemText,
  ListItemAvatar, IconButton, Tooltip,
} from '@mui/material';
import TrendingUpIcon     from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon   from '@mui/icons-material/ShoppingCart';
import PeopleIcon         from '@mui/icons-material/People';
import InventoryIcon      from '@mui/icons-material/Inventory2';
import WarningAmberIcon   from '@mui/icons-material/WarningAmber';
import RefreshIcon        from '@mui/icons-material/Refresh';
import ArrowForwardIcon   from '@mui/icons-material/ArrowForward';
import { useNavigate }    from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as ChartTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { getDashboardOverview } from '../api/endpoints';

const COLORS = ['#FF6B00', '#1A1A2E', '#4CAF50', '#2196F3', '#FF5722', '#9C27B0'];

function StatCard({ label, value, icon, sub, color = '#FF6B00', onClick }) {
  return (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(255,107,0,0.15)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500} textTransform="uppercase" letterSpacing={0.5}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ color, my: 0.5 }}>
              {value ?? <CircularProgress size={24} />}
            </Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Avatar sx={{ bgcolor: `${color}18`, color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending:   { color: 'warning', label: 'Pending' },
    confirmed: { color: 'info',    label: 'Confirmed' },
    packed:    { color: 'primary', label: 'Packed' },
    shipped:   { color: 'primary', label: 'Shipped' },
    delivered: { color: 'success', label: 'Delivered' },
    cancelled: { color: 'error',   label: 'Cancelled' },
    returned:  { color: 'default', label: 'Returned' },
  };
  const s = map[status] || { color: 'default', label: status };
  return <Chip label={s.label} color={s.color} size="small" sx={{ fontWeight: 600 }} />;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardOverview();
      setData(res.data.overview);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const ov = data || {};

  // Build pie data from ordersByStatus
  const statusPieData = ov.ordersByStatus
    ? Object.entries(ov.ordersByStatus).map(([k, v]) => ({ name: k, value: v }))
    : [];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* AI Insight Banner */}
      {ov.lowStockProducts > 0 && (
        <Card sx={{
          mb: 3,
          background: 'linear-gradient(135deg, #FF6B00 0%, #FF8C38 100%)',
          color: '#fff',
        }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
            <WarningAmberIcon />
            <Typography fontWeight={600} flex={1}>
              ⚠️ {ov.lowStockProducts} product(s) running low on stock — review inventory
            </Typography>
            <Button
              variant="outlined"
              size="small"
              sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap' }}
              onClick={() => navigate('/analytics/inventory')}
            >
              View Inventory
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Revenue This Month"
            value={ov.thisMonth ? `₹${ov.thisMonth.sales?.toLocaleString('en-IN') || 0}` : null}
            icon={<TrendingUpIcon />}
            sub={`${ov.thisMonth?.orders || 0} orders`}
            color="#FF6B00"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Total Customers"
            value={ov.totalCustomers ?? null}
            icon={<PeopleIcon />}
            sub={`${ov.last30Days?.activeUsers || 0} active (30d)`}
            color="#1A1A2E"
            onClick={() => navigate('/customers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Orders (30 days)"
            value={ov.last30Days?.orders ?? null}
            icon={<ShoppingCartIcon />}
            sub={`${ov.abandonedCarts || 0} abandoned`}
            color="#4CAF50"
            onClick={() => navigate('/orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            label="Low Stock Items"
            value={ov.lowStockProducts ?? null}
            icon={<InventoryIcon />}
            sub="Products below threshold"
            color={ov.lowStockProducts > 0 ? '#FF5722' : '#4CAF50'}
            onClick={() => navigate('/analytics/inventory')}
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Sales Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Sales Trend (Last 30 Days)</Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/reports')}>
                  Full Report
                </Button>
              </Box>
              {ov.salesTrend && ov.salesTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={ov.salesTrend}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#FF6B00" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={d => d.slice(5)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                    <ChartTooltip
                      formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Sales']}
                      labelFormatter={l => `Date: ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#FF6B00"
                      strokeWidth={2}
                      fill="url(#salesGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading
                    ? <CircularProgress size={32} />
                    : <Typography color="text.secondary">No sales data for this period</Typography>
                  }
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Order Status Pie */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Orders by Status</Typography>
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend iconSize={10} iconType="circle" />
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {loading
                    ? <CircularProgress size={32} />
                    : <Typography color="text.secondary">No order data</Typography>
                  }
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle1" fontWeight={700}>Recent Orders</Typography>
            <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/orders')}>
              View All
            </Button>
          </Box>
          <Divider sx={{ mb: 1 }} />
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : ov.recentOrders?.length > 0 ? (
            <List disablePadding>
              {ov.recentOrders.map((order, i) => (
                <React.Fragment key={order._id}>
                  <ListItem
                    disablePadding
                    sx={{ py: 1, cursor: 'pointer', '&:hover': { background: '#fafafa' }, borderRadius: 1 }}
                    onClick={() => navigate(`/orders/${order._id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#FF6B001A', color: '#FF6B00', fontSize: 13, fontWeight: 700 }}>
                        {order.orderNumber?.slice(-3)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={<Typography fontWeight={600} fontSize={14}>{order.orderNumber}</Typography>}
                      secondary={
                        <Typography fontSize={12} color="text.secondary">
                          {order.user?.name || 'Customer'} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                        </Typography>
                      }
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <StatusBadge status={order.status} />
                      <Typography fontWeight={700} color="primary" fontSize={14}>
                        ₹{order.total?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  </ListItem>
                  {i < ov.recentOrders.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" textAlign="center" py={3}>
              No recent orders
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
