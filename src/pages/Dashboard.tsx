import { useEffect, useState, useCallback } from 'react';
import { Package, ShoppingCart, FolderOpen, Receipt, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { StatsCards } from '@/components/ui/stats-cards';
import { FilterBar } from '@/components/ui/filter-bar';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useVendor } from '@/contexts/VendorContext';
import { getAndSaveFCMToken } from '@/lib/fcm';
import { getFirebaseMessaging } from '@/lib/firebase-config';
import { onMessage } from 'firebase/messaging';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DashboardStats {
  products: number;
  orders: number;
  categories: number;
  transactions: number;
  total_revenue: string;
  paid_revenue: string;
  orders_by_status: Array<{ status: string; count: number }>;
  recent_orders: Array<{
    id: number;
    name: string;
    phone: string;
    table_no: string;
    status: string;
    payment_status: string;
    total: string;
    created_at: string;
  }>;
  top_products: Array<{
    product__name: string;
    total_revenue: string;
    total_quantity: number;
  }>;
  revenue_by_category: Array<{
    product__category__name: string;
    total_revenue: string;
  }>;
  sales_trends: Array<{
    date: string;
    orders: number;
    revenue: string;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface UserStats {
  user: {
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
    is_active: boolean;
  };
  stats: {
    products: number;
    orders: number;
    categories: number;
    transactions: number;
    total_revenue: string;
    paid_revenue: string;
  };
}

export default function Dashboard() {
  const { vendor } = useVendor();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null);
  const [usersStats, setUsersStats] = useState<UserStats[]>([]);
  const [loadingUsersStats, setLoadingUsersStats] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (appliedUserId && user.is_superuser) {
        params.user_id = appliedUserId;
      }
      const queryString = api.buildQueryString(params);
      const response = await api.get<{ stats: DashboardStats }>(`/api/dashboard/stats${queryString}`);
      if (response.data) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [user, appliedUserId]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user, fetchStats]);

  // Request FCM token and save to backend when dashboard opens
  useEffect(() => {
    if (user) {
      // Initialize Firebase and request FCM token
      getAndSaveFCMToken()
        .then((token) => {
          if (token) {
            console.log('FCM token obtained and saved successfully');
          } else {
            // Only show warning if Firebase is configured (to avoid spam)
            const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && import.meta.env.VITE_FIREBASE_VAPID_KEY;
            if (hasFirebaseConfig) {
              console.warn('FCM token not obtained. Check browser console for details.');
            }
          }
        })
        .catch((error) => {
          console.error('Failed to get and save FCM token:', error);
          // Don't show error toast as this is not critical for dashboard functionality
        });
    }
  }, [user]);

  // Set up foreground message handler for FCM notifications
  useEffect(() => {
    const messaging = getFirebaseMessaging();
    if (messaging) {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Show browser notification when app is in foreground
        if (payload.notification) {
          const { title, body } = payload.notification;
          
          // Show toast notification
          toast.info(title || 'New Notification', {
            description: body || '',
            duration: 5000,
          });
          
          // Also show browser notification if permission is granted
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

  // Fetch users stats for super admin
  const fetchUsersStats = useCallback(async () => {
    if (!user || !user.is_superuser) return;
    
    setLoadingUsersStats(true);
    try {
      const response = await api.get<{ users: UserStats[] }>('/api/dashboard/users-stats/');
      if (response.data) {
        setUsersStats(response.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users stats:', error);
    } finally {
      setLoadingUsersStats(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.is_superuser && !appliedUserId) {
      fetchUsersStats();
    }
  }, [user, appliedUserId, fetchUsersStats]);

  const handleApplyFilters = () => {
    setAppliedUserId(userId);
    // Fetch user name if filtering by specific user
    if (userId && user?.is_superuser) {
      api.get<{ data: Array<{ id: number; name: string; phone: string }> }>('/api/vendors/?page_size=1000')
        .then((response) => {
          if (response.data) {
            const selectedUser = response.data.data.find((u) => u.id === userId);
            setSelectedUserName(selectedUser?.name || null);
          }
        })
        .catch(() => {
          setSelectedUserName(null);
        });
    } else {
      setSelectedUserName(null);
    }
  };

  const handleClearFilters = () => {
    setUserId(null);
    setAppliedUserId(null);
    setSelectedUserName(null);
  };

  const basicStatCards = stats ? [
    { label: 'Products', value: stats.products, icon: Package, color: 'text-foreground' },
    { label: 'Orders', value: stats.orders, icon: ShoppingCart, color: 'text-foreground' },
    { label: 'Categories', value: stats.categories, icon: FolderOpen, color: 'text-foreground' },
    { label: 'Transactions', value: stats.transactions, icon: Receipt, color: 'text-foreground' },
  ] : [];

  const revenueStatCards = stats ? [
    { label: 'Total Revenue', value: `₹${parseFloat(stats.total_revenue || '0').toFixed(2)}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Paid Revenue', value: `₹${parseFloat(stats.paid_revenue || '0').toFixed(2)}`, icon: TrendingUp, color: 'text-blue-600' },
  ] : [];

  // Prepare chart data
  const salesTrendsData = stats?.sales_trends.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    orders: item.orders,
    revenue: parseFloat(item.revenue || '0'),
  })) || [];

  const revenueByCategoryData = stats?.revenue_by_category.map(item => ({
    name: item.product__category__name || 'Uncategorized',
    value: parseFloat(item.total_revenue || '0'),
  })) || [];

  const ordersByStatusData = stats?.orders_by_status.map(item => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
    value: item.count,
  })) || [];

  const topProductsData = stats?.top_products.slice(0, 10).map(item => ({
    name: item.product__name,
    revenue: parseFloat(item.total_revenue || '0'),
    quantity: item.total_quantity,
  })) || [];

  const getDashboardTitle = () => {
    if (user?.is_superuser && appliedUserId && selectedUserName) {
      return `Dashboard - ${selectedUserName}`;
    } else if (user?.is_superuser && !appliedUserId) {
      return 'Dashboard - All Users';
    }
    return `Welcome back, ${vendor?.name || 'User'}!`;
  };

  const getDashboardDescription = () => {
    if (user?.is_superuser && appliedUserId) {
      return `Statistics for ${selectedUserName || 'selected user'}`;
    } else if (user?.is_superuser && !appliedUserId) {
      return 'Aggregated statistics across all users';
    }
    return "Here's an overview of your cafe";
  };

  return (
    <DashboardLayout>
      <PageHeader 
        title={getDashboardTitle()}
        description={getDashboardDescription()}
      />

      {user?.is_superuser && (
        <FilterBar
          search=""
          onSearchChange={() => {}}
          userId={userId}
          onUserIdChange={setUserId}
          onApply={handleApplyFilters}
          onClear={handleClearFilters}
          showUserFilter={true}
        />
      )}

      <StatsCards stats={basicStatCards} loading={loading} />
      
      {stats && (
        <>
          <StatsCards stats={revenueStatCards} loading={loading} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Sales Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trends</CardTitle>
                <CardDescription>Orders and revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="orders" stroke="#8884d8" name="Orders" />
                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#82ca9d" name="Revenue (₹)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ordersByStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ordersByStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Revenue by Category */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Category</CardTitle>
                <CardDescription>Total revenue per category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueByCategoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>Best performing products</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProductsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Users Overview Table - Super Admin Only */}
          {user?.is_superuser && !appliedUserId && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Users Overview</CardTitle>
                <CardDescription>Individual statistics for each user</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsersStats ? (
                  <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                ) : usersStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">User</th>
                          <th className="text-left p-2">Products</th>
                          <th className="text-left p-2">Orders</th>
                          <th className="text-left p-2">Categories</th>
                          <th className="text-left p-2">Transactions</th>
                          <th className="text-right p-2">Total Revenue</th>
                          <th className="text-right p-2">Paid Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersStats.map((item) => (
                          <tr key={item.user.id} className="border-b">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                {item.user.logo_url ? (
                                  <img 
                                    src={item.user.logo_url} 
                                    alt={item.user.name} 
                                    className="h-8 w-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center">
                                    {item.user.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{item.user.name}</div>
                                  <div className="text-sm text-muted-foreground">{item.user.phone}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-2">{item.stats.products}</td>
                            <td className="p-2">{item.stats.orders}</td>
                            <td className="p-2">{item.stats.categories}</td>
                            <td className="p-2">{item.stats.transactions}</td>
                            <td className="p-2 text-right">₹{parseFloat(item.stats.total_revenue || '0').toFixed(2)}</td>
                            <td className="p-2 text-right">₹{parseFloat(item.stats.paid_revenue || '0').toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">No users found</div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Orders Table */}
          {stats.recent_orders && stats.recent_orders.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-left p-2">Table</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Payment</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recent_orders.map((order) => (
                        <tr key={order.id} className="border-b">
                          <td className="p-2">#{order.id}</td>
                          <td className="p-2">{order.name}</td>
                          <td className="p-2">{order.table_no}</td>
                          <td className="p-2">{order.status}</td>
                          <td className="p-2">{order.payment_status}</td>
                          <td className="p-2 text-right">₹{parseFloat(order.total).toFixed(2)}</td>
                          <td className="p-2">{new Date(order.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
