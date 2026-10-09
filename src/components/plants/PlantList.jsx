import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { plantsApi } from '../../api/plantsApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { PlantModal } from './PlantModal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { BackButton } from '../common/BackButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CustomSelect } from '../common/CustomSelect.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';
import {
  Factory,
  Plus,
  Power,
  Edit3,
  Trash2,
  Layers,
  Users,
  Video,
  Search,
  MapPin,
  Clock,
  UserCheck,
  Eye,
  ArrowRight,
  ShieldAlert,
  QrCode,
  Building2,
} from 'lucide-react';

export const PlantList = () => {
  const { user } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();
  const navigate = useNavigate();

  const activeRole = normalizeRole(user?.role);
  const basePath = getRolePath(activeRole);
  const isSuperAdmin = activeRole === 'super_admin';
  const isOperator = activeRole === 'operator';

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
        setPlants(res.data || []);
        setMeta(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
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

  const handleDeletePlant = async (plantToDelete) => {
    if (!isSuperAdmin || isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await plantsApi.deletePlant(plantToDelete.id);
      addToast(`Plant '${plantToDelete.name}' deleted successfully.`, 'success');
      fetchPlants();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        addToast(err?.response?.data?.error || err.message || 'Delete operation failed', 'error');
      }
    } finally {
      setTargetActionPlant(null);
    }
  };

  // Determine view mode
  const isSinglePlantView = !search && !statusFilter && meta.total === 1 && plants.length === 1;
  const singlePlant = isSinglePlantView ? plants[0] : null;

  // Shortcuts authorized for activeRole
  const quickAccessShortcuts = singlePlant
    ? [
        {
          id: 'details',
          title: 'View Plant Details',
          desc: 'Access full facility overview, zone breakdowns, and operational metrics.',
          icon: <Eye className="w-5 h-5 text-indigo-600" />,
          path: `${basePath}/plants/${singlePlant.id}`,
          roles: ['super_admin', 'admin', 'manager', 'operator'],
        },
        {
          id: 'zones',
          title: 'Zone Operations',
          desc: 'Manage safety zones, hazard parameters, and operational boundaries.',
          icon: <Layers className="w-5 h-5 text-indigo-600" />,
          path: `${basePath}/zones`,
          roles: ['super_admin', 'admin', 'manager', 'operator'],
        },
        {
          id: 'cameras',
          title: 'Camera Streams',
          desc: 'Monitor real-time AI security camera feeds and video analytics.',
          icon: <Video className="w-5 h-5 text-indigo-600" />,
          path: `${basePath}/cameras`,
          roles: ['super_admin', 'admin', 'manager', 'operator'],
        },
        {
          id: 'users',
          title: 'Staff & Team Roster',
          desc: 'Manage plant managers, operators, and user access permissions.',
          icon: <Users className="w-5 h-5 text-indigo-600" />,
          path: `${basePath}/users`,
          roles: ['super_admin', 'admin'],
        },
        {
          id: 'activity',
          title: 'Audit & Incident Logs',
          desc: 'Review security events, access logs, and system audit trails.',
          icon: <ShieldAlert className="w-5 h-5 text-indigo-600" />,
          path: `${basePath}/activity`,
          roles: ['super_admin', 'admin', 'manager', 'operator'],
        },
        {
          id: 'qr-entry',
          title: 'QR Employee Entry',
          desc: 'Scan employee QR codes for instant check-in and access control.',
          icon: <QrCode className="w-5 h-5 text-indigo-600" />,
          path: `${basePath}/qr-entry`,
          roles: ['super_admin', 'admin', 'manager', 'operator'],
        },
      ].filter((item) => item.roles.includes(activeRole))
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {isSinglePlantView ? 'My Plant Overview' : 'Industrial Plants & Infrastructure'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isSinglePlantView
                ? 'Operational status, facility metrics, and quick management shortcuts for your assigned plant.'
                : 'Facility network status, locations, and timezone operating scopes.'}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white border border-slate-200/80 rounded-2xl">
          Loading plant network...
        </div>
      ) : isSinglePlantView && singlePlant ? (
        /* SINGLE ASSIGNED PLANT DEDICATED VIEW */
        <div className="space-y-6">
          {/* Main Plant Overview Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                  <Factory className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                      {singlePlant.name}
                    </h3>
                    <StatusBadge type="plant" value={singlePlant.status} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Timezone: <strong className="text-slate-700 font-medium">{singlePlant.timezone}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      Facility ID: <strong className="text-slate-700 font-medium">#{singlePlant.id}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => navigate(`${basePath}/plants/${singlePlant.id}`)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
                >
                  <Eye className="w-4 h-4" /> View Plant Details
                </button>

                {isSuperAdmin && (
                  <>
                    <button
                      onClick={() => setTargetActionPlant({ plant: singlePlant, type: 'toggle' })}
                      title={singlePlant.status === 'active' ? 'Deactivate Plant' : 'Enable Plant'}
                      className={`p-2 rounded-lg border transition ${
                        singlePlant.status === 'active'
                          ? 'border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200'
                          : 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingPlant(singlePlant);
                        setIsModalOpen(true);
                      }}
                      title="Edit Plant"
                      className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <MapPin className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Facility Address & Location
                  </div>
                  <div className="text-sm font-medium text-slate-900 mt-1 leading-snug">
                    {singlePlant.address}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-xl">
                <UserCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Plant Manager
                  </div>
                  <div className="text-sm font-medium text-slate-900 mt-1">
                    {singlePlant.manager ? (
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-slate-900 font-semibold">{singlePlant.manager.name}</span>
                        <span className="text-xs text-slate-500">({singlePlant.manager.email})</span>
                        {singlePlant.manager.invite_status === 'pending' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-semibold">
                            Invite Pending
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unassigned Manager</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Key Infrastructure Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div
                onClick={() => navigate(`${basePath}/zones`)}
                className="p-5 bg-indigo-50/50 border border-indigo-100 hover:border-indigo-300 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wider">
                    Operational Zones
                  </span>
                  <div className="p-2 rounded-lg bg-indigo-600 text-white group-hover:scale-105 transition">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  {singlePlant._count?.zones ?? 0}
                </div>
                <div className="text-xs text-indigo-600 mt-1 flex items-center gap-1 font-semibold">
                  Manage Zones <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </div>

              <div
                onClick={() => navigate(`${basePath}/cameras`)}
                className="p-5 bg-teal-50/50 border border-teal-100 hover:border-teal-300 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-teal-900 uppercase tracking-wider">
                    AI Cameras
                  </span>
                  <div className="p-2 rounded-lg bg-teal-600 text-white group-hover:scale-105 transition">
                    <Video className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  {singlePlant._count?.cameras ?? 0}
                </div>
                <div className="text-xs text-teal-600 mt-1 flex items-center gap-1 font-semibold">
                  Monitor Feeds <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </div>

              <div
                onClick={() => navigate(isSuperAdmin || activeRole === 'admin' ? `${basePath}/users` : `${basePath}/qr-entry`)}
                className="p-5 bg-purple-50/50 border border-purple-100 hover:border-purple-300 rounded-xl cursor-pointer transition group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-900 uppercase tracking-wider">
                    Plant Personnel
                  </span>
                  <div className="p-2 rounded-lg bg-purple-600 text-white group-hover:scale-105 transition">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mt-2">
                  {singlePlant._count?.users ?? 0}
                </div>
                <div className="text-xs text-purple-600 mt-1 flex items-center gap-1 font-semibold">
                  {isSuperAdmin || activeRole === 'admin' ? 'Manage Roster' : 'View Attendance'} <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Access Section */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Quick Access & Operations Shortcuts
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Direct operational links for your assigned plant facility.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickAccessShortcuts.map((sc) => (
                <div
                  key={sc.id}
                  onClick={() => navigate(sc.path)}
                  className="p-4 bg-slate-50/60 hover:bg-indigo-50/40 border border-slate-200/80 hover:border-indigo-200 rounded-xl cursor-pointer transition group flex flex-col justify-between"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-indigo-600 shadow-2xs group-hover:border-indigo-300 group-hover:bg-indigo-600 group-hover:text-white transition">
                      {sc.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition flex items-center gap-1">
                        {sc.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {sc.desc}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-indigo-600 flex items-center gap-1 mt-3 pt-2 border-t border-slate-200/60">
                    Open <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* MULTI-PLANT DIRECTORY VIEW OR EMPTY STATE */
        <>
          {/* Search & Filter Controls */}
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
              <CustomSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'active', label: 'Active Plants' },
                  { value: 'inactive', label: 'Inactive Plants' },
                ]}
                className="w-full md:w-44"
                size="sm"
              />
            </div>
          </div>

          {plants.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200/80 rounded-2xl shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Factory className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Plant Facility Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {search || statusFilter
                  ? 'No plants match your current filter parameters. Try clearing the search or status filter.'
                  : 'You do not currently have any assigned plant facilities.'}
              </p>
            </div>
          ) : (
            /* MULTI-PLANT GRID */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {plants.map((p) => (
                <div
                  key={p.id}
                  className={`p-5 bg-white border rounded-2xl shadow-xs flex flex-col justify-between transition group ${
                    p.status === 'active'
                      ? 'border-slate-200/80 hover:border-indigo-300'
                      : 'border-amber-200 bg-amber-50/30'
                  }`}
                >
                  <div>
                    <div
                      onClick={() => navigate(`${basePath}/plants/${p.id}`)}
                      className="flex items-start justify-between gap-3 mb-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                          <Factory className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight group-hover:text-indigo-600 transition flex items-center gap-1.5">
                            {p.name}
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition text-indigo-600" />
                          </h3>
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
                          <span className="text-slate-400 italic">Unassigned</span>
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
                    <button
                      onClick={() => navigate(`${basePath}/plants/${p.id}`)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Plant Details
                    </button>

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
                              if (isOperator || !isSuperAdmin) {
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

                          <button
                            onClick={() => {
                              if (isOperator || !isSuperAdmin) {
                                showForbiddenAlert();
                                return;
                              }
                              setTargetActionPlant({ plant: p, type: 'delete' });
                            }}
                            title="Delete Plant"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {plants.length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
              <Pagination
                meta={meta}
                onPageChange={(pg) => fetchPlants(pg, meta.limit)}
                onLimitChange={(l) => fetchPlants(1, l)}
              />
            </div>
          )}
        </>
      )}

      <PlantModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlant(null);
        }}
        onSubmit={handlePlantSubmit}
        editPlant={editingPlant}
      />

      {targetActionPlant && targetActionPlant.type === 'toggle' && (
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

      {targetActionPlant && targetActionPlant.type === 'delete' && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setTargetActionPlant(null)}
          onConfirm={() => handleDeletePlant(targetActionPlant.plant)}
          title="Delete Industrial Plant Facility?"
          message={`Are you sure you want to permanently delete '${targetActionPlant.plant.name}'? This action cannot be undone and will remove associated operational zones and streams.`}
          confirmText="Delete Facility"
          confirmVariant="danger"
        />
      )}
    </div>
  );
};
