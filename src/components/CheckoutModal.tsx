import React, { useState, useEffect } from 'react';
import { X, Loader2, CheckCircle2, ArrowLeft, CreditCard, ShieldCheck } from 'lucide-react';
import { CartItem, Order } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onOrderPlaced: (order: Order) => void;
  onClearCart: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cartItems,
  onOrderPlaced,
  onClearCart,
}) => {
  const { token, user } = useAuth();
  
  // Shipping form state
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingCountry] = useState('United Kingdom');

  // Payment form state
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCVC, setCardCVC] = useState('123');

  // Transaction states
  const [loading, setLoading] = useState(false);
  const [successOrder, setSuccessOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill shipping profile if it exists
  useEffect(() => {
    if (isOpen && user) {
      setShippingName(user.name || '');
      setShippingAddress(user.address || '');
      setShippingCity(user.city || '');
      setShippingPostalCode(user.postalCode || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingName || !shippingAddress || !shippingCity || !shippingPostalCode) {
      setError('Please fill out all required shipping details.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderPayload = {
        totalAmount: subtotal,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingCountry,
        items: cartItems.map(item => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessOrder(data.order);
        onClearCart();
        onOrderPlaced(data.order);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Checkout transaction failed.');
      }
    } catch (err) {
      console.error('Error during checkout API call:', err);
      setError('An unexpected server error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6" id="checkout-modal">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative bg-white rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full flex flex-col md:flex-row h-auto max-h-[90vh] z-10 animate-scale-up" id="checkout-modal-content">
        
        {/* SUCCESS STATE SCREEN */}
        {successOrder ? (
          <div className="w-full p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-6 bg-earth-green-50/30" id="checkout-success-container">
            <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
              <CheckCircle2 className="h-16 w-16" />
            </div>
            
            <div className="space-y-2">
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-earth-green-500">
                Order Received!
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Thank you for shopping with <strong className="text-slate-700">Deebam Afromart</strong>. Your payment was processed securely via Stripe.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-left max-w-md w-full shadow-sm space-y-4">
              <div className="flex justify-between text-xs border-b border-slate-100 pb-3">
                <span className="text-slate-400 font-medium">Order Number:</span>
                <span className="font-bold text-slate-700">#DM-{successOrder.id}</span>
              </div>
              
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Recipient Name:</span>
                  <span className="font-semibold text-slate-700">{successOrder.shippingName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shipping Address:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[200px]" title={`${successOrder.shippingAddress}, ${successOrder.shippingCity}`}>
                    {successOrder.shippingAddress}, {successOrder.shippingCity}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Postal Code:</span>
                  <span className="font-semibold text-slate-700 uppercase">{successOrder.shippingPostalCode}</span>
                </div>
              </div>

              <div className="flex justify-between text-sm font-extrabold border-t border-slate-100 pt-3 text-earth-green-500">
                <span>Total Charge:</span>
                <span className="font-display text-lg">£{successOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-xs text-slate-400">
              A delivery confirmation has been sent to <span className="font-semibold text-slate-600">{user?.email}</span>.
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 bg-earth-green-500 text-white font-bold rounded-2xl hover:bg-earth-green-600 transition-all cursor-pointer shadow-lg"
              id="checkout-success-done-btn"
            >
              Done Shopping
            </button>
          </div>
        ) : (
          <>
            {/* LEFT COLUMN: CHECKOUT FORM */}
            <div className="flex-1 p-6 sm:p-8 overflow-y-auto" id="checkout-form-column">
              <div className="flex items-center space-x-2 text-earth-green-500 mb-6">
                <button 
                  onClick={onClose} 
                  className="p-1 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
                  id="checkout-back-btn"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-bold uppercase tracking-wider">Secure Checkout</span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs rounded-xl font-medium">
                    {error}
                  </div>
                )}

                {/* Shipping Section */}
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>1. Shipping Details</span>
                    <span className="text-[10px] text-earth-green-500 font-bold bg-earth-green-50 px-2 py-0.5 rounded-full uppercase">UK ONLY</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 bg-slate-50 focus:bg-white"
                        id="shipping-name-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Delivery Address *</label>
                      <input
                        type="text"
                        required
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        placeholder="123 High Street, Flat 4B"
                        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 bg-slate-50 focus:bg-white"
                        id="shipping-address-input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Town / City *</label>
                        <input
                          type="text"
                          required
                          value={shippingCity}
                          onChange={(e) => setShippingCity(e.target.value)}
                          placeholder="London"
                          className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 bg-slate-50 focus:bg-white"
                          id="shipping-city-input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Postal Code *</label>
                        <input
                          type="text"
                          required
                          value={shippingPostalCode}
                          onChange={(e) => setShippingPostalCode(e.target.value)}
                          placeholder="SW1A 1AA"
                          className="w-full px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 bg-slate-50 focus:bg-white uppercase"
                          id="shipping-postcode-input"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secure Payment Gateway Section */}
                <div className="space-y-4">
                  <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-slate-100 pb-2 flex items-center justify-between">
                    <span>2. Stripe Payment (Mock Gateway)</span>
                    <span className="flex items-center space-x-1 text-xs text-emerald-600 font-bold">
                      <ShieldCheck className="h-4 w-4" />
                      <span>SECURE</span>
                    </span>
                  </h3>
                  
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <CreditCard className="h-4 w-4 text-slate-400" />
                        <span>Credit / Debit Card</span>
                      </span>
                      <span>Visa, Mastercard, Amex</span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Cardholder Name</label>
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value)}
                          placeholder={shippingName || "John Doe"}
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Card Number</label>
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          placeholder="4242 4242 4242 4242"
                          className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">Expiry Date</label>
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            placeholder="MM/YY"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-0.5">CVC</label>
                          <input
                            type="password"
                            required
                            maxLength={3}
                            value={cardCVC}
                            onChange={(e) => setCardCVC(e.target.value)}
                            placeholder="123"
                            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-earth-green-500 text-white font-bold rounded-2xl hover:bg-earth-green-600 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer transform hover:scale-[1.01]"
                  id="checkout-submit-btn"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Authorizing Payment via Stripe...</span>
                    </>
                  ) : (
                    <span>Pay £{subtotal.toFixed(2)} Securely</span>
                  )}
                </button>
              </form>
            </div>

            {/* RIGHT COLUMN: ORDER SUMMARY SIDEBAR */}
            <div className="w-full md:w-80 bg-slate-50 p-6 sm:p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100" id="checkout-summary-column">
              <div>
                <h3 className="font-display font-extrabold text-slate-800 text-base border-b border-slate-250 pb-2 mb-4">
                  Basket Summary
                </h3>

                <div className="divide-y divide-slate-150 max-h-[40vh] overflow-y-auto space-y-3 pb-3">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex justify-between items-start text-xs pt-3 first:pt-0">
                      <div className="max-w-[170px]">
                        <span className="font-bold text-slate-700 block leading-tight">{item.product.name}</span>
                        <span className="text-slate-400 mt-0.5 block">{item.quantity} x £{item.product.price.toFixed(2)}</span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        £{(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Delivery (UK Mainland)</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-800 border-t border-slate-150 pt-2 mt-2">
                  <span>Grand Total</span>
                  <span className="font-display text-base text-earth-green-600">£{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
