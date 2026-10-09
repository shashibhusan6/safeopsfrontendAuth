import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { plantsApi } from '../../api/plantsApi.js';
import { usersApi } from '../../api/usersApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { mockEngine } from '../../api/mockEngine.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { AttendanceLogTable } from '../common/AttendanceLogTable.jsx';
import { BackButton } from '../common/BackButton.jsx';
import {
  Factory,
  Users,
  Layers,
  Video,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  Clock,
  MapPin,
  Globe,
  Bell,
  CheckCircle2,
  Activity,
  Cpu,
  ShieldAlert,
  UserCheck,
  Plus,
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [assignedPlant, setAssignedPlant] = useState(null);
  const [stats, setStats] = useState({ zones: 0, cameras: 0, users: 0 });
  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const plantId = user?.plant_id ?? user?.plant?.id ?? null;

  const refreshTelemetry = (id) => {
    if (id) {
      setAlerts(mockEngine.getSafetyAlerts(id));
      setMetrics(mockEngine.getSuperAdminMetrics(id));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!plantId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const pid = Number(plantId);
        const [pData, zRes, cRes, uRes] = await Promise.all([
          plantsApi.getPlantById(pid),
          zonesApi.getZonesByPlant(pid, 1, 10),
          camerasApi.getAllCameras(1, 10, '', '', pid),
          usersApi.getUsers(1, 10),
        ]);

        setAssignedPlant(pData);
        setZones(zRes.data || []);
        setCameras(cRes.data || []);
        setUsers((uRes.data || []).filter((u) => Number(u.plant_id) === pid));

        setStats({
          zones: zRes.pagination?.total || zRes.data?.length || 0,
          cameras: cRes.pagination?.total || cRes.data?.length || 0,
          users: uRes.pagination?.total || uRes.data?.length || 0,
        });

        refreshTelemetry(pid);
      } catch (err) {
        console.error('Failed to load SuperAdmin assigned plant data', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [plantId]);

  const handleAcknowledgeAlert = (alertId) => {
    try {
      mockEngine.acknowledgeAlert(alertId);
      refreshTelemetry(plantId);
      addToast(`Safety Alert ${alertId} marked as resolved.`, 'success');
    } catch (err) {
      addToast('Failed to acknowledge alert.', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Detecting assigned plant facility telemetry...
      </div>
    );
  }

  // Unassigned Super Admin Account Warning
  if (!plantId || !assignedPlant) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-600" /> Platform Super Admin Command Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Super Admin Control Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed">
              Logged in as <span className="font-semibold text-slate-900">{user?.name}</span> ({user?.email}).
            </p>
          </div>
        </div>

        <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto" />
          <h3 className="text-lg font-bold text-amber-900">No Industrial Plant Assigned</h3>
          <p className="text-xs sm:text-sm text-amber-800 max-w-lg mx-auto leading-relaxed">
            Your Super Admin account is currently not assigned to any specific plant facility. In accordance with system policy, each Super Admin is assigned to manage an individual plant location.
          </p>
          <p className="text-xs text-amber-700 font-mono">
            Please contact system administration to map your account (#USER-{user?.id}) to a plant.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Assigned Plant Hero Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <BackButton />
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 text-purple-600" /> Assigned Plant Super Admin Portal
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1
                onClick={() => navigate(`/super-admin/plants/${assignedPlant.id}`)}
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight hover:text-purple-600 cursor-pointer transition flex items-center gap-2"
                title="Click to view full Plant Details"
              >
                {assignedPlant.name}
                <ArrowRight className="w-6 h-6 text-purple-600" />
              </h1>
              <StatusBadge type="plant" value={assignedPlant.status} />
            </div>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed flex items-center gap-3 flex-wrap">
              <span>
                Logged in as <span className="font-semibold text-slate-900">{user?.name}</span> ({user?.email})
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {assignedPlant.address}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Globe className="w-3.5 h-3.5 text-slate-400" /> {assignedPlant.timezone}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => navigate('/super-admin/zones')}
              className="px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Sector Zone
            </button>
            <button
              onClick={() => navigate('/super-admin/users')}
              className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Users className="w-4 h-4" /> Manage Personnel
            </button>
          </div>
        </div>
      </div>

      {/* Safety & Telemetry KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* PPE Safety Compliance */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PPE Compliance Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics?.ppeComplianceRate || 98.4}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full"
              style={{ width: `${metrics?.ppeComplianceRate || 98.4}%` }}
            />
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High Safety Compliance Standard
          </div>
        </div>

        {/* Active AI Streams */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active AI Feeds</span>
            <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-600">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics?.aiFeedsOnline || stats.cameras} / {metrics?.aiFeedsTotal || stats.cameras} Online
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block mr-1" />
            Live Video Analytics Active
          </div>
        </div>

        {/* On-Site Personnel */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">On-Site Personnel</span>
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics?.onSitePersonnel || 14} Staff Members
          </div>
          <div className="text-xs text-indigo-600 mt-1 font-medium">
            {users.length} Registered Facility Managers & Technicians
          </div>
        </div>

        {/* Response Benchmark */}
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Incident Response</span>
            <div className="p-2 rounded-lg bg-purple-50 border border-purple-200 text-purple-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {metrics?.avgResponseTimeMin || 1.2} min Avg
          </div>
          <div className="text-xs text-purple-600 mt-1 font-medium">
            Optimal Emergency Dispatch Speed
          </div>
        </div>
      </div>

      {/* Main Grid: Real-Time Safety Alerts & AI Cameras */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Real-time AI Safety Events Stream */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  Live AI Safety & Security Events Log
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time telemetry and hazard detection logs from {assignedPlant.name}
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold font-mono">
                {alerts.filter((a) => a.status === 'active' || a.status === 'investigating').length} Active
              </span>
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No active safety alerts reported for this plant.
                </div>
              ) : (
                alerts.map((alt) => {
                  const isResolved = alt.status === 'resolved';
                  const isCritical = alt.severity === 'critical';
                  const isHigh = alt.severity === 'high';

                  return (
                    <div
                      key={alt.id}
                      className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isResolved
                          ? 'bg-slate-50/70 border-slate-200 opacity-75'
                          : isCritical
                          ? 'bg-rose-50/50 border-rose-200'
                          : isHigh
                          ? 'bg-amber-50/50 border-amber-200'
                          : 'bg-blue-50/40 border-blue-200'
                      }`}
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              isCritical
                                ? 'bg-rose-600 text-white'
                                : isHigh
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {alt.severity}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{alt.type}</span>
                          <span className="text-[11px] text-slate-400 font-mono">• {alt.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-snug">{alt.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                          <span>
                            Sector: <span className="text-slate-900 font-semibold">{alt.zone_name}</span>
                          </span>
                          <span>•</span>
                          <span>
                            Feed: <span className="text-slate-900">{alt.camera_name}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!isResolved ? (
                          <button
                            onClick={() => handleAcknowledgeAlert(alt.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs transition shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 text-[11px] font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" /> Resolved
                          </span>
                        )}
                        <button
                          onClick={() => navigate(`/super-admin/zones/${alt.zone_id}`)}
                          className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs transition cursor-pointer"
                        >
                          Inspect Sector
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Live AI Camera Feeds Snapshot Grid */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Video className="w-5 h-5 text-teal-600" />
                Live AI Camera Streams
              </h2>
              <button
                onClick={() => navigate('/super-admin/cameras')}
                className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
              >
                All Feeds ({cameras.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {cameras.slice(0, 4).map((cam) => (
                <div
                  key={cam.id}
                  onClick={() => navigate(`/super-admin/cameras/${cam.id}`)}
                  className="p-3 bg-slate-50/80 border border-slate-200/80 hover:border-teal-300 rounded-xl transition cursor-pointer group flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-600 transition">
                        {cam.name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="uppercase font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold">
                        {cam.feed_type}
                      </span>
                      <span className="truncate">Zone #{cam.zone_id}</span>
                    </div>
                  </div>

                  <StatusBadge type="camera" value={cam.status} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate('/super-admin/cameras')}
            className="w-full mt-4 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            Launch Feeds Matrix Center <ArrowRight className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Assigned Plant Hazard Zones Overview Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              {assignedPlant.name} - Hazard Zone Sectors ({zones.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Click any zone sector to inspect its dedicated details, streams, and personnel
            </p>
          </div>
          <button
            onClick={() => navigate('/super-admin/zones')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
          >
            Manage All Sectors
          </button>
        </div>

        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Zone ID</th>
                <th className="py-3 px-4">Zone Sector Name</th>
                <th className="py-3 px-4">Hazard Severity</th>
                <th className="py-3 px-4">Operating Schedule</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map((z) => (
                <tr
                  key={z.id}
                  onClick={() => navigate(`/super-admin/zones/${z.id}`)}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono text-purple-700 font-medium">#ZONE-{z.id}</td>
                  <td className="py-3 px-4 font-semibold text-slate-900 group-hover:text-purple-600 transition flex items-center gap-1.5">
                    {z.name}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition text-purple-600" />
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

      {/* Live Super Admin Attendance Log Feed */}
      <AttendanceLogTable title="Enterprise Employee QR Entry & Gate Attendance Stream" />
    </div>
  );
};

