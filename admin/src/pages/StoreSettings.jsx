import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Grid,
  CircularProgress, Tabs, Tab, Switch, FormControlLabel, Divider,
  Stack, InputAdornment, Alert, IconButton
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PublicIcon from '@mui/icons-material/Public';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import PaymentIcon from '@mui/icons-material/Payment';
import GavelIcon from '@mui/icons-material/Gavel';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import MoneyIcon from '@mui/icons-material/Money';
import { getSettings, updateSettings, uploadQR } from '../api/endpoints';
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

  const handleUploadQR = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('qr', file);

    const toastId = toast.loading('Uploading QR Code...');
    try {
      const res = await uploadQR(formData);
      if (res.data.success) {
        setSettings(prev => ({ ...prev, qrImageUrl: res.data.url }));
        toast.success('QR Code uploaded successfully', { id: toastId });
      }
    } catch (err) {
      toast.error('Failed to upload QR Code', { id: toastId });
    }
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
              <Tab icon={<ShoppingCartIcon sx={{ mr: 1 }} />} iconPosition="start" label="Checkout Settings" />
              <Tab icon={<LocalShippingIcon sx={{ mr: 1 }} />} iconPosition="start" label="Delivery Settings" />
              <Tab icon={<PaymentIcon sx={{ mr: 1 }} />} iconPosition="start" label="Payment Settings" />
              <Tab icon={<PublicIcon sx={{ mr: 1 }} />} iconPosition="start" label="SEO & Social" />
              <Tab icon={<GavelIcon sx={{ mr: 1 }} />} iconPosition="start" label="Legal Policies" />
            </Tabs>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card sx={{ minHeight: 400 }}>
            <CardContent sx={{ p: 4 }}>
              
              {/* STORE DETAILS (Index 0) */}
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

              {/* CHECKOUT SETTINGS (Index 1) */}
              {tabIndex === 1 && (
                <Stack spacing={4}>
                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>Order Limits</Typography>
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <TextField 
                        type="number" 
                        label="Minimum Order Amount" 
                        value={settings.minOrderValue || 0} 
                        onChange={e => handleChange('minOrderValue', Number(e.target.value))} 
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} 
                        sx={{ width: 300 }}
                      />
                      <FormControlLabel
                        control={
                          <Switch 
                            checked={settings.includeTaxInPricing !== false} 
                            onChange={e => handleChange('includeTaxInPricing', e.target.checked)} 
                            color="primary"
                          />
                        }
                        label="Include Tax in Pricing"
                      />
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="h6" fontWeight={700} mb={2}>Checkout Message</Typography>
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        This note will be shown on the checkout page to your customers.
                      </Typography>
                      <TextField 
                        fullWidth 
                        multiline 
                        rows={4} 
                        placeholder="e.g. IMPORTANT NOTICE: COD Orders Require Confirmation..."
                        value={settings.orderNotes || ''} 
                        onChange={e => handleChange('orderNotes', e.target.value)} 
                      />
                    </Box>
                  </Box>
                </Stack>
              )}

              {/* DELIVERY SETTINGS (Index 2) */}
              {tabIndex === 2 && (
                <Stack spacing={3}>
                  <Typography variant="h6" fontWeight={700}>Fees & Thresholds</Typography>
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
                    <Grid container spacing={3} mb={3}>
                      <Grid item xs={12} md={6}>
                        <TextField 
                          fullWidth 
                          type="number" 
                          label="Standard Delivery Fee" 
                          value={settings.deliveryFee || 0} 
                          onChange={e => handleChange('deliveryFee', Number(e.target.value))} 
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} 
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField 
                          fullWidth 
                          type="number" 
                          label="Free Delivery Threshold" 
                          value={settings.freeDeliveryAbove || 0} 
                          onChange={e => handleChange('freeDeliveryAbove', Number(e.target.value))} 
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} 
                        />
                      </Grid>
                    </Grid>
                    
                    <FormControlLabel
                      control={
                        <Switch 
                          checked={settings.allIndiaDelivery !== false} 
                          onChange={e => handleChange('allIndiaDelivery', e.target.checked)} 
                          color="primary"
                        />
                      }
                      label="Deliver to all Pincodes in India"
                    />
                  </Box>
                </Stack>
              )}

              {/* PAYMENT SETTINGS (Index 3) */}
              {tabIndex === 3 && (
                <Stack spacing={4}>
                  
                  {/* COD Settings */}
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}><MoneyIcon color="primary" /></Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>Cash on Delivery (COD)</Typography>
                        <Typography variant="body2" color="text.secondary">Allow customers to pay when the order is delivered.</Typography>
                      </Box>
                    </Box>
                    <Switch checked={settings.paymentCodEnabled || false} onChange={e => handleChange('paymentCodEnabled', e.target.checked)} color="primary" />
                  </Box>

                  {settings.paymentCodEnabled && (
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: settings.advancePartialPayment ? 2 : 0 }}>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={700}>Advance Partial Payment</Typography>
                          <Typography variant="body2" color="text.secondary">Ask customer to pay a percentage upfront to confirm COD.</Typography>
                        </Box>
                        <Switch checked={settings.advancePartialPayment || false} onChange={e => handleChange('advancePartialPayment', e.target.checked)} color="primary" />
                      </Box>
                      {settings.advancePartialPayment && (
                        <TextField 
                          type="number" 
                          label="Advance Percentage" 
                          value={settings.codAdvancePercentage || 10} 
                          onChange={e => handleChange('codAdvancePercentage', Number(e.target.value))} 
                          InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} 
                          sx={{ width: 200, mt: 1 }}
                        />
                      )}
                    </Box>
                  )}

                  {/* Razorpay Gateway */}
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}><CreditCardIcon color="primary" /></Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>Online Payment Gateway</Typography>
                        <Typography variant="body2" color="text.secondary">Accept UPI, Credit/Debit Cards, Net Banking via Razorpay.</Typography>
                      </Box>
                    </Box>
                    <Switch checked={settings.paymentRazorpayEnabled || false} onChange={e => handleChange('paymentRazorpayEnabled', e.target.checked)} color="primary" />
                  </Box>

                  {/* Manual QR Code */}
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 2, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}><QrCode2Icon color="primary" /></Box>
                        <Box>
                          <Typography variant="h6" fontWeight={700}>Payment QR Code</Typography>
                          <Typography variant="body2" color="text.secondary">Upload your UPI QR code for direct manual payments.</Typography>
                        </Box>
                      </Box>
                      <Switch checked={settings.paymentQrEnabled || false} onChange={e => handleChange('paymentQrEnabled', e.target.checked)} color="primary" />
                    </Box>
                    
                    {settings.paymentQrEnabled && (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                          <Box sx={{ 
                            border: '1px dashed #bdbdbd', 
                            borderRadius: 2, 
                            p: 2, 
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 250
                          }}>
                            {settings.qrImageUrl ? (
                              <Box>
                                <img src={settings.qrImageUrl} alt="QR Code" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain' }} />
                                <Button component="label" sx={{ mt: 1 }}>
                                  Change QR Code
                                  <input type="file" hidden accept="image/*" onChange={handleUploadQR} />
                                </Button>
                              </Box>
                            ) : (
                              <Box>
                                <Typography color="text.secondary" mb={2}>No QR Code Uploaded</Typography>
                                <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
                                  Upload QR Code
                                  <input type="file" hidden accept="image/*" onChange={handleUploadQR} />
                                </Button>
                              </Box>
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={12} md={7}>
                          <Stack spacing={3}>
                            <TextField 
                              fullWidth 
                              label="UPI ID (e.g. pretina@ybl)" 
                              value={settings.upiId || ''} 
                              onChange={e => handleChange('upiId', e.target.value)} 
                            />
                            <TextField 
                              fullWidth 
                              label="Payee Name" 
                              value={settings.upiName || ''} 
                              onChange={e => handleChange('upiName', e.target.value)} 
                            />
                            <Alert severity="info" sx={{ mt: 1 }}>
                              This QR code will be shown to customers if they select manual payment or if they need to pay a partial advance for COD.
                            </Alert>
                          </Stack>
                        </Grid>
                      </Grid>
                    )}
                  </Box>

                </Stack>
              )}

              {/* SEO & SOCIAL (Index 4) */}
              {tabIndex === 4 && (
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

              {/* LEGAL POLICIES (Index 5) */}
              {tabIndex === 5 && (
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
