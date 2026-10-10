import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Search, Filter, Play, CheckCircle2, Clock, Eye, MessageSquare, ShieldAlert, RefreshCw, FileText, ChevronRight } from 'lucide-react';
import { incidentsApi } from '../../api/incidentsApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const IncidentReviewDashboard = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const videoRef = useRef(null);

  const [incidents, setIncidents] = useState([]);
  const [plants, setPlants] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPlant, setSelectedPlant] = useState(user?.plant_id ? String(user.plant_id) : '');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Detail Modal state
  const [selectedIncidentDetail, setSelectedIncidentDetail] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('Resolved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMetadata();
  }, []);

  useEffect(() => {
    fetchIncidents();
  }, [selectedPlant, statusFilter, severityFilter]);

  const fetchMetadata = async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        plantsApi.getPlants().catch(() => ({ data: [] })),
        camerasApi.getCameras().catch(() => ({ data: [] })),
      ]);
      setPlants(pRes.data || []);
      setCameras(cRes.data || []);
    } catch (err) {
      console.error('Error fetching metadata:', err);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await incidentsApi.getIncidents({
        plant_id: selectedPlant || undefined,
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
      });
      setIncidents(res.data || []);
    } catch (err) {
      addToast('Failed to load safety incidents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInspectIncident = async (incidentId) => {
    try {
      const detail = await incidentsApi.getIncidentById(incidentId);
      setSelectedIncidentDetail(detail);
      setReviewStatus(detail.incident.status === 'Open' ? 'Under Review' : detail.incident.status);
      setReviewNotes(detail.incident.review_notes || '');
    } catch (err) {
      addToast('Failed to load incident details', 'error');
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedIncidentDetail) return;

    setUpdating(true);
    try {
      await incidentsApi.updateIncidentStatus(selectedIncidentDetail.incident.id, {
        status: reviewStatus,
        notes: reviewNotes,
      });
      addToast(`Incident updated to ${reviewStatus}`, 'success');
      setSelectedIncidentDetail(null);
      fetchIncidents();
    } catch (err) {
      addToast('Failed to update incident status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSeekVideo = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.id.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.violation_category.toLowerCase().includes(q)
    );
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Open':
        return 'bg-red-50 text-red-700 border-red-200 font-semibold';
      case 'Under Review':
        return 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
      case 'Closed':
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            Safety Incidents Review & Verification Dashboard
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Review persistent PPE violations confirmed by background video processing, inspect CCTV video evidence, and manage incident status lifecycles.
          </p>
        </div>

        <button
          onClick={fetchIncidents}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors self-start sm:self-auto"
          title="Refresh Incidents"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Incidents</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{incidents.length}</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-red-500">
          <div className="text-red-700 text-xs font-semibold uppercase tracking-wider">Open Action Required</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {incidents.filter((i) => i.status === 'Open').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-amber-500">
          <div className="text-amber-700 text-xs font-semibold uppercase tracking-wider">Under Investigation</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {incidents.filter((i) => i.status === 'Under Review').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-emerald-500">
          <div className="text-emerald-700 text-xs font-semibold uppercase tracking-wider">Resolved</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {incidents.filter((i) => i.status === 'Resolved' || i.status === 'Closed').length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search incident ID, category, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedPlant}
          onChange={(e) => setSelectedPlant(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Permitted Plants</option>
          {plants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="Under Review">Under Review</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Severities</option>
          <option value="Critical">Critical</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading incidents...
          </div>
        ) : filteredIncidents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            No safety incidents matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Incident ID & Title</th>
                  <th className="px-4 py-3">Plant & Camera</th>
                  <th className="px-4 py-3">Violation Category</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Observed Video Timestamp</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredIncidents.map((inc) => {
                  const plant = plants.find((p) => String(p.id) === String(inc.plant_id));
                  const camera = cameras.find((c) => String(c.id) === String(inc.camera_id));
                  return (
                    <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono font-bold text-slate-900">{inc.id}</div>
                        <div className="text-xs font-medium text-slate-700 mt-0.5">{inc.title}</div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Created: {new Date(inc.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="font-semibold text-slate-900">{plant?.name || `Plant #${inc.plant_id}`}</div>
                        <div className="text-slate-500">{camera?.name || `Camera #${inc.camera_id}`}</div>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-slate-900">
                        {inc.violation_category}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 text-xs rounded-full border ${getSeverityBadgeClass(inc.severity)}`}>
                          {inc.severity}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs font-mono">
                        <div className="font-bold text-slate-900">
                          {inc.first_observed_timestamp}s - {inc.last_observed_timestamp}s
                        </div>
                        <div className="text-slate-400">Confidence: {Math.round((inc.confidence_score || 0.9) * 100)}%</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 text-xs rounded border ${getStatusBadgeClass(inc.status)}`}>
                          {inc.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => handleInspectIncident(inc.id)}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          Review Evidence
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incident Review Evidence Modal */}
      {selectedIncidentDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  Incident Review: {selectedIncidentDetail.incident.id}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{selectedIncidentDetail.incident.title}</div>
              </div>
              <button
                onClick={() => setSelectedIncidentDetail(null)}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CCTV Video Evidence Player */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>CCTV Video Evidence Player</span>
                  <span className="text-indigo-600 font-mono text-[11px]">
                    Seek: {selectedIncidentDetail.incident.first_observed_timestamp}s
                  </span>
                </div>

                <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <video
                    ref={videoRef}
                    controls
                    className="w-full h-full object-contain"
                    src={selectedIncidentDetail.video?.file_path || '/uploads/videos/assembly_line_cctv.mp4'}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSeekVideo(selectedIncidentDetail.incident.first_observed_timestamp || 10)}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    Jump to Violation Frame ({selectedIncidentDetail.incident.first_observed_timestamp}s)
                  </button>
                </div>

                {/* Verification Observations List */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Supporting Persistence Observations ({selectedIncidentDetail.events?.length || 0})
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {(selectedIncidentDetail.events || []).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={() => handleSeekVideo(evt.video_timestamp_seconds)}
                        className="p-2 bg-white rounded border border-slate-200 text-xs flex items-center justify-between hover:bg-slate-100 cursor-pointer"
                      >
                        <span className="font-mono font-bold text-slate-900">@{evt.video_timestamp_seconds}s</span>
                        <span className="text-slate-600 font-medium">{evt.violation_category}</span>
                        <span className="font-semibold text-emerald-700">{Math.round(evt.confidence_score * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Review & Status Action Form */}
              <div className="space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">Incident Metadata & Audit</div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Violation Category:</span>
                      <span className="font-bold text-slate-900">{selectedIncidentDetail.incident.violation_category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Severity:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${getSeverityBadgeClass(selectedIncidentDetail.incident.severity)}`}>
                        {selectedIncidentDetail.incident.severity}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Current Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] ${getStatusBadgeClass(selectedIncidentDetail.incident.status)}`}>
                        {selectedIncidentDetail.incident.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Assigned Reviewer:</span>
                      <span className="font-semibold text-slate-900">{selectedIncidentDetail.incident.assigned_reviewer || 'Unassigned'}</span>
                    </div>
                  </div>

                  {selectedIncidentDetail.incident.review_notes && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                      <div className="font-bold text-amber-900">Audit Review Notes:</div>
                      <p className="text-amber-800">{selectedIncidentDetail.incident.review_notes}</p>
                    </div>
                  )}
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Update Incident Status *
                    </label>
                    <select
                      value={reviewStatus}
                      onChange={(e) => setReviewStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium"
                    >
                      <option value="Open">Open (Action Required)</option>
                      <option value="Under Review">Under Review (Investigating)</option>
                      <option value="Resolved">Resolved (Safety Verified)</option>
                      <option value="Closed">Closed (Archived)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Reviewer Notes & Audit Log
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add investigation details, corrective actions taken, or supervisor sign-off notes..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedIncidentDetail(null)}
                      className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-xs"
                    >
                      {updating ? 'Saving...' : 'Save Audit Decision'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
