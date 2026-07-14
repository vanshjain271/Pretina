import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Button, TextField, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  CircularProgress, Pagination, Autocomplete, Divider, Stack, IconButton,
  Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { getNotificationHistory, sendNotification, getCustomers, uploadImage, getProducts, getCategories } from '../api/endpoints';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export default function Notifications() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [sending, setSending] = useState(false);
  const [customers, setCustomers] = useState([]);
  
  const [form, setForm] = useState({ 
    user: null, 
    title: '', 
    body: '', 
    link: '',
    linkType: 'none',
    linkId: '',
    imageUrl: ''
  });

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const loadHistory = async (pg = 1) => {
    setLoading(true);
    try {
      const { data } = await getNotificationHistory({ page: pg, limit: 10 });
      setHistory(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch (e) {
      toast.error('Failed to load notifications history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    loadHistory(page); 
    
    // Load customers for the dropdown
    const loadCust = async () => {
      try {
        const { data } = await getCustomers({ limit: 500 });
        const allOption = { _id: 'all', name: 'All Customers (Broadcast)' };
        setCustomers([allOption, ...data.data]);
        setForm(f => ({ ...f, user: allOption })); // Default to Broadcast
      } catch (e) {
        console.error('Failed to load customers', e);
      }
    };
    
    const loadLinkData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          getProducts({ limit: 1000 }),
          getCategories({ limit: 500 })
        ]);
        setProducts(prodRes.data?.data || []);
        setCategories(catRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load items for linking');
      }
    };

    loadCust();
    loadLinkData();
  }, [page]);

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading Image...');
    try {
      const res = await uploadImage(formData);
      if (res.data.success) {
        setForm(prev => ({ ...prev, imageUrl: res.data.url }));
        toast.success('Image uploaded successfully', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to upload image', { id: toastId });
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
        linkType: form.linkType,
        linkId: form.linkId,
        imageUrl: form.imageUrl,
        type: 'alert',
      };
      
      if (form.user._id === 'all') {
        payload.broadcast = true;
      } else {
        payload.user = form.user._id;
      }

      await sendNotification(payload);
      toast.success('Notification sent successfully!');
      setForm(prev => ({ ...prev, title: '', body: '', link: '', linkType: 'none', linkId: '', imageUrl: '' }));
      loadHistory(1);
    } catch (e) {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, margin: '0 auto' }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Push Notifications</Typography>

      {/* SEND FORM CARD */}
      <Card sx={{ mb: 4, overflow: 'visible' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700}>Send Broadcast or Direct Message</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Send a push notification with an optional image and click action to users who have the app installed.
          </Typography>

          <Stack spacing={3}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => option.name || option.phone || 'Unknown'}
              value={form.user}
              onChange={(e, val) => setForm({ ...form, user: val })}
              renderInput={(params) => <TextField {...params} label="Select Recipient *" />}
              disableClearable
            />

            <TextField
              fullWidth
              label="Notification Title *"
              placeholder="e.g. Flash Sale is Live!"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notification Message *"
              placeholder="e.g. Get 50% off on all items for the next 2 hours."
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Notification Image (Optional)</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Button 
                    variant="outlined" 
                    component="label" 
                    fullWidth 
                    startIcon={<CloudUploadIcon />}
                    sx={{ height: 56 }}
                  >
                    Upload Image File
                    <input type="file" hidden accept="image/*" onChange={handleUploadImage} />
                  </Button>
                </Grid>
                <Grid item xs={12} md={1} sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">OR</Typography>
                </Grid>
                <Grid item xs={12} md={7}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    placeholder="Paste direct link if not uploading a file"
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  />
                </Grid>
              </Grid>
              
              {form.imageUrl && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <img 
                    src={form.imageUrl} 
                    alt="Preview" 
                    style={{ height: 100, borderRadius: 8, objectFit: 'cover', border: '1px solid #eee' }} 
                  />
                  <IconButton color="error" size="small" onClick={() => setForm({ ...form, imageUrl: '' })}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" fontWeight={600} mb={1}>Deep Link (Optional)</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Link Type</InputLabel>
                    <Select
                      value={form.linkType}
                      label="Link Type"
                      onChange={(e) => setForm({ ...form, linkType: e.target.value, linkId: '' })}
                    >
                      <MenuItem value="none">None</MenuItem>
                      <MenuItem value="product">Product</MenuItem>
                      <MenuItem value="category">Category</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                {form.linkType === 'product' && (
                  <Grid item xs={12} md={8}>
                    <Autocomplete
                      options={products}
                      getOptionLabel={(option) => option.name || 'Unknown'}
                      value={products.find(p => p._id === form.linkId) || null}
                      onChange={(e, val) => setForm({ ...form, linkId: val ? val._id : '' })}
                      renderInput={(params) => <TextField {...params} label="Select Product" />}
                    />
                  </Grid>
                )}

                {form.linkType === 'category' && (
                  <Grid item xs={12} md={8}>
                    <Autocomplete
                      options={categories}
                      getOptionLabel={(option) => option.name || 'Unknown'}
                      value={categories.find(c => c._id === form.linkId) || null}
                      onChange={(e, val) => setForm({ ...form, linkId: val ? val._id : '' })}
                      renderInput={(params) => <TextField {...params} label="Select Category" />}
                    />
                  </Grid>
                )}
              </Grid>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                If selected, the app will directly open this product or category when the user taps the notification.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                variant="contained" 
                size="large"
                startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                onClick={handleSend}
                disabled={sending}
                sx={{ px: 4, py: 1.5, borderRadius: 2 }}
              >
                Send Notification
              </Button>
            </Box>

          </Stack>
        </CardContent>
      </Card>

      {/* HISTORY SECTION */}
      <Typography variant="h6" fontWeight={700} mb={2}>Notification History</Typography>
      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ background: '#fafafa' }}>
                <TableCell sx={{ fontWeight: 700 }}>Sent On</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Target</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Title & Content</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Reach</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell></TableRow>
              ) : history.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>No notifications sent yet.</TableCell></TableRow>
              ) : (
                history.map((n) => (
                  <TableRow key={n._id}>
                    <TableCell>
                      <Typography variant="body2">{dayjs(n.sentAt).format('MMM D, YYYY')}</Typography>
                      <Typography variant="caption" color="text.secondary">{dayjs(n.sentAt).format('h:mm A')}</Typography>
                    </TableCell>
                    <TableCell>
                      {n.targetType === 'all' ? (
                        <Typography variant="body2" fontWeight={600}>Broadcast (All Users)</Typography>
                      ) : (
                        <Typography variant="body2">{n.targetUser?.name || 'Unknown User'}</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{n.title}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }} noWrap>
                        {n.body}
                      </Typography>
                      {n.imageUrl && <Typography variant="caption" color="primary">Includes Image</Typography>}
                      {n.data?.link && <Typography variant="caption" color="secondary" sx={{ ml: 1 }}>Deep Link: {n.data.link}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">Targeted: {n.sentCount}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'inline-block', px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 600,
                        bgcolor: n.status === 'sent' ? '#e8f5e9' : '#ffebee',
                        color: n.status === 'sent' ? '#2e7d32' : '#c62828'
                      }}>
                        {n.status.toUpperCase()}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {total > 10 && (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <Pagination count={Math.ceil(total / 10)} page={page} onChange={(e, v) => setPage(v)} />
          </Box>
        )}
      </Card>
    </Box>
  );
}
