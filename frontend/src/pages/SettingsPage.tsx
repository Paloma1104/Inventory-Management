import { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import { Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';

export default function SettingsPage() {
  const { name, role } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await usersApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to update password. Please check your current password.';
      setError(typeof msg === 'string' ? msg : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account preferences and security options" />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Info */}
        <div className="card md:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center pb-4 border-b border-surface-border">
            <div className="h-16 w-16 rounded-full bg-[#002B49] text-white flex items-center justify-center text-xl font-bold mb-3 border-2 border-primary/20 shadow-sm">
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h3 className="font-semibold text-navy text-lg">{name}</h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 mt-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 uppercase tracking-wider">
              {role === 'admin' ? 'Administrator' : 'Standard User'}
            </span>
          </div>

          <div className="mt-4 space-y-3.5 text-sm">
            <div>
              <p className="text-xs font-medium text-navy-secondary">Full Name</p>
              <p className="mt-0.5 font-medium text-navy">{name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-navy-secondary">Role Permission</p>
              <p className="mt-0.5 font-medium text-navy capitalize">{role}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card md:col-span-2">
          <div className="flex items-center gap-2 pb-3 mb-5 border-b border-surface-border">
            <KeyRound className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-navy">Security Settings</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
            {error && <div className="alert-error text-sm">{error}</div>}
            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg">
                <ShieldCheck className="h-4 w-4 shrink-0 text-green-600" />
                <span>{success}</span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-secondary hover:text-navy"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="At least 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-secondary hover:text-navy"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-secondary hover:text-navy"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={loading} className="btn-primary px-6">
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
