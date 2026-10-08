import React from 'react';

export const StatusBadge = ({ type, value }) => {
  let label = String(value);
  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (type === 'account') {
    if (value === 'active') {
      label = 'Active';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      label = 'Disabled';
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else if (type === 'plant' || type === 'zone') {
    if (value === 'active') {
      label = 'Active';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      label = 'Inactive';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }
  } else if (type === 'camera_active') {
    const active = Boolean(value);
    label = active ? 'Enabled' : 'Disabled';
    bgClass = active
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-slate-100 text-slate-600 border-slate-200';
  } else if (type === 'camera_status') {
    if (value === 'online') {
      label = 'Online';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (value === 'offline') {
      label = 'Offline';
      bgClass = 'bg-slate-100 text-slate-600 border-slate-200';
    } else {
      label = 'Error';
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
    }
  } else if (type === 'role') {
    if (value === 'super_admin') {
      label = 'Super Admin';
      bgClass = 'bg-purple-50 text-purple-700 border-purple-200 font-medium';
    } else if (value === 'admin') {
      label = 'Plant Admin';
      bgClass = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium';
    } else if (value === 'manager') {
      label = 'Plant Manager';
      bgClass = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
    } else {
      label = 'Operator (Read-Only)';
      bgClass = 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  } else if (type === 'severity') {
    if (value === 'critical') {
      label = 'Critical';
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200 font-semibold';
    } else if (value === 'high') {
      label = 'High';
      bgClass = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
    } else if (value === 'medium') {
      label = 'Medium';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200 font-semibold';
    } else {
      label = 'Low';
      bgClass = 'bg-teal-50 text-teal-700 border-teal-200 font-semibold';
    }
  } else if (type === 'invite') {
    if (value === 'accepted') {
      label = 'Accepted';
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    } else {
      label = 'Pending Invite';
      bgClass = 'bg-amber-50 text-amber-700 border-amber-200';
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${bgClass}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
};
