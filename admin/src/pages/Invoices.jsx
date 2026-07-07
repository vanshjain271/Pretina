import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Chip, Button, TextField, MenuItem, Select,
  InputLabel, FormControl, Pagination, CircularProgress, IconButton,
  Tooltip, Divider, Stack, InputAdornment,
} from '@mui/material';
import SearchIcon       from '@mui/icons-material/Search';
import RefreshIcon      from '@mui/icons-material/Refresh';
import DownloadIcon     from '@mui/icons-material/Download';
import VisibilityIcon   from '@mui/icons-material/Visibility';
import FilterListIcon   from '@mui/icons-material/FilterList';
import { useNavigate }  from 'react-router-dom';
import { getInvoices, generateInvoice } from '../api/endpoints';

const STATUS_COLORS = {
  issued: 'primary', paid: 'success', draft: 'default', cancelled: 'error',
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const LIMIT = 20;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getInvoices({ page, limit: LIMIT, search: search || undefined });
      setInvoices(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDownloadPDF = (invoice) => {
    // Client-side PDF using print dialog or redirect to PDF view
    window.open(`/api/v1/invoices/${invoice._id}/pdf`, '_blank');
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Invoices</Typography>
          <Typography variant="body2" color="text.secondary">{total} total invoices</Typography>
        </Box>
      </Box>

      <Card>
        <CardContent>
          {/* Filters */}
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField
              placeholder="Search invoice # or customer…"
              size="small"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
              }}
            />
            <Tooltip title="Refresh">
              <IconButton onClick={fetchInvoices}><RefreshIcon /></IconButton>
            </Tooltip>
          </Stack>

          {/* Table */}
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, background: '#fafafa' } }}>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Order</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Balance Due</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : invoices.map(inv => (
                  <TableRow key={inv._id} hover>
                    <TableCell>
                      <Typography fontWeight={600} fontSize={13}>{inv.invoiceNumber}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        fontSize={13}
                        color="primary"
                        sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                        onClick={() => navigate(`/orders/${inv.order?._id}`)}
                      >
                        {inv.order?.orderNumber || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13}>{inv.customerName}</Typography>
                      <Typography fontSize={11} color="text.secondary">{inv.customerPhone}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography fontSize={13}>
                        {new Date(inv.issuedAt || inv.createdAt).toLocaleDateString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={600} fontSize={13}>
                        ₹{inv.totalAmount?.toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        fontSize={13}
                        color={inv.balanceDue > 0 ? 'error.main' : 'success.main'}
                        fontWeight={600}
                      >
                        ₹{inv.balanceDue?.toLocaleString('en-IN') || 0}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={inv.status}
                        color={STATUS_COLORS[inv.status] || 'default'}
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        <Tooltip title="View Invoice">
                          <IconButton size="small" onClick={() => navigate(`/invoices/${inv._id}`)}>
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download PDF">
                          <IconButton size="small" onClick={() => handleDownloadPDF(inv)}>
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Pagination */}
          {total > LIMIT && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={Math.ceil(total / LIMIT)}
                page={page}
                onChange={(_, v) => setPage(v)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
