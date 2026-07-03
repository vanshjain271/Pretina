import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, CircularProgress, Pagination, InputAdornment, Avatar, Chip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { getUsers } from '../api/endpoints';
import dayjs from 'dayjs';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getUsers({ page, limit: 20, search });
        setUsers(data.data); setTotal(data.pagination?.total || 0);
      } catch {} finally { setLoading(false); }
    };
    load();
  }, [page, search]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">Customers</Typography>
        <Typography variant="body2" color="text.secondary">{total} registered customers</Typography>
      </Box>
      <Card>
        <Box sx={{ p: 2 }}>
          <TextField size="small" placeholder="Search by name or phone..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#999' }} /></InputAdornment> }}
            sx={{ width: 300 }}
          />
        </Box>
        <TableContainer><Table>
          <TableHead><TableRow sx={{ background: '#FAFAFA' }}>
            <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Verified</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Joined</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
            : users.map(u => (
              <TableRow key={u._id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={u.photo} sx={{ width: 36, height: 36, bgcolor: '#FF6B00', fontSize: 14 }}>{(u.name||'?')[0].toUpperCase()}</Avatar>
                    <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell><Typography variant="body2">{u.phone}</Typography></TableCell>
                <TableCell>{u.isPhoneVerified ? '✅' : '❌'}</TableCell>
                <TableCell><Typography variant="caption">{dayjs(u.createdAt).format('DD MMM YYYY')}</Typography></TableCell>
                <TableCell><Chip label={u.isActive ? 'Active' : 'Blocked'} size="small" color={u.isActive ? 'success' : 'error'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table></TableContainer>
        {total > 20 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={Math.ceil(total/20)} page={page} onChange={(_,p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>
    </Box>
  );
}
