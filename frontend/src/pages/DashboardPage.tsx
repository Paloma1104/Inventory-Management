import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, AlertTriangle, ArrowLeftRight, UserPlus, Plus, Eye } from 'lucide-react';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import { dashboardApi } from '../services/api';
import type { DashboardStats } from '../types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Overview of your inventory management system"
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats?.total_products ?? 0} icon={Package} color="blue" />
        <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} color="purple" />
        <StatCard title="Low Stock Products" value={stats?.low_stock_products ?? 0} icon={AlertTriangle} color="amber" />
        <StatCard title="Recent Transactions" value={stats?.recent_transactions?.length ?? 0} icon={ArrowLeftRight} color="green" />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link to="/users" className="card group flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md">
            <div className="rounded-lg bg-brand-50 p-3 text-brand-600 transition group-hover:bg-brand-100">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Add User</p>
              <p className="text-xs text-gray-500">Create new team member</p>
            </div>
          </Link>
          <Link to="/products" className="card group flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md">
            <div className="rounded-lg bg-green-50 p-3 text-green-600 transition group-hover:bg-green-100">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Add Product</p>
              <p className="text-xs text-gray-500">Manage product catalog</p>
            </div>
          </Link>
          <Link to="/inventory" className="card group flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md">
            <div className="rounded-lg bg-purple-50 p-3 text-purple-600 transition group-hover:bg-purple-100">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Inventory</p>
              <p className="text-xs text-gray-500">Stock in and stock out</p>
            </div>
          </Link>
          <Link to="/low-stock" className="card group flex items-center gap-4 transition hover:border-brand-300 hover:shadow-md">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600 transition group-hover:bg-amber-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Low Stock Alerts</p>
              <p className="text-xs text-gray-500">Review stock warnings</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Transactions</h2>
        {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Quantity</th>
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {stats.recent_transactions.map((txn) => (
                  <tr key={txn.transaction_id} className="text-gray-700">
                    <td className="py-3 pr-4 font-medium text-gray-900">{txn.product_name}</td>
                    <td className="py-3 pr-4"><Badge status={txn.transaction_type} /></td>
                    <td className="py-3 pr-4">{txn.quantity}</td>
                    <td className="py-3 pr-4">{txn.user_name}</td>
                    <td className="py-3 text-gray-500">{new Date(txn.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-gray-500">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
