import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Table, TableHead, TableBody, TableRow, TableCell, CircularProgress, TextField, Stack } from '@mui/material';
import { getAbandonedCarts } from '../api/endpoints';

export default function AbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { 
    (async () => { 
      setLoading(true);
      try { 
        const r = await getAbandonedCarts(); 
        setCarts(r.data.analytics?.carts || []); 
      } catch(e) {
      } finally {
        setLoading(false);
      } 
    })(); 
  }, []);

  const filteredCarts = carts.filter(c => {
    const term = search.toLowerCase();
    const name = c.user?.name?.toLowerCase() || 'guest';
    const phone = c.user?.phone?.toLowerCase() || '';
    return name.includes(term) || phone.includes(term);
  });

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Abandoned Carts</Typography>
      </Box>
      <Card>
        <CardContent sx={{ pb: 0 }}>
          <Stack direction="row" sx={{ mb: 2 }}>
            <TextField
              size="small"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 250 }}
            />
          </Stack>
        </CardContent>
        <CardContent>
          {loading ? (
            <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, background: '#fafafa' } }}>
                  <TableCell>Customer</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Last Active</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCarts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No abandoned carts found</TableCell>
                  </TableRow>
                ) : filteredCarts.map(c => (
                  <TableRow key={c._id} hover>
                    <TableCell>{c.user?.name || 'Guest'}</TableCell>
                    <TableCell>{c.user?.phone || '—'}</TableCell>
                    <TableCell>{c.items?.length || 0} items</TableCell>
                    <TableCell>{new Date(c.updatedAt).toLocaleDateString('en-IN')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
