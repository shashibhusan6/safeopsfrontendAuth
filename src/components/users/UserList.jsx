import React, { useState, useEffect, useCallback } from 'react';
import { usersApi } from '../../api/usersApi.js';
import { StatusBadge } from '../common/StatusBadge.jsx';
import { Pagination } from '../common/Pagination.jsx';
import { UserModal } from './UserModal.jsx';
import { ConfirmDialog } from '../common/ConfirmDialog.jsx';
import { EmployeeQRBadgeModal } from '../common/EmployeeQRBadgeModal.jsx';
import { BackButton } from '../common/BackButton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { CustomSelect } from '../common/CustomSelect.jsx';
import { Search, UserPlus, Power, Edit3, Trash2, Filter, QrCode } from 'lucide-react';

export const UserList = () => {
  const { user: currentUser } = useAuth();
  const { addToast, showForbiddenAlert } = useToast();

  const isOperator = currentUser?.role === 'operator';

  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedQRUser, setSelectedQRUser] = useState(null);

  const [targetActionUser, setTargetActionUser] = useState(null);

  const fetchUsers = useCallback(
    async (page = meta.page, limit = meta.limit) => {
      setIsLoading(true);
      try {
        const res = await usersApi.getUsers(page, limit, search, roleFilter, statusFilter);
        setUsers(res.data);
        setMeta(res.pagination);
      } catch (err) {
        if (err?.response?.status === 403) {
          showForbiddenAlert();
        } else {
          addToast('Failed to load users list.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    },
    [meta.page, meta.limit, search, roleFilter, statusFilter, addToast, showForbiddenAlert]
  );

  useEffect(() => {
    fetchUsers(1, meta.limit);
  }, [search, roleFilter, statusFilter]);

  const handleInviteSubmit = async (data) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser.id, data);
        addToast(`User details updated for ${data.name}`, 'success');
      } else {
        await usersApi.inviteUser(data);
        addToast(`Invitation sent to ${data.email}`, 'success');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Action failed';
        addToast(msg, 'error');
      }
    }
  };

  const handleToggleStatus = async (userToToggle) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    const newStatus = userToToggle.account_status === 'active' ? 'disabled' : 'active';
    try {
      if (newStatus === 'active') {
        await usersApi.enableUser(userToToggle.id);
      } else {
        await usersApi.disableUser(userToToggle.id);
      }
      addToast(`User ${userToToggle.name} is now ${newStatus}.`, newStatus === 'active' ? 'success' : 'warning');
      fetchUsers();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Status update failed';
        addToast(msg, 'error');
      }
    } finally {
      setTargetActionUser(null);
    }
  };

  const handleDeleteUser = async (userToDelete) => {
    if (isOperator) {
      showForbiddenAlert();
      return;
    }
    try {
      await usersApi.deleteUser(userToDelete.id);
      addToast(`User ${userToDelete.name} disabled.`, 'warning');
      fetchUsers();
    } catch (err) {
      if (err?.response?.status === 403) {
        showForbiddenAlert();
      } else {
        const msg = err?.response?.data?.error || err.message || 'Delete failed';
        addToast(msg, 'error');
      }
    } finally {
      setTargetActionUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              User Accounts & RBAC Control
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage users, permissions, active statuses, and plant assignments.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (isOperator) {
              showForbiddenAlert();
              return;
            }
            setEditingUser(null);
            setIsUserModalOpen(true);
          }}
          disabled={isOperator}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-xs transition flex items-center gap-1.5 text-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="p-3.5 bg-white border border-slate-200/80 rounded-xl flex flex-col md:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:border-indigo-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0 hidden md:block" />
          <CustomSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'super_admin', label: 'Super Admin' },
              { value: 'admin', label: 'Plant Admin' },
              { value: 'manager', label: 'Manager' },
              { value: 'operator', label: 'Operator' },
            ]}
            className="w-full md:w-44"
            size="sm"
          />
        </div>

        <div className="w-full md:w-auto">
          <CustomSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'active', label: 'Active' },
              { value: 'disabled', label: 'Disabled' },
            ]}
            className="w-full md:w-40"
            size="sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto touch-scroll">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Assigned Plant</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Invite</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading users list...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No users found matching current filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{u.name}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge type="role" value={u.role} />
                    </td>

                    <td className="px-5 py-3.5 text-xs font-medium text-slate-700">
                      {u.plant ? u.plant.name : <span className="text-slate-400 italic">Unassigned (Global)</span>}
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge type="account" value={u.account_status} />
                    </td>

                    <td className="px-5 py-3.5">
                      <StatusBadge type="invite" value={u.invite_status} />
                    </td>

                    <td className="px-5 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => setSelectedQRUser(u)}
                        title="View / Print Employee QR Pass Badge"
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (isOperator) {
                            showForbiddenAlert();
                            return;
                          }
                          setTargetActionUser({ user: u, type: 'toggle' });
                        }}
                        title={u.account_status === 'active' ? 'Disable Account' : 'Enable Account'}
                        className={`p-1.5 rounded-lg transition ${
                          u.account_status === 'active'
                            ? 'text-emerald-600 hover:bg-rose-50 hover:text-rose-600'
                            : 'text-rose-600 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                      >
                        <Power className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (isOperator) {
                            showForbiddenAlert();
                            return;
                          }
                          setEditingUser(u);
                          setIsUserModalOpen(true);
                        }}
                        title="Edit User"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (isOperator) {
                            showForbiddenAlert();
                            return;
                          }
                          setTargetActionUser({ user: u, type: 'delete' });
                        }}
                        title="Deactivate / Delete User"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination meta={meta} onPageChange={(p) => fetchUsers(p, meta.limit)} onLimitChange={(l) => fetchUsers(1, l)} />
      </div>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        onSubmit={handleInviteSubmit}
        editUser={editingUser}
      />

      {targetActionUser && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setTargetActionUser(null)}
          onConfirm={() =>
            targetActionUser.type === 'toggle'
              ? handleToggleStatus(targetActionUser.user)
              : handleDeleteUser(targetActionUser.user)
          }
          title={
            targetActionUser.type === 'toggle'
              ? targetActionUser.user.account_status === 'active'
                ? 'Disable User Account?'
                : 'Enable User Account?'
              : 'Deactivate User Account?'
          }
          message={
            targetActionUser.type === 'toggle'
              ? `Are you sure you want to ${
                  targetActionUser.user.account_status === 'active' ? 'disable' : 'enable'
                } account for ${targetActionUser.user.name}?`
              : `Are you sure you want to deactivate ${targetActionUser.user.name}? This will revoke their access to SafeOps.`
          }
          confirmText={
            targetActionUser.type === 'toggle'
              ? targetActionUser.user.account_status === 'active'
                ? 'Disable User'
                : 'Enable User'
              : 'Deactivate User'
          }
          confirmVariant={
            targetActionUser.type === 'toggle' && targetActionUser.user.account_status === 'disabled'
              ? 'success'
              : 'danger'
          }
        />
      )}

      {selectedQRUser && (
        <EmployeeQRBadgeModal
          isOpen={true}
          onClose={() => setSelectedQRUser(null)}
          employee={selectedQRUser}
        />
      )}
    </div>
  );
};
