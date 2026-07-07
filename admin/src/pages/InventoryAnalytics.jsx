import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Table, TableHead, TableBody, TableRow, TableCell, Chip, Grid, Button, Stack } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { getDeadStockAnalytics, getLowStockAlerts } from '../api/endpoints';
import { downloadCSV } from '../utils/exportCsv';

export default function InventoryAnalytics() {
  const [deadStock, setDeadStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDeadStockAnalytics({ days: 60 }),
      getLowStockAlerts({ threshold: 10 })
    ]).then(([dsRes, lsRes]) => {
      setDeadStock(dsRes.data.deadStock || []);
      setLowStock(lsRes.data.alerts || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Inventory Analytics</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => downloadCSV(lowStock, 'Low_Stock_Alerts')}>
            Export Low Stock
          </Button>
          <Button variant="outlined" size="small" startIcon={<DownloadIcon />} onClick={() => downloadCSV(deadStock, 'Dead_Stock')}>
            Export Dead Stock
          </Button>
        </Stack>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Low Stock Alerts</Typography>
              {loading ? <CircularProgress /> : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#fafafa' }}>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Current Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lowStock.length === 0 ? (
                      <TableRow><TableCell colSpan={2} align="center">All products are well stocked.</TableCell></TableRow>
                    ) : lowStock.map(p => (
                      <TableRow key={p._id}>
                        <TableCell><Typography fontSize={13} fontWeight={600}>{p.name}</Typography></TableCell>
                        <TableCell align="right">
                          <Chip label={`${p.stock} units left`} color="error" size="small" sx={{ fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Dead Stock (No sales in 60 days)</Typography>
              {loading ? <CircularProgress /> : (
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ background: '#fafafa' }}>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Stock Trapped</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {deadStock.length === 0 ? (
                      <TableRow><TableCell colSpan={2} align="center">No dead stock found!</TableCell></TableRow>
                    ) : deadStock.map(p => (
                      <TableRow key={p._id}>
                        <TableCell><Typography fontSize={13} fontWeight={600}>{p.name}</Typography></TableCell>
                        <TableCell align="right">
                          <Chip label={`${p.stock} units`} color="warning" size="small" sx={{ fontWeight: 700 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
