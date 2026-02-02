import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { ChartCard, ChartEmptyState } from '../shared/ChartCard';
import { ShareholderDistribution } from '@/lib/types';
import { formatCurrency } from '@/components/ui/premium-stats-card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { getMediaProxyUrl } from '@/lib/api';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShareholderPieChartProps {
  data: ShareholderDistribution[];
  loading?: boolean;
}

// Modern color palette
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#84cc16', // lime
  '#6366f1', // indigo
];

export function ShareholderPieChart({
  data,
  loading = false,
}: ShareholderPieChartProps) {
  const isMobile = useIsMobile();

  // Prepare chart data
  const chartData = data.map((item, index) => ({
    name: item.name,
    value: item.amount,
    percentage: item.share_percentage,
    color: COLORS[index % COLORS.length],
    phone: item.phone,
    logo_url: item.logo_url,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-sm">{item.name}</span>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              Share: <span className="font-medium text-foreground">{item.percentage}%</span>
            </p>
            <p className="text-muted-foreground">
              Amount: <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
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
            <span className="text-muted-foreground">
              {entry.value} ({chartData[index]?.percentage}%)
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render pie label
  const renderLabel = ({ name, percentage }: any) => {
    if (isMobile) return null;
    return `${percentage}%`;
  };

  return (
    <ChartCard
      title="Shareholder Distribution"
      description="Share distribution from system balance"
      loading={loading}
      minHeight={isMobile ? 280 : 350}
    >
      {chartData.length > 0 ? (
        <div className="space-y-4">
          <ResponsiveContainer width="100%" height={isMobile ? 220 : 280}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 50 : 70}
                outerRadius={isMobile ? 80 : 110}
                paddingAngle={2}
                dataKey="value"
                label={renderLabel}
                labelLine={!isMobile}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Shareholder list (mobile) */}
          {isMobile && (
            <div className="space-y-2">
              {chartData.slice(0, 5).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 rounded-lg bg-accent/30"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <Avatar className="h-7 w-7">
                      {item.logo_url ? (
                        <AvatarImage src={getMediaProxyUrl(item.logo_url)} />
                      ) : null}
                      <AvatarFallback className="text-xs bg-accent">
                        {item.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{item.percentage}%</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <ChartEmptyState message="No shareholder data available" />
      )}
    </ChartCard>
  );
}
