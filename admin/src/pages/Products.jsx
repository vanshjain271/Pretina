/**
 * Products.jsx — Pretina Admin
 * Full YouthQit feature parity:
 *  - Rich text editor for description (inline contentEditable with toolbar)
 *  - Bulk / tiered pricing UI (add/remove tiers, minQty + salePrice)
 *  - All product fields: tax, min order qty, unit, color, model, youtube, warranty
 *  - Homepage section chip toggles
 *  - Variants with color, isActive flag
 *  - Duplicate product button
 *  - Image management with existing image removal
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Card, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid,
  FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel,
  CircularProgress, Pagination, InputAdornment, Divider, Tooltip,
  ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import toast from 'react-hot-toast';
import {
  getProducts, createProduct, updateProduct, deleteProduct, duplicateProduct,
  getCategories, getBrands,
} from '../api/endpoints';

/* ── Inline Rich Text Editor Component ──────────────────────── */
function RichTextEditor({ value, onChange, placeholder = 'Write a detailed product description...' }) {
  const ref = useRef(null);
  const isComposing = useRef(false);

  // Sync HTML from parent on first mount / external changes (open dialog)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || '';
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    ref.current?.focus();
    // Trigger onChange immediately
    if (onChange) onChange(ref.current.innerHTML);
  };

  const handleInput = () => {
    if (!isComposing.current && onChange) onChange(ref.current.innerHTML);
  };

  return (
    <Box sx={{ border: '1px solid #d1d5db', borderRadius: 2, overflow: 'hidden' }}>
      {/* Toolbar */}
      <Box sx={{
        display: 'flex', gap: 0.5, p: 1, bgcolor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap',
      }}>
        <Tooltip title="Bold"><IconButton size="small" onMouseDown={e => { e.preventDefault(); exec('bold'); }}><FormatBoldIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Italic"><IconButton size="small" onMouseDown={e => { e.preventDefault(); exec('italic'); }}><FormatItalicIcon fontSize="small" /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title="Bullet List"><IconButton size="small" onMouseDown={e => { e.preventDefault(); exec('insertUnorderedList'); }}><FormatListBulletedIcon fontSize="small" /></IconButton></Tooltip>
        <Tooltip title="Numbered List"><IconButton size="small" onMouseDown={e => { e.preventDefault(); exec('insertOrderedList'); }}><FormatListNumberedIcon fontSize="small" /></IconButton></Tooltip>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        {['H2', 'H3', 'P'].map(tag => (
          <Tooltip key={tag} title={tag === 'P' ? 'Paragraph' : `Heading ${tag.slice(1)}`}>
            <Button
              size="small"
              sx={{ minWidth: 36, fontSize: 11, fontWeight: 700, px: 1, color: '#374151', textTransform: 'none' }}
              onMouseDown={e => {
                e.preventDefault();
                exec('formatBlock', tag === 'P' ? 'p' : tag.toLowerCase());
              }}
            >
              {tag}
            </Button>
          </Tooltip>
        ))}
      </Box>

      {/* Editable area */}
      <Box
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onCompositionStart={() => { isComposing.current = true; }}
        onCompositionEnd={() => {
          isComposing.current = false;
          handleInput();
        }}
        data-placeholder={placeholder}
        sx={{
          minHeight: 180, p: 2, outline: 'none',
          fontSize: 14, lineHeight: 1.7, color: '#111827',
          '&:empty::before': {
            content: 'attr(data-placeholder)',
            color: '#9ca3af',
            pointerEvents: 'none',
          },
          '& ul, & ol': { pl: 3 },
          '& h2': { fontSize: '1.2em', fontWeight: 700, my: 1 },
          '& h3': { fontSize: '1.05em', fontWeight: 600, my: 0.5 },
          '& p': { my: 0.5 },
        }}
      />
    </Box>
  );
}

