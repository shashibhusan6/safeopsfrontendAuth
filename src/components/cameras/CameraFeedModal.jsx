import React from 'react';
import { Modal } from '../common/Modal.jsx';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { WifiOff } from 'lucide-react';

export const CameraFeedModal = ({ isOpen, onClose, camera }) => {
  if (!camera) return null;

  const sampleImages = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
  ];

  const imageUrl =
    camera.feed_url_or_path && camera.feed_url_or_path.startsWith('http')
      ? camera.feed_url_or_path
      : sampleImages[camera.id % sampleImages.length];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live Feed Stream: ${camera.name}`}
      subtitle={`Zone Sector: ${camera.zone?.name || 'Sector'} | Protocol: ${camera.feed_type.toUpperCase()}`}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Stream Display Frame */}
        <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-700 aspect-video flex items-center justify-center shadow-md">
          {camera.is_active && camera.status === 'online' ? (
            <>
              <img
                src={imageUrl}
                alt={camera.name}
                className="w-full h-full object-cover opacity-90 transition hover:opacity-100"
              />
              {/* Overlay HUD */}
              <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700 text-xs font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span className="text-slate-100 font-bold">REC</span>
                <span className="text-slate-500">|</span>
                <span className="text-indigo-400">1080p @ 30FPS</span>
              </div>

              <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-md border border-slate-700 text-xs font-mono text-slate-300">
                AI Vision Detection: <span className="text-emerald-400 font-bold">Normal (No Incident)</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <WifiOff className="w-12 h-12 mb-3 text-slate-500" />
              <h4 className="text-sm font-bold text-slate-200">Camera Stream Offline or Disabled</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                This camera stream is currently deactivated or parent zone/plant is disabled.
              </p>
            </div>
          )}
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block mb-1 font-medium">Stream State</span>
            <StatusBadge type="camera_status" value={camera.status} />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block mb-1 font-medium">Active Status</span>
            <StatusBadge type="camera_active" value={camera.is_active} />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block mb-1 font-medium">Protocol Type</span>
            <span className="font-semibold text-slate-800 uppercase">{camera.feed_type}</span>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-500 block mb-1 font-medium">Heartbeat</span>
            <span className="font-mono text-slate-700 font-medium">Active</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};
