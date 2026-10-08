import React from 'react';
import { ShieldAlert, ShieldCheck, Power } from 'lucide-react';

export const AuditLogs = () => {
  const sampleAuditLogs = [
    {
      id: 1,
      actor: 'Eleanor Vance (super_admin)',
      action: 'PATCH /plants/3/status',
      detail: 'Deactivated Plant "Gamma Storage Facility" status to "inactive".',
      type: 'warning',
      timestamp: '2 mins ago',
    },
    {
      id: 2,
      action: 'PATCH /zones/103/enable',
      actor: 'Marcus Brody (admin)',
      detail: 'Enabled Zone "Perimeter Fence & Security Gate" in Alpha Energy Refinery.',
      type: 'success',
      timestamp: '15 mins ago',
    },
    {
      id: 3,
      action: 'POST /users/invite',
      actor: 'Eleanor Vance (super_admin)',
      detail: 'Invited unassigned plant admin (plant_id: null) -> new.admin@global-corp.com',
      type: 'info',
      timestamp: '1 hour ago',
    },
    {
      id: 4,
      action: 'PATCH /users/7/disable',
      actor: 'Dave Bowman (operator)',
      detail: 'REJECTED: 403 Forbidden - Operator role attempted mutation.',
      type: 'danger',
      timestamp: '2 hours ago',
    },
    {
      id: 5,
      action: 'PATCH /cameras/501/status',
      actor: 'Marcus Brody (admin)',
      detail: 'Toggled camera "CCU Flare Stack Thermal Feed" is_active = true.',
      type: 'success',
      timestamp: '3 hours ago',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          System Audit & Security Logs
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time tracking of authorization events, status changes, and RBAC security enforcement.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs p-6">
        <div className="space-y-3">
          {sampleAuditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg flex items-start gap-3 hover:border-slate-300 transition"
            >
              <div className="mt-0.5">
                {log.type === 'danger' ? (
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                ) : log.type === 'warning' ? (
                  <Power className="w-5 h-5 text-amber-600" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
              </div>

              <div className="flex-1 text-xs">
                <div className="flex items-center justify-between font-mono text-slate-500 mb-1">
                  <span className="font-bold text-slate-800">{log.action}</span>
                  <span>{log.timestamp}</span>
                </div>
                <div className="text-slate-700 font-medium">{log.detail}</div>
                <div className="text-[11px] text-slate-500 mt-1">Actor: {log.actor}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
