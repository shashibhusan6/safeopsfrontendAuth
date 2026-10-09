import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck, Menu, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { normalizeRole, getRoleName, getRolePath } from '../../utils/roleUtils.js';

export const Header = ({ onMobileMenuToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const activeUserRole = normalizeRole(user?.role);
  const roleName = getRoleName(activeUserRole);
  const rolePath = getRolePath(activeUserRole);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          <span className="font-medium text-slate-500 hidden sm:inline">Role:</span>
          <span className="font-semibold text-slate-900">{roleName}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Prominent QR Code Employee Entry Button - Navigates to dedicated page */}
        <button
          onClick={() => navigate(`${rolePath}/qr-entry`)}
          title="Scan employee QR Code at plant entrance for automated entry check-in"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition shrink-0"
        >
          <QrCode className="w-4 h-4" />
          <span className="hidden sm:inline">QR Code Employee Entry</span>
          <span className="sm:hidden">QR Entry</span>
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <button
              onClick={() => navigate(`${rolePath}/profile`)}
              className="flex items-center gap-2.5 text-left p-1 rounded-xl hover:bg-slate-100 transition group"
              title="View & Manage Profile"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0 group-hover:bg-indigo-600 transition">
                {user.name.charAt(0)}
              </div>
              <div className="hidden lg:block">
                <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight group-hover:text-indigo-600 transition">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{user.email}</div>
              </div>
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
