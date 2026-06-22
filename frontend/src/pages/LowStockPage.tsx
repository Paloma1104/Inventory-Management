import { useEffect, useState, useCallback, useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SearchFilterBar, { useFilteredList } from '../components/SearchFilterBar';
import { productsApi } from '../services/api';
import type { Product } from '../types';

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    productsApi.list()
      .then(({ data }) => setProducts(data.filter((p) => p.status === 'low_stock' || p.status === 'out_of_stock')))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const searchFields = useCallback(
    (p: Product) => [p.product_name, p.sku, p.category_name || ''],
    [],
  );

  const filteredProducts = useFilteredList(products, search, searchFields);

  const outOfStockCount = useMemo(() => products.filter((p) => p.status === 'out_of_stock').length, [products]);

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
        title="Low Stock Alerts"
        description="Products at or below minimum stock levels"
        actions={<Link to="/inventory" className="btn-secondary">Manage Stock</Link>}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{products.filter((p) => p.status === 'low_stock').length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Out of Stock</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{outOfStockCount}</p>
        </div>
      </div>

      <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search low stock products..." />

      <div className="card overflow-hidden !p-0">
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="h-8 w-8" />}
            title="No low stock alerts"
            description="All products are above their minimum stock levels."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr className="text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">Current Qty</th>
                  <th className="px-6 py-3">Min Level</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredProducts.map((product) => (
                  <tr key={product.product_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{product.product_name}</td>
                    <td className="px-6 py-4 text-gray-600">{product.category_name}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{product.current_quantity}</td>
                    <td className="px-6 py-4 text-gray-600">{product.minimum_stock_level}</td>
                    <td className="px-6 py-4"><Badge status={product.status || 'low_stock'} /></td>
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
