import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Package, Eye } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import EmptyState from '../components/EmptyState';
import SearchFilterBar, { useFilteredList } from '../components/SearchFilterBar';
import { productsApi, categoriesApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Product, Category } from '../types';

const emptyProduct = {
  product_name: '',
  category_id: 0,
  sku: '',
  description: '',
  price: 0,
  current_quantity: 0,
  minimum_stock_level: 10,
};

export default function ProductsPage() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyProduct);
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
    (p: Product) => [p.product_name, p.sku, p.category_name || '', p.description],
    [],
  );

  const filteredProducts = useFilteredList(products, search, searchFields, [
    { field: (p) => p.category_name || '', value: categoryFilter },
    { field: (p) => p.status || 'in_stock', value: statusFilter },
  ]);

  const openCreate = () => {
    setEditProduct(null);
    setForm({ ...emptyProduct, category_id: categories[0]?.category_id || 0 });
    setError('');
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      product_name: product.product_name,
      category_id: product.category_id,
      sku: product.sku,
      description: product.description,
      price: product.price,
      current_quantity: product.current_quantity,
      minimum_stock_level: product.minimum_stock_level,
    });
    setError('');
    setShowModal(true);
  };

  const openDetails = (product: Product) => {
    setViewProduct(product);
    setShowDetails(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editProduct) {
        await productsApi.update(editProduct.product_id, form);
      } else {
        await productsApi.create(form);
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof message === 'string' ? message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete product "${product.product_name}"?`)) return;
    try {
      await productsApi.delete(product.product_id);
      fetchData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      alert(typeof message === 'string' ? message : 'Delete failed');
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
        title="Products"
        description="Manage product catalog, details, and specifications"
        actions={isAdmin ? (
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Product
          </button>
        ) : undefined}
      />

      <SearchFilterBar search={search} onSearchChange={setSearch} searchPlaceholder="Search by name, SKU, or description...">
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
            icon={<Package className="h-8 w-8" />}
            title={products.length === 0 ? 'No products yet' : 'No matching products'}
            description={products.length === 0 ? 'Add your first product to get started.' : 'Try adjusting your search or filters.'}
            action={isAdmin && products.length === 0 ? <button onClick={openCreate} className="btn-primary">Add Product</button> : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="table-header border-b border-surface-border">
                <tr className="text-xs font-medium uppercase tracking-wider text-navy-secondary">
                  <th className="px-6 py-3">Product Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3">SKU</th>
                  <th className="px-6 py-3">Price</th>
                  <th className="px-6 py-3">Quantity</th>
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
                    <td className="px-6 py-4 text-navy-secondary">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4 font-medium text-navy">{product.current_quantity}</td>
                    <td className="px-6 py-4"><Badge status={product.status || 'in_stock'} /></td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openDetails(product)} title="View Details" className="icon-btn">
                          <Eye className="h-4 w-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button onClick={() => openEdit(product)} className="icon-btn">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(product)} className="icon-btn-warning">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="alert-error">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Product Name</label>
              <input required value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">SKU</label>
              <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Category</label>
              <select required value={form.category_id} onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })} className="input-field">
                {categories.map((cat) => (
                  <option key={cat.category_id} value={cat.category_id}>{cat.category_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Price</label>
              <input required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Current Quantity</label>
              <input required type="number" min="0" value={form.current_quantity} onChange={(e) => setForm({ ...form, current_quantity: Number(e.target.value) })} className="input-field" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Minimum Stock Level</label>
              <input required type="number" min="0" value={form.minimum_stock_level} onChange={(e) => setForm({ ...form, minimum_stock_level: Number(e.target.value) })} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-navy-secondary">Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDetails} onClose={() => setShowDetails(false)} title="Product Details" size="lg">
        {viewProduct && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><p className="text-xs font-medium text-navy-secondary">Product Name</p><p className="mt-1 text-sm text-navy">{viewProduct.product_name}</p></div>
              <div><p className="text-xs font-medium text-navy-secondary">SKU</p><p className="mt-1 font-mono text-sm text-navy">{viewProduct.sku}</p></div>
              <div><p className="text-xs font-medium text-navy-secondary">Category</p><p className="mt-1 text-sm text-navy">{viewProduct.category_name}</p></div>
              <div><p className="text-xs font-medium text-navy-secondary">Status</p><div className="mt-1"><Badge status={viewProduct.status || 'in_stock'} /></div></div>
              <div><p className="text-xs font-medium text-navy-secondary">Price</p><p className="mt-1 text-sm text-navy">${viewProduct.price.toFixed(2)}</p></div>
              <div><p className="text-xs font-medium text-navy-secondary">Quantity</p><p className="mt-1 text-sm text-navy">{viewProduct.current_quantity}</p></div>
              <div><p className="text-xs font-medium text-navy-secondary">Minimum Stock</p><p className="mt-1 text-sm text-navy">{viewProduct.minimum_stock_level}</p></div>
              <div><p className="text-xs font-medium text-navy-secondary">Last Updated</p><p className="mt-1 text-sm text-navy">{new Date(viewProduct.updated_at).toLocaleString()}</p></div>
            </div>
            <div>
              <p className="text-xs font-medium text-navy-secondary">Description</p>
              <p className="mt-1 text-sm text-navy-secondary">{viewProduct.description || 'No description provided.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
