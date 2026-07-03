import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const SIDEBAR_W = 240;
const SIDEBAR_W_COLLAPSED = 64;

export default function Layout() {
  const sidebarOpen = useSelector(s => s.ui.sidebarOpen);
  const w = sidebarOpen ? SIDEBAR_W : SIDEBAR_W_COLLAPSED;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: '#F5F5F5' }}>
      <Sidebar open={sidebarOpen} width={w} collapsedWidth={SIDEBAR_W_COLLAPSED} />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${w}px`,
          transition: 'margin 0.25s ease',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <Topbar sidebarWidth={w} />
        <Box sx={{ flex: 1, p: 3, pt: 10 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
