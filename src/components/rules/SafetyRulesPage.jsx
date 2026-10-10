import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Search,
  Edit2,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Sliders,
  X,
  Tag,
  Factory,
  Layers,
  Video,
  Target,
} from 'lucide-react';
import { safetyRulesApi } from '../../api/safetyRulesApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { zonesApi } from '../../api/zonesApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { cameraRegionsApi } from '../../api/cameraRegionsApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CustomSelect } from '../common/CustomSelect.jsx';

const PREDEFINED_PPE_SUGGESTIONS = [
  'Safety Helmet',
  'Safety Vest',
  'Safety Goggles',
  'Safety Gloves',
  'Safety Boots',
  'Face Mask',
  'Hearing Protection',
  'Respirator',
  'Face Shield',
  'Safety Harness',
];

export const SafetyRulesPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const userPlantId = user?.plant_id;

  const [rules, setRules] = useState([]);
  const [plants, setPlants] = useState([]);
  const [zones, setZones] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [cameraRegions, setCameraRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedZoneFilter, setSelectedZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    zone_id: '',
    camera_id: '',
    camera_region_id: '',
    required_ppe: ['Safety Helmet', 'Safety Vest'],
    severity: 'High',
    status: 'Active',
    min_observations_required: 6,
    total_observation_window: 10,
    frame_sampling_rate: 5,
    min_confidence_threshold: 0.75,
    cooldown_period_minutes: 5,
  });

  // Custom PPE Input state
  const [customPpeInput, setCustomPpeInput] = useState('');
  const [selectedPpeDropdownValue, setSelectedPpeDropdownValue] = useState('');

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchRules();
  }, [userPlantId, selectedZoneFilter, statusFilter]);

  const fetchMetadata = async () => {
    try {
      const [pRes, zRes, cRes, rRes] = await Promise.all([
        plantsApi.getPlants().catch(() => ({ data: [] })),
        zonesApi.getZones().catch(() => ({ data: [] })),
        camerasApi.getCameras().catch(() => ({ data: [] })),
        cameraRegionsApi.getCameraRegions().catch(() => ({ data: [] })),
      ]);
      setPlants(pRes.data || []);
      setZones(zRes.data || []);
      setCameras(cRes.data || []);
      setCameraRegions(rRes.data || []);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const res = await safetyRulesApi.getSafetyRules({
        plant_id: userPlantId ? String(userPlantId) : undefined,
        zone_id: selectedZoneFilter || undefined,
        status: statusFilter || undefined,
      });
      setRules(res.data || []);
    } catch (err) {
      addToast('Failed to load safety rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (rule = null) => {
    setFormError('');
    setCustomPpeInput('');
    setSelectedPpeDropdownValue('');

    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name || '',
        description: rule.description || '',
        zone_id: rule.zone_id ? String(rule.zone_id) : '',
        camera_id: rule.camera_id ? String(rule.camera_id) : '',
        camera_region_id: rule.camera_region_id ? String(rule.camera_region_id) : '',
        required_ppe: Array.isArray(rule.required_ppe) && rule.required_ppe.length > 0
          ? rule.required_ppe
          : ['Safety Helmet', 'Safety Vest'],
        severity: rule.severity || 'High',
        status: rule.status || 'Active',
        min_observations_required: rule.min_observations_required || 6,
        total_observation_window: rule.total_observation_window || 10,
        frame_sampling_rate: rule.frame_sampling_rate || 5,
        min_confidence_threshold: rule.min_confidence_threshold || 0.75,
        cooldown_period_minutes: rule.cooldown_period_minutes || 5,
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        description: '',
        zone_id: '',
        camera_id: '',
        camera_region_id: '',
        required_ppe: ['Safety Helmet', 'Safety Vest'],
        severity: 'High',
        status: 'Active',
        min_observations_required: 6,
        total_observation_window: 10,
        frame_sampling_rate: 5,
        min_confidence_threshold: 0.75,
        cooldown_period_minutes: 5,
      });
    }
    setIsModalOpen(true);
  };

  // Add Custom PPE
  const handleAddCustomPpe = (e) => {
    if (e) e.preventDefault();
    const trimmed = customPpeInput.trim();
    if (!trimmed) {
      addToast('Please enter a valid PPE equipment name', 'warning');
      return;
    }

    const isDuplicate = formData.required_ppe.some(
      (item) => item.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      addToast(`PPE '${trimmed}' is already selected`, 'warning');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      required_ppe: [...prev.required_ppe, trimmed],
    }));
    setCustomPpeInput('');
    addToast(`Added custom PPE: "${trimmed}"`, 'success');
  };

  // Add Predefined PPE from Select Dropdown
  const handleSelectPredefinedPpe = (val) => {
    if (!val) return;
    const isDuplicate = formData.required_ppe.some(
      (item) => item.toLowerCase() === val.toLowerCase()
    );
    if (isDuplicate) {
      addToast(`PPE '${val}' is already selected`, 'warning');
      setSelectedPpeDropdownValue('');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      required_ppe: [...prev.required_ppe, val],
    }));
    setSelectedPpeDropdownValue('');
  };

  // Toggle PPE suggestion pill directly
  const handleTogglePpeSuggestion = (item) => {
    const isSelected = formData.required_ppe.some(
      (p) => p.toLowerCase() === item.toLowerCase()
    );
    if (isSelected) {
      if (formData.required_ppe.length === 1) {
        addToast('At least one PPE equipment item must remain selected', 'warning');
        return;
      }
      setFormData((prev) => ({
        ...prev,
        required_ppe: prev.required_ppe.filter(
          (p) => p.toLowerCase() !== item.toLowerCase()
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        required_ppe: [...prev.required_ppe, item],
      }));
    }
  };

  // Remove individual PPE tag
  const handleRemovePpeTag = (itemToRemove) => {
    if (formData.required_ppe.length === 1) {
      addToast('At least one PPE equipment item must remain selected', 'warning');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      required_ppe: prev.required_ppe.filter((item) => item !== itemToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!userPlantId) {
      setFormError('Your account is not assigned to a plant. Cannot save safety rule.');
      return;
    }

    if (!formData.name.trim()) {
      setFormError('Rule name is required.');
      return;
    }

    if (!formData.required_ppe || formData.required_ppe.length === 0) {
      setFormError('At least one required PPE equipment item must be selected.');
      return;
    }

    if (formData.min_observations_required > formData.total_observation_window) {
      setFormError(
        `Minimum confirm observations (${formData.min_observations_required}) cannot exceed total observation window (${formData.total_observation_window}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        plant_id: userPlantId, // Automatically associated with logged-in admin's assigned plant
      };

      if (editingRule) {
        await safetyRulesApi.updateSafetyRule(editingRule.id, payload);
        addToast('Safety rule updated successfully', 'success');
      } else {
        await safetyRulesApi.createSafetyRule(payload);
        addToast('Safety rule created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchRules();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to save safety rule';
      setFormError(msg);
      addToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (ruleId) => {
    try {
      await safetyRulesApi.toggleSafetyRuleStatus(ruleId);
      addToast('Safety rule status updated', 'success');
      fetchRules();
    } catch (err) {
      addToast('Failed to toggle rule status', 'error');
    }
  };

  const userPlant = plants.find((p) => String(p.id) === String(userPlantId));

  const filteredRules = rules.filter((r) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchDesc = r.description && r.description.toLowerCase().includes(q);
      const matchPpe = r.required_ppe && r.required_ppe.some((p) => p.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchPpe) return false;
    }
    return true;
  });

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-300 font-semibold';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
      case 'Medium':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
    }
  };

  // Helper to check if a PPE string is predefined
  const isPredefined = (item) =>
    PREDEFINED_PPE_SUGGESTIONS.some((p) => p.toLowerCase() === item.toLowerCase());

  // Available zones for user's assigned plant
  const plantZones = zones.filter((z) => String(z.plant_id) === String(userPlantId));

  // Available cameras for selected zone
  const zoneCameras = formData.zone_id
    ? cameras.filter((c) => String(c.zone_id) === String(formData.zone_id))
    : cameras.filter((c) => String(c.plant_id) === String(userPlantId));

  // Available regions for selected camera
  const cameraRegionsFiltered = formData.camera_id
    ? cameraRegions.filter((r) => String(r.camera_id) === String(formData.camera_id))
    : cameraRegions;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Safety Rules Management
          </div>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Enforce PPE compliance, frame persistence verification, and cooldown rules for</span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
              <Factory className="w-3.5 h-3.5 text-indigo-600" />
              {userPlant?.name || (userPlantId ? `Plant #${userPlantId}` : 'No Assigned Plant')}
            </span>
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={!userPlantId}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Create Safety Rule
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search rules by name, description, or PPE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
        </div>

        {/* Zone Filter */}
        <div className="w-48">
          <CustomSelect
            value={selectedZoneFilter}
            onChange={(e) => setSelectedZoneFilter(e.target.value)}
            options={[
              { value: '', label: 'All Zones' },
              ...plantZones.map((z) => ({ value: z.id, label: z.name })),
            ]}
            placeholder="All Zones"
            size="md"
          />
        </div>

        {/* Status Filter */}
        <div className="w-36">
          <CustomSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
            placeholder="All Statuses"
            size="md"
          />
        </div>

        <button
          onClick={fetchRules}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          title="Refresh Rules"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Safety Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading safety rules...
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            No safety rules configured matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Rule Name & Details</th>
                  <th className="px-4 py-3">Required PPE Equipment</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Verification Specs</th>
                  <th className="px-4 py-3">Cooldown</th>
                  <th className="px-4 py-3">Status & Version</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{rule.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{rule.description || 'No description provided.'}</div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>Plant: <strong className="text-slate-600">{userPlant?.name || `Plant #${rule.plant_id}`}</strong></span>
                        {rule.zone_id && <span>| Zone #{rule.zone_id}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {rule.required_ppe.map((ppe) => {
                          const predefined = isPredefined(ppe);
                          return (
                            <span
                              key={ppe}
                              className={`px-2 py-0.5 text-xs rounded-md font-medium border flex items-center gap-1 ${
                                predefined
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : 'bg-amber-50 text-amber-900 border-amber-300'
                              }`}
                            >
                              {!predefined && (
                                <span className="text-[9px] font-bold font-mono uppercase bg-amber-200/80 text-amber-800 px-1 py-0.2 rounded">
                                  Custom
                                </span>
                              )}
                              {ppe}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 text-xs rounded-full border ${getSeverityBadgeClass(rule.severity)}`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs space-y-1">
                      <div>
                        Threshold:{' '}
                        <span className="font-semibold text-slate-900">
                          {rule.min_observations_required} / {rule.total_observation_window} frames
                        </span>
                      </div>
                      <div className="text-slate-500">
                        Sampling: <span className="font-medium text-slate-700">Every {rule.frame_sampling_rate}th frame</span>
                      </div>
                      <div className="text-slate-500">
                        Min Confidence:{' '}
                        <span className="font-medium text-slate-700">{Math.round(rule.min_confidence_threshold * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="font-medium text-slate-800">{rule.cooldown_period_minutes} min</span>
                      <div className="text-[11px] text-slate-400">Deduplication window</div>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium border ${
                            rule.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {rule.status}
                        </span>
                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded border border-slate-200">
                          v{rule.version || 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(rule.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                          title={rule.status === 'Active' ? 'Deactivate Rule' : 'Activate Rule'}
                        >
                          {rule.status === 'Active' ? (
                            <ToggleRight className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenModal(rule)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit Rule Configuration"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[88vh] flex flex-col overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-200 shrink-0 bg-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-900 font-bold text-base sm:text-lg">
                  <Sliders className="w-5 h-5 text-indigo-600" />
                  {editingRule ? `Edit Safety Rule (v${editingRule.version || 1})` : 'Create Safety Rule'}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                  <span>Assigned Plant:</span>
                  <span className="font-semibold text-slate-900 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 text-[11px]">
                    {userPlant?.name || (userPlantId ? `Plant #${userPlantId}` : 'Unassigned')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold p-1 rounded-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Error Banner */}
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {!userPlantId && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Your user account is not assigned to a plant. Please contact an administrator to assign a plant before creating rules.</span>
                </div>
              )}

              {/* Rule Name & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Assembly Line PPE Compliance"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe enforcement scope, hazardous conditions, or location context..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Optional Zone & Camera Selection (CustomSelect) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Applicable Zone (Optional)
                  </label>
                  <CustomSelect
                    value={formData.zone_id}
                    onChange={(e) => setFormData({ ...formData, zone_id: e.target.value, camera_id: '', camera_region_id: '' })}
                    options={[
                      { value: '', label: 'All Plant Zones' },
                      ...plantZones.map((z) => ({ value: z.id, label: z.name })),
                    ]}
                    placeholder="All Plant Zones"
                    size="md"
                    icon={Layers}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Applicable Camera (Optional)
                  </label>
                  <CustomSelect
                    value={formData.camera_id}
                    onChange={(e) => setFormData({ ...formData, camera_id: e.target.value, camera_region_id: '' })}
                    options={[
                      { value: '', label: 'All Cameras in Zone' },
                      ...zoneCameras.map((c) => ({ value: c.id, label: c.name || `Camera #${c.id}` })),
                    ]}
                    placeholder="All Cameras in Zone"
                    size="md"
                    icon={Video}
                  />
                </div>
              </div>

              {/* Violation Severity & Rule Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Violation Severity *
                  </label>
                  <CustomSelect
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    options={[
                      { value: 'Low', label: 'Low Severity' },
                      { value: 'Medium', label: 'Medium Severity' },
                      { value: 'High', label: 'High Severity' },
                      { value: 'Critical', label: 'Critical Severity' },
                    ]}
                    placeholder="Select Severity"
                    size="md"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Rule Initial Status *
                  </label>
                  <CustomSelect
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    options={[
                      { value: 'Active', label: 'Active (Enforced)' },
                      { value: 'Inactive', label: 'Inactive (Disabled)' },
                    ]}
                    placeholder="Select Status"
                    size="md"
                  />
                </div>
              </div>

              {/* IMPROVED REQUIRED PPE EQUIPMENT CONTROL */}
              <div className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-indigo-600" />
                    Required PPE Equipment *
                  </label>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {formData.required_ppe.length} Selected
                  </span>
                </div>

                {/* Predefined PPE Dropdown + Custom PPE Input Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Select Predefined PPE */}
                  <div>
                    <CustomSelect
                      value={selectedPpeDropdownValue}
                      onChange={(e) => handleSelectPredefinedPpe(e.target.value)}
                      options={[
                        { value: '', label: '+ Add Suggested PPE...' },
                        ...PREDEFINED_PPE_SUGGESTIONS.map((item) => ({
                          value: item,
                          label: formData.required_ppe.some(
                            (p) => p.toLowerCase() === item.toLowerCase()
                          )
                            ? `✓ ${item} (Selected)`
                            : item,
                        })),
                      ]}
                      placeholder="+ Add Suggested PPE..."
                      size="md"
                    />
                  </div>

                  {/* Add Custom PPE Entry Input */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="Or enter custom PPE (e.g. Welding Apron)..."
                      value={customPpeInput}
                      onChange={(e) => setCustomPpeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCustomPpe(e);
                      }}
                      className="flex-1 px-3 py-2 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomPpe}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add
                    </button>
                  </div>
                </div>

                {/* Quick Toggle Suggestions Pills */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">Quick Suggestions:</div>
                  <div className="flex flex-wrap gap-1">
                    {PREDEFINED_PPE_SUGGESTIONS.map((item) => {
                      const isSelected = formData.required_ppe.some(
                        (p) => p.toLowerCase() === item.toLowerCase()
                      );
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handleTogglePpeSuggestion(item)}
                          className={`px-2 py-0.5 text-[11px] rounded-lg border font-medium transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          {isSelected ? `✓ ${item}` : `+ ${item}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected PPE Tags Container */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 mb-1">Currently Selected Items:</div>
                  <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white rounded-xl border border-slate-200">
                    {formData.required_ppe.length === 0 ? (
                      <div className="text-xs text-slate-400 italic">No PPE equipment selected. Select from suggestions or add custom.</div>
                    ) : (
                      formData.required_ppe.map((item) => {
                        const predefined = isPredefined(item);
                        return (
                          <span
                            key={item}
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-lg font-semibold border shadow-2xs ${
                              predefined
                                ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            {!predefined && (
                              <span className="text-[9px] font-bold font-mono uppercase bg-amber-200/90 text-amber-800 px-1 py-0.2 rounded">
                                Custom
                              </span>
                            )}
                            <span>{item}</span>
                            <button
                              type="button"
                              onClick={() => handleRemovePpeTag(item)}
                              className="text-slate-400 hover:text-red-600 rounded-full p-0.5 hover:bg-slate-200/60 transition-colors cursor-pointer"
                              title={`Remove ${item}`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Persistence & Verification Settings */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Persistence & Detection Thresholds
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Min Confirm Observations *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      required
                      value={formData.min_observations_required}
                      onChange={(e) =>
                        setFormData({ ...formData, min_observations_required: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Frames required to confirm</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Total Observation Window *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      required
                      value={formData.total_observation_window}
                      onChange={(e) =>
                        setFormData({ ...formData, total_observation_window: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Total sampled frames window</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Frame Sampling Rate *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      required
                      value={formData.frame_sampling_rate}
                      onChange={(e) => setFormData({ ...formData, frame_sampling_rate: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Analyze every Nth frame</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Min Confidence Threshold *
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min={0.5}
                      max={0.99}
                      required
                      value={formData.min_confidence_threshold}
                      onChange={(e) =>
                        setFormData({ ...formData, min_confidence_threshold: parseFloat(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Minimum AI confidence (e.g. 0.75)</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Cooldown Period (Min) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      required
                      value={formData.cooldown_period_minutes}
                      onChange={(e) =>
                        setFormData({ ...formData, cooldown_period_minutes: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300/90 rounded-xl text-xs sm:text-sm text-slate-900"
                    />
                    <span className="text-[10px] text-slate-400">Deduplication window</span>
                  </div>
                </div>
              </div >

              {/* Actions Footer */}
              <div className="px-5 py-3 border-t border-slate-200 shrink-0 bg-slate-50/80 rounded-b-2xl flex items-center justify-end gap-3 -mx-5 -mb-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300/90 text-slate-700 hover:bg-slate-100 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !userPlantId}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingRule ? 'Save & Increment Version' : 'Create Safety Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
