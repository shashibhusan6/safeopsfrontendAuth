import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Layout } from '../layout/Layout.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';

export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold text-slate-400">Authenticating Security Context...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const userRole = normalizeRole(user.role);
  const isAllowed = !allowedRoles || allowedRoles.map(normalizeRole).includes(userRole);

  if (!isAllowed) {
    const assignedPath = getRolePath(userRole);
    return <Navigate to={assignedPath} replace />;
  }

  return <Layout>{children}</Layout>;
};
