import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatsCards } from '@/components/ui/stats-cards';
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
import { CheckCircle2, XCircle, Clock, ShoppingCart } from 'lucide-react';
import { chartColors, theme } from '@/lib/theme';

interface VendorAnalyticsProps {
  subscription: {
    status: string;
    end_date: string | null;
  };
  paymentStatusBreakdown: {
    paid: number;
    pending: number;
    failed: number;
  };
  subscriptionHistory: Array<{
    date: string;
    event: string;
    amount?: string;
    status?: string;
  }>;
  totalOrders?: number;
  bestSellingProducts?: Array<{
    product_id: number;
    product_name: string;
    product_image: string | null;
    total_quantity: number;
    total_revenue: string;
  }>;
  orderTrends?: {
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
}

const PIE_COLORS = [chartColors[0], chartColors[2], theme.destructive] as const;

export function VendorAnalytics({
  subscription,
  paymentStatusBreakdown,
  subscriptionHistory,
  totalOrders = 0,
  bestSellingProducts = [],
  orderTrends,
}: VendorAnalyticsProps) {
  // Prepare payment status chart data
  const paymentStatusData = [
    { name: 'Paid', value: paymentStatusBreakdown.paid },
    { name: 'Pending', value: paymentStatusBreakdown.pending },
    { name: 'Failed', value: paymentStatusBreakdown.failed },
  ].filter(item => item.value > 0);

  // Prepare subscription history chart data
  const subscriptionHistoryData = subscriptionHistory
    .filter(item => item.event === 'payment')
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: parseFloat(item.amount || '0'),
    }));

  // Calculate subscription expiry status
  const isExpired = subscription.end_date
    ? new Date(subscription.end_date) < new Date()
    : true;
  const isActive = subscription.status === 'active';

  // Stats cards data
  const statsCards = [
    {
      label: 'Active Subscription',
      value: isActive ? 'Yes' : 'No',
      icon: isActive ? CheckCircle2 : XCircle,
      color: isActive ? 'text-success' : 'text-destructive',
    },
    {
      label: 'Expiry Status',
      value: isExpired ? 'Expired' : 'Active',
      icon: isExpired ? XCircle : CheckCircle2,
      color: isExpired ? 'text-destructive' : 'text-success',
    },
    {
      label: 'Total Orders',
      value: totalOrders,
      icon: ShoppingCart,
      color: 'text-foreground',
    },
  ];

  // Prepare best selling products chart data
  const bestSellingData = bestSellingProducts.slice(0, 10).map(item => ({
    name: item.product_name.length > 15 ? item.product_name.substring(0, 15) + '...' : item.product_name,
    quantity: item.total_quantity,
    revenue: parseFloat(item.total_revenue || '0'),
  }));

  // Prepare order trends data
  const dailyTrendsData = orderTrends?.daily.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    orders: item.orders,
    revenue: parseFloat(item.revenue || '0'),
  })) || [];

  const monthlyTrendsData = orderTrends?.monthly.map(item => ({
    date: item.date,
    orders: item.orders,
    revenue: parseFloat(item.revenue || '0'),
  })) || [];

  return (
    <div className="space-y-6">
      <StatsCards stats={statsCards} loading={false} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Status Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Status</CardTitle>
            <CardDescription>Distribution of payment status</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill={chartColors[1]}
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription History Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription History</CardTitle>
            <CardDescription>Payment timeline</CardDescription>
          </CardHeader>
          <CardContent>
            {subscriptionHistoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={subscriptionHistoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke={chartColors[0]}
                    name="Amount (₹)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No subscription history available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Best Selling Products Chart */}
      {bestSellingData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Best Selling Products</CardTitle>
            <CardDescription>Top products by quantity sold</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bestSellingData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="quantity" fill={chartColors[1]} name="Quantity Sold" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Revenue Flow Chart */}
      {dailyTrendsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Flow</CardTitle>
            <CardDescription>Daily revenue trends (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={chartColors[0]}
                  name="Revenue (₹)"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Order Trends Chart */}
      {dailyTrendsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order Trends</CardTitle>
            <CardDescription>Daily order count (last 30 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyTrendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill={chartColors[3]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
