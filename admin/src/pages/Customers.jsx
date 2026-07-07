import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Chip, Button, TextField, Avatar, Pagination,
  CircularProgress, IconButton, Tooltip, Stack, InputAdornment,
} from '@mui/material';
import SearchIcon     from '@mui/icons-material/Search';
import RefreshIcon    from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon      from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useNavigate } from 'react-router-dom';
import { getCustomers, toggleCustomerStatus } from '../api/endpoints';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const LIMIT = 20;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCustomers({ page, limit: LIMIT, search: search || undefined, role: 'customer' });
      setCustomers(res.data.data || res.data.users || []);
      setTotal(res.data.pagination?.total || res.data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleToggle = async (id) => {
    try {
      await toggleCustomerStatus(id);
      fetchCustomers();
    } catch (e) { console.error(e); }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Customers</Typography>
          <Typography variant="body2" color="text.secondary">{total} registered customers</Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              placeholder="Search by name or phone…"
              size="small"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
              }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={fetchCustomers}><RefreshIcon /></IconButton>
            </Tooltip>
          </Stack>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, background: '#fafafa' } }}>
                  <TableCell>Customer</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
                ) : customers.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>No customers found</TableCell></TableRow>
                ) : customers.map(c => (
                  <TableRow key={c._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#FF6B001A', color: '#FF6B00', fontSize: 13, fontWeight: 700 }}>
                          {(c.name || 'U')[0].toUpperCase()}
                        </Avatar>
                        <Typography fontWeight={600} fontSize={13}>{c.name || '—'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography fontSize={13}>{c.phone}</Typography></TableCell>
                    <TableCell><Typography fontSize={13} color="text.secondary">{c.email || '—'}</Typography></TableCell>
                    <TableCell><Typography fontSize={13}>{new Date(c.createdAt).toLocaleDateString('en-IN')}</Typography></TableCell>
                    <TableCell>
                      <Chip
                        label={c.isActive ? 'Active' : 'Blocked'}
                        color={c.isActive ? 'success' : 'error'}
                        size="small" sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Profile">
                          <IconButton size="small" onClick={() => navigate(`/customers/${c._id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={c.isActive ? 'Block Customer' : 'Unblock Customer'}>
                          <IconButton size="small" onClick={() => handleToggle(c._id)} color={c.isActive ? 'error' : 'success'}>
                            {c.isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {total > LIMIT && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination count={Math.ceil(total / LIMIT)} page={page} onChange={(_, v) => setPage(v)} color="primary" />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
