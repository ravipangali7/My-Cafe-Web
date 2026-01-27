import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useVendor } from '@/contexts/VendorContext';
import { getAndSaveFCMToken } from '@/lib/fcm';
import { getFirebaseMessaging } from '@/lib/firebase-config';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import { ViewToggle } from '@/components/dashboard/ViewToggle';
import { SubscriptionSummary } from '@/components/dashboard/SubscriptionSummary';
import { SubscriptionDetails } from '@/components/dashboard/SubscriptionDetails';
import { TransactionHistoryTable } from '@/components/dashboard/TransactionHistoryTable';
import { VendorDashboardStats } from '@/components/dashboard/VendorDashboardStats';
import { VendorAnalytics } from '@/components/dashboard/VendorAnalytics';
import { SuperAdminAnalytics } from '@/components/dashboard/SuperAdminAnalytics';
import { ShoppingCart, QrCode, Eye } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';

interface VendorDashboardData {
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
  order_trends?: {
    daily: Array<{
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
}

interface SuperAdminDashboardData {
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
  transactions: Array<any>;
  total_transactions?: number;
  qr_earnings?: string;
  subscription_earnings?: string;
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
}

export default function Dashboard() {
  const { vendor } = useVendor();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // View mode state (for super admins)
  const [viewMode, setViewMode] = useState<'superAdmin' | 'vendor'>('vendor');
  
  // Vendor dashboard data
  const [vendorData, setVendorData] = useState<VendorDashboardData | null>(null);
  const [vendorLoading, setVendorLoading] = useState(true);
  
  // Super admin dashboard data
  const [superAdminData, setSuperAdminData] = useState<SuperAdminDashboardData | null>(null);
  const [superAdminLoading, setSuperAdminLoading] = useState(true);

  // Fetch vendor dashboard data
  const fetchVendorData = useCallback(async () => {
    if (!user) return;
    
    setVendorLoading(true);
    try {
      const response = await api.get<VendorDashboardData>('/api/dashboard/vendor-data/');
      if (response.data) {
        setVendorData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch vendor dashboard data:', error);
    } finally {
      setVendorLoading(false);
    }
  }, [user]);

  // Fetch super admin dashboard data
  const fetchSuperAdminData = useCallback(async () => {
    if (!user || !user.is_superuser) return;
    
    setSuperAdminLoading(true);
    try {
      const response = await api.get<SuperAdminDashboardData>('/api/dashboard/super-admin-data/');
      if (response.data) {
        setSuperAdminData(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch super admin dashboard data:', error);
    } finally {
      setSuperAdminLoading(false);
    }
  }, [user]);

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
      console.log('[React] User or phone not available, skipping FCM token handler setup');
      return;
    }

    console.log('[React] Setting up FCM token receiver from Flutter. User phone:', user.phone);

    // Function to send FCM token to Django
    const sendFCMTokenToDjango = async (fcmToken: string) => {
      if (!user || !user.phone) {
        console.warn('[React] ⚠️ User not logged in or phone not available');
        return;
      }

      try {
        console.log('[React] Sending FCM token to Django API...');
        console.log('[React] Phone:', user.phone);
        console.log('[React] Token:', fcmToken.substring(0, 30) + '...');

        const response = await api.post('/api/fcm-token-by-phone/', {
          phone: user.phone,
          fcm_token: fcmToken,
        });

        if (response.data) {
          console.log('[React] ✅ FCM token saved successfully:', response.data);
        } else if (response.error) {
          console.error('[React] ❌ Failed to save FCM token:', response.error);
        }
      } catch (error) {
        console.error('[React] ❌ Error sending FCM token to Django:', error);
      }
    };

    // Create global function that Flutter can call
    (window as any).receiveFCMTokenFromFlutter = (fcmToken: string) => {
      if (!fcmToken || fcmToken.trim() === '') {
        console.warn('[React] ⚠️ Received empty FCM token from Flutter');
        return;
      }

      console.log('[React] 📱 Received FCM token from Flutter');
      sendFCMTokenToDjango(fcmToken);
    };

    // Check if token is already in window object (Flutter might have set it before React loaded)
    const checkForExistingToken = () => {
      const existingToken = (window as any).__FLUTTER_FCM_TOKEN__;
      if (existingToken && typeof existingToken === 'string' && existingToken.trim() !== '') {
        console.log('[React] Found existing FCM token in window object, processing...');
        sendFCMTokenToDjango(existingToken);
        // Clear it to avoid duplicate sends
        delete (window as any).__FLUTTER_FCM_TOKEN__;
      }
    };

    // Check immediately
    checkForExistingToken();

    // Also set up a listener for when token is set
    const tokenCheckInterval = setInterval(() => {
      checkForExistingToken();
    }, 2000); // Check every 2 seconds

    console.log('[React] ✅ receiveFCMTokenFromFlutter function created and ready');

    // Cleanup function
    return () => {
      console.log('[React] Cleaning up FCM token receiver functions');
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

  // Determine which view to show
  const showSuperAdminView = user?.is_superuser && viewMode === 'superAdmin';
  const showVendorView = !user?.is_superuser || viewMode === 'vendor';

  const getDashboardTitle = () => {
    if (showSuperAdminView) {
      return 'Super Admin Dashboard';
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

      {/* View Toggle for Super Admins */}
      {user?.is_superuser && (
        <div className="mb-6">
          <ViewToggle
            currentView={viewMode}
            onViewChange={setViewMode}
          />
        </div>
      )}

      {/* Super Admin View */}
      {showSuperAdminView && superAdminData && (
        <SuperAdminAnalytics
          users={superAdminData.users}
          revenue={superAdminData.revenue}
          pendingQrOrders={superAdminData.pending_qr_orders}
          pendingKycCount={superAdminData.pending_kyc_count}
          transactions={superAdminData.transactions}
          totalTransactions={superAdminData.total_transactions}
          qrEarnings={superAdminData.qr_earnings}
          subscriptionEarnings={superAdminData.subscription_earnings}
          pendingQrOrdersCount={superAdminData.pending_qr_orders_count}
          transactionsTrend={superAdminData.transactions_trend}
          usersOverview={superAdminData.users_overview}
          loading={superAdminLoading}
        />
      )}

      {/* Vendor View */}
      {showVendorView && (
        <div className="space-y-6">
          {/* Subscription Summary Card (Compact) */}
          {vendorData && (
            <SubscriptionSummary subscription={vendorData.subscription} />
          )}

          {/* Enhanced Stats Cards */}
          {vendorData && (
            <VendorDashboardStats
              totalOrders={vendorData.total_orders || 0}
              totalSales={vendorData.total_sales || '0'}
              totalRevenue={vendorData.total_revenue || '0'}
              financeSummary={vendorData.finance_summary || { today: '0', week: '0', month: '0' }}
              loading={vendorLoading}
            />
          )}

          {/* Pending Orders and QR Stand Orders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pending Orders</CardTitle>
                    <CardDescription>Orders awaiting processing</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/orders?status=pending')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-3xl font-bold text-foreground">
                    {vendorData?.pending_orders_count || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Pending orders</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Pending QR Stand Orders</CardTitle>
                    <CardDescription>QR stand orders awaiting processing</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/qr-stands?order_status=pending')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-3xl font-bold text-foreground">
                    {vendorData?.pending_qr_orders_count || 0}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">Pending QR stand orders</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vendor Analytics with Enhanced Charts */}
          {vendorData && (
            <VendorAnalytics
              subscription={vendorData.subscription}
              paymentStatusBreakdown={vendorData.payment_status_breakdown}
              subscriptionHistory={vendorData.subscription_history}
              totalOrders={vendorData.total_orders}
              bestSellingProducts={vendorData.best_selling_products}
              orderTrends={vendorData.order_trends}
            />
          )}

          {/* Recent Orders Table */}
          {vendorData && vendorData.recent_orders && vendorData.recent_orders.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Orders</CardTitle>
                    <CardDescription>Latest orders from your cafe</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/orders')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    {
                      key: 'id',
                      label: 'Order ID',
                      render: (item: any) => `#${item.id}`,
                    },
                    {
                      key: 'name',
                      label: 'Customer',
                      render: (item: any) => item.name || 'N/A',
                    },
                    {
                      key: 'table_no',
                      label: 'Table',
                      render: (item: any) => item.table_no || 'N/A',
                    },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (item: any) => (
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'completed' ? 'bg-green-100 text-green-800' :
                          item.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      ),
                    },
                    {
                      key: 'total',
                      label: 'Total',
                      render: (item: any) => `₹${parseFloat(item.total || '0').toFixed(2)}`,
                    },
                    {
                      key: 'created_at',
                      label: 'Date',
                      render: (item: any) => new Date(item.created_at).toLocaleDateString(),
                    },
                  ]}
                  data={vendorData.recent_orders.slice(0, 10)}
                  loading={vendorLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Transaction History Table */}
          {vendorData && (
            <TransactionHistoryTable
              transactions={vendorData.transactions}
              loading={vendorLoading}
            />
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
