import React, { useEffect, useState } from 'react';
import { Box, Typography, Tabs, Tab, Card, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination, IconButton, Chip, Rating, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';
import { getReviews, updateReviewStatus, deleteReview } from '../api/endpoints';

export default function Reviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [viewModal, setViewModal] = useState(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data } = await getReviews();
      setReviews(data.data);
    } catch (err) {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const pendingCount = reviews.filter(r => r.status === 'PENDING').length;
  const approvedCount = reviews.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = reviews.filter(r => r.status === 'REJECTED').length;

  const filteredReviews = reviews.filter(r => tab === 'ALL' ? true : r.status === tab);
  
  const handleApprove = async (id) => {
    try {
      await updateReviewStatus(id, { status: 'APPROVED' });
      toast.success('Review approved');
      fetchReviews();
      if (viewModal?._id === id) setViewModal(prev => ({ ...prev, status: 'APPROVED' }));
    } catch {
      toast.error('Failed to approve review');
    }
  };

  const handleReject = async (id) => {
    try {
      await updateReviewStatus(id, { status: 'REJECTED' });
      toast.success('Review rejected');
      fetchReviews();
      if (viewModal?._id === id) setViewModal(prev => ({ ...prev, status: 'REJECTED' }));
    } catch {
      toast.error('Failed to reject review');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      await deleteReview(id);
      toast.success('Review deleted');
      fetchReviews();
      if (viewModal?._id === id) setViewModal(null);
    } catch {
      toast.error('Failed to delete review');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StarIcon sx={{ color: '#FFB800', fontSize: 28 }} />
          <Typography variant="h5" fontWeight={700} color="#1A1A2E">Reviews & Ratings</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip label={`${pendingCount} Pending`} size="small" sx={{ bgcolor: '#FFF4E5', color: '#FF9800', fontWeight: 600, border: '1px solid #FFE0B2' }} />
          <Chip label={`${approvedCount} Approved`} size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, border: '1px solid #C8E6C9' }} />
          <Chip label={`${rejectedCount} Rejected`} size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600, border: '1px solid #FFCDD2' }} />
        </Box>
      </Box>

      {/* Tabs */}
      <Tabs value={tab} onChange={(e, v) => { setTab(v); setPage(0); }} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab value="ALL" label="ALL" sx={{ fontWeight: 600 }} />
        <Tab value="PENDING" label="PENDING" sx={{ fontWeight: 600 }} />
        <Tab value="APPROVED" label="APPROVED" sx={{ fontWeight: 600 }} />
        <Tab value="REJECTED" label="REJECTED" sx={{ fontWeight: 600 }} />
      </Tabs>

      {/* Table */}
      <Card sx={{ borderRadius: 2, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Product</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Review</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Verified</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#6B7280' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReviews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box 
                        sx={{ 
                          width: 40, height: 40, borderRadius: 1, 
                          bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' 
                        }}
                      >
                        {r.product?.images?.[0] ? (
                          <img src={r.product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : null}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>{r.product?.name || 'Unknown Product'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Rating value={r.rating} readOnly size="small" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.comment}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {r.isVerifiedPurchase ? (
                      <Typography variant="body2" color="success.main" fontWeight={600}>Yes</Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {r.status === 'APPROVED' && <Chip label="APPROVED" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, borderRadius: 1 }} />}
                    {r.status === 'PENDING' && <Chip label="PENDING" size="small" sx={{ bgcolor: '#FFF4E5', color: '#FF9800', fontWeight: 600, borderRadius: 1 }} />}
                    {r.status === 'REJECTED' && <Chip label="REJECTED" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600, borderRadius: 1 }} />}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(r.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton size="small" onClick={() => setViewModal(r)} sx={{ color: '#6B7280' }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDelete(r._id)} sx={{ color: '#6B7280' }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredReviews.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">No reviews found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredReviews.length}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Card>

      {/* View Modal */}
      <Dialog open={!!viewModal} onClose={() => setViewModal(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid #f0f0f0' }}>Review Details</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {viewModal && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="text.secondary">Product</Typography>
                <Typography variant="body2" fontWeight={600}>{viewModal.product?.name || 'Unknown'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
                <Typography variant="body2" fontWeight={600}>{viewModal.name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="text.secondary">Rating</Typography>
                <Rating value={viewModal.rating} readOnly size="small" />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                <Typography variant="body2">{new Date(viewModal.createdAt).toLocaleDateString()}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                {viewModal.status === 'APPROVED' && <Chip label="APPROVED" size="small" sx={{ bgcolor: '#E8F5E9', color: '#2E7D32', fontWeight: 600, borderRadius: 1 }} />}
                {viewModal.status === 'PENDING' && <Chip label="PENDING" size="small" sx={{ bgcolor: '#FFF4E5', color: '#FF9800', fontWeight: 600, borderRadius: 1 }} />}
                {viewModal.status === 'REJECTED' && <Chip label="REJECTED" size="small" sx={{ bgcolor: '#FFEBEE', color: '#C62828', fontWeight: 600, borderRadius: 1 }} />}
              </Box>
              <Box sx={{ mt: 2, p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>Review Comment</Typography>
                <Typography variant="body1">{viewModal.comment}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 2, borderTop: '1px solid #f0f0f0' }}>
          {viewModal?.status !== 'APPROVED' && (
            <Button variant="contained" color="success" onClick={() => handleApprove(viewModal._id)} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Approve
            </Button>
          )}
          {viewModal?.status !== 'REJECTED' && (
            <Button variant="contained" color="error" onClick={() => handleReject(viewModal._id)} sx={{ textTransform: 'none', borderRadius: 2 }}>
              Reject
            </Button>
          )}
          <Button variant="outlined" onClick={() => setViewModal(null)} sx={{ textTransform: 'none', borderRadius: 2, ml: 'auto' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
