import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { camerasApi } from '../../api/camerasApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Video, Layers, AlertTriangle, ArrowRight, Eye } from 'lucide-react';

export const OperatorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cameras, setCameras] = useState([]);
  const [zones, setZones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [cRes, zRes] = await Promise.all([
          camerasApi.getAllCameras(1, 6),
          zonesApi.getAllZones(1, 5),
        ]);
        setCameras(cRes.data || []);
        setZones(zRes.data || []);
      } catch (err) {
        console.error('Failed to load Operator feeds', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const plantName = user?.plant?.name || (user?.plant_id ? `Plant Facility #${user.plant_id}` : 'Assigned Plant');

  return (
    <div className="space-y-6">
      {/* Operator Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold mb-3">
            <Eye className="w-4 h-4 text-indigo-600" /> Operator Monitoring Desk (Read-Only)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {plantName} Surveillance Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
            Logged in as <span className="font-semibold text-slate-900">{user?.name}</span> ({user?.email}). Real-time camera feeds monitoring and safety zone surveillance. All administrative and configuration mutations are locked.
          </p>
        </div>
      </div>

      {/* Operator Mode Alert */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800 shadow-xs">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong className="text-amber-900 font-bold">Strict Read-Only Mode Enforced:</strong>
            <span className="ml-1 text-amber-800">
              You can inspect live AI streams, check zone status, and view logs. Any create, edit, or delete action will return 403 Forbidden.
            </span>
          </div>
        </div>
      </div>

      {/* Live AI Camera Stream Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-600" />
              Live AI Safety Camera Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active surveillance feeds in {plantName}
            </p>
          </div>
          <button
            onClick={() => navigate('/operator/cameras')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            Full Camera Grid <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((cam) => (
            <div
              key={cam.id}
              className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs flex flex-col group hover:border-indigo-300 transition"
            >
              <div className="relative h-40 bg-slate-900 flex items-center justify-center overflow-hidden">
                {cam.feed_url_or_path?.startsWith('http') ? (
                  <img
                    src={cam.feed_url_or_path}
                    alt={cam.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-4 text-center">
                    <Video className="w-8 h-8 text-slate-500" />
                    <span className="text-xs font-mono text-slate-300 truncate max-w-[200px]">
                      {cam.feed_url_or_path}
                    </span>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5">
                  <StatusBadge type="camera_status" value={cam.status} />
                </div>
                <div className="absolute bottom-2 left-2.5 text-[10px] font-mono text-slate-200 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700">
                  {cam.feed_type.toUpperCase()}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{cam.name}</h3>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Zone ID: <span className="text-slate-800 font-mono">#{cam.zone_id}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hazard Zones Read-Only Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            Zone Safety Status Monitor
          </h2>
          <button
            onClick={() => navigate('/operator/zones')}
            className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1"
          >
            All Zones <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Zone ID</th>
                <th className="py-3 px-4">Zone Name</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map((z) => (
                <tr key={z.id} className="hover:bg-slate-50/80">
                  <td className="py-3 px-4 font-mono text-slate-600">#ZONE-{z.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900">{z.name}</td>
                  <td className="py-3 px-4">
                    <StatusBadge type="severity" value={z.severity_level} />
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
    </div>
  );
};
