import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Pagination, Chip, Autocomplete
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { getNotificationHistory, sendNotification, getCustomers } from '../api/endpoints';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export default function Notifications() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState([]);
  
  const [form, setForm] = useState({ user: null, title: '', body: '', link: '' });

  const loadHistory = async (pg = 1) => {
    setLoading(true);
    try {
      const { data } = await getNotificationHistory({ page: pg, limit: 15 });
      setHistory(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadHistory(page); }, [page]);

  const openDialog = async () => {
    setDialogOpen(true);
    setForm({ user: null, title: '', body: '', link: '' });
    if (customers.length === 0) {
      try {
        const { data } = await getCustomers({ limit: 500 });
        setCustomers([{ _id: 'all', name: 'All Customers (Broadcast)' }, ...data.data]);
      } catch (e) { toast.error('Failed to load customers'); }
    }
  };

  const handleSend = async () => {
    if (!form.title || !form.body || !form.user) return toast.error('Required fields missing');
    setSending(true);
    try {
      const payload = {
        title: form.title,
        body: form.body,
        link: form.link,
        type: 'alert',
      };
      
      if (form.user._id === 'all') {
        payload.broadcast = true;
      } else {
        payload.user = form.user._id;
      }

      await sendNotification(payload);
      toast.success('Notification sent!');
      setDialogOpen(false);
      loadHistory(1);
    } catch (e) {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Push Notifications</Typography>
        <Button variant="contained" startIcon={<SendIcon />} onClick={openDialog}>
          Send Notification
        </Button>
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Sent On</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Recipient</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Title & Content</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}><CircularProgress /></TableCell></TableRow>
              ) : history.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6, color: '#999' }}>No notifications sent yet.</TableCell></TableRow>
              ) : history.map(notif => (
                <TableRow key={notif._id} hover>
                  <TableCell>
                    <Typography fontSize={13}>{dayjs(notif.createdAt).format('DD MMM YYYY, h:mm A')}</Typography>
                    <Typography fontSize={11} color="text.secondary">{dayjs(notif.createdAt).fromNow()}</Typography>
                  </TableCell>
                  <TableCell>
                    {notif.user ? (
                      <Typography fontSize={13} fontWeight={600}>Single User ({notif.user})</Typography>
                    ) : (
                      <Chip label="Broadcast" size="small" color="primary" sx={{ fontSize: 11, fontWeight: 700, height: 20 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontSize={14} fontWeight={700}>{notif.title}</Typography>
                    <Typography fontSize={13} color="text.secondary" sx={{ maxWidth: 400 }} noWrap>{notif.body}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={notif.read ? 'Read' : 'Delivered'} size="small" color={notif.read ? 'success' : 'default'} sx={{ fontSize: 11, height: 20 }} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 15 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination count={Math.ceil(total / 15)} page={page} onChange={(_, p) => setPage(p)} color="primary" />
          </Box>
        )}
      </Card>

      {/* Send Notification Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Send Push Notification</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={customers}
                getOptionLabel={(o) => o.name}
                value={form.user}
                onChange={(e, val) => setForm({ ...form, user: val })}
                renderInput={(params) => <TextField {...params} label="Select Recipient" required />}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Notification Title" required
                value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} 
                inputProps={{ maxLength: 65 }} helperText={`${form.title.length}/65 chars`}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth multiline rows={3} label="Notification Body" required
                value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} 
              />
            </Grid>
            <Grid item xs={12}>
              <TextField 
                fullWidth label="Action Link (Optional)" placeholder="e.g. /products/shoes"
                value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} 
                helperText="Where should the app navigate when the user taps the notification?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSend} disabled={sending}>
            {sending ? <CircularProgress size={20} /> : 'Send Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
