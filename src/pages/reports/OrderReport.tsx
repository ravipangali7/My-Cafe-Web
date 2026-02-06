import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FilterBar } from '@/components/ui/filter-bar';
import { DateFilterButtons, DateFilterType } from '@/components/ui/date-filter-buttons';
import { PremiumStatsCards, formatCurrency } from '@/components/ui/premium-stats-card';
import { ChartCard } from '@/components/dashboard/shared/ChartCard';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { ShoppingCart, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';
import { chartColors, theme } from '@/lib/theme';

interface OrderReportData {
  summary: {
    total_orders: number;
    total_revenue: string;
    start_date: string;
    end_date: string;
  };
  orders_by_status: Array<{ status: string; count: number; revenue: string; avg_order_value: string }>;
  orders_by_payment_status: Array<{ payment_status: string; count: number; revenue: string }>;
  daily_breakdown?: Array<{ date: string; orders: number; revenue: string }>;
  detailed_orders: Array<{
    id: number;
    name: string;
    phone: string;
    table_no: string;
    status: string;
    payment_status: string;
    total: string;
    created_at: string;
    items: Array<{
      product_name: string;
      quantity: number;
      price: string;
      total: string;
    }>;
  }>;
}

export function OrderReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<OrderReportData | null>(null);

  const generateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        start_date: startDate,
        end_date: endDate,
      };

      if (appliedUserId && user?.is_superuser) {
        params.user_id = appliedUserId;
      }

      const queryString = api.buildQueryString(params);
      const response = await api.get<OrderReportData>(`/api/reports/orders/${queryString}`);

      if (response.error) {
        toast.error(response.error);
      } else if (response.data) {
        setReportData(response.data);
        toast.success('Report generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, appliedUserId, user]);

  const handleApplyFilters = () => {
    setAppliedUserId(userId);
  };

  const handleClearFilters = () => {
    setUserId(null);
    setAppliedUserId(null);
  };

  const handleDateFilterChange = (filter: DateFilterType, start?: string, end?: string) => {
    setDateFilter(filter);
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select date range and filters to generate the report</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateFilter('custom');
                }}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateFilter('custom');
                }}
                required
              />
            </div>
          </div>

          <DateFilterButtons
            activeFilter={dateFilter}
            onFilterChange={handleDateFilterChange}
            showDateInputs={false}
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

          <Button onClick={generateReport} disabled={loading || !startDate || !endDate}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          {reportData.summary && (
            <>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Summary
                </h3>
                <PremiumStatsCards
                  stats={[
                    { label: 'Total Orders', value: (reportData.summary.total_orders || 0).toLocaleString(), icon: ShoppingCart, variant: 'default' },
                    { label: 'Total Revenue', value: formatCurrency(parseFloat(reportData.summary.total_revenue || '0')), icon: DollarSign, variant: 'success' },
                    { label: 'Paid Orders', value: (reportData.orders_by_payment_status?.find((p) => p.payment_status === 'paid')?.count ?? 0).toLocaleString(), icon: CheckCircle, variant: 'success' },
                    { label: 'Pending Payment', value: (reportData.orders_by_payment_status?.find((p) => p.payment_status === 'pending')?.count ?? 0).toLocaleString(), icon: Clock, variant: 'warning' },
                    { label: 'Completed', value: (reportData.orders_by_status?.find((s) => s.status === 'completed')?.count ?? 0).toLocaleString(), icon: CheckCircle, variant: 'default' },
                    { label: 'Rejected', value: (reportData.orders_by_status?.find((s) => s.status === 'rejected')?.count ?? 0).toLocaleString(), icon: XCircle, variant: 'destructive' },
                    {
                      label: 'Avg Order Value',
                      value: reportData.summary.total_orders
                        ? formatCurrency(parseFloat(reportData.summary.total_revenue || '0') / reportData.summary.total_orders)
                        : '—',
                      icon: DollarSign,
                      variant: 'info',
                    },
                  ]}
                  columns={4}
                />
              </div>
              {(reportData.orders_by_status?.length > 0 || reportData.orders_by_payment_status?.length > 0 || (reportData.daily_breakdown?.length ?? 0) > 0) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {reportData.orders_by_status && reportData.orders_by_status.length > 0 && (
                    <ChartCard title="Orders by Status" description="Count by status">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={reportData.orders_by_status}
                            dataKey="count"
                            nameKey="status"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ status, count }) => `${status}: ${count}`}
                          >
                            {reportData.orders_by_status.map((_, i) => (
                              <Cell key={i} fill={chartColors[i % 6]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                  {reportData.orders_by_payment_status && reportData.orders_by_payment_status.length > 0 && (
                    <ChartCard title="Orders by Payment Status" description="Count by payment">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie
                            data={reportData.orders_by_payment_status}
                            dataKey="count"
                            nameKey="payment_status"
                            cx="50%"
                            cy="50%"
                            outerRadius={70}
                            label={({ payment_status, count }) => `${payment_status}: ${count}`}
                          >
                            {reportData.orders_by_payment_status.map((_, i) => (
                              <Cell key={i} fill={([chartColors[0], chartColors[2], theme.destructive] as const)[i % 3]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                  {reportData.daily_breakdown && reportData.daily_breakdown.length > 0 && (
                    <ChartCard title="Revenue Over Time" description="Daily revenue" className="lg:col-span-2">
                      <ResponsiveContainer width="100%" height={240}>
                        <LineChart
                          data={reportData.daily_breakdown.map((d) => ({
                            date: d.date,
                            revenue: parseFloat(d.revenue || '0'),
                            orders: d.orders,
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                          <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                          <Line type="monotone" dataKey="revenue" stroke={chartColors[0]} strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  )}
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Orders</p>
                      <p className="text-2xl font-bold">{reportData.summary.total_orders || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Revenue</p>
                      <p className="text-2xl font-bold">₹{parseFloat(reportData.summary.total_revenue || '0').toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date Range</p>
                      <p className="text-sm">
                        {reportData.summary.start_date && reportData.summary.end_date
                          ? `${new Date(reportData.summary.start_date).toLocaleDateString()} - ${new Date(reportData.summary.end_date).toLocaleDateString()}`
                          : '—'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {reportData.orders_by_status && reportData.orders_by_status.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orders by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Status</th>
                        <th className="text-right p-2">Count</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Avg Order Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders_by_status.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.status}</td>
                          <td className="p-2 text-right">{item.count || 0}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.revenue || '0').toFixed(2)}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.avg_order_value || '0').toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.orders_by_payment_status && reportData.orders_by_payment_status.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Orders by Payment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Payment Status</th>
                        <th className="text-right p-2">Count</th>
                        <th className="text-right p-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.orders_by_payment_status.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.payment_status}</td>
                          <td className="p-2 text-right">{item.count || 0}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.revenue || '0').toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {reportData.detailed_orders && reportData.detailed_orders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.detailed_orders.map((order) => (
                    <Card key={order.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Order ID</p>
                            <p className="font-bold text-lg">#{order.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Customer</p>
                            <p className="font-semibold">{order.name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Table</p>
                            <p className="font-semibold">{order.table_no}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-semibold">₹{parseFloat(order.total).toFixed(2)}</p>
                          </div>
                        </div>
                        {order.items && order.items.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b">
                                  <th className="text-left p-2">Product</th>
                                  <th className="text-right p-2">Quantity</th>
                                  <th className="text-right p-2">Price</th>
                                  <th className="text-right p-2">Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {order.items.map((item, idx) => (
                                  <tr key={idx} className="border-b">
                                    <td className="p-2">{item.product_name || '—'}</td>
                                    <td className="p-2 text-right">{item.quantity || 0}</td>
                                    <td className="p-2 text-right">₹{parseFloat(item.price || '0').toFixed(2)}</td>
                                    <td className="p-2 text-right">₹{parseFloat(item.total || '0').toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No items</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
