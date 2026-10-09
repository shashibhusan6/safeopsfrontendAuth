import React, { useRef } from 'react';
import { Modal } from './Modal.jsx';
import { generateQRCodeSVG, generateQRCodeDataURL } from '../../utils/qrGenerator.js';
import { StatusBadge } from './StatusBadge.jsx';
import { Printer, Download, QrCode, ShieldCheck, Building2, UserCheck, Hash } from 'lucide-react';

export const EmployeeQRBadgeModal = ({ isOpen, onClose, employee }) => {
  const badgeRef = useRef(null);

  if (!employee) return null;

  const qrToken = employee.qr_token || `QR-EMP-${employee.id}-${employee.name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase()}`;
  const qrSvgData = generateQRCodeSVG(qrToken, { size: 180, fgColor: '#0f172a' });
  const qrDataUrl = generateQRCodeDataURL(qrToken, { size: 240 });

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Employee QR Pass - ${employee.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #f8fafc; }
            .card { width: 340px; background: #ffffff; border: 2px solid #cbd5e1; border-radius: 16px; padding: 24px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px; }
            .logo { font-size: 18px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
            .title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 600; }
            .qr-box { background: #ffffff; padding: 12px; border-radius: 12px; border: 1px solid #e2e8f0; display: inline-block; margin: 12px 0; }
            .emp-name { font-size: 18px; font-weight: 700; color: #0f172a; margin: 4px 0 2px 0; }
            .emp-role { font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 8px; }
            .info-table { width: 100%; font-size: 12px; border-collapse: collapse; margin-top: 12px; text-align: left; }
            .info-table td { padding: 4px 0; color: #475569; }
            .info-table td.label { font-weight: 600; color: #0f172a; width: 40%; }
            .footer { margin-top: 16px; pt: 12px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">SAFEOPS INDUSTRIAL</div>
              <div class="title">Official Employee Entry Pass</div>
            </div>
            <div class="emp-name">${employee.name}</div>
            <div class="emp-role">${(employee.role || 'Employee').replace('_', ' ')}</div>
            <div class="qr-box">
              <img src="${qrDataUrl}" width="180" height="180" alt="QR Code" />
            </div>
            <table class="info-table">
              <tr><td class="label">Employee ID:</td><td>#EMP-${employee.id}</td></tr>
              <tr><td class="label">Plant Facility:</td><td>${employee.plant?.name || employee.plant_name || 'All Plants'}</td></tr>
              <tr><td class="label">Token ID:</td><td style="font-family:monospace; font-size:10px;">${qrToken}</td></tr>
            </table>
            <div class="footer">Scan at plant security gate camera for automated entry verification.</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `Employee_QR_${employee.id}_${employee.name.replace(/[^a-zA-Z0-9]/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Official QR Access Pass"
      subtitle="Unique server-validated QR Code permanently associated with employee ID."
    >
      <div className="space-y-5">
        {/* Printable Badge Visual */}
        <div
          ref={badgeRef}
          className="bg-gradient-to-b from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-lg border border-slate-800 relative overflow-hidden"
        >
          {/* Decorative Security Background Mesh */}
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span className="font-bold text-sm tracking-wide text-white">SafeOps Industrial Pass</span>
            </div>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Active Security Badge
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* QR Render Container */}
            <div className="bg-white p-3 rounded-xl shadow-md border border-slate-200 shrink-0">
              <div
                dangerouslySetInnerHTML={{ __html: qrSvgData.svgString }}
                className="w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center"
              />
              <div className="text-[10px] text-center font-mono text-slate-500 mt-1 font-semibold">
                {qrToken}
              </div>
            </div>

            {/* Employee Details Card */}
            <div className="flex-1 space-y-2.5 text-center sm:text-left">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">{employee.name}</h3>
                <div className="text-xs text-slate-400">{employee.email}</div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <StatusBadge type="role" value={employee.role} />
                <StatusBadge type="account" value={employee.account_status || 'active'} />
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400">Employee ID:</span>
                  <span className="font-semibold text-white font-mono">#EMP-{employee.id}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="text-slate-400">Plant:</span>
                  <span className="font-semibold text-white truncate max-w-[180px]">
                    {employee.plant?.name || employee.plant_name || 'All Facilities'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> Server-Verified Access Token
            </span>
            <span className="font-mono text-[10px] text-slate-500">SafeOps QR Security v1.0</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-xs flex items-center gap-1.5 border border-slate-300 transition"
          >
            <Download className="w-4 h-4" /> Download Image (SVG)
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 shadow-xs transition"
          >
            <Printer className="w-4 h-4" /> Print Employee Badge
          </button>
        </div>
      </div>
    </Modal>
  );
};
