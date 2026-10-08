import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { zonesApi } from '../../api/zonesApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { useToast } from '../../context/ToastContext.jsx';

export const CameraModal = ({
  isOpen,
  onClose,
  onSubmit,
  editCamera,
  defaultZoneId,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();
  const isOperator = user?.role === 'operator';

  const [name, setName] = useState('');
  const [feedType, setFeedType] = useState('simulated');
  const [feedUrl, setFeedUrl] = useState('');
  const [status, setStatus] = useState('online');
  const [isActive, setIsActive] = useState(true);

  const [zoneId, setZoneId] = useState(defaultZoneId || 101);
  const [zones, setZones] = useState([]);
  const [plants, setPlants] = useState([]);

  useEffect(() => {
    if (isOpen) {
      plantsApi.getPlants(1, 100).then((res) => setPlants(res.data)).catch(() => {});
      zonesApi.getAllZones(1, 100).then((res) => setZones(res.data)).catch(() => {});

      if (editCamera) {
        setName(editCamera.name);
        setFeedType(editCamera.feed_type);
        setFeedUrl(editCamera.feed_url_or_path || '');
        setStatus(editCamera.status);
        setIsActive(editCamera.is_active);
        setZoneId(editCamera.zone_id);
      } else {
        setName('');
        setFeedType('simulated');
        setFeedUrl('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80');
        setStatus('online');
        setIsActive(true);
        setZoneId(defaultZoneId || 101);
      }
    }
  }, [isOpen, editCamera, defaultZoneId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOperator) {
      showForbiddenAlert();
      return;
    }

    const parentZone = zones.find((z) => z.id === zoneId);
    if (isActive && parentZone?.status === 'inactive') {
      addToast(
        `Cannot create active camera inside inactive zone '${parentZone.name}'. Enable the zone first.`,
        'warning',
        'Parent Zone Inactive'
      );
      return;
    }

    try {
      await onSubmit(zoneId, {
        name,
        feed_type: feedType,
        feed_url_or_path: feedUrl,
        status,
        is_active: isActive,
      });
      onClose();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Operation failed', 'error');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editCamera ? 'Edit Camera Configuration' : 'Register New AI Camera Stream'}
      subtitle={editCamera ? 'Update feed protocol and active parameters' : 'Integrate RTSP feed or upload simulated stream'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Assigned Facility Plant & Zone Sector
          </label>
          <select
            value={zoneId}
            onChange={(e) => setZoneId(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
            disabled={Boolean(editCamera) || isOperator}
          >
            {zones.map((z) => {
              const parentPlant = plants.find((p) => p.id === z.plant_id) || z.plant;
              return (
                <option key={z.id} value={z.id}>
                  {parentPlant ? `${parentPlant.name} → ` : ''}{z.name} ({z.status === 'active' ? 'Active Zone' : 'Inactive Zone'})
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Camera Identification Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Unit A Thermal Flare Camera 1"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
            required
            disabled={isOperator}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Feed Ingest Type
            </label>
            <select
              value={feedType}
              onChange={(e) => setFeedType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
              disabled={isOperator}
            >
              <option value="simulated">Simulated AI Feed</option>
              <option value="rtsp">RTSP IP Stream</option>
              <option value="upload">Video File Upload</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Camera Enabled State (is_active)
            </label>
            <select
              value={isActive ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
              disabled={isOperator}
            >
              <option value="true">Active (is_active: true)</option>
              <option value="false">Disabled (is_active: false)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Stream URL / Feed Path
          </label>
          <input
            type="text"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder="rtsp://admin:pass@192.168.1.100:554/live or https://..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white font-mono"
            disabled={isOperator}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isOperator}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition text-sm disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : editCamera ? 'Update Camera' : 'Register Camera'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
