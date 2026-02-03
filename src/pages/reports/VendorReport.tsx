import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateFilterButtons, DateFilterType, getDateRange } from '@/components/ui/date-filter-buttons';
import { PremiumStatsCards, formatCurrency, formatNumber } from '@/components/ui/premium-stats-card';
import { ChartCard } from '@/components/dashboard/shared/ChartCard';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Users, UserCheck, UserX, Clock, AlertTriangle, Ban, DollarSign, TrendingUp } from 'lucide-react';
import { statusColors, chartColors } from '@/lib/theme';

interface VendorReportSummary {
  total_vendors: number;
  active_vendors: number;
  inactive_vendors: number;
  pending_kyc_vendors: number;
  expired_vendors: number;
  due_blocked_vendors: number;
  total_vendor_revenue: string;
  total_due_amount: number;
  start_date: string;
  end_date: string;
}

interface VendorReportData {
  summary: VendorReportSummary;
  vendors_by_status: Array<{ status: string; count: number }>;
  top_vendors_by_revenue: Array<{
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
    total_revenue: number;
    total_orders: number;
  }>;
  vendor_registration_over_time: Array<{ created_date: string; count: number }>;
  vendors_list: Array<{
    id: number;
    name: string;
    phone: string;
    logo_url: string | null;
    kyc_status: string;
    subscription_end_date: string | null;
    due_balance: number;
    is_over_threshold: boolean;
    total_orders: number;
    total_revenue: string;
    last_order_date: string | null;
    is_active: boolean;
  }>;
  over_dues_list: Array<{
    id: number;
    name: string;
    phone: string;
    due_balance: number;
    total_revenue: string;
  }>;
}

export function VendorReport() {
  const defaultRange = getDateRange('month');
  const [startDate, setStartDate] = useState(defaultRange.startDate ?? '');
  const [endDate, setEndDate] = useState(defaultRange.endDate ?? '');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<VendorReportData | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const qs = api.buildQueryString(params);
      const response = await api.get<VendorReportData>(`/api/reports/vendors/${qs}`);
      if (response.error) {
        toast.error(response.error);
      } else if (response.data) {
        setReportData(response.data);
        toast.success('Vendor report generated');
      }
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

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
          <CardDescription>Optional date range for revenue and top vendors</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateFilter('custom');
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateFilter('custom');
                }}
              />
            </div>
          </div>
          <DateFilterButtons
            activeFilter={dateFilter}
            onFilterChange={handleDateFilterChange}
            showDateInputs={false}
          />
          <Button onClick={generateReport} disabled={loading}>
            {loading ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {reportData && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Summary
            </h3>
            <PremiumStatsCards
              stats={[
                { label: 'Total Vendors', value: formatNumber(reportData.summary.total_vendors), icon: Users, variant: 'default' },
                { label: 'Active', value: formatNumber(reportData.summary.active_vendors), icon: UserCheck, variant: 'success' },
                { label: 'Inactive', value: formatNumber(reportData.summary.inactive_vendors), icon: UserX, variant: 'destructive' },
                { label: 'Pending KYC', value: formatNumber(reportData.summary.pending_kyc_vendors), icon: Clock, variant: 'warning' },
                { label: 'Expired', value: formatNumber(reportData.summary.expired_vendors), icon: AlertTriangle, variant: 'warning' },
                { label: 'Due Blocked', value: formatNumber(reportData.summary.due_blocked_vendors), icon: Ban, variant: 'destructive' },
                { label: 'Vendor Revenue (period)', value: formatCurrency(parseFloat(reportData.summary.total_vendor_revenue || '0')), icon: TrendingUp, variant: 'success' },
                { label: 'Total Due Amount', value: formatCurrency(reportData.summary.total_due_amount), icon: DollarSign, variant: 'warning' },
              ]}
              columns={4}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Vendors by Status" description="Count by status">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={reportData.vendors_by_status.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, count }) => `${status}: ${count}`}
                  >
                    {reportData.vendors_by_status.map((entry, index) => (
                      <Cell key={entry.status} fill={statusColors[entry.status] ?? chartColors[0]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Vendors by Revenue" description="Period revenue">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={reportData.top_vendors_by_revenue.slice(0, 10).map((v) => ({
                    name: v.name.length > 12 ? v.name.slice(0, 12) + '…' : v.name,
                    revenue: v.total_revenue,
                  }))}
                  margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {reportData.vendor_registration_over_time.length > 0 && (
            <ChartCard title="Vendor Registration Over Time" description="New vendors per day">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={reportData.vendor_registration_over_time.map((d) => ({
                    date: d.created_date,
                    count: d.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={chartColors[1]} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Tables */}
          <Card>
            <CardHeader>
              <CardTitle>Vendors List</CardTitle>
              <CardDescription>Vendor details and stats (up to 200)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-left p-2">KYC</th>
                      <th className="text-left p-2">Subscription End</th>
                      <th className="text-right p-2">Due</th>
                      <th className="text-right p-2">Orders</th>
                      <th className="text-right p-2">Revenue</th>
                      <th className="text-left p-2">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.vendors_list.map((v) => (
                      <tr key={v.id} className="border-b">
                        <td className="p-2 font-medium">{v.name}</td>
                        <td className="p-2">{v.phone}</td>
                        <td className="p-2">{v.kyc_status}</td>
                        <td className="p-2">{v.subscription_end_date ? new Date(v.subscription_end_date).toLocaleDateString() : '—'}</td>
                        <td className="p-2 text-right">{v.is_over_threshold ? `₹${v.due_balance.toLocaleString()} *` : `₹${v.due_balance.toLocaleString()}`}</td>
                        <td className="p-2 text-right">{v.total_orders}</td>
                        <td className="p-2 text-right">₹{parseFloat(v.total_revenue || '0').toLocaleString()}</td>
                        <td className="p-2">{v.last_order_date ? new Date(v.last_order_date).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {reportData.over_dues_list.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Over Due Threshold</CardTitle>
                <CardDescription>Vendors with due balance over threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Name</th>
                        <th className="text-left p-2">Phone</th>
                        <th className="text-right p-2">Due Balance</th>
                        <th className="text-right p-2">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.over_dues_list.map((v) => (
                        <tr key={v.id} className="border-b">
                          <td className="p-2 font-medium">{v.name}</td>
                          <td className="p-2">{v.phone}</td>
                          <td className="p-2 text-right text-destructive font-medium">₹{v.due_balance.toLocaleString()}</td>
                          <td className="p-2 text-right">₹{parseFloat(v.total_revenue || '0').toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
