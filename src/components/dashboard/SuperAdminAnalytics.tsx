import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCards } from '@/components/ui/stats-cards';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Users, UserCheck, UserX, DollarSign, Eye, Receipt, QrCode, CreditCard } from 'lucide-react';

interface SuperAdminAnalyticsProps {
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
  pendingQrOrders: Array<any>;
  pendingKycCount: number;
  transactions: Array<any>;
  totalTransactions?: number;
  qrEarnings?: string;
  subscriptionEarnings?: string;
  pendingQrOrdersCount?: number;
  transactionsTrend?: Array<{
    date: string;
    count: number;
  }>;
  usersOverview?: Array<{
    id: number;
    name: string;
    phone: string;
    is_active: boolean;
    is_superuser: boolean;
    total_orders: number;
    total_revenue: string;
    kyc_status: string;
  }>;
  loading?: boolean;
}

const COLORS = ['#10b981', '#ef4444']; // green, red

export function SuperAdminAnalytics({
  users,
  revenue,
  revenue: { trends },
  pendingQrOrders,
  pendingKycCount,
  transactions,
  totalTransactions = 0,
  qrEarnings = '0',
  subscriptionEarnings = '0',
  pendingQrOrdersCount = 0,
  transactionsTrend = [],
  usersOverview = [],
  loading = false,
}: SuperAdminAnalyticsProps) {
  const navigate = useNavigate();

  // Stats cards
  const statsCards = [
    {
      label: 'Total Users',
      value: users.total,
      icon: Users,
      color: 'text-foreground',
    },
    {
      label: 'Active Users',
      value: users.active,
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      label: 'Deactivated Users',
      value: users.deactivated,
      icon: UserX,
      color: 'text-red-600',
    },
    {
      label: 'Total Transactions',
      value: totalTransactions.toLocaleString(),
      icon: Receipt,
      color: 'text-blue-600',
    },
    {
      label: 'Total Revenue',
      value: `₹${parseFloat(revenue.total || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: 'QR Earnings',
      value: `₹${parseFloat(qrEarnings || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: QrCode,
      color: 'text-purple-600',
    },
    {
      label: 'Subscription Earnings',
      value: `₹${parseFloat(subscriptionEarnings || '0').toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
      icon: CreditCard,
      color: 'text-orange-600',
    },
    {
      label: 'Pending QR Orders',
      value: pendingQrOrdersCount,
      icon: QrCode,
      color: 'text-yellow-600',
    },
  ];

  // User status distribution for pie chart
  const userStatusData = [
    { name: 'Active', value: users.active },
    { name: 'Deactivated', value: users.deactivated },
  ].filter(item => item.value > 0);

  // Revenue trends data
  const revenueTrendsData = trends.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: parseFloat(item.revenue || '0'),
  }));

  // Transactions trend data
  const transactionsTrendData = transactionsTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: item.count,
  }));

  // Transaction table columns
  const transactionColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: any) => `#${item.id}`,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (item: any) => `₹${parseFloat(item.amount || '0').toFixed(2)}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (item: any) => (
        <span className={`px-2 py-1 rounded text-xs ${
          item.status === 'success' ? 'bg-green-100 text-green-800' :
          item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {item.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (item: any) => new Date(item.created_at).toLocaleDateString(),
    },
  ];

  // QR Stand Orders table columns
  const qrOrderColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: any) => `#${item.id}`,
    },
    {
      key: 'vendor',
      label: 'Vendor',
      render: (item: any) => item.vendor_info?.name || `Vendor #${item.vendor}`,
    },
    {
      key: 'quantity',
      label: 'Quantity',
      render: (item: any) => item.quantity,
    },
    {
      key: 'total_price',
      label: 'Total Price',
      render: (item: any) => `₹${parseFloat(item.total_price || '0').toFixed(2)}`,
    },
    {
      key: 'order_status',
      label: 'Status',
      render: (item: any) => (
        <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
          {item.order_status}
        </span>
      ),
    },
  ];

  // Users overview table columns
  const usersOverviewColumns = [
    {
      key: 'id',
      label: 'ID',
      render: (item: any) => `#${item.id}`,
    },
    {
      key: 'name',
      label: 'Name',
      render: (item: any) => item.name || 'N/A',
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (item: any) => item.phone || 'N/A',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (item: any) => (
        <span className={`px-2 py-1 rounded text-xs ${
          item.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'total_orders',
      label: 'Orders',
      render: (item: any) => item.total_orders || 0,
    },
    {
      key: 'total_revenue',
      label: 'Revenue',
      render: (item: any) => `₹${parseFloat(item.total_revenue || '0').toFixed(2)}`,
    },
    {
      key: 'kyc_status',
      label: 'KYC',
      render: (item: any) => (
        <span className={`px-2 py-1 rounded text-xs ${
          item.kyc_status === 'approved' ? 'bg-green-100 text-green-800' :
          item.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {item.kyc_status || 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <StatsCards stats={statsCards} loading={loading} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>User Status Distribution</CardTitle>
            <CardDescription>Active vs Deactivated users</CardDescription>
          </CardHeader>
          <CardContent>
            {userStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No user data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Growth Graph */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Growth</CardTitle>
            <CardDescription>Last 30 days revenue trends</CardDescription>
          </CardHeader>
          <CardContent>
            {revenueTrendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    name="Revenue (₹)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transactions Trend Chart */}
      {transactionsTrendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions Trend</CardTitle>
            <CardDescription>Daily transaction count (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={transactionsTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="Transactions" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Pending QR Stand Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending QR Stand Orders</CardTitle>
              <CardDescription>Orders awaiting processing</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/qr-stands')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingQrOrders.length > 0 ? (
            <DataTable
              columns={qrOrderColumns}
              data={pendingQrOrders}
              loading={loading}
            />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pending QR stand orders
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending KYC Requests */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Pending KYC Requests</CardTitle>
              <CardDescription>KYC verifications awaiting approval</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/kyc-management')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All ({pendingKycCount})
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-2xl font-bold text-foreground">{pendingKycCount}</p>
            <p className="text-sm text-muted-foreground mt-2">KYC requests pending approval</p>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest system transactions</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/transactions')}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={transactionColumns}
            data={transactions.slice(0, 10)}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* Users Overview Table */}
      {usersOverview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users Overview</CardTitle>
                <CardDescription>List of users with key statistics</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/vendors')}
              >
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={usersOverviewColumns}
              data={usersOverview}
              loading={loading}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
