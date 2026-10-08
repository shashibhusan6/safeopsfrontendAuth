import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useAuth } from '../../context/AuthContext';
import { plantsApi } from '../../api/plantsApi.js';
import { useToast } from '../../context/ToastContext';

export const ZoneModal = ({
  isOpen,
  onClose,
  onSubmit,
  editZone,
  defaultPlantId,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();
  const isOperator = user?.role === 'operator';

  const [name, setName] = useState('');
  const [severityLevel, setSeverityLevel] = useState('medium');
  const [status, setStatus] = useState('active');
  const [plantId, setPlantId] = useState(defaultPlantId || user?.plant_id || 1);
  const [plants, setPlants] = useState([]);

  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('20:00');

  useEffect(() => {
    if (isOpen) {
      plantsApi.getPlants(1, 100).then((res) => setPlants(res.data)).catch(() => {});

      if (editZone) {
        setName(editZone.name);
        setSeverityLevel(editZone.severity_level);
        setStatus(editZone.status);
        setPlantId(editZone.plant_id);
        if (editZone.operating_schedule) {
          setStartTime(editZone.operating_schedule.start || '08:00');
          setEndTime(editZone.operating_schedule.end || '20:00');
        }
      } else {
        setName('');
        setSeverityLevel('medium');
        setStatus('active');
        setPlantId(defaultPlantId || user?.plant_id || 1);
        setStartTime('08:00');
        setEndTime('20:00');
      }
    }
  }, [isOpen, editZone, defaultPlantId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOperator) {
      showForbiddenAlert();
      return;
    }

    const parentPlant = plants.find((p) => p.id === plantId);
    if (status === 'active' && parentPlant?.status === 'inactive') {
      addToast(
        `Cannot create active zone in inactive plant '${parentPlant.name}'. Please activate the parent plant first.`,
        'warning',
        'Parent Plant Inactive'
      );
      return;
    }

    try {
      await onSubmit(plantId, {
        name,
        severity_level: severityLevel,
        status,
        operating_schedule: {
          start: startTime,
          end: endTime,
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        },
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
      title={editZone ? 'Edit Zone Configuration' : 'Define New Operational Zone'}
      subtitle={editZone ? 'Update zone severity & operating schedules' : 'Add a monitored perimeter or hazardous unit inside plant'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Parent Plant Location
          </label>
          <select
            value={plantId}
            onChange={(e) => setPlantId(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
            disabled={Boolean(editZone) || isOperator}
          >
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status === 'active' ? 'Active' : 'Inactive Plant'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
            Zone Title / Sector Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Flare Stack & High Pressure Area"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
            required
            disabled={isOperator}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Safety Hazard Severity
            </label>
            <select
              value={severityLevel}
              onChange={(e) => setSeverityLevel(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
              disabled={isOperator}
            >
              <option value="low">Low Hazard</option>
              <option value="medium">Medium Hazard</option>
              <option value="high">High Hazard</option>
              <option value="critical">Critical Hazard (PPE Strict)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
              Initial Zone Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
              disabled={isOperator}
            >
              <option value="active">Active (Monitored)</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">
            Shift Operating Hours Schedule
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Shift Start</span>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                disabled={isOperator}
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block mb-1">Shift End</span>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                disabled={isOperator}
              />
            </div>
          </div>
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
            {isLoading ? 'Saving...' : editZone ? 'Update Zone' : 'Create Zone'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
