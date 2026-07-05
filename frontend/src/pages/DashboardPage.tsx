import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Users, AlertTriangle, ArrowLeftRight, UserPlus, Plus, Eye, Boxes,
  Search, Check, X, TrendingDown, Activity
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import StatCard from '../components/StatCard';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { dashboardApi, productRequestsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import type { DashboardStats, ProductRequest, Analytics } from '../types';
import logo from '../assets/blucursor-logo.png';

export default function DashboardPage() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);

  // Interactive control states
  const [chartMetric, setChartMetric] = useState<'all' | 'in' | 'out'>('all');
  const [visibleWidgets, setVisibleWidgets] = useState({
    requests: true,
    transactions: true,
    chart: true,
  });
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<'all' | 'stock_in' | 'stock_out'>('all');

  // Resolution states (Admin only)
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveRequest, setResolveRequest] = useState<ProductRequest | null>(null);
  const [resolveForm, setResolveForm] = useState<{ status: 'approved' | 'rejected'; remarks: string }>({
    status: 'approved',
    remarks: '',
  });
  const [resolveError, setResolveError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = () => {
    productRequestsApi.list()
      .then(({ data }) => setRequests(data))
      .catch(console.error)
      .finally(() => setRequestsLoading(false));
  };

  const fetchStats = () => {
    Promise.all([
      dashboardApi.stats(),
      dashboardApi.analytics(),
    ])
      .then(([{ data: statsData }, { data: analyticsData }]) => {
        setStats(statsData);
        setAnalytics(analyticsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    } else {
      setLoading(false);
    }
    fetchRequests();
  }, [isAdmin]);

  const handleResolveOpen = (request: ProductRequest, status: 'approved' | 'rejected') => {
    setResolveRequest(request);
    setResolveForm({ status, remarks: '' });
    setResolveError('');
    setShowResolveModal(true);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveRequest) return;
    setResolveError('');
    setSubmitting(true);
    try {
      await productRequestsApi.update(resolveRequest.request_id, {
        status: resolveForm.status,
        remarks: resolveForm.remarks,
      });
      setShowResolveModal(false);
      fetchRequests();
      if (isAdmin) {
        fetchStats();
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setResolveError(typeof message === 'string' ? message : 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const txns = stats?.recent_transactions ?? [];
    if (transactionTypeFilter === 'all') return txns;
    return txns.filter(t => t.transaction_type === transactionTypeFilter);
  }, [stats?.recent_transactions, transactionTypeFilter]);

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
          title={
            <div className="flex items-center gap-2.5">
              <img src={logo} alt="BluCursor logo" className="h-8 w-8 rounded-full object-cover" />
              <span>BluCursor Inventory User Dashboard</span>
            </div>
          }
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

        <div className="card mb-8">
          <h2 className="mb-2 text-lg font-semibold text-navy">Inventory Access</h2>
          <p className="text-sm leading-6 text-navy-secondary">
            Your account can view inventory records and use filters to find items. Product changes,
            stock updates, transactions, and low stock alerts are managed by administrators.
          </p>
        </div>

        {/* My Product Requests */}
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-navy">My Product Requests</h2>
            <Link to="/inventory" className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1">
              <Plus className="h-4 w-4" /> New Request
            </Link>
          </div>

          {requestsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="spinner" />
            </div>
          ) : requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-navy-secondary">You haven't requested any products yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-xs font-semibold uppercase tracking-wider text-navy-secondary">
                    <th className="pb-3 pr-4">Product Name</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Quantity</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4">Admin Remarks</th>
                    <th className="pb-3">Requested At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {requests.map((req) => (
                    <tr key={req.request_id} className="text-navy-secondary hover:bg-primary-light/10">
                      <td className="py-3 pr-4 font-medium text-navy">
                        {req.product_name}
                        {req.product_id && (
                          <span className="ml-1.5 inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-2xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                            Restock
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{req.category_name || '-'}</td>
                      <td className="py-3 pr-4">{req.quantity}</td>
                      <td className="py-3 pr-4">
                        <Badge status={req.status} />
                      </td>
                      <td className="py-3 pr-4 italic text-sm">{req.remarks || <span className="text-navy-secondary/40">No remarks</span>}</td>
                      <td className="py-3 text-navy-secondary/80">{new Date(req.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const monthlyChartData = analytics?.monthly_changes.map((m) => ({
    name: m.month,
    'Stock In': m.stock_in,
    'Stock Out': m.stock_out,
  })) || [];

  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="BluCursor logo" className="h-8 w-8 rounded-full object-cover" />
            <span>BluCursor Inventory Dashboard</span>
          </div>
        }
        description="Overview of your inventory management system"
      />

      <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats?.total_products ?? 0} icon={Package} color="primary" />
        {isAdmin && <StatCard title="Total Users" value={stats?.total_users ?? 0} icon={Users} color="secondary" />}
        <StatCard title="Low Stock Products" value={stats?.low_stock_products ?? 0} icon={AlertTriangle} color="accent" />
        <StatCard title="Recent Transactions" value={stats?.recent_transactions?.length ?? 0} icon={ArrowLeftRight} color="navy" />
      </div>

      {/* Interactive Controls & Customizer */}
      <div className="mb-6 card bg-white border border-surface-border hover:shadow-md transition-all duration-300">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-primary-light p-2 text-primary">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-navy">Interactive Controls</h3>
              <p className="text-xs text-navy-secondary">Toggle sections and metrics in real-time</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-navy-secondary uppercase tracking-wider">Show Widgets:</span>
            <button
              onClick={() => setVisibleWidgets(prev => ({ ...prev, chart: !prev.chart }))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                visibleWidgets.chart
                  ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary-dark'
                  : 'bg-white text-navy-secondary border-surface-border hover:bg-surface-muted'
              }`}
            >
              Activity Flow Chart
            </button>
            <button
              onClick={() => setVisibleWidgets(prev => ({ ...prev, requests: !prev.requests }))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                visibleWidgets.requests
                  ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary-dark'
                  : 'bg-white text-navy-secondary border-surface-border hover:bg-surface-muted'
              }`}
            >
              Pending Requests
            </button>
            <button
              onClick={() => setVisibleWidgets(prev => ({ ...prev, transactions: !prev.transactions }))}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-200 ${
                visibleWidgets.transactions
                  ? 'bg-primary text-white border-primary shadow-sm hover:bg-primary-dark'
                  : 'bg-white text-navy-secondary border-surface-border hover:bg-surface-muted'
              }`}
            >
              Recent Transactions
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Inventory Flow Chart */}
      {visibleWidgets.chart && (
        <div className="mb-8 card hover:shadow-md transition-all duration-300">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-surface-border pb-4">
            <div>
              <h3 className="text-lg font-semibold text-navy">Inventory Activity Flow</h3>
              <p className="text-xs text-navy-secondary mt-0.5">Interactive visual flow of stock inflow and outflow</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#F7FAFC] rounded-lg p-1 border border-surface-border">
              <button
                onClick={() => setChartMetric('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  chartMetric === 'all'
                    ? 'bg-white text-navy font-semibold shadow-sm'
                    : 'text-navy-secondary hover:text-navy'
                }`}
              >
                Combined
              </button>
              <button
                onClick={() => setChartMetric('in')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  chartMetric === 'in'
                    ? 'bg-white text-navy font-semibold shadow-sm'
                    : 'text-navy-secondary hover:text-navy'
                }`}
              >
                Inflow Only
              </button>
              <button
                onClick={() => setChartMetric('out')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                  chartMetric === 'out'
                    ? 'bg-white text-navy font-semibold shadow-sm'
                    : 'text-navy-secondary hover:text-navy'
                }`}
              >
                Outflow Only
              </button>
            </div>
          </div>

          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="colorStockIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorStockOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={colors.accent} stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: colors.navySecondary }} />
                <YAxis tick={{ fontSize: 12, fill: colors.navySecondary }} />
                <Tooltip />
                <Legend />
                {(chartMetric === 'all' || chartMetric === 'in') && (
                  <Area
                    type="monotone"
                    dataKey="Stock In"
                    stroke={colors.primary}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStockIn)"
                  />
                )}
                {(chartMetric === 'all' || chartMetric === 'out') && (
                  <Area
                    type="monotone"
                    dataKey="Stock Out"
                    stroke={colors.accent}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorStockOut)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-navy-secondary">No monthly transaction data available yet</p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-navy-secondary">Quick Actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isAdmin && (
            <Link to="/users" className="quick-action-card hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
              <div className="rounded-lg bg-primary-light p-3 text-primary transition group-hover:bg-primary group-hover:text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-navy">Add User</p>
                <p className="text-xs text-navy-secondary">Create new team member</p>
              </div>
            </Link>
          )}
          <Link to="/products" className="quick-action-card hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <div className="rounded-lg bg-secondary-light p-3 text-secondary transition group-hover:bg-secondary group-hover:text-white">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">Add Product</p>
              <p className="text-xs text-navy-secondary">Manage product catalog</p>
            </div>
          </Link>
          <Link to="/inventory" className="quick-action-card hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <div className="rounded-lg bg-primary-light p-3 text-primary transition group-hover:bg-primary group-hover:text-white">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">Manage Inventory</p>
              <p className="text-xs text-navy-secondary">Stock in and stock out</p>
            </div>
          </Link>
          <Link to="/predictive-runways" className="quick-action-card hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
            <div className="rounded-lg bg-accent-light p-3 text-accent transition group-hover:bg-accent group-hover:text-white">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-navy">Predictive Runways</p>
              <p className="text-xs text-navy-secondary">Review AI stock runway predictions</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Pending Product Requests (Admin) */}
      {visibleWidgets.requests && (
        <div className="card mb-8 hover:shadow-md transition-all duration-300">
          <h2 className="mb-4 text-lg font-semibold text-navy">Pending Product Requests</h2>
          {requestsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="spinner" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="py-8 text-center text-sm text-navy-secondary">No pending product requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-xs font-semibold uppercase tracking-wider text-navy-secondary">
                    <th className="pb-3 pr-4">Product Name</th>
                    <th className="pb-3 pr-4">Category</th>
                    <th className="pb-3 pr-4">Quantity</th>
                    <th className="pb-3 pr-4">Requested By</th>
                    <th className="pb-3 pr-4">User Notes</th>
                    <th className="pb-3 pr-4">Requested At</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {pendingRequests.map((req) => (
                    <tr key={req.request_id} className="text-navy-secondary hover:bg-primary-light/10">
                      <td className="py-3 pr-4 font-medium text-navy">
                        {req.product_name}
                        {req.product_id ? (
                          <span className="ml-1.5 inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-2xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                            Restock
                          </span>
                        ) : (
                          <span className="ml-1.5 inline-flex items-center rounded bg-secondary-light px-1.5 py-0.5 text-2xs font-medium text-secondary ring-1 ring-inset ring-secondary/20">
                            New Item
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">{req.category_name || '-'}</td>
                      <td className="py-3 pr-4">{req.quantity}</td>
                      <td className="py-3 pr-4">{req.user_name}</td>
                      <td className="py-3 pr-4 italic text-sm">{req.remarks || <span className="text-navy-secondary/40">-</span>}</td>
                      <td className="py-3 pr-4 text-navy-secondary/80">{new Date(req.created_at).toLocaleDateString()}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResolveOpen(req, 'approved')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-primary-light text-primary hover:bg-primary hover:text-white transition"
                            title="Approve Request"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleResolveOpen(req, 'rejected')}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition"
                            title="Reject Request"
                          >
                            <X className="h-4 w-4" />
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
      )}

      {/* Recent Transactions */}
      {visibleWidgets.transactions && (
        <div className="card mb-8 hover:shadow-md transition-all duration-300">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-navy">Recent Transactions</h2>
            
            {/* Interactive Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-navy-secondary font-medium">Filter Type:</span>
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value as any)}
                className="rounded-lg border border-surface-border bg-white px-2.5 py-1.5 text-xs font-semibold text-navy shadow-sm focus:border-primary focus:outline-none"
              >
                <option value="all">All Transactions</option>
                <option value="stock_in">Stock In Only</option>
                <option value="stock_out">Stock Out Only</option>
              </select>
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
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
                  {filteredTransactions.map((txn) => (
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
            <p className="py-8 text-center text-sm text-navy-secondary">No matching transactions found</p>
          )}
        </div>
      )}

      {/* Resolve Request Modal (Admin only) */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title={resolveForm.status === 'approved' ? 'Approve Product Request' : 'Reject Product Request'}
      >
        <form onSubmit={handleResolveSubmit} className="space-y-4">
          {resolveError && <div className="alert-error">{resolveError}</div>}
          <div className="rounded-lg bg-surface-muted p-4">
            <p className="text-sm font-medium text-navy">{resolveRequest?.product_name}</p>
            <p className="text-xs text-navy-secondary">
              Requested by {resolveRequest?.user_name} (Qty: {resolveRequest?.quantity})
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">
              Remarks / Comments {resolveForm.status === 'rejected' && <span className="text-accent">*</span>}
            </label>
            <textarea
              required={resolveForm.status === 'rejected'}
              rows={3}
              value={resolveForm.remarks}
              onChange={(e) => setResolveForm({ ...resolveForm, remarks: e.target.value })}
              className="input-field"
              placeholder={resolveForm.status === 'approved' ? 'Optional comments (e.g. Stock ordered)' : 'Reason for rejection (Required)'}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowResolveModal(false)} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition disabled:opacity-50 ${
                resolveForm.status === 'approved' ? 'bg-primary hover:bg-primary-dark' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {submitting ? 'Processing...' : resolveForm.status === 'approved' ? 'Approve & Save' : 'Reject & Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
