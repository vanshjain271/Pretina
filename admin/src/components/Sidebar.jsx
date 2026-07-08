import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Divider, Typography, Tooltip, Collapse,
} from '@mui/material';
import DashboardIcon       from '@mui/icons-material/Dashboard';
import InventoryIcon       from '@mui/icons-material/Inventory2';
import CategoryIcon        from '@mui/icons-material/Category';
import BrandingWatermarkIcon from '@mui/icons-material/BrandingWatermark';
import ShoppingCartIcon    from '@mui/icons-material/ShoppingCart';
import ImageIcon           from '@mui/icons-material/Image';
import CampaignIcon        from '@mui/icons-material/Campaign';
import LocalOfferIcon      from '@mui/icons-material/LocalOffer';
import PeopleIcon          from '@mui/icons-material/People';
import SettingsIcon        from '@mui/icons-material/Settings';
import LogoutIcon          from '@mui/icons-material/Logout';
import ReceiptLongIcon     from '@mui/icons-material/ReceiptLong';
import GroupsIcon          from '@mui/icons-material/Groups';
import BarChartIcon        from '@mui/icons-material/BarChart';
import ArticleIcon         from '@mui/icons-material/Article';
import NotificationsIcon   from '@mui/icons-material/Notifications';
import HistoryIcon         from '@mui/icons-material/History';
import StorefrontIcon      from '@mui/icons-material/Storefront';
import StarIcon            from '@mui/icons-material/Star';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import ShoppingBagIcon     from '@mui/icons-material/ShoppingBag';
import LocationOnIcon      from '@mui/icons-material/LocationOn';
import AccessTimeIcon      from '@mui/icons-material/AccessTime';
import WarehouseIcon       from '@mui/icons-material/Warehouse';
import ExpandLessIcon      from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon      from '@mui/icons-material/ExpandMore';
import { useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';

const ACCENT = '#FF6B00';
const BG     = '#1A1A2E';
const HOVER  = 'rgba(255,255,255,0.06)';
const ACTIVE = 'rgba(255,107,0,0.15)';

const NAV = [
  { type: 'item',  label: 'Dashboard',  icon: <DashboardIcon />,  to: '/', end: true }, // Accessible to everyone

  { type: 'group', label: 'Orders',     icon: <ShoppingCartIcon />, permissions: ['orders.view', 'orders.edit', 'orders.delete'], children: [
    { label: 'Online Orders',    icon: <ShoppingBagIcon />,      to: '/orders', permissions: ['orders.view'] },
    { label: 'Purchase Orders',  icon: <ReceiptLongIcon />,      to: '/purchase-orders', permissions: ['orders.view'] },
    { label: 'Abandoned Carts',  icon: <AddShoppingCartIcon />,  to: '/abandoned-carts', permissions: ['orders.view'] },
    { label: 'Create Order',     icon: <AddShoppingCartIcon />,  to: '/add-order', permissions: ['orders.view'] },
  ]},

  { type: 'item',  label: 'Invoices',   icon: <ReceiptLongIcon />, to: '/invoices', permissions: ['invoices.view'] },

  { type: 'group', label: 'Catalog',    icon: <InventoryIcon />, permissions: ['products.view', 'categories.view', 'brands.view', 'reviews.view'], children: [
    { label: 'Products',    icon: <InventoryIcon />,         to: '/products', permissions: ['products.view'] },
    { label: 'Categories',  icon: <CategoryIcon />,          to: '/categories', permissions: ['categories.view'] },
    { label: 'Brands',      icon: <BrandingWatermarkIcon />, to: '/brands', permissions: ['brands.view'] },
    { label: 'Reviews',     icon: <StarIcon />,              to: '/reviews', permissions: ['reviews.view'] },
  ]},

  { type: 'item',  label: 'Customers',  icon: <PeopleIcon />,      to: '/customers', permissions: ['customers.view'] },
  { type: 'item',  label: 'Employees',  icon: <GroupsIcon />,      to: '/employees', permissions: ['employees.view'] },

  { type: 'group', label: 'Promotions', icon: <CampaignIcon />, permissions: ['coupons.view', 'banners.view'], children: [
    { label: 'Coupons', icon: <LocalOfferIcon />, to: '/coupons', permissions: ['coupons.view'] },
    { label: 'Banners', icon: <ImageIcon />,       to: '/banners', permissions: ['banners.view'] },
    { label: 'Alerts',  icon: <CampaignIcon />,    to: '/alerts', permissions: ['banners.view'] },
  ]},

  { type: 'group', label: 'Reports',    icon: <BarChartIcon />, permissions: ['reports.view'], children: [
    { label: 'Overview',    icon: <BarChartIcon />,    to: '/reports', permissions: ['reports.view'] },
    { label: 'Geo Map',     icon: <LocationOnIcon />,  to: '/analytics/geo', permissions: ['reports.view'] },
    { label: 'Inventory',   icon: <WarehouseIcon />,   to: '/analytics/inventory', permissions: ['reports.view'] },
    { label: 'Peak Hours',  icon: <AccessTimeIcon />,  to: '/analytics/peak-hours', permissions: ['reports.view'] },
  ]},

  { type: 'divider' },

  { type: 'group', label: 'Online Store', icon: <StorefrontIcon />, permissions: ['settings.view', 'blog.view'], children: [
    { label: 'Store Settings', icon: <SettingsIcon />,       to: '/store-settings', permissions: ['settings.view'] },
    { label: 'Blog',           icon: <ArticleIcon />,         to: '/blog', permissions: ['blog.view'] },
    { label: 'Notifications',  icon: <NotificationsIcon />,   to: '/notifications', permissions: ['settings.view'] },
  ]},

  { type: 'item',  label: 'Activity Log', icon: <HistoryIcon />,   to: '/activity-log', permissions: ['activity.view'] },
];

function NavGroup({ item, open: sidebarOpen }) {
  const location = useLocation();
  const isChildActive = item.children.some(c => location.pathname.startsWith(c.to));
  const [expanded, setExpanded] = useState(isChildActive);

  return (
    <>
      <Tooltip title={!sidebarOpen ? item.label : ''} placement="right">
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            onClick={() => setExpanded(e => !e)}
            sx={{
              borderRadius: '8px',
              color: isChildActive ? ACCENT : '#9AA5B4',
              background: isChildActive ? ACTIVE : 'transparent',
              minHeight: 44,
              '&:hover': { background: HOVER, color: '#fff' },
            }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
            {sidebarOpen && (
              <>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                />
                {expanded ? <ExpandLessIcon sx={{ fontSize: 18 }} /> : <ExpandMoreIcon sx={{ fontSize: 18 }} />}
              </>
            )}
          </ListItemButton>
        </ListItem>
      </Tooltip>

      {sidebarOpen && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding sx={{ pl: 1 }}>
            {item.children.map(child => (
              <ListItem key={child.to} disablePadding sx={{ mb: 0.25 }}>
                <ListItemButton
                  component={NavLink}
                  to={child.to}
                  sx={{
                    borderRadius: '8px',
                    color: '#9AA5B4',
                    minHeight: 38,
                    '&.active': { background: ACTIVE, color: ACCENT, '& .MuiListItemIcon-root': { color: ACCENT } },
                    '&:hover': { background: HOVER, color: '#fff' },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 32, '& svg': { fontSize: 18 } }}>
                    {child.icon}
                  </ListItemIcon>
                  <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: 13, fontWeight: 400 }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      )}
    </>
  );
}

export default function Sidebar({ open, width }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);

  const isEmployee = user?.role === 'EMPLOYEE';
  const userPermissions = user?.permissions || [];

  const checkPermission = (itemPermissions) => {
    if (!isEmployee) return true;
    if (!itemPermissions || itemPermissions.length === 0) return true;
    return itemPermissions.some(p => userPermissions.includes(p));
  };

  return (
    <Box
      sx={{
        width,
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        background: BG,
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
          component="img" 
          src="/logo.png" 
          alt="Pretina" 
          sx={{ width: 36, height: 36, borderRadius: '8px', objectFit: 'contain' }} 
        />
        {open && (
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
              Pretina
            </Typography>
            <Typography variant="caption" sx={{ color: ACCENT }}>Admin Panel</Typography>
          </Box>
        )}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 1, overflowY: 'auto', overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 4 },
      }}>
        {NAV.map((item, i) => {
          if (item.type === 'divider') {
            return <Divider key={i} sx={{ my: 1, borderColor: 'rgba(255,255,255,0.08)' }} />;
          }

          if (!checkPermission(item.permissions)) return null;

          if (item.type === 'group') {
            const allowedChildren = item.children.filter(child => checkPermission(child.permissions));
            if (allowedChildren.length === 0) return null;
            return <NavGroup key={item.label} item={{ ...item, children: allowedChildren }} open={open} />;
          }

          return (
            <Tooltip key={item.to} title={!open ? item.label : ''} placement="right">
              <ListItem disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  sx={{
                    borderRadius: '8px',
                    color: '#9AA5B4',
                    minHeight: 44,
                    '&.active': {
                      background: ACTIVE,
                      color: ACCENT,
                      '& .MuiListItemIcon-root': { color: ACCENT },
                    },
                    '&:hover': { background: HOVER, color: '#fff' },
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}>{item.icon}</ListItemIcon>
                  {open && (
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
                    />
                  )}
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
          <ListItemButton
            onClick={() => { dispatch(logout()); navigate('/login'); }}
            sx={{ borderRadius: 2, color: '#9AA5B4', '&:hover': { color: '#ff6b6b', background: 'rgba(255,107,107,0.08)' } }}
          >
            <ListItemIcon sx={{ color: 'inherit', minWidth: 36 }}><LogoutIcon /></ListItemIcon>
            {open && <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />}
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
}
