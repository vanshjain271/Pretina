import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Grid, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { getPeakHoursAnalytics } from '../api/endpoints';
import { downloadCSV } from '../utils/exportCsv';

export default function PeakHours() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPeakHoursAnalytics({ period: 'last30days' })
      .then(res => setData(res.data.peakHours || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Peak Hours Analytics</Typography>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadCSV(data, 'Peak_Hours_Analytics')}>
          Export CSV
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Orders by Time of Day (Last 30 Days)</Typography>
              {loading ? <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress /></Box> : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(v) => `${v}:00`} />
                    <YAxis />
                    <ChartTooltip 
                      labelFormatter={(v) => `Time: ${v}:00 - ${v}:59`}
                      formatter={(v) => [v, 'Total Orders']}
                    />
                    <Bar dataKey="count" fill="#FF6B00" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
