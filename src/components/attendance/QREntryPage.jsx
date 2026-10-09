import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { attendanceApi } from '../../api/attendanceApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { usersApi } from '../../api/usersApi.js';
import { AttendanceLogTable } from '../common/AttendanceLogTable.jsx';
import { EmployeeQRBadgeModal } from '../common/EmployeeQRBadgeModal.jsx';
import { BackButton } from '../common/BackButton.jsx';
import { CustomSelect } from '../common/CustomSelect.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';
import {
  QrCode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Search,
  RefreshCw,
  Clock,
  UserCheck,
  Zap,
  Lock,
  ArrowLeft,
  ShieldCheck,
  BadgeCheck,
  Eye,
  Check,
  Loader2,
  X,
} from 'lucide-react';

export const QREntryPage = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const userRole = normalizeRole(currentUser?.role);
  const basePath = getRolePath(userRole);

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'quick_select' | 'manual'
  const [selectedPlantId, setSelectedPlantId] = useState(currentUser?.plant_id || 1);
  const [availablePlants, setAvailablePlants] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Camera video states
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isProcessingRef = useRef(false);

  const [isCameraScanning, setIsCameraScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [cameraErrorMsg, setCameraErrorMsg] = useState(null);

  // Manual input state
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scan Result Banner & Active Employee Card State
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'error' | 'warning', message: string, record?: object }
  const [lastScannedRecord, setLastScannedRecord] = useState(null);
  const [selectedQRUser, setSelectedQRUser] = useState(null);

  // Refresh key to force AttendanceLogTable re-fetch
  const [refreshKey, setRefreshKey] = useState(0);

  // Stop camera media tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraScanning(false);
  }, []);

  // Clean up camera on component unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, [stopCameraStream]);

  // Load plants and employees list
  useEffect(() => {
    plantsApi
      .getPlants(1, 100)
      .then((res) => {
        setAvailablePlants(res.data || []);
        if (res.data?.length > 0 && !currentUser?.plant_id) {
          setSelectedPlantId(res.data[0].id);
        }
      })
      .catch((err) => console.error('Failed to fetch plants:', err));

    usersApi
      .getUsers(1, 100)
      .then((res) => {
        setEmployees(res.data || []);
      })
      .catch((err) => console.error('Failed to fetch employees:', err));
  }, [currentUser]);

  // Execute scan verification against backend API / mockEngine
  const processQRTokenScan = async (tokenToScan) => {
    if (isProcessingRef.current || isSubmitting) return;

    if (!tokenToScan || !tokenToScan.trim()) {
      setScanResult({
        type: 'error',
        message: 'Please enter or scan a valid employee QR token.',
      });
      return;
    }

    isProcessingRef.current = true;
    setIsSubmitting(true);
    setScanResult(null);

    // Stop camera stream once scan is captured to release hardware
    stopCameraStream();

    try {
      const res = await attendanceApi.scanQRCode(tokenToScan.trim(), selectedPlantId);
      const record = res.record;

      const successMsg = `Employee ${record.employee_name} checked in successfully at ${record.formatted_time}.`;

      setScanResult({
        type: 'success',
        message: successMsg,
        record: record,
      });
      setLastScannedRecord(record);

      addToast(successMsg, 'success', 'QR Check-In Verified');
      setRefreshKey((prev) => prev + 1);
    } catch (err) {
      const errData = err?.response?.data;
      const errorMsg = errData?.error || err.message || 'QR Check-In failed.';

      if (errData?.alreadyCheckedIn) {
        setScanResult({
          type: 'warning',
          message: errorMsg,
          record: errData.existingRecord,
        });
        setLastScannedRecord(errData.existingRecord);
        addToast(errorMsg, 'warning', 'Already Checked In');
      } else {
        setScanResult({
          type: 'error',
          message: errorMsg,
        });
        addToast(errorMsg, 'error', 'Check-In Verification Failed');
      }
    } finally {
      setIsSubmitting(false);
      isProcessingRef.current = false;
    }
  };

  // Start device camera for QR scanning
  const startCameraScan = async () => {
    setScanResult(null);
    setCameraErrorMsg(null);
    setIsCameraScanning(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasCameraPermission(false);
      setCameraErrorMsg('Camera access API is not supported by your browser or device.');
      setIsCameraScanning(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setHasCameraPermission(true);
    } catch (err) {
      console.warn('Camera access denied or error:', err);
      setHasCameraPermission(false);
      setIsCameraScanning(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraErrorMsg('Camera access permission was denied. Please allow camera permissions in your browser settings.');
      } else {
        setCameraErrorMsg('No camera hardware found or video stream could not be initialized.');
      }
    }
  };

  // Native BarcodeDetector auto-scanning loop when camera is active
  useEffect(() => {
    let animationId = null;

    if (isCameraScanning && hasCameraPermission && 'BarcodeDetector' in window) {
      try {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const scanFrame = async () => {
          if (!isCameraScanning || isProcessingRef.current || !videoRef.current) return;

          try {
            if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                const detectedToken = barcodes[0].rawValue;
                processQRTokenScan(detectedToken);
                return;
              }
            }
          } catch (e) {
            // Frame processing error, ignore & continue loop
          }

          if (isCameraScanning) {
            animationId = requestAnimationFrame(scanFrame);
          }
        };

        animationId = requestAnimationFrame(scanFrame);
      } catch (e) {
        console.warn('BarcodeDetector initialization failed:', e);
      }
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [isCameraScanning, hasCameraPermission]);

  const currentPlantName =
    availablePlants.find((p) => p.id === Number(selectedPlantId))?.name || `Plant Facility #${selectedPlantId}`;

  const filteredEmployees = employees.filter((emp) => {
    if (!employeeSearch.trim()) return true;
    const q = employeeSearch.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q) ||
      (emp.qr_token && emp.qr_token.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <button
              onClick={() => navigate(basePath)}
              className="hover:text-indigo-600 transition flex items-center gap-1"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">QR Code Employee Entry</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            QR Code Employee Entry Portal
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
            Automated plant gate check-in verification, instant QR pass validation, and real-time attendance logging.
          </p>
        </div>

        <BackButton fallbackPath={basePath} label="Back to Dashboard" className="self-start sm:self-center" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Scanner & Verification Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            {/* Plant Entrance Selection Bar */}
            <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Active Entrance Facility:</span>
              </div>
              <CustomSelect
                value={selectedPlantId}
                onChange={(e) => setSelectedPlantId(Number(e.target.value))}
                options={availablePlants.map((p) => ({ value: p.id, label: p.name }))}
                size="sm"
                className="w-full sm:w-60"
              />
            </div>

            {/* Scan Result Confirmation Banner */}
            {scanResult && (
              <div
                className={`p-4 rounded-xl border ${
                  scanResult.type === 'success'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : scanResult.type === 'warning'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-rose-50 border-rose-300 text-rose-950'
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.type === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : scanResult.type === 'warning' ? (
                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4
                      className={`text-sm font-bold ${
                        scanResult.type === 'success'
                          ? 'text-emerald-900'
                          : scanResult.type === 'warning'
                          ? 'text-amber-900'
                          : 'text-rose-900'
                      }`}
                    >
                      {scanResult.type === 'success'
                        ? 'Check-In Confirmed'
                        : scanResult.type === 'warning'
                        ? 'Duplicate Check-In Warning'
                        : 'Check-In Rejected'}
                    </h4>
                    <p className="text-xs mt-1 font-medium leading-relaxed">{scanResult.message}</p>

                    {scanResult.record && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs font-medium">
                        <div>
                          <span className="text-slate-500">Employee ID:</span>{' '}
                          <span className="font-bold text-slate-900">#EMP-{scanResult.record.employee_id}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Time:</span>{' '}
                          <span className="font-bold text-slate-900">{scanResult.record.formatted_time}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Plant:</span>{' '}
                          <span className="font-bold text-slate-900">{scanResult.record.plant_name}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Status:</span>{' '}
                          <span className="font-bold text-emerald-700">{scanResult.record.status}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Navigation for Scanner Methods */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => {
                  setActiveTab('camera');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
                  activeTab === 'camera'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Camera className="w-4 h-4" /> Camera Scanner
              </button>
              <button
                onClick={() => {
                  stopCameraStream();
                  setActiveTab('quick_select');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
                  activeTab === 'quick_select'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Zap className="w-4 h-4" /> Instant Employee Selector
              </button>
              <button
                onClick={() => {
                  stopCameraStream();
                  setActiveTab('manual');
                }}
                className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
                  activeTab === 'manual'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <QrCode className="w-4 h-4" /> Enter Token String
              </button>
            </div>

            {/* TAB 1: Camera Scanner */}
            {activeTab === 'camera' && (
              <div className="space-y-4">
                {/* PROMINENT SCAN QR CODE BUTTON BAR */}
                <div className="flex items-center justify-between gap-3 bg-slate-900 text-white p-4 rounded-xl shadow-xs">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Camera className="w-4 h-4 text-indigo-400" />
                      Live Camera Scanner
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {isCameraScanning
                        ? 'Position employee QR pass inside the optical frame.'
                        : 'Click "Scan QR Code" to launch the camera feed.'}
                    </p>
                  </div>

                  {!isCameraScanning ? (
                    <button
                      onClick={startCameraScan}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 shrink-0"
                    >
                      <Camera className="w-4 h-4" />
                      Scan QR Code
                    </button>
                  ) : (
                    <button
                      onClick={stopCameraStream}
                      className="px-4 py-2.5 bg-rose-600/90 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 shrink-0 border border-rose-500/30"
                    >
                      <X className="w-4 h-4" />
                      Cancel Scan
                    </button>
                  )}
                </div>

                {/* Loading State when verifying barcode */}
                {isSubmitting && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-900 flex items-center justify-center gap-2 animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    Verifying QR Code with Backend...
                  </div>
                )}

                {/* CAMERA PREVIEW VIEWPORT */}
                <div className="relative w-full h-72 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
                  {isCameraScanning ? (
                    <>
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                      {/* Scanner Frame Overlay */}
                      <div className="absolute inset-0 border-2 border-indigo-500/30 flex items-center justify-center">
                        <div className="w-52 h-52 border-2 border-dashed border-indigo-400 rounded-2xl relative flex items-center justify-center bg-indigo-500/5">
                          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
                          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
                          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
                          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />
                          {/* Laser Line Animation */}
                          <div className="w-full h-0.5 bg-indigo-500 shadow-md shadow-indigo-500/50 animate-pulse" />
                        </div>
                      </div>
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur-xs rounded-full border border-slate-700 text-[11px] text-slate-300 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        Live Optical Reader Active
                      </div>
                    </>
                  ) : cameraErrorMsg ? (
                    <div className="text-center p-6 text-slate-400 max-w-sm">
                      <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-300 mb-1">{cameraErrorMsg}</p>
                      <p className="text-[11px] text-slate-500 mb-3">
                        Use the "Instant Employee Selector" tab below to test scanning without a physical webcam.
                      </p>
                      <button
                        onClick={startCameraScan}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition"
                      >
                        Retry Camera Permission
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <QrCode className="w-12 h-12 text-indigo-400/80 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-200">Device Camera is Idle</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                        Click <strong>"Scan QR Code"</strong> above to launch the live video feed and position an employee badge inside the frame.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                  <span>Testing without webcam hardware?</span>
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      setActiveTab('quick_select');
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-bold underline text-xs"
                  >
                    Switch to Quick Select
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Quick Employee Selector */}
            {activeTab === 'quick_select' && (
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">
                    Select an employee below to simulate scanning their unique QR badge at <strong>{currentPlantName}</strong>:
                  </p>
                  <div className="relative w-full sm:w-48">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search staff..."
                      className="w-full pl-8 pr-2 py-1 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                  {filteredEmployees.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No matching employees found.</div>
                  ) : (
                    filteredEmployees.map((emp) => (
                      <div
                        key={emp.id}
                        onClick={() => processQRTokenScan(emp.qr_token)}
                        className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between cursor-pointer transition group shadow-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 transition shrink-0">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition flex items-center gap-1.5">
                              {emp.name}
                              <span className="text-[10px] text-slate-400 font-normal">#EMP-{emp.id}</span>
                            </div>
                            <div className="text-[11px] font-mono text-indigo-600 font-semibold">
                              {emp.qr_token || `QR-EMP-${emp.id}`}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedQRUser(emp);
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Employee QR Badge"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" /> Scan Pass
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Manual Token Entry */}
            {activeTab === 'manual' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  processQRTokenScan(qrTokenInput);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Employee QR Token String
                  </label>
                  <input
                    type="text"
                    value={qrTokenInput}
                    onChange={(e) => setQrTokenInput(e.target.value)}
                    placeholder="e.g. QR-EMP-1004-DAVE"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-xs transition text-xs flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Verifying QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Verify QR & Record Entry
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Security Verification Note */}
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium text-slate-600">
                <Lock className="w-3.5 h-3.5 text-indigo-600" /> Server-side Token & Duplicate Validation Active
              </span>
              <span className="text-[11px] font-mono text-slate-400">SafeOps Security Engine</span>
            </div>
          </div>
        </div>

        {/* Right Column: Verification Result Details & Employee Pass Spotlight */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <BadgeCheck className="w-5 h-5 text-indigo-600" />
              Latest Verification Record
            </h3>

            {lastScannedRecord ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Entry Verified
                    </span>
                    <span className="text-xs font-mono text-slate-400">#EMP-{lastScannedRecord.employee_id}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-inner">
                      {lastScannedRecord.employee_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{lastScannedRecord.employee_name}</h4>
                      <p className="text-xs text-slate-300">{lastScannedRecord.employee_email}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Plant Entrance:</span>
                      <span className="font-semibold text-white">{lastScannedRecord.plant_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Check-In Time:</span>
                      <span className="font-semibold text-white font-mono">{lastScannedRecord.formatted_time}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date:</span>
                      <span className="font-semibold text-white">{lastScannedRecord.entry_date}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Status:</span>
                      <span className="font-bold text-emerald-400">{lastScannedRecord.status || 'Checked-In'}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-indigo-300 truncate max-w-[200px]">
                      {lastScannedRecord.qr_token}
                    </span>
                    <button
                      onClick={() => {
                        const emp = employees.find((e) => e.id === lastScannedRecord.employee_id) || {
                          id: lastScannedRecord.employee_id,
                          name: lastScannedRecord.employee_name,
                          email: lastScannedRecord.employee_email,
                          role: lastScannedRecord.employee_role,
                          plant_id: lastScannedRecord.plant_id,
                          plant_name: lastScannedRecord.plant_name,
                          qr_token: lastScannedRecord.qr_token,
                        };
                        setSelectedQRUser(emp);
                      }}
                      className="text-xs font-bold text-indigo-400 hover:text-white transition underline flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Badge
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-slate-800">Ready for QR Code Scan</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Click <strong>"Scan QR Code"</strong> to launch the live camera feed or select an employee from the list to display entry verification metrics.
                </p>
              </div>
            )}

            {/* Quick Operational Guidelines */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs space-y-2 text-indigo-950">
              <h5 className="font-bold flex items-center gap-1.5 text-indigo-900">
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Entrance Gate Protocol
              </h5>
              <ul className="space-y-1 text-slate-700 text-[11px] list-disc pl-4 leading-relaxed">
                <li>Every employee has a unique, server-validated QR access token.</li>
                <li>Duplicate check-ins on the same calendar day are automatically flagged.</li>
                <li>Access to unauthorized plant facilities will trigger a security denial.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Full-Width Section: Attendance Logs Table */}
      <AttendanceLogTable
        plantId={selectedPlantId}
        refreshKey={refreshKey}
        title={`Live Plant Entrance Attendance Records - ${currentPlantName}`}
      />

      {/* Employee QR Pass Modal when viewing badge */}
      {selectedQRUser && (
        <EmployeeQRBadgeModal
          isOpen={!!selectedQRUser}
          onClose={() => setSelectedQRUser(null)}
          employee={selectedQRUser}
        />
      )}
    </div>
  );
};
