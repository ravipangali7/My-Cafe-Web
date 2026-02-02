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
import { FinancialTrendPoint } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { useIsMobile } from '@/hooks/use-mobile';

interface FinancialTrendsChartProps {
  data: FinancialTrendPoint[];
  loading?: boolean;
}

// Line colors
const LINE_COLORS = {
  income: '#10b981',    // green
  outgoing: '#ef4444',  // red
  profit: '#3b82f6',    // blue
  loss: '#f97316',      // orange
};

export function FinancialTrendsChart({
  data,
  loading = false,
}: FinancialTrendsChartProps) {
  const isMobile = useIsMobile();

  // Format data for chart
  const chartData = data.map((item) => ({
    date: formatDate(item.date),
    income: item.income,
    outgoing: item.outgoing,
    profit: item.profit,
    loss: item.loss,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <p
                key={index}
                className="text-sm flex items-center justify-between gap-4"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  {entry.name}:
                </span>
                <span className="font-medium" style={{ color: entry.color }}>
                  {formatCurrency(entry.value)}
                </span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {payload?.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-sm"
          >
            <span
              className="w-3 h-0.5 rounded"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ChartCard
      title="Financial Trends"
      description="Income, outgoing, profit, and loss over time"
      loading={loading}
      minHeight={isMobile ? 300 : 400}
    >
      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              interval={isMobile ? 'preserveStartEnd' : 0}
              angle={isMobile ? -45 : 0}
              textAnchor={isMobile ? 'end' : 'middle'}
              height={isMobile ? 60 : 30}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactNumber(value)}
              className="text-muted-foreground"
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} verticalAlign="top" height={36} />
            
            <Line
              type="monotone"
              dataKey="income"
              name="Income"
              stroke={LINE_COLORS.income}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="outgoing"
              name="Outgoing"
              stroke={LINE_COLORS.outgoing}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="profit"
              name="Profit"
              stroke={LINE_COLORS.profit}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="loss"
              name="Loss"
              stroke={LINE_COLORS.loss}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <ChartEmptyState message="No financial trend data available" />
      )}
    </ChartCard>
  );
}

// Format date helper
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format large numbers compactly
function formatCompactNumber(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)}Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)}L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
