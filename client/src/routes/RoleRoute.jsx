import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const RoleRoute = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.globalRole)) {
    // Redirect to user's appropriate home base
    const roleRoutes = {
      SUPER_ADMIN: '/super-admin',
      COLLEGE_ADMIN: '/admin',
      FACULTY: '/faculty',
      REVIEWER: '/reviewer',
      STUDENT: '/dashboard'
    };

    return <Navigate to={roleRoutes[user.globalRole] || '/dashboard'} replace />;
  }

  return children;
};

