import React from 'react';
import { AlertTriangle, Power, CheckCircle } from 'lucide-react';
import { Modal } from './Modal.jsx';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  confirmVariant = 'danger',
  isLoading = false,
}) => {
  let icon = <AlertTriangle className="w-6 h-6 text-rose-600" />;
  let btnClass = 'bg-rose-600 hover:bg-rose-700 text-white';

  if (confirmVariant === 'warning') {
    icon = <Power className="w-6 h-6 text-amber-600" />;
    btnClass = 'bg-amber-600 hover:bg-amber-700 text-white';
  } else if (confirmVariant === 'success') {
    icon = <CheckCircle className="w-6 h-6 text-emerald-600" />;
    btnClass = 'bg-emerald-600 hover:bg-emerald-700 text-white';
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div className="p-3 bg-slate-100 rounded-full border border-slate-200 mb-4">{icon}</div>
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">{message}</p>

        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-xs sm:text-sm font-medium shadow-xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs ${btnClass} disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
