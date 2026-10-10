import React, { useState, useEffect, useRef } from 'react';
import { Target, Plus, RotateCcw, Trash2, Save, Layers, CheckCircle2, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { cameraRegionsApi } from '../../api/cameraRegionsApi.js';
import { camerasApi } from '../../api/camerasApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { safetyRulesApi } from '../../api/safetyRulesApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export const CameraRegionEditor = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [cameras, setCameras] = useState([]);
  const [plants, setPlants] = useState([]);
  const [rules, setRules] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected State
  const [selectedPlant, setSelectedPlant] = useState(user?.plant_id ? String(user.plant_id) : '1');
  const [selectedCameraId, setSelectedCameraId] = useState('');

  // Polygon Drawing state (Normalized points 0..1)
  const [points, setPoints] = useState([]); // Array of {x: float, y: float}
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 450 });

  // Save Modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [regionName, setRegionName] = useState('');
  const [regionDescription, setRegionDescription] = useState('');
  const [selectedRules, setSelectedRules] = useState([]);

  // Sample Camera snapshot image URL
  const sampleFrameUrl = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80';

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCameraId) {
      fetchRegionsForCamera(selectedCameraId);
    }
  }, [selectedCameraId]);

  useEffect(() => {
    drawCanvas();
  }, [points, regions, canvasDimensions, selectedCameraId]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, rRes] = await Promise.all([
        camerasApi.getCameras().catch(() => ({ data: [] })),
        plantsApi.getPlants().catch(() => ({ data: [] })),
        safetyRulesApi.getSafetyRules().catch(() => ({ data: [] })),
      ]);
      const camList = cRes.data || [];
      setCameras(camList);
      setPlants(pRes.data || []);
      setRules(rRes.data || []);

      if (camList.length > 0) {
        setSelectedCameraId(String(camList[0].id));
      }
    } catch (err) {
      addToast('Failed to load cameras or rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchRegionsForCamera = async (camId) => {
    try {
      const res = await cameraRegionsApi.getCameraRegions({ camera_id: camId });
      setRegions(res.data || []);
    } catch (err) {
      console.error('Error fetching camera regions:', err);
    }
  };

  const handleCanvasClick = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to normalized coordinates (0..1)
    const normX = Number((clickX / rect.width).toFixed(4));
    const normY = Number((clickY / rect.height).toFixed(4));

    setPoints((prev) => [...prev, { x: normX, y: normY }]);
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvasDimensions;

    ctx.clearRect(0, 0, width, height);

    // Draw saved existing regions
    regions.forEach((region, index) => {
      if (!region.polygon_points || region.polygon_points.length < 3) return;

      ctx.beginPath();
      const first = region.polygon_points[0];
      ctx.moveTo(first.x * width, first.y * height);

      for (let i = 1; i < region.polygon_points.length; i++) {
        const pt = region.polygon_points[i];
        ctx.lineTo(pt.x * width, pt.y * height);
      }
      ctx.closePath();

      // Style existing region
      ctx.fillStyle = 'rgba(79, 70, 229, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#4F46E5';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw label
      if (region.polygon_points[0]) {
        const lx = region.polygon_points[0].x * width;
        const ly = region.polygon_points[0].y * height;
        ctx.fillStyle = '#4F46E5';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(`📍 ${region.name}`, lx + 6, ly - 6);
      }
    });

    // Draw currently active points being drawn
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);

      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x * width, points[i].y * height);
      }

      if (points.length >= 3) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.fill();
      }

      ctx.strokeStyle = '#EF4444';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw vertices
      points.forEach((pt, idx) => {
        ctx.beginPath();
        ctx.arc(pt.x * width, pt.y * height, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(String(idx + 1), pt.x * width + 8, pt.y * height + 4);
      });
    }
  };

  const handleUndoPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  const handleClearPoints = () => {
    setPoints([]);
  };

  const handleOpenSaveModal = () => {
    if (points.length < 3) {
      addToast('A valid dangerous region polygon requires at least 3 points', 'warning');
      return;
    }
    setRegionName('');
    setRegionDescription('');
    setSelectedRules([]);
    setIsSaveModalOpen(true);
  };

  const handleSaveRegion = async (e) => {
    e.preventDefault();
    if (!regionName.trim()) {
      addToast('Region name is required', 'error');
      return;
    }

    const currentCam = cameras.find((c) => String(c.id) === String(selectedCameraId));

    try {
      await cameraRegionsApi.createCameraRegion({
        name: regionName,
        description: regionDescription,
        plant_id: currentCam?.plant_id || Number(selectedPlant) || 1,
        zone_id: currentCam?.zone_id || null,
        camera_id: Number(selectedCameraId),
        safety_rule_ids: selectedRules,
        polygon_points: points,
        original_canvas_width: canvasDimensions.width,
        original_canvas_height: canvasDimensions.height,
        status: 'Active',
      });

      addToast('Camera region saved successfully', 'success');
      setIsSaveModalOpen(false);
      setPoints([]);
      fetchRegionsForCamera(selectedCameraId);
    } catch (err) {
      addToast(err.message || 'Failed to save camera region', 'error');
    }
  };

  const handleToggleRuleSelect = (ruleId) => {
    setSelectedRules((prev) => (prev.includes(ruleId) ? prev.filter((id) => id !== ruleId) : [...prev, ruleId]));
  };

  const selectedCamera = cameras.find((c) => String(c.id) === String(selectedCameraId));

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <Target className="w-6 h-6 text-indigo-600" />
            Camera Region Editor (Dangerous Monitored Areas)
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Draw custom polygon regions on CCTV camera feeds to define monitored hazard zones and associate them with safety rules.
          </p>
        </div>

        {/* Camera Selector */}
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={selectedCameraId}
            onChange={(e) => setSelectedCameraId(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-indigo-500"
          >
            {cameras.map((c) => (
              <option key={c.id} value={c.id}>
                📷 {c.name || `Camera #${c.id}`} (Zone {c.zone_id || 1})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Canvas Drawing Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-md text-white">
            <div className="flex items-center justify-between mb-3 text-xs">
              <div className="flex items-center gap-2 font-mono text-slate-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE CANVAS FEED: {selectedCamera?.name || 'Selected Camera'} ({canvasDimensions.width}x
                {canvasDimensions.height})
              </div>
              <div className="text-slate-400">
                Points Placed: <span className="font-bold text-white">{points.length}</span> (Normalized [0,1])
              </div>
            </div>

            {/* Interactive Drawing Frame */}
            <div className="relative w-full aspect-video bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
              <img
                src={sampleFrameUrl}
                alt="Camera Frame"
                className="absolute inset-0 w-full h-full object-cover opacity-80"
                onLoad={(e) => {
                  setCanvasDimensions({ width: e.target.clientWidth, height: e.target.clientHeight });
                }}
              />
              <canvas
                ref={canvasRef}
                width={canvasDimensions.width}
                height={canvasDimensions.height}
                onClick={handleCanvasClick}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10"
              />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUndoPoint}
                  disabled={points.length === 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo Point
                </button>
                <button
                  type="button"
                  onClick={handleClearPoints}
                  disabled={points.length === 0}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-red-900/50 hover:text-red-300 disabled:opacity-50 text-slate-300 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear Canvas
                </button>
              </div>

              <button
                type="button"
                onClick={handleOpenSaveModal}
                disabled={points.length < 3}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Save className="w-4 h-4" />
                Save Dangerous Region ({points.length} Points)
              </button>
            </div>
          </div>
        </div>

        {/* Existing Regions Sidebar */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Configured Regions ({regions.length})
              </div>
            </div>

            {regions.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs space-y-2">
                <AlertCircle className="w-6 h-6 mx-auto text-slate-400" />
                <div>No dangerous polygon regions defined for this camera yet.</div>
                <div className="text-[11px] text-slate-400">Click on the canvas feed to draw points for a new region.</div>
              </div>
            ) : (
              <div className="space-y-3">
                {regions.map((reg) => (
                  <div key={reg.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900">{reg.name}</div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          reg.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {reg.status}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px]">{reg.description || 'No description'}</p>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Vertices: {reg.polygon_points?.length || 0} pts</span>
                      <span>Canvas: {reg.original_canvas_width}x{reg.original_canvas_height}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Region Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Save Camera Region
              </div>
              <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveRegion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Region Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Machinery Zone Alpha"
                  value={regionName}
                  onChange={(e) => setRegionName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe dangerous equipment or high-risk zone boundary..."
                  value={regionDescription}
                  onChange={(e) => setRegionDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Associate Active Safety Rules
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {rules.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No safety rules available to associate.</div>
                  ) : (
                    rules.map((rule) => {
                      const isSel = selectedRules.includes(rule.id);
                      return (
                        <label
                          key={rule.id}
                          onClick={() => handleToggleRuleSelect(rule.id)}
                          className={`flex items-center justify-between p-2 rounded border text-xs cursor-pointer ${
                            isSel ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-medium' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span>{rule.name}</span>
                          <span className="text-[10px] text-slate-500">[{rule.severity}]</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Normalized Vertices:</span>
                <span className="font-mono font-bold text-slate-900">{points.length} points</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-xs"
                >
                  Save Region
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
