import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { plantsApi } from '../../api/plantsApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { usersApi } from '../../api/usersApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { PlantModal } from './PlantModal.jsx';
import { ZoneModal } from '../zones/ZoneModal.jsx';
import { CameraModal } from '../cameras/CameraModal.jsx';
import { CameraFeedModal } from '../cameras/CameraFeedModal.jsx';
import { UserModal } from '../users/UserModal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { BackButton } from '../common/BackButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';
import {
  Factory,
  ArrowLeft,
  Layers,
  Video,
  Users,
  MapPin,
  Clock,
  Globe,
  Plus,
  Power,
  Edit3,
  Trash2,
  Eye,
  UserPlus,
  UserCheck,
  Shield,
  ArrowRight,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

export const PlantDetails = () => {
  const { id } = useParams();
  const plantId = Number(id);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();

  const activeRole = normalizeRole(user?.role);
  const basePath = getRolePath(activeRole);
  const isSuperAdmin = activeRole === 'super_admin';
  const isOperator = activeRole === 'operator';

  const [plant, setPlant] = useState(null);
  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: 'zones' | 'cameras' | 'users' | 'overview'
  const [activeTab, setActiveTab] = useState('zones');

  // Modals state
  const [isPlantModalOpen, setIsPlantModalOpen] = useState(false);

  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [viewingFeedCamera, setViewingFeedCamera] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState(null);

  const fetchPlantData = useCallback(async () => {
    setIsLoading(true);
    try {
      const pData = await plantsApi.getPlantById(plantId);
      setPlant(pData);

      // Zones for this plant
      try {
        const zRes = await zonesApi.getZonesByPlant(plantId, 1, 100);
        setZones(zRes.data || []);
      } catch {
        setZones(pData.zones || []);
      }

      // Cameras for this plant
      try {
        const cRes = await camerasApi.getAllCameras(1, 100, '', '', plantId);
        setCameras(cRes.data || []);
      } catch {
        setCameras(pData.cameras || []);
      }

      // Users for this plant
      try {
        const uRes = await usersApi.getUsers(1, 100);
        const plantStaff = (uRes.data || []).filter((u) => u.plant_id === plantId);
        setUsers(plantStaff);
      } catch {
        setUsers(pData.users || []);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(`Failed to load facility details for Plant #${plantId}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [plantId, addToast, showForbiddenAlert]);

  useEffect(() => {
    if (plantId) {
      fetchPlantData();
    }
  }, [plantId, fetchPlantData]);

  // --- PLANT HANDLERS ---
  const handlePlantSubmit = async (data) => {
    if (!isSuperAdmin || isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await plantsApi.updatePlant(plantId, data);
      addToast(`Plant '${data.name}' details updated.`, 'success');
      setIsPlantModalOpen(false);
      fetchPlantData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Plant update failed', 'error');
      }
    }
  };

  const handleTogglePlantStatus = async () => {
    if (!isSuperAdmin || isOperator) {
      showForbiddenAlert();
      return;
    }
    const newStatus = plant.status === 'active' ? 'inactive' : 'active';
    try {
      if (newStatus === 'active') {
        await plantsApi.enablePlant(plantId);
      } else {
        await plantsApi.disablePlant(plantId);
      }
      addToast(`Plant '${plant.name}' set to ${newStatus}.`, newStatus === 'active' ? 'success' : 'warning');
      fetchPlantData();
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

  const handleDeletePlant = async () => {
    if (!isSuperAdmin || isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await plantsApi.deletePlant(plantId);
      addToast(`Plant facility '${plant.name}' deleted.`, 'warning');
      navigate(`${basePath}/plants`);
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Deletion failed', 'error');
      }
    } finally {
      setConfirmDialog(null);
    }
  };

  // --- ZONE HANDLERS ---
  const handleZoneSubmit = async (targetPlantId, data) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      if (editingZone) {
        await zonesApi.updateZone(editingZone.id, data);
        addToast(`Zone '${data.name}' updated.`, 'success');
      } else {
        await zonesApi.createZone(targetPlantId || plantId, data);
        addToast(`Zone '${data.name}' created in plant.`, 'success');
      }
      setIsZoneModalOpen(false);
      setEditingZone(null);
      fetchPlantData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Zone action failed', 'error');
      }
    }
  };

  const handleToggleZoneStatus = async (z) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    const nextStatus = z.status === 'active' ? 'inactive' : 'active';
    try {
      if (nextStatus === 'active') {
        await zonesApi.enableZone(z.id);
      } else {
        await zonesApi.disableZone(z.id);
      }
      addToast(`Zone '${z.name}' is now ${nextStatus}.`, nextStatus === 'active' ? 'success' : 'warning');
      fetchPlantData();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Zone toggle failed', 'error');
      }
    }
  };

  // --- CAMERA HANDLERS ---
  const handleCameraSubmit = async (zoneId, data) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      if (editingCamera) {
        await camerasApi.updateCamera(editingCamera.id, data);
        addToast(`Camera '${data.name}' updated.`, 'success');
      } else {
        await camerasApi.createCamera(zoneId, data);
        addToast(`Camera '${data.name}' registered.`, 'success');
      }
      setIsCameraModalOpen(false);
      setEditingCamera(null);
      fetchPlantData();
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
      fetchPlantData();
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
      fetchPlantData();
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
        await usersApi.inviteUser({ ...data, plant_id: plantId });
        addToast(`Invitation sent to ${data.email}`, 'success');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchPlantData();
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
      fetchPlantData();
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
        Loading Facility Plant details...
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="p-12 text-center text-slate-600 bg-white border border-slate-200/80 rounded-2xl shadow-xs space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Plant Facility Not Found</h3>
        <p className="text-sm text-slate-500">The requested Plant Facility #{plantId} does not exist or was deleted.</p>
        <button
          onClick={() => navigate(`${basePath}/plants`)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          Return to Plant Network
        </button>
      </div>
    );
  }

  const onlineCameras = cameras.filter((c) => c.status === 'online' && c.is_active).length;
  const offlineCameras = cameras.length - onlineCameras;

  const sampleThumbnails = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  ];

  const plantManager = plant.manager || users.find((u) => u.role === 'manager' || u.role === 'admin');

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb & Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <BackButton fallbackPath={`${basePath}/plants`} label="Back to Plant Network" className="mb-2" />
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-600 text-white shadow-md">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{plant.name}</h1>
                <StatusBadge type="plant" value={plant.status} />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
                <span className="font-mono text-purple-700 font-semibold">Plant ID #{plant.id}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> {plant.address}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-600 font-mono text-[11px]">
                  <Globe className="w-3.5 h-3.5 text-slate-400" /> {plant.timezone}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Management Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {!isOperator && (
            <>
              <button
                onClick={() => {
                  setEditingZone(null);
                  setIsZoneModalOpen(true);
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Zone
              </button>

              <button
                onClick={() => {
                  setEditingUser(null);
                  setIsUserModalOpen(true);
                }}
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" /> Invite Staff
              </button>

              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => setIsPlantModalOpen(true)}
                    title="Edit Plant Details"
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setConfirmDialog({ type: 'toggle' })}
                    title={plant.status === 'active' ? 'Deactivate Plant' : 'Enable Plant'}
                    className={`p-2 rounded-lg border text-xs font-semibold shadow-xs transition ${
                      plant.status === 'active'
                        ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Perimeter Zones</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{zones.length} Sectors</div>
          <div className="text-xs text-indigo-600 mt-1 font-medium">Active Hazard Zones</div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>AI Vision Streams</span>
            <Video className="w-4 h-4 text-purple-600" />
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
            <span>Plant Personnel</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{users.length} Staff</div>
          <div className="text-xs text-slate-500 mt-1">Managers & Operators</div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-xl shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Facility Manager</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base font-bold text-slate-900 mt-2 truncate">
            {plantManager ? plantManager.name : 'Unassigned'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {plantManager ? plantManager.email : 'Assign Manager in Settings'}
          </div>
        </div>
      </div>

      {/* Main Container with Tabs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center border-b border-slate-200 px-6 pt-4 space-x-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('zones')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'zones'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Hazard Zones & Perimeters ({zones.length})
          </button>

          <button
            onClick={() => setActiveTab('cameras')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
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
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Assigned Personnel ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Factory className="w-4 h-4" />
            Facility Specifications
          </button>
        </div>

        {/* Tab 1: Zones (WITH CLICKABLE ZONES TO ZONE DETAILS) */}
        {activeTab === 'zones' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Perimeter Hazard Zones</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any zone sector to open its dedicated Zone Details workspace
                </p>
              </div>

              {!isOperator && (
                <button
                  onClick={() => {
                    setEditingZone(null);
                    setIsZoneModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Zone Sector
                </button>
              )}
            </div>

            {zones.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 space-y-3">
                <Layers className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-800">No Zones Configured in this Plant</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create a perimeter hazard zone to begin mapping camera streams and shift schedules.
                </p>
                {!isOperator && (
                  <button
                    onClick={() => {
                      setEditingZone(null);
                      setIsZoneModalOpen(true);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Register First Zone
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {zones.map((z) => (
                  <div
                    key={z.id}
                    className="p-5 bg-white border border-slate-200/80 hover:border-indigo-400 rounded-xl shadow-xs transition flex flex-col justify-between group"
                  >
                    <div>
                      {/* Zone Header (CLICKABLE TO ZONE DETAILS) */}
                      <div
                        onClick={() => navigate(`${basePath}/zones/${z.id}`)}
                        className="flex items-start justify-between gap-3 mb-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                            <Layers className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-base leading-tight group-hover:text-indigo-600 transition flex items-center gap-1.5">
                              {z.name}
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition text-indigo-600" />
                            </h4>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">ID #{z.id}</div>
                          </div>
                        </div>
                        <StatusBadge type="zone" value={z.status} />
                      </div>

                      {/* Zone Properties */}
                      <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200/80 text-xs mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Hazard Level:</span>
                          <StatusBadge type="severity" value={z.severity_level} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Shift Schedule:</span>
                          <span className="font-mono text-slate-700">
                            {z.operating_schedule?.start || '08:00'} - {z.operating_schedule?.end || '20:00'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium">Camera Streams:</span>
                          <span className="font-bold text-indigo-600">
                            {z.cameras?.length ?? 0} Feeds
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Zone Actions Footer */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <button
                        onClick={() => navigate(`${basePath}/zones/${z.id}`)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Zone Details
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleZoneStatus(z)}
                          disabled={isOperator}
                          title={z.status === 'active' ? 'Deactivate Zone' : 'Enable Zone'}
                          className={`p-1.5 rounded-md transition disabled:opacity-40 ${
                            z.status === 'active'
                              ? 'text-emerald-600 hover:bg-amber-50 hover:text-amber-700'
                              : 'text-amber-600 hover:bg-emerald-50 hover:text-emerald-700'
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
                            setEditingZone(z);
                            setIsZoneModalOpen(true);
                          }}
                          disabled={isOperator}
                          title="Edit Zone"
                          className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-40"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Cameras across Plant */}
        {activeTab === 'cameras' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Plant Camera Stream Matrix</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  All optical & RTSP feeds operational across {plant.name}
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
                  <Plus className="w-3.5 h-3.5" /> Register Camera Stream
                </button>
              )}
            </div>

            {cameras.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 space-y-3">
                <Video className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-800">No Cameras Registered in this Plant</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add camera feeds to zones in this plant facility.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cameras.map((c) => {
                  const parentZone = zones.find((z) => z.id === c.zone_id) || c.zone;
                  const thumb =
                    c.feed_url_or_path && c.feed_url_or_path.startsWith('http')
                      ? c.feed_url_or_path
                      : sampleThumbnails[c.id % sampleThumbnails.length];

                  return (
                    <div
                      key={c.id}
                      className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition ${
                        c.is_active ? 'border-slate-200 hover:border-purple-300' : 'border-slate-200 bg-slate-50 opacity-60'
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
                          <div
                            onClick={() => navigate(`${basePath}/zones/${c.zone_id}`)}
                            className="text-xs text-slate-500 hover:text-indigo-600 cursor-pointer transition flex items-center gap-1 font-medium"
                            title="Click to view Zone Details"
                          >
                            <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{parentZone ? parentZone.name : `Zone #${c.zone_id}`}</span>
                            <ExternalLink className="w-3 h-3 text-indigo-500" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                          <span className="text-[11px] text-slate-400 font-mono">ID #{c.id}</span>
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

        {/* Tab 3: Assigned Personnel */}
        {activeTab === 'users' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Plant Staff Roster & RBAC Status</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Managers, Admins, and Operators assigned to {plant.name}
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
                  <UserPlus className="w-3.5 h-3.5" /> Invite Staff Member
                </button>
              )}
            </div>

            {users.length === 0 ? (
              <div className="p-10 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 space-y-3">
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="font-semibold text-slate-800">No Staff Assigned to this Plant</div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Invite plant managers or operators to handle safety compliance.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Member Name</th>
                      <th className="px-5 py-3">Role</th>
                      <th className="px-5 py-3">Account Status</th>
                      <th className="px-5 py-3">Invite Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
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

        {/* Tab 4: Overview & Plant Manager Specifications */}
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plant Technical Specifications */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Factory className="w-4 h-4 text-purple-600" />
                  Facility Technical Profile
                </h4>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block font-medium">Facility Name</span>
                    <span className="font-semibold text-slate-900">{plant.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-medium">Facility Unique ID</span>
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
                    <span className="text-slate-500 block font-medium">Operating Timezone</span>
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
                    <span className="text-slate-500 block font-medium">Registered Date</span>
                    <span className="font-mono text-slate-700">
                      {plant.createdAt ? new Date(plant.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plant Manager Details */}
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-4">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-200 pb-2">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  Assigned Plant Manager Profile
                </h4>

                {plantManager ? (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block font-medium">Manager Name</span>
                      <span className="font-semibold text-slate-900">{plantManager.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Email Address</span>
                      <span className="text-slate-700">{plantManager.email}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Role Level</span>
                      <div className="mt-1">
                        <StatusBadge type="role" value={plantManager.role} />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-500 block font-medium">Invitation Status</span>
                      <div className="mt-1">
                        <StatusBadge type="invite" value={plantManager.invite_status} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 space-y-2">
                    <p>No dedicated Plant Manager currently assigned to this facility.</p>
                    {isSuperAdmin && (
                      <button
                        onClick={() => setIsPlantModalOpen(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition"
                      >
                        Assign Manager in Settings
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PlantModal
        isOpen={isPlantModalOpen}
        onClose={() => setIsPlantModalOpen(false)}
        onSubmit={handlePlantSubmit}
        editPlant={plant}
      />

      <ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => {
          setIsZoneModalOpen(false);
          setEditingZone(null);
        }}
        onSubmit={handleZoneSubmit}
        editZone={editingZone}
        defaultPlantId={plantId}
      />

      <CameraModal
        isOpen={isCameraModalOpen}
        onClose={() => {
          setIsCameraModalOpen(false);
          setEditingCamera(null);
        }}
        onSubmit={handleCameraSubmit}
        editCamera={editingCamera}
        defaultZoneId={zones[0]?.id || 101}
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

      {confirmDialog && confirmDialog.type === 'toggle' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          onConfirm={handleTogglePlantStatus}
          title={plant.status === 'active' ? 'Deactivate Plant Facility?' : 'Enable Plant Facility?'}
          message={`Are you sure you want to set '${plant.name}' to ${
            plant.status === 'active' ? 'INACTIVE' : 'ACTIVE'
          }?`}
          confirmText={plant.status === 'active' ? 'Deactivate Plant' : 'Enable Plant'}
          confirmVariant={plant.status === 'active' ? 'warning' : 'success'}
        />
      )}

      {confirmDialog && confirmDialog.type === 'delete' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          onConfirm={handleDeletePlant}
          title="Delete Industrial Plant Facility?"
          message={`Are you sure you want to permanently delete '${plant.name}'? This action cannot be undone.`}
          confirmText="Delete Facility"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};
