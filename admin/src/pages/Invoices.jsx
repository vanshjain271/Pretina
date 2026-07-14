import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, InputAdornment,
  Menu, MenuItem, IconButton,
  Stack, Paper, Divider, Avatar, Dialog,
  DialogContent, DialogActions, Snackbar, Alert,
  Grid, CircularProgress, Table, TableBody, TableCell,
  TableHead, TableRow, TableContainer, Tabs, Tab,
  DialogTitle, Tooltip, Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { getOrders, editOrder, getProducts } from '../api/endpoints';
import {
  Search, Download, MoreVert, Visibility,
  WhatsApp, Close, Settings, Edit, Add, Delete,
  Save,
} from '@mui/icons-material';


import dayjs from 'dayjs';

/* ─── Palette ────────────────────────────────────────────────────── */
const BLUE      = '#1A1A2E'; // Actually PRETINA_DARK
const BLUE_DARK = '#151525';
const BLUE_BG   = '#f4f4f9';
const DARK      = '#1E293B';

/* ─── Types ──────────────────────────────────────────────────────── */






/* ─── Status chip ─────────────────────────────────────────────────── */
const PayChip = ({ status }) => {
  const cfg = {
    PAID:      { label: 'Paid',      color: '#059669', bg: '#D1FAE5' },
    UNPAID:    { label: 'Unpaid',    color: '#DC2626', bg: '#FEE2E2' },
    PART_PAID: { label: 'Part Paid', color: '#D97706', bg: '#FEF3C7' },
  };
  const c = cfg[status] || cfg.UNPAID;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5,
      bgcolor: c.bg, color: c.color, px: 1.5, py: 0.4, borderRadius: 10,
      fontSize: 12, fontWeight: 700 }}>
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: c.color }} />
      {c.label}
    </Box>
  );
};

