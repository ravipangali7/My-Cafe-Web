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
import { Users, Wallet, Share2, ArrowDownCircle, Clock, Calendar } from 'lucide-react';
import { chartColors } from '@/lib/theme';

interface ShareholderReportData {
  summary: {
    total_shareholders: number;
    total_shareholder_balance: number;
    total_distributed: string;
    total_withdrawals: number;
    pending_withdrawals_count: number;
    pending_withdrawals_amount: number;
    next_distribution_day: number;
    start_date: string;
    end_date: string;
  };
  shareholder_distribution: Array<{
    id: number;
    name: string;
    phone: string;
    share_percentage: number;
    amount: number;
    balance: number;
    logo_url: string | null;
  }>;
  distribution_over_time: Array<{ date: string; total: string; count: number }>;
  withdrawals_over_time: Array<{ date: string; total: number; count: number }>;
  shareholders_list: Array<{
    id: number;
    name: string;
    phone: string;
    share_percentage: number;
    balance: number;
    total_received: string;
    total_withdrawn: number;
  }>;
  withdrawals_list: Array<{
    id: number;
    user_name: string;
    user_phone: string;
    amount: number;
    status: string;
    created_at: string;
  }>;
  distribution_history: Array<{
    date: string;
    total: number | string;
    breakdown: Array<{ user_id: number; amount: string }>;
  }>;
}

export function ShareholderReport() {
  const defaultRange = getDateRange('month');
  const [startDate, setStartDate] = useState(defaultRange.startDate ?? '');
  const [endDate, setEndDate] = useState(defaultRange.endDate ?? '');
  const [dateFilter, setDateFilter] = useState<DateFilterType>('month');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ShareholderReportData | null>(null);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const qs = api.buildQueryString(params);
      const response = await api.get<ShareholderReportData>(`/api/reports/shareholders/${qs}`);
      if (response.error) {
        toast.error(response.error);
      } else if (response.data) {
        setReportData(response.data);
        toast.success('Shareholder report generated');
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
          <CardDescription>Date range for distribution and withdrawals</CardDescription>
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
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              Summary
            </h3>
            <PremiumStatsCards
              stats={[
                { label: 'Total Shareholders', value: formatNumber(reportData.summary.total_shareholders), icon: Users, variant: 'default' },
                { label: 'Shareholder Balance', value: formatCurrency(reportData.summary.total_shareholder_balance), icon: Wallet, variant: 'success' },
                { label: 'Total Distributed (period)', value: formatCurrency(parseFloat(reportData.summary.total_distributed || '0')), icon: Share2, variant: 'highlight' },
                { label: 'Total Withdrawals', value: formatCurrency(reportData.summary.total_withdrawals), icon: ArrowDownCircle, variant: 'default' },
                { label: 'Pending Withdrawals', value: formatNumber(reportData.summary.pending_withdrawals_count), icon: Clock, variant: 'warning' },
                { label: 'Pending Amount', value: formatCurrency(reportData.summary.pending_withdrawals_amount), icon: Wallet, variant: 'warning' },
                { label: 'Next distribution day', value: `Day ${reportData.summary.next_distribution_day}`, icon: Calendar, variant: 'info' },
              ]}
              columns={4}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Shareholder Distribution" description="By share % / amount">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={reportData.shareholder_distribution.filter((s) => (s.amount || s.share_percentage) > 0)}
                    dataKey="share_percentage"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, share_percentage }) => `${name?.slice(0, 8)} ${share_percentage}%`}
                  >
                    {reportData.shareholder_distribution.map((_, index) => (
                      <Cell key={index} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, name: string, props: { payload: { amount: number } }) => [`${v}%`, `Amount: ₹${props.payload.amount?.toLocaleString() ?? 0}`]} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            {reportData.distribution_over_time.length > 0 && (
              <ChartCard title="Distribution Over Time" description="Amount distributed per date">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={reportData.distribution_over_time.map((d) => ({
                      date: d.date,
                      total: parseFloat(d.total || '0'),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Distributed']} />
                    <Bar dataKey="total" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}
          </div>

          {reportData.withdrawals_over_time.length > 0 && (
            <ChartCard title="Withdrawals Over Time" description="Approved withdrawals per date">
              <ResponsiveContainer width="100%" height={260}>
                <LineChart
                  data={reportData.withdrawals_over_time.map((d) => ({
                    date: d.date,
                    total: d.total,
                    count: d.count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="total" stroke={chartColors[1]} strokeWidth={2} dot={{ r: 3 }} name="Amount" />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Shareholders List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-right p-2">Share %</th>
                      <th className="text-right p-2">Balance</th>
                      <th className="text-right p-2">Total Received</th>
                      <th className="text-right p-2">Total Withdrawn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.shareholders_list.map((s) => (
                      <tr key={s.id} className="border-b">
                        <td className="p-2 font-medium">{s.name}</td>
                        <td className="p-2">{s.phone}</td>
                        <td className="p-2 text-right">{s.share_percentage}%</td>
                        <td className="p-2 text-right">₹{s.balance.toLocaleString()}</td>
                        <td className="p-2 text-right">₹{parseFloat(s.total_received || '0').toLocaleString()}</td>
                        <td className="p-2 text-right">₹{s.total_withdrawn.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Withdrawal Requests</CardTitle>
              <CardDescription>Recent withdrawal requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Shareholder</th>
                      <th className="text-left p-2">Phone</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.withdrawals_list.map((w) => (
                      <tr key={w.id} className="border-b">
                        <td className="p-2 font-medium">{w.user_name}</td>
                        <td className="p-2">{w.user_phone}</td>
                        <td className="p-2 text-right">₹{w.amount.toLocaleString()}</td>
                        <td className="p-2">{w.status}</td>
                        <td className="p-2">{w.created_at ? new Date(w.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {reportData.distribution_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribution History</CardTitle>
                <CardDescription>Recent distributions by date</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Date</th>
                        <th className="text-right p-2">Total</th>
                        <th className="text-left p-2">Breakdown</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.distribution_history.map((d, i) => (
                        <tr key={i} className="border-b">
                          <td className="p-2">{d.date}</td>
                          <td className="p-2 text-right">₹{Number(d.total).toLocaleString()}</td>
                          <td className="p-2 text-muted-foreground">{d.breakdown?.length ?? 0} entries</td>
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
