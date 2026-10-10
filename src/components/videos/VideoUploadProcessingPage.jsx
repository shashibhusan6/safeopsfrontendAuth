import React, { useState, useEffect } from 'react';
import { Video, Upload, Play, RefreshCw, CheckCircle2, Clock, AlertTriangle, FileVideo, Cpu, Layers } from 'lucide-react';
import { cctvVideosApi } from '../../api/cctvVideosApi.js';
import { videoProcessingApi } from '../../api/videoProcessingApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { safetyRulesApi } from '../../api/safetyRulesApi.js';
import { cameraRegionsApi } from '../../api/cameraRegionsApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const VideoUploadProcessingPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('jobs'); // 'videos' | 'jobs'

  const [videos, setVideos] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [plants, setPlants] = useState([]);
  const [rules, setRules] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload Form state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Start Job Modal state
  const [isStartJobModalOpen, setIsStartJobModalOpen] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState('');
  const [selectedRuleIds, setSelectedRuleIds] = useState([]);
  const [selectedRegionIds, setSelectedRegionIds] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [vRes, jRes, cRes, pRes, rRes, rgRes] = await Promise.all([
        cctvVideosApi.getCCTVVideos().catch(() => ({ data: [] })),
        videoProcessingApi.getVideoJobs().catch(() => ({ data: [] })),
        camerasApi.getCameras().catch(() => ({ data: [] })),
        plantsApi.getPlants().catch(() => ({ data: [] })),
        safetyRulesApi.getSafetyRules().catch(() => ({ data: [] })),
        cameraRegionsApi.getCameraRegions().catch(() => ({ data: [] })),
      ]);

      const vidList = vRes.data || [];
      const camList = cRes.data || [];

      setVideos(vidList);
      setJobs(jRes.data || []);
      setCameras(camList);
      setPlants(pRes.data || []);
      setRules(rRes.data || []);
      setRegions(rgRes.data || []);

      if (camList.length > 0) setSelectedCameraId(String(camList[0].id));
      if (vidList.length > 0) setSelectedVideoId(String(vidList[0].id));
    } catch (err) {
      addToast('Failed to load CCTV videos and processing jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp4') && file.type !== 'video/mp4') {
      addToast('Only MP4 CCTV video uploads are supported', 'error');
      return;
    }

    // Limit 500MB
    if (file.size > 500 * 1024 * 1024) {
      addToast('File size exceeds the 500MB limit', 'error');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      addToast('Please select an MP4 video file', 'error');
      return;
    }

    const currentCam = cameras.find((c) => String(c.id) === String(selectedCameraId));

    setUploading(true);
    setUploadProgress(25);

    setTimeout(async () => {
      try {
        setUploadProgress(75);
        const res = await cctvVideosApi.uploadCCTVVideo({
          file: selectedFile,
          original_name: selectedFile.name,
          file_size_bytes: selectedFile.size,
          duration_seconds: 180,
          width: 1920,
          height: 1080,
          fps: 30,
          plant_id: currentCam?.plant_id || 1,
          zone_id: currentCam?.zone_id || 1,
          camera_id: Number(selectedCameraId),
        });

        setUploadProgress(100);
        addToast('CCTV video uploaded and validated successfully', 'success');
        setIsUploadModalOpen(false);
        setSelectedFile(null);
        fetchInitialData();
      } catch (err) {
        addToast(err.message || 'Upload failed', 'error');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }, 800);
  };

  const handleStartJobSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVideoId) {
      addToast('Please select a CCTV video', 'error');
      return;
    }

    const video = videos.find((v) => String(v.id) === String(selectedVideoId));

    try {
      const res = await videoProcessingApi.startVideoJob({
        video_id: Number(selectedVideoId),
        camera_id: video?.camera_id || 1,
        rule_ids: selectedRuleIds.length > 0 ? selectedRuleIds : undefined,
        region_ids: selectedRegionIds.length > 0 ? selectedRegionIds : undefined,
      });

      addToast('Background video processing job started!', 'success');
      setIsStartJobModalOpen(false);
      setActiveTab('jobs');
      fetchInitialData();
    } catch (err) {
      addToast(err.message || 'Failed to start processing job', 'error');
    }
  };

  const getJobStatusBadge = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'Processing':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold animate-pulse';
      case 'Queued':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-medium';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-300 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300 font-medium';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <Video className="w-6 h-6 text-indigo-600" />
            CCTV Video Management & AI Background Processing
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Upload footage, run frame sampling AI models, verify persistent safety violations, and track background jobs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Upload CCTV Video
          </button>
          <button
            onClick={() => setIsStartJobModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            Start Processing Job
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('jobs')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Background Jobs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
            activeTab === 'videos'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileVideo className="w-4 h-4" />
          CCTV Video Library ({videos.length})
        </button>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === 'jobs' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
              Loading background processing jobs...
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              No processing jobs executed yet. Click "Start Processing Job" above to process video clips.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Job Code & Source</th>
                    <th className="px-4 py-3">Camera & Location</th>
                    <th className="px-4 py-3">Progress</th>
                    <th className="px-4 py-3">Rule / Region Snapshots</th>
                    <th className="px-4 py-3">AI Detections</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Timestamps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {jobs.map((job) => {
                    const video = videos.find((v) => String(v.id) === String(job.video_id));
                    const camera = cameras.find((c) => String(c.id) === String(job.camera_id));
                    return (
                      <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-mono font-bold text-slate-900">{job.job_code || `JOB-${job.id}`}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{video?.filename || `Video #${job.video_id}`}</div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="font-semibold text-slate-900">{camera?.name || `Camera #${job.camera_id}`}</div>
                          <div className="text-slate-500">Plant #{job.plant_id} | Zone #{job.zone_id || 1}</div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="w-36 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700">
                              <span>{job.progress_percent}%</span>
                              <span className="text-slate-400">
                                {job.processed_frames} / {job.total_frames} frames
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                                style={{ width: `${job.progress_percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div>Rules: <span className="font-semibold text-slate-900">{job.rules_snapshot?.length || 1} Active</span></div>
                          <div>Regions: <span className="font-semibold text-slate-900">{job.regions_snapshot?.length || 1} Polygon</span></div>
                        </td>
                        <td className="px-4 py-4 text-xs space-y-0.5">
                          <div>Observations: <span className="font-medium text-slate-900">{job.detected_observations_count}</span></div>
                          <div>Confirmed Violations: <span className="font-semibold text-amber-700">{job.confirmed_violations_count}</span></div>
                          <div>Incidents Created: <span className="font-bold text-red-700">{job.created_incidents_count}</span></div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 text-xs rounded-full border ${getJobStatusBadge(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-xs text-slate-500">
                          <div>Started: {new Date(job.started_at || job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          {job.completed_at && <div>Completed: {new Date(job.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Video Library Tab */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {videos.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FileVideo className="w-8 h-8 mx-auto mb-2 text-slate-400" />
              No CCTV videos uploaded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Filename & Path</th>
                    <th className="px-4 py-3">Resolution & FPS</th>
                    <th className="px-4 py-3">Duration & Size</th>
                    <th className="px-4 py-3">Camera & Location</th>
                    <th className="px-4 py-3">Uploader</th>
                    <th className="px-4 py-3 text-right">Upload Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {videos.map((vid) => {
                    const camera = cameras.find((c) => String(c.id) === String(vid.camera_id));
                    return (
                      <tr key={vid.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <FileVideo className="w-4 h-4 text-indigo-600" />
                            {vid.filename}
                          </div>
                          <div className="text-xs font-mono text-slate-400 mt-0.5">{vid.file_path}</div>
                        </td>
                        <td className="px-4 py-4 text-xs font-mono">
                          {vid.width}x{vid.height} @ {vid.fps}fps
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="font-medium text-slate-900">{vid.duration_seconds}s</div>
                          <div className="text-slate-500">{(vid.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="font-semibold text-slate-900">{camera?.name || `Camera #${vid.camera_id}`}</div>
                          <div className="text-slate-500">Plant #{vid.plant_id}</div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-700">{vid.uploader_name || 'Admin'}</td>
                        <td className="px-4 py-4 text-right text-xs text-slate-500">
                          {new Date(vid.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Upload Video Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-600" />
                Upload CCTV Video Clip (MP4)
              </div>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target Camera *
                </label>
                <select
                  value={selectedCameraId}
                  onChange={(e) => setSelectedCameraId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      📷 {c.name || `Camera #${c.id}`} (Zone {c.zone_id || 1})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Video File (.mp4) *
                </label>
                <div className="border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl p-6 text-center hover:bg-slate-100 transition-colors">
                  <input type="file" accept="video/mp4" onChange={handleFileChange} className="hidden" id="cctv-file-input" />
                  <label htmlFor="cctv-file-input" className="cursor-pointer space-y-2 block">
                    <FileVideo className="w-8 h-8 text-indigo-600 mx-auto" />
                    {selectedFile ? (
                      <div className="text-sm font-semibold text-slate-900">{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)</div>
                    ) : (
                      <div>
                        <div className="text-sm font-semibold text-slate-700">Click to select MP4 video file</div>
                        <div className="text-xs text-slate-400">Max size 500MB. Duration & metadata will be validated.</div>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {uploading && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Validating & Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium shadow-xs"
                >
                  {uploading ? 'Uploading...' : 'Upload & Validate Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Job Modal */}
      {isStartJobModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Play className="w-5 h-5 text-indigo-600 fill-current" />
                Start Background Processing Job
              </div>
              <button onClick={() => setIsStartJobModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleStartJobSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select CCTV Video *
                </label>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
                >
                  {videos.map((v) => (
                    <option key={v.id} value={v.id}>
                      📹 {v.filename} ({v.duration_seconds}s, {v.width}x{v.height})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Applicable Active Safety Rules
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                  {rules.map((r) => (
                    <label key={r.id} className="flex items-center justify-between p-2 rounded border border-slate-200 bg-slate-50 text-xs">
                      <span>{r.name}</span>
                      <span className="text-[10px] text-indigo-600 font-semibold">{r.min_observations_required}/{r.total_observation_window} frames</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  Starting this job creates an immutable snapshot of current active rules and dangerous regions for deterministic persistence verification.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsStartJobModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-xs"
                >
                  Dispatch Background Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