/* ─── Edit Invoice Dialog ─────────────────────────────────────────── */
const EditInvoiceDialog = ({
  invoice, open, onClose, onSaved,
}) => {
  const [items, setItems]               = useState([]);
  const [shipping, setShipping]         = useState(0);
  const [discount, setDiscount]         = useState(0);
  const [tokenReceived, setTokenReceived] = useState(0);
  const [note, setNote]                 = useState('');
  const [saving, setSaving]             = useState(false);
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);
  const [snack, setSnack]               = useState({ open: false, msg: '', sev: 'success'  });

  const searchProducts = async (query) => {
    if (!query || query.length < 2) return;
    setProductSearchLoading(true);
    try {
      const resp = await getProducts({ search: query, limit: 10 });
      const products = resp?.data?.products || resp?.products || (Array.isArray(resp?.data) ? resp.data : []) || (Array.isArray(resp) ? resp : []);
      
      const flatOptions = [];
      products.forEach((p) => {
        if (p.variants && p.variants.length > 0) {
          p.variants.forEach((v) => {
            flatOptions.push({
              _id: p._id,
              variantId: v._id,
              name: p.name,
              variantName: v.name,
              displayName: `${p.name} - ${v.name} ${v.sku ? `(${v.sku})` : ''}`,
              sku: v.sku || p.sku || '',
              salePrice: v.salePrice ?? p.salePrice ?? 0,
              mrp: v.mrp ?? p.mrp ?? 0,
              image: v.images?.[0] || p.images?.[0] || ''
            });
          });
        } else {
          flatOptions.push({
            _id: p._id,
            variantId: null,
            name: p.name,
            variantName: '',
            displayName: p.sku ? `${p.name} (${p.sku})` : p.name,
            sku: p.sku || '',
            salePrice: p.salePrice ?? 0,
            mrp: p.mrp ?? 0,
            image: p.images?.[0] || ''
          });
        }
      });
      setProductOptions(flatOptions);
    } catch (error) {
      console.error('Search failed', error);
    }
    setProductSearchLoading(false);
  };

  /* Pre-fill when invoice changes */
  useEffect(() => {
    if (!invoice) return;
    setItems((invoice.items || []).map((it) => ({
      id:          Math.random().toString(36).substring(2, 9),
      name:        it.name || '',
      variantName: it.variantName || '',
      sku:         it.sku || '',
      image:       it.image || '',
      quantity:    Number(it.quantity || 1),
      price:       Number(it.price || 0),
      mrp:         Number(it.mrp || it.price || 0),
    })));
    setShipping(Number(invoice.shipping || 0));
    setDiscount(Number(invoice.discount || 0));
    setTokenReceived(Number(invoice.tokenReceived || 0));
    setNote('');
  }, [invoice]);

  if (!invoice) return null;

  /* Derived totals */
  const subtotal    = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalAmount = subtotal + shipping - discount;
  const balanceDue  = Math.max(0, totalAmount - tokenReceived);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems(prev => [{
    id: Math.random().toString(36).substring(2, 9),
    name: '', variantName: '', sku: '', image: '',
    quantity: 1, price: 0, mrp: 0,
  }, ...prev]);

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const save = async () => {
    if (items.some(it => !it.name || it.quantity <= 0)) {
      setSnack({ open: true, msg: 'All items must have a name and quantity > 0', sev: 'error' });
      return;
    }
    setSaving(true);
    try {
      await editOrder(invoice.orderId, {
        items: items.map(it => ({
          name:        it.name,
          variantName: it.variantName,
          sku:         it.sku,
          image:       it.image,
          quantity:    it.quantity,
          price:       it.price,
          mrp:         it.mrp || it.price,
        })),
        shippingCharge: shipping,
        discount,
        tokenReceived,
        note: note || 'Invoice edited from admin panel',
      });
      setSnack({ open: true, msg: 'Invoice updated successfully!', sev: 'success' });
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (err) {
      setSnack({ open: true, msg: err?.message || 'Failed to save changes', sev: 'error' });
    }
    setSaving(false);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth
        PaperProps={{ sx: { borderRadius: 3, maxHeight: '95vh' } }}>

        {/* Header */}
        <Box sx={{ bgcolor: BLUE, px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>Edit Invoice</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{invoice.invoiceNumber}</Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: '#fff' }}><Close /></IconButton>
        </Box>

        <DialogTitle sx={{ pb: 0, pt: 2, px: 3 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Editing order <strong>{invoice.orderNumber}</strong> for <strong>{invoice.customerName}</strong>
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {/* Items Table */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Items</Typography>
            <Button size="small" startIcon={<Add />} variant="outlined"
              sx={{ borderColor: BLUE, color: BLUE }}
              onClick={addItem}>
              Add Item
            </Button>
          </Box>

          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 2.5 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: BLUE_BG }}>
                  {['#', 'Product Name', 'Variant', 'Qty', 'Price (₹)', 'MRP (₹)', 'Total', ''].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, py: 1.5, color: DARK }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={item.id} sx={{ '&:nth-of-type(even)': { bgcolor: '#F8FAFF' } }}>
                    <TableCell sx={{ width: 36, color: DARK, fontWeight: 700 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>
                      <Autocomplete
                        freeSolo
                        size="small"
                        options={productOptions}
                        getOptionLabel={(option) => typeof option === 'string' ? option : option.displayName}
                        loading={productSearchLoading}
                        onInputChange={(_, val) => searchProducts(val)}
                        onChange={(_, val) => {
                          const copy = [...items];
                          if (val && typeof val !== 'string') {
                            copy[idx].name = val.name;
                            if (val.variantName) copy[idx].variantName = val.variantName;
                            if (val.sku) copy[idx].sku = val.sku;
                            copy[idx].price = val.salePrice || 0;
                            copy[idx].mrp = val.mrp || 0;
                          } else if (typeof val === 'string') {
                            copy[idx].name = val;
                          }
                          setItems(copy);
                        }}
                        value={item.name || ''}
                        renderInput={(params) => (
                          <TextField {...params} placeholder="Product name" sx={{ '& .MuiOutlinedInput-root': { fontSize: 12 } }} />
                        )}
                      />
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <TextField
                        value={item.variantName}
                        onChange={e => updateItem(idx, 'variantName', e.target.value)}
                        size="small" fullWidth placeholder="e.g. Black"
                        sx={{ '& .MuiOutlinedInput-root': { fontSize: 12 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 80 }}>
                      <TextField
                        type="number" value={item.quantity}
                        onChange={e => updateItem(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                        size="small" inputProps={{ min: 1 }}
                        sx={{ width: 70, '& .MuiOutlinedInput-root': { fontSize: 12 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 110 }}>
                      <TextField
                        type="number" value={item.price}
                        onChange={e => updateItem(idx, 'price', Math.max(0, Number(e.target.value)))}
                        size="small" inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100, '& .MuiOutlinedInput-root': { fontSize: 12 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 110 }}>
                      <TextField
                        type="number" value={item.mrp}
                        onChange={e => updateItem(idx, 'mrp', Math.max(0, Number(e.target.value)))}
                        size="small" inputProps={{ min: 0, step: 0.01 }}
                        sx={{ width: 100, '& .MuiOutlinedInput-root': { fontSize: 12 } }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: 90 }}>
                      {fmt(item.price * item.quantity)}
                    </TableCell>
                    <TableCell sx={{ width: 48 }}>
                      <Tooltip title="Remove item">
                        <IconButton size="small" color="error" onClick={() => removeItem(idx)}
                          disabled={items.length <= 1}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Charges & Summary */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid #E2E8F0` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Charges & Adjustments</Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Shipping Charge (₹)"
                    type="number"
                    value={shipping}
                    onChange={e => setShipping(Math.max(0, Number(e.target.value)))}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    label="Discount (₹)"
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <TextField
                    label="Advance / Token Received (₹)"
                    type="number"
                    value={tokenReceived}
                    onChange={e => setTokenReceived(Math.max(0, Number(e.target.value)))}
                    size="small"
                    fullWidth
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Amount already paid as advance. Will appear in PDF as a deduction."
                  />
                  <TextField
                    label="Edit Note (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="e.g. Updated quantity after confirmation"
                  />
                </Stack>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2.5, borderRadius: 2, border: `1px solid #E2E8F0`, height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 2 }}>Invoice Summary</Typography>
                <Stack spacing={1}>
                  {[
                    { label: 'Sub Total',        val: fmt(subtotal),    color: DARK },
                    { label: '+ Shipping',        val: fmt(shipping),    color: DARK },
                    { label: '- Discount',        val: fmt(discount),    color: '#059669' },
                    { label: '= Total Amount',    val: fmt(totalAmount), color: DARK, bold: true },
                    ...(tokenReceived > 0 ? [
                      { label: '- Advance Paid',  val: fmt(tokenReceived), color: '#059669', bold: false }
                    ] : []),
                  ].map(row => (
                    <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5,
                      borderBottom: '1px solid #F1F5F9' }}>
                      <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: row.bold ? 800 : 600, color: row.color }}>
                        {row.val}
                      </Typography>
                    </Box>
                  ))}
                  {/* Balance Due */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: BLUE_BG,
                    mx: -2.5, px: 2.5, py: 1.5, borderRadius: '0 0 8px 8px', mt: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: BLUE }}>Balance Due</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: BLUE }}>{fmt(balanceDue)}</Typography>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', gap: 1 }}>
          <Button onClick={onClose} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={save}
            disabled={saving}
            sx={{ bgcolor: BLUE, '&:hover': { bgcolor: BLUE_DARK } }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.sev}>{snack.msg}</Alert>
      </Snackbar>
    </>
  );
};

