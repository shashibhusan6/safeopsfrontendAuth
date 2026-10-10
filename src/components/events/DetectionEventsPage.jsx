import React, { useState, useEffect } from 'react';
import { Eye, Search, Filter, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Layers, Calendar, Cpu } from 'lucide-react';
import { detectionEventsApi } from '../../api/detectionEventsApi.js';
import { videoProcessingApi } from '../../api/videoProcessingApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const DetectionEventsPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [events, setEvents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState('');
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [confirmedFilter, setConfirmedFilter] = useState('');

  // Selected Detail Modal
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [selectedJobId, selectedCameraId, confirmedFilter]);

  const fetchInitialData = async () => {
    try {
      const [jRes, cRes] = await Promise.all([
        videoProcessingApi.getVideoJobs().catch(() => ({ data: [] })),
        camerasApi.getCameras().catch(() => ({ data: [] })),
      ]);
      setJobs(jRes.data || []);
      setCameras(cRes.data || []);
    } catch (err) {
      console.error('Error loading metadata:', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await detectionEventsApi.getDetectionEvents({
        job_id: selectedJobId || undefined,
        camera_id: selectedCameraId || undefined,
        is_confirmed: confirmedFilter ? confirmedFilter === 'true' : undefined,
      });
      setEvents(res.data || []);
    } catch (err) {
      addToast('Failed to load AI detection observations', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <Eye className="w-6 h-6 text-indigo-600" />
            Computer Vision AI Detection Observations
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Raw candidate observations, confidence scores, bounding boxes, and region intersection records generated during background frame processing.
          </p>
        </div>

        <button
          onClick={fetchEvents}
          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors self-start sm:self-auto"
          title="Refresh Events"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <select
          value={selectedJobId}
          onChange={(e) => setSelectedJobId(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Processing Jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.job_code || `Job #${j.id}`}
            </option>
          ))}
        </select>

        <select
          value={selectedCameraId}
          onChange={(e) => setSelectedCameraId(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Cameras</option>
          {cameras.map((c) => (
            <option key={c.id} value={c.id}>
              📷 {c.name || `Camera #${c.id}`}
            </option>
          ))}
        </select>

        <select
          value={confirmedFilter}
          onChange={(e) => setConfirmedFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Observations</option>
          <option value="true">Confirmed Violations Only</option>
          <option value="false">Candidate / Transient Only</option>
        </select>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading AI detection events...
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            No AI detection events found matching your filter criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3">Event ID & Category</th>
                  <th className="px-4 py-3">Job & Camera</th>
                  <th className="px-4 py-3">Video Timestamp & Frame</th>
                  <th className="px-4 py-3">AI Confidence</th>
                  <th className="px-4 py-3">Region Intersection</th>
                  <th className="px-4 py-3">Persistence State</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {events.map((evt) => {
                  const camera = cameras.find((c) => String(c.id) === String(evt.camera_id));
                  return (
                    <tr key={evt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{evt.violation_category}</div>
                        <div className="text-xs font-mono text-slate-400 mt-0.5">EVT-{evt.id}</div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="font-semibold text-slate-900">{camera?.name || `Camera #${evt.camera_id}`}</div>
                        <div className="text-slate-500">Job #{evt.job_id}</div>
                      </td>
                      <td className="px-4 py-4 text-xs font-mono">
                        <div className="font-bold text-slate-900">{evt.video_timestamp_seconds}s in clip</div>
                        <div className="text-slate-400">Frame #{evt.frame_number}</div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <span className="font-bold text-slate-900">{Math.round(evt.confidence_score * 100)}%</span>
                        <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              evt.confidence_score >= 0.85 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${evt.confidence_score * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 text-xs">
                        {evt.is_inside_region ? (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded font-medium">
                            Inside Region
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Outside Region</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          {evt.is_confirmed ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Confirmed ({evt.observation_index}/{evt.total_window})
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              Candidate ({evt.observation_index}/{evt.total_window})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-medium cursor-pointer"
                        >
                          Inspect
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

      {/* Selected Event Inspection Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                Detection Observation Details
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm">{selectedEvent.violation_category}</div>
                <div className="text-slate-500">Event ID: EVT-{selectedEvent.id} | Job ID: #{selectedEvent.job_id}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Timestamp</div>
                  <div className="font-bold text-slate-900">{selectedEvent.video_timestamp_seconds}s</div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <div className="text-slate-500 text-[11px]">Model Confidence</div>
                  <div className="font-bold text-slate-900">{Math.round(selectedEvent.confidence_score * 100)}%</div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-slate-700 mb-1">Bounding Box Coordinates:</div>
                <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
                  {JSON.stringify(selectedEvent.bounding_box, null, 2)}
                </pre>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
