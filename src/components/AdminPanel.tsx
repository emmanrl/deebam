import React, { useState, useEffect } from 'react';
import { 
  BarChart3, Package, ClipboardList, Settings, Plus, Edit2, Trash2, 
  Check, Loader2, DollarSign, RefreshCw, Layers, ArrowLeftRight, X, CreditCard, Mail
} from 'lucide-react';
import { Category, Product, Order, SalesSummary } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const AdminPanel: React.FC = () => {
  const { token } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'dashboard' | 'products' | 'categories' | 'orders' | 'payments' | 'newsletter'>('dashboard');

  // Loading and refreshing states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [ordersList, setOrdersList] = useState<Order[]>([]);

  // Category Form State
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categorySlug, setCategorySlug] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  // Product Form State
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<number | ''>('');
  const [prodWeight, setProdWeight] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');

  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Newsletter Subscribers State
  const [subscribers, setSubscribers] = useState<{ id: number; email: string; createdAt: string }[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(false);

  // Payments form configurations (preserves in localStorage)
  const [stripeEnabled, setStripeEnabled] = useState(() => localStorage.getItem('pay_stripe_enabled') === 'true');
  const [stripePK, setStripePK] = useState(() => localStorage.getItem('pay_stripe_pk') || '');
  const [stripeSK, setStripeSK] = useState(() => localStorage.getItem('pay_stripe_sk') || '');
  
  const [paypalEnabled, setPaypalEnabled] = useState(() => localStorage.getItem('pay_paypal_enabled') === 'true');
  const [paypalClientID, setPaypalClientID] = useState(() => localStorage.getItem('pay_paypal_client') || '');
  const [paypalSecret, setPaypalSecret] = useState(() => localStorage.getItem('pay_paypal_secret') || '');

  const [klarnaEnabled, setKlarnaEnabled] = useState(() => localStorage.getItem('pay_klarna_enabled') === 'true');
  const [klarnaUser, setKlarnaUser] = useState(() => localStorage.getItem('pay_klarna_user') || '');
  const [klarnaPass, setKlarnaPass] = useState(() => localStorage.getItem('pay_klarna_pass') || '');

  const [bacsEnabled, setBacsEnabled] = useState(() => localStorage.getItem('pay_bacs_enabled') === 'true');
  const [bacsSortCode, setBacsSortCode] = useState(() => localStorage.getItem('pay_bacs_sort') || '');
  const [bacsAccount, setBacsAccount] = useState(() => localStorage.getItem('pay_bacs_acc') || '');
  const [bacsBank, setBacsBank] = useState(() => localStorage.getItem('pay_bacs_bank') || '');

  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);

  // Load backend data
  const loadAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch categories
      const catRes = await fetch('/api/categories');
      const catData = await catRes.json();
      setCategoriesList(catData);

      // Fetch products
      const prodRes = await fetch('/api/products');
      const prodData = await prodRes.json();
      setProductsList(prodData);

      // Fetch orders
      const ordRes = await fetch('/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      setOrdersList(Array.isArray(ordData) ? ordData : []);

      // Fetch sales summary
      const sumRes = await fetch('/api/admin/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const sumData = await sumRes.json();
      setSummary(sumData);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setError('Failed to sync administrative data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  // Load subscribers list
  const loadSubscribers = async () => {
    setLoadingSubscribers(true);
    try {
      const res = await fetch('/api/admin/newsletter-subscribers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubscribers(data);
      }
    } catch (err) {
      console.error('Failed to load newsletter subscribers:', err);
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    if (token && activeSubTab === 'newsletter') {
      loadSubscribers();
    }
  }, [token, activeSubTab]);

  const handleSavePayments = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSuccess(null);
    try {
      localStorage.setItem('pay_stripe_enabled', stripeEnabled ? 'true' : 'false');
      localStorage.setItem('pay_stripe_pk', stripePK);
      localStorage.setItem('pay_stripe_sk', stripeSK);

      localStorage.setItem('pay_paypal_enabled', paypalEnabled ? 'true' : 'false');
      localStorage.setItem('pay_paypal_client', paypalClientID);
      localStorage.setItem('pay_paypal_secret', paypalSecret);

      localStorage.setItem('pay_klarna_enabled', klarnaEnabled ? 'true' : 'false');
      localStorage.setItem('pay_klarna_user', klarnaUser);
      localStorage.setItem('pay_klarna_pass', klarnaPass);

      localStorage.setItem('pay_bacs_enabled', bacsEnabled ? 'true' : 'false');
      localStorage.setItem('pay_bacs_sort', bacsSortCode);
      localStorage.setItem('pay_bacs_acc', bacsAccount);
      localStorage.setItem('pay_bacs_bank', bacsBank);

      setPaymentSuccess('Payment Gateway configurations saved successfully! Only your live API keys are required to begin accepting real pounds.');
      setTimeout(() => setPaymentSuccess(null), 5000);
    } catch (err) {
      console.error(err);
    }
  };

  // CATEGORIES CRUD OPERATIONS
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName) return;

    setActionLoading(true);
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: categoryName,
          slug: categorySlug,
          description: categoryDesc
        })
      });

      if (res.ok) {
        setShowCategoryForm(false);
        setEditingCategory(null);
        setCategoryName('');
        setCategorySlug('');
        setCategoryDesc('');
        await loadAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit category');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategorySlug(cat.slug);
    setCategoryDesc(cat.description || '');
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm('Are you sure you want to delete this category? All linked products will be deleted or unlinked!')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await loadAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete category');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // PRODUCTS CRUD OPERATIONS
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodCategory || !prodPrice) return;

    setActionLoading(true);
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: prodName,
          categoryId: prodCategory,
          weightSize: prodWeight,
          description: prodDesc,
          price: prodPrice,
          imageUrl: prodImage,
          stockQuantity: prodStock || '0'
        })
      });

      if (res.ok) {
        setShowProductForm(false);
        setEditingProduct(null);
        setProdName('');
        setProdCategory('');
        setProdWeight('');
        setProdPrice('');
        setProdStock('');
        setProdDesc('');
        setProdImage('');
        await loadAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save product');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdName(prod.name);
    setProdCategory(prod.categoryId);
    setProdWeight(prod.weightSize || '');
    setProdPrice(prod.price.toString());
    setProdStock(prod.stockQuantity.toString());
    setProdDesc(prod.description || '');
    setProdImage(prod.imageUrl || '');
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await loadAdminData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete product');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ORDER ACTIONS
  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        await loadAdminData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
        }
      } else {
        alert('Failed to update order status');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" id="admin-panel-container">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-5 mb-6" id="admin-panel-header">
        <div>
          <h1 className="font-display font-extrabold text-3xl text-earth-green-600 leading-none">
            Seller Admin Hub
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Manage your store, categories, inventory, and fulfill UK-wide shopper requests.
          </p>
        </div>
        <button
          onClick={loadAdminData}
          className="mt-4 sm:mt-0 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
          title="Refresh Dashboard"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Admin Subtabs Bar */}
      <div className="flex flex-wrap gap-1 p-1 bg-slate-100 rounded-2xl mb-8 font-bold text-xs sm:text-sm" id="admin-subtabs">
        <button
          onClick={() => setActiveSubTab('dashboard')}
          className={`flex-1 py-3 px-3 rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeSubTab === 'dashboard' ? 'bg-white text-earth-green-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveSubTab('products')}
          className={`flex-1 py-3 px-3 rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeSubTab === 'products' ? 'bg-white text-earth-green-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Catalog</span>
        </button>
        <button
          onClick={() => setActiveSubTab('categories')}
          className={`flex-1 py-3 px-3 rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeSubTab === 'categories' ? 'bg-white text-earth-green-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Categories</span>
        </button>
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`flex-1 py-3 px-3 rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeSubTab === 'orders' ? 'bg-white text-earth-green-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          <span>Orders</span>
        </button>
        <button
          onClick={() => setActiveSubTab('payments')}
          className={`flex-1 py-3 px-3 rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeSubTab === 'payments' ? 'bg-white text-earth-green-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>UK Payments</span>
        </button>
        <button
          onClick={() => setActiveSubTab('newsletter')}
          className={`flex-1 py-3 px-3 rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeSubTab === 'newsletter' ? 'bg-white text-earth-green-500 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>Subscribers</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-3" id="admin-loading-state">
          <Loader2 className="h-10 w-10 animate-spin text-earth-green-500" />
          <span className="text-sm font-semibold">Syncing store records...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl font-bold" id="admin-error-state">
          {error}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeSubTab === 'dashboard' && summary && (
            <div className="space-y-8 animate-fade-in" id="admin-dashboard-view">
              
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Gross Sales</span>
                    <h3 className="font-display font-extrabold text-2xl text-slate-800 mt-1">
                      £{(summary.totalRevenue || 0).toFixed(2)}
                    </h3>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <DollarSign className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Fulfillment Orders</span>
                    <h3 className="font-display font-extrabold text-2xl text-slate-800 mt-1">
                      {summary.totalOrders || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-earth-green-50 text-earth-green-500 rounded-2xl">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Stock Items</span>
                    <h3 className="font-display font-extrabold text-2xl text-slate-800 mt-1">
                      {summary.totalProducts || 0}
                    </h3>
                  </div>
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <Package className="h-6 w-6" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase">Low Stock Warnings</span>
                    <h3 className="font-display font-extrabold text-2xl text-rose-600 mt-1">
                      {summary.lowStockCount || 0}
                    </h3>
                  </div>
                  <div className={`p-3 rounded-2xl ${summary.lowStockCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Package className="h-6 w-6" />
                  </div>
                </div>
              </div>

              {/* Advanced Summary Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Popular Products List */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-lg border-b border-slate-50 pb-2">
                    Top-Selling Popular Items
                  </h3>
                  {(!summary.popularItems || summary.popularItems.length === 0) ? (
                    <p className="text-xs text-slate-400 text-center py-6">No items have been ordered yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {summary.popularItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between py-3 first:pt-0">
                          <div>
                            <span className="text-xs font-bold text-slate-400 mr-2">{index + 1}.</span>
                            <span className="text-sm font-bold text-slate-700">{item.productName}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-earth-green-600 block">{item.totalSold} sold</span>
                            <span className="text-[10px] text-slate-400">Total: £{item.totalRevenue.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category Inventory Spread */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-lg border-b border-slate-50 pb-2">
                    Category Inventory Breakdown
                  </h3>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {summary.categoryBreakdown?.map((cat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>{cat.categoryName}</span>
                          <span>{cat.productCount} items</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-warm-gold-500 h-full rounded-full transition-all duration-500" 
                            style={{ 
                              width: `${Math.min(100, (cat.productCount / Math.max(1, summary.totalProducts)) * 100)}%` 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRODUCT CATALOG */}
          {activeSubTab === 'products' && (
            <div className="space-y-6 animate-fade-in" id="admin-products-view">
              
              {/* Controls bar */}
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                <span className="text-sm text-slate-500 font-medium">
                  Currently managing <strong className="text-slate-800">{productsList.length}</strong> products
                </span>
                
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setProdName('');
                    setProdCategory('');
                    setProdWeight('');
                    setProdPrice('');
                    setProdStock('');
                    setProdDesc('');
                    setProdImage('');
                    setShowProductForm(true);
                  }}
                  className="px-4 py-2.5 bg-earth-green-500 hover:bg-earth-green-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                  id="add-prod-btn"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Form Card (conditional modal-like overlay or header) */}
              {showProductForm && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 animate-scale-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="font-display font-extrabold text-slate-800 text-lg">
                      {editingProduct ? 'Edit Grocery Product' : 'Add New Grocery Product'}
                    </h3>
                    <button onClick={() => setShowProductForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Product Name *</label>
                      <input 
                        type="text" 
                        required 
                        value={prodName} 
                        onChange={(e) => setProdName(e.target.value)}
                        placeholder="e.g. White Yam Tuber"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Store Category *</label>
                      <select 
                        required 
                        value={prodCategory} 
                        onChange={(e) => setProdCategory(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white"
                      >
                        <option value="">-- Choose Category --</option>
                        {categoriesList.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Weight / Size label</label>
                      <input 
                        type="text" 
                        value={prodWeight} 
                        onChange={(e) => setProdWeight(e.target.value)}
                        placeholder="e.g. 1kg, 500g, Single Unit"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Price (£ GBP) *</label>
                        <input 
                          type="number" 
                          step="0.01" 
                          required 
                          value={prodPrice} 
                          onChange={(e) => setProdPrice(e.target.value)}
                          placeholder="e.g. 4.99"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Stock Quantity *</label>
                        <input 
                          type="number" 
                          required 
                          value={prodStock} 
                          onChange={(e) => setProdStock(e.target.value)}
                          placeholder="e.g. 50"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                      <textarea 
                        value={prodDesc} 
                        onChange={(e) => setProdDesc(e.target.value)}
                        placeholder="Describe the product size, origin, flavor, or traditional use..."
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="block text-xs font-bold text-slate-500">Product Image</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* URL Method */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Option A: Image URL Reference</span>
                          <input 
                            type="text" 
                            value={prodImage} 
                            onChange={(e) => setProdImage(e.target.value)}
                            placeholder="https://images.unsplash.com/... or base64"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 bg-slate-50"
                          />
                        </div>
                        {/* File Upload Method */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block">Option B: Upload From Phone/PC</span>
                          <div className="relative flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-3 bg-slate-50/50 hover:bg-slate-50 hover:border-earth-green-400 transition-colors">
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    if (typeof reader.result === 'string') {
                                      setProdImage(reader.result);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="text-center space-y-1">
                              <span className="text-[11px] font-bold text-earth-green-600 block">Choose Photo...</span>
                              <span className="text-[9px] text-slate-400">Camera / Files (Max 5MB)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Live Preview */}
                      {prodImage && (
                        <div className="flex items-center space-x-3 p-2.5 bg-slate-50 border border-slate-100 rounded-xl mt-2 animate-scale-up">
                          <img 
                            src={prodImage} 
                            alt="Preview" 
                            className="h-12 w-12 rounded-lg object-cover border border-slate-200 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="overflow-hidden">
                            <span className="text-[11px] font-bold text-slate-700 block">Image Selected</span>
                            <span className="text-[9px] text-slate-400 block truncate">{prodImage.startsWith('data:') ? 'Local Base64 Data URL' : prodImage}</span>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setProdImage('')}
                            className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 flex justify-end space-x-3 pt-3 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setShowProductForm(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        className="px-5 py-2 bg-earth-green-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save Product</span>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products Catalog Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="products-table-container">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 font-bold text-slate-500 text-xs uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-6 py-4">Product Info</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-right">Price</th>
                        <th className="px-6 py-4 text-center">Stock</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {productsList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No products found. Add some above!</td>
                        </tr>
                      ) : (
                        productsList.map((prod) => (
                          <tr key={prod.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 flex items-center space-x-3">
                              <div className="h-10 w-10 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                                {prod.imageUrl ? (
                                  <img src={prod.imageUrl} alt={prod.name} className="object-cover h-full w-full" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-800 block">{prod.name}</span>
                                {prod.weightSize && <span className="text-[10px] text-slate-400 font-semibold">{prod.weightSize}</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-semibold text-warm-gold-600 uppercase">
                              {prod.categoryName}
                            </td>
                            <td className="px-6 py-4 text-right font-display font-extrabold text-slate-800">
                              £{prod.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                prod.stockQuantity <= 0 
                                  ? 'bg-rose-50 text-rose-600' 
                                  : prod.stockQuantity <= 5 
                                    ? 'bg-amber-50 text-amber-600' 
                                    : 'bg-emerald-50 text-emerald-600'
                              }`}>
                                {prod.stockQuantity} Left
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button 
                                onClick={() => handleEditProduct(prod)}
                                className="p-1.5 text-slate-400 hover:text-earth-green-500 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                                title="Edit Product"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteProduct(prod.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGER */}
          {activeSubTab === 'categories' && (
            <div className="space-y-6 animate-fade-in" id="admin-categories-view">
              
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
                <span className="text-sm text-slate-500 font-medium">
                  Currently managing <strong className="text-slate-800">{categoriesList.length}</strong> categories
                </span>
                
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryName('');
                    setCategorySlug('');
                    setCategoryDesc('');
                    setShowCategoryForm(true);
                  }}
                  className="px-4 py-2.5 bg-earth-green-500 hover:bg-earth-green-600 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all shadow-sm cursor-pointer"
                  id="add-cat-btn"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Form Card */}
              {showCategoryForm && (
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md space-y-4 animate-scale-up">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="font-display font-extrabold text-slate-800 text-lg">
                      {editingCategory ? 'Edit Store Category' : 'Add New Category'}
                    </h3>
                    <button onClick={() => setShowCategoryForm(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCategorySubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Category Name *</label>
                        <input 
                          type="text" 
                          required 
                          value={categoryName} 
                          onChange={(e) => {
                            setCategoryName(e.target.value);
                            if (!editingCategory) {
                              setCategorySlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                            }
                          }}
                          placeholder="e.g. Vegetables & Herbs"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Slug (URL parameter) *</label>
                        <input 
                          type="text" 
                          required 
                          value={categorySlug} 
                          onChange={(e) => setCategorySlug(e.target.value)}
                          placeholder="e.g. vegetables-herbs"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                      <textarea 
                        value={categoryDesc} 
                        onChange={(e) => setCategoryDesc(e.target.value)}
                        placeholder="Brief summary of what groceries go in this group..."
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                      />
                    </div>

                    <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                      <button 
                        type="button" 
                        onClick={() => setShowCategoryForm(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={actionLoading}
                        className="px-5 py-2 bg-earth-green-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1 shadow-sm cursor-pointer"
                      >
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Save Category</span>}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Categories Catalog Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="categories-table-container">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 font-bold text-slate-500 text-xs uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-6 py-4">Category Name</th>
                        <th className="px-6 py-4">URL Slug</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {categoriesList.map((cat) => (
                        <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{cat.name}</td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400">{cat.slug}</td>
                          <td className="px-6 py-4 text-xs text-slate-500 max-w-xs truncate">{cat.description || '—'}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button 
                              onClick={() => handleEditCategory(cat)}
                              className="p-1.5 text-slate-400 hover:text-earth-green-500 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                              title="Edit Category"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: CUSTOMER ORDERS */}
          {activeSubTab === 'orders' && (
            <div className="space-y-6 animate-fade-in" id="admin-orders-view">
              
              <div className="bg-white p-4 rounded-2xl border border-slate-100">
                <span className="text-sm text-slate-500 font-medium">
                  Fulfilling <strong className="text-slate-800">{ordersList.length}</strong> customer orders
                </span>
              </div>

              {/* Orders Table */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" id="orders-table-container">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="bg-slate-50 font-bold text-slate-500 text-xs uppercase tracking-wider text-left">
                      <tr>
                        <th className="px-6 py-4">Order ID</th>
                        <th className="px-6 py-4">Customer Info</th>
                        <th className="px-6 py-4 text-right">Total Price</th>
                        <th className="px-6 py-4 text-center">Fulfillment State</th>
                        <th className="px-6 py-4 text-right">Fulfill Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No customer orders recorded yet.</td>
                        </tr>
                      ) : (
                        ordersList.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-800">#DM-{ord.id}</td>
                            <td className="px-6 py-4">
                              <span className="font-bold text-slate-800 block">{ord.shippingName}</span>
                              <span className="text-xs text-slate-400 font-medium block">{ord.buyerEmail}</span>
                              <span className="text-[10px] text-slate-400 block">{new Date(ord.createdAt).toLocaleDateString()}</span>
                            </td>
                            <td className="px-6 py-4 text-right font-display font-extrabold text-slate-800">
                              £{ord.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                ord.status === 'Completed' 
                                  ? 'bg-emerald-50 text-emerald-600' 
                                  : ord.status === 'Shipped' 
                                    ? 'bg-blue-50 text-blue-600'
                                    : ord.status === 'Processing'
                                      ? 'bg-amber-50 text-amber-600'
                                      : 'bg-slate-100 text-slate-500'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right space-x-2">
                              <button
                                onClick={() => setSelectedOrder(ord)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                              >
                                View Items
                              </button>
                              
                              {/* Fulfillment state selectors */}
                              <select
                                value={ord.status}
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                                className="px-2.5 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 5: PAYMENTS CONFIGURATION */}
          {activeSubTab === 'payments' && (
            <div className="space-y-6 animate-fade-in text-xs sm:text-sm" id="admin-payments-view">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display font-extrabold text-slate-800 text-lg">
                    UK Integrated Payment Gateways
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure your seller accounts to receive shopper checkouts in Great British Pounds (GBP). All that remains is filling in your live API keys.
                  </p>
                </div>

                {paymentSuccess && (
                  <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-600 text-xs rounded-xl font-bold flex items-center space-x-2 animate-scale-up">
                    <Check className="h-4 w-4" />
                    <span>{paymentSuccess}</span>
                  </div>
                )}

                <form onSubmit={handleSavePayments} className="space-y-6">
                  {/* Stripe Configuration */}
                  <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-indigo-150 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs">
                          Stripe
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">Stripe Integration (UK & Apple Pay)</h4>
                          <p className="text-[10px] text-slate-400">Process Visa, Mastercard, and mobile wallets natively</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={stripeEnabled} 
                          onChange={(e) => setStripeEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earth-green-500"></div>
                      </label>
                    </div>

                    {stripeEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-scale-up">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Stripe Publishable Key *</label>
                          <input 
                            type="text" 
                            required 
                            value={stripePK} 
                            onChange={(e) => setStripePK(e.target.value)}
                            placeholder="pk_live_..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Stripe Secret Key *</label>
                          <input 
                            type="password" 
                            required 
                            value={stripeSK} 
                            onChange={(e) => setStripeSK(e.target.value)}
                            placeholder="sk_live_..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PayPal Configuration */}
                  <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-150 text-blue-700 rounded-xl flex items-center justify-center font-black text-xs">
                          PayPal
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">PayPal Express Checkout</h4>
                          <p className="text-[10px] text-slate-400">Offer fast 1-click customer checkouts with PayPal balance</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={paypalEnabled} 
                          onChange={(e) => setPaypalEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earth-green-500"></div>
                      </label>
                    </div>

                    {paypalEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-scale-up">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">PayPal Client ID *</label>
                          <input 
                            type="text" 
                            required 
                            value={paypalClientID} 
                            onChange={(e) => setPaypalClientID(e.target.value)}
                            placeholder="Ad_..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">PayPal Secret Key *</label>
                          <input 
                            type="password" 
                            required 
                            value={paypalSecret} 
                            onChange={(e) => setPaypalSecret(e.target.value)}
                            placeholder="EG_..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Klarna Configuration */}
                  <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-pink-150 text-pink-700 rounded-xl flex items-center justify-center font-black text-xs">
                          Klarna
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">Klarna (Buy Now Pay Later in UK)</h4>
                          <p className="text-[10px] text-slate-400">Enable credit finance, split installments, and flexible pay later terms</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={klarnaEnabled} 
                          onChange={(e) => setKlarnaEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earth-green-500"></div>
                      </label>
                    </div>

                    {klarnaEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-scale-up">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Klarna API Username *</label>
                          <input 
                            type="text" 
                            required 
                            value={klarnaUser} 
                            onChange={(e) => setKlarnaUser(e.target.value)}
                            placeholder="K123456_..."
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Klarna Shared Password *</label>
                          <input 
                            type="password" 
                            required 
                            value={klarnaPass} 
                            onChange={(e) => setKlarnaPass(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Direct BACS Bank Transfer Configuration */}
                  <div className="border border-slate-100 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-slate-200 text-slate-700 rounded-xl flex items-center justify-center font-black text-xs">
                          Bank
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800">Direct UK Bank Transfer (BACS / Faster Payments)</h4>
                          <p className="text-[10px] text-slate-400">Accept direct account-to-account payments using Sort Code and Account Number</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={bacsEnabled} 
                          onChange={(e) => setBacsEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-earth-green-500"></div>
                      </label>
                    </div>

                    {bacsEnabled && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 animate-scale-up text-xs">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Sort Code (6 Digits) *</label>
                          <input 
                            type="text" 
                            required 
                            maxLength={6}
                            value={bacsSortCode} 
                            onChange={(e) => setBacsSortCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 204512"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Account Number (8 Digits) *</label>
                          <input 
                            type="text" 
                            required 
                            maxLength={8}
                            value={bacsAccount} 
                            onChange={(e) => setBacsAccount(e.target.value.replace(/\D/g, ''))}
                            placeholder="e.g. 12345678"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Bank Name *</label>
                          <input 
                            type="text" 
                            required 
                            value={bacsBank} 
                            onChange={(e) => setBacsBank(e.target.value)}
                            placeholder="e.g. Barclays Bank"
                            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-earth-green-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 bg-earth-green-500 hover:bg-earth-green-600 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save Payment Gateways</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 6: NEWSLETTER SUBSCRIBERS */}
          {activeSubTab === 'newsletter' && (
            <div className="space-y-6 animate-fade-in" id="admin-subscribers-view">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="font-display font-extrabold text-slate-800 text-lg">
                    Newsletter Subscribers
                  </h3>
                  <p className="text-xs text-slate-500">
                    Export or view email addresses collected from customers wanting weekly specials and grocery stock arrival alerts.
                  </p>
                </div>

                {loadingSubscribers ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-earth-green-500" />
                  </div>
                ) : subscribers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8 font-medium">
                    No customers have subscribed to the newsletter updates yet.
                  </p>
                ) : (
                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="min-w-full divide-y divide-slate-100 text-xs text-left">
                      <thead className="bg-slate-50 font-bold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="px-6 py-3.5 text-left">Email Address</th>
                          <th className="px-6 py-3.5 text-right">Subscribed Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100 text-slate-600">
                        {subscribers.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{sub.email}</td>
                            <td className="px-6 py-4 text-right text-slate-400 font-medium">
                              {new Date(sub.createdAt).toLocaleDateString()} {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW ORDER ITEMS MODAL (OVERLAY) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          
          <div className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-lg w-full overflow-hidden z-10 animate-scale-up space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="font-display font-extrabold text-slate-800 text-lg">
                Order details: #DM-{selectedOrder.id}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Customer shipping info */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1.5">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Shipping Destination</h4>
              <p className="font-semibold text-slate-800">{selectedOrder.shippingName}</p>
              <p className="text-slate-500">{selectedOrder.shippingAddress}, {selectedOrder.shippingCity}</p>
              <p className="text-slate-500 uppercase font-bold">{selectedOrder.shippingPostalCode}, United Kingdom</p>
            </div>

            {/* Basket Items */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-700 text-xs">Ordered Line Items</h4>
              <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto pr-1">
                {selectedOrder.items?.map((item, index) => (
                  <div key={index} className="flex justify-between py-2 text-xs text-slate-600">
                    <div>
                      <span className="font-bold text-slate-700">{item.productName}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">{item.quantity} x £{item.price.toFixed(2)}</span>
                    </div>
                    <span className="font-bold text-slate-800">£{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 flex justify-between items-center text-sm font-extrabold text-slate-800">
              <span>Grand Total</span>
              <span className="font-display text-base text-earth-green-600">£{selectedOrder.totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-2 bg-earth-green-500 text-white font-bold rounded-xl text-xs hover:bg-earth-green-600 cursor-pointer shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
