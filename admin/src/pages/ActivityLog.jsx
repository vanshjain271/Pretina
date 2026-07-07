import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, CircularProgress, Pagination,
  TextField, InputAdornment, Autocomplete
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getActivityLog } from '../api/endpoints';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

const ACTION_COLORS = {
  'order.created': 'success',
  'order.updated': 'info',
  'order.cancelled': 'error',
  'user.created': 'success',
  'user.blocked': 'error',
  'product.created': 'success',
  'product.updated': 'info',
  'product.deleted': 'error',
  'settings.updated': 'warning',
};

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');

  const fetchLogs = async (pg = 1) => {
    setLoading(true);
    try {
      const { data } = await getActivityLog({ page: pg, limit: 20, search });
      setLogs(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(page); }, [page, search]);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>System Activity Log</Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ py: '16px !important' }}>
          <TextField
            size="small"
            placeholder="Search by action or user..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            sx={{ width: 300 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
        </CardContent>
      </Card>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Action Type</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#999' }}>No activity logs found.</TableCell></TableRow>
              ) : logs.map(log => (
                <TableRow key={log._id} hover>
                  <TableCell>
                    <Typography fontSize={13}>{dayjs(log.createdAt).format('DD MMM, h:mm A')}</Typography>
                    <Typography fontSize={11} color="text.secondary">{dayjs(log.createdAt).fromNow()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13} fontWeight={600}>{log.userName || 'System'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={log.action} 
                      size="small" 
                      color={ACTION_COLORS[log.action] || 'default'} 
                      sx={{ fontSize: 11, fontWeight: 600, height: 20 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={13}>{log.description}</Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 20 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={Math.ceil(total / 20)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
}
