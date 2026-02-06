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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, CreditCard, Clock, Receipt, TrendingUp } from 'lucide-react';
import { chartColors } from '@/lib/theme';

interface FinanceReportData {
  summary: {
    total_order_revenue: string;
    paid_order_revenue: string;
    pending_order_revenue: string;
    total_transactions: number;
    total_transaction_amount: string;
    start_date: string;
    end_date: string;
  };
  transactions_by_status: Array<{
    status: string;
    count: number;
    total_amount: string;
  }>;
  daily_breakdown: Array<{
    date: string;
    order_revenue: string;
    transaction_amount: string;
    orders_count: number;
    transactions_count: number;
  }>;
  detailed_transactions: Array<{
    id: number;
    order_id: number;
    amount: string;
    status: string;
    remarks: string | null;
    utr: string | null;
    vpa: string | null;
    payer_name: string | null;
    created_at: string;
  }>;
}

export function FinanceReport() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('all');
  const [userId, setUserId] = useState<number | null>(null);
  const [appliedUserId, setAppliedUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<FinanceReportData | null>(null);

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
      const response = await api.get<FinanceReportData>(`/api/reports/finance/${queryString}`);

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
                    { label: 'Total Order Revenue', value: formatCurrency(parseFloat(reportData.summary.total_order_revenue || '0')), icon: DollarSign, variant: 'default' },
                    { label: 'Paid Order Revenue', value: formatCurrency(parseFloat(reportData.summary.paid_order_revenue || '0')), icon: CreditCard, variant: 'success' },
                    { label: 'Pending Order Revenue', value: formatCurrency(parseFloat(reportData.summary.pending_order_revenue || '0')), icon: Clock, variant: 'warning' },
                    { label: 'Total Transactions', value: (reportData.summary.total_transactions || 0).toLocaleString(), icon: Receipt, variant: 'info' },
                    { label: 'Transaction Amount', value: formatCurrency(parseFloat(reportData.summary.total_transaction_amount || '0')), icon: TrendingUp, variant: 'success' },
                    {
                      label: 'Date Range',
                      value: reportData.summary.start_date && reportData.summary.end_date
                        ? `${new Date(reportData.summary.start_date).toLocaleDateString()} - ${new Date(reportData.summary.end_date).toLocaleDateString()}`
                        : '—',
                      icon: DollarSign,
                      variant: 'default',
                    },
                  ]}
                  columns={3}
                />
              </div>
              {reportData.daily_breakdown && reportData.daily_breakdown.length > 0 && (
                <ChartCard title="Daily Financial Breakdown" description="Order revenue and transaction amount per day">
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={reportData.daily_breakdown.map((d) => ({
                        date: d.date,
                        order_revenue: parseFloat(d.order_revenue || '0'),
                        transaction_amount: parseFloat(d.transaction_amount || '0'),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, '']} />
                      <Line type="monotone" dataKey="order_revenue" stroke={chartColors[0]} strokeWidth={2} dot={{ r: 3 }} name="Order Revenue" />
                      <Line type="monotone" dataKey="transaction_amount" stroke={chartColors[1]} strokeWidth={2} dot={{ r: 3 }} name="Transaction Amount" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Order Revenue</p>
                      <p className="text-2xl font-bold">₹{parseFloat(reportData.summary.total_order_revenue || '0').toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Order Revenue</p>
                      <p className="text-2xl font-bold text-green-600">₹{parseFloat(reportData.summary.paid_order_revenue || '0').toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Order Revenue</p>
                      <p className="text-2xl font-bold text-yellow-600">₹{parseFloat(reportData.summary.pending_order_revenue || '0').toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold">{reportData.summary.total_transactions || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction Amount</p>
                      <p className="text-2xl font-bold">₹{parseFloat(reportData.summary.total_transaction_amount || '0').toFixed(2)}</p>
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

          {/* Transactions by Status */}
          {reportData.transactions_by_status.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Transactions by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Status</th>
                        <th className="text-right p-2">Count</th>
                        <th className="text-right p-2">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.transactions_by_status.map((item, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{item.status || '—'}</td>
                          <td className="p-2 text-right">{item.count || 0}</td>
                          <td className="p-2 text-right">₹{parseFloat(item.total_amount || '0').toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Breakdown */}
          {reportData.daily_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Daily Financial Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Order Revenue</th>
                        <th className="text-right p-2">Transaction Amount</th>
                        <th className="text-right p-2">Orders</th>
                        <th className="text-right p-2">Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.daily_breakdown.map((day, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-2">{day.date ? new Date(day.date).toLocaleDateString() : '—'}</td>
                          <td className="p-2 text-right">₹{parseFloat(day.order_revenue || '0').toFixed(2)}</td>
                          <td className="p-2 text-right">₹{parseFloat(day.transaction_amount || '0').toFixed(2)}</td>
                          <td className="p-2 text-right">{day.orders_count || 0}</td>
                          <td className="p-2 text-right">{day.transactions_count || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Transactions */}
          {reportData.detailed_transactions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Detailed Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Order ID</th>
                        <th className="text-right p-2">Amount</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Remarks</th>
                        <th className="text-left p-2">UTR</th>
                        <th className="text-left p-2">VPA</th>
                        <th className="text-left p-2">Payer</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.detailed_transactions.map((transaction) => (
                        <tr key={transaction.id} className="border-b">
                          <td className="p-2">#{transaction.id}</td>
                          <td className="p-2 font-bold text-base">#{transaction.order_id || '—'}</td>
                          <td className="p-2 text-right">₹{parseFloat(transaction.amount || '0').toFixed(2)}</td>
                          <td className="p-2">{transaction.status || '—'}</td>
                          <td className="p-2">{transaction.remarks || '—'}</td>
                          <td className="p-2">{transaction.utr || '—'}</td>
                          <td className="p-2">{transaction.vpa || '—'}</td>
                          <td className="p-2">{transaction.payer_name || '—'}</td>
                          <td className="p-2">{transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : '—'}</td>
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
