import React, { useState, useEffect, useCallback } from 'react';
import { zonesApi } from '../../api/zonesApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { ZoneModal } from './ZoneModal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Layers, Plus, Power, Edit3, Trash2, Video, Search, Clock, Factory, AlertTriangle } from 'lucide-react';

export const ZoneList = () => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();

  const isOperator = user?.role === 'operator';

  const [zones, setZones] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedPlantId, setSelectedPlantId] = useState(user?.plant_id || undefined);

  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [targetActionZone, setTargetActionZone] = useState(null);

  useEffect(() => {
    plantsApi.getPlants(1, 100).then((res) => setPlants(res.data)).catch(() => {});
  }, []);

  const fetchZones = useCallback(
    async (page = meta.page, limit = meta.limit) => {
      setIsLoading(true);
      try {
        const res = selectedPlantId
          ? await zonesApi.getZonesByPlant(selectedPlantId, page, limit, search, statusFilter)
          : await zonesApi.getAllZones(page, limit, search, statusFilter);
        setZones(res.data);
        setMeta(res.pagination);
      } catch (err) {
        if (err?.response?.status === 403) {
          showForbiddenAlert();
        } else {
          addToast('Failed to load zones list.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [selectedPlantId, meta.page, meta.limit, search, statusFilter, addToast, showForbiddenAlert]
  );

  useEffect(() => {
    fetchZones(1, meta.limit);
  }, [selectedPlantId, search, statusFilter]);

  const handleZoneSubmit = async (plantId, data) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      if (editingZone) {
        await zonesApi.updateZone(editingZone.id, data);
        addToast(`Zone '${data.name}' updated.`, 'success');
      } else {
        await zonesApi.createZone(plantId, data);
        addToast(`Zone '${data.name}' created.`, 'success');
      }
      setIsModalOpen(false);
      setEditingZone(null);
      fetchZones();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Operation failed';
        addToast(msg, 'error');
      }
    }
  };

  const handleToggleStatus = async (zoneToToggle) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    const newStatus = zoneToToggle.status === 'active' ? 'inactive' : 'active';
    try {
      if (newStatus === 'active') {
        await zonesApi.enableZone(zoneToToggle.id);
      } else {
        await zonesApi.disableZone(zoneToToggle.id);
      }
      addToast(`Zone '${zoneToToggle.name}' status set to ${newStatus}.`, newStatus === 'active' ? 'success' : 'warning');
      fetchZones();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Status change failed';
        addToast(msg, 'error');
      }
    } finally {
      setTargetActionZone(null);
    }
  };

  const handleDeleteZone = async (zoneToDelete) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await zonesApi.deleteZone(zoneToDelete.id);
      addToast(`Zone '${zoneToDelete.name}' deactivated.`, 'warning');
      fetchZones();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Deactivation failed';
        addToast(msg, 'error');
      }
    } finally {
      setTargetActionZone(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            Zone Operations & Perimeters
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Hazard severity levels, operating schedules, and nested camera streams.
          </p>
        </div>

        <button
          onClick={() => {
            if (isOperator) {
              showForbiddenAlert();
              return;
            }
            setEditingZone(null);
            setIsModalOpen(true);
          }}
          disabled={isOperator}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition flex items-center gap-2 text-sm disabled:opacity-40 shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Zone
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-xl flex flex-col md:flex-row items-center gap-3 shadow-xs">
        {/* Plant Selector Filter */}
        <div className="w-full md:w-64">
          <select
            value={selectedPlantId ?? ''}
            onChange={(e) => setSelectedPlantId(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            <option value="">All Plants</option>
            {plants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search zone name or hazard level..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-500 focus:bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Zones</option>
            <option value="inactive">Inactive Zones</option>
          </select>
        </div>
      </div>

      {/* Zones Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Zone Sector</th>
                <th className="px-5 py-3.5">Parent Plant</th>
                <th className="px-5 py-3.5">Hazard Severity</th>
                <th className="px-5 py-3.5">Shift Schedule</th>
                <th className="px-5 py-3.5">Cameras</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    Loading zone operations...
                  </td>
                </tr>
              ) : zones.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No zones found matching current filters.
                  </td>
                </tr>
              ) : (
                zones.map((z) => {
                  const parentPlant = plants.find((p) => p.id === z.plant_id) || z.plant;
                  const isParentInactive = parentPlant?.status === 'inactive';

                  return (
                    <tr key={z.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600">
                            <Layers className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{z.name}</div>
                            <div className="text-xs text-slate-500">ID #{z.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          <Factory className="w-3.5 h-3.5 text-slate-400" />
                          {parentPlant ? parentPlant.name : `Plant #${z.plant_id}`}
                        </div>
                        {isParentInactive && (
                          <div className="text-[11px] text-amber-700 font-medium flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500" /> Plant Inactive
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge type="severity" value={z.severity_level} />
                      </td>

                      <td className="px-5 py-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {z.operating_schedule?.start || '08:00'} - {z.operating_schedule?.end || '20:00'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
                          <Video className="w-3.5 h-3.5 text-slate-500" />
                          {z.cameras?.length ?? 0}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge type="zone" value={z.status} />
                      </td>

                      <td className="px-5 py-4 text-right space-x-1">
                        <button
                          onClick={() => {
                            if (isOperator) {
                              showForbiddenAlert();
                              return;
                            }
                            setTargetActionZone({ zone: z, type: 'toggle' });
                          }}
                          title={z.status === 'active' ? 'Deactivate Zone' : 'Enable Zone'}
                          className={`p-1.5 rounded-md transition ${
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
                            setIsModalOpen(true);
                          }}
                          title="Edit Zone"
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
                            setTargetActionZone({ zone: z, type: 'delete' });
                          }}
                          title="Deactivate / Delete Zone"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(p) => fetchZones(p, meta.limit)} onLimitChange={(l) => fetchZones(1, l)} />
      </div>

      {/* Modals */}
      <ZoneModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingZone(null);
        }}
        onSubmit={handleZoneSubmit}
        editZone={editingZone}
        defaultPlantId={selectedPlantId}
      />

      {targetActionZone && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setTargetActionZone(null)}
          onConfirm={() =>
            targetActionZone.type === 'toggle'
              ? handleToggleStatus(targetActionZone.zone)
              : handleDeleteZone(targetActionZone.zone)
          }
          title={
            targetActionZone.type === 'toggle'
              ? targetActionZone.zone.status === 'active'
                ? 'Deactivate Zone Sector?'
                : 'Enable Zone Sector?'
              : 'Deactivate Zone Sector?'
          }
          message={
            targetActionZone.type === 'toggle'
              ? `Are you sure you want to set zone '${targetActionZone.zone.name}' to ${
                  targetActionZone.zone.status === 'active' ? 'INACTIVE' : 'ACTIVE'
                }?`
              : `Deactivating zone '${targetActionZone.zone.name}' will also disable all child camera streams inside it.`
          }
          confirmText={
            targetActionZone.type === 'toggle'
              ? targetActionZone.zone.status === 'active'
                ? 'Deactivate Zone'
                : 'Enable Zone'
              : 'Deactivate Zone'
          }
          confirmVariant={
            targetActionZone.type === 'toggle' && targetActionZone.zone.status === 'inactive' ? 'success' : 'warning'
          }
        />
      )}
    </div>
  );
};
