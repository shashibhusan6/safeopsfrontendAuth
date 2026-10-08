import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { plantsApi } from '../../api/plantsApi.js';
import { useToast } from '../../context/ToastContext.jsx';

export const UserModal = ({
  isOpen,
  onClose,
  onSubmit,
  editUser,
  isLoading = false,
}) => {
  const { user: currentUser } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();

  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isAdmin = currentUser?.role === 'admin';
  const isOperator = currentUser?.role === 'operator';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('operator');
  const [plantId, setPlantId] = useState(currentUser?.plant_id || null);
  const [availablePlants, setAvailablePlants] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (editUser) {
        setName(editUser.name);
        setEmail(editUser.email);
        setRole(editUser.role);
        setPlantId(editUser.plant_id);
      } else {
        setName('');
        setEmail('');
        setRole('operator');
        setPlantId(isSuperAdmin ? null : currentUser?.plant_id || null);
      }

      if (isSuperAdmin) {
        plantsApi.getPlants(1, 100).then((res) => {
          setAvailablePlants(res.data);
        }).catch(() => {});
      }
    }
  }, [isOpen, editUser, isSuperAdmin, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOperator) {
      showForbiddenAlert();
      return;
    }

    try {
      await onSubmit({
        name,
        email,
        role,
        plant_id: role === 'super_admin' ? null : plantId,
      });
      onClose();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Operation failed';
        addToast(msg, 'error');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editUser ? 'Edit User Profile' : 'Invite New System User'}
      subtitle={editUser ? 'Update user properties' : 'Send an email invitation link to join SafeOps platform'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Alex Morgan"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600"
            required
            disabled={isOperator}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex.m@company.com"
            className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-600"
            required
            disabled={isOperator}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
              Assigned Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
              disabled={isOperator}
            >
              {isSuperAdmin && <option value="super_admin">Super Admin (Platform Level)</option>}
              {(isSuperAdmin || isAdmin) && <option value="admin">Plant Admin</option>}
              <option value="manager">Manager (Operational)</option>
              <option value="operator">Operator (Strictly Read-Only)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5 uppercase tracking-wider">
              Assigned Plant Location
            </label>
            {isSuperAdmin ? (
              <select
                value={plantId ?? ''}
                onChange={(e) => setPlantId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-none focus:border-indigo-600"
                disabled={role === 'super_admin' || isOperator}
              >
                <option value="">-- Unassigned (Global / Pending) --</option>
                {availablePlants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={currentUser?.plant?.name || `Plant ID: ${currentUser?.plant_id}`}
                disabled
                className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm cursor-not-allowed"
              />
            )}
          </div>
        </div>

        {role === 'admin' && isSuperAdmin && (
          <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-800">
            💡 <strong>Unassigned Admin Support:</strong> SuperAdmin can invite admins with unassigned plant (`plant_id: null`) for later assignment.
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition text-sm font-medium shadow-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || isOperator}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition text-sm disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : editUser ? 'Save User Changes' : 'Send User Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