/* ── Bulk Pricing Row Component ─────────────────────────────── */
function BulkPricingRow({ tier, index, onChange, onRemove }) {
  return (
    <Box sx={{
      display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5,
      p: 1.5, bgcolor: '#f9fafb', borderRadius: 1.5, border: '1px solid #e5e7eb',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>Min Qty:</Typography>
        <TextField
          size="small" type="number" value={tier.minQty}
          onChange={e => onChange(index, 'minQty', e.target.value)}
          sx={{ width: 80 }}
          inputProps={{ min: 1 }}
        />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
        <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>Price (₹):</Typography>
        <TextField
          size="small" type="number" value={tier.salePrice}
          onChange={e => onChange(index, 'salePrice', e.target.value)}
          sx={{ width: 90 }}
          inputProps={{ min: 0 }}
        />
      </Box>
      <Tooltip title="Remove tier">
        <IconButton size="small" onClick={() => onRemove(index)} sx={{ color: '#ef4444' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/* ── Empty form state ────────────────────────────────────────── */
const EMPTY = {
  name: '', description: '', shortDesc: '',
  price: '', salePrice: '', stock: '', sku: '',
  taxMode: 'excluded', taxRate: 0,
  color: '', modelSeries: '', measuringUnit: 'Pcs',
  minOrderQty: 1, lowStockThreshold: 10,
  paymentMode: 'default',
  youtubeUrl: '', warranty: '',
  category: '', brand: '', tags: '',
  isFeatured: false, isRecommended: false, isTrending: false, isNewArrival: false,
  isActive: true,
  hasVariants: false, variants: [],
  bulkPricing: [],
};

const HOMEPAGE_CHIPS = [
  { key: 'isNewArrival', label: 'New Arrival', color: '#10b981' },
  { key: 'isTrending',   label: 'Trending',    color: '#f59e0b' },
  { key: 'isFeatured',   label: 'Featured',    color: '#FF6B00' },
  { key: 'isRecommended',label: 'Recommended', color: '#6366f1' },
];

/* ── Main Component ──────────────────────────────────────────── */
export default function Products() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null); // null | 'add' | product obj
  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]);       // new File[] to upload
  const [existingImages, setExistingImages] = useState([]); // URLs already on product
  const [previews, setPreviews] = useState([]);   // display URLs (existing + new blobs)
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  /* ── Load products ─────────────────────────────────────────── */
  const load = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 15 };
      if (search) params.search = search;
      const { data } = await getProducts(params);
      setProducts(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(page); }, [page, search]);

  useEffect(() => {
    getCategories().then(({ data }) => setCategories(data.data || [])).catch(() => {});
    getBrands().then(({ data }) => setBrands(data.data || [])).catch(() => {});
  }, []);

  /* ── Dialog helpers ────────────────────────────────────────── */
  const openAdd = () => {
    setForm(EMPTY);
    setImages([]); setExistingImages([]); setPreviews([]);
    setDialog('add');
  };

  const openEdit = (p) => {
    // Normalize category for Select (single value)
    const catId = Array.isArray(p.category)
      ? (p.category[0]?._id || p.category[0] || '')
      : (p.category?._id || p.category || '');

    setForm({
      ...EMPTY,
      ...p,
      category: catId,
      brand: p.brand?._id || p.brand || '',
      bulkPricing: Array.isArray(p.bulkPricing) ? p.bulkPricing : [],
      variants: Array.isArray(p.variants) ? p.variants : [],
    });
    const existUrls = p.images || [];
    setExistingImages(existUrls);
    setPreviews(existUrls);
    setImages([]);
    setDialog(p);
  };

  /* ── Form helpers ──────────────────────────────────────────── */
  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  /* ── Images ────────────────────────────────────────────────── */
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews([...existingImages, ...newPreviews]);
  };

  const removeExistingImage = (url) => {
    const updated = existingImages.filter(u => u !== url);
    setExistingImages(updated);
    setPreviews([...updated, ...images.map(f => URL.createObjectURL(f))]);
  };

  /* ── Variants ──────────────────────────────────────────────── */
  const handleAddVariant = () => {
    set('variants', [...(form.variants || []), {
      name: '', color: '', sku: '', mrp: '', salePrice: '', stock: '', isActive: true,
    }]);
  };

  const handleVariantChange = (i, field, value) => {
    const next = [...(form.variants || [])];
    next[i] = { ...next[i], [field]: value };
    set('variants', next);
  };

  const handleRemoveVariant = (i) => {
    const next = [...(form.variants || [])];
    next.splice(i, 1);
    set('variants', next);
  };

  /* ── Bulk Pricing ──────────────────────────────────────────── */
  const handleAddTier = () => {
    set('bulkPricing', [...(form.bulkPricing || []), { minQty: 1, salePrice: '' }]);
  };

  const handleTierChange = (i, field, value) => {
    const next = [...(form.bulkPricing || [])];
    next[i] = { ...next[i], [field]: value };
    set('bulkPricing', next);
  };

  const handleRemoveTier = (i) => {
    const next = [...(form.bulkPricing || [])];
    next.splice(i, 1);
    set('bulkPricing', next);
  };

  /* ── Save ──────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.name) return toast.error('Product name is required');
    if (!form.salePrice) return toast.error('Sale price is required');
    if (!form.category) return toast.error('Category is required');

    setSaving(true);
    try {
      const fd = new FormData();

      // Append all scalar fields
      const SKIP = ['variants', 'bulkPricing', 'tags', 'category', 'images', '_id', '__v',
                     'createdAt', 'updatedAt', 'slug', 'isInStock', 'rating', 'reviewCount',
                     'discountPercentage', 'id'];
      Object.entries(form).forEach(([k, v]) => {
        if (SKIP.includes(k)) return;
        fd.append(k, v === null || v === undefined ? '' : String(v));
      });

      // JSON-serialized fields
      fd.append('variants', JSON.stringify(form.variants || []));
      fd.append('bulkPricing', JSON.stringify((form.bulkPricing || []).filter(t => t.minQty && t.salePrice)));
      fd.append('category', JSON.stringify([form.category].filter(Boolean)));
      fd.append('existingImages', JSON.stringify(existingImages));

      // New image files
      images.forEach(img => fd.append('images', img));

      if (dialog === 'add') {
        await createProduct(fd);
        toast.success('Product created!');
      } else {
        await updateProduct(dialog._id, fd);
        toast.success('Product updated!');
      }

      setDialog(null);
      load(page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ────────────────────────────────────────────────── */
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      load(page);
    } catch { toast.error('Failed to delete product'); }
  };

  /* ── Duplicate ─────────────────────────────────────────────── */
  const handleDuplicate = async (id) => {
    try {
      await duplicateProduct(id);
      toast.success('Product duplicated! Review and activate it.');
      load(page);
    } catch {
      toast.error('Failed to duplicate product');
    }
  };

  /* ── Render ────────────────────────────────────────────────── */
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">Products</Typography>
          <Typography variant="body2" color="text.secondary">{total} products total</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Product</Button>
      </Box>

      {/* Table */}
      <Card sx={{ mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField size="small" placeholder="Search by name or SKU..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#999' }} /></InputAdornment> }}
            sx={{ width: 300 }}
          />
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ background: '#FAFAFA' }}>
                <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Pricing</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Tiers</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Flags</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} sx={{ textAlign: 'center', py: 5 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
              ) : products.map(p => (
                <TableRow key={p._id} hover>
                  <TableCell>
                    {p.images?.[0]
                      ? <img src={p.images[0]} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                      : <Box sx={{ width: 44, height: 44, background: '#F0F0F0', borderRadius: 8 }} />}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                    {p.sku && <Typography variant="caption" color="text.secondary">SKU: {p.sku}</Typography>}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} color="#FF6B00">₹{p.salePrice}</Typography>
                    {p.price > p.salePrice && (
                      <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#999' }}>₹{p.price}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={p.hasVariants ? 'Variants' : p.stock} size="small"
                      color={p.hasVariants ? 'info' : p.stock > 0 ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell>
                    {p.bulkPricing?.length > 0
                      ? <Chip label={`${p.bulkPricing.length} tier${p.bulkPricing.length > 1 ? 's' : ''}`} size="small" color="warning" sx={{ fontSize: 11 }} />
                      : <Typography variant="caption" color="text.secondary">—</Typography>}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.3, flexWrap: 'wrap' }}>
                      {p.isFeatured    && <Chip label="F" size="small" sx={{ bgcolor: '#FF6B0020', color: '#FF6B00', fontSize: 10, height: 20 }} />}
                      {p.isRecommended && <Chip label="R" size="small" sx={{ bgcolor: '#6366f120', color: '#6366f1', fontSize: 10, height: 20 }} />}
                      {p.isTrending    && <Chip label="T" size="small" sx={{ bgcolor: '#f59e0b20', color: '#f59e0b', fontSize: 10, height: 20 }} />}
                      {p.isNewArrival  && <Chip label="N" size="small" sx={{ bgcolor: '#10b98120', color: '#10b981', fontSize: 10, height: 20 }} />}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={p.isActive ? 'Active' : 'Hidden'} size="small" color={p.isActive ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(p)} sx={{ color: '#FF6B00' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Duplicate"><IconButton size="small" onClick={() => handleDuplicate(p._id)} sx={{ color: '#6366f1' }}><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" onClick={() => handleDelete(p._id)} sx={{ color: '#e53e3e' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
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

      {/* ── Add / Edit Dialog ─────────────────────────────────── */}
      <Dialog
        open={!!dialog}
        onClose={() => setDialog(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#f3f4f6', minHeight: '92vh', maxHeight: '95vh' } }}
      >
        {/* Sticky header with actions */}
        <DialogTitle sx={{
          bgcolor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid #e0e0e0', p: '12px 20px', position: 'sticky', top: 0, zIndex: 10,
        }}>
          <Typography variant="h6" fontWeight={700}>
            {dialog === 'add' ? '+ New Product' : `Edit: ${form.name || '...'}`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={() => setDialog(null)} sx={{ color: '#666' }}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              sx={{ bgcolor: '#FF6B00', '&:hover': { bgcolor: '#e55a00' } }}
            >
              {saving ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Save Product'}
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Grid container spacing={3}>

            {/* ────────────── LEFT COLUMN ─────────────────────── */}
            <Grid item xs={12} md={8}>

              {/* Basic Info */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Basic Information</Typography>
                <TextField
                  fullWidth label="Product Name *" size="small"
                  value={form.name || ''} onChange={e => set('name', e.target.value)}
                  sx={{ mb: 2.5 }}
                />
                <TextField
                  fullWidth label="Short Description" size="small"
                  value={form.shortDesc || ''} onChange={e => set('shortDesc', e.target.value)}
                  sx={{ mb: 2.5 }}
                  helperText="One-line summary shown in product cards"
                />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600 }}>
                  Full Description
                </Typography>
                <RichTextEditor
                  value={form.description || ''}
                  onChange={html => set('description', html)}
                />
              </Card>

              {/* Product Details */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Product Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth label="SKU" size="small" value={form.sku || ''} onChange={e => set('sku', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth label="Colour" size="small" value={form.color || ''} onChange={e => set('color', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField fullWidth label="Model / Series" size="small" value={form.modelSeries || ''} onChange={e => set('modelSeries', e.target.value)} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Measuring Unit</InputLabel>
                      <Select label="Measuring Unit" value={form.measuringUnit || 'Pcs'} onChange={e => set('measuringUnit', e.target.value)}>
                        {['Pcs', 'Box', 'Kg', 'Set', 'Pair', 'Dozen', 'Litre', 'Meter'].map(u => (
                          <MenuItem key={u} value={u}>{u}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField
                      fullWidth label="Min Order Qty" size="small" type="number"
                      value={form.minOrderQty || 1}
                      onChange={e => set('minOrderQty', e.target.value)}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Payment Mode</InputLabel>
                      <Select label="Payment Mode" value={form.paymentMode || 'default'} onChange={e => set('paymentMode', e.target.value)}>
                        <MenuItem value="default">Default (All)</MenuItem>
                        <MenuItem value="prepaid">Prepaid Only</MenuItem>
                        <MenuItem value="cod">COD Only</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="YouTube URL" size="small" value={form.youtubeUrl || ''} onChange={e => set('youtubeUrl', e.target.value)} placeholder="https://youtube.com/watch?v=..." />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField fullWidth label="Warranty" size="small" value={form.warranty || ''} onChange={e => set('warranty', e.target.value)} placeholder="e.g. 1 Year Manufacturer Warranty" />
                  </Grid>
                </Grid>
              </Card>

              {/* Images */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700}>Product Images</Typography>
                  <Typography variant="caption" color="text.secondary">{previews.length} image(s)</Typography>
                </Box>
                <Box component="label" sx={{
                  border: '2px dashed #e5e7eb', borderRadius: 2, p: 3, textAlign: 'center',
                  bgcolor: '#f9fafb', display: 'flex', flexDirection: 'column', alignItems: 'center',
                  cursor: 'pointer', mb: 2, '&:hover': { borderColor: '#FF6B00', bgcolor: '#fff7f3' },
                }}>
                  <CloudUploadIcon sx={{ fontSize: 36, color: '#9ca3af', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">Click to upload images</Typography>
                  <Typography variant="caption" color="text.secondary">JPEG, PNG, WebP · Max 5MB · Up to 10 images</Typography>
                  <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
                </Box>
                {previews.length > 0 && (
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                    {existingImages.map((src, i) => (
                      <Box key={`ex-${i}`} sx={{ position: 'relative' }}>
                        <img src={src} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #e5e7eb' }} />
                        <IconButton
                          size="small"
                          onClick={() => removeExistingImage(src)}
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: '#ef4444', color: '#fff', p: 0.3, '&:hover': { bgcolor: '#dc2626' } }}
                        >
                          <CloseIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                    ))}
                    {images.map((f, i) => (
                      <Box key={`new-${i}`} sx={{ position: 'relative' }}>
                        <img src={URL.createObjectURL(f)} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #FF6B00' }} />
                        <Chip label="NEW" size="small" sx={{ position: 'absolute', top: -6, left: -6, fontSize: 9, height: 16, bgcolor: '#FF6B00', color: '#fff' }} />
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>

              {/* Bulk Pricing */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Bulk / Tiered Pricing</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Auto-applies during checkout when order qty meets threshold
                    </Typography>
                  </Box>
                  <Button size="small" startIcon={<AddIcon />} onClick={handleAddTier} variant="outlined" sx={{ borderColor: '#FF6B00', color: '#FF6B00' }}>
                    Add Tier
                  </Button>
                </Box>
                {form.bulkPricing?.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 2, color: '#9ca3af' }}>
                    <Typography variant="caption">No pricing tiers yet. Add tiers for bulk discounts.</Typography>
                  </Box>
                )}
                {form.bulkPricing?.map((tier, i) => (
                  <BulkPricingRow
                    key={i}
                    tier={tier}
                    index={i}
                    onChange={handleTierChange}
                    onRemove={handleRemoveTier}
                  />
                ))}
                {form.bulkPricing?.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    💡 Tiers are auto-sorted by min qty. The highest qualifying tier is applied.
                  </Typography>
                )}
              </Card>

              {/* Variants */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: form.hasVariants ? 2 : 0 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Variants</Typography>
                    {form.hasVariants && (
                      <Typography variant="caption" color="text.secondary">Each variant overrides the base pricing &amp; stock.</Typography>
                    )}
                  </Box>
                  <FormControlLabel
                    control={<Switch checked={!!form.hasVariants} onChange={e => set('hasVariants', e.target.checked)} color="primary" />}
                    label="Has Variants" labelPlacement="start" sx={{ m: 0 }}
                  />
                </Box>

                {form.hasVariants && (
                  <Box>
                    {(form.variants || []).map((v, i) => (
                      <Box key={i} sx={{
                        display: 'flex', gap: 1.5, mb: 2, alignItems: 'flex-end', flexWrap: 'wrap',
                        p: 2, border: '1px solid #e5e7eb', borderRadius: 2, bgcolor: '#fafafa',
                      }}>
                        <TextField size="small" label="Option Name *" value={v.name || ''}
                          onChange={e => handleVariantChange(i, 'name', e.target.value)} sx={{ flex: 2, minWidth: 130 }} />
                        <TextField size="small" label="Colour" value={v.color || ''}
                          onChange={e => handleVariantChange(i, 'color', e.target.value)} sx={{ flex: 1, minWidth: 100 }} />
                        <TextField size="small" type="number" label="Sale Price ₹" value={v.salePrice || ''}
                          onChange={e => handleVariantChange(i, 'salePrice', e.target.value)} sx={{ flex: 1, minWidth: 100 }} />
                        <TextField size="small" type="number" label="MRP ₹" value={v.mrp || ''}
                          onChange={e => handleVariantChange(i, 'mrp', e.target.value)} sx={{ flex: 1, minWidth: 90 }} />
                        <TextField size="small" type="number" label="Stock" value={v.stock || ''}
                          onChange={e => handleVariantChange(i, 'stock', e.target.value)} sx={{ flex: 1, minWidth: 80 }} />
                        <TextField size="small" label="SKU" value={v.sku || ''}
                          onChange={e => handleVariantChange(i, 'sku', e.target.value)} sx={{ flex: 1, minWidth: 100 }} />
                        <FormControlLabel
                          control={<Switch size="small" checked={v.isActive !== false}
                            onChange={e => handleVariantChange(i, 'isActive', e.target.checked)} />}
                          label={<Typography variant="caption">Active</Typography>}
                          sx={{ m: 0 }}
                        />
                        <IconButton onClick={() => handleRemoveVariant(i)} color="error" size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button variant="outlined" startIcon={<AddIcon />} onClick={handleAddVariant}
                      sx={{ mt: 1, textTransform: 'none', borderColor: '#e5e7eb', color: '#374151' }}>
                      Add Variant
                    </Button>
                  </Box>
                )}
              </Card>
            </Grid>

            {/* ────────────── RIGHT COLUMN ────────────────────── */}
            <Grid item xs={12} md={4}>

              {/* Pricing */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Pricing</Typography>
                <TextField
                  fullWidth label="Sale Price (₹) *" size="small" type="number"
                  value={form.salePrice || ''}
                  onChange={e => set('salePrice', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth label="MRP / Original Price (₹)" size="small" type="number"
                  value={form.price || ''}
                  onChange={e => set('price', e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Tax Settings
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <InputLabel>Tax Mode</InputLabel>
                    <Select label="Tax Mode" value={form.taxMode || 'excluded'} onChange={e => set('taxMode', e.target.value)}>
                      <MenuItem value="excluded">+ Exclusive (Tax added on top)</MenuItem>
                      <MenuItem value="included">Inclusive (Tax in price)</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ width: 90 }}>
                    <InputLabel>Tax %</InputLabel>
                    <Select label="Tax %" value={form.taxRate || 0} onChange={e => set('taxRate', e.target.value)}>
                      {[0, 5, 12, 18, 28].map(r => (
                        <MenuItem key={r} value={r}>{r}%</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              </Card>

              {/* Inventory */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Inventory</Typography>
                <TextField
                  fullWidth label="Stock" size="small" type="number"
                  value={form.stock || ''}
                  onChange={e => set('stock', e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={form.hasVariants}
                  helperText={form.hasVariants ? 'Managed per variant' : ''}
                />
                <TextField
                  fullWidth label="Low Stock Alert Threshold" size="small" type="number"
                  value={form.lowStockThreshold ?? 10}
                  onChange={e => set('lowStockThreshold', e.target.value)}
                  helperText="Get alerted when stock drops to or below this number"
                />
              </Card>

              {/* Organization */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Organization</Typography>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Category *</InputLabel>
                  <Select label="Category *" value={form.category || ''} onChange={e => set('category', e.target.value)}>
                    {categories.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Brand</InputLabel>
                  <Select label="Brand" value={form.brand || ''} onChange={e => set('brand', e.target.value)}>
                    <MenuItem value="">None</MenuItem>
                    {brands.map(b => <MenuItem key={b._id} value={b._id}>{b.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth label="Tags (comma separated)" size="small"
                  value={typeof form.tags === 'string' ? form.tags : (form.tags || []).join(', ')}
                  onChange={e => set('tags', e.target.value)}
                  helperText="e.g. summer, cotton, casual"
                />
              </Card>

              {/* Homepage Visibility */}
              <Card sx={{ p: 3, mb: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={1}>Homepage Sections</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                  Select which app homepage sections to show this product in.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {HOMEPAGE_CHIPS.map(({ key, label, color }) => (
                    <Chip
                      key={key}
                      label={label}
                      onClick={() => set(key, !form[key])}
                      sx={{
                        borderRadius: 1.5, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                        bgcolor: form[key] ? `${color}20` : 'transparent',
                        color: form[key] ? color : '#6b7280',
                        border: `1.5px solid ${form[key] ? color : '#d1d5db'}`,
                        '&:hover': { bgcolor: `${color}15` },
                      }}
                    />
                  ))}
                </Box>
              </Card>

              {/* Status */}
              <Card sx={{ p: 3, borderRadius: 2, boxShadow: 'none', border: '1px solid #e5e7eb' }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Visibility</Typography>
                <FormControlLabel
                  control={<Switch checked={!!form.isActive} onChange={e => set('isActive', e.target.checked)} color="success" />}
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{form.isActive ? 'Active' : 'Hidden'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {form.isActive ? 'Visible to customers' : 'Not visible to customers'}
                      </Typography>
                    </Box>
                  }
                />
              </Card>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
