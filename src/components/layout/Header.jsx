import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Radio, ShieldCheck, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { normalizeRole, getRoleName } from '../../utils/roleUtils.js';

export const Header = ({ onMobileMenuToggle }) => {
  const { user, logout, isMockMode, toggleMockMode } = useAuth();
  const navigate = useNavigate();
  const activeUserRole = normalizeRole(user?.role);
  const roleName = getRoleName(activeUserRole);

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

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleMockMode}
          title="Click to toggle between live backend API and Mock Mode Sandbox"
          className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            isMockMode
              ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isMockMode ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}`} />
          <span className="hidden sm:inline">{isMockMode ? 'Mock Sandbox Mode' : 'Connected to Backend'}</span>
          <span className="sm:hidden">{isMockMode ? 'Mock' : 'Live'}</span>
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-tight">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate max-w-[150px]">{user.email}</div>
            </div>
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
