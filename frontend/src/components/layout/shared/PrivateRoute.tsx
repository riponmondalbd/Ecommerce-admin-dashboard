import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

interface PrivateRouteProps {
  children: React.ReactElement;
  requiredPermission?: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredPermission = '' }) => {
  const { user, isLoading, logout } = useAuth();
  const location = useLocation();

  // Check authentication status
  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    // Save the requested URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a permission is required, check it
  if (requiredPermission && !user.permissions.includes(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;