import { useEffect, useState, useCallback, useMemo } from 'react';
import { ScrollText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import SearchFilterBar, { useFilteredList } from '../components/SearchFilterBar';
import { auditLogsApi } from '../services/api';
import type { AuditLog } from '../types';

const ACTION_FILTERS = [
  { value: '', label: 'All Activity' },
  { value: 'user', label: 'User Activity' },
  { value: 'product', label: 'Product Activity' },
  { value: 'stock', label: 'Inventory Changes' },
];

function matchesActionFilter(log: AuditLog, filter: string): boolean {
  if (!filter) return true;
  if (filter === 'user') return log.action.includes('User');
  if (filter === 'product') return ['Product Added', 'Product Updated', 'Product Deleted'].includes(log.action);
  if (filter === 'stock') return log.action === 'Stock Updated';
  return true;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  useEffect(() => {
    auditLogsApi.list()
      .then(({ data }) => setLogs(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const searchFields = useCallback(
    (log: AuditLog) => [log.user_name, log.action, log.product_name || '', log.details],
    [],
  );

  const searchedLogs = useFilteredList(logs, search, searchFields);
  const filteredLogs = useMemo(
    () => searchedLogs.filter((log) => matchesActionFilter(log, actionFilter)),
    [searchedLogs, actionFilter],
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit Logs" description="User activity, product changes, and inventory updates" />

      <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search logs by user, action, or details...">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-field w-auto">
          {ACTION_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </SearchFilterBar>

      <div className="card overflow-hidden !p-0">
        {filteredLogs.length === 0 ? (
          <EmptyState
            icon={<ScrollText className="h-8 w-8" />}
            title={logs.length === 0 ? 'No audit logs yet' : 'No matching logs'}
            description="System actions will be recorded here automatically."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Entity</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{log.user_name}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{log.product_name || '—'}</td>
                    <td className="px-6 py-4 max-w-md truncate text-gray-500">{log.details}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
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
