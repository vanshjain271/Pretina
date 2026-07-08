import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ permissions, children }) {
  const { user, token } = useSelector(state => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isEmployee = user?.role === 'EMPLOYEE';
  const userPermissions = user?.permissions || [];

  if (isEmployee && permissions && permissions.length > 0) {
    const hasPermission = permissions.some(p => userPermissions.includes(p));
    
    if (!hasPermission) {
      // If user lacks permission, redirect them to dashboard
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
