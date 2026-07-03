import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useDispatch, useSelector } from 'react-redux';
import { toggleSidebar } from '../store/slices/uiSlice';

export default function Topbar({ sidebarWidth }) {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        background: '#fff',
        borderBottom: '1px solid #E0E0E0',
        ml: `${sidebarWidth}px`,
        width: `calc(100% - ${sidebarWidth}px)`,
        transition: 'margin 0.25s ease, width 0.25s ease',
        zIndex: 1100,
      }}
    >
      <Toolbar sx={{ minHeight: 64 }}>
        <IconButton onClick={() => dispatch(toggleSidebar())} sx={{ color: '#666' }}>
          <MenuIcon />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A2E', lineHeight: 1.2 }}>
              {user?.name || 'Admin'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#FF6B00', textTransform: 'capitalize' }}>
              {user?.role || 'admin'}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: '#FF6B00', width: 36, height: 36, fontSize: 15, fontWeight: 700 }}>
            {(user?.name || 'A')[0].toUpperCase()}
          </Avatar>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
