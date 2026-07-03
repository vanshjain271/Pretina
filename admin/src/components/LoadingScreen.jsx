import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function LoadingScreen({ message = 'Loading...' }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', gap: 2, background: '#F5F5F5',
    }}>
      <Box sx={{
        width: 48, height: 48,
        background: 'linear-gradient(135deg, #FF6B00, #FF8C38)',
        borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 700, color: '#fff', fontSize: 24,
      }}>P</Box>
      <CircularProgress size={28} sx={{ color: '#FF6B00' }} />
      <Typography variant="caption" sx={{ color: '#999', fontFamily: 'Poppins, sans-serif' }}>
        {message}
      </Typography>
    </Box>
  );
}
