import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, Shield, Factory, Activity, Eye } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { normalizeRole, getRolePath, getRoleName, ROLE_CONFIG } from '../../utils/roleUtils.js';

export const LoginForm = ({ forcedRole = null }) => {
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const params = useParams();

  const routeRole = params.role ? normalizeRole(params.role) : forcedRole ? normalizeRole(forcedRole) : null;
  const [selectedRole, setSelectedRole] = useState(routeRole || 'super_admin');

  useEffect(() => {
    if (routeRole) {
      setSelectedRole(routeRole);
    }
  }, [routeRole]);

  useEffect(() => {
    if (user) {
      const dest = getRolePath(user.role);
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  const roleConfig = ROLE_CONFIG[selectedRole] || ROLE_CONFIG.super_admin;

  const [email, setEmail] = useState(roleConfig.defaultEmail);
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    const cfg = ROLE_CONFIG[roleKey];
    if (cfg) {
      setEmail(cfg.defaultEmail);
      setPassword('Password123!');
      setError(null);
      navigate(`/login/${roleKey.replace('_', '-')}`, { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const loggedUser = await login(email, password);
      const userObj = loggedUser || user;
      addToast(`Welcome back! Logged in successfully.`, 'success');

      const authenticatedRole = normalizeRole(userObj?.role || 'operator');
      const targetPath = getRolePath(authenticatedRole);

      if (selectedRole && authenticatedRole !== selectedRole) {
        addToast(
          `Logged in as ${getRoleName(authenticatedRole)}. Redirecting to your authorized ${getRoleName(authenticatedRole)} dashboard.`,
          'info'
        );
      }

      navigate(targetPath, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Login failed. Check credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, roleKey) => {
    setSelectedRole(roleKey);
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  const getRoleIcon = (roleKey) => {
    switch (roleKey) {
      case 'super_admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'admin':
        return <Factory className="w-4 h-4 text-indigo-600" />;
      case 'manager':
        return <Activity className="w-4 h-4 text-blue-600" />;
      case 'operator':
        return <Eye className="w-4 h-4 text-slate-600" />;
      default:
        return <Shield className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 rounded-xl bg-indigo-600 text-white shadow-sm mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            SafeOps Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Enterprise Access & Infrastructure Security Portal</p>
        </div>

        {/* Role Navigation Tabs */}
        <div className="bg-slate-200/60 p-1 rounded-xl mb-6 grid grid-cols-2 sm:grid-cols-4 gap-1">
          {Object.values(ROLE_CONFIG).map((cfg) => {
            const isActive = selectedRole === cfg.id;
            return (
              <button
                key={cfg.id}
                type="button"
                onClick={() => handleRoleSelect(cfg.id)}
                className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <div className="mb-1">{getRoleIcon(cfg.id)}</div>
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0">
              {getRoleIcon(selectedRole)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>{roleConfig.name} Portal</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{roleConfig.description}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@safeops.io"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isLoading ? 'Authenticating...' : `Sign In as ${roleConfig.name}`}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Preset Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-2.5">Demo Presets:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(ROLE_CONFIG).map((cfg) => (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => fillQuickDemo(cfg.defaultEmail, cfg.id)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-left border transition ${
                    selectedRole === cfg.id
                      ? 'bg-indigo-50/60 border-indigo-200 text-slate-900'
                      : 'bg-slate-50/60 border-slate-200/80 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate">
                    <div className="text-xs font-semibold truncate text-slate-800">{cfg.defaultEmail}</div>
                    <div className="text-[10px] text-indigo-600 font-medium">{cfg.name}</div>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${selectedRole === cfg.id ? 'text-indigo-600' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
