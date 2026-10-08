import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { plantsApi } from '../../api/plantsApi.js';
import { usersApi } from '../../api/usersApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Factory, Users, Shield, Layers, Video, ShieldCheck, ArrowRight, PlusCircle } from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({ plants: 0, users: 0, zones: 0, cameras: 0 });
  const [plantsList, setPlantsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [pRes, uRes, zRes, cRes] = await Promise.all([
          plantsApi.getPlants(1, 10),
          usersApi.getUsers(1, 1),
          zonesApi.getAllZones(1, 1),
          camerasApi.getAllCameras(1, 1),
        ]);
        setStats({
          plants: pRes.pagination?.total || pRes.data?.length || 0,
          users: uRes.pagination?.total || 0,
          zones: zRes.pagination?.total || 0,
          cameras: cRes.pagination?.total || 0,
        });
        setPlantsList(pRes.data || []);
      } catch (err) {
        console.error('Failed to load SuperAdmin stats', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Super Admin Hero Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-3">
            <ShieldCheck className="w-4 h-4 text-purple-600" /> Platform Super Admin Command Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Super Admin Control Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Logged in as <span className="font-semibold text-slate-900">{user?.name}</span> ({user?.email}). Full platform authority, global plant creation, unassigned admin invitations, and system-wide RBAC governance.
          </p>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => navigate('/super-admin/plants')}
          className="p-5 bg-white border border-slate-200/80 hover:border-purple-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Global Facilities</span>
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-600 group-hover:scale-105 transition">
              <Factory className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : stats.plants}</div>
          <div className="text-xs text-purple-600 mt-1 flex items-center gap-1 font-medium">
            Manage Facilities <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/super-admin/users')}
          className="p-5 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Global System Users</span>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 group-hover:scale-105 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : stats.users}</div>
          <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1 font-medium">
            User RBAC & Invites <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/super-admin/zones')}
          className="p-5 bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Safety Hazard Zones</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : stats.zones}</div>
          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
            Perimeter Config <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/super-admin/cameras')}
          className="p-5 bg-white border border-slate-200/80 hover:border-teal-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Vision Streams</span>
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-600 group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : stats.cameras}</div>
          <div className="text-xs text-teal-600 mt-1 flex items-center gap-1 font-medium">
            Streams Matrix <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Global Plant Management Overview */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Factory className="w-4 h-4 text-indigo-600" />
              Global Industrial Facilities Overview
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Super Admin exclusive capability: Add, configure, and assign plant facilities across regions
            </p>
          </div>
          <button
            onClick={() => navigate('/super-admin/plants')}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <PlusCircle className="w-4 h-4" /> Add Industrial Plant
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Plant ID</th>
                <th className="py-3 px-4">Facility Name</th>
                <th className="py-3 px-4">Location / Address</th>
                <th className="py-3 px-4">Timezone</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Zones / Cameras</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plantsList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-purple-700 font-medium">#PLANT-{p.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.address}</td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.timezone}</td>
                  <td className="py-3 px-4">
                    <StatusBadge type="plant" value={p.status} />
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-semibold text-indigo-600">{p._count?.zones || 0}</span> zones /{' '}
                    <span className="font-semibold text-slate-900">{p._count?.cameras || 0}</span> feeds
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
