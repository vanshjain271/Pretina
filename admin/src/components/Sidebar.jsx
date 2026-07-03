import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Typography, Tooltip,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ImageIcon from '@mui/icons-material/Image';
import CampaignIcon from '@mui/icons-material/Campaign';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PaymentIcon from '@mui/icons-material/Payment';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import { logout } from '../store/slices/authSlice';

const NAV = [
  { label: 'Dashboard',   icon: <DashboardIcon />,          to: '/' },
  { label: 'Products',    icon: <InventoryIcon />,           to: '/products' },
  { label: 'Categories',  icon: <CategoryIcon />,            to: '/categories' },
  { label: 'Brands',      icon: <BrandingWatermarkIcon />,   to: '/brands' },
  { label: 'Orders',      icon: <ShoppingCartIcon />,        to: '/orders' },
  { label: 'Payments',    icon: <PaymentIcon />,             to: '/payments' },
  { divider: true },
  { label: 'Banners',     icon: <ImageIcon />,               to: '/banners' },
  { label: 'Alerts',      icon: <CampaignIcon />,            to: '/alerts' },
  { label: 'Coupons',     icon: <LocalOfferIcon />,          to: '/coupons' },
  { divider: true },
  { label: 'Users',       icon: <PeopleIcon />,              to: '/users' },
  { label: 'Settings',    icon: <SettingsIcon />,            to: '/settings' },
];

export default function Sidebar({ open, width }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <Box
      sx={{
        width,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        background: '#1A1A2E',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        overflow: 'hidden',
        zIndex: 1200,
      }}
    >
      {/* Logo */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5, minHeight: 64 }}>
        <Box
          sx={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #FF6B00, #FF8C38)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 18, flexShrink: 0,
          }}
        >P</Box>
        {open && (
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>Pretina</Typography>
            <Typography variant="caption" sx={{ color: '#FF6B00' }}>Admin Panel</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map((item, i) => {
          if (item.divider) return <Divider key={i} sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />;
          return (
            <Tooltip key={item.to} title={!open ? item.label : ''} placement="right">
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  end={item.to === '/'}
                  sx={{
                    borderRadius: '8px',
                    color: '#9AA5B4',
                    minHeight: 44,
                    '&.active': {
                      background: 'rgba(255,107,0,0.15)',
                      color: '#FF6B00',
                      '& .MuiListItemIcon-root': { color: '#FF6B00' },
                    },
                    '&:hover': {
                      background: 'rgba(255,255,255,0.06)',
                      color: '#fff',
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                  {open && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />}
                </ListItemButton>
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Logout */}
      <List sx={{ px: 1, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, color: '#9AA5B4', '&:hover': { color: '#ff6b6b', background: 'rgba(255,107,107,0.08)' } }}>
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
            {open && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
