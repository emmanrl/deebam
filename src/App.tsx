import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { CartDrawer } from './components/CartDrawer.tsx';
import { CheckoutModal } from './components/CheckoutModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Product, Category, CartItem, Order } from './types.ts';
import { ProductReviewsModal } from './components/ProductReviewsModal.tsx';
import { NewsletterSubscription } from './components/NewsletterSubscription.tsx';
import { HeroCarousel } from './components/HeroCarousel.tsx';
import { ScrollReveal } from './components/ScrollReveal.tsx';
import { 
  ShoppingBag, SlidersHorizontal, ArrowRight, ShieldCheck, 
  MapPin, CheckCircle2, Package, Loader2, ArrowLeft, Star, ChevronUp
} from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, token } = useAuth();

  // Navigation states
  const [activeView, setActiveView] = useState<string>('storefront');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Popups/drawers states
  const [cartOpen, setCartOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'buyer-login' | 'buyer-signup' | 'admin'>('buyer-login');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Reviews and back-to-top states
  const [reviewsSummary, setReviewsSummary] = useState<Record<number, { avgRating: number; count: number }>>({});
  const [selectedReviewProduct, setSelectedReviewProduct] = useState<Product | null>(null);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Loading states
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cart state with localStorage integration
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('deebam_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist cart
  useEffect(() => {
    localStorage.setItem('deebam_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          setCategories(data);
        }
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Products based on search and category filters
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchTerm) queryParams.append('search', searchTerm);
        if (activeCategory && activeCategory !== 'all') {
          queryParams.append('category', activeCategory);
        }

        const res = await fetch(`/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error('Error loading products:', err);
      } finally {
        setLoadingProducts(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeCategory]);

  // Load Buyer Orders when view transitions
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!token || activeView !== 'my-orders') return;
      setLoadingOrders(true);
      try {
        const res = await fetch('/api/orders/my', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setUserOrders(data);
        }
      } catch (err) {
        console.error('Error fetching user orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchUserOrders();
  }, [activeView, token]);

  // Fetch reviews summary on mount
  const fetchReviewsSummary = async () => {
    try {
      const res = await fetch('/api/reviews/summary');
      if (res.ok) {
        const data = await res.json();
        const summaryMap: Record<number, { avgRating: number; count: number }> = {};
        data.forEach((item: { productId: number; avgRating: number | string; count: number | string }) => {
          summaryMap[item.productId] = {
            avgRating: typeof item.avgRating === 'string' ? parseFloat(item.avgRating) : item.avgRating,
            count: typeof item.count === 'string' ? parseInt(item.count) : item.count,
          };
        });
        setReviewsSummary(summaryMap);
      }
    } catch (err) {
      console.error('Error fetching reviews summary:', err);
    }
  };

  useEffect(() => {
    fetchReviewsSummary();
  }, []);

  // Back to top scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync state if user logs in/out
  useEffect(() => {
    if (user?.role === 'admin') {
      setActiveView('admin');
    } else {
      if (activeView === 'admin') {
        setActiveView('storefront');
      }
    }
  }, [user]);

  // Cart operations helpers
  const handleAddToCart = (product: Product, quantity: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: Math.min(product.stockQuantity, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCartItems(prev => 
      prev.map(item => 
        item.product.id === productId 
          ? { ...item, quantity: Math.min(item.product.stockQuantity, quantity) }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('storefront-content');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-clay-bg flex flex-col justify-between" id="app-content-root">
      
      {/* GLOBAL HEAD NAVIGATION */}
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        openCart={() => setCartOpen(true)}
        openAuth={() => {
          setAuthTab('buyer-login');
          setAuthOpen(true);
        }}
        cartCount={totalCartCount}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      {/* VIEW PANEL ROUTING CONTROL */}
      <main className="flex-grow">
        
        {/* VIEW 1: SELLER ADMIN HUB */}
        {activeView === 'admin' && user?.role === 'admin' ? (
          <AdminPanel />
        ) : activeView === 'my-orders' ? (
          
          /* VIEW 2: BUYER ORDERS LOGS */
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in" id="buyer-orders-view">
            <div className="flex items-center space-x-3 mb-8">
              <button 
                onClick={() => setActiveView('storefront')} 
                className="p-2 bg-white rounded-full text-slate-500 hover:text-earth-green-500 border border-slate-100 shadow-sm cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 leading-none">
                  Your Orders
                </h1>
                <p className="text-xs text-slate-400 mt-2 font-medium">Track shipping fulfillment and histories.</p>
              </div>
            </div>

            {loadingOrders ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3" id="orders-loading">
                <Loader2 className="h-8 w-8 animate-spin text-earth-green-500" />
                <span className="text-xs text-slate-400 font-bold">Retrieving deliveries...</span>
              </div>
            ) : userOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center space-y-4" id="orders-empty-state">
                <div className="p-3 bg-slate-50 text-slate-400 inline-block rounded-full">
                  <Package className="h-10 w-10 stroke-[1.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">No orders logged</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    You have not submitted any grocery orders under this account. Place your first order today!
                  </p>
                </div>
                <button
                  onClick={() => setActiveView('storefront')}
                  className="px-6 py-2.5 bg-earth-green-500 text-white font-semibold rounded-xl hover:bg-earth-green-600 transition-all text-sm cursor-pointer shadow-sm"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-6" id="orders-grid">
                {userOrders.map((order) => (
                  <div 
                    key={order.id}
                    className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
                    id={`order-card-${order.id}`}
                  >
                    {/* Header bar */}
                    <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                      <div className="text-xs text-slate-500 font-medium space-y-0.5">
                        <span className="block">Ordered: <strong>{new Date(order.createdAt).toLocaleDateString()}</strong></span>
                        <span className="block">ID Reference: <strong className="text-slate-800 uppercase">#DM-{order.id}</strong></span>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold block">Total Amount</span>
                          <span className="font-display font-extrabold text-slate-800 text-sm">£{order.totalAmount.toFixed(2)}</span>
                        </div>
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          order.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-600'
                            : order.status === 'Shipped'
                              ? 'bg-blue-100 text-blue-600'
                              : order.status === 'Processing'
                                ? 'bg-amber-100 text-amber-600'
                                : 'bg-slate-200 text-slate-600'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Products list snapshot */}
                      <div className="md:col-span-2 space-y-3">
                        <h4 className="font-bold text-slate-700 text-xs">Ordered Items</h4>
                        <div className="divide-y divide-slate-50 max-h-36 overflow-y-auto">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs py-2 first:pt-0">
                              <span className="text-slate-600 font-medium">
                                {item.productName} <strong className="text-slate-400 ml-1">x{item.quantity}</strong>
                              </span>
                              <span className="font-bold text-slate-800">£{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Snapshot */}
                      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2">
                        <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Delivery Information</h4>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800">{order.shippingName}</p>
                          <p className="text-slate-500">{order.shippingAddress}</p>
                          <p className="text-slate-500">{order.shippingCity}</p>
                          <p className="text-slate-500 font-bold uppercase">{order.shippingPostalCode}</p>
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : (
          
          /* VIEW 3: STANDARD STOREFRONT GALLERY */
          <div className="space-y-10 pb-16 animate-fade-in" id="storefront-view">
            
            {/* HERO DYNAMIC CAROUSEL BANNER */}
            <ScrollReveal direction="none" delay={0.05} className="w-full">
              <HeroCarousel onExplore={scrollToCatalog} />
            </ScrollReveal>

            {/* STORE CONTENT CONTAINER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-4 gap-8" id="storefront-content">
              
              {/* SIDEBAR FILTER NAVIGATION (DESKTOP) */}
              <aside className="hidden lg:block space-y-6" id="desktop-filters">
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-800 text-base flex items-center space-x-2 pb-2 border-b border-slate-50">
                    <SlidersHorizontal className="h-4 w-4 text-earth-green-500" />
                    <span>Store Categories</span>
                  </h3>
                  
                  {loadingCategories ? (
                    <div className="space-y-2 py-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-8 bg-slate-50 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <nav className="flex flex-col gap-1">
                      <button
                        onClick={() => setActiveCategory('all')}
                        className={`text-left px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                          activeCategory === 'all'
                            ? 'bg-earth-green-500 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        All Groceries
                      </button>
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setActiveCategory(cat.slug)}
                          className={`text-left px-4 py-2 text-xs font-bold rounded-xl transition-all truncate cursor-pointer ${
                            activeCategory === cat.slug
                              ? 'bg-earth-green-500 text-white shadow-sm'
                              : 'text-slate-600 hover:bg-slate-50'
                          }`}
                          title={cat.name}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </nav>
                  )}
                </div>
              </aside>

              {/* HORIZONTAL SCROLL CATEGORIES (MOBILE ONLY) */}
              <div className="lg:hidden col-span-1" id="mobile-categories-slider">
                <div className="flex items-center space-x-2 px-1 mb-3">
                  <SlidersHorizontal className="h-4 w-4 text-earth-green-500" />
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Filter</span>
                </div>
                
                <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-none px-1">
                  <button
                    onClick={() => setActiveCategory('all')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer ${
                      activeCategory === 'all'
                        ? 'bg-earth-green-500 text-white'
                        : 'bg-white text-slate-600 border border-slate-100'
                    }`}
                  >
                    All Groceries
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.slug)}
                      className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer ${
                        activeCategory === cat.slug
                          ? 'bg-earth-green-500 text-white'
                          : 'bg-white text-slate-600 border border-slate-100'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRODUCTS CATALOG GRID */}
              <div className="lg:col-span-3 space-y-6" id="products-catalog-grid">
                
                {/* Search result indicator */}
                {searchTerm && (
                  <div className="text-sm text-slate-500 font-medium">
                    Showing results for: <strong className="text-slate-800">"{searchTerm}"</strong>
                  </div>
                )}

                {loadingProducts ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="products-loading-grid">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="bg-white rounded-3xl p-5 border border-slate-100 space-y-4 h-[350px] animate-pulse">
                        <div className="aspect-square bg-slate-50 rounded-2xl w-full" />
                        <div className="h-4 bg-slate-50 rounded-lg w-1/3" />
                        <div className="h-6 bg-slate-50 rounded-lg w-3/4" />
                        <div className="h-8 bg-slate-50 rounded-lg w-1/4 mt-4" />
                      </div>
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 text-slate-400 space-y-4 shadow-sm" id="products-empty-state">
                    <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto stroke-[1.2]" />
                    <div>
                      <h4 className="font-bold text-slate-700">No groceries match</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                        We couldn't find any products matching your selection. Try checking another category or refining your search term!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="products-active-grid">
                    {products.map((prod, idx) => (
                      <ScrollReveal key={prod.id} direction="up" delay={Math.min(0.25, idx * 0.04)}>
                        <ProductCard
                          product={prod}
                          onAddToCart={handleAddToCart}
                          ratingSummary={reviewsSummary[prod.id]}
                          onOpenReviews={(product) => {
                            setSelectedReviewProduct(product);
                            setIsReviewsOpen(true);
                          }}
                        />
                      </ScrollReveal>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER AREA */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-12 text-xs" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-display font-extrabold text-white text-sm tracking-wider uppercase mb-3">Deebam Afromart</h4>
            <p className="leading-relaxed max-w-xs">
              Premium West African groceries and authentic foods supplied direct to your doorstep across the United Kingdom. Fast shipping, secure payments.
            </p>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-white text-sm tracking-wider uppercase mb-3">Customer Support</h4>
            <ul className="space-y-2">
              <li><span className="hover:text-white cursor-pointer transition-colors">Delivery Rates & Shipping Times</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Returns & Refunds Policy</span></li>
              <li><span className="hover:text-white cursor-pointer transition-colors">Frequently Asked Questions</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-white text-sm tracking-wider uppercase mb-3">Compliance & Trust</h4>
            <ul className="space-y-2">
              <li className="flex items-center space-x-1">
                <ShieldCheck className="h-4 w-4 text-warm-gold-500" />
                <span>Secure SSL Card Processing</span>
              </li>
              <li className="text-slate-500">
                Mock payment processing powered by Stripe Sandbox. No actual charges are made.
              </li>
            </ul>
          </div>
          <div className="flex justify-start lg:justify-end">
            <NewsletterSubscription />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 pt-6 text-center text-slate-500">
          <p>© 2026 Deebam Afromart. All rights reserved. Crafted for premium UK grocery distribution.</p>
        </div>
      </footer>

      {/* ACTIVE SIDEPANELS / OVERLAYS */}
      
      {/* 1. Basket Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
        isAuthenticated={!!user}
        onOpenAuth={() => {
          setAuthTab('buyer-login');
          setAuthOpen(true);
        }}
      />

      {/* 2. Google and Credentials Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authTab}
      />

      {/* 3. Shipping Checkout Dialog */}
      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartItems={cartItems}
        onClearCart={handleClearCart}
        onOrderPlaced={() => {
          // Trigger catalog refresh to sync stock quantities
          setSearchTerm('');
        }}
      />

      {/* 4. Product Reviews Dialog */}
      <ProductReviewsModal
        isOpen={isReviewsOpen}
        onClose={() => {
          setIsReviewsOpen(false);
          setSelectedReviewProduct(null);
        }}
        product={selectedReviewProduct}
        onReviewSubmitted={fetchReviewsSummary}
      />

      {/* 5. Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-earth-green-500 text-white p-3.5 rounded-full hover:bg-earth-green-600 shadow-xl transition-all hover:-translate-y-1 hover:scale-105 active:scale-95 animate-scale-up border border-white/10 cursor-pointer"
          title="Back to Top"
          id="back-to-top-btn"
        >
          <ChevronUp className="h-5 w-5 stroke-[2.5]" />
        </button>
      )}

    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
