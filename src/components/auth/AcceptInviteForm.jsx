import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight } from 'lucide-react';
import { authApi } from '../../api/authApi.js';
import { useToast } from '../../context/ToastContext.jsx';

export const AcceptInviteForm = ({ onSuccess, initialToken = '' }) => {
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setError('Invitation token is required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await authApi.acceptInvite(token, password);
      addToast(res.message || 'Invitation accepted successfully!', 'success');
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to accept invitation token.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-900">Accept Account Invitation</h2>
          <p className="text-xs text-slate-500">Set your secure password to complete your account setup.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
            Invitation Token
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Paste your invite token..."
            className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
            New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-xs transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2"
        >
          {isLoading ? 'Activating Account...' : 'Set Password & Complete Setup'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
