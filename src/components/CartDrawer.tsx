import React from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import { CartItem } from '../types.ts';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: number, quantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  isAuthenticated: boolean;
  onOpenAuth: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isAuthenticated,
  onOpenAuth,
}) => {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" id="cart-drawer-wrapper">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        id="cart-drawer-backdrop"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10" id="cart-drawer-panel-container">
        <div className="w-screen max-w-md bg-white flex flex-col shadow-2xl h-full animate-slide-in relative">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-earth-green-500 text-white" id="cart-drawer-header">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5 text-warm-gold-500" />
              <h2 className="font-display font-bold text-lg">Your Basket</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-earth-green-600 text-white transition-colors cursor-pointer"
              id="cart-drawer-close-btn"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4" id="cart-drawer-items-list">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4" id="cart-empty-state">
                <div className="p-4 bg-slate-50 text-slate-400 rounded-full">
                  <ShoppingBag className="h-12 w-12 stroke-[1.2]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">Your basket is empty</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">
                    Browse our high-quality African groceries and add some items!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-earth-green-500 text-white font-semibold rounded-full hover:bg-earth-green-600 transition-all text-sm cursor-pointer shadow-md"
                >
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4" id="cart-items-container">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-xs text-slate-400 font-medium">
                    {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in basket
                  </span>
                  <button
                    onClick={onClearCart}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold flex items-center space-x-1 cursor-pointer"
                    id="cart-clear-btn"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Clear Basket</span>
                  </button>
                </div>

                {cartItems.map((item) => (
                  <div 
                    key={item.product.id}
                    className="flex items-center space-x-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all"
                    id={`cart-item-row-${item.product.id}`}
                  >
                    {/* Item Image */}
                    <div className="h-16 w-16 bg-white rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-200">
                      {item.product.imageUrl ? (
                        <img 
                          src={item.product.imageUrl} 
                          alt={item.product.name} 
                          className="object-cover h-full w-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ShoppingBag className="h-6 w-6 text-slate-300" />
                      )}
                    </div>

                    {/* Item details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-slate-800 truncate leading-snug">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {item.product.weightSize || 'Single Unit'} • £{item.product.price.toFixed(2)}
                      </p>
                      
                      {/* Controls row */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-white border border-slate-200 rounded-full p-0.5" id={`cart-qty-ctrls-${item.product.id}`}>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1 text-slate-500 hover:text-earth-green-600 hover:bg-slate-50 rounded-full cursor-pointer transition-colors"
                            id={`cart-qty-minus-${item.product.id}`}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-700 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stockQuantity}
                            className="p-1 text-slate-500 hover:text-earth-green-600 hover:bg-slate-50 rounded-full cursor-pointer transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
                            id={`cart-qty-plus-${item.product.id}`}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-rose-500 p-1 rounded-full hover:bg-rose-50 transition-colors cursor-pointer"
                          id={`cart-item-delete-${item.product.id}`}
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Item subtotal */}
                    <div className="text-right flex-shrink-0">
                      <span className="font-display font-bold text-slate-800 text-sm">
                        £{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {cartItems.length > 0 && (
            <div className="border-t border-slate-100 p-6 bg-slate-50" id="cart-drawer-footer">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm">
                  <span>Delivery</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-3 text-slate-800 font-extrabold text-lg">
                  <span>Total Amount</span>
                  <span className="font-display text-earth-green-600">£{subtotal.toFixed(2)}</span>
                </div>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={onCheckout}
                  className="w-full py-3.5 bg-earth-green-500 text-white font-bold rounded-2xl hover:bg-earth-green-600 transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer transform hover:scale-[1.01]"
                  id="cart-checkout-auth-btn"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="h-5 w-5 text-warm-gold-500" />
                </button>
              ) : (
                <div className="space-y-2" id="cart-checkout-unauth-container">
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="w-full py-3.5 bg-warm-gold-500 text-earth-green-700 font-bold rounded-2xl hover:bg-warm-gold-600 transition-all flex items-center justify-center space-x-2 shadow-md cursor-pointer"
                    id="cart-checkout-signin-btn"
                  >
                    <span>Sign In to Checkout</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    An account is required to place orders in the UK.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
