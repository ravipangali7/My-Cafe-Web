import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface Vendor {
  id: number;
  name: string;
  phone: string;
  logo_url: string | null;
  expire_date: string | null;
  is_active: boolean;
  is_online?: boolean;
  created_at: string;
  updated_at: string;
}

interface VendorContextType {
  vendor: Vendor | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const VendorContext = createContext<VendorContextType | undefined>(undefined);

export function VendorProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchVendor = useCallback(async () => {
    if (!user) {
      setVendor(null);
      setLoading(false);
      return;
    }

    try {
      // In Django, the user IS the vendor, so we use the user data
      const response = await api.get<{ user: Vendor }>('/api/auth/user/');
      if (response.data) {
        setVendor(response.data.user);
      } else {
        setVendor(null);
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchVendor();
  }, [fetchVendor]);

  return (
    <VendorContext.Provider value={{ vendor, loading, refetch: fetchVendor }}>
      {children}
    </VendorContext.Provider>
  );
}

export function useVendor() {
  const context = useContext(VendorContext);
  if (context === undefined) {
    throw new Error('useVendor must be used within a VendorProvider');
  }
  return context;
}
