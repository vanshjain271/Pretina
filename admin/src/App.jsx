import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';
import ProtectedRoute from './components/ProtectedRoute';

// ── Existing pages ────────────────────────────────────────────────
const Login           = lazy(() => import('./pages/Login'));
const Dashboard       = lazy(() => import('./pages/Dashboard'));
const Products        = lazy(() => import('./pages/Products'));
const Categories      = lazy(() => import('./pages/Categories'));
const Brands          = lazy(() => import('./pages/Brands'));
const Orders          = lazy(() => import('./pages/Orders'));
const OrderDetail     = lazy(() => import('./pages/OrderDetail'));
const Banners         = lazy(() => import('./pages/Banners'));
const Alerts          = lazy(() => import('./pages/Alerts'));
const Coupons         = lazy(() => import('./pages/Coupons'));
const Users           = lazy(() => import('./pages/Users'));
const Settings        = lazy(() => import('./pages/Settings'));
const Payments        = lazy(() => import('./pages/Payments'));

// ── New pages (YouthQit feature parity) ──────────────────────────
const Invoices        = lazy(() => import('./pages/Invoices'));
const Customers       = lazy(() => import('./pages/Customers'));
const CustomerDetails = lazy(() => import('./pages/CustomerDetails'));
const Employees       = lazy(() => import('./pages/Employees'));
const Reports         = lazy(() => import('./pages/Reports'));
const StoreSettings   = lazy(() => import('./pages/StoreSettings'));
const Blog            = lazy(() => import('./pages/Blog'));
const Notifications   = lazy(() => import('./pages/Notifications'));
const ActivityLog     = lazy(() => import('./pages/ActivityLog'));
const Reviews         = lazy(() => import('./pages/Reviews'));
const AbandonedCarts  = lazy(() => import('./pages/AbandonedCarts'));
const AddOrder        = lazy(() => import('./pages/AddOrder'));
const PurchaseOrders  = lazy(() => import('./pages/PurchaseOrders'));
const GeoAnalytics    = lazy(() => import('./pages/GeoAnalytics'));
const InventoryAnalytics = lazy(() => import('./pages/InventoryAnalytics'));
const PeakHours       = lazy(() => import('./pages/PeakHours'));

// ── Pretina MUI Theme (unchanged — orange/navy/white) ─────────────
const theme = createTheme({
  palette: {
    primary:    { main: '#FF6B00', contrastText: '#fff' },
    secondary:  { main: '#1A1A2E' },
    background: { default: '#F5F5F5', paper: '#FFFFFF' },
  },
  typography: {
    fontFamily: 'Poppins, sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #FF6B00, #FF8C38)',
          '&:hover': { background: 'linear-gradient(135deg, #CC5500, #FF6B00)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { boxShadow: '0 2px 16px rgba(0,0,0,0.06)', borderRadius: 12 },
      },
    },
  },
});

// Remove simple ProtectedRoute

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={<ProtectedRoute><Layout /></ProtectedRoute>}
          >
            {/* ── Dashboard ── */}
            <Route index element={<Dashboard />} />

            {/* ── Orders ── */}
            <Route path="orders"           element={<ProtectedRoute permissions={['orders.view']}><Orders /></ProtectedRoute>} />
            <Route path="orders/:id"       element={<ProtectedRoute permissions={['orders.view']}><OrderDetail /></ProtectedRoute>} />
            <Route path="purchase-orders"  element={<ProtectedRoute permissions={['orders.view']}><PurchaseOrders /></ProtectedRoute>} />
            <Route path="abandoned-carts"  element={<ProtectedRoute permissions={['orders.view']}><AbandonedCarts /></ProtectedRoute>} />
            <Route path="add-order"        element={<ProtectedRoute permissions={['orders.view']}><AddOrder /></ProtectedRoute>} />

            {/* ── Invoices ── */}
            <Route path="invoices"         element={<ProtectedRoute permissions={['invoices.view']}><Invoices /></ProtectedRoute>} />

            {/* ── Catalog ── */}
            <Route path="products"         element={<ProtectedRoute permissions={['products.view']}><Products /></ProtectedRoute>} />
            <Route path="categories"       element={<ProtectedRoute permissions={['categories.view']}><Categories /></ProtectedRoute>} />
            <Route path="brands"           element={<ProtectedRoute permissions={['brands.view']}><Brands /></ProtectedRoute>} />
            <Route path="reviews"          element={<ProtectedRoute permissions={['reviews.view']}><Reviews /></ProtectedRoute>} />

            {/* ── Users ── */}
            <Route path="customers"        element={<ProtectedRoute permissions={['customers.view']}><Customers /></ProtectedRoute>} />
            <Route path="customers/:id"    element={<ProtectedRoute permissions={['customers.view']}><CustomerDetails /></ProtectedRoute>} />
            <Route path="users"            element={<ProtectedRoute permissions={['customers.view']}><Users /></ProtectedRoute>} />
            <Route path="employees"        element={<ProtectedRoute permissions={['employees.view']}><Employees /></ProtectedRoute>} />

            {/* ── Promotions ── */}
            <Route path="coupons"          element={<ProtectedRoute permissions={['coupons.view']}><Coupons /></ProtectedRoute>} />
            <Route path="banners"          element={<ProtectedRoute permissions={['banners.view']}><Banners /></ProtectedRoute>} />
            <Route path="alerts"           element={<ProtectedRoute permissions={['banners.view']}><Alerts /></ProtectedRoute>} />

            {/* ── Reports & Analytics ── */}
            <Route path="reports"          element={<ProtectedRoute permissions={['reports.view']}><Reports /></ProtectedRoute>} />
            <Route path="analytics/geo"    element={<ProtectedRoute permissions={['reports.view']}><GeoAnalytics /></ProtectedRoute>} />
            <Route path="analytics/inventory" element={<ProtectedRoute permissions={['reports.view']}><InventoryAnalytics /></ProtectedRoute>} />
            <Route path="analytics/peak-hours" element={<ProtectedRoute permissions={['reports.view']}><PeakHours /></ProtectedRoute>} />

            {/* ── Store ── */}
            <Route path="store-settings"   element={<ProtectedRoute permissions={['settings.view']}><StoreSettings /></ProtectedRoute>} />
            <Route path="blog"             element={<ProtectedRoute permissions={['blog.view']}><Blog /></ProtectedRoute>} />
            <Route path="notifications"    element={<ProtectedRoute permissions={['settings.view']}><Notifications /></ProtectedRoute>} />

            {/* ── Other ── */}
            <Route path="activity-log"     element={<ProtectedRoute permissions={['activity.view']}><ActivityLog /></ProtectedRoute>} />
            <Route path="settings"         element={<ProtectedRoute permissions={['settings.view']}><Settings /></ProtectedRoute>} />
            <Route path="payments"         element={<ProtectedRoute permissions={['settings.view']}><Payments /></ProtectedRoute>} />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
