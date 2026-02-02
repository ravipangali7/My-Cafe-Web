import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useVendor } from '@/contexts/VendorContext';
import { getAndSaveFCMToken } from '@/lib/fcm';
import { getFirebaseMessaging } from '@/lib/firebase-config';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { VendorDashboard } from '@/components/dashboard/vendor';
import { SystemDashboard } from '@/components/dashboard/system';
import {
  VendorDashboardData,
  SystemDashboardData,
  RevenueTrendPoint,
  ProductInsight,
} from '@/lib/types';

// API response interfaces (for transforming legacy API data)
interface LegacyVendorDashboardData {
  subscription: {
    type: string | null;
    start_date: string | null;
    end_date: string | null;
    amount_paid: string;
    status: string;
  };
  transactions: Array<any>;
  pending_orders_count: number;
  pending_qr_orders_count: number;
  payment_status_breakdown: {
    paid: number;
    pending: number;
    failed: number;
  };
  subscription_history: Array<{
    date: string;
    event: string;
    amount?: string;
    status?: string;
  }>;
  total_orders?: number;
  total_sales?: string;
  total_revenue?: string;
  total_products?: number;
  total_qr_stand_orders?: number;
  finance_summary?: {
    today: string;
    week: string;
    month: string;
  };
  best_selling_products?: Array<{
    product_id: number;
    product_name: string;
    product_image: string | null;
    total_quantity: number;
    total_revenue: string;
  }>;
  top_revenue_products?: Array<{
    product_id: number;
    product_name: string;
    product_image: string | null;
    total_quantity: number;
    total_revenue: string;
  }>;
  order_trends?: {
    daily: Array<{
      date: string;
      orders: number;
      revenue: string;
    }>;
    weekly?: Array<{
      date: string;
      orders: number;
      revenue: string;
    }>;
    monthly: Array<{
      date: string;
      orders: number;
      revenue: string;
    }>;
  };
  recent_orders?: Array<any>;
  pending_orders?: Array<any>;
  pending_qr_orders?: Array<any>;
  repeat_customers?: Array<any>;
}

interface LegacySuperAdminDashboardData {
  users: {
    total: number;
    active: number;
    deactivated: number;
  };
  revenue: {
    total: string;
    trends: Array<{
      date: string;
      revenue: string;
    }>;
  };
  pending_qr_orders: Array<any>;
  pending_kyc_count: number;
  pending_kyc_requests?: Array<any>;
  transactions: Array<any>;
  total_transactions?: number;
  qr_earnings?: string;
  subscription_earnings?: string;
  transaction_earnings?: string;
  whatsapp_earnings?: string;
  pending_qr_orders_count?: number;
  transactions_trend?: Array<{
    date: string;
    count: number;
  }>;
  users_overview?: Array<{
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
    is_superuser: boolean;
    total_orders: number;
    total_revenue: string;
    kyc_status: string;
  }>;
  // New fields
  system_balance?: number;
  total_vendors?: number;
  active_vendors?: number;
  inactive_vendors?: number;
  pending_kyc_vendors?: number;
  expired_vendors?: number;
  due_blocked_vendors?: number;
  total_shareholders?: number;
  total_shareholder_balance?: number;
  total_distributed_balance?: number;
  total_shareholder_withdrawals?: number;
  pending_shareholder_withdrawals_count?: number;
  pending_withdrawals?: Array<any>;
  total_due_amount?: number;
  total_system_revenue?: number;
  shareholder_distribution?: Array<any>;
  revenue_breakdown?: any;
  financial_trends?: Array<any>;
  top_revenue_vendors?: Array<any>;
}

