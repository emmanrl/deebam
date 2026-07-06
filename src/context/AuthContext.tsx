import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut as fbSignOut, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase.ts';
import { User } from '../types.ts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  loginAdmin: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfileInContext: (profile: Partial<User>) => void;
  triggerRefresh: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => setRefreshTrigger(prev => prev + 1);

  // Sync profile details from database
  const syncUserProfile = async (authToken: string, firebaseUser?: FirebaseUser) => {
    try {
      const res = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      if (res.ok) {
        const profile = await res.json();
        setUser(profile);
      } else if (firebaseUser) {
        // Fallback to Firebase user info if profile fetch failed
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          role: 'buyer',
          name: firebaseUser.displayName || '',
          isEmailVerified: firebaseUser.emailVerified
        });
      }
    } catch (err) {
      console.error('Error syncing user profile from DB:', err);
    }
  };

  // Listen to Firebase auth state changes for Buyer login
  useEffect(() => {
    // Check if there is an Admin session saved in sessionStorage
    const savedAdminToken = sessionStorage.getItem('deebam_admin_token');
    if (savedAdminToken) {
      setToken(savedAdminToken);
      setUser({
        uid: 'admin',
        email: 'admin@deebamafromartltd.co.uk',
        role: 'admin',
        name: 'Deebam Admin',
        isEmailVerified: true
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          await syncUserProfile(idToken, firebaseUser);
        } catch (err) {
          console.error('Error getting user token:', err);
          setError('Failed to authenticate with server');
        }
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [refreshTrigger]);

  // Admin login helper
  const loginAdmin = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.token);
        setUser(data.user);
        sessionStorage.setItem('deebam_admin_token', data.token);
        setLoading(false);
        return true;
      } else {
        const errData = await res.json();
        setError(errData.error || 'Invalid credentials');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Server error during admin login');
      setLoading(false);
      return false;
    }
  };

  // Sign out helper
  const logout = async () => {
    setLoading(true);
    try {
      sessionStorage.removeItem('deebam_admin_token');
      await fbSignOut(auth);
      setUser(null);
      setToken(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Direct manual profile update helper
  const updateProfileInContext = (profile: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...profile } as User : null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      loginAdmin,
      logout,
      updateProfileInContext,
      triggerRefresh
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
