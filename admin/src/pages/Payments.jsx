import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getOrders, confirmQrPayment } from '../api/endpoints';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function Payments() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getOrders({ paymentMethod: 'qr_upi', paymentStatus: 'advance_paid', limit: 50 });
      setOrders(data.data || []);
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleConfirm = async (id) => {
    try { await confirmQrPayment(id); toast.success('Payment confirmed!'); setDialog(null); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} color="#1A1A2E">QR / UPI Payments</Typography>
        <Typography variant="body2" color="text.secondary">Orders awaiting QR payment verification ({orders.length})</Typography>
      </Box>
      {!loading && orders.length === 0 ? (
        <Card><Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">🎉 No pending QR payments to verify!</Typography>
        </Box></Card>
      ) : (
        <Card>
          <TableContainer><Table>
            <TableHead><TableRow sx={{ background: '#FAFAFA' }}>
              <TableCell sx={{ fontWeight: 700 }}>Order #</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>UPI Ref</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#FF6B00' }} /></TableCell></TableRow>
              : orders.map(o => (
                <TableRow key={o._id} hover>
                  <TableCell><Typography variant="body2" fontWeight={600}>{o.orderNumber}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{o.user?.name}<br /><span style={{ color: '#999', fontSize: 12 }}>{o.user?.phone}</span></Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={700} color="#FF6B00">₹{o.total}</Typography></TableCell>
                  <TableCell><Typography variant="body2">{o.upiTransactionId || '-'}</Typography></TableCell>
                  <TableCell><Typography variant="caption">{dayjs(o.createdAt).format('DD MMM, hh:mm A')}</Typography></TableCell>
                  <TableCell>
                    <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => setDialog(o)}>
                      Verify & Confirm
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></TableContainer>
        </Card>
      )}

      {dialog && (
        <Dialog open onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
          <DialogTitle>Verify QR Payment — {dialog.orderNumber}</DialogTitle>
          <DialogContent>
            <Typography>Customer: <strong>{dialog.user?.name}</strong></Typography>
            <Typography>Amount: <strong>₹{dialog.total}</strong></Typography>
            {dialog.upiTransactionId && <Typography>UPI Ref: <strong>{dialog.upiTransactionId}</strong></Typography>}
            {dialog.upiPaymentProof ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>Payment Screenshot:</Typography>
                <img src={dialog.upiPaymentProof} alt="proof" style={{ width: '100%', maxHeight: 350, objectFit: 'contain', borderRadius: 8, border: '1px solid #E0E0E0' }} />
              </Box>
            ) : (
              <Typography sx={{ mt: 2, color: '#f59e0b' }}>⚠️ No payment screenshot uploaded.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={() => handleConfirm(dialog._id)}>
              ✅ Confirm Payment Received
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
