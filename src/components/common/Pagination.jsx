import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CustomSelect } from './CustomSelect.jsx';

export const Pagination = ({ meta, onPageChange, onLimitChange }) => {
  const { page, limit, total, totalPages } = meta;

  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-600">
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-slate-900">{startItem}</strong> to{' '}
          <strong className="text-slate-900">{endItem}</strong> of{' '}
          <strong className="text-slate-900">{total}</strong> results
        </span>
        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-slate-400">Per page:</span>
            <CustomSelect
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              options={[
                { value: 5, label: '5' },
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
              ]}
              size="sm"
              className="w-20"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium shadow-xs"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <span className="px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition text-xs font-medium shadow-xs"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
