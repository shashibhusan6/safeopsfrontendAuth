import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';
import { ToastContainer } from '../common/Toast.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { normalizeRole } from '../../utils/roleUtils.js';
import { AlertTriangle } from 'lucide-react';

export const Layout = ({ children }) => {
  const { user } = useAuth();
  const role = normalizeRole(user?.role);
  const isOperator = role === 'operator';
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      <Sidebar isMobileOpen={isMobileOpen} onCloseMobile={() => setIsMobileOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onMobileMenuToggle={() => setIsMobileOpen(true)} />

        {isOperator && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Operator Mode Active:</strong> You have read-only operational permissions. All mutation controls (create, edit, enable/disable status, delete) are locked.
              </span>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">{children}</main>
      </div>

      <ToastContainer />
    </div>
  );
};
