import React from 'react';
import { ShoppingBag, Search, User, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  openCart: () => void;
  openAuth: () => void;
  cartCount: number;
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  openCart,
  openAuth,
  cartCount,
  activeView,
  setActiveView,
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-earth-green-500 text-white shadow-md" id="app-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Brand Area */}
          <div 
            className="flex items-center space-x-2 cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => setActiveView('storefront')}
            id="brand-logo-container"
          >
            <div className="bg-warm-gold-500 text-earth-green-600 p-2 rounded-xl flex items-center justify-center font-bold shadow-md">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <span className="font-display text-2xl font-extrabold tracking-tight text-white block leading-none">
                DEEBAM
              </span>
              <span className="font-display text-xs font-bold tracking-widest text-warm-gold-500 uppercase block leading-none mt-1">
                Afromart
              </span>
            </div>
          </div>

          {/* Global Search Bar (Only shown for storefront view) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8" id="header-search-container">
            {activeView === 'storefront' && (
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-earth-green-200" />
                </div>
                <input
                  type="text"
                  placeholder="Search over 100+ authentic African groceries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2 border border-earth-green-600 rounded-full bg-earth-green-600 text-white placeholder-earth-green-200 focus:outline-none focus:ring-2 focus:ring-warm-gold-500 focus:bg-earth-green-700 transition-all duration-300 text-sm"
                  id="header-search-input"
                />
              </div>
            )}
          </div>

          {/* Navigation Control Area */}
          <div className="flex items-center space-x-4 sm:space-x-6" id="header-controls">
            
            {/* View selectors */}
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveView(activeView === 'admin' ? 'storefront' : 'admin')}
                className="flex items-center space-x-1.5 px-4 py-2 bg-warm-gold-500 text-earth-green-700 hover:bg-warm-gold-600 font-bold rounded-full transition-all duration-300 shadow-md text-sm cursor-pointer"
                id="admin-dashboard-btn"
              >
                <ShieldAlert className="h-4 w-4" />
                <span>{activeView === 'admin' ? 'View Store' : 'Seller Admin'}</span>
              </button>
            )}

            {activeView !== 'admin' && user?.role === 'buyer' && (
              <button
                onClick={() => setActiveView('my-orders')}
                className={`font-medium text-sm transition-colors cursor-pointer hover:text-warm-gold-500 ${
                  activeView === 'my-orders' ? 'text-warm-gold-500 border-b-2 border-warm-gold-500 pb-1' : 'text-earth-green-100'
                }`}
                id="buyer-orders-btn"
              >
                My Orders
              </button>
            )}

            {/* Authenticated user status / sign in */}
            {user ? (
              <div className="flex items-center space-x-3" id="user-info-badge">
                <span className="hidden lg:inline-block text-xs font-medium text-earth-green-100">
                  Hi, <strong className="text-white font-semibold">{user.name || user.email.split('@')[0]}</strong>
                </span>
                <button
                  onClick={logout}
                  className="p-2 text-earth-green-100 hover:text-white rounded-full hover:bg-earth-green-600 transition-colors duration-200 cursor-pointer"
                  title="Logout"
                  id="logout-btn"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full hover:bg-earth-green-600 text-earth-green-100 hover:text-white transition-colors duration-200 text-sm font-semibold cursor-pointer"
                id="header-signin-btn"
              >
                <User className="h-5 w-5" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Shopping Cart Button */}
            {activeView !== 'admin' && (
              <button
                onClick={openCart}
                className="relative p-2.5 bg-earth-green-600 text-white hover:bg-earth-green-700 rounded-full transition-colors duration-300 shadow-sm cursor-pointer"
                id="header-cart-toggle-btn"
              >
                <ShoppingBag className="h-6 w-6 text-warm-gold-500" />
                {cartCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta-500 text-[10px] font-bold text-white ring-2 ring-earth-green-500 animate-pulse"
                    id="cart-badge-count"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            )}

          </div>
        </div>
        
        {/* Mobile Search Bar Row */}
        {activeView === 'storefront' && (
          <div className="pb-4 md:hidden" id="header-search-mobile-container">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-earth-green-200" />
              </div>
              <input
                type="text"
                placeholder="Search African groceries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2 border border-earth-green-600 rounded-full bg-earth-green-600 text-white placeholder-earth-green-200 focus:outline-none focus:ring-2 focus:ring-warm-gold-500 text-sm"
                id="header-search-mobile-input"
              />
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
