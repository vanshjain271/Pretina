import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import { useSelector } from 'react-redux';
import Layout from './components/Layout';
import LoadingScreen from './components/LoadingScreen';

// Lazy-loaded pages
const Login       = lazy(() => import('./pages/Login'));
const Dashboard   = lazy(() => import('./pages/Dashboard'));
const Products    = lazy(() => import('./pages/Products'));
const Categories  = lazy(() => import('./pages/Categories'));
const Brands      = lazy(() => import('./pages/Brands'));
const Orders      = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Banners     = lazy(() => import('./pages/Banners'));
const Alerts      = lazy(() => import('./pages/Alerts'));
const Coupons     = lazy(() => import('./pages/Coupons'));
const Users       = lazy(() => import('./pages/Users'));
const Settings    = lazy(() => import('./pages/Settings'));
const Payments    = lazy(() => import('./pages/Payments'));

// MUI theme — Pretina brand
const theme = createTheme({
  palette: {
    primary: { main: '#FF6B00', contrastText: '#fff' },
    secondary: { main: '#1A1A2E' },
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

// Protected route wrapper
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
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="brands" element={<Brands />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="banners" element={<Banners />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="coupons" element={<Coupons />} />
            <Route path="payments" element={<Payments />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ThemeProvider>
  );
}
