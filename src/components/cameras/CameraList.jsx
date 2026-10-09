import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { camerasApi } from '../../api/camerasApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { CameraModal } from './CameraModal.jsx';
import { BulkCameraModal } from './BulkCameraModal.jsx';
import { CameraFeedModal } from './CameraFeedModal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { BackButton } from '../common/BackButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CustomSelect } from '../common/CustomSelect.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';
import { Plus, Power, Edit3, Trash2, Eye, Search, Layers, Factory, Filter, Video, ExternalLink } from 'lucide-react';

export const CameraList = () => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();
  const navigate = useNavigate();

  const activeRole = normalizeRole(user?.role);
  const basePath = getRolePath(activeRole);
  const isSuperAdmin = activeRole === 'super_admin';
  const isOperator = activeRole === 'operator';

  const [cameras, setCameras] = useState([]);
  const [plants, setPlants] = useState([]);
  const [zones, setZones] = useState([]);

  const [selectedPlantId, setSelectedPlantId] = useState(undefined);
  const [selectedZoneId, setSelectedZoneId] = useState(undefined);

  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);

  const [viewingFeedCamera, setViewingFeedCamera] = useState(null);
  const [targetActionCamera, setTargetActionCamera] = useState(null);

  useEffect(() => {
    plantsApi.getPlants(1, 100).then((res) => setPlants(res.data)).catch(() => {});
    zonesApi.getAllZones(1, 100).then((res) => setZones(res.data)).catch(() => {});
  }, []);

  const handlePlantChange = (val) => {
    const pId = val ? Number(val) : undefined;
    setSelectedPlantId(pId);
    if (pId && selectedZoneId) {
      const isZoneInPlant = zones.some((z) => z.id === selectedZoneId && z.plant_id === pId);
      if (!isZoneInPlant) {
        setSelectedZoneId(undefined);
      }
    }
  };

  const filteredZones = selectedPlantId
    ? zones.filter((z) => z.plant_id === selectedPlantId)
    : zones;

  const fetchCameras = useCallback(
    async (page = meta.page, limit = meta.limit) => {
      setIsLoading(true);
      try {
        const res = await camerasApi.getAllCameras(
          page,
          limit,
          search,
          statusFilter,
          selectedPlantId,
          selectedZoneId
        );
        setCameras(res.data);
        setMeta(res.pagination);
      } catch (err) {
        if (err?.response?.status === 403) {
          showForbiddenAlert();
        } else {
          addToast('Failed to load camera streams.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlantId, selectedZoneId, meta.page, meta.limit, search, statusFilter, addToast, showForbiddenAlert]
  );

  useEffect(() => {
    fetchCameras(1, meta.limit);
  }, [selectedPlantId, selectedZoneId, search, statusFilter]);

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
        addToast(`Camera '${data.name}' registered successfully.`, 'success');
      }
      setIsModalOpen(false);
      setEditingCamera(null);
      fetchCameras();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Operation failed';
        addToast(msg, 'error');
      }
    }
  };

  const handleToggleActive = async (camToToggle) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    const nextActive = !camToToggle.is_active;
    try {
      if (nextActive) {
        await camerasApi.enableCamera(camToToggle.id);
      } else {
        await camerasApi.disableCamera(camToToggle.id);
      }
      addToast(
        `Camera '${camToToggle.name}' is now ${nextActive ? 'Enabled (Active)' : 'Disabled'}.`,
        nextActive ? 'success' : 'warning'
      );
      fetchCameras();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Toggle failed';
        addToast(msg, 'error');
      }
    } finally {
      setTargetActionCamera(null);
    }
  };

  const handleDeleteCamera = async (camToDelete) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await camerasApi.deleteCamera(camToDelete.id);
      addToast(`Camera '${camToDelete.name}' disabled.`, 'warning');
      fetchCameras();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Delete failed', 'error');
      }
    } finally {
      setTargetActionCamera(null);
    }
  };

  const sampleThumbnails = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
  ];

  const selectedPlantName = plants.find((p) => p.id === selectedPlantId)?.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              AI Camera Feeds & Stream Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitor optical feeds, RTSP links, operational states, and plant/zone ingest controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {!isOperator && (
            <button
              onClick={() => {
                setIsBulkModalOpen(true);
              }}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-xs transition flex items-center gap-1.5 text-xs sm:text-sm"
              title="Super Admin Batch Provisioning: Register multiple camera feeds at once"
            >
              <Video className="w-4 h-4" />
              Bulk Add Cameras
            </button>
          )}

          <button
            onClick={() => {
              if (isOperator) {
                showForbiddenAlert();
                return;
              }
              setEditingCamera(null);
              setIsModalOpen(true);
            }}
            disabled={isOperator}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition flex items-center gap-1.5 text-xs sm:text-sm disabled:opacity-40"
          >
            <Plus className="w-4 h-4" />
            Add Camera
          </button>
        </div>
      </div>

      {/* Filters Bar: Filter by Plant & Zone */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl flex flex-col md:flex-row items-center gap-3 shadow-xs">
        {/* Plant Selector Filter */}
        <div className="w-full md:w-56">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
            <Factory className="w-3 h-3 text-indigo-600" /> Plant Filter
          </label>
          <CustomSelect
            value={selectedPlantId ?? ''}
            onChange={(e) => handlePlantChange(e.target.value)}
            options={[
              { value: '', label: `All Plants (${plants.length})` },
              ...plants.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.status === 'active' ? 'Active' : 'Inactive'})`,
              })),
            ]}
            size="sm"
          />
        </div>

        {/* Zone Selector Filter */}
        <div className="w-full md:w-56">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider flex items-center gap-1">
            <Layers className="w-3 h-3 text-purple-600" /> Zone Filter
          </label>
          <CustomSelect
            value={selectedZoneId ?? ''}
            onChange={(e) => setSelectedZoneId(e.target.value ? Number(e.target.value) : undefined)}
            options={[
              {
                value: '',
                label: selectedPlantName
                  ? `All Zones in ${selectedPlantName}`
                  : `All Zones (${zones.length})`,
              },
              ...filteredZones.map((z) => ({
                value: z.id,
                label: `${z.name} (${z.status})`,
              })),
            ]}
            size="sm"
          />
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full self-end">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Search Streams
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search camera name, protocol, plant, zone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44 self-end">
          <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase tracking-wider">
            Stream Status
          </label>
          <CustomSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Enabled (is_active: true)' },
              { value: 'inactive', label: 'Disabled (is_active: false)' },
              { value: 'online', label: 'Online Streams' },
              { value: 'offline', label: 'Offline Streams' },
            ]}
            size="sm"
          />
        </div>
      </div>

      {/* Camera Grid Cards */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200/80 rounded-xl">
          Loading camera streams...
        </div>
      ) : cameras.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white border border-slate-200/80 rounded-xl">
          No camera streams found for the selected plant/zone filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameras.map((c) => {
            const parentZone = c.zone || zones.find((z) => z.id === c.zone_id);
            const parentPlant = c.plant || (parentZone ? plants.find((p) => p.id === parentZone.plant_id) : null);
            const thumb =
              c.feed_url_or_path && c.feed_url_or_path.startsWith('http')
                ? c.feed_url_or_path
                : sampleThumbnails[c.id % sampleThumbnails.length];

            return (
              <div
                key={c.id}
                className={`bg-white border rounded-xl overflow-hidden shadow-xs flex flex-col justify-between transition-all duration-200 ${
                  c.is_active
                    ? 'border-slate-200 hover:border-slate-300'
                    : 'border-slate-200 opacity-60 bg-slate-50'
                }`}
              >
                {/* Thumbnail Display */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                  <img
                    src={thumb}
                    alt={c.name}
                    className={`w-full h-full object-cover transition duration-300 ${
                      c.is_active ? 'group-hover:scale-105 opacity-85' : 'grayscale opacity-30'
                    }`}
                  />

                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <StatusBadge type="camera_status" value={c.status} />
                    <StatusBadge type="camera_active" value={c.is_active} />
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900/80 text-white border border-slate-700 uppercase">
                    {c.feed_type}
                  </div>

                  {/* Play/View Overlay button */}
                  <button
                    onClick={() => setViewingFeedCamera(c)}
                    className="absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 group-hover:opacity-100 transition duration-200"
                  >
                    <div className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-medium shadow-md flex items-center gap-2 text-xs">
                      <Eye className="w-4 h-4" />
                      View Stream
                    </div>
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base leading-tight mb-2.5">{c.name}</h3>

                    <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700">
                        <Factory className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">
                          {parentPlant ? parentPlant.name : 'Plant Facility'}
                        </span>
                      </div>

                      <div
                        onClick={() => navigate(`${basePath}/zones/${c.zone_id}`)}
                        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-600 font-medium cursor-pointer transition group/zone"
                        title="Click to view Zone Details"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-400 group-hover/zone:text-indigo-600 shrink-0" />
                        <span className="truncate">
                          {parentZone ? parentZone.name : `Zone #${c.zone_id}`}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/zone:opacity-100 transition" />
                      </div>
                    </div>
                  </div>

                  {/* Footer controls */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono">ID #{c.id}</span>

                    <div className="flex items-center gap-1">
                      {/* Enable/Disable Toggle */}
                      <button
                        onClick={() => {
                          if (isOperator) {
                            showForbiddenAlert();
                            return;
                          }
                          setTargetActionCamera({ camera: c, type: 'toggle' });
                        }}
                        title={c.is_active ? 'Disable Camera' : 'Enable Camera'}
                        className={`p-1.5 rounded-md transition ${
                          c.is_active
                            ? 'text-emerald-600 hover:bg-slate-100'
                            : 'text-slate-400 hover:text-emerald-600 hover:bg-slate-100'
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
                          setIsModalOpen(true);
                        }}
                        title="Edit Camera"
                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (isOperator) {
                            showForbiddenAlert();
                            return;
                          }
                          setTargetActionCamera({ camera: c, type: 'delete' });
                        }}
                        title="Disable / Delete Camera"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
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

      {/* Pagination */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <Pagination meta={meta} onPageChange={(pg) => fetchCameras(pg, meta.limit)} onLimitChange={(l) => fetchCameras(1, l)} />
      </div>

      {/* Modals */}
      <CameraModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCamera(null);
        }}
        onSubmit={handleCameraSubmit}
        editCamera={editingCamera}
        defaultZoneId={selectedZoneId}
      />

      <BulkCameraModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={fetchCameras}
        defaultZoneId={selectedZoneId}
        defaultPlantId={selectedPlantId}
      />

      <CameraFeedModal
        isOpen={Boolean(viewingFeedCamera)}
        onClose={() => setViewingFeedCamera(null)}
        camera={viewingFeedCamera}
      />

      {targetActionCamera && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setTargetActionCamera(null)}
          onConfirm={() =>
            targetActionCamera.type === 'toggle'
              ? handleToggleActive(targetActionCamera.camera)
              : handleDeleteCamera(targetActionCamera.camera)
          }
          title={
            targetActionCamera.type === 'toggle'
              ? targetActionCamera.camera.is_active
                ? 'Disable Camera Stream?'
                : 'Enable Camera Stream?'
              : 'Disable Camera Stream?'
          }
          message={`Are you sure you want to set is_active = ${
            targetActionCamera.camera.is_active ? 'false' : 'true'
          } for '${targetActionCamera.camera.name}'? ${
            !targetActionCamera.camera.is_active
              ? 'Note: Cannot enable camera if its parent zone or plant is inactive.'
              : ''
          }`}
          confirmText={
            targetActionCamera.type === 'toggle'
              ? targetActionCamera.camera.is_active
                ? 'Disable Camera'
                : 'Enable Camera'
              : 'Disable Camera'
          }
          confirmVariant={
            targetActionCamera.type === 'toggle' && !targetActionCamera.camera.is_active ? 'success' : 'warning'
          }
        />
      )}
    </div>
  );
};
