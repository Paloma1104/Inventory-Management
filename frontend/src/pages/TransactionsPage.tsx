import { useEffect, useState, useCallback } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SearchFilterBar, { useFilteredList } from '../components/SearchFilterBar';
import { transactionsApi } from '../services/api';
import type { Transaction } from '../types';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (active: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await transactionsApi.list();
      if (active) setTransactions(data);
    } catch (err) {
      console.error(err);
      if (active) setError('Failed to load transaction history. Please verify database connection.');
    } finally {
      if (active) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchTransactions(active);
    return () => {
      active = false;
    };
  }, [fetchTransactions]);

  const searchFields = useCallback(
    (t: Transaction) => [t.product_name, t.user_name, t.remarks, t.transaction_type],
    [],
  );

  const filteredTransactions = useFilteredList(transactions, search, searchFields, [
    { field: (t) => t.transaction_type, value: typeFilter },
  ]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Transaction History" description="All inventory stock movements and updates" />

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 border border-red-200">
          ⚠️ {error}
        </div>
      )}

      <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by product, user, or remarks...">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Types</option>
          <option value="stock_in">Stock In</option>
          <option value="stock_out">Stock Out</option>
        </select>
      </SearchFilterBar>

      <div className="card overflow-hidden !p-0">
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={<ArrowLeftRight className="h-8 w-8" />}
            title={transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
            description="Stock in/out operations will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="table-header border-b border-surface-border">
                <tr className="text-xs font-medium uppercase tracking-wider text-text-navy-secondary">
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Transaction Type</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Remarks</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredTransactions.map((txn) => (
                  <tr key={txn.transaction_id} className="table-row">
                    <td className="px-6 py-4 font-medium text-navy">{txn.product_name}</td>
                    <td className="px-6 py-4"><Badge status={txn.transaction_type} /></td>
                    <td className="px-6 py-4 font-medium text-navy">{txn.quantity}</td>
                    <td className="px-6 py-4 text-navy-secondary">{txn.user_name}</td>
                    <td className="px-6 py-4 text-text-navy-secondary">{txn.remarks || '—'}</td>
                    <td className="px-6 py-4 text-text-navy-secondary">{new Date(txn.created_at).toLocaleString()}</td>
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
