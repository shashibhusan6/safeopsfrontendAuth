import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.jsx';
import { LoginForm } from './components/auth/LoginForm.jsx';
import { AcceptInviteForm } from './components/auth/AcceptInviteForm.jsx';

import { SuperAdminDashboard } from './components/dashboard/SuperAdminDashboard.jsx';
import { AdminDashboard } from './components/dashboard/AdminDashboard.jsx';
import { PlantManagerDashboard } from './components/dashboard/PlantManagerDashboard.jsx';
import { OperatorDashboard } from './components/dashboard/OperatorDashboard.jsx';

import { UserList } from './components/users/UserList.jsx';
import { PlantList } from './components/plants/PlantList.jsx';
import { ZoneList } from './components/zones/ZoneList.jsx';
import { CameraList } from './components/cameras/CameraList.jsx';
import { AuditLogs } from './components/dashboard/AuditLogs.jsx';
import { HomePage } from './components/home/HomePage.jsx';
import { normalizeRole, getRolePath } from './utils/roleUtils.js';

const AppContent = () => {
  const [inviteToken, setInviteToken] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tok = params.get('token') || params.get('invite');
    if (tok) {
      setInviteToken(tok);
    }
  }, []);

  if (inviteToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <AcceptInviteForm
            initialToken={inviteToken}
            onSuccess={() => {
              setInviteToken(null);
              window.history.replaceState({}, document.title, window.location.pathname);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Home Landing Page */}
      <Route path="/" element={<HomePage />} />

      {/* Role-Specific & General Login Routes */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/login/:role" element={<LoginForm />} />

      {/* Super Admin Routes */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/users"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <UserList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/plants"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <PlantList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/zones"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <ZoneList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/cameras"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <CameraList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/activity"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/zones"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ZoneList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/cameras"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CameraList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/activity"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* Plant Manager Routes */}
      <Route
        path="/plant-manager"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <PlantManagerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/zones"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <ZoneList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/cameras"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <CameraList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/activity"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* Operator Routes */}
      <Route
        path="/operator"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <OperatorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/cameras"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <CameraList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/zones"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <ZoneList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/activity"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <AuditLogs />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}
