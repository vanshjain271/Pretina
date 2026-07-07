import React from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import ReviewsIcon from '@mui/icons-material/Reviews';

export default function Reviews() {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700} mb={3}>Product Reviews</Typography>
      <Card sx={{ textAlign: 'center', py: 10 }}>
        <CardContent>
          <ReviewsIcon sx={{ fontSize: 60, color: '#ccc', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">Review management is currently being migrated.</Typography>
          <Typography variant="body2" color="text.secondary">Stay tuned for advanced review moderation.</Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
