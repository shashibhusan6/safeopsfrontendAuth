import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { plantsApi } from '../../api/plantsApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { usersApi } from '../../api/usersApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Factory, Layers, Video, Users, ShieldCheck, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

export const DashboardOverview = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    plants: 0,
    zones: 0,
    cameras: 0,
    users: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setIsLoading(true);
      try {
        const [p, z, c, u] = await Promise.all([
          plantsApi.getPlants(1, 1),
          zonesApi.getAllZones(1, 1),
          camerasApi.getAllCameras(1, 1),
          usersApi.getUsers(1, 1),
        ]);
        setStats({
          plants: p.pagination.total,
          zones: z.pagination.total,
          cameras: c.pagination.total,
          users: u.pagination.total,
        });
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-8 shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-cyan-400" /> SafeOps Engine Operational
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Real-time industrial plant security, RBAC user authorization, zone hazard scheduling, and automated AI camera status monitoring.
          </p>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div
          onClick={() => onNavigate('plants')}
          className="p-6 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl shadow-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Industrial Plants</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition">
              <Factory className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-3">{isLoading ? '...' : stats.plants}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            View facilities network <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('zones')}
          className="p-6 bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl shadow-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hazard Zones</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-3">{isLoading ? '...' : stats.zones}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            View perimeters <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('cameras')}
          className="p-6 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl shadow-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Camera Streams</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition">
              <Video className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-3">{isLoading ? '...' : stats.cameras}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            View feeds matrix <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => onNavigate('users')}
          className="p-6 bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 rounded-2xl shadow-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Users</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-100 mt-3">{isLoading ? '...' : stats.users}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            Manage RBAC <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Permissions Matrix Reference Table */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Role Permissions & Validation Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enforced across backend routes and client controls
            </p>
          </div>
          <StatusBadge type="role" value={user?.role || 'operator'} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Scope</th>
                <th className="py-3 px-4">Create / Edit Plants</th>
                <th className="py-3 px-4">Zones & Cameras</th>
                <th className="py-3 px-4">Invite / Manage Users</th>
                <th className="py-3 px-4">Status Toggle Rules</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-purple-300">super_admin</td>
                <td className="py-3 px-4 text-slate-400">Platform Level</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold"><CheckCircle2 className="w-4 h-4 inline mr-1" /> Full</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold"><CheckCircle2 className="w-4 h-4 inline mr-1" /> Full</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold"><CheckCircle2 className="w-4 h-4 inline mr-1" /> All Roles (incl. Unassigned Admins)</td>
                <td className="py-3 px-4 text-slate-300">Full control (cannot disable last super_admin)</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-indigo-300">admin</td>
                <td className="py-3 px-4 text-slate-400">Plant Level</td>
                <td className="py-3 px-4 text-rose-400 font-semibold"><XCircle className="w-4 h-4 inline mr-1" /> Blocked</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold"><CheckCircle2 className="w-4 h-4 inline mr-1" /> Own Plant Only</td>
                <td className="py-3 px-4 text-emerald-400 font-semibold"><CheckCircle2 className="w-4 h-4 inline mr-1" /> Manager & Operator in assigned plant</td>
                <td className="py-3 px-4 text-slate-300">Toggle assigned plant zones & cameras</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-blue-300">manager</td>
                <td className="py-3 px-4 text-slate-400">Plant Level</td>
                <td className="py-3 px-4 text-rose-400 font-semibold"><XCircle className="w-4 h-4 inline mr-1" /> Read-Only</td>
                <td className="py-3 px-4 text-slate-300 font-semibold">Read-Only Monitoring</td>
                <td className="py-3 px-4 text-rose-400 font-semibold"><XCircle className="w-4 h-4 inline mr-1" /> None</td>
                <td className="py-3 px-4 text-slate-300">Read-Only structural access</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-4 font-bold text-slate-400">operator</td>
                <td className="py-3 px-4 text-slate-400">Plant Level</td>
                <td className="py-3 px-4 text-rose-400 font-semibold"><XCircle className="w-4 h-4 inline mr-1" /> 403 Forbidden</td>
                <td className="py-3 px-4 text-rose-400 font-semibold"><XCircle className="w-4 h-4 inline mr-1" /> 403 Forbidden</td>
                <td className="py-3 px-4 text-rose-400 font-semibold"><XCircle className="w-4 h-4 inline mr-1" /> 403 Forbidden</td>
                <td className="py-3 px-4 text-rose-400 font-semibold">Strictly Read-Only (403 Forbidden)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
