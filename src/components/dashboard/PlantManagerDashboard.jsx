import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { AttendanceLogTable } from '../common/AttendanceLogTable.jsx';
import { BackButton } from '../common/BackButton.jsx';
import { Layers, Video, ShieldAlert, ArrowRight, Activity, Clock } from 'lucide-react';

export const PlantManagerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [zRes, cRes] = await Promise.all([
          zonesApi.getAllZones(1, 10),
          camerasApi.getAllCameras(1, 10),
        ]);
        setZones(zRes.data || []);
        setCameras(cRes.data || []);
      } catch (err) {
        console.error('Failed to load Manager dashboard data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const plantName = user?.plant?.name || (user?.plant_id ? `Plant Facility #${user.plant_id}` : 'Assigned Plant');

  return (
    <div className="space-y-6">
      {/* Manager Hero Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <BackButton />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold">
              <Activity className="w-4 h-4 text-blue-600" /> Plant Manager Operational Portal
            </div>
          </div>
          <h1
            onClick={() => user?.plant_id && navigate(`/plant-manager/plants/${user.plant_id}`)}
            className={`text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight ${
              user?.plant_id ? 'cursor-pointer hover:text-indigo-600 transition' : ''
            }`}
            title={user?.plant_id ? 'Click to view Plant Facility Details' : ''}
          >
            {plantName} Operational Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Logged in as <span className="font-semibold text-slate-900">{user?.name}</span> ({user?.email}). Operational oversight for safety compliance, hazard zone schedules, shift activity, and live camera streams.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => navigate('/plant-manager/zones')}
          className="p-5 bg-white border border-slate-200/80 hover:border-blue-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Hazard Zones</span>
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 group-hover:scale-105 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : zones.length}</div>
          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
            Monitor Zone Schedules <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/plant-manager/cameras')}
          className="p-5 bg-white border border-slate-200/80 hover:border-indigo-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Vision Streams</span>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 group-hover:scale-105 transition">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{isLoading ? '...' : cameras.length}</div>
          <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1 font-medium">
            View Stream Feeds <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>

        <div
          onClick={() => navigate('/plant-manager/activity')}
          className="p-5 bg-white border border-slate-200/80 hover:border-amber-300 rounded-xl shadow-xs cursor-pointer transition group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Shift Audit & Logs</span>
            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 group-hover:scale-105 transition">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">24h Active</div>
          <div className="text-xs text-amber-600 mt-1 flex items-center gap-1 font-medium">
            Inspect Activity Trail <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
          </div>
        </div>
      </div>

      {/* Operational Zones Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              Plant Hazard Zones Operational Schedules
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live operating schedules and severity classifications for {plantName}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Zone ID</th>
                <th className="py-3 px-4">Zone Name</th>
                <th className="py-3 px-4">Hazard Severity</th>
                <th className="py-3 px-4">Operating Hours</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map((z) => (
                <tr
                  key={z.id}
                  onClick={() => navigate(`/plant-manager/zones/${z.id}`)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono text-blue-700 font-medium group-hover:text-indigo-600">#ZONE-{z.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                    {z.name}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition text-indigo-600" />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="severity" value={z.severity_level} />
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                    <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                    {z.operating_schedule?.start} - {z.operating_schedule?.end}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="zone" value={z.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Attendance QR Code Entry Log Table */}
      <AttendanceLogTable plantId={user?.plant_id} title={`Live Plant Employee Entry & Attendance Feed - ${plantName}`} />
    </div>
  );
};
