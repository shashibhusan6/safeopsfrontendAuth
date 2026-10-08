import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { getRolePath } from '../../utils/roleUtils.js';
import { ShieldCheck, Factory, Layers, Video, Lock, ArrowRight, LogIn, CheckCircle2 } from 'lucide-react';

export const HomePage = () => {
  const { user } = useAuth();
  const dashboardPath = user ? getRolePath(user.role) : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header / Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-base tracking-tight">SafeOps</span>
              <span className="text-xs text-slate-500 block -mt-1 font-medium">Safety & Auth System</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to={dashboardPath}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-xs transition flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm shadow-xs transition flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Sign In / Login
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-6">
          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
          Enterprise Industrial Safety Platform
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Centralized Facility Safety & Operational Authorization
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl font-normal leading-relaxed">
          SafeOps connects multi-plant facilities, hazardous operational zones, and AI vision camera streams with strict, role-based access control.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          {user ? (
            <Link
              to={dashboardPath}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-base shadow-xs transition flex items-center justify-center gap-2"
            >
              Open Your Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-base shadow-xs transition flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              Access Platform Login
            </Link>
          )}
        </div>

        {/* Data & Platform Overview */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left w-full">
          <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <Factory className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">Multi-Plant Management</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track global industrial facilities, active operations, and assigned administrative teams in real time.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">Hazard Zone Sectors</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Define perimeter hazard levels, operating shift schedules, and safety severity classifications.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <Video className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">AI Camera Matrix</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Monitor optical feeds, RTSP stream protocols, live status heartbeats, and safety alerts.
            </p>
          </div>

          <div className="bg-white border border-slate-200/80 p-6 rounded-xl shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-900 text-base mb-1">Strict Role Security</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Isolated workspace authorization for Super Admin, Admin, Plant Manager, and Operator.
            </p>
          </div>
        </div>

        {/* Live System Stats Summary */}
        <div className="mt-12 bg-white border border-slate-200/80 rounded-xl p-6 w-full shadow-xs grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center border-r border-slate-100 last:border-0">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">4 Tier</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">RBAC Roles</div>
          </div>
          <div className="text-center border-r border-slate-100 last:border-0">
            <div className="text-2xl sm:text-3xl font-bold text-indigo-600">100%</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Route Isolation</div>
          </div>
          <div className="text-center border-r border-slate-100 last:border-0">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">24 / 7</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">Surveillance Desk</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">Active</div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">System Readiness</div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-white border-t border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} SafeOps Auth Platform. All rights reserved. Industrial Safety & Authorization Control.
        </div>
      </footer>
    </div>
  );
};
