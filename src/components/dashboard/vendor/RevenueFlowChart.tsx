import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { ChartCard, ChartEmptyState } from '../shared/ChartCard';
import { PeriodSelector } from '../shared/PeriodSelector';
import { DashboardPeriod, RevenueTrendPoint } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';

interface RevenueFlowChartProps {
  data: {
    daily: RevenueTrendPoint[];
    weekly: RevenueTrendPoint[];
    monthly: RevenueTrendPoint[];
  };
  loading?: boolean;
}

export function RevenueFlowChart({ data, loading = false }: RevenueFlowChartProps) {
  const [period, setPeriod] = useState<DashboardPeriod>('daily');

  const currentData = data[period] || [];

  // Format data for chart
  const chartData = currentData.map((item) => ({
    date: formatDate(item.date, period),
    revenue: item.revenue,
    orders: item.orders,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p
              key={index}
              className="text-sm"
              style={{ color: entry.color }}
            >
              {entry.name}: {entry.name === 'Revenue' 
                ? formatCurrency(entry.value) 
                : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ChartCard
      title="Revenue Flow"
      description={`${period.charAt(0).toUpperCase() + period.slice(1)} revenue trends`}
      loading={loading}
      headerAction={
        <PeriodSelector value={period} onChange={setPeriod} />
      }
      minHeight={350}
    >
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactNumber(value)}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="orders"
              name="Orders"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmptyState message="No revenue data available for this period" />
      )}
    </ChartCard>
  );
}

// Helper to format date based on period
function formatDate(dateStr: string, period: DashboardPeriod): string {
  const date = new Date(dateStr);
  
  switch (period) {
    case 'daily':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'weekly':
      return `Week ${getWeekNumber(date)}`;
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    default:
      return dateStr;
  }
}

// Get week number
function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

// Format large numbers compactly
function formatCompactNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
