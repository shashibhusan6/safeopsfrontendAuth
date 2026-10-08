import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext.jsx';

export const ToastContainer = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose }) => {
  const { type, title, message } = toast;

  let icon = <Info className="w-5 h-5 text-indigo-600 shrink-0" />;
  let borderClass = 'border-indigo-200 bg-white text-slate-800 shadow-md';

  if (type === 'success') {
    icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
    borderClass = 'border-emerald-200 bg-white text-slate-800 shadow-md';
  } else if (type === 'error') {
    icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
    borderClass = 'border-rose-200 bg-white text-slate-800 shadow-md';
  } else if (type === 'warning') {
    icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
    borderClass = 'border-amber-200 bg-white text-slate-800 shadow-md';
  }

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-md transition-all duration-300 animate-slide-in ${borderClass}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 text-xs sm:text-sm">
        {title && <h4 className="font-semibold text-slate-900 mb-0.5">{title}</h4>}
        <p className="text-slate-600 leading-relaxed">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
