import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress, Button,
  Table, TableHead, TableBody, TableRow, TableCell, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DownloadIcon from '@mui/icons-material/Download';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { getSalesAnalytics, getProductPerformance } from '../api/endpoints';
import { downloadCSV } from '../utils/exportCsv';

export default function Reports() {
  const [period, setPeriod] = useState('last30days');
  const [analytics, setAnalytics] = useState(null);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [aRes, pRes] = await Promise.all([
          getSalesAnalytics({ period }),
          getProductPerformance({ period }),
        ]);
        setAnalytics(aRes.data.analytics);
        setPerformance(pRes.data.performance);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [period]);

  const PERIODS = [
    { value: 'today', label: 'Today' },
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last12months', label: 'Last 12 Months' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Reports & Analytics</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadCSV(analytics?.salesByDay || [], 'Sales_Report')}>
            Export Sales
          </Button>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadCSV(performance?.topProducts || [], 'Products_Report')}>
            Export Products
          </Button>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} label="Period" onChange={e => setPeriod(e.target.value)}>
              {PERIODS.map(p => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Summary KPIs */}
      {analytics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total Revenue', value: `₹${analytics.summary?.totalSales?.toLocaleString('en-IN') || 0}` },
            { label: 'Total Orders', value: analytics.summary?.totalOrders || 0 },
            { label: 'Avg Order Value', value: `₹${analytics.summary?.averageOrderValue?.toLocaleString('en-IN') || 0}` },
          ].map(s => (
            <Grid key={s.label} item xs={12} sm={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary">{s.value}</Typography>
                  <Typography color="text.secondary" fontSize={13}>{s.label}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Sales by Day Chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Sales Trend</Typography>
          {loading ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box> : (
            analytics?.salesByDay?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={analytics.salesByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                  <ChartTooltip formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'Sales']} />
                  <Bar dataKey="sales" fill="#FF6B00" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>No data for this period</Typography>
            )
          )}
        </CardContent>
      </Card>

      {/* Top Products */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Top Products</Typography>
              </Box>
              {loading ? <CircularProgress /> : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ '& th': { fontWeight: 700, background: '#fafafa' } }}>
                      <TableCell>#</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {performance?.topProducts?.slice(0, 8).map((p, i) => (
                      <TableRow key={p._id} hover>
                        <TableCell><Typography fontSize={12} color="text.secondary">#{i+1}</Typography></TableCell>
                        <TableCell><Typography fontSize={13} fontWeight={500}>{p.name}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13}>{p.totalQuantity}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13} fontWeight={600} color="primary">₹{p.totalRevenue?.toLocaleString('en-IN')}</Typography></TableCell>
                      </TableRow>
                    )) || <TableRow><TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 2 }}>No data</TableCell></TableRow>}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Analytics Shortcuts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Advanced Analytics</Typography>
              <Grid container spacing={1.5}>
                {[
                  { label: '🗺️ Geo Analytics', desc: 'Orders by state & pincode', to: '/analytics/geo' },
                  { label: '📦 Inventory', desc: 'Low stock & dead stock', to: '/analytics/inventory' },
                  { label: '⏰ Peak Hours', desc: 'Best times to push campaigns', to: '/analytics/peak-hours' },
                ].map(s => (
                  <Grid key={s.to} item xs={12}>
                    <Card variant="outlined" sx={{ cursor: 'pointer', '&:hover': { borderColor: '#FF6B00' } }} onClick={() => navigate(s.to)}>
                      <CardContent sx={{ py: '12px !important', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography fontWeight={600} fontSize={14}>{s.label}</Typography>
                          <Typography fontSize={12} color="text.secondary">{s.desc}</Typography>
                        </Box>
                        <ArrowForwardIcon color="action" />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
