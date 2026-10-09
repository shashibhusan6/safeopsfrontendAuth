import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { normalizeRole, getRolePath } from '../../utils/roleUtils.js';

export const BackButton = ({ fallbackPath = undefined, label = 'Back', className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const userRole = normalizeRole(user?.role);
  const defaultFallback = fallbackPath || getRolePath(userRole);

  const handleBack = () => {
    // If user navigated internally and has history state, go back (-1), otherwise fallback safely to role dashboard/parent path
    if (window.history.length > 2 && location.key !== 'default') {
      navigate(-1);
    } else {
      navigate(defaultFallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-xs border border-slate-300 shadow-xs transition shrink-0 cursor-pointer ${className}`}
      title="Return to previous page"
    >
      <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
      <span>{label}</span>
    </button>
  );
};
