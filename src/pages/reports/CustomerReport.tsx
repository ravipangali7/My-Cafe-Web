import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateFilterButtons, DateFilterType, getDateRange } from '@/components/ui/date-filter-buttons';
import { FilterBar } from '@/components/ui/filter-bar';
import { PremiumStatsCards, formatCurrency, formatNumber } from '@/components/ui/premium-stats-card';
import { ChartCard } from '@/components/dashboard/shared/ChartCard';
import { RepeatCustomersTable } from '@/components/dashboard/vendor/RepeatCustomersTable';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { Users, UserPlus, Repeat, ShoppingBag, DollarSign } from 'lucide-react';
import type { RepeatCustomer } from '@/lib/types';
import { chartColors } from '@/lib/theme';

interface CustomerReportData {
  summary: {
    total_unique_customers: number;
    new_customers: number;
    repeat_customers: number;
    avg_orders_per_customer: number;
    total_customer_spend: string;
    start_date: string;
    end_date: string;
  };
  new_vs_returning_over_time: Array<{ date: string; new: number; returning: number }>;
  top_customers_by_spend: Array<{
    name: string;
    phone: string;
    total_spend: number;
    order_count: number;
  }>;
  customer_list: Array<{
    name: string;
    phone: string;
    country_code: string;
    order_count: number;
    total_spend: number;
    first_order_date: string | null;
    last_order_date: string | null;
  }>;
  repeat_customers: Array<{
    id: number;
    name: string;
    phone: string;
    country_code: string;
    order_count: number;
    total_spend: number;
  }>;
}

export function CustomerReport() {
  const { user } = useAuth();
  const defaultRange = getDateRange('week');
  const [startDate, setStartDate] = useState(defaultRange.startDate ?? '');
  const [endDate, setEndDate] = useState(defaultRange.endDate ?? '');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('week');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<CustomerReportData | null>(null);

  const generateReport = useCallback(async () => {
    if (!startDate || !endDate) {
      toast.error('Please select start and end dates');
      return;
    }
    setLoading(true);
    try {
      const params: Record<string, string | number> = { start_date: startDate, end_date: endDate };
      if (appliedUserId && user?.is_superuser) params.user_id = appliedUserId;
      const qs = api.buildQueryString(params);
      const response = await api.get<CustomerReportData>(`/api/reports/customers/${qs}`);
      if (response.error) {
        toast.error(response.error);
      } else if (response.data) {
        setReportData(response.data);
        toast.success('Customer report generated');
      }
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, appliedUserId, user?.is_superuser]);

  const handleDateFilterChange = (filter: DateFilterType, start?: string, end?: string) => {
    setDateFilter(filter);
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  };

  const handleApplyFilters = () => setAppliedUserId(userId);
  const handleClearFilters = () => {
    setUserId(null);
    setAppliedUserId(null);
  };

  const repeatCustomersAsType: RepeatCustomer[] = (reportData?.repeat_customers ?? []).map((c, i) => ({
    id: c.id || i,
    name: c.name,
    phone: c.phone,
    country_code: c.country_code || '91',
    order_count: c.order_count,
    total_spend: c.total_spend,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Date range for customer and order stats</CardDescription>
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
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Summary
            </h3>
            <PremiumStatsCards
              stats={[
                { label: 'Unique Customers', value: formatNumber(reportData.summary.total_unique_customers), icon: Users, variant: 'default' },
                { label: 'New Customers', value: formatNumber(reportData.summary.new_customers), icon: UserPlus, variant: 'info' },
                { label: 'Repeat Customers', value: formatNumber(reportData.summary.repeat_customers), icon: Repeat, variant: 'success' },
                { label: 'Avg Orders/Customer', value: String(reportData.summary.avg_orders_per_customer), icon: ShoppingBag, variant: 'default' },
                { label: 'Total Customer Spend', value: formatCurrency(parseFloat(reportData.summary.total_customer_spend || '0')), icon: DollarSign, variant: 'success' },
              ]}
              columns={4}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {reportData.new_vs_returning_over_time.length > 0 && (
              <ChartCard title="New vs Returning Over Time" description="Per day">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart
                    data={reportData.new_vs_returning_over_time.map((d) => ({
                      date: d.date,
                      new: d.new,
                      returning: d.returning,
                      total: d.new + d.returning,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="returning" stackId="1" stroke={chartColors[0]} fill={chartColors[0]} fillOpacity={0.6} name="Returning" />
                    <Area type="monotone" dataKey="new" stackId="1" stroke={chartColors[1]} fill={chartColors[1]} fillOpacity={0.6} name="New" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
            {reportData.top_customers_by_spend.length > 0 && (
              <ChartCard title="Top Customers by Spend" description="Top 15">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={reportData.top_customers_by_spend.slice(0, 10).map((c) => ({
                      name: (c.name || '—').length > 10 ? (c.name || '—').slice(0, 10) + '…' : c.name || '—',
                      spend: c.total_spend,
                    }))}
                    margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Spend']} />
                    <Bar dataKey="spend" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          <RepeatCustomersTable customers={repeatCustomersAsType} loading={false} />

          <Card>
            <CardHeader>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>All unique customers in period (name + phone)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-right p-2">Orders</th>
                      <th className="text-right p-2">Total Spend</th>
                      <th className="text-left p-2">First Order</th>
                      <th className="text-left p-2">Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.customer_list.map((c, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2 font-medium">{c.name}</td>
                        <td className="p-2">{c.country_code}{c.phone}</td>
                        <td className="p-2 text-right">{c.order_count}</td>
                        <td className="p-2 text-right text-green-600">₹{c.total_spend.toLocaleString()}</td>
                        <td className="p-2">{c.first_order_date ? new Date(c.first_order_date).toLocaleDateString() : '—'}</td>
                        <td className="p-2">{c.last_order_date ? new Date(c.last_order_date).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
