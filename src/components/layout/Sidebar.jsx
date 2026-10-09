import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Factory, Layers, Video, ShieldAlert, Shield, User, X, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const role = normalizeRole(user?.role);
  const basePath = getRolePath(role);

  const allMenuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      path: basePath,
      icon: <LayoutDashboard className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'manager', 'operator'],
    },
    {
      id: 'qr-entry',
      label: 'QR Code Employee Entry',
      path: `${basePath}/qr-entry`,
      icon: <QrCode className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'manager', 'operator'],
    },
    {
      id: 'users',
      label: 'User Management',
      path: `${basePath}/users`,
      icon: <Users className="w-4 h-4" />,
      roles: ['super_admin', 'admin'],
    },
    {
      id: 'plants',
      label: 'Plant Overview',
      path: `${basePath}/plants`,
      icon: <Factory className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'manager', 'operator'],
    },
    {
      id: 'zones',
      label: 'Zone Operations',
      path: `${basePath}/zones`,
      icon: <Layers className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'manager', 'operator'],
    },
    {
      id: 'cameras',
      label: 'Camera Streams',
      path: `${basePath}/cameras`,
      icon: <Video className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'manager', 'operator'],
    },
    {
      id: 'activity',
      label: 'Audit & Incident Logs',
      path: `${basePath}/activity`,
      icon: <ShieldAlert className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'manager', 'operator'],
    },
    {
      id: 'profile',
      label: 'My Profile',
      path: `${basePath}/profile`,
      icon: <User className="w-4 h-4" />,
      roles: ['super_admin', 'admin', 'manager', 'operator'],
    },
  ];

  const menuItems = allMenuItems.filter((item) => item.roles.includes(role));

  const handleItemClick = (path) => {
    navigate(path);
    if (onCloseMobile) onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base text-slate-900 tracking-tight leading-none">SafeOps AI</h1>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Enterprise Platform</p>
          </div>
        </div>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Badge Container */}
      <div className="p-3.5 mx-3 my-3 bg-slate-50 border border-slate-200/80 rounded-xl">
        <div className="text-[10px] text-slate-500 mb-1 font-semibold uppercase tracking-wider">Current Access Role:</div>
        <StatusBadge type="role" value={role} />
        {user?.plant && (
          <div className="text-xs text-slate-600 mt-2 truncate">
            Plant: <span className="text-slate-900 font-medium">{user.plant.name}</span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">
          Navigation
        </div>
        {menuItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.id !== 'dashboard' && location.pathname.startsWith(`${item.path}`));
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border-r-2 border-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span className={isActive ? 'text-indigo-600' : 'text-slate-400'}>{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-200/80 text-[11px] text-slate-400 text-center">
        SafeOps Security Platform v2.4
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block sticky top-0 h-screen shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
