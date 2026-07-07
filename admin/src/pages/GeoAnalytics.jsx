import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { PieChart, Pie, Tooltip as ChartTooltip, Cell, ResponsiveContainer, Legend } from 'recharts';
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Geography Analytics</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadCSV(data, 'Geo_Analytics')}>
          Export CSV
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} mb={2}>Orders by State (Last 30 Days)</Typography>
          {loading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box> : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ width: { xs: '100%', md: '50%' }, height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data} dataKey="count" nameKey="state" cx="50%" cy="50%" outerRadius={100} label>
                      {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <ChartTooltip formatter={(v) => [v, 'Orders']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ width: { xs: '100%', md: '50%' } }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#fafafa' }}>
                      <TableCell>State</TableCell>
                      <TableCell align="right">Orders</TableCell>
                      <TableCell align="right">Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.length === 0 ? (
                      <TableRow><TableCell colSpan={3} align="center">No data found</TableCell></TableRow>
                    ) : data.map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell><Typography fontSize={13} fontWeight={600}>{row.state}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13}>{row.count}</Typography></TableCell>
                        <TableCell align="right"><Typography fontSize={13} color="primary" fontWeight={700}>₹{row.revenue?.toLocaleString('en-IN')}</Typography></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
