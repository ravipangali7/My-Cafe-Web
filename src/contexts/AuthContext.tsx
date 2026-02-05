import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api, isWebView } from '@/lib/api';
import { getFCMTokenOnly } from '@/lib/fcm';
import { requestFCMTokenFromFlutterForLogout } from '@/lib/webview-fcm';

interface User {
  id: number;
  name: string;
  phone: string;
  country_code: string;
  logo_url: string | null;
  expire_date: string | null;
  is_active: boolean;
  is_superuser: boolean;
  due_balance: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (phone: string, password: string, countryCode?: string) => Promise<{ error: Error | null }>;
  signUp: (name: string, phone: string, password: string, countryCode?: string, email?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await api.get<{ user: User }>('/api/auth/user/');
      
      if (response.data) {
        // Successfully authenticated
        setUser(response.data.user);
      } else if (response.error) {
        // Check if it's a 401 (actual auth failure) vs other errors
        if (response.status === 401) {
          // User is not authenticated - clear user state
          setUser(null);
        } else {
          // Network error or other non-auth error
          // Log the error but don't clear user state immediately
          // This allows the session to persist even if there's a temporary network issue
          console.warn('Auth check failed (non-401):', response.error);
          setUser(null); // Still clear on first load, but this is a non-auth error
        }
      } else {
        // No data and no error - unexpected, clear user
        setUser(null);
      }
    } catch (error) {
      // Network error or fetch failure
      // This should rarely happen since api.get handles errors internally
      console.warn('Auth check exception:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const signIn = useCallback(async (phone: string, password: string, countryCode: string = '91') => {
    try {
      const response = await api.post<{ user: User; message: string }>('/api/auth/login/', {
        phone,
        password,
        country_code: countryCode,
      });

      if (response.error) {
        return { error: new Error(response.error) };
      }

      if (response.data) {
        setUser(response.data.user);
        return { error: null };
      }

      return { error: new Error('Login failed') };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Login failed') };
    }
  }, []);

  const signUp = useCallback(async (name: string, phone: string, password: string, countryCode: string = '91', email?: string) => {
    try {
      const response = await api.post<{ user: User; message: string }>('/api/auth/register/', {
        name,
        phone,
        password,
        country_code: countryCode,
        email: email || '',
      });

      if (response.error) {
        return { error: new Error(response.error) };
      }

      if (response.data) {
        setUser(response.data.user);
        return { error: null };
      }

      return { error: new Error('Registration failed') };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Registration failed') };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      let fcmToken: string | null = null;
      if (isWebView()) {
        fcmToken = await requestFCMTokenFromFlutterForLogout();
      } else {
        try {
          fcmToken = await getFCMTokenOnly();
        } catch {
          // Ignore; logout still proceeds without removing a token
        }
      }
      const response = await api.post<{ message: string }>(
        '/api/auth/logout/',
        fcmToken ? { fcm_token: fcmToken } : {}
      );
      if (response.error || (response.status !== undefined && response.status >= 400)) {
        console.error('Logout error:', response.error ?? response.status);
        return;
      }
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {
        // Ignore storage clear failures
      }
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Do not clear state on failure; user remains logged in
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
