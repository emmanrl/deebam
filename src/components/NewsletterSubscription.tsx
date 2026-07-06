import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const NewsletterSubscription: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.message });
        setEmail('');
      } else {
        setStatus({ type: 'error', message: data.error || 'Something went wrong. Please try again.' });
      }
    } catch (err) {
      console.error('Newsletter subscribe error:', err);
      setStatus({ type: 'error', message: 'Failed to connect to subscription server. Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 p-6 sm:p-8 rounded-3xl border border-slate-700/50 space-y-4 max-w-md w-full" id="newsletter-subscription-box">
      <div className="space-y-1.5">
        <h4 className="font-display font-extrabold text-white text-sm tracking-wide uppercase">
          Weekly Specials & Arrivals
        </h4>
        <p className="text-slate-400 text-xs leading-relaxed">
          Be the first to hear when premium yams, fresh vegetables, and weekly spices arrive at our UK warehouses.
        </p>
      </div>

      <form onSubmit={handleSubscribe} className="space-y-3" id="newsletter-form">
        <div className="relative">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-warm-gold-500 placeholder-slate-500"
          />
          <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-warm-gold-500 hover:bg-warm-gold-600 text-slate-900 font-extrabold text-xs py-3 px-4 rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span>Subscribe to Updates</span>
            </>
          )}
        </button>
      </form>

      {status && (
        <div
          className={`p-3.5 rounded-2xl flex items-start space-x-2.5 text-xs font-semibold animate-scale-up ${
            status.type === 'success'
              ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400'
              : 'bg-rose-950/40 border border-rose-800/40 text-rose-400'
          }`}
          id="newsletter-status"
        >
          {status.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
};
