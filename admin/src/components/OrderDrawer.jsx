import React from 'react';
import { Drawer, Box, Typography, Chip, IconButton, Divider, Avatar, Button } from '@mui/material';
import { Close, Edit, WhatsApp, Print, OpenInNew, LocationOn, Payment, ShoppingBag, Timeline, DeleteOutline, LocalShipping, Inventory, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const STATUS_COLORS = {
  pending: 'warning', confirmed: 'info', packed: 'secondary',
  shipped: 'primary', delivered: 'success', cancelled: 'error', returned: 'error'
};

const OrderTimeline = ({ statusHistory }) => {
  if (!statusHistory || statusHistory.length === 0) return null;
  const STATUS_STEP_COLORS = {
    pending: '#F59E0B', confirmed: '#3B82F6', packed: '#8B5CF6',
    shipped: '#0EA5E9', delivered: '#10B981', cancelled: '#EF4444', returned: '#EF4444'
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Timeline fontSize="small" /> Order Timeline
      </Typography>
      <Box sx={{ position: 'relative', pl: 3 }}>
        <Box sx={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, bgcolor: '#E2E8F0' }} />
        {statusHistory.map((entry, i) => (
          <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: 1.5, position: 'relative' }}>
            <Box sx={{
              position: 'absolute', left: -19, top: 4, width: 12, height: 12, borderRadius: '50%',
              bgcolor: STATUS_STEP_COLORS[entry.status] || '#94A3B8', border: '2px solid #fff',
              boxShadow: `0 0 0 2px ${STATUS_STEP_COLORS[entry.status] || '#94A3B8'}40`, zIndex: 1
            }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 13 }}>{entry.status.toUpperCase()}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(entry.timestamp || entry.date || new Date()).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Typography>
              {entry.note && <Typography variant="caption" sx={{ display: 'block', color: '#64748B', fontStyle: 'italic' }}>{entry.note}</Typography>}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default function OrderDrawer({ order, open, onClose, onEditStatus, onEditOrder, onPrintInvoice, onPrintPackingSlip, onDelete }) {
  const navigate = useNavigate();
  if (!order) return null;

  const customer = order.user || {};
  const phone = customer.phone || order.shippingAddress?.phone || '';
  const shippingAddr = order.shippingAddress;

  const handleWhatsApp = () => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${clean.startsWith('91') ? clean : '91' + clean}`, '_blank');
  };

  const handleViewCustomer = () => {
    if (customer._id) {
      navigate(`/customers/${customer._id}`);
      onClose();
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: '100%', sm: 500, md: 550 }, display: 'flex', flexDirection: 'column' } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, background: 'linear-gradient(135deg, #1A1A2E 0%, #2A2A4A 100%)', flexShrink: 0 }}>
        <Box>
          <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{order.orderNumber}</Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip label={order.status.toUpperCase()} size="small" color={STATUS_COLORS[order.status] || 'default'} sx={{ color: '#fff', fontWeight: 600 }} />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" title="Delete Order" onClick={onDelete} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' } }}>
            <DeleteOutline fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Edit Order" onClick={onEditOrder} sx={{ color: '#94A3B8', '&:hover': { color: '#3B82F6', bgcolor: 'rgba(59,130,246,0.1)' } }}>
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" title="WhatsApp Customer" onClick={handleWhatsApp} disabled={!phone} sx={{ color: '#94A3B8', '&:hover': { color: '#25D366', bgcolor: 'rgba(37,211,102,0.1)' } }}>
            <WhatsApp fontSize="small" />
          </IconButton>
          <IconButton size="small" title="Print Invoice" onClick={onPrintInvoice} sx={{ color: '#94A3B8', '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245,158,11,0.1)' } }}>
            <Print fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8', '&:hover': { color: '#fff' } }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Scrollable content */}
      <Box sx={{ overflowY: 'auto', flex: 1, px: 3, py: 2 }}>
        {/* Order meta */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
          {[
            { label: 'Order Date', value: new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) },
            { label: 'Payment Mode', value: (order.paymentMethod || '—').toUpperCase() },
            { label: 'Payment Status', value: (order.paymentStatus || '—').toUpperCase() },
          ].map(({ label, value }) => (
            <Box key={label} sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" color="text.secondary">{label}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.3 }}>{value}</Typography>
            </Box>
          ))}
        </Box>

        {order.courierName && (
          <Box sx={{ bgcolor: '#EFF6FF', borderRadius: 1.5, p: 1.5, mb: 2, border: '1px solid #BFDBFE', display: 'flex', gap: 1, alignItems: 'center' }}>
            <LocalShipping sx={{ color: '#3B82F6', fontSize: 20 }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{order.courierName}</Typography>
              {order.trackingNumber && <Typography variant="caption" color="text.secondary">Tracking: {order.trackingNumber}</Typography>}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Customer */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Person fontSize="small" /> Customer
          </Typography>
          {customer._id && (
            <IconButton size="small" onClick={handleViewCustomer} title="View Customer Dashboard">
              <OpenInNew fontSize="small" sx={{ color: '#3B82F6' }} />
            </IconButton>
          )}
        </Box>
        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, mb: 2, border: '1px solid #E2E8F0' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{customer.name || shippingAddr?.name || '—'}</Typography>
          <Typography variant="body2" color="text.secondary">{phone || '—'}</Typography>
          {customer.email && <Typography variant="body2" color="text.secondary">{customer.email}</Typography>}
        </Box>

        {/* Shipping Address */}
        {shippingAddr && (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <LocationOn fontSize="small" /> Shipping Address
            </Typography>
            <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, mb: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>{shippingAddr.name}</Typography>
              <Typography variant="body2" color="text.secondary">{shippingAddr.phone}</Typography>
              <Typography variant="caption" color="text.secondary">
                {[shippingAddr.line1, shippingAddr.line2, shippingAddr.city, shippingAddr.state, shippingAddr.pincode].filter(Boolean).join(', ')}
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        {/* Order Timeline */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <>
            <OrderTimeline statusHistory={order.statusHistory} />
            <Divider sx={{ my: 2 }} />
          </>
        )}

        {/* Items */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ShoppingBag fontSize="small" /> Items ({order.items?.length || 0})
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {(order.items || []).map((item, idx) => (
            <Box key={idx} sx={{ display: 'flex', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
              <Avatar src={item.image} variant="rounded" sx={{ width: 56, height: 56, bgcolor: '#E2E8F0' }}>
                <ShoppingBag sx={{ color: '#94A3B8' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>{item.name}</Typography>
                {item.variantName && <Typography variant="caption" color="text.secondary">{item.variantName}</Typography>}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">MRP: ₹{item.mrp} &nbsp;</Typography>
                    <Typography variant="caption">Qty: {item.quantity}</Typography>
                    <Typography variant="caption" sx={{ ml: 1 }}>Unit: ₹{item.price}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(item.price * item.quantity).toLocaleString()}</Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Totals */}
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Payment fontSize="small" /> Payment Summary
        </Typography>
        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 1.5, p: 1.5, border: '1px solid #E2E8F0', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Item Total</Typography>
            <Typography variant="body2">₹{(order.subtotal || 0).toLocaleString()}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography variant="body2" color="text.secondary">Shipping</Typography>
            <Typography variant="body2">₹{(order.deliveryFee || 0).toLocaleString()}</Typography>
          </Box>
          {order.discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Discount</Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>−₹{order.discount.toLocaleString()}</Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body1" sx={{ fontWeight: 700 }}>Total Amount</Typography>
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#1A1A2E' }}>₹{(order.total || 0).toLocaleString()}</Typography>
          </Box>
          {order.tokenReceived > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Advance Paid</Typography>
              <Typography variant="body2" sx={{ color: 'success.main' }}>−₹{order.tokenReceived.toLocaleString()}</Typography>
            </Box>
          )}
          {((order.total || 0) - (order.tokenReceived || 0)) > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>Due</Typography>
              <Typography variant="body2" sx={{ color: 'error.main', fontWeight: 700 }}>
                ₹{((order.total || 0) - (order.tokenReceived || 0)).toLocaleString()}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0, bgcolor: '#F8F9FA' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" startIcon={<Edit />} onClick={onEditOrder}>Edit Order</Button>
          <Button fullWidth variant="outlined" onClick={onEditStatus}>Update Status</Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button fullWidth variant="outlined" color="warning" startIcon={<Print />} onClick={onPrintInvoice}>Invoice PDF</Button>
          <Button fullWidth variant="outlined" color="secondary" startIcon={<Inventory />} onClick={onPrintPackingSlip}>Packing Slip</Button>
        </Box>
        <Button fullWidth variant="contained" sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe57' } }} startIcon={<WhatsApp />} onClick={handleWhatsApp} disabled={!phone}>
          WhatsApp
        </Button>
      </Box>
    </Drawer>
  );
}
