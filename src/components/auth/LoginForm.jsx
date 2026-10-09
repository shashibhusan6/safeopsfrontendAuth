import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone, Smartphone, ArrowRight, Shield, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getRolePath } from '../../utils/roleUtils.js';

export const LoginForm = () => {
  const { login, user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [loginType, setLoginType] = useState('email'); // 'email' | 'phone'
  const [email, setEmail] = useState('superadmin@safeops.io');
  const [phone, setPhone] = useState('+1 (555) 100-0001');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-redirect if user is already logged in
  useEffect(() => {
    if (user) {
      const dest = getRolePath(user.role);
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const identifier = loginType === 'email' ? email.trim() : phone.trim();
    if (!identifier || !password) {
      setError(`Please enter both your ${loginType === 'email' ? 'email address' : 'phone number'} and password.`);
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      // 1. Authenticate against database or mock engine
      await login(identifier, password);
      addToast('Authenticated successfully. Redirecting to your assigned dashboard...', 'success');
    } catch (err) {
      const msg = err?.response?.data?.error || err.message || 'Invalid credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (acc) => {
    setEmail(acc.email);
    setPhone(acc.phone);
    setPassword('Password123!');
    setError(null);
  };

  const demoAccounts = [
    {
      name: 'Eleanor Vance',
      email: 'superadmin@safeops.io',
      phone: '+1 (555) 100-0001',
      roleLabel: 'Super Admin',
      assignment: 'Plant 1 (Delta Hydrocarbon)',
      color: 'border-purple-200 bg-purple-50/50 text-purple-900',
      badge: 'bg-purple-100 text-purple-700',
    },
    {
      name: 'Victor Vance',
      email: 'superadmin2@safeops.io',
      phone: '+1 (555) 100-0002',
      roleLabel: 'Super Admin',
      assignment: 'Plant 2 (Apex Chemical)',
      color: 'border-purple-200 bg-purple-50/50 text-purple-900',
      badge: 'bg-purple-100 text-purple-700',
    },
    {
      name: 'Marcus Brody',
      email: 'marcus.brody@alpha-energy.com',
      phone: '+1 (555) 200-0001',
      roleLabel: 'Plant Admin',
      assignment: 'Plant 1 (Delta Hydrocarbon)',
      color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900',
      badge: 'bg-indigo-100 text-indigo-700',
    },
    {
      name: 'Sarah Connor',
      email: 'sarah.c@alpha-energy.com',
      phone: '+1 (555) 300-0001',
      roleLabel: 'Plant Manager',
      assignment: 'Plant 1 (Delta Hydrocarbon)',
      color: 'border-blue-200 bg-blue-50/50 text-blue-900',
      badge: 'bg-blue-100 text-blue-700',
    },
    {
      name: 'Dave Bowman',
      email: 'dave.b@alpha-energy.com',
      phone: '+1 (555) 400-0001',
      roleLabel: 'Operator',
      assignment: 'Plant 1 (Delta Hydrocarbon)',
      color: 'border-slate-200 bg-slate-50/50 text-slate-900',
      badge: 'bg-slate-200 text-slate-700',
    },
    {
      name: 'Unassigned Admin',
      email: 'unassigned.sa@safeops.io',
      phone: '+1 (555) 100-0003',
      roleLabel: 'Super Admin',
      assignment: 'Unassigned Account (No Plant)',
      color: 'border-amber-200 bg-amber-50/50 text-amber-900',
      badge: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md sm:max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-sm mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            SafeOps System Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Sign in to access your authorized facility dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          {/* Method Selection Tabs */}
          <div className="mb-5 p-1 bg-slate-100 rounded-xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginType('email');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                loginType === 'email'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email & Password</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setLoginType('phone');
                setError(null);
              }}
              className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                loginType === 'phone'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone & Password</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {loginType === 'email' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@safeops.io"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Phone Number
                </label>
                <div className="relative">
                  <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 100-0001"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 cursor-pointer"
            >
              {isLoading ? 'Authenticating Credentials...' : 'Sign In'}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Quick Preset Accounts for Testing */}
          <div className="mt-8 pt-6 border-t border-slate-200/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600" /> System Test Accounts
              </span>
              <span className="text-[11px] text-slate-400">Click to fill credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((acc) => {
                const isSelected =
                  loginType === 'email'
                    ? email.toLowerCase() === acc.email.toLowerCase()
                    : phone.replace(/[\s\-\(\)\+]/g, '') === acc.phone.replace(/[\s\-\(\)\+]/g, '');

                return (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handlePresetSelect(acc)}
                    className={`p-3 rounded-xl border text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? `${acc.color} ring-2 ring-indigo-600/30`
                        : 'bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-xs font-bold truncate text-slate-900">{acc.name}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${acc.badge}`}>
                          {acc.roleLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{acc.email}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{acc.phone}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-1">{acc.assignment}</div>
                    </div>
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-600' : 'text-slate-300'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

