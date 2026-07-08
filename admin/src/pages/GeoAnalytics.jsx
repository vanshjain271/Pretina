import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell, Button, Grid
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  PieChart, Pie, Tooltip as ChartTooltip, Cell, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { getGeographyAnalytics } from '../api/endpoints';
import { downloadCSV } from '../utils/exportCsv';

const COLORS = ['#FF6B00', '#1A1A2E', '#F2994A', '#2D9CDB', '#27AE60', '#9B51E0', '#F2C94C', '#EB5757'];

export default function GeoAnalytics() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGeographyAnalytics({ period: 'last30days' })
      .then(res => setData(res.data.geography || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalOrders = data.reduce((sum, item) => sum + (item.orders || 0), 0);
  const topState = data.length > 0 ? data[0] : null;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>Geography Analytics</Typography>
        <Button variant="contained" color="primary" startIcon={<DownloadIcon />} onClick={() => downloadCSV(data, 'Geo_Analytics')}>
          Export CSV
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
      ) : data.length === 0 ? (
        <Card><CardContent><Typography align="center" py={5}>No geographical data available for this period.</Typography></CardContent></Card>
      ) : (
        <>
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: 'primary.main', color: 'white', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Regional Revenue</Typography>
                  <Typography variant="h4" fontWeight="bold">₹{totalRevenue.toLocaleString('en-IN')}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Total Orders Delivered</Typography>
                  <Typography variant="h4" fontWeight="bold" color="secondary">{totalOrders}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">Top Performing State</Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {topState?.state || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {topState?.orders} orders (₹{topState?.revenue?.toLocaleString('en-IN')})
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>Orders by State</Typography>
                  <Box sx={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={data} 
                          dataKey="orders" 
                          nameKey="state" 
                          cx="50%" 
                          cy="50%" 
                          outerRadius={110} 
                          innerRadius={60}
                          paddingAngle={2}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <ChartTooltip formatter={(v) => [v, 'Orders']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={3}>Revenue by State</Typography>
                  <Box sx={{ width: '100%', height: 350 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} margin={{ top: 10, right: 10, left: 20, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="state" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(val) => `₹${val/1000}k`} />
                        <ChartTooltip cursor={{fill: '#f5f5f5'}} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} maxBarSize={50} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Detailed Breakdown</Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#fafafa' }}>
                    <TableCell>State</TableCell>
                    <TableCell align="right">Total Orders</TableCell>
                    <TableCell align="right">Revenue</TableCell>
                    <TableCell align="right">Avg Order Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => (
                    <TableRow key={index} hover>
                      <TableCell><Typography fontSize={14} fontWeight={600}>{row.state}</Typography></TableCell>
                      <TableCell align="right"><Typography fontSize={14}>{row.orders}</Typography></TableCell>
                      <TableCell align="right">
                        <Typography fontSize={14} color="primary" fontWeight={600}>
                          ₹{row.revenue?.toLocaleString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontSize={14} color="text.secondary">
                          ₹{row.orders > 0 ? Math.round(row.revenue / row.orders).toLocaleString('en-IN') : 0}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
