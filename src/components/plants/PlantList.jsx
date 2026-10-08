import React, { useState, useEffect, useCallback } from 'react';
import { plantsApi } from '../../api/plantsApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { PlantModal } from './PlantModal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Factory, Plus, Power, Edit3, Layers, Users, Video, Search, MapPin, Clock, UserCheck } from 'lucide-react';

export const PlantList = () => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();

  const isSuperAdmin = user?.role === 'super_admin';
  const isOperator = user?.role === 'operator';

  const [plants, setPlants] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState(null);
  const [targetActionPlant, setTargetActionPlant] = useState(null);

  const fetchPlants = useCallback(
    async (page = meta.page, limit = meta.limit) => {
      setIsLoading(true);
      try {
        const res = await plantsApi.getPlants(page, limit, search, statusFilter);
        setPlants(res.data);
        setMeta(res.pagination);
      } catch (err) {
        if (err?.response?.status === 403) {
          showForbiddenAlert();
        } else {
          addToast('Failed to load plants network.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [meta.page, meta.limit, search, statusFilter, addToast, showForbiddenAlert]
  );

  useEffect(() => {
    fetchPlants(1, meta.limit);
  }, [search, statusFilter]);

  const handlePlantSubmit = async (data) => {
    if (!isSuperAdmin || isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      if (editingPlant) {
        await plantsApi.updatePlant(editingPlant.id, data);
        addToast(`Plant ${data.name} updated successfully.`, 'success');
      } else {
        await plantsApi.createPlant(data);
        addToast(`New Plant ${data.name} created.`, 'success');
      }
      setIsModalOpen(false);
      setEditingPlant(null);
      fetchPlants();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Operation failed', 'error');
      }
    }
  };

  const handleToggleStatus = async (plantToToggle) => {
    if (!isSuperAdmin || isOperator) {
      showForbiddenAlert();
      return;
    }
    const newStatus = plantToToggle.status === 'active' ? 'inactive' : 'active';
    try {
      if (newStatus === 'active') {
        await plantsApi.enablePlant(plantToToggle.id);
      } else {
        await plantsApi.disablePlant(plantToToggle.id);
      }
      addToast(
        `Plant ${plantToToggle.name} set to ${newStatus}.`,
        newStatus === 'active' ? 'success' : 'warning'
      );
      fetchPlants();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Status change failed', 'error');
      }
    } finally {
      setTargetActionPlant(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Industrial Plants & Infrastructure
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Facility network status, locations, and timezone operating scopes.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => {
              if (isOperator) {
                showForbiddenAlert();
                return;
              }
              setEditingPlant(null);
              setIsModalOpen(true);
            }}
            disabled={isOperator}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition flex items-center gap-1.5 text-xs disabled:opacity-50 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Register Plant
          </button>
        )}
      </div>

      <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl flex flex-col md:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search plant name or address..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-44 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Plants</option>
            <option value="inactive">Inactive Plants</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200/80 rounded-2xl">
          Loading plant network...
        </div>
      ) : plants.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200/80 rounded-2xl">
          No plants found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plants.map((p) => (
            <div
              key={p.id}
              className={`p-5 bg-white border rounded-2xl shadow-xs flex flex-col justify-between transition ${
                p.status === 'active'
                  ? 'border-slate-200/80 hover:border-indigo-300'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600">
                      <Factory className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">{p.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {p.timezone}
                      </div>
                    </div>
                  </div>
                  <StatusBadge type="plant" value={p.status} />
                </div>

                <div className="flex items-start gap-2 text-xs text-slate-600 mb-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{p.address}</span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 mb-4 bg-purple-50 p-2.5 rounded-lg border border-purple-200/80">
                  <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="truncate">
                    <strong className="text-slate-800">Manager: </strong>
                    {p.manager ? (
                      <span className="text-purple-700 font-medium">
                        {p.manager.name} {p.manager.invite_status === 'pending' ? '(Pending Invite)' : ''}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned (Assign via Edit)</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" /> Zones
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{p._count?.zones ?? 0}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px]">
                      <Video className="w-3.5 h-3.5 text-indigo-600" /> Cameras
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{p._count?.cameras ?? 0}</div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-indigo-600" /> Staff
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">{p._count?.users ?? 0}</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200/80">
                <span className="text-[11px] text-slate-400">ID #{p.id}</span>
                <div className="flex items-center gap-1">
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => {
                          if (isOperator) {
                            showForbiddenAlert();
                            return;
                          }
                          setTargetActionPlant({ plant: p, type: 'toggle' });
                        }}
                        title={p.status === 'active' ? 'Deactivate Plant' : 'Enable Plant'}
                        className={`p-1.5 rounded-lg transition ${
                          p.status === 'active'
                            ? 'text-emerald-600 hover:bg-amber-50 hover:text-amber-600'
                            : 'text-amber-600 hover:bg-emerald-50 hover:text-emerald-600'
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
                          setEditingPlant(p);
                          setIsModalOpen(true);
                        }}
                        title="Edit Plant"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <Pagination meta={meta} onPageChange={(pg) => fetchPlants(pg, meta.limit)} onLimitChange={(l) => fetchPlants(1, l)} />
      </div>

      <PlantModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlant(null);
        }}
        onSubmit={handlePlantSubmit}
        editPlant={editingPlant}
      />

      {targetActionPlant && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setTargetActionPlant(null)}
          onConfirm={() => handleToggleStatus(targetActionPlant.plant)}
          title={targetActionPlant.plant.status === 'active' ? 'Deactivate Plant Facility?' : 'Enable Plant Facility?'}
          message={`Are you sure you want to set '${targetActionPlant.plant.name}' to ${
            targetActionPlant.plant.status === 'active' ? 'INACTIVE' : 'ACTIVE'
          }?`}
          confirmText={targetActionPlant.plant.status === 'active' ? 'Deactivate Plant' : 'Enable Plant'}
          confirmVariant={targetActionPlant.plant.status === 'active' ? 'warning' : 'success'}
        />
      )}
    </div>
  );
};
