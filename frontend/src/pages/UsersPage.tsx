import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Trash2, Pencil, AlertTriangle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { usersApi } from '../services/api';
import type { User } from '../types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [actionUser, setActionUser] = useState<User | null>(null);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  const [listError, setListError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (active: boolean) => {
    setLoading(true);
    setListError(null);
    try {
      const { data } = await usersApi.list();
      if (active) setUsers(data);
    } catch (err) {
      console.error(err);
      if (active) setListError('Failed to load users list. Please check if the backend is online.');
    } finally {
      if (active) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchUsers(active);
    return () => {
      active = false;
    };
  }, [fetchUsers]);

  const openCreate = () => {
    setEditUser(null);
    setForm({ name: '', email: '', password: '', role: 'user' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (user: User) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, password: '', role: user.role });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editUser) {
        const updateData: Partial<User> = { name: form.name, email: form.email, role: form.role as User['role'] };
        await usersApi.update(editUser.user_id, updateData);
      } else {
        await usersApi.create(form);
      }
      setShowModal(false);
      fetchUsers(true);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === 'string' ? message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const executeDelete = async (hard: boolean) => {
    if (!actionUser) return;
    try {
      await usersApi.delete(actionUser.user_id, hard);
      fetchUsers(true);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(typeof message === 'string' ? message : `${hard ? 'Delete' : 'Deactivate'} failed`);
    } finally {
      setActionUser(null);
    }
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = emailRegex.test(form.email);

  const isPasswordMinLength = form.password.length >= 8;
  const isPasswordUppercase = /[A-Z]/.test(form.password);
  const isPasswordNumber = /[0-9]/.test(form.password);
  const isPasswordSpecial = /[^A-Za-z0-9]/.test(form.password);
  const isPasswordValid = isPasswordMinLength && isPasswordUppercase && isPasswordNumber && isPasswordSpecial;

  const isFormValid = form.name.trim() !== '' && isEmailValid && (editUser ? true : isPasswordValid);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Manage team members and their roles"
        actions={
          <button onClick={openCreate} className="btn-primary">
            <UserPlus className="h-4 w-4" />
            Add User
          </button>
        }
      />

      {listError && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          ⚠️ {listError}
        </div>
      )}

      <div className="card overflow-hidden !p-0">
        {users.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="h-8 w-8" />}
            title="No users yet"
            description="Create your first team member to get started."
            action={<button onClick={openCreate} className="btn-primary">Add User</button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b table-header">
                <tr className="text-xs font-medium uppercase tracking-wider text-navy-secondary">
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {users.map((user) => (
                  <tr key={user.user_id} className="table-row">
                    <td className="px-6 py-4 font-medium text-navy">{user.name}</td>
                    <td className="px-6 py-4 text-navy-secondary">{user.email}</td>
                    <td className="px-6 py-4"><Badge status={user.role} /></td>
                    <td className="px-6 py-4"><Badge status={user.status} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(user)} className="icon-btn">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setActionUser(user);
                            setShowOptionsModal(true);
                          }}
                          className="icon-btn-warning"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border alert-error">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
            {form.email && (
              <p className={`mt-1.5 text-xs font-medium flex items-center gap-1.5 ${isEmailValid ? 'text-green-600' : 'text-accent-dark'}`}>
                {isEmailValid ? (
                  <>
                    <span className="text-sm">✓</span> Valid email format
                  </>
                ) : (
                  <>
                    <span className="text-sm">⚠</span> Invalid email format (e.g. name@domain.com)
                  </>
                )}
              </p>
            )}
          </div>
          {!editUser && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Password</label>
              <input required type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" />
              
              <div className="mt-2.5 rounded-lg border border-surface-border bg-[#F7FAFC] p-3 space-y-1.5 text-xs text-navy-secondary">
                <p className="font-semibold text-navy mb-1 text-[10px] uppercase tracking-wider">Password Requirements:</p>
                <div className="flex items-center gap-1.5 transition-colors duration-150">
                  <span className={`text-sm ${isPasswordMinLength ? 'text-green-600' : 'text-navy-secondary/50'}`}>
                    {isPasswordMinLength ? '✓' : '○'}
                  </span>
                  <span className={isPasswordMinLength ? 'text-green-700 font-medium' : ''}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1.5 transition-colors duration-150">
                  <span className={`text-sm ${isPasswordUppercase ? 'text-green-600' : 'text-navy-secondary/50'}`}>
                    {isPasswordUppercase ? '✓' : '○'}
                  </span>
                  <span className={isPasswordUppercase ? 'text-green-700 font-medium' : ''}>At least one uppercase letter</span>
                </div>
                <div className="flex items-center gap-1.5 transition-colors duration-150">
                  <span className={`text-sm ${isPasswordNumber ? 'text-green-600' : 'text-navy-secondary/50'}`}>
                    {isPasswordNumber ? '✓' : '○'}
                  </span>
                  <span className={isPasswordNumber ? 'text-green-700 font-medium' : ''}>At least one number</span>
                </div>
                <div className="flex items-center gap-1.5 transition-colors duration-150">
                  <span className={`text-sm ${isPasswordSpecial ? 'text-green-600' : 'text-navy-secondary/50'}`}>
                    {isPasswordSpecial ? '✓' : '○'}
                  </span>
                  <span className={isPasswordSpecial ? 'text-green-700 font-medium' : ''}>At least one special character</span>
                </div>
              </div>
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting || !isFormValid} className="btn-primary">
              {submitting ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {showOptionsModal && actionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm animate-fade-in" onClick={() => { setShowOptionsModal(false); setActionUser(null); }} />
          <div className="relative z-10 bg-white p-6 rounded-xl shadow-xl max-w-md w-full border border-surface-border mx-4 animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-navy">Manage User Account</h3>
                <p className="text-sm text-navy-secondary mt-1">
                  Choose how you want to handle removing access for <strong className="text-navy">{actionUser.name}</strong>.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  executeDelete(false);
                }}
                className="w-full bg-primary text-white py-2.5 px-4 rounded-lg hover:bg-primary-dark font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              >
                Deactivate Account
              </button>

              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  setShowWarningModal(true);
                }}
                className="w-full bg-secondary text-white py-2.5 px-4 rounded-lg hover:bg-secondary-dark font-medium text-sm transition focus:outline-none focus:ring-2 focus:ring-secondary/20 shadow-sm"
              >
                Delete Account
              </button>

              <button
                onClick={() => {
                  setShowOptionsModal(false);
                  setActionUser(null);
                }}
                className="w-full bg-surface-muted text-navy-secondary py-2.5 px-4 rounded-lg hover:bg-surface-border hover:text-navy font-medium text-sm transition mt-1 focus:outline-none focus:ring-2 focus:ring-navy/10 border border-surface-border"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showWarningModal && actionUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-navy/40 backdrop-blur-sm animate-fade-in" onClick={() => { setShowWarningModal(false); setActionUser(null); }} />
          <div className="relative z-10 bg-white p-6 rounded-xl shadow-xl max-w-md w-full border border-surface-border mx-4 animate-scale-in">
            <div className="flex items-start gap-4 mb-4">
              <div className="h-10 w-10 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">WARNING</h3>
                <p className="text-sm text-navy-secondary mt-1 leading-relaxed">
                  You are about to permanently delete <strong className="text-navy">{actionUser.name}</strong>. This action <strong>will remove all traces</strong> of their transaction logs, restock requests, and activity history from the platform database. This cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  setActionUser(null);
                }}
                className="flex-1 bg-surface-muted text-navy-secondary py-2.5 rounded-lg hover:bg-surface-border hover:text-navy text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-navy/10 border border-surface-border"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowWarningModal(false);
                  executeDelete(true);
                }}
                className="flex-1 bg-primary text-white py-2.5 rounded-lg hover:bg-primary-dark text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
