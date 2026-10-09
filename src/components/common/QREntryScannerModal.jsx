import React, { useState, useEffect, useRef } from 'react';
import { Modal } from './Modal.jsx';
import { attendanceApi } from '../../api/attendanceApi.js';
import { plantsApi } from '../../api/plantsApi.js';
import { usersApi } from '../../api/usersApi.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
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
} from 'lucide-react';

export const QREntryScannerModal = ({ isOpen, onClose, onScanComplete }) => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('camera'); // 'camera' | 'quick_select' | 'manual'
  const [selectedPlantId, setSelectedPlantId] = useState(currentUser?.plant_id || 1);
  const [availablePlants, setAvailablePlants] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Camera video states
  const videoRef = useRef(null);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Manual input state
  const [qrTokenInput, setQrTokenInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scan Result Banner State
  const [scanResult, setScanResult] = useState(null); // { type: 'success' | 'error' | 'warning', message: string, record?: object }

  // Load plants and employees list for quick test selector
  useEffect(() => {
    if (isOpen) {
      setScanResult(null);
      setQrTokenInput('');

      plantsApi.getPlants(1, 100).then((res) => {
        setAvailablePlants(res.data || []);
        if (res.data?.length > 0 && !currentUser?.plant_id) {
          setSelectedPlantId(res.data[0].id);
        }
      }).catch(() => {});

      usersApi.getUsers(1, 100).then((res) => {
        setEmployees(res.data || []);
      }).catch(() => {});
    }
  }, [isOpen, currentUser]);

  // Handle Camera initialization
  useEffect(() => {
    let stream = null;

    if (isOpen && activeTab === 'camera') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: 'environment' } })
          .then((s) => {
            stream = s;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
            setHasCameraPermission(true);
            setIsCameraActive(true);
          })
          .catch((err) => {
            console.warn('Camera access denied or unavailable:', err);
            setHasCameraPermission(false);
            setIsCameraActive(false);
          });
      } else {
        setHasCameraPermission(false);
      }
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, activeTab]);

  // Execute scan verification against backend API / mockEngine
  const processQRTokenScan = async (tokenToScan) => {
    if (!tokenToScan || !tokenToScan.trim()) {
      setScanResult({
        type: 'error',
        message: 'Please enter or scan a valid employee QR token.',
      });
      return;
    }

    setIsSubmitting(true);
    setScanResult(null);

    try {
      const res = await attendanceApi.scanQRCode(tokenToScan.trim(), selectedPlantId);
      const record = res.record;

      const successMsg = `Employee ${record.employee_name} checked in successfully at ${record.formatted_time}.`;

      setScanResult({
        type: 'success',
        message: successMsg,
        record: record,
      });

      addToast(successMsg, 'success', 'QR Check-In Verified');

      if (onScanComplete) {
        onScanComplete(record);
      }
    } catch (err) {
      const errData = err?.response?.data;
      const errorMsg = errData?.error || err.message || 'QR Check-In failed.';

      if (errData?.alreadyCheckedIn) {
        setScanResult({
          type: 'warning',
          message: errorMsg,
          record: errData.existingRecord,
        });
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
    }
  };

  const currentPlantName =
    availablePlants.find((p) => p.id === Number(selectedPlantId))?.name || `Plant #${selectedPlantId}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="QR Code Employee Entry Scanner"
      subtitle="Automated plant gate check-in & attendance verification"
    >
      <div className="space-y-5">
        {/* Plant Entrance Selection Bar */}
        <div className="bg-slate-100/90 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Plant Entrance:</span>
          </div>
          <select
            value={selectedPlantId}
            onChange={(e) => setSelectedPlantId(Number(e.target.value))}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-600"
          >
            {availablePlants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
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
            onClick={() => setActiveTab('camera')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
              activeTab === 'camera'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" /> Camera Live View
          </button>
          <button
            onClick={() => setActiveTab('quick_select')}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold text-xs border-b-2 transition ${
              activeTab === 'quick_select'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" /> Instant Employee Selector
          </button>
          <button
            onClick={() => setActiveTab('manual')}
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
            <div className="relative w-full h-64 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {hasCameraPermission === false ? (
                <div className="text-center p-6 text-slate-400">
                  <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-300">Camera hardware unavailable or permission denied.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Please use the "Instant Employee Selector" tab to test QR scanning.</p>
                </div>
              ) : (
                <>
                  <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                  {/* Scanner Frame Overlay */}
                  <div className="absolute inset-0 border-2 border-indigo-500/30 flex items-center justify-center">
                    <div className="w-48 h-48 border-2 border-dashed border-indigo-400 rounded-2xl relative flex items-center justify-center bg-indigo-500/5">
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
                    Position employee QR code inside frame
                  </div>
                </>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Testing without camera?</span>
              <button
                type="button"
                onClick={() => setActiveTab('quick_select')}
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
            <p className="text-xs text-slate-500">
              Select an employee below to simulate scanning their unique QR badge at <strong>{currentPlantName}</strong>:
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => processQRTokenScan(emp.qr_token)}
                  className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg flex items-center justify-between cursor-pointer transition group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs group-hover:bg-indigo-600 transition">
                      {emp.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {emp.name}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {emp.qr_token || `QR-EMP-${emp.id}`}
                      </div>
                    </div>
                  </div>
                  <button
                    disabled={isSubmitting}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-md text-xs font-bold transition flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" /> Scan Pass
                  </button>
                </div>
              ))}
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

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Lock className="w-3.5 h-3.5 text-indigo-600" /> Server-side Token & Duplicate Validation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold transition shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
