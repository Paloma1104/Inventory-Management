import { useEffect, useState, useCallback, useMemo } from 'react';
import { TrendingDown, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SearchFilterBar, { useFilteredList } from '../components/SearchFilterBar';
import { aiApi } from '../services/api';
import type { StockRunwayPrediction } from '../types';

export default function PredictiveRunwaysPage() {
  const [predictions, setPredictions] = useState<StockRunwayPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async (active: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await aiApi.getPredictions();
      if (active) setPredictions(data);
    } catch (err) {
      console.error(err);
      if (active) setError('Failed to load predictive runway data. Please ensure the server is online.');
    } finally {
      if (active) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchPredictions(active);
    return () => {
      active = false;
    };
  }, [fetchPredictions]);

  const searchFields = useCallback(
    (p: StockRunwayPrediction) => [p.product_name, p.stock_runway_status],
    [],
  );

  const filters = useMemo(() => [
    {
      field: (p: StockRunwayPrediction) => p.stock_runway_status,
      value: statusFilter,
    }
  ], [statusFilter]);

  const filteredPredictions = useFilteredList(predictions, search, searchFields, filters);

  const stats = useMemo(() => {
    if (predictions.length === 0) {
      return { total: 0, critical: 0, avgLeadTime: 0 };
    }
    const critical = predictions.filter(
      (p) => p.recommended_reorder_window_days <= 3 || p.stock_runway_status.includes('RISK') || p.stock_runway_status.includes('CRITICAL')
    ).length;
    const totalLeadTime = predictions.reduce((acc, p) => acc + p.average_lead_time_days, 0);
    return {
      total: predictions.length,
      critical,
      avgLeadTime: (totalLeadTime / predictions.length).toFixed(1),
    };
  }, [predictions]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  // Get unique statuses for dropdown filter
  const uniqueStatuses = Array.from(new Set(predictions.map((p) => p.stock_runway_status)));

  return (
    <div>
      <PageHeader
        title="Predictive Stock Runaways"
        description="AI-powered 30-day velocity forecasting and reorder recommendations based on consumption trends."
      />

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="mb-6 grid gap-6 sm:grid-cols-3">
        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-navy-secondary font-medium uppercase tracking-wider">Monitored Products</p>
            <p className="mt-1 text-2xl font-bold text-navy">{stats.total}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className={`rounded-lg p-3 ${stats.critical > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-navy-secondary font-medium uppercase tracking-wider">High Risk / Action Needed</p>
            <p className="mt-1 text-2xl font-bold text-navy">{stats.critical}</p>
          </div>
        </div>

        <div className="card flex items-center gap-4">
          <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-navy-secondary font-medium uppercase tracking-wider">Avg Lead Time</p>
            <p className="mt-1 text-2xl font-bold text-navy">{stats.avgLeadTime} days</p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search products by name..."
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm font-medium text-navy shadow-sm focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          {uniqueStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </SearchFilterBar>

      {/* Predictions Table */}
      <div className="card overflow-hidden !p-0">
        {filteredPredictions.length === 0 ? (
          <div className="py-16 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-navy-secondary mb-4" />
            <h3 className="text-lg font-semibold text-navy mb-1">No Runway Data Found</h3>
            <p className="text-sm text-navy-secondary">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#F7FAFC] text-xs font-medium uppercase tracking-wider text-navy-secondary border-b border-surface-border">
                <tr>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4 text-center">Current Stock</th>
                  <th className="px-6 py-4 text-center">Projected 30-Day Demand</th>
                  <th className="px-6 py-4 text-center">Avg Lead Time</th>
                  <th className="px-6 py-4 text-center">Order Cycle</th>
                  <th className="px-6 py-4 text-center">Reorder Window</th>
                  <th className="px-6 py-4 text-right">Runway Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border text-navy">
                {filteredPredictions.map((item) => (
                  <tr key={item.product_id} className="hover:bg-[#F7FAFC] transition-colors">
                    <td className="px-6 py-4 font-semibold text-[#002B49]">{item.product_name}</td>
                    <td className="px-6 py-4 text-center font-medium">{item.current_stock} units</td>
                    <td className="px-6 py-4 text-center text-[#4A5568]">{item.predicted_30_day_demand} units</td>
                    <td className="px-6 py-4 text-center text-[#4A5568]">{item.average_lead_time_days} days</td>
                    <td className="px-6 py-4 text-center text-[#4A5568] font-medium">{item.order_frequency_pattern}</td>
                    <td className="px-6 py-4 text-center">
                      {item.recommended_reorder_window_days <= 3 ? (
                        <span className="inline-block px-2.5 py-1 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full animate-pulse">
                          Reorder in {item.recommended_reorder_window_days}d!
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full">
                          Within {item.recommended_reorder_window_days} days
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${
                        item.stock_runway_status.includes('RISK') || item.stock_runway_status.includes('CRITICAL')
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : item.stock_runway_status.includes('MODERATE')
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {item.stock_runway_status}
                      </span>
                    </td>
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