/* ─── Detail Modal ────────────────────────────────────────────────── */
const InvoiceModal = ({
  invoice, open, onClose, downloading, onDownload, onEdit,
}) => {
  if (!invoice) return null;
  const fmtCurr = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const addr = invoice.billingAddress || {};

  const summaryRows = [
    { label: 'Item Total',       val: fmtCurr(invoice.subtotal || invoice.amount) },
    ...(invoice.shipping > 0   ? [{ label: 'Delivery Charge', val: `+ ${fmtCurr(invoice.shipping)}`, color: DARK }] : []),
    ...(invoice.wantsGstInvoice ? [{ label: 'GST (18%)', val: `+ ${fmtCurr(invoice.gstAmount)}`, color: DARK }] : []),
    ...(invoice.discount > 0   ? [{ label: 'Discount',        val: `- ${fmtCurr(invoice.discount)}`, color: '#059669' }] : []),
    { label: 'Total Amount',     val: fmtCurr(invoice.amount), color: BLUE },
    ...(invoice.tokenReceived > 0 ? [{ label: 'Advance Paid', val: `- ${fmtCurr(invoice.tokenReceived)}`, color: '#059669' }] : []),
    ...(invoice.payment?.amountPaid > 0 ? [{ label: 'Amount Paid', val: `- ${fmtCurr(invoice.payment.amountPaid)}`, color: '#059669' }] : []),
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '92vh' } }}>

      {/* Header */}
      <Box sx={{ bgcolor: BLUE, px: 4, py: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: 20, letterSpacing: 1 }}>INVOICE</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>{invoice.invoiceNumber}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>Pretina Premium Products</Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>New Delhi, India</Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff', ml: 2 }}><Close /></IconButton>
      </Box>

      <DialogContent sx={{ p: 3, bgcolor: '#F8FAFC', overflowY: 'auto' }}>

        {/* Meta cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Invoice Date',  val: dayjs(invoice.invoiceDate).format('DD MMM YYYY'), border: BLUE },
            { label: 'Order Number',  val: invoice.orderNumber,                              border: '#3B82F6' },
            { label: 'Order Status',  val: invoice.orderStatus,                              border: '#10B981' },
          ].map(c => (
            <Grid item xs={12} sm={4} key={c.label}>
              <Paper sx={{ p: 2, borderRadius: 2, borderLeft: `4px solid ${c.border}` }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>{c.label}</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{c.val}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Bill To */}
        <Paper sx={{ p: 2, borderRadius: 2, mb: 3, borderLeft: `4px solid ${BLUE}` }}>
          <Typography variant="overline" sx={{ fontWeight: 700, color: BLUE, display: 'block', mb: 0.5 }}>BILL TO</Typography>
          <Typography variant="body1" sx={{ fontWeight: 700 }}>{invoice.customerName}</Typography>
          <Typography variant="body2" color="text.secondary">{invoice.customerPhone}</Typography>
          {invoice.wantsGstInvoice && invoice.gstNumber && (
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mt: 0.5 }}>
              GSTIN: {invoice.gstNumber}
            </Typography>
          )}
          {addr.addressLine1 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {[addr.addressLine1, addr.addressLine2, addr.city, addr.state, addr.pincode && `- ${addr.pincode}`].filter(Boolean).join(', ')}
            </Typography>
          )}
        </Paper>

        {/* Items Table */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Items</Typography>
        <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: BLUE }}>
                {['#', 'Product', 'Qty', 'MRP', 'Price', 'Discount', 'Total'].map(h => (
                  <TableCell key={h} sx={{ color: '#fff', fontWeight: 700, py: 1.5, fontSize: 12 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {invoice.items.map((item, i) => {
                const mrp  = Number(item.mrp || item.price || 0);
                const price = Number(item.price || 0);
                const qty   = Number(item.quantity || 0);
                const discPerItem = Math.max(0, mrp - price);
                const discTotal   = discPerItem * qty;
                const total = Number(item.total || item.totalWithTax || price * qty);
                return (
                  <TableRow key={i} sx={{ '&:nth-of-type(even)': { bgcolor: BLUE_BG } }}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.name}</Typography>
                      {item.variantName && <Typography variant="caption" color="text.secondary">{item.variantName}</Typography>}
                    </TableCell>
                    <TableCell>{qty}</TableCell>
                    <TableCell sx={{ color: '#94A3B8', textDecoration: 'line-through' }}>₹{mrp.toFixed(2)}</TableCell>
                    <TableCell>₹{price.toFixed(2)}</TableCell>
                    <TableCell sx={{ color: '#059669', fontWeight: 600 }}>
                      {discTotal > 0 ? `-₹${discTotal.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>₹{total.toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Payment Summary */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Paper sx={{ p: 2.5, borderRadius: 2, minWidth: 320 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Payment Summary</Typography>
            {summaryRows.map(row => (
              <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px solid #F1F5F9' }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: row.color || DARK }}>{row.val}</Typography>
              </Box>
            ))}
            {/* Balance Due */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1.5,
              borderTop: `2px solid ${BLUE}`, bgcolor: BLUE_BG, mx: -2.5, px: 2.5, py: 1.5, borderRadius: '0 0 8px 8px' }}>
              <Typography variant="body1" sx={{ fontWeight: 800, color: BLUE }}>Balance Due</Typography>
              <Typography variant="body1" sx={{ fontWeight: 800, color: BLUE }}>{fmtCurr(invoice.balance)}</Typography>
            </Box>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0', gap: 1 }}>
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button variant="outlined" startIcon={<Edit sx={{ color: BLUE }} />}
          onClick={() => onEdit(invoice)}
          sx={{ borderColor: BLUE, color: BLUE }}>
          Edit Invoice
        </Button>
        <Button variant="outlined" startIcon={<WhatsApp sx={{ color: '#25D366' }} />}
          onClick={() => {
            const phone = invoice.customerPhone;
            const msg = `Hi ${invoice.customerName}, your invoice ${invoice.invoiceNumber} for ₹${invoice.amount.toFixed(2)} has been created. Balance due: ₹${invoice.balance.toFixed(2)}.`;
            window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
          }}>
          WhatsApp
        </Button>
        <Button variant="contained"
          startIcon={downloading ? <CircularProgress size={16} color="inherit" /> : <Download />}
          onClick={() => onDownload(invoice)}
          disabled={downloading}
          sx={{ bgcolor: BLUE, '&:hover': { bgcolor: BLUE_DARK } }}>
          {downloading ? 'Generating...' : 'Download PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/* ─── Main Page ───────────────────────────────────────────────────── */
const Invoices = () => {
  const [all, setAll]                     = useState([]);
  const [loading, setLoading]             = useState(false);
  const [tab, setTab]                     = useState(0);
  const [search, setSearch]               = useState('');
  const [dateFrom, setDateFrom]           = useState('');
  const [dateTo, setDateTo]               = useState('');
  const [detailInv, setDetailInv]         = useState(null);
  const [modalOpen, setModalOpen]         = useState(false);
  const [editInv, setEditInv]             = useState(null);
  const [editOpen, setEditOpen]           = useState(false);
  const [downloading, setDownloading]     = useState(false);
  const [anchorEl, setAnchorEl]           = useState(null);
  const [menuRow, setMenuRow]             = useState(null);
  const [snack, setSnack]                 = useState({ open: false, msg: '', sev: 'success'  });

  /* ── Load ── */
  const loadInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo)   params.dateTo   = dateTo;

      const res = await getOrders(params);
      
      // Map Pretina Order format to YouthQit InvoiceRow format
      const rawOrders = res?.data?.data || [];
      const rows = rawOrders.map((ord) => {
        const amt = ord.total || 0;
        const bal = Math.max(0, amt - (ord.tokenReceived || 0));
        let pStatus = 'UNPAID';
        if (ord.paymentStatus === 'completed' || bal === 0) pStatus = 'PAID';
        else if (ord.tokenReceived > 0) pStatus = 'PART_PAID';

        return {
          id: ord._id,
          orderId: ord._id,
          invoiceNumber: ord.orderNumber?.replace('ORD-', 'INV-') || 'INV-0000',
          orderNumber: ord.orderNumber || '-',
          invoiceDate: ord.createdAt,
          customerName: ord.shippingAddress?.name || ord.user?.name || 'Unknown',
          customerPhone: ord.shippingAddress?.phone || ord.user?.phone || '-',
          amount: amt,
          subtotal: ord.subtotal || 0,
          tokenReceived: ord.tokenReceived || 0,
          discount: ord.discount || 0,
          shipping: ord.deliveryFee || 0,
          wantsGstInvoice: ord.wantsGstInvoice || false,
          gstNumber: ord.gstNumber || '',
          gstAmount: ord.gstAmount || 0,
          balance: bal,
          payStatus: pStatus,
          orderStatus: ord.status,
          items: ord.items || [],
          billingAddress: ord.shippingAddress || {},
          user: ord.user || {},
          payment: { amountPaid: ord.paymentStatus === 'completed' ? amt : ord.tokenReceived || 0 }
        };
      });

      setAll(rows);
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setSnack({ open: true, msg: 'Failed to load invoices', sev: 'error' });
    }
    setLoading(false);
  }, [dateFrom, dateTo]);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  /* ── Counts ── */
  const counts = {
    all:      all.length,
    paid:     all.filter(i => i.payStatus === 'PAID').length,
    unpaid:   all.filter(i => i.payStatus === 'UNPAID').length,
    partPaid: all.filter(i => i.payStatus === 'PART_PAID').length,
  };

  const tabStatus = [null, 'PAID', 'UNPAID', 'PART_PAID'];
  const afterTab = tab === 0 ? all : all.filter(i => i.payStatus === tabStatus[tab]);

  const filtered = search
    ? afterTab.filter(i =>
        i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        i.customerName.toLowerCase().includes(search.toLowerCase()) ||
        i.customerPhone.includes(search) ||
        i.orderNumber.toLowerCase().includes(search.toLowerCase())
      )
    : afterTab;

  /* ── PDF download ── */
  const downloadPDF = async (inv) => {
    setDownloading(true);
    try {
      window.open(`/api/v1/orders/${inv.orderId}/invoice-pdf`, '_blank');
    } catch (err) {
      setSnack({ open: true, msg: err?.message || 'PDF generation failed', sev: 'error' });
    }
    setDownloading(false);
  };

  /* ── Quick date buttons ── */
  const applyQuickDate = (type) => {
    const today = dayjs();
    if (type === 'today') {
      setDateFrom(today.format('YYYY-MM-DD'));
      setDateTo(today.format('YYYY-MM-DD'));
    } else if (type === 'yesterday') {
      const y = today.subtract(1, 'day').format('YYYY-MM-DD');
      setDateFrom(y); setDateTo(y);
    } else if (type === 'week') {
      setDateFrom(today.subtract(7, 'day').format('YYYY-MM-DD'));
      setDateTo(today.format('YYYY-MM-DD'));
    } else if (type === 'month') {
      setDateFrom(today.subtract(1, 'month').format('YYYY-MM-DD'));
      setDateTo(today.format('YYYY-MM-DD'));
    } else {
      setDateFrom(''); setDateTo('');
    }
  };

  /* ── Open edit from detail modal ── */
  const openEdit = (inv) => {
    setModalOpen(false);
    setEditInv(inv);
    setEditOpen(true);
  };

  /* ── Columns ── */
  const columns = [
    {
      field: 'invoiceNumber', headerName: 'Invoice #', width: 195,
      renderCell: params => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: BLUE, cursor: 'pointer',
          '&:hover': { textDecoration: 'underline' } }}
          onClick={() => { setDetailInv(params.row); setModalOpen(true); }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'amount', headerName: 'Amount', width: 115,
      renderCell: p => (
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          ₹{Number(p.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'balance', headerName: 'Balance', width: 115,
      renderCell: p => (
        <Typography variant="body2" sx={{ fontWeight: 700, color: Number(p.value) > 0 ? '#DC2626' : '#059669' }}>
          ₹{Number(p.value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
      ),
    },
    {
      field: 'invoiceDate', headerName: 'Create Date', width: 120,
      renderCell: p => <Typography variant="body2">{dayjs(p.value).format('DD-MMM-YYYY')}</Typography>,
    },
    {
      field: 'customerName', headerName: 'Customer Name', flex: 1, minWidth: 160,
      renderCell: p => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 30, height: 30, fontSize: 13, fontWeight: 700, bgcolor: BLUE }}>
            {String(p.value || '-').charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{p.value || '-'}</Typography>
            <Typography variant="caption" color="text.secondary">{p.row.customerPhone}</Typography>
          </Box>
        </Stack>
      ),
    },
    {
      field: 'payStatus', headerName: 'Status', width: 120,
        renderCell: p => <PayChip status={p.value} />,
    },
    {
      field: 'actions', headerName: '', width: 50, sortable: false,
      renderCell: p => (
        <IconButton size="small" onClick={e => { setAnchorEl(e.currentTarget); setMenuRow(p.row); }}>
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Invoices</Typography>
          <Typography variant="body2" color="text.secondary">
            {counts.all} total · Click invoice # to view details
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Settings />}
          onClick={loadInvoices}
          sx={{ bgcolor: BLUE, '&:hover': { bgcolor: BLUE_DARK } }}>
          Refresh
        </Button>
      </Box>

      {/* ── Filters ── */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
        <Stack direction="row" spacing={2} flexWrap="wrap" gap={1} alignItems="center">
          <TextField
            placeholder="Invoice #, Customer Name, Mobile..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
            sx={{ width: 310 }}
          />
          <Divider orientation="vertical" flexItem />
          {[['all', 'All'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Last Week'], ['month', 'Last Month']].map(([k, label]) => (
            <Button key={k} size="small" variant="outlined"
              onClick={() => applyQuickDate(k)}
              sx={{ textTransform: 'none', borderRadius: 10, borderColor: '#E2E8F0', color: '#64748B',
                '&:hover': { borderColor: BLUE, color: BLUE } }}>
              {label}
            </Button>
          ))}
          <Divider orientation="vertical" flexItem />
          <TextField type="date" size="small" label="From" InputLabelProps={{ shrink: true }}
            value={dateFrom} onChange={e => setDateFrom(e.target.value)} sx={{ width: 150 }} />
          <TextField type="date" size="small" label="To" InputLabelProps={{ shrink: true }}
            value={dateTo} onChange={e => setDateTo(e.target.value)} sx={{ width: 150 }} />
          <Button size="small" variant="contained"
            onClick={loadInvoices}
            sx={{ bgcolor: BLUE, '&:hover': { bgcolor: BLUE_DARK } }}>
            Apply
          </Button>
          {(dateFrom || dateTo) && (
            <Button size="small" variant="outlined" color="inherit"
              onClick={() => { setDateFrom(''); setDateTo(''); }}>
              Clear
            </Button>
          )}
        </Stack>
      </Paper>

      {/* ── Tabs ── */}
      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 0 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid #E2E8F0', px: 2,
            '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', minWidth: 'auto', px: 2 },
            '& .Mui-selected': { color: BLUE },
            '& .MuiTabs-indicator': { bgcolor: BLUE } }}>
          <Tab label={`All (${counts.all})`} />
          <Tab label={`Paid (${counts.paid})`} />
          <Tab label={`Unpaid (${counts.unpaid})`} />
          <Tab label={`Part Paid (${counts.partPaid})`} />
        </Tabs>

        {/* ── DataGrid ── */}
        <DataGrid
          rows={filtered}
          columns={columns}
          loading={loading}
          rowHeight={60}
          onRowClick={params => { setDetailInv(params.row); setModalOpen(true); }}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          pageSizeOptions={[10, 25, 50, 100]}
          sx={{
            border: 'none', bgcolor: '#fff',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#F8FAFC', fontWeight: 700, fontSize: 13 },
            '& .MuiDataGrid-cell': { borderBottom: '1px solid #F1F5F9', cursor: 'pointer' },
            '& .MuiDataGrid-row:hover': { bgcolor: BLUE_BG },
          }}
        />
      </Paper>

      {/* ── Detail Modal ── */}
      <InvoiceModal
        invoice={detailInv}
        open={modalOpen}
        onClose={() => { setModalOpen(false); setDetailInv(null); }}
        downloading={downloading}
        onDownload={downloadPDF}
        onEdit={openEdit}
      />

      {/* ── Edit Invoice Dialog ── */}
      <EditInvoiceDialog
        invoice={editInv}
        open={editOpen}
        onClose={() => { setEditOpen(false); setEditInv(null); }}
        onSaved={() => { loadInvoices(); setSnack({ open: true, msg: 'Invoice updated!', sev: 'success' }); }}
      />

      {/* ── Row Action Menu ── */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        <MenuItem onClick={() => { setDetailInv(menuRow); setModalOpen(true); setAnchorEl(null); }}>
          <Visibility sx={{ mr: 1.5, fontSize: 18 }} /> View Invoice
        </MenuItem>
        <MenuItem onClick={() => {
          if (menuRow) { setEditInv(menuRow); setEditOpen(true); }
          setAnchorEl(null);
        }}>
          <Edit sx={{ mr: 1.5, fontSize: 18, color: BLUE }} /> Edit Invoice
        </MenuItem>
        <MenuItem onClick={() => { if (menuRow) downloadPDF(menuRow); setAnchorEl(null); }}>
          <Download sx={{ mr: 1.5, fontSize: 18 }} /> Download PDF
        </MenuItem>
        <MenuItem onClick={() => {
          if (!menuRow) return;
          const msg = `Hi ${menuRow.customerName}, your invoice ${menuRow.invoiceNumber} for ₹${menuRow.amount.toFixed(2)}. Balance: ₹${menuRow.balance.toFixed(2)}.`;
          window.open(`https://wa.me/${menuRow.customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
          setAnchorEl(null);
        }}>
          <WhatsApp sx={{ mr: 1.5, fontSize: 18, color: '#25D366' }} /> WhatsApp
        </MenuItem>
      </Menu>

      {/* ── Snackbar ── */}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack(s => ({ ...s, open: false }))}>
        <Alert severity={snack.sev}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default Invoices;
