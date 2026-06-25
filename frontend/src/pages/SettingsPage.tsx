import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { name, role } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" description="System and account preferences" />

      <div className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-navy">Account</h3>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-navy-secondary">Name</p>
              <p className="mt-1 text-sm text-navy">{name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-navy-secondary">Role</p>
              <p className="mt-1 text-sm text-navy">{role === 'admin' ? 'Administrator' : 'User'}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-navy">System</h3>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-navy-secondary">Application</p>
              <p className="mt-1 text-sm text-navy">Inventory Management System</p>
            </div>
            <div>
              <p className="text-xs font-medium text-navy-secondary">Module</p>
              <p className="mt-1 text-sm text-navy">Inventory Portal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