export default function Dashboard() {
  const { vendor } = useVendor();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Vendor dashboard data
  const [vendorData, setVendorData] = useState<VendorDashboardData | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);
  
  // Super admin dashboard data
  const [superAdminData, setSuperAdminData] = useState<SystemDashboardData | null>(null);
  const [superAdminLoading, setSuperAdminLoading] = useState(true);

  // Redirect to QR page when opened from external browser (e.g. ?openQr=1 from Flutter WebView)
  useEffect(() => {
    if (searchParams.get('openQr') === '1' && vendor?.phone) {
      navigate(`/qr/${vendor.phone}`);
    }
  }, [searchParams, vendor?.phone, navigate]);

  // Transform legacy vendor data to new format
  const transformVendorData = useCallback((data: LegacyVendorDashboardData): VendorDashboardData => {
    // Transform order trends
    const transformTrends = (trends: Array<{ date: string; orders: number; revenue: string }> = []): RevenueTrendPoint[] => {
      return trends.map(t => ({
        date: t.date,
        revenue: parseFloat(t.revenue || '0'),
        orders: t.orders,
      }));
    };

    // Transform products
    const transformProducts = (products: Array<{ product_id: number; product_name: string; product_image: string | null; total_quantity: number; total_revenue: string }> = []): ProductInsight[] => {
      return products.map(p => ({
        product_id: p.product_id,
        product_name: p.product_name,
        product_image: p.product_image,
        total_quantity: p.total_quantity,
        total_revenue: parseFloat(p.total_revenue || '0'),
      }));
    };

    // Determine subscription status
    const getSubscriptionStatus = (): 'active' | 'expired' | 'none' => {
      if (!data.subscription) return 'none';
      if (data.subscription.status === 'active') return 'active';
      if (data.subscription.status === 'expired') return 'expired';
      return 'none';
    };

    return {
      due_balance: user?.due_balance || 0,
      subscription_status: getSubscriptionStatus(),
      subscription_end_date: data.subscription?.end_date || null,
      total_orders: data.total_orders || 0,
      total_sales: parseFloat(data.total_sales || data.total_revenue || '0'),
      total_products: data.total_products || 0,
      total_qr_stand_orders: data.total_qr_stand_orders || 0,
      pending_orders: data.pending_orders || [],
      pending_orders_count: data.pending_orders_count || 0,
      pending_qr_orders: data.pending_qr_orders || [],
      pending_qr_orders_count: data.pending_qr_orders_count || 0,
      revenue_trends: {
        daily: transformTrends(data.order_trends?.daily),
        weekly: transformTrends(data.order_trends?.weekly || data.order_trends?.daily),
        monthly: transformTrends(data.order_trends?.monthly),
      },
      top_selling_products: transformProducts(data.best_selling_products),
      top_revenue_products: transformProducts(data.top_revenue_products || data.best_selling_products),
      repeat_customers: data.repeat_customers || [],
      transactions: data.transactions || [],
      // Legacy fields
      subscription: data.subscription,
      payment_status_breakdown: data.payment_status_breakdown,
      subscription_history: data.subscription_history,
      finance_summary: data.finance_summary,
      best_selling_products: transformProducts(data.best_selling_products),
      recent_orders: data.recent_orders,
      total_revenue: data.total_revenue,
    };
  }, [user?.due_balance]);

  // Transform legacy super admin data to new format
  const transformSuperAdminData = useCallback((data: LegacySuperAdminDashboardData): SystemDashboardData => {
    return {
      system_balance: data.system_balance || 0,
      total_vendors: data.total_vendors || data.users?.total || 0,
      active_vendors: data.active_vendors || data.users?.active || 0,
      inactive_vendors: data.inactive_vendors || data.users?.deactivated || 0,
      pending_kyc_vendors: data.pending_kyc_vendors || data.pending_kyc_count || 0,
      expired_vendors: data.expired_vendors || 0,
      due_blocked_vendors: data.due_blocked_vendors || 0,
      total_shareholders: data.total_shareholders || 0,
      total_shareholder_balance: data.total_shareholder_balance || 0,
      total_distributed_balance: data.total_distributed_balance || 0,
      total_shareholder_withdrawals: data.total_shareholder_withdrawals || 0,
      pending_shareholder_withdrawals_count: data.pending_shareholder_withdrawals_count || 0,
      total_due_amount: data.total_due_amount || 0,
      total_system_revenue: data.total_system_revenue || parseFloat(data.revenue?.total || '0'),
      qr_stand_earnings: parseFloat(data.qr_earnings || '0'),
      subscription_earnings: parseFloat(data.subscription_earnings || '0'),
      transaction_earnings: parseFloat(data.transaction_earnings || '0'),
      whatsapp_earnings: parseFloat(data.whatsapp_earnings || '0'),
      shareholder_distribution: data.shareholder_distribution || [],
      revenue_breakdown: data.revenue_breakdown || {
        qr_stand_earnings: parseFloat(data.qr_earnings || '0'),
        due_collection: 0,
        subscription_earnings: parseFloat(data.subscription_earnings || '0'),
        transaction_earnings: parseFloat(data.transaction_earnings || '0'),
        whatsapp_earnings: parseFloat(data.whatsapp_earnings || '0'),
        total: parseFloat(data.revenue?.total || '0'),
      },
      financial_trends: data.financial_trends || [],
      pending_qr_orders: data.pending_qr_orders || [],
      pending_kyc_requests: data.pending_kyc_requests || [],
      pending_withdrawals: data.pending_withdrawals || [],
      top_revenue_vendors: data.top_revenue_vendors || [],
      // Legacy fields
      users: data.users,
      revenue: data.revenue,
      pending_kyc_count: data.pending_kyc_count,
      transactions: data.transactions,
      total_transactions: data.total_transactions,
      pending_qr_orders_count: data.pending_qr_orders_count,
      transactions_trend: data.transactions_trend,
      users_overview: data.users_overview,
    };
  }, []);

  // Fetch vendor dashboard data
  const fetchVendorData = useCallback(async () => {
    if (!user) return;
    
    setVendorLoading(true);
    try {
      const response = await api.get<LegacyVendorDashboardData>('/api/dashboard/vendor-data/');
      if (response.data) {
        setVendorData(transformVendorData(response.data));
      }
    } catch (error) {
      console.error('Failed to fetch vendor dashboard data:', error);
    } finally {
      setVendorLoading(false);
    }
  }, [user, transformVendorData]);

  // Fetch super admin dashboard data
  const fetchSuperAdminData = useCallback(async () => {
    if (!user || !user.is_superuser) return;
    
    setSuperAdminLoading(true);
    try {
      const response = await api.get<LegacySuperAdminDashboardData>('/api/dashboard/super-admin-data/');
      if (response.data) {
        setSuperAdminData(transformSuperAdminData(response.data));
      }
    } catch (error) {
      console.error('Failed to fetch super admin dashboard data:', error);
    } finally {
      setSuperAdminLoading(false);
    }
  }, [user, transformSuperAdminData]);

  useEffect(() => {
    if (user) {
      fetchVendorData();
      if (user.is_superuser) {
        fetchSuperAdminData();
      }
    }
  }, [user, fetchVendorData, fetchSuperAdminData]);

  // Request FCM token and save to backend when dashboard opens
  useEffect(() => {
    if (user) {
      getAndSaveFCMToken()
        .then((token) => {
          if (token) {
            // FCM token obtained and saved successfully
          } else {
            const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (hasFirebaseConfig) {
              console.warn('FCM token not obtained. Check browser console for details.');
            }
          }
        })
        .catch((error) => {
          console.error('Failed to get and save FCM token:', error);
        });
    }
  }, [user]);

  // Receive FCM token from Flutter and send to Django
  useEffect(() => {
    if (!user || !user.phone) {
      return;
    }

    // Function to send FCM token to Django
    const sendFCMTokenToDjango = async (fcmToken: string) => {
      if (!user || !user.phone) {
        return;
      }

      try {
        const response = await api.post('/api/fcm-token-by-phone/', {
          phone: user.phone,
          fcm_token: fcmToken,
        });

        if (response.error) {
          console.error('Failed to save FCM token:', response.error);
        }
      } catch (error) {
        console.error('Error sending FCM token to Django:', error);
      }
    };

    // Create global function that Flutter can call
    (window as any).receiveFCMTokenFromFlutter = (fcmToken: string) => {
      if (!fcmToken || fcmToken.trim() === '') {
        return;
      }
      sendFCMTokenToDjango(fcmToken);
    };

    // Check if token is already in window object
    const checkForExistingToken = () => {
      const existingToken = (window as any).__FLUTTER_FCM_TOKEN__;
      if (existingToken && typeof existingToken === 'string' && existingToken.trim() !== '') {
        sendFCMTokenToDjango(existingToken);
        delete (window as any).__FLUTTER_FCM_TOKEN__;
      }
    };

    checkForExistingToken();

    const tokenCheckInterval = setInterval(() => {
      checkForExistingToken();
    }, 2000);

    return () => {
      clearInterval(tokenCheckInterval);
      delete (window as any).receiveFCMTokenFromFlutter;
    };
  }, [user]);

  // Set up foreground message handler for FCM notifications
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        if (payload.notification) {
          const { title, body } = payload.notification;
          
          toast.info(title || 'New Notification', {
            description: body || '',
            duration: 5000,
          });
          
          if (Notification.permission === 'granted') {
            new Notification(title || 'New Notification', {
              body: body || '',
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: payload.data?.order_id || 'notification',
              data: payload.data || {},
            });
          }
        }
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, []);

  // Determine which view to show based on user role
  const showSuperAdminView = user?.is_superuser;
  const showVendorView = !user?.is_superuser;

  const getDashboardTitle = () => {
    if (showSuperAdminView) {
      return 'System Dashboard';
    }
    return `Welcome back, ${vendor?.name || 'User'}!`;
  };

  const getDashboardDescription = () => {
    if (showSuperAdminView) {
      return 'System-wide analytics and management';
    }
    return "Here's an overview of your cafe";
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title={getDashboardTitle()}
        description={getDashboardDescription()}
      />

      {/* Super Admin View - System Dashboard */}
      {showSuperAdminView && (
        superAdminData ? (
          <SystemDashboard
            data={superAdminData}
            loading={superAdminLoading}
          />
        ) : superAdminLoading ? (
          <DashboardSkeleton />
        ) : null
      )}

      {/* Vendor View - Vendor Dashboard */}
      {showVendorView && (
        vendorData ? (
          <VendorDashboard
            data={vendorData}
            vendorPhone={vendor?.phone}
            loading={vendorLoading}
          />
        ) : vendorLoading ? (
          <DashboardSkeleton />
        ) : null
      )}
    </DashboardLayout>
  );
}

// Dashboard loading skeleton
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Two column skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>

      {/* Chart skeleton */}
      <Skeleton className="h-96 rounded-xl" />

      {/* Table skeleton */}
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
