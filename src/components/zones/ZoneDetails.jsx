import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { usersApi } from '../../api/usersApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { ZoneModal } from './ZoneModal.jsx';
import { CameraModal } from '../cameras/CameraModal.jsx';
import { CameraFeedModal } from '../cameras/CameraFeedModal.jsx';
import { UserModal } from '../users/UserModal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { BackButton } from '../common/BackButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';
import {
  Layers,
  ArrowLeft,
  Factory,
  Clock,
  Video,
  Users,
  Shield,
  Plus,
  Power,
  Edit3,
  Trash2,
  Eye,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Radio,
  Calendar,
  MapPin,
  Globe
} from 'lucide-react';

export const ZoneDetails = () => {
  const { id } = useParams();
  const zoneId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();

  const activeRole = normalizeRole(user?.role);
  const basePath = getRolePath(activeRole);
  const isOperator = activeRole === 'operator';

  const [zone, setZone] = useState(null);
  const [plant, setPlant] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: 'cameras' | 'users' | 'overview'
  const [activeTab, setActiveTab] = useState('cameras');

  // Modals state
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [viewingFeedCamera, setViewingFeedCamera] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchZoneData = useCallback(async () => {
    setIsLoading(true);
    try {
      const zData = await zonesApi.getZoneById(zoneId);
      setZone(zData);

      // Parent plant details
      if (zData.plant) {
        setPlant(zData.plant);
      } else if (zData.plant_id) {
        try {
          const pData = await plantsApi.getPlantById(zData.plant_id);
          setPlant(pData);
        } catch {
          // ignore
        }
      }

      // Cameras for this zone
      try {
        const cRes = await camerasApi.getCamerasByZone(zoneId, 1, 100);
        setCameras(cRes.data || []);
      } catch {
        setCameras(zData.cameras || []);
      }

      // Assigned users for this zone / plant
      try {
        const uRes = await usersApi.getUsers(1, 100);
        const usersInPlant = (uRes.data || []).filter(
          (u) => u.plant_id === zData.plant_id || (u.zone_ids && u.zone_ids.includes(zoneId))
        );
        setAssignedUsers(usersInPlant);
      } catch {
        setAssignedUsers(zData.users || []);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(`Failed to load details for Zone #${zoneId}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [zoneId, addToast, showForbiddenAlert]);

  useEffect(() => {
    if (zoneId) {
      fetchZoneData();
    }
  }, [zoneId, fetchZoneData]);

  // --- ZONE HANDLERS ---
  const handleZoneUpdateSubmit = async (plantId, data) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await zonesApi.updateZone(zoneId, data);
      addToast(`Zone '${data.name}' updated successfully.`, 'success');
      setIsZoneModalOpen(false);
      fetchZoneData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Update failed', 'error');
      }
    }
  };

  const handleToggleZoneStatus = async () => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    const newStatus = zone.status === 'active' ? 'inactive' : 'active';
    try {
      if (newStatus === 'active') {
        await zonesApi.enableZone(zoneId);
      } else {
        await zonesApi.disableZone(zoneId);
      }
      addToast(`Zone status set to ${newStatus}.`, newStatus === 'active' ? 'success' : 'warning');
      fetchZoneData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Status toggle failed', 'error');
      }
    } finally {
      setConfirmDialog(null);
    }
  };

  const handleDeleteZone = async () => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await zonesApi.deleteZone(zoneId);
      addToast(`Zone '${zone.name}' deactivated.`, 'warning');
      navigate(`${basePath}/zones`);
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Deactivation failed', 'error');
      }
    } finally {
      setConfirmDialog(null);
    }
  };

  // --- CAMERA HANDLERS ---
  const handleCameraSubmit = async (targetZoneId, data) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      if (editingCamera) {
        await camerasApi.updateCamera(editingCamera.id, data);
        addToast(`Camera '${data.name}' updated.`, 'success');
      } else {
        await camerasApi.createCamera(targetZoneId || zoneId, data);
        addToast(`Camera '${data.name}' added to zone.`, 'success');
      }
      setIsCameraModalOpen(false);
      setEditingCamera(null);
      fetchZoneData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Camera operation failed', 'error');
      }
    }
  };

  const handleToggleCameraStatus = async (cam) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    const nextActive = !cam.is_active;
    try {
      if (nextActive) {
        await camerasApi.enableCamera(cam.id);
      } else {
        await camerasApi.disableCamera(cam.id);
      }
      addToast(`Camera '${cam.name}' ${nextActive ? 'enabled' : 'disabled'}.`, nextActive ? 'success' : 'warning');
      fetchZoneData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Toggle failed', 'error');
      }
    }
  };

  const handleDeleteCamera = async (cam) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await camerasApi.deleteCamera(cam.id);
      addToast(`Camera '${cam.name}' disabled.`, 'warning');
      fetchZoneData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Delete failed', 'error');
      }
    }
  };

  // --- USER HANDLERS ---
  const handleUserSubmit = async (data) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, data);
        addToast(`User '${data.name}' updated.`, 'success');
      } else {
        await usersApi.inviteUser({ ...data, plant_id: zone?.plant_id });
        addToast(`Invitation sent to ${data.email}`, 'success');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchZoneData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'User action failed', 'error');
      }
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    const nextStatus = targetUser.account_status === 'active' ? 'disabled' : 'active';
    try {
      if (nextStatus === 'active') {
        await usersApi.enableUser(targetUser.id);
      } else {
        await usersApi.disableUser(targetUser.id);
      }
      addToast(`User ${targetUser.name} set to ${nextStatus}.`, nextStatus === 'active' ? 'success' : 'warning');
      fetchZoneData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'User status update failed', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading Zone details...
      </div>
    );
  }

  if (!zone) {
    return (
      <div className="p-12 text-center text-slate-600 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Zone Not Found</h3>
        <p className="text-sm text-slate-500">The requested Zone Sector #{zoneId} does not exist or was deactivated.</p>
        <button
          onClick={() => navigate(`${basePath}/zones`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Return to Zone Operations
        </button>
      </div>
    );
  }

  const onlineCameras = cameras.filter((c) => c.status === 'online' && c.is_active).length;
  const offlineCameras = cameras.length - onlineCameras;
  const isPlantInactive = plant?.status === 'inactive';

  const sampleThumbnails = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton fallbackPath={`${basePath}/zones`} label="Back to Zone Operations" className="mb-2" />
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{zone.name}</h1>
                <StatusBadge type="zone" value={zone.status} />
                <StatusBadge type="severity" value={zone.severity_level} />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span className="font-mono text-indigo-700 font-semibold">Zone ID #{zone.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Factory className="w-3.5 h-3.5 text-slate-400" />
                  {plant ? plant.name : `Plant #${zone.plant_id}`}
                </span>
                {isPlantInactive && (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold border border-amber-200">
                    Plant Inactive
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Management Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (isOperator) {
                showForbiddenAlert();
                return;
              }
              setEditingCamera(null);
              setIsCameraModalOpen(true);
            }}
            disabled={isOperator}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <Plus className="w-4 h-4" /> Add Camera Feed
          </button>

          <button
            onClick={() => {
              if (isOperator) {
                showForbiddenAlert();
                return;
              }
              setEditingUser(null);
              setIsUserModalOpen(true);
            }}
            disabled={isOperator}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5 disabled:opacity-40"
          >
            <UserPlus className="w-4 h-4" /> Assign User
          </button>

          <button
            onClick={() => {
              if (isOperator) {
                showForbiddenAlert();
                return;
              }
              setIsZoneModalOpen(true);
            }}
            disabled={isOperator}
            title="Edit Zone Settings"
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-40"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              if (isOperator) {
                showForbiddenAlert();
                return;
              }
              setConfirmDialog({ type: 'toggle' });
            }}
            disabled={isOperator}
            title={zone.status === 'active' ? 'Deactivate Zone' : 'Enable Zone'}
            className={`p-2 rounded-lg border text-xs font-semibold shadow-xs transition disabled:opacity-40 ${
              zone.status === 'active'
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Camera Streams</span>
            <Video className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{cameras.length} Feeds</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
            <span className="text-emerald-600 font-semibold">{onlineCameras} Online</span>
            <span>•</span>
            <span className="text-slate-400">{offlineCameras} Offline</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Assigned Personnel</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{assignedUsers.length} Users</div>
          <div className="text-xs text-slate-500 mt-1">Managers, Admins & Operators</div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Hazard Level</span>
            <Shield className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <StatusBadge type="severity" value={zone.severity_level} />
          </div>
          <div className="text-xs text-slate-500 mt-2">Safety Protocol Level</div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Operating Shift</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-base font-bold text-slate-900 mt-2">
            {zone.operating_schedule?.start || '08:00'} - {zone.operating_schedule?.end || '20:00'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {(zone.operating_schedule?.days || []).join(', ') || 'All Week'}
          </div>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200 px-6 pt-4 space-x-6">
          <button
            onClick={() => setActiveTab('cameras')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'cameras'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Video className="w-4 h-4" />
            AI Camera Feeds ({cameras.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Assigned Users & Staff ({assignedUsers.length})
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Factory className="w-4 h-4" />
            Zone & Plant Metadata
          </button>
        </div>

        {/* Tab 1: Cameras */}
        {activeTab === 'cameras' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Zone Camera Stream Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All optical, thermal, RTSP, and simulated streams bound to {zone.name}
                </p>
              </div>

              {!isOperator && (
                <button
                  onClick={() => {
                    setEditingCamera(null);
                    setIsCameraModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Stream
                </button>
              )}
            </div>

            {cameras.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 space-y-3">
                <Video className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-800">No Cameras Registered in this Zone</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add an AI optical camera feed or RTSP IP camera stream to start real-time hazard monitoring.
                </p>
                {!isOperator && (
                  <button
                    onClick={() => {
                      setEditingCamera(null);
                      setIsCameraModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Register First Camera Stream
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cameras.map((c) => {
                  const thumb =
                    c.feed_url_or_path && c.feed_url_or_path.startsWith('http')
                      ? c.feed_url_or_path
                      : sampleThumbnails[c.id % sampleThumbnails.length];

                  return (
                    <div
                      key={c.id}
                      className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition ${
                        c.is_active ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-200 bg-slate-50 opacity-60'
                      }`}
                    >
                      <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                        <img
                          src={thumb}
                          alt={c.name}
                          className={`w-full h-full object-cover transition duration-300 ${
                            c.is_active ? 'group-hover:scale-105 opacity-85' : 'grayscale opacity-30'
                          }`}
                        />
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          <StatusBadge type="camera_status" value={c.status} />
                          <StatusBadge type="camera_active" value={c.is_active} />
                        </div>

                        <div className="absolute bottom-2.5 left-2.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-white border border-slate-700 uppercase">
                          {c.feed_type}
                        </div>

                        <button
                          onClick={() => setViewingFeedCamera(c)}
                          className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition"
                        >
                          <div className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-md">
                            <Eye className="w-4 h-4" /> View Stream
                          </div>
                        </button>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-900 text-sm mb-1">{c.name}</h4>
                          <div className="text-xs text-slate-500 font-mono">Stream ID #{c.id}</div>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 font-mono uppercase">{c.feed_type}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleToggleCameraStatus(c)}
                              disabled={isOperator}
                              title={c.is_active ? 'Disable Stream' : 'Enable Stream'}
                              className={`p-1.5 rounded-md transition disabled:opacity-40 ${
                                c.is_active ? 'text-emerald-600 hover:bg-slate-100' : 'text-slate-400 hover:text-emerald-600'
                              }`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (isOperator) {
                                  showForbiddenAlert();
                                  return;
                                }
                                setEditingCamera(c);
                                setIsCameraModalOpen(true);
                              }}
                              disabled={isOperator}
                              title="Edit Camera"
                              className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCamera(c)}
                              disabled={isOperator}
                              title="Delete Camera"
                              className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition disabled:opacity-40"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Assigned Users */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Zone & Plant Assigned Staff Roster</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personnel authorized for operational safety oversight in this sector
                </p>
              </div>

              {!isOperator && (
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setIsUserModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Invite / Assign User
                </button>
              )}
            </div>

            {assignedUsers.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 space-y-3">
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-800">No Users Assigned to this Plant/Zone</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Invite managers or operators to assign them to safety operations.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Personnel</th>
                      <th className="px-5 py-3">Assigned Role</th>
                      <th className="px-5 py-3">Account Status</th>
                      <th className="px-5 py-3">Invite Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {assignedUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900">{u.name}</div>
                              <div className="text-xs text-slate-500">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge type="role" value={u.role} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge type="account" value={u.account_status} />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge type="invite" value={u.invite_status} />
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            disabled={isOperator}
                            title={u.account_status === 'active' ? 'Disable Account' : 'Enable Account'}
                            className={`p-1.5 rounded-lg transition disabled:opacity-40 ${
                              u.account_status === 'active'
                                ? 'text-emerald-600 hover:bg-rose-50 hover:text-rose-600'
                                : 'text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (isOperator) {
                                showForbiddenAlert();
                                return;
                              }
                              setEditingUser(u);
                              setIsUserModalOpen(true);
                            }}
                            disabled={isOperator}
                            title="Edit User"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition disabled:opacity-40"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Overview & Plant Details */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Zone Specific Metadata */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  Zone Operational Specifications
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Zone Name</span>
                    <span className="font-semibold text-slate-900">{zone.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Internal Identifier</span>
                    <span className="font-mono font-semibold text-indigo-700">#ZONE-{zone.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Hazard Severity</span>
                    <div className="mt-1">
                      <StatusBadge type="severity" value={zone.severity_level} />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Zone Operational Status</span>
                    <div className="mt-1">
                      <StatusBadge type="zone" value={zone.status} />
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Shift Start Time</span>
                    <span className="font-mono text-slate-800">{zone.operating_schedule?.start || '08:00'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Shift End Time</span>
                    <span className="font-mono text-slate-800">{zone.operating_schedule?.end || '20:00'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block font-medium mb-1">Active Operating Days</span>
                    <div className="flex flex-wrap gap-1">
                      {(zone.operating_schedule?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']).map((day) => (
                        <span key={day} className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[11px] font-semibold">
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Plant Specifications */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Factory className="w-4 h-4 text-purple-600" />
                  Parent Facility Plant Details
                </h4>

                {plant ? (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Plant Facility Name</span>
                      <span className="font-semibold text-slate-900">{plant.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Plant ID</span>
                      <span className="font-mono font-semibold text-purple-700">#PLANT-{plant.id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Location Address</span>
                      <span className="text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {plant.address}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Regional Timezone</span>
                      <span className="font-mono text-slate-800 flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                        {plant.timezone}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Plant Status</span>
                      <div className="mt-1">
                        <StatusBadge type="plant" value={plant.status} />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Facility Manager</span>
                      <span className="font-semibold text-slate-800">
                        {plant.manager ? plant.manager.name : 'Assigned Plant Admin'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">Parent plant information loading or unavailable.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSubmit={handleZoneUpdateSubmit}
        editZone={zone}
        defaultPlantId={zone.plant_id}
      />

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setEditingCamera(null);
        }}
        onSubmit={handleCameraSubmit}
        editCamera={editingCamera}
        defaultZoneId={zoneId}
      />

      <CameraFeedModal
        isOpen={Boolean(viewingFeedCamera)}
        onClose={() => setViewingFeedCamera(null)}
        camera={viewingFeedCamera}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleUserSubmit}
        editUser={editingUser}
      />

      {confirmDialog && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          onConfirm={() =>
            confirmDialog.type === 'toggle' ? handleToggleZoneStatus() : handleDeleteZone()
          }
          title={
            confirmDialog.type === 'toggle'
              ? zone.status === 'active'
                ? 'Deactivate Zone Sector?'
                : 'Enable Zone Sector?'
              : 'Deactivate Zone Sector?'
          }
          message={
            confirmDialog.type === 'toggle'
              ? `Are you sure you want to set zone '${zone.name}' to ${zone.status === 'active' ? 'INACTIVE' : 'ACTIVE'}?`
              : `Deactivating zone '${zone.name}' will also disable all child camera streams inside it.`
          }
          confirmText={
            confirmDialog.type === 'toggle'
              ? zone.status === 'active'
                ? 'Deactivate Zone'
                : 'Enable Zone'
              : 'Deactivate Zone'
          }
          confirmVariant={confirmDialog.type === 'toggle' && zone.status === 'inactive' ? 'success' : 'warning'}
        />
      )}
    </div>
  );
};
