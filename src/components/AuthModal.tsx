import React, { useState } from 'react';
import { X, Shield, Mail, Lock, User, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'buyer-login' | 'buyer-signup' | 'admin';
}

type AuthTab = 'buyer-login' | 'buyer-signup' | 'admin';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'buyer-login' }) => {
  const { loginAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!isOpen) return null;

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleAuthProvider);
      onClose();
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-closed-by-user' || err.message?.includes('closed by user')) {
        setError('Google Sign-In popup was closed or blocked. Because the app is running in an iframe preview, please open the app in a new tab to complete Sign-In securely.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('A previous Google Sign-In request was cancelled or is still pending in another window.');
      } else {
        setError(err.message || 'Google Authentication failed. Try opening the app in a new tab.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuyerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const targetEmail = email.trim().toLowerCase();
      const isAdminEmail = targetEmail === 'admin@deebamafromartltd.co.uk' || targetEmail === 'admin@deebamafromart.co.uk';
      
      if (isAdminEmail) {
        const success = await loginAdmin(targetEmail, password);
        if (success) {
          onClose();
        } else {
          setError('Invalid admin credentials.');
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      }
    } catch (err: any) {
      console.error('Email login error:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBuyerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      
      // Call backend API to send beautiful welcome email via Resend
      try {
        await fetch('/api/auth/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, displayName })
        });
      } catch (emailErr) {
        console.error('Non-blocking welcome email dispatch error:', emailErr);
      }

      // Trigger Email Verification as requested
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setVerificationSent(true);
      }
    } catch (err: any) {
      console.error('Email sign up error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email address is already registered.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(err.message || 'Registration failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="auth-modal-overlay">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden z-10 animate-scale-up" id="auth-modal-card">
        
        {/* Header decoration */}
        <div className="bg-earth-green-500 p-6 text-white text-center relative" id="auth-modal-header">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-earth-green-600 transition-colors text-white cursor-pointer"
            id="auth-modal-close-btn"
          >
            <X className="h-5 w-5" />
          </button>
          
          <span className="font-display text-xs font-bold tracking-widest text-warm-gold-500 uppercase">
            Deebam Afromart
          </span>
          <h3 className="font-display font-bold text-xl mt-1 text-white">
            Welcome to Deebam
          </h3>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500" id="auth-tabs">
          <button
            onClick={() => { setActiveTab('buyer-login'); setError(null); setVerificationSent(false); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'buyer-login' ? 'bg-white text-earth-green-600 border-b-2 border-earth-green-500' : 'hover:bg-slate-100'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('buyer-signup'); setError(null); setVerificationSent(false); }}
            className={`flex-1 py-3 text-center transition-colors cursor-pointer ${
              activeTab === 'buyer-signup' ? 'bg-white text-earth-green-600 border-b-2 border-earth-green-500' : 'hover:bg-slate-100'
            }`}
          >
            Register
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 sm:p-8" id="auth-modal-body">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl font-medium mb-4 space-y-2">
              <p>{error}</p>
              {isIframe && (error.includes('Google') || error.includes('popup') || error.includes('Sign-In')) && (
                <div className="pt-1">
                  <a
                    href={window.location.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 bg-white text-rose-700 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl font-bold transition-all text-[10px] uppercase tracking-wider shadow-sm cursor-pointer"
                  >
                    <span>Open App in New Tab ↗</span>
                  </a>
                </div>
              )}
            </div>
          )}

          {/* VERIFICATION SENT SUCCESS SCREEN (BUYER SIGNUP) */}
          {verificationSent ? (
            <div className="text-center space-y-4 py-4" id="auth-verification-sent">
              <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                <Mail className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-800 text-base">Verify your email</h4>
                <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                  A verification link has been sent to <strong className="text-slate-700">{email}</strong>. Please check your inbox and verify your account to proceed.
                </p>
              </div>
              <button
                onClick={() => {
                  setVerificationSent(false);
                  setActiveTab('buyer-login');
                }}
                className="w-full py-2.5 bg-earth-green-500 text-white font-bold rounded-xl hover:bg-earth-green-600 transition-all text-sm cursor-pointer shadow-sm"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* BUYER LOGIN FORM */}
              {activeTab === 'buyer-login' && (
                <form onSubmit={handleBuyerLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@deebamafromartltd.co.uk"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 text-sm bg-slate-50 focus:bg-white"
                      />
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 text-sm bg-slate-50 focus:bg-white"
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-earth-green-500 hover:bg-earth-green-600 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 text-sm shadow-md cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In</span>}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-sm"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </form>
              )}

              {/* BUYER REGISTRATION FORM */}
              {activeTab === 'buyer-signup' && (
                <form onSubmit={handleBuyerSignUp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 text-sm bg-slate-50 focus:bg-white"
                      />
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Email Address *</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="buyer@example.com"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 text-sm bg-slate-50 focus:bg-white"
                      />
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Password *</label>
                    <div className="relative">
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-earth-green-500 text-sm bg-slate-50 focus:bg-white"
                      />
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-earth-green-500 hover:bg-earth-green-600 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2 text-sm shadow-md cursor-pointer"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Create Account</span>}
                  </button>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-bold uppercase tracking-wider">or</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer shadow-sm"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" width="24" height="24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                    </svg>
                    <span>Sign up with Google</span>
                  </button>

                  <p className="text-[10px] text-center text-slate-400 leading-tight">
                    By clicking "Create Account", we will trigger an email containing your verification link. Verify to enable purchases.
                  </p>
                </form>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
