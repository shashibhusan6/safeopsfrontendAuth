import React, { useState, useEffect, useCallback } from 'react';
import { attendanceApi } from '../../api/attendanceApi.js';
import { StatusBadge } from './StatusBadge.jsx';
import { Pagination } from './Pagination.jsx';
import { QrCode, Search, RefreshCw, Clock, Building2, UserCheck, Calendar } from 'lucide-react';

export const AttendanceLogTable = ({ plantId = undefined, refreshKey = 0, title = 'Live Employee QR Entry Logs' }) => {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchAttendanceLogs = useCallback(async (page = meta.page, limit = meta.limit) => {
    setIsLoading(true);
    try {
      const res = await attendanceApi.getAttendanceLogs(page, limit, search, plantId, dateFilter);
      setLogs(res.data || []);
      setMeta(res.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load attendance logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [meta.page, meta.limit, search, plantId, dateFilter]);

  useEffect(() => {
    fetchAttendanceLogs(1, meta.limit);
  }, [search, dateFilter, plantId, refreshKey]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 tracking-tight">
            <QrCode className="w-4 h-4 text-indigo-600" />
            {title}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time server persistent log of employee QR scans and entry timestamps
          </p>
        </div>

        <button
          onClick={() => fetchAttendanceLogs(1, meta.limit)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition self-end sm:self-auto"
          title="Refresh Attendance Feed"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by employee name, email, or QR token..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="w-full md:w-auto flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full md:w-40 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-indigo-600"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-xs text-indigo-600 font-semibold hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto touch-scroll border border-slate-100 rounded-xl">
        <table className="w-full text-xs text-left text-slate-700">
          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Employee</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Plant Facility</th>
              <th className="py-3 px-4">QR Token</th>
              <th className="py-3 px-4">Entry Time</th>
              <th className="py-3 px-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  Loading employee check-in logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400">
                  No attendance check-in records found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {log.employee_name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{log.employee_name}</div>
                        <div className="text-[11px] text-slate-400">#EMP-{log.employee_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge type="role" value={log.employee_role} />
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      {log.plant_name}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-indigo-600 font-semibold">
                    {log.qr_token}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <span className="inline-flex items-center gap-1 font-mono text-xs">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {log.formatted_time}
                    </span>
                    <div className="text-[10px] text-slate-400 font-normal">{log.entry_date}</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UserCheck className="w-3 h-3" />
                      {log.status || 'Checked-In'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={meta} onPageChange={(p) => fetchAttendanceLogs(p, meta.limit)} onLimitChange={(l) => fetchAttendanceLogs(1, l)} />
    </div>
  );
};
