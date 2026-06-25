import { useEffect, useState, useCallback } from 'react';
import { Boxes, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SearchFilterBar, { useFilteredList } from '../components/SearchFilterBar';
import { productsApi, categoriesApi, transactionsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Product, Category } from '../types';
import logo from '../assets/blucursor-logo.png';

export default function InventoryPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({ transaction_type: 'stock_in', quantity: 1, remarks: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    Promise.all([productsApi.list(), categoriesApi.list()])
      .then(([productsRes, categoriesRes]) => {
        setProducts(productsRes.data);
        setCategories(categoriesRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const searchFields = useCallback(
    (p: Product) => [p.product_name, p.sku, p.category_name || ''],
    [],
  );

  const filteredProducts = useFilteredList(products, search, searchFields, [
    { field: (p) => p.category_name || '', value: categoryFilter },
    { field: (p) => p.status || 'in_stock', value: statusFilter },
  ]);

  const openStock = (product: Product, type: 'stock_in' | 'stock_out') => {
    setStockProduct(product);
    setStockForm({ transaction_type: type, quantity: 1, remarks: '' });
    setError('');
    setShowStockModal(true);
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockProduct) return;
    setError('');
    setSubmitting(true);
    try {
      await transactionsApi.create({
        product_id: stockProduct.product_id,
        transaction_type: stockForm.transaction_type,
        quantity: stockForm.quantity,
        remarks: stockForm.remarks,
      });
      setShowStockModal(false);
      fetchData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === 'string' ? message : 'Stock update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="BluCursor logo" className="h-8 w-8 rounded-full object-cover" />
            <span>BluCursor Inventory</span>
          </div>
        }
        description="Manage stock levels with stock in and stock out operations"
      />

      <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search inventory...">
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </SearchFilterBar>

      <div className="card overflow-hidden !p-0">
        {filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Boxes className="h-8 w-8" />}
            title="No inventory items found"
            description="Add products first, then manage stock levels here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="table-header border-b border-surface-border">
                <tr className="text-xs font-medium uppercase tracking-wider text-navy-secondary">
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Min Level</th>
                  <th className="px-6 py-3">Status</th>
                  {isAdmin && <th className="px-6 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredProducts.map((product) => (
                  <tr key={product.product_id} className="table-row">
                    <td className="px-6 py-4 font-medium text-navy">{product.product_name}</td>
                    <td className="px-6 py-4 text-navy-secondary">{product.category_name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-navy-secondary">{product.sku}</td>
                    <td className="px-6 py-4 font-medium text-navy">{product.current_quantity}</td>
                    <td className="px-6 py-4 text-navy-secondary">{product.minimum_stock_level}</td>
                    <td className="px-6 py-4"><Badge status={product.status || 'in_stock'} /></td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openStock(product, 'stock_in')} title="Stock In" className="icon-btn">
                            <ArrowDownToLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => openStock(product, 'stock_out')} title="Stock Out" className="icon-btn-warning">
                            <ArrowUpFromLine className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showStockModal} onClose={() => setShowStockModal(false)} title={stockForm.transaction_type === 'stock_in' ? 'Stock In' : 'Stock Out'}>
        <form onSubmit={handleStockSubmit} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div className="rounded-lg bg-surface-muted p-4">
            <p className="text-sm font-medium text-navy">{stockProduct?.product_name}</p>
            <p className="text-xs text-navy-secondary">Current stock: {stockProduct?.current_quantity} units</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Quantity</label>
            <input required type="number" min="1" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: Number(e.target.value) })} className="input-field" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Remarks</label>
            <textarea rows={2} value={stockForm.remarks} onChange={(e) => setStockForm({ ...stockForm, remarks: e.target.value })} className="input-field" placeholder="Optional notes..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowStockModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Processing...' : 'Confirm'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
