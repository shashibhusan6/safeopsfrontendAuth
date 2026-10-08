import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usersApi } from '../../api/usersApi.js';
import { Plus, Trash2, Layers, Video, UserCheck, UserPlus, Factory, AlertCircle } from 'lucide-react';

export const PlantModal = ({
  isOpen,
  onClose,
  onSubmit,
  editPlant,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();
  const isSuperAdmin = user?.role === 'super_admin';
  const isOperator = user?.role === 'operator';

  // Basic Plant details
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [timezone, setTimezone] = useState('America/Chicago');
  const [status, setStatus] = useState('active');

  // Plant Manager selection / invitation state
  const [managerOption, setManagerOption] = useState('unassigned');
  const [managerId, setManagerId] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [availableManagers, setAvailableManagers] = useState([]);

  // Nested Zones & Cameras state
  const [zones, setZones] = useState([]);

  useEffect(() => {
    if (isOpen) {
      usersApi
        .getUsers(1, 100)
        .then((res) => {
          const managers = (res.data || []).filter(
            (u) => u.role === 'manager' || u.role === 'admin'
          );
          setAvailableManagers(managers);
        })
        .catch(() => {});

      if (editPlant) {
        setName(editPlant.name || '');
        setAddress(editPlant.address || '');
        setTimezone(editPlant.timezone || 'America/Chicago');
        setStatus(editPlant.status || 'active');

        if (editPlant.manager) {
          setManagerOption('existing');
          setManagerId(editPlant.manager.id || '');
        } else {
          setManagerOption('unassigned');
          setManagerId('');
        }
        setNewManagerName('');
        setNewManagerEmail('');
        setZones([]);
      } else {
        setName('');
        setAddress('');
        setTimezone('America/Chicago');
        setStatus('active');
        setManagerOption('unassigned');
        setManagerId('');
        setNewManagerName('');
        setNewManagerEmail('');
        setZones([
          {
            tempId: `zone_${Date.now()}_1`,
            name: 'Zone 1 - Main Operational Sector',
            severity_level: 'medium',
            startTime: '08:00',
            endTime: '20:00',
            cameras: [
              {
                tempId: `cam_${Date.now()}_1`,
                name: 'Main Entrance AI Camera 1',
                feed_type: 'simulated',
                feed_url_or_path:
                  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
              },
            ],
          },
        ]);
      }
    }
  }, [isOpen, editPlant]);

  const handleAddZone = () => {
    const nextNum = zones.length + 1;
    setZones([
      ...zones,
      {
        tempId: `zone_${Date.now()}_${Math.random()}`,
        name: `Zone ${nextNum}`,
        severity_level: 'medium',
        startTime: '08:00',
        endTime: '20:00',
        cameras: [],
      },
    ]);
  };

  const handleRemoveZone = (zoneIndex) => {
    setZones(zones.filter((_, idx) => idx !== zoneIndex));
  };

  const handleZoneChange = (zoneIndex, field, value) => {
    const updated = [...zones];
    updated[zoneIndex][field] = value;
    setZones(updated);
  };

  const handleAddCamera = (zoneIndex) => {
    const updated = [...zones];
    const targetZone = updated[zoneIndex];
    const nextCamNum = targetZone.cameras.length + 1;
    targetZone.cameras.push({
      tempId: `cam_${Date.now()}_${Math.random()}`,
      name: `${targetZone.name || 'Zone'} Camera ${nextCamNum}`,
      feed_type: 'simulated',
      feed_url_or_path:
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    });
    setZones(updated);
  };

  const handleRemoveCamera = (zoneIndex, camIndex) => {
    const updated = [...zones];
    updated[zoneIndex].cameras = updated[zoneIndex].cameras.filter(
      (_, idx) => idx !== camIndex
    );
    setZones(updated);
  };

  const handleCameraChange = (zoneIndex, camIndex, field, value) => {
    const updated = [...zones];
    updated[zoneIndex].cameras[camIndex][field] = value;
    setZones(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOperator || !isSuperAdmin) {
      showForbiddenAlert();
      return;
    }

    if (managerOption === 'invite' && (!newManagerName.trim() || !newManagerEmail.trim())) {
      addToast('Please provide both Name and Email for the Plant Manager invite.', 'warning');
      return;
    }

    const payload = {
      name,
      address,
      timezone,
      status,
      managerOption,
      manager_id: managerOption === 'existing' ? managerId : null,
      new_manager:
        managerOption === 'invite'
          ? { name: newManagerName.trim(), email: newManagerEmail.trim() }
          : null,
      zones: zones.map((z) => ({
        name: z.name,
        severity_level: z.severity_level,
        operating_schedule: {
          start: z.startTime || '08:00',
          end: z.endTime || '20:00',
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        },
        cameras: (z.cameras || []).map((c) => ({
          name: c.name,
          feed_type: c.feed_type,
          feed_url_or_path: c.feed_url_or_path,
        })),
      })),
    };

    try {
      await onSubmit(payload);
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
      maxWidth="4xl"
      title={editPlant ? 'Edit Plant Facility & Management' : 'Register New Industrial Plant'}
      subtitle={
        editPlant
          ? 'Modify facility profile and update assigned plant manager'
          : 'Define plant details, optional plant manager invitation, and nested operational zones with camera streams'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: FACILITY PROFILE */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Factory className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Facility General Details
            </h4>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
              Plant Facility Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Delta Hydrocarbon Refinery (Plant ABC)"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600"
              required
              disabled={!isSuperAdmin || isOperator}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
              Physical Address / Coordinates
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="e.g. 500 Industrial Ave, Houston, TX 77002"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600 resize-none"
              required
              disabled={!isSuperAdmin || isOperator}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                Timezone Standard
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                disabled={!isSuperAdmin || isOperator}
              >
                <option value="America/Chicago">America/Chicago (CST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Europe/Amsterdam">Europe/Amsterdam (CET)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                Facility Operational Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                disabled={!isSuperAdmin || isOperator}
              >
                <option value="active">Active (Operational)</option>
                <option value="inactive">Inactive (Deactivated)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: PLANT MANAGER ASSIGNMENT */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Plant Manager Assignment (Optional)
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setManagerOption('unassigned')}
              className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                managerOption === 'unassigned'
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-bold block mb-1">Unassigned</span>
              <span className="text-[11px] text-slate-500">Assign later from Plant Management</span>
            </button>

            <button
              type="button"
              onClick={() => setManagerOption('existing')}
              className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                managerOption === 'existing'
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-bold block mb-1">Select Existing</span>
              <span className="text-[11px] text-slate-500">Assign an active manager in the system</span>
            </button>

            <button
              type="button"
              onClick={() => setManagerOption('invite')}
              className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                managerOption === 'invite'
                  ? 'bg-purple-50 border-purple-300 text-purple-900'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-bold block mb-1 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-purple-600" /> Invite New
              </span>
              <span className="text-[11px] text-slate-500">Send invitation email to a new manager</span>
            </button>
          </div>

          {managerOption === 'existing' && (
            <div className="pt-2">
              <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                Select System Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
              >
                <option value="">-- Choose Plant Manager --</option>
                {availableManagers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {managerOption === 'invite' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                  Manager Full Name
                </label>
                <input
                  type="text"
                  value={newManagerName}
                  onChange={(e) => setNewManagerName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
                  Manager Email Address
                </label>
                <input
                  type="email"
                  value={newManagerEmail}
                  onChange={(e) => setNewManagerEmail(e.target.value)}
                  placeholder="e.g. alex.rivera@safeops.io"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: HIERARCHICAL ZONES & CAMERA STREAMS */}
        {!editPlant && (
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    3. Operational Zones & Integrated Camera Streams
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddZone}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs transition flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Add Zone
              </button>
            </div>

            {zones.map((zone, zIdx) => (
              <div
                key={zone.tempId}
                className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {zIdx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-900">
                      Operational Zone #{zIdx + 1}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveZone(zIdx)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-6">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                      Zone Title
                    </label>
                    <input
                      type="text"
                      value={zone.name}
                      onChange={(e) => handleZoneChange(zIdx, 'name', e.target.value)}
                      placeholder={`e.g. Zone ${zIdx + 1}`}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                      required
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                      Hazard Severity
                    </label>
                    <select
                      value={zone.severity_level}
                      onChange={(e) =>
                        handleZoneChange(zIdx, 'severity_level', e.target.value)
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
                    >
                      <option value="low">Low Hazard</option>
                      <option value="medium">Medium Hazard</option>
                      <option value="high">High Hazard</option>
                      <option value="critical">Critical Hazard</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-[11px] font-medium text-slate-600 mb-1 uppercase tracking-wider">
                      Shift Hours
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="time"
                        value={zone.startTime}
                        onChange={(e) =>
                          handleZoneChange(zIdx, 'startTime', e.target.value)
                        }
                        className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-[11px]"
                      />
                      <span className="text-slate-400 text-xs">-</span>
                      <input
                        type="time"
                        value={zone.endTime}
                        onChange={(e) =>
                          handleZoneChange(zIdx, 'endTime', e.target.value)
                        }
                        className="w-1/2 px-2 py-1 bg-white border border-slate-300 rounded text-slate-800 text-[11px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOOTER ACTION BUTTONS */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-sm font-medium shadow-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !isSuperAdmin || isOperator}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition text-sm disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : editPlant ? 'Update Plant Details' : 'Create & Provision Plant'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
