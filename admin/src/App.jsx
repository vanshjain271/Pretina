import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

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

const ProtectedRoute = ({ children }) => {
  const token = useSelector(s => s.auth.token);
  return token ? children : <Navigate to="/login" replace />;
};

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
            <Route path="orders"           element={<Orders />} />
            <Route path="orders/:id"       element={<OrderDetail />} />
            <Route path="purchase-orders"  element={<PurchaseOrders />} />
            <Route path="abandoned-carts"  element={<AbandonedCarts />} />
            <Route path="add-order"        element={<AddOrder />} />

            {/* ── Invoices ── */}
            <Route path="invoices"         element={<Invoices />} />

            {/* ── Catalog ── */}
            <Route path="products"         element={<Products />} />
            <Route path="categories"       element={<Categories />} />
            <Route path="brands"           element={<Brands />} />
            <Route path="reviews"          element={<Reviews />} />

            {/* ── Customers ── */}
            <Route path="customers"        element={<Customers />} />
            <Route path="customers/:id"    element={<CustomerDetails />} />
            {/* Legacy /users alias */}
            <Route path="users"            element={<Navigate to="/customers" replace />} />

            {/* ── Employees ── */}
            <Route path="employees"        element={<Employees />} />

            {/* ── Promotions ── */}
            <Route path="coupons"          element={<Coupons />} />
            <Route path="banners"          element={<Banners />} />
            <Route path="alerts"           element={<Alerts />} />
            <Route path="payments"         element={<Payments />} />

            {/* ── Reports & Analytics ── */}
            <Route path="reports"          element={<Reports />} />
            <Route path="analytics/geo"    element={<GeoAnalytics />} />
            <Route path="analytics/inventory" element={<InventoryAnalytics />} />
            <Route path="analytics/peak-hours" element={<PeakHours />} />

            {/* ── Online Store ── */}
            <Route path="store-settings"   element={<StoreSettings />} />
            <Route path="settings"         element={<Navigate to="/store-settings" replace />} />
            <Route path="blog"             element={<Blog />} />
            <Route path="notifications"    element={<Notifications />} />

            {/* ── Activity Log ── */}
            <Route path="activity-log"     element={<ActivityLog />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
