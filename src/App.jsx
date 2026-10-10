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
import { PlantDetails } from './components/plants/PlantDetails.jsx';
import { ZoneList } from './components/zones/ZoneList.jsx';
import { ZoneDetails } from './components/zones/ZoneDetails.jsx';
import { CameraList } from './components/cameras/CameraList.jsx';
import { AuditLogs } from './components/dashboard/AuditLogs.jsx';
import { ProfilePage } from './components/profile/ProfilePage.jsx';
import { QREntryPage } from './components/attendance/QREntryPage.jsx';
import { normalizeRole, getRolePath } from './utils/roleUtils.js';

import { SafetyRulesPage } from './components/rules/SafetyRulesPage.jsx';
import { CameraRegionEditor } from './components/regions/CameraRegionEditor.jsx';
import { VideoUploadProcessingPage } from './components/videos/VideoUploadProcessingPage.jsx';
import { DetectionEventsPage } from './components/events/DetectionEventsPage.jsx';
import { IncidentReviewDashboard } from './components/incidents/IncidentReviewDashboard.jsx';

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
      {/* Root Landing Page & Login Routes */}
      <Route path="/" element={<LoginForm />} />
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
        path="/super-admin/plants/:id"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <PlantDetails />
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
        path="/super-admin/zones/:id"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <ZoneDetails />
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
      <Route
        path="/super-admin/safety-rules"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SafetyRulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/camera-regions"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <CameraRegionEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/video-processing"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <VideoUploadProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/detection-events"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <DetectionEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/incidents"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <IncidentReviewDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/qr-entry"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <QREntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/super-admin/profile"
        element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <ProfilePage />
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
        path="/admin/plants"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlantList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/plants/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <PlantDetails />
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
        path="/admin/zones/:id"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ZoneDetails />
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
      <Route
        path="/admin/safety-rules"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <SafetyRulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/camera-regions"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CameraRegionEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/video-processing"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VideoUploadProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/detection-events"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DetectionEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/incidents"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <IncidentReviewDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/qr-entry"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <QREntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ProfilePage />
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
        path="/plant-manager/plants"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <PlantList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/plants/:id"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <PlantDetails />
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
        path="/plant-manager/zones/:id"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <ZoneDetails />
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
      <Route
        path="/plant-manager/safety-rules"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <SafetyRulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/camera-regions"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <CameraRegionEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/video-processing"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <VideoUploadProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/detection-events"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <DetectionEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/incidents"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <IncidentReviewDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/qr-entry"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <QREntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plant-manager/profile"
        element={
          <ProtectedRoute allowedRoles={['manager', 'plant_manager']}>
            <ProfilePage />
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
        path="/operator/plants"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <PlantList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/plants/:id"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <PlantDetails />
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
        path="/operator/zones/:id"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <ZoneDetails />
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
      <Route
        path="/operator/safety-rules"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <SafetyRulesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/camera-regions"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <CameraRegionEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/video-processing"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <VideoUploadProcessingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/detection-events"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <DetectionEventsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/incidents"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <IncidentReviewDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/qr-entry"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <QREntryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/operator/profile"
        element={
          <ProtectedRoute allowedRoles={['operator']}>
            <ProfilePage />
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
