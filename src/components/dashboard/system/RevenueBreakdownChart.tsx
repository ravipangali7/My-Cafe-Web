import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard, ChartEmptyState } from '../shared/ChartCard';
import { RevenueBreakdown } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { useIsMobile } from '@/hooks/use-mobile';
import { revenueSourceColors } from '@/lib/theme';

interface RevenueBreakdownChartProps {
  data: RevenueBreakdown;
  loading?: boolean;
}

export function RevenueBreakdownChart({
  data,
  loading = false,
}: RevenueBreakdownChartProps) {
  const isMobile = useIsMobile();

  // Prepare chart data
  const chartData = [
    {
      name: 'QR Stand Orders',
      value: data.qr_stand_earnings,
      color: revenueSourceColors.qr_stand,
    },
    {
      name: 'Due Collection',
      value: data.due_collection,
      color: revenueSourceColors.due_collection,
    },
    {
      name: 'Subscription',
      value: data.subscription_earnings,
      color: revenueSourceColors.subscription,
    },
    {
      name: 'Transaction Fees',
      value: data.transaction_earnings,
      color: revenueSourceColors.transaction,
    },
    {
      name: 'WhatsApp Usage',
      value: data.whatsapp_earnings,
      color: revenueSourceColors.whatsapp,
    },
  ].filter(item => item.value > 0);

  // Calculate percentages
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const chartDataWithPercentage = chartData.map(item => ({
    ...item,
    percentage: total > 0 ? ((item.value / total) * 100).toFixed(1) : '0',
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-sm">{item.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Amount: <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
            </p>
            <p className="text-muted-foreground">
              Share: <span className="font-medium text-foreground">{item.percentage}%</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload?.map((entry: any, index: number) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-xs"
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground truncate max-w-[80px]">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <ChartCard
      title="Revenue Breakdown"
      description="Revenue sources distribution"
      loading={loading}
      minHeight={isMobile ? 280 : 350}
    >
      {chartDataWithPercentage.length > 0 ? (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <PieChart>
              <Pie
                data={chartDataWithPercentage}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 50 : 70}
                outerRadius={isMobile ? 80 : 110}
                paddingAngle={2}
                dataKey="value"
                label={isMobile ? undefined : ({ percentage }) => `${percentage}%`}
                labelLine={!isMobile}
              >
                {chartDataWithPercentage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Revenue breakdown list */}
          <div className="space-y-2">
            {chartDataWithPercentage.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-accent/30"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm font-medium">{item.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(item.value)}</p>
                  <p className="text-xs text-muted-foreground">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
            <span className="text-sm font-medium">Total Revenue</span>
            <span className="text-lg font-bold text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      ) : (
        <ChartEmptyState message="No revenue data available" />
      )}
    </ChartCard>
  );
}
