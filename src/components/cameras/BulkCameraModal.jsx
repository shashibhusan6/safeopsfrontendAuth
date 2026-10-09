import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { zonesApi } from '../../api/zonesApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { useToast } from '../../context/ToastContext.jsx';
import { Plus, Trash2, Video, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

export const BulkCameraModal = ({
  isOpen,
  onClose,
  onSuccess,
  defaultZoneId,
  defaultPlantId,
}) => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();
  const isSuperAdmin = user?.role === 'super_admin';
  const isOperator = user?.role === 'operator';

  const [zones, setZones] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedZoneId, setSelectedZoneId] = useState(defaultZoneId || '');
  const [isLoading, setIsLoading] = useState(false);

  // Rows of cameras to add in bulk
  const [cameraRows, setCameraRows] = useState([]);

  useEffect(() => {
    if (isOpen) {
      plantsApi
        .getPlants(1, 100)
        .then((res) => setPlants(res.data || []))
        .catch(() => {});
      zonesApi
        .getAllZones(1, 100)
        .then((res) => {
          const loadedZones = res.data || [];
          setZones(loadedZones);
          const initialZone = defaultZoneId || (loadedZones.length > 0 ? loadedZones[0].id : '');
          setSelectedZoneId(initialZone);

          // Initialize with 2 default camera rows
          setCameraRows([
            {
              tempId: `bulk_cam_${Date.now()}_1`,
              name: 'AI Camera Stream 1',
              zone_id: initialZone,
              feed_type: 'simulated',
              feed_url_or_path:
                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
            },
            {
              tempId: `bulk_cam_${Date.now()}_2`,
              name: 'AI Camera Stream 2',
              zone_id: initialZone,
              feed_type: 'simulated',
              feed_url_or_path:
                'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
            },
          ]);
        })
        .catch(() => {});
    }
  }, [isOpen, defaultZoneId]);

  // Bulk Zone Assignment handler (changes zone for all rows if desired)
  const handleBulkZoneChange = (zId) => {
    setSelectedZoneId(zId);
    setCameraRows((prev) =>
      prev.map((row) => ({
        ...row,
        zone_id: zId,
      }))
    );
  };

  const handleAddRow = () => {
    const nextNum = cameraRows.length + 1;
    setCameraRows([
      ...cameraRows,
      {
        tempId: `bulk_cam_${Date.now()}_${Math.random()}`,
        name: `AI Camera Stream ${nextNum}`,
        zone_id: selectedZoneId || (zones.length > 0 ? zones[0].id : ''),
        feed_type: 'simulated',
        feed_url_or_path:
          'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    if (cameraRows.length <= 1) {
      addToast('At least one camera row is required.', 'warning');
      return;
    }
    setCameraRows(cameraRows.filter((_, idx) => idx !== index));
  };

  const handleRowChange = (index, field, value) => {
    const updated = [...cameraRows];
    updated[index][field] = value;
    setCameraRows(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOperator) {
      showForbiddenAlert();
      return;
    }

    if (cameraRows.length === 0) {
      addToast('Please add at least one camera stream row.', 'warning');
      return;
    }

    // Validate entries
    for (let i = 0; i < cameraRows.length; i++) {
      const row = cameraRows[i];
      if (!row.name || !row.name.trim()) {
        addToast(`Camera row #${i + 1} is missing a title name.`, 'warning');
        return;
      }
      if (!row.zone_id) {
        addToast(`Camera row #${i + 1} is missing a target operational zone.`, 'warning');
        return;
      }

      const parentZone = zones.find((z) => z.id === Number(row.zone_id));
      if (parentZone && parentZone.status === 'inactive') {
        addToast(
          `Cannot create camera '${row.name}' inside inactive zone '${parentZone.name}'.`,
          'warning',
          'Zone Inactive'
        );
        return;
      }
    }

    setIsLoading(true);
    let successCount = 0;
    try {
      for (const row of cameraRows) {
        const targetZoneId = Number(row.zone_id);
        const payload = {
          name: row.name.trim(),
          feed_type: row.feed_type || 'simulated',
          feed_url_or_path: row.feed_url_or_path || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
          status: 'online',
          is_active: true,
        };
        await camerasApi.createCamera(targetZoneId, payload);
        successCount++;
      }

      addToast(
        `Batch successfully provisioned ${successCount} camera streams!`,
        'success',
        'Bulk Add Complete'
      );
      onSuccess();
      onClose();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(
          err?.response?.data?.error || err.message || 'Bulk camera creation failed',
          'error'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      title="Batch Provision AI Camera Feeds (Bulk Add)"
      subtitle="Super Admin capability: Register multiple optical or RTSP camera streams at once across zones"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Top Batch Configuration Bar */}
        <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
                Bulk Target Zone Assignment
              </h4>
              <p className="text-xs text-indigo-700 mt-0.5">
                Apply a default operational zone to all batch cameras or select per camera below.
              </p>
            </div>
          </div>

          <div className="w-full sm:w-64 shrink-0">
            <label className="block text-[10px] font-bold text-indigo-900 mb-1 uppercase tracking-wider">
              Default Target Zone
            </label>
            <select
              value={selectedZoneId}
              onChange={(e) => handleBulkZoneChange(Number(e.target.value))}
              className="w-full px-3 py-1.5 bg-white border border-indigo-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
              disabled={isLoading || isOperator}
            >
              <option value="">-- Choose Target Zone --</option>
              {zones.map((z) => {
                const parentPlant = plants.find((p) => p.id === z.plant_id) || z.plant;
                return (
                  <option key={z.id} value={z.id}>
                    {parentPlant ? `${parentPlant.name} → ` : ''}{z.name} ({z.status === 'active' ? 'Active' : 'Inactive Zone'})
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Camera Entries List Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Camera Streams Batch List ({cameraRows.length} Cameras)
            </h4>
          </div>

          <button
            type="button"
            onClick={handleAddRow}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shadow-xs"
            disabled={isLoading || isOperator}
          >
            <Plus className="w-4 h-4" />
            Add Another Camera Row
          </button>
        </div>

        {/* Dynamic Camera Rows */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 overscroll-contain touch-scroll">
          {cameraRows.map((row, idx) => (
            <div
              key={row.tempId || idx}
              className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs relative hover:border-indigo-300 transition"
            >
              <div className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                <span className="font-semibold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  Camera Stream #{idx + 1}
                </span>

                <button
                  type="button"
                  onClick={() => handleRemoveRow(idx)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition flex items-center gap-1 text-xs"
                  title="Remove camera from batch"
                  disabled={isLoading || isOperator}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                    Camera Identification Title
                  </label>
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => handleRowChange(idx, 'name', e.target.value)}
                    placeholder={`e.g. AI Camera Stream ${idx + 1}`}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    required
                    disabled={isLoading || isOperator}
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                    Target Operational Zone
                  </label>
                  <select
                    value={row.zone_id}
                    onChange={(e) => handleRowChange(idx, 'zone_id', Number(e.target.value))}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    required
                    disabled={isLoading || isOperator}
                  >
                    <option value="">-- Choose Zone --</option>
                    {zones.map((z) => {
                      const parentPlant = plants.find((p) => p.id === z.plant_id) || z.plant;
                      return (
                        <option key={z.id} value={z.id}>
                          {parentPlant ? `${parentPlant.name} → ` : ''}{z.name}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                    Feed Protocol Ingest Type
                  </label>
                  <select
                    value={row.feed_type}
                    onChange={(e) => handleRowChange(idx, 'feed_type', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    disabled={isLoading || isOperator}
                  >
                    <option value="simulated">Simulated AI Feed</option>
                    <option value="rtsp">RTSP IP Stream</option>
                    <option value="upload">Video File Upload</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                  Feed URL / Stream Path
                </label>
                <input
                  type="text"
                  value={row.feed_url_or_path}
                  onChange={(e) => handleRowChange(idx, 'feed_url_or_path', e.target.value)}
                  placeholder="rtsp://admin:pass@192.168.1.100:554/live or https://..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs font-mono focus:outline-none focus:border-indigo-600"
                  disabled={isLoading || isOperator}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer Action Bar */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            Ready to provision <strong className="text-slate-900">{cameraRows.length}</strong> camera streams.
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-sm font-medium shadow-xs"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isOperator}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isLoading ? 'Provisioning Batch...' : `Provision All ${cameraRows.length} Cameras`}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
