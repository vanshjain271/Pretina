import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  CircularProgress, Tabs, Tab, Switch, FormControlLabel, Divider,
  Stack, InputAdornment, Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PublicIcon from '@mui/icons-material/Public';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';
import { getSettings, updateSettings } from '../api/endpoints';
import toast from 'react-hot-toast';

export default function StoreSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await getSettings();
        setSettings(data.data || {});
      } catch (e) {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings saved successfully!');
    } catch (e) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{ p: 3, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!settings) return null;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">Store Settings</Typography>
        <Button 
          variant="contained" 
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />} 
          onClick={handleSave}
          disabled={saving}
        >
          Save Changes
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <Tabs 
              orientation="vertical" 
              value={tabIndex} 
              onChange={(e, v) => setTabIndex(v)}
              sx={{ borderRight: 1, borderColor: 'divider', minHeight: 400, '& .MuiTab-root': { alignItems: 'flex-start', py: 2 } }}
            >
              <Tab icon={<StorefrontIcon sx={{ mr: 1 }} />} iconPosition="start" label="Store Details" />
              <Tab icon={<PublicIcon sx={{ mr: 1 }} />} iconPosition="start" label="SEO & Social" />
              <Tab icon={<LocalShippingIcon sx={{ mr: 1 }} />} iconPosition="start" label="Order & Shipping" />
              <Tab icon={<PaymentIcon sx={{ mr: 1 }} />} iconPosition="start" label="Payment Methods" />
              <Tab icon={<GavelIcon sx={{ mr: 1 }} />} iconPosition="start" label="Legal Policies" />
            </Tabs>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card sx={{ minHeight: 400 }}>
            <CardContent sx={{ p: 4 }}>
              
              {/* STORE DETAILS */}
              {tabIndex === 0 && (
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={700}>Basic Information</Typography>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Store Name" value={settings.storeName || ''} onChange={e => handleChange('storeName', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Contact Email" value={settings.supportEmail || ''} onChange={e => handleChange('supportEmail', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Contact Phone" value={settings.supportPhone || ''} onChange={e => handleChange('supportPhone', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="WhatsApp Number" value={settings.whatsappNumber || ''} onChange={e => handleChange('whatsappNumber', e.target.value)} />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth multiline rows={3} label="Store Address" value={settings.storeAddress || ''} onChange={e => handleChange('storeAddress', e.target.value)} />
                    </Grid>
                  </Grid>

                  <Typography variant="h6" fontWeight={700} sx={{ mt: 4 }}>Announcement Ticker</Typography>
                  <Divider />
                  <FormControlLabel
                    control={
                      <Switch 
                        checked={settings.tickerEnabled || false} 
                        onChange={e => handleChange('tickerEnabled', e.target.checked)} 
                        color="primary"
                      />
                    }
                    label="Enable Ticker"
                    sx={{ mb: 1 }}
                  />
                  <TextField 
                    fullWidth 
                    label="Ticker Text" 
                    value={settings.tickerText || ''} 
                    onChange={e => handleChange('tickerText', e.target.value)} 
                    helperText="This text will scroll horizontally at the top of the mobile home screen."
                    disabled={!settings.tickerEnabled}
                  />

                </Stack>
              )}

              {/* SEO & SOCIAL */}
              {tabIndex === 1 && (
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={700}>Search Engine Optimization</Typography>
                  <Divider />
                  <TextField fullWidth label="Meta Title" value={settings.metaTitle || ''} onChange={e => handleChange('metaTitle', e.target.value)} helperText="Recommended length: 50-60 characters" />
                  <TextField fullWidth multiline rows={3} label="Meta Description" value={settings.metaDescription || ''} onChange={e => handleChange('metaDescription', e.target.value)} helperText="Recommended length: 150-160 characters" />
                  <TextField fullWidth label="Meta Keywords" value={settings.metaKeywords || ''} onChange={e => handleChange('metaKeywords', e.target.value)} placeholder="ecommerce, fashion, shoes" />

                  <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>Social Media Links</Typography>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Instagram URL" value={settings.instagramUrl || ''} onChange={e => handleChange('instagramUrl', e.target.value)} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Facebook URL" value={settings.facebookUrl || ''} onChange={e => handleChange('facebookUrl', e.target.value)} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="Twitter/X URL" value={settings.twitterUrl || ''} onChange={e => handleChange('twitterUrl', e.target.value)} /></Grid>
                    <Grid item xs={12} md={6}><TextField fullWidth label="YouTube URL" value={settings.youtubeUrl || ''} onChange={e => handleChange('youtubeUrl', e.target.value)} /></Grid>
                  </Grid>
                </Stack>
              )}

              {/* ORDER & SHIPPING */}
              {tabIndex === 2 && (
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={700}>Delivery & Tax Configuration</Typography>
                  <Divider />
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="number" label="Flat Delivery Fee" value={settings.deliveryFee || 0} onChange={e => handleChange('deliveryFee', Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="number" label="Free Delivery Above" value={settings.freeDeliveryAbove || 0} onChange={e => handleChange('freeDeliveryAbove', Number(e.target.value))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField fullWidth type="number" label="Global GST/Tax Rate (%)" value={settings.taxRate || 0} onChange={e => handleChange('taxRate', Number(e.target.value))} />
                    </Grid>
                  </Grid>
                  <Alert severity="info" sx={{ mt: 2 }}>
                    If a customer's cart total is greater than or equal to "Free Delivery Above", the delivery fee will be zero.
                  </Alert>
                </Stack>
              )}

              {/* PAYMENT METHODS */}
              {tabIndex === 3 && (
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={700}>Active Payment Methods</Typography>
                  <Divider />
                  <FormControlLabel control={<Switch checked={settings.paymentCodEnabled || false} onChange={e => handleChange('paymentCodEnabled', e.target.checked)} color="primary" />} label="Enable Cash on Delivery (COD)" />
                  
                  <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1, mt: 2 }}>
                    <FormControlLabel control={<Switch checked={settings.paymentRazorpayEnabled || false} onChange={e => handleChange('paymentRazorpayEnabled', e.target.checked)} color="primary" />} label={<strong>Enable Razorpay Gateway</strong>} />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 1 }}>Accept cards, netbanking, wallets.</Typography>
                  </Box>

                  <Box sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1 }}>
                    <FormControlLabel control={<Switch checked={settings.paymentQrEnabled || false} onChange={e => handleChange('paymentQrEnabled', e.target.checked)} color="primary" />} label={<strong>Enable Manual UPI / QR</strong>} />
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>Customers upload payment screenshot which you verify manually.</Typography>
                    
                    {settings.paymentQrEnabled && (
                      <Grid container spacing={2} sx={{ ml: 2, width: 'calc(100% - 16px)' }}>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="UPI ID" value={settings.upiId || ''} onChange={e => handleChange('upiId', e.target.value)} size="small" />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField fullWidth label="Payee Name" value={settings.upiName || ''} onChange={e => handleChange('upiName', e.target.value)} size="small" />
                        </Grid>
                      </Grid>
                    )}
                  </Box>
                </Stack>
              )}

              {/* LEGAL POLICIES */}
              {tabIndex === 4 && (
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={700}>Store Policies</Typography>
                  <Divider />
                  <Alert severity="warning" sx={{ mb: 2 }}>HTML tags are supported. These policies are displayed to customers at checkout.</Alert>
                  
                  <TextField fullWidth multiline rows={5} label="Terms & Conditions" value={settings.termsAndConditions || ''} onChange={e => handleChange('termsAndConditions', e.target.value)} />
                  <TextField fullWidth multiline rows={5} label="Privacy Policy" value={settings.privacyPolicy || ''} onChange={e => handleChange('privacyPolicy', e.target.value)} />
                  <TextField fullWidth multiline rows={5} label="Refund & Cancellation Policy" value={settings.refundPolicy || ''} onChange={e => handleChange('refundPolicy', e.target.value)} />
                  <TextField fullWidth multiline rows={5} label="Shipping Policy" value={settings.shippingPolicy || ''} onChange={e => handleChange('shippingPolicy', e.target.value)} />
                </Stack>
              )}

            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
