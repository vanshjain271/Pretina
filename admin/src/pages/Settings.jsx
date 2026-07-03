import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button,
  Switch, FormControlLabel, Divider, Grid, Alert, CircularProgress,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import toast from 'react-hot-toast';
import { getSettings, updateSettings, uploadQR } from '../api/endpoints';

const SectionTitle = ({ children }) => (
  <Typography variant="subtitle1" fontWeight={700} color="#1A1A2E" sx={{ mb: 2, mt: 1 }}>
    {children}
  </Typography>
);

export default function Settings() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState('');

  useEffect(() => {
    getSettings()
      .then(({ data }) => {
        setForm(data.data);
        setQrPreview(data.data.qrImageUrl || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  const handleQrChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrFile(file);
    setQrPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let qrImageUrl = form.qrImageUrl;

      // Upload new QR image if selected
      if (qrFile) {
        const fd = new FormData();
        fd.append('qr', qrFile);
        const { data } = await uploadQR(fd);
        qrImageUrl = data.url;
      }

      const payload = { ...form, qrImageUrl };
      const { data } = await updateSettings(payload);
      setForm(data.data);
      toast.success('Settings saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress sx={{ color: '#FF6B00' }} />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure app behaviour, payment methods & business info</Typography>
        </Box>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Payment Methods */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionTitle>💳 Payment Methods</SectionTitle>
              <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                Toggle payment methods ON or OFF. Changes take effect immediately for all customers.
              </Alert>

              <FormControlLabel
                control={
                  <Switch
                    checked={form?.paymentRazorpayEnabled || false}
                    onChange={e => set('paymentRazorpayEnabled', e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Razorpay</Typography>
                    <Typography variant="caption" color="text.secondary">Online payment via cards, UPI, netbanking</Typography>
                  </Box>
                }
                sx={{ display: 'flex', mb: 2, alignItems: 'flex-start' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form?.paymentQrEnabled || false}
                    onChange={e => set('paymentQrEnabled', e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>QR / UPI Manual</Typography>
                    <Typography variant="caption" color="text.secondary">Customer scans QR, uploads screenshot for admin to verify</Typography>
                  </Box>
                }
                sx={{ display: 'flex', mb: 2, alignItems: 'flex-start' }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={form?.paymentCodEnabled || false}
                    onChange={e => set('paymentCodEnabled', e.target.checked)}
                    color="warning"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>Cash on Delivery (COD)</Typography>
                    <Typography variant="caption" color="text.secondary">Customer pays on delivery</Typography>
                  </Box>
                }
                sx={{ display: 'flex', alignItems: 'flex-start' }}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* QR / UPI Details */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionTitle>📱 QR / UPI Details</SectionTitle>
              <TextField
                fullWidth label="UPI ID" size="small"
                value={form?.upiId || ''}
                onChange={e => set('upiId', e.target.value)}
                sx={{ mb: 2 }}
                placeholder="yourname@bank"
              />
              <TextField
                fullWidth label="UPI Name (shown to customer)" size="small"
                value={form?.upiName || ''}
                onChange={e => set('upiName', e.target.value)}
                sx={{ mb: 2 }}
              />

              {/* QR Image */}
              <Typography variant="caption" fontWeight={600} color="#666" sx={{ mb: 1, display: 'block' }}>
                QR Code Image
              </Typography>
              {qrPreview && (
                <Box sx={{ mb: 1 }}>
                  <img src={qrPreview} alt="QR" style={{ width: 120, height: 120, objectFit: 'contain', border: '1px solid #E0E0E0', borderRadius: 8 }} />
                </Box>
              )}
              <Button variant="outlined" component="label" size="small">
                {qrPreview ? 'Change QR Image' : 'Upload QR Image'}
                <input type="file" hidden accept="image/*" onChange={handleQrChange} />
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* COD Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionTitle>🏠 COD Settings</SectionTitle>
              <TextField
                fullWidth label="COD Advance %" size="small" type="number"
                value={form?.codAdvancePercentage || 0}
                onChange={e => set('codAdvancePercentage', Number(e.target.value))}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                helperText="% of order total customer pays upfront for COD orders. Set 0 for none."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Delivery Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionTitle>🚚 Delivery Settings</SectionTitle>
              <TextField
                fullWidth label="Delivery Fee (₹)" size="small" type="number"
                value={form?.deliveryFee || 0}
                onChange={e => set('deliveryFee', Number(e.target.value))}
                sx={{ mb: 2 }}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
              />
              <TextField
                fullWidth label="Free Delivery Above (₹)" size="small" type="number"
                value={form?.freeDeliveryAbove || 0}
                onChange={e => set('freeDeliveryAbove', Number(e.target.value))}
                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                helperText="Set 0 to always charge delivery fee."
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Business Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionTitle>🏢 Business Info</SectionTitle>
              <TextField fullWidth label="Business Name" size="small" value={form?.businessName || ''} onChange={e => set('businessName', e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Phone" size="small" value={form?.businessPhone || ''} onChange={e => set('businessPhone', e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="Email" size="small" value={form?.businessEmail || ''} onChange={e => set('businessEmail', e.target.value)} sx={{ mb: 2 }} />
              <TextField fullWidth label="WhatsApp Number" size="small" value={form?.whatsappNumber || ''} onChange={e => set('whatsappNumber', e.target.value)} />
            </CardContent>
          </Card>
        </Grid>

        {/* Maintenance Mode */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <SectionTitle>🔧 Maintenance Mode</SectionTitle>
              <Alert severity={form?.maintenanceMode ? 'warning' : 'success'} sx={{ mb: 2, borderRadius: 2 }}>
                {form?.maintenanceMode ? 'App is in maintenance mode — customers see maintenance message.' : 'App is live and accessible to customers.'}
              </Alert>
              <FormControlLabel
                control={
                  <Switch
                    checked={form?.maintenanceMode || false}
                    onChange={e => set('maintenanceMode', e.target.checked)}
                    color="warning"
                  />
                }
                label="Enable Maintenance Mode"
              />
              {form?.maintenanceMode && (
                <TextField
                  fullWidth label="Maintenance Message" multiline rows={2}
                  value={form?.maintenanceMessage || ''}
                  onChange={e => set('maintenanceMessage', e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
