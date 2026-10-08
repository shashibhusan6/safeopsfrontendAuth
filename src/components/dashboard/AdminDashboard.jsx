import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { usersApi } from '../../api/usersApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Users, Layers, Video, ShieldCheck, ArrowRight, UserPlus } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ users: 0, zones: 0, cameras: 0 });
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [uRes, zRes, cRes] = await Promise.all([
          usersApi.getUsers(1, 10),
          zonesApi.getAllZones(1, 10),
          camerasApi.getAllCameras(1, 10),
        ]);
        setStats({
          users: uRes.pagination?.total || uRes.data?.length || 0,
          zones: zRes.pagination?.total || zRes.data?.length || 0,
          cameras: cRes.pagination?.total || cRes.data?.length || 0,
        });
        setTeamMembers(uRes.data || []);
      } catch (err) {
        console.error('Failed to fetch Admin stats', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const plantName = user?.plant?.name || (user?.plant_id ? `Plant Facility #${user.plant_id}` : 'Assigned Plant');

  return (
    <div className="space-y-6">
      {/* Admin Hero Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Plant Admin Command Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {plantName} Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Logged in as <span className="font-semibold text-slate-900">{user?.name}</span> ({user?.email}). Authorized to manage plant team members (Managers & Operators), safety zones, and AI camera streams for this facility.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/admin/users')}
          className="p-5 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plant Staff & Team</span>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : stats.users}</div>
          <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1 font-medium">
            Manage Managers & Operators <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/zones')}
          className="p-5 bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plant Hazard Zones</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : stats.zones}</div>
          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
            View & Manage Zones <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/admin/cameras')}
          className="p-5 bg-white border border-slate-200/80 hover:border-teal-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Camera Feeds</span>
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : stats.cameras}</div>
          <div className="text-xs text-teal-600 mt-1 flex items-center gap-1 font-medium">
            Monitor Stream Feeds <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              Plant Team Roster & RBAC Status
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned personnel for {plantName}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/users')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" /> Invite Team Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">Invite Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamMembers.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{m.name}</td>
                  <td className="py-3 px-4 text-slate-600">{m.email}</td>
                  <td className="py-3 px-4">
                    <StatusBadge type="role" value={m.role} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="account" value={m.account_status} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="invite" value={m.invite_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
