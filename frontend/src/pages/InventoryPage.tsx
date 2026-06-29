import { useEffect, useState, useCallback } from 'react';
import { Boxes, ArrowDownToLine, ArrowUpFromLine, Plus } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SearchFilterBar, { useFilteredList } from '../components/SearchFilterBar';
import { productsApi, categoriesApi, transactionsApi, productRequestsApi } from '../services/api';
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
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestProduct, setRequestProduct] = useState<Product | null>(null);
  const [requestForm, setRequestForm] = useState({ product_name: '', category_id: '', quantity: 1, remarks: '' });

  const openRequestModal = (product: Product | null) => {
    setRequestProduct(product);
    if (product) {
      setRequestForm({
        product_name: product.product_name,
        category_id: String(product.category_id),
        quantity: 1,
        remarks: '',
      });
    } else {
      setRequestForm({
        product_name: '',
        category_id: '',
        quantity: 1,
        remarks: '',
      });
    }
    setError('');
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await productRequestsApi.create({
        product_id: requestProduct ? requestProduct.product_id : undefined,
        product_name: requestForm.product_name,
        category_id: requestForm.category_id ? Number(requestForm.category_id) : undefined,
        quantity: requestForm.quantity,
        remarks: requestForm.remarks,
      });
      setShowRequestModal(false);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === 'string' ? message : 'Failed to submit product request');
    } finally {
      setSubmitting(false);
    }
  };

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
        {!isAdmin && (
          <button onClick={() => openRequestModal(null)} className="btn-primary flex items-center gap-1.5 py-2 px-4 text-sm font-medium">
            <Plus className="h-4 w-4" /> Request Product
          </button>
        )}
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
                <tr className="text-xs font-semibold uppercase tracking-wider text-navy-secondary">
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Quantity</th>
                  <th className="px-6 py-3">Min Level</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
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
                    <td className="px-6 py-4 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openStock(product, 'stock_in')} title="Stock In" className="icon-btn">
                            <ArrowDownToLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => openStock(product, 'stock_out')} title="Stock Out" className="icon-btn-warning">
                            <ArrowUpFromLine className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        (product.status === 'low_stock' || product.status === 'out_of_stock') ? (
                          <button onClick={() => openRequestModal(product)} className="btn-secondary py-1 px-3 text-xs" title="Request Restock">
                            Request Restock
                          </button>
                        ) : (
                          <span className="text-xs text-navy-secondary/60">-</span>
                        )
                      )}
                    </td>
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

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title={requestProduct ? 'Request Restock' : 'Request New Product'}>
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Product Name</label>
            <input
              required
              type="text"
              disabled={!!requestProduct}
              value={requestForm.product_name}
              onChange={(e) => setRequestForm({ ...requestForm, product_name: e.target.value })}
              className="input-field disabled:bg-surface-muted disabled:text-navy-secondary"
              placeholder="e.g. Acme Widgets"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Category</label>
            <select
              disabled={!!requestProduct}
              value={requestForm.category_id}
              onChange={(e) => setRequestForm({ ...requestForm, category_id: e.target.value })}
              className="input-field disabled:bg-surface-muted disabled:text-navy-secondary"
            >
              <option value="">Select Category (Optional)</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Quantity Requested</label>
            <input
              required
              type="number"
              min="1"
              value={requestForm.quantity}
              onChange={(e) => setRequestForm({ ...requestForm, quantity: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Remarks / Reason</label>
            <textarea
              rows={2}
              value={requestForm.remarks}
              onChange={(e) => setRequestForm({ ...requestForm, remarks: e.target.value })}
              className="input-field"
              placeholder="Why is this requested? e.g. High demand project"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowRequestModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Submitting...' : 'Submit Request'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
