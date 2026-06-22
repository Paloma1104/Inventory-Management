import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { name } = useAuth();

  return (
    <div>
      <PageHeader title="Settings" description="System and account preferences" />

      <div className="space-y-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">Account</h3>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Name</p>
              <p className="mt-1 text-sm text-gray-900">{name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Role</p>
              <p className="mt-1 text-sm text-gray-900">Administrator</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900">System</h3>
          <div className="mt-4 space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Application</p>
              <p className="mt-1 text-sm text-gray-900">Inventory Management System</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Module</p>
              <p className="mt-1 text-sm text-gray-900">Admin Portal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
