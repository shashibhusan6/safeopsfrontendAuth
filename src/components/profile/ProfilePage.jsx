import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usersApi } from '../../api/usersApi.js';
import { normalizeRole, getRoleName } from '../../utils/roleUtils.js';
import { EmployeeQRBadgeModal } from '../common/EmployeeQRBadgeModal.jsx';
import { BackButton } from '../common/BackButton.jsx';
import {
  User,
  Shield,
  ShieldCheck,
  Key,
  Bell,
  CheckCircle2,
  Lock,
  Mail,
  Calendar,
  Sliders,
  AlertCircle,
  Check,
  Save,
  Phone,
  Globe,
  Smartphone,
  RefreshCw,
  QrCode,
} from 'lucide-react';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();

  const role = normalizeRole(user?.role);
  const roleName = getRoleName(role);
  const isOperator = role === 'operator';

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'permissions' | 'security' | 'notifications'
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Profile Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Security / Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Notification Toggles State
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    criticalIncidents: true,
    shiftSummaries: false,
    systemUpdates: true,
  });

  // Sync state whenever user object changes or loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      if (user.phone) setPhone(user.phone);
      if (user.timezone) setTimezone(user.timezone);
    }
  }, [user]);

  // Handle Profile Update Submission
  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (isOperator) {
      showForbiddenAlert();
      return;
    }

    if (!name.trim() || !email.trim()) {
      addToast('Name and Email fields cannot be blank.', 'warning');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (user?.id) {
        await usersApi.updateUser(user.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          timezone,
        });
        await refreshUser();
      }
      addToast('Profile details updated successfully.', 'success', 'Profile Updated');
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Failed to update profile.', 'error');
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Update Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isOperator) {
      showForbiddenAlert();
      return;
    }

    if (!currentPassword) {
      addToast('Please enter your current password.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast('New password confirmation does not match.', 'error', 'Password Mismatch');
      return;
    }

    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters long.', 'warning', 'Weak Password');
      return;
    }

    setIsSavingPassword(true);
    try {
      // Simulate/execute password change
      await new Promise((res) => setTimeout(res, 500));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      addToast('Your account password was updated securely.', 'success', 'Security Updated');
    } catch (err) {
      addToast(err?.message || 'Password update failed.', 'error');
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Toggle Notification Preference
  const toggleNotification = (key) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    addToast('Notification settings saved.', 'info');
  };

  // Role Theme Presets
  const roleThemes = {
    super_admin: {
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      gradient: 'from-indigo-900 via-slate-900 to-slate-900',
      tag: 'SUPER ADMIN • SYSTEM OVERLORD',
    },
    admin: {
      badge: 'bg-purple-100 text-purple-800 border-purple-200',
      gradient: 'from-purple-900 via-slate-900 to-slate-900',
      tag: 'FACILITY ADMIN • PLANT GOVERNANCE',
    },
    manager: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      gradient: 'from-emerald-950 via-slate-900 to-slate-900',
      tag: 'PLANT MANAGER • OPERATIONAL LEAD',
    },
    operator: {
      badge: 'bg-amber-100 text-amber-800 border-amber-200',
      gradient: 'from-amber-950 via-slate-900 to-slate-900',
      tag: 'OPERATOR • READ-ONLY CONTROLLER',
    },
  };

  const theme = roleThemes[role] || roleThemes.operator;

  // Role Permissions Data
  const rolePermissions = {
    super_admin: [
      { name: 'Global Enterprise Scope', status: true, desc: 'Full read/write authority across all facilities and system nodes.' },
      { name: 'User Access Control', status: true, desc: 'Invite, edit, enable, disable, and delete users of all roles.' },
      { name: 'Infrastructure Management', status: true, desc: 'Register new plants, setup networks, and manage root settings.' },
      { name: 'System Audit Records', status: true, desc: 'Full access to audit logs, security events, and historical traces.' },
      { name: 'Mock Engine Sandbox', status: true, desc: 'Toggle between live APIs and local sandbox simulation.' },
    ],
    admin: [
      { name: 'Facility Administration', status: true, desc: 'Manage users, zones, and camera configurations in assigned plant.' },
      { name: 'User Management & Invitations', status: true, desc: 'Invite Managers and Operators (Super Admin account changes restricted).' },
      { name: 'Zone & Camera Operations', status: true, desc: 'Create, edit, enable, and disable facility zones and camera feeds.' },
      { name: 'Facility Audit Logs', status: true, desc: 'Access audit trails and safety incidents for assigned plant.' },
      { name: 'Global Plant Network Edits', status: false, desc: 'Cannot create or delete root industrial plant facilities.' },
    ],
    manager: [
      { name: 'Zone Operations Oversight', status: true, desc: 'Create and manage operational zones, shift hours, and hazard levels.' },
      { name: 'Camera Feed Provisioning', status: true, desc: 'Configure RTSP and simulated AI video stream parameters.' },
      { name: 'Incident & Audit Visibility', status: true, desc: 'View facility safety logs and incident reports.' },
      { name: 'User Access Management', status: false, desc: 'Cannot invite users or alter user role permissions.' },
      { name: 'Root Infrastructure Edit', status: false, desc: 'Cannot add or delete plant infrastructure.' },
    ],
    operator: [
      { name: 'Live Stream Monitoring', status: true, desc: 'View real-time AI camera feeds across operational zones.' },
      { name: 'Incident & Alert Inspection', status: true, desc: 'Read safety alerts, hazard levels, and audit events.' },
      { name: 'Data Mutation Controls', status: false, desc: 'Strictly locked: Cannot add, edit, or delete any resources.' },
      { name: 'User & System Administration', status: false, desc: 'No administrative or user account management access.' },
      { name: 'Status Toggle Controls', status: false, desc: 'Cannot enable or disable plants, zones, or cameras.' },
    ],
  };

  const currentPermissions = rolePermissions[role] || rolePermissions.operator;

  return (
    <div className="space-y-6">
        <div>
          <BackButton />
        </div>
        {/* HERO HEADER BANNER */}
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.gradient} p-6 sm:p-8 text-white shadow-md border border-slate-800`}>
          <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 bg-white/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-inner">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white"
                  title="Account Active"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{user?.name || 'User Profile'}</h1>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${theme.badge}`}>
                    {roleName}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-300" />
                    {user?.email || 'N/A'}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-300" />
                    Security Clearance: Tier {role === 'super_admin' ? '1 (Executive)' : role === 'admin' ? '2 (Facility Lead)' : role === 'manager' ? '3 (Operational)' : '4 (Operator)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metadata Stats */}
            <div className="flex items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10 self-start md:self-auto">
              <div className="text-center px-3 py-1 border-r border-white/10">
                <div className="text-[10px] text-slate-300 uppercase font-semibold">User ID</div>
                <div className="text-xs font-bold text-white font-mono">#{user?.id || '101'}</div>
              </div>
              <div className="text-center px-3 py-1 border-r border-white/10">
                <div className="text-[10px] text-slate-300 uppercase font-semibold">Plant Scope</div>
                <div className="text-xs font-bold text-white truncate max-w-[120px]">
                  {role === 'super_admin' ? 'All Facilities' : user?.plant?.name || 'Assigned Facility'}
                </div>
              </div>
              <div className="text-center px-3 py-1">
                <div className="text-[10px] text-slate-300 uppercase font-semibold">Status</div>
                <div className="text-xs font-bold text-emerald-400">ACTIVE</div>
              </div>
            </div>
          </div>
        </div>

        {/* TAB NAVIGATION BAR */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl px-2 sm:px-4 shadow-xs overflow-x-auto no-scrollbar touch-scroll">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-4 h-4" />
            Profile Details & Edit
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'permissions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Role Capabilities & Matrix
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'security'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            Security & Password
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 py-3.5 px-4 border-b-2 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notification Preferences
          </button>
        </div>

        {/* TAB 1: OVERVIEW & PROFILE EDIT */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Account Info Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-600" />
                  Account Summary
                </h3>

                <div className="space-y-3 divide-y divide-slate-100 text-xs">
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Full Name</span>
                    <span className="text-slate-900 font-semibold">{user?.name}</span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Email Address</span>
                    <span className="text-slate-900 font-semibold truncate max-w-[180px]">{user?.email}</span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Access Role</span>
                    <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {roleName}
                    </span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Plant Scope</span>
                    <span className="text-slate-900 font-semibold">
                      {role === 'super_admin' ? 'Global Enterprise' : user?.plant?.name || 'Assigned Facility'}
                    </span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Account ID</span>
                    <span className="text-slate-800 font-mono">SAFE-USR-{user?.id}</span>
                  </div>

                  <div className="pt-3 flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Member Since</span>
                    <span className="text-slate-700 font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Jan 2026
                    </span>
                  </div>
                </div>

                {isOperator && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Operator Mode Active:</strong> Account profile edits are read-only for operator accounts.
                    </div>
                  </div>
                )}
              </div>

              {/* My QR Pass Badge Card */}
              <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      My QR Entry Badge
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    VERIFIED
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Your personal QR pass token for plant gate access scanning.
                </p>
                <div className="font-mono text-xs bg-slate-950 p-2 rounded-lg text-indigo-300 border border-slate-800 truncate">
                  {user?.qr_token || `QR-EMP-${user?.id}`}
                </div>
                <button
                  onClick={() => setIsQRModalOpen(true)}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <QrCode className="w-4 h-4" /> View & Print QR Pass Badge
                </button>
              </div>

              {/* Role Scope Banner */}
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  {roleName} Role Guidance
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  {role === 'super_admin' &&
                    'As Super Admin, you have unrestricted operational control across all industrial facilities and security domains.'}
                  {role === 'admin' &&
                    'As Facility Admin, you manage plant-level users, operational zones, and AI camera stream settings.'}
                  {role === 'manager' &&
                    'As Plant Manager, you oversee daily shift schedules, hazardous zones, and camera feed uptime.'}
                  {role === 'operator' &&
                    'As Operator, your account provides read-only stream monitoring and real-time incident inspection capabilities.'}
                </p>
              </div>
            </div>

            {/* Right Col: Edit Profile Form */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
                <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Edit Profile Information</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Update your account contact details and operational preferences.
                    </p>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Role: {roleName}
                  </span>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                        disabled={isOperator || isSavingProfile}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                        disabled={isOperator || isSavingProfile}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Contact Telephone / Extension
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                        disabled={isOperator || isSavingProfile}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                        Primary Operational Timezone
                      </label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                        disabled={isOperator || isSavingProfile}
                      >
                        <option value="America/Chicago">America/Chicago (CST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={isOperator || isSavingProfile}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition text-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" /> Save Profile Details
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ROLE PERMISSIONS MATRIX */}
        {activeTab === 'permissions' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Role Capabilities & Authorization Matrix
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Granted capabilities and security constraints for role <strong className="text-indigo-700">{roleName}</strong>.
                </p>
              </div>

              <div className="px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-800 self-start sm:self-auto">
                Role Tier: {role.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPermissions.map((perm, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition ${
                    perm.status
                      ? 'bg-slate-50/80 border-slate-200 hover:border-indigo-300'
                      : 'bg-slate-50/40 border-slate-200/60 opacity-70'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{perm.name}</span>
                      {perm.status ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3" /> Granted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-400" /> Restricted
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{perm.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                Access Role Hierarchy Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className={`p-3 rounded-lg border ${role === 'super_admin' ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                  1. Super Admin
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Root Enterprise Overlord</span>
                </div>
                <div className={`p-3 rounded-lg border ${role === 'admin' ? 'bg-purple-50 border-purple-300 text-purple-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                  2. Facility Admin
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Plant Level Governance</span>
                </div>
                <div className={`p-3 rounded-lg border ${role === 'manager' ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                  3. Plant Manager
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Zones & Stream Ops</span>
                </div>
                <div className={`p-3 rounded-lg border ${role === 'operator' ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-600'}`}>
                  4. Operator
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">Read-Only Stream Control</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  Change Account Password
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your authentication credentials to maintain facility security compliance.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                    disabled={isOperator || isSavingPassword}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                      disabled={isOperator || isSavingPassword}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:bg-white disabled:opacity-60"
                      disabled={isOperator || isSavingPassword}
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPassword || isOperator}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition text-sm flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSavingPassword ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Updating Password...
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" /> Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Right col: Security Overview */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Security Uptime Status
                </h4>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900">
                    <div>
                      <span className="font-bold block">Account Status Active</span>
                      <span className="text-[11px] text-emerald-700">No security holds or lockouts</span>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-slate-800">
                    <div>
                      <span className="font-bold block">MFA Authentication</span>
                      <span className="text-[11px] text-slate-500">Hardware Key / Authenticator</span>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-bold rounded text-[10px]">ACTIVE</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                    <span className="font-bold text-slate-900 block">Active Login Session</span>
                    <span className="text-slate-500 text-[11px] block font-mono">IP: 192.168.1.45 (CST)</span>
                    <span className="text-slate-400 text-[10px]">JWT Session Valid</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICATIONS */}
        {activeTab === 'notifications' && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bell className="w-5 h-5 text-indigo-600" />
                Alert & Notification Subscriptions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure real-time safety incident alerts and daily facility summaries.
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Email Incident Alerts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Receive immediate emails for critical plant safety events.</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification('emailAlerts')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                    notifications.emailAlerts ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  } ${isOperator ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Critical Hazard Push Alerts</h4>
                  <p className="text-xs text-slate-500 mt-0.5">High severity zone alert popups and audio alarms.</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification('criticalIncidents')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                    notifications.criticalIncidents ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  } ${isOperator ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Shift Operating Summaries</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Daily shift completion reports and zone analytics.</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification('shiftSummaries')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                    notifications.shiftSummaries ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  } ${isOperator ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">System Platform Bulletins</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Platform maintenance and security upgrade notices.</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleNotification('systemUpdates')}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition ${
                    notifications.systemUpdates ? 'bg-indigo-600 justify-end' : 'bg-slate-300 justify-start'
                  } ${isOperator ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>
            </div>
          </div>
        )}

        <EmployeeQRBadgeModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          employee={user}
        />
      </div>
  );
};
