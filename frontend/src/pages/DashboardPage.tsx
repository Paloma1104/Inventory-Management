import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Users, AlertTriangle, ArrowLeftRight, UserPlus, Plus, Eye, Boxes, Search } from 'lucide-react';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import { dashboardApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { DashboardStats } from '../types';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    dashboardApi.stats()
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div>
        <PageHeader
          title="User Dashboard"
          description="View inventory availability and search for items"
        />

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Link to="/inventory" className="quick-action-card">
            <div className="rounded-lg bg-primary-light p-3 text-primary transition group-hover:bg-primary group-hover:text-white">
              <Boxes className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">View Inventory</p>
              <p className="text-xs text-navy-secondary">Browse stock levels and item details</p>
            </div>
          </Link>

          <Link to="/inventory" className="quick-action-card">
            <div className="rounded-lg bg-secondary-light p-3 text-secondary transition group-hover:bg-secondary group-hover:text-white">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">Search Items</p>
              <p className="text-xs text-navy-secondary">Find products by name, SKU, category, or status</p>
            </div>
          </Link>
        </div>

        <div className="card">
          <h2 className="mb-2 text-lg font-semibold text-navy">Inventory Access</h2>
          <p className="text-sm leading-6 text-navy-secondary">
            Your account can view inventory records and use filters to find items. Product changes,
            stock updates, transactions, and low stock alerts are managed by administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your inventory management system" />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats?.total_products ?? 0} icon={Package} color="primary" />
        {isAdmin && <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} color="secondary" />}
        <StatCard title="Low Stock Products" value={stats?.low_stock_products ?? 0} icon={AlertTriangle} color="accent" />
        <StatCard title="Recent Transactions" value={stats?.recent_transactions?.length ?? 0} icon={ArrowLeftRight} color="navy" />
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-navy-secondary">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isAdmin && (
            <Link to="/users" className="quick-action-card">
              <div className="rounded-lg bg-primary-light p-3 text-primary transition group-hover:bg-primary group-hover:text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-navy">Add User</p>
                <p className="text-xs text-navy-secondary">Create new team member</p>
              </div>
            </Link>
          )}
          <Link to="/products" className="quick-action-card">
            <div className="rounded-lg bg-secondary-light p-3 text-secondary transition group-hover:bg-secondary group-hover:text-white">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">Add Product</p>
              <p className="text-xs text-navy-secondary">Manage product catalog</p>
            </div>
          </Link>
          <Link to="/inventory" className="quick-action-card">
            <div className="rounded-lg bg-primary-light p-3 text-primary transition group-hover:bg-primary group-hover:text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">Manage Inventory</p>
              <p className="text-xs text-navy-secondary">Stock in and stock out</p>
            </div>
          </Link>
          <Link to="/low-stock" className="quick-action-card">
            <div className="rounded-lg bg-accent-light p-3 text-accent transition group-hover:bg-accent group-hover:text-white">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">Low Stock Alerts</p>
              <p className="text-xs text-navy-secondary">Review stock warnings</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-navy">Recent Transactions</h2>
        {stats?.recent_transactions && stats.recent_transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-xs font-semibold uppercase tracking-wider text-navy-secondary">
                  <th className="pb-3 pr-4">Product</th>
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Quantity</th>
                  <th className="pb-3 pr-4">User</th>
                  <th className="pb-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {stats.recent_transactions.map((txn) => (
                  <tr key={txn.transaction_id} className="text-navy-secondary">
                    <td className="py-3 pr-4 font-medium text-navy">{txn.product_name}</td>
                    <td className="py-3 pr-4"><Badge status={txn.transaction_type} /></td>
                    <td className="py-3 pr-4">{txn.quantity}</td>
                    <td className="py-3 pr-4">{txn.user_name}</td>
                    <td className="py-3 text-navy-secondary/80">{new Date(txn.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-navy-secondary">No transactions yet</p>
        )}
      </div>
    </div>
  );
}
