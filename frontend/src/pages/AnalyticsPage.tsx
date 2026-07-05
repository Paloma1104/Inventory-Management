import { useEffect, useState } from 'react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import { dashboardApi, aiApi } from '../services/api';
import { colors } from '../theme/colors';
import type { Analytics, StockRunwayPrediction } from '../types';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [predictions, setPredictions] = useState<StockRunwayPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.analytics(),
      aiApi.getPredictions(),
    ])
      .then(([{ data: analyticsData }, { data: predictionsData }]) => {
        setAnalytics(analyticsData);
        setPredictions(predictionsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }


  const monthlyChartData = analytics?.monthly_changes.map((m) => ({
    name: m.month,
    'Stock In': m.stock_in,
    'Stock Out': m.stock_out,
  })) || [];

  return (
    <div>
      <PageHeader title="Analytics" description="Inventory insights and activity overview" />

      {/* Prominently featured first: Low Stock Products and Monthly Inventory Changes side-by-side */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-navy">Low Stock Products</h3>
          {analytics?.low_stock_products && analytics.low_stock_products.length > 0 ? (
            <div className="space-y-3">
              {analytics.low_stock_products.map((product) => (
                <div key={product.product_id} className="flex items-center justify-between rounded-lg border border-surface-border p-3">
                  <div>
                    <p className="text-sm font-medium text-navy">{product.product_name}</p>
                    <p className="text-xs text-navy-secondary">{product.category_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-navy-secondary">{product.current_quantity} / {product.minimum_stock_level}</span>
                    <Badge status={product.status || 'low_stock'} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-navy-secondary">All products are well stocked</p>
          )}
        </div>

        <div className="card">
          <h3 className="mb-6 text-lg font-semibold text-navy">Monthly Inventory Changes</h3>
          {monthlyChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: colors.navySecondary }} />
                <YAxis tick={{ fontSize: 12, fill: colors.navySecondary }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Stock In" stroke={colors.primary} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Stock Out" stroke={colors.accent} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-16 text-center text-sm text-navy-secondary">No transaction data available yet</p>
          )}
        </div>
      </div>

      {/* Followed by: Predictive Stock Runaways (Full Width) */}
      <div className="card overflow-hidden">
        <div className="border-b border-surface-border pb-4 mb-4">
          <h3 className="text-lg font-semibold text-navy">Predictive Stock Runaways</h3>
          <p className="text-xs text-navy-secondary mt-0.5">
            30-day product velocity forecasting derived from historical consumption trends.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#F7FAFC] text-xs font-medium uppercase tracking-wider text-navy-secondary border-b border-surface-border">
              <tr>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3 text-center">Current Stock</th>
                <th className="px-4 py-3 text-center">Projected 30-Day Demand</th>
                <th className="px-4 py-3 text-center">Avg Lead Time</th>
                <th className="px-4 py-3 text-center">Order Cycle</th>
                <th className="px-4 py-3 text-right">Runway Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border text-navy">
              {predictions.map((item) => (
                <tr key={item.product_id} className="hover:bg-[#F7FAFC] transition-colors">
                  <td className="px-4 py-3.5 font-medium text-[#002B49]">{item.product_name}</td>
                  <td className="px-4 py-3.5 text-center font-semibold">{item.current_stock} units</td>
                  <td className="px-4 py-3.5 text-center text-[#4A5568]">{item.predicted_30_day_demand} units</td>
                  <td className="px-4 py-3.5 text-center font-medium text-[#4A5568]">{item.average_lead_time_days} days</td>
                  <td className="px-4 py-3.5 text-center text-[#4A5568]">{item.order_frequency_pattern}</td>
                  <td className="px-4 py-3.5 text-right">
                    {item.recommended_reorder_window_days <= 3 ? (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-yellow-50 text-yellow-700 border-yellow-200 inline-block text-center whitespace-nowrap">
                        ACTION REQUIRED: Order within {item.recommended_reorder_window_days} days
                      </span>
                    ) : (
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        item.stock_runway_status.includes('RISK')
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {item.stock_runway_status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
